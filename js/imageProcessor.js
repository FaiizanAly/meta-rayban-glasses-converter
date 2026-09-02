/**
 * imageProcessor.js — Image loading, orientation correction, canvas conversion
 */

import { readOrientation, buildExif, dumpExif, insertExif } from './exif.js';

/**
 * Draw image onto canvas with EXIF orientation correction
 * Outputs at targetW × targetH (3024 × 4032)
 */
export function drawCorrected(dataUrl, targetW, targetH, orientation) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const rotate90 = orientation >= 5 && orientation <= 8;
      canvas.width = rotate90 ? targetH : targetW;
      canvas.height = rotate90 ? targetW : targetH;
      const ctx = canvas.getContext("2d");

      switch (orientation) {
        case 2: ctx.setTransform(-1, 0, 0, 1, targetW, 0); break;
        case 3: ctx.setTransform(-1, 0, 0, -1, targetW, targetH); break;
        case 4: ctx.setTransform(1, 0, 0, -1, 0, targetH); break;
        case 5: ctx.setTransform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.setTransform(0, 1, -1, 0, targetH, 0); break;
        case 7: ctx.setTransform(0, -1, -1, 0, targetH, targetW); break;
        case 8: ctx.setTransform(0, -1, 1, 0, 0, targetW); break;
        default: ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Full conversion pipeline:
 * 1. Read orientation from source EXIF
 * 2. Draw corrected 3024×4032 canvas
 * 3. Build + inject Meta AI EXIF
 * 4. Return finalDataUrl and pureBase64
 */
export async function convertImage(sourceDataUrl) {
  const orientation = readOrientation(sourceDataUrl);
  const corrected = await drawCorrected(sourceDataUrl, 3024, 4032, orientation);
  const exif = buildExif(sourceDataUrl);
  const exifBytes = dumpExif(exif);
  const finalDataUrl = insertExif(exifBytes, corrected);
  const pureBase64 = finalDataUrl.split(",")[1];
  return { finalDataUrl, pureBase64 };
}
