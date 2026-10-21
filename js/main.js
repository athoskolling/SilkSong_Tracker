// main.js: picks behaviour from <body data-page="...">: home, region, route and account (the
// sign-in half; js/account-page.js builds the rest of the Account page).
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
  loadGoal,
  setGoal,
  onGoalChange,
} from './progress.js';
import {
  isAvailable,
  missingFor,
  directMissingFor,
  directMissingForRegion,
  regionProgress,
  isRegionAvailable,
  missingForRegion,
  nextStep,
  holdingYouUp,
  isCounted,
  routeIds,
  pathTo,
} from './requirements.js';
import {
  signIn,
  completeEmailLinkSignIn,
  signOut,
  onAuthChange,
} from './firebase.js';
import {
  renderMessage,
  renderShell,
  renderBody,
  renderHomeShell,
  renderHomeBody,
  renderRouteShell,
  renderRouteBody,
  joinNames,
  needsText,
  syncText,
  renderAccountShell,
  renderAccountPlate,
  setAccountMessage,
} from './render.js';
import { startGoalDock } from './goal-dock.js';

const page = document.body.dataset.page;
startPage();

// What every page does, then what this page does.
function startPage() {
  if (isSampleMode()) {
    document.getElementById('banner').hidden = false;
    keepSampleOnHeaderLinks();
  }

  // The footer line says where Progress is, on every page.
  onSyncStatus((status) => {
    document.getElementById('sync-status').textContent = syncText(status);
  });

  startGoalDock(); // not awaited: the box fills in once the data is loaded; it skips the Goal page itself

  if (page === 'account') {
    startAccountPage();
    return;
  }
  if (page === 'home') startHomePage();
  else if (page === 'region') startRegionPage();
  else if (page === 'route') startRoutePage();
  finishEmailLink(); // not awaited: a normal page load must not wait on it
}

// The header links are written in the HTML. While ?data=sample is on, they must keep it, or one
// click on "Route" would quietly switch the visitor to the real data.
function keepSampleOnHeaderLinks() {
  for (const link of document.querySelectorAll('.site-header a[href]')) {
    const [file] = link.getAttribute('href').split('?');
    link.setAttribute('href', pageHref(file, {}, true));
  }
}

// ------------------------------------------------------------- email sign-in link

// docs/CONTRACTS.md section 4: main.js asks on every page load. It is cheap when the address bar
// holds no sign-in link (firebase.js answers 'not-a-link' without loading the SDK).
// Returns true when it sent the visitor to the Account page, so a caller can stop.
async function finishEmailLink() {
  try {
    const result = await completeEmailLinkSignIn();
    if (result === 'needs-email') {
      // The link was opened on a device that does not remember the address. Only the Account page
      // asks for it, so go there with the link's query string kept.
      location.replace(`account.html${location.search}${location.hash}`);
      return true;
    }
  } catch (error) {
    console.warn(error); // handled: the message below is the answer, not a bug report
    announce(error.message); // already written for people
  }
  return false;
}

// ------------------------------------------------------------ shared by Home, Route and Region

// Runs a page and, when a data bug throws on purpose (for example a cycle in `requires`), says
// so instead of leaving a blank page.
async function runGuarded(app, run) {
  try {
    await run(app);
  } catch (error) {
    console.error(error);
    document.title = 'Something went wrong | Silksong guide';
    renderMessage(app, {
      heading: 'Something went wrong',
      paragraphs: [`The page could not be built: ${error.message}`, 'Reload the page. If it happens again, tell the person who maintains the guide.'],
    });
  }
}

// Loads the content once, hands the entry list to progress.js (so marking an entry can also mark its
// Region Visited), and returns lookups every page needs. Returns null when the data did not load
// (loadOrExplain has already told the visitor).
async function loadGuide(app) {
  const data = await loadOrExplain(app);
  if (!data) return null;
  const { regions, items, dataVersion, sample } = data;
  configureProgress({ items, dataVersion, sample });

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const regionsById = new Map(regions.map((region) => [region.id, region]));
  // The one place that decides what is on the Route (docs/CONTRACTS.md section 5, "the Route rule").
  // It depends on the data only, so it is worked out once. Nothing else in the page tests `kind`,
  // `counts` or `missable` for this.
  const onRoute = routeIds(items, regions);
  const routeOrder = items.filter((item) => onRoute.has(item.id)).sort((a, b) => a.step - b.step);
  return {
    regions,
    items,
    sample,
    itemsById,
    regionsById,
    onRoute,
    routeOrder,
    // Ids are unique across entries and Regions (contract section 1), so one lookup serves both.
    nameOf(id) {
      const found = itemsById.get(id) || regionsById.get(id);
      return found ? found.name : id;
    },
    regionNameOf(regionId) {
      const region = regionsById.get(regionId);
      return region ? region.name : regionId;
    },
  };
}

// One row of the thread, with everything render.js needs already decided. Used by the Region page
// and the Route page, so an entry reads the same on both.
function makeEntryView(item, guide, done, nextId, goalId) {
  const available = isAvailable(item.id, done, guide.items, guide.regions);
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    type: item.type,
    regionId: item.regionId,
    area: item.area || '',
    how: item.how,
    step: item.step,
    source: item.source,
    missable: item.missable === true,
    missableNote: item.missableNote || '',
    done: done.has(item.id),
    available,
    isNext: nextId === item.id,
    isGoal: goalId === item.id,
    onRoute: guide.onRoute.has(item.id),
    needs: needsLine(item, available, guide, done),
  };
}

// "Needs A, B" when something stands in the way; "Needs A, done" when the entry's own
// requirements are all met; nothing when the entry has none.
function needsLine(item, available, guide, done) {
  if (!available) {
    const direct = directMissingFor(item.id, done, guide.items, guide.regions);
    if (direct.length === 0) return null;
    // Only the direct requirements by name; the rest of the chain is a count (shared helper).
    const chain = missingFor(item.id, done, guide.items, guide.regions);
    return { text: needsText(direct.map(guide.nameOf), chain.length), missing: true };
  }
  if (item.requires.length > 0) {
    return { text: `Needs ${joinNames(item.requires.map(guide.nameOf))}, done`, missing: false };
  }
  return null;
}

// "Holding you up", as names. Each blocker lists the entries and Regions it holds up.
function holdingViews(guide, done, limit) {
  return holdingYouUp(done, guide.items, guide.regions)
    .slice(0, limit)
    .map(({ id, blocks }) => {
      const blocker = guide.itemsById.get(id);
      const entries = [];
      const regionNames = [];
      for (const blockedId of blocks) {
        const blocked = guide.itemsById.get(blockedId);
        if (blocked) entries.push({ name: blocked.name, regionName: guide.regionNameOf(blocked.regionId) });
        else if (guide.regionsById.has(blockedId)) regionNames.push(guide.regionsById.get(blockedId).name);
      }
      return { id, name: blocker.name, kind: blocker.kind, entries, regions: regionNames };
    });
}

// Tasks are not in requirements.js (they never count toward totals), so they are counted here.
function taskProgress(items, done) {
  const tasks = items.filter((item) => item.kind === 'task');
  return { done: tasks.filter((item) => done.has(item.id)).length, total: tasks.length };
}

// Entries stay hidden until the player visits the Region, marks something in it, or asks to read
// ahead (DESIGN.md section 6). A Locked Region stays hidden unless the player asks to read ahead.
function regionIsRevealed(region, guide, state, regionsWithDone) {
  if (state.showAll) return true;
  if (!isRegionAvailable(region.id, state.done, guide.regions)) return false;
  return state.visited.has(region.id) || regionsWithDone.has(region.id);
}

function regionsWithDoneEntries(guide, done) {
  return new Set(guide.items.filter((item) => done.has(item.id)).map((item) => item.regionId));
}

// Loads Progress and keeps `state` current, including changes from another device.
async function trackProgress(state, render) {
  const progress = await loadProgress();
  state.done = progress.done;
  state.visited = progress.visited;
  onProgressChange((next) => {
    state.done = next.done;
    state.visited = next.visited;
    render();
  });
}

// Puts keyboard focus back on the same control after a re-render replaced the elements.
function focusKeyBefore() {
  const el = document.activeElement;
  return el && el.dataset ? el.dataset.focusKey || null : null;
}

function restoreFocus(app, key) {
  if (!key) return;
  const again = app.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
  if (again) again.focus();
}

// Marks or unmarks an entry from a click on a done toggle. Marking an entry that is not Available
// is allowed: the guide follows the real game (contract section 3).
async function handleToggleClick(event, guide, state) {
  const button = event.target.closest('[data-action="toggle-done"]');
  if (!button) return;
  const item = guide.itemsById.get(button.dataset.id);
  if (!item) return;
  const value = !state.done.has(item.id);
  try {
    await setDone(item.id, value);
    announce(`${value ? 'Marked as done' : 'Marked as not done'}: ${item.name}`);
  } catch (error) {
    console.error(error);
    announce('That change could not be saved. Try again.');
  }
}

// "Make this my goal" (docs/CONTRACTS.md section 5, "Goal"). Pressing the control of the current Goal clears it.
// The Goal is set and read only through progress.js; nothing is marked done or Visited. The page redraws
// from onGoalChange, so this only changes the Goal and tells the player.
function handleGoalClick(event, guide) {
  const button = event.target.closest('[data-action="toggle-goal"]');
  if (!button) return;
  const item = guide.itemsById.get(button.dataset.id);
  if (!item) return;
  if (loadGoal() === item.id) {
    setGoal(null);
    announce(`Goal cleared: ${item.name}.`);
  } else {
    setGoal(item.id);
    announce(`Your goal is now ${item.name}.`);
  }
}

// -------------------------------------------------------------------- home page

async function startHomePage() {
  await runGuarded(document.getElementById('app'), runHomePage);
}

async function runHomePage(app) {
  const guide = await loadGuide(app);
  if (!guide) return;
  const { regions, items, sample } = guide;
  document.title = 'Silksong guide';

  const state = { done: new Set(), visited: new Set() };

  function buildView() {
    const nextId = nextStep(state.done, items, regions);
    const withDone = regionsWithDoneEntries(guide, state.done);
    const nextItem = nextId ? guide.itemsById.get(nextId) : null;

    // Same rule as regionProgress, so the headline and the Region cards always add up: an entry
    // with `counts: false` (a Memento, a map) is tracked but never in the headline.
    const collectibles = items.filter(isCounted);
    const goalId = loadGoal();
    return {
      goal: goalPlateView(goalId),
      routeHref: pageHref('route.html', {}, sample),
      hasEntries: items.length > 0,
      // The Route's own idea of "nothing left": extras off the Route do not keep it from being true.
      allDone: guide.routeOrder.length > 0 && guide.routeOrder.every((item) => state.done.has(item.id)),
      next: nextItem && {
        id: nextItem.id,
        isGoal: goalId === nextItem.id,
        name: nextItem.name,
        type: nextItem.type,
        step: nextItem.step,
        how: nextItem.how,
        source: nextItem.source,
        regionName: guide.regionNameOf(nextItem.regionId),
        regionHref: pageHref('region.html', { id: nextItem.regionId }, sample),
      },
      holding: holdingViews(guide, state.done, 3),
      totals: {
        collectibles: { done: collectibles.filter((item) => state.done.has(item.id)).length, total: collectibles.length },
        tasks: taskProgress(items, state.done),
        byType: collectiblesByType(collectibles, state.done),
      },
      regions: regions.map((region) => regionCard(region, guide, state, withDone, nextItem)),
    };
  }

  // The "Your goal" plate. No Goal, or a stored id the guide no longer has: no plate (the Goal page explains
  // the second case). A Goal that is done shows the plate with "Done".
  function goalPlateView(goalId) {
    const goalItem = goalId ? guide.itemsById.get(goalId) : null;
    if (!goalItem) return null;
    const rows = pathTo(goalItem.id, state.done, items, regions);
    const first = rows.find((row) => row.available);
    const firstItem = first ? guide.itemsById.get(first.id) : null;
    return {
      name: goalItem.name,
      type: goalItem.type,
      regionName: guide.regionNameOf(goalItem.regionId),
      done: state.done.has(goalItem.id),
      left: rows.length,
      firstAvailable: firstItem && {
        name: firstItem.name,
        type: firstItem.type,
        regionName: guide.regionNameOf(firstItem.regionId),
      },
      href: pageHref('goal.html', {}, sample),
    };
  }

  function render() {
    const key = focusKeyBefore();
    renderHomeBody(body, buildView());
    restoreFocus(app, key);
  }

  const body = renderHomeShell(app);
  await trackProgress(state, render);
  app.addEventListener('click', (event) => handleGoalClick(event, guide));
  onGoalChange(() => render());
  render();
}

// "Collectibles by type": one row per type, in alphabetical order so the list does not jump about.
function collectiblesByType(collectibles, done) {
  const byType = new Map();
  for (const item of collectibles) {
    const row = byType.get(item.type) || { type: item.type, done: 0, total: 0 };
    row.total += 1;
    if (done.has(item.id)) row.done += 1;
    byType.set(item.type, row);
  }
  return [...byType.values()].sort((a, b) => a.type.localeCompare(b.type));
}

// A Region card is in exactly one of five states (DESIGN.md section 5):
//   empty     no entries yet ("Not in the guide yet")
//   locked    its requirements are not met
//   complete  every entry in it that is on the Route is done (all of them when none is on the Route)
//   visited   marked Visited, or something in it is done
//   available open, but not visited yet
function regionCard(region, guide, state, regionsWithDone, nextItem) {
  const regionItems = guide.items.filter((item) => item.regionId === region.id);
  const open = isRegionAvailable(region.id, state.done, guide.regions);

  let cardState;
  if (regionItems.length === 0) cardState = 'empty';
  else if (!open) cardState = 'locked';
  else if (isRegionComplete(regionItems, guide, state.done)) cardState = 'complete';
  else if (state.visited.has(region.id) || regionsWithDone.has(region.id)) cardState = 'visited';
  else cardState = 'available';

  const card = {
    id: region.id,
    name: region.name,
    state: cardState,
    href: pageHref('region.html', { id: region.id }, guide.sample),
    // A Locked Region never shows its picture (less to spoil), same as its own page.
    heroUrl: region.heroImage && cardState !== 'locked' && cardState !== 'empty' ? imageUrl(region.heroImage) : null,
    heroPosition: region.heroPosition || '50% 40%',
    collectibles: regionProgress(region.id, state.done, guide.items),
    tasks: taskProgress(regionItems, state.done),
    needs: null,
    hasNext: Boolean(nextItem) && nextItem.regionId === region.id,
  };

  if (cardState === 'locked') {
    const direct = directMissingForRegion(region.id, state.done, guide.regions, guide.items);
    const chain = missingForRegion(region.id, state.done, guide.regions, guide.items);
    card.needs = needsText(direct.map(guide.nameOf), chain.length);
  }
  return card;
}

// Complete follows the Route rule: extras off the Route (a Memento, the Hunter Crest) never keep a
// Region from being Complete. A Region with no entry on the Route at all is Complete when all its
// entries are done, so it is not Complete from the start.
function isRegionComplete(regionItems, guide, done) {
  const onRouteItems = regionItems.filter((item) => guide.onRoute.has(item.id));
  const counted = onRouteItems.length > 0 ? onRouteItems : regionItems;
  return counted.every((item) => done.has(item.id));
}

// ------------------------------------------------------------------- route page

async function startRoutePage() {
  await runGuarded(document.getElementById('app'), runRoutePage);
}

async function runRoutePage(app) {
  const guide = await loadGuide(app);
  if (!guide) return;
  const { regions, items, sample } = guide;
  document.title = 'Route | Silksong guide';

  // The filters and show-all are session-only on purpose (same reason as the Region page).
  const state = { done: new Set(), visited: new Set(), showAll: false, onlyNow: false, hideDone: false };

  // The route is one list in `step` order. A Region can appear more than once when its steps are
  // interleaved with another Region's, so entries are grouped in runs of the same Region.
  function buildView() {
    const nextId = nextStep(state.done, items, regions);
    const goalId = loadGoal();
    const withDone = regionsWithDoneEntries(guide, state.done);
    const revealedCache = new Map();
    const revealed = (regionId) => {
      if (!revealedCache.has(regionId)) {
        revealedCache.set(regionId, regionIsRevealed(guide.regionsById.get(regionId), guide, state, withDone));
      }
      return revealedCache.get(regionId);
    };

    const groups = [];
    let shownCount = 0;
    for (const item of guide.routeOrder) {
      let group = groups[groups.length - 1];
      if (!group || group.regionId !== item.regionId) {
        group = {
          regionId: item.regionId,
          name: guide.regionNameOf(item.regionId),
          href: pageHref('region.html', { id: item.regionId }, sample),
          locked: !isRegionAvailable(item.regionId, state.done, regions),
          firstStep: item.step,
          lastStep: item.step,
          rows: [],
          hiddenCount: 0,
        };
        groups.push(group);
      }
      group.lastStep = item.step;

      // The next step is always shown, even in a Region that is still hidden: Home names it too,
      // and a new game would otherwise open on a Route with nothing to do.
      if (!revealed(item.regionId) && item.id !== nextId) {
        group.hiddenCount += 1;
        continue;
      }
      const row = makeEntryView(item, guide, state.done, nextId, goalId);
      if (state.hideDone && row.done) continue;
      if (state.onlyNow && (row.done || !row.available)) continue;
      group.rows.push(row);
      shownCount += 1;
    }

    return {
      hasEntries: items.length > 0,
      showAll: state.showAll,
      onlyNow: state.onlyNow,
      hideDone: state.hideDone,
      filtered: state.onlyNow || state.hideDone,
      shownCount,
      groups: groups.filter((group) => group.rows.length > 0 || group.hiddenCount > 0),
      holding: holdingViews(guide, state.done, 5),
    };
  }

  // After a click that makes a row disappear (a filter is on), keyboard focus would fall to the
  // page. Remember where it was in the list of toggles and land on the toggle now at that place.
  function toggleKeys() {
    return [...app.querySelectorAll('[data-action="toggle-done"]')].map((el) => el.dataset.focusKey);
  }

  function render(announceCount = false) {
    const key = focusKeyBefore();
    const keysBefore = toggleKeys();
    const view = buildView();
    renderRouteBody(layout, view);

    if (key && key.startsWith('done:') && !app.querySelector(`[data-focus-key="${CSS.escape(key)}"]`)) {
      const toggles = app.querySelectorAll('[data-action="toggle-done"]');
      const target = toggles[Math.min(Math.max(keysBefore.indexOf(key), 0), toggles.length - 1)];
      if (target) target.focus();
    } else {
      restoreFocus(app, key);
    }
    if (announceCount) announce(`Showing ${view.shownCount} ${view.shownCount === 1 ? 'step' : 'steps'}.`);
  }

  const layout = renderRouteShell(app);
  await trackProgress(state, render);

  app.addEventListener('click', (event) => handleToggleClick(event, guide, state));
  app.addEventListener('click', (event) => handleGoalClick(event, guide));
  onGoalChange(() => render());
  app.addEventListener('change', (event) => {
    const input = event.target.closest('[data-action]');
    if (!input) return;
    if (input.dataset.action === 'show-all') state.showAll = input.checked;
    else if (input.dataset.action === 'only-now') state.onlyNow = input.checked;
    else if (input.dataset.action === 'hide-done') state.hideDone = input.checked;
    else return;
    render(true);
  });

  // The "Choice point" marker (DESIGN.md section 6) is not built: the data rule that says which
  // Step closes an Ending is still open (docs/CONTRACTS.md section 8). When it is decided, it
  // becomes one more kind of row between entries in buildView, drawn by renderRouteBody.
  render();
}

// ----------------------------------------------------------------- account page

// The sign-in half of the Account screen. Backup, "Start a new run", "How saving works" and
// "Guide data" arrive in Phase 2. Sign-in goes through firebase.js; Progress stays in progress.js,
// which wires itself to sign-in on import (so signing in here starts the merge and the sync).
async function startAccountPage() {
  const app = document.getElementById('app');
  const { plate, message } = renderAccountShell(app);

  const state = {
    user: null,
    authKnown: false, // true after the first answer from onAuthChange
    linkPending: true, // true until completeEmailLinkSignIn has answered
    needsEmail: false, // the link was opened on a device that does not remember the address
    busy: false,
    email: '',
    status: { state: 'local', at: null, message: '' },
    combined: null, // kept for as long as the page shows this account (see onSyncStatus below)
  };

  function phase() {
    if (state.user) return 'signed-in';
    if (state.needsEmail) return 'needs-email';
    if (!state.authKnown || state.linkPending) return 'checking';
    return 'signed-out';
  }

  function focusKeyOf(element) {
    return element && element.dataset ? element.dataset.focusKey : null;
  }

  function focusByKey(key) {
    if (!key) return;
    const again = plate.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
    if (again) again.focus();
  }

  function render() {
    // Keep what the visitor typed: the plate is rebuilt on every state change.
    const field = plate.querySelector('#email-in');
    if (field) state.email = field.value;
    const key = focusKeyOf(document.activeElement);

    renderAccountPlate(plate, {
      phase: phase(),
      busy: state.busy,
      email: state.email,
      user: state.user,
      syncText: syncText(state.status),
      combined: state.combined,
      sample: isSampleMode(),
    });
    focusByKey(key);
  }

  function say(text, kind) {
    setAccountMessage(message, text, kind);
  }

  // Runs one sign-in action: buttons are off while it runs (so a second popup cannot open), and
  // any error is shown as its own message, which firebase.js already wrote for people.
  async function attempt(action) {
    const key = focusKeyOf(document.activeElement);
    state.busy = true;
    say('');
    render();
    try {
      await action();
    } catch (error) {
      console.warn(error); // handled: the message below is the answer, not a bug report
      say(error.message, 'error');
    } finally {
      state.busy = false;
      render();
      focusByKey(key);
    }
  }

  function linkIsInAddressBar() {
    return Boolean(new URLSearchParams(location.search).get('oobCode'));
  }

  render(); // "Checking whether you are signed in." until the first answers arrive

  app.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    if (button.dataset.action === 'sign-in-google') attempt(() => signIn('google'));
    else if (button.dataset.action === 'sign-out') attempt(() => signOut());
  });

  // The email fields are real forms, so Enter works and the browser can fill the address in.
  app.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-action]');
    if (!form) return;
    event.preventDefault();
    if (state.busy) return;
    const address = form.elements.email.value.trim();
    state.email = address;

    if (form.dataset.action === 'send-link') {
      attempt(async () => {
        await signIn('email-link', address);
        say(`We sent a sign-in link to ${address}. Open it on this device to finish signing in.`);
      });
    } else if (form.dataset.action === 'finish-email') {
      attempt(async () => {
        if (!address) throw new Error('Enter your email address first.');
        try {
          const result = await completeEmailLinkSignIn(address);
          // 'signed-in': onAuthChange brings the account. 'not-a-link': the address bar no longer holds one.
          if (result !== 'needs-email') state.needsEmail = false;
          if (result === 'not-a-link') throw new Error('This page has no sign-in link. Ask for a new link.');
        } catch (error) {
          // firebase.js removes a used or expired link from the address bar; asking again would never work.
          if (!linkIsInAddressBar()) state.needsEmail = false;
          throw error;
        }
      });
    }
  });

  onAuthChange((user) => {
    state.user = user;
    state.authKnown = true;
    if (!user) state.combined = null;
    render();
  });

  // Never wait forever on the sign-in service: after a few seconds offer the sign-in buttons anyway.
  setTimeout(() => {
    if (!state.authKnown) {
      state.authKnown = true;
      render();
    }
  }, 6000);

  onSyncStatus((status) => {
    state.status = status;
    // progress.js reports `combined` once, on the first sign-in; keep it so a later status
    // (for example "synced") does not make the plate vanish.
    if (status.combined) state.combined = status.combined;
    render();
  });

  // Content data is only needed so progress.js can stamp dataVersion and mark Regions Visited; a
  // data problem must not stop anyone from signing in.
  try {
    const { items, dataVersion, sample } = await loadData();
    configureProgress({ items, dataVersion, sample });
  } catch (error) {
    console.error(error);
  }

  try {
    const result = await completeEmailLinkSignIn();
    if (result === 'needs-email') state.needsEmail = true;
  } catch (error) {
    console.warn(error); // handled: the message below is the answer, not a bug report
    say(error.message, 'error');
  } finally {
    state.linkPending = false;
    render();
  }
}

// ------------------------------------------------------------------ the page

async function startRegionPage() {
  await runGuarded(document.getElementById('app'), runRegionPage);
}

async function runRegionPage(app) {
  const guide = await loadGuide(app);
  if (!guide) return;
  const { regions, items, sample, itemsById, regionsById } = guide;

  const region = findRegion(app, regions, sample);
  if (!region) return;

  document.title = `${region.name} | Silksong guide`;

  const regionItems = items.filter((item) => item.regionId === region.id).sort((a, b) => a.step - b.step);

  // State for this page. showAll is session-only on purpose: Progress stores only ids, and
  // progress.js is the only module allowed to write localStorage, so a UI preference has no home.
  const state = { done: new Set(), visited: new Set(), showAll: false };

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
      nextRegion: nextRegionLink(),
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

  // The Region after this one in the guide's own order (`order`), for the link at the foot of the page.
  // null for the last Region: the page then offers the way back to all Regions instead.
  function nextRegionLink() {
    const ordered = [...regions].sort((a, b) => a.order - b.order);
    const next = ordered[ordered.findIndex((r) => r.id === region.id) + 1];
    return next ? { name: next.name, href: pageHref('region.html', { id: next.id }, sample) } : null;
  }

  // One row per entry, with everything render.js needs already decided.
  function entryViews() {
    const nextId = nextStep(state.done, items, regions);
    const goalId = loadGoal();
    return regionItems.map((item) => makeEntryView(item, guide, state.done, nextId, goalId));
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
          source: item.source,
          done: state.done.has(item.id),
          regionName: itemRegion ? itemRegion.name : item.regionId,
          regionHref: pageHref('region.html', { id: item.regionId }, sample),
        };
      });
  }

  // Collectibles come from requirements.js. It has no function for Tasks (they never count
  // toward totals), so the Tasks line is counted here from the Region's own entries.
  function countsForRegion() {
    return {
      collectibles: regionProgress(region.id, state.done, items),
      tasks: taskProgress(regionItems, state.done),
    };
  }

  // Re-renders the list and the side plate. The hero is only rebuilt when the Region flips
  // between Locked and Available, so the start thread plays once.
  function render() {
    const view = buildView();
    const focusKey = focusKeyBefore();

    if (!layout || shellMode !== view.mode) {
      layout = renderShell(app, view);
      shellMode = view.mode;
    }
    renderBody(layout, view);
    showCredit(view, region);

    // The elements were replaced, so put keyboard focus back on the same control.
    restoreFocus(app, focusKey);
  }

  app.addEventListener('click', (event) => handleToggleClick(event, guide, state));
  app.addEventListener('click', (event) => handleGoalClick(event, guide));

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
  await trackProgress(state, render);
  onGoalChange(() => render());
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
// and lists the Regions to choose from.
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
