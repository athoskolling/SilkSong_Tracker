# Sample data

**Not guide data.** These three files use invented names (`sample-...`) so that tests and layout work have something to run on. They contain no Silksong facts, and nothing in them may be copied into `data/`.

They cover the cases `docs/CONTRACTS.md` talks about:

- a Region open from the start, a Region that needs an entry (`sample-region-b` needs `sample-ability`), and a Region with no entries yet (`sample-region-c`, which needs `sample-boss`);
- a requirement chain (`sample-ability` -> `sample-key` -> `sample-door` -> `sample-shard` -> `sample-charm`);
- a Task (does not count) next to Collectibles (do count);
- a missable entry with its note;
- two Endings where one locks out the other.
- (added in Phase 2, for the Home and Route screens) a second Region open from the start (`sample-region-e`), a Region opened by a Task in it (`sample-region-d` needs `sample-lever`), an entry that needs an entry from another Region (`sample-flea` needs `sample-key`), a Task that opens a Collectible (`sample-quest` -> `sample-tool-two`), an entry with no requirements inside a Locked Region (`sample-skill`), a second missable entry, more Collectible types (crest, flea, silk-skill) for "Collectibles by type", and a hero image on `sample-region-a` (Athos's Deep Docks placeholder, credited).

The Region states Complete and Visited come from Progress, not from the data: mark entries with `?data=sample` to see them.

Owner: the orchestrator. QA 1 runs the validator on this folder to check the validator itself: `node scripts/validate-data.js data/sample` must pass, and tests may copy these files and break them on purpose (a cycle, a missing id, a duplicate step) to prove each rule fires.

Collectible `type` values use the approved list (`docs/CONTRACTS.md` section 6, rule 12). Ids never change because tests use them, so a few names no longer match their id (`sample-flea` is now "Sample silk heart", `sample-charm` is "Sample needle upgrade"); that is fine for invented data.

The top-level `_note` key is ignored by the code and the validator.
