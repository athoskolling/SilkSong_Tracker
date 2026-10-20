// Writes the P5-31 mockups in this folder: addendum-places-*.html (the Region page's "Places in this region" and
// "Sold by" on the Rosaries page), addendum-templates-*.html (Templates and Synergies on the Build picker).
// Run: node docs/design/trackers/_build-places.mjs
// It reuses the header, page frame, Build picker and Rosaries builders of _build-addendum.mjs (exported for this),
// so the new pages look like their neighbours. It writes only new files.
// ALL CONTENT BELOW IS INVENTED to show states. None of it is game data; never copy it into data/.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  header, stateBar, needleBar, hiddenRow, page, buildsPage, rosariesPage, plural, n, Cap, COLOURS,
  CRESTS, TOOLS, owned, slotsNow, SAVED_BUILD, EDITED_BUILD, SHOP, EFFECT,
} from './_build-addendum.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FOOTER_NOTE =
  'Layout sample. Names, prices, counts and states are invented to show what a screen can look like; they are not guide data.';

// "A, B and C", or "A, B, C and 2 more" past `max` names (the same rule as listWithMore in js/render.js).
const joinNames = (names) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
const listWithMore = (names, max) => (names.length <= max ? joinNames(names) : `${names.slice(0, max).join(', ')} and ${names.length - max} more`);

// ------------------------------------------------------------------ shared: the Region page frame

const REGION_STATES = [
  ['addendum-places-visited.html', 'Visited'],
  ['addendum-places-anchor.html', 'Landing on a Place'],
  ['addendum-places-hidden.html', 'Not Visited'],
  ['addendum-places-locked.html', 'Locked, show everything'],
  ['addendum-places-only.html', 'No entries, Visited'],
  ['addendum-places-only-hidden.html', 'No entries, not Visited'],
  ['addendum-places-sold-by.html', 'Rosaries: Sold by'],
  ['addendum-places-sold-by-hidden.html', 'Rosaries: unvisited'],
  ['addendum-templates-list.html', 'Builds: Templates'],
];
const BUILD_STATES = [
  ['addendum-templates-list.html', 'Templates and Synergies (option A)'],
  ['addendum-templates-empty.html', 'Nothing saved'],
  ['addendum-templates-ask.html', 'Unsaved changes: asks first'],
  ['addendum-templates-used.html', 'After Use as my Build'],
  ['addendum-templates-option-b.html', 'Option B: Show everything'],
  ['addendum-places-visited.html', 'Region: Places'],
  ['addendum-places-sold-by.html', 'Rosaries: Sold by'],
];

function sw(label, checked) {
  return `<label class="switch"><input type="checkbox" class="switch-input"${checked ? ' checked' : ''}><span class="switch-track" aria-hidden="true"></span><span class="switch-text">${label}</span></label>`;
}

function note(text) {
  return `<p class="mock-note"><strong>Mockup note, not part of the page.</strong> ${text}</p>`;
}

// The Region page as render.js builds it (hero, start thread, layout), with the header of the addendum pages.
function regionShell({ file, name, intro, locked = false, main, side, sideOnly = false, states = REGION_STATES }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name} | Silksong guide (mockup)</title>
  <link rel="stylesheet" href="../../../css/base.css">
  <link rel="stylesheet" href="../../../css/components.css">
  <link rel="stylesheet" href="trackers.css">
  <link rel="stylesheet" href="trackers-addendum.css">
  <link rel="stylesheet" href="trackers-places.css">
</head>
<body data-page="region">
  <a class="skip-link" href="#app">Skip to the content</a>
  ${stateBar(file, states)}
  <div class="page tablet-fix">
    ${header('Regions')}
    <main id="app" tabindex="-1">
      <section class="hero${locked ? ' hero--locked' : ''}">
        <div class="hero-shade"></div>
        <div class="hero-shade hero-shade--title"></div>
        <div class="frame">
          <a class="crumb" href="index.html">All regions</a>
          <h1 class="hero-title">${name}</h1>
          <p class="hero-intro">${intro}</p>
        </div>
      </section>
      <div class="frame">
        <div class="content">
          <div class="start-thread${locked ? ' is-dashed' : ''}" aria-hidden="true"></div>
          <div class="layout${sideOnly ? ' layout--side-only' : ''}">
${main ? `          <div class="main-column">\n${main}\n          </div>` : ''}
${side}
          </div>
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

function countBlock(kind, label, done, total) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const text = `${done} of ${total}`;
  const cls = kind === 'tasks' ? 'bar bar--tasks' : 'bar bar--collectibles';
  return `<div class="count-block">
              <div class="count-row count-row--${kind}"><span>${label}</span><span class="count-value num">${text}</span></div>
              <div class="${cls}" role="progressbar" aria-label="${label}: ${text}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
                <div class="bar-track"></div>
                <div class="bar-fill" style="width:${percent}%"></div>
                <svg class="bar-needle" width="28" height="18" viewBox="0 0 28 18" aria-hidden="true" style="left:calc(${percent}% - 22px)"><path class="line" d="M3 9 H27"/><ellipse class="eye" cx="4.5" cy="9" rx="2.3" ry="3.6"/></svg>
              </div>
            </div>`;
}

const HELP =
  'A bead is a collectible. Most count toward your totals; a few are only tracked and do not. A knot is a task: it adds nothing by itself but opens something else. A dashed thread means something is still missing.';

function countsPlate({ visitedToggle }) {
  return `          <aside class="plate plate--counts" aria-label="Your thread here">
            <h2 class="plate-heading">Your thread here</h2>
            ${countBlock('collectibles', 'Collectibles', 1, 2)}
            ${countBlock('tasks', 'Tasks', 0, 1)}
            <div class="toggles">
              ${visitedToggle === null ? '' : sw('I have visited this region', visitedToggle)}
              ${sw('Show everything, spoilers included', visitedToggle === null)}
            </div>
            <p class="plate-help">${HELP}</p>
          </aside>`;
}

// ---- entries on the thread (as entryRow in js/render.js builds them; invented)

function mapOrSource(label, name, kind) {
  const text = kind === 'map' ? 'Map' : 'Source';
  return `<a class="source-link" href="#" aria-label="${text} for ${name}"${kind === 'map' ? '' : ''}>${text}</a>`;
}

function entry({ name, type, area, step, how, done = false, next = false, task = false, blocked = false, needs = null, onRoute = true, link = 'source', last = false }) {
  const markState = done ? ' is-done' : blocked ? ' is-blocked' : '';
  const nextCls = next && !done ? ' is-next' : '';
  const thread = `entry-thread${done ? ' is-clear' : ''}${blocked ? ' is-blocked' : ''}`;
  const id = `e-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return `            <li class="entry${done ? ' is-done' : ''}${next && !done ? ' entry--next' : ''}">
              <div class="entry-rail">
                <span class="${thread}" aria-hidden="true"></span>
                <button type="button" class="entry-mark" aria-pressed="${done}" aria-label="${name}"${needs ? ` aria-describedby="${id}-needs"` : ''}><span class="mark ${task ? 'mark--knot' : 'mark--bead'}${markState}${nextCls}"></span></button>
              </div>
              <div class="entry-body">
                <div class="entry-head"><span class="entry-name">${name}</span>${onRoute ? `<span class="entry-step num">Step ${step}</span>` : '<span class="entry-step">Not on the route</span>'}</div>
                <div class="entry-meta"><span>${type}</span>${area ? `<span>${area}</span>` : ''}${next && !done ? '<span class="flag-next">Next on the route</span>' : ''}${mapOrSource('', name, link)}</div>
                <p class="entry-how">${how}</p>
                ${needs ? `<p id="${id}-needs" class="entry-needs${needs.missing ? ' is-missing' : ''}">${needs.text}</p>` : ''}
              </div>
            </li>`;
}

const ENTRIES_OPEN = [
  entry({ name: 'Sample ability', type: 'Ability', step: 20, how: 'Sample sentence about how to get it, in our own words.', done: true }),
  entry({ name: 'Sample boss fight', type: 'Boss', step: 21, how: 'Sample sentence about where to find it.', task: true, next: true, needs: { text: 'Needs Sample ability, done', missing: false } }),
  // A MapGenie citation on an entry reads "Map", not "Source" (decision for Athos, see the handoff).
  entry({ name: 'Sample mask shard', type: 'Mask shard', area: 'Sample sub-area one', step: 22, how: 'Sample sentence about where it is.', link: 'map' }),
  entry({ name: 'Sample extra', type: 'Memento', step: 23, how: 'Sample sentence. It is tracked here and nothing on the route needs it.', onRoute: false }),
].join('\n');
const ENTRIES_LOCKED = [
  entry({ name: 'Sample region key', type: 'Key', step: 30, how: 'Sample sentence about how to get it.', blocked: true, needs: { text: 'Needs Sample boss fight', missing: true } }),
  entry({ name: 'Sample locked ability', type: 'Ability', step: 31, how: 'Sample sentence about where it is.', blocked: true, needs: { text: 'Needs Sample region key', missing: true } }),
].join('\n');

// ------------------------------------------------------------------ Places (invented)

const KINDS = [
  ['bench', 'Benches'], ['bellway', 'Bellway stations'], ['shop', 'Shops'], ['npc', 'NPCs'],
  ['wishboard', 'Wish boards'], ['arena', 'Arenas'], ['door', 'Doors'], ['other', 'Other places'],
];

const HOW = 'Sample sentence about where it is and what is there, in our own words.';
const PLACES = [
  { id: 'bench-one', kind: 'bench', name: 'Sample bench one', area: 'Sample sub-area one', how: HOW },
  { id: 'bench-two', kind: 'bench', name: 'Sample bench two', area: 'Sample sub-area two', how: HOW, needs: 'Needs Sample key item' },
  { id: 'bellway-one', kind: 'bellway', name: 'Sample Bellway station', how: HOW },
  {
    id: 'shop-one', kind: 'shop', name: 'Sample vendor one', area: 'Sample sub-area one', how: HOW,
    stock: [
      { name: 'Sample shop entry one', price: 80 },
      { name: 'Sample shop entry two', price: 120, bought: true },
      { name: 'Sample unpriced upgrade', price: null },
      { name: 'Sample shop entry three', price: 150 },
    ],
  },
  { id: 'shop-two', kind: 'shop', name: 'Sample vendor two', how: HOW, needs: 'Needs Sample boss fight', stock: [{ name: 'Sample shop entry four', price: 220 }] },
  { id: 'npc-one', kind: 'npc', name: 'Sample character one', area: 'Sample sub-area two', how: HOW },
  { id: 'npc-two', kind: 'npc', name: 'Sample character two', how: HOW, needs: 'Needs Sample key item, Sample boss fight, Sample ability and 2 more' },
  { id: 'wishboard-one', kind: 'wishboard', name: 'Sample wish board', how: HOW },
  { id: 'arena-one', kind: 'arena', name: 'Sample arena', area: 'Sample sub-area one', how: HOW, link: 'map' },
  { id: 'door-one', kind: 'door', name: 'Sample door', how: HOW, link: 'map', needs: 'Needs Sample key item' },
];

function placeRow(p, target) {
  const link = mapOrSource('', p.name, p.link || 'source');
  const stock = p.stock
    ? `
                <p class="pl-sells-label" id="sells-${p.id}">Sells</p>
                <ul class="pl-stock" aria-labelledby="sells-${p.id}">
${p.stock.map((s) => `                  <li${s.bought ? ' class="is-bought"' : ''}><span class="pl-stock-name">${s.name}</span><span class="pl-stock-end">${s.price ? `<span class="pl-stock-price num">${n(s.price)} Rosaries</span>` : ''}${s.bought ? '<span class="pl-bought">Bought</span>' : ''}</span></li>`).join('\n')}
                </ul>`
    : '';
  return `              <li class="pl${target === p.id ? ' is-target' : ''}" id="place-${p.id}">
                <h4 class="pl-name">${p.name}</h4>
                <div class="entry-meta">${p.area ? `<span>${p.area}</span>` : ''}${link}</div>
                <p class="entry-how">${p.how}</p>
                ${p.needs ? `<p class="entry-needs is-missing">${p.needs}</p>` : ''}${stock}
              </li>`;
}

// "Places in this region": one plate after the entries, one heading per kind that has Places.
function placesSection(places, { target = null } = {}) {
  const groups = KINDS.map(([kind, label]) => {
    const rows = places.filter((p) => p.kind === kind);
    if (!rows.length) return '';
    return `            <section class="pl-group" aria-labelledby="pl-${kind}">
              <h3 class="pl-kind" id="pl-${kind}">${label}</h3>
              <ul class="pl-list">
${rows.map((p) => placeRow(p, target)).join('\n')}
              </ul>
            </section>`;
  }).join('\n');
  return `            <section class="plate pl-section" aria-labelledby="places-title">
              <h2 class="plate-heading" id="places-title">Places in this region</h2>
              <p class="plate-help">Places help you find your way. They are never marked done and do not change your counts. Source is the page we checked; Map shows where it is on a map. Mark what you buy on the <a href="addendum-places-sold-by.html">Rosaries page</a>.</p>
${groups}
            </section>`;
}

function entriesList(rows) {
  return `            <h2 class="visually-hidden">Entries in this region</h2>
            <ol class="entries">
${rows}
            </ol>`;
}

const REGION_INTRO = 'Sample summary line for a layout mockup.';

const hiddenSide = `          <aside class="plate" aria-label="Hidden entries and places">
            <h2 class="plate-heading">Its entries and places stay hidden</h2>
            <p class="plate-text">They appear once you visit the region. Turn on show everything if you want to read ahead.</p>
            <div class="toggles">
              ${sw('I have visited this region', false)}
              ${sw('Show everything, spoilers included', false)}
            </div>
          </aside>`;

function onlySide(visited) {
  return `          <aside class="plate" aria-label="Not in the guide yet">
            <h2 class="plate-heading">Not in the guide yet</h2>
            <p class="plate-text">Its entries ship in a later batch.${visited ? '' : ' Its places stay hidden until you visit the region. Turn on show everything if you want to read ahead.'}</p>
            <div class="toggles">
              ${sw('I have visited this region', visited)}
              ${sw('Show everything, spoilers included', false)}
            </div>
          </aside>`;
}

// ------------------------------------------------------------------ Rosaries: Sold by

const VENDORS = {
  v1: { name: 'Sample vendor one', region: 'Sample region A', id: 'shop-one', shown: true },
  v2: { name: 'Sample vendor two', region: 'Sample region B', id: 'shop-two', shown: true },
  v3: { name: 'Sample vendor three', region: 'Sample region C', id: 'shop-three', shown: false },
};

// The lines under a row or in the Next to buy plate. A vendor is named only when its Region is shown; any
// number of hidden vendors become one line.
function soldByList(keys) {
  if (!keys || !keys.length) return '';
  const vendors = keys.map((k) => VENDORS[k]);
  const lines = vendors
    .filter((v) => v.shown)
    .map((v) => `<li>Sold by <a href="addendum-places-anchor.html#place-${v.id}">${v.name} in ${v.region}</a></li>`);
  if (vendors.some((v) => !v.shown)) lines.push('<li>Sold in a region you have not visited</li>');
  return `\n                <ul class="tk-sold" aria-label="Where to buy">${lines.join('')}</ul>`;
}

function rosariesWith({ file, map, bought, extraStates, noteHtml = '' }) {
  const html = rosariesPage({
    file,
    states: extraStates,
    bought,
    soldBy: (e) => soldByList(map[e.name]),
    soldByNext: (e) => soldByList(map[e.name]),
  });
  return html.replace(/<p class="route-legend plate-help">/, `${noteHtml}<p class="route-legend plate-help">`);
}

const SOLD_STATES = REGION_STATES;
const MAP_MAIN = {
  'Sample shop entry one': ['v1'],
  'Sample shop entry two': ['v1'],
  'Sample shop entry three': ['v1', 'v2'], // two vendors, both shown
  // entry four: no Place sells it, so no line
  'Sample shop entry five': ['v2', 'v3'], // one shown, one in an unvisited Region
  'Sample shop entry six': ['v3'], // only in an unvisited Region
};
const MAP_HIDDEN = {
  'Sample shop entry one': ['v1'],
  'Sample shop entry two': ['v1'],
  'Sample shop entry three': ['v3'], // the Next to buy entry is sold only in an unvisited Region
  'Sample shop entry five': ['v2'],
};

// ------------------------------------------------------------------ Build picker: Templates and Synergies

const NOT_OWNED_VISIBLE = { 'sample-tool-seven': 'Sample tool seven' }; // in a Region the player has visited
const NOT_OWNED_HIDDEN = { 'sample-tool-eight': 'Sample tool eight' }; // in a Region the player has not visited
// sample-tool-nine already exists in TOOLS as "known, not marked done"; here its Region is not visited.
const HIDDEN_IDS = new Set(['sample-tool-eight', 'sample-tool-nine']);

const nameOf = (id) => TOOLS[id]?.name ?? NOT_OWNED_VISIBLE[id] ?? NOT_OWNED_HIDDEN[id] ?? id;
const isOwned = (id) => Boolean(TOOLS[id]) && owned(id);

const TEMPLATES = [
  { id: 't1', name: 'Sample template one', editorial: true, goal: 'Sample goal in one short sentence, in our own words.',
    build: { red: ['sample-tool-one', 'sample-tool-two'], blue: ['sample-tool-three'], white: ['sample-skill-one'] } },
  { id: 't2', name: 'Sample template two', editorial: false, goal: 'Sample goal in one short sentence, restating what the guide recommends it for.',
    build: { red: ['sample-tool-one', 'sample-tool-six', 'sample-tool-seven'], blue: ['sample-tool-three', 'sample-tool-four', 'sample-tool-eight'], yellow: ['sample-tool-five', 'sample-tool-nine'], white: ['sample-skill-two'] } },
  { id: 't3', name: 'Sample template three', editorial: true, goal: 'Sample goal in one short sentence, in our own words.',
    build: { red: ['sample-tool-one'], white: ['sample-skill-one', 'sample-skill-two'] } },
  { id: 't4', name: 'Sample template four', editorial: false, goal: 'Sample goal in one short sentence, restating what the guide recommends it for.',
    build: { red: ['sample-tool-seven'], yellow: ['sample-tool-nine'] } },
];

// What fitTemplate(...) would return for the invented Crest: missing, usable, noRoom (js/builds.js does this).
function fit(template, crest) {
  const now = slotsNow(crest);
  const missing = [];
  const usable = { red: [], blue: [], yellow: [], white: [] };
  const noRoom = [];
  for (const c of COLOURS) {
    for (const id of template.build[c] || []) {
      if (isOwned(id)) usable[c].push(id);
      else missing.push(id);
    }
    usable[c].forEach((id, i) => { if (i >= now[c]) noRoom.push({ id, c }); });
  }
  return { missing, usable, noRoom };
}

const usableCount = (u) => COLOURS.reduce((s, c) => s + u[c].length, 0);

// Names for "Needs ...": a missing id whose Region is not Visited is counted, not named, unless "Show everything" is on.
function needsText(ids, showAll) {
  const named = ids.filter((id) => showAll || !HIDDEN_IDS.has(id)).map(nameOf);
  const hidden = showAll ? 0 : ids.filter((id) => HIDDEN_IDS.has(id)).length;
  const parts = [];
  if (named.length) parts.push(listWithMore(named, 3));
  if (hidden) parts.push(`${hidden} you have not found yet`);
  return `Needs ${parts.join(' and ')}.`;
}

function contentsOf(template, showAll) {
  return COLOURS.filter((c) => (template.build[c] || []).length).map((c) => {
    const ids = template.build[c];
    const named = ids.filter((id) => showAll || !HIDDEN_IDS.has(id)).map(nameOf);
    const hidden = showAll ? 0 : ids.filter((id) => HIDDEN_IDS.has(id)).length;
    if (hidden) named.push(`${hidden} you have not found yet`);
    return `<div><dt>${Cap(c)}</dt><dd>${named.join(', ')}</dd></div>`;
  }).join('');
}

function noRoomText(noRoom) {
  const by = {};
  for (const x of noRoom) by[x.c] = (by[x.c] || 0) + 1;
  return `Needs more slots: ${COLOURS.filter((c) => by[c]).map((c) => `${by[c]} ${c}`).join(', ')}.`;
}

function changedCount(saved, current, crest) {
  const now = slotsNow(crest);
  return COLOURS.reduce((s, c) => {
    const a = current[c] || [];
    const b = saved[c] || [];
    const len = Math.max(a.length, b.length, now[c]);
    let diff = 0;
    for (let i = 0; i < len; i++) if ((a[i] || '') !== (b[i] || '')) diff++;
    return s + diff;
  }, 0);
}

function templateCard(t, crest, { showAll = false, ask = null }) {
  const f = fit(t, crest);
  const ready = !f.missing.length && !f.noRoom.length;
  const nothing = usableCount(f.usable) === 0;
  const sid = `tp-${t.id}-status`;
  const states = [];
  if (ready) states.push('<li><span class="bd-dot bd-dot--saved" aria-hidden="true"></span><span><strong>Ready.</strong> You own all of it and this Crest has room.</span></li>');
  if (f.missing.length) states.push(`<li class="is-needs"><span class="bd-dot bd-dot--hollow" aria-hidden="true"></span><span>${needsText(f.missing, showAll)}</span></li>`);
  if (f.noRoom.length) states.push(`<li class="is-needs"><span class="bd-dot bd-dot--dashed" aria-hidden="true"></span><span>${noRoomText(f.noRoom)}</span></li>`);
  const tag = t.editorial ? '<span class="tp-tag">Our suggestion</span>' : '<span class="tp-tag tp-tag--guide">From a guide</span>';
  const actions = ask === t.id
    ? `<div class="callout tp-ask" role="group" aria-labelledby="ask-title">
                <p class="callout-title" id="ask-title">Replace your changes?</p>
                <p class="callout-text">${plural(ask_changed, 'slot is', 'slots are')} changed and not saved. Using this template replaces them. The Build you saved stays as it is until you save.</p>
                <div class="button-row"><button type="button" class="button button--primary">Replace my changes</button><button type="button" class="button button--secondary">Keep my changes</button></div>
              </div>`
    : `<div class="button-row tp-actions"><button type="button" class="button button--secondary" aria-describedby="${sid}"${nothing ? ' disabled' : ''}>Use as my Build</button></div>${nothing ? '\n              <p class="tp-note">You own nothing in this template yet, so there is nothing to fill in.</p>' : ''}`;
  return `            <li class="tp" aria-labelledby="tp-${t.id}-name">
              <h3 class="tp-name" id="tp-${t.id}-name">${t.name}</h3>
              <div class="entry-meta tp-tags">${tag}<a class="source-link" href="#" aria-label="Source for ${t.name}">Source</a></div>
              <p class="tp-goal">${t.goal}</p>
              <dl class="tp-slots">${contentsOf(t, showAll)}</dl>
              <ul class="tp-states" id="${sid}">${states.join('')}</ul>
              ${actions}
            </li>`;
}
let ask_changed = 0;

function templatesSection(crest, opts) {
  return `            <section class="tp-section" aria-labelledby="templates-title">
              <h2 class="list-heading list-heading--spaced" id="templates-title">Templates</h2>
              <div class="plate-help tp-intro">
                <p>A template is a Build to start from. Use as my Build fills the slots below with the Tools you own from it. It does not save: you choose when to save.</p>
                <p>Our suggestion is a grouping we made from what each Tool does. From a guide is a Build a guide recommends. Each links its source.${opts.showAll ? '' : ' Names of Tools in regions you have not visited stay hidden.'}</p>
              </div>
              <ul class="tp-list">
${TEMPLATES.map((t) => templateCard(t, crest, opts)).join('\n')}
              </ul>
            </section>`;
}

// ---- synergies (invented pairs; effects are placeholders)

const SYNERGIES = [
  { a: 'sample-tool-one', b: 'sample-tool-three' },
  { a: 'sample-tool-five', b: 'sample-skill-one' },
  { a: 'sample-tool-two', b: 'sample-tool-four' },
  { a: 'sample-tool-six', b: 'sample-tool-nine' }, // tool nine is not owned, so this pair is never listed
];
const SY_EFFECT = 'Sample effect of the pair in one short sentence, in our own words.';

function synergiesSection(build) {
  const ids = new Set(COLOURS.flatMap((c) => build[c] || []));
  const together = SYNERGIES.filter((s) => ids.has(s.a) && ids.has(s.b));
  const partners = SYNERGIES.filter((s) => ids.has(s.a) !== ids.has(s.b))
    .map((s) => ({ s, inBuild: ids.has(s.a) ? s.a : s.b, other: ids.has(s.a) ? s.b : s.a }))
    .filter((p) => isOwned(p.other));
  const togetherHtml = together.length
    ? `<ul class="sy-list">${together.map((s) => `
                  <li class="sy"><p class="sy-pair">${nameOf(s.a)} and ${nameOf(s.b)}</p><p class="sy-effect">${SY_EFFECT}</p><div class="entry-meta"><a class="source-link" href="#" aria-label="Source for ${nameOf(s.a)} and ${nameOf(s.b)}">Source</a></div></li>`).join('')}
                </ul>`
    : '<p class="sy-none">No pair in this Build is listed in the guide yet.</p>';
  const partnersHtml = partners.length
    ? `
              <div class="sy-block">
                <h3 class="plate-subheading" id="pairs-title">Pairs well with</h3>
                <ul class="sy-list" aria-labelledby="pairs-title">${partners.map((p) => `
                  <li class="sy"><p class="sy-pair">${nameOf(p.inBuild)} pairs well with ${nameOf(p.other)}</p><p class="sy-note">You own ${nameOf(p.other)}. It is not in this Build.</p><p class="sy-effect">${SY_EFFECT}</p><div class="entry-meta"><a class="source-link" href="#" aria-label="Source for ${nameOf(p.inBuild)} and ${nameOf(p.other)}">Source</a></div></li>`).join('')}
                </ul>
              </div>`
    : '';
  return `            <section class="plate sy-section" aria-labelledby="works-title">
              <div class="sy-block">
                <h2 class="plate-heading" id="works-title">Works together</h2>
                ${togetherHtml}
              </div>${partnersHtml}
            </section>`;
}

function railSwitch(on) {
  return `
            <div class="rail-section">
              <div class="toggles">${sw('Show everything, spoilers included', on)}</div>
              <p class="tk-rail-text">${on ? 'Names of Tools in regions you have not visited are shown in the templates.' : 'Shows the names of Tools in regions you have not visited, in the templates.'}</p>
            </div>`;
}

const CREST = CRESTS.find((c) => c.id === 'c2');

// Draft after "Use as my Build" on template two: what it does with missing and no-room ids.
const t2 = TEMPLATES.find((t) => t.id === 't2');
const USED_DRAFT = fit(t2, CREST).usable;
const LEFT_OUT = fit(t2, CREST).missing;

function builds({ file, saved, current, status, templatesOpts = {}, ask = false, used = false, switchOn = null, extraNote = '' }) {
  ask_changed = changedCount(saved, current ?? saved, CREST);
  const shown = current ?? saved;
  const html = buildsPage({
    file,
    crestId: 'c2',
    saved,
    current,
    status,
    problemsOn: used,
    calloutOverride: used
      ? `            <div class="callout" role="group" aria-labelledby="used-title">
              <p class="callout-title" id="used-title">Started from ${t2.name}</p>
              <p class="callout-text">Left out because you do not own them yet: ${needsText(LEFT_OUT, false).replace(/^Needs /, '').replace(/\.$/, '')}. ${nameOf('sample-tool-four')} has no slot until you open another blue slot. Nothing is saved until you save.</p>
            </div>`
      : null,
    beforeBuild: `${templatesSection(CREST, { ...templatesOpts, ask: ask ? 't1' : null })}${extraNote ? `\n            ${extraNote}` : ''}`,
    afterSlots: synergiesSection(shown),
    railExtra: switchOn === null ? '' : railSwitch(switchOn),
    states: BUILD_STATES,
  });
  return html;
}

// ------------------------------------------------------------------ write everything

const files = {};

files['addendum-places-visited.html'] = regionShell({
  file: 'addendum-places-visited.html', name: 'Sample region A', intro: REGION_INTRO,
  main: `${entriesList(ENTRIES_OPEN)}\n${placesSection(PLACES)}`,
  side: countsPlate({ visitedToggle: true }),
});
files['addendum-places-anchor.html'] = regionShell({
  file: 'addendum-places-anchor.html', name: 'Sample region A', intro: REGION_INTRO,
  main: `${entriesList(ENTRIES_OPEN)}\n${placesSection(PLACES, { target: 'shop-one' })}`,
  side: countsPlate({ visitedToggle: true }),
});
files['addendum-places-hidden.html'] = regionShell({
  file: 'addendum-places-hidden.html', name: 'Sample region A', intro: REGION_INTRO,
  main: null, side: hiddenSide, sideOnly: true,
});
files['addendum-places-locked.html'] = regionShell({
  file: 'addendum-places-locked.html', name: 'Sample region D', locked: true,
  intro: 'Locked. You cannot enter yet. Finish what is below and this region opens.',
  main: `            <h2 class="visually-hidden">What this region needs</h2>
            <ol class="chain">
              <li class="entry">
                <div class="entry-rail"><span class="entry-thread is-blocked" aria-hidden="true"></span><span class="mark mark--static mark--knot is-blocked" aria-hidden="true"></span></div>
                <div class="entry-body"><span class="entry-name">Sample boss fight</span><div class="entry-meta"><span>Boss in Sample region A</span><a class="source-link" href="#" aria-label="Source for Sample boss fight">Source</a></div><p class="entry-state is-missing">Not done yet</p><p class="entry-link"><a href="#">Go to Sample region A</a></p></div>
              </li>
              <li class="entry entry-region">
                <div class="entry-rail"><span class="mark mark--bead mark--static mark--region" aria-hidden="true"></span></div>
                <div class="entry-body"><span class="entry-name">Sample region D</span><p class="entry-note">Opens when the steps above are done.</p></div>
              </li>
            </ol>
            <h2 class="list-heading list-heading--spaced">Entries in this region</h2>
            <ol class="entries">
${ENTRIES_LOCKED}
            </ol>
${placesSection(PLACES.filter((p) => ['bench', 'bellway', 'shop'].includes(p.kind) && p.id !== 'shop-two'))}`,
  side: countsPlate({ visitedToggle: null }),
});
files['addendum-places-only.html'] = regionShell({
  file: 'addendum-places-only.html', name: 'Sample region E', intro: REGION_INTRO,
  main: placesSection(PLACES.filter((p) => ['bench', 'bellway', 'npc'].includes(p.kind))),
  side: onlySide(true),
});
files['addendum-places-only-hidden.html'] = regionShell({
  file: 'addendum-places-only-hidden.html', name: 'Sample region E', intro: REGION_INTRO,
  main: null, side: onlySide(false), sideOnly: true,
});

files['addendum-places-sold-by.html'] = rosariesWith({
  file: 'addendum-places-sold-by.html', map: MAP_MAIN, extraStates: SOLD_STATES,
  bought: ['Sample shop entry one', 'Sample shop entry two', 'Sample shop entry five'],
});
files['addendum-places-sold-by-hidden.html'] = rosariesWith({
  file: 'addendum-places-sold-by-hidden.html', map: MAP_HIDDEN, extraStates: SOLD_STATES,
  bought: ['Sample shop entry one', 'Sample shop entry two', 'Sample shop entry five'],
});

const NOTE_A = note('Option A (the one shown): no switch on this page. A Tool in a region you have not visited is counted, not named. Option B adds a Show everything switch to the left plate; see "Option B: Show everything".');
files['addendum-templates-list.html'] = builds({ file: 'addendum-templates-list.html', saved: SAVED_BUILD, status: 'saved', extraNote: NOTE_A });
files['addendum-templates-empty.html'] = builds({ file: 'addendum-templates-empty.html', saved: {}, current: {}, status: 'none' });
files['addendum-templates-ask.html'] = builds({
  file: 'addendum-templates-ask.html', saved: SAVED_BUILD, current: EDITED_BUILD, status: 'unsaved', ask: true,
  extraNote: note('The player pressed Use as my Build on the first template while the Build has unsaved changes. The page asks inside that card: focus moves to Keep my changes (the safe choice), Escape also keeps them, and nothing changes until Replace my changes.'),
});
files['addendum-templates-used.html'] = builds({
  file: 'addendum-templates-used.html', saved: SAVED_BUILD, current: USED_DRAFT, status: 'unsaved', used: true,
  extraNote: note('After Use as my Build on the second template. Only what the player owns is copied; the rest is named in the box under Your Build (and spoken in the live region). A Tool with no room shows as a No slot for it row, as already designed. Focus moves to the Your Build heading. Nothing is saved.'),
});
files['addendum-templates-option-b.html'] = builds({
  file: 'addendum-templates-option-b.html', saved: SAVED_BUILD, status: 'saved', switchOn: true, templatesOpts: { showAll: true },
  extraNote: note('Option B: a Show everything, spoilers included switch in the left plate, shown on. Off, the page looks like option A plus the switch. Open question: is it the same setting as on the Region page, or this page only?'),
});

// New pages need the Places stylesheet; the addendum builders do not link it.
for (const [name, html] of Object.entries(files)) {
  const withCss = html.includes('trackers-places.css')
    ? html
    : html.replace('<link rel="stylesheet" href="trackers-addendum.css">', '<link rel="stylesheet" href="trackers-addendum.css">\n  <link rel="stylesheet" href="trackers-places.css">');
  writeFileSync(join(here, name), withCss);
}
console.log(`wrote ${Object.keys(files).length} files`);
