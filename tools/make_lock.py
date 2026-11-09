#!/usr/bin/env python3
"""Make new check values for the team password (js/lock.js).

    python3 -I tools/make_lock.py

It asks for the new password without showing it, then prints the line to paste over
`const P = {...}` in js/lock.js. The password itself is never written anywhere.
Everyone who kept a device unlocked will be asked for the new password.
"""
import base64
import getpass
import hashlib
import os

pw = getpass.getpass("New team password: ")
if pw != getpass.getpass("Type it again: "):
    raise SystemExit("The two didn't match. Nothing changed.")
if len(pw) < 8:
    raise SystemExit("Use at least 8 characters.")
salt, rounds = os.urandom(16), 600000
key = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, rounds, 32)
check = base64.b64encode(hashlib.sha256(key).digest()).decode()
print(f'const P = {{ salt: "{base64.b64encode(salt).decode()}", it: {rounds}, check: "{check}" }};')
