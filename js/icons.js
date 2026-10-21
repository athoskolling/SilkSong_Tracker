// icons.js: the icon of an entry: img/icons/<entry id>.png, a pixel-art version (256 x 256, drawn on a 64 x 64
// grid) of the entry's in-game sprite, made by tools/make-icons.mjs from tools/icon-sources.json. The sprites are
// Team Cherry's artwork (credited in the footer, docs/IMAGES.md). An entry with no icon shows no picture: the
// image hides itself, so nothing is ever broken.

// Resolved against this module so it works under /<repository>/ on GitHub Pages, like the data files.
export function iconUrl(entry) {
  return new URL(`../img/icons/${entry.id}.png`, import.meta.url).href;
}

// An entry that has no icon (yet) shows nothing, and keeps the layout.
export function withIconFallback(img) {
  img.addEventListener('error', () => {
    img.style.visibility = 'hidden';
  }, { once: true });
  return img;
}
