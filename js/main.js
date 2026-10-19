// main.js: picks behaviour from <body data-page="...">. Today only the Region page exists
// (Home, Route and Account arrive in Phase 2).
//
// This file is the glue: it loads the guide content (data.js), reads Progress only through
// progress.js, asks requirements.js what is Available or missing, turns the answers into a plain
// "view" object and hands that to render.js. See docs/CONTRACTS.md sections 2, 3 and 5.

import { loadData, isSampleMode, pageHref, imageUrl } from './data.js';
import {
  configureProgress,
  loadProgress,
  setDone,
  setVisited,
  onProgressChange,
  onSyncStatus,
} from './progress.js';
import {
  isAvailable,
  missingFor,
  regionProgress,
  isRegionAvailable,
  missingForRegion,
  nextStep,
} from './requirements.js';
import { renderMessage, renderShell, renderBody, joinNames } from './render.js';

const page = document.body.dataset.page;
if (page === 'region') {
  startRegionPage();
}

// ------------------------------------------------------------------ the page

async function startRegionPage() {
  const app = document.getElementById('app');

  if (isSampleMode()) document.getElementById('banner').hidden = false;

  try {
    await runRegionPage(app);
  } catch (error) {
    // A data bug (for example a cycle in `requires`) throws on purpose; say so instead of a blank page.
    console.error(error);
    document.title = 'Something went wrong | Silksong guide';
    renderMessage(app, {
      heading: 'Something went wrong',
      paragraphs: [`The page could not be built: ${error.message}`, 'Reload the page. If it happens again, tell the person who maintains the guide.'],
    });
  }
}

async function runRegionPage(app) {
  const data = await loadOrExplain(app);
  if (!data) return;
  const { regions, items, dataVersion, sample } = data;

  // Hand the entry list to progress.js once, so marking an entry can also mark its Region Visited.
  configureProgress({ items, dataVersion });

  const region = findRegion(app, regions, sample);
  if (!region) return;

  document.title = `${region.name} | Silksong guide`;

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const regionsById = new Map(regions.map((r) => [r.id, r]));
  const regionItems = items.filter((item) => item.regionId === region.id).sort((a, b) => a.step - b.step);

  // State for this page. showAll is session-only on purpose: Progress stores only ids, and
  // progress.js is the only module allowed to write localStorage, so a UI preference has no home.
  const state = { done: new Set(), visited: new Set(), showAll: false };
  const progress = await loadProgress();
  state.done = progress.done;
  state.visited = progress.visited;

  let layout = null;
  let shellMode = null;

  function buildView() {
    const mode = isRegionAvailable(region.id, state.done, regions) ? 'open' : 'locked';
    const noEntries = regionItems.length === 0;
    const hasDoneHere = regionItems.some((item) => state.done.has(item.id));
    // Entries stay hidden until the player visits, marks something here, or asks to read ahead.
    const revealed = state.showAll || (mode === 'open' && (state.visited.has(region.id) || hasDoneHere));
    const showEntries = !noEntries && revealed;

    const view = {
      mode,
      noEntries,
      showEntries,
      showAll: state.showAll,
      visited: state.visited.has(region.id),
      homeHref: pageHref('index.html', {}, sample),
      region: {
        id: region.id,
        name: region.name,
        summary: region.summary,
        heroUrl: region.heroImage ? imageUrl(region.heroImage) : null,
        heroPosition: region.heroPosition,
      },
      entries: [],
      chain: [],
      counts: null,
    };

    if (mode === 'locked') view.chain = lockedChain();
    if (showEntries) {
      view.entries = entryViews();
      view.counts = countsForRegion();
    }
    return view;
  }

  function nameOf(id) {
    const item = itemsById.get(id);
    return item ? item.name : id;
  }

  // One row per entry, with everything render.js needs already decided.
  function entryViews() {
    const next = nextStep(state.done, items, regions);
    return regionItems.map((item) => {
      const available = isAvailable(item.id, state.done, items, regions);
      return {
        id: item.id,
        name: item.name,
        kind: item.kind,
        type: item.type,
        area: item.area || '',
        how: item.how,
        step: item.step,
        missable: item.missable === true,
        missableNote: item.missableNote || '',
        done: state.done.has(item.id),
        available,
        isNext: next === item.id,
        needs: needsLine(item, available),
      };
    });
  }

  // "Needs A, B" when something stands in the way; "Needs A, done" when the entry's own
  // requirements are all met; nothing when the entry has none.
  function needsLine(item, available) {
    if (!available) {
      const missing = missingFor(item.id, state.done, items, regions);
      if (missing.length === 0) return null;
      return { text: `Needs ${joinNames(missing.map(nameOf))}`, missing: true };
    }
    if (item.requires.length > 0) {
      return { text: `Needs ${joinNames(item.requires.map(nameOf))}, done`, missing: false };
    }
    return null;
  }

  // The Locked screen: the Region's own requirements (so a finished one reads "Collected") plus
  // everything still missing down the chain, in route order.
  function lockedChain() {
    const ids = new Set([...region.requires, ...missingForRegion(region.id, state.done, regions, items)]);
    return [...ids]
      .map((id) => itemsById.get(id))
      .filter(Boolean)
      .sort((a, b) => a.step - b.step)
      .map((item) => {
        const itemRegion = regionsById.get(item.regionId);
        return {
          id: item.id,
          name: item.name,
          kind: item.kind,
          type: item.type,
          done: state.done.has(item.id),
          regionName: itemRegion ? itemRegion.name : item.regionId,
          regionHref: pageHref('region.html', { id: item.regionId }, sample),
        };
      });
  }

  // Collectibles come from requirements.js. It has no function for Tasks (they never count
  // toward totals), so the Tasks line is counted here from the Region's own entries.
  function countsForRegion() {
    const tasks = regionItems.filter((item) => item.kind === 'task');
    return {
      collectibles: regionProgress(region.id, state.done, items),
      tasks: { done: tasks.filter((item) => state.done.has(item.id)).length, total: tasks.length },
    };
  }

  // Re-renders the list and the side plate. The hero is only rebuilt when the Region flips
  // between Locked and Available, so the start thread plays once.
  function render() {
    const view = buildView();
    const focusKey = document.activeElement && document.activeElement.dataset
      ? document.activeElement.dataset.focusKey
      : null;

    if (!layout || shellMode !== view.mode) {
      layout = renderShell(app, view);
      shellMode = view.mode;
    }
    renderBody(layout, view);
    showCredit(view, region);

    // The elements were replaced, so put keyboard focus back on the same control.
    if (focusKey) {
      const again = app.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
      if (again) again.focus();
    }
  }

  app.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="toggle-done"]');
    if (!button) return;
    const item = itemsById.get(button.dataset.id);
    if (!item) return;
    const value = !state.done.has(item.id);
    try {
      // Marking an entry that is not Available is allowed: the guide follows the real game.
      await setDone(item.id, value);
      announce(`${value ? 'Marked as done' : 'Marked as not done'}: ${item.name}`);
    } catch (error) {
      console.error(error);
      announce('That change could not be saved. Try again.');
    }
  });

  app.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-action]');
    if (!input) return;
    if (input.dataset.action === 'visited') {
      try {
        await setVisited(region.id, input.checked);
      } catch (error) {
        console.error(error);
        announce('That change could not be saved. Try again.');
      }
    } else if (input.dataset.action === 'show-all') {
      state.showAll = input.checked;
      render();
    }
  });

  // Every change, including one that arrives from another device, comes through here.
  onProgressChange((next) => {
    state.done = next.done;
    state.visited = next.visited;
    render();
  });

  onSyncStatus(showSyncStatus);

  render();
}

// ------------------------------------------------------------ loading helpers

async function loadOrExplain(app) {
  try {
    return await loadData();
  } catch (error) {
    document.title = 'Guide data not loaded | Silksong guide';
    renderMessage(app, {
      heading: 'The guide could not be loaded',
      paragraphs: [error.message],
    });
    return null;
  }
}

// Reads ?id= and finds the Region. With no id, or an id the guide does not have, explains
// and links to the first Region (the Home page does not exist until Phase 2).
function findRegion(app, regions, sample) {
  const id = new URLSearchParams(location.search).get('id');
  const region = id ? regions.find((r) => r.id === id) : null;
  if (region) return region;

  document.title = 'Region not found | Silksong guide';
  const first = regions[0];
  renderMessage(app, {
    heading: 'Region not found',
    paragraphs: [
      id
        ? `The guide has no region with the id "${id}".`
        : 'This page needs a region id, for example region.html?id=<region id>.',
      first ? 'Open a region from the list below.' : 'The guide has no regions yet.',
    ],
    links: regions.map((r) => ({ text: r.name, href: pageHref('region.html', { id: r.id }, sample) })),
  });
  return null;
}

// ---------------------------------------------------------- small page helpers

function announce(text) {
  const live = document.getElementById('announcer');
  live.textContent = '';
  live.textContent = text;
}

// The hero credit lives in the footer (DESIGN.md section 5). A Locked Region shows no image, so no credit.
function showCredit(view, region) {
  const credit = document.getElementById('credit');
  const show = view.mode === 'open' && region.heroImage && region.heroCredit;
  credit.hidden = !show;
  credit.textContent = show ? `Hero image: ${region.heroCredit}` : '';
}

function showSyncStatus(status) {
  const line = document.getElementById('sync-status');
  if (status.state === 'syncing') line.textContent = 'Syncing your progress.';
  else if (status.state === 'synced') line.textContent = 'Synced with your account.';
  else if (status.state === 'error') {
    const why = status.message ? ` (${status.message})` : '';
    line.textContent = `Could not sync${why}. Your progress is saved on this device.`;
  } else line.textContent = 'Saved on this device.';
}
