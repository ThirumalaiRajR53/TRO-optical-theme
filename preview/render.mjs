// Offline preview renderer: renders the theme's JSON templates with liquidjs and mock Shopify objects.
// Usage: node render.mjs [outDir] [page,page,...]   (env THEME = theme root, default: parent folder)
// Not Shopify Liquid: filters/objects are emulated; use it for layout and CSS review only.
import { Liquid, Value } from 'liquidjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, promises as fsp } from 'node:fs';
import { resolve as pathResolve, dirname as pathDirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, C, collectionByHandle, cart as mockCart, MENUS, SHOP, ROUTES, BLOG, ARTICLES, PAGES, img } from './mock.mjs';

const HERE = pathDirname(fileURLToPath(import.meta.url));
const THEME = process.env.THEME || pathResolve(HERE, '..');
const OUT = process.argv[2] || pathResolve(HERE, '.out');
const IMG_DIR = pathResolve(HERE, 'img');
mkdirSync(OUT, { recursive: true });
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));
const locale = readJson(`${THEME}/locales/en.default.json`);
const schemaLocale = readJson(`${THEME}/locales/en.default.schema.json`);
const settingsSchema = readJson(`${THEME}/config/settings_schema.json`);
const settingsData = readJson(`${THEME}/config/settings_data.json`);

/* ---------- value typing ---------- */
const hex2rgb = (h) => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(h || ''); return m ? m.slice(1).map((x) => parseInt(x, 16)) : [0, 0, 0]; };
const colorObj = (h) => { if (!h) return null; const [red, green, blue] = hex2rgb(h); return { red, green, blue, alpha: 1, rgb: `${red}, ${green}, ${blue}`, toString() { return h; } }; };
const fontObj = (handle) => { const m = /^([a-z0-9_]+?)_(n|i)(\d)$/.exec(handle || 'assistant_n4'); const family = (m ? m[1] : 'assistant').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); const serif = /garamond|serif|playfair|baskerville|cardo|lora|prata/i.test(family); return { family: family === 'Sans Serif' ? 'sans-serif' : family, fallback_families: serif ? 'serif' : 'sans-serif', style: m && m[2] === 'i' ? 'italic' : 'normal', weight: String((m ? +m[3] : 4) * 100), system_q: /^(sans_serif|serif|mono)_/.test(handle || ''), baseline_ratio: 0.5, variants: [], toString() { return this.family; } }; };
const localImg = (ref) => { const file = String(ref).replace('shopify://shop_images/', ''); const local = `${IMG_DIR}/${file}`; const dims = { 'TRO_new_logo.png': [1400, 434], 'TRO_new.jpg': [1254, 1254], 'favicon.png': [64, 64], 'TRO.png': [600, 600] }[file] || [1400, 933]; return existsSync(local) ? img(file, dims[0], dims[1], file.replace(/[-_]/g, ' ').replace(/\.\w+$/, '')) : img('black-glasses-frames-sit-up-on-surface.jpg', 1400, 933, file); };
const shopifyUrl = (u) => String(u || '').replace('shopify://collections/', '/collections/').replace('shopify://pages/', '/pages/').replace('shopify://products/', '/products/').replace('shopify://blogs/', '/blogs/');
function typeValue(type, v) {
  if (v === undefined || v === null) return v;
  switch (type) {
    case 'color': return colorObj(v);
    case 'color_background': return v || '';
    case 'font_picker': return fontObj(v);
    case 'image_picker': return v ? localImg(v) : null;
    case 'collection': return v ? collectionByHandle(v) : null;
    case 'collection_list': return (v || []).map(collectionByHandle).filter(Boolean);
    case 'product': return v ? Object.values(P).find((p) => p.handle === v) || P.police : null;
    case 'product_list': return [];
    case 'link_list': return v ? MENUS[v] || { title: v, links: [] } : null;
    case 'page': return v ? PAGES[v] || null : null;
    case 'blog': return BLOG;
    case 'article': return ARTICLES[0];
    case 'url': return shopifyUrl(v);
    case 'video_url': return v ? { type: 'youtube', id: 'dQw4w9WgXcQ', toString() { return v; } } : null;
    case 'range': case 'number': return Number(v);
    case 'checkbox': return Boolean(v);
    default: return typeof v === 'string' ? shopifyUrl(v) : v;
  }
}
const tSchema = (s) => { if (typeof s !== 'string' || !s.startsWith('t:')) return s; const v = s.slice(2).split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), schemaLocale); return v === undefined ? s : v; };
function mergeDefaults(schemaSettings = [], values = {}) {
  const out = {}; const types = {};
  for (const s of schemaSettings) { if (!s.id) continue; types[s.id] = s.type; if (s.default !== undefined) out[s.id] = typeValue(s.type, tSchema(s.default)); }
  for (const [k, v] of Object.entries(values || {})) out[k] = typeValue(types[k], v);
  return out;
}
/* global settings */
const allSchemaSettings = settingsSchema.flatMap((g) => g.settings || []);
const settings = mergeDefaults(allSchemaSettings, Object.fromEntries(Object.entries(settingsData.current).filter(([k]) => !['sections', 'content_for_index'].includes(k))));

/* ---------- source preprocessing (harness only) ---------- */
const preprocess = (src) => src
  .replace(/\{%-?\s*#[\s\S]*?-?%\}/g, '')
  .replace(/\.(system|posted_successfully|moderated|comments_enabled|gift_card)\?/g, '.$1_q')
  .replace(/cart\s*==\s*empty/g, 'cart.item_count == 0').replace(/cart\s*!=\s*empty/g, 'cart.item_count != 0')
  .replace(/\{%-?\s*render block\s*-?%\}/g, '')
  .replace(/(alt:\s*[\w.\[\]'"-]+)\s*\|\s*escape/g, '$1'); // Shopify applies that escape to the alt argument, liquidjs to the whole tag

/* ---------- engine ---------- */
/* snippets go through the same preprocessing as sections/layout */
const fsAdapter = {
  readFileSync: (p) => preprocess(readFileSync(p, 'utf8')),
  readFile: async (p) => preprocess(await fsp.readFile(p, 'utf8')),
  existsSync: (p) => existsSync(p),
  exists: async (p) => existsSync(p),
  resolve: (root, file, ext) => pathResolve(root, file.endsWith(ext) ? file : file + ext),
  contains: (root, file) => file.startsWith(root),
  dirname: (f) => pathDirname(f),
  sep: '/',
};
const engine = new Liquid({ root: [`${THEME}/snippets`], extname: '.liquid', dynamicPartials: true, strictFilters: false, strictVariables: false, lenientIf: true, ownPropertyOnly: false, jsTruthy: false, relativeReference: false, cache: false, fs: fsAdapter });
const kw = (args) => { const o = {}; for (const a of args) if (Array.isArray(a) && a.length === 2) o[a[0]] = a[1]; return o; };
const money = (v) => 'Rs. ' + (Number(v || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tr = (key, ...args) => {
  const o = kw(args);
  let v = String(key).split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), locale);
  if (v && typeof v === 'object') v = o.count === 1 ? v.one : (v.other ?? v.one);
  if (v === undefined) return `[${key}]`;
  return String(v).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (o[k] !== undefined ? o[k] : ''));
};
const srcOf = (v) => (v && typeof v === 'object' ? v.src : v) || '';
const filters = {
  t: tr,
  asset_url: (n) => `/assets/${n}`,
  shopify_asset_url: () => '',
  stylesheet_tag: (u, ...a) => `<link rel="stylesheet" href="${u}" media="all">`,
  preload_tag: () => '',
  image_url: (v, ...a) => { const o = kw(a); return srcOf(v) || `/img/black-glasses-frames-sit-up-on-surface.jpg`; },
  img_url: (v) => srcOf(v), product_img_url: (v) => srcOf(v), collection_img_url: (v) => srcOf(v),
  image_tag: (src, ...a) => { const o = kw(a); if (o.alt === undefined || o.alt === null) o.alt = ''; const attrs = Object.entries(o).filter(([k, v]) => !['widths', 'preload'].includes(k) && v !== null && v !== undefined && (v !== '' || k === 'alt')).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' '); return `<img src="${src}" ${attrs}>`; },
  money, money_with_currency: (v) => money(v) + ' INR', money_without_currency: (v) => money(v).replace('Rs. ', ''), money_without_trailing_zeros: (v) => money(v).replace(/\.00$/, ''),
  font_face: () => '', font_modify: (f) => f, font_url: () => '',
  placeholder_svg_tag: (n, cls = 'placeholder-svg') => `<svg class="${cls}" viewBox="0 0 525 525" xmlns="http://www.w3.org/2000/svg"><rect width="525" height="525" fill="#E6E0D4"/><path d="M160 300a60 40 0 1 0 0-1zm210 0a60 40 0 1 0 0-1zM220 285h85" fill="none" stroke="#9A7B3C" stroke-width="8"/></svg>`,
  link_to: (text, url) => `<a href="${url}">${text}</a>`,
  payment_type_svg_tag: (type, ...a) => { const o = kw(a); return `<svg class="${o.class || ''}" width="38" height="24" viewBox="0 0 38 24" role="img" aria-labelledby="pi-${type}"><title id="pi-${type}">${type}</title><rect width="38" height="24" rx="3" fill="#fff" opacity=".9"/><text x="19" y="15.5" font-family="Inter,Arial" font-size="7" font-weight="700" text-anchor="middle" fill="#121A4A">${String(type).toUpperCase().slice(0, 6)}</text></svg>`; },
  payment_button: () => `<div data-shopify="payment-button" class="shopify-payment-button"><button type="button" class="shopify-payment-button__button shopify-payment-button__button--unbranded">Buy it now</button></div>`,
  payment_terms: () => '', item_count_for_variant: () => 0, within: (u) => u,
  format_address: (a) => `<p>${(a && a.summary) || ''}</p>`,
  external_video_url: () => '', external_video_tag: () => '', media_tag: () => '', video_tag: () => '',
  time_tag: (d, ...a) => { const o = kw(a); const dt = new Date(d); return `<time datetime="${dt.toISOString()}">${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>`; },
  default_errors: () => '', format_code: (v) => v,
  handleize: (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  highlight: (s) => s, weight_with_unit: (w) => `${w} g`,
};
for (const [k, f] of Object.entries(filters)) engine.registerFilter(k, f);

/* block tag helper */
function blockTag(endName, wrap) {
  return {
    parse(tagToken, remainTokens) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remainTokens).on(`tag:${endName}`, () => stream.stop()).on('template', (tpl) => this.tpls.push(tpl)).on('end', () => { throw new Error(`${endName} not found`); });
      stream.start();
      this.args = tagToken.args;
    },
    *render(ctx, emitter) { yield* wrap.call(this, ctx, emitter, () => this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter)); },
  };
}
function rawSkipTag(endName) {
  return { parse(tagToken, remainTokens) { while (remainTokens.length) { const t = remainTokens.shift(); if (t.kind === 4 /* Tag */ && t.name === endName) return; } }, render() { return ''; } };
}
engine.registerTag('schema', rawSkipTag('endschema'));
engine.registerTag('style', blockTag('endstyle', function* (ctx, emitter, body) { emitter.write('<style>'); yield body(); emitter.write('</style>'); }));
engine.registerTag('stylesheet', blockTag('endstylesheet', function* (ctx, emitter, body) { emitter.write('<style>'); yield body(); emitter.write('</style>'); }));
engine.registerTag('javascript', blockTag('endjavascript', function* (ctx, emitter, body) { emitter.write('<script>'); yield body(); emitter.write('</script>'); }));
engine.registerTag('form', blockTag('endform', function* (ctx, emitter, body) {
  const m = /^\s*'([^']+)'/.exec(this.args); const type = m ? m[1] : 'product';
  const attrs = {}; const re = /([\w-]+):\s*('[^']*'|"[^"]*"|[^,]+)/g; let mm; const rest = this.args.replace(/^\s*'[^']+'\s*,?/, '');
  while ((mm = re.exec(rest))) { const v = new Value(mm[2].trim(), this.liquid); attrs[mm[1]] = yield v.value(ctx); }
  const action = { product: '/cart/add', customer_login: '/account/login', create_customer: '/account', recover_customer_password: '/account/recover', contact: '/contact', localization: '/localization', new_comment: '/blogs/articles/x/comments', customer_address: '/account/addresses', activate_customer_password: '/account/activate', reset_customer_password: '/account/reset', storefront_password: '/password', currency: '/cart/update' }[type] || '/';
  const a = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
  emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8" enctype="multipart/form-data" ${a}><input type="hidden" name="form_type" value="${type}"><input type="hidden" name="utf8" value="✓">`);
  ctx.push({ form: { errors: null, posted_successfully_q: false, email: '', author: '', body: '', password_needed: false, id: attrs.id || '' } });
  yield body(); ctx.pop(); emitter.write('</form>');
}));
engine.registerTag('paginate', blockTag('endpaginate', function* (ctx, emitter, body) {
  const [cExpr, byExpr] = this.args.split(/\s+by\s+/);
  const items = (yield new Value(cExpr.trim(), this.liquid).value(ctx)) || []; const size = Number(yield new Value(byExpr.trim(), this.liquid).value(ctx)) || 12;
  const pages = Math.max(1, Math.ceil(items.length / size)) + 2; // pretend more pages exist
  const paginate = { items: items.length, page_size: size, pages, current_page: 1, current_offset: 0, previous: null, next: { title: 'Next', url: '?page=2', is_link: true }, parts: Array.from({ length: pages }, (_, i) => ({ title: String(i + 1), url: `?page=${i + 1}`, is_link: i !== 0 })), page_param: 'page' };
  ctx.push({ paginate }); yield body(); ctx.pop();
}));
engine.registerTag('layout', { parse() {}, render() { return ''; } });
engine.registerTag('section', { parse(t) { this.name = t.args.replace(/['"]/g, '').trim(); }, *render(ctx, emitter) { emitter.write(yield renderSingleSection(this.name, ctx.getAll())); } });
engine.registerTag('sections', { parse(t) { this.name = t.args.replace(/['"]/g, '').trim(); }, *render(ctx, emitter) { emitter.write(yield renderGroup(this.name, ctx.getAll())); } });

const tplCache = new Map();
const parseFile = (path) => { if (!tplCache.has(path)) tplCache.set(path, engine.parse(preprocess(readFileSync(path, 'utf8')))); return tplCache.get(path); };
const parseSchema = (src) => { const m = /\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/.exec(src); return m ? JSON.parse(m[1]) : {}; };
const schemaCache = new Map();
const sectionSchema = (type) => { if (!schemaCache.has(type)) schemaCache.set(type, parseSchema(readFileSync(`${THEME}/sections/${type}.liquid`, 'utf8'))); return schemaCache.get(type); };

/* ---------- section rendering ---------- */
let sectionCounter = 0;
async function renderSection({ type, id, settings: sv = {}, blocks = {}, block_order = [], location = 'template' }, globals, index = 1) {
  const schema = sectionSchema(type);
  const blockObjs = block_order.filter((bid) => blocks[bid] && !blocks[bid].disabled).map((bid) => { const b = blocks[bid]; const bs = (schema.blocks || []).find((x) => x.type === b.type) || {}; return { id: bid, type: b.type, settings: mergeDefaults(bs.settings, b.settings), shopify_attributes: '' }; });
  const section = { id, settings: mergeDefaults(schema.settings, sv), blocks: blockObjs, index, index0: index - 1, location };
  let html;
  try { html = await engine.render(parseFile(`${THEME}/sections/${type}.liquid`), {}, { globals: { ...globals, section } }); } catch (e) { html = `<pre style="color:red;padding:2rem">Render error in sections/${type}.liquid: ${e.message}</pre>`; console.error(`[section ${type}]`, e.message); }
  const cls = ['shopify-section', schema.class, location === 'group' ? `shopify-section-group-${globals.__group}` : ''].filter(Boolean).join(' ');
  return `<div id="shopify-section-${id}" class="${cls}">${html}</div>`;
}
async function renderSingleSection(type, globals) { return renderSection({ type, id: type, settings: (settingsData.current.sections || {})[type]?.settings || {} }, globals); }
async function renderGroup(name, globals) {
  const g = readJson(`${THEME}/sections/${name}.json`);
  let out = '';
  for (const id of g.order) { const s = g.sections[id]; if (s.disabled) continue; out += await renderSection({ ...s, id: `sections--1__${id}`, location: 'group' }, { ...globals, __group: name }); }
  return out;
}
async function renderTemplate(name, globals) {
  const t = readJson(`${THEME}/templates/${name}.json`);
  let out = ''; let i = 0;
  for (const id of t.order) { const s = t.sections[id]; if (s.disabled) continue; out += await renderSection({ ...s, id: `template--1__${id}` }, globals, ++i); }
  return out;
}

/* ---------- pages ---------- */
const base = (over = {}) => ({
  settings, routes: ROUTES, shop: SHOP, cart: mockCart(false), customer: null, localization: { available_countries: [], available_languages: [], country: { iso_code: 'IN', name: 'India', currency: { iso_code: 'INR', symbol: '₹' } }, language: { iso_code: 'en', endonym_name: 'English' } },
  request: { page_type: 'index', locale: { iso_code: 'en' }, origin: 'https://therajhanopticals.com', design_mode: false, path: '/', host: 'therajhanopticals.com' },
  template: 'index', canonical_url: 'https://therajhanopticals.com/', page_title: 'The Rajhan Opticals', page_description: 'Trusted since 1956', page_image: null, current_tags: null, current_page: 1, powered_by_link: 'Powered by Shopify', content_for_index: '',
  content_for_header: `<script>window.Shopify={designMode:false,locale:'en',currency:{active:'INR'},routes:{root:'/'}};</script>`,
  recommendations: { performed: false, products: [], products_count: 0, intent: 'related' }, predictive_search: null, linklists: MENUS, all_products: {}, collections: C, blogs: { articles: BLOG }, pages: PAGES, theme: { name: 'TRO Optical', role: 'main', id: 1 },
  search: { performed: false, terms: '', results: [], results_count: 0, filters: [], sort_options: [], sort_by: 'relevance', default_sort_by: 'relevance', types: ['product'] },
  ...over,
});
async function page(outName, templateName, globals, { withLayout = true } = {}) {
  const g = base(globals);
  let content;
  try { content = await renderTemplate(templateName, g); } catch (e) { content = `<pre>Template error: ${e.message}</pre>`; console.error(`[template ${templateName}]`, e.message); }
  let html = content;
  if (withLayout) { try { html = await engine.render(parseFile(`${THEME}/layout/theme.liquid`), {}, { globals: { ...g, content_for_layout: content } }); } catch (e) { console.error('[layout]', e.message); html = `<pre>${e.message}</pre>` + content; } }
  html = html.replace('</body>', `<script>new EventSource('/__events').onmessage = (e) => { if (e.data === 'reload') location.reload(); };</script></body>`);
  writeFileSync(`${OUT}/${outName}.html`, html);
  console.log('rendered', outName);
}

const searchPerformed = { performed: true, terms: 'police', results: [P.police, P.sun, P.police, P.sun], results_count: 4, filters: C.eyeglasses.filters, sort_options: [{ value: 'relevance', name: 'Relevance' }, { value: 'price-ascending', name: 'Price, low to high' }], sort_by: 'relevance', default_sort_by: 'relevance', types: ['product'] };
const only = process.argv[3] ? process.argv[3].split(',') : null;
const want = (n) => !only || only.includes(n);
if (want('home')) await page('home', 'index', { template: 'index', request: { page_type: 'index', locale: { iso_code: 'en' }, origin: 'https://therajhanopticals.com', design_mode: false, path: '/' } });
if (want('collection')) await page('collection', 'collection', { template: 'collection', collection: C.mens, request: { page_type: 'collection', locale: { iso_code: 'en' }, origin: 'https://therajhanopticals.com', design_mode: false, path: '/collections/mens-eyeglasses' } });
if (want('collection-cl')) await page('collection-cl', 'collection', { template: 'collection', collection: C['contact-lenses'], request: { page_type: 'collection', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/collections/contact-lenses' } });
if (want('product-frame')) await page('product-frame', 'product', { template: 'product', product: P.police, request: { page_type: 'product', locale: { iso_code: 'en' }, origin: 'https://therajhanopticals.com', design_mode: false, path: P.police.url } });
if (want('product-frame-variants')) await page('product-frame-variants', 'product', { template: 'product', product: P.idee, request: { page_type: 'product', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: P.idee.url } });
if (want('product-cl')) await page('product-cl', 'product', { template: 'product', product: P.biofinity, request: { page_type: 'product', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: P.biofinity.url } });
if (want('product-cl-spherical')) await page('product-cl-spherical', 'product', { template: 'product', product: P.acuvue, request: { page_type: 'product', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: P.acuvue.url } });
if (want('product-cl-optional')) await page('product-cl-optional', 'product', { template: 'product', product: P.celebration, request: { page_type: 'product', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: P.celebration.url } });
if (want('product-accessory')) await page('product-accessory', 'product', { template: 'product', product: P.renu, request: { page_type: 'product', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: P.renu.url } });
if (want('product-sunglasses')) await page('product-sunglasses', 'product', { template: 'product', product: P.sun, request: { page_type: 'product', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: P.sun.url } });
if (want('cart')) await page('cart', 'cart', { template: 'cart', request: { page_type: 'cart', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/cart' } });
if (want('cart-empty')) await page('cart-empty', 'cart', { template: 'cart', cart: mockCart(true), request: { page_type: 'cart', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/cart' } });
if (want('search')) await page('search', 'search', { template: 'search', search: searchPerformed, request: { page_type: 'search', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/search' } });
if (want('search-empty')) await page('search-empty', 'search', { template: 'search', request: { page_type: 'search', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/search' } });
if (want('blog')) await page('blog', 'blog', { template: 'blog', blog: BLOG, request: { page_type: 'blog', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/blogs/articles' } });
if (want('article')) await page('article', 'article', { template: 'article', blog: BLOG, article: ARTICLES[0], request: { page_type: 'article', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: ARTICLES[0].url } });
if (want('page')) await page('page', 'page', { template: 'page', page: PAGES['about-us'], request: { page_type: 'page', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/pages/about-us' } });
if (want('contact')) await page('contact', 'page.contact', { template: 'page.contact', page: PAGES.contact, request: { page_type: 'page', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/pages/contact' } });
if (want('quiz')) await page('quiz', 'page.product-quiz', { template: 'page.product-quiz', page: PAGES['find-your-best-match'], request: { page_type: 'page', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/pages/find-your-best-match' } });
if (want('404')) await page('404', '404', { template: '404', request: { page_type: '404', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/x' } });
if (want('login')) await page('login', 'customers/login', { template: 'customers/login', request: { page_type: 'customers/login', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/account/login' } });
if (want('register')) await page('register', 'customers/register', { template: 'customers/register', request: { page_type: 'customers/register', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/account/register' } });
if (want('account')) await page('account', 'customers/account', { template: 'customers/account', customer: { name: 'Thiru R', first_name: 'Thiru', last_name: 'R', email: 'thiru@example.com', orders: [], addresses: [], default_address: null, addresses_count: 0, orders_count: 0 }, request: { page_type: 'customers/account', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/account' } });
if (want('list-collections')) await page('list-collections', 'list-collections', { template: 'list-collections', collections: Object.values(C).filter((c, i, a) => a.indexOf(c) === i), request: { page_type: 'list-collections', locale: { iso_code: 'en' }, origin: '', design_mode: false, path: '/collections' } });
