// make-icons.mjs: draws the site's own pixel-art icons as SVG files, ONE PER ENTRY: img/icons/<entry-id>.svg
// (16 x 16 pixels, crisp edges), plus one fallback per type (img/icons/type-<type>.svg).
//
// Run from the repository root:   node tools/make-icons.mjs
//
// The icons are original artwork drawn from each entry's name and what it is (a spear for Silk Spear, a bell
// for Bell Beast...). Nothing is copied or traced from the game, so there is no rights question
// (docs/IMAGES.md). Each shape is built from a few drawing calls; the script then adds a light and dark edge
// and a dark outline to every shape, so all the icons share one look. Many-of-a-kind entries (Spool Fragments,
// Mask Shards, Maps, Memory Lockets...) share a drawing and differ by the colour of their Region and a small
// mark picked from their id, so no two look alike. Change this file and run it again; never hand-edit the SVGs.
// The script lists any entry that has no icon of its own (it then falls back to its type's icon).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const N = 16;
const OUTLINE = '#0b060c';

// ------------------------------------------------------------------ colour and pixel helpers

function hex(color) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function shade(color, t) {
  const target = t > 0 ? [255, 255, 255] : [0, 0, 0];
  const k = Math.abs(t);
  return toHex(hex(color).map((v, i) => v + (target[i] - v) * k));
}
function mix(a, b, t) {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  return toHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
}
function hash(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class Pix {
  constructor() {
    this.g = Array.from({ length: N }, () => Array(N).fill(null));
  }
  set(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < N && y < N) this.g[y][x] = c;
  }
  at(x, y) {
    return x >= 0 && y >= 0 && x < N && y < N ? this.g[y][x] : null;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  disc(cx, cy, r, c) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, c);
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.set(x, y, c);
  }
  ring(cx, cy, r, c, inner = r - 1.6) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d <= r * r && d >= inner * inner) this.set(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1;
    for (let i = 0; i <= steps; i++) this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, c);
  }
  thick(x0, y0, x1, y1, c) {
    this.line(x0, y0, x1, y1, c);
    this.line(x0 + 1, y0, x1 + 1, y1, c);
  }
  poly(points, c) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i], [xj, yj] = points[j];
          if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, c);
      }
    }
  }
  clear(x, y) {
    this.set(x, y, null);
  }
  // Copies the left half onto the right, so a symmetrical thing is drawn once.
  mirror() {
    for (let y = 0; y < N; y++) for (let x = 0; x < N / 2; x++) if (this.g[y][x] && !this.g[y][N - 1 - x]) this.g[y][N - 1 - x] = this.g[y][x];
  }
  // Stamps a small picture: rows of characters, `.` empty, other letters looked up in `colors`.
  stamp(x, y, rows, colors) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && this.set(x + i, y + j, colors[ch] || ch)));
  }
  // Light edge top left, dark edge bottom right, then a one pixel outline around everything.
  finish(bevel = true) {
    const out = Array.from({ length: N }, () => Array(N).fill(null));
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const c = this.g[y][x];
        if (!c) continue;
        let color = c;
        if (bevel) {
          if (!this.at(x, y - 1) || !this.at(x - 1, y)) color = shade(c, 0.26);
          else if (!this.at(x, y + 1) || !this.at(x + 1, y)) color = shade(c, -0.26);
        }
        out[y][x] = color;
      }
    }
    const final = out.map((row) => row.slice());
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (out[y][x]) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const px = x + dx, py = y + dy;
          return px >= 0 && py >= 0 && px < N && py < N && out[py][px];
        });
        if (near) final[y][x] = OUTLINE;
      }
    }
    return final;
  }
}

function toSvg(grid, title) {
  const rects = [];
  for (let y = 0; y < N; y++) {
    let x = 0;
    while (x < N) {
      const c = grid[y][x];
      if (!c) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < N && grid[y][x + w] === c) w++;
      rects.push(`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c}"/>`);
      x += w;
    }
  }
  const safe = title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="${N}" height="${N}" shape-rendering="crispEdges" role="img" aria-label="${safe}">
<title>${safe}</title>
${rects.join('\n')}
</svg>
`;
}

// ------------------------------------------------------------------ palette

const SILK = '#ec555b', BRONZE = '#d9a650', IVORY = '#f2e9d8', BONE = '#d9cdb8', STONE = '#a99aa8';
const STEEL = '#9aa4b0', DARK = '#3a2f3a', GREEN = '#5a9a5a', MOSS = '#6fbf6a', TEAL = '#6fd6c0';
const BLUE = '#5b8fe0', VIOLET = '#a98cff', PINK = '#e4a8c0', ORANGE = '#f08a3c', RED = '#e0555b';
const YELLOW = '#e0c24a', BROWN = '#9a6a3a', GOLD = '#ffe9a0', PALE = '#e8e4f0', NIGHT = '#2a1a2e';
const GREY = '#b7a3a6', CRIMSON = '#a02a3a', SAND = '#d0a870', ICE = '#bcd6ff', LIME = '#c8d860';

// The accent of each Region, from the backgrounds (tools/make-backgrounds.mjs).
const REGION = {
  'moss-grotto': '#6fbf6a', 'the-marrow': '#d9cdb8', 'deep-docks': '#f08a3c', 'far-fields': '#e0b060',
  'hunters-march': '#7fb3a0', greymoor: '#8aa4b4', bellhart: '#ec555b', shellwood: '#6fd6c0', wormways: '#a068c8',
  'sinners-road': '#d4553a', 'blasted-steps': '#d09a66', 'weavenest-atla': '#bba6ff', 'grand-gate': '#ffc070',
  underworks: '#ff8a3a', 'choral-chambers': '#ffc880', 'cogwork-core': '#e0a548', 'whispering-vaults': '#7f8cff',
  whiteward: '#d4ecff', 'high-halls': '#ffc8a0', 'the-slab': '#9fb4c4', 'mount-fay': '#9cc0ff', memorium: '#9d88ff',
  'putrified-ducts': '#b6c846', 'wisp-thicket': '#ff7a2a', bilewater: '#d8e04a', 'sands-of-karak': '#ffc070',
  'the-cradle': '#ffd8b8', 'the-abyss': '#8aa0ff',
};

// Eight small marks (3 x 3), one picked from an entry's id, so entries of one family differ.
const MARKS = [
  ['.x.', 'xxx', '.x.'], ['x.x', '.x.', 'x.x'], ['xxx', 'x.x', 'xxx'], ['.xx', 'x..', '.xx'],
  ['x..', '.x.', '..x'], ['xx.', '.xx', 'x..'], ['x.x', 'xxx', 'x.x'], ['.x.', 'x.x', '.x.'],
];
function mark(p, x, y, id, color) {
  p.stamp(x, y, MARKS[hash(id) % MARKS.length], { x: color });
}

// ------------------------------------------------------------------ motifs (shared drawing pieces)

function bell(p, color, { x = 7.5, y = 3, s = 1 } = {}) {
  p.poly([[x - 2 * s, y], [x + 2 * s, y], [x + 3 * s, y + 5 * s], [x + 5.5 * s, y + 8 * s], [x - 5.5 * s, y + 8 * s], [x - 3 * s, y + 5 * s]], color);
  p.rect(Math.round(x - 1), Math.round(y - 2 * s), 2, 2, shade(color, -0.2));
  p.disc(x, y + 9 * s, 1.2 * s, shade(color, -0.3));
}
function needle(p, x0, y0, x1, y1, color = IVORY) {
  p.thick(x0, y0, x1, y1, color);
  p.set(x1, y1, DARK);
}
function sparkle(p, x, y, c) {
  p.set(x, y, c); p.set(x - 1, y, c); p.set(x + 1, y, c); p.set(x, y - 1, c); p.set(x, y + 1, c);
}
function flask(p, color, { x = 7.5, y = 10, r = 4.4 } = {}) {
  p.rect(6, 1, 4, 2, BRONZE);
  p.rect(7, 3, 2, 3, shade(color, 0.35));
  p.disc(x, y, r, color);
  p.set(6, 9, shade(color, 0.6)); p.set(6, 8, shade(color, 0.6));
}
function pouch(p, color) {
  p.disc(7.5, 10, 4.8, color);
  p.rect(5, 3, 5, 3, color);
  p.rect(5, 5, 5, 1, BRONZE);
}
function heart(p, x, y, r, color) {
  p.disc(x - r * 0.9, y, r, color); p.disc(x + r * 0.9, y, r, color);
  p.poly([[x - r * 1.9, y + 0.6], [x + r * 1.9, y + 0.6], [x, y + r * 2.6]], color);
}
function gear(p, cx, cy, r, color, hole = NIGHT) {
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    p.rect(Math.round(cx + Math.cos(a) * (r + 1) - 0.5), Math.round(cy + Math.sin(a) * (r + 1) - 0.5), 2, 2, color);
  }
  p.disc(cx, cy, r, color);
  p.disc(cx, cy, r * 0.4, hole);
}
function claw(p, color, flip = false) {
  const pts = [[3, 2], [6, 2], [11, 6], [13, 12], [12, 14], [10, 9], [6, 5]];
  p.poly(flip ? pts.map(([x, y]) => [15 - x, y]) : pts, color);
}
function cloak(p, color, trim) {
  p.poly([[5, 2], [10, 2], [13, 7], [14, 14], [1, 14], [2, 7]], color);
  p.rect(6, 2, 4, 2, trim);
  p.rect(7, 4, 2, 9, shade(color, -0.25));
}
function key(p, color, { gem = null, bow = 'ring' } = {}) {
  if (bow === 'ring') p.ring(5, 5, 3.6, color, 1.6);
  else if (bow === 'bell') bell(p, color, { x: 5, y: 1, s: 0.42 });
  else if (bow === 'cross') { p.rect(4, 2, 3, 7, color); p.rect(2, 4, 7, 3, color); }
  else if (bow === 'clover') { p.disc(3.8, 3.8, 1.8, color); p.disc(6.4, 3.8, 1.8, color); p.disc(3.8, 6.4, 1.8, color); p.disc(6.4, 6.4, 1.8, color); }
  else p.disc(5, 5, 3.4, color);
  p.line(7, 7, 13, 13, color); p.line(8, 7, 14, 13, color);
  p.rect(11, 13, 2, 2, color); p.rect(13, 10, 2, 2, color);
  if (gem) { p.set(5, 5, gem); p.set(4, 4, gem); }
}
function creature(p, o) {
  const c = o.skin || BONE;
  const shape = o.shape || 'round';
  if (o.wings) { p.poly([[1, 4], [5, 7], [4, 12], [1, 10]], o.wings); p.poly([[14, 4], [10, 7], [11, 12], [14, 10]], o.wings); }
  if (o.hood) { p.poly([[3, 14], [2, 7], [5, 2], [10, 2], [13, 7], [12, 14]], o.hood); }
  if (shape === 'round') p.disc(7.5, 8.5, 4.8, c);
  else if (shape === 'tall') p.ellipse(7.5, 8, 4, 6, c);
  else if (shape === 'wide') p.ellipse(7.5, 9, 6, 4.2, c);
  else p.rect(3, 4, 10, 9, c);
  const h = o.horns;
  if (h === 'short') { p.poly([[3, 6], [2, 2], [6, 4]], o.hornColor || IVORY); p.poly([[12, 6], [13, 2], [9, 4]], o.hornColor || IVORY); }
  if (h === 'long') { p.poly([[3, 6], [1, 0], [6, 3]], o.hornColor || IVORY); p.poly([[12, 6], [14, 0], [9, 3]], o.hornColor || IVORY); }
  if (h === 'antler') { p.line(4, 4, 2, 0, o.hornColor || BONE); p.line(4, 3, 1, 2, o.hornColor || BONE); p.line(11, 4, 13, 0, o.hornColor || BONE); p.line(11, 3, 14, 2, o.hornColor || BONE); }
  if (h === 'antenna') { p.line(5, 4, 3, 0, o.hornColor || DARK); p.line(10, 4, 12, 0, o.hornColor || DARK); p.set(3, 0, o.eyes || SILK); p.set(12, 0, o.eyes || SILK); }
  if (h === 'crown') { p.poly([[3, 4], [3, 0], [5.5, 2], [7.5, 0], [9.5, 2], [12, 0], [12, 4]], o.hornColor || BRONZE); }
  if (o.hat === 'chef') { p.rect(4, 1, 8, 3, IVORY); p.disc(5, 1.5, 1.5, IVORY); p.disc(10, 1.5, 1.5, IVORY); p.disc(7.5, 1, 1.8, IVORY); }
  if (o.hat === 'jester') { p.poly([[3, 5], [1, 1], [5, 3], [7.5, 0], [10, 3], [14, 1], [12, 5]], o.hatColor || RED); p.set(1, 1, YELLOW); p.set(14, 1, YELLOW); }
  if (o.hat === 'helm') { p.rect(3, 3, 10, 4, o.hatColor || STEEL); p.rect(7, 1, 2, 3, o.hatColor || STEEL); p.rect(6, 7, 4, 1, DARK); }
  const e = o.eyes || SILK;
  const es = o.eyeShape || 'dot';
  if (es === 'dot') { p.rect(5, 8, 2, 2, e); p.rect(9, 8, 2, 2, e); }
  if (es === 'slit') { p.rect(4, 8, 3, 1, e); p.rect(9, 8, 3, 1, e); }
  if (es === 'big') { p.rect(4, 7, 3, 3, e); p.rect(9, 7, 3, 3, e); p.set(5, 8, DARK); p.set(10, 8, DARK); }
  if (es === 'one') { p.disc(7.5, 8, 2.4, e); p.set(7, 8, DARK); p.set(8, 8, DARK); }
  if (es === 'three') { p.rect(4, 8, 2, 2, e); p.rect(10, 8, 2, 2, e); p.rect(7, 6, 2, 2, e); }
  const m = o.mouth;
  if (m === 'fangs') { p.rect(5, 12, 6, 1, DARK); p.set(5, 13, IVORY); p.set(10, 13, IVORY); }
  if (m === 'grin') { p.rect(5, 12, 6, 1, DARK); p.set(4, 11, DARK); p.set(11, 11, DARK); }
  if (m === 'maw') { p.rect(5, 11, 6, 3, DARK); p.rect(5, 11, 1, 1, IVORY); p.rect(7, 11, 1, 1, IVORY); p.rect(9, 11, 1, 1, IVORY); }
  if (m === 'line') p.rect(6, 12, 4, 1, DARK);
  if (o.cheeks) { p.set(4, 11, o.cheeks); p.set(11, 11, o.cheeks); }
  if (o.scar) { p.line(9, 5, 11, 11, o.scar); }
  if (o.spots) { p.set(5, 6, o.spots); p.set(10, 6, o.spots); p.set(8, 5, o.spots); p.set(4, 10, o.spots); }
  if (o.extra) o.extra(p);
}

// ------------------------------------------------------------------ the type fallbacks

const TYPE = {
  boss: (p) => creature(p, { skin: BONE, horns: 'short', mouth: 'line' }),
  crest: (p) => { p.poly([[3, 2], [12, 2], [12, 8], [8, 14], [7, 14], [3, 8]], BRONZE); p.rect(7, 4, 1, 7, SILK); p.rect(5, 6, 5, 1, SILK); },
  'silk-skill': (p) => { p.ring(7.5, 7.5, 5.6, SILK, 3.8); p.ring(7.5, 7.5, 2.8, IVORY, 1.2); },
  relic: (p) => { p.rect(4, 2, 8, 12, STONE); p.rect(6, 5, 4, 1, DARK); p.rect(6, 9, 4, 1, DARK); },
  key: (p) => key(p, BRONZE),
  'spool-fragment': (p) => { p.rect(3, 2, 10, 2, BRONZE); p.rect(5, 4, 6, 8, SILK); p.rect(3, 12, 10, 2, BRONZE); },
  tool: (p) => flask(p, GREY),
  'map-tool': (p) => { p.ring(7.5, 7.5, 6, STEEL, 4.4); p.poly([[7.5, 2], [10, 7.5], [5, 7.5]], SILK); },
  map: (p) => { p.rect(2, 3, 12, 10, '#d8c49a'); p.set(8, 8, SILK); },
  'silk-heart': (p) => heart(p, 7.5, 6, 3.2, SILK),
  'tool-pouch-upgrade': (p) => pouch(p, BROWN),
  'memory-locket': (p) => { p.disc(7.5, 10, 4.2, BRONZE); p.rect(7, 9, 2, 2, SILK); },
  'ancestral-art': (p) => { p.poly([[7.5, 1], [14, 7.5], [7.5, 14], [1, 7.5]], VIOLET); p.rect(7, 7, 2, 2, IVORY); },
  'crafting-kit-upgrade': (p) => { p.rect(3, 6, 11, 3, STEEL); p.rect(5, 9, 6, 2, '#7a8490'); p.rect(4, 11, 8, 3, '#7a8490'); },
  'mask-shard': (p) => { p.poly([[4, 2], [13, 4], [11, 12], [6, 14], [3, 9]], IVORY); },
  ability: (p) => { p.poly([[7.5, 1], [9.5, 6], [14, 7.5], [9.5, 9], [7.5, 14], [5.5, 9], [1, 7.5], [5.5, 6]], TEAL); },
  'needle-upgrade': (p) => needle(p, 2, 14, 12, 4),
  quest: (p) => { p.rect(6, 2, 4, 8, BRONZE); p.rect(6, 12, 4, 3, BRONZE); },
  furnishing: (p) => { p.poly([[4, 3], [11, 3], [13, 8], [2, 8]], BRONZE); p.rect(7, 8, 2, 5, '#8a6471'); p.rect(4, 13, 8, 2, '#8a6471'); },
  memento: (p) => p.poly([[4, 3], [11, 3], [14, 7], [7.5, 14], [1, 7]], PINK),
  everbloom: (p) => { for (const [dx, dy] of [[0, -3.4], [3.2, -1], [2, 2.8], [-2, 2.8], [-3.2, -1]]) p.disc(7.5 + dx, 6 + dy, 2.2, PINK); p.disc(7.5, 6, 2, BRONZE); p.rect(7, 9, 2, 5, GREEN); },
  'key-item': (p) => key(p, IVORY, { gem: SILK }),
  sylphsong: (p) => { p.disc(5, 12, 2.6, TEAL); p.rect(7, 3, 2, 9, TEAL); p.poly([[9, 3], [14, 6], [14, 8], [9, 6]], TEAL); },
  generic: (p) => { p.disc(7.5, 7.5, 5, IVORY); p.disc(7.5, 7.5, 2.4, '#8a6471'); },
};

// ------------------------------------------------------------------ one icon per entry (bespoke)

const ICON = {
  // ---- bosses
  'moss-mother': (p) => creature(p, { skin: '#4f9a4f', eyes: GOLD, spots: MOSS, mouth: 'line', extra: (q) => { q.poly([[3, 5], [1, 1], [6, 3]], MOSS); q.poly([[12, 5], [14, 1], [9, 3]], MOSS); q.poly([[7.5, 3], [6, 0], [9, 0]], '#7fd070'); } }),
  'moss-mother-duo': (p) => { creature(p, { skin: '#4f9a4f', eyes: GOLD, mouth: 'line' }); p.disc(12, 4, 2.4, MOSS); p.disc(3, 4, 2.4, MOSS); },
  'bell-beast': (p) => { bell(p, BRONZE, { y: 2, s: 1.1 }); p.rect(4, 9, 2, 2, SILK); p.rect(10, 9, 2, 2, SILK); p.poly([[3, 6], [1, 2], [5, 4]], IVORY); p.poly([[12, 6], [14, 2], [10, 4]], IVORY); },
  lace: (p) => { p.poly([[4, 14], [5, 6], [7.5, 3], [10, 6], [11, 14]], PALE); p.disc(7.5, 5, 2.6, IVORY); p.rect(6, 5, 1, 1, SILK); p.rect(9, 5, 1, 1, SILK); needle(p, 13, 13, 9, 7, SILK); },
  'fourth-chorus': (p) => creature(p, { skin: '#b79ad0', shape: 'tall', eyes: GOLD, mouth: 'maw', hood: '#5a3a7a' }),
  'savage-beastfly': (p) => creature(p, { skin: '#6a4a2a', wings: '#cfe0cf', eyes: SILK, horns: 'antenna', mouth: 'fangs', eyeShape: 'big' }),
  moorwing: (p) => creature(p, { skin: '#8a7a9a', wings: '#cdb8e8', eyes: GOLD, horns: 'antenna', mouth: 'line' }),
  'sister-splinter': (p) => { p.disc(7.5, 8, 3.4, '#4a3a5a'); for (const [x, y] of [[1, 3], [2, 11], [14, 3], [13, 11]]) { p.line(7.5, 8, x, y, '#4a3a5a'); } p.rect(6, 7, 1, 2, SILK); p.rect(9, 7, 1, 2, SILK); },
  'skull-tyrant': (p) => creature(p, { skin: BONE, horns: 'crown', hornColor: BRONZE, eyes: DARK, eyeShape: 'big', mouth: 'maw', shape: 'wide' }),
  widow: (p) => { p.disc(7.5, 9, 3.6, '#2a1a2e'); p.disc(7.5, 5, 2.4, '#2a1a2e'); for (const [x, y] of [[1, 4], [1, 9], [14, 4], [14, 9]]) p.line(7.5, 8, x, y, '#4a3a5a'); p.rect(6, 9, 4, 2, SILK); p.set(6, 4, SILK); p.set(9, 4, SILK); },
  'great-conchflies': (p) => { p.ellipse(7.5, 8, 4.5, 4, '#e0b080'); p.line(5, 5, 10, 11, '#a07848'); p.line(7, 4, 11, 9, '#a07848'); p.poly([[1, 2], [5, 5], [3, 8]], '#cfe0cf'); p.poly([[14, 2], [10, 5], [12, 8]], '#cfe0cf'); },
  'raging-conchfly': (p) => { p.ellipse(7.5, 8, 4.5, 4, '#c0503a'); p.line(5, 5, 10, 11, '#6a2a1a'); p.line(7, 4, 11, 9, '#6a2a1a'); p.poly([[1, 2], [5, 5], [3, 8]], '#e08060'); p.poly([[14, 2], [10, 5], [12, 8]], '#e08060'); p.set(5, 9, GOLD); p.set(10, 9, GOLD); },
  'last-judge': (p) => creature(p, { skin: '#cfc8d8', hood: '#3a3a5a', eyes: GOLD, mouth: 'line', extra: (q) => { q.line(1, 12, 14, 12, BRONZE); q.rect(0, 12, 3, 2, BRONZE); q.rect(13, 12, 3, 2, BRONZE); } }),
  broodmother: (p) => { p.ellipse(7.5, 9, 6, 4.8, '#8a6a4a'); for (const [x, y] of [[4, 8], [8, 6], [11, 10], [6, 11]]) p.disc(x, y, 1.4, '#e8d8a8'); p.rect(3, 4, 2, 2, SILK); p.rect(10, 4, 2, 2, SILK); },
  'cogwork-dancers': (p) => { gear(p, 5.5, 8, 4, BRONZE); gear(p, 11, 5, 2.4, STEEL); p.line(6, 12, 13, 14, SILK); p.line(3, 13, 12, 10, SILK); },
  trobbio: (p) => creature(p, { skin: IVORY, hat: 'jester', hatColor: RED, eyes: DARK, mouth: 'grin', cheeks: SILK }),
  'tormented-trobbio': (p) => creature(p, { skin: '#9a8aaa', hat: 'jester', hatColor: '#6a2a4a', eyes: SILK, eyeShape: 'big', mouth: 'maw' }),
  'savage-beastfly-grand-hunt': (p) => creature(p, { skin: '#3a2a1a', wings: '#cfe0cf', eyes: GOLD, horns: 'long', hornColor: BRONZE, mouth: 'fangs', eyeShape: 'big' }),
  'garmond-and-zaza-duel': (p) => { p.disc(4.5, 8, 3, '#8aa4b4'); p.disc(11, 8, 3, '#d4a070'); p.rect(3, 8, 1, 1, DARK); p.rect(10, 8, 1, 1, DARK); needle(p, 6, 13, 10, 3, STEEL); },
  'lost-garmond': (p) => { p.disc(7.5, 8, 4, '#6a7a8a'); p.poly([[3, 8], [4, 2], [7, 5]], '#6a7a8a'); p.rect(5, 8, 2, 2, '#9fc0e0'); p.rect(9, 8, 2, 2, '#9fc0e0'); p.rect(6, 12, 4, 1, DARK); },
  'the-unravelled': (p) => { p.ring(7.5, 7.5, 5.6, '#c8c0d8', 4); p.line(2, 4, 13, 12, SILK); p.line(4, 13, 12, 2, SILK); p.line(2, 9, 13, 7, SILK); p.set(7, 7, IVORY); },
  'forebrothers-signis-and-gron': (p) => { creature(p, { skin: '#c0603a', shape: 'round', hat: 'helm', hatColor: STEEL, eyes: GOLD, mouth: 'line' }); p.rect(0, 5, 3, 7, '#d08040'); p.rect(13, 5, 3, 7, '#8a5a3a'); },
  phantom: (p) => { p.poly([[3, 14], [3, 7], [7.5, 2], [12, 7], [12, 14], [10, 12], [7.5, 14], [5, 12]], '#c8d8e8'); p.rect(5, 7, 2, 2, DARK); p.rect(9, 7, 2, 2, DARK); p.rect(6, 11, 4, 1, DARK); },
  'groal-the-great': (p) => creature(p, { skin: '#4a7a6a', shape: 'wide', eyes: GOLD, eyeShape: 'big', mouth: 'maw', spots: '#8ac0a8', extra: (q) => { q.disc(4, 4, 1.8, '#4a7a6a'); q.disc(11, 4, 1.8, '#4a7a6a'); q.set(4, 4, GOLD); q.set(11, 4, GOLD); } }),
  'first-sinner': (p) => { creature(p, { skin: '#6a4a4a', shape: 'square', hat: 'helm', hatColor: '#4a4a5a', eyes: SILK, mouth: 'none' }); p.line(1, 3, 1, 14, STEEL); p.line(14, 3, 14, 14, STEEL); },
  'father-of-the-flame': (p) => { p.poly([[7.5, 0], [11, 5], [13, 10], [10, 14], [5, 14], [2, 10], [4, 5]], ORANGE); p.poly([[7.5, 5], [10, 9], [9, 13], [6, 13], [5, 9]], GOLD); p.rect(6, 9, 1, 2, DARK); p.rect(9, 9, 1, 2, DARK); },
  voltvyrm: (p) => { p.thick(2, 12, 6, 6, '#5a6ab0'); p.thick(6, 6, 10, 10, '#5a6ab0'); p.thick(10, 10, 13, 4, '#5a6ab0'); p.disc(13, 4, 1.8, GOLD); sparkle(p, 3, 3, YELLOW); sparkle(p, 12, 12, YELLOW); },
  'disgraced-chef-lugoli': (p) => creature(p, { skin: '#c8a888', hat: 'chef', eyes: DARK, mouth: 'grin', cheeks: SILK }),
  'second-sentinel': (p) => { creature(p, { skin: STEEL, shape: 'square', hat: 'helm', hatColor: '#c8d0d8', eyes: GOLD, eyeShape: 'slit' }); p.rect(1, 6, 2, 7, STEEL); p.rect(13, 6, 2, 7, STEEL); },
  'lace-cradle': (p) => { p.poly([[4, 14], [5, 6], [7.5, 3], [10, 6], [11, 14]], '#fff0c8'); p.disc(7.5, 5, 2.6, IVORY); p.rect(6, 5, 1, 1, GOLD); p.rect(9, 5, 1, 1, GOLD); p.rect(1, 12, 14, 2, BRONZE); },
  'lost-lace': (p) => { p.poly([[4, 14], [5, 6], [7.5, 3], [10, 6], [11, 14]], '#4a3a5a'); p.disc(7.5, 5, 2.6, '#8a7a9a'); p.rect(6, 5, 1, 1, SILK); p.rect(9, 5, 1, 1, SILK); needle(p, 13, 13, 9, 7, '#8a4a5a'); },
  'shakra-duel': (p) => { creature(p, { skin: '#d8a888', hood: '#5a3a5a', eyes: DARK, mouth: 'line' }); p.rect(2, 12, 12, 2, '#d8c49a'); },
  'grand-mother-silk-bind': (p) => { creature(p, { skin: PALE, shape: 'tall', hood: '#d8c8e8', eyes: SILK, mouth: 'none' }); p.line(1, 2, 14, 13, SILK); p.line(14, 2, 1, 13, SILK); },
  'grand-mother-silk-cursed': (p) => { creature(p, { skin: '#6a4a6a', shape: 'tall', hood: '#2a1a2e', eyes: '#ff8aa0', eyeShape: 'big', mouth: 'maw' }); p.line(1, 2, 14, 13, '#a02a3a'); p.line(14, 2, 1, 13, '#a02a3a'); },
  'grand-mother-silk-snared': (p) => { creature(p, { skin: PALE, shape: 'tall', hood: '#8a7ac0', eyes: GOLD, mouth: 'none' }); p.ring(7.5, 8, 6.4, '#ec555b', 5.2); },
  'plasmified-zango': (p) => { p.ellipse(7.5, 9, 6, 5, '#9a5ac0'); p.disc(5, 8, 1.6, '#c8f0a0'); p.disc(10, 10, 2, '#c8f0a0'); p.disc(8, 5, 1.4, '#c8f0a0'); p.rect(4, 11, 2, 2, GOLD); p.rect(10, 7, 2, 2, GOLD); },
  'bell-eater': (p) => { bell(p, '#6a5a4a', { y: 1, s: 1.1 }); p.rect(4, 8, 8, 4, DARK); p.rect(4, 8, 1, 1, IVORY); p.rect(6, 8, 1, 1, IVORY); p.rect(9, 8, 1, 1, IVORY); p.rect(11, 8, 1, 1, IVORY); p.rect(5, 11, 1, 1, IVORY); p.rect(10, 11, 1, 1, IVORY); },
  palestag: (p) => creature(p, { skin: PALE, shape: 'tall', horns: 'antler', hornColor: IVORY, eyes: SILK, mouth: 'none' }),
  'watcher-at-the-edge': (p) => { p.ellipse(7.5, 8, 6.4, 4.4, IVORY); p.disc(7.5, 8, 3, '#6a5ac0'); p.disc(7.5, 8, 1.4, DARK); p.set(6, 7, IVORY); },
  'crust-king-khann': (p) => creature(p, { skin: '#a08060', horns: 'crown', hornColor: '#e0c060', eyes: DARK, eyeShape: 'big', mouth: 'maw', spots: '#6a5030', shape: 'wide' }),
  'shrine-guardian-seth': (p) => { creature(p, { skin: '#c8b890', shape: 'square', hat: 'helm', hatColor: BRONZE, eyes: DARK, mouth: 'line' }); p.rect(1, 3, 2, 10, BRONZE); p.rect(13, 3, 2, 10, BRONZE); },
  nyleth: (p) => { creature(p, { skin: '#a0c8e0', wings: '#e0f0ff', eyes: SILK, horns: 'antenna', mouth: 'line' }); p.disc(7.5, 2, 1.4, '#ffe8ff'); },
  'skarrsinger-karmelita': (p) => { creature(p, { skin: '#c8987a', hood: '#8a2a3a', eyes: GOLD, mouth: 'line' }); p.set(12, 5, GOLD); p.rect(13, 4, 1, 4, GOLD); p.disc(12.5, 8, 1.2, GOLD); },
  'clover-dancers': (p) => { p.disc(5, 5, 2.4, GREEN); p.disc(10, 5, 2.4, GREEN); p.disc(5, 10, 2.4, GREEN); p.disc(10, 10, 2.4, GREEN); p.rect(7, 7, 2, 2, GOLD); p.line(8, 11, 10, 14, '#3a6a3a'); },
  'gurr-the-outcast': (p) => creature(p, { skin: '#7a6a5a', shape: 'wide', eyes: GOLD, eyeShape: 'big', mouth: 'fangs', scar: DARK }),
  crawfather: (p) => { p.ellipse(7.5, 8.5, 4.4, 4.8, '#2a2a3a'); p.poly([[11, 7], [15, 8], [11, 10]], BRONZE); p.rect(7, 6, 2, 2, GOLD); p.poly([[1, 4], [5, 6], [4, 10]], '#3a3a50'); p.disc(7.5, 3, 1.6, '#2a2a3a'); },
  pinstress: (p) => { creature(p, { skin: '#d8c0a8', hood: '#3a2a4a', eyes: SILK, mouth: 'none' }); needle(p, 14, 14, 11, 6, STEEL); needle(p, 1, 14, 4, 6, STEEL); },

  // ---- crests
  'hunter-crest': (p) => { p.poly([[3, 2], [12, 2], [12, 8], [8, 14], [7, 14], [3, 8]], '#8aa070'); p.line(5, 11, 10, 4, IVORY); p.poly([[10, 4], [12, 3], [11, 6]], IVORY); },
  'beast-crest': (p) => { p.poly([[3, 2], [12, 2], [12, 8], [8, 14], [7, 14], [3, 8]], '#a05a3a'); p.line(5, 4, 6, 10, IVORY); p.line(7, 4, 8, 11, IVORY); p.line(9, 4, 10, 10, IVORY); },
  'reaper-crest': (p) => { p.poly([[3, 2], [12, 2], [12, 8], [8, 14], [7, 14], [3, 8]], '#5a3a6a'); p.line(10, 3, 6, 12, IVORY); p.poly([[10, 3], [5, 3], [4, 6], [8, 5]], STEEL); },
  'wanderer-crest': (p) => { p.poly([[3, 2], [12, 2], [12, 8], [8, 14], [7, 14], [3, 8]], '#5a8a9a'); p.ring(7.5, 7, 3, IVORY, 1.5); p.set(7, 7, SILK); p.set(8, 7, SILK); },
  'architect-crest': (p) => { p.poly([[3, 2], [12, 2], [12, 8], [8, 14], [7, 14], [3, 8]], '#9a8a5a'); p.rect(5, 5, 5, 1, IVORY); p.rect(7, 5, 1, 6, IVORY); p.rect(5, 10, 5, 1, IVORY); },
  'witch-crest': (p) => { p.poly([[3, 2], [12, 2], [12, 8], [8, 14], [7, 14], [3, 8]], '#6a3a8a'); p.disc(7.5, 7, 3, GOLD); p.disc(9, 6, 2.6, '#6a3a8a'); },
  'shaman-crest': (p) => { p.poly([[3, 2], [12, 2], [12, 8], [8, 14], [7, 14], [3, 8]], '#3a8a6a'); p.ellipse(7.5, 7, 2.6, 3.4, IVORY); p.rect(6, 6, 1, 2, DARK); p.rect(9, 6, 1, 2, DARK); },

  // ---- silk skills
  'silk-spear': (p) => { p.thick(2, 14, 11, 5, BONE); p.poly([[10, 2], [14, 1], [13, 5], [10, 6]], STEEL); p.line(2, 14, 5, 8, SILK); p.line(5, 8, 3, 3, SILK); },
  'thread-storm': (p) => { for (let k = 0; k < 5; k++) p.ring(7.5, 7.5, 2 + k * 1.1, k % 2 ? SILK : IVORY, 1 + k * 1.1 - 0.9); p.set(7, 7, GOLD); },
  sharpdart: (p) => { p.thick(2, 13, 11, 4, SILK); p.poly([[10, 1], [14, 2], [13, 6], [9, 5]], STEEL); p.poly([[1, 11], [4, 14], [1, 15]], IVORY); },
  'cross-stitch': (p) => { p.thick(3, 3, 11, 11, SILK); p.thick(11, 3, 3, 11, SILK); p.set(2, 2, IVORY); p.set(13, 2, IVORY); p.set(2, 13, IVORY); p.set(13, 13, IVORY); },
  'rune-rage': (p) => { p.rect(7, 2, 2, 12, '#e0554a'); p.line(3, 5, 7, 8, '#e0554a'); p.line(12, 5, 8, 8, '#e0554a'); p.line(3, 12, 7, 9, '#e0554a'); p.line(12, 12, 8, 9, '#e0554a'); sparkle(p, 7.5, 7.5, GOLD); },
  'pale-nails': (p) => { for (const x of [4, 7, 10]) { p.rect(x, 2, 2, 11, PALE); p.rect(x - 1, 1, 4, 2, IVORY); p.rect(x, 13, 2, 1, STEEL); } },

  // ---- relics
  'choral-commandment-bone-bottom': (p) => { p.rect(4, 2, 8, 12, BONE); p.clear(4, 2); p.clear(11, 2); for (const y of [4, 7, 10]) p.rect(6, y, 4, 1, DARK); p.set(7, 12, SILK); },
  'weaver-effigy-bone-bottom': (p) => { p.disc(7.5, 4, 2.4, '#8a6a5a'); p.poly([[4, 14], [5, 7], [10, 7], [11, 14]], '#8a6a5a'); p.line(3, 8, 12, 8, '#6a4a3a'); p.set(7, 4, SILK); p.set(8, 4, SILK); },
  'bone-scroll-far-fields': (p) => { p.rect(3, 3, 10, 10, BONE); p.rect(2, 2, 12, 2, '#a89878'); p.rect(2, 12, 12, 2, '#a89878'); p.rect(5, 6, 6, 1, DARK); p.rect(5, 9, 4, 1, DARK); p.rect(11, 5, 1, 1, '#e0b060'); },
  'bone-scroll-greymoor': (p) => { p.rect(3, 3, 10, 10, BONE); p.rect(2, 2, 12, 2, '#a89878'); p.rect(2, 12, 12, 2, '#a89878'); p.rect(5, 6, 6, 1, DARK); p.rect(5, 9, 4, 1, DARK); p.rect(11, 5, 1, 1, '#8aa4b4'); },

  // ---- keys
  'simple-key': (p) => key(p, BRONZE),
  'bellhome-key': (p) => key(p, BRONZE, { bow: 'bell' }),
  'simple-key-sinners-road': (p) => key(p, '#c07050'),
  'white-key': (p) => key(p, PALE, { gem: STEEL }),
  'simple-key-jubilana': (p) => key(p, BRONZE, { bow: 'clover', gem: PINK }),
  'surgeons-key': (p) => key(p, '#9aa4b0', { bow: 'cross' }),
  'key-of-apostate': (p) => key(p, '#6a4a8a', { gem: VIOLET }),
  'simple-key-sands-of-karak': (p) => key(p, SAND),
  'diving-bell-key': (p) => key(p, '#5b8fe0', { bow: 'bell' }),

  // ---- blue tools
  'druids-eye': (p) => { p.ellipse(7.5, 8, 6.4, 4.2, IVORY); p.disc(7.5, 8, 3, '#5aa05a'); p.disc(7.5, 8, 1.4, DARK); p.set(6, 7, IVORY); p.rect(7, 2, 1, 2, '#5aa05a'); },
  'magma-bell': (p) => { bell(p, '#c04a2a', { y: 2 }); p.rect(5, 6, 1, 3, ORANGE); p.rect(9, 7, 1, 3, ORANGE); p.rect(7, 5, 1, 3, GOLD); p.set(6, 12, ORANGE); p.set(9, 13, ORANGE); },
  'warding-bell': (p) => { bell(p, '#7a9ad0', { y: 2 }); p.rect(7, 6, 2, 3, IVORY); p.rect(6, 7, 4, 1, IVORY); },
  'fractured-mask': (p) => { p.ellipse(7.5, 8, 5, 6, IVORY); p.rect(5, 7, 2, 2, DARK); p.rect(9, 7, 2, 2, DARK); p.line(8, 2, 6, 6, DARK); p.line(6, 6, 9, 9, DARK); p.line(9, 9, 8, 14, DARK); },
  'pollip-pouch': (p) => { pouch(p, '#5a8a5a'); p.disc(11, 4, 1.4, '#c8f0a0'); p.disc(13, 2, 1, '#c8f0a0'); },
  multibinder: (p) => { for (const x of [3, 7, 11]) { p.rect(x, 3, 3, 2, BRONZE); p.rect(x, 5, 3, 6, SILK); p.rect(x, 11, 3, 2, BRONZE); } p.rect(2, 7, 12, 1, IVORY); },
  weavelight: (p) => { p.disc(7.5, 7.5, 3.6, GOLD); p.ring(7.5, 7.5, 6.4, '#e8d890', 5.2); p.line(1, 7, 14, 7, '#e8d890'); p.line(7, 1, 7, 14, '#e8d890'); },
  'spool-extender': (p) => { p.rect(5, 3, 6, 2, BRONZE); p.rect(6, 5, 4, 6, SILK); p.rect(5, 11, 6, 2, BRONZE); p.line(12, 5, 14, 3, IVORY); p.line(12, 5, 14, 5, IVORY); p.line(12, 5, 12, 3, IVORY); },
  'claw-mirror': (p) => { p.disc(6.5, 6, 4.4, '#bcd0e8'); p.ring(6.5, 6, 4.8, STEEL, 3.6); p.thick(9, 9, 13, 13, STEEL); p.line(4, 3, 8, 8, IVORY); },
  'injector-band': (p) => { p.rect(2, 6, 12, 4, '#4a6ab0'); p.rect(2, 7, 12, 1, '#8aa0e0'); p.thick(5, 12, 11, 2, STEEL); p.set(5, 12, SILK); },
  'sawtooth-circlet': (p) => { p.ring(7.5, 8, 5.4, STEEL, 3.4); for (const x of [3, 5, 7, 9, 11]) p.poly([[x - 1, 4], [x + 1, 4], [x, 0]], STEEL); },
  'quick-sling': (p) => { p.line(7.5, 14, 7.5, 8, BROWN); p.line(7.5, 8, 3, 2, BROWN); p.line(7.5, 8, 12, 2, BROWN); p.line(3, 2, 12, 2, SILK); p.disc(7.5, 3, 1.6, STEEL); },
  'memory-crystal': (p) => { p.poly([[7.5, 0], [12, 5], [10, 14], [5, 14], [3, 5]], VIOLET); p.line(7.5, 0, 7.5, 14, '#d8c8ff'); p.line(3, 5, 12, 5, '#d8c8ff'); },
  'snitch-pick': (p) => { p.thick(3, 13, 11, 5, STEEL); p.poly([[10, 3], [14, 2], [13, 7], [9, 6]], '#c8d0d8'); p.rect(2, 12, 3, 3, BROWN); },
  'wreath-of-purity': (p) => { p.ring(7.5, 8, 6, '#6aaa6a', 4); for (const [x, y] of [[2, 6], [13, 6], [4, 13], [11, 13], [7, 2]]) p.disc(x, y, 1.2, IVORY); },
  'wispfire-lantern': (p) => { p.rect(5, 4, 6, 9, '#6a5a4a'); p.rect(6, 5, 4, 7, '#5a9ae0'); p.poly([[8, 5], [10, 9], [8, 12], [6, 9]], '#c8f0ff'); p.rect(6, 1, 4, 2, '#6a5a4a'); p.rect(7, 0, 2, 1, '#6a5a4a'); },
  'volt-filament': (p) => { p.ellipse(7.5, 7, 4.4, 5.4, '#e8e8f8'); p.poly([[8, 2], [5, 8], [8, 8], [6, 13], [11, 6], [8, 6]], YELLOW); p.rect(6, 12, 4, 3, STEEL); },
  longclaw: (p) => { p.poly([[2, 1], [5, 1], [13, 8], [14, 14], [11, 14], [9, 9], [4, 4]], '#9ab0d8'); },
  'reserve-bind': (p) => { p.rect(2, 4, 12, 8, '#d8d0c0'); p.rect(2, 7, 12, 2, '#a89878'); p.rect(6, 4, 4, 8, SILK); p.rect(7, 5, 2, 6, IVORY); p.rect(6, 7, 4, 2, IVORY); },
  'pin-badge': (p) => { p.disc(7.5, 7, 5, BRONZE); p.disc(7.5, 7, 3, '#8a4a2a'); p.thick(7, 11, 7, 15, STEEL); p.set(7, 6, GOLD); p.set(8, 7, GOLD); },

  // ---- yellow tools
  'shard-pendant': (p) => { p.line(3, 1, 7.5, 6, '#8a6471'); p.line(12, 1, 7.5, 6, '#8a6471'); p.poly([[7.5, 6], [11, 9], [9, 14], [6, 14], [4, 9]], IVORY); p.line(7.5, 7, 7.5, 13, STEEL); },
  compass: (p) => { p.ring(7.5, 7.5, 6, BRONZE, 4.4); p.poly([[7.5, 2], [10, 7.5], [5, 7.5]], SILK); p.poly([[7.5, 13], [10, 7.5], [5, 7.5]], IVORY); },
  'magnetite-brooch': (p) => { p.disc(7.5, 8, 5, '#4a4a5a'); p.rect(4, 4, 2, 5, SILK); p.rect(10, 4, 2, 5, BLUE); p.rect(4, 9, 8, 1, STEEL); p.thick(7, 12, 7, 15, STEEL); },
  'weighted-belt': (p) => { p.rect(1, 5, 14, 5, BROWN); p.rect(6, 4, 4, 7, BRONZE); p.rect(7, 6, 2, 3, DARK); p.rect(3, 10, 3, 4, STEEL); p.rect(10, 10, 3, 4, STEEL); },
  'dead-bugs-purse': (p) => { pouch(p, '#6a5a4a'); p.line(2, 14, 4, 11, DARK); p.line(13, 14, 11, 11, DARK); p.line(7.5, 15, 7.5, 14, DARK); p.set(6, 9, IVORY); p.set(9, 9, IVORY); },
  'barbed-bracelet': (p) => { p.ring(7.5, 8, 5, BRONZE, 3.2); for (const [x, y] of [[7, 1], [13, 5], [2, 5], [13, 12], [2, 12]]) p.poly([[x - 1, y + 1], [x + 1, y + 1], [x, y - 1]], STEEL); },
  'silkspeed-anklets': (p) => { p.ring(5, 9, 3.4, BRONZE, 2); p.ring(11, 9, 3.4, BRONZE, 2); p.line(1, 4, 5, 4, IVORY); p.line(0, 6, 4, 6, IVORY); p.line(10, 3, 14, 3, IVORY); },
  'magnetite-dice': (p) => { p.rect(3, 3, 10, 10, '#5a5a6a'); for (const [x, y] of [[5, 5], [10, 5], [7, 8], [5, 11], [10, 11]]) p.rect(x, y, 2, 2, IVORY); },
  'ascendants-grip': (p) => { p.rect(4, 7, 8, 7, BRONZE); p.rect(4, 4, 2, 4, BRONZE); p.rect(7, 3, 2, 5, BRONZE); p.rect(10, 4, 2, 4, BRONZE); p.poly([[7.5, 0], [10, 3], [5, 3]], IVORY); },
  'spider-strings': (p) => { p.disc(7.5, 8, 2.4, '#4a3a5a'); for (const [x, y] of [[1, 3], [1, 8], [14, 3], [14, 8], [3, 14], [12, 14]]) p.line(7.5, 8, x, y, IVORY); p.set(7, 7, SILK); },
  scuttlebrace: (p) => { p.ellipse(7.5, 7, 5, 3.4, BRONZE); for (const x of [2, 4, 11, 13]) p.line(x, 9, x - 1 + (x > 8 ? 2 : 0), 14, BRONZE); p.rect(5, 6, 1, 1, DARK); p.rect(10, 6, 1, 1, DARK); },
  'thiefs-mark': (p) => { p.ellipse(7.5, 8, 6.4, 3.4, '#4a3a5a'); p.rect(4, 7, 2, 2, GOLD); p.rect(10, 7, 2, 2, GOLD); p.rect(7, 11, 2, 3, '#6a5a7a'); },

  // ---- red tools
  'straight-pin': (p) => { needle(p, 2, 14, 12, 4, STEEL); p.disc(13, 3, 1.8, SILK); },
  'sting-shard': (p) => { p.poly([[2, 14], [6, 3], [9, 3], [13, 14], [7.5, 11]], '#e0654a'); p.line(7.5, 3, 7.5, 10, '#f0a08a'); },
  flintslate: (p) => { p.poly([[2, 4], [11, 2], [14, 11], [5, 14]], '#6a6a7a'); sparkle(p, 11, 4, GOLD); p.line(4, 7, 9, 11, '#9a9aaa'); },
  curveclaw: (p) => claw(p, '#e0555b'),
  'threefold-pin': (p) => { needle(p, 7, 14, 7, 1, STEEL); needle(p, 6, 14, 2, 3, STEEL); needle(p, 9, 14, 13, 3, STEEL); p.rect(5, 12, 6, 2, SILK); },
  'flea-brew': (p) => { flask(p, '#c08a3a'); p.set(6, 11, DARK); p.set(8, 12, DARK); p.set(9, 10, DARK); p.line(10, 9, 11, 7, DARK); },
  longpin: (p) => { needle(p, 1, 15, 13, 3, STEEL); p.rect(12, 1, 3, 3, SILK); },
  pimpillo: (p) => { p.disc(7.5, 9, 4.8, '#d08a3a'); p.rect(5, 8, 2, 2, DARK); p.rect(9, 8, 2, 2, DARK); p.rect(6, 11, 4, 1, DARK); p.line(8, 4, 11, 1, BROWN); sparkle(p, 12, 1, GOLD); },
  tacks: (p) => { for (const [x, y] of [[3, 4], [10, 3], [6, 9], [12, 10], [3, 12]]) { p.rect(x, y, 3, 1, SILK); p.rect(x + 1, y + 1, 1, 2, STEEL); } },
  'plasmium-phial': (p) => { flask(p, '#7ad07a'); p.set(7, 9, '#d8ffd8'); p.set(9, 11, '#d8ffd8'); p.set(8, 7, '#d8ffd8'); },
  'delvers-drill': (p) => { p.poly([[11, 2], [14, 5], [6, 13], [3, 10]], STEEL); p.line(5, 6, 10, 11, DARK); p.line(7, 4, 12, 9, DARK); p.rect(10, 1, 4, 3, BROWN); },
  'cogwork-wheel': (p) => { gear(p, 7.5, 7.5, 4.6, RED, NIGHT); p.rect(7, 2, 2, 12, STEEL); p.rect(2, 7, 12, 2, STEEL); },
  cogfly: (p) => { gear(p, 7.5, 9, 3.6, BRONZE, NIGHT); p.poly([[1, 2], [6, 6], [4, 9]], '#cfe0cf'); p.poly([[14, 2], [9, 6], [11, 9]], '#cfe0cf'); },
  'rosary-cannon': (p) => { p.rect(2, 6, 9, 5, '#6a6a7a'); p.rect(10, 5, 3, 7, '#4a4a5a'); p.disc(4, 13, 2, BROWN); p.disc(14, 8, 1.2, BRONZE); p.disc(14, 4, 0.8, BRONZE); },
  silkshot: (p) => { p.line(2, 14, 14, 2, SILK); p.line(2, 13, 14, 1, SILK); p.poly([[11, 1], [15, 1], [15, 5]], STEEL); p.ring(4, 11, 3, IVORY, 1.6); },
  'snare-setter': (p) => { p.ring(7.5, 9, 5.6, STEEL, 3.6); for (const x of [3, 5, 7, 9, 11]) p.poly([[x - 1, 6], [x + 1, 6], [x, 2]], STEEL); p.set(7, 9, SILK); p.set(8, 9, SILK); },
  voltvessels: (p) => { p.rect(2, 5, 5, 9, '#7ab0d0'); p.rect(9, 5, 5, 9, '#7ab0d0'); p.rect(2, 3, 5, 2, BRONZE); p.rect(9, 3, 5, 2, BRONZE); p.poly([[8, 4], [6, 9], [8, 9], [7, 13], [10, 8], [8, 8]], YELLOW); },
  conchcutter: (p) => { p.ellipse(6, 8, 4.4, 5, '#e0b080'); p.line(4, 4, 8, 12, '#a07848'); p.thick(9, 9, 14, 4, STEEL); },
  'throwing-ring': (p) => { p.ring(7.5, 7.5, 6, STEEL, 3.6); for (const [x, y] of [[7, 0], [14, 7], [7, 14], [0, 7]]) p.rect(x, y, 2, 2, SILK); },

  // ---- other tools
  'egg-of-flealia': (p) => { p.ellipse(7.5, 8, 4.6, 6, '#f0e0b0'); p.disc(6, 6, 1.2, '#c08a5a'); p.disc(9.5, 9, 1.4, '#c08a5a'); p.disc(6, 11, 1, '#c08a5a'); },
  curvesickle: (p) => { p.ring(7.5, 8, 6, STEEL, 4); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (x < 6 && y > 6) p.clear(x, y); p.rect(2, 12, 4, 3, BROWN); },
  'claw-mirrors': (p) => { p.disc(5, 6, 3.4, '#bcd0e8'); p.ring(5, 6, 3.8, STEEL, 2.6); p.disc(11, 9, 3.4, '#bcd0e8'); p.ring(11, 9, 3.8, STEEL, 2.6); p.line(3, 3, 6, 7, IVORY); },
  quill: (p) => { p.poly([[12, 1], [14, 2], [8, 12], [6, 11]], IVORY); p.line(7, 11, 3, 15, STEEL); p.line(11, 2, 8, 9, '#b7a3a6'); },
  'bench-pins': (p) => { p.rect(2, 9, 12, 2, BROWN); p.rect(3, 11, 2, 3, BROWN); p.rect(11, 11, 2, 3, BROWN); p.disc(7.5, 5, 2.6, SILK); p.line(7.5, 7, 7.5, 9, SILK); },
  'shell-marker': (p) => { p.ellipse(7.5, 8, 5.4, 5, '#e8c8b0'); for (const x of [4, 6, 8, 10]) p.line(7.5, 12, x, 4, '#b89478'); p.rect(6, 12, 4, 2, '#b89478'); },

  // ---- ancestral arts and abilities
  'swift-step': (p) => { p.poly([[4, 3], [9, 3], [9, 9], [14, 11], [14, 14], [4, 14]], '#c8883a'); p.poly([[0, 3], [4, 4], [3, 8]], IVORY); p.line(0, 6, 3, 6, IVORY); },
  'cling-grip': (p) => { p.rect(8, 1, 6, 14, STONE); p.rect(3, 7, 6, 5, IVORY); p.rect(3, 5, 2, 3, IVORY); p.rect(6, 4, 2, 4, IVORY); p.line(9, 4, 14, 4, '#7a6a7a'); p.line(9, 10, 14, 10, '#7a6a7a'); },
  needolin: (p) => { p.thick(2, 14, 11, 5, BRONZE); p.rect(11, 2, 3, 3, SILK); p.set(3, 13, DARK); p.line(4, 12, 9, 7, DARK); p.disc(13, 12, 1.6, TEAL); p.rect(14, 8, 1, 4, TEAL); },
  clawline: (p) => { p.line(2, 14, 11, 5, IVORY); p.poly([[10, 1], [14, 3], [12, 7], [10, 6]], STEEL); p.ring(3, 13, 2.2, SILK, 1); },
  'silk-soar': (p) => { p.poly([[1, 4], [6, 8], [4, 13]], PALE); p.poly([[14, 4], [9, 8], [11, 13]], PALE); p.ring(7.5, 8, 2.8, SILK, 1.2); p.rect(7, 2, 2, 3, SILK); },
  'drifters-cloak': (p) => cloak(p, '#7a5a8a', BRONZE),
  'needle-strike': (p) => { needle(p, 3, 14, 11, 6, IVORY); p.line(10, 2, 14, 6, SILK); p.line(8, 3, 12, 7, SILK); p.line(12, 1, 15, 4, SILK); },
  'faydown-cloak': (p) => cloak(p, '#9cc0e8', IVORY),
  'beastling-call': (p) => { p.poly([[3, 12], [3, 6], [12, 2], [14, 4], [8, 9], [6, 14]], BONE); p.rect(11, 2, 3, 2, BRONZE); p.line(2, 4, 4, 5, TEAL); p.line(1, 7, 3, 8, TEAL); },
  'elegy-of-the-deep': (p) => { p.line(1, 11, 4, 8, '#5b8fe0'); p.line(4, 8, 7, 11, '#5b8fe0'); p.line(7, 11, 10, 8, '#5b8fe0'); p.line(10, 8, 14, 11, '#5b8fe0'); p.disc(5, 4, 1.6, TEAL); p.rect(6, 1, 1, 4, TEAL); p.rect(7, 1, 3, 1, TEAL); },

  // ---- needles
  'sharpened-needle': (p) => { needle(p, 2, 14, 13, 3, STEEL); p.rect(1, 12, 4, 3, BROWN); sparkle(p, 12, 12, IVORY); },
  'shining-needle': (p) => { needle(p, 2, 14, 13, 3, GOLD); p.rect(1, 12, 4, 3, BROWN); sparkle(p, 12, 12, GOLD); sparkle(p, 3, 4, GOLD); },
  'hivesteel-needle': (p) => { needle(p, 2, 14, 13, 3, '#d8a840'); p.rect(1, 12, 4, 3, BROWN); for (const [x, y] of [[8, 8], [6, 10], [10, 6]]) p.set(x, y, DARK); },
  'pale-steel-needle': (p) => { needle(p, 2, 14, 13, 3, PALE); p.rect(1, 12, 4, 3, '#8a8aa0'); sparkle(p, 12, 12, ICE); },

  // ---- quests
  'my-missing-courier': (p) => { p.rect(2, 5, 12, 8, IVORY); p.line(2, 5, 7.5, 10, BONE); p.line(14, 5, 8, 10, BONE); p.poly([[1, 1], [5, 3], [3, 6]], '#cfe0cf'); p.set(7, 9, SILK); },
  'pilgrims-rest-supplies': (p) => { p.rect(2, 5, 12, 9, BROWN); p.rect(2, 8, 12, 1, '#6a4a2a'); p.rect(7, 5, 2, 9, '#6a4a2a'); p.rect(2, 3, 12, 2, '#b88a5a'); },
  'wandering-merchant': (p) => { pouch(p, '#6a4a8a'); p.disc(7.5, 10, 2, BRONZE); p.line(7.5, 3, 7.5, 0, BRONZE); },
  'vaultkeepers-melody': (p) => { p.disc(5, 12, 2.4, '#7f8cff'); p.rect(6, 3, 2, 9, '#7f8cff'); p.poly([[8, 3], [13, 5], [13, 7], [8, 5]], '#7f8cff'); p.ring(12, 12, 2, BRONZE, 1); },
  'conductors-melody': (p) => { p.disc(5, 12, 2.4, '#ffc880'); p.rect(6, 3, 2, 9, '#ffc880'); p.poly([[8, 3], [13, 5], [13, 7], [8, 5]], '#ffc880'); p.line(12, 14, 14, 8, IVORY); },
  'architects-melody': (p) => { p.disc(5, 12, 2.4, '#e0a548'); p.rect(6, 3, 2, 9, '#e0a548'); p.poly([[8, 3], [13, 5], [13, 7], [8, 5]], '#e0a548'); p.rect(11, 10, 4, 1, IVORY); p.rect(12, 10, 1, 4, IVORY); },
  'rite-of-rebirth': (p) => { p.ring(7.5, 8, 5.4, ORANGE, 3.6); p.poly([[7.5, 0], [11, 4], [4, 4]], ORANGE); p.poly([[7.5, 6], [9, 10], [6, 10]], GOLD); },
  'silk-and-soul': (p) => { heart(p, 6, 5, 2.4, SILK); p.ring(10, 10, 3.4, IVORY, 1.6); p.set(10, 10, TEAL); },
  'passing-of-the-age': (p) => { p.rect(3, 1, 10, 2, BRONZE); p.rect(3, 13, 10, 2, BRONZE); p.poly([[4, 3], [11, 3], [8, 8], [11, 13], [4, 13], [7, 8]], '#e8d8b0'); p.rect(7, 9, 2, 3, SAND); },

  // ---- furnishings
  'bellhome-desk': (p) => { p.rect(1, 6, 14, 2, BROWN); p.rect(2, 8, 2, 6, '#6a4a2a'); p.rect(12, 8, 2, 6, '#6a4a2a'); p.rect(5, 8, 6, 3, '#8a6a4a'); p.rect(7, 9, 2, 1, BRONZE); p.rect(3, 3, 2, 3, IVORY); },
  'bellhome-gleamlights': (p) => { p.line(1, 3, 7.5, 6, '#8a6471'); p.line(14, 3, 7.5, 6, '#8a6471'); for (const [x, y] of [[3, 5], [7, 7], [11, 5]]) { p.disc(x, y + 2, 1.6, GOLD); } p.set(7, 11, GOLD); },
  'bellhome-bell-lacquer': (p) => { bell(p, '#c04a5a', { y: 1, s: 0.9 }); p.rect(11, 10, 4, 5, '#2a1a2e'); p.rect(12, 9, 2, 2, '#c04a5a'); },
  'bellhome-personal-spa': (p) => { p.poly([[1, 8], [14, 8], [12, 14], [3, 14]], '#9ad0e0'); p.disc(4, 5, 1.4, IVORY); p.disc(8, 3, 1.8, IVORY); p.disc(11, 6, 1.2, IVORY); p.rect(1, 8, 14, 1, IVORY); },
  crawbell: (p) => { bell(p, '#4a4a5a', { y: 3, s: 0.95 }); p.poly([[10, 1], [14, 2], [11, 5]], BRONZE); p.set(12, 2, DARK); },

  // ---- mementos
  'grey-memento': (p) => { p.disc(7.5, 9, 4.6, '#8a8a98'); p.set(5, 7, '#b0b0c0'); p.set(6, 6, '#b0b0c0'); p.line(7.5, 4, 7.5, 1, SILK); p.line(6, 1, 9, 1, SILK); },
  'conjoined-heart': (p) => { heart(p, 5, 6, 2.2, SILK); heart(p, 10, 8, 2.2, '#e08a9a'); },
  'heros-memento': (p) => { p.poly([[7.5, 1], [9.5, 6], [14, 6], [10.5, 9], [12, 14], [7.5, 11], [3, 14], [4.5, 9], [1, 6], [5.5, 6]], BRONZE); p.rect(7, 6, 2, 3, SILK); },
  'craw-memento': (p) => { p.poly([[12, 1], [14, 3], [6, 13], [3, 14], [4, 11]], '#3a3a50'); p.line(11, 2, 5, 12, '#6a6a80'); p.rect(2, 13, 2, 2, BRONZE); },

  // ---- others
  everbloom: TYPE.everbloom,
  'craw-summons': (p) => { p.poly([[3, 11], [3, 6], [12, 3], [14, 5], [8, 10], [6, 14]], '#3a3a50'); p.rect(11, 3, 3, 2, BRONZE); p.poly([[1, 13], [4, 11], [4, 15]], '#3a3a50'); },
  sylphsong: (p) => { p.line(3, 14, 3, 3, TEAL); p.line(3, 3, 12, 3, TEAL); p.line(12, 3, 12, 8, TEAL); for (const x of [5, 7, 9]) p.line(x, 4, x, 10, IVORY); p.disc(12, 11, 2, TEAL); },
};

// ------------------------------------------------------------------ families (one drawing, a tint and a mark per entry)

const items = JSON.parse(fs.readFileSync(path.join(root, 'data', 'items.json'), 'utf8')).items;
const byId = new Map(items.map((item) => [item.id, item]));
const accent = (item) => REGION[item.regionId] || GOLD;

const FAMILY = {
  'spool-fragment': (p, item) => {
    const a = accent(item);
    p.rect(3, 2, 10, 2, a); p.rect(5, 4, 6, 8, SILK); p.rect(3, 12, 10, 2, a);
    p.clear(12, 2); p.clear(13, 3); p.clear(12, 3);
    p.rect(5, 6, 6, 1, shade(SILK, -0.3));
    mark(p, 6, 8, item.id, IVORY);
  },
  'mask-shard': (p, item) => {
    const tint = mix(IVORY, accent(item), 0.45);
    const shapes = [
      [[4, 2], [13, 4], [11, 12], [6, 14], [3, 9]], [[3, 3], [12, 2], [14, 9], [8, 14], [2, 10]],
      [[5, 1], [13, 5], [12, 13], [4, 12], [2, 6]], [[2, 4], [9, 2], [14, 8], [10, 14], [3, 12]], [[4, 3], [12, 3], [13, 11], [7, 14], [2, 9]],
    ];
    p.poly(shapes[hash(item.id) % shapes.length], tint);
    const k = hash(item.id) % 3;
    p.line(7 + k, 4, 8 - k, 12, mix(tint, DARK, 0.5));
    mark(p, 9, 6, item.id, shade(tint, -0.4));
  },
  map: (p, item) => {
    const a = accent(item);
    p.rect(2, 3, 12, 10, '#d8c49a');
    p.rect(2, 3, 12, 1, a); p.rect(2, 12, 12, 1, a);
    p.rect(5, 4, 1, 8, '#b89e70'); p.rect(10, 4, 1, 8, '#b89e70');
    mark(p, 6, 6, item.id, SILK);
  },
  'memory-locket': (p, item) => {
    const a = accent(item);
    p.line(4, 2, 7.5, 6, '#8a6471'); p.line(11, 2, 7.5, 6, '#8a6471');
    p.disc(7.5, 10, 4.4, a);
    p.ring(7.5, 10, 4.4, BRONZE, 3.4);
    mark(p, 6, 9, item.id, IVORY);
  },
  'silk-heart': (p, item) => {
    heart(p, 7.5, 6, 3.2, SILK);
    p.set(4, 5, shade(SILK, 0.5));
    const k = hash(item.id) % 3;
    if (k === 0) { p.rect(7, 13, 2, 2, BRONZE); p.rect(5, 14, 6, 1, BRONZE); }
    if (k === 1) { sparkle(p, 13, 2, GOLD); }
    if (k === 2) { p.rect(1, 10, 2, 2, ICE); p.rect(13, 10, 2, 2, ICE); }
  },
  'tool-pouch-upgrade': (p, item) => {
    pouch(p, BROWN);
    p.rect(12, 1, 1, 4, IVORY); p.rect(11, 2, 3, 1, IVORY);
    mark(p, 6, 8, item.id, accent(item));
  },
  'crafting-kit-upgrade': (p, item) => {
    p.rect(3, 6, 11, 3, STEEL); p.poly([[3, 6], [0.5, 6], [3, 8]], STEEL);
    p.rect(5, 9, 6, 2, '#7a8490'); p.rect(4, 11, 8, 3, '#7a8490');
    p.rect(10, 2, 2, 4, accent(item));
    mark(p, 6, 11, item.id, IVORY);
  },
};

// ------------------------------------------------------------------ writing the files

const dir = path.join(root, 'img', 'icons');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

function write(name, draw, title) {
  const p = new Pix();
  draw(p);
  fs.writeFileSync(path.join(dir, `${name}.svg`), toSvg(p.finish(), title));
}

for (const [type, draw] of Object.entries(TYPE)) write(`type-${type}`, draw, type.replace(/-/g, ' '));

const missing = [];
let drawn = 0;
for (const item of items) {
  if (ICON[item.id]) {
    write(item.id, ICON[item.id], item.name);
  } else if (FAMILY[item.type]) {
    write(item.id, (p) => FAMILY[item.type](p, item), item.name);
  } else {
    missing.push(item.id);
    continue;
  }
  drawn += 1;
}
const unused = Object.keys(ICON).filter((id) => !byId.has(id));
console.log(`Wrote ${drawn} entry icons and ${Object.keys(TYPE).length} type icons to img/icons.`);
if (missing.length) console.log(`No icon of its own (falls back to its type): ${missing.join(', ')}`);
if (unused.length) console.log(`Icons for ids that are not in data/items.json: ${unused.join(', ')}`);
