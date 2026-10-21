# Silksong Guide: execution plan with agents

Complements `docs/STRUCTURE.md`. Defines who does what, who owns which files and how the work fits together without conflicts.

> Translated from Athos's Portuguese original (`athos-notes-pt-br/silksong-plano-agentes.md`) and extended with the Claude Code setup that now exists in `.claude/`. Changes are listed in section 9.

## 1. Principle: start small, widen with evidence

Five agents for a static site with a handful of files cost more in coordination than they save. The plan has **two stages**.

**Stage 1: vertical slice (orchestrator, one dev, Athos)**
- Orchestrator (Opus 5.5, high).
- Dev (Sonnet 5.5, high). In this stage the `dev-a` agent does the work of both Dev A and Dev B, and the orchestrator says so explicitly in each task so file ownership stays single-owner.
- Athos writes the data draft and the `requirements.js` module, and reviews everything. (On 2026-10-19 Athos delegated `requirements.js` to `dev-a` and the slice research to the orchestrator; he reviews both and confirms the facts.)
- Goal: one Region, two entries, a requirement chain, local Progress and a real login, end to end.

**Stage 2: widening (up to 5 agent roles)**
Starts only when the vertical slice works and the contracts have been proven in practice. Then the second dev and the QA agents join.

## 2. Roles (full stage 2)

| Role | Claude Code agent | Model | Responsibility |
|---|---|---|---|
| **Orchestrator** | `orchestrator` | Opus 5.5 (`high`) | Owns the environment. Creates the scaffold, defines the contracts, hands out tasks, integrates, resolves conflicts and does the final review. Does not write features. |
| **Dev A: data and logic** | `dev-a` | Sonnet 5.5 (`high`) | `data/`, `requirements.js`, `progress.js`, `firebase.js`, Firestore rules; in Phase 5 also `builds.js` (including the Template and Synergy functions) and the save file reader. |
| **Dev C: data content** | `dev-c` | Sonnet 5.5 (`high`) | `data/*.json` batches from approved sheets (Acts 2 and 3), so Dev A can work on logic in parallel. Added at Athos's request, 2026-10-20. |
| **Dev B: interface** | `dev-b` | Sonnet 5.5 (`high`) | HTML, CSS, `render.js`, `main.js`, screens and accessibility. |
| **QA 1: automated tests** | `qa-tests` | Haiku 5.5 (`xhigh`) | Logic tests and the data validator. |
| **QA 2: manual QA and review** | `qa-manual` | Haiku 5.5 (`xhigh`) | Screen checklist, responsiveness, login flow and checking the data against the wiki. |
| **Tutor** | `tutor` | Sonnet 5.5 (`high`) | Read-only. Explains to Athos, in simple words, what is happening and why (reads `docs/PROGRESS-LOG.md` and git). Added at Athos's request, Phase 1. |
| **Athos** | (you) | human | Approves decisions, writes the first data draft and reviews what each agent delivers. |

Notes:
- That is 5 agent roles assuming two Haiku agents. If only one is used, QA 1 and QA 2 become a single role.
- The original plan said Haiku "extra". Claude Code's effort levels are `low`, `medium`, `high`, `xhigh` and `max`, so "extra" is read here as `xhigh`. Change it in `.claude/agents/qa-*.md` if you meant something else. Not every model supports every level; if `xhigh` is rejected for Haiku, use `high`.
- Opus, Sonnet and Haiku 5.5 default to medium effort, which is why each agent file sets `effort` explicitly.

## 3. File owners

Main rule: **every file has exactly one owner**. Nobody edits another owner's file. If a change is needed, ask the owner or the orchestrator. In stage 1, the dev holds both A and B, and also writes the tests a task names (acting as QA 1); QA 1 takes those test files over in stage 2.

| Path | Owner |
|---|---|
| `README.md`, `CLAUDE.md`, `docs/`, `docs/CONTRACTS.md`, folder structure, `.claude/` | Orchestrator |
| `data/*.json` | Dev C (from 2026-10-20; Dev A may still edit it when a task names it and Dev C is not working on data). In Phase 5 Dev C adds the tracker content (`counts`, `price`, `toolColor`) from approved sheets only, and from the third round also `data/builds.json` (Templates and Synergies) and `data/places.json` (Places), from approved sheets only |
| `tools/*`, `js/requirements.js`, `js/progress.js`, `js/firebase.js`, `js/firebase-emulator.js`, `js/firebase-config.js`, `js/builds.js` (Phase 5), `firestore.rules`, `firebase.json` | Dev A (`requirements.js` delegated by Athos on 2026-10-19; he reviews it. Data facts come from Athos and the wiki) |
| `index.html`, `region.html`, `route.html`, `account.html`, `css/*`, `js/main.js`, `js/render.js`, `js/data.js`, `js/account-page.js`, `img/` | Dev B (Phase 2: `dev-a` may act as Dev B for named UI files, one task at a time, when it speeds things up; Athos, 2026-10-19) |
| Phase 5 interface: `trackers.html`, `rosaries.html`, `builds.html`, `goal.html`, `js/trackers-page.js`, `js/rosaries-page.js`, `js/builds-page.js`, `js/goal-page.js`, any new stylesheet they need, and the Phase 5 mockup files in `docs/design/trackers/`, `docs/design/goal/` and `docs/design/backdrop/` (an exception to the orchestrator owning `docs/`) | Dev B (the orchestrator names the exact files in each task; mockups need Athos's review before code) |
| Phase 5 save file reader (a pure module that turns a save file into entry ids; name set when the research spike ends) and its read-only preview page (Dev A acting as Dev B for that one page, named in the task) | Dev A |
| `tests/*`, `scripts/validate-data.js` | QA 1 |
| `qa/checklist.md`, `qa/reports/*` | QA 2 |
| `docs/PROGRESS-LOG.md` | Orchestrator (the tutor only reads it) |
| `data/sample/*` | Orchestrator (layout samples only; Dev B may read them) |
| `firebase/*` | Athos (his copy of the rules published in the Firebase console, for reference; the rules the repository owns are `firestore.rules` at the root) |

## 4. Contracts between modules (`docs/CONTRACTS.md`)

The orchestrator writes this file **before** releasing parallel work. The contracts are hypotheses until the vertical slice proves them. A first version is already in the kit; the orchestrator reviews it with Athos in Phase 0.

Summary (the exact signatures and data shapes are in `docs/CONTRACTS.md`):

- `requirements.js`: `isAvailable`, `missingFor`, `regionProgress`, `isRegionAvailable`, `missingForRegion`, `nextStep`, `holdingYouUp`, and from Phase 5 `isCounted`, `rosariesToSpend`, `routeIds` and (third round) `missingForPlace`
- `progress.js`: `configureProgress`, `loadProgress`, `setDone`, `setVisited`, `onProgressChange`, `onSyncStatus`, `exportProgress`, `importProgress`, `mergeLocalAndCloud`, `clearProgress` (plus the test seams `useStorage` and `useCloud`), and from Phase 5 `setCrestSlots` and `setBuild` (`setShellShards` was dropped before it was built, ADR 0007)
- `builds.js` (Phase 5, pure): `slotsFor`, `ownedByColour`, `checkBuild`, and (third round) `fitTemplate`, `synergiesIn`, `synergyPartners`
- `data.js` (Dev B): `loadData`, and (third round) `loadPlaces` and `loadTemplates` for the two optional files
- `firebase.js`: `signIn`, `completeEmailLinkSignIn`, `signOut`, `onAuthChange`; and, for `progress.js` only, `readProgressDoc`, `writeProgressDoc`, `deleteProgressDoc`, `watchProgressDoc`

The interface uses only these functions. It does not touch Firestore or localStorage, and does not read requirement JSON on its own.

## 5. Phases

**Phase 0: Foundation (Orchestrator)**
- Folder structure, README, `GLOSSARY.md` (in the root) and `docs/adr/` (ADRs 0001 to 0004: local-first with union merge, shared Firebase (superseded), permanent ids, own Firebase project).
- GitHub Pages from the start: publish the vertical slice early, authorize the Pages domain in Firebase Auth and use relative paths. Check whether the GitHub plan allows Pages on a private repository; if not, the repository is public and nothing sensitive can go in the code.
- `docs/CONTRACTS.md` and minimal sample data.
- Branch convention: one per agent.
- Output: contracts approved by Athos.
- **Athos's part of Phase 0 is in `docs/PHASE-0-CHECKLIST.md`** (repository, Pages and privacy, Firebase authorized domain, wiki license, current Firestore rules, Firebase config). Agents must not do those steps, and must stop and ask if one blocks them.

**Phase 1: Vertical slice (stage 1)**
- One Region, two entries and a dependency between them.
- `requirements.js` (Dev A, delegated by Athos), local Progress, the Region screen, a real login, and `firestore.rules` tested in the Emulator (sync needs it).
- Done when: marking one entry unlocks the other, Progress survives a page reload and syncs between two devices.

**Phase 2: Widening (stage 2, in parallel)**
- Dev A: the rest of the logic, sync and `firestore.rules` tested in the Emulator.
- Dev B: Home, Region and Route screens, and the account and backup screen, from `docs/DESIGN.md` and `docs/design/`.
- QA 1: `scripts/validate-data.js` (unique ids, valid `requires`, no cycles, coherent `missable`); takes over the tests Dev A wrote in stage 1 and checks they cover every case in `docs/CONTRACTS.md` section 2.
- QA 2: QA checklist built from the screens.

**Phase 3: Real data, in batches (Dev A, with Athos)**
- First batch: Moss Grotto, The Marrow and Deep Docks (confirm on the wiki). Each later batch repeats this phase.
- No draft script (Athos, 2026-10-20). Athos writes each entry from his own play and checks it against the main wiki by hand; the orchestrator may cross-check facts with web searches and flags disagreements; nothing enters `data/` that Athos has not written or confirmed.
- Dev A reviews, completes and standardizes. Each entry has `source`, text in our own words and `dataVersion`.
- QA 1 runs the validator. QA 2 checks a sample against the wiki.

**Phase 4: Integration and QA (Orchestrator)**
- Merge one branch at a time, with tests after each merge.
- QA 2 runs the checklist; findings in `qa/reports/` are routed to the file owner.
- Repeat until the checklist passes.

**Phase 5: The full tracker (Athos, 2026-10-20; before the Act 2 and Act 3 data)**
- Plan, order and task briefs: `docs/PHASE-5-FULL-TRACKER-PLAN.md` (P5-1 to P5-4, then P5-5 to P5-24 after Athos's second answers). Contract changes: `docs/CONTRACTS.md` section 7; why: ADR 0005 and ADR 0006.
- Every change is additive: Home, Region, Route and Account, Progress, sync and the Act 1 entries keep working unchanged, and the current data passes the validator untouched.
- Dev A: `isCounted`, `regionProgress` and `rosariesToSpend` in `requirements.js`; the player-choice fields in `progress.js` and the matching `firestore.rules`; `builds.js`; the sync rehearsal for the new fields; last, the save file spike and preview. QA 1: validator rules 6, 11, 12 and 13 and the tests for every module above, including the Emulator rules tests. Dev B: the counts in `main.js` switch to `isCounted` (before any `counts: false` data), then the mockup addendum, then the Trackers, Rosaries and Builds pages, each adding its own header link. Dev C: the Drifter's Cloak and Hunter Crest change, then tracker content from approved sheets. QA 2: a pass after each page. Athos: publishes the new Firestore rules before the new `progress.js` is merged.
- Third round (Athos, 2026-10-20; ADR 0007; tasks P5-30 to P5-46 in `docs/PHASE-5-FULL-TRACKER-PLAN.md`): Build Templates and Synergies (`data/builds.json`) and Places (`data/places.json`). Orchestrator: contract, research sheets (templates and synergies; Places per Act), sample files. Dev B: mockups, the two loaders in `data.js`, the Region page Places section, "Sold by" on the Rosaries page, Templates and Synergies in the Build picker. Dev A: `missingForPlace` and the three `builds.js` functions; the `shellShards` cleanup. QA 1: validator rules 15 and 16 and the tests. Dev C: the two files, in batches. QA 2: a pass on the three pages. The provisional `shellShards` is dropped (no rules change, nothing for Athos to publish).

`docs/PHASE-PROMPTS.md` has a ready-to-paste kickoff prompt for each phase.

## 6. Working conventions

- **Small tasks:** goal, files touched and a definition of done.
- **Branches:** one branch per agent task, named `<agent>/<topic>` (`dev-a/progress-local`, `dev-b/region-page`, `qa-tests/validator`, `qa-manual/checklist`). The orchestrator merges into `main` one branch at a time. Nobody pushes to `main` except through the orchestrator, and nobody force-pushes. The orchestrator pushes `main` after every merge or doc commit once the tests (and the validator, when it exists) pass, without asking first (Athos, 2026-10-19), so the published site never lags behind `main`. Data whose facts Athos has not confirmed yet is still held back, because ids become permanent once published (ADR 0003).
- **Empty folders:** a `.gitkeep` keeps a folder in git until its owner adds the first real file; the owner may delete it then.
- **Handoff:** a short note with what changed, decisions made and open questions.
- **Contract doubt:** do not improvise; ask the orchestrator, who updates `docs/CONTRACTS.md`.
- **Durable decisions:** record them in `docs/adr/` and use the terms in `GLOSSARY.md`.
- **Tests without a framework:** use native `node:test`.
- **Secrets:** no key or token in the repository.
- **Explain decisions:** each agent records the reason for non-obvious choices so Athos can follow along and learn.
- **Entry ids are permanent:** renaming an id breaks saved Progress. Content changes raise `dataVersion`.

## 7. Claude Code mechanics (verified against the docs, October 2026)

- Agents live in `.claude/agents/*.md`. Run the whole project as the orchestrator with `claude --agent orchestrator`. Its `initialPrompt` is submitted as the first turn, so it starts by reading the docs and asking Athos which phase to begin.
- The orchestrator can spawn only the agents listed in its `tools: Agent(...)` allowlist. Dev and QA agents have no `Agent` tool, so they cannot spawn further agents.
- All four worker agents (`dev-a`, `dev-b`, `qa-tests`, `qa-manual`) use `isolation: worktree`: each edits its own git worktree and never touches your checkout, so parallel work cannot collide. A worktree with no changes is removed automatically; one with changes stays on disk until it is merged and removed.
- **Worktrees branch from the repository's default branch on the remote**, not from the orchestrator's current commit. That would hide unpushed contracts and scaffolding from the dev. `.claude/settings.json` therefore sets `"worktree": { "baseRef": "head" }`, so a worktree starts from the orchestrator's current `HEAD`. Commit the contracts before spawning devs. If you prefer the default, remove that setting and push to `main` before each spawn.
- A worktree agent receives `CLAUDE.md` and `.claude/rules/` from the main conversation, not from its worktree. Changes to those files take effect when the orchestrator session restarts.
- `CLAUDE.md` is kept under 200 lines and imports the main docs with `@path`. Path-scoped rules in `.claude/rules/` load only when matching files are touched.
- Models are set by full ID in each agent file (`claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`). You can change one with `/model` in a session, or by editing the file.

## 8. V1 definition of done

- The data validator passes with no errors.
- `requirements.js` tests pass, including the requirement chain and a cycle case.
- Progress works without login (localStorage) and exports and imports as JSON.
- Login works and Progress syncs between two devices, with local versus cloud conflicts resolved.
- Starts empty in a new game, with nothing marked by default.
- Locked Regions show only the name and what is missing, and open when requirements are met; Collectibles in Regions that are not Visited stay hidden, with an option to show everything.
- Site published on GitHub Pages, with login working on the published domain.
- Firestore rules tested in the Emulator: each user reaches only their own document, and nothing else is reachable.
- Data has `source` and attribution, with no copied text.
- QA checklist with no critical findings.

**Phase 5 adds (full tracker):**
- The current `data/` passes the validator with no edit and the same warnings as before Phase 5; every Home, Region and Route number for the current data is the same as before.
- No Collectible with `counts: false` appears in a headline count; each Tracker shows its own done and total.
- Rosaries still to spend follow from the shop entries not done; Rosaries are never a number in Progress.
- Progress saved before Phase 5 (local, cloud and backup files) loads unchanged; the new fields are optional; a page from before Phase 5 still open on another device cannot erase saved Builds; the Firestore rules still let each user reach only their own document, accept the new fields only as optional keys, and pass in the Emulator before Athos publishes them.
- The sync rehearsal passes with the new fields across two devices.
- The Build picker offers only what the player has marked done, and a saved Build and the opened slots survive a reload and sync between two devices.
- Every new screen matches a mockup Athos approved.

**Phase 5, third round adds (ADR 0007):**
- The current `data/` (without `builds.json` and `places.json`) still passes the validator with no new message; with the two files, rules 15 and 16 pass with no error.
- Every Template fits its Crest at its most, checked by the validator with the picker's own `checkBuild`; every Synergy has a source that names both entries (checked in the research sheet).
- "Use as my Build" fills the draft and never saves by itself; nothing from a Template or a Place is ever stored in Progress.
- Places appear on the Region page under the same Visited rule as entries, have no done state, and change no count, Region state or Route answer; the Rosaries page says where each priced entry is sold when a Place sells it.
- No agent fetched MapGenie; every MapGenie `source` was supplied by Athos or seen in a search result, and is listed as not opened.
- Progress has no `shellShards`, and the Firestore rules still refuse it.

## 9. Changes from the Portuguese original

- Added the role-to-agent mapping, the Claude Code mechanics (section 7) and the pointer to `docs/PHASE-0-CHECKLIST.md` for Athos's Phase 0 tasks.
- `index.html`, `route.html`, `account.html` and `img/` added to Dev B's files.
- Haiku "extra" mapped to `xhigh`.
- Stage 1 clarified: `dev-a` acts as both devs, with the orchestrator naming the owner of each task.
- Phase 5 (2026-10-20): Phase 5 (full tracker) added to the phases and the definition of done; owners for its new files; Dev C writes the tracker content.
- Phase 5, second round (2026-10-20): `js/builds.js` and the new pages named in the owner table; the `progress.js` setters in section 4; the definition of done now covers the player-choice fields in Progress (ADR 0006) instead of "Progress holds only ids".
- Phase 5, third round (2026-10-20): Templates, Synergies and Places (ADR 0007): owners of the two new data files, the new functions in section 4, the third-round definition of done; `setShellShards` dropped.
- Phase 1 (2026-10-19): `requirements.js` delegated to Dev A; `firestore.rules` and its Emulator tests moved into Phase 1, because sync between two devices (the slice's done criterion) cannot work without them; contract summary in section 4 brought up to date; `firebase/` added to the owner table.
