// Tests for js/requirements.js, written against docs/CONTRACTS.md section 2.
// Fixtures are small invented objects built inside each test (ids like a, b, r1), so a reader
// can see the whole situation next to the assertion. The last tests load data/sample/ (invented
// data, never the real data/), and pin the Region counts there.
// The Phase 5 cases (counts, price, isCounted, rosariesToSpend; ADR 0005) sit before them:
// counts: false and price change what is counted and summed, never what blocks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  isAvailable,
  missingFor,
  regionProgress,
  isCounted,
  rosariesToSpend,
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

// Contract section 2: a typo throws whatever the player marked, so the same unknown id in doneSet
// does not hide it.
test('missingFor: an unknown id inside requires throws even when that id is in doneSet', () => {
  assert.throws(() => missingFor('a', done('ghost'), [item('a', 1, ['ghost'])], [region('r1', 1)]), /ghost/);
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

// isRegionAvailable has no items, so only missingForRegion and holdingYouUp can catch a misspelt
// entry id inside a Region's requires (contract section 2, T14 note).
test('missingForRegion and holdingYouUp: an unknown entry id inside a Region requires throws', () => {
  const items = [item('a', 1)];
  const regions = [region('r1', 1, ['ghost'])];
  assert.throws(() => missingForRegion('r1', done(), regions, items), /ghost/);
  assert.throws(() => holdingYouUp(done(), items, regions), /ghost/);
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

// ------------------------------------------------------------------ Phase 5: counts and prices (ADR 0005)
//
// `counts: false` marks a Collectible the game does not count (a Memento, a piece of Equipment). It
// changes the counts and nothing else: the entry still blocks, still sits in chains and can still be
// the next step or a blocker. `price` (Rosaries, for a shop entry) is read only by rosariesToSpend.

// ------------------------------------------------------------------ isCounted

test('isCounted: true for a Collectible with no counts field, and for counts: true', () => {
  assert.equal(isCounted(item('a', 1)), true);
  assert.equal(isCounted(item('a', 1, [], { counts: true })), true);
});

test('isCounted: false for a Collectible with counts: false', () => {
  assert.equal(isCounted(item('memento', 1, [], { counts: false })), false);
});

test('isCounted: false for every Task, even one with counts: true', () => {
  assert.equal(isCounted(item('t', 1, [], { kind: 'task' })), false);
  assert.equal(isCounted(item('t', 1, [], { kind: 'task', counts: true })), false);
  assert.equal(isCounted(item('t', 1, [], { kind: 'task', counts: false })), false);
});

test('isCounted: looks only at the entry it is given, so unknown ids inside it cannot throw', () => {
  assert.equal(isCounted(item('a', 1, ['ghost'], { regionId: 'nowhere' })), true);
});

// ------------------------------------------------------------------ regionProgress with counts

test('regionProgress: leaves out counts: false, keeps counts: true and no counts field', () => {
  const items = [
    item('plain', 1),
    item('marked', 2, [], { counts: true }),
    item('memento', 3, [], { counts: false }),
  ];
  assert.deepEqual(regionProgress('r1', done(), items), { done: 0, total: 2 });
  // A done Memento is still left out of the numbers.
  assert.deepEqual(regionProgress('r1', done('memento'), items), { done: 0, total: 2 });
  assert.deepEqual(regionProgress('r1', done('plain', 'marked', 'memento'), items), { done: 2, total: 2 });
});

test('regionProgress: a Region with only counts: false entries is 0 of 0', () => {
  const items = [item('memento', 1, [], { counts: false }), item('map', 2, [], { counts: false })];
  assert.deepEqual(regionProgress('r1', done('memento', 'map'), items), { done: 0, total: 0 });
});

test('regionProgress: a Task with counts: true still does not count', () => {
  const items = [item('t', 1, [], { kind: 'task', counts: true }), item('a', 2)];
  assert.deepEqual(regionProgress('r1', done('t'), items), { done: 0, total: 1 });
});

// ------------------------------------------------------------------ counts: false in the requirement functions

test('missingFor: an entry with counts: false still blocks, so it is listed', () => {
  const items = [item('memento', 1, [], { counts: false }), item('door', 2, ['memento'])];
  const regions = [region('r1', 1)];
  assert.deepEqual(missingFor('door', done(), items, regions), ['memento']);
  assert.deepEqual(missingFor('door', done('memento'), items, regions), []);
});

test('missingFor: walks through a counts: false entry to what is behind it', () => {
  const items = [
    item('key', 1),
    item('memento', 2, ['key'], { counts: false }),
    item('door', 3, ['memento']),
  ];
  assert.deepEqual(missingFor('door', done(), items, [region('r1', 1)]), ['key', 'memento']);
});

test('missingForRegion: a Region that needs a counts: false entry lists it', () => {
  const items = [item('memento', 1, [], { counts: false, regionId: 'r0' })];
  const regions = [region('r0', 1), region('r1', 2, ['memento'])];
  assert.deepEqual(missingForRegion('r1', done(), regions, items), ['memento']);
});

test('nextStep: can return an entry with counts: false, then moves past it once it is done', () => {
  const items = [item('memento', 1, [], { counts: false }), item('x', 2)];
  const regions = [region('r1', 1)];
  assert.equal(nextStep(done(), items, regions), 'memento');
  assert.equal(nextStep(done('memento'), items, regions), 'x');
});

test('holdingYouUp: a counts: false entry can hold up an entry and a Region', () => {
  const items = [item('memento', 1, [], { counts: false }), item('door', 2, ['memento'])];
  const regions = [region('r1', 1), region('r2', 2, ['memento'])];
  assert.deepEqual(holdingYouUp(done(), items, regions), [{ id: 'memento', blocks: ['door', 'r2'] }]);
});

// The same entries with and without the Phase 5 fields must give the same answers: the fields
// change counts and prices, never the chains.
test('counts and price change no answer about requirements', () => {
  const plain = [
    item('a', 1),
    item('b', 2, ['a']),
    item('c', 3, ['b'], { regionId: 'r2' }),
    item('d', 4, ['a']),
  ];
  const regions = [region('r1', 1), region('r2', 2, ['d'])];
  const tagged = plain.map((entry) => {
    if (entry.id === 'a') return { ...entry, counts: false, price: 80 };
    if (entry.id === 'b') return { ...entry, counts: false };
    if (entry.id === 'c') return { ...entry, price: 120 };
    return entry;
  });
  // Makes sure the fixture is not trivial: c waits on b, b waits on a, and r2 waits on d.
  assert.deepEqual(missingFor('c', done(), tagged, regions), ['a', 'b', 'd']);

  for (const set of [done(), done('a'), done('a', 'b'), done('d')]) {
    assert.equal(nextStep(set, tagged, regions), nextStep(set, plain, regions));
    assert.deepEqual(holdingYouUp(set, tagged, regions), holdingYouUp(set, plain, regions));
    assert.deepEqual(missingForRegion('r2', set, regions, tagged), missingForRegion('r2', set, regions, plain));
    for (const id of ['a', 'b', 'c', 'd']) {
      assert.equal(isAvailable(id, set, tagged, regions), isAvailable(id, set, plain, regions));
      assert.deepEqual(missingFor(id, set, tagged, regions), missingFor(id, set, plain, regions));
    }
  }
});

// ------------------------------------------------------------------ rosariesToSpend

test('rosariesToSpend: sums the priced entries not done, counted or not, and skips unpriced ones', () => {
  const items = [
    item('shop-a', 1, [], { price: 80 }),
    item('shop-b', 2, [], { price: 120 }), // bought below
    item('plain', 3), // no price: ignored
    item('shop-c', 4, [], { price: 40, counts: false }),
  ];
  assert.deepEqual(rosariesToSpend(done('shop-b'), items, [region('r1', 1)]), {
    total: 120,
    available: 120,
    ids: ['shop-a', 'shop-c'],
  });
});

test('rosariesToSpend: a Task with a price is summed too (every entry with a price, as the contract says)', () => {
  const items = [item('task-shop', 1, [], { kind: 'task', price: 15 })];
  assert.deepEqual(rosariesToSpend(done(), items, [region('r1', 1)]), {
    total: 15,
    available: 15,
    ids: ['task-shop'],
  });
});

test('rosariesToSpend: available leaves out entries that are not Available; a Locked Region counts in total only', () => {
  const items = [
    item('key', 1, [], { regionId: 'r0' }),
    item('open-shop', 2, [], { regionId: 'r0', price: 50 }),
    item('locked-shop', 3, [], { regionId: 'r1', price: 200 }),
    item('needs-key-shop', 4, ['key'], { regionId: 'r0', price: 30 }),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.deepEqual(rosariesToSpend(done(), items, regions), {
    total: 280,
    available: 50,
    ids: ['open-shop', 'locked-shop', 'needs-key-shop'],
  });
  // Once the key is done, the Locked Region and the entry that needed the key both open.
  assert.deepEqual(rosariesToSpend(done('key'), items, regions), {
    total: 280,
    available: 280,
    ids: ['open-shop', 'locked-shop', 'needs-key-shop'],
  });
});

test('rosariesToSpend: ids come out in step order, not in the order of the items', () => {
  const items = [
    item('late', 9, [], { price: 10 }),
    item('early', 1, [], { price: 20 }),
    item('middle', 5, [], { price: 30 }),
  ];
  assert.deepEqual(rosariesToSpend(done(), items, [region('r1', 1)]), {
    total: 60,
    available: 60,
    ids: ['early', 'middle', 'late'],
  });
});

test('rosariesToSpend: a priced entry that is done is left out, even when its requirement is not done', () => {
  // The player marked the shop out of order. It is bought, so nothing is left to spend on it.
  const items = [item('key', 1), item('shop', 2, ['key'], { price: 60 })];
  assert.deepEqual(rosariesToSpend(done('shop'), items, [region('r1', 1)]), { total: 0, available: 0, ids: [] });
});

test('rosariesToSpend: zeros and an empty list when nothing is priced or nothing is left to buy', () => {
  const regions = [region('r1', 1)];
  const empty = { total: 0, available: 0, ids: [] };
  assert.deepEqual(rosariesToSpend(done(), [item('a', 1), item('b', 2)], regions), empty);
  assert.deepEqual(rosariesToSpend(done(), [], regions), empty);
  assert.deepEqual(rosariesToSpend(done('shop'), [item('shop', 1, [], { price: 80 })], regions), empty);
});

test('rosariesToSpend: an unknown id in requires throws, done or not, and so does one in the Region requires', () => {
  const regions = [region('r1', 1)];
  const shopNeedsGhost = [item('shop', 1, ['ghost'], { price: 80 })];
  assert.throws(() => rosariesToSpend(done(), shopNeedsGhost, regions), /ghost/);
  assert.throws(() => rosariesToSpend(done('ghost'), shopNeedsGhost, regions), /ghost/);
  const shopInGhostRegion = [item('shop', 1, [], { price: 80 })];
  assert.throws(() => rosariesToSpend(done(), shopInGhostRegion, [region('r1', 1, ['ghost'])]), /ghost/);
});

// ------------------------------------------------------------------ the sample data

// Reads one file of data/sample (invented data). Never the real data/.
function readSample(name) {
  return JSON.parse(readFileSync(new URL(`../data/sample/${name}.json`, import.meta.url), 'utf8'));
}

test('data/sample: the real file shapes work with every function', () => {
  const items = readSample('items').items;
  const regions = readSample('regions').regions;

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

// Pinned on purpose: if data/sample changes, these numbers must change with it, on purpose, so a
// later edit cannot move them silently. The Tasks in each Region are left out (they never count).
test('data/sample: regionProgress numbers for every Region are pinned', () => {
  const items = readSample('items').items;
  const regions = readSample('regions').regions;
  const totals = {
    'sample-region-a': 3, // ability, key, shard (the door is a Task)
    'sample-region-b': 1, // needle upgrade (the boss is a Task)
    'sample-region-c': 0, // no entries yet
    'sample-region-e': 3, // crest, silk heart, second tool (the lever and the delivery are Tasks)
    'sample-region-d': 2, // silk skill, second shard
  };
  assert.deepEqual(regions.map((r) => r.id).sort(), Object.keys(totals).sort());

  for (const [id, total] of Object.entries(totals)) {
    assert.deepEqual(regionProgress(id, done(), items), { done: 0, total }, `${id}, nothing done`);
  }

  const everything = done(...items.map((entry) => entry.id));
  for (const [id, total] of Object.entries(totals)) {
    assert.deepEqual(regionProgress(id, everything, items), { done: total, total }, `${id}, all done`);
  }

  const some = done('sample-ability', 'sample-door', 'sample-charm', 'sample-crest');
  assert.deepEqual(regionProgress('sample-region-a', some, items), { done: 1, total: 3 });
  assert.deepEqual(regionProgress('sample-region-b', some, items), { done: 1, total: 1 });
  assert.deepEqual(regionProgress('sample-region-c', some, items), { done: 0, total: 0 });
  assert.deepEqual(regionProgress('sample-region-e', some, items), { done: 1, total: 3 });
  assert.deepEqual(regionProgress('sample-region-d', some, items), { done: 0, total: 2 });
});
