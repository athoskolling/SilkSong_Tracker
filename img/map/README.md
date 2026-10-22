# pharloom-trace.svg

A vector trace (about 125,000 filled sub-paths in 94 layers) of a stitched full map of Pharloom
from Hollow Knight: Silksong, credited on the source image to "Brent / Steam". The map art is
Team Cherry's. Made with an automated trace: icons were removed and painted over, colours were grouped
into 12 hues with 8 brightness layers each, and the outlines were traced at 3x.

Measured against the cleaned source image at 1542 x 1080: 32.0 dB PSNR, mean error 8.7 of 255
on the pixels that are not background. It is a close copy, not an exact one. Fine text is
slightly rough, the fills are posterised, and a few faint smudges remain where icons were.

Not cleared for the site: docs/IMAGES.md needs Athos's explicit yes for any game art.

## The map pictures the Map page uses

- `pharloom-map.png`: the stitched map of Pharloom (3084 x 2160), the source picture enlarged 2x with an upscaling model (`tools/upscale-map.py`).
- `regions/<region-id>.png`: one cut-out per Region (`tools/make-map.py` from `tools/map-boxes.json`), listed in `data/map.json`.
- `pharloom-trace.svg` is the earlier vector trace and is not used by the site.

Same rights note as above: Team Cherry's artwork, and the permission of whoever stitched the picture has not been asked (`docs/IMAGES.md`).
