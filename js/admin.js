/* LEAD — owner page.
   Let people in (with a suggestion from the name list), set each person's level and center, keep
   the name list, and load or remove data sets. Only the hub's owner can use it; firestore.rules
   refuses everyone else, so this page is a convenience, not the lock. */
import { CENTERS, ROLES, ROLE_ORDER, roleLabel, centerName, PAGES, TRIAL_DAYS, rosterMatches, nameScore, bundleOps, unbundleOps, refId, SCOPED, ORGWIDE, PERSONAL, FEEDBACK_FORMS } from "./lead-core.js";
import { demoBundle, DEMO_OTHERS_LABEL } from "./demo-data.js";
import { isUnlocked, lockAgain } from "./lock.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const HOST = location.hostname;
const LOCAL_HOST = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(HOST) || HOST.endsWith(".localhost");
const OFFLINE = LOCAL_HOST && new URLSearchParams(location.search).has("offline");
const keep = () => (OFFLINE ? location.search : "");
const DEMO_LABEL = demoBundle(new Date(2026, 0, 1)).label;
const DEFAULT_PAGES = ["today", "events", "playbook"];
const STRONG = 0.85;
const TITLED = ["exec", "coord", "asst", "canv"];
let FBX, me = null, current;
const S = { tab: "wait", requests: [], access: [], roster: [], index: { sets: {} }, file: null, busy: false, codes: [], ai: null };
try { const t = localStorage.getItem("lead_hub_theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) { /* none saved */ }

// ---------------------------------------------------------------- helpers
const main = html => { $("#main").innerHTML = html; };
function toast(text) {
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3800);
}
const initials = s => String(s || "").replace(/\([^)]*\)/g, " ").split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
const avatar = (photo, name) => `<span class="av">${photo ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer">` : esc(initials(name))}</span>`;
const toDate = t => (FBX && t ? FBX.toDate(t) : null);
function ago(t) {
  const d = toDate(t); if (!d || isNaN(d)) return "";
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
const isoDate = d => d && !isNaN(d) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";
const fmtDate = d => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
const validEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const lead = role => !!(ROLES[role] || {}).lead;
function denied(e) {
  if (e && e.code === "permission-denied") return "Firebase said no. Check that the rules from firestore.rules are published (Firebase console → Firestore → Rules).";
  return (e && e.message) || String(e);
}
async function busy(btn, work) {
  if (S.busy) return; S.busy = true;
  const label = btn ? btn.textContent : ""; if (btn) { btn.disabled = true; btn.textContent = "Working…"; }
  try { await work(); }
  catch (e) { console.error(e); toast(denied(e)); }
  finally { S.busy = false; if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = label; } }
}

// ---------------------------------------------------------------- the person form (used for letting in, adding and changing)
function centerOptions(sel, role) {
  return `<option value="" ${!sel ? "selected" : ""}>Let them pick</option>`
    + CENTERS.map(c => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")
    + `<option value="all" ${sel === "all" ? "selected" : ""} ${lead(role) ? "" : "disabled"}>All centers (coordinators and up)</option>`;
}
function personForm(v) {
  const role = v.role || "trial";
  return `<div data-pf>
    <div class="grid">
      ${v.withEmail ? `<div><label class="f">Email they sign in with</label><input type="email" data-k="email" placeholder="name@example.com" value="${esc(v.email || "")}"></div>` : ""}
      <div><label class="f">Name</label><input type="text" data-k="name" value="${esc(v.name || "")}"></div>
      <div><label class="f">Level</label><select data-k="role">${ROLE_ORDER.map(r => `<option value="${r}" ${r === role ? "selected" : ""}>${esc(roleLabel(r))}</option>`).join("")}</select></div>
      <div><label class="f">Center</label><select data-k="center">${centerOptions(v.center || "", role)}</select></div>
      ${v.editing ? `<div><label class="f">Title (for email sign-offs)</label><input type="text" data-k="title" value="${esc(v.title || "")}"></div>` : ""}
      <div data-show="trial" ${role === "trial" ? "" : "hidden"}>${v.editing
        ? `<label class="f">Trial ends</label><input type="date" data-k="until" value="${esc(isoDate(v.until))}">`
        : `<label class="f">Trial length (days)</label><input type="number" min="1" max="365" data-k="days" value="${v.days || TRIAL_DAYS}">`}</div>
    </div>
    <div data-show="special" ${role === "special" ? "" : "hidden"}>
      <label class="f" style="margin-top:12px">Pages they can open (Today is always on)</label>
      <div class="pages">${PAGES.filter(p => p[0] !== "today").map(([t, l]) => `<label><input type="checkbox" data-page value="${t}" ${(v.pages || DEFAULT_PAGES).includes(t) ? "checked" : ""}> ${esc(l)}</label>`).join("")}</div>
    </div>
  </div>`;
}
function readForm(el) {
  const g = k => el.querySelector(`[data-k="${k}"]`);
  const role = g("role").value;
  let center = g("center").value;
  if (center === "all" && !lead(role)) center = "";
  return {
    email: g("email") ? g("email").value.trim().toLowerCase() : "", name: g("name").value.trim(), role, center,
    title: g("title") ? g("title").value.trim() : undefined, days: g("days") ? Math.max(1, +g("days").value || TRIAL_DAYS) : 0,
    until: g("until") ? g("until").value : "", pages: ["today", ...$$("[data-page]:checked", el).map(x => x.value)],
  };
}
document.addEventListener("change", e => {
  const sel = e.target.closest && e.target.closest('[data-pf] select[data-k="role"]');
  if (!sel) return;
  const f = sel.closest("[data-pf]"), role = sel.value;
  $$("[data-show]", f).forEach(x => { x.hidden = x.dataset.show !== role; });
  const c = f.querySelector('select[data-k="center"]'), allOpt = c.querySelector('option[value="all"]');
  allOpt.disabled = !lead(role); if (!lead(role) && c.value === "all") c.value = "";
});
function accessDoc(v, base) {
  const d = {};
  for (const k of ["email", "viewCenters", "at", "by", "rosterId", "phone", "place", "workEmail"]) if (base && base[k] !== undefined) d[k] = base[k];
  d.email = d.email || v.email;
  d.name = v.name || (base && base.name) || "";
  d.role = v.role; d.center = v.center || "";
  d.title = v.title !== undefined ? v.title : (TITLED.includes(v.role) ? roleLabel(v.role) : "");
  if (!d.viewCenters) d.viewCenters = [];
  if (v.role === "trial") {
    const end = v.until ? new Date(v.until + "T23:59:59") : new Date(Date.now() + (v.days || TRIAL_DAYS) * 864e5);
    d.until = FBX.when(end);
  }
  if (v.role === "special") d.pages = v.pages;
  if (!base) { d.at = FBX.stamp(); d.by = me.email; } else { d.changedAt = FBX.stamp(); d.changedBy = me.email; }
  return d;
}

// ---------------------------------------------------------------- screens before the owner view
function signInCard() {
  main(`<div class="card"><h2>Sign in</h2><p class="muted">This page is for the hub's owner.</p>
    <button class="btn pri" data-act="google">Continue with Google</button>
    <p class="small muted" style="margin-top:12px">Signed in with an email link instead? <a href="./${esc(keep())}">Sign in on the hub</a> first, then come back.</p></div>`);
}
function claimCard() {
  main(`<div class="card"><h2>Make yourself the owner</h2>
    <p>Nobody owns this hub yet. The owner lets people in, sets their level and center, and loads data. There's one owner, and only the owner can open this page.</p>
    <div class="grid" style="margin:12px 0">
      <div><label class="f">Your name</label><input type="text" id="cName" value="${esc(me.name || "")}"></div>
      <div><label class="f">Your center</label><select id="cCenter">${CENTERS.map(c => `<option value="${c.id}" ${c.id === "east-hartford" ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
    </div>
    <p class="small muted">You'll be an Assistant Coordinator at that center. As the owner you can also look at the hub the way every other level sees it.</p>
    <button class="btn pri" data-act="claim">Claim this hub as ${esc(me.email)}</button></div>`);
}
function notOwnerCard(owner) {
  main(`<div class="card"><h2>This page is for the hub's owner</h2>
    <p>You're signed in as <b>${esc(me.email)}</b>${owner ? ", and this hub belongs to someone else" : ""}. Everything you can use is on the hub itself.</p>
    <div class="row"><a class="btn pri" href="./${esc(keep())}">Back to the hub</a><button class="btn" data-act="signout">Sign out</button></div></div>`);
}

// ---------------------------------------------------------------- owner view
async function loadAll() {
  const [requests, access, roster, index, codes, ai, feedback, hook] = await Promise.all([FBX.listCol("requests"), FBX.listCol("access"), FBX.listCol("roster"), FBX.getRefIndex(),
    FBX.listCol("codes").catch(() => []), (FBX.getAI ? FBX.getAI() : Promise.resolve(null)).catch(() => null),
    FBX.listCol("feedback").catch(() => []), (FBX.getFeedbackHook ? FBX.getFeedbackHook() : Promise.resolve(null)).catch(() => null)]);
  S.codes = codes.map(c => c.id); S.ai = ai; S.fbHook = hook;
  S.feedback = feedback.sort((a, b) => (toDate(b.at) || 0) - (toDate(a.at) || 0));
  const has = new Set(access.map(a => a.id));
  S.requests = requests.filter(r => !has.has(r.id)).sort((a, b) => (toDate(b.at) || 0) - (toDate(a.at) || 0));
  requests.filter(r => has.has(r.id)).forEach(r => FBX.delRaw("requests", r.id).catch(() => {}));   // already let in
  const rank = r => { const i = ROLE_ORDER.indexOf(r); return i < 0 ? 99 : i; };
  S.access = access.sort((a, b) => rank(a.role) - rank(b.role) || String(a.name || a.id).localeCompare(String(b.name || b.id)));
  S.roster = roster.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  S.index = index || { sets: {} };
}
async function refresh() { await loadAll(); render(); }

function render() {
  const n = S.requests.length;
  const tab = (id, label, count) => `<button role="tab" data-tab="${id}" aria-selected="${S.tab === id}">${label}${count ? ` <span class="n">${count}</span>` : ""}</button>`;
  main(`<div class="tabs" role="tablist">${tab("wait", "Waiting", n)}${tab("people", `People (${S.access.length})`)}${tab("roster", `Name list (${S.roster.length})`)}${tab("data", "Data")}${tab("feedback", `Feedback (${(S.feedback || []).length})`)}</div>
    <div id="pane">${({ wait: paneWait, people: panePeople, roster: paneRoster, data: paneData, feedback: paneFeedback })[S.tab]()}</div>`);
}

function bestMatch(r) {
  const m = rosterMatches(r.googleName || r.email.split("@")[0].replace(/[._-]+/g, " "), S.roster)[0];
  if (!m) return null;
  const takenBy = S.access.find(a => a.rosterId === m.r.id);
  return { ...m, takenBy };
}
function paneWait() {
  if (!S.requests.length) return `<div class="empty">Nobody is waiting. When someone new signs in, they show up here.<br><button class="btn sm" data-act="refresh" style="margin-top:10px">Check again</button></div>`;
  const strong = S.requests.filter(r => { const b = bestMatch(r); return b && b.score >= STRONG && !b.takenBy; });
  return `${strong.length > 1 ? `<div class="card row"><div class="grow"><b>${strong.length} people match your name list closely.</b><div class="small muted">Lets each of them in at the level and center from the list.</div></div><button class="btn pri" data-act="approve-strong">Let in all ${strong.length}</button></div>` : ""}
    <div class="row" style="margin-bottom:10px"><span class="small muted grow">Check each person before you let them in. A name can be typed by anyone; the email is what signs in.</span><button class="btn sm" data-act="refresh">Check again</button></div>
    ${S.requests.map(r => {
      const b = bestMatch(r), name = b && b.score >= 0.6 ? b.r.name : r.googleName;
      const box = !b ? `<div class="match none">No match on your name list. Make sure you know who this is.</div>`
        : b.score >= STRONG ? `<div class="match good">Matches <b>${esc(b.r.name)}</b> on your name list: ${esc(roleLabel(b.r.role))}${b.r.center ? ", " + esc(centerName(b.r.center)) : ""}.${b.takenBy ? ` <br><b>Heads up:</b> ${esc(b.takenBy.email)} is already let in as this person.` : ""}</div>`
        : `<div class="match maybe">Might be <b>${esc(b.r.name)}</b> (${esc(roleLabel(b.r.role))}), ${Math.round(b.score * 100)}% alike. Check before letting them in.${b.takenBy ? ` ${esc(b.takenBy.email)} is already let in as this person.` : ""}</div>`;
      return `<div class="card" data-req="${esc(r.id)}">
        <div class="person">${avatar(r.photo, r.googleName || r.email)}<div class="who grow"><b>${esc(r.googleName || "(no name on the account)")}</b><span>${esc(r.email)} · asked ${esc(ago(r.at))}</span></div></div>
        ${box}
        ${personForm({ name, role: b && b.score >= 0.6 ? b.r.role : "trial", center: b && b.score >= 0.6 ? b.r.center : "" })}
        <div class="row" style="margin-top:12px"><button class="btn pri" data-act="approve" data-id="${esc(r.id)}">Let in</button><button class="btn" data-act="dismiss" data-id="${esc(r.id)}">Not now</button>
        ${b && b.score >= 0.6 ? `<input type="hidden" data-roster="${esc(b.r.id)}">` : ""}</div></div>`;
    }).join("")}`;
}
async function approve(r, v, rosterId) {
  if (!v.name) v.name = r.googleName || "";
  const d = accessDoc({ ...v, email: r.email });
  if (rosterId) d.rosterId = rosterId;
  await FBX.setRaw("access", r.email, d);
  await FBX.delRaw("requests", r.id);
}

function panePeople() {
  const counts = ROLE_ORDER.map(r => [r, S.access.filter(a => a.role === r).length]).filter(x => x[1]);
  const now = Date.now();
  return `<details class="card"><summary><b>Add someone before they sign in</b> <span class="small muted">(for example a new trial hire)</span></summary>
      <div style="margin-top:12px" id="addForm">${personForm({ withEmail: true, role: "trial" })}</div>
      <p class="small muted" style="margin-top:10px">They sign in with that email (Google, or the emailed link) and go straight in. No approval step.</p>
      <button class="btn pri" data-act="add-person" style="margin-top:6px">Add</button></details>
    <div class="row" style="margin:6px 0 12px"><input type="text" id="peopleQ" placeholder="Search by name or email" aria-label="Search people" style="max-width:320px">
      <span class="small muted grow">${counts.map(([r, n]) => `${n} ${esc(roleLabel(r))}`).join(" · ")}</span></div>
    <div class="list" id="peopleList">${S.access.length ? S.access.map(a => {
      const end = a.role === "trial" && a.until ? toDate(a.until) : null;
      const isMe = a.id === me.email;
      return `<div class="line" data-person="${esc(a.id)}" data-q="${esc((a.name + " " + a.id).toLowerCase())}">
        ${avatar("", a.name || a.id)}
        <div class="grow"><b>${esc(a.name || "(no name)")}${isMe ? ' <span class="pill blue">Owner</span>' : ""}</b><span class="small muted">${esc(a.id)}</span></div>
        <span class="pill">${esc(roleLabel(a.role))}</span><span class="pill">${esc(a.center ? centerName(a.center) : "No center yet")}</span>
        ${end ? `<span class="pill ${end.getTime() < now ? "red" : ""}">${end.getTime() < now ? "Trial ended " : "Trial ends "}${esc(fmtDate(end))}</span>` : ""}
        ${a.role === "special" ? `<span class="pill">${(a.pages || []).length} pages</span>` : ""}
        <details class="edit" style="width:100%"><summary>Change</summary>
          <div style="margin-top:10px">${personForm({ editing: true, name: a.name, role: a.role, center: a.center, title: a.title, until: toDate(a.until), pages: a.pages })}</div>
          <div class="row" style="margin-top:12px"><button class="btn pri" data-act="save-person" data-id="${esc(a.id)}">Save</button>
            ${isMe ? '<span class="small muted">You can change your own level and center, but you stay the owner.</span>' : `<button class="btn warn" data-act="remove-person" data-id="${esc(a.id)}">Take away access</button>`}</div>
        </details></div>`;
    }).join("") : '<div class="empty">Nobody yet.</div>'}</div>`;
}

const LEVEL_WORDS = [[/^(exec|executive|director|ed)$/, "exec"], [/^(coord|coordinator|center coordinator|cc)$/, "coord"],
  [/^(asst|assistant|ac|assistant coordinator|asst coordinator|assistant coord)$/, "asst"], [/^(canv|canvasser|canvassers|canvass)$/, "canv"],
  [/^(special|special assignment|sa)$/, "special"], [/^(trial|new hire|probation)$/, "trial"]];
const levelOf = w => { const s = String(w || "").trim().toLowerCase(); for (const [re, r] of LEVEL_WORDS) if (re.test(s)) return r; return ROLES[s] ? s : ""; };
const centerOf = w => {
  const s = String(w || "").trim().toLowerCase().replace(/\s+center$/, "");
  if (!s) return "";
  if (s === "hartford" || s === "east hartford" || s === "greater hartford") return "east-hartford";
  if (s === "all" || s === "all centers") return "all";
  const c = CENTERS.find(c => c.id === s || c.name.toLowerCase() === s || c.id === s.replace(/\s+/g, "-"));
  return c ? c.id : "";
};
function parseList(text) {
  const out = [], skipped = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith("#")) continue;
    const cells = line.split(/\t|,/).map(c => c.trim().replace(/^"|"$/g, ""));
    if (/^name$/i.test(cells[0])) continue;                                         // a header row
    const name = cells[0], role = levelOf(cells[1]) || (cells[1] ? "" : "asst"), center = centerOf(cells[2]);
    if (!name || /\d{3}.*\d{4}/.test(line)) { skipped.push(line); continue; }        // never keep phone numbers
    if (!role) { skipped.push(line); continue; }
    out.push({ name, role, center: center === "all" && !lead(role) ? "" : center, notes: cells.slice(3).join(", ") });
  }
  return { out, skipped };
}
function paneRoster() {
  const linked = r => S.access.find(a => a.rosterId === r.id) || S.access.find(a => nameScore(a.name, r.name) >= 0.9);
  return `<div class="note">Names and levels only. Don't add phone numbers. When someone signs in, the hub compares the name on their Google account with this list and suggests their level and center. You still let each person in.</div>
    <details class="card"><summary><b>Add names</b></summary>
      <div class="grid" style="margin-top:12px" id="rosterOne"><div><label class="f">Name</label><input type="text" data-k="name"></div>
        <div><label class="f">Level</label><select data-k="role">${ROLE_ORDER.map(r => `<option value="${r}" ${r === "asst" ? "selected" : ""}>${esc(roleLabel(r))}</option>`).join("")}</select></div>
        <div><label class="f">Center (optional)</label><select data-k="center"><option value="">Not set</option>${CENTERS.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div></div>
      <button class="btn pri" data-act="roster-add" style="margin-top:10px">Add this name</button>
      <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
      <label class="f" for="rosterPaste">Or paste a list: one person per line as <i>name, level, center</i></label>
      <textarea id="rosterPaste" placeholder="Jordan Rivera, Coordinator, New Haven&#10;Maya Santos, Assistant Coordinator, Waterbury&#10;Dee Walker, Executive"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn pri" data-act="roster-paste">Add these names</button>
        <label class="btn" style="cursor:pointer">Choose a .csv file<input type="file" accept=".csv,.txt,text/csv,text/plain" id="rosterFile" class="sr"></label></div>
      <p class="small muted" style="margin-top:8px">Levels: Executive, Coordinator, Assistant Coordinator, Special Assignment, Canvasser, Trial. Centers: ${CENTERS.map(c => esc(c.name)).join(", ")}. Lines with phone numbers are skipped.</p>
    </details>
    <div class="list">${S.roster.length ? S.roster.map(r => {
      const a = linked(r);
      return `<div class="line" data-rost="${esc(r.id)}">
        <div class="grow"><b>${esc(r.name)}</b><span class="small muted">${a ? "Signed in as " + esc(a.id) : "Hasn't signed in yet"}${r.notes ? " · " + esc(r.notes) : ""}</span></div>
        <span class="pill">${esc(roleLabel(r.role))}</span>${r.center ? `<span class="pill">${esc(centerName(r.center))}</span>` : ""}
        <details class="edit" style="width:100%"><summary>Change</summary>
          <div class="grid" style="margin-top:10px"><div><label class="f">Name</label><input type="text" data-k="name" value="${esc(r.name)}"></div>
            <div><label class="f">Level</label><select data-k="role">${ROLE_ORDER.map(x => `<option value="${x}" ${x === r.role ? "selected" : ""}>${esc(roleLabel(x))}</option>`).join("")}</select></div>
            <div><label class="f">Center</label><select data-k="center"><option value="">Not set</option>${CENTERS.map(c => `<option value="${c.id}" ${c.id === r.center ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
            <div><label class="f">Notes</label><input type="text" data-k="notes" value="${esc(r.notes || "")}"></div></div>
          <div class="row" style="margin-top:10px"><button class="btn pri" data-act="roster-save" data-id="${esc(r.id)}">Save</button><button class="btn warn" data-act="roster-del" data-id="${esc(r.id)}">Delete</button></div>
        </details></div>`;
    }).join("") : '<div class="empty">The name list is empty. Add names above, or paste the list from team-roster.csv.</div>'}</div>`;
}

function groups() {
  const g = new Map();
  for (const s of Object.values(S.index.sets || {})) {
    const k = s.label || "(no label)";
    if (!g.has(k)) g.set(k, { label: k, centers: new Set(), tiers: new Set(), at: s.at, n: 0 });
    const x = g.get(k); x.centers.add(s.center); x.tiers.add(s.tier); x.n += s.parts; if (s.at > x.at) x.at = s.at;
  }
  return [...g.values()];
}
const TIER_NAMES = { core: "events, meetings, schools", canvass: "petition signers", contacts: "contacts (people, letters, board)" };
function paneData() {
  const gs = groups(), demo = gs.some(g => g.label === DEMO_LABEL), f = S.file;
  return `<div class="card"><h2>What's loaded</h2>
      <p class="small muted">The hub's built-in lists (events, contacts, signers) come from data files loaded here. What people add and change in the hub is saved separately and isn't touched by this.</p>
      ${gs.length ? `<div class="list">${gs.map(g => `<div class="line"><div class="grow"><b>${esc(g.label)}</b>
          <span class="small muted">${[...g.centers].map(centerName).join(", ")} · ${[...g.tiers].map(t => TIER_NAMES[t] || t).join("; ")}${g.at ? " · loaded " + esc(ago(g.at)) : ""}</span></div>
          <button class="btn warn sm" data-act="set-remove" data-label="${esc(g.label)}">${g.label === DEMO_LABEL ? "Take out the demo data" : "Take out"}</button></div>`).join("")}</div>`
        : '<div class="empty">Nothing loaded yet. Start with the demo data so everyone has something to look at.</div>'}
      ${demo ? "" : `<button class="btn pri" data-act="demo-load" style="margin-top:12px">Load the demo data (made up, all 7 centers)</button>`}
      ${(() => { const have = new Set(Object.values(S.index.sets || {}).map(x => x.center)); const empty = CENTERS.filter(c => !have.has(c.id)); const others = gs.some(g => g.label === DEMO_OTHERS_LABEL);
        return empty.length && !others ? `<button class="btn" data-act="demo-others" style="margin-top:12px">Load demo data for the ${empty.length} center${empty.length === 1 ? "" : "s"} without data (${empty.map(c => c.name).join(", ")})</button>` : ""; })()}
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(128,128,128,.25)"><b>Mock tasks for the team</b>
        <div class="small muted">A short made-up task list per center, so everyone else's My role, Do now and Board have something on them. Only the team sees these; your own tasks stay yours and never show to anyone else.</div>
        <button class="btn" data-act="demo-tasks" style="margin-top:8px">Add the mock tasks (all 7 centers)</button> <button class="btn sm" data-act="demo-tasks-out" style="margin-top:8px">Take them out</button></div>
      <div class="bar" id="bar" hidden><i></i></div></div>
    <div class="card"><h2>Load a data file</h2>
      <p class="small muted">For example <i>my-data-east-hartford.json</i> from the "Firebase import files" folder on your Desktop. Loading a file replaces the lists it carries for its centers.</p>
      <label class="btn" style="cursor:pointer">Choose a file<input type="file" accept=".json,application/json" id="bundleFile" class="sr"></label>
      ${f ? `<div style="margin-top:12px">
        <p><b>${esc(f.label || f.name)}</b><br><span class="small muted">${f.tiers.length} lists for ${[...new Set(f.tiers.map(t => t.center))].map(centerName).join(", ")} · ${Object.entries(f.docs || {}).map(([c, d]) => `${Object.keys(d).length} ${c}`).join(", ") || "no saved records"}</span></p>
        ${f.private ? `<div class="note"><b>This file has real people's contact details.</b> Once it's loaded, everyone whose level can see contacts for ${[...new Set(f.tiers.map(t => t.center))].map(centerName).join(", ")} will see them (assistant coordinators and up at that center, plus coordinators and executives). Load it when you're ready for that.</div>` : ""}
        ${demo && f.label !== DEMO_LABEL ? `<label class="row small" style="margin-bottom:10px"><input type="checkbox" id="dropDemo" checked> Take out the demo data first</label>` : ""}
        <div class="row"><button class="btn pri" data-act="file-load">Load it</button><button class="btn" data-act="file-clear">Cancel</button></div></div>` : ""}
    </div>
    <div class="card"><h2>Center codes</h2>
      <p class="small muted">The door, Wi-Fi and computer codes a center's keyholders see on the Calendar page, scrambled with the team password. Make the line on your computer with <code>python3 -I tools/make_codes.py &lt;center&gt;</code>, then paste it here. ${S.codes.length ? "Loaded for: " + S.codes.map(centerName).join(", ") + "." : "None loaded yet."}</p>
      <textarea id="codesBox" rows="3" placeholder='{"v":1,"center":"east-hartford", …}' style="min-height:64px"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn pri" data-act="codes-save">Save the codes</button></div></div>
    <div class="card"><h2>Assistant (Ask LEAD)</h2>
      <p class="small muted">An Anthropic API key lets the assistant in the corner reason over the hub's data (<b>/inquiry</b>). It always uses Claude Sonnet (<code>claude-sonnet-5-5</code>). The key is kept in the team database, never in the website's code, and only people you've let in can use it. <b>Set a monthly spending limit on the key</b> at console.anthropic.com → Settings → Limits before you paste it. ${S.ai ? `Connected${S.ai.at ? " · added " + esc(ago(S.ai.at)) : ""}.` : "Not connected yet."}</p>
      <label class="f" for="aiKey">API key</label><input type="password" id="aiKey" autocomplete="off" placeholder="sk-ant-…">
      <div class="row" style="margin-top:8px"><button class="btn pri" data-act="ai-save">Save the key</button>${S.ai ? `<button class="btn warn" data-act="ai-remove">Disconnect</button>` : ""}</div></div>
    <div class="card"><h2>Backup</h2><p class="small muted">Downloads everything in the team database as one file: people, saved work and lists. It has private details, so keep it somewhere safe.</p>
      <button class="btn" data-act="backup">Download a full backup</button></div>`;
}
// ---- feedback: every response, as a list, a CSV, plain text, and (optionally) a copy to the owner's Google Sheet + inbox
const FB_HOOK_SCRIPT = `/** LEAD feedback hook (Google Apps Script).
 *  Every feedback form sent in the hub also lands in a Google Sheet in your Drive and in your inbox.
 *
 *  Set-up, once (about five minutes):
 *   1. Go to script.google.com, signed in as yourself → New project → name it "LEAD feedback hook".
 *   2. Replace everything in the editor with this file → save.
 *   3. Deploy → New deployment → gear icon → Web app → Execute as "Me", Who has access "Anyone" → Deploy.
 *   4. Allow access when asked (Advanced → Go to LEAD feedback hook → Allow). It only touches a sheet it creates
 *      and sends mail from you to you.
 *   5. Copy the Web app URL (ends in /exec) → LEAD owner page → Feedback → paste → Save. Press "Send a test".
 *  The sheet "LEAD feedback" appears in your Drive after the first response; the URL itself shows where it is.
 */
var SHEET_NAME = "LEAD feedback";

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  if (!d || !d.title || !Array.isArray(d.answers)) return out_("ignored");
  var ss = sheet_(), tab = ss.getSheetByName(d.title) || ss.insertSheet(d.title);
  if (tab.getLastRow() === 0) {
    tab.appendRow(["When", "Name", "Level", "Center", "Signed in as", "Test?"].concat(d.answers.map(function (a) { return a.q; })));
    tab.setFrozenRows(1);
  }
  tab.appendRow([d.at ? new Date(d.at) : new Date(), d.name || "", d.role || "", d.center || "", d.by || "", d.test ? "test" : ""]
    .concat(d.answers.map(function (a) { return a.a || ""; })));
  var me = Session.getEffectiveUser().getEmail();
  var lines = d.answers.filter(function (a) { return a.a; }).map(function (a) { return a.q + "\\n    " + a.a; }).join("\\n\\n");
  MailApp.sendEmail(me, "LEAD feedback: " + d.title + " from " + (d.name || "someone") + (d.test ? " (test)" : ""),
    (d.name || "Someone") + " (" + [d.role, d.center].filter(Boolean).join(", ") + ")\\n\\n" + lines + "\\n\\nAll responses: " + ss.getUrl());
  return out_("ok");
}

function doGet() { return out_("The LEAD feedback hook is up. Responses go to: " + sheet_().getUrl()); }

function sheet_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty("sheet");
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create(SHEET_NAME);
  p.setProperty("sheet", ss.getId());
  return ss;
}

function out_(t) { return ContentService.createTextOutput(t); }
`;
function fbRow(r, test) {
  const F = FEEDBACK_FORMS[r.kind] || { title: r.kind, qs: [] }, A = r.answers || {}, at = toDate(r.at);
  return { kind: r.kind, title: F.title, name: r.name || "", role: roleLabel(r.role) || r.role || "", center: r.center ? centerName(r.center) : "", by: r.by || "",
    at: at ? at.toISOString() : new Date().toISOString(), test: !!test,
    answers: F.qs.map(q => ({ q: q.q, a: Array.isArray(A[q.k]) ? A[q.k].join(", ") : (A[q.k] == null ? "" : String(A[q.k])) })) };
}
function fbCsv() {
  const cell = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`, out = [], L = [...(S.feedback || [])].reverse();
  for (const kind of Object.keys(FEEDBACK_FORMS)) {
    const R = L.filter(r => r.kind === kind); if (!R.length) continue; const F = FEEDBACK_FORMS[kind];
    out.push(cell(F.title)); out.push(["When", "Name", "Level", "Center", "Signed in as", ...F.qs.map(q => q.q)].map(cell).join(","));
    R.forEach(r => { const w = fbRow(r); out.push([w.at, w.name, w.role, w.center, w.by, ...w.answers.map(a => a.a)].map(cell).join(",")); }); out.push("");
  }
  return out.join("\r\n");
}
function fbText() {
  return (S.feedback || []).map(r => { const w = fbRow(r);
    return `${w.title} · ${w.name}${w.role ? " · " + w.role : ""}${w.center ? " · " + w.center : ""} · ${new Date(w.at).toLocaleString()}\n` + w.answers.filter(a => a.a).map(a => `  ${a.q}\n    ${a.a}`).join("\n"); }).join("\n\n");
}
const fbPost = (url, payload) => fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
const FB_HOOK_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
function paneFeedback() {
  const L = S.feedback || [], n = k => L.filter(r => r.kind === k).length, hook = S.fbHook && S.fbHook.url;
  const one = r => { const w = fbRow(r);
    return `<details class="line" style="display:block"><summary style="cursor:pointer;display:flex;gap:10px;flex-wrap:wrap;align-items:baseline"><b>${esc(w.name || w.by)}</b><span class="small muted">${esc([w.title, w.role, w.center, ago(toDate(r.at))].filter(Boolean).join(" · "))}</span></summary>
      <dl style="margin:10px 0 0;display:grid;gap:6px">${w.answers.filter(a => a.a).map(a => `<dt class="small muted">${esc(a.q)}</dt><dd style="margin:0 0 4px;white-space:pre-wrap">${esc(a.a)}</dd>`).join("") || "<dd class=\"small muted\">No answers filled in.</dd>"}</dl></details>`; };
  return `<div class="card"><h2>Responses (${L.length})</h2>
      <p class="small muted">Every feedback form the team sends from Ask LEAD → /feedback, newest first: ${n("demo")} software demo, ${n("training")} training. Also in the hub under Tools &amp; resources → Feedback (coordinators and up), and in the Firebase console under <code>feedback</code>. Nothing here goes out by text or email unless the copy below is connected.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn pri" data-act="fb-csv" ${L.length ? "" : "disabled"}>Download CSV</button><button class="btn" data-act="fb-copy" ${L.length ? "" : "disabled"}>Copy all as text</button><button class="btn sm" data-act="refresh">Check again</button></div>
      ${L.length ? `<div class="list">${L.map(one).join("")}</div>` : `<div class="empty">Nothing yet. The first /feedback from the team shows up here.</div>`}</div>
    <div class="card"><h2>A copy in your Google Sheet and inbox</h2>
      <p class="small muted">${hook ? `<b>Connected.</b> Each new response is also appended to the sheet "LEAD feedback" in your Drive and emailed to you.` : `<b>Not connected yet.</b> Once set up, each new response is also appended to a sheet in your Drive and emailed to you, without anyone else's involvement.`}
        It runs as a small Google Apps Script in your own Google account (free, nothing outside Google), so it takes a one-time five-minute set-up by you:</p>
      <ol class="small" style="margin:0 0 10px 18px;line-height:1.6"><li>Open <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener">script.google.com → New project</a>, name it <i>LEAD feedback hook</i>.</li>
        <li>Replace everything in the editor with the script below (Copy the script), then save.</li>
        <li>Deploy → New deployment → gear → <b>Web app</b> → Execute as <b>Me</b> · Who has access <b>Anyone</b> → Deploy → allow access (Advanced → Go to LEAD feedback hook → Allow).</li>
        <li>Copy the Web app URL (ends in <code>/exec</code>), paste it here, Save, then press <b>Send a test</b> and check your inbox.</li></ol>
      <details style="margin-bottom:12px"><summary class="small" style="cursor:pointer">The script to paste</summary><textarea readonly rows="10" style="margin-top:8px;font:12px/1.4 ui-monospace,Menlo,monospace;min-height:160px">${esc(FB_HOOK_SCRIPT)}</textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-act="fb-script-copy">Copy the script</button></div></details>
      <label class="f" for="fbHook">Web app URL</label><input type="url" id="fbHook" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(hook || "")}">
      <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="fb-hook-save">Save</button>${hook ? `<button class="btn" data-act="fb-hook-test">Send a test</button><button class="btn" data-act="fb-hook-all" ${L.length ? "" : "disabled"}>Send all ${L.length} to the sheet now</button><button class="btn warn" data-act="fb-hook-off">Disconnect</button>` : ""}</div></div>`;
}
async function runOps(ops, what) {
  const bar = $("#bar"); if (bar) { bar.hidden = false; bar.firstElementChild.style.width = "0"; }
  await FBX.writeMany(ops, (i, n) => { if (bar) bar.firstElementChild.style.width = Math.round(i / n * 100) + "%"; });
  toast(what);
}
function removeSetsOps(label) {
  const sets = { ...(S.index.sets || {}) }, ops = [];
  for (const [k, s] of Object.entries(sets)) {
    if ((s.label || "(no label)") !== label) continue;
    for (let i = 0; i < s.parts; i++) ops.push({ op: "del", col: "ref", id: refId(s.tier, s.center, i) });
    delete sets[k];
  }
  ops.push({ op: "set", col: "system", id: "refindex", data: { ...S.index, sets } });
  return ops;
}

// ---------------------------------------------------------------- actions
const ACTIONS = {
  async google() { try { await FBX.signInGoogle(); } catch (e) { toast(e.message || String(e)); } },
  async signout() { lockAgain(); await FBX.signOut(); location.replace("./" + keep()); },
  async refresh() { await refresh(); toast("Up to date"); },
  async claim() {
    const name = $("#cName").value.trim(), center = $("#cCenter").value;
    await FBX.claimOwner({ email: me.email, name: name || me.name || "", center });
    toast("This hub is yours now"); await route();
  },
  async approve(btn) {
    const card = btn.closest("[data-req]"), r = S.requests.find(x => x.id === btn.dataset.id);
    const v = readForm(card.querySelector("[data-pf]")), rost = card.querySelector("[data-roster]");
    if (v.role === "special" && v.pages.length < 2) return toast("Pick at least one page for a special assignment.");
    await approve(r, v, rost ? rost.dataset.roster : "");
    toast(`${v.name || r.email} can get in now`); await refresh();
  },
  async "approve-strong"() {
    const list = S.requests.map(r => [r, bestMatch(r)]).filter(([, b]) => b && b.score >= STRONG && !b.takenBy);
    for (const [r, b] of list) await approve(r, { name: b.r.name, role: b.r.role, center: b.r.center || "", days: TRIAL_DAYS, pages: ["today", ...DEFAULT_PAGES] }, b.r.id);
    toast(`Let in ${list.length} people`); await refresh();
  },
  async dismiss(btn) { await FBX.delRaw("requests", btn.dataset.id); toast("Removed. If they sign in again, they'll show up again."); await refresh(); },
  async "add-person"() {
    const v = readForm($("#addForm [data-pf]"));
    if (!validEmail(v.email)) return toast("Type the email they'll sign in with.");
    if (S.access.some(a => a.id === v.email)) return toast("That email can already get in. Change them in the list below.");
    if (v.role === "special" && v.pages.length < 2) return toast("Pick at least one page for a special assignment.");
    await FBX.setRaw("access", v.email, accessDoc(v));
    toast(`${v.name || v.email} can sign in now`); await refresh();
  },
  async "save-person"(btn) {
    const id = btn.dataset.id, a = S.access.find(x => x.id === id), v = readForm(btn.closest("details").querySelector("[data-pf]"));
    if (v.role === "special" && v.pages.length < 2) return toast("Pick at least one page for a special assignment.");
    await FBX.setRaw("access", id, accessDoc(v, a));
    toast("Saved. They'll see the change next time they open the hub."); await refresh();
  },
  async "remove-person"(btn) {
    const a = S.access.find(x => x.id === btn.dataset.id);
    if (!confirm(`Take away ${a.name || a.id}'s access? They won't be able to open the hub. Their saved work stays.`)) return;
    await FBX.delRaw("access", a.id); toast("Access removed"); await refresh();
  },
  async "roster-add"() {
    const box = $("#rosterOne"), name = $('[data-k="name"]', box).value.trim();
    if (!name) return toast("Type a name.");
    if (/\d{3}.*\d{4}/.test(name)) return toast("Names only, please. No phone numbers.");
    if (S.roster.some(r => nameScore(r.name, name) >= 0.95)) return toast(`${name} is already on the list.`);
    await FBX.setRaw("roster", newId(), { name, role: $('[data-k="role"]', box).value, center: $('[data-k="center"]', box).value, notes: "", at: FBX.stamp() });
    toast(`Added ${name}`); await refresh();
  },
  async "roster-paste"() { await addList($("#rosterPaste").value); },
  async "roster-save"(btn) {
    const box = btn.closest("details"), g = k => $(`[data-k="${k}"]`, box).value.trim();
    if (/\d{3}.*\d{4}/.test(g("name") + g("notes"))) return toast("Names only, please. No phone numbers.");
    await FBX.setRaw("roster", btn.dataset.id, { name: g("name"), role: g("role"), center: g("center"), notes: g("notes"), at: FBX.stamp() });
    toast("Saved"); await refresh();
  },
  async "roster-del"(btn) {
    const r = S.roster.find(x => x.id === btn.dataset.id);
    if (!confirm(`Delete ${r.name} from the name list? This doesn't change anyone's access.`)) return;
    await FBX.delRaw("roster", r.id); toast("Deleted"); await refresh();
  },
  async "demo-others"() {
    const have = new Set(Object.values(S.index.sets || {}).map(x => x.center));
    const only = CENTERS.filter(c => !have.has(c.id)).map(c => c.id);
    if (!only.length) return toast("Every center has data already.");
    const { ops } = bundleOps(demoBundle(new Date(), { only }), S.index, me.email, new Date().toISOString());
    await runOps(ops, `Demo data loaded for ${only.map(centerName).join(", ")}`); await refresh();
  },
  async "demo-tasks"() {
    const t = demoBundle(new Date(), { only: CENTERS.map(c => c.id) }).docs.tasks || {};
    const ops = Object.entries(t).map(([id, data]) => ({ op: "set", col: "tasks", id, data: { ...data, demo: true } }));
    await runOps(ops, `${ops.length} mock tasks added for the team`);
  },
  async "demo-tasks-out"() {
    if (!confirm("Take out the team's mock tasks? Your own tasks are not touched.")) return;
    const t = demoBundle(new Date(), { only: CENTERS.map(c => c.id) }).docs.tasks || {};
    await runOps(Object.keys(t).map(id => ({ op: "del", col: "tasks", id })), "Mock tasks taken out");
  },
  async "demo-load"() {
    const { ops } = bundleOps(demoBundle(), S.index, me.email, new Date().toISOString());
    await runOps(ops, "Demo data loaded"); await refresh();
  },
  async "set-remove"(btn) {
    const label = btn.dataset.label, isDemo = label === DEMO_LABEL;
    if (!confirm(isDemo || label === DEMO_OTHERS_LABEL ? "Take out the demo data? This removes the made-up lists and the made-up tasks, shifts and notes that came with them." : `Take out the lists from "${label}"? Things people saved in the hub stay.`)) return;
    const others = label === DEMO_OTHERS_LABEL ? [...new Set(Object.values(S.index.sets || {}).filter(x => x.label === label).map(x => x.center))] : null;
    const ops = isDemo ? unbundleOps(demoBundle(), S.index).ops : others ? unbundleOps(demoBundle(new Date(), { only: others }), S.index).ops : removeSetsOps(label);
    await runOps(ops, "Taken out"); await refresh();
  },
  async "file-load"() {
    const f = S.file; if (!f) return;
    let index = S.index;
    if ($("#dropDemo") && $("#dropDemo").checked) { const u = unbundleOps(demoBundle(), index); await runOps(u.ops, "Demo data taken out"); index = u.index; }
    const { ops, skipped } = bundleOps(f, index, me.email, new Date().toISOString());
    await runOps(ops, `Loaded ${f.label || f.name}${skipped ? ` (skipped ${skipped} protected records)` : ""}`);
    S.file = null; await refresh();
  },
  async "file-clear"() { S.file = null; render(); },
  async "codes-save"() {
    let j;
    try { j = JSON.parse($("#codesBox").value.trim()); } catch (e) { return toast("That isn't the line make_codes.py printed. Paste the whole line."); }
    if (!(j && j.v === 1 && CENTERS.some(c => c.id === j.center) && j.salt && j.iv && j.ct)) return toast("That line is missing pieces. Make it again with make_codes.py.");
    await FBX.setRaw("codes", j.center, { ...j, by: me.email, at: FBX.stamp() });
    $("#codesBox").value = ""; toast(`Codes saved for ${centerName(j.center)}`); await refresh();
  },
  async "fb-csv"() {
    const blob = new Blob(["\ufeff" + fbCsv()], { type: "text/csv;charset=utf-8" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `LEAD feedback ${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast("CSV downloaded");
  },
  async "fb-copy"() { try { await navigator.clipboard.writeText(fbText()); toast("Copied every response"); } catch (e) { toast("Couldn't copy: " + ((e && e.message) || e)); } },
  async "fb-script-copy"() { try { await navigator.clipboard.writeText(FB_HOOK_SCRIPT); toast("Script copied. Paste it into the Apps Script editor."); } catch (e) { toast("Couldn't copy: " + ((e && e.message) || e)); } },
  async "fb-hook-save"() {
    const url = $("#fbHook").value.trim();
    if (!FB_HOOK_RE.test(url)) return toast("That doesn't look like an Apps Script web app URL (https://script.google.com/macros/s/…/exec).");
    await FBX.setRaw("system", "feedbackHook", { url, by: me.email, at: FBX.stamp() }); toast("Saved. Press “Send a test” to check your inbox."); await refresh();
  },
  async "fb-hook-off"() {
    if (!confirm("Disconnect the copy to your sheet and inbox? Responses stay in the team database either way.")) return;
    await FBX.delRaw("system", "feedbackHook"); toast("Disconnected"); await refresh();
  },
  async "fb-hook-test"() {
    const url = S.fbHook && S.fbHook.url; if (!url) return;
    try { await fbPost(url, fbRow({ kind: "demo", name: me.displayName || me.email, role: "asst", center: "east-hartford", by: me.email, at: new Date(), answers: { device: ["Laptop or desktop"], signin: "5", best: "A test from the owner page: if this reached your inbox and the sheet, the copy works.", overall: "5" } }, true));
      toast("Test sent. Check your inbox (and the sheet \"LEAD feedback\" in Drive) in a minute."); } catch (e) { toast("Couldn't reach the hook: " + ((e && e.message) || e)); }
  },
  async "fb-hook-all"() {
    const url = S.fbHook && S.fbHook.url, L = [...(S.feedback || [])].reverse(); if (!url || !L.length) return;
    if (!confirm(`Send all ${L.length} responses to the sheet now? You'll also get ${L.length} emails.`)) return;
    let n = 0; for (const r of L) { try { await fbPost(url, fbRow(r)); n++; } catch (e) {} await new Promise(res => setTimeout(res, 350)); }
    toast(`${n} of ${L.length} sent`);
  },
  async "ai-save"() {
    const key = $("#aiKey").value.trim();
    if (!/^sk-ant-[\w-]{20,}$/.test(key)) return toast("That doesn't look like an Anthropic API key (they start with sk-ant-).");
    await FBX.setRaw("system", "ai", { key, model: "claude-sonnet-5-5", by: me.email, at: FBX.stamp() });
    $("#aiKey").value = ""; toast("The assistant is connected"); await refresh();
  },
  async "ai-remove"() {
    if (!confirm("Disconnect the assistant? People can still search the hub; /inquiry stops working until a key is added again.")) return;
    await FBX.delRaw("system", "ai"); toast("Disconnected"); await refresh();
  },
  async backup() {
    const cols = [...new Set([...SCOPED, ...ORGWIDE, PERSONAL, "hours", "log", "private", "access", "roster", "requests", "system", "ref"])];
    const out = { kind: "lead-hub-backup", made: new Date().toISOString(), by: me.email, collections: {} };
    for (const c of cols) {
      const docs = await FBX.listCol(c);
      if (docs.length) out.collections[c] = Object.fromEntries(docs.map(({ id, ...d }) => [id, d]));
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: "application/json" }));
    a.download = `lead-hub-backup-${isoDate(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast("Backup downloaded");
  },
};
async function addList(text) {
  const { out, skipped } = parseList(text);
  const fresh = out.filter(p => !S.roster.some(r => nameScore(r.name, p.name) >= 0.95));
  if (!fresh.length) return toast(out.length ? "Everyone on that list is already on the name list." : "Nothing to add. Use one person per line: name, level, center.");
  await FBX.writeMany(fresh.map(p => ({ op: "set", col: "roster", id: newId(), data: { ...p, at: FBX.stamp() } })));
  toast(`Added ${fresh.length} name${fresh.length === 1 ? "" : "s"}${out.length > fresh.length ? `, ${out.length - fresh.length} already there` : ""}${skipped.length ? `, skipped ${skipped.length} line${skipped.length === 1 ? "" : "s"}` : ""}`);
  await refresh();
}

document.addEventListener("click", e => {
  const tabBtn = e.target.closest && e.target.closest("[data-tab]");
  if (tabBtn) { S.tab = tabBtn.dataset.tab; render(); return; }
  const btn = e.target.closest && e.target.closest("[data-act]");
  if (!btn || !ACTIONS[btn.dataset.act]) return;
  e.preventDefault();
  busy(btn, () => ACTIONS[btn.dataset.act](btn));
});
document.addEventListener("input", e => {
  if (e.target.id !== "peopleQ") return;
  const q = e.target.value.trim().toLowerCase();
  $$("#peopleList [data-person]").forEach(x => { x.hidden = !!q && !x.dataset.q.includes(q); });
});
document.addEventListener("change", async e => {
  if (e.target.id === "rosterFile" && e.target.files[0]) { const t = await e.target.files[0].text(); busy(null, () => addList(t)); return; }
  if (e.target.id !== "bundleFile" || !e.target.files[0]) return;
  const file = e.target.files[0];
  try {
    const b = JSON.parse(await file.text());
    if (!b || b.kind !== "lead-hub-bundle" || !Array.isArray(b.tiers)) throw new Error("That isn't a hub data file.");
    S.file = { ...b, name: file.name }; render();
  } catch (er) { toast("Couldn't read that file: " + er.message); }
});

// ---------------------------------------------------------------- start
async function route() {
  $("#outBtn").hidden = !me;
  $("#topWho").textContent = me ? me.email : "";
  if (!me) return signInCard();
  main('<p class="muted"><span class="spin" aria-hidden="true"></span>Checking…</p>');
  const owner = await FBX.getOwner();
  if (!owner) return claimCard();
  if (owner.email !== me.email) return notOwnerCard(owner);
  try { await refresh(); }
  catch (e) { console.error(e); main(`<div class="card"><h2>Couldn't load the owner page</h2><p class="muted">${esc(denied(e))}</p><button class="btn pri" onclick="location.reload()">Try again</button></div>`); }
}
async function start() {
  // The team password is typed on the hub's front page; come back here after.
  if (!(await isUnlocked())) { location.replace("./" + keep()); return; }
  $("#backLink").href = "./" + keep();
  $("#outBtn").onclick = () => ACTIONS.signout();
  try { FBX = await import(OFFLINE ? "./dev/mock-fb.js" : "./lead-fb.js"); }
  catch (e) { return main(`<div class="card"><h2>Couldn't load this page</h2><p class="muted">${esc(e.message)}</p></div>`); }
  if (!FBX.configured()) return main(`<div class="card"><h2>Not connected yet</h2><p>This copy of the hub isn't connected to Firebase yet: paste your project's settings into <b>js/firebase-config.js</b> first.</p>${LOCAL_HOST ? '<p class="small muted">To try the owner page with made-up people, <a href="?offline">open the offline test</a>.</p>' : ""}</div>`);
  try { await FBX.init(); } catch (e) { return main(`<div class="card"><h2>Couldn't reach Firebase</h2><p class="muted">${esc(e.message)}</p></div>`); }
  FBX.onUser(u => {
    const email = u ? u.email : null;
    if (email === current) return;
    current = email; me = u;
    route().catch(e => { console.error(e); toast(denied(e)); });
  });
}
start();
