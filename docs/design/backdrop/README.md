# Backdrop mockups (BG-1)

A faint, darkened copy of the Region's own picture behind the whole Region page (decided 2026-10-20). Mockups only: no site code was changed. Static HTML that links the real `css/base.css` and `css/components.css`, plus `backdrop.css` for the new rules (about 40 lines; would move into `css/components.css`). Every name, step and count is invented ("Sample tool"); the picture is the placeholder `img/regions/deep-docks.png` (640 x 360, (c) Team Cherry). Each mockup has `-desktop.png` (1280 px, scale 1) and `-mobile.png` (390 px, scale 2).

## Files

| Mockup | What it shows |
|---|---|
| `region-backdrop-a` | Available and Visited Region, picture hero, backdrop at 5 percent, no blur ("very faint"). |
| `region-backdrop-b` | Same page, 8 percent, 10 px blur ("faint"). **Recommended.** |
| `region-backdrop-c` | Same page, 10 percent, 24 px blur ("moderate"; see "Why the top is 10 percent"). |
| `region-no-image` | A Region with no `heroImage`: no backdrop, today's plain gradient hero. |
| `region-locked` | A Locked Region that has an image: picture and backdrop both off. **Recommended.** |
| `region-locked-shown` | Same Locked page with backdrop b on, only so you can compare. |

Support files: `backdrop.css`, `_build.mjs` (writes the six HTML files), `_shoot.mjs` (screenshots, overflow checks, contrast table).

## The CSS approach

- A `<div class="backdrop" aria-hidden="true"><img alt="" ...></div>` as the first child of `<main>`. The `<img>` is the same file as the hero (`heroUrl`, same `object-position` from `heroPosition`), so the browser downloads it once. Cost: **one extra image decode per Region page**, and with blur one extra filtered layer (the layer is static, so it is painted once, not on scroll).
- `<main class="has-backdrop">` is `position: relative; isolation: isolate`, and the layer is `position: absolute; z-index: -1`: above the page's `--night`, below the hero, thread and plates.
- **Darkening is `opacity` on the image**, not an overlay. The page behind is `--night`, so opacity 0.08 is exactly 8 percent picture and 92 percent `--night`; the same look as a `--night` overlay with one layer fewer.
- **It scrolls with the page** (absolute, not fixed, no `background-attachment: fixed`). Nothing moves relative to the content, so there is no parallax and nothing for `prefers-reduced-motion` to switch off. It also avoids the repaint cost of fixed layers on phones.
- A vertical `mask-image` fades it out toward the bottom (the layer is at most 1100 px tall and never taller than `<main>`), so the end of a long list and the footer sit on plain `--night`. The top of the layer is under the hero, so what you see starts just under the slanted hero edge and fades over the first screen and a half.
- No sideways growth: the layer is clipped to `<main>` (`overflow: hidden`); the `<img>` is 48 px larger on each side only so the blur has no soft border. Checked at 1280, 390, 360 and 320: page overflow 0 px in every mockup. (`main` alone reports a wider scroll width on the picture pages, but that is the existing hero text band in `components.css`, `left/right: -100vw`, which `.page { overflow-x: clip }` cuts. With that band removed the number is 0 px, so the backdrop adds none.)
- `@media (prefers-contrast: more), (forced-colors: active), print` hides it.
- A Region without `heroImage` renders no layer at all.

## Contrast

Method (`_shoot.mjs`): the page is loaded, everything that is not background is made invisible (text transparent, thread, marks, bars, links hidden), the page is screenshotted, and for each element the **lightest pixel** inside its box is found. The ratio is the element's own token color against that pixel (WCAG 2.x). Two tables come out of it:

1. **In place**: every text line and thread line of the mockup at its real position, at 1280 and 390. Worst over both widths, per strength:

| Strength | Worst text | Worst line (thread) |
|---|---|---|
| a, 5 percent | 5.02:1 (the "Next on the route" flag, silk on the next row's fill) | 3.73:1 (to-do thread, `--thread`) |
| b, 8 percent | 4.93:1 (same) | 3.67:1 |
| c, 10 percent | 4.92:1 (same) | 3.65:1 |

2. **Strict bound**: the lightest backdrop pixel from the top of the first entry row downward, wherever it is. Any row of any Region, in any order, sits on something no lighter than this, so it does not depend on where this mockup's rows happen to fall. Worst of 1280 and 390:

| Pair (need) | a | b | c |
|---|---|---|---|
| Lightest backdrop pixel | rgb(29,18,20) | rgb(34,19,20) | rgb(39,21,20) |
| Ivory text: entry names, how lines (4.5) | 15.17 | 14.74 | 14.43 |
| Ash text: meta, step, how, needs (4.5) | 7.66 | 7.45 | 7.29 |
| Ember text: "Can be missed" (4.5) | 7.05 | 6.86 | 6.71 |
| Silk text: "Needs ..." lines, "Next on the route" flag (4.5) | 5.24 | 5.09 | 4.98 |
| Silk text on the next row's 7 percent silk fill (4.5) | 4.86 | 4.72 | 4.60 |
| `--thread` line, to-do thread (3) | 3.61 | 3.50 | 3.43 |
| `--silk` line: done thread, start thread, focus ring on a link (3) | 5.24 | 5.09 | 4.98 |

All pass, for this picture. Not measured against the backdrop on purpose: text inside the plates (their gradient is opaque), beads and knots (each sits in a 5 px `--night` ring, so its neighbour is the ring, not the picture), the hero (unchanged), and the plate and next-row borders (already accepted below 3:1, `DESIGN.md` section 3). Focus rings on the beads sit inside that ring; focus rings on links sit on the backdrop and are in the table (silk line row). No token was changed.

### Why the top is 10 percent

With the tokens fixed, `--silk` text (4.5:1) is the tightest pairing: it needs a background no lighter than about rgb(40,23,21). That is the whole budget: the backdrop can lift `--night` (19,11,19) by about 20 levels per channel, whatever its look. On this picture that is about 10 percent opacity. At 12 percent (blur 24) the "Next on the route" flag measured 4.46:1 and failed. So "moderate" is as strong as this page can get without changing a token or putting a darker panel behind the rows.

### The result depends on the picture

The numbers above are for the 640 x 360 placeholder. A different or sharper picture (the real files are 1920 x 1080) has different bright pixels. For a pure white picture the same strengths give: a passes everything (lightest pixel (31,23,31); next-row flag 4.65:1); b fails the next-row flag (4.24:1); c fails the next-row flag (4.00:1) and the "Needs" lines (4.37:1). So **only a is safe for any picture by construction**; b and c need the measurement for each real image. Run it when converting an image (`docs/IMAGES.md` step 3):

`IMAGE=img/regions/<id>.jpg node docs/design/backdrop/_shoot.mjs --measure` (path relative to this folder or absolute), and read the "strict bound" tables. `STRENGTH=0.08 BLUR=10` tries other values without editing the CSS. If a picture fails at the chosen strength, lower the strength for that Region (see open question 2).

## Recommendation

**Backdrop b (8 percent, 10 px blur), with the per-image measurement as part of converting each picture.** Why: a is so faint (the lightest pixel is only 10 levels above `--night`) that the page looks the same as today; c is at the edge of what the tokens allow on this picture and would fail on a brighter one; b is visible as a warm glow under the hero and behind the first entries, and keeps a margin of 0.2 to 0.5 on the tight pairs (4.72 against 4.5, 3.50 against 3). The blur matters more with the real 1920 pictures, whose fine detail would otherwise run behind the text; 10 px keeps the shapes readable (bells, light) without crisp edges near words.

**Locked Region: no backdrop, and no picture at all** (what `js/render.js` already does for the hero). Why: (1) the picture is the Region's own art and "Locked" means it shows only its name and what is missing (`DESIGN.md` section 6, spoiler rules); a faint glow still shows the place's color and shapes; (2) the plain Locked hero has the slanted edge, and a glowing layer under it makes that edge look like a mistake (see `region-locked-shown-desktop.png`); (3) it keeps "locked" readable at a glance, because the page is visibly plainer than an open Region. The backdrop then appears when the Region opens, which is a small reward.

**A Region that is Available but not yet Visited** (entries hidden behind the notice): not shown in a mockup; I would show the backdrop, since the hero picture is already shown in that state. Say if you want it off until Visited.

## Open questions for Athos

1. Locked: confirm no backdrop (recommended), or show it (`region-locked-shown`)?
2. The strength is one global value (8 percent) or can a Region override it (a `backdropStrength` data field would be a contract change, the orchestrator's decision)? I suggest a global value and lowering it only if a real picture fails the measurement.
3. Is a visible glow worth the budget limit? A stronger backdrop needs either a changed token (not allowed) or a darker panel behind the entry column, which changes the look from "thread on the page" to "list in a box". I did not draw that.
4. Phone: the 390 px page shows a narrow centre slice of the picture, blurred, so it reads as a warm glow, not a scene. Fine, or drop the backdrop below 600 px to save the decode on phones?

## How the screenshots were made

`node docs/design/backdrop/_build.mjs` writes the HTML; `node docs/design/backdrop/_shoot.mjs` drives the system Chromium (`/usr/bin/chromium`, headless) over the DevTools protocol with Node's built-in WebSocket (no Playwright on this machine, same as `docs/design/goal/_shoot.mjs`), with `prefers-reduced-motion: reduce` on so the start thread is drawn. Desktop is 1280 px at scale 1; phone is 390 px at scale 2. The strip that links the mockups is hidden in the PNGs. The script also checks sideways scroll at 390, 360 and 320 and prints the contrast tables.

## What I could not check

- Only Chromium. `mask-image`, `filter: blur()` and `isolation` are supported in current Safari and Firefox, but I did not see them there; the fallback if a mask failed is a backdrop that does not fade (still under the same 8 percent budget, so contrast holds, but the page bottom would show it).
- No real phone: scroll smoothness with the blurred layer and its memory cost on an older phone are not measured.
- The real 1920 x 1080 pictures do not exist yet; all numbers are for the 640 x 360 placeholder (re-measure each one).
- Contrast is computed from screenshots at device scale 1 in sRGB; I did not test with Windows high-contrast or a screen reader (the layer is `aria-hidden`, the image has `alt=""`).
- Only one Region image exists, so how a bright Region (a pale scene) looks is untested.

## Built (BG-2, 2026-10-21)

The mockup rules now live in `css/components.css` (section "backdrop"), with the strength, blur and fade written as fixed values (0.08, 10 px, 35 percent hold) instead of the mockup's `--backdrop-*` variables and the a/b/c classes. They went into `components.css` and not a new file because every page already loads it, so no page can forget a stylesheet. The layer is made by `setBackdrop` in `js/render.js`: on a Region page from the Region's own `heroImage` (not for a Locked Region), on every other page from the `SITE_BACKDROP` constant (`null` until `img/backdrop/site.jpg` exists; see `img/backdrop/README.md`). This folder is still the design record; `_shoot.mjs` measures the mockup pages, not the site.
