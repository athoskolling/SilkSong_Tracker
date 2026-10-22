// data.js: loads the guide content (data/*.json). Content only; Progress is progress.js.
// See docs/CONTRACTS.md section 1 for the shapes.

// "?data=sample" loads data/sample/ instead of data/ (a development switch for layout work
// before the real files exist). The sample is invented, so the page shows a banner.
export function isSampleMode(search = globalThis.location ? globalThis.location.search : '') {
  return new URLSearchParams(search).get('data') === 'sample';
}

// Resolved against this module's own address, so it works from any page and under
// /<repository>/ on GitHub Pages without writing a leading slash.
function siteUrl(path) {
  return new URL('../' + path, import.meta.url);
}

// Turns a Region's relative heroImage path (for example "img/regions/deep-docks.jpg") into a URL
// the browser can load from any page.
export function imageUrl(path) {
  return siteUrl(path).href;
}

// A plain failure we can show the player: it says which file and what to do.
export class DataLoadError extends Error {}

async function loadFile(folder, name) {
  const path = `${folder}/${name}.json`;
  let response;
  try {
    // no-cache = ask the server if the file changed (cheap, uses the ETag), so a content update
    // shows on the next load instead of after GitHub Pages' ten-minute browser cache.
    response = await fetch(siteUrl(path), { cache: 'no-cache' });
  } catch {
    throw new DataLoadError(
      `Guide data could not be loaded: ${path} could not be reached. Check your connection and reload the page.`
    );
  }
  if (response.status === 404) {
    const missing = new DataLoadError(`Guide data could not be loaded: ${path} is missing.`);
    missing.notFound = true; // lets the optional loaders treat a 404 as "not shipped yet"
    throw missing;
  }
  if (!response.ok) {
    throw new DataLoadError(
      `Guide data could not be loaded: ${path} answered with status ${response.status}. Reload the page to try again.`
    );
  }
  let json;
  try {
    json = await response.json();
  } catch {
    throw new DataLoadError(`Guide data could not be loaded: ${path} is not valid JSON.`);
  }
  return { path, json };
}

// Each file is { dataVersion, <listKey>: [...] }.
function listFrom({ path, json }, listKey) {
  if (!json || !Array.isArray(json[listKey])) {
    throw new DataLoadError(`Guide data could not be loaded: ${path} has no "${listKey}" list.`);
  }
  return json[listKey];
}

// Returns { regions, items, endings, dataVersion, sample }.
// "regions" is sorted by `order`, so "the first Region" is well defined.
export async function loadData() {
  const sample = isSampleMode();
  const folder = sample ? 'data/sample' : 'data';

  const [regionsFile, itemsFile, endingsFile] = await Promise.all([
    loadFile(folder, 'regions'),
    loadFile(folder, 'items'),
    loadFile(folder, 'endings'),
  ]);

  const regions = listFrom(regionsFile, 'regions')
    .slice()
    .sort((a, b) => a.order - b.order);
  const items = listFrom(itemsFile, 'items');
  const endings = listFrom(endingsFile, 'endings');

  // All three files carry the same dataVersion (contract section 1); the validator enforces that.
  // The page only needs one number to hand to configureProgress.
  const dataVersion = Number.isInteger(regionsFile.json.dataVersion) ? regionsFile.json.dataVersion : null;

  return { regions, items, endings, dataVersion, sample };
}

// Optional files (Places, Build templates). They may not be shipped yet, and they are never
// needed to show a page, so a failure here must never block it:
//   - 404 = "not shipped yet": empty lists, error null.
//   - any other failure (network, status, bad JSON, wrong shape): empty lists, and `error` holds
//     the reason so a page can show one small line if it wants to. It never rejects.
// A page calls these only after loadData() and only the page that needs the file calls them.
async function loadOptionalFile(name, listKeys) {
  const folder = isSampleMode() ? 'data/sample' : 'data';
  const empty = { dataVersion: null, error: null };
  for (const key of listKeys) empty[key] = [];
  let file;
  try {
    file = await loadFile(folder, name);
  } catch (error) {
    // loadFile marks a 404 with notFound, so the two cases are told apart without a second request.
    return error.notFound ? empty : { ...empty, error: error.message };
  }
  const result = { ...empty };
  for (const key of listKeys) {
    if (!file.json || !Array.isArray(file.json[key])) {
      return { ...empty, error: `Guide data could not be loaded: ${file.path} has no "${key}" list.` };
    }
    result[key] = file.json[key];
  }
  result.dataVersion = Number.isInteger(file.json.dataVersion) ? file.json.dataVersion : null;
  return result;
}

// Returns { places, dataVersion, error }.
export function loadPlaces() {
  return loadOptionalFile('places', ['places']);
}

// Returns { templates, synergies, dataVersion, error }. The file is data/builds.json.
export function loadTemplates() {
  return loadOptionalFile('builds', ['templates', 'synergies']);
}

// Returns { maps, pins, dataVersion, error }. The file is data/map.json (docs/MAP-PROPOSAL.md). Same rules as
// the other optional files: a missing file is "no maps yet", and a failure never blocks the page.
export function loadMap() {
  return loadOptionalFile('map', ['maps', 'pins']);
}

// Keeps ?data=sample on links between pages while the switch is on.
export function pageHref(page, params = {}, sample = isSampleMode()) {
  const query = new URLSearchParams(params);
  if (sample) query.set('data', 'sample');
  const text = query.toString();
  return text ? `${page}?${text}` : page;
}
