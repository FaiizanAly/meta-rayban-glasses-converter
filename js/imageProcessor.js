/**
 * imageProcessor.js — Image processing pipeline for Meta Glasses Photo Converter
 * Handles validation, orientation correction, aspect-ratio-preserving resize,
 * and JPEG conversion.
 */
'use strict';

const ImageProcessor = (() => {

  // ── Constants ──────────────────────────────────────────────────────
  const OUTPUT_WIDTH   = 3024;
  const OUTPUT_HEIGHT  = 4032;
  const JPEG_QUALITY   = 0.95;
  const MAX_FILE_SIZE  = 50 * 1024 * 1024;  // 50 MB — warn above this

  /** MIME types we can reliably decode via <img> / Canvas. */
  const SUPPORTED_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/avif',
  ]);

  /** HEIC / HEIF — not natively supported in most desktop browsers. */
  const HEIC_EXTENSIONS = new Set(['heic', 'heif']);

  /**
   * Detect whether the browser auto-applies EXIF orientation when drawing
   * images to <canvas>.  Modern browsers (Chrome 81+, FF 77+, Safari 13.1+)
   * do this automatically.  When true we must NOT manually rotate or we
   * will double-rotate.
   */
  const BROWSER_AUTO_ORIENTS = (() => {
    try {
      return CSS.supports('image-orientation', 'from-image');
    } catch (_) {
      return false;
    }
  })();

  // ── Validation ─────────────────────────────────────────────────────

  /**
   * Validate an image file before processing.
   * @param {File} file
   * @returns {{valid: boolean, error?: string, warning?: string}}
   */
  function validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }

    const ext = AppUtils.getFileExtension(file.name);

    // HEIC / HEIF detection
    if (
      file.type === 'image/heic' || file.type === 'image/heif' ||
      HEIC_EXTENSIONS.has(ext)
    ) {
      return {
        valid: false,
        error: 'HEIC/HEIF format is not supported by your browser. Please convert the image to JPEG or PNG first.',
      };
    }

    // Must be an image MIME type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'The selected file is not a recognised image.' };
    }

    // Must be in the supported set (browsers may still try others, but
    // we only guarantee these)
    if (!SUPPORTED_TYPES.has(file.type)) {
      return { valid: false, error: 'Unsupported image format: ' + AppUtils.getFormatName(file.type) + '.' };
    }

    // Large-file warning
    let warning = null;
    if (file.size > MAX_FILE_SIZE) {
      warning = 'This is a very large file (' + AppUtils.formatFileSize(file.size) + '). Processing may be slow on some devices.';
    }

    return { valid: true, warning };
  }

  // ── Image loading ──────────────────────────────────────────────────

  /**
   * Load an image element from a URL (data URL, Object URL, or http URL).
   * Rejects if the image cannot be decoded.
   * @param {string} src
   * @returns {Promise<HTMLImageElement>}
   */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new Error('This image could not be decoded. It may be corrupted.'));
        } else {
          resolve(img);
        }
      };
      img.onerror = () => reject(new Error('This image could not be decoded.'));
      img.src = src;
    });
  }

  // ── Orientation correction ─────────────────────────────────────────

  /**
   * Physically rotate / flip an image according to an EXIF orientation value.
   * Returns a new canvas containing the corrected pixels at the image's
   * natural dimensions.
   *
   * Only call this when the browser does NOT auto-apply orientation.
   * @param {HTMLImageElement} image
   * @param {number} orientation  1–8
   * @returns {HTMLCanvasElement}
   */
  function normalizeOrientation(image, orientation) {
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Orientations 5–8 swap the width and height of the output
    const swapped = orientation >= 5 && orientation <= 8;
    canvas.width  = swapped ? h : w;
    canvas.height = swapped ? w : h;

    switch (orientation) {
      case 2: ctx.setTransform(-1, 0, 0, 1, w, 0); break;
      case 3: ctx.setTransform(-1, 0, 0, -1, w, h); break;
      case 4: ctx.setTransform(1, 0, 0, -1, 0, h); break;
      case 5: ctx.setTransform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.setTransform(0, 1, -1, 0, h, 0); break;
      case 7: ctx.setTransform(0, -1, -1, 0, h, w); break;
      case 8: ctx.setTransform(0, -1, 1, 0, 0, w); break;
      default: ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    ctx.drawImage(image, 0, 0, w, h);
    return canvas;
  }

  // ── Canvas rendering ───────────────────────────────────────────────

  /**
   * Render a source (canvas or image) into a new canvas at the target
   * dimensions using a centre-crop (cover) strategy.
   *
   * • Preserves aspect ratio — never stretches.
   * • Fills the canvas with white first so PNG/WebP transparency gets a
   *   neutral background in the JPEG output.
   *
   * @param {HTMLCanvasElement|HTMLImageElement} source
   * @param {number} targetW
   * @param {number} targetH
   * @returns {HTMLCanvasElement}
   */
  function renderToCanvas(source, targetW, targetH) {
    targetW = targetW || OUTPUT_WIDTH;
    targetH = targetH || OUTPUT_HEIGHT;

    const canvas = document.createElement('canvas');
    canvas.width  = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // White background — handles transparency in source PNGs / WebPs
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    // Source dimensions
    const srcW = source.width  || source.naturalWidth;
    const srcH = source.height || source.naturalHeight;

    // Cover-crop calculation
    const targetRatio = targetW / targetH;   // 0.75 for 3024×4032
    const srcRatio    = srcW / srcH;

    let cropW, cropH, offsetX, offsetY;

    if (srcRatio > targetRatio) {
      // Source is wider than target → crop left/right
      cropH   = srcH;
      cropW   = srcH * targetRatio;
      offsetX = (srcW - cropW) / 2;
      offsetY = 0;
    } else {
      // Source is taller (or equal) → crop top/bottom
      cropW   = srcW;
      cropH   = srcW / targetRatio;
      offsetX = 0;
      offsetY = (srcH - cropH) / 2;
    }

    ctx.imageSmoothingEnabled = true;
    if (ctx.imageSmoothingQuality) {
      ctx.imageSmoothingQuality = 'high';
    }

    ctx.drawImage(
      source,
      offsetX, offsetY, cropW, cropH,   // source rectangle (crop area)
      0, 0, targetW, targetH             // destination (full canvas)
    );

    return canvas;
  }

  // ── JPEG export ────────────────────────────────────────────────────

  /**
   * Export a canvas as a JPEG Blob.
   * @param {HTMLCanvasElement} canvas
   * @param {number} quality  0–1
   * @returns {Promise<Blob>}
   */
  function canvasToJpegBlob(canvas, quality) {
    quality = quality != null ? quality : JPEG_QUALITY;
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('JPEG encoding failed.')),
        'image/jpeg',
        quality
      );
    });
  }

  // ── Full pipeline ──────────────────────────────────────────────────

  /**
   * Run the complete conversion pipeline on an image file.
   *
   * @param {File}     file        Source image file
   * @param {Function} onProgress  Callback (step:number, message:string)
   * @returns {Promise<{blob:Blob, dataUrl:string, base64:string, width:number, height:number, size:number}>}
   */
  async function processImage(file, onProgress) {
    onProgress = onProgress || function () {};

    // 1 — Read EXIF orientation (JPEG only)
    onProgress(1, 'Preparing image\u2026');
    let orientation = 1;
    if (file.type === 'image/jpeg') {
      try {
        onProgress(2, 'Reading EXIF data\u2026');
        const srcDataUrl = await AppUtils.blobToDataUrl(file);
        orientation = ExifHandler.readOrientation(srcDataUrl);
      } catch (_) {
        orientation = 1;
      }
    }

    // 2 — Load the image
    onProgress(3, 'Correcting orientation\u2026');
    const objectUrl = URL.createObjectURL(file);
    let image;
    try {
      image = await loadImage(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    // 3 — Orientation correction
    // Skip if browser already auto-corrected or orientation is normal
    const needsManual = !BROWSER_AUTO_ORIENTS && orientation > 1;
    const corrected = needsManual
      ? normalizeOrientation(image, orientation)
      : image;   // image element works directly with renderToCanvas

    // 4 — Centre-crop to 3024 × 4032
    onProgress(4, 'Rendering to canvas\u2026');
    const outputCanvas = renderToCanvas(corrected, OUTPUT_WIDTH, OUTPUT_HEIGHT);

    // Free intermediate canvas memory
    if (corrected !== image && corrected.width) {
      corrected.width = 0;
      corrected.height = 0;
    }

    // 5 — Export to JPEG
    onProgress(5, 'Converting to JPEG\u2026');
    const jpegDataUrl = outputCanvas.toDataURL('image/jpeg', JPEG_QUALITY);

    // Free the output canvas
    outputCanvas.width = 0;
    outputCanvas.height = 0;

    // 6 — EXIF clean + inject
    onProgress(6, 'Applying metadata\u2026');
    const finalDataUrl = ExifHandler.cleanAndInject(jpegDataUrl);

    // 7 — Final blob
    onProgress(7, 'Finalizing\u2026');
    const finalBlob  = AppUtils.dataUrlToBlob(finalDataUrl);
    const pureBase64 = finalDataUrl.split(',')[1];

    return {
      blob:    finalBlob,
      dataUrl: finalDataUrl,
      base64:  pureBase64,
      width:   OUTPUT_WIDTH,
      height:  OUTPUT_HEIGHT,
      size:    finalBlob.size,
    };
  }

  // ── Public API ─────────────────────────────────────────────────────
  return {
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT,
    JPEG_QUALITY,
    SUPPORTED_TYPES,
    BROWSER_AUTO_ORIENTS,
    validateFile,
    loadImage,
    normalizeOrientation,
    renderToCanvas,
    canvasToJpegBlob,
    processImage,
  };
})();
