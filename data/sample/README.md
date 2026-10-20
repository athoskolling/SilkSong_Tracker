# Sample data

**Not guide data.** These files use invented names (`sample-...`) so that tests and layout work have something to run on. They contain no Silksong facts, and nothing in them may be copied into `data/`.

They cover the cases `docs/CONTRACTS.md` talks about:

- a Region open from the start, a Region that needs an entry (`sample-region-b` needs `sample-ability`), and a Region with no entries yet (`sample-region-c`, which needs `sample-boss`);
- a requirement chain (`sample-ability` -> `sample-key` -> `sample-door` -> `sample-shard` -> `sample-charm`);
- a Task (does not count) next to Collectibles (do count);
- a missable entry with its note;
- two Endings where one locks out the other.
- (added in Phase 2, for the Home and Route screens) a second Region open from the start (`sample-region-e`), a Region opened by a Task in it (`sample-region-d` needs `sample-lever`), an entry that needs an entry from another Region (`sample-flea` needs `sample-key`), a Task that opens a Collectible (`sample-quest` -> `sample-tool-two`), an entry with no requirements inside a Locked Region (`sample-skill`), a second missable entry, more Collectible types (crest, flea, silk-skill) for "Collectibles by type", and a hero image on `sample-region-a` (Athos's Deep Docks placeholder, credited).

- (added in Phase 5, task P5-11, for the Trackers page, the Rosaries page and the Build picker) everything in two new Regions, so the numbers tests pin for Regions A to E do not move. `sample-region-f` is open from the start; `sample-region-g` is Locked until `sample-cloak` is done.
  - **Not counted** (`counts: false`): `sample-cloak` (an ability that Region G, `sample-crest-two`, `sample-yellow-tool` and `sample-slot-upgrade` need), `sample-crest-three`, `sample-red-tool-plus`, `sample-memento` and `sample-memento-two` (type `memento`), and `sample-map` (type `map`, for the Equipment tab). Region F counts 8 Collectibles and Region G counts 2.
  - **Crests:** `sample-crest-one` has `slots` and `slotsMax` (one blue and one yellow slot can be opened); `sample-crest-two` has `slots` and no `slotsMax` (opened slots are ignored); `sample-crest-three` has no `slots` ("Not in the guide yet" in the picker, like `sample-crest`); `sample-crest-four`, in the Locked Region, has `slotsMax` equal to `slots` (nothing to open).
  - **Tools:** red (`sample-red-tool`, `sample-red-tool-two`, so a Crest with one red slot can run out of room), blue (`sample-blue-tool`), yellow (`sample-yellow-tool`, `sample-yellow-tool-two`) and one with no `toolColor` (`sample-plain-tool`, never offered by the picker). `sample-red-tool-plus` has `upgradeOf: "sample-red-tool"`. `sample-white-skill` is a Silk Skill for white slots.
  - **Slots for every Crest:** `sample-slot-upgrade` is a Task with `grantsSlots` (one blue, one yellow).
  - **Prices:** 7 priced entries, 1000 Rosaries in all. With nothing done, 210 can be spent now (`sample-blue-tool` 80, `sample-memento` 90, `sample-map` 40); the rest needs `sample-cloak` or `sample-red-tool`, and `sample-yellow-tool-two` (220) sits in the Locked Region. One priced entry is a Task (`sample-slot-upgrade`, 300).
  - `effect` is set on a few entries to show where that text goes.

- (added in Phase 5, task P5-36, for the Places section of the Region page, "Sold by" on the Rosaries page and the Templates and Synergies of the Build picker) two optional files, `builds.json` and `places.json`. They point at entries and nothing points at them, so `items.json`, `regions.json` and `endings.json` are unchanged and no count, Route number or Rosaries total moves.
  - **Templates** (`builds.json`), only on the two Crests that have both `slots` and `slotsMax`:
    - `sample-template-ready` (`sample-crest-one`, "Our suggestion"): red `sample-red-tool`, blue `sample-blue-tool`, white `sample-white-skill`. Ready as soon as the three are done, with no slot opened.
    - `sample-template-opened-slot` (`sample-crest-one`, `editorial: false`, "From a guide"): red `sample-red-tool-two`, yellow `sample-yellow-tool`, white `sample-white-skill`. Once the three are done it shows "Needs more slots: 1 yellow" until a yellow slot is opened on the Crest (Progress `crestSlots`); the done `sample-slot-upgrade` also gives that slot. `sample-yellow-tool` needs `sample-cloak`, so it is also the "Needs X" case at first.
    - `sample-template-granted` (`sample-crest-four`, "Our suggestion"): blue `sample-blue-tool`, yellow `sample-yellow-tool` and `sample-yellow-tool-two`, white `sample-white-skill` and `sample-skill`. The Crest has nothing to open, so the second yellow fits only once `sample-slot-upgrade` (a `grantsSlots` Task) is done. Two of its ids sit in Regions that start Locked and not Visited (`sample-yellow-tool-two` in G, `sample-skill` in D), for the hidden-name case.
    - No sample template uses an entry that is off the Route: none of the five entries off it can go in a Build (an upgrade, a Crest, two Mementos, a map), and adding one would move the pinned off-Route list.
  - **Synergies:** `sample-synergy-active` (`sample-red-tool` with `sample-white-skill`) is whole inside `sample-template-ready` ("Works together"). `sample-synergy-pair` (`sample-blue-tool` with `sample-red-tool-two`) is never whole in a sample template; with `sample-template-ready` it shows `sample-red-tool-two` under "Pairs well with" once that Tool is done.
  - **Places** (`places.json`), all eight kinds over five Regions:
    - Region A (open): `bench-sample-landing` (no requirement; its `source` is the MapGenie Silksong address, a link only, never opened), `bellway-sample-landing` ("Needs" `sample-ability`), `arena-sample-pit` (needs `sample-key`, a two-step chain: `sample-ability`, then `sample-key`).
    - Region E (open, not Visited until something there is ticked): `npc-sample-hermit`, `wishboard-sample-board`, and `shop-sample-tinker`, which sells one unpriced entry (`sample-tool-two`).
    - Region F (open): `bench-sample-market` (a second bench), `shop-sample-market` (sells the six priced entries of Region F) and `other-sample-fountain` (needs `sample-cloak`).
    - Region G (Locked until `sample-cloak`): `shop-sample-pedlar` (sells `sample-yellow-tool-two` and `sample-map`) and `door-sample-gate`.
    - Region C (Locked, no entries): `bench-sample-ruin`, for "Not in the guide yet" with Places.
  - **Two vendors, one priced entry:** `sample-map` (40) is sold by `shop-sample-market` (F) and `shop-sample-pedlar` (G). While G is not shown, the Rosaries page names the market stall and says "Sold in a region you have not visited" for the other.

The Region states Complete and Visited come from Progress, not from the data: mark entries with `?data=sample` to see them. Every sample entry is hidden until its Region is Visited, so a fresh sample Progress shows the hidden state; mark Region F Visited (or one entry in it) to see its entries.

`dataVersion` is 3 in all five files: it went from 1 to 3 in P5-11, skipping 2, because a validator test sets one file's `dataVersion` to 2 to make it differ from the others. P5-36 added `builds.json` and `places.json` at 3 as well, without raising it: the validator tests that write their own `builds.json` and `places.json` into a copy of this folder write `dataVersion` 3, so a raise must wait until those tests read the version from the sample instead.

Owner: the orchestrator. QA 1 runs the validator on this folder to check the validator itself: `node scripts/validate-data.js data/sample` must pass, and tests may copy these files and break them on purpose (a cycle, a missing id, a duplicate step) to prove each rule fires.

Collectible `type` values use the approved lists (`docs/CONTRACTS.md` section 6, rule 12: counted types, and the tracked-only types for `counts: false`). Ids never change because tests use them, so a few names no longer match their id (`sample-flea` is now "Sample silk heart", `sample-charm` is "Sample needle upgrade"); that is fine for invented data.

The top-level `_note` key (in every file) is ignored by the code and the validator.
