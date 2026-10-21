#!/usr/bin/env node
// Checks the game data against docs/CONTRACTS.md section 6.
//
//   node scripts/validate-data.js             checks data/
//   node scripts/validate-data.js data/sample checks another folder (relative to where you run it)
//
// Errors exit with code 1. Warnings are printed and do not fail the check.
// Every problem names the file, the id (or the position, when the entry has no id) and the rule.
//
// Rule numbers are the ones in docs/CONTRACTS.md section 6:
//   1  each file parses and has an integer dataVersion; the versions are equal (builds.json and
//      places.json too, when they exist)
//   2  ids are lowercase slugs, unique across all the files (templates, synergies and Places too)
//   3  regionId and every id in requires, unlocks and conditions exist, and are of the right kind
//   4  no loop in requires (an entry also needs its Region's requires)
//   5  step is a unique integer across all entries
//   6  kind is collectible or task; missable needs a missableNote; a Task never has counts: true;
//      optional (bosses) is true or false, and only on a Task
//   7  every entry has a name, how and a web link as source
//   8  a Region's heroImage has a credit, a relative .jpg or .png path, and the file exists
//   9  locksOut names existing Ending ids, and an Ending never locks itself out
//  10  warning: how over 300 characters (entries and Places), effect over 200 (entries and synergies),
//      goal over 200 (templates): pasted wiki text
//  11  the field shapes of section 1, including counts, price and toolColor. Printed as
//      "rule shape", the label this check has always had
//  12  warning: a Collectible's type is on the approved list, checked against counts
//  13  the Build fields (Phase 5, second round): errors for the shape and links of slots, slotsMax,
//      grantsSlots, upgradeOf (including loops through it) and effect; warnings for an upgrade that
//      counts, a toolColor on a non-Tool, and an upgrade whose colour differs from its base's
//  14  warning: an Ending condition is not on the Route (routeIds). Runs only when rules 1 to 5 pass
//      and every requires list is a list of ids, because routeIds cannot read anything else
//  15  builds.json (Phase 5, third round, ADR 0007, optional file): the shape and links of each
//      template and synergy; each template's Build fits its Crest with every slot opened and every
//      grantsSlots entry done (checkBuild from js/builds.js, the picker's own code); warning for a
//      repeated template. The fit check runs only when rules 1 to 5 and 13 found nothing
//  16  places.json (Phase 5, third round, ADR 0007, optional file): the shape of each Place, its
//      kind, Region and links (requires, sells); warning for a MapGenie source that is not the
//      Silksong map, in every file
//
// Plain Node with no dependency: the project has no build step, so the check must run anywhere
// the tests run. It imports isCounted and routeIds from js/requirements.js, which is plain ES module
// code with no imports of its own, so the counting and Route rules are written once. Likewise rule 15
// imports checkBuild and slotsFor from js/builds.js (also plain, no imports).

import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isCounted, routeIds } from '../js/requirements.js';
import { checkBuild, slotsFor } from '../js/builds.js';

// heroImage paths are relative to the site root (the folder with index.html), which is the
// repository root here, not the data folder (section 1 and 6, rule 8).
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The three core files. All three must exist (rule 1).
const COLLECTIONS = [
  { key: 'regions', file: 'regions.json', kind: 'region' },
  { key: 'items', file: 'items.json', kind: 'entry' },
  { key: 'endings', file: 'endings.json', kind: 'ending' },
];

// The optional files (ADR 0007). Each one is checked when it is there and is not a problem when it is not.
// builds.json holds two lists in one file, so it is read once; `rule` is the rule its shape errors use.
const OPTIONAL_COLLECTIONS = [
  { key: 'templates', file: 'builds.json', kind: 'template', rule: 15 },
  { key: 'synergies', file: 'builds.json', kind: 'synergy', rule: 15 },
  { key: 'places', file: 'places.json', kind: 'place', rule: 16 },
];

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ITEM_KINDS = ['collectible', 'task'];
const SPOILER_LEVELS = [0, 1, 2];
const HERO_EXTENSIONS = ['.jpg', '.png'];
const LONG_HOW = 300;
const LONG_EFFECT = 200;
const LONG_GOAL = 200;

// Rule 16: the kinds of Place (contract section 1, places.json).
const PLACE_KINDS = ['bench', 'bellway', 'shop', 'npc', 'wishboard', 'arena', 'door', 'other'];

// Rule 15: a colour of a saved Build or template holds 1 to this many ids (contract section 1; a guard, not a game fact).
const BUILD_MAX_IDS = 12;

// Rule 16: the only MapGenie page a source may cite (contract section 1, "Sources and MapGenie").
const MAPGENIE_SILKSONG = 'https://mapgenie.io/hollow-knight-silksong/';

// Rule 15's fit check runs only when none of these rules reported an error: checkBuild reads the
// records and the Build fields they check (contract section 6, rule 15).
const FIT_GATE_RULES = [1, 2, 3, 4, 5, 13];

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

// Tracked-only types (Phase 5, ADR 0005): Collectibles the game does not count toward 100 percent.
// An entry of one of these types is counted only if it says "counts": false. The last five come from
// the Mementos and Equipment sheet (docs/PHASE-5-SHEET-2-MEMENTOS-EQUIPMENT-SHOPS.md, section 2.2).
// Fleas are not on this list on purpose: they are Tasks, and Task types are free.
const TRACKED_TYPES = ['memento', 'relic', 'map', 'map-tool', 'memory-locket', 'key', 'key-item', 'furnishing'];

// The colours of Tools (contract section 1, toolColor). The colour decides which Crest slots a Tool fits.
const TOOL_COLORS = ['red', 'blue', 'yellow'];

// The four colours of a Crest's slots and of grantsSlots (rule 13). White slots take Silk Skills.
const SLOT_COLORS = ['red', 'blue', 'yellow', 'white'];

const KIND_NAME = { region: 'Region', entry: 'entry', ending: 'Ending', template: 'template', synergy: 'synergy', place: 'Place' };
const KIND_ID = {
  region: 'a Region id',
  entry: 'an entry id',
  ending: 'an Ending id',
  template: 'a template id',
  synergy: 'a synergy id',
  place: 'a Place id',
};
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

// A list of ids is an array of text. Anything else is a shape error (checkIdList reports it).
function isIdList(value) {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
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

// Keeps the lists apart. A file that cannot be read gives list === null, and every check that would need
// it is skipped, so one broken file does not flood the report with false errors. The optional files
// (ADR 0007) are read only when they exist; when one is absent its lists are null, which the checks
// already treat as "nothing to check". builds.json holds two lists, so it is read once for both.
function loadCollections(dir, report) {
  const docs = new Map();
  const read = (file) => {
    if (!docs.has(file)) docs.set(file, readJson(path.join(dir, file), file, report));
    return docs.get(file);
  };
  const core = COLLECTIONS.map((spec) => listOf(spec, read(spec.file), report, false));
  const optional = OPTIONAL_COLLECTIONS.map((spec) => {
    if (!existsSync(path.join(dir, spec.file))) return { ...spec, doc: null, list: null, optional: true };
    return listOf(spec, read(spec.file), report, true);
  });
  return [...core, ...optional];
}

// The list named by spec.key in a file's document. A document with no such array is a shape error,
// reported under the rule that owns the list (rule 15 or 16 for the optional files, "shape" otherwise).
function listOf(spec, doc, report, optional) {
  let list = null;
  if (doc && Array.isArray(doc[spec.key])) list = doc[spec.key];
  else if (doc) report.error(spec.rule ?? 'shape', fileRef(spec.file), `there must be an array named "${spec.key}".`);
  return { ...spec, doc, list, optional };
}

// One collection per list, so a file read for two lists (builds.json) must be counted once here.
function filesRead(collections) {
  const seen = new Map();
  for (const c of collections) {
    if (c.doc && !seen.has(c.file)) seen.set(c.file, c);
  }
  return [...seen.values()];
}

// ------------------------------------------------------------------ rule 1: versions

// Every file has an integer dataVersion, and all of them are the same number (one version for data/).
function checkVersions(collections, report) {
  const withDoc = filesRead(collections);
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

// Every id is a lowercase slug and is used once across all the files (rule 2).
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
        report.error(2, ref, 'has no id. Every Region, entry, Ending, template, synergy and Place needs a permanent slug id.');
        return;
      }
      if (!SLUG.test(record.id)) {
        report.error(2, ref, `id "${record.id}" is not a lowercase slug (a-z and 0-9, words joined by single hyphens).`);
      }
      const owner = owners.get(record.id);
      if (owner) {
        report.error(2, ref, `id "${record.id}" is already used in ${owner.file} (as ${KIND_ID[owner.kind]}). Ids must be unique across all the data files.`);
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
  if (!isIdList(value)) {
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
    checkTrackingFields(ctx, ref, item);
    checkOptional(ctx, ref, item);
    checkBuildFields(ctx, ref, item);
    checkUniqueInteger(ctx, 5, ref, item.step, 'step', 'all entries', steps);
    if (item.spoiler !== undefined && !SPOILER_LEVELS.includes(item.spoiler)) {
      ctx.report.error('shape', ref, `"spoiler" must be 0, 1 or 2 when it is given, found ${describe(item.spoiler)}.`);
    }
    if (typeof item.how === 'string' && item.how.length > LONG_HOW) {
      ctx.report.warning(10, ref, `"how" is ${item.how.length} characters (over ${LONG_HOW}). Long text is often pasted wiki text: write it in our own words.`);
    }
    // effect is the short "what it does" line (rule 13 checks that it is text); the same length warning as how.
    if (typeof item.effect === 'string' && item.effect.length > LONG_EFFECT) {
      ctx.report.warning(10, ref, `"effect" is ${item.effect.length} characters (over ${LONG_EFFECT}). Keep it short, in our own words: "how" says where to get it, "effect" says what it does.`);
    }
    if (item.kind === 'collectible') checkCollectibleType(ctx, ref, item.type, item.counts !== false);
  });
}

// Rule 12 (warning): a Collectible type that is not on the approved list would split the
// "Collectibles by type" counts without any error, so it is only a warning. A missing type is the
// shape error's job, so this only looks at text.
//
// Which list applies depends on `counts` (Phase 5). A counted Collectible must use a counted type:
// a tracked-only type there would raise the headline number. A Collectible with counts: false may
// use a type from either list.
function checkCollectibleType(ctx, ref, type, counted) {
  if (!isText(type)) return;
  if (counted) checkCountedType(ctx, ref, type);
  else checkTrackedType(ctx, ref, type);
}

function checkCountedType(ctx, ref, type) {
  if (COLLECTIBLE_TYPES.includes(type)) return;
  if (TRACKED_TYPES.includes(type)) {
    ctx.report.warning(
      12,
      ref,
      `"type" "${type}" is a tracked-only type: the game does not count it toward 100 percent. Add "counts": false to this entry, or the headline number would include it.`
    );
    return;
  }
  reportUnapprovedType(ctx, ref, type, COLLECTIBLE_TYPES, `The approved types are: ${COLLECTIBLE_TYPES.join(', ')}.`);
}

function checkTrackedType(ctx, ref, type) {
  if (COLLECTIBLE_TYPES.includes(type) || TRACKED_TYPES.includes(type)) return;
  const both = [...COLLECTIBLE_TYPES, ...TRACKED_TYPES];
  const approvedText = `The approved types are: ${COLLECTIBLE_TYPES.join(', ')} (counted), and ${TRACKED_TYPES.join(', ')} (tracked only, for "counts": false).`;
  reportUnapprovedType(ctx, ref, type, both, approvedText);
}

// Suggests the closest of `candidates` when there is one, otherwise lists what is approved.
function reportUnapprovedType(ctx, ref, type, candidates, approvedText) {
  const suggestion = candidates.find((approved) => typeKey(approved) === typeKey(type));
  const hint = suggestion !== undefined ? `Did you mean "${suggestion}"?` : approvedText;
  ctx.report.warning(12, ref, `"type" "${type}" is not on the approved list for Collectibles. ${hint}`);
}

// The comparison used only for suggestions: lowercase, "_" as "-", and a trailing "s" dropped,
// so "Mask_Shards" and "mask-shard" find each other. It never decides whether a type is accepted.
function typeKey(type) {
  return type.toLowerCase().replace(/_/g, '-').replace(/s$/, '');
}

// Every source in every file (entries, Endings, templates, synergies, Places) goes through here.
function checkSource(ctx, rule, ref, value) {
  if (!isText(value) || !isWebLink(value)) {
    ctx.report.error(rule, ref, '"source" must be a web link (http or https) to the page it was checked against.');
    return;
  }
  warnMapGenie(ctx, ref, value);
}

// Rule 16 (warning): MapGenie may be cited for the Silksong map only, and only to show where something is
// (contract section 1, "Sources and MapGenie"). A link to any other MapGenie page, such as a Hollow Knight
// map, is most likely a wrong game, so it warns. The project cannot check what a MapGenie page shows; that
// is Athos's check in a browser.
function warnMapGenie(ctx, ref, value) {
  const url = new URL(value);
  const onMapGenie = url.hostname === 'mapgenie.io' || url.hostname.endsWith('.mapgenie.io');
  if (!onMapGenie || url.href.startsWith(MAPGENIE_SILKSONG)) return;
  ctx.report.warning(
    16,
    ref,
    `"source" is a MapGenie page that is not under ${MAPGENIE_SILKSONG}. MapGenie may be cited only for the Silksong map, and only to show where something is. A Hollow Knight map is not a source for Silksong.`
  );
}

// `rule` is the rule this field belongs to: 3 for entries, 16 for Places.
function checkRegionId(ctx, ref, value, rule = 3) {
  if (typeof value !== 'string') {
    ctx.report.error(rule, ref, '"regionId" must be the id of a Region in regions.json.');
    return;
  }
  checkReference(ctx, rule, ref, 'regionId', value, 'region');
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

// `optional` (bosses, 2026-10-20; contract section 1, rule 6) is a Task's flag: a Task that gives nothing
// on the Route. Presence is what counts, so `optional: false` on a Collectible is still an error. The two
// checks are separate, so an entry that breaks both gets both errors, one for each thing to fix.
function checkOptional(ctx, ref, item) {
  if (item.optional === undefined) return;
  if (item.kind !== 'task') {
    const kind = item.kind === undefined ? 'missing' : describe(item.kind);
    ctx.report.error(
      6,
      ref,
      `"optional" is only for a Task, but this entry's "kind" is ${kind}. Remove "optional": only a Task has it. A Collectible is on the Route by its counts, its "missable" flag and what needs it.`
    );
  }
  if (typeof item.optional !== 'boolean') {
    ctx.report.error(
      6,
      ref,
      `"optional" must be true or false when it is given, found ${describe(item.optional)}. Use true for a Task that gives nothing on the Route (a boss fought for its own sake), or leave the field out.`
    );
  }
}

// Phase 5 fields (contract section 1). Each is checked only when it is given, so existing entries,
// which have none of them, pass unchanged. `counts: true` on a Task is rule 6, not a shape error:
// it contradicts the kind, the same way missable does.
function checkTrackingFields(ctx, ref, item) {
  if (item.counts !== undefined && typeof item.counts !== 'boolean') {
    ctx.report.error('shape', ref, `"counts" must be true or false when it is given, found ${describe(item.counts)}.`);
  }
  if (item.kind === 'task' && item.counts === true) {
    ctx.report.error(6, ref, '"counts" is true on a Task. A Task never counts, so "counts" cannot be true. If the game counts it, it is a Collectible.');
  }
  // A price is a whole number of Rosaries, 1 or more. Text, a fraction or 0 would quietly make the
  // Rosaries total wrong, because the total adds the prices up, so the validator stops them here.
  if (item.price !== undefined && !(Number.isInteger(item.price) && item.price >= 1)) {
    ctx.report.error('shape', ref, `"price" must be a whole number of Rosaries, 1 or more, when it is given, found ${describe(item.price)}.`);
  }
  if (item.toolColor !== undefined && !TOOL_COLORS.includes(item.toolColor)) {
    ctx.report.error('shape', ref, `"toolColor" must be "red", "blue" or "yellow" when it is given, found ${describe(item.toolColor)}.`);
  }
}

// ------------------------------------------------------------------ rule 13: Build fields

// The Build fields (contract section 1, Phase 5 second round). Each is checked only when it is given,
// so existing entries, which have none of them, pass unchanged. Errors are about shape and links;
// warnings say what a valid value would do to the headline count or to the Build picker.
function checkBuildFields(ctx, ref, item) {
  checkCrestSlots(ctx, ref, item);
  checkGrantsSlots(ctx, ref, item);
  optionalText(ctx, 13, ref, item, 'effect');
  const base = checkUpgradeOf(ctx, ref, item);
  warnBuildFields(ctx, ref, item, base);
}

// slots and slotsMax are a Crest's own slots, so they are only for a Crest. slotsMax is the same Crest
// once every Memory Locket that fits it is spent, so it comes with slots and is never below them.
function checkCrestSlots(ctx, ref, item) {
  const slots = readSlotCounts(ctx, ref, item, 'slots');
  if (item.slotsMax === undefined) return;
  const slotsMax = readSlotCounts(ctx, ref, item, 'slotsMax');
  if (item.slots === undefined) {
    ctx.report.error(13, ref, '"slotsMax" is given without "slots". It only makes sense next to the slots the Crest starts with.');
  }
  if (slots !== null && slotsMax !== null) checkSlotsMaxNotBelowSlots(ctx, ref, slots, slotsMax);
}

// Reports a slots or slotsMax field that is on an entry that is not a Crest, or whose shape is wrong.
// Returns the object when it is right, so the caller can compare two right objects; otherwise null.
function readSlotCounts(ctx, ref, item, field) {
  const value = item[field];
  if (value === undefined) return null;
  if (item.type !== 'crest') {
    ctx.report.error(13, ref, `"${field}" is only for a Crest (type "crest"), found type ${describe(item.type)}.`);
  }
  const problem = slotCountProblem(field, value, { allColors: true });
  if (problem !== null) {
    ctx.report.error(13, ref, problem);
    return null;
  }
  return value;
}

// slotsMax is what the Crest can reach, so no colour may be lower than the matching slots value.
function checkSlotsMaxNotBelowSlots(ctx, ref, slots, slotsMax) {
  for (const colour of SLOT_COLORS) {
    if (slotsMax[colour] < slots[colour]) {
      ctx.report.error(13, ref, `"slotsMax.${colour}" is ${slotsMax[colour]}, less than "slots.${colour}" (${slots[colour]}). slotsMax cannot be below slots.`);
    }
  }
}

// grantsSlots are slots that every Crest gains once this entry is done. They are never on a Crest,
// because a Crest's own slots are its slots field.
function checkGrantsSlots(ctx, ref, item) {
  if (item.grantsSlots === undefined) return;
  const problem = slotCountProblem('grantsSlots', item.grantsSlots, { allColors: false });
  if (problem !== null) ctx.report.error(13, ref, problem);
  if (item.type === 'crest') {
    ctx.report.error(13, ref, '"grantsSlots" is on a Crest. It gives slots to every Crest once this entry is done, so it belongs on the entry that grants them.');
  }
}

// What is wrong with a slot-count object, or null when it is right. slots and slotsMax (allColors) need
// all four colours, 0 or more each. grantsSlots needs one or more colours, 1 or more each.
function slotCountProblem(field, value, { allColors }) {
  const minimum = allColors ? 0 : 1;
  const form = allColors
    ? 'an object with the keys red, blue, yellow and white, each a whole number 0 or more'
    : 'an object with one or more of the keys red, blue, yellow and white, each a whole number 1 or more';
  if (!isObject(value)) return `"${field}" must be ${form}, found ${describe(value)}.`;
  const keys = Object.keys(value);
  const unknown = keys.find((key) => !SLOT_COLORS.includes(key));
  if (unknown !== undefined) return `"${field}" has the key "${unknown}", which is not a colour. The colours are red, blue, yellow and white.`;
  if (allColors) {
    const missing = SLOT_COLORS.find((colour) => !keys.includes(colour));
    if (missing !== undefined) return `"${field}" has no "${missing}" key. It needs all four colours (use 0 for none).`;
  } else if (keys.length === 0) {
    return `"${field}" must be ${form}, found {}.`;
  }
  const bad = keys.find((key) => !(Number.isInteger(value[key]) && value[key] >= minimum));
  if (bad !== undefined) return `"${field}.${bad}" must be a whole number, ${minimum} or more, found ${describe(value[bad])}.`;
  return null;
}

// upgradeOf is the entry this one upgrades (an upgraded Tool, an evolved Crest). It must name another
// entry in items.json. Returns that entry's record when the link is usable, so the colour warning can
// read it; otherwise null. A loop through upgradeOf is checkUpgradeLoops.
function checkUpgradeOf(ctx, ref, item) {
  if (item.upgradeOf === undefined) return null;
  const id = item.upgradeOf;
  if (typeof id !== 'string') {
    ctx.report.error(13, ref, '"upgradeOf" must be the id of another entry in items.json.');
    return null;
  }
  if (id === item.id) {
    ctx.report.error(13, ref, '"upgradeOf" is this entry\'s own id. An upgrade must name the entry it upgrades.');
    return null;
  }
  const owner = ctx.owners.get(id);
  if (!owner) {
    ctx.report.error(13, ref, `"upgradeOf" lists "${id}", which does not exist in items.json.`);
    return null;
  }
  if (owner.kind !== 'entry') {
    ctx.report.error(13, ref, `"upgradeOf" lists "${id}", which is ${KIND_ID[owner.kind]}. "upgradeOf" needs an entry id from items.json.`);
    return null;
  }
  return owner.record;
}

// Warnings (rule 13). They do not fail the check, because each can be right on purpose.
function warnBuildFields(ctx, ref, item, base) {
  if (item.upgradeOf !== undefined && isCounted(item)) {
    ctx.report.warning(13, ref, '"upgradeOf" is set on a counted Collectible. The game counts a Tool once whatever its version, so an upgrade should say "counts": false, or the headline number counts the same thing twice.');
  }
  if (item.toolColor !== undefined && item.type !== 'tool') {
    ctx.report.warning(13, ref, `"toolColor" is set on an entry of type ${describe(item.type)}. Only a Tool has a colour, and the colour decides which Crest slots it fits.`);
  }
  // Both colours must be valid before they are compared: a bad value is rule 11's report, not this one.
  if (base !== null && TOOL_COLORS.includes(item.toolColor) && TOOL_COLORS.includes(base.toolColor) && item.toolColor !== base.toolColor) {
    ctx.report.warning(13, ref, `"toolColor" "${item.toolColor}" differs from the colour of its base "${base.id}", which is "${base.toolColor}". Check both: the colour decides which Crest slots the Tool fits.`);
  }
}

// Rule 13: an upgrade must not lead back into itself. Each entry has at most one upgradeOf, so the
// links form chains, and a link back into a chain still being followed is a loop. A self link and a
// link to something that is not an entry are reported by checkUpgradeOf, so they are not walked here.
function checkUpgradeLoops(ctx, collection) {
  const next = upgradeLinks(ctx, collection);
  const state = new Map(); // id -> 'inside' while its chain is being walked, 'done' once it is
  for (const start of next.keys()) {
    const chain = [];
    let id = start;
    while (next.has(id) && !state.has(id)) {
      state.set(id, 'inside');
      chain.push(id);
      id = next.get(id);
    }
    if (state.get(id) === 'inside') reportUpgradeLoop(ctx, collection.file, chain, id);
    for (const visited of chain) state.set(visited, 'done');
  }
}

// id -> the id it upgrades, for each entry whose upgradeOf is a usable link (another entry in items.json).
function upgradeLinks(ctx, collection) {
  const links = new Map();
  forEachRecord(collection, (item) => {
    if (!isObject(item) || typeof item.id !== 'string') return;
    if (ctx.owners.get(item.id).record !== item) return;
    const target = item.upgradeOf;
    if (typeof target === 'string' && target !== item.id && ctx.owners.get(target)?.kind === 'entry') {
      links.set(item.id, target);
    }
  });
  return links;
}

function reportUpgradeLoop(ctx, file, chain, id) {
  const loop = [...chain.slice(chain.indexOf(id)), id];
  ctx.report.error(
    13,
    { file, id, position: null },
    `"upgradeOf" loops back on itself: ${loop.join(' -> ')}. An upgrade cannot be its own base, directly or through other upgrades.`
  );
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

// ------------------------------------------------------------------ rule 14: Ending conditions on the Route

// Rule 14 (warning): the Route must lead to every Ending, so each condition of an Ending has to be on
// it. A condition off the Route would never be "Next on the route" and would never show in "Holding
// you up". Which entries are on the Route is routeIds (contract section 2), so the rule is not copied
// here. The fix is a contract change (Ending conditions become a root of routeIds), not a data edit,
// so this only warns and says so.
function checkEndingsOnRoute(ctx, byKey) {
  if (!canWorkOutRoute(ctx, byKey)) return;
  const onRoute = routeIds(byKey.items.list, byKey.regions.list);
  forEachRecord(byKey.endings, (ending, ref) => {
    if (!isObject(ending) || !isIdList(ending.conditions)) return;
    for (const id of ending.conditions) {
      if (onRoute.has(id)) continue;
      ctx.report.warning(
        14,
        ref,
        `"conditions" lists "${id}", which is not on the Route. The Route must lead to every Ending. Do not just edit the data: the orchestrator decides the fix (Ending conditions become a root of routeIds, a contract change).`
      );
    }
  });
}

// routeIds may run only when it can read the data: all three files loaded, no error from rules 1 to 5
// (the contract's gate, because routeIds throws on those data bugs), and a requires list of ids on every
// entry and Region. The list check goes beyond the contract's gate: a requires that is text is only a
// shape error, and routeIds would throw on each letter it reads as an id.
function canWorkOutRoute(ctx, byKey) {
  if (!ctx.complete) return false;
  if (ctx.report.errors.some((error) => typeof error.rule === 'number' && error.rule <= 5)) return false;
  return [...byKey.items.list, ...byKey.regions.list].every((record) => isObject(record) && isIdList(record.requires));
}

// ------------------------------------------------------------------ rule 15: Build templates and synergies

// builds.json (ADR 0007, contract section 1). A template is a suggested Build for one Crest; a synergy is
// two Tools (or a Tool and a Silk Skill) that work together. Both point at entries; nothing points at them.
function checkBuilds(ctx, templates, synergies) {
  // The gate is the contract's (section 6, rule 15): no error from rules 1 to 5 or 13. A Crest is only found
  // when items.json loaded, so the fit check always has the entries it reads.
  const canFit = !ctx.report.errors.some((error) => FIT_GATE_RULES.includes(error.rule));
  forEachRecord(templates, (template, ref) => checkTemplate(ctx, ref, template, canFit));
  const pairs = new Map(); // "a|b" (sorted) -> the first synergy that names the pair
  forEachRecord(synergies, (synergy, ref) => checkSynergy(ctx, ref, synergy, pairs));
  warnRepeatedTemplates(ctx, templates);
}

// A template's own checks come first. The fit check runs only when they found nothing for this template,
// so one mistake gives one error, and a Build of the wrong shape is never handed to checkBuild.
function checkTemplate(ctx, ref, template, canFit) {
  if (!isObject(template)) return;
  const errorsBefore = ctx.report.errors.length;
  requireText(ctx, 15, ref, template, 'name');
  requireText(ctx, 15, ref, template, 'goal');
  if (typeof template.goal === 'string' && template.goal.length > LONG_GOAL) {
    ctx.report.warning(10, ref, `"goal" is ${template.goal.length} characters (over ${LONG_GOAL}). Keep it short, in our own words: say what the Build is for.`);
  }
  if (typeof template.editorial !== 'boolean') {
    ctx.report.error(15, ref, `"editorial" must be true or false, found ${describe(template.editorial)}. true: the grouping is ours; false: a source recommends this Build.`);
  }
  checkSource(ctx, 15, ref, template.source);
  const crest = checkTemplateCrest(ctx, ref, template.crestId);
  checkTemplateBuild(ctx, ref, template.build);
  const clean = ctx.report.errors.length === errorsBefore;
  if (canFit && clean && crest !== null) checkTemplateFit(ctx, ref, template, crest);
}

// The Crest must be an entry of type "crest" with both slots and slotsMax (contract section 1, Template).
// Without them the fit cannot be checked, and the picker shows that Crest as "Not in the guide yet".
function checkTemplateCrest(ctx, ref, crestId) {
  if (!isText(crestId)) {
    ctx.report.error(15, ref, '"crestId" must be the id of a Crest in items.json.');
    return null;
  }
  const owner = ctx.owners.get(crestId);
  if (!owner) {
    if (ctx.complete) ctx.report.error(15, ref, `"crestId" lists "${crestId}", which does not exist in items.json.`);
    return null;
  }
  if (owner.kind !== 'entry') {
    ctx.report.error(15, ref, `"crestId" lists "${crestId}", which is ${KIND_ID[owner.kind]}. "crestId" needs the id of a Crest entry.`);
    return null;
  }
  const crest = owner.record;
  if (crest.type !== 'crest') {
    ctx.report.error(15, ref, `"crestId" lists "${crestId}", which has type ${describe(crest.type)}, not "crest".`);
    return null;
  }
  if (crest.slots === undefined || crest.slotsMax === undefined) {
    ctx.report.error(15, ref, `"crestId" "${crestId}" is a Crest without both "slots" and "slotsMax". Without them the fit cannot be checked, and the picker shows the Crest as "Not in the guide yet".`);
    return null;
  }
  return crest;
}

// The Build of a template has the shape of a saved Build (section 1): one or more colours, each a list of
// 1 to 12 entry ids, and no id twice in the template.
function checkTemplateBuild(ctx, ref, build) {
  if (!isObject(build)) {
    ctx.report.error(15, ref, '"build" must be an object with one or more of the colours red, blue, yellow and white.');
    return;
  }
  const keys = Object.keys(build);
  if (keys.length === 0) {
    ctx.report.error(15, ref, '"build" has no colours. Give at least one colour with its ids.');
    return;
  }
  for (const key of keys) {
    if (!SLOT_COLORS.includes(key)) {
      ctx.report.error(15, ref, `"build" has the key "${key}", which is not a colour. The colours are red, blue, yellow and white.`);
    }
  }
  const seen = new Set();
  for (const colour of SLOT_COLORS) {
    if (build[colour] !== undefined) checkTemplateColour(ctx, ref, colour, build[colour], seen);
  }
}

function checkTemplateColour(ctx, ref, colour, ids, seen) {
  const field = `build.${colour}`;
  if (!isIdList(ids)) {
    ctx.report.error(15, ref, `"${field}" must be a list of entry ids (text), for example ["some-id"].`);
    return;
  }
  if (ids.length === 0 || ids.length > BUILD_MAX_IDS) {
    ctx.report.error(15, ref, `"${field}" has ${ids.length} ids. A colour holds 1 to ${BUILD_MAX_IDS}.`);
  }
  for (const id of ids) {
    checkTemplateId(ctx, ref, field, id);
    if (seen.has(id)) ctx.report.error(15, ref, `"${field}" lists "${id}" again. An id appears once in a template.`);
    seen.add(id);
  }
}

// A template holds base entry ids (a saved Build stores base ids, section 1), so an upgrade is refused.
function checkTemplateId(ctx, ref, field, id) {
  const owner = ctx.owners.get(id);
  if (!owner) {
    if (ctx.complete) ctx.report.error(15, ref, `"${field}" lists "${id}", which does not exist in items.json.`);
    return;
  }
  if (owner.kind !== 'entry') {
    ctx.report.error(15, ref, `"${field}" lists "${id}", which is ${KIND_ID[owner.kind]}. A Build holds entry ids from items.json.`);
    return;
  }
  if (owner.record.upgradeOf !== undefined) {
    ctx.report.error(15, ref, `"${field}" lists "${id}", an upgraded entry. A saved Build stores base ids, so list "${owner.record.upgradeOf}" instead.`);
  }
}

// The fit check (contract section 6, rule 15). checkBuild is the picker's own code, so the validator and the
// page cannot disagree. "Fits" here means: with every slot opened (slotsMax, per colour) and every grantsSlots
// entry done. Every id is an entry at this point (checkTemplateId passed), so checkBuild reports no unknown id.
function checkTemplateFit(ctx, ref, template, crest) {
  const everyId = new Set(ctx.entries.map((item) => item.id));
  const everyOpened = { [template.crestId]: openedToMax(crest) };
  const slots = slotsFor(template.crestId, everyId, ctx.entries, everyOpened);
  const colourOf = colourOfIds(template.build);
  for (const problem of checkBuild(template.crestId, template.build, everyId, ctx.entries, everyOpened)) {
    const colour = colourOf.get(problem.id);
    const field = `build.${colour}`;
    const item = ctx.owners.get(problem.id).record;
    if (problem.problem === 'wrong-colour') {
      ctx.report.error(15, ref, `"${field}" lists "${problem.id}", which does not fit ${colour} slots: ${whyNotFit(item)}.`);
    } else if (problem.problem === 'no-room') {
      ctx.report.error(15, ref, `"${field}" has no room for "${problem.id}". With every slot opened and every grantsSlots entry done, the Crest has ${slots[colour]} ${colour} slot(s).`);
    } else {
      ctx.report.error(15, ref, `"${field}" lists "${problem.id}", which the Build cannot use (${problem.problem}).`);
    }
  }
}

// Every slot opened: for each colour, slotsMax less slots. This is the crestSlots value checkBuild reads.
function openedToMax(crest) {
  return Object.fromEntries(SLOT_COLORS.map((colour) => [colour, crest.slotsMax[colour] - crest.slots[colour]]));
}

// Which colour each id is listed under. An id is in one colour only (checkTemplateColour reports a repeat),
// so a Map from id to colour is exact.
function colourOfIds(build) {
  const colourOf = new Map();
  for (const colour of SLOT_COLORS) {
    if (!Array.isArray(build[colour])) continue;
    for (const id of build[colour]) colourOf.set(id, colour);
  }
  return colourOf;
}

function whyNotFit(item) {
  if (item.type === 'silk-skill') return 'a Silk Skill fits white slots only';
  if (item.type === 'tool' && item.toolColor !== undefined) return `it is a ${item.toolColor} Tool`;
  if (item.type === 'tool') return 'a Tool with no toolColor cannot be placed in a Build';
  return 'only Tools with a toolColor and Silk Skills go in a Build';
}

// Synergy (contract section 1): two different entries, each a Tool with a toolColor or a Silk Skill, base ids
// only, and a source that names both. A pair appears once, in either order.
function checkSynergy(ctx, ref, synergy, pairs) {
  if (!isObject(synergy)) return;
  requireText(ctx, 15, ref, synergy, 'effect');
  if (typeof synergy.effect === 'string' && synergy.effect.length > LONG_EFFECT) {
    ctx.report.warning(10, ref, `"effect" is ${synergy.effect.length} characters (over ${LONG_EFFECT}). Keep it short, in our own words: what the two do together.`);
  }
  checkSource(ctx, 15, ref, synergy.source);
  const usableA = checkSynergyEntry(ctx, ref, 'a', synergy.a);
  const usableB = checkSynergyEntry(ctx, ref, 'b', synergy.b);
  if (!usableA || !usableB) return;
  if (synergy.a === synergy.b) {
    ctx.report.error(15, ref, '"a" and "b" are the same entry. A synergy needs two different entries.');
    return;
  }
  const key = [synergy.a, synergy.b].sort().join('|');
  const first = pairs.get(key);
  if (first !== undefined) {
    ctx.report.error(15, ref, `"a" and "b" are the same pair as ${label(first)}. A pair appears once, in either order.`);
  } else {
    pairs.set(key, ref);
  }
}

function checkSynergyEntry(ctx, ref, field, id) {
  if (!isText(id)) {
    ctx.report.error(15, ref, `"${field}" must be the id of an entry: a Tool with a toolColor, or a Silk Skill.`);
    return false;
  }
  const owner = ctx.owners.get(id);
  if (!owner) {
    if (ctx.complete) ctx.report.error(15, ref, `"${field}" lists "${id}", which does not exist in items.json.`);
    return false;
  }
  if (owner.kind !== 'entry') {
    ctx.report.error(15, ref, `"${field}" lists "${id}", which is ${KIND_ID[owner.kind]}. A synergy names two entries.`);
    return false;
  }
  const item = owner.record;
  if (item.upgradeOf !== undefined) {
    ctx.report.error(15, ref, `"${field}" lists "${id}", an upgraded entry. A synergy names base entries; say which version it means in "effect".`);
    return false;
  }
  const placeable = (item.type === 'tool' && TOOL_COLORS.includes(item.toolColor)) || item.type === 'silk-skill';
  if (!placeable) {
    ctx.report.error(15, ref, `"${field}" lists "${id}", which is neither a Tool with a toolColor nor a Silk Skill. Only those go in a Build.`);
    return false;
  }
  return true;
}

// Two templates for the same Crest with the same ids in the same colours say the same thing twice (warning).
// Order inside a colour does not count: the same ids are the same Build.
function warnRepeatedTemplates(ctx, templates) {
  const first = new Map();
  forEachRecord(templates, (template, ref) => {
    if (!isObject(template) || !isText(template.crestId) || !isObject(template.build)) return;
    const key = repeatKey(template);
    if (key === null) return;
    const earlier = first.get(key);
    if (earlier !== undefined) {
      ctx.report.warning(15, ref, `this template has the same Crest and the same ids in the same colours as ${label(earlier)}. Keep one of them, or change what it lists.`);
    } else {
      first.set(key, ref);
    }
  });
}

function repeatKey(template) {
  const parts = SLOT_COLORS.filter((colour) => isIdList(template.build[colour]) && template.build[colour].length > 0).map(
    (colour) => `${colour}:${[...template.build[colour]].sort().join(',')}`
  );
  return parts.length === 0 ? null : `${template.crestId}|${parts.join(';')}`;
}

// ------------------------------------------------------------------ rule 16: Places

// places.json (ADR 0007, contract section 1). A Place is a fixed spot (a bench, a shop, an NPC). It is never
// done, never counted and has no step, so only its links are checked here: requires and sells name entries.
function checkPlaces(ctx, collection) {
  forEachRecord(collection, (place, ref) => {
    if (!isObject(place)) return;
    requireText(ctx, 16, ref, place, 'name');
    requireText(ctx, 16, ref, place, 'how');
    if (typeof place.how === 'string' && place.how.length > LONG_HOW) {
      ctx.report.warning(10, ref, `"how" is ${place.how.length} characters (over ${LONG_HOW}). Long text is often pasted wiki text: write it in our own words.`);
    }
    checkPlaceKind(ctx, ref, place.kind);
    checkRegionId(ctx, ref, place.regionId, 16);
    optionalText(ctx, 16, ref, place, 'area');
    checkIdList(ctx, 16, ref, place, 'requires', 'entry');
    checkSells(ctx, ref, place);
    checkSource(ctx, 16, ref, place.source);
  });
}

function checkPlaceKind(ctx, ref, kind) {
  if (!PLACE_KINDS.includes(kind)) {
    ctx.report.error(16, ref, `"kind" must be one of ${PLACE_KINDS.join(', ')}, found ${describe(kind)}.`);
  }
}

// sells lists the entries a shop sells, in the vendor's order. Only a shop has it, and a shop has at least one.
function checkSells(ctx, ref, place) {
  if (place.kind !== 'shop') {
    if (place.sells !== undefined) {
      ctx.report.error(16, ref, `"sells" is only for a shop (kind "shop"), found kind ${describe(place.kind)}.`);
    }
    return;
  }
  if (place.sells === undefined) {
    ctx.report.error(16, ref, '"sells" is required on a shop: list the entry ids it sells, in the vendor\'s order.');
    return;
  }
  checkIdList(ctx, 16, ref, place, 'sells', 'entry');
  if (!isIdList(place.sells)) return; // a shape error is already reported
  if (place.sells.length === 0) {
    ctx.report.error(16, ref, '"sells" is empty. A shop sells at least one entry.');
    return;
  }
  const repeat = place.sells.find((id, index) => place.sells.indexOf(id) !== index);
  if (repeat !== undefined) {
    ctx.report.error(16, ref, `"sells" lists "${repeat}" twice. A vendor lists each entry once.`);
  }
}

// ------------------------------------------------------------------ the whole check

// Checks the JSON files in `dir`: the three core files, and builds.json and places.json when they exist.
// `siteRoot` is where heroImage paths are looked up (tests point it somewhere else; the CLI never does).
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
    // Only the core files must all be readable. An absent optional file is not a problem.
    complete: collections.filter((c) => !c.optional).every((c) => c.list !== null),
    entries: byKey.items.list,
  };
  checkRegions(ctx, byKey.regions);
  checkEntries(ctx, byKey.items);
  checkEndings(ctx, byKey.endings);
  reportLoops(ctx, requirementGraph(ctx, byKey.items), byKey.items.file);
  checkUpgradeLoops(ctx, byKey.items);
  checkBuilds(ctx, byKey.templates, byKey.synergies);
  checkPlaces(ctx, byKey.places);
  // Last, so that every rule 1 to 5 error is already in the report when the gate looks at it.
  checkEndingsOnRoute(ctx, byKey);
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
