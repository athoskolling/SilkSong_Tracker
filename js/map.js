// map.js: the arithmetic of the Region map (docs/MAP-PROPOSAL.md). Pure functions: same input, same output.
// They never read Progress, never touch the DOM and never fetch, so tests/map.test.js can check them alone.
//
// A Pin is { itemId, x, y }: where an entry sits on its Region's map, as percents (0 to 100) of the image's
// width and height from the top left. Whether the entry is done is never stored here; it comes from the
// done Set that progress.js hands the page.

// Keeps a number inside the image. A click on the very edge can land a hair outside after rounding.
export function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

// One decimal is about a pixel on a 1000 pixel wide image, and keeps map.json readable in a diff.
export function roundPercent(value) {
  return Math.round(clampPercent(value) * 10) / 10;
}

// A click at (clientX, clientY) on an element whose box is `rect` ({ left, top, width, height }, as
// getBoundingClientRect gives) -> { x, y } in percents. null when the box has no size (an image that
// has not loaded), because there is no honest answer then.
export function pointFromClick(rect, clientX, clientY) {
  if (!rect || !(rect.width > 0) || !(rect.height > 0)) return null;
  return {
    x: roundPercent(((clientX - rect.left) / rect.width) * 100),
    y: roundPercent(((clientY - rect.top) / rect.height) * 100),
  };
}

// The Pins that belong on one Region's map: those whose entry is in that Region. The Region comes from the
// entry (itemsById), never from the Pin, so a Pin cannot disagree with its entry. A Pin for an entry that
// is not in the data is left out. File order is kept.
export function pinsForRegion(regionId, pins, itemsById) {
  return pins.filter((pin) => {
    const item = itemsById.get(pin.itemId);
    return item !== undefined && item.regionId === regionId;
  });
}

// What the map draws: every Pin whose entry is not done. With showDone, done entries are drawn too, marked
// `done: true`, so the page can dim them. The Pin objects are copied, never changed.
export function visiblePins(pins, doneSet, showDone = false) {
  const result = [];
  for (const pin of pins) {
    const done = doneSet.has(pin.itemId);
    if (done && !showDone) continue;
    result.push({ itemId: pin.itemId, x: pin.x, y: pin.y, done });
  }
  return result;
}

// A new list in which `itemId` has this position: replaced in place when it already had a Pin (so the file
// order does not jump), added at the end otherwise. One Pin per entry.
export function upsertPin(pins, itemId, x, y) {
  const next = { itemId, x: roundPercent(x), y: roundPercent(y) };
  if (!pins.some((pin) => pin.itemId === itemId)) return [...pins.map((pin) => ({ ...pin })), next];
  return pins.map((pin) => (pin.itemId === itemId ? next : { ...pin }));
}

export function removePin(pins, itemId) {
  return pins.filter((pin) => pin.itemId !== itemId).map((pin) => ({ ...pin }));
}

// The text of data/map.json for a list of maps and Pins: Pins in route order (by the entry's `step`), so
// two people placing Pins in a different order still produce the same file. Pins for entries that are not in
// `items` go last, in their own order, and are kept: dropping them silently would lose work. Two-space
// indentation and a final newline, like the other files in data/.
export function serializeMap({ dataVersion, maps, pins }, items) {
  const stepOf = new Map(items.map((item) => [item.id, item.step]));
  const known = pins.filter((pin) => stepOf.has(pin.itemId)).sort((a, b) => stepOf.get(a.itemId) - stepOf.get(b.itemId));
  const unknown = pins.filter((pin) => !stepOf.has(pin.itemId));
  const body = {
    dataVersion,
    maps: maps.map((map) => ({ regionId: map.regionId, image: map.image, credit: map.credit, alt: map.alt })),
    pins: [...known, ...unknown].map((pin) => ({ itemId: pin.itemId, x: pin.x, y: pin.y })),
  };
  return JSON.stringify(body, null, 2) + '\n';
}
