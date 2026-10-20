# Contracts

**Status: approved by Athos, 2026-10-19 (Phase 0).** Still hypotheses until the vertical slice (Phase 1) proves them; changes after this are recorded with their reason. Changing a contract is the orchestrator's job; no one else edits this file. A doubt about a contract is a question for the orchestrator, never something to improvise.

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
| `kind` | `"collectible"` \| `"task"` | yes | only `collectible` counts in counters |
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
| `source` | string (URL) | yes | link to the wiki or MapGenie page; a reference, not a copy |

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
// Counts entries with kind === 'collectible' in the Region. Tasks never count.

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

Rules the tests must cover (QA 1): empty requirements; a two-step chain; a requirement already done is not listed and not walked; a diamond (two paths to the same requirement) lists it once; a cycle (`a` requires `b`, `b` requires `a`) does not loop forever and throws a clear error; unknown ids throw; tasks are excluded from `regionProgress`; ordering by `step`; an entry with no `requires` in a Locked Region is not Available and its `missingFor` lists the Region's missing ids; `nextStep` skips done and not Available entries and returns null at the end; `holdingYouUp` returns only Available ids and counts a Region in `blocks`.

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

- **Emulator mode** (added 2026-10-20, for testing only): when the page is served from `localhost` or `127.0.0.1` **and** the address has `?emulator`, `firebase.js` connects Auth and Firestore to the local Firebase Emulators under the project id `demo-silksong-guide`, so it can never reach the real project. On any other host the flag is ignored. Why: sync between two devices is the riskiest path and had never run end to end with the real SDK; this lets a script rehearse it with two browser profiles before Athos's check on the real site.
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

## 6. Cross-checks the validator must enforce (`scripts/validate-data.js`)

1. Each file parses and has an integer `dataVersion`, and the three values are equal.
2. Ids are slugs and unique across all three files.
3. `regionId` of every entry exists; every id in `requires` (entries and Regions) and `conditions` exists **and is an entry id** in `items.json`.
4. No cycles in `requires`, where an entry also depends on its Region's `requires` (so a Region that requires an entry inside itself is a cycle).
5. `step` is a unique integer across all entries.
6. `kind` is `collectible` or `task`; `missable: true` has a `missableNote`.
7. Every entry has `source`, `how` and a non-empty `name`.
8. Every Region with `heroImage` has `heroCredit`, the path ends in `.jpg` or `.png`, and the image file exists.
9. `locksOut` ids are existing endings, and an ending never locks out itself.
10. A warning (not an error) for entries whose `how` is over 300 characters, to catch pasted wiki text.
12. A warning (not an error) when an entry with `kind: "collectible"` has a `type` outside the approved list, which follows what the game counts toward 100 percent (`GLOSSARY.md`, Athos, 2026-10-20): `mask-shard`, `spool-fragment`, `silk-heart`, `needle-upgrade`, `ancestral-art`, `silk-skill`, `crest`, `tool`, `crafting-kit-upgrade`, `tool-pouch-upgrade`, `sylphsong`, `everbloom`. Why: one misspelt type would split the "Collectibles by type" counts without any error. Task types stay free.
11. Shape (added in Phase 2, T12): every required field in the section 1 tables is present with its type; `order` is a unique integer; `spoiler` is 0, 1 or 2 when given; `source` is an http or https link; `heroImage` has no leading `/` and no `..`; `unlocks`, when given, lists entry ids.

## 7. Changes after approval

- 2026-10-19, Phase 1: `configureProgress` added to `progress.js` (entry -> Region map and `dataVersion`); `watchProgressDoc` gets an optional `onError`; behaviours found while building T1 recorded (no-op changes, immediate `onSyncStatus` call, how `clearProgress` writes locally, the `useStorage` test seam). Approved by Athos.
- 2026-10-19, Phase 1 (T3): `loadProgress` returns local Progress at once and delivers the cloud merge through `onProgressChange`, instead of waiting for the cloud (a slow network must never block the page; Athos let the orchestrator decide). `useCloud` test seam recorded. Known costs recorded in section 3: "Start a new run" deletes the cloud copy, but another device still holding the old run writes it back on its next change (ADR 0001, newer wins); `combined` is reported only when a cloud copy existed.
- 2026-10-19, Phase 1: the Firebase project is the site's own (ADR 0004). No signature changed.
- 2026-10-19, Phase 2: `account.html` loads `js/account-page.js` as well as `main.js` (section 5), so Home, Route and the rest of Account can be built in parallel with one owner per file. No signature changed. The slice taught nothing else that changes a contract.
- 2026-10-20, Phase 2: validator rule 12 (approved Collectible types, warning only) and Emulator mode in `firebase.js` (section 4). No signature changed.
- 2026-10-20, Phase 2 (T13 findings): `configureProgress` takes an optional `sample` flag (section 3). No other signature changed.
- 2026-10-20, Phase 2 (T12): validator rule 11 (shape checks from section 1) added; `unlocks` is not derived in V1; an unknown id inside `requires` throws in every `requirements.js` function, not only in `missingFor` and `holdingYouUp` (before, `isAvailable`, `nextStep` and `isRegionAvailable` quietly answered false or null, which hides a data bug). Orchestrator's decision; Athos may overrule.

## 8. Open contract questions

- Should a later version offer "replace" as well as the union import? (V1: union only, confirmed.)
- How a `step` that depends on a player choice (an Ending's `locksOut`) is represented in the Route. The Route screen has a "Choice point" marker; the data rule is open.
- What the three `spoiler` levels mean, and whether any of them needs behaviour in V1 (assumed: no; the original plan only says the field lets entries stay hidden until the player gets there).
- The localStorage key (`silksong-guide:progress:v1`) and the `firebase-config.js` file name are proposals, not decisions.
