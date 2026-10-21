// Contrast check for the Goal pairings (WCAG 2.x relative luminance). Run: node docs/design/goal/_contrast.mjs
// Tokens are read from the DESIGN.md table, not changed. Translucent fills are blended over what is behind them.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (fg, bg, a) => fg.map((v, i) => Math.round(v * a + bg[i] * (1 - a)));
const night = hex('#130B13'), lacquer = hex('#1F111C'), ivory = hex('#F2E9D8'), ash = hex('#B7A3A6');
const silk = hex('#EC555B'), bronze = hex('#D9A650'), thread = hex('#8A6471');
const plateTop = hex('#22121D'), plateBottom = hex('#1A0E17');
const nextFill = mix(silk, night, 0.07);              // pressed control and the "next" row, over the page background
const pressedOnNextPlate = mix(silk, nextFill, 0.07); // pressed control (7% silk) inside a 7% silk plate
const rows = [
  ['Control label, not pressed (ivory) on page', ivory, night, 4.5],
  ['Control label, not pressed (ivory) on Next plate', ivory, nextFill, 4.5],
  ['Control label, hover (silk) on page', silk, night, 4.5],
  ['Control label, hover (silk) on Next plate', silk, nextFill, 4.5],
  ['Control label, pressed (ivory) on page fill', ivory, nextFill, 4.5],
  ['Control label, pressed (ivory) inside Next plate', ivory, pressedOnNextPlate, 4.5],
  ['Control border, not pressed (thread, dashed) on page', thread, night, 3],
  ['Control border, not pressed (thread, dashed) on Next plate', thread, nextFill, 3],
  ['Control border, pressed (silk, solid) on page', silk, night, 3],
  ['Control border, pressed (silk, solid) on Next plate', silk, nextFill, 3],
  ['Control icon, not pressed (ivory) on page', ivory, night, 3],
  ['Control icon, pressed (silk filled) on pressed fill', silk, nextFill, 3],
  ['Available now / Your goal flag (silk, 13px) on page', silk, night, 4.5],
  ['Available now flag (silk, 13px) on the stitched row', silk, nextFill, 4.5],
  ['Needs line (silk, 14px) on page', silk, night, 4.5],
  ['Done label (bronze, 14px) on lacquer', bronze, lacquer, 4.5],
  ['Done plate border (bronze) on lacquer', bronze, lacquer, 3],
  ['Rail and plate help text (ash) on plate, light end', ash, plateTop, 4.5],
  ['Rail and plate help text (ash) on plate, dark end', ash, plateBottom, 4.5],
  ['Goal name and Region link (ivory) on plate', ivory, plateTop, 4.5],
  ['Available now label (silk, 14px) on plate', silk, plateTop, 4.5],
];
let fail = 0;
for (const [what, fg, bg, min] of rows) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2)}:1 (need ${min})  ${what}`);
}
console.log(fail ? `${fail} pair(s) fail` : 'all pass');
