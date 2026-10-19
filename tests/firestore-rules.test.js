// Tests for firestore.rules, run against the local Firebase Emulator only.
//
// Run with (the demo- project id makes the Emulator refuse to reach any real project):
//   firebase emulators:exec --only firestore --project demo-silksong-guide "node --test tests/firestore-rules.test.js"
// Without FIRESTORE_EMULATOR_HOST (set by emulators:exec) the whole file is skipped,
// so `node --test tests/` still passes with no Emulator running.
//
// No dependency: plain fetch against the Emulator's REST API.

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const HOST = process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT = 'demo-silksong-guide';
const SKIP = HOST
  ? false
  : 'FIRESTORE_EMULATOR_HOST is not set: start the Emulator with "firebase emulators:exec" (see the top of this file) to run the rules tests.';

const DOCS = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;
const RESET = `http://${HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`;

// ---------------------------------------------------------------------------
// Fake users
// ---------------------------------------------------------------------------

// The Emulator accepts unsigned ID tokens (alg "none") and reads the uid from them.
// That is safe because it exists only in the Emulator: the real Firebase service
// verifies the signature and would reject these tokens, and the demo- project id
// keeps this test away from any real project.
function base64url(object) {
  return Buffer.from(JSON.stringify(object)).toString('base64url');
}

function tokenFor(uid) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: 'none', typ: 'JWT' });
  const payload = base64url({
    iss: `https://securetoken.google.com/${PROJECT}`,
    aud: PROJECT,
    sub: uid,
    user_id: uid,
    iat: now,
    exp: now + 3600,
    firebase: { identities: {}, sign_in_provider: 'custom' },
  });
  return `${header}.${payload}.`; // empty signature
}

// ---------------------------------------------------------------------------
// REST helpers. `as` is a uid, null for signed out, or 'admin' to bypass the rules.
// ---------------------------------------------------------------------------

// Firestore REST wants typed values. These build the few types we need.
const int = (n) => ({ integerValue: String(n) });
const bool = (b) => ({ booleanValue: b });
const str = (s) => ({ stringValue: s });
const dbl = (n) => ({ doubleValue: n });
const map = (obj) => ({ mapValue: { fields: obj } });

// Same shape as the body that writeProgressDoc builds in js/firebase.js:
//   { done: {...}, visited: {...}, updatedAt: <ms>, dataVersion: <integer> }
// (progress.js sends it through forCloud(), so syncedUid is never in it).
function progressFields(overrides = {}) {
  return {
    done: map({ 'example-entry': bool(true) }),
    visited: map({ 'deep-docks': bool(true) }),
    updatedAt: int(1760000000000),
    dataVersion: int(1),
    ...overrides,
  };
}

async function call(method, path, { as = null, fields } = {}) {
  const headers = {};
  if (as === 'admin') headers.Authorization = 'Bearer owner'; // the Emulator's rules bypass, for seeding only
  else if (as) headers.Authorization = `Bearer ${tokenFor(as)}`;
  const options = { method, headers };
  if (fields) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({ fields });
  }
  const response = await fetch(`${DOCS}/${path}`, options);
  return { status: response.status, body: await response.json().catch(() => null) };
}

const allowed = (result) => assert.equal(result.status, 200, JSON.stringify(result.body));
const refused = (result) => {
  assert.equal(result.status, 403, JSON.stringify(result.body));
  assert.equal(result.body.error.status, 'PERMISSION_DENIED');
};

// Seeds a document without going through the rules.
async function seed(path, fields = progressFields()) {
  allowed(await call('PATCH', path, { as: 'admin', fields }));
}

// ---------------------------------------------------------------------------

describe('firestore.rules', { skip: SKIP }, () => {
  // Each test starts from an empty database.
  beforeEach(async () => {
    const response = await fetch(RESET, { method: 'DELETE' });
    assert.equal(response.status, 200, 'could not reset the Emulator');
  });

  describe('(a) a user and their own document', () => {
    test('creates, reads, updates and deletes it', async () => {
      const path = 'silksong_progress/alice';

      allowed(await call('PATCH', path, { as: 'alice', fields: progressFields() })); // create

      const read = await call('GET', path, { as: 'alice' });
      allowed(read);
      assert.equal(read.body.fields.dataVersion.integerValue, '1');

      const changed = progressFields({ updatedAt: int(1760000005000), done: map({}) });
      allowed(await call('PATCH', path, { as: 'alice', fields: changed })); // update (unmarking an id)

      allowed(await call('DELETE', path, { as: 'alice' })); // "Start a new run"
      assert.equal((await call('GET', path, { as: 'alice' })).status, 404);
    });

    test('an empty Progress (all maps empty, version 0) is accepted', async () => {
      const empty = progressFields({ done: map({}), visited: map({}), updatedAt: int(0), dataVersion: int(0) });
      allowed(await call('PATCH', 'silksong_progress/alice', { as: 'alice', fields: empty }));
    });
  });

  describe("(b) another user's document", () => {
    beforeEach(() => seed('silksong_progress/alice'));

    test('read is refused', async () => {
      refused(await call('GET', 'silksong_progress/alice', { as: 'bob' }));
    });

    test('update is refused', async () => {
      refused(await call('PATCH', 'silksong_progress/alice', { as: 'bob', fields: progressFields() }));
    });

    test('create under their uid is refused', async () => {
      refused(await call('PATCH', 'silksong_progress/carol', { as: 'bob', fields: progressFields() }));
    });

    test('delete is refused, and the document is still there', async () => {
      refused(await call('DELETE', 'silksong_progress/alice', { as: 'bob' }));
      allowed(await call('GET', 'silksong_progress/alice', { as: 'alice' }));
    });
  });

  describe('(c) signed out', () => {
    beforeEach(() => seed('silksong_progress/alice'));

    test('read is refused', async () => {
      refused(await call('GET', 'silksong_progress/alice'));
    });

    test('create is refused', async () => {
      refused(await call('PATCH', 'silksong_progress/dave', { fields: progressFields() }));
    });

    test('update is refused', async () => {
      refused(await call('PATCH', 'silksong_progress/alice', { fields: progressFields() }));
    });

    test('delete is refused', async () => {
      refused(await call('DELETE', 'silksong_progress/alice'));
    });

    test('list is refused', async () => {
      refused(await call('GET', 'silksong_progress'));
    });
  });

  describe('(d) any other collection or path', () => {
    test('another collection is refused for a signed-in user, even under their own uid', async () => {
      refused(await call('PATCH', 'users/alice', { as: 'alice', fields: progressFields() }));
      refused(await call('GET', 'users/alice', { as: 'alice' }));
      refused(await call('PATCH', 'hollow_progress/alice', { as: 'alice', fields: progressFields() }));
    });

    test('a collection whose name only starts like ours is refused', async () => {
      refused(await call('PATCH', 'silksong_progress_old/alice', { as: 'alice', fields: progressFields() }));
    });

    test('a subcollection under their own document is refused', async () => {
      refused(await call('PATCH', 'silksong_progress/alice/notes/one', { as: 'alice', fields: progressFields() }));
      refused(await call('GET', 'silksong_progress/alice/notes/one', { as: 'alice' }));
    });

    test('another collection is refused when signed out', async () => {
      refused(await call('GET', 'users/alice'));
    });
  });

  describe('(e) listing the collection', () => {
    test('is refused for a signed-in user, even when their own document exists', async () => {
      await seed('silksong_progress/alice');
      refused(await call('GET', 'silksong_progress', { as: 'alice' }));
    });
  });

  describe('(f) the shape check on create and update', () => {
    const path = 'silksong_progress/alice';

    test('syncedUid is refused (it never leaves the device)', async () => {
      refused(await call('PATCH', path, { as: 'alice', fields: progressFields({ syncedUid: str('alice') }) }));
    });

    test('any extra key is refused', async () => {
      refused(await call('PATCH', path, { as: 'alice', fields: progressFields({ extra: bool(true) }) }));
    });

    test('a missing key is refused', async () => {
      for (const key of ['done', 'visited', 'updatedAt', 'dataVersion']) {
        const fields = progressFields();
        delete fields[key];
        refused(await call('PATCH', path, { as: 'alice', fields }));
      }
    });

    test('wrong types are refused', async () => {
      const wrong = [
        { done: str('nope') },
        { done: { arrayValue: { values: [] } } },
        { visited: bool(true) },
        { updatedAt: str('1760000000000') },
        { dataVersion: str('1') },
        { dataVersion: dbl(1.5) },
      ];
      for (const override of wrong) {
        refused(await call('PATCH', path, { as: 'alice', fields: progressFields(override) }));
      }
    });

    test('an update that breaks the shape is refused and leaves the old copy', async () => {
      await seed(path);
      refused(await call('PATCH', path, { as: 'alice', fields: progressFields({ syncedUid: str('alice') }) }));
      const read = await call('GET', path, { as: 'alice' });
      assert.equal(read.body.fields.updatedAt.integerValue, '1760000000000');
      assert.equal(read.body.fields.syncedUid, undefined);
    });
  });

  describe('(g) the body writeProgressDoc builds', () => {
    test('is accepted', async () => {
      // Mirrors js/firebase.js writeProgressDoc, which sends exactly:
      //   { done: progress.done || {}, visited: progress.visited || {},
      //     updatedAt: progress.updatedAt, dataVersion: progress.dataVersion }
      // progress.js normalizes Progress before every write, so updatedAt is a number
      // (Date.now(), or 0 for an empty Progress) and dataVersion an integer (0 until
      // configureProgress supplies the real one). Ids marked true only.
      const body = {
        done: map({ 'silk-spear': bool(true), 'mask-shard-1': bool(true) }),
        visited: map({ mosshome: bool(true) }),
        updatedAt: int(Date.now()),
        dataVersion: int(1),
      };
      allowed(await call('PATCH', 'silksong_progress/alice', { as: 'alice', fields: body }));
    });
  });
});
