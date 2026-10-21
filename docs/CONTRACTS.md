# Contracts

**Status: approved by Athos, 2026-10-19 (Phase 0).** Still hypotheses until the vertical slice (Phase 1) proves them; changes after this are recorded with their reason. **The first Phase 5 additions (`counts`, `price`, `toolColor`, `isCounted`, `rosariesToSpend`, rules 6, 11 and 12) were approved by Athos on 2026-10-20. The second round of the same day (one entry per thing, the Build fields on entries, `js/builds.js`, the Progress fields `crestSlots`, `builds` and the provisional `shellShards` (dropped in the third round), rule 13; ADR 0006) follows his answers but its exact text awaits his review before anyone builds it. The Route rule (`routeIds`, section 2; sections 1, 5 and rule 14) was delegated by Athos to the orchestrator on 2026-10-20 ("do what is best for the project") and is recorded in section 7; Athos may overrule it. The third round (2026-10-20, ADR 0007: Build templates and synergies in `data/builds.json`, Places in `data/places.json`, `missingForPlace`, `fitTemplate`, `synergiesIn` and `synergyPartners`, rules 15 and 16, MapGenie as a citation only, and `shellShards` dropped from Progress) follows Athos's answers as relayed to the orchestrator; its exact text awaits his review before anyone builds it.** Changing a contract is the orchestrator's job; no one else edits this file. A doubt about a contract is a question for the orchestrator, never something to improvise.

Terms follow `GLOSSARY.md`. In code and JSON, an entry is stored in `items.json` and its `kind` is `collectible` or `task`.

## 1. Data shapes

Every file in `data/` is `{ "dataVersion": <integer>, ... }`, and **every file carries the same `dataVersion`**: it is one version for the whole of `data/`, raised in every file together on any content change (decided with Athos, Phase 0, so Progress has a single version to record). The three core files are `regions.json`, `items.json` and `endings.json`. Since the third round of Phase 5 (ADR 0007) there may also be `builds.json` (Build templates and synergies) and `places.json` (Places); both are optional, so a folder without them is valid, and when one exists it follows the same `dataVersion` rule. Ids are lowercase slugs (`^[a-z0-9]+(-[a-z0-9]+)*$`), globally unique across every file in the folder (Regions, entries, Endings, templates, synergies and Places), so an id never means two things. **`requires` and `conditions` hold entry ids only** (ids from `items.json`), never Region or Ending ids: only entries can be in `done`, so any other id could never be met. "Region B needs Region A" is written as the entry that opens Region B. Anything an Ending depends on is an entry (a Task if it adds nothing to the counts). **Never rename a published id** (ADR 0003): add a new entry and retire the old one.

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
| `optional` | boolean | no | Tasks only (bosses, 2026-10-20). Default `false`. `true` = a Task that gives nothing on the Route (a boss fought for its own sake, or for an uncounted reward): it is not on the Route by itself, only when something on the Route needs it (`routeIds`, section 2). Not shown to the player; it changes no count |
| `step` | integer | yes | position in the one global Route; unique across all entries. For an entry that is off the Route (`routeIds`, section 2) it only orders the entry on its Region page and its Tracker; it is still required and unique, so the entry can join the Route later without renumbering |
| `spoiler` | `0` \| `1` \| `2` | no | lets an entry stay hidden until the player gets there. What each level means is still open (see section 7); V1 only needs "hidden while its Region is not Visited" versus "shown", so treat every entry as hidden-until-Visited unless Athos says otherwise |
| `source` | string (URL) | yes | link to the page the entry was checked against (the main wiki, or for Act 1 the guide page the orchestrator read, until Athos swaps it); a reference, not a copy. A MapGenie link is allowed only under the rules in "Sources and MapGenie" below |
| `counts` | boolean | no | Phase 5. Default `true` for a `collectible`, so every existing entry means what it meant before. `false` = a Collectible the game does not count toward 100 percent (a Memento, a piece of Equipment): it is tracked on its Tracker but never in the headline counts or in `regionProgress` (ADR 0005). A Task never counts, so `counts: true` on a Task is an error (rule 6) |
| `price` | integer, 1 or more | no | Phase 5. Rosaries a vendor asks for this entry (a shop entry). Marking it done means "bought". "Rosaries still to spend" is derived from the prices of shop entries not done (`rosariesToSpend`, section 2), so Rosaries are never a number in Progress (ADR 0005). Purchase prices only: what a vendor pays the player (for a Relic, for example) is not recorded. Every source read so far has shops taking Rosaries only, so there is no `currency` field; it is added (default Rosaries) only if a shop entry priced in Shell Shards turns up |
| `toolColor` | `"red"` \| `"blue"` \| `"yellow"` | no | Phase 5. For `type: "tool"`: the Tool's colour, which decides which Crest slots it fits; the Build picker reads it. Optional so the existing Tools stay valid; the Crest and Tool sheet fills it in |
| `slots` | `{ "red", "blue", "yellow", "white" }`, all four keys, integers 0 or more | no | Phase 5, second round. Only on `type: "crest"`: the Crest's slots when the player gets it. White slots take Silk Skills. A Crest without `slots` is shown in the Build picker as "Not in the guide yet" (its layout is not settled) |
| `slotsMax` | same shape as `slots`, each value at least the matching `slots` value | no; only together with `slots` | Phase 5, second round. The Crest's slots once every Memory Locket that fits it is spent. The difference from `slots` is what the player can open (Progress `crestSlots`) |
| `grantsSlots` | object with one or more of `red`, `blue`, `yellow`, `white`, integers 1 or more | no | Phase 5, second round. Slots this entry adds to **every** Crest once it is done (the Vesticrest steps). Never on a Crest |
| `upgradeOf` | entry id | no | Phase 5, second round. This entry is an upgraded or evolved version of that entry (an upgraded Tool, an evolved Crest). The game counts a Tool once whatever its version, so an entry with `upgradeOf` is normally `counts: false` (rule 13 warns otherwise). The Build picker treats owning the upgrade as owning the base, and a Build stores the base id |
| `effect` | string | no | Phase 5, second round. What the entry does, in our own words, short (rule 10 warns over 200 characters). `how` stays "where and how to get it"; the Build picker and the Trackers show `effect` |

#### Counted and tracked entries (Phase 5, ADR 0005)

The headline numbers (Home totals, "Collectibles by type", Region cards and `regionProgress`) follow the game's own 100 percent list and use **counted Collectibles** only: `kind === "collectible"` and `counts !== false`. The one place that rule is written in code is `isCounted(item)` in `js/requirements.js` (section 2); the interface uses it instead of testing `kind` itself. Every entry, counted or not, still has a Region, a `step`, `requires` and a `source`, takes part in requirement chains exactly as before, and is marked done in Progress the same way.

**On the Route or not** (Phase 5, decided 2026-10-20 by the orchestrator, delegated by Athos). Counting and the Route are separate questions. The Route leads to 100 percent and to every Ending, so it holds every counted Collectible, every Task, every `missable` entry, and everything those entries and the Regions need, all the way down the chain. Nothing else. A tracked-only Collectible that nothing on the Route needs (a Memento, a map, a Memory Locket, a furnishing, an upgraded Tool, the Hunter Crest) is **off the Route**: it is listed on its Region page and on its Tracker, the player ticks it there, and it never appears on the Route page, is never "Next on the route", never shows in "Holding you up" and never keeps a Region from being Complete. A tracked-only Collectible that the Route does need (the Drifter's Cloak, which opens Far Fields entries and Hunter's March) stays on it. The rule is written once, as `routeIds` (section 2). It depends on the data only, never on Progress, so the Route does not change shape as the player ticks things.

A Tracker shows one category of entries with its own done and total, counted or not. Which Tracker an entry belongs on is decided by its `type`; the grouping of types into Trackers belongs to the design pass (section 8). The `type` of a Collectible is checked against two approved lists (rule 12): counted types (the existing list) and tracked-only types (`memento`, `relic`, `map` for now). A Collectible with `counts: false` may also use a counted type (for example an ability the game does not count).

#### One entry per thing (Phase 5, Athos, 2026-10-20)

`kind`, `counts` and `requires` answer three separate questions, so one thing in the game is always **one** entry:

- `kind` says what the entry is: a thing the player obtains (`collectible`) or a thing the player does (`task`).
- `counts` says whether the game counts it toward 100 percent.
- `requires` on **other** entries says what it holds back. Any entry can appear in another entry's or a Region's `requires`, whatever its `kind` or `counts`.

So a thing the player obtains that the story needs is a Collectible, with `counts: false` when the game does not count it, and the entries and Regions it opens list it in their `requires`. It is never split into a Task plus a Collectible. Cases decided so far: the **Drifter's Cloak** (today a Task of type `ability`) becomes `kind: "collectible"`, `counts: false`; the **Hunter Crest** is a normal entry the player ticks, `type: "crest"`, `counts: false`. Mementos and Equipment are tracked and not counted.

Changing an existing entry's `kind` is safe for saved Progress because the id does not change (ADR 0003), but it must wait until P5-1, P5-2 and P5-3 are merged: before P5-3, Home still counts by `kind`, so the headline number would include the entry. The steps are in `docs/PHASE-5-FULL-TRACKER-PLAN.md` (task P5-13).

#### Build fields (Phase 5, second round)

The fields below describe one entry each, so they live on entries in `items.json`. What groups several entries (Build templates and synergies, third round) lives in `data/builds.json` instead (section "`builds.json`" below, ADR 0007); the second round's "no `data/builds.json`, no templates" was reversed by Athos on 2026-10-20. The fields cause no error in the current code: the validator ignores fields it does not know, and `requirements.js`, `render.js` and `main.js` read only named fields. Rule 13 checks them; until that rule is merged (P5-9), no entry may carry them.

How the picker counts a Crest's slots now, per colour: `slots` + the slots opened on it (Progress `crestSlots`, never more than `slotsMax - slots`; ignored when the Crest has no `slotsMax`) + the `grantsSlots` of every done entry. What fits which slot: a Tool with `toolColor` fits slots of that colour; an entry of `type: "silk-skill"` fits white slots. A Tool without `toolColor` cannot be placed until the data gives it one. Only entries the player has marked done are offered (an entry whose upgrade is done counts as owned). The exact functions are in section 2a.

The facts these fields need are partly in dispute (`docs/PHASE-5-SHEET-1-BUILDS.md` section 5, ten points). Athos has not checked them yet (2026-10-20, "not now"), so a field whose value is in dispute is left out of the entry, never guessed.

#### Sources and MapGenie (third round, Athos, 2026-10-20)

Every `source` (on entries, Endings, templates, synergies and Places) is a link to a page a person read; it is a reference, not a copy. Athos allows a MapGenie link for Silksong as a `source` "in case needed". `CLAUDE.md` rule 9 still holds in full: **agents never scrape, fetch or open MapGenie**, and nothing is collected from it. So a MapGenie `source`:

- cites **where** something is (an entry's or a Place's location), and **never** where our text came from. The `how`, `effect` or `goal` beside it comes from Athos's own play or from another source someone read;
- must be a Silksong map page (an address under `https://mapgenie.io/hollow-knight-silksong/`); rule 16 warns on any other MapGenie address, so a Hollow Knight link is caught;
- **cannot be checked by the project.** No agent can open it, so no agent can confirm that the page shows the thing it is attached to. An agent adds one only when Athos supplies it or when it appeared as a search result, and says in its handoff that it was not opened. Athos is the only one who can check it, in a browser.

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

### `builds.json` (Phase 5, third round, ADR 0007; optional file)

Build templates and synergies. Loaded only by the Build picker. Points at entries in `items.json`; nothing points at it.

```json
{
  "dataVersion": 1,
  "templates": [
    {
      "id": "example-template",
      "crestId": "example-crest",
      "name": "Example template",
      "goal": "Short text in our own words: what this Build is for.",
      "build": { "red": ["example-tool"], "white": ["example-skill"] },
      "editorial": true,
      "source": "https://example.invalid/page"
    }
  ],
  "synergies": [
    {
      "id": "example-synergy",
      "a": "example-tool",
      "b": "example-other-tool",
      "effect": "Short text in our own words: what the two do together.",
      "source": "https://example.invalid/page"
    }
  ]
}
```

Both lists are required in the file and may be empty.

**Template** (glossary: Template)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | permanent slug, unique across all files. Nothing stores it today, but a link may name it (`builds.html?crest=...&template=...`), so it is never renamed |
| `crestId` | entry id | yes | an entry of `type: "crest"` that has both `slots` and `slotsMax` (without them the fit cannot be checked, and the picker shows that Crest as "Not in the guide yet") |
| `name` | string | yes | short, sentence case |
| `goal` | string | yes | what the Build is for, in our words; rule 10 warns over 200 characters |
| `build` | object | yes | **the same shape as a saved Build** (Progress `builds`, section 1): one or more of `red`, `blue`, `yellow`, `white`, each a list of 1 to 12 entry ids, in slot order. Base ids only (never an entry with `upgradeOf`), no id twice in the template. It must fit the Crest with every slot opened and every `grantsSlots` entry done (rule 15) |
| `editorial` | boolean | yes | `true`: the grouping is ours (we picked Tools whose `effect` fits the `goal`); `source` is the page the `goal`'s claim rests on, and each id's own facts rest on its entry's `source`. `false`: a source recommends this Build; `source` is that page and `goal` restates its purpose in our words. Required, so the choice is always made on purpose. The interface says which (section 5) |
| `source` | string (URL) | yes | as above |

The order of `templates` in the file is the order the picker lists a Crest's templates in.

**Synergy** (glossary: Synergy)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | permanent slug, unique across all files |
| `a`, `b` | entry ids | yes | two different entries that can be placed in a Build (a Tool with `toolColor`, or a Silk Skill), base ids only, because a Build stores base ids. When the source states the effect only for an upgraded version (Curvesickle rather than Curveclaw), the pair still uses the base id and `effect` names the version. A pair appears once, in either order |
| `effect` | string | yes | what the two do together, in our words; rule 10 warns over 200 characters |
| `source` | string (URL) | yes | **a page that names both entries and the effect.** A synergy is a claim about the game, so it is never editorial: a pair we only think works well goes in a template's `goal`, not here (Hollow-Thingy's rule: only pairs where the source names both). The research sheet records this per pair; the validator cannot check it |

### `places.json` (Phase 5, third round, ADR 0007; optional file)

Places: benches, Bellway stations, shops, NPCs and other fixed spots, listed per Region so the player can find their way. A Place is not a Collectible or a Task: it is never done, never counted, has no `step`, is never on the Route and never in Progress. It points at entries; nothing points at it.

```json
{
  "dataVersion": 1,
  "places": [
    {
      "id": "shop-example",
      "name": "Example vendor",
      "kind": "shop",
      "regionId": "deep-docks",
      "area": "Lower Docks",
      "how": "Short text in our own words: where it is and what is there.",
      "requires": [],
      "sells": ["example-entry"],
      "source": "https://example.invalid/page"
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | permanent slug, unique across all files. Suggested form `<kind>-<name>` (`bench-...`, `shop-...`), which keeps Place ids apart from entry ids; not enforced. Permanent because pages link to it (`region.html?id=...#place-<id>` from the Rosaries page) |
| `name` | string | yes | |
| `kind` | string | yes | one of `bench`, `bellway`, `shop`, `npc`, `wishboard`, `arena`, `door`, `other` (rule 16). `shop`: a vendor who sells for Rosaries or materials. `wishboard`: a board where wishes are taken. `arena`: a fight room that is not itself an entry. A thing that is an entry (a boss Task, a Collectible) is never repeated as a Place |
| `regionId` | Region id | yes | must exist in `regions.json` |
| `area` | string | no | Sub-area label, text only |
| `how` | string | yes | where it is and what is there, in our own words (rule 10 warns over 300 characters) |
| `requires` | entry ids | yes | what must be done to reach or use it; `[]` = reachable as soon as its Region is. **Same meaning as on entries:** the real requirements are its own `requires` plus its Region's `requires` (`missingForPlace`, section 2). Entry ids only |
| `sells` | entry ids | no; only on `kind: "shop"` | the entries this vendor sells, in the order the vendor lists them. An entry sold by two vendors is listed by both. Priced or not (a free upgrade or a material-only trade may be listed). This is the only link between Places and the Rosaries page ("Sold by"). The entry's own `price` stays the one price (section 8 keeps the "more than one price" question open) |
| `source` | string (URL) | yes | a guide page read, or the MapGenie Silksong map under "Sources and MapGenie" above |

**Spoilers.** A Place is hidden while its Region is not Visited, exactly like an entry, and shown when the player turns on "Show everything". A shop's `sells` list is shown with the shop (being at the shop shows its stock).

### Progress

```json
{
  "done": { "example-entry": true },
  "visited": { "deep-docks": true },
  "updatedAt": 1760000000000,
  "dataVersion": 1,
  "crestSlots": { "example-crest": { "blue": 1 } },
  "builds": { "example-crest": { "red": ["example-tool"], "white": ["example-skill"] } }
}
```

- `done` and `visited` hold only ids marked `true`. Unmarking deletes the key.
- `updatedAt` is milliseconds since the epoch, set by `progress.js` on every change, including a change to the two fields below.
- `dataVersion` is the version of `data/` the Progress was last saved against. Progress is never migrated or dropped because of a version change; ids that no longer exist are ignored by the interface and kept in storage.
- localStorage key: `silksong-guide:progress:v1`. Firestore: `silksong_progress/{uid}`, same shape. The key stays `:v1` after Phase 5: the new fields are optional, and a new key would make everyone's saved Progress look empty.
- A Memento found or a shop entry bought is an id in `done` like any other entry. There is no Rosaries number in Progress (ADR 0005), and no Shell Shards number either (ADR 0007).
- Nothing from `builds.json` or `places.json` is ever stored: a template is copied into the picker's draft and saved, if the player saves, as an ordinary Build; a Place is never done.

**Player choices (Phase 5, second round, ADR 0006).** Two optional fields, for things that are a choice rather than "this entry is done". Both are optional, so every Progress saved before Phase 5 is still valid. (A third, the provisional `shellShards`, was dropped on 2026-10-20, ADR 0007: Athos wants Shell Shards worked out from entries, like the Rosaries. The code never built it, the Firestore rules refuse the key, and a `shellShards` key found in a backup file or a stored copy is ignored like any other unknown key.)

| Field | Shape | Meaning |
|---|---|---|
| `crestSlots` | object: Crest entry id (slug) → object with one or more of `red`, `blue`, `yellow`, `white`, each an integer from 1 to 99 | How many slots of each colour the player opened on that Crest with Memory Lockets, beyond its `slots`. A zero is not stored (the key is deleted, like an unmarked id); a Crest with nothing opened has no key. 99 is only a guard against typing errors, not a game fact |
| `builds` | object: Crest entry id (slug) → object with one or more of `red`, `blue`, `yellow`, `white`, each a list of 1 to 12 entry ids (slugs) | The Build the player saved for that Crest: the Tools (and, under `white`, the Silk Skills) in its slots, in display order. One saved Build per Crest. No id appears twice in one Build. Empty lists are not stored; a Build with no ids is deleted. Upgraded entries are stored by their base id (`upgradeOf`). 12 is a guard, not a game fact |

- **Missing is not empty.** A field that is absent from a copy of Progress means "this copy was written by a version of the site that does not know the field". A field that is present, even as `{}`, is known and takes part in the merge rules. `progress.js` keeps an absent field absent until something sets it: one of the setters, a merge or import that brings it from the other side, or `clearProgress` (which writes both, empty, on purpose). An ordinary change such as `setDone` does not add them. Why: a device still running an older page writes Progress without these fields; without this rule its next change would win as the newer copy and erase every saved Build (ADR 0006).
- Ids inside these fields are checked as slugs only. They are not checked against `data/` (Progress may outlive a data version), and ids that no longer exist are kept and ignored by the interface, like retired ids in `done`.
- Nothing in these fields changes counts, Availability, Visited or the Route. `requirements.js` never reads them.

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

routeIds(items, regions) -> Set<string>
// Phase 5 (decided 2026-10-20). The ids of the entries that are on the Route. An entry is on the Route when
//   - isCounted(entry) is true, or
//   - it is a Task (kind === 'task') without optional: true (bosses, 2026-10-20), or
//   - it has missable: true (the Route is where the player is warned in time), or
//   - it is in the requirements of an entry that is on the Route, or of any Region, walking the chain all the
//     way down (each id's own `requires` plus its Region's `requires`), whatever is done.
// Every other entry is off the Route: in practice a Collectible with counts: false, or a Task with optional: true,
// that nothing on the Route needs. An optional Task that something on the Route needs stays on it (the chain rule).
// "Needed by an entry on the Route", not "needed by any entry": an id required only by entries that are off the
// Route is off the Route too (the Bellhome Key, required only by furnishings, stays off).
// Takes no doneSet: being on the Route is a property of the data. Closed under requirements: whatever an entry on
// the Route or a Region needs is on the Route, so missingFor of an entry on the Route, missingForRegion and
// holdingYouUp only ever return ids on the Route.
// Unknown ids (an entry's regionId, an id in any `requires`) throw, as everywhere in this module. A cycle does
// not make it loop, and it does not report one (missingFor and validator rule 4 do).
// Linear in entries plus requirement links. A page calls it once after loading data/ and keeps the Set.
// Ending `conditions` are not read: they are Tasks or counted entries (section 1), already on the Route;
// validator rule 14 warns if one is not.

rosariesToSpend(doneSet, items, regions) -> { total: number, available: number, ids: string[] }
// Phase 5, needed for the Rosaries panel (step 4 of the plan). Over every entry with a `price` that is
// not in doneSet: `total` is the sum of their prices, `available` the sum for those that are Available
// now, `ids` those entries ordered by `step`. Entries without `price` are ignored. Counted or not, and
// on the Route or not, makes no difference (a Rosary is spent either way; a map off the Route is still bought). Unknown ids in `requires` throw, as everywhere here.

isRegionAvailable(regionId, doneSet, regions) -> boolean
// true when every id in the Region's `requires` is in doneSet.

missingForRegion(regionId, doneSet, regions, items) -> string[]
// Same as missingFor, but for a Region: the entry ids missing for the Region to open,
// walking the chain (including the Regions of those entries). Ordered by `step`.

missingForPlace(place /* one Place object from places.json */, doneSet, items, regions) -> string[]
// Phase 5, third round (ADR 0007). Same as missingFor, for a Place: its requirements are its own `requires`
// plus its Region's `requires`, walked the same way. Ordered by `step`; empty array = the player can reach it.
// Takes the object, not an id, because Places are not in `items` (this module never sees places.json).
// Unknown place.regionId or an unknown id in any `requires` it reads: throw, as everywhere in this module.
// Lets the Region page say "Needs X" for a Place without walking `requires` itself.

pathTo(itemId, doneSet, items, regions) -> Array<{ id: string, available: boolean }>
// Goal feature (approved by Athos, 2026-10-20). What the Goal page lists: missingFor(itemId) in its order
// (by `step`), then itemId itself, always last, even if the data gave it a lower `step` than a requirement.
// available = isAvailable(id, ...) for each row, so the page can say "Available now" without asking again.
// itemId in doneSet: [] (the Goal is done, even if a requirement was left unmarked; out-of-order marking is allowed).
// itemId not done and nothing missing: one row, the Goal, available: true.
// Works for any entry, on or off the Route; it does not read routeIds. Unknown ids and cycles throw, as in missingFor,
// even when itemId is in doneSet (the chain is checked first; a typo is a data bug whatever the player marked; GOAL-3 Q6).

nextStep(doneSet, items, regions) -> string | null
// "Next on the route": the id of the entry with the lowest `step` that is on the Route (routeIds),
// not done and Available. null when nothing Available is left on the Route. Never an entry off the
// Route (Phase 5; the signature is unchanged, it works the Set out itself). Needed in Phase 1 (the Region page shows it).

holdingYouUp(doneSet, items, regions) -> Array<{ id: string, blocks: string[] }>
// "Holding you up". For every entry on the Route (routeIds) not done and not Available, and every
// Region not Available, take its missing ids and keep only those that are Available now (so each
// result is something the player can do next). `blocks` lists the entry and Region ids it holds up.
// An entry off the Route is never in `blocks`, and (the Route being closed under requirements) never
// a blocker (Phase 5; signature unchanged).
// Sorted by blocks.length descending, then by the id's `step` ascending.
// Needed in Phase 2 (Home and Route); Athos may write it then.
```

Rules the tests must cover (QA 1): empty requirements; a two-step chain; a requirement already done is not listed and not walked; a diamond (two paths to the same requirement) lists it once; a cycle (`a` requires `b`, `b` requires `a`) does not loop forever and throws a clear error; unknown ids throw; tasks are excluded from `regionProgress`; ordering by `step`; an entry with no `requires` in a Locked Region is not Available and its `missingFor` lists the Region's missing ids; `nextStep` skips done and not Available entries and returns null at the end; `holdingYouUp` returns only Available ids and counts a Region in `blocks`. Phase 5: `regionProgress` leaves out a Collectible with `counts: false` and keeps one with `counts: true` or no `counts`; `isCounted` is false for every Task, even one with `counts: true`; an entry with `counts: false` or a `price` still works in `requires` chains (`isAvailable`, `missingFor`, `missingForRegion`) exactly like any other entry; `routeIds` holds every counted Collectible, every Task and every `missable` entry, holds a `counts: false` entry that an entry on the Route or a Region needs (also two links down), leaves out one needed only by entries off the Route, ignores `doneSet` (it takes none), throws on unknown ids and stops on a cycle; `nextStep` never returns an entry off the Route, even when it is Available and has the lowest `step`; `holdingYouUp` never lists an entry off the Route in `blocks`; `rosariesToSpend` leaves out done entries and entries without a price, and splits Available from not Available. Phase 5, third round: `missingForPlace` with empty `requires` in an Available Region is `[]`; in a Locked Region it lists the Region's missing ids; a two-step chain, a requirement already done and a diamond behave as in `missingFor`; ordered by `step`; it throws on an unknown `regionId` and on an unknown id in the Place's or the Region's `requires`; it does not change the Place object. Goal: `pathTo` returns `[]` for a done entry (also when a requirement is not done); one available row for an entry with nothing missing; `missingFor`'s ids in the same order followed by the entry; the entry last even when its `step` is lower than a requirement's; a done requirement is not listed; a diamond lists the shared id once; an entry in a Locked Region lists the Region's missing ids; `available` matches `isAvailable` for every row; an entry off the Route works the same way; unknown ids and a cycle throw.

Athos delegated this module to Dev A on 2026-10-19 (Phase 1) and reviews it. Agents write tests against these signatures.

## 2a. `js/builds.js` (Phase 5, second round; pure functions, no I/O)

The Build picker's arithmetic, kept out of the page script so it can be unit-tested like `requirements.js`. Same rules: pure, never reads localStorage, never touches the DOM, never fetches. Owner: Dev A. `crestSlots` and `build` are the Progress values from section 1 (or `undefined` when there is none). Colours are always the four keys `red`, `blue`, `yellow`, `white`.

```js
slotsFor(crestId, doneSet, items, crestSlots) -> { red, blue, yellow, white } | null
// The Crest's slots now. Per colour: slots[c]
//   + min(opened[c], slotsMax[c] - slots[c])   (opened = crestSlots?.[crestId]?.[c] ?? 0; 0 when the Crest has no slotsMax)
//   + the sum of grantsSlots[c] over every entry in doneSet that has grantsSlots.
// null when the Crest entry has no `slots` (its layout is not in the guide yet).
// crestId unknown, or not an entry of type "crest": throws (the interface passes ids from data, so this is a bug).

ownedByColour(doneSet, items) -> { red: string[], blue: string[], yellow: string[], white: string[] }
// What the player can place. A Tool with toolColor goes under its colour; an entry of type "silk-skill" under white.
// An entry counts as owned when it is in doneSet, or when an entry whose upgradeOf points at it is in doneSet.
// Ids are always the base ids (an upgrade is never listed itself), each once, ordered by `step`.
// Tools without toolColor are left out. Ids in doneSet that are not in items are ignored.

checkBuild(crestId, build, doneSet, items, crestSlots) -> Array<{ id: string, problem: 'unknown' | 'not-owned' | 'wrong-colour' | 'no-room' }>
// Why a saved Build does not fit now. Empty array = it fits.
// 'unknown': the id is not in items (a retired id kept in Progress). 'not-owned': not owned in the sense of ownedByColour.
// 'wrong-colour': the entry does not fit that colour. 'no-room': in a colour list, every id after the first slotsFor(...)[c].
// No 'no-room' problem when slotsFor returns null. One result per id and problem, in the Build's order (red, blue, yellow, white).
// Never throws for ids inside the Build (they come from Progress); throws only for crestId, as slotsFor does.
// The interface shows these problems; it never removes a saved id by itself.

// Phase 5, third round (ADR 0007). Templates and synergies come from data/builds.json (section 1).

fitTemplate(template, doneSet, items, crestSlots) -> { missing: string[], noRoom: string[], usable: { red, blue, yellow, white } }
// How one template stands for this player now. Built on ownedByColour and checkBuild, so the picker and
// validator rule 15 use the same rules.
//   missing  ids in template.build the player does not own (in the sense of ownedByColour), in the template's
//            order (red, blue, yellow, white). An id not in items is listed here too (the validator keeps that
//            from shipping; a page must not break on it).
//   usable   template.build without the missing ids: all four colour keys, each a list in the template's order
//            (empty lists allowed; this is a page value, never stored). It is what "Use as my Build" copies
//            into the draft.
//   noRoom   ids of `usable` that have no slot on the Crest now: checkBuild's 'no-room' on `usable`. [] when
//            slotsFor returns null.
// The template is ready to use as it is when missing and noRoom are both empty.
// Throws only for template.crestId (unknown, or not a Crest), as slotsFor does. Never throws for ids inside.

synergiesIn(build, synergies) -> Synergy[]
// The synergies whose `a` and `b` are both in the Build (any colours). In the order of `synergies`.
// build undefined or empty: []. Compares ids only; never throws.

synergyPartners(build, synergies) -> Array<{ synergy, inBuild: string, other: string }>
// The synergies with exactly one side in the Build: `inBuild` is that id, `other` the missing partner.
// In the order of `synergies`. Whether the player owns `other` is the page's question (ownedByColour).
// Compares ids only; never throws.
```

Rules the tests must cover (QA 1): a Crest without `slots` gives null; opened slots add up to `slotsMax` and no further; opened slots are ignored without `slotsMax`; a done Vesticrest-style entry adds its `grantsSlots` to every Crest, a not-done one adds nothing; an upgrade that is done makes its base owned and only the base id is listed; Silk Skills go under white; a Tool without `toolColor` is never listed; each `checkBuild` problem on its own; a Build that fits returns `[]`; unknown `crestId` throws, unknown ids inside a Build do not. Third round: `fitTemplate` with everything owned and room gives empty `missing` and `noRoom` and `usable` equal to the template's lists; a not-owned id is in `missing` and not in `usable`; owning only the upgrade of a template id counts as owning it; an id not in items is in `missing` and does not throw; dropping a missing id moves the next id up a position before room is checked; more ids than slots puts the extra ones in `noRoom`; a Crest without `slots` gives empty `noRoom`; an unknown or non-Crest `crestId` throws; the template object is not changed. `synergiesIn` finds a pair across two colours, ignores a pair with one side, keeps the order of `synergies` and returns `[]` for an undefined Build; `synergyPartners` returns the one-sided pairs with the right `inBuild` and `other`, and neither a full pair nor a pair with no side.

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

loadProgress() -> Promise<{ done: Set<string>, visited: Set<string>, crestSlots: object, builds: object }>
// Local first: resolves at once from localStorage and never waits on the network. When signed in,
// the cloud copy is read and merged in the background; the merged result arrives through
// onProgressChange and onSyncStatus. (Changed in Phase 1: a slow network must never block the page.)
// Phase 5: crestSlots and builds are deep copies of the stored objects ({} when absent). Callers that read
// only done and visited are unaffected. (No shellShards: dropped, ADR 0007.)

setDone(itemId, value /* boolean */) -> Promise<void>
// Writes locally always, to the cloud when signed in. Stamps updatedAt. Notifies subscribers.
// value true also marks the entry's Region Visited. value false never clears Visited
// (the player has still been there; Visited only controls spoilers).
// Marking an entry that is not Available is allowed: the guide follows the real game, and the
// player may have done things out of order. The interface may show what it needed; it does not refuse.

setVisited(regionId, value /* boolean */) -> Promise<void>
// Marks or unmarks a Region as Visited by hand. Notifies subscribers.

// Phase 5, second round (ADR 0006). The two setters follow the same rules as setDone: write locally first,
// then the cloud when signed in; stamp updatedAt; notify; a call that changes nothing does nothing.
// None of them marks anything done or Visited. They check shapes only (section 1), never ids against data/.
// A bad argument is an interface bug: they throw a TypeError and write nothing.

setCrestSlots(crestId /* slug */, opened /* { red?, blue?, yellow?, white? }, integers 0 to 99 */) -> Promise<void>
// Replaces the opened slots for that Crest. Zeros are not stored; all zeros (or {}) deletes the Crest's key.

setBuild(crestId /* slug */, build /* { red?, blue?, yellow?, white? } lists of slugs | null */) -> Promise<void>
// Saves the Build for that Crest, replacing the one saved before. null, or a Build with no ids, deletes it.
// Empty lists are dropped; an id twice in one Build, more than 12 ids in a colour or a non-slug id is a TypeError.
// Storing a Build that does not fit is allowed (the player may know better than the data); checkBuild reports it.

// setShellShards was contracted as provisional and is dropped (ADR 0007); it was never built.

// Goal (approved by Athos, 2026-10-20). One entry id the player follows, on this device only (Athos: option 1a).
// Not part of Progress: never in the Progress object, the cloud document, a backup file, a merge or an import.
loadGoal() -> string | null
// The stored Goal id, or null. Synchronous: it reads localStorage on every call, with no cache, so a value
// another tab wrote is seen on the next call (only while storage cannot be written does it answer from a copy
// in memory, like Progress). Stored as the plain id text, not JSON. A stored value that is not a slug
// reads as null. Not checked against data/: an id that no longer exists is returned, and the page says so.
setGoal(itemId /* slug */ | null) -> void
// Replaces the Goal (one at a time); null clears it. A non-slug argument (undefined included) is a TypeError
// and writes nothing.
// A call that changes nothing does nothing and does not notify. Never marks anything done or Visited,
// never moves updatedAt and never writes to the cloud.
onGoalChange(callback /* (id | null) => void */) -> unsubscribe
// Called after every setGoal that changes something on this page, and after every clearProgress, with null,
// even when there was no Goal. Not called at once on subscribe (loadGoal gives the current value), and not
// called by configureProgress({ sample: true }): a page reads loadGoal after configuring. useStorage drops the
// listeners with the rest of the in-session state. Other open tabs see the change when they reload.

onProgressChange(callback /* ({ done: Set, visited: Set, crestSlots, builds }) => void */) -> unsubscribe /* () => void */
// Called after every change, including changes from the cloud (another device).
// Phase 5: the payload also carries the two player-choice fields, shaped as in loadProgress. A change to
// any of them notifies; a cloud copy that differs only in them notifies too.
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
// silksong-guide-backup-YYYY-MM-DD.json. Phase 5: includes crestSlots and builds when present
// (absent fields stay absent). An older page that imports this file reads done and visited and ignores the rest.

importProgress(file /* File */) -> Promise<{ addedDone: number, addedVisited: number,
                                           addedSlots: number, addedBuilds: number }>
// (Third round: the provisional tookShellShards key is removed from the result. Until the cleanup task
// P5-45 lands, the code still returns it as an always-false fifth key; nothing in the interface reads it.)
// An import ADDS what the file has to what is already there (union) and never removes anything
// (confirmed by Athos, Phase 0). Rejects a file that is not valid Progress JSON, with a message the
// interface can show.
// Phase 5, what "adds, never removes" means for the player choices (ADR 0006):
// - crestSlots: per Crest and colour, the larger of this device's number and the file's.
//   addedSlots = the sum of the increases.
// - builds: a Crest with no Build saved here gets the file's Build; a Crest that has one keeps it
//   (an import never replaces). addedBuilds = how many Crests got one.
// A `shellShards` key in the file is ignored like any other unknown key (ADR 0007).
// A file without these fields (every backup made before Phase 5) is valid and adds only ids. A file in which
// any of them is present but malformed is rejected whole, with the same message (strict, as today: a wrong
// file is refused, not half-imported). The first two keys of the result are unchanged, so the Account
// page's message keeps working; it may mention the new ones later.

mergeLocalAndCloud(local, cloud, uid) -> progress
// Pure function; unit-tested. cloud null = no cloud copy yet: the result is local.
// If local.syncedUid !== uid, this is the first sign-in for this account on this device:
// union of done and visited (ADR 0001), updatedAt = now.
// Otherwise the one with the larger updatedAt wins as a whole object.
// The result has syncedUid = uid.
// Phase 5 (ADR 0006), for crestSlots and builds:
// - First sign-in, both copies have the field: crestSlots takes the larger number per Crest and colour;
//   builds keeps every Crest saved on either side, and where both saved one for the same Crest, the Build
//   from the copy with the larger original updatedAt wins whole (tie: local).
// - First sign-in, only one copy has the field: that copy's value. Neither: the field stays absent.
// - Afterwards: the newer copy wins as a whole object, these fields included, except that a field absent
//   from the winner is taken from the other copy when present there ("missing is not empty", section 1).

clearProgress() -> Promise<void>
// "Start a new run". Clears local, and the cloud copy when signed in. The interface asks for an
// export first; this function does not. Locally it writes an empty Progress with a fresh
// updatedAt (keeping syncedUid), so the old cloud copy cannot win back as the newer one.
// Phase 5: the empty Progress has crestSlots {} and builds {} written explicitly, so a
// new run also clears the saved Builds and opened slots, and the empty values win as the newer copy.
// Goal: also clears the Goal on this device and notifies onGoalChange (a new run starts with no Goal).

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
- **Phase 5, Firestore rules first.** The cloud document may carry `crestSlots` and `builds`. The rules before Phase 5 accepted exactly four keys, so a write with either would be refused. The rules change (P5-5) keeps the four required keys and accepts the two as optional maps, and still lets a signed-in user reach only their own document. It never accepted `shellShards`, and since that field is dropped (ADR 0007) it never will: dropping it needs no rules change and nothing for Athos to publish. **Athos publishes those rules before the new `progress.js` (P5-7) is merged**, because every merge is pushed and goes live at once. The other order is safe: new rules accept the four-key documents that older pages write.
- **Goal storage.** localStorage key `silksong-guide:goal:v1`; in sample mode `silksong-guide:goal:sample:v1`, so a sample id never becomes the real Goal. `useStorage` resets it with everything else. Why outside Progress (Athos chose device only): the Firestore rules accept a fixed set of keys, so a synced Goal would need new rules published first (like gate G1); a backup is a record of what was done, not of what the player meant to do next; and a Goal has no sensible union merge (two devices, two Goals). It can move into Progress later as an optional field, under ADR 0006's "missing is not empty" rule.
- **Phase 5, older pages.** A device still running a page from before P5-7 reads and writes only the four keys. Its writes drop the two fields from the cloud document; a device running the new page keeps its own values (absent is not empty) and writes them back on its next change. A "Start a new run" made on an older page does not clear the saved Builds on devices running the new page. Both are accepted costs (ADR 0006).

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
- Phase 5, the Route rule (decided 2026-10-20; section 1, "On the Route or not"). `main.js` calls `routeIds(items, regions)` once after loading `data/` and keeps the Set; no page decides by itself what is on the Route, and `kind`, `counts` or `missable` are never tested for it in the interface.
  - **Route page:** lists only entries in the Set. Its Region groups, "Steps X to Y" ranges and hidden counts are built from those entries only.
  - **Region card (Home):** Complete when the Region is Available, has entries, and every entry in it that is on the Route is done. A Region whose entries are all off the Route (no data has one today) is Complete when every entry in it is done. The bar still counts with `regionProgress`.
  - **Home, nothing left:** "everything is done" means every entry on the Route is done (heading "Everything on the route is done", text "Every step on the route so far is marked done. Extras that are not on the route stay on their Region pages.").
  - **Region page:** still lists every entry in the Region in `step` order, so an entry off the Route can be ticked there. Such a row shows "Not on the route" where other rows show "Step N" (the row's view gets `onRoute`), and it is never "Next on the route" (`nextStep` never returns it). Counts, Visited, spoiler hiding and the Locked chain do not change.
  - **Not affected:** the Trackers page (a Tracker lists its whole category), the Rosaries page (`rosariesToSpend` and "Next to buy" cover every priced entry), the Build picker, Visited (ticking any entry still marks its Region Visited) and every completion count.
- Phase 5, second round: three new pages, `trackers.html`, `rosaries.html` and `builds.html`, with `data-page="trackers|rosaries|builds"`. Each loads its own page script (`js/trackers-page.js`, `js/rosaries-page.js`, `js/builds-page.js`), as `account.html` does with `account-page.js`, so `main.js` does not grow a branch per page and the pages can be built one after another without reopening `main.js`. They may import exported helpers from `render.js`; a task that needs a new export names `render.js` in its files. The Build picker writes only through `setBuild` and `setCrestSlots` and asks `builds.js` (section 2a) what fits. The header of every page links Regions, Route, Trackers, Rosaries, Builds and Account (Athos, 2026-10-20, option A: on a phone the last link reads "Account", its accessible name stays "Account and backup"); each link is added in the task that ships its page, so the published site never links to a missing page.
- Phase 5, third round (ADR 0007): **Places and Build templates.** No new page and no new header link. Home, Route, Trackers and Account do not change and never load the new files.
  - **Loading.** `data.js` gets two functions; `loadData()` is unchanged.

    ```js
    loadPlaces() -> Promise<{ places: Place[], dataVersion: number | null }>
    loadTemplates() -> Promise<{ templates: Template[], synergies: Synergy[], dataVersion: number | null }>
    // Same folder as loadData (data/, or data/sample with ?data=sample), same no-cache fetch.
    // A 404 means "not shipped yet": resolves with empty lists. Any other failure rejects with DataLoadError.
    ```

    A page calls them only after `loadData()` has resolved. A rejection never blocks the page: the page shows one line where the section would be ("Places could not be loaded. Reload the page to try again." / the same for templates), and everything else works as before.
  - **Region page: "Places in this region".** A section after the entries, shown exactly when the entries are shown (the Region is Visited, or "Show everything" is on; for a Locked Region only with "Show everything", after its entries). No Places for the Region, or no `places.json`: no section at all. Grouped by `kind` in the order bench, bellway, shop, npc, wishboard, arena, door, other, one heading per kind that has Places; file order inside a kind. Each row: name, Sub-area, `how`, Source link, and "Needs X" when `missingForPlace` is not empty (names capped at three, as for entries). A row has the id `place-<id>` so other pages can link to it. **A Place row has no mark and no toggle and must not look tickable:** a Place is never done. A shop row lists its `sells`: each entry's name, its price when it has one, and "Bought" when it is done (read only; the entry is ticked on its own row or on the Rosaries page). Counts, Complete, Visited, "Next on the route" and the side plate's numbers do not change. The hidden-entries plate also covers the Places ("Its entries and places stay hidden" or similar; the mockup decides the copy). A Region with no entries but with Places keeps its "Not in the guide yet" plate and shows its Places under the same Visited rule.
  - **Rosaries page: where to buy.** Each priced entry row, and the "Next to buy" plate, say "Sold by <Place> in <Region>" for every shop Place whose `sells` lists it, linking to `region.html?id=<regionId>#place-<id>`. A vendor is named only when the page's existing reveal rule shows its Region (Available and Visited, or something done there, or "Show everything"); otherwise "Sold in a region you have not visited". An entry no Place sells shows no line. `rosariesToSpend` and every number on the page are unchanged.
  - **Build picker: templates.** For the chosen Crest, its templates in file order (none: nothing is shown; a Crest without `slots` never has templates). Each shows its name, `goal`, "Our suggestion" when `editorial` is true or "From a guide" when false, its Source link, and where it stands from `fitTemplate`: ready; "Needs X, Y and 1 more" (`missing`); "Needs more slots: 1 red" (`noRoom`). A `missing` entry whose Region is not Visited is not named ("and 2 you have not found yet"), as entries in unvisited Regions are hidden elsewhere; whether the page gets a "Show everything" switch is the mockup's call. **"Use as my Build" never saves:** it replaces the Crest's draft with `usable` (so missing ids are left out, and ids with no room show as today's "no slot for it" rows), the save bar shows "Not saved", and the player saves or undoes as with any change. If the Crest already has unsaved changes, the page asks before replacing them. The left-out ids are announced in the live region. Templates are never filtered away for missing ids: a template the player cannot use yet stays listed with what it needs.
  - **Build picker: synergies.** Under the slots, "Works together": `synergiesIn` of the Build as shown (draft or saved), each with its `effect` and Source link. "Pairs well with": `synergyPartners` whose `other` the player owns (`ownedByColour`); a partner the player does not own is not shown (nothing to act on now, and no spoiler).
  - Without `builds.json` the picker works exactly as before; without `places.json` the Region and Rosaries pages do.
- **Goal** (approved by Athos, 2026-10-20; glossary "Goal"; copy and layout come from the mockup Athos approves). The interface reads and writes the Goal only through `loadGoal`, `setGoal` and `onGoalChange`, and the list only through `pathTo`.
  - **The button.** Every entry row on the Region, Route, Trackers and Rosaries pages, and the "Next on the route" plate, gets a "Make this my goal" control (`<button type="button" aria-pressed>`). On the Goal's own row it reads as pressed ("Your goal"), and pressing it again clears the Goal. It appears only where the row itself is shown: the spoiler rules for rows do not change. Setting a Goal never marks anything.
  - **Goal page:** new page `goal.html`, `data-page="goal"`, with its own script `js/goal-page.js` (as the Phase 5 pages do). No header link, so the header keeps its six links: the Home plate and the pressed button link to it. It shows the Goal's name, Region and how many rows `pathTo` returns, then one row per `pathTo` result in its order, each with the entry's name, bead or knot, Region (linking `region.html?id=`), Sub-area, `how`, Source link, "Available now" when `available` is true, and its done toggle (`setDone`, as on every other row; the list then shrinks). **Spoilers:** every row is shown in full whatever is Visited and without "Show everything" (Athos, 2026-10-20: the player asked for it by choosing the Goal). States: no Goal ("You have no goal yet", pointing at the Route and Trackers pages); Goal done ("Done", with a way to clear it); Goal id not in the data (an old id: say it is no longer in the guide and offer to clear it); the normal list.
  - **Home:** a "Your goal" plate near "Next on the route": the Goal's name, how many rows are left, the first row that is Available now, and a link to the Goal page. No Goal: no plate. Counts, "Next on the route", "Holding you up", the Route and Complete do not change.
  - Ids from the Goal never enter `done`, `visited` or any count.

## 6. Cross-checks the validator must enforce (`scripts/validate-data.js`)

1. Each file parses and has an integer `dataVersion`, and the values are equal. The three core files must exist; `builds.json` and `places.json` are checked when they exist and their absence is not a problem (third round).
2. Ids are slugs and unique across all files: Regions, entries, Endings, and (third round) templates, synergies and Places.
3. `regionId` of every entry exists; every id in `requires` (entries and Regions) and `conditions` exists **and is an entry id** in `items.json`.
4. No cycles in `requires`, where an entry also depends on its Region's `requires` (so a Region that requires an entry inside itself is a cycle).
5. `step` is a unique integer across all entries.
6. `kind` is `collectible` or `task`; `missable: true` has a `missableNote`; `optional`, when given, is `true` or `false` and appears only on a Task (bosses, 2026-10-20; presence counts, so `optional: false` on a Collectible is an error too, and a wrong value on a Collectible gives both errors; an optional Task that is also `missable` is on the Route and gets no warning; an Ending condition should never be `optional`, and rule 14 warns if one is off the Route, BOSS-2); a Task never has `counts: true` (Phase 5: a Task adds nothing to the counts, so the flag would contradict the kind).
7. Every entry has `source`, `how` and a non-empty `name`.
8. Every Region with `heroImage` has `heroCredit`, the path ends in `.jpg` or `.png`, and the image file exists.
9. `locksOut` ids are existing endings, and an ending never locks out itself.
10. A warning (not an error) for entries whose `how` is over 300 characters, to catch pasted wiki text. Phase 5, second round: the same warning for `effect` over 200 characters. Third round: a Place's `how` over 300, a template's `goal` over 200 and a synergy's `effect` over 200.
11. Shape (added in Phase 2, T12): every required field in the section 1 tables is present with its type; `order` is a unique integer; `spoiler` is 0, 1 or 2 when given; `source` is an http or https link; `heroImage` has no leading `/` and no `..`; `unlocks`, when given, lists entry ids. Phase 5: `counts`, when given, is `true` or `false`; `price`, when given, is an integer of 1 or more; `toolColor`, when given, is `red`, `blue` or `yellow`.
12. A warning (not an error) when an entry with `kind: "collectible"` has a `type` outside the approved list, which follows what the game counts toward 100 percent (`GLOSSARY.md`, Athos, 2026-10-20): `mask-shard`, `spool-fragment`, `silk-heart`, `needle-upgrade`, `ancestral-art`, `silk-skill`, `ability`, `crest`, `tool`, `crafting-kit-upgrade`, `tool-pouch-upgrade`, `sylphsong`, `everbloom`. Why: one misspelt type would split the "Collectibles by type" counts without any error. Task types stay free. `ability` (added 2026-10-20, Act 1) is for a counted ability that is neither an Ancestral Art nor a Silk Skill, such as Needle Strike. Phase 5 adds a second list, **tracked-only types**, for Collectibles the game does not count: `memento`, `relic`, `map` (more are added when the Mementos and Equipment sheet names them). The check depends on `counts`: a counted Collectible (no `counts`, or `counts: true`) must use a counted type, and when its type is on the tracked-only list the warning says to add `counts: false` (that mistake would raise the headline number); a Collectible with `counts: false` may use a type from either list. A type on neither list is a warning in both cases. Existing data has no `counts` field, so it is checked exactly as before.
13. Build fields (Phase 5, second round). Errors: `slots` and `slotsMax` only on `type: "crest"`, each an object with exactly the keys `red`, `blue`, `yellow`, `white` and integer values of 0 or more; `slotsMax` only together with `slots`, and each of its values at least the matching `slots` value; `grantsSlots` an object with one or more of the four colour keys and integer values of 1 or more, never on a Crest; `upgradeOf` the id of another entry in `items.json` (not itself, not a Region or Ending id), with no loop through `upgradeOf`; `effect`, when given, non-empty text. Warnings: an entry with `upgradeOf` that is counted (`isCounted` would be true), since the game counts a Tool once whatever its version; `toolColor` on an entry whose `type` is not `tool`; an entry with `upgradeOf` whose `toolColor` differs from its base's when both have one. Existing data has none of these fields, so it gives no new message.
14. A warning (not an error) when an Ending's `conditions` hold an id that is off the Route (`routeIds`, section 2). Why: the Route must lead to every Ending, and a condition off it would never be "Next on the route" or show in "Holding you up"; the fix is a contract change (Ending conditions become a root of `routeIds`), not a data edit, so it warns and names the orchestrator. The validator imports `routeIds` from `js/requirements.js` instead of copying the rule, and runs this check only when rules 1 to 5 found no error (`routeIds` throws on the data bugs they report). Today `data/` has no Endings and every condition in `data/sample` is on the Route, so it gives no new message.
15. `builds.json` (Phase 5, third round, ADR 0007), when the file exists. Errors: the file has `templates` and `synergies` lists. **Each template:** `crestId` is an entry of `type: "crest"` that has both `slots` and `slotsMax`; `name` and `goal` are non-empty text; `editorial` is `true` or `false`; `source` is an http or https link; `build` is an object with one or more of the keys `red`, `blue`, `yellow`, `white` and no other key, each a list of 1 to 12 ids of entries in `items.json` (not a Region, Ending, template, synergy or Place id); no id appears twice in the template; no id is an entry with `upgradeOf` (a saved Build stores base ids); and `checkBuild(crestId, build, <every entry id>, items, <every slot opened>)` from `js/builds.js` reports no problem, where "every slot opened" is `slotsMax - slots` per colour. That last check means every id fits its colour and the template fits the Crest at its most (every Memory Locket spent, every `grantsSlots` entry done), with the picker's own code; it runs only when rules 1 to 5 and 13 found no error, because `checkBuild` reads those fields. **Each synergy:** `a` and `b` are two different entry ids, each a Tool with `toolColor` or an entry of `type: "silk-skill"`, neither with `upgradeOf`; the same pair (in either order) appears once; `effect` is non-empty text; `source` is an http or https link. Warning: two templates for the same Crest with the same ids in the same colours. The validator imports `checkBuild` from `js/builds.js` instead of copying it (like rule 14 and `routeIds`). Today all seven Crests in `data/` (`dataVersion` 10) have `slots` and `slotsMax`, so each can have templates; `data/` has no `builds.json`, so the rule gives no new message.
16. `places.json` (Phase 5, third round, ADR 0007), when the file exists. Errors: the file has a `places` list; each Place has non-empty `name` and `how`; `kind` is one of `bench`, `bellway`, `shop`, `npc`, `wishboard`, `arena`, `door`, `other`; `regionId` exists in `regions.json`; `area`, when given, is text; `requires` is a list of entry ids that exist (as in rule 3: entry ids only); `sells` appears only on `kind: "shop"`, and is then a non-empty list of existing entry ids with no id twice; `source` is an http or https link. Places have no `step` and are not part of rule 4 or 5 (nothing can require a Place, so they cannot close a loop). **Sources, every file:** a warning when a `source` is a MapGenie address that is not under `https://mapgenie.io/hollow-knight-silksong/` (a Hollow Knight or other game's map), per "Sources and MapGenie" in section 1. Existing data has no MapGenie link and no `places.json`, so it gives no new message.

## 7. Changes after approval

- 2026-10-19, Phase 1: `configureProgress` added to `progress.js` (entry -> Region map and `dataVersion`); `watchProgressDoc` gets an optional `onError`; behaviours found while building T1 recorded (no-op changes, immediate `onSyncStatus` call, how `clearProgress` writes locally, the `useStorage` test seam). Approved by Athos.
- 2026-10-19, Phase 1 (T3): `loadProgress` returns local Progress at once and delivers the cloud merge through `onProgressChange`, instead of waiting for the cloud (a slow network must never block the page; Athos let the orchestrator decide). `useCloud` test seam recorded. Known costs recorded in section 3: "Start a new run" deletes the cloud copy, but another device still holding the old run writes it back on its next change (ADR 0001, newer wins); `combined` is reported only when a cloud copy existed.
- 2026-10-19, Phase 1: the Firebase project is the site's own (ADR 0004). No signature changed.
- 2026-10-19, Phase 2: `account.html` loads `js/account-page.js` as well as `main.js` (section 5), so Home, Route and the rest of Account can be built in parallel with one owner per file. No signature changed. The slice taught nothing else that changes a contract.
- 2026-10-20, Phase 2: validator rule 12 (approved Collectible types, warning only) and Emulator mode in `firebase.js` (section 4). No signature changed.
- 2026-10-20, Phase 2 (T13 findings): `configureProgress` takes an optional `sample` flag (section 3). No other signature changed.
- 2026-10-20, Phase 2 (T12): validator rule 11 (shape checks from section 1) added; `unlocks` is not derived in V1; an unknown id inside `requires` throws in every `requirements.js` function, not only in `missingFor` and `holdingYouUp` (before, `isAvailable`, `nextStep` and `isRegionAvailable` quietly answered false or null, which hides a data bug). Orchestrator's decision; Athos may overrule.
- 2026-10-20, Phase 3 (Act 1, delegated by Athos): `ability` added to the approved Collectible types (rule 12), for Needle Strike, which the sources count but list neither as an Ancestral Art nor as a Silk Skill. `source` may point at the guide page actually read (the orchestrator cannot open the main wiki); Athos swaps it when he checks the entry. No signature changed.
- 2026-10-20, Phase 5 (full tracker), written by the orchestrator from Athos's answers in `docs/PHASE-5-FULL-TRACKER-PLAN.md`; **the text awaits his review**. All additive, so the existing 62 entries, Progress, sync and the four screens keep their meaning: entries get the optional fields `counts` (default `true` for a Collectible; `false` = tracked, not counted), `price` (Rosaries, for shop entries) and `toolColor` (for the Build picker); `requirements.js` gets `isCounted` and `rosariesToSpend`, and `regionProgress` counts with `isCounted`; validator rules 6, 11 and 12 get the matching checks, with a second approved type list for tracked-only Collectibles; the interface counts with `isCounted` (section 5). Progress does not change: the plan's "numbers block" for Rosaries was dropped, because Athos chose ticking shop entries as bought over typing a number (ADR 0005), so ADR 0001's union merge still covers everything. Why `counts` and not a third `kind`: every check, screen and test that reads `kind` keeps working, and a Memento stays a thing you obtain (a Collectible), not a thing you do (a Task). No `currency` field: no source read shows a shop priced in Shell Shards. No Crest slot field yet: sources disagree on slot layouts (section 8). **Approved by Athos, 2026-10-20.**
- 2026-10-20, Phase 5, second round (Athos's answers to the Phase 5 questions; written by the orchestrator, **the text awaits his review**). Still additive: the 62 entries, the four screens and every Progress saved so far keep their meaning.
  - **One entry per thing** (section 1): `kind`, `counts` and `requires` answer different questions, so a Collectible the story needs is one Collectible entry with `counts: false` when not counted. Drifter's Cloak moves from Task to `collectible` with `counts: false` (same id, after P5-3); the Hunter Crest is a normal entry, `counts: false`.
  - **Build fields on entries** (section 1): `slots`, `slotsMax`, `grantsSlots`, `upgradeOf`, `effect`. No `data/builds.json` and no templates (Athos; **reversed in the third round below**: templates now exist and live in `data/builds.json`, while these per-entry fields stay on entries). Why on entries: they describe one entry each, and a second file would need its own version, loader and cross-checks for no gain. Validator rule 13, and rule 10 for `effect`.
  - **`js/builds.js`** (section 2a): `slotsFor`, `ownedByColour`, `checkBuild`, pure. Why a module: the picker mixes data and Progress with several edge cases (caps, upgrades, Vesticrest slots, retired ids), which unit tests catch more cheaply than manual QA. Not asked for by Athos; he may fold it into the page script.
  - **Progress gets three optional fields** (sections 1 and 3, ADR 0006, ADR 0001 addendum): `crestSlots`, `builds` (Athos asked for saving a Build; the field is `builds` rather than "loadouts" because the glossary word is Build) and the provisional `shellShards` (**dropped in the third round below**; never built). New setters `setCrestSlots`, `setBuild`, `setShellShards` (the last one dropped with it); `loadProgress` and `onProgressChange` carry the fields; merge, import, export and `clearProgress` rules written per field; "missing is not empty" protects saved Builds from older pages. `firestore.rules` must accept the three keys as optional, and Athos publishes that before the new `progress.js` is merged. The localStorage key stays `:v1`.
  - **Pages** (section 5): `trackers.html`, `rosaries.html`, `builds.html` with their own page scripts; the header gains Trackers, Rosaries and Builds (option A on phones).
  - What this replaces: the first round's "Progress does not change" (above) and the section 8 assumption that a Build is not stored.
- 2026-10-20, Phase 5, **the Route rule** (Athos delegated the decision: "do what is best for the project"; the orchestrator's decision, which he may overrule). `routeIds(items, regions)` added to `requirements.js` (section 2): an entry is on the Route when it is counted, a Task, `missable`, or needed (down the chain) by an entry on the Route or by a Region. `nextStep` and `holdingYouUp` look only at entries on the Route; their signatures do not change. The Route page, Region card Complete and Home's "everything is done" use the Set; the Region page labels entries off the Route "Not on the route" (section 5). Validator rule 14 (warning). Tasks P5-25 to P5-28 in `docs/PHASE-5-FULL-TRACKER-PLAN.md`.
  - **Why decide now:** sheet 2's P5-16 adds 34 tracked entries in ten Act 1 Regions. Without a rule, a Region already Complete would drop back (Greymoor would need two Memory Lockets, a Bone Scroll and a map) and "Next on the route" could point at a map.
  - **Why this rule:** the Route's job is 100 percent and every Ending, which is what the counted list and the Tasks describe; extras keep a home on the Region page and the Trackers. Three refinements of the first proposal ("counted, or a Task, or required by some entry or Region"): (1) "needed by an entry on the Route" instead of "by any entry", because otherwise the Bellhome Key would sit on the Route, and could be "Next on the route", only because the four furnishings that are themselves off it require it; (2) `missable` entries stay on, so a time-limited extra is still announced at the right moment; (3) one function returning a Set, worked out once per page, instead of a per-entry test that would walk the data again for every entry.
  - **Why Tasks stay on whatever they lead to:** a Task is only in the data when it opens two or more things or a Region needs it (Act 1 decision 5), or an Ending needs it (Act 3 sheet), so it is part of the way through the game; taking Tasks off would need a second rule for them and would move nothing in today's data.
  - **What moves on today's data** (`data/`, `dataVersion` 5): only `hunter-crest`, which Phase 5 itself added. It leaves the Route (the starting Crest; the game does not count it and nothing needs it), so the Route lists 62 entries instead of 63, "Next on the route" after Moss Mother is Silk Spear instead of the Hunter Crest, and Moss Grotto shows Complete without it. The player ticks it on the Moss Grotto page or the Crests tab (the Build picker offers only ticked Crests). The 62 entries from before Phase 5 keep their place; no count, Region total or "Holding you up" result changes. Making something require the Hunter Crest to keep it on the Route was rejected: it would be an invented game fact.
  - **Replaced:** the section 2 test sentence "an entry with `counts: false` still works in ... `nextStep` and `holdingYouUp` exactly like any other entry" (it now holds for chains only), and the section 8 open point on tracker entries.
- 2026-10-20, Phase 5, **third round** (Athos's answers as relayed to the orchestrator: he now wants Build templates and points of interest, allows a MapGenie link as a `source`, and wants Shell Shards worked out from entries; written by the orchestrator, **the text awaits his review**; ADR 0007). Still additive: no existing file, function signature, page or saved Progress changes meaning, and the current `data/` passes the validator untouched (the two new files are optional).
  - **Build templates and synergies** in a new optional `data/builds.json` (section 1). Why a file and not fields on Crest entries: a template groups several entries and belongs to none, a synergy is a pair, and keeping editorial groupings out of `items.json` keeps game content and our suggestions apart (ADR 0007). The template's `build` has the saved Build's shape, so "Use as my Build" is a copy and `checkBuild` checks it. `editorial` is required so every template says whether the grouping is ours or a guide's; a synergy is never editorial and its `source` must name both entries.
  - **Places** (glossary) in a new optional `data/places.json` (section 1): a short approved `kind` list, `requires` with the entries' meaning, `sells` on shops. Not entries: no `step`, never done, never in Progress, counts or the Route. Why `sells` on the Place and not `soldAt` on the entry: links point from the new files to `items.json` and never back, so the existing files stay valid and a page that does not load `places.json` is unchanged.
  - **Functions:** `missingForPlace` in `requirements.js` (section 2); `fitTemplate`, `synergiesIn`, `synergyPartners` in `builds.js` (section 2a); `loadPlaces` and `loadTemplates` in `data.js` (section 5). No existing signature changes.
  - **Pages** (section 5): a Places section on the Region page, "Sold by" on the Rosaries page, templates and synergies on the Build picker. No new page, no new header link.
  - **Validator:** rules 1, 2 and 10 widened; rules 15 (`builds.json`, checked with `checkBuild` itself) and 16 (`places.json`, and the MapGenie address warning for every `source`).
  - **Sources and MapGenie** (section 1): a MapGenie Silksong map link is allowed as a `source`, only as a citation of where something is, never as the origin of our text; agents still never fetch or scrape MapGenie (`CLAUDE.md` rule 9), so such a link is unchecked until Athos opens it.
  - **`shellShards` dropped** (sections 1 and 3, ADR 0006): no Progress field, no `setShellShards`, no `tookShellShards` in the import result (the code still returns it as an always-false key until P5-45), no Firestore rules change (the rules never accepted the key). Shell Shards come from entries, like the Rosaries; which entries and which field is open (section 8).
  - **What this replaces:** the second round's "no `data/builds.json`, no templates", `STRUCTURE.md`'s "points of interest stay optional, after everything else", and the provisional `shellShards`.
- 2026-10-20, **the Goal** (Athos asked to choose one thing and see everything it needs; his answers: this device only, one at a time, spoilers shown, the word Goal; written by the orchestrator; **approved by Athos, 2026-10-20**). Additive: no existing signature, page, data file or saved Progress changes meaning.
  - `pathTo` in `requirements.js` (section 2): `missingFor` plus the Goal itself and an `available` flag per row. Why a function and not page code: the order rule (the Goal always last) and the done case are easy to get wrong, and pure functions are cheap to test.
  - `loadGoal`, `setGoal`, `onGoalChange` in `progress.js` (section 3), under their own localStorage key, outside Progress: not synced, not in backups, cleared by "Start a new run". Why in `progress.js`: it is the only module that touches localStorage. Why outside Progress: no Firestore rules change, nothing to merge (section 3, "Goal storage").
  - New page `goal.html` with `js/goal-page.js`, a button on every entry row and on the "Next on the route" plate, and a Home plate (section 5). No header link.
  - Not in this change: bosses as their own entries (Part 2: a research sheet, then data; the Route rule for bosses that give nothing is decided with it).

- 2026-10-20, **bosses** (Athos: every boss its own entry; "go with your recommendations"; `docs/PHASE-3-BOSSES.md`). Optional field `optional` on Tasks (section 1); `routeIds` no longer puts a Task with `optional: true` on the Route by itself (section 2); validator rule 6 checks the field. Why a field and not "a boss is on the Route only when needed": that rule pushes Lost Lace off the Route, since nothing requires it (it is only an Ending condition) and `routeIds` does not read `endings.json`; reading Endings would change `routeIds`'s signature for every caller, for the same result on the data. Simulated on a copy of `data/` with the new rows: nothing on the Route today leaves it, and no entry on the Route comes before what it needs. No signature changed. Approved by Athos.

## 8. Open contract questions

- Should a later version offer "replace" as well as the union import? (V1: union only, confirmed.)
- How a `step` that depends on a player choice (an Ending's `locksOut`) is represented in the Route. The Route screen has a "Choice point" marker; the data rule is open.
- What the three `spoiler` levels mean, and whether any of them needs behaviour in V1 (assumed: no; the original plan only says the field lets entries stay hidden until the player gets there).
- The localStorage key (`silksong-guide:progress:v1`) and the `firebase-config.js` file name are proposals, not decisions.
- Phase 5 (full tracker), still open:
  - **Shell Shards from entries: which entries, which field?** Settled that it is not a number in Progress (third round, ADR 0007); Athos wants it "like the Rosaries". Sheet 2 (section 3.11) found Shell Shards paid only to wishes (the Bone Bottom Donate wishes, 200, 300 and 440, one source), never in a shop, and Shard Bundles bought with Rosaries are consumables that are not tracked. **Proposal, not contracted:** an optional integer field `shardPrice` on the entries that cost Shell Shards (the Donate wish Tasks), and a pure `shellShardsToSpend(doneSet, items, regions)` shaped like `rosariesToSpend`, shown as one line on the Rosaries page. A separate field rather than a `currency` on `price`, so `rosariesToSpend` and every priced entry keep their meaning, and an entry could cost both. Waits for a research pass that confirms which entries cost Shell Shards and how much (P5-46).
  - **Places, still open (third round):** (1) an all-Regions view of Places (none, a Places tab on the Trackers page, which would need the Tracker definition widened because a Place has no done and total, or a seventh header link); the orchestrator's recommendation is none for now, since the Region page and the Rosaries page are where the player needs them; (2) whether Ventrica stations (the Citadel's travel stops, named in sheet 2) get their own `kind` or use `other`; recommendation: add `ventrica` to the list when the places sheet confirms them (a one-line change in rule 16); (3) whether a non-shop Place may link to entries (an NPC who gives a wish), as Hollow-Thingy's `item` link does; not needed now.
  - **Templates rest on Crest layouts.** Rule 15 checks a template against its Crest's `slots` and `slotsMax`. All seven Crests in `data/` have them (`dataVersion` 10), but sheet 1 section 5 lists some of those layouts as disputed (Witch and Shaman slots, the Hunter Crest's white slot). A template that needs a disputed slot inherits the dispute: the templates sheet (P5-37) marks which slots each template uses, and if a layout is corrected later, rule 15 flags every template that no longer fits.
  - **The ten disputed build facts** in `docs/PHASE-5-SHEET-1-BUILDS.md` section 5 (Witch and Shaman slots, Hunter's white slot, Wanderer gate, two Tool colours, the 51st Tool, six locations, several effects, Eva thresholds, Snitch Pick's price). Not checked (Athos, 2026-10-20, "not now"). Fields that depend on them are left out of the data, never guessed; the picker shows such a Crest as "Not in the guide yet".
  - **May sheet 1's undisputed facts go into `data/`?** Athos has not checked them either. Dev C adds build fields to existing entries (P5-14) only after he says which.
  - **Which Tracker each type goes on.** Proposal from the T30 mockups' six tabs: Crests (`crest`); Tools and Skills (`tool`, `silk-skill`); Abilities (`ancestral-art`, `ability`, `sylphsong`, `everbloom`); Equipment (tracked-only types the Mementos and Equipment sheet names, plus `map`); Mementos (`memento`); `relic` waits for that sheet (the glossary keeps Relic and Memento apart); Keys and key items (`simple-key` and other key Tasks). The counted stat and upgrade types (`mask-shard`, `spool-fragment`, `silk-heart`, `needle-upgrade`, `crafting-kit-upgrade`, `tool-pouch-upgrade`) have no tab in the mockups: a seventh tab ("Upgrades") or no Tracker for them is Athos's choice.
  - **Which types make up Equipment.** `relic` and `map` are on the tracked-only list because sources show those categories exist outside 100 percent; the rest comes from the Mementos and Equipment sheet.
  - **Shop entries with a material cost** (a vendor that also asks for Craftmetal or Pale Oil) and entries sold in more than one place or at more than one price. `price` holds Rosaries only; the material is a `requires` if it is an entry, otherwise text in `how`.
  - **One-of-a-kind choices** (the three Silkshot versions: only one per run). Likely an `oneOf` group field, tied to the open "Choice point" question above; not needed for the picker, which only offers what is done.
  - **Tracker entries on the Route and in Region states: decided 2026-10-20** (section 7, "the Route rule"; `routeIds` in section 2). What it means for the coming data:
    - **Sheet 2, Act 1 (P5-16):** all 34 tracked entries are off the Route. None is `missable`, and nothing on the Route requires any of them (the four furnishings require the Bellhome Key, which is off the Route for that reason). So P5-16 moves no Route row, no "Next on the route", no "Holding you up" and no Region card state.
    - **Sheet 2, Acts 2 and 3 (section 2.4):** relics, Memory Lockets, maps, the Gramophone, the Ventrica Pins, the Materium, Farsight and the Crawbell go off the Route. Keys and key items are on it exactly when an entry on the Route or a Region lists them in `requires` (the Ruined Tool, which a counted Silkshot needs, will be). So **`requires` must be complete:** a key that opens a counted entry but is missing from that entry's `requires` drops off the Route without any error. Each batch's handoff lists the tracked entries that land on the Route, and why.
    - A tracked entry the player can lose (the Guardian's Memento, M4, if Athos confirms it) gets `missable: true`, which puts it on the Route.
    - A Task that leads only to an entry off the Route stays on the Route without its reward (the Clover Dancers wish and its Memento, Act 3, M2). Act 1 decision 5 already folds a wish into its reward; the Act 3 batch does so here unless an Ending needs the Task.
    - Sheet 2's E3 and E4: a Task is always on the Route, so thirty flea Tasks would add thirty Steps; a key turned into a Collectible with `counts: false` stays on the Route only through `requires` (`simple-key` is required by `flintslate`, so it stays either way).
    - Endings: their conditions are expected to be Tasks or counted entries (the Act 3 plan's are fight Tasks). If the endings batch needs a tracked-only Collectible as a condition, rule 14 warns and the orchestrator adds Ending conditions to `routeIds` (a new argument, so a contract change).
    - `docs/DESIGN.md` still says Complete means "every entry in the Region is done"; the orchestrator updates it to "every entry on the Route" before P5-27 is handed out.
  - **Save file import** (in scope, last; read-only preview first). Open for Athos: whether the public repository may ship the game's decryption key (it is Team Cherry's; community tools ship it). Also open: where the save-flag-to-entry-id table lives (likely an optional per-entry field) and whether a later "apply" adds through the union import. Nothing is contracted until the spike (P5-23) reports.
  - Settled on 2026-10-20 and moved to section 7: whether a Build is stored (yes, one per Crest), Crest slot fields (shapes contracted, values wait for facts), Drifter's Cloak (Collectible, `counts: false`), tracker entries on the Route and in Region states (the Route rule), and in the third round: Build templates (yes, `data/builds.json`), points of interest (yes, Places in `data/places.json`), MapGenie links (a citation only) and the Shell Shards reading (from entries, not a Progress number).
