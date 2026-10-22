// map-render.js: draws the Map page (<body data-page="map">). Like render.js, it never reads Progress, never calls
// requirements.js and never fetches: map-page.js does that and hands over a finished "view" object (see
// buildView in map-page.js). Text from data goes in through textContent only, never innerHTML.
//
// A small `h` helper is repeated here on purpose, so render.js (a large shared file) is not reopened for a page
// that only this file uses.

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (name === 'checked') el.checked = Boolean(value);
    else if (name === 'selected') el.selected = Boolean(value);
    else if (name === 'style') Object.assign(el.style, value);
    else el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

// "mask-shard" -> "Mask shard"
function typeLabel(type) {
  const text = String(type || '').replace(/-/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function switchControl(action, label, checked) {
  return h(
    'label',
    { class: 'switch' },
    h('input', { type: 'checkbox', class: 'switch-input', checked, 'data-action': action, 'data-focus-key': action }),
    h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
    h('span', { class: 'switch-text' }, label)
  );
}

// ------------------------------------------------------------------ the shell

// The parts that do not change while the player ticks things. Returns the elements renderMapBody fills.
export function renderMapShell(app) {
  const hero = h(
    'section',
    { class: 'hero hero--short' },
    h('div', { class: 'hero-shade' }),
    h('div', { class: 'hero-shade hero-shade--title' }),
    h(
      'div',
      { class: 'frame' },
      h('h1', { class: 'hero-title' }, 'Map'),
      h('p', { class: 'hero-intro' }, 'Where the entries of a Region are. Mark one as done and its pin leaves the map; it leaves every other page too.')
    )
  );
  const picker = h('div', { class: 'map-picker' });
  const main = h('div', { class: 'main-column' });
  const rail = h('aside', { class: 'plate plate--rail', 'aria-label': 'Selected entry and options' });
  app.replaceChildren(
    hero,
    h(
      'div',
      { class: 'frame' },
      h('div', { class: 'content' }, h('div', { class: 'start-thread start-thread--short', 'aria-hidden': 'true' }), picker, h('div', { class: 'layout' }, main, rail))
    )
  );
  return { picker, main, rail };
}

// ------------------------------------------------------------------ the body

export function renderMapBody(parts, view) {
  parts.picker.replaceChildren(regionPicker(view));
  parts.main.replaceChildren(...mainColumn(view));
  parts.rail.replaceChildren(...railColumn(view));
}

function regionPicker(view) {
  if (view.regions.length === 0) return h('span');
  return h(
    'div',
    { class: 'map-picker-row' },
    h('label', { class: 'map-picker-label', for: 'map-region' }, 'Region'),
    h(
      'select',
      { id: 'map-region', class: 'map-select', 'data-action': 'select-region', 'data-focus-key': 'select-region' },
      ...view.regions.map((region) =>
        h('option', { value: region.id, selected: region.id === view.regionId }, region.hasMap ? region.name : `${region.name} (no map yet)`)
      )
    )
  );
}

function mainColumn(view) {
  if (view.state === 'none') {
    return [
      h(
        'div',
        { class: 'plate' },
        h('h2', { class: 'plate-heading' }, 'Not in the guide yet'),
        h('p', { class: 'plate-text' }, 'No map has shipped yet. When one does, it shows up here with a pin for every entry in the Region.'),
        view.loadError ? h('p', { class: 'plate-text' }, 'The map file could not be loaded. Reload the page to try again.') : null
      ),
    ];
  }
  if (view.state === 'hidden') {
    return [
      h(
        'div',
        { class: 'plate' },
        h('h2', { class: 'plate-heading' }, 'This map stays hidden for now'),
        h('p', { class: 'plate-text' }, `A map shows where things are, so ${view.regionName} stays hidden until you have visited it. Turn on "Show everything" to read ahead.`)
      ),
    ];
  }
  if (view.state === 'no-map') {
    return [
      h(
        'div',
        { class: 'plate' },
        h('h2', { class: 'plate-heading' }, 'Not in the guide yet'),
        h('p', { class: 'plate-text' }, `${view.regionName} has no map yet.`),
        view.placing
          ? h('p', { class: 'plate-text' }, 'To place pins now, choose a picture from your computer in the panel on the side. It stays on your computer.')
          : null
      ),
    ];
  }
  return [mapFigure(view), entryList(view)];
}

// The picture with a pin on it for every entry that is not done. A pin is a real button, so the keyboard and a
// screen reader reach it; the list under the picture does the same job without the picture.
function mapFigure(view) {
  const stage = h(
    'div',
    { class: view.placing ? 'map-stage is-placing' : 'map-stage' },
    h('img', {
      class: 'map-image',
      src: view.map.src,
      alt: view.map.alt,
      decoding: 'async',
      'data-action': 'place-click',
    }),
    ...view.pins.map(pinButton)
  );
  const count = view.pins.length;
  const shown = view.showDone ? 'including entries you have done' : 'not done yet';
  return h(
    'figure',
    { class: 'map-figure' },
    stage,
    h(
      'figcaption',
      { class: 'map-caption' },
      h('span', {}, `${count} ${count === 1 ? 'pin' : 'pins'} on this map, ${shown}.`),
      h('span', { class: 'map-credit' }, view.map.credit)
    )
  );
}

function pinButton(pin) {
  const shape = pin.kind === 'task' ? 'map-dot map-dot--knot' : 'map-dot map-dot--bead';
  const classes = ['map-pin'];
  if (pin.done) classes.push('is-done');
  if (pin.selected) classes.push('is-selected');
  return h(
    'button',
    {
      type: 'button',
      class: classes.join(' '),
      style: { left: `${pin.x}%`, top: `${pin.y}%` },
      'aria-pressed': String(pin.selected),
      'aria-label': `${pin.name}${pin.done ? ', done' : ''}`,
      'data-action': 'select-pin',
      'data-id': pin.itemId,
      'data-focus-key': `pin:${pin.itemId}`,
    },
    h('span', { class: shape, 'aria-hidden': 'true' })
  );
}

// Every entry that has a pin (or, in placing mode, every entry of the Region), each with a way to select it.
function entryList(view) {
  if (view.entries.length === 0) {
    return h('p', { class: 'plate-text' }, 'No entry of this Region has a pin yet.');
  }
  return h(
    'section',
    { class: 'map-list', 'aria-labelledby': 'map-list-heading' },
    h('h2', { class: 'plate-heading', id: 'map-list-heading' }, 'On this map'),
    h(
      'ul',
      { class: 'map-entries' },
      ...view.entries.map((entry) =>
        h(
          'li',
          { class: entry.done ? 'map-entry is-done' : 'map-entry' },
          h(
            'button',
            {
              type: 'button',
              class: 'map-entry-button',
              'aria-pressed': String(entry.selected),
              'data-action': 'select-pin',
              'data-id': entry.id,
              'data-focus-key': `entry:${entry.id}`,
            },
            h('span', { class: entry.kind === 'task' ? 'map-dot map-dot--knot' : 'map-dot map-dot--bead', 'aria-hidden': 'true' }),
            h('span', { class: 'map-entry-name' }, entry.name),
            entry.done ? h('span', { class: 'map-entry-state' }, 'Done') : null,
            view.placing ? h('span', { class: 'map-entry-state' }, entry.placed ? 'Placed' : 'Not placed') : null
          )
        )
      )
    )
  );
}

// ------------------------------------------------------------------ the rail

function railColumn(view) {
  const sections = [];
  sections.push(selectedPlate(view));
  sections.push(
    h(
      'div',
      { class: 'toggles' },
      switchControl('show-done', 'Show entries I have done', view.showDone),
      view.placing ? null : switchControl('show-all', 'Show everything, spoilers included', view.showAll)
    )
  );
  if (view.placing) sections.push(placerPanel(view));
  sections.push(
    h(
      'p',
      { class: 'plate-help' },
      'A bead is something you can obtain. A knot is a task. A pin leaves the map when you mark its entry as done, on this page or any other.'
    )
  );
  return sections;
}

function selectedPlate(view) {
  const entry = view.selected;
  if (!entry) {
    return h('div', { class: 'rail-section' }, h('h2', { class: 'plate-heading' }, 'Selected entry'), h('p', { class: 'plate-text' }, 'Choose a pin or an entry to see what it is.'));
  }
  return h(
    'div',
    { class: 'rail-section' },
    h('h2', { class: 'plate-heading' }, 'Selected entry'),
    h(
      'div',
      { class: 'map-selected' },
      h('p', { class: 'map-selected-name' }, entry.name),
      h('p', { class: 'plate-text' }, [typeLabel(entry.type), entry.area].filter(Boolean).join(' · ')),
      h('p', { class: 'plate-text' }, entry.how),
      entry.needs ? h('p', { class: 'plate-text map-needs' }, entry.needs) : null,
      entry.available && !entry.done ? h('p', { class: 'plate-text' }, 'Available now') : null,
      h(
        'p',
        { class: 'plate-text' },
        h('a', { href: entry.source, rel: 'noopener', target: '_blank' }, 'Source')
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'map-done',
          'aria-pressed': String(entry.done),
          'data-action': 'toggle-done',
          'data-id': entry.id,
          'data-focus-key': `done:${entry.id}`,
        },
        entry.done ? 'Done. Press to mark as not done' : 'Mark as done'
      )
    )
  );
}

// The tool that writes data/map.json (docs/MAP-PROPOSAL.md, "Placing Pins"). Only with ?place in the address.
function placerPanel(view) {
  const placer = view.placer;
  const target = view.selected;
  return h(
    'div',
    { class: 'rail-section map-placer' },
    h('h2', { class: 'plate-heading' }, 'Place pins'),
    h(
      'p',
      { class: 'plate-text' },
      target
        ? `Click the map to put ${target.name} there. Click again to move it.`
        : 'Choose an entry in the list, then click the map to put it there.'
    ),
    h(
      'label',
      { class: 'map-file' },
      h('span', {}, 'Try a picture from your computer'),
      h('input', { type: 'file', accept: 'image/*', 'data-action': 'local-image', 'data-focus-key': 'local-image' })
    ),
    h('p', { class: 'plate-help' }, placer.imageHint),
    target && placer.targetPlaced
      ? h('button', { type: 'button', class: 'map-tool', 'data-action': 'remove-pin', 'data-id': target.id, 'data-focus-key': 'remove-pin' }, `Remove the pin of ${target.name}`)
      : null,
    h(
      'div',
      { class: 'map-tools' },
      h('button', { type: 'button', class: 'map-tool', 'data-action': 'copy-json', 'data-focus-key': 'copy-json' }, 'Copy map.json'),
      h('button', { type: 'button', class: 'map-tool', 'data-action': 'download-json', 'data-focus-key': 'download-json' }, 'Download map.json')
    ),
    h('label', { class: 'visually-hidden', for: 'map-json' }, 'The text of map.json'),
    h('textarea', { id: 'map-json', class: 'map-json', readonly: true, rows: 10, spellcheck: 'false' }, placer.json),
    h('p', { class: 'plate-help' }, 'This page saves nothing. Put the text in data/map.json and the picture at the path it names, then commit both.')
  );
}
