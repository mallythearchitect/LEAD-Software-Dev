/* LEAD — team edition: the team password, sign-in, then loading the hub.
   The card stays up until this browser is unlocked with the team password (js/lock.js), the person is
   signed in, approved by the hub's owner and (for
   levels tied to one center) has picked their center. Then only the data their level may see is
   loaded, the hub gets its database connection (window.__FB) and starts.

   Trying it on this computer without Firebase: run a local server in this folder and open
   http://localhost:8765/?offline  (made-up people and data; see js/dev/mock-fb.js for ?as=). */
import { CENTERS, CENTER_IDS, ROLES, OWNER_VIEWS, roleLabel, centerName, grantsForPages, tierAllowed, assembleData, makeHubDB } from "./lead-core.js";
import { isUnlocked, lockScreen, lockAgain } from "./lock.js";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const HOST = location.hostname;
const LOCAL_HOST = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(HOST) || HOST.endsWith(".localhost");
const OFFLINE = LOCAL_HOST && new URLSearchParams(location.search).has("offline");
const keep = () => (OFFLINE ? location.search : "");            // keep the test settings when moving between pages
const VERSION = new URL(import.meta.url).searchParams.get("v") || "";
let FBX = null, current, linking = false;
try { const t = localStorage.getItem("lead_hub_theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) { /* no saved theme */ }
// The old password-locked page kept its "stay unlocked" keys in this browser. The team version never
// uses them, so they're cleared. The old page's saved edits (lead_hub_v1) are left alone.
try { for (const k of Object.keys(localStorage)) if (/^lead_hub_(lock|sg)_/.test(k)) localStorage.removeItem(k); } catch (e) { /* storage blocked */ }

const GOOGLE_G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

// ---------------------------------------------------------------- small pieces
function show(html) {
  const b = $("#gateBody");
  b.innerHTML = html + (OFFLINE ? '<p class="gate-demo">Offline test: made-up people and data. Nothing leaves this computer.</p>' : "");
  const f = b.querySelector("[autofocus]") || b.querySelector("h2");
  if (f) { if (f.tagName === "H2") f.tabIndex = -1; f.focus({ preventScroll: true }); }
}
const loading = text => show(`<p class="gate-muted"><span class="gate-spin" aria-hidden="true"></span>${esc(text)}</p>`);
const msg = (text, ok) => { const m = $("#gMsg"); if (m) m.innerHTML = text ? `<p class="${ok ? "gate-ok" : "gate-err"}" role="alert">${esc(text)}</p>` : ""; };
const initials = s => String(s || "").replace(/\([^)]*\)/g, " ").split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
const avatar = (photo, name) => photo ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer">` : esc(initials(name));
const whoCard = u => `<div class="gate-who"><span class="acct-av">${avatar(u.photo, u.name || u.email)}</span><div style="min-width:0"><b>${esc(u.name || u.email)}</b><span>${esc(u.email)}</span></div></div>`;
const foot = u => `<div class="gate-foot">${u ? `<span>Signed in as ${esc(u.email)}</span>` : ""}<button type="button" data-gout>${u ? "Sign out" : "Back"}</button></div>`;
const fmtDate = d => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const placeFor = id => id === "east-hartford" ? "LEAD Greater Hartford" : CENTER_IDS.includes(id) ? "LEAD " + centerName(id) : "LEAD";

async function signOut() {
  lockAgain();                                     // signing out locks this device again
  try { await FBX.signOut(); } catch (e) { /* signed out already */ }
  location.replace(location.pathname + keep());
}
document.addEventListener("click", e => {
  const t = e.target.closest && e.target.closest("[data-gout],[data-greload]");
  if (!t || !$("#gate").contains(t)) return;
  e.preventDefault();
  if (t.hasAttribute("data-greload")) location.reload(); else signOut();
});

function authError(er) {
  const code = (er && er.code) || "";
  const text = {
    "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again, or use the email link below.",
    "auth/popup-closed-by-user": "", "auth/cancelled-popup-request": "", "auth/user-cancelled": "",
    "auth/unauthorized-domain": `This web address (${HOST}) isn't on Firebase's allowed list yet. The owner adds it in Firebase: Authentication → Settings → Authorized domains.`,
    "auth/operation-not-allowed": "That way of signing in isn't turned on yet. The owner turns it on in Firebase: Authentication → Sign-in method.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/missing-email": "Type your email address.",
    "auth/quota-exceeded": "Too many sign-in emails have gone out today. Use Google, or try again tomorrow.",
    "auth/invalid-action-code": "That sign-in link was already used or is too old. Ask for a new one.",
    "auth/expired-action-code": "That sign-in link is too old. Ask for a new one.",
    "auth/account-exists-with-different-credential": "This email already signs in another way. Try Continue with Google.",
    "auth/user-disabled": "This account has been turned off. Ask the hub's owner.",
    "auth/too-many-requests": "Too many tries. Wait a few minutes and try again.",
  }[code];
  if (text !== undefined) return text;
  return "Sign-in didn't work" + (er && er.message ? ": " + er.message.replace(/^Firebase:\s*/, "") : ".");
}

function fail(title, e) {
  console.error("[hub]", e);
  const detail = e ? [e.code, e.message || String(e)].filter(Boolean).join(": ") : "";
  show(`<h2 id="gateTitle">${esc(title)}</h2>${detail ? `<p class="gate-muted" style="overflow-wrap:anywhere">${esc(detail)}</p>` : ""}
    <button class="gate-btn pri" type="button" data-greload>Try again</button>${current ? foot({ email: current }) : ""}`);
}

// ---------------------------------------------------------------- screens before sign-in
function notConfigured() {
  show(`<h2 id="gateTitle">Almost ready</h2><p>The team version of the hub is still being set up. Check back soon.</p>
    ${LOCAL_HOST ? `<p class="gate-muted">This copy isn't connected to Firebase yet (js/firebase-config.js is empty). To try it with made-up people and data, <a class="gate-link" href="?offline">open the offline test</a>.</p>` : ""}`);
}

function signInScreen(note) {
  show(`<h2 id="gateTitle">Sign in</h2>
    <p class="gate-muted">Use the Google account your team knows you by. New to the team? Sign in anyway and the hub's owner will let you in.</p>
    <button class="gate-btn" id="gGoogle" type="button">${GOOGLE_G}<span>Continue with Google</span></button>
    <div class="gate-or">or get a sign-in link by email</div>
    <form id="gLink" novalidate><label for="gEmail">Email</label>
      <input id="gEmail" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required>
      <button class="gate-btn" type="submit">Email me a sign-in link</button></form>
    <label style="display:flex;gap:8px;align-items:center;font-weight:500;margin-top:14px;cursor:pointer"><input type="checkbox" id="gShared" style="width:16px;height:16px"> This is a shared computer (sign me out when the browser closes)</label>
    <div id="gMsg"></div>`);
  if (note) msg(note);
  const shared = () => !!($("#gShared") && $("#gShared").checked);
  $("#gGoogle").onclick = async e => {
    const b = e.currentTarget; b.disabled = true; msg("");
    try { await FBX.setShared(shared()); await FBX.signInGoogle(); }                      // onUser takes it from here
    catch (er) { b.disabled = false; msg(authError(er)); }
  };
  $("#gLink").onsubmit = async e => {
    e.preventDefault();
    const email = $("#gEmail").value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg("Type your full email address.");
    const b = e.submitter || $("#gLink button"); b.disabled = true; msg("");
    try { await FBX.sendLink(email, shared()); linkSentScreen(email); }
    catch (er) { b.disabled = false; msg(authError(er)); }
  };
}

function linkSentScreen(email) {
  show(`<h2 id="gateTitle">Check your email</h2>
    <p>We sent a sign-in link to <b>${esc(email)}</b>. Open it on this device and you're in. It can take a minute, and it sometimes lands in spam.</p>
    ${OFFLINE ? `<p class="gate-muted">Offline test: <a class="gate-link" href="${esc(location.pathname + keep() + (keep() ? "&" : "?") + "link")}">open the link</a>.</p>` : ""}
    <div class="gate-foot"><button type="button" id="gAgain">Use a different email</button></div>`);
  $("#gAgain").onclick = () => signInScreen();
}

function finishLinkScreen() {
  const saved = FBX.savedLinkEmail();
  if (saved) return finishLink(saved);
  show(`<h2 id="gateTitle">Confirm your email</h2>
    <p class="gate-muted">This sign-in link was opened on a different device or browser than the one that asked for it. Type the email it was sent to.</p>
    <form id="gConfirm"><label for="gEmail">Email</label><input id="gEmail" type="email" autocomplete="email" required autofocus>
      <button class="gate-btn pri" type="submit">Sign in</button></form><div id="gMsg"></div>`);
  $("#gConfirm").onsubmit = e => { e.preventDefault(); finishLink($("#gEmail").value.trim().toLowerCase()); };
}
async function finishLink(email) {
  loading("Signing you in…");
  try { await FBX.finishLink(email); }                                                      // onUser takes it from here
  catch (er) { linking = false; signInScreen(authError(er) || "That link didn't work. Ask for a new one."); }
}

// ---------------------------------------------------------------- after sign-in: access, center, then the hub
const expired = acc => { const d = acc.until && FBX.toDate(acc.until); return !!(d && d.getTime() < Date.now()); };

async function afterSignIn(u) {
  if (!u.email) return problem(u, "This account has no email address. Sign in with Google or an email link instead.");
  if (!u.verified) return problem(u, "This email address isn't verified yet. Sign in with Google, or use an email link, which verifies it.");
  loading("Checking your access…");
  const [owner, acc] = await Promise.all([FBX.getOwner(), FBX.getAccess(u.email)]);
  const isOwner = !!(owner && owner.email === u.email);
  if (!owner && !acc) return notSetUpScreen(u);
  if (!acc || !ROLES[acc.role]) return waitScreen(u, isOwner);
  if (acc.role === "trial" && expired(acc)) return expiredScreen(u, acc);
  const lead = !!ROLES[acc.role].lead;
  const centerOk = lead ? (acc.center === "all" || CENTER_IDS.includes(acc.center)) : CENTER_IDS.includes(acc.center);
  if (!centerOk) return pickCenterScreen(u, acc);
  return loadHub(u, acc, isOwner);
}

function problem(u, text) { show(`<h2 id="gateTitle">Can't sign in with this account</h2>${whoCard(u)}<p>${esc(text)}</p>${foot(u)}`); }

function notSetUpScreen(u) {
  show(`<h2 id="gateTitle">This hub isn't set up yet</h2>${whoCard(u)}
    <p>Nobody owns it yet, so nobody can let people in. If you're the one setting it up, open the owner page to finish.</p>
    <a class="gate-btn pri" href="admin.html${esc(keep())}">Open the owner page</a>${foot(u)}`);
}

function waitScreen(u, isOwner) {
  show(`<h2 id="gateTitle">Waiting to be let in</h2>${whoCard(u)}
    <p>The hub's owner has been asked to let you in. This page opens by itself once they do, so you can leave it open.</p>
    <p class="gate-muted">Tell them which email you signed in with, especially if it isn't the one they know you by.</p>
    ${isOwner ? `<a class="gate-btn pri" href="admin.html${esc(keep())}">Open the owner page</a>` : ""}${foot(u)}`);
  FBX.upsertRequest({ email: u.email, name: u.name, photo: u.photo }).catch(e => console.warn("[hub] couldn't file the request", e));
  let done = false, stop = null;
  stop = FBX.watchAccess(u.email, acc => {
    if (done || !acc || !ROLES[acc.role]) return;
    done = true; if (stop) stop();
    afterSignIn(u).catch(e => fail("Something went wrong", e));
  });
  if (done && stop) stop();
}

function expiredScreen(u, acc) {
  show(`<h2 id="gateTitle">Your trial has ended</h2>${whoCard(u)}
    <p>Your trial access ended on ${esc(fmtDate(FBX.toDate(acc.until)))}. Ask your coordinator or the hub's owner to extend it or move you to your new level.</p>${foot(u)}`);
}

function pickCenterScreen(u, acc) {
  const lead = !!ROLES[acc.role].lead;
  const opts = CENTERS.map(c => [c.id, c.name, c.city]);
  if (lead) opts.push(["all", "All centers", "No home center"]);
  show(`<h2 id="gateTitle">Pick your center</h2>${whoCard(u)}
    <p class="gate-muted">${lead
      ? "Your home center is where new things you add are filed. You can still look at every center from the menu with your name."
      : "You'll see your center's people, events and canvass. If you pick the wrong one, the hub's owner can change it."}</p>
    <div class="gate-centers" role="group" aria-label="Centers">${opts.map(([id, n, s]) => `<button type="button" data-c="${id}" aria-pressed="false">${esc(n)}<small>${esc(s)}</small></button>`).join("")}</div>
    <button class="gate-btn pri" id="gGo" type="button" disabled>Pick a center above</button><div id="gMsg"></div>${foot(u)}`);
  let pick = "";
  document.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
    pick = b.dataset.c;
    document.querySelectorAll("[data-c]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    const go = $("#gGo"); go.disabled = false; go.textContent = `Continue with ${centerName(pick)}`;
  });
  $("#gGo").onclick = async e => {
    if (!pick) return;
    e.currentTarget.disabled = true;
    try { await FBX.updateMyAccess(u.email, { center: pick }); await afterSignIn(u); }
    catch (er) { e.currentTarget.disabled = false; msg("Couldn't save your center. " + (er.code === "permission-denied" ? "Your center is already set; ask the hub's owner to change it." : er.message || "")); }
  };
}

async function loadHub(u, acc, isOwner) {
  loading("Loading your hub…");
  const role = acc.role, R = ROLES[role], lead = !!R.lead;
  const saved = (Array.isArray(acc.viewCenters) ? acc.viewCenters : []).filter(c => CENTER_IDS.includes(c));
  const home = CENTER_IDS.includes(acc.center) ? acc.center : "";
  // Leads see every center unless they narrowed it down. The owner starts on their own center.
  const viewCenters = isOwner ? (saved.length ? saved : home ? [home] : []) : lead ? saved : [];
  const wide = lead || isOwner;
  const ctx = { email: u.email, role, owner: isOwner, center: acc.center || "", grants: role === "special" ? grantsForPages(acc.pages) : [], viewCenters };
  const wanted = c => c === "all" || (wide ? (!viewCenters.length || viewCenters.includes(c)) : c === ctx.center);

  const index = await FBX.getRefIndex();
  const sets = Object.values(index.sets || {}).filter(s => wanted(s.center) && tierAllowed(s.tier, s.center, ctx));
  let n = 0;
  const tiers = await Promise.all(sets.map(async s => {
    try { return { tier: s.tier, center: s.center, data: await FBX.loadTier(s.tier, s.center, s.parts) }; }
    catch (e) { console.warn("[hub] couldn't load", s.tier, s.center, e); return null; }
    finally { n++; if (sets.length > 3) loading(`Loading your hub… ${Math.round(n / sets.length * 100)}%`); }
  }));
  const D = assembleData(tiers.filter(Boolean), ctx);
  const db = makeHubDB(FBX.backend(ctx), ctx, D.recordCenters);
  const all = !viewCenters.length || viewCenters.length === CENTERS.length;
  const label = wide ? (all ? "All centers" : viewCenters.length === 1 ? centerName(viewCenters[0]) : `${viewCenters.length} centers`) : centerName(acc.center);
  const title = acc.title || (["exec", "coord", "asst", "canv"].includes(role) ? roleLabel(role) : "");
  const homeC = CENTERS.find(c => c.id === home);
  window.__D = D;
  window.__FB = {
    db, owner: isOwner, role, roleLabel: roleLabel(role), views: isOwner ? OWNER_VIEWS : R.views, pages: acc.pages || [],
    me: { name: acc.name || u.name || "", title, phone: acc.phone || "", email: u.email, workEmail: acc.workEmail || "", place: acc.place || placeFor(home),
      town: homeC ? homeC.city.replace(/, CT$/, "") : "Connecticut", city: homeC ? homeC.city : "Connecticut" },
    email: u.email, center: acc.center || "", viewCenters, cvCenter: wide ? (viewCenters.length === 1 ? viewCenters[0] : "all") : acc.center,
    centerLabel: label, until: acc.until ? FBX.toDate(acc.until) : null, mode: FBX.mode, signOut,
    centers: CENTERS.map(c => ({ id: c.id, name: c.name, city: c.city })),
    x: teamApi(u, acc, isOwner),
  };
  await startHub();
  mountAccount(u, acc, isOwner);
}

/* The team pieces the hub's assistant uses: check-ins, the team list, messages, feedback, the center codes
   and the assistant's key. Each call is bound to the signed-in person; firestore.rules decides the rest. */
function teamApi(u, acc, isOwner) {
  const role = acc.role, name = acc.name || u.name || u.email, center = acc.center || "", title = acc.title || "";
  const lead = isOwner || !!(ROLES[role] || {}).lead;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const warn = what => e => console.warn("[hub] " + what, (e && e.code) || e);
  return {
    lead, name, role, center,
    setPresence: on => FBX.setPresence({ name, center, date: today(), in: !!on }),
    watchPresence: (date, cb) => FBX.watchPresence(date, cb, warn("check-ins")),
    joinDirectory: () => FBX.joinDirectory({ name, role, center, title }),
    watchDirectory: cb => FBX.watchDirectory(cb, warn("team list")),
    sendMessage: (to, text) => FBX.sendMessage(to.id, to.name || to.id, text, name),
    watchInbox: cb => FBX.watchInbox(cb, warn("messages")),
    watchSent: cb => FBX.watchSent(cb, warn("messages")),
    markRead: id => FBX.markRead(id),
    sendFeedback: d => FBX.sendFeedback({ ...d, role, center }),
    watchFeedback: lead ? cb => FBX.watchFeedback(cb, warn("feedback")) : null,
    getCodes: c => FBX.getCodes(c),
    listRoster: () => FBX.listRoster(),
    getAI: () => FBX.getAI(),
    setCenter: c => FBX.updateMyAccess(u.email, { center: c }),
    setViewCenters: list => FBX.updateMyAccess(u.email, { viewCenters: list }),
  };
}

function addScript(src, text) {
  return new Promise((ok, no) => {
    const s = document.createElement("script");
    if (text != null) { s.textContent = text; document.body.appendChild(s); ok(); return; }
    s.src = src + (VERSION ? "?v=" + encodeURIComponent(VERSION) : ""); s.async = false;
    s.onload = ok; s.onerror = () => no(new Error("Couldn't load " + src));
    document.body.appendChild(s);
  });
}
async function startHub() {
  const errors = [];
  const onErr = e => errors.push(e.error || new Error(e.message));
  window.addEventListener("error", onErr);
  // The hub reads its built-in lists from these names.
  await addScript(null, "const REF=window.__D.REF,CV=window.__D.CV,LT=window.__D.LT,BL=window.__D.BL,EV_NEW=window.__D.EV_NEW,LOCAL_SEED=window.__D.SEED||null;");
  await Promise.all([addScript("js/public-data.js"), addScript("js/app.js")]);
  window.removeEventListener("error", onErr);
  if (errors.length) {
    console.error("[hub] errors while starting", errors);
    show(`<h2 id="gateTitle">The hub hit a problem while starting</h2><p class="gate-muted" style="overflow-wrap:anywhere">${esc(errors[0].message || errors[0])}</p>
      <button class="gate-btn pri" type="button" id="gAnyway">Open it anyway</button><button class="gate-btn" type="button" data-greload>Try again</button>`);
    $("#gAnyway").onclick = () => { $("#gate").hidden = true; };
    return;
  }
  $("#gate").hidden = true;
}

// ---------------------------------------------------------------- the account button in the top bar
function mountAccount(u, acc, isOwner) {
  const F = window.__FB, wide = !!ROLES[acc.role].lead || isOwner;
  const name = F.me.name || u.email;
  const box = document.createElement("div");
  box.className = "acct";
  const trial = acc.role === "trial" && F.until ? `<div class="s">Trial ends ${esc(fmtDate(F.until))}</div>` : "";
  const picker = wide ? `<div class="grp">Centers to show</div>
      <div class="acct-cents">${CENTERS.map(c => `<label><input type="checkbox" value="${c.id}" ${!F.viewCenters.length || F.viewCenters.includes(c.id) ? "checked" : ""}> ${esc(c.name)}</label>`).join("")}</div>
      <div class="acts"><button type="button" class="btn sm" data-acct-all>All</button><button type="button" class="btn sm pri" data-acct-save>Show these</button></div>
      <p class="s" id="acctNote" role="status"></p>` : "";
  box.innerHTML = `<button type="button" class="acct-btn" aria-haspopup="true" aria-expanded="false" aria-controls="acctMenu" title="${esc(name)}">
      <span class="acct-av">${avatar(u.photo, name)}</span><span class="acct-name">${esc(name.split(/\s+/)[0])}</span></button>
    <div class="acct-menu" id="acctMenu" hidden>
      <h4>${esc(name)}</h4><div class="s">${esc(u.email)}</div>
      <div class="s">${isOwner ? "Owner · " : ""}${esc(roleLabel(acc.role))}${acc.center ? " · " + esc(centerName(acc.center)) : ""}</div>${trial}
      ${picker}
      <div class="acts">${isOwner ? `<a class="btn sm" href="admin.html${esc(keep())}">Owner page</a>` : ""}<button type="button" class="btn sm" data-acct-out>Sign out</button></div>
      ${OFFLINE ? '<p class="s" style="margin-top:10px">Offline test: made-up data, nothing is saved anywhere.</p>' : ""}
    </div>`;
  const anchor = $("#themeToggle");
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor); else $(".topbar").appendChild(box);
  const btn = box.querySelector(".acct-btn"), menu = box.querySelector(".acct-menu");
  // On a phone the menu is a sheet along the bottom of the screen. The top bar has a blur effect, which
  // would pin a "fixed" sheet to the bar instead of the screen, so the sheet moves to the page body while open.
  const narrow = matchMedia("(max-width:640px)");
  const open = on => {
    if (on) { const home = narrow.matches ? document.body : box; if (menu.parentNode !== home) home.appendChild(menu); }
    menu.hidden = !on; btn.setAttribute("aria-expanded", String(on));
  };
  btn.onclick = () => open(menu.hidden);
  document.addEventListener("click", e => { if (!menu.hidden && !box.contains(e.target) && !menu.contains(e.target)) open(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { open(false); btn.focus(); } });
  narrow.addEventListener("change", () => open(false));
  menu.querySelector("[data-acct-out]").onclick = signOut;
  if (!wide) return;
  const boxes = () => [...menu.querySelectorAll(".acct-cents input")];
  menu.querySelector("[data-acct-all]").onclick = () => boxes().forEach(b => { b.checked = true; });
  menu.querySelector("[data-acct-save]").onclick = async e => {
    const list = boxes().filter(b => b.checked).map(b => b.value);
    const note = menu.querySelector("#acctNote");
    if (!list.length) { note.textContent = "Pick at least one center."; return; }
    e.currentTarget.disabled = true; note.textContent = "Saving…";
    try { await FBX.updateMyAccess(u.email, { viewCenters: list }); location.reload(); }
    catch (er) { e.currentTarget.disabled = false; note.textContent = "Couldn't save: " + (er.message || er); }
  };
}

// ---------------------------------------------------------------- start
async function main() {
  if (!(await isUnlocked())) await lockScreen($("#gateBody"), OFFLINE ? "Offline test: made-up people and data. Nothing leaves this computer." : "");
  loading("Checking sign-in…");
  try { FBX = await import(OFFLINE ? "./dev/mock-fb.js" : "./lead-fb.js"); }
  catch (e) { return fail("Couldn't load the sign-in screen", e); }
  if (!FBX.configured()) return notConfigured();
  try { await FBX.init(); } catch (e) { return fail("Couldn't reach the team database", e); }
  linking = FBX.isLink();
  FBX.onUser(u => {
    const email = u ? u.email : null;
    if (email === current) return;
    if (current) { location.replace(location.pathname + keep()); return; }      // signed out or switched account elsewhere
    current = email;
    if (!u) { if (!linking) signInScreen(); return; }
    linking = false;
    afterSignIn(u).catch(e => fail("Something went wrong while loading", e));
  });
  if (linking) finishLinkScreen();
}
main();
