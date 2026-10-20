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
