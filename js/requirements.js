// requirements.js: answers "what can the player do now, and what is standing in the way?".
// See docs/CONTRACTS.md section 2 for the rules this file follows.
//
// Every function here is pure: the same input always gives the same output. Nothing reads
// localStorage, touches the page or fetches. The caller hands in everything:
//   doneSet  a Set of entry ids the player has marked done
//   items    the `items` array from items.json
//   regions  the `regions` array from regions.json
//
// Data bugs (an unknown id, a cycle in `requires`) throw an Error on purpose. A page that says
// "something is wrong with the data" is better than a guide that silently shows wrong answers.

// ------------------------------------------------------------------ lookups

// Looking an id up in an array every time is slow and repetitive, so we index the arrays once
// per public call. `items` and `regions` are not changed.
function buildIndex(items, regions) {
  return {
    itemsById: new Map(items.map((item) => [item.id, item])),
    regionsById: new Map(regions.map((region) => [region.id, region])),
  };
}

function getItem(index, id) {
  const item = index.itemsById.get(id);
  if (!item) throw new Error(`Unknown entry id "${id}": it is not in items.json.`);
  return item;
}

function getRegion(index, id) {
  const region = index.regionsById.get(id);
  if (!region) throw new Error(`Unknown Region id "${id}": it is not in regions.json.`);
  return region;
}

// ------------------------------------------------------------------ requirements

// An entry can only be reached inside its Region, so its real requirements are its own
// `requires` plus its Region's `requires`. Keeping that rule here means the data never has to
// copy a Region's requirements onto every entry.
function requirementsOfItem(index, item) {
  const region = getRegion(index, item.regionId);
  return [...(item.requires ?? []), ...(region.requires ?? [])];
}

function requirementsOfRegion(index, regionId) {
  return getRegion(index, regionId).requires ?? [];
}

// The chain walk. Starting from a list of requirement ids, collect every entry id that is not
// done and stands in the way, following each one's own requirements in turn.
//
//   - An id already in doneSet is skipped and not walked further: the player has it, so
//     whatever came before it no longer matters (even if they marked it out of order).
//   - An id reached by two routes (a "diamond") is collected once: `finished` remembers it.
//   - A cycle (a needs b, b needs a) would walk forever. `path` holds the ids we are inside of
//     right now; meeting one of them again means we went in a circle, so we throw.
//
// `startId` is the entry we are asking about (omit it for a Region). It goes on the path first so
// that "a needs b, b needs a" is caught when asking about a, and a Region that needs an entry
// inside itself is caught too, because that entry's requirements include the Region's.
function walkMissing(index, doneSet, startRequires, startId) {
  const missing = new Set();
  const finished = new Set();
  const path = startId === undefined ? [] : [startId];

  function visit(ids) {
    for (const id of ids) {
      if (doneSet.has(id)) continue;
      if (path.includes(id)) {
        throw new Error(`Cycle in requires: ${[...path.slice(path.indexOf(id)), id].join(' -> ')}.`);
      }
      if (finished.has(id)) continue;

      const item = getItem(index, id);
      path.push(id);
      visit(requirementsOfItem(index, item));
      path.pop();

      finished.add(id);
      missing.add(id);
    }
  }

  visit(startRequires);
  return missing;
}

// Ids come out of the walk in discovery order; the guide wants them in route order.
function sortByStep(index, ids) {
  return [...ids].sort((a, b) => getItem(index, a).step - getItem(index, b).step);
}

// ------------------------------------------------------------------ internal checks (take an index)

function itemIsAvailable(index, itemId, doneSet) {
  const item = getItem(index, itemId);
  return requirementsOfItem(index, item).every((id) => doneSet.has(id));
}

function regionIsAvailable(index, regionId, doneSet) {
  return requirementsOfRegion(index, regionId).every((id) => doneSet.has(id));
}

function itemMissing(index, itemId, doneSet) {
  const item = getItem(index, itemId);
  const missing = walkMissing(index, doneSet, requirementsOfItem(index, item), itemId);
  return sortByStep(index, missing);
}

function regionMissing(index, regionId, doneSet) {
  const missing = walkMissing(index, doneSet, requirementsOfRegion(index, regionId));
  return sortByStep(index, missing);
}

// All entries, lowest `step` first. Does not change the caller's array.
function itemsInRouteOrder(items) {
  return [...items].sort((a, b) => a.step - b.step);
}

// ------------------------------------------------------------------ public functions

// Can the player do this entry now? True when every requirement (the entry's own and its
// Region's) is done. No requirements at all means yes.
export function isAvailable(itemId, doneSet, items, regions) {
  return itemIsAvailable(buildIndex(items, regions), itemId, doneSet);
}

// Which entries still stand between the player and this one? Each id once, in route order.
// An empty array means nothing is missing.
export function missingFor(itemId, doneSet, items, regions) {
  return itemMissing(buildIndex(items, regions), itemId, doneSet);
}

// How many Collectibles in the Region are done, out of how many. Tasks never count, because they
// add nothing to the completion counts. (Regions are not needed: an entry names its own Region.)
export function regionProgress(regionId, doneSet, items) {
  const collectibles = items.filter((item) => item.regionId === regionId && item.kind === 'collectible');
  const done = collectibles.filter((item) => doneSet.has(item.id)).length;
  return { done, total: collectibles.length };
}

// Can the player enter the Region? True when every id in the Region's `requires` is done.
export function isRegionAvailable(regionId, doneSet, regions) {
  return regionIsAvailable(buildIndex([], regions), regionId, doneSet);
}

// Like missingFor, but for a Region: what is still missing for it to open, following the chain
// (including the Regions of those entries), in route order.
export function missingForRegion(regionId, doneSet, regions, items) {
  return regionMissing(buildIndex(items, regions), regionId, doneSet);
}

// "Next on the route": the not-done, Available entry with the lowest `step`.
// null when nothing Available is left.
export function nextStep(doneSet, items, regions) {
  const index = buildIndex(items, regions);
  const next = itemsInRouteOrder(items).find(
    (item) => !doneSet.has(item.id) && itemIsAvailable(index, item.id, doneSet)
  );
  return next ? next.id : null;
}

// "Holding you up": the things the player can do right now that open the most doors.
//
// For every entry and Region that cannot be reached yet, look at what is missing for it and keep
// only the missing ids that are Available now. Each of those is a blocker, and `blocks` lists the
// entry and Region ids it holds up (entries in route order, then Regions in guide order).
// The biggest blockers come first; ties go to the lower `step`.
export function holdingYouUp(doneSet, items, regions) {
  const index = buildIndex(items, regions);
  const blocksByBlocker = new Map(); // blocker id -> ids it holds up

  function addBlockers(heldUpId, missingIds) {
    for (const blockerId of missingIds) {
      if (!itemIsAvailable(index, blockerId, doneSet)) continue;
      if (!blocksByBlocker.has(blockerId)) blocksByBlocker.set(blockerId, []);
      blocksByBlocker.get(blockerId).push(heldUpId);
    }
  }

  for (const item of itemsInRouteOrder(items)) {
    if (doneSet.has(item.id) || itemIsAvailable(index, item.id, doneSet)) continue;
    addBlockers(item.id, itemMissing(index, item.id, doneSet));
  }

  const regionsInOrder = [...regions].sort((a, b) => a.order - b.order);
  for (const region of regionsInOrder) {
    if (regionIsAvailable(index, region.id, doneSet)) continue;
    addBlockers(region.id, regionMissing(index, region.id, doneSet));
  }

  return [...blocksByBlocker]
    .map(([id, blocks]) => ({ id, blocks }))
    .sort((a, b) => b.blocks.length - a.blocks.length || getItem(index, a.id).step - getItem(index, b.id).step);
}
