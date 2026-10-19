# Design

The visual design for V1 is finished. This document is its written contract; the pictures are the ground truth for how it looks.

**Read this first: the mockups contain sample content, not guide data.** Entry names, step numbers, requirements, counts, region states and the "Next on the route" plate in `docs/design/` only show states a screen can be in. They were written to look realistic and have **not** been checked against the wiki or any other source. Never copy a name, step, requirement or number from a mockup into `data/` or into the interface code. Real content comes from Athos and the wiki in Phase 3.

## 1. What is in `docs/design/`

| Folder | What it is |
|---|---|
| `screens/` | PNG screenshots of every screen and state. Look at these first. |
| `mockups/` | The same screens as static HTML (open in a browser). Styles are inline so the exact sizes, colors and spacing can be read from the markup. Image paths are relative and work from this folder. |
| `art/` | `deep-docks-hero-drawn.svg` (+ preview PNG): a hand-drawn fallback hero, no game assets. |

| Screen | PNG | Mockup | Page |
|---|---|---|---|
| Home | `01-home.png` | `Home.html` | `index.html` |
| Region (Available / Visited) | `02-region-deep-docks.png` | `Main.html` | `region.html?id=...` |
| Region (Locked) | `03-region-locked-far-fields.png` | `Locked.html` | `region.html?id=...` |
| Route | `04-route.png` | `Route.html` | `route.html` |
| Account, signed out | `05-account-signed-out.png` | `Account.html` | `account.html` |
| Account, signed in | `06-account-signed-in.png` | `Account.html` (signed-in state) | `account.html` |
| Region on a phone (390 px) | `07-region-phone.png` | `RegionMobile.html` | `region.html` at phone width |

The mockups were exported from an editable design canvas. They are static: no sign-in, no saving and no real data. The mockup HTML is a reference to read, not code to ship.

## 2. Idea in one paragraph

The guide is a thread. A needle draws a thread down each page; every entry hangs on it. A **bead** is a Collectible. A **knot** (a small diamond) is a Task. A solid thread means the way is clear and a dashed thread means something is still missing. Progress bars are a needle and thread. The mood is dark lacquer, ivory text and one hot red-pink accent, close to the game's world without using its art.

## 3. Tokens

Define these once in `css/base.css` as custom properties on `:root`.

| Token | Hex | Use |
|---|---|---|
| `--night` | `#130B13` | page background |
| `--lacquer` | `#1F111C` | panels, plates, cards |
| `--ivory` | `#F2E9D8` | primary text, links |
| `--ash` | `#B7A3A6` | secondary text, done entries, labels |
| `--silk` | `#EC555B` | accent: next step, active nav, blocked items, focus ring, links on hover |
| `--bronze` | `#D9A650` | done beads, completion |
| `--ember` | `#FF7A3D` | warnings, "can be missed" |
| `--thread` | `#8A6471` | the thread line, borders |

Contrast: Dev B checks every text and meaningful non-text pairing (WCAG AA: 4.5:1 for text, 3:1 for icons, thread lines and focus rings) and reports any pair that fails. Do not change a token to pass; report it to the orchestrator.

## 4. Typography

- **Display: Gloock**, regular, for the logo, page titles and numerals in headings. Region title `clamp(52px, 8vw, 100px)`, line-height `.95`, letter-spacing `-0.02em`. Logo 24px.
- **Body and UI: Instrument Sans**, weights 400, 500 and 600.
- Scale used by the mockups: 100/52 title, 24 logo, 19 entry name (600), 18 intro, 15 body and nav, 14 helper text, 13 meta (type label, "Step N"). Step numbers use `font-variant-numeric: tabular-nums`.
- Body line length is capped at about 60 characters (`max-width: 60ch`); the region intro at 46ch.
- Loading: the mockups use Google Fonts. The real site may use that with `display=swap` or self-host the woff2 files. Dev B decides and records it in the handoff note. Either way, give a system-font fallback (`Georgia, serif` for Gloock, `system-ui, sans-serif` for Instrument Sans).
- Sentence case everywhere. No all-caps labels.

## 5. Components

- **Page frame:** content column max `1120px`, side padding `40px` (`16px` on a phone). Header: logo left, nav right (Regions, Route, Account and backup); the current page has a `2px` `--silk` underline.
- **Hero (Region page):** `460px` tall, image `object-fit: cover` with `object-position` from the Region's `heroPosition` (default `50% 40%`), a top gradient under the header and a bottom and left scrim for the title. The bottom edge is slanted: `clip-path: polygon(0 0, 100% 0, 100% 88%, 0 100%)`. The title sits at the bottom left. The image credit is in the page footer.
- **The thread:** a `2px` vertical line running down the left of the entry list. Solid `--silk` while the way is clear and entries are done; `--thread` for entries still to do; **dashed** `--thread` where the next entry is blocked. A short "start thread" draws down from the hero once on load (`scaleY` 0 to 1, 1.2s). It is the page's single entrance motion.
- **Bead (Collectible):** a `16px` circle on the thread, with a `5px` `--night` ring so the thread appears to pass through it. Done: filled `--bronze`. Not done: hollow with an `--ivory` border. Blocked: dashed `--ash` border.
- **Knot (Task):** a `12px` square rotated 45° (diamond), `border-radius: 1px`, same ring. Done: filled `--bronze`. Next on the route: `--silk` border with a second `--silk` ring. Blocked: dashed `--ash` border.
- **Hit target:** each bead or knot is a `<button type="button" aria-pressed>` with an `aria-label` of the entry name and a `44 × 44px` hit area around the `16px` mark.
- **Entry row:** name (19px, 600, `--ivory`; `--ash` when done), "Step N" at the right (13px, `--ash`), a meta line (type label, Sub-area, "Can be missed" in `--ember`), a body line (`how`, 15px, `--ash`), and a requirement line ("Needs Swift Step", "Needs Swift Step, done") in 14px `--ash`.
- **Next on the route plate:** the one entry that is next gets a stitched plate: `1.5px dashed` border at `--silk` 60% alpha, background `--silk` at 7%, padding `18px 22px`, and the words "Next on the route" in `--silk` 500.
- **Plates (dashed boxes):** panels with a `1.5px dashed` border at `--ivory` 30% alpha and a vertical gradient from `#22121D` to `#1A0E17` (close to `--lacquer`), used for the "Holding you up" rail, Route filters, Account sections, "How saving works" and the "Its entries stay hidden" notice. Section headings inside plates are Gloock, 26 to 30px. Primary buttons are solid `--ivory` with `--night` text, 48px tall; secondary buttons have a `1.5px` `--ivory` 60% border; the destructive "Start a new run" button uses a `--silk` border and text.
- **Needle-and-thread progress bar:** an `18px`-tall row. The track is a `2px` dashed line in `#4A3340` (a darkened `--thread`; call it `--track`), the filled part is a `2px` solid line (`--silk` for Collectibles, `--ash` for Tasks) and a small needle (28 × 18 SVG, an eye and a thread) sits at the filled end. The label above it ("12 of 20", `tabular-nums`) is the text equivalent; the Collectibles count is `--bronze` 600, the Tasks count `--ash`. Give the bar `role="progressbar"` with `aria-valuenow`, `aria-valuemax` and the same label.
- **Region card (Home):** one of five states, each with its own label: Complete, Visited, Available, Locked ("Needs Defeat Lace" style text and "Its entries stay hidden."), Not in the guide yet ("Its entries ship in a later batch."). The card that holds the next step says "Next on the route is here".
- **Buttons and links:** links are `--ivory` with a `3px` underline offset, `--silk` on hover. Buttons are text-first. Visible focus everywhere: `outline: 2px solid var(--silk); outline-offset: 3px`.
- **Toggles:** "I have visited this region" and "Show everything, spoilers included" are real checkboxes with labels.
- **Footer:** one line of attribution and the sample warning is dropped in production; keep the Team Cherry credit for any game screenshot (see `docs/IMAGES.md`) and the data sources.

Motion: the start thread is the only non-interactive motion. State changes that answer a click (marking an entry, opening a section) may animate briefly. `@media (prefers-reduced-motion: reduce)` turns all of it off.

## 6. Screens and states

### Home (`index.html`)
1. Hero: "Every collectible. Every ending." and one line ("Mark what you have, see what comes next, and see what each locked region still needs.").
2. **Next on the route** plate: the next step in the Route (the first entry not done whose requirements are met), its Region and step number, a one-line `how`, and two actions: "See the whole route" and "Open <Region>".
3. **Holding you up:** the few missing requirements that block the most entries or a whole Region ("Blocks <entry> and 1 more entry in <Region>", "Blocks the region <Region>"), with a link "See everything on the route".
4. **Your thread:** Collectibles total ("12 of 20"), Tasks total ("7 of 14") with bars, then Collectibles by type ("Ability 2 of 3"). Counters use only Collectibles, except the Tasks total, which is labelled as Tasks.
5. **Regions:** one card per Region in `order`, in one of the five states above.
Empty state (new game): nothing is done, so the totals read "0 of N" and the next plate points at the first entry of the Route. Never show example progress.

### Region (`region.html?id=`)
- Hero with the Region name and its `summary`; "All regions" link above the title.
- Entries in `step` order down the thread, with the states in section 5.
- Right column (below the list on a phone): **Your thread here** (Collectibles "1 of 3", Tasks "0 of 4"), "I have visited this region" and "Show everything, spoilers included".
- **Locked Region:** only the name and what is missing. Heading "Locked. You cannot enter yet. Finish what is below and this region opens." Then the missing requirements in route order, each with its Region and a Collected / Not done yet state, a "Go to <Region>" link, and the Region itself as the last step ("Opens when the steps above are done."). Below it: "Its entries stay hidden" with "They appear once you visit the region. Turn on show everything if you want to read ahead." and the same show-everything toggle.
- **Region not Visited and Available:** entries are hidden behind the same notice until the player marks the Region Visited, completes something in it, or turns on show everything.
- Phone layout (390 px): one column, 16px side padding, hero `380px` tall, the title smaller (`clamp` handles it), the totals after the entry list.

### Route (`route.html`)
- Title "Route", intro "Every step across all regions, in order. Anything waiting on something else shows what it needs."
- Entries grouped under a Region heading ("Deep Docks", "Steps 34 to 40", "Open region"), all in `step` order.
- **Show on the route** filter: "Only what I can do now", "Hide finished steps".
- **Holding you up** rail (right on desktop, above the list on a phone).
- A "Can be missed" flag on missable entries, with the reason in the entry body.
- **Choice point** marker: "The next step closes at least one ending for good. The guide names which ones before you get there, so you can plan for it." The data rule that drives it is still open (see `docs/CONTRACTS.md`).
- A legend line at the bottom: "A bead is a collectible and counts toward your totals. A knot is a task: it adds nothing by itself but opens something else. A dashed thread means something is still missing."

### Account and backup (`account.html`)
- Title "Account and backup"; intro "Your progress is saved on this device. Sign in to keep it in sync everywhere."
- **Sign in to sync** (signed out): "You can use the guide without an account. Signing in saves your progress online and combines it with what is already on this device." Buttons "Continue with Google", "Continue with GitHub" and "Or get a sign-in link by email" with an email field and "Email me the link". Signed-in state (see `06-account-signed-in.png`): the section becomes "Your account" with "Signed in as <email>", a sync status line ("Synced just now."), a "Progress combined" plate after the first sign-in ("N entries were done on this device and M in your account. K are done now. Anything done on either side stayed done, and nothing was removed."), a "Sign out" button and the line "Signing out keeps your progress on this device."
- **Backup file:** "Download backup" and "Add a backup file". Helper: "Adding a backup keeps everything you have and adds what the file has. It never removes progress." (Union import, confirmed by Athos in Phase 0.)
- **Start a new run:** "Clears your progress on this device so you can start again from nothing. You get a chance to download a backup first." The text says "on this device" when signed out and "on this device and in your account" when signed in. The "Start a new run" button opens a confirmation plate: "This clears all your progress <where>. It cannot be undone." with "Download backup first", "Clear my progress" and "Cancel".
- **How saving works:** three short rows: On this device, In your account, When they differ ("The first time you sign in, both are combined. After that, the most recent change wins.").
- **Guide data:** the data version and the number of Regions in the guide, read from `data/`.

## 7. Copy rules

- English only. Sentence case. Plain verbs. No filler and no marketing.
- Say what the thing is or what happens: "Download backup", not "Export". An action keeps its name through the whole flow.
- Use the glossary words in the interface: Collectible, Task, Region, Route, Step, Available, Locked, Visited. Do not say "item", "zone", "unlocked" or "quest" for any of them.
- Errors say what happened and what to do next, with no apology and no vague wording. Example: "That file is not a Silksong Guide backup. Choose a file you downloaded from this page."
- Empty and locked screens give a direction, not a mood.
- Never invent game facts in interface text. Text about the game comes from `data/` only.

## 8. Accessibility and quality floor

- Everything works at 390px wide with no horizontal page scroll.
- Keyboard: every control reachable, visible focus ring, no focus traps.
- `aria-pressed` on the done toggles; live region (`aria-live="polite"`) for "Marked as done" style changes and sync status.
- Do not rely on color alone: done, next, blocked and missable each have a text or shape signal as well.
- Respect `prefers-reduced-motion`.
- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, images with `alt` (decorative hero image uses `alt=""` because the Region name is the heading).

## 9. Images

Short version here; the full rules are in `docs/IMAGES.md`. Region heroes are 16:9, at least 1920 × 1080, in `img/regions/<region-id>.jpg` (or `.png`), with a credit line in `heroCredit`. The only image in the kit today is `img/regions/deep-docks.png` (640 × 360, a screenshot Athos supplied, © Team Cherry). It is a placeholder until a larger one replaces it.
