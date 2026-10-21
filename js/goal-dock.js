// goal-dock.js: the Goal kept in view on every page except the Goal page itself. A small box fixed at the
// top-right corner: collapsed it is one line ("Your goal: name, 6 left"); open it lists everything the
// Goal still needs, in route order with the Goal last, each row with a done toggle.
//
// Same rules as the Goal page: the Goal is read and written only through loadGoal, setGoal and onGoalChange;
// the rows come only from pathTo; ticking goes only through setDone. The dock never enters done, visited or
// any count. Rows are shown in full whatever is Visited, because the player chose the Goal. No Goal (or a Goal
// the guide no longer has): no box at all.

import { loadData, pageHref } from './data.js';
import { configureProgress, loadProgress, setDone, onProgressChange, loadGoal, setGoal, onGoalChange } from './progress.js';
import { directMissingFor, pathTo } from './requirements.js';
import { listWithMore } from './render.js';
import { iconUrl, withIconFallback } from './icons.js';

const OPEN_KEY = 'silksong-guide:goal-dock-open:v1';
const POS_KEY = 'silksong-guide:goal-dock-pos:v1';
const DRAG_MIN = 5; // pixels the pointer must travel before a press on the header counts as a drag
const DESKTOP = '(min-width: 701px)'; // on a phone the box stays at the bottom, as designed

function onDesktop() {
  return Boolean(globalThis.matchMedia && globalThis.matchMedia(DESKTOP).matches);
}

// The place the player dragged it to, { x, y } in pixels from the top left of the window, or null for the
// default corner. A viewing convenience for this device, like open or collapsed; never Progress.
function readPosition() {
  try {
    const stored = JSON.parse(globalThis.localStorage.getItem(POS_KEY));
    if (stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)) return { x: stored.x, y: stored.y };
  } catch {
    // storage blocked or not JSON: the default corner
  }
  return null;
}

function writePosition(position) {
  try {
    if (position) globalThis.localStorage.setItem(POS_KEY, JSON.stringify(position));
    else globalThis.localStorage.removeItem(POS_KEY);
  } catch {
    // a per-viewer convenience only
  }
}

// A phone has no room to leave it open: it starts collapsed there, and opens on a tap.
function defaultOpen() {
  return !(globalThis.matchMedia && globalThis.matchMedia('(max-width: 700px)').matches);
}

function readOpen() {
  try {
    const stored = globalThis.localStorage.getItem(OPEN_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {
    // storage blocked: use the default
  }
  return defaultOpen();
}

function writeOpen(value) {
  try {
    globalThis.localStorage.setItem(OPEN_KEY, value ? '1' : '0');
  } catch {
    // a per-viewer convenience only
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    node.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) {
    if (child !== null && child !== undefined && child !== false) node.append(child);
  }
  return node;
}

export async function startGoalDock() {
  if (document.body.dataset.page === 'goal') return; // the page itself is the full view
  let data;
  try {
    data = await loadData();
  } catch {
    return; // the page already says the guide could not load
  }
  const { regions, items, dataVersion, sample } = data;
  configureProgress({ items, dataVersion, sample });

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const regionsById = new Map(regions.map((region) => [region.id, region]));
  const state = { done: new Set() };
  let open = readOpen();
  let position = readPosition(); // null = the default top-right corner

  const dock = el('aside', { id: 'goal-dock', class: 'goal-dock', 'aria-label': 'Your goal', hidden: true });
  document.body.append(dock);

  function nameOf(id) {
    const found = itemsById.get(id);
    return found ? found.name : id;
  }

  function currentView() {
    const goalId = loadGoal();
    const goal = goalId ? itemsById.get(goalId) : null;
    if (!goal) return null;
    if (state.done.has(goalId)) return { goal, rows: [], finished: true };
    const rows = pathTo(goalId, state.done, items, regions).map((row) => {
      const item = itemsById.get(row.id);
      const missing = row.available ? [] : directMissingFor(item.id, state.done, items, regions);
      const region = regionsById.get(item.regionId);
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        regionName: region ? region.name : item.regionId,
        regionId: item.regionId,
        available: row.available,
        isGoal: item.id === goalId,
        needs: missing.length ? `Needs ${listWithMore(missing.map(nameOf), 3)}` : null,
      };
    });
    return { goal, rows, finished: false };
  }

  function summary(view) {
    if (view.finished) return 'Done';
    return `${view.rows.length} left`;
  }

  function buildRow(row, firstAvailable) {
    const done = el(
      'button',
      {
        type: 'button',
        class: 'dock-done',
        'data-action': 'dock-toggle',
        'data-id': row.id,
        'aria-label': `Mark as done: ${row.name}`,
      },
      el('span', { class: 'dock-bead', 'aria-hidden': 'true' })
    );
    const icon = withIconFallback(el('img', { class: 'entry-icon', src: iconUrl(row), alt: '', width: 32, height: 32, loading: 'lazy', decoding: 'async' }), row);
    const name = el('span', { class: 'dock-row-name' }, icon, row.name);
    const meta = el('span', { class: 'dock-row-meta' });
    const region = el('a', { href: pageHref('region.html', { id: row.regionId }, sample) }, row.regionName);
    meta.append(region);
    if (row.isGoal) meta.append(' · Your goal');
    const lines = [name, meta];
    if (row.available) lines.push(el('span', { class: 'dock-row-flag' }, 'Available now'));
    else if (row.needs) lines.push(el('span', { class: 'dock-row-needs' }, row.needs));
    const classes = ['dock-row'];
    if (row.available) classes.push('dock-row--available');
    if (row === firstAvailable) classes.push('dock-row--next');
    return el('li', { class: classes.join(' ') }, done, el('div', { class: 'dock-row-text' }, ...lines));
  }

  // The elements are replaced on every render. Keep focus where the player was: on the same control, or,
  // when a ticked row left the list, on the control now at that place.
  function render() {
    const active = document.activeElement;
    const inside = active && dock.contains(active) ? active : null;
    const focusId = inside ? inside.dataset.id || null : null;
    const focusAction = inside ? inside.dataset.action || null : null;
    const toggleIdsBefore = [...dock.querySelectorAll('[data-action="dock-toggle"]')].map((node) => node.dataset.id);

    const view = currentView();
    document.body.classList.toggle('has-goal-dock', Boolean(view));
    if (!view) {
      dock.hidden = true;
      dock.replaceChildren();
      return;
    }
    dock.hidden = false;
    dock.classList.toggle('goal-dock--open', open);

    const head = el(
      'button',
      {
        type: 'button',
        class: 'dock-head',
        'data-action': 'dock-open',
        'aria-expanded': open ? 'true' : 'false',
        'aria-controls': 'goal-dock-body',
      },
      el('span', { class: 'dock-label' }, 'Your goal'),
      el('span', { class: 'dock-name' }, view.goal.name),
      el('span', { class: 'dock-count' }, summary(view)),
      el('span', { class: 'dock-chevron', 'aria-hidden': 'true' })
    );

    const body = el('div', { id: 'goal-dock-body', class: 'dock-body', hidden: !open });
    if (view.finished) {
      body.append(el('p', { class: 'dock-text' }, 'You finished this goal. Clear it to pick another.'));
    } else {
      const firstAvailable = view.rows.find((row) => row.available);
      body.append(el('ol', { class: 'dock-list' }, ...view.rows.map((row) => buildRow(row, firstAvailable))));
    }
    body.append(
      el(
        'div',
        { class: 'dock-actions' },
        el('a', { class: 'dock-link', href: pageHref('goal.html', {}, sample) }, 'Open the goal page'),
        el('button', { type: 'button', class: 'dock-link', 'data-action': 'dock-clear' }, 'Clear my goal'),
        position && onDesktop() ? el('button', { type: 'button', class: 'dock-link', 'data-action': 'dock-reset' }, 'Reset position') : null
      )
    );
    dock.replaceChildren(head, body);
    applyPosition();

    if (!inside) return;
    let target = null;
    if (focusAction === 'dock-toggle') {
      const toggles = dock.querySelectorAll('[data-action="dock-toggle"]');
      target = dock.querySelector(`[data-action="dock-toggle"][data-id="${CSS.escape(focusId)}"]`)
        || (toggles.length ? toggles[Math.min(Math.max(toggleIdsBefore.indexOf(focusId), 0), toggles.length - 1)] : null);
    } else if (focusAction) {
      target = dock.querySelector(`[data-action="${focusAction}"]`);
    }
    (target || dock.querySelector('[data-action="dock-open"]')).focus();
  }

  dock.addEventListener('click', async (event) => {
    if (event.target.closest('[data-action="dock-open"]')) {
      open = !open;
      writeOpen(open);
      render();
      return;
    }
    if (suppressClick) {
      suppressClick = false; // the press that ended a drag is not a click on the header
      return;
    }
    if (event.target.closest('[data-action="dock-reset"]')) {
      position = null;
      writePosition(null);
      applyPosition();
      render();
      return;
    }
    if (event.target.closest('[data-action="dock-clear"]')) {
      setGoal(null);
      announce('Goal cleared.');
      return;
    }
    const toggle = event.target.closest('[data-action="dock-toggle"]');
    if (!toggle) return;
    const item = itemsById.get(toggle.dataset.id);
    if (!item) return;
    try {
      await setDone(item.id, true);
      announce(`Marked as done: ${item.name}.`);
    } catch (error) {
      console.error(error);
      announce('That change could not be saved. Try again.');
    }
  });

  // ---- moving the box. It is position: fixed, so it stays where it is while the page scrolls.

  let suppressClick = false;

  // Puts the box at the dragged position, kept fully inside the window, or back in the CSS corner.
  function applyPosition() {
    if (!position || !onDesktop()) {
      dock.style.left = '';
      dock.style.top = '';
      dock.style.right = '';
      return;
    }
    const x = Math.min(Math.max(0, position.x), Math.max(0, innerWidth - dock.offsetWidth));
    const y = Math.min(Math.max(0, position.y), Math.max(0, innerHeight - Math.min(dock.offsetHeight, 48)));
    dock.style.left = x + 'px';
    dock.style.top = y + 'px';
    dock.style.right = 'auto';
  }

  function dragFrom(event) {
    if (!onDesktop() || event.button !== 0 || event.pointerType === 'touch') return;
    const head = event.target.closest('.dock-head');
    if (!head) return;
    const box = dock.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;

    function move(moveEvent) {
      if (!dragging && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < DRAG_MIN) return;
      if (!dragging) {
        dragging = true;
        dock.classList.add('goal-dock--dragging');
      }
      position = { x: box.left + moveEvent.clientX - startX, y: box.top + moveEvent.clientY - startY };
      applyPosition();
    }

    function end() {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', end);
      removeEventListener('pointercancel', end);
      if (!dragging) return;
      dock.classList.remove('goal-dock--dragging');
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0); // a drag that ends off the header sends no click
      writePosition(position);
      render(); // shows "Reset position"
    }

    addEventListener('pointermove', move);
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
  }

  dock.addEventListener('pointerdown', dragFrom);
  addEventListener('resize', applyPosition);

  dock.addEventListener('keydown', (event) => {
    // Alt + arrow keys on the header move the box, for people who do not use a mouse.
    const step = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[event.key];
    if (step && event.altKey && onDesktop() && event.target.closest('.dock-head')) {
      event.preventDefault();
      const box = dock.getBoundingClientRect();
      position = { x: box.left + step[0], y: box.top + step[1] };
      applyPosition();
      writePosition(position);
      return;
    }
    if (event.key === 'Escape' && open && dock.contains(document.activeElement)) {
      open = false;
      writeOpen(false);
      render();
    }
  });

  const progress = await loadProgress();
  state.done = progress.done;
  onProgressChange((next) => {
    state.done = next.done;
    render();
  });
  onGoalChange(() => render());
  render();
}

function announce(text) {
  const live = document.getElementById('announcer');
  if (!live) return;
  live.textContent = '';
  live.textContent = text;
}
