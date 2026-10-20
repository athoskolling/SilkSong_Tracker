# Phase 3: Act 3, the late game and the Endings plan (orchestrator's research, 2026-10-20)

**Why this exists.** Athos delegated the Act research to the orchestrator (2026-10-20, as for `docs/PHASE-3-ACT-1.md`). This sheet covers Act 3 and the late game: the Silk and Soul wish that leads into Act 3, everything that can only be done in Act 3, and a **plan** for the four Endings. Act 2 is a separate sheet (`docs/PHASE-3-ACT-2.md`, written in parallel); this sheet **does not assume any Act 2 id**. Where an Act 3 entry depends on something from Act 2, it names it as `A2: <name>`, and the Act 2 sheet's id replaces the placeholder when the two are merged.

**Research, not data.** Nothing here goes into `data/` until Athos approves the id list, the Act 2 sheet is merged, and (for the `price`, `toolColor` and `counts` fields) the Phase 5 code is merged. Ids are permanent once published (ADR 0003).

**Spoiler warning:** names the last bosses, the Endings and the whole of Act 3.

## How this was researched, and its limit

- **Web search results only.** One page fetch was tried, on a game-checklists.com page (`the-cradle.html`): it failed (`getaddrinfo ENOTFOUND`, the host does not resolve from this session). No guide page was opened. Each fact below is what one or more search results said. **This is weaker than the Act 1 sheet**, which had GC pages; treat every row as unconfirmed until Athos checks it.
- hollowknight.wiki and Fextralife were never fetched. Where the wiki is cited, it is its text **as quoted in a search result**, marked `wiki`. MapGenie was not used. No facts from memory: where the results say nothing, the cell says "not found".
- **Marks.** After each fact, the codes of the sources that said it (list at the end). One code = one source = unconfirmed. "Conflict" = sources disagree; both readings are given. Codes marked `low` (Acer posts, forum mirrors, SteelSeries) never decide a conflict.
- **`source` on each entry** is the guide page whose search result gave the most specific fact (no page was read). Athos swaps it for the main wiki page when he checks the entry.

## Decisions taken (orchestrator, under Athos's delegation; he may overrule any)

1. **Where Act 3 starts in this sheet.** This sheet owns everything from the **Silk and Soul wish** onward: the wish, the Grand Mother Silk fight that ends with the Needolin (the Snared Silk Ending), and every entry that can only be done after it. Everything before it (the Citadel, the Cradle, the Faydown Cloak, Clawline, the Weaver Queen and Twisted Child fights) is Act 2's. If the Act 2 sheet also lists the Silk and Soul wish, keep one row and tell the orchestrator.
2. **One new Region: The Abyss.** It has its own map and is reached only in Act 3 by the diving bell [wiki, NC-DB, NC-AB]. Weavenest Absolom is a Sub-area of it. Memory arenas (Coral Tower memory, Lost Verdania, the Red Memory) are Sub-areas of the Region where they are entered, not Regions: they are not places on the map.
3. **Act 3 content in older Regions stays in those Regions.** Act 3 does not get a copy of Far Fields or Bellhart. An Act 3 entry is gated by its own `requires`, which always reaches back to `grand-mother-silk-snared` (the Act 3 gate), directly or through the chain.
4. **The Act 3 gate is a Task, not a Region.** `grand-mother-silk-snared` is the fight in the Cradle (an Act 2 Region). It cannot sit in The Abyss: a Region that requires an entry inside itself is a cycle (validator rule 4).
5. **Same rules as Act 1.** Wishes fold into their reward (Act 1 decision 5): a Task exists only for a boss or quest that opens two or more things, that a Region needs, or that an Ending needs (CONTRACTS section 1: "anything an Ending depends on is an entry"). Gates are conservative: when sources differ, take the later requirement (Act 1 decision 6).
6. **What counts** follows `GLOSSARY.md`: Silk Soar (an Ancestral Art), the Shaman Crest, Everbloom, Sylphsong, the Pale Steel Needle, four Mask Shards and the Pin Badge count. Mementos, Tool upgrades (Claw Mirrors, Curvesickle) and the Conjoined Heart do not; they wait for the Phase 5 `counts: false` field (list in "Waiting for Phase 5").
7. **Lost Lace is the last Step.** After Ending 4 the save reloads at the last Abyss bench with the boss alive again [wiki], so nothing is lost by putting the optional Act 3 entries first; it keeps "Next on the route" from pointing at the final boss while side content is left.

## What Act 3 needs from earlier acts

From **Act 1** (existing ids, `data/items.json`, dataVersion 3): `needle-strike` (Pin Badge's wish needs it), `beast-crest`, `reaper-crest`, `wanderer-crest` (Sylphsong), and the Regions `moss-grotto`, `deep-docks`, `far-fields`, `bellhart`, `weavenest-atla`.

From **Act 2** (names only; the Act 2 sheet supplies the ids):

| A2 placeholder | Why Act 3 needs it | Sources |
|---|---|---|
| A2: Songclave (Region) | The Caretaker gives Silk and Soul there | DG-A3, NL-A3, PCG-A3 |
| A2: The Cradle (Region) | Grand Mother Silk is fought there | wiki, NL-E |
| A2: Sands of Karak (Region) | Crust King Khann's memory (Coral Tower) | wiki, DG-KH, SK-KH, BYD-EB |
| A2: Grand Gate (Region) | Seth and Nyleth's shrine | wiki, NC-NY, DG-SETH |
| A2: Mount Fay (Region) | Brightvein Mask Shard, the Pinstress | GC-100, NL-MS, NC-FR, wiki |
| A2: Putrified Ducts (Region) | Festival of the Flea (Pale Oil), Mister Mushroom's tablet at Pale Lake | wiki, PCG-PO, NL-PA |
| A2: Snare Setter (Collectible, Tool) | One of the four things Silk and Soul asks for. Act 1 deferred it (Weavenest Atla, needs the Faydown Cloak). **If the Act 2 sheet does not list it, this sheet adds it as `snare-setter`.** | DG-A3, DST, PCG-A3 |
| A2: the wishes and moves that make Silk and Soul appear | **Conflict:** "every wish" [DX-A3] versus the Bone Bottom, Bellhart and Songclave wishboards [AC-A3 low, II-A3]; the Flea Caravan moved (20 of 29 fleas [II-A3], 25 [NC-A3, NC-100], "more than half" [AT-A3 low]); a Bellhome (Restoration of Bellhart 250, Bellhart's Glory 400, key from Pavo) [NC-100]; the Threefold Melody [DG-A3, II-A3]. Act 2 should mark which of its entries are on this list | see left |
| A2: Forebrothers Signis & Gron (Task) | Their fight opens the way down to the diving bell (behind a Simple Key door, bottom left of Deep Docks) | wiki, NC-DB, FB-FSG |
| A2: Hivesteel Needle (Collectible) | The Pale Steel Needle is the next upgrade after it | wiki, PCG-PO, AT-N |
| A2: Egg of Flealia (Collectible, Tool) | The Festival of the Flea needs it (all fleas home) | wiki |
| A2: Witch Crest, Architect Crest (Collectibles) | Sylphsong needs six Crests | NL-EVA, Act 1 sheet (GC) |

**Act 2 entries that become missable at the Act 3 gate** (for the Act 2 sheet to mark `missable: true`, note "Lost once Act 3 begins"): the Shakra duel (needs Trail's End, Bilewater) [DG-PREP, PG-L, VAN, wiki]; the Garmond and Zaza duel [DG-PREP, wiki]; the Pilgrim's Rest Supplies wish [PG-L]; the Weaver Queen and Twisted Child fights (Endings plan below). Not lost: Broodfeast becomes Runtfeast in Act 3, same Longclaw reward [wiki, GG-BF, AT-BF]; Curveclaw stays on Skarr's corpse if not bought [NC-CS].

**Act 1 entries that may be affected (Athos to check):** the wiki (snippet) says Bone Bottom is almost destroyed in Act 3, with only the Bellway left. If Pebb's shop goes with it, `magnetite-brooch` and `mask-shard-bone-bottom` (and the Simple Key, `simple-key`) are missable at the Act 3 gate. One search found no source saying the shop moves or closes. Single source; open question Q5.

## Regions

| order | Region (id) | requires (entry) | summary (our words) |
|---|---|---|---|
| after the last Act 2 Region | The Abyss (`the-abyss`) | `diving-bell-key` | The void-soaked depth below Pharloom, reached in Act 3 by the old diving bell at the bottom of the Deep Docks. Weavenest Absolom lies inside. |

Gate note: the diving bell can only be used in Act 3 [wiki, NC-DB]; you go down with it during The Dark Below objective, its shield breaks so it cannot bring you back, and after the Everbloom Ballow repairs it for the last dive [wiki]. NC-AB adds that a Clawline mechanism in eastern Deep Docks opens a door into the Abyss (single source; it may be the same route). No hero image.

## Entries, in Route order

Kind: C = Collectible (counted), T = Task. Steps start at **2000**, in tens; **Act 2 uses 700 to 1900**, Act 1 uses 10 to 610. `requires` lists ids from this table, existing Act 1 ids, or `A2:` placeholders. Region requirements are not repeated (CONTRACTS section 2 adds them).

| step | id (proposed) | Name | Kind, type | Region (Sub-area) | requires | how (our words) | Sources |
|---|---|---|---|---|---|---|---|
| 2000 | `silk-and-soul` | Silk and Soul | T, quest | A2: Songclave | A2: Snare Setter; A2: the wishes and moves above | The Caretaker's wish. Bring him three souls (Maiden's in Bone Bottom, Hermit's behind a fake wall below the Bellhart Bellway, Seeker's in an empty bellhome by the top Bilewater bench) and the Snare Setter; he builds the Soul Snare. | DG-A3, DST, PCG-A3, NL-A3, II-A3. Maiden's spot: conflict (west of Bone Bottom by the chapel, or just below in Moss Grotto; one guide says the Skull Tyrant fight may need to come first) |
| 2010 | `grand-mother-silk-snared` | Grand Mother Silk, Soul Snare | T, boss | A2: The Cradle | `silk-and-soul` | With the Soul Snare ready, fight Grand Mother Silk and play the Needolin at the end instead of Binding her. This is the Snared Silk Ending; reloading the save starts Act 3. | wiki, DG-E, NL-E, SK-E, GG-E |
| 2020 | `diving-bell-key` | Diving Bell Key | T, key | Deep Docks | `grand-mother-silk-snared`; A2: Forebrothers Signis & Gron | In Act 3 the Caretaker's family at the Ruined Chapel sends you to the Deep Docks. Ballow moves above the old diving bell at the very bottom and hands you its key. | wiki (Awaiting the End, Diving Bell). **Conflict:** the key comes from the Caretaker [NC-DB] |
| 2030 | `silk-soar` | Silk Soar | C, ancestral-art | The Abyss (Weavenest Absolom) | | On the first trip down, go east past a Needolin door into Weavenest Absolom and touch the structure on the lower platform. A charged leap straight up; you need it to leave the Abyss. | SK-SOAR, AT-SOAR (low), NL-SK (says the Abyss, but also "Weavenest Atla": conflict, likely a slip), NC-AB |
| 2040 | `elegy-of-the-deep` | Elegy of the Deep | T, ability | Moss Grotto (Ruined Chapel) | `silk-soar` | Spell Seeker: back from the Abyss, talk to the Snail Shamans in the Ruined Chapel beside Bone Bottom. They teach a Needolin song that opens old memories, and send you after the Old Hearts. | wiki, GB-EL, HGG-OH |
| 2050 | `shaman-crest` | Shaman Crest | C, crest | Moss Grotto (Ruined Chapel) | `silk-soar` | In the Snail Shamans' chapel, go to the dead end on the east side, Silk Soar up through the gap above and Bind the big snail shell. | DG-SH, KG-CR, wiki, TGS; Phase 5 sheet (AT-S, KG, SK) |
| 2060 | `crust-king-khann` | Crust King Khann | T, boss | A2: Sands of Karak (Coral Tower memory) | `elegy-of-the-deep` | At the far end of the Sands of Karak, past a tall shaft, play the Elegy by the old king's body to enter the Coral Tower memory. Beat him at the top for the Encrusted Heart. | wiki, DG-KH, SK-KH, BYD-EB |
| 2070 | `nyleth` | Nyleth | T, boss | A2: Grand Gate (Shellwood Shrine) | `elegy-of-the-deep`, `silk-soar` | Silk Soar through the top of the Grand Gate lift shaft and find the hidden way down to the Shellwood Shrine. Beat its guardian, Seth, then play the Elegy at Nyleth's monument and win her memory fight for the Pollen Heart. | wiki, NC-NY, DG-SETH, BYD-EB. Route details differ between guides |
| 2080 | `skarrsinger-karmelita` | Skarrsinger Karmelita | T, boss | Far Fields (hidden northeast) | `elegy-of-the-deep`, `silk-soar` | Enter Hunter's March from The Marrow (the Deep Docks side is blocked in Act 3), clear the new gauntlet and Silk Soar in the statue room into a hidden part of Far Fields. Play the Elegy by the queen and win for the Hunter's Heart. | wiki, NL-ACH, BYD-EB. **Conflict:** BYD-EB says the fight is in Hunter's March |
| 2090 | `everbloom` | Everbloom | C, everbloom | Moss Grotto (Ruined Chapel, Red Memory) | `crust-king-khann`, `nyleth`, `skarrsinger-karmelita` | Bring the three Old Hearts to the Snail Shamans. Their ritual sends you into the Red Memory; clear it to claim the Everbloom, which lets you go deeper into the Abyss. The Clover Dancers' heart can stand in for one Old Heart. | wiki, NL-ACH, NC-RM, BYD-EB, HGG-OH, AT-EB (low) |
| 2100 | `mask-shard-sprintmaster` | Mask Shard, Sprintmaster Swift | C, mask-shard | Far Fields | `silk-soar` | Fastest in Pharloom, an Act 3 wish from Sprintmaster Swift or the Bellhart Wishwall: beat him in three races of three laps each. The last race gives the Mask Shard. | wiki, NC-SS, GC-100, NL-MS. One guide also asks for the Hunter's March bridge lever. **Conflict:** which race gives the shard (third [wiki] or a list of three rewards [NC-SS]) |
| 2110 | `mask-shard-hidden-hunter` | Mask Shard, The Hidden Hunter | C, mask-shard | Bellhart | `skarrsinger-karmelita` | The Hidden Hunter, an Act 3 wish: follow bone piles across Far Fields until a trap drags you to Gurr the Outcast's lair. Beat him and bring the Grass Doll to the Bellhart Wishwall. | wiki, FD-HH, GC-100. Gate: one guide says the wish appears reliably after Karmelita and a bench rest (single source; kept as the conservative gate) |
| 2120 | `mask-shard-dark-hearts` | Mask Shard, Dark Hearts | C, mask-shard | Bellhart | `silk-soar` | Dark Hearts, an Act 3 wish on the Bellhart Wishwall: destroy Void Masses around Pharloom, then come back to Bellhart. | GC-100, AT-MS (low), RSF-DH (low, says 12 of 40 or more). Gate: Silk Soar is conservative, not sourced; the count is single source |
| 2130 | `mask-shard-brightvein` | Mask Shard, Brightvein | C, mask-shard | A2: Mount Fay (Brightvein) | `silk-soar` | From the southeast bench of Mount Fay go south and west; Silk Soar off a rock floating in icy water, west of the big chasm, into Brightvein. Climb to the top, bouncing off the Mnemonords. | GC-100, BYD-BV, wiki. **Conflict:** NL-MS describes a Mount Fay Act 3 shard by a different route (may be the same one) |
| 2140 | `pin-badge` | Pin Badge | C, tool | A2: Mount Fay (peak) | `needle-strike`, `silk-soar` | Fatal Resolve, an Act 3 wish (a note in the Pinstress's hut, or the Bellhart Wishwall once you have Silk Soar): find the Pinstress asleep at the peak of Mount Fay, wake her and win the duel. | wiki, NC-FR, DG-PIN, NL-WISH. `toolColor` pending: **conflict** blue, red or yellow (Phase 5 sheet) |
| 2150 | `pale-steel-needle` | Pale Steel Needle | C, needle-upgrade | Bellhart | `silk-soar`; A2: Hivesteel Needle; A2: Egg of Flealia | Needs the last Pale Oil: beat the fleas' best scores in all three Festival of the Flea games (Mooshka's Act 3 wish, Putrified Ducts). Free Plinney from a gauntlet in a Shellwood graveyard; back in Bellhart he forges it for Rosaries. | wiki, PCG-PO, MIL-PL, AT-N. `price` pending: **conflict** 680 [wiki] versus 900 [AT-N, NL-N]. Pale Oil from the games or from a piñata after them: conflict |
| 2160 | `sylphsong` | Sylphsong | C, sylphsong | Weavenest Atla | `shaman-crest`, `beast-crest`, `reaper-crest`, `wanderer-crest`; A2: Witch Crest; A2: Architect Crest | Once your Crests other than Hunter have 32 slots open between them (Memory Lockets), Eva asks to be Bound. Do it to learn Sylphsong: Silk refills while you rest at a bench. | wiki, RR-EVA2, NL-EVA, SK-SYL. **Conflict:** NL-EVA says 6 Crests and 17 Memory Lockets; NC-EVA says the Shaman Crest is optional. Conservative gate kept |
| 2170 | `passing-of-the-age` | Passing of the Age | T, quest | A2: Putrified Ducts (Pale Lake) | `silk-soar` | A riddle tablet in a hidden cave at the top right of Pale Lake starts it. Find Mister Mushroom in seven places, in order: Moss Grotto, Bone Bottom, Far Fields, Greymoor, The Slab, Mount Fay, The Cradle. **Only if Athos keeps it** (Endings plan, question E2). | NL-PA, DG-PA, GG-PA, AT-PA (low), wiki. Bone Bottom stop: conflict (the pilgrim settlement or the entrance to The Marrow) |
| 2180 | `lost-lace` | Lost Lace | T, boss | The Abyss | `everbloom` | With the Everbloom, Ballow mends the diving bell for one last dive. Cut Pharloom free of the Void, then beat Lost Lace in the Abyss: the Sister of the Void Ending. | wiki, DG-E, NL-E, SK-E |

Not missable, as far as the sources say, once Act 3 has begun: nothing above is marked `missable`. The Act 3 gate itself is a Lockout (Endings plan).

### Counts per Region (this sheet)

| Region | Counted Collectibles | Tasks |
|---|---|---|
| The Abyss (new) | 1 (Silk Soar) | 1 (Lost Lace) |
| Moss Grotto | 2 (Shaman Crest, Everbloom) | 1 (Elegy of the Deep) |
| Deep Docks | 0 | 1 (Diving Bell Key) |
| Far Fields | 1 (Sprintmaster shard) | 1 (Karmelita) |
| Bellhart | 3 (two Mask Shards, Pale Steel Needle) | 0 |
| Weavenest Atla | 1 (Sylphsong) | 0 |
| A2: Songclave | 0 | 1 (Silk and Soul) |
| A2: The Cradle | 0 | 1 (Grand Mother Silk, Soul Snare) |
| A2: Sands of Karak | 0 | 1 (Khann) |
| A2: Grand Gate | 0 | 1 (Nyleth) |
| A2: Mount Fay | 2 (Brightvein shard, Pin Badge) | 0 |
| A2: Putrified Ducts | 0 | 1 (Passing of the Age, conditional) |
| **Total** | **10** | **9** (8 if Passing of the Age is dropped) |

Cross-check with the totals the sources give (our arithmetic): 4 Act 3 Mask Shards = 20 minus the 16 reachable by Act 2 [NL-MS, GC-100]; the 4th Needle upgrade is Act 3 only [wiki, PCG-PO]; the 7th Crest (Shaman) is Act 3 [Phase 5 sheet]. **No Spool Fragment, Silk Heart, Crafting Kit or Tool Pouch upgrade is Act 3 only** (NL-SF says all 18 Spool Fragments are reachable in Acts 1 and 2, single source; the third Silk Heart is Lace's, Act 2 [DG-SH3, GG-SH]).

### Not entries, and why

- **Clover Dancers** (Lost Verdania, entered by the Elegy on the right wall of Craw Lake, Greymoor; 12 orbs in a row, then the fight) [wiki, NL-GP, GG-VER, RR-VER]: optional; their Conjoined Heart can replace one Old Heart [wiki, HGG-OH] but `requires` can only say "all of", so the Route uses the three standard hearts. The Conjoined Heart is a trophy for the Bellhome [AC-MB low]: Phase 5.
- **Shrine Guardian Seth**: folded into `nyleth` (he opens only her).
- **The three souls and the Soul Snare**: folded into `silk-and-soul`. **Awaiting the End, The Dark Below, Escape the Abyss, Last Dive, After the Fall**: game objectives folded into `diving-bell-key`, `silk-soar` and `lost-lace` [wiki].
- **Plinney's rescue** and **Ecstasy of the End** (Festival of the Flea): folded into `pale-steel-needle` (they open only it).

### Waiting for Phase 5 (tracked, not counted; need `counts: false`)

No row above uses `counts`, `price` or `toolColor` yet. Pending, **not to be written until P5-1 to P5-3 are merged** (`docs/PHASE-5-FULL-TRACKER-PLAN.md`):

- `price` on `pale-steel-needle` (680 or 900, conflict) and `toolColor` on `pin-badge` (conflict).
- Hero's Memento: Hero's Call wish (Bellhart, after three meetings with Garmond and Zaza or after the Everbloom; conflict on the trigger), beat Lost Garmond in the Blasted Steps [wiki, DG-LG, NL-WISH]. Type `memento`.
- Grey Memento: Watcher at the Edge, a statue woken by the Needolin, reached with Silk Soar (Sands of Karak [NL-BOSS] or Blasted Steps [DG-WE]: conflict) [wiki, NC-WE]. Type `memento`.
- Claw Mirrors: Pain, Anguish and Misery wish (Songclave, Act 3, needs Claw Mirror and Silk Soar): beat Tormented Trobbio on the Stage in the Whispering Vaults; the Dark Mirror joins the Claw Mirror [wiki, RR-TR, FB-PAM]. Upgrade of an Act 2 Tool.
- Curvesickle: in Act 3, hit every target in the practice room above the Far Fields Bellway with one Curveclaw throw (not with the Pollip Pouch); a Skarr scout takes it and leaves the Curvesickle after a bench rest [wiki, NC-CS]. Upgrade of `curveclaw`.
- Conjoined Heart (above).

## Endings plan (a plan only; V1 `endings.json` stays `[]`)

**Count.** Athos fixed four Endings (2026-10-20). Sources agree on four main ones; some count Passing of the Age as a fifth [NL-E, DG-E, NC-END] or six with Act 3 variants [NC-END, contradictory], and RogueRanker calls it a bonus scene [RR-E]. Numbering below is the wiki's (snippet).

| # | Ending (proposed id) | What reaches it | conditions (entry ids) | locksOut | Sources |
|---|---|---|---|---|---|
| 1 | Weaver Queen (`weaver-queen`) | Act 2: play the Threefold Melody at the Citadel's heart, take the lift, beat Lace a second time, then beat Grand Mother Silk and **Bind** her | A2: Grand Mother Silk, Bind (proposed `grand-mother-silk-bind`, Act 2 sheet decides) | `[]` (reloading puts you at the last Cradle bench with the boss alive) | wiki, NL-E, GG-E |
| 2 | Snared Silk (`snared-silk`) | Silk and Soul, then the Needolin instead of Bind | `grand-mother-silk-snared` | `["weaver-queen", "twisted-child"]` (after it, reloading starts Act 3 and the fight cannot be repeated) | wiki, DG-E, NL-E, SK-E |
| 3 | Twisted Child (`twisted-child`) | Beat Grand Mother Silk **while cursed** (Rite of Rebirth: the Twisted Bud to Greyroot, who curses Hornet), before Snared Silk and **without** lifting the curse | A2: Rite of Rebirth (the curse); A2: Grand Mother Silk, cursed (proposed `grand-mother-silk-cursed`) | `[]` (same reload rule as 1) | wiki, NL-E, GG-TB, DG-E. **Conflict:** GG-E says the Twisted Child needs Infestation Operation done; the wiki says it must **not** be done |
| 4 | Sister of the Void (`sister-of-the-void`) | Act 3: Everbloom, last dive, beat Lost Lace | `lost-lace` | `[]` (reload at the last Abyss bench) | wiki, DG-E, NL-E, SK-E |

`locksOut` here is the existing contract field (ending ids lost once this Ending is reached). Ending ids do not collide with any entry id (the fight Tasks have `grand-mother-silk-` and `lost-lace` ids).

### Choice points this implies

1. **The Act 3 gate** (`grand-mother-silk-snared`): after it, Endings 1 and 3 are gone for the run. The contract's `locksOut` already says this.
2. **Lifting the curse** (Infestation Operation, which turns the Cursed Crest into the Witch Crest, a counted Collectible): after it, Ending 3 is gone [wiki; conflict GG-E]. **The contract cannot say this today**: `locksOut` goes from Ending to Ending, and here an **entry** removes an Ending.
3. **Entering Act 3 without having been cursed** also loses Ending 3 [NL-E]: the same point as 1.

The only order that keeps every Ending and every Collectible on one run, as far as the sources say: Rite of Rebirth (cursed) -> Grand Mother Silk cursed (Ending 3) -> reload -> Infestation Operation (Witch Crest) -> Grand Mother Silk Bound (Ending 1; this may also come before the curse) -> reload -> Silk and Soul -> Grand Mother Silk with the Needolin (Ending 2) -> Act 3 -> Lost Lace (Ending 4). The Act 2 sheet must give the Twisted Child fight a lower `step` than the Witch Crest, and both Act 2 fights steps below 2000.

### How the Route could show a choice (open contract question, section 8: proposals, not decisions)

- **A. Order and text only (no contract change).** The Route already puts the steps in the safe order above. The two Act 2 fight Tasks get `missable: true` with a note ("Lost once you start Act 3"), and the Witch Crest's Infestation Operation gets a note ("Do the cursed Grand Mother Silk fight first"). Cost: nothing machine-readable, so no "Choice point" marker and no endings screen can say "lost".
- **B. One optional field on an Ending: `lostWhen: string[]`** (entry ids; the Ending can no longer be reached once any of them is done). Twisted Child: `["A2: Witch Crest", "grand-mother-silk-snared"]`; Weaver Queen: `["grand-mother-silk-snared"]`. The Route shows "Choice point" on any entry named in some `lostWhen`, derived, so it lives in one place. A pure `endingStatus(endingId, doneSet, ...)` -> `'reached' | 'open' | 'lost'` could follow later. Validator: ids exist and are entries; an Ending never names its own conditions.
- **C. The same link on entries: `locksOutEndings: string[]`** on items. Equivalent to B, but spreads Ending rules over `items.json`.

**Recommendation: A now (it ships with the data and needs no code), B when the endings screen is built** (it keeps all Ending rules in `endings.json`, and `locksOut` stays as the summary). Not C. Athos decides; the orchestrator then writes the contract change.

**Also open:** `requires` cannot say "3 of 4" (the Conjoined Heart). Recommendation: do not add an "any of" rule; use the three standard hearts and say it in `how`.

## Disagreements and open questions for Athos

1. **E1, Ending count and Passing of the Age.** Four Endings plus Passing of the Age as a Task (`passing-of-the-age`) that the Sister of the Void text mentions, or drop the Task. Sources: wiki gives it its own achievement and scene after the final boss; NL-E calls it Ending 5; NC-END ties it to 100 percent and a "Pharloom Herald Fragment" (contradicts the wiki's Mister Mushroom wish). Recommendation: keep the Task, four Endings.
2. **E2, Twisted Child and Infestation Operation** (must not be done [wiki] versus must be done [GG-E]). Decides choice point 2.
3. **Silk Soar's place** (Weavenest Absolom in the Abyss [SK-SOAR, AT-SOAR, NC-AB] versus Weavenest Atla [NL-SK]) and whether it counts (it is an Ancestral Art, so yes by the glossary; a game-files breakdown says the Faydown Cloak does not count but does not mention Silk Soar [RSF low]).
4. **Who gives the Diving Bell Key**: Ballow [wiki] or the Caretaker [NC-DB].
5. **Bone Bottom in Act 3** (wiki snippet: almost destroyed). Are Pebb's wares (`magnetite-brooch`, `mask-shard-bone-bottom`, `simple-key`) missable at the Act 3 gate?
6. **Pale Steel Needle price**: 680 [wiki] or 900 [AT-N, NL-N]. Also: the Pale Oil from the games or from the piñata after them.
7. **Karmelita's arena**: hidden Far Fields [wiki, NL-ACH] or Hunter's March [BYD-EB]. Decides `regionId`.
8. **Sylphsong gate**: six Crests including Shaman [NL-EVA, Act 1 sheet] or Shaman optional [NC-EVA]. If optional, Sylphsong may belong to Act 2.
9. **Silk and Soul's trigger** (every wish, or three wishboards; 20, 25 or "more than half" of the fleas). Needs Athos's own play; it decides the `requires` of row 2000.
10. **Snare Setter counting.** Nintendo Life's Tools list leaves it out as a "temporary" Tool used for Silk and Soul (with the Needle Phial). The Phase 5 sheet found 52 Tool names for an Arsenal of 51: the Snare Setter is a candidate for the one that is not counted. For the Act 2 sheet and Phase 5.
11. **Mask Shard numbering** differs between GC-100 and NL-MS (Brightvein as 20 or another Mount Fay shard as 17). Athos checks whether there are two Mount Fay Act 3 shards or one.
12. **Dark Hearts count** (12 Void Masses, one player post) and its gate.

## Proposed checks

- **Structure: done (orchestrator, 2026-10-20).** The entries table was parsed by a throwaway script into a data folder in the session scratchpad (outside the repository): the current `data/` (62 entries, 12 Regions), six stand-in Act 2 Regions and seven stand-in Act 2 entries for the `A2:` placeholders, `the-abyss`, and the 19 rows. `node scripts/validate-data.js <that folder>`: passed, 0 warnings (every Collectible type is on the approved list). `js/requirements.js`: following "Next on the route" from an empty Progress reaches all 88 entries, and the 19 Act 3 rows come in exactly their step order, `lost-lace` last. Every `how` is under 300 characters. This proves the sheet is consistent with stand-ins, not that the facts are right; repeat it with the real Act 2 ids.
- **Ids: done.** None of the 19 proposed entry ids is among the existing 62 entry ids or 12 Region ids (checked by the same script against `data/` at dataVersion 3); `the-abyss` and the four Ending ids are not either. Re-check against the Act 2 sheet's ids when it lands.
- **Athos in game or on the wiki (highest risk first):** questions 2, 3, 4, 5, 9 above; then the four Mask Shard routes; then prices.
- **Web cross-checks still worth doing** if a guide page can ever be opened: GC's Act 3 and boss pages, Gamer Guides' Act 3 walkthrough.

## Brief for Dev C: Act 3 into `data/` (do not hand out yet)

- **Hand out only when:** Athos approves this id list; the Act 2 sheet is approved and merged into `data/` (so every `A2:` placeholder has a real id); and P5-1 to P5-3 are merged if any pending field is used.
- **Goal:** turn the Regions and entries tables into `data/regions.json` and `data/items.json`, exactly: no added, dropped or merged rows. A row that looks wrong is kept and named in the handoff.
- **Files (Dev C owns them):** `data/regions.json`, `data/items.json`, `data/endings.json` (only to raise `dataVersion`; `endings` stays `[]` until Athos approves the Endings plan and the orchestrator changes the contract).
- **Rules:** `dataVersion` +1 in all three files. `the-abyss` gets the next `order` after the last Region. Ids, steps, names, `area` (the Sub-area in brackets), `requires` (with `A2:` placeholders replaced by the Act 2 ids) and `how` as written (each under 300 characters). `source` = the first guide page in the row's Sources. No `missable`, `spoiler`, `unlocks` or hero image. No `counts`, `price` or `toolColor` until Athos settles the conflicts and Phase 5 is merged. Drop row 2170 if Athos drops Passing of the Age.
- **Done when:** `node scripts/validate-data.js` passes with 0 warnings; `node --test "tests/*.test.js"` passes; following "Next on the route" from an empty Progress reaches every entry in Route order, with `lost-lace` last; the four pages load locally with no console errors. The handoff lists every id and any row Dev C doubts.
- **Not pushed to `main`** until Athos approves (ids are permanent once published).

## Sources

Search-result pages only; none was opened. Codes used above:

- AC-A3, AC-E, AC-MB (all low): Acer: [Act 3](https://blog.acer.com/en/discussion/3498/how-to-get-to-act-3-in-silksong), [endings](https://blog.acer.com/en/discussion/3478/all-endings-in-silksong-explained-and-how-to-get-them-spoilers), [memory bosses](https://blog.acer.com/en/discussion/3479/how-to-find-all-secret-memory-bosses-in-silksong)
- AT-A3, AT-SOAR, AT-EB, AT-PA, AT-N, AT-MS, AT-BF (allthings.how; Act 3 pages low): [Act 3](https://allthings.how/silksong-act-3-how-to-unlock-silk-and-soul-sep-2025/), [Silk Soar](https://allthings.how/silk-soar-in-hollow-knight-silksong-unlock-controls-and-tips/), [Everbloom](https://allthings.how/silksongs-everbloom-what-it-is-how-to-get-it/), [Passing of the Age](https://allthings.how/passing-of-the-age-wish-guide-for-hollow-knight-silksong-act-3/), [Needle upgrades](https://allthings.how/silksong-how-to-upgrade-the-needle-all-4-tiers/), [Mask Shards](https://allthings.how/hollow-knight-silksong-all-20-mask-shard-locations/), [Broodfeast](https://allthings.how/broodfeast-in-hollow-knight-silksong-organ-drops-and-best-tools/)
- BYD-EB, BYD-BV: Backyard Drunkard: [Everbloom](https://backyarddrunkard.com/games/silksong-everbloom/), [Brightvein](https://backyarddrunkard.com/game-guides/silksong-brightvein/)
- DG-A3, DG-PREP, DG-E, DG-KH, DG-SETH, DG-SH, DG-PIN, DG-PA, DG-LG, DG-WE, DG-SH3: Deltia's Gaming: [Act 3](https://deltiasgaming.com/?p=340771), [before Act 3](https://deltiasgaming.com/?p=347937), [endings](https://deltiasgaming.com/?p=339099), [Khann](https://deltiasgaming.com/?p=346848), [Seth](https://deltiasgaming.com/?p=350885), [Shaman Crest](https://deltiasgaming.com/?p=341876), [Pin Badge](https://deltiasgaming.com/?p=352691), [Passing of the Age](https://deltiasgaming.com/?p=348510), [Lost Garmond](https://deltiasgaming.com/?p=350382), [Watcher at the Edge](https://deltiasgaming.com/hollow-knight-silksong-how-to-beat-watcher-at-the-edge-boss-guide), [Silk Hearts](https://deltiasgaming.com/?p=340543)
- DST: [Destructoid, Act 3 and Silk and Soul](https://www.destructoid.com/how-to-unlock-hollow-knight-silksong-act-3-abyss-silk-and-soul-wish-guide/)
- DX-A3: [Dexerto, Act 3](https://www.dexerto.com/gaming/how-to-unlock-act-3-in-hollow-knight-silksong-3247605)
- FB-FSG, FB-PAM: The Filibuster Blog: [Forebrothers Signis and Gron](https://thefilibusterblog.com/hollow-knight-silksong-boss-guide-for-forebrothers-signis-and-gron/), [Pain, Anguish and Misery](https://thefilibusterblog.com/hollow-knight-silksong-quest-guide-for-overcoming-pain-anguish-and-misery/)
- FD-HH: [fdaytalk, The Hidden Hunter](https://www.fdaytalk.com/?p=59325)
- GB-EL: [GamerBlurb, Elegy of the Deep](https://gamerblurb.com/articles/hollow-knight-silksong-elegy-of-the-deep-location-unlock-guide)
- GC-100: [game-checklists.com, 100 percent](https://game-checklists.com/silksong/100-percent.html) (search snippet only; the page would not load)
- GG-A3, GG-E, GG-TB, GG-VER, GG-PA, GG-BF, GG-SH: Gamer Guides: [Act 3](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-3), [endings](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-2/endings-guide), [Twisted Bud](https://www.gamerguides.com/hollow-knight-silksong/guide/items/exploration/twisted-bud), [Verdania](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-3/how-to-enter-verdania), [Passing of the Age](https://www.gamerguides.com/hollow-knight-silksong/database/quests/wishes/passing-of-the-age), [Broodfeast](https://www.gamerguides.com/hollow-knight-silksong/database/quests/wishes/broodfeast), [Silk Hearts](https://www.gamerguides.com/hollow-knight-silksong/guide/items/tools/silk-hearts)
- HGG-OH: [HostedGG, The Old Hearts](https://hostedgg.com/wiki/silksong/the-old-hearts)
- II-A3: [Into Indie Games, Act 3](https://intoindiegames.com/walkthroughs/tips-tricks/hollow-knight-silksong-how-to-unlock-act-3/)
- KG-CR: [KeenGamer, all Crests](https://www.keengamer.com/articles/guides/hollow-knight-silksong-all-crest-locations)
- MIL-PL: [millenium.org, Plinney in Act 3](https://www.millenium.org/guide/427737.html)
- NC-AB, NC-A3, NC-END, NC-NY, NC-RM, NC-DB, NC-SS, NC-FR, NC-WE, NC-EVA, NC-CS, NC-100: Nerdschalk: [the Abyss](https://nerdschalk.com/how-to-get-to-the-abyss-in-silksong-act-3-requirements-location-map-and-more/), [Act 3 steps](https://nerdschalk.com/step-by-step-guide-to-unlocking-act-3-in-hollow-knight-silksong/), [how many endings](https://nerdschalk.com/how-many-endings-does-silksong-have/), [Nyleth](https://nerdschalk.com/step-by-step-guide-to-get-to-nyleth-in-silksong/), [Red Memory](https://nerdschalk.com/red-memory-silksong-what-it-is-and-how-to-unlock-the-sequence/), [Old Diving Bell](https://nerdschalk.com/your-guide-to-unlocking-old-diving-bell-in-silksong/), [Sprintmaster Swift](https://nerdschalk.com/silksong-sprintmaster-swift-guide-location-map-and-more/), [Fatal Resolve](https://nerdschalk.com/silksong-fatal-resolve-wish-guide-everything-you-need-to-know/), [Watcher at the Edge](https://nerdschalk.com/hollow-knight-silksong-watcher-at-the-edge-boss-location-route-and-rewards/), [Eva](https://nerdschalk.com/silksong-eva-all-5-upgrade-requirements/), [Curvesickle](https://nerdschalk.com/what-is-curveclaw-in-silksong-and-how-to-upgrade-it-to-curvesickle/), [100 percent](https://nerdschalk.com/silksong-100-completion-requirements/)
- NL-A3, NL-E, NL-ACH, NL-GP, NL-BOSS, NL-SK, NL-MS, NL-SF, NL-WISH, NL-PA, NL-EVA, NL-N: Nintendo Life: [Act 3](https://www.nintendolife.com/guides/hollow-knight-silksong-how-to-unlock-act-3-silk-and-soul-quest), [every ending](https://www.nintendolife.com/guides/hollow-knight-silksong-how-to-get-every-ending), [achievements](https://www.nintendolife.com/guides/hollow-knight-silksong-all-achievements), [Green Prince](https://www.nintendolife.com/guides/hollow-knight-silksong-green-prince-guide-how-to-reach-lost-verdania), [bosses](https://www.nintendolife.com/guides/hollow-knight-silksong-all-bosses-in-order-locations-and-rewards), [Silk Skills and Ancestral Arts](https://www.nintendolife.com/guides/hollow-knight-silksong-every-silk-skill-and-ancestral-art), [Mask Shards](https://www.nintendolife.com/guides/hollow-knight-silksong-mask-shard-locations), [Spool Fragments](https://www.nintendolife.com/guides/hollow-knight-silksong-all-spool-fragment-locations), [wishes](https://www.nintendolife.com/guides/hollow-knight-silksong-wish-quest-list-all-tasks-and-rewards), [Passing of the Age](https://www.nintendolife.com/guides/hollow-knight-silksong-passing-of-the-age-quest-all-mister-mushroom-locations), [binding Eva](https://www.nintendolife.com/guides/hollow-knight-silksong-how-to-bind-eva), [Needle](https://www.nintendolife.com/guides/hollow-knight-silksong-how-to-upgrade-your-needle-and-weapon-damage)
- PCG-A3, PCG-PO: PCGamesN: [Act 3](https://www.pcgamesn.com/hollow-knight-silksong/act-3), [Pale Oil](https://www.pcgamesn.com/hollow-knight-silksong/pale-oil)
- PG-L: [Prodigy Gamers, things lost in Act 3](https://prodigygamers.com/2025/09/18/hollow-knight-silksong-things-you-will-lose-forever-in-act-3/)
- RR-E, RR-VER, RR-EVA2, RR-TR: RogueRanker: [endings](https://rogueranker.com/?p=10576), [Verdania](https://rogueranker.com/?p=10711), [Eva](https://rogueranker.com/?p=10689), [Trobbio](https://rogueranker.com/?p=10606)
- RSF, RSF-DH (low, forum): [What counts for 100 percent](https://forum.rscsundae.org/viewtopic.php?p=593), [Dark Hearts](https://forum.rscsundae.org/viewtopic.php?p=746)
- SK-E, SK-KH, SK-SOAR, SK-SYL: Sportskeeda: [endings](https://www.sportskeeda.com/esports/all-endings-hollow-knight-silksong-get), [Khann](https://www.sportskeeda.com/esports/how-beat-crust-king-khann-hollow-knight-silksong-location-tips-tricks), [Silk Soar](https://www.sportskeeda.com/esports/how-get-silk-soar-hollow-knight-silksong-super-jump), [Sylphsong](https://www.sportskeeda.com/esports/how-get-sylphsong-ability-hollow-knight-silksong)
- SS-E (low): [SteelSeries, endings](https://steelseries.com/blog/hallow-knight-silksong-endings-guide) (contradicts the others; not used)
- TGS: [The Game Slayer, Shaman Crest](https://thegameslayer.com/guides/shaman-crest-location-in-silksong/)
- VAN: [Vandal, content lost in Act 3](https://vandal.elespanol.com/noticia/1350783504/cuidado-si-en-silksong-avanzas-al-acto-3-hay-contenidos-que-perderas-para-siempre/)
- wiki: hollowknight.wiki text as quoted in search results (Act 2, Act 3, Endings (Silksong), Awaiting the End, Diving Bell, Snail Shamans, Spell Seeker, Elegy of the Deep, Skarrsinger Karmelita, Far Fields, Nyleth, Seth, Crust King Khann, Clover Dancers, Fastest in Pharloom, The Hidden Hunter, Pale Oil, Sylphsong, Pinstress, Pain Anguish and Misery, Hero's Memento, Watcher at the Edge, Curvesickle, Broodfeast, Ecstasy of the End, Passing of the Age (Wish), Bosses (Silksong)); never opened.
