// progress.js: the only module that touches localStorage (and, from task T3 on,
// Firestore through firebase.js). See docs/CONTRACTS.md section 3 and ADR 0001.
//
// This file is the LOCAL half. Local first: every change is written to
// localStorage before anything else, and a failure anywhere else never loses it.
//
// Stored shape (same as the cloud document, plus the local-only syncedUid):
//   { done: { id: true }, visited: { id: true }, updatedAt: ms, dataVersion: n, syncedUid?: string }

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
function commit(progress) {
  progress.updatedAt = Date.now();
  if (contentVersion !== null) progress.dataVersion = contentVersion;
  writeLocal(progress);
  afterLocalWrite(progress);
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
// TASK T3 PLUGS IN HERE (do not change the public signatures below).
//   1. Subscribe to onAuthChange from firebase.js. On sign-in: readProgressDoc(uid),
//      mergeLocalAndCloud(readLocal(), cloud, uid), writeLocal + writeProgressDoc the
//      result, start watchProgressDoc, then notifyProgress and setSyncStatus (with
//      `combined` after a first sign-in).
//   2. On sign-out: stop the watch and remove syncedUid from the local copy.
//   3. afterLocalWrite below: when signed in, writeProgressDoc (without syncedUid);
//      report 'syncing', then 'synced' or 'error'. An error must never touch local data.
//   4. clearProgress: also deleteProgressDoc when signed in.
//   5. exportProgress / importProgress need no change.
function afterLocalWrite(_progress) {
  // Local-only in task T1: nothing to sync.
}
// ====================================================================== /CLOUD

// ----------------------------------------------------------- public: reading

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
export async function clearProgress() {
  const { syncedUid } = readLocal();
  const fresh = emptyProgress();
  if (syncedUid) fresh.syncedUid = syncedUid;
  commit(fresh);
}
