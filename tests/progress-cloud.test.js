// Tests for the cloud half of js/progress.js (docs/CONTRACTS.md sections 3 and 4).
// No test reaches the network: useCloud swaps the firebase.js functions for a fake,
// and useStorage swaps localStorage for an in-memory stand-in.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  useStorage,
  useCloud,
  loadProgress,
  setDone,
  setVisited,
  onProgressChange,
  onSyncStatus,
  clearProgress,
} from '../js/progress.js';
import { onAuthChange, watchProgressDoc } from '../js/firebase.js';

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
const seed = (progress) => fakeStorage({ [KEY]: JSON.stringify(progress) });

// Lets every pending promise step run (the fake answers at once, so this is enough).
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setImmediate(resolve));
};

const doc = (done, updatedAt, visited = {}) => ({
  done: Object.fromEntries(done.map((id) => [id, true])),
  visited,
  updatedAt,
  dataVersion: 1,
});

// A stand-in for the five firebase.js functions that progress.js uses.
function makeCloud(initialDoc = null) {
  const cloud = {
    doc: initialDoc,
    calls: [],
    failRead: false,
    failWrite: false,
    readGate: null, // a promise to wait for before the read answers
    authCallback: null,
    watchCallback: null,
    watchError: null,
  };
  const failure = () => Object.assign(new Error('network down'), { code: 'unavailable' });
  cloud.api = {
    onAuthChange(callback) {
      cloud.authCallback = callback;
      return () => {
        cloud.authCallback = null;
      };
    },
    async readProgressDoc(uid) {
      cloud.calls.push(['read', uid]);
      if (cloud.readGate) await cloud.readGate;
      if (cloud.failRead) throw failure();
      return cloud.doc ? structuredClone(cloud.doc) : null;
    },
    async writeProgressDoc(uid, progress) {
      cloud.calls.push(['write', uid, structuredClone(progress)]);
      if (cloud.failWrite) throw failure();
      cloud.doc = structuredClone(progress);
    },
    async deleteProgressDoc(uid) {
      cloud.calls.push(['delete', uid]);
      cloud.doc = null;
    },
    watchProgressDoc(uid, callback, onError) {
      cloud.calls.push(['watch', uid]);
      cloud.watchCallback = callback;
      cloud.watchError = onError;
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
  cloud.signOut = async () => {
    cloud.authCallback(null);
    await flush();
  };
  cloud.writes = () => cloud.calls.filter(([kind]) => kind === 'write');
  return cloud;
}

let storage;
let statuses;
let changes;

function listen() {
  statuses = [];
  changes = [];
  onSyncStatus((s) => statuses.push(s));
  onProgressChange((p) => changes.push(p));
}

beforeEach(() => {
  storage = fakeStorage();
  useStorage(storage); // also resets the cloud half
});

// ------------------------------------------------------------ first sign-in

test('first sign-in merges by union, writes both sides and reports combined', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: { r1: true }, updatedAt: 1000, dataVersion: 1 })));
  const cloud = makeCloud(doc(['b', 'c'], 500, { r2: true }));
  listen();
  useCloud(cloud.api);
  await cloud.signIn('u1');

  const local = stored(storage);
  assert.deepEqual(Object.keys(local.done).sort(), ['a', 'b', 'c']);
  assert.deepEqual(Object.keys(local.visited).sort(), ['r1', 'r2']);
  assert.equal(local.syncedUid, 'u1');

  assert.deepEqual(Object.keys(cloud.doc.done).sort(), ['a', 'b', 'c']);
  assert.equal('syncedUid' in cloud.doc, false, 'syncedUid never goes to the cloud');
  assert.ok(cloud.calls.some(([kind]) => kind === 'watch'));

  assert.deepEqual(statuses.map((s) => s.state), ['local', 'syncing', 'synced']);
  const last = statuses.at(-1);
  assert.ok(last.at > 0);
  assert.deepEqual(last.combined, { localDone: 1, cloudDone: 2, totalDone: 3 });

  assert.equal(changes.length, 1, 'subscribers hear about the cloud ids');
  assert.deepEqual([...changes[0].done].sort(), ['a', 'b', 'c']);
});

test('first sign-in with no cloud copy writes local and has no combined note', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 1000, dataVersion: 1 })));
  const cloud = makeCloud(null);
  listen();
  useCloud(cloud.api);
  await cloud.signIn('u1');

  assert.deepEqual(Object.keys(cloud.doc.done), ['a']);
  assert.equal(stored(storage).syncedUid, 'u1');
  assert.equal(statuses.at(-1).state, 'synced');
  assert.equal('combined' in statuses.at(-1), false);
});

test('first sign-in with nothing anywhere writes no empty document', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  assert.equal(cloud.writes().length, 0);
});

// ----------------------------------------------------- later sign-ins (same uid)

test('same uid: a newer cloud copy wins as a whole object and notifies', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 100, dataVersion: 1, syncedUid: 'u1' })));
  const cloud = makeCloud(doc(['b'], 200));
  listen();
  useCloud(cloud.api);
  await cloud.signIn('u1');

  assert.deepEqual(Object.keys(stored(storage).done), ['b'], 'whole object, not a union');
  assert.equal(cloud.writes().length, 0, 'nothing to push back');
  assert.equal(changes.length, 1);
  assert.deepEqual([...changes[0].done], ['b']);
  assert.equal(statuses.at(-1).state, 'synced');
});

test('same uid: an older cloud copy is ignored and local is pushed up', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 300, dataVersion: 1, syncedUid: 'u1' })));
  const cloud = makeCloud(doc(['b'], 200));
  listen();
  useCloud(cloud.api);
  await cloud.signIn('u1');

  assert.deepEqual(Object.keys(stored(storage).done), ['a']);
  assert.deepEqual(Object.keys(cloud.doc.done), ['a']);
  assert.equal(changes.length, 0, 'local did not change');
});

test('same uid: an equal cloud copy changes and writes nothing', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 300, dataVersion: 1, syncedUid: 'u1' })));
  const cloud = makeCloud(doc(['a'], 300));
  useCloud(cloud.api);
  await cloud.signIn('u1');
  assert.equal(cloud.writes().length, 0);
  assert.equal(stored(storage).updatedAt, 300);
});

test('a different account on the same device is a first sign-in (union)', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 300, dataVersion: 1, syncedUid: 'u1' })));
  const cloud = makeCloud(doc(['z'], 900));
  useCloud(cloud.api);
  await cloud.signIn('u2');
  assert.deepEqual(Object.keys(stored(storage).done).sort(), ['a', 'z']);
  assert.equal(stored(storage).syncedUid, 'u2');
});

// ------------------------------------------------------ changes while signed in

test('a local change while signed in is saved locally, then written to the cloud', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  listen();
  await setDone('a', true);

  assert.ok(stored(storage).done.a, 'local write is immediate');
  await flush();
  assert.deepEqual(Object.keys(cloud.doc.done), ['a']);
  assert.equal('syncedUid' in cloud.doc, false);
  assert.deepEqual(statuses.map((s) => s.state), ['synced', 'syncing', 'synced']);
});

test('quick changes are sent as one write that carries all of them', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  // Started together (as in one click handler), before the first write gets to run.
  await Promise.all([setDone('a', true), setDone('b', true), setVisited('r1', true)]);
  await flush();
  assert.equal(cloud.writes().length, 1);
  assert.deepEqual(Object.keys(cloud.doc.done).sort(), ['a', 'b']);
  assert.deepEqual(Object.keys(cloud.doc.visited), ['r1']);
});

test('a change that changes nothing does not write to the cloud', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  const before = cloud.writes().length;
  await setDone('a', true);
  await flush();
  assert.equal(cloud.writes().length, before);
});

test('signed out: changes stay local and nothing is sent', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signOut(); // "nobody signed in"
  await setDone('a', true);
  await flush();
  assert.deepEqual(cloud.calls, []);
  assert.ok(stored(storage).done.a);
});

test('a change made while the first merge is still reading is kept and not sent early', async () => {
  const cloud = makeCloud(doc(['b'], 100));
  let open;
  cloud.readGate = new Promise((resolve) => (open = resolve));
  useCloud(cloud.api);
  cloud.authCallback({ uid: 'u1', email: '', displayName: '', provider: 'google' });
  await flush();

  await setDone('a', true);
  await flush();
  assert.equal(cloud.writes().length, 0, 'must not overwrite a cloud copy that was not read yet');

  open();
  await flush();
  assert.deepEqual(Object.keys(stored(storage).done).sort(), ['a', 'b']);
  assert.deepEqual(Object.keys(cloud.doc.done).sort(), ['a', 'b']);
});

// ------------------------------------------------------------ cloud failures

test('a failed cloud write sets status error and keeps local data; the next write carries everything', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  listen();

  cloud.failWrite = true;
  await setDone('a', true);
  await flush();
  assert.equal(statuses.at(-1).state, 'error');
  assert.ok(statuses.at(-1).message.length > 0);
  assert.ok(stored(storage).done.a, 'local copy kept');

  cloud.failWrite = false;
  await setDone('b', true);
  await flush();
  assert.equal(statuses.at(-1).state, 'synced');
  assert.deepEqual(Object.keys(cloud.doc.done).sort(), ['a', 'b']);
});

test('a failed first read sets status error and keeps local data', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 100, dataVersion: 1 })));
  const cloud = makeCloud(doc(['b'], 50));
  cloud.failRead = true;
  listen();
  useCloud(cloud.api);
  await cloud.signIn('u1');

  assert.equal(statuses.at(-1).state, 'error');
  assert.deepEqual(Object.keys(stored(storage).done), ['a']);
  assert.equal(cloud.writes().length, 0);
  assert.ok(cloud.calls.some(([kind]) => kind === 'watch'), 'watch still starts so it can recover');
});

test('after a failed first read, the watch recovers with the same merge', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 100, dataVersion: 1 })));
  const cloud = makeCloud(null);
  cloud.failRead = true;
  listen();
  useCloud(cloud.api);
  await cloud.signIn('u1');

  cloud.watchCallback(doc(['b'], 50)); // the network is back
  await flush();
  assert.deepEqual(Object.keys(stored(storage).done).sort(), ['a', 'b'], 'still a first sign-in, so a union');
  assert.equal(statuses.at(-1).state, 'synced');
});

test('a watch error sets status error and keeps local data', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  listen();

  cloud.watchError(Object.assign(new Error('denied'), { code: 'permission-denied' }));
  assert.equal(statuses.at(-1).state, 'error');
  assert.ok(stored(storage).done.a);
});

// --------------------------------------------------- changes from another device

test('a newer cloud copy from the watch is applied locally and subscribers are notified', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  listen();

  cloud.watchCallback(doc(['a', 'b'], Date.now() + 10_000));
  assert.deepEqual(Object.keys(stored(storage).done).sort(), ['a', 'b']);
  assert.equal(changes.length, 1);
  assert.deepEqual([...changes[0].done].sort(), ['a', 'b']);
  assert.equal(stored(storage).syncedUid, 'u1');
  assert.equal(statuses.at(-1).state, 'synced');
});

test('an older or equal cloud copy from the watch is ignored', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  const { updatedAt } = stored(storage);
  listen();

  cloud.watchCallback(doc(['z'], updatedAt)); // equal
  cloud.watchCallback(doc(['z'], updatedAt - 1)); // older
  assert.deepEqual(Object.keys(stored(storage).done), ['a']);
  assert.equal(changes.length, 0);
});

test('the watch reporting no document (another device started a new run) keeps local data', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();

  cloud.watchCallback(null);
  await flush();
  assert.ok(stored(storage).done.a);
});

// ------------------------------------------------------------------ sign-out

test('sign-out stops the watch, clears syncedUid, reports local and keeps Progress', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  assert.equal(stored(storage).syncedUid, 'u1');
  listen();

  await cloud.signOut();
  assert.ok(cloud.calls.some(([kind]) => kind === 'unwatch'));
  assert.equal(stored(storage).syncedUid, undefined);
  assert.ok(stored(storage).done.a);
  assert.deepEqual(statuses.at(-1), { state: 'local', at: null, message: '' });
});

test('after sign-out, what was marked offline is combined by union at the next sign-in', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  await cloud.signOut();

  await setDone('b', true); // marked while signed out
  await flush();
  const writesBefore = cloud.writes().length;
  assert.equal(writesBefore, 1, 'nothing is sent while signed out');

  // Meanwhile the cloud copy got a newer version from another device without b.
  cloud.doc = doc(['a', 'c'], Date.now() + 10_000);
  await cloud.signIn('u1');
  assert.deepEqual(Object.keys(stored(storage).done).sort(), ['a', 'b', 'c']);
  assert.deepEqual(Object.keys(cloud.doc.done).sort(), ['a', 'b', 'c']);
});

test('a read that finishes after sign-out is dropped', async () => {
  const cloud = makeCloud(doc(['z'], 100));
  let open;
  cloud.readGate = new Promise((resolve) => (open = resolve));
  useCloud(cloud.api);
  cloud.authCallback({ uid: 'u1', email: '', displayName: '', provider: 'google' });
  await flush();
  await cloud.signOut();
  open();
  await flush();

  const { done } = await loadProgress();
  assert.equal(done.has('z'), false, 'the late cloud copy was not applied');
  assert.equal(cloud.calls.some(([kind]) => kind === 'watch'), false);
});

// --------------------------------------------------------------------- clear

test('clearProgress while signed in deletes the cloud document and writes no empty one', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  const writesBefore = cloud.writes().length;
  listen();

  await clearProgress();
  await flush();
  assert.deepEqual(cloud.calls.filter(([kind]) => kind === 'delete'), [['delete', 'u1']]);
  assert.equal(cloud.doc, null);
  assert.equal(cloud.writes().length, writesBefore);
  assert.equal(Object.keys(stored(storage).done).length, 0);
  assert.equal(stored(storage).syncedUid, 'u1');
  assert.equal(statuses.at(-1).state, 'synced');
});

test('clearProgress while signed out never touches the cloud', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signOut();
  await setDone('a', true);
  await clearProgress();
  await flush();
  assert.deepEqual(cloud.calls, []);
});

// --------------------------------------------------------------- local first

test('loadProgress answers from local storage at once, even when the cloud read hangs', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 100, dataVersion: 1 })));
  const cloud = makeCloud(doc(['b'], 50));
  cloud.readGate = new Promise(() => {}); // never answers
  useCloud(cloud.api);
  cloud.authCallback({ uid: 'u1', email: '', displayName: '', provider: 'google' });

  const { done } = await loadProgress();
  assert.deepEqual([...done], ['a']);
});

// ---------------------------------------------------------- SDK unavailable

test('SDK unavailable: nobody is signed in, status stays local and everything works locally', async () => {
  const fake = makeCloud(null);
  fake.api.onAuthChange = (callback) => {
    callback(null); // what firebase.js does when the SDK cannot load
    return () => {};
  };
  listen();
  useCloud(fake.api);
  await flush();
  await setDone('a', true);
  await flush();

  assert.ok(stored(storage).done.a);
  assert.equal(statuses.at(-1).state, 'local');
  assert.deepEqual(fake.calls, []);
});

test('firebase.js in node (SDK cannot load): onAuthChange reports null once', async () => {
  const seen = [];
  const stop = onAuthChange((user) => seen.push(user));
  await flush();
  stop();
  assert.deepEqual(seen, [null]);
});

test('firebase.js watchProgressDoc: a failure goes to onError and never to callback', async () => {
  const warn = console.warn;
  console.warn = () => {}; // the module logs the failure; keep the test output clean
  try {
    const results = [];
    const stop = watchProgressDoc(
      'u1',
      (copy) => results.push(['callback', copy]),
      (error) => results.push(['onError', error.code])
    );
    await flush();
    stop();
    assert.deepEqual(results, [['onError', 'sdk-unavailable']]);
  } finally {
    console.warn = warn;
  }
});

test('firebase.js watchProgressDoc: onError is optional', async () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    const stop = watchProgressDoc('u1', () => assert.fail('callback must not run'));
    await flush();
    stop();
  } finally {
    console.warn = warn;
  }
});
