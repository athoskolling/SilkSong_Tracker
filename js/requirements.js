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
// `items` may be left out (isRegionAvailable has no items argument); then `itemsById` is null and
// ids inside a Region's `requires` can only be checked against the Region ids.
function buildIndex(items, regions) {
  return {
    itemsById: items ? new Map(items.map((item) => [item.id, item])) : null,
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
//
// Every id in the list is checked here, done or not: a typo in `requires` is a data bug whatever the
// player has marked, and the list is being read either way. (The ids inside doneSet are not checked;
// Progress may keep ids that no longer exist, and that is fine.)
function requirementsOfItem(index, item) {
  const region = getRegion(index, item.regionId);
  const ids = [...(item.requires ?? []), ...(region.requires ?? [])];
  ids.forEach((id) => getItem(index, id));
  return ids;
}

// Without items we cannot tell a typo from a real entry id, but an id that is a Region id is wrong
// for sure: ids are globally unique and `requires` holds entry ids only.
function requirementsOfRegion(index, regionId) {
  const ids = getRegion(index, regionId).requires ?? [];
  for (const id of ids) {
    if (index.itemsById) getItem(index, id);
    else if (index.regionsById.has(id)) {
      throw new Error(`Unknown entry id "${id}": it is a Region id, and requires holds entry ids only.`);
    }
  }
  return ids;
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
      getItem(index, id); // a typo throws even when the id is done
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

// The Route rule, with an index already built (so nextStep and holdingYouUp reuse theirs).
// Start from the entries that are always on the Route (counted, a Task, or missable) and from what
// every Region needs; then walk down the chain, adding what each of them needs in turn. The Set
// of ids already added is also what stops a cycle: an id met twice is simply not walked twice.
function routeIdsWithIndex(index, items, regions) {
  const onRoute = new Set();
  const pending = [];

  for (const item of items) {
    if (isCounted(item) || item.kind === 'task' || item.missable === true) pending.push(item.id);
  }
  for (const region of regions) pending.push(...requirementsOfRegion(index, region.id));

  while (pending.length > 0) {
    const id = pending.pop();
    if (onRoute.has(id)) continue;
    const item = getItem(index, id); // an unknown id throws here, as everywhere in this module
    onRoute.add(id);
    pending.push(...requirementsOfItem(index, item));
  }
  return onRoute;
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

// Is this entry part of the completion counts? Only a Collectible the game itself counts toward
// 100 percent: kind "collectible" and `counts` not false (a Memento or a piece of Equipment has
// counts: false; ADR 0005). This is the one place the rule is written, so the Home numbers and the
// Region numbers cannot disagree. A Task is never counted, whatever its `counts` says. It looks
// nothing up, so it never throws.
export function isCounted(item) {
  return item.kind === 'collectible' && item.counts !== false;
}

// How many counted Collectibles in the Region are done, out of how many. Tasks never count, because
// they add nothing to the completion counts, and neither do Collectibles with counts: false.
// (Regions are not needed: an entry names its own Region.)
export function regionProgress(regionId, doneSet, items) {
  const collectibles = items.filter((item) => item.regionId === regionId && isCounted(item));
  const done = collectibles.filter((item) => doneSet.has(item.id)).length;
  return { done, total: collectibles.length };
}

// Rosaries the guide still expects the player to spend: the prices of shop entries (entries with a
// `price`) that are not done. `total` is all of them; `available` is the part the player can buy now
// (the entry is Available); `ids` lists those entries in route order. Entries without a price are
// ignored, and counted or not makes no difference (a Rosary is spent either way). Progress stores no
// Rosaries number (ADR 0005), so this is worked out from ids and prices every time.
export function rosariesToSpend(doneSet, items, regions) {
  const index = buildIndex(items, regions);
  const shopEntries = itemsInRouteOrder(items).filter(
    (item) => item.price !== undefined && item.price !== null && !doneSet.has(item.id)
  );

  let total = 0;
  let available = 0;
  for (const item of shopEntries) {
    total += item.price;
    if (itemIsAvailable(index, item.id, doneSet)) available += item.price;
  }
  return { total, available, ids: shopEntries.map((item) => item.id) };
}

// Which entries are on the Route? The one place that rule lives, so the Route page, "Next on the
// route", "Holding you up" and the Region cards cannot disagree. The data alone decides it (no
// doneSet), so the Route never changes shape as the player ticks things.
// On the Route: every counted Collectible, every Task, every missable entry, and whatever those
// entries and the Regions need, all the way down the chain. That last part makes the Set closed
// under requirements: nothing the Route needs is ever off it. Anything else (in practice a
// counts: false Collectible that nothing on the Route needs) is off the Route.
// A cycle does not loop and is not reported here; missingFor and the validator report it.
// Ending conditions are not read: they are Tasks or counted entries, already on the Route.
export function routeIds(items, regions) {
  return routeIdsWithIndex(buildIndex(items, regions), items, regions);
}

// Can the player enter the Region? True when every id in the Region's `requires` is done.
export function isRegionAvailable(regionId, doneSet, regions) {
  return regionIsAvailable(buildIndex(undefined, regions), regionId, doneSet);
}

// Like missingFor, but for a Region: what is still missing for it to open, following the chain
// (including the Regions of those entries), in route order.
export function missingForRegion(regionId, doneSet, regions, items) {
  return regionMissing(buildIndex(items, regions), regionId, doneSet);
}

// "Next on the route": the not-done, Available entry on the Route with the lowest `step`.
// An entry off the Route is never returned, even when it is Available and has the lowest `step`.
// null when nothing Available is left on the Route.
export function nextStep(doneSet, items, regions) {
  const index = buildIndex(items, regions);
  const onRoute = routeIdsWithIndex(index, items, regions);
  const next = itemsInRouteOrder(items).find(
    (item) => onRoute.has(item.id) && !doneSet.has(item.id) && itemIsAvailable(index, item.id, doneSet)
  );
  return next ? next.id : null;
}

// "Holding you up": the things the player can do right now that open the most doors.
//
// For every entry and Region that cannot be reached yet, look at what is missing for it and keep
// only the missing ids that are Available now. Each of those is a blocker, and `blocks` lists the
// entry and Region ids it holds up (entries in route order, then Regions in guide order).
// The biggest blockers come first; ties go to the lower `step`.
// Entries off the Route are skipped: they are never held up, and because the Route is closed under
// requirements they are never blockers either.
export function holdingYouUp(doneSet, items, regions) {
  const index = buildIndex(items, regions);
  const onRoute = routeIdsWithIndex(index, items, regions);
  const blocksByBlocker = new Map(); // blocker id -> ids it holds up

  function addBlockers(heldUpId, missingIds) {
    for (const blockerId of missingIds) {
      if (!itemIsAvailable(index, blockerId, doneSet)) continue;
      if (!blocksByBlocker.has(blockerId)) blocksByBlocker.set(blockerId, []);
      blocksByBlocker.get(blockerId).push(heldUpId);
    }
  }

  for (const item of itemsInRouteOrder(items)) {
    if (!onRoute.has(item.id)) continue;
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
