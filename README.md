# Silksong Guide

A progress guide for Hollow Knight: Silksong, built for finishing the game at maximum completion: collect everything and reach every ending. Follow the Route, mark what you finished and see what is still missing. It works without an account, saves in your browser first and can sync between devices through a login.

**Status: the site is built; content comes next.** Home, Region, Route and Account pages work, with Progress saved in the browser, backup files, and sign-in with sync (rehearsed against the Firebase Emulators; the check on two real devices is pending). The guide holds one Region and two entries so far; batch 1 (Moss Grotto, The Marrow, Deep Docks) is written by Athos from his own play. See `docs/AGENT-PLAN.md` for the phases and `docs/PROGRESS-LOG.md` for what happened so far.

This is an unofficial fan project. It is not affiliated with or endorsed by Team Cherry. Hollow Knight and Silksong are Team Cherry's. Game screenshots shown on the site are credited to them (see `docs/IMAGES.md`). Guide content is written in our own words from the game's wiki and other references, each entry linking to its `source`.

## What is in the repository

| Path | What |
|---|---|
| `docs/STRUCTURE.md` | vision, decisions, scope, folders, data model |
| `docs/AGENT-PLAN.md` | who does what, file owners, phases, definition of done |
| `docs/CONTRACTS.md` | function contracts and data shapes |
| `docs/DESIGN.md`, `docs/design/` | the visual design: written contract, PNG screens and HTML mockups |
| `docs/IMAGES.md` | image rules and credits |
| `docs/PHASE-PROMPTS.md`, `docs/PHASE-0-CHECKLIST.md` | how each phase starts and what the owner must do |
| `docs/adr/` | architecture decisions |
| `GLOSSARY.md` | project vocabulary |
| `CLAUDE.md`, `.claude/` | instructions, agents and rules for Claude Code |
| `index.html`, `region.html`, `route.html`, `account.html`, `css/`, `js/` | the site (`css/fonts/` holds the self-hosted fonts and their licenses) |
| `data/` | guide content (one Region so far) |
| `tests/`, `scripts/validate-data.js` | `node:test` tests and the data validator |
| `tools/` | `sync-rehearsal.mjs`: two-device sync rehearsed against the Firebase Emulators |
| `qa/` | the QA checklist and reports |
| `firebase/` | Athos's copy of the Firestore rules published in the console |
| `docs/PROGRESS-LOG.md` | what was done, task by task |
| `data/sample/` | invented sample data for tests and layout work; not guide facts |
| `athos-notes-pt-br/` | the original Portuguese planning notes |

## Working with Claude Code

```
claude --agent orchestrator
```

The orchestrator reads the docs, reports the state of Phase 0 and asks which phase to start. Ready-made prompts for each phase are in `docs/PHASE-PROMPTS.md`.

## Running the site

The site is static. From the repository root:

```
python3 -m http.server 8000
```

Open `http://localhost:8000/` (add `?data=sample` to any page to see the invented sample data; it never syncs). Tests: `node --test tests/`. Data check: `node scripts/validate-data.js`. Rules tests and the sync rehearsal need the Firebase Emulators; the commands are in `CLAUDE.md`.

## Stack

Plain HTML, CSS and JavaScript. No framework and no backend of our own. Firebase Auth and Firestore (the site's own Firebase project) for sign-in and sync. GitHub Pages for hosting.
