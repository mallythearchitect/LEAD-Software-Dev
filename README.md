# LEAD-Software-Dev · LEAD (the team hub)

LEAD's hub for the whole team: Today, Tasks, People & orgs, Events, Canvass, Letters of support, Playbook and the rest, shared across LEAD's 7 Connecticut centers.

- **The website** is plain files on GitHub Pages (`lead.thebiggercanvas.com`, set by `CNAME`).
- **The front door** is a team password (`js/lock.js` holds only a salted check value; `tools/make_lock.py` makes a new one), then **sign-in** with Google, or a one-time link sent by email (Firebase Authentication).
- **The team's data** lives in a Firestore database, not in this repo.
- **The lock** is `firestore.rules`. The site is public code. What each person can see or change is enforced on Google's servers by those rules, whatever the page does.

This repo holds no personal data: no names, phone numbers, addresses or signers. Keep it that way (see "Never commit" below).

## Levels

| Level | Sees | Can change |
|---|---|---|
| Executive | Every center (picks which ones to add up) | Everything in the centers, goals and settings |
| Coordinator | Every center (picks which ones to add up) | Everything in the centers, goals and settings |
| Assistant Coordinator | Their own center | Their center's work |
| Special Assignment | Only the pages the owner picks, for their center | Those pages |
| Canvasser | Canvass and events for their center | Their own shifts and signers |
| Trial (new hires) | Canvasser pages, for a set number of days (30 by default) | Their own shifts and signers |

The **owner** (the first person to claim the hub) sees and changes everything and runs the owner page (`admin.html`). Centers: Hartford (East Hartford), New Britain, Waterbury, Danbury, Bridgeport, New Haven, Norwich.

## How people get in

1. Someone opens the site and signs in with Google (or asks for an email link).
2. If the owner hasn't added them yet, they see "waiting", and their request shows on the owner page.
3. The owner page compares the name on their Google account with the name list and suggests a level and center. The owner lets them in with one tap ("Let in all" does every close match at once).
4. Assistant Coordinators pick their center the first time (once; the owner can change it later). Coordinators and Executives can pick several centers from the account menu.

## Files

| File | What it does |
|---|---|
| `index.html` | The hub page and the sign-in screen. **Built by `tools/split_hub.py`, don't edit by hand.** |
| `js/app.js`, `js/public-data.js` | The hub itself and public reference lists (culture guides, celebrations). Built by the tool. |
| `js/lock.js` | The team-password screen. Only a salted check value lives here, never the password. |
| `js/gate.js` | Sign-in, waiting and center-picking screens; loads the data the person's level allows, then starts the hub; gives the hub its team pieces (check-ins, the team list, messages, feedback, center codes, the assistant's key). |
| `js/lead-core.js` | Levels, centers, name matching, and a copy of the permission rules used for testing. |
| `js/lead-fb.js` | Talks to Firebase. |
| `js/firebase-config.js` | Which Firebase project to use. These values are meant to be public. |
| `js/demo-data.js` | Made-up demo data for all 7 centers (invented names, 555-01xx phones, example.org emails). |
| `admin.html`, `js/admin.js` | The owner page: waiting list, people, name list, data. |
| `firestore.rules` | The lock. Paste into Firebase console → Firestore → Rules → Publish after every change. |
| `js/dev/mock-fb.js` | A pretend database for testing on your own computer. Only works on `localhost`. |
| `tools/team-ui.js`, `tools/team.css` | The team home (Campaign, My role, Tools & resources, How LEAD runs), the project board, Calendar with the center switcher and keyholder codes, Settings and Who's who for everyone, and the Ask LEAD assistant. Added to `js/app.js` and `index.html` by the build. |
| `tools/make_lock.py`, `tools/make_codes.py` | Make a new team-password check value, or scramble a center's door/Wi-Fi/computer codes with the team password (pasted on the owner page). |
| `tools/split_hub.py`, `tools/gate.*` | The build tool and the sign-in screen's markup and styles. |
| `img/` | LEAD's logo, wordmark and icons. |

## Testing on your own computer (no Firebase needed)

Serve a copy of the folder and open it with `?offline`:

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

Then open `http://localhost:8766/?offline&as=owner`. Swap `owner` for `exec`, `coord`, `asst` (add `&center=danbury`), `special` (add `&pages=today,events`), `canv`, `trial`, `expired`, `nocenter`, `pending` or `noowner` to see each level and screen. The owner page is `http://localhost:8766/admin.html?offline&as=owner`. Add `&reset` to start the pretend database over. Nothing is saved anywhere but that browser tab.

On a Mac, if the server hangs when serving from the Desktop, serve a copy from another folder (macOS asks permission before a program can read the Desktop).

## Rebuilding from the single-file hub

```bash
python3 -I tools/split_hub.py "<unlocked hub>.html" <this repo folder> <private folder>
```

It writes `index.html`, `js/app.js` and `js/public-data.js` here, and the hub's own data (research, contacts, signers) as an import file in the private folder, never here. It needs a private file named `personal-patches.json` next to the hub file: the old wording of lines that named one person, which the tool swaps for whoever is signed in. Every patch must match exactly, so a changed hub file stops the tool instead of half-working.

## The assistant (Ask LEAD)

The corner assistant searches the hub, answers quick questions, takes check-ins, messages between teammates, `/feedback` forms and, once the owner pastes an Anthropic API key on the owner page (Data → Assistant), `/inquiry` questions answered by Claude Sonnet from the hub's own data. The key is stored in the team database (`system/ai`), readable only by people the owner let in; set a spending limit on it in the Anthropic console. It is never in this repo.

## Changing permissions

Change `firestore.rules` and the matching functions in `js/lead-core.js` together (the offline test uses the second). Then publish the rules in the Firebase console.

## Never commit

- The unlocked hub file (`LEAD Ops Hub ….html`), any `.json` data or backup, the name list (`.csv`), `personal-patches.json`.
- Passwords, the team password, center codes, API keys, phone numbers, or anyone's personal details, including in issues and commit messages.

`.gitignore` blocks the usual ones, but check `git status` before every commit.
