# Silksong Guide

A progress guide for Hollow Knight: Silksong, built for finishing the game at maximum completion: collect everything and reach every ending. Follow the Route, mark what you finished and see what is still missing. It works without an account, saves in your browser first and can sync between devices through a login.

**Status: planning and design are finished; no code yet.** See `docs/AGENT-PLAN.md` for the phases.

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
| `data/sample/` | invented sample data for tests and layout work; not guide facts |
| `athos-notes-pt-br/` | the original Portuguese planning notes |

## Working with Claude Code

```
claude --agent orchestrator
```

The orchestrator reads the docs, reports the state of Phase 0 and asks which phase to start. Ready-made prompts for each phase are in `docs/PHASE-PROMPTS.md`.

## Running the site (once pages exist)

The site is static. From the repository root:

```
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Tests: `node --test tests/`. Data check: `node scripts/validate-data.js`.

## Stack

Plain HTML, CSS and JavaScript. No framework and no backend of our own. Firebase Auth and Firestore (shared with Hollow-Thingy) for sign-in and sync. GitHub Pages for hosting.
