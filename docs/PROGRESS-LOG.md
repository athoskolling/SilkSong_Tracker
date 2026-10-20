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

- **New session; Athos chose to finish Phase 1.** Emulator tools are now installed (Firebase CLI 15.34.0, Java 21), so the rules task is unblocked.
- **Docs brought up to date** (orchestrator): `requirements.js` is Dev A's (delegated by Athos) in `AGENT-PLAN.md`, `STRUCTURE.md` and the agent files; contract summary in `AGENT-PLAN.md` section 4 updated; `firebase/` (Athos's copy of the published rules) added to the owner table, `firestore.rules` at the root is the repository's ruleset; rules tests run only in the Emulator under the `demo-silksong-guide` project id, and skip in `node --test tests/`; README status; steps to finish Phase 1 in `docs/PHASE-1-SLICE.md`. Merged `dev-a/*` branches deleted.

- **T8 merged** (`dev-a/firestore-rules`): `firestore.rules`, `firebase.json` and `tests/firestore-rules.test.js`. A user can get, create, update and delete only `silksong_progress/{their uid}`; no listing; writes must have exactly `done`, `visited`, `updatedAt`, `dataVersion` (so `syncedUid` never reaches the cloud); everything else denied. Orchestrator ran both after merging: 88 tests pass without the Emulator (rules file skipped), 22 rules tests pass in the Emulator. Dev A also checked the tests fail against a weakened copy of the rules. Not deployed: Athos publishes.

- **Pushed** to GitHub at Athos's request. **Athos published `firestore.rules`.**
- **Athos reported** the main page as plain white and Account and sync not working. Orchestrator checked: no `index.html` (Pages shows the README) and `account.html` does not exist (404); sign-in lived only on `tools/auth-check.html`. Firebase side fine from outside: database exists, `athoskolling.github.io` authorized, SDK 12.19.0 loads, the Region page has no console errors. Also found: `main.js` does not call `completeEmailLinkSignIn` on every load, as the contract says.
- **T9 started** (`dev-a/slice-pages`, dev-a acting as Dev B): temporary `index.html` to the first Region, the sign-in part of `account.html`, Route link hidden until Phase 2. Sync symptoms asked from Athos.

- **T9 merged** (`dev-a/slice-pages`): temporary `index.html` (opens the Region with the lowest `order`; fallback link for no JavaScript), `account.html` with the sign-in half (Google, email link, signed-in state, sync line, "Progress combined"; GitHub hidden), `completeEmailLinkSignIn` on every page, Route link hidden until Phase 2. Orchestrator checked after merging: 88 tests pass; `/`, `/account.html`, the Region page and "Region not found" load with no console errors and no link to a missing page. Not checked by an agent: real Google sign-in, the email link, sync against live Firestore.

- **Athos: the orchestrator pushes whenever there is something new**, no need to ask (recorded in `docs/AGENT-PLAN.md` section 6). Exception kept: unconfirmed data facts are not published.

- **Push without a prompt** (Athos): `.claude/settings.json` now allows `git push origin main` and plain `git push`; force pushes are denied in any argument order, including `+branch` refspecs. Athos on the published slice: he loves how the site looks and feels.

## Open

- Sync between devices cannot work until Athos publishes `firestore.rules` (T8, merged; published rules still deny everything). Then the two-device check.
- Phase 2 questions from T4: fonts from Google versus self-hosted; where to show an entry's `source` link; footer credit wording; four decorative borders below 3:1 contrast.
- Phase 2 (Dev B): on the Account page at 390 px the start thread runs over the intro's second line. Account page still lacks backup, new run, how saving works, guide data and its hero art. `progress.js` loads the Firebase SDK on every page, even the redirecting `index.html` (harmless; a lazy start would be cheaper).
