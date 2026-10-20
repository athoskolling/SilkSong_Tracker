// Contrast check for the P5-31 pairings (WCAG 2.x relative luminance). Run: node docs/design/trackers/_contrast-places.mjs
// Tokens are read from the DESIGN.md table, not changed. Translucent fills are blended over the page background.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (fg, bg, a) => fg.map((v, i) => Math.round(v * a + bg[i] * (1 - a)));

const night = hex('#130B13'), lacquer = hex('#1F111C'), ivory = hex('#F2E9D8'), ash = hex('#B7A3A6');
const silk = hex('#EC555B'), bronze = hex('#D9A650'), thread = hex('#8A6471');
const plateTop = hex('#22121D'), plateBottom = hex('#1A0E17');
const nextFill = mix(silk, night, 0.07); // callout / next plate / target row over the page background
const targetOnPlate = mix(silk, plateTop, 0.07);

const rows = [
  // [what, foreground, background, minimum]
  ['Place name, shop stock name (ivory) on plate', ivory, plateTop, 4.5],
  ['Place how, meta, help text (ash) on plate (lighter end)', ash, plateTop, 4.5],
  ['Place how, meta, help text (ash) on plate (darker end)', ash, plateBottom, 4.5],
  ['Needs X (silk) on plate', silk, plateTop, 4.5],
  ['Bought and Ready dot (bronze) on plate', bronze, plateTop, 4.5],
  ['Bought, bought stock price (ash) on plate', ash, plateTop, 4.5],
  ['Highlighted Place row: ash on target fill', ash, targetOnPlate, 4.5],
  ['Highlighted Place row: ivory on target fill', ivory, targetOnPlate, 4.5],
  ['Sold by line (ash) on page background', ash, night, 4.5],
  ['Sold by link (ivory) on page background', ivory, night, 4.5],
  ['Sold by line (ash) in Next to buy plate', ash, nextFill, 4.5],
  ['Template card: name and contents (ivory) on lacquer', ivory, lacquer, 4.5],
  ['Template card: goal, labels, tags (ash) on lacquer', ash, lacquer, 4.5],
  ['Template card: Needs lines (silk) on lacquer', silk, lacquer, 4.5],
  ['Template card: Ready dot (bronze) on lacquer, non-text 3:1', bronze, lacquer, 3],
  ['Template card: hollow dot ring (silk) on lacquer, non-text 3:1', silk, lacquer, 3],
  ['Template card: dashed dot ring (ash) on lacquer, non-text 3:1', ash, lacquer, 3],
  ['Use as my Build button border-and-text (ivory 60% border) on lacquer, non-text 3:1', mix(ivory, lacquer, 0.6), lacquer, 3],
  ['Replace/Keep box title (silk) on callout fill', silk, nextFill, 4.5],
  ['Replace/Keep box text (ivory) on callout fill', ivory, nextFill, 4.5],
  ['Synergy pair name (ivory) on plate', ivory, plateTop, 4.5],
  ['Synergy effect and note (ash) on plate', ash, plateTop, 4.5],
  ['Mock note text (ash) on night', ash, night, 4.5],
  ['Focus ring (silk) on page background, non-text 3:1', silk, night, 3],
  ['Focus ring (silk) on lacquer, non-text 3:1', silk, lacquer, 3],
  ['Focus ring (silk) on plate, non-text 3:1', silk, plateTop, 3],
  ['Tag outline, plate and card borders (decoration; thread on lacquer)', thread, lacquer, 3],
];

let fails = 0;
for (const [what, fg, bg, min] of rows) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fails++;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (need ${min})  ${what}`);
}
console.log(fails ? `${fails} pairing(s) below the target` : 'all pairings meet their target');
