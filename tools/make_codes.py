#!/usr/bin/env python3
"""Scramble one center's door, Wi-Fi and computer codes with the team password.

    python3 -I tools/make_codes.py east-hartford

It asks for the team password and each code without showing them, then prints one line of JSON.
Paste that line on the owner page (Data → Center codes) and it is saved in the team database as
codes/<center>. The Calendar page unscrambles it only after a keyholder at that center types the
team password again and ticks "I signed the keyholder agreement".

The password and the codes are never written to disk, to this repo or to the database in a readable
form. (AES-256-GCM; the key comes from the team password with PBKDF2-SHA256, 600,000 rounds.)
"""
import base64
import datetime
import getpass
import hashlib
import json
import os
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

CENTERS = ["east-hartford", "new-britain", "waterbury", "danbury", "bridgeport", "new-haven", "norwich"]
FIELDS = [("door", "Door lockbox PIN"), ("wifi", "Wi-Fi password"), ("mac", "Laptop & iCloud password"), ("cart", "Computer cart password")]

center = sys.argv[1] if len(sys.argv) > 1 else ""
if center not in CENTERS:
    sys.exit("Which center? One of: " + ", ".join(CENTERS))
# Typed at the keyboard normally; a script can pipe the answers in, one per line.
ask = getpass.getpass if sys.stdin.isatty() else (lambda prompt: sys.stdin.readline().rstrip("\n"))
pw = ask("Team password: ")
if not pw:
    sys.exit("No password typed. Nothing made.")
codes = {}
for key, label in FIELDS:
    v = ask(f"{label} (leave empty to skip): ").strip()
    if v:
        codes[key] = v
if not codes:
    sys.exit("No codes typed. Nothing made.")
salt, iv, rounds = os.urandom(16), os.urandom(12), 600000
key = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, rounds, 32)
ct = AESGCM(key).encrypt(iv, json.dumps(codes).encode("utf-8"), None)
b64 = lambda x: base64.b64encode(x).decode()
print(json.dumps({"v": 1, "center": center, "salt": b64(salt), "iv": b64(iv), "ct": b64(ct), "it": rounds,
                  "fields": list(codes), "at": datetime.date.today().isoformat()}))
