/* LEAD — team edition: the front door.
   A shared team password before Google sign-in, like the old locked page. It keeps casual visitors
   out of the sign-in screen; what anyone can actually read is still decided by Google sign-in, the
   owner letting them in, and firestore.rules on Google's servers.

   Only a salted check value is stored here (PBKDF2-SHA256, 600,000 rounds, then SHA-256), never the
   password. To change the password, make new values with tools/make_lock.py and paste them below.

   "Keep this device unlocked" saves the derived key in this browser's storage under lead_unlock_v1.
   (gate.js clears the old page's lead_hub_lock_* and lead_hub_sg_* keys, so this one must not use those names.) */
const P = { salt: "8e2XznkZO6IkMNqvIcQrOQ==", it: 600000, check: "cVsJth17x4eNfT6fcmu4svLQuvbWRm4KAQBhozMfREw=" };
const KEY = "lead_unlock_v1";

const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const to64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const store = kind => { try { return window[kind]; } catch (e) { return null; } };
const sha = async raw => to64(await crypto.subtle.digest("SHA-256", raw));

async function derive(pw) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64(P.salt), iterations: P.it, hash: "SHA-256" }, base, 256);
}

/* True when this browser was unlocked before (this tab, or "keep this device unlocked"). */
export async function isUnlocked() {
  if (!(window.crypto && crypto.subtle)) return false;
  for (const kind of ["sessionStorage", "localStorage"]) {
    const s = store(kind), t = s && s.getItem(KEY);
    if (!t) continue;
    try { if (await sha(b64(t)) === P.check) return true; } catch (e) { /* bad value */ }
    try { s.removeItem(KEY); } catch (e) { /* storage blocked */ }
  }
  return false;
}

/* True when `pw` is the team password. Used by the hub to keep signers behind the password too. */
export async function verify(pw) {
  if (!(window.crypto && crypto.subtle) || !pw) return false;
  try { return (await sha(await derive(pw))) === P.check; } catch (e) { return false; }
}

/* Forget the unlock on this device (signing out, or "Lock" in the menu). */
export function lockAgain() {
  for (const kind of ["sessionStorage", "localStorage"]) { const s = store(kind); try { if (s) s.removeItem(KEY); } catch (e) { /* storage blocked */ } }
}

/* Draws the password screen into `box` and resolves once the right password is typed. */
export function lockScreen(box, note) {
  return new Promise(done => {
    const ok = !!(window.crypto && crypto.subtle);
    box.innerHTML = `<h2 id="gateTitle">Enter the team password</h2>
      <p class="gate-muted">LEAD is private to the team. Type the password your coordinator gave you, then sign in.</p>
      <form id="lkForm" novalidate>
        <label for="lkPw">Password</label>
        <input type="password" id="lkPw" autocomplete="current-password" autofocus ${ok ? "" : "disabled"}>
        <label class="gate-check"><input type="checkbox" id="lkKeep"> Keep this device unlocked</label>
        <button class="gate-btn pri" id="lkGo" type="submit" ${ok ? "" : "disabled"}>Open LEAD</button>
      </form>
      <div id="lkMsg" role="alert">${ok ? "" : '<p class="gate-err">This browser is too old to open LEAD. Update it, or use Chrome or Safari.</p>'}</div>
      ${note ? `<p class="gate-demo">${note}</p>` : ""}`;
    const pw = box.querySelector("#lkPw"), go = box.querySelector("#lkGo"), msg = box.querySelector("#lkMsg");
    if (ok) pw.focus({ preventScroll: true });
    box.querySelector("#lkForm").onsubmit = async e => {
      e.preventDefault();
      if (!ok) return;
      if (!pw.value) { msg.innerHTML = '<p class="gate-err">Type the password.</p>'; pw.focus(); return; }
      go.disabled = true; go.textContent = "Checking…"; msg.innerHTML = "";
      try {
        const raw = await derive(pw.value);
        if (await sha(raw) !== P.check) throw new Error("wrong");
        const keep = box.querySelector("#lkKeep").checked, t = to64(raw);
        try { (keep ? localStorage : sessionStorage).setItem(KEY, t); } catch (er) { /* storage blocked: unlocked for this page only */ }
        done();
      } catch (er) {
        go.disabled = false; go.textContent = "Open LEAD";
        msg.innerHTML = '<p class="gate-err">That password didn\'t work. Check it and try again.</p>';
        pw.select();
      }
    };
  });
}
