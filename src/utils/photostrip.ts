export const createPhotoStripCanvas = async (
  photos: string[],
  date?: string,
  bg: string = "#ffffff",
  textColor: string = "#8b7d6e",
  canvasRef?: HTMLCanvasElement
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (photos.length === 0) {
      reject(new Error('No photos provided'));
      return;
    }

    const canvas = canvasRef || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const photoSize = 560;
    const paddingH = 36;
    const paddingTop = 36;
    const gap = 12;
    const textAreaHeight = 52;
    const paddingBottom = 36 + textAreaHeight;
    const numPhotos = photos.length;

    const totalWidth = photoSize + paddingH * 2;
    const totalPhotoHeight = photoSize * numPhotos + gap * (numPhotos - 1);
    const totalHeight = paddingTop + totalPhotoHeight + paddingBottom;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Strip background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    let loadedImages = 0;

    const drawText = () => {
      const label = date
        ? `POCKET BOOTH · ${date.toUpperCase()}`
        : 'POCKET BOOTH';
      const textY = paddingTop + totalPhotoHeight + 42;

      ctx.fillStyle = textColor;
      ctx.font = '500 22px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      try {
        (ctx as any).letterSpacing = '0.14em';
      } catch {}
      ctx.fillText(label, totalWidth / 2, textY);
    };

    photos.forEach((photoUrl, index) => {
      const img = new window.Image();
      img.src = photoUrl;
      img.onload = () => {
        const yPos = paddingTop + index * (photoSize + gap);
        ctx.drawImage(img, paddingH, yPos, photoSize, photoSize);
        loadedImages++;

        if (loadedImages === photos.length) {
          drawText();
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
 */
export const downloadPhotoStrip = async (
  photos: string[],
  filename: string,
  date?: string,
  bg?: string,
  textColor?: string
): Promise<boolean> => {
  try {
    const dataUrl = await createPhotoStripCanvas(photos, date, bg, textColor);

    if (isInstagramBrowser()) {
      return false;
    }

    if (isRestrictedBrowser()) {
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
                  background: #fdf8f1;
                  color: #1c1510;
                  text-align: center;
                }
                img {
                  max-width: 300px;
                  height: auto;
                  margin: 20px auto;
                  display: block;
                  box-shadow: 0 8px 32px rgba(28,21,16,0.15);
                  border-radius: 4px;
                }
                .instructions {
                  background: #f5ede0;
                  padding: 15px;
                  border-radius: 12px;
                  margin: 20px auto;
                  max-width: 400px;
                  color: #8b7d6e;
                }
                .download-btn {
                  display: inline-block;
                  padding: 12px 24px;
                  background: #c4916c;
                  color: white;
                  text-decoration: none;
                  border-radius: 9999px;
                  font-weight: 600;
                  margin: 10px;
                }
              </style>
            </head>
            <body>
              <h1 style="font-family: serif; color: #1c1510;">Your Photo Strip</h1>
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
        attemptDirectDownload(dataUrl, filename);
        return true;
      }
    } else {
      attemptDirectDownload(dataUrl, filename);
      return true;
    }
  } catch (error) {
    console.error('Failed to download photo strip:', error);
    alert('Failed to download photo. Please try again.');
    return false;
  }
};

const attemptDirectDownload = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
};
