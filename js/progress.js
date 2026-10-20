// progress.js: the only module that touches localStorage and, through firebase.js,
// Firestore. See docs/CONTRACTS.md section 3 and ADR 0001.
//
// Local first: every change is written to localStorage before anything else, and a
// failure anywhere in the cloud half never loses or rolls back local data. The cloud
// half is the block marked CLOUD further down.
//
// Stored shape (same as the cloud document, plus the local-only syncedUid):
//   { done: { id: true }, visited: { id: true }, updatedAt: ms, dataVersion: n, syncedUid?: string,
//     crestSlots?: { crestId: { red?: n, blue?: n, yellow?: n, white?: n } },
//     builds?: { crestId: { red?: [entryId], blue?: [...], yellow?: [...], white?: [...] } } }
// crestSlots and builds are the player choices of ADR 0006. They are optional and "missing is not
// empty": a copy without the field was written by a page that does not know it, so the field is
// never added by an ordinary change and is taken from the other copy when two copies are merged.
//
// Adding another player choice (the provisional shellShards is the first candidate) is one entry
// in CHOICE_FIELDS (clean, empty, union), one setter and, in importProgress, one branch.

import {
  onAuthChange,
  readProgressDoc,
  writeProgressDoc,
  deleteProgressDoc,
  watchProgressDoc,
} from './firebase.js';

const REAL_KEY = 'silksong-guide:progress:v1';
const SAMPLE_KEY = 'silksong-guide:progress:sample:v1';

// Ids are permanent slugs (docs/CONTRACTS.md section 1). Checking them on import
// also keeps odd keys such as "__proto__" out of our objects.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const BAD_FILE_MESSAGE =
  'That file is not a Silksong Guide backup. Choose a file you downloaded from this page.';

// ---------------------------------------------------------------- module state

let storageKey = REAL_KEY; // switches to SAMPLE_KEY in sample mode; every read and write goes through it
let sampleMode = false; // true once configureProgress({ sample: true }) ran; never goes back in a session
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
//
// `sample: true` (docs/CONTRACTS.md section 3, QA finding F4): the page shows data/sample, whose
// ids are invented. Progress then lives under its own key and the cloud half is switched off,
// so sample ids never mix with a real Run or reach an account. Sample mode is one-way within a
// page session: a later call without the flag does not turn the cloud back on, because that
// could sync sample ids. (A page load is a new session and starts clean.)
export function configureProgress({ items = [], dataVersion = null, sample = false } = {}) {
  if (sample === true && !sampleMode) enterSampleMode();
  entryRegions = new Map();
  for (const item of items) {
    if (item && item.id && item.regionId) entryRegions.set(item.id, item.regionId);
  }
  contentVersion = Number.isInteger(dataVersion) ? dataVersion : null;
}

// progress.js starts listening for sign-in the moment it is imported, and may already have
// read the real key, so switching to sample mode has to undo that:
//   1. stopCloud() ends the auth listener and any Firestore watch, bumps the session (so a
//      read, merge or write already in flight is dropped) and forgets the signed-in uid.
//   2. memoryCopy is cleared: it could hold real Progress that must not leak into the sample.
//   3. The key switches, so every later read and write uses the sample key.
//   4. startCloud refuses to run in sample mode, and handleAuthChange ignores events,
//      so even a sign-in that races with this call cannot start a merge.
//   5. Status goes back to 'local' and subscribers receive the sample Progress.
function enterSampleMode() {
  sampleMode = true;
  stopCloud();
  memoryCopy = null;
  storageKey = SAMPLE_KEY;
  setSyncStatus({ state: 'local', at: null, message: '' });
  notifyProgress(readLocal());
}

// Lets tests (and nothing else) swap in an in-memory stand-in for localStorage,
// because node:test has no browser localStorage. Also resets the in-session state.
export function useStorage(storage) {
  storageOverride = storage;
  storageKey = REAL_KEY;
  sampleMode = false;
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

// ------------------------------------------------- player choices (ADR 0006)

const COLOURS = ['red', 'blue', 'yellow', 'white'];
const MAX_OPENED = 99; // a guard against typing errors, not a game fact
const MAX_BUILD_IDS = 12; // same: a guard

const isPlain = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const copyOf = (value) => JSON.parse(JSON.stringify(value));

// A stable text for a value, so two objects with the same content compare equal whatever
// the order their keys were written in. Arrays keep their order (a Build's order matters).
function canon(value) {
  return JSON.stringify(value, (key, v) =>
    isPlain(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v
  );
}

// The cleaners return the well-formed part of `raw`, or undefined when nothing usable is left.
// `onBad` is called once for every malformed part: normalize passes a function that does
// nothing (drop silently), parseBackup passes one that throws (refuse the whole file).

// { colour: [1..99] } -> the same with only good colours, in a fixed colour order
function cleanColours(raw, cleanValue, onBad) {
  if (!isPlain(raw)) {
    onBad();
    return undefined;
  }
  const found = {};
  for (const [colour, value] of Object.entries(raw)) {
    const clean = COLOURS.includes(colour) ? cleanValue(value, onBad) : undefined;
    if (clean === undefined) onBad();
    else found[colour] = clean;
  }
  const out = {};
  for (const colour of COLOURS) if (colour in found) out[colour] = found[colour];
  if (Object.keys(out).length === 0) {
    onBad(); // "one or more colours" (a lenient caller has already dropped the parts)
    return undefined;
  }
  return out;
}

function cleanOpenedCount(value) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_OPENED ? value : undefined;
}

// `seen` is shared by the colours of one Build, so an id counts as twice even across colours.
function cleanIdList(value, onBad, seen) {
  if (!Array.isArray(value) || value.length > MAX_BUILD_IDS) return undefined;
  const out = [];
  for (const id of value) {
    if (typeof id === 'string' && SLUG.test(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    } else {
      onBad(); // a non-slug id, or an id twice in one Build
    }
  }
  return out.length ? out : undefined;
}

// Crest id -> value, where each Crest's value is cleaned by `cleanOne`.
function cleanByCrest(raw, cleanOne, onBad) {
  if (!isPlain(raw)) {
    onBad();
    return undefined;
  }
  const out = {};
  for (const [crestId, value] of Object.entries(raw)) {
    const clean = SLUG.test(crestId) ? cleanOne(value, onBad) : undefined;
    if (clean === undefined) onBad();
    else out[crestId] = clean;
  }
  return out;
}

const cleanCrestSlots = (raw, onBad) =>
  cleanByCrest(raw, (opened, bad) => cleanColours(opened, cleanOpenedCount, bad), onBad);
const cleanBuilds = (raw, onBad) =>
  cleanByCrest(
    raw,
    (build, bad) => {
      const seen = new Set();
      return cleanColours(build, (ids, b) => cleanIdList(ids, b, seen), bad);
    },
    onBad
  );

// Union on the first sign-in, for a field both copies have (docs/CONTRACTS.md section 3).
// `localNewer` is decided on the original updatedAt values; a tie counts as local.
function unionCrestSlots(mine, theirs) {
  const out = copyOf(mine);
  for (const [crestId, colours] of Object.entries(theirs)) {
    out[crestId] = out[crestId] || {};
    for (const [colour, count] of Object.entries(colours)) {
      out[crestId][colour] = Math.max(out[crestId][colour] || 0, count);
    }
  }
  return out;
}

// Every Crest saved on either side stays; the same Crest on both sides keeps the newer copy's
// Build whole (two half-Builds glued together could hold more Tools than the Crest has slots).
function unionBuilds(mine, theirs, localNewer) {
  const out = copyOf(theirs);
  for (const [crestId, build] of Object.entries(mine)) {
    if (!Object.hasOwn(out, crestId) || localNewer) out[crestId] = copyOf(build);
  }
  return out;
}

// The one table every merge, copy and handout goes through, so a new player choice is one entry.
const CHOICE_FIELDS = [
  { key: 'crestSlots', empty: () => ({}), clean: cleanCrestSlots, union: unionCrestSlots },
  { key: 'builds', empty: () => ({}), clean: cleanBuilds, union: unionBuilds },
];

// The choices as the interface receives them: deep copies, with the empty value for an absent field.
function choicesOut(progress) {
  const out = {};
  for (const { key, empty } of CHOICE_FIELDS) {
    out[key] = progress[key] !== undefined ? copyOf(progress[key]) : empty();
  }
  return out;
}

// True when any field holds something (an empty {} or null is "known but empty").
function hasChoices(progress) {
  return CHOICE_FIELDS.some(({ key, empty }) => progress[key] !== undefined && canon(progress[key]) !== canon(empty()));
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
  // An absent field stays absent; a present one keeps its well-formed parts only.
  for (const { key, clean } of CHOICE_FIELDS) {
    if (raw[key] === undefined) continue;
    const kept = clean(raw[key], () => {});
    if (kept !== undefined) base[key] = kept;
  }
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
    const text = storage.getItem(storageKey);
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
    storage.setItem(storageKey, JSON.stringify(progress));
    memoryCopy = null;
  } catch {
    memoryCopy = progress; // quota or privacy mode: keep this session's work in memory
  }
}

// What the interface receives: the two id sets plus the player choices, with defaults
// ({}) applied here and only here (stored Progress keeps an absent field absent).
function toSets(progress) {
  return {
    done: new Set(Object.keys(progress.done)),
    visited: new Set(Object.keys(progress.visited)),
    ...choicesOut(progress),
  };
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
  for (const callback of [...progressListeners]) {
    try {
      callback(toSets(progress)); // a fresh copy each, so one subscriber cannot change what the next sees
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
  if (sampleMode) return; // sample ids must never reach an account
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

function hasContent(progress) {
  return idCount(progress.done) + idCount(progress.visited) > 0 || hasChoices(progress);
}

// "Did anything the page shows change?": ids and the player choices. Compared as handed out, so
// an absent field and an empty one are the same here (the page sees {} either way).
function sameContent(a, b) {
  const same = (x, y) => idCount(x) === idCount(y) && Object.keys(x).every((id) => y[id] === true);
  return same(a.done, b.done) && same(a.visited, b.visited) && canon(choicesOut(a)) === canon(choicesOut(b));
}

// What goes to the cloud: the Progress object without the device-only syncedUid.
// Absent fields stay absent (nothing here adds them).
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
  if (!theirs) pushLocal = hasContent(merged); // nothing to create in the cloud for an empty run
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
  if (!sameContent(local, merged)) notifyProgress(merged);
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
  if (sampleMode) return; // belt and braces: the listener is already stopped in sample mode
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

// The player choices (ADR 0006). They follow the same rules as setDone: a call that changes
// nothing does nothing, otherwise commit (stamp, local write, cloud write, notify). A bad argument
// is an interface bug, so it throws a TypeError before anything is read or written. None of them
// marks anything done or Visited, and ids are checked as slugs only, never against data/.

function requireCrestId(crestId) {
  if (typeof crestId !== 'string' || !SLUG.test(crestId)) {
    throw new TypeError(`Crest id must be a slug, got ${JSON.stringify(crestId)}`);
  }
}

// Stores `next` for one Crest in one field (undefined = remove the Crest). The field is created
// only here, when something really changes, never by an ordinary setDone ("missing is not empty").
function changeCrest(key, crestId, next) {
  const progress = readLocal();
  const map = progress[key];
  const before = map !== undefined && Object.hasOwn(map, crestId) ? map[crestId] : undefined;
  if (before === undefined && next === undefined) return;
  if (before !== undefined && next !== undefined && canon(before) === canon(next)) return;

  const updated = map || {};
  if (next === undefined) delete updated[crestId];
  else updated[crestId] = next;
  progress[key] = updated;
  commit(progress);
}

export async function setCrestSlots(crestId, opened) {
  requireCrestId(crestId);
  if (!isPlain(opened)) throw new TypeError('Opened slots must be an object like { blue: 1 }');
  const kept = {};
  for (const [colour, count] of Object.entries(opened)) {
    if (!COLOURS.includes(colour)) throw new TypeError(`Unknown slot colour "${colour}"`);
    if (!Number.isInteger(count) || count < 0 || count > MAX_OPENED) {
      throw new TypeError(`Opened ${colour} slots must be an integer from 0 to ${MAX_OPENED}`);
    }
    if (count > 0) kept[colour] = count; // a zero is not stored
  }
  const ordered = {};
  for (const colour of COLOURS) if (colour in kept) ordered[colour] = kept[colour];
  changeCrest('crestSlots', crestId, Object.keys(ordered).length ? ordered : undefined);
}

export async function setBuild(crestId, build) {
  requireCrestId(crestId);
  if (build !== null && !isPlain(build)) throw new TypeError('A Build must be an object like { red: [id] }, or null');
  const kept = {};
  const seen = new Set();
  for (const [colour, ids] of Object.entries(build || {})) {
    if (!COLOURS.includes(colour)) throw new TypeError(`Unknown slot colour "${colour}"`);
    if (!Array.isArray(ids) || ids.length > MAX_BUILD_IDS) {
      throw new TypeError(`${colour} must be a list of at most ${MAX_BUILD_IDS} ids`);
    }
    for (const id of ids) {
      if (typeof id !== 'string' || !SLUG.test(id)) throw new TypeError(`Not an entry id: ${JSON.stringify(id)}`);
    }
    for (const id of ids) {
      if (seen.has(id)) throw new TypeError(`The id ${id} appears twice in one Build`);
      seen.add(id);
    }
    if (ids.length > 0) kept[colour] = [...ids]; // an empty list is not stored
  }
  const ordered = {};
  for (const colour of COLOURS) if (colour in kept) ordered[colour] = kept[colour];
  changeCrest('builds', crestId, Object.keys(ordered).length ? ordered : undefined);
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
  const backup = { done: read(data.done), visited: read(data.visited) };

  // A player choice that is present but malformed refuses the whole file; an absent one
  // (every backup made before Phase 5) is fine and adds nothing.
  const refuse = () => {
    throw new Error(BAD_FILE_MESSAGE);
  };
  for (const { key, clean } of CHOICE_FIELDS) {
    if (data[key] !== undefined) backup[key] = clean(data[key], refuse);
  }
  return backup;
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
  const addedSlots = importSlots(progress, backup.crestSlots);
  const addedBuilds = importBuilds(progress, backup.builds);

  if (addedDone || addedVisited || addedSlots || addedBuilds) commit(progress);
  // tookShellShards is part of the contracted result but shellShards is not built yet (Athos has not
  // confirmed it), so it is always false. When the field is added, importShellShards sets it.
  return { addedDone, addedVisited, addedSlots, addedBuilds, tookShellShards: false };
}

// An import never replaces: opened slots take the larger number per Crest and colour. Returns the
// sum of the increases. The field is created only when something really increases.
function importSlots(progress, fromFile) {
  if (!fromFile) return 0;
  let added = 0;
  for (const [crestId, colours] of Object.entries(fromFile)) {
    for (const [colour, count] of Object.entries(colours)) {
      const have = (progress.crestSlots && progress.crestSlots[crestId] && progress.crestSlots[crestId][colour]) || 0;
      if (count <= have) continue;
      progress.crestSlots = progress.crestSlots || {};
      progress.crestSlots[crestId] = progress.crestSlots[crestId] || {};
      progress.crestSlots[crestId][colour] = count;
      added += count - have;
    }
    if (progress.crestSlots && progress.crestSlots[crestId]) {
      const ordered = {};
      for (const colour of COLOURS) if (colour in progress.crestSlots[crestId]) ordered[colour] = progress.crestSlots[crestId][colour];
      progress.crestSlots[crestId] = ordered;
    }
  }
  return added;
}

// A Build from the file is added only for a Crest that has none saved here. Returns how many Crests got one.
function importBuilds(progress, fromFile) {
  if (!fromFile) return 0;
  let added = 0;
  for (const [crestId, build] of Object.entries(fromFile)) {
    if (progress.builds && Object.hasOwn(progress.builds, crestId)) continue;
    progress.builds = progress.builds || {};
    progress.builds[crestId] = build;
    added += 1;
  }
  return added;
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
    const merged = {
      done: { ...theirs.done, ...mine.done },
      visited: { ...theirs.visited, ...mine.visited },
      updatedAt: Date.now(),
      dataVersion: Math.max(mine.dataVersion, theirs.dataVersion),
      syncedUid: uid,
    };
    // Each player choice has its own union. Decided on the original updatedAt values, a tie is local.
    const localNewer = mine.updatedAt >= theirs.updatedAt;
    for (const { key, union } of CHOICE_FIELDS) {
      const a = mine[key];
      const b = theirs[key];
      const value = a !== undefined && b !== undefined ? union(a, b, localNewer) : a !== undefined ? a : b;
      if (value !== undefined) merged[key] = copyOf(value); // on neither side: stays absent
    }
    return merged;
  }

  // Already merged on this device: the newer copy wins as a whole object.
  // On a tie, local wins (it is the one the player is looking at).
  const [winner, other] = theirs.updatedAt > mine.updatedAt ? [theirs, mine] : [mine, theirs];
  const result = { ...winner, syncedUid: uid };
  // "Missing is not empty": a field the winner does not have (it was written by an older page)
  // comes from the other copy. A present field, even {} or null, is the winner's own and stays.
  for (const { key } of CHOICE_FIELDS) {
    if (result[key] === undefined && other[key] !== undefined) result[key] = copyOf(other[key]);
  }
  return result;
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
  // Written empty on purpose (not left absent): an absent field would let the old cloud copy's
  // Builds come back through "missing is not empty".
  for (const { key, empty } of CHOICE_FIELDS) fresh[key] = empty();
  if (syncedUid) fresh.syncedUid = syncedUid;
  commit(fresh, { syncToCloud: false });
  deleteCloudCopy();
}

// Start listening for sign-in. Browsers only: node (the tests) has no window and
// starts the cloud half through useCloud with a fake instead, so a test never tries
// to reach the real SDK. If the SDK cannot load, firebase.js reports "nobody signed
// in" and the status simply stays 'local'.
if (typeof window !== 'undefined') startCloud(realCloud);
