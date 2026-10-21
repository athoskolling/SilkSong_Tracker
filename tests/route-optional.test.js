// Tests for the `optional` Task rule in routeIds, written against docs/CONTRACTS.md: section 1 (the
// `optional` field), section 2 (routeIds, and nextStep and holdingYouUp, which only look at the Route) and
// section 7 (2026-10-20, bosses).
//
// The rule: a Task with `optional: true` is on the Route only when something on the Route needs it (the
// chain rule), or when it is missable. A Task with no `optional` field, or with `optional: false`, is on
// the Route as before. An optional Task that is off the Route is never "Next on the route" and is never
// held up in "Holding you up".
//
// Fixtures are small invented objects written in this file. They never read data/ or data/sample/.
// Several tests are expected to FAIL on main until dev-a/route-optional is merged: on main, routeIds puts
// every Task on the Route. Each failure names the missing rule. The file does not crash, because every
// function is looked up inside its own test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as requirements from '../js/requirements.js';

// Looked up inside each test: a missing export fails that test with a clear message, not the whole file.
function fn(name) {
  assert.equal(typeof requirements[name], 'function', `js/requirements.js has no exported function ${name}()`);
  return requirements[name];
}

const SOURCE = 'https://example.invalid/page';
const REGION = { id: 'r1', name: 'Region one', order: 1, summary: 'Invented region.', requires: [] };

// Invented entries. A counted Collectible unless the fields say otherwise.
function collectible(id, step, requires = [], fields = {}) {
  return { id, name: id, kind: 'collectible', type: 'tool', regionId: 'r1', how: 'Invented.', requires, step, source: SOURCE, ...fields };
}

// A tracked-only Collectible (counts: false). It is off the Route unless something on the Route needs it or it is missable.
function tracked(id, step, requires = [], fields = {}) {
  return collectible(id, step, requires, { type: 'memento', counts: false, ...fields });
}

function task(id, step, requires = [], fields = {}) {
  return { id, name: id, kind: 'task', type: 'boss', regionId: 'r1', how: 'Invented.', requires, step, source: SOURCE, ...fields };
}

function optionalTask(id, step, requires = [], fields = {}) {
  return task(id, step, requires, { optional: true, ...fields });
}

// The Route as a Set, from the function under test.
function routeOf(items, regions = [REGION]) {
  return new Set(fn('routeIds')(items, regions));
}

// ------------------------------------------------------------------ off the Route

test('an optional Task that nothing on the Route needs is off the Route', () => {
  const items = [collectible('c', 1), optionalTask('t', 2)];
  const onRoute = routeOf(items);
  assert.ok(onRoute.has('c'), 'control: the counted Collectible c is on the Route');
  assert.ok(
    !onRoute.has('t'),
    'optional Task t is on the Route, but nothing on the Route needs it (contract section 2: an optional Task is on the Route only when needed or missable)'
  );
});

test('an optional Task needed only by a tracked Collectible that is off the Route is off the Route too', () => {
  // m is counts: false, not missable and needed by nothing on the Route, so m is off. t is needed only by m.
  const items = [collectible('c', 1), tracked('m', 2, ['t']), optionalTask('t', 3)];
  const onRoute = routeOf(items);
  assert.ok(onRoute.has('c'), 'control: the counted Collectible c is on the Route');
  assert.ok(!onRoute.has('m'), 'tracked Collectible m is on the Route, but nothing on the Route needs it and it is not missable');
  assert.ok(
    !onRoute.has('t'),
    'optional Task t is on the Route, but the only thing that needs it (m) is off the Route (contract section 2: needed by an entry on the Route)'
  );
});

// ------------------------------------------------------------------ on the Route

test('an optional Task that a counted Collectible requires is on the Route', () => {
  const items = [optionalTask('t', 1), collectible('c', 2, ['t'])];
  assert.ok(routeOf(items).has('t'), 'optional Task t is off the Route, but the counted Collectible c requires it');
});

test("an optional Task two links down a counted Collectible's chain is on the Route", () => {
  // c (counted) needs m (tracked), and m needs the optional Task t.
  const items = [optionalTask('t', 1), tracked('m', 2, ['t']), collectible('c', 3, ['m'])];
  const onRoute = routeOf(items);
  assert.ok(onRoute.has('m'), 'control: m is on the Route, because c needs it');
  assert.ok(onRoute.has('t'), 'optional Task t is off the Route, but m needs it and m is on the Route (the chain goes all the way down)');
});

test('an optional Task that a non-optional Task requires is on the Route', () => {
  const items = [optionalTask('t', 1), task('u', 2, ['t'])];
  assert.ok(routeOf(items).has('t'), 'optional Task t is off the Route, but the Task u requires it and u is on the Route');
});

test('an optional Task that a Region requires is on the Route', () => {
  const regions = [REGION, { id: 'r2', name: 'Region two', order: 2, summary: 'Invented region.', requires: ['t'] }];
  const items = [optionalTask('t', 1), collectible('c', 2)];
  assert.ok(routeOf(items, regions).has('t'), 'optional Task t is off the Route, but the Region r2 requires it');
});

test('an optional Task that is missable is on the Route', () => {
  const items = [optionalTask('t', 1, [], { missable: true, missableNote: 'Invented: it can be missed.' })];
  assert.ok(routeOf(items).has('t'), 'optional Task t is off the Route, but it is missable, so it is on the Route');
});

test('a Task with no optional field is on the Route, as before', () => {
  assert.ok(routeOf([task('t', 1)]).has('t'), 'a Task with no optional field is off the Route, but every such Task is on it');
});

test('optional false is the same as no optional field: the Task is on the Route, with the same Route as without it', () => {
  const withFalse = [collectible('c', 1), task('t', 2, [], { optional: false })];
  const absent = [collectible('c', 1), task('t', 2)];
  assert.ok(routeOf(withFalse).has('t'), 'Task t with optional: false is off the Route; false must keep it on, like no field');
  assert.deepEqual(
    [...routeOf(withFalse)].sort(),
    [...routeOf(absent)].sort(),
    'optional: false gives a different Route from leaving the field out'
  );
});

// ------------------------------------------------------------------ nextStep and holdingYouUp

test('nextStep never returns an optional Task that is off the Route, even when it has the lowest step and is Available', () => {
  const items = [optionalTask('t', 1), collectible('c', 5)];
  assert.equal(fn('isAvailable')('t', new Set(), items, [REGION]), true, 'premise: t is Available (no requirements)');
  assert.equal(
    fn('nextStep')(new Set(), items, [REGION]),
    'c',
    'nextStep must return c, the counted Collectible on the Route, not the optional Task t (lowest step, Available, but off the Route)'
  );
});

test('nextStep returns null when the only thing left on the Route is done, though an optional Task off the Route is still Available', () => {
  const items = [optionalTask('t', 1), collectible('c', 5)];
  assert.equal(fn('isAvailable')('t', new Set(['c']), items, [REGION]), true, 'premise: t is still Available');
  assert.equal(
    fn('nextStep')(new Set(['c']), items, [REGION]),
    null,
    'nextStep must be null: nothing on the Route is left, and t is off the Route'
  );
});

test('holdingYouUp never lists an optional Task that is off the Route in blocks', () => {
  // t is off the Route and not Available, because it needs b. b is Available. If t were counted as held up,
  // b would be a blocker with t in its blocks; it must not be.
  const items = [collectible('b', 1), optionalTask('t', 2, ['b'])];
  assert.equal(fn('isAvailable')('t', new Set(), items, [REGION]), false, 'premise: t is not Available until b is done');
  const rows = fn('holdingYouUp')(new Set(), items, [REGION]);
  assert.ok(!rows.some((row) => row.blocks.includes('t')), `holdingYouUp lists the off-Route optional Task t in blocks: ${JSON.stringify(rows)}`);
  assert.deepEqual(rows, [], 'nothing on the Route is held up, so holdingYouUp must be empty');
});

test('holdingYouUp still counts an optional Task that is on the Route, because something on the Route needs it', () => {
  // Control for the test above: t is needed by c (counted), so t is on the Route and is held up like any entry.
  // Route order: t (step 1), b (step 2), c (step 3). b is the only blocker, and it holds up t and c.
  const items = [optionalTask('t', 1, ['b']), collectible('b', 2), collectible('c', 3, ['t'])];
  assert.deepEqual(
    fn('holdingYouUp')(new Set(), items, [REGION]),
    [{ id: 'b', blocks: ['t', 'c'] }],
    'the optional Task t is on the Route (c needs it), so it must be held up and b must block it'
  );
});
