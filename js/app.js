/**
 * app.js — Main application orchestration for Meta Glasses Photo Converter
 * Handles UI state management, event binding, and conversion workflow.
 */
'use strict';

(() => {
  // ── Application State ──────────────────────────────────────────
  // States: IDLE → IMAGE_LOADED → PROCESSING → CONVERTED
  let appState     = 'IDLE';
  let currentFile  = null;            // The selected File object
  let result       = null;            // { blob, dataUrl, base64, width, height, size }
  let previewUrl   = null;            // Object URL for preview display

  // ── DOM References ─────────────────────────────────────────────
  const el = {
    // Upload
    uploadSection:   document.getElementById('uploadSection'),
    dropZone:        document.getElementById('dropZone'),
    fileInput:       document.getElementById('fileInput'),
    cameraInput:     document.getElementById('cameraInput'),
    cameraBtn:       document.getElementById('cameraBtn'),
    galleryBtn:      document.getElementById('galleryBtn'),
    dropText:        document.getElementById('dropText'),
    dropSubtext:     document.getElementById('dropSubtext'),

    // File info
    fileInfo:        document.getElementById('fileInfo'),
    fileName:        document.getElementById('fileName'),
    fileDimensions:  document.getElementById('fileDimensions'),
    fileFormat:      document.getElementById('fileFormat'),
    fileSize:        document.getElementById('fileSize'),

    // Preview
    previewContainer:document.getElementById('previewContainer'),
    previewImage:    document.getElementById('previewImage'),
    previewBadge:    document.getElementById('previewBadge'),

    // Convert
    convertBtn:      document.getElementById('convertBtn'),
    convertBtnText:  document.getElementById('convertBtnText'),

    // Processing
    processingStatus:document.getElementById('processingStatus'),
    processingText:  document.getElementById('processingText'),

    // Result
    resultSection:   document.getElementById('resultSection'),
    resultInfo:      document.getElementById('resultInfo'),

    // Action buttons
    saveBtn:         document.getElementById('saveBtn'),
    copyBtn:         document.getElementById('copyBtn'),
    shareBtn:        document.getElementById('shareBtn'),
    resetBtn:        document.getElementById('resetBtn'),

    // Toast
    toast:           document.getElementById('toast'),
  };

  // ── Toast auto-hide timer ──────────────────────────────────────
  let toastTimer = null;

  // ── Initialisation ─────────────────────────────────────────────
  function init() {
    bindEvents();
    updateShareVisibility();
  }

  function bindEvents() {
    // Source buttons
    el.cameraBtn.addEventListener('click', () => el.cameraInput.click());
    el.galleryBtn.addEventListener('click', () => el.fileInput.click());
    el.dropZone.addEventListener('click', () => el.fileInput.click());

    // Keyboard support for drop zone
    el.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.fileInput.click();
      }
    });

    // Drag & drop
    el.dropZone.addEventListener('dragover', onDragOver);
    el.dropZone.addEventListener('dragleave', onDragLeave);
    el.dropZone.addEventListener('drop', onDrop);

    // File input changes
    el.fileInput.addEventListener('change', () => {
      const file = el.fileInput.files && el.fileInput.files[0];
      if (file) handleFile(file);
    });
    el.cameraInput.addEventListener('change', () => {
      const file = el.cameraInput.files && el.cameraInput.files[0];
      if (file) handleFile(file);
    });

    // Action buttons
    el.convertBtn.addEventListener('click', handleConvert);
    el.saveBtn.addEventListener('click', handleSave);
    el.copyBtn.addEventListener('click', handleCopy);
    el.shareBtn.addEventListener('click', handleShare);
    el.resetBtn.addEventListener('click', handleReset);
  }

  // ── Share Button Visibility ────────────────────────────────────
  function updateShareVisibility() {
    if (!AppUtils.canShareFiles()) {
      el.shareBtn.style.display = 'none';
      // Make copy button full-width when share is hidden
      el.copyBtn.parentElement.style.gridTemplateColumns = '1fr';
    }
  }

  // ── Drag & Drop ────────────────────────────────────────────────
  function onDragOver(e) {
    e.preventDefault();
    el.dropZone.classList.add('drag-over');
  }

  function onDragLeave() {
    el.dropZone.classList.remove('drag-over');
  }

  function onDrop(e) {
    e.preventDefault();
    el.dropZone.classList.remove('drag-over');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── File Handling ──────────────────────────────────────────────
  function handleFile(file) {
    // Validate
    const validation = ImageProcessor.validateFile(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }
    if (validation.warning) {
      showToast(validation.warning, 'warning');
    }

    // Clean up previous state
    cleanupPreviousResult();

    currentFile = file;
    appState = 'IMAGE_LOADED';

    // Create preview
    previewUrl = URL.createObjectURL(file);
    el.previewImage.src = previewUrl;
    el.previewImage.alt = 'Preview of ' + file.name;
    el.previewBadge.textContent = 'Source';

    // Show preview and file info
    el.previewContainer.hidden = false;
    el.fileInfo.hidden = false;

    // Populate file info
    el.fileName.textContent = file.name || 'Unknown';
    el.fileName.title = file.name || '';
    el.fileFormat.textContent = AppUtils.getFormatName(file.type);
    el.fileSize.textContent = AppUtils.formatFileSize(file.size);

    // Get dimensions by loading the image
    const tempImg = new Image();
    tempImg.onload = () => {
      el.fileDimensions.textContent = tempImg.naturalWidth + ' × ' + tempImg.naturalHeight;
    };
    tempImg.onerror = () => {
      el.fileDimensions.textContent = '—';
    };
    tempImg.src = previewUrl;

    // Update drop zone text
    el.dropText.textContent = file.name || 'Photo Selected';
    el.dropSubtext.textContent = AppUtils.formatFileSize(file.size) + ' — Ready to convert';

    // Enable convert button
    el.convertBtn.disabled = false;
    el.convertBtnText.textContent = 'Convert Image';

    // Hide result section
    el.resultSection.hidden = true;
  }

  // ── Conversion ─────────────────────────────────────────────────
  async function handleConvert() {
    if (!currentFile || appState === 'PROCESSING') return;

    appState = 'PROCESSING';
    hideToast();

    // Disable convert button, show processing
    el.convertBtn.disabled = true;
    el.convertBtnText.textContent = 'Processing…';
    el.processingStatus.hidden = false;
    el.resultSection.hidden = true;

    try {
      result = await ImageProcessor.processImage(currentFile, (step, message) => {
        el.processingText.textContent = message;
      });

      appState = 'CONVERTED';

      // Update preview to show converted image
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrl = URL.createObjectURL(result.blob);
      el.previewImage.src = previewUrl;
      el.previewImage.alt = 'Converted image — 3024 × 4032 JPEG';
      el.previewBadge.textContent = '3024 × 4032';

      // Update file info to show output details
      el.fileName.textContent = 'meta-glasses-converted.jpg';
      el.fileDimensions.textContent = result.width + ' × ' + result.height;
      el.fileFormat.textContent = 'JPEG';
      el.fileSize.textContent = AppUtils.formatFileSize(result.size);

      // Show result info
      el.resultInfo.textContent =
        'Output: ' + AppUtils.formatFileSize(result.size) + ' JPEG';

      // Show result section, hide processing
      el.processingStatus.hidden = true;
      el.resultSection.hidden = false;

      // Update convert button
      el.convertBtn.disabled = false;
      el.convertBtnText.textContent = 'Convert Again';

      showToast('Image converted successfully!', 'success');

    } catch (err) {
      appState = 'IMAGE_LOADED';
      el.processingStatus.hidden = true;
      el.convertBtn.disabled = false;
      el.convertBtnText.textContent = 'Convert Image';

      const message = err && err.message
        ? err.message
        : 'Conversion failed. Please try another image.';
      showToast(message, 'error');
      console.error('[MetaGlasses] Conversion error:', err);
    }
  }

  // ── Save ───────────────────────────────────────────────────────
  function handleSave() {
    if (!result || !result.blob) return;

    try {
      const res = AppUtils.downloadImage(result.blob, 'meta-glasses-converted.jpg');
      if (res.success) {
        showToast('Image download started.', 'success');
      }
    } catch (err) {
      showToast('Download failed. Try long-pressing the image to save.', 'error');
      console.error('[MetaGlasses] Save error:', err);
    }
  }

  // ── Copy Base64 ────────────────────────────────────────────────
  async function handleCopy() {
    if (!result || !result.base64) return;

    try {
      const res = await AppUtils.copyToClipboard(result.base64);
      if (res.success) {
        showToast('Base64 copied to clipboard!', 'success');
      } else {
        showToast(res.error || 'Clipboard access denied by your browser.', 'error');
      }
    } catch (err) {
      showToast('Could not copy. Clipboard may be restricted.', 'error');
    }
  }

  // ── Share ──────────────────────────────────────────────────────
  async function handleShare() {
    if (!result || !result.blob) return;

    try {
      const res = await AppUtils.shareImage(result.blob, 'meta-glasses-converted.jpg');

      if (res.success) {
        showToast('Image shared successfully!', 'success');
      } else if (res.cancelled) {
        // User cancelled — no message, or a subtle one
        showToast('Share cancelled.', 'info');
      } else {
        showToast(res.error || 'Could not share. Try saving instead.', 'error');
      }
    } catch (err) {
      showToast('Sharing is not available. Try saving instead.', 'error');
    }
  }

  // ── Reset ──────────────────────────────────────────────────────
  function handleReset() {
    cleanupPreviousResult();

    // Reset file inputs (allows re-selecting the same file)
    el.fileInput.value = '';
    el.cameraInput.value = '';

    // Reset state
    currentFile = null;
    result      = null;
    appState    = 'IDLE';

    // Reset UI
    el.previewContainer.hidden  = true;
    el.fileInfo.hidden          = true;
    el.resultSection.hidden     = true;
    el.processingStatus.hidden  = true;

    el.previewImage.src = '';
    el.previewImage.alt = 'Image preview';
    el.previewBadge.textContent = 'Source';

    el.convertBtn.disabled     = true;
    el.convertBtnText.textContent = 'Convert Image';

    el.dropText.textContent    = 'Drag & drop or tap to select';
    el.dropSubtext.textContent = 'JPG \u2022 PNG \u2022 WebP \u2022 GIF \u2022 BMP \u2022 AVIF';

    el.fileName.textContent      = '—';
    el.fileDimensions.textContent = '—';
    el.fileFormat.textContent    = '—';
    el.fileSize.textContent      = '—';

    hideToast();
  }

  // ── Cleanup helper ─────────────────────────────────────────────
  function cleanupPreviousResult() {
    // Revoke previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    // Clear large data references
    if (result) {
      result = null;
    }
  }

  // ── Toast / Status Messages ────────────────────────────────────
  function showToast(message, type) {
    type = type || 'info';

    // Clear any pending auto-hide
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    // Icon
    var icons = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      info:    'ℹ',
    };
    var icon = icons[type] || icons.info;

    el.toast.className = 'toast toast-' + type;
    el.toast.innerHTML =
      '<span class="toast-icon">' + icon + '</span>' +
      '<span>' + escapeHtml(message) + '</span>';
    el.toast.hidden = false;

    // Auto-hide after 5 seconds (except errors stay longer)
    var delay = type === 'error' ? 8000 : 5000;
    toastTimer = setTimeout(hideToast, delay);
  }

  function hideToast() {
    el.toast.hidden = true;
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
  }

  /** Escape HTML to prevent injection in toast messages. */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Start ──────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
