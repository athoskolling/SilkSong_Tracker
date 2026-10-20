# QA checklist: Silksong Guide V1

Owner: QA 2 (`qa-manual`). Source: `docs/DESIGN.md` sections 5 to 8, `docs/AGENT-PLAN.md` section 8 (V1 definition of done), `docs/CONTRACTS.md` sections 3 and 5.

Each line is one checkable statement. **Fails as** is the severity if the line fails: **critical**, **major** or **minor**. A critical line that fails stops V1.

## How to run

- Serve from the repository root: `python3 -m http.server 8000`, then open `http://localhost:8000/`.
- Check each screen at **1280 px** and at **390 px** wide (browser device mode, touch off).
- Keyboard lines: use Tab, Shift+Tab, Enter and Space only. No mouse.
- Use `?data=sample` for the Locked, Not in the guide yet and two-Region states. Real data has one Region today. A new game means an empty browser profile (or cleared site data).
- Every line that changes Progress: check the stored value in the browser's localStorage key `silksong-guide:progress:v1`.

## Marks used in this list

- **Athos**: needs a real person with a real account, a second device, or the published site. Not run by an agent.
- **blocked: checklist item 4**: compares data with the wiki. Not run until `docs/PHASE-0-CHECKLIST.md` item 4 (wiki license and terms) is checked.
- **decision**: the spec does not settle the behaviour. The line cannot pass until the orchestrator (with Athos) decides; see `qa/reports/` for the open question number.

---

## A. Home (`index.html`)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| A-1 | Hero reads "Every collectible. Every ending." and the line from DESIGN section 6. | Open `/`. Compare the words. | major | |
| A-2 | "Next on the route" plate shows the first Step that is not done and is Available, with its Region, "Step N", one line of `how`, and the actions "See the whole route" and "Open <Region>". | New game: plate points at the first Step. Mark it: plate moves on. | major | |
| A-3 | "Holding you up" lists only missing requirements that block an entry or a Region, each with "Blocks ..." text, and a "See everything on the route" link. | Sample data: mark some entries and compare with DESIGN section 6. | major | |
| A-4 | "Your thread": Collectibles "N of M" and Tasks "N of M", each with a needle bar (`role="progressbar"`, `aria-valuenow`). Tasks never count in the Collectibles total. | Mark one Task and one Collectible. Counts move as expected. | major | |
| A-5 | "Your thread" also shows Collectibles by type ("Ability 2 of 3" style). | Sample data with several types. | minor | |
| A-6 | Regions appear one card per Region in `order`, each in one state with its label: Complete, Visited, Available, Locked ("Needs ..." and "Its entries stay hidden."), or Not in the guide yet ("Its entries ship in a later batch."). | Sample data after some marking shows all five. | major | |
| A-7 | The card that holds the next Step says "Next on the route is here". | Compare with the plate. | minor | |
| A-8 | New game: totals read "0 of N"; no example progress appears anywhere. | Empty profile; open `/`. | major | |
| A-9 | Every link on Home leads to a page that exists. | Click each link (Route included). | major | |
| A-10 | The "next" plate shows the `how` of a Step whose Region has not been Visited. | Look at what the plate shows for a Step in an unvisited Region. | major | decision: open question Q1 |

## B. Region, Available or Visited (`region.html?id=`)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| B-1 | New game, Available Region: entries are hidden behind "Its entries stay hidden" and "They appear once you visit the region. Turn on show everything if you want to read ahead.", with the Visited switch. | Empty profile; open `region.html?id=moss-grotto` (real) or `sample-region-a&data=sample`. | major | |
| B-2 | Entries appear in Step order; each shows name, "Step N", type, Sub-area when present, `how`, and a requirement line ("Needs ..." or "Needs ..., done"). | Visit the Region; read the list. | major | |
| B-3 | Marking an entry (mouse or Enter/Space) turns its mark bronze and filled, sets aria-pressed to true and announces "Marked as done: <name>". | Mark one entry. | major | |
| B-4 | Unmarking removes the entry from Progress; the key is deleted when nothing is left. | Mark, unmark, read localStorage. | major | |
| B-5 | Marking any entry in the Region sets the Region Visited (Visited switch on, entries stay shown). | Empty profile: mark a Task first. | major | |
| B-6 | Switching Visited off by hand keeps entries shown when something in the Region is done. | Mark an entry; switch Visited off. | minor | |
| B-7 | Marking an entry that is not Available is allowed; its line changes to "Needs X, done" once X is done. | Mark a locked entry; then mark its requirement; read the line. | major | |
| B-8 | Exactly one entry carries "Next on the route" with the stitched plate: the lowest Step that is not done and is Available. | Empty profile on Sample Region A: "Sample ability". | major | |
| B-9 | "Your thread here": "Collectibles N of M" (Tasks excluded) and "Tasks N of M", each with a needle bar. | Mark one Task and one Collectible. | major | |
| B-10 | A missable entry shows "Can be missed" and its note. | Sample Region B, "Sample charm". | major | |
| B-11 | "Show everything, spoilers included" reveals entries; switching it off hides them again; it starts off after a reload. | Toggle; reload. | minor | |
| B-12 | Hero: the Region name is the only h1; title "<Region> \| Silksong guide"; summary as intro; the decorative image has `alt=""`; its credit is in the footer. | Sample Region A. | major | |
| B-13 | A Region with no hero image shows the plain gradient, no broken image and no credit line. | Real data: Moss Grotto. | major | |
| B-14 | A Region that is Available with no entries shows "Not in the guide yet". | Sample Region C after `sample-ability` is done and `sample-boss` is marked in Region B. | major | |
| B-15 | An unknown or missing `?id=` shows "Region not found" with links to each Region, not a blank page. | `region.html?id=nope` and `region.html`. | minor | |
| B-16 | Page title is "<Region> \| Silksong guide". | Read the tab title. | minor | |

## C. Region, Locked (requirements not met)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| C-1 | The intro reads "Locked. You cannot enter yet. Finish what is below and this region opens." instead of the summary. No hero image. | Sample Region B, empty profile. | major | |
| C-2 | Before "Show everything", the page shows only the Region name and what is missing: no summary and no names or `how` of the Region's own entries. | Read the page text before toggling. | major | |
| C-3 | Missing requirements are listed in Step order, each with its Region, its type and a state ("Not done yet", or "Collected" / "Done" once done), and a "Go to <Region>" link. | Sample Region B: "Sample ability" with "Go to Sample Region A". | major | |
| C-4 | The Region itself is the last row: "Opens when the steps above are done." | Same page. | minor | |
| C-5 | The side plate says "Its entries stay hidden" and offers only the "Show everything" switch (no Visited switch). | Same page. | minor | |
| C-6 | "Show everything" reveals the Region's entries, each with its requirement line in order ("Needs A, B and C"). | Sample Region B, toggle on. | major | |
| C-7 | Names of requirements that sit in another Region the player has not Visited. | Sample Region B with Sample Region A not Visited: does "Sample ability" show? | major | decision: open question Q2 |
| C-8 | When the requirement is marked done, the Region opens (summary as intro, hero image if any, entries hidden until Visited) with no other action. | Mark "Sample ability" in Region A; open Region B. | major | |
| C-9 | A chain of requirements is walked and listed in Step order (the whole chain, not only the last step). | Sample Region B, "Needs Sample ability, Sample key, Open the sample door and Sample shard" on "Sample charm". | major | |

## D. Route (`route.html`)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| D-1 | Title "Route" and the intro "Every step across all regions, in order. Anything waiting on something else shows what it needs." | Open `route.html`. | major | |
| D-2 | Steps are grouped under Region headings ("Steps 34 to 40", "Open region") and stay in Step order. | Real and sample data. | major | |
| D-3 | "Only what I can do now" and "Hide finished steps" filter the list and combine. | Toggle each; both on. | major | |
| D-4 | "Holding you up" sits to the right on desktop and above the list on a phone. | 1280 px and 390 px. | minor | |
| D-5 | A "Can be missed" flag on missable steps, with the reason in the body. | Sample data. | major | |
| D-6 | A "Choice point" marker appears only where the data says so. | Data with no choice point: no marker. | minor | decision: data rule open (CONTRACTS section 8) |
| D-7 | Legend at the bottom: "A bead is a collectible ..." text, as in DESIGN section 6. | Scroll to the end. | minor | |
| D-8 | Route entries from a Region not yet Visited: shown, or hidden with "Show everything". | Sample data, empty profile. | major | decision: open question Q1 |

## E. Account, signed out (`account.html`)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| E-1 | One h1, "Account and backup", with the intro "Your progress is saved on this device. Sign in to keep it in sync everywhere." | Open the page. | major | |
| E-2 | "Sign in to sync" plate: "Continue with Google", the email field labelled "Or get a sign-in link by email", and "Email me the link". "Continue with GitHub" is hidden until GitHub sign-in is enabled (known deviation, see report). | Read the plate. | major | |
| E-3 | Empty address: message "Enter your email address first." | Press "Email me the link" with the field empty. | minor | |
| E-4 | Invalid address: the message says what happened and what to do next. | Enter `ab`, press Enter. | minor | |
| E-5 | "Continue with Google" opens Google sign-in and returns signed in. | Real account. | major | Athos |
| E-6 | Email link: the link is sent; opening it on the same device signs in. | Real address. | major | Athos |
| E-7 | Link opened on another device: the page asks for the address, then finishes sign-in. | Real address, second browser. | major | Athos |
| E-8 | Sign-in service unreachable: the rest of the site still works and the plate gives a message with a next step. | Block gstatic in devtools; click Google. | major | |
| E-9 | "Download backup" saves `silksong-guide-backup-YYYY-MM-DD.json` with `done`, `visited`, `updatedAt`, `dataVersion` and no `syncedUid`. | Mark an entry; download; read the file. | major | |
| E-10 | "Add a backup file" adds what the file has and never removes progress; the message says how many were added. | Add a file with one extra entry; check that nothing was lost. | critical | |
| E-11 | A file that is not a backup is refused with "That file is not a Silksong Guide backup. Choose a file you downloaded from this page." and Progress is unchanged. | Add a text file. | major | |
| E-12 | "Start a new run" opens a plate with "Clears your progress on this device ..." and "This clears all your progress on this device. It cannot be undone." and the buttons "Download backup first", "Clear my progress" and "Cancel". Cancel keeps everything; Escape closes the plate and returns focus to the button. | Open the plate; press Cancel, then open it again and press Escape. | major | |
| E-13 | "Clear my progress" empties this device; Region pages then show nothing marked and no Region Visited. | Clear; open a Region. | major | |
| E-14 | "How saving works" shows three rows: On this device, In your account, When they differ. | Read the section. | minor | |
| E-15 | "Guide data" shows the data version and the number of Regions, read from `data/`. | Compare with `data/regions.json`. | minor | |
| E-16 | Footer line reads "Saved on this device." when signed out. | Read the footer. | minor | |
| E-17 | The start thread does not cross the intro's text at 1280 px or at 390 px. | Look at the intro line on both widths. | minor | |
| E-18 | Hero art: the Account hero and the Locked Region hero follow the picture in DESIGN (`05`, `03`) or the design owner accepts a plain gradient. | Compare with the PNGs. | minor | decision: open question Q4 |

## F. Account, signed in (Athos)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| F-1 | "Your account" plate: "Signed in as <email>", "Synced with your account at HH:MM.", "Sign out", and "Signing out keeps your progress on this device." | Real account. | major | Athos |
| F-2 | First sign-in shows "Progress combined" with the counts; the text says that nothing was removed. | First sign-in with progress on both sides. | major | Athos |
| F-3 | "Start a new run" says "on this device and in your account" and "Clear my progress" removes the cloud copy. | Signed in. | major | Athos |
| F-4 | Signing out, then signing in as another account on the same device, does not carry the first account's Progress into the second. | Two real accounts. | critical | Athos |

## G. Phone (390 px wide)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| G-1 | No horizontal scroll and no element past the 390 px edge on Home, Region (Available and Locked), Route, Account signed out and signed in. | Scroll sideways; or measure with the page's script. | major | |
| G-2 | Region hero is 380 px tall with the slanted edge; the title is smaller and nothing is clipped. | Sample Region A at 390 px. | minor | |
| G-3 | Entry marks have a hit area of at least 44 by 44 px. | Measure a mark button. | major | |
| G-4 | The keyboard focus ring on an entry mark is fully visible (not cut off at the left edge). | 390 px, Tab to the first entry mark. | major | |
| G-5 | Totals plate position: after the list (DESIGN section 6 text) or before it (DESIGN PNG 07). | Compare. | minor | decision: open question Q3 |
| G-6 | Start thread does not cross the intro text on Region or Account. | Look at both pages. | minor | |

## H. Progress and backup (theme)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| H-1 | New game starts empty: nothing marked, no Region Visited, no localStorage key. | Empty profile; open a Region and Account. | major | |
| H-2 | Mark and unmark survive a reload. | Mark; reload; unmark; reload. | critical | |
| H-3 | Stored Progress has `done`, `visited`, `updatedAt` (number) and `dataVersion`; `syncedUid` is absent while signed out. | Read localStorage after a change. | major | |
| H-4 | Progress survives closing and reopening the browser. | Close the browser; reopen the page. | major | not run in this pass |
| H-5 | An exported file imports back into an empty profile and gives the same Progress. | E-9, then import into a new profile (E-10). | critical | |
| H-6 | Import is a union: it never removes a done or visited mark, and the message counts match. | Import a file with fewer entries than the profile has. | critical | |
| H-7 | A rejected file leaves Progress unchanged. | E-11 with Progress set. | major | |
| H-8 | Ids that no longer exist in `data/` are kept in Progress, not dropped. | Store an unknown id; reload; read storage. | minor | |
| H-9 | Using `?data=sample` never writes sample ids into the real Progress. | Mark a sample entry; open a real page; read storage. | minor | open question Q5 |
| H-10 | Local Progress survives a failed cloud write (signed in or with the cloud blocked): local change stays and the sync line says so. | Block the Firestore host and mark an entry. | critical | Athos for the signed-in case |

## I. Sign-in and sync between two browsers (Athos)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| I-1 | Sign in on browser A with Progress; sign in on browser B with the same account: B shows A's Progress without a reload. | Two browsers, one account. | critical | Athos |
| I-2 | A change made on B appears on A without a reload. | Mark an entry on B; watch A. | major | Athos |
| I-3 | First sign-in union: an entry marked on device X while signed out and an entry in the cloud from device Y are both kept. | Two devices, one signed out. | critical | Athos |
| I-4 | After the first sign-in the newer whole copy wins (ADR 0001). The page does not claim more than that. | Two devices editing in turn. | major | Athos |
| I-5 | Cloud error (rules deny or network off): local Progress keeps working and the sync line says so, with the next step. | Block the cloud after sign-in. | critical | Athos |
| I-6 | "Start a new run" on A deletes the cloud copy; B that still holds the old run writes it back on its next change. The page does not promise that a new run clears every device. | Two devices. | major | Athos |
| I-7 | Firestore rules: a signed-in user reads and writes only their own document; nothing else is reachable. | Emulator tests (QA 1); published rules check (Athos). | critical | Athos |

## J. Spoilers and Visited (theme)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| J-1 | An Available Region that is not Visited hides its entries until Visited, a mark, or "Show everything". | Empty profile. | major | |
| J-2 | Visited is set by hand (switch) and automatically (marking any entry); the switch shows the state. | Both paths. | major | |
| J-3 | Marking an entry out of order is allowed and the guide says what it needed. | B-7. | major | |
| J-4 | Locked Regions hide their own entries and summary (C-2). | C-2. | major | |
| J-5 | Requirement names from unvisited Regions follow the rule that the spec settles (C-7, D-8, A-10). | C-7. | major | decision: open question Q2 |

## K. Accessibility (theme)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| K-1 | Every control on Home, Region, Route and Account can be reached with Tab, in a sensible order. | Tab through each page. | major | |
| K-2 | Every Tab stop shows a visible focus ring (2px, silk, 3px offset). | Tab through each page; check the ring. | major | |
| K-3 | No keyboard trap: Tab leaves the page after the last control. | Tab past the end. | major | |
| K-4 | Enter and Space operate entry marks and switches; focus stays on the same control after a change. | Mark with Enter; toggle a switch with Space. | major | |
| K-5 | Entry marks have `aria-pressed` ("true" or "false") and the entry name as their accessible name. | Read the DOM. | major | |
| K-6 | The live region announces "Marked as done", "Marked as not done" and "could not be saved" messages; the sync line is `role="status"`. | Read the DOM and the announcements. | major | |
| K-7 | One h1 per page; landmarks header, nav (labelled Main), main and footer. | Read the DOM. | minor | |
| K-8 | The decorative hero image has `alt=""`; any other image has alt text. | Read the DOM. | minor | |
| K-9 | No state is carried by colour alone: done (bronze fill and state text), next (ring and "Next on the route"), blocked (dashed mark and "Needs ..."), missable ("Can be missed"). | Look with colour ignored. | major | |
| K-10 | Body text and labels reach 4.5 to 1 contrast against their background. | Compute from the tokens (report, table of pairs). | major | |
| K-11 | Focus rings, bead and knot borders, the thread and the switch reach 3 to 1 against their background. | Compute from the tokens. | minor (decorative) / major (focus ring) | |
| K-12 | With `prefers-reduced-motion: reduce`, the start thread does not animate and no transition runs. | Emulate the setting; read the computed animation. | major | |
| K-13 | Text can be enlarged to 200 percent without losing content or controls. | Browser zoom 200 percent on each page. | major | not run in this pass |
| K-14 | Hero title and intro reach 4.5 to 1 over the image. | Sample the image pixels behind the text. | minor | not run in this pass |
| K-15 | The page works with a screen reader (names, states and live messages read correctly). | Screen reader on Region and Account. | major | Athos |

## L. Copy and glossary (theme)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| L-1 | The glossary words appear for their meaning: Collectible, Task, Region, Route, Step, Available, Locked, Visited, Progress. | Read the copy. | minor | |
| L-2 | "item", "zone", "unlocked", "quest", "explored", "discovered" and "disabled" are not used for these; "save" is not used for Progress. | Search the copy. | minor | decision: open question Q6 ("saved" is in DESIGN copy) |
| L-3 | Sentence case; no all-caps labels. | Read each screen. | minor | |
| L-4 | Errors say what happened and what to do next, with no apology. | Trigger each error (E-3, E-4, E-8, E-11). | minor | |
| L-5 | Interface copy for each state matches DESIGN section 6 wording. | Compare with the PNG for each screen. | minor | |
| L-6 | Text about the game comes only from `data/`; no game facts in interface code. | Read the interface files. | major | |
| L-7 | The sample banner ("Sample data. Not guide content.") appears only with `?data=sample`. | Open a real page and a sample page. | minor | |

## M. Links, relative paths and GitHub Pages

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| M-1 | No root-absolute paths (`href="/..."`, `src="/..."`, `url(/...)`, fetch of `/...`) in HTML, CSS or JS. | Search the repository. | major | |
| M-2 | Every internal link and every asset resolves to an existing file. | Check each `href` and `src`. | major | |
| M-3 | The site works from a sub-path (`/<repository>/`): Region and Account load with no 404 for CSS, JS or data. | Copy the site under a folder and serve it; load both pages. | major | |
| M-4 | Scripts come only from the site, and from the Firebase SDK at one pinned version (only `js/firebase.js` imports it). Fonts come from the Google Fonts stylesheet (DESIGN section 4). | Read the script and link tags; list network hosts. | major | |
| M-5 | No console errors and no failed requests on load (favicon counted until M-6 is fixed). | Devtools log on each page. | major | |
| M-6 | A favicon is served or linked, so no 404 for `/favicon.ico` on every load. | Server log. | minor | |
| M-7 | The published site serves the same pages and sign-in works on its domain. | Open the published address; sign in. | major | Athos |
| M-8 | Home and Route link only to pages that exist (A-9, D-1). | Click every link. | major | |

## N. Data attribution and data checks (theme)

| ID | Check (expected) | How to check | Fails as | Note |
|---|---|---|---|---|
| N-1 | Every entry has `name`, `kind`, `type`, `regionId`, `how`, `requires`, `step` and `source`. | Read `data/items.json` (or run the validator). | major | |
| N-2 | `dataVersion` is equal in all three files; ids are slugs and unique across the three files. | Read the files. | major | |
| N-3 | `requires` and `conditions` hold entry ids only. | Read the files. | major | |
| N-4 | `step` is a unique integer across all entries. | Read the files. | major | |
| N-5 | `missable: true` has a `missableNote`. | Read the files. | major | |
| N-6 | Each hero image has `heroCredit`, ends in `.jpg` or `.png` and the file exists. | Read the files; check the path. | major | |
| N-7 | No `how` is over 300 characters (the validator warns; a long text may be pasted wiki text). | Count characters. | minor | |
| N-8 | `node scripts/validate-data.js` passes, and `node scripts/validate-data.js data/sample` passes. | Run both. | critical | the validator does not exist yet |
| N-9 | No cycle in `requires` (validator rule; the requirements tests cover the cycle function). | Run `node --test tests/`; run the validator. | major | |
| N-10 | Five Endings are stored in V1, each with `conditions`, `locksOut` and `source`. | Read `data/endings.json`. | major | Phase 3: the file is empty today |
| N-11 | No `sample-` id appears in `data/`. | Search `data/`. | major | |
| N-12 | Data sources and attribution are shown in the interface: the footer attribution line and a way to reach each entry's `source`. | Read the footer; look for a link to each entry's source. | major | |
| N-13 | Each entry's `how`, `requires`, `missable`, `step` and `source` agree with the entry's own source page. | Read the source page, one page at a time. | major | blocked: checklist item 4 |
| N-14 | Region summaries and Region requirements agree with the source. | Same. | major | blocked: checklist item 4 |
| N-15 | Text is in our own words; no sentence is pasted from the wiki. | Compare the text with the source page. | major | blocked: checklist item 4 |
| N-16 | Each entry's `source` links to a page about that entry, not only to its Region's page. | Read the URLs. | minor | Athos decides |
| N-17 | Per batch, at least 10 percent of entries and never fewer than 5 (across Regions) are checked against the source. | Pick the sample; record the picks. | major | blocked: checklist item 4 |

---

## Not in this checklist

- Firestore rules tests in the Emulator (QA 1 runs them; `tests/firestore-rules.test.js`).
- The published rules and the deploy (Athos only).
- Screen reader behaviour beyond the DOM attributes (K-15 is Athos).

## Open questions this checklist depends on

- **Q1**: On Home and Route, may a Step show its `how` (and its entry name) when its Region has not been Visited? (A-10, D-8.)
- **Q2**: Locked and "Needs" lines name requirements that sit in a Region the player has not Visited. Is that allowed, given "Collectibles in Regions that are not Visited stay hidden"? (C-7, J-5.)
- **Q3**: On a phone, is the "Your thread here" plate after the entry list (DESIGN text) or before it (DESIGN PNG 07)? (G-5.)
- **Q4**: Hero art on the Locked and Account pages: the PNGs show an illustration; the code uses a plain gradient. (E-18.)
- **Q5**: Should `?data=sample` use its own Progress key? (H-9.)
- **Q6**: "Save" for Progress: CLAUDE.md rule 1 says avoid it; DESIGN copy says "Your progress is saved on this device". (L-2.)
- **Q7**: Where do the data sources and attribution appear: a footer line only, a link from each entry to its `source`, or both? (N-12.)
