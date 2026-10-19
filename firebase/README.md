# firebase/

Athos's copy of the Firestore rules currently published on the site's own Firebase project (`silksong-tracker-90229`, ADR 0004): `SilkSong_Tracker.rules`. Today it is the default deny-all ruleset.
The project is not shared with Hollow-Thingy, so Dev A writes `firestore.rules` (repository root) from scratch: each signed-in user reads and writes only `silksong_progress/{uid}`, and everything else stays denied. Agents never deploy rules; Athos publishes them after the Emulator tests pass.
