// Tests for directMissingFor and directMissingForRegion in js/requirements.js, written against
// docs/CONTRACTS.md section 2. Brought back 2026-10-20 (Athos) for the Goal page's "Needs" lines; first
// written on the local Acts 1 and 2 line (branch local/acts-1-2, task T32).
// The rule: only the direct requirements that are not done (the entry's own `requires` plus its Region's
// `requires`, or the Region's `requires` for a Region), each once, in step order, with no chain walk. The
// answer is always a subset of missingFor / missingForRegion. Fixtures are small invented objects built
// inside the tests; nothing here reads data/.
// The two functions are looked up at call time (below), so this file imports cleanly on a branch where
// they do not exist yet, and each test then fails with a message that names the missing export.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as requirements from '../js/requirements.js';
import { missingFor, missingForRegion, routeIds } from '../js/requirements.js';

// A named import of a missing export would stop the whole file at import time, so the lookup waits
// until a test calls the function.
function directMissingFor(...args) {
  if (typeof requirements.directMissingFor !== 'function') {
    throw new Error('js/requirements.js does not export directMissingFor yet (docs/CONTRACTS.md section 2)');
  }
  return requirements.directMissingFor(...args);
}

function directMissingForRegion(...args) {
  if (typeof requirements.directMissingForRegion !== 'function') {
    throw new Error('js/requirements.js does not export directMissingForRegion yet (docs/CONTRACTS.md section 2)');
  }
  return requirements.directMissingForRegion(...args);
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
// A Task. `optional: true` is a boss fought for its own sake (contract section 1, Phase 5).
const task = (id, step, requires = [], extra = {}) => item(id, step, requires, { kind: 'task', ...extra });
// A tracked-only Collectible (counts: false, ADR 0005). It is an ordinary requirement for the chain.
const tracked = (id, step, requires = [], extra = {}) => item(id, step, requires, { counts: false, ...extra });
const region = (id, order, requires = []) => ({ id, order, requires });
const done = (...ids) => new Set(ids);

// Every possible Done set made from `ids`. Used to check a rule for every Progress, not one example.
function everyDoneSet(ids) {
  const sets = [];
  for (let mask = 0; mask < (1 << ids.length); mask += 1) {
    sets.push(new Set(ids.filter((_, bit) => (mask & (1 << bit)) !== 0)));
  }
  return sets;
}

// The plain rule, written a second time on purpose. The subset checks alone would also pass for an
// implementation that always answers [], so each Done set is also compared with this exact answer:
// the requirement ids (own and Region's), each once, minus what is done, in step order.
function plainDirect(ids, doneSet, items) {
  const stepOf = (id) => items.find((i) => i.id === id).step;
  return [...new Set(ids)].filter((id) => !doneSet.has(id)).sort((a, b) => stepOf(a) - stepOf(b));
}
function plainDirectFor(entry, doneSet, items, regions) {
  const regionRequires = regions.find((r) => r.id === entry.regionId).requires;
  return plainDirect([...entry.requires, ...regionRequires], doneSet, items);
}
function plainDirectForRegion(regionId, doneSet, regions, items) {
  return plainDirect(regions.find((r) => r.id === regionId).requires, doneSet, items);
}

// A small acyclic world with three Regions, a diamond and a Region that needs two entries.
// Built fresh on each call so a test that changed it could not leak into the next one.
const bigItems = () => [
  item('gate', 1, [], { regionId: 'r0' }),
  item('key', 2, ['gate'], { regionId: 'r0' }),
  item('far', 3, ['key'], { regionId: 'r0' }),
  item('inside', 4, ['far'], { regionId: 'r1' }),
  item('base', 5, [], { regionId: 'r0' }),
  item('left', 6, ['base'], { regionId: 'r0' }),
  item('right', 7, ['base'], { regionId: 'r2' }),
  item('tip', 8, ['left', 'right'], { regionId: 'r2' }),
  item('lone', 9, [], { regionId: 'r1' }),
];
const bigRegions = () => [
  region('r0', 1),
  region('r1', 2, ['key']),
  region('r2', 3, ['far', 'gate']),
];
const bigWorld = () => ({ items: bigItems(), regions: bigRegions() });

// An off-Route world (Phase 5). shard and ring are counted and on the Route. foe is an optional Task that
// ring needs, so it stays on the Route by the chain rule. boss is an optional Task that only map needs, so
// it is off the Route. map is a tracked Collectible that nothing on the Route needs, so it is off the Route.
const routeWorld = () => ({
  items: [
    item('shard', 1),
    task('boss', 2, ['shard'], { optional: true }),
    tracked('map', 3, ['boss']),
    task('foe', 4, [], { optional: true }),
    item('ring', 5, ['shard', 'foe']),
  ],
  regions: [region('r1', 1)],
});

// ------------------------------------------------------------------ directMissingFor

test('directMissingFor: no requirements gives []', () => {
  assert.deepEqual(directMissingFor('a', done(), [item('a', 1)], [region('r1', 1)]), []);
  assert.deepEqual(directMissingFor('a', done('x'), [item('a', 1)], [region('r1', 1)]), []);
});

test('directMissingFor: lists the entry\'s own requirements that are not done', () => {
  const items = [item('a', 1), item('b', 2), item('c', 3, ['a', 'b'])];
  const regions = [region('r1', 1)];
  assert.deepEqual(directMissingFor('c', done(), items, regions), ['a', 'b']);
  assert.deepEqual(directMissingFor('c', done('a'), items, regions), ['b']);
  assert.deepEqual(directMissingFor('c', done('a', 'b'), items, regions), []);
});

test('directMissingFor: a requirement already done is not listed', () => {
  const items = [item('a', 1), item('b', 2), item('c', 3, ['a', 'b'])];
  assert.deepEqual(directMissingFor('c', done('b'), items, [region('r1', 1)]), ['a']);
});

test('directMissingFor: does not walk the chain, so a requirement\'s own requirements are not listed', () => {
  // c needs b, b needs a. The direct answer is b only; missingFor is the full chain.
  const items = [item('a', 1), item('b', 2, ['a']), item('c', 3, ['b'])];
  const regions = [region('r1', 1)];
  assert.deepEqual(directMissingFor('c', done(), items, regions), ['b']);
  assert.deepEqual(missingFor('c', done(), items, regions), ['a', 'b']);
  // b is done, so there is nothing direct left, even though a is not done.
  assert.deepEqual(directMissingFor('c', done('b'), items, regions), []);
});

test('directMissingFor: includes the Region requirements of the entry', () => {
  const items = [item('key', 1, [], { regionId: 'r0' }), item('inside', 2)];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.deepEqual(directMissingFor('inside', done(), items, regions), ['key']);
  assert.deepEqual(directMissingFor('inside', done('key'), items, regions), []);
});

test('directMissingFor: a Region requirement is direct too, so its own requirements are not listed', () => {
  // inside is in r1, which needs key; key needs gate. The direct answer is key, not gate too.
  const items = [
    item('gate', 1, [], { regionId: 'r0' }),
    item('key', 2, ['gate'], { regionId: 'r0' }),
    item('inside', 3),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.deepEqual(directMissingFor('inside', done(), items, regions), ['key']);
  assert.deepEqual(missingFor('inside', done(), items, regions), ['gate', 'key']);
});

test('directMissingFor: the entry\'s and its Region\'s requirements together, in step order, not list order', () => {
  // x lists a (step 30) then c (step 20); its Region lists b (step 10). The answer is b, c, a.
  const items = [
    item('a', 30, [], { regionId: 'r0' }),
    item('b', 10, [], { regionId: 'r0' }),
    item('c', 20, [], { regionId: 'r0' }),
    item('x', 40, ['a', 'c']),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['b'])];
  assert.deepEqual(directMissingFor('x', done(), items, regions), ['b', 'c', 'a']);
  assert.deepEqual(directMissingFor('x', done('c'), items, regions), ['b', 'a']);
});

test('directMissingFor: an id in both the entry and its Region is listed once', () => {
  const items = [item('k', 1, [], { regionId: 'r0' }), item('x', 2, ['k'])];
  const regions = [region('r0', 1), region('r1', 2, ['k'])];
  assert.deepEqual(directMissingFor('x', done(), items, regions), ['k']);
});

test('directMissingFor: an id written twice in the entry\'s requires is listed once', () => {
  const items = [item('k', 1), item('x', 2, ['k', 'k'])];
  assert.deepEqual(directMissingFor('x', done(), items, [region('r1', 1)]), ['k']);
});

test('directMissingFor: an unknown entry id throws', () => {
  assert.throws(() => directMissingFor('nope', done(), [item('a', 1)], [region('r1', 1)]), /nope/);
});

test('directMissingFor: an entry whose Region is not in regions throws', () => {
  const items = [item('a', 1, [], { regionId: 'ghost-region' })];
  assert.throws(() => directMissingFor('a', done(), items, [region('r1', 1)]), /ghost-region/);
});

test('directMissingFor: an unknown id inside requires throws, even when that id is done', () => {
  const regions = [region('r1', 1)];
  assert.throws(() => directMissingFor('a', done(), [item('a', 1, ['ghost'])], regions), /ghost/);
  assert.throws(() => directMissingFor('a', done('ghost'), [item('a', 1, ['ghost'])], regions), /ghost/);
  // The same for an unknown id in the Region's requires.
  const items = [item('a', 1)];
  assert.throws(() => directMissingFor('a', done(), items, [region('r1', 1, ['ghost'])]), /ghost/);
  assert.throws(() => directMissingFor('a', done('ghost'), items, [region('r1', 1, ['ghost'])]), /ghost/);
});

test('directMissingFor: a Region id inside requires throws (requires holds entry ids only)', () => {
  const items = [item('a', 1, [], { regionId: 'r2' })];
  const regions = [region('r1', 1), region('r2', 2, ['r1'])];
  assert.throws(() => directMissingFor('a', done(), items, regions), /r1/);
});

test('directMissingFor: an unknown id one level deeper is not its concern (the direct answer is returned)', () => {
  // a needs b; b needs ghost, which is not in items.json. The direct list is b. missingFor walks down and throws.
  const items = [item('a', 1, ['b']), item('b', 2, ['ghost'])];
  const regions = [region('r1', 1)];
  assert.deepEqual(directMissingFor('a', done(), items, regions), ['b']);
  assert.throws(() => missingFor('a', done(), items, regions), /ghost/);
});

test('directMissingFor: an entry one level deeper in an unknown Region is not its concern', () => {
  // a needs b; b is in a Region that is not in regions.json. Reading the Region of b is a walk, not a direct list.
  const items = [item('a', 1, ['b']), item('b', 2, [], { regionId: 'ghost-region' })];
  const regions = [region('r1', 1)];
  assert.deepEqual(directMissingFor('a', done(), items, regions), ['b']);
  assert.throws(() => missingFor('a', done(), items, regions), /ghost-region/);
});

test('directMissingFor: ids in doneSet that the data does not have are fine (Progress may keep them)', () => {
  const items = [item('a', 1), item('b', 2, ['a'])];
  assert.deepEqual(directMissingFor('b', done('retired-old-id'), items, [region('r1', 1)]), ['a']);
});

test('directMissingFor: a cycle does not hang; it gives the direct answer while missingFor throws', () => {
  // a requires b, b requires a.
  const items = [item('a', 1, ['b']), item('b', 2, ['a'])];
  const regions = [region('r1', 1)];
  assert.deepEqual(directMissingFor('a', done(), items, regions), ['b']);
  assert.deepEqual(directMissingFor('b', done(), items, regions), ['a']);
  assert.throws(() => missingFor('a', done(), items, regions), /Cycle in requires/);
});

test('directMissingFor: a cycle through the Region gives the direct answer while missingFor throws', () => {
  // r1 needs b; b is in r1 and needs a; a needs nothing of its own.
  const items = [item('a', 1), item('b', 2, ['a'])];
  const regions = [region('r1', 1, ['b'])];
  assert.deepEqual(directMissingFor('a', done(), items, regions), ['b']);
  assert.throws(() => missingFor('a', done(), items, regions), /Cycle/);
});

test('directMissingFor: a self-cycle does not hang; the direct answer is the entry itself', () => {
  // a requires a. That is a data bug: the direct answer names it, and missingFor and validator rule 4 report it.
  const items = [item('a', 1, ['a'])];
  const regions = [region('r1', 1)];
  assert.deepEqual(directMissingFor('a', done(), items, regions), ['a']);
  assert.throws(() => missingFor('a', done(), items, regions), /Cycle in requires/);
});

test('directMissingFor: an entry whose Region requires the entry itself does not hang', () => {
  const items = [item('inside', 1)]; // default regionId r1
  const regions = [region('r1', 1, ['inside'])];
  assert.deepEqual(directMissingFor('inside', done(), items, regions), ['inside']);
  assert.deepEqual(directMissingFor('inside', done('inside'), items, regions), []);
  assert.throws(() => missingFor('inside', done(), items, regions), /Cycle/);
});

test('directMissingFor: an optional Task and an entry off the Route still get their direct lists', () => {
  const { items, regions } = routeWorld();
  // The fixture is what the test says: boss and map are off the Route; shard, foe and ring are on it.
  assert.deepEqual([...routeIds(items, regions)].sort(), ['foe', 'ring', 'shard']);

  // map (off the Route) waits for boss, an optional Task that is also off the Route; boss waits for shard.
  assert.deepEqual(directMissingFor('map', done(), items, regions), ['boss']);
  assert.deepEqual(directMissingFor('map', done('shard'), items, regions), ['boss']);
  assert.deepEqual(directMissingFor('map', done('boss'), items, regions), []);
  assert.deepEqual(directMissingFor('boss', done(), items, regions), ['shard']);
  assert.deepEqual(directMissingFor('boss', done('shard'), items, regions), []);
  // The chain is not walked for map: the full answer also names shard.
  assert.deepEqual(missingFor('map', done(), items, regions), ['shard', 'boss']);
  // ring is on the Route and needs foe, an optional Task the Route keeps.
  assert.deepEqual(directMissingFor('ring', done(), items, regions), ['shard', 'foe']);
  assert.deepEqual(directMissingFor('ring', done('foe'), items, regions), ['shard']);
});

// ------------------------------------------------------------------ directMissingForRegion

test('directMissingForRegion: no requirements gives []', () => {
  const items = [item('a', 1, [], { regionId: 'open' })];
  assert.deepEqual(directMissingForRegion('open', done(), [region('open', 1)], items), []);
});

test('directMissingForRegion: lists the Region\'s requires that are not done, in step order, not list order', () => {
  // The Region lists x (step 5) then y (step 2); the answer is in step order.
  const items = [item('x', 5, [], { regionId: 'r0' }), item('y', 2, [], { regionId: 'r0' })];
  const regions = [region('r0', 1), region('r1', 2, ['x', 'y'])];
  assert.deepEqual(directMissingForRegion('r1', done(), regions, items), ['y', 'x']);
  assert.deepEqual(directMissingForRegion('r1', done('y'), regions, items), ['x']);
  assert.deepEqual(directMissingForRegion('r1', done('x', 'y'), regions, items), []);
});

test('directMissingForRegion: does not walk the chain, and a done requirement is not listed', () => {
  // r1 needs key; key needs gate. Direct answer: key. missingForRegion: gate, key.
  const items = [
    item('gate', 1, [], { regionId: 'r0' }),
    item('key', 2, ['gate'], { regionId: 'r0' }),
  ];
  const regions = [region('r0', 1), region('r1', 2, ['key'])];
  assert.deepEqual(directMissingForRegion('r1', done(), regions, items), ['key']);
  assert.deepEqual(missingForRegion('r1', done(), regions, items), ['gate', 'key']);
  assert.deepEqual(directMissingForRegion('r1', done('key'), regions, items), []);
});

test('directMissingForRegion: an id written twice in the Region\'s requires is listed once', () => {
  const items = [item('k', 1, [], { regionId: 'r0' })];
  const regions = [region('r0', 1), region('r1', 2, ['k', 'k'])];
  assert.deepEqual(directMissingForRegion('r1', done(), regions, items), ['k']);
});

test('directMissingForRegion: an unknown Region id throws', () => {
  assert.throws(() => directMissingForRegion('nope', done(), [region('r1', 1)], [item('a', 1)]), /nope/);
});

test('directMissingForRegion: an unknown id inside requires throws, even when that id is done', () => {
  const items = [item('a', 1)];
  const regions = [region('r1', 1, ['ghost'])];
  assert.throws(() => directMissingForRegion('r1', done(), regions, items), /ghost/);
  assert.throws(() => directMissingForRegion('r1', done('ghost'), regions, items), /ghost/);
});

test('directMissingForRegion: a Region id inside requires throws', () => {
  const items = [item('a', 1)];
  const regions = [region('r1', 1), region('r2', 2, ['r1'])];
  assert.throws(() => directMissingForRegion('r2', done(), regions, items), /r1/);
});

test('directMissingForRegion: an unknown id one level deeper is not its concern (the direct answer is returned)', () => {
  // r1 needs x; x needs ghost, which is not in items.json. The direct list is x. missingForRegion walks down and throws.
  const items = [item('x', 1, ['ghost'], { regionId: 'r0' })];
  const regions = [region('r0', 1), region('r1', 2, ['x'])];
  assert.deepEqual(directMissingForRegion('r1', done(), regions, items), ['x']);
  assert.throws(() => missingForRegion('r1', done(), regions, items), /ghost/);
});

test('directMissingForRegion: ids in doneSet that the data does not have are fine', () => {
  const items = [item('k', 1, [], { regionId: 'r0' })];
  const regions = [region('r0', 1), region('r1', 2, ['k'])];
  assert.deepEqual(directMissingForRegion('r1', done('retired-old-id'), regions, items), ['k']);
});

test('directMissingForRegion: a cycle gives the direct answer while missingForRegion throws', () => {
  // r1 needs b; b is in r1 and needs a; a needs b.
  const items = [item('a', 1, ['b']), item('b', 2, ['a'])];
  const regions = [region('r1', 1, ['b'])];
  assert.deepEqual(directMissingForRegion('r1', done(), regions, items), ['b']);
  assert.throws(() => missingForRegion('r1', done(), regions, items), /Cycle/);
});

test('directMissingForRegion: a Region that requires an entry inside itself does not hang', () => {
  const items = [item('inside', 1)]; // default regionId r1
  const regions = [region('r1', 1, ['inside'])];
  assert.deepEqual(directMissingForRegion('r1', done(), regions, items), ['inside']);
  assert.deepEqual(directMissingForRegion('r1', done('inside'), regions, items), []);
  assert.throws(() => missingForRegion('r1', done(), regions, items), /Cycle/);
});

test('directMissingForRegion: a Region that needs an optional Task on the Route gets its direct list', () => {
  const { items } = routeWorld();
  const regions = [region('r1', 1), region('r2', 2, ['foe'])];
  assert.deepEqual(directMissingForRegion('r2', done(), regions, items), ['foe']);
  assert.deepEqual(directMissingForRegion('r2', done('foe'), regions, items), []);
});

// ------------------------------------------------------------------ relation to the full answers

test('directMissingFor: for every Done set it is the plain rule, and a subset of missingFor in step order', () => {
  let sawSmaller = false;
  for (const { items, regions } of [bigWorld(), routeWorld()]) {
    const stepOf = (id) => items.find((i) => i.id === id).step;
    for (const set of everyDoneSet(items.map((i) => i.id))) {
      for (const entry of items) {
        const direct = directMissingFor(entry.id, set, items, regions);
        const full = missingFor(entry.id, set, items, regions);
        const label = `${entry.id}, done [${[...set].join(', ')}]`;
        assert.deepEqual(direct, plainDirectFor(entry, set, items, regions), `${label}: not the plain rule`);
        assert.ok(direct.every((id) => full.includes(id)), `${label}: ${direct} is not inside ${full}`);
        assert.ok(direct.every((id) => !set.has(id)), `${label}: a done id was listed: ${direct}`);
        assert.equal(new Set(direct).size, direct.length, `${label}: an id is listed twice: ${direct}`);
        assert.deepEqual(direct, [...direct].sort((a, b) => stepOf(a) - stepOf(b)), `${label}: not in step order`);
        if (direct.length < full.length) sawSmaller = true;
      }
    }
  }
  // Guard against a test that passes only because every answer is the same as the full chain.
  assert.ok(sawSmaller, 'the fixtures never produced a direct answer shorter than the full chain');
});

test('directMissingForRegion: for every Done set it is the plain rule, and a subset of missingForRegion in step order', () => {
  const { items, regions } = bigWorld();
  const stepOf = (id) => items.find((i) => i.id === id).step;
  let sawSmaller = false;

  for (const set of everyDoneSet(items.map((i) => i.id))) {
    for (const region of regions) {
      const direct = directMissingForRegion(region.id, set, regions, items);
      const full = missingForRegion(region.id, set, regions, items);
      const label = `${region.id}, done [${[...set].join(', ')}]`;
      assert.deepEqual(direct, plainDirectForRegion(region.id, set, regions, items), `${label}: not the plain rule`);
      assert.ok(direct.every((id) => full.includes(id)), `${label}: ${direct} is not inside ${full}`);
      assert.ok(direct.every((id) => !set.has(id)), `${label}: a done id was listed: ${direct}`);
      assert.equal(new Set(direct).size, direct.length, `${label}: an id is listed twice: ${direct}`);
      assert.deepEqual(direct, [...direct].sort((a, b) => stepOf(a) - stepOf(b)), `${label}: not in step order`);
      if (direct.length < full.length) sawSmaller = true;
    }
  }
  assert.ok(sawSmaller, 'the fixture never produced a direct answer shorter than the full chain');
});

// ------------------------------------------------------------------ purity

test('directMissingFor and directMissingForRegion do not change what they were given', () => {
  // Out of step order on purpose: an in-place sort of the caller's array would show up here.
  const items = [item('z', 30, ['a']), item('a', 10), item('m', 20, ['a'], { regionId: 'r2' })];
  const regions = [region('r2', 2, ['z']), region('r1', 1)];
  // a is done and is a real requirement, so a function that removed done ids from the set would show.
  const set = done('a', 'q');
  const itemsBefore = structuredClone(items);
  const regionsBefore = structuredClone(regions);

  assert.deepEqual(directMissingFor('m', set, items, regions), ['z']);
  assert.deepEqual(directMissingFor('z', set, items, regions), []);
  assert.deepEqual(directMissingForRegion('r2', set, regions, items), ['z']);

  assert.deepEqual(items, itemsBefore);
  assert.deepEqual(regions, regionsBefore);
  assert.deepEqual([...set].sort(), ['a', 'q']);
});

test('directMissingFor returns a fresh array: changing it does not change the next answer', () => {
  const items = [item('a', 1), item('b', 2), item('c', 3, ['a', 'b'])];
  const regions = [region('r1', 1)];
  const first = directMissingFor('c', done(), items, regions);
  first.push('junk');
  assert.deepEqual(directMissingFor('c', done(), items, regions), ['a', 'b']);
  assert.deepEqual(items[2].requires, ['a', 'b']);
});

test('directMissingForRegion returns a fresh array: changing it does not change the next answer', () => {
  const items = [item('x', 1, [], { regionId: 'r0' }), item('y', 2, [], { regionId: 'r0' })];
  const regions = [region('r0', 1), region('r1', 2, ['x', 'y'])];
  const first = directMissingForRegion('r1', done(), regions, items);
  first.push('junk');
  assert.deepEqual(directMissingForRegion('r1', done(), regions, items), ['x', 'y']);
  assert.deepEqual(regions[1].requires, ['x', 'y']);
});
