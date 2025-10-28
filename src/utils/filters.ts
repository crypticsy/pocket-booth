// Image filter utilities

export type FilterType = 'normal' | 'blackAndWhite' | 'cute' | 'film';

export const FILTERS = {
  normal: {
    name: 'Normal',
    cssFilter: 'none',
  },
  blackAndWhite: {
    name: 'Black & White',
    cssFilter: 'grayscale(100%)',
  },
  cute: {
    name: 'Cute',
    cssFilter: 'brightness(1.15) contrast(0.95) saturate(1.1) blur(0.5px) sepia(15%) hue-rotate(320deg)',
  },
  film: {
    name: 'Film',
    cssFilter: 'sepia(25%) hue-rotate(60deg) saturate(120%) contrast(1.05) blur(0.5px)',
  },
} as const;

/**
 * Apply blur effect to a canvas using box blur algorithm
 */
const applyBlur = (canvas: HTMLCanvasElement, radius: number): void => {
  if (radius === 0) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Try using ctx.filter first (modern browsers)
  try {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(canvas, 0, 0);

    // Apply blur using CSS filter on the context
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
  } catch (error) {
    console.warn('Canvas blur not supported, skipping blur effect');
  }
};

/**
 * Add film grain effect to canvas
 */
const addFilmGrain = (canvas: HTMLCanvasElement, intensity: number = 0.15): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Add grain to each pixel
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * intensity * 255;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }

  ctx.putImageData(imageData, 0, 0);
};

/**
 * Apply filter to a canvas context
 * This function processes the image data directly for more control
 */
export const applyCanvasFilter = (
  canvas: HTMLCanvasElement,
  filter: FilterType
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (filter) {
    case 'blackAndWhite':
      // Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);
      // Skip blur for now to test if color transformations work
      // applyBlur(canvas, 1);
      break;

    case 'cute':
      // Cute filter: brighter, pinkish, smooth, less blemishes
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brighten (15% brighter)
        r = r * 1.15;
        g = g * 1.15;
        b = b * 1.15;

        // Add pinkish tone (boost red, reduce green slightly)
        r = r * 1.08;
        g = g * 0.98;
        b = b * 1.02;

        // Slight sepia for warmth
        const sepiaR = (r * 0.393 + g * 0.769 + b * 0.189) * 0.15 + r * 0.85;
        const sepiaG = (r * 0.349 + g * 0.686 + b * 0.168) * 0.15 + g * 0.85;
        const sepiaB = (r * 0.272 + g * 0.534 + b * 0.131) * 0.15 + b * 0.85;

        // Reduce contrast slightly for smoother look
        const contrast = 0.95;
        const finalR = ((sepiaR - 128) * contrast) + 128;
        const finalG = ((sepiaG - 128) * contrast) + 128;
        const finalB = ((sepiaB - 128) * contrast) + 128;

        data[i] = Math.min(255, Math.max(0, finalR));
        data[i + 1] = Math.min(255, Math.max(0, finalG));
        data[i + 2] = Math.min(255, Math.max(0, finalB));
      }
      ctx.putImageData(imageData, 0, 0);
      // Apply stronger blur for cute filter
      applyBlur(canvas, 2);
      break;

    case 'film':
      // Film filter: greenish tint with grain
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Apply sepia base
        const sepiaR = (r * 0.393 + g * 0.769 + b * 0.189);
        const sepiaG = (r * 0.349 + g * 0.686 + b * 0.168);
        const sepiaB = (r * 0.272 + g * 0.534 + b * 0.131);

        // Shift towards green (reduce red, boost green)
        const filmR = sepiaR * 0.85;
        const filmG = sepiaG * 1.15;
        const filmB = sepiaB * 0.90;

        // Increase saturation slightly
        const gray = 0.2989 * filmR + 0.5870 * filmG + 0.1140 * filmB;
        const satR = gray + (filmR - gray) * 1.2;
        const satG = gray + (filmG - gray) * 1.2;
        const satB = gray + (filmB - gray) * 1.2;

        // Slight contrast boost
        const finalR = ((satR - 128) * 1.05) + 128;
        const finalG = ((satG - 128) * 1.05) + 128;
        const finalB = ((satB - 128) * 1.05) + 128;

        data[i] = Math.min(255, Math.max(0, finalR));
        data[i + 1] = Math.min(255, Math.max(0, finalG));
        data[i + 2] = Math.min(255, Math.max(0, finalB));
      }
      ctx.putImageData(imageData, 0, 0);
      // Apply blur before grain
      applyBlur(canvas, 0.5);
      addFilmGrain(canvas, 0.12); // Add subtle grain
      break;

    case 'normal':
    default:
      // For normal, just apply minimal processing
      ctx.putImageData(imageData, 0, 0);
      return;
  }
};

/**
 * Get CSS filter string for a given filter type
 * Useful for applying filters to video elements in real-time
 */
export const getCSSFilter = (filter: FilterType): string => {
  return FILTERS[filter].cssFilter;
};

/**
 * Get filter name for display
 */
export const getFilterName = (filter: FilterType): string => {
  return FILTERS[filter].name;
};
