// make-icons.mjs: turns each entry's in-game sprite into a pixel-art icon, img/icons/<entry-id>.png
// (256 x 256, drawn on a 64 x 64 grid, one shared look for all of them).
//
// Setup (once):   npm install --no-save sharp
// Run (repository root):   node tools/make-icons.mjs [entry-id ...]      (no ids = every entry)
//
// Input: tools/icon-sources.json, which says for each entry id which sprite to use: { "<id>": { "file": "<Drive
// file id>", "name": "<sprite name>", "path": "<folder in the sprite collection>" } }. The sprites come from a
// community collection of the game's own sprites ("Hollow Knight: Silksong sprites", a link-shared Google Drive
// folder, 1gG_EERUu5pqBmm5y-4iEK7rl8vRnba8U). They are downloaded once into img/incoming/sprites/ (git-ignored).
// The sprites and the characters in them are Team Cherry's; the pixel art is a derivative of them, credited in the
// site footer (docs/IMAGES.md). Athos chose this on 2026-10-21 instead of original drawings.
//
// How a sprite becomes pixel art: trim the empty border, shrink it to fit a 64 x 64 grid with a 3 px margin, make
// the edge crisp (a pixel is either there or not), cut the colours down to one small palette, add a one pixel dark
// outline, and enlarge by exactly 4 with no smoothing. Change PARAMS below to change every icon at once.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PARAMS = { grid: 64, scale: 4, margin: 3, colors: 20, alphaCut: 110, outline: [11, 6, 12] };

const sources = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'icon-sources.json'), 'utf8'));
const cacheDir = path.join(root, 'img', 'incoming', 'sprites');
const outDir = path.join(root, 'img', 'icons');
fs.mkdirSync(cacheDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

async function sprite(source) {
  const file = path.join(cacheDir, `${source.file}.png`);
  if (!fs.existsSync(file)) {
    const response = await fetch(`https://drive.google.com/uc?export=download&id=${source.file}`);
    if (!response.ok) throw new Error(`download of ${source.name} failed (${response.status})`);
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  return file;
}

// `crop` ({ left, top, width, height }, in sprite pixels) picks one picture out of a sheet that holds several.
export async function pixelate(file, out, params = PARAMS, crop = null) {
  const { grid, scale, margin, colors, alphaCut, outline } = params;
  const whole = crop ? await sharp(file).extract(crop).toBuffer() : file;
  let trimmed = await sharp(whole).ensureAlpha().trim({ threshold: 1 }).toBuffer().catch(() => sharp(whole).ensureAlpha().toBuffer());
  // A long thin sprite (a needle, a pin) would shrink to a few pixels wide: turn it 45 degrees so it fills the square.
  const shape = await sharp(trimmed).metadata();
  if (Math.max(shape.width / shape.height, shape.height / shape.width) > 2.6) {
    trimmed = await sharp(trimmed).rotate(shape.height > shape.width ? 45 : -45, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).trim({ threshold: 1 }).toBuffer();
  }
  const inner = grid - 2 * margin;
  const small = await sharp(trimmed).resize(inner, inner, { fit: 'inside', kernel: 'lanczos3' }).toBuffer();
  const meta = await sharp(small).metadata();
  const base = await sharp({ create: { width: grid, height: grid, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: small, left: Math.floor((grid - meta.width) / 2), top: Math.floor((grid - meta.height) / 2) }])
    .raw()
    .toBuffer();
  const data = Buffer.from(base);
  for (let i = 0; i < grid * grid; i++) data[i * 4 + 3] = data[i * 4 + 3] >= alphaCut ? 255 : 0;
  const quantised = await sharp(data, { raw: { width: grid, height: grid, channels: 4 } }).png({ palette: true, colors, dither: 0, effort: 10 }).toBuffer();
  const pixels = Buffer.from(await sharp(quantised).ensureAlpha().raw().toBuffer());
  const result = Buffer.from(pixels);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const i = (y * grid + x) * 4;
      if (pixels[i + 3]) continue;
      const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < grid && ny < grid && pixels[(ny * grid + nx) * 4 + 3];
      });
      if (touches) {
        result[i] = outline[0]; result[i + 1] = outline[1]; result[i + 2] = outline[2]; result[i + 3] = 255;
      }
    }
  }
  await sharp(result, { raw: { width: grid, height: grid, channels: 4 } })
    .resize(grid * scale, grid * scale, { kernel: 'nearest' })
    .png({ palette: true, colors: colors + 2, dither: 0 })
    .toFile(out);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const only = process.argv.slice(2);
  const ids = only.length ? only : Object.keys(sources);
  let done = 0;
  const missing = [];
  for (const id of ids) {
    const source = sources[id];
    if (!source || !source.file) {
      missing.push(id);
      continue;
    }
    try {
      await pixelate(await sprite(source), path.join(outDir, `${id}.png`), PARAMS, source.crop || null);
      done += 1;
    } catch (error) {
      console.error(`${id}: ${error.message}`);
      missing.push(id);
    }
  }
  console.log(`Wrote ${done} icons to img/icons.`);
  if (missing.length) console.log(`No icon: ${missing.join(', ')}`);
}
