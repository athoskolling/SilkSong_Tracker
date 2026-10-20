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

// ------------------------------------------------------------------ rule 12: Collectible types (warning)

// The approved list from docs/CONTRACTS.md section 6, rule 12. It is written out here on purpose:
// when the contract changes, this list has to change with it, and the tests show the difference.
const APPROVED_TYPES = [
  'mask-shard',
  'spool-fragment',
  'silk-heart',
  'needle-upgrade',
  'ancestral-art',
  'silk-skill',
  'ability',
  'crest',
  'tool',
  'crafting-kit-upgrade',
  'tool-pouch-upgrade',
  'sylphsong',
  'everbloom',
];

const rule12 = (result) => result.warnings.filter((w) => w.rule === 12);

test('rule 12: a Collectible with an unapproved type is a warning, not an error', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').type = 'gizmo';
  });
  const result = validate(dir);
  assert.deepEqual(result.errors, [], 'no errors');
  assert.equal(result.warnings.length, 1, `only the rule 12 warning:\n${result.warnings.map(formatProblem).join('\n')}`);
  const [warning] = rule12(result);
  assert.equal(warning.file, 'items.json');
  assert.equal(warning.id, 'sample-key');
  assert.match(warning.message, /"gizmo"/, 'the message names the type found');
  assert.doesNotMatch(warning.message, /Did you mean/, 'gizmo is not a near miss, so no suggestion');
});

test('rule 12: the command exits 0 and prints the warning with file, id and rule', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').type = 'silk_skill';
  });
  const run = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stderr, /WARNING items\.json, id "sample-key", rule 12: .*"silk_skill".*"silk-skill"/);
  assert.match(run.stdout, /passed.*1 warning/);
});

test('rule 12: a Collectible with no type gets the shape error only, not a second rule 12 warning', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-key').type;
  });
  const result = validate(dir);
  assertOnlyRule(result, 'shape', { file: 'items.json', id: 'sample-key' });
  assert.deepEqual(rule12(result), []);
});

// "ability" is for a counted ability that is neither an Ancestral Art nor a Silk Skill (contract
// section 6, rule 12, added 2026-10-20 for Needle Strike). Its own test, so a future edit to the
// list cannot drop it without a named failure.
test('rule 12: a Collectible with the type "ability" gives no warning', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    assert.equal(entry(json, 'sample-key').kind, 'collectible', 'sample-key is the Collectible this test relies on');
    entry(json, 'sample-key').type = 'ability';
  });
  const result = validate(dir);
  assert.deepEqual(result.errors.map(formatProblem), []);
  assert.deepEqual(result.warnings.map(formatProblem), []);
});

// Task types stay free: a Task can use any label, approved or not, and never warns.
const TASK_TYPES = ['door', 'Boss fight', 'gizmo', 'mask-shards', 'Tool', 'silk_skill', 'tool'];
for (const type of TASK_TYPES) {
  test(`rule 12: a Task with the type "${type}" does not warn`, () => {
    const dir = copySample();
    edit(dir, 'items.json', (json) => {
      assert.equal(entry(json, 'sample-door').kind, 'task', 'sample-door is the Task this test relies on');
      entry(json, 'sample-door').type = type;
    });
    const result = validate(dir);
    assert.deepEqual(result.errors.map(formatProblem), []);
    assert.deepEqual(result.warnings.map(formatProblem), []);
  });
}

for (const type of APPROVED_TYPES) {
  test(`rule 12: the approved Collectible type "${type}" passes`, () => {
    const dir = copySample();
    edit(dir, 'items.json', (json) => {
      assert.equal(entry(json, 'sample-key').kind, 'collectible', 'sample-key is the Collectible this test relies on');
      entry(json, 'sample-key').type = type;
    });
    const result = validate(dir);
    assert.deepEqual(result.errors.map(formatProblem), []);
    assert.deepEqual(result.warnings.map(formatProblem), []);
  });
}

// A near miss gets the closest approved type as a suggestion: lowercase, "_" as "-", a trailing
// "s" dropped, then compared.
const NEAR_MISSES = [
  { type: 'mask-shards', suggestion: 'mask-shard' },
  { type: 'Tool', suggestion: 'tool' },
  { type: 'silk_skill', suggestion: 'silk-skill' },
  { type: 'Silk_Skills', suggestion: 'silk-skill' }, // the steps combine
  { type: 'Ability', suggestion: 'ability' },
];
for (const { type, suggestion } of NEAR_MISSES) {
  test(`rule 12: the near miss "${type}" suggests "${suggestion}"`, () => {
    const dir = copySample();
    edit(dir, 'items.json', (json) => {
      entry(json, 'sample-key').type = type;
    });
    const result = validate(dir);
    assert.deepEqual(result.errors, []);
    assert.equal(rule12(result).length, 1);
    const [warning] = rule12(result);
    assert.equal(warning.file, 'items.json');
    assert.equal(warning.id, 'sample-key');
    assert.ok(warning.message.includes(`"${type}"`), `names the type found:\n${warning.message}`);
    assert.ok(warning.message.includes(`Did you mean "${suggestion}"?`), `suggests the approved type:\n${warning.message}`);
  });
}

test('rule 12: a type that is not a near miss lists the approved types instead of guessing', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').type = 'gizmo';
  });
  const [warning] = rule12(validate(dir));
  assert.doesNotMatch(warning.message, /Did you mean/);
  for (const approved of APPROVED_TYPES) {
    assert.ok(warning.message.includes(approved), `the message lists ${approved}:\n${warning.message}`);
  }
});

// ------------------------------------------------------------------ Phase 5: counts, price, toolColor
// Contract section 1 (the fields), section 6 rules 6, 11 and 12 (the checks), ADR 0005. Each test
// changes one thing in a copy of the sample and asserts that the expected rule fires. The sample's
// own entries have none of the new fields, so the copy is otherwise clean.

// A copy of the sample in which one entry has the given fields. `kind` is checked first, so a test
// that relies on sample-key being a Collectible fails at once if the sample changes.
function withEntry(id, kind, fields) {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    assert.equal(entry(json, id).kind, kind, `${id} is the ${kind} this test relies on`);
    Object.assign(entry(json, id), fields);
  });
  return dir;
}

// Warnings only: no errors, and every warning comes from `rule`.
function assertOnlyWarningRule(result, rule, { file, id } = {}) {
  const detail = result.warnings.map(formatProblem).join('\n');
  assert.deepEqual(result.errors.map(formatProblem), [], 'no errors');
  assert.ok(result.warnings.length > 0, 'expected at least one warning');
  assert.deepEqual([...new Set(result.warnings.map((w) => w.rule))], [rule], `warnings were:\n${detail}`);
  if (file !== undefined) {
    const named = result.warnings.some((w) => w.file === file && (id === undefined || w.id === id));
    assert.ok(named, `no warning names file ${file}${id === undefined ? '' : ` and id ${id}`}:\n${detail}`);
  }
}

function assertClean(result) {
  assert.deepEqual(result.errors.map(formatProblem), [], 'no errors');
  assert.deepEqual(result.warnings.map(formatProblem), [], 'no warnings');
}

// The tracked-only list from docs/CONTRACTS.md section 6, rule 12. Written out here on purpose, like
// APPROVED_TYPES: when the Mementos and Equipment sheet grows the list, these tests show the change.
const TRACKED_TYPES = ['memento', 'relic', 'map'];

// ---- counts (shape, and rule 6 for a Task)

for (const value of ['yes', 'false', 0, null]) {
  test(`shape: counts ${JSON.stringify(value)} is not true or false`, () => {
    const dir = withEntry('sample-key', 'collectible', { counts: value });
    const result = validate(dir);
    assertOnlyRule(result, 'shape', { file: 'items.json', id: 'sample-key' });
    assert.match(result.errors[0].message, /"counts" must be true or false when it is given/);
  });
}

test('shape: counts "yes" on a Task is a shape error only, not a rule 6 error', () => {
  const dir = withEntry('sample-door', 'task', { counts: 'yes' });
  assertOnlyRule(validate(dir), 'shape', { file: 'items.json', id: 'sample-door' });
});

test('rule 6: a Task with counts true is an error, because a Task never counts', () => {
  const dir = withEntry('sample-door', 'task', { counts: true });
  const result = validate(dir);
  assertOnlyRule(result, 6, { file: 'items.json', id: 'sample-door' });
  assert.match(result.errors[0].message, /A Task never counts/);
});

test('rule 6: a Task with counts false is accepted', () => {
  assertClean(validate(withEntry('sample-door', 'task', { counts: false })));
});

test('counts true on a Collectible is accepted', () => {
  assertClean(validate(withEntry('sample-key', 'collectible', { counts: true })));
});

test('counts false on a Collectible with a counted type (tool) gives no warning', () => {
  assertClean(validate(withEntry('sample-key', 'collectible', { counts: false })));
});

// ---- price (shape)

for (const price of [0, -5, 12.5, '80', null, true]) {
  test(`shape: price ${JSON.stringify(price)} is not a whole number of Rosaries, 1 or more`, () => {
    const dir = withEntry('sample-key', 'collectible', { price });
    const result = validate(dir);
    assertOnlyRule(result, 'shape', { file: 'items.json', id: 'sample-key' });
    assert.match(result.errors[0].message, /"price" must be a whole number of Rosaries, 1 or more/);
  });
}

for (const price of [1, 80]) {
  test(`price ${price} is accepted`, () => {
    assertClean(validate(withEntry('sample-key', 'collectible', { price })));
  });
}

// ---- toolColor (shape)

for (const toolColor of ['green', 'Red', 'RED', '']) {
  test(`shape: toolColor ${JSON.stringify(toolColor)} is not red, blue or yellow`, () => {
    const dir = withEntry('sample-key', 'collectible', { toolColor });
    const result = validate(dir);
    assertOnlyRule(result, 'shape', { file: 'items.json', id: 'sample-key' });
    assert.match(result.errors[0].message, /"toolColor" must be "red", "blue" or "yellow"/);
  });
}

for (const toolColor of ['red', 'blue', 'yellow']) {
  test(`toolColor "${toolColor}" is accepted`, () => {
    assertClean(validate(withEntry('sample-key', 'collectible', { toolColor })));
  });
}

// ---- rule 12 with counts: a counted Collectible must use a counted type

for (const counts of [undefined, true]) {
  for (const type of TRACKED_TYPES) {
    test(`rule 12: the tracked-only type "${type}" on a counted Collectible (counts ${counts === undefined ? 'missing' : 'true'}) warns and says to add counts`, () => {
      const dir = withEntry('sample-key', 'collectible', { type, counts });
      const result = validate(dir);
      assertOnlyWarningRule(result, 12, { file: 'items.json', id: 'sample-key' });
      assert.match(result.warnings[0].message, /"counts": false/);
      assert.match(result.warnings[0].message, /does not count it toward 100 percent/);
    });
  }
}

for (const type of TRACKED_TYPES) {
  test(`rule 12: the tracked-only type "${type}" with counts false is accepted`, () => {
    assertClean(validate(withEntry('sample-key', 'collectible', { type, counts: false })));
  });
}

test('rule 12: counts false with the near miss "mementos" suggests "memento"', () => {
  const dir = withEntry('sample-key', 'collectible', { type: 'mementos', counts: false });
  const result = validate(dir);
  assertOnlyWarningRule(result, 12, { file: 'items.json', id: 'sample-key' });
  assert.equal(
    result.warnings[0].message,
    '"type" "mementos" is not on the approved list for Collectibles. Did you mean "memento"?'
  );
});

test('rule 12: counts false with the near miss "Relics" suggests "relic"', () => {
  const dir = withEntry('sample-key', 'collectible', { type: 'Relics', counts: false });
  const result = validate(dir);
  assertOnlyWarningRule(result, 12, { file: 'items.json', id: 'sample-key' });
  assert.match(result.warnings[0].message, /Did you mean "relic"\?$/);
});

test('rule 12: counts false with a type on neither list names both lists and suggests nothing', () => {
  const dir = withEntry('sample-key', 'collectible', { type: 'gizmo', counts: false });
  const result = validate(dir);
  assertOnlyWarningRule(result, 12, { file: 'items.json', id: 'sample-key' });
  assert.equal(
    result.warnings[0].message,
    `"type" "gizmo" is not on the approved list for Collectibles. The approved types are: ${APPROVED_TYPES.join(', ')} (counted), and ${TRACKED_TYPES.join(', ')} (tracked only, for "counts": false).`
  );
});

// An unknown type on a counted Collectible keeps the message it had before Phase 5, word for word.
for (const counts of [undefined, true]) {
  test(`rule 12: an unknown type on a counted Collectible (counts ${counts === undefined ? 'missing' : 'true'}) gives the message from before Phase 5`, () => {
    const result = validate(withEntry('sample-key', 'collectible', { type: 'gizmo', counts }));
    assertOnlyWarningRule(result, 12, { file: 'items.json', id: 'sample-key' });
    assert.equal(
      result.warnings[0].message,
      `"type" "gizmo" is not on the approved list for Collectibles. The approved types are: ${APPROVED_TYPES.join(', ')}.`
    );
  });
}

test('rule 12: a near miss on a counted Collectible still suggests the counted type', () => {
  const result = validate(withEntry('sample-key', 'collectible', { type: 'mask-shards' }));
  assertOnlyWarningRule(result, 12, { file: 'items.json', id: 'sample-key' });
  assert.equal(
    result.warnings[0].message,
    '"type" "mask-shards" is not on the approved list for Collectibles. Did you mean "mask-shard"?'
  );
});

test('rule 12: a Task with a tracked-only type does not warn (Task types stay free)', () => {
  assertClean(validate(withEntry('sample-door', 'task', { type: 'memento' })));
});

// ---- the command on the sample

test('the command prints 0 warning(s) on the sample, as before Phase 5', () => {
  const run = spawnSync(process.execPath, [SCRIPT, SAMPLE], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, '');
  assert.match(run.stdout, /passed for .*data\/sample: 0 warning\(s\)\./);
});

// ------------------------------------------------------------------ Phase 5, second round: rule 13 and effect
// Contract section 1 (the Build fields), section 6 rule 13 (their checks) and rule 10 (effect over 200
// characters). Each test changes one thing in a copy of the sample, so a failure names one rule.
// sample-key is a counted Tool, sample-tool-two a second Tool, sample-crest a Crest, sample-door a Task.

// A full slot-count object (all four colours), with the given colours changed.
const slotsOf = (overrides = {}) => ({ red: 0, blue: 0, yellow: 0, white: 0, ...overrides });
const COLORS = ['red', 'blue', 'yellow', 'white'];

// Validates a copy in `dir` and asserts it is clean (no errors and no warnings).
const assertCleanDir = (dir) => assertClean(validate(dir));

// ---- clean: valid Build fields give no message

test('rule 13: slots with all four colours on a Crest is accepted', () => {
  assertCleanDir(withEntry('sample-crest', 'collectible', { slots: slotsOf({ red: 2, blue: 1 }) }));
});

test('rule 13: slots of 0 in every colour is accepted (0 or more)', () => {
  assertCleanDir(withEntry('sample-crest', 'collectible', { slots: slotsOf() }));
});

test('rule 13: slotsMax above slots in every colour is accepted', () => {
  const dir = withEntry('sample-crest', 'collectible', {
    slots: slotsOf({ red: 1 }),
    slotsMax: slotsOf({ red: 2, blue: 1 }),
  });
  assertClean(validate(dir));
});

test('rule 13: slotsMax equal to slots is accepted', () => {
  const dir = withEntry('sample-crest', 'collectible', { slots: slotsOf({ red: 1 }), slotsMax: slotsOf({ red: 1 }) });
  assertClean(validate(dir));
});

test('rule 13: grantsSlots with one colour on an entry that is not a Crest is accepted', () => {
  assertCleanDir(withEntry('sample-shard', 'collectible', { grantsSlots: { white: 1 } }));
});

test('rule 13: grantsSlots on a Task is accepted', () => {
  assertCleanDir(withEntry('sample-door', 'task', { grantsSlots: { red: 1, white: 2 } }));
});

test('rule 13: an upgrade with counts false is accepted', () => {
  assertCleanDir(withEntry('sample-key', 'collectible', { upgradeOf: 'sample-tool-two', counts: false }));
});

test('rule 13: upgradeOf on a Task is accepted, because a Task never counts', () => {
  assertCleanDir(withEntry('sample-door', 'task', { upgradeOf: 'sample-tool-two' }));
});

test('rule 13: a toolColor on a Tool with no base is accepted', () => {
  assertCleanDir(withEntry('sample-key', 'collectible', { toolColor: 'red' }));
});

test('rule 13: an upgrade with the same colour as its base is accepted', () => {
  const dir = withEntry('sample-key', 'collectible', { toolColor: 'red', counts: false, upgradeOf: 'sample-tool-two' });
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-tool-two').toolColor = 'red';
  });
  assertClean(validate(dir));
});

test('rule 13: an upgrade whose base has no colour is accepted', () => {
  assertCleanDir(withEntry('sample-key', 'collectible', { toolColor: 'red', counts: false, upgradeOf: 'sample-tool-two' }));
});

test('rule 13: a short effect is accepted', () => {
  assertCleanDir(withEntry('sample-key', 'collectible', { effect: 'Adds one slot to a Crest.' }));
});

test('rule 13: an effect of exactly 200 characters gives no warning', () => {
  assertCleanDir(withEntry('sample-key', 'collectible', { effect: 'a'.repeat(200) }));
});

// ---- errors: slots and slotsMax

test('rule 13: slots on an entry that is not a Crest is an error', () => {
  const result = validate(withEntry('sample-key', 'collectible', { slots: slotsOf() }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.match(result.errors[0].message, /"slots" is only for a Crest/);
});

test('rule 13: slotsMax on an entry that is not a Crest is an error', () => {
  const result = validate(withEntry('sample-key', 'collectible', { slots: slotsOf(), slotsMax: slotsOf() }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.ok(result.errors.some((e) => /"slotsMax" is only for a Crest/.test(e.message)), 'names slotsMax');
});

test('rule 13: slotsMax on a Crest with no slots is an error', () => {
  const result = validate(withEntry('sample-crest', 'collectible', { slotsMax: slotsOf({ red: 2 }) }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
  assert.equal(result.errors.length, 1, 'only the missing slots');
  assert.match(result.errors[0].message, /"slotsMax" is given without "slots"/);
});

for (const colour of COLORS) {
  test(`rule 13: slots with no "${colour}" key is an error`, () => {
    const slots = slotsOf();
    delete slots[colour];
    const result = validate(withEntry('sample-crest', 'collectible', { slots }));
    assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
    assert.match(result.errors[0].message, new RegExp(`has no "${colour}" key`));
  });
}

test('rule 13: slots with a key that is not a colour is an error', () => {
  const result = validate(withEntry('sample-crest', 'collectible', { slots: { ...slotsOf(), green: 1 } }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
  assert.match(result.errors[0].message, /"green", which is not a colour/);
});

for (const bad of [-1, 1.5, '2', null]) {
  test(`rule 13: slots.red of ${JSON.stringify(bad)} is an error (a whole number, 0 or more)`, () => {
    const result = validate(withEntry('sample-crest', 'collectible', { slots: slotsOf({ red: bad }) }));
    assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
    assert.match(result.errors[0].message, /"slots\.red" must be a whole number, 0 or more/);
  });
}

for (const bad of [[0, 0, 0, 0], 'red']) {
  test(`rule 13: slots as ${JSON.stringify(bad)} (not an object of colours) is an error`, () => {
    const result = validate(withEntry('sample-crest', 'collectible', { slots: bad }));
    assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
    assert.match(result.errors[0].message, /"slots" must be an object with the keys red, blue, yellow and white/);
  });
}

test('rule 13: slotsMax with no "white" key is an error', () => {
  const slotsMax = slotsOf();
  delete slotsMax.white;
  const result = validate(withEntry('sample-crest', 'collectible', { slots: slotsOf(), slotsMax }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
  assert.match(result.errors[0].message, /"slotsMax" has no "white" key/);
});

test('rule 13: slotsMax with a negative count is an error', () => {
  const result = validate(withEntry('sample-crest', 'collectible', { slots: slotsOf(), slotsMax: slotsOf({ blue: -1 }) }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
  assert.match(result.errors[0].message, /"slotsMax\.blue" must be a whole number, 0 or more/);
});

test('rule 13: slotsMax below slots in one colour is an error that names the colour', () => {
  const dir = withEntry('sample-crest', 'collectible', { slots: slotsOf({ red: 2 }), slotsMax: slotsOf({ red: 1 }) });
  const result = validate(dir);
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
  assert.equal(result.errors.length, 1, 'one colour, one error');
  assert.match(result.errors[0].message, /"slotsMax\.red" is 1, less than "slots\.red" \(2\)/);
});

// ---- errors: grantsSlots

test('rule 13: grantsSlots on a Crest is an error', () => {
  const result = validate(withEntry('sample-crest', 'collectible', { grantsSlots: { white: 1 } }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest' });
  assert.match(result.errors[0].message, /"grantsSlots" is on a Crest/);
});

test('rule 13: grantsSlots with no colour is an error', () => {
  const result = validate(withEntry('sample-shard', 'collectible', { grantsSlots: {} }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-shard' });
  assert.match(result.errors[0].message, /"grantsSlots" must be an object with one or more of the keys/);
});

test('rule 13: grantsSlots with a count of 0 is an error (1 or more)', () => {
  const result = validate(withEntry('sample-shard', 'collectible', { grantsSlots: { white: 0 } }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-shard' });
  assert.match(result.errors[0].message, /"grantsSlots\.white" must be a whole number, 1 or more, found 0/);
});

test('rule 13: grantsSlots with a key that is not a colour is an error', () => {
  const result = validate(withEntry('sample-shard', 'collectible', { grantsSlots: { green: 1 } }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-shard' });
  assert.match(result.errors[0].message, /"green", which is not a colour/);
});

test('rule 13: grantsSlots as text is an error', () => {
  const result = validate(withEntry('sample-shard', 'collectible', { grantsSlots: 'white' }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-shard' });
});

// ---- errors: upgradeOf

test('rule 13: upgradeOf names the entry itself, and only that is reported', () => {
  const result = validate(withEntry('sample-key', 'collectible', { upgradeOf: 'sample-key', counts: false }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.equal(result.errors.length, 1, 'a self link is one error, not also a loop');
  assert.match(result.errors[0].message, /own id/);
});

test('rule 13: upgradeOf names a Region id, which is not an entry', () => {
  const result = validate(withEntry('sample-key', 'collectible', { upgradeOf: 'sample-region-a', counts: false }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.match(result.errors[0].message, /"sample-region-a", which is a Region id/);
});

test('rule 13: upgradeOf names an Ending id, which is not an entry', () => {
  const result = validate(withEntry('sample-key', 'collectible', { upgradeOf: 'sample-ending-one', counts: false }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.match(result.errors[0].message, /"sample-ending-one", which is an Ending id/);
});

test('rule 13: upgradeOf names an id that does not exist', () => {
  const result = validate(withEntry('sample-key', 'collectible', { upgradeOf: 'ghost-entry', counts: false }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.match(result.errors[0].message, /"ghost-entry", which does not exist in items\.json/);
});

test('rule 13: upgradeOf that is not text is an error', () => {
  const result = validate(withEntry('sample-key', 'collectible', { upgradeOf: 7, counts: false }));
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.match(result.errors[0].message, /must be the id of another entry/);
});

test('rule 13: two upgrades that name each other are a loop', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    Object.assign(entry(json, 'sample-key'), { upgradeOf: 'sample-tool-two', counts: false });
    Object.assign(entry(json, 'sample-tool-two'), { upgradeOf: 'sample-key', counts: false });
  });
  const result = validate(dir);
  assertOnlyRule(result, 13, { file: 'items.json' });
  assert.ok(
    result.errors.some((e) => e.message.includes('sample-key -> sample-tool-two -> sample-key')),
    `the loop is spelled out:\n${result.errors.map(formatProblem).join('\n')}`
  );
});

test('rule 13: a loop through three upgrades is named in order', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    Object.assign(entry(json, 'sample-key'), { upgradeOf: 'sample-tool-two', counts: false });
    Object.assign(entry(json, 'sample-tool-two'), { upgradeOf: 'sample-crest', counts: false });
    Object.assign(entry(json, 'sample-crest'), { upgradeOf: 'sample-key', counts: false });
  });
  const result = validate(dir);
  assertOnlyRule(result, 13, { file: 'items.json' });
  assert.ok(
    result.errors.some((e) => e.message.includes('sample-key -> sample-tool-two -> sample-crest -> sample-key')),
    `the loop is spelled out:\n${result.errors.map(formatProblem).join('\n')}`
  );
});

test('rule 13: a chain that runs into a loop reports the loop once, from its first entry', () => {
  // sample-key leads into the loop sample-tool-two -> sample-crest -> sample-tool-two. The loop is one
  // problem, so it is reported once; sample-key itself is not part of the loop.
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    Object.assign(entry(json, 'sample-key'), { upgradeOf: 'sample-tool-two', counts: false });
    Object.assign(entry(json, 'sample-tool-two'), { upgradeOf: 'sample-crest', counts: false });
    Object.assign(entry(json, 'sample-crest'), { upgradeOf: 'sample-tool-two', counts: false });
  });
  const result = validate(dir);
  assertOnlyRule(result, 13, { file: 'items.json' });
  const loops = result.errors.filter((e) => e.message.includes('loops back on itself'));
  assert.equal(loops.length, 1, `one loop:\n${result.errors.map(formatProblem).join('\n')}`);
  assert.match(loops[0].message, /sample-tool-two -> sample-crest -> sample-tool-two/);
});

// ---- errors: effect

for (const bad of ['', '   ', 5]) {
  test(`rule 13: effect ${JSON.stringify(bad)} is an error (non-empty text when given)`, () => {
    const result = validate(withEntry('sample-key', 'collectible', { effect: bad }));
    assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-key' });
    assert.match(result.errors[0].message, /"effect" must be a non-empty text/);
  });
}

// ---- warnings: upgradeOf that counts, toolColor, colours of an upgrade and its base, effect length

test('rule 13: upgradeOf on a counted Collectible is a warning, not an error', () => {
  const result = validate(withEntry('sample-key', 'collectible', { upgradeOf: 'sample-tool-two' }));
  assertOnlyWarningRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.match(result.warnings[0].message, /set on a counted Collectible/);
});

test('rule 13: upgradeOf with counts true is a warning', () => {
  const result = validate(withEntry('sample-key', 'collectible', { upgradeOf: 'sample-tool-two', counts: true }));
  assertOnlyWarningRule(result, 13, { file: 'items.json', id: 'sample-key' });
});

test('rule 13: toolColor on a Crest is a warning, not an error', () => {
  const result = validate(withEntry('sample-crest', 'collectible', { toolColor: 'red' }));
  assertOnlyWarningRule(result, 13, { file: 'items.json', id: 'sample-crest' });
  assert.match(result.warnings[0].message, /Only a Tool has a colour/);
});

test('rule 13: toolColor on a Task is a warning, not an error', () => {
  const result = validate(withEntry('sample-door', 'task', { toolColor: 'blue' }));
  assertOnlyWarningRule(result, 13, { file: 'items.json', id: 'sample-door' });
  assert.match(result.warnings[0].message, /of type "door"/);
});

test('rule 13: an upgrade whose colour differs from its base is a warning that names both', () => {
  const dir = withEntry('sample-key', 'collectible', { toolColor: 'red', counts: false, upgradeOf: 'sample-tool-two' });
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-tool-two').toolColor = 'blue';
  });
  const result = validate(dir);
  assertOnlyWarningRule(result, 13, { file: 'items.json', id: 'sample-key' });
  assert.match(result.warnings[0].message, /differs from the colour of its base "sample-tool-two", which is "blue"/);
});

test('rule 13: effect over 200 characters is a rule 10 warning, not an error', () => {
  const result = validate(withEntry('sample-key', 'collectible', { effect: 'a'.repeat(201) }));
  assertOnlyWarningRule(result, 10, { file: 'items.json', id: 'sample-key' });
  assert.match(result.warnings[0].message, /"effect" is 201 characters \(over 200\)/);
});

test('rule 13: the command prints a Build field error with file, id and rule, and exits 1', () => {
  const dir = withEntry('sample-crest', 'collectible', { slots: slotsOf({ red: -1 }) });
  const run = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stderr, /ERROR items\.json, id "sample-crest", rule 13: "slots\.red" must be a whole number, 0 or more/);
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
