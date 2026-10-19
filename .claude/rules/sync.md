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
- **Import adds, never removes** (assumption in `docs/CONTRACTS.md`; Athos can change it).
- **One document per user:** `silksong_progress/{uid}`. The rules let a user read and write only their own document and nothing else in the Silksong collection.
- **Shared Firebase project** (ADR 0002): a Firestore project has one ruleset, so `firestore.rules` must contain Hollow-Thingy's existing rules as well. Work only from the copy Athos provides (see `docs/PHASE-0-CHECKLIST.md`); if it is missing, stop and ask. Test with the Firebase Emulator that (a) each user reaches only their own Silksong document, (b) another user's document is refused, (c) signed-out access is refused and (d) Hollow-Thingy's own access paths still work.
- **Never deploy.** Do not run `firebase deploy` and do not publish rules. Athos deploys, after the Emulator tests pass.
- No secrets in the repository. The Firebase web config is not a secret and lives only in `js/firebase-config.js`; the rules are what protect the data.
- Progress stores ids only, never game text. Ids that no longer exist in `data/` are ignored by the interface and kept in storage.
