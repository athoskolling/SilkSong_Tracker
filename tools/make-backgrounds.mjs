// make-backgrounds.mjs: draws the site's own background art as SVG files, one per Region
// (img/regions/<region-id>.svg) and one per page that is not a Region page (img/backdrop/<page>.svg).
//
// Run from the repository root:   node tools/make-backgrounds.mjs
//
// Why a script: the art is original (nothing from the game, so no rights question), and 35 pictures in one
// visual language are easier to keep consistent and to change from one place than as 35 hand-edited files.
// Every picture is deterministic: the same seed (the id) always gives the same drawing, so re-running the
// script changes a file only when this file changes.
//
// Layout of a picture (1600 x 900, shown cropped to a wide band by `object-fit: cover`): the subject sits
// in the middle band (about 25 to 65 percent down), the lower left is kept quiet because the page title
// lies over it, and the top is darkened by a vignette. Every picture is dark overall so the page's text
// stays readable over it (docs/DESIGN.md section 9).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1600;
const H = 900;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ------------------------------------------------------------------ small helpers

const f = (n) => Math.round(n * 10) / 10;

function hash(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32: a small seeded random number generator.
function makeRng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex(color) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function mix(a, b, t) {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  return toHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
}
const darken = (color, t) => mix(color, '#07040a', t);

// A drawing: collects gradient definitions and shapes, in paint order.
class Canvas {
  constructor(id) {
    this.id = id;
    this.r = makeRng(hash(id));
    this.defs = [];
    this.body = [];
    this.n = 0;
  }
  rand(a = 0, b = 1) {
    return a + (b - a) * this.r();
  }
  pick(list) {
    return list[Math.floor(this.r() * list.length)];
  }
  uid(prefix) {
    this.n += 1;
    return `${prefix}${this.n}`;
  }
  // Vertical (or any direction) linear gradient in user space. stops: [[offset, color, opacity?], ...]
  linear(stops, x1, y1, x2, y2) {
    const id = this.uid('g');
    const s = stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');
    this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${s}</linearGradient>`);
    return `url(#${id})`;
  }
  radial(stops, cx, cy, rad) {
    const id = this.uid('r');
    const s = stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');
    this.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}">${s}</radialGradient>`);
    return `url(#${id})`;
  }
  add(svg) {
    this.body.push(svg);
  }
  toSvg(title, description) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="t d">
<title id="t">${title}</title>
<desc id="d">${description}</desc>
<defs>${this.defs.join('')}</defs>
${this.body.join('\n')}
</svg>
`;
  }
}

// ------------------------------------------------------------------ layers

function sky(c, [top, mid, low]) {
  const g = c.linear([[0, top], [0.55, mid], [1, low]], 0, 0, 0, H);
  c.add(`<rect width="${W}" height="${H}" fill="${g}"/>`);
}

function glow(c, { x, y, r, color, op = 0.7 }) {
  const g = c.radial([[0, color, op], [0.5, color, op * 0.3], [1, color, 0]], x, y, r);
  c.add(`<rect width="${W}" height="${H}" fill="${g}"/>`);
}

function disc(c, { x, y, r, color, halo, op = 0.5 }) {
  glow(c, { x, y, r: r * 4.2, color: halo || color, op });
  c.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${color}"/>`);
}

function stars(c, { n = 70, color = '#f2e9d8', maxY = 380 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(`<circle cx="${f(c.rand(0, W))}" cy="${f(c.rand(0, maxY))}" r="${f(c.rand(0.6, 1.8))}" fill="${color}" opacity="${f(c.rand(0.25, 0.8))}"/>`);
  }
  c.add(`<g>${out.join('')}</g>`);
}

// A silhouette across the picture. style: hills | jagged | dunes | steps | flat.
function ridge(c, { base, amp, style = 'hills', color, top, points = 56, to = H }) {
  const f1 = c.rand(0.8, 1.6), f2 = c.rand(2, 3.4), f3 = c.rand(4.5, 7);
  const p1 = c.rand(0, 6.28), p2 = c.rand(0, 6.28), p3 = c.rand(0, 6.28);
  const n = style === 'dunes' ? 90 : points;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = -20 + t * (W + 40);
    let v = 0.5 + 0.34 * Math.sin(t * Math.PI * 2 * f1 + p1) + 0.18 * Math.sin(t * Math.PI * 2 * f2 + p2) + 0.08 * Math.sin(t * Math.PI * 2 * f3 + p3);
    if (style === 'jagged') v = 0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 2 * f1 * 1.5 + p1)) * 0.7 + c.rand(-0.18, 0.18) + 0.2 * Math.abs(Math.sin(t * Math.PI * 2 * f2 + p2));
    if (style === 'flat') v = 0.5 + c.rand(-0.04, 0.04);
    if (style === 'dunes') v = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * f1 * 0.9 + p1) * 0.7 + 0.3 * Math.sin(t * Math.PI * 2 * f2 * 0.5 + p2) * 0.5;
    v = Math.max(0, Math.min(1, v));
    if (style === 'steps') v = Math.floor(v * 6) / 6;
    pts.push([x, base - amp * (v - 0.4)]);
  }
  let d;
  if (style === 'steps') {
    d = `M${f(pts[0][0])},${H}`;
    for (const [x, y] of pts) d += ` L${f(x)},${f(y)}`;
    d += ` L${W + 20},${H} Z`;
    // steps read as stairs when each point holds its level until the next
    d = `M-20,${H}`;
    let px = -20;
    for (const [x, y] of pts) {
      d += ` L${f(px)},${f(y)} L${f(x)},${f(y)}`;
      px = x;
    }
    d += ` L${W + 20},${H} Z`;
  } else {
    d = `M${f(pts[0][0])},${to}`;
    for (const [x, y] of pts) d += ` L${f(x)},${f(y)}`;
    d += ` L${W + 20},${to} Z`;
  }
  const fill = top ? c.linear([[0, top], [0.4, color], [1, darken(color, 0.35)]], 0, base - amp, 0, base + amp * 1.8) : color;
  c.add(`<path d="${d}" fill="${fill}"/>`);
}

function fog(c, { y, h = 140, color, op = 0.35 }) {
  const g = c.linear([[0, color, 0], [0.5, color, op], [1, color, 0]], 0, y, 0, y + h);
  c.add(`<rect x="0" y="${f(y)}" width="${W}" height="${f(h)}" fill="${g}"/>`);
}

function particles(c, { n = 60, color = '#f2e9d8', rmin = 1, rmax = 3, op = 0.6, y0 = 0, y1 = H, glowy = false }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(0, W), y = c.rand(y0, y1), r = c.rand(rmin, rmax);
    const o = f(c.rand(op * 0.4, op));
    if (glowy) out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 3)}" fill="${color}" opacity="${f(o * 0.22)}"/>`);
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${color}" opacity="${o}"/>`);
  }
  c.add(`<g>${out.join('')}</g>`);
}

function rain(c, { n = 140, color = '#a9c4d4', op = 0.35, len = 46, slant = 12 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(0, W + 60), y = c.rand(-20, H), l = c.rand(len * 0.5, len);
    out.push(`M${f(x)},${f(y)}l${f(-slant * l / 40)},${f(l)}`);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="1.3" opacity="${op}" fill="none"/>`);
}

function stalactites(c, { n = 18, color, maxH = 260, minH = 60, fromBottom = false, y = 0 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.1, 0.9)) * (W / n), w = c.rand(24, 80), h = c.rand(minH, maxH);
    if (!fromBottom) out.push(`M${f(x - w / 2)},${y}Q${f(x - w * 0.1)},${f(y + h * 0.55)} ${f(x)},${f(y + h)}Q${f(x + w * 0.1)},${f(y + h * 0.55)} ${f(x + w / 2)},${y}Z`);
    else out.push(`M${f(x - w / 2)},${H}Q${f(x - w * 0.1)},${f(H - h * 0.55)} ${f(x)},${f(H - h)}Q${f(x + w * 0.1)},${f(H - h * 0.55)} ${f(x + w / 2)},${H}Z`);
  }
  c.add(`<path d="${out.join('')}" fill="${color}"/>`);
}

function vines(c, { n = 14, color, leaf, maxH = 380 }) {
  const out = [];
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(0, W), h = c.rand(120, maxH), sway = c.rand(-40, 40);
    out.push(`M${f(x)},0C${f(x + sway)},${f(h * 0.35)} ${f(x - sway)},${f(h * 0.7)} ${f(x + sway * 0.4)},${f(h)}`);
    for (let k = 1; k <= 4; k++) leaves.push(`<ellipse cx="${f(x + sway * 0.3 * Math.sin(k))}" cy="${f(h * (k / 5))}" rx="${f(c.rand(5, 9))}" ry="${f(c.rand(10, 18))}" transform="rotate(${f(c.rand(-40, 40))} ${f(x)} ${f(h * (k / 5))})"/>`);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="3" fill="none"/>`);
  c.add(`<g fill="${leaf || color}" opacity="0.9">${leaves.join('')}</g>`);
}

function shafts(c, { n = 4, color = '#f2e9d8', op = 0.16, y1 = 700 }) {
  for (let i = 0; i < n; i++) {
    const x = c.rand(200, W - 200), w = c.rand(50, 120), spread = c.rand(120, 260), lean = c.rand(-160, 160);
    const g = c.linear([[0, color, op], [1, color, 0]], x, 0, x + lean, y1);
    c.add(`<path d="M${f(x - w / 2)},0L${f(x + w / 2)},0L${f(x + lean + spread)},${y1}L${f(x + lean - spread)},${y1}Z" fill="${g}"/>`);
  }
}

function grass(c, { n = 220, color, hmin = 30, hmax = 120, base = H, sway = 26 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(-10, W + 10), h = c.rand(hmin, hmax), b = c.rand(-sway, sway);
    out.push(`M${f(x - 3)},${base}Q${f(x + b * 0.4)},${f(base - h * 0.6)} ${f(x + b)},${f(base - h)}Q${f(x + b * 0.5 + 3)},${f(base - h * 0.5)} ${f(x + 3)},${base}Z`);
  }
  c.add(`<path d="${out.join('')}" fill="${color}"/>`);
}

function branch(c, out, x, y, angle, len, depth, width) {
  if (depth === 0 || len < 8) return;
  const x2 = x + Math.cos(angle) * len, y2 = y + Math.sin(angle) * len;
  out.push(`<path d="M${f(x)},${f(y)}L${f(x2)},${f(y2)}" stroke-width="${f(width)}"/>`);
  const kids = depth > 2 ? 2 : c.pick([1, 2, 2]);
  for (let k = 0; k < kids; k++) branch(c, out, x2, y2, angle + c.rand(-0.7, 0.7), len * c.rand(0.62, 0.78), depth - 1, width * 0.66);
}

function deadTrees(c, { n = 7, color, y = H, h = 340 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.2, 0.8)) * (W / n);
    branch(c, out, x, y, -Math.PI / 2 + c.rand(-0.15, 0.15), c.rand(h * 0.3, h * 0.45), 6, c.rand(10, 18));
  }
  c.add(`<g stroke="${color}" stroke-linecap="round" fill="none">${out.join('')}</g>`);
}

function pines(c, { n = 14, color, y = H, hmin = 140, hmax = 330 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(0, W), h = c.rand(hmin, hmax), w = h * 0.34;
    for (let k = 0; k < 4; k++) {
      const yy = y - h * (k / 4.2), ww = w * (1 - k * 0.2);
      out.push(`M${f(x - ww)},${f(yy)}L${f(x)},${f(yy - h * 0.42)}L${f(x + ww)},${f(yy)}Z`);
    }
  }
  c.add(`<path d="${out.join('')}" fill="${color}"/>`);
}

function roundTrees(c, { n = 8, color, trunk, y = H, r = 120 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.2, 0.8)) * (W / n), rr = c.rand(r * 0.7, r * 1.2), th = rr * c.rand(1.2, 1.8);
    out.push(`<rect x="${f(x - 9)}" y="${f(y - th)}" width="18" height="${f(th)}" fill="${trunk || color}"/>`);
    out.push(`<ellipse cx="${f(x)}" cy="${f(y - th - rr * 0.4)}" rx="${f(rr)}" ry="${f(rr * 0.8)}" fill="${color}"/>`);
  }
  c.add(`<g>${out.join('')}</g>`);
}

function houses(c, { n = 10, color, lit = '#ffb35a', y = 640, size = 1 }) {
  const out = [];
  const wins = [];
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.1, 0.9)) * (W / n), w = c.rand(60, 120) * size, h = c.rand(60, 130) * size, roof = h * c.rand(0.45, 0.8);
    out.push(`M${f(x - w / 2)},${y}L${f(x - w / 2)},${f(y - h)}L${f(x)},${f(y - h - roof)}L${f(x + w / 2)},${f(y - h)}L${f(x + w / 2)},${y}Z`);
    const cols = Math.max(1, Math.floor(w / 40));
    for (let k = 0; k < cols; k++) if (c.r() > 0.35) wins.push(`<rect x="${f(x - w / 2 + 10 + k * 36)}" y="${f(y - h * 0.65)}" width="12" height="18" fill="${lit}" opacity="${f(c.rand(0.5, 0.95))}"/>`);
  }
  c.add(`<path d="${out.join('')}" fill="${color}"/>`);
  c.add(`<g>${wins.join('')}</g>`);
}

function towers(c, { n = 6, color, y = 620, hmin = 200, hmax = 460, spire = true, wmin = 34, wmax = 80 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.15, 0.85)) * (W / n), w = c.rand(wmin, wmax), h = c.rand(hmin, hmax);
    out.push(`M${f(x - w / 2)},${y + 200}L${f(x - w / 2)},${f(y - h)}`);
    if (spire) out.push(`L${f(x)},${f(y - h - w * 1.8)}L${f(x + w / 2)},${f(y - h)}`);
    else out.push(`L${f(x - w / 2)},${f(y - h - 14)}L${f(x - w / 4)},${f(y - h - 14)}L${f(x - w / 4)},${f(y - h)}L${f(x + w / 4)},${f(y - h)}L${f(x + w / 4)},${f(y - h - 14)}L${f(x + w / 2)},${f(y - h - 14)}`);
    out.push(`L${f(x + w / 2)},${y + 200}Z`);
  }
  c.add(`<path d="${out.join('')}" fill="${color}"/>`);
}

function pillars(c, { n = 8, color, y0 = 120, y1 = H, w = 56, gap = 0, cap = '#000', inner = false }) {
  const out = [];
  const step = W / n;
  for (let i = 0; i < n; i++) {
    const x = step * (i + 0.5) + gap;
    out.push(`<rect x="${f(x - w / 2)}" y="${y0}" width="${w}" height="${y1 - y0}" fill="${color}"/>`);
    out.push(`<rect x="${f(x - w * 0.8)}" y="${y0 - 10}" width="${f(w * 1.6)}" height="26" fill="${color}"/>`);
    out.push(`<rect x="${f(x - w * 0.7)}" y="${y1 - 40}" width="${f(w * 1.4)}" height="40" fill="${color}"/>`);
    if (inner) out.push(`<rect x="${f(x - 4)}" y="${y0 + 30}" width="8" height="${y1 - y0 - 80}" fill="${cap}" opacity="0.25"/>`);
  }
  c.add(`<g>${out.join('')}</g>`);
}

// A wall pierced by arches (evenodd), lit from behind.
function archwall(c, { n = 5, color, y = 160, y1 = H, light, lightOp = 0.55 }) {
  const step = W / n, w = step * 0.55;
  let holes = '';
  for (let i = 0; i < n; i++) {
    const x = step * (i + 0.5);
    holes += `M${f(x - w / 2)},${y1}L${f(x - w / 2)},${f(y + w / 2 + 80)}A${f(w / 2)},${f(w / 2)} 0 0 1 ${f(x + w / 2)},${f(y + w / 2 + 80)}L${f(x + w / 2)},${y1}Z`;
  }
  if (light) {
    const g = c.linear([[0, light, lightOp], [1, light, 0.05]], 0, y, 0, y1);
    c.add(`<rect x="0" y="${y}" width="${W}" height="${y1 - y}" fill="${g}"/>`);
  }
  c.add(`<path fill-rule="evenodd" d="M0,${y}H${W}V${y1}H0Z${holes}" fill="${color}"/>`);
}

function windowsTall(c, { n = 5, color = '#ffd88a', y = 170, h = 380, w = 90, frame }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (W / n), top = y + w / 2;
    out.push(`M${f(x - w / 2)},${y + h}L${f(x - w / 2)},${f(top)}A${w / 2},${w / 2} 0 0 1 ${f(x + w / 2)},${f(top)}L${f(x + w / 2)},${y + h}Z`);
    const g = c.linear([[0, color, 0.5], [1, color, 0]], x, y + h, x + 120, y + h + 260);
    c.add(`<path d="M${f(x - w / 2)},${y + h}L${f(x + w / 2)},${y + h}L${f(x + w / 2 + 220)},${y + h + 300}L${f(x - w / 2 + 120)},${y + h + 300}Z" fill="${g}"/>`);
  }
  c.add(`<path d="${out.join('')}" fill="${color}" opacity="0.8"${frame ? ` stroke="${frame}" stroke-width="6"` : ''}/>`);
}

function gearPath(cx, cy, r, teeth, depth) {
  const pts = [];
  for (let k = 0; k < teeth; k++) {
    const a = (k / teeth) * Math.PI * 2, s = (Math.PI * 2) / teeth;
    const list = [[a - s * 0.32, r], [a - s * 0.2, r + depth], [a + s * 0.2, r + depth], [a + s * 0.32, r]];
    for (const [ang, rad] of list) pts.push(`${f(cx + Math.cos(ang) * rad)},${f(cy + Math.sin(ang) * rad)}`);
  }
  return `M${pts.join('L')}Z`;
}

function gears(c, { items, color, hole }) {
  const out = [];
  for (const [x, y, r] of items) {
    const teeth = Math.max(10, Math.round(r / 7));
    out.push(`<path fill-rule="evenodd" d="${gearPath(x, y, r, teeth, r * 0.16)}M${f(x + r * 0.55)},${y}A${f(r * 0.55)},${f(r * 0.55)} 0 1 0 ${f(x - r * 0.55)},${y}A${f(r * 0.55)},${f(r * 0.55)} 0 1 0 ${f(x + r * 0.55)},${y}Z" fill="${color}"/>`);
    out.push(`<circle cx="${x}" cy="${y}" r="${f(r * 0.18)}" fill="${hole || color}"/>`);
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2;
      out.push(`<path d="M${x},${y}L${f(x + Math.cos(a) * r * 0.55)},${f(y + Math.sin(a) * r * 0.55)}" stroke="${color}" stroke-width="${f(r * 0.07)}"/>`);
    }
  }
  c.add(`<g>${out.join('')}</g>`);
}

function bell(c, { x, y, s = 1, color, shine }) {
  const body = `M${f(x - 12 * s)},${f(y)}Q${f(x - 12 * s)},${f(y + 20 * s)} ${f(x - 30 * s)},${f(y + 60 * s)}Q${f(x - 40 * s)},${f(y + 80 * s)} ${f(x - 44 * s)},${f(y + 90 * s)}L${f(x + 44 * s)},${f(y + 90 * s)}Q${f(x + 40 * s)},${f(y + 80 * s)} ${f(x + 30 * s)},${f(y + 60 * s)}Q${f(x + 12 * s)},${f(y + 20 * s)} ${f(x + 12 * s)},${f(y)}Z`;
  c.add(`<path d="M${f(x)},-10L${f(x)},${f(y)}" stroke="${color}" stroke-width="${f(3 * s)}"/>`);
  c.add(`<rect x="${f(x - 18 * s)}" y="${f(y - 10 * s)}" width="${f(36 * s)}" height="${f(12 * s)}" fill="${color}"/>`);
  c.add(`<path d="${body}" fill="${color}"/>`);
  c.add(`<circle cx="${f(x)}" cy="${f(y + 98 * s)}" r="${f(9 * s)}" fill="${color}"/>`);
  if (shine) c.add(`<path d="M${f(x - 18 * s)},${f(y + 30 * s)}Q${f(x - 26 * s)},${f(y + 60 * s)} ${f(x - 34 * s)},${f(y + 84 * s)}" stroke="${shine}" stroke-width="${f(4 * s)}" fill="none" opacity="0.7"/>`);
}

function bellsHanging(c, { n = 4, color, shine, sMin = 0.9, sMax = 2 }) {
  for (let i = 0; i < n; i++) bell(c, { x: (i + c.rand(0.2, 0.8)) * (W / n), y: c.rand(60, 280), s: c.rand(sMin, sMax), color, shine });
}

function chimneys(c, { n = 7, color, y = 660, smoke = '#c47a52' }) {
  const out = [];
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.15, 0.85)) * (W / n), w = c.rand(34, 64), h = c.rand(160, 360);
    out.push(`<path d="M${f(x - w / 2)},${y + 100}L${f(x - w * 0.4)},${f(y - h)}L${f(x + w * 0.4)},${f(y - h)}L${f(x + w / 2)},${y + 100}Z" fill="${color}"/>`);
    out.push(`<rect x="${f(x - w * 0.55)}" y="${f(y - h - 8)}" width="${f(w * 1.1)}" height="16" fill="${color}"/>`);
    puffs.push(`M${f(x)},${f(y - h - 10)}C${f(x + 40)},${f(y - h - 80)} ${f(x - 50)},${f(y - h - 150)} ${f(x + 20)},${f(y - h - 240)}`);
  }
  c.add(`<g>${out.join('')}</g>`);
  c.add(`<path d="${puffs.join('')}" stroke="${smoke}" stroke-width="22" stroke-linecap="round" fill="none" opacity="0.12"/>`);
}

function gantry(c, { x, color, y = 620, h = 420, w = 380 }) {
  const lines = [
    `M${x},${y}L${x},${y - h}`, `M${x + w},${y}L${x + w},${y - h}`, `M${x - 20},${y - h}L${x + w + 20},${y - h}`,
    `M${x},${y - h * 0.5}L${x + w},${y - h * 0.5}`, `M${x},${y}L${x + w},${y - h * 0.5}`, `M${x + w},${y}L${x},${y - h * 0.5}`,
    `M${x},${y - h * 0.5}L${x + w},${y - h}`, `M${x + w},${y - h * 0.5}L${x},${y - h}`,
  ];
  c.add(`<path d="${lines.join('')}" stroke="${color}" stroke-width="9" fill="none"/>`);
}

function lava(c, { y, colors, h = 160 }) {
  const g = c.linear([[0, colors[0], 0], [0.25, colors[0], 0.9], [0.7, colors[1]], [1, colors[2]]], 0, y, 0, y + h);
  let d = `M-20,${H}L-20,${y}`;
  for (let i = 0; i <= 40; i++) d += ` L${f(-20 + (i / 40) * (W + 40))},${f(y + Math.sin(i * 0.9) * 5 + c.rand(-3, 3))}`;
  d += ` L${W + 20},${H}Z`;
  c.add(`<path d="${d}" fill="${g}"/>`);
}

function water(c, { y, color, shimmer, h = 260 }) {
  const g = c.linear([[0, color, 0.95], [1, darken(color, 0.6), 1]], 0, y, 0, y + h);
  c.add(`<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${g}"/>`);
  const out = [];
  for (let i = 0; i < 70; i++) {
    const x = c.rand(0, W), yy = c.rand(y + 6, H), l = c.rand(30, 130);
    out.push(`M${f(x)},${f(yy)}h${f(l)}`);
  }
  c.add(`<path d="${out.join('')}" stroke="${shimmer}" stroke-width="2" opacity="0.28"/>`);
}

function ribs(c, { n = 7, color, y = H, h = 520 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.3, 0.7)) * (W / n), s = c.rand(0.6, 1.1), dir = c.r() > 0.5 ? 1 : -1;
    out.push(`M${f(x)},${y}C${f(x + dir * 120 * s)},${f(y - h * 0.5 * s)} ${f(x + dir * 40 * s)},${f(y - h * 0.9 * s)} ${f(x + dir * 260 * s)},${f(y - h * 1.1 * s)}`);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="26" stroke-linecap="round" fill="none"/>`);
}

function worms(c, { n = 4, color, hi, width = 54 }) {
  for (let i = 0; i < n; i++) {
    const y0 = c.rand(120, 600), amp = c.rand(60, 150), x0 = c.rand(-100, 300);
    const d = `M${f(x0)},${f(y0)}C${f(x0 + 300)},${f(y0 - amp)} ${f(x0 + 500)},${f(y0 + amp)} ${f(x0 + 800)},${f(y0)}S${f(x0 + 1300)},${f(y0 - amp)} ${f(x0 + 1700)},${f(y0 + amp * 0.4)}`;
    c.add(`<path d="${d}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" fill="none"/>`);
    if (hi) c.add(`<path d="${d}" stroke="${hi}" stroke-width="${f(width * 0.22)}" stroke-linecap="round" fill="none" opacity="0.35" transform="translate(0,-${f(width * 0.22)})"/>`);
  }
}

function shells(c, { n = 6, color, y = 640, size = 70 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = (i + c.rand(0.2, 0.8)) * (W / n), cy = y - c.rand(0, 220), s = c.rand(size * 0.6, size * 1.5);
    let d = '';
    for (let k = 0; k <= 60; k++) {
      const a = k * 0.28, r = s * 0.06 * Math.exp(a * 0.26);
      d += `${k ? 'L' : 'M'}${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)}`;
    }
    out.push(`<path d="${d}" stroke="${color}" stroke-width="${f(s * 0.1)}" stroke-linecap="round" fill="none"/>`);
    out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.2)}" fill="${color}" opacity="0.5"/>`);
  }
  c.add(`<g>${out.join('')}</g>`);
}

function flowers(c, { n = 14, color, center, y0 = 560, y1 = 860, size = 26, petals = 6 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(0, W), y = c.rand(y0, y1), s = c.rand(size * 0.6, size * 1.4);
    out.push(`<path d="M${f(x)},${f(y)}L${f(x + c.rand(-8, 8))},${H}" stroke="${darken(color, 0.55)}" stroke-width="3"/>`);
    for (let k = 0; k < petals; k++) out.push(`<ellipse cx="${f(x)}" cy="${f(y - s * 0.7)}" rx="${f(s * 0.32)}" ry="${f(s * 0.7)}" fill="${color}" opacity="0.9" transform="rotate(${f((k / petals) * 360)} ${f(x)} ${f(y)})"/>`);
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.26)}" fill="${center}"/>`);
  }
  c.add(`<g>${out.join('')}</g>`);
}

function web(c, { x, y, rings = 7, spokes = 12, r = 380, color, op = 0.35 }) {
  const out = [];
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * Math.PI * 2;
    out.push(`M${f(x)},${f(y)}L${f(x + Math.cos(a) * r)},${f(y + Math.sin(a) * r)}`);
  }
  for (let j = 1; j <= rings; j++) {
    const rr = (j / rings) * r;
    let d = '';
    for (let k = 0; k <= spokes; k++) {
      const a = (k / spokes) * Math.PI * 2, rv = rr * (1 + (c.r() - 0.5) * 0.05);
      const px = x + Math.cos(a) * rv, py = y + Math.sin(a) * rv;
      d += k ? `Q${f(x + Math.cos(a - Math.PI / spokes) * rv * 0.93)},${f(y + Math.sin(a - Math.PI / spokes) * rv * 0.93)} ${f(px)},${f(py)}` : `M${f(px)},${f(py)}`;
    }
    out.push(d);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="1.4" fill="none" opacity="${op}"/>`);
}

function cocoons(c, { n = 8, color, hi, y0 = 60 }) {
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.2, 0.8)) * (W / n), len = c.rand(120, 360), w = c.rand(30, 56);
    c.add(`<path d="M${f(x)},0L${f(x)},${f(len)}" stroke="${color}" stroke-width="2" opacity="0.7"/>`);
    c.add(`<ellipse cx="${f(x)}" cy="${f(len + w * 1.4)}" rx="${f(w * 0.5)}" ry="${f(w * 1.4)}" fill="${color}"/>`);
    if (hi) c.add(`<ellipse cx="${f(x - w * 0.12)}" cy="${f(len + w * 1.1)}" rx="${f(w * 0.14)}" ry="${f(w * 0.8)}" fill="${hi}" opacity="0.5"/>`);
  }
}

function shelves(c, { color, book, y0 = 120, y1 = H, cols = 8, rows = 6 }) {
  const out = [];
  const cw = W / cols, rh = (y1 - y0) / rows;
  for (let i = 0; i <= cols; i++) out.push(`<rect x="${f(i * cw - 5)}" y="${y0}" width="10" height="${y1 - y0}" fill="${color}"/>`);
  for (let j = 0; j <= rows; j++) out.push(`<rect x="0" y="${f(y0 + j * rh - 4)}" width="${W}" height="8" fill="${color}"/>`);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let x = i * cw + 14;
      while (x < (i + 1) * cw - 16) {
        const w = c.rand(8, 18), h = rh * c.rand(0.45, 0.85);
        if (c.r() > 0.25) out.push(`<rect x="${f(x)}" y="${f(y0 + (j + 1) * rh - 4 - h)}" width="${f(w)}" height="${f(h)}" fill="${book}" opacity="${f(c.rand(0.25, 0.7))}"/>`);
        x += w + c.rand(1, 6);
      }
    }
  }
  c.add(`<g>${out.join('')}</g>`);
}

function orbs(c, { n = 10, color, y0 = 100, y1 = 700, rmin = 14, rmax = 60 }) {
  for (let i = 0; i < n; i++) {
    const x = c.rand(60, W - 60), y = c.rand(y0, y1), r = c.rand(rmin, rmax);
    const g = c.radial([[0, '#ffffff', 0.85], [0.25, color, 0.7], [1, color, 0]], x, y, r * 2.6);
    c.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${g}"/>`);
    c.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>`);
  }
}

function frames(c, { n = 5, color, y0 = 160, y1 = 600 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const w = c.rand(110, 220), h = c.rand(180, 340), x = c.rand(40, W - w - 40), y = c.rand(y0, y1 - h);
    out.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(w / 2.4)}" stroke="${color}" stroke-width="5" fill="${color}" fill-opacity="0.06"/>`);
    out.push(`<rect x="${f(x + 14)}" y="${f(y + 14)}" width="${f(w - 28)}" height="${f(h - 28)}" rx="${f(w / 3)}" stroke="${color}" stroke-width="2" fill="none" opacity="0.5"/>`);
  }
  c.add(`<g opacity="0.7">${out.join('')}</g>`);
}

function bars(c, { n = 14, color, y0 = 0, y1 = H, w = 14 }) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(`<rect x="${f((i + 0.5) * (W / n) - w / 2)}" y="${y0}" width="${w}" height="${y1 - y0}"/>`);
  out.push(`<rect x="0" y="${f(y0 + 90)}" width="${W}" height="14"/><rect x="0" y="${f(y1 - 150)}" width="${W}" height="14"/>`);
  c.add(`<g fill="${color}">${out.join('')}</g>`);
}

function bridge(c, { y, color, chain }) {
  c.add(`<rect x="-10" y="${y}" width="${W + 20}" height="22" fill="${color}"/>`);
  const out = [];
  for (let i = 0; i < 9; i++) out.push(`<rect x="${f(i * 200 + 90)}" y="${y + 22}" width="22" height="${H - y}" fill="${color}"/>`);
  c.add(`<g opacity="0.85">${out.join('')}</g>`);
  if (chain) c.add(`<path d="M-10,${y - 130}Q${W / 2},${y + 40} ${W + 10},${y - 130}" stroke="${chain}" stroke-width="4" stroke-dasharray="9 6" fill="none"/>`);
}

function pipes(c, { color, hi, n = 6 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const y = c.rand(80, 620), x0 = c.rand(-50, 600), x1 = c.rand(900, W + 50), bend = c.rand(40, 160);
    out.push(`M${f(x0)},${f(y)}H${f(x1 - bend)}Q${f(x1)},${f(y)} ${f(x1)},${f(y + bend)}V${f(y + bend + c.rand(60, 200))}`);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="26" fill="none" stroke-linejoin="round"/>`);
  if (hi) c.add(`<path d="${out.join('')}" stroke="${hi}" stroke-width="5" fill="none" opacity="0.4" transform="translate(0,-7)"/>`);
}

function drips(c, { n = 24, color, op = 0.6 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(0, W), y = c.rand(120, 740), l = c.rand(18, 50);
    out.push(`M${f(x)},${f(y)}l0,${f(l)}`);
    out.push(`M${f(x)},${f(y + l + 5)}a3,4.5 0 1 0 0.1,0Z`);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="2.2" fill="${color}" opacity="${op}"/>`);
}

function bubbles(c, { n = 40, color, y0 = 300, y1 = 860 }) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(`<circle cx="${f(c.rand(0, W))}" cy="${f(c.rand(y0, y1))}" r="${f(c.rand(3, 16))}" fill="none" stroke="${color}" stroke-width="2" opacity="${f(c.rand(0.2, 0.6))}"/>`);
  c.add(`<g>${out.join('')}</g>`);
}

function reeds(c, { n = 90, color, base = H, hmin = 120, hmax = 340 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(0, W), h = c.rand(hmin, hmax), b = c.rand(-30, 30);
    out.push(`M${f(x)},${base}Q${f(x + b * 0.3)},${f(base - h * 0.6)} ${f(x + b)},${f(base - h)}`);
    if (c.r() > 0.6) out.push(`M${f(x + b)},${f(base - h)}l0,${f(-c.rand(16, 30))}`);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none"/>`);
}

function flames(c, { n = 16, color, core, y = 700, hmin = 80, hmax = 300 }) {
  for (let i = 0; i < n; i++) {
    const x = c.rand(0, W), h = c.rand(hmin, hmax), w = h * c.rand(0.22, 0.34);
    const g = c.linear([[0, core, 0.95], [1, color, 0]], x, y, x, y - h);
    c.add(`<path d="M${f(x - w)},${f(y)}C${f(x - w)},${f(y - h * 0.4)} ${f(x - w * 0.2)},${f(y - h * 0.55)} ${f(x + c.rand(-12, 12))},${f(y - h)}C${f(x + w * 0.4)},${f(y - h * 0.55)} ${f(x + w)},${f(y - h * 0.4)} ${f(x + w)},${f(y)}Z" fill="${g}"/>`);
  }
}

function lightning(c, { n = 3, color }) {
  for (let i = 0; i < n; i++) {
    let x = c.rand(200, W - 200), y = 0, d = `M${f(x)},${y}`;
    while (y < c.rand(380, 560)) {
      x += c.rand(-50, 50);
      y += c.rand(36, 70);
      d += `L${f(x)},${f(y)}`;
    }
    c.add(`<path d="${d}" stroke="${color}" stroke-width="12" opacity="0.14" fill="none" stroke-linejoin="round"/>`);
    c.add(`<path d="${d}" stroke="${color}" stroke-width="3" opacity="0.85" fill="none" stroke-linejoin="round"/>`);
  }
}

function coral(c, { n = 5, color, y = 640 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.2, 0.8)) * (W / n);
    branch(c, out, x, y, -Math.PI / 2 + c.rand(-0.2, 0.2), c.rand(120, 190), 5, 14);
  }
  c.add(`<g stroke="${color}" stroke-linecap="round" fill="none">${out.join('')}</g>`);
}

function tentacles(c, { n = 6, color, hi }) {
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.2, 0.8)) * (W / n), h = c.rand(360, 640), sway = c.rand(80, 220) * (c.r() > 0.5 ? 1 : -1);
    const d = `M${f(x)},${H + 20}C${f(x + sway)},${f(H - h * 0.4)} ${f(x - sway * 0.8)},${f(H - h * 0.7)} ${f(x + sway * 0.4)},${f(H - h)}`;
    c.add(`<path d="${d}" stroke="${color}" stroke-width="${f(c.rand(30, 60))}" stroke-linecap="round" fill="none"/>`);
    if (hi) c.add(`<path d="${d}" stroke="${hi}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.4" stroke-dasharray="2 22"/>`);
  }
}

function birds(c, { n = 9, color, y0 = 120, y1 = 360 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = c.rand(80, W - 80), y = c.rand(y0, y1), s = c.rand(8, 18);
    out.push(`M${f(x - s)},${f(y - s * 0.4)}Q${f(x - s * 0.4)},${f(y - s * 0.7)} ${f(x)},${f(y)}Q${f(x + s * 0.4)},${f(y - s * 0.7)} ${f(x + s)},${f(y - s * 0.4)}`);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>`);
}

function lamps(c, { n = 6, color = '#ffb35a', y = 620, post }) {
  for (let i = 0; i < n; i++) {
    const x = (i + c.rand(0.2, 0.8)) * (W / n);
    if (post) c.add(`<path d="M${f(x)},${H}L${f(x)},${f(y)}" stroke="${post}" stroke-width="6"/>`);
    const g = c.radial([[0, color, 0.8], [1, color, 0]], x, y, 90);
    c.add(`<circle cx="${f(x)}" cy="${f(y)}" r="90" fill="${g}"/>`);
    c.add(`<circle cx="${f(x)}" cy="${f(y)}" r="7" fill="${color}"/>`);
  }
}

function roadLines(c, { color, vx = W * 0.5, vy = 470 }) {
  const out = [];
  for (let i = -3; i <= 3; i++) out.push(`M${f(vx + i * 25)},${vy}L${f(vx + i * 520)},${H}`);
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="3" opacity="0.5" fill="none"/>`);
  const g = c.linear([[0, color, 0.0], [1, color, 0.18]], 0, vy, 0, H);
  c.add(`<path d="M${vx - 40},${vy}L${vx - 1500},${H}L${vx + 1500},${H}L${vx + 40},${vy}Z" fill="${g}"/>`);
}

function crescent(c, { x, y, r, color }) {
  c.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`);
}

// The recurring silk thread: a few long curves with a bead on each.
function silk(c, { n = 3, color = '#ec555b', op = 0.55 }) {
  const out = [];
  const beads = [];
  for (let i = 0; i < n; i++) {
    const y0 = c.rand(80, 700), y1 = c.rand(80, 700), cx1 = c.rand(300, 700), cx2 = c.rand(900, 1300), cy1 = c.rand(0, H), cy2 = c.rand(0, H);
    out.push(`M-20,${f(y0)}C${f(cx1)},${f(cy1)} ${f(cx2)},${f(cy2)} ${W + 20},${f(y1)}`);
    const t = c.rand(0.25, 0.75), u = 1 - t;
    beads.push(`<circle cx="${f(u * u * u * -20 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * (W + 20))}" cy="${f(u * u * u * y0 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * y1)}" r="4.5" fill="${color}"/>`);
  }
  c.add(`<path d="${out.join('')}" stroke="${color}" stroke-width="1.4" fill="none" opacity="${op}"/>`);
  c.add(`<g opacity="${Math.min(1, op + 0.3)}">${beads.join('')}</g>`);
}

// `light`: page backdrops, which sit behind the whole page and are already dimmed by the stylesheet, so they
// keep only a soft edge shade; Region heroes also darken the top (title area) and the bottom.
function vignette(c, light = false) {
  if (light) {
    const soft = c.radial([[0.6, '#130b13', 0], [1, '#130b13', 0.55]], W / 2, H * 0.5, W * 0.7);
    c.add(`<rect width="${W}" height="${H}" fill="${soft}"/>`);
    return;
  }
  const top = c.linear([[0, '#130b13', 0.82], [0.5, '#130b13', 0]], 0, 0, 0, H * 0.55);
  c.add(`<rect width="${W}" height="${H}" fill="${top}"/>`);
  const edge = c.radial([[0.55, '#130b13', 0], [1, '#130b13', 0.7]], W / 2, H * 0.48, W * 0.66);
  c.add(`<rect width="${W}" height="${H}" fill="${edge}"/>`);
  const low = c.linear([[0.62, '#130b13', 0], [1, '#130b13', 0.55]], 0, 0, 0, H);
  c.add(`<rect width="${W}" height="${H}" fill="${low}"/>`);
}

// ------------------------------------------------------------------ the Regions

// Each Region: a name and a description (for the SVG's accessible text) and a drawing.
const REGIONS = {
  'moss-grotto': {
    name: 'Moss Grotto',
    desc: 'A mossy cave in green light, with hanging vines, drifting spores and a pale shaft of daylight.',
    draw(c) {
      sky(c, ['#07140f', '#0f2d1d', '#1c4a2b']);
      glow(c, { x: 900, y: 150, r: 600, color: '#9be37a', op: 0.4 });
      shafts(c, { n: 4, color: '#d6f5b0', op: 0.2 });
      ridge(c, { base: 560, amp: 150, color: '#10301f', top: '#2d6a3e' });
      ridge(c, { base: 640, amp: 110, color: '#0b2216', top: '#1f4d2e' });
      stalactites(c, { n: 16, color: '#071710', maxH: 300 });
      vines(c, { n: 14, color: '#143a22', leaf: '#2c6a3b' });
      ridge(c, { base: 760, amp: 90, color: '#06120c' });
      grass(c, { n: 160, color: '#07160e', hmin: 40, hmax: 130 });
      particles(c, { n: 70, color: '#c9f59a', rmin: 1, rmax: 3.2, op: 0.8, y0: 120, y1: 760, glowy: true });
      fog(c, { y: 560, h: 200, color: '#6bb66a', op: 0.16 });
    },
  },
  'the-marrow': {
    name: 'The Marrow',
    desc: 'Bone caverns: great pale ribs arch out of the dark over a cavern floor lit by a dull amber glow.',
    draw(c) {
      sky(c, ['#120d14', '#241a22', '#3c2c2d']);
      glow(c, { x: 800, y: 600, r: 700, color: '#d99a5b', op: 0.38 });
      ridge(c, { base: 560, amp: 140, color: '#2a2022', top: '#5a4b46' });
      stalactites(c, { n: 20, color: '#1a1318', maxH: 280 });
      ribs(c, { n: 8, color: '#cdbfa6', h: 560 });
      ridge(c, { base: 700, amp: 100, color: '#1b1418', top: '#3a2e2f' });
      ribs(c, { n: 5, color: '#e6dac3', h: 360, y: 780 });
      stalactites(c, { n: 14, color: '#0d080d', maxH: 160, fromBottom: true });
      particles(c, { n: 60, color: '#efe2c4', rmin: 1, rmax: 2.4, op: 0.55, y0: 140, y1: 700 });
      fog(c, { y: 520, h: 220, color: '#b99a78', op: 0.14 });
    },
  },
  'deep-docks': {
    name: 'Deep Docks',
    desc: 'A dockside forge district at dusk: crooked chimneys, a big bronze bell on an iron gantry, a river of lava and drifting embers.',
    draw(c) {
      sky(c, ['#130b13', '#3a1220', '#a8401f']);
      glow(c, { x: 1080, y: 600, r: 640, color: '#ff7a3d', op: 0.7 });
      ridge(c, { base: 560, amp: 70, color: '#2a0f19', style: 'flat' });
      chimneys(c, { n: 8, color: '#1b0b13', y: 640 });
      gantry(c, { x: 980, color: '#1b0b13', y: 650, h: 460, w: 360 });
      bell(c, { x: 1160, y: 330, s: 1.7, color: '#e0a853', shine: '#fff0b8' });
      ridge(c, { base: 700, amp: 50, color: '#14070d', style: 'flat' });
      lava(c, { y: 700, colors: ['#ff8a3a', '#d8441f', '#5b1410'] });
      particles(c, { n: 90, color: '#ffb35a', rmin: 1, rmax: 3, op: 0.9, y0: 100, y1: 700, glowy: true });
    },
  },
  'far-fields': {
    name: 'Far Fields',
    desc: 'Wide grasslands at dusk, long grass bending in the wind under a low sun, with pollen in the air.',
    draw(c) {
      sky(c, ['#171829', '#5a3b4b', '#e0965a']);
      disc(c, { x: 1060, y: 520, r: 56, color: '#ffd08a', halo: '#ff9a52', op: 0.55 });
      birds(c, { n: 7, color: '#2a1a26' });
      ridge(c, { base: 560, amp: 120, color: '#5a4a45', top: '#a07553', style: 'hills' });
      ridge(c, { base: 640, amp: 100, color: '#3f3a2d', top: '#7a6a3f', style: 'hills' });
      ridge(c, { base: 730, amp: 80, color: '#252418', top: '#4a4a26', style: 'hills' });
      grass(c, { n: 260, color: '#161a0f', hmin: 50, hmax: 170, sway: 40 });
      particles(c, { n: 60, color: '#ffe0a0', rmin: 1, rmax: 2.6, op: 0.8, y0: 300, y1: 780, glowy: true });
    },
  },
  'hunters-march': {
    name: "Hunter's March",
    desc: 'A misty hunting ground: dead trees, sharpened stakes and a cold green moon.',
    draw(c) {
      sky(c, ['#0a0e13', '#17232a', '#2c3d3a']);
      disc(c, { x: 400, y: 220, r: 46, color: '#cfe0cf', halo: '#7fb3a0', op: 0.4 });
      ridge(c, { base: 560, amp: 150, color: '#16222a', top: '#2f4640', style: 'jagged' });
      pines(c, { n: 18, color: '#0e171b', y: 640, hmin: 140, hmax: 300 });
      fog(c, { y: 500, h: 220, color: '#7fa59a', op: 0.2 });
      deadTrees(c, { n: 7, color: '#091014', y: 800, h: 520 });
      ridge(c, { base: 790, amp: 60, color: '#06090c' });
      particles(c, { n: 40, color: '#b8d8c8', rmin: 1, rmax: 2, op: 0.5, y0: 160, y1: 760 });
    },
  },
  greymoor: {
    name: 'Greymoor',
    desc: 'Rain over grey moors at dusk, a lit cottage, crows against the clouds and drifting mist.',
    draw(c) {
      sky(c, ['#0f141a', '#26313a', '#4b5a63']);
      birds(c, { n: 10, color: '#10151a', y0: 140, y1: 330 });
      ridge(c, { base: 580, amp: 130, color: '#2c3a42', top: '#59707a', style: 'hills' });
      houses(c, { n: 3, color: '#10171c', lit: '#ffc477', y: 640, size: 1.2 });
      ridge(c, { base: 700, amp: 100, color: '#1a252b', top: '#364a52', style: 'hills' });
      fog(c, { y: 560, h: 180, color: '#9db5bf', op: 0.2 });
      grass(c, { n: 180, color: '#0b1216', hmin: 30, hmax: 90, base: H });
      rain(c, { n: 190, color: '#b6ccd6', op: 0.32 });
    },
  },
  bellhart: {
    name: 'Bellhart',
    desc: 'A town under a silk curse: crooked rooftops, a bell tower, and red threads strung across the sky.',
    draw(c) {
      sky(c, ['#150b17', '#40182a', '#7a2a35']);
      glow(c, { x: 800, y: 560, r: 640, color: '#ec555b', op: 0.38 });
      towers(c, { n: 5, color: '#26101e', y: 640, hmin: 160, hmax: 380 });
      bell(c, { x: 1060, y: 250, s: 1.3, color: '#10060d', shine: '#ec555b' });
      houses(c, { n: 12, color: '#1a0a14', lit: '#ff8d6a', y: 700, size: 1 });
      ridge(c, { base: 790, amp: 40, color: '#0a040a', style: 'flat' });
      silk(c, { n: 7, op: 0.75 });
      particles(c, { n: 40, color: '#ffb0a0', rmin: 1, rmax: 2.2, op: 0.5, y0: 120, y1: 700 });
    },
  },
  shellwood: {
    name: 'Shellwood',
    desc: 'A forest of coiled shells and pale flowers in teal light, with spores drifting between the trunks.',
    draw(c) {
      sky(c, ['#07151a', '#0f3a3c', '#1e6a62']);
      glow(c, { x: 800, y: 200, r: 720, color: '#8ef0d0', op: 0.35 });
      ridge(c, { base: 580, amp: 130, color: '#0f3a3c', top: '#2c7a70', style: 'hills' });
      shells(c, { n: 7, color: '#bfece0', y: 620, size: 90 });
      ridge(c, { base: 700, amp: 90, color: '#0a2a2c', top: '#1f5e58', style: 'hills' });
      shells(c, { n: 5, color: '#e4a8c0', y: 760, size: 120 });
      flowers(c, { n: 16, color: '#f0b6cc', center: '#ffe9a0', y0: 640, y1: 860, size: 34 });
      particles(c, { n: 80, color: '#c8fff0', rmin: 1, rmax: 3, op: 0.7, y0: 100, y1: 780, glowy: true });
      fog(c, { y: 540, h: 200, color: '#6fd6c0', op: 0.14 });
    },
  },
  wormways: {
    name: 'Wormways',
    desc: 'Tunnels gnawed through the dark by enormous worms, their curving tubes catching a dull violet light.',
    draw(c) {
      sky(c, ['#0f0a13', '#241830', '#3a2748']);
      glow(c, { x: 620, y: 520, r: 700, color: '#a068c8', op: 0.34 });
      worms(c, { n: 5, color: '#2c1d3a', hi: '#c9a0e6', width: 70 });
      worms(c, { n: 3, color: '#1a1024', hi: '#8e63b0', width: 46 });
      stalactites(c, { n: 18, color: '#0d0713', maxH: 240 });
      ridge(c, { base: 760, amp: 90, color: '#0b0610', style: 'jagged' });
      particles(c, { n: 60, color: '#d9b8f0', rmin: 1, rmax: 2.4, op: 0.6, y0: 140, y1: 720, glowy: true });
    },
  },
  'sinners-road': {
    name: "Sinner's Road",
    desc: 'A grim road running into the distance past ruined arches and a row of guttering lamps, ash falling.',
    draw(c) {
      sky(c, ['#110a0e', '#2d1517', '#53272a']);
      glow(c, { x: 800, y: 470, r: 560, color: '#d4553a', op: 0.45 });
      ridge(c, { base: 520, amp: 110, color: '#251013', top: '#442022', style: 'jagged' });
      archwall(c, { n: 6, color: '#160a0d', y: 300, y1: 640 });
      roadLines(c, { color: '#a0524a' });
      lamps(c, { n: 6, y: 600, post: '#0a0507' });
      particles(c, { n: 100, color: '#e0b8a0', rmin: 1, rmax: 2.4, op: 0.5, y0: 100, y1: 860 });
    },
  },
  'blasted-steps': {
    name: 'Blasted Steps',
    desc: 'Cliffs cut into great steps under a pale sun, sand and dust blowing across the stairs.',
    draw(c) {
      sky(c, ['#1a1118', '#5a3a3a', '#d09a66']);
      disc(c, { x: 1150, y: 300, r: 60, color: '#ffe2b0', halo: '#ffb878', op: 0.5 });
      ridge(c, { base: 470, amp: 260, color: '#8a5a44', top: '#f0c088', style: 'steps' });
      ridge(c, { base: 600, amp: 220, color: '#5e3c30', top: '#c08a60', style: 'steps' });
      ridge(c, { base: 740, amp: 160, color: '#33211c', top: '#7a5240', style: 'steps' });
      fog(c, { y: 520, h: 220, color: '#e0b080', op: 0.22 });
      particles(c, { n: 90, color: '#f2d4a4', rmin: 1, rmax: 2.4, op: 0.55, y0: 200, y1: 780 });
    },
  },
  'weavenest-atla': {
    name: 'Weavenest Atla',
    desc: 'A nest woven from silver thread: giant webs, hanging cocoons and a pale lavender glow.',
    draw(c) {
      sky(c, ['#0f0c18', '#251d3a', '#41336a']);
      glow(c, { x: 800, y: 420, r: 700, color: '#bba6ff', op: 0.42 });
      web(c, { x: 480, y: 380, r: 420, color: '#d9ccff', op: 0.45 });
      web(c, { x: 1180, y: 300, r: 360, color: '#d9ccff', op: 0.4 });
      cocoons(c, { n: 9, color: '#2f2650', hi: '#e6dcff' });
      ridge(c, { base: 780, amp: 80, color: '#120d20', style: 'hills' });
      silk(c, { n: 5, color: '#e6dcff', op: 0.6 });
      particles(c, { n: 60, color: '#efe8ff', rmin: 1, rmax: 2.6, op: 0.7, y0: 120, y1: 720, glowy: true });
    },
  },
  'grand-gate': {
    name: 'Grand Gate',
    desc: 'A colossal stone gate with warm gold light pouring through its doorway between two huge pillars.',
    draw(c) {
      sky(c, ['#120d12', '#2f2125', '#6a4a36']);
      glow(c, { x: 800, y: 520, r: 560, color: '#ffc070', op: 0.8 });
      pillars(c, { n: 2, color: '#1a1216', y0: 80, y1: H, w: 150, gap: 0 });
      c.add(`<path d="M520,${H}L520,420A280,280 0 0 1 1080,420L1080,${H}Z" fill="#ffd9a0" opacity="0.3"/>`);
      pillars(c, { n: 8, color: '#150d11', y0: 200, y1: 700, w: 48 });
      ridge(c, { base: 760, amp: 50, color: '#0b0609', style: 'flat' });
      shafts(c, { n: 3, color: '#ffd9a0', op: 0.25, y1: 800 });
      particles(c, { n: 60, color: '#ffe4b0', rmin: 1, rmax: 2.6, op: 0.7, y0: 200, y1: 760, glowy: true });
    },
  },
  underworks: {
    name: 'Underworks',
    desc: 'The furnace works under the Citadel: iron pipes, turning gears and a hot orange glow from below.',
    draw(c) {
      sky(c, ['#0e0a0d', '#2a1612', '#5a2a1a']);
      glow(c, { x: 800, y: 760, r: 800, color: '#ff8a3a', op: 0.62 });
      gears(c, { items: [[300, 300, 190], [660, 220, 110], [1280, 360, 230], [1000, 560, 120]], color: '#1d0f0e', hole: '#2a1612' });
      pipes(c, { color: '#241410', hi: '#ffb070', n: 6 });
      ridge(c, { base: 760, amp: 50, color: '#0e0707', style: 'flat' });
      particles(c, { n: 80, color: '#ffb35a', rmin: 1, rmax: 2.8, op: 0.9, y0: 280, y1: 760, glowy: true });
    },
  },
  'choral-chambers': {
    name: 'Choral Chambers',
    desc: 'Vast halls of columns and arches, gold light falling through high windows over hanging bells.',
    draw(c) {
      sky(c, ['#120c14', '#2e2030', '#5a3c4a']);
      glow(c, { x: 800, y: 300, r: 700, color: '#ffc880', op: 0.5 });
      windowsTall(c, { n: 5, color: '#ffd98a', y: 150, h: 300, w: 100 });
      archwall(c, { n: 6, color: '#170e17', y: 380, y1: H, light: '#ffc880', lightOp: 0.25 });
      pillars(c, { n: 7, color: '#0e080e', y0: 90, y1: H, w: 60 });
      bellsHanging(c, { n: 4, color: '#c99a4a', shine: '#fff0b8', sMin: 0.7, sMax: 1.3 });
      particles(c, { n: 60, color: '#ffe4b0', rmin: 1, rmax: 2.6, op: 0.7, y0: 160, y1: 760, glowy: true });
    },
  },
  'cogwork-core': {
    name: 'Cogwork Core',
    desc: 'A clockwork tower: great brass gears of every size meshing in warm light.',
    draw(c) {
      sky(c, ['#100b0b', '#2d2014', '#59401f']);
      glow(c, { x: 800, y: 400, r: 760, color: '#e0a548', op: 0.5 });
      gears(c, { items: [[250, 250, 220], [640, 380, 140], [980, 200, 180], [1340, 460, 250], [900, 640, 130], [140, 700, 160]], color: '#2a1d0e', hole: '#3d2b14' });
      gears(c, { items: [[520, 640, 90], [1180, 120, 80]], color: '#c58f3c', hole: '#2a1d0e' });
      ridge(c, { base: 800, amp: 40, color: '#0b0706', style: 'flat' });
      particles(c, { n: 60, color: '#ffd58a', rmin: 1, rmax: 2.4, op: 0.7, y0: 160, y1: 780, glowy: true });
    },
  },
  'whispering-vaults': {
    name: 'Whispering Vaults',
    desc: 'Archives of endless shelves, loose pages drifting upward through blue-violet light.',
    draw(c) {
      sky(c, ['#0a0b18', '#181a38', '#2c2f62']);
      glow(c, { x: 800, y: 380, r: 720, color: '#7f8cff', op: 0.34 });
      shelves(c, { color: '#10122a', book: '#9aa4ff', cols: 8, rows: 6 });
      particles(c, { n: 70, color: '#dfe3ff', rmin: 2, rmax: 6, op: 0.55, y0: 120, y1: 760 });
      orbs(c, { n: 4, color: '#a8b2ff', rmin: 10, rmax: 24 });
    },
  },
  whiteward: {
    name: 'Whiteward',
    desc: 'A quiet hospital hall: pale curtains, soft lamps and cool white-blue light across rows of arches.',
    draw(c) {
      sky(c, ['#0e1520', '#243a4e', '#4a6a80']);
      glow(c, { x: 800, y: 360, r: 760, color: '#d4ecff', op: 0.45 });
      archwall(c, { n: 5, color: '#1a2a3a', y: 200, y1: H, light: '#dff2ff', lightOp: 0.3 });
      lamps(c, { n: 5, y: 440, color: '#e8f6ff', post: '#0e1824' });
      ridge(c, { base: 790, amp: 40, color: '#0c1520', style: 'flat' });
      particles(c, { n: 50, color: '#eaf6ff', rmin: 1, rmax: 2.4, op: 0.6, y0: 160, y1: 760 });
      fog(c, { y: 560, h: 200, color: '#bde0f6', op: 0.16 });
    },
  },
  'high-halls': {
    name: 'High Halls',
    desc: 'Towering halls and spires high above the Citadel, tall arched windows full of golden light.',
    draw(c) {
      sky(c, ['#0f0c18', '#2b2240', '#6a4a6a']);
      stars(c, { n: 50, maxY: 260 });
      glow(c, { x: 800, y: 380, r: 720, color: '#ffc8a0', op: 0.42 });
      towers(c, { n: 7, color: '#1a1226', y: 700, hmin: 280, hmax: 560, spire: true });
      windowsTall(c, { n: 6, color: '#ffd8a0', y: 190, h: 330, w: 84 });
      pillars(c, { n: 5, color: '#0d0814', y0: 120, y1: H, w: 70 });
      particles(c, { n: 50, color: '#ffe4c0', rmin: 1, rmax: 2.4, op: 0.65, y0: 160, y1: 760, glowy: true });
    },
  },
  'the-slab': {
    name: 'The Slab',
    desc: 'A prison across a long bridge, iron bars and hanging chains in cold grey light.',
    draw(c) {
      sky(c, ['#0c0e12', '#1c222a', '#36404a']);
      glow(c, { x: 800, y: 380, r: 640, color: '#9fb4c4', op: 0.3 });
      towers(c, { n: 6, color: '#161c22', y: 640, hmin: 160, hmax: 360, spire: false, wmin: 70, wmax: 140 });
      bridge(c, { y: 640, color: '#0b0f13', chain: '#6a7c88' });
      bars(c, { n: 15, color: '#080b0e' });
      fog(c, { y: 560, h: 220, color: '#8aa0b0', op: 0.2 });
      particles(c, { n: 40, color: '#c8d8e4', rmin: 1, rmax: 2, op: 0.5, y0: 160, y1: 760 });
    },
  },
  'mount-fay': {
    name: 'Mount Fay',
    desc: 'A freezing mountain in blue night, snow-capped peaks and snow falling through cold light.',
    draw(c) {
      sky(c, ['#080c18', '#17284a', '#3b5c8a']);
      stars(c, { n: 80, maxY: 320 });
      disc(c, { x: 1180, y: 200, r: 38, color: '#e6f0ff', halo: '#9cc0ff', op: 0.4 });
      ridge(c, { base: 560, amp: 260, color: '#1c2f52', top: '#e4efff', style: 'jagged' });
      ridge(c, { base: 680, amp: 200, color: '#14233e', top: '#a8c4ec', style: 'jagged' });
      pines(c, { n: 16, color: '#0a1424', y: 820, hmin: 160, hmax: 300 });
      particles(c, { n: 160, color: '#ffffff', rmin: 1, rmax: 3.2, op: 0.85, y0: 0, y1: H });
      fog(c, { y: 580, h: 200, color: '#bcd6ff', op: 0.2 });
    },
  },
  memorium: {
    name: 'Memorium',
    desc: 'A hall of memory: tall empty frames and floating orbs of soft light in deep indigo.',
    draw(c) {
      sky(c, ['#0a0818', '#1c1440', '#352a6e']);
      glow(c, { x: 800, y: 420, r: 760, color: '#9d88ff', op: 0.4 });
      frames(c, { n: 6, color: '#cfc4ff' });
      orbs(c, { n: 9, color: '#bfb0ff', rmin: 10, rmax: 36 });
      ridge(c, { base: 790, amp: 40, color: '#0a0716', style: 'flat' });
      particles(c, { n: 70, color: '#e8e0ff', rmin: 1, rmax: 2.6, op: 0.7, y0: 100, y1: 760, glowy: true });
    },
  },
  'putrified-ducts': {
    name: 'Putrified Ducts',
    desc: 'Foul sewer ducts in sickly green: dripping pipes, bubbles rising and flies in the dark.',
    draw(c) {
      sky(c, ['#0b0f08', '#222a10', '#46501c']);
      glow(c, { x: 800, y: 620, r: 740, color: '#b6c846', op: 0.4 });
      pipes(c, { color: '#1a2010', hi: '#c8d860', n: 7 });
      stalactites(c, { n: 16, color: '#0d1208', maxH: 220 });
      drips(c, { n: 26, color: '#c8d860' });
      water(c, { y: 700, color: '#46501c', shimmer: '#d8e880' });
      bubbles(c, { n: 40, color: '#d8e880' });
      particles(c, { n: 40, color: '#e4f088', rmin: 1, rmax: 2, op: 0.7, y0: 150, y1: 700 });
    },
  },
  'wisp-thicket': {
    name: 'Wisp Thicket',
    desc: 'A burning thicket: black thorny trees against orange flames and drifting wisps of fire.',
    draw(c) {
      sky(c, ['#0e0807', '#3a1208', '#8a3210']);
      glow(c, { x: 800, y: 700, r: 820, color: '#ff7a2a', op: 0.7 });
      flames(c, { n: 20, color: '#ff6a1c', core: '#ffd070', y: 720, hmin: 90, hmax: 320 });
      deadTrees(c, { n: 9, color: '#0b0505', y: 860, h: 560 });
      ridge(c, { base: 800, amp: 60, color: '#070303', style: 'jagged' });
      particles(c, { n: 120, color: '#ffb050', rmin: 1, rmax: 3, op: 0.95, y0: 80, y1: 780, glowy: true });
    },
  },
  bilewater: {
    name: 'Bilewater',
    desc: 'Toxic marshes under thick fog: reeds, bubbling green water and a sickly yellow glow.',
    draw(c) {
      sky(c, ['#0a0e08', '#2a3414', '#5f6e22']);
      glow(c, { x: 1000, y: 520, r: 640, color: '#d8e04a', op: 0.4 });
      ridge(c, { base: 560, amp: 110, color: '#222c12', top: '#4a5a24', style: 'hills' });
      deadTrees(c, { n: 5, color: '#10160a', y: 700, h: 360 });
      water(c, { y: 660, color: '#3a4a18', shimmer: '#e4f070' });
      reeds(c, { n: 100, color: '#0d1308', base: H, hmin: 120, hmax: 360 });
      bubbles(c, { n: 36, color: '#e4f070', y0: 680, y1: 860 });
      fog(c, { y: 520, h: 240, color: '#b4c85a', op: 0.24 });
    },
  },
  'sands-of-karak': {
    name: 'Sands of Karak',
    desc: 'Long sandy ledges under a stormy ochre sky, a spined coral tower and lightning in the distance.',
    draw(c) {
      sky(c, ['#150e0c', '#4a2c1c', '#c88a4a']);
      glow(c, { x: 560, y: 500, r: 640, color: '#ffc070', op: 0.5 });
      lightning(c, { n: 3, color: '#fff2b0' });
      coral(c, { n: 4, color: '#3a2216', y: 660 });
      ridge(c, { base: 600, amp: 130, color: '#a0703c', top: '#e0b070', style: 'dunes' });
      ridge(c, { base: 690, amp: 110, color: '#6a4528', top: '#b88a50', style: 'dunes' });
      ridge(c, { base: 780, amp: 80, color: '#3a2616', top: '#7a5430', style: 'dunes' });
      particles(c, { n: 80, color: '#f4d8a0', rmin: 1, rmax: 2.2, op: 0.5, y0: 300, y1: 800 });
    },
  },
  'the-cradle': {
    name: 'The Cradle',
    desc: 'High above the Citadel: slender golden spires rising through clouds, silk threads rising to the stars.',
    draw(c) {
      sky(c, ['#0e0b1c', '#33264e', '#b8806a']);
      stars(c, { n: 90, maxY: 340 });
      disc(c, { x: 800, y: 540, r: 70, color: '#ffe8b8', halo: '#ffc890', op: 0.5 });
      ridge(c, { base: 640, amp: 80, color: '#6a4a5a', top: '#e8b892', style: 'hills' });
      towers(c, { n: 9, color: '#2a1c36', y: 700, hmin: 220, hmax: 520, spire: true, wmin: 22, wmax: 44 });
      fog(c, { y: 560, h: 240, color: '#ffd8b8', op: 0.3 });
      silk(c, { n: 5, color: '#ffe4b8', op: 0.7 });
      particles(c, { n: 60, color: '#fff0d0', rmin: 1, rmax: 2.4, op: 0.8, y0: 100, y1: 700, glowy: true });
    },
  },
  'the-abyss': {
    name: 'The Abyss',
    desc: 'The void-soaked depths: dark tentacles rising from below, pale motes drifting in black water.',
    draw(c) {
      sky(c, ['#030306', '#0a0a14', '#161628']);
      glow(c, { x: 800, y: 820, r: 700, color: '#8aa0ff', op: 0.3 });
      tentacles(c, { n: 7, color: '#0c0c1c', hi: '#b8c4ff' });
      tentacles(c, { n: 5, color: '#050509', hi: '#6a78d0' });
      particles(c, { n: 130, color: '#e8ecff', rmin: 0.8, rmax: 2.6, op: 0.8, y0: 60, y1: 840, glowy: true });
      fog(c, { y: 600, h: 260, color: '#6a78d0', op: 0.14 });
    },
  },
};

// ------------------------------------------------------------------ the pages

// One quiet picture per page that is not a Region page. They are shown very faint and blurred, so they are
// shapes and colour more than detail.
const PAGES = {
  home: {
    name: 'Home',
    desc: 'A far view of the whole kingdom: layered ridges, a distant citadel and a silk thread across the dusk.',
    draw(c) {
      sky(c, ['#150b17', '#3a1d33', '#9a4a3a']);
      disc(c, { x: 1120, y: 360, r: 46, color: '#ffd9a0', halo: '#ff9a68', op: 0.5 });
      towers(c, { n: 7, color: '#2a1424', y: 560, hmin: 140, hmax: 320, spire: true, wmin: 22, wmax: 50 });
      ridge(c, { base: 560, amp: 140, color: '#3a1d2d', top: '#7a3f48', style: 'jagged' });
      ridge(c, { base: 660, amp: 110, color: '#241020', top: '#4a2434', style: 'hills' });
      ridge(c, { base: 760, amp: 80, color: '#140a14', style: 'hills' });
      silk(c, { n: 4, op: 0.7 });
      particles(c, { n: 50, color: '#ffc8a0', rmin: 1, rmax: 2.4, op: 0.6, y0: 120, y1: 700 });
    },
  },
  route: {
    name: 'Route',
    desc: 'A winding path of silk across dark hills, with a bead marking each stop.',
    draw(c) {
      sky(c, ['#110b16', '#2a1a2e', '#4a2e3a']);
      ridge(c, { base: 540, amp: 150, color: '#2b1a2b', top: '#4e3040', style: 'hills' });
      ridge(c, { base: 680, amp: 120, color: '#1a0f1b', top: '#33202e', style: 'hills' });
      const path = 'M-20,820C300,820 360,620 700,640S1100,500 1300,420S1560,300 1640,260';
      c.add(`<path d="${path}" stroke="#ec555b" stroke-width="3" fill="none" opacity="0.8"/>`);
      const beads = [[240, 770], [620, 640], [980, 560], [1300, 420], [1500, 330]];
      c.add(`<g fill="#130b13" stroke="#f2e9d8" stroke-width="3">${beads.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join('')}</g>`);
      particles(c, { n: 40, color: '#f2d4c0', rmin: 1, rmax: 2.2, op: 0.5, y0: 100, y1: 700 });
    },
  },
  trackers: {
    name: 'Trackers',
    desc: 'Rows of beads and knots on threads, like a collection laid out to count.',
    draw(c) {
      sky(c, ['#0f0b16', '#201830', '#352a48']);
      for (let row = 0; row < 6; row++) {
        const y = 150 + row * 110;
        c.add(`<path d="M-20,${y}H${W + 20}" stroke="#8a6471" stroke-width="2" opacity="0.7"/>`);
        const items = [];
        for (let i = 0; i < 18; i++) {
          const x = 60 + i * 86 + c.rand(-10, 10), done = c.r() > 0.45;
          items.push(c.r() > 0.7
            ? `<rect x="${f(x - 8)}" y="${y - 8}" width="16" height="16" transform="rotate(45 ${f(x)} ${y})" fill="${done ? '#d9a650' : '#130b13'}" stroke="#d9a650" stroke-width="2.5"/>`
            : `<circle cx="${f(x)}" cy="${y}" r="10" fill="${done ? '#d9a650' : '#130b13'}" stroke="${done ? '#d9a650' : '#f2e9d8'}" stroke-width="2.5"/>`);
        }
        c.add(`<g opacity="0.85">${items.join('')}</g>`);
      }
      glow(c, { x: 800, y: 460, r: 760, color: '#a98cff', op: 0.18 });
    },
  },
  rosaries: {
    name: 'Rosaries',
    desc: 'Strings of round beads hanging in loops over a dark red field, a few catching the light.',
    draw(c) {
      sky(c, ['#14090f', '#331423', '#5a2230']);
      glow(c, { x: 800, y: 460, r: 760, color: '#ffb06a', op: 0.22 });
      for (let k = 0; k < 6; k++) {
        const x0 = c.rand(-100, 700), x1 = x0 + c.rand(700, 1400), sag = c.rand(180, 420), y0 = c.rand(60, 260);
        const d = `M${f(x0)},${f(y0)}Q${f((x0 + x1) / 2)},${f(y0 + sag * 2)} ${f(x1)},${f(y0)}`;
        c.add(`<path d="${d}" stroke="#8a6471" stroke-width="2" fill="none" opacity="0.7"/>`);
        const beads = [];
        for (let i = 1; i < 26; i++) {
          const t = i / 26, u = 1 - t;
          const bx = u * u * x0 + 2 * u * t * ((x0 + x1) / 2) + t * t * x1, by = u * u * y0 + 2 * u * t * (y0 + sag * 2) + t * t * y0;
          beads.push(`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(c.rand(7, 12))}" fill="${c.r() > 0.2 ? '#7a2a2e' : '#e0a853'}" opacity="0.85"/>`);
        }
        c.add(`<g>${beads.join('')}</g>`);
      }
      particles(c, { n: 40, color: '#ffd0a0', rmin: 1, rmax: 2.4, op: 0.6, y0: 100, y1: 760 });
    },
  },
  builds: {
    name: 'Builds',
    desc: 'A great needle threaded with silk over a loom of crossing threads, with crest-shaped medallions.',
    draw(c) {
      sky(c, ['#0f0a14', '#231530', '#3d2448']);
      glow(c, { x: 800, y: 440, r: 720, color: '#ec555b', op: 0.2 });
      for (let i = 0; i < 24; i++) c.add(`<path d="M${i * 70},0L${i * 70 + c.rand(-30, 30)},${H}" stroke="#8a6471" stroke-width="1.5" opacity="0.4"/>`);
      for (let i = 0; i < 12; i++) c.add(`<path d="M0,${i * 80 + 40}H${W}" stroke="#8a6471" stroke-width="1.5" opacity="0.28"/>`);
      c.add(`<path d="M300,780L1300,140" stroke="#d9cdb8" stroke-width="7" stroke-linecap="round"/><ellipse cx="1290" cy="148" rx="9" ry="24" transform="rotate(37 1290 148)" fill="#130b13" stroke="#d9cdb8" stroke-width="4"/>`);
      c.add(`<path d="M1290,150C1100,420 900,300 700,560S420,700 300,780" stroke="#ec555b" stroke-width="3" fill="none" opacity="0.9"/>`);
      for (const [x, y, r] of [[420, 260, 70], [1180, 620, 90], [820, 200, 50]]) {
        c.add(`<path d="M${x},${y - r}L${x + r * 0.8},${y - r * 0.3}L${x + r * 0.5},${y + r * 0.8}L${x},${y + r}L${x - r * 0.5},${y + r * 0.8}L${x - r * 0.8},${y - r * 0.3}Z" fill="#1a1024" stroke="#d9a650" stroke-width="3" opacity="0.8"/>`);
      }
      particles(c, { n: 40, color: '#ffc8c0', rmin: 1, rmax: 2.2, op: 0.5, y0: 100, y1: 760 });
    },
  },
  goal: {
    name: 'Goal',
    desc: 'A single tall spire in the distance with a silk thread running straight toward it across a dark plain.',
    draw(c) {
      sky(c, ['#0e0a16', '#2a1a36', '#6a3a44']);
      stars(c, { n: 60, maxY: 300 });
      disc(c, { x: 800, y: 330, r: 36, color: '#ffe4b8', halo: '#ffb088', op: 0.6 });
      ridge(c, { base: 600, amp: 80, color: '#2a1626', top: '#5a3040', style: 'hills' });
      c.add(`<path d="M780,620L800,170L820,620Z" fill="#150a14"/><path d="M786,170L800,90L814,170Z" fill="#150a14"/>`);
      ridge(c, { base: 700, amp: 70, color: '#160a14', style: 'hills' });
      c.add(`<path d="M-20,880C400,800 700,720 800,610" stroke="#ec555b" stroke-width="3" fill="none" opacity="0.85"/><path d="M1620,880C1200,800 900,720 800,610" stroke="#ec555b" stroke-width="3" fill="none" opacity="0.85"/>`);
      c.add(`<circle cx="800" cy="610" r="7" fill="#ec555b"/>`);
      particles(c, { n: 40, color: '#ffd0b0', rmin: 1, rmax: 2.2, op: 0.55, y0: 100, y1: 700 });
    },
  },
  account: {
    name: 'Account',
    desc: 'A quiet doorway with a hanging lantern and a bell on a thread, warm light on a dark wall.',
    draw(c) {
      sky(c, ['#120c14', '#271a26', '#432a30']);
      glow(c, { x: 800, y: 460, r: 560, color: '#ffc080', op: 0.4 });
      c.add(`<path d="M600,${H}L600,380A200,200 0 0 1 1000,380L1000,${H}Z" fill="#ffd9a0" opacity="0.16"/>`);
      c.add(`<path d="M560,${H}L560,370A240,240 0 0 1 1040,370L1040,${H}L1000,${H}L1000,380A200,200 0 0 0 600,380L600,${H}Z" fill="#150c13"/>`);
      bell(c, { x: 800, y: 210, s: 1.2, color: '#c99a4a', shine: '#fff0b8' });
      lamps(c, { n: 2, y: 330, post: undefined });
      ridge(c, { base: 800, amp: 40, color: '#0b0609', style: 'flat' });
      silk(c, { n: 3, op: 0.6 });
      particles(c, { n: 40, color: '#ffe0b0', rmin: 1, rmax: 2.4, op: 0.6, y0: 100, y1: 760, glowy: true });
    },
  },
  locked: {
    name: 'Locked region',
    desc: 'A great shut gate bound with chains and a knotted thread, in cold dark stone. It shows nothing of what lies behind.',
    draw(c) {
      sky(c, ['#0d0b12', '#1a1722', '#2a2634']);
      glow(c, { x: 800, y: 480, r: 620, color: '#8a6471', op: 0.2 });
      ridge(c, { base: 560, amp: 90, color: '#1a1622', top: '#2e2838', style: 'jagged' });
      c.add(`<path d="M520,${H}L520,330A280,280 0 0 1 1080,330L1080,${H}Z" fill="#100d16" stroke="#3a3446" stroke-width="6"/>`);
      c.add(`<path d="M800,${H}L800,60" stroke="#2a2634" stroke-width="8"/>`);
      for (let i = 0; i < 6; i++) c.add(`<path d="M${560 + i * 96},${H}L${560 + i * 96},${330 + (i % 3) * 20}" stroke="#2a2634" stroke-width="3"/>`);
      c.add(`<path d="M470,470L1130,640M1130,470L470,640" stroke="#6a5a66" stroke-width="9" stroke-dasharray="26 12"/>`);
      c.add(`<circle cx="800" cy="555" r="34" fill="#130b13" stroke="#8a6471" stroke-width="4"/><path d="M788,555a12,12 0 1 1 24,0" stroke="#8a6471" stroke-width="4" fill="none"/>`);
      pillars(c, { n: 2, color: '#0b0910', y0: 120, y1: H, w: 120 });
      fog(c, { y: 600, h: 220, color: '#8a8aa0', op: 0.12 });
      particles(c, { n: 30, color: '#c8c0d4', rmin: 1, rmax: 2, op: 0.4, y0: 160, y1: 760 });
    },
  },
  default: {
    name: 'Guide background',
    desc: 'A quiet dusk landscape with a single silk thread crossing dark hills, used wherever a page has no picture of its own.',
    draw(c) {
      sky(c, ['#120b16', '#2c1a30', '#5a3040']);
      stars(c, { n: 40, maxY: 280 });
      disc(c, { x: 1060, y: 400, r: 30, color: '#ffe0b0', halo: '#ff9a68', op: 0.4 });
      ridge(c, { base: 560, amp: 130, color: '#2a1626', top: '#5a3444', style: 'hills' });
      ridge(c, { base: 680, amp: 100, color: '#190d1a', top: '#34202e', style: 'hills' });
      ridge(c, { base: 780, amp: 70, color: '#0e070f', style: 'hills' });
      silk(c, { n: 4, op: 0.7 });
      particles(c, { n: 40, color: '#ffd0b0', rmin: 1, rmax: 2.2, op: 0.55, y0: 120, y1: 700 });
    },
  },
};

// ------------------------------------------------------------------ writing the files

function render(id, spec, light = false) {
  const c = new Canvas(id);
  spec.draw(c);
  silk(c, { n: 2, op: 0.4 });
  vignette(c, light);
  return c.toSvg(spec.name, spec.desc);
}

function writeAll(folder, specs, light = false) {
  fs.mkdirSync(path.join(root, folder), { recursive: true });
  for (const [id, spec] of Object.entries(specs)) {
    const file = path.join(root, folder, `${id}.svg`);
    fs.writeFileSync(file, render(id, spec, light));
  }
  return Object.keys(specs).length;
}

const regions = writeAll('img/regions', REGIONS);
const pages = writeAll('img/backdrop', PAGES, true);
console.log(`Wrote ${regions} Region pictures (img/regions) and ${pages} page backdrops (img/backdrop).`);
