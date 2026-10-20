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
  assert.deepEqual(result, { addedDone: 1, addedVisited: 1 });
  const { done, visited } = await loadProgress();
  assert.deepEqual([...done].sort(), ['mine', 'theirs']);
  assert.deepEqual([...visited], ['r']);
});

test('import of a smaller backup removes nothing', async () => {
  await setDone('a', true);
  await setDone('b', true);
  const result = await importProgress(fileOf(JSON.stringify({ done: { a: true }, visited: {} })));
  assert.deepEqual(result, { addedDone: 0, addedVisited: 0 });
  assert.equal((await loadProgress()).done.size, 2);
});

test('an import that adds nothing does not notify or move updatedAt', async () => {
  await setDone('a', true);
  const stamp = stored(storage).updatedAt;
  let calls = 0;
  onProgressChange(() => (calls += 1));
  const result = await importProgress(fileOf(JSON.stringify({ done: { a: true }, visited: {} })));
  assert.deepEqual(result, { addedDone: 0, addedVisited: 0 });
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
