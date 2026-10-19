# Phase 0 checklist

Phase 0 has two halves. **Athos's half** unblocks things only the owner can do (accounts, settings, legal reading). **The orchestrator's half** is the foundation inside the repository.

Rule for agents: a box is checked only when Athos has checked it or told you it is done. Never do Athos's tasks yourself, and never assume one is done. If work is blocked by an unchecked box, stop that thread and say which box.

## Athos's tasks (do these when you are ready; nothing in the first local steps needs them)

Write the answer next to each item when it has one (name, URL, yes or no, date).

- [ ] **1. GitHub repository.** Create it and choose a name. Check whether your GitHub plan allows Pages on a private repository.
  - Name: ________  Visibility: private / public  (If private is not allowed with Pages, the repository is public: no secrets in the code and strict Firestore rules.)
- [ ] **2. GitHub Pages.** Turn it on for the repository after the first push. Record the address: `https://<user>.github.io/<repository>/`
  - URL: ________
- [ ] **3. Firebase authorized domain.** In the Firebase console, Authentication, Settings, Authorized domains, add `<user>.github.io`. Without it, sign-in fails on the published site.
- [ ] **4. Wiki license and terms.** Read the main wiki's terms of use and content license. Decide whether the draft script may read it and with what limits. Until this is checked, nobody reads the wiki in bulk, runs `tools/draft-from-wiki.js` or starts wiki checks.
  - Wiki: ________  Decision: allowed / not allowed / allowed with limits: ________
- [ ] **5. Current Firestore rules.** Copy the rules the Hollow-Thingy Firebase project has now (Firebase console, Firestore, Rules) into `firebase/hollow-thingy-firestore.rules`. The Silksong rules must be added to them, not replace them, because the project has one ruleset. Also say which repository owns the deployed rules.
  - Owner of the deployed ruleset: ________
- [ ] **6. Firebase web config and sign-in providers.** Give the orchestrator the Firebase web config (it is not a secret) for `js/firebase-config.js`, and confirm Google, GitHub and email link sign-in are enabled in that project.
- [ ] **7. Contracts.** Read `docs/CONTRACTS.md` with the orchestrator and approve it. Confirm or change the assumption that importing a backup adds to existing Progress (union) and never removes anything.
- [ ] **8. First batch.** Confirm on the wiki that Moss Grotto, The Marrow and Deep Docks are the first three Regions, and the scope of each.
- [ ] **9. Hero images.** Decide whether game screenshots stay as Region heroes on the public site (see "Rights and risk" in `docs/IMAGES.md`), and send the images you want (`img/incoming/`).

## Orchestrator's tasks

- [ ] Scaffold the folders in `docs/STRUCTURE.md` section 4 that do not exist yet (empty folders get a short `README.md` or `.gitkeep`).
- [ ] Review `docs/CONTRACTS.md` with Athos; fix any contradiction with the other docs; record changes.
- [ ] Confirm `data/sample/` passes the contract shapes by reading it against `docs/CONTRACTS.md`.
- [ ] Set the branch convention: one branch per agent task (`dev-a/<topic>`, `dev-b/<topic>`, `qa-tests/<topic>`, `qa-manual/<topic>`).
- [ ] Output: contracts approved by Athos (item 7 above).

Phase 0 is done when the orchestrator's tasks and Athos's items 1, 2, 3, 5, 6 and 7 are checked. Items 4 and 8 gate Phase 3 and the wiki parts of QA; item 9 gates only the images.
