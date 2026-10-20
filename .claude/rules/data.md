---
paths:
  - "data/**"
  - "tools/**"
  - "scripts/validate-data.js"
---

# Rules for game data

- **Structure:** exactly the shapes in `docs/CONTRACTS.md`. Raise `dataVersion` on every content revision.
- **Permanent ids.** An id is a lowercase slug and is never renamed once published. A wrong id is fixed by adding a new entry and retiring the old one (ADR 0003). Ids are unique across `regions.json`, `items.json` and `endings.json`.
- **Our own words.** `how`, `summary` and every other text are written in our own words. Never paste wiki text. Keep `how` short (under about 300 characters).
- **Every entry has a `source`** (a link to the wiki or MapGenie page). It is a reference, not a copy.
- **Never scrape MapGenie.** Read single pages by hand if you must; do not collect its data.
- **No draft script** (Athos, 2026-10-20). Entries come from Athos, written from his own play and checked against the main wiki by hand. Exception: Act 1 entries come from the orchestrator's research in `docs/PHASE-3-ACT-1.md` (delegated by Athos, 2026-10-20); turn exactly that into JSON and add no fact of your own. Agents never fetch hollowknight.wiki (it blocks bots) or Fextralife (its terms forbid automated access and rewriting for publication). A `source` link to either is fine: a link is not a copy.
- **No facts from memory.** Do not fill in game facts, step numbers or requirements from what you think you remember. Anything in `docs/design/` and `data/sample/` is invented layout content, not data.
- **Collectible or Task.** Only counted Collectibles count (`kind` collectible and `counts` not false; see CONTRACTS section 1). A Task goes into batch 1 only if it unlocks a Collectible.
- **`missable`** is optional (default `false`). If `true`, `missableNote` says when and why.
- **Run the validator** (`node scripts/validate-data.js`) before you hand off any change to `data/`.
- Content ships in batches. The current batch is Act 1, the 12 Regions in `docs/PHASE-3-ACT-1.md`. Do not add entries for a Region outside the batch being worked on.
