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

- **Athos: keep going, as fast as possible, review and test everything; dev-b may help where needed.** Read as the go for stage 2 (Phase 2), running alongside his two-device sync check, which still decides Phase 1.
- **Sample data widened** (orchestrator): two more invented Regions and seven entries, for the five Region card states, "Holding you up" and "Collectibles by type". Existing sample entries unchanged; 88 tests pass.
- **Structure:** `account.html` also loads `js/account-page.js` (contract section 5 and 7), so Account and Home/Route are built in parallel with one owner per file.

- **T11 merged** (`dev-a/account-backup`, dev-a acting as Dev B): Backup file (download, add with union), Start a new run with confirmation (Escape cancels, focus handled), How saving works, Guide data. Orchestrator checked: 88 tests pass, Account loads with no console errors at 1280 and 390 px, layout matches the design. Dev A drove download, add, reject and clear in a headless browser (29 checks). The `.account-column` meeting point with `render.js` recorded in contract section 5. **Not pushed yet**: its header links to `route.html`, which arrives with T10.

## 2026-10-20

- **T10 merged** (`dev-b/home-route`): Home (next on the route, what is holding you up, your thread with Collectibles by type, five Region card states) and Route (steps grouped by Region, filters, holding-you-up rail, spoiler counts, legend); Route link back; start thread no longer runs over the intro on short heroes or the Region page at 390 px. Shared pieces moved into `render.js`. Orchestrator checked after merging T10 on top of T11: 88 tests pass; Home, Route, Region and Account load with no console errors and no broken links, with real and sample data; Account still builds all four sections (the `account-column` meeting point holds). **Pushed** with T11.
- Decisions from T10 for Athos: the next step is shown on Route even in a Region not yet Visited; "Complete" means every entry done (Collectibles and Tasks); new copy for empty states. Contrast: all text passes AA; five decorative borders and tracks are below 3:1, with the information also carried by text.

- **T12 merged** (`qa-tests/validator`): `scripts/validate-data.js` (contract section 6, rules 1 to 10, plus shape checks now rule 11) and 171 tests (one todo: unknown ids inside `requires`). Orchestrator ran after merging on top of T10 and T11: 170 pass, 1 todo, 0 fail; validator passes on `data/` and `data/sample`. QA 1 also checked that the tests catch deliberate bugs (23 of 23 validator mutations, 20 of 22 logic mutations; the 2 survivors change nothing).
- **Athos agreed** with T10's three choices (Complete = every entry done; next step shown on Route; new copy) and with the "Source" link and footer credit line. Recorded in `docs/DESIGN.md`.
- **Decided (orchestrator):** unknown ids inside `requires` throw in every `requirements.js` function (contract sections 2 and 7).

- **T14 merged** (`dev-a/unknown-ids`): unknown ids inside `requires` throw in `isAvailable`, `nextStep`, `missingFor`, `missingForRegion`, `holdingYouUp`; also when the id is in doneSet. `isRegionAvailable` checks what it can without `items` (orchestrator kept the signature; contract section 2 says so). Orchestrator ran: 173 tests, 0 fail, 0 todo; validator passes on both folders. Pushed.

- **T15 merged** (`dev-b/attribution`): "Source" link at the end of every entry's meta line (also on the next plate and the Locked list; opens in a new tab, labelled per entry) and the approved data-source line in every footer. Orchestrator ran: 173 tests pass, validator passes; all pages show the credit line with no console errors; Source links appear only on entries that are shown (none for hidden entries). Pushed.
- Housekeeping: stopped four local web servers left by finished workers (T10, T11, T15, an earlier session). T15's worktree stays until its agent process ends (git keeps it locked).

- **T13 merged** (`qa-manual/checklist`): `qa/checklist.md` (140 lines; 18 for Athos, 4 blocked by checklist item 4) and `qa/reports/2026-10-19-first-pass.md` (run on 2d47b79, Region and Account re-run on 0d32c33): 0 critical, 3 major, 7 minor. Triage by the orchestrator:
  - Fixed already: F2 attribution (T15), start thread over the intro (T10).
  - To owners: F1 focus ring cut off at 390 px and F5 favicon (Dev B, T17); F4 sample mode uses the real Progress key and F6 email error without a next step (Dev A, T16, with a contract addition: `configureProgress({ sample })`).
  - Decided and recorded: F3 requirement names are shown on Locked pages (spoiler hiding covers a Region's own entries; STRUCTURE section 2); F7 phone order follows DESIGN text; F8 decorative contrast accepted; F9 plain gradient heroes; F10 "saved" as a verb is fine (GLOSSARY).
  - Raised with Athos: Google Fonts and privacy; `silk-spear`'s source is the Region page.

- **T16 merged** (`dev-a/sample-key`): with `configureProgress({ sample: true })` Progress uses `silksong-guide:progress:sample:v1` and the cloud half is stopped (listeners, in-flight reads and late sign-ins included); one-way per page session. Error messages in `firebase.js` now say what to do next. Orchestrator ran: 185 tests pass, 0 todo; validator passes. Takes effect once T17 passes the flag from `main.js`.

- **T17 merged** (`dev-b/qa-fixes`): focus ring drawn around the visible mark, so it is whole at 390 px (every Tab stop on all four pages measured by Dev B); `img/favicon.svg` from the logo mark on all pages; `main.js` passes `sample` to `configureProgress`; the sample Account page says sample mode never syncs. Orchestrator ran: 185 tests pass, validator passes, and an end-to-end browser check: marking on `?data=sample` writes only `silksong-guide:progress:sample:v1`, marking on real data only `silksong-guide:progress:v1`; no console errors. QA findings F1, F4, F5, F6 closed. Pushed.

- **T18 merged** (`qa-manual/second-pass`): whole site on 4fb3abd, 334 rows, 0 critical, 0 major, 4 minor; first-pass findings all closed; published site identical to `main` and clean; 185 tests and the validator pass. Triage:
  - G2-1 hero taller than 380 px at 390 px when the title wraps: accepted ("at least 380 px", DESIGN).
  - Next tasks, not started yet (usage limit): **T19 (Dev B)**: G2-2 strengthen the title scrim so the hero title passes 3:1 and the intro 4.5:1 over any picture; G2-3 name each Region once in "Blocks …" text (`blocksText`); G2-4 legend after the list on a phone. **T20 (Dev A)**: delete `tools/auth-check.html` (the Account page replaces it; Pages publishes `tools/`) and update the comment in `js/firebase.js` that points at it.
  - Then: orchestrator's Phase 2 review against the V1 definition of done.

- **T20 merged** (`dev-a/remove-auth-check`): `tools/auth-check.html` deleted (the Account page replaces it and Pages published it); the `SDK_VERSION` comment in `js/firebase.js` now points at `account.html`. Dev A's handoff came back empty ("Handoff placeholder"), so the orchestrator checked the branch itself: the diff, no reference left outside `docs/` and `qa/`, `tools/.gitkeep` present, 185 tests pass, validator passes. Pushed.

- **T19 merged** (`dev-b/second-pass-fixes`): a dark band behind hero text on Regions with a picture (two new derived tokens in `base.css`, no existing value changed), so the title stays at least 4.9:1 and the intro 5.2:1 even over a white picture; "Blocks …" names each Region once ("Blocks the region X and its 2 entries."); the Route legend is the last line of the list on every width. Orchestrator ran: 185 tests pass, validator passes on both folders, all pages clean, hero screenshots at 1280 and 390 px looked at (picture still reads). QA second-pass findings G2-2, G2-3, G2-4 closed. Pushed.

- **Phase 2 review** (orchestrator, against `docs/AGENT-PLAN.md` section 8, on cf5f2b0): passed: validator, `requirements.js` tests (185 in all), Progress without login and backup files, starts empty, Locked and spoiler behaviour, rules in the Emulator (22 of 22, re-run today), source and attribution, QA with no critical or major findings open. Not checked yet (Athos): sign-in and two-device sync, sign-in on the published domain. V1 content (batch 1, five Endings) waits on checklist items 4 and 8. Phase 2 code is done.

- **T21 merged** (`dev-b/self-host-fonts`): Gloock and Instrument Sans (variable) served from `css/fonts/` (127 KB of woff2, unmodified conversions of the `google/fonts` files at recorded commits, OFL texts beside them); Google Fonts links removed from every page. Orchestrator ran: 185 tests pass, validator passes; in a real browser every page contacts only the site and `www.gstatic.com` (the Firebase SDK), both fonts render, no 4xx. Recorded in `docs/DESIGN.md` section 4. Pushed.

- **Research for checklist items 4 and 8** (orchestrator, at Athos's request; findings only, boxes not ticked): `docs/research/2026-10-20-sources-and-batch-1.md`. hollowknight.wiki blocks automated reading (403), so Athos reads its license in a browser; Fextralife's terms forbid scraping and rewriting for publication, so it is not a drafting source (links are fine). Batch 1 order confirmed by the guides; open: Bone Bottom as a Region or a Sub-area.

- **Athos decided checklist item 4: option 1, no draft script.** Entries are written by Athos from his own play, checked against the main wiki by hand; agents never fetch hollowknight.wiki or Fextralife. **Item 8: batch 1 is Moss Grotto, The Marrow, Deep Docks; Bone Bottom is a Sub-area of Moss Grotto.** Both items ticked; the wiki's license name is still to be filled in by Athos. Recorded in STRUCTURE, AGENT-PLAN, PHASE-PROMPTS (Phase 3 rewritten), CLAUDE.md rule 9, `.claude/rules/data.md`, `dev-a.md`. New: `docs/PHASE-3-BATCH-1.md`, the form Athos writes batch 1 in. QA checklist lines N-13 to N-17 still say "blocked: item 4"; QA 2 updates them in its next task (wiki comparisons are Athos's, by hand).

- **Research for batch 1** (orchestrator, findings only): `docs/research/2026-10-20-collectibles-and-endings.md`. The game's completion list is wider than the glossary (adds Silk Hearts, Crafting Kit and Tool Pouch upgrades, Sylphsong, Everbloom); sources count **four** main Endings (five or six with hidden ones), while the plan says five. Both questions are for Athos.
- **T22 started** (`qa-manual/wiki-lines`): checklist lines N-13 to N-17 updated for item 4 (wiki comparisons by Athos, by hand).

- **T22 merged** (`qa-manual/wiki-lines`): checklist wiki lines follow item 4 (Athos compares with the main wiki by hand; QA 2 only records picks and runs exact-phrase web searches for copied text). Orchestrator's answers to QA 2's questions: **Q9** `step` is checked against the Route order (N-4), not the wiki; **Q11** no `source` field on Regions in V1, the QA report names the page used for each Region; **Q12** a batch with fewer than 5 entries is checked in full. **Q10** (the slice's two `source` links point at Fextralife) is Athos's: recommended to replace them with main wiki pages when he writes Moss Grotto in batch 1.

- **Athos decided:** Collectibles follow the game's own 100 percent list (adds Silk Hearts, Crafting Kit and Tool Pouch upgrades, Sylphsong, Everbloom to the glossary); V1 stores **four** Endings (the four main ones), replacing "five". Recorded in GLOSSARY, STRUCTURE, CONTRACTS section 1, `docs/PHASE-3-BATCH-1.md`. QA checklist line N-10 still says five: QA 2 updates it in its next task. Endings are written when the late-game entries they need exist.

- **Athos: V1 ships without Endings data** (option 1); the four Endings arrive with the late-game batch. Recorded in STRUCTURE (sections 2, 3, 5), CONTRACTS section 1, `docs/PHASE-3-BATCH-1.md`. T23 started (`qa-manual/endings-line`): checklist line N-10.

- **T23 merged** (`qa-manual/endings-line`): N-10 now checks that V1's `endings.json` is valid and empty; new N-18 (four Endings, conditions existing entries) for the late-game batch. Orchestrator decided QA 2's note c: on a Locked page a Task reads "Done", a Collectible "Collected" (DESIGN section 6). Notes a and b (data checks for the new Collectible rules; no total percentage shown) go into QA 2's batch 1 review.

- **Contract additions** (orchestrator, explained to Athos): validator rule 12 warns on Collectible types outside the approved list; Emulator mode in `firebase.js` (localhost and `?emulator` only, `demo-` project) so sync can be rehearsed end to end. Sample Collectible types moved to the approved list (ids unchanged). T24 (dev-a: Emulator mode and a two-profile sync rehearsal) and T25 (qa-tests: rule 12) started.

- **T25 merged** (`qa-tests/rule-12`): validator rule 12 warns on Collectible types outside the approved list and suggests the near miss ("Tool" -> "tool"). 27 new tests. QA 1 kept the rule that tests never read real `data/` (my brief asked for one; QA 1 was right) and checked real data from the command line. Orchestrator ran: 212 tests pass; validator passes on both folders with 0 warnings; a deliberate bad type in a scratch copy warned with rule 12 and exit 0. Pushed.

- **T24 merged** (`dev-a/emulator-sync`): Emulator mode (localhost or 127.0.0.1 plus `?emulator`, `demo-` project; guard in `js/firebase-emulator.js`, 4 tests) and `tools/sync-rehearsal.mjs`, which signs three browser profiles in by email link against the local Emulators and checks marking, live updates, unmarking, first-sign-in union with the "Progress combined" plate, sign-out, the sync line and sample mode. No bug found. Orchestrator re-ran everything: 216 tests, 22 rules tests, rehearsal 26 of 26, all requests local or the pinned SDK. Not proven by it: the real Google popup, real email delivery, the published domain and the deployed rules. Athos's two-device check stays the final word. Pushed.

- **Docs refreshed** (orchestrator): README status (site built, content next) and file table; STRUCTURE folder map (`firebase-emulator.js`, `tools/sync-rehearsal.mjs`; no CI, the validator runs after every merge). Nothing else can move without Athos: the two-device check, Moss Grotto for batch 1, the wiki's license name.

- **Athos approved a starting list per Region** (amends item 4: guides give names, kinds and places; Athos confirms or strikes each). Orchestrator prepared Moss Grotto's: `docs/research/2026-10-20-moss-grotto-candidates.md`. 12 Collectible candidates and 5 Tasks from three guides (game-checklists.com, Game8, TheGamer; no wiki or Fextralife opened). Open for Athos: Weavenest Atla and Bonegrave (Sub-areas or Regions), late and Act 3 items, the disputed Spool Fragment, the Wanderer Crest's requirement, the starting Crest.

- **Starting lists for The Marrow and Deep Docks** (orchestrator): `docs/research/2026-10-20-marrow-deep-docks-candidates.md`. The Marrow: 5 Collectible and 2 Task candidates; Deep Docks: 8 and 2 (sources: game-checklists.com and Into Indie Games). Questions for Athos: Swift Step's type (if movement abilities are not Ancestral Arts, the approved types need `ability`), the Region of Grindle's cell, Shakra's shop items, items reached from later areas. Batch 1's starting lists are complete.

- **Phase 3, batch 1 started with Moss Grotto** (Athos). First step is his: confirm or strike each line of `docs/research/2026-10-20-moss-grotto-candidates.md` and answer its three questions (Weavenest Atla, Bonegrave, late items), then write the confirmed entries in `docs/PHASE-3-BATCH-1.md`. No agent spawned yet; Dev A starts when Athos says Moss Grotto is ready. Asked again: are `firestore.rules` published?

- **Athos widened the batch: "do everything of the first act if possible, do whatever you want, we can fix later."** Read as: the orchestrator researches Act 1 facts itself (guides, one page at a time; never hollowknight.wiki or Fextralife), writes them in our words, and Dev A turns them into data. Guardrail kept: Act 1 data is merged locally but **not pushed** until Athos approves the id list (ids are permanent once published, ADR 0003).
- **Act 1 research** (orchestrator): `docs/PHASE-3-ACT-1.md`: 12 Regions, 61 entries (49 Collectibles, 12 Tasks) in Route order, and a deferred list (anything needing Clawline, Faydown Cloak, Silk Soar, the Citadel or Act 3). Decisions recorded there: Drifter's Cloak is a Task (it does not count); Needle Strike counts, type `ability`; wishes fold into their reward; conservative Region gates. Contract: rule 12 gains `ability`, `source` may point at the guide page read (section 7). GLOSSARY: Needle Strike named. `.claude/rules/data.md` points at the sheet.
- **T26 started** (`dev-a/act-1-data`): Act 1 into `data/*.json`. **T27 started** (`qa-tests/ability-type`): rule 12 accepts `ability`.

## Open

- Athos: are `firestore.rules` published to the Firebase project? (T8 merged; when last recorded the published rules still denied everything.) Then the two-device check on the real site, which closes Phase 1.
- Athos: approve the Act 1 id list before the data is pushed (T26); check a sample of entries against the main wiki and swap `source` links as he goes.
- Athos: the wiki's license name (checklist item 4) and hero images (item 9).
- `progress.js` loads the Firebase SDK on every page, even the redirecting `index.html` (harmless; a lazy start would be cheaper).
- Act 1 deferred entries (`docs/PHASE-3-ACT-1.md`, last section) wait for the batch that adds Clawline, Faydown Cloak, Silk Soar and the Citadel.
