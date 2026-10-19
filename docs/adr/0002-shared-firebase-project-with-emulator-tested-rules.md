# Shared Firebase project with Emulator-tested rules

The site reuses the Hollow-Thingy Firebase project (Auth + Firestore) so one login works for both sites, with Silksong data in its own collection. Because a bad rule could affect the other site, Firestore rules are only published after passing Firebase Emulator tests. A separate project was rejected for now: it removes the cross-site risk but means a second login and more setup, and it can still be adopted later if the risk proves real.
