// Writes the P5-10 addendum mockups in this folder (files named addendum-*.html).
// Run: node docs/design/trackers/_build-addendum.mjs
// Why a second script and not an edit of _build.mjs: the T30 pages were reviewed as they are. Regenerating them
// would change their header and wording behind the reviewer's back. This script only writes new files.
// What the addendum covers (Athos, second answers, 2026-10-20): saving a Build, opened slots (Memory Lockets),
// and the header with six links. The provisional Shell Shards number was removed in P5-31 (Athos dropped it).
// P5-31: the helpers below are exported and the file only writes when run directly, so _build-places.mjs can reuse
// them. The optional hooks (soldBy, beforeBuild, afterSlots, railExtra, calloutOverride) default to nothing, so the
// P5-10 pages come out look the same.
// ALL CONTENT BELOW IS INVENTED to show states. None of it is game data; never copy it into data/.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const n = (v) => v.toLocaleString('en-US');
export const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
export const entries = (count) => plural(count, 'entry', 'entries');

// ------------------------------------------------------------------ shared pieces

// Six links (Athos, second answers, item 3). Hrefs point at the mockup files that stand in for each page.
const NAV = [
  ['index.html', 'Regions'],
  ['route.html', 'Route'],
  ['trackers-crests-partial.html', 'Trackers'],
  ['addendum-rosaries.html', 'Rosaries'],
  ['addendum-builds-saved.html', 'Builds'],
  ['account.html', 'Account and backup'],
];

// mode: 'inline' = the links are always shown (desktop, and option A on a phone);
// 'menu' / 'menu-open' = option M, a Menu button on a phone. current marks the page the reader is on.
export function header(current, mode = 'inline') {
  const links = NAV.map(([href, label]) => {
    const cur = label === current ? ' aria-current="page"' : '';
    const text = label === 'Account and backup' && mode === 'inline' ? 'Account<span class="nav-extra"> and backup</span>' : label;
    return `<a href="${href}"${cur}>${text}</a>`;
  }).join('\n          ');
  const menu = mode !== 'inline';
  return `<header class="site-header${menu ? ' menu-mock' : ''}${mode === 'menu-open' ? ' is-open' : ''}">
      <div class="frame">
        <a class="logo" href="index.html">
          <svg class="logo-mark" viewBox="0 0 30 18" aria-hidden="true"><path class="line" d="M3 9 H29"/><ellipse class="eye" cx="4.5" cy="9" rx="2.3" ry="3.6"/></svg>
          Silksong guide
        </a>
        ${menu ? `<button type="button" class="nav-toggle" aria-expanded="${mode === 'menu-open'}" aria-controls="site-menu">Menu</button>` : ''}
        <nav id="site-menu" class="site-nav${menu ? '' : ' nav-short'}" aria-label="Main">
          ${links}
        </nav>
      </div>
    </header>`;
}

export function stateBar(current, states) {
  const links = states
    .map(([file, label]) => `<a href="${file}"${file === current ? ' aria-current="page"' : ''}>${label}</a>`)
    .join(' &middot; ');
  return `<div class="banner mock-states">Mockup with invented content, not guide data. Other states: ${links}</div>`;
}

const FOOTER_NOTE =
  'Layout sample. Names, prices, counts and states are invented to show what a screen can look like; they are not guide data.';

// heroClass: ' opt-wrap tablet-fix' is the spacing used for the Builds and Rosaries screenshots, so the title is not
// covered while the choice between option W and option M is open (see the header pages).
const PHONE_HEADER = ' opt-wrap tablet-fix';
export function page({ file, title, bodyAttr, navCurrent, navMode, h1, intro, main, states, heroClass = PHONE_HEADER }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Silksong guide (mockup)</title>
  <link rel="stylesheet" href="../../../css/base.css">
  <link rel="stylesheet" href="../../../css/components.css">
  <link rel="stylesheet" href="trackers.css">
  <link rel="stylesheet" href="trackers-addendum.css">
</head>
<body data-page="${bodyAttr}">
  <a class="skip-link" href="#app">Skip to the content</a>
  ${stateBar(file, states)}
  <div class="page${heroClass}">
    ${header(navCurrent, navMode)}
    <main id="app" tabindex="-1">
      <section class="hero hero--short">
        <div class="hero-shade"></div>
        <div class="hero-shade hero-shade--title"></div>
        <div class="frame">
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

export function needleBar({ done, total, label }) {
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const complete = total > 0 && done === total;
  const text = `${done} of ${total}`;
  return `<div class="count-block tk-summary-rail">
            <div class="count-row count-row--collectibles"><span>${label}</span><span class="count-value num">${text}</span></div>
            <div class="bar bar--collectibles${complete ? ' bar--complete' : ''}" role="progressbar" aria-label="${label}: ${text}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
              <div class="bar-track"></div>
              <div class="bar-fill" style="width:${percent}%"></div>
              ${complete ? '' : `<svg class="bar-needle" width="28" height="18" viewBox="0 0 28 18" aria-hidden="true" style="left:calc(${percent}% - 22px)"><path class="line" d="M3 9 H27"/><ellipse class="eye" cx="4.5" cy="9" rx="2.3" ry="3.6"/></svg>`}
            </div>
          </div>`;
}

export function toggle(label) {
  return `<label class="switch"><input type="checkbox" class="switch-input"><span class="switch-track" aria-hidden="true"></span><span class="switch-text">${label}</span></label>`;
}

export function hiddenRow(text) {
  return `            <li class="entry entry--hidden">
              <div class="entry-rail">
                <span class="entry-thread" aria-hidden="true"></span>
                <span class="mark mark--bead mark--static mark--region" aria-hidden="true"></span>
              </div>
              <div class="entry-body"><p class="entry-note">${text}</p></div>
            </li>`;
}

// ------------------------------------------------------------------ Builds

export const COLOURS = ['red', 'blue', 'yellow', 'white'];
export const Cap = (s) => s[0].toUpperCase() + s.slice(1);

// Invented items the player owns (marked done). Tools by colour; Silk Skills fit white slots.
export const TOOLS = {
  'sample-tool-one': { name: 'Sample tool one', colour: 'red', type: 'Tool' },
  'sample-tool-two': { name: 'Sample tool two', colour: 'red', type: 'Tool' },
  'sample-tool-six': { name: 'Sample tool six', colour: 'red', type: 'Tool' },
  'sample-tool-three': { name: 'Sample tool three', colour: 'blue', type: 'Tool' },
  'sample-tool-four': { name: 'Sample tool four', colour: 'blue', type: 'Tool' },
  'sample-tool-five': { name: 'Sample tool five', colour: 'yellow', type: 'Tool' },
  'sample-skill-one': { name: 'Sample silk skill one', colour: 'white', type: 'Silk skill' },
  'sample-skill-two': { name: 'Sample silk skill two', colour: 'white', type: 'Silk skill' },
  // Known to the guide but not marked done by this player (used in the "no longer fits" state).
  'sample-tool-nine': { name: 'Sample tool nine', colour: 'yellow', type: 'Tool', owned: false },
};
export const owned = (id) => TOOLS[id] && TOOLS[id].owned !== false;
export const ownedFor = (c) => Object.entries(TOOLS).filter(([id, t]) => t.colour === c && owned(id)).map(([id, t]) => ({ id, ...t }));
export const OWNED_COUNT = Object.keys(TOOLS).filter(owned).length;

export const EFFECT = 'Sample effect in one short sentence, in our own words.';

// A Crest as the picker sees it: base slots, the most it can open, what the player opened, and what
// done entries grant (the Vesticrest style). slotsFor() in js/builds.js does this sum; here it is hand-written.
export const CRESTS = [
  { id: 'c1', name: 'Sample crest one', slots: { red: 2, blue: 1, yellow: 0, white: 1 }, max: { red: 2, blue: 1, yellow: 0, white: 1 }, opened: {}, grants: {} },
  {
    id: 'c2', name: 'Sample crest two',
    slots: { red: 2, blue: 1, yellow: 1, white: 1 },
    max: { red: 4, blue: 2, yellow: 1, white: 1 },
    opened: { red: 1 },
    grants: { yellow: 1 },
  },
  { id: 'c3', name: 'Sample crest three', slots: null },
  { id: 'c4', name: 'Sample crest four', slots: { red: 1, blue: 1, yellow: 1, white: 1 }, max: null, opened: {}, grants: {} },
];

export function slotsNow(crest) {
  const out = {};
  for (const c of COLOURS) {
    const extra = crest.max ? crest.max[c] - crest.slots[c] : 0;
    out[c] = crest.slots[c] + Math.min(crest.opened[c] || 0, extra) + (crest.grants[c] || 0);
  }
  return out;
}
export const total = (o) => COLOURS.reduce((s, c) => s + o[c], 0);

// "3 red, 1 blue" style summary; zero colours are left out.
export function slotSummary(now) {
  return COLOURS.filter((c) => now[c] > 0).map((c) => `${now[c]} ${c}`).join(', ');
}

// Problems as checkBuild(...) would return them, worked out here from the invented data.
function problemsFor(crest, build) {
  const now = slotsNow(crest);
  const found = [];
  for (const c of COLOURS) {
    (build[c] || []).forEach((id, i) => {
      const t = TOOLS[id];
      if (!t) found.push({ id, c, i, problem: 'unknown' });
      else if (!owned(id)) found.push({ id, c, i, problem: 'not-owned' });
      else if (t.colour !== c) found.push({ id, c, i, problem: 'wrong-colour' });
      if (i >= now[c]) found.push({ id, c, i, problem: 'no-room' });
    });
  }
  return found;
}

function problemText(p, now) {
  if (p.problem === 'not-owned') return 'You have not marked this as done yet.';
  if (p.problem === 'wrong-colour') return `This does not fit a ${p.c} slot.`;
  if (p.problem === 'no-room') return `This Crest has no room for it: it has ${plural(now[p.c], `${p.c} slot`, `${p.c} slots`)} now.`;
  return 'This is no longer in the guide.';
}

// One Build slot: a labelled choice among the Tools the player owns for that colour. The saved choice stays
// in the list even when it no longer fits, so opening the page never removes anything.
function slotRow({ crest, c, i, saved, current, selId, problems, idp }) {
  const options = ownedFor(c);
  const sel = current[c]?.[i] ?? '';
  const mine = problems.filter((p) => p.c === c && p.i === i && p.problem !== 'no-room');
  const inList = options.some((o) => o.id === sel);
  // The saved choice stays in the list even when it no longer fits; the problem line under the select says why.
  const extraOpt = sel && !inList ? `<option value="${sel}" selected>${TOOLS[sel]?.name ?? sel}</option>` : '';
  const optsHtml = [`<option value=""${sel ? '' : ' selected'}>Empty slot</option>`, extraOpt, ...options.map((o) => `<option value="${o.id}"${o.id === sel ? ' selected' : ''}>${o.name}</option>`)].filter(Boolean).join('');
  const hasProblem = mine.length > 0;
  const filled = Boolean(sel) && !hasProblem;
  const markState = hasProblem ? ' is-blocked' : filled ? ' is-done' : '';
  const thread = `entry-thread${filled ? ' is-clear' : ''}${hasProblem ? ' is-blocked' : ''}`;
  const id = `${idp}-${i}`;
  const t = sel && TOOLS[sel];
  const describedBy = hasProblem ? ` aria-describedby="prob-${id}"` : '';
  return `            <li class="entry">
              <div class="entry-rail">
                <span class="${thread}" aria-hidden="true"></span>
                <span class="mark mark--bead mark--static${markState}" aria-hidden="true"></span>
              </div>
              <div class="entry-body">
                <label class="bd-label" for="${id}">${Cap(c)} slot ${i + 1}</label>
                <div class="bd-select"><select id="${id}"${describedBy}${hasProblem ? ' aria-invalid="true"' : ''}>${optsHtml}</select></div>
                ${hasProblem ? `<p id="prob-${id}" class="entry-needs is-missing">${problemText(mine[0], slotsNow(crest))}</p>` : ''}
                ${filled && t ? `<div class="entry-meta"><span>${t.type}</span><a class="source-link" href="#" aria-label="Source for ${t.name}">Source</a></div><p class="entry-how">${EFFECT}</p>` : ''}
              </div>
            </li>`;
}

// A row for a saved id that has no slot to sit in (no-room). It cannot be a select, so it offers a way out.
function overflowRow({ crest, c, i, id, idp }) {
  const t = TOOLS[id];
  const key = `${idp}-x${i}`;
  return `            <li class="entry">
              <div class="entry-rail">
                <span class="entry-thread is-blocked" aria-hidden="true"></span>
                <span class="mark mark--bead mark--static is-blocked" aria-hidden="true"></span>
              </div>
              <div class="entry-body">
                <p class="bd-label" id="lab-${key}">${t ? t.name : id}<span class="bd-tag">No slot for it</span></p>
                <p id="prob-${key}" class="entry-needs is-missing">${problemText({ problem: 'no-room', c }, slotsNow(crest))}</p>
                <div class="bd-inline"><button type="button" class="button button--secondary button--small" aria-describedby="lab-${key}">Take out of this Build</button></div>
              </div>
            </li>`;
}

export function colourGroup({ crest, c, current, saved, problems, last }) {
  const now = slotsNow(crest);
  const idp = `slot-${c}`;
  const list = current[c] || [];
  const filledCount = list.filter((id, i) => i < now[c] && id).length;
  let body;
  if (now[c] === 0 && !list.length) {
    body = hiddenRow(`This Crest has no ${c} slots.`);
  } else {
    const rows = [];
    for (let i = 0; i < now[c]; i++) rows.push(slotRow({ crest, c, i, saved, current, problems, idp }));
    list.forEach((id, i) => {
      if (i >= now[c]) rows.push(overflowRow({ crest, c, i, id, idp }));
    });
    if (!ownedFor(c).length) rows.push(hiddenRow(`You own no ${c === 'white' ? 'Silk Skill' : `${c} Tool`} yet, so this list has only Empty slot.`));
    body = rows.join('\n');
  }
  const note = c === 'white' ? 'Silk Skills' : 'Tools';
  return `            <section class="route-group tk-slot${last ? ' is-last' : ''}" aria-labelledby="${idp}">
              <div class="route-head">
                <div class="entry-rail"><span class="entry-thread" aria-hidden="true"></span></div>
                <div class="route-head-body">
                  <h3 class="tk-slot-name" id="${idp}">${Cap(c)} slots</h3>
                  <span class="tk-slot-meta num">${plural(now[c], 'slot', 'slots')}. ${filledCount} filled. Choose from the ${note} you own.</span>
                </div>
              </div>
              <ol class="entries">
${body}
              </ol>
            </section>`;
}

// Opened slots: one row per colour with a stepper. The limit is slotsMax minus slots (never a number typed by hand).
export function openedPlate(crest) {
  if (!crest.max) {
    return `            <div class="plate bd-opened">
              <h3 class="plate-subheading">Opened slots</h3>
              <p class="plate-text">How many extra slots this Crest can open is not in the guide yet, so the page does not count opened slots for it.</p>
            </div>`;
  }
  const rows = COLOURS.map((c) => {
    const extra = crest.max[c] - crest.slots[c];
    const open = Math.min(crest.opened[c] || 0, extra);
    const grants = crest.grants[c] || 0;
    const now = crest.slots[c] + open + grants;
    const id = `os-${c}`;
    const parts = [`${crest.slots[c]} base`];
    if (grants) parts.push(`${grants} from an entry you have done`);
    const noteMain = extra > 0 ? `Opened ${open} of up to ${extra}${open === extra ? '. Limit reached' : ''}.` : 'No more can be opened on this Crest.';
    const control = extra > 0
      ? `<div class="os-control" role="group" aria-labelledby="${id}">
              <button type="button" class="os-btn" aria-label="Open one fewer ${c} slot"${open === 0 ? ' disabled' : ''}><span aria-hidden="true">&minus;</span></button>
              <output class="os-value num" for="${id}">${open}</output>
              <button type="button" class="os-btn" aria-label="Open one more ${c} slot"${open === extra ? ' disabled' : ''}><span aria-hidden="true">+</span></button>
            </div>`
      : '<div class="os-control os-control--none" aria-hidden="true">&ndash;</div>';
    return `            <div class="os-row">
              <span class="os-name" id="${id}">${Cap(c)}</span>
              ${control}
              <p class="os-note"><span>${noteMain}</span> <span class="num">${plural(now, `${c} slot`, `${c} slots`)} now (${parts.join(', ')}).</span></p>
            </div>`;
  }).join('\n');
  return `            <div class="plate bd-opened">
              <h3 class="plate-subheading">Opened slots</h3>
              <p class="plate-text">A Memory Locket opens an extra slot on a Crest. Say how many you opened on this one. Each colour has a limit.</p>
              <div class="os-grid">
${rows}
              </div>
            </div>`;
}

// The save bar. status: 'none' (nothing chosen, nothing saved), 'unsaved', 'saved'.
export function saveBar({ status, changed, hasSaved }) {
  if (status === 'unsaved') {
    return `            <div class="bd-bar is-unsaved">
              <p class="bd-status" role="status"><span class="bd-dot bd-dot--open" aria-hidden="true"></span><span><strong>Not saved.</strong> ${plural(changed, 'slot differs', 'slots differ')} from the Build you saved.</span></p>
              <div class="button-row"><button type="button" class="button button--primary">Save this Build</button>${hasSaved ? '<button type="button" class="button button--secondary">Undo changes</button>' : ''}</div>
            </div>`;
  }
  if (status === 'saved') {
    return `            <div class="bd-bar is-saved">
              <p class="bd-status" role="status"><span class="bd-dot bd-dot--saved" aria-hidden="true"></span><span><strong>Saved.</strong> This is the Build saved for this Crest.</span></p>
              <div class="button-row"><button type="button" class="button button--primary" disabled>Save this Build</button><button type="button" class="button button--secondary">Remove saved Build</button></div>
            </div>`;
  }
  return `            <div class="bd-bar">
              <p class="bd-status" role="status"><span class="bd-dot bd-dot--open" aria-hidden="true"></span><span><strong>Nothing saved for this Crest yet.</strong> Choose a Tool for each slot, then save.</span></p>
              <div class="button-row"><button type="button" class="button button--primary" disabled>Save this Build</button></div>
            </div>`;
}

export function buildsPage({ file, crestId, saved = {}, current = saved, status, problemsOn = false, states, beforeBuild = '', afterSlots = '', railExtra = '', calloutOverride = null }) {
  const crest = CRESTS.find((c) => c.id === crestId);
  const unknownLayout = !crest.slots;
  const savedFor = (c) => (c.id === crestId ? saved : c.id === 'c1' ? { red: ['sample-tool-one'] } : {});
  const rail = `          <aside class="plate plate--rail" aria-label="Your Crests">
            <div class="rail-section">
              <h2 class="plate-heading">Your Crests</h2>
              <fieldset style="border:0;margin:0;padding:0;min-width:0"><legend class="visually-hidden">Choose a Crest</legend>
              <ul class="tk-crests">
${CRESTS.map((c) => {
    const sub = c.slots ? `${plural(total(slotsNow(c)), 'slot', 'slots')} now` : 'Not in the guide yet';
    const has = c.id === 'c1' || (c.id === crestId && Object.keys(saved).length);
    return `                <li class="tk-crest"><input type="radio" name="crest" id="crest-${c.id}" value="${c.id}"${c.id === crestId ? ' checked' : ''}><label for="crest-${c.id}"><span class="tk-crest-dot" aria-hidden="true"></span><span><span class="tk-crest-name">${c.name}</span><span class="tk-crest-sub num">${sub}</span>${has ? '<span class="tk-crest-sub">Build saved</span>' : ''}</span></label></li>`;
  }).join('\n')}
              </ul></fieldset>
            </div>
            <div class="rail-section">
              <p class="tk-rail-text">Tools and Silk Skills you own: <strong>${OWNED_COUNT}</strong>. Each slot lists only what you have marked as done.</p>
              <p class="tk-rail-text">White slots take Silk Skills. Red, blue and yellow slots take Tools of that colour.</p>
              <p class="tk-rail-text"><a href="trackers-crests-partial.html">Open the Crests tracker</a></p>
            </div>${railExtra}
          </aside>`;

  let mainCol;
  if (unknownLayout) {
    mainCol = `          <div class="main-column">
            <section aria-labelledby="crest-title">
              <h2 class="tk-crest-title" id="crest-title">${crest.name}</h2>
              <div class="plate message" style="margin-top:32px">
                <h3 class="plate-heading">Not in the guide yet</h3>
                <p class="plate-text">The slots for this Crest are not in the guide yet, so there is nothing to fill. You can still mark the Crest as done in the Crests tracker.</p>
              </div>
            </section>
          </div>`;
  } else {
    const now = slotsNow(crest);
    const problems = problemsOn ? problemsFor(crest, current) : [];
    const changed = COLOURS.reduce((s, c) => {
      const a = current[c] || [];
      const b = saved[c] || [];
      const len = Math.max(a.length, b.length, now[c]);
      let diff = 0;
      for (let i = 0; i < len; i++) if ((a[i] || '') !== (b[i] || '')) diff++;
      return s + diff;
    }, 0);
    const callout = calloutOverride !== null ? calloutOverride : problems.length
      ? `            <div class="callout bd-problems" role="group" aria-labelledby="bd-problems-title">
              <p class="callout-title" id="bd-problems-title">This saved Build no longer fits</p>
              <p class="callout-text">${plural(problems.length, 'problem', 'problems')}, each shown on its slot below. Nothing was removed. Change a slot, mark a missing Tool as done in its tracker, or open more slots.</p>
            </div>`
      : '';
    const groups = COLOURS.map((c, i) => colourGroup({ crest, c, current, saved, problems, last: i === COLOURS.length - 1 })).join('\n');
    mainCol = `          <div class="main-column">
            <section aria-labelledby="crest-title">
              <h2 class="tk-crest-title" id="crest-title">${crest.name}</h2>
              <p class="tk-crest-meta num">${plural(total(now), 'slot', 'slots')} now: ${slotSummary(now)}.</p>
              <div class="bd-stack">
${openedPlate(crest)}
              </div>
${beforeBuild}
              <h2 class="list-heading list-heading--spaced">Your Build</h2>
              <div class="bd-stack">
${saveBar({ status, changed, hasSaved: Object.keys(saved).length > 0 })}
${callout}
              </div>
              <div class="tk-slots">
${groups}
              </div>
${afterSlots}
            </section>
          </div>`;
  }

  return page({
    file,
    title: 'Builds',
    bodyAttr: 'builds',
    navCurrent: 'Builds',
    h1: 'Builds',
    intro: 'Pick a Crest you own, choose a Tool you own for each slot, and save the Build.',
    main: `        <div class="layout layout--route">
${rail}
${mainCol}
        </div>`,
    states,
  });
}

const BUILD_STATES = [
  ['addendum-builds-new.html', 'Nothing saved'],
  ['addendum-builds-unsaved.html', 'Not saved'],
  ['addendum-builds-saved.html', 'Saved'],
  ['addendum-builds-problems.html', 'No longer fits'],
  ['addendum-builds-limit-unknown.html', 'Limit not in the guide'],
  ['addendum-builds-layout-unknown.html', 'Layout not in the guide'],
  ['addendum-rosaries.html', 'Rosaries'],
  ['addendum-header-six.html', 'Header'],
];

export const SAVED_BUILD = {
  red: ['sample-tool-one', 'sample-tool-two', 'sample-tool-six'],
  blue: ['sample-tool-three'],
  yellow: ['sample-tool-five'],
  white: ['sample-skill-one'],
};
export const EDITED_BUILD = {
  red: ['sample-tool-one', 'sample-tool-six', 'sample-tool-two'],
  blue: ['sample-tool-four'],
  yellow: ['sample-tool-five', ''],
  white: ['sample-skill-two'],
};
// A saved Build that has stopped fitting, with all four problems.
export const BROKEN_BUILD = {
  red: ['sample-tool-one', 'sample-tool-three', 'sample-tool-six', 'sample-tool-two'],
  blue: ['sample-tool-three'],
  yellow: ['sample-tool-nine', 'retired-sample-id'],
  white: ['sample-skill-one'],
};

// ------------------------------------------------------------------ Rosaries

export const SHOP = [
  { region: 'Sample region A', href: 'region.html', visited: true, items: [
    { name: 'Sample shop entry one', step: 10, price: 80, type: 'Tool' },
    { name: 'Sample shop entry two', step: 12, price: 120, type: 'Crafting upgrade' },
    { name: 'Sample shop entry three', step: 15, price: 150, type: 'Tool' },
    { name: 'Sample shop entry four', step: 18, price: 220, type: 'Keepsake', uncounted: true },
  ] },
  { region: 'Sample region B', href: 'region.html', visited: true, items: [
    { name: 'Sample shop entry five', step: 31, price: 180, type: 'Tool' },
    { name: 'Sample shop entry six', step: 33, price: 300, type: 'Tool', needs: 'Needs Sample key item' },
    { name: 'Sample shop entry seven', step: 35, price: 90, type: 'Keepsake', uncounted: true },
  ] },
  { region: 'Sample region C', href: 'region.html', visited: false, items: [
    { name: 'Sample shop entry eight', step: 50, price: 250, type: 'Tool' },
    { name: 'Sample shop entry nine', step: 52, price: 400, type: 'Tool' },
    { name: 'Sample shop entry ten', step: 55, price: 140, type: 'Keepsake', uncounted: true },
  ] },
];

export function shopRow(e, i, idp, soldBy = '') {
  const id = `${idp}-${i}`;
  const done = e.bought;
  const blocked = !done && e.needs;
  const markState = done ? ' is-done' : blocked ? ' is-blocked' : '';
  const needsId = `needs-${id}`;
  return `            <li class="entry${done ? ' is-done' : ''}">
              <div class="entry-rail">
                <span class="entry-thread${done ? ' is-clear' : ''}${blocked ? ' is-blocked' : ''}" aria-hidden="true"></span>
                <button type="button" class="entry-mark" aria-pressed="${done}" aria-label="${e.name}"${blocked ? ` aria-describedby="${needsId}"` : ''}><span class="mark mark--bead${markState}"></span></button>
              </div>
              <div class="entry-body">
                <div class="entry-head tk-head"><span class="entry-name">${e.name}</span><span class="tk-price num">${n(e.price)} Rosaries</span></div>
                <div class="entry-meta"><span>${e.type}</span>${e.uncounted ? '<span class="flag-uncounted">Not counted</span>' : ''}${done ? '<span class="flag-done">Bought</span>' : ''}</div>
                ${blocked ? `<p id="${needsId}" class="entry-needs is-missing">${e.needs}</p>` : ''}${soldBy}
              </div>
            </li>`;
}

// soldBy(entry) and soldByNext(entry) return the "Sold by" markup for a row and for the Next to buy plate (P5-31);
// both default to nothing. bought: names of the entries marked as bought.
export function rosariesPage({ file, states, soldBy = () => '', soldByNext = () => '', bought: boughtNames = ['Sample shop entry one', 'Sample shop entry two', 'Sample shop entry five'], extraAfterNext = '' }) {
  const bought = new Set(boughtNames);
  const groups = SHOP;
  const all = groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g, bought: bought.has(it.name) })));
  const needed = all.filter((e) => !e.bought).reduce((s, e) => s + e.price, 0);
  const done = all.filter((e) => e.bought).length;
  const hiddenUnbought = all.filter((e) => !e.group.visited && !e.bought).length;
  const next = all.filter((e) => !e.bought && e.group.visited && !e.needs).sort((a, b) => a.step - b.step)[0];

  const rail = `          <aside class="plate plate--rail" aria-label="Rosaries still needed">
            <div class="rail-section">
              <h2 class="plate-heading">Still needed</h2>
              <div>
                <p class="tk-need" aria-live="polite"><span class="num">${n(needed)}</span></p>
                <p class="tk-need-label">Rosaries for everything you have not bought, including ${entries(hiddenUnbought)} in regions you have not visited.</p>
              </div>
              ${needleBar({ done, total: all.length, label: 'Bought' })}
              <p class="plate-help">The total follows what you tick and is worked out from the prices. You never type it. It counts entries you cannot buy yet too.</p>
            </div>
            <div class="toggles">${toggle('Show everything, spoilers included')}</div>
          </aside>`;

  const nextPlate = `            <div class="next-plate tk-next">
              <p class="next-label">Next to buy</p>
              <h2 class="next-name">${next.name}</h2>
              <div class="entry-meta next-meta"><span>${next.type}</span><span>${next.group.region}</span></div>
              <p class="tk-price-line">${n(next.price)} Rosaries. Buying it leaves ${n(needed - next.price)} still needed.</p>${soldByNext(next)}
              <p class="next-how">The first shop entry on the route that you can buy now and have not bought.</p>
              <div class="next-actions"><button type="button" class="button button--secondary">Mark as bought</button><a href="${next.group.href}">Open ${next.group.region}</a></div>
            </div>`;

  const list = groups
    .map((g, gi) => {
      const items = all.filter((e) => e.group === g);
      const doneHere = items.filter((e) => e.bought).length;
      const last = gi === groups.length - 1;
      const rowsHtml = g.visited
        ? items.map((e, i) => shopRow(e, i, `shop-${gi}`, soldBy(e))).join('\n')
        : hiddenRow(`${entries(items.length)} hidden until you visit this region. Their prices are in the total.`);
      // The Region name is the link (T31), as on the Route; there is no separate "Open region" link.
      return `            <section class="route-group tk-group${last ? ' is-last' : ''}" aria-labelledby="shop-${gi}">
              <div class="route-head">
                <div class="entry-rail"><span class="entry-thread" aria-hidden="true"></span></div>
                <div class="route-head-body">
                  <h3 class="route-name" id="shop-${gi}"><a href="${g.href}">${g.region}</a></h3>
                  <span class="route-meta"><span class="num">${g.visited ? `${doneHere} of ${items.length} bought` : 'Not visited'}</span></span>
                </div>
              </div>
              <ol class="entries">
${rowsHtml}
              </ol>
            </section>`;
    })
    .join('\n');

  return page({
    file,
    title: 'Rosaries',
    bodyAttr: 'rosaries',
    navCurrent: 'Rosaries',
    h1: 'Rosaries',
    intro: 'Tick the shop entries you have bought. The page adds up what the rest still costs.',
    main: `        <div class="layout layout--route">
${rail}
          <div class="main-column">
${nextPlate}
            <h2 class="list-heading list-heading--spaced">Shops by region</h2>
${list}
            <p class="route-legend plate-help">Tick an entry when you buy it. A bead is a Collectible and a knot is a Task. Entries marked Not counted are tracked here but do not add to the 100 percent count on Home.</p>
          </div>
        </div>`,
    states,
  });
}

export const ROSARY_STATES = [
  ['addendum-rosaries.html', 'Rosaries'],
  ['addendum-builds-saved.html', 'Builds'],
  ['addendum-header-six.html', 'Header'],
];

// ------------------------------------------------------------------ The header with six links

const HEADER_STATES = [
  ['addendum-header-six.html', 'Six links, option A'],
  ['addendum-header-wrap.html', 'Option W: two rows'],
  ['addendum-header-menu.html', 'Option M: Menu closed'],
  ['addendum-header-menu-open.html', 'Option M: Menu open'],
  ['addendum-builds-saved.html', 'Builds'],
  ['addendum-rosaries.html', 'Rosaries'],
];

function headerPage({ file, mode, heroClass, h1, intro, notes }) {
  const main = `        <div class="main-column" style="max-width:760px">
          <h2 class="section-heading">${notes.title}</h2>
${notes.body.map((t) => `          <p class="section-intro section-intro--wide">${t}</p>`).join('\n')}
        </div>`;
  return page({ file, title: h1, bodyAttr: 'header', navCurrent: 'Trackers', navMode: mode, heroClass, h1, intro, main, states: HEADER_STATES });
}

// ------------------------------------------------------------------ write everything

const files = {};

files['addendum-builds-new.html'] = buildsPage({ file: 'addendum-builds-new.html', crestId: 'c2', saved: {}, current: {}, status: 'none', states: BUILD_STATES });
files['addendum-builds-unsaved.html'] = buildsPage({ file: 'addendum-builds-unsaved.html', crestId: 'c2', saved: SAVED_BUILD, current: EDITED_BUILD, status: 'unsaved', states: BUILD_STATES });
files['addendum-builds-saved.html'] = buildsPage({ file: 'addendum-builds-saved.html', crestId: 'c2', saved: SAVED_BUILD, status: 'saved', states: BUILD_STATES });
files['addendum-builds-problems.html'] = buildsPage({ file: 'addendum-builds-problems.html', crestId: 'c2', saved: BROKEN_BUILD, status: 'saved', problemsOn: true, states: BUILD_STATES });
files['addendum-builds-limit-unknown.html'] = buildsPage({ file: 'addendum-builds-limit-unknown.html', crestId: 'c4', saved: {}, current: {}, status: 'none', states: BUILD_STATES });
files['addendum-builds-layout-unknown.html'] = buildsPage({ file: 'addendum-builds-layout-unknown.html', crestId: 'c3', states: BUILD_STATES });

files['addendum-rosaries.html'] = rosariesPage({ file: 'addendum-rosaries.html', states: ROSARY_STATES });

files['addendum-header-six.html'] = headerPage({
  file: 'addendum-header-six.html', mode: 'inline', heroClass: '', h1: 'Header, six links',
  intro: 'Option A as it stands: the last link reads Account on a phone, with the accessible name Account and backup.',
  notes: { title: 'What this page shows', body: [
    'At 1280px all six links sit on one row beside the logo. That holds from about 870px up. From about 640px to 870px they sit on one row under the logo, the way the four links do today.',
    'On a phone, option A is not enough for six links. At 390, 360 and 320px the links need two rows (the same at every width up to about 455px), and the second row runs over the top of the page title because the hero only reserves room for one. The same happens in a narrow band between 601px and about 625px, where the full label Account and backup is still used.',
    'Two ways out are shown on the next pages: option W keeps all six links visible on two rows, and option M puts them behind a Menu button. Neither is chosen here.'
  ] },
});
files['addendum-header-wrap.html'] = headerPage({
  file: 'addendum-header-wrap.html', mode: 'inline', heroClass: PHONE_HEADER, h1: 'Option W, two rows',
  intro: 'Keep six visible links. On a phone the links wrap to a second row and every hero starts lower.',
  notes: { title: 'What this page shows', body: [
    'Same six links. Below about 455px they wrap onto a second row, and the top padding of every hero grows from 124px to 168px so the title stays clear. No script. It changes css/components.css in two places: the hero padding on phones, and the width at which the shorter label Account starts (640px instead of 600px, so the 601 to 625px band fits one row too).',
    'Cost: every page title moves down by 44px on a phone, and the first screen shows less content. It also depends on measured widths: a seventh link or a longer label would need measuring again.'
  ] },
});
files['addendum-header-menu.html'] = headerPage({
  file: 'addendum-header-menu.html', mode: 'menu', heroClass: ' tablet-fix', h1: 'Option M, Menu closed',
  intro: 'On a phone the header shows the logo and a Menu button. The six links sit behind it.',
  notes: { title: 'What this page shows', body: [
    'On a phone the header is one short row: the logo and a Menu button. The button has aria-expanded and aria-controls; the six links open as a list under it, each at least 48px tall, and Escape closes it and returns focus to the button. The page the reader is on is marked in the list. No hero padding changes.',
    'Cost: one extra tap to move between pages, a small script and new CSS on all pages, and a decision that the menu breakpoint is 640px so the 601 to 625px band is covered too. Because the list has room, the label can be the full Account and backup, so option A is not needed under M.'
  ] },
});
files['addendum-header-menu-open.html'] = headerPage({
  file: 'addendum-header-menu-open.html', mode: 'menu-open', heroClass: ' tablet-fix', h1: 'Option M, Menu open',
  intro: 'The same page with the Menu open.',
  notes: { title: 'What this page shows', body: [
    'On a phone the header is one short row: the logo and a Menu button. The button has aria-expanded and aria-controls; the six links open as a list under it, each at least 48px tall, and Escape closes it and returns focus to the button. The page the reader is on is marked in the list. No hero padding changes.',
    'Cost: one extra tap to move between pages, a small script and new CSS on all pages, and a decision that the menu breakpoint is 640px so the 601 to 625px band is covered too. Because the list has room, the label can be the full Account and backup, so option A is not needed under M.'
  ] },
});

// Only write when run directly: _build-places.mjs imports the helpers above.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [name, html] of Object.entries(files)) writeFileSync(join(here, name), html);
  console.log(`wrote ${Object.keys(files).length} files`);
}
