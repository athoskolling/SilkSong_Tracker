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
    else if (name === 'disabled') el.disabled = Boolean(value);
    else if (name === 'style') Object.assign(el.style, value);
    else el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

// The zoom steps are a share of the window's width. 1 = the whole map fits the window. The biggest step is
// about the picture's own size on a wide screen; more would only make it blurry.
export const ZOOM_STEPS = [1, 1.5, 2, 3];

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

// The parts that never change. Returns the element renderMapBody fills.
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
      h('p', { class: 'hero-intro' }, 'The whole of Pharloom on one map, and one map for each Region.')
    )
  );
  const body = h('div', { class: 'frame map-body' });
  app.replaceChildren(hero, h('div', { class: 'main-plain' }, body));
  return body;
}

// ------------------------------------------------------------------ the body

// `view` is described in map-page.js. Everything is rebuilt, so keyboard focus is put back by its data-focus-key.
export function renderMapBody(body, view) {
  const focused = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-focus-key');
  const children = [controls(view)];
  if (view.error) children.push(notice('The map could not be loaded', view.error));
  else if (!view.hasMap) children.push(notice('Not in the guide yet', 'There is no map to show yet.'));
  else if (view.mode === 'full') children.push(fullMap(view));
  else children.push(regionMap(view));
  if (view.hasMap && view.credit) children.push(h('p', { class: 'map-credit' }, view.credit));
  body.replaceChildren(...children);
  if (focused) {
    const again = body.querySelector(`[data-focus-key="${focused}"]`);
    if (again) again.focus();
  }
  if (view.hasMap && view.mode === 'full' && view.full.shown) applyMapZoom(body, view.full);
}

function notice(heading, text) {
  return h('section', { class: 'plate' }, h('h2', { class: 'plate-heading' }, heading), h('p', { class: 'plate-text' }, text));
}

function controls(view) {
  const tab = (mode, label) =>
    h('button', { type: 'button', class: 'button button--secondary button--small map-tab', 'aria-pressed': view.mode === mode, 'data-action': 'show-mode', 'data-mode': mode, 'data-focus-key': `mode-${mode}` }, label);
  return h(
    'div',
    { class: 'map-controls' },
    h('div', { class: 'map-tabs', role: 'group', 'aria-label': 'Which map' }, tab('full', 'Full map'), tab('regions', 'By Region')),
    switchControl('show-all', 'Show everything, spoilers included', view.showAll)
  );
}

// ------------------------------------------------------------------ the full map

function fullMap(view) {
  const full = view.full;
  if (!full.shown) {
    return h(
      'section',
      { class: 'plate' },
      h('h2', { class: 'plate-heading' }, 'The full map shows every Region'),
      h('p', { class: 'plate-text' }, 'That includes Regions you have not reached yet, with their names and shapes. Open the By Region tab for one map at a time, or show the whole thing.'),
      h('div', { class: 'button-row' }, h('button', { type: 'button', class: 'button button--primary', 'data-action': 'reveal-full', 'data-focus-key': 'reveal-full' }, 'Show the full map'))
    );
  }
  const canvasChildren = [h('img', { class: 'map-image', src: full.src, alt: full.alt, width: full.width, height: full.height, decoding: 'async', draggable: 'false' })];
  if (full.highlight) {
    const box = full.highlight;
    canvasChildren.push(
      h('div', { class: 'map-highlight', 'data-highlight': '', style: { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` } })
    );
  }
  const stage = h(
    'div',
    { class: 'map-stage', tabindex: '0', role: 'region', 'aria-label': 'Map of Pharloom. Scroll or use the arrow keys to move around.' },
    h('div', { class: 'map-canvas' }, canvasChildren)
  );
  enableDragPan(stage);
  const toolbar = h(
    'div',
    { class: 'map-toolbar' },
    h('button', { type: 'button', class: 'button button--secondary button--small', 'data-action': 'zoom-out', 'data-zoom': 'out', 'data-focus-key': 'zoom-out' }, 'Zoom out'),
    h('button', { type: 'button', class: 'button button--secondary button--small', 'data-action': 'zoom-in', 'data-zoom': 'in', 'data-focus-key': 'zoom-in' }, 'Zoom in'),
    h('button', { type: 'button', class: 'button button--secondary button--small', 'data-action': 'zoom-fit', 'data-focus-key': 'zoom-fit' }, 'Fit to the window'),
    h('span', { class: 'map-zoom-label', 'data-zoom-label': '', role: 'status' }, ''),
    h('a', { href: full.src, target: '_blank', rel: 'noopener' }, 'Open the picture in a new tab')
  );
  const caption = full.highlightName
    ? h('p', { class: 'map-caption' }, `The outlined box is ${full.highlightName}, as the Region map cuts it.`)
    : h('p', { class: 'map-caption' }, 'Drag the map to move it, or scroll. The small round marks are the game’s own markers.');
  return h('figure', { class: 'map-figure' }, toolbar, stage, caption);
}

// Sets the zoom without rebuilding the page, so the window keeps its place. Called after a render and on every
// zoom button. The canvas is `zoom` times the window's width.
export function applyMapZoom(body, full) {
  const stage = body.querySelector('.map-stage');
  const canvas = body.querySelector('.map-canvas');
  if (!stage || !canvas) return;
  const before = {
    x: stage.scrollWidth ? (stage.scrollLeft + stage.clientWidth / 2) / stage.scrollWidth : 0,
    y: stage.scrollHeight ? (stage.scrollTop + stage.clientHeight / 2) / stage.scrollHeight : 0,
  };
  const step = ZOOM_STEPS[full.zoom];
  canvas.style.width = `${step * 100}%`;
  stage.classList.toggle('is-zoomed', step > 1);
  // Keep the same middle point in view while the picture grows or shrinks.
  stage.scrollLeft = before.x * stage.scrollWidth - stage.clientWidth / 2;
  stage.scrollTop = before.y * stage.scrollHeight - stage.clientHeight / 2;
  const label = body.querySelector('[data-zoom-label]');
  if (label) label.textContent = step === 1 ? 'Fitted' : `Zoom ${Math.round(step * 100)}%`;
  for (const button of body.querySelectorAll('[data-zoom]')) {
    button.disabled = button.getAttribute('data-zoom') === 'in' ? full.zoom >= ZOOM_STEPS.length - 1 : full.zoom <= 0;
  }
}

// Scrolls the window so the highlighted box is in the middle (the "Show on the full map" link).
export function scrollToHighlight(body) {
  const stage = body.querySelector('.map-stage');
  const box = body.querySelector('[data-highlight]');
  if (!stage || !box) return;
  const left = box.offsetLeft + box.offsetWidth / 2 - stage.clientWidth / 2;
  const top = box.offsetTop + box.offsetHeight / 2 - stage.clientHeight / 2;
  stage.scrollTo({ left: Math.max(0, left), top: Math.max(0, top), behavior: 'instant' });
}

// Drag to pan with a mouse or a pen. A touch screen pans with its own scrolling, and the keyboard with the arrow
// keys, so nothing here is the only way to move.
function enableDragPan(stage) {
  let start = null;
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.button !== 0 || !stage.classList.contains('is-zoomed')) return;
    start = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (event) => {
    if (!start) return;
    stage.scrollLeft = start.left - (event.clientX - start.x);
    stage.scrollTop = start.top - (event.clientY - start.y);
  });
  const stop = () => {
    start = null;
    stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
}

// ------------------------------------------------------------------ the Region maps

function regionMap(view) {
  const picker = h(
    'div',
    { class: 'map-picker-row' },
    h('label', { class: 'map-picker-label', for: 'map-region' }, 'Region'),
    h(
      'select',
      { class: 'map-select', id: 'map-region', 'data-action': 'select-region', 'data-focus-key': 'select-region' },
      view.regions.map((region) => h('option', { value: region.id, selected: region.id === view.selectedId }, region.name))
    )
  );
  const parts = [h('div', { class: 'map-controls' }, picker)];
  const selected = view.selected;
  if (!selected) {
    parts.push(notice('Not in the guide yet', 'There is no map for this Region yet.'));
  } else if (!selected.revealed) {
    parts.push(
      h(
        'section',
        { class: 'plate' },
        h('h2', { class: 'plate-heading' }, `${selected.name} stays hidden for now`),
        h('p', { class: 'plate-text' }, 'A Region map shows its shape and where its places are, so it stays hidden until the Region is open and Visited. Turn on "Show everything" to read ahead.')
      )
    );
  } else {
    parts.push(
      h(
        'figure',
        { class: 'map-figure' },
        h('div', { class: 'map-stage' }, h('div', { class: 'map-canvas' }, h('img', { class: 'map-image', src: selected.src, alt: selected.alt, width: selected.width, height: selected.height, decoding: 'async' }))),
        h(
          'div',
          { class: 'map-links' },
          h('a', { href: selected.src, target: '_blank', rel: 'noopener' }, 'Open this picture in a new tab'),
          h('button', { type: 'button', class: 'button button--secondary button--small', 'data-action': 'locate-region', 'data-region-id': selected.id, 'data-focus-key': 'locate-region' }, 'Show on the full map')
        )
      )
    );
  }
  return h('div', {}, ...parts);
}
