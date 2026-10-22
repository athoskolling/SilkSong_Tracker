// Tests for validator rule 17 (map.json), written against docs/MAP-PROPOSAL.md ("Validator rule 17").
// Same method as tests/validate-data.test.js: copy data/sample into a temp folder, break one thing on
// purpose, and assert that exactly that rule fires. The real data/ folder is never read.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validate, formatProblem } from '../scripts/validate-data.js';

const SAMPLE = fileURLToPath(new URL('../data/sample/', import.meta.url));

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

// A copy of the sample whose map.json is changed by `change` (which edits the parsed file in place).
function withMap(change) {
  const dir = mkdtempSync(path.join(tmpdir(), 'validate-map-'));
  tempDirs.push(dir);
  cpSync(SAMPLE, dir, { recursive: true });
  const file = path.join(dir, 'map.json');
  const json = JSON.parse(readFileSync(file, 'utf8'));
  change(json);
  writeFileSync(file, JSON.stringify(json, null, 2));
  return validate(dir);
}

function assertOnlyRule(result, rule, text) {
  const detail = result.errors.map(formatProblem).join('\n');
  assert.ok(result.errors.length > 0, 'expected at least one error');
  assert.deepEqual([...new Set(result.errors.map((e) => e.rule))], [rule], `errors were:\n${detail}`);
  assert.ok(result.errors.every((e) => e.file === 'map.json'), `every error should name map.json:\n${detail}`);
  if (text) assert.ok(result.errors.some((e) => e.message.includes(text)), `no error mentions "${text}":\n${detail}`);
}

test('rule 17: the untouched sample map gives no error and no warning', () => {
  const result = withMap(() => {});
  assert.deepEqual(result.errors.map(formatProblem), []);
  assert.deepEqual(result.warnings.map(formatProblem), []);
});

test('rule 17: a folder with no map.json gives no message (the file is optional)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'validate-map-'));
  tempDirs.push(dir);
  cpSync(SAMPLE, dir, { recursive: true });
  rmSync(path.join(dir, 'map.json'));
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
  ['a missing "maps" list', (j) => delete j.maps, 'array named "maps"'],
  ['a missing "pins" list', (j) => delete j.pins, 'array named "pins"'],
  ['a map for a Region that does not exist', (j) => (j.maps[0].regionId = 'no-such-region'), 'not a Region'],
  ['two maps for one Region', (j) => (j.maps[1].regionId = j.maps[0].regionId), 'two maps'],
  ['a map with no credit', (j) => delete j.maps[0].credit, '"credit"'],
  ['a map with no alt', (j) => delete j.maps[0].alt, '"alt"'],
  ['an image that is not a file', (j) => (j.maps[0].image = 'img/map/nothing-here.svg'), 'not a file'],
  ['an image path with a leading slash', (j) => (j.maps[0].image = '/img/map/sample-region-a.svg'), 'slash'],
  ['an image path that goes up', (j) => (j.maps[0].image = '../img/map/sample-region-a.svg'), '".."'],
  ['an image with the wrong extension', (j) => (j.maps[0].image = 'img/map/sample-region-a.gif'), '.jpg, .png or .svg'],
  ['a Pin for an entry that does not exist', (j) => (j.pins[0].itemId = 'no-such-entry'), 'not an entry'],
  ['two Pins for one entry', (j) => (j.pins[1].itemId = j.pins[0].itemId), 'two Pins'],
  ['a Pin x below 0', (j) => (j.pins[0].x = -1), '"x"'],
  ['a Pin y above 100', (j) => (j.pins[0].y = 100.5), '"y"'],
  ['a Pin x that is text', (j) => (j.pins[0].x = '40'), '"x"'],
  ['a Pin with no y', (j) => delete j.pins[0].y, '"y"'],
];
for (const [name, change, text] of MAP_ERRORS) {
  test(`rule 17: ${name} is an error`, () => {
    assertOnlyRule(withMap(change), 17, text);
  });
}

test('rule 17: the edge values 0 and 100 are allowed', () => {
  const result = withMap((json) => {
    json.pins[0].x = 0;
    json.pins[0].y = 100;
  });
  assert.deepEqual(result.errors.map(formatProblem), []);
});

test('rule 17: a Pin on a Region with no map is a warning, not an error', () => {
  // sample-boss is in sample-region-b; dropping that Region's map leaves its Pins with nowhere to be drawn.
  const result = withMap((json) => {
    json.maps = json.maps.filter((map) => map.regionId !== 'sample-region-b');
  });
  assert.deepEqual(result.errors.map(formatProblem), []);
  const warned = result.warnings.filter((w) => w.rule === 17);
  assert.equal(warned.length, 2, result.warnings.map(formatProblem).join('\n'));
  assert.ok(warned.every((w) => w.file === 'map.json' && /no map/.test(w.message)));
});
