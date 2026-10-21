# img/backdrop

The faint backdrop of every page that is not a Region page: `home`, `route`, `trackers`, `rosaries`, `builds`, `goal` and `account` (`<page>.svg`, one each). A Region page uses its own hero picture from `img/regions/` instead.

They are original artwork drawn for this guide, written by `node tools/make-backgrounds.mjs` from the repository root (change the script, not the files). The page-to-file map is `SITE_BACKDROPS` in `js/render.js`; a page not in the map, or set to `null`, has no backdrop. The footer credit reads "Backdrop image: Original artwork drawn for this guide."

Shown at 25 percent with a 3 px blur (`docs/DESIGN.md` section 9). `locked.svg` is what a Locked Region shows (never the Region's own picture) and `default.svg` is what any message page or unlisted page shows, so every page has a background.
