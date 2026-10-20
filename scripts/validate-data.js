#!/usr/bin/env node
// Checks the game data against docs/CONTRACTS.md section 6.
//
//   node scripts/validate-data.js             checks data/
//   node scripts/validate-data.js data/sample checks another folder (relative to where you run it)
//
// Errors exit with code 1. Warnings are printed and do not fail the check.
// Every problem names the file, the id (or the position, when the entry has no id) and the rule.
//
// Rule numbers are the ones in docs/CONTRACTS.md section 6. The label "shape" marks a check that
// comes from the field tables in section 1 but is not one of the ten rules; those are listed as
// extras in the QA handoff so the orchestrator can approve or drop them.
//
// Plain Node with no dependency: the project has no build step, so the check must run anywhere
// the tests run.

import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// heroImage paths are relative to the site root (the folder with index.html), which is the
// repository root here, not the data folder (section 1 and 6, rule 8).
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const COLLECTIONS = [
  { key: 'regions', file: 'regions.json', kind: 'region' },
  { key: 'items', file: 'items.json', kind: 'entry' },
  { key: 'endings', file: 'endings.json', kind: 'ending' },
];

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ITEM_KINDS = ['collectible', 'task'];
const SPOILER_LEVELS = [0, 1, 2];
const HERO_EXTENSIONS = ['.jpg', '.png'];
const LONG_HOW = 300;

// Rule 12: the Collectible types that count toward 100 percent (docs/CONTRACTS.md section 6). Task
// types are not on this list and stay free. `ability` (added 2026-10-20) is for a counted ability
// that is neither an Ancestral Art nor a Silk Skill, such as Needle Strike.
const COLLECTIBLE_TYPES = [
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

const KIND_NAME = { region: 'Region', entry: 'entry', ending: 'Ending' };
const KIND_ID = { region: 'a Region id', entry: 'an entry id', ending: 'an Ending id' };
const WANTED = { region: 'a Region id', entry: 'entry ids', ending: 'Ending ids' };

// ------------------------------------------------------------------ reporting

// Collects every problem instead of stopping at the first, so one run shows the whole list.
class Report {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  error(rule, ref, message) {
    this.errors.push({ rule, ...ref, message });
  }

  warning(rule, ref, message) {
    this.warnings.push({ rule, ...ref, message });
  }
}

// `ref` says where a problem is: the file, the id (null when there is none) and a position
// such as "entry number 3" for an entry that has no id, so it can still be found.
function fileRef(file) {
  return { file, id: null, position: null };
}

function refOf(collection, record, index) {
  const id = isObject(record) && typeof record.id === 'string' ? record.id : null;
  return { file: collection.file, id, position: `${KIND_NAME[collection.kind]} number ${index + 1}` };
}

export function formatProblem({ rule, file, id, position, message }) {
  let where = file;
  if (id !== null) where = `${file}, id "${id}"`;
  else if (position) where = `${file}, ${position}`;
  return `${where}, rule ${rule}: ${message}`;
}

// ------------------------------------------------------------------ small helpers

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isWebLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isFile(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function describe(value) {
  return value === undefined ? 'nothing' : JSON.stringify(value);
}

function label(ref) {
  return ref.id !== null ? `"${ref.id}"` : ref.position;
}

// Calls fn(record, ref) for every item of a collection, including ones that are not objects.
function forEachRecord(collection, fn) {
  (collection.list ?? []).forEach((record, index) => fn(record, refOf(collection, record, index)));
}

// ------------------------------------------------------------------ loading

function readJson(filePath, file, report) {
  let text;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch {
    report.error(1, fileRef(file), `the file cannot be read (looked for ${filePath}).`);
    return null;
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    report.error(1, fileRef(file), `the file is not valid JSON: ${error.message}`);
    return null;
  }
  if (!isObject(json)) {
    report.error('shape', fileRef(file), 'the top level must be a JSON object.');
    return null;
  }
  return json;
}

// Keeps the three files apart. A file that cannot be read gives list === null, and every check
// that would need it is skipped, so one broken file does not flood the report with false errors.
function loadCollections(dir, report) {
  return COLLECTIONS.map(({ key, file, kind }) => {
    const doc = readJson(path.join(dir, file), file, report);
    let list = null;
    if (doc && Array.isArray(doc[key])) list = doc[key];
    else if (doc) report.error('shape', fileRef(file), `there must be an array named "${key}".`);
    return { key, file, kind, doc, list };
  });
}

// ------------------------------------------------------------------ rule 1: versions

// Every file has an integer dataVersion, and all three are the same number (one version for data/).
function checkVersions(collections, report) {
  const withDoc = collections.filter((c) => c.doc);
  const reference = withDoc.find((c) => Number.isInteger(c.doc.dataVersion));
  for (const c of withDoc) {
    const version = c.doc.dataVersion;
    const ref = fileRef(c.file);
    if (!Number.isInteger(version)) {
      report.error(1, ref, `dataVersion must be an integer, found ${describe(version)}.`);
    } else if (version !== reference.doc.dataVersion) {
      report.error(
        1,
        ref,
        `dataVersion is ${version}, but ${reference.file} has ${reference.doc.dataVersion}. All three files must share one dataVersion.`
      );
    }
  }
}

// ------------------------------------------------------------------ rule 2: ids

// Every id is a lowercase slug and is used once across the three files.
// Returns owners: id -> { kind, file, record }, the first record that uses the id. A non-slug id
// is still recorded, so references to it resolve and only the slug problem is reported.
function collectIds(collections, report) {
  const owners = new Map();
  for (const c of collections) {
    forEachRecord(c, (record, ref) => {
      if (!isObject(record)) {
        report.error(2, ref, 'is not an object, so it cannot have an id.');
        return;
      }
      if (typeof record.id !== 'string') {
        report.error(2, ref, 'has no id. Every Region, entry and Ending needs a permanent slug id.');
        return;
      }
      if (!SLUG.test(record.id)) {
        report.error(2, ref, `id "${record.id}" is not a lowercase slug (a-z and 0-9, words joined by single hyphens).`);
      }
      const owner = owners.get(record.id);
      if (owner) {
        report.error(2, ref, `id "${record.id}" is already used in ${owner.file} (as ${KIND_ID[owner.kind]}). Ids must be unique across the three files.`);
      } else {
        owners.set(record.id, { kind: c.kind, file: c.file, record });
      }
    });
  }
  return owners;
}

// ------------------------------------------------------------------ shared field checks

// `ctx` carries what every check needs: the report, the id owners, the site root, and whether
// all three files loaded (only then can an unknown id be called a mistake).
function requireText(ctx, rule, ref, record, field) {
  if (isText(record[field])) return;
  ctx.report.error(rule, ref, `"${field}" must be a non-empty text.`);
}

function optionalText(ctx, rule, ref, record, field) {
  if (record[field] === undefined || isText(record[field])) return;
  ctx.report.error(rule, ref, `"${field}" must be a non-empty text when it is given.`);
}

// Rule 3 (or 9 for locksOut): the id must exist and be of the wanted kind.
function checkReference(ctx, rule, ref, field, id, wanted) {
  const owner = ctx.owners.get(id);
  if (!owner) {
    // With a file missing or unreadable, an unknown id may simply live in that file.
    if (ctx.complete) ctx.report.error(rule, ref, `"${field}" lists "${id}", which does not exist in any data file.`);
    return;
  }
  if (owner.kind !== wanted) {
    ctx.report.error(rule, ref, `"${field}" lists "${id}", which is ${KIND_ID[owner.kind]}. "${field}" needs ${WANTED[wanted]}.`);
  }
}

// A list of ids (requires, unlocks, conditions, locksOut). Returns the list, or [] when it is malformed.
function checkIdList(ctx, rule, ref, record, field, wanted) {
  const value = record[field];
  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) {
    ctx.report.error('shape', ref, `"${field}" must be a list of ids (text), for example ["some-id"].`);
    return [];
  }
  for (const id of value) checkReference(ctx, rule, ref, field, id, wanted);
  return value;
}

// An integer that must be unique across a collection: step for entries, order for Regions.
// `scope` is only for the message.
function checkUniqueInteger(ctx, rule, ref, value, field, scope, seen) {
  if (!Number.isInteger(value)) {
    ctx.report.error(rule, ref, `"${field}" must be an integer, found ${describe(value)}.`);
    return;
  }
  const first = seen.get(value);
  if (first) {
    ctx.report.error(rule, ref, `"${field}" ${value} is already used by ${label(first)}. ${field} must be unique across ${scope}.`);
  } else {
    seen.set(value, ref);
  }
}

// ------------------------------------------------------------------ Regions

function checkRegions(ctx, collection) {
  const orders = new Map();
  forEachRecord(collection, (region, ref) => {
    if (!isObject(region)) return;
    requireText(ctx, 'shape', ref, region, 'name');
    requireText(ctx, 'shape', ref, region, 'summary');
    checkUniqueInteger(ctx, 'shape', ref, region.order, 'order', 'all Regions', orders);
    checkIdList(ctx, 3, ref, region, 'requires', 'entry');
    checkHero(ctx, ref, region);
  });
}

// Rule 8: a Region with a hero image has a credit, a relative .jpg or .png path, and that file
// exists under the site root.
function checkHero(ctx, ref, region) {
  if (region.heroImage === undefined) return;
  if (!isText(region.heroCredit)) {
    ctx.report.error(8, ref, '"heroCredit" is required when "heroImage" is set: it is the credit line shown under the image.');
  }
  const image = region.heroImage;
  if (!isText(image)) {
    ctx.report.error(8, ref, '"heroImage" must be a non-empty path.');
    return;
  }
  if (image.startsWith('/')) {
    ctx.report.error(8, ref, `"heroImage" "${image}" starts with a slash. Use a relative path, because the site may be served from a sub-folder.`);
    return;
  }
  if (image.split('/').includes('..')) {
    ctx.report.error(8, ref, `"heroImage" "${image}" goes up with "..". Use a path inside the site.`);
    return;
  }
  if (!HERO_EXTENSIONS.some((ext) => image.endsWith(ext))) {
    ctx.report.error(8, ref, `"heroImage" "${image}" must end in .jpg or .png.`);
    return;
  }
  if (!isFile(path.join(ctx.siteRoot, image))) {
    ctx.report.error(8, ref, `"heroImage" "${image}" is not a file in the site. Paths are relative to the site root (the folder with index.html), not to the data folder.`);
  }
  optionalText(ctx, 'shape', ref, region, 'heroPosition');
}

// ------------------------------------------------------------------ entries

function checkEntries(ctx, collection) {
  const steps = new Map();
  forEachRecord(collection, (item, ref) => {
    if (!isObject(item)) return;
    requireText(ctx, 7, ref, item, 'name');
    requireText(ctx, 7, ref, item, 'how');
    checkSource(ctx, 7, ref, item.source);
    if (!ITEM_KINDS.includes(item.kind)) {
      ctx.report.error(6, ref, `"kind" must be "collectible" or "task", found ${describe(item.kind)}.`);
    }
    requireText(ctx, 'shape', ref, item, 'type');
    optionalText(ctx, 'shape', ref, item, 'area');
    checkRegionId(ctx, ref, item.regionId);
    checkIdList(ctx, 3, ref, item, 'requires', 'entry');
    if (item.unlocks !== undefined) checkIdList(ctx, 3, ref, item, 'unlocks', 'entry');
    checkMissable(ctx, ref, item);
    checkUniqueInteger(ctx, 5, ref, item.step, 'step', 'all entries', steps);
    if (item.spoiler !== undefined && !SPOILER_LEVELS.includes(item.spoiler)) {
      ctx.report.error('shape', ref, `"spoiler" must be 0, 1 or 2 when it is given, found ${describe(item.spoiler)}.`);
    }
    if (typeof item.how === 'string' && item.how.length > LONG_HOW) {
      ctx.report.warning(10, ref, `"how" is ${item.how.length} characters (over ${LONG_HOW}). Long text is often pasted wiki text: write it in our own words.`);
    }
    if (item.kind === 'collectible') checkCollectibleType(ctx, ref, item.type);
  });
}

// Rule 12 (warning): a Collectible type that is not on the approved list would split the
// "Collectibles by type" counts without any error, so it is only a warning. A missing type is the
// shape error's job, so this only looks at text.
function checkCollectibleType(ctx, ref, type) {
  if (!isText(type) || COLLECTIBLE_TYPES.includes(type)) return;
  const suggestion = COLLECTIBLE_TYPES.find((approved) => typeKey(approved) === typeKey(type));
  const hint = suggestion !== undefined
    ? `Did you mean "${suggestion}"?`
    : `The approved types are: ${COLLECTIBLE_TYPES.join(', ')}.`;
  ctx.report.warning(12, ref, `"type" "${type}" is not on the approved list for Collectibles. ${hint}`);
}

// The comparison used only for suggestions: lowercase, "_" as "-", and a trailing "s" dropped,
// so "Mask_Shards" and "mask-shard" find each other. It never decides whether a type is accepted.
function typeKey(type) {
  return type.toLowerCase().replace(/_/g, '-').replace(/s$/, '');
}

function checkSource(ctx, rule, ref, value) {
  if (!isText(value) || !isWebLink(value)) {
    ctx.report.error(rule, ref, '"source" must be a web link (http or https) to the page the entry came from.');
  }
}

function checkRegionId(ctx, ref, value) {
  if (typeof value !== 'string') {
    ctx.report.error(3, ref, '"regionId" must be the id of a Region in regions.json.');
    return;
  }
  checkReference(ctx, 3, ref, 'regionId', value, 'region');
}

function checkMissable(ctx, ref, item) {
  if (item.missable !== undefined && typeof item.missable !== 'boolean') {
    ctx.report.error(6, ref, `"missable" must be true or false, found ${describe(item.missable)}.`);
  }
  if (item.missable === true && !isText(item.missableNote)) {
    ctx.report.error(6, ref, '"missable" is true, so "missableNote" must say when and why it can be missed.');
  }
  if (item.missableNote !== undefined && typeof item.missableNote !== 'string') {
    ctx.report.error('shape', ref, '"missableNote" must be text.');
  }
}

// ------------------------------------------------------------------ Endings

function checkEndings(ctx, collection) {
  forEachRecord(collection, (ending, ref) => {
    if (!isObject(ending)) return;
    requireText(ctx, 'shape', ref, ending, 'name');
    checkSource(ctx, 'shape', ref, ending.source);
    checkIdList(ctx, 3, ref, ending, 'conditions', 'entry');
    const locks = checkIdList(ctx, 9, ref, ending, 'locksOut', 'ending');
    if (typeof ending.id === 'string' && locks.includes(ending.id)) {
      ctx.report.error(9, ref, `"locksOut" lists this ending's own id "${ending.id}". An ending cannot lock itself out.`);
    }
  });
}

// ------------------------------------------------------------------ rule 4: loops

// Each entry needs its own requires and its Region's requires (section 2). This is the graph of
// entry -> entry links that rule 4 walks. Unknown ids are left to rule 3 and skipped here, and a
// duplicate id is only looked at through its first record.
function requirementGraph(ctx, collection) {
  const graph = new Map();
  forEachRecord(collection, (item) => {
    if (!isObject(item) || typeof item.id !== 'string') return;
    if (ctx.owners.get(item.id).record !== item) return;
    const region = ctx.owners.get(item.regionId);
    const regionRequires = region && region.kind === 'region' && Array.isArray(region.record.requires) ? region.record.requires : [];
    const ownRequires = Array.isArray(item.requires) ? item.requires : [];
    const deps = [...ownRequires, ...regionRequires].filter((id) => ctx.owners.get(id)?.kind === 'entry');
    graph.set(item.id, deps);
  });
  return graph;
}

// Depth-first walk. A link to an id we are still inside of is a loop; each one is reported with
// the ids in it, in order.
function reportLoops(ctx, graph, file) {
  const state = new Map(); // id -> 'inside' while we are in it, 'done' once finished
  const path = [];

  function visit(id) {
    state.set(id, 'inside');
    path.push(id);
    for (const dep of graph.get(id) ?? []) {
      if (state.get(dep) === 'inside') {
        const loop = [...path.slice(path.indexOf(dep)), dep];
        ctx.report.error(
          4,
          { file, id: dep, position: null },
          `the requirements loop back on themselves: ${loop.join(' -> ')}. An entry also needs its Region's requires, so a loop can pass through a Region.`
        );
      } else if (!state.has(dep)) {
        visit(dep);
      }
    }
    path.pop();
    state.set(id, 'done');
  }

  for (const id of graph.keys()) {
    if (!state.has(id)) visit(id);
  }
}

// ------------------------------------------------------------------ the whole check

// Checks the three JSON files in `dir`. `siteRoot` is where heroImage paths are looked up
// (tests point it somewhere else; the CLI never does).
export function validate(dir, { siteRoot = REPO_ROOT } = {}) {
  const report = new Report();
  const collections = loadCollections(dir, report);
  checkVersions(collections, report);
  const owners = collectIds(collections, report);
  const byKey = Object.fromEntries(collections.map((c) => [c.key, c]));
  const ctx = {
    report,
    owners,
    siteRoot,
    complete: collections.every((c) => c.list !== null),
  };
  checkRegions(ctx, byKey.regions);
  checkEntries(ctx, byKey.items);
  checkEndings(ctx, byKey.endings);
  reportLoops(ctx, requirementGraph(ctx, byKey.items), byKey.items.file);
  return { errors: report.errors, warnings: report.warnings };
}

// ------------------------------------------------------------------ command line

function main(args) {
  const dir = args[0] ? path.resolve(process.cwd(), args[0]) : path.join(REPO_ROOT, 'data');
  const { errors, warnings } = validate(dir);
  for (const warning of warnings) console.warn(`WARNING ${formatProblem(warning)}`);
  for (const error of errors) console.error(`ERROR ${formatProblem(error)}`);
  if (errors.length > 0) {
    console.error(`Data check FAILED for ${dir}: ${errors.length} error(s), ${warnings.length} warning(s).`);
    return 1;
  }
  console.log(`Data check passed for ${dir}: ${warnings.length} warning(s).`);
  return 0;
}

// Run the check only when this file is the program (node scripts/validate-data.js), not when a
// test imports validate(). Real paths are compared, so a symlink to this file still runs the check
// instead of exiting 0 without checking anything.
function isRunAsCommand() {
  if (process.argv[1] === undefined) return false;
  return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
}
if (isRunAsCommand()) process.exitCode = main(process.argv.slice(2));
