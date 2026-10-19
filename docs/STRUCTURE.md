# Silksong Guide: project structure

Planning document. No code exists yet: this is the context for starting development in Claude Code. Terms in **bold** are defined in `GLOSSARY.md`.

> Translated from Athos's Portuguese original (`athos-notes-pt-br/silksong-estrutura.md`) and updated after the design phase. Changes from the original are listed in section 13.

## 1. Vision

A progress guide for Hollow Knight: Silksong, built for finishing the game at maximum completion: collect everything and reach every ending.

The player follows the guide, marks what they finished and sees what is still missing. The site starts empty (a new game) with no progress baked into the code.

How it differs from Hollow-Thingy: this is a **guide**, not only a checklist. It carries a suggested order, requirements, warnings about missable entries and what unlocks what.

## 2. Decisions already made

- New, separate repository (created later, without hurry).
- Same stack as Hollow-Thingy: plain HTML + CSS + JavaScript, no framework and no backend of our own.
- Login and sync: reuse the Hollow-Thingy Firebase project (Auth + Firestore), with Silksong data in a separate collection.
- No visual game map. Text and checklists only.
- Minimal visual style, nothing that looks "made by AI". The visual design is settled; see `docs/DESIGN.md` and `docs/design/`.
- Data source: the game's main wiki, with MapGenie as a fallback reference when information is missing.
- **Local first:** progress is saved in the browser (localStorage) by default and synced to Firestore after sign-in. The site works without an account.
- **Backup:** export and import progress as JSON.
- **Site language:** English only (names, text and interface). No translation layer.
- **Two kinds of entry:** Collectible (counts toward progress) and Task (tracked, but does not count). The "X of Y" counters use Collectibles only. See `GLOSSARY.md`.
- **Endings in the V1 model:** five endings in the data, with conditions and a `locksOut` warning. The full endings screen is outside V1. `missable` on entries is optional and defaults to `false`.
- **Our own counts:** per-category counters ("Tools: 12 of 51"), never claiming to reproduce the game's completion percentage.
- **One Run per account** in V1. "New run" offers an export before clearing.
- **First sign-in:** union of local and cloud Progress; after that, the latest write wins.
- **Spoilers:** Collectibles in Regions that are not Visited stay hidden by default, with an option to show everything.
- **Firebase:** shared project; rules are published only after passing Firebase Emulator tests.
- **Vertical slice before parallel work:** one Region, two entries, a working requirement chain and a real login, end to end. Only then widen.
- **Global Route:** `step` is one sequence across all Regions; region pages are filtered views of that Route.
- **Visited and Available Regions:** *Visited* is set by hand and also automatically when the player completes something in the Region (it controls spoilers). *Available* is computed from the Region's `requires`, based on Progress.
- **Locked Regions:** show only the name and what is missing (for example "needs Swift Step"); they open when the requirements are met.
- **All Regions in the model, content in batches:** the model and interface support the whole game from the start; content ships in batches, only after it is verified.
- **Tasks in V1:** only the ones that unlock a Collectible.
- **Sub-areas:** a text label (`area`) on each entry, with no pages or unlock logic of their own.
- **Data authorship:** script-assisted drafts from the wiki, always rewritten and verified by a person (see section 8).
- **Hosting:** GitHub Pages from the start (see section 10).
- **ADRs written:** `0001` (local-first with union merge), `0002` (shared Firebase) and `0003` (permanent ids), in `docs/adr/`.

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
- Reading the game's save file automatically.
- The complete endings screen and a total completion percentage.
- Search, advanced filters and a full offline mode.

## 4. Folder structure (proposal)

```
silksong-guide/
├── index.html              # Home: overview of progress, next step, what is holding you up
├── region.html             # one Region (takes ?id=...)
├── route.html              # the whole Route in order, with the "Holding you up" rail
├── account.html            # sign-in, backup file, new run
├── css/
│   ├── base.css            # reset, variables (tokens), typography
│   └── components.css      # entry rows, plates, thread/progress bars
├── js/
│   ├── main.js             # entry point; picks behaviour by <body data-page="...">
│   ├── firebase.js         # init + auth + Firestore (reused from Hollow-Thingy)
│   ├── firebase-config.js  # the Firebase web config (not a secret; see ADR 0002)
│   ├── progress.js         # local (localStorage), Firestore, export/import, merge
│   ├── requirements.js     # resolves requirements: "what is missing for X"
│   ├── data.js             # loads data/*.json with relative URLs
│   └── render.js           # builds the interface from the data
├── data/
│   ├── regions.json        # list of Regions
│   ├── items.json          # Collectibles and Tasks (file name kept; "items" is only the file name)
│   ├── endings.json        # the five Endings, conditions and locksOut
│   └── sample/             # layout-only sample data; NOT guide facts (see data/sample/README.md)
├── img/regions/            # one hero image per Region (see docs/IMAGES.md)
├── tools/
│   └── draft-from-wiki.js  # makes drafts from the wiki (human review mandatory)
├── scripts/
│   └── validate-data.js    # data validator (run in CI and before each commit that touches data/)
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

### Ending (`endings.json`)
- `id`, `name`, `conditions` (list of entry ids; anything an Ending depends on is an entry, a Task if it does not count)
- `locksOut` (list of ending ids that can no longer be reached after this one)
- In V1: the five endings, with requirements and `locksOut`, filled in from the wiki.

### Data metadata
- `dataVersion` at the top of each file in `data/`: one number shared by all three files, raised in all of them on every content revision (patch or DLC).

### User Progress
- **Local:** one localStorage key holding `{ done, visited, updatedAt, dataVersion }`.
- **Cloud:** one document per user at `silksong_progress/{uid}`, same shape.
- `done`: map `{ [entryId]: true }`.
- `visited`: map `{ [regionId]: true }`, set by hand or automatically when something in the Region is completed.
- Stores ids only. No game text is duplicated.
- **Export/import:** the same object, in a `.json` file. Import **adds** what the file has to what is already there and never removes anything (union, the same rule as the first sign-in).

## 6. Core logic: requirements

`requirements.js` answers two questions from `requires`:

1. **Available now?** Are all of the entry's requirements in `done`?
2. **What is missing to get there?** The list of requirements not yet done, following the chain (a requirement's own requirements).

Points of attention: cycles in the data (validate), ids that do not exist (validate on load) and entries with no requirements (always available).

Regions use the same logic: a Region is *Available* when all of its `requires` are in `done`. An entry is only Available when its Region is Available too: its real requirements are its own `requires` plus its Region's. Otherwise it is *Locked*, and the interface shows only the name and what is missing (the Region's own pending list).

## 7. V1 screens

The visual design is finished: see `docs/DESIGN.md`, the PNGs in `docs/design/screens/` and the HTML mockups in `docs/design/mockups/`.

1. **Home** (`index.html`): "Next on the route" plate, "What is holding you up", totals (Collectibles and Tasks), Collectibles by type and one card per Region (Complete, Visited, Available, Locked, or Not in the guide yet).
2. **Region** (`region.html?id=`): the Region's hero, its totals and its entries in Route order, with pending requirements and missable warnings. A Locked Region shows only the name and what is missing. Entries in Regions that are not Visited stay hidden, with a "Show everything, spoilers included" option. A phone layout exists.
3. **Route** (`route.html`): every step across all Regions in order, a "Show on the route" filter and a "Holding you up" rail. This is also where "what is missing" lives, so there is no separate pending page.
4. **Account and backup** (`account.html`): sign in with the account already used on Hollow-Thingy (Google, GitHub or an email link); download and add a backup file; start a new run; a short "How saving works" explanation.

## 8. Data: license and accuracy

- The wiki and MapGenie are **references**. Content is written in our own words, with a link in `source`. Never copy text and never scrape MapGenie data.
- **Draft script (`tools/draft-from-wiki.js`):** reads only the main wiki, only after reviewing its terms of use and content license, and respecting request limits. The output is a draft: a person rewrites each text in their own words and checks the fact before it enters `data/`. The script never copies images or audio from the wiki (the wiki itself marks them as fair use, not free content).
- Check a sample of entries against the wiki at every data revision.
- Before publishing, review the terms and license of each source and include attribution on the page.
- **Region hero images** are the one exception to "no game images", and it is Athos's decision: his own screenshots, shown with a credit to Team Cherry. They are small, replaceable single files; see `docs/IMAGES.md`. A hand-drawn fallback exists in `docs/design/art/`.

## 9. Firebase

- The Firebase project is the same one Hollow-Thingy uses, so a wrong rule can affect the other site.
- Test the rules in the Firebase Emulator before publishing them.
- If the risk is not worth the saved setup, create a separate project.
- The rules must let each user read and write only their own document.

## 10. Hosting

- GitHub Pages from the start, so the site can be tested on a phone.
- Authorize the Pages domain (`<user>.github.io`) in the Firebase Auth authorized domains; without it, sign-in fails.
- Check whether the GitHub plan allows Pages on a private repository. If not, the repository will be public: no secrets in the code and strict Firestore rules (the Firebase web config is not a secret; the rules are what protect the data).
- Use relative paths in every file, because Pages serves the site under a subpath (`/<repository>/`).

## 11. Open points

- Confirm on the wiki the first three Regions of batch 1 and the exact scope of each.
- Review the wiki's license and terms of use before using the draft script.
- Strategy for updating the data when the game gets patches or DLC.
- Repository name and creation, and whether it is private or public.
- How to handle the global Route when one `step` depends on a player choice (Endings with `locksOut`). The Route screen has a "Choice point" marker for this; the data rule is still open.
- Whether to keep game screenshots as hero images on the public site (see section 8 and `docs/IMAGES.md`).

## 12. Working with Claude Code

- Give it this document, `docs/AGENT-PLAN.md` and `GLOSSARY.md` as starting context. `CLAUDE.md` already imports them.
- Work in small steps: the vertical slice first (one Region, two entries), then widen.
- Athos writes the first draft of `regions.json` and the `requirements.js` module; Claude Code reviews and explains.
- Use Claude Code as reviewer and guide: try each part first, ask for review and ask for the reasoning behind decisions.

## 13. Changes from the Portuguese original

- Folder structure now has `route.html`, `account.html`, `img/regions/`, `scripts/`, `tests/`, `qa/`, `firestore.rules` and `data/sample/`.
- The separate "Pendências" screen is folded into the Route screen (the "Holding you up" rail) and into a block on Home.
- Region has three image fields (`heroImage`, `heroPosition`, `heroCredit`).
- Entry `type` examples now include flea and door, which the design uses.
- Import is a union merge (confirmed by Athos in Phase 0, see `docs/CONTRACTS.md`).
- Section 8 records the hero-image exception.
