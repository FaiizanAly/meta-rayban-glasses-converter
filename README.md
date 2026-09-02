# 🕶️ Meta Ray-Ban Converter

Convert any JPEG photo into a Ray-Ban Meta Smart Glasses format — 3024 × 4032 resolution with authentic Meta AI EXIF metadata injected. Everything runs in your browser.

🔗 **[Open Live Site](https://meta-rayban-converter.vercel.app)**

---

## ✨ Features

- 📷 **Camera & Gallery upload** — take a photo or pick from your library
- 🔄 **1-tap conversion** — converts, copies Base64, and triggers save in one step
- 📐 **3024 × 4032 output** — standard Ray-Ban Meta resolution
- 🏷️ **EXIF injection** — writes Meta AI / Ray-Ban Meta Smart Glasses 2 metadata
- 🔄 **Orientation correction** — handles rotated source images automatically
- 📋 **Copy Base64** — copies the converted image as a Base64 string
- 💾 **Save / Share** — uses the Web Share API on mobile, download fallback on desktop
- 📱 **Save to Gallery** — dedicated button to save the final JPEG to your device
- 🖥️ **Mobile-first design** — works on phones, tablets, and desktops
- 🔒 **100% client-side** — no server uploads, everything stays on your device

---

## ⚡ How It Works

1. 📂 Upload a JPG photo (camera, gallery, or drag & drop)
2. ⚡ Tap **CONVERT** — the image is resized, orientation-corrected, and EXIF is injected
3. 📋 Base64 is automatically copied to your clipboard
4. 💾 Save or share the converted image using the action buttons

---

### 📸 Output

- **Format:** JPEG
- **Resolution:** 3024 × 4032
- **EXIF Make:** Meta AI
- **EXIF Model:** Ray-Ban Meta Smart Glasses 2

---

## 🔒 Privacy

> All image processing happens locally in your browser. No images are uploaded to any server.

---

## 📁 Project Structure

```
meta/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── app.js
    ├── imageProcessor.js
    ├── exif.js
    ├── save.js
    └── utils.js
```

---

## 👨‍💻 Creator

**Faizan Ali**

Instagram: [@faiizanaly](https://www.instagram.com/faiizanaly/)

> Created with ❤️ by **Faizan Ali**
