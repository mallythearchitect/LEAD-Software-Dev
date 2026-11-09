/* LEAD — team edition: the Firebase connection.
   Sign-in (Google or an emailed link), the access list, and a backend for the hub's data
   layer (makeHubDB in lead-core.js). dev/mock-fb.js exports the same functions for testing. */
import { firebaseConfig } from "./firebase-config.js";
import { refId } from "./lead-core.js";

const V = "12.4.0";
const BASE = `https://www.gstatic.com/firebasejs/${V}`;
let fa, fs, auth, db;

export const configured = () => !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);
export const mode = "firebase";

export async function init() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${BASE}/firebase-app.js`), import(`${BASE}/firebase-auth.js`), import(`${BASE}/firebase-firestore.js`)]);
  fa = A; fs = F;
  const app = initializeApp(firebaseConfig);
  auth = A.getAuth(app);
  // Nothing is cached on the device between visits, so a signed-out phone keeps no signer data.
  db = F.initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: F.memoryLocalCache() });
}

// ---------------------------------------------------------------- sign-in
const userOf = u => u && { email: String(u.email || "").toLowerCase(), name: u.displayName || "", photo: u.photoURL || "", verified: !!u.emailVerified };
export const onUser = cb => fa.onAuthStateChanged(auth, u => cb(userOf(u)));
export async function signInGoogle() {
  const p = new fa.GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return userOf((await fa.signInWithPopup(auth, p)).user);
}
/* On a shared computer, stay signed in only until the browser closes. */
export const setShared = shared => fa.setPersistence(auth, shared ? fa.browserSessionPersistence : fa.browserLocalPersistence);
const LINK_KEY = "leadSignInEmail", SHARED_KEY = "leadSignInShared";
export async function sendLink(email, shared) {
  await fa.sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
  try { localStorage.setItem(LINK_KEY, email); localStorage.setItem(SHARED_KEY, shared ? "1" : ""); } catch (e) { /* private window */ }
}
export const isLink = () => fa.isSignInWithEmailLink(auth, location.href);
export const savedLinkEmail = () => { try { return localStorage.getItem(LINK_KEY) || ""; } catch (e) { return ""; } };
export async function finishLink(email) {
  let shared = false;
  try { shared = localStorage.getItem(SHARED_KEY) === "1"; } catch (e) { /* ignore */ }
  await setShared(shared);
  const r = await fa.signInWithEmailLink(auth, email, location.href);
  try { localStorage.removeItem(LINK_KEY); localStorage.removeItem(SHARED_KEY); } catch (e) { /* ignore */ }
  history.replaceState(null, "", location.pathname);
  return userOf(r.user);
}
export const signOut = () => fa.signOut(auth);

// ---------------------------------------------------------------- access
const ref = (col, id) => fs.doc(db, col, id);
const data = s => (s.exists() ? s.data() : null);
export async function getOwner() { try { return data(await fs.getDoc(ref("system", "owner"))); } catch (e) { return null; } }
export async function getAccess(email) { try { return data(await fs.getDoc(ref("access", email))); } catch (e) { return null; } }
export async function claimOwner({ email, name, center }) {
  const b = fs.writeBatch(db);
  b.set(ref("access", email), { email, name, role: "asst", title: "Assistant Coordinator", center, viewCenters: [], at: fs.serverTimestamp(), by: email });
  b.set(ref("system", "owner"), { email, at: fs.serverTimestamp() });
  await b.commit();
}
export const updateMyAccess = (email, patch) => fs.updateDoc(ref("access", email), patch);
/* Calls back with this person's access entry now and whenever it changes (null while there is none). */
export const watchAccess = (email, cb) => fs.onSnapshot(ref("access", email), s => cb(data(s)), () => cb(null));
export async function upsertRequest({ email, name, photo }) {
  await fs.setDoc(ref("requests", email), { email, googleName: name || "", photo: photo || "", at: fs.serverTimestamp() });
}

// ---------------------------------------------------------------- built-in lists (stored in pieces under ref/)
export async function getRefIndex() { try { return data(await fs.getDoc(ref("system", "refindex"))) || { sets: {} }; } catch (e) { return { sets: {} }; } }
export async function loadTier(tier, center, parts) {
  const snaps = await Promise.all(Array.from({ length: parts }, (_, i) => fs.getDoc(ref("ref", refId(tier, center, i)))));
  return JSON.parse(snaps.map(s => (s.exists() ? s.data().json : "")).join("") || "{}");
}

// ---------------------------------------------------------------- the hub's data
export function backend() {
  return {
    listen(col, filters, onDocs, onErr) {
      let q = fs.collection(db, col);
      if (filters.length) q = fs.query(q, ...filters.map(([f, op, v]) => fs.where(f, op, v)));
      return fs.onSnapshot(q, sn => onDocs(sn.docs.map(d => ({ id: d.id, data: d.data() }))), onErr);
    },
    listenDoc: (col, id, onDoc, onErr) => fs.onSnapshot(ref(col, id), s => onDoc({ id, exists: s.exists(), data: s.data() }), onErr),
    set: (col, id, d) => fs.setDoc(ref(col, id), d),
    del: (col, id) => fs.deleteDoc(ref(col, id)),
    async get(col, id) { const s = await fs.getDoc(ref(col, id)); return { id, exists: s.exists(), data: s.data() }; },
  };
}

// ---------------------------------------------------------------- owner page
export async function listCol(col) { const s = await fs.getDocs(fs.collection(db, col)); return s.docs.map(d => ({ id: d.id, ...d.data() })); }
export const setRaw = (col, id, d, merge) => fs.setDoc(ref(col, id), d, merge ? { merge: true } : {});
export const delRaw = (col, id) => fs.deleteDoc(ref(col, id));
export const stamp = () => fs.serverTimestamp();
export const when = date => fs.Timestamp.fromDate(date);
export const toDate = t => (t && typeof t.toDate === "function" ? t.toDate() : t instanceof Date ? t : null);
/* ops: [{op: "set"|"del", col, id, data}] — sent in batches small enough for one request each. */
export async function writeMany(ops, onProgress) {
  let i = 0;
  while (i < ops.length) {
    const b = fs.writeBatch(db); let n = 0, bytes = 0;
    while (i < ops.length && n < 400) {
      const o = ops[i], size = o.data ? JSON.stringify(o.data).length : 50;
      if (n && bytes + size > 7_000_000) break;
      if (o.op === "del") b.delete(ref(o.col, o.id)); else b.set(ref(o.col, o.id), o.data);
      i++; n++; bytes += size;
    }
    await b.commit();
    if (onProgress) onProgress(i, ops.length);
  }
}

// ---------------------------------------------------------------- the team: check-ins, the team list, messages, feedback, codes
// Each of these mirrors a block in firestore.rules; dev/mock-fb.js has the same functions.
const meEmail = () => String((auth.currentUser && auth.currentUser.email) || "").toLowerCase();
const ms = t => { const d = toDate(t); return d && !isNaN(d) ? d.getTime() : Date.now(); };
const rows = sn => sn.docs.map(d => ({ id: d.id, ...d.data(), at: ms(d.data().at) }));
const watch = (q, cb, onErr) => fs.onSnapshot(q, sn => cb(rows(sn)), onErr || (() => {}));
export const setPresence = d => fs.setDoc(ref("presence", meEmail()), { ...d, email: meEmail(), at: fs.serverTimestamp() });
export const watchPresence = (date, cb, onErr) => watch(fs.query(fs.collection(db, "presence"), fs.where("date", "==", date)), cb, onErr);
export const joinDirectory = d => fs.setDoc(ref("directory", meEmail()), { ...d, email: meEmail(), at: fs.serverTimestamp() });
export const watchDirectory = (cb, onErr) => watch(fs.collection(db, "directory"), cb, onErr);
export const sendMessage = (to, toName, text, fromName) =>
  fs.addDoc(fs.collection(db, "messages"), { from: meEmail(), fromName, to, toName, text, read: false, at: fs.serverTimestamp() });
export const watchInbox = (cb, onErr) => watch(fs.query(fs.collection(db, "messages"), fs.where("to", "==", meEmail())), cb, onErr);
export const watchSent = (cb, onErr) => watch(fs.query(fs.collection(db, "messages"), fs.where("from", "==", meEmail())), cb, onErr);
export const markRead = id => fs.updateDoc(ref("messages", id), { read: true });
export const sendFeedback = d => fs.addDoc(fs.collection(db, "feedback"), { ...d, by: meEmail(), at: fs.serverTimestamp() });
export const watchFeedback = (cb, onErr) => watch(fs.collection(db, "feedback"), cb, onErr);
export async function getCodes(center) { return data(await fs.getDoc(ref("codes", center))); }
export const listRoster = () => listCol("roster");
export const logActivity = d => fs.addDoc(fs.collection(db, "activity"), { ...d, by: meEmail(), at: fs.serverTimestamp() });
export const watchActivity = (cb, onErr) => watch(fs.query(fs.collection(db, "activity"), fs.orderBy("at", "desc"), fs.limit(40)), cb, onErr);
export async function getAI() { return data(await fs.getDoc(ref("system", "ai"))); }
export async function getFeedbackHook() { return data(await fs.getDoc(ref("system", "feedbackHook"))); }
