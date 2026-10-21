# img/backdrop

The one shared backdrop picture for every page that is not a Region page: Home, Route, Trackers, Rosaries, Builds, Goal and Account (Athos, 2026-10-21, option B; `docs/DESIGN.md` section 9, `docs/IMAGES.md`). A Region page uses its own hero picture from `img/regions/` instead, so nothing here is used by it.

## What goes here

| File | Used by |
|---|---|
| `site.jpg` | the seven pages above |

The file does not exist yet (Athos is capturing it). Until it does, `SITE_BACKDROP` in `js/render.js` is `null` and those pages build no backdrop and request no image.

## Specification

- A screenshot from early in the game, so it spoils nothing. Same specification as a hero: 16:9, at least 1920 x 1080, `.jpg`, a sensible file size (compress it; it is shown at 8 percent and blurred, so quality 70 to 80 is plenty).
- The credit line is "Screenshot from Hollow Knight: Silksong, (c) Team Cherry." (with the (c) sign). It is shown in the footer of those pages as "Backdrop image: ...".
- Measure it before it ships: `IMAGE=img/backdrop/site.jpg node docs/design/backdrop/_shoot.mjs --measure` (path relative to that folder or absolute) and read the "strict bound" tables. A picture that fails the contrast floor at 8 percent is recropped or replaced. The strength is never changed for one picture.

## Switching it on

In `js/render.js`, set the one constant (the only place the path, the crop and the credit are named):

```js
export const SITE_BACKDROP = {
  src: 'img/backdrop/site.jpg',
  position: '50% 40%',   // CSS object-position: which part of the picture stays in view
  credit: 'Screenshot from Hollow Knight: Silksong, © Team Cherry.',
};
```

To give each page its own picture later, change `siteBackdropFor(page)` in the same file to look the page up in a map keyed by `document.body.dataset.page`.
