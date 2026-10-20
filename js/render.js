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

// "A, B and C", or "A, B, C and 2 more" when the list is longer than `max`. Long lists would wrap to
// many lines on a phone, so Home's Locked cards, entry requirement lines and the holding sentence share this.
export function listWithMore(names, max) {
  if (names.length <= max) return joinNames(names);
  return `${names.slice(0, max).join(', ')} and ${names.length - max} more`;
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

// "hero--picture" switches on the text band in css/components.css, which a hero without a picture does not need.
function heroClasses(locked, hasPicture) {
  return ['hero', locked ? 'hero--locked' : '', hasPicture ? 'hero--picture' : ''].filter(Boolean).join(' ');
}

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
    { class: heroClasses(locked, Boolean(image)) },
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
      // A row off the Route says so in words (not colour only) where other rows show their Step.
      entry.onRoute === false
        ? h('span', { class: 'entry-step' }, 'Not on the route')
        : h('span', { class: 'entry-step num' }, `Step ${entry.step}`)
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
      'A bead is a collectible. Most count toward your totals; a few are only tracked and do not. A knot is a task: it adds nothing by itself but opens something else. A dashed thread means something is still missing.'
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

// The one sentence for "holding you up", used on Home and in the Route rail so both read the same.
// item = { entries: [{ name, regionName }], regions: [name] }. Copy follows DESIGN.md section 6:
// "Blocks X and 1 more entry in <Region>", "Blocks the region <Region>".
// Up to two sentences, so none carries two "and" clauses:
//   regions  "Blocks the regions A, B, C and 8 more, with 54 entries in them."
//   entries  "Blocks X and 4 more entries in <Region>." (after a regions sentence: "Also blocks ...")
// Entries inside a blocked Region are counted into that Region's sentence and are not named again.
export function blocksText(item) {
  const inBlockedRegion = (entry) => item.regions.includes(entry.regionName);
  const covered = item.entries.filter(inBlockedRegion);
  const others = item.entries.filter((entry) => !inBlockedRegion(entry));

  const sentences = [];
  if (item.regions.length) {
    const one = item.regions.length === 1;
    let text = `Blocks the ${one ? 'region' : 'regions'} ${listWithMore(item.regions, 3)}`;
    if (covered.length) text += `, with ${pluralEntries(covered.length)} in ${one ? 'it' : 'them'}`;
    sentences.push(`${text}.`);
  }
  if (others.length) sentences.push(`${sentences.length ? 'Also blocks' : 'Blocks'} ${otherEntriesText(others)}.`);
  return sentences.join(' ');
}

// "X in <Region>", or "X and N more entries" (plus " in <Region>" when they all sit in one Region).
function otherEntriesText(entries) {
  const first = entries[0];
  const rest = entries.length - 1;
  if (rest === 0) return `${first.name} in ${first.regionName}`;
  const more = `${first.name} and ${rest} more ${rest === 1 ? 'entry' : 'entries'}`;
  return entries.every((entry) => entry.regionName === first.regionName) ? `${more} in ${first.regionName}` : more;
}

// The list used on Home and in the Route rail. items: [{ id, name, kind, entries, regions }]
// The mark is hollow (not dashed): a blocker is something the player can do now.
function holdingList(items) {
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
          h('p', { class: 'holding-text' }, blocksText(item))
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
    heading = 'Everything on the route is done';
    text = 'Every step on the route so far is marked done. Extras that are not on the route stay on their Region pages.';
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
      ? holdingList(view.holding)
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
        ? holdingList(view.holding)
        : h('p', { class: 'plate-help' }, 'Nothing is blocked right now.')
    )
  );
}

// The legend sits after the list (DESIGN.md section 6), on a phone too. It used to be the rail's last
// line, but the rail comes first on a phone, which put the legend above the list.
function routeLegend() {
  return h(
    'p',
    { class: 'plate-help route-legend' },
    'A bead is a collectible. Most count toward your totals; a few are only tracked and do not. A knot is a task: it adds nothing by itself but opens something else. A dashed thread means something is still missing.'
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
    ...view.groups.map((group, i) => routeGroup(group, i === view.groups.length - 1)),
    routeLegend()
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
        // The Region name is the link to its page (T31); the accessible name is the name itself.
        h('h2', { class: 'route-name', id: headingId }, h('a', { href: group.href }, group.name)),
        h('span', { class: 'route-meta' }, h('span', { class: 'num' }, range))
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
    // Sample mode keeps Progress apart and never syncs; say so before the buttons, so nobody wonders.
    view.sample
      ? h('p', { class: 'plate-text' }, 'Sample mode never syncs. Its progress stays on this device and is kept apart from your real Progress.')
      : null,
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
  ].filter(Boolean); // replaceChildren would print a null as text
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

// ------------------------------------------------------------------ trackers

// The Trackers page: a short hero, a row of tabs, one panel for the selected tab and a side plate.
// Built once. Returns the three elements renderTrackersBody fills.
export function renderTrackersShell(app) {
  const hero = h(
    'section',
    { class: 'hero hero--short' },
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-shade hero-shade--title' }),
    h(
      'div',
      { class: 'frame' },
      h('h1', { class: 'hero-title' }, 'Trackers'),
      h(
        'p',
        { class: 'hero-intro' },
        'Mark what you have, one type at a time. Each tab keeps its own count; the 100 percent count stays on Home.'
      )
    )
  );

  const tabs = h('div', { class: 'tk-tabs', role: 'tablist', 'aria-label': 'Trackers' });
  const main = h('div', { class: 'main-column' });
  const rail = h('aside', { class: 'plate plate--rail', 'aria-label': 'Plan and options' });
  app.replaceChildren(
    hero,
    h(
      'div',
      { class: 'frame' },
      h(
        'div',
        { class: 'content' },
        h('div', { class: 'start-thread start-thread--short', 'aria-hidden': 'true' }),
        tabs,
        h('div', { class: 'layout' }, main, rail)
      )
    )
  );
  return { tabs, main, rail };
}

// view: see runTrackersPage in trackers-page.js.
export function renderTrackersBody(parts, view) {
  parts.tabs.replaceChildren(...view.tabs.map(trackerTab));
  parts.main.replaceChildren(trackerPanel(view.panel));
  parts.rail.replaceChildren(
    h(
      'div',
      { class: 'rail-section' },
      h('h2', { class: 'plate-heading' }, 'Plan with what you have'),
      h(
        'ul',
        { class: 'holding-list' },
        h(
          'li',
          { class: 'holding-item' },
          h(
            'div',
            {},
            h('a', { class: 'holding-name', href: view.rosariesHref }, 'Rosaries'),
            h('p', { class: 'holding-text' }, 'Add up what the shop entries you have not bought still cost.')
          )
        ),
        h(
          'li',
          { class: 'holding-item' },
          h(
            'div',
            {},
            h('a', { class: 'holding-name', href: view.buildsHref }, 'Pick a build'),
            h('p', { class: 'holding-text' }, 'See the Crests you own, their slots and the Tools you own for each.')
          )
        )
      )
    ),
    h('div', { class: 'toggles' }, switchControl('show-all', 'Show everything, spoilers included', view.showAll)),
    h(
      'p',
      { class: 'plate-help' },
      'A bead is something you can obtain. A knot is a task: it adds nothing by itself but opens something else. Not counted means an entry is tracked here but does not add to the 100 percent count on Home.'
    )
  );
}

// One tab. Only the selected tab is in the tab order; the arrow keys move between tabs (trackers-page.js).
function trackerTab(tab) {
  let count;
  if (tab.state === 'empty') {
    count = 'Not in the guide yet';
  } else {
    count = [
      tab.state === 'complete' ? h('span', { class: 'state-dot state-dot--complete', 'aria-hidden': 'true' }) : null,
      h('span', { class: 'num' }, `${tab.done} of ${tab.total}`),
      tab.state === 'complete' ? h('span', { class: 'visually-hidden' }, ' complete') : null,
    ];
  }
  return h(
    'button',
    {
      type: 'button',
      role: 'tab',
      class: tab.state === 'complete' ? 'tk-tab is-complete' : 'tk-tab',
      id: `tab-${tab.id}`,
      'aria-selected': String(tab.selected),
      'aria-controls': 'tracker-panel',
      tabindex: tab.selected ? '0' : '-1',
      'data-action': 'select-tab',
      'data-tab': tab.id,
      'data-focus-key': `tab:${tab.id}`,
    },
    h('span', {}, tab.label),
    h('span', { class: 'tk-tab-count' }, count)
  );
}

function trackerPanel(panel) {
  const attrs = { class: 'tk-panel', role: 'tabpanel', id: 'tracker-panel', 'aria-labelledby': `tab-${panel.id}`, tabindex: '-1' };

  if (panel.empty) {
    return h(
      'section',
      attrs,
      h(
        'div',
        { class: 'plate' },
        h('h2', { class: 'plate-heading' }, 'Not in the guide yet'),
        h('p', { class: 'plate-text' }, 'Its entries ship in a later batch. Nothing here changes your totals until they do.')
      )
    );
  }

  const complete = panel.state === 'complete';
  let stateLine = null;
  if (complete) {
    stateLine = h('span', { class: 'tk-state' }, h('span', { class: 'state-dot state-dot--complete', 'aria-hidden': 'true' }), 'Complete');
  } else if (panel.state === 'nothing') {
    stateLine = h('span', { class: 'tk-state' }, 'Nothing marked yet');
  }

  // A finished tab is bronze whatever it holds. Otherwise the bar is silk when something here counts toward
  // 100 percent, and quiet (ash) when nothing does.
  const kind = complete || panel.hasCounted ? 'collectibles' : 'tasks';

  return h(
    'section',
    attrs,
    h('div', { class: 'tk-panel-head' }, h('h2', { class: 'tk-panel-title' }, panel.label), stateLine),
    h(
      'div',
      { class: 'tk-summary' },
      countBlock(kind, 'Done', { done: panel.done, total: panel.total }, { needle: !complete, complete })
    ),
    h('p', { class: 'tk-note' }, panel.note),
    ...panel.groups.map(trackerGroup)
  );
}

// One group of a tab: an optional sub-heading, then its entries on the thread. Each group is its own list,
// so a screen reader hears the list under the right heading.
function trackerGroup(group) {
  return h(
    'div',
    { class: 'tk-group' },
    group.heading ? h('h3', { class: 'tk-group-title' }, group.heading) : null,
    h('ol', { class: 'entries tk-list' }, ...group.rows.map(trackerRow), group.hiddenCount ? trackerHiddenRow(group) : null)
  );
}

// One entry on the thread. The Region name links to its page (T31, as on the Route), so there is no
// separate "Open region" link.
function trackerRow(entry) {
  const needsId = `needs-${entry.id}`;
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

  return h(
    'li',
    { class: entry.done ? 'entry is-done' : 'entry' },
    h('div', { class: 'entry-rail' }, h('span', { class: threadClasses.join(' '), 'aria-hidden': 'true' }), toggle),
    h(
      'div',
      { class: 'entry-body' },
      h('div', { class: 'entry-head' }, h('span', { class: 'entry-name' }, entry.name)),
      h(
        'div',
        { class: 'entry-meta' },
        h('span', {}, typeLabel(entry.type)),
        h('a', { class: 'region-link', href: entry.regionHref }, entry.regionName),
        entry.area ? h('span', {}, entry.area) : null,
        entry.uncounted ? h('span', { class: 'flag-uncounted' }, 'Not counted') : null,
        sourceLink(entry)
      ),
      entry.needs ? h('p', { id: needsId, class: 'entry-needs is-missing' }, entry.needs) : null
    )
  );
}

// Entries in Regions the player has not visited: a count, no names (the spoiler rule of the Region page).
function trackerHiddenRow(group) {
  const text = `${pluralEntries(group.hiddenCount)} hidden until you visit ${group.hiddenRegions === 1 ? 'its region' : 'their regions'}.`;
  return h(
    'li',
    { class: 'entry entry--hidden' },
    h(
      'div',
      { class: 'entry-rail' },
      h('span', { class: 'entry-thread', 'aria-hidden': 'true' }),
      h('span', { class: 'mark mark--bead mark--static mark--region', 'aria-hidden': 'true' })
    ),
    h('div', { class: 'entry-body' }, h('p', { class: 'entry-note' }, text))
  );
}

// ------------------------------------------------------------------ rosaries

// "3,350". A fixed locale, so the page reads the same on every device.
export function formatRosaries(n) {
  return n.toLocaleString('en-US');
}

// "500 Rosaries", "1 Rosary".
export function rosaryText(n) {
  return `${formatRosaries(n)} ${n === 1 ? 'Rosary' : 'Rosaries'}`;
}

// The Rosaries page: a short hero and the layout renderRosariesBody fills. Built once.
export function renderRosariesShell(app) {
  const hero = h(
    'section',
    { class: 'hero hero--short' },
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-shade hero-shade--title' }),
    h(
      'div',
      { class: 'frame' },
      h('h1', { class: 'hero-title' }, 'Rosaries'),
      h('p', { class: 'hero-intro' }, 'Tick the shop entries you have bought. The page adds up what the rest still costs.')
    )
  );

  const layout = h('div', { class: 'layout layout--route' });
  app.replaceChildren(
    hero,
    h('div', { class: 'frame' }, h('div', { class: 'content' }, h('div', { class: 'start-thread start-thread--short', 'aria-hidden': 'true' }), layout))
  );
  return layout;
}

// view: see runRosariesPage in rosaries-page.js. The rail is first in the document, as on the Route page, so
// the total comes before the list; CSS puts it on the right on a wide screen.
export function renderRosariesBody(layout, view) {
  if (view.empty) {
    layout.className = 'layout layout--side-only';
    layout.replaceChildren(
      h(
        'aside',
        { class: 'plate' },
        h('h2', { class: 'plate-heading' }, 'Not in the guide yet'),
        h('p', { class: 'plate-text' }, 'Shop entries and their prices ship in a later batch. Until then there is nothing to add up.'),
        h('p', {}, h('a', { href: view.trackersHref }, 'Back to all trackers'))
      )
    );
    return;
  }
  layout.className = 'layout layout--route';
  layout.replaceChildren(rosariesRail(view), rosariesMain(view));
}

function rosariesRail(view) {
  return h(
    'aside',
    { class: 'plate plate--rail route-rail', 'aria-labelledby': 'need-heading' },
    h(
      'div',
      { class: 'rail-section' },
      h('h2', { class: 'plate-heading', id: 'need-heading' }, 'Still needed'),
      h(
        'div',
        {},
        h('p', { class: view.need === 0 ? 'tk-need tk-need-zero' : 'tk-need' }, h('span', { class: 'num' }, formatRosaries(view.need))),
        h('p', { class: 'tk-need-label' }, view.needLabel)
      ),
      countBlock('collectibles', 'Bought', view.bought, { needle: !view.complete, complete: view.complete }),
      h(
        'p',
        { class: 'plate-help' },
        'The total follows what you tick and is worked out from the prices. You never type it. It counts entries you cannot buy yet too.'
      )
    ),
    h('div', { class: 'toggles' }, switchControl('show-all', 'Show everything, spoilers included', view.showAll))
  );
}

function rosariesMain(view) {
  return h(
    'div',
    { class: 'main-column' },
    nextToBuy(view),
    h('h2', { class: 'list-heading list-heading--spaced' }, 'Shops by region'),
    ...view.groups.map((group, i) => rosariesGroup(group, i === view.groups.length - 1)),
    h(
      'p',
      { class: 'route-legend plate-help' },
      'Tick an entry when you buy it. A bead is a Collectible and a knot is a Task. Entries marked Not counted are tracked here but do not add to the 100 percent count on Home.'
    )
  );
}

// The plate above the list. With something to buy it names the entry and has its own button, so the next
// purchase is one press away; otherwise it says why there is nothing to buy.
function nextToBuy(view) {
  const next = view.next;
  if (next) {
    return h(
      'section',
      { class: 'next-plate tk-next', 'aria-labelledby': 'next-buy-heading' },
      h('p', { class: 'next-label' }, 'Next to buy'),
      h('h2', { class: 'next-name', id: 'next-buy-heading' }, next.name),
      h(
        'div',
        { class: 'entry-meta next-meta' },
        h('span', {}, typeLabel(next.type)),
        h('span', {}, next.regionName),
        next.uncounted ? h('span', { class: 'flag-uncounted' }, 'Not counted') : null,
        sourceLink(next)
      ),
      h('p', { class: 'tk-price-line' }, `${rosaryText(next.price)}. Buying it leaves ${formatRosaries(next.leaves)} still needed.`),
      h('p', { class: 'next-how' }, 'The first shop entry in route order that you can buy now and have not bought.'),
      h(
        'div',
        { class: 'next-actions' },
        h(
          'button',
          {
            type: 'button',
            class: 'button button--secondary',
            'data-action': 'toggle-done',
            'data-id': next.id,
            'data-focus-key': 'next-buy',
          },
          'Mark as bought'
        ),
        h('a', { href: next.regionHref }, `Open ${next.regionName}`)
      )
    );
  }

  if (view.complete) {
    return h(
      'section',
      { class: 'tk-done-plate', 'aria-labelledby': 'next-buy-heading' },
      h('p', { class: 'next-label' }, 'Next to buy'),
      h('h2', { class: 'next-name', id: 'next-buy-heading', tabindex: '-1' }, 'Nothing left to buy'),
      h('p', { class: 'next-how' }, 'Every shop entry in the guide is marked as bought.')
    );
  }

  // Entries are left, but each one needs something else first.
  return h(
    'section',
    { class: 'next-plate tk-next', 'aria-labelledby': 'next-buy-heading' },
    h('p', { class: 'next-label' }, 'Next to buy'),
    h('h2', { class: 'next-name', id: 'next-buy-heading', tabindex: '-1' }, 'Nothing you can buy yet'),
    h('p', { class: 'next-how' }, 'Every shop entry that is left needs something else first. The entries below say what.')
  );
}

function rosariesGroup(group, isLast) {
  const headingId = `shop-${group.id}`;
  const hidden = group.hiddenNote
    ? h(
        'li',
        { class: 'entry entry--hidden' },
        h(
          'div',
          { class: 'entry-rail' },
          h('span', { class: 'entry-thread', 'aria-hidden': 'true' }),
          h('span', { class: 'mark mark--bead mark--static mark--region', 'aria-hidden': 'true' })
        ),
        h('div', { class: 'entry-body' }, h('p', { class: 'entry-note' }, group.hiddenNote))
      )
    : null;

  return h(
    'section',
    { class: isLast ? 'route-group tk-group is-last' : 'route-group tk-group', 'aria-labelledby': headingId },
    h(
      'div',
      { class: 'route-head' },
      h('div', { class: 'entry-rail' }, h('span', { class: 'entry-thread', 'aria-hidden': 'true' })),
      h(
        'div',
        { class: 'route-head-body' },
        h('h3', { class: 'route-name', id: headingId }, h('a', { href: group.href }, group.name)),
        h('span', { class: 'route-meta' }, h('span', { class: 'num' }, group.meta))
      )
    ),
    h('ol', { class: 'entries' }, ...group.rows.map(rosaryRow), hidden)
  );
}

// One shop entry: name and price on the first line, then type, flags and what it needs.
function rosaryRow(entry) {
  const needsId = `needs-${entry.id}`;
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

  return h(
    'li',
    { class: entry.done ? 'entry is-done' : 'entry' },
    h('div', { class: 'entry-rail' }, h('span', { class: threadClasses.join(' '), 'aria-hidden': 'true' }), toggle),
    h(
      'div',
      { class: 'entry-body' },
      h('div', { class: 'entry-head tk-head' }, h('span', { class: 'entry-name' }, entry.name), h('span', { class: 'tk-price num' }, rosaryText(entry.price))),
      h(
        'div',
        { class: 'entry-meta' },
        h('span', {}, typeLabel(entry.type)),
        entry.uncounted ? h('span', { class: 'flag-uncounted' }, 'Not counted') : null,
        entry.done ? h('span', { class: 'flag-done' }, 'Bought') : null,
        sourceLink(entry)
      ),
      entry.needs ? h('p', { id: needsId, class: 'entry-needs is-missing' }, entry.needs) : null
    )
  );
}

// ------------------------------------------------------------------ builds

// The Build picker: a short hero and the layout renderBuildsBody fills. Built once. Returns the two elements
// renderBuildsBody changes (the hero's intro line differs when no Crest is owned).
export function renderBuildsShell(app) {
  const intro = h('p', { class: 'hero-intro' });
  const hero = h(
    'section',
    { class: 'hero hero--short' },
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-shade hero-shade--title' }),
    h('div', { class: 'frame' }, h('h1', { class: 'hero-title' }, 'Builds'), intro)
  );

  const layout = h('div', { class: 'layout layout--route' });
  app.replaceChildren(
    hero,
    h('div', { class: 'frame' }, h('div', { class: 'content' }, h('div', { class: 'start-thread start-thread--short', 'aria-hidden': 'true' }), layout))
  );
  return { layout, intro };
}

// view: see runBuildsPage in builds-page.js. Like the Rosaries page, the rail (the Crest list) comes first in
// the document, so a keyboard or screen reader user chooses the Crest before reading its slots; CSS puts it on
// the right on a wide screen.
export function renderBuildsBody(parts, view) {
  parts.intro.textContent = view.intro;

  if (view.noCrest) {
    parts.layout.className = 'layout layout--route';
    parts.layout.replaceChildren(
      h(
        'div',
        { class: 'main-column' },
        h(
          'section',
          { class: 'plate bd-empty', 'aria-labelledby': 'bd-empty-heading' },
          h('h2', { class: 'plate-heading', id: 'bd-empty-heading' }, 'You do not own a Crest yet'),
          h('p', { class: 'plate-text' }, 'Mark a Crest as done in the Crests tracker. It then appears here with its slots and the Tools you own that could go in each.'),
          h('p', {}, h('a', { class: 'button button--primary', href: view.trackersHref }, 'Open the Crests tracker'))
        )
      )
    );
    return;
  }

  parts.layout.className = 'layout layout--route';
  parts.layout.replaceChildren(buildsRail(view), buildsMain(view.crest));
}

function buildsRail(view) {
  return h(
    'aside',
    { class: 'plate plate--rail route-rail', 'aria-label': 'Your Crests' },
    h(
      'div',
      { class: 'rail-section' },
      h('h2', { class: 'plate-heading' }, 'Your Crests'),
      h(
        'fieldset',
        { class: 'bd-fieldset' },
        h('legend', { class: 'visually-hidden' }, 'Choose a Crest'),
        h('ul', { class: 'tk-crests' }, ...view.crests.map(crestChoice))
      )
    ),
    h(
      'div',
      { class: 'rail-section' },
      h('p', { class: 'tk-rail-text' }, 'Tools and Silk Skills you own: ', h('strong', {}, String(view.ownedCount)), '. Each slot lists only what you have marked as done.'),
      h('p', { class: 'tk-rail-text' }, 'White slots take Silk Skills. Red, blue and yellow slots take Tools of that colour.'),
      h('p', { class: 'tk-rail-text' }, h('a', { href: view.trackersHref }, 'Open the Crests tracker'))
    )
  );
}

function crestChoice(crest) {
  const id = `crest-${crest.id}`;
  return h(
    'li',
    { class: 'tk-crest' },
    h('input', { type: 'radio', name: 'crest', id, value: crest.id, checked: crest.selected, 'data-action': 'pick-crest', 'data-focus-key': `crest:${crest.id}` }),
    h(
      'label',
      { for: id },
      h('span', { class: 'tk-crest-dot', 'aria-hidden': 'true' }),
      h(
        'span',
        {},
        h('span', { class: 'tk-crest-name' }, crest.name),
        h('span', { class: 'tk-crest-sub num' }, crest.sub),
        crest.saved ? h('span', { class: 'tk-crest-sub' }, 'Build saved') : null
      )
    )
  );
}

function buildsMain(crest) {
  const head = [
    h('h2', { class: 'tk-crest-title', id: 'crest-title', tabindex: '-1' }, crest.name),
    crest.meta ? h('p', { class: 'tk-crest-meta num' }, crest.meta) : null,
  ];

  if (crest.layoutUnknown) {
    return h(
      'div',
      { class: 'main-column' },
      h(
        'section',
        { 'aria-labelledby': 'crest-title' },
        ...head,
        h(
          'div',
          { class: 'plate bd-unknown' },
          h('h3', { class: 'plate-subheading' }, 'Not in the guide yet'),
          h('p', { class: 'plate-text' }, 'The slots for this Crest are not in the guide yet, so there is nothing to fill. You can still mark the Crest as done in the Crests tracker.')
        )
      )
    );
  }

  return h(
    'div',
    { class: 'main-column' },
    h(
      'section',
      { 'aria-labelledby': 'crest-title' },
      ...head,
      h('div', { class: 'bd-stack' }, openedSlots(crest.opened)),
      h('h2', { class: 'list-heading list-heading--spaced' }, 'Your Build'),
      h('div', { class: 'bd-stack' }, saveBar(crest.bar), crest.problems ? problemsCallout(crest.problems) : null),
      h('div', { class: 'tk-slots' }, ...crest.colours.map((colour, i) => slotSection(colour, i === crest.colours.length - 1)))
    )
  );
}

// ---- opened slots

function openedSlots(opened) {
  const intro = h('p', { class: 'plate-text' }, 'A Memory Locket opens an extra slot on a Crest. Say how many you opened on this one. Each colour has a limit.');
  if (!opened.limitKnown) {
    return h(
      'div',
      { class: 'plate bd-opened' },
      h('h3', { class: 'plate-subheading' }, 'Opened slots'),
      h('p', { class: 'plate-text' }, 'How many extra slots this Crest can open is not in the guide yet, so the page does not count opened slots for it.')
    );
  }
  return h(
    'div',
    { class: 'plate bd-opened' },
    h('h3', { class: 'plate-subheading' }, 'Opened slots'),
    intro,
    h('div', { class: 'os-grid' }, ...opened.rows.map(openedRow))
  );
}

function openedRow(row) {
  const nameId = `os-${row.colour}`;
  let control;
  if (row.stepper) {
    control = h(
      'div',
      { class: 'os-control', role: 'group', 'aria-labelledby': nameId },
      h(
        'button',
        {
          type: 'button',
          class: 'os-btn',
          'aria-label': `Open one fewer ${row.colour} slot`,
          disabled: !row.canDown,
          'data-action': 'step',
          'data-colour': row.colour,
          'data-dir': 'down',
          'data-focus-key': `step:${row.colour}:down`,
        },
        h('span', { 'aria-hidden': 'true' }, '−')
      ),
      h('output', { class: 'os-value num', for: nameId }, String(row.opened)),
      h(
        'button',
        {
          type: 'button',
          class: 'os-btn',
          'aria-label': `Open one more ${row.colour} slot`,
          disabled: !row.canUp,
          'data-action': 'step',
          'data-colour': row.colour,
          'data-dir': 'up',
          'data-focus-key': `step:${row.colour}:up`,
        },
        h('span', { 'aria-hidden': 'true' }, '+')
      )
    );
  } else {
    control = h('div', { class: 'os-control os-control--none', 'aria-hidden': 'true' }, '–');
  }
  return h(
    'div',
    { class: 'os-row' },
    h('span', { class: 'os-name', id: nameId }, row.label),
    control,
    h('p', { class: 'os-note' }, h('span', {}, row.note), ' ', h('span', { class: 'num' }, row.count))
  );
}

// ---- the save bar

// Three looks (docs/design/trackers/addendum-builds-*.html). The status line is not a live region of its own: the
// page script announces every change through #announcer, because this element is replaced on every render and a
// replaced live region is not reliably read out.
function saveBar(bar) {
  const dot = bar.state === 'saved' ? 'bd-dot bd-dot--saved' : 'bd-dot bd-dot--open';
  const buttons = [
    h(
      'button',
      { type: 'button', class: 'button button--primary', disabled: !bar.canSave, 'data-action': 'save', 'data-focus-key': 'save' },
      'Save this Build'
    ),
  ];
  if (bar.canUndo) {
    buttons.push(h('button', { type: 'button', class: 'button button--secondary', 'data-action': 'undo', 'data-focus-key': 'undo' }, 'Undo changes'));
  }
  if (bar.canRemove) {
    buttons.push(h('button', { type: 'button', class: 'button button--secondary', 'data-action': 'remove', 'data-focus-key': 'remove' }, 'Remove saved Build'));
  }
  return h(
    'div',
    { class: `bd-bar is-${bar.state}` },
    h(
      'p',
      { class: 'bd-status', id: 'bd-status', tabindex: '-1', 'data-focus-key': 'status' },
      h('span', { class: dot, 'aria-hidden': 'true' }),
      h('span', {}, h('strong', {}, bar.strong), ` ${bar.text}`)
    ),
    h('div', { class: 'button-row' }, ...buttons)
  );
}

function problemsCallout(problems) {
  return h(
    'div',
    { class: 'callout bd-problems', role: 'group', 'aria-labelledby': 'bd-problems-title' },
    h('p', { class: 'callout-title', id: 'bd-problems-title' }, problems.title),
    h('p', { class: 'callout-text' }, problems.text)
  );
}

// ---- the slots

function slotSection(colour, isLast) {
  const headingId = `slot-${colour.colour}`;
  return h(
    'section',
    { class: isLast ? 'route-group tk-slot is-last' : 'route-group tk-slot', 'aria-labelledby': headingId },
    h(
      'div',
      { class: 'route-head' },
      h('div', { class: 'entry-rail' }, h('span', { class: 'entry-thread', 'aria-hidden': 'true' })),
      h(
        'div',
        { class: 'route-head-body' },
        h('h3', { class: 'tk-slot-name', id: headingId }, colour.title),
        h('span', { class: 'tk-slot-meta num' }, colour.meta)
      )
    ),
    h('ol', { class: 'entries' }, ...colour.rows.map(slotRow))
  );
}

function slotRow(row) {
  const threadClasses = ['entry-thread'];
  const markParts = ['mark', 'mark--bead', 'mark--static'];
  if (row.problem) {
    threadClasses.push('is-blocked');
    markParts.push('is-blocked');
  } else if (row.filled) {
    threadClasses.push('is-clear');
    markParts.push('is-done');
  }
  const rail = h(
    'div',
    { class: 'entry-rail' },
    h('span', { class: threadClasses.join(' '), 'aria-hidden': 'true' }),
    h('span', { class: markParts.join(' '), 'aria-hidden': 'true' })
  );

  const problemId = `prob-${row.key}`;
  const problem = row.problem ? h('p', { id: problemId, class: 'entry-needs is-missing' }, row.problem) : null;

  // A saved id that has no slot any more: no select, its name, a tag and a way to take it out.
  if (row.overflow) {
    const labelId = `lab-${row.key}`;
    return h(
      'li',
      { class: 'entry' },
      rail,
      h(
        'div',
        { class: 'entry-body' },
        h('p', { class: 'bd-label', id: labelId }, row.name, h('span', { class: 'bd-tag' }, 'No slot for it')),
        problem,
        h(
          'div',
          { class: 'bd-inline' },
          h(
            'button',
            {
              type: 'button',
              class: 'button button--secondary button--small',
              'aria-describedby': labelId,
              'data-action': 'take-out',
              'data-colour': row.colour,
              'data-id': row.id,
              'data-focus-key': `out:${row.colour}:${row.id}`,
            },
            'Take out of this Build'
          )
        )
      )
    );
  }

  const selectId = `slot-${row.key}`;
  const select = h(
    'select',
    {
      id: selectId,
      'aria-describedby': row.problem ? problemId : null,
      'aria-invalid': row.problem ? 'true' : null,
      'data-action': 'pick-slot',
      'data-colour': row.colour,
      'data-index': row.index,
      'data-focus-key': `slot:${row.colour}:${row.index}`,
    },
    ...row.options.map((option) => h('option', { value: option.value, selected: option.selected, disabled: option.disabled }, option.label))
  );

  const item = row.item;
  return h(
    'li',
    { class: 'entry' },
    rail,
    h(
      'div',
      { class: 'entry-body' },
      h('label', { class: 'bd-label', for: selectId }, row.label),
      h('div', { class: 'bd-select' }, select),
      problem,
      item ? h('div', { class: 'entry-meta' }, h('span', {}, typeLabel(item.type)), sourceLink(item)) : null,
      item && item.effect ? h('p', { class: 'entry-how' }, item.effect) : null
    )
  );
}
