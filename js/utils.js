/**
 * utils.js — Utility functions for Meta Glasses Photo Converter
 * Handles clipboard, download, share, and data conversion helpers.
 */
'use strict';

const AppUtils = (() => {

  /**
   * Format bytes into a human-readable string (e.g. "2.4 MB").
   * @param {number} bytes
   * @returns {string}
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return (i === 0 ? val.toFixed(0) : val.toFixed(1)) + ' ' + units[i];
  }

  /**
   * Convert a data URL string to a Blob.
   * @param {string} dataUrl
   * @returns {Blob}
   */
  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const byteString = atob(parts[1]);
    const buffer = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      buffer[i] = byteString.charCodeAt(i);
    }
    return new Blob([buffer], { type: mime });
  }

  /**
   * Convert a Blob to a data URL string.
   * @param {Blob} blob
   * @returns {Promise<string>}
   */
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Copy text to clipboard with execCommand fallback.
   * @param {string} text
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function copyToClipboard(text) {
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return { success: true };
      } catch (_) {
        // Fall through to legacy fallback
      }
    }

    // Legacy fallback via hidden textarea
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText =
        'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      return ok
        ? { success: true }
        : { success: false, error: 'Copy command was not supported.' };
    } catch (e) {
      return { success: false, error: 'Clipboard access denied by your browser.' };
    }
  }

  /**
   * Download a Blob as a file using a temporary <a> element.
   * Works on desktop Chrome/Edge/Firefox/Safari and Android Chrome.
   * @param {Blob} blob
   * @param {string} filename
   * @returns {{success: boolean, method: string}}
   */
  function downloadImage(blob, filename) {
    filename = filename || 'meta-glasses-converted.jpg';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 5000);
    return { success: true, method: 'download' };
  }

  /**
   * Share an image via the Web Share API.
   * Returns an object indicating success, cancellation, or error.
   * @param {Blob} blob
   * @param {string} filename
   * @returns {Promise<{success: boolean, cancelled?: boolean, error?: string, method: string}>}
   */
  async function shareImage(blob, filename) {
    filename = filename || 'meta-glasses-converted.jpg';
    const file = new File([blob], filename, { type: 'image/jpeg' });

    if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
      return {
        success: false,
        error: 'Sharing is not supported on this device.',
        method: 'share',
      };
    }

    try {
      await navigator.share({ files: [file], title: 'Meta Glasses Photo' });
      return { success: true, method: 'share' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true, method: 'share' };
      }
      return { success: false, error: err.message, method: 'share' };
    }
  }

  /**
   * Check whether the browser supports sharing files via Web Share API.
   * @returns {boolean}
   */
  function canShareFiles() {
    if (!navigator.canShare) return false;
    try {
      const testFile = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
      return navigator.canShare({ files: [testFile] });
    } catch (_) {
      return false;
    }
  }

  /**
   * Extract the lowercase file extension from a filename.
   * @param {string} filename
   * @returns {string}
   */
  function getFileExtension(filename) {
    return (filename || '').split('.').pop().toLowerCase();
  }

  /**
   * Get a display-friendly format name from a MIME type.
   * @param {string} mimeType
   * @returns {string}
   */
  function getFormatName(mimeType) {
    const map = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/gif': 'GIF',
      'image/bmp': 'BMP',
      'image/avif': 'AVIF',
      'image/heic': 'HEIC',
      'image/heif': 'HEIF',
    };
    return map[mimeType] || mimeType.replace('image/', '').toUpperCase();
  }

  // Public API
  return {
    formatFileSize,
    dataUrlToBlob,
    blobToDataUrl,
    copyToClipboard,
    downloadImage,
    shareImage,
    canShareFiles,
    getFileExtension,
    getFormatName,
  };
})();
