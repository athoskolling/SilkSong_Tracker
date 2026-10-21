// Takes the PNG screenshots of every mockup page here, and runs the checks that do not need eyes.
// No Playwright on this machine, so this drives the system Chromium over the DevTools protocol with Node's
// built-in WebSocket. Run: node docs/design/goal/_shoot.mjs   (needs /usr/bin/chromium; set CHROMIUM to change)
// Desktop is 1280 wide at scale 1 (like docs/design/screens); phone is 390 wide at scale 2 so the text is readable.
// Checks: no horizontal scroll at 390, 360 and 320; every .goal-btn and .entry-mark is at least 44px tall and
// the buttons at least 44px wide; no two controls overlap; the focus ring shot of the control.
import { spawn } from 'node:child_process';
import { readdirSync, mkdtempSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pages = readdirSync(here).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
const port = 9333;
const profile = mkdtempSync(join(tmpdir(), 'goal-shoot-'));

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
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); return r.result.value; }
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
  await tab.eval('document.fonts.ready.then(() => true)');
  // The state strip links the mockups together; it is not part of the design.
  await tab.eval("document.head.insertAdjacentHTML('beforeend', '<style>.mock-states{display:none !important}</style>')");
}

async function shot(tab, path, clip) {
  const height = await tab.eval('document.documentElement.scrollHeight');
  const width = await tab.eval('document.documentElement.clientWidth');
  const { data } = await tab.send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true, fromSurface: true,
    clip: clip || { x: 0, y: 0, width, height, scale: 1 },
  });
  await writeFile(path, Buffer.from(data, 'base64'));
}

await waitForChrome();
const tab = await openTab();

for (const [vname, width, scale] of [['desktop', 1280, 1], ['mobile', 390, 2]]) {
  for (const name of pages) {
    await load(tab, name, width, scale);
    const overflow = await tab.eval('document.documentElement.scrollWidth - document.documentElement.clientWidth');
    if (overflow > 0) console.log(`OVERFLOW ${name} ${vname}: ${overflow}px`);
    await shot(tab, join(here, `${name}-${vname}.png`));
  }
}

// Narrower phones: no PNG, only a check that nothing scrolls sideways.
for (const width of [360, 320]) {
  for (const name of pages) {
    await load(tab, name, width, 1);
    const overflow = await tab.eval('document.documentElement.scrollWidth - document.documentElement.clientWidth');
    if (overflow > 0) console.log(`OVERFLOW ${name} at ${width}: ${overflow}px`);
  }
}

// Target sizes and overlaps, at both widths.
for (const width of [1280, 390]) {
  for (const name of pages) {
    await load(tab, name, width, 1);
    const report = await tab.eval(`(() => {
      const out = [];
      const boxes = [...document.querySelectorAll('.goal-btn, .entry-mark')].map((el) => ({ el, r: el.getBoundingClientRect() }));
      for (const { el, r } of boxes) {
        if (r.height < 43.5) out.push('short ' + (el.className) + ' ' + Math.round(r.height));
        if (el.classList.contains('goal-btn') && r.width < 43.5) out.push('narrow ' + Math.round(r.width));
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].r, b = boxes[j].r;
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push('overlap ' + boxes[i].el.className + ' / ' + boxes[j].el.className);
      }
      return JSON.stringify({ controls: boxes.filter((x) => x.el.classList.contains('goal-btn')).map((x) => Math.round(x.r.width) + 'x' + Math.round(x.r.height)), problems: out });
    })()`);
    console.log(`${name} at ${width}: ${report}`);
  }
}

// Focus ring on the control (a Tab first, so :focus-visible shows the ring the way it does for a keyboard user).
for (const [vname, width, scale] of [['desktop', 1280, 1], ['mobile', 390, 2]]) {
  await load(tab, 'row-button', width, scale);
  await tab.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await tab.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await tab.eval("document.querySelector('.entries .goal-btn').focus()");
  const y = await tab.eval("document.querySelector('.entries .goal-btn').getBoundingClientRect().top + window.scrollY");
  const w = await tab.eval('document.documentElement.clientWidth');
  await shot(tab, join(here, `row-button-focus-${vname}.png`), { x: 0, y: Math.max(0, y - 300), width: w, height: 480, scale: 1 });
}

chrome.kill();
console.log('done');
process.exit(0);
