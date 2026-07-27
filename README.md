<div align="center">

![MaherCast animated header](https://capsule-render.vercel.app/api?type=waving&height=280&color=gradient&customColorList=6,11,15,20&text=MaherCast&fontColor=ffffff&fontSize=82&fontAlignY=38&desc=Your%20own%20Loom%2C%20running%20locally&descAlignY=60&animation=fadeIn)

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Montserrat&weight=800&size=24&duration=3000&pause=800&color=A78BFA&center=true&vCenter=true&width=760&lines=Record+%C2%B7+Annotate+%C2%B7+Edit+%C2%B7+Share;No+Cloud.+No+Accounts.+No+Subscription.;Your+recordings+never+leave+your+network.)](https://maherkhan-builds.github.io/mahercast/)

<p><strong>A local-first, privacy-friendly screen recording studio that runs entirely in your browser — record, annotate live, edit, and share, with nothing ever uploaded to the cloud.</strong></p>

![JavaScript](https://img.shields.io/badge/JavaScript-09090D?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Node.js](https://img.shields.io/badge/Node.js-111827?style=for-the-badge&logo=node.js&logoColor=339933)
![PWA](https://img.shields.io/badge/PWA-19151F?style=for-the-badge&logo=pwa&logoColor=5A0FC8)
![License](https://img.shields.io/badge/License-MIT-19151F?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-A78BFA?style=for-the-badge)

[Live Demo](https://maherkhan-builds.github.io/mahercast/) · [Features](#-what-it-can-do) · [Quick Start](#-run-it-locally) · [How It Works](#-how-it-works)

</div>

---

## ✨ Meet MaherCast

Loom is brilliant — right up until the paywall, the 5-minute free cap, and the fact every private recording lives on someone else's cloud. **MaherCast is that same workflow, running entirely on your own machine.** Record your screen or camera, draw and annotate live while you talk, trim and zoom in a built-in editor, and share a watch link over your own Wi-Fi — no account, no upload, no subscription, ever.

## 🌱 The problem

Educators, consultants, and teams that record sensitive client work need Loom's easy record-and-share workflow **without the subscription and without their screen recordings sitting on someone else's servers**. Free screen recorders either cap your length, watermark your video, or quietly upload everything to the cloud the moment you hit stop.

## 🍓 The solution / What it can do

MaherCast is a complete recording studio — screen or camera capture, **live annotation while you record** (glowing pen, spotlight, captions), a built-in trim/zoom editor, a private library, and instant share links with view counts, reactions, and comments — all served from a zero-dependency local Node.js server on your own network.

**Who it's for:** educators narrating lessons with on-screen annotation · consultants sending clients walkthroughs of private work · teams on a LAN who want Loom-style share links without data leaving the building · anyone who wants their recordings on their own device, full stop.

| Feature | What it feels like |
|---|---|
| 🖥️ Screen + 🤳 camera recording | Capture your screen with mic/system audio, or record talking-head video on any device — including iPhone |
| 🎬 Overlay mode | Reels-style process videos: a background photo/video with a live camera bubble talking on top — no screen capture needed, works on iPhone |
| 🪄 Live studio tools | Glowing magic pencil, arrows/shapes, sticky notes & speech bubbles, focus spotlight, and live captions — all composited straight into the recording as you talk |
| 📌 Pop-out presenter panel | Floats your tools + a live preview in an always-on-top window, so you can draw on your teaching content while it stays outside the recording itself |
| ⏯️ Recording controls | 3-2-1 countdown, pause/resume, live timer, and one-tap Retake that discards a bad take and starts over instantly |
| ✂️ Built-in editor | Trim the start/end, add attention-zooms that smoothly zoom in and hold, layer background music with independent volume + auto fade-out |
| 💾 Real `.mp4` export | Encodes live via WebCodecs to a genuine H.264/AAC `.mp4` — opens cleanly in CapCut, WhatsApp, Premiere, DaVinci, and iPhone with no conversion |
| 📚 Private library | Thumbnails, durations, rename, 0.5×–2× playback speed, download, native share sheet — stored in your browser's IndexedDB |
| 🔗 Instant share links + 👀 watch pages | One tap uploads to your own local server and copies a link anyone on your Wi-Fi can watch, react to (👍❤️🔥😂👏), and comment on |
| 📱 Installable PWA | Add to Home Screen on desktop, Android, and iOS |

## 🫶 How to use it

1. Open the [live app](https://maherkhan-builds.github.io/mahercast/) (or run the local server for share links — see Quick Start below) and choose **screen**, **camera**, or **overlay** mode.
2. Hit record. While recording, draw with the magic pencil, drop notes/arrows, spotlight an area, or turn on live captions — everything you add is baked straight into the video.
3. Stop, then open **Trim & Edit** to cut the ends, add attention-zooms, and layer in background music.
4. Tap **Share** to get a link anyone on your Wi-Fi can open and watch, react to, and comment on — or download the `.mp4` straight to your device.

## 🧠 How it works

```
 Browser capture                Live compositor              Local network
┌──────────────────┐        ┌──────────────────────┐      ┌────────────────────┐
│ getDisplayMedia / │        │ Canvas overlay:       │      │ Zero-dep Node.js    │
│ getUserMedia +     │──────▶│ pencil · shapes ·      │─────▶│ HTTPS server        │
│ Web Audio mixing   │        │ spotlight · captions  │      │ (uploads, watch     │
└──────────────────┘        └──────────┬────────────┘      │  pages, reactions,  │
                                        │                    │  Range-based video  │
                              WebCodecs │ live encode         │  streaming)         │
                                        ▼                    └──────────┬─────────┘
                              ┌──────────────────┐                       │
                              │ Flat H.264/AAC     │                       ▼
                              │ .mp4 → IndexedDB    │            Watch link shared
                              │ library (private)   │            over your own Wi-Fi
                              └──────────────────┘
```

Recordings encode straight to a real, standard `.mp4` — built live as you record via [WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API) and muxed flat with [mp4-muxer](https://github.com/Vanilagy/mp4-muxer), the same structure a phone camera produces, so Download is instant with no export wait. If your browser doesn't support WebCodecs, recording falls back to `.webm` automatically. Because no browser is allowed to paint directly onto your desktop, live annotations are drawn on a pixel-accurate preview in the pop-out presenter panel — whatever you draw there lands in the same spot in the final video. iOS doesn't allow screen capture in any browser (an Apple restriction), so MaherCast switches to camera mode automatically there.

## 🛠️ Built with

- **Frontend:** Vanilla JavaScript — `MediaRecorder`, `getDisplayMedia` / `getUserMedia`, Web Audio (mic + system audio mixing), IndexedDB, Web Share API, Document Picture-in-Picture
- **Backend:** A single-file, zero-dependency Node.js server — HTTPS for phones, upload streaming, HTTP Range support for smooth seeking, JSON-file metadata for views/reactions/comments
- **PWA:** Manifest + SVG icon, installable on Android, iOS, and desktop

## 🚀 Run it locally

The local server unlocks share links, watch pages, reactions, and comments — recordings never leave your network.

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

## 🔎 Keywords

`screen-recorder` · `loom-alternative` · `privacy-first` · `local-first` · `pwa` · `screen-recording` · `video-annotation` · `web-audio-api` · `mediarecorder` · `claude-code` · `nodejs` · `webcodecs` · `share-links`

---

## 👤 Creator

Built by **[Maher Khan](https://digimarketingstudio.com)** — AI educator, no-code builder & digital marketing strategist.

- 🎓 UCLA Extension Guest Lecturer — ChatGPT, LLMs & Agentic AI
- 🏆 LinkedIn Top Voice, North America — 3 consecutive years
- 🛠️ 28+ AI-powered tools built · 20,000+ professionals trained
- 💼 [LinkedIn](https://www.linkedin.com/in/mahersocialmediastrategistus) · [GitHub](https://github.com/maherkhan-builds) · [Instagram](https://www.instagram.com/social.icm) · [Book a call](https://calendly.com/digitalpoles/let-s-meet-up)

Part of the **Maher Magic** series of AI & web apps. ✨ Designed and built end-to-end with **[Claude Code](https://claude.com/claude-code)** (Anthropic) — from the MediaRecorder capture pipeline and live annotation compositor to the zero-dependency Node.js share server.

## 📄 License

[MIT](LICENSE) — free to use, learn from, and build on.

<div align="center">
  <h3>Record it. Draw on it. Share it — without leaving your network.</h3>
  <p>If MaherCast sparks an idea, drop the repo a ⭐</p>
</div>

![MaherCast footer](https://capsule-render.vercel.app/api?type=waving&height=150&section=footer&color=gradient&customColorList=6,11,15,20&animation=twinkling)
