// Google Drive upload utility backed by a Google Apps Script Web App
import { createPhotoStripCanvas } from './photostrip';
import { getAppsScriptURL } from './configManager';

export interface UploadResponse {
  success: boolean;
  file_id?: string;
  file_name?: string;
  web_view_link?: string;
  error?: string;
}

/**
 * Upload a single image to Google Drive via the key's Apps Script deployment.
 * Content-Type is text/plain to keep this a CORS-simple request — Apps Script
 * web apps don't support handling a preflight OPTIONS request.
 * @param imageDataUrl - Base64 encoded image data URL (e.g., from canvas.toDataURL())
 * @param filename - Filename to use for the upload
 * @param key - Config key selecting which Apps Script deployment to use
 * @returns Upload response with file details or error
 */
export async function uploadImageToGoogleDrive(
  imageDataUrl: string,
  filename: string,
  key?: string | null
): Promise<UploadResponse> {
  const scriptURL = getAppsScriptURL(key);
  if (!scriptURL) {
    return {
      success: false,
      error: 'Google Drive upload not configured. Set VITE_APPS_SCRIPT_URL_<KEY>.',
    };
  }

  try {
    const response = await fetch(scriptURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        image: imageDataUrl,
        filename: filename,
      }),
    });

    const data: UploadResponse = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Upload failed',
      };
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Upload photo strip to Google Drive as a single combined image
 * @param images - Array of base64 encoded image data URLs
 * @param baseFilename - Base filename for the photo strip
 * @param key - Config key selecting which Apps Script deployment to use
 * @returns Upload response
 */
export async function uploadPhotoStripToGoogleDrive(
  images: string[],
  baseFilename: string,
  key?: string | null
): Promise<UploadResponse> {
  try {
    // Create the photo strip canvas (combines all photos into one image)
    const photoStripDataUrl = await createPhotoStripCanvas(images);

    // Remove extension from base filename if present, add .jpg
    const filenameWithoutExt = baseFilename.replace(/\.[^/.]+$/, '');
    const filename = `${filenameWithoutExt}.jpg`;

    // Upload the single combined photo strip
    const result = await uploadImageToGoogleDrive(photoStripDataUrl, filename, key);

    return result;
  } catch (error) {
    console.error('Failed to create photo strip:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create photo strip'
    };
  }
}

/**
 * Helper to check if uploads are configured for the given key
 */
export function isUploadConfigured(key?: string | null): boolean {
  return !!getAppsScriptURL(key);
}
