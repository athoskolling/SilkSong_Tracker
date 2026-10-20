# Phase 6, places sheet: points of interest per Region (orchestrator's research, 2026-10-20)

**Status: draft for Athos's review (complete as far as search results allow).** Research only, not data. Nothing here goes into `data/` until Athos approves this sheet and checks the facts. Names are the game's names; every `how` is in our own words.

**Spoiler warning:** names late-game Regions, bosses, wishes and the Act 3 diving bell.

## How this was researched, and its limit

- **Search results only.** No page was opened. Every fact below is what one or more search results said. hollowknight.wiki and Fextralife were never fetched; where their text appears, it is their text **as quoted in a search result**, marked "wiki (snippet)" or "FX (snippet)". MapGenie was not opened and no fact comes from it (see the Dev C brief for how its link may be used). No facts from memory: where the results say nothing, the sheet says "not found".
- **Facts already researched** in `docs/PHASE-3-ACT-1.md`, `docs/PHASE-3-ACT-2.md`, `docs/PHASE-3-ACT-3.md` and `docs/PHASE-5-SHEET-2-MEMENTOS-EQUIPMENT-SHOPS.md` are cited as "Act 1 sheet", "Act 2 sheet", "Act 3 sheet" and "sheet 2", with their own sources there. Vendor stock and prices live in sheet 2 and in `data/items.json`; this sheet only links them (section "Vendors").
- **Idea, not content, from Hollow-Thingy's `js/poi.js`:** places are listed per Region with a kind, and collectibles are never repeated as places. Nothing from that file (a Hollow Knight file) is used as a fact.
- **Marks.** "Sources" gives the codes of the results that said it (list at the end). "Agree" is how many independent sources give the same position. **1 = unconfirmed.** A group code (`-GRP`) means one search whose summary did not say which page said what: it counts as one source. "Disagreements" gives both readings.
- **Bench counts differ everywhere:** 82 [GC-B, SMI-B], 85 [LM-B], 78 [SCO-B], 83 [FX (snippet)]. The sites count Bell Shrines, toll benches that come in pairs or threes (the wiki counts one per room), temporary benches (the Flea Caravan, Shakra's camp) and Act 3 benches differently. **This sheet does not try to list all 82.** It lists the benches the results place, and says per Region what is still missing.

### How to read the tables

| Column | Meaning |
|---|---|
| id | Proposed permanent slug: `<regionId>-<place>-<kind>`. The Region prefix keeps ids unique and readable (the brief's `bone-bottom-bench` becomes `moss-grotto-bone-bottom-bench`, because Bone Bottom is a Sub-area of Moss Grotto). A script checked that none collides with an id in `data/` |
| kind | `bench`, `bellway`, `shop`, `npc`, `wishboard`, `arena`, `door` or `other`. Ventrica stations (the Citadel's own fast travel) are `other` for now (open question P2) |
| area | Sub-area label, as for entries; blank when none |
| how | Where it is and what it does for the player, our words, under 300 characters |
| requires | Entry ids from `data/items.json` needed to reach or use it, **beyond its Region's `requires`** (same rule as for entries: a place's real requirements are its own plus its Region's). `[]` = nothing extra. Where an entry in `data/` already says the same thing, the place copies it, so a place and the entries it serves cannot disagree |

**Left out on purpose:** bosses and places that are already entries (Moss Mother, Bell Beast, Lace, Widow, Last Judge, Cogwork Dancers, Trobbio, the Raging Conchfly and so on); collectibles; temporary or one-off places that only a single wish uses (Hermit's soul wall, the Seeker's empty bellhome); Hunter's Journal targets; flea locations (a later Fleas tab, sheet 2 E-questions).

## Regions

### 1. Moss Grotto (`moss-grotto`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `moss-grotto-ruined-chapel-bench` | Ruined Chapel bench | bench | Ruined Chapel | The first bench of the game, inside the Ruined Chapel just before the Moss Mother fight. | `[]` | DG-B, GC-B | 2 | |
| `moss-grotto-bone-bottom-bench` | Bone Bottom bench | bench | Bone Bottom | In the middle of the pilgrims' town. | `moss-mother` | DG-B, GC-B | 2 | DG-P and FX (snippet) mention a 30-Rosary bench stand near Bone Bottom; probably the paid Marrow bench |
| `moss-grotto-mosshome-bench` | Mosshome bench | bench | Mosshome | At the start of Mosshome, near Shakra; pull the lever to release it. | `moss-mother` | GC-B | 1 | |
| `moss-grotto-moss-druid-bench` | Moss Druid bench | bench | Mosshome | At the entrance to the Moss Druid's home in Mosshome. | `moss-mother` | GC-B | 1 | |
| `moss-grotto-bone-bottom-bellway` | Bone Bottom Bellway | bellway | Bone Bottom | The town's Bellway station, between the Little Pilgrim and Pebb's stall. Free to use once the Bell Beast is freed in The Marrow. | `bell-beast` | wiki (snippet) Fast Travel, FSM, SCO-BW, NEO-BW, FT-GRP | 4 | Toll: free [FSM, SCO-BW] versus 30, or "up to 120", in two weaker results. Act 3: Bone Bottom is mostly destroyed but its Bellway stays [Act 3 sheet, wiki (snippet)] |
| `moss-grotto-pebb-shop` | Pebb | shop | Bone Bottom | The first merchant, just right of the Bellway station. Sells the entries listed under "Vendors". | `moss-mother` | sheet 2 (FX (snippet), G8-PEBB, TG-M) | 3 | Leaves once bought out (one source). Act 3 status open (Act 3 sheet Q5) |
| `moss-grotto-bone-bottom-wishwall` | Bone Bottom wishwall | wishboard | Bone Bottom | The town's wish board: donation wishes paid in Shell Shards, Garb of the Pilgrims and The Terrible Tyrant hunt. One of the three boards that lead to Silk and Soul (Act 3). | `lace` | G8-W, NL-W, AT-A3, NC-SS | 4 | **When it appears:** after reaching the Deep Docks [one guide] versus after exploring Far Fields [G8-W]. `lace` is the later reading (Far Fields needs it) |
| `moss-grotto-weavenest-atla-door` | Needolin door | door | | A sealed door in Moss Grotto that opens when you play the Needolin at it; behind it is Weavenest Atla. | `needolin` | DG-WA, RR-EVA, Act 1 sheet | 3 | Exact spot in Moss Grotto not found |

Not placed: Bonegrave (Chapel of the Wanderer, an entry). Shakra also camps in Bone Bottom whenever you miss her elsewhere [SH-GRP]; not a fixed place.

### 2. The Marrow (`the-marrow`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `the-marrow-lower-bench` | Paid bench, lower Marrow | bench | | At the bottom of The Marrow, through Bone Bottom's right-hand door. Pay 30 Rosaries once at its stand. | `[]` | DG-B, GC-B, GC-MAR | 3 | |
| `the-marrow-flea-caravan-bench` | Flea Caravan bench | bench | Flea Caravan | In the middle of The Marrow, part of the Flea Caravan's camp. It leaves with the caravan once The Lost Fleas wish is done. | `[]` | DG-B, GC-B, GC-MAR | 3 | |
| `the-marrow-bellway-bench` | Bell Shrine bench | bench | Marrow Bellway | Next to The Marrow Bellway. One of the five Bell Shrines whose bells must ring before the Last Judge appears. | `bell-beast` | GC-B, wiki (snippet) Bellshrine | 2 | DG-B describes an upper bench near the Mosshome entrance whose bell you hit on the first visit; maybe the same bench |
| `the-marrow-cell-bench` | Bench by Grindle's cell | bench | | Near the cell where Grindle is held, close to the way into Hunter's March. | `[]` | GC-MAR | 1 | |
| `the-marrow-bellway` | The Marrow Bellway | bellway | Marrow Bellway | Where the Bell Beast is trapped. Once it is beaten the station is free and the Bellway network opens. | `bell-beast` | wiki (snippet), FSM, SCO-BW, Act 1 sheet | 4 | |
| `the-marrow-shakra-shop` | Shakra, first camp | shop | | Near the end of a long corridor: go right past the first bench shrine, climb, then left at the top; you hear her singing first. Maps and map tools. | `[]` | NL-SH, SH-GRP | 2 | |
| `the-marrow-flea-caravan-npc` | Flea Caravan, first camp | npc | Flea Caravan | Fleamaster Mooshka's first camp. Rescued fleas gather here; five fleas finish The Lost Fleas (`flea-brew`) and the caravan moves to Greymoor. | `[]` | GR-FL, STEAM-FC, Act 1 sheet | 3 | |
| `the-marrow-grindle-cell-npc` | Grindle's cell | npc | | Grindle is first held in a cell here. Free him, or he gets out by himself later; he ends up as a merchant in the Blasted Steps. | `[]` | wiki (snippet) Grindle | 1 | |
| `the-marrow-skull-tyrant-arena` | Skull Tyrant | arena | | Optional boss of The Marrow, fought through The Terrible Tyrant hunt (Bone Bottom wishwall). It can come back while you rest at Bone Bottom. | `lace` | PCGN-B, NL-B | 2 | Room not found. `lace` follows the wishwall row |
| `the-marrow-bell-eater-arena` | Bell Eater | arena | | Optional Act 3 boss. Beating it gives Beastling Call: warp to the Bellway station you used last. | `grand-mother-silk-snared` | PCGN-B, FT-GRP | 2 | Room not found. Beastling Call is not on the counted list; whether it should be an entry is open (Q6) |

Not placed: Loddle (`tool-pouch-loddle`): the results show Loddle in The Marrow without a room [wiki (snippet) Tool Pouch gallery]; one low list says Hunter's March, later Far Fields.

### 3. Deep Docks (`deep-docks`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `deep-docks-entrance-bench` | Entrance bench | bench | | Arrows lead to it from the start of the Deep Docks. 30 Rosaries. | `[]` | GC-B | 1 | |
| `deep-docks-forge-bench` | Forge bench | bench | Forge | Just before the Forge Daughter. Beat the enemy gauntlet below, then a lever uncovers the bench and her shop. | `[]` | GC-B, wiki (snippet) Save Points, KG-DD | 3 | |
| `deep-docks-bell-shrine-bench` | Bell Shrine bench | bench | | One of the five Bell Shrines. | `lace` | GC-B, wiki (snippet) Bellshrine, Save Points | 2 | Sit on it after beating Lace [GC-B] versus after hitting a lever [wiki (snippet)] |
| `deep-docks-sauna-bench` | Sauna bench | bench | | Rest here after beating Forebrothers Signis and Gron. | `[]` | wiki (snippet) Bench, Save Points | 1 | |
| `deep-docks-bellway` | Deep Docks Bellway | bellway | | Down the path left of Shakra's camp, under an arrow sign pointing right; low on the left side of the Deep Docks. | `[]` | FX (snippet), PCGN-FT, PA-FT | 3 | Wording differs: "left of Shakra" [FX], "bottom-left corner" [PCGN-FT], "lower of two paths, before a dead end" [PA-FT]. Toll 40 [FX, wiki] versus 50 [G4G-FT, PA-FT] |
| `deep-docks-forge-daughter-shop` | Forge Daughter | shop | Forge | The smith beside the Forge bench. Some wares also need Craftmetal. | `[]` | sheet 2 (G8-FD, SR-V, FX (snippet)) | 3 | |
| `deep-docks-shakra-shop` | Shakra | shop | | Keep straight on after coming in from The Marrow; a sign on the way points to a bench. | `[]` | SH-GRP | 1 | |
| `deep-docks-simple-key-door` | Simple Key door | door | | A locked door that takes a Simple Key. Behind it: a way through to Far Fields and the Flintslate (`flintslate`). Any key fits; the Route pairs this one with Pebb's. | `simple-key` | G8-SK, NC-SK, HG-SK, Act 2 sheet | 4 | |
| `deep-docks-forebrothers-arena` | Forebrothers Signis and Gron | arena | | Optional boss pair low in the Deep Docks. Beating them opens the sauna bench and the room of the old diving bell. | `[]` | PCGN-B, wiki (snippet) Diving Bell, Save Points | 2 | |
| `deep-docks-diving-bell` | Old diving bell | door | | At the very bottom of the Deep Docks, past the Forebrothers. In Act 3 its key takes you down to The Abyss; Ballow waits in the room above it. | `diving-bell-key` | wiki (snippet), NC-DB, GB-DB, Act 3 sheet | 3 | GB-DB: reached through a Simple Key passage under the forge. Who gives the key: Ballow [wiki] or the Caretaker [NC-DB] |

Not placed: a Weaver spire bench and a bench inside the diving bell (Act 3) [wiki (snippet) Save Points, one source each]. GC-DD counts 6 benches, LM-B 6, SMI-B 5.

### 4. Far Fields (`far-fields`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `far-fields-west-bench` | West bench | bench | | North of the arena where Lace is fought, at the far west of Far Fields. | `[]` | GC-B | 1 | GC-B calls it a Bell Shrine; the wiki's five Bell Shrines do not include Far Fields |
| `far-fields-bellway-bench` | Bellway bench | bench | | Next to the Far Fields Bellway. 30 Rosaries. | `[]` | GC-B | 1 | |
| `far-fields-seamstress-bench` | Seamstress's bench | bench | Seamstress's home | Inside the Seamstress's home. | `[]` | GC-B, wiki (snippet) Bench | 2 | The wiki lists a "Seamstress Hut" bench without naming the Region |
| `far-fields-pilgrims-rest-bench` | Pilgrim's Rest bench | bench | Pilgrim's Rest | Inside Pilgrim's Rest. | `fourth-chorus` | wiki (snippet) Bench | 1 | Region not stated by the snippet |
| `far-fields-bellway` | Far Fields Bellway | bellway | | In the tall shaft through the middle of Far Fields, above Shakra's room, partway up toward Greymoor. The Curveclaw practice room is above it (Act 3). | `[]` | G4G-FT, PCGN-FT, Act 3 sheet | 2 | |
| `far-fields-shakra-shop` | Shakra | shop | | In a cave in the southwest, below the Bellway. | `[]` | sheet 2 (GR-MAP, FX (snippet)), PCGN-FT | 2 | |
| `far-fields-seamstress-npc` | The Seamstress | npc | Seamstress's home | Her wish, Flexile Spines, gives the Drifter's Cloak (`drifters-cloak`). | `[]` | Act 1 sheet (four guides) | 4 | |
| `far-fields-pilgrims-rest-door` | Pilgrim's Rest door | door | Pilgrim's Rest | The door at the top of Far Fields takes 30 Rosaries per entry until you hit a cog inside that breaks its lock for good. Mort's shop is inside. | `fourth-chorus` | sheet 2 (PRIMA-V, TG-M, wiki (snippet), DG-30) | 4 | |
| `far-fields-mort-shop` | Mort | shop | Pilgrim's Rest | Mort's shop inside Pilgrim's Rest. In Act 3 he is dead and his unsold wares lie on his body; Grindle sells two of them. | `fourth-chorus` | sheet 2 | 3 | |
| `far-fields-sprintmaster-npc` | Sprintmaster Swift | npc | | At the far east edge of Far Fields, near the great bone arches. His Act 3 races give a Mask Shard (`mask-shard-sprintmaster`). | `[]` | NC-SPR, Act 3 sheet | 2 | |

Not placed: a "Skarr bench" the wiki lists under both Hunter's March and Far Fields [wiki (snippet)]; a bench behind a blastable wall near Pilgrim's Rest (Act 3) [GG-A3]. LM-B counts 7 benches here, GC-B 3.

### 5. Hunter's March (`hunters-march`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `hunters-march-bench` | Trapped bench | bench | | The only bench, in a tall tunnel near the far end, reached on the air currents. It is trapped: first switch off the mechanism in a hidden room to its left (jump at the wall to find the way in). | `[]` | NC-HMB, GC-B | 2 | GC-B: "the only bench"; LM-B agrees (1) |
| `hunters-march-mottled-skarr-shop` | Mottled Skarr | shop | | Up the updrafts of Hunter's March. Dies in Act 2. | `[]` | sheet 2 (DS-MS, G8-MS) | 2 | Sheet 2 says he appears after the Drifter's Cloak **and** the Fourth Chorus; the data's `curveclaw` and `fractured-mask` require nothing beyond the Region. Kept equal to the data; Athos to check |
| `hunters-march-shakra-shop` | Shakra | shop | | Bottom right of Hunter's March, on the way to the Chapel of the Beast. | `[]` | SH-GRP | 1 | |

### 6. Greymoor (`greymoor`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `greymoor-moorwing-bench` | Bench near Moorwing | bench | | Bottom left of Greymoor, near the Moorwing fight. | `[]` | GG-GM | 1 | |
| `greymoor-halfway-home-bench` | Halfway Home bench | bench | Halfway Home | Inside the Halfway Home, near Creige and Nuu. | `[]` | GC-B, AT-GM, KG-GM | 3 | On the right [AT-GM] versus on the top floor [KG-GM] |
| `greymoor-flea-caravan-bench` | Flea Caravan bench | bench | Flea Caravan | Comes with the Flea Caravan's second camp and leaves with it. | `[]` | GG-GM, DG-B | 2 | |
| `greymoor-craw-lake-bench` | Craw Lake paid bench | bench | Craw Lake | On the right side of Craw Lake: pay 80 Rosaries at the bell stand in the room. Shakra's camp below it has a bench that goes when she leaves, so rest here too. | `[]` | GG-GM | 1 | |
| `greymoor-bell-shrine-bench` | Bell Shrine bench | bench | | Above the main ground on the right, past the Craw part. One of the five Bell Shrines. | `[]` | GC-B, wiki (snippet) Bellshrine | 2 | The wiki snippet names Greymoor but not the spot |
| `greymoor-bellway` | Greymoor Bellway | bellway | Halfway Home | Below the Halfway Home: go west through it, past the tall building, down the cliff and double back. | `[]` | FT-GRP, wiki (snippet) | 2 | Toll 60 (after a patch) [wiki (snippet)] versus 80 [older guides] |
| `greymoor-shakra-shop` | Shakra | shop | Craw Lake | Coming up from Far Fields, turn right into the next room; she is at the bottom by her tent. | `[]` | SH-GRP, GG-GM | 2 | GG-GM puts her camp on the right side of Craw Lake; probably the same place |
| `greymoor-halfway-home-npc` | Creige and Nuu | npc | Halfway Home | Creige keeps the inn (drinks, the Crawbug wish for `crafting-kit-creige`); Nuu sits on the roof (her Hunter's Journal wishes). | `[]` | AT-GM, KG-GM, AT-NPC, G8-W | 4 | |
| `greymoor-flea-caravan-npc` | Flea Caravan, second camp | npc | Flea Caravan | Mooshka's second camp. Kratt joins here once freed. More fleas move the caravan to the Blasted Steps (`spool-fragment-fleas`). | `[]` | GR-FL, TR-FL, STEAM-FC | 3 | Fleas needed for the move: 15 [GR-FL] versus about 25 [G8-FL] versus "a third or so, after the Blasted Steps boss" [TR-FL] |

Not placed: the Craw Lake door to the Court of Craws (Act 3, Craw Summons; it leads to the Craw Memento, not an entry yet, sheet 2) and the way into Lost Verdania (`conjoined-heart`, `elegy-of-the-deep`). GG-GM counts 5 benches, LM-B 2.

### 7. Bellhart (`bellhart`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `bellhart-town-bench` | Town bench | bench | | In the middle of Bellhart; Pavo sings next to it. | `[]` | wiki (snippet) Save Points, AT-NPC | 2 | |
| `bellhart-bell-shrine-bench` | Bell Shrine bench | bench | | Hit the floor lever: the bell rings and a permanent bench appears. One of the five Bell Shrines. | `[]` | wiki (snippet) Bellshrine | 1 | Whether it needs the Widow first: not found |
| `bellhart-widow-bench` | Widow's bench | bench | Bellvein | After the Widow, a switch in her chamber brings down a bench. Acts 1 and 2 only. | `widow` | wiki (snippet) Save Points | 1 | Climbing Widow's silk memory [one wiki page] versus the lever [another] |
| `bellhart-bellway` | Bellhart Bellway | bellway | | On the bottom level, in the passage joining Shellwood, Bellhart and Greymoor. | `[]` | FT-GRP, GBL-SB | 2 | "At the main merchant rest point between the Shellwood and Greymoor entrances" [one guide]. Toll 60 [wiki (snippet)] versus 80 [older] |
| `bellhart-frey-shop` | Frey | shop | | The shop on Bellhart's ground floor, open once the Widow is beaten. Stock grows after My Missing Courier and after the Bellhome. | `widow` | sheet 2 (G8-ML, TG-M) | 2 | |
| `bellhart-plinney-shop` | Pinmaster Plinney | shop | | Upgrades the Needle once the town is freed (later tiers need Pale Oil). In Act 3 rescue him in Shellwood first. | `widow` | sheet 2, Act 1 sheet, Act 3 sheet | 3 | |
| `bellhart-wishwall` | Bellhart Wishwall | wishboard | | Opens once the town is freed. Many Act 2 and Act 3 wishes post here, several with Mask Shards. One of the three boards for Silk and Soul. | `widow` | AT-BH, wiki (snippet) Wishwall, G8-W | 3 | Where in town: not found (the wiki says near the fast travel station in the reveal trailer only) |
| `bellhart-pavo-npc` | Pavo | npc | | Sings beside the town bench. Posts Restoration of Bellhart, Bellhart's Glory and My Missing Brother, and gives the Bellhome key (`bellhome-key`). | `widow` | AT-NPC, wiki (snippet) Wishwall, Act 3 sheet | 3 | |
| `bellhart-scrounge-npc` | Relic Seeker Scrounge | npc | | Buys Relics for Rosaries (what he pays is not recorded). | `widow` | sheet 2 | 2 | Position in town and his gate: not found; `widow` is our reading |
| `bellhart-shakra-shop` | Shakra | shop | | An alcove high on the east wall; climb the west platforms. Ring the bronze rings to call her, after the Widow. | `widow` | SH-GRP, sheet 2 (GR-MAP) | 2 | |

### 8. Shellwood (`shellwood`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `shellwood-central-bench` | Central bench | bench | | In the middle of Shellwood; the lift up to it leads on to Sister Splinter. | `[]` | GC-SW, Act 1 sheet | 2 | |
| `shellwood-bell-shrine-bench` | Bell Shrine bench | bench | | At the far southwest of Shellwood. One of the five Bell Shrines. | `[]` | GC-SW, wiki (snippet) Bellshrine | 2 | |
| `shellwood-bellway` | Shellwood Bellway | bellway | | West side of Shellwood: climb the shaft on the left, then go left. Near the way to the Blasted Steps. | `[]` | PCGN-FT, GR-FT | 2 | FX (snippet): "southeast of Blasted Steps". Toll 40 [wiki (snippet)] versus 60 [older] |
| `shellwood-shakra-shop` | Shakra | shop | | Past the first Shellwood bench into the second big area, along the path to the southwest. | `[]` | SH-GRP | 1 | |
| `shellwood-greyroot-npc` | Greyroot | npc | | Gives Rite of the Pollip (`pollip-pouch`) and, later, Rite of Rebirth (the curse used for one Ending). | `[]` | G8-W, Act 1 sheet, Act 2 sheet | 3 | Spot not found |

Not placed: GC-SW counts 4 benches (two not named in the results), Wand lists 8 (likely duplicates). The Shellwood Shrine (Act 3, `nyleth`) belongs to Grand Gate [wiki (snippet)].

### 9. Wormways (`wormways`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `wormways-simple-key-door` | Simple Key door | door | | A large locked door on the way in from Moss Grotto. Behind it: Alchemist Zylotol's lab at the top of the Wormways (`plasmium-phial`) and a shortcut toward Bonegrave. | `simple-key-sinners-road` | PCGN-PL, G8-SK, NC-SK, HG-SK, Act 2 sheet | 4 | "West of Mosshome, across a gap under two hanging cages" [PCGN-PL] versus "above Bone Bottom, a shortcut to the Chapel of the Wanderer; needs Swift Step" [G8-SK, NC-SK]; likely one door. Which key: any; the data pairs it with the Sinner's Road key |
| `wormways-zylotol-bench` | Bench by Zylotol's lab | bench | | At the top of the Wormways, far left of Zylotol's lab. | `simple-key-sinners-road` | PCGN-PL | 1 | LM-B counts 1 bench in the Wormways |
| `wormways-zylotol-npc` | Alchemist Zylotol | npc | | His wish, Alchemist's Assistant, gives the Needle Phial and leads to the Plasmium Phial (`plasmium-phial`). | `simple-key-sinners-road` | PCGN-PL, Act 2 sheet, DG-AA | 3 | |
| `wormways-shakra-shop` | Shakra | shop | | From the entrance go southwest to the room where you hear her singing; she is in its northwest corner. | `[]` | SH-GRP | 1 | |

### 10. Sinner's Road (`sinners-road`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `sinners-road-west-bench` | West bench | bench | | Toward the left of Sinner's Road. It is trapped: wall-jump to the top-left corner of its tall room, break the odd-looking wall, then get past pendulum blades and spikes to switch it on. 60 Rosaries. | `[]` | GG-SR | 1 | |
| `sinners-road-shakra-shop` | Shakra | shop | | Right next to the west bench; her map is sold once the bench works. | `[]` | GG-SR, SH-GRP | 2 | |
| `sinners-road-green-prince-door` | Green Prince's cage | door | | In the second room of Sinner's Road; the Drifter's Cloak gets you past the spikes. Any Simple Key opens the cage; freeing him starts his story (Lost Verdania, Act 3). | `[]` | NC-SK, GP-GRP, wiki (snippet) Simple Key | 3 | It opens no entry, so no key is paired with it (Q3). One forum post (low) also ties it to the Sinner's Road door |
| `sinners-road-lugoli-arena` | Disgraced Chef Lugoli | arena | | Optional boss. One of Loyal Mergwin's dishes needs this fight (the Pale Oil for `hivesteel-needle`). | `[]` | PCGN-B, Act 2 sheet | 2 | Room not found |

Not placed: the second bench (GC-SR counts 2; not described).

### 11. Blasted Steps (`blasted-steps`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `blasted-steps-entrance-bench` | Entrance bench | bench | | Just past the first climb: go left in the next room and pay to use it. | `[]` | IIG-BS, wiki (snippet) Bench | 2 | |
| `blasted-steps-bellway-bench` | Bellway bench | bench | | At the Bellway station, once paid. | `[]` | wiki (snippet) Bench, Save Points | 1 | |
| `blasted-steps-pinstress-bench` | Pinstress's bench | bench | Pinstress's hut | At the Pinstress's home at the far west, past the Great Conchflies. | `great-conchflies` | wiki (snippet), IIG-BS, Act 1 sheet | 3 | |
| `blasted-steps-bellway` | Blasted Steps Bellway | bellway | | High in the Blasted Steps, left of the way to the Last Judge. Lumble plays dice left and down from it; Voltnest is a climb up from it. | `[]` | PCGN-FT, GR-FT, Act 2 sheet | 2 | "Right of the middle drop, toward the Sands" [PA-FT]; "between the Sands and the Grand Gate" [FX (snippet)]. Toll 60 [wiki (snippet)] versus 80 |
| `blasted-steps-grindle-shop` | Grindle | shop | | In the northwest chamber near the way to the Sands of Karak; his cave needs the Faydown Cloak. | `faydown-cloak` | sheet 2 (SR-V, DS-CK, STEAM-G) | 3 | |
| `blasted-steps-lumble-npc` | Lumble the Lucky | npc | | Left and down from the Bellway. Plays dice for Rosaries; win them all and he pays with his dice (`magnetite-dice`). | `[]` | Act 2 sheet (SHK, SK, PCG, AT) | 4 | |
| `blasted-steps-flea-caravan-npc` | Flea Caravan, third camp | npc | | The caravan's third camp, in the Last Judge's arena room. More fleas, and the cave in the far east found, move it to Fleatopia (`tool-pouch-fleatopia`). | `last-judge` | GR-FL, TR-FL, STEAM-FC | 3 | Region: Blasted Steps [GR-FL, STEAM-FC] versus "speak to Mooshka at the Grand Gate" [FX (snippet)] |

Not placed: Shakra (listed for the Blasted Steps [G8-NPC], no directions found). LM-B counts 6 benches, IIG-BS 3.

### 12. Weavenest Atla (`weavenest-atla`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `weavenest-atla-bench` | Weavenest Atla bench | bench | | At the bottom, next to the lift; the two Moss Mothers wait to the west of it. | `[]` | GC-B, SK-WA, Act 1 sheet | 3 | |
| `weavenest-atla-eva-npc` | Eva | npc | | In the far east chamber of Weavenest Atla. Once enough Crest slots are open she asks to be Bound, which gives Sylphsong (`sylphsong`). | `[]` | RR-EVA, wiki (snippet) Eva, Act 3 sheet | 3 | |

### 13. Grand Gate (`grand-gate`)

No place confirmed. The results give an automatic save in the first room after the Last Judge [wiki (snippet) Save Points] (not a bench), a map machine just inside [FD-GG], and a way back by breaking the floor in the far southwest of the Choral Chambers [one result]. **Gap:** no bench found. A lift beside the Sands of Karak's eastern bench gives a shortcut to just west of the Grand Gate (Sands row).

### 14. Underworks (`underworks`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `underworks-toll-benches` | Toll benches | bench | | Benches here charge a small toll every time you sit. One map mark per room, even where two or three stand together. | `[]` | wiki (snippet) Bench, IIG-UW, FD-GG | 3 | Toll 15 [FD-GG] versus 15 and 25, with one free bench [IIG-UW]. Named Southwest, Mid and East [FX (snippet)] versus Start, Unravelled and Twelfth Architect [GC-B]. One row until the rooms are known (Q4) |
| `underworks-architect-bench` | Twelfth Architect bench | bench | | The northeast bench; the Twelfth Architect's shop is to its right. | `clawline` | wiki (snippet) Bench, Act 2 sheet | 2 | Copies the shop's gate from the data; whether the bench itself needs the Clawline: not found |
| `underworks-ventrica` | Underworks Ventrica | other | | A Ventrica tube station, linked to the Citadel's other six. Pay its toll machine once. | `[]` | wiki (snippet) Fast Travel, DG-V | 2 | Position not found. Toll 80 [DG-V] |
| `underworks-twelfth-architect-shop` | Twelfth Architect | shop | | The only merchant of the Underworks. Some wares also need Craftmetal. | `clawline` | sheet 2 | 3 | Sheet 2 warning: buying everything before she repairs the Ruined Tool may lose her Silkshot (one source) |
| `underworks-architect-chapel-door` | Chapel of the Architect door | door | | An ornate door near the Architect's workshop. Her Architect's Key (sold once you own 25 Tools) opens it; inside is the Architect Crest (`architect-crest`). | `clawline` | GG-AC, wiki (snippet) Architect's Key, DG-AC | 3 | "Upper left as you leave her house" [GG-AC] versus "right of the workshop, up a short climb, then left" [one guide]. The data says the door shuts for good once you leave |

### 15. Choral Chambers (`choral-chambers`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `choral-chambers-songclave-bench` | Songclave bench | bench | Songclave | The main bench of the Songclave. The White Key lies to its right; the Cogwork Dancers are reached to its left. | `[]` | GC-B, GRX-W, Act 2 sheet (IIG) | 3 | |
| `choral-chambers-first-shrine-bench` | First Shrine bench | bench | Songclave | A single seat in the First Shrine, the first bench you reach in the Songclave. The sixth Bell Shrine. | `[]` | GC-B, wiki (snippet) Bellshrine, FIL-V | 3 | |
| `choral-chambers-grand-bellway-bench` | Grand Bellway bench | bench | Grand Bellway | Next to the Grand Bellway. A lever before Trobbio's stage opens a shortcut to it. | `[]` | GC-CC, DG-V, Act 2 sheet | 3 | |
| `choral-chambers-entrance-bench` | Entrance bench | bench | | Reached as you come up out of the Underworks. | `[]` | GC-B | 1 | |
| `choral-chambers-spa-bench` | Citadel Spa bench | bench | Citadel Spa | In the west of the Choral Chambers. | `[]` | GC-B | 1 | |
| `choral-chambers-central-bench` | Central bench | bench | | Just below Loyal Mergwin's dining room. | `[]` | GC-B | 1 | |
| `choral-chambers-grand-bellway` | Grand Bellway | bellway | Grand Bellway | Lower right of the Choral Chambers. Its Bellway and Ventrica stations stand side by side, so you change networks here. | `[]` | wiki (snippet) Fast Travel, DG-V, FSM | 3 | |
| `choral-chambers-grand-bellway-ventrica` | Grand Bellway Ventrica | other | Grand Bellway | Ventrica station beside the Grand Bellway, past the bench. | `[]` | DG-V, wiki (snippet) | 2 | Toll 80 [DG-V] |
| `choral-chambers-first-shrine-ventrica` | First Shrine Ventrica | other | Songclave | Ventrica station just above the Songclave. | `[]` | FIL-V, wiki (snippet) | 2 | |
| `choral-chambers-west-ventrica` | Choral Chambers Ventrica | other | | Ventrica station at the far west of the Citadel, past a locked gate on the Grand Gate side. | `[]` | FIL-V, DG-V, GRX-W | 3 | |
| `choral-chambers-whiteward-lift` | Whiteward lift | door | | In the southwest corner, near the Choral Chambers Ventrica: follow the long hall, take the left exit, go down the shaft and turn right. The White Key opens it. | `white-key` | GRX-W, wiki (snippet) Whiteward | 2 | A forum post (low): "through the big wheel gate, at the bottom of the Choral Chambers" |
| `choral-chambers-jubilana-shop` | Jubilana | shop | Songclave | Right of the First Shrine, once The Wandering Merchant is done. Her stock grows after The Lost Merchant. | `wandering-merchant` | sheet 2 (GS-J, G8-J, DS-WM, GR-J) | 4 | |
| `choral-chambers-songclave-wishboard` | Songclave wishboard | wishboard | Songclave | Across from the Songclave's people. Building Up Songclave, Fine Pins and Sherma's Balm for the Wounded post here. One of the three boards for Silk and Soul. | `[]` | G8-W, NL-W, SK-FP, Act 2 sheet | 4 | DX-W lists a fourth board "in The Citadel" (alone) |
| `choral-chambers-caretaker-npc` | The Caretaker | npc | Songclave | Gives Silk and Soul (`silk-and-soul`), the way into Act 3. | `[]` | Act 3 sheet, wiki (snippet) Wishwall | 3 | |
| `choral-chambers-mergwin-npc` | Loyal Mergwin | npc | | In his dining room above the central bench. Great Taste of Pharloom: five dishes for a Pale Oil (`hivesteel-needle`). | `[]` | GC-B, Act 2 sheet | 2 | |

Not placed: a bench in the southwest just before the High Halls entrance [wiki (snippet), file caption]. Counts: 2 [one guide] to 7 [another].

### 16. Cogwork Core (`cogwork-core`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `cogwork-core-bench` | Retractable bench | bench | | In the bench room on the left: hit the gear on top several times and the bench folds out. | `[]` | wiki (snippet) Bench, IIG-CC | 2 | Whether it needs the Cogwork Dancers: not found |

### 17. Whispering Vaults (`whispering-vaults`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `whispering-vaults-south-bench` | Southern bench | bench | | The southernmost bench of the Vaults; a Psalm Cylinder lies west of it. | `[]` | KG-PS | 1 | NC-PI describes a lower bench beside a breakable wall; maybe the same |
| `whispering-vaults-cardinius-npc` | Vaultkeeper Cardinius | npc | | Takes the Psalm Cylinders you find and pays for them. | `[]` | KG-PS, sheet 2 | 2 | Spot not found |

The wiki lists benches "throughout" the Vaults [wiki (snippet)]; only one is placed.

### 18. Whiteward (`whiteward`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `whiteward-bench` | Whiteward bench | bench | | Near the big lift down into Whiteward. | `[]` | AT-SK | 1 | |
| `whiteward-surgeons-key-door` | Ornate lock (Surgeon's Key) | door | | West along the bottom floor from the lift. The Surgeon's Key (pulled down with the Clawline) opens the sluice under the theatre, the way to the Unravelled (`silk-heart-unravelled`). | `clawline` | AT-SK, SK-SKY, GC-WW | 3 | Key from "a corpse at the top right; the door at the bottom left" [one guide] versus the route above |

### 19. High Halls (`high-halls`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `high-halls-bench` | High Halls bench | bench | | The High Halls bench; the treasury door is west of it. | `[]` | wiki (snippet) Bench, Act 2 sheet | 2 | Position beyond that: not found |
| `high-halls-ventrica` | High Halls Ventrica | other | | Ventrica station of the High Halls. | `[]` | wiki (snippet) Fast Travel, DG-V | 2 | Position not found |
| `high-halls-treasury-door` | Treasury door | door | | A Simple Key door west of the bench, near the top of a tall room. Behind it, across the platforms, is the treasury with the Rosary Cannon (`rosary-cannon`). | `simple-key-jubilana` | Act 2 sheet (NC, DG, wiki (snippet)), GR-SK, SK-SK | 4 | |

Not placed: the Second Sentinel (Act 2 secret boss [SK-B]; location not found; sheet 1 ties the Sawtooth Circlet to it).

### 20. The Slab (`the-slab`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `the-slab-north-bench` | North bench | bench | | In the north of The Slab, past the frozen outside. Your things are given back here, before a Wardenfly fight. | `[]` | wiki (snippet) The Slab | 1 | |
| `the-slab-bellway-bench` | Bench near the Bellway | bench | | Near the Bellway; a hidden ceiling path to its right leads to the First Sinner. | `[]` | Act 2 sheet (wiki (snippet), GB-SS) | 2 | |
| `the-slab-bellway` | The Slab Bellway | bellway | | In the south of The Slab. | `[]` | wiki (snippet), G4G-FT, PCGN-FT | 3 | Toll 40 [wiki, G4G-FT] versus 50 [PCGN-FT] |
| `the-slab-apostate-door` | Apostate lock | door | | Doors with the Apostate mark open with the Key of Apostate; this room's hidden tunnels lead to the First Sinner's cell (`rune-rage`). The Indolent and Heretic keys open their own marked locks. | `key-of-apostate` | wiki (snippet) Slab Keys, The Slab | 1 | Where the Key of Apostate is: Putrified Ducts [wiki (snippet)] versus Bilewater [DG-SLK] |

### 21. Mount Fay (`mount-fay`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `mount-fay-southwest-bench` | Southwest bench | bench | | Low on the left, behind a breakable wall, near a Mask Shard; costs 90 Rosaries; its bells sound like sleigh bells. The data's "western bench". | `[]` | wiki (snippet) Bench, YH-MF, PCG-MF | 3 | GB-MF puts the 90-Rosary toll on a bench in the middle of the mountain |
| `mount-fay-middle-bench` | Middle bench | bench | | Middle right of the mountain, on the climb to the peak. | `[]` | YH-MF, GB-MF | 2 | |
| `mount-fay-peak-bench` | Bench near the peak | bench | | In a side room near the peak. | `[]` | GB-MF | 1 | |
| `mount-fay-shakra-shop` | Shakra | shop | | In the first room inside the mountain, warming herself at the fire. | `[]` | SH-GRP | 1 | |

The Act 3 sheet's "southeast bench of Mount Fay" (Brightvein route) is not matched to any row above.

### 22. Memorium (`memorium`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `memorium-bench` | Memorium bench | bench | | A bench in the Memorium. | `[]` | wiki (snippet) Bench | 1 | Position not found |
| `memorium-ventrica` | Memorium Ventrica | other | | Ventrica station of the Memorium. | `[]` | wiki (snippet) Fast Travel, DG-V | 2 | Position not found |

### 23. Putrified Ducts (`putrified-ducts`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `putrified-ducts-huntress-bench` | Huntress's bench | bench | | In the west of the Ducts, next to the Huntress (Runt in Act 3). The nearest bench to the Wreath of Purity. | `[]` | GC-PD, DG-WP | 2 | |
| `putrified-ducts-bellway-bench` | Bellway bench | bench | | Next to the Putrified Ducts Bellway. | `[]` | GC-PD, DX-PD | 2 | Cost 60 [GC-PD] versus 120 [DX-PD] |
| `putrified-ducts-bellway` | Putrified Ducts Bellway | bellway | | The Ducts' Bellway station. | `[]` | wiki (snippet), G4G-FT, PCGN-FT, DX-PD | 4 | Position not found. Toll 80 [wiki, G4G-FT] versus 90 [DX-PD] versus 120 [PCGN-FT] |
| `putrified-ducts-huntress-npc` | The Huntress | npc | | Her wish, Broodfeast, gives the Longclaw (`longclaw`). Runt gives it in Act 3. | `[]` | GC-PD, Act 2 sheet | 2 | |
| `putrified-ducts-fleatopia-npc` | Fleatopia | npc | Fleatopia | The Flea Caravan's last camp, in a cave at the far east. Vog shows missing fleas for Rosaries; the Act 3 Festival of the Flea games are here. | `[]` | GR-FL, TR-FL, STEAM-FC, Act 3 sheet | 3 | Fleas needed: 25 [GR-FL, STEAM-FC] versus 20 [GC-PD] |

Not placed: a Fleatopia bench (none found).

### 24. Wisp Thicket (`wisp-thicket`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `wisp-thicket-bench` | Bagged bench | bench | | The only bench, hanging inside a bag on a wooden platform (a detour to the right). Hit the bag to free it. | `[]` | wiki (snippet) Wisp Thicket, NL-FL | 2 | |

### 25. Bilewater (`bilewater`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `bilewater-bellway-bench` | Bellway bench | bench | | By the Bellway, near the breakable wall into the Exhaust Organ. 90 Rosaries. | `[]` | GG-BW | 1 | |
| `bilewater-organ-bench` | Exhaust Organ bench | bench | Exhaust Organ | On the left exhaust route of the Organ. | `[]` | GG-BW | 1 | |
| `bilewater-top-bench` | Top right bench | bench | | At the top right of Bilewater; needs the double jump. An empty bellhome beside the top bench holds one of the Caretaker's souls (Act 3). | `faydown-cloak` | GG-BW, Act 3 sheet | 2 | Same bench in both: our reading |
| `bilewater-bilehaven-bench` | Bilehaven bench | bench | Bilehaven | Inside the village of Bilehaven. | `[]` | GG-BW | 1 | |
| `bilewater-secret-bench` | Secret bench | bench | | A hidden bench, near where Groal the Great is fought; a breakable wall lies south of it. | `[]` | SMI-B, GRX-BW, GC-ML | 3 | Position not found beyond that |
| `bilewater-bellway` | Bilewater Bellway | bellway | | Bilewater's Bellway station, near the wall into the Exhaust Organ. | `[]` | wiki (snippet), G4G-FT, PCGN-FT, GG-BW | 4 | Toll 80 [wiki, G4G-FT] versus 90 [GG-BW] versus 120 [PCGN-FT, PA-FT] |
| `bilewater-shakra-shop` | Shakra | shop | | In a room just off Bilewater's biggest vertical chamber. | `[]` | SH-GRP | 1 | |

Warning, not a place: a bench in northern Bilewater collapses into maggot water when you sit, and never works [wiki (snippet)]. Groal the Great (boss, Bilewater [NL-B]) has no room in the results.

### 26. Sands of Karak (`sands-of-karak`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `sands-of-karak-east-bench` | Eastern bench | bench | | On the eastern tip, through a breakable wall in a tall room. A corpse sitting on it holds the last Simple Key. A lift beside it (break the coral) is a shortcut to just west of the Grand Gate. | `[]` | NL-SKD, wiki (snippet) Simple Key, G8-SK, PCGN-SK | 4 | |
| `sands-of-karak-voltnest-bench` | Voltnest bench | bench | Voltnest | At the far right of the throne room in Voltnest. Voltnest is a climb up from the Blasted Steps Bellway once its shortcut is open. | `[]` | wiki (snippet) Coral Tower | 1 | The same snippet puts the Conchcutter before that throne; the data says the Coral Tower (Q8) |

Not placed: Shakra (Sands of Karak map [sheet 2]; no directions). "Only one bench before you beat the boss" [NL-SKD].

### 27. The Cradle (`the-cradle`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `the-cradle-terminus-ventrica` | Terminus Ventrica | other | Terminus | The Ventrica line's end station by The Cradle, with no toll. Reachable from any Ventrica station long before The Cradle opens. | `[]` | wiki (snippet) The Cradle, DG-V, FIL-V | 3 | See Q5: reachable before its Region is Available |
| `the-cradle-terminus-bench` | Terminus bench | bench | Terminus | At the Terminus. Crossing The Cradle's southeast corner clears rubble back to it: a bench and fast travel near the end of Act 2. | `[]` | wiki (snippet) The Cradle | 1 | |
| `the-cradle-map-bench` | Bench by the map machine | bench | | Opposite the western shaft, where a machine sells The Cradle's map. | `[]` | wiki (snippet) The Cradle | 1 | |
| `the-cradle-border-caves-bench` | Border Caves bench | bench | Border Caves | Act 3: Silk Soar up from near the Pale Nails spot into the Border Caves above The Cradle; one bench, no map. | `silk-soar` | wiki (snippet) The Cradle | 1 | |

### 28. The Abyss (`the-abyss`)

| id | name | kind | area | how | requires | sources | agree | disagreements |
|---|---|---|---|---|---|---|---|---|
| `the-abyss-south-bench` | South bench | bench | | The bottom bench of The Abyss; its map lies above it. | `[]` | wiki (snippet) Save Points, GH-AB | 2 | |
| `the-abyss-north-bench` | North bench | bench | | Below the escape shaft. | `[]` | wiki (snippet) Save Points | 1 | |
| `the-abyss-everbloom-bench` | Last Abyss bench | bench | | A bench that becomes usable once you have the Everbloom; after the Sister of the Void Ending the game reloads here. | `everbloom` | wiki (snippet) Save Points, Act 3 sheet | 2 | |

## Vendors and the entry ids they sell

For linking a shop place to its entries. Prices stay on the entries (`price`), never on places. From `data/items.json` (`dataVersion` 10) and sheet 2.

| Vendor | place id | entry ids sold (in `data/` today) |
|---|---|---|
| Pebb | `moss-grotto-pebb-shop` | `magnetite-brooch`, `mask-shard-bone-bottom`, `simple-key` |
| Shakra (one place per camp) | `the-marrow-shakra-shop` and the other Shakra rows | `compass`, `quill`, `bench-pins`, `shell-marker`, `map-mosslands`, `map-the-marrow` (The Marrow); each other Region's map at that Region's camp: `map-deep-docks`, `map-far-fields`, `map-hunters-march`, `map-greymoor`, `map-bellhart`, `map-shellwood`, `map-wormways`, `map-sinners-road`, `map-blasted-steps` |
| Forge Daughter | `deep-docks-forge-daughter-shop` | `crafting-kit-forge`, `magma-bell`, `sting-shard` |
| Mort | `far-fields-mort-shop` | `weighted-belt`, `tool-pouch-pilgrims-rest`, `memory-locket-mort` |
| Mottled Skarr | `hunters-march-mottled-skarr-shop` | `curveclaw`, `fractured-mask` |
| Frey | `bellhart-frey-shop` | `memory-locket-frey`, `spool-fragment-bellhart`, `multibinder`, `bellhome-desk`, `bellhome-gleamlights`, `bellhome-bell-lacquer`, `bellhome-personal-spa` |
| Pinmaster Plinney | `bellhart-plinney-shop` | `sharpened-needle`, `shining-needle`, `hivesteel-needle`, `pale-steel-needle` |
| Grindle | `blasted-steps-grindle-shop` | `thiefs-mark`, `spool-fragment-grindle`, `crafting-kit-grindle`, `snitch-pick`; in Act 3 also `memory-locket-mort` and `tool-pouch-pilgrims-rest` if Mort's were not bought |
| Jubilana | `choral-chambers-jubilana-shop` | `ascendants-grip`, `mask-shard-songclave`, `spool-extender`, `spider-strings`, `simple-key-jubilana`, `spool-fragment-jubilana`; `white-key` only as a fallback |
| Twelfth Architect | `underworks-twelfth-architect-shop` | `cogwork-wheel`, `scuttlebrace`, `sawtooth-circlet`, `crafting-kit-architect`, `architect-crest` (its price is the Architect's Key) |

**Every entry with a `price` in `data/` appears in this table** (a script checked it: 44 priced entries). Only `memory-locket-mort` and `tool-pouch-pilgrims-rest` appear twice, on purpose (Mort, then Grindle in Act 3). Not shops: Lumble (`magnetite-dice` is won at dice), Relic Seeker Scrounge and Vaultkeeper Cardinius (they buy), Creige (Nectar, not tracked), Grishkin, Kratt, Loddle and Vog (no stock found, sheet 2 section 3.11).

## Counts per Region

| # | Region | bench | bellway | shop | npc | wishboard | arena | door | other | total |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Moss Grotto | 4 | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 8 |
| 2 | The Marrow | 4 | 1 | 1 | 2 | 0 | 2 | 0 | 0 | 10 |
| 3 | Deep Docks | 4 | 1 | 2 | 0 | 0 | 1 | 2 | 0 | 10 |
| 4 | Far Fields | 4 | 1 | 2 | 2 | 0 | 0 | 1 | 0 | 10 |
| 5 | Hunter's March | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 3 |
| 6 | Greymoor | 5 | 1 | 1 | 2 | 0 | 0 | 0 | 0 | 9 |
| 7 | Bellhart | 3 | 1 | 3 | 2 | 1 | 0 | 0 | 0 | 10 |
| 8 | Shellwood | 2 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 5 |
| 9 | Wormways | 1 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 4 |
| 10 | Sinner's Road | 1 | 0 | 1 | 0 | 0 | 1 | 1 | 0 | 4 |
| 11 | Blasted Steps | 3 | 1 | 1 | 2 | 0 | 0 | 0 | 0 | 7 |
| 12 | Weavenest Atla | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 2 |
| 13 | Grand Gate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | Underworks | 2 | 0 | 1 | 0 | 0 | 0 | 1 | 1 | 5 |
| 15 | Choral Chambers | 6 | 1 | 1 | 2 | 1 | 0 | 1 | 3 | 15 |
| 16 | Cogwork Core | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 17 | Whispering Vaults | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 2 |
| 18 | Whiteward | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 2 |
| 19 | High Halls | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 3 |
| 20 | The Slab | 2 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 4 |
| 21 | Mount Fay | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 4 |
| 22 | Memorium | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 2 |
| 23 | Putrified Ducts | 2 | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 5 |
| 24 | Wisp Thicket | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 25 | Bilewater | 5 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 7 |
| 26 | Sands of Karak | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| 27 | The Cradle | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 4 |
| 28 | The Abyss | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| | **Total** | **67** | **12** | **20** | **18** | **3** | **4** | **11** | **7** | **142** |

All 12 Bellway stations the sources name are here (Bone Bottom, The Marrow, Deep Docks, Far Fields, Greymoor, Bellhart, Shellwood, Blasted Steps, The Slab, Grand Bellway, Bilewater, Putrified Ducts) [wiki (snippet), FSM, NEO-BW, PCGN-FT], and all 7 Ventrica stations (Terminus, Memorium, High Halls, First Shrine, Choral Chambers, Grand Bellway, Underworks) [wiki (snippet), DG-V]. All three wishboards. All four Simple Key doors (Deep Docks, Wormways, Sinner's Road, High Halls) [Act 2 sheet decision 5]. 67 of about 82 benches.

## Riskiest facts (check in game first)

1. **The Bone Bottom wishwall's gate** (after the Deep Docks or after Far Fields) and **Pebb's gate**: the data's `simple-key` requires nothing, while `magnetite-brooch` and `mask-shard-bone-bottom` from the same stall require `moss-mother`. One of them is wrong; the place copies `moss-mother`.
2. **The Wormways door is one door or two** ("above Bone Bottom" versus "west of Mosshome"). If two, there are five Simple Key doors and four keys.
3. **Bell Shrines:** five in Act 1 (The Marrow, Deep Docks, Greymoor, Bellhart, Shellwood [wiki (snippet)]) versus a Far Fields Bell Shrine [GC-B]. Which bench in each Region is the shrine rests on GC-B alone except The Marrow.
4. **Bellway and bench tolls** were lowered by a patch [wiki (snippet) history], so every toll quoted from an older guide may be stale. The sheet puts no toll in `how` except where two sources agree (30 for the lower Marrow bench).
5. **Mottled Skarr's gate** (Fourth Chorus or not) and **the Flea Caravan's thresholds** (15, 20 or 25 fleas).
6. **Single-source rows** (agree 1): 11 rows, most of them benches. Positions from GC-B, GG-SR, GG-BW and the wiki snippets were not cross-checked.
7. **Diving Bell Key from Ballow or the Caretaker** (already open in the Act 3 sheet).

## Open questions (Athos)

- **P1. Scope.** 142 places, 67 of them benches. Ship benches and Bellways for every Region first (they are what a player needs most), then shops, doors and wishboards, then NPCs and arenas? Recommendation: one file, all kinds, but Athos checks the 86 benches and stations first, because they are the riskiest by count.
- **P2. Ventrica stations:** a kind of their own (`ventrica`) or `other`? Recommendation: **add `ventrica`** (or rename `bellway` to `travel` with a field saying which network). Seven stations and their own toll machines; on a Region page "Fast travel" is the heading a player looks for, and `other` hides them. The contract task decides.
- **P3. "Any Simple Key" doors.** `requires` can only say "all of". The sheet copies the data's pairing (Pebb's key for the Deep Docks door, and so on) so places and entries agree. The Green Prince's cage opens no entry, so it gets no key. Keep the pairing?
- **P4. Groups.** The Underworks toll benches are one row because the rooms are not known. Allowed, or one row per bench only?
- **P5. Places reachable before their Region is Available.** The Terminus Ventrica (The Cradle) can be reached from any Ventrica long before The Cradle opens, yet a place inherits its Region's `requires`. Options: (a) move it to the Region it is reached from; (b) let a place opt out of its Region's `requires` (a contract change). Recommendation: (a), keep the rule simple.
- **P6. Beastling Call** (Bell Eater, Act 3): is it a Collectible the guide should track (`counts: false`)? Not on the counted list.
- **P7. Places that move** (Shakra's camps, the Flea Caravan's four camps, Mort in Act 3, Jubilana): one place per stop, as here, with the "when" in `how`? Recommendation: yes; a `when` or act field only if the interface needs to hide stops that are gone.
- **P8.** The data puts the Conchcutter in the Coral Tower; one wiki snippet puts it in Voltnest's throne room. Not a places question, but found here.
- **P9. Bench positions.** 16 or so benches are still unplaced (Grand Gate, Whiteward beyond one, Whispering Vaults, Memorium, Sands of Karak, Shellwood's other two). Athos fills them from his own play, or they wait.

## Brief for Dev C (`data/places.json`)

**Do not hand out until Athos approves this sheet and the third-round contract text (ADR 0007).**

- **Contract:** read on 2026-10-20 at the end of this research. `docs/CONTRACTS.md` section 1, "`places.json`", and validator rule 16 now exist (third round, awaiting Athos's review). This sheet's columns match them: `id`, `name`, `kind`, `regionId` (the section's Region id), `area` (omit when blank), `how`, `requires`, `sells` (shops only), `source`. The kind list is the same eight kinds. `requires` has the contract's meaning (own plus Region's, read by `missingForPlace`), so a row's `[]` stays `[]`.
- **Ids.** The contract suggests `<kind>-<name>` but does not enforce it; this sheet uses `<regionId>-<place>-<kind>` because the task asked for a Region prefix, and it makes the 13 Shakra and 4 Flea Caravan rows readable. Either form is valid under rule 16; **the orchestrator or Athos picks one before Dev C starts**, because ids are permanent (the Rosaries page links to `place-<id>`). The script check above holds for both forms.
- **`sells`:** the entry ids in the Vendors table, on the matching shop row, in that order (an entry sold by two vendors is listed by both, as the contract allows). Never a price on a Place.
- **`source`:** one http or https link, the first guide page in the row's sources (the list below), never "wiki (snippet)" (the wiki was never opened, so it is not a page we read). Where the only source is a wiki snippet or an earlier sheet, use that sheet's source for the fact, or leave the row out until Athos gives one. A MapGenie link (`https://mapgenie.io/hollow-knight-silksong/...`) goes in only when Athos supplies it, per "Sources and MapGenie"; no agent writes or invents one, and no text comes from it.
- **`how`:** the sheet's text, our words, under 300 characters (all 142 are). Disagreements stay in Athos's review, not in `how`. No toll numbers beyond what the row already says.
- **Leave out:** rows Athos strikes; rows whose open question (P2 to P7) he settles otherwise. If he picks P2's `ventrica` kind, that is a contract change first (rule 16's list), not a data edit.
- **Checks:** `node scripts/validate-data.js` (rule 16 once the validator task merges it) and `node --test "tests/*.test.js"` pass. A throwaway script (not committed) confirms every `requires` and `sells` id exists in `items.json`, ids are unique across all files, and every priced entry in `items.json` is sold by at least one shop.

## Sources

Search-result pages only; none was opened.

- **wiki (snippet)**: hollowknight.wiki text as quoted in search results (Fast Travel (Silksong), Bench (Silksong), Save Data (Silksong)/Save Points, Bellshrine, Wishwall, Slab Keys, The Slab, Whiteward, Wisp Thicket, The Cradle, Diving Bell, Eva, Architect's Key, Grindle, Simple Key (Silksong), Coral Tower, Tool Pouch, Grand Gate); never opened.
- **FX (snippet)**: Fextralife text as quoted in search results (Bellways, Deep Docks, Flea Caravan, Bench Checkpoint, Shakra); never opened.
- Earlier sheets: **Act 1 sheet** `docs/PHASE-3-ACT-1.md`, **Act 2 sheet** `docs/PHASE-3-ACT-2.md`, **Act 3 sheet** `docs/PHASE-3-ACT-3.md`, **sheet 2** `docs/PHASE-5-SHEET-2-MEMENTOS-EQUIPMENT-SHOPS.md` (their codes, such as G8-PEBB or GR-MAP, are listed there).
- AT-A3, AT-BH, AT-GM, AT-NPC, AT-SK: allthings.how: [Silk and Soul](https://allthings.how/silksong-act-3-how-to-unlock-silk-and-soul-sep-2025/), [free Bellhart and its wish board](https://allthings.how/hollow-knight-silksong-free-bellhart-and-unlock-the-wish-board/), [Greymoor](https://allthings.how/hollow-knight-silksong-greymoor-guide-map-reaper-chapel-moorwing/), [NPCs](https://allthings.how/silksong-npcs-merchants-wanderers-questlines/), [Surgeon's Key](https://allthings.how/hollow-knight-silksong-how-to-get-and-use-the-surgeons-key/)
- DG-AA, DG-AC, DG-B, DG-P, DG-SLK, DG-V, DG-WA, DG-WP: Deltia's Gaming: [Alchemist's Assistant](https://deltiasgaming.com/?p=344432), [Architect Crest](https://deltiasgaming.com/?p=339597), [benches, Act 1](https://deltiasgaming.com/hollow-knight-silksong-all-bench-locations-act-1/), [Act 1 Pharloom guide](https://deltiasgaming.com/hollow-knight-silksong-complete-act-1-pharloom-guide/), [Slab keys](https://deltiasgaming.com/?p=345902), [Ventrica stations](https://deltiasgaming.com/hollow-knight-silksong-all-ventrica-station-locations-fast-travel), [reach Weavenest Atla](https://deltiasgaming.com/?p=341466), [Wreath of Purity](https://deltiasgaming.com/?p=346369)
- DX-PD, DX-W: Destructoid: [Putrefied Ducts map](https://www.destructoid.com/putrefied-ducts-map-location-in-hollow-knight-silksong/), [wishes](https://www.destructoid.com/all-hollow-knight-silkong-wishes-locations-tasks-and-rewards/)
- FD-GG: [fdaytalk, Grand Gate map](https://www.fdaytalk.com/grand-gate-map-hollow-knight-silksong/) (low)
- FIL-V: [The Filibuster Blog, Ventrica stations](https://thefilibusterblog.com/hollow-knight-silksong-guide-to-ventrica-station-locations/)
- FSM: [fullsilksongmap, 12 Bellways and 7 Ventricas](https://fullsilksongmap.com/bellways)
- FT-GRP: one search whose summary did not attribute each fact; results were [PCGamesN fast travel](https://www.pcgamesn.com/hollow-knight-silksong/fast-travel), [DualShockers Bell Beast stations](https://www.dualshockers.com/hollow-knight-silksong-all-bell-beast-station-locations/), [guides4gamers](https://guides4gamers.com/hollow-knight-silksong/pois/fast-travel/), [GameRant](https://gamerant.com/silksong-every-fast-travel-location-all-bellways-bell-beast-stations-ventrica-locations/), FX (snippet), wiki (snippet), FSM, PA-FT
- G4G-FT: [guides4gamers, fast travel](https://guides4gamers.com/hollow-knight-silksong/pois/fast-travel/)
- G8-FL, G8-NPC, G8-SK, G8-W: Game8: [fleas](https://game8.co/games/Hollow-Knight-Silksong/archives/549001), [NPCs](https://game8.co/games/Hollow-Knight-Silksong/archives/548973), [Simple Keys](https://game8.co/games/Hollow-Knight-Silksong/archives/549778), [wishes](https://game8.co/games/Hollow-Knight-Silksong/archives/549042)
- GB-DB, GB-MF, GBL-SB: Gamer Blurb: [diving bell](https://gamerblurb.com/articles/hollow-knight-silksong-deep-docks-diving-bell-guide-location), [Mount Fay](https://gamerblurb.com/articles/hollow-knight-silksong-mount-fay-guide-benches-map), [Silver Bells](https://gamerblurb.com/articles/hollow-knight-silksong-gather-silver-bells-guide-locations)
- GC-B, GC-CC, GC-DD, GC-MAR, GC-ML, GC-PD, GC-SR, GC-SW, GC-WW: game-checklists.com: [all benches](https://game-checklists.com/silksong/all-benches.html), [Choral Chambers](https://game-checklists.com/silksong/choral-chambers.html), [Deep Docks](https://game-checklists.com/silksong/deep-docks.html), [The Marrow](https://game-checklists.com/silksong/the-marrow.html), [Memory Lockets](https://game-checklists.com/silksong/all-memory-lockets.html), [Putrified Ducts](https://game-checklists.com/silksong/putrified-ducts.html), [Sinner's Road](https://game-checklists.com/silksong/sinners-road.html), [Shellwood](https://game-checklists.com/silksong/shellwood.html), [Whiteward](https://game-checklists.com/silksong/whiteward.html)
- GG-A3, GG-AC, GG-BW, GG-GM, GG-HM, GG-SR: Gamer Guides: [Act 3](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-3), [Architect's Key](https://www.gamerguides.com/hollow-knight-silksong/guide/crests/architect/architect-key-crest), [Bilewater benches](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-2/bilewater-benches), [Greymoor benches](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-1/greymoor-benches), [Hunter's March](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-1/hunters-march-bench-locations-and-walkthrough), [Sinner's Road benches](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-1/sinners-road-benches)
- GH-AB: [GamesHedge, Abyss map](https://www.gameshedge.com/hollow-knight-silksong-the-abyss-map-guide/)
- GP-GRP: one search on the Green Prince's door; results were Deltia's [Simple Key doors](https://deltiasgaming.com/hollow-knight-silksong-where-to-use-the-simple-key), [Gamer Guides Simple Key](https://www.gamerguides.com/hollow-knight-silksong/guide/items/exploration/simple-key), [Nintendo Life Simple Keys](https://www.nintendolife.com/guides/hollow-knight-silksong-simple-key-locations-where-to-find-every-locked-door), wiki (snippet) Simple Key; the summary did not say which said "second room" and "any key"
- GR-FL, GR-FT, GR-SK: GameRant: [fleas](https://gamerant.com/silksong-where-to-find-all-lost-fleas-every-flea-location/), [fast travel](https://gamerant.com/silksong-every-fast-travel-location-all-bellways-bell-beast-stations-ventrica-locations/), [Simple Key doors](https://gamerant.com/hollow-knight-hk-silksong-simple-key-lock-door-locations-where-find-use/)
- GRX-BW, GRX-W: Gameranx: [secret Bilewater bench](https://gameranx.com/features/id/553572/article/psa-dont-miss-the-secret-bilewater-bench-in-hollow-knight-silksong/), [Whiteward](https://gameranx.com/features/id/551986/article/hollow-knight-silksong-how-to-access-the-whiteward-white-key-location/)
- HG-SK: [Hardcore Gamer, Simple Key doors](https://hardcoregamer.com/hollow-knight-silksong-simple-key-doors/)
- IIG-BS, IIG-CC, IIG-UW: Into Indie Games: [Blasted Steps](https://intoindiegames.com/walkthroughs/hollow-knight-silksong-walkthrough-blasted-steps/), [Cogwork Core, Whispering Vaults and Choral Chambers](https://intoindiegames.com/walkthroughs/hollow-knight-silksong-walkthrough-cogwork-core-whispering-vaults-and-choral-chambers/), [Underworks](https://intoindiegames.com/walkthroughs/hollow-knight-silksong-walkthrough-underworks/)
- KG-DD, KG-GM, KG-PS: KeenGamer: [Deep Docks](https://www.keengamer.com/articles/guides/hollow-knight-silksong-deep-docks-walkthrough/), [Greymoor](https://www.keengamer.com/articles/guides/hollow-knight-silksong-greymoor-walkthrough), [Psalm Cylinders](https://www.keengamer.com/articles/guides/hollow-knight-silksong-all-psalm-cylinder-locations-and-how-to-get/)
- LM-B: [lootmap.gg, 85 benches](https://lootmap.gg/silksong/guides/all-bench-and-bellway-locations/) (counts only)
- NC-DB, NC-HMB, NC-PI, NC-SK, NC-SPR, NC-SS: Nerdschalk: [diving bell](https://nerdschalk.com/your-guide-to-unlocking-old-diving-bell-in-silksong/), [Hunter's March bench](https://nerdschalk.com/how-to-find-and-rest-on-hunters-march-bench-in-hollow-knight-silksong/), [Pious Isamar](https://nerdschalk.com/your-guide-to-pious-isamar-in-silksong/), [Simple Key doors](https://nerdschalk.com/silksong-simple-key-doors-guide-locations-rewards/), [Sprintmaster Swift](https://nerdschalk.com/silksong-sprintmaster-swift-guide-location-map-and-more/), [Silk and Soul](https://nerdschalk.com/how-to-unlock-and-complete-the-silk-and-soul-quest-in-hollow-knight-silksong/)
- NEO-BW: [Neoseeker, all Bellways](https://www.neoseeker.com/hollow-knight-silksong/All_Bellway_Locations)
- NL-B, NL-FL, NL-SH, NL-SKD, NL-W: Nintendo Life: [bosses](https://www.nintendolife.com/guides/hollow-knight-silksong-all-bosses-in-order-locations-and-rewards), [fleas](https://www.nintendolife.com/guides/hollow-knight-silksong-all-lost-flea-locations), [Shakra](https://www.nintendolife.com/guides/hollow-knight-silksong-where-to-find-shakra-compass-quill-and-map-locations), [Simple Keys](https://www.nintendolife.com/guides/hollow-knight-silksong-simple-key-locations-where-to-find-every-locked-door), [wishes](https://www.nintendolife.com/guides/hollow-knight-silksong-wish-quest-list-all-tasks-and-rewards)
- PA-FT: [PlayerAuctions, fast travel](https://www.playerauctions.com/guide/other/single-player-games/hollow-knight-silksong-all-fast-travel-bellways-ventrica-stations-locations/) (low)
- PCG-MF: [PC Gamer, Mount Fay](https://pcgamer.com/games/action/silksong-mount-fay-double-jump)
- PCGN-B, PCGN-FT, PCGN-PL, PCGN-SK: PCGamesN: [bosses](https://www.pcgamesn.com/hollow-knight-silksong/bosses), [fast travel](https://www.pcgamesn.com/hollow-knight-silksong/fast-travel), [Plasmium](https://www.pcgamesn.com/hollow-knight-silksong/plasmium), [Simple Keys](https://www.pcgamesn.com/hollow-knight-silksong/simple-key)
- RR-EVA: [RogueRanker, Eva](https://rogueranker.com/?p=10689)
- SCO-B, SCO-BW: silksong.codes: [benches](https://www.silksong.codes/en/guides/bench-locations/) (counts only), [Bellways](https://www.silksong.codes/en/guides/bellway-fast-travel/)
- SH-GRP: one search on Shakra's camps whose summary did not attribute each camp; results were [PCGamesN map](https://www.pcgamesn.com/hollow-knight-silksong/map), [Game8 Shakra](https://game8.co/games/Hollow-Knight-Silksong/archives/549100), [Deltia's Shakra](https://deltiasgaming.com/hollow-knight-silksong-where-to-find-shakra-compass-and-map-merchant/), [Nintendo Life Shakra](https://www.nintendolife.com/guides/hollow-knight-silksong-where-to-find-shakra-compass-quill-and-map-locations), [mapsilksong](https://mapsilksong.com/docs/game-guide/shakra-locations), [silksongmap.info maps](https://silksongmap.info/guides/area-maps), [Sportskeeda Shakra](https://www.sportskeeda.com/esports/all-shakra-locations-hollow-knight-silksong-map-merchant), FX (snippet) and the fandom wiki
- SK-B, SK-FP, SK-SK, SK-SKY, SK-WA: Sportskeeda: [bosses](https://www.sportskeeda.com/esports/all-hollow-knight-silksong-bosses-order), [Fine Pins](https://www.sportskeeda.com/esports/how-complete-fine-pins-wish-hollow-knight-silksong), [Simple Keys](https://www.sportskeeda.com/esports/where-find-simple-key-hollow-knight-silksong), [Surgeon's Key](https://www.sportskeeda.com/esports/how-get-use-surgeon-s-key-hollow-knight-silksong), [Weavenest Atla](https://www.sportskeeda.com/esports/how-reach-weavenest-atla-hollow-knight-silksong)
- SMI-B: [silksongmap.info, 82 benches](https://silksongmap.info/wiki/silksong-bench-locations)
- STEAM-FC: [Steam discussion, moving the Flea Caravan](https://steamcommunity.com/app/1030300/discussions/0/598537454201349234/)
- TR-FL: [TechRaptor, The Lost Fleas](https://techraptor.net/gaming/guides/hollow-knight-silksong-lost-fleas)
- YH-MF: [Yahoo, Faydown Cloak and Mount Fay](https://tech.yahoo.com/gaming/articles/faydown-cloak-double-jump-hollow-004800236.html)
