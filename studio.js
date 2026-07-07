/* MaherCast Studio — live compositing engine.
   Draws the captured screen/camera into a canvas together with the camera
   bubble (filters + ring styles), magic-pencil strokes, shapes, notes,
   spotlight focus blur and live captions — then the canvas itself is what
   gets recorded, so every annotation is baked into the final video. */

const Studio = (() => {
  const stage = () => document.getElementById('stage');

  const FILTERS = {
    none:    { label: 'None',        css: '' },
    smooth:  { label: '✨ Clear skin', css: 'blur(1.4px) brightness(1.07) saturate(1.06)' },
    blurbg:  { label: '🌫 Blur BG',   css: 'special' },
    warm:    { label: '🌅 Warm',      css: 'sepia(.28) saturate(1.35) brightness(1.05)' },
    cool:    { label: '❄️ Cool',      css: 'saturate(1.15) hue-rotate(-12deg) brightness(1.04)' },
    bw:      { label: '🎬 B&W',       css: 'grayscale(1) contrast(1.12)' },
    vintage: { label: '📼 Vintage',   css: 'sepia(.55) contrast(.95) brightness(1.06)' },
    vivid:   { label: '🌈 Vivid',     css: 'saturate(1.65) contrast(1.1)' },
    neon:    { label: '💜 Neon',      css: 'saturate(2) hue-rotate(95deg) contrast(1.25)' },
    comic:   { label: '💥 Comic',     css: 'contrast(1.7) saturate(1.5)' },
  };

  const RINGS = {
    purple:  { kind: 'solid', colors: ['#625df5'] },
    red:     { kind: 'solid', colors: ['#e5484d'] },
    teal:    { kind: 'solid', colors: ['#12b886'] },
    white:   { kind: 'solid', colors: ['#ffffff'] },
    sunset:  { kind: 'grad',  colors: ['#ff6b6b', '#feca57', '#ff9ff3'] },
    ocean:   { kind: 'grad',  colors: ['#00d2ff', '#3a7bd5'] },
    candy:   { kind: 'grad',  colors: ['#ff9ff3', '#a29bfe', '#74b9ff'] },
    rainbow: { kind: 'rainbow' },
    glow:    { kind: 'glow',  colors: ['#a78bfa'] },
    fire:    { kind: 'fire' },
    cloud:   { kind: 'cloud' },
  };

  const S = {
    running: false,
    mode: 'screen',
    canvas: null, ctx: null, W: 1280, H: 720,
    srcVideo: null, camVideo: null,
    small: null, smallCtx: null,        // downscaled frame → cheap frosted blur
    camSmall: null, camSmallCtx: null,
    ticker: null, raf: 0,
    tool: 'move',
    penColor: '#ffd400',
    annotations: [],
    draft: null,
    spotlight: null,
    bubble: { on: false, x: 0.84, y: 0.76, r: 0.13, ring: RINGS.purple, ringName: 'purple', filter: 'none' },
    camFilter: 'none',                  // camera-mode full-frame filter
    captions: { on: false, text: '', rec: null, supported: false },
    dragging: null,
  };

  /* ---------- geometry helpers ---------- */
  function pt(e) {
    const r = S.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (S.W / r.width), y: (e.clientY - r.top) * (S.H / r.height) };
  }
  const scale = () => S.W / 1280;

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxW) {
    const words = text.split(/\s+/), lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines.slice(0, 5);
  }

  /* ---------- drawing ---------- */
  function drawFrosted(ctx) {
    // downscale → upscale = fast gaussian-ish blur, then a light frosted tint
    S.smallCtx.drawImage(S.srcVideo, 0, 0, S.small.width, S.small.height);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(S.small, 0, 0, S.W, S.H);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(0, 0, S.W, S.H);
    ctx.restore();
  }

  function drawSpotlight(ctx) {
    const sp = S.spotlight;
    if (!sp) return;
    drawFrosted(ctx);
    const k = scale();
    ctx.save();
    rr(ctx, sp.x, sp.y, sp.w, sp.h, 14 * k);
    ctx.clip();
    ctx.drawImage(S.srcVideo, 0, 0, S.W, S.H);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 22 * k;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5 * k;
    rr(ctx, sp.x, sp.y, sp.w, sp.h, 14 * k);
    ctx.stroke();
    ctx.restore();
  }

  function drawPen(ctx, a) {
    if (a.points.length < 2) return;
    const k = scale();
    ctx.save();
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 5 * k;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.shadowColor = a.color;
    ctx.shadowBlur = 14 * k;
    ctx.beginPath();
    ctx.moveTo(a.points[0].x, a.points[0].y);
    for (const p of a.points) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawRect(ctx, a) {
    const k = scale();
    ctx.save();
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 4 * k;
    ctx.shadowColor = a.color;
    ctx.shadowBlur = 10 * k;
    rr(ctx, Math.min(a.x1, a.x2), Math.min(a.y1, a.y2), Math.abs(a.x2 - a.x1), Math.abs(a.y2 - a.y1), 8 * k);
    ctx.stroke();
    ctx.restore();
  }

  function drawArrow(ctx, a) {
    const k = scale();
    const dx = a.x2 - a.x1, dy = a.y2 - a.y1;
    const len = Math.hypot(dx, dy);
    if (len < 8) return;
    const ang = Math.atan2(dy, dx), head = Math.min(26 * k, len / 2.5);
    ctx.save();
    ctx.strokeStyle = ctx.fillStyle = a.color;
    ctx.lineWidth = 5 * k;
    ctx.lineCap = 'round';
    ctx.shadowColor = a.color;
    ctx.shadowBlur = 10 * k;
    ctx.beginPath();
    ctx.moveTo(a.x1, a.y1);
    ctx.lineTo(a.x2 - Math.cos(ang) * head * 0.6, a.y2 - Math.sin(ang) * head * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.x2, a.y2);
    ctx.lineTo(a.x2 - Math.cos(ang - 0.42) * head, a.y2 - Math.sin(ang - 0.42) * head);
    ctx.lineTo(a.x2 - Math.cos(ang + 0.42) * head, a.y2 - Math.sin(ang + 0.42) * head);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawNote(ctx, a) {
    const k = scale();
    ctx.save();
    ctx.font = `600 ${22 * k}px system-ui, sans-serif`;
    const maxW = 320 * k;
    const lines = wrapText(ctx, a.text, maxW);
    const tw = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width)));
    const pad = 14 * k, lh = 30 * k;
    const w = tw + pad * 2, h = lines.length * lh + pad * 1.6;
    const x = Math.min(Math.max(a.x, 8), S.W - w - 8);
    const y = Math.min(Math.max(a.y, 8), S.H - h - (a.type === 'speech' ? 22 * k : 0) - 8);
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 14 * k;
    ctx.fillStyle = 'rgba(18,19,26,0.88)';
    rr(ctx, x, y, w, h, 12 * k);
    ctx.fill();
    if (a.type === 'speech') {
      ctx.beginPath();
      ctx.moveTo(x + 26 * k, y + h - 1);
      ctx.lineTo(x + 46 * k, y + h - 1);
      ctx.lineTo(x + 30 * k, y + h + 20 * k);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 2.5 * k;
    rr(ctx, x, y, w, h, 12 * k);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    lines.forEach((l, i) => ctx.fillText(l, x + pad, y + pad * 0.4 + (i + 1) * lh - 8 * k));
    ctx.restore();
  }

  function drawAnnotation(ctx, a) {
    if (a.type === 'pen') drawPen(ctx, a);
    else if (a.type === 'rect') drawRect(ctx, a);
    else if (a.type === 'arrow') drawArrow(ctx, a);
    else drawNote(ctx, a);
  }

  function ringGradient(ctx, cx, cy, r, colors) {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1 || 1), c));
    return g;
  }

  function drawBubble(ctx) {
    const b = S.bubble;
    if (!b.on || !S.camVideo || S.camVideo.readyState < 2) return;
    const k = scale();
    const r = b.r * Math.min(S.W, S.H);
    const cx = b.x * S.W, cy = b.y * S.H;
    const t = performance.now() / 1000;

    // face video, circular clip, mirrored, cover-fit
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const vw = S.camVideo.videoWidth || 640, vh = S.camVideo.videoHeight || 480;
    const cover = Math.max((r * 2) / vw, (r * 2) / vh) * 1.02;
    const dw = vw * cover, dh = vh * cover;
    const f = FILTERS[b.filter] || FILTERS.none;
    ctx.translate(cx, cy);
    ctx.scale(-1, 1); // mirror
    if (f.css === 'special') {
      // "blur background": blurred bubble + sharp centre where the face is
      S.camSmallCtx.drawImage(S.camVideo, 0, 0, S.camSmall.width, S.camSmall.height);
      ctx.drawImage(S.camSmall, -dw / 2, -dh / 2, dw, dh);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, -r * 0.08, r * 0.62, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(S.camVideo, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    } else {
      if (f.css) { try { ctx.filter = f.css; } catch {} }
      ctx.drawImage(S.camVideo, -dw / 2, -dh / 2, dw, dh);
    }
    ctx.restore();

    // ring
    const ring = b.ring;
    ctx.save();
    ctx.lineWidth = 7 * k;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3.5 * k, 0, Math.PI * 2);
    if (ring.kind === 'solid') {
      ctx.strokeStyle = ring.colors[0];
      ctx.stroke();
    } else if (ring.kind === 'grad') {
      ctx.strokeStyle = ringGradient(ctx, cx, cy, r, ring.colors);
      ctx.stroke();
    } else if (ring.kind === 'glow') {
      ctx.strokeStyle = ring.colors[0];
      ctx.shadowColor = ring.colors[0];
      ctx.shadowBlur = 30 * k;
      ctx.stroke();
      ctx.stroke();
    } else if (ring.kind === 'rainbow' || ring.kind === 'fire') {
      const spin = ring.kind === 'fire' ? t * 2.4 : t * 0.9;
      let g;
      if (ctx.createConicGradient) {
        g = ctx.createConicGradient(spin, cx, cy);
        const cols = ring.kind === 'fire'
          ? ['#ffdd55', '#ff8800', '#ff3300', '#aa1100', '#ff8800', '#ffdd55']
          : ['#ff5555', '#ffb84d', '#f5e642', '#4dd97a', '#4da6ff', '#b04dff', '#ff5555'];
        cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
      } else {
        g = ring.kind === 'fire' ? '#ff6600' : '#b04dff';
      }
      ctx.strokeStyle = g;
      if (ring.kind === 'fire') {
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = (22 + Math.sin(t * 9) * 8) * k;
        ctx.lineWidth = (8 + Math.sin(t * 7) * 1.6) * k;
      }
      ctx.stroke();
    } else if (ring.kind === 'cloud') {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 26 * k;
      ctx.lineWidth = 10 * k;
      ctx.stroke();
      // drifting soft puffs
      for (let i = 0; i < 7; i++) {
        const a = t * 0.5 + (i * Math.PI * 2) / 7;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * (r + 4 * k), cy + Math.sin(a) * (r + 4 * k), (9 + (i % 3) * 3) * k, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawCaptions(ctx) {
    const c = S.captions;
    if (!c.on || !c.text) return;
    const k = scale();
    ctx.save();
    ctx.font = `700 ${26 * k}px system-ui, sans-serif`;
    const maxW = S.W * 0.82;
    const lines = wrapText(ctx, c.text, maxW).slice(-2);
    const lh = 36 * k, pad = 14 * k;
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2;
    const h = lines.length * lh + pad;
    const x = (S.W - w) / 2, y = S.H - h - 24 * k;
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    rr(ctx, x, y, w, h, 10 * k);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, S.W / 2, y + pad * 0.4 + (i + 1) * lh - 8 * k));
    ctx.restore();
  }

  function render() {
    const ctx = S.ctx;
    if (!S.running) return;
    if (S.srcVideo && S.srcVideo.readyState >= 2) {
      if (S.mode === 'camera' && S.camFilter !== 'none') {
        const f = FILTERS[S.camFilter];
        ctx.save();
        if (f && f.css && f.css !== 'special') { try { ctx.filter = f.css; } catch {} }
        ctx.drawImage(S.srcVideo, 0, 0, S.W, S.H);
        ctx.restore();
      } else {
        ctx.drawImage(S.srcVideo, 0, 0, S.W, S.H);
      }
      drawSpotlight(ctx);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, S.W, S.H);
    }
    for (const a of S.annotations) drawAnnotation(ctx, a);
    if (S.draft) drawAnnotation(ctx, S.draft);
    drawBubble(ctx);
    drawCaptions(ctx);
  }

  function loop() {
    render();
    S.raf = requestAnimationFrame(loop);
  }

  /* ---------- captions (Web Speech API) ---------- */
  function startCaptions() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';
    rec.onresult = (e) => {
      let txt = '';
      for (let i = e.results.length - 1; i >= 0 && txt.length < 110; i--) {
        txt = e.results[i][0].transcript + ' ' + txt;
      }
      S.captions.text = txt.trim().slice(-110);
    };
    rec.onend = () => { if (S.captions.on && S.running) { try { rec.start(); } catch {} } };
    rec.onerror = () => {};
    try { rec.start(); S.captions.rec = rec; } catch {}
  }

  function stopCaptions() {
    if (S.captions.rec) { try { S.captions.rec.onend = null; S.captions.rec.stop(); } catch {} }
    S.captions.rec = null;
    S.captions.text = '';
  }

  /* ---------- pointer tools ---------- */
  function onDown(e) {
    if (!S.running) return;
    e.preventDefault();
    const pop = document.getElementById('stylePop');
    if (!pop.hidden) pop.hidden = true; // tapping the canvas dismisses the style panel
    const p = pt(e);
    S.canvas.setPointerCapture(e.pointerId);
    const b = S.bubble;
    const r = b.r * Math.min(S.W, S.H);
    if (S.tool === 'move') {
      if (b.on && Math.hypot(p.x - b.x * S.W, p.y - b.y * S.H) <= r + 12) {
        S.dragging = { kind: 'bubble' };
      } else if (S.spotlight) {
        const sp = S.spotlight;
        if (p.x >= sp.x && p.x <= sp.x + sp.w && p.y >= sp.y && p.y <= sp.y + sp.h) {
          S.dragging = { kind: 'spot', ox: p.x - sp.x, oy: p.y - sp.y };
        }
      }
      return;
    }
    if (S.tool === 'pen') S.draft = { type: 'pen', color: S.penColor, points: [p] };
    else if (S.tool === 'rect') S.draft = { type: 'rect', color: S.penColor, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    else if (S.tool === 'arrow') S.draft = { type: 'arrow', color: S.penColor, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    else if (S.tool === 'spot') S.dragging = { kind: 'newspot', x1: p.x, y1: p.y };
    else if (S.tool === 'note' || S.tool === 'speech') openNoteInput(e, p, S.tool);
  }

  function onMove(e) {
    if (!S.running) return;
    const p = pt(e);
    if (S.dragging) {
      if (S.dragging.kind === 'bubble') {
        S.bubble.x = Math.min(Math.max(p.x / S.W, 0.05), 0.95);
        S.bubble.y = Math.min(Math.max(p.y / S.H, 0.07), 0.93);
      } else if (S.dragging.kind === 'spot') {
        const sp = S.spotlight;
        sp.x = Math.min(Math.max(p.x - S.dragging.ox, 0), S.W - sp.w);
        sp.y = Math.min(Math.max(p.y - S.dragging.oy, 0), S.H - sp.h);
      } else if (S.dragging.kind === 'newspot') {
        const d = S.dragging;
        S.spotlight = {
          x: Math.min(d.x1, p.x), y: Math.min(d.y1, p.y),
          w: Math.abs(p.x - d.x1), h: Math.abs(p.y - d.y1),
        };
      }
      return;
    }
    if (!S.draft) return;
    if (S.draft.type === 'pen') S.draft.points.push(p);
    else { S.draft.x2 = p.x; S.draft.y2 = p.y; }
  }

  function onUp() {
    if (S.dragging) {
      if (S.dragging.kind === 'newspot' && S.spotlight && (S.spotlight.w < 24 || S.spotlight.h < 24)) {
        S.spotlight = null; // a tap/tiny drag clears the spotlight
      }
      S.dragging = null;
      return;
    }
    if (!S.draft) return;
    const d = S.draft;
    const big = d.type === 'pen' ? d.points.length > 2 : Math.hypot(d.x2 - d.x1, d.y2 - d.y1) > 10;
    if (big) S.annotations.push(d);
    S.draft = null;
  }

  function openNoteInput(e, p, type) {
    const input = document.getElementById('noteInput');
    const r = S.canvas.getBoundingClientRect();
    input.hidden = false;
    input.value = '';
    input.style.left = Math.min(e.clientX, r.right - 220) + 'px';
    input.style.top = Math.min(e.clientY, r.bottom - 60) + 'px';
    input.dataset.x = p.x; input.dataset.y = p.y; input.dataset.type = type;
    setTimeout(() => input.focus(), 50);
  }

  function commitNote() {
    const input = document.getElementById('noteInput');
    const text = input.value.trim();
    if (text) {
      S.annotations.push({
        type: input.dataset.type, text,
        x: parseFloat(input.dataset.x), y: parseFloat(input.dataset.y),
        color: S.penColor,
      });
    }
    input.hidden = true;
    input.value = '';
  }

  /* ---------- toolbar wiring ---------- */
  function setTool(tool) {
    S.tool = tool;
    document.querySelectorAll('#toolbar .tl').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    S.canvas.style.cursor = tool === 'move' ? 'grab' : 'crosshair';
  }

  function buildStylePopover() {
    const pop = document.getElementById('stylePop');
    const ringRow = pop.querySelector('#ringRow');
    const filterRow = pop.querySelector('#filterRow');
    ringRow.innerHTML = '';
    filterRow.innerHTML = '';
    const ringCSS = {
      purple: '#625df5', red: '#e5484d', teal: '#12b886', white: '#fff',
      sunset: 'linear-gradient(135deg,#ff6b6b,#feca57,#ff9ff3)',
      ocean: 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
      candy: 'linear-gradient(135deg,#ff9ff3,#a29bfe,#74b9ff)',
      rainbow: 'conic-gradient(#ff5555,#ffb84d,#f5e642,#4dd97a,#4da6ff,#b04dff,#ff5555)',
      glow: 'radial-gradient(circle,#a78bfa 40%,transparent 75%)',
      fire: 'conic-gradient(#ffdd55,#ff8800,#ff3300,#aa1100,#ff8800,#ffdd55)',
      cloud: 'radial-gradient(circle,#fff 45%,#cfd8ff 100%)',
    };
    for (const name of Object.keys(RINGS)) {
      const chip = document.createElement('button');
      chip.className = 'ring-chip' + (S.bubble.ringName === name ? ' active' : '');
      chip.style.background = ringCSS[name];
      chip.title = name;
      chip.onclick = () => {
        S.bubble.ring = RINGS[name];
        S.bubble.ringName = name;
        ringRow.querySelectorAll('.ring-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        setTimeout(() => { pop.hidden = true; }, 350);
      };
      ringRow.appendChild(chip);
    }
    const custom = document.createElement('input');
    custom.type = 'color';
    custom.value = '#625df5';
    custom.className = 'ring-custom';
    custom.title = 'Custom color';
    custom.oninput = () => {
      S.bubble.ring = { kind: 'glow', colors: [custom.value] };
      S.bubble.ringName = 'custom';
      ringRow.querySelectorAll('.ring-chip').forEach(c => c.classList.remove('active'));
    };
    ringRow.appendChild(custom);

    for (const key of Object.keys(FILTERS)) {
      const chip = document.createElement('button');
      const isActive = S.mode === 'camera' ? S.camFilter === key : S.bubble.filter === key;
      chip.className = 'filter-chip' + (isActive ? ' active' : '');
      chip.textContent = FILTERS[key].label;
      chip.onclick = () => {
        if (S.mode === 'camera') S.camFilter = key; else S.bubble.filter = key;
        filterRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        setTimeout(() => { pop.hidden = true; }, 350);
      };
      filterRow.appendChild(chip);
    }
    pop.querySelector('#ringSection').hidden = !(S.mode === 'screen' && S.bubble.on);
  }

  function wire() {
    if (S.wired) return;
    S.wired = true;
    const c = stage();
    c.addEventListener('pointerdown', onDown);
    c.addEventListener('pointermove', onMove);
    c.addEventListener('pointerup', onUp);
    c.addEventListener('pointercancel', onUp);

    document.querySelectorAll('#toolbar .tl').forEach(b =>
      b.addEventListener('click', () => setTool(b.dataset.tool)));
    document.getElementById('undoBtn').addEventListener('click', () => S.annotations.pop());
    document.getElementById('clearBtn').addEventListener('click', () => {
      S.annotations = [];
      S.spotlight = null;
    });
    document.getElementById('penColor').addEventListener('input', e => { S.penColor = e.target.value; });

    const ccBtn = document.getElementById('ccBtn');
    ccBtn.addEventListener('click', () => {
      S.captions.on = !S.captions.on;
      ccBtn.classList.toggle('active', S.captions.on);
      if (S.captions.on) startCaptions(); else stopCaptions();
    });

    const styleBtn = document.getElementById('styleBtn');
    const pop = document.getElementById('stylePop');
    styleBtn.addEventListener('click', () => {
      pop.hidden = !pop.hidden;
      if (!pop.hidden) buildStylePopover();
    });
    document.getElementById('stylePopClose').addEventListener('click', () => { pop.hidden = true; });

    const noteInput = document.getElementById('noteInput');
    noteInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') commitNote();
      if (e.key === 'Escape') { noteInput.hidden = true; }
    });
    noteInput.addEventListener('blur', commitNote);
  }

  /* ---------- lifecycle ---------- */
  async function start({ sourceStream, camStream, mode }) {
    wire();
    S.mode = mode;
    S.annotations = [];
    S.draft = null;
    S.spotlight = null;
    S.captions.on = false;
    S.captions.text = '';
    S.bubble.on = mode === 'screen' && !!camStream;

    S.srcVideo = document.createElement('video');
    S.srcVideo.muted = true;
    S.srcVideo.playsInline = true;
    S.srcVideo.srcObject = new MediaStream(sourceStream.getVideoTracks());
    await S.srcVideo.play().catch(() => {});

    if (camStream) {
      S.camVideo = document.createElement('video');
      S.camVideo.muted = true;
      S.camVideo.playsInline = true;
      S.camVideo.srcObject = camStream;
      await S.camVideo.play().catch(() => {});
    } else {
      S.camVideo = null;
    }

    const st = sourceStream.getVideoTracks()[0].getSettings();
    let w = st.width || 1280, h = st.height || 720;
    const cap = 1920 / Math.max(w, h);
    if (cap < 1) { w = Math.round(w * cap); h = Math.round(h * cap); }
    S.W = w; S.H = h;

    S.canvas = stage();
    S.canvas.width = w;
    S.canvas.height = h;
    S.ctx = S.canvas.getContext('2d');

    S.small = document.createElement('canvas');
    S.small.width = Math.max(2, Math.round(w / 14));
    S.small.height = Math.max(2, Math.round(h / 14));
    S.smallCtx = S.small.getContext('2d');
    S.camSmall = document.createElement('canvas');
    S.camSmall.width = 64; S.camSmall.height = 48;
    S.camSmallCtx = S.camSmall.getContext('2d');

    S.captions.supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    document.getElementById('ccBtn').hidden = !S.captions.supported;
    document.getElementById('ccBtn').classList.remove('active');
    setTool('move');
    document.getElementById('stylePop').hidden = true;

    document.getElementById('studio').hidden = false;
    document.body.classList.add('in-studio');

    S.running = true;
    loop();
    // Background tabs stop requestAnimationFrame, which would freeze the
    // recording while you present another app — a worker timer keeps frames
    // flowing (worker timers aren't throttled like page timers).
    const workerSrc = URL.createObjectURL(new Blob(
      ['setInterval(() => postMessage(0), 33);'], { type: 'text/javascript' }));
    S.ticker = new Worker(workerSrc);
    S.ticker.onmessage = () => { if (document.hidden) render(); };
    URL.revokeObjectURL(workerSrc);

    return S.canvas.captureStream(30);
  }

  function stop() {
    S.running = false;
    cancelAnimationFrame(S.raf);
    if (S.ticker) { S.ticker.terminate(); S.ticker = null; }
    stopCaptions();
    S.captions.on = false;
    if (S.srcVideo) { S.srcVideo.srcObject = null; S.srcVideo = null; }
    if (S.camVideo) { S.camVideo.srcObject = null; S.camVideo = null; }
    document.getElementById('studio').hidden = true;
    document.getElementById('noteInput').hidden = true;
    document.getElementById('stylePop').hidden = true;
    document.body.classList.remove('in-studio');
  }

  return { start, stop, _state: S };
})();
