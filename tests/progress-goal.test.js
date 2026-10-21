// Tests for the Goal in js/progress.js (docs/CONTRACTS.md section 3: loadGoal, setGoal, onGoalChange,
// the clearProgress line, "Goal storage"). The Goal is one entry id kept on this device only, outside
// Progress: it is never in the Progress object, the cloud document, a backup file, a merge or an import.
// No test reaches the network: useStorage swaps localStorage for an in-memory stand-in, and useCloud
// swaps the firebase.js functions for a fake that records every call.
// The Goal functions are looked up at call time, so a missing one fails each test with a clear message
// instead of stopping the whole file at import time.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as progressModule from '../js/progress.js';
import {
  useStorage,
  useCloud,
  configureProgress,
  setDone,
  loadProgress,
  onProgressChange,
  exportProgress,
  importProgress,
  clearProgress,
} from '../js/progress.js';

const KEY = 'silksong-guide:progress:v1';
const GOAL_KEY = 'silksong-guide:goal:v1';
const GOAL_SAMPLE_KEY = 'silksong-guide:goal:sample:v1';

function goalFunction(name) {
  const fn = progressModule[name];
  if (typeof fn !== 'function') {
    throw new Error(`js/progress.js does not export ${name} yet (Goal, docs/CONTRACTS.md section 3)`);
  }
  return fn;
}
const loadGoal = () => goalFunction('loadGoal')();
const setGoal = (itemId) => goalFunction('setGoal')(itemId);
const onGoalChange = (callback) => goalFunction('onGoalChange')(callback);

// Every subscription made through subscribeGoal is removed after the test, so one test's listener
// cannot count calls in the next one (this file does not rely on useStorage clearing them).
let unsubscribers = [];
function subscribeGoal(callback) {
  const unsubscribe = onGoalChange(callback);
  unsubscribers.push(unsubscribe);
  return unsubscribe;
}
afterEach(() => {
  for (const unsubscribe of unsubscribers) {
    if (typeof unsubscribe === 'function') unsubscribe();
  }
  unsubscribers = [];
});

// writtenKeys records every setItem and removeItem, so a test can see whether anything was written.
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const writtenKeys = [];
  return {
    data,
    writtenKeys,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => {
      writtenKeys.push(k);
      data.set(k, String(v));
    },
    removeItem: (k) => {
      writtenKeys.push(k);
      data.delete(k);
    },
  };
}

const storedProgress = (s, key = KEY) => JSON.parse(s.data.get(key));
const fileOf = (text) => new File([text], 'backup.json', { type: 'application/json' });
const mentions = (value, id) => String(value).includes(id);

// Lets every pending promise step run (the fake answers at once, so this is enough).
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setImmediate(resolve));
};

// A stand-in for the five firebase.js functions that progress.js uses (as in progress-cloud.test.js).
function makeCloud(initialDoc = null) {
  const cloud = { doc: initialDoc, calls: [], authCallback: null };
  cloud.api = {
    onAuthChange(callback) {
      cloud.authCallback = callback;
      return () => {
        cloud.authCallback = null;
      };
    },
    async readProgressDoc(uid) {
      cloud.calls.push(['read', uid]);
      return cloud.doc ? structuredClone(cloud.doc) : null;
    },
    async writeProgressDoc(uid, progress) {
      cloud.calls.push(['write', uid, structuredClone(progress)]);
      cloud.doc = structuredClone(progress);
    },
    async deleteProgressDoc(uid) {
      cloud.calls.push(['delete', uid]);
      cloud.doc = null;
    },
    watchProgressDoc(uid, callback) {
      cloud.calls.push(['watch', uid]);
      cloud.watchCallback = callback;
      return () => {
        cloud.calls.push(['unwatch', uid]);
        cloud.watchCallback = null;
      };
    },
  };
  cloud.signIn = async (uid = 'u1') => {
    cloud.authCallback({ uid, email: 'a@example.invalid', displayName: '', provider: 'google' });
    await flush();
  };
  cloud.writes = () => cloud.calls.filter(([kind]) => kind === 'write');
  return cloud;
}

const progressDoc = (done, visited, updatedAt) => ({
  done: Object.fromEntries(done.map((id) => [id, true])),
  visited,
  updatedAt,
  dataVersion: 1,
});

let storage;
beforeEach(() => {
  storage = fakeStorage();
  useStorage(storage); // a fresh device: no Progress, no Goal, nobody signed in
});

// ------------------------------------------------------------ storing the Goal

test('loadGoal: null before any Goal is set', () => {
  assert.equal(loadGoal(), null);
});

test('setGoal then loadGoal returns the same id, and the id is in the Goal key', () => {
  setGoal('mask-shard-one');
  assert.equal(loadGoal(), 'mask-shard-one');
  assert.equal(mentions(storage.data.get(GOAL_KEY), 'mask-shard-one'), true);
});

test('setGoal replaces the Goal: one at a time, the old id is gone', () => {
  setGoal('first-goal');
  setGoal('second-goal');
  assert.equal(loadGoal(), 'second-goal');
  assert.equal(mentions(storage.data.get(GOAL_KEY), 'first-goal'), false);
});

test('setGoal(null) clears the Goal, and clearing again is harmless', () => {
  setGoal('some-goal');
  setGoal(null);
  assert.equal(loadGoal(), null);
  assert.doesNotThrow(() => setGoal(null));
  assert.equal(loadGoal(), null);
});

test('setGoal does not check the id against data: an id that is not in the data is kept', () => {
  configureProgress({ items: [{ id: 'other-entry', regionId: 'r1' }], dataVersion: 1 });
  setGoal('retired-entry');
  assert.equal(loadGoal(), 'retired-entry', 'the page, not loadGoal, says when the id is no longer in the guide');
});

// Ids are slugs (docs/CONTRACTS.md section 1). null is the only other value, and it clears.
const NOT_SLUGS = ['Bad Id', 'UPPER-CASE', 'two--dashes', '-leading', 'trailing-', 'under_score', 'with space', '', 42, undefined, {}, ['a-goal'], true];

test('setGoal: a non-slug argument is a TypeError and writes nothing', () => {
  setGoal('kept-goal');
  const before = new Map(storage.data);
  const writesBefore = storage.writtenKeys.length;
  for (const bad of NOT_SLUGS) {
    assert.throws(() => setGoal(bad), TypeError, `setGoal(${JSON.stringify(bad) ?? String(bad)}) should be a TypeError`);
  }
  assert.equal(storage.writtenKeys.length, writesBefore, 'no key was written');
  assert.deepEqual(new Map(storage.data), before);
  assert.equal(loadGoal(), 'kept-goal');
});

// Stored text that is not a slug reads as null, so a hand-edited or damaged key cannot become a Goal.
// Each value is put in with useStorage, which starts a fresh session on the same stand-in.
const STORED_NOT_SLUGS = ['Not A Slug', 'UPPER-CASE', 'two--dashes', 'with space', '"quoted bad id"'];

test('loadGoal: a stored value that is not a slug reads as null', () => {
  for (const bad of STORED_NOT_SLUGS) {
    useStorage((storage = fakeStorage({ [GOAL_KEY]: bad })));
    assert.equal(loadGoal(), null, `stored ${JSON.stringify(bad)}`);
  }
});

test('loadGoal: reads localStorage on each call (a value written underneath is seen)', () => {
  // Make a valid stored value with the real API on a scratch stand-in. This does not assume how the
  // id is encoded under the key.
  const scratch = fakeStorage();
  useStorage(scratch);
  setGoal('second-goal');
  const written = scratch.data.get(GOAL_KEY);

  useStorage((storage = fakeStorage()));
  setGoal('first-goal');
  assert.equal(loadGoal(), 'first-goal');
  storage.data.set(GOAL_KEY, written); // another tab writes the key; this page has no copy of its own
  assert.equal(loadGoal(), 'second-goal');
});

test('useStorage: a new storage starts with no Goal, and the old storage keeps its own', () => {
  setGoal('old-goal');
  const fresh = fakeStorage();
  useStorage(fresh);
  assert.equal(loadGoal(), null);
  setGoal('new-goal');
  assert.equal(mentions(fresh.data.get(GOAL_KEY), 'new-goal'), true);
  assert.equal(mentions(storage.data.get(GOAL_KEY), 'old-goal'), true, 'the old storage is not touched');
});

// ------------------------------------------------------------ notifications

test('onGoalChange: called with the new id after each change, with null when cleared', () => {
  const seen = [];
  // loadGoal inside the callback: the new value is already stored when the callback runs ("called after").
  subscribeGoal((id) => seen.push([id, loadGoal()]));
  setGoal('first-goal');
  setGoal('second-goal');
  setGoal(null);
  assert.deepEqual(seen, [
    ['first-goal', 'first-goal'],
    ['second-goal', 'second-goal'],
    [null, null],
  ]);
});

test('onGoalChange: not called at once on subscribe, even when a Goal is already set', () => {
  setGoal('already-here');
  let calls = 0;
  subscribeGoal(() => {
    calls += 1;
  });
  assert.equal(calls, 0);
});

test('onGoalChange: setting the Goal it already has does not notify', () => {
  setGoal('same-goal');
  const before = storage.data.get(GOAL_KEY);
  const seen = [];
  subscribeGoal((id) => seen.push(id));
  setGoal('same-goal');
  assert.deepEqual(seen, []);
  assert.equal(storage.data.get(GOAL_KEY), before, 'the stored value is unchanged');
});

test('onGoalChange: clearing when no Goal is set does not notify', () => {
  const seen = [];
  subscribeGoal((id) => seen.push(id));
  setGoal(null);
  assert.deepEqual(seen, []);
  assert.equal(loadGoal(), null);
});

test('onGoalChange: unsubscribe stops that listener and leaves the others', () => {
  const first = [];
  const second = [];
  const stopFirst = goalFunction('onGoalChange')((id) => first.push(id));
  assert.equal(typeof stopFirst, 'function', 'onGoalChange returns an unsubscribe function');
  subscribeGoal((id) => second.push(id));
  setGoal('one-goal');
  stopFirst();
  setGoal('two-goal');
  assert.deepEqual(first, ['one-goal']);
  assert.deepEqual(second, ['one-goal', 'two-goal']);
});

test('onGoalChange: clearProgress clears the Goal and notifies null', async () => {
  setGoal('doomed-goal');
  const seen = [];
  subscribeGoal((id) => seen.push(id));
  await clearProgress();
  assert.deepEqual(seen, [null]);
  assert.equal(loadGoal(), null);
});

// ------------------------------------------------------------ Goal is not Progress

test('setGoal leaves the Progress record byte for byte as it was (done, visited, updatedAt)', async () => {
  const progressRaw = JSON.stringify({ done: { a: true }, visited: { r1: true }, updatedAt: 1000, dataVersion: 1 });
  useStorage((storage = fakeStorage({ [KEY]: progressRaw })));
  const changes = [];
  onProgressChange((p) => changes.push(p));

  setGoal('far-goal');

  assert.equal(storage.data.get(KEY), progressRaw);
  assert.equal(loadGoal(), 'far-goal');
  assert.deepEqual(changes, [], 'nothing in Progress changed, so Progress subscribers are not told');
  const progress = await loadProgress();
  assert.deepEqual([...progress.done], ['a']);
  assert.deepEqual([...progress.visited], ['r1']);
  assert.equal(progress.done.has('far-goal'), false, 'the Goal is never marked done');
});

test('setGoal on a device with no Progress writes no Progress record', () => {
  setGoal('lonely-goal');
  assert.equal(storage.data.has(KEY), false);
});

test('loadProgress: the Progress the page reads has no goal in it', async () => {
  setGoal('far-goal');
  const progress = await loadProgress();
  assert.equal('goal' in progress, false);
  assert.equal(progress.done.has('far-goal'), false);
});

// ------------------------------------------------------------ the cloud never gets the Goal

test('setGoal while signed in writes nothing to the cloud and leaves the cloud copy as it was', async () => {
  useStorage((storage = fakeStorage({ [KEY]: JSON.stringify({ done: { a: true }, visited: { r1: true }, updatedAt: 1000, dataVersion: 1 }) })));
  const cloud = makeCloud(progressDoc(['a'], { r1: true }, 1000));
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await flush();
  const cloudBefore = structuredClone(cloud.doc);
  const localBefore = storage.data.get(KEY);
  const mark = cloud.calls.length;

  setGoal('far-goal');
  setGoal('far-goal'); // a repeat changes nothing and sends nothing either
  await flush();

  const sent = cloud.calls.slice(mark).filter(([kind]) => kind === 'write' || kind === 'delete');
  assert.deepEqual(sent, [], 'no write and no delete reached the cloud');
  assert.deepEqual(cloud.doc, cloudBefore);
  assert.equal(storage.data.get(KEY), localBefore);
  assert.equal(loadGoal(), 'far-goal');
});

test('a later Progress change while signed in writes a document with no goal in it', async () => {
  useStorage((storage = fakeStorage({ [KEY]: JSON.stringify({ done: {}, visited: {}, updatedAt: 1000, dataVersion: 1 }) })));
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  setGoal('far-goal');
  await setDone('a', true);
  await flush();

  const writes = cloud.writes();
  assert.ok(writes.length > 0, 'the Progress change reached the cloud');
  const sentDocument = writes.at(-1)[2];
  assert.equal('goal' in sentDocument, false);
  assert.equal(mentions(JSON.stringify(sentDocument), 'far-goal'), false);
});

// ------------------------------------------------------------ backup, import and new run

test('exportProgress: the backup has no goal key, and the Goal id is not in the file', async () => {
  useStorage((storage = fakeStorage({ [KEY]: JSON.stringify({ done: { a: true }, visited: {}, updatedAt: 5, dataVersion: 1 }) })));
  setGoal('backup-goal');
  const text = await exportProgress().text();
  assert.deepEqual(Object.keys(JSON.parse(text)).sort(), ['dataVersion', 'done', 'updatedAt', 'visited']);
  assert.equal(mentions(text, 'backup-goal'), false);
});

test('importProgress: a backup leaves the Goal untouched, and a goal key in a file is ignored', async () => {
  setGoal('kept-goal');
  await importProgress(fileOf(JSON.stringify({ done: { 'imported-one': true }, visited: {} })));
  assert.equal(loadGoal(), 'kept-goal');

  // An unknown key is ignored like any other (docs/CONTRACTS.md section 3, shellShards): the file is accepted.
  await importProgress(fileOf(JSON.stringify({ done: {}, visited: {}, dataVersion: 1, goal: 'file-goal' })));
  assert.equal(loadGoal(), 'kept-goal');
  assert.equal('goal' in storedProgress(storage), false);
  assert.equal(mentions(storage.data.get(KEY), 'file-goal'), false);
});

test('clearProgress: a new run starts with no Goal and no goal key in the Progress record', async () => {
  useStorage((storage = fakeStorage({ [KEY]: JSON.stringify({ done: { a: true }, visited: {}, updatedAt: 1, dataVersion: 1 }) })));
  setGoal('old-run-goal');
  await clearProgress();
  assert.equal(loadGoal(), null);
  assert.equal('goal' in storedProgress(storage), false);
  assert.equal(mentions(storage.data.get(KEY), 'old-run-goal'), false);
});

// ------------------------------------------------------------ sample mode

test('sample mode: the sample Goal lives under its own key, and the real Goal is untouched', () => {
  setGoal('real-goal');
  const realValue = storage.data.get(GOAL_KEY);

  configureProgress({ sample: true });
  assert.equal(loadGoal(), null, 'the sample page starts with no Goal');
  setGoal('fake-goal');

  assert.equal(loadGoal(), 'fake-goal');
  assert.equal(mentions(storage.data.get(GOAL_SAMPLE_KEY), 'fake-goal'), true);
  assert.equal(storage.data.get(GOAL_KEY), realValue, 'the real key is exactly what it was');
});

test('sample mode: without the flag a page reads and writes the real Goal, never the sample one', () => {
  configureProgress({ sample: true });
  setGoal('fake-goal');
  const sampleValue = storage.data.get(GOAL_SAMPLE_KEY);

  useStorage(storage); // a new page load on the same device
  configureProgress({ items: [], dataVersion: 1 });
  assert.equal(loadGoal(), null, 'the sample Goal is not the real one');
  setGoal('real-goal');

  assert.equal(loadGoal(), 'real-goal');
  assert.equal(storage.data.get(GOAL_SAMPLE_KEY), sampleValue, 'the sample key is left alone');
});

test('sample mode: a later configureProgress without the flag does not switch back in the same session', () => {
  configureProgress({ sample: true });
  configureProgress({ items: [], dataVersion: 1 });
  setGoal('after-switch');
  assert.equal(mentions(storage.data.get(GOAL_SAMPLE_KEY), 'after-switch'), true);
  assert.equal(storage.data.has(GOAL_KEY), false, 'the real key was never written');
});

test('sample mode: clearProgress clears the sample Goal and leaves the real one', async () => {
  setGoal('real-goal');
  configureProgress({ sample: true });
  setGoal('fake-goal');
  await clearProgress();
  assert.equal(loadGoal(), null);

  useStorage(storage); // back to a page without the flag
  configureProgress({ items: [], dataVersion: 1 });
  assert.equal(loadGoal(), 'real-goal');
});

test('sample mode: a stored non-slug in the sample key reads as null', () => {
  useStorage((storage = fakeStorage({ [GOAL_SAMPLE_KEY]: 'Not A Slug' })));
  configureProgress({ sample: true });
  assert.equal(loadGoal(), null);
});
