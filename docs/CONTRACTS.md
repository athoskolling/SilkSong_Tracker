# Contracts

**Status: approved by Athos, 2026-10-19 (Phase 0).** Still hypotheses until the vertical slice (Phase 1) proves them; changes after this are recorded with their reason. **The Phase 5 (full tracker) additions of 2026-10-20 (`counts`, `price`, `toolColor`, `isCounted`, `rosariesToSpend`, rules 6, 11 and 12) follow Athos's answers in `docs/PHASE-5-FULL-TRACKER-PLAN.md`, but their exact text awaits his review before anyone builds them.** Changing a contract is the orchestrator's job; no one else edits this file. A doubt about a contract is a question for the orchestrator, never something to improvise.

Terms follow `GLOSSARY.md`. In code and JSON, an entry is stored in `items.json` and its `kind` is `collectible` or `task`.

## 1. Data shapes

Every file in `data/` is `{ "dataVersion": <integer>, ... }`, and **all three files carry the same `dataVersion`**: it is one version for the whole of `data/`, raised in all three files together on any content change (decided with Athos, Phase 0, so Progress has a single version to record). Ids are lowercase slugs (`^[a-z0-9]+(-[a-z0-9]+)*$`), globally unique across `items.json`, `regions.json` and `endings.json`, so an id never means two things. **`requires` and `conditions` hold entry ids only** (ids from `items.json`), never Region or Ending ids: only entries can be in `done`, so any other id could never be met. "Region B needs Region A" is written as the entry that opens Region B. Anything an Ending depends on is an entry (a Task if it adds nothing to the counts). **Never rename a published id** (ADR 0003): add a new entry and retire the old one.

### `regions.json`

```json
{
  "dataVersion": 1,
  "regions": [
    {
      "id": "deep-docks",
      "name": "Deep Docks",
      "order": 3,
      "summary": "Short text in our own words.",
      "requires": [],
      "heroImage": "img/regions/deep-docks.jpg",
      "heroPosition": "50% 40%",
      "heroCredit": "Screenshot from Hollow Knight: Silksong, © Team Cherry."
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | permanent slug |
| `name` | string | yes | |
| `order` | integer | yes | suggested position in the guide; unique |
| `summary` | string | yes | our own words |
| `requires` | string[] | yes | entry ids needed to enter; `[]` = available from the start |
| `heroImage` | string | no | relative path, no leading slash; `.jpg` or `.png` |
| `heroPosition` | string | no | CSS `object-position`; default `50% 40%` |
| `heroCredit` | string | if `heroImage` | credit line shown under the image |

A Region the model knows about but whose content has not shipped yet is allowed to have no entries. The interface shows it as "Not in the guide yet".

### `items.json`

```json
{
  "dataVersion": 1,
  "items": [
    {
      "id": "example-entry",
      "name": "Example entry",
      "kind": "collectible",
      "type": "tool",
      "regionId": "deep-docks",
      "area": "Lower Docks",
      "how": "Short text in our own words.",
      "requires": [],
      "missable": false,
      "missableNote": "",
      "step": 40,
      "spoiler": 1,
      "source": "https://example.invalid/page"
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | permanent slug |
| `name` | string | yes | |
| `kind` | `"collectible"` \| `"task"` | yes | only counted Collectibles count in counters (`kind: "collectible"` and `counts` not `false`; see "Counted and tracked entries" below) |
| `type` | string | yes | free label, for example `ability`, `tool`, `crest`, `upgrade`, `boss`, `quest`, `flea`, `door`, `mask-shard` |
| `regionId` | string | yes | must exist in `regions.json` |
| `area` | string | no | Sub-area label, text only |
| `how` | string | yes | our own words |
| `requires` | string[] | yes | entry ids that must be done first; `[]` = always available |
| `unlocks` | string[] | no | not used in V1 and not derived by anything; if present, it must list entry ids (validator). Do not hand-write it |
| `missable` | boolean | no | default `false` |
| `missableNote` | string | if `missable` | when and why |
| `step` | integer | yes | position in the one global Route; unique across all entries |
| `spoiler` | `0` \| `1` \| `2` | no | lets an entry stay hidden until the player gets there. What each level means is still open (see section 7); V1 only needs "hidden while its Region is not Visited" versus "shown", so treat every entry as hidden-until-Visited unless Athos says otherwise |
| `source` | string (URL) | yes | link to the page the entry was checked against (the main wiki, MapGenie, or for Act 1 the guide page the orchestrator read, until Athos swaps it); a reference, not a copy |
| `counts` | boolean | no | Phase 5. Default `true` for a `collectible`, so every existing entry means what it meant before. `false` = a Collectible the game does not count toward 100 percent (a Memento, a piece of Equipment): it is tracked on its Tracker but never in the headline counts or in `regionProgress` (ADR 0005). A Task never counts, so `counts: true` on a Task is an error (rule 6) |
| `price` | integer, 1 or more | no | Phase 5. Rosaries a vendor asks for this entry (a shop entry). Marking it done means "bought". "Rosaries still to spend" is derived from the prices of shop entries not done (`rosariesToSpend`, section 2), so Progress stays ids only (ADR 0005). Purchase prices only: what a vendor pays the player (for a Relic, for example) is not recorded. Every source read so far has shops taking Rosaries only, so there is no `currency` field; it is added (default Rosaries) only if a shop entry priced in Shell Shards turns up |
| `toolColor` | `"red"` \| `"blue"` \| `"yellow"` | no | Phase 5. For `type: "tool"`: the Tool's colour, which decides which Crest slots it fits; the Build picker reads it. Optional so the existing Tools stay valid; the Crest and Tool sheet fills it in |

#### Counted and tracked entries (Phase 5, ADR 0005)

The headline numbers (Home totals, "Collectibles by type", Region cards and `regionProgress`) follow the game's own 100 percent list and use **counted Collectibles** only: `kind === "collectible"` and `counts !== false`. The one place that rule is written in code is `isCounted(item)` in `js/requirements.js` (section 2); the interface uses it instead of testing `kind` itself. Every entry, counted or not, still has a Region, a `step`, `requires` and a `source`, takes part in requirement chains exactly as before, and is marked done in Progress the same way.

A Tracker shows one category of entries with its own done and total, counted or not. Which Tracker an entry belongs on is decided by its `type`; the grouping of types into Trackers belongs to the design pass (section 8). The `type` of a Collectible is checked against two approved lists (rule 12): counted types (the existing list) and tracked-only types (`memento`, `relic`, `map` for now). A Collectible with `counts: false` may also use a counted type (for example an ability the game does not count).

### `endings.json`

```json
{
  "dataVersion": 1,
  "endings": [
    {
      "id": "example-ending",
      "name": "Example ending",
      "conditions": ["example-entry"],
      "locksOut": [],
      "source": "https://example.invalid/page"
    }
  ]
}
```

`conditions` are entry ids only. `locksOut` are ending ids that stop being reachable once this one is reached. There are four endings (Athos, 2026-10-20). Their data ships with the late-game batch, so in V1 `endings` is an empty array; V1 does not build the endings screen. The number is content, not code: nothing depends on it.

### Progress

```json
{
  "done": { "example-entry": true },
  "visited": { "deep-docks": true },
  "updatedAt": 1760000000000,
  "dataVersion": 1
}
```

- `done` and `visited` hold only ids marked `true`. Unmarking deletes the key.
- `updatedAt` is milliseconds since the epoch, set by `progress.js` on every change.
- `dataVersion` is the version of `data/` the Progress was last saved against. Progress is never migrated or dropped because of a version change; ids that no longer exist are ignored by the interface and kept in storage.
- localStorage key: `silksong-guide:progress:v1`. Firestore: `silksong_progress/{uid}`, same shape.
- Phase 5 adds nothing here (Athos, 2026-10-20): a Memento found or a shop entry bought is an id in `done` like any other entry, so union merge, import, export and the Firestore rules are unchanged. There is no Rosaries number in Progress (ADR 0005).

## 2. `js/requirements.js` (pure functions, no I/O)

All functions are pure: same input, same output. `doneSet` is a `Set` of entry ids. `items` is the `items` array and `regions` is the `regions` array (not the whole file). They never read localStorage, never touch the DOM and never fetch.

An entry can only be reached inside its Region, so **an entry's real requirements are its own `requires` plus its Region's `requires`** (decided with Athos, Phase 0; it keeps the rule in one place instead of copying Region requirements onto every entry). Below, "the requirements of X" always means that combined list for an entry, and the Region's `requires` for a Region.

Walking the chain: start from the requirements of X; for each id not in doneSet, list it and walk its own requirements the same way. An id already in doneSet is neither listed nor walked further (the player has it, so what came before it no longer matters, even if they marked it out of order).

```js
isAvailable(itemId, doneSet, items, regions) -> boolean
// true when every id in the entry's requirements (its own `requires` and its Region's `requires`)
// is in doneSet. No requirements = true.
// Unknown itemId, or an unknown id inside any `requires` it reads: throw an Error (validate data on load;
// do not hide data bugs). This holds for every function in this module, not only missingFor.
// An unknown id throws even when it is in doneSet (a typo is a data bug whatever the player marked);
// ids in doneSet itself are never checked (Progress may keep retired ids). isRegionAvailable has no
// `items`, so it catches an unknown Region and a Region id inside `requires`, but not a misspelt entry
// id there; missingForRegion, holdingYouUp and validator rule 3 catch that (decided in T14, no new argument).

missingFor(itemId, doneSet, items, regions) -> string[]
// Entry ids still not done that stand between the player and the entry, walking the chain as
// described above. Each id once, ordered by `step` ascending. Empty array = nothing missing.
// An id already in doneSet is never listed. Only entry ids are ever returned.

regionProgress(regionId, doneSet, items) -> { done: number, total: number }
// Counts the entries in the Region for which isCounted(entry) is true. Tasks never count, and
// neither do Collectibles with counts: false (Phase 5). For data with no `counts` field this is the
// same as kind === 'collectible', so no existing number moves.

isCounted(item /* one entry object */) -> boolean
// Phase 5. The one place the counting rule lives: item.kind === 'collectible' && item.counts !== false.
// A Task is never counted, whatever its `counts` says. Does not look anything up, so it never throws.
// The interface uses it for the headline numbers (Home totals, "Collectibles by type") instead of
// testing `kind` itself, so the Home and Region numbers cannot disagree.

rosariesToSpend(doneSet, items, regions) -> { total: number, available: number, ids: string[] }
// Phase 5, needed for the Rosaries panel (step 4 of the plan). Over every entry with a `price` that is
// not in doneSet: `total` is the sum of their prices, `available` the sum for those that are Available
// now, `ids` those entries ordered by `step`. Entries without `price` are ignored. Counted or not makes
// no difference (a Rosary is spent either way). Unknown ids in `requires` throw, as everywhere here.

isRegionAvailable(regionId, doneSet, regions) -> boolean
// true when every id in the Region's `requires` is in doneSet.

missingForRegion(regionId, doneSet, regions, items) -> string[]
// Same as missingFor, but for a Region: the entry ids missing for the Region to open,
// walking the chain (including the Regions of those entries). Ordered by `step`.

nextStep(doneSet, items, regions) -> string | null
// "Next on the route": the id of the entry with the lowest `step` that is not done and is
// Available. null when nothing Available is left. Needed in Phase 1 (the Region page shows it).

holdingYouUp(doneSet, items, regions) -> Array<{ id: string, blocks: string[] }>
// "Holding you up". For every entry not done and not Available, and every Region not Available,
// take its missing ids and keep only those that are Available now (so each result is something
// the player can do next). `blocks` lists the entry and Region ids it holds up.
// Sorted by blocks.length descending, then by the id's `step` ascending.
// Needed in Phase 2 (Home and Route); Athos may write it then.
```

Rules the tests must cover (QA 1): empty requirements; a two-step chain; a requirement already done is not listed and not walked; a diamond (two paths to the same requirement) lists it once; a cycle (`a` requires `b`, `b` requires `a`) does not loop forever and throws a clear error; unknown ids throw; tasks are excluded from `regionProgress`; ordering by `step`; an entry with no `requires` in a Locked Region is not Available and its `missingFor` lists the Region's missing ids; `nextStep` skips done and not Available entries and returns null at the end; `holdingYouUp` returns only Available ids and counts a Region in `blocks`. Phase 5: `regionProgress` leaves out a Collectible with `counts: false` and keeps one with `counts: true` or no `counts`; `isCounted` is false for every Task, even one with `counts: true`; an entry with `counts: false` or a `price` still works in `requires` chains, `nextStep` and `holdingYouUp` exactly like any other entry; `rosariesToSpend` leaves out done entries and entries without a price, and splits Available from not Available.

Athos delegated this module to Dev A on 2026-10-19 (Phase 1) and reviews it. Agents write tests against these signatures.

## 3. `js/progress.js`

The only module that touches localStorage and Firestore (Firestore through the `firebase.js` functions in section 4). The interface never does.

```js
configureProgress({ items /* the items array */, dataVersion /* integer */ }) -> void
// Added in Phase 1 (approved by Athos, 2026-10-19). The interface calls it once, right after
// loading data/. progress.js keeps only a map of entry id -> regionId (so setDone(id, true) can
// mark the Region Visited) and the dataVersion it stamps on saved Progress. Before it is called,
// setDone still works but cannot mark Visited. Why: progress.js never loads data itself, and the
// "doing something there means Visited" rule should live in one place, not in the interface.
// Optional `sample: true` (added 2026-10-20, QA finding F4): the page is showing data/sample. Progress then
// lives under its own key, `silksong-guide:progress:sample:v1`, and never touches the cloud, so invented
// sample ids can never mix with a real Run or be synced to an account. Sync status stays 'local'.
// One-way for the page session: a later call without the flag does not switch back or restart the
// cloud (each page calls configureProgress once per load; T16, confirmed by the orchestrator).

loadProgress() -> Promise<{ done: Set<string>, visited: Set<string> }>
// Local first: resolves at once from localStorage and never waits on the network. When signed in,
// the cloud copy is read and merged in the background; the merged result arrives through
// onProgressChange and onSyncStatus. (Changed in Phase 1: a slow network must never block the page.)

setDone(itemId, value /* boolean */) -> Promise<void>
// Writes locally always, to the cloud when signed in. Stamps updatedAt. Notifies subscribers.
// value true also marks the entry's Region Visited. value false never clears Visited
// (the player has still been there; Visited only controls spoilers).
// Marking an entry that is not Available is allowed: the guide follows the real game, and the
// player may have done things out of order. The interface may show what it needed; it does not refuse.

setVisited(regionId, value /* boolean */) -> Promise<void>
// Marks or unmarks a Region as Visited by hand. Notifies subscribers.

onProgressChange(callback /* ({ done: Set, visited: Set }) => void */) -> unsubscribe /* () => void */
// Called after every change, including changes from the cloud (another device).
// A change that changes nothing (marking an entry already done) does not notify, does not move
// updatedAt and does not write to the cloud.

onSyncStatus(callback /* (status) => void */) -> unsubscribe
// status = { state: 'local' | 'syncing' | 'synced' | 'error', at /* ms or null */, message /* string or '' */,
//            combined /* only right after a first sign-in: { localDone, cloudDone, totalDone } */ }
// Drives the Account screen's sync line and its "Progress combined" plate.
// Calls the callback once immediately with the current status, so a screen that subscribes late
// has something to show.

exportProgress() -> Blob
// The Progress object as JSON (without syncedUid), ready to be downloaded as
// silksong-guide-backup-YYYY-MM-DD.json.

importProgress(file /* File */) -> Promise<{ addedDone: number, addedVisited: number }>
// An import ADDS what the file has to what is already there (union) and never removes anything
// (confirmed by Athos, Phase 0). Rejects a file that is not valid Progress JSON, with a message the
// interface can show.

mergeLocalAndCloud(local, cloud, uid) -> progress
// Pure function; unit-tested. cloud null = no cloud copy yet: the result is local.
// If local.syncedUid !== uid, this is the first sign-in for this account on this device:
// union of done and visited (ADR 0001), updatedAt = now.
// Otherwise the one with the larger updatedAt wins as a whole object.
// The result has syncedUid = uid.

clearProgress() -> Promise<void>
// "Start a new run". Clears local, and the cloud copy when signed in. The interface asks for an
// export first; this function does not. Locally it writes an empty Progress with a fresh
// updatedAt (keeping syncedUid), so the old cloud copy cannot win back as the newer one.

useStorage(storageLike) -> void
// Test seam only: swaps localStorage for an in-memory stand-in and resets in-session state.
// The interface never calls it.

useCloud(fake /* { onAuthChange, readProgressDoc, writeProgressDoc, deleteProgressDoc, watchProgressDoc } | null */) -> void
// Test seam only: replaces the firebase.js functions with fakes (null stops the cloud half).
// In the browser progress.js wires the real firebase.js by itself; the interface never calls this.
```

Behaviour that is not a function:

- `progress.js` subscribes to `onAuthChange` itself. On sign-in it reads the cloud copy, merges, writes the result to both sides and starts `watchProgressDoc`. The interface never calls the merge.
- Local Progress also stores `syncedUid` (the account it was last merged with). It is never written to the cloud document or to a backup file. **Signing out clears `syncedUid`**, so anything marked while signed out is combined by union at the next sign-in instead of being overwritten by an older cloud copy.
- "Start a new run" clears this device and deletes the cloud copy. Another device that still has the old run keeps it and writes it back on its next change (newer wins). The Account screen must not promise that a new run clears every device.
- `combined` in the sync status is reported only on a first sign-in where a cloud copy already existed.
- Known cost (ADR 0001): after the first sign-in, "newer wins as a whole object" means two devices editing at the same time keep only the newer side.

## 4. `js/firebase.js`

```js
signIn(provider /* 'google' | 'github' | 'email-link' */, email /* only for 'email-link' */) -> Promise<void>
// For 'email-link' this sends the link; sign-in finishes in completeEmailLinkSignIn.
completeEmailLinkSignIn(email /* optional */) -> Promise<'signed-in' | 'not-a-link' | 'needs-email'>
// main.js calls it on every page load. 'needs-email' = the link was opened on a device that does
// not remember the address; the page asks for it and calls again with it.
signOut() -> Promise<void>
onAuthChange(callback /* (user | null) => void */) -> unsubscribe
// user = { uid, email, displayName, provider }

// Only progress.js may import these four:
readProgressDoc(uid) -> Promise<object | null>
writeProgressDoc(uid, progress) -> Promise<void>
deleteProgressDoc(uid) -> Promise<void>
watchProgressDoc(uid, callback /* (progress | null) => void */, onError /* optional (Error) => void */) -> unsubscribe
// All on silksong_progress/{uid}.
// callback(null) means "no cloud copy", so a listener failure never calls it; it calls onError
// instead (added in Phase 1, approved by Athos 2026-10-19), which progress.js turns into
// sync status 'error'. Snapshots that are only the echo of this device's own pending write are skipped.
```

- **Emulator mode** (added 2026-10-20, for testing only): when the page is served from `localhost` or `127.0.0.1` **and** the address has `?emulator`, `firebase.js` connects Auth and Firestore to the local Firebase Emulators under the project id `demo-silksong-guide`, so it can never reach the real project. On any other host the flag is ignored. The decision lives in `js/firebase-emulator.js` (`emulatorModeFor(hostname, search)`, pure, imported only by `firebase.js`), so `firebase.js` keeps exactly the exports listed above. Why: sync between two devices is the riskiest path and had never run end to end with the real SDK; this lets a script rehearse it with two browser profiles before Athos's check on the real site.
- It initializes Firebase from a config object in `js/firebase-config.js` (owned by Dev A; the web config is not a secret, see ADR 0004). It never exports Firestore or Auth handles.
- **The Firebase SDK is the one exception to "no CDN script"** (decided with Athos, Phase 0): it is imported from `https://www.gstatic.com/firebasejs/<version>/...` at one pinned version, **only by `firebase.js`**, and loaded so that a failure to reach it leaves the site working locally. Copying the SDK into the repository was rejected because its files import each other by absolute gstatic URLs and would need hand edits on every update (Dev A confirms this when building the module).
- `firebase.js` may keep the address an email link was sent to in localStorage under `silksong-guide:email-for-sign-in`. This is the one localStorage key outside `progress.js`; it holds no Progress.

## 5. `js/render.js` and `js/main.js` (interface)

No fixed function contract; they follow `docs/DESIGN.md`. Rules:

- Read data through a small `data.js`-style loader owned by Dev B that fetches `data/*.json` with relative URLs.
- Read Progress and requirements only through the functions above.
- Each page sets `<body data-page="home|region|route|account">`; `main.js` picks behaviour from it.
- Exception (Phase 2): `account.html` also loads `js/account-page.js`, which builds the Backup file, Start a new run, How saving works and Guide data sections. `main.js` keeps the sign-in plate. Why: it lets the Account page and the Home and Route pages be built at the same time without two people editing `main.js` and `render.js`. It may be folded into `main.js` later. **The one point where they meet:** `account-page.js` finds the element with class `account-column` that `render.js` builds on the Account page and adds its sections after the sign-in plate. `render.js` must keep that class on the Account page's main column; renaming it breaks the Account page without an error.
- Every state in the design has a visible equivalent in the interface: Available, Locked, Visited, Complete, Not in the guide yet, next on the route, missable, needs something, done.
- Phase 5: any number that claims to be a completion count (Home totals, "Collectibles by type", Region cards) selects entries with `isCounted` from `requirements.js`, never with `kind === 'collectible'` directly. This must be in `main.js` before the first entry with `counts: false` reaches `data/`, or the headline number would include it.

## 6. Cross-checks the validator must enforce (`scripts/validate-data.js`)

1. Each file parses and has an integer `dataVersion`, and the three values are equal.
2. Ids are slugs and unique across all three files.
3. `regionId` of every entry exists; every id in `requires` (entries and Regions) and `conditions` exists **and is an entry id** in `items.json`.
4. No cycles in `requires`, where an entry also depends on its Region's `requires` (so a Region that requires an entry inside itself is a cycle).
5. `step` is a unique integer across all entries.
6. `kind` is `collectible` or `task`; `missable: true` has a `missableNote`; a Task never has `counts: true` (Phase 5: a Task adds nothing to the counts, so the flag would contradict the kind).
7. Every entry has `source`, `how` and a non-empty `name`.
8. Every Region with `heroImage` has `heroCredit`, the path ends in `.jpg` or `.png`, and the image file exists.
9. `locksOut` ids are existing endings, and an ending never locks out itself.
10. A warning (not an error) for entries whose `how` is over 300 characters, to catch pasted wiki text.
11. Shape (added in Phase 2, T12): every required field in the section 1 tables is present with its type; `order` is a unique integer; `spoiler` is 0, 1 or 2 when given; `source` is an http or https link; `heroImage` has no leading `/` and no `..`; `unlocks`, when given, lists entry ids. Phase 5: `counts`, when given, is `true` or `false`; `price`, when given, is an integer of 1 or more; `toolColor`, when given, is `red`, `blue` or `yellow`.
12. A warning (not an error) when an entry with `kind: "collectible"` has a `type` outside the approved list, which follows what the game counts toward 100 percent (`GLOSSARY.md`, Athos, 2026-10-20): `mask-shard`, `spool-fragment`, `silk-heart`, `needle-upgrade`, `ancestral-art`, `silk-skill`, `ability`, `crest`, `tool`, `crafting-kit-upgrade`, `tool-pouch-upgrade`, `sylphsong`, `everbloom`. Why: one misspelt type would split the "Collectibles by type" counts without any error. Task types stay free. `ability` (added 2026-10-20, Act 1) is for a counted ability that is neither an Ancestral Art nor a Silk Skill, such as Needle Strike. Phase 5 adds a second list, **tracked-only types**, for Collectibles the game does not count: `memento`, `relic`, `map` (more are added when the Mementos and Equipment sheet names them). The check depends on `counts`: a counted Collectible (no `counts`, or `counts: true`) must use a counted type, and when its type is on the tracked-only list the warning says to add `counts: false` (that mistake would raise the headline number); a Collectible with `counts: false` may use a type from either list. A type on neither list is a warning in both cases. Existing data has no `counts` field, so it is checked exactly as before.

## 7. Changes after approval

- 2026-10-19, Phase 1: `configureProgress` added to `progress.js` (entry -> Region map and `dataVersion`); `watchProgressDoc` gets an optional `onError`; behaviours found while building T1 recorded (no-op changes, immediate `onSyncStatus` call, how `clearProgress` writes locally, the `useStorage` test seam). Approved by Athos.
- 2026-10-19, Phase 1 (T3): `loadProgress` returns local Progress at once and delivers the cloud merge through `onProgressChange`, instead of waiting for the cloud (a slow network must never block the page; Athos let the orchestrator decide). `useCloud` test seam recorded. Known costs recorded in section 3: "Start a new run" deletes the cloud copy, but another device still holding the old run writes it back on its next change (ADR 0001, newer wins); `combined` is reported only when a cloud copy existed.
- 2026-10-19, Phase 1: the Firebase project is the site's own (ADR 0004). No signature changed.
- 2026-10-19, Phase 2: `account.html` loads `js/account-page.js` as well as `main.js` (section 5), so Home, Route and the rest of Account can be built in parallel with one owner per file. No signature changed. The slice taught nothing else that changes a contract.
- 2026-10-20, Phase 2: validator rule 12 (approved Collectible types, warning only) and Emulator mode in `firebase.js` (section 4). No signature changed.
- 2026-10-20, Phase 2 (T13 findings): `configureProgress` takes an optional `sample` flag (section 3). No other signature changed.
- 2026-10-20, Phase 2 (T12): validator rule 11 (shape checks from section 1) added; `unlocks` is not derived in V1; an unknown id inside `requires` throws in every `requirements.js` function, not only in `missingFor` and `holdingYouUp` (before, `isAvailable`, `nextStep` and `isRegionAvailable` quietly answered false or null, which hides a data bug). Orchestrator's decision; Athos may overrule.
- 2026-10-20, Phase 3 (Act 1, delegated by Athos): `ability` added to the approved Collectible types (rule 12), for Needle Strike, which the sources count but list neither as an Ancestral Art nor as a Silk Skill. `source` may point at the guide page actually read (the orchestrator cannot open the main wiki); Athos swaps it when he checks the entry. No signature changed.
- 2026-10-20, Phase 5 (full tracker), written by the orchestrator from Athos's answers in `docs/PHASE-5-FULL-TRACKER-PLAN.md`; **the text awaits his review**. All additive, so the existing 62 entries, Progress, sync and the four screens keep their meaning: entries get the optional fields `counts` (default `true` for a Collectible; `false` = tracked, not counted), `price` (Rosaries, for shop entries) and `toolColor` (for the Build picker); `requirements.js` gets `isCounted` and `rosariesToSpend`, and `regionProgress` counts with `isCounted`; validator rules 6, 11 and 12 get the matching checks, with a second approved type list for tracked-only Collectibles; the interface counts with `isCounted` (section 5). Progress does not change: the plan's "numbers block" for Rosaries was dropped, because Athos chose ticking shop entries as bought over typing a number (ADR 0005), so ADR 0001's union merge still covers everything. Why `counts` and not a third `kind`: every check, screen and test that reads `kind` keeps working, and a Memento stays a thing you obtain (a Collectible), not a thing you do (a Task). No `currency` field: no source read shows a shop priced in Shell Shards. No Crest slot field yet: sources disagree on slot layouts (section 8).

## 8. Open contract questions

- Should a later version offer "replace" as well as the union import? (V1: union only, confirmed.)
- How a `step` that depends on a player choice (an Ending's `locksOut`) is represented in the Route. The Route screen has a "Choice point" marker; the data rule is open.
- What the three `spoiler` levels mean, and whether any of them needs behaviour in V1 (assumed: no; the original plan only says the field lets entries stay hidden until the player gets there).
- The localStorage key (`silksong-guide:progress:v1`) and the `firebase-config.js` file name are proposals, not decisions.
- Phase 5 (full tracker), waiting on research or the design pass:
  - **Crest slot layout.** The Build picker needs each Crest's slots. Sources agree that Tools are red, blue or yellow and that Silk Skills take white slots, but disagree on how many slots each Crest has, and the layout changes with Crest upgrades and with Memory Lockets (where a Locket is spent is a player choice, not an id, so Progress cannot hold it). A likely shape is an optional `slots` object on Crest entries, for example `{ "red": 1, "blue": 1, "yellow": 1, "white": 1 }` for the base layout, but nothing is approved until the Crest and Tool sheet settles the facts.
  - **Whether a Build is stored.** Assumed not: the picker is worked out from Progress each time, so Progress stays ids only. Keeping a chosen Build would need a new field or key and a decision from Athos.
  - **Which types make up Equipment**, and which Tracker each type goes on. `relic` and `map` are on the tracked-only list because sources show those categories exist outside 100 percent; the rest comes from the Mementos and Equipment sheet and the Trackers mockups. Whether an existing Task that is really an uncounted thing the player obtains (Drifter's Cloak is a Task of type `ability` in the Act 1 data) moves to `kind: "collectible"` with `counts: false` is a data decision for Athos; the id would not change, so Progress is safe either way.
  - **Shop entries with a material cost** (a vendor that also asks for Craftmetal or Pale Oil) and entries sold in more than one place or at more than one price. `price` holds Rosaries only; the material is a `requires` if it is an entry, otherwise text in `how`.
  - **Tracker entries on the Route and in Region states.** They have a `step`, so they appear on the Route and can be "Next on the route"; a Region shows Complete only when every entry in it is done, so a Memento there would have to be done too. Both are left as they are until the Trackers mockups say otherwise.
  - **Save file import.** In scope (last). It will likely need an optional per-entry field naming the save file's flag for that entry, and should add to Progress through the existing union import. Nothing is written until a research spike on the save format.
