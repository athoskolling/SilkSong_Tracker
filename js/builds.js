// builds.js: the arithmetic behind the Build picker. How many slots does a Crest have now, what
// can the player place in them, and does a saved Build still fit?
// See docs/CONTRACTS.md section 2a for the rules this file follows.
//
// Like requirements.js, every function here is pure: the same input always gives the same output.
// Nothing reads localStorage, touches the page or fetches. The caller hands in everything:
//   doneSet     a Set of entry ids the player has marked done
//   items       the `items` array from items.json
//   crestSlots  Progress `crestSlots` (Crest id -> slots opened with Memory Lockets), or undefined
//   build       one saved Build from Progress `builds` (colour -> list of entry ids), or undefined
//
// The two ids that come from data (a Crest id) throw when they are wrong: that is a bug in the
// caller. Ids that come out of Progress (inside a saved Build, or in doneSet) never throw, because
// Progress may keep ids that no longer exist.

const COLOURS = ['red', 'blue', 'yellow', 'white'];

// ------------------------------------------------------------------ lookups

// Index once per public call instead of searching the array for every id.
function indexItems(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function getCrest(byId, crestId) {
  const crest = byId.get(crestId);
  if (!crest) throw new Error(`Unknown entry id "${crestId}": it is not in items.json.`);
  if (crest.type !== 'crest') {
    throw new Error(`Entry "${crestId}" is not a Crest (its type is "${crest.type}").`);
  }
  return crest;
}

// A count read from data or Progress. Anything that is not a whole number of 1 or more counts as 0,
// so a bad value can make a slot disappear but never makes the arithmetic return NaN.
function count(value) {
  return Number.isInteger(value) && value > 0 ? value : 0;
}

// ------------------------------------------------------------------ owning

// The ids the player owns, in the sense of section 2a: an entry in doneSet, or the entry an
// upgrade points at when that upgrade is in doneSet. An upgrade of an upgrade is followed all the way
// down (owning the second version means owning the first, and the base). `seen` stops a data cycle
// (a is an upgrade of b and b of a) from looping forever; the validator is the place that reports it.
// Ids in doneSet that are not in items are ignored.
function ownedIds(doneSet, byId) {
  const owned = new Set();
  for (const id of doneSet) {
    let item = byId.get(id);
    while (item && !owned.has(item.id)) {
      owned.add(item.id);
      item = item.upgradeOf ? byId.get(item.upgradeOf) : undefined;
    }
  }
  return owned;
}

// Which Build colours an entry fits. A Tool with `toolColor` fits that colour; a Silk Skill fits
// white. Everything else (a Tool without `toolColor`, a Crest, a Task) fits none.
function coloursFitting(item) {
  if (item.type === 'tool' && COLOURS.includes(item.toolColor) && item.toolColor !== 'white') {
    return [item.toolColor];
  }
  if (item.type === 'silk-skill') return ['white'];
  return [];
}

// ------------------------------------------------------------------ slots

// Slots now, per colour: the Crest's own, plus the ones the player opened (never more than the
// Crest can still open), plus what every done entry with `grantsSlots` adds to all Crests.
// null when the Crest has no `slots`: its layout is not in the guide yet, which is not the same
// as a Crest with zero slots.
export function slotsFor(crestId, doneSet, items, crestSlots) {
  const byId = indexItems(items);
  const crest = getCrest(byId, crestId);
  if (!crest.slots) return null;

  const result = {};
  for (const colour of COLOURS) {
    const own = count(crest.slots[colour]);
    // Without slotsMax nothing can be opened: there is no known limit to open up to.
    const room = crest.slotsMax ? Math.max(0, count(crest.slotsMax[colour]) - own) : 0;
    const opened = Math.min(count(crestSlots?.[crestId]?.[colour]), room);
    result[colour] = own + opened;
  }

  for (const id of doneSet) {
    const granted = byId.get(id)?.grantsSlots;
    if (!granted) continue;
    for (const colour of COLOURS) result[colour] += count(granted[colour]);
  }
  return result;
}

// ------------------------------------------------------------------ what can be placed

// What the player can place, per colour, as base ids ordered by `step`. An upgrade is never
// listed itself: owning it lists the base it upgrades (the Build stores the base id).
export function ownedByColour(doneSet, items) {
  const byId = indexItems(items);
  const owned = ownedIds(doneSet, byId);
  const result = { red: [], blue: [], yellow: [], white: [] };

  const ordered = [...items].sort((a, b) => a.step - b.step);
  for (const item of ordered) {
    if (!owned.has(item.id) || item.upgradeOf) continue;
    for (const colour of coloursFitting(item)) result[colour].push(item.id);
  }
  return result;
}

// ------------------------------------------------------------------ saved Builds

// Why a saved Build does not fit now; [] when it fits. Results come in the Build's order (red,
// blue, yellow, white; the order of ids inside a colour). One id can have several problems: each
// is its own result, in the order unknown, not-owned, wrong-colour, no-room.
//   unknown       the id is not in items (a retired id kept in Progress). Nothing else is checked
//                 for it except room, which depends only on its position.
//   not-owned     the player has neither this entry nor an upgrade of it marked done.
//   wrong-colour  the entry does not fit this colour (see coloursFitting).
//   no-room       its position is past the slots this Crest has in that colour now.
// The page shows these; it never removes a saved id by itself.
export function checkBuild(crestId, build, doneSet, items, crestSlots) {
  const byId = indexItems(items);
  getCrest(byId, crestId); // throws for a bad Crest id, even when the Build is empty
  const slots = slotsFor(crestId, doneSet, items, crestSlots);
  const owned = ownedIds(doneSet, byId);
  const problems = [];

  for (const colour of COLOURS) {
    const ids = build?.[colour];
    if (!Array.isArray(ids)) continue;

    ids.forEach((id, position) => {
      const item = byId.get(id);
      if (!item) {
        problems.push({ id, problem: 'unknown' });
      } else {
        if (!owned.has(id)) problems.push({ id, problem: 'not-owned' });
        if (!coloursFitting(item).includes(colour)) problems.push({ id, problem: 'wrong-colour' });
      }
      if (slots && position >= slots[colour]) problems.push({ id, problem: 'no-room' });
    });
  }
  return problems;
}
