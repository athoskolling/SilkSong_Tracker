# Phase 3: data gaps after Acts 1 to 3 (orchestrator's research, 2026-10-20)

**Why this exists.** Athos approved Acts 1 to 3 as they are on `main` (`dataVersion` 9, 195 entries, 28 Regions) and asked for the gaps to be filled (since then the Build fields batch raised `data/` to `dataVersion` 10, with the same 195 entries; everything below was checked against 10). The Act 3 data build left three `A2:` placeholders without an entry (the Silk and Soul trigger, Forebrothers Signis & Gron, the Egg of Flealia) and dropped those requirements; the Act 2 and Act 3 sheets also deferred or named things nobody wrote down. This sheet fills them, in the format of `docs/PHASE-3-ACT-2.md` and `docs/PHASE-3-ACT-3.md`. **Research, not data: nothing here is in `data/`.** Ids are permanent once published (ADR 0003), so Athos approves the id list first.

**Spoiler warning:** names the last bosses, every Ending and how each is reached.

## How this was researched, and its limit

- **Web search results only.** No guide page was opened. The task allowed one fetch of a guide page; it was not used, because every earlier session's fetch of game-checklists.com failed (`getaddrinfo ENOTFOUND`) and the search snippets were enough to decide each row. hollowknight.wiki and Fextralife were never fetched; wiki text quoted inside a search result is marked `wiki`. MapGenie was not used. **No facts from memory:** where the results say nothing, the cell says "not found".
- **Marks.** After each fact, the codes of the sources that said it (list at the end). **One code = one source = unconfirmed.** "Conflict" gives both readings. `low` marks copied or thin sites (forum mirrors, Acer posts); they never decide a conflict.
- **Steps.** `data/items.json` uses every ten from 620 to 1350 (the 74 Act 2 entries), so a new Act 2 row either takes a free five between two tens or a ten from 1360 to 1990, which are all free (Act 3 starts at 2000). Every step below was checked against the 195 steps in `data/` (section "Checks on this sheet").
- **`source` on each new entry** is the first non-wiki, non-`low` page in its row (Athos may swap it for the main wiki page when he checks the entry, as for Acts 1 to 3).

## What `data/` holds today (read from `data/items.json`, `dataVersion` 10)

| Counted type | In `data/` | Game total in the sources | Gap closed here |
|---|---|---|---|
| Mask Shards | 19 | 20 [GBT-MS, AT-MS, NL-MS] | `mask-shard-savage-beastfly` (section 4) |
| Silk Skills | 5 | 6 [GBT-SS] | `pale-nails` (section 5) |
| Tool Pouch upgrades | 3 | 4 [wiki "four times", NL-WISH] | `tool-pouch-nuu` (section 5) |
| Tools (counted) | 51 | 51 [wiki, TGP, NC-100] | `egg-of-flealia` makes 52: **conflict**, see section 1 |
| Spool Fragments, Silk Hearts, Needle upgrades, Crafting Kits, Crests, abilities, Everbloom, Sylphsong | 18, 3, 4, 4, 6 counted + Hunter, 6, 1, 1 | same | nothing missing found |

Tasks today: 32 (18 fights, 6 keys, 7 quests, Elegy of the Deep). `endings.json` is `[]`.

## 1. Egg of Flealia and Forebrothers Signis & Gron

| step | id (proposed) | Name | Kind, type | Region (Sub-area) | requires | how (our words) | Sources |
|---|---|---|---|---|---|---|---|
| 965 | `forebrothers-signis-and-gron` | Forebrothers Signis & Gron | T, boss | Deep Docks | `simple-key`, `clawline` | Open the locked door under the Forge Daughter's shop with a Simple Key, hang on the Clawline hook to raise the gate, use the lever bridge and head left to a lava arena. Beat both brothers. This opens the way down to the old diving bell. It can wait until Act 3, where it is harder. | Location and Clawline hook: wiki, DG-FSG, NL-BOSS. Simple Key door under the Forge Daughter: NL-BOSS, DG-FSG. Act 2 or 3, needed for the diving bell: NL-BOSS, wiki |
| 1370 | `egg-of-flealia` | Egg of Flealia | C, tool | Putrified Ducts (Fleatopia) | `tool-pouch-fleatopia` | Fleamaster Mooshka's last reward: rescue every lost flea and come back to the Flea Caravan in Fleatopia. It lowers the Silk cost of Silk Skills while your health is full, and it opens the Festival of the Flea in Act 3. | All fleas, Mooshka: wiki, GC-FL, NC-FL. In Fleatopia: GC-FL, wiki (Festival). Effect: GC-FL, NC-FL. **Conflict on the number:** 30 [GC-FL, NC-FL, NL-FL, WAP] versus 29 [one guide, sheet 1] |

Why these choices:

- **Forebrothers is a Task:** a fight that opens the way to the diving bell, which the Act 3 gate needs (Act 1 decision 5: a Task when something else needs it). Not `missable`: it can be done in Act 2 or Act 3 [NL-BOSS].
- **Its Simple Key.** The door "under the Forge Daughter's shop" [NL-BOSS] and the Flintslate gate "on the way towards Far Fields" (`flintslate`, Act 1) are, in our reading, **the same Deep Docks door**: the sources name four Simple Key doors and only one in the Deep Docks, "the room connecting Deep Docks and Far Fields near the Forge Daughter" [PCG-SK, SK-SK]. So it requires `simple-key`, the key the Route already spends on that door (Act 2 decision 5), and no new key. If Athos finds two separate doors, the Route is one key short and decision 5 must be redone.
- **Clawline** is in every source; anything else the route needs is cut off in the snippets [DG-FSG]. Step 965 puts it right after the other Clawline trip into the Deep Docks (`spool-fragment-deep-docks-southeast`, 960).
- **The Egg is an Act 2 entry, not Act 3.** No source found says a flea needs Silk Soar; the one search that named the last two fleas put them in the Deep Docks and the Wormways [WAP, a video guide]. One summary said "the last batch is in the Abyss" (single, unsourced): not used. What is Act 3 is the Festival of the Flea wish, which needs the Egg and Silk Soar [wiki]; `pale-steel-needle` already requires `silk-soar`. Fleas are not entries, so "every flea" cannot be a `requires` (like "25 Tools", Act 2 decision 7): the Egg requires the caravan's move to Fleatopia (`tool-pouch-fleatopia`), says "every flea" in `how`, and sits at the end of Act 2 so the Regions with fleas come first.
- **The Egg counts** as a Tool toward 100 percent [CH, GC-FL]. **Conflict:** the game has 51 Tools [wiki, TGP, NC-100], and `data/` already has 51 counted Tools without the Egg. So either one entry in `data/` is not a Tool, or a Tool is doubled. Sheet 1 already found 52 names for 51; Nintendo Life's Tools list leaves out the Snare Setter as "temporary" [NL-T in the Act 3 sheet], but game-checklists' 100 percent list includes it [GC-100]. **Athos checks his in-game Tools screen**; the fix is `counts: false` on whichever entry is not counted, with no id change. Until then the Egg goes in counted (two sources), and the Tools count reads 52. `toolColor`: not found, left out.

## 2. What makes Silk and Soul appear

**The conflict** (Act 3 sheet, question 9): "every wish" [DX-A3] versus the three wishboards [AC-A3 low, II-A3]; fleas 20, 25 or "more than half"; the Bellhome; the Threefold Melody.

**Best-supported reading: a points threshold.** The wiki's Silk and Soul page (snippets, three searches) says the wish unlocks at **17 Quest Points out of 25**: 22 from ordinary wishes (some worth half a point) and 3 from six delivery wishes, which count only the first time; the point for one Needle wish comes with the second Needle upgrade even if the wish was missed [wiki]. PlayNews gives the same "17 of 25" [PNG]. The guides' lists (every wish on the Bone Bottom, Bellhart and Songclave boards; the caravan in the Putrified Ducts; a Bellhome) read as ways players reached 17, written before the rule was known; the wiki's own draft page, which listed them as conditions, is marked "lots of unknowns" [wiki (user draft)]. Several guides also name **Lace beaten in The Cradle** (after the Threefold Melody) [II-A3, DG-A3, A3G, PNG]. Once unlocked, the wish is on the Bellhart Wishwall or from the Caretaker in Songclave [wiki, PNG].

**How to write it.** "17 of 25 points" cannot be a `requires` (the same problem as "25 Tools", Act 2 decision 7). So: Silk and Soul keeps its late step (2000, after every Act 2 entry, so the Route puts the wishes first), its `how` says "17 wish points", and `requires` lists the existing entries the sources tie to it by name. That gate is conservative (Act 1 decision 6): a player who reached 17 points without one of them sees the wish Locked a little longer, and can still mark it done.

| id (existing) | Why it is in `silk-and-soul`'s `requires` | Sources |
|---|---|---|
| `snare-setter` | already there: one of the four things the Caretaker needs | DG-A3, DST, PCG-A3 (Act 3 sheet) |
| `lace-cradle` | Lace beaten in The Cradle after the Threefold Melody | II-A3, DG-A3, A3G; PNG too, but its lists also contain wrong names (a "Silkspear melody"), so it only supports |
| `tool-pouch-fleatopia` | the caravan settled in the Putrified Ducts (Mooshka's reward for that move) | A3G, NC-A3pre, PG-L, wiki (user draft), HGG-SS. The flea number conflicts (20, 22, 23 to 25, 25); the entry stands for the move, not a number |
| `bellhome-key` | the Resident wish (a Bellhome from Pavo) | A3G, NC-100 (Act 3 sheet), wiki (Bellhart Wishwall table: "prerequisite for Silk and Soul"), PG-L |
| `throwing-ring` | Shakra's Trail's End wish, which several guides call easy to miss before Silk and Soul | A3G, wiki (Bellhart Wishwall table: "prerequisite for Silk and Soul") |

**One side effect to know.** `bellhome-key` is off the Route today (only the four furnishings require it). Once `silk-and-soul` requires it, `routeIds` puts it on the Route (it is needed by an entry on the Route), so it becomes a Step and can be "Next on the route". The furnishings stay off. This is the Route rule working as designed (contract section 1).

**Not used:** "every wish" [DX-A3] (the points rule says otherwise), the three wishboards as a hard rule, any flea number, and a "Clock Tower Key" and "22 bells" from one guide that also names places that do not exist [PNG second list; flagged by the search itself].

New `how` for `silk-and-soul` (281 characters): "Appears on the Bellhart Wishwall, or from the Caretaker in Songclave, once you have 17 wish points; most Act 2 wishes give one. Bring the Caretaker three souls (Maiden's in Bone Bottom, Hermit's below the Bellhart Bellway, Seeker's by the top Bilewater bench) and the Snare Setter."

Also: `grand-mother-silk-snared` gains `lace-cradle` (Lace "opens the rest of The Cradle", `lace-cradle`'s own `how`; Grand Mother Silk is at its top [wiki, NB-WQ]). It already has it through `silk-and-soul` now, but writing it keeps the fight right if Athos strikes `lace-cradle` from the wish.

## 3. Act 2 fights and wishes missing from `data/`

| step | id (proposed) | Name | Kind, type | Region (Sub-area) | requires | how (our words) | missable, note | Sources |
|---|---|---|---|---|---|---|---|---|
| 652 | `pilgrims-rest-supplies` | Pilgrim's Rest Supplies | T, quest | Far Fields (Pilgrim's Rest) | `my-missing-courier`, `fourth-chorus`, `last-judge` | A delivery wish from the couriers Tipp and Pill in Bellhart: carry the Courier's Swag to Mort in Pilgrim's Rest without breaking it (hits, hard landings and fast travel damage or destroy it). Mort pays 180 Rosaries. | yes: "Not offered once Act 3 begins." | Delivery to Mort, 180, gone in Act 3: wiki. Act 2 only: PG-L, NC-A3pre. Couriers offer deliveries after their rescue wish: wiki |
| 865 | `garmond-and-zaza-duel` | Garmond and Zaza, duel | T, boss | Choral Chambers (Songclave) | `vaultkeepers-melody`, `clawline` | They wait on a platform right of the Songclave, reached through the top right of the Whispering Vaults' main room. Help them with a wave of foes, then talk to Garmond to start a friendly duel. No item; it adds their Journal entry. | yes: "Act 2 only. One guide says they also leave for good if they move into the Songclave." | DG-GZ, VAN, GB-GZ (Clawline route), wiki (optional, Act 2). **Conflict on the place:** a hidden room below the Songclave in the Whispering Vaults [NL-BOSS] |
| 1360 | `shakra-duel` | Shakra, duel | T, boss | Greymoor | `throwing-ring` | After Trail's End, hit the pole holding a ring in Greymoor to call Shakra for a duel. No item; it adds her Journal entry. | yes: "Shakra no longer duels once Act 3 begins." | wiki (Greymoor, Act 2, no reward), PG-L, NC-A3pre |
| 1390 | `grand-mother-silk-bind` | Grand Mother Silk, Bind | T, boss | The Cradle | `lace-cradle` | Past Lace, at the top of The Cradle, fight Grand Mother Silk while not cursed and Bind her at the end: the Weaver Queen Ending. The save then reloads at the last Cradle bench, so the other fights stay open. | yes: "Lost once Act 3 begins: the Snared Silk Ending closes this fight for the run." | wiki, NB-WQ, GG-E, NL-E |
| 1400 | `rite-of-rebirth` | Rite of Rebirth | T, quest | Shellwood | `pollip-pouch`, `clawline`, `cogwork-dancers` | Take the Twisted Bud from a hidden room in Bilewater, reached through the east end of the Whispering Vaults, and give it to Greyroot in Shellwood after the Pollip wish. You are cursed: no healing, and your Crest, Tools and Skills are taken until it is lifted. | no (the curse can also be taken in Act 3 [wiki]) | wiki, GG-TB, NC-TB, SK-RR, DG-RR |
| 1410 | `grand-mother-silk-cursed` | Grand Mother Silk, cursed | T, boss | The Cradle | `rite-of-rebirth`, `lace-cradle` | While still cursed, and before Silk and Soul, beat Grand Mother Silk at the top of The Cradle: the Twisted Child Ending. You cannot heal. The save reloads at the last Cradle bench; then lift the curse for the Witch Crest. | yes: "Lost once Act 3 begins, and once the curse is lifted (Witch Crest)." | wiki, NL-E, PG-L. **Conflict:** GG-E says the curse must be lifted first; the wiki says it must not be. Two against one: the wiki's reading |

**Not new entries:**

- **Threefold Melody.** It is the three melody Tasks already in `data/` (`vaultkeepers-melody`, `architects-melody`, `conductors-melody`), which The Cradle requires; playing it in the Cogwork Dancers' room is in `lace-cradle`'s `how` [GS, NL-A3, PNG]. No wish of that name was found.
- **Lace's second fight** is `lace-cradle`. Sources count three Lace fights: Deep Docks (`lace`), The Cradle (`lace-cradle`) and Lost Lace in Act 3 (`lost-lace`) [RR-B]. Nothing missing.

**Why the two duels are Tasks at all.** Act 1 decision 5 keeps a Task only when it opens something. These duels open nothing (a Journal entry each; the journal achievements do not need them [AT-HJ, NC-HM, wiki]). They are proposed anyway because they are lost at the Act 3 gate, and a max-completion guide should warn in time: `missable: true` is what keeps them on the Route at the right moment (contract section 1, "On the Route or not"). If Athos does not want Journal-only fights, drop both rows; nothing requires them. DG-GZ adds that the duel is "likely necessary" for the Hero's Call wish (`heros-memento`); one source and hedged, so `heros-memento` does not require it.

**Route order at the end of Act 2.** The safe order that keeps every Ending (Act 3 sheet, "Choice points"): **Bind first** (Weaver Queen; reload), **then the curse** (Rite of Rebirth), **the cursed fight** (Twisted Child; reload), **then lift the curse** (Witch Crest), then Silk and Soul (2000). Binding first means the player is never asked to fight uncursed while cursed, and the cursed stretch (no healing, gear taken [wiki]) is as short as the game allows. That needs one existing entry to move (below).

**Existing entries that change for this:**

| id | Change | Why |
|---|---|---|
| `witch-crest` | `step` 1280 to **1420**; `requires` becomes `["rite-of-rebirth"]` (its three ids move to `rite-of-rebirth`); `regionId` `bellhart` to **`greymoor`**; new `how` and `missableNote` (below) | Its step must come after the cursed fight, or "Next on the route" lifts the curse first and loses Ending 3. **Data fix:** Yarnaby, who lifts the curse, is in Greymoor (top left, "Yarnaby's Bellhome"), not Bellhart [wiki, BYD-YA, SK-RR, AT-IO]. The id does not change, so saved Progress is safe (ADR 0003) |
| `grand-mother-silk-snared` | `requires` adds `lace-cradle` | section 2 |
| `ascendants-grip` | nothing (already `missable`) | |

`witch-crest` new `how` (271 characters): "Infestation Operation: while cursed, visit Yarnaby at the top left of Greymoor, buy Steel Spines from Crull and Benjin in the Sinner's Road jail (260 Rosaries in most guides, 160 in one) and bring them to her. The curse lifts and the Cursed Crest becomes the Witch Crest."
New `missableNote`: "Lifting the curse locks out the Twisted Child ending, so do the cursed Grand Mother Silk fight first. The Crest itself is not lost: the wish can still be done in Act 3."
Sources: AT-IO, SK-RR, DG-IO, wiki (Act 3: Crull and Benjin are gone and the spines are free; finishing it still closes Twisted Child).

**Missable at the Act 3 gate, in `data/` after this batch:** `ascendants-grip` (already), `pilgrims-rest-supplies`, `garmond-and-zaza-duel`, `shakra-duel`, `grand-mother-silk-bind`, `grand-mother-silk-cursed`, all with the notes above. Still open from earlier sheets and **not** changed here: Pebb's wares in Act 3 (Act 3 sheet Q5; this session found nothing new), `fractured-mask` (Phase 5 sheet 2, section 3.5). One source says the Twisted Child is the only achievement lost in Act 3 [VAN].

## 4. The 20th Mask Shard and Mount Fay

| step | id (proposed) | Name | Kind, type | Region | requires | how (our words) | Sources |
|---|---|---|---|---|---|---|---|
| 825 | `mask-shard-savage-beastfly` | Mask Shard, Savage Beastfly | C, mask-shard | Bellhart | `savage-beastfly`, `cogwork-dancers` | Savage Beastfly, an Act 2 Grand Hunt on the Bellhart Wishwall: track it by its shed shell to the Far Fields arena where the Fourth Chorus fell, beat it and bring its Horn Fragment back to the Wishwall. | wiki, NL-WISH, NC-SB, GC-100 (search snippet "Bellhart, Savage Beastfly quest"). Act 2: NC-SB. Gate: after the Chapel of the Beast fight and the Cogwork Dancers [NC-SB, forum low] or after Restoration of Bellhart [AT-MS] |

- **Why this is the missing one.** The sources agree on 16 Mask Shards before Act 3 and 4 in Act 3 [NL-MS, AT-MS]. `data/` has 15 before Act 3 (6 Act 1, 9 Act 2) and the 4 Act 3 ones, so one Act 1 or 2 shard is missing. The Act 2 sheet deferred "Bellhart's two Mask Shards (Savage Beastfly's Grand Hunt and another)" to Act 3, and the Act 3 sheet placed only The Hidden Hunter and Dark Hearts in Bellhart, so the Savage Beastfly hunt fell between the two. It is game-checklists' "Mask Shard 7" [GC-100 snippet], which is also the number missing from the Act 1 and 2 rows' GC numbering.
- **Region Bellhart**, like `mask-shard-hidden-hunter`: the shard is handed over at the Wishwall; the fight is in Far Fields. **Gate:** `savage-beastfly` (the first fight, Hunter's March) and `cogwork-dancers` (conservative; "Restoration of Bellhart" is a donation wish that is not an entry, section 7). Step 825 groups it with the other Act 2 Bellhart visit (`shining-needle`, 820).
- **No second Mount Fay shard is missing.** Mount Fay has two: the Act 2 one near the western bench with the double jump (`mask-shard-mount-fay`) [GC-100, PM low, SK-MS] and the Act 3 one reached with Silk Soar from a platform in icy water (`mask-shard-brightvein`) [GC-100 "Mask Shard 20, Mount Fay, Brightvein", NL-MS]. The Act 3 sheet's question 11 ("Brightvein as 20 or another Mount Fay shard as 17") is the same shard numbered differently: NL-MS's Silk Soar route matches Brightvein's `how` (our reading). With the Savage Beastfly shard the total is 20.

## 5. Other Act 2 deferrals

| step | id (proposed) | Name | Kind, type | Region (Sub-area) | requires | how (our words) | Sources |
|---|---|---|---|---|---|---|---|
| 1255 | `simple-key-sands-of-karak` | Simple Key, Sands of Karak | T, key | Sands of Karak | | On a corpse by the bench at the eastern tip of the Sands of Karak. Any Simple Key opens any locked door; the guide spends this one on the Green Prince's cell in Sinner's Road, which leads to Lost Verdania in Act 3. | DG-SK, GG-SK (corpse at the eastern bench); NC-GP, PCG-VER, wiki (the cell, any key) |
| 1380 | `tool-pouch-nuu` | Tool Pouch upgrade, Nuu | C, tool-pouch-upgrade | Greymoor (Halfway Home) | | Nuu's wish, Bugs of Pharloom: record 100 different foes in the Hunter's Journal she gave you, then go back to her at Halfway Home in Greymoor. | NL-WISH, II-W, wiki (Tool Pouch page), FD-TP low. Act 1 sheet had "a full Hunter's Journal": corrected, 100 entries |
| 2135 | `pale-nails` | Pale Nails | C, silk-skill | The Cradle | `silk-soar` | In Act 3 the lift to The Cradle no longer works: from the upper right hall of the Choral Chambers, Silk Soar up through the ruined Cogwork Core into The Cradle. Climb to Grand Mother Silk's old arena and bind her severed arm. | NL-SK, GBT-SS, FB-SS, wiki (The Cradle: the Act 3 way in) |

- **The Sands of Karak key is a Task**, like the other three Simple Keys (Athos's answer 1 on the Act 2 sheet). It completes Act 2 decision 5's pairing: four keys, four doors.
- **What it opens.** The Green Prince is freed from his cell in Sinner's Road with any Simple Key, met twice in the Citadel, and in Act 3 that opens Lost Verdania at the right wall of Craw Lake [NC-GP, PCG-VER, wiki]. `conjoined-heart` (the Clover Dancers, in Lost Verdania) therefore gains `simple-key-sands-of-karak` in its `requires`, and its `how` gains the Green Prince (below). Freeing him opens only that, so it folds into the key (Act 1 decision 5). The key is a Task, so it is on the Route even though `conjoined-heart` is off it (contract section 8 accepts that case).
- **Nuu's upgrade** has no `requires` beyond Greymoor's: "100 Journal entries" is a count, not an id. Step 1380 puts it at the end of Act 2, when most foes have been met.
- **Pale Nails** is Act 3 (Silk Soar) [NL-SK, GBT-SS]. The Cradle's own gate (the three melodies) still applies through its Region.

`conjoined-heart` new `how` (283 characters): "Free the Green Prince from his Sinner's Road cell with a Simple Key and meet him twice in the Citadel. In Act 3 play the Elegy of the Deep at the right wall of Craw Lake, clear 12 orbs in a row in Lost Verdania and beat the Clover Dancers. Their heart can stand in for one Old Heart."

## 6. The four Endings

Four Endings (Athos, 2026-10-20). Every condition below is a Task that exists after this batch, so all are on the Route and validator rule 14 stays silent.

| Ending id | name | conditions | locksOut | What reaches it (our words) | Sources |
|---|---|---|---|---|---|
| `weaver-queen` | Weaver Queen | `["grand-mother-silk-bind"]` | `[]` | Beat Grand Mother Silk and Bind her, without having reached Snared Silk. The save reloads at the last Cradle bench. | wiki, NB-WQ, GG-E |
| `twisted-child` | Twisted Child | `["grand-mother-silk-cursed"]` | `[]` | Beat Grand Mother Silk while cursed by the Rite of Rebirth, with the curse not yet lifted and Snared Silk not reached. Same reload. | wiki, NL-E. Conflict GG-E (see section 3) |
| `snared-silk` | Snared Silk | `["grand-mother-silk-snared"]` | `["weaver-queen", "twisted-child"]` | After Silk and Soul, play the Needolin at the end of the fight instead of Binding her. Reloading starts Act 3. | wiki, DG-E, NL-E, NL-A3 |
| `sister-of-the-void` | Sister of the Void | `["lost-lace"]` | `[]` | With the Everbloom, make the last dive and beat Lost Lace in the Abyss. Reload at the last Abyss bench. | wiki, DG-E, NL-E |

`source` for each: the first non-wiki code (NB-WQ, NL-E, DG-E, DG-E). The ending ids collide with no entry or Region id (checked). `rite-of-rebirth` is not listed in `twisted-child`'s conditions: it is already a requirement of the fight, and a condition is the moment the Ending is reached.

### Choice points

1. **The Act 3 gate** (`grand-mother-silk-snared`): Weaver Queen and Twisted Child are gone for the run [wiki, NL-A3]. The existing `locksOut` field says it.
2. **Lifting the curse** (`witch-crest`, Infestation Operation): Twisted Child is gone [wiki]. `locksOut` cannot say this: it links an Ending to Endings, and here an **entry** closes an Ending.
3. **Entering Act 3 without the curse** [NL-E]: the same point as 1.

### How the Route shows a choice (open contract question, section 8)

- **A. Order and notes (no contract change).** The Route already puts the steps in the safe order (section 3), the two fights are `missable` with notes, and `witch-crest`'s note says "do the cursed fight first". Cost: nothing machine-readable, so no "Choice point" marker and no Ending screen can say "lost".
- **B. One optional field on an Ending, `lostWhen: string[]`** (entry ids; the Ending can no longer be reached once any of them is done). `twisted-child`: `["witch-crest", "grand-mother-silk-snared"]`; `weaver-queen`: `["grand-mother-silk-snared"]`. The Route shows "Choice point" on any entry named in some `lostWhen`, worked out in one place. A pure `endingStatus(endingId, doneSet, endings)` -> `'reached' | 'open' | 'lost'` follows with the Ending screen. Validator: ids exist and are entries; an Ending never lists its own conditions. `locksOut` stays as the Ending-to-Ending summary.
- **C. The same link on entries (`locksOutEndings`).** Equivalent to B but spreads Ending rules over `items.json`. Not recommended.

**Recommendation: A now, B when the Ending screen is built** (unchanged from the Act 3 sheet; nothing found since argues otherwise). A ships with this batch and needs no code.

### What the contract must change now (orchestrator's job, after Athos approves)

1. **Section 1, `endings.json`:** "in V1 `endings` is an empty array" becomes "the four Endings ship with the gaps batch; V1 still builds no Ending screen". Nothing in the interface reads `endings` beyond loading it (`js/data.js`), so no page changes. The validator already checks Endings (rules 3, 9, 11 and 14).
2. **Section 8, "how a step that depends on a player choice is represented":** answered with A for now (order and `missable` notes); B recorded as the plan for the Ending screen.
3. Nothing else: no new field, no signature change.

## 7. Shell Shards

**What the sources say.**

- **Nothing in a shop is priced in Shell Shards.** Every shop price found in any session is in Rosaries (Phase 5 sheet 2, section 3); the Shard Bundle is bought *with* Rosaries (50) and gives 80 Shell Shards [sheet 2: G8-FD, SR-V; wiki].
- **No wish pays Shell Shards** [wiki, two searches]. Shell Shards come from foes, shard deposits (20 each), Shard Bundles, Beast Shards and Pristine Cores [wiki]: all consumables, none an entry.
- **Shell Shards are spent on three wishes**, the Bone Bottom donation wishes, and on making and refilling Tools (a running cost, not tracked):

| step | id (proposed) | Name | Kind, type | Region (Sub-area) | requires | Shell Shards | how (our words) | Sources |
|---|---|---|---|---|---|---|---|---|
| 185 | `bone-bottom-repairs` | Bone Bottom Repairs | T, quest | Moss Grotto (Bone Bottom) | | 200 | A donation wish on the Bone Bottom Wishwall: give 200 Shell Shards to repair the camp. More wishes appear on the board afterwards. | wiki (Shell Shard page and wish page), NL-WISH, NC-W, SEL, DG-BB |
| 187 | `a-lifesaving-bridge` | A Lifesaving Bridge | T, quest | Moss Grotto (Bone Bottom) | `bone-bottom-repairs` | 300 | A donation wish on the Bone Bottom Wishwall: 300 Shell Shards build a bridge over the hole down to the lower Moss Grotto. | wiki, NL-WISH, NC-W. Its gate (after the repairs) rests on "more wishes appear" [NL-WISH, DG-BB] |
| 655 | `an-icon-of-hope` | An Icon of Hope | T, quest | Moss Grotto (Bone Bottom) | `a-lifesaving-bridge`, `last-judge` | 440 | A donation wish that appears on the Bone Bottom Wishwall once you have entered the Citadel: 440 Shell Shards raise a statue by the lift to Mosshome and earn the Hornet Statuette. | wiki (after the Citadel and the bridge), NL-WISH, NC-W |

Rewards: more wishes, a bridge, and a Hornet Statuette (whether the Statuette is a Bellhome trophy that sheet 2 missed is **not found**; it is folded into the Task). They are Tasks because the player does them. They also earn Silk and Soul points (Bone Bottom board), so they belong on the Route.

**Proposal: Shell Shards "like the Rosaries", as small as it can honestly be.**

1. **One optional field on entries, `shardPrice`** (integer, 1 or more): the Shell Shards the player hands over for this entry. Marking the entry done means "paid". Only the three wishes above carry it.
2. **One pure function in `requirements.js`, `shellShardsToSpend(doneSet, items, regions)`**, with exactly the shape of `rosariesToSpend` (`{ total, available, ids }`) but reading `shardPrice`. Owner Dev A; tests by QA 1 mirror the `rosariesToSpend` ones.
3. **The Rosaries page** gets one short line under its Rosaries panel, "Shell Shards still to spend: 940" (with the Available part), listing the three wishes with their Shard price. No panel, no number the player types (Athos: "like the Rosaries"). Owner Dev B.
4. **Drop the provisional `shellShards` Progress field** (contract sections 1, 3 and 8; ADR 0006). It was never built: `js/progress.js` only mentions it in two comments, and `firestore.rules` already refuses it. The contracted `tookShellShards` key of `importProgress`'s result goes with it.
5. Validator rule 11: `shardPrice`, when given, is an integer of 1 or more.

**Why a new field and not `price` plus a `currency`.** The contract foresaw a `currency` field "only if a shop entry priced in Shell Shards turns up". None did; what turned up are three donation wishes. More important, `rosariesToSpend` and the Rosaries page (`js/rosaries-page.js`) read every integer `price` as Rosaries today. A `price` of 440 with `currency: "shell-shards"` would be added to the Rosaries total by the code already live until both were changed, in the right merge order. A separate field cannot be misread by existing code.

**What the page cannot show:** how many Shell Shards the player has. Nothing in the data earns them (foes and deposits are not entries), so a derived "you have" number would be invented. "To spend" is the honest version.

**The same gap on the Rosaries side (for Athos; not in the brief unless he says so).** Four donation wishes take Rosaries and are not in `data/`, so "Rosaries still to spend" is short by up to 1450: Restoration of Bellhart 250, Bellhart's Glory 400 (after Act 1), Building Up Songclave 300, Strengthening Songclave 500 [DES-W; the wiki snippets give the two Songclave sums without naming the currency, so those two are single-source]. They would be Tasks with `price`, and `bellhome-key` (whose `how` already says "finish the Bellhart donation wishes") and `reserve-bind` (which needs Building Up Songclave) would require them. Recommendation: a later, separate mini-batch once Athos confirms the Songclave currency in game.

## 8. Brief for Dev C: the gaps into `data/` (do not hand out yet)

- **Hand out only when:** Athos approves the id list and answers the open questions he wants answered first (Handoff below); the orchestrator updates `.claude/rules/data.md` to name this sheet as the current batch, and, if Athos takes section 7, writes the contract change (`shardPrice`) **and** Dev A's `shellShardsToSpend` is merged first (a validator that does not know `shardPrice` ignores it, so the order is safe either way, but the page needs the function). Block B below waits for that; blocks A and C do not.
- **Files (Dev C owns them for this task):** `data/items.json`, `data/endings.json`, `data/regions.json` (only to raise `dataVersion`). Nothing else.
- **Rules:** `dataVersion` 10 to **11** in all three files (or +1 from whatever `data/` holds then). Rows exactly as in sections 1, 3, 4, 5 and 7: id, name, `kind`, `type`, `regionId`, `area` (the Sub-area in brackets), `requires`, `step`, `how` as written (each under 300 characters), `missable` and `missableNote` only where section 3 says yes. `source` = the URL of the first code in the row's Sources that is not `wiki` or `low`. No `spoiler`, `unlocks`, `counts`, `price`, `toolColor` or Build fields on new rows. Do not add, drop or merge rows; a row that looks wrong is kept and named in the handoff.

**Block A: new entries (12), in this order of steps**

| step | id | kind | type | regionId | area | requires | missable |
|---|---|---|---|---|---|---|---|
| 652 | `pilgrims-rest-supplies` | task | quest | `far-fields` | Pilgrim's Rest | `my-missing-courier`, `fourth-chorus`, `last-judge` | yes |
| 825 | `mask-shard-savage-beastfly` | collectible | mask-shard | `bellhart` | | `savage-beastfly`, `cogwork-dancers` | |
| 865 | `garmond-and-zaza-duel` | task | boss | `choral-chambers` | Songclave | `vaultkeepers-melody`, `clawline` | yes |
| 965 | `forebrothers-signis-and-gron` | task | boss | `deep-docks` | | `simple-key`, `clawline` | |
| 1255 | `simple-key-sands-of-karak` | task | key | `sands-of-karak` | | | |
| 1360 | `shakra-duel` | task | boss | `greymoor` | | `throwing-ring` | yes |
| 1370 | `egg-of-flealia` | collectible | tool | `putrified-ducts` | Fleatopia | `tool-pouch-fleatopia` | |
| 1380 | `tool-pouch-nuu` | collectible | tool-pouch-upgrade | `greymoor` | Halfway Home | | |
| 1390 | `grand-mother-silk-bind` | task | boss | `the-cradle` | | `lace-cradle` | yes |
| 1400 | `rite-of-rebirth` | task | quest | `shellwood` | | `pollip-pouch`, `clawline`, `cogwork-dancers` | |
| 1410 | `grand-mother-silk-cursed` | task | boss | `the-cradle` | | `rite-of-rebirth`, `lace-cradle` | yes |
| 2135 | `pale-nails` | collectible | silk-skill | `the-cradle` | | `silk-soar` | |

**Block B: Shell Shard wishes (3), only if Athos takes section 7 and the contract has `shardPrice`**

| step | id | kind | type | regionId | area | requires | shardPrice |
|---|---|---|---|---|---|---|---|
| 185 | `bone-bottom-repairs` | task | quest | `moss-grotto` | Bone Bottom | | 200 |
| 187 | `a-lifesaving-bridge` | task | quest | `moss-grotto` | Bone Bottom | `bone-bottom-repairs` | 300 |
| 655 | `an-icon-of-hope` | task | quest | `moss-grotto` | Bone Bottom | `a-lifesaving-bridge`, `last-judge` | 440 |

**Block C: changes to existing entries (8) and the Endings**

| id | Field | From | To |
|---|---|---|---|
| `silk-and-soul` | `requires` | `["snare-setter"]` | `["snare-setter", "lace-cradle", "tool-pouch-fleatopia", "bellhome-key", "throwing-ring"]` |
| `silk-and-soul` | `how` | current | section 2 text |
| `grand-mother-silk-snared` | `requires` | `["silk-and-soul"]` | `["silk-and-soul", "lace-cradle"]` |
| `diving-bell-key` | `requires` | `["grand-mother-silk-snared"]` | `["grand-mother-silk-snared", "forebrothers-signis-and-gron"]` |
| `pale-steel-needle` | `requires` | `["silk-soar", "hivesteel-needle"]` | `["silk-soar", "hivesteel-needle", "egg-of-flealia"]` |
| `witch-crest` | `step`, `regionId`, `requires`, `how`, `missableNote` | 1280, `bellhart`, `["pollip-pouch", "clawline", "cogwork-dancers"]`, current, current | 1420, `greymoor`, `["rite-of-rebirth"]`, section 3 texts |
| `conjoined-heart` | `requires`, `how` | `["elegy-of-the-deep"]`, current | `["elegy-of-the-deep", "simple-key-sands-of-karak"]`, section 5 text |
| `passing-of-the-age` | `how` | ends with "**Only if Athos keeps it** (Endings plan, question E2)." | the same text **without** that sentence (a sheet note copied into data by mistake; it shows on the site) |
| `endings.json` | `endings` | `[]` | the four records of section 6 (`id`, `name`, `conditions`, `locksOut`, `source`) |

- **Done when:** `node scripts/validate-data.js` passes with 0 errors and 0 warnings (no new type; rule 14 silent because every condition is a Task); `node --test "tests/*.test.js"` passes; following "Next on the route" from an empty Progress reaches every entry on the Route in step order, with `grand-mother-silk-bind`, `rite-of-rebirth`, `grand-mother-silk-cursed`, `witch-crest` in that order before `silk-and-soul`, and `lost-lace` last; served locally, Home's "Collectibles by type" shows Mask Shards 20, Silk Skills 6, Tool Pouch upgrades 4 and Tools 52 (the Tools number is the open conflict of section 1, say so), and the four pages load with no console errors. The handoff lists every new id, the Region totals that moved (counted, from `regionProgress`: Bellhart 11 stays 11, because it loses the Witch Crest and gains the Savage Beastfly shard; Greymoor 6 to 8; The Cradle 1 to 2; Putrified Ducts 3 to 4), and any row Dev C doubts.
- **Not pushed to `main`** until Athos approves the id list (ADR 0003).

## Checks on this sheet (orchestrator, 2026-10-20)

- **Structure, run with the real tools.** A throwaway script (session scratchpad, outside the repository) parsed this sheet's tables, built two copies of today's `data/` with the changes applied (A = blocks A and C plus the four Endings; AB = the same plus block B), on top of `dataVersion` 10 (so 11), placeholder `source` links. Run a second time after the Build fields batch landed in `data/` during this session; same results. Every new step is free in `data/` and no new id collides with an entry, Region or Ending id.
  - `node scripts/validate-data.js` on both: **passed, 0 warnings** (rule 14 silent; `shardPrice` is ignored by today's validator, as unknown fields are).
  - `js/requirements.js`: following `nextStep` from an empty Progress reaches every entry on the Route **in step order** (A: 168 of 207 entries on the Route; AB: 171 of 210), with `grand-mother-silk-bind`, `rite-of-rebirth`, `grand-mother-silk-cursed`, `witch-crest`, `silk-and-soul`, `grand-mother-silk-snared` in that order and `lost-lace` last. Today's `data/`: 155 of 195.
  - `routeIds`: `bellhome-key` and `simple-key-sands-of-karak` join the Route; `conjoined-heart` and the furnishings stay off.
  - Counted Collectibles: 121 today, **125** after (Mask Shards 20, Silk Skills 6, Tool Pouch upgrades 4, Tools 52). Tasks 32 to 40 (43 with block B). `rosariesToSpend` is unchanged (14,100 over 44 priced entries); the three `shardPrice` entries sum to 940.
  - Every `how`, new or changed, is under 300 characters (longest 283).
- This proves the sheet is consistent with the contracts and today's data, **not that the facts are right**.
- **Not checked at all:** anything in game; any guide page beyond its search snippet; the real `source` links (placeholders were used).

## Handoff

**Counts.** 12 new entries (4 counted Collectibles, 8 Tasks), 3 more Tasks if Athos takes the Shell Shards proposal, 8 changes to existing entries, 4 Endings. After the batch: 207 entries (210), 125 counted, Mask Shards 20, Silk Skills 6, Tool Pouch upgrades 4.

**Riskiest facts** (one source, or sources disagree, and a requirement or a count depends on it):

1. **Tools 52 against the game's 51** (section 1): the Egg of Flealia counts [CH, GC-FL], and `data/` already has 51 counted Tools. One entry is wrong somewhere; Athos's Tools screen decides.
2. **Silk and Soul's gate** (section 2): the wiki's 17-points rule is the best-supported reading, but the five ids in `requires` are a conservative stand-in, not the game's rule. `bellhome-key` joins the Route because of it.
3. **One Simple Key door in the Deep Docks** for both Flintslate and the Forebrothers (our reading of NL-BOSS, PCG-SK and SK-SK). If there are two doors, the four-keys pairing breaks.
4. **Garmond and Zaza's place** (right of the Songclave [DG-GZ, VAN] or below it in the Whispering Vaults [NL-BOSS]) and whether the Pilgrim's Rest delivery exists before Act 2 (gated on `last-judge`, conservative).
5. **Twisted Child needs the curse not lifted** (wiki, NL-E against GG-E). This decides the order of four Steps and `witch-crest`'s note.
6. **`witch-crest` moves Region** (Bellhart to Greymoor): four sources put Yarnaby in Greymoor, and the data says Bellhart. It moves a counted entry between two Region totals.
7. Flea numbers (29 or 30 for the Egg) and the Shell Shard wishes' order (Repairs before the Bridge rests on "more wishes appear").

**Open questions for Athos:**

1. Approve the id list (12, or 15 with block B) and the four Ending ids?
2. Do you want the two Journal-only duels (`shakra-duel`, `garmond-and-zaza-duel`) as missable Tasks, or left out?
3. Silk and Soul: keep all five ids in its `requires`, or only `snare-setter` and `lace-cradle` (less conservative; `bellhome-key` then stays off the Route)?
4. Shell Shards (section 7): take `shardPrice`, `shellShardsToSpend` and the three donation wishes, and drop the provisional `shellShards` Progress field? This needs a contract change (sections 1, 2, 3, 8; ADR 0006 note), a Dev A task and a Dev B task before block B.
5. The four Rosary donation wishes (up to 1450 Rosaries missing from "Rosaries still to spend"): a later mini-batch, or not tracked?
6. Endings: ship the four now with option A (order and notes), and the `lostWhen` field (option B) only when the Ending screen is built?
7. In game, when convenient: your Tools count, the Deep Docks Simple Key doors, where Yarnaby is, and whether Silk and Soul appeared for you before the Bellhome or the caravan's move.

**Also found, not a gap in this task:** `passing-of-the-age`'s `how` in `data/` ends with a sheet note ("**Only if Athos keeps it** ...") that shows on the site; block C removes it.

## Sources

Search-result pages only; none was opened. Codes from the Act 2 and Act 3 sheets keep their meaning there; the ones used here:

- **wiki**: hollowknight.wiki text as quoted in search results (Forebrothers Signis & Gron, Diving Bell, Deep Docks, Fleamaster Mooshka, Flea Caravan, Ecstasy of the End, Silk and Soul, Endings (Silksong), Grand Mother Silk, Rite of Rebirth, Infestation Operation, Greymoor, Garmond and Zaza, Shakra, Pilgrim's Rest Supplies, Couriers Tipp & Pill, Savage Beastfly (Wish), Simple Key (Silksong), Green Prince, Lost Verdania, The Cradle, Tool Pouch & Crafting Kit, Hunter's Journal (Silksong), Shell Shards, Bone Bottom Repairs, A Lifesaving Bridge, An Icon of Hope, Building Up Songclave, Strengthening Songclave, Bellhart, Achievements (Silksong)); never opened. "wiki (user draft)": [User:Trustmeimgerman/sandbox silkandsoul](https://hollowknight.wiki/w/User:Trustmeimgerman/sandbox_silkandsoul), marked incomplete by its author.
- AT-IO, AT-MS, AT-HJ: allthings.how: [Infestation Operation](https://allthings.how/hollow-knight-silksong-infestation-operation-cure-the-curse/), [20 Mask Shards](https://allthings.how/hollow-knight-silksong-all-20-mask-shard-locations/), [Hunter's Journal](https://allthings.how/hollow-knight-silksong-unlock-and-complete-the-hunters-journal/)
- BYD-YA: [Backyard Drunkard, Yarnaby](https://backyarddrunkard.com/game-guides/silksong-yarnaby/)
- CH: [Critical Hits, 100 percent (Portuguese)](https://criticalhits.com.br/dicas/hollow-knight-silksong-como-alcancar-100-de-conclusao-no-jogo/)
- DES-W: [Destructoid, wish list](https://www.destructoid.com/?p=1117043)
- DG-FSG, DG-SK, DG-GZ, DG-IO, DG-RR, DG-BB, DG-E, DG-A3: Deltia's Gaming: [Forebrothers](https://deltiasgaming.com/?p=350619), [Simple Keys and doors](https://deltiasgaming.com/hollow-knight-silksong-where-to-use-the-simple-key), [Garmond and Zaza duel](https://deltiasgaming.com/?p=345743), [Infestation Operation](https://deltiasgaming.com/?p=345566), [Rite of Rebirth](https://deltiasgaming.com/?p=342443), [Bone Bottom wishes](https://deltiasgaming.com/?p=338632), [endings](https://deltiasgaming.com/?p=339099), [Act 3](https://deltiasgaming.com/?p=340771)
- DST, DX-A3, AC-A3 (low), II-A3: as in the Act 3 sheet
- A3G: one search summary over the Act 3 guides NL-A3, PCG-A3 and II-A3 that did not say which of them gave the fact; counts as one source
- FB-SS: [The Filibuster Blog, Silk Skills](https://thefilibusterblog.com/hollow-knight-silksong-complete-guide-to-all-silk-skill-locations/)
- FD-TP (low): [fdaytalk, Tool Pouch](https://www.fdaytalk.com/silksong-tool-pouch-locations/)
- GB-GZ: [GamerBlurb, Garmond and Zaza](https://gamerblurb.com/articles/hollow-knight-silksong-garmond-and-zaza-fight-guide)
- GBT-MS, GBT-SS: GamingBolt: [20 Mask Shards](https://gamingbolt.com/hollow-knight-silksong-guide-all-20-mask-shard-locations), [6 Silk Skills](https://gamingbolt.com/hollow-knight-silksong-guide-all-6-silk-skills-and-how-to-unlock-them)
- GC-FL, GC-100: game-checklists.com: [fleas](https://game-checklists.com/silksong/guides/all-unique-fleas-guide.html), [100 percent](https://game-checklists.com/silksong/100-percent.html) (search snippets only)
- GG-E, GG-SK, GG-TB: Gamer Guides: [endings](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-2/endings-guide), [Simple Key](https://www.gamerguides.com/hollow-knight-silksong/guide/items/exploration/simple-key), [Twisted Bud](https://www.gamerguides.com/hollow-knight-silksong/guide/items/exploration/twisted-bud)
- GS: [GameSpot, Threefold Melody](https://www.gamespot.com/gallery/hollow-knight-silksong-threefold-melody-pharlooms-crown/2900-7022/)
- HGG-SS: [HostedGG, Silk and Soul](https://hostedgg.com/wiki/silksong/silk-and-soul)
- II-W: [Into Indie Games, all wishes](https://intoindiegames.com/walkthroughs/tips-tricks/hollow-knight-silksong-all-wishes-and-how-to-complete-them/)
- NB-WQ: [Noobfeed, Weaver Queen ending](https://noobfeed.com/articles/hollow-knight-silksong-weaver-queen-ending)
- NC-FL, NC-SB, NC-GP, NC-TB, NC-W, NC-A3pre, NC-HM, NC-100: Nerdschalk: [fleas](https://nerdschalk.com/how-many-fleas-in-silksong-and-how-many-you-need-to-free-when/), [Savage Beastfly wish](https://nerdschalk.com/how-to-complete-savage-beastfly-wish-location-requirements-and-rewards/), [Green Prince](https://nerdschalk.com/silksong-green-prince-location-combat-rewards-and-more/), [Twisted Bud](https://nerdschalk.com/twisted-bud-silksong-guide-location-uses-and-more/), [all wishes](https://nerdschalk.com/hollow-knight-silksong-all-wishes-and-how-to-complete-them/), [before Act 3](https://nerdschalk.com/silksong-what-to-do-before-act-3/), [Hunter's Memento](https://nerdschalk.com/how-to-unlock-the-hunters-memento-in-silksong/), [100 percent](https://nerdschalk.com/silksong-100-completion-requirements/)
- NL-BOSS, NL-E, NL-A3, NL-MS, NL-WISH, NL-SK, NL-FL: Nintendo Life: [bosses](https://www.nintendolife.com/guides/hollow-knight-silksong-all-bosses-in-order-locations-and-rewards), [endings](https://www.nintendolife.com/guides/hollow-knight-silksong-how-to-get-every-ending), [Act 3](https://www.nintendolife.com/guides/hollow-knight-silksong-how-to-unlock-act-3-silk-and-soul-quest), [Mask Shards](https://www.nintendolife.com/guides/hollow-knight-silksong-mask-shard-locations), [wishes](https://www.nintendolife.com/guides/hollow-knight-silksong-wish-quest-list-all-tasks-and-rewards), [Silk Skills and Ancestral Arts](https://www.nintendolife.com/guides/hollow-knight-silksong-every-silk-skill-and-ancestral-art), [fleas](https://www.nintendolife.com/guides/hollow-knight-silksong-all-lost-flea-locations)
- PCG-SK, PCG-A3, PCG-VER: PCGamesN: [Simple Key](https://www.pcgamesn.com/hollow-knight-silksong/simple-key), [Act 3](https://www.pcgamesn.com/hollow-knight-silksong/act-3), [Verdania](https://www.pcgamesn.com/hollow-knight-silksong/verdania)
- PG-L: [Prodigy Gamers, lost in Act 3](https://prodigygamers.com/2025/09/18/hollow-knight-silksong-things-you-will-lose-forever-in-act-3/)
- PM (low): [postmode.org](https://postmode.org/hollow-knight-silksong-guides-hub-mask-shards-spool-fragments-simple-key-pimpillo-tool-upgrade-locations/)
- PNG: [PlayNews, Act 3 conditions](https://www.playnews.gg/en/guides/act-3-hollow-knight-silksong-how-to-unlock-it-and-what-conditions-must-be-met)
- RR-B: [RogueRanker, bosses](https://rogueranker.com/hollow-knight-silksong-bosses/)
- SEL: [Selphie1999 Gaming, Bone Bottom Repairs](https://selphie1999gaming.com/game-guides/hollow-knight-silksong/hollow-knight-silksong-bone-bottom-repairs/)
- SK-RR, SK-SK, SK-MS: Sportskeeda: [Rite of Rebirth](https://www.sportskeeda.com/esports/how-complete-rite-rebirth-wish-hollow-knight-silksong), [Simple Keys](https://www.sportskeeda.com/esports/where-find-simple-key-hollow-knight-silksong), [Mask Shards](https://www.sportskeeda.com/esports/all-mask-shard-locations-hollow-knight-silksong)
- TGP: [The Game Post, achievements (Arsenal: 51 Tools)](https://thegamepost.com/all-hollow-knight-silksong-trophies-achievements-list/)
- VAN: [Vandal, content lost in Act 3](https://vandal.elespanol.com/noticia/1350783504/cuidado-si-en-silksong-avanzas-al-acto-3-hay-contenidos-que-perderas-para-siempre/)
- WAP: [WeArePlayStation, lost fleas](https://www.weareplaystation.fr/communautes/hollow-knight-silksong/astuces/wiki/hollow-knight-silksong-all-lost-fleas-location-fleafriend-trophy-achievement-guide) (summarises a video guide)
- Sheet 1, sheet 2: `docs/PHASE-5-SHEET-1-BUILDS.md`, `docs/PHASE-5-SHEET-2-MEMENTOS-EQUIPMENT-SHOPS.md`
