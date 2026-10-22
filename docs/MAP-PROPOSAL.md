# Map proposal

**Status: proposal, written 2026-10-22. Awaits Athos's review.** It is not part of `docs/CONTRACTS.md` yet: changing a contract is the orchestrator's job and Athos approves it. Everything here is additive: no existing file, function, page or saved Progress changes meaning.

## What Athos asked for

A map in the guide where an entry he marks done disappears from the map too. He first asked for MapGenie in an iframe. An iframe from another website cannot be read or changed by our page (the browser keeps the two apart), and MapGenie keeps its own found markers in its own account or browser storage. So a MapGenie iframe can sit beside the guide but cannot follow Progress. The map therefore reads our own Progress. MapGenie is not used or fetched (it could not be reached from the workspace in any case).

## Words

**Pin**: the position of one entry on a Region's map. A Pin is data about *where*; whether the entry is done always comes from Progress. Not a Place (a Place is a bench or a shop and is never done).

Avoid: marker, location (for the data entry).

## `data/map.json` (optional file)

```json
{
  "dataVersion": 1,
  "maps": [
    {
      "regionId": "deep-docks",
      "image": "img/map/deep-docks.jpg",
      "credit": "Screenshot from Hollow Knight: Silksong, © Team Cherry.",
      "alt": "Short description of what the map shows."
    }
  ],
  "pins": [
    { "itemId": "example-entry", "x": 42.5, "y": 61.0 }
  ]
}
```

Both lists are required in the file and may be empty. The file carries the same `dataVersion` as every other file in `data/`.

| Field | Where | Type | Notes |
|---|---|---|---|
| `regionId` | map | Region id | must exist; one map per Region |
| `image` | map | string | relative path, no leading slash, no `..`, ends in `.jpg`, `.png` or `.svg`, and the file exists (same rules as a Region's `heroImage`) |
| `credit` | map | string | required, shown under the image |
| `alt` | map | string | required, what a screen reader hears for the image |
| `itemId` | pin | entry id | must exist; at most one Pin per entry |
| `x`, `y` | pin | number, 0 to 100 | percent of the image's width and height from the top left, so the position holds at any size |

A Pin belongs to the map of its entry's Region (`regionId` on the entry). There is no `regionId` on a Pin, so it cannot disagree with the entry.

## Behaviour

- **Done Pins are hidden.** The map shows a Pin for every entry that is not done. Marking an entry done (on the map, a Region page, a Tracker, the Goal box) removes its Pin; unmarking brings it back. A switch "Show done entries" draws them dimmed with a dashed outline, so state is never colour alone.
- **Spoilers follow the Region rule.** A Region's map is shown when the Region is Available and Visited (or something in it is done), or when "Show everything" is on. Otherwise the page says the map is hidden and why. A Locked Region is shown the same way as on the Region page.
- **Same functions as everywhere.** The page marks entries with `setDone` and reads Progress through `loadProgress` and `onProgressChange`. It adds nothing to Progress, counts, the Route, Visited or Goal.
- **A Region with no map** says "Not in the guide yet". The page works with no `map.json` at all.
- **Placing Pins** is a tool, not part of the player's interface. Opening `map.html?place` adds a panel: choose a local image to try (never uploaded), choose an entry, click the map to set its position, and copy or download the new `map.json`. Nothing is saved by the page; the file is committed by hand. Why: Pin positions are content only Athos can supply (from his own play), and a click on the image is the least error-prone way to write them.

## Validator rule 17 (`scripts/validate-data.js`)

Errors: the file has `maps` and `pins` lists; each map has an existing `regionId` (once only), a `credit`, an `alt` and a valid existing `image`; each Pin has an existing entry id (once only) and numbers `x` and `y` from 0 to 100. Warning: a Pin whose entry's Region has no map (it would never be drawn). `map.json` must carry the same `dataVersion` as the other files (rule 1).

## Not decided

1. **Where the page is linked from.** The header keeps its six links (contract section 5). This branch links `map.html` from the Trackers page's "Plan with what you have" list only. A seventh header link, or a link on each Region page, is Athos's choice.
2. **The map images.** Athos supplies in-game map screenshots (the same way as the Region hero images, with the same credit). The rule on game art in `CLAUDE.md` (rule 9) names only the Region screenshots and the sprites, so using map screenshots needs his explicit yes, recorded in `docs/IMAGES.md`.
3. **Where Pin positions come from.** From his own play, with the placer. Nothing is copied from MapGenie or any other map site.
4. **The overlay.** The Windows app could show this page, but that is a separate step on the `windows-app` branch.
