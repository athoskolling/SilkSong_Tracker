# Phase 6 sheet: Build templates and Tool synergies (orchestrator's research, 2026-10-20)

**Status: research, not data.** Nothing here goes into `data/` until Athos checks it. Field names follow the `builds.json` section of `docs/CONTRACTS.md` and ADR 0007 as they stood at the end of this research (third round, their text awaits Athos's review). Names are the game's names; every `goal`, `why` and synergy sentence is in our own words.

**Spoiler warning:** names late-game Crests, Tools, Silk Skills and bosses.

## How this was researched, and its limit

- **Web search results only.** A guide page fetch was refused in this session (WebFetch could not resolve `hostedgg.com`; the network proxy answered "connect_rejected"), the same limit sheet 1 hit, so no other page was tried. So no guide page was opened; each fact is what a search result said about a page. hollowknight.wiki and Fextralife were never fetched; their text inside a search result is marked "wiki (snippet)" or "Fextralife (snippet)". MapGenie was not used. No facts from memory.
- **Search results are summaries.** The search tool returns a short summary of each page, not the page. A Tool list can be incomplete (for example the Silk Skill or the Vesticrest pair missing), and guides are about a year old (patches since then changed at least Thread Storm, per DualShockers). Each template says what was missing.
- Ids are from `data/items.json`, read only. It changed under this research: it started at `dataVersion` 9 and is now `dataVersion` 10 (merge `3ad65ad`, Dev C's Crest slots, Tool colours and `upgradeOf` pairs). The fit check uses the `slots` and `slotsMax` now in `data/` (red/blue/yellow/white): Hunter 1/1/1/1 to 2/2/2/1, Reaper 1/1/1/1 to 2/2/2/1, Wanderer 1/0/2/1 to 1/2/3/1, Beast 2/0/0/1 to 2/0/2/1, Witch 2/0/0/1 to 2/3/0/1, Architect 3/0/0/0 to 3/2/2/0, Shaman 0/0/0/3 to 0/2/0/3. Witch and Shaman are among sheet 1's disputed layouts; section 3 says what the templates add to that dispute. The fit check is our arithmetic, not a source.
- **Vesticrest.** Sheet 1 says Eva's Vesticrest adds one yellow and later one blue slot to every Crest. Most guide builds list a separate "Vesticrest" pair. Below, the fit is checked twice: on the Crest's own `slotsMax` ("Crest"), and on `slotsMax` plus the Vesticrest, +1 blue +1 yellow ("+V"). **`data/` has no Vesticrest entry with `grantsSlots` yet**, so today `slotsFor` (contract section 2a) would reject every "+V only" template. Which ids sit on the Vesticrest is shown for Athos; in data a template only lists ids per colour.
- **Upgraded Tools.** Some guides name an upgrade (Curvesickle, Claw Mirrors). The contract stores a Build by the base id (`upgradeOf`), so the templates below use the base id (`curveclaw`, `claw-mirror`) and say so.

### Source codes

Search-result pages only; none was opened.

- G8-H, G8-R, G8-WA, G8-B, G8-WI, G8-A, G8-S, G8-T: Game8 "Location and Best Build" pages: [Hunter](https://game8.co/games/Hollow-Knight-Silksong/archives/550150), [Reaper](https://game8.co/games/Hollow-Knight-Silksong/archives/550140), [Wanderer](https://game8.co/games/Hollow-Knight-Silksong/archives/550148), [Beast](https://game8.co/games/Hollow-Knight-Silksong/archives/550149), [Witch](https://game8.co/games/Hollow-Knight-Silksong/archives/550147), [Architect](https://game8.co/games/Hollow-Knight-Silksong/archives/550145), [Shaman](https://game8.co/games/Hollow-Knight-Silksong/archives/550141); [tier list](https://game8.co/games/Hollow-Knight-Silksong/archives/549953)
- GRE: [Gamereactor, crests and best builds](https://www.gamereactor.eu/hollow-knight-silksong-guide-how-to-get-all-the-crest-and-the-best-builds-to-use-them-1599793/)
- RG: [Rectify Gaming, crest tier list with builds](https://www.rectifygaming.com/hollow-knight-silksong-best-crest-tier-list/)
- DS: [DualShockers, 8 most broken builds](https://www.dualshockers.com/most-broken-builds-in-hollow-knight-silksong/) (only entries 8 and 7 and one Shaman remark were visible)
- DG-E: [Deltia's Gaming, best early-game build](https://deltiasgaming.com/hollow-knight-silksong-best-early-game-build-guide/)
- GRA: [GameRant, best end-game build for Act 3](https://gamerant.com/hollow-knight-silksong-best-broken-build-act-3-end-game/)
- GPM (low): [Gaming ProMax, Act 3 end-game build](https://gamingpromax.com/hollow-knight-silksong-act-3-ultimate-endgame-build-guide/) (promotional, one source)
- HG: [HostedGG, crest build guide](https://hostedgg.com/blog/silksong-crest-build-guide)
- ST-1, ST-2, ST-3, ST-W, ST-A: Steam discussions: [favourite crest and tool set-up](https://steamcommunity.com/app/1030300/discussions/0/596286289747547865/), [full Crest builds](https://steamcommunity.com/app/1030300/discussions/0/596286923596968967/), [favourite build](https://steamcommunity.com/app/1030300/discussions/0/546746241084655695/), [Witch crest builds](https://steamcommunity.com/app/1030300/discussions/0/596287646583679805/), [Architect builds](https://steamcommunity.com/app/1030300/discussions/0/691996029262777886/)
- SC (low): [silksong.codes, best builds](https://www.silksong.codes/en/guides/best-builds/) (Tool names and colours do not match any other source; never used to decide anything)
- wiki (snippet): hollowknight.wiki text as quoted in search results; never opened.
- Fextralife (snippet): Fextralife text as quoted in search results; never opened.

- G8-TL, GRA-T: tier lists with Tool remarks: [Game8 Tools tier list](https://game8.co/games/Hollow-Knight-Silksong/archives/550146), [GameRant Tools tier list](https://gamerant.com/silksong-tool-tier-list-best-tools-ranked/)
- TG: [TheGamer, overpowered Tool combos](https://www.thegamer.com/hollow-knight-silksong-tool-combinations-break-game-overpowered/) (summaries saw only some of its entries)
- STG: [Steam guide "Tool Synergies" by Lilith_Sins](https://steamcommunity.com/sharedfiles/filedetails/?id=3605545354) (removed by Steam; seen only as cached text in results)
- ST-C, ST-PP, ST-FP, ST-RF, ST-SP: Steam discussions: [unique gear combos](https://steamcommunity.com/app/1030300/discussions/0/546746241084623984/), [Plasmium Phial and Pollip Pouch](https://steamcommunity.com/app/1030300/discussions/0/546746241084755310/), [Pollip Pouch and Flintslate](https://steamcommunity.com/app/1030300/discussions/0/598537454201340852/), [Rosary farming method](https://steamcommunity.com/app/1030300/discussions/0/598537454201492328/), [Snitch Pick drops fewer Rosaries](https://steamcommunity.com/app/1030300/discussions/0/596287646583592434/)
- NX: [Nexus mod "Plasmium Phial - Pollip Pouch Compatibility Fix"](https://www.nexusmods.com/hollowknightsilksong/mods/852) (a mod page describing the vanilla behaviour it changes)
- SSO: [silk-song.org, Plasmium Phial](https://silk-song.org/tools/plasmium-phial)
- SST: silksongtools.com: [Multibinder](https://silksongtools.com/tools/multibinder/), [Claw Mirror](https://silksongtools.com/tools/claw-mirror/)
- KL (low): [kraftloft article on Tool combos](https://www.articles.kraftloft.com/Articles-of-2024/hollow-knight-silksongu2019s-most-devastating-tool-combos-reshape-combat)
- PCG-R: [PCGamesN, Rosary farm](https://www.pcgamesn.com/hollow-knight-silksong/rosary-farm)

## 1. Templates

Read each block as: Crest, Tools and Silk Skills by colour (ids from `data/items.json`), Vesticrest ids marked "(V)", fit, `goal` and `why` in our words, `editorial`, sources and agreement. **Agreement** = how many independent sources name this exact set (or, for an editorial template, back its parts). `editorial: false` only when a guide names the build; `true` when the grouping is ours. Upgrades are stored by base id (contract: a Build stores the base id): Curvesickle as `curveclaw`, Claw Mirrors as `claw-mirror`.

**Missing ids** (needed by templates below, not in `data/items.json`): `pale-nails` (Silk Skill, sheet 1 section 4, Act 3), `egg-of-flealia` (Tool, colour disputed, sheet 1), and the two Vesticrest entries with `grantsSlots` (sheet 1 section 4). The Hunter Crest's two Eva evolutions are not entries either (only needed to explain `hunter-evolved-needle`).

### Hunter Crest (`hunter-crest`)

**`hunter-all-round`**, "All-round". `editorial: false`.
- red `cogwork-wheel`, `plasmium-phial`; blue `longclaw`, `pin-badge`, `spool-extender` (V); yellow `magnetite-brooch`, `magnetite-dice`, `compass` (V); white `silk-spear` (guide's alternative: `cross-stitch`).
- Fit: 2/3/3/1. Crest no (one blue, one yellow over); **+V yes**, exactly.
- goal: A Build for most of the game, from exploring to bosses.
- why: Two ranged red Tools for reach, Longclaw for Needle range, Spool Extender for Silk, and two yellow Tools that pull in Rosaries and sometimes cancel a hit.
- Sources: G8-H. Agreement 1. Note: it puts Pin Badge in a blue slot, which matches `data/` (`toolColor: "blue"`).

**`hunter-steady-mix`**, "Steady mix". `editorial: false`.
- red `cogfly`, `plasmium-phial` (the guide says Cogfly *or* Plasmium Phial; both fit); blue `spool-extender`, `longclaw`; yellow `weighted-belt`, `barbed-bracelet`; white `pale-nails` (**missing id**).
- Fit: 2/2/2/1. Crest yes, exactly.
- goal: A middle-of-the-road Build that handles most fights.
- why: A helper that fights on its own or a heal Tool, more Silk and reach, less knockback, and more damage at the price of taking more.
- Sources: GRE (its "moderate" Hunter build). The result names "Elongated Claw"; read as Longclaw (likely a translated name; Athos to confirm). Agreement 2 on the Tools: RG gives the same six Tools for the Reaper Crest.

**`hunter-everyday-silk`**, "Everyday Silk". `editorial: false`.
- blue `pollip-pouch`, `weavelight`; yellow `compass`; white `thread-storm`.
- Fit: 0/2/1/1. Crest yes (needs one Memory Locket on blue; at start 1 blue only).
- goal: A light Build for exploring and ordinary fights.
- why: Silk refills faster for Thread Storm and heals, the Compass shows where Hornet is, and Pollip Pouch poisons whatever red Tool is added.
- Sources: one player in ST-1 (switches to the Beast Crest for bosses). Agreement 1, low. The summary may have dropped a red Tool; Pollip Pouch does nothing without one.

**`hunter-evolved-needle`**, "Evolved Hunter, Needle focus". `editorial: true`.
- red `flea-brew`; blue `longclaw`. Other slots free.
- Fit: yes at start (1/1/0/0).
- goal: Long hit streaks with the fully evolved Hunter Crest.
- why: The evolved Hunter grows stronger with each hit until Hornet is hurt. Flea Brew's speed adds more hits than Flintslate's bonus, which only adds to the Crest's, and Longclaw keeps hits landing.
- Sources: wiki (snippet), Hunter Crest page: highest sustained Needle damage when fully evolved; Flea Brew suggested over Flintslate; Longclaw for range and consistency. Agreement 1. Needs Eva's two Hunter evolutions, which are not entries.

### Reaper Crest (`reaper-crest`)

**`reaper-flame-and-reach`**, "Flame and reach". `editorial: false`.
- red `flintslate`, `flea-brew`; blue `spool-extender`, `longclaw`, `weavelight` (V); yellow `magnetite-dice`, `scuttlebrace`, `compass` (V); white `silk-spear`.
- Fit: 2/3/3/1. Crest no; **+V yes**, exactly.
- goal: Make the Reaper's slow, wide swings hit harder and more often.
- why: Flea Brew speeds up the slow swings and Flintslate adds damage; Spool Extender keeps Silk for heals, since the Reaper earns Silk mostly after a Bind.
- Sources: G8-R. Spool Extender on Reaper also HG ("close to mandatory"), RG. Flea Brew to fix the slow moveset: G8-R. Agreement 1 for the set, 3 for Spool Extender.

**`reaper-summons-and-heal`**, "Summons and heal". `editorial: false`.
- red `cogfly`, `plasmium-phial`; blue `spool-extender`, `longclaw`; yellow `weighted-belt`, `barbed-bracelet`. White not named in the result.
- Fit: 2/2/2/0+. Crest yes.
- goal: A sturdier Reaper with a helper that keeps fighting.
- why: Cogfly deals damage while the Reaper's slow swings recover, the Phial heals, and Spool Extender and Longclaw cover its weak Silk gain and narrow rooms.
- Sources: RG. Agreement 2 on the Tools (GRE gives the same six for Hunter).

**`reaper-early-game`**, "Early game". `editorial: false`.
- red `threefold-pin`; blue `druids-eye` (guide's alternative: `warding-bell`); yellow `compass`; white `thread-storm`.
- Fit: 1/1/1/1. Crest yes **at start**, no Memory Locket needed. All four are Act 1 entries.
- goal: A first Build as soon as the Reaper Crest is found.
- why: A spread of pins for flying foes, Silk back when Hornet is hit, and the Compass while the map is new.
- Sources: DG-E. Agreement 1. G8-R picks Silk Spear over Thread Storm.

### Wanderer Crest (`wanderer-crest`)

**`wanderer-quick-silk`**, "Quick Silk". `editorial: false`.
- red `plasmium-phial`; blue `injector-band`, `longclaw`, `spool-extender` (V); yellow `magnetite-brooch`, `magnetite-dice`, `ascendants-grip`, `compass` (V); white `silk-spear`.
- Fit: 1/3/4/1. Crest no; **+V yes**, exactly.
- goal: Use the Wanderer's fast slashes to fill Silk and heal often.
- why: Fast hits fill Silk quickly, Injector Band shortens the Bind, Magnetite Dice raises the Crest's small critical-hit chance, and Longclaw makes up for its short reach.
- Sources: G8-WA. Agreement 1; Magnetite Dice on Wanderer also ST-1/ST-2 player builds and wiki/Fextralife (snippet).

**`wanderer-explorer`**, "Explorer". `editorial: false`.
- red `plasmium-phial`; blue `injector-band`, `wispfire-lantern`; yellow `compass`, `dead-bugs-purse`, `ascendants-grip`; white `sharpdart`.
- Fit: 1/2/3/1. Crest yes, exactly.
- goal: Explore safely, keep Rosaries and climb walls with ease.
- why: Three yellow slots carry the map Compass, Rosaries kept on death and a better wall grip; the Lantern's wisps and Sharpdart deal damage with little effort.
- Sources: RG. Agreement 1.

**`wanderer-crit-damage`**, "Critical damage". `editorial: false`.
- red `flintslate`; blue `spool-extender`, `weavelight`, `longclaw`; yellow `magnetite-dice`, `barbed-bracelet`, `weighted-belt`, `compass`; white `rune-rage`.
- Fit: 1/3/4/1. Crest no; **+V yes**, exactly (which two are on the Vesticrest is not said).
- goal: Most damage per second from the Wanderer.
- why: Magnetite Dice is a rare yellow Tool that adds damage, through critical hits; Flintslate and Barbed Bracelet add more, and Spool Extender and Weavelight keep Silk high for those hits.
- Sources: one Steam player (the result names "Steam players" in the Wanderer threads ST-1, ST-2 and the "wander crest tool" thread; not which one). Agreement 1, low.

### Beast Crest (`beast-crest`)

**`beast-thread-storm-brawler`**, "Thread Storm brawler". `editorial: false`.
- red `plasmium-phial`, `flea-brew`; yellow `barbed-bracelet`, `weighted-belt`; white `thread-storm`.
- Fit: 2/0/2/1. Crest yes, exactly.
- goal: Stay close and trade hits, healing through the Beast's fury.
- why: Flea Brew speeds up the Beast's strikes, the Phial covers its unreliable healing, and the yellow Tools add damage and cut knockback so Hornet stays in range.
- Sources: GRE and RG name the same five. Agreement 2. Thread Storm may be weaker since a patch (DS).

**`beast-cross-stitch-brawler`**, "Cross Stitch brawler". `editorial: false`.
- red `flea-brew`, `plasmium-phial`; yellow `weighted-belt`, `magnetite-dice`; white `cross-stitch`.
- Fit: 2/0/2/1. Crest yes, exactly.
- goal: The same close-range plan with a safer Silk Skill and a chance to cancel hits.
- why: Flea Brew and the Phial carry the Beast's close fighting; Cross Stitch answers attacks and Magnetite Dice sometimes cancels a hit.
- Sources: G8-B. Agreement 3 on Flea Brew, Plasmium Phial and Weighted Belt (G8-B, GRE, RG).

**`beast-rabid-fiend`**, "Rabid Fiend". `editorial: false`.
- red `flintslate`; blue `longclaw` (V); yellow `barbed-bracelet`. White not named.
- Fit: 1/1/1/0+. Crest no (the Beast has no blue slot); **+V yes**.
- goal: All-out attack: hit fast and heal through hits.
- why: Flintslate and Barbed Bracelet add damage, Longclaw adds reach, and the Beast's healing through hits makes up for the damage Hornet takes.
- Sources: DS (entry 8, "Rabid Fiend"). Agreement 1.

### Witch Crest (`witch-crest`)

**`witch-bind-burst`**, "Bind burst". `editorial: false`.
- red `curveclaw` (guide names Curvesickle), `plasmium-phial`; blue `injector-band`, `spool-extender`, `claw-mirror` (guide names Claw Mirrors), `reserve-bind` (V); yellow `compass` (V); white `sharpdart`.
- Fit: 2/4/1/1. Crest no; **+V yes**, exactly. Only with the 3-blue Witch layout now in `data/` (sheet 1 conflict 1).
- goal: Fill Silk with long slashes and spend it on damaging, healing Binds.
- why: Spool Extender holds more Silk, Injector Band makes the Bind faster and Claw Mirror adds burst damage to it; the Phial heals when a Bind misses.
- Sources: G8-WI. Agreement 1 for the set; the blue trio (`injector-band`, `spool-extender`, `claw-mirror`) also GRE. Guide drawbacks: no yellow slot, no healing if the Bind misses.

**`witch-bind-burst-flea-brew`**, "Bind burst, faster". `editorial: false`.
- red `flea-brew`, `plasmium-phial`; blue `spool-extender`, `claw-mirror`, `injector-band`; white `sharpdart`.
- Fit: 2/3/0/1. Crest yes, exactly.
- goal: As above, trading the thrown blade for speed.
- why: Flea Brew speeds up the slashes that fill Silk; the rest feeds a Bind that heals and hurts. Only works if Hornet keeps chaining hits to heal.
- Sources: GRE. Agreement 2 (G8-WI differs only in one red Tool).

**`witch-heal-and-hit`**, "Heal and hit". `editorial: true`.
- blue `multibinder`, `injector-band`, `claw-mirror`. Red and white free.
- Fit: 0/3/0/0. Crest yes.
- goal: Make every Bind heal more and damage foes around Hornet.
- why: Multibinder splits the Bind into two heals, so Claw Mirror's burst fires twice; Injector Band makes up for the longer Bind.
- Sources: DS (Witch section, Claw Mirrors and Multibinder), ST-W (players call Multibinder and Injector Band "kinda mandatory"), SST. Agreement 3. Our grouping: no source in the results names the red and white picks with it.

### Architect Crest (`architect-crest`)

**`architect-red-barrage`**, "Red Tool barrage". `editorial: false`.
- red `tacks`, `cogwork-wheel`, `cogfly`; blue `pollip-pouch`, `quick-sling`, `spool-extender` (V); yellow `shard-pendant`, `scuttlebrace`, `magnetite-dice` (V). No white (the Crest has none).
- Fit: 3/3/3/0. Crest no; **+V yes**, exactly.
- goal: Fight mainly with red Tools and refill them away from a bench.
- why: Quick Sling throws two at once, Pollip Pouch poisons them, and Shard Pendant brings in the Shell Shards that the Crest's Craft Bind spends on refills.
- Sources: G8-A (recommends it mainly for bosses; drawback: grinding Shell Shards). Pollip Pouch on Architect also ST-A. Agreement 1 for the set.

**`architect-regenerating`**, "Regenerating". `editorial: false` (partial).
- red `plasmium-phial`; blue `fractured-mask`; yellow `ascendants-grip`. Other slots not named.
- Fit: 1/1/1/0. Crest yes (one Locket each on blue and yellow).
- goal: Stay alive by healing over time.
- why: The Architect's Craft Bind refills the Plasmium Phial away from a bench, keeping Hornet in its slow-healing state; Fractured Mask survives one fatal hit.
- Sources: DS (entry 7, "Regenerating Warrior"); wiki (snippet) on Craft Bind and the Phial. Agreement 1. Why Ascendant's Grip is in it was not in the result.

### Shaman Crest (`shaman-crest`)

**`shaman-silk-caster`**, "Silk caster". `editorial: false`.
- blue `spool-extender`, `volt-filament`, `weavelight` (V); yellow or blue `egg-of-flealia` (V, **missing id**); white `thread-storm`, `cross-stitch`, `pale-nails` (**missing id**).
- Fit: 0/3/1/3 only if Egg of Flealia is yellow. Sheet 1 has it blue (one source); then 0/4/0/3, which does not fit even +V. **Do not ship until its colour is known.**
- goal: Deal most damage with three Silk Skills.
- why: The Shaman boosts Silk Skills; Volt Filament adds more damage to each, and Spool Extender and Weavelight keep Silk coming.
- Sources: G8-S. Agreement 1. Thread Storm was reportedly weakened by a patch (DS picks `cross-stitch`, `silk-spear`, `sharpdart` instead).

**`shaman-act-3-caster`**, "Act 3 caster". `editorial: false`.
- blue `volt-filament`, `weavelight`, `wispfire-lantern` (one at V; the guide offers `spool-extender` instead of the Lantern); yellow `compass` (V); white `pale-nails` (**missing id**), `sharpdart`, `cross-stitch`.
- Fit: 0/3/1/3. Crest no; **+V yes**, exactly.
- goal: An end-game Silk Skill Build once Pale Nails is found.
- why: Pale Nails does most of the damage, Sharpdart moves Hornet and Cross Stitch answers attacks; Volt Filament charges all three, and Weavelight and the Lantern keep Silk working.
- Sources: GRA (Pale Nails, Volt Filament, Weavelight, Wispfire Lantern, Compass; other two Skills not in the result), GPM (all of it, low). Agreement 2 on the Tools.

## 2. Synergies

The contract (`docs/CONTRACTS.md`, `builds.json`, Synergy) shapes a synergy as `id`, `a`, `b`, `effect` and one `source` that **names both entries and the effect**. `a` and `b` must each be a Tool with `toolColor` or a Silk Skill, never an upgrade. A group below is written as its pairs. Proposed ids are `<a>-and-<b>`; all 18 Tool and Silk Skill pairs below pass the contract's id and type rules against `dataVersion` 10 (script check) and clash with no existing id. **The Crest and Tool pairs do not fit the contract** (a Crest is not placeable); they are kept below for template `goal` text or for the orchestrator to decide.

### Tool and Tool

| Ids | Effect (our words) | Sources (agreement) |
|---|---|---|
| `pollip-pouch` + `cogfly` | The Cogflies' hits poison as well, on top of their normal damage. | TG, KL (low), STG lists Pollip Pouch with red Tools. 2 |
| `pollip-pouch` + `plasmium-phial` | The extra Mask from the Phial turns purple and bursts after a few seconds into a large poison cloud. | ST-PP, STG, NX, SSO. 4 |
| `pollip-pouch` + `flintslate` | The Needle poisons on every hit instead of burning, but the damage bonus drops (about 50 to 30 percent). A trade-off, not only a gain. | STG, wiki (snippet), ST-FP. 3 |
| `pollip-pouch` + `flea-brew` | Hornet leaves poison clouds behind as she moves while the Brew lasts. | wiki (snippet), ST-C. 2 |
| `injector-band` + `claw-mirror` | A faster Bind that also hurts foes nearby, so healing and attacking happen together. | TG, G8-WI, ST-W. 3 |
| `multibinder` + `injector-band` | Injector Band makes up for the longer Bind of Multibinder. | ST-W, DS, SST. 3 |
| `multibinder` + `claw-mirror` | The Bind comes in two parts, so the mirror burst triggers twice. | ST-W, SST (one guide in the results). 2 |
| `wispfire-lantern` + `weavelight` | Weavelight refills the Silk the Lantern spends on wisps. Disputed: the wiki says Weavelight barely works in combat. | TG; against: wiki (snippet). 1 |
| `flintslate` + `flea-brew` | Faster attacks land more hits while Flintslate's bonus lasts. | TG, G8-R (both in one Build). 2 |
| `quick-sling` + `curveclaw` | Two returning blades at once, each hitting going out and coming back. Quick Sling spends two charges per throw. **The source names the upgrade, Curvesickle**; the contract allows only the base id, and no result says the base Curveclaw returns the same way. Hold until Athos checks. | TG (one summary only; another could not see it). 1 |
| `quick-sling` + `sting-shard` | Two traps at once for quick room clears. | one unnamed guide in the results. 1, low |
| `silkspeed-anklets` + `flea-brew` | The two speed bonuses add up (the wiki gives 57 percent together). | wiki (snippet). 1 |
| `thiefs-mark` + `shard-pendant` | Together they raised both Rosary and Shell Shard drops in a player's test. | ST-SP. 1 |
| `thiefs-mark` + `magnetite-brooch` | A Rosary farming pair: more Rosaries per kill, pulled in without collecting by hand. | ST-RF, PCG-R. 2 |

### Silk Skill and Tool

| Ids | Effect | Sources |
|---|---|---|
| `volt-filament` + `silk-spear` | More damage and extra electric hits. | wiki (snippet). 1 |
| `volt-filament` + `thread-storm` | More damage and extra electric hits. | wiki (snippet). 1 |
| `volt-filament` + `cross-stitch` | More damage and one extra electric hit. | wiki (snippet). 1 |
| `volt-filament` + `rune-rage` | Extra electric hits, more when many runes land on one foe. | wiki (snippet). 1 |

Volt Filament with any Silk Skill is also stated in general terms by G8-S, GRA and GPM (agreement 3). One pair per Silk Skill keeps the ADR's two-id shape; `pale-nails` and `sharpdart` would follow only if a source names them.

### Crest and Tool (not synergies under the contract)

| Ids | Effect | Sources |
|---|---|---|
| `architect-crest` + `shard-pendant` | More Shell Shards from foes for the Crest's Craft Bind refills. | wiki (snippet), G8-A. 2 |
| `architect-crest` + `plasmium-phial` | Craft Bind refills the Phial away from a bench, so Hornet can keep its slow healing. | wiki (snippet), DS. 2 |
| `wanderer-crest` + `magnetite-dice` | Raises the Crest's critical-hit chance a little (2 to 2.2 percent). | wiki (snippet), Fextralife (snippet), Steam players. 3 |
| `shaman-crest` + `volt-filament` | Both raise Silk Skill damage, and the two bonuses add up. | wiki (snippet), G8-S, GRA. 3 |
| `reaper-crest` + `flea-brew` | Speeds up the Reaper's slow swings. | G8-R. 1 |
| `reaper-crest` + `spool-extender` | The Reaper earns Silk mostly after a Bind, so a bigger Silk store keeps heals ready. | G8-R, HG. 2 |
| `hunter-crest` + `flea-brew` | Fully evolved: faster hits build the Crest's damage bonus quicker than Flintslate helps. | wiki (snippet). 1 |

### Pairs that work against each other (not synergies; for the `effect` text or a warning)

- `architect-crest` with `injector-band`, `claw-mirror` or `warding-bell`: they do not act on the Craft Bind (wiki (snippet)); Reserve Bind does. `architect-red-barrage` avoids them.
- `quick-sling` does not double Flintslate, Flea Brew, Plasmium Phial, Silkshot, Delver's Drill or Rosary Cannon (G8-TL page on Quick Sling, sheet 1).
- `snitch-pick` lowered Rosary drops in a player's test (ST-SP), so it fights Rosary farming with `thiefs-mark`.
- Two poison sources do not stack on one foe (wiki (snippet)), so `pollip-pouch` pairs do not multiply.
- `pollip-pouch` + `flintslate` (above) is a trade-off.

## 3. Facts that conflict between guides

1. **Witch slots.** Fextralife (snippet): starts 1 red 1 blue, ends 2 red 3 blue. Nintendo Life: 2 red, then +3 blue. eGamersWorld: +1 red +1 blue. `data/` has 2/0/0/1 to 2/3/0/1. Game8's Witch template needs 3 blue on the Crest plus the Vesticrest blue, which **supports a 3-blue maximum**; it says nothing about the start.
2. **Shaman extra slots.** Game8, GameRant and Gaming ProMax templates all put two or three blue Tools on the Shaman, and Deltia's and allthings.how say +2 blue. That **supports 0/2/0/3** against Nintendo Life's +2 white.
3. **Egg of Flealia colour.** Blue in sheet 1 (one source). Game8's Shaman template puts it on the Vesticrest beside Weavelight (blue), which needs it to be yellow. Not in `data/`.
4. **Vesticrest thresholds.** wiki (snippet) 12 and 20 slots; Sportskeeda 4 and 15; Deltia's 3 Memory Lockets, then 5 Crests and 6 Memory Lockets. Matters to when "+V" templates become usable.
5. **Magnetite Dice colour.** Yellow (Fextralife (snippet), silk-song.org, `data/`) against red (silksong.codes, low). How to win it: 5 games (Fextralife (snippet)) or 10 (silk-song.org); both say Grindle sells it for 300 in Act 3.
6. **Thread Storm strength.** Older templates (G8-B, G8-S, GRE, RG, DG-E) use it; DS says a patch weakened it. Templates may be dated; most pages are about a year old.
7. **Weavelight in combat.** TG's Lantern combo relies on it; wiki (snippet) says the regeneration delay makes it nearly useless in fights.
8. **Volt Filament numbers.** +25 percent (wiki (snippet)) against a later patch raising it by 15 to 40 percent per Skill; Sportskeeda calls it purple. Shaman plus Volt Filament on Thread Storm: +65 percent (wiki (snippet), one source).
9. **Bind Tool numbers.** Injector Band 33 percent (one guide) or 40 percent (sheet 1); a forum post says it skips a Claw Mirror hit; Claw Mirror damage 15 to 20 against 30 per burst.
10. **Thief's Mark.** Price 250 or 350; effect "+60 percent Rosaries" or "55 per kill".
11. **Ascendant's Grip.** wiki (snippet): Hornet sticks to walls with Cling Grip (sheet 1 had "not found"); one guide: less fall damage.
12. **"Elongated Claw"** in Gamereactor's Hunter build: read as Longclaw.
13. **silksong.codes** builds use Tool names and colours no other source has (for example "Throwing Daggers", "Silk Barrier", Magnetite Dice as red). Ignored.
14. **Tier lists disagree** on every Crest (Reaper S at Game8, Witch C at Rectify and S at Game8 and Deltia's). Templates do not depend on tiers.

## 4. Counts, risks and a brief for Dev C

**Counts** (fits checked by a script against the `slots`, `slotsMax` and `toolColor` in `data/` `dataVersion` 10, counting `pale-nails` as white). 20 templates: Hunter 4, Reaper 3, Wanderer 3, Beast 3, Witch 3, Architect 2, Shaman 2. 18 `editorial: false`, 2 `editorial: true`. Fit: 11 fit the Crest's own `slotsMax` (`hunter-steady-mix`, `hunter-everyday-silk`, `hunter-evolved-needle`, `reaper-summons-and-heal`, `reaper-early-game`, `wanderer-explorer`, `beast-thread-storm-brawler`, `beast-cross-stitch-brawler`, `witch-bind-burst-flea-brew`, `witch-heal-and-hit`, `architect-regenerating`; two of them, `hunter-evolved-needle` and `reaper-early-game`, fit the starting slots), 8 fit only with the Vesticrest, 1 (`shaman-silk-caster`) fits with the Vesticrest only if Egg of Flealia is yellow. 18 synergies in the contract's shape (14 Tool and Tool, 4 Silk Skill and Tool), plus 7 Crest and Tool pairs the contract cannot hold and 5 pairs that work against each other. Agreement of two or more sources: 7 templates and 9 of the 18 synergies.

**Riskiest items.**
1. **Vesticrest.** 8 templates need it, and `data/` has no Vesticrest entry with `grantsSlots`. Under ADR 0007 point 6 the validator checks templates "at everything done, every slot opened", so those 8 fail until Dev C adds the two Vesticrest entries (their thresholds are disputed, conflict 4), or until they are trimmed to the Crest's own slots.
2. **Missing ids:** `pale-nails` (3 templates), `egg-of-flealia` (1). Both wait for their Region's data.
3. **One-source templates (13 of 20)**, read only as search summaries, about a year old and possibly from before the Thread Storm change. A summary can drop a Tool (`hunter-everyday-silk` has no red Tool for Pollip Pouch to poison).
4. **Witch and Shaman fits** rest on disputed layouts; the templates themselves are evidence (conflicts 1 and 2), not proof.
5. **Synergies from wiki (snippet) only** (5 contract-shaped pairs: the four Volt Filament and Silk Skill pairs and `silkspeed-anklets` + `flea-brew`; also the `hunter-crest` + `flea-brew` note): the wiki was never opened, so their `source` would be a page no agent read; Athos should read those pages before the text ships.
6. **The contract's synergy rule excludes Crests.** The Crest and Tool pairs (several with agreement 2 or 3, such as `wanderer-crest` + `magnetite-dice`) can only reach the player through a template's `goal`, unless the orchestrator widens `a`/`b`.

**Brief for Dev C.** Aligned with the `builds.json` section of `docs/CONTRACTS.md` as it stood at the end of this research (third round, text awaiting Athos's review; re-read it before starting).
- **Templates:** one per block in section 1. `id` = the slug in bold (checked unique against the current files), `crestId`, `name`, `goal` (as written, all under 200 characters), `build` = `{ red, blue, yellow, white }` with only the non-empty lists, ids in the order given, base ids, no "(V)" marks, `editorial` as marked, `source` = **one** URL: the first source code listed for that template (for `editorial: true`, the page the `goal` rests on: the Hunter Crest wiki page for `hunter-evolved-needle`, DualShockers for `witch-heal-and-hit`). The contract has **no `why` field**: leave `why` out, or the orchestrator adds an optional field; the `why` lines are kept under 200 characters for that case.
- **Synergies:** one per row of the two first tables in section 2: `id` = `<a>-and-<b>`, `a`, `b`, `effect` from the table (shorten if needed; keep the "trade-off" wording for `pollip-pouch-and-flintslate`), `source` = one URL that names both (the first code listed). Not the Crest and Tool rows, not the "work against each other" list: the contract has no place for them.
- **Rule 15 today:** it checks templates with `checkBuild` at "every entry done, every slot opened", so a template needing the Vesticrest fails until the two Vesticrest entries with `grantsSlots` are in `data/`. Rule 15's note "today no Crest in `data/` has `slots`" is out of date since `dataVersion` 10.
- **Ship first only what is safe:** the 9 templates that fit the Crest's own slots and use only ids that exist (`hunter-evolved-needle`, `reaper-summons-and-heal`, `reaper-early-game`, `wanderer-explorer`, `beast-thread-storm-brawler`, `beast-cross-stitch-brawler`, `witch-bind-burst-flea-brew`, `witch-heal-and-hit`, `architect-regenerating`; `hunter-steady-mix` waits for `pale-nails`, `hunter-everyday-silk` looks incomplete), and the 9 synergies with agreement 2 or more (the four `pollip-pouch` pairs, the three Bind pairs, `flintslate-and-flea-brew`, `thiefs-mark-and-magnetite-brooch`). The rest wait for the Vesticrest entries, `pale-nails`, `egg-of-flealia`'s colour, or Athos's check.
- Run `node scripts/validate-data.js` and the tests; a template that fails `checkBuild` goes back to the orchestrator, never trimmed by guesswork.
- Nothing here is checked by Athos yet. He decides which templates and pairs go in.
