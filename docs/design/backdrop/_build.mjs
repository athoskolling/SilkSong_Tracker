// Writes the static mockup pages in this folder. Run: node docs/design/backdrop/_build.mjs
// The markup copies what js/render.js builds for a Region page (hero, thread, entry rows, side plate), so
// the real css/base.css and css/components.css apply unchanged. Only backdrop.css is new.
// ALL CONTENT BELOW IS INVENTED to show states ("Sample tool"). None of it is guide data; never copy it
// into data/. The picture is the placeholder Athos supplied (img/regions/deep-docks.png, (c) Team Cherry).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = '../../../';
const IMAGE = `${site}img/regions/deep-docks.png`;
const HERO_POSITION = '50% 40%'; // the default heroPosition (DESIGN.md section 5)

const NAV = [
  ['index.html', 'Regions'],
  ['route.html', 'Route'],
  ['trackers.html', 'Trackers'],
  ['account.html', 'Account and backup'],
];

function header() {
  const links = NAV.map(([href, label]) => {
    const cur = label === 'Regions' ? ' aria-current="page"' : '';
    const text = label === 'Account and backup' ? 'Account<span class="nav-extra"> and backup</span>' : label;
    return `<a href="${site}${href}"${cur}>${text}</a>`;
  }).join('\n          ');
  return `<header class="site-header">
      <div class="frame">
        <a class="logo" href="${site}index.html">
          <svg class="logo-mark" viewBox="0 0 30 18" aria-hidden="true"><path class="line" d="M3 9 H29"/><ellipse class="eye" cx="4.5" cy="9" rx="2.3" ry="3.6"/></svg>
          Silksong guide
        </a>
        <nav class="site-nav nav-short" aria-label="Main">
          ${links}
        </nav>
      </div>
    </header>`;
}

const STATES = [
  ['region-backdrop-a.html', 'Backdrop a (very faint)'],
  ['region-backdrop-b.html', 'Backdrop b (faint)'],
  ['region-backdrop-c.html', 'Backdrop c (moderate)'],
  ['region-no-image.html', 'No image'],
  ['region-locked.html', 'Locked (recommended)'],
  ['region-locked-shown.html', 'Locked (backdrop shown)'],
];

function stateBar(current) {
  const links = STATES.map(([file, label]) => `<a href="${file}"${file === current ? ' aria-current="page"' : ''}>${label}</a>`).join(' &middot; ');
  return `<div class="banner mock-states">Mockup with invented content, not guide data. Other mockups: ${links}</div>`;
}

// ------------------------------------------------------------------ rows (same markup as render.js entryRow)

const HOW = {
  a: 'Sample text that says how to do this, in our own words.',
  b: 'Sample text for the second row. It stays within about two lines of the entry list.',
  c: 'Sample text for a row that waits on something else.',
};

function row(o) {
  const markKind = o.kind === 'task' ? 'mark--knot' : 'mark--bead';
  const markState = o.done ? ' is-done' : o.blocked ? ' is-blocked' : '';
  const markNext = o.next ? ' is-next' : '';
  const thread = `entry-thread${o.done ? ' is-clear' : ''}${o.blocked ? ' is-blocked' : ''}`;
  const needsId = `needs-${o.id}`;
  const meta = [
    `<span>${o.type}</span>`,
    o.area ? `<span>${o.area}</span>` : '',
    o.missable ? '<span class="flag-missable">Can be missed</span>' : '',
    o.next ? '<span class="flag-next">Next on the route</span>' : '',
    `<a class="source-link" href="#" target="_blank" rel="noopener noreferrer" aria-label="Source for ${o.name}">Source</a>`,
  ].filter(Boolean).join('');
  return `            <li class="entry${o.next ? ' entry--next' : ''}${o.done ? ' is-done' : ''}">
              <div class="entry-rail">
                <span class="${thread}" aria-hidden="true"></span>
                <button type="button" class="entry-mark" aria-pressed="${!!o.done}" aria-label="${o.name}"${o.needs ? ` aria-describedby="${needsId}"` : ''}><span class="mark ${markKind}${markState}${markNext}"></span></button>
              </div>
              <div class="entry-body">
                <div class="entry-head"><span class="entry-name">${o.name}</span><span class="entry-step num">Step ${o.step}</span></div>
                <div class="entry-meta">${meta}</div>
                <p class="entry-how">${o.how}</p>${o.missable ? `\n                <p class="entry-needs">${o.note}</p>` : ''}${o.needs ? `\n                <p id="${needsId}" class="${o.needsMissing ? 'entry-needs is-missing' : 'entry-needs'}">${o.needs}</p>` : ''}
              </div>
            </li>`;
}

const ROWS = [
  { id: 'e1', kind: 'collectible', name: 'Sample ability', type: 'Ability', how: HOW.a, step: 34, done: true },
  { id: 'e2', kind: 'task', name: 'Sample errand above the bench', type: 'Quest', how: HOW.b, step: 35, next: true, needs: 'Needs Sample ability, done' },
  { id: 'e3', kind: 'task', name: 'Sample boss', type: 'Boss', how: HOW.a, step: 36 },
  { id: 'e4', kind: 'collectible', name: 'Sample tool', type: 'Tool', area: 'Sample yard', how: HOW.b, step: 37, missable: true, note: 'Sample note on when this can be missed and why.' },
  { id: 'e5', kind: 'task', name: 'Sample door', type: 'Door', area: 'Sample gate', how: HOW.a, step: 38, blocked: true, needs: 'Needs Sample key', needsMissing: true },
  { id: 'e6', kind: 'collectible', name: 'Sample mask shard', type: 'Mask shard', how: HOW.c, step: 39 },
  { id: 'e7', kind: 'collectible', name: 'Sample crest', type: 'Crest', area: 'Sample tower', how: HOW.c, step: 40, blocked: true, needs: 'Needs the sample door', needsMissing: true },
  { id: 'e8', kind: 'task', name: 'Sample delivery', type: 'Quest', how: HOW.b, step: 41, blocked: true, needs: 'Needs Sample crest, plus 2 earlier steps', needsMissing: true },
  { id: 'e9', kind: 'collectible', name: 'Sample silk skill', type: 'Silk skill', how: HOW.a, step: 42, blocked: true, needs: 'Needs Sample delivery', needsMissing: true },
].map(row).join('\n');

// ------------------------------------------------------------------ side plate (same markup as render.js)

function bar(kind, label, done, total) {
  const percent = Math.round((done / total) * 100);
  const text = `${done} of ${total}`;
  return `<div class="count-block">
              <div class="count-row count-row--${kind}"><span>${label}</span><span class="count-value num">${text}</span></div>
              <div class="bar bar--${kind}" role="progressbar" aria-label="${label}: ${text}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
                <div class="bar-track"></div>
                <div class="bar-fill" style="width:${percent}%"></div>
                <svg class="bar-needle" width="28" height="18" viewBox="0 0 28 18" aria-hidden="true" style="left:calc(${percent}% - 22px)"><path class="line" d="M3 9 H27"/><ellipse class="eye" cx="4.5" cy="9" rx="2.3" ry="3.6"/></svg>
              </div>
            </div>`;
}

const sw = (label, checked) =>
  `<label class="switch"><input type="checkbox" class="switch-input"${checked ? ' checked' : ''}><span class="switch-track" aria-hidden="true"></span><span class="switch-text">${label}</span></label>`;

const SIDE_COUNTS = `          <aside class="plate plate--counts">
            <h2 class="plate-heading">Your thread here</h2>
            ${bar('collectibles', 'Collectibles', 1, 4)}
            ${bar('tasks', 'Tasks', 0, 5)}
            <div class="toggles">${sw('I have visited this region', true)}${sw('Show everything, spoilers included', false)}</div>
            <p class="plate-help">A bead is a collectible. Most count toward your totals; a few are only tracked and do not. A knot is a task: it adds nothing by itself but opens something else. A dashed thread means something is still missing.</p>
          </aside>`;

// ------------------------------------------------------------------ pages

const FOOTER_NOTE = 'Layout sample. Names, steps and counts are invented to show the page; they are not guide data.';
const CREDIT = 'Screenshot from Hollow Knight: Silksong, &copy; Team Cherry.';

// opts.picture: the hero shows the picture. opts.strength: 'a' | 'b' | 'c' | null (no backdrop).
function page({ file, title, picture, strength, locked, main, credit }) {
  const heroImg = picture ? `<img class="hero-img" src="${IMAGE}" alt="" style="object-position:${HERO_POSITION}">` : '';
  const heroClass = ['hero', locked ? 'hero--locked' : '', picture ? 'hero--picture' : ''].filter(Boolean).join(' ');
  const intro = locked
    ? 'Locked. You cannot enter yet. Finish what is below and this region opens.'
    : 'Sample summary line. In the product this is the Region summary, written in our own words.';
  const backdrop = strength
    ? `<div class="backdrop backdrop--${strength}" aria-hidden="true"><img src="${IMAGE}" alt="" decoding="async" fetchpriority="low" style="object-position:${HERO_POSITION}"></div>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Silksong guide (mockup)</title>
  <link rel="stylesheet" href="../../../css/base.css">
  <link rel="stylesheet" href="../../../css/components.css">
  <link rel="stylesheet" href="backdrop.css">
</head>
<body data-page="region">
  <a class="skip-link" href="#app">Skip to the region</a>
  ${stateBar(file)}
  <div class="page">
    ${header()}
    <main id="app" tabindex="-1"${strength ? ' class="has-backdrop"' : ''}>
      ${backdrop}
      <section class="${heroClass}">
        ${heroImg}
        <div class="hero-shade"></div>
        <div class="hero-shade hero-shade--title"></div>
        <div class="frame">
          <a class="crumb" href="${site}index.html">All regions</a>
          <h1 class="hero-title">Deep Docks</h1>
          <p class="hero-intro">${intro}</p>
        </div>
      </section>
      <div class="frame">
        <div class="content">
          <div class="${locked ? 'start-thread is-dashed' : 'start-thread'}" aria-hidden="true"></div>
${main}
        </div>
      </div>
    </main>
    <footer class="frame site-footer">
      ${credit ? `<p>${CREDIT}</p>` : ''}
      <p>Guide text written in our own words from the Hollow Knight: Silksong wiki and other references. Each entry links its source. Not affiliated with Team Cherry.</p>
      <p>${FOOTER_NOTE}</p>
    </footer>
  </div>
  <div class="visually-hidden" aria-live="polite" role="status"></div>
</body>
</html>
`;
}

const openMain = `        <div class="layout">
          <div class="main-column">
            <h2 class="visually-hidden">Entries in this region</h2>
            <ol class="entries">
${ROWS}
            </ol>
          </div>
${SIDE_COUNTS}
        </div>`;

// Locked: the missing chain (same markup as render.js lockedChain) and the "stay hidden" plate.
const lockedMain = `        <div class="layout">
          <div class="main-column">
            <h2 class="visually-hidden">What this region needs</h2>
            <ol class="chain">
              <li class="entry is-done">
                <div class="entry-rail"><span class="entry-thread is-clear" aria-hidden="true"></span><span class="mark mark--static mark--bead is-done" aria-hidden="true"></span></div>
                <div class="entry-body"><span class="entry-name">Sample ability</span><div class="entry-meta"><span>Ability in Region A</span><a class="source-link" href="#" aria-label="Source for Sample ability">Source</a></div><p class="entry-state">Collected</p></div>
              </li>
              <li class="entry">
                <div class="entry-rail"><span class="entry-thread is-blocked" aria-hidden="true"></span><span class="mark mark--static mark--knot is-blocked" aria-hidden="true"></span></div>
                <div class="entry-body"><span class="entry-name">Sample boss</span><div class="entry-meta"><span>Boss in Region A</span><a class="source-link" href="#" aria-label="Source for Sample boss">Source</a></div><p class="entry-state is-missing">Not done yet</p><p class="entry-link"><a href="#">Go to Region A</a></p></div>
              </li>
              <li class="entry entry-region">
                <div class="entry-rail"><span class="mark mark--bead mark--static mark--region" aria-hidden="true"></span></div>
                <div class="entry-body"><span class="entry-name">Deep Docks</span><p class="entry-note">Opens when the steps above are done.</p></div>
              </li>
            </ol>
          </div>
          <aside class="plate">
            <h2 class="plate-heading">Its entries stay hidden</h2>
            <p class="plate-text">They appear once you visit the region. Turn on show everything if you want to read ahead.</p>
            <div class="toggles">${sw('Show everything, spoilers included', false)}</div>
          </aside>
        </div>`;

const files = {
  'region-backdrop-a.html': page({ file: 'region-backdrop-a.html', title: 'Region, backdrop a', picture: true, strength: 'a', main: openMain, credit: true }),
  'region-backdrop-b.html': page({ file: 'region-backdrop-b.html', title: 'Region, backdrop b', picture: true, strength: 'b', main: openMain, credit: true }),
  'region-backdrop-c.html': page({ file: 'region-backdrop-c.html', title: 'Region, backdrop c', picture: true, strength: 'c', main: openMain, credit: true }),
  'region-no-image.html': page({ file: 'region-no-image.html', title: 'Region without an image', picture: false, strength: null, main: openMain, credit: false }),
  // Locked, recommended: the picture is not shown anywhere, same as render.js today.
  'region-locked.html': page({ file: 'region-locked.html', title: 'Locked Region', picture: false, strength: null, locked: true, main: lockedMain, credit: false }),
  // Locked with the backdrop on, only so Athos can compare. Strength b.
  'region-locked-shown.html': page({ file: 'region-locked-shown.html', title: 'Locked Region, backdrop shown', picture: false, strength: 'b', locked: true, main: lockedMain, credit: false }),
};

for (const [name, html] of Object.entries(files)) writeFileSync(join(here, name), html);
console.log(`wrote ${Object.keys(files).length} files`);
