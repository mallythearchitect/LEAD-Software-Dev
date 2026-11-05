# LEAD-Software-Dev · LEAD Ops Hub

Malachi's operations hub for LEAD Greater Hartford: Today, Tasks, People & orgs, Events, Canvass (signers, shifts, team), Letters of support, Playbook, and the rest.

**This page is locked with two passwords.** `index.html` is scrambled (AES-256, key made from the password with 600,000 rounds of PBKDF2). The website password opens the hub. Inside it, the Canvass app (signers' names, addresses and phones, and the canvassers' contact details) is scrambled again under a second, stronger Canvass password. The repo only ever holds the locked file.

## Rules
- Never upload the unlocked hub file (`LEAD Ops Hub ….html`) to this repo. Only the `index.html` that the Locker makes.
- Share the password in person or by text, never in this repo, an issue, or a commit message.
- Changing either password: open **LEAD Hub Locker.html** (offline, on your computer), pick the unlocked hub file, set both passwords, and replace `index.html` here with the one it downloads.

## Using it
- Open the site, type the website password. Open Canvass and type the Canvass password. Tick "Keep … unlocked" on your own phone or laptop only.
- Only give the Canvass password to people who need the signer list.
- To lock a device again: Canvass → "Lock it" at the bottom, and open the site with `#lock` at the end of the address.
- Edits (statuses, notes, shifts) save in that browser on that device. They don't sync between people or devices. Use Settings → Backup to move them.

## Turning the site on (one time)
Settings → Pages → Build and deployment: Source "Deploy from a branch", Branch `main`, folder `/ (root)`, Save. The address appears at the top of that page after a minute or two.
