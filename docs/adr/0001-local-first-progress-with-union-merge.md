# Local-first progress with union merge on first login

Progress is saved in the browser by default and synced to the cloud only after sign-in, so the site works without an account and a cloud problem can't lose a run. On first login, local and cloud Progress are merged by union (anything marked in either stays marked); afterwards the latest change wins. The alternative, cloud-only with login required, was rejected because it makes the site unusable offline or signed out and makes one outage a total loss.
