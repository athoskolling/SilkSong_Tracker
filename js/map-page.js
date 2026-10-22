// map-page.js: the Map page (<body data-page="map">, docs/MAP-PROPOSAL.md). Two views of the same artwork:
// the full map of Pharloom (one picture, with zoom), and one cut-out picture per Region.
//
// The pictures are Team Cherry's artwork and tell the player where everything is, so the page follows the
// project's spoiler rule: a Region's picture stays hidden until the Region is open and Visited (or something in it
// is done), and the full map sits behind one button, unless the player turns on "Show everything".
//
// Same split as the other pages: this file asks data.js, progress.js and requirements.js, turns the answers
// into a plain "view" object, and map-render.js draws it. main.js is loaded on this page too, and does what
// every page does (sample banner, the sync line in the footer, the email sign-in link).

import { loadData, loadMap, imageUrl } from './data.js';
import { configureProgress, loadProgress, onProgressChange } from './progress.js';
import { isRegionAvailable } from './requirements.js';
import { renderMessage } from './render.js';
import { renderMapShell, renderMapBody, applyMapZoom, scrollToHighlight, ZOOM_STEPS } from './map-render.js';

run();

async function run() {
  const app = document.getElementById('app');
  try {
    await runMapPage(app);
  } catch (error) {
    // A data bug throws on purpose (for example a cycle in `requires`); say so instead of a blank page.
    console.error(error);
    document.title = 'Something went wrong | Silksong guide';
    renderMessage(app, {
      heading: 'Something went wrong',
      paragraphs: [`The page could not be built: ${error.message}`, 'Reload the page. If it happens again, tell the person who maintains the guide.'],
    });
  }
}

async function runMapPage(app) {
  let data;
  try {
    data = await loadData();
  } catch (error) {
    document.title = 'Guide data not loaded | Silksong guide';
    renderMessage(app, { heading: 'The guide could not be loaded', paragraphs: [error.message] });
    return;
  }
  const { regions, items, dataVersion, sample } = data;
  configureProgress({ items, dataVersion, sample });
  document.title = 'Map | Silksong guide';

  // Optional file: a failure here never blocks the page (data.js), it only means "no map to show".
  const mapFile = await loadMap();
  if (mapFile.error) console.error(mapFile.error);

  const mapByRegion = new Map(mapFile.regions.map((entry) => [entry.regionId, entry]));
  const params = new URLSearchParams(location.search);

  const state = {
    done: new Set(),
    visited: new Set(),
    mode: params.get('view') === 'regions' ? 'regions' : params.has('region') ? 'regions' : 'full',
    regionId: null,
    showAll: false,
    fullRevealed: false, // the player pressed "Show the full map" on this visit
    zoom: 0, // an index into ZOOM_STEPS
    locate: null, // a Region id to outline on the full map
  };
  // Regions that have a map, in the guide's order.
  const mappedRegions = regions.filter((region) => mapByRegion.has(region.id));
  const wanted = params.get('region');
  state.regionId = mappedRegions.some((region) => region.id === wanted) ? wanted : mappedRegions.length ? mappedRegions[0].id : null;

  // Same spoiler rule as the Region page and the Trackers page.
  function isRevealed(regionId) {
    if (state.showAll) return true;
    if (!isRegionAvailable(regionId, state.done, regions)) return false;
    if (state.visited.has(regionId)) return true;
    return items.some((item) => item.regionId === regionId && state.done.has(item.id));
  }

  function buildView() {
    const full = mapFile.full;
    const hasMap = Boolean(full) && mappedRegions.length > 0;
    const view = {
      mode: state.mode,
      hasMap,
      error: mapFile.error ? 'Reload the page to try again.' : '',
      showAll: state.showAll,
      credit: full ? full.credit : '',
      selectedId: state.regionId,
      regions: mappedRegions.map((region) => ({ id: region.id, name: region.name })),
      selected: null,
      full: null,
    };
    if (!hasMap) return view;

    const wide = Number(full.width);
    const tall = Number(full.height);
    const outlined = state.locate ? mapByRegion.get(state.locate) : null;
    view.full = {
      src: imageUrl(full.image),
      width: wide,
      height: tall,
      alt: full.alt,
      shown: state.fullRevealed || state.showAll,
      zoom: state.zoom,
      highlight: outlined
        ? {
            left: (outlined.box[0] / wide) * 100,
            top: (outlined.box[1] / tall) * 100,
            width: ((outlined.box[2] - outlined.box[0]) / wide) * 100,
            height: ((outlined.box[3] - outlined.box[1]) / tall) * 100,
          }
        : null,
      highlightName: outlined ? (regions.find((region) => region.id === outlined.regionId) || {}).name || '' : '',
    };

    const region = regions.find((candidate) => candidate.id === state.regionId);
    const entry = state.regionId ? mapByRegion.get(state.regionId) : null;
    if (region && entry) {
      view.selected = {
        id: region.id,
        name: region.name,
        revealed: isRevealed(region.id),
        src: imageUrl(entry.image),
        width: entry.width,
        height: entry.height,
        alt: `Map of ${region.name}, cut from the map of Pharloom.`,
      };
    }
    return view;
  }

  const body = renderMapShell(app);
  const announcer = document.getElementById('announcer');

  function draw() {
    renderMapBody(body, buildView());
  }

  // ---------------------------------------------------------------- events

  body.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    if (action === 'show-mode') {
      state.mode = target.getAttribute('data-mode') === 'regions' ? 'regions' : 'full';
      draw();
    } else if (action === 'reveal-full') {
      state.fullRevealed = true;
      draw();
      if (state.locate) scrollToHighlight(body);
    } else if (action === 'zoom-in' || action === 'zoom-out' || action === 'zoom-fit') {
      state.zoom = action === 'zoom-fit' ? 0 : Math.max(0, Math.min(ZOOM_STEPS.length - 1, state.zoom + (action === 'zoom-in' ? 1 : -1)));
      applyMapZoom(body, buildView().full);
    } else if (action === 'locate-region') {
      state.locate = target.getAttribute('data-region-id');
      state.mode = 'full';
      state.zoom = 2; // far enough in to see the outlined part
      draw();
      scrollToHighlight(body);
    }
  });

  body.addEventListener('change', (event) => {
    const target = event.target;
    const action = target.getAttribute && target.getAttribute('data-action');
    if (action === 'select-region') {
      state.regionId = target.value;
      draw();
    } else if (action === 'show-all') {
      state.showAll = target.checked;
      draw();
      announcer.textContent = state.showAll ? 'Everything is shown, spoilers included.' : 'Spoilers are hidden again.';
    }
  });

  // Progress decides which Region pictures are shown, so a change (including one from another device) redraws.
  // It redraws only when the set of revealed Regions changes, so a sync that changes nothing here does not
  // throw away the player's zoom and place in the map.
  const revealedKey = () => mappedRegions.filter((region) => isRevealed(region.id)).map((region) => region.id).join(',');
  onProgressChange((progress) => {
    const before = revealedKey();
    state.done = progress.done;
    state.visited = progress.visited;
    if (revealedKey() !== before) draw();
  });
  const progress = await loadProgress();
  state.done = progress.done;
  state.visited = progress.visited;
  draw();
}
