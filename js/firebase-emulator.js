// Emulator mode, decided from the page address alone (docs/CONTRACTS.md section 4).
// Kept apart from firebase.js so it can be unit-tested without the SDK, and so firebase.js
// exports only the functions the contract lists. Only firebase.js imports this file.
//
// Why it exists: a script can rehearse two-device sync against the local Firebase Emulators
// before anyone tests on the real site. It must never be possible to point a real visitor
// at an address of someone else's choosing, hence the host guard below.

// Starts with "demo-" so the Emulator refuses to talk to any real project.
export const EMULATOR_PROJECT_ID = 'demo-silksong-guide';
const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_AUTH_PORT = 9099; // same ports as firebase.json
const EMULATOR_FIRESTORE_PORT = 8080;
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

// Pure: decides from the page address alone. Two conditions, both required:
// the host is this computer AND the address has ?emulator. The host check is the
// real guard: a link to the published site with ?emulator added must change nothing,
// or anyone could point a visitor's Progress at an address of their choosing.
// Exact comparison, so "localhost.example.com" does not pass.
export function emulatorModeFor(hostname, search) {
  if (!LOCAL_HOSTNAMES.includes(hostname)) return null;
  if (!new URLSearchParams(search || '').has('emulator')) return null;
  return {
    projectId: EMULATOR_PROJECT_ID,
    host: EMULATOR_HOST,
    authPort: EMULATOR_AUTH_PORT,
    firestorePort: EMULATOR_FIRESTORE_PORT,
  };
}

