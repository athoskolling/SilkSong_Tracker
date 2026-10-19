// Firebase web config for the site's own project (ADR 0004).
// This is NOT a secret: it only tells the browser which project to talk to.
// What protects the data is firestore.rules, not hiding these values.
// This is the only file that holds the config; js/firebase.js imports it.
export const firebaseConfig = {
  apiKey: 'AIzaSyDLEBCsBjR33wduy7UgTStZWGCPnqrf_SA',
  authDomain: 'silksong-tracker-90229.firebaseapp.com',
  projectId: 'silksong-tracker-90229',
  storageBucket: 'silksong-tracker-90229.firebasestorage.app',
  messagingSenderId: '305895881455',
  appId: '1:305895881455:web:8321d9b2577cbd65fcf91a',
};
