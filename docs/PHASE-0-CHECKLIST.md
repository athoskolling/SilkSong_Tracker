# Phase 0 checklist

Phase 0 has two halves. **Athos's half** unblocks things only the owner can do (accounts, settings, legal reading). **The orchestrator's half** is the foundation inside the repository.

Rule for agents: a box is checked only when Athos has checked it or told you it is done. Never do Athos's tasks yourself, and never assume one is done. If work is blocked by an unchecked box, stop that thread and say which box.

## Athos's tasks (do these when you are ready; nothing in the first local steps needs them)

Write the answer next to each item when it has one (name, URL, yes or no, date).

- [x] **1. GitHub repository.** Create it and choose a name. Check whether your GitHub plan allows Pages on a private repository.
  - Name: `athoskolling/SilkSong_Tracker` (https://github.com/athoskolling/SilkSong_Tracker)  Visibility: **public** (seen by the orchestrator on 2026-10-19; empty, no commits yet). Confirmed by Athos (he pushed and turned on Pages), 2026-10-19.  (If private is not allowed with Pages, the repository is public: no secrets in the code and strict Firestore rules.)
- [x] **2. GitHub Pages.** Turn it on for the repository after the first push. Record the address: `https://<user>.github.io/<repository>/`
  - URL: https://athoskolling.github.io/SilkSong_Tracker/ (on, returns 200, checked by the orchestrator 2026-10-19)
- [x] **3. Firebase authorized domain.** In the Firebase console (project `silksong-tracker-90229`), Authentication, Settings, Authorized domains, add `<user>.github.io`. Without it, sign-in fails on the published site.
  - Done 2026-10-19 (Athos).
- [ ] **4. Wiki license and terms.** Read the main wiki's terms of use and content license. Decide whether the draft script may read it and with what limits. Until this is checked, nobody reads the wiki in bulk, runs `tools/draft-from-wiki.js` or starts wiki checks.
  - Wiki: ________  Decision: allowed / not allowed / allowed with limits: ________
  - Research prepared by the orchestrator (2026-10-20), not a decision: `docs/research/2026-10-20-sources-and-batch-1.md`. hollowknight.wiki blocks automated reading (HTTP 403), so its license must be read in a browser; Fextralife's terms (Valnet) forbid scraping and "rewriting for publication".
- [x] **5. Current Firestore rules.** Copy the rules the project has now (Firebase console, Firestore, Rules) into `firebase/` and say which repository owns the deployed rules.
  - Done 2026-10-19: `firebase/SilkSong_Tracker.rules` (the default deny-all rules). The project is Silksong Guide's own, separate from Hollow-Thingy (ADR 0004), so this repository owns its ruleset and `firestore.rules` is written from scratch.
- [x] **6. Firebase web config and sign-in providers.** Give the orchestrator the Firebase web config (it is not a secret) for `js/firebase-config.js`, and confirm Google, GitHub and email link sign-in are enabled in that project.
  - Config received 2026-10-19 (project `silksong-tracker-90229`); Dev A puts it in `js/firebase-config.js`. Enabled (Athos, 2026-10-19): Google and email link. GitHub is not enabled; the Account screen hides its button until it is.
- [x] **7. Contracts.** Read `docs/CONTRACTS.md` with the orchestrator and approve it. Confirm or change the assumption that importing a backup adds to existing Progress (union) and never removes anything.
  - Approved 2026-10-19. Import is a union. Firebase SDK from gstatic allowed (pinned, only in `js/firebase.js`).
- [ ] **8. First batch.** Confirm on the wiki that Moss Grotto, The Marrow and Deep Docks are the first three Regions, and the scope of each.
  - Research prepared (2026-10-20), not a decision: same file. Open question: is Bone Bottom a Region or a Sub-area of Moss Grotto?
- [ ] **9. Hero images.** Decide whether game screenshots stay as Region heroes on the public site (see "Rights and risk" in `docs/IMAGES.md`), and send the images you want (`img/incoming/`).

## Orchestrator's tasks

- [x] Scaffold the folders in `docs/STRUCTURE.md` section 4 that do not exist yet (empty folders get a short `README.md` or `.gitkeep`).
- [x] Review `docs/CONTRACTS.md` with Athos; fix any contradiction with the other docs; record changes.
- [x] Confirm `data/sample/` passes the contract shapes by reading it against `docs/CONTRACTS.md`. (Done 2026-10-19 by reading; the validator does not exist yet, so it has not been run.)
- [x] Set the branch convention: one branch per agent task (`dev-a/<topic>`, `dev-b/<topic>`, `qa-tests/<topic>`, `qa-manual/<topic>`). Recorded in `docs/AGENT-PLAN.md` section 6.
- [x] Output: contracts approved by Athos (item 7 above).

Item 5 was checked before items 1 to 3. Phase 0 is done when the orchestrator's tasks and Athos's items 1, 2, 3, 5, 6 and 7 are checked. Items 4 and 8 gate Phase 3 and the wiki parts of QA; item 9 gates only the images.
