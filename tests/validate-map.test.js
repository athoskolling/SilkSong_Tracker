// Tests for validator rule 17 (map.json), written against docs/MAP-PROPOSAL.md ("Validator rule 17").
// Same method as tests/validate-data.test.js: copy data/sample into a temp folder, add a map.json built here,
// break one thing on purpose, and assert that exactly that rule fires. The real data/ folder is never read,
// and the picture files are tiny stand-ins written into a temp site root.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validate, formatProblem, REPO_ROOT } from '../scripts/validate-data.js';

const SAMPLE = fileURLToPath(new URL('../data/sample/', import.meta.url));

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

const sampleDoc = JSON.parse(readFileSync(path.join(SAMPLE, 'regions.json'), 'utf8'));
const REGION_IDS = sampleDoc.regions.map((r) => r.id);

// A good map.json for the sample's Regions: every Region has a picture and a box inside a 400 x 300 full map.
function goodMap() {
  return {
    dataVersion: sampleDoc.dataVersion,
    full: { image: 'img/map/full.png', width: 400, height: 300, alt: 'Map of the sample world.', credit: 'Invented sample.' },
    regions: REGION_IDS.map((regionId, i) => ({
      regionId,
      image: `img/map/${regionId}.png`,
      width: 100,
      height: 80,
      box: [i * 10, 0, i * 10 + 100, 80],
    })),
  };
}

// A temp copy of the sample, with `change` applied to a good map.json and stand-in pictures for every path it names.
function withMap(change, { makeFiles = true } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'validate-map-'));
  const site = mkdtempSync(path.join(tmpdir(), 'validate-map-site-'));
  tempDirs.push(dir, site);
  cpSync(SAMPLE, dir, { recursive: true });
  // The sample's Regions have hero images of their own (rule 8), so those files go into the temp site too.
  for (const region of sampleDoc.regions) {
    if (!region.heroImage) continue;
    const from = path.join(REPO_ROOT, region.heroImage);
    if (!existsSync(from)) continue;
    mkdirSync(path.dirname(path.join(site, region.heroImage)), { recursive: true });
    cpSync(from, path.join(site, region.heroImage));
  }
  const json = goodMap();
  if (makeFiles) {
    mkdirSync(path.join(site, 'img', 'map'), { recursive: true });
    for (const image of [json.full.image, ...json.regions.map((r) => r.image)]) writeFileSync(path.join(site, image), 'x');
  }
  change(json);
  writeFileSync(path.join(dir, 'map.json'), JSON.stringify(json, null, 2));
  return validate(dir, { siteRoot: site });
}

function assertOnlyRule(result, rule, text) {
  const detail = result.errors.map(formatProblem).join('\n');
  assert.ok(result.errors.length > 0, 'expected at least one error');
  assert.deepEqual([...new Set(result.errors.map((e) => e.rule))], [rule], `errors were:\n${detail}`);
  assert.ok(result.errors.every((e) => e.file === 'map.json'), `every error should name map.json:\n${detail}`);
  if (text) assert.ok(result.errors.some((e) => e.message.includes(text)), `no error mentions "${text}":\n${detail}`);
}

test('rule 17: a good map.json gives no error and no warning', () => {
  const result = withMap(() => {});
  assert.deepEqual(result.errors.map(formatProblem), []);
  assert.deepEqual(result.warnings.map(formatProblem), []);
});

test('rule 17: a folder with no map.json gives no message (the file is optional)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'validate-map-'));
  tempDirs.push(dir);
  cpSync(SAMPLE, dir, { recursive: true });
  rmSync(path.join(dir, 'map.json'), { force: true });
  const result = validate(dir);
  assert.deepEqual(result.errors.map(formatProblem), []);
  assert.deepEqual(result.warnings.map(formatProblem), []);
});

test('rule 1: map.json with another dataVersion is an error', () => {
  const result = withMap((json) => {
    json.dataVersion = 99;
  });
  const detail = result.errors.map(formatProblem).join('\n');
  assert.deepEqual([...new Set(result.errors.map((e) => e.rule))], [1], detail);
  assert.ok(result.errors.some((e) => e.file === 'map.json'), detail);
});

const MAP_ERRORS = [
  ['no "full" object', (j) => delete j.full, '"full" must be an object'],
  ['a missing "regions" list', (j) => delete j.regions, 'array named "regions"'],
  ['a full map with no credit', (j) => delete j.full.credit, '"credit"'],
  ['a full map with no alt', (j) => delete j.full.alt, '"alt"'],
  ['a full map with no width', (j) => delete j.full.width, '"width"'],
  ['a full map with a decimal height', (j) => (j.full.height = 300.5), '"height"'],
  ['a map for a Region that does not exist', (j) => (j.regions[0].regionId = 'no-such-region'), 'not a Region'],
  ['two maps for one Region', (j) => (j.regions[1].regionId = j.regions[0].regionId), 'two maps'],
  ['an image that is not a file', (j) => (j.regions[0].image = 'img/map/nothing-here.png'), 'not a file'],
  ['an image path with a leading slash', (j) => (j.regions[0].image = '/img/map/full.png'), 'slash'],
  ['an image path that goes up', (j) => (j.regions[0].image = '../img/map/full.png'), '".."'],
  ['an image with the wrong extension', (j) => (j.regions[0].image = 'img/map/full.gif'), '.png, .jpg, .webp, .svg'],
  ['a box with three numbers', (j) => (j.regions[0].box = [0, 0, 10]), '"box"'],
  ['a box with a decimal', (j) => (j.regions[0].box = [0, 0, 10.5, 10]), '"box"'],
  ['a box whose right edge is left of its left edge', (j) => (j.regions[0].box = [50, 0, 10, 80]), 'larger than them'],
  ['a box with a negative left', (j) => (j.regions[0].box = [-1, 0, 10, 80]), '0 or more'],
  ['a box that reaches past the full picture', (j) => (j.regions[0].box = [0, 0, 401, 80]), 'outside the full picture'],
  ['a Region picture with no width', (j) => delete j.regions[0].width, '"width"'],
];
for (const [name, change, text] of MAP_ERRORS) {
  test(`rule 17: ${name} is an error`, () => {
    assertOnlyRule(withMap(change), 17, text);
  });
}

test('rule 17: a Region with no map is a warning, not an error', () => {
  const result = withMap((json) => json.regions.pop());
  assert.deepEqual(result.errors.map(formatProblem), []);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].rule, 17);
  assert.match(result.warnings[0].message, new RegExp(REGION_IDS[REGION_IDS.length - 1]));
});
