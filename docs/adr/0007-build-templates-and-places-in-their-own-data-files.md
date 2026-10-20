# Build templates, synergies and Places live in their own data files; Shell Shards leave Progress

Decided from Athos's answers of 2026-10-20 (Phase 5, third round, relayed to the orchestrator; the contract text awaits his review). It reverses two answers given earlier the same day: "no Build templates" (second answers, point 6, in `docs/PHASE-5-FULL-TRACKER-PLAN.md`) and "points of interest stay optional, after everything else" (`docs/STRUCTURE.md` section 3). It also drops the provisional `shellShards` field of ADR 0006. Exact shapes: `docs/CONTRACTS.md` sections 1, 2, 2a, 5, 6 and 7.

## Context

Athos now wants three things Hollow-Thingy has: Build templates per Crest, synergies between Tools (each with a source), and points of interest per Region (benches, Bellway stations, shops, NPCs, wish boards). He also allows a MapGenie link as a `source` when needed. For Shell Shards he chose the second reading of his earlier answer: like the Rosaries, the number comes from entries, not from a number the player types.

None of the three new kinds of content is "a thing the player obtains or does", so none of them fits the entry model (`kind`, `step`, `requires`, done in Progress) without exceptions.

## Decision

1. **`data/builds.json`** holds `templates` (a suggested Build for one Crest: name, `goal`, the ids per colour in the same shape as a saved Build, `source`, `editorial`) and `synergies` (two entry ids, an `effect` in our words, a `source` that names both).
2. **`data/places.json`** holds `places`, each a **Place** (glossary): a bench, Bellway station, shop, NPC, wish board, arena, door or other fixed spot in a Region, with `requires` (what is needed to reach it, same meaning as on entries), a `source`, and for a shop the entry ids it `sells`.
3. **Links point one way.** Both new files point at entries in `items.json`; `items.json`, `regions.json` and `endings.json` never point at them. So the current data stays valid with no edit, a page that does not load the new files is unchanged, and a late or missing file breaks nothing.
4. **One `dataVersion` for the whole of `data/`**, as before: when the new files exist they carry the same number, and any content change in any file raises it in all of them. **Ids are unique across all five files.**
5. **No Progress.** A Place is never done; a template is never stored (using one copies its ids into the Build picker's draft, and only the player's own "Save this Build" writes, through `setBuild`). Nothing in either file changes counts, Availability, Visited or the Route.
6. **The same arithmetic everywhere.** The validator checks each template with `checkBuild` and `slotsFor` from `js/builds.js` at "everything done, every slot opened", exactly as the picker will check it for a player, so the two can never disagree (the same reason rule 14 imports `routeIds`). Whether a Place can be reached is `missingForPlace` in `js/requirements.js`, the same chain walk as for entries; the interface never walks `requires` itself.
7. **MapGenie is a citation only.** `CLAUDE.md` rule 9 stands: agents never scrape or fetch MapGenie. A link is not a copy, so a link to its Silksong map may be a `source`, but only to cite *where* something is, never as the origin of text we write, and the project cannot check what that page shows.
8. **`shellShards` is dropped from Progress.** No field, no setter, no Firestore rules change (the published rules already refuse the key). What the site shows about Shell Shards is worked out from entries, like the Rosaries; which entries and which field is open until research confirms them.

## Why separate files and not fields on entries

- A template groups several entries and belongs to none of them. On the Crest entry it would put editorial text into `items.json`, which every page loads, and tie every template edit to a Crest edit. A synergy is a pair: on an entry it would be written twice, or on one side chosen arbitrarily.
- A Place is not obtained and not done. As an entry (a Task, or a third `kind`) it would need a `step`, could be ticked, would go into Progress, the Trackers and the Route, and every existing function (`isCounted`, `routeIds`, `nextStep`, the counts) would need a "but not a Place" exception. A separate file leaves every existing contract as it is.
- Only the pages that use the files load them (Region, Rosaries, Builds). Home, Route, Trackers and Account are unchanged.
- `sells` sits on the shop Place rather than a `soldAt` on the entry because of point 3 (links point one way), because shop research is written per vendor (sheet 2, section 3), and because an entry sold in two places (Mort's Memory Locket, also sold by Grindle in Act 3) is simply listed by both.

## Rejected alternatives

- *Templates as a field on Crest entries.* Rejected for the reasons above; synergies could not go there at all.
- *Places as entries.* Rejected: see above. Hollow-Thingy made the same split (its points of interest never duplicate a checklist item).
- *A separate `dataVersion` per file.* Rejected: Progress records one version, the Account page shows one, and rule 1 already enforces one. The cost is that a Places batch also edits the version line in the other files.
- *No validation of templates, checked by hand.* Rejected: a template that does not fit its Crest would be shown to every player; the validator can prove it fits with the picker's own code.
- *A Places page with a seventh header link now.* Not chosen: the phone header grid is built for six links (3 + 3). The Region page and the Rosaries page are where Places are needed; an all-Regions view is left to Athos (`docs/CONTRACTS.md` section 8).
- *Keep `shellShards` as a typed number.* Rejected by Athos; it would go stale as soon as the player spends in the game (the same reason ADR 0005 gave for Rosaries).

## Costs

- Two more files to load, validate and keep in step, and a version line to raise in five files for every content change.
- **Templates depend on Crest layouts.** A template can only be checked against a Crest that has `slots` and `slotsMax` in `data/`. Today no Crest has them (several layouts are disputed, sheet 1 section 5), so no real template can ship until Athos clears the Crest layouts he trusts.
- **Spoilers.** A template's "needs" list, a synergy and a shop's stock can name entries in Regions the player has not Visited. The pages apply the entry rule (hidden until Visited, unless the player shows everything) to those names too.
- A MapGenie `source` cannot be checked by anyone but Athos, in a browser.
