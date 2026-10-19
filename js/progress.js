// progress.js: the only module that touches localStorage and, through firebase.js,
// Firestore. See docs/CONTRACTS.md section 3 and ADR 0001.
//
// Local first: every change is written to localStorage before anything else, and a
// failure anywhere in the cloud half never loses or rolls back local data. The cloud
// half is the block marked CLOUD further down.
//
// Stored shape (same as the cloud document, plus the local-only syncedUid):
//   { done: { id: true }, visited: { id: true }, updatedAt: ms, dataVersion: n, syncedUid?: string }

import {
  onAuthChange,
  readProgressDoc,
  writeProgressDoc,
  deleteProgressDoc,
  watchProgressDoc,
} from './firebase.js';

const STORAGE_KEY = 'silksong-guide:progress:v1';

// Ids are permanent slugs (docs/CONTRACTS.md section 1). Checking them on import
// also keeps odd keys such as "__proto__" out of our objects.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const BAD_FILE_MESSAGE =
  'That file is not a Silksong Guide backup. Choose a file you downloaded from this page.';

// ---------------------------------------------------------------- module state

let storageOverride = null; // set by useStorage; null = use the browser's localStorage
let memoryCopy = null; // Progress held in memory only while localStorage cannot be written
let entryRegions = new Map(); // entry id -> region id, supplied by configureProgress
let contentVersion = null; // dataVersion of data/, supplied by configureProgress
let syncStatus = { state: 'local', at: null, message: '' };

const progressListeners = new Set();
const statusListeners = new Set();

// ------------------------------------------------------------ setup (proposed)

// PROPOSED CONTRACT ADDITION (needs the orchestrator's decision).
// progress.js does not load game data, yet setDone(id, true) must mark the entry's
// Region Visited. The interface already loads items.json, so it hands us the list
// once, right after loading. We keep only id -> regionId, and the dataVersion we
// stamp on saved Progress. Without this call setDone still works; it just cannot
// mark the Region Visited (the interface can then call setVisited itself).
export function configureProgress({ items = [], dataVersion = null } = {}) {
  entryRegions = new Map();
  for (const item of items) {
    if (item && item.id && item.regionId) entryRegions.set(item.id, item.regionId);
  }
  contentVersion = Number.isInteger(dataVersion) ? dataVersion : null;
}

// Lets tests (and nothing else) swap in an in-memory stand-in for localStorage,
// because node:test has no browser localStorage. Also resets the in-session state.
export function useStorage(storage) {
  storageOverride = storage;
  memoryCopy = null;
  entryRegions = new Map();
  contentVersion = null;
  syncStatus = { state: 'local', at: null, message: '' };
  progressListeners.clear();
  statusListeners.clear();
  stopCloud(); // a test starts from "nobody signed in, no cloud"
}

// ------------------------------------------------------------------- storage

function getStorage() {
  if (storageOverride) return storageOverride;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null; // some browsers throw just for touching localStorage (privacy modes)
  }
}

function emptyProgress() {
  return { done: {}, visited: {}, updatedAt: 0, dataVersion: 0 };
}

// Keep only ids marked true, so a hand-edited or old value cannot grow the set
// with false entries. Unknown ids are kept: they may belong to a later data version.
function onlyTrue(map) {
  const out = {};
  if (map && typeof map === 'object' && !Array.isArray(map)) {
    for (const [id, value] of Object.entries(map)) {
      if (value === true) out[id] = true;
    }
  }
  return out;
}

// Accepts anything and returns a well-formed Progress object (never throws).
function normalize(raw) {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  base.done = onlyTrue(raw.done);
  base.visited = onlyTrue(raw.visited);
  if (Number.isFinite(raw.updatedAt)) base.updatedAt = raw.updatedAt;
  if (Number.isInteger(raw.dataVersion)) base.dataVersion = raw.dataVersion;
  if (typeof raw.syncedUid === 'string' && raw.syncedUid) base.syncedUid = raw.syncedUid;
  return base;
}

// memoryCopy exists only for the case where localStorage cannot be written (blocked,
// full): then this session's work lives here. The next good write clears it, so it
// can never bring back data the player removed elsewhere.
function readLocal() {
  if (memoryCopy) return normalize(memoryCopy);
  const storage = getStorage();
  if (!storage) return emptyProgress();
  try {
    const text = storage.getItem(STORAGE_KEY);
    return text === null ? emptyProgress() : normalize(JSON.parse(text));
  } catch {
    // Corrupt JSON or unreadable storage: start empty and keep going. The next
    // change overwrites the bad value.
    return emptyProgress();
  }
}

function writeLocal(progress) {
  try {
    const storage = getStorage();
    if (!storage) throw new Error('no storage');
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    memoryCopy = null;
  } catch {
    memoryCopy = progress; // quota or privacy mode: keep this session's work in memory
  }
}

function toSets(progress) {
  return { done: new Set(Object.keys(progress.done)), visited: new Set(Object.keys(progress.visited)) };
}

// Every local change goes through here: stamp, save locally, tell the cloud hook,
// tell subscribers.
function commit(progress, { syncToCloud = true } = {}) {
  progress.updatedAt = Date.now();
  if (contentVersion !== null) progress.dataVersion = contentVersion;
  writeLocal(progress);
  if (syncToCloud) afterLocalWrite();
  notifyProgress(progress);
}

function notifyProgress(progress) {
  const snapshot = toSets(progress);
  for (const callback of [...progressListeners]) {
    try {
      callback({ done: new Set(snapshot.done), visited: new Set(snapshot.visited) });
    } catch (error) {
      console.error('Progress subscriber failed', error); // one bad subscriber must not block the rest
    }
  }
}

function setSyncStatus(status) {
  syncStatus = status;
  for (const callback of [...statusListeners]) {
    try {
      callback(status);
    } catch (error) {
      console.error('Sync status subscriber failed', error);
    }
  }
}

// ====================================================================== CLOUD
// Everything that talks to the account lives in this block. The rule that shapes it:
// local Progress is saved first and is never rolled back, whatever the cloud does.
//
// Why the cloud copy is a whole object: a write replaces the document, so a failed
// write needs no retry queue. The next successful write carries the latest local
// state, and the next page load repairs a missed write anyway (same account, local
// newer than the cloud copy, so local wins and is written).

const CLOUD_ERROR_MESSAGE = 'Could not sync with your account. Your Progress is saved on this device.';

// The five firebase.js functions this block needs. A test swaps them through useCloud.
const realCloud = { onAuthChange, readProgressDoc, writeProgressDoc, deleteProgressDoc, watchProgressDoc };

let cloud = realCloud;
let stopAuth = null; // unsubscribe from onAuthChange
let stopWatch = null; // unsubscribe from watchProgressDoc
let signedInUid = null; // null = nobody signed in (or the SDK never loaded)
let cloudReady = false; // true once the first merge for this sign-in is done
let session = 0; // bumped on every sign-in, sign-out and reset; late results from an old one are dropped
let cloudChain = Promise.resolve(); // cloud jobs run one at a time, in order, so writes cannot overtake each other
let writeQueued = false; // one queued write is enough: it reads the latest local state when it runs
let pendingJobs = 0;
let combinedNote = null; // { localDone, cloudDone, totalDone } kept until the status 'synced' that follows a first sign-in

// Test seam only (like useStorage): replaces the firebase.js functions with a fake and
// starts listening to its onAuthChange. useCloud(null) just stops everything.
export function useCloud(fake) {
  stopCloud();
  if (fake) startCloud(fake);
}

function startCloud(api) {
  cloud = api;
  stopAuth = api.onAuthChange(handleAuthChange);
}

function stopCloud() {
  newSession();
  if (typeof stopAuth === 'function') stopAuth();
  stopAuth = null;
  stopWatching();
  signedInUid = null;
  cloud = realCloud;
}

function newSession() {
  session += 1;
  cloudReady = false;
  writeQueued = false;
  pendingJobs = 0;
  combinedNote = null;
  cloudChain = Promise.resolve();
}

function stopWatching() {
  if (typeof stopWatch === 'function') stopWatch();
  stopWatch = null;
}

function idCount(map) {
  return Object.keys(map).length;
}

function hasIds(progress) {
  return idCount(progress.done) + idCount(progress.visited) > 0;
}

function sameIds(a, b) {
  const same = (x, y) => idCount(x) === idCount(y) && Object.keys(x).every((id) => y[id] === true);
  return same(a.done, b.done) && same(a.visited, b.visited);
}

// What goes to the cloud: the Progress object without the device-only syncedUid.
function forCloud(progress) {
  const { syncedUid, ...shareable } = progress;
  return shareable;
}

function reportError(error) {
  console.warn('Cloud sync problem:', error && error.code ? error.code : error);
  setSyncStatus({ state: 'error', at: syncStatus.at, message: CLOUD_ERROR_MESSAGE });
}

function markSynced() {
  const status = { state: 'synced', at: Date.now(), message: '' };
  if (combinedNote) status.combined = combinedNote;
  combinedNote = null;
  setSyncStatus(status);
}

// Runs one cloud job after the ones before it. Errors become status 'error' and
// nothing else: local data is never touched here.
function enqueueCloudJob(job) {
  const mine = session;
  const uid = signedInUid;
  pendingJobs += 1;
  if (syncStatus.state !== 'syncing') setSyncStatus({ state: 'syncing', at: syncStatus.at, message: '' });

  cloudChain = cloudChain.then(async () => {
    if (mine !== session) return; // signed out or switched account while waiting
    try {
      await job(uid);
      if (mine !== session) return;
      pendingJobs -= 1;
      if (pendingJobs === 0) markSynced();
    } catch (error) {
      if (mine !== session) return;
      pendingJobs -= 1;
      reportError(error);
    }
  });
}

function scheduleCloudWrite() {
  // Not ready = the first merge is still running. It reads local Progress after
  // the cloud read, so it already includes this change; writing now could overwrite
  // the cloud copy before it was read.
  if (!signedInUid || !cloudReady || writeQueued) return;
  writeQueued = true;
  enqueueCloudJob(async (uid) => {
    writeQueued = false;
    await cloud.writeProgressDoc(uid, forCloud(readLocal()));
  });
}

// Compares the cloud copy with local Progress and applies the rule of docs/CONTRACTS.md
// section 3: first sign-in on this device = union; afterwards the larger updatedAt wins
// as a whole object, and a cloud copy that is older or equal is ignored. Used for the
// first read and for every later change coming from another device.
function reconcile(uid, cloudCopy) {
  const local = readLocal();
  const merged = mergeLocalAndCloud(local, cloudCopy, uid);
  const theirs = cloudCopy ? normalize(cloudCopy) : null;
  const firstSignIn = local.syncedUid !== uid;
  const cloudIsNewer = Boolean(theirs) && !firstSignIn && theirs.updatedAt > local.updatedAt;

  let pushLocal;
  if (!theirs) pushLocal = hasIds(merged); // nothing to create in the cloud for an empty run
  else if (firstSignIn) pushLocal = true; // the union is new to the cloud
  else pushLocal = theirs.updatedAt < local.updatedAt; // local is newer: the cloud copy is behind

  if (firstSignIn || cloudIsNewer) writeLocal(merged); // otherwise local is already the result
  cloudReady = true;
  if (theirs && firstSignIn) {
    combinedNote = {
      localDone: idCount(local.done),
      cloudDone: idCount(theirs.done),
      totalDone: idCount(merged.done),
    };
  }
  if (!sameIds(local, merged)) notifyProgress(merged);
  if (pushLocal) scheduleCloudWrite();
  else markSynced();
}

function startWatch(uid, mine) {
  stopWatching();
  stopWatch = cloud.watchProgressDoc(
    uid,
    (copy) => {
      if (mine !== session) return;
      // null once we are in sync means the document was deleted (another device started
      // a new run). Our local Progress stays; our next change writes it back.
      if (copy === null && cloudReady) return;
      try {
        reconcile(uid, copy);
      } catch (error) {
        reportError(error);
      }
    },
    (error) => {
      if (mine === session) reportError(error);
    }
  );
}

function forgetSyncedUid() {
  const local = readLocal();
  if (!local.syncedUid) return;
  delete local.syncedUid; // not a content change: updatedAt stays as it was
  writeLocal(local);
}

async function handleAuthChange(user) {
  newSession();
  stopWatching();

  if (!user) {
    signedInUid = null;
    forgetSyncedUid(); // anything marked from now on is combined by union at the next sign-in
    setSyncStatus({ state: 'local', at: null, message: '' });
    return;
  }

  const mine = session;
  const uid = user.uid;
  signedInUid = uid;
  setSyncStatus({ state: 'syncing', at: syncStatus.at, message: '' });

  try {
    const copy = await cloud.readProgressDoc(uid);
    if (mine !== session) return;
    reconcile(uid, copy);
  } catch (error) {
    if (mine !== session) return;
    reportError(error);
  }
  // The watch is started even when the first read failed: its first good snapshot goes
  // through the same reconcile, so the site recovers by itself when the network returns.
  if (mine === session) startWatch(uid, mine);
}

// Called after every local change (commit). The local write has already happened.
function afterLocalWrite() {
  scheduleCloudWrite();
}

// Used by clearProgress: removes the cloud copy of a signed-in account.
function deleteCloudCopy() {
  if (signedInUid) enqueueCloudJob((uid) => cloud.deleteProgressDoc(uid));
}
// ====================================================================== /CLOUD

// ----------------------------------------------------------- public: reading

// Local first, and it never waits for the network: a slow or missing connection must
// not block the page. When signed in, the cloud copy is merged in the background and
// arrives through onProgressChange (and onSyncStatus). Note: this is narrower than the
// contract wording ("also reads the cloud copy ... and returns the result"); flagged
// in the T3 handoff for the orchestrator to settle.
export async function loadProgress() {
  return toSets(readLocal());
}

// ----------------------------------------------------------- public: changing

export async function setDone(itemId, value) {
  const progress = readLocal();
  let changed = false;

  if (value) {
    if (!progress.done[itemId]) {
      progress.done[itemId] = true;
      changed = true;
    }
    // Doing something means the player has been in that Region, so it becomes Visited.
    const regionId = entryRegions.get(itemId);
    if (regionId && !progress.visited[regionId]) {
      progress.visited[regionId] = true;
      changed = true;
    }
  } else if (progress.done[itemId]) {
    // Unmarking deletes the key. It never clears Visited: the player has still been there.
    delete progress.done[itemId];
    changed = true;
  }

  if (changed) commit(progress); // no change, no new updatedAt, no needless sync
}

export async function setVisited(regionId, value) {
  const progress = readLocal();
  if (value && !progress.visited[regionId]) {
    progress.visited[regionId] = true;
  } else if (!value && progress.visited[regionId]) {
    delete progress.visited[regionId];
  } else {
    return;
  }
  commit(progress);
}

// ------------------------------------------------------------ public: events

export function onProgressChange(callback) {
  progressListeners.add(callback);
  return () => progressListeners.delete(callback);
}

// Also reports the current status once, right away, so a screen that subscribes late
// still has something to show (the contract does not say; flagged in the handoff).
export function onSyncStatus(callback) {
  statusListeners.add(callback);
  try {
    callback(syncStatus);
  } catch (error) {
    console.error('Sync status subscriber failed', error);
  }
  return () => statusListeners.delete(callback);
}

// ------------------------------------------------------ public: export/import

export function exportProgress() {
  const { syncedUid, ...shareable } = readLocal(); // syncedUid is device-local, never in a backup
  return new Blob([JSON.stringify(shareable, null, 2)], { type: 'application/json' });
}

// Strict on purpose: a wrong file should be refused, not half-imported.
function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(BAD_FILE_MESSAGE);
  }
  const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
  if (!isPlainObject(data) || !isPlainObject(data.done)) throw new Error(BAD_FILE_MESSAGE);
  if (data.visited !== undefined && !isPlainObject(data.visited)) throw new Error(BAD_FILE_MESSAGE);

  const read = (map) => {
    const ids = [];
    for (const [id, value] of Object.entries(map || {})) {
      if (!SLUG.test(id) || typeof value !== 'boolean') throw new Error(BAD_FILE_MESSAGE);
      if (value) ids.push(id);
    }
    return ids;
  };
  return { done: read(data.done), visited: read(data.visited) };
}

export async function importProgress(file) {
  let text;
  try {
    text = await file.text();
  } catch {
    throw new Error(BAD_FILE_MESSAGE);
  }
  const backup = parseBackup(text);

  // Union only: an import adds and never removes (confirmed by Athos, Phase 0).
  const progress = readLocal();
  let addedDone = 0;
  let addedVisited = 0;
  for (const id of backup.done) {
    if (!progress.done[id]) {
      progress.done[id] = true;
      addedDone += 1;
    }
  }
  for (const id of backup.visited) {
    if (!progress.visited[id]) {
      progress.visited[id] = true;
      addedVisited += 1;
    }
  }
  if (addedDone || addedVisited) commit(progress);
  return { addedDone, addedVisited };
}

// ------------------------------------------------------------- public: merge

// Pure: no storage, no network. cloud === null means there is no cloud copy yet.
export function mergeLocalAndCloud(local, cloud, uid) {
  const mine = normalize(local);
  if (cloud === null || cloud === undefined) return { ...mine, syncedUid: uid };

  const theirs = normalize(cloud);
  const firstSignInHere = mine.syncedUid !== uid;

  if (firstSignInHere) {
    // Union (ADR 0001): anything marked on either side stays marked.
    return {
      done: { ...theirs.done, ...mine.done },
      visited: { ...theirs.visited, ...mine.visited },
      updatedAt: Date.now(),
      dataVersion: Math.max(mine.dataVersion, theirs.dataVersion),
      syncedUid: uid,
    };
  }

  // Already merged on this device: the newer copy wins as a whole object.
  // On a tie, local wins (it is the one the player is looking at).
  const winner = theirs.updatedAt > mine.updatedAt ? theirs : mine;
  return { ...winner, syncedUid: uid };
}

// -------------------------------------------------------------- public: reset

// "Start a new run". The interface asks for an export first; this function does not.
// We write an empty Progress with a fresh updatedAt (instead of deleting the key)
// so that, once signed in, the empty copy counts as the newest and wins over the
// old cloud copy. syncedUid is kept for the same reason.
// When signed in the cloud copy is deleted too (instead of written empty, as an
// ordinary change would be), so no document is left behind for a new run. The delete
// is not awaited: a slow network must not hold the screen, and a failure only sets
// the sync status.
export async function clearProgress() {
  const { syncedUid } = readLocal();
  const fresh = emptyProgress();
  if (syncedUid) fresh.syncedUid = syncedUid;
  commit(fresh, { syncToCloud: false });
  deleteCloudCopy();
}

// Start listening for sign-in. Browsers only: node (the tests) has no window and
// starts the cloud half through useCloud with a fake instead, so a test never tries
// to reach the real SDK. If the SDK cannot load, firebase.js reports "nobody signed
// in" and the status simply stays 'local'.
if (typeof window !== 'undefined') startCloud(realCloud);
