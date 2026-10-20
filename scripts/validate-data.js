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
//   1  each file parses and has an integer dataVersion; the three versions are equal
//   2  ids are lowercase slugs, unique across the three files
//   3  regionId and every id in requires, unlocks and conditions exist, and are of the right kind
//   4  no loop in requires (an entry also needs its Region's requires)
//   5  step is a unique integer across all entries
//   6  kind is collectible or task; missable needs a missableNote; a Task never has counts: true
//   7  every entry has a name, how and a web link as source
//   8  a Region's heroImage has a credit, a relative .jpg or .png path, and the file exists
//   9  locksOut names existing Ending ids, and an Ending never locks itself out
//  10  warning: how over 300 characters, effect over 200 characters (pasted wiki text)
//  11  the field shapes of section 1, including counts, price and toolColor. Printed as
//      "rule shape", the label this check has always had
//  12  warning: a Collectible's type is on the approved list, checked against counts
//  13  the Build fields (Phase 5, second round): errors for the shape and links of slots, slotsMax,
//      grantsSlots, upgradeOf (including loops through it) and effect; warnings for an upgrade that
//      counts, a toolColor on a non-Tool, and an upgrade whose colour differs from its base's
//  14  warning: an Ending condition is not on the Route (routeIds). Runs only when rules 1 to 5 pass
//      and every requires list is a list of ids, because routeIds cannot read anything else
//
// Plain Node with no dependency: the project has no build step, so the check must run anywhere
// the tests run. It imports isCounted and routeIds from js/requirements.js, which is plain ES module
// code with no imports of its own, so the counting and Route rules are written once.

import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isCounted, routeIds } from '../js/requirements.js';

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
const LONG_EFFECT = 200;

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
  checkUpgradeLoops(ctx, byKey.items);
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
