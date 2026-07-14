<div align="center">

[![MaherCast](https://readme-typing-svg.demolab.com?font=Montserrat&weight=800&size=32&duration=3000&pause=800&color=A78BFA&center=true&vCenter=true&width=700&height=60&lines=🎥+MaherCast;Your+Own+Loom%2C+Running+Locally;Record+·+Annotate+·+Edit+·+Share;No+Cloud.+No+Accounts.+No+Subscription.)](https://maherkhan-builds.github.io/mahercast/)

**A local-first, privacy-friendly screen recording studio in your browser**

[![▶️ Try It Now](https://img.shields.io/badge/▶️_TRY_IT_NOW-Live_App-a78bfa?style=for-the-badge)](https://maherkhan-builds.github.io/mahercast/)
[![Built with Claude Code](https://img.shields.io/badge/Built_with-Claude_Code-cc785c?style=for-the-badge)](https://claude.com/claude-code)
[![PWA](https://img.shields.io/badge/PWA-Installable-38e8a5?style=for-the-badge)](#-run-the-full-platform-locally)

</div>

---

## 🔗 Live App

**▶️ https://maherkhan-builds.github.io/mahercast/** — works on desktop, Android, and iOS. Installable as a PWA: open the link and choose **Add to Home Screen**.

## 🎯 The Problem

Loom is brilliant — until you hit the paywall, the 5-minute free cap, and the fact that every private recording of your screen lives on someone else's cloud. Educators, consultants, and teams that record sensitive client work need Loom's workflow **without the subscription and without uploading anything**.

## 💡 The Solution

MaherCast is a complete recording studio that runs entirely on your own machine: record screen or camera, **annotate live while recording** (glowing pen, spotlight, captions), trim and add attention-zooms in a built-in editor, keep a private library in your browser, and share watch links — with view counts, emoji reactions, and comments — over your own Wi-Fi via a zero-dependency local server. **No accounts, no cloud, no subscription.**

## 👥 Who It's For

- **Educators & course creators** narrating lessons with live on-screen annotation
- **Consultants & freelancers** sending clients walkthrough videos of private work
- **Teams on a LAN** who want Loom-style share links without data leaving the building
- **Privacy-conscious creators** who want their recordings stored on their device, full stop

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
| 📌 Pop-out presenter panel | One tap floats your tools + a live preview in a small always-on-top window (Document Picture-in-Picture). Toggle between a tall or wide layout depending on how you like to work. Draw on the panel's own preview — annotations land in the video at the same relative spot; the panel itself never does (unless you share "entire screen" instead of a window/tab) |

> **Why you draw on a preview, not your real screen:** no browser (MaherCast, Loom's web recorder, or anyone else's) is allowed to paint directly on top of your desktop or another app's window — that's an OS security rule, not a limitation of this tool. The floating panel's mini preview is a live, pixel-accurate mirror of what's being recorded; whatever you draw on it lands in the exact same spot in your final video.

### ✂️ Built-in editor — no other software needed

Open any recording from your library and tap **Trim & Edit**:

| Feature | Details |
|---|---|
| ✂️ Trim | Drag the purple handles on the timeline to cut the start and end |
| 🔍 Attention zooms | Seek to a moment, drag over the area you're explaining — the video smoothly zooms in, holds (2–10s, your choice), and zooms back out |
| 🎵 Background music | Pick any audio file from your device; independent music/voice volume sliders and an automatic fade-out at the end |
| 💾 Export | Re-renders in your browser and saves straight back to your library — then share, download, or edit again |

> **The presenter workflow:** ① share the **tab or window of your teaching content** in Chrome's picker (never MaherCast itself — that creates a mirror tunnel; MaherCast's own tab is excluded automatically) → ② tap **📌** to pop the tools into the floating panel → ③ present your content full-screen and annotate from the panel. Everything you draw is baked into the video; the panel and toolbar are not.

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

## 🤖 How It Was Built

Designed and built end-to-end with **[Claude Code](https://claude.com/claude-code)** (Anthropic) — from the MediaRecorder capture pipeline and live annotation compositor to the zero-dependency Node.js share server.

## 📄 License

[MIT](LICENSE) — free to use, learn from, and build on.

<div align="center">

`screen-recorder` `loom-alternative` `privacy-first` `local-first` `pwa` `screen-recording` `video-annotation` `web-audio-api` `mediarecorder` `claude-code`

</div>
