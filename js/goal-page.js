// goal-page.js: the Goal page (<body data-page="goal">). The player picks one entry with "Make this my goal";
// this page lists everything it still needs, in Route order, with the Goal last (docs/CONTRACTS.md section 5,
// "Goal"; mockups in docs/design/goal/).
//
// Same split as the other pages: this file asks data.js, progress.js and requirements.js, turns the answers
// into a plain "view" object, and render.js draws it. main.js is loaded on this page too and does what every
// page does (sample banner, the sync line in the footer, the email sign-in link).
//
// The Goal is read and written only through loadGoal, setGoal and onGoalChange; the list comes only from
// pathTo; ticking a row goes only through setDone. The Goal never enters done, visited or any count.

import { loadData, pageHref } from './data.js';
import { configureProgress, loadProgress, setDone, onProgressChange, loadGoal, setGoal, onGoalChange } from './progress.js';
import { directMissingFor, pathTo, routeIds } from './requirements.js';
import { renderMessage, renderGoalShell, renderGoalBody, listWithMore } from './render.js';

run();

async function run() {
  const app = document.getElementById('app');
  try {
    await runGoalPage(app);
  } catch (error) {
    // A data bug throws on purpose (for example a cycle in `requires`); say so instead of a blank page.
    console.error(error);
    document.title = 'Something went wrong | Silksong guide';
    renderMessage(app, {
      heading: 'Something went wrong',
      paragraphs: [`The page could not be built: ${error.message}`, 'Reload the page. If it happens again, tell the person who maintains the guide.'],
    });
  }
}

async function runGoalPage(app) {
  let data;
  try {
    data = await loadData();
  } catch (error) {
    document.title = 'Guide data not loaded | Silksong guide';
    renderMessage(app, { heading: 'The guide could not be loaded', paragraphs: [error.message] });
    return;
  }
  const { regions, items, dataVersion, sample } = data;
  // Before loadGoal: sample mode keeps its Goal under its own key (docs/CONTRACTS.md section 3).
  configureProgress({ items, dataVersion, sample });
  document.title = 'Your goal | Silksong guide';

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const regionsById = new Map(regions.map((region) => [region.id, region]));
  // Only used to say "Not on the route" where a row is off it, as every other page does.
  const onRoute = routeIds(items, regions);
  const state = { done: new Set(), visited: new Set() };

  function nameOf(id) {
    const found = itemsById.get(id);
    return found ? found.name : id;
  }

  function regionNameOf(regionId) {
    const region = regionsById.get(regionId);
    return region ? region.name : regionId;
  }

  function entryInfo(item) {
    return {
      name: item.name,
      type: item.type,
      toolColor: item.toolColor,
      regionName: regionNameOf(item.regionId),
      regionHref: pageHref('region.html', { id: item.regionId }, sample),
    };
  }

  // What the page shows, by state: no Goal, a Goal the guide no longer has, a Goal that is done, or the list.
  function buildView() {
    const base = {
      routeHref: pageHref('route.html', {}, sample),
      trackersHref: pageHref('trackers.html', {}, sample),
    };
    const goalId = loadGoal();
    if (!goalId) return { ...base, mode: 'none' };

    const goalItem = itemsById.get(goalId);
    if (!goalItem) return { ...base, mode: 'retired' };
    if (state.done.has(goalId)) return { ...base, mode: 'done', goal: entryInfo(goalItem) };

    const path = pathTo(goalId, state.done, items, regions);
    // Only the first row that is Available now is stitched; every such row says "Available now"
    // (Athos, GOAL-4), so two independent requirements both read as things to do.
    const firstAvailable = path.find((row) => row.available);
    const rows = path.map((row) => {
      const item = itemsById.get(row.id);
      // Only what this row itself waits on. Everything earlier in the chain is already a row above it,
      // so the full chain would just repeat the list ("Needs A, B, C and 38 more").
      const missing = row.available ? [] : directMissingFor(item.id, state.done, items, regions);
      return {
        ...entryInfo(item),
        id: item.id,
        kind: item.kind,
        area: item.area || '',
        how: item.how,
        step: item.step,
        source: item.source,
        missable: item.missable === true,
        missableNote: item.missableNote || '',
        onRoute: onRoute.has(item.id),
        available: row.available,
        isNext: firstAvailable === row,
        isGoal: item.id === goalId,
        // Capped like the other pages: the nearest three by step, then "and N more".
        needs: missing.length ? `Needs ${listWithMore(missing.map(nameOf), 3)}` : null,
      };
    });
    return {
      ...base,
      mode: 'list',
      goal: entryInfo(goalItem),
      rows,
      availableCount: path.filter((row) => row.available).length,
    };
  }

  // The elements are replaced on every render, so put keyboard focus back. A row that leaves the list takes
  // its toggle with it: focus goes to the toggle now at that place in the list, or to the page's heading
  // when no row is left (the Goal was done, or cleared). Only when focus was inside the page already.
  function toggleKeys() {
    return [...app.querySelectorAll('[data-action="toggle-done"]')].map((el) => el.dataset.focusKey);
  }

  function render() {
    const active = document.activeElement;
    const key = active && active.dataset ? active.dataset.focusKey : null;
    const keysBefore = toggleKeys();
    renderGoalBody(parts, buildView());
    if (!key) return;

    const same = app.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
    if (same) {
      same.focus();
      return;
    }
    const toggles = app.querySelectorAll('[data-action="toggle-done"]');
    const target = key.startsWith('done:') && toggles.length
      ? toggles[Math.min(Math.max(keysBefore.indexOf(key), 0), toggles.length - 1)]
      : document.getElementById('goal-heading');
    if (target) target.focus();
  }

  const parts = renderGoalShell(app);

  const progress = await loadProgress();
  state.done = progress.done;
  state.visited = progress.visited;
  // Every change, including one that arrives from another device, comes through here.
  onProgressChange((next) => {
    state.done = next.done;
    state.visited = next.visited;
    render();
  });
  onGoalChange(() => render());

  app.addEventListener('click', async (event) => {
    if (event.target.closest('[data-action="clear-goal"]')) {
      setGoal(null);
      announce('Goal cleared.');
      return;
    }
    const button = event.target.closest('[data-action="toggle-done"]');
    if (!button) return;
    const item = itemsById.get(button.dataset.id);
    if (!item) return;
    // Marking an entry that is not Available is allowed: the guide follows the real game (contract section 3).
    const value = !state.done.has(item.id);
    try {
      await setDone(item.id, value);
      announce(`${value ? 'Marked as done' : 'Marked as not done'}: ${item.name}. ${leftText()}`);
    } catch (error) {
      console.error(error);
      announce('That change could not be saved. Try again.');
    }
  });

  // How many rows are left, for the live region. Worked out from the page's own view after the change.
  function leftText() {
    const view = buildView();
    if (view.mode === 'done') return 'Your goal is done.';
    if (view.mode !== 'list') return '';
    return `${view.rows.length} left, the goal included.`;
  }

  render();
}

function announce(text) {
  const live = document.getElementById('announcer');
  live.textContent = '';
  live.textContent = text;
}
