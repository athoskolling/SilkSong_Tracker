// Tests for the cloud half of js/progress.js (docs/CONTRACTS.md sections 3 and 4).
// No test reaches the network: useCloud swaps the firebase.js functions for a fake,
// and useStorage swaps localStorage for an in-memory stand-in.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  useStorage,
  useCloud,
  configureProgress,
  exportProgress,
  importProgress,
  loadProgress,
  setDone,
  setVisited,
  onProgressChange,
  onSyncStatus,
  clearProgress,
  setCrestSlots,
  setBuild,
} from '../js/progress.js';
import { onAuthChange, watchProgressDoc } from '../js/firebase.js';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

test('same uid: a later sign-in on this device reports no combined note', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 100, dataVersion: 1, syncedUid: 'u1' })));
  const cloud = makeCloud(doc(['b'], 200));
  listen();
  useCloud(cloud.api);
  await cloud.signIn('u1');
  assert.ok(statuses.length > 0);
  assert.equal(statuses.some((s) => 'combined' in s), false, 'combined is for the first sign-in only');
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

test('syncedUid never reaches the cloud, not even on later writes', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  await setDone('b', true);
  await flush();
  assert.ok(cloud.writes().length >= 2, 'at least two writes were checked');
  for (const [, , payload] of cloud.writes()) {
    assert.equal('syncedUid' in payload, false);
  }
});

test('the watch echo of this device\'s own write changes nothing and writes nothing', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  listen();
  const writesBefore = cloud.writes().length;
  cloud.watchCallback(structuredClone(cloud.doc)); // the same document, sent back to us
  await flush();
  assert.equal(changes.length, 0, 'subscribers are not told about our own write');
  assert.equal(cloud.writes().length, writesBefore);
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

// ------------------------------------------------- contract section 4: what may import what

const JS_DIR = fileURLToPath(new URL('../js/', import.meta.url));
const SITE_DIR = fileURLToPath(new URL('../', import.meta.url));
const PROGRESS_ONLY = ['readProgressDoc', 'writeProgressDoc', 'deleteProgressDoc', 'watchProgressDoc'];

test('firebase.js exports only the contract functions (no Firestore or Auth handles)', async () => {
  const exported = Object.keys(await import('../js/firebase.js')).sort();
  assert.deepEqual(exported, [
    'completeEmailLinkSignIn',
    'deleteProgressDoc',
    'onAuthChange',
    'readProgressDoc',
    'signIn',
    'signOut',
    'watchProgressDoc',
    'writeProgressDoc',
  ]);
});

test('only progress.js imports the four Progress document functions from firebase.js', () => {
  for (const file of readdirSync(JS_DIR).filter((name) => name.endsWith('.js'))) {
    if (file === 'progress.js' || file === 'firebase.js') continue;
    const source = readFileSync(path.join(JS_DIR, file), 'utf8');
    const imports = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/firebase\.js'/g)].flatMap((m) =>
      m[1].split(',').map((name) => name.trim())
    );
    for (const name of PROGRESS_ONLY) {
      assert.equal(imports.includes(name), false, `${file} must not import ${name}`);
    }
  }
});

test('only firebase.js loads the Firebase SDK, and no page loads a script from elsewhere', () => {
  for (const file of readdirSync(JS_DIR).filter((name) => name.endsWith('.js'))) {
    if (file === 'firebase.js') continue;
    const source = readFileSync(path.join(JS_DIR, file), 'utf8');
    assert.equal(source.includes('firebasejs'), false, `${file} must not load the SDK`);
  }
  for (const file of readdirSync(SITE_DIR).filter((name) => name.endsWith('.html'))) {
    const html = readFileSync(path.join(SITE_DIR, file), 'utf8');
    const remoteScripts = [...html.matchAll(/<script[^>]*\ssrc="(https?:[^"]*)"/g)].map((m) => m[1]);
    assert.deepEqual(remoteScripts, [], `${file} loads a script from another address`);
  }
});

// ------------------------------------- player choices (ADR 0006), through the cloud
// crestSlots and builds ride along in the one Progress document. "Missing is not empty": a copy
// without them came from an older page and must not erase them (docs/CONTRACTS.md section 3).

const CREST = 'reaper-crest';
const CREST_B = 'second-crest';
const BUILD_A = { red: ['tool-one'] };
const BUILD_B = { blue: ['tool-two'] };

// Signed in, with one Build saved on this device and already pushed to the cloud.
async function signedInWithBuild() {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setBuild(CREST, BUILD_A);
  await flush();
  return cloud;
}

test('first sign-in: the player choices are united on both sides and the union is written to the cloud', async () => {
  useStorage(
    (storage = seed({
      done: { a: true },
      visited: {},
      updatedAt: 1000,
      dataVersion: 1,
      crestSlots: { [CREST]: { blue: 2 } },
      builds: { [CREST_B]: BUILD_A },
    }))
  );
  const cloud = makeCloud({
    ...doc(['b'], 500),
    crestSlots: { [CREST]: { blue: 1, red: 3 } },
    builds: { [CREST]: BUILD_B },
  });
  useCloud(cloud.api);
  await cloud.signIn('u1');

  const expectedSlots = { [CREST]: { red: 3, blue: 2 } };
  const expectedBuilds = { [CREST]: BUILD_B, [CREST_B]: BUILD_A };
  assert.deepEqual(stored(storage).crestSlots, expectedSlots);
  assert.deepEqual(stored(storage).builds, expectedBuilds);
  assert.deepEqual(cloud.doc.crestSlots, expectedSlots);
  assert.deepEqual(cloud.doc.builds, expectedBuilds);
  assert.equal('syncedUid' in cloud.doc, false);
});

test('first sign-in with no cloud copy pushes a device whose only content is a Build', async () => {
  useStorage((storage = seed({ done: {}, visited: {}, updatedAt: 1000, dataVersion: 1, builds: { [CREST]: BUILD_A } })));
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  assert.equal(cloud.writes().length, 1, 'a Build is content: it must reach the cloud');
  assert.deepEqual(cloud.doc.builds, { [CREST]: BUILD_A });
});

test('first sign-in on a device without the fields takes the cloud copy\'s fields', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 1000, dataVersion: 1 })));
  const cloud = makeCloud({ ...doc(['b'], 500), builds: { [CREST]: BUILD_A }, crestSlots: { [CREST]: { blue: 1 } } });
  useCloud(cloud.api);
  await cloud.signIn('u1');
  assert.deepEqual(stored(storage).builds, { [CREST]: BUILD_A });
  assert.deepEqual(stored(storage).crestSlots, { [CREST]: { blue: 1 } });
});

test('a Build saved while signed out is combined with the cloud Builds at the next sign-in', async () => {
  const cloud = makeCloud({ ...doc(['b'], 100), builds: { [CREST_B]: BUILD_B } });
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await cloud.signOut();
  await setBuild(CREST, BUILD_A); // marked while signed out
  await flush();
  await cloud.signIn('u1');
  assert.deepEqual(stored(storage).builds, { [CREST]: BUILD_A, [CREST_B]: BUILD_B });
  assert.deepEqual(cloud.doc.builds, { [CREST]: BUILD_A, [CREST_B]: BUILD_B });
});

test('a newer cloud copy with no player choices (an older page wrote it) keeps the Build saved here', async () => {
  const cloud = await signedInWithBuild();
  listen();
  const writes = cloud.writes().length;
  cloud.watchCallback(doc(['x'], Date.now() + 10_000)); // four keys only, and newer
  await flush();
  assert.deepEqual(stored(storage).builds, { [CREST]: BUILD_A });
  assert.deepEqual([...changes.at(-1).done], ['x'], 'the newer ids are taken');
  assert.deepEqual(changes.at(-1).builds, { [CREST]: BUILD_A }, 'and the page keeps the Build');
  assert.equal(cloud.writes().length, writes, 'not pushed back before the next change');
});

test('the next change after that writes the kept Build back to the cloud', async () => {
  const cloud = await signedInWithBuild();
  cloud.watchCallback(doc(['x'], Date.now() + 10_000));
  await flush();
  await setDone('y', true);
  await flush();
  assert.deepEqual(cloud.doc.builds, { [CREST]: BUILD_A });
  assert.deepEqual(Object.keys(cloud.doc.done).sort(), ['x', 'y']);
});

test('a cloud copy that differs only in its Builds reaches the page', async () => {
  const cloud = await signedInWithBuild();
  listen();
  cloud.watchCallback({ ...doc([], Date.now() + 10_000), builds: { [CREST]: BUILD_B } });
  await flush();
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0].builds, { [CREST]: BUILD_B });
  assert.deepEqual(stored(storage).builds, { [CREST]: BUILD_B });
});

test('a cloud copy that differs only in its opened slots reaches the page', async () => {
  const cloud = await signedInWithBuild();
  listen();
  cloud.watchCallback({ ...doc([], Date.now() + 10_000), crestSlots: { [CREST]: { blue: 1 } } });
  await flush();
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0].crestSlots, { [CREST]: { blue: 1 } });
  assert.deepEqual(changes[0].builds, { [CREST]: BUILD_A }, 'a field the cloud copy lacks keeps this device\'s value');
});

test('an older cloud copy that differs only in its Builds is ignored', async () => {
  const cloud = await signedInWithBuild();
  listen();
  cloud.watchCallback({ ...doc([], 1), builds: { [CREST]: BUILD_B } });
  await flush();
  assert.equal(changes.length, 0);
  assert.deepEqual(stored(storage).builds, { [CREST]: BUILD_A });
});

test('the watch echo of a Build this device wrote changes nothing', async () => {
  const cloud = await signedInWithBuild();
  listen();
  cloud.watchCallback(structuredClone(cloud.doc));
  await flush();
  assert.equal(changes.length, 0);
});

test('writes carry the player choices, and no write carries syncedUid', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setCrestSlots(CREST, { blue: 2 });
  await setBuild(CREST, BUILD_A);
  await flush();
  assert.deepEqual(cloud.doc.crestSlots, { [CREST]: { blue: 2 } });
  assert.deepEqual(cloud.doc.builds, { [CREST]: BUILD_A });
  assert.ok(cloud.writes().length >= 1);
  for (const [, , payload] of cloud.writes()) assert.equal('syncedUid' in payload, false);
});

test('an ordinary change does not add the player choices to a cloud document that has none', async () => {
  const cloud = makeCloud(doc(['b'], 100));
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setDone('a', true);
  await flush();
  const last = cloud.writes().at(-1)[2];
  assert.deepEqual(Object.keys(last.done).sort(), ['a', 'b']);
  assert.equal('crestSlots' in last, false);
  assert.equal('builds' in last, false);
  assert.equal('crestSlots' in cloud.doc, false);
});

test('a setter called again with the same value writes nothing to the cloud', async () => {
  const cloud = await signedInWithBuild();
  const writes = cloud.writes().length;
  await setBuild(CREST, BUILD_A);
  await setCrestSlots(CREST_B, {}); // nothing opened: nothing to store
  await flush();
  assert.equal(cloud.writes().length, writes);
});

test('clearProgress: the empty fields beat an older cloud copy that still has Builds', async () => {
  const cloud = makeCloud(null);
  useCloud(cloud.api);
  await cloud.signIn('u1');
  await setCrestSlots(CREST, { blue: 2 });
  await setBuild(CREST, BUILD_A);
  await flush();
  await clearProgress();
  await flush();
  assert.equal(cloud.doc, null, 'the cloud copy was deleted');

  // Another device still holds the old run and sends it back. Its copy is older than the clear.
  cloud.watchCallback({ ...doc(['old'], 1), crestSlots: { [CREST]: { blue: 2 } }, builds: { [CREST]: BUILD_A } });
  await flush();
  assert.deepEqual(stored(storage).builds, {}, 'the cleared Builds stay cleared');
  assert.deepEqual(stored(storage).crestSlots, {});
  assert.equal(stored(storage).done.old, undefined);
  assert.deepEqual(cloud.doc.builds, {}, 'the empty value is written back over the old copy');
  assert.deepEqual(cloud.doc.crestSlots, {});
});

// A newer local copy that has no Builds: the Build from the cloud must survive on both sides.
// Scenario: this device was offline while another device saved a Build. Its own copy is newer,
// and it was written by a page that never had the field. The merge rule keeps the cloud's value
// (docs/CONTRACTS.md section 3, "afterwards"), so the result has to reach this device and the cloud.
test('a newer local copy without Builds keeps the cloud Builds, here and in the cloud', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 3000, dataVersion: 1, syncedUid: 'u1' })));
  const cloud = makeCloud({ ...doc(['b'], 2000), builds: { [CREST]: BUILD_A } });
  useCloud(cloud.api);
  await cloud.signIn('u1');
  assert.deepEqual(stored(storage).builds, { [CREST]: BUILD_A }, 'this device keeps the cloud Build');
  assert.deepEqual(cloud.doc.builds, { [CREST]: BUILD_A }, 'and the write does not erase it');
});

test('a newer local copy without opened slots keeps the cloud opened slots, here and in the cloud', async () => {
  useStorage((storage = seed({ done: { a: true }, visited: {}, updatedAt: 3000, dataVersion: 1, syncedUid: 'u1' })));
  const cloud = makeCloud({ ...doc(['b'], 2000), crestSlots: { [CREST]: { blue: 2 } } });
  useCloud(cloud.api);
  await cloud.signIn('u1');
  assert.deepEqual(stored(storage).crestSlots, { [CREST]: { blue: 2 } }, 'this device keeps the cloud slots');
  assert.deepEqual(cloud.doc.crestSlots, { [CREST]: { blue: 2 } }, 'and the write does not erase them');
});

// ------------------------------------------------------------- sample mode
// In sample mode (configureProgress({ sample: true })) the cloud is never touched,
// whichever happens first: the sign-in or the switch.

const SAMPLE_KEY = 'silksong-guide:progress:sample:v1';

test('sample mode: a fake user signing in after the switch starts no cloud call', async () => {
  const cloud = makeCloud(doc(['cloud-id'], 9000));
  useCloud(cloud.api);
  listen();
  const subscribed = cloud.authCallback; // the listener is running before the switch
  assert.ok(subscribed);
  configureProgress({ sample: true });
  assert.equal(cloud.authCallback, null, 'the auth listener was stopped');

  // Even an event from a listener that was somehow still alive starts nothing.
  subscribed({ uid: 'u1', email: 'a@example.invalid', displayName: '', provider: 'google' });
  await flush();
  await setDone('fake', true);
  await flush();

  assert.deepEqual(cloud.calls, []);
  assert.ok(statuses.every((s) => s.state === 'local'));
  assert.deepEqual(Object.keys(JSON.parse(storage.data.get(SAMPLE_KEY)).done), ['fake']);
  assert.equal(storage.data.has(KEY), false, 'the real key was never written');
});

test('sample mode: useCloud after the switch does not subscribe to sign-in', async () => {
  const cloud = makeCloud(doc(['cloud-id'], 9000));
  configureProgress({ sample: true });
  useCloud(cloud.api);
  assert.equal(cloud.authCallback, null);
  await setDone('fake', true);
  await flush();
  assert.deepEqual(cloud.calls, []);
});

test('sample mode: a session already merged is cut off by the switch', async () => {
  useStorage((storage = seed({ done: { real: true }, visited: {}, updatedAt: 1000, dataVersion: 1 })));
  const cloud = makeCloud(doc(['cloud-id'], 500));
  useCloud(cloud.api);
  await cloud.signIn('u1');
  const callsBefore = cloud.calls.length;
  assert.ok(cloud.watchCallback, 'the real session had a watch');
  const realBefore = storage.data.get(KEY);

  listen();
  configureProgress({ sample: true });
  assert.equal(cloud.watchCallback, null, 'the watch was stopped');

  await setDone('fake', true);
  await clearProgress();
  await flush();
  assert.deepEqual(cloud.calls.slice(callsBefore), [['unwatch', 'u1']], 'only the unwatch, no read, write or delete');
  assert.equal(storage.data.get(KEY), realBefore, 'the real key is as the real session left it');
  assert.equal(statuses.at(-1).state, 'local');
});

test('sample mode: a read still in flight when the switch happens is dropped', async () => {
  useStorage((storage = seed({ done: { real: true }, visited: {}, updatedAt: 1000, dataVersion: 1 })));
  const cloud = makeCloud(doc(['cloud-id'], 500));
  let release;
  cloud.readGate = new Promise((resolve) => (release = resolve));
  useCloud(cloud.api);
  cloud.authCallback({ uid: 'u1' });
  configureProgress({ sample: true });
  release();
  await flush();

  assert.equal(cloud.writes().length, 0);
  assert.ok(!cloud.calls.some(([kind]) => kind === 'watch'));
  assert.deepEqual(Object.keys(stored(storage).done), ['real'], 'no merge reached the real key');
  assert.equal(storage.data.has(SAMPLE_KEY), false, 'no merge reached the sample key');
});

test('sample mode: export, import and clear make no cloud call', async () => {
  const cloud = makeCloud(doc(['cloud-id'], 9000));
  useCloud(cloud.api);
  configureProgress({ sample: true });
  await setDone('fake', true);
  await importProgress(new File([JSON.stringify({ done: { 'fake-two': true } })], 'backup.json'));
  const exported = JSON.parse(await exportProgress().text());
  assert.deepEqual(Object.keys(exported.done).sort(), ['fake', 'fake-two']);
  await clearProgress();
  await flush();
  assert.deepEqual(cloud.calls, []);
});
