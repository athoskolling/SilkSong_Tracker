# Silksong Guide

A progress guide for Hollow Knight: Silksong that helps a player reach maximum completion and every ending, tracking what they have done and what is still missing.

## Language

**Collectible**:
A permanent thing a player can obtain. Most Collectibles are **counted**: they count toward the site's completion counts, which follow what the game itself counts toward 100 percent (Athos, 2026-10-20): stat items (Mask Shards, Spool Fragments), Silk Hearts, Needle upgrades, abilities (Ancestral Arts, Silk Skills and Needle Strike), Crests, Tools (an upgraded Tool is not counted again), Crafting Kit and Tool Pouch upgrades, Sylphsong and Everbloom. A few are tracked but **not counted**, because the game does not count them (Mementos and Equipment; Athos, 2026-10-20): they appear on their Tracker with their own count and never in the headline number (ADR 0005). A thing the player obtains is a Collectible even when the story needs it to go on (for example the Drifter's Cloak): it stays one entry, not counted if the game does not count it, and what it opens lists it as a requirement (Athos, 2026-10-20).
_Avoid_: Item, pickup, loot

**Memento**:
A keepsake Collectible the game does not count toward 100 percent. Tracked on its own Tracker, not counted.
_Avoid_: Relic (in the game a Relic is a different thing, sold to a vendor), trophy, souvenir

**Equipment**:
A Collectible the game does not count toward 100 percent that is not a Memento (for example a map). Tracked on its own Tracker, not counted. Which things belong here comes from research, not memory.
_Avoid_: Gear, inventory. Do not use Equipment, "equipped" or "loadout" for the Tools and Crest the player has on: that is a Build.

**Tracker**:
One tab of the Trackers page: every entry of one category (for example Tools, Crests, Mementos), counted or not, with its own done and total, separate from the headline completion count.
_Avoid_: Checklist, list, collection (for the tab)

**Build**:
A Crest plus the Tools and Silk Skills placed in its slots. The site offers a picker from what the player has marked done, and the player can save one Build per Crest in their Progress (Athos, 2026-10-20; ADR 0006). The picker also shows Templates for the chosen Crest (ADR 0007).
_Avoid_: Loadout, setup, kit (Crafting Kit is a Collectible), charm build

**Template**:
A suggested Build for one Crest, kept in the guide data (`data/builds.json`), with a short goal and a source. It is either our own grouping (shown as "Our suggestion") or a Build a guide recommends ("From a guide"). Using one copies what the player owns from it into the picker; it is saved only if the player saves it as their Build (Athos, 2026-10-20; ADR 0007).
_Avoid_: Preset, recommended loadout, meta build

**Synergy**:
Two Tools or Silk Skills that a source says work better together, with what they do together in our words. Always backed by a source that names both; a pairing that is only our opinion belongs in a Template's goal instead (ADR 0007).
_Avoid_: Combo, pairing (for the data entry)

**Opened slot**:
A Crest slot the player has opened by spending a Memory Locket on that Crest. Recorded per Crest and colour in Progress, because where a Memory Locket goes is the player's choice.
_Avoid_: Unlocked slot (we do not say unlocked)

**Task**:
Something a player must do that is tracked but adds nothing to the counts by itself, usually because it unlocks a Collectible (a quest, a boss fight, a delivery). Something the player obtains is never a Task, even when it adds nothing to the counts: it is a Collectible that is not counted.
_Avoid_: Quest (when it means any task), objective

**Ending**:
One of the game's distinct conclusions, reached by completing specific requirements.
_Avoid_: Finale, outcome

**Lockout**:
A choice or event after which one or more Endings can no longer be reached on the same run.
_Avoid_: Point of no return, missable (reserved for Collectibles)

**Run**:
One playthrough tracked by an account; each account has exactly one at a time.
_Avoid_: Save (as a noun), profile, playthrough. The verb is fine: "Your progress is saved on this device."

**Region**:
A named area of the game's world that groups Collectibles and Tasks for the guide.
_Avoid_: Zone, area, level

**Sub-area**:
A named part of a Region (for example Bone Bottom), recorded only as a label on entries and Places.
_Avoid_: Area, zone

**Place**:
A fixed spot in a Region worth knowing about: a bench, a Bellway station, a shop, an NPC, a wish board and the like. Listed on its Region page so the player can find their way; a shop Place lists the entries it sells. A Place is not a Collectible or a Task: it is never marked done, never counted, has no Step and is not on the Route (Athos, 2026-10-20; ADR 0007).
_Avoid_: Point of interest, POI, landmark, location (for the data entry)

**Route**:
The single ordered sequence of Steps that the guide recommends across all Regions.
_Avoid_: Walkthrough, path, order

**Step**:
One position in the Route, pointing at a Collectible or Task.
_Avoid_: Stage, milestone

**Available**:
A Region whose requirements the player has met, so it can be entered.
_Avoid_: Unlocked, open

**Locked**:
A Region whose requirements are not yet met; it shows only its name and what is still missing.
_Avoid_: Hidden, disabled

**Visited**:
A Region the player has marked as visited, or in which they have checked something off; it controls spoiler hiding and is separate from Available.
_Avoid_: Discovered, explored

**Progress**:
The set of Collectibles and Tasks a player has marked as done, and the Regions marked as Visited, in their Run. Since Phase 5 it also keeps two player choices: the opened slots per Crest and the saved Builds (ADR 0006). It holds no Rosaries or Shell Shards number: those are worked out from entries (ADR 0005, ADR 0007).
_Avoid_: Save data, state
