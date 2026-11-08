/* The Firebase project this hub uses.
   Paste the firebaseConfig block from Firebase console → Project settings → Your apps → Web app.
   These values only say which project to talk to; they are meant to be public. What protects the
   data is firestore.rules (who can read and change what), so keep that file deployed. */
export const firebaseConfig = {
  apiKey: "AIzaSyD768mgoQJ_2X01Zky_12AVOGw7Ut6jiUQ",
  authDomain: "lead-software-beta.firebaseapp.com",
  projectId: "lead-software-beta",
  storageBucket: "lead-software-beta.firebasestorage.app",
  messagingSenderId: "32132815276",
  appId: "1:32132815276:web:a9d1ff923cb3e94e9a8209"
};
/* Example of what it looks like once filled in:
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "lead-ops-hub.firebaseapp.com",
  projectId: "lead-ops-hub",
  storageBucket: "lead-ops-hub.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
*/
