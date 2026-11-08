/* Offline test double for lead-fb.js: the same functions, made-up people and the demo data, all in
   this browser tab. gate.js and admin.js only load it on localhost with ?offline in the address.
   It refuses what firestore.rules would refuse (using the mirror in lead-core.js), working out
   each person's permissions from the stored access list the way the server does.

   Address options:
     ?offline&as=owner|exec|coord|asst|special|canv|trial|expired|nocenter|pending|out|noowner
     &center=<center id>          the assistant's center (as=asst)
     &pages=today,team,events     the special assignment's pages (as=special)
     &reset                       start over with fresh demo data (needed to try as=noowner)
   Changes last until the tab is closed (sessionStorage), so approving someone on the owner
   page and then opening the hub as them works. */
import { ROLES, CENTER_IDS, ruleRead, ruleWrite, tierAllowed, matches, bundleOps, grantsForPages, RESERVED } from "../lead-core.js";
import { demoBundle } from "../demo-data.js";

export const mode = "offline";
const P = new URLSearchParams(location.search);
const AS = P.get("as") || "owner";
const OWNER = "owner@example.org";
const SKEY = "leadMockStore", OUTKEY = "leadMockSignedOut", LINKKEY = "leadMockLink";
const store = new Map();
const col = c => { if (!store.has(c)) store.set(c, new Map()); return store.get(c); };
const listeners = new Set();
const clone = d => (d === undefined ? undefined : JSON.parse(JSON.stringify(d)));
const userCbs = [];
let user = null;
const err = (msg, code = "permission-denied") => Object.assign(new Error("(offline test) " + msg), { code });
const days = n => new Date(Date.now() + n * 864e5).toISOString();
const later = fn => setTimeout(fn, 0);

const PERSONAS = {
  owner: [OWNER, "Test Owner", null],
  noowner: [OWNER, "Test Owner", null],
  exec: ["exec@example.org", "Test Executive", { role: "exec", center: "all" }],
  coord: ["coord@example.org", "Test Coordinator", { role: "coord", center: "new-britain" }],
  asst: ["asst@example.org", "Test Assistant", { role: "asst", center: P.get("center") || "danbury" }],
  special: ["special@example.org", "Test Special", { role: "special", center: "east-hartford", pages: (P.get("pages") || "today,team,events,playbook").split(",") }],
  canv: ["canv@example.org", "Test Canvasser", { role: "canv", center: "east-hartford" }],
  trial: ["trial@example.org", "Test Trial", { role: "trial", center: "east-hartford", until: days(30) }],
  expired: ["late@example.org", "Test Expired", { role: "trial", center: "east-hartford", until: days(-1) }],
  nocenter: ["new.asst@example.org", "Test Newcomer", { role: "asst", center: "" }],
  pending: ["marlene.o@example.org", "Marlene Ortiz", null],
  out: ["marlene.o@example.org", "Marlene Ortiz", null],
};
const [EMAIL, NAME, ACC] = PERSONAS[AS] || PERSONAS.owner;

// ---------------------------------------------------------------- the pretend database
function save() {
  try { sessionStorage.setItem(SKEY, JSON.stringify([...store].map(([c, m]) => [c, [...m]]))); }
  catch (e) { console.warn("[offline] couldn't keep the test data for the next page", e); }
}
function load() {
  try {
    const a = JSON.parse(sessionStorage.getItem(SKEY) || "null");
    if (!Array.isArray(a)) return false;
    for (const [c, items] of a) store.set(c, new Map(items));
    return true;
  } catch (e) { return false; }
}
function seed() {
  store.clear();
  const { ops } = bundleOps(demoBundle(), null, OWNER, new Date().toISOString());
  for (const o of ops) if (o.op === "set") col(o.col).set(o.id, clone(o.data));
  if (AS !== "noowner") {
    col("system").set("owner", { email: OWNER });
    col("access").set(OWNER, { email: OWNER, name: "Test Owner", role: "asst", title: "Assistant Coordinator", center: "east-hartford", viewCenters: [] });
  }
  // a made-up roster and sign-in requests, to try the name matching on the owner page
  [["Jordan Rivera", "coord", "new-haven"], ["Maya Santos", "asst", "waterbury"], ["Marleny Ortiz", "coord", ""], ["Dee Walker", "exec", ""], ["Sam Okafor", "special", "east-hartford"], ["Rosa Diaz", "asst", "bridgeport"]]
    .forEach(([name, role, center], i) => col("roster").set("r" + i, { name, role, center, notes: "" }));
  [["jrivera@example.org", "Jordan Rivera"], ["chris.unknown@example.org", "Chris Unknown"], ["rosa.d@example.org", "Rosa M. Diaz"]]
    .forEach(([email, googleName]) => col("requests").set(email, { email, googleName, photo: "", at: new Date().toISOString() }));
}
function ensurePersona() {
  if (ACC && !col("access").has(EMAIL)) col("access").set(EMAIL, { email: EMAIL, name: NAME, title: "", viewCenters: [], ...ACC });
}
function changed(c) { save(); for (const l of [...listeners]) if (l.col === c) l.run(); }

/* What the server knows about whoever is signed in: worked out from the stored access list, the
   way firestore.rules does, never from what the page claims. */
function who() {
  if (!user) return { role: "" };
  const a = col("access").get(user.email);
  const owner = (col("system").get("owner") || {}).email === user.email;
  const live = !!(a && ROLES[a.role] && !(a.until && new Date(a.until) < new Date()));
  return { email: user.email, owner, role: live ? a.role : "", center: live ? a.center || "" : "", grants: live && a.role === "special" ? grantsForPages(a.pages) : [] };
}
const signedIn = () => { if (!user) throw err("not signed in", "unauthenticated"); };
const ownerOnly = () => { signedIn(); if (!who().owner) throw err("only the hub's owner can do that"); };

// ---------------------------------------------------------------- the same functions as lead-fb.js
export const configured = () => true;
export async function init() {
  if (P.has("reset") || !load()) {
    seed();
    if (P.has("reset")) { P.delete("reset"); history.replaceState(null, "", location.pathname + "?" + P.toString().replace(/=(?=&|$)/g, "")); }
  }
  ensurePersona(); save();
  if (AS !== "out" && !sessionStorage.getItem(OUTKEY)) user = { email: EMAIL, name: NAME, photo: "", verified: true };
}
export function onUser(cb) { userCbs.push(cb); later(() => cb(user)); return () => {}; }
const setUser = u => { user = u; if (u) sessionStorage.removeItem(OUTKEY); else sessionStorage.setItem(OUTKEY, "1"); userCbs.forEach(cb => later(() => cb(user))); return user; };
export async function setShared() { /* nothing to remember offline */ }
export async function signInGoogle() { return setUser({ email: EMAIL, name: NAME, photo: "", verified: true }); }
export async function sendLink(email) { sessionStorage.setItem(LINKKEY, email); }
export const isLink = () => P.has("link");
export const savedLinkEmail = () => sessionStorage.getItem(LINKKEY) || "";
export async function finishLink(email) {
  sessionStorage.removeItem(LINKKEY);
  P.delete("link"); history.replaceState(null, "", location.pathname + "?" + P.toString().replace(/=(?=&|$)/g, ""));
  return setUser({ email: String(email).toLowerCase(), name: "", photo: "", verified: true });
}
export async function signOut() { setUser(null); }

export async function getOwner() { if (!user) return null; return clone(col("system").get("owner")) || null; }
export async function getAccess(email) {
  if (!user || (email !== user.email && !who().owner)) return null;
  return clone(col("access").get(email)) || null;
}
export function watchAccess(email, cb) {
  const l = { col: "access", run: () => cb(user && (email === user.email || who().owner) ? clone(col("access").get(email)) || null : null) };
  listeners.add(l); later(l.run); return () => listeners.delete(l);
}
export async function claimOwner({ email, name, center }) {
  signedIn();
  if (col("system").has("owner")) throw err("someone already owns this hub");
  if (email !== user.email) throw err("you can only claim the hub for yourself");
  col("access").set(email, { email, name, role: "asst", title: "Assistant Coordinator", center, viewCenters: [], at: new Date().toISOString(), by: email });
  col("system").set("owner", { email, at: new Date().toISOString() });
  changed("access"); changed("system");
}
export async function updateMyAccess(email, patch) {
  signedIn();
  const a = col("access").get(email);
  if (!a) throw err("no access entry for " + email, "not-found");
  if (!who().owner) {
    if (email !== user.email) throw err("you can only change your own entry");
    const ok = ["viewCenters", "center"];
    if (Object.keys(patch).some(k => !ok.includes(k))) throw err("you can only change your center (once) and which centers you look at");
    if ("viewCenters" in patch && !(Array.isArray(patch.viewCenters) && patch.viewCenters.length <= 7)) throw err("pick up to 7 centers");
    if ("center" in patch) {
      if (a.center) throw err("your center is already set; ask the hub's owner to change it");
      const lead = !!(ROLES[a.role] || {}).lead;
      if (!(CENTER_IDS.includes(patch.center) || (lead && patch.center === "all"))) throw err("that isn't one of the centers");
    }
  }
  Object.assign(a, clone(patch)); changed("access");
}
export async function upsertRequest({ email, name, photo }) {
  signedIn(); if (email !== user.email) throw err("you can only ask for yourself");
  col("requests").set(email, { email, googleName: name || "", photo: photo || "", at: new Date().toISOString() }); changed("requests");
}
export async function getRefIndex() { if (!user) return { sets: {} }; return clone(col("system").get("refindex")) || { sets: {} }; }
export async function loadTier(tier, center, parts) {
  if (!tierAllowed(tier, center, who())) throw err(`${tier} data for ${center} isn't open to this level`);
  let s = ""; for (let i = 0; i < parts; i++) s += (col("ref").get(`${tier}~${center}~${i}`) || {}).json || "";
  return JSON.parse(s || "{}");
}

export function backend() {
  return {
    listen(name, filters, onDocs, onErr) {
      const l = { col: name, run: () => {
        const ctx = who();
        const hits = [...col(name)].filter(([, d]) => matches(d, filters));
        const bad = hits.find(([, d]) => !ruleRead(name, d, ctx));
        if (bad) { listeners.delete(l); console.warn("[offline] refused query", name, JSON.stringify(filters), "because of", bad[0]); if (onErr) onErr(err(`a query on ${name} would be refused`)); return; }
        onDocs(hits.map(([id, d]) => ({ id, data: clone(d) })));
      } };
      listeners.add(l); later(l.run); return () => listeners.delete(l);
    },
    listenDoc(name, id, onDoc, onErr) {
      const l = { col: name, run: () => {
        const ctx = who(), d = col(name).get(id);
        const allowed = d ? ruleRead(name, d, ctx) : (ctx.owner || (!!ctx.role && name !== "private"));
        if (!allowed) { listeners.delete(l); if (onErr) onErr(err(`reading ${name}/${id} would be refused`)); return; }
        onDoc({ id, exists: !!d, data: clone(d) });
      } };
      listeners.add(l); later(l.run); return () => listeners.delete(l);
    },
    async set(name, id, d) {
      const ctx = who(), old = col(name).get(id);
      if (!ruleWrite(name, d, ctx) || (old && !ruleWrite(name, old, ctx))) throw err(`saving ${name}/${id} would be refused`);
      col(name).set(id, clone(d)); changed(name);
    },
    async del(name, id) {
      const ctx = who(), old = col(name).get(id);
      if (old && !ruleWrite(name, old, ctx)) throw err(`deleting ${name}/${id} would be refused`);
      if (!old && !ctx.owner && !ctx.role) throw err(`deleting ${name}/${id} would be refused`);
      col(name).delete(id); changed(name);
    },
    async get(name, id) {
      const d = col(name).get(id);
      if (d && !ruleRead(name, d, who())) throw err(`reading ${name}/${id} would be refused`);
      return { id, exists: !!d, data: clone(d) };
    },
  };
}

// ---------------------------------------------------------------- owner page
export async function listCol(c) { ownerOnly(); return [...col(c)].map(([id, d]) => ({ id, ...clone(d) })); }
export async function setRaw(c, id, d, merge) { ownerOnly(); col(c).set(id, merge ? { ...(col(c).get(id) || {}), ...clone(d) } : clone(d)); changed(c); }
export async function delRaw(c, id) { ownerOnly(); col(c).delete(id); changed(c); }
export async function writeMany(ops, onProgress) {
  ownerOnly();
  ops.forEach((o, i) => {
    if (o.op === "del") col(o.col).delete(o.id); else col(o.col).set(o.id, clone(o.data));
    if (onProgress && (i % 200 === 199 || i === ops.length - 1)) onProgress(i + 1, ops.length);
  });
  new Set(ops.map(o => o.col)).forEach(changed);
}
export const stamp = () => new Date().toISOString();
export const when = date => date.toISOString();
export const toDate = t => (t instanceof Date ? t : typeof t === "string" ? new Date(t) : t && typeof t.toDate === "function" ? t.toDate() : null);
export const RESERVED_COLLECTIONS = RESERVED;
