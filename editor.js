/* MaherCast Editor — trim, background music and attention zooms,
   entirely in the browser. Export re-renders the recording through a
   canvas + Web Audio mix in real time and saves back to the library. */

const Editor = (() => {
  const $ = id => document.getElementById(id);

  const E = {
    rec: null, url: null,
    video: null,
    canvas: null, ctx: null, W: 1280, H: 720,
    duration: 0, trimStart: 0, trimEnd: 0,
    zooms: [],            // { start, end, rect:{x,y,w,h} }
    music: null,          // { blobUrl, name }
    raf: 0, playing: false,
    zoomDraw: false, draft: null,
    exporting: false,
    musicPreview: null,
    onSaved: null,
  };

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const smooth = x => x * x * (3 - 2 * x);

  /* ---------- zoom math ---------- */
  function zoomRectAt(t) {
    for (const z of E.zooms) {
      if (t >= z.start && t <= z.end) {
        const ramp = Math.min(0.6, (z.end - z.start) / 2);
        const k = smooth(Math.min(1, Math.min((t - z.start) / ramp, (z.end - t) / ramp)));
        const full = { x: 0, y: 0, w: E.W, h: E.H };
        return {
          x: full.x + (z.rect.x - full.x) * k,
          y: full.y + (z.rect.y - full.y) * k,
          w: full.w + (z.rect.w - full.w) * k,
          h: full.h + (z.rect.h - full.h) * k,
        };
      }
    }
    return null;
  }

  function draw(video, t) {
    const ctx = E.ctx;
    const z = zoomRectAt(t);
    if (z) ctx.drawImage(video, z.x, z.y, z.w, z.h, 0, 0, E.W, E.H);
    else ctx.drawImage(video, 0, 0, E.W, E.H);
    if (E.draft) {
      ctx.save();
      ctx.strokeStyle = '#625df5';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 3 * (E.W / 1280);
      ctx.fillStyle = 'rgba(98,93,245,0.12)';
      const d = E.draft;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeRect(d.x, d.y, d.w, d.h);
      ctx.restore();
    }
  }

  /* ---------- preview ---------- */
  function loop() {
    if (!E.video) return;
    const t = E.video.currentTime;
    if (E.playing && t >= E.trimEnd) pause();
    draw(E.video, t);
    updatePlayhead();
    E.raf = requestAnimationFrame(loop);
  }

  function play() {
    if (E.exporting) return;
    if (E.video.currentTime < E.trimStart || E.video.currentTime >= E.trimEnd - 0.05) {
      E.video.currentTime = E.trimStart;
    }
    E.video.play();
    E.playing = true;
    $('edPlay').textContent = '⏸';
    if (E.musicPreview) {
      E.musicPreview.currentTime = Math.max(0, E.video.currentTime - E.trimStart) % (E.musicPreview.duration || 1e9);
      E.musicPreview.volume = $('musicVol').value / 100;
      E.musicPreview.play().catch(() => {});
    }
  }

  function pause() {
    E.video.pause();
    E.playing = false;
    $('edPlay').textContent = '▶️';
    if (E.musicPreview) E.musicPreview.pause();
  }

  function seek(t) {
    t = Math.min(Math.max(t, 0), E.duration);
    E.video.currentTime = t;
    if (E.musicPreview && E.playing) E.musicPreview.currentTime = Math.max(0, t - E.trimStart) % (E.musicPreview.duration || 1e9);
  }

  /* ---------- timeline ---------- */
  const pct = t => (t / E.duration) * 100;

  function updatePlayhead() {
    $('tlPlayhead').style.left = pct(E.video.currentTime) + '%';
    $('edTime').textContent = `${fmt(E.video.currentTime)} / ${fmt(E.duration)}`;
  }

  function renderTimeline() {
    $('hLeft').style.left = pct(E.trimStart) + '%';
    $('hRight').style.left = pct(E.trimEnd) + '%';
    const trim = $('tlTrim');
    trim.style.left = pct(E.trimStart) + '%';
    trim.style.width = pct(E.trimEnd - E.trimStart) + '%';
    const zl = $('tlZooms');
    zl.innerHTML = '';
    E.zooms.forEach(z => {
      const m = document.createElement('div');
      m.className = 'tl-zoom';
      m.style.left = pct(z.start) + '%';
      m.style.width = Math.max(0.8, pct(z.end - z.start)) + '%';
      zl.appendChild(m);
    });
    renderZoomChips();
  }

  function renderZoomChips() {
    const list = $('zoomList');
    list.innerHTML = '';
    E.zooms.forEach((z, i) => {
      const chip = document.createElement('button');
      chip.className = 'zoom-chip';
      chip.innerHTML = `🔍 ${fmt(z.start)}–${fmt(z.end)} <b>✕</b>`;
      chip.title = 'Tap to jump, ✕ to remove';
      chip.onclick = (e) => {
        if (e.target.tagName === 'B') { E.zooms.splice(i, 1); renderTimeline(); }
        else seek(z.start + 0.05);
      };
      list.appendChild(chip);
    });
  }

  function wireTimeline() {
    const tl = $('timeline');
    let dragging = null; // 'seek' | 'left' | 'right'
    const timeAt = e => {
      const r = tl.getBoundingClientRect();
      return Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * E.duration;
    };
    tl.addEventListener('pointerdown', e => {
      tl.setPointerCapture(e.pointerId);
      if (e.target.id === 'hLeft') dragging = 'left';
      else if (e.target.id === 'hRight') dragging = 'right';
      else { dragging = 'seek'; seek(timeAt(e)); }
    });
    tl.addEventListener('pointermove', e => {
      if (!dragging) return;
      const t = timeAt(e);
      if (dragging === 'seek') seek(t);
      else if (dragging === 'left') { E.trimStart = Math.min(t, E.trimEnd - 1); renderTimeline(); }
      else { E.trimEnd = Math.max(t, E.trimStart + 1); renderTimeline(); }
    });
    tl.addEventListener('pointerup', () => { dragging = null; });
  }

  /* ---------- zoom drawing on the stage ---------- */
  function stagePt(e) {
    const r = E.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (E.W / r.width), y: (e.clientY - r.top) * (E.H / r.height) };
  }

  function wireStage() {
    const c = E.canvas;
    let start = null;
    c.addEventListener('pointerdown', e => {
      if (!E.zoomDraw) return;
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      start = stagePt(e);
      E.draft = { x: start.x, y: start.y, w: 0, h: 0 };
    });
    c.addEventListener('pointermove', e => {
      if (!E.zoomDraw || !start) return;
      const p = stagePt(e);
      E.draft = {
        x: Math.min(start.x, p.x), y: Math.min(start.y, p.y),
        w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y),
      };
      if (!E.playing) draw(E.video, E.video.currentTime);
    });
    c.addEventListener('pointerup', () => {
      if (!E.zoomDraw || !start) return;
      start = null;
      const d = E.draft;
      E.draft = null;
      E.zoomDraw = false;
      $('addZoomBtn').classList.remove('active');
      E.canvas.style.cursor = '';
      if (!d || d.w < 30 || d.h < 30) { toastEd('Zoom cancelled — drag a bigger area'); return; }
      // match canvas aspect so the zoom fills the frame, clamp inside it
      const aspect = E.W / E.H;
      let { x, y, w, h } = d;
      if (w / h > aspect) h = w / aspect; else w = h * aspect;
      w = Math.max(w, E.W * 0.18); h = w / aspect;
      w = Math.min(w, E.W); h = Math.min(h, E.H);
      x = Math.min(Math.max(x + d.w / 2 - w / 2, 0), E.W - w);
      y = Math.min(Math.max(y + d.h / 2 - h / 2, 0), E.H - h);
      const dur = parseFloat($('zoomDur').value);
      const start_t = Math.min(E.video.currentTime, E.duration - 0.5);
      E.zooms.push({ start: start_t, end: Math.min(start_t + dur, E.duration), rect: { x, y, w, h } });
      E.zooms.sort((a, b) => a.start - b.start);
      renderTimeline();
      toastEd('🔍 Zoom added — press play to preview');
      if (!E.playing) draw(E.video, E.video.currentTime);
    });
  }

  function toastEd(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.hidden = true; }, 2600);
  }

  /* ---------- export ---------- */
  function pickMime() {
    // See app.js pickMime() — Chrome's "video/mp4" output is fragmented MP4,
    // which WhatsApp and many editors reject despite the .mp4 name. WebM first.
    const c = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1', 'video/mp4'];
    for (const m of c) if (MediaRecorder.isTypeSupported(m)) return m;
    return '';
  }

  async function doExport() {
    if (E.exporting) return;
    E.exporting = true;
    pause();
    const status = $('exportStatus');
    const btn = $('exportBtn');
    btn.disabled = true;
    try {
      const expV = document.createElement('video');
      expV.src = E.url;
      expV.playsInline = true;
      expV.preload = 'auto';
      await new Promise((res, rej) => { expV.onloadedmetadata = res; expV.onerror = rej; });

      const actx = new AudioContext();
      await actx.resume();
      const dest = actx.createMediaStreamDestination();
      const vGain = actx.createGain();
      vGain.gain.value = $('voiceVol').value / 100;
      actx.createMediaElementSource(expV).connect(vGain);
      vGain.connect(dest);

      let musicEl = null, mGain = null;
      if (E.music) {
        musicEl = new Audio(E.music.blobUrl);
        musicEl.loop = true;
        mGain = actx.createGain();
        mGain.gain.value = $('musicVol').value / 100;
        actx.createMediaElementSource(musicEl).connect(mGain);
        mGain.connect(dest);
      }

      const cs = E.canvas.captureStream(30);
      const out = new MediaStream([...cs.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const mime = pickMime();
      const recorder = new MediaRecorder(out, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const stopped = new Promise(r => { recorder.onstop = r; });

      expV.currentTime = E.trimStart;
      await new Promise(r => { expV.onseeked = r; setTimeout(r, 2500); });

      cancelAnimationFrame(E.raf); // take over the canvas
      recorder.start(1000);
      await expV.play();
      if (musicEl) musicEl.play().catch(() => {});

      const total = E.trimEnd - E.trimStart;
      // A worker timer (not rAF) drives the export so it keeps running even
      // if the tab is backgrounded — rAF stops firing in hidden tabs.
      await new Promise(resolve => {
        const workerSrc = URL.createObjectURL(new Blob(
          ['setInterval(() => postMessage(0), 33);'], { type: 'text/javascript' }));
        const ticker = new Worker(workerSrc);
        URL.revokeObjectURL(workerSrc);
        ticker.onmessage = () => {
          const t = expV.currentTime;
          draw(expV, t);
          status.textContent = `Exporting… ${fmt(Math.min(Math.max(t - E.trimStart, 0), total))} / ${fmt(total)}`;
          if (mGain) { // gentle music fade in the last 2 seconds
            const left = E.trimEnd - t;
            mGain.gain.value = ($('musicVol').value / 100) * Math.min(1, Math.max(left, 0) / 2);
          }
          if (t >= E.trimEnd || expV.ended) { ticker.terminate(); resolve(); }
        };
      });

      recorder.stop();
      expV.pause();
      if (musicEl) musicEl.pause();
      await stopped;
      actx.close().catch(() => {});

      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      status.textContent = 'Saving…';
      await E.onSaved({
        name: E.rec.name.replace(/ \(edited.*\)$/, '') + ' (edited)',
        blob,
        mime: recorder.mimeType || 'video/webm',
        duration: total,
      });
      status.textContent = '';
      toastEd('✅ Edited video saved to your library');
      E.exporting = false;
      $('exportBtn').disabled = false;
      close();
      return;
    } catch (err) {
      status.textContent = '';
      toastEd('Export failed: ' + err.message);
      E.exporting = false;
      btn.disabled = false;
      loop();
      return;
    }
    E.exporting = false;
    btn.disabled = false;
  }

  /* ---------- lifecycle ---------- */
  function wire() {
    if (E.wired) return;
    E.wired = true;
    $('edClose').addEventListener('click', close);
    $('edPlay').addEventListener('click', () => (E.playing ? pause() : play()));
    $('addZoomBtn').addEventListener('click', () => {
      E.zoomDraw = !E.zoomDraw;
      $('addZoomBtn').classList.toggle('active', E.zoomDraw);
      E.canvas.style.cursor = E.zoomDraw ? 'crosshair' : '';
      if (E.zoomDraw) toastEd('Drag over the area you want to zoom into');
    });
    $('musicFile').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      if (E.music) URL.revokeObjectURL(E.music.blobUrl);
      E.music = { blobUrl: URL.createObjectURL(f), name: f.name };
      $('musicName').textContent = '🎵 ' + f.name;
      if (E.musicPreview) E.musicPreview.pause();
      E.musicPreview = new Audio(E.music.blobUrl);
      E.musicPreview.loop = true;
    });
    $('musicVol').addEventListener('input', e => {
      if (E.musicPreview) E.musicPreview.volume = e.target.value / 100;
    });
    $('voiceVol').addEventListener('input', e => {
      if (E.video) E.video.volume = e.target.value / 100;
    });
    $('exportBtn').addEventListener('click', doExport);
    wireTimeline();
  }

  async function open(rec, onSaved) {
    E.rec = rec;
    E.onSaved = onSaved;
    E.canvas = $('edStage');
    wire();
    wireStage._done || (wireStage(), wireStage._done = true);

    E.url = URL.createObjectURL(rec.blob);
    E.video = document.createElement('video');
    E.video.src = E.url;
    E.video.playsInline = true;
    E.video.preload = 'auto';
    await new Promise((res, rej) => { E.video.onloadedmetadata = res; E.video.onerror = rej; });
    E.duration = isFinite(E.video.duration) && E.video.duration > 0 ? E.video.duration : (rec.duration || 60);

    let w = E.video.videoWidth || 1280, h = E.video.videoHeight || 720;
    const cap = 1920 / Math.max(w, h);
    if (cap < 1) { w = Math.round(w * cap); h = Math.round(h * cap); }
    E.W = w; E.H = h;
    E.canvas.width = w;
    E.canvas.height = h;
    E.ctx = E.canvas.getContext('2d');

    E.trimStart = 0;
    E.trimEnd = E.duration;
    E.zooms = [];
    E.playing = false;
    E.exporting = false;
    E.draft = null;
    E.zoomDraw = false;
    $('edPlay').textContent = '▶️';
    $('edTitle').textContent = '✂️ ' + rec.name;
    $('exportStatus').textContent = '';
    $('exportBtn').disabled = false;
    $('addZoomBtn').classList.remove('active');

    $('editor').hidden = false;
    document.body.classList.add('in-studio');
    E.video.currentTime = 0.01;
    renderTimeline();
    loop();
  }

  function close() {
    if (E.exporting) { toastEd('Still exporting — please wait'); return; }
    cancelAnimationFrame(E.raf);
    pause();
    if (E.video) { E.video.src = ''; E.video = null; }
    if (E.url) { URL.revokeObjectURL(E.url); E.url = null; }
    if (E.musicPreview) { E.musicPreview.pause(); }
    $('editor').hidden = true;
    document.body.classList.remove('in-studio');
  }

  return { open, close, _state: E };
})();
