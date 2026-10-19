# Own Firebase project, separate from Hollow-Thingy

Supersedes ADR 0002 (decided by Athos, 2026-10-19, Phase 1).

Silksong Guide has its own Firebase project (`silksong-tracker-90229`), with its own Auth users, its own Firestore database and its own ruleset. It shares nothing with Hollow-Thingy except the idea: Silksong follows Hollow Knight, but the two sites are separate projects, repositories and databases.

Why: a separate project removes the cross-site risk that ADR 0002 was built around. A wrong rule here can no longer break Hollow-Thingy, so `firestore.rules` is written from scratch for this project and does not have to carry Hollow-Thingy's rules.

What we gave up: one login for both sites. A player signs in to Silksong Guide separately, and their Hollow-Thingy account does not carry over (the same Google or GitHub account gets a different uid here).

What stays from ADR 0002: rules are tested in the Firebase Emulator before Athos publishes them, and agents never deploy. The collection keeps its name, `silksong_progress/{uid}`, so the contract does not change.
