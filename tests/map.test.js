// Tests for js/map.js, written against docs/MAP-PROPOSAL.md ("Behaviour" and "data/map.json").
// Fixtures are small invented objects written in this file. They never read data/ or data/sample/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampPercent, roundPercent, pointFromClick, pinsForRegion, visiblePins, upsertPin, removePin, serializeMap } from '../js/map.js';

const items = [
  { id: 'a', regionId: 'r1', step: 1 },
  { id: 'b', regionId: 'r1', step: 2 },
  { id: 'c', regionId: 'r2', step: 3 },
];
const itemsById = new Map(items.map((item) => [item.id, item]));
const pins = [
  { itemId: 'b', x: 20, y: 30 },
  { itemId: 'a', x: 10, y: 15.5 },
  { itemId: 'c', x: 70, y: 80 },
];

test('clampPercent keeps a number inside 0 to 100 and maps a non-number to 0', () => {
  assert.equal(clampPercent(-4), 0);
  assert.equal(clampPercent(104), 100);
  assert.equal(clampPercent(33.3), 33.3);
  assert.equal(clampPercent(NaN), 0);
  assert.equal(clampPercent(undefined), 0);
});

test('roundPercent rounds to one decimal', () => {
  assert.equal(roundPercent(12.34), 12.3);
  assert.equal(roundPercent(12.36), 12.4);
  assert.equal(roundPercent(100.04), 100);
});

test('pointFromClick turns a click into percents of the box', () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };
  assert.deepEqual(pointFromClick(rect, 300, 150), { x: 50, y: 50 });
  assert.deepEqual(pointFromClick(rect, 100, 50), { x: 0, y: 0 });
  assert.deepEqual(pointFromClick(rect, 500, 250), { x: 100, y: 100 });
});

test('pointFromClick clamps a click just outside the box', () => {
  const rect = { left: 0, top: 0, width: 100, height: 100 };
  assert.deepEqual(pointFromClick(rect, -5, 130), { x: 0, y: 100 });
});

test('pointFromClick gives null for a box with no size', () => {
  assert.equal(pointFromClick({ left: 0, top: 0, width: 0, height: 50 }, 1, 1), null);
  assert.equal(pointFromClick(null, 1, 1), null);
});

test('pinsForRegion takes the Region from the entry and keeps file order', () => {
  assert.deepEqual(pinsForRegion('r1', pins, itemsById).map((p) => p.itemId), ['b', 'a']);
  assert.deepEqual(pinsForRegion('r2', pins, itemsById).map((p) => p.itemId), ['c']);
  assert.deepEqual(pinsForRegion('r3', pins, itemsById), []);
});

test('pinsForRegion leaves out a Pin whose entry is not in the data', () => {
  const withGhost = [...pins, { itemId: 'gone', x: 1, y: 1 }];
  assert.equal(pinsForRegion('r1', withGhost, itemsById).length, 2);
});

test('visiblePins hides a Pin once its entry is done', () => {
  const shown = visiblePins(pins, new Set(['a']));
  assert.deepEqual(shown.map((p) => p.itemId), ['b', 'c']);
  assert.ok(shown.every((p) => p.done === false));
});

test('visiblePins brings the Pin back when the entry is no longer done', () => {
  assert.equal(visiblePins(pins, new Set(['a'])).length, 2);
  assert.equal(visiblePins(pins, new Set()).length, 3);
});

test('visiblePins with showDone keeps done Pins and marks them', () => {
  const shown = visiblePins(pins, new Set(['a']), true);
  assert.equal(shown.length, 3);
  assert.equal(shown.find((p) => p.itemId === 'a').done, true);
  assert.equal(shown.find((p) => p.itemId === 'b').done, false);
});

test('visiblePins ignores ids in the done Set that have no Pin, and does not change its input', () => {
  const copy = JSON.parse(JSON.stringify(pins));
  visiblePins(pins, new Set(['nothing-here']));
  assert.deepEqual(pins, copy);
});

test('upsertPin adds a Pin at the end, rounded', () => {
  const next = upsertPin(pins, 'z', 5.04, 6.06);
  assert.deepEqual(next.at(-1), { itemId: 'z', x: 5, y: 6.1 });
  assert.equal(next.length, 4);
});

test('upsertPin moves an existing Pin without changing the order', () => {
  const next = upsertPin(pins, 'a', 40, 41);
  assert.deepEqual(next.map((p) => p.itemId), ['b', 'a', 'c']);
  assert.deepEqual(next[1], { itemId: 'a', x: 40, y: 41 });
});

test('upsertPin and removePin return new lists and leave the input alone', () => {
  const copy = JSON.parse(JSON.stringify(pins));
  upsertPin(pins, 'a', 1, 1);
  removePin(pins, 'a');
  assert.deepEqual(pins, copy);
});

test('removePin removes only that entry, and an unknown id changes nothing', () => {
  assert.deepEqual(removePin(pins, 'a').map((p) => p.itemId), ['b', 'c']);
  assert.equal(removePin(pins, 'nothing').length, 3);
});

test('serializeMap orders Pins by the entry step and ends with a newline', () => {
  const text = serializeMap({ dataVersion: 7, maps: [{ regionId: 'r1', image: 'img/map/r1.jpg', credit: 'c', alt: 'd' }], pins }, items);
  assert.ok(text.endsWith('}\n'));
  const parsed = JSON.parse(text);
  assert.equal(parsed.dataVersion, 7);
  assert.deepEqual(parsed.pins.map((p) => p.itemId), ['a', 'b', 'c']);
});

test('serializeMap is the same for the same Pins placed in a different order', () => {
  const maps = [{ regionId: 'r1', image: 'img/map/r1.jpg', credit: 'c', alt: 'd' }];
  const one = serializeMap({ dataVersion: 1, maps, pins }, items);
  const two = serializeMap({ dataVersion: 1, maps, pins: [...pins].reverse() }, items);
  assert.equal(one, two);
});

test('serializeMap keeps a Pin whose entry is not in the data, after the others', () => {
  const text = serializeMap({ dataVersion: 1, maps: [], pins: [{ itemId: 'gone', x: 1, y: 2 }, ...pins] }, items);
  assert.deepEqual(JSON.parse(text).pins.map((p) => p.itemId), ['a', 'b', 'c', 'gone']);
});

test('serializeMap writes only the documented fields', () => {
  const text = serializeMap(
    { dataVersion: 1, maps: [{ regionId: 'r1', image: 'i.jpg', credit: 'c', alt: 'a', extra: 1 }], pins: [{ itemId: 'a', x: 1, y: 2, note: 'x' }] },
    items
  );
  const parsed = JSON.parse(text);
  assert.deepEqual(Object.keys(parsed.maps[0]), ['regionId', 'image', 'credit', 'alt']);
  assert.deepEqual(Object.keys(parsed.pins[0]), ['itemId', 'x', 'y']);
});
