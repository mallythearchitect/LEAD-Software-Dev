# LEAD-Software-Dev · LEAD Ops Hub

Malachi's operations hub for LEAD Greater Hartford: Today, Tasks, People & orgs, Events, Canvass (signers, shifts, team), Letters of support, Playbook, and the rest.

**This page is locked.** `index.html` is scrambled with a password (AES-256, key made from the password with 600,000 rounds of PBKDF2). Nothing in it can be read until the right password is typed in the browser. The repo only ever holds the locked file.

## Rules
- Never upload the unlocked hub file (`LEAD Ops Hub ….html`) to this repo. Only the `index.html` that the Locker makes.
- Share the password in person or by text, never in this repo, an issue, or a commit message.
- Changing the password: open **LEAD Hub Locker.html** (offline, on your computer), pick the unlocked hub file, set the new password, and replace `index.html` here with the one it downloads. Everyone then needs the new password.

## Using it
- Open the site, type the password. Tick "Keep this device unlocked" on your own phone or laptop only.
- To lock a device again, open the site with `#lock` at the end of the address.
- Edits (statuses, notes, shifts) save in that browser on that device. They don't sync between people or devices. Use Settings → Backup to move them.

## Turning the site on (one time)
Settings → Pages → Build and deployment: Source "Deploy from a branch", Branch `main`, folder `/ (root)`, Save. The address appears at the top of that page after a minute or two.
