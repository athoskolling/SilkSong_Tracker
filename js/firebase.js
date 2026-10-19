// Sign-in and the cloud copy of Progress (docs/CONTRACTS.md section 4).
//
// Rules that shape this file:
// - It is the ONLY module that imports the Firebase SDK, and it never exports
//   an Auth or Firestore handle. Everything else goes through the functions below.
// - Only js/progress.js may use readProgressDoc, writeProgressDoc,
//   deleteProgressDoc and watchProgressDoc.
// - The SDK is loaded lazily, the first time something needs it. Importing this
//   file therefore never touches the network, and if gstatic cannot be reached
//   the site keeps working with local Progress only (ADR 0001).

import { firebaseConfig } from './firebase-config.js';

// One pinned version for all three SDK files. Change it here and nowhere else.
// Raise it deliberately and re-test sign-in by hand (tools/auth-check.html).
const SDK_VERSION = '12.19.0';
const SDK_BASE = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

const PROGRESS_COLLECTION = 'silksong_progress';
const EMAIL_KEY = 'silksong-guide:email-for-sign-in';

// ---------------------------------------------------------------------------
// Loading the SDK
// ---------------------------------------------------------------------------

let servicesPromise = null;

// Loads the SDK once and returns { auth, db, sdk }. If loading fails the cache is
// cleared, so a later call can try again (for example when the network is back).
function getServices() {
  if (!servicesPromise) {
    servicesPromise = loadServices().catch((cause) => {
      servicesPromise = null;
      const error = new Error(
        'Could not load the sign-in service. Check your connection; the guide still works without an account.'
      );
      error.code = 'sdk-unavailable';
      error.cause = cause;
      throw error;
    });
  }
  return servicesPromise;
}

async function loadServices() {
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import(`${SDK_BASE}/firebase-app.js`),
    import(`${SDK_BASE}/firebase-auth.js`),
    import(`${SDK_BASE}/firebase-firestore.js`),
  ]);
  const app = appModule.initializeApp(firebaseConfig);
  return {
    auth: authModule.getAuth(app),
    db: firestoreModule.getFirestore(app),
    sdk: { ...authModule, ...firestoreModule },
  };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// Turns Firebase error codes into sentences the interface can show as they are.
const FRIENDLY_MESSAGES = {
  'auth/popup-blocked':
    'The browser blocked the sign-in window. Allow pop-ups for this site and try again.',
  'auth/popup-closed-by-user': 'The sign-in window was closed before it finished.',
  'auth/cancelled-popup-request': 'Another sign-in window was already open. Try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled for the site yet.',
  'auth/unauthorized-domain':
    'This address is not allowed to sign in. Open the site from its normal address or from localhost.',
  'auth/network-request-failed': 'Could not reach the sign-in service. Check your connection.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/account-exists-with-different-credential':
    'An account with this email already exists with another sign-in method. Use that method.',
  'auth/invalid-action-code': 'This sign-in link is not valid or was already used. Ask for a new one.',
  'auth/expired-action-code': 'This sign-in link has expired. Ask for a new one.',
  'permission-denied': 'The cloud copy could not be accessed. Sign in again and retry.',
  unavailable: 'Could not reach the cloud copy. Your local Progress is safe.',
};

// Wraps an SDK error into an Error with a readable message and the original code.
function friendlyError(error, fallback) {
  if (error && error.code === 'sdk-unavailable') return error;
  const code = error && error.code;
  const wrapped = new Error(FRIENDLY_MESSAGES[code] || fallback);
  wrapped.code = code || 'unknown';
  wrapped.cause = error;
  return wrapped;
}

function readStoredEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return ''; // storage blocked: the caller falls back to asking for the address
  }
}

function storeEmail(email) {
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Not fatal: the link will answer 'needs-email' and the page asks again.
  }
}

function clearStoredEmail() {
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

// The Firebase provider ids are not friendly. Email link accounts report 'password'.
const PROVIDER_NAMES = {
  'google.com': 'google',
  'github.com': 'github',
  password: 'email-link',
};

function toUser(firebaseUser) {
  if (!firebaseUser) return null;
  const providerId = (firebaseUser.providerData[0] && firebaseUser.providerData[0].providerId) || '';
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    provider: PROVIDER_NAMES[providerId] || providerId,
  };
}

// The current page address without query and hash. Used as the email link's return
// address, so it works on any host (localhost or the GitHub Pages subpath) and an
// old link never ends up inside the new one.
function currentPageUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  return url.toString();
}

// ---------------------------------------------------------------------------
// Sign-in
// ---------------------------------------------------------------------------

export async function signIn(provider, email) {
  if (provider !== 'google' && provider !== 'github' && provider !== 'email-link') {
    throw new Error(`Unknown sign-in method: ${provider}`);
  }
  if (provider === 'email-link' && !(email && email.trim())) {
    throw new Error('Enter your email address first.');
  }

  const { auth, sdk } = await getServices();
  try {
    if (provider === 'email-link') {
      const address = email.trim();
      await sdk.sendSignInLinkToEmail(auth, address, {
        url: currentPageUrl(),
        handleCodeInApp: true,
      });
      // Remembered so that opening the link on this device needs no typing.
      storeEmail(address);
      return;
    }

    const authProvider =
      provider === 'google' ? new sdk.GoogleAuthProvider() : new sdk.GithubAuthProvider();
    if (provider === 'google') {
      // Lets people with several Google accounts choose instead of reusing the last.
      authProvider.setCustomParameters({ prompt: 'select_account' });
    }
    // A popup (not a redirect): redirect sign-in is unreliable when the page and
    // authDomain are on different hosts, which is our case on GitHub Pages.
    // Browsers allow the popup because signIn runs from the player's click.
    await sdk.signInWithPopup(auth, authProvider);
  } catch (error) {
    if (error && error.code === 'auth/operation-not-allowed' && provider === 'github') {
      throw friendlyError(error, 'GitHub sign-in is not enabled for this site yet.');
    }
    throw friendlyError(error, 'Sign-in failed. Try again.');
  }
}

// Called by main.js on every page load, so the cheap checks come before anything
// loads the SDK: a normal page load costs nothing here.
export async function completeEmailLinkSignIn(email) {
  if (typeof window === 'undefined') return 'not-a-link';
  const params = new URLSearchParams(window.location.search);
  if (!params.get('oobCode') || params.get('mode') !== 'signIn') return 'not-a-link';

  const { auth, sdk } = await getServices();
  if (!sdk.isSignInWithEmailLink(auth, window.location.href)) return 'not-a-link';

  const address = (email || '').trim() || readStoredEmail();
  if (!address) return 'needs-email';

  try {
    await sdk.signInWithEmailLink(auth, address, window.location.href);
  } catch (error) {
    // A used or expired link would fail again on every reload, so drop it from the address bar.
    if (error && (error.code === 'auth/invalid-action-code' || error.code === 'auth/expired-action-code')) {
      removeLinkFromAddressBar();
    }
    throw friendlyError(error, 'Sign-in with the email link failed. Ask for a new link.');
  }
  clearStoredEmail();
  removeLinkFromAddressBar();
  return 'signed-in';
}

function removeLinkFromAddressBar() {
  window.history.replaceState(null, '', currentPageUrl());
}

export async function signOut() {
  const { auth, sdk } = await getServices();
  try {
    await sdk.signOut(auth);
  } catch (error) {
    throw friendlyError(error, 'Sign-out failed. Try again.');
  }
}

// If the SDK cannot load, this reports null once ("nobody is signed in"), which is
// exactly what the local-only site needs.
export function onAuthChange(callback) {
  let active = true;
  let stopSdkListener = null;

  getServices()
    .then(({ auth, sdk }) => {
      if (!active) return;
      stopSdkListener = sdk.onAuthStateChanged(auth, (firebaseUser) => {
        if (active) callback(toUser(firebaseUser));
      });
    })
    .catch(() => {
      if (active) callback(null);
    });

  return () => {
    active = false;
    if (stopSdkListener) stopSdkListener();
  };
}

// ---------------------------------------------------------------------------
// Cloud copy of Progress: silksong_progress/{uid}
// ---------------------------------------------------------------------------

function progressRef(services, uid) {
  if (!uid) throw new Error('A signed-in user is needed to reach the cloud copy.');
  return services.sdk.doc(services.db, PROGRESS_COLLECTION, uid);
}

export async function readProgressDoc(uid) {
  const services = await getServices();
  try {
    const snapshot = await services.sdk.getDoc(progressRef(services, uid));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    throw friendlyError(error, 'Could not read the cloud copy.');
  }
}

export async function writeProgressDoc(uid, progress) {
  if (!progress || typeof progress !== 'object') {
    throw new Error('writeProgressDoc needs a Progress object.');
  }
  // Only the Progress shape goes to the cloud. In particular never syncedUid:
  // it describes this device, not the account (docs/CONTRACTS.md section 3).
  const body = {
    done: progress.done || {},
    visited: progress.visited || {},
    updatedAt: progress.updatedAt,
    dataVersion: progress.dataVersion,
  };
  const services = await getServices();
  try {
    // setDoc without merge replaces the whole document, so an unmarked id really disappears.
    await services.sdk.setDoc(progressRef(services, uid), body);
  } catch (error) {
    throw friendlyError(error, 'Could not save to the cloud copy.');
  }
}

export async function deleteProgressDoc(uid) {
  const services = await getServices();
  try {
    await services.sdk.deleteDoc(progressRef(services, uid));
  } catch (error) {
    throw friendlyError(error, 'Could not delete the cloud copy.');
  }
}

// Calls back with the stored object, or null when there is no document. Echoes of
// this device's own writes (not yet confirmed by the server) are skipped, so the
// callback means "the cloud copy changed", which is what progress.js needs.
// A failure (the SDK cannot load, or the listener stops, for example permission-denied)
// goes to the optional onError and NEVER to callback: callback(null) means "there is
// no cloud copy", and reporting an error as that would make progress.js think the
// copy was deleted.
export function watchProgressDoc(uid, callback, onError) {
  let active = true;
  let stopSdkListener = null;

  const fail = (error, fallback) => {
    const friendly = friendlyError(error, fallback);
    console.warn(fallback, friendly.code);
    if (!active || typeof onError !== 'function') return;
    try {
      onError(friendly);
    } catch (handlerError) {
      console.error('onError handler failed', handlerError); // a bad handler must not break the listener code
    }
  };

  getServices()
    .then((services) => {
      if (!active) return;
      stopSdkListener = services.sdk.onSnapshot(
        progressRef(services, uid),
        (snapshot) => {
          if (!active || snapshot.metadata.hasPendingWrites) return;
          callback(snapshot.exists() ? snapshot.data() : null);
        },
        (error) => fail(error, 'Lost the connection to the cloud copy.')
      );
    })
    .catch((error) => fail(error, 'Could not watch the cloud copy.'));

  return () => {
    active = false;
    if (stopSdkListener) stopSdkListener();
  };
}
