// Tests for scripts/validate-data.js, written against docs/CONTRACTS.md section 6.
// Each rule test copies data/sample into a temp folder, breaks one thing on purpose and asserts
// that exactly that rule fires (and that the error names the file and the id). The real data/
// folder is never read, so a content change cannot break these tests.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { validate, formatProblem } from '../scripts/validate-data.js';

const SAMPLE = fileURLToPath(new URL('../data/sample/', import.meta.url));
const SCRIPT = fileURLToPath(new URL('../scripts/validate-data.js', import.meta.url));

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

function tempFolder() {
  const dir = mkdtempSync(path.join(tmpdir(), 'validate-data-'));
  tempDirs.push(dir);
  return dir;
}

function copySample() {
  const dir = tempFolder();
  cpSync(SAMPLE, dir, { recursive: true });
  return dir;
}

// Edits one JSON file in a copy. `change` receives the parsed file and changes it in place.
function edit(dir, file, change) {
  const filePath = path.join(dir, file);
  const json = JSON.parse(readFileSync(filePath, 'utf8'));
  change(json);
  writeFileSync(filePath, JSON.stringify(json, null, 2));
}

const byId = (list, id) => list.find((record) => record.id === id);
const entry = (json, id) => byId(json.items, id);
const region = (json, id) => byId(json.regions, id);
const ending = (json, id) => byId(json.endings, id);

// Asserts that the broken copy produces errors of exactly one rule, and that one of them names
// the file and (when given) the id.
function assertOnlyRule(result, rule, { file, id } = {}) {
  const detail = result.errors.map(formatProblem).join('\n');
  assert.ok(result.errors.length > 0, 'expected at least one error');
  assert.deepEqual([...new Set(result.errors.map((e) => e.rule))], [rule], `errors were:\n${detail}`);
  if (file !== undefined) {
    const named = result.errors.some((e) => e.file === file && (id === undefined || e.id === id));
    assert.ok(named, `no error names file ${file}${id === undefined ? '' : ` and id ${id}`}:\n${detail}`);
  }
}

// ------------------------------------------------------------------ the sample itself

test('the untouched sample passes with no errors and no warnings', () => {
  const result = validate(SAMPLE);
  assert.deepEqual(result.errors.map(formatProblem), []);
  assert.deepEqual(result.warnings.map(formatProblem), []);
});

// ------------------------------------------------------------------ rule 1: files and dataVersion

test('rule 1: a file that is not valid JSON is named', () => {
  const dir = copySample();
  writeFileSync(path.join(dir, 'items.json'), '{ "dataVersion": 1, ');
  assertOnlyRule(validate(dir), 1, { file: 'items.json' });
});

test('rule 1: a missing file is named (and nothing else fires)', () => {
  const dir = copySample();
  rmSync(path.join(dir, 'endings.json'));
  assertOnlyRule(validate(dir), 1, { file: 'endings.json' });
});

test('rule 1: a dataVersion that differs from the other files', () => {
  const dir = copySample();
  edit(dir, 'endings.json', (json) => {
    json.dataVersion = 2;
  });
  assertOnlyRule(validate(dir), 1, { file: 'endings.json' });
});

test('rule 1: a file with no dataVersion', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete json.dataVersion;
  });
  assertOnlyRule(validate(dir), 1, { file: 'items.json' });
});

test('rule 1: a dataVersion that is text, not an integer', () => {
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    json.dataVersion = '1';
  });
  assertOnlyRule(validate(dir), 1, { file: 'regions.json' });
});

test('rule 1: all three files share the same text dataVersion, so each one is still named', () => {
  // Equal values would pass the "same version" comparison, so only the integer check can catch this.
  const dir = copySample();
  for (const file of ['regions.json', 'items.json', 'endings.json']) {
    edit(dir, file, (json) => {
      json.dataVersion = '1';
    });
  }
  const result = validate(dir);
  assertOnlyRule(result, 1);
  assert.deepEqual(result.errors.map((e) => e.file).sort(), ['endings.json', 'items.json', 'regions.json']);
});

// ------------------------------------------------------------------ rule 2: slugs and unique ids

test('rule 2: an entry with no id is named by its position', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-shard-two').id; // nothing refers to it, so only rule 2 can fire
  });
  const result = validate(dir);
  assertOnlyRule(result, 2, { file: 'items.json' });
  assert.ok(result.errors.some((e) => e.position === 'entry number 13'), 'the position names entry number 13');
});

for (const badId of ['Sample Shard', 'sample_shard', 'Sample-Shard', 'sample--shard', '-sample-shard']) {
  test(`rule 2: the id "${badId}" is not a lowercase slug`, () => {
    const dir = copySample();
    edit(dir, 'items.json', (json) => {
      entry(json, 'sample-shard-two').id = badId;
    });
    assertOnlyRule(validate(dir), 2, { file: 'items.json', id: badId });
  });
}

test('rule 2: the same id used twice in items.json', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-flea').id = 'sample-crest'; // sample-quest still refers to sample-crest: the first one
  });
  assertOnlyRule(validate(dir), 2, { file: 'items.json', id: 'sample-crest' });
});

test('rule 2: an entry id that is already a Region id in regions.json', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-shard-two').id = 'sample-region-c'; // no entry refers to sample-shard-two
  });
  assertOnlyRule(validate(dir), 2, { file: 'items.json', id: 'sample-region-c' });
});

// ------------------------------------------------------------------ rule 3: references

test('rule 3: requires names an id that does not exist', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').requires = ['ghost-entry'];
  });
  assertOnlyRule(validate(dir), 3, { file: 'items.json', id: 'sample-key' });
});

test('rule 3: requires names a Region id, which is not an entry', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-flea').requires = ['sample-region-a'];
  });
  const result = validate(dir);
  assertOnlyRule(result, 3, { file: 'items.json', id: 'sample-flea' });
  assert.match(result.errors[0].message, /Region id/);
});

test('rule 3: a Region requires an Ending id, which is not an entry', () => {
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-c').requires = ['sample-ending-one'];
  });
  const result = validate(dir);
  assertOnlyRule(result, 3, { file: 'regions.json', id: 'sample-region-c' });
  assert.match(result.errors[0].message, /Ending id/);
});

test('rule 3: a Region requires an id that does not exist', () => {
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-b').requires = ['ghost-entry'];
  });
  assertOnlyRule(validate(dir), 3, { file: 'regions.json', id: 'sample-region-b' });
});

test('rule 3: conditions names a Region id', () => {
  const dir = copySample();
  edit(dir, 'endings.json', (json) => {
    ending(json, 'sample-ending-one').conditions.push('sample-region-a');
  });
  const result = validate(dir);
  assertOnlyRule(result, 3, { file: 'endings.json', id: 'sample-ending-one' });
  assert.match(result.errors[0].message, /Region id/);
});

test('rule 3: conditions names an id that does not exist', () => {
  const dir = copySample();
  edit(dir, 'endings.json', (json) => {
    ending(json, 'sample-ending-two').conditions = ['ghost-entry'];
  });
  assertOnlyRule(validate(dir), 3, { file: 'endings.json', id: 'sample-ending-two' });
});

test('rule 3: regionId names an id that does not exist', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-shard').regionId = 'no-such-region';
  });
  assertOnlyRule(validate(dir), 3, { file: 'items.json', id: 'sample-shard' });
});

test('rule 3: regionId names an entry, not a Region', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-shard').regionId = 'sample-key';
  });
  assertOnlyRule(validate(dir), 3, { file: 'items.json', id: 'sample-shard' });
});

test('rule 3: an entry with no regionId is named', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-shard').regionId;
  });
  const result = validate(dir);
  assertOnlyRule(result, 3, { file: 'items.json', id: 'sample-shard' });
  assert.match(result.errors[0].message, /must be the id of a Region/);
});

// ------------------------------------------------------------------ rule 4: loops

test('rule 4: entries that require each other through a chain, named in order', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-ability').requires = ['sample-charm']; // charm -> shard -> door -> key -> ability
  });
  const result = validate(dir);
  assertOnlyRule(result, 4, { file: 'items.json' });
  assert.ok(
    result.errors.some((e) =>
      e.message.includes('sample-ability -> sample-charm -> sample-shard -> sample-door -> sample-key -> sample-ability')
    ),
    `the loop is spelled out:\n${result.errors.map(formatProblem).join('\n')}`
  );
});

test('rule 4: an entry that requires itself', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').requires = ['sample-key'];
  });
  const result = validate(dir);
  assertOnlyRule(result, 4, { file: 'items.json', id: 'sample-key' });
  assert.match(result.errors[0].message, /sample-key -> sample-key/);
});

test('rule 4: a Region that requires an entry inside itself is a loop', () => {
  // sample-shard is in sample-region-a, so every entry of that Region needs it, and it needs itself.
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-a').requires = ['sample-shard'];
  });
  const result = validate(dir);
  assertOnlyRule(result, 4);
  assert.ok(result.errors.some((e) => e.message.includes('sample-shard')));
});

// ------------------------------------------------------------------ rule 5: step

test('rule 5: two entries with the same step', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').step = 1; // sample-ability is step 1
  });
  assertOnlyRule(validate(dir), 5, { file: 'items.json', id: 'sample-key' });
});

test('rule 5: a step that is not an integer (2.5)', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').step = 2.5;
  });
  assertOnlyRule(validate(dir), 5, { file: 'items.json', id: 'sample-key' });
});

test('rule 5: a step that is text, not a number', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').step = '2';
  });
  assertOnlyRule(validate(dir), 5, { file: 'items.json', id: 'sample-key' });
});

test('rule 5: an entry with no step', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-lever').step;
  });
  assertOnlyRule(validate(dir), 5, { file: 'items.json', id: 'sample-lever' });
});

// ------------------------------------------------------------------ rule 6: kind and missable

test('rule 6: a kind that is neither collectible nor task', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').kind = 'boss';
  });
  assertOnlyRule(validate(dir), 6, { file: 'items.json', id: 'sample-key' });
});

test('rule 6: missable is true with no missableNote', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').missable = true;
  });
  assertOnlyRule(validate(dir), 6, { file: 'items.json', id: 'sample-key' });
});

test('rule 6: missable is true with an empty missableNote', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    Object.assign(entry(json, 'sample-key'), { missable: true, missableNote: '' });
  });
  assertOnlyRule(validate(dir), 6, { file: 'items.json', id: 'sample-key' });
});

test('rule 6: missable is not true or false', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').missable = 'yes';
  });
  assertOnlyRule(validate(dir), 6, { file: 'items.json', id: 'sample-key' });
});

// ------------------------------------------------------------------ rule 7: name, how, source

test('rule 7: an entry with no source', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-key').source;
  });
  assertOnlyRule(validate(dir), 7, { file: 'items.json', id: 'sample-key' });
});

test('rule 7: an entry with an empty how', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').how = '';
  });
  assertOnlyRule(validate(dir), 7, { file: 'items.json', id: 'sample-key' });
});

test('rule 7: an entry with no how at all', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-key').how;
  });
  assertOnlyRule(validate(dir), 7, { file: 'items.json', id: 'sample-key' });
});

test('rule 7: an entry with an empty name', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').name = '   ';
  });
  assertOnlyRule(validate(dir), 7, { file: 'items.json', id: 'sample-key' });
});

test('rule 7: a source that is not a web link', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').source = 'the wiki page about keys';
  });
  assertOnlyRule(validate(dir), 7, { file: 'items.json', id: 'sample-key' });
});

// ------------------------------------------------------------------ rule 8: hero images

test('rule 8: heroImage is set but heroCredit is missing', () => {
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    delete region(json, 'sample-region-a').heroCredit;
  });
  assertOnlyRule(validate(dir), 8, { file: 'regions.json', id: 'sample-region-a' });
});

test('rule 8: heroImage does not end in .jpg or .png (the file exists, so only the extension is wrong)', () => {
  // Without the file, the existence check would fire too and hide whether the extension check works.
  const dir = copySample();
  const site = tempFolder();
  mkdirSync(path.join(site, 'img', 'regions'), { recursive: true });
  writeFileSync(path.join(site, 'img', 'regions', 'hero.gif'), 'not really an image');
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-a').heroImage = 'img/regions/hero.gif';
  });
  assertOnlyRule(validate(dir, { siteRoot: site }), 8, { file: 'regions.json', id: 'sample-region-a' });
});

test('rule 8: heroImage names a file that is not in the site', () => {
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-a').heroImage = 'img/regions/no-such-image.png';
  });
  assertOnlyRule(validate(dir), 8, { file: 'regions.json', id: 'sample-region-a' });
});

test('rule 8: heroImage starts with a slash', () => {
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-a').heroImage = '/img/regions/deep-docks.png';
  });
  assertOnlyRule(validate(dir), 8, { file: 'regions.json', id: 'sample-region-a' });
});

test('rule 8: heroImage goes up with ".." (the file exists, so only the ".." is wrong)', () => {
  const dir = copySample();
  const site = tempFolder();
  mkdirSync(path.join(site, 'img', 'regions'), { recursive: true });
  writeFileSync(path.join(site, 'img', 'regions', 'hero.jpg'), 'not really an image');
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-a').heroImage = 'img/regions/../regions/hero.jpg';
  });
  assertOnlyRule(validate(dir, { siteRoot: site }), 8, { file: 'regions.json', id: 'sample-region-a' });
});

test('rule 8: heroImage is looked up from the site root, not from the data folder', () => {
  const dir = copySample();
  const site = tempFolder(); // stands in for the repository root; it has no img/ folder
  mkdirSync(path.join(dir, 'img', 'regions'), { recursive: true });
  writeFileSync(path.join(dir, 'img', 'regions', 'hero.jpg'), 'not really an image');
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-a').heroImage = 'img/regions/hero.jpg';
  });
  assertOnlyRule(validate(dir, { siteRoot: site }), 8, { file: 'regions.json', id: 'sample-region-a' });
});

test('rule 8: the same heroImage passes when the file is in the site root', () => {
  const dir = copySample();
  const site = tempFolder();
  mkdirSync(path.join(site, 'img', 'regions'), { recursive: true });
  writeFileSync(path.join(site, 'img', 'regions', 'hero.jpg'), 'not really an image');
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-a').heroImage = 'img/regions/hero.jpg';
  });
  assert.deepEqual(validate(dir, { siteRoot: site }).errors, []);
});

// ------------------------------------------------------------------ rule 9: lockouts

test('rule 9: an ending locks itself out', () => {
  const dir = copySample();
  edit(dir, 'endings.json', (json) => {
    ending(json, 'sample-ending-two').locksOut = ['sample-ending-two'];
  });
  assertOnlyRule(validate(dir), 9, { file: 'endings.json', id: 'sample-ending-two' });
});

test('rule 9: locksOut names an ending that does not exist', () => {
  const dir = copySample();
  edit(dir, 'endings.json', (json) => {
    ending(json, 'sample-ending-one').locksOut = ['sample-ending-three'];
  });
  assertOnlyRule(validate(dir), 9, { file: 'endings.json', id: 'sample-ending-one' });
});

test('rule 9: locksOut names an entry, not an ending', () => {
  const dir = copySample();
  edit(dir, 'endings.json', (json) => {
    ending(json, 'sample-ending-one').locksOut = ['sample-key'];
  });
  const result = validate(dir);
  assertOnlyRule(result, 9, { file: 'endings.json', id: 'sample-ending-one' });
  assert.match(result.errors[0].message, /Ending ids/);
});

// ------------------------------------------------------------------ rule 10: long how (warning)

test('rule 10: a how over 300 characters is a warning, not an error', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').how = 'a'.repeat(301);
  });
  const result = validate(dir);
  assert.deepEqual(result.errors, [], 'no errors');
  assert.deepEqual([...new Set(result.warnings.map((w) => w.rule))], [10]);
  assert.ok(result.warnings.some((w) => w.file === 'items.json' && w.id === 'sample-key'));
});

test('rule 10: a how of exactly 300 characters gives no warning', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').how = 'a'.repeat(300);
  });
  assert.deepEqual(validate(dir).warnings, []);
});

// ------------------------------------------------------------------ extras: section 1 field checks

test('shape: spoiler outside 0, 1, 2', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').spoiler = 3;
  });
  assertOnlyRule(validate(dir), 'shape', { file: 'items.json', id: 'sample-key' });
});

test('shape: two Regions with the same order', () => {
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-b').order = 1;
  });
  assertOnlyRule(validate(dir), 'shape', { file: 'regions.json', id: 'sample-region-b' });
});

test('shape: an entry with no type', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-key').type;
  });
  assertOnlyRule(validate(dir), 'shape', { file: 'items.json', id: 'sample-key' });
});

test('shape: requires is text, not a list', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').requires = 'sample-ability';
  });
  assertOnlyRule(validate(dir), 'shape', { file: 'items.json', id: 'sample-key' });
});

test('shape: a Region with no summary', () => {
  const dir = copySample();
  edit(dir, 'regions.json', (json) => {
    delete region(json, 'sample-region-c').summary;
  });
  assertOnlyRule(validate(dir), 'shape', { file: 'regions.json', id: 'sample-region-c' });
});

// ------------------------------------------------------------------ output and the command line

test('formatProblem names the file, the id and the rule', () => {
  const text = formatProblem({ rule: 6, file: 'items.json', id: 'sample-key', position: null, message: 'x' });
  assert.equal(text, 'items.json, id "sample-key", rule 6: x');
});

test('the command exits 0 on the sample', () => {
  const run = spawnSync(process.execPath, [SCRIPT, SAMPLE], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /passed/);
});

test('the command exits 1 and names file, id and rule on a broken copy', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').missable = true;
  });
  const run = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /items\.json, id "sample-key", rule 6:/);
});

test('the command still runs the check when reached through a symlink (it does not exit 0 silently)', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').missable = true;
  });
  const link = path.join(tempFolder(), 'validate-data-link.js');
  symlinkSync(SCRIPT, link);
  const run = spawnSync(process.execPath, [link, dir], { encoding: 'utf8' });
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stderr, /items\.json, id "sample-key", rule 6:/);
});

test('the command exits 0 when only warnings are found, and prints them', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').how = 'a'.repeat(301);
  });
  const run = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stderr, /WARNING .*rule 10/);
});

test('the command exits 1 when the folder does not exist', () => {
  const run = spawnSync(process.execPath, [SCRIPT, path.join(tempFolder(), 'missing')], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /regions\.json.*rule 1/);
});
