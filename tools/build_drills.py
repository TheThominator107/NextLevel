"""Builds the Home Drills list in app.js and supabase/migrations/028_home_drills_60.sql from tools/drills.py."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
ns = {}; exec(open(os.path.join(HERE, "drills.py")).read(), ns); D = ns["D"]

# retired drills (needed a helper, a goal or a screen): old assignments point at the closest new drill
LEGACY = {"b-targets":"b-laces","b-shield":"b-tight-space","b-1v1-line":"b-change-pace","b-first-step":"b-accel-decel","b-strength":"b-balance",
  "b-stance":"b-defend-approach","b-block-tackle":"b-defend-approach","b-press-cover":"b-recovery","b-defend-2v1":"b-jockey","b-scan-switch":"b-scan",
  "b-color-gates":"b-scan","b-talk":"b-wall-pass","b-call-ball":"b-wall-pass","b-crossing":"b-long-pass","b-angle-finish":"b-first-time",
  "b-1v1-recover":"b-dribble-shoot","g-set-catch":"g-w-catch","g-scoop":"g-w-catch","g-cross-catch":"g-w-catch","g-come-stay":"g-angles",
  "g-breakaway":"g-low-dive","g-penalties":"g-low-dive","g-top-corner":"g-low-dive","g-back-pass":"g-distribution",
  # retired in the 60-drill update (Nov 2026)
  "b-pull-push":"b-v-pull","b-juggle-basics":"b-juggle","b-weak-foot":"b-wall-pass","b-tight-space":"b-receive-turn",
  "b-switch-play":"b-scan","b-long-pass":"b-driven-pass","b-box-dribble":"b-cone-weave","b-speed-dribble":"b-push-stop",
  "b-chip":"b-curl","b-weak-finish":"b-laces","b-game-sim":"b-first-time","g-roll-out":"g-goal-kicks","g-distribution":"g-goal-kicks"}
RETIRED_NOV26 = ["b-pull-push","b-juggle-basics","b-weak-foot","b-tight-space","b-switch-play","b-long-pass","b-box-dribble",
  "b-speed-dribble","b-chip","b-weak-finish","b-game-sim","g-roll-out","g-distribution"]
ids = {d["id"] for d in D}
# follow chains so every retired id points straight at a current drill
for k in LEGACY:
    v = LEGACY[k]
    while v not in ids: v = LEGACY[v]
    LEGACY[k] = v
assert all(v in ids for v in LEGACY.values()) and not (set(LEGACY) & ids)
assert len(D) == 60, len(D)
# both feet for every drill with a ball; keepers work both sides
def feet(d): return "sides" if d["gk"] else ("both" if "Ball" in d["eq"] else "")

def js(v): return json.dumps(v, ensure_ascii=False)
rows = []
for d in D:
    o = {"id":d["id"],"title":d["title"],"category":d["cat"],"minutes":d["mins"],"equipment":d["eq"],"level":d["lvl"],"skills":d["skills"],"tags":d["tags"],"goal":d["goal"],"improves":d["improves"]}
    if feet(d): o["feet"] = feet(d)
    if d["gk"]: o["gk"] = True
    if d["free"]:
        o = {"free":True, **o, "setup":d["setup"], "steps":d["steps"], "reps":d["reps"], "points":d["points"], "easier":d["easier"], "harder":d["harder"]}
    rows.append("  {" + ",".join(f"{k}:{js(v)}" for k, v in o.items()) + "}")
block = ("const BUILTIN_DRILLS = [\n  /* Home Drills: 60 solo drills for ages 10 to 18 with a ball, a few cones and a wall. Built from tools/drills.py; edit that file, not this list. */\n"
         + ",\n".join(rows) + "\n];\n/* drills that were retired: old assignments open the closest current drill */\nconst LEGACY_DRILLS = " + js(LEGACY) + ";")
p = os.path.join(ROOT, "app.js"); s = open(p).read()
a = s.index("const BUILTIN_DRILLS = [")
b = s.index("\n", s.index("const LEGACY_DRILLS")) if "const LEGACY_DRILLS" in s else s.index("];", a) + 2
s = s[:a] + block + s[b:]
open(p, "w").write(s)

q = lambda t: "$s$" + t + "$s$"
arr = lambda xs: "array[" + ", ".join(q(x) for x in xs) + "]::text[]"
vals = ",\n".join(f"  ({q(d['id'])}, {q(d['setup'])}, {arr(d['steps'])}, {q(d['reps'])}, {arr(d['points'])}, {q(d['easier'])}, {q(d['harder'])})" for d in D)
sql = f"""-- NextPass update 028: the 60-drill Home Drills library (solo drills for ages 10 to 18, done alone with a ball, cones and a wall)
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once. Needs update 017.
-- Replaces the instructions for every home drill: setup, steps, sets and reps, coaching points and easier / harder versions.
-- 13 drills were retired; coaches' old assignments to them open the closest current drill.

delete from public.drill_steps where drill_id in ({", ".join(q(x) for x in RETIRED_NOV26)});

insert into public.drill_steps (drill_id, setup, steps, reps, points, easier, harder) values
{vals}
on conflict (drill_id) do update set setup = excluded.setup, steps = excluded.steps, reps = excluded.reps,
  points = excluded.points, easier = excluded.easier, harder = excluded.harder;

-- Done. You should see "Success. No rows returned".
"""
open(os.path.join(ROOT, "supabase", "migrations", "028_home_drills_60.sql"), "w").write(sql)
# for the browser tests
json.dump([{"drill_id":d["id"],"steps":d["steps"],"setup":d["setup"],"reps":d["reps"],"points":d["points"],"easier":d["easier"],"harder":d["harder"]} for d in D],
          open("/tmp/drill_steps.json", "w"), ensure_ascii=False)
print(len(D), "drills written")
