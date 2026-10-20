# Silksong Guide

A static site (plain HTML, CSS and JavaScript, no framework, no backend of our own) that guides a max-completion, all-endings Hollow Knight: Silksong run. The player follows a Route, marks what they finished and sees what is missing. Progress is saved in the browser first and synced through the site's own Firebase project (Auth and Firestore). Hosted on GitHub Pages.

Owner: Athos. He wants to understand the project, so explain the reason behind any non-obvious choice. Reply in English unless he writes in Portuguese. Use Claude as reviewer and guide: he reviews everything. On 2026-10-19 he delegated `js/requirements.js` to `dev-a` and the slice research to the orchestrator; the rest of the data still comes from him and the wiki.

## Where things are

Read the doc a task needs; do not load everything.

- `GLOSSARY.md` and `docs/CONTRACTS.md` are imported below (every agent needs them).
- `docs/STRUCTURE.md`: vision, decisions, V1 scope, folders, data model, hosting.
- `docs/AGENT-PLAN.md`: roles, file owners, phases, V1 definition of done.
- `docs/DESIGN.md` and `docs/design/`: the finished visual design (PNG screens, HTML mockups, tokens).
- `docs/IMAGES.md`: hero image rules and credits.
- `docs/PHASE-PROMPTS.md` and `docs/PHASE-0-CHECKLIST.md`: how each phase starts; what Athos must do himself.
- `docs/adr/`: why: local-first with union merge (0001), permanent ids (0003), own Firebase project with Emulator-tested rules (0004, replaces 0002).
- `.claude/rules/`: path-scoped rules (data, ui, tests, sync). They load when you touch matching files.
- `athos-notes-pt-br/`: Athos's original Portuguese planning notes, for reference only. The English docs in `docs/` are the current ones.

@GLOSSARY.md
@docs/CONTRACTS.md

## Rules that apply to everyone

1. **Use the glossary words** (Collectible, Task, Region, Route, Step, Available, Locked, Visited, Progress, Run) in code, docs and interface text. Do not say item, zone, unlocked, quest or save for them.
2. **Every file has exactly one owner** (table in `docs/AGENT-PLAN.md`). Never edit another owner's file; ask the orchestrator.
3. **Contracts first.** Follow `docs/CONTRACTS.md`. If a signature or data shape is unclear or wrong, stop and ask the orchestrator; do not improvise.
4. **No invented game facts.** Entry names, steps, requirements and counts in `docs/design/` and everything in `data/sample/` are invented layout samples. Never copy them into `data/` or into interface code. Real content comes from Athos and the wiki, rewritten in our own words, each entry with a `source` link.
5. **Content is separate from Progress.** `data/` is game content; Progress stores only ids. Ids are permanent slugs, never renamed (ADR 0003); content changes raise `dataVersion`.
6. **Local first, then the cloud** (ADR 0001). The site works without an account. A cloud error never loses local data.
7. **No secrets in the repository.** The Firebase web config is not a secret; the rules protect the data.
8. **Never deploy.** No `firebase deploy`, no publishing Firestore rules, no force pushes. Athos deploys, after the Emulator tests pass.
9. **Never scrape MapGenie.** Wiki and MapGenie are references, read by hand; text is rewritten in our own words. There is no wiki draft script (Athos, 2026-10-20). Agents never fetch hollowknight.wiki (it blocks bots) or Fextralife (its terms forbid automated access); web search results are fine.
10. **Athos's Phase 0 tasks are his.** Creating the GitHub repository, Pages and privacy, the Firebase authorized domain, the wiki license review and supplying the current Firestore rules. Never do them or assume they are done; if work is blocked by one, stop that thread and say which.
11. **Relative paths everywhere** (GitHub Pages serves the site from `/<repository>/`). No framework, no build step, no CDN script, except the Firebase SDK from gstatic at a pinned version, imported only by `js/firebase.js` (`docs/CONTRACTS.md` section 4).
12. **Small tasks.** Each has a goal, the files touched and a definition of done. End each task with a short handoff note: what changed, decisions and why, open questions, how you checked it.
13. **Tests use native `node:test`.** No framework.
14. **Say what you could not check.** Never claim something works, passes or matches the wiki unless you ran or read it.

## Commands

There is no build. These exist once the matching files do:

- Serve locally: `python3 -m http.server 8000` in the repository root, then open `http://localhost:8000/`.
- Tests: `node --test tests/`
- Validate data: `node scripts/validate-data.js` (add a folder to check another, for example `data/sample`)
- Firestore rules tests: `firebase emulators:exec --only firestore --project demo-silksong-guide "node --test tests/firestore-rules.test.js"` (Emulator only; never `firebase deploy`)

## Agents (`.claude/agents/`)

`orchestrator` (Opus 5.5, high; run the project with `claude --agent orchestrator`), `dev-a` (data and logic) and `dev-b` (interface) on Sonnet 5.5 high, `qa-tests` and `qa-manual` on Haiku 5.5 `xhigh`, `tutor` on Sonnet 5.5 high (read-only; explains the project to Athos, run it in a second terminal with `claude --agent tutor`). The orchestrator logs every task in `docs/PROGRESS-LOG.md`. Workers run in git worktrees that start from the orchestrator's current `HEAD` (`.claude/settings.json`), so the orchestrator commits before spawning them. Stage 1 uses only the orchestrator and `dev-a`.

## Style

- Plain, readable JavaScript modules; short functions; no clever tricks. Comments explain why, not what.
- Interface copy in sentence case, no marketing, no filler (see `docs/DESIGN.md`, section 7).
- Keep this file under 200 lines. Put detail in `docs/` or `.claude/rules/`, not here.
