// render.js: builds the Region page's DOM from a plain "view" object (see regionView in main.js).
// It never reads Progress, never calls requirements.js and never fetches: main.js does that and hands
// over finished facts (done, available, next, needs text...). Text from data goes in through
// textContent only, never innerHTML.

const SVG_NS = 'http://www.w3.org/2000/svg';

// ---------------------------------------------------------------- tiny helpers

// h('div', { class: 'x', 'data-id': 'y' }, 'text', childElement) -> element.
// Attributes with a null, undefined or false value are skipped.
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (name === 'checked') el.checked = Boolean(value);
    else if (name === 'style') Object.assign(el.style, value);
    else el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  el.append(...children);
  return el;
}

// "mask-shard" -> "Mask shard" (type is a free label stored as a slug; interface copy is sentence case).
export function typeLabel(type) {
  const text = String(type || '').replace(/-/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

// ["A", "B", "C"] -> "A, B and C"
export function joinNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// ------------------------------------------------------------------ messages

// A plain page for errors and dead ends: one h1, what happened, what to do next.
// message = { heading, paragraphs: [string], links: [{ text, href }] }
export function renderMessage(app, message) {
  const links = (message.links || []).map((link) => h('a', { href: link.href }, link.text));
  app.replaceChildren(
    h(
      'div',
      { class: 'frame main-plain' },
      h(
        'div',
        { class: 'plate message' },
        h('h1', { class: 'plate-heading' }, message.heading),
        ...(message.paragraphs || []).map((text) => h('p', { class: 'plate-text' }, text)),
        links.length ? h('p', { class: 'plate-text' }, ...links.flatMap((a, i) => (i ? [' ', a] : [a]))) : null
      )
    )
  );
}

// ------------------------------------------------------------------- the shell

// The parts that do not change when the player marks something: hero, title, start thread.
// Built once per Region (and again only if the Region flips between Locked and Available).
// Returns the element that renderBody fills.
export function renderShell(app, view) {
  const locked = view.mode === 'locked';
  const intro = locked
    ? 'Locked. You cannot enter yet. Finish what is below and this region opens.'
    : view.region.summary;

  // A Locked Region never shows its picture: the hero is the plain gradient (less to spoil).
  const showImage = !locked && view.region.heroUrl;
  const image = showImage
    ? h('img', {
        class: 'hero-img',
        src: view.region.heroUrl,
        alt: '', // decorative: the Region name is the heading
        style: { objectPosition: view.region.heroPosition || '50% 40%' },
      })
    : null;

  const hero = h(
    'section',
    { class: locked ? 'hero hero--locked' : 'hero' },
    image,
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-shade hero-shade--title' }),
    h(
      'div',
      { class: 'frame' },
      h('a', { class: 'crumb', href: view.homeHref }, 'All regions'),
      h('h1', { class: 'hero-title' }, view.region.name),
      h('p', { class: 'hero-intro' }, intro)
    )
  );

  const layout = h('div', { class: 'layout' });
  const content = h(
    'div',
    { class: 'frame' },
    h(
      'div',
      { class: 'content' },
      h('div', { class: locked ? 'start-thread is-dashed' : 'start-thread', 'aria-hidden': 'true' }),
      layout
    )
  );

  app.replaceChildren(hero, content);
  return layout;
}

// -------------------------------------------------------------------- the body

// Replaces what changes with Progress: the entry list (or the Locked list) and the side plate.
export function renderBody(layout, view) {
  const column = mainColumn(view);
  const side = sidePlate(view);
  layout.className = column ? 'layout' : 'layout layout--side-only';
  layout.replaceChildren(...[column, side].filter(Boolean));
}

function mainColumn(view) {
  const parts = [];

  if (view.mode === 'locked') {
    parts.push(h('h2', { class: 'visually-hidden' }, 'What this region needs'));
    parts.push(lockedChain(view));
    if (view.showEntries) {
      parts.push(h('h2', { class: 'list-heading list-heading--spaced' }, 'Entries in this region'));
      parts.push(entryList(view.entries));
    }
  } else if (view.showEntries) {
    parts.push(h('h2', { class: 'visually-hidden' }, 'Entries in this region'));
    parts.push(entryList(view.entries));
  }

  return parts.length ? h('div', { class: 'main-column' }, ...parts) : null;
}

// ---- entries on the thread

function entryList(entries) {
  return h('ol', { class: 'entries' }, ...entries.map(entryRow));
}

function markClasses(entry) {
  const parts = ['mark', entry.kind === 'task' ? 'mark--knot' : 'mark--bead'];
  if (entry.done) parts.push('is-done');
  else if (!entry.available) parts.push('is-blocked');
  if (entry.isNext && !entry.done) parts.push('is-next');
  return parts.join(' ');
}

function entryRow(entry) {
  const needsId = `needs-${entry.id}`;
  const rowClasses = ['entry'];
  if (entry.done) rowClasses.push('is-done');
  if (entry.isNext) rowClasses.push('entry--next');

  const threadClasses = ['entry-thread'];
  if (entry.done) threadClasses.push('is-clear');
  if (!entry.available) threadClasses.push('is-blocked');

  const toggle = h(
    'button',
    {
      type: 'button',
      class: 'entry-mark',
      'aria-pressed': String(entry.done),
      'aria-label': entry.name,
      'aria-describedby': entry.needs ? needsId : null,
      'data-action': 'toggle-done',
      'data-id': entry.id,
      'data-focus-key': `done:${entry.id}`,
    },
    h('span', { class: markClasses(entry) })
  );

  const meta = h(
    'div',
    { class: 'entry-meta' },
    h('span', {}, typeLabel(entry.type)),
    entry.area ? h('span', {}, entry.area) : null,
    entry.missable ? h('span', { class: 'flag-missable' }, 'Can be missed') : null,
    entry.isNext && !entry.done ? h('span', { class: 'flag-next' }, 'Next on the route') : null
  );

  const body = h(
    'div',
    { class: 'entry-body' },
    h(
      'div',
      { class: 'entry-head' },
      h('span', { class: 'entry-name' }, entry.name),
      h('span', { class: 'entry-step num' }, `Step ${entry.step}`)
    ),
    meta,
    h('p', { class: 'entry-how' }, entry.how),
    entry.missable && entry.missableNote ? h('p', { class: 'entry-needs' }, entry.missableNote) : null,
    entry.needs
      ? h('p', { id: needsId, class: entry.needs.missing ? 'entry-needs is-missing' : 'entry-needs' }, entry.needs.text)
      : null
  );

  return h(
    'li',
    { class: rowClasses.join(' ') },
    h('div', { class: 'entry-rail' }, h('span', { class: threadClasses.join(' '), 'aria-hidden': 'true' }), toggle),
    body
  );
}

// ---- a Locked Region: what is missing, in route order, ending with the Region itself

function lockedChain(view) {
  const rows = view.chain.map((entry) => {
    const markParts = ['mark', 'mark--static', entry.kind === 'task' ? 'mark--knot' : 'mark--bead'];
    markParts.push(entry.done ? 'is-done' : 'is-blocked');

    const stateText = entry.done ? (entry.kind === 'task' ? 'Done' : 'Collected') : 'Not done yet';

    return h(
      'li',
      { class: entry.done ? 'entry is-done' : 'entry' },
      h(
        'div',
        { class: 'entry-rail' },
        h('span', { class: entry.done ? 'entry-thread is-clear' : 'entry-thread is-blocked', 'aria-hidden': 'true' }),
        h('span', { class: markParts.join(' '), 'aria-hidden': 'true' })
      ),
      h(
        'div',
        { class: 'entry-body' },
        h('span', { class: 'entry-name' }, entry.name),
        h('div', { class: 'entry-meta' }, h('span', {}, `${typeLabel(entry.type)} in ${entry.regionName}`)),
        h('p', { class: entry.done ? 'entry-state' : 'entry-state is-missing' }, stateText),
        entry.done ? null : h('p', { class: 'entry-link' }, h('a', { href: entry.regionHref }, `Go to ${entry.regionName}`))
      )
    );
  });

  const regionRow = h(
    'li',
    { class: 'entry entry-region' },
    h(
      'div',
      { class: 'entry-rail' },
      h('span', { class: 'mark mark--bead mark--static mark--region', 'aria-hidden': 'true' })
    ),
    h(
      'div',
      { class: 'entry-body' },
      h('span', { class: 'entry-name' }, view.region.name),
      h('p', { class: 'entry-note' }, 'Opens when the steps above are done.')
    )
  );

  return h('ol', { class: 'chain' }, ...rows, regionRow);
}

// ---- the side plate

function sidePlate(view) {
  if (view.noEntries) {
    return h(
      'aside',
      { class: 'plate' },
      h('h2', { class: 'plate-heading' }, 'Not in the guide yet'),
      h('p', { class: 'plate-text' }, 'Its entries ship in a later batch.')
    );
  }

  const toggles = h(
    'div',
    { class: 'toggles' },
    view.mode === 'open' ? switchControl('visited', 'I have visited this region', view.visited) : null,
    switchControl('show-all', 'Show everything, spoilers included', view.showAll)
  );

  if (!view.showEntries) {
    return h(
      'aside',
      { class: 'plate' },
      h('h2', { class: 'plate-heading' }, 'Its entries stay hidden'),
      h('p', { class: 'plate-text' }, 'They appear once you visit the region. Turn on show everything if you want to read ahead.'),
      toggles
    );
  }

  return h(
    'aside',
    { class: 'plate plate--counts' },
    h('h2', { class: 'plate-heading' }, 'Your thread here'),
    countBlock('collectibles', 'Collectibles', view.counts.collectibles),
    countBlock('tasks', 'Tasks', view.counts.tasks),
    toggles,
    h(
      'p',
      { class: 'plate-help' },
      'A bead is a collectible and counts toward your totals. A knot is a task: it adds nothing by itself but opens something else. A dashed thread means something is still missing.'
    )
  );
}

// A real checkbox with a label, drawn as a switch by CSS. main.js listens for "change".
function switchControl(action, label, checked) {
  return h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      class: 'switch-input',
      checked,
      'data-action': action,
      'data-focus-key': action,
    }),
    h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
    h('span', { class: 'switch-text' }, label)
  );
}

// "1 of 3" with the needle-and-thread bar under it.
function countBlock(kind, label, count) {
  const text = `${count.done} of ${count.total}`;
  const percent = count.total > 0 ? Math.min(100, Math.round((count.done / count.total) * 100)) : 0;

  const needle = svg(
    'svg',
    { class: 'bar-needle', width: 28, height: 18, viewBox: '0 0 28 18', 'aria-hidden': 'true', style: `left: calc(${percent}% - 22px)` },
    svg('path', { class: 'line', d: 'M3 9 H27' }),
    svg('ellipse', { class: 'eye', cx: 4.5, cy: 9, rx: 2.3, ry: 3.6 })
  );

  return h(
    'div',
    {},
    h('div', { class: `count-row count-row--${kind}` }, h('span', {}, label), h('span', { class: 'count-value num' }, text)),
    h(
      'div',
      {
        class: `bar bar--${kind}`,
        role: 'progressbar',
        'aria-label': `${label}: ${text}`,
        'aria-valuemin': 0,
        'aria-valuemax': count.total,
        'aria-valuenow': count.done,
      },
      h('div', { class: 'bar-track' }),
      h('div', { class: 'bar-fill', style: { width: `${percent}%` } }),
      needle
    )
  );
}
