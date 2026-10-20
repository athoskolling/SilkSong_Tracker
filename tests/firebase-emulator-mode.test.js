// Tests for Emulator mode in js/firebase-emulator.js, used by js/firebase.js (docs/CONTRACTS.md section 4).
// The point: the flag only works on this computer. On any other host it is ignored,
// so a link to the published site with ?emulator added changes nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { emulatorModeFor, EMULATOR_PROJECT_ID } from '../js/firebase-emulator.js';

test('Emulator mode turns on for localhost and 127.0.0.1 with ?emulator', () => {
  for (const host of ['localhost', '127.0.0.1']) {
    const mode = emulatorModeFor(host, '?emulator');
    assert.ok(mode, host);
    assert.equal(mode.projectId, 'demo-silksong-guide');
    assert.equal(mode.projectId, EMULATOR_PROJECT_ID);
    assert.equal(mode.host, '127.0.0.1');
  }
});

test('the flag works next to the page query, in any position and with a value', () => {
  assert.ok(emulatorModeFor('localhost', '?id=moss-grotto&emulator'));
  assert.ok(emulatorModeFor('localhost', '?emulator&data=sample'));
  assert.ok(emulatorModeFor('127.0.0.1', '?emulator=1'));
});

test('Emulator mode is ignored on a non-local host, even with the flag', () => {
  const hosts = [
    'athoskolling.github.io',
    'silksong-tracker-90229.firebaseapp.com',
    'localhost.example.com', // starts like localhost, is not
    'example.com',
    '127.0.0.1.example.com',
    '192.168.0.10', // another computer on the network
    '0.0.0.0',
    '[::1]',
    '',
    undefined,
  ];
  for (const host of hosts) {
    assert.equal(emulatorModeFor(host, '?emulator'), null, String(host));
    assert.equal(emulatorModeFor(host, '?id=x&emulator&data=sample'), null, String(host));
  }
});

test('a local host without the flag stays on the real project', () => {
  assert.equal(emulatorModeFor('localhost', ''), null);
  assert.equal(emulatorModeFor('localhost', '?data=sample'), null);
  assert.equal(emulatorModeFor('127.0.0.1', '?emulators=1'), null);
  assert.equal(emulatorModeFor('localhost', undefined), null);
});
