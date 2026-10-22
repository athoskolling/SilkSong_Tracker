// map-page.js: the Map page (<body data-page="map">, docs/MAP-PROPOSAL.md). A Region's map shows a pin for every
// entry that is not done. The page reads Progress through progress.js like every other page, so an entry
// marked done anywhere (a Region page, a Tracker, the Goal box, another device) loses its pin here at once,
// and ticking it here removes it everywhere else. That is the whole reason the map is our own page and not an
// iframe: a page from another website could not follow our Progress.
//
// Same split as the other pages: this file asks data.js, progress.js and requirements.js, turns the answers
// into a plain "view" object, and map-render.js draws it. main.js is loaded on this page too, and does what
// every page does (sample banner, the sync line in the footer, the email sign-in link).

import { loadData, loadMap, imageUrl } from './data.js';
import { configureProgress, loadProgress, setDone, onProgressChange } from './progress.js';
import { isAvailable, missingFor, directMissingFor, isRegionAvailable } from './requirements.js';
import { renderMessage, needsText } from './render.js';
import { renderMapShell, renderMapBody } from './map-render.js';
import { pinsForRegion, visiblePins, upsertPin, removePin, pointFromClick, serializeMap } from './map.js';

// The credit line a new map starts with in the exported file: the same line the Region hero images use.
const DEFAULT_CREDIT = 'Screenshot from Hollow Knight: Silksong, © Team Cherry.';

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

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const regionsById = new Map(regions.map((region) => [region.id, region]));
  const params = new URLSearchParams(location.search);

  // ?place turns on the tool that writes data/map.json. It is not linked from anywhere: it is for the person
  // who maintains the guide, not for the player.
  const placing = params.has('place');

  const state = {
    done: new Set(),
    visited: new Set(),
    maps: mapFile.maps.map((map) => ({ ...map })),
    // A working copy: the placer changes this one, never the loaded file.
    pins: mapFile.pins.map((pin) => ({ ...pin })),
    regionId: null,
    selectedId: null,
    showAll: false,
    showDone: false,
    placing,
    localImage: null, // { regionId, url }: a picture chosen in the placer, kept on this computer only
  };

  state.regionId = firstRegion();

  function mapOf(regionId) {
    return state.maps.find((map) => map.regionId === regionId) || null;
  }

  // Regions in the picker: the ones with a map, or every Region while placing (a Region with no map yet is
  // exactly where the placer is needed).
  function pickerRegions() {
    const list = placing ? regions : regions.filter((region) => mapOf(region.id));
    return list.map((region) => ({ id: region.id, name: region.name, hasMap: Boolean(mapOf(region.id)) }));
  }

  function firstRegion() {
    const wanted = params.get('region');
    const options = pickerRegions();
    if (wanted && options.some((region) => region.id === wanted)) return wanted;
    return options.length ? options[0].id : null;
  }

  function nameOf(id) {
    const found = itemsById.get(id);
    return found ? found.name : id;
  }

  // Same spoiler rule as the Region page and the Trackers page: a Region's entries stay hidden until it is open
  // and Visited (or something in it is done), unless the player asks to read ahead. A map is a list of places, so
  // it follows the same rule.
  function isRevealed(regionId) {
    if (state.showAll || state.placing) return true;
    if (!isRegionAvailable(regionId, state.done, regions)) return false;
    if (state.visited.has(regionId)) return true;
    return items.some((item) => item.regionId === regionId && state.done.has(item.id));
  }

  function selectedView() {
    const item = state.selectedId ? itemsById.get(state.selectedId) : null;
    if (!item || item.regionId !== state.regionId) return null;
    const done = state.done.has(item.id);
    const available = isAvailable(item.id, state.done, items, regions);
    const direct = !done && !available ? directMissingFor(item.id, state.done, items, regions) : [];
    const chainLength = direct.length ? missingFor(item.id, state.done, items, regions).length : 0;
    return {
      id: item.id,
      name: item.name,
      kind: item.kind,
      type: item.type,
      area: item.area || '',
      how: item.how,
      source: item.source,
      done,
      available,
      needs: needsText(direct.map(nameOf), chainLength),
    };
  }

  // The maps list the exported file would hold: the loaded maps, plus a starting entry for every Region that has
  // Pins but no map yet, so a file made with the placer is complete. The picture path is a suggestion; the
  // person saves their picture there.
  function exportMaps() {
    const maps = state.maps.map((map) => ({ ...map }));
    const regionsWithPins = [...new Set(state.pins.map((pin) => itemsById.get(pin.itemId)?.regionId).filter(Boolean))];
    for (const regionId of regionsWithPins) {
      if (maps.some((map) => map.regionId === regionId)) continue;
      maps.push({
        regionId,
        image: `img/map/${regionId}.jpg`,
        credit: DEFAULT_CREDIT,
        alt: `Map of ${regionsById.get(regionId)?.name ?? regionId}.`,
      });
    }
    return maps;
  }

  function placerView(selected, hasLocalImage, regionMap) {
    let imageHint = 'No picture for this Region yet.';
    if (hasLocalImage) {
      const where = regionMap ? regionMap.image : `img/map/${state.regionId}.jpg`;
      imageHint = `Showing the picture from your computer. Save it as ${where} in the site, which is where map.json will look for it.`;
    } else if (regionMap) {
      imageHint = `Using ${regionMap.image}.`;
    }
    return {
      imageHint,
      targetPlaced: Boolean(selected) && state.pins.some((pin) => pin.itemId === selected.id),
      json: serializeMap({ dataVersion: mapFile.dataVersion ?? dataVersion, maps: exportMaps(), pins: state.pins }, items),
    };
  }

  function buildView() {
    const regionMap = state.regionId ? mapOf(state.regionId) : null;
    const local = state.localImage && state.localImage.regionId === state.regionId ? state.localImage.url : null;
    const src = local || (regionMap ? imageUrl(regionMap.image) : null);
    const region = state.regionId ? regionsById.get(state.regionId) : null;
    const options = pickerRegions();
    const selected = selectedView();

    const view = {
      regions: options,
      regionId: state.regionId,
      regionName: region ? region.name : '',
      showAll: state.showAll,
      showDone: state.showDone,
      placing: state.placing,
      loadError: mapFile.error,
      map: null,
      pins: [],
      entries: [],
      selected,
      placer: null,
      state: 'ok',
    };

    if (options.length === 0 || !region) {
      view.state = 'none';
      return view;
    }
    if (!isRevealed(region.id)) {
      view.state = 'hidden';
      return view;
    }
    if (state.placing) view.placer = placerView(selected, Boolean(local), regionMap);
    if (!src) {
      view.state = 'no-map';
      return view;
    }

    view.map = { src, alt: regionMap ? regionMap.alt : `Picture of ${region.name}, from your computer.`, credit: regionMap ? regionMap.credit : 'Shown from your computer only. Not saved.' };

    // While placing, every Pin is drawn, done or not: the person needs to see what is already placed.
    const regionPins = pinsForRegion(region.id, state.pins, itemsById);
    const drawn = visiblePins(regionPins, state.done, state.showDone || state.placing);
    view.pins = drawn.map((pin) => {
      const item = itemsById.get(pin.itemId);
      return { itemId: pin.itemId, name: item.name, kind: item.kind, x: pin.x, y: pin.y, done: pin.done, selected: pin.itemId === state.selectedId };
    });

    const placed = new Set(regionPins.map((pin) => pin.itemId));
    const listed = state.placing ? items.filter((item) => item.regionId === region.id) : drawn.map((pin) => itemsById.get(pin.itemId));
    view.entries = listed
      .slice()
      .sort((a, b) => a.step - b.step)
      .map((item) => ({ id: item.id, name: item.name, kind: item.kind, done: state.done.has(item.id), selected: item.id === state.selectedId, placed: placed.has(item.id) }));
    return view;
  }

  // The elements are replaced on every render, so put keyboard focus back on the same control.
  function render() {
    const active = document.activeElement;
    const key = active && active.dataset ? active.dataset.focusKey : null;
    renderMapBody(parts, buildView());
    if (key) {
      const again = app.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
      if (again) again.focus();
    }
  }

  const parts = renderMapShell(app);

  const progress = await loadProgress();
  state.done = progress.done;
  state.visited = progress.visited;
  // Every change, including one that arrives from another device, comes through here.
  onProgressChange((next) => {
    state.done = next.done;
    state.visited = next.visited;
    render();
  });

  app.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('[data-action="select-region"]')) {
      selectRegion(target.value);
    } else if (target.matches('[data-action="show-all"]')) {
      state.showAll = target.checked;
      render();
    } else if (target.matches('[data-action="show-done"]')) {
      state.showDone = target.checked;
      render();
    } else if (target.matches('[data-action="local-image"]')) {
      chooseLocalImage(target.files && target.files[0]);
    }
  });

  app.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const kind = action.dataset.action;

    if (kind === 'select-pin') {
      state.selectedId = action.dataset.id;
      render();
    } else if (kind === 'toggle-done') {
      await toggleDone(action.dataset.id);
    } else if (kind === 'place-click') {
      placeAt(action, event);
    } else if (kind === 'remove-pin') {
      state.pins = removePin(state.pins, action.dataset.id);
      announce(`Pin removed: ${nameOf(action.dataset.id)}.`);
      render();
    } else if (kind === 'copy-json') {
      await copyJson();
    } else if (kind === 'download-json') {
      downloadJson();
    }
  });

  async function toggleDone(id) {
    const item = itemsById.get(id);
    if (!item) return;
    // Marking an entry that is not Available is allowed: the guide follows the real game (contract section 3).
    const value = !state.done.has(id);
    try {
      await setDone(id, value);
      announce(`${value ? 'Marked as done' : 'Marked as not done'}: ${item.name}`);
    } catch (error) {
      console.error(error);
      announce('That change could not be saved. Try again.');
    }
  }

  // A click on the picture while placing: put the selected entry where the click landed.
  function placeAt(image, event) {
    if (!state.placing) return;
    const item = state.selectedId ? itemsById.get(state.selectedId) : null;
    if (!item || item.regionId !== state.regionId) {
      announce('Choose an entry in the list first, then click the map.');
      return;
    }
    const point = pointFromClick(image.getBoundingClientRect(), event.clientX, event.clientY);
    if (!point) return;
    state.pins = upsertPin(state.pins, item.id, point.x, point.y);
    announce(`Placed ${item.name} at ${point.x} percent across and ${point.y} percent down.`);
    render();
  }

  function selectRegion(regionId) {
    if (!pickerRegions().some((region) => region.id === regionId)) return;
    state.regionId = regionId;
    state.selectedId = null;
    revokeLocalImage();
    // The address keeps the choice, so a reload (or a link) opens the same Region. replaceState adds no history entry.
    const next = new URLSearchParams(location.search);
    next.set('region', regionId);
    history.replaceState(null, '', `${location.pathname}?${next.toString()}`);
    render();
  }

  function revokeLocalImage() {
    if (state.localImage) URL.revokeObjectURL(state.localImage.url);
    state.localImage = null;
  }

  function chooseLocalImage(file) {
    if (!file || !state.regionId) return;
    revokeLocalImage();
    state.localImage = { regionId: state.regionId, url: URL.createObjectURL(file) };
    render();
  }

  async function copyJson() {
    const text = buildView().placer?.json;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      announce('map.json copied.');
    } catch {
      // Clipboard access can be refused (an older browser, or a page not served over https or localhost).
      const box = app.querySelector('#map-json');
      if (box) box.select();
      announce('Could not copy by itself. The text is selected: press Ctrl+C.');
    }
  }

  function downloadJson() {
    const text = buildView().placer?.json;
    if (!text) return;
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'map.json';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    announce('map.json downloaded.');
  }

  render();
}

function announce(text) {
  const live = document.getElementById('announcer');
  live.textContent = '';
  live.textContent = text;
}
