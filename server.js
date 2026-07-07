// MaherCast — local Loom-style screen recording server
// HTTPS for phones on your Wi-Fi (media APIs need a secure context),
// plus plain HTTP on localhost for desktop testing.
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const ROOT = __dirname;
const REC_DIR = path.join(ROOT, 'recordings');
const HTTPS_PORT = 4443;
const HTTP_PORT = 8080;

if (!fs.existsSync(REC_DIR)) fs.mkdirSync(REC_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json',
};

function metaPath(id) { return path.join(REC_DIR, id + '.json'); }

function loadMeta(id) {
  try { return JSON.parse(fs.readFileSync(metaPath(id), 'utf8')); }
  catch { return null; }
}

function saveMeta(meta) {
  fs.writeFileSync(metaPath(meta.id), JSON.stringify(meta, null, 2));
}

function readBody(req, limit = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtDuration(sec) {
  if (!sec || !isFinite(sec)) return '';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Serve video with Range support so phones can seek.
function serveMedia(req, res, id) {
  const meta = loadMeta(id);
  if (!meta) { res.writeHead(404); res.end('Not found'); return; }
  const file = path.join(REC_DIR, meta.file);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  const stat = fs.statSync(file);
  const type = MIME[path.extname(file)] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m[1] ? parseInt(m[1], 10) : 0;
    let end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
    if (start >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return; }
    end = Math.min(end, stat.size - 1);
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
    });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  }
}

function watchPage(meta) {
  const reactions = meta.reactions || {};
  const emojis = ['👍', '❤️', '🔥', '😂', '👏'];
  const reactBtns = emojis.map(e =>
    `<button class="react" data-emoji="${e}">${e} <span>${reactions[e] || 0}</span></button>`
  ).join('');
  const comments = (meta.comments || []).map(c =>
    `<div class="comment"><div class="who">${esc(c.name || 'Anonymous')}<span class="when">${new Date(c.at).toLocaleString()}</span></div><div>${esc(c.text)}</div></div>`
  ).join('') || '<p class="empty">No comments yet — be the first!</p>';
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.name)} — MaherCast</title>
<style>
  :root{--p:#625df5;--ink:#12131a;--mut:#6b7080;--bg:#f6f6fb;--card:#fff;}
  *{box-sizing:border-box;margin:0}
  body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);padding:16px;max-width:860px;margin:0 auto}
  .logo{font-weight:800;color:var(--p);font-size:18px;margin-bottom:14px}
  .logo a{color:inherit;text-decoration:none}
  video{width:100%;border-radius:14px;background:#000;max-height:70vh}
  h1{font-size:20px;margin:14px 0 4px}
  .meta{color:var(--mut);font-size:13px;margin-bottom:12px}
  .reacts{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 20px}
  .react{border:1px solid #e3e3ee;background:var(--card);border-radius:999px;padding:8px 14px;font-size:15px;cursor:pointer}
  .react:active{transform:scale(1.1)}
  .react span{color:var(--mut);font-size:13px}
  .card{background:var(--card);border-radius:14px;padding:16px;box-shadow:0 1px 4px rgba(20,20,43,.06)}
  .card h2{font-size:15px;margin-bottom:10px}
  .comment{padding:10px 0;border-bottom:1px solid #f0f0f6}
  .who{font-weight:600;font-size:13px;margin-bottom:2px}
  .when{color:var(--mut);font-weight:400;margin-left:8px;font-size:12px}
  .empty{color:var(--mut);font-size:14px}
  form{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
  input,textarea{border:1px solid #e3e3ee;border-radius:10px;padding:10px;font:inherit;font-size:14px}
  input{width:130px}
  textarea{flex:1;min-width:180px;resize:vertical;min-height:42px}
  button.send{background:var(--p);color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer}
</style></head><body>
<div class="logo"><a href="/">🎥 MaherCast</a></div>
<video src="/media/${meta.id}" controls playsinline></video>
<h1>${esc(meta.name)}</h1>
<div class="meta">${meta.views} view${meta.views === 1 ? '' : 's'} · ${fmtDuration(meta.duration)} ${meta.duration ? '· ' : ''}${new Date(meta.createdAt).toLocaleString()}</div>
<div class="reacts">${reactBtns}</div>
<div class="card"><h2>Comments</h2>${comments}
<form id="cf"><input id="cn" placeholder="Your name"><textarea id="ct" placeholder="Add a comment…" required></textarea><button class="send">Post</button></form>
</div>
<script>
  const id=${JSON.stringify(meta.id)};
  document.querySelectorAll('.react').forEach(b=>b.onclick=async()=>{
    const r=await fetch('/api/react/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({emoji:b.dataset.emoji})});
    const d=await r.json();b.querySelector('span').textContent=d.count;
  });
  document.getElementById('cf').onsubmit=async(e)=>{
    e.preventDefault();
    await fetch('/api/comment/'+id,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:document.getElementById('cn').value,text:document.getElementById('ct').value})});
    location.reload();
  };
</script>
</body></html>`;
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (req.method === 'POST' && p === '/api/upload') {
      const id = crypto.randomBytes(5).toString('hex');
      const type = req.headers['content-type'] || 'video/webm';
      const ext = type.includes('mp4') ? '.mp4' : '.webm';
      const file = id + ext;
      const out = fs.createWriteStream(path.join(REC_DIR, file));
      let size = 0;
      req.on('data', c => { size += c.length; });
      req.pipe(out);
      out.on('finish', () => {
        saveMeta({
          id, file,
          name: url.searchParams.get('name') || 'Untitled recording',
          duration: parseFloat(url.searchParams.get('duration')) || 0,
          createdAt: Date.now(), views: 0, reactions: {}, comments: [], size,
        });
        json(res, 200, { id, url: '/v/' + id });
      });
      out.on('error', () => json(res, 500, { error: 'write failed' }));
      return;
    }
    if (req.method === 'POST' && p.startsWith('/api/react/')) {
      const meta = loadMeta(p.split('/')[3]);
      if (!meta) return json(res, 404, { error: 'not found' });
      const { emoji } = JSON.parse((await readBody(req)).toString() || '{}');
      if (typeof emoji !== 'string' || emoji.length > 8) return json(res, 400, { error: 'bad emoji' });
      meta.reactions = meta.reactions || {};
      meta.reactions[emoji] = (meta.reactions[emoji] || 0) + 1;
      saveMeta(meta);
      return json(res, 200, { count: meta.reactions[emoji] });
    }
    if (req.method === 'POST' && p.startsWith('/api/comment/')) {
      const meta = loadMeta(p.split('/')[3]);
      if (!meta) return json(res, 404, { error: 'not found' });
      const { name, text } = JSON.parse((await readBody(req)).toString() || '{}');
      if (!text || typeof text !== 'string') return json(res, 400, { error: 'no text' });
      meta.comments = meta.comments || [];
      meta.comments.push({ name: String(name || '').slice(0, 40), text: text.slice(0, 1000), at: Date.now() });
      saveMeta(meta);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'DELETE' && p.startsWith('/api/recording/')) {
      const id = p.split('/')[3];
      const meta = loadMeta(id);
      if (meta) {
        try { fs.unlinkSync(path.join(REC_DIR, meta.file)); } catch {}
        try { fs.unlinkSync(metaPath(id)); } catch {}
      }
      return json(res, 200, { ok: true });
    }
    if (p === '/api/recordings') {
      const list = fs.readdirSync(REC_DIR).filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(fs.readFileSync(path.join(REC_DIR, f), 'utf8')))
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(({ comments, ...m }) => ({ ...m, commentCount: (comments || []).length }));
      return json(res, 200, list);
    }
    if (p.startsWith('/media/')) return serveMedia(req, res, p.split('/')[2]);
    if (p.startsWith('/v/')) {
      const meta = loadMeta(p.split('/')[2]);
      if (!meta) { res.writeHead(404); return res.end('Recording not found'); }
      meta.views = (meta.views || 0) + 1;
      saveMeta(meta);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(watchPage(meta));
    }
    // static files
    let file = p === '/' ? '/index.html' : p;
    file = path.normalize(path.join(ROOT, file));
    if (!file.startsWith(ROOT) || file.startsWith(REC_DIR) || file.endsWith('.pem') || file.endsWith('server.js')) {
      res.writeHead(404); return res.end('Not found');
    }
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
    res.writeHead(404); res.end('Not found');
  } catch (e) {
    json(res, 500, { error: e.message });
  }
}

function lanIPs() {
  return Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
}

https.createServer({
  key: fs.readFileSync(path.join(ROOT, 'key.pem')),
  cert: fs.readFileSync(path.join(ROOT, 'cert.pem')),
}, handle).listen(HTTPS_PORT, () => {
  console.log('MaherCast is running!');
  console.log(`  On this PC:    http://localhost:${HTTP_PORT}`);
  for (const ip of lanIPs()) console.log(`  On your phone: https://${ip}:${HTTPS_PORT}`);
});

http.createServer(handle).listen(HTTP_PORT);
