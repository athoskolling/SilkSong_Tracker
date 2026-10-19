# Silksong Guide: execution plan with agents

Complements `docs/STRUCTURE.md`. Defines who does what, who owns which files and how the work fits together without conflicts.

> Translated from Athos's Portuguese original (`athos-notes-pt-br/silksong-plano-agentes.md`) and extended with the Claude Code setup that now exists in `.claude/`. Changes are listed in section 9.

## 1. Principle: start small, widen with evidence

Five agents for a static site with a handful of files cost more in coordination than they save. The plan has **two stages**.

**Stage 1: vertical slice (orchestrator, one dev, Athos)**
- Orchestrator (Opus 5.5, high).
- Dev (Sonnet 5.5, high). In this stage the `dev-a` agent does the work of both Dev A and Dev B, and the orchestrator says so explicitly in each task so file ownership stays single-owner.
- Athos writes the data draft and the `requirements.js` module, and reviews everything.
- Goal: one Region, two entries, a requirement chain, local Progress and a real login, end to end.

**Stage 2: widening (up to 5 agent roles)**
Starts only when the vertical slice works and the contracts have been proven in practice. Then the second dev and the QA agents join.

## 2. Roles (full stage 2)

| Role | Claude Code agent | Model | Responsibility |
|---|---|---|---|
| **Orchestrator** | `orchestrator` | Opus 5.5 (`high`) | Owns the environment. Creates the scaffold, defines the contracts, hands out tasks, integrates, resolves conflicts and does the final review. Does not write features. |
| **Dev A: data and logic** | `dev-a` | Sonnet 5.5 (`high`) | `data/`, `requirements.js`, `progress.js`, `firebase.js`, Firestore rules. |
| **Dev B: interface** | `dev-b` | Sonnet 5.5 (`high`) | HTML, CSS, `render.js`, `main.js`, screens and accessibility. |
| **QA 1: automated tests** | `qa-tests` | Haiku 5.5 (`xhigh`) | Logic tests and the data validator. |
| **QA 2: manual QA and review** | `qa-manual` | Haiku 5.5 (`xhigh`) | Screen checklist, responsiveness, login flow and checking the data against the wiki. |
| **Athos** | (you) | human | Approves decisions, writes the first data draft and reviews what each agent delivers. |

Notes:
- That is 5 agent roles assuming two Haiku agents. If only one is used, QA 1 and QA 2 become a single role.
- The original plan said Haiku "extra". Claude Code's effort levels are `low`, `medium`, `high`, `xhigh` and `max`, so "extra" is read here as `xhigh`. Change it in `.claude/agents/qa-*.md` if you meant something else. Not every model supports every level; if `xhigh` is rejected for Haiku, use `high`.
- Opus, Sonnet and Haiku 5.5 default to medium effort, which is why each agent file sets `effort` explicitly.

## 3. File owners

Main rule: **every file has exactly one owner**. Nobody edits another owner's file. If a change is needed, ask the owner or the orchestrator. In stage 1, the dev holds both A and B.

| Path | Owner |
|---|---|
| `README.md`, `CLAUDE.md`, `docs/`, `docs/CONTRACTS.md`, folder structure, `.claude/` | Orchestrator |
| `data/*.json`, `tools/*`, `js/requirements.js`, `js/progress.js`, `js/firebase.js`, `js/firebase-config.js`, `firestore.rules`, `firebase.json` | Dev A (stage 1: Athos writes `requirements.js` and the data draft) |
| `index.html`, `region.html`, `route.html`, `account.html`, `css/*`, `js/main.js`, `js/render.js`, `js/data.js`, `img/` | Dev B |
| `tests/*`, `scripts/validate-data.js` | QA 1 |
| `qa/checklist.md`, `qa/reports/*` | QA 2 |
| `data/sample/*` | Orchestrator (layout samples only; Dev B may read them) |

## 4. Contracts between modules (`docs/CONTRACTS.md`)

The orchestrator writes this file **before** releasing parallel work. The contracts are hypotheses until the vertical slice proves them. A first version is already in the kit; the orchestrator reviews it with Athos in Phase 0.

Summary (the exact signatures and data shapes are in `docs/CONTRACTS.md`):

- `requirements.js`: `isAvailable`, `missingFor`, `regionProgress`, `isRegionAvailable`, `missingForRegion`
- `progress.js`: `loadProgress`, `setDone`, `setVisited`, `onProgressChange`, `exportProgress`, `importProgress`, `mergeLocalAndCloud`
- `firebase.js`: `signIn`, `signOut`, `onAuthChange`

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
- `requirements.js` (Athos), local Progress, the Region screen, a real login.
- Done when: marking one entry unlocks the other, Progress survives a page reload and syncs between two devices.

**Phase 2: Widening (stage 2, in parallel)**
- Dev A: the rest of the logic, sync and `firestore.rules` tested in the Emulator.
- Dev B: Home, Region and Route screens, and the account and backup screen, from `docs/DESIGN.md` and `docs/design/`.
- QA 1: `scripts/validate-data.js` (unique ids, valid `requires`, no cycles, coherent `missable`) and tests for `requirements.js`.
- QA 2: QA checklist built from the screens.

**Phase 3: Real data, in batches (Dev A, with Athos)**
- First batch: Moss Grotto, The Marrow and Deep Docks (confirm on the wiki). Each later batch repeats this phase.
- `tools/draft-from-wiki.js` (Dev A) makes drafts from the wiki, after the license and terms of use have been reviewed. Athos rewrites in his own words and verifies; nothing enters `data/` without human review.
- Dev A reviews, completes and standardizes. Each entry has `source`, text in our own words and `dataVersion`.
- QA 1 runs the validator. QA 2 checks a sample against the wiki.

**Phase 4: Integration and QA (Orchestrator)**
- Merge one branch at a time, with tests after each merge.
- QA 2 runs the checklist; findings in `qa/reports/` are routed to the file owner.
- Repeat until the checklist passes.

`docs/PHASE-PROMPTS.md` has a ready-to-paste kickoff prompt for each phase.

## 6. Working conventions

- **Small tasks:** goal, files touched and a definition of done.
- **Branches:** one branch per agent task, named `<agent>/<topic>` (`dev-a/progress-local`, `dev-b/region-page`, `qa-tests/validator`, `qa-manual/checklist`). The orchestrator merges into `main` one branch at a time. Nobody pushes to `main` except through the orchestrator, and nobody force-pushes.
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

## 9. Changes from the Portuguese original

- Added the role-to-agent mapping, the Claude Code mechanics (section 7) and the pointer to `docs/PHASE-0-CHECKLIST.md` for Athos's Phase 0 tasks.
- `index.html`, `route.html`, `account.html` and `img/` added to Dev B's files.
- Haiku "extra" mapped to `xhigh`.
- Stage 1 clarified: `dev-a` acts as both devs, with the orchestrator naming the owner of each task.
