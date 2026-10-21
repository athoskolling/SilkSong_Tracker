// Writes the static mockup pages in this folder. Run: node docs/design/goal/_build.mjs
// Why a script: the six pages share a header, hero, footer, the row markup and the control, and the counts
// (rows left, how many are Available now) are worked out from the sample rows here, so every page agrees.
// The output is plain HTML with no script and no build step.
// ALL CONTENT BELOW IS INVENTED to show states ("Example relic", "Region A"). None of it is game data;
// never copy it into data/.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = '../../../'; // the real pages, for the header links

// ------------------------------------------------------------------ shared pieces

const NAV = [
  ['index.html', 'Regions'],
  ['route.html', 'Route'],
  ['trackers.html', 'Trackers'],
  ['account.html', 'Account and backup'],
];

// The header keeps its links as they are: there is no Goal link (DESIGN.md, Goal brief).
function header(current) {
  const links = NAV.map(([href, label]) => {
    const cur = label === current ? ' aria-current="page"' : '';
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
  ['goal-page.html', 'Goal page'],
  ['goal-none.html', 'No goal'],
  ['goal-done.html', 'Goal done'],
  ['goal-retired.html', 'Goal not in the guide'],
  ['home-plate.html', 'Home plate'],
  ['row-button.html', 'Row control'],
];

function stateBar(current) {
  const links = STATES.map(([file, label]) => `<a href="${file}"${file === current ? ' aria-current="page"' : ''}>${label}</a>`).join(' &middot; ');
  return `<div class="banner mock-states">Mockup with invented content, not guide data. Other mockups: ${links}</div>`;
}

const FOOTER_NOTE =
  'Layout sample. Names, steps, counts and states are invented to show what a screen can look like; they are not guide data.';

function page({ file, title, bodyAttr, navCurrent = null, heroClass = 'hero hero--short', crumb, h1, intro, main, contentClass = 'content', thread = true }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Silksong guide (mockup)</title>
  <link rel="stylesheet" href="../../../css/base.css">
  <link rel="stylesheet" href="../../../css/components.css">
  <link rel="stylesheet" href="goal.css">
</head>
<body data-page="${bodyAttr}">
  <a class="skip-link" href="#app">Skip to the content</a>
  ${stateBar(file)}
  <div class="page">
    ${header(navCurrent)}
    <main id="app" tabindex="-1">
      <section class="${heroClass}">
        <div class="hero-shade"></div>
        <div class="hero-shade hero-shade--title"></div>
        <div class="frame">
          ${crumb ? `<a class="crumb" href="${crumb.href}">${crumb.label}</a>` : ''}
          <h1 class="hero-title">${h1}</h1>
          <p class="hero-intro">${intro}</p>
        </div>
      </section>
      <div class="frame">
        <div class="${contentClass}">
          ${thread ? '<div class="start-thread start-thread--short" aria-hidden="true"></div>' : ''}
${main}
        </div>
      </div>
    </main>
    <footer class="frame site-footer">
      <p>Guide text written in our own words from the Hollow Knight: Silksong wiki and other references. Each entry links its source. Not affiliated with Team Cherry.</p>
      <p>${FOOTER_NOTE}</p>
    </footer>
  </div>
  <div class="visually-hidden" aria-live="polite" role="status"></div>
</body>
</html>
`;
}

// ------------------------------------------------------------------ the control

// The control. The visible words are the start of the accessible name, and the entry's name follows in
// visually hidden text, so a screen reader hears which entry it belongs to and the visible label is still
// part of the name (WCAG 2.5.3). aria-pressed carries the state; the words change as well, for sighted users.
function goalButton(name, pressed) {
  return `<button type="button" class="goal-btn" aria-pressed="${pressed}"><svg class="goal-icon" viewBox="0 0 24 14" aria-hidden="true"><path class="line" d="M1 7 H23"/><ellipse class="eye" cx="6" cy="7" rx="3" ry="4.6"/></svg><span>${pressed ? 'Your goal' : 'Make this my goal'}<span class="visually-hidden">: ${name}</span></span></button>`;
}

// ------------------------------------------------------------------ rows

const HOW = {
  a: 'Sample text that says how to do this, in our own words.',
  b: 'Sample text for the second row. It stays within about two lines.',
  c: 'Sample text for a row that waits on something else.',
};

// One row on the thread.
// opts: kind ('collectible' | 'task'), name, type, region ({name} or null), area, how, step, missable, note,
//       next (the stitched row), done, needs (text or null), goalFlag (the Goal's own row on the Goal page),
//       availableFlag, control (null | 'off' | 'on')
function row(o) {
  const markKind = o.kind === 'task' ? 'mark--knot' : 'mark--bead';
  const markState = o.done ? ' is-done' : o.next ? ' is-next' : o.needs ? ' is-blocked' : '';
  const thread = `entry-thread${o.done ? ' is-clear' : ''}${o.needs ? ' is-blocked' : ''}`;
  const needsId = `needs-${o.id}`;
  const meta = [
    `<span>${o.type}</span>`,
    o.region ? `<span><a class="region-link" href="#">${o.region}</a></span>` : '',
    o.area ? `<span>${o.area}</span>` : '',
    o.missable ? '<span class="flag-missable">Can be missed</span>' : '',
    o.availableFlag ? '<span class="flag-next">Available now</span>' : '',
    o.goalFlag ? '<span class="flag-goal">Your goal</span>' : '',
    o.source === false ? '' : '<a class="source-link" href="#" target="_blank" rel="noopener">Source</a>',
  ]
    .filter(Boolean)
    .join('');
  const control = o.control ? `\n                <div class="entry-actions">${goalButton(o.name, o.control === 'on')}</div>` : '';
  return `            <li class="entry${o.next ? ' entry--next' : ''}${o.done ? ' is-done' : ''}">
              <div class="entry-rail">
                <span class="${thread}" aria-hidden="true"></span>
                <button type="button" class="entry-mark" aria-pressed="${!!o.done}" aria-label="${o.name}"${o.needs ? ` aria-describedby="${needsId}"` : ''}><span class="mark ${markKind}${markState}"></span></button>
              </div>
              <div class="entry-body">
                <div class="entry-head"><span class="entry-name">${o.name}</span><span class="entry-step num">Step ${o.step}</span></div>
                <div class="entry-meta">${meta}</div>
                <p class="entry-how">${o.how}</p>${o.missable ? `\n                <p class="entry-needs">${o.note}</p>` : ''}${o.needs ? `\n                <p id="${needsId}" class="entry-needs is-missing">${o.needs}</p>` : ''}${control}
              </div>
            </li>`;
}

// ------------------------------------------------------------------ the sample Goal

// What pathTo would return for the Goal: the missing rows in Route order, the Goal itself last.
// available is the flag the page shows as "Available now".
const GOAL_ROWS = [
  { id: 'g1', kind: 'task', name: 'Sample boss', type: 'Boss', region: 'Region A', area: 'Sample hall', how: HOW.a, step: 12, available: true },
  { id: 'g2', kind: 'task', name: 'Example door', type: 'Door', region: 'Region A', area: 'Sample gate', how: HOW.b, step: 14, needs: 'Needs Sample boss' },
  {
    id: 'g3', kind: 'collectible', name: 'Example tool', type: 'Tool', region: 'Region B', area: 'Sample yard', how: HOW.c, step: 21,
    missable: true, note: 'Sample note on when this can be missed and why.', needs: 'Needs Example door',
  },
  { id: 'g4', kind: 'task', name: 'Sample errand', type: 'Quest', region: 'Region B', area: 'Sample market', how: HOW.a, step: 22, needs: 'Needs Example tool' },
  { id: 'g5', kind: 'collectible', name: 'Example crest', type: 'Crest', region: 'Region C', area: 'Sample tower', how: HOW.b, step: 30, needs: 'Needs Sample errand' },
  { id: 'g6', kind: 'collectible', name: 'Example relic', type: 'Ability', region: 'Region C', area: 'Sample vault', how: HOW.c, step: 33, needs: 'Needs Example crest', goal: true },
];
const rowsLeft = GOAL_ROWS.length;
const availableNow = GOAL_ROWS.filter((r) => r.available);
const goal = GOAL_ROWS[GOAL_ROWS.length - 1];
const firstAvailable = availableNow[0];
const rowsText = (n) => `${n} ${n === 1 ? 'row' : 'rows'}`;

// ------------------------------------------------------------------ 1. goal-page

const goalList = GOAL_ROWS.map((r) =>
  row({ ...r, next: r.available, availableFlag: r.available, goalFlag: !!r.goal })
).join('\n');

const goalPage = page({
  file: 'goal-page.html',
  title: 'Your goal',
  bodyAttr: 'goal',
  h1: 'Your goal',
  intro: 'Everything it still needs, in route order, with the goal last.',
  main: `        <div class="layout layout--route">
          <aside class="plate plate--rail route-rail" aria-labelledby="goal-heading">
            <div class="rail-section">
              <h2 class="plate-heading" id="goal-heading">Your goal</h2>
              <p class="goal-rail-name">${goal.name}</p>
              <div class="entry-meta goal-rail-meta"><span>${goal.type}</span><span><a class="region-link" href="#">${goal.region}</a></span></div>
              <p class="goal-count" aria-live="polite"><span class="goal-count-num num">${rowsLeft}</span><span class="goal-count-label">${rowsLeft === 1 ? 'row' : 'rows'} left, the goal included. <strong>${availableNow.length} available now.</strong></span></p>
              <div class="goal-rail-actions"><button type="button" class="button button--secondary">Clear my goal</button></div>
              <p class="plate-help">Every row is shown in full, spoilers included, because you chose this goal.</p>
              <p class="plate-help">Your goal is kept on this device only. It is not in the backup file.</p>
            </div>
          </aside>
          <div class="main-column">
            <h2 class="visually-hidden">What it still needs</h2>
            <ol class="entries goal-list">
${goalList}
            </ol>
            <p class="route-legend plate-help">Tick a row when you finish it and it leaves the list. A bead is a collectible and a knot is a task. A dashed thread means something is still missing.</p>
          </div>
        </div>`,
});

// ------------------------------------------------------------------ 2 to 4. messages

const TRAIL = `<p class="next-actions"><a href="${site}route.html">Open the route</a><a href="${site}trackers.html">Open the trackers</a></p>`;

const goalNone = page({
  file: 'goal-none.html',
  title: 'Your goal',
  bodyAttr: 'goal',
  h1: 'Your goal',
  intro: 'Pick one entry and see everything it still needs.',
  thread: false,
  main: `        <section class="plate goal-message" aria-labelledby="goal-heading">
          <h2 class="goal-message-title" id="goal-heading">You have no goal yet</h2>
          <p class="goal-message-text">Choose an entry with Make this my goal on the route, on a region page or in a tracker. This page then lists everything it still needs, in route order.</p>
          ${TRAIL}
        </section>`,
});

const goalDone = page({
  file: 'goal-done.html',
  title: 'Your goal',
  bodyAttr: 'goal',
  h1: 'Your goal',
  intro: 'Pick one entry and see everything it still needs.',
  thread: false,
  main: `        <section class="plate goal-message goal-message--done" aria-labelledby="goal-heading">
          <p class="goal-message-label">Done</p>
          <h2 class="goal-message-title" id="goal-heading">${goal.name}</h2>
          <div class="entry-meta goal-rail-meta"><span>${goal.type}</span><span><a class="region-link" href="#">${goal.region}</a></span></div>
          <p class="goal-message-text">You marked your goal as done. Clear it, then choose another from the route, a region page or a tracker.</p>
          <div class="goal-rail-actions"><button type="button" class="button button--primary">Clear my goal</button><a href="${site}route.html">Open the route</a></div>
          <p class="plate-help">Your goal is kept on this device only. It is not in the backup file.</p>
        </section>`,
});

const goalRetired = page({
  file: 'goal-retired.html',
  title: 'Your goal',
  bodyAttr: 'goal',
  h1: 'Your goal',
  intro: 'Pick one entry and see everything it still needs.',
  thread: false,
  main: `        <section class="plate goal-message" aria-labelledby="goal-heading">
          <h2 class="goal-message-title" id="goal-heading">Your goal is no longer in the guide</h2>
          <p class="goal-message-text">The entry you chose was removed or replaced when the guide was updated, so there is nothing to list. Clear it, then choose another entry.</p>
          <div class="goal-rail-actions"><button type="button" class="button button--primary">Clear my goal</button><a href="${site}route.html">Open the route</a></div>
          <p class="plate-help">Your goal is kept on this device only. It is not in the backup file.</p>
        </section>`,
});

// ------------------------------------------------------------------ 5. home-plate

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

const HOME_NEXT = { name: 'Sample next entry', type: 'Tool', region: 'Region A', step: 11 };

const homeMain = `        <div class="layout layout--home">
          <div class="home-main">
            <section class="next-plate" aria-labelledby="next-heading">
              <span class="next-label">Next on the route</span>
              <h2 class="next-name" id="next-heading">${HOME_NEXT.name}</h2>
              <div class="entry-meta next-meta"><span>${HOME_NEXT.type}</span><span>${HOME_NEXT.region}</span><span class="num">Step ${HOME_NEXT.step}</span><a class="source-link" href="#" target="_blank" rel="noopener">Source</a></div>
              <p class="next-how">${HOW.a}</p>
              <p class="next-actions"><a href="${site}route.html">See the whole route</a><a href="#">Open ${HOME_NEXT.region}</a>${goalButton(HOME_NEXT.name, false)}</p>
            </section>
            <section class="plate goal-plate" aria-labelledby="goal-plate-heading">
              <h2 class="plate-heading" id="goal-plate-heading">Your goal</h2>
              <div class="goal-plate-body">
                <div>
                  <p class="goal-plate-name">${goal.name}</p>
                  <div class="entry-meta"><span>${goal.type}</span><span>${goal.region}</span></div>
                  <p class="goal-plate-count"><strong class="num">${rowsLeft}</strong> ${rowsLeft === 1 ? 'row' : 'rows'} left, the goal included.</p>
                </div>
                <div>
                  <p class="goal-plate-label">Available now</p>
                  <p class="goal-plate-first">${firstAvailable.name}</p>
                  <div class="entry-meta"><span>${firstAvailable.type}</span><span>${firstAvailable.region}</span></div>
                </div>
              </div>
              <p class="next-actions"><a href="goal-page.html">See everything it needs</a></p>
            </section>
            <section aria-labelledby="holding-heading">
              <h2 class="section-heading" id="holding-heading">What is holding you up</h2>
              <p class="section-intro">The things you are missing that block the most entries or a whole region.</p>
              <ul class="holding-list">
                <li class="holding-item"><span class="mark mark--knot holding-mark" aria-hidden="true"></span><div><span class="holding-name">Sample blocker</span><p class="holding-text">Blocks Sample entry and 1 more entry in Region B.</p></div></li>
              </ul>
              <p class="holding-more"><a href="${site}route.html">See everything on the route</a></p>
            </section>
          </div>
          <aside class="plate plate--counts" aria-labelledby="thread-heading">
            <h2 class="plate-heading" id="thread-heading">Your thread</h2>
            ${bar('collectibles', 'Collectibles', 7, 18)}
            ${bar('tasks', 'Tasks', 4, 9)}
          </aside>
        </div>
        <section class="regions" aria-labelledby="regions-heading">
          <h2 class="section-heading section-heading--big" id="regions-heading">Regions</h2>
          <p class="section-intro section-intro--wide">A region opens when you meet what it needs. Entries in regions you have not visited stay hidden until you visit them or choose to show everything.</p>
          <ul class="region-grid">
            <li><a class="region-card region-card--next" href="#"><div class="card-body"><div class="card-state"><span class="state-dot state-dot--visited" aria-hidden="true"></span>Visited</div><h3 class="card-name">Region A</h3>${bar('collectibles', 'Collectibles', 2, 5).replace(/<svg[^]*?<\/svg>/, '')}<p class="card-next">Next on the route is here</p></div></a></li>
            <li><a class="region-card region-card--available" href="#"><div class="card-body"><div class="card-state"><span class="state-dot state-dot--available" aria-hidden="true"></span>Available</div><h3 class="card-name">Region B</h3><p class="card-note">Not visited yet. Its entries are hidden.</p></div></a></li>
            <li><a class="region-card region-card--locked" href="#"><div class="card-body"><div class="card-state"><span class="state-dot state-dot--locked" aria-hidden="true"></span>Locked</div><h3 class="card-name">Region C</h3><p class="card-needs">Needs Sample boss</p><p class="card-note">Its entries stay hidden.</p></div></a></li>
          </ul>
        </section>`;

const homePlate = page({
  file: 'home-plate.html',
  title: 'Home',
  bodyAttr: 'home',
  navCurrent: 'Regions',
  heroClass: 'hero hero--short hero--home',
  h1: 'Every collectible.<br>Every ending.',
  intro: 'Mark what you have, see what comes next, and see what each locked region still needs.',
  main: homeMain,
});

// ------------------------------------------------------------------ 6. row-button

const regionRows = [
  row({ id: 'r1', kind: 'collectible', name: 'Example tool', type: 'Tool', area: 'Sample yard', how: HOW.a, step: 21, control: 'off' }),
  row({ id: 'r2', kind: 'task', name: 'Sample errand', type: 'Quest', area: 'Sample market', how: HOW.b, step: 22, needs: 'Needs Example tool', control: 'on' }),
  row({ id: 'r3', kind: 'collectible', name: 'Example crest', type: 'Crest', area: 'Sample tower', how: HOW.c, step: 30, needs: 'Needs Sample errand', control: 'off' }),
  row({ id: 'r4', kind: 'collectible', name: 'Example relic', type: 'Ability', area: 'Sample vault', how: HOW.a, step: 33, done: true }),
].join('\n');

const routeRows = [
  row({ id: 't1', kind: 'collectible', name: 'Sample next entry', type: 'Tool', area: 'Sample yard', how: HOW.a, step: 11, next: true, availableFlag: false, control: 'on' }),
  row({ id: 't2', kind: 'task', name: 'Sample boss', type: 'Boss', area: 'Sample hall', how: HOW.b, step: 12, control: 'off' }),
].join('\n');

const nextPlate = (pressed) => `<section class="next-plate" aria-label="Next on the route, goal ${pressed ? 'set' : 'not set'}">
            <span class="next-label">Next on the route</span>
            <h3 class="next-name">${HOME_NEXT.name}</h3>
            <div class="entry-meta next-meta"><span>${HOME_NEXT.type}</span><span>${HOME_NEXT.region}</span><span class="num">Step ${HOME_NEXT.step}</span><a class="source-link" href="#" target="_blank" rel="noopener">Source</a></div>
            <p class="next-how">${HOW.a}</p>
            <p class="next-actions"><a href="#">See the whole route</a><a href="#">Open ${HOME_NEXT.region}</a>${goalButton(HOME_NEXT.name, pressed)}</p>
          </section>`;

const rowButton = page({
  file: 'row-button.html',
  title: 'Make this my goal',
  bodyAttr: 'region',
  heroClass: 'hero hero--short',
  h1: 'Make this my goal',
  intro: 'The control on an entry row and on the Next on the route plate, not pressed and pressed.',
  thread: false,
  main: `        <section class="sheet-section" aria-labelledby="sheet-region">
          <h2 class="list-heading" id="sheet-region">On a Region page</h2>
          <p class="sheet-note"><strong>Second row is the goal.</strong> The control sits at the foot of the row, after the how line and what it needs. A row that is already done has no control, because nothing is left to follow. The same row is used on the Route, Trackers and Rosaries pages.</p>
          <ol class="entries">
${regionRows}
          </ol>
        </section>
        <section class="sheet-section" aria-labelledby="sheet-route">
          <h2 class="list-heading" id="sheet-route">On the Route page</h2>
          <p class="sheet-note"><strong>First row is the goal.</strong> On the stitched "next" row the control sits inside the plate, under the how line. A row that is not the goal reads "Make this my goal".</p>
          <section class="route-group is-last" aria-labelledby="route-b">
            <div class="route-head">
              <div class="entry-rail"><span class="entry-thread" aria-hidden="true"></span></div>
              <div class="route-head-body"><h3 class="route-name" id="route-b"><a href="#">Region A</a></h3><span class="route-meta"><span class="num">Steps 11 to 12</span></span></div>
            </div>
            <ol class="entries">
${routeRows}
            </ol>
          </section>
        </section>
        <section class="sheet-section" aria-labelledby="sheet-next">
          <h2 class="list-heading" id="sheet-next">On the Next on the route plate</h2>
          <p class="sheet-note">Home, and anywhere else the plate appears. The control joins the plate's links. First not pressed, then pressed.</p>
          <div class="sheet-pair">
            ${nextPlate(false)}
            ${nextPlate(true)}
          </div>
        </section>`,
});

// ------------------------------------------------------------------ write

const files = {
  'goal-page.html': goalPage,
  'goal-none.html': goalNone,
  'goal-done.html': goalDone,
  'goal-retired.html': goalRetired,
  'home-plate.html': homePlate,
  'row-button.html': rowButton,
};
for (const [name, html] of Object.entries(files)) writeFileSync(join(here, name), html);
console.log(`wrote ${Object.keys(files).length} pages; goal has ${rowsText(rowsLeft)}, ${availableNow.length} available now`);
