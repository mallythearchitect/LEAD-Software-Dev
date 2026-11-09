/* LEAD — team edition: the shared rules.
   Levels, centers, who can read and write what, name matching, and the data layer that
   connects the hub to a database. No Firebase and no personal data in here, so the same
   logic runs against Firebase (lead-fb.js) and the offline test double (dev/mock-fb.js).
   firestore.rules enforces the same permissions on the server; keep the two in step. */

// ---------------------------------------------------------------- centers
export const CENTERS = [
  { id: "east-hartford", name: "East Hartford", full: "Greater Hartford (East Hartford)", city: "East Hartford, CT", ll: [41.7823, -72.612] },
  { id: "new-britain", name: "New Britain", full: "New Britain", city: "New Britain, CT", ll: [41.6612, -72.7795] },
  { id: "waterbury", name: "Waterbury", full: "Waterbury", city: "Waterbury, CT", ll: [41.5582, -73.0515] },
  { id: "danbury", name: "Danbury", full: "Danbury", city: "Danbury, CT", ll: [41.3948, -73.454] },
  { id: "bridgeport", name: "Bridgeport", full: "Bridgeport", city: "Bridgeport, CT", ll: [41.1865, -73.1952] },
  { id: "new-haven", name: "New Haven", full: "New Haven", city: "New Haven, CT", ll: [41.3083, -72.9279] },
  { id: "norwich", name: "Norwich", full: "Norwich", city: "Norwich, CT", ll: [41.5243, -72.0759] },
];
export const CENTER_IDS = CENTERS.map(c => c.id);
export const centerName = id => id === "all" ? "All centers" : (CENTERS.find(c => c.id === id) || {}).name || id || "";

// ---------------------------------------------------------------- levels
// lead: sees every center and picks which ones to look at. views: the hub views this level may use, default first.
export const ROLES = {
  exec: { label: "Executive", lead: true, views: ["exec", "coord", "asst", "canv"] },
  coord: { label: "Coordinator", lead: true, views: ["coord", "asst", "canv"] },
  asst: { label: "Assistant Coordinator", views: ["asst", "canv"] },
  special: { label: "Special Assignment", views: ["special"] },
  canv: { label: "Canvasser", views: ["canv"] },
  trial: { label: "Trial", views: ["trial"] },
};
export const ROLE_ORDER = ["exec", "coord", "asst", "special", "canv", "trial"];
export const OWNER_VIEWS = ["asst", "coord", "exec", "canv", "trial"];
export const roleLabel = r => (ROLES[r] || {}).label || r || "";
export const TRIAL_DAYS = 30;

// Pages a Special Assignment can be given, and the data each needs.
export const PAGES = [
  ["today", "Today"], ["tasks", "Tasks"], ["people", "People & orgs", "contacts"], ["events", "Events"],
  ["ready", "Event readiness"], ["proposals", "Proposals"], ["blead", "B-LEAD deep dive", "contacts"],
  ["map", "Map", "contacts"], ["team", "Canvass", "canvass"], ["letters", "Letters", "contacts"],
  ["board", "Board of Champions", "contacts"], ["center", "EH Center", "contacts"], ["playbook", "Playbook"],
  ["org", "Who's who", "contacts"], ["cultures", "Cultures"], ["meetings", "Meetings"],
  ["programs", "Programs & videos"], ["sig", "Email signature"],
];
export const grantsForPages = pages => [...new Set((pages || []).map(p => (PAGES.find(x => x[0] === p) || [])[2]).filter(Boolean))];

// ---------------------------------------------------------------- collections
export const SCOPED = ["tasks", "due", "edits", "added", "people", "board", "letters", "ready", "proposals", "meetings", "team", "shifts", "signers"];
export const ORGWIDE = ["playbook", "questions", "videos", "sessions", "meta", "geo", "cv"];
export const CANVASS = ["team", "shifts", "signers"];
export const CONTACTS = ["edits", "added", "people", "board", "letters"];
export const WORK = ["tasks", "due", "ready", "proposals", "meetings"];
export const OWNED = ["shifts", "signers"];           // a trial sees only the ones they logged
export const LEADS_ONLY = ["meta", "cv"];             // goals and settings: coordinators, executives, the owner
export const RESERVED = ["access", "system", "roster", "requests", "ref", "presence", "directory", "messages", "feedback", "codes", "activity"];
export const PERSONAL = "ptasks";                     // everyone's own "My role" tasks
export const PERSONAL_HOURS = "phours";               // everyone's own hours (the owner's stay in hours)
export const PRIVATE_SETTINGS = ["rate", "invoicedThrough", "nextInvoiceNo"];
export const TIERS = ["core", "canvass", "contacts"];

/* ctx: { email, role, owner, center, grants, viewCenters }
   These mirror firestore.rules. The offline test double uses them to refuse what the
   server would refuse, so a wrong query shows up in testing instead of in production. */
const inMine = (d, ctx) => !!ctx.center && (d.center === ctx.center || d.center === "all");
const isLead = ctx => !!(ROLES[ctx.role] || {}).lead;
const has = (ctx, g) => ctx.role === "special" && (ctx.grants || []).includes(g);

export function ruleRead(col, d, ctx) {
  if (RESERVED.includes(col)) return false;
  if (ctx.owner) return true;
  if (!ctx.role) return false;
  if (ORGWIDE.includes(col)) return true;
  if (col === PERSONAL || col === PERSONAL_HOURS) return d._owner === ctx.email;
  if (!SCOPED.includes(col)) return false;                       // hours, log, private: owner only
  if (isLead(ctx)) return true;
  if (ctx.role === "asst") return inMine(d, ctx);
  if (col === "added" && d.kind === "event" && inMine(d, ctx)) return true;
  if (CANVASS.includes(col) && (ctx.role === "canv" || has(ctx, "canvass"))) return inMine(d, ctx);
  if (CONTACTS.includes(col) && has(ctx, "contacts")) return inMine(d, ctx);
  if (WORK.includes(col) && ctx.role === "special") return inMine(d, ctx);
  if (OWNED.includes(col) && ctx.role === "trial") return d._by === ctx.email;
  return false;
}

export function ruleWrite(col, d, ctx) {
  if (RESERVED.includes(col)) return false;
  if (ctx.owner) return true;
  if (!ctx.role) return false;
  const staff = ["exec", "coord", "asst"].includes(ctx.role);
  if (LEADS_ONLY.includes(col)) return isLead(ctx);                 // org-wide goals and settings
  if (ORGWIDE.includes(col)) return staff || col === "questions" || (col === "geo" && ["canv", "special"].includes(ctx.role));
  if (col === PERSONAL || col === PERSONAL_HOURS) return d._owner === ctx.email;
  if (!SCOPED.includes(col)) return false;
  const mine = d.center === ctx.center && !!ctx.center;
  if (isLead(ctx)) return CENTER_IDS.includes(d.center) || d.center === "all";
  if (ctx.role === "asst") return mine;
  if (CANVASS.includes(col) && has(ctx, "canvass")) return mine;
  if (CONTACTS.includes(col) && has(ctx, "contacts")) return mine;
  if (WORK.includes(col) && ctx.role === "special") return mine;
  // canvassers and trials log their own shifts and signers, and change only those
  if (OWNED.includes(col) && (ctx.role === "canv" || ctx.role === "trial")) return mine && d._by === ctx.email;
  return false;
}

export function tierAllowed(tier, center, ctx) {
  if (ctx.owner) return true;
  if (!ctx.role) return false;
  if (!(center === "all" || isLead(ctx) || center === ctx.center)) return false;
  if (tier === "core") return true;
  const staff = ["exec", "coord", "asst"].includes(ctx.role);
  if (tier === "canvass") return staff || ctx.role === "canv" || has(ctx, "canvass");
  if (tier === "contacts") return staff || has(ctx, "contacts");
  return false;
}

/* The queries one person runs for a collection. Each inner array is one query's filters;
   null means this person can't read it at all. Every query is built so the server can prove
   from its filters alone that each result is allowed, which is what Firestore requires. */
export function listenPlan(col, ctx) {
  if (RESERVED.includes(col)) return null;
  if (col === PERSONAL || col === PERSONAL_HOURS) return [[["_owner", "==", ctx.email]]];
  if (ctx.owner) return [[]];
  if (ORGWIDE.includes(col)) return [[]];
  if (!SCOPED.includes(col)) return null;
  if (isLead(ctx)) return [[]];
  const byCenter = extra => [[...extra, ["center", "==", ctx.center]], [...extra, ["center", "==", "all"]]];
  if (!ctx.center) return null;
  if (ctx.role === "asst") return byCenter([]);
  if (CANVASS.includes(col) && (ctx.role === "canv" || has(ctx, "canvass"))) return byCenter([]);
  if (CONTACTS.includes(col) && has(ctx, "contacts")) return byCenter([]);
  if (WORK.includes(col) && ctx.role === "special") return byCenter([]);
  if (OWNED.includes(col) && ctx.role === "trial") return [[["_by", "==", ctx.email]]];
  if (col === "added") return byCenter([["kind", "==", "event"]]);
  return null;
}

export const matches = (d, filters) => filters.every(([f, op, v]) => op === "==" ? d[f] === v : true);

// ---------------------------------------------------------------- name matching
export function normName(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z\s'-]/g, " ").replace(/'/g, "").replace(/-/g, " ").replace(/\s+/g, " ").trim();   // O'Neil → oneil; Santos-Lopez → santos lopez
}
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const sim = (a, b) => (a && b) ? 1 - lev(a, b) / Math.max(a.length, b.length) : 0;

/* How closely a Google account's name matches a roster name, 0 to 1.
   "Jordan Rivera" vs "Jordan Rivera" = 1; "Jordyn R." vs "Jordan Rivera" ≈ .92; "Maya Santos" vs "Maya Santos-Lopez" = .95;
   "Lucas Pereira" vs a roster line of just "Lucas" = .8 (a maybe: there could be two). */
export function nameScore(given, roster) {
  const a = normName(given), b = normName(roster);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ta = a.split(" "), tb = b.split(" ");
  let best = sim(a, b) >= 0.85 ? 0.85 : 0;
  const covers = (x, y) => y.every(t => x.some(u => u === t || (t.length > 3 && sim(u, t) >= 0.8)));
  if (covers(ta, tb) || covers(tb, ta)) best = Math.max(best, Math.min(ta.length, tb.length) >= 2 ? 0.95 : 0.8);
  // A short name on the list ("Shaq", "Fabi") that starts a longer Google name: a maybe, never a sure match.
  const nick = (x, y) => y.every(t => x.some(u => u === t || (t.length >= 3 && u.startsWith(t)) || (t.length > 3 && sim(u, t) >= 0.8)));
  if (nick(ta, tb) || nick(tb, ta)) best = Math.max(best, 0.8);
  const f = sim(ta[0], tb[0]);
  if (f >= 0.8) {
    let s = 0.55 + 0.2 * f;
    if (ta.length > 1 && tb.length > 1) {
      const la = ta[ta.length - 1], lb = tb[tb.length - 1];
      s += (sim(la, lb) >= 0.75 || la[0] === lb[0] && la.length <= 2) ? 0.2 : -0.25;
    }
    best = Math.max(best, s);
  }
  return Math.max(0, Math.min(1, best));
}
export function rosterMatches(given, roster) {
  return roster.map(r => ({ r, score: nameScore(given, r.name) }))
    .filter(x => x.score >= 0.6).sort((x, y) => y.score - x.score);
}

// ---------------------------------------------------------------- base data (the hub's built-in lists)
const blankLT = () => ({ goal: 0, gala: "", phases: [], built: "", zones: [], help: [], letter_body: "", verified: 0, unverified: 0,
  letter_head: "[Organization Letterhead, if applicable]", letter_sign: "Sincerely,\n\n[Your Name]\n\n[Your Title / Organization]" });
const blankBLmeta = () => ({ built: "", leads_new: 0, leads_enriched: 0, events: 0, visits: 0, poc_edu: 0, lanes: {}, gaps: [] });
const DAY = 864e5;
const isoDay = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
/* The Letters page draws a timeline of at least two phases. When the loaded data has none, use a plain
   ask → follow up → collect plan that ends on the gala date. */
function defaultPhases(gala) {
  const now = new Date(); now.setHours(12, 0, 0, 0);
  const end = gala ? new Date(gala + "T12:00:00") : new Date(now.getTime() + 34 * DAY);
  const span = Math.max(14 * DAY, end - now);
  const a = now.getTime() - 5 * DAY, b = now.getTime() + span * 0.3, c = now.getTime() + span * 0.7;
  return [
    { from: isoDay(a), to: isoDay(b), label: "Ask in person and online", short: "Ask: field + online", tiny: "Ask" },
    { from: isoDay(b), to: isoDay(c), label: "Follow up on replies and send letters by email", short: "Follow up", tiny: "Follow-up" },
    { from: isoDay(c), to: isoDay(end), label: "Collect signed letters", short: "Collect + close", tiny: "Collect" },
  ];
}

/* Put the per-center data sets together into the globals the hub expects (REF, CV, LT, BL, EV_NEW).
   tiers: [{tier, center, data}] already limited to what this person may read and wants to see. */
export function assembleData(tiers, ctx) {
  const D = {
    REF: { TARGETS: [], EVENTS: [], MEETINGS: [], SCHOOLS: [], CENTROIDS: {}, FACTS: [], BOARD: { invite: [], flyer: [] } },
    CV: { orgs: [], centers: CENTERS.map(c => ({ id: c.id, name: c.full + " Center", short: c.name, city: c.city, lead: "", active: true })), spots: [], sheets: {}, signers: [] },
    LT: { meta: null, contacts: [] },
    BL: { leads: [], patch: {}, events: [], centroids: {}, meta: null },
    EV_NEW: [], CENTER: {}, SEED: null,
  };
  for (const c of CENTERS) { D.REF.CENTROIDS[c.city.replace(/, CT$/, "")] = c.ll; }
  const stamp = (arr, center) => (arr || []).map(x => (x && typeof x === "object" && !x.center) ? { ...x, center } : x);
  const factTitles = new Set();
  for (const { tier, center, data } of tiers) {
    if (!data) continue;
    if (tier === "core") {
      const R = data.REF || {};
      D.REF.EVENTS.push(...stamp(R.EVENTS, center));
      D.REF.MEETINGS.push(...stamp(R.MEETINGS, center));
      D.REF.SCHOOLS.push(...stamp(R.SCHOOLS, center));
      Object.assign(D.REF.CENTROIDS, R.CENTROIDS || {});
      for (const f of R.FACTS || []) if (!factTitles.has(f.title)) { factTitles.add(f.title); D.REF.FACTS.push(f); }
      D.EV_NEW.push(...stamp(data.EV_NEW, center));
      const B = data.BL || {};
      D.BL.events.push(...stamp(B.events, center));
      Object.assign(D.BL.centroids, B.centroids || {});
      if (!D.BL.meta && B.meta) D.BL.meta = B.meta;
      if (!D.LT.meta && data.LT_meta) D.LT.meta = data.LT_meta;
      const C = data.CV || {};
      for (const o of C.orgs || []) if (!D.CV.orgs.some(x => x.id === o.id)) D.CV.orgs.push(o);
      D.CV.spots.push(...(C.spots || []));
      Object.assign(D.CV.sheets, C.sheets || {});
    } else if (tier === "canvass") {
      D.CV.signers.push(...stamp(data.CV_signers, center));
    } else if (tier === "contacts") {
      D.REF.TARGETS.push(...stamp(data.REF_TARGETS, center));
      const Bd = data.REF_BOARD || {};
      D.REF.BOARD.invite.push(...stamp(Bd.invite, center));
      D.REF.BOARD.flyer.push(...stamp(Bd.flyer, center));
      D.BL.leads.push(...stamp(data.BL_leads, center));
      Object.assign(D.BL.patch, data.BL_patch || {});
      D.LT.contacts.push(...stamp(data.LT_contacts, center));
      if (data.CENTER && (center === ctx.center || !Object.keys(D.CENTER).length)) D.CENTER = { ...data.CENTER };
    }
  }
  D.LT.meta = { ...blankLT(), ...(D.LT.meta || {}) };
  if (!D.LT.meta.gala) D.LT.meta.gala = isoDay(Date.now() + 34 * DAY);
  if (!Array.isArray(D.LT.meta.phases) || D.LT.meta.phases.length < 2) D.LT.meta.phases = defaultPhases(D.LT.meta.gala);
  D.BL.meta = { ...blankBLmeta(), ...(D.BL.meta || {}) };
  if (!D.CV.orgs.length) D.CV.orgs.push({ id: "campaign", name: "Petition", short: "Petition", city: "Connecticut", goal: 500, color: "#2f6fe0", desc: "Signature campaign.", active: true, primary: true });
  const rc = new Map();
  for (const arr of [D.REF.TARGETS, D.REF.EVENTS, D.BL.leads, D.BL.events, D.EV_NEW, D.LT.contacts, D.CV.signers])
    for (const x of arr) if (x && x.id && x.center) rc.set(x.id, x.center);
  D.recordCenters = rc;
  return D;
}

// ---------------------------------------------------------------- the hub's database, on top of a backend
/* backend: { listen(col, filters, onDocs, onErr) -> unsub, listenDoc(col, id, onDoc, onErr) -> unsub,
              set(col, id, data) -> Promise, del(col, id) -> Promise, get(col, id) -> Promise<{id, exists, data}> }
   Returns the small collection/doc API the hub already uses (the same shape as its local and claude.ai stores). */
export function makeHubDB(backend, ctx, recordCenters) {
  const cache = {};                                  // col -> Map(id -> data), from what this person can see
  const C = col => (cache[col] = cache[col] || new Map());
  const lead = isLead(ctx);
  const view = new Set(ctx.viewCenters && ctx.viewCenters.length ? ctx.viewCenters : []);
  const inView = d => !lead && !ctx.owner ? true : (!view.size || !d.center || d.center === "all" || view.has(d.center));
  const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(15)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  const clean = d => JSON.parse(JSON.stringify(d === undefined ? {} : d));
  const snapOf = docs => ({ docs: docs.map(([id, d]) => ({ id, exists: true, data: () => d })), size: docs.length, empty: !docs.length });
  const isMockTask = (id, d) => !!(d && d.demo) || /^[a-z]{2}-tk\d+$/.test(id);
  function starterTasks(center) {
    const day = n => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
    return [["Confirm tabling spot for the resource fair", "Events", "todo", 1], ["Follow up with two Board of Champions invitees", "Board of Champions", "doing", 3],
      ["Drop flyers at three barber shops", "B-LEAD", "todo", 2], ["Call the parent group about the info night", "Charters & leaders", "waiting", 5], ["Order more clipboards and pens", "Other", "todo", 7]]
      .map(([title, section, status, n], i) => [`${center}-starter${i + 1}`, { title, section, status, due: day(n), priority: i ? "Medium" : "High", notes: "A starter task (made up). Move it or finish it; it saves as yours.", createdAt: day(0), repeat: "", dow: 4, doneOn: "", fixed: false, demo: true, center }]);
  }

  function recordCenter(id) {
    if (recordCenters && recordCenters.has(id)) return recordCenters.get(id);
    const a = C("added").get(id); return a && a.center;
  }
  function homeCenter() {
    if (!lead && !ctx.owner) return ctx.center;
    if (view.size === 1) return [...view][0];
    if (ctx.center && (!view.size || view.has(ctx.center))) return ctx.center;
    return view.size ? [...view][0] : (ctx.center || "all");
  }
  function stampCenter(col, id, d) {
    if (!lead && !ctx.owner) return ctx.center;                     // everyone else writes only to their own center
    const had = C(col).get(id);
    if (had && had.center) return had.center;
    if ((col === "edits" || col === "geo") && recordCenter(id)) return recordCenter(id);
    if (col === "signers" && d.c) { const t = C("team").get(d.c); if (t && t.center) return t.center; }
    if (d.center && (CENTER_IDS.includes(d.center) || d.center === "all")) return d.center;
    return homeCenter();
  }

  // live view of one collection = the union of its queries, kept fresh as each one changes
  function listenOne(col, emit, onErr) {
    const plan = listenPlan(col, ctx);
    if (!plan) { setTimeout(() => emit(new Map()), 0); return () => {}; }
    const parts = plan.map(() => null);
    const unsubs = plan.map((filters, i) => backend.listen(col, filters, docs => {
      parts[i] = docs;
      if (parts.some(p => p === null)) return;
      const m = new Map();
      for (const p of parts) for (const { id, data } of p) m.set(id, data);
      emit(m);
    }, onErr));
    return () => unsubs.forEach(u => u && u());
  }
  function listenCollection(col, next, onErr) {
    const err = e => { if (onErr) onErr(e); };
    if (col === "tasks") {                                         // shared tasks + my own "My role" tasks
      let shared = null, mine = null;
      const out = () => {
        if (!shared || !mine) return;
        cache.tasks = shared; cache[PERSONAL] = mine;
        // the shared list is written only by the owner: the owner sees their own tasks and never the mock ones;
        // everyone else sees only the mock tasks (demo: true, or the made-up ids), never the owner's
        const team = [...shared].filter(([id, d]) => inView(d) && (ctx.owner ? !isMockTask(id, d) : isMockTask(id, d)));
        const all = [...team, ...mine];
        // a center with no mock tasks yet still gives everyone else a starter list (not saved; a move saves a personal copy)
        if (!ctx.owner && ctx.center && !team.some(([, d]) => d.center === ctx.center)) {
          const have = new Set([...mine].map(([id]) => id));
          for (const [id, d] of starterTasks(ctx.center)) if (!have.has(id)) all.push([id, d]);
        }
        next(snapOf(all));
      };
      const u1 = listenOne("tasks", m => { shared = m; out(); }, err);
      const u2 = listenOne(PERSONAL, m => { mine = m; out(); }, err);
      return () => { u1(); u2(); };
    }
    if (col === "hours" && !ctx.owner) return listenOne(PERSONAL_HOURS, m => { cache[PERSONAL_HOURS] = m; next(snapOf([...m])); }, err);
    return listenOne(col, m => { cache[col] = m; next(snapOf([...m].filter(([, d]) => inView(d)))); }, err);
  }

  async function setDoc(col, id, data) {
    let d = clean(data);
    if (col === "tasks") {
      if (d.section === "My role") {
        delete d.center; d._owner = ctx.email;
        await backend.set(PERSONAL, id, d);
        if (C("tasks").has(id)) await backend.del("tasks", id);
        return;
      }
      delete d._owner;
      d.center = stampCenter("tasks", id, d);
      await backend.set("tasks", id, d);
      if (C(PERSONAL).has(id)) await backend.del(PERSONAL, id);
      return;
    }
    if (col === "hours" && !ctx.owner) { d._owner = ctx.email; await backend.set(PERSONAL_HOURS, id, d); return; }
    if (col === "meta" && id === "settings") {
      const priv = {};
      for (const k of PRIVATE_SETTINGS) if (k in d) { priv[k] = d[k]; delete d[k]; }
      if (ctx.owner && Object.keys(priv).length) await backend.set("private", "settings", priv);
    }
    if (SCOPED.includes(col)) {
      d.center = stampCenter(col, id, d);
      if (OWNED.includes(col)) { const had = C(col).get(id); d._by = (had && had._by) || d._by || ctx.email; }
    }
    await backend.set(col, id, d);
  }
  async function delDoc(col, id) {
    if (col === "hours" && !ctx.owner) return backend.del(PERSONAL_HOURS, id);
    if (col === "tasks") {
      if (C(PERSONAL).has(id)) return backend.del(PERSONAL, id);
      return backend.del("tasks", id);
    }
    return backend.del(col, id);
  }
  function docRef(col, id) {
    return {
      id, path: col + "/" + id,
      set: d => setDoc(col, id, d),
      delete: () => delDoc(col, id),
      get: async () => {
        if (col === "tasks" && C(PERSONAL).has(id)) return wrap(id, C(PERSONAL).get(id));
        const cached = C(col).get(id); if (cached) return wrap(id, cached);
        try { const r = await backend.get(col, id); return wrap(id, r.exists ? r.data : undefined); }
        catch (e) { return wrap(id, undefined); }
      },
      onSnapshot: (next, onErr) => {
        if (col === "meta" && id === "settings" && ctx.owner) {        // the owner also sees their private invoice settings
          let pub, priv = {}, s1 = false, s2 = false;
          const out = () => { if (s1 && s2) next(wrap(id, pub ? { ...pub, ...priv } : undefined)); };
          const u1 = backend.listenDoc("meta", "settings", r => { pub = r.exists ? r.data : undefined; s1 = true; out(); }, onErr);
          const u2 = backend.listenDoc("private", "settings", r => { priv = r.exists ? r.data : {}; s2 = true; out(); }, onErr);
          return () => { u1(); u2(); };
        }
        if (!ORGWIDE.includes(col) && !ctx.owner && !(listenPlan(col, ctx))) { setTimeout(() => next(wrap(id, undefined)), 0); return () => {}; }
        return backend.listenDoc(col, id, r => next(wrap(id, r.exists ? r.data : undefined)), onErr);
      },
    };
  }
  const wrap = (id, d) => ({ id, exists: d !== undefined, data: () => d });

  return {
    collection: c => ({
      doc: id => docRef(c, id || newId()),
      add: async d => { const r = docRef(c, newId()); await r.set(d); return r; },
      onSnapshot: (next, err) => listenCollection(c, next, err),
    }),
    doc: path => { const [c, id] = String(path).split("/"); return docRef(c, id); },
  };
}

// ---------------------------------------------------------------- bundles (demo data, imports)
/* A bundle is { kind: "lead-hub-bundle", tiers: [{tier, center, data}], docs: {col: {id: doc}} }.
   Splitting a data set into pieces small enough for one database document each (under 1 MB). */
export function chunkJSON(obj, maxBytes = 700000) {
  const s = JSON.stringify(obj), enc = new TextEncoder(), parts = [];
  let i = 0, step = 300000;
  while (i < s.length) {
    let j = Math.min(s.length, i + step);
    while (enc.encode(s.slice(i, j)).length > maxBytes) j = i + Math.floor((j - i) / 2);
    parts.push(s.slice(i, j)); i = j;
  }
  return parts.length ? parts : ["{}"];
}
export const refId = (tier, center, part) => `${tier}~${center}~${part}`;

/* The writes that load a bundle. Loading replaces each tier+center set it carries (so loading your
   own Hartford data later swaps out the demo Hartford set) and adds or overwrites its saved records.
   index: the current system/refindex document. Returns { ops, index }. */
export function bundleOps(bundle, index, ownerEmail, at) {
  const ops = [], sets = { ...((index && index.sets) || {}) };
  for (const { tier, center, data } of bundle.tiers || []) {
    if (!TIERS.includes(tier)) continue;
    const key = `${tier}~${center}`, parts = chunkJSON(data);
    parts.forEach((json, i) => ops.push({ op: "set", col: "ref", id: refId(tier, center, i), data: { tier, center, part: i, parts: parts.length, json } }));
    const old = sets[key];
    if (old && old.parts > parts.length) for (let i = parts.length; i < old.parts; i++) ops.push({ op: "del", col: "ref", id: refId(tier, center, i) });
    sets[key] = { tier, center, parts: parts.length, label: bundle.label || "", at };
  }
  let skipped = 0;
  for (const [col, items] of Object.entries(bundle.docs || {})) {
    if (RESERVED.includes(col)) { skipped += Object.keys(items).length; continue; }
    for (const [id, d] of Object.entries(items)) {
      if (col === "cv" && id === "centers") { skipped++; continue; }          // the center list comes from CENTERS
      const doc = { ...d };
      if (doc._owner === "@OWNER") doc._owner = ownerEmail;
      ops.push({ op: "set", col, id, data: doc });
    }
  }
  const next = { ...(index || {}), sets };
  ops.push({ op: "set", col: "system", id: "refindex", data: next });
  return { ops, index: next, skipped };
}

/* The writes that remove what a bundle added (used to take the demo data back out). */
export function unbundleOps(bundle, index) {
  const ops = [], sets = { ...((index && index.sets) || {}) };
  for (const { tier, center } of bundle.tiers || []) {
    const key = `${tier}~${center}`, old = sets[key];
    if (!old || old.label !== bundle.label) continue;                         // only sets this bundle put there
    for (let i = 0; i < old.parts; i++) ops.push({ op: "del", col: "ref", id: refId(tier, center, i) });
    delete sets[key];
  }
  for (const [col, items] of Object.entries(bundle.docs || {}))
    for (const id of Object.keys(items)) if (!RESERVED.includes(col)) ops.push({ op: "del", col, id });
  const next = { ...(index || {}), sets };
  ops.push({ op: "set", col: "system", id: "refindex", data: next });
  return { ops, index: next };
}
