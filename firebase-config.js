/* ============================================================
   NBA — Firebase configuration
   ============================================================
   Fill in the values below with YOUR Firebase project's web app
   config. To get them:

   1. Go to https://console.firebase.google.com
   2. Open your "Nexa Business Assistant" project
   3. Click the gear icon → Project settings
   4. Scroll to "Your apps" → select the web app (</>) 
   5. Copy the firebaseConfig values shown there into this object

   This file only holds configuration — no business logic lives
   here. Keeping it separate means you only ever have to touch
   this one small file when setting up or moving Firebase
   projects; script.js never needs to change for that.
   ============================================================ */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
