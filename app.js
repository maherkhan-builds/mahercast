/* MaherCast — recording logic, local library (IndexedDB), share links */

const $ = id => document.getElementById(id);

const state = {
  mode: 'screen',
  recorder: null,
  chunks: [],
  streams: [],
  startedAt: 0,
  pausedTotal: 0,
  pausedAt: 0,
  timerInt: null,
  current: null, // recording open in the player modal
};

const supportsScreen = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

// Share links need the MaherCast server (static hosts like GitHub Pages can't store uploads).
let hasServer = false;
fetch('api/recordings').then(r => {
  hasServer = r.ok && (r.headers.get('content-type') || '').includes('json');
}).catch(() => {});

/* ---------- IndexedDB ---------- */
let db;
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('mahercast', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('recordings', { keyPath: 'id' });
    req.onsuccess = () => { db = req.result; resolve(); };
    req.onerror = () => reject(req.error);
  });
}
function dbPut(rec) {
  return new Promise((res, rej) => {
    const tx = db.transaction('recordings', 'readwrite');
    tx.objectStore('recordings').put(rec);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
function dbAll() {
  return new Promise((res, rej) => {
    const req = db.transaction('recordings').objectStore('recordings').getAll();
    req.onsuccess = () => res(req.result.sort((a, b) => b.createdAt - a.createdAt));
    req.onerror = () => rej(req.error);
  });
}
function dbDelete(id) {
  return new Promise((res, rej) => {
    const tx = db.transaction('recordings', 'readwrite');
    tx.objectStore('recordings').delete(id);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}

/* ---------- helpers ---------- */
function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.hidden = true; }, ms);
}

function fmt(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function pickMime() {
  const candidates = [
    'video/mp4;codecs=avc1',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  // Safari records mp4; Chrome/Firefox webm. Prefer whatever the browser supports.
  if (window.MediaRecorder) {
    for (const c of candidates) if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

async function makeThumb(blob) {
  try {
    const url = URL.createObjectURL(blob);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.src = url;
    await new Promise((res, rej) => {
      v.onloadeddata = res; v.onerror = rej;
      setTimeout(rej, 4000);
    });
    v.currentTime = Math.min(0.3, (v.duration || 1) / 2);
    await new Promise(res => { v.onseeked = res; setTimeout(res, 1500); });
    const c = document.createElement('canvas');
    c.width = 320; c.height = Math.round(320 * (v.videoHeight / v.videoWidth)) || 200;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return c.toDataURL('image/jpeg', 0.7);
  } catch { return null; }
}

/* ---------- mode tabs ---------- */
const hints = {
  screen: 'Records your screen — switch apps, everything is captured.',
  camera: 'Records your camera and mic. Perfect for talking-head videos.',
};

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  $('modeHint').textContent = hints[mode];
  $('bubbleToggleWrap').style.display = mode === 'screen' && supportsScreen ? '' : 'none';
}

$('modeTabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if (btn && !btn.disabled) setMode(btn.dataset.mode);
});

if (!supportsScreen) {
  $('tabScreen').disabled = true;
  $('unsupportedMsg').hidden = false;
  setMode('camera');
}

/* ---------- recording ---------- */
async function countdown() {
  const el = $('countdown'), num = $('countNum');
  el.hidden = false;
  for (const n of [3, 2, 1]) {
    num.textContent = n;
    await new Promise(r => setTimeout(r, 900));
  }
  el.hidden = true;
}

async function getStream() {
  const wantMic = $('micToggle').checked;
  if (state.mode === 'screen') {
    const screen = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: true, // system/tab audio where the browser allows it
      selfBrowserSurface: 'exclude',  // keep MaherCast's own tab out of the picker
      surfaceSwitching: 'include',    // let the user switch shared tab mid-recording
      systemAudio: 'include',
    });
    state.streams.push(screen);
    const surface = screen.getVideoTracks()[0].getSettings().displaySurface;
    if (surface === 'monitor') {
      toast('🖥 Recording the entire screen — switch to the app you\'re teaching from; use this tab to annotate.', 5000);
    }
    const tracks = [...screen.getVideoTracks(), ...screen.getAudioTracks()];
    if (wantMic) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
        state.streams.push(mic);
        tracks.push(...mic.getAudioTracks());
      } catch { toast('Mic unavailable — recording without it'); }
    }
    // If both system audio and mic exist, mix them so both end up in one track.
    const audioTracks = tracks.filter(t => t.kind === 'audio');
    if (audioTracks.length > 1) {
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      audioTracks.forEach(t => ctx.createMediaStreamSource(new MediaStream([t])).connect(dest));
      state.audioCtx = ctx;
      return new MediaStream([...screen.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    }
    return new MediaStream(tracks);
  }
  // camera mode
  const cam = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 } },
    audio: wantMic,
  });
  state.streams.push(cam);
  return cam;
}

async function startRecording() {
  if (!window.MediaRecorder) { toast('MediaRecorder not supported in this browser'); return; }
  let stream;
  try {
    stream = await getStream();
  } catch (e) {
    if (e.name !== 'NotAllowedError') toast('Could not start: ' + e.message);
    return;
  }

  let camStream = null;
  if (state.mode === 'screen' && $('bubbleToggle').checked) {
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640 } });
      state.streams.push(camStream);
    } catch { toast('Camera bubble unavailable'); }
  }

  if ($('countToggle').checked) await countdown();

  // Everything (screen/camera + bubble + annotations + captions) is composited
  // onto the Studio canvas, and the canvas is what gets recorded.
  const canvasStream = await Studio.start({ sourceStream: stream, camStream, mode: state.mode });
  const output = new MediaStream([...canvasStream.getVideoTracks(), ...stream.getAudioTracks()]);

  const mime = pickMime();
  state.chunks = [];
  state.recorder = new MediaRecorder(output, mime ? { mimeType: mime } : undefined);
  state.recorder.ondataavailable = e => { if (e.data.size) state.chunks.push(e.data); };
  state.recorder.onstop = finishRecording;
  // Stop when user ends screen share from the browser's own UI
  stream.getVideoTracks()[0].addEventListener('ended', () => {
    if (state.recorder && state.recorder.state !== 'inactive') state.recorder.stop();
  });
  state.recorder.start(1000);
  state.startedAt = Date.now();
  state.pausedTotal = 0;

  $('recBar').hidden = false;
  $('recordBtn').disabled = true;
  state.timerInt = setInterval(() => {
    if (state.recorder && state.recorder.state === 'recording') {
      $('timer').textContent = fmt((Date.now() - state.startedAt - state.pausedTotal) / 1000);
    }
  }, 250);
}

async function finishRecording() {
  clearInterval(state.timerInt);
  const duration = (Date.now() - state.startedAt - state.pausedTotal) / 1000;
  const mime = state.recorder.mimeType || 'video/webm';
  const blob = new Blob(state.chunks, { type: mime });
  state.chunks = [];
  Studio.stop();
  state.streams.forEach(s => s.getTracks().forEach(t => t.stop()));
  state.streams = [];
  if (state.audioCtx) { state.audioCtx.close().catch(() => {}); state.audioCtx = null; }
  $('recBar').hidden = true;
  $('recordBtn').disabled = false;
  $('pauseBtn').textContent = '⏸';

  if (!blob.size) { toast('Recording was empty'); return; }

  const rec = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    blob, mime, duration,
    createdAt: Date.now(),
    shareId: null,
  };
  rec.thumb = await makeThumb(blob);
  await dbPut(rec);
  await renderLibrary();
  toast('✅ Recording saved to your library');
  openPlayer(rec);
}

$('recordBtn').addEventListener('click', startRecording);
$('stopBtn').addEventListener('click', () => {
  if (state.recorder && state.recorder.state !== 'inactive') state.recorder.stop();
});
$('pauseBtn').addEventListener('click', () => {
  const r = state.recorder;
  if (!r) return;
  if (r.state === 'recording') {
    r.pause();
    state.pausedAt = Date.now();
    $('pauseBtn').textContent = '▶️';
  } else if (r.state === 'paused') {
    r.resume();
    state.pausedTotal += Date.now() - state.pausedAt;
    $('pauseBtn').textContent = '⏸';
  }
});

/* ---------- library ---------- */
async function renderLibrary() {
  const recs = await dbAll();
  const grid = $('libraryGrid');
  grid.innerHTML = '';
  $('libEmpty').hidden = recs.length > 0;
  $('libCount').textContent = recs.length ? `(${recs.length})` : '';
  for (const rec of recs) {
    const card = document.createElement('div');
    card.className = 'rec-card';
    card.innerHTML = `
      <div class="thumb-wrap">
        ${rec.thumb ? `<img class="thumb" src="${rec.thumb}" alt="">` : '<div class="thumb"></div>'}
        <span class="dur">${fmt(rec.duration)}</span>
      </div>
      <div class="rec-info">
        <div class="rec-name"></div>
        <div class="rec-date">${new Date(rec.createdAt).toLocaleString()} ${rec.shareId ? '<span class="cloud-badge">· 🔗 shared</span>' : ''}</div>
      </div>`;
    card.querySelector('.rec-name').textContent = rec.name;
    card.addEventListener('click', () => openPlayer(rec));
    grid.appendChild(card);
  }
}

/* ---------- player modal ---------- */
function openPlayer(rec) {
  state.current = rec;
  const url = URL.createObjectURL(rec.blob);
  const player = $('player');
  player.src = url;
  // webm blobs often report Infinity duration; nudge it so seeking works
  player.onloadedmetadata = () => {
    if (player.duration === Infinity) {
      player.currentTime = 1e7;
      player.ontimeupdate = () => { player.ontimeupdate = null; player.currentTime = 0; };
    }
  };
  $('nameInput').value = rec.name;
  $('recMeta').textContent = `${fmt(rec.duration)} · ${(rec.blob.size / 1048576).toFixed(1)} MB`;
  $('speedSel').value = '1';
  player.playbackRate = 1;
  $('shareLinkBtn').hidden = !hasServer;
  $('playerModal').hidden = false;
}

function closePlayer() {
  const player = $('player');
  player.pause();
  if (player.src) URL.revokeObjectURL(player.src);
  player.removeAttribute('src');
  $('playerModal').hidden = true;
  state.current = null;
}

$('closeModal').addEventListener('click', closePlayer);
$('playerModal').addEventListener('click', e => { if (e.target === $('playerModal')) closePlayer(); });
$('speedSel').addEventListener('change', e => { $('player').playbackRate = parseFloat(e.target.value); });

$('nameInput').addEventListener('change', async () => {
  if (!state.current) return;
  state.current.name = $('nameInput').value.trim() || 'Untitled';
  await dbPut(state.current);
  renderLibrary();
});

function ext(mime) { return mime.includes('mp4') ? 'mp4' : 'webm'; }

$('downloadBtn').addEventListener('click', () => {
  const rec = state.current;
  if (!rec) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(rec.blob);
  a.download = `${rec.name.replace(/[^\w\- ]+/g, '')}.${ext(rec.mime)}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});

$('shareFileBtn').addEventListener('click', async () => {
  const rec = state.current;
  if (!rec) return;
  const file = new File([rec.blob], `${rec.name.replace(/[^\w\- ]+/g, '')}.${ext(rec.mime)}`, { type: rec.mime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: rec.name }); } catch {}
  } else {
    toast('Native sharing not available here — use Download or Copy link');
  }
});

$('shareLinkBtn').addEventListener('click', async () => {
  const rec = state.current;
  if (!rec) return;
  const btn = $('shareLinkBtn');
  try {
    if (!rec.shareId) {
      btn.textContent = '⏳ Uploading…';
      btn.disabled = true;
      const res = await fetch(`api/upload?name=${encodeURIComponent(rec.name)}&duration=${rec.duration}`, {
        method: 'POST',
        headers: { 'Content-Type': rec.mime },
        body: rec.blob,
      });
      if (!res.ok) throw new Error('upload failed');
      const data = await res.json();
      rec.shareId = data.id;
      await dbPut(rec);
      renderLibrary();
    }
    const link = `${location.origin}/v/${rec.shareId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast('🔗 Link copied! Anyone on your Wi-Fi can watch.');
    } catch {
      prompt('Copy this link:', link);
    }
  } catch (e) {
    toast('Upload failed: ' + e.message);
  } finally {
    btn.textContent = '🔗 Copy share link';
    btn.disabled = false;
  }
});

$('editBtn').addEventListener('click', () => {
  const rec = state.current;
  if (!rec) return;
  closePlayer();
  Editor.open(rec, async ({ name, blob, mime, duration }) => {
    const edited = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name, blob, mime, duration,
      createdAt: Date.now(),
      shareId: null,
    };
    edited.thumb = await makeThumb(blob);
    await dbPut(edited);
    await renderLibrary();
  });
});

$('deleteBtn').addEventListener('click', async () => {
  const rec = state.current;
  if (!rec) return;
  if (!confirm(`Delete "${rec.name}"?`)) return;
  await dbDelete(rec.id);
  if (rec.shareId) fetch('api/recording/' + rec.shareId, { method: 'DELETE' }).catch(() => {});
  closePlayer();
  renderLibrary();
  toast('Deleted');
});

/* ---------- boot ---------- */
openDB().then(renderLibrary).catch(e => toast('Storage error: ' + e.message));
