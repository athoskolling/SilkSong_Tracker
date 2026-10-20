// Tests for js/requirements.js, written against docs/CONTRACTS.md section 2.
// Fixtures are small invented objects built inside each test (ids like a, b, r1), so a reader
// can see the whole situation next to the assertion. One extra test loads data/sample/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  isAvailable,
  missingFor,
  regionProgress,
  isRegionAvailable,
  missingForRegion,
  nextStep,
  holdingYouUp,
} from '../js/requirements.js';

// Short builders: only the fields requirements.js reads.
const item = (id, step, requires = [], extra = {}) => ({
  id,
  step,
  requires,
  kind: 'collectible',
  regionId: 'r1',
  ...extra,
});
const region = (id, order, requires = []) => ({ id, order, requires });
const done = (...ids) => new Set(ids);

// ------------------------------------------------------------------ isAvailable

test('isAvailable: an entry with no requirements is Available', () => {
  assert.equal(isAvailable('a', done(), [item('a', 1)], [region('r1', 1)]), true);
});

test('isAvailable: false until every requirement is done', () => {
  const items = [item('a', 1), item('b', 2), item('c', 3, ['a', 'b'])];
  const regions = [region('r1', 1)];
  assert.equal(isAvailable('c', done(), items, regions), false);
  assert.equal(isAvailable('c', done('a'), items, regions), false);
  assert.equal(isAvailable('c', done('a', 'b'), items, regions), true);
});

test('isAvailable: the Region requirements count too', () => {
  const items = [item('key', 1, [], { regionId: 'r0' }), item('inside', 2)];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.equal(isAvailable('inside', done(), items, regions), false);
  assert.equal(isAvailable('inside', done('key'), items, regions), true);
});

test('isAvailable: an entry with no requires in a Locked Region is not Available', () => {
  const items = [item('key', 1, [], { regionId: 'r0' }), item('inside', 2, [])];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.equal(isAvailable('inside', done(), items, regions), false);
});

test('isAvailable: an unknown entry id throws', () => {
  assert.throws(() => isAvailable('nope', done(), [item('a', 1)], [region('r1', 1)]), /nope/);
});

// Contract section 2 (2026-10-20): an unknown id inside any `requires` the function reads throws,
// whether the id is done or not (a typo is a data bug whatever the player has marked).
test('isAvailable: an unknown id inside requires throws', () => {
  assert.throws(() => isAvailable('a', done(), [item('a', 1, ['ghost'])], [region('r1', 1)]), /ghost/);
  assert.throws(() => isAvailable('a', done('ghost'), [item('a', 1, ['ghost'])], [region('r1', 1)]), /ghost/);
  assert.throws(() => isAvailable('a', done(), [item('a', 1)], [region('r1', 1, ['ghost'])]), /ghost/);
});

// ------------------------------------------------------------------ missingFor

test('missingFor: no requirements means nothing missing', () => {
  assert.deepEqual(missingFor('a', done(), [item('a', 1)], [region('r1', 1)]), []);
});

test('missingFor: a two-step chain lists both, in step order', () => {
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3, ['b'])];
  const regions = [region('r1', 1)];
  assert.deepEqual(missingFor('c', done(), items, regions), ['a', 'b']);
});

test('missingFor: a requirement already done is not listed and not walked', () => {
  // b is done, so a (which b needs) no longer matters, even though a is not done.
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3, ['b'])];
  const regions = [region('r1', 1)];
  assert.deepEqual(missingFor('c', done('b'), items, regions), []);
  assert.deepEqual(missingFor('c', done('a'), items, regions), ['b']);
});

test('missingFor: a diamond lists the shared requirement once', () => {
  const items = [
    item('base', 1),
    item('left', 2, ['base']),
    item('right', 3, ['base']),
    item('top', 4, ['left', 'right']),
  ];
  assert.deepEqual(missingFor('top', done(), items, [region('r1', 1)]), ['base', 'left', 'right']);
});

test('missingFor: ordered by step, not by the order requires is written', () => {
  const items = [item('x', 30), item('y', 10), item('z', 20), item('t', 40, ['x', 'z', 'y'])];
  assert.deepEqual(missingFor('t', done(), items, [region('r1', 1)]), ['y', 'z', 'x']);
});

test('missingFor: an entry in a Locked Region lists the Region missing ids', () => {
  const items = [
    item('a', 1, [], { regionId: 'r0' }),
    item('key', 2, ['a'], { regionId: 'r0' }),
    item('inside', 3, []),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.deepEqual(missingFor('inside', done(), items, regions), ['a', 'key']);
  assert.deepEqual(missingFor('inside', done('a'), items, regions), ['key']);
  assert.deepEqual(missingFor('inside', done('a', 'key'), items, regions), []);
});

test('missingFor: walks through the Region of a missing entry', () => {
  // far sits in r2, which needs gate; asking about top must list gate too.
  const items = [
    item('gate', 1, [], { regionId: 'r0' }),
    item('far', 2, [], { regionId: 'r2' }),
    item('top', 3, ['far'], { regionId: 'r0' }),
  ];
  const regions = [region('r0', 1), region('r1', 2), region('r2', 3, ['gate'])];
  assert.deepEqual(missingFor('top', done(), items, regions), ['gate', 'far']);
});

test('missingFor: a cycle throws a clear error instead of looping', () => {
  const items = [item('a', 1, ['b']), item('b', 2, ['a'])];
  assert.throws(() => missingFor('a', done(), items, [region('r1', 1)]), /Cycle in requires: a -> b -> a/);
});

test('missingFor: a Region that requires an entry inside itself is a cycle', () => {
  const items = [item('inside', 1)];
  const regions = [region('r1', 1, ['inside'])];
  assert.throws(() => missingFor('inside', done(), items, regions), /Cycle/);
});

test('missingFor: an unknown entry id throws, and so does an unknown id inside requires', () => {
  const regions = [region('r1', 1)];
  assert.throws(() => missingFor('nope', done(), [item('a', 1)], regions), /nope/);
  assert.throws(() => missingFor('a', done(), [item('a', 1, ['ghost'])], regions), /ghost/);
});

test('missingFor: does not change what it was given', () => {
  const items = [item('a', 1), item('b', 2, ['a'])];
  const set = done();
  missingFor('b', set, items, [region('r1', 1)]);
  assert.equal(set.size, 0);
  assert.deepEqual(items.map((i) => i.id), ['a', 'b']);
});

test('missingFor: never returns a Region id, even when the walk passes through a Region', () => {
  // top needs far (in r2); r2 needs gate (in r0). Only entry ids may come back.
  const items = [
    item('gate', 1, [], { regionId: 'r0' }),
    item('far', 2, [], { regionId: 'r2' }),
    item('top', 3, ['far'], { regionId: 'r0' }),
  ];
  const regions = [region('r0', 1), region('r1', 2), region('r2', 3, ['gate'])];
  const ids = missingFor('top', done(), items, regions);
  assert.deepEqual(ids, ['gate', 'far']);
  assert.ok(ids.every((id) => items.some((i) => i.id === id)));
});

// ------------------------------------------------------------------ regionProgress

test('regionProgress: counts Collectibles only; Tasks never count', () => {
  const items = [
    item('a', 1),
    item('b', 2),
    item('t', 3, [], { kind: 'task' }),
    item('other', 4, [], { regionId: 'r2' }),
  ];
  assert.deepEqual(regionProgress('r1', done(), items), { done: 0, total: 2 });
  assert.deepEqual(regionProgress('r1', done('a', 't', 'other'), items), { done: 1, total: 2 });
  assert.deepEqual(regionProgress('r1', done('a', 'b', 't'), items), { done: 2, total: 2 });
});

test('regionProgress: a Region with no entries is 0 of 0', () => {
  assert.deepEqual(regionProgress('empty', done(), [item('a', 1)]), { done: 0, total: 0 });
});

// ------------------------------------------------------------------ isRegionAvailable / missingForRegion

test('isRegionAvailable: no requirements is Available; otherwise needs them all', () => {
  const regions = [region('open', 1), region('shut', 2, ['k1', 'k2'])];
  assert.equal(isRegionAvailable('open', done(), regions), true);
  assert.equal(isRegionAvailable('shut', done('k1'), regions), false);
  assert.equal(isRegionAvailable('shut', done('k1', 'k2'), regions), true);
});

// isRegionAvailable gets no items, so it cannot tell a typo from a real entry id. It can still
// catch a Region id used in `requires` (requires holds entry ids only).
test('isRegionAvailable: a Region id inside requires throws', () => {
  const regions = [region('r1', 1), region('r2', 2, ['r1'])];
  assert.throws(() => isRegionAvailable('r2', done(), regions), /r1/);
});

test('isRegionAvailable: an unknown Region throws', () => {
  assert.throws(() => isRegionAvailable('nope', done(), [region('r1', 1)]), /nope/);
});

test('missingForRegion: walks the chain, including the Regions of those entries, in step order', () => {
  const items = [
    item('gate', 1, [], { regionId: 'r0' }),
    item('far', 2, [], { regionId: 'r2' }),
    item('key', 3, ['far'], { regionId: 'r2' }),
  ];
  const regions = [region('r0', 1), region('r2', 2, ['gate']), region('r3', 3, ['key'])];
  assert.deepEqual(missingForRegion('r3', done(), regions, items), ['gate', 'far', 'key']);
  assert.deepEqual(missingForRegion('r3', done('gate'), regions, items), ['far', 'key']);
  assert.deepEqual(missingForRegion('r3', done('key'), regions, items), []);
  assert.deepEqual(missingForRegion('r0', done(), regions, items), []);
});

test('missingForRegion: a cycle throws, and so does an unknown Region', () => {
  // r1 needs b; b is in r1 and needs a; a needs b.
  const items = [item('a', 1, ['b']), item('b', 2, ['a'])];
  const regions = [region('r1', 1, ['b'])];
  assert.throws(() => missingForRegion('r1', done(), regions, items), /Cycle/);
  assert.throws(() => missingForRegion('nope', done(), regions, items), /nope/);
});

test('missingForRegion: a diamond lists the shared requirement once, in step order', () => {
  const items = [
    item('base', 1, [], { regionId: 'r0' }),
    item('left', 2, ['base'], { regionId: 'r0' }),
    item('right', 3, ['base'], { regionId: 'r0' }),
    item('top', 4, ['left', 'right'], { regionId: 'r0' }),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['top'])];
  assert.deepEqual(missingForRegion('r1', done(), regions, items), ['base', 'left', 'right', 'top']);
});

test('missingForRegion: ordered by step even when the walk finds the ids in another order', () => {
  // The Region lists x (step 5) first, then y (step 2); the answer is in step order, not list order.
  const items = [item('x', 5, [], { regionId: 'r0' }), item('y', 2, [], { regionId: 'r0' })];
  const regions = [region('r0', 1), region('r1', 2, ['x', 'y'])];
  assert.deepEqual(missingForRegion('r1', done(), regions, items), ['y', 'x']);
});

test('missingForRegion: a done requirement is not walked, even if its own requirements are not done', () => {
  const items = [
    item('gate', 1, [], { regionId: 'r0' }),
    item('key', 2, ['gate'], { regionId: 'r0' }),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.deepEqual(missingForRegion('r1', done('key'), regions, items), []);
  assert.deepEqual(missingForRegion('r1', done(), regions, items), ['gate', 'key']);
});

// ------------------------------------------------------------------ nextStep

test('nextStep: lowest step that is not done and is Available', () => {
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3)];
  const regions = [region('r1', 1)];
  assert.equal(nextStep(done(), items, regions), 'a');
  assert.equal(nextStep(done('a'), items, regions), 'b');
});

test('nextStep: skips done entries and entries that are not Available', () => {
  // b (step 2) is not Available; a (step 1) is done; so c (step 3) is next.
  const items = [item('a', 1), item('b', 2, ['x']), item('c', 3), item('x', 9, ['c'])];
  assert.equal(nextStep(done('a'), items, [region('r1', 1)]), 'c');
});

test('nextStep: does not depend on the order of the items array', () => {
  const items = [item('c', 3), item('a', 1), item('b', 2)];
  assert.equal(nextStep(done(), items, [region('r1', 1)]), 'a');
});

test('nextStep: an unknown id inside requires throws', () => {
  assert.throws(() => nextStep(done(), [item('a', 1, ['ghost'])], [region('r1', 1)]), /ghost/);
  assert.throws(() => nextStep(done(), [item('a', 1)], [region('r1', 1, ['ghost'])]), /ghost/);
});

test('nextStep: null when everything is done or nothing is Available', () => {
  const items = [item('a', 1), item('b', 2, ['a'])];
  assert.equal(nextStep(done('a', 'b'), items, [region('r1', 1)]), null);
  assert.equal(nextStep(done(), [], [region('r1', 1)]), null);
  // The only entry left is in a Locked Region (it needs k, which is not done).
  const locked = [item('k', 1, [], { regionId: 'r0' }), item('z', 2)];
  const regions = [region('r0', 1), region('r1', 2, ['k'])];
  assert.equal(nextStep(done(), locked, regions), 'k');
  assert.equal(nextStep(done('k', 'z'), locked, regions), null);
  assert.equal(nextStep(done('k'), locked, regions), 'z');
});

// ------------------------------------------------------------------ holdingYouUp

test('holdingYouUp: nothing is held up when everything is Available', () => {
  assert.deepEqual(holdingYouUp(done(), [item('a', 1), item('b', 2)], [region('r1', 1)]), []);
});

test('holdingYouUp: returns only Available ids, each with what it holds up', () => {
  // a is Available; b needs a; c needs b. Only a is something the player can do now.
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3, ['b'])];
  assert.deepEqual(holdingYouUp(done(), items, [region('r1', 1)]), [{ id: 'a', blocks: ['b', 'c'] }]);
});

test('holdingYouUp: a done blocker no longer appears, and the next one takes over', () => {
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3, ['b'])];
  assert.deepEqual(holdingYouUp(done('a'), items, [region('r1', 1)]), [{ id: 'b', blocks: ['c'] }]);
});

test('holdingYouUp: a Locked Region is counted in blocks', () => {
  const items = [item('key', 1, [], { regionId: 'r0' }), item('inside', 2)];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.deepEqual(holdingYouUp(done(), items, regions), [{ id: 'key', blocks: ['inside', 'r1'] }]);
});

test('holdingYouUp: sorted by how much each blocks, then by step', () => {
  const items = [
    item('small', 1),
    item('big', 5),
    item('tie', 3),
    item('after-small', 10, ['small']),
    item('after-big-1', 11, ['big']),
    item('after-big-2', 12, ['big']),
    item('after-tie', 13, ['tie']),
  ];
  const result = holdingYouUp(done(), items, [region('r1', 1)]);
  assert.deepEqual(result.map((r) => r.id), ['big', 'small', 'tie']);
  assert.deepEqual(result[0].blocks, ['after-big-1', 'after-big-2']);
});

test('holdingYouUp: a done entry is never listed as held up', () => {
  // b is done (out of order), so it holds nothing up and is not blocked by anything.
  const items = [item('a', 1), item('b', 2, ['a'])];
  assert.deepEqual(holdingYouUp(done('b'), items, [region('r1', 1)]), []);
});

test('holdingYouUp: a cycle throws the same clear error as missingFor', () => {
  const items = [item('a', 1, ['b']), item('b', 2, ['a'])];
  assert.throws(() => holdingYouUp(done(), items, [region('r1', 1)]), /Cycle in requires/);
});

test('holdingYouUp: an unknown id inside requires throws (it is a data bug)', () => {
  const items = [item('a', 1, ['ghost'])];
  assert.throws(() => holdingYouUp(done(), items, [region('r1', 1)]), /ghost/);
});

test('nextStep and holdingYouUp do not change what they were given', () => {
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3, ['b'])];
  const regions = [region('r1', 1)];
  const set = done('a');
  const itemsBefore = structuredClone(items);
  nextStep(set, items, regions);
  holdingYouUp(set, items, regions);
  assert.deepEqual([...set], ['a']);
  assert.deepEqual(items, itemsBefore);
});

// ------------------------------------------------------------------ the sample data

test('data/sample: the real file shapes work with every function', () => {
  const read = (name) => JSON.parse(readFileSync(new URL(`../data/sample/${name}.json`, import.meta.url), 'utf8'));
  const items = read('items').items;
  const regions = read('regions').regions;

  assert.equal(nextStep(done(), items, regions), 'sample-ability');
  assert.deepEqual(missingFor('sample-shard', done(), items, regions), [
    'sample-ability',
    'sample-key',
    'sample-door',
  ]);
  assert.equal(isRegionAvailable('sample-region-b', done(), regions), false);
  assert.deepEqual(missingForRegion('sample-region-b', done(), regions, items), ['sample-ability']);
  assert.equal(isRegionAvailable('sample-region-b', done('sample-ability'), regions), true);
  // sample-region-c needs sample-boss, which sits in region b (needs sample-ability).
  assert.deepEqual(missingForRegion('sample-region-c', done(), regions, items), ['sample-ability', 'sample-boss']);
  assert.deepEqual(regionProgress('sample-region-a', done('sample-ability', 'sample-door'), items), { done: 1, total: 3 });
  assert.equal(holdingYouUp(done(), items, regions)[0].id, 'sample-ability');
});
