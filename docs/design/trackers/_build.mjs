// Writes the static mockup pages in this folder. Run: node docs/design/trackers/_build.mjs
// Why a script: the 12 pages share a header, hero, tabs and footer, and the totals (done of total,
// Rosaries still needed) are worked out from the sample rows here, so the numbers on every page agree
// the way the real page will derive them. The output is plain HTML with no script and no build step.
// ALL CONTENT BELOW IS INVENTED to show states. None of it is game data; never copy it into data/.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const n = (v) => v.toLocaleString('en-US');
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const entries = (count) => plural(count, 'entry', 'entries');

// ------------------------------------------------------------------ shared pieces

const NAV = [
  ['index.html', 'Regions'],
  ['route.html', 'Route'],
  ['trackers-crests-partial.html', 'Trackers'],
  ['account.html', 'Account and backup'],
];

// current: 'Trackers' underlines it. sub: true on Rosaries and Builds (Trackers stays marked, as "true").
// short: on a phone the last link reads "Account" (" and backup" is hidden by css but stays in the
// accessible name), so four entries fit one row down to 320px. See the Navigation page for why.
function header(current, sub = false, nav = NAV, short = true) {
  const links = nav
    .map(([href, label]) => {
      const cur = label === current ? (sub ? ' aria-current="true"' : ' aria-current="page"') : '';
      const text = label === 'Account and backup' ? 'Account<span class="nav-extra"> and backup</span>' : label;
      return `<a href="${href}"${cur}>${text}</a>`;
    })
    .join('\n          ');
  return `<header class="site-header">
      <div class="frame">
        <a class="logo" href="index.html">
          <svg class="logo-mark" viewBox="0 0 30 18" aria-hidden="true"><path class="line" d="M3 9 H29"/><ellipse class="eye" cx="4.5" cy="9" rx="2.3" ry="3.6"/></svg>
          Silksong guide
        </a>
        <nav class="site-nav${short ? ' nav-short' : ''}" aria-label="Main">
          ${links}
        </nav>
      </div>
    </header>`;
}

function stateBar(current, states) {
  const links = states
    .map(([file, label]) => `<a href="${file}"${file === current ? ' aria-current="page"' : ''}>${label}</a>`)
    .join(' &middot; ');
  return `<div class="banner mock-states">Mockup with invented content, not guide data. Other states: ${links}</div>`;
}

const FOOTER_NOTE =
  'Layout sample. Names, prices, counts and states are invented to show what a screen can look like; they are not guide data.';

function page({ file, title, bodyAttr, navCurrent, navSub, crumb, h1, intro, main, states, sidebarFirst }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Silksong guide (mockup)</title>
  <link rel="stylesheet" href="../../../css/base.css">
  <link rel="stylesheet" href="../../../css/components.css">
  <link rel="stylesheet" href="trackers.css">
</head>
<body data-page="${bodyAttr}">
  <a class="skip-link" href="#app">Skip to the content</a>
  ${stateBar(file, states)}
  <div class="page">
    ${header(navCurrent, navSub)}
    <main id="app" tabindex="-1">
      <section class="hero hero--short">
        <div class="hero-shade"></div>
        <div class="hero-shade hero-shade--title"></div>
        <div class="frame">
          ${crumb ? `<a class="crumb" href="${crumb.href}">${crumb.label}</a>` : ''}
          <h1 class="hero-title">${h1}</h1>
          <p class="hero-intro">${intro}</p>
        </div>
      </section>
      <div class="frame">
        <div class="content">
          <div class="start-thread start-thread--short" aria-hidden="true"></div>
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

function needleBar({ done, total, label, tone }) {
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const complete = total > 0 && done === total;
  // tone 'counted' = silk bar and bronze value (counts toward Home); 'quiet' = ash (nothing here counts).
  const kind = tone === 'quiet' ? 'tasks' : 'collectibles';
  const text = `${done} of ${total}`;
  return `<div class="count-block tk-summary">
            <div class="count-row count-row--${kind}"><span>${label}</span><span class="count-value num">${text}</span></div>
            <div class="bar bar--${kind}${complete ? ' bar--complete' : ''}" role="progressbar" aria-label="${label}: ${text}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
              <div class="bar-track"></div>
              <div class="bar-fill" style="width:${percent}%"></div>
              ${complete ? '' : `<svg class="bar-needle" width="28" height="18" viewBox="0 0 28 18" aria-hidden="true" style="left:calc(${percent}% - 22px)"><path class="line" d="M3 9 H27"/><ellipse class="eye" cx="4.5" cy="9" rx="2.3" ry="3.6"/></svg>`}
            </div>
          </div>`;
}

function toggle(label, checked = false) {
  return `<label class="switch"><input type="checkbox" class="switch-input"${checked ? ' checked' : ''}><span class="switch-track" aria-hidden="true"></span><span class="switch-text">${label}</span></label>`;
}

// One row on the thread. opts: kind, done, blocked, needs, type, area, uncounted, right (html in the head), flagDone
function row(entry, i) {
  // Once an entry is done, what it needed no longer matters (the same rule as the Route page).
  const e = entry.done ? { ...entry, needs: null } : entry;
  const id = `${e.idp}-${i}`;
  const markKind = e.kind === 'task' ? 'mark--knot' : 'mark--bead';
  const markState = e.done ? ' is-done' : e.needs ? ' is-blocked' : '';
  const thread = `entry-thread${e.done ? ' is-clear' : ''}${e.needs ? ' is-blocked' : ''}`;
  const needsId = `needs-${id}`;
  const meta = [
    `<span>${e.type}</span>`,
    e.area ? `<span>${e.area}</span>` : '',
    e.uncounted ? '<span class="flag-uncounted">Not counted</span>' : '',
    e.flagDone && e.done ? `<span class="flag-done">${e.flagDone}</span>` : '',
  ]
    .filter(Boolean)
    .join('');
  return `            <li class="entry${e.done ? ' is-done' : ''}">
              <div class="entry-rail">
                <span class="${thread}" aria-hidden="true"></span>
                <button type="button" class="entry-mark" aria-pressed="${e.done ? 'true' : 'false'}" aria-label="${e.name}"${e.needs ? ` aria-describedby="${needsId}"` : ''}><span class="mark ${markKind}${markState}"></span></button>
              </div>
              <div class="entry-body">
                <div class="entry-head${e.right ? ' tk-head' : ''}"><span class="entry-name">${e.name}</span>${e.right || ''}</div>
                <div class="entry-meta">${meta}</div>
                ${e.needs ? `<p id="${needsId}" class="entry-needs is-missing">${e.needs}</p>` : ''}
              </div>
            </li>`;
}

function hiddenRow(text) {
  return `            <li class="entry entry--hidden">
              <div class="entry-rail">
                <span class="entry-thread" aria-hidden="true"></span>
                <span class="mark mark--bead mark--static mark--region" aria-hidden="true"></span>
              </div>
              <div class="entry-body"><p class="entry-note">${text}</p></div>
            </li>`;
}

// ------------------------------------------------------------------ Trackers page

// Sample tabs. Names follow Athos's examples; the real set comes from research, not from here.
// rows: shown on the page when that tab is selected. hidden: entries in regions not yet Visited (count only).
const TABS = [
  {
    id: 'crests',
    label: 'Crests',
    rows: [
      { name: 'Sample crest one', kind: 'collectible', type: 'Crest', area: 'Sample region A', done: true },
      { name: 'Sample crest two', kind: 'collectible', type: 'Crest', area: 'Sample region A', done: true },
      { name: 'Sample crest three', kind: 'collectible', type: 'Crest', area: 'Sample region B' },
      { name: 'Sample crest four', kind: 'collectible', type: 'Crest', area: 'Sample region B', needs: 'Needs Sample key item' },
      { name: 'Sample crest five', kind: 'collectible', type: 'Crest', area: 'Sample region B', uncounted: true },
    ],
    hidden: 2,
    note: 'Entries marked Not counted do not add to the 100 percent count on Home.',
    tone: 'counted',
  },
  { id: 'tools', label: 'Tools and Skills', counts: { done: 4, total: 9 } },
  { id: 'abilities', label: 'Abilities', counts: { done: 3, total: 5 } },
  { id: 'equipment', label: 'Equipment', empty: true },
  {
    id: 'mementos',
    label: 'Mementos',
    rows: [
      { name: 'Sample memento one', kind: 'collectible', type: 'Memento', area: 'Sample region A', uncounted: true },
      { name: 'Sample memento two', kind: 'collectible', type: 'Memento', area: 'Sample region A', uncounted: true },
      { name: 'Sample memento three', kind: 'collectible', type: 'Memento', area: 'Sample region B', uncounted: true, needs: 'Needs Sample key item' },
      { name: 'Sample memento four', kind: 'collectible', type: 'Memento', area: 'Sample region B', uncounted: true },
    ],
    hidden: 0,
    note: 'None of these count toward 100 percent.',
    tone: 'quiet',
  },
  {
    id: 'keys',
    label: 'Keys and key items',
    rows: [
      { name: 'Sample key item', kind: 'collectible', type: 'Key item', area: 'Sample region A', done: true, uncounted: true },
      { name: 'Sample key delivery', kind: 'task', type: 'Delivery', area: 'Sample region A', done: true },
      { name: 'Sample second key item', kind: 'collectible', type: 'Key item', area: 'Sample region B', done: true, uncounted: true },
    ],
    hidden: 0,
    note: 'Entries marked Not counted do not add to the 100 percent count on Home.',
    tone: 'counted',
  },
];

// Progress states for the three tabs that carry rows. The strip uses the same numbers on every page.
function tabCount(tab, overrides) {
  if (tab.empty) return null;
  if (tab.counts) return tab.counts;
  const rows = tab.rows.map((r, i) => ({ ...r, ...(overrides[tab.id]?.[i] || {}) }));
  return { done: rows.filter((r) => r.done).length, total: rows.length + (tab.hidden || 0) };
}

function tabStrip(selectedId, overrides) {
  const buttons = TABS.map((tab) => {
    const c = tabCount(tab, overrides);
    const complete = c && c.total > 0 && c.done === c.total;
    const selected = tab.id === selectedId;
    const count = !c
      ? 'Not in the guide yet'
      : `${complete ? '<span class="state-dot state-dot--complete" aria-hidden="true"></span>' : ''}<span class="num">${c.done} of ${c.total}</span>${complete ? '<span class="visually-hidden"> complete</span>' : ''}`;
    return `        <button type="button" role="tab" class="tk-tab${complete ? ' is-complete' : ''}" id="tab-${tab.id}" aria-selected="${selected}" aria-controls="panel-${tab.id}" tabindex="${selected ? 0 : -1}"><span>${tab.label}</span><span class="tk-tab-count">${count}</span></button>`;
  }).join('\n');
  return `        <div class="tk-tabs" role="tablist" aria-label="Trackers">
${buttons}
        </div>`;
}

function trackersPage({ file, selected, overrides = {}, states }) {
  const tab = TABS.find((t) => t.id === selected);
  let panel;
  if (tab.empty) {
    panel = `          <section class="tk-panel" role="tabpanel" id="panel-${tab.id}" aria-labelledby="tab-${tab.id}" tabindex="-1">
            <div class="plate">
              <h2 class="plate-heading">Not in the guide yet</h2>
              <p class="plate-text">Its entries ship in a later batch. Nothing here changes your totals until they do.</p>
            </div>
          </section>`;
  } else {
    const rows = tab.rows.map((r, i) => ({ ...r, ...(overrides[tab.id]?.[i] || {}), idp: tab.id }));
    const c = tabCount(tab, overrides);
    const complete = c.done === c.total;
    const stateLine = complete
      ? '<span class="tk-state"><span class="state-dot state-dot--complete" aria-hidden="true"></span>Complete</span>'
      : c.done === 0
        ? '<span class="tk-state">Nothing marked yet</span>'
        : '';
    const hiddenText = tab.hidden ? hiddenRow(`${entries(tab.hidden)} hidden until you visit ${tab.hidden === 1 ? 'its region' : 'their regions'}.`) : '';
    panel = `          <section class="tk-panel" role="tabpanel" id="panel-${tab.id}" aria-labelledby="tab-${tab.id}" tabindex="-1">
            <div class="tk-panel-head"><h2 class="tk-panel-title">${tab.label}</h2>${stateLine}</div>
            ${needleBar({ done: c.done, total: c.total, label: 'Done', tone: tab.tone })}
            <p class="tk-note">${tab.note}</p>
            ${tab.id === 'crests' ? '<p class="tk-hint"><a href="builds-full.html">Pick a build from the Crests you own</a></p>' : ''}
            <ol class="entries tk-list">
${rows.map(row).join('\n')}
${hiddenText}
            </ol>
          </section>`;
  }

  const main = `        ${tabStrip(selected, overrides)}
        <div class="layout">
          <div class="main-column">
${panel}
          </div>
          <aside class="plate plate--rail" aria-label="Plan and options">
            <div class="rail-section">
              <h2 class="plate-heading">Plan with what you have</h2>
              <ul class="holding-list" style="margin-top:4px">
                <li class="holding-item"><div><a class="holding-name" href="rosaries-partial.html">Rosaries</a><p class="holding-text">Add up what the shop entries you have not bought still cost.</p></div></li>
                <li class="holding-item"><div><a class="holding-name" href="builds-full.html">Build picker</a><p class="holding-text">See the Crests you own, their slots and the Tools you own for each.</p></div></li>
              </ul>
            </div>
            <div class="toggles">${toggle('Show everything, spoilers included')}</div>
            <p class="plate-help">A bead is something you can obtain. A knot is a task: it adds nothing by itself but opens something else. Not counted means an entry is tracked here but does not add to the 100 percent count on Home.</p>
          </aside>
        </div>`;

  return page({
    file,
    title: 'Trackers',
    bodyAttr: 'trackers',
    navCurrent: 'Trackers',
    h1: 'Trackers',
    intro: 'Mark what you have, one type at a time. Each tab keeps its own count; the 100 percent count stays on Home.',
    main,
    states,
  });
}

const TRACKER_STATES = [
  ['trackers-crests-partial.html', 'Partly done'],
  ['trackers-mementos-empty.html', 'Nothing marked'],
  ['trackers-keys-complete.html', 'Complete'],
  ['trackers-equipment-not-in-guide.html', 'Not in the guide yet'],
  ['rosaries-partial.html', 'Rosaries'],
  ['builds-full.html', 'Builds'],
  ['navigation.html', 'Navigation'],
];

// ------------------------------------------------------------------ Rosaries

// Invented shop entries. step orders them on the Route; price is Rosaries.
const SHOP = [
  { region: 'Sample region A', href: 'region.html', visited: true, items: [
    { name: 'Sample shop entry one', step: 10, price: 80, type: 'Tool', kind: 'collectible' },
    { name: 'Sample shop entry two', step: 12, price: 120, type: 'Crafting upgrade', kind: 'collectible' },
    { name: 'Sample shop entry three', step: 15, price: 150, type: 'Tool', kind: 'collectible' },
    { name: 'Sample shop entry four', step: 18, price: 220, type: 'Keepsake', kind: 'collectible', uncounted: true },
  ] },
  { region: 'Sample region B', href: 'region.html', visited: true, items: [
    { name: 'Sample shop entry five', step: 31, price: 180, type: 'Tool', kind: 'collectible' },
    { name: 'Sample shop entry six', step: 33, price: 300, type: 'Tool', kind: 'collectible', needs: 'Needs Sample key item' },
    { name: 'Sample shop entry seven', step: 35, price: 90, type: 'Keepsake', kind: 'collectible', uncounted: true },
  ] },
  { region: 'Sample region C', href: 'region.html', visited: false, items: [
    { name: 'Sample shop entry eight', step: 50, price: 250, type: 'Tool', kind: 'collectible' },
    { name: 'Sample shop entry nine', step: 52, price: 400, type: 'Tool', kind: 'collectible' },
    { name: 'Sample shop entry ten', step: 55, price: 140, type: 'Keepsake', kind: 'collectible', uncounted: true },
  ] },
];

function rosariesPage({ file, bought, allVisited = false, states }) {
  const groups = SHOP.map((g) => ({ ...g, visited: g.visited || allVisited }));
  const all = groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g, bought: bought.has(it.name) })));
  const needed = all.filter((e) => !e.bought).reduce((sum, e) => sum + e.price, 0);
  const done = all.filter((e) => e.bought).length;
  const hiddenUnbought = all.filter((e) => !e.group.visited && !e.bought).length;
  // Next to buy: lowest step that is unbought, shown (its Region is Visited) and not waiting on something.
  const next = all
    .filter((e) => !e.bought && e.group.visited && !e.needs)
    .sort((a, b) => a.step - b.step)[0];

  const rail = `          <aside class="plate plate--rail" aria-label="Rosaries still needed">
            <div class="rail-section">
              <h2 class="plate-heading">Still needed</h2>
              <div>
                <p class="tk-need${needed === 0 ? ' tk-need-zero' : ''}" aria-live="polite"><span class="num">${n(needed)}</span></p>
                <p class="tk-need-label">Rosaries for everything you have not bought${hiddenUnbought ? `, including ${entries(hiddenUnbought)} in regions you have not visited` : ''}.</p>
              </div>
              ${needleBar({ done, total: all.length, label: 'Bought', tone: 'counted' }).replace('tk-summary', 'tk-summary-rail')}
              <p class="plate-help">The total follows what you tick and is worked out from the prices. You never type it. It counts entries you cannot buy yet too.</p>
            </div>
            <div class="toggles">${toggle('Show everything, spoilers included')}</div>
          </aside>`;

  let nextPlate;
  if (needed === 0) {
    nextPlate = `            <div class="tk-done-plate">
              <p class="next-label">Next to buy</p>
              <h2 class="next-name">Nothing left to buy</h2>
              <p class="next-how">Every shop entry in the guide is marked as bought.</p>
            </div>`;
  } else {
    nextPlate = `            <div class="next-plate tk-next">
              <p class="next-label">Next to buy</p>
              <h2 class="next-name">${next.name}</h2>
              <div class="entry-meta next-meta"><span>${next.type}</span><span>${next.group.region}</span>${next.uncounted ? '<span class="flag-uncounted">Not counted</span>' : ''}</div>
              <p class="tk-price-line">${n(next.price)} Rosaries. Buying it leaves ${n(needed - next.price)} still needed.</p>
              <p class="next-how">The first shop entry on the route that you can buy now and have not bought.</p>
              <div class="next-actions"><button type="button" class="button button--secondary">Mark as bought</button><a href="${next.group.href}">Open ${next.group.region}</a></div>
            </div>`;
  }

  const list = groups
    .map((g, gi) => {
      const items = all.filter((e) => e.group === g);
      const doneHere = items.filter((e) => e.bought).length;
      const last = gi === groups.length - 1;
      const rowsHtml = g.visited
        ? items
            .map((e, i) =>
              row(
                {
                  ...e,
                  idp: `shop-${gi}`,
                  done: e.bought,
                  flagDone: 'Bought',
                  right: `<span class="tk-price num">${n(e.price)} Rosaries</span>`,
                },
                i
              )
            )
            .join('\n')
        : hiddenRow(`${entries(items.length)} hidden until you visit this region. Their prices are in the total.`);
      return `            <section class="route-group tk-group${last ? ' is-last' : ''}" aria-labelledby="shop-${gi}">
              <div class="route-head">
                <div class="entry-rail"><span class="entry-thread" aria-hidden="true"></span></div>
                <div class="route-head-body">
                  <h3 class="tk-group-title" id="shop-${gi}">${g.region}</h3>
                  <span class="route-meta"><span class="num">${g.visited ? `${doneHere} of ${items.length} bought` : 'Not visited'}</span><a href="${g.href}">Open region</a></span>
                </div>
              </div>
              <ol class="entries">
${rowsHtml}
              </ol>
            </section>`;
    })
    .join('\n');

  const main = `        <div class="layout layout--route">
${rail}
          <div class="main-column">
${nextPlate}
            <h2 class="list-heading list-heading--spaced">Shops by region</h2>
${list}
            <p class="route-legend plate-help">Tick an entry when you buy it. A bead is a Collectible and a knot is a Task. Entries marked Not counted are tracked here but do not add to the 100 percent count on Home.</p>
          </div>
        </div>`;

  return page({
    file,
    title: 'Rosaries',
    bodyAttr: 'rosaries',
    navCurrent: 'Trackers',
    navSub: true,
    crumb: { href: 'trackers-crests-partial.html', label: 'All trackers' },
    h1: 'Rosaries',
    intro: 'Tick the shop entries you have bought. The page adds up what the rest still costs.',
    main,
    states,
  });
}

function rosariesNotInGuide({ file, states }) {
  const main = `        <div class="layout layout--side-only">
          <aside class="plate">
            <h2 class="plate-heading">Not in the guide yet</h2>
            <p class="plate-text">Shop entries and their prices ship in a later batch. Until then there is nothing to add up.</p>
            <p><a href="trackers-crests-partial.html">Back to all trackers</a></p>
          </aside>
        </div>`;
  return page({
    file,
    title: 'Rosaries',
    bodyAttr: 'rosaries',
    navCurrent: 'Trackers',
    navSub: true,
    crumb: { href: 'trackers-crests-partial.html', label: 'All trackers' },
    h1: 'Rosaries',
    intro: 'Tick the shop entries you have bought. The page adds up what the rest still costs.',
    main,
    states,
  });
}

const ROSARY_STATES = [
  ['rosaries-empty.html', 'Nothing bought'],
  ['rosaries-partial.html', 'Partly bought'],
  ['rosaries-complete.html', 'All bought'],
  ['rosaries-not-in-guide.html', 'Not in the guide yet'],
  ['trackers-crests-partial.html', 'Trackers'],
];

// ------------------------------------------------------------------ Build picker

const CRESTS = [
  { id: 'c1', name: 'Sample crest one', slots: 3 },
  { id: 'c2', name: 'Sample crest two', slots: 4 },
  { id: 'c3', name: 'Sample crest three', slots: 3 },
  { id: 'c4', name: 'Sample crest four', slots: 5 },
  { id: 'c5', name: 'Sample crest five', slots: 3 },
];

const WHY = 'Sample reason in one short sentence, in our own words.';

// A slot: kind label, owned suggestions, and a count of Tools that fit but are not owned (a count only, so
// no unowned name is revealed).
const FULL_SLOTS = [
  { name: 'Slot 1', kind: 'Slot type A', owned: [
    { name: 'Sample tool one', type: 'Tool', source: true },
    { name: 'Sample tool two', type: 'Tool', source: true },
    { name: 'Sample tool three', type: 'Silk skill', editorial: true },
  ], more: 0 },
  { name: 'Slot 2', kind: 'Slot type B', owned: [
    { name: 'Sample tool four', type: 'Tool', source: true },
    { name: 'Sample tool five', type: 'Tool', editorial: true },
  ], more: 1 },
  { name: 'Slot 3', kind: 'Slot type A', owned: [{ name: 'Sample tool one', type: 'Tool', source: true }], more: 2 },
  { name: 'Slot 4', kind: 'Slot type C', owned: [], more: 1 },
];

const ONE_SLOTS = [
  { name: 'Slot 1', kind: 'Slot type A', owned: [{ name: 'Sample tool one', type: 'Tool', source: true }], more: 3 },
  { name: 'Slot 2', kind: 'Slot type B', owned: [], more: 2 },
  { name: 'Slot 3', kind: 'Slot type C', unknown: true, owned: [], more: 0 },
];

function slotGroup(s, si, last) {
  const idp = `slot-${si}`;
  let body;
  if (s.unknown) {
    body = hiddenRow('Slot details for this Crest are not in the guide yet.');
  } else {
    const rows = s.owned.map(
      (t, i) => `            <li class="entry is-done">
              <div class="entry-rail">
                <span class="entry-thread is-clear" aria-hidden="true"></span>
                <span class="mark mark--bead mark--static is-done" aria-hidden="true"></span>
              </div>
              <div class="entry-body">
                <span class="entry-name">${t.name}</span>
                <div class="entry-meta"><span>${t.type}</span>${t.source ? '<a class="source-link" href="#" aria-label="Source for ' + t.name + '">Source</a>' : '<span class="flag-editorial">Guide suggestion</span>'}</div>
                <p class="entry-how">${WHY}</p>
              </div>
            </li>`
    );
    if (!s.owned.length) {
      rows.push(hiddenRow('You own no Tool for this slot yet.'));
    }
    if (s.more) {
      rows.push(hiddenRow(`${plural(s.more, 'more Tool fits', 'more Tools fit')} this slot. You do not own ${s.more === 1 ? 'it' : 'them'} yet.`));
    }
    body = rows.join('\n');
  }
  return `            <section class="route-group tk-slot${last ? ' is-last' : ''}" aria-labelledby="${idp}">
              <div class="route-head">
                <div class="entry-rail"><span class="entry-thread" aria-hidden="true"></span></div>
                <div class="route-head-body">
                  <h3 class="tk-slot-name" id="${idp}">${s.name}</h3>
                  <span class="tk-slot-meta">${s.kind}${s.unknown ? '' : `. ${plural(s.owned.length, 'Tool', 'Tools')} you own`}</span>
                </div>
              </div>
              <ol class="entries">
${body}
              </ol>
            </section>`;
}

function buildsPage({ file, owned, selectedId, slots, toolsOwned, notOwnedCrests, states }) {
  const rail = `          <aside class="plate plate--rail" aria-label="Your Crests">
            <div class="rail-section">
              <h2 class="plate-heading">Your Crests</h2>
              ${
                owned.length
                  ? `<fieldset style="border:0;margin:0;padding:0;min-width:0"><legend class="visually-hidden">Choose a Crest</legend>
              <ul class="tk-crests">
${owned
  .map(
    (c) => `                <li class="tk-crest"><input type="radio" name="crest" id="crest-${c.id}" value="${c.id}"${c.id === selectedId ? ' checked' : ''}><label for="crest-${c.id}"><span class="tk-crest-dot" aria-hidden="true"></span><span><span class="tk-crest-name">${c.name}</span><span class="tk-crest-sub num">${plural(c.slots, 'slot', 'slots')}</span></span></label></li>`
  )
  .join('\n')}
              </ul></fieldset>`
                  : '<p class="plate-text">None yet.</p>'
              }
              ${notOwnedCrests ? `<p class="tk-rail-text">${plural(notOwnedCrests, 'more Crest is', 'more Crests are')} not marked as owned yet.</p>` : ''}
            </div>
            <div class="rail-section">
              <p class="tk-rail-text">Tools you own: <strong>${toolsOwned}</strong>. Suggestions only use what you have marked as done.</p>
              <p class="tk-rail-text">Guide suggestion means our own pick and not a wiki fact. Entries with a Source link follow that page.</p>
              <p class="tk-rail-text"><a href="trackers-crests-partial.html">Open the Crests tracker</a></p>
            </div>
          </aside>`;

  let mainCol;
  if (!owned.length) {
    mainCol = `          <div class="main-column">
            <div class="plate message">
              <h2 class="plate-heading">You do not own a Crest yet</h2>
              <p class="plate-text">Mark a Crest as done in the Crests tracker. It then appears here with its slots and the Tools you own that could go in each.</p>
              <div class="button-row"><a class="button button--primary" href="trackers-crests-partial.html" style="text-decoration:none">Open the Crests tracker</a></div>
            </div>
          </div>`;
  } else {
    const crest = owned.find((c) => c.id === selectedId);
    mainCol = `          <div class="main-column">
            <section aria-labelledby="crest-title">
              <h2 class="tk-crest-title" id="crest-title">${crest.name}</h2>
              <p class="tk-crest-meta num">${plural(crest.slots, 'slot', 'slots')}. Suggestions are Tools you own.</p>
              <div class="tk-slots">
${slots.map((s, i) => slotGroup(s, i, i === slots.length - 1)).join('\n')}
              </div>
            </section>
          </div>`;
  }

  // With no Crest owned there is nothing to pick, so the page is one plate (no rail repeating "none").
  const main = owned.length
    ? `        <div class="layout layout--route">
${rail}
${mainCol}
        </div>`
    : `        <div class="message">
          <div class="plate">
            <h2 class="plate-heading">You do not own a Crest yet</h2>
            <p class="plate-text">Mark a Crest as done in the Crests tracker. It then appears here with its slots and the Tools you own that could go in each.</p>
            <div class="button-row"><a class="button button--primary" href="trackers-crests-partial.html" style="text-decoration:none">Open the Crests tracker</a></div>
          </div>
        </div>`;

  return page({
    file,
    title: 'Build picker',
    bodyAttr: 'builds',
    navCurrent: 'Trackers',
    navSub: true,
    crumb: { href: 'trackers-crests-partial.html', label: 'All trackers' },
    h1: 'Build picker',
    intro: 'Pick a Crest you own to see its slots and the Tools you own that could go in each.',
    main,
    states,
  });
}

const BUILD_STATES = [
  ['builds-no-crest.html', 'No Crest owned'],
  ['builds-one-crest.html', 'One Crest'],
  ['builds-full.html', 'Full set'],
  ['trackers-crests-partial.html', 'Trackers'],
];

// ------------------------------------------------------------------ Navigation

function navigationPage() {
  const before = NAV.filter(([, l]) => l !== 'Trackers');
  const strip = (current, sub, nav, short = true, cls = '') => `<div class="nav-demo-strip ${cls}">${header(current, sub, nav, short)}</div>`;
  const steps = [
    ['Any page, header', 'Trackers', 'The new entry sits between Route and Account and backup. Regions, Route and Account and backup keep their names, order and addresses.'],
    ['Trackers', 'Tabs for each type', 'Each tab shows its own count. A plate beside the tabs (below them on a phone) links to Rosaries and to the Build picker.'],
    ['Rosaries and Build picker', 'Crumb "All trackers"', 'Both sit under Trackers, so the header keeps Trackers marked. The crumb above the title leads back, the way "All regions" does on a Region.'],
    ['Crests tab', 'Link to the Build picker', 'The tab where a Crest is marked also links straight to the picker, so a player does not have to find it in the plate.'],
  ];
  const stepRows = steps
    .map(
      ([where, what, text], i) => `          <li class="entry">
            <div class="entry-rail">
              <span class="entry-thread is-clear" aria-hidden="true"></span>
              <span class="mark mark--bead mark--static is-done" aria-hidden="true"></span>
            </div>
            <div class="entry-body">
              <div class="entry-head"><span class="entry-name">${what}</span><span class="entry-step">${where}</span></div>
              <p class="entry-how">${text}</p>
            </div>
          </li>`
    )
    .join('\n');

  const main = `        <div class="main-column" style="max-width:760px">
          <h2 class="section-heading">The header</h2>
          <p class="section-intro">Before is what is in the pages today. After adds one link. Nothing else in the header moves.</p>
          <div class="nav-demo">
            <p class="nav-demo-label"><strong>Before.</strong> Three entries.</p>
            ${strip('Regions', false, before, false)}
          </div>
          <div class="nav-demo">
            <p class="nav-demo-label"><strong>After, on Home (option A, proposed).</strong> Four entries. Trackers is not marked because Regions is the current page. On a phone the last link reads "Account" so all four fit one row, as the three do today; its accessible name is still "Account and backup".</p>
            ${strip('Regions', false, NAV)}
          </div>
          <div class="nav-demo">
            <p class="nav-demo-label"><strong>After, on a tracker page.</strong> Trackers carries the same silk underline the current page has everywhere else (aria-current="page" on Trackers, aria-current="true" on Rosaries and Build picker).</p>
            ${strip('Trackers', false, NAV)}
          </div>
          <div class="nav-demo">
            <p class="nav-demo-label"><strong>Option B, only to compare.</strong> Keep the full label. On a phone the header then needs a second nav row, so every page's hero must reserve about 42px more at the top and every title moves down by that much. Shown here with the row it needs.</p>
            ${strip('Trackers', false, NAV, false, 'is-tall')}
          </div>
          <h2 class="section-heading" style="margin-top:64px">How a player reaches each screen</h2>
          <ol class="entries" style="margin-top:28px">
${stepRows}
          </ol>
          <p class="plate-help" style="margin-top:36px">Checked with option A at 390, 360 and 320px wide: the header stays on one row, inside the 124px the hero already reserves on a phone, and nothing scrolls sideways. Option A is the only change to an existing stylesheet (components.css). Option B changes the hero padding on every page instead.</p>
        </div>`;

  return page({
    file: 'navigation.html',
    title: 'Navigation',
    bodyAttr: 'navigation',
    navCurrent: 'Trackers',
    h1: 'Navigation',
    intro: 'One new entry in the header, called Trackers. Rosaries and the Build picker are reached from it.',
    main,
    states: TRACKER_STATES,
  });
}

// ------------------------------------------------------------------ write everything

const files = {};

files['trackers-crests-partial.html'] = trackersPage({ file: 'trackers-crests-partial.html', selected: 'crests', states: TRACKER_STATES });
files['trackers-mementos-empty.html'] = trackersPage({ file: 'trackers-mementos-empty.html', selected: 'mementos', states: TRACKER_STATES });
files['trackers-keys-complete.html'] = trackersPage({ file: 'trackers-keys-complete.html', selected: 'keys', states: TRACKER_STATES });
files['trackers-equipment-not-in-guide.html'] = trackersPage({ file: 'trackers-equipment-not-in-guide.html', selected: 'equipment', states: TRACKER_STATES });

const boughtPartial = new Set(['Sample shop entry one', 'Sample shop entry two', 'Sample shop entry five']);
const boughtAll = new Set(SHOP.flatMap((g) => g.items.map((i) => i.name)));
files['rosaries-partial.html'] = rosariesPage({ file: 'rosaries-partial.html', bought: boughtPartial, states: ROSARY_STATES });
files['rosaries-empty.html'] = rosariesPage({ file: 'rosaries-empty.html', bought: new Set(), states: ROSARY_STATES });
files['rosaries-complete.html'] = rosariesPage({ file: 'rosaries-complete.html', bought: boughtAll, allVisited: true, states: ROSARY_STATES });
files['rosaries-not-in-guide.html'] = rosariesNotInGuide({ file: 'rosaries-not-in-guide.html', states: ROSARY_STATES });

files['builds-no-crest.html'] = buildsPage({ file: 'builds-no-crest.html', owned: [], selectedId: null, slots: [], toolsOwned: 0, notOwnedCrests: 5, states: BUILD_STATES });
files['builds-one-crest.html'] = buildsPage({ file: 'builds-one-crest.html', owned: [CRESTS[0]], selectedId: 'c1', slots: ONE_SLOTS, toolsOwned: 1, notOwnedCrests: 4, states: BUILD_STATES });
files['builds-full.html'] = buildsPage({ file: 'builds-full.html', owned: CRESTS, selectedId: 'c2', slots: FULL_SLOTS, toolsOwned: 9, notOwnedCrests: 0, states: BUILD_STATES });

files['navigation.html'] = navigationPage();

for (const [name, html] of Object.entries(files)) writeFileSync(join(here, name), html);
console.log(`Wrote ${Object.keys(files).length} pages to ${here}`);
