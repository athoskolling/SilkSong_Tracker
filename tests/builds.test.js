// Tests for js/builds.js, written against docs/CONTRACTS.md section 2a.
// Fixtures are invented and small. Most tests build their own, so the situation sits next to the
// assertion; the checkBuild tests share one set (ITEMS) because they all place the same Tools.
// Nothing here reads data/.
//
// Some cases pin decisions Dev A recorded in js/builds.js that the contract text does not state
// (transitive upgrade chains, toolColor only on Tools, Silk Skills fit white only, the order of
// problems for one id, lenient inputs). Each says so in a comment, so Athos can see which
// behaviour is a choice and which is the contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import { slotsFor, ownedByColour, checkBuild } from '../js/builds.js';

const BUILDS_URL = new URL('../js/builds.js', import.meta.url).href;

// Builders: only the fields builds.js reads, plus the ones every entry carries.
const entry = (id, step, extra = {}) => ({ id, step, kind: 'collectible', regionId: 'r1', requires: [], ...extra });
const crest = (id, step, extra = {}) => entry(id, step, { type: 'crest', counts: false, ...extra });
const tool = (id, step, toolColor, extra = {}) => entry(id, step, { type: 'tool', toolColor, ...extra });
const skill = (id, step, extra = {}) => entry(id, step, { type: 'silk-skill', ...extra });
// A done entry that adds slots to every Crest, like a Vesticrest step. It is a Task here, to show
// that the kind of entry does not matter for grantsSlots.
const grant = (id, step, grantsSlots) => entry(id, step, { type: 'quest', kind: 'task', grantsSlots });

const slots = (red = 0, blue = 0, yellow = 0, white = 0) => ({ red, blue, yellow, white });
const EMPTY = { red: [], blue: [], yellow: [], white: [] };
const none = new Set();
const done = (...ids) => new Set(ids);

// One Crest with room for 2 red, 1 blue and 1 white (room for up to 3, 2 and 2 with Memory Lockets),
// and the Tools and a Silk Skill that the checkBuild tests place in it.
const ITEMS = [
  crest('crest-a', 1, { slots: slots(2, 1, 0, 1), slotsMax: slots(3, 2, 0, 2) }),
  tool('red-1', 2, 'red'),
  tool('red-2', 3, 'red'),
  tool('red-3', 4, 'red'),
  tool('blue-1', 5, 'blue'),
  skill('skill-1', 6),
];

// Cycle tests run in a child process with a time limit. A loop in builds.js then fails the test
// with a message instead of hanging the whole run. The child gets its input as JSON, so Sets are
// passed as arrays of ids.
const CHILD_SCRIPT = `
  import * as builds from ${JSON.stringify(BUILDS_URL)};
  const input = JSON.parse(process.argv[1]);
  const doneSet = new Set(input.doneIds);
  const result = input.call === 'ownedByColour'
    ? builds.ownedByColour(doneSet, input.items)
    : builds.checkBuild(input.crestId, input.build, doneSet, input.items, input.crestSlots);
  process.stdout.write(JSON.stringify(result));
`;

function runInChild(input) {
  const stdout = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', CHILD_SCRIPT, JSON.stringify(input)],
    { encoding: 'utf8', timeout: 5000 },
  );
  return JSON.parse(stdout);
}

// ------------------------------------------------------------------ slotsFor

test('slotsFor: a Crest without slots gives null, even with slots opened and grants done', () => {
  // The layout is not in the guide yet: null, not zero slots (contract 2a).
  const items = [crest('bare', 1), grant('step', 2, { red: 1 })];
  assert.equal(slotsFor('bare', done('step'), items, { bare: { red: 2 } }), null);
});

test('slotsFor: with nothing opened and nothing granted, the Crest has its own slots', () => {
  const items = [crest('c1', 1, { slots: slots(1, 0, 2, 0) })];
  assert.deepEqual(slotsFor('c1', none, items), slots(1, 0, 2, 0));
  assert.deepEqual(slotsFor('c1', none, items, {}), slots(1, 0, 2, 0));
});

test('slotsFor: opened slots add up to slotsMax and no further', () => {
  const items = [crest('c1', 1, { slots: slots(1, 1, 0, 0), slotsMax: slots(3, 2, 0, 0) })];
  const opened = (red, blue = 0) => ({ c1: { red, blue } });
  assert.equal(slotsFor('c1', none, items, opened(0)).red, 1);
  assert.equal(slotsFor('c1', none, items, opened(1)).red, 2);
  assert.equal(slotsFor('c1', none, items, opened(2)).red, 3);
  assert.equal(slotsFor('c1', none, items, opened(3)).red, 3);
  assert.equal(slotsFor('c1', none, items, opened(99)).red, 3);
  // Blue has one slot to open (2 - 1), so 5 opened still gives 2.
  assert.equal(slotsFor('c1', none, items, opened(0, 5)).blue, 2);
});

test('slotsFor: opened slots are ignored when the Crest has no slotsMax', () => {
  const items = [crest('c1', 1, { slots: slots(1, 0, 0, 0) })];
  assert.deepEqual(slotsFor('c1', none, items, { c1: { red: 3 } }), slots(1, 0, 0, 0));
});

test('slotsFor: opened slots belong to one Crest only', () => {
  const items = [
    crest('c1', 1, { slots: slots(1, 0, 0, 0), slotsMax: slots(2, 0, 0, 0) }),
    crest('c2', 2, { slots: slots(1, 0, 0, 0), slotsMax: slots(2, 0, 0, 0) }),
  ];
  const opened = { c2: { red: 1 } };
  assert.equal(slotsFor('c1', none, items, opened).red, 1);
  assert.equal(slotsFor('c2', none, items, opened).red, 2);
});

test('slotsFor: a done entry with grantsSlots adds to every Crest; one not done adds nothing', () => {
  const items = [
    crest('c1', 1, { slots: slots(1, 0, 0, 0) }),
    crest('c2', 2, { slots: slots(0, 0, 1, 0) }),
    grant('vesti-step', 3, { red: 1, white: 1 }),
  ];
  assert.deepEqual(slotsFor('c1', none, items), slots(1, 0, 0, 0));
  assert.deepEqual(slotsFor('c2', none, items), slots(0, 0, 1, 0));
  assert.deepEqual(slotsFor('c1', done('vesti-step'), items), slots(2, 0, 0, 1));
  assert.deepEqual(slotsFor('c2', done('vesti-step'), items), slots(1, 0, 1, 1));
});

test('slotsFor: grants from several done entries add up, whatever kind of entry they are', () => {
  const items = [
    crest('c1', 1, { slots: slots(0, 0, 0, 0) }),
    grant('step-a', 2, { blue: 1 }),
    entry('step-b', 3, { type: 'ability', counts: false, grantsSlots: { blue: 2, red: 1 } }),
  ];
  assert.deepEqual(slotsFor('c1', done('step-a', 'step-b'), items), slots(1, 3, 0, 0));
});

test('slotsFor: the slotsMax limit applies to opened slots only, not to grants', () => {
  const items = [
    crest('c1', 1, { slots: slots(1, 0, 0, 0), slotsMax: slots(2, 0, 0, 0) }),
    grant('step', 2, { red: 2 }),
  ];
  // Opened is capped at 1 (slotsMax 2 minus slots 1); the grant adds 2 on top, uncapped.
  assert.equal(slotsFor('c1', done('step'), items, { c1: { red: 5 } }).red, 4);
});

test('slotsFor: a count that is not a whole number of 1 or more reads as 0', () => {
  // Lenient on purpose: a bad number can make a slot disappear but never gives NaN (builds.js, count).
  for (const bad of [1.5, -1, '2', NaN, null]) {
    const withRoom = [crest('c1', 1, { slots: slots(1, 0, 0, 0), slotsMax: slots(5, 0, 0, 0) })];
    assert.equal(slotsFor('c1', none, withRoom, { c1: { red: bad } }).red, 1, `opened ${bad}`);

    const granting = [crest('c1', 1, { slots: slots(1, 0, 0, 0) }), grant('step', 2, { red: bad })];
    assert.equal(slotsFor('c1', done('step'), granting).red, 1, `grant ${bad}`);
  }
  const ownBad = [crest('c1', 1, { slots: slots(1.5, 0, 0, 0) })];
  assert.deepEqual(slotsFor('c1', none, ownBad), slots(0, 0, 0, 0));
});

test('slotsFor: a slotsMax below slots is clamped, so opened slots never take a Crest below its own', () => {
  // The validator rejects slotsMax below slots (rule 13); this is the guard if bad data gets in.
  const items = [crest('c1', 1, { slots: slots(2, 0, 0, 0), slotsMax: slots(1, 0, 0, 0) })];
  assert.equal(slotsFor('c1', none, items, { c1: { red: 3 } }).red, 2);
});

test('slotsFor: ids in doneSet that are not in items are ignored', () => {
  const items = [crest('c1', 1, { slots: slots(1, 0, 0, 0) }), grant('step', 2, { red: 1 })];
  assert.deepEqual(slotsFor('c1', done('ghost', 'step'), items), slots(2, 0, 0, 0));
});

test('slotsFor: missing or null crestSlots means nothing opened', () => {
  const items = [crest('c1', 1, { slots: slots(1, 0, 0, 0), slotsMax: slots(3, 0, 0, 0) })];
  assert.deepEqual(slotsFor('c1', none, items, undefined), slots(1, 0, 0, 0));
  assert.deepEqual(slotsFor('c1', none, items, null), slots(1, 0, 0, 0));
});

test('slotsFor: an unknown Crest id throws, naming the id', () => {
  const items = [crest('c1', 1, { slots: slots(1, 0, 0, 0) })];
  assert.throws(() => slotsFor('nope', none, items), /nope/);
});

test('slotsFor: an id that exists but is not a Crest throws', () => {
  const items = [tool('t-red', 1, 'red'), crest('c1', 2, { slots: slots(1, 0, 0, 0) })];
  assert.throws(() => slotsFor('t-red', none, items), /t-red/);
});

// ------------------------------------------------------------------ ownedByColour

test('ownedByColour: nothing done gives four empty lists, even when Tools exist', () => {
  const items = [tool('t-red', 1, 'red'), skill('s-1', 2)];
  assert.deepEqual(ownedByColour(none, items), EMPTY);
});

test('ownedByColour: a Tool goes under its own colour only', () => {
  const items = [tool('t-red', 1, 'red'), tool('t-blue', 2, 'blue'), tool('t-yellow', 3, 'yellow')];
  assert.deepEqual(ownedByColour(done('t-red', 't-blue', 't-yellow'), items), {
    red: ['t-red'],
    blue: ['t-blue'],
    yellow: ['t-yellow'],
    white: [],
  });
});

test('ownedByColour: a Tool without toolColor is never listed', () => {
  const items = [entry('t-plain', 1, { type: 'tool' })];
  assert.deepEqual(ownedByColour(done('t-plain'), items), EMPTY);
});

test('ownedByColour: a Silk Skill goes under white, whatever else it carries', () => {
  // Decision recorded by Dev A: a Silk Skill fits white only, even if it has a toolColor.
  const items = [skill('s-1', 1), skill('s-2', 2, { toolColor: 'red' })];
  assert.deepEqual(ownedByColour(done('s-1', 's-2'), items), {
    red: [],
    blue: [],
    yellow: [],
    white: ['s-1', 's-2'],
  });
});

test('ownedByColour: toolColor counts only on a Tool; other types with one are never listed', () => {
  // Decision recorded by Dev A: the colour rule is for type "tool" only.
  const items = [entry('ability-red', 1, { type: 'ability', toolColor: 'red' }), crest('crest-blue', 2, { toolColor: 'blue' })];
  assert.deepEqual(ownedByColour(done('ability-red', 'crest-blue'), items), EMPTY);
});

test('ownedByColour: a Tool whose toolColor is not red, blue or yellow fits no colour', () => {
  // The contract gives Tools only the three colours; white belongs to Silk Skills. The validator
  // rejects any other value, so this is a guard.
  const items = [tool('t-white', 1, 'white')];
  assert.deepEqual(ownedByColour(done('t-white'), items), EMPTY);
});

test('ownedByColour: an upgrade is never listed; owning it lists its base once', () => {
  const items = [tool('base', 1, 'red'), tool('upgraded', 2, 'red', { upgradeOf: 'base' })];
  assert.deepEqual(ownedByColour(done('upgraded'), items).red, ['base']);
  assert.deepEqual(ownedByColour(done('base'), items).red, ['base']);
  assert.deepEqual(ownedByColour(done('base', 'upgraded'), items).red, ['base']);
});

test('ownedByColour: owning the top of an upgrade chain owns every version below it', () => {
  // Decision recorded by Dev A: the chain is followed all the way down. This departs from the literal
  // text of section 2a, which says "an entry whose upgradeOf points at it is in doneSet" (one step).
  // Under that text, only "second" would be owned here and "first" would not. See the handoff.
  const items = [
    tool('first', 1, 'red'),
    tool('second', 2, 'red', { upgradeOf: 'first' }),
    tool('third', 3, 'red', { upgradeOf: 'second' }),
  ];
  assert.deepEqual(ownedByColour(done('third'), items).red, ['first']);
  assert.deepEqual(ownedByColour(done('second'), items).red, ['first']);
});

test('ownedByColour: two done upgrades of one base list the base once', () => {
  const items = [
    tool('base', 1, 'red'),
    tool('up-a', 2, 'red', { upgradeOf: 'base' }),
    tool('up-b', 3, 'red', { upgradeOf: 'base' }),
  ];
  assert.deepEqual(ownedByColour(done('up-a', 'up-b'), items).red, ['base']);
});

test('ownedByColour: an entry with upgradeOf is never listed, even when its base is not in items', () => {
  // Decision recorded by Dev A. The validator reports the missing base; this only checks that
  // an upgrade is never listed itself.
  const items = [tool('orphan', 1, 'red', { upgradeOf: 'missing-base' })];
  assert.deepEqual(ownedByColour(done('orphan'), items), EMPTY);
});

test('ownedByColour: ids come ordered by step, whatever the order of items', () => {
  const items = [tool('t-30', 30, 'red'), skill('s-10', 10), tool('t-20', 20, 'red')];
  assert.deepEqual(ownedByColour(done('t-30', 's-10', 't-20'), items), {
    red: ['t-20', 't-30'],
    blue: [],
    yellow: [],
    white: ['s-10'],
  });
});

test('ownedByColour: ids in doneSet that are not in items are ignored', () => {
  const items = [tool('t-red', 1, 'red')];
  assert.deepEqual(ownedByColour(done('ghost', 't-red'), items).red, ['t-red']);
});

test('ownedByColour: an upgradeOf cycle returns, and the Tools outside it are still listed', () => {
  // a and b are each other's upgrade, so neither is a base and neither is listed. The loop must end.
  const result = runInChild({
    call: 'ownedByColour',
    doneIds: ['cyc-a', 't-red'],
    items: [
      tool('cyc-a', 1, 'red', { upgradeOf: 'cyc-b' }),
      tool('cyc-b', 2, 'red', { upgradeOf: 'cyc-a' }),
      tool('t-red', 3, 'red'),
    ],
  });
  assert.deepEqual(result, { ...EMPTY, red: ['t-red'] });
});

// ------------------------------------------------------------------ checkBuild

test('checkBuild: a Build that fits returns []', () => {
  const build = { red: ['red-1', 'red-2'], blue: ['blue-1'], white: ['skill-1'] };
  assert.deepEqual(checkBuild('crest-a', build, done('red-1', 'red-2', 'blue-1', 'skill-1'), ITEMS), []);
});

test('checkBuild: an empty, null or missing Build gives []', () => {
  for (const build of [{}, null, undefined]) {
    assert.deepEqual(checkBuild('crest-a', build, none, ITEMS), [], String(build));
  }
});

test('checkBuild: unknown on its own, for an id that is not in items', () => {
  assert.deepEqual(checkBuild('crest-a', { red: ['gone'] }, none, ITEMS), [{ id: 'gone', problem: 'unknown' }]);
});

test('checkBuild: not-owned on its own, for an entry the player has not marked done', () => {
  assert.deepEqual(checkBuild('crest-a', { red: ['red-1'] }, none, ITEMS), [{ id: 'red-1', problem: 'not-owned' }]);
});

test('checkBuild: wrong-colour on its own, and ownership ignores colour', () => {
  // red-1 is owned (marked done as a red Tool), so placing it in blue is wrong-colour, not not-owned.
  assert.deepEqual(checkBuild('crest-a', { blue: ['red-1'] }, done('red-1'), ITEMS), [
    { id: 'red-1', problem: 'wrong-colour' },
  ]);
});

test('checkBuild: no-room on its own, for an id past the slots in its colour', () => {
  const build = { red: ['red-1', 'red-2', 'red-3'] };
  assert.deepEqual(checkBuild('crest-a', build, done('red-1', 'red-2', 'red-3'), ITEMS), [
    { id: 'red-3', problem: 'no-room' },
  ]);
});

test('checkBuild: a Silk Skill placed in a Tool colour is wrong-colour', () => {
  assert.deepEqual(checkBuild('crest-a', { red: ['skill-1'] }, done('skill-1'), ITEMS), [
    { id: 'skill-1', problem: 'wrong-colour' },
  ]);
});

test('checkBuild: a Tool without toolColor fits no colour, so it is wrong-colour', () => {
  // Section 2a says not-owned means "not owned in the sense of ownedByColour", and ownedByColour
  // leaves such a Tool out of every list. This pins wrong-colour instead, because the entry is in
  // doneSet. The text is ambiguous here; see the handoff.
  const items = [...ITEMS, entry('plain-tool', 9, { type: 'tool' })];
  assert.deepEqual(checkBuild('crest-a', { red: ['plain-tool'] }, done('plain-tool'), items), [
    { id: 'plain-tool', problem: 'wrong-colour' },
  ]);
});

test('checkBuild: owning an upgrade of a Tool makes the Tool owned', () => {
  const items = [...ITEMS, tool('red-1-plus', 7, 'red', { upgradeOf: 'red-1' })];
  assert.deepEqual(checkBuild('crest-a', { red: ['red-1'] }, done('red-1-plus'), items), []);
});

test('checkBuild: owning the top of an upgrade chain owns the base and the middle version', () => {
  // Decision recorded by Dev A: transitive, as in ownedByColour, and the same departure from the
  // one-step text of section 2a.
  const items = [
    ...ITEMS,
    tool('red-1-plus', 7, 'red', { upgradeOf: 'red-1' }),
    tool('red-1-max', 8, 'red', { upgradeOf: 'red-1-plus' }),
  ];
  assert.deepEqual(checkBuild('crest-a', { red: ['red-1'] }, done('red-1-max'), items), []);
  assert.deepEqual(checkBuild('crest-a', { red: ['red-1'] }, done('red-1-plus'), items), []);
});

test('checkBuild: problems for one id come in the order not-owned, wrong-colour, no-room', () => {
  // Decision recorded by Dev A (the contract gives the four kinds, not their order for one id).
  // crest-small has no red slots, so any red id is past the slots; blue-1 is not done and is a Tool of another colour.
  const items = [crest('crest-small', 1, { slots: slots(0, 1, 0, 0) }), ...ITEMS];
  assert.deepEqual(checkBuild('crest-small', { red: ['blue-1'] }, none, items), [
    { id: 'blue-1', problem: 'not-owned' },
    { id: 'blue-1', problem: 'wrong-colour' },
    { id: 'blue-1', problem: 'no-room' },
  ]);
});

test('checkBuild: an unknown id comes before no-room for the same id', () => {
  const items = [crest('crest-none', 1, { slots: slots(0, 0, 0, 0) }), ...ITEMS];
  assert.deepEqual(checkBuild('crest-none', { red: ['gone'] }, none, items), [
    { id: 'gone', problem: 'unknown' },
    { id: 'gone', problem: 'no-room' },
  ]);
});

test('checkBuild: results follow the colour order red, blue, yellow, white, not the key order of the Build', () => {
  const build = { white: ['skill-1'], blue: ['gone-blue'], red: ['red-1'] };
  assert.deepEqual(checkBuild('crest-a', build, none, ITEMS), [
    { id: 'red-1', problem: 'not-owned' },
    { id: 'gone-blue', problem: 'unknown' },
    { id: 'skill-1', problem: 'not-owned' },
  ]);
});

test('checkBuild: an unknown id takes a slot, so the id after it can be no-room', () => {
  // Position counts every id in the colour, not only the ones in items.
  const build = { red: ['gone', 'red-1', 'red-2'] };
  assert.deepEqual(checkBuild('crest-a', build, done('red-1', 'red-2'), ITEMS), [
    { id: 'gone', problem: 'unknown' },
    { id: 'red-2', problem: 'no-room' },
  ]);
});

test('checkBuild: a wrong-colour id takes a slot too', () => {
  const build = { red: ['blue-1', 'red-1', 'red-2'] };
  assert.deepEqual(checkBuild('crest-a', build, done('blue-1', 'red-1', 'red-2'), ITEMS), [
    { id: 'blue-1', problem: 'wrong-colour' },
    { id: 'red-2', problem: 'no-room' },
  ]);
});

test('checkBuild: a colour with zero slots reports no-room for every id in it', () => {
  const items = [crest('crest-none', 1, { slots: slots(0, 0, 0, 0) }), ...ITEMS];
  assert.deepEqual(checkBuild('crest-none', { red: ['red-1', 'red-2'] }, done('red-1', 'red-2'), items), [
    { id: 'red-1', problem: 'no-room' },
    { id: 'red-2', problem: 'no-room' },
  ]);
});

test('checkBuild: a Crest without slots never reports no-room, but still reports the other problems', () => {
  // null from slotsFor means "layout not in the guide yet": no room is known, so no room is reported.
  const items = [crest('crest-bare', 1), ...ITEMS];
  assert.deepEqual(checkBuild('crest-bare', { red: ['red-1', 'red-2', 'red-3'] }, done('red-1', 'red-2', 'red-3'), items), []);
  assert.deepEqual(checkBuild('crest-bare', { red: ['red-1'] }, none, items), [{ id: 'red-1', problem: 'not-owned' }]);
});

test('checkBuild: slots opened with Memory Lockets make room for a Build that needed them', () => {
  const build = { red: ['red-1', 'red-2', 'red-3'] };
  const doneSet = done('red-1', 'red-2', 'red-3');
  assert.deepEqual(checkBuild('crest-a', build, doneSet, ITEMS), [{ id: 'red-3', problem: 'no-room' }]);
  assert.deepEqual(checkBuild('crest-a', build, doneSet, ITEMS, { 'crest-a': { red: 1 } }), []);
});

test('checkBuild: a saved Build stops fitting when a Tool in it is unmarked', () => {
  const build = { red: ['red-1'] };
  assert.deepEqual(checkBuild('crest-a', build, done('red-1'), ITEMS), []);
  assert.deepEqual(checkBuild('crest-a', build, none, ITEMS), [{ id: 'red-1', problem: 'not-owned' }]);
});

test('checkBuild: ids in doneSet that are not in items are ignored', () => {
  assert.deepEqual(checkBuild('crest-a', { red: ['red-1'] }, done('ghost', 'red-1'), ITEMS), []);
});

test('checkBuild: a colour value that is not a list is ignored', () => {
  // Lenient on purpose: the Build comes from Progress, and a bad colour value is skipped, not thrown.
  assert.deepEqual(checkBuild('crest-a', { red: 'red-1', blue: null, yellow: 3, white: {} }, none, ITEMS), []);
});

test('checkBuild: an unknown Crest id throws, even with an empty Build', () => {
  assert.throws(() => checkBuild('nope', {}, none, ITEMS), /nope/);
  assert.throws(() => checkBuild('nope', undefined, none, ITEMS), /nope/);
});

test('checkBuild: an id that exists but is not a Crest throws, even with an empty Build', () => {
  assert.throws(() => checkBuild('red-1', {}, none, ITEMS), /red-1/);
});

test('checkBuild: an upgradeOf cycle returns, and the Build is still checked', () => {
  const items = [
    crest('crest-a', 1, { slots: slots(1, 0, 0, 0) }),
    tool('cyc-a', 2, 'red', { upgradeOf: 'cyc-b' }),
    tool('cyc-b', 3, 'red', { upgradeOf: 'cyc-a' }),
    tool('red-1', 4, 'red'),
  ];
  const result = runInChild({
    call: 'checkBuild',
    crestId: 'crest-a',
    build: { red: ['red-1'] },
    doneIds: ['cyc-a'],
    items,
  });
  assert.deepEqual(result, [{ id: 'red-1', problem: 'not-owned' }]);
});
