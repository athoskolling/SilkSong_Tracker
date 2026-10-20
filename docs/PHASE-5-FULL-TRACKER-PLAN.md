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

**What this replaces above.** Answer 2 drops item 3 of "Proposed approach" (a numbers block in Progress) and the "numbers in Progress" part of step 2 of "Order of work". Progress stays ids only, so there is no ADR 0001 addendum and no sync change. ADR 0005 records why. The text above is kept as the record of what was proposed.

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
