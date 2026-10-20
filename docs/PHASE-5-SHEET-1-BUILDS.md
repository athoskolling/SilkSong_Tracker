# Phase 5, sheet 1: the build system (orchestrator's research, 2026-10-20)

**Why this exists.** Step 2 of `docs/PHASE-5-FULL-TRACKER-PLAN.md`: research Crests, Tools and Skills before anyone designs the Build picker or writes data. **This is research, not data.** Nothing here goes into `data/` until Athos approves the plan's open questions and checks the facts. Names below are the game's names; every effect and location is written in our own words.

**Spoiler warning:** names late-game areas, bosses, Crests and the Eva rewards.

## How this was researched, and its limit

- **Only web search results.** In this session single page fetches failed for every guide host (WebFetch could not resolve any host, and the proxy refused a plain download of game-checklists.com), so no guide page was opened. Each fact below is what one or more search results said. hollowknight.wiki and Fextralife were never fetched; where a wiki page appears as a source, it is the wiki's text **as quoted in a search result**, marked "wiki (snippet)". MapGenie was not used.
- **No facts from memory.** Where the results say nothing, the cell says "not found".
- **How to read the marks.** After each fact, the sources that said it, as short codes (list at the end). One code means one source only: treat it as unconfirmed. "Conflict" means sources disagree; both readings are given.
- The search results are weaker than reading pages. Several guide sites in them look low quality or copied (Acer community posts, forum mirrors); those are marked `low` and never decide a conflict.

## 1. How the system works (what the guides agree on)

- **Crest** = Hornet's moveset and its set of Tool slots. Changed at a bench. Each Crest has slots of four kinds: **red, blue, yellow** (Tools) and **white** (Silk Skills). [KG, SK, GR, HG, NL]
- **Red Tools** are used by hand and have charges, refilled with Shell Shards at a bench. **Blue Tools** are passive, mostly defence or Bind effects. **Yellow Tools** are passive, mostly exploration and economy. [RR, HG, WP, NL-T]
- **Memory Lockets** open a Crest's locked slots, one slot each, spent at a bench on the Crest being worn, and not refundable. **20 in total**, said to be exactly enough to open every slot. [DG-ML, NC-ML, AT-ML, wiki (snippet)]
- **Vesticrest** (from Eva, Weavenest Atla) gives slots that work whatever Crest is worn: a yellow slot, later a blue one. [HG, wiki (snippet), NC-EVA, RR-EVA]
- **Tool Pouch upgrades** (4) raise how many charges red Tools hold, about a quarter more per step, double the base at the last one; the Rosary Cannon and Needle Phial do not grow. [wiki (snippet), SHK, G8-TP]
- **Crafting Kit upgrades** (4) raise the damage of Tools that deal damage. The wiki snippet says red and blue Tools by 60 percent (not clear whether per step or in total), and that Flintslate's own bonus does not grow. [wiki (snippet), SHK]
- **Upgraded Tools do not count again** toward 100 percent or the Arsenal achievement; any version of a Tool counts. [Steam-A, GR-100, existing research note]
- **Arsenal achievement = 51 Tools.** Totals of 57, 59 and 65 in other guides count variants and upgrades. [Steam-A, wiki (snippet), YouTube title; outliers GB 59, GLB 65, TG 65]

## 2. Crests

Slots are written red / blue / yellow / white. "Start" is when found; "Max" is with every Memory Locket spent.

| Crest | Start | Max | What it changes (our words) | Where and how | Cost | In `data/`? |
|---|---|---|---|---|---|---|
| Hunter | 1/1/1/1 [KG, SK, GR, GS]. Conflict: three red (one source, outlier); Game8 names no white slot | 2/2/2/1 [GR, SK] | The starting Crest: plain forward slash, diagonal down-attack. No special trait at first (wiki (snippet)); once evolved by Eva it builds a damage bonus from hits taken without being hurt. Numbers differ by patch: +30 percent after 6 hits at level 2 (wiki (snippet)), "20 percent per tier, 3 tiers" (AC, low) | Owned from the start. Eva upgrades it twice (section 4) | none | No (not counted, decision 3 in `docs/PHASE-3-ACT-1.md`) |
| Reaper | 1/1/1/1 [KG, GR, SK] | 2/2/2/1 [GR] | Bigger, slower swings (about 18 percent slower than Hunter, wiki (snippet)); wide half-circle down-attack. After a Bind, hits make Silk pieces that refill a little Silk when picked up [wiki (snippet), DX, AT] | Chapel of the Reaper, far west of Greymoor above the Moorwing arena: cross the chapel and win the locked-room fight; the Crest is on a corpse at the top [DX, KG-GM, SK]. No key named in any result. One source: the chapel closes for good once the Crest is taken | none | Yes, `reaper-crest` |
| Wanderer | 1/0/2/1 [KG, GR] | 1/2/3/1 [GR]. Conflict: "2 blue, 1 yellow" (AC, low) | Much faster, narrower slashes (+34 percent attack speed, wiki (snippet)); a small chance of triple-damage hits while Silk is at least one Bind's worth (2 percent, 2.2 with Magnetite Dice; wiki (snippet)) | Chapel of the Wanderer, Bonegrave (west of Bone Bottom): clear the enemy waves inside. Conflict on the gate: a Simple Key from Pebb [PCG, AC] versus Cling Grip (GC, used in Act 1 data) | none | Yes, `wanderer-crest` |
| Beast | 2/0/0/1 [KG]; "two red" [NL, SW, EG] | adds 2 yellow [NL, EG] = 2/0/2/1 | Savage strikes; its Bind sends Hornet into a fury that heals through hits instead of the normal heal [KG, DX, AC low]. Duration and numbers not found | Chapel of the Beast, east end of Hunter's March, after Savage Beastfly [DX, NL, KG] | none | Yes, `beast-crest` |
| Witch | **Conflict.** 2 red [NL, wiki (snippet)] versus 1/1/0/1 [KG, EG, SW] | **Conflict.** +3 blue [NL, wiki (snippet)] versus +1 red +1 blue [EG] | Long whip-like slashes. Its Bind sends out roots that hit nearby enemies up to 3 times and heal a Mask per hit [wiki (snippet), NL] | Twisted Bud (hidden room in Bilewater, reached from the hidden east end of the Whispering Vaults; one guide says Clawline) to Greyroot in Shellwood, after Rite of the Pollip, starts the Rite of Rebirth wish, which curses Hornet (the "Cursed Crest"); the Infestation Operation wish lifts the curse and turns it into the Witch Crest [AT-W, DG-W, wiki (snippet), GG-RR]. Conflict: KeenGamer says Greymoor | none | No |
| Architect | 3/0/0/0 [GR, G8, ESC] | 3/2/2/0 [G8, ESC] | Needle becomes a drill: many quick hits, chargeable for double damage. No white slot, so no Silk Skills. Its "Craft Bind" (Up + Bind) refills red Tools away from a bench for the usual Shell Shards, heals nothing [wiki (snippet), G8]. Conflict: DG says its Bind heals 3 Masks | Chapel of the Architect, north of the Twelfth Architect in the Underworks (Cauldron). Buy the Architect's Key from him once you own 25 Tools; no fight. The door closes for good after you leave [G8, NC-A, DG] | Key: 110 Rosaries, needs 25 Tools [several agree] | No |
| Shaman | 0/0/0/3 [GR, KG] | **Conflict.** +2 blue (0/2/0/3) [GR, SK] versus +2 white, no Tools at all [NL] | Built around Silk Skills: +40 percent Silk Skill damage, attacks become short-range energy waves; its Bind starts with a slam to the ground, so no healing in mid-air [wiki (snippet)] | Act 3. Ruined Chapel in Moss Grotto near Bone Bottom, needs Silk Soar [AT-S, KG, SK]; details of the last room differ | none | No (deferred in Act 1 sheet) |

**Not Crests a player picks** (do not put them in the picker):

- **Cursed Crest**: the state between the Witch Crest's two wishes; while cursed, Hornet cannot change Crest, Bind or use Tools. No in-game name (wiki (snippet)).
- **Cloakless Crest**: a story state when Hornet is captured and taken to the Slab; kicks instead of the Needle, fixed 3 damage (wiki (snippet)).

**Count: 7 Crests a player owns and equips** (Hunter, Reaper, Wanderer, Beast, Witch, Architect, Shaman), several guides titled "all 7 Crests" [G8, HG, AC]. Of these, 6 count toward 100 percent if the Hunter Crest does not (Act 1 decision); that is our reading, Athos to confirm.

**A consistency check (our arithmetic, not a source):** with the Witch Crest at +3 blue and the Hunter Crest's +3 from Memory Lockets, the "Max minus Start" column adds up to 3 + 3 + 3 + 2 + 3 + 4 + 2 = 20, exactly the 20 Memory Lockets. With the Witch at +2 it is 19. This leans toward Nintendo Life's Witch layout, but does not prove it.

## 3. Tools

Colour is the slot the Tool fits. "Act 1 data" means the entry already exists in `data/items.json` with its location there; this sheet only adds colour and effect for it.

### Red (19, plus the Needle Phial)

| Tool | Effect (our words) | Where and how | Cost | Sources | In `data/`? |
|---|---|---|---|---|---|
| Straight Pin | Light thrown pin | Grindle's cell, The Marrow | | SW, RK | `straight-pin` |
| Threefold Pin | Three pins in a spread | Above the Craw house, Greymoor | | SW, NL-T | `threefold-pin` |
| Sting Shard | Hanging trap in the air | Forge Daughter, Deep Docks | 140 Rosaries | SW, NL-T | `sting-shard` |
| Tacks | Pins scattered on the ground | Act 1 data | | NL-T | `tacks` |
| Longpin | Heavy pin that pierces shells | Behind the wasp nest, Shellwood | | NL-T | `longpin` |
| Curveclaw | Not described in results | Mottled Skarr, Hunter's March | 140 Rosaries | NL-T, PCG | `curveclaw` |
| Pimpillo | Bomb that bursts on contact | Act 1 data | | NL-T | `pimpillo` |
| Flintslate | Sets the Needle alight: +50 percent damage for 8 seconds, may burn | Behind a Simple Key door, Deep Docks | | wiki (snippet), DG-F. Charges conflict: 3 [DG-F] or 6 max [RK] | `flintslate` |
| Flea Brew | Faster attacks and movement for about 10 seconds; refilled from the Flea Caravan's reserve | Act 1 data | | NL-T, GG-W, DG | `flea-brew` |
| Throwing Ring | Thrown ring that bounces | Shakra's Trail's End wish, ends in Bilewater. Conflict on the start: Bellhart wish board [DG-TR, NC-TR] or after buying every map [GC guide] | | DG-TR, NC-TR | No |
| Conchcutter | Piercing shell that bounces off walls | Coral Tower, Sands of Karak, after the Raging Conchfly | | GB, GLB | No |
| Silkshot | Piercing shot. **One per run:** the Ruined Tool (hidden room in Bilewater, Act 2) is repaired into one of three versions, and the others are then gone: Forge Daughter (fast, many charges), Twelfth Architect (three-bolt spread), Mount Fay table (charged beam) | see effect | Forge 240 + Craftmetal, Architect 130 + Craftmetal [NC-RT]; Mount Fay Craftmetal only [AT-SS] | DG-SS, AT-SS, SK-SS, NEO | No |
| Delver's Drill | Hornet drills downward into a foe | Underworks; exact spot conflicts (first tall room, or the Grand Gate path) | | GB, GLB | No |
| Cogwork Wheel | Thrown circular saw | Twelfth Architect, Underworks | 360 Rosaries + Craftmetal | GB | No |
| Cogfly | Winged helper that attacks foes | Conflict: hidden spike path in the High Halls, built at a workbench with Craftmetal, versus north of the Choral Chambers (needs Clawline) | Craftmetal | GB, NC | No |
| Rosary Cannon | Fires Rosaries as shots | High Halls, behind a Simple Key door near the Ventrica station | | NC-RC, wiki (snippet) | No |
| Voltvessels | Electric throw; one damage table lists two forms (spear, bola) | Memorium, behind a breakable wall and a short trial | | GB, RK | No |
| Plasmium Phial | Heals, including up to 3 above maximum health; one guide: 20 charges | Alchemist Zylotol's wish (Alchemist's Assistant), Wormways: bring back 3 Plasmium samples. Conflict: one database says High Halls, Act 3 | | PCG-P, GRX, DG-AA | No (deferred in Act 1 sheet) |
| Snare Setter | Silk rune trap that bursts on contact | **Conflict:** Underworks [GB] versus Weavenest Atla with the Faydown Cloak (GC, Act 1 deferred list) | | GB, SW | No |
| Needle Phial | Used to draw Plasmium and blood for two wishes | From Zylotol at the start of Alchemist's Assistant, Wormways (needs a Simple Key). Wiki (snippet): **not needed for Arsenal, and gone once both wishes are done** | | PCG-P, wiki (snippet) | No |

### Blue (21)

The effects of the first fifteen rows came from one combined search whose results were SW, STD, PCG, NL-T, TSM and GG-B; the summary did not always say which of them said what, so "STD" there means "that group".

| Tool | Effect (our words) | Where and how | Cost | Sources | In `data/`? |
|---|---|---|---|---|---|
| Druid's Eye | Gives Silk when Hornet is hit | Act 1 data. Upgrades to **Druid's Eyes** by bringing the Moss Druid 4 more Mossberries | | STD, NL-T | `druids-eye` |
| Magma Bell | Less damage from fire and lava | Forge Daughter, Deep Docks | 110 + Craftmetal (Act 1 data, not rechecked) | STD | `magma-bell` |
| Warding Bell | One-hit shield while binding | Act 1 data | | STD | `warding-bell` |
| Pollip Pouch | Adds venom to red Tools | Act 1 data | | STD, wiki (snippet) | `pollip-pouch` |
| Fractured Mask | Survives one fatal hit, then breaks; mended at a bench | Mottled Skarr, Hunter's March | 260 (Act 1 data) | STD | `fractured-mask` |
| Multibinder | Bind heals more (up to 4 Masks). Conflict: one source says it is also slower | Bellhart, after the courier quest | 880 (Act 1 data) | STD | `multibinder` |
| Weavelight | Silk refills faster | Weavenest Atla, past the two Moss Mothers | | STD | `weavelight` |
| Sawtooth Circlet | Spinning blades round Hornet when she uses a cloak | High Halls, after the Second Sentinel (one source) | | GB, NC | No |
| Injector Band | Faster Bind (40 percent, one source) | Whiteward (White Key), east side | | GRX-W, GC-WW | No |
| Spool Extender | Holds Silk beyond the normal maximum | **Conflict:** Twelfth Architect [GB] versus Jubilana's shop, Songclave, 720 [SCC] | | GB, SCC | No |
| Reserve Bind | Not described in results | High Halls, after the Second Sentinel in the Final Audience wish | | wiki (snippet) | No |
| Claw Mirror | **Conflict:** a burst of damage after binding [STD] versus reflects projectiles [GLB]. Upgrades to Claw Mirrors (how not found) | Whispering Vaults, after Trobbio and Tormented Trobbio (Act 3) | | GLB | No |
| Memory Crystal | An ice statue that explodes when Hornet is hit. **Colour conflict:** blue [STD] versus yellow [TSM] | Mount Fay, behind ice | | GLB, GC 100 | No |
| Volt Filament | Silk Skills carry an electric charge | Voltnest, Sands of Karak (Voltwyrm) | | STD, GLB | No |
| Snitch Pick | The Clawline harpoon steals Rosaries and Shell Shards and hurts more | Grindle, Blasted Steps | **Conflict:** 740 [wiki (snippet), XP] versus 720 [one guide] | XP, wiki (snippet) | No (deferred) |
| Egg of Flealia | Silk Skills cost less at full health | Fleatopia: Mooshka's reward for all 29 lost fleas | | GG-B | No |
| Wreath of Purity | Keeps Muckmaggots off; mended at a bench | Putrified Ducts, hidden passage east of the Bellway | | GC 100, GG-B | No |
| Wispfire Lantern | Spends Silk to send homing wisps at foes | Father of the Flame (optional boss), west end of Wisp Thicket | | HG-FF, wiki (snippet) | No |
| Longclaw | Longer Needle reach | Huntress's Broodfeast wish, Putrified Ducts (60 organs); in Act 3 Runt offers the same as Runtfeast | | DG-L, SK-BF, AT-BF, PCG | No |
| Quick Sling | Throws two red Tools at once for two charges; some Tools (Flea Brew, Silkshot, Delver's Drill, Rosary Cannon, Flintslate, Plasmium Phial) do not double | Bilewater, behind a false ceiling | | BYD, XP, SK-T | No |
| Pin Badge | Needle Strike charges faster. **Colour conflict:** blue (wiki edit log), red [GB], yellow [GLB] | Mount Fay, beat the Pinstress | | GC 100 | No |

### Yellow (12)

| Tool | Effect (our words) | Where and how | Cost | Sources | In `data/`? |
|---|---|---|---|---|---|
| Compass | Not confirmed (one summary gave it Thief's Mark's effect, likely a mix-up) | Shakra, The Marrow | 70 | PCG, NEO | `compass` |
| Shard Pendant | More Shell Shards from foes | Small room in the middle of The Marrow | | NEO | `shard-pendant` |
| Magnetite Brooch | Not found | Pebb, Bone Bottom | 120 | PCG | `magnetite-brooch` |
| Weighted Belt | Less knockback, both taken and from Hornet's own hits | Mort, Pilgrim's Rest | 160 | NEO | `weighted-belt` |
| Barbed Bracelet | Not found | Sinner's Road | | NEO, TSM | `barbed-bracelet` |
| Dead Bug's Purse | Keeps some Rosaries on death. In Steel Soul mode the **Shell Satchel** (more crafted Tools) takes its place | Guarded room, northeast Wormways | | NEO, Steam-A | `dead-bugs-purse` |
| Silkspeed Anklets | Spends Silk for speed | Far southeast of Far Fields; needs Needolin and Swift Step | | NEO | `silkspeed-anklets` |
| Magnetite Dice | Chance to cancel a hit from a foe (not hazards); grows with each hit up to 10.1 percent, resets when it triggers | Win Lumble's dice game in the Blasted Steps until he runs out of Rosaries | | SHK-MD, wiki (snippet) | No (deferred) |
| Thief's Mark | More Rosaries from foes, lose some when hit | Grindle, Blasted Steps | 350 | NEO | No (deferred) |
| Ascendant's Grip | Not found | Jubilana, Songclave, after the Wandering Merchant wish (Act 2 only, one source) | 350 | NC-AG, DG-AG | No |
| Spider Strings | Not found | Jubilana, Songclave, after the Wandering Merchant wish | 320 | DG-SS2, NEO | No |
| Scuttlebrace | Not found | **Conflict:** Twelfth Architect for 140 + Craftmetal [NC-SB] versus Shellwood [STD] | | NC-SB, STD | No |

**Count.** 19 red + 21 blue + 12 yellow = **52 named Tools**, plus the Needle Phial. Arsenal counts 51 with the Needle Phial excluded, so **one name above is probably not a Tool, or two are one**. The likely suspects are the ones with colour conflicts (Pin Badge, Memory Crystal). Open for Athos.

**Upgrades and variants, tracked but not counted again:** Curvesickle (from Curveclaw: hit every target in a Far Fields room, Act 3; the method differs between guides; free) [NC-CS, NL-T], Druid's Eyes, Claw Mirrors, the two Silkshot versions not chosen, Shell Satchel (Steel Soul only).

**Prices that confirm Act 1 data** (second source agrees): Compass 70, Magnetite Brooch 120, Weighted Belt 160, Curveclaw 140, Sting Shard 140, Crafting Kit (Forge Daughter) 180.

## 4. Skills and things that change slots or Tools

### Silk Skills (white slots), 6

| Skill | Where and how | Sources | In `data/`? |
|---|---|---|---|
| Silk Spear | Mosshome, Moss Grotto | GB-SS, AC low | `silk-spear` |
| Thread Storm | Craw Lake gauntlet, top right of Greymoor | GB-SS | `thread-storm` |
| Cross Stitch | Beat the Phantom, Exhaust Organ, Bilewater | GB-SS | No |
| Sharpdart | Behind a Weaver door, west Wormways; needs Needolin and Clawline | GB-SS | No (deferred) |
| Rune Rage | Beat the First Sinner, The Slab | GB-SS | No |
| Pale Nails | Bind Grand Mother Silk's arm at the top of the Citadel (the Cradle); needs Silk Soar | GB-SS | No |

Effects of each Silk Skill were not in the results. Silk Skills only go in white slots; the Architect Crest has none, the Shaman Crest has three. Ancestral Arts (Swift Step, Cling Grip, Needolin, Clawline, Silk Soar, Sylphsong) and Needle Strike take no slot; they matter to builds only through Tools that change them (Pin Badge, Sawtooth Circlet, Snitch Pick).

### Eva (Weavenest Atla, needs Needolin)

Eva counts slots unlocked on **every Crest except Hunter**. Rewards [wiki (snippet), NC-EVA, RR-EVA, game-checklists guide title]:

| Threshold | Reward |
|---|---|
| first meeting | Hunter Crest, first evolution (one source: wear the Hunter Crest when you meet her) |
| 12 slots | Vesticrest, yellow slot |
| 20 slots | Vesticrest, blue slot |
| 27 slots | Hunter Crest, second evolution |
| 32 slots | Bind Eva: Sylphsong (Silk refills while resting at a bench) |

Conflict: Sportskeeda gives 4 and 15 slots for the two Vesticrest steps and "all Crests and 18 Lockets" for Sylphsong. The minimum Memory Lockets for Sylphsong is 12 of 20, up to 15 if some go on the Hunter Crest (wiki (snippet)).

### Tool Pouch and Crafting Kit, 4 each

| | Where | Sources | In `data/`? |
|---|---|---|---|
| Tool Pouch 1 | Loddle's challenge, The Marrow | G8-TP, Act 1 | `tool-pouch-loddle` |
| Tool Pouch 2 | Mort, Pilgrim's Rest (220, Act 1 data) | G8-TP | `tool-pouch-pilgrims-rest` |
| Tool Pouch 3 | Greymoor: the Bugs of Pharloom wish [G8-TP]; the Act 1 sheet says Nuu, for a full Hunter's Journal (probably the same wish) | G8-TP, Act 1 deferred list | No |
| Tool Pouch 4 | Fleatopia, Putrified Ducts (flea rewards) | G8-TP | No |
| Crafting Kit 1 | Forge Daughter, 180 | several | `crafting-kit-forge` |
| Crafting Kit 2 | Creige, Crawbug Clearing wish | several | `crafting-kit-creige` |
| Crafting Kit 3 | Twelfth Architect, 450, needs Clawline | one fan table only | No |
| Crafting Kit 4 | Grindle, Blasted Steps, 700, needs the Faydown Cloak | one fan table; GC lists a Crafting Kit in Grindle's shop (Act 1 deferred list) | No |

### Needle upgrades (affect every build's damage), 4

Sharpened Needle (free, Plinney, after the Widow; Act 1 data, `sharpened-needle`), Shining Needle (1 Pale Oil), Hivesteel Needle (450 + Pale Oil), Pale Steel Needle (680 + Pale Oil, Act 3; Plinney may have moved to Shellwood). Costs from the wiki (snippet) only; one guide says one level per Pale Oil. [GG-N, NC-N, wiki (snippet)]

### Memory Lockets (key items, not counted)

20 in total. Places named in results: Mort in Far Fields (150 Rosaries, one only), a corpse just before the Chapel of the Beast, past the fan right of the Moorwing arena, the Volatile Flintbeetles reward, a hidden room after the Hunter's March chapel boss. [DG-ML, NC-ML, AT-ML] A full list is for the key-items sheet.

## 5. Disagreements to settle (Athos, in game or on the wiki)

1. Witch Crest slots: 2 red then +3 blue, or 1 red 1 blue then +1 red +1 blue. (Our locket arithmetic favours the first.)
2. Shaman Crest's extra slots: 2 blue, or 2 white with no Tools at all.
3. Hunter Crest: does the white slot exist from the start (most say yes).
4. Wanderer Crest gate: Simple Key or Cling Grip (already open from Act 1).
5. Tool colours: Pin Badge (blue, red or yellow), Memory Crystal (blue or yellow).
6. Which name in the Tools tables is not one of the 51 (52 named).
7. Locations: Snare Setter, Spool Extender, Scuttlebrace, Cogfly, Plasmium Phial, Delver's Drill.
8. Effects: Claw Mirror; Multibinder slower or not; Compass, Magnetite Brooch, Barbed Bracelet, Ascendant's Grip, Spider Strings, Scuttlebrace, Reserve Bind, Curveclaw (not found).
9. Eva thresholds: 12/20/27/32 (wiki and three guides) versus Sportskeeda's numbers.
10. Snitch Pick: 740 or 720 Rosaries.

## 6. Proposal: what the data needs for the Build picker

**Not a contract yet.** The orchestrator writes these into `docs/CONTRACTS.md` only after Athos answers the plan's open questions (especially 3, templates or picker only).

What the picker does: from the Crests and Tools the player has marked done, and the Crest they choose, fill each slot colour with owned Tools, ranked by templates and tags, never suggesting what the player does not own.

Fields, smallest set that does that:

| Field | On | Type | Why |
|---|---|---|---|
| `slot` | `type: "tool"` and `type: "silk-skill"` | `"red"` \| `"blue"` \| `"yellow"` \| `"white"` | which slot it fits. Required on those types (new validator rule) |
| `slots` | `type: "crest"` | `{ red, blue, yellow, white }`, integers ≥ 0 | slots when found |
| `slotsMax` | `type: "crest"` | same shape, each ≥ `slots` | slots with every Memory Locket; the difference is what lockets can open |
| `effect` | Crests, Tools, Silk Skills | string, our words, under 200 characters | `how` stays "where and how to get it"; the picker shows `effect` |
| `tags` | Tools, Silk Skills, Crests | string[] from a fixed list (for example `damage`, `trap`, `ranged`, `bind`, `silk`, `defence`, `rosary`, `shell-shard`, `movement`, `fire`, `venom`, `electric`, `needle-strike`, `clawline`, `cloak`) | lets the picker rank and lets synergy rules be written once; the validator checks the list |
| `upgradeOf` | upgraded Tools and evolved Hunter Crest | entry id | Curvesickle, Druid's Eyes, Claw Mirrors; picker treats owning the upgrade as owning a better base |
| `oneOf` | the three Silkshot versions | group string | marks a choice where only one can be owned per run (a Route "choice point") |
| `grantsSlots` | Vesticrest entries | `{ red, blue, yellow, white }` | slots added to whatever Crest is worn |
| `counts` | as in the plan | boolean | upgrades, variants, Memory Lockets, Vesticrest and the Hunter Crest are tracked but not counted |

Open points for Athos that change the shape:

- **The Hunter Crest** is owned from the start. Options: (a) an entry with `requires: []` that the site treats as always done (needs a rule in `requirements.js` or the picker), (b) a normal entry the player ticks. Recommendation: (b), simplest, no special case; the picker shows Hunter even when unticked.
- **Memory Lockets spent per Crest.** The picker cannot know which slots a player has opened. Options: (a) use `slots` only; (b) use `slotsMax` once every locket is done; (c) store a small number map in Progress, `crestSlots: { "reaper-crest": { "blue": 1 } }`, newer wins like the Rosaries number. Recommendation: (c), because Eva's thresholds also depend on it and the plan already adds a numbers block; it is one more key in the same change, tested in the same sync rehearsal.
- **Templates and synergies** live in a new `data/builds.json` (`templates`: id, name, crest, tools, skills, note, `source`, all marked editorial; `synergies`: two ids, why, `source`), so `items.json` stays game content. Validator: ids exist, a template fits the Crest's `slotsMax`, Silk Skills only where `white` > 0.
- **Steel Soul** (Shell Satchel replacing Dead Bug's Purse): out of scope for V1 unless Athos plays it.

## 7. What is already in `data/items.json` (read only, dataVersion 3, 62 entries)

- **Crests (3):** `beast-crest`, `reaper-crest`, `wanderer-crest`.
- **Tools (23):** red: `straight-pin`, `threefold-pin`, `sting-shard`, `tacks`, `longpin`, `curveclaw`, `pimpillo`, `flintslate`, `flea-brew`; blue: `druids-eye`, `magma-bell`, `warding-bell`, `pollip-pouch`, `fractured-mask`, `multibinder`, `weavelight`; yellow: `compass`, `shard-pendant`, `magnetite-brooch`, `weighted-belt`, `barbed-bracelet`, `dead-bugs-purse`, `silkspeed-anklets`.
- **Silk Skills (2):** `silk-spear`, `thread-storm`.
- **Slot-related (5):** `tool-pouch-loddle`, `tool-pouch-pilgrims-rest`, `crafting-kit-forge`, `crafting-kit-creige`, `sharpened-needle`.
- **New for Dev C:** 4 Crests (Hunter, Witch, Architect, Shaman), 29 Tools (10 red, 14 blue, 5 yellow, see the "No" rows) plus the Needle Phial, 4 Silk Skills, 2 Tool Pouch and 2 Crafting Kit upgrades, 3 Needle upgrades, and the tracked-only extras (Vesticrest, Hunter evolutions, Memory Lockets, Tool upgrades and Silkshot versions). Most are in Act 2 and 3 Regions, so each waits for its Region in those sheets.

## 8. Save file spike (research only)

What the results say about the PC save, for the optional "import my real save" feature (plan step 7). Nothing was downloaded or run.

- **Where (Windows, Steam and GOG):** `%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight Silksong\`, in a sub-folder named with a number (a Steam id), files `user1.dat` to `user4.dat` (one per save slot), with `.bak` copies. [PRIMA, SHK-S, wiki (snippet), MIL]
- **Other platforms (wiki snippet only):** Microsoft Store under `%LOCALAPPDATA%\Packages\TeamCherry.HollowKnightSilksong_...\SystemAppData\wgs\`; macOS `~/Library/Application Support/unity.Team-Cherry.Silksong/`; Linux `~/.config/unity3d/Team Cherry/Hollow Knight Silksong/`. Settings live in the Windows registry, not in the save.
- **Format:** community tools agree on the same layers: a short header, then Base64, then AES (Rijndael) encryption with a fixed key built into the game, and inside that, JSON. The key and the method come from people reading the game's code (Assembly-CSharp.dll); one toolkit says it re-encrypts an untouched save byte for byte. The search results did not show the key itself. [GitHub: ash-005/Silksong-Save-File-reader, Wersky/silksong-save-toolkit, MartinShift/silksaver, moeakwak/silksong-save-editor, just-addwater/silksong-saveeditor; Nexus save editor page]
- **Browser tools exist** (silksaver, moeakwak, just-addwater) that decrypt in the page, so a static site could read the file locally without uploading it.
- **Questions this raises for Athos, before any work:** shipping the game's decryption key in our public repository (it is Team Cherry's, not ours; the community tools do it); mapping the save's internal flag names to our ids (a large table to maintain per game patch); and whether import should only add (union, like our backup import) or also untick. Recommendation: keep it last, as the plan says, and start with a read-only "what does my save say" preview.

## Sources

Search-result pages only; none was opened. Codes used above:

- AC (low): [Acer, all 7 crests](https://blog.acer.com/en/discussion/3480/guide-to-all-7-crests-in-silksong)
- AT, AT-ML, AT-S, AT-W, AT-SS, AT-BF: allthings.how: [crests](https://allthings.how/hollow-knight-silksong-all-crest-locations-and-effects/), [Memory Lockets](https://allthings.how/silksong-memory-lockets-unlock-crest-slots-and-equip-more-tools/), [Shaman](https://allthings.how/hollow-knight-silksong-shaman-crest-location-slots-and-builds/), [Witch](https://allthings.how/hollow-knight-silksong-witch-crest-location-and-quest-steps/), [Silkshot](https://allthings.how/silksong-silkshot-guide-find-the-ruined-tool-craft-all-variants-and-pick-the-best/), [Broodfeast](https://allthings.how/silksongs-huntress-how-to-start-and-finish-the-broodfeast-quest/)
- BYD: [Backyard Drunkard, Quick Sling](https://backyarddrunkard.com/games/silksong-quick-sling/)
- DG, DG-ML, DG-W, DG-F, DG-TR, DG-SS, DG-L, DG-AG, DG-SS2, DG-AA: Deltia's Gaming: [crests](https://deltiasgaming.com/?p=337543), [Memory Locket](https://deltiasgaming.com/?p=338029), [Witch](https://deltiasgaming.com/?p=339934), [Flintslate](https://deltiasgaming.com/?p=345205), [Trail's End](https://deltiasgaming.com/?p=345659), [Silkshot](https://deltiasgaming.com/?p=343122), [Longclaw](https://deltiasgaming.com/?p=344175), [Ascendant's Grip](https://deltiasgaming.com/?p=343239), [Spider Strings](https://deltiasgaming.com/?p=342458), [Alchemist's Assistant](https://deltiasgaming.com/?p=344432)
- DX: [Dexerto, all crests](https://www.dexerto.com/gaming/all-crests-in-silksong-how-to-get-them-3247243)
- EG: [eGamersWorld, crests](https://egamersworld.com/blog/hollow-knight-silksong-crests-where-to-find-them-_aFFAdYsHN)
- ESC: [The Escapist, crests ranked](https://www.escapistmagazine.com/best-crests-hollow-knight-silksong/)
- G8, G8-TP: Game8: [crests](https://game8.co/games/Hollow-Knight-Silksong/archives/548970), [Tool Pouch](https://game8.co/games/Hollow-Knight-Silksong/archives/549961)
- GB, GB-SS: GamingBolt: [59 Tools](https://gamingbolt.com/hollow-knight-silksong-guide-all-59-tool-locations), [Silk Skills](https://gamingbolt.com/hollow-knight-silksong-guide-all-6-silk-skills-and-how-to-unlock-them)
- GC 100, GC-WW, GC guide: game-checklists.com: [100 percent](https://game-checklists.com/silksong/100-percent.html), [Whiteward](https://game-checklists.com/silksong/whiteward.html), [maps guide](https://game-checklists.com/silksong/guides/how-to-get-all-maps.html)
- GG-B, GG-W, GG-RR, GG-N: Gamer Guides: [blue Tools](https://www.gamerguides.com/hollow-knight-silksong/database/tools/blue), [wayfarer wishes](https://www.gamerguides.com/hollow-knight-silksong/guide/quests/wayfarer), [Rite of Rebirth](https://www.gamerguides.com/hollow-knight-silksong/guide/quests/wayfarer/rite-of-rebirth), [Needle](https://www.gamerguides.com/hollow-knight-silksong/database/items/key-items-1/needle)
- GLB: [GladiatorBoost, tool list](https://gladiatorboost.com/news/hollow-knight-silksong-complete-tool-list-locations-all-65-tools-explained/)
- GR, GR-100: GameRant: [crests](https://gamerant.com/hollow-knight-silksong-crests-list-locations-how-to-get/), [100 percent](https://gamerant.com/silksong-get-100-percent-requirements-completion-guide/)
- GRX, GRX-W: Gameranx: [Plasmium Phial](https://gameranx.com/features/id/553263/article/hollow-knight-silksong-how-to-get-the-plasmium-phial-healing-tool-guide/), [Whiteward](https://gameranx.com/features/id/551986/article/hollow-knight-silksong-how-to-access-the-whiteward-white-key-location/)
- GS: [GameSpot, crests](https://www.gamespot.com/gallery/hollow-knight-silksong-crest-locations-guide/2900-6994/)
- HG, HG-FF: HostedGG: [crest build guide](https://hostedgg.com/blog/silksong-crest-build-guide), [Father of the Flame](https://hostedgg.com/wiki/silksong/father-of-the-flame)
- KG, KG-GM: KeenGamer: [crests](https://www.keengamer.com/articles/guides/hollow-knight-silksong-all-crest-locations), [Greymoor](https://www.keengamer.com/articles/guides/hollow-knight-silksong-greymoor-walkthrough)
- MIL: [millenium.org, save](https://www.millenium.org/guide/428061.html)
- NC, NC-A, NC-ML, NC-EVA, NC-RT, NC-RC, NC-TR, NC-CS, NC-AG, NC-SB, NC-N: Nerdschalk: [Sawtooth Circlet](https://nerdschalk.com/silksong-sawtooth-circlet-location-and-step-by-step-guide-to-unlock-it/), [Chapel of the Architect](https://nerdschalk.com/conquering-the-chapel-of-the-architect-your-way-to-the-architect-crest-in-hollow-knight-silksong/), [Memory Lockets](https://nerdschalk.com/how-many-memory-lockets-are-there-in-silksong-all-locations-listed/), [Eva](https://nerdschalk.com/silksong-eva-all-5-upgrade-requirements/), [Ruined Tool](https://nerdschalk.com/silksong-ruined-tool-your-key-to-pharlooms-challenges/), [Rosary Cannon](https://nerdschalk.com/your-guide-to-rosary-cannon-in-silksong-location-map-how-to-unlock-and-use-tips-and-more/), [Trail's End](https://nerdschalk.com/trails-end-silksong-guide-location-map-requirements-rewards-and-more/), [Curvesickle](https://nerdschalk.com/what-is-curveclaw-in-silksong-and-how-to-upgrade-it-to-curvesickle/), [Ascendant's Grip](https://nerdschalk.com/silksong-ascendants-grip-location-route-rewards-requirements-more/), [Scuttlebrace](https://nerdschalk.com/silksong-scuttlebrace-location-and-step-by-step-guide-to-get-it/), [Needle upgrade](https://nerdschalk.com/silksong-needle-upgrade-how-to-unlock-it/)
- NEO: Neoseeker: [red Tools](https://www.neoseeker.com/hollow-knight-silksong/Red_Tools), [yellow Tools](https://www.neoseeker.com/hollow-knight-silksong/Yellow_Tools)
- NL, NL-T: Nintendo Life: [crests](https://www.nintendolife.com/guides/hollow-knight-silksong-crests-guide-all-crest-locations-and-effects), [Tools](https://www.nintendolife.com/guides/hollow-knight-silksong-all-tools-list-and-locations)
- PCG, PCG-P: PCGamesN: [crests](https://www.pcgamesn.com/hollow-knight-silksong/crest-best), [Tools](https://www.pcgamesn.com/hollow-knight-silksong/tools), [Plasmium](https://www.pcgamesn.com/hollow-knight-silksong/plasmium)
- PRIMA: [Prima Games, save location](https://primagames.com/tips/hollow-knight-silksong-save-file-location)
- RK: [Raider King, red Tools](https://raiderking.com/hollow-knight-silksong-all-red-tools-damage-values-best-ones-locations/)
- RR, RR-EVA: RogueRanker: [Tools](https://rogueranker.com/hollow-knight-silksong-tools/), [Eva](https://rogueranker.com/hollow-knight-silksong-eva/)
- SCC: [ScalaCube, Wandering Merchant](https://scalacube.com/blog/hollow-knight/hollow-knight-silksong-the-wandering-merchant-quest-guide)
- SHK, SHK-MD, SHK-S: Shacknews: [Tool Pouch and Crafting Kit](https://www.shacknews.com/article/146145/upgrade-tool-pouch-crafting-kit-silksong), [Magnetite Dice](https://www.shacknews.com/article/146158/unlock-magnetic-dice-silksong), [save file](https://www.shacknews.com/article/145800/where-to-find-hollow-knight-silksong-steam-save-file)
- SK, SK-SS, SK-BF, SK-T: Sportskeeda: [crests](https://www.sportskeeda.com/esports/all-hollow-knight-silksong-crests-locations), [Silkshot](https://www.sportskeeda.com/esports/how-get-silk-shot-variants-hollow-knight-silksong), [Broodfeast](https://www.sportskeeda.com/esports/how-complete-broodfeast-wish-hollow-knight-silksong), [tool tier list](https://www.sportskeeda.com/esports/best-tools-tier-list-hollow-knight-silksong), [Eva](https://www.sportskeeda.com/esports/all-eva-upgrades-hollow-knight-silksong-get)
- Steam-A: [Steam guide, Arsenal](https://steamcommunity.com/sharedfiles/filedetails/?id=3567552144) (reported removed; seen as cached text in results), [Steam 100 percent guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3562089042)
- STD: [silksongtools.com](https://silksongtools.com/tools/)
- SW: [silksongwiki.com, Tools](https://silksongwiki.com/database/tools/), [Crests](https://silksongwiki.com/database/crests/)
- TG: [TheGamer, achievements](https://www.thegamer.com/hollow-knight-silksong-achievement-trophy-guide/)
- TSM: [thesilksongmap.com, Tools](https://www.thesilksongmap.com/tools)
- WP: [Wikipedia, Hollow Knight: Silksong](https://en.wikipedia.org/wiki/Hollow_Knight:_Silksong)
- XP: [xboxplay.games, Snitch Pick](https://xboxplay.games/hollow-knight-silksong/where-to-get-snitch-pick-in-hollow-knight-silksong-67228), [Quick Sling](https://xboxplay.games/silksong/how-to-get-quick-sling-in-silksong-67259)
- wiki (snippet): hollowknight.wiki text as quoted in search results (Crests, Reaper, Wanderer, Hunter, Architect, Shaman, Witch, Cursed, Cloakless, Eva, Memory Locket, Tool Pouch and Crafting Kit, Flintslate, Needle Phial, Wispfire Lantern, Magnetite Dice, Save Data (Silksong)); never opened.
- Save tools on GitHub: [ash-005](https://github.com/ash-005/Silksong-Save-File-reader), [Wersky](https://github.com/Wersky/silksong-save-toolkit), [MartinShift](https://github.com/MartinShift/silksaver), [moeakwak](https://github.com/moeakwak/silksong-save-editor), [just-addwater](https://github.com/just-addwater/silksong-saveeditor), [Nexus save editor](https://www.nexusmods.com/hollowknightsilksong/mods/93?tab=files)
