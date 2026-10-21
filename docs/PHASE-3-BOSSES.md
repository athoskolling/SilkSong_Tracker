# Phase 3: every boss as its own entry (orchestrator's research, 2026-10-20)

**Why this exists.** Athos asked that every boss be trackable, so it can be a Goal (glossary). `data/` (`dataVersion` 12) has 23 boss Tasks. About 15 more bosses are only named inside the `how` of the thing they give (Act 1 decision 5: a fight became its own Task only when it opened two or more things), and some are not in the data at all. Athos's decisions (2026-10-20, the orchestrator's recommendations, accepted): every boss becomes its own entry; a boss that gives nothing stays off the Route unless the Route needs it; a rematch gets an entry only when it gives something.

**Research, not data.** Nothing here goes into `data/` until Athos confirms the rows (or strikes them) and the Route rule below is decided. Ids are permanent once published (ADR 0003).

**Spoiler warning:** names every boss, Act 3 included.

## How this was researched, and its limit

- **Two guide pages read in full** (fetched once each, on 2026-10-20): Game-Checklists' all-bosses list [GC-B] (48 bosses by Act, with a requirement label but no rewards) and PCGamesN's bosses list [PCG-B] (48 bosses, with rewards). Nintendo Life's list refused the fetch (HTTP 403). Everything else is **web search results only** (codes at the end). hollowknight.wiki and Fextralife were never fetched; where the wiki is cited it is its text **as quoted in a search result**, marked `wiki`.
- **One code = one source = unconfirmed.** "Conflict" gives both readings. `low` marks thin sites; they never decide a conflict.
- **Checked against `data/` by script** (orchestrator, throwaway, outside the repository): every proposed id is new, every `requires` id exists, every Region exists, and every proposed `step` is free, after everything the row needs and before the entry it gives.
- **`source`** on each new row is its first non-wiki code (GC-B or PCG-B), until Athos swaps it.

## The Route rule for bosses that give nothing (decision needed before Dev C starts)

Today `routeIds` puts every Task on the Route (`docs/CONTRACTS.md` section 2). Athos's decision means a boss Task should be on the Route only when something on the Route needs it. Checked on today's data: making boss Tasks "on the Route only when needed" moves **one** entry off the Route, Lost Lace, because nothing requires it: it is only an Ending condition, and `routeIds` does not read `endings.json`. So the rule needs one more piece. Two ways:

- **A (recommended): an optional field `optional: true` on a boss Task.** Such a Task is not on the Route by itself; it is on the Route only when an entry on the Route or a Region needs it (the existing chain rule), or when it is `missable`. Bosses without the field keep today's rule, so Lost Lace and the 23 existing bosses stay where they are. One line in `routeIds`, one validator check (`optional` is a boolean, only on `kind: "task"`), no signature change. Cost: a person decides per boss, and a wrong `optional: true` on a needed boss changes nothing (the chain rule still keeps it on).
- B: `routeIds(items, regions, endings)` reads Ending conditions as roots, and every boss Task loses the automatic place. Cleaner in principle (it also settles validator rule 14's warning), but it changes a signature every page and the validator call, for the same result on the data.

Checked (simulation on a copy of `data/`): with A and the rows below, nothing that is on the Route today leaves it, and the Route has no order inversions.

## Bosses already in `data/` (no change)

Moss Mother, Bell Beast, Lace, Fourth Chorus, Savage Beastfly, Moorwing, Sister Splinter, Widow, Great Conchflies, Moss Mother duo, Last Judge, Cogwork Dancers, Garmond and Zaza (duel), Forebrothers Signis & Gron, Lace (The Cradle), Shakra (duel), Grand Mother Silk (Bind, cursed, Soul Snare: three entries for the three Endings), Crust King Khann, Nyleth, Skarrsinger Karmelita, Lost Lace. All 23 are in both lists [GC-B, PCG-B] (Grand Mother Silk once, as one boss).

## New entries

Kind is T (Task) for all. `type` is `boss` unless noted. "Gives" is the existing entry that gets this id added to its `requires` (its other `requires` stay). "Route" is where the row lands under option A: **on** when what it gives is on the Route, **off** with `optional: true` otherwise.

### Bosses folded into what they give (the reward already exists)

| step | id | Name | Region (Sub-area) | requires | Gives | Route | how (our words) | Sources |
|---|---|---|---|---|---|---|---|---|
| 809 | `trobbio` | Trobbio | Whispering Vaults (The Stage) | | `claw-mirror` | on | A showman fought on the Stage in the Whispering Vaults. Optional for the story; the Claw Mirror is his prize. | GC-B, PCG-B, NL (search) |
| 824 | `savage-beastfly-grand-hunt` | Savage Beastfly, Grand Hunt | Far Fields | `savage-beastfly`, `cogwork-dancers` | `mask-shard-savage-beastfly` | on | The rematch the Savage Beastfly Grand Hunt sends you to, in the Far Fields arena; its Horn Fragment is what the wish wants. | GC-B, PCG-B |
| 861 | `surgeons-key` | Surgeon's Key | Whiteward | `clawline` | (`the-unravelled`) | on | Type `key`. At the end of a path in Whiteward, hang on a Clawline hook until your weight opens a gate above; a body falls, and the key is on it. | DG-SK, GB-K, wiki |
| 919 | `the-unravelled` | The Unravelled | Whiteward | `surgeons-key` | `silk-heart-unravelled` | on | Behind the Surgeon's Key door, below the operating theatre. | GC-B, PCG-B, DG-SK |
| 979 | `phantom` | Phantom | Bilewater (Exhaust Organ) | `needolin` | `cross-stitch` | on | The ghost of the Exhaust Organ, past the Mist; one of the two ways out of Act 1 (the other is the Last Judge). | GC-B, PCG-B |
| 995 | `groal-the-great` | Groal the Great | Bilewater (Bilehaven) | | `silk-and-soul` | on | Top of Bilewater, behind a short gauntlet. The Seeker's Soul that Silk and Soul asks for is in the hut past him. | PCG-B, GC-B, wiki, NL (search) |
| 1179 | `first-sinner` | First Sinner | The Slab | `key-of-apostate` | `rune-rage` | on | Chained in the prison in the south east of the Slab. | GC-B, PCG-B |
| 1219 | `father-of-the-flame` | Father of the Flame | Wisp Thicket | | `wispfire-lantern` | on | A scarecrow fight west of the Wisp Thicket bench. | GC-B, PCG-B |
| 1239 | `raging-conchfly` | Raging Conchfly | Sands of Karak | | `conchcutter` | on | Fought before the Coral Tower. | GC-B, PCG-B |
| 1249 | `voltvyrm` | Voltvyrm | Sands of Karak (Voltnest) | | `volt-filament` | on | In the Voltnest, north in the Sands of Karak. | GC-B, PCG-B |
| 1259 | `disgraced-chef-lugoli` | Disgraced Chef Lugoli | Sinner's Road | | `hivesteel-needle` | on | The boss at the end of Sinner's Road. One of the five dishes for the Great Taste of Pharloom (the Pale Oil for the Hivesteel Needle) needs this fight. | GC-B, PCG-B, wiki (search), RR-GT low |
| 1309 | `second-sentinel` | Second Sentinel | High Halls | `conductors-melody` | `reserve-bind` | on | The Final Audience wish. **Conflict on the Region:** High Halls [PCG-B] or Choral Chambers [GC-B]; `reserve-bind` is in High Halls in `data/`, so the row follows it. | GC-B, PCG-B, G8 (search) |
| 2034 | `tormented-trobbio` | Tormented Trobbio | Whispering Vaults (The Stage) | `claw-mirror`, `silk-soar` | `claw-mirrors` | off | Act 3 rematch on the Stage, through the Pain, Anguish and Misery wish; gives the Dark Mirror (`claw-mirrors`, not counted). | GC-B, PCG-B |
| 2044 | `watcher-at-the-edge` | Watcher at the Edge | Sands of Karak | `silk-soar`, `needolin` | `grey-memento` | off | Hidden in a parkour section of the Sands of Karak. | GC-B, PCG-B |
| 2069 | `shrine-guardian-seth` | Shrine Guardian Seth | Grand Gate (Shellwood Shrine) | `elegy-of-the-deep`, `silk-soar` | `nyleth` | on | He guards Nyleth's shrine and is fought first. Gives nothing himself; on the Route because Nyleth needs him. | GC-B, PCG-B, wiki |
| 2085 | `clover-dancers` | Clover Dancers | Greymoor (Lost Verdania) | `elegy-of-the-deep`, `simple-key-sands-of-karak` | `conjoined-heart` | off | The last fight of Lost Verdania; gives the Conjoined Heart. | GC-B, PCG-B, DG-PS |
| 2094 | `lost-garmond` | Lost Garmond | Blasted Steps | `everbloom` | `heros-memento` | off | Void-infected Garmond near the Blasted Steps Bellway (The Hero's Call wish). | GC-B, PCG-B |
| 2109 | `gurr-the-outcast` | Gurr the Outcast | Far Fields | `skarrsinger-karmelita` | `mask-shard-hidden-hunter` | on | The target of The Hidden Hunter Grand Hunt, hidden in the Far Fields. | GC-B, PCG-B, wiki |
| 2139 | `pinstress` | Pinstress | Mount Fay (peak) | `needle-strike`, `silk-soar` | `pin-badge` | on | The Fatal Resolve wish: fight the Pinstress on Mount Fay. | GC-B, PCG-B |

### Bosses not in `data/` at all

| step | id | Name | Region (Sub-area) | requires | Gives (tracked) | Route | how (our words) | Sources |
|---|---|---|---|---|---|---|---|---|
| 391 | `skull-tyrant` | Skull Tyrant | The Marrow | `cling-grip` | nothing tracked | off | The Terrible Tyrant, a Grand Hunt on the Bone Bottom wish board once you have Cling Grip. Its Crown Fragment, handed in, pays a Heavy Rosary Necklace (a consumable, not tracked). | GC-B, PCG-B, GG-GH, II-ST, wiki |
| 651 | `broodmother` | Broodmother | The Slab | | nothing tracked | off | The Wailing Mother, a Songclave Grand Hunt. Its reward is a Rosary necklace (**conflict:** Heavy [wiki] or plain [NL]); PCG-B lists a Gelatinous Organ. | GC-B, PCG-B, wiki, NL (search) |
| 2011 | `plasmified-zango` | Plasmified Zango | Wormways | `grand-mother-silk-snared` | nothing tracked | off | In Act 3 the Wormways change and Zylotol's dead assistant rises. No reward in the sources read (one `low` source claims a health upgrade). | GC-B, PCG-B, wiki, NS-Z low |
| 2012 | `bell-eater` | Bell Eater | Choral Chambers (Grand Bellway) | `grand-mother-silk-snared` | see open question 2 | off | In Act 3, calling the Bell Beast at the Grand Bellway fails and the Bell Eater comes up instead. **Conflict on the Region:** Choral Chambers [GC-B, DG-BE] or The Marrow [PCG-B]. | GC-B, PCG-B, DG-BE, SK-BC |
| 2013 | `crawfather` | Crawfather | Greymoor (Craw Lake) | `grand-mother-silk-snared` | see open question 3 | off | The Craw Summons opens a door at Craw Lake; the Court of Craws is behind it. | GC-B, PCG-B, wiki |
| 2041 | `palestag` | Palestag | Greymoor (Lost Verdania) | `elegy-of-the-deep`, `simple-key-sands-of-karak` | nothing tracked | off | The first fight of Lost Verdania; it gives orbs for the area's puzzle, not an item. **Conflict:** "required for 100%" [GC-B] or not [DG-PS]. | GC-B, PCG-B, DG-PS |

## Left out, with the reason

- **Skull Tyrant rematch** (Bone Bottom, Act 3) and **Void Moss Mother** (a black-threaded Moss Mother, Act 3; GC-B only): rematches that give nothing tracked.
- **Summoned Saviour** (Bonegrave): Steel Soul mode only [GC-B, PCG-B]; the guide follows a normal run.
- **Craggler, Skarrgard, Sharpe** (PCG-B only): GC-B does not list them; other sources call Skarrgard a mini-boss, and nothing was found on Sharpe. PCG-B says Craggler gives a Beast Shard; nothing else was found about it.

## Open questions for Athos

1. **The Route rule:** A (`optional: true`, recommended) or B (Ending conditions as roots).
2. **Beastling Call** (from the Bell Eater: a Needolin song that calls the Beastlings back to a Bellway [wiki, SK-BC]) is not in `data/`. Is it an entry? The Elegy of the Deep, a similar song, is a Task (`type: ability`) today, although the glossary now says a thing the player obtains is a Collectible.
3. **Craw Memento and Crawbell** (from the Crawfather [wiki]) are not in `data/`. The Craw Memento is a Memento (`counts: false`); the Crawbell was already planned off the Route (contract section 8). Add both with this batch?
4. **The Craw Summons** (opens Craw Lake's door) is not in `data/`; the row gates the Crawfather on Act 3 only.
5. **Two Region conflicts:** Second Sentinel (High Halls or Choral Chambers) and Bell Eater (Choral Chambers or The Marrow).
6. **Gelatinous Organ** (PCG-B, from Broodmother) is not found in any other source; not added.

## What Dev C would change, once confirmed

- 24 new boss Tasks and one key Task (`surgeons-key`), with the steps above; 14 bosses and the key on the Route, 10 bosses off it with `optional: true` (if A).
- `requires` gains the boss on 18 existing entries (the "Gives" column, which includes `nyleth` for Seth and `silk-and-soul` for Groal); nothing else in them changes.
- Checked by simulating these rows and rule A on a copy of `data/`: nothing on the Route today leaves it, no entry on the Route comes before something it needs, and no id or step clashes.
- The `how` of those entries can keep naming the boss.
- One `dataVersion` raise.

## Sources (codes)

- GC-B: Game-Checklists, All 48 Bosses Checklist and Locations, https://game-checklists.com/silksong/all-bosses.html (read)
- PCG-B: PCGamesN, All Hollow Knight Silksong bosses in order, https://www.pcgamesn.com/hollow-knight-silksong/bosses (read)
- NL: Nintendo Life, All Bosses In Order, https://www.nintendolife.com/guides/hollow-knight-silksong-all-bosses-in-order-locations-and-rewards (search results only; the page refused the fetch)
- wiki: hollowknight.wiki pages as quoted in search results (Bosses (Silksong), The Terrible Tyrant, The Wailing Mother, Craw Memento, Palestag, Beastling Call, Plasmified Zango, Bilewater), never fetched
- DG-BE: Deltia's Gaming, How To Beat Bell Eater, https://deltiasgaming.com/?p=349462
- SK-BC: Sportskeeda, How to get Beastling Call, https://www.sportskeeda.com/esports/how-get-beastling-call-hollow-knight-silksong
- GG-GH: Gamer Guides, Grand Hunt, https://www.gamerguides.com/hollow-knight-silksong/guide/quests/grand-hunt
- II-ST: Into Indie Games, Skull Tyrant boss guide, https://intoindiegames.com/walkthroughs/tips-tricks/hollow-knight-silksong-boss-guide-skull-tyrant/
- DG-SK: Deltia's Gaming, How To Get and Use the Surgeon's Key, https://deltiasgaming.com/?p=341207
- GB-K: GamingBolt, All Key Items and Simple Keys Locations, https://gamingbolt.com/hollow-knight-silksong-guide-all-key-items-and-simple-keys-locations
- DG-PS: Deltia's Gaming, How To Beat Palestag, https://deltiasgaming.com/?p=350145
- G8: Game8, All Boss Guides, https://game8.co/games/Hollow-Knight-Silksong/archives/547558
- RR-GT (low): Rogue Ranker, Great Taste of Pharloom, https://rogueranker.com/?p=10666
- NS-Z (low): Nerdschalk, Plasmified Zango, https://nerdschalk.com/silksong-plasmified-zango-location-map-requirements-rewards-and-more/
