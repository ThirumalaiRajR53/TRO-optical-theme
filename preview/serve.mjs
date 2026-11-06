// Offline theme preview server.
// Renders every page with render.mjs, serves the result plus the theme's assets, polls the theme
// folder for changes, re-renders, and tells open pages to reload (SSE on /__events).
// Usage: node serve.mjs   (env: THEME=/path/to/theme, PORT=4000, POLL_MS=1500)
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { statSync, readdirSync, existsSync, createReadStream } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = resolve(process.env.THEME || resolve(HERE, '..'));
const OUT = resolve(HERE, '.out');
const PORT = Number(process.env.PORT) || 4000;
const POLL_MS = Number(process.env.POLL_MS) || 1500;
const WATCH_DIRS = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];

const PAGES = [
  ['home', 'Home'], ['collection', "Collection: Men's Eyeglasses (filters active)"], ['collection-cl', 'Collection: Contact Lenses'],
  ['product-frame', 'Product: frame (lens modal)'], ['product-frame-variants', 'Product: frame with colour/size variants'],
  ['product-cl', 'Product: contact lens, toric (power required)'], ['product-cl-spherical', 'Product: contact lens, spherical'],
  ['product-cl-optional', 'Product: contact lens, power optional'], ['product-accessory', 'Product: accessory'], ['product-sunglasses', 'Product: sunglasses'],
  ['cart', 'Cart (frame + lens + contact lens)'], ['cart-empty', 'Cart: empty'], ['search', 'Search results'], ['search-empty', 'Search: no query'],
  ['blog', 'Blog'], ['article', 'Article'], ['page', 'Page: About us'], ['contact', 'Page: Contact'], ['quiz', 'Frame finder quiz'],
  ['404', '404'], ['login', 'Customer: login'], ['register', 'Customer: register'], ['account', 'Customer: account'], ['list-collections', 'All collections'],
];

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

/* ---------- rendering ---------- */
let rendering = null;
function render() {
  if (rendering) return rendering;
  rendering = new Promise((done) => {
    const started = Date.now();
    const child = spawn(process.execPath, [join(HERE, 'render.mjs'), OUT], { env: { ...process.env, THEME }, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => {
      rendering = null;
      const ms = Date.now() - started;
      if (code !== 0) console.error(`[preview] render failed (${code}) after ${ms}ms\n${err}`);
      else { console.log(`[preview] rendered ${PAGES.length} pages in ${ms}ms${err.trim() ? '\n' + err.trim() : ''}`); broadcast('reload'); }
      done(code === 0);
    });
  });
  return rendering;
}

/* ---------- change detection (mtime polling: works with Docker bind mounts on macOS/Windows) ---------- */
function snapshot() {
  const sig = [];
  for (const dir of WATCH_DIRS) {
    const abs = join(THEME, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      try { const st = statSync(join(abs, f)); sig.push(`${dir}/${f}:${st.mtimeMs}:${st.size}`); } catch { /* file vanished mid-scan */ }
    }
  }
  return sig.join('\n');
}
let last = snapshot();
let pending = null;
setInterval(() => {
  const now = snapshot();
  if (now === last) return;
  last = now;
  clearTimeout(pending);
  pending = setTimeout(() => { console.log('[preview] theme changed, re-rendering'); render(); }, 300);
}, POLL_MS);

/* ---------- SSE ---------- */
const clients = new Set();
function broadcast(msg) { for (const res of clients) res.write(`data: ${msg}\n\n`); }

/* ---------- http ---------- */
function sendFile(res, path) {
  if (!existsSync(path) || !statSync(path).isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': MIME[extname(path).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(path).pipe(res);
}
const safe = (root, rel) => { const p = resolve(root, '.' + decodeURIComponent(rel)); return p.startsWith(root + '/') ? p : null; };
const forbidden = (res) => { res.writeHead(403, { 'Content-Type': 'text/plain' }); res.end('Forbidden'); };

function indexHtml() {
  const items = PAGES.map(([slug, label]) => `<li><a href="/pages/${slug}.html">${label}</a><code>/pages/${slug}.html</code></li>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>TRO theme preview</title>
<style>body{font:15px/1.5 system-ui;margin:0;padding:2.5rem;background:#f7f5f0;color:#121a4a}h1{font-weight:500;margin:0 0 .25rem}p{color:#5b6172;margin:0 0 1.5rem}ul{list-style:none;padding:0;columns:2;gap:2rem}li{break-inside:avoid;padding:.45rem 0;border-bottom:1px solid rgba(18,26,74,.1);display:flex;justify-content:space-between;gap:1rem}a{color:#3b3989;text-decoration:none}a:hover{text-decoration:underline}code{color:#5b6172;font-size:12px}small{display:block;margin-top:2rem;color:#5b6172}</style>
<h1>TRO theme preview</h1><p>Offline render of the theme in <code>${THEME}</code> with mock products, menus and cart. Pages reload when theme files change.</p>
<ul>${items}</ul>
<small>Caveats: liquidjs, not Shopify Liquid; mock data; the repo's settings_data.json, not the store's. Cart/checkout requests are not executed.</small>`;
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  if (path === '/' || path === '/index.html') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(indexHtml()); }
  if (path === '/__events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write('data: connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (path.startsWith('/pages/')) { const p = safe(OUT, path.slice('/pages'.length)); return p ? sendFile(res, p) : forbidden(res); }
  if (path.startsWith('/assets/')) { const p = safe(join(THEME, 'assets'), path.slice('/assets'.length)); return p ? sendFile(res, p) : forbidden(res); }
  if (path.startsWith('/img/')) { const p = safe(join(HERE, 'img'), path.slice('/img'.length)); return p ? sendFile(res, p) : forbidden(res); }
  // Storefront routes the mock links point at (collections, products, cart...) have no server behind them.
  res.writeHead(302, { Location: '/' });
  res.end();
}).listen(PORT, '0.0.0.0', async () => {
  console.log(`[preview] theme: ${THEME}`);
  await render();
  console.log(`[preview] http://localhost:${PORT}`);
});
