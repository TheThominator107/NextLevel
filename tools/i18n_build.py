"""Build i18n/es.json from i18n/en.json (id -> English) and i18n/es/*.tsv (lines "id|Spanish").
Spanish templates may use {0|one|many} to pick a word by whether value 0 is 1.
Run after editing translations: python3 tools/i18n_build.py"""
import json, os, glob, re
ROOT = os.path.join(os.path.dirname(__file__), "..")
en = json.load(open(os.path.join(ROOT, "i18n", "en.json")))
es = {}
for f in sorted(glob.glob(os.path.join(ROOT, "i18n", "es", "*.tsv"))):
    for ln in open(f, encoding="utf-8"):
        ln = ln.rstrip("\n")
        if not ln.strip() or ln.startswith("#") or "|" not in ln: continue
        i, t = ln.split("|", 1)
        if i.strip() in en and t.strip(): es[i.strip()] = t.strip()
# extra phrases the app assembles at run time: lines "English<TAB>Spanish" in i18n/es/*.pairs
extra = []
for f in sorted(glob.glob(os.path.join(ROOT, "i18n", "es", "*.pairs"))):
    for ln in open(f, encoding="utf-8"):
        ln = ln.rstrip("\n")
        if "\t" in ln and not ln.startswith("#"): extra.append(ln.split("\t", 1))
d, p, bad = {}, [], []
for e, t in extra:
    if re.search(r"\{\d\}", e): p.append([e, t])
    else: d[e] = t
for i, t in es.items():
    e = en[i]
    if re.search(r"\{\d\}", e):
        if not set(re.findall(r"\{(\d)", t)) <= set(re.findall(r"\{(\d)\}", e)): bad.append(i); continue
        p.append([e, t])
    elif e != t:
        d[e] = t
json.dump({"d": d, "p": p}, open(os.path.join(ROOT, "i18n", "es.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(es)} of {len(en)} translated, {len(extra)} extra phrases ({len(d)} strings, {len(p)} templates)", ("placeholder mismatch: " + ",".join(bad)) if bad else "")
