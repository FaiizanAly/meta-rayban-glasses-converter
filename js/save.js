/**
 * save.js — Save/Share/Download functionality
 * Web Share API, Blob download fallback, Save to Gallery
 */

import { dataUrlToBlob } from './utils.js';

/**
 * Save or share image via Web Share API or download fallback
 * Used by the existing Save / Share button
 */
export async function saveOrShareImage(dataUrl, filename = "meta-glasses-converted.jpg") {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], filename, { type: "image/jpeg" });

  // 1. Mobile Web Share (Native Camera Roll / Save Image on iOS & Android)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Meta Glasses Photo",
        text: "Converted Ray-Ban Meta Glasses 3024×4032"
      });
      return { method: "share" };
    } catch (err) {
      if (err.name === "AbortError") return { method: "cancelled" };
    }
  }

  // 2. Blob Download fallback
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
    a.remove();
  }, 4000);
  return { method: "download" };
}

/**
 * Save to Gallery — dedicated gallery save via Web Share API or download fallback
 * Returns { method: "share" | "download" | "cancelled" }
 */
export async function saveToGallery(dataUrl) {
  const filename = "meta-glasses-converted.jpg";
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], filename, { type: "image/jpeg" });

  // Try Web Share API with file (mobile: Android / iOS)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return { method: "share" };
    } catch (err) {
      if (err.name === "AbortError") {
        return { method: "cancelled" };
      }
      // Other share error — fall through to download
    }
  }

  // Desktop / fallback: direct download
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
    a.remove();
  }, 4000);
  return { method: "download" };
}
