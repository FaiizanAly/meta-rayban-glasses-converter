/**
 * app.js — Main application / UI logic
 * DOM references, event listeners, button states, status messages
 */

import { convertImage } from './imageProcessor.js';
import { copyText } from './utils.js';
import { saveOrShareImage, saveToGallery } from './save.js';

// ── DOM References ──────────────────────────────────────────
const $ = id => document.getElementById(id);
const dropZone = $("dropZone");
const fileInput = $("fileInput");
const cameraInput = $("cameraInput");
const cameraBtn = $("cameraBtn");
const galleryBtn = $("galleryBtn");
const previewContainer = $("previewContainer");
const preview = $("preview");
const previewTag = $("previewTag");
const uploadTitle = $("uploadTitle");
const uploadSub = $("uploadSub");
const allInOneBtn = $("allInOneBtn");
const copyBtn = $("copyBtn");
const saveBtn = $("saveBtn");
const status = $("status");
const allInOneText = $("allInOneText");
const galleryBtn2 = $("galleryBtn2");
const galleryBtnText = $("galleryBtnText");

// ── Application State ───────────────────────────────────────
let sourceDataUrl = null;
let finalDataUrl = null;
let pureBase64 = null;

// ── Status Helpers ──────────────────────────────────────────
function showStatus(message, type = "success", isLoading = false) {
  status.className = `status ${type}`;
  status.style.display = "flex";
  if (isLoading) {
    status.innerHTML = `<span class="spinner"></span><span>${message}</span>`;
  } else {
    status.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${message}</span>`;
  }
}

function hideStatus() {
  status.style.display = "none";
}

// ── File Handling ───────────────────────────────────────────
function handleFile(file) {
  if (file.type !== "image/jpeg" && !/\.jpe?g$/i.test(file.name)) {
    showStatus("Please select a JPG/JPEG image.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    sourceDataUrl = e.target.result;
    preview.src = sourceDataUrl;
    previewContainer.style.display = "block";
    previewTag.textContent = "Source Ready";
    uploadTitle.textContent = file.name || "Photo Selected";
    uploadSub.textContent = `${(file.size / 1024).toFixed(1)} KB — Ready to convert`;
    
    allInOneBtn.disabled = false;
    allInOneText.textContent = "⚡ CONVERT";
    copyBtn.disabled = true;
    saveBtn.disabled = true;
    galleryBtn2.disabled = true;
    galleryBtnText.textContent = "Save to Gallery";
    hideStatus();
  };
  reader.readAsDataURL(file);
}

// ── Source Selection Triggers ────────────────────────────────
cameraBtn.addEventListener("click", () => cameraInput.click());
galleryBtn.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("click", () => fileInput.click());

// Drag and drop for tablets/desktops
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.style.borderColor = "#d4af37";
});
dropZone.addEventListener("dragleave", () => {
  dropZone.style.borderColor = "";
});
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.style.borderColor = "";
  const file = e.dataTransfer.files?.[0];
  if (file) handleFile(file);
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFile(file);
});

cameraInput.addEventListener("change", () => {
  const file = cameraInput.files?.[0];
  if (file) handleFile(file);
});

// ── ⚡ CONVERT Button ───────────────────────────────────────
allInOneBtn.addEventListener("click", async () => {
  if (!sourceDataUrl) {
    fileInput.click();
    return;
  }

  allInOneBtn.disabled = true;
  showStatus("Processing 3024×4032 conversion...", "loading", true);

  try {
    const result = await convertImage(sourceDataUrl);
    finalDataUrl = result.finalDataUrl;
    pureBase64 = result.pureBase64;

    // Update preview with final converted image so mobile users can tap & hold
    preview.src = finalDataUrl;
    previewTag.textContent = "3024×4032 Ready";

    // Copy Base64
    let copied = false;
    try {
      await copyText(pureBase64);
      copied = true;
    } catch (e) {
      console.warn(e);
    }

    // Trigger Save / Share Sheet
    const saveResult = await saveOrShareImage(finalDataUrl);

    copyBtn.disabled = false;
    saveBtn.disabled = false;
    galleryBtn2.disabled = false;

    if (saveResult.method === "share") {
      showStatus("✅ Base64 copied & Share Sheet opened (Tap 'Save Image').", "success");
    } else {
      showStatus("✅ Success! Base64 copied & image downloaded.", "success");
    }
  } catch (err) {
    console.error(err);
    showStatus("Conversion failed. Try another JPG.", "error");
  } finally {
    allInOneBtn.disabled = false;
  }
});

// ── Secondary Buttons ───────────────────────────────────────
copyBtn.addEventListener("click", async () => {
  if (!pureBase64) return;
  try {
    await copyText(pureBase64);
    showStatus("Base64 copied to clipboard!", "success");
  } catch (e) {
    showStatus("Clipboard restricted by browser.", "error");
  }
});

saveBtn.addEventListener("click", async () => {
  if (!finalDataUrl) return;
  await saveOrShareImage(finalDataUrl);
  showStatus("Save triggered! (Or tap & hold image to save).", "success");
});

// ── 📱 Save to Gallery Button ───────────────────────────────
galleryBtn2.addEventListener("click", async () => {
  if (!finalDataUrl) return;

  galleryBtn2.disabled = true;
  galleryBtnText.textContent = "Saving…";

  try {
    const result = await saveToGallery(finalDataUrl);

    if (result.method === "cancelled") {
      // User cancelled — reset silently, no error
      galleryBtnText.textContent = "Save to Gallery";
      return;
    }

    galleryBtnText.textContent = "Saved successfully";
    if (result.method === "share") {
      showStatus("Image shared/saved to gallery!", "success");
    } else {
      showStatus("Image downloaded as meta-glasses-converted.jpg", "success");
    }
    setTimeout(() => { galleryBtnText.textContent = "Save to Gallery"; }, 2500);
  } catch (err) {
    console.error(err);
    showStatus("Save failed. Try again.", "error");
    galleryBtnText.textContent = "Save to Gallery";
  } finally {
    galleryBtn2.disabled = false;
  }
});
