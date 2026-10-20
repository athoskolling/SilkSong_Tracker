# Research for checklist items 4 and 8 (orchestrator, 2026-10-20)

Prepared at Athos's request ("keep going, you can search whatever you want"). **These are findings, not decisions.** Item 4 (wiki license and terms) and item 8 (first batch) in `docs/PHASE-0-CHECKLIST.md` stay unchecked until Athos decides. Pages were read one at a time by hand (web search and single page fetches); nothing was read in bulk. Not legal advice.

## Item 4: what the sources allow

### hollowknight.wiki (the main wiki named in the plan)

- It refuses automated reading: every fetch returns **HTTP 403**, including its copyright page (`Hollow Knight_Wiki:Copyrights`). So its license could not be read by the orchestrator. **Athos needs to open it in his browser** (footer of any page, or the copyright page) and note the license name.
- The 403 to automated clients is itself a signal: the wiki does not want bots. A draft script (`tools/draft-from-wiki.js`) reading it would go against that, whatever the license says.
- For comparison only: the older Fandom Hollow Knight wiki states its text is **CC BY-SA** (3.0 Unported on its copyright page), unless otherwise noted. hollowknight.wiki is a separate, independently hosted site, so its license may differ. Sources: [Fandom community portal](https://hollowknight.fandom.com/wiki/Hollow_Knight_Wiki:Community_Portal), [Fandom copyright page (Italian)](https://hollowknight.fandom.com/it/wiki/Hollow_Knight_Wiki:Copyright).

### Fextralife (used for the slice's two entries)

`fextralife.com/terms-of-use` redirects to its owner's terms, [Valnet Terms of Use](https://www.valnetinc.com/en/terms-of-use). Read 2026-10-20:

- **Section 4:** content is "the intellectual property of Valnet or its licensors".
- **Section 5:** original content may be reproduced for non-commercial purposes **with a mandatory credit**, images excluded; "All other copying, rearrangement, broadcast, **rewriting for broadcast or publication**, redistribution, modification ... is strictly prohibited."
- **Section 15:** no crawling or spidering, no scraping, automatic download, data mining or harvesting, and no use of content to train AI.

What this means for us (orchestrator's reading):
- **No script may ever read Fextralife.** That rules it out for `tools/draft-from-wiki.js`.
- **Rewriting their pages for publication is something their terms forbid**, even in our own words. Facts themselves (an item's name, where it is, what it needs) are not anyone's property, but drafting our text *from their article* is close to what Section 5 prohibits.
- **Linking to a Fextralife page as `source` is a link, not a copy.** It is fine.
- **The slice's two entries** (Moss Mother, Silk Spear) were researched from two Fextralife pages and other guides, and their `how` texts are short and in our words. Recommendation: Athos checks both facts against his own play or the main wiki, and from Phase 3 on, Fextralife is not used as a drafting source.

### Options for Athos (item 4)

1. **Recommended.** No draft script. Entries are written by Athos from his own play, checked against the main wiki read by hand in the browser (one page at a time), in our own words, with a `source` link. Other guides are used only to cross-check a fact, never as the text we rewrite. Slower, but clean.
2. Draft script on the main wiki **only if** its license allows reuse (for example CC BY-SA, with attribution and share-alike) **and** its operators allow automated access (today they block it, so this would need their permission).
3. Something in between that Athos decides after reading the wiki's license.

## Item 8: is the first batch Moss Grotto, The Marrow and Deep Docks?

The guides agree on the opening order, with one question for Athos:

- **Moss Grotto** is where the game starts; its first boss sits behind breakable moss walls.
- **Bone Bottom** comes next on Nintendo Life's route (Moss Grotto, Bone Bottom, The Marrow, Deep Docks), but PCGamesN's area list leaves it out. Guides call it the first village and place it in Moss Grotto, and the first map Shakra sells is described as covering "Bone Bottom/Moss Grotto". **Decision for Athos: is Bone Bottom its own Region, or a Sub-area of Moss Grotto?** `GLOSSARY.md` uses it as the example of a Sub-area, which fits the guides, but only Athos's in-game map settles it.
- **The Marrow** follows; Shakra the map seller is there.
- **Deep Docks** comes after The Marrow; a fight with Lace there opens the way to Far Fields.
- **Hunter's March** can be reached early from The Marrow, but cannot be crossed without the Drifter's Cloak, so it belongs to a later batch.
- The guides disagree on which boss opens The Marrow (Moss Mother or Bell Beast). The slice uses Moss Mother, confirmed by Athos. Athos may want to check where Bell Beast fits before writing The Marrow.

Sources: [Nintendo Life progression route](https://www.nintendolife.com/guides/hollow-knight-silksong-progression-guide-recommended-route), [PCGamesN map and area order](https://www.pcgamesn.com/hollow-knight-silksong/map), [KeenGamer Deep Docks walkthrough](https://www.keengamer.com/articles/guides/hollow-knight-silksong-deep-docks-walkthrough/), [Scalacube Marrow guide](https://scalacube.com/blog/hollow-knight/hollow-knight-silksong-the-marrow-full-guide), [Deltia's Gaming, Shakra locations](https://deltiasgaming.com/?p=336998).

### Options for Athos (item 8)

1. **Recommended.** Batch 1 = Moss Grotto (with Bone Bottom as a Sub-area, if his map agrees), The Marrow, Deep Docks, as planned.
2. The same three, plus Bone Bottom as a fourth Region if the game's map treats it as its own area.
