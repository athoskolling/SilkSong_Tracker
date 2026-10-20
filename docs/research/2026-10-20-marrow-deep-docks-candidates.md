# The Marrow and Deep Docks: candidate lists for Athos (orchestrator, 2026-10-20)

Same method as `2026-10-20-moss-grotto-candidates.md`. This is a **starting list**: Athos confirms or strikes each line from his own play and the main wiki, then writes the "how" in his own words. **Nothing here is data.** It holds names, kinds and places only; no text was copied. Read once each, on 2026-10-20: [game-checklists.com, The Marrow](https://game-checklists.com/silksong/the-marrow.html) and [Deep Docks](https://game-checklists.com/silksong/deep-docks.html) (GC), and [Into Indie Games, walkthrough part 2](https://intoindiegames.com/walkthroughs/hollow-knight-silksong-walkthrough-part-2/) and [Deep Docks walkthrough](https://intoindiegames.com/walkthroughs/hollow-knight-silksong-walkthrough-deep-docks/) (II). Game8 and TheGamer had no matching pages. hollowknight.wiki and Fextralife were not opened.

## Questions to settle first

1. **Swift Step's type.** GC calls it a Silk Skill and II an ability. If movement abilities (Swift Step, Cling Grip, Clawline and the like) are neither Silk Skills nor Ancestral Arts, the approved Collectible types need one more, for example `ability`. Validator rule 12 would then need that addition (the orchestrator updates the contract; QA 1 the validator).
2. **Grindle's prison and the Straight Pin.** GC places the cell in The Marrow (near the Hunter's March entrance); II covers it in its Deep Docks walkthrough. Which Region?
3. **Shakra's shop items** (for example the Compass): Shakra moves between areas. Does a shop item belong to the Region where you first can buy it?
4. **Items reached from later areas** (Flintslate and a Craftmetal are reached from the southern Far Fields; some need Cling Grip or Clawline): they keep their Region with a late `step`, as for Moss Grotto question 3.

## The Marrow

### Collectibles

| # | Name | Type | Place | Needs first (per guides) | Agree | Notes for you |
|---|---|---|---|---|---|---|
| M1 | Shard Pendant | tool | small room west of the central tall area | | 2 | II: the "skeletal structure room" |
| M2 | Silk Heart | silk-heart | the Bell Beast fight | Bell Beast (MT1) | 2 | |
| M3 | Straight Pin | tool | Grindle's prison cell | freeing Grindle (II) | 2 | Region: see question 2 |
| M4 | Tool Pouch upgrade | tool-pouch-upgrade | Loddle's aim challenge | MT2; uses the Straight Pin (GC) | 1 | |
| M5 | Compass | tool (?) | Shakra's shop | Rosaries | 1 | Only II. See question 3 |

### Tasks

| # | Name | Type | Place | Opens | Agree | Notes |
|---|---|---|---|---|---|---|
| MT1 | Bell Beast | boss | the Marrow Bellway | M2; the way on | 2 | II: Silk Spear is needed first, to break the webbing. If so, Bell Beast needs `silk-spear` |
| MT2 | Loddle's challenge | quest | | M4 | 1 | |

Left out (not on the 100 percent list): Frayed Rosary String, maps, Quill, Memory Locket, Craftmetal, a flea, benches, Hunter's Journal entries, and the wishes The Lost Fleas, Volatile Flintbeetles and The Terrible Tyrant (rewards are not Collectibles). GC marks the Skull Tyrant fight as counting toward 100 percent, but its reward (a Rosary necklace) is not a Collectible. Tell me if it should be a Task.

## Deep Docks

### Collectibles

| # | Name | Type | Place | Needs first (per guides) | Agree | Notes for you |
|---|---|---|---|---|---|---|
| D1 | Swift Step | see question 1 | a Weaver tomb, western Deep Docks | GC: completing Deep Docks. II: a gauntlet before the tomb | 2 | Both name it; they differ on the type and on what comes first |
| D2 | Crafting Kit | crafting-kit-upgrade | Forge Daughter | Rosaries | 2 | |
| D3 | Magma Bell | tool | Forge Daughter | Rosaries and a Craftmetal | 2 | |
| D4 | Sting Shard | tool | Forge Daughter | Rosaries and a Craftmetal | 1 | |
| D5 | Spool Fragment | spool-fragment | GC: a parkour challenge near the Forge Daughter. II: the lava bucket section, far left | | 1 to 2 | Possibly the same one, described two ways |
| D6 | Spool Fragment | spool-fragment | a parkour challenge in the southeast | Clawline | 1 | |
| D7 | Mask Shard | mask-shard | above the westernmost bench | Cling Grip | 1 | |
| D8 | Flintslate | tool | southeast Deep Docks | reached from the southern Far Fields | 1 | |

### Tasks

| # | Name | Type | Place | Opens | Agree | Notes |
|---|---|---|---|---|---|---|
| DT1 | Lace | boss | the end of Deep Docks | the way to Far Fields (a later batch's Region `requires`) | 2 | V1 keeps Tasks that open a Collectible; a Task a Region needs is kept too, because a Region's `requires` must be entries |
| DT2 | Forebrothers Signis and Gron | boss | the entrance to the Diving Bell | progress (Diving Bell) | 1 | Keep only if a later Region or Collectible needs it |

Left out: Memory Locket, Craftmetal (only as a cost), three fleas, the map, benches, Hunter's Journal entries.

## Order across the batch (the Route)

From the guides, the rough opening order is: Moss Grotto (Moss Mother), Bone Bottom, The Marrow (Bell Beast), Mosshome (Silk Spear), then Deep Docks (Lace, then the way to Far Fields). II says Bell Beast needs Silk Spear, which would put Silk Spear before Bell Beast. **Athos writes the order he plays**; Dev A turns it into `step` numbers.
