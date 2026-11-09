#!/usr/bin/env python3
"""Split the single-file LEAD hub into a team web app plus a private data bundle.

    python3 -I tools/split_hub.py "<unlocked hub>.html" <repo dir> <private output dir>

Writes into the repo (safe to publish, no personal data):
    index.html          page shell: styles, markup, sign-in screen
    js/app.js           the hub's code, patched to run on the team database
    js/public-data.js   culture guides and celebrations (public information)

Writes into the private folder (never commit this):
    my-data-east-hartford.json   the research data, signers, contacts and saved work
                                 that used to be baked into the page, as an import bundle

The patches look for code patterns, not personal details, so this file holds no
names, phone numbers or addresses. Lines that named one person are matched by their
exact old wording, which is personal, so that list lives in a private file next to the
hub file: personal-patches.json (never commit it). Every patch must match an exact number of times
or the tool stops, so a changed hub file fails loudly instead of half-working.
"""
import json
import os
import re
import sys

src_path, repo, private_dir = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src_path, encoding="utf-8").read()
dec = json.JSONDecoder()
HOME = "east-hartford"


def die(msg):
    sys.exit("split_hub: " + msg)


# ---------------------------------------------------------------- locate the pieces
scripts = []
for m in re.finditer(r"<script([^>]*)>", s):
    end = s.find("</script>", m.end())
    scripts.append((m.start(), m.end(), end, end + len("</script>")))
if len(scripts) != 5:
    die(f"expected 5 script blocks, found {len(scripts)}")

head = s[: scripts[0][0]]
gap_css = s[scripts[0][3]: scripts[1][0]]          # canvass styles sit between script 1 and 2
app = s[scripts[4][1]: scripts[4][2]]               # the application script


def const_value(text, name):
    m = re.search(r"\bconst\s+" + name + r"\s*=\s*", text)
    if not m:
        die(f"const {name} not found")
    val, end = dec.raw_decode(text, m.end())
    stop = end + 1 if text[end: end + 1] == ";" else end
    return val, m.start(), stop, text[m.end(): end]


REF = const_value(s, "REF")[0]
CV = const_value(s, "CV")[0]
LT = const_value(s, "LT")[0]
SEED = const_value(s, "LOCAL_SEED")[0]

# data that lives inside the application script
moved = {}
for name in ["CU", "CELEB", "BL", "EV_NEW"]:
    val, a, b, raw = const_value(app, name)
    moved[name] = (val, raw)
    # "const A=[...],B={...};" keeps declaring B after A is taken out
    app = app[:a] + ("const " if app[b:b + 1] == "," else "") + app[b + 1 if app[b:b + 1] == "," else b:]
BL, EV_NEW = moved["BL"][0], moved["EV_NEW"][0]

# ---------------------------------------------------------------- styles + markup
styles = re.findall(r"<style[^>]*>(.*?)</style>", head + gap_css, flags=re.S)
markup = re.sub(r"<style[^>]*>.*?</style>", "", head, flags=re.S)
mstart = markup.find("<header")
if mstart < 0:
    die("page markup not found")
markup = markup[mstart:].strip()

# ---------------------------------------------------------------- patches
patch_log = []


def patch(old, new, count=1, regex=False):
    global app
    n = len(re.findall(old, app)) if regex else app.count(old)
    if n != count:
        die(f"patch expected {count} match(es), found {n}: {old[:70]!r}")
    app = re.sub(old, new, app) if regex else app.replace(old, new)
    patch_log.append(f"{n}x {old[:60]!r}")


# The exact old wording of lines that named one person is itself personal, so it is kept in a
# private file next to the hub file (personal-patches.json), never in this public repo.
priv_path = os.path.join(os.path.dirname(os.path.abspath(src_path)), "personal-patches.json")
if not os.path.exists(priv_path):
    die("personal-patches.json was not found next to the hub file: " + priv_path)
with open(priv_path, encoding="utf-8") as f:
    priv = json.load(f)

# 1. Email templates signed off with one person's name and cell. Use whoever is signed in.
for old, new, n in priv["signoff_regex"]:
    patch(old, new, count=n, regex=True)
patch(r'const LT_SIGNOFF="[^"]*";',
      'const LT_SIGNOFF=(()=>{const m=ME();return [m.name,[m.title,m.place].filter(Boolean).join(" · "),[m.phone,m.email].filter(Boolean).join(" · ")].filter(Boolean).join("\\\\n");})();',
      regex=True)
patch(r'const def=\{name:"[^"]*",title:"[^"]*",phone:"(\(\d{3}\) \d{3}-\d{4})",email:""',
      r'const def={name:ME().name,title:ME().title,phone:ME().phone,email:ME().email', regex=True)

# 1b. Templates, AI prompts, greetings and trip notes that named one person or their teammates.
#     Use whoever is signed in, or take dates from the data.
for old, new, n in priv["text"]:
    patch(old, new, count=n)
for word in priv["must_not_contain"]:
    i = app.find(word)
    if i >= 0:
        die("personal details are still in the app code near: " + repr(app[max(0, i - 80): i + 80]))

# 2. The EH Center page named shared org logins. Those come from the team database now.
ct_a = app.find("const CT_TILES=[")
ct_b = app.find("];", ct_a)
if ct_a < 0 or ct_b < 0:
    die("CT_TILES not found")
block = app[ct_a:ct_b]
center_accounts = {}
for addr in sorted(set(re.findall(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", block))):
    key = "acct" + str(len(center_accounts))
    center_accounts[key] = addr
    block = block.replace(addr, '"+CTA("' + key + '")+"')
app = app[:ct_a] + block + app[ct_b:]
patch_log.append(f"{len(center_accounts)} center account names moved to the database")

# 3. Saving: use the team database when the page was opened through the sign-in screen.
patch("async function boot(){if(LOCAL){",
      "async function boot(){if(FB){S.db=FB.db;S.canWrite=true;setStatus();subscribe();return;}if(LOCAL){")
patch('function setStatus(){const d=$("#dot"),t=$("#statusText");',
      'function setStatus(){const d=$("#dot"),t=$("#statusText");if(FB){d.className=S.db?"on":"";t.textContent=S.db?"Saved for the team":"Connecting…";return;}')
patch('$("#footNote").textContent=LOCAL?"Local file. Back up from Settings.":"";',
      '$("#footNote").textContent=(LOCAL&&!FB)?"Local file. Back up from Settings.":"";')
patch('if(!S.db){toast("Not connected. Open this page signed in to claude.ai.");return false;}',
      'if(!S.db){toast(FB?"Still connecting. Try again in a moment.":"Not connected. Open this page signed in to claude.ai.");return false;}')
patch('catch(e){if(e&&e.code==="invalid_argument"',
      'catch(e){if(FB&&e&&e.code==="permission-denied"){toast("Your level can\'t change that. Ask your coordinator.");return false;}if(e&&e.code==="invalid_argument"')
patch('catch(e){toast("Couldn\'t delete: "+(e&&e.message||""));return false;}',
      'catch(e){toast(FB&&e&&e.code==="permission-denied"?"Your level can\'t delete that.":"Couldn\'t delete: "+(e&&e.message||""));return false;}')
patch('${LOCAL?"Everything you enter is saved in this browser only.',
      '${FB?"Everything is saved in the team database, so everyone sees the same thing. Download a backup now and then for safekeeping.":LOCAL?"Everything you enter is saved in this browser only.')

# 4. A one-time clean-up of old due dates must only run for the owner, or every
#    teammate would try to recreate tasks they can't see.
patch("function migrateDue(){if(!S.db", "function migrateDue(){if(FB&&!FB.owner)return;if(!S.db")

# 5. Views follow the signed-in person's level.
patch('const VKEY="lead_hub_view";', 'const VKEY="lead_hub_view"+(FB?":"+FB.email:"");')   # each person keeps their own view on a shared computer
patch('function setView(v){if(!VIEWS[v])v="asst";',
      'function setView(v){if(FB&&!FB.views.includes(v))v=FB.views[0];if(!VIEWS[v])v="asst";')
n_vo = app.count("VIEW_ORDER.map(")
patch("VIEW_ORDER.map(", "(FB?FB.views:VIEW_ORDER).map(", count=n_vo)
patch("function viewBanner(){return ", 'function viewBanner(){if(FB&&!FB.owner)return "";return ')

# 6. Header: names, sign-offs and center links for the signed-in person, plus the role/center setup.
HEADER = r'''/* LEAD — team edition.
   This file holds no personal data. People, contacts, signers and saved work load from the
   team database after sign-in (js/gate.js). FB describes the signed-in person; it is null when
   the page runs as a single local file. */
const FB=window.__FB||null;
function ME(){const m=(FB&&FB.me)||{};const name=m.name||"";return {name,first:name.split(/\s+/)[0]||"",title:m.title||"",phone:m.phone||"",email:m.workEmail||m.email||"",place:m.place||"LEAD Greater Hartford",town:m.town||"East Hartford",city:m.city||"East Hartford, CT"};}
function SIGN_LINES(){const m=ME();return [m.name,m.place,m.phone].filter(Boolean).join("\n");}
function CTA(k){const c=(window.__D&&window.__D.CENTER)||{};return c[k]||"(ask your coordinator)";}
'''
app = HEADER + app

FOOTER = r'''
/* ============ team edition: levels, views and centers (set up before the hub starts) ============ */
const OWNER_ONLY_TABS=["hours","log","settings"];
function fbSetupViews(){
  if(!FB)return;
  const allTabs=[...document.querySelectorAll(".appstrip [data-tab]")].map(b=>b.dataset.tab);
  VIEWS.trial={label:"Trial",hide:[...new Set(VIEWS.canv.hide)]};
  VIEW_NOTE.trial="Trial view: what someone on a trial period sees.";
  const ok=new Set([...(FB.pages||[]),"today","home"]);
  VIEWS.special={label:"Special assignment",hide:allTabs.filter(t=>!ok.has(t))};
  if(!FB.owner)for(const k of Object.keys(VIEWS))VIEWS[k].hide=[...new Set([...VIEWS[k].hide,...OWNER_ONLY_TABS])];
  let savedView=null;try{savedView=localStorage.getItem(VKEY);}catch(e){}
  if(!savedView||!FB.views.includes(S.view))S.view=FB.views[0];
  document.querySelectorAll("[data-viewsel]").forEach(sel=>{sel.innerHTML=FB.views.map(k=>`<option value="${k}">${esc((VIEWS[k]||{}).label||k)}</option>`).join("");const lab=sel.closest(".viewpick,.viewsw");if(lab)lab.hidden=FB.views.length<2;});
  if(S.cv)S.cv.center=FB.cvCenter||"all";
  const sm=document.querySelector(".brand-txt small");if(sm)sm.textContent=FB.centerLabel||"";
}
fbSetupViews();
'''
start_marker = "/* ============ start ============ */"
if app.count(start_marker) != 1:
    die("start marker not found")
TEAM_JS = open(os.path.join(repo, "tools", "team-ui.js"), encoding="utf-8").read()
app = app.replace(start_marker, FOOTER + "\n" + TEAM_JS + "\n" + start_marker)

# 7. Hooks the team code needs: its own page in the page switch, and meeting times.
patch("home:rHome,letters:rLetters})[S.tab]();", "home:rHome,letters:rLetters,resources:rResources})[S.tab]();")
patch('${fmtDate(m.date,true)}${m.with?", with "+esc(m.with):""}', '${fmtDate(m.date,true)}${m.time?" · "+esc(tmClock(m.time)):""}${m.with?", with "+esc(m.with):""}')
patch('const mapsQ=encodeURIComponent((r.address||"")+(r.address&&!/CT/.test(r.address)?", "+townOf(r)+" CT":""));',
      'const mapsQ=encodeURIComponent([r.venue,r.address,(!r.address||!/\\bCT\\b/.test(r.address))?townOf(r)+" CT":""].filter(Boolean).join(", "));')
patch('${r.address?`<a class="btn sm" href="https://www.google.com/maps/dir/?api=1&destination=${mapsQ}"', '${(r.address||r.venue)?`<a class="btn sm" href="https://www.google.com/maps/dir/?api=1&destination=${mapsQ}"')
patch(r'<div class="note"><b>Kelly\'s rule:</b>[^\n]*?</div>\n', '', regex=True)
patch('[["list","List"],["board","Board"],["cal","Calendar"]]', '[["board","Board"],["list","List"],["cal","Calendar"]]')

# 8. The top bar: the LEAD logo instead of the old name, the saved-status pill out at the edge.
def mpatch(old, new, regex=False):
    global markup
    n = len(re.findall(old, markup)) if regex else markup.count(old)
    if n != 1:
        die(f"markup patch expected 1 match, found {n}: {old[:60]!r}")
    markup = re.sub(old, new, markup) if regex else markup.replace(old, new)
mpatch(r'<button class="brand" data-tab="home" id="brandBtn" aria-label="[^"]*">\s*<span class="mark" aria-hidden="true">L</span>\s*<span class="brand-txt"><b>[^<]*</b><small>[^<]*</small></span>\s*</button>',
       '<button class="brand" data-tab="home" id="brandBtn" aria-label="LEAD home"><img class="brand-logo" src="img/lead-wordmark.png" alt="LEAD"><span class="brand-txt"><b>LEAD</b><small></small></span></button>', regex=True)
mpatch('<path d="M15 18l-6-6 6-6"/></svg><span>Home</span>', '<path d="M15 18l-6-6 6-6"/></svg><img class="home-logo" src="img/lead-wordmark.png" alt=""><span>Home</span>')
m_status = re.search(r'\n[ \t]*<span class="status"[^\n]*</span>', markup)
if not m_status:
    die("status pill not found in the top bar")
status_html = m_status.group(0).strip()
markup = markup[:m_status.start()] + markup[m_status.end():]
mpatch(r'(<button class="theme-toggle"[^\n]*</button>)', lambda m: m.group(1) + "\n    " + status_html, regex=True)

# ---------------------------------------------------------------- safety checks on the public files
# Only public organisation numbers and addresses may stay in the code; anything else stops the tool.
PUBLIC_PHONES = {"(860) 206-5495", "(860) 519-7470", "(860) 527-0147"}   # LEAD office, LEAD center, Urban League events line
PUBLIC_EMAILS = {"yourname@ctlead.org", "events@ulgh.org"}              # a placeholder and a public events inbox
digits = lambda p: re.sub(r"\D", "", p)
phones = {digits(p) for p in re.findall(r"(?<![\d.])\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}(?!\d)", app)} - {digits(p) for p in PUBLIC_PHONES}
emails = {e for e in re.findall(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", app)
          if not re.match(r"[\w.+-]+@\d", e)} - PUBLIC_EMAILS                 # skips package tags like leaflet@1.9.4
if phones or emails:
    die(f"refusing to write app.js: {len(phones)} unexpected phone number(s) and {len(emails)} email(s) remain")
if re.search(r"\bLOCAL_SEED\s*=", app):
    die("refusing to write app.js: saved work is still inside it")

# ---------------------------------------------------------------- write the repo files
os.makedirs(os.path.join(repo, "js"), exist_ok=True)
with open(os.path.join(repo, "js", "app.js"), "w", encoding="utf-8") as f:
    f.write(app.strip() + "\n")
with open(os.path.join(repo, "js", "public-data.js"), "w", encoding="utf-8") as f:
    f.write("/* Culture guides and celebrations: public information used by the Cultures page. */\n")
    f.write("const CU=" + moved["CU"][1] + ";\n")
    f.write("const CELEB=" + moved["CELEB"][1] + ";\n")

BUILD = __import__("time").strftime("%Y%m%d%H%M")   # lets browsers fetch the new code after an update
GATE_CSS = open(os.path.join(repo, "tools", "gate.css"), encoding="utf-8").read()
GATE_HTML = open(os.path.join(repo, "tools", "gate.html"), encoding="utf-8").read()
TEAM_CSS = open(os.path.join(repo, "tools", "team.css"), encoding="utf-8").read()
page = (
    "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n"
    "<meta name=\"robots\" content=\"noindex,nofollow\">\n<title>LEAD</title>\n"
    "<meta name=\"theme-color\" content=\"#193069\">\n<link rel=\"icon\" href=\"img/favicon.svg\" type=\"image/svg+xml\">\n"
    "<link rel=\"apple-touch-icon\" href=\"img/apple-touch-icon.png\">\n"
    "<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap\">\n"
    + "".join("<style>" + st + "</style>\n" for st in styles)
    + "<style>" + GATE_CSS + "</style>\n<style>" + TEAM_CSS + "</style>\n</head>\n<body>\n"
    + markup + "\n" + GATE_HTML + "\n"
    + "<script type=\"module\" src=\"js/gate.js?v=" + BUILD + "\"></script>\n</body>\n</html>\n"
)
with open(os.path.join(repo, "index.html"), "w", encoding="utf-8") as f:
    f.write(page)

# ---------------------------------------------------------------- private bundle (stays on this Mac)
core = {
    "REF": {k: v for k, v in REF.items() if k not in ("TARGETS", "BOARD")},
    "EV_NEW": EV_NEW,
    "BL": {k: v for k, v in BL.items() if k not in ("leads", "patch")},
    "LT_meta": LT["meta"],
    "CV": {k: v for k, v in CV.items() if k not in ("signers",)},
}
canvass = {"CV_signers": CV["signers"]}
contacts = {"REF_TARGETS": REF["TARGETS"], "REF_BOARD": REF["BOARD"], "BL_leads": BL["leads"],
            "BL_patch": BL["patch"], "LT_contacts": LT["contacts"], "CENTER": center_accounts}

SCOPED = {"tasks", "due", "edits", "added", "people", "board", "letters", "ready", "proposals", "meetings",
          "team", "shifts", "signers"}
docs = {}
for col, items in SEED.items():
    for did, d in items.items():
        d = dict(d)
        target = col
        if col == "tasks" and d.get("section") == "My role":
            target = "ptasks"
            d["_owner"] = "@OWNER"
        elif col in SCOPED:
            d.setdefault("center", HOME)
        docs.setdefault(target, {})[did] = d

bundle = {
    "kind": "lead-hub-bundle", "version": 1,
    "label": "East Hartford data (from the hub of Nov 5, 2026)",
    "private": True,
    "tiers": [{"tier": "core", "center": HOME, "data": core},
              {"tier": "canvass", "center": HOME, "data": canvass},
              {"tier": "contacts", "center": HOME, "data": contacts}],
    "docs": docs,
}
os.makedirs(private_dir, exist_ok=True)
out = os.path.join(private_dir, "my-data-east-hartford.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(bundle, f, ensure_ascii=False)

print("patches:")
for p in patch_log:
    print("  ", p)
print(f"app.js {len(app):,} chars · public-data.js · index.html")
print(f"private bundle: {out} ({os.path.getsize(out):,} bytes; "
      f"{sum(len(v) for v in docs.values())} saved records in {len(docs)} collections)")
