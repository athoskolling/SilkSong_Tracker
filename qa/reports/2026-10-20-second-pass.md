# Second pass: whole site on main (2026-10-20)

- Task: T18 (Phase 2). Branch: `qa-manual/second-pass`. Run by QA 2 (`qa-manual`).
- Base: `main` at `4fb3abd` (T17 merged). The worktree HEAD was that commit and stayed clean.
- Checklist: `qa/checklist.md`, updated in this branch. Lines whose behaviour the 2026-10-20 decisions settled are changed there and named in section 6.
- Result in one line: **0 critical and 0 major findings in this pass.** Three rows fail, all minor: G2-1 (hero height at 390 px), G2-2 (title contrast over the placeholder picture at 390 px) and G2-4 (legend position on a phone). One more minor copy finding (G2-3). The Athos-only lines and the wiki lines were not run.

## 1. What was checked and how

**Setup**
- Served `main` with `python3 -m http.server 8100 --bind 127.0.0.1` from the worktree.
- Sub-path check: a copy of the clean worktree (tar, without `.git`) under `/SilkSong_Tracker/`, served with `python3 -m http.server 8101` from its parent folder.
- Browser: headless Chromium (`/usr/bin/chromium`) over the DevTools protocol, with a scratch driver kept outside the repository. Every scenario used a fresh profile unless it tests reopening. Viewports 1280 by 900 (desktop) and 390 by 844 with mobile emulation (touch not emulated). For every load the driver recorded console errors, page exceptions, failed requests, responses with status 400 or more, and every request host.
- Scripts and raw results are in the scratch folder `second-pass/` (outside the repository): `scripts/s1-home.mjs` to `s9-copy.mjs`, `d7-e12.mjs`, `static-links.mjs`, `data-facts.mjs`; results in `results/*.json`; screenshots in `shots/`.

**Commands run**
- `node --test tests/`: 185 pass, 0 fail, 0 todo. The Firestore rules suite is listed as skipped (`FIRESTORE_EMULATOR_HOST is not set`), so its tests did not run here.
- `node scripts/validate-data.js`: passes, 0 warnings. `node scripts/validate-data.js data/sample`: passes, 0 warnings.
- `static-links.mjs` (read-only): 22 files scanned, 50 local references in `href`, `src`, CSS `url()` and JS imports, 0 missing.
- Root-absolute search (`href="/`, `src="/`, `url(/`, `fetch('/`, `import('/`) over HTML, CSS and JS: no match (M-1).
- SDK imports: `gstatic` appears only in `js/firebase.js` (three imports at `12.19.0`). `tools/auth-check.html` imports `js/firebase.js`, not the SDK.
- Published files (curl, sha256) against `4fb3abd`: `js/render.js`, `js/main.js`, `js/firebase.js`, `js/progress.js`, `data/items.json`, `css/components.css` are byte-identical to this commit.

**Data (read only)**
- `data/` holds one Region (`moss-grotto`, no hero image) and two entries: `moss-mother` (Task, step 10) and `silk-spear` (Collectible, step 20). `how` lengths 158 and 159 characters. No `sample-` id in `data/`. `data/endings.json` has no entries.
- No wiki page and no Source URL was requested. The wiki gate (`docs/PHASE-0-CHECKLIST.md` item 4) is still unchecked, so N-13, N-14, N-15 and N-17 were not started.

## 2. Results

Result rows across the scripts: 334 (295 pass, 3 fail, 34 information, 2 not run). "Information" rows record a value or an observation with no pass/fail rule (for example the exact text of a list, or a decision that is applied). Per script:

| Script | Covers | Pass | Fail | Info | Not run |
|---|---|---|---|---|---|
| s1-home | Home: A-1 to A-9, real and sample, the five Region states, the next plate moving on | 27 | 0 | 2 | 0 |
| s2-region | Region: B-1 to B-16, C-1 to C-9, J-1, J-2, J-4 (real and sample) | 61 | 0 | 5 | 0 |
| s3-route | Route: D-1 to D-8 (filters, Can be missed, groups, rail, legend, hidden counts) | 27 | 0 | 1 | 0 |
| s4-account | Account signed out: E-1 to E-4, E-8 to E-18 (except E-5 to E-7), H-6, H-7, E-9 to E-13 with real file input | 35 | 0 | 0 | 0 |
| s5-progress | Progress: H-1 to H-9, H-10 (signed out part) | 17 | 0 | 2 | 0 |
| s6-phone | 390 px: G-1 to G-6 on nine states, D-4 on a phone | 34 | 1 (G-2a) | 0 | 0 |
| s7-a11y | Keyboard: K-1 to K-14 (K-15 not run) | 66 | 1 (K-14 at 390 px) | 12 | 0 |
| s8-links | Sub-path, root console, hosts, click-through, published pages: M-3 to M-8, A-9, N-12 links | 21 | 0 | 7 | 1 (M-7 sign-in) |
| s9-copy | Copy: L-1 to L-7 and the 40 DESIGN strings | 6 | 0 | 5 | 1 (L-5 signed-in strings) |
| s10-d7-e12 | D-7 legend position on a phone; E-12 "Download backup first" | 1 | 1 (D-7) | 0 | 0 |

Lines in sections A to D, E (except E-5 to E-7), G, H (except H-10 signed in), J, K (except K-15), L and M (except M-7 sign-in) were run; the exceptions are in section 5. Section N: N-1 to N-12 were run or read; N-13, N-14, N-15 and N-17 are blocked; N-16 was read only.

**Passes, briefly (lines run and passing)**
- **Home (A):** the hero text (A-1); the next plate on a new game names the first Step and its actions (A-2, A-10), moves on after a Task is marked and says "Everything in the guide is done" when nothing is left; holding list and link (A-3); thread counts with progressbar values, Tasks not counted in Collectibles (A-4); types (A-5); the five states on sample: Complete, Visited, Available, Locked, Not in the guide yet (A-6); "Next on the route is here" on the holding card (A-7); no storage key on a read-only visit and "0 of N" totals (A-8); internal links (A-9).
- **Region (B):** the hidden notice and Visited switch (B-1); Step order and row content (B-2); mark, aria-pressed, fill colour `rgb(217, 166, 80)` and the announcement (B-3); unmark (B-4); marking a Task sets Visited (B-5); Visited off keeps entries shown after a mark (B-6); out-of-order mark and "Needs …, done" (B-7); one Next entry (B-8); thread counts (B-9); "Can be missed" and its note (B-10); show everything starts off after reload (B-11); sample hero with `alt=""`, one h1 and the credit (B-12); no image and no credit on Moss Grotto (B-13); "Not in the guide yet" (B-14); "Region not found" for an unknown and a missing id (B-15); titles (B-16).
- **Locked (C):** C-1 to C-9 as written; the names of other Regions' requirements show, and the Region's own entries do not appear before show everything (C-2, C-7, J-4).
- **Route (D):** D-1 to D-5 and D-8 as decided; the Choice point marker is not built (D-6, see section 3); the legend text (D-7 text); the rail sits on the right at 1280 px (D-4).
- **Account, signed out (E):** E-1 to E-4, E-8 (blocked gstatic shows the message and the Region still saves), E-9 (file name, keys, no `syncedUid`), E-10 (union, message "Added 1 entry and 1 Region from the backup. Nothing was removed.", both Progress items kept), E-11 (exact refusal text, Progress unchanged), E-12 (plate copy, Cancel, Escape with focus back on the button, "Download backup first" saves the file and clears nothing), E-13 (clear, Region shows nothing marked and no Visited), E-14, E-15 (1 Region, version 1; sample shows 5), E-16, E-17 at 1280 and 390 px, E-18 (decided gradient).
- **Progress and backup (H):** H-1 (no key on a new game), H-2 (mark and unmark survive reload), H-3 (stored shape), H-4 (close and reopen the browser on the same profile), H-5 (export then import into an empty profile: same done and visited), H-6 (union through the file input: nothing removed; "That backup had nothing new. Your progress was not changed." for an empty one), H-7, H-8 (unknown id kept through a later change), H-9 (sample writes only `silksong-guide:progress:sample:v1`; real key stays empty), H-10 signed out (with the Google API hosts blocked, a change stays local; signed out, the cloud is never called, so this does not test the signed-in case).
- **Phone (G):** G-1 has no horizontal overflow and no element past 390 px on Home (real and sample), Region (hidden, shown, sample A, sample B locked), Route (real and sample), Account signed out. G-3 entry marks 44 by 44 px. G-4 and G-4b: the focus ring is whole on the Next mark (offset 9 px) and on an ordinary mark (offset 3 px). G-5 totals after the list. G-6 and E-17 start thread clear of the intro. D-4 rail above the list.
- **Keyboard (K):** K-1: every visible control on Home (10 and 13 stops), Region (8, 16 and 9 stops), Route (38 stops) and Account (11 stops) is reached with Tab. K-2: every stop shows the 2px silk ring at 3px (9px on the Next mark). K-3: no trap. K-4: Enter and Space on a mark flip aria-pressed and keep focus; Space on "Show everything" toggles it and keeps focus. K-5, K-6 (`role="status"` on the announcer and sync line), K-7 (one h1, landmarks, nav labelled Main), K-8. K-9 (grayscale view of the Route: done, Next, blocked and missable still read). K-10: all 115 text pairs measured in the page are at least 4.5:1 (lowest 5.13:1). K-12: reduced motion turns the start thread animation off (`none`, 0s) and the switch transition to 0s. K-13 (approximation, see section 5): no horizontal scroll at 640 and 320 CSS px on four pages.
- **Copy (L):** the glossary words are in use (L-1). No banned word except the verb "saves" in DESIGN copy (L-2, decided). No all-caps words (L-3). No apology in the copy (L-4). All 40 DESIGN strings checked are in the rendered copy (L-5). Banner only on sample pages (L-7).
- **Links and paths (M):** M-1, M-2 (static), M-3 (sub-path: Home, Region real and sample, Route, Account load with no failed request, no 4xx, no console message), M-4 (hosts on every page: the site, `fonts.googleapis.com` and `fonts.gstatic.com` for the fonts, and `www.gstatic.com` for the SDK; nothing else), M-5 (no console message or failed request on any page at 1280 px), M-6 (see section 4, F5), M-8 (click-through: "See the whole route", "Open region", "All regions", header links, logo, "Open Moss Grotto" all lead where they should).
- **Data (N):** N-1 to N-5, N-7 (max 159 characters), N-8 (validator, both folders), N-9, N-11 (no `sample-` id in `data/`), N-12 (footer attribution line on every page, exact text; a Source link on each shown entry with `target="_blank"` and `rel="noopener noreferrer"`; the links were read, not followed).

## 3. Findings (new in this pass)

Severity as in the checklist. Owner is from `docs/AGENT-PLAN.md` section 3. Nothing here was fixed by QA 2.

### G2-1. Minor. Region hero is 416 px tall at 390 px, not 380 px (G-2)
- **Page:** Region, phone width, any Region with a hero picture or a long title.
- **Steps:** open `region.html?id=sample-region-a&data=sample` at 390 px wide; measure `.hero`. (The Gloock web font is loaded in this check; `document.fonts.check("54px Gloock")` is true.)
- **Expected:** 380 px tall (DESIGN section 6, phone layout).
- **Actual:** 416 px. The title wraps "Sample Region / A", and the hero grows above its 380 px `min-height` because of its content and the bottom padding of 88 px (`css/components.css`, `.hero` at max-width 600 px; the bottom padding was raised in `19667f3`). Nothing is clipped (intro bottom 361 px, hero bottom 449 px). The first pass recorded 380 px on the same page; this pass measured 416 px with the font loaded, and I did not trace the difference further.
- **Owner:** Dev B (`css/components.css`). Whether 416 px or 380 px is wanted: orchestrator, with reference to the PNG `07`.

### G2-2. Minor. Title over the bright part of the placeholder hero is hard to read at 390 px (K-14)
- **Page:** Region with a hero picture (Sample Region A uses the Deep Docks placeholder).
- **Steps:** open `region.html?id=sample-region-a&data=sample` at 390 px (or 1280 px); hide the title and intro text (colour transparent, screenshot), then read the pixels under each text line box.
- **Expected:** title (large text, 3 to 1 needed) and intro (normal text, 4.5 to 1 needed) readable over the picture.
- **Actual:** at 390 px the title's 95th-percentile pixel is 1.78 to 1 (the brightest is 1.35 to 1); the intro's 95th percentile is 5.78 to 1 but its brightest pixel is 4.22 to 1. At 1280 px the title's 95th percentile is 3.1 to 1 (brightest 1.53 to 1) and the intro passes (7.55 to 1). The bright orange light of the picture sits behind "Region" (screenshot `shots/k14-hero-1280-textless.png`, `shots/phone-region-sample-a-hero.png`).
- **Owner:** Dev B for the scrim (`css/components.css`, `.hero-shade--title`). The picture is a 640 by 360 placeholder; IMAGES.md asks for at least 1920 by 1080 and the choice of picture is Athos's (PHASE-0 item 9). Re-measure with the final picture.

### G2-3. Minor. Holding-you-up text names the same Region twice (copy)
- **Page:** Home (and the Route rail, which has the same wording for its blocks).
- **Steps:** open `index.html?data=sample`; mark `sample-ability`, `sample-key`, `sample-door` and `sample-shard` (Region A complete), then mark `sample-boss` in Region B. Read "What is holding you up".
- **Expected:** each Region named once, in the DESIGN forms "Blocks <entry> and 1 more entry in <Region>" and "Blocks the region <Region>".
- **Actual:** "Pull the sample lever: Blocks Sample silk skill and 1 more entry in Sample Region D and the region Sample Region D." The Region name repeats because the blocked entries and the blocked Region are in the same Region.
- **Owner:** Dev B (`js/render.js`, `blocksText`).

### G2-4. Minor. On a phone the legend is above the list, not at the bottom (D-7)
- **Page:** Route, phone width.
- **Steps:** open `route.html?data=sample` at 390 px; compare the position of the legend ("A bead is a collectible ...") with the list.
- **Expected:** the legend at the bottom of the page (DESIGN section 6, Route).
- **Actual:** the legend is the last element of the filter rail, which comes before the list on a phone (DESIGN also says "Holding you up rail above the list on a phone"). Measured: legend top 963 px, list top 1121 px, list bottom 1897 px, page height 2124 px. At 1280 px the legend is at the bottom of the rail, as written.
- **Owner:** orchestrator to decide (checklist Q8: DESIGN has both rules); then Dev B for placement.

## 4. First-pass findings: status

| ID | Finding (first pass) | Status now | Evidence |
|---|---|---|---|
| F1 | Focus ring cut off on the left at 390 px | **Closed** (T17, `3dae158`) | G-4: ring on the Next mark 5 to 43 px inside a 390 px viewport, 0 clipping. G-4b: ring on an ordinary mark 11 to 37 px. Both 2px silk. |
| F2 | No attribution or entry Source link | **Closed** (T15, `7a9010f`) | N-12: footer line exact; Source link on each shown entry, `target="_blank"`, `rel="noopener noreferrer"`. Hidden rows were not checked separately. |
| F3 | Requirement names from unvisited Regions shown | **Closed by decision** (F3, 2026-10-20). Behaviour matches the decision. | C-7 and C-7b: "Sample ability" shows on Locked Sample Region B; Sample Region A's `how` text does not. B-2c: "Needs Moss Mother" shows on Silk Spear. |
| F4 | `?data=sample` wrote into the real Progress key | **Closed** (T16, T17) | H-9a: sample key holds the sample id, real key null. H-9b: real page after sample marking, real key null. H-9c: no `sample-` id in the real key. |
| F5 | `/favicon.ico` 404 on every load | **Closed** (T17, `590c445`) | The pages link `img/favicon.svg`; the root server log shows 87 requests for `favicon.svg` (all 200). The only `/favicon.ico` in the log is 404 at 00:28:22, my own `curl` during setup; no browser load requested it. Sub-path log: all 26 responses 200. |
| F6 | Invalid address gave no next step | **Closed** (T16, `e08e6c9`) | E-4: "That email address does not look right. Check it and try again." (Firebase refused `ab`; no mail was sent; run on localhost only). |
| F7 | Phone order of the totals plate | **Closed by decision** (F7, 2026-10-20) | G-5: totals after the list at 390 px. |
| F8 | Decorative tokens below 3 to 1 | **Accepted by decision** (DESIGN section 3, 2026-10-20). Numbers recomputed from the tokens: bar track 1.69, switch track off 1.38, ivory 30% plate border 2.43, silk 60% next border 2.68 (DESIGN writes 2.67). Passing: silk ring 5.55, thread 3.82, ivory field border 3.35, bronze 8.78. | K-11 wording updated. |
| F9 | Hero art differs from the design pictures | **Closed by decision** (F9, 2026-10-20): plain gradient. | E-18; C-1 has no hero image; Account hero has no picture. |
| F10 | "Saved" as a verb in Progress copy | **Closed by decision** (GLOSSARY): the verb is fine. | L-2: the only hit is "Signing in saves your progress online" (DESIGN copy). |

## 5. What I could not run, and why

- **Real sign-in (E-5, E-6, E-7), signed-in Account (F-1 to F-4, DESIGN `06`), two devices (I-1 to I-6), Firestore rules on the published project (I-7), signed-in cloud error (H-10 signed in), screen reader (K-15):** need a real account, a second browser and a human. Athos. No sign-in was attempted anywhere, including the published site.
- **Published sign-in (M-7, sign-in part):** not attempted. The four published pages were loaded (no console message, no failed request, no 4xx) and their files match `4fb3abd`.
- **Wiki checks (N-13, N-14, N-15, N-17):** blocked by `docs/PHASE-0-CHECKLIST.md` item 4. No wiki URL was requested. The Source links were read, not followed.
- **N-16 (Source points at the Region page):** read only. Open for Athos (see section 6).
- **N-10 (five Endings):** `data/endings.json` is empty. Phase 3, as recorded in the checklist. Not a regression, but V1 needs the five before it can be called done.
- **Firestore rules tests:** the suite is skipped without `FIRESTORE_EMULATOR_HOST`. QA 1 runs them with `firebase emulators:exec`. Not run here.
- **K-6 "could not be saved" announcement:** not triggered. `setDone` does not fail in practice (a storage failure falls back to memory), and no fault was injected.
- **K-13 (200 percent zoom):** approximated by narrowing the viewport to 640 and 320 CSS px. No browser zoom or text scaling was driven (no CDP zoom command was used). It checks reflow only.
- **K-14:** measured on the placeholder picture only.
- **Firefox and Safari:** not run. Chromium only.
- **Sub-path:** the copy was Chromium-loaded; GitHub Pages itself is not reproduced.
- **Hidden-entry Source links:** not measured separately.
- **Browser restart (H-4):** one attempt failed for a harness reason (section 7); it passes on the second attempt, which closes Chromium with `Browser.close`.

## 6. Checklist changes (in `qa/checklist.md`)

Lines changed because a decision of 2026-10-20 settled the behaviour: A-10 (Q1), C-7 (Q2, F3), D-8 (Q1), E-18 (Q4, F9), G-5 (Q3, F7), H-9 (Q5), J-5 (Q2), K-11 (F8), K-9 (wording: the Region row has no word "Done", the solid mark is the signal), L-2 (Q6, F10). Clarified: B-4 (the storage key stays; the id is deleted). Added: D-7 wording and Q8 (new open question). Stale "not run in this pass" notes on H-4, K-13 and K-14 updated. The open-questions list now shows Q1 to Q7 as closed and Q8, D-6 (CONTRACTS section 8) and N-16 as open.

## 7. Notes on the harness (not site findings)

- **H-4, first attempt:** the browser was stopped with SIGTERM, and Chromium did not write the last `localStorage` changes to disk. Opening the profile again showed no marks. The driver now asks Chromium to close with `Browser.close` and waits; the check passes on the next run. A browser closed normally keeps its data.
- **File inputs:** Chromium in this sandbox cannot read upload files from `/tmp` (`NotReadableError`), so the backup files for the file-input checks were copied to a folder in the home cache for the run and removed afterwards. The checks used `DOM.setFileInputFiles` on the real hidden input.
- Earlier script mistakes (wrong expected text, a wrong message element, a tab trail that matched by name) were corrected in the scripts; the results above are from the final runs.

## 8. Servers and browsers

- Both HTTP servers (ports 8100 and 8101) were stopped with SIGTERM after the last run. Nothing listens on those ports now.
- Every Chromium the scripts started was closed with `Browser.close`; none was left running on the debugging ports (9600 and up).
- The scratch folder `second-pass/` (outside the repository) keeps the scripts, results and screenshots.

## 9. Handoff

- Branch: `qa-manual/second-pass`, based on `main` at `4fb3abd`. Files changed: `qa/checklist.md` and `qa/reports/2026-10-20-second-pass.md` only.
- Findings: 0 critical; 0 major. Minor: G2-1 (hero height, fails G-2), G2-2 (title contrast on the placeholder, fails K-14 at 390 px), G2-4 (legend position on a phone, fails D-7, decision needed), and G2-3 (repeated Region name in the holding text, copy). Open from earlier: N-10 (Endings, Phase 3), E-2 (GitHub button, Phase 0 item 6), N-16 (Source of `silk-spear`), D-6 (Choice point data rule).
- First-pass findings: F1, F2, F4, F5, F6 closed with evidence; F3, F7, F8, F9, F10 closed by the 2026-10-20 decisions and checked against them.
- Not run: the Athos-only lines, the wiki lines (blocked), the Firestore rules Emulator suite (QA 1), and K-6 "could not be saved".
