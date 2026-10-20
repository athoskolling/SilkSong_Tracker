# Phase 5, sheet 2: Mementos, Equipment and shops (orchestrator's research, 2026-10-20)

**Status: draft, being written.** Research for briefs P5-15, P5-16 and P5-18 in `docs/PHASE-5-FULL-TRACKER-PLAN.md`. **This is research, not data.** Nothing here goes into `data/` until Athos approves this sheet and checks the facts. Names are the game's names; every description is in our own words.

**Spoiler warning:** names late-game areas, bosses, wishes and rewards.

## How this was researched, and its limit

- **Search results only.** One page fetch was tried, as asked: `https://game-checklists.com/silksong/all-mementos.html`. It failed (`getaddrinfo ENOTFOUND game-checklists.com`), the same failure as in the sheet 1, Act 2 and Act 3 sessions. No guide page was opened. Every fact below is what one or more search results said. hollowknight.wiki and Fextralife were never fetched; where their text appears, it is their text **as quoted in a search result**, marked "wiki (snippet)" or "FX (snippet)". MapGenie was not used. Reddit threads did not come up in the results that mattered; one Steam discussion did (marked).
- **No facts from memory.** Where the results say nothing, the cell says "not found".
- **Marks.** After each fact, the codes of the sources that said it (list at the end). **One code = one source only: unconfirmed.** "Conflict" gives both readings. `low` marks thin or copied sites; they never decide a conflict. A price is **confirmed** only when two independent sources give the same number (a guide and the wiki snippet, or two guides).
- **Ids, Regions and steps are proposals.** Region ids from Acts 2 and 3 are not fixed yet, so they are written `A2: <Region name>` as in `docs/PHASE-3-ACT-3.md`. Act 3 entry ids (`everbloom`, `silk-soar`, `nyleth` and so on) are the ones proposed in that sheet.

## 1. Mementos

**What they are.** Trophies shown on the shelves of Hornet's Bellhome in Bellhart, once a desk is installed there [wiki (snippet) for Hero's, Guardian's and Sprintmaster; FX (snippet) for Hunter's; DS-M, GC-BH]. **They do not count toward 100 percent**: MIL ("not required to reach 100 percent"), NC-HM (Hunter's Memento "does not directly contribute" to 100 percent), GC-M ("none are required for any achievement"; the Guardian's Memento "not required for any progression or achievement", wiki (snippet)). No source says they count. **Proposal: type `memento`, `counts: false`, Mementos tab.**

**How many.** Sources give 8, 9 and 11, and the numbers fit together (our reading, Athos to check): **7 fixed Mementos plus 1 of 4 "heart" Mementos**. The Old Hearts wish needs three Old Hearts; the optional fourth boss (the Clover Dancers) gives a fourth, and the heart left over after the ritual becomes a Memento. Which heart is left decides which Memento: Conjoined, Encrusted, Pollen or Hunter's Heart. So 11 names exist (GC-M "All 11 Mementos", GC-MG names the Pollen and Hunter's Heart versions), 9 appear in guides that only describe Conjoined versus Encrusted (SC-M, TGS-M, DS-M), and **8 can be owned in one run** (PCG-M, DG-M, NC-M: "eight", "collect 8 total"). Conflict: FD (low) says collecting all four hearts turns one into a Memento whatever the order; DS-M and GC-MG describe it as the player's choice of which heart to hand in. Same result for the tracker either way: one heart Memento per run.

**All Mementos are Act 3** (PCG-M, NC-M, GR-M "you'll have to reach Act 3 first"). So every row below gets an Act 3 step (2000 and up). Steps are placed after the Act 3 sheet's entries they need, using the free numbers between its tens.

| Memento | How and where (our words) | Region (Sub-area) | requires (proposal) | Sources | id (proposed) | step |
|---|---|---|---|---|---|---|
| Grey Memento | Silk Soar to the far west edge of the Sands of Karak; a dormant statue there, the Watcher at the Edge, wakes when you play the Needolin. Beat it. | A2: Sands of Karak | `silk-soar`, `needolin` | DG-M, NC-WE, SC-M, G8-M, wiki (snippet). **Conflict on the spot:** "near the Coral Tower" (one guide) versus far west of the Sands; the Act 3 sheet also has Blasted Steps [DG-WE] versus Sands [NL-BOSS] | `grey-memento` | 2045 |
| Craw Memento | With the Craw Summons, open the door at Craw Lake in Greymoor and go through the tunnels to the Court of Craws; beat the Crawfather after waves of Craws. Also gives the Crawbell (Bellhome furniture). | Greymoor (Craw Lake) | `everbloom` (GC-M: available after the Everbloom) | DG-M, PCG-M, G8-M, GC-M, AT-CS, DG-CF. **Conflict on how the Craw Summons appears:** near a bench after finishing the Dark Hearts wish [DS-M, one more]; check Bellhart [TGS-M]; after four specific Hunter's Journal entries, the last only in Act 3 [AT-CS] | `craw-memento` | 2125 |
| Hero's Memento | The Hero's Call wish (Bellhart Wishwall): find and beat Lost Garmond in the Blasted Steps, then talk to him. | Blasted Steps | `everbloom` (conservative; see conflict) | DG-M, G8-M, GR-M, DS-M, wiki (snippet). **Conflict on the trigger** (also in the Act 3 sheet): three meetings with Garmond and Zaza, or after the Old Hearts and the Red Memory [DS-M: "the best way to make sure it appears"] | `heros-memento` | 2095 |
| Sprintmaster Memento | Beat Sprintmaster Swift in Far Fields a fourth time. The fourth race is offered only once Hornet has the Everbloom; if it does not start, rest at another bench and come back (a player report). | Far Fields | `mask-shard-sprintmaster`, `everbloom` | wiki (snippet), FX (snippet), PCG-M, G8-M, STEAM-SP. **Conflict on the race:** "six laps" [DS-M] (not found elsewhere) | `sprintmaster-memento` | 2105 |
| Guardian's Memento | Beat Shrine Guardian Seth, then meet him again west of Craw Lake (Greymoor), east of the Shellwood Bellway and at the Grand Gate; once Ecstasy of the End is done he waits in Fleatopia. Beat all his high scores in the Festival of the Flea games (a tie does not count). | A2: Putrified Ducts (Fleatopia) | `nyleth` (Seth is folded into it), `pale-steel-needle` (Ecstasy of the End is folded into it) | wiki (snippet), DG-M, G8-M, NC-M, AT-SETH, GG-GM. **Conflict:** FX (snippet) says beat Seth in Shellwood and nothing about the games. **Possibly missable (single source, wiki (snippet)):** Seth is at the Grand Gate "until the Everbloom has been obtained" | `guardians-memento` | 2155 |
| Surface Memento | Reach Nameless Town, the hidden place above The Cradle (Act 3, Silk Soar). In the ruined house on the right, play the Needolin by a corpse until the Memento falls from the ceiling. | A2: The Cradle (Nameless Town) | `silk-soar`, `needolin` | SC-M, G8-M, NC-M, wiki (snippet) for the town. **Conflict:** "after the Passing of the Age quest" [DS-M]; the route up differs (near the Pale Nails spot [wiki (snippet)] or from the Grand Mother Silk arena [NC-NT, BYD-NT]) | `surface-memento` | 2175 |
| Hunter's Memento | Fill the Hunter's Journal, then talk to Nuu in her hut (Halfway Home) in Greymoor. Farsight, built from an item in Weavenest Absolom, shows how many entries are left. | Greymoor (Halfway Home) | `lost-lace` placeholder: "every Journal entry" cannot be written as `requires`; see open question M3 | FX (snippet), wiki (snippet), NC-HM, GC-HJ, AT-HJ, DS-M. **Conflict on the count:** 230 entries in Classic, 231 in Steel Soul [wiki (snippet)], 235 [NC-HM], up to 237 in others. Tied to the True Hunter achievement [NL-ACH, NC-HM] versus "none are tied to achievements" [GC-M] | `hunters-memento` | 2185 |
| Heart Memento (one of four) | Beat all four Old Heart bosses (Crust King Khann, Nyleth, Skarrsinger Karmelita and the Clover Dancers in Lost Verdania, entered by the Elegy from Craw Lake). Hand three to the Snail Shamans; the heart you keep becomes its Memento: Encrusted Heart (Khann), Pollen Heart (Nyleth), Hunter's Heart (Karmelita) or Conjoined Heart (Clover Dancers). | Moss Grotto (Ruined Chapel), where the hearts are handed in; see M2 | `everbloom` plus the Clover Dancers (not an entry today; see M2) | DG-M, GC-M, GC-MG, SC-M, DS-M, BYD-CH, wiki (snippet) for the Old Hearts. Pollen and Hunter's Heart versions: GC-MG only | `old-heart-memento` | 2092 |

**Not Mementos, though one site lists them near:** the Crawbell (Bellhome furniture from the Craw fight [DS-M]) and the Materium (an item catalogue, section 2). The hollowknight.wiki address `/w/Memento` redirects to its Materium page (search result title), so a search for "Memento" there finds the Materium.

**Open questions on Mementos (Athos):**

- **M1.** One entry for the heart Memento (`old-heart-memento`, done when you have whichever heart you kept) or four entries (one per heart, so the tab shows 11 with 8 reachable)? Recommendation: **one entry**, because the Mementos tab's done and total should read 8 of 8 for a complete run, and four entries would need a "one of" rule the contract does not have (sheet 1's `oneOf` was never adopted).
- **M2.** The Clover Dancers are not an entry (the Act 3 sheet folded them away because `requires` can only say "all of"). For the heart Memento they are needed. Options: (a) add a Task `clover-dancers` (boss, Greymoor, Lost Verdania, Act 3) and require it; (b) fold it into the Memento's `how`. Recommendation: (a), so the Route shows the fight before the Memento. Proposed step for (a): 2085, before `everbloom` at 2090 (the Clover Dancers need only the Elegy [Act 3 sheet]).
- **M3.** The Hunter's Memento needs a full Hunter's Journal, which the data does not model (Journal entries are not tracked). Recommendation: no `requires` beyond its Region's, a `how` that says so, and the last step of Act 3 (2185, after `lost-lace`, only if Athos confirms the game continues after that ending; otherwise 2178).
- **M4.** The Guardian's Memento may be missable (Seth leaves the Grand Gate after the Everbloom; one source). If Athos confirms it, `missable: true` with that note, and a Route note before `everbloom`.

## 2. Other tracked-but-not-counted things

(being written)

## 3. Shops

(being written)

## 4. Already in `data/items.json` versus new

(being written)

## 5. Brief for Dev C (P5-16 and P5-18)

(being written)

## Sources

(being written)
