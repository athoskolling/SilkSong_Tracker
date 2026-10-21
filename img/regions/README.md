# Region hero images

One picture per Region: `img/regions/<region-id>.svg`, original artwork drawn for this guide (no game assets), written by `node tools/make-backgrounds.mjs` from the repository root. Change the script, not the files. Each Region's `heroImage` in `data/regions.json` points at its file and `heroCredit` reads "Original artwork drawn for this guide."

A screenshot can still replace one: save it as `<region-id>.jpg` (16:9, at least 1920 × 1080, no HUD or text), point `heroImage` at it and change `heroCredit` to the Team Cherry credit. Full rules: `docs/IMAGES.md`.

`deep-docks.png` is an old 640 × 360 screenshot placeholder, kept only because the mockups in `docs/design/` link to it. The site does not use it.
