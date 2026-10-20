// Tests for js/progress.js, written against docs/CONTRACTS.md section 3.
// node:test has no browser localStorage, so every test injects a tiny in-memory
// stand-in through useStorage (the only seam progress.js offers for this).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  useStorage,
  configureProgress,
  loadProgress,
  setDone,
  setVisited,
  onProgressChange,
  onSyncStatus,
  exportProgress,
  importProgress,
  mergeLocalAndCloud,
  clearProgress,
  setCrestSlots,
  setBuild,
} from '../js/progress.js';

const KEY = 'silksong-guide:progress:v1';

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
  };
}

const stored = (storage) => JSON.parse(storage.data.get(KEY));
const fileOf = (text) => new File([text], 'backup.json', { type: 'application/json' });

let storage;
beforeEach(() => {
  storage = fakeStorage();
  useStorage(storage);
});

// ------------------------------------------------------- mergeLocalAndCloud

test('merge: cloud null returns local with syncedUid set', () => {
  const local = { done: { a: true }, visited: {}, updatedAt: 5, dataVersion: 1 };
  const result = mergeLocalAndCloud(local, null, 'u1');
  assert.deepEqual(result, { ...local, syncedUid: 'u1' });
});

test('merge: first sign-in (no syncedUid) is a union, even when cloud is older', () => {
  const local = { done: { a: true }, visited: { r1: true }, updatedAt: 1000, dataVersion: 1 };
  const cloud = { done: { b: true }, visited: { r2: true }, updatedAt: 500, dataVersion: 1 };
  const before = Date.now();
  const result = mergeLocalAndCloud(local, cloud, 'u1');
  assert.deepEqual(result.done, { a: true, b: true });
  assert.deepEqual(result.visited, { r1: true, r2: true });
  assert.equal(result.syncedUid, 'u1');
  assert.ok(result.updatedAt >= before, 'updatedAt is now, not either old value');
});

test('merge: a different syncedUid also counts as a first sign-in (union)', () => {
  const local = { done: { a: true }, visited: {}, updatedAt: 1000, dataVersion: 1, syncedUid: 'other' };
  const cloud = { done: { b: true }, visited: {}, updatedAt: 2000, dataVersion: 1 };
  assert.deepEqual(mergeLocalAndCloud(local, cloud, 'u1').done, { a: true, b: true });
});

test('merge: same uid, newer cloud wins as a whole object (nothing is unioned)', () => {
  const local = { done: { a: true }, visited: { r1: true }, updatedAt: 1000, dataVersion: 1, syncedUid: 'u1' };
  const cloud = { done: { b: true }, visited: {}, updatedAt: 2000, dataVersion: 1 };
  const result = mergeLocalAndCloud(local, cloud, 'u1');
  assert.deepEqual(result.done, { b: true });
  assert.deepEqual(result.visited, {});
  assert.equal(result.updatedAt, 2000);
  assert.equal(result.syncedUid, 'u1');
});

test('merge: same uid, newer local wins as a whole object', () => {
  const local = { done: { a: true }, visited: {}, updatedAt: 3000, dataVersion: 1, syncedUid: 'u1' };
  const cloud = { done: { b: true }, visited: { r2: true }, updatedAt: 2000, dataVersion: 1 };
  const result = mergeLocalAndCloud(local, cloud, 'u1');
  assert.deepEqual(result.done, { a: true });
  assert.deepEqual(result.visited, {});
  assert.equal(result.syncedUid, 'u1');
});

test('merge: the result carries this uid, whatever syncedUid the cloud copy had', () => {
  const local = { done: { a: true }, visited: {}, updatedAt: 3000, dataVersion: 1, syncedUid: 'u1' };
  const cloud = { done: { b: true }, visited: {}, updatedAt: 2000, dataVersion: 1, syncedUid: 'someone-else' };
  assert.equal(mergeLocalAndCloud(local, cloud, 'u1').syncedUid, 'u1');
});

test('merge: does not change its inputs', () => {
  const local = { done: { a: true }, visited: {}, updatedAt: 1, dataVersion: 1 };
  const cloud = { done: { b: true }, visited: {}, updatedAt: 2, dataVersion: 1 };
  const localCopy = structuredClone(local);
  const cloudCopy = structuredClone(cloud);
  mergeLocalAndCloud(local, cloud, 'u1');
  assert.deepEqual(local, localCopy);
  assert.deepEqual(cloud, cloudCopy);
});

// ------------------------------------------------------- setDone / setVisited

test('setDone(true) stores the id, stamps updatedAt and uses the contract key', async () => {
  const before = Date.now();
  await setDone('mask-1', true);
  const saved = stored(storage);
  assert.deepEqual(saved.done, { 'mask-1': true });
  assert.ok(saved.updatedAt >= before);
  const { done } = await loadProgress();
  assert.deepEqual([...done], ['mask-1']);
});

test('setDone(true) marks the entry\'s Region Visited once configured', async () => {
  configureProgress({ items: [{ id: 'mask-1', regionId: 'moss-grotto' }], dataVersion: 3 });
  await setDone('mask-1', true);
  const { done, visited } = await loadProgress();
  assert.ok(done.has('mask-1'));
  assert.ok(visited.has('moss-grotto'));
  assert.equal(stored(storage).dataVersion, 3);
});

test('setDone(false) deletes the key and keeps the Region Visited', async () => {
  configureProgress({ items: [{ id: 'mask-1', regionId: 'moss-grotto' }] });
  await setDone('mask-1', true);
  await setDone('mask-1', false);
  const saved = stored(storage);
  assert.ok(!('mask-1' in saved.done), 'the key is deleted, not set to false');
  assert.deepEqual(saved.visited, { 'moss-grotto': true });
});

test('setDone accepts an id the data does not know (kept, never refused)', async () => {
  configureProgress({ items: [] });
  await setDone('old-removed-entry', true);
  assert.ok((await loadProgress()).done.has('old-removed-entry'));
});

test('setVisited marks and unmarks by hand', async () => {
  await setVisited('moss-grotto', true);
  assert.ok((await loadProgress()).visited.has('moss-grotto'));
  await setVisited('moss-grotto', false);
  assert.deepEqual(stored(storage).visited, {});
});

test('a change that changes nothing does not notify or move updatedAt', async () => {
  await setDone('a', true);
  const stamp = stored(storage).updatedAt;
  let calls = 0;
  onProgressChange(() => (calls += 1));
  await setDone('a', true);
  await setDone('never-done', false);
  assert.equal(calls, 0);
  assert.equal(stored(storage).updatedAt, stamp);
});

test('a Visited change that changes nothing does not notify or move updatedAt', async () => {
  await setVisited('r1', true);
  const stamp = stored(storage).updatedAt;
  let calls = 0;
  onProgressChange(() => (calls += 1));
  await setVisited('r1', true);
  await setVisited('never-visited', false);
  assert.equal(calls, 0);
  assert.equal(stored(storage).updatedAt, stamp);
});

test('before configureProgress, setDone works but cannot mark the Region Visited', async () => {
  // beforeEach resets the configuration, so this test starts without it.
  await setDone('mask-1', true);
  const { done, visited } = await loadProgress();
  assert.ok(done.has('mask-1'));
  assert.equal(visited.size, 0);
});

test('marking an entry that is not Available is allowed (the player may be out of order)', async () => {
  // progress.js does not know requirements, so it has no reason to refuse; the guide only shows what is missing.
  configureProgress({ items: [{ id: 'late-one', regionId: 'r1' }] });
  await setDone('late-one', true);
  assert.ok((await loadProgress()).done.has('late-one'));
});

// ----------------------------------------------------------- subscriptions

test('onProgressChange gets fresh Sets after a change, and unsubscribe stops it', async () => {
  const seen = [];
  const unsubscribe = onProgressChange((p) => seen.push(p));
  await setDone('a', true);
  assert.equal(seen.length, 1);
  assert.ok(seen[0].done instanceof Set && seen[0].visited instanceof Set);
  assert.ok(seen[0].done.has('a'));
  unsubscribe();
  await setDone('b', true);
  assert.equal(seen.length, 1);
});

test('onSyncStatus reports the local state in this task', () => {
  const seen = [];
  const unsubscribe = onSyncStatus((s) => seen.push(s));
  assert.deepEqual(seen, [{ state: 'local', at: null, message: '' }]);
  assert.equal(typeof unsubscribe, 'function');
});

// ------------------------------------------------------- corrupt / missing

test('missing storage value starts empty', async () => {
  const { done, visited } = await loadProgress();
  assert.equal(done.size, 0);
  assert.equal(visited.size, 0);
});

test('corrupt JSON in storage starts empty and does not throw', async () => {
  useStorage(fakeStorage({ [KEY]: '{not json' }));
  const { done, visited } = await loadProgress();
  assert.equal(done.size + visited.size, 0);
});

test('wrong-shaped JSON in storage starts empty', async () => {
  for (const bad of ['null', '42', '"text"', '[1,2]', '{"done":"nope","visited":7}']) {
    useStorage(fakeStorage({ [KEY]: bad }));
    const { done, visited } = await loadProgress();
    assert.equal(done.size + visited.size, 0, `value ${bad}`);
  }
});

test('after corrupt storage, the next change works and overwrites it', async () => {
  const bad = fakeStorage({ [KEY]: '{not json' });
  useStorage(bad);
  await setDone('a', true);
  assert.deepEqual(stored(bad).done, { a: true });
});

test('a storage that throws does not lose the session\'s work', async () => {
  const broken = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('full');
    },
  };
  useStorage(broken);
  await setDone('a', true);
  assert.ok((await loadProgress()).done.has('a'));
});

// ------------------------------------------------------------ export/import

test('export is JSON without syncedUid', async () => {
  useStorage(fakeStorage({ [KEY]: JSON.stringify({ done: { a: true }, visited: { r: true }, updatedAt: 9, dataVersion: 1, syncedUid: 'u1' }) }));
  const blob = exportProgress();
  assert.ok(blob instanceof Blob);
  const exported = JSON.parse(await blob.text());
  assert.ok(!('syncedUid' in exported));
  assert.deepEqual(exported.done, { a: true });
  assert.deepEqual(exported.visited, { r: true });
  assert.equal(exported.updatedAt, 9);
});

test('import adds to what is there and never removes', async () => {
  await setDone('mine', true);
  const backup = { done: { mine: true, theirs: true }, visited: { r: true }, updatedAt: 1, dataVersion: 1 };
  const result = await importProgress(fileOf(JSON.stringify(backup)));
  assert.deepEqual(result, { addedDone: 1, addedVisited: 1, addedSlots: 0, addedBuilds: 0 });
  const { done, visited } = await loadProgress();
  assert.deepEqual([...done].sort(), ['mine', 'theirs']);
  assert.deepEqual([...visited], ['r']);
});

test('import of a smaller backup removes nothing', async () => {
  await setDone('a', true);
  await setDone('b', true);
  const result = await importProgress(fileOf(JSON.stringify({ done: { a: true }, visited: {} })));
  assert.deepEqual(result, { addedDone: 0, addedVisited: 0, addedSlots: 0, addedBuilds: 0 });
  assert.equal((await loadProgress()).done.size, 2);
});

test('an import that adds nothing does not notify or move updatedAt', async () => {
  await setDone('a', true);
  const stamp = stored(storage).updatedAt;
  let calls = 0;
  onProgressChange(() => (calls += 1));
  const result = await importProgress(fileOf(JSON.stringify({ done: { a: true }, visited: {} })));
  assert.deepEqual(result, { addedDone: 0, addedVisited: 0, addedSlots: 0, addedBuilds: 0 });
  assert.equal(calls, 0);
  assert.equal(stored(storage).updatedAt, stamp);
});

test('import notifies subscribers when something was added', async () => {
  useStorage(fakeStorage({ [KEY]: JSON.stringify({ done: {}, visited: {}, updatedAt: 1, dataVersion: 1, syncedUid: 'u1' }) }));
  let calls = 0;
  onProgressChange(() => (calls += 1));
  await importProgress(fileOf(JSON.stringify({ done: { a: true }, visited: {} })));
  assert.equal(calls, 1);
});

test('import rejects bad files with a message the interface can show', async () => {
  const badFiles = [
    'not json at all',
    'null',
    '[]',
    '{}',
    '{"visited":{}}',
    '{"done":[1,2]}',
    '{"done":{},"visited":"x"}',
    '{"done":{"Not A Slug":true}}',
    '{"done":{"__proto__":true}}',
    '{"done":{"a":"yes"}}',
  ];
  for (const text of badFiles) {
    await assert.rejects(importProgress(fileOf(text)), (error) => {
      assert.match(error.message, /not a Silksong Guide backup/);
      return true;
    }, `should reject: ${text}`);
  }
  assert.equal((await loadProgress()).done.size, 0, 'a rejected file changes nothing');
});

test('export has exactly the Progress keys: done, visited, updatedAt, dataVersion', async () => {
  useStorage(fakeStorage({ [KEY]: JSON.stringify({ done: { a: true }, visited: {}, updatedAt: 9, dataVersion: 1, syncedUid: 'u1' }) }));
  const exported = JSON.parse(await exportProgress().text());
  assert.deepEqual(Object.keys(exported).sort(), ['dataVersion', 'done', 'updatedAt', 'visited']);
});

test('export then import on a clean device round-trips', async () => {
  configureProgress({ items: [{ id: 'a', regionId: 'r' }] });
  await setDone('a', true);
  const blob = exportProgress();
  const other = fakeStorage();
  useStorage(other);
  await importProgress(new File([await blob.text()], 'b.json'));
  const { done, visited } = await loadProgress();
  assert.deepEqual([...done], ['a']);
  assert.deepEqual([...visited], ['r']);
});

// ------------------------------------------------------------------- clear

test('clearProgress empties done and visited, keeps syncedUid, notifies', async () => {
  const seeded = fakeStorage({ [KEY]: JSON.stringify({ done: { a: true }, visited: { r: true }, updatedAt: 1, dataVersion: 1, syncedUid: 'u1' }) });
  useStorage(seeded);
  let calls = 0;
  onProgressChange(() => (calls += 1));
  await clearProgress();
  const { done, visited } = await loadProgress();
  assert.equal(done.size + visited.size, 0);
  assert.equal(stored(seeded).syncedUid, 'u1');
  assert.ok(stored(seeded).updatedAt > 1);
  assert.equal(calls, 1);
});

// ------------------------------------------------------------- sample mode
// configureProgress({ sample: true }) keeps invented sample ids in their own key
// (docs/CONTRACTS.md section 3, QA finding F4).

const SAMPLE_KEY = 'silksong-guide:progress:sample:v1';
const storedSample = (s) => JSON.parse(s.data.get(SAMPLE_KEY));

test('sample mode: writes go to the sample key and leave the real key untouched', async () => {
  const real = { done: { real: true }, visited: {}, updatedAt: 5, dataVersion: 1 };
  useStorage((storage = fakeStorage({ [KEY]: JSON.stringify(real) })));
  configureProgress({ items: [{ id: 'fake-entry', regionId: 'fake-region' }], dataVersion: 9, sample: true });

  await setDone('fake-entry', true);
  await setVisited('other-region', true);

  assert.deepEqual(Object.keys(storedSample(storage).done), ['fake-entry']);
  assert.deepEqual(Object.keys(storedSample(storage).visited).sort(), ['fake-region', 'other-region']);
  assert.deepEqual(stored(storage), real, 'the real Run is exactly what it was');
});

test('sample mode: reads come from the sample key, never the real one', async () => {
  useStorage(
    (storage = fakeStorage({
      [KEY]: JSON.stringify({ done: { real: true }, visited: { 'real-region': true }, updatedAt: 5, dataVersion: 1 }),
      [SAMPLE_KEY]: JSON.stringify({ done: { fake: true }, visited: {}, updatedAt: 6, dataVersion: 1 }),
    }))
  );
  configureProgress({ sample: true });
  const loaded = await loadProgress();
  assert.deepEqual([...loaded.done], ['fake']);
  assert.deepEqual([...loaded.visited], []);
});

test('sample mode: without the flag the sample key is left alone', async () => {
  const sample = { done: { fake: true }, visited: {}, updatedAt: 6, dataVersion: 1 };
  useStorage((storage = fakeStorage({ [SAMPLE_KEY]: JSON.stringify(sample) })));
  configureProgress({ items: [], dataVersion: 1 });
  await setDone('real', true);
  assert.deepEqual(Object.keys(stored(storage).done), ['real']);
  assert.deepEqual(storedSample(storage), sample);
});

test('sample mode: subscribers get the sample Progress when the mode switches', () => {
  useStorage(
    (storage = fakeStorage({
      [KEY]: JSON.stringify({ done: { real: true }, visited: {}, updatedAt: 5, dataVersion: 1 }),
      [SAMPLE_KEY]: JSON.stringify({ done: { fake: true }, visited: {}, updatedAt: 6, dataVersion: 1 }),
    }))
  );
  const seen = [];
  onProgressChange((p) => seen.push([...p.done]));
  configureProgress({ sample: true });
  assert.deepEqual(seen, [['fake']]);
});

test('sample mode: switching after the real key was read keeps real data out of the sample', async () => {
  const real = { done: { real: true }, visited: {}, updatedAt: 5, dataVersion: 1 };
  useStorage((storage = fakeStorage({ [KEY]: JSON.stringify(real) })));
  assert.deepEqual([...(await loadProgress()).done], ['real']); // the real key was read first
  configureProgress({ sample: true });
  assert.deepEqual([...(await loadProgress()).done], []);
  await setDone('fake', true);
  assert.deepEqual(Object.keys(storedSample(storage).done), ['fake']);
  assert.deepEqual(stored(storage), real);
});

test('sample mode: export, import and clear act on the sample Progress', async () => {
  const real = { done: { real: true }, visited: {}, updatedAt: 5, dataVersion: 1 };
  useStorage((storage = fakeStorage({ [KEY]: JSON.stringify(real) })));
  configureProgress({ sample: true });
  await setDone('fake', true);

  const exported = JSON.parse(await exportProgress().text());
  assert.deepEqual(Object.keys(exported.done), ['fake']);

  const backup = JSON.stringify({ done: { 'fake-two': true }, visited: { 'fake-region': true } });
  assert.deepEqual(await importProgress(fileOf(backup)), { addedDone: 1, addedVisited: 1, addedSlots: 0, addedBuilds: 0 });
  assert.deepEqual(Object.keys(storedSample(storage).done).sort(), ['fake', 'fake-two']);

  await clearProgress();
  assert.deepEqual(storedSample(storage).done, {});
  assert.deepEqual(storedSample(storage).visited, {});
  assert.deepEqual(stored(storage), real, 'the real Run survives export, import and clear in sample mode');
});

test('sample mode: sync status stays local', async () => {
  const states = [];
  onSyncStatus((s) => states.push(s.state));
  configureProgress({ sample: true });
  await setDone('fake', true);
  assert.ok(states.length > 0);
  assert.ok(states.every((state) => state === 'local'), `got ${states.join(', ')}`);
});

// ------------------------------------------------- player choices (ADR 0006)
// crestSlots and builds are optional fields of Progress (docs/CONTRACTS.md sections 1 and 3).
// "Missing is not empty": an absent field means a copy written by a page that does not know it,
// so an ordinary change never adds it. shellShards was dropped (ADR 0007), so no test covers it here.

const CREST = 'reaper-crest';
const CREST_B = 'second-crest';
const BUILD_A = { red: ['tool-one'] };
const BUILD_B = { blue: ['tool-two'] };
const ids = (n, prefix = 'tool') => Array.from({ length: n }, (_, i) => `${prefix}-${i}`);

// A storage stand-in that counts writes, so "writes nothing" can be asserted.
function useCountingStorage(initial = {}) {
  const inner = fakeStorage(initial);
  storage = {
    ...inner,
    writeCount: 0,
    setItem(k, v) {
      storage.writeCount += 1;
      inner.setItem(k, v);
    },
  };
  useStorage(storage);
  return storage;
}

function collectChanges() {
  const seen = [];
  onProgressChange((p) => seen.push(p));
  return seen;
}

// --- loading and malformed storage

test('Progress without the player choices loads with {} and {}, and loading writes nothing', async () => {
  useCountingStorage({ [KEY]: JSON.stringify({ done: { a: true }, visited: {}, updatedAt: 5, dataVersion: 1 }) });
  const before = storage.data.get(KEY);
  const loaded = await loadProgress();
  assert.deepEqual(loaded.crestSlots, {});
  assert.deepEqual(loaded.builds, {});
  assert.deepEqual([...loaded.done], ['a']);
  assert.equal(storage.writeCount, 0);
  assert.equal(storage.data.get(KEY), before);
});

test('malformed player choices in storage are dropped, and the done ids are kept', async () => {
  useStorage(
    (storage = fakeStorage({
      [KEY]: JSON.stringify({ done: { a: true, b: true }, visited: {}, updatedAt: 5, dataVersion: 1, crestSlots: 'nope', builds: [1, 2] }),
    }))
  );
  const loaded = await loadProgress();
  assert.deepEqual([...loaded.done].sort(), ['a', 'b']);
  assert.deepEqual(loaded.crestSlots, {});
  assert.deepEqual(loaded.builds, {});
});

test('a malformed part of a player choice is dropped and the good parts are kept', async () => {
  useStorage(
    (storage = fakeStorage({
      [KEY]: JSON.stringify({
        done: { a: true },
        visited: {},
        updatedAt: 5,
        dataVersion: 1,
        crestSlots: {
          [CREST]: { blue: 2, green: 4, red: 0 }, // an unknown colour and a zero
          'Not A Slug': { blue: 1 }, // a Crest id that is not a slug
          [CREST_B]: 'x', // not an object
        },
        builds: {
          // a bad id goes; blue repeats tool-one from red, so blue goes; white is empty
          [CREST]: { red: ['tool-one', 'Not A Slug'], blue: ['tool-one'], white: [] },
          [CREST_B]: { green: ['tool-two'] }, // an unknown colour only: the Crest goes
        },
      }),
    }))
  );
  const loaded = await loadProgress();
  assert.deepEqual([...loaded.done], ['a']);
  assert.deepEqual(loaded.crestSlots, { [CREST]: { blue: 2 } });
  assert.deepEqual(loaded.builds, { [CREST]: { red: ['tool-one'] } });
});

test('in storage, a colour with more than 12 ids is dropped and a colour with 12 is kept', async () => {
  useStorage(
    (storage = fakeStorage({
      [KEY]: JSON.stringify({ done: {}, visited: {}, updatedAt: 5, dataVersion: 1, builds: { [CREST]: { red: ids(12), blue: ids(13, 'blue') } } }),
    }))
  );
  assert.deepEqual((await loadProgress()).builds, { [CREST]: { red: ids(12) } });
});

// --- the setters

test('setCrestSlots stores the opened slots, stamps updatedAt and notifies', async () => {
  useCountingStorage();
  const seen = collectChanges();
  const before = Date.now();
  await setCrestSlots(CREST, { blue: 2, red: 1 });
  const saved = stored(storage);
  assert.deepEqual(saved.crestSlots, { [CREST]: { red: 1, blue: 2 } });
  assert.ok(saved.updatedAt >= before);
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0].crestSlots, { [CREST]: { red: 1, blue: 2 } });
  assert.deepEqual(seen[0].builds, {});
});

test('setCrestSlots replaces the opened slots of that Crest and keeps the other Crests', async () => {
  useCountingStorage();
  await setCrestSlots(CREST, { blue: 2 });
  await setCrestSlots(CREST, { red: 1 });
  await setCrestSlots(CREST_B, { white: 1 });
  assert.deepEqual(stored(storage).crestSlots, { [CREST]: { red: 1 }, [CREST_B]: { white: 1 } });
});

test('setCrestSlots: a zero removes that colour, and all zeros leave the field as {}', async () => {
  useCountingStorage();
  await setCrestSlots(CREST, { blue: 2, red: 1 });
  await setCrestSlots(CREST, { blue: 0, red: 1 });
  assert.deepEqual(stored(storage).crestSlots, { [CREST]: { red: 1 } });
  await setCrestSlots(CREST, { red: 0 });
  const saved = stored(storage);
  assert.deepEqual(saved.crestSlots, {}, 'the Crest key is deleted; the field stays, empty');
  assert.equal(CREST in saved.crestSlots, false);
});

test('setCrestSlots accepts 1 to 99 opened slots', async () => {
  useCountingStorage();
  await setCrestSlots(CREST, { blue: 99, white: 1 });
  assert.deepEqual(stored(storage).crestSlots, { [CREST]: { blue: 99, white: 1 } });
});

test('setBuild saves one Build per Crest, keeps the other Crests and replaces the last Build', async () => {
  useCountingStorage();
  await setBuild(CREST, { red: ['tool-one'], blue: ['tool-two'] });
  await setBuild(CREST_B, { white: ['skill-one'] });
  await setBuild(CREST, { white: ['skill-one'] });
  assert.deepEqual(stored(storage).builds, {
    [CREST]: { white: ['skill-one'] },
    [CREST_B]: { white: ['skill-one'] },
  });
});

test('setBuild does not store empty colour lists', async () => {
  useCountingStorage();
  await setBuild(CREST, { red: ['tool-one'], blue: [] });
  assert.deepEqual(stored(storage).builds, { [CREST]: { red: ['tool-one'] } });
});

test('setBuild with null, or a Build with no ids, deletes the Build', async () => {
  useCountingStorage();
  await setBuild(CREST, BUILD_A);
  await setBuild(CREST, null);
  assert.equal(CREST in stored(storage).builds, false);
  await setBuild(CREST, BUILD_A);
  await setBuild(CREST, { red: [], blue: [] });
  assert.equal(CREST in stored(storage).builds, false);
  assert.deepEqual(stored(storage).builds, {}, 'the field stays, empty');
});

test('setBuild accepts up to 12 ids in one colour, even when they do not fit the Crest (checkBuild reports that)', async () => {
  useCountingStorage();
  await setBuild(CREST, { red: ids(12) });
  assert.deepEqual(stored(storage).builds, { [CREST]: { red: ids(12) } });
});

test('the order of the ids in a Build is part of it: a reordered Build is a change', async () => {
  useCountingStorage();
  await setBuild(CREST, { red: ['tool-one', 'tool-two'] });
  const seen = collectChanges();
  await setBuild(CREST, { red: ['tool-two', 'tool-one'] });
  assert.equal(seen.length, 1);
  assert.deepEqual(stored(storage).builds, { [CREST]: { red: ['tool-two', 'tool-one'] } });
});

test('ids are checked as slugs only: an id the data does not know is stored', async () => {
  useCountingStorage();
  await setCrestSlots('no-such-crest', { blue: 1 });
  await setBuild('no-such-crest', { red: ['no-such-tool'] });
  assert.deepEqual(stored(storage).crestSlots, { 'no-such-crest': { blue: 1 } });
  assert.deepEqual(stored(storage).builds, { 'no-such-crest': { red: ['no-such-tool'] } });
});

test('a setter called again with the same value does not stamp, notify or write', async () => {
  useCountingStorage();
  await setCrestSlots(CREST, { blue: 2 });
  await setBuild(CREST, { red: ['tool-one'] });
  const saved = stored(storage);
  const writes = storage.writeCount;
  const seen = collectChanges();
  await setCrestSlots(CREST, { blue: 2 });
  await setBuild(CREST, { red: ['tool-one'] });
  await setBuild(CREST, { red: ['tool-one'], blue: [] }); // the empty list is not stored: the same Build
  await setCrestSlots(CREST_B, {}); // nothing opened: nothing to store
  assert.equal(seen.length, 0);
  assert.equal(storage.writeCount, writes);
  assert.equal(stored(storage).updatedAt, saved.updatedAt);
});

test('zeros on a Progress without the field change nothing and add no field', async () => {
  useCountingStorage();
  const seen = collectChanges();
  await setCrestSlots(CREST, { blue: 0 });
  await setCrestSlots(CREST, {});
  await setBuild(CREST, null);
  await setBuild(CREST, { red: [] });
  assert.equal(seen.length, 0);
  assert.equal(storage.writeCount, 0);
  assert.equal(storage.data.has(KEY), false, 'nothing was stored');
});

// A bad argument is an interface bug: a TypeError, and nothing is written or announced.
const BAD_CREST_SLOTS = [
  ['Reaper Crest', { blue: 1 }], // not a slug
  ['', { blue: 1 }],
  [42, { blue: 1 }],
  [null, { blue: 1 }],
  [CREST, null],
  [CREST, []],
  [CREST, 'blue'],
  [CREST, { green: 1 }], // unknown colour
  [CREST, { blue: 1.5 }],
  [CREST, { blue: '2' }],
  [CREST, { blue: -1 }],
  [CREST, { blue: 100 }],
  [CREST, { blue: null }],
  [CREST, { blue: NaN }],
];

const BAD_BUILDS = [
  ['Reaper Crest', { red: ['tool-one'] }], // not a slug
  [42, { red: ['tool-one'] }],
  [CREST, []], // an array is not a Build
  [CREST, 'red'],
  [CREST, { green: ['tool-one'] }], // unknown colour
  [CREST, { red: 'tool-one' }], // not a list
  [CREST, { red: ['Tool One'] }], // not a slug
  [CREST, { red: [7] }],
  [CREST, { red: ['tool-one', 'tool-one'] }], // an id twice in one colour
  [CREST, { red: ['tool-one'], blue: ['tool-one'] }], // an id twice across colours
  [CREST, { red: ids(13) }], // more than 12
];

test('setCrestSlots refuses a bad argument with a TypeError and writes nothing', async () => {
  useCountingStorage();
  const seen = collectChanges();
  for (const [crestId, opened] of BAD_CREST_SLOTS) {
    await assert.rejects(setCrestSlots(crestId, opened), TypeError, `setCrestSlots(${JSON.stringify(crestId)}, ${JSON.stringify(opened)})`);
  }
  assert.equal(storage.writeCount, 0);
  assert.equal(seen.length, 0);
  assert.equal(storage.data.has(KEY), false);
});

test('setBuild refuses a bad argument with a TypeError and writes nothing', async () => {
  useCountingStorage();
  const seen = collectChanges();
  for (const [crestId, build] of BAD_BUILDS) {
    await assert.rejects(setBuild(crestId, build), TypeError, `setBuild(${JSON.stringify(crestId)}, ${JSON.stringify(build)})`);
  }
  assert.equal(storage.writeCount, 0);
  assert.equal(seen.length, 0);
  assert.equal(storage.data.has(KEY), false);
});

// --- the rest of Progress keeps the fields as they are

test('setDone and setVisited on a Progress without the player choices do not add them', async () => {
  useCountingStorage({ [KEY]: JSON.stringify({ done: {}, visited: {}, updatedAt: 5, dataVersion: 1 }) });
  configureProgress({ items: [{ id: 'mask-1', regionId: 'moss-grotto' }] });
  await setDone('mask-1', true);
  await setVisited('deep-docks', true);
  await setDone('mask-1', false);
  const saved = stored(storage);
  assert.equal('crestSlots' in saved, false);
  assert.equal('builds' in saved, false);
});

test('setDone keeps the saved player choices exactly as they are', async () => {
  await setCrestSlots(CREST, { blue: 2 });
  await setBuild(CREST, BUILD_A);
  await setDone('mask-1', true);
  const loaded = await loadProgress();
  assert.deepEqual(loaded.crestSlots, { [CREST]: { blue: 2 } });
  assert.deepEqual(loaded.builds, { [CREST]: BUILD_A });
});

test('loadProgress hands out copies: changing them does not change the saved Progress', async () => {
  await setBuild(CREST, BUILD_A);
  const first = await loadProgress();
  first.builds[CREST].red.push('tool-two');
  first.crestSlots.extra = { blue: 1 };
  delete first.builds[CREST];
  const again = await loadProgress();
  assert.deepEqual(again.builds, { [CREST]: BUILD_A });
  assert.deepEqual(again.crestSlots, {});
});

// --- merge (pure)

const base = { done: {}, visited: {}, dataVersion: 1 };

test('merge first sign-in: opened slots take the larger number per Crest and colour', () => {
  const local = { ...base, updatedAt: 1000, crestSlots: { [CREST]: { blue: 2, red: 1 } } };
  const cloud = { ...base, updatedAt: 500, crestSlots: { [CREST]: { blue: 1, yellow: 3 }, [CREST_B]: { white: 1 } } };
  assert.deepEqual(mergeLocalAndCloud(local, cloud, 'u1').crestSlots, {
    [CREST]: { red: 1, blue: 2, yellow: 3 },
    [CREST_B]: { white: 1 },
  });
});

test('merge first sign-in: Builds for different Crests are both kept', () => {
  const local = { ...base, updatedAt: 1000, builds: { [CREST]: BUILD_A } };
  const cloud = { ...base, updatedAt: 500, builds: { [CREST_B]: BUILD_B } };
  assert.deepEqual(mergeLocalAndCloud(local, cloud, 'u1').builds, { [CREST]: BUILD_A, [CREST_B]: BUILD_B });
});

test('merge first sign-in: for the same Crest the newer copy keeps its Build whole, never glued together', () => {
  const localBuild = { ...base, updatedAt: 2000, builds: { [CREST]: BUILD_A } };
  const cloudBuild = { ...base, updatedAt: 1000, builds: { [CREST]: BUILD_B } };
  assert.deepEqual(mergeLocalAndCloud(localBuild, cloudBuild, 'u1').builds, { [CREST]: BUILD_A }, 'local is newer');
  assert.deepEqual(
    mergeLocalAndCloud({ ...localBuild, updatedAt: 500 }, { ...cloudBuild, updatedAt: 1500 }, 'u1').builds,
    { [CREST]: BUILD_B },
    'the cloud copy is newer'
  );
  assert.deepEqual(
    mergeLocalAndCloud({ ...localBuild, updatedAt: 1000 }, cloudBuild, 'u1').builds,
    { [CREST]: BUILD_A },
    'a tie keeps the local Build'
  );
});

test('merge first sign-in: a field on one side only is taken, and on neither side it stays absent', () => {
  const onlyLocal = mergeLocalAndCloud({ ...base, updatedAt: 1000, crestSlots: { [CREST]: { blue: 1 } } }, { ...base, updatedAt: 500 }, 'u1');
  assert.deepEqual(onlyLocal.crestSlots, { [CREST]: { blue: 1 } });
  assert.equal('builds' in onlyLocal, false);

  const onlyCloud = mergeLocalAndCloud({ ...base, updatedAt: 1000 }, { ...base, updatedAt: 500, builds: { [CREST]: BUILD_A } }, 'u1');
  assert.deepEqual(onlyCloud.builds, { [CREST]: BUILD_A });
  assert.equal('crestSlots' in onlyCloud, false);

  const neither = mergeLocalAndCloud({ ...base, updatedAt: 1000 }, { ...base, updatedAt: 500 }, 'u1');
  assert.equal('crestSlots' in neither, false);
  assert.equal('builds' in neither, false);
});

test('merge first sign-in: a present empty field is known and takes part in the union', () => {
  const local = { ...base, updatedAt: 1000, crestSlots: {} };
  const cloud = { ...base, updatedAt: 500, crestSlots: { [CREST]: { blue: 1 } } };
  assert.deepEqual(mergeLocalAndCloud(local, cloud, 'u1').crestSlots, { [CREST]: { blue: 1 } });
  assert.deepEqual(mergeLocalAndCloud(local, { ...base, updatedAt: 500 }, 'u1').crestSlots, {}, 'stays present');
});

test('merge afterwards (same account): the newer copy wins with its fields, and a field the winner lacks comes from the other copy', () => {
  const local = {
    ...base,
    updatedAt: 1000,
    syncedUid: 'u1',
    crestSlots: { [CREST]: { blue: 1 } },
    builds: { [CREST]: BUILD_A },
  };
  const cloud = { ...base, updatedAt: 2000, syncedUid: 'u1', builds: { [CREST_B]: BUILD_B } };
  const result = mergeLocalAndCloud(local, cloud, 'u1');
  assert.deepEqual(result.builds, { [CREST_B]: BUILD_B }, 'the winner\'s Builds, whole: not glued to this device\'s');
  assert.deepEqual(result.crestSlots, { [CREST]: { blue: 1 } }, 'absent in the winner: taken from the other copy');
  assert.equal(result.updatedAt, 2000);
  assert.equal(result.syncedUid, 'u1');
});

test('merge afterwards: an empty field on the winner is its own value and is not filled from the other copy', () => {
  // This is what "Start a new run" writes: the empty value must win over an older cloud copy.
  const local = { ...base, updatedAt: 3000, syncedUid: 'u1', builds: {}, crestSlots: {} };
  const cloud = { ...base, updatedAt: 2000, syncedUid: 'u1', builds: { [CREST]: BUILD_A } };
  const result = mergeLocalAndCloud(local, cloud, 'u1');
  assert.deepEqual(result.builds, {});
  assert.deepEqual(result.crestSlots, {});
});

test('merge afterwards: a field absent on both sides stays absent', () => {
  const result = mergeLocalAndCloud({ ...base, updatedAt: 3000, syncedUid: 'u1' }, { ...base, updatedAt: 2000, syncedUid: 'u1' }, 'u1');
  assert.equal('crestSlots' in result, false);
  assert.equal('builds' in result, false);
});

// --- clear, export, import

test('clearProgress writes crestSlots {} and builds {} explicitly, and keeps syncedUid', async () => {
  useCountingStorage({
    [KEY]: JSON.stringify({ done: { a: true }, visited: {}, updatedAt: 1, dataVersion: 1, syncedUid: 'u1' }),
  });
  await clearProgress();
  const saved = stored(storage);
  assert.deepEqual(saved.crestSlots, {});
  assert.deepEqual(saved.builds, {});
  assert.equal(saved.syncedUid, 'u1');
  const loaded = await loadProgress();
  assert.deepEqual(loaded.crestSlots, {});
  assert.deepEqual(loaded.builds, {});
});

test('export leaves absent player choices absent, and includes the present ones', async () => {
  useStorage(
    (storage = fakeStorage({
      [KEY]: JSON.stringify({ done: { a: true }, visited: {}, updatedAt: 9, dataVersion: 1, syncedUid: 'u1' }),
    }))
  );
  const plain = JSON.parse(await exportProgress().text());
  assert.deepEqual(Object.keys(plain).sort(), ['dataVersion', 'done', 'updatedAt', 'visited']);

  await setCrestSlots(CREST, { blue: 2 });
  await setBuild(CREST, BUILD_A);
  const full = JSON.parse(await exportProgress().text());
  assert.deepEqual(full.crestSlots, { [CREST]: { blue: 2 } });
  assert.deepEqual(full.builds, { [CREST]: BUILD_A });
  assert.equal('syncedUid' in full, false);
});

test('import of a backup from before Phase 5 adds ids only and creates no player-choice field', async () => {
  await setDone('mine', true);
  const result = await importProgress(fileOf(JSON.stringify({ done: { theirs: true }, visited: {} })));
  assert.deepEqual(result, { addedDone: 1, addedVisited: 0, addedSlots: 0, addedBuilds: 0 });
  assert.equal('crestSlots' in stored(storage), false);
  assert.equal('builds' in stored(storage), false);
});

test('an import of empty player-choice objects adds nothing and creates no field', async () => {
  await setDone('mine', true);
  const file = { done: { theirs: true }, visited: {}, crestSlots: {}, builds: {} };
  const result = await importProgress(fileOf(JSON.stringify(file)));
  assert.deepEqual(result, { addedDone: 1, addedVisited: 0, addedSlots: 0, addedBuilds: 0 });
  assert.equal('crestSlots' in stored(storage), false);
  assert.equal('builds' in stored(storage), false);
});

test('import takes the larger opened-slot numbers and reports the sum of the increases', async () => {
  await setCrestSlots(CREST, { blue: 2, red: 1 });
  const file = { done: {}, visited: {}, crestSlots: { [CREST]: { blue: 1, red: 3, yellow: 2 }, [CREST_B]: { white: 1 } } };
  const result = await importProgress(fileOf(JSON.stringify(file)));
  // red 1 -> 3 (+2), yellow 0 -> 2 (+2), white 0 -> 1 (+1); blue stays 2 (the file's 1 is smaller)
  assert.deepEqual(result, { addedDone: 0, addedVisited: 0, addedSlots: 5, addedBuilds: 0 });
  assert.deepEqual(stored(storage).crestSlots, { [CREST]: { red: 3, blue: 2, yellow: 2 }, [CREST_B]: { white: 1 } });
});

test('import adds a Build only for a Crest that has none here, and never replaces one', async () => {
  await setBuild(CREST, BUILD_A);
  const file = { done: {}, visited: {}, builds: { [CREST]: BUILD_B, [CREST_B]: { red: ['tool-three'] } } };
  const result = await importProgress(fileOf(JSON.stringify(file)));
  assert.equal(result.addedBuilds, 1);
  assert.equal(result.addedSlots, 0);
  assert.deepEqual(stored(storage).builds, { [CREST]: BUILD_A, [CREST_B]: { red: ['tool-three'] } });
});

test('an import that adds no player choices does not notify or move updatedAt', async () => {
  await setCrestSlots(CREST, { blue: 3 });
  await setBuild(CREST, BUILD_A);
  const stamp = stored(storage).updatedAt;
  const seen = collectChanges();
  const file = { done: {}, visited: {}, crestSlots: { [CREST]: { blue: 2 } }, builds: { [CREST]: BUILD_B } };
  const result = await importProgress(fileOf(JSON.stringify(file)));
  assert.deepEqual(result, { addedDone: 0, addedVisited: 0, addedSlots: 0, addedBuilds: 0 });
  assert.equal(seen.length, 0);
  assert.equal(stored(storage).updatedAt, stamp);
});

test('import refuses a file with a malformed player choice whole, and adds no ids either', async () => {
  await setDone('mine', true);
  const malformed = [
    { builds: 'nope' },
    { builds: null },
    { builds: [] },
    { builds: { [CREST]: { green: ['tool-one'] } } }, // unknown colour
    { builds: { [CREST]: { red: 'tool-one' } } },
    { builds: { [CREST]: { red: ['Tool One'] } } }, // not a slug
    { builds: { [CREST]: { red: ['tool-one', 'tool-one'] } } }, // an id twice
    { builds: { [CREST]: { red: ids(13) } } }, // more than 12
    { builds: { [CREST]: {} } }, // a Crest with no colour
    { builds: { 'Bad Crest': { red: ['tool-one'] } } },
    { crestSlots: 'nope' },
    { crestSlots: null },
    { crestSlots: [] },
    { crestSlots: { [CREST]: { blue: 0 } } }, // the contract gives 1 to 99 (section 1)
    { crestSlots: { [CREST]: { blue: '2' } } },
    { crestSlots: { [CREST]: { blue: 100 } } },
    { crestSlots: { [CREST]: { green: 1 } } },
  ];
  for (const extra of malformed) {
    const text = JSON.stringify({ done: { 'new-one': true }, visited: {}, ...extra });
    await assert.rejects(
      importProgress(fileOf(text)),
      (error) => {
        assert.match(error.message, /not a Silksong Guide backup/);
        return true;
      },
      `should reject: ${JSON.stringify(extra)}`
    );
  }
  const loaded = await loadProgress();
  assert.deepEqual([...loaded.done], ['mine'], 'a rejected file adds no id');
  assert.deepEqual(loaded.crestSlots, {});
  assert.deepEqual(loaded.builds, {});
});
