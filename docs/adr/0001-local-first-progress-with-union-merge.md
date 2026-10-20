# Local-first progress with union merge on first login

Progress is saved in the browser by default and synced to the cloud only after sign-in, so the site works without an account and a cloud problem can't lose a run. On first login, local and cloud Progress are merged by union (anything marked in either stays marked); afterwards the latest change wins. The alternative, cloud-only with login required, was rejected because it makes the site unusable offline or signed out and makes one outage a total loss.

Addendum (2026-10-20, Phase 5): Progress may also hold three optional player choices (`crestSlots`, `builds`, `shellShards`). "Newer wins as a whole object" still applies to them; on the first sign-in each has its own union rule (larger number, keep every Crest's Build, newer `shellShards`), and a field missing from one copy is taken from the other. See ADR 0006.
