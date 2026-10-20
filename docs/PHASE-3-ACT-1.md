# Phase 3: Act 1 entries (orchestrator's research, 2026-10-20)

**Why this exists.** On 2026-10-20 Athos asked the orchestrator to "do everything of the first act of the game if possible, do whatever you want, we can fix if needed later". That replaces, for Act 1, the plan in `docs/PHASE-3-BATCH-1.md` where Athos writes each entry. The facts below come from guides read one page at a time (web search and single fetches). hollowknight.wiki and Fextralife were not opened. Every `how` is written in our own words. **Athos checks a sample later and fixes what is wrong**; until he approves the id list, the data is not pushed to the published site (ids are permanent once published, ADR 0003).

**Spoiler warning:** names bosses, abilities and places across Act 1.

## Sources

- GC: game-checklists.com, one page per area (Act 1 list on its index): [Moss Grotto](https://game-checklists.com/silksong/moss-grotto.html), [The Marrow](https://game-checklists.com/silksong/the-marrow.html), [Deep Docks](https://game-checklists.com/silksong/deep-docks.html), [Far Fields](https://game-checklists.com/silksong/far-fields.html), [Hunter's March](https://game-checklists.com/silksong/hunters-march.html), [Greymoor](https://game-checklists.com/silksong/greymoor.html), [Bellhart](https://game-checklists.com/silksong/bellhart.html), [Shellwood](https://game-checklists.com/silksong/shellwood.html), [Wormways](https://game-checklists.com/silksong/wormways.html), [Sinner's Road](https://game-checklists.com/silksong/sinners-road.html), [Blasted Steps](https://game-checklists.com/silksong/blasted-steps.html), [Weavenest Atla](https://game-checklists.com/silksong/weavenest-atla.html), [100 percent list](https://game-checklists.com/silksong/100-percent.html).
- Route and gates: [GameRant Act 1 walkthrough](https://gamerant.com/silksong-act-1-walkthrough-progression-guide/), [Game8 walkthrough](https://game8.co/games/Hollow-Knight-Silksong/archives/548808), and web search results (Deltia's Gaming, Sportskeeda, Nintendo Life, Shacknews, Gamer Guides) for Weavenest Atla, Grindle, Hunter's March, Sinner's Road, Wormways and the Pinstress.
- `source` on each entry is the GC page of its Region (the page actually read). Athos may swap it for the main wiki page when he checks the entry. The two slice entries move from Fextralife to GC (QA question Q10).

## Decisions taken (orchestrator, under Athos's delegation; he may overrule any)

1. **Act 1 = the 12 areas GC lists for Act 1**, each a Region: Moss Grotto, The Marrow, Deep Docks, Far Fields, Hunter's March, Greymoor, Bellhart, Shellwood, Wormways, Sinner's Road, Blasted Steps, Weavenest Atla. Bone Bottom, Mosshome, Ruined Chapel and Bonegrave are Sub-areas of Moss Grotto; Pilgrim's Rest of Far Fields.
2. **Only what can be done in Act 1.** A Collectible in these Regions that needs Clawline, Faydown Cloak, Silk Soar, Everbloom, the Citadel or Act 3 is **deferred** (list at the end): `requires` must point at existing entries, and those abilities belong to later Regions.
3. **What counts:** the 100 percent list. Abilities that count are Swift Step, Cling Grip, Needolin and Needle Strike in Act 1 (GC; Gamer Guides agrees on Needle Strike). **Drifter's Cloak does not count**, so it is a Task (type `ability`): Greymoor and Hunter's March need it. The Hunter Crest (the starting Crest) does not count.
4. **Needle Strike's type is `ability`.** The wiki's Ancestral Arts list (in search results) is Swift Step, Cling Grip, Needolin, Clawline, Silk Soar and Sylphsong; Needle Strike is neither that nor a Silk Skill. `ability` is added to the approved Collectible types (contract rule 12).
5. **Wishes fold into their reward.** A wish that gives one Collectible is described in that Collectible's `how`, not a separate Task. A Task exists only for a boss or quest that opens two or more things, or that a Region needs (a Region's `requires` must be entries).
6. **Region gates** are the most reliable route the guides name, kept conservative (a Region shows Locked a little longer rather than Available too early).
7. **Shops:** an entry sold by a merchant who moves belongs to the Region where it can first be bought. Rosary costs are in `how`. Craftmetal and fleas are not tracked, so they appear only in `how`.

## Regions

| order | Region | requires (entry) | summary (our words) |
|---|---|---|---|
| 1 | Moss Grotto | none | Where the game starts. Moss caves with the village of Bone Bottom, the Ruined Chapel and Mosshome. |
| 2 | The Marrow | Moss Mother | Bone caverns past Bone Bottom. Shakra sells maps here, and the Bell Beast is trapped at the Bellway. |
| 3 | Deep Docks | Bell Beast | Hot docks of lava and machinery, reached from The Marrow's Bellway. The Forge Daughter works here. |
| 4 | Far Fields | Lace | Wide grasslands past the Deep Docks. The Seamstress lives here, and Pilgrim's Rest sits above. |
| 5 | Hunter's March | Drifter's Cloak | A hunting ground of the Skarr, reached from The Marrow. Crossing it takes the Drifter's Cloak. |
| 6 | Greymoor | Fourth Chorus | Rainy moors above Far Fields, home of the Halfway House and the crows. |
| 7 | Bellhart | Moorwing | A town under a silk curse until its Widow is beaten. |
| 8 | Shellwood | Moorwing | A forest of shells and flowers west of Bellhart. |
| 9 | Wormways | Moorwing | Tunnels west of Bone Bottom. The easy way in is from Shellwood. |
| 10 | Sinner's Road | Cling Grip | A road out of upper Greymoor, toward Bilewater. |
| 11 | Blasted Steps | Cling Grip | Cliffs and sands on the way to the Citadel's gate. |
| 12 | Weavenest Atla | Needolin | A Weaver nest behind a door in Moss Grotto that opens to the Needolin. |

Gate notes: The Marrow (GameRant, slice). Deep Docks needs Bell Beast (Game8, Into Indie Games; GameRant only says it is right of the Bellway). Far Fields after Lace (GameRant, Game8, KeenGamer). Hunter's March can be entered early, but its shop and chapel need the Drifter's Cloak (search results). Greymoor after Fourth Chorus, which blocks the way once the cloak is taken (GameRant, Game8). Bellhart after Moorwing (both). Shellwood from Bellhart going west (both). Wormways: the north entrance through Shellwood needs nothing else; the south one needs Swift Step and a Simple Key door (search results). Sinner's Road needs Cling Grip (search results). Blasted Steps: the guides differ (Cling Grip or Drifter's Cloak); Cling Grip is the later of the two, so it is the safe gate. Weavenest Atla: Needolin door at the right edge of Moss Grotto (Deltia's, Sportskeeda).

## Entries, in Route order

Kind: C = Collectible, T = Task. `requires` names entries in this table. Proposed ids are slugs; Dev A may adjust them before Athos approves the list.

| # | id (proposed) | Name | Kind, type | Region (Sub-area) | requires | how (our words) |
|---|---|---|---|---|---|---|
| 1 | `moss-mother` (kept) | Moss Mother | T, boss | Moss Grotto (Ruined Chapel) | | Keep the current text. |
| 2 | `silk-spear` (kept) | Silk Spear | C, silk-skill | Moss Grotto (Mosshome) | Moss Mother | Keep the current text. |
| 3 | `spool-fragment-moss-grotto` | Spool Fragment, Moss Grotto | C, spool-fragment | Moss Grotto | | In a trap room east of the lift. |
| 4 | `druids-eye` | Druid's Eye | C, tool | Moss Grotto (Mosshome) | Moss Mother | The Moss Druid's wish, Berry Picking: gather Mossberries from the mossy lowlands and bring them back. |
| 5 | `shard-pendant` | Shard Pendant | C, tool | The Marrow | | In a small room west of the tall central chamber. |
| 6 | `compass` | Compass | C, tool | The Marrow (Shakra) | | Sold by Shakra the map seller for 70 Rosaries. |
| 7 | `bell-beast` | Bell Beast | T, boss | The Marrow (Marrow Bellway) | Silk Spear | Trapped in silk at the Bellway. Cut it free with Silk Spear and beat it; the Bellway then works for travel. |
| 8 | `silk-heart-bell-beast` | Silk Heart, Bell Beast | C, silk-heart | The Marrow (Marrow Bellway) | Bell Beast | After the win, touch the silk the Bell Beast leaves behind and climb the short challenge of crumbling platforms it opens; the Silk Heart is at the top. |
| 9 | `straight-pin` | Straight Pin | C, tool | The Marrow | | In Grindle's prison cell, in the tall room at the far right near the way to Hunter's March. Free him to reach it. |
| 10 | `tool-pouch-loddle` | Tool Pouch upgrade, Loddle | C, tool-pouch-upgrade | The Marrow | Straight Pin | Pass Loddle's aiming challenge with the Straight Pin. |
| 11 | `magnetite-brooch` | Magnetite Brooch | C, tool | Moss Grotto (Bone Bottom) | Moss Mother | Sold in the Bone Bottom shop for 120 Rosaries. |
| 12 | `swift-step` | Swift Step | C, ancestral-art | Deep Docks | | Climb to the top of the Deep Docks and bind the Weaver effigy there. A dash. |
| 13 | `crafting-kit-forge` | Crafting Kit, Forge Daughter | C, crafting-kit-upgrade | Deep Docks (Forge) | | Sold by the Forge Daughter for 180 Rosaries. |
| 14 | `magma-bell` | Magma Bell | C, tool | Deep Docks (Forge) | | Sold by the Forge Daughter for 110 Rosaries and a Craftmetal. |
| 15 | `sting-shard` | Sting Shard | C, tool | Deep Docks (Forge) | | Sold by the Forge Daughter for 140 Rosaries and a Craftmetal. |
| 16 | `spool-fragment-deep-docks` | Spool Fragment, Deep Docks | C, spool-fragment | Deep Docks (Forge) | | At the end of a platforming challenge near the Forge Daughter. |
| 17 | `lace` | Lace | T, boss | Deep Docks | Swift Step | Dash in mid-air to reach the lever near Shakra's room; it opens Lace's arena. Beating her opens the way to Far Fields. |
| 18 | `mask-shard-bone-bottom` | Mask Shard, Bone Bottom shop | C, mask-shard | Moss Grotto (Bone Bottom) | Moss Mother | Sold in the Bone Bottom shop for 300 Rosaries. |
| 19 | `warding-bell` | Warding Bell | C, tool | Far Fields | | At the bottom of the central Far Fields room. |
| 20 | `drifters-cloak` | Drifter's Cloak | T, ability | Far Fields | | The Seamstress's wish, Flexile Spines: collect Spine Cores from Hokers and bring them to her. The cloak lets you glide on air currents. |
| 21 | `mask-shard-far-fields` | Mask Shard, Far Fields | C, mask-shard | Far Fields | Drifter's Cloak | Above the Seamstress's home; glide up to it. |
| 22 | `flintslate` | Flintslate | C, tool | Deep Docks | | In the southeast Deep Docks, reached from the south of Far Fields. |
| 23 | `fourth-chorus` | Fourth Chorus | T, boss | Far Fields | Drifter's Cloak | Blocks the way up once you have the cloak. Beating it opens the air vents up to Pilgrim's Rest and Greymoor. |
| 24 | `weighted-belt` | Weighted Belt | C, tool | Far Fields (Pilgrim's Rest) | Fourth Chorus | Sold at Pilgrim's Rest for 160 Rosaries. |
| 25 | `tool-pouch-pilgrims-rest` | Tool Pouch upgrade, Pilgrim's Rest | C, tool-pouch-upgrade | Far Fields (Pilgrim's Rest) | Fourth Chorus | Sold at Pilgrim's Rest for 220 Rosaries. |
| 26 | `curveclaw` | Curveclaw | C, tool | Hunter's March | | Sold by Mottled Skarr for 140 Rosaries. |
| 27 | `fractured-mask` | Fractured Mask | C, tool | Hunter's March | | Sold by Mottled Skarr for 260 Rosaries. |
| 28 | `savage-beastfly` | Savage Beastfly | T, boss | Hunter's March (Chapel of the Beast) | | In the Chapel of the Beast at the east end of the March, after a short climb. |
| 29 | `beast-crest` | Beast Crest | C, crest | Hunter's March (Chapel of the Beast) | Savage Beastfly | Bind the great husk in the chapel after the fight. |
| 30 | `thread-storm` | Thread Storm | C, silk-skill | Greymoor (Craw Lake) | | Survive the crows' gauntlet at Craw Lake, then pogo up outside to the effigy. |
| 31 | `reaper-crest` | Reaper Crest | C, crest | Greymoor (Chapel of the Reaper) | | In the arena of the Chapel of the Reaper. |
| 32 | `threefold-pin` | Threefold Pin | C, tool | Greymoor (Craw House) | | In a hidden room above the Craw House; set the bouncing platforms moving to reach it. |
| 33 | `flea-brew` | Flea Brew | C, tool | Greymoor | | Fleamaster Mooshka's wish, The Lost Fleas: once five fleas have joined the Flea Caravan, it moves on and she gives you this. |
| 34 | `moorwing` | Moorwing | T, boss | Greymoor | | Greymoor's last boss, at its far left. Beating it opens the way to Bellhart. |
| 35 | `mask-shard-shellwood` | Mask Shard, Shellwood | C, mask-shard | Shellwood | | Behind a breakable wall, past a trap of flowers. |
| 36 | `longpin` | Longpin | C, tool | Shellwood | | Behind the wasp nest in Shellwood. |
| 37 | `pollip-pouch` | Pollip Pouch | C, tool | Shellwood | | Greyroot's wish, Rite of the Pollip: gather Pollip Hearts from the purple flowers of Shellwood. |
| 38 | `sister-splinter` | Sister Splinter | T, boss | Shellwood | | Shellwood's boss, reached by the lift to the central bench. |
| 39 | `cling-grip` | Cling Grip | C, ancestral-art | Shellwood | Sister Splinter | West of Sister Splinter's arena, past a pogo course: bind the Weaver effigy. Lets you cling to and jump off walls. |
| 40 | `widow` | Widow | T, boss | Bellhart | Cling Grip | Climb with Cling Grip to her arena. Beating her lifts Bellhart's curse. |
| 41 | `needolin` | Needolin | C, ancestral-art | Bellhart | Widow | Given when Bellhart is freed from its curse. |
| 42 | `sharpened-needle` | Sharpened Needle | C, needle-upgrade | Bellhart | Widow | Pinmaster Plinney sharpens the Needle for free once the town is freed. |
| 43 | `crafting-kit-creige` | Crafting Kit, Creige | C, crafting-kit-upgrade | Bellhart | Widow | Creige's wish, Crawbug Clearing: hunt Crawbugs in Greymoor and bring back their Ragpelt. |
| 44 | `my-missing-courier` | My Missing Courier | T, quest | Bellhart | Widow | Frey's wish: find the courier Tipp, last seen in lower Shellwood. |
| 45 | `spool-fragment-bellhart` | Spool Fragment, Bellhart | C, spool-fragment | Bellhart | My Missing Courier | Comes with finishing the courier quest for Frey. |
| 46 | `multibinder` | Multibinder | C, tool | Bellhart | My Missing Courier | Sold in Bellhart for 880 Rosaries once the courier quest is done. |
| 47 | `spool-fragment-greymoor` | Spool Fragment, Greymoor | C, spool-fragment | Greymoor | Cling Grip | Near the shortcut to Sinner's Road; climb to it with Cling Grip. |
| 48 | `pimpillo` | Pimpillo | C, tool | Greymoor (Yarnaby's tower) | Cling Grip | In Yarnaby's tower; climb with Cling Grip. Costs a Craftmetal. |
| 49 | `mask-shard-deep-docks` | Mask Shard, Deep Docks | C, mask-shard | Deep Docks | Cling Grip | Above the westernmost bench; climb to it with Cling Grip. |
| 50 | `wanderer-crest` | Wanderer Crest | C, crest | Moss Grotto (Bonegrave) | Cling Grip | In the Chapel of the Wanderer at Bonegrave; reach it with Cling Grip. |
| 51 | `mask-shard-wormways` | Mask Shard, Wormways | C, mask-shard | Wormways | | Behind a breakable wall in the south of the Wormways. |
| 52 | `dead-bugs-purse` | Dead Bug's Purse | C, tool | Wormways | | Near the northern entrance of the Wormways. |
| 53 | `barbed-bracelet` | Barbed Bracelet | C, tool | Sinner's Road | | In a pit at the end of the first road. |
| 54 | `tacks` | Tacks | C, tool | Sinner's Road | | Crull and Benjin's wish, Roach Guts: hunt the Muckroaches of Sinner's Road and bring back their guts. |
| 55 | `great-conchflies` | Great Conchflies | T, boss | Blasted Steps | | Two burrowing bosses in the northwest of the Blasted Steps, blocking the way to the Pinstress. |
| 56 | `needle-strike` | Needle Strike | C, ability | Blasted Steps (Pinstress's hut) | Great Conchflies | Talk to the Pinstress in her hut at the far west end and train with her. A charged Needle attack. |
| 57 | `silkspeed-anklets` | Silkspeed Anklets | C, tool | Far Fields (Weavenest Cindril) | Needolin | In Weavenest Cindril, which needs the Needolin. |
| 58 | `spool-fragment-weavenest-atla` | Spool Fragment, Weavenest Atla | C, spool-fragment | Weavenest Atla | Cling Grip | Through the west exit of the lift shaft. |
| 59 | `mask-shard-weavenest-atla` | Mask Shard, Weavenest Atla | C, mask-shard | Weavenest Atla | | Through the east exit of the lift shaft. |
| 60 | `moss-mother-duo` | Moss Mother duo | T, boss | Weavenest Atla | | Two Moss Mothers at once, west of the Weavenest Atla bench. |
| 61 | `weavelight` | Weavelight | C, tool | Weavenest Atla | Moss Mother duo | Past the two Moss Mothers, west of the bench. |

Not missable as far as the sources say: nothing above is marked `missable`. One open point: Grindle may leave his cell on his own later (Shacknews); the sources do not say the Straight Pin goes with him.

Disagreements kept in mind (Athos may want to look first): the Moss Grotto Spool Fragment (three guides, three places; GC's is used); the Wanderer Crest (Cling Grip per GC and TheGamer, a Simple Key per Game8); whether Widow comes before or after Shellwood (Game8 says before, GC and GameRant say Cling Grip is needed for her: used); the Blasted Steps gate.

## Checks on this sheet (orchestrator, 2026-10-20, second session)

- **Structure.** The tables above were parsed into a throwaway data folder outside the repository (steps = row number times 10, `dataVersion` 2) and checked with the real tools. `scripts/validate-data.js`: passed, 0 warnings. `js/requirements.js`: a player who always takes "Next on the route" reaches all 61 entries, in Route order, and every entry is Available when the Route reaches it. No Region is left without entries. This proves the sheet is consistent, not that the facts are right.
- **Facts cross-checked by web search** (results pages only): Sharpened Needle is free from Pinmaster Plinney once the Widow is beaten (several guides); the Drifter's Cloak is the Seamstress's reward for Flexile Spines, 25 Spine Cores from Hokers (Deltia's, PC Gamer, Insider Gaming, KeenGamer); the Bell Beast gives the first Silk Heart, at the top of a short challenge after the fight (Deltia's, Sportskeeda): row 8's `how` was corrected to say so; the Flea Brew comes from the first five rescued fleas, handed over once the caravan has moved to Greymoor (Insider Gaming, Nerdschalk, allthings.how).
- **Gap found:** Mooshka's flea quest also gives a Spool Fragment at 12 fleas and a Tool Pouch upgrade at 22 fleas (one guide, Nerdschalk). Both count toward 100 percent and were missing from the deferred list; added below.

## Deferred (Collectibles in Act 1 Regions that need later things)

Moss Grotto: Shaman Crest (Silk Soar, Act 3), Everbloom (Act 3). Deep Docks: Spool Fragment in the southeast (Clawline). Far Fields: Mask Shard in Skull Cavern (Clawline), Mask Shard from Sprintmaster Swift's race (not placed in an act by the sources). Bellhart: Mask Shards from Savage Beastfly's hunt, Dark Hearts and The Hidden Hunter (Grand Hunts and Act 3), Hivesteel Needle (Pale Oil from the Citadel). Greymoor: Tool Pouch upgrade from Nuu (a full Hunter's Journal). Shellwood: Witch Crest (GC's pages disagree on its quest; likely after Act 1). Wormways: Plasmium Phial (needs the Needle Phial tool, not placed yet), Sharpdart (Clawline). Blasted Steps: Mask Shard (Faydown Cloak or Silk Soar), and Grindle's shop: Spool Fragment, Snitch Pick, Thief's Mark, Crafting Kit, Magnetite Dice (his hideout needs the Faydown Cloak). Weavenest Atla: Snare Setter (Faydown Cloak), Sylphsong (binding Eva needs six Crests and many Memory Lockets). Flea Caravan (moves between Regions): Spool Fragment at 12 rescued fleas and Tool Pouch upgrade at 22 (fleas are spread across the map, many behind later abilities; which Region the reward belongs to is open).

## Brief for Dev A: T26, Act 1 into `data/`

Written down here because the first T26 run left no branch (2026-10-20). Any orchestrator session can hand it out as is.

- **Goal:** turn the two tables above into `data/regions.json` and `data/items.json`, nothing more and nothing less. Do not add, drop or merge entries; if a row looks wrong, keep it and say so in the handoff.
- **Files (Dev A owns them):** `data/regions.json`, `data/items.json`, `data/endings.json` (only to raise `dataVersion`). Nothing else.
- **Rules:** `dataVersion` becomes 2 in all three files (`endings` stays `[]`). Region `id` is the slug of its name (`the-marrow`, `hunters-march`, `sinners-road`, ...); `moss-grotto` is kept. Entry ids as proposed; `moss-mother` and `silk-spear` are kept with their current `how` and `step`. `step` = row number times 10, so later batches can slot entries in between. `area` = the Sub-area in brackets, when there is one. `requires` = the ids of the named entries. Region `summary` and entry `how` as written in the tables (our words; keep each under 300 characters). `source` = the GC page of the entry's Region (Sources section), including the two slice entries, which move off Fextralife. No `missable`, no `spoiler`, no `unlocks`, no hero images.
- **Done when:** `node scripts/validate-data.js` passes with 0 warnings; `node --test "tests/*.test.js"` passes; following `nextStep` from an empty Progress reaches all 61 entries in Route order; Home, Region, Route and Account load locally with no console errors. The handoff lists every id, any row Dev A doubts, and what was not checked.
- **Not pushed to `main`:** ids are permanent once the site publishes them (ADR 0003), so the data waits for Athos's approval of the id list.
