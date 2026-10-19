---
paths:
  - "js/progress.js"
  - "js/firebase.js"
  - "js/firebase-config.js"
  - "firestore.rules"
  - "firebase.json"
---

# Rules for Progress, sign-in and Firestore

- **Local first** (ADR 0001): every change is written to localStorage first; the cloud copy follows when signed in. A cloud failure never loses or blocks local data.
- **First sign-in merges by union** (anything marked in either stays marked); afterwards the most recent `updatedAt` wins. `mergeLocalAndCloud` is a pure function with unit tests.
- **Import adds, never removes** (confirmed by Athos, Phase 0).
- **First sign-in is per device:** local Progress keeps `syncedUid`; a different or missing one means union; signing out clears it (`docs/CONTRACTS.md` section 3).
- **The Firebase SDK** loads from gstatic at one pinned version, imported only by `js/firebase.js`; if it fails to load, the site still works locally.
- **One document per user:** `silksong_progress/{uid}`. The rules let a user read and write only their own document and nothing else in the Silksong collection.
- **Own Firebase project** (ADR 0004, replaces 0002): `silksong-tracker-90229` belongs to this site alone, so `firestore.rules` is written from scratch and denies everything except `silksong_progress/{uid}` for its own user. Test with the Firebase Emulator that (a) each user reaches only their own document, (b) another user's document is refused, (c) signed-out access is refused and (d) any other path is refused.
- **Never deploy.** Do not run `firebase deploy` and do not publish rules. Athos deploys, after the Emulator tests pass.
- No secrets in the repository. The Firebase web config is not a secret and lives only in `js/firebase-config.js`; the rules are what protect the data.
- Progress stores ids only, never game text. Ids that no longer exist in `data/` are ignored by the interface and kept in storage.
