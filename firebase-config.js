/* ============================================================
   NBA — Firebase configuration
   ============================================================
   Connected to the "nexa-business-assistant" Firebase project.

   This file only holds configuration — no business logic lives
   here. Keeping it separate means you only ever have to touch
   this one small file when moving to a different Firebase
   project; script.js never needs to change for that.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyB-RIiTGnikzL658P3PQkp0e19Ohpmzax4",
  authDomain: "nexa-business-assistant.firebaseapp.com",
  projectId: "nexa-business-assistant",
  storageBucket: "nexa-business-assistant.firebasestorage.app",
  messagingSenderId: "59609272790",
  appId: "1:59609272790:web:59a5d0d6718c3130259477",
  measurementId: "G-YJB5PR40QG"
};

// Initialize Firebase using the compat SDK loaded in index.html.
// If the config above is still filled with placeholders, or the
// SDK failed to load, this can throw — script.js checks for that
// and shows a clear on-screen error instead of a blank page.
try {
  firebase.initializeApp(firebaseConfig);
} catch (err) {
  console.error("Firebase failed to initialize:", err);
  window.__nbaFirebaseInitError = err;
}

// Firestore (NBA V2 — cloud business data). `db` is read by script.js.
// If this fails, NBA still runs fully in local-only mode — script.js
// checks for `db` before attempting any cloud sync.
let db;
try {
  db = firebase.firestore();
} catch (err) {
  console.error("Firestore failed to initialize:", err);
  db = undefined;
}
