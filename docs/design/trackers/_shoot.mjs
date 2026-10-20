// Takes the PNG screenshots of every mockup page. Run (Playwright and Chromium are preinstalled):
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/node-tools/node_modules node docs/design/trackers/_shoot.mjs
// Desktop is 1280 wide at scale 1 (like docs/design/screens); phone is 390 wide at scale 2 so the text is readable.
// Also reports horizontal overflow at 390px and the focus ring shots.
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));

const pages = readdirSync(here).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
const views = [
  ['desktop', { width: 1280, height: 900 }, 1],
  ['mobile', { width: 390, height: 844 }, 2],
];

// Focus shots: [page, selector, name]. A Tab key press first tells Chromium the user is on the keyboard,
// so :focus-visible shows the ring the way it does for a real keyboard user.
const focusShots = [
  ['trackers-crests-partial', '#tab-crests', 'focus-tab', ['desktop', 'mobile']],
  ['trackers-crests-partial', '.entry-mark[aria-label="Sample crest three"]', 'focus-bead', ['desktop', 'mobile']],
  ['rosaries-partial', '.entry-mark[aria-label="Sample shop entry three"]', 'focus-bead', ['desktop', 'mobile']],
  ['rosaries-partial', '.tk-next .button', 'focus-button', ['desktop']],
  ['builds-full', '#crest-c3', 'focus-radio', ['desktop', 'mobile']],
];

const browser = await chromium.launch();
for (const [vname, size, scale] of views) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const name of pages) {
    await page.goto(pathToFileURL(join(here, `${name}.html`)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: '.mock-states{display:none !important}' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) console.log(`OVERFLOW ${name} ${vname}: ${overflow}px`);
    await page.screenshot({ path: join(here, `${name}-${vname}.png`), fullPage: true });
  }
  for (const [name, selector, label, onViews] of focusShots) {
    if (!onViews.includes(vname)) continue;
    await page.goto(pathToFileURL(join(here, `${name}.html`)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: '.mock-states{display:none !important}' });
    await page.keyboard.press('Tab');
    await page.locator(selector).first().focus();
    const box = await page.locator(selector).first().boundingBox();
    // A viewport shot around the focused control, not the whole page.
    const scrollY = await page.evaluate(() => window.scrollY);
    const y = Math.max(0, box.y + scrollY - 160);
    await page.screenshot({
      path: join(here, `${name}-${label}-${vname}.png`),
      fullPage: true,
      clip: { x: 0, y, width: size.width, height: Math.min(520, 4000) },
    });
  }
  await ctx.close();
}
// Narrower phones: no PNG, only a check that nothing scrolls sideways and the header stays on one row.
for (const width of [360, 320]) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await ctx.newPage();
  for (const name of pages) {
    await page.goto(pathToFileURL(join(here, `${name}.html`)).href);
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const navBottom = await page.evaluate(() => document.querySelector('.site-nav').getBoundingClientRect().bottom - document.querySelector('.page').getBoundingClientRect().top);
    if (overflow > 0) console.log(`OVERFLOW ${name} at ${width}: ${overflow}px`);
    if (name === 'trackers-crests-partial') console.log(`header bottom at ${width}: ${Math.round(navBottom)}px (hero reserves 124px)`);
  }
  await ctx.close();
}
await browser.close();
console.log('done');
