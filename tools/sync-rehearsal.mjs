// Rehearsal of the two-device sync, end to end, against the local Firebase Emulators.
//
// Why it exists: unit tests use fakes and the rules tests use the Emulator's REST API, so the real
// Firebase SDK and the real pages had never run sync together. This script plays "device A",
// "device B" and "device C" as three separate headless Chromium profiles, signs them in with the
// email link, and checks what the pages show and what is in localStorage and the cloud copy.
//
// It does NOT replace Athos's check on the real site. It cannot prove the Google popup, real email
// delivery or the published domain (see tools/README.md).
//
// Run it inside the Emulators (the Emulators set FIRESTORE_EMULATOR_HOST for us):
//   firebase emulators:exec --only auth,firestore --project demo-silksong-guide "node tools/sync-rehearsal.mjs"
//
// Plain Node, no dependencies. Node 22+ has WebSocket built in, which we use for the DevTools protocol.
//
// Checks 7 to 13 (added in P5-22) cover the player choices of ADR 0006: opened Crest slots and saved
// Builds. The Builds page does not exist yet, so those checks call the setters of js/progress.js from the
// page itself (import of the same module URL the pages use, run through DevTools). The sync path under
// test is the real one: the real progress.js, the real firebase.js, the real SDK, the Emulators.
//
// SDK source. By default the pages load the pinned Firebase SDK from gstatic, as the real site does.
// If gstatic cannot be reached from where this runs, set SDK_DIR to a folder made by
// `node tools/local-sdk.mjs <folder>`: DevTools then answers the requests for
// https://www.gstatic.com/firebasejs/<version>/* from that folder. It is the same SDK version, installed
// from npm and bundled by esbuild, NOT the bytes gstatic serves. The script prints which source it used.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'demo-silksong-guide';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
// The folder served as the site. Normally the repository; SITE_DIR points at a copy of it, to try a
// candidate fix to js/ without touching the repository.
const SITE = process.env.SITE_DIR || REPO;
const CHROMIUM = process.env.CHROMIUM || '/usr/bin/chromium';
const PROGRESS_KEY = 'silksong-guide:progress:v1';
const SAMPLE_PROGRESS_KEY = 'silksong-guide:progress:sample:v1';

const SDK_DIR = process.env.SDK_DIR || '';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

// Real entries used for the checks. Both belong to Region moss-grotto (data/items.json).
// The script only needs two ids that exist; their meaning does not matter here.
const REGION_ID = 'moss-grotto';
const ENTRY_X = 'moss-mother';
const ENTRY_Y = 'silk-spear';
const SAMPLE_REGION = 'sample-region-a';
const SAMPLE_ENTRY = 'sample-ability';

// Ids for the player-choice checks. progress.js checks them as slugs only, never against data/, so any
// slugs would do; these exist in data/items.json to keep the saved values looking like real ones.
const REAPER = 'reaper-crest';
const BEAST = 'beast-crest';
const TOOLS = ['druids-eye', 'shard-pendant', 'compass', 'straight-pin', 'warding-bell'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ------------------------------------------------------------------ reporting

let failures = 0;
function check(name, ok, details = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${details ? `  (${details})` : ''}`);
}

// ------------------------------------------------------------------ small helpers

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitUntil(fn, what, timeoutMs = 15000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try {
      last = await fn();
      if (last) return last;
    } catch (error) {
      last = error.message;
    }
    await sleep(100);
  }
  throw new Error(`Timed out after ${timeoutMs} ms waiting for ${what}${last ? ` (last: ${JSON.stringify(last)})` : ''}`);
}

// Like waitUntil but returns true or false, for assertions that should fail softly.
async function becomes(fn, timeoutMs = 15000) {
  try {
    await waitUntil(fn, 'condition', timeoutMs);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ SDK source

// Says where the pages get the Firebase SDK from, and refuses a local copy of another version than
// the one js/firebase.js pins (a mismatch would make "the real SDK" a different SDK).
function sdkSourceNote() {
  const pinned = /const SDK_VERSION = '([^']+)'/.exec(readFileSync(join(SITE, 'js/firebase.js'), 'utf8'))?.[1];
  if (!SDK_DIR) return `gstatic, pinned version ${pinned} (the real site's source; it must be reachable from here)`;
  const built = existsSync(join(SDK_DIR, 'VERSION')) ? readFileSync(join(SDK_DIR, 'VERSION'), 'utf8').trim() : 'unknown';
  if (built !== pinned) throw new Error(`SDK_DIR holds firebase ${built} but js/firebase.js pins ${pinned}; rebuild it with tools/local-sdk.mjs`);
  return `LOCAL COPY of firebase ${built} from npm (SDK_DIR=${SDK_DIR}), answered by DevTools in place of gstatic; same version, not the bytes gstatic serves`;
}

// ------------------------------------------------------------------ site server

const children = []; // every process we start, stopped in the finally block
const devices = [];
const tempDirs = [];

async function startSiteServer() {
  const port = await freePort();
  const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', SITE], {
    stdio: 'ignore',
  });
  children.push(child);
  await waitUntil(async () => (await fetch(`http://127.0.0.1:${port}/index.html`)).ok, 'the site server');
  return `http://127.0.0.1:${port}`;
}

// ------------------------------------------------------------------ DevTools client

class Device {
  constructor(name) {
    this.name = name;
    this.syncTexts = new Set(); // every footer / account sync line this device ever showed
    this.exceptions = [];
    this.requestHosts = new Set();
    this.consoleErrors = [];
    this.consoleTail = [];
    this.netTail = []; // the last requests, kept only to explain a failure
    this.urls = new Map();
    this.expectSync = true; // false for a device that never signs in (its sync line stays "local")
    this.closed = false;
    this.pending = new Map();
    this.nextId = 1;
  }

  async launch() {
    const dir = mkdtempSync(join(tmpdir(), `sync-rehearsal-${this.name}-`));
    tempDirs.push(dir);
    this.dir = dir;
    const port = await freePort();
    this.process = spawn(
      CHROMIUM,
      [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${dir}`,
        'about:blank',
      ],
      { stdio: 'ignore' }
    );
    children.push(this.process);
    const info = await waitUntil(async () => (await fetch(`http://127.0.0.1:${port}/json/version`)).json(), `Chromium for device ${this.name}`);
    this.socket = new WebSocket(info.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', () => reject(new Error('DevTools socket failed')), { once: true });
    });
    this.socket.addEventListener('message', (event) => this.onMessage(JSON.parse(event.data)));

    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    this.sessionId = sessionId;
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');
    await this.send('Runtime.addBinding', { name: '__rehearsalReport' });
    if (SDK_DIR) {
      // Answer the SDK requests from the local copy (see the header comment). Nothing else is touched.
      await this.send('Fetch.enable', { patterns: [{ urlPattern: 'https://www.gstatic.com/firebasejs/*', requestStage: 'Request' }] });
    }
    // Watches the two places where the sync state is written, on every page, from the first moment:
    // the footer line and the Account page's plate. Every distinct text is reported to this script.
    await this.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        let last = '';
        const report = () => {
          const texts = [];
          const footer = document.getElementById('sync-status');
          if (footer && footer.textContent) texts.push(footer.textContent);
          for (const el of document.querySelectorAll('.plate-help')) texts.push(el.textContent);
          const joined = JSON.stringify(texts);
          if (joined !== last) { last = joined; window.__rehearsalReport(joined); }
        };
        new MutationObserver(report).observe(document, { subtree: true, childList: true, characterData: true });
        document.addEventListener('DOMContentLoaded', report);
      })();`,
    });
  }

  send(method, params = {}, withSession = true) {
    const id = this.nextId++;
    const message = { id, method, params };
    if (withSession && this.sessionId) message.sessionId = this.sessionId;
    this.socket.send(JSON.stringify(message));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject, method }));
  }

  onMessage(message) {
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject, method } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${method}: ${message.error.message}`));
      else resolve(message.result);
      return;
    }
    const { method, params } = message;
    if (method === 'Runtime.bindingCalled' && params.name === '__rehearsalReport') {
      for (const text of JSON.parse(params.payload)) this.syncTexts.add(text);
    } else if (method === 'Runtime.exceptionThrown') {
      this.exceptions.push(params.exceptionDetails.exception?.description || params.exceptionDetails.text);
    } else if (method === 'Runtime.consoleAPICalled') {
      const line = params.args.map((arg) => arg.value || arg.description || '').join(' ');
      this.consoleTail.push(`${params.type}: ${line}`);
      this.consoleTail = this.consoleTail.slice(-20); // kept only to explain a failure
      if (params.type === 'error') this.consoleErrors.push(line);
    } else if (method === 'Fetch.requestPaused') {
      this.answerFromLocalSdk(params);
    } else if (method === 'Network.loadingFailed') {
      this.netTail.push(`FAILED ${this.urls.get(params.requestId) || params.requestId}: ${params.errorText}`);
      this.netTail = this.netTail.slice(-24);
    } else if (method === 'Network.requestWillBeSent') {
      this.urls.set(params.requestId, params.request.url.slice(0, 120));
      this.netTail.push(`${params.request.method} ${params.request.url.slice(0, 120)}`);
      this.netTail = this.netTail.slice(-24);
      try {
        this.requestHosts.add(new URL(params.request.url).host);
      } catch {
        // data: and blob: URLs have no host; nothing to record
      }
    }
  }

  // The file name is the last part of the URL, whatever the version folder in front of it.
  async answerFromLocalSdk(params) {
    this.netTail.push(`paused ${basename(params.request.url)}`);
    try {
      const file = join(SDK_DIR, basename(new URL(params.request.url).pathname));
      if (!existsSync(file)) {
        await this.send('Fetch.fulfillRequest', { requestId: params.requestId, responseCode: 404, body: '' });
        return;
      }
      await this.send('Fetch.fulfillRequest', {
        requestId: params.requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: 'text/javascript; charset=utf-8' },
          { name: 'Access-Control-Allow-Origin', value: '*' },
        ],
        body: readFileSync(file).toString('base64'),
      });
      this.netTail.push(`fulfilled ${basename(file)}`);
    } catch (error) {
      this.netTail.push(`answer failed ${error.message}`);
      this.exceptions.push(`local SDK answer failed: ${error.message}`);
    }
  }

  async goto(url) {
    const loaded = new Promise((resolve) => {
      const listener = (event) => {
        const message = JSON.parse(event.data);
        if (message.method === 'Page.loadEventFired' && message.sessionId === this.sessionId) {
          this.socket.removeEventListener('message', listener);
          resolve();
        }
      };
      this.socket.addEventListener('message', listener);
    });
    const result = await this.send('Page.navigate', { url });
    if (result.errorText) throw new Error(`Navigation to ${url} failed: ${result.errorText}`);
    await Promise.race([loaded, sleep(15000)]);
  }

  async reload() {
    const { result } = await this.send('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
    await this.goto(result.value);
  }

  async eval(expression) {
    const response = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    }
    return response.result.value;
  }

  waitFor(expression, what, timeoutMs) {
    return waitUntil(() => this.eval(expression), `${what} on device ${this.name}`, timeoutMs);
  }

  // What the page stored for Progress (null when nothing is stored yet).
  async storedProgress(key = PROGRESS_KEY) {
    const text = await this.eval(`localStorage.getItem(${JSON.stringify(key)})`);
    return text ? JSON.parse(text) : null;
  }

  // The toggle for an entry, read from the DOM: 'true', 'false' or null when it is not on the page.
  pressed(entryId) {
    return this.eval(
      `(() => { const b = document.querySelector('button[data-action="toggle-done"][data-id="${entryId}"]'); return b ? b.getAttribute('aria-pressed') : null; })()`
    );
  }

  async click(selector) {
    await this.eval(`document.querySelector(${JSON.stringify(selector)}).click()`);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    try {
      await this.send('Browser.close', {}, false);
    } catch {
      // The browser may already be gone.
    }
    await Promise.race([new Promise((resolve) => this.process.once('exit', resolve)), sleep(5000)]);
    this.process.kill('SIGKILL');
  }
}

async function newDevice(name) {
  const device = new Device(name);
  devices.push(device);
  await device.launch();
  return device;
}

// ------------------------------------------------------------------ the flows

async function oobCodes() {
  const response = await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/oobCodes`);
  return (await response.json()).oobCodes;
}

// Reads the cloud copy straight from the Firestore Emulator. "Bearer owner" is the Emulator's
// admin token: it skips the rules, so this reads what is really stored.
async function cloudDoc(uid) {
  const url = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/silksong_progress/${uid}`;
  const response = await fetch(url, { headers: { Authorization: 'Bearer owner' } });
  if (response.status === 404) return null;
  const doc = await response.json();
  const ids = (field) => Object.keys(doc.fields?.[field]?.mapValue?.fields || {}).sort();
  return { done: ids('done'), visited: ids('visited'), data: decodeFields(doc.fields || {}), raw: doc };
}

// Firestore's REST format -> plain values: { done: { 'some-id': true }, builds: { crest: { red: ['id'] } }, ... }
function decodeValue(value) {
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('stringValue' in value) return value.stringValue;
  if ('nullValue' in value) return null;
  throw new Error(`unexpected Firestore value ${JSON.stringify(value)}`);
}
function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

// plain values -> Firestore's REST format, for writing a document straight to the Emulator
function encodeValue(value) {
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeValue(v)])) } };
}

// Two objects with the same content compare equal whatever the order their keys were written in.
// Arrays keep their order (a Build's order is part of it).
const canonical = (value) =>
  JSON.stringify(value, (key, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v
  );
const same = (a, b) => canonical(a) === canonical(b);

// Signs a device in through the real form on the Account page, then follows the emailed link.
//
// Seen in the sandbox with the local SDK copy (see the header): now and then the email form's submit
// stays "busy" for good on a page that was loaded right after leaving another page (the SDK request is
// still pending). So a first try that gets no "link sent" message within 8 s is reported (with what the
// device last did) and tried once more on a fresh page load; a second miss fails the rehearsal.
async function signInWithEmailLink(device, base, email) {
  const before = new Set((await oobCodes()).map((entry) => entry.oobCode));
  for (let attempt = 1; ; attempt += 1) {
    await device.goto(`${base}/account.html?emulator`);
    await device.waitFor(`!!document.querySelector('form[data-action="send-link"]')`, 'the email form');
    await device.eval(`(() => {
      const form = document.querySelector('form[data-action="send-link"]');
      form.elements.email.value = ${JSON.stringify(email)};
      form.requestSubmit();
    })()`);
    if (await becomes(() => device.eval(`document.body.innerText.includes('We sent a sign-in link')`), 8000)) break;
    const state = await device.eval(`JSON.stringify({ buttonDisabled: (document.querySelector('form[data-action="send-link"] button') || {}).disabled })`);
    const note = `device ${device.name}: no "link sent" message after 8 s (attempt ${attempt}); page ${state}; last requests ${JSON.stringify(device.netTail.slice(-6))}; console ${JSON.stringify(device.consoleTail.slice(-3))}`;
    if (attempt >= 2) throw new Error(note);
    console.log(`info  ${note}; trying once more on a fresh page load`);
  }

  const sent = await waitUntil(
    async () => (await oobCodes()).find((entry) => entry.email === email && !before.has(entry.oobCode)),
    'the sign-in link in the Auth Emulator'
  );
  await device.goto(sent.oobLink);
  await device.waitFor(`document.body.innerText.includes('Signed in as')`, 'the signed-in Account page');
  await device.waitFor(`location.search.indexOf('oobCode') === -1`, 'the link to leave the address bar');
}

const syncLineSeen = (device, pattern) => [...device.syncTexts].some((text) => pattern.test(text));

// A Region page hides its entries until the Region is Visited or something in it is done.
// "Show entries ahead of time" (data-action="show-all") reveals them for this page view only and
// changes no Progress, so the rehearsal does not add Visited marks of its own.
async function revealEntries(device) {
  await device.waitFor(`!!document.querySelector('[data-action="show-all"], button[data-action="toggle-done"]')`, 'the Region page');
  await device.eval(`(() => {
    if (document.querySelector('button[data-action="toggle-done"]')) return;
    document.querySelector('[data-action="show-all"]').click();
  })()`);
  await device.waitFor(`!!document.querySelector('button[data-action="toggle-done"]')`, 'the entry toggles');
}

async function openRegion(device, base, regionId = REGION_ID, query = '') {
  await device.goto(`${base}/region.html?id=${regionId}${query}&emulator`);
  await revealEntries(device);
}

// The account's uid, from the Auth Emulator (the admin token "owner" is the Emulator's own).
async function accountUid(email) {
  const response = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: [email] }),
  });
  return (await response.json()).users?.[0]?.localId;
}

async function toggle(device, entryId) {
  await device.click(`button[data-action="toggle-done"][data-id="${entryId}"]`);
}

// ------------------------------------------------------------------ player choices (P5-22)
//
// The page UI for Builds does not exist yet. These checks call the setters of js/progress.js from the
// page, with an import of the module URL the pages themselves use (so it is the same module instance,
// already signed in and syncing). Everything after the call is the real path: local write, SDK write,
// Emulator, watch listener, merge on the other device.

const progressUrl = (base) => `${base}/js/progress.js`;

// Calls an exported function of progress.js inside the page and returns its (JSON) result.
function inPage(device, base, fn, ...args) {
  return device.eval(`import(${JSON.stringify(progressUrl(base))}).then((m) => m.${fn}(...${JSON.stringify(args)}))`);
}

// Subscribes inside the page to onProgressChange, the way the interface will, and keeps the last value
// it was handed in window.__seen. It must be installed again after every navigation.
async function installProbe(device, base) {
  await device.eval(`import(${JSON.stringify(progressUrl(base))}).then((m) => {
    window.__seen = null;
    m.onProgressChange((p) => { window.__seen = { done: [...p.done].sort(), builds: p.builds, crestSlots: p.crestSlots }; });
    return true;
  })`);
}
const seen = (device) => device.eval('window.__seen');

// The device's own saved copy of the choices, read from localStorage.
async function storedChoices(device) {
  const stored = await device.storedProgress();
  return { builds: stored?.builds, crestSlots: stored?.crestSlots, done: Object.keys(stored?.done || {}).sort(), raw: stored };
}

// "Does this place show `expected` for one choice field?" for the three places a value can be seen:
// what the page was handed, what is in localStorage, what is in the cloud copy.
const probeShows = async (device, field, expected) => same((await seen(device))?.[field], expected);
const storedShows = async (device, field, expected) => same((await storedChoices(device))[field], expected);
const cloudShows = async (uid, field, expected) => same((await cloudDoc(uid))?.data?.[field], expected);

// Opens a device on the Account page, signed out (for choices that must be saved before signing in).
async function newSignedOutDevice(name, base) {
  const device = await newDevice(name);
  await device.goto(`${base}/account.html?emulator`);
  await device.waitFor(`!!document.querySelector('form[data-action="send-link"]')`, 'the signed-out Account page');
  return device;
}

// Signs a device in as `email`, then waits until the first merge has run (the local copy carries the
// uid) and gives the watch listener a moment to attach.
async function signInAndSettle(device, base, email) {
  await signInWithEmailLink(device, base, email);
  const uid = await accountUid(email);
  await device.waitFor(
    `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(PROGRESS_KEY)})).syncedUid === ${JSON.stringify(uid)}; } catch { return false; } })()`,
    'the first merge to finish'
  );
  await sleep(1200);
  await installProbe(device, base);
  return uid;
}

async function newSignedInDevice(name, base, email) {
  const device = await newDevice(name);
  const uid = await signInAndSettle(device, base, email);
  return { device, uid };
}

const newEmail = (tag) => `rehearsal-${tag}-${Date.now()}@example.test`;

// An ID token for the account, so a document can be written to the Emulator THROUGH the rules, as the
// signed-in user (the admin token would skip them). Done with a second email-link sign-in over REST, which
// leaves the browsers' own sessions alone (setting a password would not).
async function idTokenFor(email) {
  const before = new Set((await oobCodes()).map((entry) => entry.oobCode));
  const auth = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts`;
  const headers = { 'Content-Type': 'application/json' };
  await fetch(`${auth}:sendOobCode?key=fake`, { method: 'POST', headers, body: JSON.stringify({ requestType: 'EMAIL_SIGNIN', email, continueUrl: 'http://localhost/' }) });
  const sent = await waitUntil(async () => (await oobCodes()).find((entry) => entry.email === email && !before.has(entry.oobCode)), 'the REST sign-in code');
  const response = await fetch(`${auth}:signInWithEmailLink?key=fake`, { method: 'POST', headers, body: JSON.stringify({ email, oobCode: sent.oobCode }) });
  return (await response.json()).idToken;
}

// Writes a whole document as the signed-in user, through the rules. `doc` is a plain Progress object.
// Returns the HTTP status (200 = the rules accepted it).
async function writeDocAsUser(uid, idToken, doc) {
  const url = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/silksong_progress/${uid}`;
  const fields = Object.fromEntries(Object.entries(doc).map(([key, value]) => [key, encodeValue(value)]));
  const response = await fetch(url, { method: 'PATCH', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
  return response.status;
}

// One scenario, so a failure in one does not hide the others. Its devices are closed afterwards
// (they stay in `devices`, so check 5 still reads what they showed).
async function scenario(title, fn) {
  console.log(`--- ${title}`);
  const before = devices.length;
  try {
    await fn();
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${title} stopped early  (${error.message})`);
  }
  for (const device of devices.slice(before)) await device.close();
}

const BUILD_A = { red: [TOOLS[0], TOOLS[1]], blue: [TOOLS[2]] };

// 7. A saves a Build and opens a slot; B, with its page open, shows both.
async function liveSync(base) {
  const email = newEmail('live');
  const { device: A, uid } = await newSignedInDevice('A-live', base, email);
  const { device: B } = await newSignedInDevice('B-live', base, email);
  check('7. setup: two devices signed in as one account, page open on both', Boolean(uid));

  await inPage(A, base, 'setBuild', REAPER, BUILD_A);
  await inPage(A, base, 'setCrestSlots', REAPER, { blue: 1 });
  const wantBuilds = { [REAPER]: BUILD_A };
  const wantSlots = { [REAPER]: { blue: 1 } };
  check(
    '7a. A saved a Build and an opened slot; the cloud copy holds both, and no syncedUid',
    (await becomes(async () => (await cloudShows(uid, 'builds', wantBuilds)) && (await cloudShows(uid, 'crestSlots', wantSlots)))) && !('syncedUid' in ((await cloudDoc(uid))?.data || {})),
    JSON.stringify((await cloudDoc(uid))?.data)
  );
  check(
    '7b. B (page open) is handed both through onProgressChange, without a reload',
    await becomes(async () => (await probeShows(B, 'builds', wantBuilds)) && (await probeShows(B, 'crestSlots', wantSlots))),
    JSON.stringify(await seen(B))
  );
  check('7c. B stored both locally', (await storedShows(B, 'builds', wantBuilds)) && (await storedShows(B, 'crestSlots', wantSlots)), JSON.stringify(await storedChoices(B)));

  await B.reload();
  await B.waitFor(`document.body.innerText.includes('Signed in as')`, 'the Account page after the reload');
  await installProbe(B, base);
  check('7d. After a plain reload B still has them (local first)', (await storedShows(B, 'builds', wantBuilds)) && (await storedShows(B, 'crestSlots', wantSlots)));

  // The other direction, and "newer wins as a whole object" for a signed-in pair: B replaces the Build.
  const buildB = { red: [TOOLS[3]] };
  await inPage(B, base, 'setBuild', REAPER, buildB);
  await inPage(B, base, 'setCrestSlots', REAPER, { blue: 2, yellow: 1 });
  check(
    '7e. B changes the Build and the slots; A receives both, the new Build replacing the old one whole',
    await becomes(async () => (await probeShows(A, 'builds', { [REAPER]: buildB })) && (await probeShows(A, 'crestSlots', { [REAPER]: { blue: 2, yellow: 1 } }))),
    JSON.stringify(await seen(A))
  );
  await inPage(A, base, 'setBuild', REAPER, null);
  check('7f. A removes the Build; B receives the removal', await becomes(async () => (await probeShows(B, 'builds', {})) && (await storedShows(B, 'builds', {}))), JSON.stringify(await seen(B)));
  check(
    '7g. The cloud copy has no Build left but still has the opened slots',
    await becomes(async () => (await cloudShows(uid, 'builds', {})) && (await cloudShows(uid, 'crestSlots', { [REAPER]: { blue: 2, yellow: 1 } }))),
    JSON.stringify((await cloudDoc(uid))?.data)
  );
}

// 8 to 10. Two fresh devices each save choices while signed out; both then sign in as one account.
async function firstSignInUnion(base) {
  // Different Crests on the two devices (8), plus opened slots (10).
  {
    const email = newEmail('union-crests');
    const P = await newSignedOutDevice('P-crests', base);
    const Q = await newSignedOutDevice('Q-crests', base);
    await inPage(P, base, 'setBuild', REAPER, { red: [TOOLS[0]] });
    await inPage(P, base, 'setCrestSlots', REAPER, { blue: 1 });
    await sleep(60);
    await inPage(Q, base, 'setBuild', BEAST, { yellow: [TOOLS[2]] });
    await inPage(Q, base, 'setCrestSlots', BEAST, { red: 1 });
    await inPage(Q, base, 'setCrestSlots', REAPER, { blue: 2, white: 1 });

    const uid = await signInAndSettle(P, base, email);
    check(
      '8a. P signs in first: the (empty) cloud copy now holds P\'s Build and slots',
      await becomes(async () => (await cloudShows(uid, 'builds', { [REAPER]: { red: [TOOLS[0]] } })) && (await cloudShows(uid, 'crestSlots', { [REAPER]: { blue: 1 } }))),
      JSON.stringify((await cloudDoc(uid))?.data)
    );
    await signInAndSettle(Q, base, email);
    const wantBuilds = { [REAPER]: { red: [TOOLS[0]] }, [BEAST]: { yellow: [TOOLS[2]] } };
    const wantSlots = { [REAPER]: { blue: 2, white: 1 }, [BEAST]: { red: 1 } };
    check('8b. Q signs in second: Q keeps both Crests\' Builds (its own and the cloud\'s)', await becomes(() => storedShows(Q, 'builds', wantBuilds)), JSON.stringify((await storedChoices(Q)).builds));
    check('8c. The cloud copy holds both Crests\' Builds', await becomes(() => cloudShows(uid, 'builds', wantBuilds)), JSON.stringify((await cloudDoc(uid))?.data?.builds));
    check('8d. P (page open) receives both Builds without a reload', await becomes(() => probeShows(P, 'builds', wantBuilds)), JSON.stringify((await seen(P))?.builds));
    check(
      '10a. Opened slots take the larger number per Crest and colour (blue 1 vs 2 gives 2; white and the other Crest are kept), on Q',
      await becomes(() => storedShows(Q, 'crestSlots', wantSlots)),
      JSON.stringify((await storedChoices(Q)).crestSlots)
    );
    check('10b. ... in the cloud copy', await becomes(() => cloudShows(uid, 'crestSlots', wantSlots)), JSON.stringify((await cloudDoc(uid))?.data?.crestSlots));
    check('10c. ... and on P, with its page open', await becomes(() => probeShows(P, 'crestSlots', wantSlots)), JSON.stringify((await seen(P))?.crestSlots));
  }

  // The same Crest on both devices (9): the newer copy's Build is kept whole, never glued from both.
  // 9a, 9b: the device that signs in second has the newer Build.
  {
    const email = newEmail('union-same-newer');
    const P = await newSignedOutDevice('P-same', base);
    const Q = await newSignedOutDevice('Q-same', base);
    await inPage(P, base, 'setBuild', REAPER, { red: [TOOLS[0], TOOLS[1]] });
    await inPage(P, base, 'setCrestSlots', REAPER, { blue: 3 });
    await sleep(80);
    await inPage(Q, base, 'setBuild', REAPER, { blue: [TOOLS[2]] }); // later, so newer
    await inPage(Q, base, 'setCrestSlots', REAPER, { blue: 1, red: 1 });
    const uid = await signInAndSettle(P, base, email);
    await signInAndSettle(Q, base, email);
    const want = { [REAPER]: { blue: [TOOLS[2]] } }; // only Q's, not red and blue glued together
    check(
      '9a. Same Crest, the second device is newer: its Build is kept whole (on that device and in the cloud), not glued',
      await becomes(async () => (await storedShows(Q, 'builds', want)) && (await cloudShows(uid, 'builds', want))),
      `Q ${JSON.stringify((await storedChoices(Q)).builds)}; cloud ${JSON.stringify((await cloudDoc(uid))?.data?.builds)}`
    );
    check('9b. ... and the first device (page open) receives that Build', await becomes(() => probeShows(P, 'builds', want)), JSON.stringify((await seen(P))?.builds));
    check(
      '10d. Opened slots still take the larger number although the Build came from the newer side (blue 3 vs 1 gives 3, red 1 kept)',
      await becomes(() => cloudShows(uid, 'crestSlots', { [REAPER]: { blue: 3, red: 1 } })),
      JSON.stringify((await cloudDoc(uid))?.data?.crestSlots)
    );
  }

  // 9c: the device that signs in second has the OLDER Build, so the cloud copy's Build stays.
  {
    const email = newEmail('union-same-older');
    const R = await newSignedOutDevice('R-same', base);
    const S = await newSignedOutDevice('S-same', base);
    await inPage(R, base, 'setBuild', REAPER, { white: [TOOLS[4]] }); // earlier, so older
    await inPage(R, base, 'setCrestSlots', REAPER, { yellow: 2 });
    await sleep(80);
    await inPage(S, base, 'setBuild', REAPER, { red: [TOOLS[3]] });
    await inPage(S, base, 'setCrestSlots', REAPER, { yellow: 1 });
    const uid = await signInAndSettle(S, base, email);
    await signInAndSettle(R, base, email);
    const want = { [REAPER]: { red: [TOOLS[3]] } };
    check(
      '9c. Same Crest, the second device is older: the cloud copy\'s newer Build is kept whole, on that device and in the cloud',
      await becomes(async () => (await storedShows(R, 'builds', want)) && (await cloudShows(uid, 'builds', want))),
      `R ${JSON.stringify((await storedChoices(R)).builds)}; cloud ${JSON.stringify((await cloudDoc(uid))?.data?.builds)}`
    );
    check(
      '10e. The older device\'s larger slot number (yellow 2 vs 1) still wins',
      await becomes(async () => (await storedShows(R, 'crestSlots', { [REAPER]: { yellow: 2 } })) && (await cloudShows(uid, 'crestSlots', { [REAPER]: { yellow: 2 } }))),
      JSON.stringify((await cloudDoc(uid))?.data?.crestSlots)
    );
  }
}

// 11. An older page writes a document with only the four old keys. Done straight to the Emulator, as the
// signed-in user, so the rules judge it too.
async function olderPageSetup(base, tag) {
  const email = newEmail(tag);
  const { device: A, uid } = await newSignedInDevice(`A-${tag}`, base, email);
  const { device: B } = await newSignedInDevice(`B-${tag}`, base, email);
  await inPage(A, base, 'setBuild', REAPER, BUILD_A);
  await inPage(A, base, 'setCrestSlots', REAPER, { blue: 1 });
  await inPage(A, base, 'setDone', ENTRY_X, true);
  const wantBuilds = { [REAPER]: BUILD_A };
  const wantSlots = { [REAPER]: { blue: 1 } };
  await waitUntil(async () => (await cloudShows(uid, 'builds', wantBuilds)) && (await probeShows(B, 'builds', wantBuilds)), 'B to receive the Build');
  return { email, A, B, uid, wantBuilds, wantSlots };
}

async function olderPageNewerDoc(base) {
  const { email, A, B, uid, wantBuilds, wantSlots } = await olderPageSetup(base, 'older-newer');
  const token = await idTokenFor(email);
  await sleep(80);
  const status = await writeDocAsUser(uid, token, { done: { [ENTRY_Y]: true }, visited: {}, updatedAt: Date.now(), dataVersion: 1 });
  check('11a-1. The rules accept a four-key document from the signed-in user', status === 200, `HTTP ${status}`);
  check(
    '11a-2. Both devices adopt the document\'s ids (it is newer, so it wins as a whole object)',
    await becomes(async () => same((await storedChoices(A)).done, [ENTRY_Y]) && same((await storedChoices(B)).done, [ENTRY_Y])),
    `A ${JSON.stringify((await storedChoices(A)).done)}; B ${JSON.stringify((await storedChoices(B)).done)}`
  );
  check(
    '11a-3. Neither device lost its Build or opened slots (in localStorage and as handed to the page)',
    (await storedShows(A, 'builds', wantBuilds)) && (await storedShows(A, 'crestSlots', wantSlots)) && (await storedShows(B, 'builds', wantBuilds)) && (await storedShows(B, 'crestSlots', wantSlots)) && (await probeShows(A, 'builds', wantBuilds)) && (await probeShows(B, 'builds', wantBuilds)),
    `A ${JSON.stringify(await storedChoices(A))}; B ${JSON.stringify((await storedChoices(B)).builds)}`
  );
  console.log(`info  right after the older page's write the cloud copy has the keys ${JSON.stringify(Object.keys((await cloudDoc(uid))?.data || {}))} (nothing writes the choices back until the next change)`);
  await A.reload();
  await A.waitFor(`document.body.innerText.includes('Signed in as')`, 'the Account page after the reload');
  await sleep(2500);
  check('11a-4. After a reload A still has its Build and slots (local first, then the merge with the four-key document)', (await storedShows(A, 'builds', wantBuilds)) && (await storedShows(A, 'crestSlots', wantSlots)), JSON.stringify((await storedChoices(A)).builds));
  await inPage(B, base, 'setDone', ENTRY_X, true); // B's next change
  check(
    '11a-5. B\'s next change writes the Build and the slots back to the cloud copy',
    await becomes(async () => (await cloudShows(uid, 'builds', wantBuilds)) && (await cloudShows(uid, 'crestSlots', wantSlots))),
    JSON.stringify((await cloudDoc(uid))?.data)
  );
  check(
    '11a-6. ... together with the ids, and A (reloaded) still has the Build',
    same((await cloudDoc(uid))?.done, [ENTRY_X, ENTRY_Y].sort()) && (await storedShows(A, 'builds', wantBuilds)),
    JSON.stringify((await cloudDoc(uid))?.done)
  );
}

async function olderPageOlderDoc(base) {
  const { email, A, B, uid, wantBuilds, wantSlots } = await olderPageSetup(base, 'older-older');
  const token = await idTokenFor(email);
  const localStamp = (await A.storedProgress()).updatedAt;
  const status = await writeDocAsUser(uid, token, { done: { [ENTRY_Y]: true }, visited: {}, updatedAt: localStamp - 5000, dataVersion: 1 });
  check('11b-1. The rules accept it', status === 200, `HTTP ${status}`);
  check(
    '11b-2. The devices are newer, so they put their own copy back: the cloud copy has the Build and slots again with no further change',
    await becomes(async () => (await cloudShows(uid, 'builds', wantBuilds)) && (await cloudShows(uid, 'crestSlots', wantSlots))),
    JSON.stringify((await cloudDoc(uid))?.data)
  );
  check(
    '11b-3. Both devices kept their ids, Build and slots',
    same((await storedChoices(A)).done, [ENTRY_X]) && same((await storedChoices(B)).done, [ENTRY_X]) && (await storedShows(A, 'builds', wantBuilds)) && (await storedShows(B, 'builds', wantBuilds)) && (await storedShows(B, 'crestSlots', wantSlots)),
    `A ${JSON.stringify((await storedChoices(A)).done)}; B ${JSON.stringify((await storedChoices(B)).done)}`
  );
}

// 12. "Start a new run" with Builds on two devices.
async function newRun(base) {
  const email = newEmail('new-run');
  const { device: A, uid } = await newSignedInDevice('A-run', base, email);
  const { device: B } = await newSignedInDevice('B-run', base, email);
  await inPage(A, base, 'setBuild', REAPER, BUILD_A);
  await inPage(A, base, 'setBuild', BEAST, { yellow: [TOOLS[3]] });
  await inPage(A, base, 'setCrestSlots', REAPER, { blue: 1 });
  await inPage(A, base, 'setDone', ENTRY_X, true);
  const oldBuilds = { [REAPER]: BUILD_A, [BEAST]: { yellow: [TOOLS[3]] } };
  await waitUntil(async () => (await cloudShows(uid, 'builds', oldBuilds)) && (await probeShows(B, 'builds', oldBuilds)), 'the old run to reach the cloud and B');

  // "Start a new run" on A (the Account page's button asks for an export first; the function does not).
  await inPage(A, base, 'clearProgress');
  const stored = await storedChoices(A);
  check(
    '12a. A: "Start a new run" clears the Builds and opened slots locally (stored as empty, not left absent)',
    same(stored.builds, {}) && same(stored.crestSlots, {}) && stored.done.length === 0,
    JSON.stringify(stored.raw)
  );
  check('12b. A: the cloud copy is deleted', await becomes(async () => (await cloudDoc(uid)) === null));
  await sleep(1500);
  check(
    '12c. B (another device) keeps the old run for now (contract section 3: a new run does not clear every device)',
    (await storedShows(B, 'builds', oldBuilds)) && (await probeShows(B, 'builds', oldBuilds)),
    JSON.stringify((await storedChoices(B)).builds)
  );

  await A.reload();
  await A.waitFor(`document.body.innerText.includes('Signed in as')`, 'the Account page after the reload');
  await installProbe(A, base);
  await sleep(3000);
  check(
    '12d. After a reload A is still empty and nothing came back into the cloud',
    (await storedShows(A, 'builds', {})) && (await storedShows(A, 'crestSlots', {})) && (await cloudDoc(uid)) === null,
    JSON.stringify((await storedChoices(A)).raw)
  );

  await inPage(A, base, 'setDone', ENTRY_Y, true); // A's next change
  check(
    '12e. A\'s next change writes the new run to the cloud: no Builds, no slots',
    await becomes(async () => (await cloudShows(uid, 'builds', {})) && (await cloudShows(uid, 'crestSlots', {})) && same((await cloudDoc(uid))?.done, [ENTRY_Y])),
    JSON.stringify((await cloudDoc(uid))?.data)
  );
  check(
    '12f. ... and B then receives it: its old Builds, slots and ids are gone',
    await becomes(async () => (await storedShows(B, 'builds', {})) && (await storedShows(B, 'crestSlots', {})) && same((await storedChoices(B)).done, [ENTRY_Y]) && (await probeShows(B, 'builds', {}))),
    JSON.stringify((await storedChoices(B)).raw)
  );

  // An OLDER cloud copy that still has Builds (a stale write): it must not come back.
  const token = await idTokenFor(email);
  const stamp = (await A.storedProgress()).updatedAt;
  const status = await writeDocAsUser(uid, token, { done: { [ENTRY_X]: true }, visited: {}, updatedAt: stamp - 20000, dataVersion: 1, builds: oldBuilds, crestSlots: { [REAPER]: { blue: 1 } } });
  check('12g. The rules accept the stale document with Builds', status === 200, `HTTP ${status}`);
  check(
    '12h. A is newer, so it overwrites the stale copy: the cloud copy ends empty again',
    await becomes(async () => (await cloudShows(uid, 'builds', {})) && (await cloudShows(uid, 'crestSlots', {})) && same((await cloudDoc(uid))?.done, [ENTRY_Y])),
    JSON.stringify((await cloudDoc(uid))?.data)
  );
  await sleep(1500);
  check(
    '12i. Neither A nor B got the old Builds back',
    (await storedShows(A, 'builds', {})) && (await storedShows(B, 'builds', {})) && (await storedShows(A, 'crestSlots', {})) && (await storedShows(B, 'crestSlots', {})),
    `A ${JSON.stringify((await storedChoices(A)).builds)}; B ${JSON.stringify((await storedChoices(B)).builds)}`
  );
}

// 13. Export, import, and the import's "add, never replace" rule, with the result reaching the cloud.
async function exportImport(base) {
  // A signed-in device with choices; its backup file.
  const email = newEmail('backup');
  const { device: E, uid } = await newSignedInDevice('E-backup', base, email);
  await inPage(E, base, 'setBuild', REAPER, BUILD_A);
  await inPage(E, base, 'setBuild', BEAST, { yellow: [TOOLS[3]] });
  await inPage(E, base, 'setCrestSlots', REAPER, { blue: 2 });
  await inPage(E, base, 'setCrestSlots', BEAST, { red: 1 });
  await inPage(E, base, 'setDone', ENTRY_X, true);
  const wantBuilds = { [REAPER]: BUILD_A, [BEAST]: { yellow: [TOOLS[3]] } };
  const wantSlots = { [REAPER]: { blue: 2 }, [BEAST]: { red: 1 } };
  const text = await E.eval(`import(${JSON.stringify(progressUrl(base))}).then((m) => m.exportProgress().text())`);
  let file;
  try {
    file = JSON.parse(text);
  } catch {
    file = null;
  }
  check(
    '13a. Export: the backup file holds the Builds, the opened slots and the ids, and no syncedUid',
    Boolean(file) && same(file.builds, wantBuilds) && same(file.crestSlots, wantSlots) && file.done?.[ENTRY_X] === true && !('syncedUid' in file),
    text.slice(0, 200)
  );

  // Import into a fresh, signed-out device.
  const importFile = (device, content) => device.eval(`import(${JSON.stringify(progressUrl(base))}).then((m) => m.importProgress(new File([${JSON.stringify(content)}], 'backup.json')))`);
  const F = await newSignedOutDevice('F-backup', base);
  F.expectSync = false;
  const result = await importFile(F, text);
  check('13b. Import into an empty device: the result counts what was added', same(result, { addedDone: 1, addedVisited: 1, addedSlots: 3, addedBuilds: 2 }), JSON.stringify(result));
  check('13c. ... and the device has the same Builds and opened slots', (await storedShows(F, 'builds', wantBuilds)) && (await storedShows(F, 'crestSlots', wantSlots)), JSON.stringify((await storedChoices(F)).raw));
  const again = await importFile(F, text);
  check('13d. Importing the same file again adds nothing', again.addedDone === 0 && again.addedSlots === 0 && again.addedBuilds === 0, JSON.stringify(again));

  // Import into a signed-in device that already has its own choices: add, never replace, and reach the cloud.
  const { device: G, uid: uid2 } = await newSignedInDevice('G-backup', base, newEmail('backup-signed-in'));
  await inPage(G, base, 'setBuild', REAPER, { white: [TOOLS[4]] });
  await inPage(G, base, 'setCrestSlots', REAPER, { blue: 5 });
  const merged = await importFile(G, text);
  const wantB2 = { [REAPER]: { white: [TOOLS[4]] }, [BEAST]: { yellow: [TOOLS[3]] } }; // its own Build kept; the other Crest added
  const wantS2 = { [REAPER]: { blue: 5 }, [BEAST]: { red: 1 } }; // the larger number kept; the other Crest added
  check(
    '13e. Import into a device with its own choices: its Build for the same Crest stays, the other Crest\'s Build is added, the larger slot number stays',
    (await storedShows(G, 'builds', wantB2)) && (await storedShows(G, 'crestSlots', wantS2)) && merged.addedBuilds === 1 && merged.addedSlots === 1,
    `${JSON.stringify(merged)}; ${JSON.stringify((await storedChoices(G)).raw)}`
  );
  check('13f. ... and the cloud copy of that signed-in account holds the result', await becomes(async () => (await cloudShows(uid2, 'builds', wantB2)) && (await cloudShows(uid2, 'crestSlots', wantS2))), JSON.stringify((await cloudDoc(uid2))?.data));
  check('13g. The first account\'s cloud copy is untouched by all this', (await cloudShows(uid, 'builds', wantBuilds)) && (await cloudShows(uid, 'crestSlots', wantSlots)));
}

async function runChoices(base) {
  await scenario('7. Builds and opened slots saved on A reach B live', () => liveSync(base));
  await scenario('8 to 10. First sign-in with choices saved on both devices', () => firstSignInUnion(base));
  await scenario('11a. An older page writes a newer four-key document', () => olderPageNewerDoc(base));
  await scenario('11b. An older page writes an older four-key document', () => olderPageOlderDoc(base));
  await scenario('12. "Start a new run"', () => newRun(base));
  await scenario('13. Export and import', () => exportImport(base));
}

// ------------------------------------------------------------------ the rehearsal

async function run() {
  if (!FIRESTORE_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST is not set. Run this inside: firebase emulators:exec --only auth,firestore --project demo-silksong-guide "node tools/sync-rehearsal.mjs"');
  }
  const base = await startSiteServer();
  console.log(`Site served at ${base}; Auth Emulator ${AUTH_HOST}; Firestore Emulator ${FIRESTORE_HOST}; project ${PROJECT_ID}`);
  console.log(`SDK source: ${sdkSourceNote()}`);
  if (SITE !== REPO) console.log(`SITE SERVED FROM A COPY, NOT THE REPOSITORY: ${SITE}`);

  const email = `rehearsal-${Date.now()}@example.test`;
  const A = await newDevice('A');
  const B = await newDevice('B');
  const C = await newDevice('C');

  // --- Setup: A and B sign in as the same account, each with an empty profile.
  await signInWithEmailLink(A, base, email);
  await signInWithEmailLink(B, base, email);
  const uid = await accountUid(email);
  check('setup: A and B signed in as the same account', Boolean(uid), `uid ${uid}`);

  // --- 1. A marks an entry; B shows it without a reload (watch listener), then after a reload.
  await openRegion(A, base);
  await openRegion(B, base);
  await toggle(A, ENTRY_X);
  check('1a. A marks an entry; A shows it done at once', await becomes(async () => (await A.pressed(ENTRY_X)) === 'true', 3000));
  check('1b. B shows it done without a reload (watch listener)', await becomes(async () => (await B.pressed(ENTRY_X)) === 'true'));
  check('1c. The cloud copy holds it', await becomes(async () => (await cloudDoc(uid))?.done.includes(ENTRY_X)), JSON.stringify((await cloudDoc(uid))?.done));

  // B is away (its page is closed, so nothing is listening). A marks a second entry. B comes back.
  await B.goto('about:blank');
  await toggle(A, ENTRY_Y);
  await waitUntil(async () => (await cloudDoc(uid))?.done.includes(ENTRY_Y), 'the second mark in the cloud copy');
  await openRegion(B, base);
  check(
    '1d. B shows both marks after coming back (reload path: local first, then the cloud merge)',
    await becomes(async () => (await B.pressed(ENTRY_X)) === 'true' && (await B.pressed(ENTRY_Y)) === 'true')
  );
  await B.reload();
  await revealEntries(B);
  check('1e. B still shows both marks after a plain reload', await becomes(async () => (await B.pressed(ENTRY_X)) === 'true' && (await B.pressed(ENTRY_Y)) === 'true'));

  // --- 2. B unmarks an entry; A (page still open) shows it undone.
  await toggle(B, ENTRY_X);
  check('2a. B unmarks it; B shows it undone', await becomes(async () => (await B.pressed(ENTRY_X)) === 'false', 3000));
  check('2b. A shows it undone without a reload', await becomes(async () => (await A.pressed(ENTRY_X)) === 'false'), `A sees ${await A.pressed(ENTRY_X)}`);
  check('2c. A keeps the other mark', (await A.pressed(ENTRY_Y)) === 'true');
  check('2d. The cloud copy no longer holds it', await becomes(async () => !(await cloudDoc(uid))?.done.includes(ENTRY_X)), JSON.stringify((await cloudDoc(uid))?.done));

  // --- 6 (while A is signed in). Sample mode must not write to the cloud.
  const cloudBeforeSample = JSON.stringify((await cloudDoc(uid))?.done);
  const realBeforeSample = JSON.stringify(await A.storedProgress());
  await openRegion(A, base, SAMPLE_REGION, '&data=sample');
  await toggle(A, SAMPLE_ENTRY);
  check('6a. Sample mode: the mark is kept on this device under the sample key', await becomes(async () => (await A.storedProgress(SAMPLE_PROGRESS_KEY))?.done?.[SAMPLE_ENTRY] === true, 3000));
  await sleep(3000); // a write, if there were one, would have landed by now
  const cloudAfterSample = await cloudDoc(uid);
  check('6b. Sample mode: nothing was written to the cloud copy', JSON.stringify(cloudAfterSample.done) === cloudBeforeSample && !cloudAfterSample.done.includes(SAMPLE_ENTRY), `cloud done ${JSON.stringify(cloudAfterSample.done)}`);
  check('6c. Sample mode: the real Progress key is untouched', JSON.stringify(await A.storedProgress()) === realBeforeSample);

  // --- 3. First sign-in union on a fresh profile.
  await openRegion(C, base);
  await toggle(C, ENTRY_X); // marked BEFORE signing in; the account holds only ENTRY_Y now
  await waitUntil(async () => (await C.storedProgress())?.done?.[ENTRY_X] === true, 'C to store its mark');
  await signInWithEmailLink(C, base, email);
  check(
    '3a. C shows the "Progress combined" plate with the right numbers',
    await becomes(async () => {
      const text = await C.eval(`(document.querySelector('.callout') || {}).innerText || ''`);
      return /Progress combined/.test(text) && /1 entry was done on this device and 1 in your account\. 2 are done now\./.test(text);
    }),
    JSON.stringify(await C.eval(`(document.querySelector('.callout') || {}).innerText || 'no plate'`))
  );
  const stored = await C.storedProgress();
  check('3b. C holds both marks locally', stored?.done?.[ENTRY_X] === true && stored?.done?.[ENTRY_Y] === true && stored?.syncedUid === uid, JSON.stringify(stored?.done));
  check('3c. The cloud copy holds both marks', await becomes(async () => JSON.stringify((await cloudDoc(uid))?.done) === JSON.stringify([ENTRY_X, ENTRY_Y].sort())), JSON.stringify((await cloudDoc(uid))?.done));
  await openRegion(A, base); // A is back on a real page (it was on the sample page)
  check('3d. A (signed in) receives the combined result', await becomes(async () => (await A.pressed(ENTRY_X)) === 'true' && (await A.pressed(ENTRY_Y)) === 'true'));

  // --- 4. Sign-out on A keeps A's Progress and clears syncedUid.
  const beforeSignOut = await A.storedProgress();
  await A.goto(`${base}/account.html?emulator`);
  await A.waitFor(`!!document.querySelector('button[data-action="sign-out"]')`, 'the sign-out button');
  await A.click('button[data-action="sign-out"]');
  await A.waitFor(`!!document.querySelector('form[data-action="send-link"]')`, 'the signed-out Account page');
  const afterSignOut = await A.storedProgress();
  check('4a. Sign-out keeps A\'s Progress on A', JSON.stringify(afterSignOut?.done) === JSON.stringify(beforeSignOut?.done) && Object.keys(afterSignOut?.done || {}).length === 2, JSON.stringify(afterSignOut?.done));
  check('4b. Sign-out clears syncedUid', beforeSignOut?.syncedUid === uid && afterSignOut && !('syncedUid' in afterSignOut), `before ${beforeSignOut?.syncedUid}, after ${afterSignOut?.syncedUid}`);
  check('4c. Sign-out leaves the cloud copy alone', (await cloudDoc(uid))?.done.length === 2);

  // --- 7 to 13. The player choices of ADR 0006 (added in P5-22).
  await runChoices(base);

  finalChecks();
}

// Check 5, over every device of the whole rehearsal (the choice checks add their own devices).
function finalChecks() {
  // --- 5. Sync state: reached "synced", never "error"; nothing left the local machine for a real project.
  for (const device of devices) {
    const synced = syncLineSeen(device, /Synced with your account/);
    const errored = syncLineSeen(device, /Could not sync|error/i);
    check(`5. Device ${device.name}: the sync line ${device.expectSync ? 'reached "synced" and ' : ''}never showed an error`, (synced || !device.expectSync) && !errored, [...device.syncTexts].filter((t) => /sync/i.test(t)).slice(0, 4).join(' | '));
  }
  const allHosts = new Set(devices.flatMap((device) => [...device.requestHosts]));
  const outside = [...allHosts].filter((host) => !/^(127\.0\.0\.1|localhost)(:|$)/.test(host) && host !== 'www.gstatic.com');
  check('5x. Every request went to the local site, the local Emulators or the pinned SDK on gstatic', outside.length === 0, `hosts: ${[...allHosts].join(', ')}`);
  const exceptions = devices.flatMap((device) => device.exceptions.map((text) => `${device.name}: ${text}`));
  check('5y. No uncaught exception on any device', exceptions.length === 0, exceptions.join(' | '));
  const errors = devices.flatMap((device) => device.consoleErrors.map((text) => `${device.name}: ${text}`));
  console.log(`info  console.error calls: ${errors.length}${errors.length ? ` (${errors.slice(0, 3).join(' | ')})` : ''}`);
}

async function main() {
  try {
    await run();
  } catch (error) {
    failures += 1;
    console.log(`FAIL  the rehearsal stopped early  (${error.message})`);
  } finally {
    for (const device of devices) await device.close();
    for (const child of children) child.kill('SIGKILL');
    for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  }
  console.log(failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

process.on('SIGINT', () => process.exit(130));
main();
