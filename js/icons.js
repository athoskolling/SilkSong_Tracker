// icons.js: the pixel-art icon of an entry: img/icons/<entry id>.svg, one drawing per entry, made by
// tools/make-icons.mjs (original artwork, docs/IMAGES.md). If an entry has no icon of its own (a new entry
// added to the data before the icons were redrawn), the icon of its type is shown instead
// (img/icons/type-<type>.svg), and the generic one for a type with none, so a picture is never broken.

const TYPES = new Set([
  'ability', 'ancestral-art', 'boss', 'crafting-kit-upgrade', 'crest', 'everbloom', 'furnishing', 'key',
  'key-item', 'map', 'map-tool', 'mask-shard', 'memento', 'memory-locket', 'needle-upgrade', 'quest', 'relic',
  'silk-heart', 'silk-skill', 'spool-fragment', 'sylphsong', 'tool', 'tool-pouch-upgrade',
]);

// Resolved against this module so it works under /<repository>/ on GitHub Pages, like the data files.
function url(name) {
  return new URL(`../img/icons/${name}.svg`, import.meta.url).href;
}

// `entry` needs `id` and `type`.
export function iconUrl(entry) {
  return url(entry.id);
}

export function typeIconUrl(entry) {
  return url(`type-${TYPES.has(entry.type) ? entry.type : 'generic'}`);
}

// If the entry's own icon is missing, swap in its type's icon (once, so a missing fallback cannot loop).
export function withIconFallback(img, entry) {
  img.addEventListener(
    'error',
    () => {
      const fallback = typeIconUrl(entry);
      if (img.src !== fallback) img.src = fallback;
    },
    { once: true }
  );
  return img;
}
