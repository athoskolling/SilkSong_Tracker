# Phase 3, batch 1: what Athos writes

Batch 1 is **Moss Grotto** (with **Bone Bottom** as a Sub-area), **The Marrow** and **Deep Docks** (checklist item 8, confirmed 2026-10-20). There is no draft script (item 4): you write each entry from your own play and check it against the main wiki by hand in your browser. The orchestrator cross-checks facts with web searches and tells you every disagreement; nobody else supplies a fact.

This page gives the shape only. It contains no game facts.

## Before the entries: two questions for you

1. **What counts as a Collectible?** Decided 2026-10-20: what the game itself counts toward 100 percent (the list is in `GLOSSARY.md`). Anything else (fleas, maps, bosses, Wishes) is a Task only if it opens a Collectible or an Ending needs it; otherwise it is not in V1.
2. **Which Tasks?** V1 keeps only Tasks that unlock a Collectible (`docs/STRUCTURE.md` section 2), plus anything an Ending depends on.

## How to write it

- Send it a Region at a time, in this file or in a message. Plain text is fine; Dev A turns it into JSON.
- **Order matters more than numbers.** List entries in the order you would do them across the whole batch (the Route is one sequence across all Regions). Dev A assigns `step` numbers with gaps.
- **Ids are permanent once published** (ADR 0003). Dev A proposes them as plain slugs of the name; you approve the list before the data is pushed. `moss-mother` and `silk-spear` already exist and keep their ids.
- **"How" is short and in your words**: where it is and what to do, one to three sentences. Never paste from a guide.
- **Requires** lists what must be done first in the game, by name. Only real dependencies: "you cannot reach it before X".
- **Source**: one link per entry, to the main wiki page you checked it against (hollowknight.wiki). A link is fine; copying is not.

## Template

```
Region: ______   Regions it needs first (by the entry that opens it): ______
Summary (one or two sentences, your words): ______
Sub-areas used: ______

Entry: ______
  Collectible or Task: ______   Type: ______   Sub-area: ______
  How (your words): ______
  Needs first: ______
  Can be missed? no / yes, because ______
  Source (main wiki page): ______
```

## Endings (not in batch 1)

The **four main Endings** (decided 2026-10-20) ship with the late-game batch, not in V1: they depend on late-game entries, and the validator only accepts conditions that are existing entries. For each: its name, the entries it needs (by name; anything it needs that is not already an entry becomes a Task), which other Endings it closes for good (Lockout), and its main wiki page.
