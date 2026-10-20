# tools

Scripts for developers. Nothing here is loaded by the site.

## sync-rehearsal.mjs

A rehearsal of the two-device sync, end to end, with the real Firebase SDK against the local Firebase Emulators. It is the dress rehearsal for the check Athos does by hand on the real site; it finds bugs earlier, it does not replace that check.

What it does: starts a static server for the site, starts three headless Chromium browsers with separate profiles (devices A, B and C), signs them in as one account through the real email form on the Account page (the link is read from the Auth Emulator), and then checks what the pages show, what is in `localStorage` and what is in the cloud copy. It prints one line per check, `PASS` or `FAIL`, and exits non-zero if any check fails.

Needs: `firebase` (firebase-tools), Java (for the Firestore Emulator), Chromium at `/usr/bin/chromium` (or set `CHROMIUM=/path/to/chromium`), `python3`, Node 22 or newer. The pages load the Firebase SDK from gstatic, as the real site does, so gstatic must be reachable; if it is not, see "When gstatic cannot be reached" below.

Run it from the repository root:

```
firebase emulators:exec --only auth,firestore --project demo-silksong-guide "node tools/sync-rehearsal.mjs"
```

`emulators:exec` starts the Emulators, runs the script, then stops them. Ports 8080 (Firestore) and 9099 (Auth) must be free (`ss -ltn`). The script picks free ports for the site and the browsers by itself, and stops everything it started, also when a check fails. Never run `firebase deploy`, `firebase login` or `firebase use` for this; the `demo-` project id makes the Emulator refuse to reach any real project.

### When gstatic cannot be reached

Some sandboxes block `www.gstatic.com`. Then the SDK never loads and every sign-in fails. Build a local copy of the same SDK version and hand it to the script:

```
node tools/local-sdk.mjs /some/folder/outside/the/repository
SDK_DIR=/some/folder/outside/the/repository/out firebase emulators:exec --only auth,firestore --project demo-silksong-guide "node tools/sync-rehearsal.mjs"
```

`tools/local-sdk.mjs` installs `firebase` at the version pinned in `js/firebase.js` (and `esbuild`) from npm and bundles `firebase-app.js`, `firebase-auth.js` and `firebase-firestore.js`. With `SDK_DIR` set, the script answers the pages' requests for `https://www.gstatic.com/firebasejs/<version>/*` from that folder (through DevTools). It refuses a folder built for another version, and it prints which source it used on its second line. **This is the same SDK release but not the bytes gstatic serves**, so a run this way proves the app's sync logic against the real SDK code, not the gstatic delivery. Say which source a result came from.

`SITE_DIR=/path/to/copy` serves a copy of the site instead of the repository, to try a candidate fix to `js/` without touching it; the script prints a loud line when it is set. A result from a copy is not a result for the repository.

`CHROMIUM` can also point at a Playwright-style binary, for example `/opt/pw-browsers/chromium`.

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

### Checks 7 to 13: the player choices (ADR 0006, added in P5-22)

These cover `crestSlots` (opened Crest slots) and `builds` (saved Builds). **The page UI for Builds does not exist yet**, so the script calls the setters of `js/progress.js` from the page itself: it runs `import('<site>/js/progress.js')` through DevTools, the same module URL the pages import, so it is the same module instance, already signed in and syncing (`setBuild`, `setCrestSlots`, `setDone`, `clearProgress`, `exportProgress`, `importProgress`). Everything after the call is the real path: local write, SDK write, Emulator, watch listener, merge on the other device. When the Builds page exists, these calls can move to its buttons.

Each scenario gets its own account and its own browser profiles (closed afterwards). The cloud copy is read straight from the Firestore Emulator with the admin token and decoded. Where a document must be written "as an older page would", the script gets an ID token for the account (a second email-link sign-in over the Auth Emulator's REST API, which leaves the browsers' sessions alone) and writes through the rules, so the rules judge it too.

7. A saves a Build and opened slots; the cloud copy holds them, with no `syncedUid`; B (page open) is handed them through `onProgressChange`, has them in `localStorage`, and keeps them after a reload. B then changes the Build (A receives it whole, not merged) and A removes it (B receives the removal).
8. First sign-in where the two devices saved Builds for different Crests: both Crests' Builds are kept on the device, in the cloud and on the other device.
9. First sign-in where both saved a Build for the same Crest: the newer copy's Build is kept whole (never glued from both), in both orders (the device that signs in second is newer, or older).
10. Opened slots take the larger number per Crest and colour on the first sign-in, also when the Build came from the other side.
11. An older page's four-key document (no `crestSlots`, no `builds`) written straight to the Emulator: (a) newer than both devices, neither device loses its Build or slots (also after a reload) and the next change on a device writes them back; (b) older than the devices, they put their own copy back with no further change.
12. "Start a new run" on A: Builds and slots are empty (not absent) on A, the cloud copy is deleted, B keeps the old run until A's next change, a reload does not bring anything back, then B receives the new run; a stale cloud copy with Builds written afterwards does not come back.
13. Export holds the choices and no `syncedUid`; importing into an empty device adds them; importing again adds nothing; importing into a device with its own choices keeps its Build for the same Crest, adds the other Crest's, keeps the larger slot number, and the result reaches the cloud copy.

### What it does not prove

- The Google popup (and GitHub, when it is enabled).
- Real email delivery and the real link format. The Auth Emulator completes the link on its own page.
- The published domain: the authorized-domain setting, GitHub Pages sub-path, and the published `firestore.rules` (the Emulator runs the rules in the repository, not the ones deployed).
- Two devices editing at the same moment (the known cost in ADR 0001).
- Browsers other than Chromium.
- The Builds page itself (checks 7 to 13 drive `progress.js` directly) and how the page shows a Build that no longer fits.
- The published `firestore.rules` for `crestSlots` and `builds`: the Emulator runs the file in the repository. Athos publishes the rules before the new `progress.js` goes live.
- When two devices change a Build at the very same moment: the newer copy wins as a whole object.
