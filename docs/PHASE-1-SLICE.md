# Phase 1: choosing the vertical slice

For Athos. This explains what the slice is for, how to choose it and what you write. It gives no game facts: the Region and the two entries come from you (your own play and, read by hand, the wiki), never from the orchestrator or the samples.

## What the slice is for

The slice is a test of the plumbing, not of the content. It proves, end to end, that the contracts in `docs/CONTRACTS.md` work in practice:

1. Data loads from `data/*.json`.
2. `js/requirements.js` (yours) says entry B is not Available until entry A is done.
3. Marking A on the Region page makes B Available, with no reload.
4. Progress survives a reload (localStorage).
5. After signing in, Progress shows up on a second device (Firestore).

So the best slice is the **smallest real one that exercises a requirement**. Two entries is enough. More entries teach us nothing new and cost you writing time.

## How to choose

Pick **one Region** and **two entries inside it** that meet all of these:

| Rule | Why |
|---|---|
| The Region is open from the start of the game (its `requires` is `[]`). | A Region with `requires` would need a third entry from another Region to open it. That belongs in Phase 2. |
| Entry B really needs entry A in the game (B cannot be done before A). | This is the requirement chain the slice must prove. Use a real dependency, not an invented one, because these entries ship. |
| At least B is a Collectible (`kind: "collectible"`). A can be a Collectible or a Task. | The counters ("1 of 2") count only Collectibles, so marking B must move a counter. A Task as A also proves that Tasks do not count. |
| You know both from your own play, and can find one page on the wiki for each. | Every entry needs a `source` link. Reading two pages by hand is fine; the bulk-reading rule (checklist item 4) is about scripts and mass copying. |
| Neither is missable. | Missable entries raise questions (`missableNote`, Lockouts) we do not need yet. |

A good shape is "a Task or ability early in the Region, then a Collectible you can only reach after it". If you are unsure between candidates, pick the earliest pair in the game: it will need the fewest changes later when the full Region arrives in Phase 3.

## What you write

Three files in `data/`, all with `"dataVersion": 1` (one version for all three files, `docs/CONTRACTS.md` section 1):

- `data/regions.json`: one Region. `id` (lowercase slug, for example the Region name with hyphens), `name`, `order` (1 is fine), `summary` in your own words, `requires: []`. Leave `heroImage` out unless you want the image now; the page works without it.
- `data/items.json`: two entries. For each: `id`, `name`, `kind`, `type`, `regionId`, `how` (your own words, short), `requires` (A: `[]`; B: `["<A's id>"]`), `step`, `source`.
- `data/endings.json`: `{ "dataVersion": 1, "endings": [] }`. Endings arrive later; the file must exist so all three load the same way.

Tips:

- **Ids are permanent once pushed** (ADR 0003). Choose them as you would want them forever: the plain name as a slug, for example `swift-step` style. No numbers or dates in ids.
- **Steps are not permanent**, but leave gaps (for example 10 and 20) so later entries can slot in between without renumbering everything.
- `data/sample/` shows the shape of each file. Copy the shape, never the names or facts.

Fill this in and send it to me, or write the files directly:

```
Region:   name ______  id ______  summary (your words) ______  wiki page ______
Entry A:  name ______  id ______  collectible or task ______  type ______  step __
          how (your words) ______  wiki page ______
Entry B:  name ______  id ______  collectible or task ______  type ______  step __
          how (your words) ______  wiki page ______
          needs A because ______
```

## `js/requirements.js`: what the slice needs from it

Signatures and rules are in `docs/CONTRACTS.md` section 2. For the slice the Region page uses:

- `isAvailable` (is B Available?),
- `missingFor` (the "Needs <A>" line under B),
- `regionProgress` (the "1 of 2" counter),
- `nextStep` ("Next on the route"),
- `isRegionAvailable` (the Region is Available because its `requires` is empty).

`missingForRegion` and `holdingYouUp` can wait for Phase 2. Write the five above first; I review them against the contract when you say they are ready, and explain anything I would change.
