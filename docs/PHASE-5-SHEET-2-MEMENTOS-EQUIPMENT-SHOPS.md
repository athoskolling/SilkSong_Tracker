# Phase 5, sheet 2: Mementos, Equipment and shops (orchestrator's research, 2026-10-20)

**Status: draft for Athos's review (complete as far as search results allow).** Research for briefs P5-15, P5-16 and P5-18 in `docs/PHASE-5-FULL-TRACKER-PLAN.md`. **This is research, not data.** Nothing here goes into `data/` until Athos approves this sheet and checks the facts. Names are the game's names; every description is in our own words.

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

### 2.1 What kinds exist (from the sources)

The game's own item menus, as the guides describe them, have Tools, Crests, abilities, key items, relics, maps and materials; the Bellhome adds furniture ("housing items") and the Materium, a catalogue of materials and other things collected [FX (snippet) Items, Key Items and Housing Items; wiki (snippet) Items (Silksong); G8-MAT; GG-KI]. None of the kinds below counts toward 100 percent (GLOSSARY.md, Athos 2026-10-20: the counted list is closed); the Cartographer achievement needs every map [GR-MAP, NL-ACH] but the maps do not add to the percentage (no source says they do).

| Kind | What it is (our words) | How many | Sources |
|---|---|---|---|
| **Relics** | Old objects found around Pharloom, sold to Relic Seeker Scrounge (Bellhart) for Rosaries; Psalm Cylinders go to Vaultkeeper Cardinius instead. Turned-in relics can be seen at the Bellhome desk [TG-BH]. Kinds: Weaver Effigy, Bone Scroll, Rune Harp, Choral Commandment, Psalm Cylinder, Sacred Cylinder, Arcane Egg | **21**: 5 Psalm Cylinders + 1 Sacred Cylinder, 4 Bone Scrolls, 3 Weaver Effigies, 3 Rune Harps, 4 Choral Commandments, 1 Arcane Egg | GG-REL ("All 21 Relics"), GC-COL, G4G-REL, GR-REL. VG (low) uses other names and places; ignored |
| **Maps** | One map per area, mostly sold by Shakra; Citadel areas from machines, a few found free | **28** for the Cartographer achievement [GR-MAP]; FX (snippet) shows 25 area names | GR-MAP, G8-SH, DS-MAP, GC-MAP, PCG-MAP, FX (snippet) |
| **Map tools** | The Quill (draws visited rooms on bought maps), and pins and markers sold by Shakra (Bench, Bellway, Ventrica and Vendor Pins; Shell, Ring and Dark Markers) | 1 Quill + 7 named pins and markers | G8-SH, VEN-GRP, wiki (snippet) Map Pins, Map and Quill |
| **Memory Lockets** | Open one locked Crest slot each (sheet 1) | **20** | sheet 1; G8-ML, GS-ML, NC-ML, G4G-ML |
| **Keys** | Simple Keys (4, break after one use; 2 bought, 2 found [G8-SK, PCG-SK]); White Key, Surgeon's Key, Key of Apostate, Key of Indolent, Key of Heretic (the Slab), Architect's Key, Bellhome Key, Diving Bell Key (Act 3 sheet), Gate Key (FX only) | about 13 | FX (snippet) Key Items, wiki (snippet) Items (Silksong), GBT-KI, G8-SK |
| **Other key items** | Story objects that open something: Craw Summons (opens the Craw Lake door, Act 3), Ruined Tool (repaired into one Silkshot, sheet 1), Cogheart Piece and Cogwork Heart (FX only; not described), Needle Phial (sheet 1), Pale Oil (spent on Needle upgrades) | open list | FX (snippet), wiki (snippet), sheet 1 |
| **Bellhome furniture** | Bought from Frey once you own the Bellhome: Desk, Gleamlights, Bell Lacquer, Personal Spa, Gramophone; also the Crawbell (Craw fight reward), the Materium (built from a find in the Memorium) and Farsight (built from a find in the Abyss, Act 3; shows the completion percentage) | 5 bought + 3 found | TG-BH, DS-BH, TGS-BH, SK-BH, DG-BH, SR-V, FX (snippet) Farsight, Materium; DS-M |
| **Fleas** | 30 lost fleas to rescue for the Flea Caravan; the last gives the Egg of Flealia (a counted Tool, sheet 1 says 29: **conflict**) | **30** | NC-FL, NL-FL, wiki (snippet) The Lost Fleas, G4G-FL |
| **Not tracked** (consumables and materials) | Rosary String and Rosary Necklace (turn loose Rosaries into a bead you keep on death), Shard Bundle (Shell Shards), Craftmetal, Nectar (Creige), wish delivery goods (Courier's Swag and others), Mossberries, Plasmium | n/a | PRIMA-V, SR-V, GR-V, G8-MAT |

### 2.2 Proposed types and Tracker tabs

The contract already approves `memento`, `relic` and `map` as tracked-only types (rule 12) and leaves "which types make up Equipment" and "which Tracker each type goes on" open (section 8). Proposal, so P5-15 can add the list in one go:

| Type | `kind` | On | Tab (proposal) | Why |
|---|---|---|---|---|
| `memento` (approved) | collectible, `counts: false` | the 8 Mementos (section 1) | **Mementos** | |
| `relic` (approved) | collectible, `counts: false` | the 21 relics | **Mementos**, under its own heading "Relics" | Both are keepsakes found in the world and shown in the Bellhome; a separate tab for 21 entries that are mostly Act 2 adds a tab the mockups do not have |
| `map` (approved) | collectible, `counts: false` | area maps | **Equipment** | as in contract section 8 |
| `map-tool` (new) | collectible, `counts: false` | Quill, pins, markers | **Equipment** | They are bought, they change what the map shows, and they are not maps; one misspelt type would otherwise split the tab |
| `memory-locket` (new) | collectible, `counts: false` | the 20 Memory Lockets | **Crests** (alternative: Equipment) | They exist only to open Crest slots; the Builds work (`crestSlots`) reads the same idea. Athos's choice |
| `key` (new on the tracked list) | collectible, `counts: false` | keys other than the Simple Key | **Keys and key items** | `simple-key` is a Task of type `key` today (Task types are free), so the same word stays; see open question E3 |
| `key-item` (new) | collectible, `counts: false` | Craw Summons, Ruined Tool, Needle Phial and other story objects | **Keys and key items** | |
| `furnishing` (new) | collectible, `counts: false` | Bellhome furniture | **Equipment** (alternative: Mementos, as "Bellhome") | Bought from a shop, so it matters to the Rosaries page; Athos's choice |
| `flea` | **task** (no list change: Task types are free) | the 30 fleas | none in V1 (a later "Fleas" tab) | Rescuing a flea is something you do, not something you obtain; 30 entries mostly behind Act 2 abilities |

Not proposed: Pale Oil, Craftmetal and the other materials (consumed; they stay in `how`), and the Materium list itself.

**Open questions on section 2 (Athos):**

- **E1.** Relics on the Mementos tab, or their own tab?
- **E2.** Memory Lockets on the Crests tab or on Equipment?
- **E3.** The Simple Key: Athos's answer 2 says a thing the player obtains is a Collectible. `simple-key` is a Task today (one entry for Pebb's key). Leave it as a Task (it is used up), or turn it into a Collectible with `counts: false` like the Drifter's Cloak (same id)? Recommendation: leave it; changing it moves the Tasks total, and nothing needs it. The other three Simple Keys are not in `data/`: one from beating the Roachkeeper at the top of the tower in Sinner's Road [PCG-SK, single; an Act 1 Region], one bought from Jubilana (section 3.9), and a fourth whose source is not found (its door is in the High Halls, west of the Ventrica station [wiki (snippet)]). Whatever E3 decides should apply to all four.
- **E4.** Fleas: track them now (30 Tasks), later, or never?
- **E5.** Shakra's pins and markers are cheap shop entries. Track them (they add to "Rosaries still to spend") or leave them out? Recommendation: track the Quill (the map needs it) and the pins; they are real purchases a completionist buys.

### 2.3 Tracked-only entries in Act 1 Regions (for P5-16)

Only Regions already in `data/`. **Relics, keys and Memory Lockets the sources place in Act 1 Regions but behind Act 2 abilities go in the Act 2 list (2.4).** Steps sit between the existing tens, after the entries they need. Maps and Shakra's wares are in section 3.

| step | id (proposed) | Name | type | Region (Sub-area) | requires | how (our words) | Sources |
|---|---|---|---|---|---|---|---|
| 22 | `choral-commandment-bone-bottom` | Choral Commandment | relic | Moss Grotto (Bone Bottom) | `moss-mother` | On a ledge on the east side of the shaft above Bone Bottom, behind a breakable wall reached from the west edge of Mosshome. | wiki (snippet), GG-REL, AOL. Route detail differs (from Shakra's spot, up past a lever [AOL]) |
| 115 | `memory-locket-flintbeetles` | Memory Locket, Volatile Flintbeetles | memory-locket | Moss Grotto (Bone Bottom) | `moss-mother` (what the wish itself needs: **not found**) | Reward of the Volatile Flintbeetles wish, handed in at the Bone Bottom Wishwall. | GR-ML, sheet 1 (DG-ML, NC-ML, AT-ML), G4G-ML |
| 165 | `memory-locket-deep-docks` | Memory Locket, Deep Docks | memory-locket | Deep Docks | none beyond the Region (not found) | At the very bottom of the Deep Docks, left of the big chamber with the diving bell: break a wall on a ledge and follow the hidden way down to a corpse. | G4G-ML, GS-ML (two descriptions of the same spot, our reading) |
| 205 | `weaver-effigy-bone-bottom` | Weaver Effigy | relic | Moss Grotto (Bone Bottom) | `drifters-cloak` | In a small room high above Bone Bottom: from the platforms on the east side, above the lever, dash-jump and glide to it. | GG-REL. **Conflict:** on a cliff by the big pit, jumping across from Mosshome [one guide]; west of Mosshome below the Wormways entrance [another] |
| 215 | `bone-scroll-far-fields` | Bone Scroll | relic | Far Fields | `drifters-cloak` | East of the Seamstress's home: ride the tall wind current up, then hit the lava bulb to uncover a corpse holding it. | wiki (snippet), G4G-REL (the bulb) |
| 216 | `rune-harp-far-fields` | Rune Harp | relic | Far Fields | **not found** | **Where: not found** (listed under Far Fields only). Not ready for data. | GG-REL count, G4G-REL |
| 255 | `memory-locket-mort` | Memory Locket, Pilgrim's Rest | memory-locket | Far Fields (Pilgrim's Rest) | `fourth-chorus` (as the other Pilgrim's Rest entries) | Sold by Mort for **150** Rosaries (section 3). | SR-V, G8-ML, GR-ML, PRIMA-V, sheet 1 |
| 275 | `memory-locket-chapel-of-the-beast` | Memory Locket, Hunter's March | memory-locket | Hunter's March | none beyond the Region | On a corpse just before the Chapel of the Beast. | NC-ML, sheet 1 |
| 285 | `memory-locket-hunters-march-hidden` | Memory Locket, Hunter's March hidden room | memory-locket | Hunter's March | `savage-beastfly` | In a hidden room past the chapel boss. | sheet 1 only (DG-ML, NC-ML, AT-ML as cited there); single description |
| 325 | `memory-locket-halfway-home` | Memory Locket, Halfway Home | memory-locket | Greymoor (Halfway Home) | none beyond the Region | In a hidden room near Creige at Halfway Home. | NC-ML, G4G-ML (names Halfway Home) |
| 327 | `bone-scroll-greymoor` | Bone Scroll | relic | Greymoor | none beyond the Region | East of Halfway Home: swim along a hidden path, then drop down to a corpse. | wiki (snippet), G4G-REL |
| 345 | `memory-locket-moorwing` | Memory Locket, Moorwing | memory-locket | Greymoor | `moorwing` | Past the fan to the right of the Moorwing arena. | NC-ML, sheet 1 |
| 395 | `memory-locket-the-marrow` | Memory Locket, The Marrow | memory-locket | The Marrow | `cling-grip` | Through a narrow opening in the northwest, climbed to with Cling Grip. **Conflict:** "just right of the top-middle bench" [one guide]; may be the same spot | NC-ML, G4G-ML |
| 407 | `memory-locket-frey` | Memory Locket, Bellhart | memory-locket | Bellhart | `widow` | Sold by Frey for **330** Rosaries once the Widow is beaten (section 3). | SR-V, G8-ML, GR-ML |
| 465 | `bellhome-key` | Bellhome Key | key | Bellhart | `widow` (the donation wishes are not entries) | Finish the Bellhart donation wishes on the Wishwall, then talk to Pavo until he has nothing more to say; he gives the key to the empty bell-house. | GBT-KI, DS-M, SK-BH, GC-BH |
| 525 | `memory-locket-wormways` | Memory Locket, Wormways | memory-locket | Wormways | none beyond the Region | In the lower left part of the Wormways. | G4G-ML, GS-ML |
| 565 | `memory-locket-blasted-steps` | Memory Locket, Blasted Steps | memory-locket | Blasted Steps | none beyond the Region (Cling Grip is the Region's gate) | Pogo across the hanging bells, then drop into a dark passage. | NC-ML only |
| 615 | `rune-harp-weavenest-atla` | Rune Harp | relic | Weavenest Atla | **not found** | **Where: not found** (listed under Weavenest Atla only). Not ready for data. | GG-REL count |

Bellhome furniture (Frey) and Shakra's maps and tools are shop entries, listed in section 3 with their steps.

**Memory Lockets: 11 placed above out of 20** (Moss Grotto 1, Deep Docks 1, Far Fields 1, Hunter's March 2, Greymoor 2, The Marrow 1, Bellhart 1, Wormways 1, Blasted Steps 1). Grindle's Locket in Act 3 is Mort's unbought one moved (section 3), not another. Sources also name Lockets in Sands of Karak, Bilewater, Underworks, Choral Chambers, Whispering Vaults, Memorium and The Slab [GR-ML, G4G-ML] without a place: seven, which with the eleven makes 18. **Two are not found** (sources may have more than one in a Region). The numbered lists disagree with each other [GR-ML, G4G-ML]; Athos to check.

### 2.4 Tracked-only entries for later batches (Acts 2 and 3; not for P5-16)

Act 2 steps are provisional, ending in 5 so they slot between the tens the Act 2 batch will use; re-check them when that sheet fixes its steps. Act 3 steps follow the Act 3 sheet.

| step | id (proposed) | Name | type | Region | how and gate (short) | Sources |
|---|---|---|---|---|---|---|
| A2 | `weaver-effigy-shellwood` | Weaver Effigy | relic | Shellwood | East of the Chapel of the Witch, after the Rite of Rebirth wish | GG-REL, wiki (snippet) |
| A2 | `weaver-effigy-the-slab` | Weaver Effigy | relic | A2: The Slab | Red sand area south of the First Sinner path; behind spiked coral walls, needs the Key of Apostate [one guide] | GG-REL, wiki (snippet) |
| A2 | `bone-scroll-wisp-thicket`, `bone-scroll-underworks` | Bone Scroll (2) | relic | A2: Wisp Thicket; A2: Underworks | places not described | GG-REL, GC-COL |
| A2 | `rune-harp-high-halls` | Rune Harp | relic | A2: High Halls | place not described | GG-REL |
| A2 | `choral-commandment-whiteward-table`, `choral-commandment-whiteward-hall` | Choral Commandment (2) | relic | A2: Whiteward | on a surgical table; at the far end of a high hall | GG-REL |
| A2 | `choral-commandment-jubilana` | Choral Commandment | relic | A2: Choral Chambers (Songclave) | bought from Jubilana after The Lost Merchant (section 3) | GG-REL, GS-J, SR-V |
| A2 | `psalm-cylinder-…` (5) and `sacred-cylinder` | Psalm Cylinders, Sacred Cylinder | relic | A2: Whispering Vaults (by the first bench; Cardinius's room), Songclave secret area, High Halls, Whiteward (Surgeon's Key area), Blasted Steps (bought from Grindle) | the Sacred Cylinder from the Vaultkeeper's Melody wish (**conflict**: found by the Underworks entrance [PC]) | PC-PS (headings only), KG-PS, AT-PS, GC-COL |
| A2 | `white-key`, `surgeons-key`, `key-of-apostate`, `key-of-indolent`, `key-of-heretic`, `architects-key` | keys | key | A2 Regions | White Key in Songclave (or 220 from Jubilana if missed [MIL, single]); Architect's Key bought (section 3) | GRX-W, MIL, wiki (snippet), SR-V |
| A2 | `ruined-tool` | Ruined Tool | key-item | A2: Bilewater | hidden room (sheet 1) | sheet 1 |
| A2 | `materium` | Materium | furnishing | A2: Memorium | found there, built in the Bellhome | FX (snippet), G8-MAT |
| A2 | 7 Memory Lockets | | memory-locket | Sands of Karak, Bilewater, Underworks, Choral Chambers, Whispering Vaults, Memorium, The Slab | places not described | GR-ML, G4G-ML |
| 2035 | `farsight` | Farsight | furnishing | The Abyss (Weavenest Absolom) | found in Act 3, built in the Bellhome; shows the completion percentage and Journal entries left | FX (snippet), DS-M |
| 2037 | `arcane-egg` | Arcane Egg | relic | The Abyss | an Act 3 platforming challenge in the west of the Abyss | GG-REL (via summary) |
| 2115 | `craw-summons` | Craw Summons | key-item | see Craw Memento | Act 3 (trigger conflict, section 1) | FX (snippet), AT-CS, DS-M |
| 2126 | `crawbell` | Crawbell | furnishing | Greymoor | comes with the Craw Memento | DS-M |

## 3. Shops

**How to read the tables.** "Status": **C** = counted Collectible (already a counted type), **K** = tracked, not counted (`counts: false`, or a Task as today), **X** = consumable or material, **not tracked** (no entry; bought again and again, or used up). "Price" is in Rosaries; **bold = confirmed** (two independent sources agree). Material costs (Craftmetal, Pale Oil, the Ruined Tool) stay in `how` (Act 1 decision 7); `price` holds only the Rosaries. "In data" gives the existing id, or **new**.

**Currency.** Every shop price found is in Rosaries. **No shop priced in Shell Shards turned up** in any result (the Shard Bundle is bought *with* Rosaries and gives Shell Shards). So the contract's "no `currency` field" stands. Some places also take Rosaries without selling anything: Mort's door (30 per entry until its cog is broken) and toll machines for benches, Bellways and Ventrica stations [wiki (snippet) Rosary page, SR-V, TG-M]. Those are not shop entries.

**Selling, not buying.** Relic Seeker Scrounge buys Relics, and Vaultkeeper Cardinius receives Psalm Cylinders [G8-REL, GC-COL, G4G-REL, wiki (snippet)]. The contract records purchase prices only, so what they pay is noted in section 2 for the player's information and never goes in `price`.

### 3.1 Pebb (Moss Grotto, Bone Bottom)

**Where and when:** in Bone Bottom, just right of the Bellway station; the first merchant you meet [FX (snippet) Pebb, G8-PEBB, TG-M]. Leaves for good once you have bought everything except the Rosary String [PRIMA-V, one source]. One guide says Pebb is later found in The Marrow as a foe (not checked). The Act 3 sheet's open question Q5 (Bone Bottom largely destroyed in Act 3) still applies.

| Item | Price | Status | In data | Sources |
|---|---|---|---|---|
| Magnetite Brooch | **120** | C (tool) | `magnetite-brooch` | PRIMA-V, FX (snippet), G8-PEBB, sheet 1 PCG |
| Mask Shard | **300** | C | `mask-shard-bone-bottom` | PRIMA-V, FX (snippet), G8-PEBB |
| Simple Key | **500** | K (Task today) | `simple-key` | PRIMA-V, FX (snippet), PCG-SK, GG-SK. Pebb sells one only (data) |
| Rosary String | 80 | X | no | PRIMA-V, FX (snippet) |
| Craftmetal | 60 | X (material) | no | PRIMA-V, FX (snippet) |

### 3.2 Shakra (moves; first met in The Marrow)

**Where and when:** the map seller, found in many Regions: The Marrow, Bone Bottom, Deep Docks, Far Fields, Greymoor, Shellwood, Bellhart, Wormways, Hunter's March, Blasted Steps, Sands of Karak, Mount Fay, Sinner's Road and Bilewater [G8-NPC summary]; she stays in a spot until her stock there is bought, and her stock changes by Region [VEN-GRP]. In Bellhart you call her by hitting the bronze rings, and only after the Widow [GR-MAP, one more]. **Which Region sells which tool or pin is not found**, so each map below sits in the Region it maps (it can only be bought where she is in that Region, our reading, matching Act 1 decision 7), and the tools sit in The Marrow, where `compass` already is.

| step | Item | Price | Status | In data / id (proposed) | Sources |
|---|---|---|---|---|---|
| 60 | Compass | **70**. **Conflict:** 50 [GC-MAP], 80 [SMI] | C (tool) | `compass` | G8-SH, VEN-GRP, sheet 1 (PCG, NEO), Act 1 data |
| 62 | Quill | **50**. **Conflict:** 70 [GC-MAP], 60 [SMI] | K, `map-tool` | `quill` | G8-SH, VEN-GRP |
| 64 | Mosslands Map (GR-MAP calls it "Bone Bottom Map") | **40** | K, `map` | `map-mosslands` | G8-SH, GR-MAP, G4G-MAP (sold in The Marrow) |
| 66 | The Marrow Map | **50** | K, `map` | `map-the-marrow` | G8-SH, GR-MAP |
| 67 | Bench Pins | **60** | K, `map-tool` | `bench-pins` | VEN-GRP (two guides) |
| 68 | Shell Marker | **40** | K, `map-tool` | `shell-marker` | VEN-GRP (two guides) |
| — | Bellway Pins | 60 | K, `map-tool` | `bellway-pins` (Region not found) | VEN-GRP, one guide |
| — | Vendor Pins | **conflict** 80 [Shakra page, one guide] versus 60 [Map Pins table] | K, `map-tool` | `vendor-pins` (Region not found) | wiki (snippet) twice, one guide |
| — | Ring Marker | 40 | K, `map-tool` | `ring-marker` (Region not found) | one guide |
| — | Dark Marker | 90 | K, `map-tool` | `dark-marker` (Region not found) | one guide |
| A2 | Ventrica Pins | 80 | K, `map-tool` | `ventrica-pins` (Ventrica stations are in the Citadel, our reading) | one guide |
| 125 | Deep Docks Map | **50** | K, `map` | `map-deep-docks` | G8-SH, GR-MAP |
| 195 | Far Fields Map | **50** | K, `map` | `map-far-fields` (Shakra in a cave in the southwest) | GR-MAP, FX (snippet) |
| 258 | Hunter's March Map | 70 | K, `map` | `map-hunters-march` | GR-MAP; "most guides" put the group at 70 [DS-MAP summary] |
| 305 | Greymoor Map | **70**. **Conflict:** 50 [NL-SH] | K, `map` | `map-greymoor` | GR-MAP, PCG-MAP, G4G-MAP |
| 355 | Shellwood Map | 70 | K, `map` | `map-shellwood` | GR-MAP |
| 405 | Bellhart Map | **40** | K, `map` | `map-bellhart` (requires `widow`) | G8-SH, GR-MAP |
| 515 | Wormways Map | 70 | K, `map` | `map-wormways` | GR-MAP |
| 535 | Sinner's Road Map | 90 | K, `map` | `map-sinners-road` | GR-MAP |
| 555 | Blasted Steps Map | 70 | K, `map` | `map-blasted-steps` | GR-MAP |
| — | Weavenest Atla map | **not found** (whether one exists) | | | |
| A2 | Mount Fay Map | **40** | K, `map` | `map-mount-fay` | DS-MAP, GR-MAP |
| A2 | Sands of Karak Map | 90 | K, `map` | `map-sands-of-karak` | DS-MAP |
| A2 | Bilewater Map | 90 | K, `map` | `map-bilewater` | PCG-MAP |
| A2 | Choral Chambers, Underworks, Whispering Vaults, The Cradle and other Citadel maps | not from Shakra: machines or found (Choral Chambers: a cabinet above the first bench; a 70 cost is quoted without saying where) | K, `map` | later | GC-MAP, SMI, G4G-MAP |

"70" rows from GR-MAP alone are single-source; DS-MAP's summary says "most guides" put Shellwood, Blasted Steps, Wormways, Hunter's March and Greymoor at 70 without naming them, so they are not marked confirmed. silksong.codes gives 150 to 250 for maps and SMI says every map costs 50; both disagree with all the others and are not used [SC-SH, SMI].

### 3.3 Forge Daughter (Deep Docks)

**Where and when:** beside a bench in the Deep Docks; some stock needs Craftmetal brought to her [G8-FD, SR-V, FX (snippet)].

| Item | Price | Status | In data | Sources |
|---|---|---|---|---|
| Crafting Kit | **180** | C | `crafting-kit-forge` | G8-FD, PRIMA-V, FX (snippet), sheet 1 |
| Magma Bell | **110** + Craftmetal | C (tool) | `magma-bell` | G8-FD, PRIMA-V, FX (snippet) |
| Sting Shard | **140** + Craftmetal | C (tool) | `sting-shard` | G8-FD, PRIMA-V, sheet 1 |
| Shard Bundle | **50** | X | no | G8-FD, SR-V |
| Silkshot (her version) | **240** + Craftmetal + Ruined Tool | C (tool), Act 2; **one of three per run** (sheet 1) | no (Act 2) | G8-SS, FX (snippet), sheet 1 NC-RT. Effect conflict: three-shot burst versus one shot |

### 3.4 Mort (Far Fields, Pilgrim's Rest)

**Where and when:** inside Pilgrim's Rest at the top of Far Fields. The door takes 30 Rosaries per entry until you hit a cog inside that breaks the lock for good [PRIMA-V, TG-M, wiki (snippet), DG-30]. **Act 3:** nothing can be bought; his wares lie on his corpse between Pilgrim's Rest and the Far Fields Bellway, and if his Tool Pouch and Memory Locket were not bought, Grindle sells them [wiki (snippet), one guide]. So nothing here is missable.

| Item | Price | Status | In data / id | Sources |
|---|---|---|---|---|
| Weighted Belt | **160** | C (tool) | `weighted-belt` | PRIMA-V, TG-M, FX (snippet), sheet 1 NEO |
| Tool Pouch | **220** | C | `tool-pouch-pilgrims-rest` | PRIMA-V, TG-M, FX (snippet) |
| Memory Locket | **150** | K, `memory-locket` | `memory-locket-mort` (new, step 255) | PRIMA-V, SR-V, G8-ML, GR-ML |
| Rosary String | 80 | X | no | PRIMA-V |

### 3.5 Mottled Skarr (Hunter's March)

**Where and when:** after the Drifter's Cloak and the Fourth Chorus, up the updrafts in Hunter's March [DS-MS]. **Dies in Act 2.** **Conflict that touches existing data:** after his death, unbought wares lie at his feet (Fractured Mask) and in the room above (Curveclaw) [wiki (snippet)], versus "he will not leave the Fractured Mask behind", making it permanently missable [FRAG, PNG, one more guide]. The trigger also differs (resting on a bench outside Hunter's March after some Act 2 condition [wiki (snippet)], or as soon as Act 2 begins [PNG]).

| Item | Price | Status | In data | Sources |
|---|---|---|---|---|
| Curveclaw | **140** | C (tool) | `curveclaw` | G8-MS, PRIMA-V, sheet 1 PCG |
| Fractured Mask | **260** | C (tool); **possibly missable** (above) | `fractured-mask` | G8-MS, PRIMA-V, GR-FM |
| Shard Bundle | 50 | X | no | G8-MS (80 Shell Shards inside, single) |

### 3.6 Frey (Bellhart)

**Where and when:** the shop on Bellhart's ground floor, once the Widow is beaten [G8-ML, TG-M]. Stock grows twice: after the My Missing Courier wish, and after you own the Bellhome (furniture) [TG-CR, FX (snippet) My Missing Courier, SR-V].

| step | Item | Price | Status | In data / id | Sources |
|---|---|---|---|---|---|
| 407 | Memory Locket | **330** | K, `memory-locket` | `memory-locket-frey` (new) | SR-V, G8-ML, GR-ML |
| — | Rosary Necklace | 140 | X (keeps 120 Rosaries safe on death) | no | SR-V and one more (summary) |
| 450 | Spool Fragment | **270**, after My Missing Courier | C | `spool-fragment-bellhart`. **The data's `how` is wrong:** it says the fragment "comes with finishing the courier quest"; the sources say finishing it adds the fragment to Frey's shop, where you **buy** it | NL-SF, FX (snippet), SR-V |
| 460 | Multibinder | **880**, after My Missing Courier. Outlier 800 [one] | C (tool) | `multibinder` | SK-MB, SR-V, freeter (low) |
| 466 | Desk | **380**. **Conflict:** 250 [SK-BH], 280 ("Sturdy Desk") [DG-BH] | K, `furnishing` | `bellhome-desk` (requires `bellhome-key`) | TG-BH, DS-BH, TGS-BH |
| 467 | Gleamlights | **320** | K, `furnishing` | `bellhome-gleamlights` | TG-BH, DS-BH, SR-V |
| 468 | Bell Lacquer | **520** | K, `furnishing` | `bellhome-bell-lacquer` | TG-BH, DS-BH, SR-V |
| 469 | Personal Spa | **1100**; offered only after two other furniture purchases (rest elsewhere and come back if it does not show) | K, `furnishing` | `bellhome-personal-spa` | TG-BH, DS-BH, TGS-BH, SR-V |
| A2? | Gramophone | 490 | K, `furnishing` | `bellhome-gramophone` (gate unclear: SR-V lists it in the stock that comes "after the Bellhome and after all the Psalm Cylinders") | SR-V only |

Our arithmetic: 380 + 320 + 520 + 1100 = 2320, the total "all the Bellhome upgrades" one guide gives [TG-BH], so the four prices fit together and the Gramophone is not part of that total.

### 3.7 Pinmaster Plinney (Bellhart)

**Where and when:** Bellhart, after the Widow; in Act 3 he must first be rescued in Shellwood (Act 3 sheet). Each upgrade after the first also needs one Pale Oil [G8-N, NL-N, AT-N, CP, STEAM-100].

| Item | Price | Status | In data | Sources |
|---|---|---|---|---|
| Sharpened Needle | free | C | `sharpened-needle` | Act 1 data, CP, STEAM-100 |
| Shining Needle | Pale Oil only | C | no (Act 2) | CP, STEAM-100 |
| Hivesteel Needle | **450** + Pale Oil. **Conflict:** 500 [G8-N, HTR] | C | no (Act 2) | CP, STEAM-100, wiki (snippet) in sheet 1 |
| Pale Steel Needle | **680** + Pale Oil. **Conflict:** 900 [HTR, AT-N, NL-N] | C | Act 3 sheet `pale-steel-needle` | CP, STEAM-100, wiki (snippet). CP says the 2026-03-15 patch (1.0.30000) changed no Needle cost and suggests the higher numbers come from older builds or Switch; not checked |

### 3.8 Grindle (Blasted Steps; Act 2)

**Where and when:** the northwest chamber of the Blasted Steps, near the way to the Sands of Karak; his cave needs the Faydown Cloak [SR-V, DS-CK, STEAM-G]. Starts as an information broker [G8-NPC summary].

| Item | Price | Status | In data | Sources |
|---|---|---|---|---|
| Thief's Mark | **350** | C (tool) | no (Act 2) | SR-V, STEAM-G, sheet 1 NEO |
| Spool Fragment | **680** | C | no (Act 2) | SR-V, GC-BS |
| Crafting Kit | **700** | C | no (Act 2) | DS-CK, sheet 1 fan table |
| Snitch Pick | **740**. Outlier 720 [one guide] | C (tool) | no (Act 2) | SR-V, STEAM-G, wiki (snippet) |
| Psalm Cylinder | **conflict** 180 [PRIMA-V, SR-V] versus 240 [GC-BS, GC-COL] | K, `relic` | no (Act 2) | |
| Magnetite Dice | **conflict:** sold for 300 in Act 3 [one source] versus won from Lumble's dice game [GC-BS, sheet 1 SHK-MD, wiki (snippet)] | C (tool) | no | |
| Memory Locket (Act 3, only if Mort's was not bought) | **conflict** 150 [SR-V, G8-ML] versus 250 [RR-ML] | K | same entry as `memory-locket-mort` | wiki (snippet) for the move |
| Tool Pouch (Act 3, only if Mort's was not bought) | not found | C | same entry as `tool-pouch-pilgrims-rest` | wiki (snippet) |

### 3.9 Jubilana (Choral Chambers; Act 2)

**Where and when:** first hidden in a side room of the Choral Chambers, guarded by an Envoy and a Choristor (The Wandering Merchant wish, after the Cogwork Dancers [one]); then she sets up in the Songclave, right of the First Shrine. Later she goes missing again (The Lost Merchant wish: a bridge past the Memorium); afterwards her stock grows [GS-J, G8-J, DS-WM, GR-J].

| Item | Price | Status | In data | Sources |
|---|---|---|---|---|
| Ascendant's Grip | **350** | C (tool) | no (Act 2) | G8-J, GS-J, NC-J, sheet 1 |
| Mask Shard | **750** | C | no (Act 2) | G8-J, GS-J, NC-J |
| Spool Extender | **720** | C (tool) | no (Act 2) | G8-J, GS-J, sheet 1 SCC. Sheet 1's location conflict (Twelfth Architect) remains |
| Spider Strings | **320**, after The Lost Merchant | C (tool) | no (Act 2) | G8-J, NC-J, sheet 1 |
| Simple Key | **conflict** 650 [GS-J, a forum post] versus 750 [one guide] | K | new key entry (Act 2) | |
| Choral Commandment | **conflict** 180 [SR-V] versus 210 [GS-J] | K, `relic` | `choral-commandment-jubilana` | |
| Rosary String | 80 | X | no | one guide |
| White Key | 220, **only** if you went too far in The Lost Merchant without picking it up | K, `key` | `white-key` | MIL only |

### 3.10 Twelfth Architect (Underworks; Act 2)

**Where and when:** the only merchant in the Underworks; some stock needs Craftmetal. **Warning (single source):** buying all her stock before she repairs the Ruined Tool switches her off, and the Architect's Silkshot is lost [FX (snippet)].

| Item | Price | Status | In data | Sources |
|---|---|---|---|---|
| Architect's Key | **110**, offered once you own 25 Tools | K, `key` | `architects-key` (Act 2) | SR-V, sheet 1 (several) |
| Cogwork Wheel | **360** + Craftmetal | C (tool) | no (Act 2) | GR-V, SR-V, sheet 1 GB |
| Scuttlebrace | **140** + Craftmetal | C (tool) | no (Act 2) | GC-CM, sheet 1 NC-SB |
| Crafting Kit | **450** | C | no (Act 2) | SR-V, GR-V |
| Silkshot (her version) | **130** + Ruined Tool; Craftmetal **conflict** (FX and GC say yes, G8 names only Rosaries) | C (tool), one of three | no (Act 2) | G8-SS2, FX (snippet), GC-CM |
| Sawtooth Circlet | 230 + Craftmetal | C (tool) | no (Act 2) | NL-T and "other sources" (summary). **Conflicts with sheet 1:** High Halls, after the Second Sentinel [GB, NC] |
| Shard Bundle | 50 | X | no | SR-V |

### 3.11 Merchants named without stock found

- **Creige** (Greymoor, Halfway Home): sells Nectar, a drink that heals and restores Silk [one guide]; price not found. X.
- **Relic Seeker Scrounge** (Bellhart) and **Vaultkeeper Cardinius** (Whispering Vaults): buyers, not sellers. Scrounge pays (conflicts everywhere): Bone Scroll 90 (wiki (snippet), most) or 50; Choral Commandment 90, 180 or 210; Weaver Effigy 150 or 240; Rune Harp 110 or 210; Arcane Egg 250 or 600. Cardinius about 100 or more per Psalm Cylinder [GC-COL]. Not recorded in `price`.
- **Grishkin** (Flea Caravan), **Kratt**, **Loddle**, **Lumble the Lucky** (dice game), **Vog**: named as merchants in the wiki's NPC list [G8-NPC summary]; no stock found. **Skynx**: Steel Soul only, out of scope.
- **Mount Fay table**: makes the third Silkshot for Craftmetal only (sheet 1).
- **Shell Shards as payment:** only for wishes (the Bone Bottom Donate wishes: 200, 300 and 440 Shell Shards [wiki (snippet) Shell Shard]), never in a shop. A modding page says Frey and Mort can stock Shell Shard refills after some wishes [THUNDER, indirect]; not tracked.

### 3.12 Totals (our arithmetic, Act 1 Regions only, confirmed prices only)

- **Existing entries that can take `price` now (P5-18):** `magnetite-brooch` 120, `mask-shard-bone-bottom` 300, `simple-key` 500, `compass` 70, `crafting-kit-forge` 180, `magma-bell` 110, `sting-shard` 140, `weighted-belt` 160, `tool-pouch-pilgrims-rest` 220, `curveclaw` 140, `fractured-mask` 260, `spool-fragment-bellhart` 270, `multibinder` 880. **13 entries, 3350 Rosaries.** (`compass` has a conflict but three sources agree on 70; Athos to confirm. `spool-fragment-bellhart` needs its `how` corrected first.)
- **New tracked shop entries in Act 1 Regions with confirmed prices:** `quill` 50, `map-mosslands` 40, `map-the-marrow` 50, `bench-pins` 60, `shell-marker` 40, `map-deep-docks` 50, `map-far-fields` 50, `map-greymoor` 70, `map-bellhart` 40, `memory-locket-mort` 150, `memory-locket-frey` 330, `bellhome-desk` 380, `bellhome-gleamlights` 320, `bellhome-bell-lacquer` 520, `bellhome-personal-spa` 1100. **15 entries, 3250 Rosaries.**
- **New tracked shop entries with a single-source price** (in data only if Athos accepts one source): `map-hunters-march`, `map-shellwood`, `map-wormways`, `map-blasted-steps` (70 each), `map-sinners-road` 90, `bellway-pins` 60, `ring-marker` 40, `dark-marker` 90; and `vendor-pins` (conflict). Their Regions are not known for the pins and markers.

## 4. Already in `data/items.json` versus new

Read on 2026-10-20: `dataVersion` 5, 63 entries, steps 10 to 610 in tens plus 11 and 25. **No Memento, relic, map, Memory Locket or furniture is in `data/`.** A script checked every id proposed here (75) against `data/items.json`, `data/regions.json` and the ids in `docs/PHASE-3-ACT-3.md`: all are valid slugs, none collides, no proposed step repeats or hits an existing step, and every new step comes after the steps of the entries it requires.

**Existing entries this sheet touches (14):**

| id | What changes | Why |
|---|---|---|
| `magnetite-brooch`, `mask-shard-bone-bottom`, `simple-key`, `compass`, `crafting-kit-forge`, `magma-bell`, `sting-shard`, `weighted-belt`, `tool-pouch-pilgrims-rest`, `curveclaw`, `fractured-mask`, `multibinder` | add `price` (section 3.12) | shop entries; prices confirmed, `compass` with a recorded conflict |
| `spool-fragment-bellhart` | add `price: 270` **and** correct `how` to "sold by Frey for 270 Rosaries once the courier quest is done" | the current `how` says it comes with the quest; three sources say it is bought |
| `fractured-mask` (again) | maybe `missable: true` with a note | Mottled Skarr dies in Act 2; sources disagree on whether the mask stays at his feet (section 3.5). Athos decides |
| `sharpened-needle` | nothing (free) | |

`simple-key` is a Task; `price` on a Task is allowed by the contract (it says "shop entries", not Collectibles) and `rosariesToSpend` reads any entry with a `price`. Said here so nobody is surprised that a Task appears on the Rosaries page.

**New, by batch:**

| Batch | Entries | Where listed |
|---|---|---|
| **P5-16, Act 1 Regions, ready** | 16 tracked finds (4 relics, 11 Memory Lockets, the Bellhome Key) + 18 tracked shop entries (11 maps, Quill, Bench Pins, Shell Marker, 4 furnishings) = **34** | 2.3, 3.2, 3.6 |
| Act 1 Regions, **not ready** | 2 Rune Harps (place not found), 4 pins and markers (Region not found) | 2.3, 3.2 |
| Act 2 batch | relics (14), keys (6 + Jubilana's Simple Key), Ruined Tool, Materium, 7 Memory Lockets, maps, Gramophone, Ventrica Pins, and the Act 2 shop Collectibles of sections 3.3 and 3.7 to 3.10 (Tools, Crafting Kits, Spool Fragment, Mask Shard, Needle upgrades) | 2.4, 3 |
| Act 3 batch | 8 Mementos + the Clover Dancers Task (M2), Farsight, Arcane Egg, Craw Summons, Crawbell | 1, 2.4 |

## 5. Brief for Dev C (P5-16 and P5-18): do not hand out until Athos approves this sheet

**Before either task, Athos answers:** M1 to M4, E1 to E5, and the three points below. Each changes what Dev C writes.

1. **Region Complete and the Route.** Contract section 8 leaves open whether tracked entries count toward a Region's Complete state and appear on the Route. P5-16 adds 34 tracked entries across 10 Act 1 Regions. As things stand, a player who had Greymoor Complete would see it drop back (two Memory Lockets, a Bone Scroll and a map are not done), and "Next on the route" could point at a map. **Recommendation:** decide this before P5-16 (keep tracked entries off the Route and out of Complete, which is a change to `render.js`, `main.js` and possibly `requirements.js`, so a Dev A and Dev B task first). If Athos prefers to keep them in, P5-16's done criteria must list the Regions whose state changes so nobody takes it for a bug.
2. **Single-source facts.** Five map prices and two Memory Locket places rest on one source. Enter them, or wait?
3. **The `how` fix on `spool-fragment-bellhart`** is a content change to an Act 1 entry; Athos confirms it in game or on the wiki.

### P5-15 (qa-tests), from this sheet

Add `map-tool`, `memory-locket`, `key`, `key-item` and `furnishing` to `TRACKED_TYPES` (the list then has eight), each with a test that a `counts: false` Collectible of that type gives no warning and that the same type without `counts` gives the rule 12 warning that names `counts`. `flea` needs nothing (Task types are free). Remove any type Athos rejects in E1 to E5 before handing it out.

### P5-16 (dev-c): tracked entries in Act 1 Regions

- **Files:** `data/items.json`; `data/regions.json` and `data/endings.json` for `dataVersion` only.
- **Depends on:** this sheet approved; P5-15 and P5-12 merged; point 1 above decided.
- **Scope:** the 34 "ready" rows of sections 2.3, 3.2 (step-numbered Act 1 maps and the Quill, Bench Pins and Shell Marker) and 3.6 (the four furnishings), exactly as listed: `id`, `name`, `type`, `regionId`, `area` (the Sub-area in brackets), `requires`, `step`. Every entry: `kind: "collectible"`, `counts: false`. `how` in our own words from the sheet's "how" text (shorten, do not copy a source). `price` only where the sheet marks it confirmed (bold) **and** Athos accepted it; otherwise leave `price` out and say so in the handoff. `source`: the URL of the first source code in the row that is not a wiki snippet, FX snippet or `low` site (Sources list below); if a row has only wiki snippets, ask the orchestrator. No `missable` unless Athos says so. No Mementos (all Act 3) and none of the "not ready" rows. Raise `dataVersion` by one in all three files.
- **Done when:** `node scripts/validate-data.js` gives no error and no warning; `node --test "tests/*.test.js"` passes; served locally, the Home Collectibles headline and "Collectibles by type" are unchanged, the Mementos tab reads "Not in the guide yet" (no Mementos in Act 1) or shows the four relics if Athos puts relics there, and the Equipment and other tabs show the new entries with a done and total that match a hand count (say which). The handoff lists, per Region, its numbers and state before and after.

### P5-18 (dev-c): shop prices

- **Files:** `data/*.json`. **Depends on:** this sheet approved (it doubles as the "sheet 3" the plan names for shops and prices); P5-2 merged (it is).
- **Scope:** `price` on the 13 existing entries in section 3.12, values as listed; the `how` fix on `spool-fragment-bellhart` if Athos confirmed it; `missable` on `fractured-mask` only if Athos says so. Prices with a "conflict" note that Athos has not settled stay out. Raise `dataVersion`.
- **Done when:** validator clean; tests pass; served locally, the Rosaries page (once P5-17 has built it) or a throwaway `rosariesToSpend` call against `data/` gives `total` 3350 before any entry is marked done (3350 + the P5-16 prices if P5-16 is merged first; say which), and "Next to buy" with nothing done is `simple-key` (step 25, the lowest priced step that is Available from the start; our reading of the data, check it).

## 6. Riskiest facts and all open questions

**Riskiest facts (check in game first):**

1. `spool-fragment-bellhart` is bought (270), not given: contradicts current data [NL-SF, FX (snippet), SR-V].
2. `fractured-mask` may be missable once Mottled Skarr dies in Act 2 (conflict, 3.5).
3. The heart Memento: one of four, decided by which heart is kept (section 1); the Pollen and Hunter's Heart versions rest on one source.
4. The Guardian's Memento may be missable before the Everbloom (one source).
5. Compass and Quill prices: three sources agree on 70 and 50, but GC (the Act 1 sheet's main source) swaps them (50 and 70).
6. Map prices in GR-MAP alone (Hunter's March, Shellwood, Wormways, Blasted Steps, Sinner's Road).
7. Memory Locket places: only 11 placed; two of the 20 not found at all.
8. Egg of Flealia: all 30 fleas [NL-FL, NC-FL summary] versus 29 (sheet 1).

**Open questions:** M1 to M4 (section 1), E1 to E5 (section 2.2), and points 1 to 3 of section 5.

## Sources

(being written)
