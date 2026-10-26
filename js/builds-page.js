// builds-page.js: the Build picker (<body data-page="builds">). The player picks a Crest they own, says how
// many slots they opened on it, chooses an owned Tool or Silk Skill for each slot and saves the Build.
//
// Same split as the other pages: this file asks data.js, progress.js and builds.js, turns the answers into a
// plain "view" object, and render.js draws it (docs/CONTRACTS.md sections 2a and 5). main.js is loaded on this
// page too, and does what every page does (sample banner, the sync line in the footer, the email sign-in link).
//
// What is written where (ADR 0006): opened slots go through setCrestSlots, a saved Build through setBuild.
// Neither marks anything done. Everything the player changes before pressing "Save this Build" is a draft kept
// in memory only: it is not Progress, it is lost on reload, and "Undo changes" simply drops it.
//
// checkBuild's problems are shown on their slots and never remove anything. Only the player's own
// "Take out of this Build" changes the draft, and even that is not saved until they press Save.

import { loadData, pageHref } from './data.js';
import { configureProgress, loadProgress, setBuild, setCrestSlots, onProgressChange } from './progress.js';
import { slotsFor, ownedByColour, checkBuild } from './builds.js';
import { renderMessage, renderBuildsShell, renderBuildsBody } from './render.js';

const COLOURS = ['red', 'blue', 'yellow', 'white'];
const WORD = { red: 'Red', blue: 'Blue', yellow: 'Yellow', white: 'White' };

run();

async function run() {
  const app = document.getElementById('app');
  try {
    await runBuildsPage(app);
  } catch (error) {
    // A data bug throws on purpose (a wrong Crest id in builds.js, a cycle in `requires`); say so instead of a
    // blank page.
    console.error(error);
    document.title = 'Something went wrong | Silksong guide';
    renderMessage(app, {
      heading: 'Something went wrong',
      paragraphs: [`The page could not be built: ${error.message}`, 'Reload the page. If it happens again, tell the person who maintains the guide.'],
    });
  }
}

// ------------------------------------------------------------------ list helpers (pure)

// A colour's list as the player sees it is one entry per slot, '' for an empty slot. A saved Build has no
// holes (setBuild stores ids only), so a hole can only exist in a draft.
function trimEnd(list) {
  const out = list.slice();
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}

function compact(list) {
  return list.filter(Boolean);
}

// The list as the slots show it now: positions 0..n-1 are the slots; anything after is an id with no slot.
// An id with no slot moves into an empty slot when one exists (the player emptied one, or opened one): the
// Crest has room for it, so it must not keep saying "No slot for it". Only ever moves ids, never drops one.
function settle(list, slotCount) {
  const head = Array.from({ length: slotCount }, (_, i) => list[i] || '');
  const tail = list.slice(slotCount).filter(Boolean);
  for (let i = 0; i < head.length && tail.length; i += 1) {
    if (!head[i]) head[i] = tail.shift();
  }
  return trimEnd([...head, ...tail]);
}

function samePositions(a, b) {
  const x = trimEnd(a);
  const y = trimEnd(b);
  return x.length === y.length && x.every((id, i) => id === y[i]);
}

function differingPositions(a, b) {
  const length = Math.max(a.length, b.length);
  let count = 0;
  for (let i = 0; i < length; i += 1) if ((a[i] || '') !== (b[i] || '')) count += 1;
  return count;
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// ------------------------------------------------------------------ the page

async function runBuildsPage(app) {
  let data;
  try {
    data = await loadData();
  } catch (error) {
    document.title = 'Guide data not loaded | Silksong guide';
    renderMessage(app, { heading: 'The guide could not be loaded', paragraphs: [error.message] });
    return;
  }
  const { items, dataVersion, sample } = data;
  configureProgress({ items, dataVersion, sample });
  document.title = 'Builds | Silksong guide';

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const trackersHref = `${pageHref('trackers.html', {}, sample)}#crests`;

  // `drafts` holds the unsaved choices per Crest: Crest id -> { colour: [id or ''] }. Absent = nothing changed.
  const state = { done: new Set(), crestSlots: {}, builds: {}, selected: new URLSearchParams(location.search).get('crest'), drafts: {}, fallbacks: [] };

  function nameOf(id) {
    const found = itemsById.get(id);
    return found ? found.name : id;
  }

  // The Crests offered are the Crest entries marked done, in route order. An evolved Crest (`upgradeOf`) is not a second
  // Crest: a Build is saved on the base Crest (CONTRACTS section 1), and owning the evolution counts as owning the base,
  // as it does for Tools. So only base Crests are listed.
  function ownedCrests() {
    const evolved = new Set(items.filter((item) => item.type === 'crest' && item.upgradeOf && state.done.has(item.id)).map((item) => item.upgradeOf));
    return items
      .filter((item) => item.type === 'crest' && !item.upgradeOf && (state.done.has(item.id) || evolved.has(item.id)))
      .sort((a, b) => a.step - b.step);
  }

  // The selected Crest: the one the player chose if they still own it, else the first they own.
  function selectedCrest(owned) {
    return owned.find((crest) => crest.id === state.selected) || owned[0] || null;
  }

  function savedLists(crestId) {
    const saved = state.builds[crestId] || {};
    return Object.fromEntries(COLOURS.map((colour) => [colour, Array.isArray(saved[colour]) ? saved[colour].slice() : []]));
  }

  // Everything the page needs to know about one Crest's Build: its slots, the saved lists, the lists as shown
  // now (the draft when there is one) and whether they differ.
  function context(crest) {
    const slots = slotsFor(crest.id, state.done, items, state.crestSlots);
    if (!slots) return { crest, slots: null };
    const saved = savedLists(crest.id);
    const source = state.drafts[crest.id] || saved;
    const display = Object.fromEntries(COLOURS.map((colour) => [colour, settle(source[colour] || [], slots[colour])]));
    const dirty = COLOURS.some((colour) => !samePositions(display[colour], saved[colour]));
    // A draft that has come back to the saved Build (or that another device just saved) is no draft.
    if (state.drafts[crest.id] && !dirty) delete state.drafts[crest.id];
    const hasSaved = COLOURS.some((colour) => saved[colour].length > 0);
    return { crest, slots, saved, display, dirty, hasSaved };
  }

  // ---- the view

  function openedView(ctx) {
    const { crest, slots } = ctx;
    const limitKnown = Boolean(crest.slotsMax);
    const rows = COLOURS.map((colour) => {
      const base = Number.isInteger(crest.slots[colour]) ? crest.slots[colour] : 0;
      const room = limitKnown ? Math.max(0, (Number.isInteger(crest.slotsMax[colour]) ? crest.slotsMax[colour] : 0) - base) : 0;
      const stored = state.crestSlots[crest.id] && Number.isInteger(state.crestSlots[crest.id][colour]) ? state.crestSlots[crest.id][colour] : 0;
      const opened = Math.min(stored, room);
      const now = slots[colour];
      // What is left of the total once the Crest's own slots and the opened ones are taken off came from
      // entries the player has done (grantsSlots); builds.js adds those, so this page does not.
      const granted = Math.max(0, now - base - opened);
      const parts = [`${base} base`];
      if (granted > 0) parts.push(`${granted} from ${granted === 1 ? 'an entry' : 'entries'} you have done`);
      return {
        colour,
        label: WORD[colour],
        stepper: room > 0,
        opened,
        canDown: opened > 0,
        canUp: opened < room,
        note: room > 0 ? `Opened ${opened} of up to ${room}.` : 'No more can be opened on this Crest.',
        count: `${plural(now, `${colour} slot`, `${colour} slots`)} now (${parts.join(', ')}).`,
      };
    });
    return { limitKnown, rows };
  }

  function barView(ctx) {
    if (ctx.dirty) {
      const differ = COLOURS.reduce((sum, colour) => sum + differingPositions(ctx.display[colour], ctx.saved[colour]), 0);
      return {
        state: 'unsaved',
        strong: 'Not saved.',
        text: ctx.hasSaved ? `${plural(differ, 'slot differs', 'slots differ')} from the Build you saved.` : 'This Crest has no saved Build yet.',
        canSave: true,
        canUndo: true,
        canRemove: false,
      };
    }
    if (ctx.hasSaved) {
      return { state: 'saved', strong: 'Saved.', text: 'This is the Build saved for this Crest.', canSave: false, canUndo: false, canRemove: true };
    }
    return {
      state: 'none',
      strong: 'Nothing saved for this Crest yet.',
      text: 'Choose a Tool for each slot, then save.',
      canSave: false,
      canUndo: false,
      canRemove: false,
    };
  }

  // What checkBuild says, per colour (so a problem is tied to its colour and position), as sentences for the
  // slot it belongs to. Positions in the checked list are the compact ones, which settle() keeps equal to the
  // slot positions whenever an id has no slot.
  function problemsFor(ctx) {
    const byKey = new Map();
    let total = 0;
    for (const colour of COLOURS) {
      const ids = compact(ctx.display[colour]);
      if (ids.length === 0) continue;
      const found = checkBuild(ctx.crest.id, { [colour]: ids }, state.done, items, state.crestSlots);
      for (const { id, problem } of found) {
        total += 1;
        const slotCount = ctx.slots[colour];
        const text = {
          unknown: 'This is no longer in the guide.',
          'not-owned': 'You have not marked this as done yet.',
          'wrong-colour': `This does not fit a ${colour} slot.`,
          'no-room': `This Crest has no room for it: it has ${plural(slotCount, `${colour} slot`, `${colour} slots`)} now.`,
        }[problem];
        const key = `${colour}:${id}`;
        byKey.set(key, byKey.has(key) ? `${byKey.get(key)} ${text}` : text);
      }
    }
    return { byKey, total };
  }

  function coloursView(ctx, owned) {
    const { slots, display } = ctx;
    const { byKey } = problemsFor(ctx);

    // Where each id sits now, so a Tool already placed in another slot is listed there as unavailable (an id
    // may appear once in a Build).
    const placed = new Map();
    for (const colour of COLOURS) {
      display[colour].forEach((id, i) => {
        if (id) placed.set(id, i < slots[colour] ? `${colour} slot ${i + 1}` : `${colour}, no slot`);
      });
    }

    const result = [];
    for (const colour of COLOURS) {
      const slotCount = slots[colour];
      const list = display[colour];
      const overflow = list.slice(slotCount).filter(Boolean);
      if (slotCount === 0 && overflow.length === 0) continue;

      const rows = [];
      for (let i = 0; i < slotCount; i += 1) {
        const value = list[i] || '';
        const ids = owned[colour].slice();
        if (value && !ids.includes(value)) ids.unshift(value); // a saved id that is not offered any more stays visible
        const options = [{ value: '', label: 'Empty slot', selected: !value, disabled: false }];
        for (const id of ids) {
          const elsewhere = id !== value && placed.has(id);
          options.push({
            value: id,
            label: elsewhere ? `${nameOf(id)} (in ${placed.get(id)})` : nameOf(id),
            selected: id === value,
            disabled: elsewhere,
          });
        }
        rows.push({
          key: `${colour}-${i}`,
          colour,
          index: i,
          label: `${WORD[colour]} slot ${i + 1}`,
          options,
          filled: Boolean(value),
          problem: value ? byKey.get(`${colour}:${value}`) || null : null,
          item: value ? itemsById.get(value) || null : null,
        });
      }
      for (const id of overflow) {
        rows.push({ key: `${colour}-x-${id}`, colour, overflow: true, id, name: nameOf(id), problem: byKey.get(`${colour}:${id}`) || null });
      }

      const filled = list.slice(0, slotCount).filter(Boolean).length;
      const kind = colour === 'white' ? 'Silk Skill' : 'Tool';
      let hint;
      if (owned[colour].length > 0) hint = `Choose from the ${kind}s you own.`;
      else hint = colour === 'white' ? 'You do not own a Silk Skill yet.' : `You do not own a ${colour} Tool yet.`;
      result.push({
        colour,
        title: `${WORD[colour]} slots`,
        meta: `${plural(slotCount, 'slot', 'slots')}. ${filled} filled. ${hint}`,
        rows,
      });
    }
    return result;
  }

  function crestView(crest, owned) {
    const ctx = context(crest);
    if (!ctx.slots) return { id: crest.id, name: crest.name, layoutUnknown: true };

    const total = COLOURS.reduce((sum, colour) => sum + ctx.slots[colour], 0);
    const parts = COLOURS.filter((colour) => ctx.slots[colour] > 0).map((colour) => `${ctx.slots[colour]} ${colour}`);
    const meta = parts.length ? `${plural(total, 'slot', 'slots')} now: ${parts.join(', ')}.` : `${plural(total, 'slot', 'slots')} now.`;

    const problems = problemsFor(ctx).total;
    let problemsView = null;
    if (problems > 0) {
      problemsView = {
        title: !ctx.dirty && ctx.hasSaved ? 'This saved Build no longer fits' : 'This Build does not fit',
        text: `${problems === 1 ? '1 problem, shown' : `${problems} problems, each shown`} on its slot below. Nothing was removed. Change a slot, mark a missing Tool as done in its tracker, or open more slots.`,
      };
    }

    return {
      id: crest.id,
      name: crest.name,
      meta,
      opened: openedView(ctx),
      bar: barView(ctx),
      problems: problemsView,
      colours: coloursView(ctx, owned),
    };
  }

  function buildView() {
    const crests = ownedCrests();
    if (crests.length === 0) {
      return {
        noCrest: true,
        intro: 'Pick a Crest you own to see its slots and the Tools you own that could go in each.',
        trackersHref,
      };
    }
    const selected = selectedCrest(crests);
    state.selected = selected.id;
    const owned = ownedByColour(state.done, items);
    return {
      intro: 'Pick a Crest you own, choose a Tool you own for each slot, and save the Build.',
      trackersHref,
      ownedCount: COLOURS.reduce((sum, colour) => sum + owned[colour].length, 0),
      crests: crests.map((crest) => {
        const slots = slotsFor(crest.id, state.done, items, state.crestSlots);
        const total = slots ? COLOURS.reduce((sum, colour) => sum + slots[colour], 0) : 0;
        return {
          id: crest.id,
          name: crest.name,
          selected: crest.id === selected.id,
          sub: slots ? `${plural(total, 'slot', 'slots')} now` : 'Not in the guide yet',
          saved: Boolean(state.builds[crest.id] && COLOURS.some((colour) => (state.builds[crest.id][colour] || []).length > 0)),
        };
      }),
      crest: crestView(selected, owned),
    };
  }

  // The elements are replaced on every render, so put keyboard focus back on the same control. When that
  // control is gone or disabled (the Save button after saving, a stepper at its limit), try the fallbacks the
  // caller names, in order. Focus is only moved when it was on one of the page's controls to begin with, so a
  // change that arrives from another device never steals it.
  function render(fallbacks = []) {
    const active = document.activeElement;
    const key = active && active.dataset ? active.dataset.focusKey : null;
    renderBuildsBody(parts, buildView());
    if (!key) return;
    // `state.fallbacks` covers the render that setBuild and setCrestSlots trigger through onProgressChange while
    // their promise is still pending: it happens before the caller's own render and must not lose focus either.
    for (const candidate of [key, ...fallbacks, ...state.fallbacks]) {
      const again = app.querySelector(`[data-focus-key="${CSS.escape(candidate)}"]`);
      if (again && !again.disabled) {
        again.focus();
        return;
      }
    }
  }

  // ---- changes

  // Changes the Build's draft for one Crest. `change(lists)` edits copies of the lists as they are shown.
  function editDraft(ctx, change) {
    const lists = Object.fromEntries(COLOURS.map((colour) => [colour, ctx.display[colour].slice()]));
    change(lists);
    state.drafts[ctx.crest.id] = Object.fromEntries(COLOURS.map((colour) => [colour, trimEnd(lists[colour])]));
  }

  function currentContext() {
    const crest = selectedCrest(ownedCrests());
    return crest ? context(crest) : null;
  }

  // One sentence on where the Build stands, for the live region.
  function standing(ctx) {
    const bar = barView(ctx);
    return `${bar.strong} ${bar.text}`;
  }

  function pickSlot(select) {
    const ctx = currentContext();
    if (!ctx || !ctx.slots) return;
    const { colour } = select.dataset;
    const index = Number(select.dataset.index);
    const value = select.value;
    editDraft(ctx, (lists) => {
      while (lists[colour].length <= index) lists[colour].push('');
      lists[colour][index] = value;
    });
    render();
    const after = currentContext();
    announce(`${WORD[colour]} slot ${index + 1}: ${value ? nameOf(value) : 'empty'}. ${standing(after)}`);
  }

  function takeOut(button) {
    const ctx = currentContext();
    if (!ctx || !ctx.slots) return;
    const { colour, id } = button.dataset;
    editDraft(ctx, (lists) => {
      const at = lists[colour].indexOf(id);
      if (at >= 0) lists[colour][at] = '';
    });
    render(['save', 'status']);
    announce(`${nameOf(id)} taken out of this Build. ${standing(currentContext())}`);
  }

  async function save() {
    const ctx = currentContext();
    if (!ctx || !ctx.slots || !ctx.dirty) return;
    const build = {};
    for (const colour of COLOURS) {
      const ids = compact(ctx.display[colour]);
      if (ids.length) build[colour] = ids;
    }
    const empty = Object.keys(build).length === 0;
    // Empty slots between filled ones close up when saved: a saved Build is a list per colour, not a row of slots.
    const closedUp = COLOURS.some((colour) => ctx.display[colour].length !== compact(ctx.display[colour]).length);
    // The draft goes first: setBuild notifies before it resolves, and that render must already show the saved
    // Build. If saving fails the draft comes back, so nothing the player chose is lost.
    const draft = state.drafts[ctx.crest.id];
    delete state.drafts[ctx.crest.id];
    state.fallbacks = ['remove', 'status'];
    try {
      await setBuild(ctx.crest.id, empty ? null : build);
    } catch (error) {
      console.error(error);
      state.drafts[ctx.crest.id] = draft;
      state.fallbacks = [];
      render();
      announce('That change could not be saved. Try again.');
      return;
    }
    render();
    state.fallbacks = [];
    if (empty) announce(`The saved Build for ${ctx.crest.name} was removed. It had no Tools left.`);
    else announce(`Build saved for ${ctx.crest.name}.${closedUp ? ' Empty slots between filled ones were closed up.' : ''}`);
  }

  function undo() {
    const ctx = currentContext();
    if (!ctx || !ctx.slots) return;
    delete state.drafts[ctx.crest.id];
    render(['status']);
    announce(`Changes undone. ${standing(currentContext())}`);
  }

  async function remove() {
    const ctx = currentContext();
    if (!ctx || !ctx.slots || !ctx.hasSaved) return;
    state.fallbacks = ['status'];
    try {
      await setBuild(ctx.crest.id, null);
    } catch (error) {
      console.error(error);
      state.fallbacks = [];
      announce('That change could not be saved. Try again.');
      return;
    }
    delete state.drafts[ctx.crest.id];
    render();
    state.fallbacks = [];
    announce(`Saved Build removed for ${ctx.crest.name}.`);
  }

  async function step(button) {
    const ctx = currentContext();
    if (!ctx || !ctx.slots) return;
    const { colour, dir } = button.dataset;
    const row = openedView(ctx).rows.find((r) => r.colour === colour);
    if (!row || !row.stepper) return;
    const value = row.opened + (dir === 'up' ? 1 : -1);
    if (value < 0 || (dir === 'up' && !row.canUp)) return;
    // setCrestSlots replaces the Crest's whole entry, so write the other colours back as they are.
    const next = { ...(state.crestSlots[ctx.crest.id] || {}), [colour]: value };
    // A stepper that reaches its limit is disabled afterwards; focus moves to the other one instead of being lost.
    state.fallbacks = [`step:${colour}:${dir === 'up' ? 'down' : 'up'}`];
    try {
      await setCrestSlots(ctx.crest.id, next);
    } catch (error) {
      console.error(error);
      state.fallbacks = [];
      announce('That change could not be saved. Try again.');
      return;
    }
    render();
    state.fallbacks = [];
    const slots = slotsFor(ctx.crest.id, state.done, items, state.crestSlots);
    announce(`Opened ${colour} slots: ${value}. ${plural(slots[colour], `${colour} slot`, `${colour} slots`)} now.`);
  }

  function pickCrest(input) {
    state.selected = input.value;
    // The address keeps the choice, so a reload (or a link) opens the same Crest. replaceState adds no history entry.
    const query = new URLSearchParams(location.search);
    query.set('crest', input.value);
    history.replaceState(null, '', `${location.pathname}?${query.toString()}${location.hash}`);
    render();
    const ctx = currentContext();
    announce(ctx && ctx.slots ? `Showing ${ctx.crest.name}. ${plural(COLOURS.reduce((s, c) => s + ctx.slots[c], 0), 'slot', 'slots')} now.` : `Showing ${nameOf(input.value)}. Its slots are not in the guide yet.`);
  }

  // ---- start

  const parts = renderBuildsShell(app);
  const layout = parts.layout;

  const progress = await loadProgress();
  state.done = progress.done;
  state.crestSlots = progress.crestSlots || {};
  state.builds = progress.builds || {};
  // Every change, including one that arrives from another device, comes through here. A draft is kept: an
  // unsaved choice on this device is not thrown away because something else changed.
  onProgressChange((next) => {
    state.done = next.done;
    state.crestSlots = next.crestSlots || {};
    state.builds = next.builds || {};
    render();
  });

  app.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target || !layout.contains(target)) return;
    const action = target.dataset.action;
    if (action === 'save') save();
    else if (action === 'undo') undo();
    else if (action === 'remove') remove();
    else if (action === 'take-out') takeOut(target);
    else if (action === 'step') step(target);
  });

  app.addEventListener('change', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    if (target.dataset.action === 'pick-slot') pickSlot(target);
    else if (target.dataset.action === 'pick-crest') pickCrest(target);
  });

  render();
}

function announce(text) {
  const live = document.getElementById('announcer');
  live.textContent = '';
  live.textContent = text;
}
