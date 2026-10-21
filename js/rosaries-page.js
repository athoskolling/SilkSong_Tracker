// rosaries-page.js: the Rosaries page (<body data-page="rosaries">). It adds up what the shop entries the
// player has not bought still cost, and lets them tick entries as bought.
//
// Same split as the other pages: this file asks data.js, progress.js and requirements.js, turns the
// answers into a plain "view" object, and render.js draws it (docs/CONTRACTS.md section 5).
// main.js is loaded on this page too, and does what every page does (sample banner, the sync line in
// the footer, the email sign-in link).
//
// There is no Rosaries number in Progress (ADR 0005): "bought" is an entry id in `done`, and the total is
// worked out from the `price` of the entries that are not. Shell Shards are not on this page: Athos has not
// confirmed that number, so neither the Progress code nor the rules for it exist yet.

import { loadData, pageHref } from './data.js';
import { configureProgress, loadProgress, setDone, onProgressChange, loadGoal, setGoal, onGoalChange } from './progress.js';
import { isAvailable, missingFor, isRegionAvailable, isCounted, rosariesToSpend } from './requirements.js';
import { renderMessage, renderRosariesShell, renderRosariesBody, listWithMore, formatRosaries } from './render.js';

run();

async function run() {
  const app = document.getElementById('app');
  try {
    await runRosariesPage(app);
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

async function runRosariesPage(app) {
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
  document.title = 'Rosaries | Silksong guide';

  const itemsById = new Map(items.map((item) => [item.id, item]));

  // Every shop entry (an entry with a price), bought or not, in route order. Built once: the data does not
  // change while the page is open.
  const priced = items.filter((item) => Number.isInteger(item.price)).sort((a, b) => a.step - b.step);
  // The same entries per Region, in the Regions' own order.
  const pricedByRegion = regions
    .map((region) => ({ region, entries: priced.filter((item) => item.regionId === region.id) }))
    .filter((group) => group.entries.length > 0);

  // showAll is session-only on purpose, like on the Region page: Progress stores no interface settings.
  const state = { done: new Set(), visited: new Set(), showAll: false, goal: null };

  function nameOf(id) {
    const found = itemsById.get(id);
    return found ? found.name : id;
  }

  // Same rule as the Region page: entries stay hidden until the Region is open and Visited (or something in
  // it is done), unless the player asks to read ahead. Their prices are still in the total.
  function revealedRegions() {
    const withDone = new Set(items.filter((item) => state.done.has(item.id)).map((item) => item.regionId));
    return (regionId) =>
      state.showAll || (isRegionAvailable(regionId, state.done, regions) && (state.visited.has(regionId) || withDone.has(regionId)));
  }

  function entryView(item) {
    const available = isAvailable(item.id, state.done, items, regions);
    const done = state.done.has(item.id);
    const missing = !done && !available ? missingFor(item.id, state.done, items, regions) : [];
    return {
      id: item.id,
      name: item.name,
      kind: item.kind,
      type: item.type,
      price: item.price,
      source: item.source,
      done,
      available,
      isGoal: state.goal === item.id,
      // Once an entry is bought, what it needed no longer matters (same rule as the Route).
      needs: missing.length ? `Needs ${listWithMore(missing.map(nameOf), 3)}` : null,
      // A Task is never counted, so "Not counted" is for Collectibles the game does not count.
      uncounted: item.kind === 'collectible' && !isCounted(item),
    };
  }

  function hiddenNote(count, locked) {
    const entries = `${count} ${count === 1 ? 'entry' : 'entries'}`;
    const when = locked ? 'until this region is open and you visit it' : 'until you visit this region';
    return `${entries} hidden ${when}. ${count === 1 ? 'Its price is' : 'Their prices are'} in the total.`;
  }

  function buildView() {
    if (priced.length === 0) return { empty: true, trackersHref: pageHref('trackers.html', {}, sample) };

    const spend = rosariesToSpend(state.done, items, regions);
    const revealed = revealedRegions();
    const boughtCount = priced.filter((item) => state.done.has(item.id)).length;
    const complete = boughtCount === priced.length;

    // "Next to buy": the first entry in route order that is not bought and can be bought now. `ids` is
    // already in step order. No check on whether the player can afford it: Rosaries are not in Progress.
    const nextId = spend.ids.find((id) => isAvailable(id, state.done, items, regions));
    const nextItem = nextId ? itemsById.get(nextId) : null;
    let next = null;
    if (nextItem) {
      const region = regions.find((r) => r.id === nextItem.regionId);
      next = {
        ...entryView(nextItem),
        regionName: region ? region.name : nextItem.regionId,
        regionHref: pageHref('region.html', { id: nextItem.regionId }, sample),
        leaves: spend.total - nextItem.price,
      };
    }

    // Entries not bought that sit in Regions the player has not reached: counted in the total, named nowhere.
    const hiddenLeft = priced.filter((item) => !state.done.has(item.id) && !revealed(item.regionId));
    const hiddenRegions = new Set(hiddenLeft.map((item) => item.regionId)).size;
    let needLabel = 'Rosaries for everything you have not bought';
    if (hiddenLeft.length) {
      const entries = `${hiddenLeft.length} ${hiddenLeft.length === 1 ? 'entry' : 'entries'}`;
      needLabel += `, including ${entries} in ${hiddenRegions === 1 ? 'a region' : 'regions'} you have not visited`;
    }
    needLabel += '.';
    if (spend.available > 0) {
      needLabel += ` Of that, ${formatRosaries(spend.available)} ${spend.available === 1 ? 'Rosary is' : 'Rosaries are'} for entries you can buy now.`;
    } else if (spend.total > 0) {
      needLabel += ' None of it is for entries you can buy now.';
    }

    const groups = pricedByRegion.map(({ region, entries }) => {
      const group = { id: region.id, name: region.name, href: pageHref('region.html', { id: region.id }, sample) };
      if (revealed(region.id)) {
        const done = entries.filter((item) => state.done.has(item.id)).length;
        return { ...group, meta: `${done} of ${entries.length} bought`, rows: entries.map(entryView), hiddenNote: null };
      }
      const locked = !isRegionAvailable(region.id, state.done, regions);
      return { ...group, meta: locked ? 'Locked' : 'Not visited', rows: [], hiddenNote: hiddenNote(entries.length, locked) };
    });

    return {
      empty: false,
      need: spend.total,
      needLabel,
      bought: { done: boughtCount, total: priced.length },
      complete,
      showAll: state.showAll,
      next,
      groups,
    };
  }

  // The elements are replaced on every render, so put keyboard focus back on the same control. The button
  // on the "Next to buy" plate keeps one key whichever entry it is for, so focus stays on it between
  // purchases.
  function render() {
    const active = document.activeElement;
    const key = active && active.dataset ? active.dataset.focusKey : null;
    state.goal = loadGoal(); // read at each draw, after configureProgress (sample mode has its own Goal key)
    renderRosariesBody(layout, buildView());
    if (key) {
      let again = app.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
      // The "Mark as bought" button is gone when nothing is left to buy now: keep focus on that plate
      // (its heading takes focus from a script) instead of dropping it to the top of the page.
      if (!again && key === 'next-buy') again = document.getElementById('next-buy-heading');
      if (again) again.focus();
    }
  }

  const layout = renderRosariesShell(app);

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
    const button = event.target.closest('[data-action="toggle-done"]');
    if (!button) return;
    const item = itemsById.get(button.dataset.id);
    if (!item) return;
    // Marking an entry that is not Available is allowed: the guide follows the real game (contract section 3).
    const value = !state.done.has(item.id);
    try {
      await setDone(item.id, value);
      const left = rosariesToSpend(state.done, items, regions).total;
      announce(`${value ? 'Marked as bought' : 'Marked as not bought'}: ${item.name}. ${formatRosaries(left)} Rosaries still needed.`);
    } catch (error) {
      console.error(error);
      announce('That change could not be saved. Try again.');
    }
  });

  // "Make this my goal": pressing the control of the current Goal clears it. The page redraws from onGoalChange.
  app.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="toggle-goal"]');
    if (!button) return;
    const item = itemsById.get(button.dataset.id);
    if (!item) return;
    if (loadGoal() === item.id) {
      setGoal(null);
      announce(`Goal cleared: ${item.name}.`);
    } else {
      setGoal(item.id);
      announce(`Your goal is now ${item.name}.`);
    }
  });
  onGoalChange(() => render());

  app.addEventListener('change', (event) => {
    const input = event.target.closest('[data-action="show-all"]');
    if (!input) return;
    state.showAll = input.checked;
    render();
  });

  render();
}

function announce(text) {
  const live = document.getElementById('announcer');
  live.textContent = '';
  live.textContent = text;
}
