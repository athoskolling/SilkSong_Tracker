// main.js: picks behaviour from <body data-page="...">: home (a temporary redirect until the real
// Home arrives in Phase 2), region and account (sign-in only for now). The Route page arrives in Phase 2.
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
  joinNames,
  syncText,
  renderAccountShell,
  renderAccountPlate,
  setAccountMessage,
} from './render.js';

const page = document.body.dataset.page;
startPage();

// What every page does, then what this page does.
function startPage() {
  if (isSampleMode()) document.getElementById('banner').hidden = false;

  // The footer line says where Progress is, on every page.
  onSyncStatus((status) => {
    document.getElementById('sync-status').textContent = syncText(status);
  });

  if (page === 'home') startHomePage();
  else if (page === 'account') startAccountPage();
  else if (page === 'region') {
    startRegionPage();
    finishEmailLink(); // not awaited: a normal page load must not wait on it
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
    console.error(error);
    announce(error.message); // already written for people
  }
  return false;
}

// -------------------------------------------------------------------- home page

// TEMPORARY until Home is built in Phase 2: send the visitor to the first Region. "First" is the
// Region with the lowest `order` (data.js sorts by it), read from data/, so nothing here names a
// Region and it keeps working when the guide grows.
async function startHomePage() {
  const app = document.getElementById('app');
  try {
    if (await finishEmailLink()) return;
    const data = await loadOrExplain(app);
    if (!data) return;
    const first = data.regions[0];
    if (!first) {
      renderMessage(app, { heading: 'No regions yet', paragraphs: ['The guide has no regions yet.'] });
      return;
    }
    const href = pageHref('region.html', { id: first.id }, data.sample);
    document.getElementById('open-guide').setAttribute('href', href);
    // replace, not assign: Back from the Region page must not land here and bounce forward again.
    location.replace(href);
  } catch (error) {
    console.error(error);
    renderMessage(app, {
      heading: 'Something went wrong',
      paragraphs: [`The page could not be built: ${error.message}`, 'Reload the page. If it happens again, tell the person who maintains the guide.'],
    });
  }
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
      console.error(error);
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
    const { items, dataVersion } = await loadData();
    configureProgress({ items, dataVersion });
  } catch (error) {
    console.error(error);
  }

  try {
    const result = await completeEmailLinkSignIn();
    if (result === 'needs-email') state.needsEmail = true;
  } catch (error) {
    console.error(error);
    say(error.message, 'error');
  } finally {
    state.linkPending = false;
    render();
  }
}

// ------------------------------------------------------------------ the page

async function startRegionPage() {
  const app = document.getElementById('app');

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
