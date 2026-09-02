# 🕶️ Meta Glasses Photo Converter

> ⚡ A free, browser-based tool that converts your photos to the **3024 × 4032** format used by Meta Ray-Ban Smart Glasses — with metadata cleanup and injection. No uploads, no servers, 100% private.

> **Note:** This is an independent utility, not an official Meta or Ray-Ban product.

🚀 **Live Site:** [Open Website](https://meta-rayban-converter.vercel.app/)

---

## ✨ Features

- 🖼️ **Multi-Format Upload** — Supports JPG, PNG, WebP, GIF, BMP, and AVIF
- 📷 **Camera Capture** — Take a photo directly from your device camera (on supported devices)
- 📐 **3024 × 4032 Conversion** — Resizes and crops your image to the exact Meta Glasses resolution
- 🔄 **Orientation Correction** — Automatically fixes rotated or flipped images using EXIF orientation data
- ✂️ **Smart Cropping** — Preserves aspect ratio using centre-crop — never stretches or distorts your image
- 📍 **GPS Removal** — Strips all GPS location data from the image
- 🧹 **EXIF Cleanup** — Removes device-identifying metadata like Software, MakerNote, and Lens info
- 🏷️ **Meta-Style EXIF Injection** — Adds `Meta AI` and `Ray-Ban Meta Smart Glasses 2` metadata tags
- 💾 **Save Image** — Download the converted JPEG directly to your device
- 📋 **Copy Base64** — Copy the raw Base64 string of the converted image to your clipboard
- 📤 **Share** — Share the converted image using your device's native share sheet (on supported devices)
- 🔁 **Reset** — Clear everything and start over with a new image
- 🔒 **Client-Side Processing** — Your images never leave your browser. No server uploads, no cloud processing

---

## 🖼️ How It Works

1. 📂 **Select an image** — Pick from your gallery, take a photo, or drag & drop a file
2. 👀 **Preview** — See your image with its filename, dimensions, format, and file size
3. ⚡ **Convert** — Tap "Convert Image" to resize, crop, and process your photo
4. 🏷️ **Metadata** — GPS data is removed and Meta-style EXIF tags are injected automatically
5. 💾 **Save or Share** — Download the converted image, copy its Base64, or share it directly

---

## 📏 Output

| Property | Value |
|----------|-------|
| Format | JPEG |
| Resolution | 3024 × 4032 |
| Quality | 95% |
| Orientation | 1 (physically corrected) |
| EXIF Make | Meta AI |
| EXIF Model | Ray-Ban Meta Smart Glasses 2 |
| GPS Data | Removed |

---

## 📂 Supported Formats

| Format | Status |
|--------|--------|
| JPG / JPEG | ✅ Supported |
| PNG | ✅ Supported |
| WebP | ✅ Supported |
| GIF | ✅ Supported (first frame) |
| BMP | ✅ Supported |
| AVIF | ✅ Where browser supports it |
| HEIC / HEIF | ❌ Detected and rejected with a clear message |

> PNG and WebP images with transparency are composited onto a white background before JPEG conversion.

---

## 🔐 Privacy

- All processing happens **inside your browser** using HTML5 Canvas and JavaScript
- **No images are uploaded** to any server
- **No external APIs** are used for image processing
- GPS coordinates and device-identifying metadata are **actively stripped** from every converted image

> ⚠️ The injected EXIF metadata does not make images identical to genuine Meta Ray-Ban camera output. This is metadata formatting, not proof of hardware origin.

---

## 🛠️ Project Structure

```
├── index.html               HTML markup
├── css/
│   └── style.css            Styling
├── js/
│   ├── app.js               UI and event handling
│   ├── imageProcessor.js    Image conversion pipeline
│   ├── exif.js              EXIF metadata processing
│   └── utils.js             Clipboard, download, and share helpers
└── README.md
```

---

## 🚀 Run Locally

1. Clone or download this repository
2. Open `index.html` in any modern browser

No build tools, no dependencies to install, no server needed.

> **Tip:** For full Clipboard and Share API support, serve via a local HTTP server:
> ```bash
> npx serve .
> ```

---

## 📦 External Dependencies

| Library | Purpose |
|---------|---------|
| [piexifjs](https://github.com/nicklockwood/piexifjs) (1.0.6) | EXIF metadata read/write |
| [Inter](https://rsms.me/inter/) | UI typeface (Google Fonts) |

Both loaded from CDNs. No npm install required.

---

## 👨‍💻 Created by

**Faizan Ali**

📸 Instagram: [@faiizanaly](https://www.instagram.com/faiizanaly/)

---

> Created with ❤️ by [**Faizan Ali**](https://www.instagram.com/faiizanaly/)
