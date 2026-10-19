# Sample data

**Not guide data.** These three files use invented names (`sample-...`) so that tests and layout work have something to run on. They contain no Silksong facts, and nothing in them may be copied into `data/`.

They cover the cases `docs/CONTRACTS.md` talks about:

- a Region open from the start, a Region that needs an entry (`sample-region-b` needs `sample-ability`), and a Region with no entries yet (`sample-region-c`, which needs `sample-boss`);
- a requirement chain (`sample-ability` -> `sample-key` -> `sample-door` -> `sample-shard` -> `sample-charm`);
- a Task (does not count) next to Collectibles (do count);
- a missable entry with its note;
- two Endings where one locks out the other.

Owner: the orchestrator. QA 1 runs the validator on this folder to check the validator itself: `node scripts/validate-data.js data/sample` must pass, and tests may copy these files and break them on purpose (a cycle, a missing id, a duplicate step) to prove each rule fires.

The top-level `_note` key is ignored by the code and the validator.
