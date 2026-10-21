// Tests for pathTo in js/requirements.js (the Goal feature), written against docs/CONTRACTS.md section 2.
// pathTo is missingFor followed by the Goal itself, each row with an `available` flag. The tests pin that
// order, the done case, the flags (checked against isAvailable), the throws and that inputs are not changed.
// Fixtures are small invented objects written inside each test (ids like a, b, top), so the whole
// situation sits next to the assertion. Nothing here reads data/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as requirements from '../js/requirements.js';
import { isAvailable, missingFor } from '../js/requirements.js';

// pathTo may not exist yet. It is looked up at call time, so a missing function fails each test with a
// clear message; a named import of a missing export would stop the whole file at import time.
function pathTo(...args) {
  if (typeof requirements.pathTo !== 'function') {
    throw new Error('js/requirements.js does not export pathTo yet (Goal, docs/CONTRACTS.md section 2)');
  }
  return requirements.pathTo(...args);
}

// Short builders: only the fields requirements.js reads.
const item = (id, step, requires = [], extra = {}) => ({
  id,
  step,
  requires,
  kind: 'collectible',
  regionId: 'r1',
  ...extra,
});
const task = (id, step, requires = [], extra = {}) => item(id, step, requires, { kind: 'task', ...extra });
// A Collectible with counts: false (Phase 5, ADR 0005): on the Route only when something on the Route needs it.
const tracked = (id, step, requires = [], extra = {}) => item(id, step, requires, { counts: false, ...extra });
const region = (id, order, requires = []) => ({ id, order, requires });
const done = (...ids) => new Set(ids);
const idsOf = (rows) => rows.map((row) => row.id);
const oneRegion = [region('r1', 1)];

// ------------------------------------------------------------------ done Goal

test('pathTo: a done Goal gives [] even when one of its requirements is not done', () => {
  const items = [item('a', 1), item('b', 2, ['a'])];
  assert.deepEqual(pathTo('b', done('b'), items, oneRegion), []);
});

test('pathTo: a done Goal gives [] when nothing is missing either', () => {
  assert.deepEqual(pathTo('a', done('a'), [item('a', 1)], oneRegion), []);
});

// ------------------------------------------------------------------ nothing missing

test('pathTo: an entry with nothing missing gives one row, the Goal, available', () => {
  assert.deepEqual(pathTo('a', done(), [item('a', 1)], oneRegion), [{ id: 'a', available: true }]);
});

test('pathTo: an entry whose requirements are all done gives one row, available', () => {
  const items = [item('a', 1), item('b', 2, ['a'])];
  assert.deepEqual(pathTo('b', done('a'), items, oneRegion), [{ id: 'b', available: true }]);
});

// ------------------------------------------------------------------ order

test('pathTo: the missing ids come first in step order, then the Goal', () => {
  // The steps are out of order on purpose and the requires list is not sorted by step.
  const items = [item('x', 30), item('y', 10), item('z', 20), item('t', 40, ['x', 'z', 'y'])];
  assert.deepEqual(idsOf(pathTo('t', done(), items, oneRegion)), ['y', 'z', 'x', 't']);
});

test('pathTo: the ids are missingFor in its order, followed by the Goal (chain and diamond)', () => {
  // a -> b -> c and b -> d, with e needing c and d (a diamond on b).
  const items = [
    item('a', 1),
    item('b', 2, ['a']),
    item('c', 3, ['b']),
    item('d', 4, ['b']),
    item('e', 5, ['c', 'd']),
  ];
  for (const doneSet of [done(), done('a'), done('b'), done('c'), done('a', 'c'), done('d')]) {
    const expected = [...missingFor('e', doneSet, items, oneRegion), 'e'];
    assert.deepEqual(idsOf(pathTo('e', doneSet, items, oneRegion)), expected, `done: ${[...doneSet].join(', ') || 'none'}`);
  }
});

test('pathTo: the Goal is last even when its step is lower than a requirement\'s', () => {
  // low has step 1 and high has step 50, so sorting by step alone would put the Goal first.
  const items = [item('low', 1, ['high']), item('high', 50)];
  assert.deepEqual(idsOf(pathTo('low', done(), items, oneRegion)), ['high', 'low']);
});

test('pathTo: the Goal appears once, as the last row, for every done set tried', () => {
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3, ['a', 'b'])];
  for (const doneSet of [done(), done('a'), done('b'), done('a', 'b')]) {
    const ids = idsOf(pathTo('c', doneSet, items, oneRegion));
    assert.equal(ids.filter((id) => id === 'c').length, 1, `done: ${[...doneSet].join(', ') || 'none'}`);
    assert.equal(ids.at(-1), 'c');
  }
});

// ------------------------------------------------------------------ done requirements

test('pathTo: a requirement already done is not listed, and what came before it is not walked', () => {
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3, ['b'])];
  assert.deepEqual(pathTo('c', done('a'), items, oneRegion), [
    { id: 'b', available: true },
    { id: 'c', available: false },
  ]);
  // b is done, so a (which b needs) is not listed even though a is not done.
  assert.deepEqual(pathTo('c', done('b'), items, oneRegion), [{ id: 'c', available: true }]);
});

test('pathTo: a diamond lists the shared requirement once', () => {
  const items = [
    item('base', 1),
    item('left', 2, ['base']),
    item('right', 3, ['base']),
    item('top', 4, ['left', 'right']),
  ];
  assert.deepEqual(pathTo('top', done(), items, oneRegion), [
    { id: 'base', available: true },
    { id: 'left', available: false },
    { id: 'right', available: false },
    { id: 'top', available: false },
  ]);
});

// ------------------------------------------------------------------ Regions

test('pathTo: an entry in a Locked Region lists the Region\'s missing ids, then the Goal', () => {
  const items = [
    item('a', 1, [], { regionId: 'r0' }),
    item('key', 2, ['a'], { regionId: 'r0' }),
    item('inside', 3, [], { regionId: 'r1' }),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.deepEqual(pathTo('inside', done(), items, regions), [
    { id: 'a', available: true },
    { id: 'key', available: false },
    { id: 'inside', available: false },
  ]);
  assert.deepEqual(pathTo('inside', done('a'), items, regions), [
    { id: 'key', available: true },
    { id: 'inside', available: false },
  ]);
  assert.deepEqual(pathTo('inside', done('a', 'key'), items, regions), [{ id: 'inside', available: true }]);
});

// ------------------------------------------------------------------ the flags

test('pathTo: every row\'s available flag equals isAvailable for that id', () => {
  const items = [
    item('a', 1, [], { regionId: 'r0' }),
    item('b', 2, ['a'], { regionId: 'r0' }),
    item('c', 3, ['a', 'b']),
    item('d', 4, ['c'], { regionId: 'r1' }),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['b'])];
  const seen = new Set();
  for (const doneSet of [done(), done('a'), done('a', 'b'), done('b'), done('a', 'b', 'c')]) {
    for (const row of pathTo('d', doneSet, items, regions)) {
      assert.equal(row.available, isAvailable(row.id, doneSet, items, regions), `row ${row.id}, done: ${[...doneSet].join(', ') || 'none'}`);
      seen.add(row.available);
    }
  }
  // Both answers must have come up, or the loop above could pass on rows that are all the same.
  assert.deepEqual([...seen].sort(), [false, true]);
});

test('pathTo: each row has exactly an id and an available flag', () => {
  const items = [item('a', 1), item('b', 2, ['a'])];
  for (const row of pathTo('b', done(), items, oneRegion)) {
    assert.deepEqual(Object.keys(row).sort(), ['available', 'id']);
  }
});

// ------------------------------------------------------------------ off the Route

test('pathTo: an entry off the Route works the same way, with its off-Route requirements', () => {
  // side and side-two are counts: false and nothing on the Route needs them: both are off the Route.
  const items = [item('a', 1), tracked('side', 9, ['a']), tracked('side-two', 10, ['side'])];
  assert.deepEqual(pathTo('side-two', done(), items, oneRegion), [
    { id: 'a', available: true },
    { id: 'side', available: false },
    { id: 'side-two', available: false },
  ]);
  assert.deepEqual(pathTo('side-two', done('a', 'side'), items, oneRegion), [{ id: 'side-two', available: true }]);
});

test('pathTo: a Task can be the Goal', () => {
  const items = [item('a', 1), task('quest', 5, ['a'])];
  assert.deepEqual(pathTo('quest', done(), items, oneRegion), [
    { id: 'a', available: true },
    { id: 'quest', available: false },
  ]);
});

// ------------------------------------------------------------------ unknown ids

test('pathTo: an unknown Goal id throws', () => {
  assert.throws(() => pathTo('nope', done(), [item('a', 1)], oneRegion), /nope/);
});

test('pathTo: an unknown Goal id throws even when it is in doneSet', () => {
  assert.throws(() => pathTo('nope', done('nope'), [item('a', 1)], oneRegion), /nope/);
});

test('pathTo: an unknown id inside requires throws, whether or not it is done', () => {
  const items = [item('a', 1, ['ghost'])];
  assert.throws(() => pathTo('a', done(), items, oneRegion), /ghost/);
  assert.throws(() => pathTo('a', done('ghost'), items, oneRegion), /ghost/);
});

test('pathTo: an unknown id two links down throws', () => {
  const items = [item('b', 1, ['c']), item('c', 2, ['ghost'])];
  assert.throws(() => pathTo('b', done(), items, oneRegion), /ghost/);
});

test('pathTo: an unknown Region id, on the entry or in a Region\'s requires, throws', () => {
  assert.throws(() => pathTo('a', done(), [item('a', 1, [], { regionId: 'r9' })], oneRegion), /r9/);
  assert.throws(() => pathTo('a', done(), [item('a', 1)], [region('r1', 1, ['ghost'])]), /ghost/);
});

// ------------------------------------------------------------------ cycles

test('pathTo: a cycle throws a clear error instead of looping', () => {
  const items = [item('a', 1, ['b']), item('b', 2, ['a'])];
  assert.throws(() => pathTo('a', done(), items, oneRegion), /cycle/i);
  assert.throws(() => pathTo('b', done(), items, oneRegion), /cycle/i);
});

test('pathTo: a cycle deeper than the Goal throws', () => {
  // top needs a, and a -> b -> c -> a.
  const items = [item('top', 1, ['a']), item('a', 2, ['b']), item('b', 3, ['c']), item('c', 4, ['a'])];
  assert.throws(() => pathTo('top', done(), items, oneRegion), /cycle/i);
});

test('pathTo: an entry that needs itself throws', () => {
  assert.throws(() => pathTo('a', done(), [item('a', 1, ['a'])], oneRegion), /cycle/i);
});

test('pathTo: a Region that requires an entry inside it is a cycle', () => {
  const items = [item('inside', 1)];
  assert.throws(() => pathTo('inside', done(), items, [region('r1', 1, ['inside'])]), /cycle/i);
});

// ------------------------------------------------------------------ inputs

test('pathTo: does not change items, regions or doneSet', () => {
  // Out of step order on purpose: a function that sorted `items` in place would change this array.
  const items = [item('c', 3, ['b']), item('a', 1, [], { regionId: 'r0' }), item('b', 2, ['a'], { regionId: 'r0' })];
  const regions = [region('r0', 1), region('r1', 2, ['b'])];
  const doneSet = done('a');
  const before = structuredClone({ items, regions, doneIds: [...doneSet] });
  pathTo('c', doneSet, items, regions);
  assert.deepEqual({ items, regions, doneIds: [...doneSet] }, before);
});
