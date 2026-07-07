# 🎥 MaherCast — Your Own Loom, Running Locally

**A local-first, privacy-friendly screen recording platform.** Record your screen or camera right from the browser, keep a library of recordings on your device, and share instantly with anyone on your Wi-Fi — complete with Loom-style watch pages, view counts, emoji reactions, and comments. No accounts, no cloud, no subscription.

**▶️ Try it now:** https://maherkhan-builds.github.io/mahercast/

Works as an installable PWA — open the link on your phone or desktop and choose **Add to Home Screen**.

## ✨ Features

| Feature | Details |
|---|---|
| 🖥️ Screen recording | Capture your screen with mic + system audio (Chrome on desktop & Android) |
| 🤳 Camera recording | Talking-head videos on any device, including iPhone |
| 🫧 Camera bubble | Draggable face-cam overlay while you record your screen |
| ⏯️ Recording controls | 3-2-1 countdown, pause/resume, live timer |
| 📚 Library | Thumbnails, durations, rename, playback speed (0.5×–2×), download, native share sheet — stored privately in your browser (IndexedDB) |
| 🔗 Instant share links | Loom's signature move: one tap uploads to your own local server and copies a link anyone on your Wi-Fi can watch |
| 👀 Watch pages | View counts, emoji reactions (👍 ❤️ 🔥 😂 👏), and comments |
| 📱 PWA | Installs to your home screen like a native app |

### 🪄 Studio tools — annotate *while* you record

Built for educators and explainer videos. Everything below is composited live onto the recording itself, so viewers see exactly what you drew — no editing needed.

| Tool | Details |
|---|---|
| ✏️ Magic pencil | Glowing freehand pen — circle and underline anything on screen; pick any ink color |
| ➤ ▭ Shapes | Arrows and rectangles with a soft glow to point at what matters |
| 📝 💬 Notes | Tap to type a note box or speech bubble; undo (↩️) or clear all (🧹) the moment you move to the next topic |
| 🔦 Focus spotlight | Drag over an area — the rest of the screen turns to frosted glass while your selection stays crystal clear; drag to move it, tap to remove |
| 💬 Live captions | One-tap CC button — your speech becomes captions burned into the video (Web Speech API) |
| 🫧 Bubble styles | Ring colors, gradients (sunset, ocean, candy), 🌈 rainbow, ✨ glow, 🔥 animated fire, ☁️ cloud — plus a custom color picker |
| 😎 Face filters | Clear skin, background blur, warm, cool, B&W, vintage, vivid, neon, comic — applied to your camera bubble (or the whole frame in camera mode) |
| 🎬 Keeps rolling | A worker-based ticker keeps compositing even when the tab is in the background while you present another app |

### ✂️ Built-in editor — no other software needed

Open any recording from your library and tap **Trim & Edit**:

| Feature | Details |
|---|---|
| ✂️ Trim | Drag the purple handles on the timeline to cut the start and end |
| 🔍 Attention zooms | Seek to a moment, drag over the area you're explaining — the video smoothly zooms in, holds (2–10s, your choice), and zooms back out |
| 🎵 Background music | Pick any audio file from your device; independent music/voice volume sliders and an automatic fade-out at the end |
| 💾 Export | Re-renders in your browser and saves straight back to your library — then share, download, or edit again |

> **Recording tip:** in Chrome's share picker, choose the **tab or window of the content you're teaching** — not the MaherCast window itself (that creates a mirror-tunnel effect). MaherCast's own tab is automatically excluded from the picker. The studio preview shows exactly what's being recorded while you annotate on top of it.

> **Note:** iOS doesn't allow browser screen capture in any browser (Apple restriction) — on iPhone, MaherCast automatically switches to camera mode. Share links appear when you run the local server (below); the hosted version covers recording, library, download, and native sharing.

## 🚀 Run the full platform locally

The local server unlocks share links, watch pages, reactions, and comments — your recordings never leave your network.

```bash
git clone https://github.com/maherkhan-builds/mahercast.git
cd mahercast

# One-time: create an HTTPS certificate (browsers require HTTPS for screen/camera capture)
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 825 -nodes -subj "/CN=mahercast"

node server.js
```

Then open:
- **On your PC:** http://localhost:8080
- **On your phone (same Wi-Fi):** `https://<your-pc-ip>:4443` — accept the self-signed-certificate warning once, then Add to Home Screen

Zero dependencies. Just Node.js and a browser.

## 🛠️ How it's built

- **Frontend:** Vanilla JavaScript — `MediaRecorder`, `getDisplayMedia` / `getUserMedia`, Web Audio (mic + system audio mixing), IndexedDB, Web Share API
- **Backend:** A single-file, zero-dependency Node.js server — HTTPS for phones, upload streaming, HTTP Range support for smooth video seeking, JSON-file metadata for views/reactions/comments
- **PWA:** Manifest + SVG icon, installable on Android, iOS, and desktop

## 👤 Creator

Built by **[Maher Khan](https://digimarketingstudio.com)** — AI educator, no-code builder & digital marketing strategist.

- 🎓 UCLA Extension Guest Lecturer — ChatGPT, LLMs & Agentic AI
- 🏆 LinkedIn Top Voice, North America — 3 consecutive years
- 🛠️ 28+ AI-powered tools built · 20,000+ professionals trained
- 💼 [LinkedIn](https://www.linkedin.com/in/mahersocialmediastrategistus) · [GitHub](https://github.com/maherkhan-builds) · [Instagram](https://www.instagram.com/social.icm) · [Book a call](https://calendly.com/digitalpoles/let-s-meet-up)

Part of the **Maher Magic** series of AI & web apps. ✨

## 📄 License

[MIT](LICENSE) — free to use, learn from, and build on.
