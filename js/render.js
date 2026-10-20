// render.js: builds the pages' DOM (Region, Home, Route, Account) from plain "view" objects made in main.js.
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

// The "Source" link that ends an entry's meta line. Many links share a page, so the name says
// which entry it is for. It opens in a new tab, hence rel="noopener noreferrer".
function sourceLink(entry) {
  if (!entry.source) return null;
  return h(
    'a',
    {
      class: 'source-link',
      href: entry.source,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': `Source for ${entry.name}`,
    },
    'Source'
  );
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
    entry.isNext && !entry.done ? h('span', { class: 'flag-next' }, 'Next on the route') : null,
    sourceLink(entry)
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
        h('div', { class: 'entry-meta' }, h('span', {}, `${typeLabel(entry.type)} in ${entry.regionName}`), sourceLink(entry)),
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

// "1 of 3" with the needle-and-thread bar under it. Options:
//   needle    draw the needle at the filled end (the Region card leaves it out)
//   complete  fill the thread in bronze instead of silk (a finished Region)
//   card      the smaller type of the Region card
function countBlock(kind, label, count, { needle = true, complete = false, card = false } = {}) {
  const text = `${count.done} of ${count.total}`;
  const percent = count.total > 0 ? Math.min(100, Math.round((count.done / count.total) * 100)) : 0;

  const needleSvg = needle
    ? svg(
        'svg',
        { class: 'bar-needle', width: 28, height: 18, viewBox: '0 0 28 18', 'aria-hidden': 'true', style: `left: calc(${percent}% - 22px)` },
        svg('path', { class: 'line', d: 'M3 9 H27' }),
        svg('ellipse', { class: 'eye', cx: 4.5, cy: 9, rx: 2.3, ry: 3.6 })
      )
    : null;

  const barClasses = ['bar', `bar--${kind}`];
  if (complete) barClasses.push('bar--complete');
  if (card) barClasses.push('bar--card');

  return h(
    'div',
    { class: card ? 'count-block count-block--card' : 'count-block' },
    h('div', { class: `count-row count-row--${kind}` }, h('span', {}, label), h('span', { class: 'count-value num' }, text)),
    h(
      'div',
      {
        class: barClasses.join(' '),
        role: 'progressbar',
        'aria-label': `${label}: ${text}`,
        'aria-valuemin': 0,
        'aria-valuemax': count.total,
        'aria-valuenow': count.done,
      },
      h('div', { class: 'bar-track' }),
      h('div', { class: 'bar-fill', style: { width: `${percent}%` } }),
      needleSvg
    )
  );
}

// ------------------------------------------------------------ holding you up

function pluralEntries(n) {
  return `${n} ${n === 1 ? 'entry' : 'entries'}`;
}

// "Blocks <entry> and 1 more entry in <Region>", "Blocks the region <Region>" (DESIGN.md section 6).
// item = { entries: [{ name, regionName }], regions: [name] }. The "rail" variant (Route page) is
// shorter and gives a count, because the rail is narrow.
export function blocksText(item, variant = 'full') {
  const regionPart = item.regions.length
    ? `the ${item.regions.length === 1 ? 'region' : 'regions'} ${joinNames(item.regions)}`
    : '';
  if (item.entries.length === 0) return `Blocks ${regionPart}.`;

  let entryPart;
  const first = item.entries[0];
  const rest = item.entries.length - 1;
  if (variant === 'rail') {
    entryPart = pluralEntries(item.entries.length);
  } else if (rest === 0) {
    entryPart = `${first.name} in ${first.regionName}`;
  } else if (item.entries.every((entry) => entry.regionName === first.regionName)) {
    entryPart = `${first.name} and ${rest} more ${rest === 1 ? 'entry' : 'entries'} in ${first.regionName}`;
  } else {
    entryPart = `${first.name} and ${rest} more ${rest === 1 ? 'entry' : 'entries'}`;
  }
  return regionPart ? `Blocks ${entryPart} and ${regionPart}.` : `Blocks ${entryPart}.`;
}

// The list used on Home and in the Route rail. items: [{ id, name, kind, entries, regions }]
// The mark is hollow (not dashed): a blocker is something the player can do now.
function holdingList(items, variant) {
  return h(
    'ul',
    { class: 'holding-list' },
    ...items.map((item) =>
      h(
        'li',
        { class: 'holding-item' },
        h('span', { class: `mark ${item.kind === 'task' ? 'mark--knot' : 'mark--bead'} holding-mark`, 'aria-hidden': 'true' }),
        h(
          'div',
          {},
          h('span', { class: 'holding-name' }, item.name),
          h('p', { class: 'holding-text' }, blocksText(item, variant))
        )
      )
    )
  );
}

// ---------------------------------------------------------------------- home

// Hero, and the place the body fills. Built once. Returns the element renderHomeBody fills.
export function renderHomeShell(app) {
  const hero = h(
    'section',
    { class: 'hero hero--short hero--home' },
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-shade hero-shade--title' }),
    h(
      'div',
      { class: 'frame' },
      h('h1', { class: 'hero-title' }, 'Every collectible.', h('br'), 'Every ending.'),
      h('p', { class: 'hero-intro' }, 'Mark what you have, see what comes next, and see what each locked region still needs.')
    )
  );

  const body = h('div', { class: 'content' });
  app.replaceChildren(hero, h('div', { class: 'frame' }, body));
  return body;
}

// view: see runHomePage in main.js.
export function renderHomeBody(body, view) {
  body.replaceChildren(
    h('div', { class: 'start-thread start-thread--short', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'layout layout--home' },
      h('div', { class: 'home-main' }, nextPlate(view), holdingSection(view)),
      totalsPlate(view.totals)
    ),
    regionsSection(view.regions)
  );
}

function nextPlate(view) {
  const actions = [h('a', { href: view.routeHref }, 'See the whole route')];

  if (view.next) {
    actions.push(h('a', { href: view.next.regionHref }, `Open ${view.next.regionName}`));
    return h(
      'section',
      { class: 'next-plate', 'aria-labelledby': 'next-heading' },
      h('span', { class: 'next-label' }, 'Next on the route'),
      h('h2', { class: 'next-name', id: 'next-heading' }, view.next.name),
      h(
        'div',
        { class: 'entry-meta next-meta' },
        h('span', {}, typeLabel(view.next.type)),
        h('span', {}, view.next.regionName),
        h('span', { class: 'num' }, `Step ${view.next.step}`),
        sourceLink(view.next)
      ),
      h('p', { class: 'next-how' }, view.next.how),
      h('p', { class: 'next-actions' }, ...actions)
    );
  }

  // Nothing to point at: say why and where to look instead.
  let heading = 'Nothing is available right now';
  let text = 'Finish what is holding you up, below, to open more of the route.';
  if (!view.hasEntries) {
    heading = 'Nothing in the guide yet';
    text = 'The guide has no entries yet.';
  } else if (view.allDone) {
    heading = 'Everything in the guide is done';
    text = 'Every entry that is in the guide so far is marked done.';
  }
  return h(
    'section',
    { class: 'next-plate', 'aria-labelledby': 'next-heading' },
    h('span', { class: 'next-label' }, 'Next on the route'),
    h('h2', { class: 'next-name', id: 'next-heading' }, heading),
    h('p', { class: 'next-how' }, text),
    h('p', { class: 'next-actions' }, ...actions)
  );
}

function holdingSection(view) {
  return h(
    'section',
    { 'aria-labelledby': 'holding-heading' },
    h('h2', { class: 'section-heading', id: 'holding-heading' }, 'What is holding you up'),
    h('p', { class: 'section-intro' }, 'The things you are missing that block the most entries or a whole region.'),
    view.holding.length
      ? holdingList(view.holding, 'full')
      : h('p', { class: 'section-intro holding-empty' }, 'Nothing is blocked right now.'),
    h('p', { class: 'holding-more' }, h('a', { href: view.routeHref }, 'See everything on the route'))
  );
}

function totalsPlate(totals) {
  return h(
    'aside',
    { class: 'plate plate--counts', 'aria-labelledby': 'thread-heading' },
    h('h2', { class: 'plate-heading', id: 'thread-heading' }, 'Your thread'),
    countBlock('collectibles', 'Collectibles', totals.collectibles),
    countBlock('tasks', 'Tasks', totals.tasks),
    totals.byType.length
      ? h(
          'div',
          {},
          h('h3', { class: 'type-heading' }, 'Collectibles by type'),
          h(
            'dl',
            { class: 'type-list' },
            ...totals.byType.map((row) =>
              h('div', { class: 'type-row' }, h('dt', {}, typeLabel(row.type)), h('dd', { class: 'num' }, `${row.done} of ${row.total}`))
            )
          )
        )
      : null
  );
}

function regionsSection(cards) {
  return h(
    'section',
    { class: 'regions', 'aria-labelledby': 'regions-heading' },
    h('h2', { class: 'section-heading section-heading--big', id: 'regions-heading' }, 'Regions'),
    h(
      'p',
      { class: 'section-intro section-intro--wide' },
      'A region opens when you meet what it needs. Entries in regions you have not visited stay hidden until you visit them or choose to show everything.'
    ),
    cards.length
      ? h('ul', { class: 'region-grid' }, ...cards.map((card) => h('li', {}, regionCard(card))))
      : h('p', { class: 'section-intro' }, 'The guide has no regions yet.')
  );
}

const CARD_LABELS = {
  complete: 'Complete',
  visited: 'Visited',
  available: 'Available',
  locked: 'Locked',
  empty: 'Not in the guide yet',
};

// One Region card, in exactly one of five states. card: see regionCard in main.js.
function regionCard(card) {
  const stateRow = h(
    'div',
    { class: 'card-state' },
    card.state === 'empty' ? null : h('span', { class: `state-dot state-dot--${card.state}`, 'aria-hidden': 'true' }),
    CARD_LABELS[card.state]
  );

  const parts = [stateRow, h('h3', { class: 'card-name' }, card.name)];

  if (card.state === 'complete' || card.state === 'visited') {
    // A Region with no Collectibles shows its Tasks, so the card still has a count to read.
    const useTasks = card.collectibles.total === 0;
    parts.push(
      useTasks
        ? countBlock('tasks', 'Tasks', card.tasks, { needle: false, card: true })
        : countBlock('collectibles', 'Collectibles', card.collectibles, { needle: false, card: true, complete: card.state === 'complete' })
    );
  } else if (card.state === 'available') {
    parts.push(h('p', { class: 'card-note' }, 'Not visited yet. Its entries are hidden.'));
  } else if (card.state === 'locked') {
    if (card.needs) parts.push(h('p', { class: 'card-needs' }, card.needs));
    parts.push(h('p', { class: 'card-note' }, 'Its entries stay hidden.'));
  } else {
    parts.push(h('p', { class: 'card-note' }, 'Its entries ship in a later batch.'));
  }
  if (card.hasNext) parts.push(h('p', { class: 'card-next' }, 'Next on the route is here'));

  const thumb = card.heroUrl
    ? h(
        'div',
        { class: 'card-thumb' },
        h('img', { src: card.heroUrl, alt: '', loading: 'lazy', style: { objectPosition: card.heroPosition } })
      )
    : null;

  const classes = `region-card region-card--${card.state}${card.hasNext ? ' region-card--next' : ''}`;
  const inner = [thumb, h('div', { class: 'card-body' }, ...parts)];
  // A Region with no entries has nothing to open, so its card is not a link.
  return card.state === 'empty' ? h('div', { class: classes }, ...inner) : h('a', { class: classes, href: card.href }, ...inner);
}

// --------------------------------------------------------------------- route

// Hero, and the layout renderRouteBody fills. Built once. Returns the layout element.
export function renderRouteShell(app) {
  const hero = h(
    'section',
    { class: 'hero hero--short' },
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-shade hero-shade--title' }),
    h(
      'div',
      { class: 'frame' },
      h('h1', { class: 'hero-title' }, 'Route'),
      h('p', { class: 'hero-intro' }, 'Every step across all regions, in order. Anything waiting on something else shows what it needs.')
    )
  );

  const layout = h('div', { class: 'layout layout--route' });
  app.replaceChildren(
    hero,
    h('div', { class: 'frame' }, h('div', { class: 'content' }, h('div', { class: 'start-thread start-thread--short', 'aria-hidden': 'true' }), layout))
  );
  return layout;
}

// view: see runRoutePage in main.js. The rail comes first in the document so keyboard users meet
// the filters before the list; CSS puts it on the right on a wide screen.
export function renderRouteBody(layout, view) {
  layout.replaceChildren(routeRail(view), routeList(view));
}

function routeRail(view) {
  return h(
    'aside',
    { class: 'plate plate--rail route-rail', 'aria-labelledby': 'filters-heading' },
    h('h2', { class: 'plate-heading', id: 'filters-heading' }, 'Show on the route'),
    h(
      'div',
      { class: 'toggles' },
      switchControl('only-now', 'Only what I can do now', view.onlyNow),
      switchControl('hide-done', 'Hide finished steps', view.hideDone),
      switchControl('show-all', 'Show everything, spoilers included', view.showAll)
    ),
    h(
      'section',
      { class: 'rail-section', 'aria-labelledby': 'rail-holding-heading' },
      h('h2', { class: 'plate-subheading', id: 'rail-holding-heading' }, 'Holding you up'),
      view.holding.length
        ? holdingList(view.holding, 'rail')
        : h('p', { class: 'plate-help' }, 'Nothing is blocked right now.')
    ),
    h(
      'p',
      { class: 'plate-help' },
      'A bead is a collectible and counts toward your totals. A knot is a task: it adds nothing by itself but opens something else. A dashed thread means something is still missing.'
    )
  );
}

function routeList(view) {
  if (!view.hasEntries) {
    return h('div', { class: 'main-column' }, h('p', { class: 'plate-text' }, 'The guide has no entries yet.'));
  }
  if (view.groups.length === 0) {
    return h('div', { class: 'main-column' }, h('p', { class: 'plate-text' }, 'No steps match these choices. Turn one off to see more.'));
  }
  return h(
    'div',
    { class: 'main-column route-list' },
    ...view.groups.map((group, i) => routeGroup(group, i === view.groups.length - 1))
  );
}

function routeGroup(group, isLast) {
  const range =
    group.firstStep === group.lastStep ? `Step ${group.firstStep}` : `Steps ${group.firstStep} to ${group.lastStep}`;
  const headingId = `group-${group.regionId}-${group.firstStep}`;

  const hidden = group.hiddenCount
    ? h(
        'li',
        { class: 'entry entry--hidden' },
        h(
          'div',
          { class: 'entry-rail' },
          h('span', { class: 'entry-thread', 'aria-hidden': 'true' }),
          h('span', { class: 'mark mark--bead mark--static mark--region', 'aria-hidden': 'true' })
        ),
        h(
          'div',
          { class: 'entry-body' },
          h(
            'p',
            { class: 'entry-note' },
            group.locked
              ? `${pluralEntries(group.hiddenCount)} hidden. They appear once this region is open and you visit it.`
              : `${group.rows.length ? 'And ' : ''}${pluralEntries(group.hiddenCount)} hidden until you visit this region.`
          )
        )
      )
    : null;

  return h(
    'section',
    { class: isLast ? 'route-group is-last' : 'route-group', 'aria-labelledby': headingId },
    h(
      'div',
      { class: 'route-head' },
      h('div', { class: 'entry-rail' }, h('span', { class: 'entry-thread', 'aria-hidden': 'true' })),
      h(
        'div',
        { class: 'route-head-body' },
        h('h2', { class: 'route-name', id: headingId }, group.name),
        h('span', { class: 'route-meta' }, h('span', { class: 'num' }, range), h('a', { href: group.href }, 'Open region'))
      )
    ),
    h('ol', { class: 'entries' }, ...group.rows.map(entryRow), hidden)
  );
}

// ---------------------------------------------------------------- sync status

// One sentence for a sync status from progress.js. Used by the footer line on every page and
// by the Account plate. The time is written out ("at 14:32") instead of "just now", because a
// line that never refreshes must not go stale.
export function syncText(status) {
  if (status.state === 'syncing') return 'Syncing your progress.';
  if (status.state === 'synced') {
    if (!status.at) return 'Synced with your account.';
    const time = new Date(status.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Synced with your account at ${time}.`;
  }
  if (status.state === 'error') {
    // progress.js already writes a full sentence, including that Progress is safe on this device.
    return status.message || 'Could not sync with your account. Your progress is saved on this device.';
  }
  return 'Saved on this device.';
}

// ------------------------------------------------------------------- account

// The Account page: a short hero and one column. The sign-in plate (rebuilt whenever its state
// changes) and the message line (never rebuilt, so its aria-live announcements are not lost).
// Returns { plate, message }.
export function renderAccountShell(app) {
  const hero = h(
    'section',
    { class: 'hero hero--short' },
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-shade hero-shade--title' }),
    h(
      'div',
      { class: 'frame' },
      h('h1', { class: 'hero-title' }, 'Account and backup'),
      h('p', { class: 'hero-intro' }, 'Your progress is saved on this device. Sign in to keep it in sync everywhere.')
    )
  );

  const plate = h('section', { class: 'plate', 'aria-labelledby': 'account-heading' });
  const message = h('p', { class: 'form-message', 'aria-live': 'polite' });
  const content = h(
    'div',
    { class: 'frame' },
    h(
      'div',
      { class: 'content' },
      h('div', { class: 'start-thread start-thread--short', 'aria-hidden': 'true' }),
      h('div', { class: 'account-column' }, plate, message)
    )
  );

  app.replaceChildren(hero, content);
  return { plate, message };
}

// kind: 'error' or 'info'. Empty text clears the line.
export function setAccountMessage(message, text, kind = 'info') {
  message.textContent = text;
  message.className = kind === 'error' ? 'form-message is-error' : 'form-message';
}

function countText(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

// view = { phase, busy, email, user: { email, displayName }, syncText, combined }
// phase: 'checking' | 'signed-out' | 'needs-email' | 'signed-in'
export function renderAccountPlate(plate, view) {
  const heading = (text) => h('h2', { class: 'plate-heading', id: 'account-heading' }, text);

  if (view.phase === 'checking') {
    plate.replaceChildren(heading('Account'), h('p', { class: 'plate-text' }, 'Checking whether you are signed in.'));
  } else if (view.phase === 'needs-email') {
    plate.replaceChildren(heading('Finish signing in'), ...needsEmailParts(view));
  } else if (view.phase === 'signed-in') {
    plate.replaceChildren(heading('Your account'), ...signedInParts(view));
  } else {
    plate.replaceChildren(heading('Sign in to sync'), ...signedOutParts(view));
  }
}

function emailForm(view, { label, action, buttonText }) {
  return h(
    'form',
    { 'data-action': action, novalidate: true },
    h('label', { class: 'field-label', for: 'email-in' }, label),
    h(
      'div',
      { class: 'field-row' },
      h('input', {
        class: 'field-input',
        id: 'email-in',
        name: 'email',
        type: 'email',
        autocomplete: 'email',
        placeholder: 'you@example.com',
        value: view.email,
        'data-focus-key': 'email',
      }),
      h(
        'button',
        { type: 'submit', class: 'button button--secondary', disabled: view.busy, 'data-focus-key': action },
        buttonText
      )
    )
  );
}

function signedOutParts(view) {
  return [
    h(
      'p',
      { class: 'plate-text' },
      'You can use the guide without an account. Signing in saves your progress online and combines it with what is already on this device.'
    ),
    h(
      'div',
      { class: 'button-row' },
      h(
        'button',
        {
          type: 'button',
          class: 'button button--primary',
          disabled: view.busy,
          'data-action': 'sign-in-google',
          'data-focus-key': 'sign-in-google',
        },
        'Continue with Google'
      )
      // "Continue with GitHub" is left out on purpose: GitHub sign-in is not enabled in the
      // Firebase project yet (docs/PHASE-0-CHECKLIST.md, item 6). Add the button back, with
      // data-action="sign-in-github", once it is turned on.
    ),
    h(
      'div',
      { class: 'plate-section--rule' },
      emailForm(view, { label: 'Or get a sign-in link by email', action: 'send-link', buttonText: 'Email me the link' })
    ),
  ];
}

// The link was opened on a device that does not remember the address it was sent to.
function needsEmailParts(view) {
  return [
    h(
      'p',
      { class: 'plate-text' },
      'This sign-in link was opened on a device that does not remember the address it was sent to. Enter that address to finish signing in.'
    ),
    emailForm(view, { label: 'Your email address', action: 'finish-email', buttonText: 'Finish sign-in' }),
  ];
}

function signedInParts(view) {
  const who = view.user.email || view.user.displayName;
  const combined = view.combined;
  return [
    h(
      'div',
      {},
      h(
        'p',
        { class: 'account-line' },
        h('span', { class: 'account-dot', 'aria-hidden': 'true' }),
        h('span', {}, who ? 'Signed in as ' : 'Signed in', who ? h('strong', {}, who) : null)
      ),
      h('p', { class: 'plate-help', style: { marginTop: '6px' } }, view.syncText)
    ),
    combined
      ? h(
          'div',
          { class: 'callout' },
          h('p', { class: 'callout-title' }, 'Progress combined'),
          h(
            'p',
            { class: 'callout-text' },
            `${countText(combined.localDone, 'entry was', 'entries were')} done on this device and ${combined.cloudDone} in your account. ` +
              `${combined.totalDone} ${combined.totalDone === 1 ? 'is' : 'are'} done now. ` +
              'Anything done on either side stayed done, and nothing was removed.'
          )
        )
      : null,
    h(
      'div',
      { class: 'button-row' },
      h(
        'button',
        {
          type: 'button',
          class: 'button button--secondary',
          disabled: view.busy,
          'data-action': 'sign-out',
          'data-focus-key': 'sign-out',
        },
        'Sign out'
      ),
      h('p', { class: 'plate-help' }, 'Signing out keeps your progress on this device.')
    ),
  ];
}
