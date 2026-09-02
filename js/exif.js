/**
 * exif.js — EXIF reading, orientation detection, cleanup, and Meta AI injection
 * Uses piexif.js loaded globally via CDN
 */

const piexif = window.piexif;

/**
 * Read EXIF orientation from a data URL
 */
export function readOrientation(dataUrl) {
  try {
    const exif = piexif.load(dataUrl);
    return exif["0th"][piexif.ImageIFD.Orientation] || 1;
  } catch (e) {
    return 1;
  }
}

/**
 * Build Meta AI EXIF data from a source data URL
 * Cleans unwanted tags, injects Ray-Ban Meta Smart Glasses 2 metadata
 */
export function buildExif(dataUrl) {
  let exif;
  try {
    exif = piexif.load(dataUrl);
  } catch (e) {
    exif = { "0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": null };
  }

  exif["GPS"] = {};
  delete exif["0th"][piexif.ImageIFD.Software];
  delete exif["0th"][piexif.ImageIFD.HostComputer];

  delete exif["Exif"][piexif.ExifIFD.MakerNote];
  delete exif["Exif"][piexif.ExifIFD.LensMake];
  delete exif["Exif"][piexif.ExifIFD.LensModel];
  delete exif["Exif"][piexif.ExifIFD.LensSpecification];

  exif["0th"][piexif.ImageIFD.Make] = "Meta AI";
  exif["0th"][piexif.ImageIFD.Model] = "Ray-Ban Meta Smart Glasses 2";
  exif["0th"][piexif.ImageIFD.Orientation] = 1;
  exif["Exif"][piexif.ExifIFD.ColorSpace] = 1;
  exif["Exif"][piexif.ExifIFD.PixelXDimension] = 3024;
  exif["Exif"][piexif.ExifIFD.PixelYDimension] = 4032;
  return exif;
}

/**
 * Dump EXIF object to binary bytes
 */
export function dumpExif(exif) {
  return piexif.dump(exif);
}

/**
 * Insert EXIF bytes into a JPEG data URL
 */
export function insertExif(exifBytes, dataUrl) {
  return piexif.insert(exifBytes, dataUrl);
}
