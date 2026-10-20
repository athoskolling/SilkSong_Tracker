# Phase prompts

Ready-to-paste kickoff prompts for the orchestrator (`claude --agent orchestrator`). The orchestrator starts by reading the docs and asking which phase to begin; answer with one of these.

Every prompt assumes the rules in `CLAUDE.md` and `docs/AGENT-PLAN.md`: small tasks, one owner per file, handoff notes, explain non-obvious choices, no invented game facts, no deploys.

---

## Phase 0: Foundation

```
Start Phase 0. Check docs/PHASE-0-CHECKLIST.md and tell me which of my tasks are still open and which of them block you. Then do your half: scaffold the missing folders from docs/STRUCTURE.md section 4, read docs/CONTRACTS.md against the other docs and list every contradiction or gap, and walk me through the contracts one module at a time so I can approve or change them. Do not write any feature code. Do not do my tasks. When I approve the contracts, commit them and update the checklist.
```

## Phase 1: Vertical slice (stage 1)

Athos writes `data/regions.json` (draft) and `js/requirements.js`; the orchestrator guides and reviews.

> Used on 2026-10-19 with two changes from Athos: `dev-a` wrote `js/requirements.js` and the orchestrator researched the slice facts, which Athos confirmed. Phase 1 also includes `firestore.rules` tested in the Emulator, since sync cannot work without it.

```
Start Phase 1, stage 1: one Region, two entries with a dependency between them, local Progress, the Region screen and a real login, end to end. Use only the orchestrator and dev-a (dev-a also acts as dev-b for the UI files you name).
First, with me, choose the slice: which Region and which two entries from the wiki. I will give you the facts; you do not supply any. Then:
1. I write the draft of data/regions.json and the two entries, and js/requirements.js. Do not write them for me. When I say they are ready, review them against docs/CONTRACTS.md and explain what you would change and why.
2. Hand dev-a, in small tasks: progress.js with tests-ready pure functions, firebase.js and its config, and the Region page (region.html, css, render, main) following docs/DESIGN.md and the screens. Each task states the goal, the files and the definition of done.
3. Integrate one branch at a time, run what exists, and tell me what to check by hand.
Done when: marking one entry unlocks the other, Progress survives a reload and syncs between two devices. Stop and report if a contract needs to change.
```

## Phase 2: Widening (stage 2)

Only after the slice works and Athos says so.

```
Start Phase 2: stage 2, in parallel. Update docs/CONTRACTS.md with anything the slice taught us and show me the diff before spawning anyone. Then run these four in parallel, each on files it owns:
- dev-a: the rest of the logic, sync with the merge rule from ADR 0001, and firestore.rules for the site's own Firebase project (ADR 0004) and tested in the Emulator (never deploy).
- dev-b: Home, Route and Account and backup screens plus the phone layout of the Region page, from docs/DESIGN.md and docs/design/screens/. Develop against data/sample/ behind a development switch.
- qa-tests: scripts/validate-data.js and the tests in docs/CONTRACTS.md sections 2, 3 and 6.
- qa-manual: qa/checklist.md from the screens and the V1 definition of done (no wiki checks yet).
Merge one branch at a time, run tests and the validator after each merge, and report to me after each merge.
```

## Phase 3: Real data, in batches

Repeat for each batch. Batch 1 is Moss Grotto (Bone Bottom is a Sub-area of it), The Marrow and Deep Docks. There is no draft script (checklist item 4, Athos, 2026-10-20).

```
Start Phase 3 for batch <N>: <Regions>. I write the entries in docs/PHASE-3-BATCH-<N>.md from my own play, checked against the main wiki by hand. You cross-check facts with web searches (never fetching hollowknight.wiki or Fextralife) and tell me every disagreement; you do not fill in any fact yourself. When I say a Region is ready: dev-a turns it into data/*.json (ids, steps, requires, source, one dataVersion raise for the batch) and runs the validator; qa-tests runs the validator and the tests; qa-manual checks the screens with the new data. I check at least 10 percent of entries (never fewer than 5) against the main wiki myself. Report findings routed to the file owner.
```

## Phase 4: Integration and QA

```
Start Phase 4. Merge the outstanding branches one at a time, running node --test tests/ and the validator after each. Then have qa-manual run qa/checklist.md on the merged result and write qa/reports/. Route every finding to the owner of the file with a clear note, re-run, and repeat until the checklist passes. Finish with the V1 definition of done from docs/AGENT-PLAN.md section 8: for each line say passed, failed or not checked yet, and why.
```

---

## Helper prompts (any time)

Review what I wrote:

```
Review <file>. You are the reviewer, not the author: do not rewrite it. Tell me what is wrong or risky, what you would change and why, and what is good. Check it against docs/CONTRACTS.md and GLOSSARY.md.
```

Explain a decision:

```
Explain why <decision> was made, what the alternatives were and what it costs, in plain words. If it is not recorded, tell me and propose an ADR in docs/adr/.
```

Check the docs against each other:

```
Read docs/STRUCTURE.md, docs/AGENT-PLAN.md, docs/CONTRACTS.md, docs/DESIGN.md, docs/IMAGES.md and GLOSSARY.md. List every contradiction, gap or term used differently. Do not fix anything yet.
```

Add an image:

```
I put <file> in img/incoming/ for the Region <region-id>. Set it up following docs/IMAGES.md and show me the result.
```

Record a decision:

```
Write an ADR for <decision> in docs/adr/ using the same short format as 0001 to 0003 (what we decided, why, what we gave up).
```
