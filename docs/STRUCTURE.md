# Silksong Guide: project structure

Planning document, written before the code. The vertical slice (Phase 1) now exists; `docs/PROGRESS-LOG.md` has the current state. Terms in **bold** are defined in `GLOSSARY.md`.

> Translated from Athos's Portuguese original (`athos-notes-pt-br/silksong-estrutura.md`) and updated after the design phase. Changes from the original are listed in section 13.

## 1. Vision

A progress guide for Hollow Knight: Silksong, built for finishing the game at maximum completion: collect everything and reach every ending.

The player follows the guide, marks what they finished and sees what is still missing. The site starts empty (a new game) with no progress baked into the code.

How it differs from Hollow-Thingy: this is a **guide**, not only a checklist. It carries a suggested order, requirements, warnings about missable entries and what unlocks what.

## 2. Decisions already made

- New, separate repository (created later, without hurry).
- Same stack as Hollow-Thingy: plain HTML + CSS + JavaScript, no framework and no backend of our own.
- Login and sync: the site's own Firebase project (Auth + Firestore), separate from Hollow-Thingy (ADR 0004).
- No visual game map. Text and checklists only.
- Minimal visual style, nothing that looks "made by AI". The visual design is settled; see `docs/DESIGN.md` and `docs/design/`.
- Data source: the game's main wiki, with MapGenie as a fallback reference when information is missing. A link to MapGenie's Silksong map may be a `source`, but only to cite where something is, never as the origin of our text; agents never open or scrape it, so only Athos can check such a link (Athos, 2026-10-20; `docs/CONTRACTS.md` section 1, "Sources and MapGenie").
- **Local first:** progress is saved in the browser (localStorage) by default and synced to Firestore after sign-in. The site works without an account.
- **Backup:** export and import progress as JSON.
- **Site language:** English only (names, text and interface). No translation layer.
- **Two kinds of entry:** Collectible (counts toward progress) and Task (tracked, but does not count). The "X of Y" counters use counted Collectibles only. See `GLOSSARY.md`.
- **Counts follow the game; Trackers are wider** (Athos, 2026-10-20, ADR 0005): the headline counts use only what the game counts toward 100 percent. Mementos and Equipment are Collectibles marked `counts: false`: tracked on their own Tracker with their own done and total, never in the headline number.
- **Rosaries without a number in Progress** (Athos, 2026-10-20, ADR 0005): shop entries carry a `price`; the player marks them done when bought, and the Rosaries still to spend are worked out from the prices of what is not bought yet. Rosaries are never a number in Progress.
- **One entry per thing** (Athos, 2026-10-20): something the player obtains is a Collectible even when the story needs it; if the game does not count it, it is `counts: false`, and what it opens lists it in `requires`. The Drifter's Cloak moves from Task to such a Collectible (same id); the Hunter Crest is a normal entry the player ticks, not counted.
- **A few player choices in Progress** (Athos, 2026-10-20, ADR 0006): the opened slots per Crest (Memory Lockets spent) and one saved Build per Crest. Optional fields, so older Progress still loads; the Firestore rules accept them as optional keys.
- **Shell Shards like the Rosaries** (Athos, 2026-10-20, ADR 0007): no Shell Shards number in Progress; what the site shows about them is worked out from entries. Which entries and which field waits for research (`docs/CONTRACTS.md` section 8).
- **Build templates and synergies** (Athos, 2026-10-20, reversing "no templates" of the same day; ADR 0007): suggested Builds per Crest and pairs of Tools that work together, each with a source, in their own file `data/builds.json`. A Template is either our grouping or a guide's; using one fills the picker and never saves by itself.
- **Places** (Athos, 2026-10-20, "whenever needed"; ADR 0007): benches, Bellway stations, shops, NPCs and other fixed spots per Region, in `data/places.json`. Not entries: never done, never counted, not on the Route, nothing in Progress. Shown on the Region page; a shop's stock links the Rosaries page to where to buy.
- **Endings:** four (the four main endings; Athos, 2026-10-20, replacing the earlier "five"). The model supports them in V1, but **their data ships with the late-game batch, not in V1** (Athos, 2026-10-20): an Ending's conditions must be existing entries, and those entries are late-game. When they ship, each has conditions and a `locksOut` warning. The full endings screen is outside V1. `missable` on entries is optional and defaults to `false`.
- **Our own counts:** per-category counters ("Tools: 12 of 51"), never claiming to reproduce the game's completion percentage.
- **One Run per account** in V1. "New run" offers an export before clearing.
- **First sign-in:** union of local and cloud Progress; after that, the latest write wins.
- **Spoilers:** Collectibles in Regions that are not Visited stay hidden by default, with an option to show everything.
- **Firebase:** own project (ADR 0004, replaces the shared project of ADR 0002); rules are published only after passing Firebase Emulator tests.
- **Vertical slice before parallel work:** one Region, two entries, a working requirement chain and a real login, end to end. Only then widen.
- **Global Route:** `step` is one sequence across all Regions; region pages are filtered views of that Route. Since Phase 5 the Route holds what leads to 100 percent and the Endings (counted Collectibles, Tasks, `missable` entries and everything they and the Regions need); a tracked-only extra that nothing on the Route needs is off the Route and appears only on its Region page and its Tracker (orchestrator, delegated by Athos, 2026-10-20; `docs/CONTRACTS.md` section 1, "On the Route or not").
- **Visited and Available Regions:** *Visited* is set by hand and also automatically when the player completes something in the Region (it controls spoilers). *Available* is computed from the Region's `requires`, based on Progress.
- **Locked Regions:** show only the name and what is missing (for example "needs Swift Step"); they open when the requirements are met.
- **All Regions in the model, content in batches:** the model and interface support the whole game from the start; content ships in batches, only after it is verified.
- **Tasks in V1:** only the ones that unlock a Collectible.
- **Sub-areas:** a text label (`area`) on each entry, with no pages or unlock logic of their own.
- **Data authorship:** written by Athos from his own play and checked against the main wiki read by hand, in our own words (Athos, 2026-10-20; there is no draft script; see section 8).
- **Hosting:** GitHub Pages from the start (see section 10).
- **ADRs written:** `0001` (local-first with union merge), `0002` (shared Firebase, superseded), `0003` (permanent ids), `0004` (own Firebase project), `0005` (counts follow the game, Trackers are wider, prices on entries), `0006` (player choices in Progress) and `0007` (Build templates, synergies and Places in their own data files; Shell Shards leave Progress), in `docs/adr/`.

## 3. V1 scope

In:
- Data model and interface ready for every Region; content published in batches. First batch: Moss Grotto, The Marrow and Deep Docks (the game's opening order; confirm on the wiki).
- Global Route (`step`) and Locked Regions showing what is missing.
- Per-Region tracking (mark entries as done).
- A "what is missing" view: pending entries per Region and what is needed to unlock the next entry or Region.
- Local Progress plus JSON export and import.
- Firebase login and sync between devices.
- Guide fields in the data model: `missable`, `step`, `spoiler` (the interface can use them in a simple way in V1).

Out of V1 (later):
- Content for Regions outside the first batch (arrives in later batches, as it is verified).
- Reading the game's save file automatically (now in Phase 5, below, as the last step).
- The complete endings screen and a total completion percentage.
- Endings data (ships with the late-game batch; Athos, 2026-10-20).
- Search, advanced filters and a full offline mode.

### Phase 5 scope: the full tracker (Athos, 2026-10-20)

Plan and order: `docs/PHASE-5-FULL-TRACKER-PLAN.md`. Comes before the Act 2 and Act 3 data (Athos's answer 6), because it adds fields every later entry may use. **Hard rule: everything is additive.** Home, Region, Route and Account, Progress, sync and the 62 Act 1 entries keep working unchanged, and the current data passes the validator untouched.

In:
- A Trackers page with one tab per category (counted and not counted), each with its own done and total.
- Mementos and Equipment, tracked and not counted (`counts: false`).
- Shop entries with a Rosary `price`, and a Rosaries panel showing what is still to spend, worked out from what is not bought.
- A Build picker: choose a Crest and fill its slots from the Tools and Silk Skills the player has marked done, record the slots opened on each Crest, and save one Build per Crest. The per-entry Build fields live on entries (Athos, 2026-10-20).
- Build Templates per Crest and Synergies between Tools, each with a source, in `data/builds.json` (Athos, 2026-10-20, third round; ADR 0007). They need Crest slot layouts in `data/` first.
- Places per Region (benches, Bellway stations, shops, NPCs, wish boards and others) in `data/places.json`, shown on the Region page, with "Sold by" on the Rosaries page (Athos, 2026-10-20, third round; ADR 0007).
- Shell Shards worked out from entries, like the Rosaries, once research shows which entries cost them (Athos, 2026-10-20, third round). No typed number and no Shell Shards panel.
- Reading the game's save file (last): a read-only "what does my save say" preview first, after a research spike; whether the repository may ship the game's key is Athos's question.
- Mockups for every new screen before code (Dev B, reviewed by Athos).

Out:
- The soundtrack (Athos's answer 5).
- A typed Rosaries amount (ADR 0005) and a typed Shell Shards number (ADR 0007).
- Steel Soul mode (Athos, 2026-10-20). (Build templates and synergy lists were out here too until Athos asked for them later the same day.)
- Boss notes stay optional, after everything above. A page listing every Place across all Regions is not planned (`docs/CONTRACTS.md` section 8).

## 4. Folder structure (proposal)

```
silksong-guide/
├── index.html              # Home: overview of progress, next step, what is holding you up
├── region.html             # one Region (takes ?id=...)
├── route.html              # the whole Route in order, with the "Holding you up" rail
├── account.html            # sign-in, backup file, new run
├── trackers.html           # Phase 5: Trackers, one tab per category
├── rosaries.html           # Phase 5: Rosaries still to spend, next to buy
├── builds.html             # Phase 5: Build picker, opened slots, saved Builds
├── css/
│   ├── base.css            # reset, variables (tokens), typography
│   ├── components.css      # entry rows, plates, thread/progress bars
│   └── fonts/              # self-hosted Gloock and Instrument Sans, with their OFL licenses
├── js/
│   ├── main.js             # entry point; picks behaviour by <body data-page="...">
│   ├── firebase.js         # init + auth + Firestore
│   ├── firebase-emulator.js # decides Emulator mode (localhost and ?emulator only; testing)
│   ├── firebase-config.js  # the Firebase web config (not a secret; see ADR 0004)
│   ├── progress.js         # local (localStorage), Firestore, export/import, merge
│   ├── requirements.js     # resolves requirements: "what is missing for X"
│   ├── data.js             # loads data/*.json with relative URLs
│   ├── account-page.js     # Account page: backup, new run, how saving works, guide data (Phase 2)
│   ├── trackers-page.js    # Phase 5 page scripts, one per new page
│   ├── rosaries-page.js
│   ├── builds-page.js
│   ├── builds.js           # Phase 5: pure Build arithmetic (slots now, what is owned, what does not fit)
│   └── render.js           # builds the interface from the data
├── data/
│   ├── regions.json        # list of Regions
│   ├── items.json          # Collectibles and Tasks (file name kept; "items" is only the file name)
│   ├── endings.json        # the four Endings, conditions and locksOut
│   ├── builds.json         # Phase 5, optional: Build Templates and Synergies (ADR 0007)
│   ├── places.json         # Phase 5, optional: Places per Region (ADR 0007)
│   └── sample/             # layout-only sample data; NOT guide facts (see data/sample/README.md)
├── img/regions/            # one hero image per Region (see docs/IMAGES.md)
├── tools/
│   └── sync-rehearsal.mjs  # two-device sync rehearsed against the Firebase Emulators
├── scripts/
│   └── validate-data.js    # data validator (run after every merge and before each commit that touches data/)
├── tests/                  # node:test files
├── qa/                     # checklist.md and reports/
├── firestore.rules         # plus firebase.json for the Emulator
├── docs/
│   ├── STRUCTURE.md        # this document
│   ├── AGENT-PLAN.md       # who does what, file owners, phases
│   ├── CONTRACTS.md        # function contracts and data shapes
│   ├── DESIGN.md           # design system and per-screen specs
│   ├── IMAGES.md           # image rules and credits
│   ├── PHASE-PROMPTS.md    # kickoff prompt for each phase
│   ├── design/             # screens (PNG), HTML mockups and art
│   └── adr/                # architecture decisions
├── GLOSSARY.md             # project vocabulary
└── README.md
```

Principle: **game content** (`data/`) is separate from **user Progress** (localStorage and Firestore). Updating the guide never touches saved Progress.

## 5. Data model

The code uses `regions.json`, `items.json` and `endings.json`. Where the glossary says Collectible or Task, the JSON field is `kind`. The shapes below are the human-readable version; `docs/CONTRACTS.md` holds the exact one the code is written against.

### Region (`regions.json`)
- `id` (stable slug, for example `moss-grotto`)
- `name`
- `order` (suggested position in the guide)
- `summary` (short text, in our own words)
- `requires` (list of entry ids, never Region ids, needed to enter or advance; decides when the Region is *Available*; empty = available from the start)
- `heroImage` (relative path, for example `img/regions/deep-docks.jpg`; optional)
- `heroPosition` (CSS `object-position`, default `50% 40%`; optional)
- `heroCredit` (credit line shown under the image; required whenever `heroImage` is set)

### Entry (`items.json`)
- `id` (stable slug; **never rename** once published, because saved Progress points at it)
- `name`
- `kind` (`collectible` or `task`; only `collectible` counts in the counters)
- `type` (for example ability, tool, crest, upgrade, boss, quest, flea, door)
- `regionId`
- `area` (optional Sub-area label, for example Bone Bottom; text only)
- `how` (how to get it, short, in our own words)
- `requires` (list of ids that must be done first)
- `unlocks` (optional; can be derived from `requires`)
- `missable` (boolean; whether it can be lost at some point)
- `missableNote` (optional; when and why)
- `step` (position in the global Route: one sequence across all Regions)
- `spoiler` (level 0, 1 or 2; lets entries stay hidden until the player gets there)
- `source` (wiki or MapGenie link; a reference, not a copy)
- `counts` (optional, Phase 5; default true for a Collectible; false = tracked on its Tracker but not counted, for Mementos and Equipment)
- `price` (optional, Phase 5; Rosaries a vendor asks for the entry)
- `toolColor` (optional, Phase 5; red, blue or yellow, for Tools, so the Build picker knows which Crest slots a Tool fits)
- `slots`, `slotsMax` (optional, Phase 5, Crests only; slots per colour when found and with every Memory Locket), `grantsSlots` (slots an entry adds to every Crest, for the Vesticrest), `upgradeOf` (the entry this one upgrades) and `effect` (what it does, our words)

### Ending (`endings.json`)
- `id`, `name`, `conditions` (list of entry ids; anything an Ending depends on is an entry, a Task if it does not count)
- `locksOut` (list of ending ids that can no longer be reached after this one)
- The four main endings, with requirements and `locksOut`, written by Athos and checked against the main wiki, ship with the late-game batch. In V1, `endings.json` is empty.

### Template and Synergy (`builds.json`, Phase 5, optional)
- Template: `id`, `crestId`, `name`, `goal` (our words), `build` (the Tools and Silk Skills per colour, the same shape as a saved Build), `editorial` (true = our grouping, false = a guide's Build), `source`. Must fit its Crest with every slot opened (validator rule 15, using the picker's own `checkBuild`).
- Synergy: `id`, `a` and `b` (two entry ids), `effect` (our words), `source` (a page that names both).

### Place (`places.json`, Phase 5, optional)
- `id`, `name`, `kind` (bench, bellway, shop, npc, wishboard, arena, door or other), `regionId`, `area`, `how` (where it is, our words), `requires` (entry ids needed to reach it, the same meaning as on entries), `sells` (shops only: the entry ids it sells), `source`.
- No `step`, never done, not counted, not on the Route. Hidden until its Region is Visited, like entries.

### Data metadata
- `dataVersion` at the top of each file in `data/`: one number shared by every file (the three core files and, when they exist, `builds.json` and `places.json`), raised in all of them on every content revision (patch or DLC).

### User Progress
- **Local:** one localStorage key holding `{ done, visited, updatedAt, dataVersion }`, plus the optional Phase 5 fields `crestSlots` and `builds`.
- **Cloud:** one document per user at `silksong_progress/{uid}`, same shape.
- `done`: map `{ [entryId]: true }`.
- `visited`: map `{ [regionId]: true }`, set by hand or automatically when something in the Region is completed.
- Stores ids, never game text. A bought shop entry or a found Memento is just an id in `done`.
- Phase 5 player choices (ADR 0006): `crestSlots` (Crest id to slots opened per colour) and `builds` (Crest id to the entry ids in its slots, per colour). A field missing from a copy means "written by an older page", not "empty", so an older page cannot erase saved Builds. (A provisional `shellShards` number was dropped before it was built, ADR 0007.) Nothing from Templates or Places is stored.
- **Export/import:** the same object, in a `.json` file. Import **adds** what the file has to what is already there and never removes anything (union, the same rule as the first sign-in). For the Phase 5 fields: the larger number of opened slots, and a Build only for a Crest with none saved.

## 6. Core logic: requirements

`requirements.js` answers two questions from `requires`:

1. **Available now?** Are all of the entry's requirements in `done`?
2. **What is missing to get there?** The list of requirements not yet done, following the chain (a requirement's own requirements).

Points of attention: cycles in the data (validate), ids that do not exist (validate on load) and entries with no requirements (always available).

Regions use the same logic: a Region is *Available* when all of its `requires` are in `done`. An entry is only Available when its Region is Available too: its real requirements are its own `requires` plus its Region's. Otherwise it is *Locked*, and the interface shows only the name and what is missing (the Region's own pending list).

Phase 5 adds a third question, answered from the data alone: **is this entry on the Route?** (`routeIds`, `docs/CONTRACTS.md` section 2). "Next on the route", "Holding you up", the Route page and a Region's Complete state look only at entries on the Route; counts, Trackers and Rosaries do not.

A Place uses the same chain walk for "what does it need?" (`missingForPlace`: its own `requires` plus its Region's), so the Region page can say "Needs X" for a Place without walking `requires` itself. Places never affect the other answers.

## 7. V1 screens

The visual design is finished: see `docs/DESIGN.md`, the PNGs in `docs/design/screens/` and the HTML mockups in `docs/design/mockups/`.

1. **Home** (`index.html`): "Next on the route" plate, "What is holding you up", totals (Collectibles and Tasks), Collectibles by type and one card per Region (Complete, Visited, Available, Locked, or Not in the guide yet).
2. **Region** (`region.html?id=`): the Region's hero, its totals and its entries in Route order, with pending requirements and missable warnings. A Locked Region shows only the name and what is missing. Entries in Regions that are not Visited stay hidden, with a "Show everything, spoilers included" option. A phone layout exists.
3. **Route** (`route.html`): every step across all Regions in order, a "Show on the route" filter and a "Holding you up" rail. This is also where "what is missing" lives, so there is no separate pending page.
4. **Account and backup** (`account.html`): sign in with Google, GitHub or an email link; download and add a backup file; start a new run; a short "How saving works" explanation.

Phase 5 adds three pages, linked from every header (Athos, 2026-10-20, option A on phones): Trackers (one tab per category), Rosaries (still to spend, next to buy, and the Shell Shards number if confirmed) and Builds (the picker, opened slots, saved Builds). Mockups first (Dev B, `docs/design/trackers/`), reviewed by Athos. The four screens above do not change, except that their counts use `isCounted` (`docs/CONTRACTS.md` section 5), which gives the same numbers for the current data.

## 8. Data: license and accuracy

- The wiki and MapGenie are **references**. Content is written in our own words, with a link in `source`. Never copy text and never scrape MapGenie data.
- **No draft script** (Athos, 2026-10-20, checklist item 4). The plan had a script that drafted entries from the wiki. It was dropped: the main wiki blocks automated reading, and Fextralife's terms (Valnet) forbid scraping and rewriting their content for publication. Entries are written by Athos from his own play, checked against the main wiki read by hand in a browser, with other guides used only to cross-check a fact. Agents never fetch hollowknight.wiki or Fextralife. Research: `docs/research/2026-10-20-sources-and-batch-1.md`.
- Check a sample of entries against the wiki at every data revision.
- Before publishing, review the terms and license of each source and include attribution on the page.
- **Region hero images** are the one exception to "no game images", and it is Athos's decision: his own screenshots, shown with a credit to Team Cherry. They are small, replaceable single files; see `docs/IMAGES.md`. A hand-drawn fallback exists in `docs/design/art/`.

## 9. Firebase

- The site has its own Firebase project (`silksong-tracker-90229`), separate from Hollow-Thingy (ADR 0004). Its ruleset is ours alone.
- Test the rules in the Firebase Emulator before publishing them.
- The rules must let each user read and write only their own document.

## 10. Hosting

- GitHub Pages from the start, so the site can be tested on a phone.
- Authorize the Pages domain (`<user>.github.io`) in the Firebase Auth authorized domains; without it, sign-in fails.
- Check whether the GitHub plan allows Pages on a private repository. If not, the repository will be public: no secrets in the code and strict Firestore rules (the Firebase web config is not a secret; the rules are what protect the data).
- Use relative paths in every file, because Pages serves the site under a subpath (`/<repository>/`).

## 11. Open points

- Act 1 content was researched by the orchestrator at Athos's request (`docs/PHASE-3-ACT-1.md`); Athos checks a sample against the main wiki and fixes what is wrong.
- Strategy for updating the data when the game gets patches or DLC.
- How to handle the global Route when one `step` depends on a player choice (Endings with `locksOut`). The Route screen has a "Choice point" marker for this; the data rule is still open.
- Whether to keep game screenshots as hero images on the public site (see section 8 and `docs/IMAGES.md`).

## 12. Working with Claude Code

- Give it this document, `docs/AGENT-PLAN.md` and `GLOSSARY.md` as starting context. `CLAUDE.md` already imports them.
- Work in small steps: the vertical slice first (one Region, two entries), then widen.
- The plan was for Athos to write the first data draft and the `requirements.js` module. On 2026-10-19 he delegated `requirements.js` to Dev A and the slice research to the orchestrator; he reviews both and confirms the facts.
- Use Claude Code as reviewer and guide: try each part first, ask for review and ask for the reasoning behind decisions.

## 13. Changes from the Portuguese original

- Folder structure now has `route.html`, `account.html`, `img/regions/`, `scripts/`, `tests/`, `qa/`, `firestore.rules` and `data/sample/`.
- The separate "Pendências" screen is folded into the Route screen (the "Holding you up" rail) and into a block on Home.
- Region has three image fields (`heroImage`, `heroPosition`, `heroCredit`).
- Entry `type` examples now include flea and door, which the design uses.
- Import is a union merge (confirmed by Athos in Phase 0, see `docs/CONTRACTS.md`).
- Section 8 records the hero-image exception.
- Firebase: the site has its own project instead of sharing Hollow-Thingy's (ADR 0004, Athos, Phase 1).
- Repository created (public, `athoskolling/SilkSong_Tracker`), so it is no longer an open point. `requirements.js` delegated to Dev A (Athos, Phase 1).
- Phase 5 (Athos, 2026-10-20): the full tracker scope (section 3), the `counts`, `price` and `toolColor` fields (section 5) and ADR 0005. Reading the save file moves from "out of V1" into Phase 5.
- Phase 5, second round (Athos, 2026-10-20): one entry per thing; Build fields on entries; three new pages; player choices in Progress (ADR 0006), which replaces "Progress stores ids only".
