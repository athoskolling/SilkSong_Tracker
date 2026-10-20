# Self-hosted fonts

The site serves its own fonts so a visitor's browser does not contact Google. Both families are under the
SIL Open Font License 1.1; the license text of each is next to the files (`OFL-Gloock.txt`,
`OFL-InstrumentSans.txt`) and must stay with them.

| File | Family | Used for | Source |
|---|---|---|---|
| `Gloock-Regular.woff2` | Gloock, regular | display headings | `ofl/gloock/Gloock-Regular.ttf` in the google/fonts repository, commit `c1eda9233c33ad7775b27efd794f931095cf6133`. Designer's repository: https://github.com/duartp/gloock |
| `InstrumentSans-VF.woff2` | Instrument Sans, variable (weight 400 to 700, width axis) | body text (400, 500, 600) | `ofl/instrumentsans/InstrumentSans[wdth,wght].ttf` in the google/fonts repository, commit `0b58fb370093f9a9f4ff785d94405710b79de67c`. Designer's repository: https://github.com/Instrument/instrument-sans |

Repository: https://github.com/google/fonts (the `OFL.txt` files come from the same commits).

## What was changed

Nothing in the fonts themselves. The upstream files are TTF; each was converted to WOFF2 with
`woff2_compress` (Google's reference encoder), which is a lossless re-compression of the same font data:
no glyphs removed, no subsetting, no edits. Both files are under 100 KB, so subsetting was not worth the
risk of losing a glyph.

To update a font, download the new upstream file, convert it the same way, replace it here, and update the
commit above.
