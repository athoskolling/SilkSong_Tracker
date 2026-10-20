// trackers-page.js: the Trackers page (<body data-page="trackers">). Entries are grouped into tabs by
// their `type`; each tab has its own done and total, counted or not.
//
// Same split as the other pages: this file asks data.js, progress.js and requirements.js, turns the
// answers into a plain "view" object, and render.js draws it (docs/CONTRACTS.md section 5).
// main.js is loaded on this page too, and does what every page does (sample banner, the sync line in
// the footer, the email sign-in link).

import { loadData, pageHref } from './data.js';
import { configureProgress, loadProgress, setDone, onProgressChange } from './progress.js';
import { isAvailable, missingFor, isRegionAvailable, isCounted } from './requirements.js';
import { renderMessage, renderTrackersShell, renderTrackersBody, listWithMore } from './render.js';

// Which `type` goes on which tab. THIS IS A PROPOSAL, awaiting Athos (docs/CONTRACTS.md section 8,
// "Which Tracker each type goes on"). It is the only place the grouping is written, so changing it is
// one edit here. A type that is in no list is not shown on this page (for example mask-shard,
// spool-fragment, silk-heart, needle-upgrade, crafting-kit-upgrade, tool-pouch-upgrade, boss, quest).
// `relic` waits for the Mementos and Equipment sheet; Equipment will gain the types that sheet names.
const TABS = [
  { id: 'crests', label: 'Crests', types: ['crest'] },
  { id: 'tools', label: 'Tools and Skills', types: ['tool', 'silk-skill'] },
  { id: 'abilities', label: 'Abilities', types: ['ancestral-art', 'ability', 'sylphsong', 'everbloom'] },
  { id: 'equipment', label: 'Equipment', types: ['map'] },
  { id: 'mementos', label: 'Mementos', types: ['memento'] },
  { id: 'keys', label: 'Keys and key items', types: ['key'] },
];

run();

async function run() {
  const app = document.getElementById('app');
  try {
    await runTrackersPage(app);
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

async function runTrackersPage(app) {
  let data;
  try {
    data = await loadData();
  } catch (error) {
    document.title = 'Guide data not loaded | Silksong guide';
    renderMessage(app, { heading: 'The guide could not be loaded', paragraphs: [error.message] });
    return;
  }
  const { regions, items, dataVersion, sample } = data;
  configureProgress({ items, dataVersion, sample });
  document.title = 'Trackers | Silksong guide';

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const regionsById = new Map(regions.map((region) => [region.id, region]));

  // Entries of each tab, in route order. Built once: the data does not change while the page is open.
  const entriesByTab = new Map(
    TABS.map((tab) => [tab.id, items.filter((item) => tab.types.includes(item.type)).sort((a, b) => a.step - b.step)])
  );

  // showAll is session-only on purpose, like on the Region page: Progress stores no interface settings.
  const state = { done: new Set(), visited: new Set(), showAll: false, selected: tabFromAddress() };

  function nameOf(id) {
    const found = itemsById.get(id);
    return found ? found.name : id;
  }

  // Same rule as the Region page: entries stay hidden until the Region is open and Visited (or something in
  // it is done), unless the player asks to read ahead.
  function revealedRegions() {
    const withDone = new Set(items.filter((item) => state.done.has(item.id)).map((item) => item.regionId));
    const cache = new Map();
    return (regionId) => {
      if (!cache.has(regionId)) {
        const open = isRegionAvailable(regionId, state.done, regions);
        cache.set(regionId, state.showAll || (open && (state.visited.has(regionId) || withDone.has(regionId))));
      }
      return cache.get(regionId);
    };
  }

  function entryView(item) {
    const available = isAvailable(item.id, state.done, items, regions);
    const done = state.done.has(item.id);
    const missing = !done && !available ? missingFor(item.id, state.done, items, regions) : [];
    const region = regionsById.get(item.regionId);
    return {
      id: item.id,
      name: item.name,
      kind: item.kind,
      type: item.type,
      area: item.area || '',
      source: item.source,
      regionName: region ? region.name : item.regionId,
      regionHref: pageHref('region.html', { id: item.regionId }, sample),
      done,
      available,
      // Once an entry is done, what it needed no longer matters (same rule as the Route).
      needs: missing.length ? `Needs ${listWithMore(missing.map(nameOf), 3)}` : null,
      // A Task is never counted, so "Not counted" is for Collectibles the game does not count.
      uncounted: item.kind === 'collectible' && !isCounted(item),
    };
  }

  function tabCounts(tab) {
    const list = entriesByTab.get(tab.id);
    return { done: list.filter((item) => state.done.has(item.id)).length, total: list.length };
  }

  function panelView(tab) {
    const list = entriesByTab.get(tab.id);
    if (list.length === 0) return { id: tab.id, label: tab.label, empty: true };

    const revealed = revealedRegions();
    const shown = list.filter((item) => revealed(item.regionId));
    const hidden = list.filter((item) => !revealed(item.regionId));
    const { done, total } = tabCounts(tab);
    const counted = list.filter(isCounted).length;

    let note = 'Entries marked Not counted do not add to the 100 percent count on Home.';
    if (counted === 0) note = 'None of these count toward 100 percent.';
    else if (counted === list.length) note = 'Every entry here adds to the 100 percent count on Home.';

    let panelState = '';
    if (done === total) panelState = 'complete';
    else if (done === 0) panelState = 'nothing';

    return {
      id: tab.id,
      label: tab.label,
      empty: false,
      done,
      total,
      state: panelState,
      hasCounted: counted > 0,
      note,
      rows: shown.map(entryView),
      hiddenCount: hidden.length,
      hiddenRegions: new Set(hidden.map((item) => item.regionId)).size,
    };
  }

  function buildView() {
    const tabs = TABS.map((tab) => {
      const { done, total } = tabCounts(tab);
      let tabState = '';
      if (total === 0) tabState = 'empty';
      else if (done === total) tabState = 'complete';
      return { id: tab.id, label: tab.label, done, total, state: tabState, selected: tab.id === state.selected };
    });
    return {
      tabs,
      panel: panelView(TABS.find((tab) => tab.id === state.selected)),
      showAll: state.showAll,
      rosariesHref: pageHref('rosaries.html', {}, sample),
    };
  }

  // The elements are replaced on every render, so put keyboard focus back on the same control.
  function render() {
    const active = document.activeElement;
    const key = active && active.dataset ? active.dataset.focusKey : null;
    renderTrackersBody(parts, buildView());
    if (key) {
      const again = app.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
      if (again) again.focus();
    }
  }

  const parts = renderTrackersShell(app);

  const progress = await loadProgress();
  state.done = progress.done;
  state.visited = progress.visited;
  // Every change, including one that arrives from another device, comes through here.
  onProgressChange((next) => {
    state.done = next.done;
    state.visited = next.visited;
    render();
  });

  app.addEventListener('click', async (event) => {
    const tab = event.target.closest('[data-action="select-tab"]');
    if (tab) {
      selectTab(tab.dataset.tab);
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
      announce(`${value ? 'Marked as done' : 'Marked as not done'}: ${item.name}`);
    } catch (error) {
      console.error(error);
      announce('That change could not be saved. Try again.');
    }
  });

  app.addEventListener('change', (event) => {
    const input = event.target.closest('[data-action="show-all"]');
    if (!input) return;
    state.showAll = input.checked;
    render();
  });

  // Keyboard on the tab row (WAI-ARIA tabs, automatic activation): Left and Right move between tabs and
  // wrap round, Home and End jump to the first and last. Only the selected tab is in the tab order, so
  // Tab leaves the row and goes to the panel.
  app.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-action="select-tab"]');
    if (!tab || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = TABS.findIndex((t) => t.id === tab.dataset.tab);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    selectTab(TABS[next].id);
    app.querySelector(`#tab-${TABS[next].id}`).focus();
  });

  function selectTab(id) {
    if (!TABS.some((tab) => tab.id === id)) return;
    state.selected = id;
    // The address keeps the choice, so a reload (or a link) opens the same tab. replaceState adds no
    // history entry, so Back still leaves the page.
    history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
    render();
  }

  render();
}

// "#tools" opens the Tools tab; anything else opens the first.
function tabFromAddress() {
  const id = location.hash.replace('#', '');
  return TABS.some((tab) => tab.id === id) ? id : TABS[0].id;
}

function announce(text) {
  const live = document.getElementById('announcer');
  live.textContent = '';
  live.textContent = text;
}
