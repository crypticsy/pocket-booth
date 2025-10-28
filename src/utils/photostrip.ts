export const createPhotoStripCanvas = async (
  photos: string[],
  canvasRef?: HTMLCanvasElement
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = canvasRef || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const outerBorder = 40;
    const photoBorder = 15;
    const photoSize = 400;
    const numPhotos = photos.length;
    const totalPhotoHeight = photoSize * numPhotos;
    const totalBorderHeight = photoBorder * (numPhotos - 1);
    const totalWidth = photoSize + (outerBorder * 2);
    const totalHeight = totalPhotoHeight + totalBorderHeight + (outerBorder * 2);

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    let loadedImages = 0;

    photos.forEach((photoUrl, index) => {
      const img = new window.Image();
      img.src = photoUrl;
      img.onload = () => {
        const yPos = outerBorder + (index * (photoSize + photoBorder));
        ctx.drawImage(img, outerBorder, yPos, photoSize, photoSize);
        loadedImages++;

        if (loadedImages === photos.length) {
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  });
};

/**
 * Detects if the current browser is Instagram's in-app browser
 */
export const isInstagramBrowser = (): boolean => {
  const userAgent = navigator.userAgent || '';
  return userAgent.includes('Instagram');
};

/**
 * Detects if the current browser is Instagram's in-app browser or Brave
 */
const isRestrictedBrowser = (): boolean => {
  const userAgent = navigator.userAgent || '';
  const isInstagram = userAgent.includes('Instagram');
  const isBrave = (navigator as any).brave !== undefined;
  return isInstagram || isBrave;
};

/**
 * Downloads a photo strip. Falls back to opening in a new tab for restricted browsers.
 * Returns true if download was attempted, false if user needs to take action
 */
export const downloadPhotoStrip = async (photos: string[], filename: string): Promise<boolean> => {
  try {
    const dataUrl = await createPhotoStripCanvas(photos);

    // Check if we're in Instagram browser - it blocks both downloads and popups
    if (isInstagramBrowser()) {
      // Return false to indicate the app should show instructions to open in regular browser
      return false;
    }

    // Check if we're in a restricted browser (like Brave)
    if (isRestrictedBrowser()) {
      // For Brave and other restricted browsers, open in new tab with instructions
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${filename}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: system-ui, -apple-system, sans-serif;
                  background: #000;
                  color: #fff;
                  text-align: center;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  margin: 20px auto;
                  display: block;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }
                .instructions {
                  background: rgba(255,255,255,0.1);
                  padding: 15px;
                  border-radius: 8px;
                  margin: 20px auto;
                  max-width: 400px;
                }
                .download-btn {
                  display: inline-block;
                  padding: 12px 24px;
                  background: #fff;
                  color: #000;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  margin: 10px;
                }
              </style>
            </head>
            <body>
              <h1>Your Photo Strip</h1>
              <img src="${dataUrl}" alt="${filename}" />
              <div class="instructions">
                <p><strong>To save your photo:</strong></p>
                <p>Long press the image above and select "Save Image" or "Download Image"</p>
                <a href="${dataUrl}" download="${filename}" class="download-btn">Or Click Here to Download</a>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
        return true;
      } else {
        // If popup was blocked, try direct download anyway
        attemptDirectDownload(dataUrl, filename);
        return true;
      }
    } else {
      // For normal browsers, use direct download
      attemptDirectDownload(dataUrl, filename);
      return true;
    }
  } catch (error) {
    console.error('Failed to download photo strip:', error);
    alert('Failed to download photo. Please try again.');
    return false;
  }
};

/**
 * Attempts a direct download using a temporary link element
 */
const attemptDirectDownload = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.style.display = 'none';

  // Add to document, click, and remove
  document.body.appendChild(link);
  link.click();

  // Clean up after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
};
