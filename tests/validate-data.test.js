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
// Used only to prove a fixture's premise (that a Build fails with nothing opened); the rules under test are the validator's.
import { checkBuild } from '../js/builds.js';

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
// "key" is the type of simple-key in data/ (a Task), so it must stay free on a Task even though it is
// now a tracked-only type for Collectibles.
const TASK_TYPES = ['door', 'Boss fight', 'gizmo', 'mask-shards', 'Tool', 'silk_skill', 'tool', 'key'];
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

// The tracked-only list from docs/CONTRACTS.md section 6, rule 12, with the five types the Mementos and
// Equipment sheet adds (docs/PHASE-5-SHEET-2-MEMENTOS-EQUIPMENT-SHOPS.md, section 2.2, P5-15). Written
// out here on purpose, like APPROVED_TYPES: when the list grows, these tests show the change.
const TRACKED_TYPES = ['memento', 'relic', 'map', 'map-tool', 'memory-locket', 'key', 'key-item', 'furnishing'];

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

// With counts: false, a near miss is looked up in both lists, so the suggestion can name a tracked-only
// type (the sheet's five and the older three) or a counted one. Written out per type, so a missing
// list entry fails by name.
const BOTH_LISTS_NEAR_MISSES = [
  { type: 'Memory_Lockets', suggestion: 'memory-locket' },
  { type: 'Keys', suggestion: 'key' },
  { type: 'key_items', suggestion: 'key-item' },
  { type: 'map-tools', suggestion: 'map-tool' },
  { type: 'Furnishings', suggestion: 'furnishing' },
  { type: 'mask_shard', suggestion: 'mask-shard' }, // a counted type, found from the counts: false side
];
for (const { type, suggestion } of BOTH_LISTS_NEAR_MISSES) {
  test(`rule 12: counts false with the near miss "${type}" suggests "${suggestion}" from either list`, () => {
    const result = validate(withEntry('sample-key', 'collectible', { type, counts: false }));
    assertOnlyWarningRule(result, 12, { file: 'items.json', id: 'sample-key' });
    assert.equal(
      result.warnings[0].message,
      `"type" "${type}" is not on the approved list for Collectibles. Did you mean "${suggestion}"?`
    );
  });
}

// fleas are Tasks (sheet 2, section 2.2, E4 open), and a Task's type is free, so no flea entry is needed
// on either list. A Collectible of type flea is not on the list, so it gets the usual nudge.
test('rule 12: a Task of type "flea" does not warn, so fleas need no list entry', () => {
  assertClean(validate(withEntry('sample-door', 'task', { type: 'flea' })));
});

test('rule 12: a Collectible of type "flea" with counts false warns, because fleas are Tasks', () => {
  const result = validate(withEntry('sample-key', 'collectible', { type: 'flea', counts: false }));
  assertOnlyWarningRule(result, 12, { file: 'items.json', id: 'sample-key' });
  assert.match(result.warnings[0].message, /"type" "flea" is not on the approved list for Collectibles/);
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

// ------------------------------------------------------------------ rule 14: Ending conditions on the Route (warning)
// Contract section 6, rule 14, and section 1 "On the Route or not". The validator asks routeIds whether each
// Ending condition is on the Route. Every test changes one thing in a copy of the sample. The sample's own
// conditions are all on the Route (sample-shard is counted, sample-boss a Task, sample-charm missable), so the
// untouched sample gives no rule 14 warning.

const rule14 = (result) => result.warnings.filter((w) => w.rule === 14);

// The (Ending id, condition id) of each rule 14 warning, sorted, so a test can compare the whole list at once.
function rule14Pairs(result) {
  return rule14(result)
    .map((w) => `${w.id}|${/lists "([^"]+)"/.exec(w.message)[1]}`)
    .sort();
}

// Adds a counts-false Collectible to a copy of the sample. Nothing requires it, so it is off the Route unless
// a test makes a Route entry need it or makes it missable. `fields` overrides the defaults.
function addTrackedCollectible(dir, id, fields = {}) {
  edit(dir, 'items.json', (json) => {
    const step = Math.max(...json.items.map((item) => item.step)) + 1;
    json.items.push({
      id,
      name: `Sample tracked ${id}`,
      kind: 'collectible',
      type: 'relic',
      regionId: 'sample-region-a',
      how: 'Sample text, not game data.',
      requires: [],
      missable: false,
      step,
      source: `https://example.invalid/${id}`,
      counts: false,
      ...fields,
    });
  });
}

// Adds one condition to an Ending of a copy of the sample.
function addCondition(dir, endingId, conditionId) {
  edit(dir, 'endings.json', (json) => {
    ending(json, endingId).conditions.push(conditionId);
  });
}

test('rule 14: the untouched sample gives no rule 14 warning', () => {
  assert.deepEqual(rule14(validate(SAMPLE)), []);
});

test('rule 14: an Ending condition that is a counts false Collectible nothing needs gives one warning', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  const result = validate(dir);
  assertOnlyWarningRule(result, 14, { file: 'endings.json', id: 'sample-ending-one' });
  assert.equal(result.warnings.length, 1, `exactly one warning:\n${result.warnings.map(formatProblem).join('\n')}`);
  assert.match(result.warnings[0].message, /"conditions" lists "sample-extra-relic", which is not on the Route/);
  assert.match(result.warnings[0].message, /The Route must lead to every Ending/);
  assert.match(result.warnings[0].message, /the orchestrator decides the fix/);
});

test('rule 14: the command prints the WARNING with file, Ending id and rule, exits 0 and counts it', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  const run = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(
    run.stderr,
    /WARNING endings\.json, id "sample-ending-one", rule 14: "conditions" lists "sample-extra-relic", which is not on the Route/
  );
  assert.match(run.stdout, /passed.*1 warning/);
});

test('rule 14: the command works from any folder, because the import of js/requirements.js is relative to the script', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  const run = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8', cwd: tempFolder() });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stderr, /rule 14/);
});

test('rule 14: a condition that the sample already has off the Route (sample-memento) warns', () => {
  const dir = copySample();
  addCondition(dir, 'sample-ending-two', 'sample-memento');
  const result = validate(dir);
  assertOnlyWarningRule(result, 14, { file: 'endings.json', id: 'sample-ending-two' });
  assert.deepEqual(rule14Pairs(result), ['sample-ending-two|sample-memento']);
});

// Each Ending condition the Route reaches some other way gives no warning. Each test puts it on the Route
// a different way, so a mutation that checks only one of them fails by name.
test('rule 14: a condition that a counted entry requires is on the Route, so no warning', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').requires.push('sample-extra-relic');
  });
  assertClean(validate(dir));
});

test('rule 14: a condition that a Region requires is on the Route, so no warning', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  edit(dir, 'regions.json', (json) => {
    region(json, 'sample-region-b').requires.push('sample-extra-relic');
  });
  assertClean(validate(dir));
});

test('rule 14: a condition the Route needs two links down a counted entry\'s chain is on the Route, so no warning', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addTrackedCollectible(dir, 'sample-extra-link', { requires: ['sample-extra-relic'] });
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').requires.push('sample-extra-link');
  });
  assertClean(validate(dir));
});

test('rule 14: a missable counts false entry is on the Route, so no warning', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic', { missable: true, missableNote: 'Sample note: it can be missed.' });
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  assertClean(validate(dir));
});

test('rule 14: a condition that only an entry off the Route needs is off the Route too, so it warns', () => {
  // "Needed by an entry on the Route", not "needed by any entry" (section 2, routeIds).
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addTrackedCollectible(dir, 'sample-extra-trinket', { requires: ['sample-extra-relic'] });
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  const result = validate(dir);
  assertOnlyWarningRule(result, 14, { file: 'endings.json', id: 'sample-ending-one' });
  assert.deepEqual(rule14Pairs(result), ['sample-ending-one|sample-extra-relic']);
});

test('rule 14: each off-Route condition in each Ending gets its own warning, naming both ids', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addTrackedCollectible(dir, 'sample-extra-token');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-token');
  addCondition(dir, 'sample-ending-two', 'sample-extra-token');
  const result = validate(dir);
  assertOnlyWarningRule(result, 14);
  assert.deepEqual(rule14Pairs(result), [
    'sample-ending-one|sample-extra-relic',
    'sample-ending-one|sample-extra-token',
    'sample-ending-two|sample-extra-token',
  ]);
});

// Rule 14 runs only when rules 1 to 5 pass (contract section 6). Each copy breaks one of them, and has an
// off-Route condition so that rule 14 would fire if the gate let it run. The rule 3 copy also makes routeIds
// throw (an unknown id in requires), so there the gate is the only thing that keeps the command from crashing.
const RULES_1_TO_5 = [
  {
    rule: 1,
    file: 'endings.json',
    breakIt: (dir) => edit(dir, 'endings.json', (json) => { json.dataVersion = 2; }),
  },
  {
    rule: 2,
    file: 'items.json',
    breakIt: (dir) => edit(dir, 'items.json', (json) => { entry(json, 'sample-flea').id = 'sample-crest'; }),
  },
  {
    rule: 3,
    file: 'items.json',
    breakIt: (dir) => edit(dir, 'items.json', (json) => { entry(json, 'sample-key').requires = ['ghost-entry']; }),
  },
  {
    rule: 4,
    file: 'items.json',
    breakIt: (dir) => edit(dir, 'items.json', (json) => { entry(json, 'sample-ability').requires = ['sample-charm']; }),
  },
  {
    rule: 5,
    file: 'items.json',
    breakIt: (dir) => edit(dir, 'items.json', (json) => { entry(json, 'sample-key').step = 1; }),
  },
];

for (const { rule, file, breakIt } of RULES_1_TO_5) {
  test(`rule 14: a rule ${rule} error stops rule 14, and the check does not crash`, () => {
    const dir = copySample();
    addTrackedCollectible(dir, 'sample-extra-relic');
    addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
    breakIt(dir);
    const result = validate(dir);
    assertOnlyRule(result, rule, { file });
    assert.deepEqual(rule14(result), [], 'no rule 14 warning');
  });
}

test('rule 14: a missing regions.json gives rule 1 only, with no crash and no rule 14', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  rmSync(path.join(dir, 'regions.json'));
  assertOnlyRule(validate(dir), 1, { file: 'regions.json' });
});

// The file is there and parses, but has no regions list. Rule 1 does not fire (the file is readable), so only
// the all-files check keeps routeIds from being given a list that is not there.
test('rule 14: a regions.json with no regions list gives a shape error alone, with no crash and no rule 14', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  edit(dir, 'regions.json', (json) => {
    delete json.regions;
  });
  const result = validate(dir);
  assertOnlyRule(result, 'shape', { file: 'regions.json' });
  assert.deepEqual(rule14(result), [], 'no rule 14 warning');
});

// A warning from another rule does not stop rule 14: the gate is on errors from rules 1 to 5 only.
test('rule 14 still runs beside a warning from another rule (rule 12 here)', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').type = 'gizmo';
  });
  const result = validate(dir);
  assert.deepEqual(result.errors.map(formatProblem), [], 'no errors');
  assert.deepEqual([...new Set(result.warnings.map((w) => w.rule))].sort(), [12, 14]);
  assert.deepEqual(rule14Pairs(result), ['sample-ending-one|sample-extra-relic']);
});

// The gate is rules 1 to 5 by contract, so an error from a later rule does not stop rule 14. This test pins that
// choice: if the gate is tightened, it fails by name and the contract changes with it.
test('rule 14 still runs beside an error from a rule after 5 (rule 6 here)', () => {
  const dir = copySample();
  addTrackedCollectible(dir, 'sample-extra-relic');
  addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').missable = true; // no missableNote: rule 6
  });
  const result = validate(dir);
  assertOnlyRule(result, 6, { file: 'items.json', id: 'sample-key' });
  assert.deepEqual(rule14Pairs(result), ['sample-ending-one|sample-extra-relic']);
});

// routeIds reads every requires list. A list that is not a list of ids is a shape error, which rules 1 to 5 do
// not report, and routeIds would throw on each letter it takes for an id. So rule 14 waits for well-formed lists.
// Each copy has an off-Route condition, so a missing guard would print rule 14 or crash.
const SHAPE_BREAKS = [
  {
    name: 'an entry requires is text',
    file: 'items.json',
    id: 'sample-key',
    breakIt: (json) => { entry(json, 'sample-key').requires = 'sample-ability'; },
  },
  {
    name: 'an entry requires holds a number',
    file: 'items.json',
    id: 'sample-key',
    breakIt: (json) => { entry(json, 'sample-key').requires = [5]; },
  },
  {
    name: 'a Region requires is text',
    file: 'regions.json',
    id: 'sample-region-b',
    breakIt: (json) => { region(json, 'sample-region-b').requires = 'sample-ability'; },
  },
  {
    name: 'an Ending conditions is text',
    file: 'endings.json',
    id: 'sample-ending-one',
    breakIt: (json) => { ending(json, 'sample-ending-one').conditions = 'sample-extra-relic'; },
  },
  {
    name: 'an Ending conditions holds a number',
    file: 'endings.json',
    id: 'sample-ending-one',
    breakIt: (json) => { ending(json, 'sample-ending-one').conditions.push(7); },
  },
];

for (const { name, file, id, breakIt } of SHAPE_BREAKS) {
  test(`rule 14: a shape error (${name}) is reported alone, and rule 14 does not run`, () => {
    const dir = copySample();
    addTrackedCollectible(dir, 'sample-extra-relic');
    addCondition(dir, 'sample-ending-one', 'sample-extra-relic');
    edit(dir, file, breakIt);
    const result = validate(dir);
    assertOnlyRule(result, 'shape', { file, id });
    assert.deepEqual(rule14(result), [], 'no rule 14 warning');
  });
}

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

// ------------------------------------------------------------------ Phase 5, third round: rules 15 and 16
// builds.json (Build templates and synergies, rule 15) and places.json (Places, rule 16), contract section 1,
// section 6 and ADR 0007. Each test writes its own copy of the sample with the files it needs; data/ is never
// read. Sample facts these tests rely on (see data/sample/items.json):
//   sample-crest-one    slots red 1, blue 1, yellow 0, white 1; slotsMax red 1, blue 2, yellow 1, white 1
//                       (room to open one blue and one yellow slot, and no red or white room)
//   sample-crest-two    slots but no slotsMax; sample-crest has neither; sample-crest-four slots = slotsMax
//   sample-red-tool, sample-red-tool-two (red), sample-yellow-tool (yellow), sample-blue-tool (blue),
//   sample-skill (a Silk Skill, fits white), sample-key (a Tool with no toolColor), sample-region-a (a Region),
//   sample-red-tool-plus (an upgrade of sample-red-tool), sample-slot-upgrade (a Task with grantsSlots blue 1, yellow 1)

// A template that is ready as it is: sample-crest-one with one red Tool, one blue Tool and the Silk Skill.
// Each test changes one field through `fields`.
const goodTemplate = (fields = {}) => ({
  id: 'sample-template-one',
  crestId: 'sample-crest-one',
  name: 'Sample template one',
  goal: 'Sample goal, not game data.',
  build: { red: ['sample-red-tool'], blue: ['sample-blue-tool'], white: ['sample-skill'] },
  editorial: true,
  source: 'https://example.invalid/sample-template-one',
  ...fields,
});

const goodSynergy = (fields = {}) => ({
  id: 'sample-synergy-one',
  a: 'sample-red-tool',
  b: 'sample-blue-tool',
  effect: 'Sample effect, not game data.',
  source: 'https://example.invalid/sample-synergy-one',
  ...fields,
});

const goodPlace = (fields = {}) => ({
  id: 'bench-sample-one',
  name: 'Sample bench',
  kind: 'bench',
  regionId: 'sample-region-a',
  how: 'Sample text, not game data.',
  requires: [],
  source: 'https://example.invalid/bench-sample-one',
  ...fields,
});

const goodShop = (fields = {}) => goodPlace({ id: 'shop-sample-one', name: 'Sample shop', kind: 'shop', sells: ['sample-red-tool-two'], ...fields });

// The two lists of builds.json are both required, so a test that writes the file writes both (empty by default).
function writeBuilds(dir, { templates = [], synergies = [], dataVersion = 3 } = {}) {
  writeFileSync(path.join(dir, 'builds.json'), JSON.stringify({ dataVersion, templates, synergies }, null, 2));
}

function writePlaces(dir, { places = [], dataVersion = 3 } = {}) {
  writeFileSync(path.join(dir, 'places.json'), JSON.stringify({ dataVersion, places }, null, 2));
}

// A copy of the sample with builds.json and/or places.json written into it. The options are those of
// writeBuilds and writePlaces, so `{ builds: { templates: [...] } }` writes only the templates list (and no synergies).
function withFiles({ builds, places } = {}) {
  const dir = copySample();
  if (builds) writeBuilds(dir, builds);
  if (places) writePlaces(dir, places);
  return dir;
}

// Adds an entry to a copy of the sample, on the next free step. Used for a second blue Tool.
function addEntry(dir, fields) {
  edit(dir, 'items.json', (json) => {
    const step = Math.max(...json.items.map((item) => item.step)) + 1;
    json.items.push({
      kind: 'collectible',
      type: 'tool',
      regionId: 'sample-region-f',
      how: 'Sample text, not game data.',
      requires: [],
      missable: false,
      step,
      source: `https://example.invalid/${fields.id}`,
      ...fields,
    });
  });
}

// Asserts that the copy gives exactly one error: of `rule`, naming the file and id, and with a message that matches `text`.
function assertOneError(result, rule, { file, id, text }) {
  assertOnlyRule(result, rule, { file, id });
  assert.equal(result.errors.length, 1, `exactly one error:\n${result.errors.map(formatProblem).join('\n')}`);
  assert.match(result.errors[0].message, text);
}

// ---- no new file gives no new message; a valid new file gives none either

test('rule 15 and 16: a copy with no builds.json and no places.json gives no message (both files are optional)', () => {
  assertClean(validate(copySample()));
});

test('rule 15 and 16: valid builds.json and places.json give no message', () => {
  const dir = withFiles({
    builds: { templates: [goodTemplate()], synergies: [goodSynergy()] },
    places: { places: [goodPlace(), goodShop()] },
  });
  assertClean(validate(dir));
});

test('rule 15 and 16: both lists may be empty, in both files', () => {
  const dir = withFiles({ builds: { templates: [], synergies: [] }, places: { places: [] } });
  assertClean(validate(dir));
});

// ---- rule 1: the optional files' dataVersion and parsing

test('rule 1: a builds.json that is not valid JSON is named', () => {
  const dir = copySample();
  writeFileSync(path.join(dir, 'builds.json'), '{ "dataVersion": 3, ');
  assertOnlyRule(validate(dir), 1, { file: 'builds.json' });
});

test('rule 1: a places.json whose dataVersion differs from the other files is named', () => {
  const dir = withFiles({ places: { places: [goodPlace()], dataVersion: 2 } });
  assertOnlyRule(validate(dir), 1, { file: 'places.json' });
});

test('rule 1: a builds.json whose dataVersion is text is named, and the templates still check', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate()], dataVersion: '3' } });
  assertOnlyRule(validate(dir), 1, { file: 'builds.json' });
});

test('rule 1: a builds.json with one dataVersion is read once, so one version error is one error', () => {
  // Both lists come from one file: a version error there must not be reported once per list.
  const dir = withFiles({ builds: { templates: [], synergies: [], dataVersion: 2 } });
  const result = validate(dir);
  assertOnlyRule(result, 1, { file: 'builds.json' });
  assert.equal(result.errors.length, 1, result.errors.map(formatProblem).join('\n'));
});

// ---- rule 2: ids across all the files

test('rule 2: a template id that is already an entry id is named (ids are unique across all files)', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ id: 'sample-key' })] } });
  assertOnlyRule(validate(dir), 2, { file: 'builds.json', id: 'sample-key' });
});

test('rule 2: a Place id that is an entry id is named (the Place-equals-entry case)', () => {
  const dir = withFiles({ places: { places: [goodPlace({ id: 'sample-key', kind: 'bench' })] } });
  assertOnlyRule(validate(dir), 2, { file: 'places.json', id: 'sample-key' });
});

test('rule 2: a Place id that is a synergy id in builds.json is named', () => {
  const dir = withFiles({
    builds: { synergies: [goodSynergy({ id: 'sample-place-clash' })] },
    places: { places: [goodPlace({ id: 'sample-place-clash' })] },
  });
  assertOnlyRule(validate(dir), 2, { file: 'places.json', id: 'sample-place-clash' });
});

test('rule 2: a synergy id that is not a slug is named', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ id: 'Sample Synergy' })] } });
  assertOnlyRule(validate(dir), 2, { file: 'builds.json', id: 'Sample Synergy' });
});

test('rule 2: a template with no id is named by its position', () => {
  const template = goodTemplate();
  delete template.id;
  const dir = withFiles({ builds: { templates: [template] } });
  const result = validate(dir);
  assertOnlyRule(result, 2, { file: 'builds.json' });
  assert.ok(result.errors.some((e) => e.position === 'template number 1'), 'the position names template number 1');
});

test('rule 2: two Places with the same id are named (the second one)', () => {
  const dir = withFiles({ places: { places: [goodPlace(), goodShop({ id: 'bench-sample-one' })] } });
  assertOnlyRule(validate(dir), 2, { file: 'places.json', id: 'bench-sample-one' });
});

test('rule 2: two templates with the same id are named (the second one)', () => {
  const dir = withFiles({
    builds: { templates: [goodTemplate(), goodTemplate({ build: { red: ['sample-red-tool'] } })] },
  });
  assertOnlyRule(validate(dir), 2, { file: 'builds.json', id: 'sample-template-one' });
});

// ---- rule 15: the shape and the Crest of a template (each one alone)

test('rule 15: a template with no name is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ name: '' })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"name" must be a non-empty text/ });
});

test('rule 15: a template with no goal is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ goal: '   ' })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"goal" must be a non-empty text/ });
});

test('rule 15: a template with no editorial is an error (the choice must be made on purpose)', () => {
  const template = goodTemplate();
  delete template.editorial;
  const dir = withFiles({ builds: { templates: [template] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"editorial" must be true or false, found nothing/ });
});

test('rule 15: an editorial that is text, not true or false, is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ editorial: 'yes' })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"editorial" must be true or false, found "yes"/ });
});

test('rule 15: a template with a source that is not a web link is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ source: 'not a link' })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"source" must be a web link/ });
});

test('rule 15: a template with no build is an error', () => {
  const template = goodTemplate();
  delete template.build;
  const dir = withFiles({ builds: { templates: [template] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"build" must be an object/ });
});

test('rule 15: a build with no colours is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: {} })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"build" has no colours/ });
});

test('rule 15: a build with a colour that is not a list is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: 'sample-red-tool' } })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"build\.red" must be a list of entry ids/ });
});

test('rule 15: a template with no crestId is an error', () => {
  const template = goodTemplate();
  delete template.crestId;
  const dir = withFiles({ builds: { templates: [template] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"crestId" must be the id of a Crest/ });
});

test('rule 15: an unknown crestId is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ crestId: 'sample-no-such-crest' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"crestId" lists "sample-no-such-crest", which does not exist in items\.json/,
  });
});

test('rule 15: a crestId that is not a Crest (a Tool) is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ crestId: 'sample-key' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"crestId" lists "sample-key", which has type "tool", not "crest"/,
  });
});

test('rule 15: a crestId that is a Region id is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ crestId: 'sample-region-a' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"crestId" lists "sample-region-a", which is a Region id/,
  });
});

test('rule 15: a Crest with slots but no slotsMax is an error (its fit cannot be checked)', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ crestId: 'sample-crest-two', build: { red: ['sample-red-tool'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"sample-crest-two" is a Crest without both "slots" and "slotsMax"/,
  });
});

test('rule 15: a Crest with slotsMax but no slots is a rule 15 error, and rule 13 names the slotsMax', () => {
  // sample-crest-four has slots and slotsMax. Without slots, slotsMax is a rule 13 error, and the template
  // cannot be fitted either: both are reported, and the fit check is skipped (the gate is rule 13).
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-crest-four').slots;
  });
  writeBuilds(dir, { templates: [goodTemplate({ crestId: 'sample-crest-four', build: { blue: ['sample-blue-tool'] } })] });
  const result = validate(dir);
  assert.deepEqual(result.errors.map((e) => String(e.rule)).sort(), ['13', '15'], result.errors.map(formatProblem).join('\n'));
  assert.ok(result.errors.some((e) => e.rule === 13 && /"slotsMax" is given without "slots"/.test(e.message)));
  assert.ok(result.errors.some((e) => e.rule === 15 && /"sample-crest-four" is a Crest without both "slots" and "slotsMax"/.test(e.message)));
});

test('rule 15: a Crest with no slots at all is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ crestId: 'sample-crest', build: { red: ['sample-red-tool'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"sample-crest" is a Crest without both "slots" and "slotsMax"/,
  });
});

// ---- rule 15: the ids of a template's Build (each one alone)

test('rule 15: a colour key that is not a colour is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-red-tool'], green: ['sample-blue-tool'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build" has the key "green", which is not a colour/,
  });
});

test('rule 15: an empty list of ids in a colour is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: [] } })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"build\.red" has 0 ids/ });
});

test('rule 15: 13 ids in one colour is an error (a colour holds at most 12)', () => {
  // Thirteen distinct entries, none an upgrade, so only the count is wrong. The fit check is skipped.
  const thirteen = [
    'sample-ability', 'sample-key', 'sample-door', 'sample-shard', 'sample-boss', 'sample-charm', 'sample-lever',
    'sample-crest', 'sample-flea', 'sample-quest', 'sample-tool-two', 'sample-skill', 'sample-shard-two',
  ];
  assert.equal(thirteen.length, 13);
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: thirteen } })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-template-one', text: /"build\.red" has 13 ids\. A colour holds 1 to 12/ });
});

test('rule 15: the same id in two colours is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-red-tool'], blue: ['sample-red-tool'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.blue" lists "sample-red-tool" again/,
  });
});

test('rule 15: the same id twice in one colour is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-red-tool', 'sample-red-tool'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.red" lists "sample-red-tool" again/,
  });
});

test('rule 15: an upgraded entry (upgradeOf) is refused, and the message names its base', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-red-tool-plus'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /an upgraded entry\. A saved Build stores base ids, so list "sample-red-tool" instead/,
  });
});

test('rule 15: a Region id in a build is an error (a Build holds entry ids)', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-region-a'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.red" lists "sample-region-a", which is a Region id/,
  });
});

test('rule 15: an id that is not in items.json is an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-no-such-entry'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.red" lists "sample-no-such-entry", which does not exist in items\.json/,
  });
});

// ---- rule 15: the fit check (checkBuild with every slot opened and every grantsSlots entry done)

test('rule 15: a Tool of the wrong colour (a blue Tool under red) does not fit, and the message says so', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-blue-tool'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.red" lists "sample-blue-tool", which does not fit red slots: it is a blue Tool/,
  });
});

test('rule 15: one id more than the Crest holds at its most is an error, and the message gives the count', () => {
  // sample-crest-one has one red slot, no red room to open (slotsMax red is 1) and no red grant in the sample.
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-red-tool', 'sample-red-tool-two'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.red" has no room for "sample-red-tool-two"\. With every slot opened and every grantsSlots entry done, the Crest has 1 red slot/,
  });
});

test('rule 15: a silk skill under a colour that is not white does not fit', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { blue: ['sample-skill'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.blue" lists "sample-skill", which does not fit blue slots: a Silk Skill fits white slots only/,
  });
});

test('rule 15: a Tool with no toolColor cannot be placed in any colour', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-key'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.red" lists "sample-key", which does not fit red slots: a Tool with no toolColor cannot be placed/,
  });
});

test('rule 15: a template that fits only with every slot opened passes (checked at slotsMax)', () => {
  // Without the grant, sample-crest-one has one blue slot and room for one more only when it is opened.
  // The two blue Tools need that opened slot. The validator opens every slot, so it passes.
  const dir = copySample();
  addEntry(dir, { id: 'sample-blue-tool-two', name: 'Sample blue tool two', toolColor: 'blue' });
  edit(dir, 'items.json', (json) => {
    delete entry(json, 'sample-slot-upgrade').grantsSlots;
  });
  writeBuilds(dir, { templates: [goodTemplate({ build: { blue: ['sample-blue-tool', 'sample-blue-tool-two'] } })] });
  // The premise: with nothing opened, the second blue Tool has no room (checkBuild is the picker's own code).
  const items = JSON.parse(readFileSync(path.join(dir, 'items.json'), 'utf8')).items;
  const ids = new Set(items.map((item) => item.id));
  const withNothingOpened = checkBuild('sample-crest-one', { blue: ['sample-blue-tool', 'sample-blue-tool-two'] }, ids, items, undefined);
  assert.deepEqual(withNothingOpened, [{ id: 'sample-blue-tool-two', problem: 'no-room' }]);
  assertClean(validate(dir));
});

test('rule 15: a template that fits only thanks to a grantsSlots entry passes', () => {
  // sample-crest-one has one red slot and no red room to open. The grant adds one red slot, so two red Tools fit.
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-slot-upgrade').grantsSlots.red = 1;
  });
  writeBuilds(dir, { templates: [goodTemplate({ build: { red: ['sample-red-tool', 'sample-red-tool-two'] } })] });
  assertClean(validate(dir));
});

test('rule 15: the same two red Tools without that grant have no room (the grant is what makes it pass)', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-red-tool', 'sample-red-tool-two'] } })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-template-one',
    text: /"build\.red" has no room for "sample-red-tool-two"/,
  });
});

test('rule 15: a template that names the base Tool (not its upgrade) passes', () => {
  // The base sample-red-tool is listed. The upgrade sample-red-tool-plus is never listed (see the upgrade test above).
  const dir = withFiles({ builds: { templates: [goodTemplate({ build: { red: ['sample-red-tool'] } })] } });
  assertClean(validate(dir));
});

// ---- rule 15: the warnings for templates

test('rule 15: two templates for the same Crest with the same ids in the same colours warn once, on the second', () => {
  const dir = withFiles({
    builds: { templates: [goodTemplate(), goodTemplate({ id: 'sample-template-two', name: 'Sample template two' })] },
  });
  const result = validate(dir);
  assertOnlyWarningRule(result, 15, { file: 'builds.json', id: 'sample-template-two' });
  assert.equal(result.warnings.length, 1, result.warnings.map(formatProblem).join('\n'));
  assert.match(result.warnings[0].message, /the same Crest and the same ids in the same colours as "sample-template-one"/);
});

test('rule 15: the same ids in a different order inside one colour are the same Build and warn', () => {
  const dir = copySample();
  addEntry(dir, { id: 'sample-blue-tool-two', name: 'Sample blue tool two', toolColor: 'blue' });
  writeBuilds(dir, {
    templates: [
      goodTemplate({ build: { blue: ['sample-blue-tool', 'sample-blue-tool-two'] } }),
      goodTemplate({ id: 'sample-template-two', build: { blue: ['sample-blue-tool-two', 'sample-blue-tool'] } }),
    ],
  });
  const result = validate(dir);
  assertOnlyWarningRule(result, 15, { file: 'builds.json', id: 'sample-template-two' });
});

test('rule 15: the same ids for two different Crests are not a repeat (no warning)', () => {
  const dir = withFiles({
    builds: {
      templates: [
        goodTemplate({ build: { blue: ['sample-blue-tool'] } }),
        goodTemplate({ id: 'sample-template-two', crestId: 'sample-crest-four', build: { blue: ['sample-blue-tool'] } }),
      ],
    },
  });
  assertClean(validate(dir));
});

// ---- rule 15: the rule 10 length warnings for goal and effect

test('rule 10: a template goal over 200 characters is a warning, not an error', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ goal: 'a'.repeat(201) })] } });
  const result = validate(dir);
  assertOnlyWarningRule(result, 10, { file: 'builds.json', id: 'sample-template-one' });
  assert.equal(result.warnings.length, 1);
});

test('rule 10: a template goal of exactly 200 characters gives no warning', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ goal: 'a'.repeat(200) })] } });
  assertClean(validate(dir));
});

test('rule 10: a synergy effect over 200 characters is a warning, not an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ effect: 'a'.repeat(201) })] } });
  assertOnlyWarningRule(validate(dir), 10, { file: 'builds.json', id: 'sample-synergy-one' });
});

// ---- rule 15: synergies (each error alone)

test('rule 15: a synergy that pairs a Silk Skill with a Tool with a toolColor passes', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ a: 'sample-skill', b: 'sample-red-tool' })] } });
  assertClean(validate(dir));
});

test('rule 15: a synergy whose two ends are the same entry is an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ a: 'sample-red-tool', b: 'sample-red-tool' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-synergy-one',
    text: /"a" and "b" are the same entry/,
  });
});

test('rule 15: the same pair reversed is an error, and names the first synergy', () => {
  const dir = withFiles({
    builds: {
      synergies: [goodSynergy(), goodSynergy({ id: 'sample-synergy-two', a: 'sample-blue-tool', b: 'sample-red-tool' })],
    },
  });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-synergy-two',
    text: /"a" and "b" are the same pair as "sample-synergy-one"/,
  });
});

test('rule 15: a Crest used as a synergy end is an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ a: 'sample-crest-one' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-synergy-one',
    text: /"a" lists "sample-crest-one", which is neither a Tool with a toolColor nor a Silk Skill/,
  });
});

test('rule 15: an upgraded entry as a synergy end is an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ a: 'sample-red-tool-plus' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-synergy-one',
    text: /"a" lists "sample-red-tool-plus", an upgraded entry/,
  });
});

test('rule 15: a Tool with no toolColor as a synergy end is an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ b: 'sample-key' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-synergy-one',
    text: /"b" lists "sample-key", which is neither a Tool with a toolColor nor a Silk Skill/,
  });
});

test('rule 15: an unknown id as a synergy end is an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ b: 'sample-no-such-entry' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-synergy-one',
    text: /"b" lists "sample-no-such-entry", which does not exist in items\.json/,
  });
});

test('rule 15: a Region id as a synergy end is an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ b: 'sample-region-a' })] } });
  assertOneError(validate(dir), 15, {
    file: 'builds.json',
    id: 'sample-synergy-one',
    text: /"b" lists "sample-region-a", which is a Region id/,
  });
});

test('rule 15: a synergy with an empty effect is an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ effect: '' })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-synergy-one', text: /"effect" must be a non-empty text/ });
});

test('rule 15: a synergy source that is not a web link is an error', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ source: 'sample' })] } });
  assertOneError(validate(dir), 15, { file: 'builds.json', id: 'sample-synergy-one', text: /"source" must be a web link/ });
});

// ---- rule 15: a rule 13 or rule 3 error skips the fit check, and nothing crashes

test('rule 15: with a rule 13 error present, the fit check is skipped and only the rule 13 error is reported', () => {
  // sample-crest-one's red slot count becomes text. The template below would have no room for its second red
  // Tool, but the fit check does not run on a Crest whose fields are broken (rule 13), so only rule 13 fires.
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-crest-one').slots.red = '2';
  });
  writeBuilds(dir, { templates: [goodTemplate({ build: { red: ['sample-red-tool', 'sample-red-tool-two'] } })] });
  const result = validate(dir);
  assertOnlyRule(result, 13, { file: 'items.json', id: 'sample-crest-one' });
  assert.equal(result.errors.length, 1, result.errors.map(formatProblem).join('\n'));
});

test('rule 15: with a rule 3 error present, the fit check is skipped and only the rule 3 error is reported', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').requires.push('sample-no-such-entry');
  });
  writeBuilds(dir, { templates: [goodTemplate({ build: { red: ['sample-red-tool', 'sample-red-tool-two'] } })] });
  assertOnlyRule(validate(dir), 3, { file: 'items.json', id: 'sample-key' });
});

test('rule 15: a shape error in another file does not skip the fit check (the gate is rules 1 to 5 and 13 only)', () => {
  // endings.json has no list: a shape error, which is not in the gate. The fit check still runs on the template.
  const dir = copySample();
  writeFileSync(path.join(dir, 'endings.json'), JSON.stringify({ dataVersion: 3, endings: 'not a list' }));
  writeBuilds(dir, { templates: [goodTemplate({ build: { red: ['sample-red-tool', 'sample-red-tool-two'] } })] });
  const result = validate(dir);
  assert.deepEqual(result.errors.map((e) => String(e.rule)).sort(), ['15', 'shape'], result.errors.map(formatProblem).join('\n'));
  assert.ok(result.errors.some((e) => e.rule === 15 && /has no room for "sample-red-tool-two"/.test(e.message)));
});

test('rule 15: without items.json the new file gives nothing but the missing file (no crash)', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate()], synergies: [goodSynergy()] } });
  rmSync(path.join(dir, 'items.json'));
  assertOnlyRule(validate(dir), 1, { file: 'items.json' });
});

// ---- rule 16: Places (each error alone)

test('rule 16: a valid Place with a requires that names an entry is clean', () => {
  const dir = withFiles({ places: { places: [goodPlace({ requires: ['sample-key'] })] } });
  assertClean(validate(dir));
});

test('rule 16: a Place kind that is not on the list is an error', () => {
  const dir = withFiles({ places: { places: [goodPlace({ kind: 'hut' })] } });
  assertOneError(validate(dir), 16, {
    file: 'places.json',
    id: 'bench-sample-one',
    text: /"kind" must be one of bench, bellway, shop, npc, wishboard, arena, door, other, found "hut"/,
  });
});

test('rule 16: a Place with no kind is an error', () => {
  const place = goodPlace();
  delete place.kind;
  const dir = withFiles({ places: { places: [place] } });
  assertOneError(validate(dir), 16, { file: 'places.json', id: 'bench-sample-one', text: /"kind" must be one of/ });
});

test('rule 16: a Place in a Region that does not exist is an error', () => {
  const dir = withFiles({ places: { places: [goodPlace({ regionId: 'sample-no-such-region' })] } });
  assertOneError(validate(dir), 16, {
    file: 'places.json',
    id: 'bench-sample-one',
    text: /"regionId" lists "sample-no-such-region", which does not exist/,
  });
});

test('rule 16: a Place whose regionId is an entry, not a Region, is an error', () => {
  const dir = withFiles({ places: { places: [goodPlace({ regionId: 'sample-key' })] } });
  assertOneError(validate(dir), 16, {
    file: 'places.json',
    id: 'bench-sample-one',
    text: /"regionId" lists "sample-key", which is an entry id/,
  });
});

test('rule 16: a Region id in a Place requires is an error (requires holds entry ids)', () => {
  const dir = withFiles({ places: { places: [goodPlace({ requires: ['sample-region-a'] })] } });
  assertOneError(validate(dir), 16, {
    file: 'places.json',
    id: 'bench-sample-one',
    text: /"requires" lists "sample-region-a", which is a Region id/,
  });
});

test('rule 16: a Place requires that is not a list is a shape error naming the Place', () => {
  const dir = withFiles({ places: { places: [goodPlace({ requires: 'sample-key' })] } });
  assertOnlyRule(validate(dir), 'shape', { file: 'places.json', id: 'bench-sample-one' });
});

test('rule 16: sells on an npc is an error (only a shop sells)', () => {
  const dir = withFiles({ places: { places: [goodPlace({ id: 'npc-sample-one', kind: 'npc', sells: ['sample-red-tool'] })] } });
  assertOneError(validate(dir), 16, {
    file: 'places.json',
    id: 'npc-sample-one',
    text: /"sells" is only for a shop \(kind "shop"\), found kind "npc"/,
  });
});

test('rule 16: a shop with an empty sells is an error', () => {
  const dir = withFiles({ places: { places: [goodShop({ sells: [] })] } });
  assertOneError(validate(dir), 16, { file: 'places.json', id: 'shop-sample-one', text: /"sells" is empty/ });
});

test('rule 16: a shop with no sells is an error', () => {
  const shop = goodShop();
  delete shop.sells;
  const dir = withFiles({ places: { places: [shop] } });
  assertOneError(validate(dir), 16, { file: 'places.json', id: 'shop-sample-one', text: /"sells" is required on a shop/ });
});

test('rule 16: an entry id twice in sells is an error', () => {
  const dir = withFiles({ places: { places: [goodShop({ sells: ['sample-red-tool-two', 'sample-red-tool-two'] })] } });
  assertOneError(validate(dir), 16, {
    file: 'places.json',
    id: 'shop-sample-one',
    text: /"sells" lists "sample-red-tool-two" twice/,
  });
});

test('rule 16: an unknown id in sells is an error', () => {
  const dir = withFiles({ places: { places: [goodShop({ sells: ['sample-no-such-entry'] })] } });
  assertOneError(validate(dir), 16, {
    file: 'places.json',
    id: 'shop-sample-one',
    text: /"sells" lists "sample-no-such-entry", which does not exist/,
  });
});

test('rule 16: a shop that sells an entry sold elsewhere too is clean (an entry may be listed by two vendors)', () => {
  const dir = withFiles({
    places: { places: [goodShop(), goodShop({ id: 'shop-sample-two', name: 'Sample shop two', regionId: 'sample-region-f' })] },
  });
  assertClean(validate(dir));
});

test('rule 16: a Place with no name is an error', () => {
  const dir = withFiles({ places: { places: [goodPlace({ name: '' })] } });
  assertOneError(validate(dir), 16, { file: 'places.json', id: 'bench-sample-one', text: /"name" must be a non-empty text/ });
});

test('rule 16: a Place with no how is an error', () => {
  const dir = withFiles({ places: { places: [goodPlace({ how: '' })] } });
  assertOneError(validate(dir), 16, { file: 'places.json', id: 'bench-sample-one', text: /"how" must be a non-empty text/ });
});

test('rule 16: a Place with no source is an error', () => {
  const place = goodPlace();
  delete place.source;
  const dir = withFiles({ places: { places: [place] } });
  assertOneError(validate(dir), 16, { file: 'places.json', id: 'bench-sample-one', text: /"source" must be a web link/ });
});

test('rule 16: an area that is not text is an error', () => {
  const dir = withFiles({ places: { places: [goodPlace({ area: 4 })] } });
  assertOneError(validate(dir), 16, { file: 'places.json', id: 'bench-sample-one', text: /"area" must be a non-empty text when it is given/ });
});

test('rule 10: a Place how over 300 characters is a warning, not an error', () => {
  const dir = withFiles({ places: { places: [goodPlace({ how: 'a'.repeat(301) })] } });
  assertOnlyWarningRule(validate(dir), 10, { file: 'places.json', id: 'bench-sample-one' });
});

test('rule 16: a places.json with no places list is a rule 16 error naming the file', () => {
  // A file that is there but has no list is a shape error, not a silent pass.
  const dir = copySample();
  writeFileSync(path.join(dir, 'places.json'), JSON.stringify({ dataVersion: 3 }));
  assertOnlyRule(validate(dir), 16, { file: 'places.json' });
});

// ---- rule 15: a builds.json with a missing list

test('rule 15: a builds.json with no synergies list is a rule 15 error naming the file', () => {
  const dir = copySample();
  writeFileSync(path.join(dir, 'builds.json'), JSON.stringify({ dataVersion: 3, templates: [] }));
  assertOnlyRule(validate(dir), 15, { file: 'builds.json' });
});

// ---- rule 16: MapGenie sources (a warning, in every file)

test('rule 16: a Hollow Knight MapGenie source on an entry is a warning that names the Silksong address', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').source = 'https://mapgenie.io/hollow-knight/maps/sample';
  });
  const result = validate(dir);
  assertOnlyWarningRule(result, 16, { file: 'items.json', id: 'sample-key' });
  assert.match(result.warnings[0].message, /not under https:\/\/mapgenie\.io\/hollow-knight-silksong\//);
});

test('rule 16: a Silksong MapGenie source on an entry is not a warning', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').source = 'https://mapgenie.io/hollow-knight-silksong/maps/sample';
  });
  assertClean(validate(dir));
});

test('rule 16: a MapGenie source on an Ending is a warning', () => {
  const dir = copySample();
  edit(dir, 'endings.json', (json) => {
    ending(json, 'sample-ending-one').source = 'https://mapgenie.io/hollow-knight/';
  });
  assertOnlyWarningRule(validate(dir), 16, { file: 'endings.json', id: 'sample-ending-one' });
});

test('rule 16: a MapGenie source on a template is a warning', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ source: 'https://mapgenie.io/hollow-knight/' })] } });
  assertOnlyWarningRule(validate(dir), 16, { file: 'builds.json', id: 'sample-template-one' });
});

test('rule 16: a MapGenie source on a synergy is a warning', () => {
  const dir = withFiles({ builds: { synergies: [goodSynergy({ source: 'https://www.mapgenie.io/hollow-knight/' })] } });
  assertOnlyWarningRule(validate(dir), 16, { file: 'builds.json', id: 'sample-synergy-one' });
});

test('rule 16: a MapGenie source on a Place is a warning', () => {
  const dir = withFiles({ places: { places: [goodPlace({ source: 'https://mapgenie.io/hollow-knight/map' })] } });
  assertOnlyWarningRule(validate(dir), 16, { file: 'places.json', id: 'bench-sample-one' });
});

test('rule 16: a Silksong MapGenie source on a Place is not a warning', () => {
  const dir = withFiles({ places: { places: [goodPlace({ source: 'https://mapgenie.io/hollow-knight-silksong/maps/sample/bench' })] } });
  assertClean(validate(dir));
});

test('rule 16: a MapGenie Silksong link written with http (not https) is still a warning (the contract names https)', () => {
  const dir = withFiles({ places: { places: [goodPlace({ source: 'http://mapgenie.io/hollow-knight-silksong/maps/sample' })] } });
  assertOnlyWarningRule(validate(dir), 16, { file: 'places.json', id: 'bench-sample-one' });
});

test('rule 16: a host that only contains mapgenie.io is not MapGenie, so no warning', () => {
  const dir = withFiles({ places: { places: [goodPlace({ source: 'https://mapgenie.io.example.invalid/hollow-knight/' })] } });
  assertClean(validate(dir));
});

test('rule 16: an upper-case host for the Silksong map is still the Silksong map (no warning)', () => {
  const dir = withFiles({ places: { places: [goodPlace({ source: 'https://MapGenie.io/hollow-knight-silksong/maps/sample' })] } });
  assertClean(validate(dir));
});

// ---- the command line for the new rules

test('rule 15: the command prints a builds.json error with file, id and rule, and exits 1', () => {
  const dir = withFiles({ builds: { templates: [goodTemplate({ crestId: 'sample-no-such-crest' })] } });
  const run = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stderr, /ERROR builds\.json, id "sample-template-one", rule 15: "crestId" lists "sample-no-such-crest"/);
});

test('rule 16: the command prints the MapGenie warning with file, id and rule, and exits 0', () => {
  const dir = copySample();
  edit(dir, 'items.json', (json) => {
    entry(json, 'sample-key').source = 'https://mapgenie.io/hollow-knight/';
  });
  const run = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stderr, /WARNING items\.json, id "sample-key", rule 16: "source" is a MapGenie page/);
  assert.match(run.stdout, /passed.*1 warning/);
});
