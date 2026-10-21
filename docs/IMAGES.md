# Images

Rules for the images on the site. Athos downloads or captures the images; the agents set them up.

## What the site uses

One **hero image per Region**, shown at the top of its Region page, as a small crop on its Home card, and as the faint backdrop behind its Region page. One **shared backdrop picture** for every page that is not a Region page (Home, Route, Trackers, Rosaries, Builds, Goal, Account; Athos, 2026-10-21, option B): `img/backdrop/site.jpg`, same specification as a hero, a scene from early in the game so it spoils nothing, credited in those pages' footers. Backdrop rules: `docs/DESIGN.md` section 9. Nothing else uses game art: no icons, no sprites, no map.

## Specification

| | |
|---|---|
| Path | `img/regions/<region-id>.jpg` (the `id` from `regions.json`, for example `deep-docks.jpg`). `.png` is also accepted, so the current placeholder stays valid; prefer JPEG for screenshots because it is much smaller |
| Ratio | 16:9 |
| Size | at least 1920 × 1080 for the real file; under about 400 KB after compression (JPEG quality around 80 to 85) |
| Content | a clean scene: no HUD, menus, text, health bars or watermarks. Crop or use a clean capture. Avoid story spoilers (late bosses, endings) in the hero of an early Region |
| Focus | the subject should sit in the upper-middle: the hero is cropped with `object-fit: cover` and the title covers the lower left. Set `heroPosition` if the default (`50% 40%`) crops badly |
| Alt text | `alt=""`. The hero is decoration; the Region name is the heading |
| Credit | `heroCredit` in `regions.json`, shown in the page footer. Required whenever `heroImage` is set |

Credit line used so far: `Screenshot from Hollow Knight: Silksong, © Team Cherry.`

## The page must work without an image

`heroImage` is optional. A Region with no image renders the same hero block with a plain `--lacquer` to `--night` gradient and the title, and no credit line. The hand-drawn fallback in `docs/design/art/deep-docks-hero-drawn.svg` (no game assets) can be used for Deep Docks if the screenshot is ever removed.

## How Athos sends images

1. Put the original files in `img/incoming/` (git-ignored). Name each one after the Region id (`moss-grotto.png`, `the-marrow.png`), and the shared backdrop `site.png`.
2. Tell the orchestrator which Region each one is for and where the subject sits if it matters.
3. Dev B converts each into `img/regions/<region-id>.jpg` (any tool; say which in the handoff), then sets `heroImage`, `heroPosition` and `heroCredit` on the Region (Region data is Dev C's; Dev B hands the three values over), and measures the backdrop contrast (`docs/design/backdrop/_shoot.mjs --measure`). A picture that fails is recropped or replaced. QA 1's validator checks the file exists and the credit is present. The shared picture becomes `img/backdrop/site.jpg`, and Dev B points the code at it.
4. Athos looks at the result in the browser before it is merged.

## Current state

- `img/regions/deep-docks.png` is a 640 × 360 screenshot Athos supplied. It is a **placeholder**: below the 1920 × 1080 target, so it looks soft on a wide screen. It is a PNG, which the data accepts (`heroImage` may end in `.jpg` or `.png`); when the larger one arrives, save it as `deep-docks.jpg` and update `heroImage`.
- The mockups point at this PNG with a relative path.

## Rights and risk (decision recorded, not legal advice)

Game screenshots are Team Cherry's copyrighted work. Athos decided to use screenshots with a credit, for his own fan guide. This is a judgement call, not a license: the credit does not grant permission, and a rights holder can ask for removal. The setup keeps that cheap to undo: one file per Region, one data field, a page that works without it and a drawn fallback. If the site is ever monetized, or if Team Cherry or its publisher publishes fan-content guidelines, review this again. The draft script and the wiki never supply images (see `docs/STRUCTURE.md`, section 8).

## Open

- Home card thumbnails: the mockup shows small drawn placeholders. In the product, Dev B uses a cropped `heroImage` when there is one and shows Athos before merging.
