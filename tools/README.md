# tools

Scripts for developers. Nothing here is loaded by the site.

## sync-rehearsal.mjs

A rehearsal of the two-device sync, end to end, with the real Firebase SDK against the local Firebase Emulators. It is the dress rehearsal for the check Athos does by hand on the real site; it finds bugs earlier, it does not replace that check.

What it does: starts a static server for the site, starts three headless Chromium browsers with separate profiles (devices A, B and C), signs them in as one account through the real email form on the Account page (the link is read from the Auth Emulator), and then checks what the pages show, what is in `localStorage` and what is in the cloud copy. It prints one line per check, `PASS` or `FAIL`, and exits non-zero if any check fails.

Needs: `firebase` (firebase-tools), Java (for the Firestore Emulator), Chromium at `/usr/bin/chromium` (or set `CHROMIUM=/path/to/chromium`), `python3`, Node 22 or newer. Internet access is needed too: the pages load the Firebase SDK from gstatic, as the real site does.

Run it from the repository root:

```
firebase emulators:exec --only auth,firestore --project demo-silksong-guide "node tools/sync-rehearsal.mjs"
```

`emulators:exec` starts the Emulators, runs the script, then stops them. Ports 8080 (Firestore) and 9099 (Auth) must be free (`ss -ltn`). The script picks free ports for the site and the browsers by itself, and stops everything it started, also when a check fails. Never run `firebase deploy`, `firebase login` or `firebase use` for this; the `demo-` project id makes the Emulator refuse to reach any real project.

### How the pages reach the Emulators

`js/firebase.js` has an Emulator mode. It turns on only when the page is served from `localhost` or `127.0.0.1` **and** the address has `?emulator`. It then uses the project id `demo-silksong-guide` and connects Auth and Firestore to the local Emulators. On any other host the flag is ignored (`tests/firebase-emulator-mode.test.js`).

The flag is not carried by the site's own links (they only keep `?data=sample`), so the script adds `&emulator` to every address it opens. The email link keeps the flag by itself.

### What it checks

1. A marks an entry; B (page open) shows it without a reload, and again after coming back and after a reload.
2. B unmarks it; A shows it undone without a reload.
3. A fresh profile C marks something before signing in, then signs in as the same account: the result holds both sides, and the Account page shows the "Progress combined" plate with the right numbers.
4. Signing out on A keeps A's Progress and clears `syncedUid`.
5. Every device's sync line reaches "Synced with your account" and never shows an error; no request leaves for anything but the local site, the Emulators and gstatic; no uncaught exception.
6. With `?data=sample` nothing is written to the cloud copy.

### What it does not prove

- The Google popup (and GitHub, when it is enabled).
- Real email delivery and the real link format. The Auth Emulator completes the link on its own page.
- The published domain: the authorized-domain setting, GitHub Pages sub-path, and the published `firestore.rules` (the Emulator runs the rules in the repository, not the ones deployed).
- Two devices editing at the same moment (the known cost in ADR 0001).
- Browsers other than Chromium.
