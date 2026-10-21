# img/backdrop

The faint backdrop of every page that is not a Region page: `home`, `route`, `trackers`, `rosaries`, `builds`, `goal` and `account` (`<page>.svg`, one each). A Region page uses its own hero picture from `img/regions/` instead.

They are original artwork drawn for this guide, written by `node tools/make-backgrounds.mjs` from the repository root (change the script, not the files). The page-to-file map is `SITE_BACKDROPS` in `js/render.js`; a page not in the map, or set to `null`, has no backdrop. The footer credit reads "Backdrop image: Original artwork drawn for this guide."

Shown at 8 percent and blurred (`docs/DESIGN.md` section 9), so they are shapes and colour more than detail.
