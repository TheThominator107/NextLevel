"""Collect the English text shown on the site into i18n/en.json (id -> text).
Placeholders for ${...} inside a sentence become {0}, {1}, ...  Run: python3 tools/i18n_extract.py"""
import re, json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from i18n_lits import literals
ROOT = os.path.join(os.path.dirname(__file__), "..")
JUNK = re.compile(r'^[#./]|[\[\]{}=<>`\\]|^[a-z-]+:[^ ]|^\W*$|\.(js|css|png|svg|mp3|json)\b|^https?:|^[a-z]+[A-Z]\w*$|^[a-z0-9_-]+(/[a-z0-9_-]*)+$|^(np|nb)[.-]')
CSSWORDS = None
def css_words():
    s = open(os.path.join(ROOT, "index.html")).read()
    return set(re.findall(r'\.([a-zA-Z][\w-]*)', s)) | {"btn","sm","primary","ghost","good","warn","plain","bad","num","small","muted","row","stack","card","between","chip","str","imp","cur","open","hidden","true","false","page","polite","button","submit","text","search","date","email","password","number","tel","url","checkbox","radio","on","off","none","auto","name","lazy","async","main","nav","dialog","status","alert","tab","tablist","tabpanel","img","presentation","region","list","listitem","link","menu","group","radiogroup","progressbar","switch","option","complementary","banner","contentinfo","log"}
def keep(p):
    if len(p) < 2 or not re.search(r'[A-Za-z]{2}', p): return False
    if JUNK.search(p): return False
    toks = p.split()
    if all(t in CSSWORDS for t in toks): return False
    if re.fullmatch(r'[a-z][a-z0-9_-]*', p) and p not in ("and","or","to","of","by","at","in","on","with","from","for","the"): 
        # single lowercase token: keep only plain English words (no _ - digits)
        return bool(re.fullmatch(r'[a-z]{3,}', p)) and p not in CSSWORDS
    return True
def frags_from(src, html=False):
    out = []
    lits = [re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', '', src)] if html else literals(src)
    for L in lits:
        L = L.replace('\\n', ' ').replace("\\'", "'").replace('\\"', '"').replace("\\u2019","’")
        for m in re.finditer(r'(?:placeholder|aria-label|title|alt|data-label)="([^"]*)"', L):
            v = m.group(1)
            out.append(v)
        t = re.sub(r'<[^>]*>', '\x01', L)
        for part in t.split('\x01'):
            p = re.sub(r'\s+', ' ', part).strip()
            out.append(p)
    res = []
    for p in out:
        p = p.strip()
        # placeholders
        n = [0]
        def ph(m):
            k = n[0]; n[0] += 1; return "{%d}" % k
        q = re.sub('\x00', ph, p)
        bare = re.sub(r'\{\d+\}', '', q).strip(" ·,.:;()")
        if not keep(bare): continue
        if q.count("{") > 4: continue
        res.append(q)
    return res
def main():
    global CSSWORDS
    CSSWORDS = css_words()
    seen = {}
    for f in ["app.js", "intro.js", "teamdrills.js", "anim.js", "index.html"]:
        src = open(os.path.join(ROOT, f)).read()
        for q in frags_from(src, f.endswith(".html")):
            seen.setdefault(q, f)
    # solo drill instructions live in the database (update 017)
    sql = open(os.path.join(ROOT, "supabase", "migrations", "017_solo_drills.sql")).read()
    for m in re.finditer(r"\$s\$(.*?)\$s\$", sql, re.S):
        t = re.sub(r"\s+", " ", m.group(1)).strip()
        if " " in t and keep(t): seen.setdefault(t, "zz-drill_steps")
    keys = sorted(seen, key=lambda k: (seen[k], k))
    path = os.path.join(ROOT, "i18n", "en.json")
    old = json.load(open(path)) if os.path.exists(path) else {}
    rev = {v: k for k, v in old.items()}
    nxt = max([int(k) for k in old] + [0]) + 1
    out = {}
    for k in keys:
        if k in rev: out[rev[k]] = k
        else: out[str(nxt)] = k; nxt += 1
    json.dump(dict(sorted(out.items(), key=lambda kv: int(kv[0]))), open(path, "w"), ensure_ascii=False, indent=0)
    by = {}
    for k in keys: by[seen[k]] = by.get(seen[k], 0) + 1
    print(len(out), "strings", by, sum(len(v.split()) for v in out.values()), "words")
main()
