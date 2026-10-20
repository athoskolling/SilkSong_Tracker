# First pass: Region, Account and redirect (2026-10-19)

- Task: T13 (Phase 2). Branch: `qa-manual/checklist`. Run by QA 2 (`qa-manual`).
- Checklist used: `qa/checklist.md` (140 lines; 16 marked Athos, 5 marked blocked).
- Commits: first pass on `main` at `2d47b79` ("Phase 2 setup"), as the task asks. During the run `origin/main` moved to `0d32c33` (T10 Home and Route, T11 Account backup and new-run sections, and `19667f3` "start thread no longer runs over the intro at 390px"). I re-ran the Region and Account checks against `0d32c33` (exported with `git archive`, served from a scratch folder). Both results are below. Home and Route lines were not run in this pass.
- Result in one line: **0 critical, 3 major, 7 minor findings** on what I ran. Nothing that I ran is a critical failure. Most of V1 is not reachable by an agent (sign-in, two devices, published site), so V1 cannot be called done from this pass.

## 1. What I checked and how

- **Static reading:** `index.html`, `region.html`, `account.html`, `js/main.js`, `js/render.js`, `js/data.js`, `js/progress.js` (only for the calls the interface makes), `js/firebase.js` (imports and messages), `css/base.css`, `css/components.css`, and on `0d32c33` also `js/account-page.js` and `route.html`.
- **Design comparison:** `docs/design/screens/02`, `03`, `05`, `07` against screenshots of the same states. `01` (Home) and `04` (Route) were not compared (not in this pass). `06` (signed in) needs a real account, so it was not compared.
- **Headless browser:** Chromium 152 (Arch package), driven over the DevTools protocol by scratch scripts kept outside the repository. Viewports 1280 by 900 and 390 by 900 with phone emulation. For each load: console errors, page exceptions and failed or 4xx requests. Keyboard: Tab, Enter and Space only. Focus rings read from computed styles. Overflow read by measuring every element against the viewport. Progress read from localStorage. Every "new game" run used a fresh browser profile.
- **Server:** `python3 -m http.server 8000` from the repository root, as the task says. Sub-path check: the site copied under `/SilkSong_Tracker/` and served on another port (GitHub Pages layout).
- **Data:** a read-only scratch script over `data/*.json` for the cross-checks in `docs/CONTRACTS.md` section 6 (dataVersion, ids, unique steps, `requires` and `conditions` as entry ids, `source`, `missableNote`, hero credit, the 300-character `how` warning). It is not the validator, which does not exist. **No wiki page was read** (checklist item 4 is not checked).
- **Contrast:** computed from the tokens in `docs/DESIGN.md` section 3 (scratch script). Translucent colours blended over their backdrop as `css/base.css` does.
- **Unit tests:** `node --test tests/` on `2d47b79`: 88 pass, 0 fail. The Firestore rules tests need the Emulator and were not run here.

Check rows: on `2d47b79`, 167 rows (133 pass, 4 fail, 30 information). On `0d32c33`, 181 rows (146 pass, 2 fail, 33 information). The four `2d47b79` failures are F1 (phone), the two Account start-thread rows (resolved on `0d32c33`, see section 4), and one console error that my invalid-address test caused (explained in section 4). The two `0d32c33` failures are F1 and that same explained console error.

Sub-path copy on `2d47b79` (port 8001, path `/SilkSong_Tracker/`): Region desktop 30 pass, 0 fail; Account desktop 7 pass and 1 fail. The fail is the start-thread row, the same one as at the root, so the paths work.

Live site (curl, 2026-10-19): the published pages `/`, `/region.html?id=moss-grotto`, `/account.html` and `/route.html` return HTTP 200. Sign-in on the published domain was not run.

## 2. What passed (run on the commit named)

Lines are from `qa/checklist.md`. "Both" means `2d47b79` and `0d32c33`. "Reviewed" means checked by reading the code or the screenshot, not by a script.

- **Region, new game and Available (B):** B-1 hidden entries and notice (both); B-2 Step order, name, type, `how` and "Needs" lines (both, read in screenshots); B-3 marking, aria-pressed, "Marked as done: Moss Mother" (both); B-4 unmark deletes the key (both); B-5 marking a Task sets Visited (both); B-6 Visited off keeps entries when something is done (both); B-7 out-of-order mark allowed, line reads "Needs Moss Mother, done" (both); B-8 one "Next on the route" entry, Sample ability (both); B-9 counts exclude Tasks (both, sample Region A: "Collectibles 0 of 3", "Tasks 0 of 1"); B-10 "Can be missed" and its note (both); B-11 show-everything toggles on and off, and starts off after reload (both); B-12 one h1, title, summary, decorative image with `alt=""`, credit in the footer (both); B-13 Region with no hero image: no image, no credit, plain gradient (both, real data); B-15 unknown `?id=` shows "Region not found" with links (both); B-16 title (both).
- **Region, Locked (C):** C-1 heading and no image (both); C-2 only the name and missing requirements shown before show-everything (both; the summary and the Region's own entry names are absent from the text); C-3 chain in Step order with "Not done yet" and "Go to Sample Region A" (both); C-4 last row "Opens when the steps above are done." (both, text); C-5 notice and show-everything switch only (both); C-6 show-everything reveals entries (both); C-8 the Region opens after its requirement is marked, with no other action (both, Sample A to B); C-9 the chain is walked in Step order: "Needs Sample ability, Sample key, Open the sample door and Sample shard" (both).
- **Progress and backup (H):** H-1 new game empty, no storage key (both); H-2 mark, unmark and reload (both, real data); H-3 stored shape `done`, `visited`, `updatedAt` (number), `dataVersion` 1, no `syncedUid` (both); H-5 export and import through `progress.js` (module calls from the page, both): export keys correct, no `syncedUid`; H-6 import is a union and an empty file removes nothing (module calls on both; the same union through the Account page's file input on `0d32c33`: E-10); H-7 a rejected file keeps Progress (module call on both; the Account page's message and kept Progress on `0d32c33`); H-8 unknown ids are kept (both, `sample-ability` kept on the real page).
- **Spoilers and Visited (J):** J-1 (both); J-2 Visited set by hand and automatically (both); J-3 (both); J-4 (both).
- **Account, signed out (E):** E-1 one h1 and intro (both); E-2 Google button, email label, "Email me the link", no GitHub button (both; the missing GitHub button is the known deviation in section 5); E-3 empty address message (both); E-8 sign-in service blocked: the local site still works and the message says what to do (both); E-9 backup file name `silksong-guide-backup-2026-10-20.json` and content (`0d32c33`); E-10 add a backup file is a union, message "Added 1 entry and 0 Regions from the backup. Nothing was removed." (`0d32c33`); E-11 rejected file message matches DESIGN section 7 exactly (`0d32c33`); E-13 clear empties the device (`0d32c33`); E-14 "How saving works" present (`0d32c33`, screenshot); E-15 Guide data shows Version 1 and Regions 1, matching `data/` (`0d32c33`); E-16 footer "Saved on this device." (both).
- **Keyboard and focus (K):** K-1 Tab order reaches every control on Region (both commits) and on Account signed out on `2d47b79` (7 stops); on `0d32c33` the Account run stopped after 12 Tab presses, so the rest of its controls (backup, new run, and the rest of the page) are not covered by keyboard yet (see section 7); K-2 focus ring on every Tab stop at 1280 px on Region (both) and on the Account stops reached (both); K-3 no keyboard trap, focus leaves the page after the last control (both, desktop and phone); K-4 Enter and Space operate entry marks and switches, focus kept on the same control (both); K-6 the live region announces marks and the sync line is `role="status"` (both); K-8 hero image `alt=""` (both); K-12 with reduced motion the start thread does not animate (both; transitions checked by reading `base.css`).
- **Contrast (K-10):** every text pair from the tokens reaches 4.5 to 1 (see section 6).
- **Phone (G):** G-1 no horizontal overflow on Region (available and Locked) and Account signed out (Region and Account only; Home, Route and the signed-in Account were not run); G-2 hero 380 px tall with the designed slanted edge (measured, both); G-3 entry marks 44 by 44 px (measured, both).
- **Copy (L):** L-5 the Region and Account state strings compared with DESIGN section 6 (Locked heading, "Its entries stay hidden", "They appear once you visit the region ...", "Opens when the steps above are done.", "Not in the guide yet", "Continue with Google", "Email me the link", "Start a new run", "This clears all your progress on this device. It cannot be undone.", "Adding a backup keeps everything ..."): all match; L-7 sample banner only with `?data=sample` (both).
- **Links and paths (M):** M-1 no root-absolute paths (grep over html, css and js); M-2 every internal target exists (both; Route exists from `0d32c33`); M-3 sub-path copy loads Region and Account with no 404 (`2d47b79` only); M-4 the only gstatic import is `js/firebase.js` (dynamic `import()`), and the fonts load from the Google Fonts stylesheet that DESIGN section 4 allows (reviewed).
- **Data (N):** N-1 to N-5 and N-7 and N-11 on `data/` with the scratch script and by reading: two entries (one Collectible, one Task) in one Region, all required fields present, ids are slugs and unique, `requires` holds entry ids only, steps 10 and 20 unique, no `sample-` id in `data/`, no `how` over 300 characters; N-6 no hero image in real data, sample hero has its credit.

## 3. Findings

Severity: critical / major / minor, as in the checklist. "Owner" is from `docs/AGENT-PLAN.md` section 3. Nothing here is fixed by QA 2.

### F1. Major. Keyboard focus ring cut off on the left at 390 px (G-4, K-2)
- **Page:** Region, any page with entries shown, at 390 px.
- **Steps:** open `region.html?id=sample-region-a&data=sample` at 390 px wide; click "I have visited this region" (or Space on it); press Tab until the first entry mark (Sample ability) is focused.
- **Expected:** the 2px focus ring with 3px offset is fully visible around the 44px entry mark.
- **Actual:** the mark's left edge is at 2px. The ring sits 5px outside the box, so its left side is at x from -3 to -1, off screen. The top, right and bottom sides show. Measured on both commits (`regionFocusSamplePhone`: "button left edge 2px; outline needs 5px"). The same check passes at 1280 px.
- **Owner:** Dev B (`css/components.css`, `.entry-mark` is placed at `left: -14px` in the rail).

### F2. Major. No data source or attribution shown in the interface (N-12)
- **Page:** Region, Account, and any future Route and Home.
- **Steps:** open a Region with entries shown; look for a link to each entry's `source` and for an attribution line in the footer. Also list every link the interface creates (`href` in `js/render.js`, `js/main.js`, the page footers).
- **Expected:** `docs/DESIGN.md` section 5: the footer has one line of attribution and the data sources; `docs/AGENT-PLAN.md` section 8: "Data has `source` and attribution". Each entry's `source` reaches the reader.
- **Actual:** no entry-level link to a `source`. The only links are Region, Route, Account, Home and the Region "Go to" and "Open" links. The footer shows only the hero credit (when an image exists) and the sync line. This holds on both commits.
- **Owner:** Dev B (render and footer, `js/render.js`, `js/main.js`, the page footers). Where the attribution and the links go is an open decision (Q7 in the checklist; the PROGRESS-LOG "Open" note asks the same): orchestrator with Athos.

### F3. Major, decision needed. Requirement names from Regions the player has not Visited are shown (C-7, J-5)
- **Page:** Region, Locked; and the "Needs ..." lines on entries.
- **Steps:** new profile; open `region.html?id=sample-region-b&data=sample`. Sample Region A has not been Visited.
- **Expected:** if the rule is "Collectibles in Regions that are not Visited stay hidden" (`docs/AGENT-PLAN.md` section 8), the Locked page should not show the name of an unvisited Region's Collectible. The design asks for the missing requirements "each with its Region" (`docs/DESIGN.md` section 6).
- **Actual:** the page shows "Sample ability", "Ability in Sample Region A", "Not done yet" and "Go to Sample Region A" before any visit. The requirement names of other Regions are visible on both commits.
- **Owner:** orchestrator to decide the rule (with Athos); then Dev B to apply it in `js/main.js` and `js/render.js`. This is the same question as Q2 in the checklist.

### F4. Minor. `?data=sample` writes Progress under the real storage key (H-9)
- **Page:** any page with `?data=sample`, then any real page.
- **Steps:** open `region.html?id=sample-region-a&data=sample`; mark "Sample ability". Open `region.html?id=moss-grotto` (no `data` parameter).
- **Expected:** sample use does not change the real Progress.
- **Actual:** `silksong-guide:progress:v1` holds `"done":["sample-ability"]` and `"visited":["sample-region-a"]` after the sample visit, and the real page keeps them. The ids are ignored by the real page but are kept and would sync to the cloud after sign-in. Both commits.
- **Owner:** Dev A (`js/progress.js`: storage key) with Dev B (the sample switch in `js/data.js`). The choice (own key for sample mode, or no writes) is open: Q5.

### F5. Minor. Missing favicon: a 404 on every page load (M-6)
- **Page:** every page.
- **Steps:** load any page; read the server log.
- **Expected:** no failed request on load.
- **Actual:** the browser requests `/favicon.ico` on every load and gets a 404 (36 such lines in my server log across the runs). Both commits.
- **Owner:** Dev B (`index.html`, `region.html`, `account.html`, `route.html` `<head>`, or an icon file under `img/`).

### F6. Minor. The invalid-address message gives no next step (E-4, L-4)
- **Page:** Account, signed out.
- **Steps:** type `ab` in the email field; press Enter.
- **Expected:** "say what happened and what to do next" (`docs/DESIGN.md` section 7), for example a line that asks the reader to check the address.
- **Actual:** "That email address does not look right." Both commits. (This message comes from Firebase's check through `js/firebase.js`; no mail was sent.)
- **Owner:** Dev A (`js/firebase.js`, the friendly messages).

### F7. Minor, decision needed. Phone position of the "Your thread here" plate (G-5)
- **Page:** Region, 390 px.
- **Expected:** the design text (`docs/DESIGN.md` section 6, phone layout) says the totals come after the entry list. The picture `docs/design/screens/07-region-phone.png` shows them before the list. Section 5 says the pictures are the ground truth.
- **Actual:** the code puts the plate after the list (`regionPhoneReal`: "plate-after-list"). Both commits. The design owner must say which one wins: Q3.
- **Owner:** orchestrator (which is the ground truth), then Dev B.

### F8. Minor. Decorative tokens below 3 to 1 on non-text (K-11)
- **Computed from the tokens** (`docs/DESIGN.md` section 3; section 3 says report it to the orchestrator and do not change a token):
  - bar track `#4A3340` on night `#130B13`: 1.69 to 1; on lacquer `#1F111C`: 1.59 to 1 (the needle-and-thread track, decorative; the count text and `role="progressbar"` carry the value);
  - switch track when off `#3A2631` on night: 1.38 to 1 (the knob moves, so the state is also a shape; the track edge is faint);
  - plate border, ivory at 30 percent over lacquer: 2.43 to 1 (decorative);
  - next-step plate border, silk at 60 percent over night: 2.67 to 1 (the words "Next on the route" carry the state).
- **Passing pairs (for reference):** ivory, ash, silk, bronze, ember on night and lacquer; night on ivory; the thread line 3.82 to 1; the focus ring 5.55 to 1; bronze and ash marks 8 to 1.
- **Owner:** orchestrator (token decision); Dev B reports the pairs.

### F9. Minor, decision needed. Hero art on the Locked and Account pages differs from the design pictures (E-18)
- **Pages:** Region, Locked (`docs/design/screens/03-region-locked-far-fields.png`) and Account (`05-account-signed-out.png`).
- **Expected:** the pictures show a skyline silhouette behind the title.
- **Actual:** a plain gradient. For the Locked page this is deliberate (the code says "less to spoil"); for the Account page the PROGRESS-LOG records the art as still to do.
- **Owner:** orchestrator to confirm the Locked choice (Q4); Dev B for the Account art.

### F10. Minor, decision needed. "Saved" for Progress in the interface copy (L-2)
- **Page:** Account (the intro line, "How saving works", the sign-in text, the backup helper) and the footer line.
- **Expected:** CLAUDE.md rule 1 says not to say "save" for Progress.
- **Actual:** "Your progress is saved on this device." and "Signing in saves your progress online ..." are the words `docs/DESIGN.md` section 6 uses. The backup helper "add a backup you saved earlier" is an implementation string not in DESIGN.
- **Owner:** orchestrator (rule against DESIGN copy; Q6), then Dev B for strings.

## 4. Resolved since `2d47b79` and two explained results

- **Resolved on `origin/main` (`0d32c33`):** the Account start thread crossed the intro text at 1280 px and at 390 px on `2d47b79` (E-17, G-6). In the 390 px screenshot on `2d47b79` the thread crossed the letters of "in" in "Sign in to keep it in sync everywhere." Both rows pass on `0d32c33` (commit `19667f3`). I verified this with measurements.
- **Not a defect (pending work now built):** on `2d47b79` the Account page lacked the backup file, new-run, "How saving works" and Guide data sections; they exist on `0d32c33` and passed in section 2.
- **Explained, not a finding:** `accountKeyboard` on both commits logs a 400 from Firebase's auth service when I entered an invalid address on purpose. The page does send the address to Firebase to check it (and the service refuses it). No mail was sent and no real address was used.
- **Known deviation, not a finding:** "Continue with GitHub" is left out of the Account page because GitHub is not enabled in the Firebase project (`js/render.js` comment; Phase 0 item 6). The checklist line E-2 counts it as a known deviation.

## 5. Observations for the orchestrator (not QA findings against the site)

- **Phase 0 item 4 (wiki license and terms) is still unchecked**, but the slice data has wiki source links and was researched from wiki pages (`docs/PROGRESS-LOG.md` T6 and T7; `docs/PHASE-1-SLICE.md`). T7 was pushed. I did not read the wiki for this pass. Please confirm with Athos whether this was meant to be allowed before the item is checked.
- **`silk-spear`'s `source` is the Moss Grotto Region page**, not a page about Silk Spear. Athos or Dev A to confirm when the wiki review happens (N-16).
- **`data/endings.json` is empty**; the contract asks for five Endings in V1 (N-10, Phase 3).
- **`scripts/validate-data.js` does not exist** on either commit, so the validator line (N-8) cannot run. The contract's cross-checks were covered only by my scratch script.
- **Fonts** load from Google Fonts (`docs/DESIGN.md` section 4 allows it). A visitor's browser then contacts Google when a page opens; that may belong in the privacy wording Athos publishes with the site.
- **The Firebase SDK loads on every page**, including the Region and Home pages, because `progress.js` imports `firebase.js` at load (PROGRESS-LOG notes this). It is not a checklist failure; it is a cost.
- **On `2d47b79` the "All regions" and header "Regions" links led to the temporary redirect**, which opens the first Region. On `0d32c33` Home exists; not tested in this pass.

## 6. Contrast table (computed from the tokens)

| Pair | Ratio | Needed | Result |
|---|---|---|---|
| ivory on night | 16.06 | 4.5 | pass |
| ivory on lacquer | 15.08 | 4.5 | pass |
| ash on night | 8.11 | 4.5 | pass |
| ash on lacquer | 7.62 | 4.5 | pass |
| ash on plate top `#22121D` | 7.51 | 4.5 | pass |
| ash on plate bottom `#1A0E17` | 7.87 | 4.5 | pass |
| silk on night | 5.55 | 4.5 | pass |
| silk on the next-step tint (silk 7 percent over night) | 5.21 | 4.5 | pass |
| bronze on night | 8.78 | 4.5 | pass |
| ember on night | 7.47 | 4.5 | pass |
| night on ivory (primary button) | 16.06 | 4.5 | pass |
| silk on night (focus ring, next mark) | 5.55 | 3 | pass |
| silk on lacquer (focus ring in plates) | 5.21 | 3 | pass |
| thread `#8A6471` on night | 3.82 | 3 | pass |
| bar track on night | 1.69 | 3 | **fail** (F8) |
| bar track on lacquer | 1.59 | 3 | **fail** (F8) |
| switch track off on night | 1.38 | 3 | **fail** (F8) |
| ivory 30 percent over lacquer (plate border) | 2.43 | 3 | **fail** (F8) |
| ivory 40 percent over night (field border) | 3.35 | 3 | pass |
| ivory 60 percent over night (secondary button) | 6.18 | 3 | pass |
| silk 60 percent over night (next-step plate border) | 2.67 | 3 | **fail** (F8) |

Not computed: text laid over the hero image (depends on the picture; K-14 not run).

## 7. What I could not check, and why

- **Account signed in (`docs/design/screens/06`) and lines F-1 to F-4:** need a real Google or email account. Athos.
- **Real sign-in (E-5, E-6, E-7):** not attempted; no real account used, no real address used. Athos.
- **Two devices and the cloud (I-1 to I-7; H-10 signed in):** need a second browser or device and a real account. Athos. The Firestore rules tests (I-7) are QA 1's Emulator tests and were not run here.
- **Published site and sign-in on its domain (M-7):** only HTTP status codes were checked (200). Athos.
- **Home (A-1 to A-10) and Route (D-1 to D-8):** outside this pass (the task names Region and Account). Both exist on `0d32c33`; not run on it.
- **Validator (N-8):** `scripts/validate-data.js` does not exist.
- **Wiki checks (N-13, N-14, N-15, N-17):** blocked by checklist item 4. Not started.
- **Keyboard through the rest of the Account page on `0d32c33`:** the run stopped after 12 Tab presses. The backup, new-run and How-saving controls were used with the mouse (E-9 to E-13), not with the keyboard, so K-1 and K-2 are not complete for that page.
- **Browser restart (H-4):** not run.
- **200 percent zoom (K-13) and text over the hero image (K-14):** not run.
- **Screen reader (K-15):** not run; I read the DOM attributes only. Athos to run with a real screen reader.
- **Accessible name of entry marks (K-5):** the `aria-pressed` values were read; the `aria-label` text was not compared with the name in a screen reader.
- **Cloud error while signed in (H-10):** not run (needs an account).
- **E-12, partly run:** on `0d32c33` the plate's copy and Escape (focus returns to the button) were checked; "Cancel" and "Download backup first" were not clicked.
- **G-6 on the Region page:** judged on the 390 px screenshot only (the thread starts below the intro); not measured.
- **Region in Available state with no entries (B-14):** not set up as its own state; the Locked state with no entries was checked instead (text "Not in the guide yet" shows in the side plate).
- **Browsers:** Chromium only. Firefox and Safari not run.
- **Fonts:** the screenshots show headings in the display face on one capture and a fallback face on another; I could not confirm every font loaded at the moment of each capture, so the typography was not compared closely.
- **Hero image contrast (K-14):** not measured.
- **Export and import through the UI:** the Account backup buttons exist on `0d32c33` and were run there (E-9 to E-11). On `2d47b79` the same functions were run through the module only (H-5, H-6).
- **Screenshot files:** the names in the scratch folder are reused by later runs, so each file shows the latest run for that name. The measurements are in the result files cited above.

## 8. Open questions for the orchestrator (decisions)

- **Q1.** On Home and Route, may a Step show its entry name and `how` when its Region has not been Visited? (A-10, D-8.)
- **Q2.** Are names of requirements in unvisited Regions allowed on the Locked page and in "Needs" lines? (C-7, J-5, F3.)
- **Q3.** Phone position of "Your thread here" (G-5, F7).
- **Q4.** Hero art for the Locked page (F9).
- **Q5.** Should `?data=sample` use its own Progress key? (H-9, F4.)
- **Q6.** "Saved" wording for Progress (L-2, F10).
- **Q7.** Where data sources and attribution appear: footer line, a link from each entry, or both (N-12, F2).

## 9. Evidence (scratch folder, outside the repository)

Scratch root: `/tmp/claude-1000/-home-afros-Projects-SilkSong-Tracker/9595a567-7028-46a8-a5f9-1f6c33becdd0/scratchpad/`

- Driver and scripts: `qa/cdp.mjs`, `qa/scenarios.mjs`, `qa/contrast.mjs`, `qa/datacheck.mjs`, `qa/summ.mjs`.
- Results on `2d47b79`: `results/*.json`. On `origin/main` `0d32c33`: `results-0d32/*.json`. Sub-path copy: `results-sub/*.json`. Progress module results: `results/progressModuleChecks.json`.
- Screenshots (latest run per name): `shots/`, for example `shots/sample-region-a-1280-visited.png` (compare `02`), `shots/sample-region-b-desktop-locked.png` (compare `03`), `shots/account-desktop-signed-out.png` (`05`), `shots/account-0d32-1280-all-sections.png` (`05`, `0d32c33`), `shots/sample-region-a-phone-focus.png` (`07`, shows the cut-off ring).

## 10. Handoff

- Checklist lines: 140 in `qa/checklist.md` (16 marked Athos, 5 blocked by checklist item 4).
- Findings: 0 critical, 3 major (F1, F2, F3), 7 minor (F4 to F10). F3 and F7, F9, F10 need a decision before the owner can act.
- Top three for the owners: F1 (Dev B, focus ring at 390 px), F2 (Dev B, no data attribution in the interface; placement is a decision), F3 (orchestrator and Athos, requirement names from unvisited Regions).
- Phase 0 items 8 and 9 and item 4 remain open; item 4 blocks every wiki check.
