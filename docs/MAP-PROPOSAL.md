# Map page: proposal

**Status: proposal by Claude, 2026-10-22; Athos asked for it ("put the png directly on the website, one full map and another divided by region, with an upscale"). Not a contract: `docs/CONTRACTS.md` is not edited, and the orchestrator decides whether this becomes section 1 text.** It follows the project's rule that an optional data file is added without touching the three core files.

## What it is

`map.html`: two views of the same artwork (Team Cherry's, credited; `docs/IMAGES.md`).

- **Full map.** One picture of the whole of Pharloom, enlarged 2x (3084 by 2160), with zoom buttons, drag to pan, and a link to open the picture on its own. Behind a button ("Show the full map"), because it shows every Region, including ones the player has not reached.
- **By Region.** One cut-out picture per Region, chosen from a list. A Region's picture stays hidden until the Region is Available and Visited (or something in it is done), the same rule as the Region page. "Show everything" turns both off. A button on each Region picture shows where it sits on the full map (an outlined box).

Both views use the existing "Show everything, spoilers included" switch, kept per visit.

## Data: `data/map.json` (optional)

```json
{
  "dataVersion": 14,
  "full": { "image": "img/map/pharloom-map.png", "width": 3084, "height": 2160, "alt": "...", "credit": "..." },
  "regions": [
    { "regionId": "deep-docks", "image": "img/map/regions/deep-docks.png", "width": 700, "height": 340, "box": [1440, 1540, 2140, 1880] }
  ]
}
```

`box` is `[left, top, right, bottom]` in pixels of the full picture. Written by `tools/make-map.py` from `tools/map-boxes.json`. Without the file the page says "Not in the guide yet"; nothing else on the site changes.

## Validator rule 17

The same `dataVersion` as the other files; `full` has an existing relative image, positive whole `width` and `height`, `alt` and `credit`; each Region map names an existing Region once, has an existing relative image, whole `width` and `height`, and a `box` of four whole numbers inside the full picture; warning for a Region with no map. `tests/validate-map.test.js` breaks each of these on purpose.

## Where it is linked

From the Trackers page rail (as Rosaries and Builds are). No header link: the header keeps its six links (CONTRACTS section 5).

## Open for Athos

- The boxes are a first pass by eye; check each Region's picture and say which are wrong. Some Regions are drawn in the same colour as a neighbour, and the sub-areas (Songclave, Exhaust Organ, Halfway Home...) are placed by geometry, not by game knowledge.
- Whether the stitched picture's author is happy with it being used (`docs/IMAGES.md`).
- Pins that disappear when an entry is done (the earlier idea, branch `map`) are not part of this. They need positions only the player's own play can give.
