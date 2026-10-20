// Screenshots of the P5-10 addendum pages (addendum-*.html). Run (Playwright and Chromium are preinstalled):
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/node-tools/node_modules node docs/design/trackers/_shoot-addendum.mjs
// Desktop 1280 at scale 1 and phone 390 at scale 2, as in T30. The three header pages also get 360 and 320.
// Reports horizontal overflow and the number of header rows at 1280, 390, 360 and 320.
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const pages = readdirSync(here).filter((f) => f.startsWith('addendum-') && f.endsWith('.html')).map((f) => f.replace('.html', ''));
const headerPages = pages.filter((p) => p.startsWith('addendum-header-'));

const views = [
  ['desktop', 1280, 1, pages],
  ['mobile', 390, 2, pages],
  ['mobile-360', 360, 2, headerPages],
  ['mobile-320', 320, 2, headerPages],
];

const focusShots = [
  ['addendum-builds-saved', '#slot-red-0', 'focus-select', ['desktop', 'mobile']],
  ['addendum-builds-saved', '.os-row:nth-child(1) .os-btn:last-child', 'focus-stepper', ['desktop', 'mobile']],
  ['addendum-rosaries-shells-set', '#shell-shards', 'focus-shells', ['desktop', 'mobile']],
];

const hide = '.mock-states{display:none !important}';
const browser = await chromium.launch();
for (const [vname, width, scale, list] of views) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const name of list) {
    await page.goto(pathToFileURL(join(here, `${name}.html`)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: hide });
    const info = await page.evaluate(() => {
      const links = [...document.querySelectorAll('.site-nav a')].filter((a) => a.getBoundingClientRect().height > 0);
      const rows = new Set(links.map((a) => Math.round(a.getBoundingClientRect().top))).size;
      const base = document.querySelector('.page').getBoundingClientRect().top;
      const header = document.querySelector('.site-header').getBoundingClientRect().bottom - base;
      const title = document.querySelector('.hero-title').getBoundingClientRect().top - base;
      return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, rows, header: Math.round(header), title: Math.round(title) };
    });
    console.log(`${vname.padEnd(11)} ${name.padEnd(38)} overflow ${info.overflow}  nav rows ${info.rows}  header bottom ${info.header}  title top ${info.title}`);
    await page.screenshot({ path: join(here, `${name}-${vname}.png`), fullPage: true });
  }
  if (vname === 'desktop' || vname === 'mobile') {
    for (const [name, selector, label, onViews] of focusShots) {
      if (!onViews.includes(vname)) continue;
      await page.goto(pathToFileURL(join(here, `${name}.html`)).href);
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: hide });
      await page.keyboard.press('Tab');
      await page.locator(selector).first().focus();
      const box = await page.locator(selector).first().boundingBox();
      const scrollY = await page.evaluate(() => window.scrollY);
      const y = Math.max(0, box.y + scrollY - 160);
      await page.screenshot({ path: join(here, `${name}-${label}-${vname}.png`), fullPage: true, clip: { x: 0, y, width, height: 460 } });
    }
  }
  await ctx.close();
}
await browser.close();
console.log('done');
