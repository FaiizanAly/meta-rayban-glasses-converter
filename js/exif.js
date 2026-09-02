/**
 * exif.js — EXIF metadata handling for Meta Glasses Photo Converter
 * Reads EXIF orientation, strips sensitive tags, and injects Meta-style metadata.
 * All piexifjs usage is isolated in this module.
 */
'use strict';

const ExifHandler = (() => {

  // ── Target metadata constants ──────────────────────────────────────
  const META_MAKE        = 'Meta AI';
  const META_MODEL       = 'Ray-Ban Meta Smart Glasses 2';
  const ORIENTATION_NORMAL = 1;
  const COLOR_SPACE_SRGB   = 1;
  const PIXEL_X            = 3024;
  const PIXEL_Y            = 4032;

  /**
   * Read EXIF orientation from a JPEG data URL.
   * Returns an integer 1–8 (defaults to 1 on error or missing data).
   * @param {string} dataUrl — JPEG data URL
   * @returns {number}
   */
  function readOrientation(dataUrl) {
    try {
      if (typeof piexif === 'undefined') return 1;
      const exifObj = piexif.load(dataUrl);
      const val = exifObj['0th'] && exifObj['0th'][piexif.ImageIFD.Orientation];
      return (val >= 1 && val <= 8) ? val : 1;
    } catch (_) {
      return 1;
    }
  }

  /**
   * Clean sensitive EXIF data and inject Meta-style metadata.
   * Safe to call on any JPEG data URL — gracefully handles missing/malformed EXIF.
   * @param {string} jpegDataUrl
   * @returns {string} Modified JPEG data URL
   */
  function cleanAndInject(jpegDataUrl) {
    try {
      if (typeof piexif === 'undefined') return jpegDataUrl;

      let exifObj;
      try {
        exifObj = piexif.load(jpegDataUrl);
      } catch (_) {
        exifObj = _createFreshExifObj();
      }

      // ── Strip sensitive data ──────────────────────────────────────

      // Wipe ALL GPS data
      exifObj['GPS'] = {};

      // Remove device-identifying 0th IFD tags
      _deleteTag(exifObj, '0th', piexif.ImageIFD.Software);
      _deleteTag(exifObj, '0th', piexif.ImageIFD.HostComputer);

      // Remove lens / maker info from Exif IFD
      if (!exifObj['Exif']) exifObj['Exif'] = {};
      _deleteTag(exifObj, 'Exif', piexif.ExifIFD.MakerNote);
      _deleteTag(exifObj, 'Exif', piexif.ExifIFD.LensMake);
      _deleteTag(exifObj, 'Exif', piexif.ExifIFD.LensModel);
      _deleteTag(exifObj, 'Exif', piexif.ExifIFD.LensSpecification);

      // ── Inject Meta-style metadata ────────────────────────────────
      exifObj['0th'][piexif.ImageIFD.Make]        = META_MAKE;
      exifObj['0th'][piexif.ImageIFD.Model]       = META_MODEL;
      exifObj['0th'][piexif.ImageIFD.Orientation]  = ORIENTATION_NORMAL;

      exifObj['Exif'][piexif.ExifIFD.ColorSpace]       = COLOR_SPACE_SRGB;
      exifObj['Exif'][piexif.ExifIFD.PixelXDimension]  = PIXEL_X;
      exifObj['Exif'][piexif.ExifIFD.PixelYDimension]  = PIXEL_Y;

      // Build EXIF byte string and insert into the JPEG data URL
      const exifBytes = piexif.dump(exifObj);
      return piexif.insert(exifBytes, jpegDataUrl);

    } catch (e) {
      // If anything goes wrong, return the image unmodified rather than crashing
      console.warn('[ExifHandler] EXIF processing failed — returning unmodified image:', e);
      return jpegDataUrl;
    }
  }

  // ── Internal helpers ───────────────────────────────────────────────

  /**
   * Safely delete a tag from an EXIF IFD.
   */
  function _deleteTag(exifObj, ifd, tag) {
    if (exifObj[ifd] && tag in exifObj[ifd]) {
      delete exifObj[ifd][tag];
    }
  }

  /**
   * Create a minimal fresh EXIF object with Meta-style metadata pre-filled.
   */
  function _createFreshExifObj() {
    const obj = {
      '0th':      {},
      'Exif':     {},
      'GPS':      {},
      '1st':      {},
      'thumbnail': null,
    };
    obj['0th'][piexif.ImageIFD.Make]        = META_MAKE;
    obj['0th'][piexif.ImageIFD.Model]       = META_MODEL;
    obj['0th'][piexif.ImageIFD.Orientation]  = ORIENTATION_NORMAL;
    obj['Exif'][piexif.ExifIFD.ColorSpace]       = COLOR_SPACE_SRGB;
    obj['Exif'][piexif.ExifIFD.PixelXDimension]  = PIXEL_X;
    obj['Exif'][piexif.ExifIFD.PixelYDimension]  = PIXEL_Y;
    return obj;
  }

  // Public API
  return {
    readOrientation,
    cleanAndInject,
  };
})();
