# firebase/

Athos puts the current Firestore rules of the shared Hollow-Thingy Firebase project here as `hollow-thingy-firestore.rules` (Phase 0, item 5 in `docs/PHASE-0-CHECKLIST.md`).
Dev A uses that file as the starting point for `firestore.rules`, so the one deployed ruleset keeps Hollow-Thingy working and adds the Silksong collection (`silksong_progress/{uid}`). Agents never deploy rules.
