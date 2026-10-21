// Takes the PNG screenshots of every mockup here, checks for sideways scroll, and measures contrast.
// No Playwright on this machine, so this drives the system Chromium over the DevTools protocol with Node's
// built-in WebSocket (same approach as docs/design/goal/_shoot.mjs).
//   node docs/design/backdrop/_shoot.mjs            screenshots + overflow checks + contrast table
//   node docs/design/backdrop/_shoot.mjs --measure  only the contrast table
//   STRENGTH=0.1 BLUR=12 node ...                   try other values without editing the CSS (for a sweep)
//   IMAGE=path/to/other.jpg node ...                measure with another picture (path relative to this folder
//                                                   or absolute): use it on each real hero before shipping
// Needs /usr/bin/chromium; set CHROMIUM to change.
//
// HOW THE CONTRAST IS MEASURED (the "lightest pixel under the element", not the average)
// 1. Load the page and make everything that is not background invisible (text transparent, thread, marks,
//    bars, switches and links hidden). What is left is exactly what each element sits on: the backdrop,
//    the plates, the 7 percent silk fill of the "next" row.
// 2. Screenshot that, load it into a canvas, and for every text line and every thread line scan all the
//    pixels inside its box and keep the brightest one.
// 3. Contrast of the element's own color against that brightest pixel (WCAG 2.x). All colors here are
//    lighter than the page, so the brightest background pixel is the worst case.
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pages = readdirSync(here).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
const onlyMeasure = process.argv.includes('--measure');
const imageOverride = process.env.IMAGE ? pathToFileURL(isAbsolute(process.env.IMAGE) ? process.env.IMAGE : resolve(here, process.env.IMAGE)).href : null;
const port = 9334;
const profile = mkdtempSync(join(tmpdir(), 'backdrop-shoot-'));

const chrome = spawn(process.env.CHROMIUM || '/usr/bin/chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Chromium did not start');
}

class Tab {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && this.pending.has(msg.id)) { const { resolve, reject } = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result); }
  }); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject })); }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    return r.result.value;
  }
}

async function openTab() {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const info = await res.json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  const tab = new Tab(ws);
  await tab.send('Page.enable');
  await tab.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  return tab;
}

async function load(tab, name, width, scale) {
  await tab.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: scale, mobile: false });
  await tab.send('Page.navigate', { url: pathToFileURL(join(here, `${name}.html`)).href });
  await new Promise((r) => setTimeout(r, 400));
  // The state strip links the mockups together; it is not part of the design.
  await tab.eval("document.head.insertAdjacentHTML('beforeend', '<style>.mock-states{display:none !important}</style>')");
  if (imageOverride) await tab.eval(`document.querySelectorAll('.backdrop img').forEach((i) => { i.src = ${JSON.stringify(imageOverride)}; })`);
  if (process.env.STRENGTH) await tab.eval(`document.querySelectorAll('.backdrop').forEach((b) => { b.style.setProperty('--backdrop-strength', '${process.env.STRENGTH}'); b.style.setProperty('--backdrop-blur', '${process.env.BLUR || 0}px'); })`);
  await tab.eval(`Promise.all([...document.images].map((i) => i.decode().catch(() => {}))).then(() => document.fonts.ready).then(() => true)`);
  await new Promise((r) => setTimeout(r, 200));
}

async function shotData(tab, clip) {
  const height = await tab.eval('document.documentElement.scrollHeight');
  const width = await tab.eval('document.documentElement.clientWidth');
  const { data } = await tab.send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true, fromSurface: true,
    clip: clip || { x: 0, y: 0, width, height, scale: 1 },
  });
  return data;
}

// ------------------------------------------------------------------ measuring (runs inside the page)

const COLLECT = `(() => {
  const parse = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const out = [];
  const heroBottom = document.querySelector('.hero').getBoundingClientRect().bottom + window.scrollY;
  const skip = (el) => el.closest('.hero, .plate, .visually-hidden, .banner, .mock-states, .site-header, .skip-link');
  // Text: every text node's line boxes, with the color of its element.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || skip(el)) continue;
    const cs = getComputedStyle(el);
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 1) continue;
      out.push({ kind: 'text', cls: el.className || el.tagName.toLowerCase(), sample: n.textContent.trim().slice(0, 28), color: parse(cs.color), size: cs.fontSize,
        x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height, min: 4.5 });
    }
  }
  // Thread lines: the 2px left border of each thread segment and of the start thread, below the hero.
  for (const el of document.querySelectorAll('.entry-thread, .start-thread')) {
    if (el.closest('.plate')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    const top = Math.max(r.top + window.scrollY, heroBottom);
    out.push({ kind: 'line', cls: el.className + (cs.borderLeftStyle === 'dashed' ? ' (dashed)' : ''), sample: '', color: parse(cs.borderLeftColor),
      x: r.left, y: top, w: 2, h: r.bottom + window.scrollY - top, min: 3 });
  }
  // Focus ring on a link: 2px line at 3px offset, so the band 3 to 5px outside the link. Measured as the
  // lightest pixel in the link's box grown by 5px.
  for (const el of document.querySelectorAll('.source-link, .entry-body a, .site-footer a')) {
    const r = el.getBoundingClientRect();
    out.push({ kind: 'ring', cls: 'focus ring on link', sample: el.textContent.trim().slice(0, 20), color: [236, 85, 91], // --silk, DESIGN.md section 3
      x: r.left - 5, y: r.top + window.scrollY - 5, w: r.width + 10, h: r.height + 10, min: 3 });
  }
  return JSON.stringify({ out, heroBottom, docH: document.documentElement.scrollHeight, docW: document.documentElement.clientWidth });
})()`;

const BARE = `(() => {
  const s = document.createElement('style');
  s.id = 'bare';
  s.textContent = '*{color:transparent !important;text-decoration-color:transparent !important}' +
    '.entry-thread,.start-thread,.entry-mark,.mark,.bar,.switch-track,svg,.source-link{visibility:hidden !important}.entry-body{border-color:transparent !important}';
  document.head.appendChild(s);
})()`;

// Runs in the page: reads the bare screenshot into a canvas and measures every target.
const MEASURE = (b64, targetsJson) => `(async () => {
  const targets = JSON.parse(${JSON.stringify(targetsJson)});
  const img = new Image();
  img.src = 'data:image/png;base64,${b64}';
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
  const res = [];
  for (const t of targets) {
    const x = Math.max(0, Math.floor(t.x)), y = Math.max(0, Math.floor(t.y));
    const w = Math.min(c.width - x, Math.ceil(t.w)), h = Math.min(c.height - y, Math.ceil(t.h));
    if (w < 1 || h < 1) continue;
    const d = g.getImageData(x, y, w, h).data;
    let best = -1, rgb = null;
    for (let i = 0; i < d.length; i += 4) { const l = L(d[i], d[i + 1], d[i + 2]); if (l > best) { best = l; rgb = [d[i], d[i + 1], d[i + 2]]; } }
    const fg = L(...t.color);
    const ratio = (Math.max(fg, best) + 0.05) / (Math.min(fg, best) + 0.05);
    res.push({ ...t, bg: rgb, bgL: best, ratio });
  }
  return JSON.stringify(res);
})()`;

async function measure(tab, name, width) {
  await load(tab, name, width, 1);
  const collected = JSON.parse(await tab.eval(COLLECT));
  await tab.eval(BARE);
  const b64 = await shotData(tab);
  const res = JSON.parse(await tab.eval(MEASURE(b64, JSON.stringify(collected.out))));
  // Global lightest pixel below the hero (content area only), same bare image.
  const global = JSON.parse(await tab.eval(`(async () => {
    const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const y0 = Math.ceil(${collected.heroBottom});
    const d = g.getImageData(0, y0, c.width, c.height - y0).data;
    // Skip the opaque plates: only pixels whose red channel is not the plate gradient matter, so keep it simple
    // and report the plain maximum; the plates are darker than any backdrop level we use, so they never win.
    let best = -1, rgb = null;
    for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]); if (l > best) { best = l; rgb = [d[i], d[i + 1], d[i + 2]]; } }
    return JSON.stringify({ best, rgb });
  })()`));
  return { res, global };
}

function summarize(label, { res, global }) {
  // Worst case per category: group by kind, class and color.
  const groups = new Map();
  for (const r of res) {
    const key = `${r.kind}|${r.cls}|${r.color.join(',')}`;
    const g = groups.get(key);
    if (!g || r.ratio < g.ratio) groups.set(key, r);
  }
  const rows = [...groups.values()].sort((a, b) => a.ratio - b.ratio);
  console.log(`\n== ${label} ==`);
  for (const r of rows) {
    const status = r.ratio >= r.min ? 'pass' : 'FAIL';
    console.log(`${status}  ${r.ratio.toFixed(2)}:1 (need ${r.min})  ${r.kind} .${r.cls} rgb(${r.color}) on rgb(${r.bg}) "${r.sample}"`);
  }
  const worst = rows[0];
  const worstText = rows.find((r) => r.kind === 'text');
  console.log(`WORST: ${worst.ratio.toFixed(2)}:1 ${worst.kind} .${worst.cls}; worst text ${worstText ? worstText.ratio.toFixed(2) : '-'}:1`);
}


// ------------------------------------------------------------------ strict bound

// The lightest backdrop pixel from the top of the first entry row down, with all content hidden. Any row, anywhere on the
// page, sits on something no lighter than this, so it is the bound that does not depend on where a long
// entry list happens to put its silk "Needs" lines.
async function backdropMax(tab, name, width) {
  await load(tab, name, width, 1);
  // From the top of the first entry row: nothing is drawn higher than that (the content's top padding, 56px, 40px on a phone).
  const heroBottom = await tab.eval("(() => { const c = document.querySelector('.content'); return c.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(c).paddingTop); })()");
  await tab.eval("document.head.insertAdjacentHTML('beforeend', '<style>.content,.site-footer,.hero .frame{visibility:hidden !important}</style>')");
  const b64 = await shotData(tab);
  return JSON.parse(await tab.eval(`(async () => {
    const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const y0 = Math.ceil(${heroBottom});
    const d = g.getImageData(0, y0, c.width, c.height - y0).data;
    let best = -1, rgb = null;
    for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]); if (l > best) { best = l; rgb = [d[i], d[i + 1], d[i + 2]]; } }
    return JSON.stringify({ best, rgb });
  })()`));
}

const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (fg, bg, a) => fg.map((v, i) => Math.round(v * a + bg[i] * (1 - a)));
const TOKENS = { ivory: [242, 233, 216], ash: [183, 163, 166], silk: [236, 85, 91], ember: [255, 122, 61], thread: [138, 100, 113] };
const NIGHT = [19, 11, 19];
const PAIRS = [
  ['Entry name, how line (ivory)', 'ivory', 4.5, false],
  ['Meta, step, how, needs (ash)', 'ash', 4.5, false],
  ['Can be missed (ember)', 'ember', 4.5, false],
  ['Needs line, Next flag (silk text)', 'silk', 4.5, false],
  ['Next flag (silk text) on the next row fill', 'silk', 4.5, true],
  ['Thread line, to do (thread)', 'thread', 3, false],
  ['Thread line, done, start thread, focus ring (silk line)', 'silk', 3, false],
];

function strictTable(label, bgRgb) {
  console.log(`\n-- strict bound ${label}: lightest backdrop pixel rgb(${bgRgb}) --`);
  for (const [what, tok, min, onFill] of PAIRS) {
    const bg = onFill ? mix(TOKENS.silk, bgRgb, 0.07) : bgRgb;
    const r = ratio(TOKENS[tok], bg);
    console.log(`${r >= min ? 'pass' : 'FAIL'}  ${r.toFixed(2)}:1 (need ${min})  ${what}`);
  }
}

function whiteTable(strength) {
  const px = NIGHT.map((v) => Math.round(v + strength * (255 - v)));
  strictTable(`for a pure white picture at strength ${strength}`, px);
}

// ------------------------------------------------------------------ main

await waitForChrome();
const tab = await openTab();

if (!onlyMeasure) {
  for (const [vname, width, scale] of [['desktop', 1280, 1], ['mobile', 390, 2]]) {
    for (const name of pages) {
      await load(tab, name, width, scale);
      const overflow = await tab.eval('document.documentElement.scrollWidth - document.documentElement.clientWidth');
      if (overflow > 0) console.log(`OVERFLOW ${name} ${vname}: ${overflow}px`);
      await writeFile(join(here, `${name}-${vname}.png`), Buffer.from(await shotData(tab), 'base64'));
    }
  }
  for (const width of [390, 360, 320]) {
    for (const name of pages) {
      await load(tab, name, width, 1);
      const overflow = await tab.eval('document.documentElement.scrollWidth - document.documentElement.clientWidth');
      const mainOverflow = await tab.eval("(() => { const m = document.querySelector('main'); return m.scrollWidth - m.clientWidth; })()");
      // main.scrollWidth is wider on pages with a picture hero because of the EXISTING hero text band
      // (left/right: -100vw in components.css), which .page clips. Take that band away to see that the
      // backdrop itself adds nothing.
      await tab.eval("document.head.insertAdjacentHTML('beforeend', '<style>.hero--picture .frame::before{display:none}</style>')");
      const withoutBand = await tab.eval("(() => { const m = document.querySelector('main'); return m.scrollWidth - m.clientWidth; })()");
      console.log(`${name} at ${width}: page overflow ${overflow}px, main overflow ${mainOverflow}px (${withoutBand}px without the hero text band)`);
    }
  }
}

for (const name of ['region-backdrop-a', 'region-backdrop-b', 'region-backdrop-c', 'region-locked-shown']) {
  for (const width of [1280, 390]) summarize(`${name} at ${width}`, await measure(tab, name, width));
}
for (const name of ['region-backdrop-a', 'region-backdrop-b', 'region-backdrop-c']) {
  for (const width of [1280, 390]) strictTable(`${name} at ${width}`, (await backdropMax(tab, name, width)).rgb);
}
for (const s of [0.05, 0.08, 0.10]) whiteTable(s);

chrome.kill();
console.log('\ndone');
process.exit(0);
