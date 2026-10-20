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
- **Region "Complete" needs tracker entries.** Once a Memento is in a Region, the Region shows Complete only when the Memento is done too. Current data is unaffected; the Trackers mockups decide whether to keep this (contract section 8). *Decided 2026-10-20: see "The Route rule" below.*
- **Tracker entries on the Route.** A Memento or a map has a `step`, so it shows on the Route and can be "Next on the route". Current data is unaffected; the same open point applies. *Decided 2026-10-20: see "The Route rule" below.*
- **Validator output on current data.** P5-2's done criterion pins it to the pre-change output, so an unintended new warning shows at once.

## Athos's second answers and the contract changes (2026-10-20)

**Answers.**

1. The contract text of the first round is approved. P5-1 to P5-4 run as written above.
2. **One entry per thing.** A Collectible the story needs is still one Collectible entry, with `counts: false` when the game does not count it, and it holds back other entries through their `requires`. The Drifter's Cloak (today a Task of type `ability`) becomes `kind: "collectible"`, `counts: false`, same id. The Hunter Crest is a normal entry the player ticks, `counts: false`. Mementos and Equipment are tracked, not counted.
3. **Navigation:** a Trackers link plus links to Rosaries and Builds in the header; on phones the last link reads "Account" (option A; its accessible name stays "Account and backup").
4. **Next to buy:** as designed: the first shop entry not bought that can be bought now (lowest `step` among priced entries that are not done and are Available). No check of whether the player can afford it.
5. **Shell Shards:** no panel, only a visible place showing how many the player has. **Orchestrator's reading, to be confirmed by Athos:** a number the player types (`shellShards` in Progress). The other reading, a count of Shell Shard sources found, needs no Progress field. *(Third round: Athos chose "like the Rosaries, from entries"; `shellShards` is dropped. Every Shell Shards item below in P5-5 to P5-17 is void; see "Athos's third answers".)*
6. **Builds:** the picker **and** saving a Build (one per Crest). Memory Lockets spent per Crest are stored as a small number map (`crestSlots`). No templates and no `data/builds.json` *(reversed in the third round: templates and synergies now live in `data/builds.json`)*: the Build fields go on entries in `items.json`, which causes no error in the current code (the validator ignores unknown fields; nothing reads them).
7. **Out of scope:** Steel Soul mode. **Not checked now:** the ten disputed facts in `docs/PHASE-5-SHEET-1-BUILDS.md` section 5; they stay open and nothing that depends on them enters `data/`.
8. **Save file import** is in scope, last, with a read-only preview first. Whether the repository may ship the game's decryption key is Athos's question (open).

**What this changes.** Progress gets three optional player-choice fields (`crestSlots`, `builds`, provisional `shellShards`), so the first round's "Progress stays ids only" no longer holds: ADR 0006, an addendum to ADR 0001, and `firestore.rules` must accept the three keys as optional. Step 5 of "Order of work" (synergy pairs, templates) becomes the picker plus saving. Exact text: `docs/CONTRACTS.md` sections 1, 2a, 3, 5, 6 (rule 13) and 7; open points in section 8. The field is called `builds`, not "loadouts", because Build is the glossary word ("Loadout" is on its avoid list).

### Order of these tasks

Same rule as before: everything additive, one branch merged at a time, `node --test "tests/*.test.js"` and both validator commands after each merge, and a QA 2 pass after each new page.

1. **Now** (P5-1 to P5-4 are already merged on the working branch, checked 2026-10-20, so their dependencies below are met): P5-5 and P5-6 (rules), P5-7 and P5-8 (Progress fields), P5-9 (rule 13), P5-10 (mockup addendum), and P5-13 once Athos confirms the Hunter Crest's place.
2. **Gate G1 (Athos):** after P5-5 and P5-6 are merged and the Emulator run passes, Athos publishes `firestore.rules` and tells the orchestrator. **P5-7 and P5-8 are not merged before G1**, because every merge is pushed and goes live: the new `progress.js` would send keys the published rules refuse (local data stays safe, but sync shows an error for everyone who saves a Build or starts a new run).
3. P5-11 (sample data) after P5-2 and P5-9. Then P5-12 (Trackers page), P5-13 (Drifter's Cloak and Hunter Crest, after P5-1 to P5-4), P5-14 (build fields on existing entries, after Athos's go). QA 2 pass.
4. Mementos and Equipment: sheet 2 (orchestrator research, Athos approves), P5-15, then the Route rule (P5-25 to P5-28, section "The Route rule" below), then P5-16. Then the Rosaries page, P5-17, and the price batch, P5-18, after sheet 3. QA 2 pass.
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

- **Files:** `data/*.json`. **Depends on:** sheet 2 approved, P5-15 and P5-12 merged, and P5-25 to P5-27 merged (the Route rule; without it the new entries would join the Route and knock Complete Regions back).
- **Scope:** only the Regions already in `data/`; the rest waits for the Act 2 and Act 3 batches. All `counts: false`. **Done when:** validator clean, tests pass, the Home headline is unchanged, and the Mementos and Equipment tabs show the new entries. Also: none of the new entries is on the Route (`routeIds` before and after differ by nothing), so the Route page, "Next on the route", "Holding you up" and every Region card state are the same before and after; a throwaway script prints `routeIds(...).size` before and after (62 and 62 on today's data) and the handoff pastes it.

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
- **Shell Shards may mean something else.** Built only after Athos confirms. *(Settled in the third round: it did mean something else; `shellShards` was never built and is dropped.)*
- **Unchecked facts reaching data.** Disputed facts stay out; undisputed ones need Athos's go (P5-14).
- **The game's decryption key in a public repository.** P5-24 waits for Athos.

## The Route rule (2026-10-20, delegated by Athos)

**Why.** Sheet 2 (`docs/PHASE-5-SHEET-2-MEMENTOS-EQUIPMENT-SHOPS.md`, section 5 point 1) found that P5-16's 34 tracked entries would knock Complete Act 1 Regions back and could make "Next on the route" point at a map, because every entry with a `step` was on the Route. Athos delegated the decision ("do what is best for the project").

**Decision** (exact text: `docs/CONTRACTS.md` section 1 "On the Route or not", section 2 `routeIds`, `nextStep` and `holdingYouUp`, section 5, rule 14, and section 7). An entry is on the Route when it is counted, a Task, `missable`, or needed (down the chain) by an entry on the Route or by a Region. Everything else (in practice a `counts: false` Collectible nothing on the Route needs) is off the Route: listed and ticked on its Region page and its Tracker, never on the Route page, never "Next on the route", never in "Holding you up", and never keeping a Region from Complete. One pure function, `routeIds(items, regions) -> Set`, holds the rule; the interface never re-derives it.

**What moves on today's data** (checked with a throwaway prototype of the rule against `data/` at `dataVersion` 5 and `data/sample` at `dataVersion` 3; P5-25 must reproduce these numbers):

| | `data/` | `data/sample` |
|---|---|---|
| Entries / on the Route | 63 / 62 | 30 / 25 |
| Off the Route | `hunter-crest` | `sample-crest-three`, `sample-red-tool-plus`, `sample-memento`, `sample-map`, `sample-memento-two` |
| `nextStep`, nothing done | `moss-mother` (unchanged) | `sample-ability` (unchanged) |
| `nextStep` after the first is done | `silk-spear` (today `hunter-crest`) | `sample-key` (unchanged) |
| Ticking `nextStep` until null | 62 entries (today 63) | 25 entries (today 30) |
| `holdingYouUp`, nothing done, as id and `blocks.length` | `moss-mother` 70, `simple-key` 1 (unchanged) | `sample-ability` 8, `sample-cloak` 6 (today 7: `sample-memento-two` drops out), `sample-lever` 3, `sample-crest` 2; `sample-red-tool` (today 1, for `sample-red-tool-plus`) is gone |
| Region entries on the Route | Moss Grotto 8 of 9; every other Region all of its entries | Region F 10 of 14, Region G 2 of 3; others all |
| Region card Complete | Moss Grotto no longer needs the Hunter Crest | Regions F and G no longer need their off-Route entries |
| `regionProgress`, Home Collectibles (49), Tasks (12), by type | unchanged | unchanged |

All 62 entries from before Phase 5 keep their place on the Route. The Hunter Crest is the one change, and it is a Phase 5 entry: a starting Crest the game does not count and nothing needs. It stays on the Moss Grotto page and the Crests tab, where the player ticks it for the Build picker. Keeping it on the Route by making something require it was rejected: that would be an invented game fact.

### Order of these tasks

1. Before P5-27 is handed out, the orchestrator updates `docs/DESIGN.md` (section 5, Region card: Complete means every entry on the Route is done; section 6, Region page: the "Not on the route" label).
2. P5-25 (Dev A) and P5-26 (QA 1) are written in parallel (different files). Merge P5-25, then P5-26 straight after, with nothing in between. Between the two merges exactly one existing test fails (named in P5-25), because it encodes the rule being retired. Run `node --test "tests/*.test.js"` and both validator commands after P5-26.
3. P5-27 (Dev B) and P5-28 (QA 1) after P5-26 is merged; different files, so in parallel. Merge one at a time, tests and validators after each.
4. QA 2 pass on Home, Route and Region with `data/` and `?data=sample`.
5. P5-16 may then go (its dependency).

Nothing in these four tasks touches `data/`, `data/sample/`, `js/progress.js`, `js/firebase.js`, `firestore.rules`, `js/trackers-page.js` or any HTML page.

### P5-25 (dev-a): `routeIds`, and `nextStep` and `holdingYouUp` follow it

- **Goal:** the Route rule in `docs/CONTRACTS.md` section 2, in one place, with no other answer changed.
- **Files:** `js/requirements.js` only (owner: Dev A). Tests are QA 1's (P5-26); do not edit `tests/`.
- **Exact changes:**
  1. `export function routeIds(items, regions)`, returning a `Set` of entry ids, as the contract says. Write the walk as an internal helper that takes the index (like `itemIsAvailable`), so `nextStep` and `holdingYouUp` reuse the index they already build. Start from every entry where `isCounted(item) || item.kind === 'task' || item.missable === true`, plus `requirementsOfRegion` of every Region; for each id, add it and push `requirementsOfItem` of it. A Set of ids already added stops cycles; do not report a cycle here. Unknown ids throw through `getItem` and `getRegion`, as everywhere. A comment says why the function exists (the one place the rule lives; the data alone decides it; closed under requirements, so nothing needed by the Route is ever off it).
  2. `nextStep`: only entries in the Set can be returned. Signature unchanged.
  3. `holdingYouUp`: the loop over entries skips entries off the Route before anything else. The Region loop is unchanged. Signature unchanged.
  4. Nothing else changes: `isAvailable`, `missingFor`, `missingForRegion`, `isRegionAvailable`, `regionProgress`, `isCounted` and `rosariesToSpend` give the same answers as before.
- **Done when:** `node --test "tests/*.test.js"` passes except exactly one test, `nextStep: can return an entry with counts: false, then moves past it once it is done`, which encodes the retired rule (P5-26 replaces it); any other failure is a bug to fix here. `node scripts/validate-data.js` and `node scripts/validate-data.js data/sample` still print `0 warning(s)`. A throwaway script (not committed) prints, for `data/` and `data/sample`, before and after the change where the function existed before: `routeIds` size and the ids off it; `nextStep` with nothing done and after the first id is done; how many entries ticking `nextStep` until null reaches; `holdingYouUp` with nothing done as `[id, blocks.length]`; `regionProgress` for every Region. The numbers match the table above; paste the output into the handoff.

### P5-26 (qa-tests): tests for the Route rule

- **Goal:** cover the Phase 5 Route sentence in `docs/CONTRACTS.md` section 2 ("Rules the tests must cover").
- **Files:** `tests/requirements.test.js` (owner: QA 1). Written against the contract; merged straight after P5-25.
- **Cases** (small invented objects unless a case says `data/sample`; never the real `data/`):
  - Replace `nextStep: can return an entry with counts: false, then moves past it once it is done` with two tests: a `counts: false` entry that a counted entry requires is returned by `nextStep` and passed once done; a `counts: false` entry that nothing needs is never returned, even when it has the lowest `step` and is Available, and `nextStep` is `null` when only such entries are left.
  - `routeIds` holds: a counted Collectible; a Task (also one with `counts: false`); a `missable: true` entry with `counts: false` that nothing needs; a `counts: false` entry required by a counted one; two `counts: false` entries in a chain under a counted one (two links down); a `counts: false` entry in a Region's `requires`, also when that Region has no entries; a `counts: false` entry required by the Region of a counted entry.
  - `routeIds` leaves out: a `counts: false` entry that nothing needs; a `counts: false` "key" required only by two `counts: false` "furnishings" (the key is off, like the furnishings).
  - `routeIds` returns a `Set`, does not change the arrays it is given, does not depend on the order of `items`, throws on an unknown `regionId`, on an unknown id in an entry's `requires` and on one in a Region's `requires`, and returns (holding both ids) for a cycle between two counted entries instead of looping.
  - `holdingYouUp`: a `counts: false` entry off the Route, waiting on an Available requirement, is not in any `blocks`; when that requirement also holds up a counted entry, `blocks` lists only the counted one. The existing test `holdingYouUp: a counts: false entry can hold up an entry and a Region` stays (that entry is needed, so it is on the Route).
  - `data/sample` pins: `routeIds` has 25 ids, and the ids off it are exactly `sample-crest-three`, `sample-red-tool-plus`, `sample-memento`, `sample-map`, `sample-memento-two`; every Ending condition in the sample's `endings.json` is in it; ticking `nextStep` from nothing until `null` reaches 25 entries, none of them off the Route; `holdingYouUp(new Set(), ...)` equals exactly:
    `[{ id: 'sample-ability', blocks: ['sample-key', 'sample-door', 'sample-shard', 'sample-boss', 'sample-charm', 'sample-flea', 'sample-region-b', 'sample-region-c'] }, { id: 'sample-cloak', blocks: ['sample-crest-two', 'sample-yellow-tool', 'sample-slot-upgrade', 'sample-crest-four', 'sample-yellow-tool-two', 'sample-region-g'] }, { id: 'sample-lever', blocks: ['sample-skill', 'sample-shard-two', 'sample-region-d'] }, { id: 'sample-crest', blocks: ['sample-quest', 'sample-tool-two'] }]`
    (the orchestrator's prototype; if P5-25 gives something else, report it, do not change the pin to match).
  - The existing `regionProgress` pins and `counts and price change no answer about requirements` stay as they are (both still hold under the new rule).
- **Done when:** all tests pass after P5-25 is merged; the handoff lists each case and the command run.

### P5-27 (dev-b): the Route page, Region cards, Home and the Region page follow `routeIds`

- **Goal:** the interface behaviour in `docs/CONTRACTS.md` section 5 ("Phase 5, the Route rule").
- **Files:** `js/main.js` and `js/render.js` (owner: Dev B). Not `requirements.js`, `trackers-page.js` or any CSS unless the label needs one rule in `css/components.css` (say so).
- **Depends on:** P5-25 and P5-26 merged; `docs/DESIGN.md` updated by the orchestrator (step 1 above).
- **Exact changes:**
  1. `loadGuide`: import `routeIds`; work out the Set once and put it on the guide as `onRoute`; `routeOrder` holds only entries in the Set, by `step`. Nothing else in the page decides what is on the Route.
  2. Route page: no change beyond what `routeOrder` now holds; check that groups, "Steps X to Y" and hidden counts come from it.
  3. `regionCard`: Complete as in the contract (every entry on the Route in the Region done; all entries when none of them is on the Route). Update the comment above it, which still says "every entry in it is done".
  4. Home: `allDone` means every entry on the Route is done (and there is at least one). `render.js`: heading "Everything on the route is done", text "Every step on the route so far is marked done. Extras that are not on the route stay on their Region pages."
  5. `makeEntryView` gets `onRoute: guide.onRoute.has(item.id)`. In `render.js` `entryRow`, a row with `onRoute === false` shows "Not on the route" in the place of "Step N" (same element, no `num` class). It is text, not colour only.
  6. Leave the counts, Visited, spoiler hiding, the Locked chain, `holdingViews` and the Trackers page as they are.
- **Done when**, served with `python3 -m http.server 8000` (say what you looked at):
  - `data/`: Home Collectibles 0 of 49, Tasks 0 of 12, "Collectibles by type" and every Region card bar as before. With "Show everything" on, the Route lists 62 entries (63 before; the Hunter Crest is gone). "Next on the route" is Moss Mother with nothing done, and Silk Spear once Moss Mother is ticked (before: Hunter Crest). The Moss Grotto page lists 9 entries; the Hunter Crest row reads "Not on the route" and toggles. Ticking Moss Grotto's 8 entries on the Route (Moss Mother, Silk Spear, Simple Key, the Moss Grotto Spool Fragment, Druid's Eye, Magnetite Brooch, the Bone Bottom Mask Shard, Wanderer Crest) makes its card Complete without the Hunter Crest.
  - `?data=sample`: the Route lists 25 entries with "Show everything" on (30 before); the Region F card is Complete once its 10 entries on the Route are done (14 before) and Region G with its 2 (3 before); the five off-Route rows read "Not on the route" on their Region pages; Home "Holding you up" starts with `sample-ability`, then `sample-cloak` (blocks 6).
  - Keyboard and screen reader behaviour of the rows is unchanged; nothing scrolls sideways at 390px; `node --test "tests/*.test.js"` and both validator commands pass.

### P5-28 (qa-tests): validator rule 14

- **Goal:** the warning in `docs/CONTRACTS.md` section 6, rule 14.
- **Files:** `scripts/validate-data.js` and `tests/validate-data.test.js` (owner: QA 1).
- **Depends on:** P5-25 merged (the validator imports `routeIds` from `../js/requirements.js`; it does not copy the rule).
- **Exact changes:** after the existing checks, and only when rules 1 to 5 reported no error, call `routeIds(items, regions)` and give a rule 14 warning for each Ending condition not in it, naming the Ending id and the condition id, saying the Route must lead to every Ending and that the orchestrator decides the fix (Ending conditions become a root of `routeIds`). Update the header comment's rule list.
- **Tests:** a copy of `data/sample` where one Ending's condition is a new `counts: false` Collectible that nothing needs gives exactly one rule 14 warning; the untouched sample gives none; a copy with a rule 3 error (an unknown id in `requires`) reports rule 3 and neither crashes nor prints rule 14.
- **Done when:** all tests pass; `node scripts/validate-data.js` and `node scripts/validate-data.js data/sample` print exactly what they printed before (`0 warning(s)`).

### Risks of the Route rule

- **A `requires` left out of the data drops an entry off the Route without an error** (a key that opens a counted entry but is not in its `requires`). Each data batch's handoff lists the tracked entries that land on the Route and why; QA 2 compares the Route with the sheet.
- **A player never ticks the Hunter Crest** because the Route no longer shows it, and the Build picker then offers no Crest. Its `how` already says to tick it; P5-21's empty state should point to the Crests tab.
- **The legend** ("A bead is a collectible and counts toward your totals") is already wrong for `counts: false` Collectibles since P5-13; this rule does not change that. Open point for Dev B's next pass on `render.js`.

## Athos's third answers: Templates, Synergies, Places, MapGenie, Shell Shards (2026-10-20)

**Answers** (relayed to the orchestrator; the contract text written from them awaits Athos's review). (a) He now **wants Build templates** (reversing answer 6 of the second round). (b) He **wants points of interest** like Hollow-Thingy's (benches, Bellway stations, vendors, NPCs, per Region) "whenever needed" (reversing "optional, later"). (c) He allows a **MapGenie link for Silksong as a `source`** "in case needed". (d) **Shell Shards work like the Rosaries**, worked out from entries: no typed number, no Progress field, no rules change. Everything else in the earlier rounds stands.

**Decisions** (exact text: `docs/CONTRACTS.md` sections 1, 2, 2a, 3, 5, 6, 7 and 8; why: ADR 0007; glossary: Template, Synergy, Place):

1. **Templates and Synergies in a new optional `data/builds.json`**, not on Crest entries: a Template groups several entries and belongs to none; a Synergy is a pair. A Template's `build` has the saved Build's shape, so "Use as my Build" is a copy into the draft (it never saves) and `checkBuild` judges it. `editorial` (required) says whether the grouping is ours ("Our suggestion") or a guide's ("From a guide"). A Synergy is never editorial: its source must name both entries.
2. **Places in a new optional `data/places.json`**: `kind` from a short list (bench, bellway, shop, npc, wishboard, arena, door, other), `requires` with the entries' meaning, `sells` on shops. Not entries: no `step`, never done, no Progress, no effect on counts or the Route. Hidden until the Region is Visited, like entries.
3. **Links point one way** (new files to `items.json`, never back), so the current data stays valid untouched, and pages that do not load the new files cannot change. That is why a shop lists what it `sells` instead of entries carrying a `soldAt`.
4. **One `dataVersion` and one id space** across all five files, as before.
5. **No new page and no new header link.** The Region page gains "Places in this region"; the Rosaries page says "Sold by"; the Build picker gains Templates and Synergies.
6. **The validator uses the picker's own code** (`checkBuild` from `builds.js`) to prove a Template fits its Crest with every slot opened, as rule 14 uses `routeIds`.
7. **MapGenie is a citation only**: allowed as a `source` for where something is, never the origin of our text; agents never fetch it (`CLAUDE.md` rule 9), so such links are listed as unchecked.
8. **`shellShards` dropped** from Progress and from the import result; the rules already refuse it, so Athos has nothing to publish. Which entries carry a Shell Shards cost waits for research (P5-46).

**Two facts that shape the order.** (i) **All seven Crests in `data/` already have `slots` and `slotsMax`** (`dataVersion` 10), so Templates can be checked for every Crest as soon as sheet 4 is approved; a Template that uses a slot sheet 1 disputes (Witch, Shaman, the Hunter Crest's white slot) inherits the dispute and the sheet says so. No entry has `grantsSlots` yet (no Vesticrest entry), so no Template can count on those slots. (ii) **Places need research first**: sheet 2 covers the vendors and their stock for Acts 1 and 2, but benches, Bellway stations, NPCs and wish boards have no sheet yet.

### Order of these tasks (fast lanes; one branch merged at a time, tests and both validator commands after each)

- **Now, no gate** (orchestrator; research only, nothing built): P5-37 (Templates and Synergies sheet: **draft written**, `docs/PHASE-6-SHEET-BUILD-TEMPLATES.md`, 20 Templates and 18 Synergies, awaiting Athos), P5-38 (Places sheet: **in progress**, `docs/PHASE-6-SHEET-PLACES.md`), P5-46 (which entries cost Shell Shards).
- **Gate G2: Athos reviews this contract text** (sections 1, 2, 2a, 3, 5, 6 and 7 of `docs/CONTRACTS.md`, ADR 0007, the glossary). Everything below waits for it.
- **Wave 1, in parallel right after G2** (all different files): P5-31 (Dev B, mockups), P5-40 (Dev B, loaders), P5-32 (QA 1, validator), P5-33 and P5-34 (Dev A, two worktrees), P5-35 (QA 1, tests), P5-45a and P5-45b (Dev A and QA 1, cleanup). Merge order inside the wave: P5-40; P5-32; P5-33 then its half of P5-35; P5-34 then the other half; P5-45a then P5-45b straight after.
- **Gate G3: Athos approves the P5-31 mockups.** The orchestrator then updates `docs/DESIGN.md` (Region page Places section, Rosaries "Sold by", Build picker Templates and Synergies).
- **Wave 2** (after P5-32 merged): P5-36 (orchestrator, sample files); P5-43 (Dev C, Places for Act 1, once sheet 5 part 1 and its id list are approved); P5-39 (Dev C, `data/builds.json`, once sheet 4 and its id list are approved). Data can land before the pages: no page reads the files until P5-41 and P5-42. Dev C's merges go one at a time, because each raises `dataVersion` in every file.
- **Wave 3** (after G3, P5-36 and P5-40; P5-41 also after P5-33, P5-42 also after P5-34): P5-41 and P5-42 in parallel (Dev B, two worktrees). Both add to `render.js`: each keeps its code in its own new functions; the second to merge rebases on the first, and a conflict goes back to Dev B.
- **Wave 4:** P5-47 (QA 2 pass); P5-44 (Places for Acts 2 and 3, after sheet 5 part 2 is approved).
- **Any time after Athos's go on the Vesticrest facts** (independent of G2, because `grantsSlots` is already contracted and checked by rule 13): P5-48 (Dev C, the two Vesticrest entries), then the 8 Vesticrest Templates join `builds.json`.

Nothing in P5-31 to P5-47 changes Home, the Route page, the Trackers page, the Account page, `routeIds`, any count or any Progress field except the removal of the always-false `tookShellShards` key.

### P5-30 (orchestrator): the contract (this task)

- **Files:** `docs/CONTRACTS.md`, `docs/STRUCTURE.md`, `GLOSSARY.md`, `docs/AGENT-PLAN.md`, this plan, `docs/adr/0006-player-choices-in-progress.md`, new `docs/adr/0007-build-templates-and-places-in-their-own-data-files.md`.
- **Still to do by the orchestrator after Athos's review** (files this task could not touch): `docs/adr/0001-local-first-progress-with-union-merge.md` (its addendum still names `shellShards`), `.claude/rules/data.md` (MapGenie citation rule; the two new files), `docs/PROGRESS-LOG.md`; and, with Athos's go-ahead, `CLAUDE.md` rule 1 (add Place, Template, Synergy to the glossary words).

### P5-31 (dev-b): mockups for Places, Templates, Synergies and "Sold by"

- **Goal:** mockups before code, as for every Phase 5 screen. Invented content only (never names from `data/` or the sheets).
- **Files:** new files in `docs/design/trackers/` only (`addendum-places-*`, `addendum-templates-*`), plus removing the provisional Shell Shards place from the existing addendum mockups (10 lines mention it).
- **Scope:** (1) Region page, "Places in this region": groups per `kind`; a bench, a Bellway station, an NPC; a shop with its stock (priced, unpriced, one "Bought"); a Place that "Needs X"; the Visited, not Visited (hidden), Locked with "Show everything" and "no entries but Places" states; phone at 390 and 320px. A Place row must not look tickable. (2) Rosaries page: "Sold by A in X", two vendors, and "Sold in a region you have not visited", in a row and in "Next to buy". (3) Build picker: the Crest's Templates (ready, needs X with one hidden name, needs more slots), "Our suggestion" versus "From a guide", Source links, "Use as my Build" with and without unsaved changes (how the page asks), the draft after using one (left-out ids announced, an id with no slot), "Works together" and "Pairs well with". Reuse the T30 "Guide suggestion" styling where it fits. Say whether the Build picker needs a "Show everything" switch for hidden names, with two options if unsure; do not choose.
- **Done when:** desktop and phone screenshots as in T30 and P5-10; Athos approves (G3).

### P5-32 (qa-tests): validator rules 1, 2, 10, 15 and 16

- **Files:** `scripts/validate-data.js`, `tests/validate-data.test.js` (QA 1).
- **Exact changes:** as `docs/CONTRACTS.md` section 6 says. The two files are read only when present; their `dataVersion` joins rule 1 and their ids join rule 2. Rule 15 imports `checkBuild` from `../js/builds.js` (plain module, no imports) and runs its fit check only when rules 1 to 5 and 13 found no error; "every slot opened" means passing `{ [crestId]: slotsMax - slots per colour }` as `crestSlots` and every entry id as `doneSet`. Rule 16 includes the MapGenie address warning for every `source` in every file. Update the header comment's rule list.
- **Tests** (temporary copies of `data/sample` with files written by the test; never `data/`): no new file gives no new message; each rule 15 error alone (unknown `crestId`; a non-Crest; a Crest without `slotsMax`; an unknown colour key; an empty list; 13 ids; an id twice across colours; an upgrade id; a Region id in `build`; a blue Tool under `red`; one id more than the Crest holds at its most; missing `editorial`; a bad `source`); a Template that fits only with every slot opened passes; one that fits only thanks to a `grantsSlots` entry passes; the duplicate-Template warning; `goal` and synergy `effect` length warnings; each synergy error (`a` equal to `b`; the same pair reversed; a Crest as `a`; an upgrade; unknown id); with a rule 13 error present, rule 15's fit check is skipped and nothing crashes. Rule 16: unknown `kind`; unknown `regionId`; a Region id in `requires`; `sells` on an `npc`; empty `sells`; an id twice in `sells`; an unknown id in `sells`; a Place id equal to an entry id (rule 2); a `dataVersion` that differs (rule 1); `how` over 300 (warning); a MapGenie Hollow Knight address on an entry's `source` (warning) and a Silksong one (no warning).
- **Done when:** all tests pass, and `node scripts/validate-data.js` and `node scripts/validate-data.js data/sample` print exactly what they print before the change (`0 warning(s)` on 2026-10-20).

### P5-33 (dev-a): `missingForPlace`

- **Files:** `js/requirements.js` only. **Exact change:** `export function missingForPlace(place, doneSet, items, regions)` as section 2 says, reusing the walk `missingFor` uses (the place's own `requires` plus `requirementsOfRegion(place.regionId)`); a comment says why it takes an object. Nothing else changes.
- **Done when:** `node --test "tests/*.test.js"` passes with no test edited; both validator commands unchanged; a throwaway script prints `missingForPlace` for three invented Place objects against `data/sample` (empty `requires` in an open Region, one in a Locked Region, one with a chain); paste the output.

### P5-34 (dev-a): `fitTemplate`, `synergiesIn`, `synergyPartners`

- **Files:** `js/builds.js` only. **Exact changes:** as section 2a says; `fitTemplate` builds on `ownedIds` and `checkBuild` (no second copy of the rules). Nothing else changes.
- **Done when:** tests pass with none edited; a throwaway script prints the three results for invented templates and synergies against `data/sample` (one ready, one with a missing id, one with an id past the slots); paste it.

### P5-35 (qa-tests): tests for P5-33 and P5-34

- **Files:** `tests/requirements.test.js`, `tests/builds.test.js` (QA 1). Written against the contract while P5-33 and P5-34 are built; each half merged straight after its function.
- **Cases:** the third-round sentences under "Rules the tests must cover" in sections 2 and 2a.
- **Done when:** all pass after both merges; the handoff lists each case.

### P5-36 (orchestrator): sample files

- **Files:** new `data/sample/builds.json` and `data/sample/places.json`; `dataVersion` raised in every sample file. **After** P5-32 is merged.
- **Scope:** invented content only, on the sample Crests that already have `slots` and `slotsMax`: a Template ready with nothing opened, one that needs an opened slot, one that needs a `grantsSlots` entry, one with an id that is off the Route, one `editorial: false`; two Synergies (one that can be active, one that only pairs). Places of every `kind` across at least three sample Regions, including a Locked one and an unvisited one; two shops that sell the same priced entry; a shop selling an unpriced entry; a Place with a two-step `requires`; one `source` on the MapGenie Silksong path (a link only, never opened).
- **Done when:** `node scripts/validate-data.js data/sample` gives no error and no warning, and the tests pass (pinned sample numbers do not move: the new files change no count).

### P5-37 (orchestrator): sheet 4, Templates and Synergies (research)

- **File:** `docs/PHASE-6-SHEET-BUILD-TEMPLATES.md` ("sheet 4" below; **draft written 2026-10-20**: 20 Templates, 18 Synergies, search results only, checked against `data/` at `dataVersion` 10). Web search results only; never hollowknight.wiki, Fextralife or MapGenie. What the draft found that shapes the data: 8 Templates fit only with the Vesticrest slots, which no entry grants yet (P5-48); two ids are missing from `data/` (`pale-nails`, `egg-of-flealia`); one Synergy is stated by its sources only for the upgrade (Curvesickle), so with the base id `curveclaw` it is a weaker claim.
- **Scope:** per Crest: Builds that guides recommend (candidates for `editorial: false`, with the page) and our groupings (`editorial: true`, each Tool justified by the `effect` already in `data/`); Synergy pairs only where one page names both Tools and the effect; every Tool must have an undisputed `toolColor` in `data/`. Disputed facts are flagged, never used. Proposed ids. For each Template, which slots it uses and whether any of them is one sheet 1 disputes (so Athos can hold it back).
- **Done when:** Athos approves the sheet and its id list.

### P5-38 (orchestrator): sheet 5, Places (research)

- **File:** `docs/PHASE-6-SHEET-PLACES.md` ("sheet 5" below; **in progress**, a skeleton on 2026-10-20), in two parts: Act 1 Regions first, then Acts 2 and 3, so Dev C can start on part 1.
- **Scope:** per Region: benches, Bellway stations, shops (from sheet 2 section 3, with `sells` mapped to existing entry ids), NPCs worth finding, wish boards, and other fixed spots the guides name; `requires` as existing entry ids (only what a source says gates it); proposed ids in the `<kind>-<name>` form; a source per Place; conflicts flagged. A MapGenie link only if Athos supplies one. Nothing that is already an entry is repeated as a Place.
- **Done when:** Athos approves each part and its id list.

### P5-39 (dev-c): `data/builds.json`

- **Files:** new `data/builds.json`; `dataVersion` raised in every `data/` file. **Depends on:** sheet 4 and its id list approved; P5-32 merged.
- **Scope:** only Templates whose ids are all in `data/` (Tools with a `toolColor`, Silk Skills), that fit with the `grantsSlots` entries already in `data/`, and that Athos did not hold back for a disputed slot; only Synergies whose two Tools have a `toolColor`. Everything else in the sheet waits for the entries it needs (the 8 Vesticrest Templates for P5-48; those using `pale-nails` or `egg-of-flealia` for the batch that adds them), and joins `builds.json` in a later small task.
- **Done when:** validator clean on both folders; tests pass; a throwaway script prints `fitTemplate` for each Template with nothing done and with everything done; the handoff maps each record to its sheet row.

### P5-40 (dev-b): the two loaders

- **Files:** `js/data.js` only. **Exact change:** `loadPlaces()` and `loadTemplates()` as section 5 says (same folder logic, same `loadFile`; a 404 resolves with empty lists; other failures reject with `DataLoadError`). `loadData()` unchanged.
- **Done when:** tests pass; served locally, both resolve to empty lists today (no files), and a page that does not call them makes no new request (check the network panel and say so).

### P5-41 (dev-b): Places on the Region page; "Sold by" on the Rosaries page

- **Files:** `js/main.js` (Region branch only), `js/render.js` (new functions for the Places section and the "Sold by" line), `js/rosaries-page.js`, `css/components.css` (Places rows), `css/trackers.css` ("Sold by" line) if needed.
- **Depends on:** G3, P5-33, P5-36 and P5-40 merged.
- **Scope:** section 5, "Region page" and "Rosaries page" bullets. Places come from `loadPlaces()` after `loadData()`; "Needs X" from `missingForPlace`; a failed load shows one line and nothing else breaks.
- **Done when**, served locally with `?data=sample` (say what you looked at): each sample Region shows its Places grouped by `kind` only when its entries are shown; a Place row has no toggle and is skipped by the entries' keyboard order; a shop shows its stock, prices and "Bought" after ticking that entry; "Needs X" disappears once X is ticked; the anchor link from the Rosaries page lands on the row; the Rosaries page names both vendors of the shared entry and hides a vendor in an unvisited Region; every count, Region card, "Next on the route" and Route number is the same as before; nothing scrolls sideways at 390px; tests and both validators pass. With `data/` (no `places.json` yet, or with P5-43's file) the Region page looks exactly as before or with its Places, nothing else.

### P5-42 (dev-b): Templates and Synergies on the Build picker

- **Files:** `js/builds-page.js`, `js/render.js` (new functions for the Templates and Synergies parts), `css/trackers.css`.
- **Depends on:** G3, P5-34, P5-36 and P5-40 merged.
- **Scope:** section 5, "Build picker" bullets. "Use as my Build" writes only the draft; saving stays the player's own action through `setBuild`.
- **Done when**, with `?data=sample`: each sample Template shows the right standing (ready, needs, needs more slots) as ids are ticked and slots opened; "Use as my Build" fills the draft without saving (reload: the saved Build is unchanged), asks first when there are unsaved changes, announces left-out ids; a hidden name stays hidden; "Works together" and "Pairs well with" follow the draft; without `builds.json` (`data/`) the page is exactly as before; tests and validators pass.

### P5-43 (dev-c): `data/places.json`, Act 1 Regions

- **Files:** new `data/places.json`; `dataVersion` raised in every file. **Depends on:** sheet 5 part 1 and its id list approved; P5-32 merged.
- **Done when:** validator clean; tests pass; a throwaway script prints, per Region, the number of Places by `kind`, and `routeIds(...).size` and every `regionProgress` before and after (unchanged); the handoff lists every MapGenie `source` as not opened.

### P5-44 (dev-c): Places for Acts 2 and 3

- Same as P5-43 for sheet 5 part 2.

### P5-45a (dev-a) and P5-45b (qa-tests): the `shellShards` cleanup

- **P5-45a files:** `js/progress.js` (drop `tookShellShards` from the import result; header comment and the comment near `importProgress` say `shellShards` is dropped, ADR 0007), `tools/sync-rehearsal.mjs` (the expected import result), `firestore.rules` (comment only: the key is refused because the field is dropped; **no behaviour change**, so nothing to publish; the published copy differs only in a comment).
- **P5-45b files:** `tests/progress.test.js` (expected results without `tookShellShards`), `tests/firestore-rules.test.js` (the "TEMPORARY ... flip this" refusal test becomes a permanent one; its assertions stay).
- **Merge:** P5-45a then P5-45b straight after (between them the `deepEqual` tests fail, as in P5-25 and P5-26).
- **Done when:** `node --test "tests/*.test.js"`, the Emulator rules tests and the sync rehearsal pass (commands in `CLAUDE.md`).

### P5-46 (orchestrator): which entries cost Shell Shards (research)

- **File:** a short section added to sheet 2 or a note in `docs/research/`. Confirm (two sources) which things the player pays in Shell Shards (sheet 2: the Bone Bottom Donate wishes, one source), whether they are or should be entries, and the amounts. Then a contract proposal (section 8: `shardPrice` and `shellShardsToSpend`) for Athos. Nothing is built before he answers.

### P5-48 (dev-c): the two Vesticrest entries

- **Why:** 8 of sheet 4's Templates fit only with the Vesticrest slots (sheet 1 section 4: Eva gives a yellow slot, later a blue one, to every Crest). Without entries carrying `grantsSlots`, rule 15 rejects them, and the Build picker undercounts the slots of every player who has them.
- **Files:** `data/items.json`, `dataVersion` in every file (Dev C). **Depends on:** Athos's go on the facts: the slot colours (yellow, then blue) are agreed by the sources; Eva's thresholds are disputed (sheet 1 point 9), so the two entries' `how` must not state a threshold Athos has not confirmed.
- **Scope:** two Collectible entries with `counts: false` (one entry per thing: the player obtains them, and sheet 1 lists the Vesticrest among the tracked-only extras), `grantsSlots` `{ "yellow": 1 }` and `{ "blue": 1 }`, the second requiring the first only if the sources agree it always comes later, in Weavenest Atla, with sources. Their `type` needs a place on rule 12's tracked-only list first (a one-line QA 1 change, like P5-15), or rule 12 warns. Ids proposed by the orchestrator and approved by Athos before the merge (permanent).
- **Done when:** validator clean; tests pass; `slotsFor` for each Crest with both entries done is one yellow and one blue higher than without (throwaway script, pasted); the Build picker shows the extra slots.

### P5-47 (qa-manual): pass on the Region, Rosaries and Builds pages

- **Depends on:** P5-41 and P5-42 merged. With `data/` and `?data=sample`: Places, "Sold by", Templates and Synergies against the approved mockups and section 5; keyboard, screen reader names, 390 and 320px; and that Home, Route, Trackers and Account did not change. Findings in `qa/reports/`.

### Risks of the third round

- **Templates on disputed layouts.** Every Crest in `data/` has a layout, but sheet 1 disputes some of them; a Template that relies on a disputed slot would be wrong if the layout is. Sheet 4 marks those Templates so Athos can hold them back; a later layout fix makes rule 15 flag any Template that stops fitting.
- **Weak sources.** The research so far rests on search results; a Synergy needs a page that names both Tools, which search snippets often do not show. Expect few Synergies at first; none is better than an unsupported one.
- **MapGenie links cannot be checked** by anyone but Athos. Each handoff lists them; the validator only checks the address form.
- **Spoilers** through Template "needs" lists, Synergies and "Sold by". The contract hides names in unvisited Regions; QA 2 checks it.
- **Two Dev B branches both add to `render.js`** (P5-41, P5-42). Each keeps its code in new functions; merged one at a time; the second rebases.
- **`dataVersion` churn.** Each of P5-39, P5-43 and P5-44 raises it in all five files, so Dev C's branches merge one at a time and the later one raises the number again after rebasing.
- **Permanent ids.** Place, Template and Synergy ids are permanent once pushed (pages link to them); each sheet's id list is approved by Athos before its data merges.
- **A Place that repeats an entry** (a boss arena next to the boss Task) would show the same thing twice. Sheet 5 and P5-43 check against `items.json`; the contract forbids it.
- **Nothing shows Shell Shards yet** after the drop, until P5-46 and a follow-up contract. Athos should know the Rosaries page has no Shell Shards line in the meantime.
