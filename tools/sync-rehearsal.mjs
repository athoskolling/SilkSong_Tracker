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

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'demo-silksong-guide';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROMIUM = process.env.CHROMIUM || '/usr/bin/chromium';
const PROGRESS_KEY = 'silksong-guide:progress:v1';
const SAMPLE_PROGRESS_KEY = 'silksong-guide:progress:sample:v1';

const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

// Real entries used for the checks. Both belong to Region moss-grotto (data/items.json).
// The script only needs two ids that exist; their meaning does not matter here.
const REGION_ID = 'moss-grotto';
const ENTRY_X = 'moss-mother';
const ENTRY_Y = 'silk-spear';
const SAMPLE_REGION = 'sample-region-a';
const SAMPLE_ENTRY = 'sample-ability';

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

// ------------------------------------------------------------------ site server

const children = []; // every process we start, stopped in the finally block
const devices = [];
const tempDirs = [];

async function startSiteServer() {
  const port = await freePort();
  const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', REPO], {
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
    } else if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
      this.consoleErrors.push(params.args.map((arg) => arg.value || arg.description || '').join(' '));
    } else if (method === 'Network.requestWillBeSent') {
      try {
        this.requestHosts.add(new URL(params.request.url).host);
      } catch {
        // data: and blob: URLs have no host; nothing to record
      }
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
  return { done: ids('done'), visited: ids('visited'), raw: doc };
}

// Signs a device in through the real form on the Account page, then follows the emailed link.
async function signInWithEmailLink(device, base, email) {
  await device.goto(`${base}/account.html?emulator`);
  await device.waitFor(`!!document.querySelector('form[data-action="send-link"]')`, 'the email form');

  const before = new Set((await oobCodes()).map((entry) => entry.oobCode));
  await device.eval(`(() => {
    const form = document.querySelector('form[data-action="send-link"]');
    form.elements.email.value = ${JSON.stringify(email)};
    form.requestSubmit();
  })()`);
  await device.waitFor(`document.body.innerText.includes('We sent a sign-in link')`, 'the "link sent" message');

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

// ------------------------------------------------------------------ the rehearsal

async function run() {
  if (!FIRESTORE_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST is not set. Run this inside: firebase emulators:exec --only auth,firestore --project demo-silksong-guide "node tools/sync-rehearsal.mjs"');
  }
  const base = await startSiteServer();
  console.log(`Site served at ${base}; Auth Emulator ${AUTH_HOST}; Firestore Emulator ${FIRESTORE_HOST}; project ${PROJECT_ID}`);

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

  // --- 5. Sync state: reached "synced", never "error"; nothing left the local machine for a real project.
  for (const device of devices) {
    const synced = syncLineSeen(device, /Synced with your account/);
    const errored = syncLineSeen(device, /Could not sync|error/i);
    check(`5. Device ${device.name}: the sync line reached "synced" and never showed an error`, synced && !errored, [...device.syncTexts].filter((t) => /sync/i.test(t)).slice(0, 4).join(' | '));
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
