// Screenshots of the P5-31 pages (addendum-places-*, addendum-templates-*) and the regenerated Rosaries page.
// Run (Playwright and Chromium are preinstalled):
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/node-tools/node_modules node docs/design/trackers/_shoot-places.mjs
// Desktop 1280 at scale 1; phone 390 and 320 at scale 2 (T30 used 390 only). Keyboard focus crops for the new
// controls at 1280 and 390. Prints horizontal overflow per page and size. Only these pages are shot, so earlier
// PNGs are not touched (re-shooting everything changes many PNGs by a few pixels).
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const pages = readdirSync(here)
  .filter((f) => f.endsWith('.html') && (/^addendum-(places|templates)-/.test(f) || f === 'addendum-rosaries.html'))
  .map((f) => f.replace('.html', ''));

const views = [['desktop', 1280, 1], ['mobile', 390, 2], ['mobile-320', 320, 2]];

// [page, selector, label]
const focusShots = [
  ['addendum-places-visited', '.pl-section .source-link', 'focus-source'],
  ['addendum-places-visited', '#place-door-one .source-link', 'focus-map'],
  ['addendum-places-sold-by', '.tk-sold a', 'focus-sold-by'],
  ['addendum-templates-list', '.tp .button', 'focus-use'],
  ['addendum-templates-ask', '.tp-ask .button--secondary', 'focus-ask'],
  ['addendum-templates-option-b', '.rail-section .switch-input', 'focus-switch'],
];

const hide = '.mock-states{display:none !important}';
const browser = await chromium.launch();
for (const [vname, width, scale] of views) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const name of pages) {
    await page.goto(pathToFileURL(join(here, `${name}.html`)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: hide });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const wide = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      return [...document.querySelectorAll('main *')]
        .filter((e) => e.getBoundingClientRect().right > w + 1 && e.getBoundingClientRect().width > 0)
        .slice(0, 3)
        .map((e) => e.className || e.tagName);
    });
    console.log(`${vname.padEnd(11)} ${name.padEnd(40)} overflow ${overflow}${wide.length ? '  wide: ' + wide.join(', ') : ''}`);
    await page.screenshot({ path: join(here, `${name}-${vname}.png`), fullPage: true });
  }
  if (vname !== 'mobile-320') {
    for (const [name, selector, label] of focusShots) {
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
