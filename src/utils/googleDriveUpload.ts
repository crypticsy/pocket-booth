// Google Drive upload utility for Vercel backend
import { createPhotoStripCanvas } from './photostrip';

// Configuration - you can set this via environment variable
const VERCEL_API_URL = import.meta.env.VITE_VERCEL_API_URL || '';

export interface UploadResponse {
  success: boolean;
  file_id?: string;
  file_name?: string;
  web_view_link?: string;
  message?: string;
  error?: string;
}

/**
 * Upload a single image to Google Drive via Vercel backend
 * The backend handles all OAuth authorization - no frontend auth needed
 * @param imageDataUrl - Base64 encoded image data URL (e.g., from canvas.toDataURL())
 * @param filename - Filename to use for the upload
 * @param key - Optional key name for multi-account support
 * @returns Upload response with file details or error
 */
export async function uploadImageToGoogleDrive(
  imageDataUrl: string,
  filename: string,
  key?: string | null
): Promise<UploadResponse> {
  if (!VERCEL_API_URL) {
    return {
      success: false,
      error: 'Google Drive upload not configured. Set VITE_VERCEL_API_URL environment variable.',
    };
  }

  try {
    const response = await fetch(`${VERCEL_API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageDataUrl,
        filename: filename,
        key: key || undefined,  // Send key to backend for account selection
      }),
    });

    const data: UploadResponse = await response.json();

    if (!response.ok) {
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
 * @param key - Optional key name for multi-account support
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
 * Helper to check if uploads are configured
 */
export function isUploadConfigured(): boolean {
  return !!VERCEL_API_URL;
}
