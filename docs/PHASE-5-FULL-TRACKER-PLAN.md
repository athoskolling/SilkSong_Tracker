# Plan: a full tracker, modelled on Hollow-Thingy (2026-10-20)

**Why this exists.** Athos asked for "everything possible on the game", using Hollow-Thingy (his Hollow Knight companion, `athoskolling/Hollow-Thingy`, read only) as the base: Rosaries, Collectibles, Silk Hearts, abilities, equipment, Mementos and the things that let a player change build (Crests such as Hunter, Architect and so on). This widens the V1 scope in `docs/STRUCTURE.md` and the rule in `GLOSSARY.md` that the site only counts what the game counts toward 100 percent. **It changes contracts, so nothing below is built until Athos approves the open questions at the end.** Game facts below are not yet researched; every category's content comes from guide research like the Act 1 sheet, never from memory.

## What Hollow-Thingy has (read from its code, not run)

- **Screens:** dashboard, roadmap ("what do I do now"), regions and one page per region, trackers (tabs), boss guide, points of interest per region (benches, travel stops, vendors, NPCs), soundtrack, settings, checklist.
- **Trackers (tabs):** Geo (currency, with "next expenses" and farms), movement and spells, keys, nail and ore, relics, masks and vessels, charms, nail arts, essence.
- **Charm builds** (`js/builds.js`): synergies between charms (each with a wiki link), build templates, and a "best build with what you own" picker.
- **Extras:** a reader for the real PC save file, a save watcher, a boss guide with HP and attacks, backup and cloud sync.

## Silksong equivalents (names to be confirmed by research)

| Hollow-Thingy | Silksong tracker | Notes |
|---|---|---|
| Geo, next expenses, farms | **Rosaries** (and Shell Shards): a running amount, shop prices of what is still unbought, farm spots | A number, not an id: Progress must store numbers (contract change) |
| Charms, notches, builds | **Crests, Tools, Skills and slots**: owned Crests, which Tools each Crest suits, build templates (the Hunter and Architect style builds) | Silksong has no charms; builds are Crest plus Tools |
| Movement and spells | **Abilities, Ancestral Arts, Silk Skills** | partly in the data already (`ancestral-art`, `silk-skill`, `ability`) |
| Keys | **Simple Keys and key items** | `simple-key` exists as a Task |
| Masks and vessels | **Mask Shards and Spool Fragments** (already counted) | |
| Relics | **Mementos and other non-counted keepsakes** | Need a type; not counted toward 100 percent |
| Nail and ore | **Needle upgrades, Crafting Kit and Tool Pouch upgrades** | already counted |
| Boss guide, points of interest | **Bosses, benches, Bellway stops, vendors** | optional, later |
| Save reader | **Silksong save file import** | optional, last; needs a research spike on the save format |

## Proposed approach

1. **Keep the 100 percent counter exact.** Counted Collectibles stay as they are. New categories are *tracked* but shown under their own headings, so the headline number still matches the game.
2. **Data model, smallest change that works** (orchestrator to write into `docs/CONTRACTS.md` once Athos approves): add `counts` (default true for `collectible`) so a Memento or an equipment piece can be tracked without being counted; allow more `type` values per category (validator rule 12 gets a second list for non-counted types); keep Tasks as they are.
3. **Progress gets a small second block** for numbers: `{ rosaries, shellShards }` next to `done` and `visited`. Union merge does not work for numbers (ADR 0001 needs an addendum: newer value wins). This is the one contract change with real risk, so it comes with sync-rehearsal tests.
4. **New screens** (Dev B, from a new design pass; the finished design in `docs/design/` has none of them): a Trackers page with tabs, a Builds page, and the Rosaries panel with "next expenses". The Act 1 screens do not change.
5. **Content** (research sheets, then Dev C): Crests and Tools first (they carry the builds), then Mementos and equipment, then shops and prices for the Rosaries panel, then farms.
6. **Builds** last among the features, because they need the Tool and Crest data complete: synergy pairs with a source link each, templates marked editorial, and a picker that only uses what the player owns.

## Order of work (each step ends with validator, tests and a QA pass)

1. Athos answers the open questions below. Orchestrator writes the contract changes (counts flag, Progress numbers) and an ADR addendum.
2. In parallel: Dev A implements numbers in Progress plus validator and test updates (with QA 1); the orchestrator researches Crests, Tools and Skills into a sheet; Dev B starts a design pass for the Trackers page (needs Athos's review of mockups).
3. Dev C turns the Crest, Tool and Skill sheet into data; Dev B builds the Trackers page; QA 2 checks.
4. Mementos and equipment, then shops, prices and the Rosaries panel.
5. Builds.
6. Acts 2 and 3 data continues on its own track (sheets already being planned); the new categories get filled for those Acts as each batch is built.
7. Optional last: points of interest, boss notes, save file import.

## Open questions for Athos

1. **Counting:** are Mementos and equipment tracked-only (my proposal, so the 100 percent number stays true to the game)?
2. **Rosaries:** type in a number by hand, or tick "bought" on shop items so the total follows? (Hollow-Thingy does both for Geo.)
3. **Builds:** a fixed set of templates per Crest, or only a picker from what you own?
4. **Design:** should the new screens get a mockup round before code, as the first screens did?
5. **Save file import and soundtrack:** wanted, or out of scope?
6. **Order:** finish Acts 2 and 3 data first, or build the Trackers first? (My suggestion: trackers first, since they shape the data fields for every later entry.)

## Athos's answers and the contract changes (2026-10-20)

**Answers.** (1) Mementos and Equipment are tracked and **not** counted in the headline 100 percent number; each Tracker tab shows its own done and total. (2) Rosaries are **not** a typed number: the player ticks shop entries as bought, and the amount still to spend is worked out from the prices of the shop entries not bought. (3) Builds: a picker from what the player owns, no fixed templates. (4) New screens get mockups first (Dev B). (5) Save file import is in scope; the soundtrack is out. (6) Trackers come before Acts 2 and 3. **Hard rule:** every change is additive and backward compatible. Home, Region, Route and Account, Progress, sync and the 62 Act 1 entries keep working unchanged, and the current `data/` passes the validator untouched.

**What this replaces above.** Answer 2 drops item 3 of "Proposed approach" (a numbers block in Progress) and the "numbers in Progress" part of step 2 of "Order of work". Progress stays ids only, so there is no ADR 0001 addendum and no sync change. ADR 0005 records why. The text above is kept as the record of what was proposed. (Rosaries still hold; the "Progress stays ids only" part is superseded by the second round below and ADR 0006.)

**Contract changes** (`docs/CONTRACTS.md` sections 1, 2, 5, 6, 7 and 8; awaiting Athos's review of the exact text):

- Entries get three optional fields: `counts` (boolean; default `true` for a Collectible, so the existing data means the same; `false` = tracked, not counted), `price` (integer of 1 or more, in Rosaries, for shop entries) and `toolColor` (`red`, `blue` or `yellow`, for Tools, for the Build picker).
- `requirements.js` gets `isCounted(item)` and `rosariesToSpend(doneSet, items, regions)`, and `regionProgress` counts with `isCounted`.
- Validator rule 6 (a Task never has `counts: true`), rule 11 (types of the three new fields) and rule 12 (a second approved list, tracked-only types `memento`, `relic`, `map`, checked against `counts`).
- Left open (contract section 8): Crest slot layout (sources disagree; Memory Lockets make it a player choice), whether a Build is stored, which types make up Equipment and which Tracker each goes on, shop entries with a material cost, whether tracker entries show on the Route and affect a Region's Complete state, and the save file field.

### Order of these tasks

1. P5-1 (Dev A) and P5-2 (QA 1) run in parallel. They touch different files.
2. Merge P5-1, then P5-2. After each: `node --test "tests/*.test.js"` and `node scripts/validate-data.js` (and `data/sample`).
3. P5-3 (Dev B) and P5-4 (QA 1) after P5-1 is merged, because both use `isCounted`.
4. **No entry with `counts`, `price` or `toolColor` goes into `data/` until P5-1, P5-2 and P5-3 are all merged.** Otherwise the Home headline would include a Memento (`main.js` still counts by `kind` until P5-3), and the validator would not check the new fields.

Nothing in these four tasks touches `js/progress.js`, `js/firebase.js`, `firestore.rules`, `js/render.js`, `data/`, the Progress shape or the four HTML pages.

### P5-1 (dev-a): `isCounted`, `regionProgress`, `rosariesToSpend`

- **Goal:** the three requirement changes in `docs/CONTRACTS.md` section 2, with no change to any current answer.
- **Files:** `js/requirements.js` only (owner: Dev A). Tests are QA 1's (P5-4); do not edit `tests/`.
- **Exact changes:**
  1. Add `export function isCounted(item)`, returning `item.kind === 'collectible' && item.counts !== false`. It takes one entry object, looks nothing up and never throws. A comment says why it exists: it is the one place the counting rule lives, so Home and Region numbers cannot disagree.
  2. In `regionProgress`, replace `item.kind === 'collectible'` with `isCounted(item)`. Keep the signature and the return shape.
  3. Add `export function rosariesToSpend(doneSet, items, regions)`, returning `{ total, available, ids }`. It looks at every entry with a `price` that is not in `doneSet`: `total` is the sum of their prices, `available` is the sum for those where `isAvailable` is true now, and `ids` lists them by `step` ascending. Entries without `price` are ignored, counted or not. Build the index once, as `nextStep` does. Unknown ids in `requires` throw, as in every other function.
  4. Nothing else changes: `isAvailable`, `missingFor`, `isRegionAvailable`, `missingForRegion`, `nextStep` and `holdingYouUp` treat an entry with `counts: false` or `price` like any other entry.
- **Done when:** the existing `node --test "tests/*.test.js"` passes with no test edited. A throwaway script (not committed) prints `regionProgress` for every Region in `data/` before and after the change, and the two outputs are identical; paste both into the handoff. `node scripts/validate-data.js` still prints `0 warning(s)`. Handoff note as usual.

### P5-2 (qa-tests): validator rules 6, 11 and 12

- **Goal:** the validator checks the new fields, and gives exactly the same result as before on the current data and on the sample.
- **Files:** `scripts/validate-data.js` and `tests/validate-data.test.js` (owner: QA 1).
- **Before starting:** record the output of `node scripts/validate-data.js` and `node scripts/validate-data.js data/sample`. On 2026-10-20 both said `Data check passed ... 0 warning(s).`
- **Exact changes:**
  1. Next to `COLLECTIBLE_TYPES`, add `TRACKED_TYPES = ['memento', 'relic', 'map']`, with a comment: tracked-only types for Collectibles the game does not count (Phase 5, ADR 0005); the list grows when the Mementos and Equipment sheet is approved.
  2. In `checkEntries`, when `counts` is given and is not a boolean, report a `'shape'` error: `"counts" must be true or false when it is given, found <value>.`
  3. Rule 6: when `kind` is `task` and `counts === true`, report a rule 6 error: a Task never counts, so `counts` cannot be true; if the game counts it, it is a Collectible. `counts: false` on a Task is accepted silently.
  4. Rule 11 (`'shape'`): `price`, when given, must be an integer of 1 or more (`0`, `-5`, `12.5` and `"80"` all fail). `toolColor`, when given, must be `red`, `blue` or `yellow`.
  5. Rule 12: pass whether the entry is counted (`item.counts !== false`) into `checkCollectibleType`.
     - **Counted** (no `counts`, or `counts: true`): the type must be in `COLLECTIBLE_TYPES`, as today. If it is not, and it is in `TRACKED_TYPES`, the warning says the game does not count this type and to add `"counts": false`. Otherwise keep today's message and suggestion exactly.
     - **`counts: false`:** a type in either list is fine. A type in neither list is a rule 12 warning that names both lists, and the `typeKey` suggestion searches both lists.
  6. Update the header comment so the rule list matches `docs/CONTRACTS.md` section 6.
- **Tests** (each breaks a copy of `data/sample` or an object written in the test, and asserts exactly that rule fires):
  - `counts: "yes"` gives a shape error.
  - A Task with `counts: true` gives rule 6 only.
  - A Task with `counts: false` gives no problem.
  - `price` of `0`, `-5`, `12.5` and `"80"` each give a shape error; `80` gives none.
  - `toolColor: "green"` gives a shape error; `"red"` gives none.
  - A Collectible of type `memento` with no `counts` gives a rule 12 warning that mentions `counts`; with `counts: false` it gives none.
  - `counts: false` with type `tool` gives no warning.
  - `counts: false` with type `mementos` gives a rule 12 warning suggesting `memento`.
  - An unknown type on a counted Collectible still gives today's message.
- **Done when:** all tests pass. Both validator commands print exactly what they printed before the change: `0 warning(s)`, no errors, no edit to `data/` or `data/sample/`. Handoff note as usual.

### P5-3 (dev-b): headline counts use `isCounted`

- **Goal:** the Home numbers select entries the same way `regionProgress` does, so a future `counts: false` entry cannot enter the headline.
- **Files:** `js/main.js` only (owner: Dev B).
- **Exact change:** import `isCounted` from `requirements.js`. Where Home builds its Collectibles total and "Collectibles by type" (today `items.filter((item) => item.kind === 'collectible')`), use `items.filter(isCounted)`. Leave the Tasks total, the Region card states (Complete still means every entry done) and everything in `render.js` alone; the Trackers page is a later task after the mockups.
- **Done when:** with the current data and with `?data=sample`, every number on Home, Region and Route is the same as before (check with `python3 -m http.server 8000` and say what you looked at), and `node --test "tests/*.test.js"` passes.

### P5-4 (qa-tests): requirement tests for Phase 5

- **Goal:** cover the Phase 5 sentence in `docs/CONTRACTS.md` section 2 ("Rules the tests must cover").
- **Files:** `tests/requirements.test.js` (owner: QA 1). Starts after P5-1 is merged.
- **Cases:**
  - `regionProgress` leaves out a Collectible with `counts: false` and keeps one with `counts: true` or no `counts`.
  - `isCounted` is false for a Task, even with `counts: true`, and for a Collectible with `counts: false`. It is true for a Collectible with no `counts`.
  - An entry with `counts: false` still blocks, is listed by `missingFor` and can be `nextStep` or a `holdingYouUp` blocker.
  - `rosariesToSpend` sums only priced entries not done, splits `available` from not Available (an entry in a Locked Region counts in `total`, not in `available`), orders `ids` by `step`, returns `{ total: 0, available: 0, ids: [] }` when nothing is priced, and throws on an unknown id in `requires`.
  - The `regionProgress` numbers for every Region of `data/sample` are pinned, so a later change cannot move them silently.
- **Done when:** all tests pass and the handoff lists each case and the command run.

### Risks to existing behaviour (and how the tasks avoid them)

- **The headline number moves.** This only happens if `counts: false` data lands before P5-3. Order rule 4 prevents it.
- **Region "Complete" needs tracker entries.** Once a Memento is in a Region, the Region shows Complete only when the Memento is done too. Current data is unaffected; the Trackers mockups decide whether to keep this (contract section 8).
- **Tracker entries on the Route.** A Memento or a map has a `step`, so it shows on the Route and can be "Next on the route". Current data is unaffected; the same open point applies.
- **Validator output on current data.** P5-2's done criterion pins it to the pre-change output, so an unintended new warning shows at once.

## Athos's second answers and the contract changes (2026-10-20)

**Answers.**

1. The contract text of the first round is approved. P5-1 to P5-4 run as written above.
2. **One entry per thing.** A Collectible the story needs is still one Collectible entry, with `counts: false` when the game does not count it, and it holds back other entries through their `requires`. The Drifter's Cloak (today a Task of type `ability`) becomes `kind: "collectible"`, `counts: false`, same id. The Hunter Crest is a normal entry the player ticks, `counts: false`. Mementos and Equipment are tracked, not counted.
3. **Navigation:** a Trackers link plus links to Rosaries and Builds in the header; on phones the last link reads "Account" (option A; its accessible name stays "Account and backup").
4. **Next to buy:** as designed: the first shop entry not bought that can be bought now (lowest `step` among priced entries that are not done and are Available). No check of whether the player can afford it.
5. **Shell Shards:** no panel, only a visible place showing how many the player has. **Orchestrator's reading, to be confirmed by Athos:** a number the player types (`shellShards` in Progress). The other reading, a count of Shell Shard sources found, needs no Progress field.
6. **Builds:** the picker **and** saving a Build (one per Crest). Memory Lockets spent per Crest are stored as a small number map (`crestSlots`). No templates and no `data/builds.json`: the Build fields go on entries in `items.json`, which causes no error in the current code (the validator ignores unknown fields; nothing reads them).
7. **Out of scope:** Steel Soul mode. **Not checked now:** the ten disputed facts in `docs/PHASE-5-SHEET-1-BUILDS.md` section 5; they stay open and nothing that depends on them enters `data/`.
8. **Save file import** is in scope, last, with a read-only preview first. Whether the repository may ship the game's decryption key is Athos's question (open).

**What this changes.** Progress gets three optional player-choice fields (`crestSlots`, `builds`, provisional `shellShards`), so the first round's "Progress stays ids only" no longer holds: ADR 0006, an addendum to ADR 0001, and `firestore.rules` must accept the three keys as optional. Step 5 of "Order of work" (synergy pairs, templates) becomes the picker plus saving. Exact text: `docs/CONTRACTS.md` sections 1, 2a, 3, 5, 6 (rule 13) and 7; open points in section 8. The field is called `builds`, not "loadouts", because Build is the glossary word ("Loadout" is on its avoid list).

### Order of these tasks

Same rule as before: everything additive, one branch merged at a time, `node --test "tests/*.test.js"` and both validator commands after each merge, and a QA 2 pass after each new page.

1. **Now** (P5-1 to P5-4 are already merged on the working branch, checked 2026-10-20, so their dependencies below are met): P5-5 and P5-6 (rules), P5-7 and P5-8 (Progress fields), P5-9 (rule 13), P5-10 (mockup addendum), and P5-13 once Athos confirms the Hunter Crest's place.
2. **Gate G1 (Athos):** after P5-5 and P5-6 are merged and the Emulator run passes, Athos publishes `firestore.rules` and tells the orchestrator. **P5-7 and P5-8 are not merged before G1**, because every merge is pushed and goes live: the new `progress.js` would send keys the published rules refuse (local data stays safe, but sync shows an error for everyone who saves a Build or starts a new run).
3. P5-11 (sample data) after P5-2 and P5-9. Then P5-12 (Trackers page), P5-13 (Drifter's Cloak and Hunter Crest, after P5-1 to P5-4), P5-14 (build fields on existing entries, after Athos's go). QA 2 pass.
4. Mementos and Equipment: sheet 2 (orchestrator research, Athos approves), P5-15, P5-16. Then the Rosaries page, P5-17, and the price batch, P5-18, after sheet 3. QA 2 pass.
5. Builds: P5-19 and P5-20 (`builds.js` may start any time after P5-11), P5-21 (after G1, P5-7 and P5-19), P5-22 (sync rehearsal). QA 2 pass.
6. Last: P5-23 (save file spike), P5-24 (read-only preview, after Athos's answer on the key).

Nothing in P5-5 to P5-11 touches `data/`, the four existing pages, `main.js` or `render.js`.

### P5-5 (dev-a): Firestore rules accept the player choices

- **Goal:** `firestore.rules` accept `crestSlots`, `builds` and `shellShards` as optional keys; everything else stays as it is.
- **Files:** `firestore.rules` only (Dev A). Tests are P5-6.
- **Exact change:** in `isProgressShape`, `hasOnly` lists the four keys plus the three; `hasAll` stays the four. When present: `crestSlots is map`, `builds is map`, and `shellShards == null || (shellShards is int && shellShards >= 0 && shellShards <= 999999)`. Nested values are not checked, as `done` and `visited` are not today (the 1 MiB document limit bounds them). `get`, `create`, `update` and `delete` keep `isOwner(uid)`; the catch-all deny stays. Update the comment ("exactly these four keys, always" becomes four required and three optional, ADR 0006; `syncedUid` still refused). If Athos has not confirmed the Shell Shards reading when this starts, leave `shellShards` out.
- **Done when:** the existing Emulator rules tests pass unchanged (`firebase emulators:exec --only firestore --project demo-silksong-guide "node --test tests/firestore-rules.test.js"`). Never deploy. Handoff as usual.

### P5-6 (qa-tests): rules tests for the player choices

- **Files:** `tests/firestore-rules.test.js` (QA 1). Written against the contract; merged after P5-5.
- **Cases:** a four-key document (an older page) is still accepted; each new key alone and all three together are accepted for the owner; `crestSlots` or `builds` as a list, string or number is refused; `shellShards` of `-1`, `1.5`, `"10"` and `1000000` is refused, `null` and `0` are accepted; `syncedUid` is still refused when the new keys are present; a key outside the seven is refused; another user's document carrying the new keys is refused for get, create and update; signed out is refused.
- **Done when:** all pass in the Emulator after P5-5 is merged; the handoff lists the command and each case.

### P5-7 (dev-a): the player choices in `progress.js`

- **Goal:** `crestSlots`, `builds` and (if confirmed) `shellShards` as in `docs/CONTRACTS.md` sections 1 and 3, with every existing behaviour unchanged.
- **Files:** `js/progress.js` only (Dev A). Not `firebase.js` (it already writes whatever object it gets), not the tests (P5-8).
- **Depends on:** the contract text approved by Athos. May be written now; **merged only after G1**.
- **Exact changes:**
  1. `normalize` keeps each field when present: well-formed parts kept, malformed parts (one bad Crest, colour or id) dropped silently, `done` and `visited` never affected by them. An absent field stays absent; defaults (`{}`, `null`) are applied only when handing values out (`loadProgress`, the `onProgressChange` payload).
  2. `setCrestSlots`, `setBuild` and `setShellShards` as contracted: `TypeError` and no write on a bad argument; a call that changes nothing does nothing; otherwise `commit` (stamp, local write, cloud write, notify). Zeros, empty lists and empty Builds are not stored.
  3. `setDone`, `setVisited` and every other `commit` never add an absent field ("missing is not empty").
  4. `mergeLocalAndCloud`: the per-field first-sign-in rules (larger number per Crest and colour; every Crest's Build kept, same Crest from the copy with the larger original `updatedAt`, tie local; `shellShards` from the newer copy, `null` gives way to a number); a field on one side only is taken; afterwards newer wins, and a field absent from the winner is taken from the other copy.
  5. `reconcile`: the "did anything change" check and the notification also compare the three fields (today `sameIds` compares ids only, so a cloud copy that differs only in a Build would not reach the page).
  6. `forCloud` and `exportProgress` leave absent fields absent. `parseBackup` and `importProgress` follow the contract: a malformed present field rejects the whole file; the result gains `addedSlots`, `addedBuilds` and `tookShellShards`, and `commit` runs when any of the five shows a change.
  7. `clearProgress` writes `crestSlots: {}`, `builds: {}` and `shellShards: null` explicitly.
  8. Keep the localStorage key, the cloud flow and every exported name. Update the header comment's stored shape.
- **Done when:** `node --test "tests/*.test.js"` passes with no test edited. A throwaway script (not committed) shows that a Progress string saved before Phase 5, a backup file made before Phase 5 and a four-key cloud copy all load with the same `done` and `visited` as before; paste its output. Handoff says how each numbered change was met.

### P5-8 (qa-tests): Progress tests for the player choices

- **Files:** `tests/progress.test.js`, `tests/progress-cloud.test.js` (QA 1). Written against the contract; merged after P5-7.
- **Cases:** Progress without the fields loads, with `{}`, `{}` and `null` handed out and nothing written; malformed fields in storage are dropped without losing a done id; each setter stores, a repeated call does not stamp, notify or write to the cloud, zeros and empty Builds delete keys, and each `TypeError` case writes nothing; `setDone` on a Progress without the fields does not add them; `mergeLocalAndCloud` on first sign-in (larger number per colour; Builds for different Crests both kept; same Crest, newer copy wins, tie local; `shellShards` from the newer copy, `null` gives way; field on one side only; on neither stays absent) and afterwards (newer wins with the fields; a field absent from the winner comes from the other copy); `clearProgress` writes the empty fields and they beat an older cloud copy that has Builds; export keeps absent fields absent; import of a pre-Phase-5 backup adds ids only; import takes the larger slot numbers and reports `addedSlots`, adds Builds only for Crests without one, takes `shellShards` only when none is set; a backup with a malformed `builds` is rejected and changes nothing; with the fake cloud, a newer four-key snapshot keeps the local Builds, writes carry the fields, and a snapshot that differs only in `builds` calls `onProgressChange`.
- **Done when:** all pass after P5-7 is merged.

### P5-9 (qa-tests): validator rule 13 and the `effect` warning

- **Files:** `scripts/validate-data.js`, `tests/validate-data.test.js` (QA 1). Starts after P5-2 is merged (same files).
- **Exact changes:** rule 13 as written in `docs/CONTRACTS.md` section 6 (errors for the shape of `slots`, `slotsMax`, `grantsSlots`, `upgradeOf` and `effect`; warnings for a counted entry with `upgradeOf`, `toolColor` on a non-Tool, and a colour that differs from the base's); rule 10 also warns for `effect` over 200 characters; header comment matches section 6.
- **Tests:** each error and each warning on its own, plus an `upgradeOf` loop and an `upgradeOf` pointing at a Region id.
- **Done when:** all tests pass, and `node scripts/validate-data.js` and `node scripts/validate-data.js data/sample` print exactly what they printed before.

### P5-10 (dev-b): mockup addendum for saving Builds, opened slots, Shell Shards and six links

- **Goal:** mockups for what Athos's second answers add, before any code. Invented content only.
- **Files:** new or changed files in `docs/design/trackers/` only (Dev B).
- **Scope:**
  1. Build picker: remove the "Guide suggestion" flag and its wording (no templates); for each slot a choice among owned Tools of that colour (Silk Skills for white); "Save this Build" with saved and unsaved states; a saved Build that no longer fits, with each problem shown and nothing removed; an "Opened slots" control per colour for the chosen Crest (Memory Lockets) with its limit; a Crest whose layout is not in the guide yet.
  2. Rosaries page: a small place for the Shell Shards number the player types (a labelled number, not a panel), marked provisional until Athos confirms the reading.
  3. The header with six links (Regions, Route, Trackers, Rosaries, Builds, Account) under option A, at 390, 360 and 320px. If it does not fit one row, show the problem and two options; do not choose.
- **Done when:** desktop and phone screenshots as in T30, and Athos approves (the orchestrator records it). Nothing outside the folder changes.

### P5-11 (orchestrator): sample data for the new pages

- **Files:** `data/sample/*` (orchestrator). After P5-2 and P5-9 are merged.
- **Scope:** invented entries only, in a **new** sample Region so the `regionProgress` numbers P5-4 pins for the existing sample Regions do not move: Crests with `slots` and `slotsMax`, one Crest without `slots`, an entry with `grantsSlots`, Tools of each colour and one without `toolColor`, an upgrade with `upgradeOf`, a Silk Skill, priced entries (some Available, some behind a requirement), a `counts: false` Memento and Equipment entry, and a `counts: false` Collectible that other entries require. Raise the sample `dataVersion`.
- **Done when:** `node scripts/validate-data.js data/sample` gives no error and no warning, and the tests pass. If a pinned test still breaks, it goes to QA 1; no test is edited here.

### P5-12 (dev-b): the Trackers page and its header link

- **Goal:** `trackers.html` as in the T30 Trackers mockups, and the Trackers link in every header.
- **Files:** new `trackers.html`, `js/trackers-page.js`, `css/trackers.css`; the header only in `index.html`, `region.html`, `route.html`, `account.html`; `css/components.css` (the option A label rule only); `js/render.js` (new exports only, no behaviour change) if needed.
- **Depends on:** P5-3 merged; P5-10 approved (for the header check); P5-11 merged.
- **Scope:** `data-page="trackers"`; tabs and their keyboard behaviour as in the mockup. A tab's done and total include every entry in it, counted or not (they are not completion counts). The type-to-tab table from `docs/CONTRACTS.md` section 8 is one constant at the top of `trackers-page.js`, with a comment saying it is a proposal awaiting Athos; types with no tab are not shown, and the handoff lists them. A tab with no entries reads "Not in the guide yet". Marking goes through `setDone`. Spoilers follow the mockup; where it is silent, use the Region page rule (hidden while the Region is not Visited, with the show-everything option) and say so. The header gets "Trackers" on all five pages, with `aria-current` on this one.
- **Done when:** with the current data and with `?data=sample`, each tab's numbers match a hand count (say which), every Home, Region and Route number is unchanged, the header fits one row at 390, 360 and 320px, the tabs work with the keyboard, and the tests and validator pass.

### P5-13 (dev-c): Drifter's Cloak becomes a Collectible; the Hunter Crest entry

- **Goal:** the two "one entry per thing" cases from answer 2, with ids unchanged.
- **Files:** `data/items.json`; `data/regions.json` and `data/endings.json` for `dataVersion` only (Dev C).
- **Depends on:** P5-1, P5-2, P5-3 and P5-4 merged (before P5-3, Home counts by `kind` and the headline would grow by one). Athos confirms the Hunter Crest's Region, `step` and `how` (proposal: `moss-grotto`, a free step before 10).
- **Exact changes, in this order:**
  1. `drifters-cloak`: `kind` `"task"` becomes `"collectible"`, add `"counts": false`. Keep `id`, `name`, `type`, `regionId`, `how`, `requires`, `step` and `source` exactly. No new id, no second entry.
  2. New `hunter-crest`: `kind` `"collectible"`, `type` `"crest"`, `counts: false`, `requires: []`, Region and `step` as Athos confirms, `how` in our words ("the starting Crest, owned from the beginning"), `source` from the sheet (owned from the start: KG, SK, GR, GS). No `slots`: its white slot is one of the disputed facts.
  3. Raise `dataVersion` by one in all three files.
- **Done when:** the validator gives no error and no warning; the tests pass; served locally, the Home Collectibles headline and "Collectibles by type" are unchanged, the Tasks total is one lower, the Far Fields numbers are unchanged, the Drifter's Cloak row shows as a Collectible (bead, "Collected": expected), `mask-shard-far-fields`, `fourth-chorus` and Hunter's March stay Locked until it is done as before, and a Progress that had `drifters-cloak` done still shows it done. The handoff gives the numbers before and after.

### P5-14 (dev-c): build fields on the entries already in `data/`

- **Files:** `data/*.json` (Dev C).
- **Depends on:** P5-9 and P5-13 merged; Athos says which undisputed facts of `docs/PHASE-5-SHEET-1-BUILDS.md` may enter data.
- **Scope:** only entries that already exist: `toolColor` on the 23 Tools, `effect` where the sheet has one, `slots` and `slotsMax` only on Crests whose layout is not in section 5 and that Athos cleared. Nothing from the ten disputed points; no new entries (new Tools and Crests come with the Act 2 and Act 3 batches). Raise `dataVersion`.
- **Done when:** validator clean, tests pass, the handoff maps each field to its sheet row.

### P5-15 (qa-tests): tracked-only types from the Mementos and Equipment sheet

- **Files:** `scripts/validate-data.js`, `tests/validate-data.test.js`. **Depends on:** sheet 2 approved by Athos.
- **Scope:** add the sheet's types to `TRACKED_TYPES`, with a test for each. **Done when:** tests pass and both validator outputs are unchanged.

### P5-16 (dev-c): Mementos and Equipment

- **Files:** `data/*.json`. **Depends on:** sheet 2 approved, P5-15 and P5-12 merged.
- **Scope:** only the Regions already in `data/`; the rest waits for the Act 2 and Act 3 batches. All `counts: false`. **Done when:** validator clean, tests pass, the Home headline is unchanged, and the Mementos and Equipment tabs show the new entries.

### P5-17 (dev-b): the Rosaries page, its header link and the Shell Shards number

- **Files:** new `rosaries.html`, `js/rosaries-page.js`; `css/trackers.css`; the header only in the five existing pages; `js/render.js` (new exports only) if needed.
- **Depends on:** P5-1 and P5-12 merged; the T30 Rosaries mockups. The Shell Shards part also needs Athos's confirmation, P5-7 merged (after G1) and P5-10 approved; without them, ship the page without it.
- **Scope:** `data-page="rosaries"`; numbers from `rosariesToSpend` (`total`, `available`); entries in `ids` order; "Next to buy" = the first id in `ids` that `isAvailable` says is Available, with no affordability check; marking bought through `setDone`; the four mockup states (partial, nothing marked, complete, not in the guide yet); the Shell Shards number through `setShellShards`, shown from `loadProgress` and `onProgressChange`. The header gets "Rosaries".
- **Done when:** with `?data=sample` the totals match a hand sum of the sample prices (say which), Next to buy moves when it is marked, the header fits at 320px, and tests and validator pass.

### P5-18 (dev-c): shop prices

- **Files:** `data/*.json`. **Depends on:** sheet 3 (shops and prices) approved by Athos; P5-2 merged.
- **Scope:** `price` on existing shop entries from the sheet, only where the price is not disputed. **Done when:** validator clean, tests pass, the Rosaries page totals match the sheet.

### P5-19 (dev-a): `js/builds.js`

- **Files:** new `js/builds.js` (Dev A). **Depends on:** the contract text (section 2a) approved; can start any time after P5-11.
- **Scope:** `slotsFor`, `ownedByColour`, `checkBuild` exactly as in section 2a; pure; build an id index once per call, as `requirements.js` does.
- **Done when:** a throwaway script against `data/sample` prints the three results for each sample Crest (paste it); `node --test "tests/*.test.js"` still passes.

### P5-20 (qa-tests): tests for `builds.js`

- **Files:** new `tests/builds.test.js`. Covers the list under section 2a. Merged after P5-19.

### P5-21 (dev-b): the Build picker and its header link

- **Files:** new `builds.html`, `js/builds-page.js`; `css/trackers.css`; the header only in the six existing pages; `js/render.js` (new exports only) if needed.
- **Depends on:** G1 and P5-7 merged, P5-19 merged, P5-10 approved, P5-11 merged.
- **Scope:** `data-page="builds"`; the Crests offered are the Crest entries marked done (the Hunter Crest too, once ticked; no special case); slots from `slotsFor` (null = "Not in the guide yet"); choices from `ownedByColour`; save through `setBuild`; opened slots through `setCrestSlots`, limited to `slotsMax - slots`; problems from `checkBuild`, shown and never removed by the page; the saved Build and opened slots follow `onProgressChange` (another device). The header gets "Builds".
- **Done when:** with `?data=sample`, choosing, saving, reloading, opening a slot up to its limit, and a saved Build that stops fitting after unmarking a Tool all behave as the mockup says (list each); header fits at 320px; tests and validator pass.

### P5-22 (dev-a): sync rehearsal for the player choices

- **Files:** `tools/sync-rehearsal.mjs`, `tools/README.md` (Dev A). **Depends on:** P5-21 merged. Emulator only, never the real project.
- **Scenarios:** device A saves a Build and opens a slot, device B shows both; a first sign-in where both devices saved Builds (different Crests both kept; the same Crest keeps the newer); opened slots take the larger number; a newer four-key document written straight to the Emulator (an older page) leaves B's Builds in place, and B's next change writes them back; "Start a new run" on A clears A's Builds, and B's after A's next change.
- **Done when:** the rehearsal command in `CLAUDE.md` passes; output in the handoff.

### P5-23 (dev-a): save file spike (research only)

- **Files:** none in the repository. Throwaway work in the scratchpad; findings in the handoff, which the orchestrator files in `docs/research/`.
- **Questions:** the format layers and what decrypting in a browser needs; where the decrypted data keeps Tools, Crests, Mask Shards, Spool Fragments, Mementos and wishes (from the community tools' public descriptions, or a save file Athos supplies himself); how large a save-flag-to-entry-id table would be and how it would follow game patches; the licences of the community tools. Do not copy the decryption key into the repository or the handoff; say where it comes from.
- **Done when:** the handoff answers each question and says what could not be checked.

### P5-24 (dev-a, acting as Dev B for one page): read-only save preview

- **Depends on:** P5-23, Athos's answer on shipping the key, and the reader's contract (the orchestrator writes it after the spike).
- **Outline (exact files and signatures come with that contract):** the player picks their save file; it is read in the browser and never uploaded or sent anywhere; the page lists what it says as entry names, plus anything it could not map; it writes nothing to Progress. An "add to my Progress" step, if Athos wants one, is a later task that goes through the union import.

### Risks of the second round (and how the tasks avoid them)

- **Sync errors if `progress.js` goes live before the rules.** Gate G1: P5-7 waits for Athos to publish.
- **An older page erases saved Builds.** "Missing is not empty" (contract section 1), tested in P5-8 and rehearsed in P5-22.
- **Sample data moves pinned test numbers.** P5-11 adds everything in a new sample Region.
- **Six links may not fit a 320px header.** P5-10 checks first; if they do not fit, Athos chooses.
- **The Drifter's Cloak change moves the Tasks total by one** and changes its row from knot to bead. Expected; P5-13's done criteria list it so it is not mistaken for a bug.
- **Shell Shards may mean something else.** Built only after Athos confirms.
- **Unchecked facts reaching data.** Disputed facts stay out; undisputed ones need Athos's go (P5-14).
- **The game's decryption key in a public repository.** P5-24 waits for Athos.
