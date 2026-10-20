# Research for batch 1: what counts, and how many Endings (orchestrator, 2026-10-20)

**Spoiler warning:** the Endings section names endings and what they need.

Findings for Athos's two questions in `docs/PHASE-3-BATCH-1.md`, from web search results only (no page of hollowknight.wiki or Fextralife fetched). **Not decisions, and nothing here goes into `data/`.** The sources do not fully agree; where they differ, both readings are given. Athos decides from his own play and the main wiki.

## 1. What the game counts toward completion

The guides agree on a core list, which matches the Collectible definition in `GLOSSARY.md` (stat items, Needle upgrades, abilities, Crests, Tools):

- every stat-increase item (Mask Shards for health, Spool Fragments for silk);
- every Needle upgrade;
- every ability (Ancestral Arts and Silk Skills);
- every Crest;
- every Tool. Upgraded versions of a Tool are not counted separately.

A fuller list, which TrueAchievements says comes from the game's code, adds:
- Silk Hearts;
- Crafting Kit upgrades;
- Tool Pouch upgrades;
- Sylphsong (from binding Eva);
- Everbloom.

Not required, by the same sources: defeating every boss, completing every Wish (unless tied to one of the items above), and the Hunter's journal. Fleas and maps are not mentioned as counting.

Counts given by one source (unverified): 57 Tools without upgrades, 20 Mask Shards, 18 Spool Fragments. The weighting of the game's own percentage differs between sources. That matters little, because the site shows its own counts, never the game's percentage (`docs/STRUCTURE.md` section 2).

**Question for Athos:** should the site's Collectibles follow the fuller list (adding Silk Hearts, Crafting Kit and Tool Pouch upgrades, Sylphsong and Everbloom as types), so that "everything" on the site matches the game's 100 percent? Then fleas, maps and similar stay out, unless he wants them as Tasks.

Sources: [Gamer Guides 100% checklist](https://earth.gamerguides.com/hollow-knight-silksong/guide/getting-started/tips-and-tricks/hollow-knight-silksong-100-completion-checklist), [TrueAchievements, Speed Completion](https://www.trueachievements.com/a589297/speed-completion-achievement), [game-checklists.com 100%](https://game-checklists.com/silksong/100-percent.html).

## 2. How many Endings

The plan says V1 stores **five** Endings. The sources say:

- **Four main endings** is the consensus: Weaver Queen, Snared Silk, Twisted Child and Sister of the Void.
- One source says five "including a hidden ending", but lists only four.
- Another lists a further ending that needs full completion and a hidden item.
- Another calls the fifth a secret cutscene rather than an ending.
- Lockouts exist: for example, one source says Weaver Queen requires *not* having reached Snared Silk.

**Question for Athos:** how many Endings should V1 store, four or five (or six), and which ones? The number "five" in `docs/STRUCTURE.md` was written before this research. The model supports any number, so this is a content decision, not a code change.

Sources: [hollowknight.wiki: Endings (Silksong)](https://hollowknight.wiki/w/Endings_(Silksong)) (link only, not fetched), [Deltia's Gaming, all endings](https://deltiasgaming.com/?p=339099), [Gamer Guides endings guide](https://www.gamerguides.com/hollow-knight-silksong/guide/walkthrough/act-2/endings-guide), [SteelSeries endings FAQ](https://steelseries.com/en-gb/blog/hallow-knight-silksong-endings-guide), [Rogue Ranker, all endings](https://rogueranker.com/?p=10576).
