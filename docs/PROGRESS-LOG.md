# Progress log

The orchestrator adds an entry after every task, merge and decision, newest last. The tutor agent reads this first. Short entries; details are in the commits and the docs they point to.

## 2026-10-19

- **Phase 0 done on the orchestrator's side.** Contracts approved by Athos (`docs/CONTRACTS.md`).
- **Phase 1 started** (vertical slice: one Region, two entries, local Progress, Region page, real sign-in, sync).
- **Firebase is the site's own project**, not Hollow-Thingy's (Athos). ADR 0004 replaces ADR 0002. Rules are written from scratch.
- **Checklist:** Firestore rules copy received (item 5), web config received and Google and email link enabled, GitHub sign-in not enabled (item 6), authorized domain added (item 3), repository pushed and Pages on at https://athoskolling.github.io/SilkSong_Tracker/ (items 1 and 2).
- **T1 merged** (`dev-a/progress-local`): Progress saved in the browser, merge function, backup download and add. 26 tests.
- **T2 merged** (`dev-a/firebase`): `js/firebase.js`, `js/firebase-config.js`, test page `tools/auth-check.html`. Firebase SDK 12.19.0 from gstatic.
- **Contract additions approved by Athos:** `configureProgress` and `watchProgressDoc(..., onError)`.
- **T3 merged** (`dev-a/progress-cloud`): sync with the account. `loadProgress` never waits for the network. 55 tests.
- **T4 merged** (`dev-a/region-page`, dev-a acting as Dev B): the Region page, `region.html`. Works with `?data=sample`; needs `js/requirements.js` and real `data/` to run normally.
- **Athos delegated `js/requirements.js` to dev-a** (he reviews it) and asked the orchestrator to research the slice. The main wiki blocks automated reading (HTTP 403), so the slice facts come from Fextralife pages read one by one, to be confirmed by Athos in game or in his browser (`docs/PHASE-1-SLICE.md`).
- **Tutor agent added** (`.claude/agents/tutor.md`), read-only, explains the project in simple words.
- **T6 merged locally** (`dev-a/slice-data`): `data/` now holds the slice (Moss Grotto, Moss Mother, Silkspear). **Not pushed**: ids become permanent once published, so `main` stays local until Athos confirms the three facts in `docs/PHASE-1-SLICE.md`.
- **T5 merged locally** (`dev-a/requirements`): `js/requirements.js` (all seven contract functions) and 33 tests; 88 tests pass. Checked on the real slice data: Silkspear is not Available until Moss Mother is done, then it is. Decision: a cycle that runs through an entry already done does not throw (a done entry is never walked); the validator (rule 4) still rejects any cycle in the data.
- **Phase 1 status:** marking unlocks and reload persistence are built. Left: Athos confirms the slice facts (then push), rules plus Emulator tests (needs the tools installed), Athos publishes the rules, sync test on two devices.
- **Athos confirmed:** the name is Silk Spear (id `silk-spear`, renamed before publishing) and Mosshome is part of Moss Grotto. The orchestrator searched the Mosshome question: the normal route needs Moss Mother first, so `silk-spear` keeps needing `moss-mother`.
- **T7 merged** (`dev-a/slice-data-fix`): rename and new texts. 88 tests pass. **Pushed**: the slice runs on GitHub Pages (local Progress only; sync waits for the rules).

## Open

- Emulator tools not installed (Firebase CLI and Java): blocks the rules task, so sync between devices cannot work yet (published rules deny everything).
- Phase 2 questions from T4: fonts from Google versus self-hosted; where to show an entry's `source` link; footer credit wording; four decorative borders below 3:1 contrast.
