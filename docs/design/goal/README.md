# Goal mockups (GOAL-1)

Mockups for the Goal feature (`docs/CONTRACTS.md` section 5, "Goal"; brief in `docs/DESIGN.md` section 6). Static HTML that links `css/base.css` and `css/components.css`, plus `goal.css` for the few new pieces. All names, steps and counts are invented ("Example relic", "Region A"); none of it is guide data. Each mockup has `-desktop.png` (1280 px, scale 1) and `-mobile.png` (390 px, scale 2).

## Files

| Mockup | What it shows |
|---|---|
| `goal-page` | The normal Goal page: a Goal with 6 rows left over three Regions. |
| `goal-none` | No Goal yet. |
| `goal-done` | The Goal is done. |
| `goal-retired` | The Goal id is no longer in the guide. |
| `home-plate` | Home with the "Your goal" plate under "Next on the route". |
| `row-button` | The "Make this my goal" control: on a Region page row, on a Route page row, on the "Next on the route" plate, each not pressed and pressed. Also `row-button-focus-desktop.png` and `-mobile.png`: the focus ring on the control. |

Support files: `goal.css` (new styles; would become `css/goal.css`), `_build.mjs` (writes the six HTML files), `_shoot.mjs` (screenshots and checks, see below), `_contrast.mjs` (contrast table).

## Design in short

- **The control** is a text button at the foot of an entry row (after the how line and the needs line), and inside the actions line of the "Next on the route" plate. `<button type="button" class="goal-btn" aria-pressed>`, 44 px tall (182 x 44 px not pressed, 128 x 44 px pressed, measured). Not pressed: dashed thread outline, a hollow needle eye, "Make this my goal". Pressed: solid silk outline, faint silk fill, filled silk eye, "Your goal". Line style, icon fill and words all change, so the state is not color alone. Focus is the global ring (`2px solid var(--silk)`, offset 3px).
- **Accessible name**: the visible words first, then the entry's name in visually hidden text ("Make this my goal: Example tool"), so a screen reader knows which row it is on and the visible label stays inside the name.
- **The Goal page** uses the Route's layout: the summary plate in the rail (first in the document, above the list on a phone), the rows hanging on the thread in the main column. The first row that is Available now is the stitched "next" row with "Available now" in silk; rows that still need something have the dashed thread, a hollow dashed mark and "Needs X" in silk. The last row is the Goal and carries "Your goal" in its meta line (text, not a button). No Step grouping and no Region headings: each row names its Region as a link.
- **Home plate** is a plain dashed plate (not stitched) directly under "Next on the route", so that one plate stays the only stitched plate on the page.

## Copy proposed (every visible string)

Shared on all Goal states: header and footer as on the other pages (no new header link); `h1` "Your goal".

### goal-page

- Hero intro: "Everything it still needs, in route order, with the goal last."
- Rail heading: "Your goal". Goal name (sample "Example relic"), meta: type, Region link (sample "Ability", "Region C").
- Count: "6 rows left, the goal included." then bold "1 available now." Singular: "1 row left, the goal included." (the Goal alone then reads "Available now" on its row).
- Button: "Clear my goal".
- Rail help, line 1: "Every row is shown in full, spoilers included, because you chose this goal."
- Rail help, line 2: "Your goal is kept on this device only. It is not in the backup file."
- Visually hidden heading for the list: "What it still needs".
- Each row: name; "Step N"; meta line: type, Region (link to `region.html?id=`), Sub-area, "Can be missed" (only if missable), "Available now" (only if available), "Your goal" (the last row only), "Source" link; how line; the missable note (only if missable); "Needs X" line (direct requirements not done, as elsewhere); done bead with the entry name as its label.
- Footnote under the list: "Tick a row when you finish it and it leaves the list. A bead is a collectible and a knot is a task. A dashed thread means something is still missing."
- Live region after a tick: "Marked as done. 5 rows left." (the same message pattern as the other pages; wording for the build).

### goal-none

- Hero intro: "Pick one entry and see everything it still needs."
- Plate heading: "You have no goal yet".
- Text: "Choose an entry with Make this my goal on the route, on a region page or in a tracker. This page then lists everything it still needs, in route order."
- Links: "Open the route", "Open the trackers".

### goal-done

- Hero intro: as above.
- Label: "Done". Heading: the Goal's name. Meta: type, Region link.
- Text: "You marked your goal as done. Clear it, then choose another from the route, a region page or a tracker."
- Button "Clear my goal" (primary), link "Open the route".
- Help: "Your goal is kept on this device only. It is not in the backup file."

### goal-retired

- Hero intro: as above.
- Heading: "Your goal is no longer in the guide".
- Text: "The entry you chose was removed or replaced when the guide was updated, so there is nothing to list. Clear it, then choose another entry."
- Button "Clear my goal" (primary), link "Open the route".
- Help: "Your goal is kept on this device only. It is not in the backup file."

### home-plate

- Plate heading: "Your goal". Goal name; meta: type, Region.
- Count: "6 rows left, the goal included."
- Right column: label "Available now", the first Available row's name, its type and Region.
- Link: "See everything it needs" (to the Goal page). No Goal: no plate.
- The "Next on the route" plate gains the control "Make this my goal" in its actions line, after "See the whole route" and "Open <Region>".

### row-button

The page itself is a sheet; its headings and notes are mockup captions, not interface copy. Interface strings are the control's two labels: "Make this my goal" and "Your goal".

## Decisions and open questions for Athos

1. **Done rows have no control** in the mockup (a Goal that is already done would just show "Done"). The contract says "every entry row"; this is a proposed exception. Say if you want the control on done rows too.
2. **One stitched row or every Available row?** The mockup stitches only the first Available row and shows "Available now" on it. When two rows are Available at once (two independent requirements), the proposal is: only the first is stitched, every Available row gets the "Available now" word. Not drawn; say if you prefer every Available row stitched.
3. **The Goal page rows have no "Make this my goal" control.** The rows are prerequisites; the Goal's own row says "Your goal" in text and "Clear my goal" sits in the plate. Making a prerequisite the new Goal could be added later.
4. **The retired state does not name the old entry**, because the stored value is only an id (a slug the player never saw). Offering the id would be noise.
5. **The label changes with the state** ("Make this my goal" / "Your goal") and `aria-pressed` changes too. Some accessibility guides say to keep the label fixed when `aria-pressed` carries the state; the contract wants "Your goal" visible, so both change. A screen reader says "Your goal: Example tool, toggle button, pressed", which reads fine.
6. **Pressing a pressed control clears the Goal** (contract). The label does not say so. If testers miss it, "Your goal. Press to clear" could replace "Your goal"; the "Clear my goal" button on the Goal page is the visible way.
7. The Home plate sits under "Next on the route" in the left column. The alternative, the right column above "Your thread", would hide it below the fold on a phone (the rail follows the main column there).

## Contrast (WCAG AA, `_contrast.mjs`)

Every new pairing passes. Lowest ratios: control border not pressed (thread, dashed) on the page 3.82:1 and on the Next plate 3.59:1 (need 3 for a control boundary; the label carries the meaning anyway); "Available now" in silk on the stitched row 5.21:1; the silk label on a plate 5.13:1; hover text in silk 5.21:1 on the Next plate. No token was changed.

## How the screenshots were made

No Playwright here, so `_shoot.mjs` drives the system Chromium (`/usr/bin/chromium`, headless) over the DevTools protocol with Node's built-in WebSocket: `node docs/design/goal/_build.mjs && node docs/design/goal/_shoot.mjs`. Reduced motion is emulated so the start thread is drawn in full. The script also reports horizontal overflow at 390, 360 and 320 px (none found) and the size of every control and bead (all at least 44 px tall, none overlapping).

> The mockup screenshots (`*-desktop.png`, `*-mobile*.png`) are not kept in the repository (cleanup, 2026-10-21). The HTML files are the mockups; `_shoot.mjs` regenerates the PNGs.
