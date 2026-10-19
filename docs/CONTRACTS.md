# Contracts

**Status: draft, to be reviewed with Athos in Phase 0.** These are hypotheses until the vertical slice (Phase 1) proves them. Changing a contract is the orchestrator's job; no one else edits this file. A doubt about a contract is a question for the orchestrator, never something to improvise.

Terms follow `GLOSSARY.md`. In code and JSON, an entry is stored in `items.json` and its `kind` is `collectible` or `task`.

## 1. Data shapes

Every file in `data/` is `{ "dataVersion": <integer>, ... }`. Ids are lowercase slugs (`^[a-z0-9]+(-[a-z0-9]+)*$`), globally unique across `items.json`, `regions.json` and `endings.json` so that `requires` and `conditions` can point at any of them without saying which file. **Never rename a published id** (ADR 0003): add a new entry and retire the old one.

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
| `heroImage` | string | no | relative path, no leading slash |
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
| `unlocks` | string[] | no | derived from `requires` by the validator; do not hand-write unless the data needs it |
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

`conditions` are entry ids. `locksOut` are ending ids that stop being reachable once this one is reached. V1 stores five endings and does not build the full endings screen.

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

```js
isAvailable(itemId, doneSet, items) -> boolean
// true when every id in the entry's `requires` is in doneSet. No requirements = true.
// Unknown itemId: throw an Error (validate data on load; do not hide data bugs).

missingFor(itemId, doneSet, items) -> string[]
// Ids still not done that stand between the player and the entry, following the chain
// (a requirement's own requirements). Each id once, ordered by `step` ascending.
// Empty array = nothing missing. An id already in doneSet is never listed.

regionProgress(regionId, doneSet, items) -> { done: number, total: number }
// Counts entries with kind === 'collectible' in the Region. Tasks never count.

isRegionAvailable(regionId, doneSet, regions) -> boolean
// true when every id in the Region's `requires` is in doneSet.

missingForRegion(regionId, doneSet, regions, items) -> string[]
// Same idea as missingFor, but for a Region: the ids missing for the Region to open,
// following the chain through `items`. Ordered by `step`.
```

Rules the tests must cover (QA 1): empty requirements; a two-step chain; a requirement already done is not listed; a diamond (two paths to the same requirement) lists it once; a cycle (`a` requires `b`, `b` requires `a`) does not loop forever and throws a clear error; unknown ids throw; tasks are excluded from `regionProgress`; ordering by `step`.

Athos writes this module in stage 1. Agents review it and write tests against these signatures; they do not rewrite it unless Athos asks.

## 3. `js/progress.js`

The only module that touches localStorage and Firestore. The interface never does.

```js
loadProgress() -> Promise<{ done: Set<string>, visited: Set<string> }>
// Local first. If signed in, also reads the cloud copy, merges with mergeLocalAndCloud, and returns the result.

setDone(itemId, value /* boolean */) -> Promise<void>
// Writes locally always, to the cloud when signed in. Also marks the entry's Region visited
// when value is true. Stamps updatedAt. Notifies subscribers.

setVisited(regionId, value /* boolean */) -> Promise<void>
// Marks or unmarks a Region as Visited by hand. Notifies subscribers.

onProgressChange(callback /* (progress) => void */) -> unsubscribe /* () => void */
// Called after every change, including changes from the cloud, with { done, visited }.

exportProgress() -> Blob
// The Progress object as JSON, ready to be downloaded as silksong-guide-backup-YYYY-MM-DD.json.

importProgress(file /* File */) -> Promise<{ addedDone: number, addedVisited: number }>
// ASSUMPTION (Athos to confirm): an import ADDS what the file has to what is already there
// (union), never removes anything. It rejects a file that is not valid Progress JSON, with a
// message the interface can show. The Account screen's copy already says so.

mergeLocalAndCloud(local, cloud) -> progress
// First sign-in: union of done and visited (ADR 0001). After the first sign-in, whichever has
// the larger updatedAt wins as a whole object. Pure function; unit-tested.

clearProgress() -> Promise<void>
// "Start a new run". Clears local, and the cloud copy when signed in. The interface asks for an
// export first; this function does not.
```

## 4. `js/firebase.js`

```js
signIn(provider /* 'google' | 'github' | 'email-link' */, email /* only for 'email-link' */) -> Promise<void>
signOut() -> Promise<void>
onAuthChange(callback /* (user | null) => void */) -> unsubscribe
// user = { uid, email, displayName, provider }
```

It initializes Firebase from a config object that lives in `js/firebase-config.js` (owned by Dev A; the web config is not a secret, see ADR 0002). It never exports Firestore handles. `progress.js` imports what it needs from this module through functions added to this contract by the orchestrator.

## 5. `js/render.js` and `js/main.js` (interface)

No fixed function contract; they follow `docs/DESIGN.md`. Rules:

- Read data through a small `data.js`-style loader owned by Dev B that fetches `data/*.json` with relative URLs.
- Read Progress and requirements only through the functions above.
- Each page sets `<body data-page="home|region|route|account">`; `main.js` picks behaviour from it.
- Every state in the design has a visible equivalent in the interface: Available, Locked, Visited, Complete, Not in the guide yet, next on the route, missable, needs something, done.

## 6. Cross-checks the validator must enforce (`scripts/validate-data.js`)

1. Each file parses and has an integer `dataVersion`.
2. Ids are slugs and unique across all three files.
3. `regionId` of every entry exists; every id in `requires` and `conditions` exists.
4. No cycles in `requires` (entries and Regions together).
5. `step` is a unique integer across all entries.
6. `kind` is `collectible` or `task`; `missable: true` has a `missableNote`.
7. Every entry has `source`, `how` and a non-empty `name`.
8. Every Region with `heroImage` has `heroCredit` and the image file exists.
9. `locksOut` ids are existing endings, and an ending never locks out itself.
10. A warning (not an error) for entries whose `how` is over 300 characters, to catch pasted wiki text.

## 7. Open contract questions

- Does `import` always union, or should the interface offer "replace" in a later version? (Assumed: union.)
- How a `step` that depends on a player choice (an Ending's `locksOut`) is represented in the Route. The Route screen has a "Choice point" marker; the data rule is open.
- What the three `spoiler` levels mean, and whether any of them needs behaviour in V1 (assumed: no; the original plan only says the field lets entries stay hidden until the player gets there).
- The localStorage key (`silksong-guide:progress:v1`) and the `firebase-config.js` file name are proposals, not decisions.
