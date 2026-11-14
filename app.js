import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
"use strict";
const APP_NAME = "NextPlay";

const FIELD_SKILLS = [
  {k:"first_touch",label:"First Touch",group:"Technical"},
  {k:"passing",label:"Passing",group:"Technical"},
  {k:"shooting",label:"Shooting",group:"Technical"},
  {k:"dribbling",label:"Dribbling",group:"Technical"},
  {k:"physicality",label:"Physicality",group:"Speed & physical"},
  {k:"handling_speed",label:"Handling Speed",group:"Speed & physical"},
  {k:"separation_speed",label:"Separation Speed",group:"Speed & physical"},
  {k:"positional_awareness",label:"Positional Awareness",group:"Tactical"},
  {k:"decision_making",label:"Decision Making",group:"Tactical"},
  {k:"defending",label:"Defending",group:"Tactical"},
  {k:"tactical_understanding",label:"Tactical Understanding",group:"Tactical"},
  {k:"communication",label:"Communication",group:"Mindset"},
  {k:"coachability",label:"Coachability",group:"Mindset"}
];
const GK_SKILLS = [
  {k:"gk_shot_stopping",label:"Shot Stopping",group:"Shot stopping"},
  {k:"gk_diving",label:"Diving",group:"Shot stopping"},
  {k:"gk_positioning",label:"Positioning",group:"Shot stopping"},
  {k:"gk_ball_handling",label:"Ball Handling",group:"With the ball"},
  {k:"gk_distribution",label:"Distribution",group:"With the ball"},
  {k:"gk_decision_making",label:"Decision Making",group:"Mindset"},
  {k:"gk_communication",label:"Communication",group:"Mindset"}
];
const SCALE = {1:"Needs a lot of work", 2:"Developing", 3:"Solid for their level", 4:"Strong", 5:"Excellent"};
const reviewForm = r => (r && r.ratings && Object.keys(r.ratings).some(k => k.startsWith("gk_"))) ? "gk" : "field";
const skillsFor = form => form === "gk" ? GK_SKILLS : FIELD_SKILLS;
const formLabel = form => form === "gk" ? "Goalkeeper review" : "Field player review";
const validRating = v => { const n = Number(v); return n >= 1 && n <= 5 ? n : null; };
function changesBetween(prev, cur){
  if(!prev || !cur || reviewForm(prev) !== reviewForm(cur)) return [];
  return skillsFor(reviewForm(cur)).map(s => ({label:s.label, from:validRating(prev.ratings[s.k]), to:validRating(cur.ratings[s.k])}))
    .filter(c => c.from != null && c.to != null && c.from !== c.to);
}
const changeChip = c => `<span class="chip ${c.to>c.from?"up":"down"}">${esc(c.label)} ${c.from} → ${c.to} ${c.to>c.from?"▲":"▼"}</span>`;
function progressSummary(rs){
  if(rs.length < 2) return "";
  const first = rs[0], last = rs[rs.length-1];
  const o1 = overall(first), o2 = overall(last);
  const ch = changesBetween(first, last).sort((a,b) => (b.to-b.from) - (a.to-a.from));
  const gains = ch.filter(c => c.to > c.from).slice(0,3), drops = ch.filter(c => c.to < c.from).slice(-2);
  const days = Math.max(0, daysSince(first.date) - daysSince(last.date));
  const span = days === 0 ? "on the same day" : days >= 60 ? "over " + Math.round(days/30) + " months" : "over " + days + (days === 1 ? " day" : " days");
  return `<div class="progress-sum stack" style="gap:8px">
    <div class="row between"><b>Since the first review</b><span class="small muted">${rs.length} reviews ${span}</span></div>
    ${o1!=null&&o2!=null ? `<div class="overall"><span class="score num" style="font-size:1.6rem">${fix1(o1)} → ${fix1(o2)}</span><span class="muted">overall</span>${deltaHtml(o2-o1)}</div>` : ""}
    ${gains.length ? `<div class="stack" style="gap:4px"><span class="small muted">Biggest improvements</span><div class="chips">${gains.map(changeChip).join("")}</div></div>` : ""}
    ${drops.length ? `<div class="stack" style="gap:4px"><span class="small muted">Dipped since the first review</span><div class="chips">${drops.map(changeChip).join("")}</div></div>` : ""}
    ${reviewForm(first) !== reviewForm(last) ? `<p class="small muted">The first and latest reviews use different forms (field player and goalkeeper), so only the overall score is compared.</p>` : ""}
  </div>`;
}
function timelineHtml(rs, opts={}){
  if(!rs.length) return '<p class="muted">No reviews yet.</p>';
  const admin = S.me && S.me.role === "admin" && opts.staff;
  return `<div class="tl">${rs.map((r,i) => ({r, prev: rs[i-1]})).reverse().map(({r, prev}) => {
    const o = overall(r), po = overall(prev), ch = changesBetween(prev, r);
    return `<div class="tl-item">
      <div class="row between"><div><b>${fmtDate(r.date)}</b> <span class="small muted">${esc(r.coachName||"Coach")}${prev?"":" · first review"}${reviewForm(r)==="gk"?" · goalkeeper":""}</span></div>
        <div class="row"><span class="score num">${o!=null?fix1(o):"–"}</span>${o!=null&&po!=null?deltaHtml(o-po):""}</div></div>
      ${r.summary ? `<p class="tl-sum">“${esc(r.summary)}”</p>` : ""}
      ${ch.length ? `<div class="chips">${ch.map(changeChip).join("")}</div>` : (prev && reviewForm(prev)===reviewForm(r) ? `<span class="small muted">No rating changes</span>` : "")}
      ${r.note ? `<details><summary class="small">Coach's full note</summary><p class="small" style="margin-top:4px;white-space:pre-wrap">${esc(r.note)}</p></details>` : ""}
      ${opts.discuss && S.me && canMessage(S.players.find(x => x.id === r.playerId)) ? `<div><button class="btn sm" data-act="discussReview" data-player="${esc(r.playerId)}" data-review="${esc(r.id)}">💬 Discuss this review</button></div>` : ""}
      ${admin ? `<div><button class="btn ghost sm" data-act="delReview" data-id="${esc(r.id)}" aria-label="Delete review from ${esc(fmtDate(r.date))}">Delete (admin)</button></div>` : ""}
    </div>`; }).join("")}</div>`;
}
const TAGS = ["First touch","Weak foot","Passing range","Scanning","1v1 attacking","1v1 defending","Finishing","Crossing","Heading","Shielding","Positioning","Decision making","Speed","Work rate","Communication","Confidence on the ball","Leadership","Composure"];
const POSITIONS = ["Goalkeeper","Defender","Midfielder","Forward","Not set"];
const CATS = ["Ball mastery","Passing","Dribbling","Shooting","Defending","Awareness","Speed & agility","Strength","Game understanding","Mindset","Goalkeeping"];

/* skills: review attributes a drill trains (used for recommendations); tags: matching "Work on" tags; gk: goalkeeper drill.
   Step-by-step instructions live in Supabase (drill_steps) behind Home Training; only the free samples carry steps here. */
const BUILTIN_DRILLS = [
  /* ---- first touch & ball mastery ---- */
  {free:true,id:"b-toe-taps",title:"Toe taps",category:"Ball mastery",minutes:5,equipment:"Ball",level:"Beginner",skills:["first_touch","handling_speed"],tags:["Confidence on the ball"],steps:["Ball still in front of you, tap the top with the sole of each foot in turn.","Stay on the balls of your feet and keep your head up.","3 rounds of 30 seconds, 30 seconds rest.","Make it harder: move the ball in a circle while tapping."]},
  {id:"b-sole-roll",title:"Sole rolls and pull-backs",category:"Ball mastery",minutes:8,equipment:"Ball",level:"Beginner",skills:["first_touch","dribbling"],tags:["Confidence on the ball"]},
  {id:"b-juggle",title:"Juggling ladder",category:"Ball mastery",minutes:10,equipment:"Ball",level:"Intermediate",skills:["first_touch"],tags:["First touch","Composure"]},
  {id:"b-first-touch",title:"Open-body first touch",category:"Passing",minutes:10,equipment:"Ball, wall, 2 cones",level:"Intermediate",skills:["first_touch","positional_awareness","decision_making"],tags:["First touch","Composure"]},
  {id:"b-volley",title:"Volleys and half-volleys",category:"Shooting",minutes:10,equipment:"Ball, wall or goal",level:"Advanced",skills:["first_touch","shooting"],tags:["Finishing","Composure"]},

  /* ---- passing ---- */
  {free:true,id:"b-wall-pass",title:"Two-touch wall passes",category:"Passing",minutes:10,equipment:"Ball, wall",level:"Beginner",skills:["passing","first_touch"],tags:["Passing range"],steps:["Stand 3 to 5 yards from a wall.","Pass with the inside of your right foot, take one touch to control, pass again.","Do 25 passes, then switch to your left foot for 25.","Make it harder: step back to 8 yards and use one touch only."]},
  {id:"b-long-pass",title:"Long-pass targets",category:"Passing",minutes:15,equipment:"Ball(s), 4 cones",level:"Advanced",skills:["passing","tactical_understanding"],tags:["Passing range","Crossing"]},
  {id:"b-weak-foot",title:"Weak-foot only",category:"Ball mastery",minutes:15,equipment:"Ball",level:"Intermediate",skills:["passing","shooting","dribbling"],tags:["Weak foot"]},

  /* ---- shooting ---- */
  {id:"b-targets",title:"Target finishing",category:"Shooting",minutes:15,equipment:"Ball(s), goal or wall, tape",level:"Beginner",skills:["shooting"],tags:["Finishing"]},
  {id:"b-dribble-shoot",title:"Dribble, set and shoot",category:"Shooting",minutes:12,equipment:"Ball, 3 cones, goal or wall",level:"Intermediate",skills:["shooting","dribbling","decision_making"],tags:["Finishing","1v1 attacking"]},

  /* ---- dribbling & speed with the ball ---- */
  {id:"b-cone-weave",title:"Cone weave dribble",category:"Dribbling",minutes:10,equipment:"Ball, 6 cones (or shoes)",level:"Beginner",skills:["dribbling","handling_speed"],tags:["Confidence on the ball"]},
  {id:"b-speed-dribble",title:"Speed dribble races",category:"Dribbling",minutes:10,equipment:"Ball, 2 cones, timer",level:"Intermediate",skills:["handling_speed","dribbling","separation_speed"],tags:["Speed"]},
  {id:"b-change-pace",title:"Change of pace and direction",category:"Dribbling",minutes:10,equipment:"Ball, 4 cones",level:"Intermediate",skills:["separation_speed","dribbling","handling_speed"],tags:["1v1 attacking","Speed"]},
  {id:"b-shield",title:"Shield the ball",category:"Dribbling",minutes:10,equipment:"Ball, a helper",level:"Intermediate",skills:["physicality","dribbling"],tags:["Shielding"]},
  {id:"b-1v1-line",title:"1v1 to the line",category:"Dribbling",minutes:12,equipment:"Ball, 4 cones, a helper",level:"Advanced",skills:["dribbling","defending","separation_speed"],tags:["1v1 attacking","1v1 defending"]},

  /* ---- speed & strength ---- */
  {id:"b-5-10-5",title:"5-10-5 shuttle",category:"Speed & agility",minutes:10,equipment:"3 cones",level:"Intermediate",skills:["separation_speed","physicality"],tags:["Speed"]},
  {id:"b-first-step",title:"First-step burst",category:"Speed & agility",minutes:8,equipment:"2 cones, a helper (optional)",level:"Intermediate",skills:["separation_speed"],tags:["Speed","1v1 attacking"]},
  {id:"b-strength",title:"Young player strength circuit",category:"Strength",minutes:15,equipment:"None (bodyweight only)",level:"Beginner",skills:["physicality"],tags:["Shielding","Heading"]},
  {id:"b-recovery",title:"Recovery runs",category:"Defending",minutes:10,equipment:"3 cones",level:"Intermediate",skills:["defending","physicality"],tags:["Work rate"]},

  /* ---- defending ---- */
  {id:"b-jockey",title:"Jockey footwork",category:"Defending",minutes:8,equipment:"2 cones",level:"Beginner",skills:["defending"],tags:["1v1 defending"]},

  /* ---- awareness, decisions, tactics, mindset ---- */
  {id:"b-scan",title:"Shoulder checks",category:"Awareness",minutes:8,equipment:"Ball, wall, a helper",level:"Advanced",skills:["positional_awareness","decision_making","communication"],tags:["Scanning"]},
  {id:"b-color-gates",title:"Colour gate decisions",category:"Awareness",minutes:10,equipment:"Ball, 6 cones in 3 colours, a helper",level:"Intermediate",skills:["decision_making","positional_awareness","handling_speed"],tags:["Decision making","Scanning"]},
  {id:"b-pro-watch",title:"Watch a pro in your position",category:"Game understanding",minutes:15,equipment:"A match on TV or online",level:"Beginner",skills:["tactical_understanding","positional_awareness","coachability"],tags:["Positioning","Decision making"]},
  {id:"b-draw-shape",title:"Draw the team shape",category:"Game understanding",minutes:10,equipment:"Paper and pen",level:"Intermediate",skills:["tactical_understanding","positional_awareness"],tags:["Positioning"]},
  {id:"b-talk",title:"Talk the game",category:"Mindset",minutes:8,equipment:"Ball, a helper",level:"Beginner",skills:["communication","decision_making"],tags:["Communication","Leadership"]},
  {id:"b-reflect",title:"Session reflection",category:"Mindset",minutes:5,equipment:"Notebook or phone",level:"Beginner",skills:["coachability","communication"],tags:["Work rate","Leadership"]},

  /* ---- goalkeepers ---- */
  {id:"g-set-catch",title:"Set position and catch",category:"Goalkeeping",minutes:10,equipment:"Ball, a helper",level:"Beginner",gk:true,skills:["gk_ball_handling","gk_shot_stopping","gk_positioning"],tags:[]},
  {id:"g-w-catch",title:"W-catch, basket and scoop",category:"Goalkeeping",minutes:8,equipment:"Ball, wall",level:"Beginner",gk:true,skills:["gk_ball_handling"],tags:[]},
  {id:"g-collapse",title:"Collapse dive progression",category:"Goalkeeping",minutes:12,equipment:"Ball, soft grass or a mat, a helper",level:"Intermediate",gk:true,skills:["gk_diving","gk_shot_stopping"],tags:[]},
  {id:"g-reaction",title:"Reaction saves",category:"Goalkeeping",minutes:8,equipment:"Tennis ball or ball, wall",level:"Advanced",gk:true,skills:["gk_shot_stopping","gk_diving"],tags:[]},
  {id:"g-angles",title:"Narrow the angle",category:"Goalkeeping",minutes:10,equipment:"4 cones or markers",level:"Advanced",gk:true,skills:["gk_positioning","gk_decision_making"],tags:["Positioning"]},
  {id:"g-shuffle",title:"Shuffle and set",category:"Goalkeeping",minutes:8,equipment:"2 cones, a ball",level:"Beginner",gk:true,skills:["gk_positioning","gk_shot_stopping"],tags:[]},
  {id:"g-distribution",title:"Distribution targets",category:"Goalkeeping",minutes:15,equipment:"Ball(s), 2 cones or a helper",level:"Intermediate",gk:true,skills:["gk_distribution"],tags:["Passing range"]},
  {id:"g-come-stay",title:"Come or stay?",category:"Goalkeeping",minutes:10,equipment:"Ball, a helper",level:"Advanced",gk:true,skills:["gk_decision_making","gk_communication"],tags:["Decision making","Communication"]},
  {id:"g-organiser",title:"Organiser calls",category:"Goalkeeping",minutes:10,equipment:"A match on TV or online",level:"Advanced",gk:true,skills:["gk_communication","gk_positioning"],tags:["Communication","Leadership"]}
];

const S = {
  db:null, user:null, uid:null, canWrite:true, me:undefined, club:null,
  teams:[], players:[], reviews:[], assignments:[], drills:[], members:[],
  view:null, playerId:null, childId:null, teamFilter:"all", catFilter:"All",
  chartSkill:"overall", preview:false, loading:true, noDb:false, notice:null, subClubId:undefined,
  profiles:[], comments:[], ptab:"dev", assets:null, publicSlug:null, pub:null,
  messages:[], chatTeam:null, pmessages:[], meetings:[], teamCoaches:[], pmPlayer:null, pmTab:"chat", meetingId:null
};
const APP_URL = location.origin + location.pathname;
const FIELD_POSITIONS = [["GK","Goalkeeper"],["RB","Right Back"],["LB","Left Back"],["CB","Center Back"],["RWB","Right Wingback"],["LWB","Left Wingback"],["CDM","Center Defensive Mid"],["CM","Center Mid"],["CAM","Attacking Mid"],["LM","Left Mid"],["RM","Right Mid"],["RW","Right Wing"],["LW","Left Wing"],["CF","Center Forward"],["ST","Striker"]];
const OLD_POSITIONS = {WB:"Wingback"}; /* positions saved before the list changed */
const positionLabel = k => (FIELD_POSITIONS.find(x => x[0] === k) || [k, OLD_POSITIONS[k] || k])[1];
const posChip = (k, main) => `<span class="chip${main?" str":""}" title="${esc(positionLabel(k))}">${esc(k)}${main?" · main":""}</span>`;
const VIS = {
  public:{label:"Public",cls:"good",icon:"🌐",help:"Anyone with the link sees the Recruitment Profile: photo, positions, academics, recruiting details, career highlights, stats, highlight videos, club history and coach references. Made for college coaches."},
  private:{label:"Private",cls:"plain",icon:"🔒",help:"Anyone with the link only sees the player's name, club and age. Everything else stays with your family and coaches."}
};
const visOf = pr => (pr && pr.visibility === "public") ? "public" : "private";
const ageOf = by => by ? new Date().getFullYear() - Number(by) : null;
/* exact age from the date of birth when there is one */
function playerAge(p){
  if(!p) return null;
  if(p.age != null) return p.age;
  if(p.birthDate){ const b = new Date(p.birthDate + "T00:00:00"), n = new Date(); let a = n.getFullYear() - b.getFullYear();
    if(n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a; }
  return p.birthYear ? ageOf(p.birthYear) : null;
}
const fmtDob = d => d ? new Date(d + "T00:00:00").toLocaleDateString(undefined, {year:"numeric", month:"short", day:"numeric"}) : "";
const profileFor = pid => S.profiles.find(x => x.playerId === pid) || null;
const blobUrl = id => sb ? sb.storage.from("media").getPublicUrl(id).data.publicUrl : "";
const canEditProfile = p => !!(S.me && !isStaff() && (S.me.playerIds||[]).includes(p.id));
async function saveProfile(p, changes, ok){
  const cur = profileFor(p.id);
  const base = cur ? Object.fromEntries(Object.entries(cur).filter(([k]) => k !== "id"))
    : {playerId:p.id, visibility:"private", slug:"p" + makeCode(9).toLowerCase(), positions:[], strengths:[], history:[], videos:[], createdAt:Date.now()};
  return save(() => S.db.doc("profiles/" + p.id).set({...base, ...changes, updatedAt:Date.now()}), ok);
}
function assetErr(e){
  const c = e && e.code;
  if(c === "too_large") return "That file is over 50 MB. Trim the clip or add it as a YouTube or Hudl link instead.";
  if(c === "unsupported_type") return "That file type isn't supported. Use JPG, PNG or WebP for photos and MP4 or WebM for video.";
  if(c === "quota_or_state") return "Storage is full for now. Remove an old video or use a link instead.";
  if(c === "rate_limited") return "Too many uploads at once. Wait a moment and try again.";
  return "The upload didn't go through. Try again, or use a link for videos.";
}
async function shrinkImage(file){
  try{
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 640 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width*s); c.height = Math.round(bmp.height*s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), "image/jpeg", 0.86));
  } catch(_){ return file; }
}

/* ---------- helpers ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today = () => new Date().toLocaleDateString("en-CA");
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toLocaleDateString("en-CA"); };
const daysSince = iso => Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 864e5);
const fmtDate = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}) : "";
const shortDate = iso => new Date(iso + "T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
const initials = n => String(n||"?").trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase();
const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = n => Array.from({length:n},()=>ALPH[Math.floor(Math.random()*ALPH.length)]).join("");
const isStaff = () => S.me && (S.me.role === "coach" || S.me.role === "admin");
const fix1 = n => (Math.round(n*10)/10).toFixed(1);

function reviewsFor(pid){
  return S.reviews.filter(r => r.playerId === pid)
    .sort((a,b) => String(a.date).localeCompare(String(b.date)) || (a.createdAt||0) - (b.createdAt||0));
}
function overall(r){
  if(!r || !r.ratings) return null;
  const v = skillsFor(reviewForm(r)).map(s => Number(r.ratings[s.k])).filter(x => x >= 1 && x <= 5);
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null;
}
const allDrills = () => BUILTIN_DRILLS.concat(S.drills.map(d => ({...d, custom:true, steps:Array.isArray(d.steps)?d.steps:[]})));
const drillById = id => allDrills().find(d => d.id === id);
const SKILL_LABEL = Object.fromEntries(FIELD_SKILLS.concat(GK_SKILLS).map(s => [s.k, s.label]));
/* coach "Work on" tags -> review attributes */
const TAG_SKILLS = {
  "First touch":["first_touch","gk_ball_handling"], "Weak foot":["passing","shooting","dribbling"], "Passing range":["passing","gk_distribution"],
  "Scanning":["positional_awareness","decision_making"], "1v1 attacking":["dribbling","separation_speed"], "1v1 defending":["defending"],
  "Finishing":["shooting"], "Crossing":["passing"], "Heading":["physicality"], "Shielding":["physicality","dribbling"],
  "Positioning":["positional_awareness","gk_positioning"], "Decision making":["decision_making","gk_decision_making"],
  "Speed":["separation_speed","handling_speed"], "Work rate":["physicality","coachability"],
  "Communication":["communication","gk_communication"], "Confidence on the ball":["dribbling","first_touch"],
  "Leadership":["communication","gk_communication"], "Composure":["decision_making","first_touch"]
};
/* Pick home drills from the latest review: low ratings, ratings that dropped, and the coach's "Work on" tags count most. */
function recommendFor(pid, n = 3){
  const rs = reviewsFor(pid), last = rs[rs.length-1];
  if(!last) return null;
  const prev = rs[rs.length-2], form = reviewForm(last), skills = skillsFor(form);
  const improve = last.improve || [];
  const need = {}, why = {};
  for(const sk of skills){
    const v = validRating(last.ratings[sk.k]); if(v == null) continue;
    need[sk.k] = (5 - v) * 2; why[sk.k] = [`rated ${v}/5`];
    const pv = prev && reviewForm(prev) === form ? validRating(prev.ratings[sk.k]) : null;
    if(pv != null && v < pv){ need[sk.k] += 2; why[sk.k].push(`down from ${pv}`); }
  }
  for(const t of improve) for(const k of (TAG_SKILLS[t] || [])) if(k in need){ need[k] += 3; if(!why[k].some(w => w.startsWith("coach"))) why[k].push(`coach's work-on: ${t}`); }
  const focus = Object.keys(need).filter(k => need[k] > 0).sort((a,b) => need[b] - need[a]).slice(0, 3)
    .map(k => ({k, label:SKILL_LABEL[k], why:why[k]}));
  const assigned = new Set(assignmentsFor(pid).map(a => a.drillId));
  const pool = BUILTIN_DRILLS.filter(d => (form === "gk") === !!d.gk && !assigned.has(d.id));
  const scored = pool.map(d => {
    const hits = (d.skills || []).filter(k => need[k] > 0).sort((a,b) => need[b] - need[a]);
    const tagHits = (d.tags || []).filter(t => improve.includes(t));
    const score = hits.reduce((s,k) => s + need[k], 0) / Math.sqrt((d.skills||[]).length || 1) + tagHits.length * 4;
    const reasons = hits.slice(0, 2).map(k => `${SKILL_LABEL[k]} (${why[k][0]})`);
    if(tagHits.length) reasons.push(`your coach's work-on: ${tagHits.join(", ")}`);
    return {drill:d, score, reasons};
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score);
  /* spread picks across different focus skills */
  const picks = [], covered = new Set();
  for(const x of scored){ const main = (x.drill.skills||[]).find(k => need[k] > 0); if(picks.length < n && !covered.has(main)){ picks.push(x); covered.add(main); } }
  for(const x of scored){ if(picks.length >= n) break; if(!picks.includes(x)) picks.push(x); }
  return {last, focus, picks};
}
function recommendCard(p, opts = {}){
  const R = recommendFor(p.id);
  const head = `<div class="row between"><h2>${opts.title || "Recommended home drills"}</h2><span class="pill good">Based on the coach's review</span></div>`;
  if(!R) return `<div class="card stack rec-card">${head}<p class="muted">Recommendations appear after the coach's first review.</p></div>`;
  if(opts.locked) return `<div class="locked">${head}<p>${R.picks.length} drills picked for ${esc(p.name)} from the latest review, focusing on ${R.focus.map(f => esc(f.label)).join(", ")}.</p><button class="btn primary" data-act="go" data-view="plans">Unlock with Home Training</button></div>`;
  return `<div class="card stack rec-card">${head}
    <p class="small muted">From ${esc(R.last.coachName || "the coach")}'s review on ${fmtDate(R.last.date)}.${R.focus.length ? " Focus areas:" : ""}</p>
    ${R.focus.length ? `<div class="chips">${R.focus.map(f => `<span class="chip imp" title="${esc(f.why.join(", "))}">${esc(f.label)} · ${esc(f.why[0])}</span>`).join("")}</div>` : ""}
    ${R.picks.length ? `<div class="stack">${R.picks.map(x => drillCard(x.drill, {rec:x, recFor:p, staff:opts.staff, family:opts.family, preview:opts.preview})).join("")}</div>`
      : `<p class="muted small">Every matching drill is already in this week's plan.</p>`}
  </div>`;
}
const teamName = id => (S.teams.find(t => t.id === id) || {}).name || "No team";
const assignmentsFor = pid => S.assignments.filter(a => a.playerId === pid && a.active !== false);
const doneThisWeek = a => (Array.isArray(a.done) ? a.done : []).filter(x => x >= weekStart()).length;
function familyHasHome(){
  if(isStaff()) return !!S.club && S.club.familyAccess !== "subscribe";
  return !!(S.me && S.me.familyPlan) || (S.clubs || []).some(c => c.familyAccess !== "subscribe");
}
/* the club a player is on right now (families can have players at different clubs) */
const clubOf = p => !p || !p.clubId ? null : isStaff() ? (S.club && S.club.id === p.clubId ? S.club : null) : (S.clubs || []).find(c => c.id === p.clubId) || null;
const clubNameOf = p => (clubOf(p) || {}).name || "";
/* a current club that isn't on NextPlay, from the profile's club history */
const outsideClub = pr => ((pr && pr.history || []).find(h => h.to === "Present") || {}).club || "";
/* the coach's position, or the family's main position */
const posText = p => p.position && p.position !== "Not set" ? p.position : (((profileFor(p.id) || {}).positions || [])[0] ? positionLabel(profileFor(p.id).positions[0]) : "");
const pendingFor = pid => (S.requests || []).find(r => r.playerId === pid && r.status === "pending");
const pendingRequests = () => (S.requests || []).filter(r => r.status === "pending");
const isCollege = () => !!(S.me && S.me.role === "college");
const newInterest = () => isStaff() || isCollege() ? [] : (S.interest || []).filter(i => i.status === "new");
const RECRUIT_AGE = 16;
const DIVISIONS = ["NCAA D1","NCAA D2","NCAA D3","NAIA","NJCAA"];
const LEAGUES = ["MLS NEXT","ECNL","ECNL Regional League","Girls Academy","USYS National League","NPL","US Club Soccer","High school only","Other"];
function reviewStatus(pid){
  const rs = reviewsFor(pid);
  if(!rs.length) return {cls:"bad",txt:"Not reviewed"};
  const d = daysSince(rs[rs.length-1].date);
  if(d > 30) return {cls:"warn",txt:"Review due"};
  return {cls:"good",txt:"Up to date"};
}
function relDays(iso){
  const d = daysSince(iso);
  if(d <= 0) return "Today"; if(d === 1) return "Yesterday";
  if(d < 30) return d + " days ago";
  return fmtDate(iso);
}

/* ---------- toast ---------- */
let toastT;
function toast(msg, err){
  const el = document.getElementById("toast");
  el.innerHTML = `<div class="toast${err?" err":""}" role="status">${esc(msg)}</div>`;
  clearTimeout(toastT); toastT = setTimeout(()=>{el.innerHTML="";}, 3200);
}
function errMsg(e){
  const c = e && e.code;
  if(e && e.userMessage) return e.userMessage;
  if(c === "invalid_argument") return "You don't have permission to do that.";
  if(c === "quota_exceeded") return "Storage is full. Remove old items and try again.";
  if(c === "resource_exhausted") return "Too many changes at once. Wait a moment and try again.";
  return "Couldn't save right now. Check your connection and try again.";
}
async function save(fn, ok){
  try { await fn(); if(ok) toast(ok); return true; }
  catch(e){ console.error(e); toast(errMsg(e), true); render(); return false; }
}

/* ---------- data (Supabase) ---------- */
let sb = null, channel = null, loadTimer;
const TABLE = {clubs:"clubs", teams:"teams", players:"players", reviews:"reviews", assignments:"assignments", drills:"drills",
  members:"members", profiles:"player_profiles", comments:"comments", messages:"messages",
  pmessages:"private_messages", meetings:"meetings", requests:"join_requests", interest:"recruit_interest", shortlist:"college_shortlist", college:"college_coaches"};
const PK = {profiles:"player_id"};
const TABLE_TO_KEY = Object.fromEntries(Object.entries(TABLE).map(([k,v]) => [v,k]));
TABLE_TO_KEY.clubs = "club"; TABLE_TO_KEY.family_links = "links"; TABLE_TO_KEY.team_coaches = "teamCoaches";

const toCamel = k => k.replace(/_([a-z])/g, (_,c) => c.toUpperCase());
const toSnake = k => k.replace(/[A-Z]/g, c => "_" + c.toLowerCase());
function camel(row){
  if(!row) return row;
  const o = {};
  for(const [k,v] of Object.entries(row)){
    const ck = toCamel(k);
    o[ck] = (/_at$/.test(k) && typeof v === "string") ? new Date(v).getTime() : v;
  }
  return o;
}
function snake(obj){
  const o = {};
  for(const [k,v] of Object.entries(obj)){
    if(k === "id" || k === "playerIds") continue;
    o[toSnake(k)] = (/At$/.test(k) && typeof v === "number") ? new Date(v).toISOString() : v;
  }
  return o;
}
function dbErr(error){
  const e = new Error(error.message || "Database error");
  e.code = (error.code === "42501" || /row-level security|permission denied/i.test(error.message||"")) ? "invalid_argument" : "unavailable";
  return e;
}

/* small adapter so the screens can keep using doc()/collection() */
function docRef(key, id){
  const table = TABLE[key], pk = PK[key] || "id";
  if(!table) throw new Error("Unknown collection " + key);
  const after = () => { if(key === "members") loadMe(); schedule(key); };
  return {
    id,
    async set(data){
      const row = {...snake(data), [pk]: id};
      const {error} = await sb.from(table).upsert(row, {onConflict: pk});
      if(error) throw dbErr(error); after();
    },
    async update(data){
      const {error} = await sb.from(table).update(snake(data)).eq(pk, id);
      if(error) throw dbErr(error); after();
    },
    async delete(){
      const {error} = await sb.from(table).delete().eq(pk, id);
      if(error) throw dbErr(error); after();
    }
  };
}
const DB = {
  doc: path => { const [k, id] = path.split("/"); return docRef(k, id); },
  collection: key => ({ doc: id => docRef(key, id || crypto.randomUUID()) })
};

/* file storage for photos and videos */
const ASSETS = {
  async upload(file, {type, folder}){
    const ext = ({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","video/mp4":"mp4","video/webm":"webm"})[type] || "bin";
    const path = folder + "/" + crypto.randomUUID() + "." + ext;
    const {error} = await sb.storage.from("media").upload(path, file, {contentType:type, upsert:false, cacheControl:"31536000"});
    if(error){
      const m = error.message || "";
      const e = new Error(m);
      e.code = /exceed|too large|size/i.test(m) ? "too_large" : /mime|type/i.test(m) ? "unsupported_type" : "upstream_error";
      throw e;
    }
    return {id: path};
  },
  async delete(id){ await sb.storage.from("media").remove([id]); }
};

/* drill instructions (Home Training) */
async function loadSteps(){
  if(!sb || !S.uid){ S.drillSteps = {}; S.stepsLoaded = false; return; }
  const {data, error} = await sb.from("drill_steps").select("drill_id,steps");
  if(error){ console.warn("drill_steps", error.message); S.drillSteps = {}; S.stepsError = true; S.stepsLoaded = true; render(); return; }
  S.drillSteps = Object.fromEntries((data||[]).map(r => [r.drill_id, r.steps]));
  S.stepsError = false; S.stepsLoaded = true; render();
}

/* loading */
async function loadMe(){
  if(!S.uid){ S.me = undefined; return; }
  const [{data:m, error}, {data:links}] = await Promise.all([
    sb.from("members").select("*").eq("id", S.uid).maybeSingle(),
    sb.from("family_links").select("player_id").eq("member_id", S.uid)
  ]);
  if(error){ S.notice = "Your account couldn't load. Reload the page to try again."; S.loading = false; render(); return; }
  S.me = m ? {...camel(m), playerIds:(links||[]).map(l => l.player_id)} : null;
  S.loading = false; clearTimeout(loadTimer); S.notice = null;
  /* coaches load their club; parent / player accounts load whatever their own players can see */
  const cid = S.me ? (S.me.role === "family" ? "fam:" + S.uid : S.me.role === "college" ? "college:" + S.uid : S.me.clubId) : null;
  if(cid !== S.subClubId) subscribeClub(cid);
  fixView(); render();
  loadSteps();
}

const timers = {};
function schedule(key){
  if(!key) return;
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => loadKey(key), 150);
}
async function loadKey(key){
  const cid = S.subClubId; if(!cid) return;
  const fam = cid.startsWith("fam:"), col = cid.startsWith("college:");
  /* college coaches only load their own profile, shortlist and messages */
  if(col && !["college","shortlist","interest"].includes(key)) return;
  if(!col && (key === "college" || key === "shortlist")) return;
  const byClub = t => fam ? sb.from(t).select("*") : sb.from(t).select("*").eq("club_id", cid);
  let q;
  if(key === "club") q = fam ? sb.rpc("family_clubs") : sb.from("clubs").select("*").eq("id", cid).maybeSingle();
  else if(key === "messages") q = byClub("messages").order("created_at", {ascending:false}).limit(600);
  else if(key === "pmessages") q = byClub("private_messages").order("created_at", {ascending:false}).limit(1500);
  else if(key === "requests") q = byClub("join_requests").order("created_at", {ascending:false}).limit(300);
  else if(key === "interest"){ if(!fam && !col) return; q = sb.from("recruit_interest").select("*").order("created_at", {ascending:false}).limit(300); }
  else if(key === "shortlist") q = sb.rpc("college_shortlist_view");
  else if(key === "college") q = sb.from("college_coaches").select("*").eq("id", S.uid).maybeSingle();
  else if(key === "links") q = sb.from("family_links").select("*");
  else if(key === "teamCoaches") q = sb.from("team_coaches").select("*");
  /* the database's privacy rules pick the rows: profiles and family drills follow the player, not a club */
  else if(TABLE[key] && (fam || key === "members" || key === "profiles" || key === "assignments")) q = sb.from(TABLE[key]).select("*");
  else if(TABLE[key]) q = byClub(TABLE[key]);
  else return;
  const {data, error} = await q;
  if(cid !== S.subClubId) return;
  if(error){ console.error(key, error); S.notice = "Some data couldn't load. Reload the page to try again."; render(); return; }
  if(key === "club" && fam){ const before = JSON.stringify(S.clubs); S.clubs = (Array.isArray(data) ? data : []).map(camel); S.club = null; S.clubLoaded = true; if(before !== JSON.stringify(S.clubs)) loadSteps(); }
  else if(key === "club"){ const before = S.club && S.club.familyAccess; S.club = data ? camel(data) : null; S.clubLoaded = true; if(S.club && before !== undefined && before !== S.club.familyAccess) loadSteps(); }
  else if(key === "messages" || key === "pmessages") S[key] = data.map(camel).reverse();
  else if(key === "links") S.links = data;
  else if(key === "shortlist") S.shortlist = (Array.isArray(data) ? data : []).map(camel);
  else if(key === "college") S.college = data ? camel(data) : null;
  else if(key === "teamCoaches") S.teamCoaches = data || [];
  else S[key] = data.map(camel);
  if(key === "members" || key === "links"){
    const links = S.links || [];
    S.members = S.members.map(m => ({...m, playerIds: links.filter(l => l.member_id === m.id).map(l => l.player_id)}));
  }
  render();
}
function subscribeClub(cid){
  if(channel){ sb.removeChannel(channel); channel = null; }
  S.subClubId = cid; S.clubLoaded = false;
  S.club = null; S.teams = []; S.players = []; S.reviews = []; S.assignments = []; S.drills = []; S.members = []; S.links = [];
  S.profiles = []; S.comments = []; S.messages = []; S.pmessages = []; S.meetings = []; S.teamCoaches = []; S.clubs = []; S.requests = []; S.interest = []; S.shortlist = []; S.scout = null; S.college = null;
  if(!cid) return;
  ALL_KEYS.forEach(k => loadKey(k));
  channel = sb.channel("club-" + cid)
    .on("postgres_changes", {event:"*", schema:"public"}, payload => {
      const key = TABLE_TO_KEY[payload.table];
      if(payload.table === "members" || payload.table === "family_links") loadMe();
      if(payload.table === "family_links") schedule("members");
      /* a player joining or leaving a club changes what else is visible */
      if(payload.table === "players" || payload.table === "join_requests" || payload.table === "recruit_interest") ["club","teams","players","messages","members","drills","profiles","assignments","reviews","comments","requests","interest"].forEach(schedule);
      schedule(key);
    })
    .subscribe();
}
const ALL_KEYS = ["club","teams","players","reviews","assignments","drills","links","members","profiles","comments","messages","pmessages","meetings","teamCoaches","requests","interest","shortlist","college"];
function refreshAll(){ ALL_KEYS.forEach(schedule); }
function fixView(){
  const staffViews = ["roster","player","chat","messages","drills","plans","club"], famViews = ["home","chat","messages","drills","recruit","plans","account"];
  if(!S.me) { S.view = null; return; }
  if(isCollege()){ if(!["scout","shortlist","account"].includes(S.view)) S.view = "scout"; return; }
  const ok = isStaff() ? staffViews : famViews;
  if(!ok.includes(S.view)) S.view = isStaff() ? "roster" : "home";
}

/* ---------- views ---------- */
/* NextPlay wordmark (words only; the standalone mark lives in /brand) */
const logoHtml = () => `<img class="logo-mark" src="brand/mark.svg" alt="" width="36" height="36"><span class="wordmark"><span class="wm-word">Next</span><span class="wm-word wm-play">Play</span></span>`;
const brandSvg = "";

function topbar(){
  let tabs = "";
  if(S.me && (S.club || !isStaff())){
    const items = isStaff()
      ? [["roster","Players"],["chat","Team chat"],["messages","Messages"],["drills","Drill library"],["plans","Plans"],["club","Club"]]
      : isCollege() ? [["scout","Find players"],["shortlist","Shortlist"],["account","Account"]]
      : [["home","My player"],["chat","Team chat"],["messages","Messages"],["drills","Home drills"],["recruit","Recruiting"],["plans","Plans"],["account","Account"]];
    const pmu = totalPmUnread();
    const un = totalUnread();
    const allUnread = un + pmu;
    tabs = `<button type="button" class="menu-btn app-menu-btn" data-act="menu" aria-expanded="${!!S.menuOpen}" aria-controls="app-nav">${S.menuOpen ? "Close" : "Menu"}${!S.menuOpen && allUnread ? `<span class="badge">${allUnread>99?"99+":allUnread}</span>` : ""}</button>
    <nav id="app-nav" class="tabs app-tabs${S.menuOpen ? " open" : ""}" aria-label="Main">${items.map(([v,l]) => `<button data-act="go" data-view="${v}" ${!S.publicPage && (S.view===v || (v==="roster" && S.view==="player")) ? 'aria-current="page"' : ""}>${l}${v==="roster" && pendingRequests().length ? `<span class="badge" aria-label="${pendingRequests().length} join requests">${pendingRequests().length}</span>` : ""}${v==="recruit" && newInterest().length ? `<span class="badge" aria-label="${newInterest().length} new messages from colleges">${newInterest().length}</span>` : ""}${v==="chat" && un ? `<span class="badge" aria-label="${un} unread">${un>99?"99+":un}</span>` : ""}${v==="messages" && pmu ? `<span class="badge" aria-label="${pmu} unread">${pmu>99?"99+":pmu}</span>` : ""}</button>`).join("")}<a href="#contact" class="signout-link" ${S.publicPage==="contact"?'aria-current="page"':""}>Contact</a><button class="signout-link" data-act="signOut">Sign out</button></nav>`;
  }
  return `<header class="top"><div class="top-in">
    <a href="#" class="brand" data-act="home" aria-label="${APP_NAME} home">${logoHtml()}</a>
    ${S.club ? `<span class="clubname">${esc(S.club.name)}</span>` : ""}
    ${!S.uid && !S.noConfig ? publicNav() : (tabs || (S.uid ? `<nav class="tabs"><a href="#contact" class="signout-link">Contact</a><button class="signout-link" data-act="signOut">Sign out</button></nav>` : ""))}
  </div></header>`;
}

function render(){
  const app = document.getElementById("app");
  let body;
  if(S.loading) body = `<div class="card"><p>Loading your club…</p>${S.notice?`<p class="muted small" style="margin-top:8px">${esc(S.notice)}</p>`:""}</div>`;
  else if(S.noConfig) body = setupView();
  else if(S.publicSlug) body = publicView();
  else if(S.publicPage && !(S.uid && S.loading)) body = publicPage();
  else if(S.recovery && S.uid) body = newPasswordView();
  else if(!S.uid) body = authView();
  else if(S.me === null) body = onboarding();
  else if(S.me && isCollege()) body = collegeBody();
  else if(S.me && isStaff() && !S.club) body = S.clubLoaded ? clubMissing() : `<div class="card"><p>Loading your club…</p></div>`;
  else body = viewBody();
  const banners = (S.notice && !S.loading ? `<div class="banner">${esc(S.notice)}</div>` : "");
  const ci = document.getElementById("chat-input");
  const keep = ci ? {v:ci.value, f:document.activeElement===ci, s:ci.selectionStart, e:ci.selectionEnd, ann:(document.getElementById("chat-ann")||{}).checked} : null;
  const th = document.getElementById("thread");
  const atBottom = !th || (th.scrollHeight - th.scrollTop - th.clientHeight < 60);
  const prevScroll = th ? th.scrollTop : 0, prevTeam = S._renderedChatTeam;
  const pi = document.getElementById("pm-input"), pt = document.getElementById("pm-thread");
  const pkeep = pi ? {v:pi.value, f:document.activeElement===pi, s:pi.selectionStart, e:pi.selectionEnd, key:pt ? pt.dataset.key : ""} : null;
  const pAtBottom = !pt || (pt.scrollHeight - pt.scrollTop - pt.clientHeight < 60), pPrevScroll = pt ? pt.scrollTop : 0, pPrevKey = pt ? pt.dataset.key : null;
  app.innerHTML = topbar() + `<main>${banners}${body}</main>` + (!S.uid || S.publicPage ? siteFooter() : "");
  const ci2 = document.getElementById("chat-input");
  if(ci2 && keep && prevTeam === S.chatTeam){ ci2.value = keep.v; const a = document.getElementById("chat-ann"); if(a) a.checked = !!keep.ann; if(keep.f){ ci2.focus(); try{ ci2.setSelectionRange(keep.s, keep.e); }catch(_){} } }
  const th2 = document.getElementById("thread");
  if(th2){ th2.scrollTop = (atBottom || prevTeam !== S.chatTeam) ? th2.scrollHeight : prevScroll; }
  S._renderedChatTeam = S.view === "chat" ? S.chatTeam : null;
  if(S.view === "chat") markRead();
  const pt2 = document.getElementById("pm-thread"), pi2 = document.getElementById("pm-input");
  if(pi2 && pkeep && pt2 && pkeep.key === pt2.dataset.key){ pi2.value = pkeep.v; if(pkeep.f){ pi2.focus(); try{ pi2.setSelectionRange(pkeep.s, pkeep.e); }catch(_){} } }
  if(pt2){ pt2.scrollTop = (pAtBottom || pPrevKey !== pt2.dataset.key) ? pt2.scrollHeight : pPrevScroll; }
  if(S.view === "messages") markPmRead();
}

function viewBody(){
  if(isStaff()){
    switch(S.view){
      case "player": return playerView();
      case "drills": return drillsView();
      case "plans": return plansView();
      case "club": return clubView();
      case "chat": return chatView();
      case "messages": return messagesView();
      default: return rosterView();
    }
  }
  switch(S.view){
    case "drills": return drillsView();
    case "plans": return plansView();
    case "account": return accountView();
    case "recruit": return recruitView();
    case "chat": return chatView();
    case "messages": return messagesView();
    default: return familyHome();
  }
}

function noAccess(){
  return `<div class="card stack" style="max-width:640px">
    <h1>Sign in to use ${APP_NAME}</h1>
    <p>This app saves reviews and drills for your club, so it needs you signed in. Open it from the link you were sent while signed in to Claude.</p>
    <p class="muted small">If you are signed in and still see this, ask the person who shared it to give you Contributor access.</p>
  </div>`;
}

function clubMissing(){
  return `<div class="card stack" style="max-width:640px">
    <h2>Your club can't be found</h2>
    <p>It may have been removed. You can leave it and set up your account again.</p>
    <div><button class="btn" data-act="leave">Set up again</button></div>
  </div>`;
}

function onboarding(){
  const portal = S.portal;
  if(!portal) return `<div class="stack" style="gap:6px"><h1>Welcome to ${APP_NAME}</h1><p class="muted">You're signed in. Which best describes you?</p></div>${portalCards("setPortal")}`;
  if(portal === "college"){
    const edu = /\.edu$/i.test(S.email || "");
    return `<section class="hero">
    <div class="stack">
      <span class="pill plain" style="align-self:flex-start">College coach</span>
      <h1>Set up your program</h1>
      <p style="max-width:52ch">Tell families who you are. They'll see this with every message you send. College recruiting on ${APP_NAME} is free.</p>
      <button type="button" class="btn ghost sm" data-act="setPortal" data-id="" style="align-self:flex-start">I'm not a college coach</button>
    </div>
    <div class="stack">${edu ? `<form class="card stack auth-coach" data-form="collegeStart"><h2>Your program</h2>${collegeFields()}<div><button class="btn primary" type="submit">Start recruiting</button></div></form>`
      : `<div class="card stack"><h2>Use your school email</h2><p>College coach accounts need an email address ending in <b>.edu</b>. You're signed in as <b>${esc(S.email || "")}</b>.</p><p class="small muted">Sign out and create a new account with your school email.</p><div><button class="btn primary" data-act="signOut">Sign out</button></div></div>`}</div>
  </section>`;
  }
  const switcher = `<button type="button" class="btn ghost sm" data-act="setPortal" data-id="${portal==="coach"?"family":"coach"}">${portal==="coach"?"I'm actually a parent or player":"I'm actually a coach"}</button>`;
  if(portal === "family") return `<section class="hero">
    <div class="stack">
      <span class="pill good" style="align-self:flex-start">Parent / Player</span>
      <h1>Set up your player</h1>
      <p style="max-width:52ch">Create your player's profile and find your club. Pick your team and the coach gets a request to add you. Once they approve, you'll see their reviews, home drills and team chat.</p>
      <p class="small muted">The profile belongs to your family. It stays with you if you change teams or clubs. Have more than one child? Add the others later under Account.</p>
    </div>
    <div class="stack">
      <form class="card stack auth-family" data-form="familyStart">
        <h2>About you and your player</h2>
        <label class="f" for="jf-name">Your name<input type="text" id="jf-name" name="name" required maxlength="60" autocomplete="name" placeholder="e.g. Sarah Brandt (Leo's mom)"></label>
        ${playerSetupFields("jf")}
        <div><button class="btn primary" type="submit">Create profile</button></div>
      </form>
      <div>${switcher}</div>
    </div>
  </section>`;
  return `<section class="hero">
    <div class="stack">
      <span class="pill warn" style="align-self:flex-start">Coach</span>
      <h1>Set up your coaching account</h1>
      <p style="max-width:52ch">Starting fresh? Create your club and you become its admin. Joining an existing club? Ask your club admin for the 6-letter club code.</p>
    </div>
    <div class="stack">
      <form class="card stack" data-form="createClub">
        <h2>Start a club</h2>
        <p class="small muted">For club directors setting up ${APP_NAME} for the first time.</p>
        <label class="f" for="cc-name">Your name<input type="text" id="cc-name" name="name" required maxlength="60" autocomplete="name"></label>
        <label class="f" for="cc-club">Club or team name<input type="text" id="cc-club" name="club" required maxlength="80"></label>
        <div><button class="btn primary" type="submit">Create club</button></div>
      </form>
      <form class="card stack" data-form="joinCoach">
        <h2>Join your club</h2>
        <label class="f" for="jc-name">Your name<input type="text" id="jc-name" name="name" required maxlength="60" autocomplete="name"></label>
        <label class="f" for="jc-code">Club code<input type="text" id="jc-code" name="code" required maxlength="12" placeholder="6-letter code" autocapitalize="characters"></label>
        <div><button class="btn primary" type="submit">Join club</button></div>
      </form>
      <div>${switcher}</div>
    </div>
  </section>`;
}

const coachIcon = `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="9" width="30" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M11 25 l5-6 4 3 7-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="27" cy="14" r="2" fill="currentColor"/></svg>`;
const familyIcon = `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="14" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="27" cy="16" r="3.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M5 33c0-6 4-10 9-10s9 4 9 10M21 33c0-4 2.6-7 6-7s6 3 6 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
function portalCards(act){
  return `<div class="portals">
    <button type="button" class="portal coach" data-act="${act}" data-id="coach">
      <span class="picon">${coachIcon}</span>
      <span class="ptitle">Coach</span>
      <span class="pdesc">Review players, assign home drills, write references and run your team chats.</span>
      <span class="pgo">Continue as a coach →</span>
    </button>
    <button type="button" class="portal family" data-act="${act}" data-id="family">
      <span class="picon">${familyIcon}</span>
      <span class="ptitle">Parent / Player</span>
      <span class="pdesc">See your coach's feedback, do your home drills, build your player profile and chat with the team.</span>
      <span class="pgo">Continue as a parent or player →</span>
    </button>
  </div>
  <p class="college-link">College coach? <button type="button" class="linkbtn" data-act="${act}" data-id="college">Find players aged ${RECRUIT_AGE}+, free →</button></p>`;
}

/* roster */
function rosterView(){
  const players = S.players.filter(p => S.teamFilter === "all" || p.teamId === S.teamFilter).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  const due = S.players.filter(p => reviewStatus(p.id).cls !== "good").length;
  let done = 0, target = 0;
  S.assignments.filter(a => a.active !== false).forEach(a => { done += Math.min(doneThisWeek(a), a.perWeek||3); target += (a.perWeek||3); });
  const rows = players.map(p => {
    const rs = reviewsFor(p.id), last = rs[rs.length-1], prev = rs[rs.length-2];
    const o = overall(last), po = overall(prev), st = reviewStatus(p.id);
    const as = assignmentsFor(p.id);
    const wk = as.reduce((s,a)=>s+Math.min(doneThisWeek(a),a.perWeek||3),0), wt = as.reduce((s,a)=>s+(a.perWeek||3),0);
    const d = (o!=null && po!=null) ? o - po : null;
    return `<tr data-act="open" data-id="${esc(p.id)}" tabindex="0">
      <td><div class="pname">${esc(p.name)}</div><div class="small muted">${esc(posText(p))}</div></td>
      <td>${esc(teamName(p.teamId))}</td>
      <td class="num"><span class="score">${o!=null?fix1(o):"–"}</span> ${d!=null?deltaHtml(d):""}</td>
      <td>${last ? relDays(last.date) : '<span class="muted">Never</span>'}</td>
      <td class="num">${wt ? `${wk} of ${wt}` : '<span class="muted">None set</span>'}</td>
      <td><span class="pill ${st.cls}">${st.txt}</span></td>
    </tr>`;
  }).join("");
  return `
  <div class="row between">
    <div class="stack" style="gap:4px"><h1>Players</h1><p class="muted small">Club code for your coaches: <span class="code">${esc(S.club.code)}</span></p></div>
    <div class="row"><button class="btn" data-act="modal" data-m="team">Add team</button></div>
  </div>
  ${requestsCard()}
  <div class="grid3">
    <div class="card tile"><div class="big num">${S.players.length}</div><div class="lbl">Players in ${esc(S.club.name)}</div></div>
    <div class="card tile"><div class="big num" style="color:${due?"var(--warn)":"var(--good)"}">${due}</div><div class="lbl">Need a review (none in 30 days)</div></div>
    <div class="card tile"><div class="big num">${target?Math.round(done/target*100)+"%":"–"}</div><div class="lbl">Home drills done this week${target?` (${done} of ${target})`:""}</div></div>
  </div>
  <div class="card stack">
    <div class="filters" role="group" aria-label="Filter by team">
      <button data-act="team" data-id="all" aria-pressed="${S.teamFilter==="all"}">All teams</button>
      ${S.teams.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(t=>`<button data-act="team" data-id="${esc(t.id)}" aria-pressed="${S.teamFilter===t.id}">${esc(t.name)}</button>`).join("")}
    </div>
    ${players.length ? `<div class="tbl-wrap"><table>
      <thead><tr><th>Player</th><th>Team</th><th>Overall</th><th>Last review</th><th>Home drills this week</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`
      : `<div class="locked"><h3>No players yet</h3><p class="muted">${S.teams.length ? `Families find ${esc(S.club.name)} by name in ${APP_NAME} and ask to join a team. Their requests show up here for you to approve.` : `Add your teams first. Families then find ${esc(S.club.name)} by name and ask to join one.`}</p>${S.teams.length ? "" : `<button class="btn primary" data-act="modal" data-m="team">Add team</button>`}</div>`}
  </div>`;
}

function deltaHtml(d){
  if(Math.abs(d) < 0.05) return "";
  return d > 0 ? `<span class="delta up" aria-label="up ${fix1(d)}">▲ ${fix1(d)}</span>` : `<span class="delta down" aria-label="down ${fix1(-d)}">▼ ${fix1(-d)}</span>`;
}

function ratingsHtml(last, prev){
  if(!last) return `<p class="muted">No review yet.</p>`;
  const form = reviewForm(last);
  let html = `<span class="pill ${form==="gk"?"warn":"plain"}" style="align-self:flex-start">${formLabel(form)}</span>`, g = "";
  for(const s of skillsFor(form)){
    if(s.group !== g){ g = s.group; html += `<div class="rgroup">${g}</div>`; }
    const v = Number(last.ratings[s.k]) || 0, pvRaw = prev && prev.ratings ? Number(prev.ratings[s.k]) : NaN;
    const pv = pvRaw >= 1 && pvRaw <= 5 ? pvRaw : null;
    html += `<div class="rate"><span>${s.label}</span><div class="bar" role="img" aria-label="${v} out of 5, ${esc(SCALE[v]||"not rated")}"><i style="width:${v*20}%"></i></div><span class="num" title="${esc(SCALE[v]||"")}"><span class="score">${v||"–"}</span>${pv!=null && v && v!==pv ? " "+deltaHtml(v-pv) : ""}</span></div>`;
  }
  html += `<p class="small muted" style="margin-top:6px">1 Needs a lot of work · 2 Developing · 3 Solid for their level · 4 Strong · 5 Excellent</p>`;
  return `<div class="stack" style="gap:8px">${html}</div>`;
}

function chartHtml(rs){
  if(rs.length < 2) return `<p class="muted small">The progress chart appears after the second review.</p>`;
  const key = S.chartSkill;
  const latestForm = reviewForm(rs[rs.length-1]);
  const validKey = key === "overall" || skillsFor(latestForm).some(s => s.k === key);
  const k2 = validKey ? key : "overall";
  const pts = rs.map(r => ({d:r.date, v: k2==="overall" ? overall(r) : Number(r.ratings[k2])})).filter(p => p.v >= 1 && p.v <= 5);
  if(pts.length < 2) return `<p class="muted small">Not enough reviews with this rating yet to draw a chart.</p>`;
  const W=560,H=210,L=34,R=16,T=16,B=30, iw=W-L-R, ih=H-T-B;
  const x = i => L + (pts.length===1 ? iw/2 : i*iw/(pts.length-1));
  const y = v => T + ih - (v/5)*ih;
  const grid = [0,1,2,3,4,5].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`).join("");
  const line = pts.map((p,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length-1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const last = pts[pts.length-1];
  const labels = pts.map((p,i)=> (i===0 || i===pts.length-1 || pts.length<=6) ? `<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(shortDate(p.d))}</text>` : "").join("");
  const dots = pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.v)}" r="${i===pts.length-1?5.5:3.5}" fill="${i===pts.length-1?"var(--accent)":"var(--pitch)"}" stroke="var(--surface)" stroke-width="2"><title>${esc(fmtDate(p.d))}: ${fix1(p.v)}</title></circle>`).join("");
  const opts = [["overall","Overall"]].concat(skillsFor(latestForm).map(s=>[s.k,s.label]));
  return `<div class="stack" style="gap:8px">
    <label class="f small" for="chart-skill" style="max-width:260px">Show<select id="chart-skill" data-change="chartSkill">${opts.map(([k,l])=>`<option value="${k}" ${k===k2?"selected":""}>${l}</option>`).join("")}</select></label>
    <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress over ${pts.length} reviews, latest ${fix1(last.v)} out of 5">
      ${grid}<path d="${area}" fill="var(--pitch)" opacity=".12"/><path d="${line}" fill="none" stroke="var(--pitch)" stroke-width="2.5" stroke-linejoin="round"/>${dots}${labels}
      <text x="${Math.min(x(pts.length-1), W-R-4)}" y="${y(last.v)-11}" text-anchor="end" font-size="13" font-weight="700" fill="var(--ink)">${fix1(last.v)}</text>
    </svg></div></div>`;
}

function stepsLocked(){ return !S.uid || (!isStaff() && !familyHasHome()); }
function stepsFor(d){ return (d.steps && d.steps.length) ? d.steps : ((S.drillSteps || {})[d.id] || null); }
function drillStepsHtml(d, opts){
  const st = stepsFor(d);
  if(st) return `<details ${opts.open?"open":""}><summary>How to do it</summary><ol>${st.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></details>`;
  if(S.uid && isStaff() && S.stepsError) return `<p class="small muted">Instructions couldn't load. Ask your club admin to run database update 005.</p>`;
  if(S.uid && !S.stepsLoaded) return `<p class="small muted">Loading instructions…</p>`;
  const target = S.uid ? `data-act="go" data-view="plans"` : `href="#pricing"`;
  const tag = S.uid ? "button" : "a";
  return `<div class="paywall-line"><span>🔒 Step-by-step instructions are part of Home Training</span><${tag} class="btn sm" ${target}>Unlock</${tag}></div>`;
}
const byFamily = a => !!a.assignedBy && S.members.some(m => m.id === a.assignedBy && m.role === "family") || (a.assignedBy === S.uid && S.me && S.me.role === "family");
function drillCard(d, opts={}){
  const a = opts.assignment;
  let foot = "";
  if(a){
    const n = doneThisWeek(a), t = a.perWeek || 3, doneToday = (a.done||[]).includes(today());
    foot = `<div class="row small"><span class="num"><b>${n} of ${t}</b> this week</span><div class="progress" aria-hidden="true"><i style="width:${Math.min(100,n/t*100)}%"></i></div></div>
      ${a.note ? `<p class="small"><b>${byFamily(a) ? "Note" : "Coach"}:</b> ${esc(a.note)}</p>` : ""}
      <div class="row">${opts.family ? `<button class="btn ${doneToday?"":"primary"} sm" data-act="done" data-id="${esc(a.id)}" ${opts.preview?"disabled":""}>${doneToday?"Done today ✓ (undo)":"Mark done today"}</button>` : ""}
      ${opts.staff || (opts.family && a.assignedBy === S.uid && !opts.preview) ? `<button class="btn ghost sm" data-act="unassign" data-id="${esc(a.id)}">Remove</button>` : ""}</div>`;
  } else if(opts.rec){
    const pid = opts.recFor.id;
    foot = `<p class="small rec-why"><b>Why:</b> works on ${esc(opts.rec.reasons.join("; "))}</p>
      <div class="row">${opts.staff ? `<button class="btn sm primary" data-act="modal" data-m="assign" data-player="${esc(pid)}" data-drill="${esc(d.id)}">Assign</button>`
        : opts.family ? `<button class="btn sm primary" data-act="selfAssign" data-player="${esc(pid)}" data-drill="${esc(d.id)}" ${opts.preview?"disabled":""}>Add to my week</button>` : ""}</div>`;
  } else if(opts.assignable){
    foot = `<div class="row"><button class="btn sm" data-act="modal" data-m="assign" data-drill="${esc(d.id)}">Assign to a player</button>${d.custom?`<button class="btn ghost sm" data-act="delDrill" data-id="${esc(d.id)}">Delete</button>`:""}</div>`;
  }
  return `<div class="drill">
    <div class="row between"><h3>${esc(d.title)}</h3><span class="row" style="gap:6px">${d.free && !stepsLocked() ? "" : d.free ? '<span class="pill good">Free sample</span>' : ""}${a && byFamily(a) ? '<span class="pill good">Added from recommendations</span>' : ""}${d.gk?'<span class="pill warn">Goalkeeper</span>':""}${d.custom?'<span class="pill plain">Club drill</span>':""}</span></div>
    <div class="dmeta"><span>${esc(d.category)}</span><span>· ${esc(d.minutes)} min</span><span>· ${esc(d.equipment)}</span><span>· ${esc(levelOf(d))}</span></div>
    ${(d.skills||[]).length ? `<div class="trains small"><span class="muted">Trains:</span> ${(d.skills).map(k => esc(SKILL_LABEL[k] || k)).join(" · ")}</div>` : ""}
    ${drillStepsHtml(d, opts)}
    ${foot}
  </div>`;
}

/* shared player detail used by coach view, family view and preview */
function playerDetail(p, mode){
  const fam = mode !== "staff";
  const preview = mode === "preview";
  const rs = reviewsFor(p.id), last = rs[rs.length-1], prev = rs[rs.length-2];
  const o = overall(last), po = overall(prev);
  const as = assignmentsFor(p.id);
  const home = fam ? familyHasHome() : true;
  const strengths = last ? (last.strengths||[]) : [], improve = last ? (last.improve||[]) : [];

  const reviewCard = `<div class="card stack">
    <div class="row between"><h2>${fam?"Coach's latest review":"Latest review"}</h2>${last?`<span class="muted small">${fmtDate(last.date)}${last.coachName?" · "+esc(last.coachName):""}</span>`:""}</div>
    ${last ? `<div class="overall"><span class="big num">${o!=null?fix1(o):"–"}</span><span class="muted">/ 5 overall</span>${o!=null&&po!=null?deltaHtml(o-po):""}</div>
      ${last.summary ? `<p class="tl-sum">“${esc(last.summary)}”</p>` : ""}
      ${changesBetween(prev, last).length ? `<div class="chips">${changesBetween(prev, last).map(changeChip).join("")}</div>` : ""}
      <div class="stack" style="gap:6px"><h3>Strengths</h3><div class="chips">${strengths.length?strengths.map(t=>`<span class="chip str">${esc(t)}</span>`).join(""):'<span class="muted small">None noted</span>'}</div></div>
      <div class="stack" style="gap:6px"><h3>Work on</h3><div class="chips">${improve.length?improve.map(t=>`<span class="chip imp">${esc(t)}</span>`).join(""):'<span class="muted small">None noted</span>'}</div></div>
      ${last.note?`<div class="note">${esc(last.note)}</div>`:""}`
      : `<p class="muted">${fam?"Your coach hasn't posted a review yet.":"No reviews yet. Start with a first review to set a baseline."}</p>`}
  </div>`;

  const ratingsCard = `<div class="card stack"><h2>Skill ratings</h2>${ratingsHtml(last, prev)}</div>`;

  let drillsCard;
  if(home){
    drillsCard = `<div class="card stack">
      <div class="row between"><h2>Home drills</h2>${!fam?`<button class="btn sm" data-act="modal" data-m="assign" data-player="${esc(p.id)}">Assign drill</button>`:""}</div>
      ${as.length ? `<div class="stack">${as.map(a=>{const d=drillById(a.drillId)||{title:a.drillTitle||"Drill",category:"",minutes:"",equipment:"",level:"",steps:[]};return drillCard(d,{assignment:a,family:fam,staff:!fam,preview});}).join("")}</div>`
        : `<p class="muted">${fam?"No drills assigned yet. Browse the library under Home drills.":"No home drills assigned."}</p>`}
    </div>`;
  } else {
    drillsCard = `<div class="locked"><h2>Home Training</h2><p>Get the drills your coach picks for you, the full drill library and progress charts over time.</p><button class="btn primary" data-act="go" data-view="plans">See Home Training plan</button></div>`;
  }

  const progressCard = home ? `<div class="card stack"><h2>Progress over time</h2>${chartHtml(rs)}</div>` : "";
  const historyCard = (home || !fam) ? `<div class="card stack"><h2>Progress & review timeline</h2>${progressSummary(rs)}${timelineHtml(rs, {staff:!fam, discuss:!preview})}</div>` : `<div class="locked"><h2>Review timeline</h2><p>Every past review is saved. See each update, what changed and progress since the first review with Home Training.</p><button class="btn primary" data-act="go" data-view="plans">See Home Training plan</button></div>`;

  return `<div class="grid2">
    <div class="stack" style="gap:20px">${reviewCard}${drillsCard}${recommendCard(p, {staff:!fam, family:fam, preview, locked: fam && !home, title: fam ? "Recommended for you" : "Suggested home drills"})}</div>
    <div class="stack" style="gap:20px">${ratingsCard}${progressCard}${historyCard}</div>
  </div>`;
}

function playerView(){
  const p = S.players.find(x => x.id === S.playerId);
  if(!p) return `<button class="btn ghost back" data-act="go" data-view="roster">← All players</button><div class="card"><p>This player was removed.</p></div>`;
  const st = reviewStatus(p.id);
  return `<button class="btn ghost back" data-act="go" data-view="roster">← All players</button>
  <div class="card"><div class="row between">
    <div class="phead"><div class="avatar">${esc(initials(p.name))}</div>
      <div class="stack" style="gap:2px"><h1>${esc(p.name)}</h1><p class="muted">${[posText(p), teamName(p.teamId), playerAge(p) != null ? "Age " + playerAge(p) : ""].filter(Boolean).map(esc).join(" · ")}</p>
      <p class="small"><span class="pill ${st.cls}">${st.txt}</span></p></div></div>
    <div class="row">
      <button class="btn" data-act="preview">${S.preview?"Back to coach view":"See what the family sees"}</button>
      ${canMessage(p) ? `<button class="btn" data-act="messageFamily" data-id="${esc(p.id)}">Message family</button>` : ""}
      <button class="btn" data-act="modal" data-m="editPlayer" data-player="${esc(p.id)}">Edit</button>
      <button class="btn primary" data-act="modal" data-m="review" data-player="${esc(p.id)}">${reviewsFor(p.id).length ? "Update review" : "First review"}</button>
    </div>
  </div></div>
  ${subtabs()}
  ${S.preview ? `<div class="banner">Family preview: this is what ${esc(p.name)}'s family sees.${S.club.familyAccess==="subscribe" && S.ptab==="dev"?" Home drills show as locked until the family starts Home Training.":""}</div>` : ""}
  ${S.ptab === "profile" ? profileHtml(p, {staff:!S.preview}) : S.ptab === "recruit" ? recruitHtml(p, {staff:!S.preview}) : playerDetail(p, S.preview ? "preview" : "staff")}`;
}

function familyHome(){
  const ids = (S.me.playerIds || []);
  const kids = S.players.filter(p => ids.includes(p.id));
  if(!kids.length) return `<div class="card stack"><h2>Add your player</h2><p>Create your player's profile first. Then you can find your club and ask to join your team.</p><div><button class="btn primary" data-act="modal" data-m="addChild">Add player</button></div></div>`;
  /* keep the chosen child even if the list hasn't caught up yet */
  const p = kids.find(k => k.id === S.childId) || kids[0];
  const main = ((profileFor(p.id) || {}).positions || [])[0];
  const line = [main ? positionLabel(main) : "", p.clubId ? teamName(p.teamId) : "", clubNameOf(p) || outsideClub(profileFor(p.id))].filter(Boolean).join(" · ");
  return `<div class="card"><div class="row between">
    <div class="phead"><div class="avatar">${esc(initials(p.name))}</div><div class="stack" style="gap:2px"><h1>${esc(p.name)}</h1><p class="muted">${esc(line || "Not on a team yet")}</p></div></div>
    ${kids.length>1 ? `<div class="filters" role="group" aria-label="Choose player">${kids.map(k=>`<button data-act="child" data-id="${esc(k.id)}" aria-pressed="${k.id===p.id}">${esc(k.name)}</button>`).join("")}</div>` : ""}
  </div></div>
  ${teamStatusHtml(p)}
  ${subtabs()}
  ${S.ptab === "profile" ? profileHtml(p, {editable:canEditProfile(p)}) : playerDetail(p, "family")}`;
}

/* family: the player setup form (name, date of birth, position, photo, bio, current club) */
function playerSetupFields(px){
  const today = new Date().toLocaleDateString("en-CA");
  return `<label class="f" for="${px}-player">Player's name<input type="text" id="${px}-player" name="player" required maxlength="60" placeholder="e.g. Leo Brandt"></label>
    <label class="f" for="${px}-dob">Date of birth<input type="date" id="${px}-dob" name="dob" required min="1990-01-01" max="${today}"></label>
    <p class="small muted" style="margin-top:-8px">Only you and your club's coaches see the date. Profiles and requests show the age.</p>
    <label class="f" for="${px}-main">Main position<select id="${px}-main" name="main" required><option value="">Choose…</option>${FIELD_POSITIONS.map(([k,l]) => `<option value="${k}">${k} – ${l}</option>`).join("")}</select></label>
    <fieldset class="plain"><legend class="small"><b>Other positions</b> <span class="muted">(optional)</span></legend>
      <div class="chips">${FIELD_POSITIONS.map(([k,l],i) => `<label class="chipbox" title="${l}"><input type="checkbox" name="pos" value="${k}" id="${px}-pos-${i}"><span>${k}</span></label>`).join("")}</div></fieldset>
    <label class="f" for="${px}-bio">Short bio<textarea id="${px}-bio" name="bio" required maxlength="300" rows="3" placeholder="e.g. Two-footed center mid who loves to switch the play. Trains 3 times a week."></textarea></label>
    <div class="photo-pick"><div class="photo ph" id="${px}-photo-prev" aria-hidden="true">📷</div>
      <div class="stack" style="gap:4px"><label class="btn sm" for="${px}-photo">Add profile picture</label><input type="file" id="${px}-photo" name="photo" accept="image/jpeg,image/png,image/webp,image/gif" data-preview="${px}-photo-prev" hidden><span class="small muted">Optional. You can add or change it later.</span></div></div>
    ${clubPickHtml(px)}`;
}
/* current club: search NextPlay, or name a club that isn't on it yet, or none */
function clubPickHtml(px){
  return `<fieldset class="plain clubpick" data-scope="${px}"><legend><b>Current club</b></legend>
    <div class="seg-choice" role="radiogroup">
      <label class="choice" for="${px}-cm-search"><input type="radio" id="${px}-cm-search" name="clubMode" value="search" checked data-clubmode="${px}"><span><b>Find our club on ${APP_NAME}</b><br><span class="small muted">Pick your team and the coach gets a request to add you.</span></span></label>
      <label class="choice" for="${px}-cm-other"><input type="radio" id="${px}-cm-other" name="clubMode" value="other" data-clubmode="${px}"><span><b>Our club isn't on ${APP_NAME} yet</b><br><span class="small muted">We'll add it to the profile's club history.</span></span></label>
      <label class="choice" for="${px}-cm-none"><input type="radio" id="${px}-cm-none" name="clubMode" value="none" data-clubmode="${px}"><span><b>Not on a club right now</b></span></label>
    </div>
    <div data-mode-panel="search">
      <label class="f" for="${px}-q">Search clubs and teams<input type="search" id="${px}-q" data-input="clubSearch" data-scope="${px}" data-mode="form" maxlength="80" autocomplete="off" placeholder="Club or team name, e.g. Quality U12"></label>
      <div id="${px}-res" class="club-results" aria-live="polite"></div>
      <input type="hidden" name="teamId" id="${px}-team">
      <p class="picked" id="${px}-picked" hidden></p>
    </div>
    <div data-mode-panel="other" hidden>
      <div class="grid2" style="gap:14px">
        <label class="f" for="${px}-oclub">Club name<input type="text" id="${px}-oclub" name="otherClub" maxlength="80"></label>
        <label class="f" for="${px}-oteam">Team (optional)<input type="text" id="${px}-oteam" name="otherTeam" maxlength="60" placeholder="e.g. U12 Boys"></label>
      </div>
    </div>
  </fieldset>`;
}
/* search results, shared by the sign-up form and the Find your team window */
function clubResultsHtml(res, q, mode, px, curTeam){
  if(res == null) return "";
  if(String(q || "").trim().length < 2) return `<p class="small muted">Type at least 2 letters.</p>`;
  if(!res.length) return `<p class="muted small">Nothing matches “${esc(q)}”. Try another spelling, part of the name, or the team's age group. If your club isn't on ${APP_NAME} yet, ${mode === "form" ? "choose “Our club isn't on " + APP_NAME + " yet” above" : "ask your coach to set it up"}.</p>`;
  const words = String(q).toLowerCase().split(/\s+/).filter(Boolean);
  const hit = t => words.some(w => (t.name + " " + (t.age_group || "")).toLowerCase().includes(w));
  return res.map(c => { const teams = (c.teams || []).slice().sort((a,b) => hit(b) - hit(a));
    return `<div class="club-hit"><b>${esc(c.name)}</b>
    ${teams.length ? `<div class="chips">${teams.map(t => { const cur = t.id === curTeam;
      return `<button type="button" class="chip team-pick${hit(t) ? " hit" : ""}" data-act="${mode === "form" ? "clubPick" : "pickTeam"}" data-scope="${esc(px)}" data-club="${esc(c.id)}" data-club-name="${esc(c.name)}" data-team="${esc(t.id)}" data-team-name="${esc(t.name)}"${cur ? " disabled" : ""}>${esc(t.name)}${t.age_group ? ` <span class="muted">${esc(t.age_group)}</span>` : ""}${cur ? " · current" : ""}</button>`; }).join("")}</div>`
      : `<p class="small muted">This club hasn't added its teams yet.</p>`}</div>`; }).join("");
}
let clubSearchTimer = null, clubSearchSeq = 0;
async function runClubSearch(input){
  const q = input.value, px = input.dataset.scope, mode = input.dataset.mode, box = document.getElementById(px + "-res");
  if(!box) return;
  const seq = ++clubSearchSeq;
  if(q.trim().length < 2){ box.innerHTML = q.trim() ? clubResultsHtml([], q, mode, px) : ""; if(mode === "modal" && S.find){ S.find.q = q; S.find.results = null; } return; }
  let res;
  try { res = (await rpc("find_clubs", {q})) || []; } catch(e){ box.innerHTML = `<p class="small muted">Search didn't work. Try again.</p>`; return; }
  if(seq !== clubSearchSeq) return;
  const cur = mode === "modal" && S.find ? (S.players.find(x => x.id === S.find.pid) || {}).teamId : null;
  if(mode === "modal" && S.find){ S.find.q = q; S.find.results = res; }
  box.innerHTML = clubResultsHtml(res, q, mode, px, cur);
}
async function createPlayerFromForm(fd, form, parentName){
  const mode = fd.get("clubMode") || "search", tid = fd.get("teamId");
  const other = String(fd.get("otherClub") || "").trim();
  if(mode === "search" && !tid){ toast("Search for your club and tap your team, or choose one of the other club options.", true); const q = form.querySelector('[data-input="clubSearch"]'); if(q) q.focus(); return null; }
  if(mode === "other" && !other){ toast("Type your club's name.", true); form.querySelector('[name="otherClub"]').focus(); return null; }
  const main = fd.get("main"), positions = [main, ...fd.getAll("pos").filter(k => k !== main)].slice(0, 6);
  const fileIn = form.querySelector('input[type="file"][name="photo"]'), file = fileIn && fileIn.files && fileIn.files[0];
  let pid;
  try {
    if(parentName != null) await rpc("start_family", {my_name:parentName});
    pid = await rpc("create_player", {p_name:String(fd.get("player")).trim(), p_birth_date:fd.get("dob")});
  } catch(e){ toast(errMsg(e), true); return null; }
  let photo = null;
  if(file && S.assets){
    try { const blob = await shrinkImage(file); photo = (await S.assets.upload(blob, {type: blob.type && /^image\/(jpeg|png|webp|gif)$/.test(blob.type) ? blob.type : "image/jpeg", folder:pid})).id; }
    catch(e){ toast("Profile created, but the photo didn't upload: " + assetErr(e), true); }
  }
  const history = mode === "other" ? [{club:other, team:String(fd.get("otherTeam") || "").trim(), from:"", to:"Present", notes:""}] : [];
  await saveProfile({id:pid}, {positions, bio:String(fd.get("bio") || "").trim().slice(0, 600), history, ...(photo ? {photo} : {})}, null);
  let sent = false;
  if(mode === "search"){ try { await rpc("request_team", {pid, tid, p_note:""}); sent = true; } catch(e){ toast(errMsg(e), true); } }
  return {pid, sent};
}

/* family: which team the player is on, or the request waiting for a coach */
function teamStatusHtml(p){
  const pend = pendingFor(p.id);
  const last = (S.requests || []).filter(r => r.playerId === p.id && r.status === "declined").sort((a,b) => (b.decidedAt||0) - (a.decidedAt||0))[0];
  const pendLine = pend ? `<div class="row between req-line"><span>⏳ Request sent to <b>${esc(pend.teamName)}</b> at <b>${esc(pend.clubName)}</b> ${esc(relDays(new Date(pend.createdAt).toLocaleDateString("en-CA")).toLowerCase())}. A coach there will approve it.</span><button class="btn ghost sm" data-act="cancelRequest" data-id="${esc(pend.id)}">Cancel request</button></div>` : "";
  if(p.clubId) return pendLine ? `<div class="card stack team-status">${pendLine}</div>` : "";
  if(pend) return `<div class="card stack team-status">${pendLine}</div>`;
  const declined = last && (!p.clubId) ? `<p class="small muted">${esc(last.clubName)} didn't approve the request for ${esc(last.teamName)}. You can ask again or try another team.</p>` : "";
  return `<div class="card stack team-status"><div class="row between"><div class="stack" style="gap:2px"><h2>Join your team</h2><p class="muted">Find your club, pick ${esc(p.name)}'s team and send a request. Once a coach approves, you'll see their reviews, team chat and messages here.</p>${declined}</div>
    <button class="btn primary" data-act="findTeam" data-player="${esc(p.id)}">Find your team</button></div></div>`;
}

/* family: search clubs by name, pick a team, send the request */
function findTeamModal(){
  const f = S.find || {}; const p = S.players.find(x => x.id === f.pid);
  if(!p) return `<p>Player not found.</p>`;
  if(f.pick) return `<h2>Ask to join ${esc(f.pick.teamName)}</h2>
    <p>${esc(p.name)} → <b>${esc(f.pick.teamName)}</b> at <b>${esc(f.pick.clubName)}</b></p>
    <form data-form="requestTeam" class="stack">
      <label class="f" for="rq-note">Note for the coach (optional)<textarea id="rq-note" name="note" maxlength="500" rows="3" placeholder="e.g. Leo trialed with you in August and plays center mid."></textarea></label>
      <p class="small muted">The coach sees ${esc(p.name)}'s name, age and positions, your name and this note. Reviews and messages stay private until they approve.</p>
      <div class="row"><button class="btn primary" type="submit">Send request</button><button class="btn" type="button" data-act="unpickTeam">Back</button></div>
    </form>`;
  const list = clubResultsHtml(f.results, f.q, "modal", "fc", p.teamId);
  return `<h2>Find ${esc(p.name)}'s team</h2>
    <form data-form="findClub" class="search-row">
      <label class="f" for="fc-q">Search clubs and teams<input type="search" id="fc-q" name="q" maxlength="80" value="${esc(f.q||"")}" placeholder="Club or team name, e.g. Quality U12" autocomplete="off" data-input="clubSearch" data-scope="fc" data-mode="modal"></label>
      <button class="btn primary" type="submit">Search</button>
    </form>
    <div id="fc-res" class="club-results" aria-live="polite">${list}</div>
    <div class="row"><button class="btn" type="button" data-act="close">Close</button></div>`;
}

/* coaches: families asking to join */
function requestsCard(){
  const reqs = pendingRequests();
  if(!reqs.length) return "";
  return `<div class="card stack requests"><h2>Join requests <span class="badge">${reqs.length}</span></h2>
    <p class="small muted">Families found ${esc(S.club.name)} and asked to join a team. Approve to add the player to your roster, or pick a different team first.</p>
    <div class="list">${reqs.map(r => { const age = r.age != null ? r.age : r.birthYear ? ageOf(r.birthYear) : null;
      return `<div class="req">
        <div class="stack" style="gap:4px">
          <span><b>${esc(r.playerName)}</b>${age != null ? ` <span class="muted small">age ${esc(age)}</span>` : ""} ${(r.positions||[]).slice(0,3).map((k,i) => posChip(k, i===0)).join("")}</span>
          <span class="small muted">Asked for <b>${esc(r.teamName || "a team")}</b> · from ${esc(r.requestedByName || "a parent")} · ${esc(relDays(new Date(r.createdAt).toLocaleDateString("en-CA")))}${r.profileSlug ? ` · <a href="#profile-${esc(r.profileSlug)}">Profile</a>` : ""}</span>
          ${r.note ? `<span class="small">“${esc(r.note)}”</span>` : ""}
        </div>
        <form class="row" data-form="approveReq" data-id="${esc(r.id)}">
          <label class="sr-only" for="rq-team-${esc(r.id)}">Team</label>
          <select id="rq-team-${esc(r.id)}" name="teamId">${teamOptions(r.teamId)}</select>
          <button class="btn primary sm" type="submit">Approve</button>
          <button class="btn ghost sm" type="button" data-act="declineReq" data-id="${esc(r.id)}">Decline</button>
        </form>
      </div>`; }).join("")}</div></div>`;
}

function subtabs(){
  const staff = isStaff(), t = S.ptab === "profile" || (staff && S.ptab === "recruit") ? S.ptab : "dev";
  return `<div class="subtabs" role="tablist" aria-label="Player sections">
    <button role="tab" data-act="ptab" data-id="dev" aria-selected="${t==="dev"}">Development</button>
    <button role="tab" data-act="ptab" data-id="profile" aria-selected="${t==="profile"}">Player profile</button>
    ${staff ? `<button role="tab" data-act="ptab" data-id="recruit" aria-selected="${t==="recruit"}">Recruiting</button>` : ""}
  </div>`;
}

function photoHtml(pr, p){
  return pr && pr.photo
    ? `<img class="photo" src="${esc(blobUrl(pr.photo))}" alt="${esc(p.name)}" data-initials="${esc(initials(p.name))}">`
    : `<div class="photo ph" aria-hidden="true">${esc(initials(p.name))}</div>`;
}

/* profile page. opts: editable (family), staff (coach), pub (public view: {refs, clubName}) */
function profileHtml(p, opts){
  const pr = profileFor(p.id) || (opts.pub ? opts.pub.profile : null) || {};
  const ed = !!opts.editable, staff = !!opts.staff, pub = !!opts.pub;
  const vis = VIS[visOf(pr)];
  const positions = pr.positions || [], strengths = pr.strengths || [];
  const history = (pr.history || []).slice().sort((a,b) => (b.to==="Present"?9999:+b.to||0) - (a.to==="Present"?9999:+a.to||0) || (+b.from||0) - (+a.from||0));
  const videos = pr.videos || [];
  const allComments = pub ? opts.pub.refs : S.comments.filter(c => c.playerId === p.id).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const clubName = (pub ? (opts.pub.clubName||"") : clubNameOf(p)) || outsideClub(pr);
  const empty = (msg) => `<p class="muted">${msg}</p>`;

  const head = `<div class="card pcard">
    <div class="photo-wrap">${photoHtml(pr, p)}
      ${ed && !S.assets ? `<span class="small muted">Photo uploads aren't available on this account yet.</span>` : ""}
      ${ed && S.assets ? `<label class="btn sm" for="photo-in">${pr.photo?"Change photo":"Add photo"}</label><input type="file" id="photo-in" accept="image/jpeg,image/png,image/webp,image/gif" data-upload="photo" data-id="${esc(p.id)}" hidden>${pr.photo?`<button class="btn ghost sm" data-act="delPhoto" data-id="${esc(p.id)}">Remove photo</button>`:""}` : ""}
    </div>
    <div class="stack">
      <div class="row between">
        <div class="stack" style="gap:2px"><h1>${esc(p.name)}</h1><p class="muted">${[clubName, p.teamId && p.clubId && !pub ? teamName(p.teamId) : "", playerAge(p) != null ? "Age " + playerAge(p) : "", pr.foot ? pr.foot + " footed" : ""].filter(Boolean).map(esc).join(" · ")}</p></div>
        ${pub ? "" : `<div class="vis"><span class="pill plain" title="The player profile is never public">🔒 Family & coaches only</span></div>`}
      </div>
      <div class="stack" style="gap:6px"><h3>Positions</h3><div class="chips">${positions.length?positions.map((k,i)=>posChip(k,i===0)).join(""):'<span class="muted small">Not added yet</span>'}</div></div>
      <div class="stack" style="gap:6px"><h3>Strengths</h3><div class="chips">${strengths.length?strengths.map(t=>`<span class="chip">${esc(t)}</span>`).join(""):'<span class="muted small">Not added yet</span>'}</div></div>
      ${pr.bio ? `<p style="max-width:65ch">${esc(pr.bio)}</p>` : ""}
      ${ed ? `<div class="row"><button class="btn" data-act="modal" data-m="about" data-player="${esc(p.id)}">Edit positions, strengths & bio</button></div>` : ""}
      ${staff && !pr.updatedAt ? `<p class="small muted">The family hasn't filled in this profile yet. They can do it from their account.</p>` : ""}
    </div>
  </div>`;

  let privCard = "";
  if(!pub){
    const rs = reviewsFor(p.id), last = rs[rs.length-1], prev = rs[rs.length-2];
    const o = overall(last), po = overall(prev);
    privCard = `<div class="card stack private-card">
      <div class="row between"><h2>Coach review</h2><span class="pill plain" title="Never shown on a public profile">🔒 Private</span></div>
      <p class="small muted">Only ${esc(p.name)}, their family and the club's coaches can see this. It never appears on the Recruitment Profile.</p>
      ${last ? `<div class="row between"><div class="overall"><span class="big num">${o!=null?fix1(o):"–"}</span><span class="muted">/ 5 overall</span>${o!=null&&po!=null?deltaHtml(o-po):""}</div><span class="small muted">${fmtDate(last.date)}${last.coachName?" · "+esc(last.coachName):""}</span></div>
        ${last.summary ? `<p class="tl-sum">“${esc(last.summary)}”</p>` : ""}
        ${(last.strengths||[]).length?`<div class="chips">${last.strengths.map(t=>`<span class="chip str">${esc(t)}</span>`).join("")}</div>`:""}
        ${(last.improve||[]).length?`<div class="chips">${last.improve.map(t=>`<span class="chip imp">Work on: ${esc(t)}</span>`).join("")}</div>`:""}
        ${ratingsHtml(last, prev)}
        ${last.note?`<div class="note">${esc(last.note)}</div>`:""}
        ${rs.length>1?`<p class="small muted">${rs.length} reviews so far. See progress over time on the Development tab.</p>`:""}`
      : `<p class="muted">${staff ? "No review yet." : "Your coach hasn't posted a review yet."}</p>`}
      ${staff ? `<div><button class="btn primary sm" data-act="modal" data-m="review" data-player="${esc(p.id)}">${rs.length ? "Update review" : "First review"}</button></div>` : ""}
    </div>`;
  }
  const R = pr.recruit || {};
  const teaser = pub ? "" : `<div class="card stack recruit-teaser">
    <div class="row between"><h2>Recruitment Profile</h2>${R.created ? `<span class="pill ${VIS[visOf(pr)].cls}">${VIS[visOf(pr)].icon} ${VIS[visOf(pr)].label}</span>` : `<span class="pill plain">Not created</span>`}</div>
    <p class="small muted">${R.created ? "Highlight videos, club history, career highlights, season stats and coach references live on the Recruitment Profile."
      : staff ? "The family hasn't created one yet. You can still write references; they show once it's public."
      : "An optional, separate profile for college, academy and club coaches: highlight videos, club history, career highlights, stats and coach references."}</p>
    <div><button class="btn sm${R.created ? "" : " primary"}" ${staff || S.preview ? `data-act="ptab" data-id="recruit"` : `data-act="go" data-view="recruit"`}>${R.created ? "Open Recruitment Profile" : staff ? "Write a reference" : "Create a Recruitment Profile"}</button></div>
  </div>`;
  return `${head}<div class="grid2"><div class="stack" style="gap:20px">${privCard}</div><div class="stack" style="gap:20px">${teaser}</div></div>`;
}

/* the Recruitment Profile: the public profile for college, academy and club coaches.
   opts: editable (family), staff (coach), pub (public view: {profile, refs, clubName}) */
function recruitHtml(p, opts){
  const pr = (opts.pub ? opts.pub.profile : profileFor(p.id)) || {};
  const R = pr.recruit || {};
  const ed = !!opts.editable, staff = !!opts.staff, pub = !!opts.pub;
  const positions = pr.positions || [], strengths = pr.strengths || [];
  const history = (pr.history || []).slice().sort((a,b) => (b.to==="Present"?9999:+b.to||0) - (a.to==="Present"?9999:+a.to||0) || (+b.from||0) - (+a.from||0));
  const videos = pr.videos || [];
  const allComments = pub ? opts.pub.refs : S.comments.filter(c => c.playerId === p.id).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const clubName = (pub ? (opts.pub.clubName||"") : clubNameOf(p)) || outsideClub(pr);
  const empty = (msg) => `<p class="muted">${msg}</p>`;
  const vidCard = `<div class="card stack">
    <div class="row between"><h2>Highlight videos</h2>${ed?`<button class="btn sm" data-act="modal" data-m="video" data-player="${esc(p.id)}">Add video</button>`:""}</div>
    ${videos.length ? `<div class="vgrid">${videos.map((v,i)=>`<div class="vid">
      ${v.asset ? `<video controls preload="metadata" src="${esc(blobUrl(v.asset))}"></video>` : `<a class="vlink" href="${esc(v.link)}" target="_blank" rel="noopener noreferrer">▶ Watch on ${esc(hostOf(v.link))}</a>`}
      <div class="vbody"><b>${esc(v.title||"Highlights")}</b><span class="small muted">${v.date?esc(fmtDate(v.date)):""}</span>${ed?`<div><button class="btn ghost sm" data-act="delVideo" data-id="${esc(p.id)}" data-i="${i}">Remove</button></div>`:""}</div>
    </div>`).join("")}</div>` : empty(ed ? "Upload a clip (up to 50 MB) or add a YouTube, Hudl or Veo link." : "No videos yet.")}
  </div>`;

  const histCard = `<div class="card stack">
    <div class="row between"><h2>Club history</h2>${ed?`<button class="btn sm" data-act="modal" data-m="history" data-player="${esc(p.id)}">Add club</button>`:""}</div>
    ${history.length ? `<div class="timeline">${history.map(h=>{const idx=(pr.history||[]).indexOf(h);return `<div class="titem${h.to==="Present"?" now":""}">
      <div class="row between"><b>${esc(h.club)}</b><span class="small muted num">${esc(h.from||"")}${h.to?" – "+esc(h.to):""}</span></div>
      ${h.team?`<div class="small">${esc(h.team)}</div>`:""}
      ${h.notes?`<p class="small muted" style="margin-top:2px">${esc(h.notes)}</p>`:""}
      ${ed?`<button class="btn ghost sm" data-act="delHistory" data-id="${esc(p.id)}" data-i="${idx}">Remove</button>`:""}
    </div>`;}).join("")}</div>` : empty(ed ? "Add the clubs and teams you've played for, with years." : "No club history yet.")}
  </div>`;

  const comments = allComments.filter(c => pub ? c.kind === "reference" : true);
  const comCard = `<div class="card stack">
    <div class="row between"><h2>${pub?"Coach references":"Coach comments & references"}</h2>${staff?`<button class="btn sm primary" data-act="modal" data-m="comment" data-player="${esc(p.id)}">Write one</button>`:""}</div>
    ${!pub ? `<p class="small muted">References show on the Recruitment Profile when it's public. Comments stay between coaches and the family.</p>` : ""}
    ${comments.length ? comments.map(c=>`<div class="ref ${c.kind==="reference"?"reference":""}">
      <div class="row between"><span class="pill ${c.kind==="reference"?"good":"plain"}">${c.kind==="reference"?"Reference":"Comment"}</span><span class="small muted">${c.date?esc(fmtDate(c.date)):""}</span></div>
      <blockquote>${esc(c.text)}</blockquote>
      <div class="row between"><span class="small"><b>${esc(c.authorName||"Coach")}</b>${c.authorTitle?`, ${esc(c.authorTitle)}`:""}</span>${staff && c.authorId===S.uid?`<button class="btn ghost sm" data-act="delComment" data-id="${esc(c.id)}">Delete</button>`:""}</div>
    </div>`).join("") : empty(staff ? "No comments yet. A reference is what a scout or new coach would read." : pub ? "No references yet." : "No coach comments or references yet.")}
  </div>`;


  const age = playerAge(p);
  if(!pub && (age == null || age < RECRUIT_AGE)){
    const d16 = p.birthDate ? new Date(new Date(p.birthDate + "T00:00:00").setFullYear(new Date(p.birthDate + "T00:00:00").getFullYear() + RECRUIT_AGE)) : null;
    const when = d16 ? d16.toLocaleDateString(undefined, {year:"numeric", month:"long", day:"numeric"}) : "";
    const msg = age == null ? (ed ? "Add the date of birth under Account → Edit first." : "The family hasn't added a date of birth yet.")
      : ed ? `${esc(p.name)} can create one from ${esc(when || "their 16th birthday")}. Until then, keep building the player profile and collecting coach references.`
      : `${esc(p.name)} turns ${RECRUIT_AGE} on ${esc(when || "their 16th birthday")}. References you write now will be ready for it.`;
    return `<div class="card stack recruit-intro"><h2>Recruitment Profiles open at ${RECRUIT_AGE}</h2><p>${msg}</p>
      <p class="small muted">College recruiting on ${APP_NAME} is for players aged ${RECRUIT_AGE} and over.${R.created ? " An earlier Recruitment Profile is hidden until then." : ""}</p></div>${staff ? comCard : ""}`;
  }
  if(!R.created && !pub){
    if(ed) return `<div class="card stack recruit-intro">
      <h2>Create ${esc(p.name)}'s Recruitment Profile</h2>
      <p style="max-width:62ch">One link for college coaches, and an opt-in listing in ${APP_NAME}'s college coach search. It brings together everything a college program looks for:</p>
      <ul class="ticks">
        <li>Class of, high school, GPA, SAT / ACT, intended major and NCAA Eligibility Center ID</li>
        <li>Club league, divisions you're interested in and commitment status</li>
        <li>Height, weight, stronger foot, location and a contact email for coaches</li>
        <li>Career highlights and season stats</li>
        <li>Highlight videos</li>
        <li>Club history</li>
        <li>References from your coaches</li>
      </ul>
      <p class="small muted">It starts private, and you choose when to make it public. Coach reviews, ratings, home drills and messages are never shown on it.</p>
      <div><button class="btn primary" data-act="createRecruit" data-id="${esc(p.id)}">Create Recruitment Profile</button></div>
    </div>`;
    return `<div class="card stack"><h2>Recruitment Profile</h2><p class="muted">${esc(p.name)}'s family hasn't created a Recruitment Profile yet. References you write now will show on it once it's public.</p></div>${comCard}`;
  }

  const facts = [["Class of", R.gradYear], ["GPA", R.gpa], ["SAT / ACT", R.test], ["High school", R.school], ["Club league", R.league], ["Height", R.height], ["Weight", R.weight],
    ["Stronger foot", pr.foot], ["Location", R.location], ["Intended major", R.major], ["NCAA ID", R.ncaaId]].filter(x => x[1]);
  const head = `<div class="card pcard recruit-head">
    <div class="photo-wrap">${photoHtml(pr, p)}</div>
    <div class="stack">
      <div class="row between">
        <div class="stack" style="gap:2px"><span class="eyebrow">Recruitment Profile</span><h1>${esc(p.name)}</h1>
          <p class="muted">${[R.gradYear ? "Class of " + R.gradYear : "", clubName, p.teamId && p.clubId && !pub ? teamName(p.teamId) : "", playerAge(p) != null ? "Age " + playerAge(p) : ""].filter(Boolean).map(esc).join(" · ")}</p></div>
        ${pub ? "" : ed ? visSwitch(p, pr) : `<div class="vis"><span class="pill ${VIS[visOf(pr)].cls}">${VIS[visOf(pr)].icon} ${VIS[visOf(pr)].label}</span></div>`}
      </div>
      ${positions.length || true ? `<div class="chips">${positions.map((k,i) => posChip(k, i===0)).join("")}${R.committed ? `<span class="chip str">✅ Committed${R.committedTo ? " to " + esc(R.committedTo) : ""}</span>` : `<span class="chip open-badge">Uncommitted</span>`}${(R.divisions || []).map(d => `<span class="chip">${esc(d)}</span>`).join("")}</div>` : ""}
      ${R.colleges ? `<p class="small"><b>Interested in:</b> ${esc(R.colleges)}</p>` : ""}
      ${ed ? `<p class="small ${R.searchable && visOf(pr) === "public" ? "" : "muted"}">${R.searchable ? (visOf(pr) === "public" ? "✓ College coaches can find this profile in " + APP_NAME + " search." : "College coach search is on, but the profile is Private, so coaches can't find it yet.") : "College coach search is off. Turn it on under Edit recruiting details so college coaches can find " + esc(p.name) + " and get in touch."}</p>` : ""}
      ${facts.length ? `<div class="facts">${facts.map(([k,v]) => `<div class="fact"><span class="small muted">${k}</span><b>${esc(v)}</b></div>`).join("")}</div>` : ed ? `<p class="small muted">Add graduation year, height, school and more under Edit recruiting details.</p>` : ""}
      ${R.summary || pr.bio ? `<p style="max-width:65ch">${esc(R.summary || pr.bio)}</p>` : ""}
      ${strengths.length ? `<div class="chips">${strengths.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
      ${R.contact ? `<p class="small">📧 College coaches can contact the family at <a href="mailto:${esc(R.contact)}">${esc(R.contact)}</a></p>` : ""}
      ${ed ? `<div class="row"><button class="btn" data-act="modal" data-m="recruitDetails" data-player="${esc(p.id)}">Edit recruiting details</button>${pr.slug ? `<button class="btn ghost sm" data-act="copy" data-text="${esc(APP_URL + "#profile-" + pr.slug)}">Copy profile link</button><a class="btn ghost sm" href="#profile-${esc(pr.slug)}" data-act="previewPublic" data-slug="${esc(pr.slug)}">See what coaches see</a>` : ""}</div>
        <p class="small muted">Photo, positions, strengths and the short bio come from the player profile.</p>` : ""}
    </div>
  </div>`;

  const hls = (R.highlights || []).map((h, i) => ({...h, i})).sort((a,b) => (+b.year||0) - (+a.year||0));
  const hlCard = `<div class="card stack">
    <div class="row between"><h2>Career highlights</h2>${ed ? `<button class="btn sm" data-act="modal" data-m="highlight" data-player="${esc(p.id)}">Add highlight</button>` : ""}</div>
    ${hls.length ? `<div class="list">${hls.map(h => `<div class="hl"><div class="row between"><b>🏆 ${esc(h.title)}</b><span class="small muted num">${esc(h.year || "")}</span></div>${h.details ? `<p class="small muted">${esc(h.details)}</p>` : ""}${ed ? `<div><button class="btn ghost sm" data-act="delHighlight" data-id="${esc(p.id)}" data-i="${h.i}">Remove</button></div>` : ""}</div>`).join("")}</div>`
      : empty(ed ? "Add trophies, selections, awards, captaincies and standout moments." : "No highlights added yet.")}
  </div>`;

  const stats = (R.stats || []).map((x, i) => ({...x, i}));
  const showCs = stats.some(x => x.cleanSheets !== "" && x.cleanSheets != null);
  const statCard = `<div class="card stack">
    <div class="row between"><h2>Season stats</h2>${ed ? `<button class="btn sm" data-act="modal" data-m="stat" data-player="${esc(p.id)}">Add season</button>` : ""}</div>
    ${stats.length ? `<div class="tbl-wrap"><table class="stats"><thead><tr><th>Season</th><th>Team</th><th class="num" title="Games played">GP</th><th class="num" title="Goals">G</th><th class="num" title="Assists">A</th>${showCs ? `<th class="num" title="Clean sheets">CS</th>` : ""}${ed ? "<th></th>" : ""}</tr></thead>
      <tbody>${stats.map(x => `<tr><td>${esc(x.season)}</td><td>${esc(x.team || "")}</td><td class="num">${esc(x.games ?? "")}</td><td class="num">${esc(x.goals ?? "")}</td><td class="num">${esc(x.assists ?? "")}</td>${showCs ? `<td class="num">${esc(x.cleanSheets ?? "")}</td>` : ""}${ed ? `<td><button class="btn ghost sm" data-act="delStat" data-id="${esc(p.id)}" data-i="${x.i}">Remove</button></td>` : ""}</tr>`).join("")}</tbody></table></div>`
      : empty(ed ? "Add games, goals, assists (and clean sheets for keepers) for each season." : "No stats added yet.")}
  </div>`;

  return `${head}<div class="grid2"><div class="stack" style="gap:20px">${vidCard}${hlCard}${statCard}</div><div class="stack" style="gap:20px">${comCard}${histCard}</div></div>`;
}

/* ---------- college coaches: find players, shortlist, send interest ---------- */
const SL_STATUS = [["watching","Watching"],["contacted","Contacted"],["evaluating","Evaluating"],["offered","Offered"],["committed","Committed"],["passed","Passed"]];
function collegeBody(){
  if(!S.college && !S.collegeLoaded){ S.collegeLoaded = true; schedule("college"); }
  if(S.view === "shortlist") return shortlistHtml();
  if(S.view === "account") return collegeAccount();
  return scoutView();
}
function markScout(pid, ch){ if(S.scout && S.scout.res){ S.scout.res = S.scout.res.map(r => r.playerId === pid ? {...r, ...ch} : r); render(); } }
async function runScout(){
  const f = (S.scout && S.scout.f) || {};
  S.scout = {...(S.scout || {}), f, loading:true}; render();
  try {
    const data = await rpc("search_recruits", {q:f.q || "", p_positions: f.pos ? [f.pos] : [], grad:f.grad ?? null, gpa_min:f.gpa ?? null,
      p_division:f.div || "", p_league:f.league || "", p_foot:f.foot || "", p_location:f.loc || "", uncommitted_only:!!f.uncommitted, video_only:!!f.video});
    S.scout = {...S.scout, res:(data || []).map(camel), loading:false, error:false};
  } catch(e){ console.error(e); S.scout = {...S.scout, res:[], loading:false, error:true}; }
  render();
}
function scoutPhoto(r){ return r.photo ? `<img class="photo" src="${esc(blobUrl(r.photo))}" alt="" data-initials="${esc(initials(r.name))}">` : `<div class="photo ph" aria-hidden="true">${esc(initials(r.name || "?"))}</div>`; }
function scoutCard(r){
  return `<div class="card scout-card">
    <div class="scout-top">${scoutPhoto(r)}
      <div class="stack" style="gap:2px;min-width:0"><b class="scout-name">${esc(r.name)}</b>
        <span class="small muted">${[r.gradYear ? "Class of " + r.gradYear : "", r.age != null ? "Age " + r.age : "", r.gpa ? "GPA " + r.gpa : "", r.location || ""].filter(Boolean).map(esc).join(" · ")}</span>
        <span class="small">${esc([r.clubName, r.league].filter(Boolean).join(" · ") || "No current club")}</span></div></div>
    <div class="chips">${(r.positions || []).slice(0,4).map((k,i) => posChip(k, i===0)).join("")}${r.committed ? `<span class="chip str">✅ Committed${r.committedTo ? " to " + esc(r.committedTo) : ""}</span>` : `<span class="chip open-badge">Uncommitted</span>`}${(r.divisions || []).map(d => `<span class="chip">${esc(d)}</span>`).join("")}${r.videos ? `<span class="chip">🎥 ${r.videos}</span>` : ""}${r.highlights ? `<span class="chip">🏆 ${r.highlights}</span>` : ""}</div>
    ${r.summary ? `<p class="small">${esc(r.summary)}</p>` : ""}
    <div class="row scout-actions">
      <a class="btn sm" href="#profile-${esc(r.slug)}">View profile</a>
      ${r.shortlisted ? `<button class="btn ghost sm" data-act="go" data-view="shortlist">★ Shortlisted</button>` : `<button class="btn sm" data-act="shortlistAdd" data-player="${esc(r.playerId)}">☆ Shortlist</button>`}
      ${r.contacted ? `<span class="pill good">Message sent</span>` : `<button class="btn primary sm" data-act="modal" data-m="interest" data-player="${esc(r.playerId)}">I'm interested</button>`}
    </div>
  </div>`;
}
function scoutView(){
  if(!S.scout || (!S.scout.res && !S.scout.loading)) setTimeout(runScout, 0);
  const f = (S.scout && S.scout.f) || {}, y = new Date().getFullYear(), c = S.college || {};
  const head = `<div class="stack" style="gap:4px"><h1>Find players</h1><p class="muted small">${c.school ? esc(c.school) + (c.program ? " · " + esc(c.program) : "") + (c.division ? " · " + esc(c.division) : "") + ". " : ""}Players aged ${RECRUIT_AGE}+ whose families made their Recruitment Profile public and opted in to college coach search.</p></div>`;
  const filters = `<form class="card scout-filters" data-form="scoutSearch">
    <label class="f" for="sc-q">Search<input type="search" id="sc-q" name="q" maxlength="60" value="${esc(f.q || "")}" placeholder="Name, high school, major…"></label>
    <label class="f" for="sc-pos">Position<select id="sc-pos" name="pos" data-autosubmit="1"><option value="">Any position</option>${FIELD_POSITIONS.map(([k,l]) => `<option value="${k}" ${f.pos===k?"selected":""}>${k} – ${l}</option>`).join("")}</select></label>
    <div class="grid2" style="gap:10px">
      <label class="f" for="sc-grad">Class of<input type="number" id="sc-grad" name="grad" min="${y - 1}" max="${y + 4}" value="${esc(f.grad ?? "")}" placeholder="Any"></label>
      <label class="f" for="sc-gpa">Min GPA<input type="number" id="sc-gpa" name="gpa" min="0" max="5" step="0.1" value="${esc(f.gpa ?? "")}" placeholder="Any"></label>
    </div>
    <label class="f" for="sc-div">Interested in<select id="sc-div" name="div" data-autosubmit="1"><option value="">Any division</option>${DIVISIONS.map(d => `<option ${f.div===d?"selected":""}>${d}</option>`).join("")}</select></label>
    <label class="f" for="sc-league">Club league<select id="sc-league" name="league" data-autosubmit="1"><option value="">Any league</option>${LEAGUES.map(l => `<option ${f.league===l?"selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f" for="sc-foot">Stronger foot<select id="sc-foot" name="foot" data-autosubmit="1">${[["","Any"],["Right","Right"],["Left","Left"],["Both","Both"]].map(([v,l]) => `<option value="${v}" ${f.foot===v?"selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f" for="sc-loc">Location<input type="text" id="sc-loc" name="loc" maxlength="60" value="${esc(f.loc || "")}" placeholder="City or state"></label>
    <label class="check" for="sc-unc"><input type="checkbox" id="sc-unc" name="uncommitted" data-autosubmit="1" ${f.uncommitted?"checked":""}> Uncommitted only</label>
    <label class="check" for="sc-video"><input type="checkbox" id="sc-video" name="video" data-autosubmit="1" ${f.video?"checked":""}> Has highlight video</label>
    <div class="row"><button class="btn primary" type="submit">Search</button>${Object.values(f).some(v => v !== "" && v != null && v !== false) ? `<button class="btn ghost sm" type="button" data-act="scoutClear">Clear filters</button>` : ""}</div>
  </form>`;
  const sc = S.scout || {};
  const results = sc.loading && !sc.res ? `<div class="card"><p class="muted">Searching…</p></div>`
    : sc.error ? `<div class="card stack"><p>Search didn't work. Try again in a moment.</p></div>`
    : !(sc.res || []).length ? `<div class="locked"><h3>No players match</h3><p class="muted">Try fewer filters. Players appear once they're ${RECRUIT_AGE} or older and their family makes the Recruitment Profile public and opts in to college coach search.</p></div>`
    : `<p class="small muted">${sc.res.length} player${sc.res.length===1?"":"s"}${sc.res.length >= 60 ? " (showing the 60 most recently updated; narrow your filters)" : ""}</p><div class="scout-grid">${sc.res.map(scoutCard).join("")}</div>`;
  return head + `<div class="scout-layout">${filters}<div class="stack" style="gap:12px">${results}</div></div>`;
}
function shortlistHtml(){
  const all = S.shortlist || [];
  const head = `<div class="stack" style="gap:4px"><h1>Shortlist</h1><p class="muted small">Your private list. Other coaches, even at your school, don't see it.</p></div>`;
  if(!all.length) return head + `<div class="locked"><h3>Your shortlist is empty</h3><p class="muted">Use ☆ Shortlist on any player in Find players.</p><button class="btn primary" data-act="go" data-view="scout">Find players</button></div>`;
  const fl = S.slFilter || "all";
  const list = all.filter(x => fl === "all" || x.status === fl);
  const counts = Object.fromEntries(SL_STATUS.map(([k]) => [k, all.filter(x => x.status === k).length]));
  return head + `<div class="filters" role="group" aria-label="Filter by status"><button data-act="slFilter" data-id="all" aria-pressed="${fl==="all"}">All ${all.length}</button>${SL_STATUS.filter(([k]) => counts[k]).map(([k,l]) => `<button data-act="slFilter" data-id="${k}" aria-pressed="${fl===k}">${l} ${counts[k]}</button>`).join("")}</div>
  <div class="stack" style="gap:12px">${list.map(x => `<div class="card sl-item">
      <div class="scout-top">${scoutPhoto(x)}
        <div class="stack" style="gap:2px;min-width:0"><b class="scout-name">${esc(x.name)}</b>
          ${x.shared ? `<span class="small muted">${[x.gradYear ? "Class of " + x.gradYear : "", x.age != null ? "Age " + x.age : "", x.gpa ? "GPA " + x.gpa : "", x.location || ""].filter(Boolean).map(esc).join(" · ")}</span>
          <div class="chips">${(x.positions || []).slice(0,4).map((k,i) => posChip(k, i===0)).join("")}${x.committed ? `<span class="chip str">✅ Committed</span>` : ""}</div>`
          : `<span class="small muted">The family has stopped sharing this profile with college coaches, so details are hidden.</span>`}
          <span class="small muted">Added ${esc(relDays(new Date(x.createdAt).toLocaleDateString("en-CA")).toLowerCase())}${x.contacted ? " · You sent a message" : ""}</span>
        </div>
        <div class="row" style="margin-left:auto;align-self:flex-start">${x.shared && x.slug ? `<a class="btn sm" href="#profile-${esc(x.slug)}">View profile</a>` : ""}
          ${x.shared && !x.contacted ? `<button class="btn primary sm" data-act="modal" data-m="interest" data-player="${esc(x.playerId)}">I'm interested</button>` : ""}</div>
      </div>
      <form class="sl-form college" data-form="slSave" data-id="${esc(x.id)}">
        <label class="f" for="sl-st-${esc(x.id)}">Status<select id="sl-st-${esc(x.id)}" name="status">${SL_STATUS.map(([k,l]) => `<option value="${k}" ${x.status===k?"selected":""}>${l}</option>`).join("")}</select></label>
        <label class="f sl-note" for="sl-no-${esc(x.id)}">Notes<input type="text" id="sl-no-${esc(x.id)}" name="note" maxlength="1000" value="${esc(x.note || "")}" placeholder="e.g. Watched at the ECNL showcase; strong in the air"></label>
        <div class="row"><button class="btn sm" type="submit">Save</button><button class="btn ghost sm" type="button" data-act="shortlistRemove" data-id="${esc(x.id)}">Remove</button></div>
      </form>
    </div>`).join("") || `<p class="muted">No players with this status.</p>`}</div>`;
}
function collegeAccount(){
  const c = S.college || {};
  const sent = (S.interest || []);
  return `<div class="stack" style="gap:4px"><h1>Account</h1></div>
  <div class="grid2">
    <form class="card stack" data-form="collegeEdit"><h2>Your program</h2>
      ${collegeFields(c)}
      <p class="small muted">Families see your name, title, school, program, division and school email (${esc(c.email || "")}) when you message them.</p>
      <div><button class="btn primary" type="submit">Save</button></div></form>
    <div class="card stack"><h2>Messages you've sent</h2>
      ${sent.length ? `<div class="list">${sent.map(i => `<div class="req"><div class="stack" style="gap:4px"><span><b>${esc(i.playerName)}</b> <span class="small muted">${esc(relDays(new Date(i.createdAt).toLocaleDateString("en-CA")))}</span></span><span class="small">“${esc(i.message)}”</span><span class="small muted">${i.status === "new" ? "Not read yet" : "Read by the family"}</span></div></div>`).join("")}</div>` : `<p class="muted">None yet. Families reply to your school email.</p>`}
    </div>
  </div>`;
}
const collegeFields = (c = {}) => `<label class="f" for="cl-name">Your name<input type="text" id="cl-name" name="name" required maxlength="60" autocomplete="name" value="${esc(c.name || "")}"></label>
      <label class="f" for="cl-title">Title<input type="text" id="cl-title" name="title" maxlength="80" value="${esc(c.title || "")}" placeholder="e.g. Assistant Coach"></label>
      <label class="f" for="cl-school">College or university<input type="text" id="cl-school" name="school" required maxlength="100" value="${esc(c.school || "")}" placeholder="e.g. State University"></label>
      <div class="grid2" style="gap:14px">
        <label class="f" for="cl-program">Program<select id="cl-program" name="program">${["Men's Soccer","Women's Soccer","Men's & Women's Soccer"].map(x => `<option ${c.program===x?"selected":""}>${x}</option>`).join("")}</select></label>
        <label class="f" for="cl-div">Division<select id="cl-div" name="division" required><option value="">Choose…</option>${[...DIVISIONS, "Other"].map(d => `<option ${c.division===d?"selected":""}>${d}</option>`).join("")}</select></label>
      </div>`;

/* family: the Recruiting tab */
function recruitView(){
  const kids = S.players.filter(p => (S.me.playerIds || []).includes(p.id));
  const intro = `<div class="stack" style="gap:4px"><h1>College recruiting</h1><p class="muted small">A Recruitment Profile for college coaches, for players aged ${RECRUIT_AGE} and over. It's separate from the player profile your team sees.</p></div>`;
  if(!kids.length) return intro + `<div class="card stack"><h2>Add your player first</h2><div><button class="btn primary" data-act="modal" data-m="addChild">Add player</button></div></div>`;
  const p = kids.find(k => k.id === S.childId) || kids[0];
  const msgs = (S.interest || []).filter(i => i.status !== "archived");
  const intCard = msgs.length ? `<div class="card stack invites"><h2>Interest from colleges${newInterest().length ? ` <span class="badge">${newInterest().length} new</span>` : ""}</h2>
    <p class="small muted">College coaches found a Recruitment Profile and want to hear from you. Reply from your own email; ${APP_NAME} never shares your contact details unless you added them to the profile.</p>
    <div class="list">${msgs.map(i => `<div class="req${i.status === "new" ? " is-new" : ""}"><div class="stack" style="gap:4px">
        <span><b>${esc(i.school)}</b>${i.program ? ` · ${esc(i.program)}` : ""}${i.division ? ` <span class="chip">${esc(i.division)}</span>` : ""} → <b>${esc(i.playerName)}</b></span>
        <span class="small muted">${esc(i.coachName)}${i.coachTitle ? ", " + esc(i.coachTitle) : ""} · ${esc(relDays(new Date(i.createdAt).toLocaleDateString("en-CA")))}</span>
        <span class="small">“${esc(i.message)}”</span>
        <span class="small">✉️ <a href="mailto:${esc(i.coachEmail)}?subject=${encodeURIComponent("Re: " + i.playerName + " – " + APP_NAME)}">${esc(i.coachEmail)}</a></span></div>
      <div class="row">${i.status === "new" ? `<button class="btn sm" data-act="markInterest" data-id="${esc(i.id)}" data-status="seen">Mark as read</button>` : ""}<button class="btn ghost sm" data-act="markInterest" data-id="${esc(i.id)}" data-status="archived">Archive</button></div></div>`).join("")}</div></div>` : "";
  return `<div class="row between">${intro}${kids.length > 1 ? `<div class="filters" role="group" aria-label="Choose player">${kids.map(k => `<button data-act="child" data-id="${esc(k.id)}" aria-pressed="${k.id===p.id}">${esc(k.name)}</button>`).join("")}</div>` : ""}</div>
  ${intCard}
  ${recruitHtml(p, {editable:canEditProfile(p)})}`;
}
function visSwitch(p, pr){
  const v = visOf(pr), on = v === "public";
  return `<div class="vis-switch stack" style="gap:6px;align-items:flex-end">
    <div class="seg" role="radiogroup" aria-label="Profile visibility">
      <button type="button" role="radio" aria-checked="${on}" class="${on?"on":""}" data-act="setVis" data-player="${esc(p.id)}" data-v="public">🌐 Public</button>
      <button type="button" role="radio" aria-checked="${!on}" class="${!on?"on":""}" data-act="setVis" data-player="${esc(p.id)}" data-v="private">🔒 Private</button>
    </div>
    <span class="small muted" style="max-width:34ch;text-align:right">${on ? "Your full profile is visible to anyone with the link." : "Others only see your name, club and age."} <button type="button" class="linkish" data-act="modal" data-m="visibility" data-player="${esc(p.id)}">What's shared?</button></span>
  </div>`;
}
function hostOf(u){ try { return new URL(u).hostname.replace(/^www\./,""); } catch(_){ return "video site"; } }

/* ---------- team chat ---------- */
function myTeams(){
  const teams = S.teams.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  if(isStaff()) return teams;
  const ids = new Set(S.players.filter(p => (S.me.playerIds||[]).includes(p.id)).map(p => p.teamId));
  return teams.filter(t => ids.has(t.id));
}
const teamMsgs = tid => S.messages.filter(m => m.teamId === tid);
function unreadFor(tid){
  const lr = (S.me && S.me.lastRead && S.me.lastRead[tid]) || 0;
  return teamMsgs(tid).filter(m => m.createdAt > lr && m.authorId !== S.uid).length;
}
function totalUnread(){ if(!S.me) return 0; return myTeams().reduce((n,t) => n + unreadFor(t.id), 0); }
let readPending = false;
async function markRead(){
  const tid = S.chatTeam; if(!tid || readPending || !S.canWrite) return;
  const ms = teamMsgs(tid); if(!ms.length) return;
  const newest = ms[ms.length-1].createdAt || 0;
  const lr = (S.me.lastRead && S.me.lastRead[tid]) || 0;
  if(newest <= lr || document.hidden) return;
  readPending = true;
  try { await S.db.doc("members/" + S.uid).update({lastRead:{...(S.me.lastRead||{}), [tid]:newest}}); } catch(_){}
  readPending = false;
}
document.addEventListener("visibilitychange", () => { if(!document.hidden && S.view === "chat") markRead(); });
function msgTime(ts){ return new Date(ts).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}); }
function dayLabel(ts){
  const d = new Date(ts).toLocaleDateString("en-CA");
  if(d === today()) return "Today";
  const y = new Date(); y.setDate(y.getDate()-1);
  if(d === y.toLocaleDateString("en-CA")) return "Yesterday";
  return new Date(ts).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
}
function chatView(){
  const teams = myTeams();
  if(!teams.length) return `<h1>Team chat</h1><div class="locked"><h2>No team chats yet</h2><p class="muted">${isStaff() ? "Add a team and its chat appears here for the coaches and every family on that team." : "Your player isn't on a team yet. Find your club under My player and ask to join a team. The chat opens once a coach approves."}</p>${isStaff()?`<button class="btn primary" data-act="modal" data-m="team">Add team</button>`:""}</div>`;
  if(!teams.find(t => t.id === S.chatTeam)) S.chatTeam = teams[0].id;
  const team = teams.find(t => t.id === S.chatTeam);
  const ms = teamMsgs(team.id);
  const fams = S.members.filter(m => m.role === "family" && S.players.some(p => p.teamId === team.id && (m.playerIds||[]).includes(p.id))).length;
  const coaches = S.members.filter(m => m.role === "coach" || m.role === "admin").length;
  const pin = ms.filter(m => m.announce).slice(-1)[0];
  let lastDay = "", lastAuthor = "", lastTs = 0, thread = "";
  for(const m of ms){
    const dl = dayLabel(m.createdAt);
    if(dl !== lastDay){ thread += `<div class="day">${esc(dl)}</div>`; lastDay = dl; lastAuthor = ""; }
    const mine = m.authorId === S.uid;
    const grouped = !m.announce && m.authorId === lastAuthor && m.createdAt - lastTs < 5*60*1000;
    const canDel = mine || isStaff();
    const roleTag = (m.role === "coach" || m.role === "admin") ? `<span class="pill good">Coach</span>` : "";
    if(m.announce){
      thread += `<div class="msg announce"><div class="row between"><span class="pill warn">Announcement</span><span class="small muted">${esc(m.authorName||"Coach")} · ${msgTime(m.createdAt)}</span></div><div class="bubble">${esc(m.text)}</div>${canDel?`<button class="btn ghost sm del" data-act="delMsg" data-id="${esc(m.id)}">Delete</button>`:""}</div>`;
    } else {
      thread += `<div class="msg${mine?" mine":""}">${grouped?"":`<div class="who">${mine?"":`<b>${esc(m.authorName||"Someone")}</b>${roleTag}`}<span>${msgTime(m.createdAt)}</span></div>`}<div class="bubble">${esc(m.text)}</div>${canDel?`<button class="btn ghost sm del" data-act="delMsg" data-id="${esc(m.id)}" aria-label="Delete message">Delete</button>`:""}</div>`;
    }
    lastAuthor = m.announce ? "" : m.authorId; lastTs = m.createdAt;
  }
  if(!ms.length) thread = `<div class="muted" style="margin:auto;text-align:center;max-width:40ch">No messages yet. ${isStaff()?"Post a welcome or this week's schedule.":"Say hi to your team."}</div>`;
  return `<div class="chat">
    <aside class="chat-side" aria-label="Team chats"><h3>Your teams</h3>
      ${teams.map(t => { const last = teamMsgs(t.id).slice(-1)[0]; const u = unreadFor(t.id); return `<button data-act="chatTeam" data-id="${esc(t.id)}" aria-current="${t.id===team.id}"><span class="tn"><span>${esc(t.name)}</span><span class="tp">${last ? esc((last.authorName||"") + ": " + last.text) : "No messages yet"}</span></span>${u?`<span class="badge">${u}</span>`:""}</button>`; }).join("")}
    </aside>
    <section class="chat-main" aria-label="${esc(team.name)} chat">
      <div class="chat-head">
        <div class="stack" style="gap:0"><h2>${esc(team.name)}</h2><span class="small muted">${coaches} coach${coaches===1?"":"es"} · ${fams} famil${fams===1?"y":"ies"}</span></div>
        <select class="chat-pick" aria-label="Choose team chat" data-change="chatTeam">${teams.map(t=>`<option value="${esc(t.id)}" ${t.id===team.id?"selected":""}>${esc(t.name)}${unreadFor(t.id)?" ("+unreadFor(t.id)+")":""}</option>`).join("")}</select>
      </div>
      ${pin ? `<div class="pinned"><b>Pinned:</b><span>${esc(String(pin.text).slice(0,160))}${String(pin.text).length>160?"…":""}</span></div>` : ""}
      <div class="thread" id="thread" aria-live="polite">${thread}</div>
      <form class="composer" data-form="chat">
        <label for="chat-input" class="small muted">Message ${esc(team.name)}</label>
        <textarea id="chat-input" name="text" maxlength="1000" rows="2" placeholder="Write a message. Enter sends, Shift+Enter adds a line." ${S.canWrite?"":"disabled"}></textarea>
        <div class="row">${isStaff()?`<label class="small row" for="chat-ann" style="gap:6px"><input type="checkbox" id="chat-ann" name="announce"> Post as announcement (pinned)</label>`:`<span class="small muted">Coaches and team families can see this chat.</span>`}<button class="btn primary" type="submit" ${S.canWrite?"":"disabled"}>Send</button></div>
      </form>
    </section>
  </div>`;
}

function publicView(){
  const back = `<button class="btn ghost back" data-act="exitPublic">← ${S.me ? "Back to the app" : "Go to " + APP_NAME}</button>`;
  const P = S.pub;
  if(!P || P.loading) return back + `<div class="card"><p>Loading profile…</p></div>`;
  if(P.missing) return back + `<div class="card stack"><h2>Profile not found</h2><p>The link may be wrong, or the profile was removed.</p></div>`;
  if(P.private) return back + `<div class="card stack"><h2>This profile is private</h2><p>The player's family hasn't made it public.</p></div>`;
  if(P.limited) return back + `<div class="card pcard limited-profile">
      <div class="photo ph" aria-hidden="true">${esc(initials(P.limited.name))}</div>
      <div class="stack" style="gap:6px"><h1>${esc(P.limited.name)}</h1>
        <p class="muted">${esc(P.limited.club||"")}${P.limited.age ? " · Age " + esc(P.limited.age) : ""}</p>
        <span class="pill plain" style="align-self:flex-start">🔒 Private profile</span>
        <p class="small muted" style="max-width:52ch">This player keeps their profile private, so only their name, club and age are shown.</p></div>
    </div>`;
  if(P.error || !P.player) return back + `<div class="card"><p>The profile couldn't load. Try again in a moment.</p></div>`;
  return back + recruitHtml(P.player, {pub:{profile:P.profile, refs:P.refs, clubName:P.clubName}});
}
async function loadPublic(slug){
  S.pub = {loading:true}; render();
  try{
    const {data, error} = await sb.rpc("get_public_profile", {p_slug: slug});
    if(error) throw error;
    if(!data || data.status === "missing"){ S.pub = {missing:true}; render(); return; }
    if(data.status === "private"){ S.pub = {private:true}; render(); return; }
    if(data.status === "limited" || (S.previewAsOutsider && data.status === "ok" && data.profile && data.profile.visibility !== "public")){
      S.previewAsOutsider = false;
      S.pub = {limited:{name:data.player.name, club:data.club_name || "", age: data.player.age != null ? data.player.age : ageOf(data.player.birth_year)}, preview: true}; render(); return;
    }
    S.previewAsOutsider = false;
    S.pub = {profile: camel(data.profile), player: {id:data.player.id, name:data.player.name, birthYear:data.player.birth_year, age:data.player.age},
      clubName: data.club_name || "", refs: (data.refs || []).map(camel)};
  } catch(e){ console.error(e); S.pub = {error:true}; }
  render();
}
function readHash(){
  const h = location.hash.slice(1);
  if(PAGE_IDS.includes(h)){ S.publicPage = h; S.menuOpen = false; S.publicSlug = null; S.pub = null; if(h !== "contact") S.contactSent = null; render(); window.scrollTo(0,0); return; }
  if(h === "signin" || h === ""){ S.publicPage = null; S.menuOpen = false; if(S.publicSlug){ S.publicSlug = null; S.pub = null; } render(); window.scrollTo(0,0); return; }
  if(h === "coach" || h === "parent" || h === "college"){ savePortal(h === "coach" ? "coach" : h === "college" ? "college" : "family"); S.publicPage = null; if(S.publicSlug){ S.publicSlug = null; S.pub = null; } if(!S.uid){ S.authMode = "signin"; } render(); return; }
  const m = /^profile-([a-z0-9]+)$/.exec(h);
  const slug = m ? m[1] : null;
  if(slug !== S.publicSlug){ S.publicSlug = slug; S.pub = null; if(slug && S.authChecked) loadPublic(slug); else render(); }
}

function drillsView(){
  const staff = isStaff();
  const locked = !staff && !familyHasHome();
  const list = allDrills();
  let recs = locked ? paywallBanner() : "";
  if(!staff && !locked){
    const kids = S.players.filter(p => (S.me.playerIds||[]).includes(p.id));
    recs = kids.map(k => recommendCard(k, {family:true, title: kids.length > 1 ? "Recommended for " + k.name : "Recommended for you"})).join("");
  }
  return `<div class="row between"><div class="stack" style="gap:4px"><h1>${staff?"Drill library":"Home drills"}</h1><p class="muted small">${staff?"Built-in drills plus any your club adds. Assign them to players for home practice.":"Drills you can do at home with a ball and a little space."}</p></div>
    ${staff?`<button class="btn primary" data-act="modal" data-m="drill">Add club drill</button>`:""}</div>
  ${recs}
  <h2>${staff ? "All drills by level and skill" : "All home drills by level and skill"}</h2>
  ${drillLibraryHtml(list, {assignable:staff})}`;
}

function plansView(){
  const staff = isStaff();
  const included = staff ? S.club.familyAccess !== "subscribe" : (S.clubs || []).some(c => c.familyAccess !== "subscribe");
  const fp = S.me.familyPlan;
  let status;
  if(staff) status = included ? "Your club includes Home Training for every family." : "Families in your club subscribe to Home Training on their own.";
  else if(included) status = "Your club includes Home Training, so you already have it.";
  else status = fp ? "You're on a Home Training trial." : (S.clubs || []).length ? "Your club doesn't include Home Training. You can add it for your family." : "You can add Home Training for your family. Some clubs include it once you join their team.";
  return `<div class="stack" style="gap:4px"><h1>Plans</h1><p class="muted">${status}</p></div>
  <div class="grid2">
    <div class="card plan">
      <span class="pill plain" style="align-self:flex-start">For clubs & coaches</span>
      <h2>Club plan</h2>
      <div><span class="price">$39</span> <span class="muted">/ month per club · example price</span></div>
      <ul><li>Unlimited players, teams and coaches</li><li>Skill reviews with strengths and areas to work on</li><li>Progress tracking over the season</li><li>Drill library and your own club drills</li><li>Option to include Home Training for every family</li></ul>
      ${staff ? `<div><button class="btn" data-act="modal" data-m="clubSettings">${included?"Families included: change":"Change family access"}</button></div>` : ""}
    </div>
    <div class="card plan featured">
      <span class="pill good" style="align-self:flex-start">For players & parents</span>
      <h2>Home Training</h2>
      <div><span class="price">$6.99</span> <span class="muted">/ month per family · example price</span></div>
      <ul><li>Drills your coach assigns, with step-by-step instructions</li><li>Full home drill library</li><li>Progress charts and full review history</li><li>Weekly drill tracking your coach can see</li></ul>
      <p class="small muted">Free with every club: the coach's latest review and skill ratings.</p>
      ${!staff && !included ? (fp ? `<div class="row"><span class="pill good">Trial active</span><button class="btn ghost sm" data-act="cancelPlan">Cancel trial</button></div>` : `<div><button class="btn primary" data-act="startPlan">Start 14-day free trial</button></div>`) : ""}
    </div>
  </div>
  <p class="small muted">Prices are placeholders, and payments aren't connected in this version: starting a trial unlocks Home Training without charging anything.</p>`;
}

function clubView(){
  const admin = S.me.role === "admin";
  const coaches = S.members.filter(m => m.role === "coach" || m.role === "admin");
  const fams = S.members.filter(m => m.role === "family");
  return `<h1>Club</h1>
  <div class="grid2">
    <div class="card stack">
      <div class="row between"><h2>${esc(S.club.name)}</h2>${admin?`<button class="btn sm" data-act="modal" data-m="clubSettings">Edit</button>`:""}</div>
      <p>Coach join code: <span class="code">${esc(S.club.code)}</span> <button class="btn ghost sm" data-act="copy" data-text="${esc(S.club.code)}">Copy</button></p>
      <p>Home Training for families: <b>${S.club.familyAccess==="subscribe"?"families subscribe themselves":"included by the club"}</b></p>
      <p class="muted small">${fams.length} famil${fams.length===1?"y":"ies"} connected.</p>
    </div>
    <div class="card stack">
      <h2>Coaches</h2>
      <div class="list">${coaches.map(m=>{ const ts = teamsOfCoach(m.id); return `<div class="row between"><span><b>${esc(m.name||"Coach")}</b><br><span class="small muted">${ts.length ? esc(ts.map(t=>t.name).join(", ")) : m.role==="admin" ? "Sees all players" : "Not on a team yet"}</span></span><span class="pill ${m.role==="admin"?"warn":"plain"}">${m.role==="admin"?"Club admin":"Coach"}</span></div>`; }).join("") || '<p class="muted">No coaches yet.</p>'}</div>
      <p class="small muted">Private conversations and meetings are only open to each player's team coaches and the club admin.</p>
    </div>
    <div class="card stack">
      <div class="row between"><h2>Teams</h2><button class="btn sm" data-act="modal" data-m="team">Add team</button></div>
      <div class="list">${S.teams.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(t=>{const n=S.players.filter(p=>p.teamId===t.id).length;const tcs = coachesOfTeam(t.id), mine = tcs.some(m => m.id === S.uid);
return `<div class="row between"><span><b>${esc(t.name)}</b> <span class="muted small">${esc(t.ageGroup||"")}</span><br><span class="small muted">Coaches: ${tcs.length ? esc(tcs.map(m=>m.name||"Coach").join(", ")) : "none yet"}</span></span><span class="row">${isAdmin() ? `<button class="btn ghost sm" data-act="modal" data-m="teamCoaches" data-id="${esc(t.id)}">Assign coaches</button>` : `<button class="btn ghost sm" data-act="selfCoach" data-id="${esc(t.id)}" data-on="${mine?"0":"1"}">${mine ? "Leave team" : "I coach this team"}</button>`}<span class="muted small num">${n} player${n===1?"":"s"}</span>${n===0?`<button class="btn ghost sm" data-act="delTeam" data-id="${esc(t.id)}">Delete</button>`:""}</span></div>`;}).join("") || '<p class="muted">No teams yet.</p>'}</div>
    </div>
    <div class="card stack">
      <h2>Your account</h2>
      <p>${esc(S.me.name||"")} · ${admin?"Club admin":"Coach"}</p>
      <div><button class="btn danger" data-act="modal" data-m="leave">Leave this club</button></div>
    </div>
  </div>`;
}

function accountView(){
  const kids = S.players.filter(p => (S.me.playerIds||[]).includes(p.id));
  return `<h1>Account</h1>
  <div class="grid2">
    <div class="card stack"><h2>Your players</h2>
      <div class="list">${kids.map(k=>{ const pend = pendingFor(k.id);
        const where = k.clubId ? `${esc(teamName(k.teamId))} · ${esc(clubNameOf(k))}` : pend ? `Waiting to join ${esc(pend.teamName)} · ${esc(pend.clubName)}` : "Not on a team yet";
        return `<div class="row between"><span><b>${esc(k.name)}</b>${k.birthDate ? ` <span class="muted small">born ${esc(fmtDob(k.birthDate))}</span>` : k.birthYear ? ` <span class="muted small">born ${esc(k.birthYear)}</span>` : ""}<br><span class="small muted">${where}</span></span>
        <span class="row"><button class="btn ghost sm" data-act="modal" data-m="editMine" data-player="${esc(k.id)}">Edit</button>${k.clubId ? `<button class="btn ghost sm" data-act="modal" data-m="leaveTeam" data-player="${esc(k.id)}">Leave team</button>` : pend ? "" : `<button class="btn sm" data-act="findTeam" data-player="${esc(k.id)}">Find team</button>`}</span></div>`; }).join("") || '<p class="muted">None yet.</p>'}</div>
      <div><button class="btn" data-act="modal" data-m="addChild">Add another player</button></div>
    </div>
    <div class="card stack"><h2>You</h2><p>${esc(S.me.name||"")} · Parent / player account</p>
      <p class="small muted">Your players' profiles, reviews and messages belong to your account. If a player leaves a club, you keep everything; that club's coaches lose access.</p></div>
  </div>`;
}

/* ---------- modals ---------- */
function openModal(html){
  const m = document.getElementById("modal");
  m.innerHTML = `<div class="backdrop" data-act="closeBg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const f = m.querySelector("input,select,textarea,button.primary");
  if(f) f.focus();
}
function closeModal(){ document.getElementById("modal").innerHTML = ""; }
const teamOptions = sel => S.teams.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(t=>`<option value="${esc(t.id)}" ${t.id===sel?"selected":""}>${esc(t.name)}</option>`).join("");

const MODALS = {
  team: () => `<h2>Add team</h2><form data-form="team">
    <label class="f" for="t-name">Team name<input type="text" id="t-name" name="name" required maxlength="60" placeholder="e.g. U12 Boys Premier"></label>
    <label class="f" for="t-age">Age group<input type="text" id="t-age" name="age" maxlength="20" placeholder="e.g. U12"></label>
    <div class="row"><button class="btn primary" type="submit">Add team</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  editPlayer: (ds) => { const p = S.players.find(x=>x.id===ds.player); if(!p) return "<p>Player not found.</p>"; return `<h2>Edit ${esc(p.name)}</h2><form data-form="editPlayer" data-id="${esc(p.id)}">
    <p class="small muted">${p.birthDate ? "Born " + esc(fmtDob(p.birthDate)) + ". " : p.birthYear ? "Born " + esc(p.birthYear) + ". " : ""}The family manages the name, date of birth and profile.</p>
    <div class="grid2" style="gap:14px">
      <label class="f" for="e-team">Team<select id="e-team" name="teamId">${teamOptions(p.teamId)}</select></label>
      <label class="f" for="e-pos">Position<select id="e-pos" name="position">${POSITIONS.map(x=>`<option ${x===p.position?"selected":""}>${x}</option>`).join("")}</select></label>
    </div>
    <div class="row between"><div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div><button class="btn danger" type="button" data-act="removeFromClub" data-id="${esc(p.id)}">Remove from club</button></div>
    <p class="small muted">Removing takes ${esc(p.name)} off your roster. The family keeps the profile and past reviews; your club loses access.</p></form>`; },
  review: (ds) => {
    const p = S.players.find(x=>x.id===ds.player); if(!p) return "<p>Player not found.</p>";
    const rs = reviewsFor(p.id), last = rs[rs.length-1];
    const chips = (name, sel) => `<div class="chips">${TAGS.map((t,i)=>`<label class="chipbox"><input type="checkbox" name="${name}" value="${esc(t)}" id="${name}-${i}" ${sel.includes(t)?"checked":""}><span>${esc(t)}</span></label>`).join("")}</div>`;
    const lastForm = last ? reviewForm(last) : null;
    const form = lastForm || (p.position === "Goalkeeper" ? "gk" : "field");
    const sliderSet = f => { let g = "", out = "";
      for(const s of skillsFor(f)){
        if(s.group!==g){ g=s.group; out += `<div class="rgroup">${g}</div>`; }
        const lv = last && lastForm === f ? Number(last.ratings[s.k]) : NaN;
        const v = lv >= 1 && lv <= 5 ? lv : 3;
        out += `<div class="slider"><label for="r-${s.k}">${s.label}</label><input type="range" min="1" max="5" step="1" id="r-${s.k}" name="r-${s.k}" value="${v}" data-out="o-${s.k}" data-scale="1" ${f!==form?"disabled":""}><output id="o-${s.k}" title="${esc(SCALE[v])}">${v}</output></div>`;
      }
      return out; };
    return `<h2>${last ? "Update review" : "First review"}: ${esc(p.name)}</h2>
    <p class="small muted">${last?`Sliders start at the last review's ratings (${fmtDate(last.date)}). Move only what has changed. The previous review stays saved in the timeline.`:"This first review sets the baseline that future progress is measured from."} 1 Needs a lot of work · 2 Developing · 3 Solid for their level · 4 Strong · 5 Excellent</p>
    <form data-form="review" data-id="${esc(p.id)}" data-last="${last ? esc(JSON.stringify({form:lastForm, ratings:last.ratings})) : ""}">
      <label class="f" for="r-date" style="max-width:200px">Date<input type="date" id="r-date" name="date" value="${today()}" required></label>
      <fieldset class="rtype" style="border:0;padding:0;margin:0;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><legend class="small" style="font-weight:600;margin-bottom:6px;color:var(--blue-deep)">Review type</legend>
        <label class="chipbox" for="rf-field"><input type="radio" id="rf-field" name="form" value="field" data-reviewform="1" ${form==="field"?"checked":""}><span>Field player</span></label>
        <label class="chipbox" for="rf-gk"><input type="radio" id="rf-gk" name="form" value="gk" data-reviewform="1" ${form==="gk"?"checked":""}><span>Goalkeeper</span></label>
      </fieldset>
      <div class="stack rset" data-set="field" style="gap:8px" ${form==="field"?"":"hidden"}>${sliderSet("field")}</div>
      <div class="stack rset" data-set="gk" style="gap:8px" ${form==="gk"?"":"hidden"}>${sliderSet("gk")}</div>
      <div class="update-box stack" style="gap:8px">
        ${last ? `<div class="small"><b>Changes since last review:</b> <span id="r-changes" class="muted">None yet. Move a slider to record a change.</span></div>` : ""}
        <label class="f" for="r-summary">${last ? "What changed since the last review?" : "One-line summary"} <span class="small muted">(required, shown in the progress timeline)</span>
          <input type="text" id="r-summary" name="summary" required maxlength="280" placeholder="${last ? "e.g. First touch much sharper since the winter clinic; still working on weak foot." : "e.g. Strong passer, needs to get more involved defensively."}"></label>
      </div>
      <div class="stack" style="gap:6px"><b>Strengths</b>${chips("str", [])}<input type="text" name="strOther" id="r-str-other" placeholder="Other strengths, separated by commas" aria-label="Other strengths"></div>
      <div class="stack" style="gap:6px"><b>Work on</b>${chips("imp", [])}<input type="text" name="impOther" id="r-imp-other" placeholder="Other areas, separated by commas" aria-label="Other areas to work on"></div>
      <label class="f" for="r-note">Note to player & family<textarea id="r-note" name="note" maxlength="1500" placeholder="What went well, and one thing to focus on before the next review."></textarea></label>
      <p class="small muted">Only coaches at your club and this player's own family accounts can see reviews. They never appear on a public profile.</p>
      <div class="row"><button class="btn primary" type="submit">Save review</button><button class="btn" type="button" data-act="close">Cancel</button></div>
    </form>`;
  },
  assign: (ds) => {
    const players = S.players.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    const ds2 = allDrills();
    return `<h2>Assign a home drill</h2><form data-form="assign">
      ${ds.player ? `<input type="hidden" name="playerId" value="${esc(ds.player)}"><p>For <b>${esc((S.players.find(p=>p.id===ds.player)||{}).name)}</b></p>`
        : `<label class="f" for="a-player">Player<select id="a-player" name="playerId" required>${players.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${esc(teamName(p.teamId))}</option>`).join("")}</select></label>`}
      ${ds.drill ? `<input type="hidden" name="drillId" value="${esc(ds.drill)}"><p>Drill: <b>${esc((drillById(ds.drill)||{}).title)}</b></p>`
        : `<label class="f" for="a-drill">Drill<select id="a-drill" name="drillId" required>${CATS.map(c=>{const g=ds2.filter(d=>d.category===c);return g.length?`<optgroup label="${esc(c)}">${g.map(d=>`<option value="${esc(d.id)}">${esc(d.title)}</option>`).join("")}</optgroup>`:"";}).join("")}</select></label>`}
      <label class="f" for="a-per" style="max-width:220px">Times per week<select id="a-per" name="perWeek">${[1,2,3,4,5,6,7].map(n=>`<option ${n===3?"selected":""}>${n}</option>`).join("")}</select></label>
      <label class="f" for="a-note">Note for the player (optional)<input type="text" id="a-note" name="note" maxlength="200" placeholder="e.g. Left foot only this week"></label>
      <div class="row"><button class="btn primary" type="submit">Assign</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`;
  },
  drill: () => `<h2>Add club drill</h2><form data-form="drill">
    <label class="f" for="d-title">Drill name<input type="text" id="d-title" name="title" required maxlength="80"></label>
    <div class="grid2" style="gap:14px">
      <label class="f" for="d-cat">Category<select id="d-cat" name="category">${CATS.map(c=>`<option>${c}</option>`).join("")}</select></label>
      <label class="f" for="d-min">Minutes<input type="number" id="d-min" name="minutes" min="1" max="120" value="10"></label>
      <label class="f" for="d-eq">Equipment<input type="text" id="d-eq" name="equipment" maxlength="80" value="Ball"></label>
      <label class="f" for="d-lvl">Level<select id="d-lvl" name="level">${LEVELS.map(l => `<option ${l===(S.drillLevel||"Beginner")?"selected":""}>${l}</option>`).join("")}</select></label>
    </div>
    <label class="f" for="d-steps">Steps, one per line<textarea id="d-steps" name="steps" required maxlength="2000"></textarea></label>
    <div class="row"><button class="btn primary" type="submit">Add drill</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  clubSettings: () => `<h2>Club settings</h2><form data-form="clubSettings">
    <label class="f" for="c-name">Club name<input type="text" id="c-name" name="name" required maxlength="80" value="${esc(S.club.name)}"></label>
    <fieldset class="stack" style="border:0;padding:0;margin:0"><legend style="font-weight:600;margin-bottom:8px">Home Training for families</legend>
      <label class="choice" for="fa-inc"><input type="radio" id="fa-inc" name="familyAccess" value="included" ${S.club.familyAccess!=="subscribe"?"checked":""}><span><b>Included by the club</b><br><span class="small muted">Every connected family gets home drills and progress charts. Your club plan covers it.</span></span></label>
      <label class="choice" for="fa-sub"><input type="radio" id="fa-sub" name="familyAccess" value="subscribe" ${S.club.familyAccess==="subscribe"?"checked":""}><span><b>Families subscribe themselves</b><br><span class="small muted">Families see the latest review free and can add Home Training on their own.</span></span></label>
    </fieldset>
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  addChild: () => `<h2>Add a player</h2><form data-form="addChild">
    ${playerSetupFields("ac")}
    <div class="row"><button class="btn primary" type="submit">Add player</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  editMine: ds => { const p = S.players.find(x => x.id === ds.player); if(!p) return "<p>Player not found.</p>"; return `<h2>Edit ${esc(p.name)}</h2><form data-form="editMine" data-id="${esc(p.id)}">
    <label class="f" for="em-name">Player's name<input type="text" id="em-name" name="player" required maxlength="60" value="${esc(p.name)}"></label>
    <label class="f" for="em-dob">Date of birth<input type="date" id="em-dob" name="dob" min="1990-01-01" max="${new Date().toLocaleDateString("en-CA")}" value="${esc(p.birthDate||"")}"></label>
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  findTeam: () => findTeamModal(),
  leaveTeam: ds => { const p = S.players.find(x => x.id === ds.player); if(!p) return "<p>Player not found.</p>"; const club = clubNameOf(p) || "the club";
    return `<h2>Leave ${esc(teamName(p.teamId))}?</h2><p>${esc(p.name)} will come off the team at ${esc(club)}. You keep the profile, past reviews, references, home drills and messages. ${esc(club)}'s coaches won't see ${esc(p.name)} any more, and team chat closes.</p><p class="small muted">You can ask to join a team again any time.</p>
    <div class="row"><button class="btn danger" data-act="leaveTeam" data-id="${esc(p.id)}">Leave team</button><button class="btn" data-act="close">Cancel</button></div>`; },
  about: (ds) => {
    const p = S.players.find(x=>x.id===ds.player); if(!p) return "<p>Player not found.</p>";
    const pr = profileFor(p.id) || {}, pos = pr.positions || [], str = pr.strengths || [];
    const custom = str.filter(t => !TAGS.includes(t)).join(", ");
    return `<h2>${esc(p.name)}: about</h2><form data-form="about" data-id="${esc(p.id)}">
      <div class="stack" style="gap:6px"><b>Positions</b><span class="small muted">Tick every position you play. Your main one goes first.</span>
        <label class="f" for="ab-main" style="max-width:340px">Main position<select id="ab-main" name="main"><option value="">Choose…</option>${FIELD_POSITIONS.map(([k,l])=>`<option value="${k}" ${pos[0]===k?"selected":""}>${k} – ${l}</option>`).join("")}</select></label>
        <div class="chips">${FIELD_POSITIONS.map(([k,l],i)=>`<label class="chipbox" title="${l}"><input type="checkbox" name="pos" value="${k}" id="ab-pos-${i}" ${pos.includes(k)?"checked":""}><span>${k}</span></label>`).join("")}</div></div>
      <label class="f" for="ab-foot" style="max-width:220px">Stronger foot<select id="ab-foot" name="foot">${["","Right","Left","Both"].map(f=>`<option value="${f}" ${pr.foot===f?"selected":""}>${f||"Not set"}</option>`).join("")}</select></label>
      <div class="stack" style="gap:6px"><b>Strengths</b><div class="chips">${TAGS.map((t,i)=>`<label class="chipbox"><input type="checkbox" name="str" value="${esc(t)}" id="ab-str-${i}" ${str.includes(t)?"checked":""}><span>${esc(t)}</span></label>`).join("")}</div>
        <input type="text" name="strOther" id="ab-str-other" value="${esc(custom)}" placeholder="Other strengths, separated by commas" aria-label="Other strengths"></div>
      <label class="f" for="ab-bio">Short bio<textarea id="ab-bio" name="bio" maxlength="600" placeholder="e.g. Two-footed midfielder who loves to switch the play. Captain of my U12 team.">${esc(pr.bio||"")}</textarea></label>
      <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`;
  },
  visibility: (ds) => {
    const p = S.players.find(x=>x.id===ds.player); if(!p) return "<p>Player not found.</p>";
    const cur = visOf(profileFor(p.id));
    return `<h2>Public or private?</h2><form data-form="visibility" data-id="${esc(p.id)}">
      ${Object.entries(VIS).map(([k,v])=>`<label class="choice" for="vis-${k}"><input type="radio" id="vis-${k}" name="vis" value="${k}" ${cur===k?"checked":""}><span><b>${v.icon} ${v.label}</b><br><span class="small muted">${v.help}</span></span></label>`).join("")}
      <div class="note small"><b>Never shared, public or private:</b> coach reviews and ratings, the review timeline, home drills, coach comments, private messages, meetings and the full date of birth. Only you, your family and your coaches see those.</div>
      <p class="small muted">You can switch any time. Your family, your team's coaches and the club admin always see your full profile.</p>
      <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`;
  },
  interest: ds => { const r = (S.scout && S.scout.res || []).find(x => x.playerId === ds.player) || (S.shortlist || []).find(x => x.playerId === ds.player) || {}; const c = S.college || {};
    return `<h2>Message ${esc(r.name || "the family")}</h2><form data-form="interest" data-player="${esc(ds.player)}">
      <label class="f" for="in-msg">Message<textarea id="in-msg" name="message" required maxlength="1500" rows="6" placeholder="Introduce yourself and your program, what you liked in the profile, and next steps such as an ID camp, a visit or a call."></textarea></label>
      <p class="small muted">The family sees your message with your name, title, ${esc(c.school || "school")} and your school email (${esc(c.email || "")}), and replies by email. Please follow the recruiting contact rules for your division.</p>
      <div class="row"><button class="btn primary" type="submit">Send</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  recruitDetails: ds => { const p = S.players.find(x => x.id === ds.player); if(!p) return "<p>Player not found.</p>";
    const pr = profileFor(p.id) || {}, R = pr.recruit || {}, y = new Date().getFullYear(), divs = R.divisions || [];
    return `<h2>Recruiting details</h2><form data-form="recruitDetails" data-id="${esc(p.id)}">
      <label class="f" for="rd-sum">Recruiting summary<textarea id="rd-sum" name="summary" maxlength="800" rows="4" placeholder="What makes ${esc(p.name)} stand out: playing style, strengths and the kind of college program you're looking for.">${esc(R.summary || "")}</textarea></label>
      <h3 class="form-sec">Academics</h3>
      <div class="grid2" style="gap:14px">
        <label class="f" for="rd-grad">Class of (high school graduation)<input type="number" id="rd-grad" name="gradYear" min="${y - 1}" max="${y + 4}" value="${esc(R.gradYear || "")}" placeholder="e.g. ${y + 2}"></label>
        <label class="f" for="rd-school">High school<input type="text" id="rd-school" name="school" maxlength="80" value="${esc(R.school || "")}"></label>
        <label class="f" for="rd-gpa">GPA<input type="text" id="rd-gpa" name="gpa" maxlength="10" value="${esc(R.gpa || "")}" placeholder="e.g. 3.8"></label>
        <label class="f" for="rd-sat">SAT / ACT (optional)<input type="text" id="rd-sat" name="test" maxlength="30" value="${esc(R.test || "")}" placeholder="e.g. SAT 1320 or ACT 29"></label>
        <label class="f" for="rd-major">Intended major (optional)<input type="text" id="rd-major" name="major" maxlength="60" value="${esc(R.major || "")}"></label>
        <label class="f" for="rd-ncaa">NCAA Eligibility Center ID (optional)<input type="text" id="rd-ncaa" name="ncaaId" maxlength="20" value="${esc(R.ncaaId || "")}"></label>
      </div>
      <h3 class="form-sec">Soccer</h3>
      <div class="grid2" style="gap:14px">
        <label class="f" for="rd-league">Club league<select id="rd-league" name="league">${["", ...LEAGUES].map(l => `<option value="${l}" ${R.league===l?"selected":""}>${l || "Not set"}</option>`).join("")}</select></label>
        <label class="f" for="rd-foot">Stronger foot<select id="rd-foot" name="foot">${["","Right","Left","Both"].map(f => `<option value="${f}" ${pr.foot===f?"selected":""}>${f || "Not set"}</option>`).join("")}</select></label>
        <label class="f" for="rd-h">Height<input type="text" id="rd-h" name="height" maxlength="20" value="${esc(R.height || "")}" placeholder="e.g. 5'10&quot;"></label>
        <label class="f" for="rd-w">Weight (optional)<input type="text" id="rd-w" name="weight" maxlength="20" value="${esc(R.weight || "")}" placeholder="e.g. 160 lb"></label>
      </div>
      <fieldset class="plain"><legend class="small"><b>College divisions you're interested in</b></legend>
        <div class="chips">${DIVISIONS.map((d,i) => `<label class="chipbox"><input type="checkbox" name="div" value="${d}" id="rd-div-${i}" ${divs.includes(d)?"checked":""}><span>${d}</span></label>`).join("")}</div></fieldset>
      <label class="f" for="rd-colleges">Colleges you're interested in (optional)<input type="text" id="rd-colleges" name="colleges" maxlength="200" value="${esc(R.colleges || "")}" placeholder="e.g. Ohio State, Xavier, Dayton"></label>
      <div class="grid2" style="gap:14px">
        <label class="f" for="rd-commit">Commitment<select id="rd-commit" name="committed"><option value="">Uncommitted</option><option value="yes" ${R.committed?"selected":""}>Committed</option></select></label>
        <label class="f" for="rd-commit-to">Committed to (if committed)<input type="text" id="rd-commit-to" name="committedTo" maxlength="80" value="${esc(R.committedTo || "")}"></label>
      </div>
      <h3 class="form-sec">Contact & visibility</h3>
      <label class="f" for="rd-loc">Location<input type="text" id="rd-loc" name="location" maxlength="60" value="${esc(R.location || "")}" placeholder="City and state, e.g. Cincinnati, OH"></label>
      <label class="f" for="rd-mail">Contact email for college coaches (optional)<input type="email" id="rd-mail" name="contact" maxlength="120" value="${esc(R.contact || "")}" placeholder="A parent's email is best"></label>
      <label class="choice" for="rd-search"><input type="checkbox" id="rd-search" name="searchable" ${R.searchable ? "checked" : ""}><span><b>Let college coaches find this profile in ${APP_NAME}</b><br><span class="small muted">Verified college coaches (school .edu email) can search for it and send you a message. Only works while the profile is Public. Turn it off any time.</span></span></label>
      <p class="small muted">Everything above shows on the Recruitment Profile when it's public, including the contact email.</p>
      <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  highlight: ds => `<h2>Add a career highlight</h2><form data-form="highlight" data-id="${esc(ds.player)}">
    <label class="f" for="hl-t">Highlight<input type="text" id="hl-t" name="title" required maxlength="100" placeholder="e.g. State Cup champions, ODP selection, team captain"></label>
    <label class="f" for="hl-y" style="max-width:200px">Year<input type="number" id="hl-y" name="year" min="2000" max="${new Date().getFullYear() + 1}" value="${new Date().getFullYear()}"></label>
    <label class="f" for="hl-d">Details (optional)<textarea id="hl-d" name="details" maxlength="300" rows="2" placeholder="e.g. Scored the winner in the final; named tournament MVP."></textarea></label>
    <div class="row"><button class="btn primary" type="submit">Add</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  stat: ds => `<h2>Add a season</h2><form data-form="stat" data-id="${esc(ds.player)}">
    <div class="grid2" style="gap:14px">
      <label class="f" for="st-s">Season<input type="text" id="st-s" name="season" required maxlength="30" placeholder="e.g. Fall 2026"></label>
      <label class="f" for="st-t">Team<input type="text" id="st-t" name="team" maxlength="60" placeholder="e.g. U14 Boys Premier"></label>
      <label class="f" for="st-g">Games played<input type="number" id="st-g" name="games" min="0" max="200"></label>
      <label class="f" for="st-go">Goals<input type="number" id="st-go" name="goals" min="0" max="300"></label>
      <label class="f" for="st-a">Assists<input type="number" id="st-a" name="assists" min="0" max="300"></label>
      <label class="f" for="st-cs">Clean sheets (keepers)<input type="number" id="st-cs" name="cleanSheets" min="0" max="200"></label>
    </div>
    <div class="row"><button class="btn primary" type="submit">Add</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  video: (ds) => `<h2>Add a highlight video</h2><form data-form="video" data-id="${esc(ds.player)}">
    <label class="f" for="v-title">Title<input type="text" id="v-title" name="title" maxlength="80" required placeholder="e.g. Fall 2026 highlights"></label>
    <label class="f" for="v-date" style="max-width:200px">Date<input type="date" id="v-date" name="date" value="${today()}"></label>
    ${S.assets ? `<label class="f" for="v-file">Upload a clip (MP4 or WebM, up to 50 MB)<input type="file" id="v-file" name="file" accept="video/mp4,video/webm"></label><p class="small muted" style="text-align:center">or</p>` : ""}
    <label class="f" for="v-link">Link to a video (YouTube, Hudl, Veo…)<input type="text" id="v-link" name="link" inputmode="url" placeholder="https://"></label>
    <p class="small muted" id="v-status" aria-live="polite"></p>
    <div class="row"><button class="btn primary" type="submit">Add video</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  history: (ds) => `<h2>Add club history</h2><form data-form="history" data-id="${esc(ds.player)}">
    <label class="f" for="h-club">Club<input type="text" id="h-club" name="club" required maxlength="80"></label>
    <label class="f" for="h-team">Team or level<input type="text" id="h-team" name="team" maxlength="80" placeholder="e.g. U11 Boys, ECNL"></label>
    <div class="grid2" style="gap:14px">
      <label class="f" for="h-from">From (year)<input type="number" id="h-from" name="from" min="2005" max="2035" required></label>
      <label class="f" for="h-to">To (year, or leave empty if current)<input type="number" id="h-to" name="to" min="2005" max="2035"></label>
    </div>
    <label class="f" for="h-notes">Highlights (optional)<input type="text" id="h-notes" name="notes" maxlength="200" placeholder="e.g. League champions, team captain"></label>
    <div class="row"><button class="btn primary" type="submit">Add</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  comment: (ds) => { const p = S.players.find(x=>x.id===ds.player); return `<h2>Write about ${esc(p?p.name:"this player")}</h2><form data-form="comment" data-id="${esc(ds.player)}">
    <fieldset class="stack" style="border:0;padding:0;margin:0"><legend class="sr" style="font-weight:600;margin-bottom:8px">Type</legend>
      <label class="choice" for="c-ref"><input type="radio" id="c-ref" name="kind" value="reference" checked><span><b>Reference</b><br><span class="small muted">A recommendation for scouts or new coaches. Shows on the player's Recruitment Profile when it's public.</span></span></label>
      <label class="choice" for="c-com"><input type="radio" id="c-com" name="kind" value="comment"><span><b>Comment</b><br><span class="small muted">Feedback for the player and family only.</span></span></label>
    </fieldset>
    <label class="f" for="c-title">Your title (optional)<input type="text" id="c-title" name="title" maxlength="60" placeholder="e.g. Head Coach, U12 Boys"></label>
    <label class="f" for="c-text">What would you like to say?<textarea id="c-text" name="text" required maxlength="2000" style="min-height:140px"></textarea></label>
    <div class="row"><button class="btn primary" type="submit">Post</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  leave: () => `<h2>Leave ${esc(S.club.name)}?</h2><p>Players and reviews stay with the club. You can rejoin with the club code.</p>
    <div class="row"><button class="btn danger" data-act="leave">Leave</button><button class="btn" data-act="close">Cancel</button></div>`
};

/* ---------- actions ---------- */
const ACTS = {
  go: ds => { S.view = ds.view; S.preview = false; S.menuOpen = false; if(S.publicPage){ S.publicPage = null; try { history.replaceState(null, "", location.pathname + location.search); } catch(_){} } window.scrollTo(0,0); render(); },
  open: ds => { S.playerId = ds.id; S.view = "player"; S.preview = false; S.chartSkill = "overall"; S.ptab = "dev"; window.scrollTo(0,0); render(); },
  team: ds => { S.teamFilter = ds.id; render(); },
  cat: ds => { S.catFilter = ds.id; render(); },
  child: ds => { S.childId = ds.id; render(); },
  preview: () => { S.preview = !S.preview; render(); },
  modal: ds => { const f = MODALS[ds.m]; if(f) openModal(f(ds)); },
  close: () => closeModal(),
  closeBg: (ds, el, ev) => { if(ev.target === el) closeModal(); },
  copy: async ds => { try { await navigator.clipboard.writeText(ds.text); toast("Copied " + ds.text); } catch(_){ toast("Copy didn't work here. The code is " + ds.text); } },
  done: async ds => {
    const a = S.assignments.find(x => x.id === ds.id); if(!a) return;
    const t = today(); const had = (a.done||[]).includes(t);
    await save(async () => { const {error} = await sb.rpc("toggle_done", {aid:a.id, d:t}); if(error) throw dbErr(error); schedule("assignments"); }, had ? "Unmarked" : "Nice work! Logged for today.");
  },
  unassign: async ds => { await save(() => S.db.doc("assignments/" + ds.id).delete(), "Drill removed"); },
  delDrill: async ds => { await save(() => S.db.doc("drills/" + ds.id).delete(), "Drill deleted"); },
  delTeam: async ds => { if(S.teamFilter === ds.id) S.teamFilter = "all"; await save(() => S.db.doc("teams/" + ds.id).delete(), "Team deleted"); },
  delReview: async (ds, el) => {
    if(!el.dataset.armed){ el.dataset.armed = "1"; el.textContent = "Click again to permanently delete"; return; }
    await save(() => S.db.doc("reviews/" + ds.id).delete(), "Review deleted");
  },
  removeFromClub: async ds => {
    const el = document.querySelector('[data-act="removeFromClub"]');
    if(el && !el.dataset.armed){ el.dataset.armed = "1"; el.textContent = "Click again to remove"; return; }
    closeModal();
    const ok = await save(() => rpc("remove_from_club", {pid:ds.id}), "Removed from your club");
    if(ok){ S.view = "roster"; refreshAll(); render(); }
  },
  leaveTeam: async ds => { closeModal(); const ok = await save(() => rpc("leave_team", {pid:ds.id}), "Left the team"); if(ok) refreshAll(); },
  findTeam: ds => { S.find = {pid: ds.player || S.childId, q: "", results: null, pick: null}; openModal(findTeamModal()); },
  pickTeam: ds => { if(!S.find) return; S.find.pick = {clubId:ds.club, clubName:ds.clubName, teamId:ds.team, teamName:ds.teamName}; openModal(findTeamModal()); },
  unpickTeam: () => { if(!S.find) return; S.find.pick = null; openModal(findTeamModal()); },
  clubPick: (ds, el) => {
    const px = ds.scope, team = document.getElementById(px + "-team"), picked = document.getElementById(px + "-picked");
    if(!team) return;
    team.value = ds.team;
    document.querySelectorAll(`#${px}-res .team-pick`).forEach(b => b.setAttribute("aria-pressed", b === el ? "true" : "false"));
    if(picked){ picked.hidden = false; picked.innerHTML = `✓ <b>${esc(ds.teamName)}</b> at <b>${esc(ds.clubName)}</b>. The coach gets a request when you save.`; }
  },
  cancelRequest: async ds => { const ok = await save(() => rpc("cancel_request", {rid:ds.id}), "Request cancelled"); if(ok) refreshAll(); },
  declineReq: async (ds, el) => {
    if(!el.dataset.armed){ el.dataset.armed = "1"; el.textContent = "Click again to decline"; return; }
    const ok = await save(() => rpc("decide_request", {rid:ds.id, approve:false, tid:null}), "Request declined");
    if(ok) refreshAll();
  },
  startPlan: async () => { await save(() => S.db.doc("members/" + S.uid).update({familyPlan:"trial", planStarted:today()}), "Home Training trial started"); },
  cancelPlan: async () => { await save(() => S.db.doc("members/" + S.uid).update({familyPlan:null}), "Trial cancelled"); },
  ptab: ds => { S.ptab = ds.id; render(); },
  selfAssign: async ds => {
    const d = drillById(ds.drill); if(!d) return;
    await save(async () => {
      try { await S.db.collection("assignments").doc().set({clubId:(S.players.find(x => x.id === ds.player) || {}).clubId || null, playerId:ds.player, drillId:d.id, drillTitle:d.title, perWeek:3, note:"", assignedBy:S.uid, done:[], active:true, createdAt:Date.now()}); }
      catch(e){ if(e.code === "invalid_argument"){ const x = new Error("x"); x.userMessage = "Adding drills yourself needs a quick database update (003). Ask your club admin, or ask your coach to assign it."; throw x; } throw e; }
    }, "Added to this week's drills. Your coach can see it too.");
  },
  chatTeam: ds => { S.chatTeam = ds.id; render(); const c = document.getElementById("chat-input"); if(c) c.focus(); },
  delMsg: async ds => { await save(() => S.db.doc("messages/" + ds.id).delete(), "Message deleted"); },
  exitPublic: () => { try { history.replaceState(null, "", location.pathname + location.search); } catch(_){ try { location.hash = ""; } catch(__){} } S.publicSlug = null; S.pub = null; render(); },
  delPhoto: async ds => { const p = S.players.find(x=>x.id===ds.id); if(p) await saveProfile(p, {photo:null}, "Photo removed"); },
  slFilter: ds => { S.slFilter = ds.id; render(); },
  scoutClear: () => { S.scout = {f:{}}; runScout(); },
  shortlistAdd: async ds => {
    const ok = await save(() => S.db.collection("shortlist").doc().set({coachId:S.uid, playerId:ds.player, status:"watching", note:"", createdAt:Date.now(), updatedAt:Date.now()}), "Added to your shortlist");
    if(ok){ markScout(ds.player, {shortlisted:true}); schedule("shortlist"); }
  },
  shortlistRemove: async (ds, el) => {
    if(!el.dataset.armed){ el.dataset.armed = "1"; el.textContent = "Click again to remove"; return; }
    const sl = (S.shortlist || []).find(x => x.id === ds.id); if(!sl) return;
    const ok = await save(() => S.db.doc("shortlist/" + ds.id).delete(), "Removed from shortlist");
    if(ok){ markScout(sl.playerId, {shortlisted:false}); schedule("shortlist"); }
  },
  createRecruit: async ds => {
    const p = S.players.find(x => x.id === ds.id); if(!p) return;
    const R = (profileFor(p.id) || {}).recruit || {};
    await saveProfile(p, {recruit:{...R, created:true}, visibility:"private"}, "Recruitment Profile created. It's private until you make it public.");
  },
  delHighlight: async ds => { const p = S.players.find(x => x.id === ds.id); if(!p) return; const R = (profileFor(p.id) || {}).recruit || {};
    await saveProfile(p, {recruit:{...R, highlights:(R.highlights || []).filter((_, i) => i !== +ds.i)}}, "Highlight removed"); },
  delStat: async ds => { const p = S.players.find(x => x.id === ds.id); if(!p) return; const R = (profileFor(p.id) || {}).recruit || {};
    await saveProfile(p, {recruit:{...R, stats:(R.stats || []).filter((_, i) => i !== +ds.i)}}, "Season removed"); },
  delVideo: async ds => {
    const p = S.players.find(x=>x.id===ds.id), pr = profileFor(ds.id); if(!p || !pr) return;
    const vids = (pr.videos||[]).slice(); const [gone] = vids.splice(Number(ds.i), 1);
    const ok = await saveProfile(p, {videos:vids}, "Video removed");
    if(ok && gone && gone.asset && S.assets){ try { await S.assets.delete(gone.asset); } catch(_){} }
  },
  delHistory: async ds => {
    const p = S.players.find(x=>x.id===ds.id), pr = profileFor(ds.id); if(!p || !pr) return;
    const h = (pr.history||[]).slice(); h.splice(Number(ds.i), 1);
    await saveProfile(p, {history:h}, "Removed");
  },
  delComment: async ds => { await save(() => S.db.doc("comments/" + ds.id).delete(), "Deleted"); },
  leave: async () => { closeModal(); const ok = await save(() => S.db.doc("members/" + S.uid).delete(), "You left the club"); if(ok) await loadMe(); },
  signOut: async () => { await sb.auth.signOut(); },
};

async function rpc(name, args){
  const {data, error} = await sb.rpc(name, args);
  if(error){ const e = new Error(error.message); e.userMessage = error.message; throw e; }
  return data;
}

const FORMS = {
  createClub: async fd => {
    const ok = await save(() => rpc("create_club", {club_name:fd.get("club").trim(), my_name:fd.get("name").trim()}), "Club created");
    if(ok) await loadMe();
  },
  joinCoach: async fd => {
    let name = "";
    const ok = await save(async () => { name = await rpc("join_club", {club_code:fd.get("code").trim(), my_name:fd.get("name").trim()}); });
    if(ok){ toast("Welcome to " + name); await loadMe(); }
  },
  familyStart: async (fd, form) => {
    const r = await createPlayerFromForm(fd, form, String(fd.get("name")).trim());
    if(!r) return;
    toast(r.sent ? "Profile created and request sent to the coach" : "Profile created");
    S.childId = r.pid; S.view = "home"; S.ptab = "profile"; await loadMe(); refreshAll();
  },
  addChild: async (fd, form) => {
    const r = await createPlayerFromForm(fd, form, null);
    if(!r) return;
    closeModal(); toast(r.sent ? "Player added and request sent to the coach" : "Player added");
    S.childId = r.pid; S.view = "home"; S.ptab = "profile"; await loadMe(); refreshAll();
  },
  auth: async (fd, form) => {
    const email = String(fd.get("email")||"").trim(), password = String(fd.get("password")||"");
    const msg = form.querySelector("#auth-msg");
    msg.textContent = "";
    if(S.authMode === "signup"){
      const {data, error} = await sb.auth.signUp({email, password, options:{emailRedirectTo: APP_URL}});
      if(error){ msg.textContent = error.message; return; }
      if(!data.session) msg.textContent = "Check your email for a link to confirm your account, then sign in.";
    } else if(S.authMode === "reset"){
      const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: APP_URL});
      msg.textContent = error ? error.message : "If that email has an account, a reset link is on its way.";
    } else {
      const {error} = await sb.auth.signInWithPassword({email, password});
      if(error) msg.textContent = error.message === "Invalid login credentials" ? "That email and password don't match. Try again or reset your password." : error.message;
    }
  },
  newPassword: async (fd, form) => {
    const {error} = await sb.auth.updateUser({password:String(fd.get("password")||"")});
    if(error){ form.querySelector("#auth-msg").textContent = error.message; return; }
    S.recovery = false; toast("Password updated"); render();
  },
  team: async fd => {
    closeModal(); const id = crypto.randomUUID();
    const ok = await save(() => S.db.collection("teams").doc(id).set({clubId:S.me.clubId, name:fd.get("name").trim(), ageGroup:fd.get("age").trim(), createdAt:Date.now()}), "Team added. You're its coach.");
    if(ok){ await loadKey("teams"); await setTeamCoach(id, S.uid, true); }
  },
  editPlayer: async (fd, form) => {
    closeModal();
    await save(() => S.db.doc("players/" + form.dataset.id).update({teamId:fd.get("teamId"), position:fd.get("position")}), "Saved");
  },
  review: async (fd, form) => {
    const f = fd.get("form") === "gk" ? "gk" : "field";
    const ratings = {}; skillsFor(f).forEach(s => { const v = Number(fd.get("r-" + s.k)); ratings[s.k] = v >= 1 && v <= 5 ? v : 3; });
    const split = v => String(v||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);
    const strengths = Array.from(new Set(fd.getAll("str").concat(split(fd.get("strOther")))));
    const improve = Array.from(new Set(fd.getAll("imp").concat(split(fd.get("impOther")))));
    closeModal();
    const row = {clubId:S.me.clubId, playerId:form.dataset.id, coachId:S.uid, coachName:S.me.name||"", date:fd.get("date")||today(), ratings, strengths, improve, note:fd.get("note").trim(), summary:String(fd.get("summary")||"").trim().slice(0,280), createdAt:Date.now()};
    await save(async () => {
      try { await S.db.collection("reviews").doc().set(row); }
      catch(e){
        if(!/summary/i.test(e.message||"")) throw e;
        const {summary, ...rest} = row;
        await S.db.collection("reviews").doc().set({...rest, note: (summary ? "Update: " + summary + (rest.note ? "\n\n" + rest.note : "") : rest.note)});
        toast("Saved. Ask your admin to run database update 002 so update notes get their own field.", true);
      }
    }, "Review saved. The previous one stays in the timeline.");
  },
  assign: async fd => {
    const d = drillById(fd.get("drillId"));
    closeModal();
    await save(() => S.db.collection("assignments").doc().set({clubId:S.me.clubId, playerId:fd.get("playerId"), drillId:fd.get("drillId"), drillTitle:d?d.title:"", perWeek:Number(fd.get("perWeek"))||3, note:fd.get("note").trim(), assignedBy:S.uid, done:[], active:true, createdAt:Date.now()}), "Drill assigned");
  },
  drill: async fd => {
    closeModal();
    const steps = String(fd.get("steps")).split("\n").map(s=>s.trim()).filter(Boolean).slice(0,15);
    const level = LEVELS.includes(fd.get("level")) ? fd.get("level") : "Beginner";
    const ok = await save(() => S.db.collection("drills").doc().set({clubId:S.me.clubId, title:fd.get("title").trim(), category:fd.get("category"), minutes:Number(fd.get("minutes"))||10, equipment:fd.get("equipment").trim(), level, steps, createdBy:S.uid, createdAt:Date.now()}), "Drill added to " + level);
    if(ok){ S.drillLevel = level; render(); }
  },
  chat: async (fd, form) => {
    const text = String(fd.get("text")||"").trim(); if(!text || !S.chatTeam) return;
    const ann = isStaff() && !!fd.get("announce");
    const ta = form.querySelector("#chat-input"); if(ta) ta.value = "";
    const cb = form.querySelector("#chat-ann"); if(cb) cb.checked = false;
    const ok = await save(() => S.db.collection("messages").doc().set({clubId:(S.teams.find(t => t.id === S.chatTeam) || {}).clubId || S.me.clubId, teamId:S.chatTeam, authorId:S.uid, authorName:S.me.name||"", role:S.me.role, text:text.slice(0,1000), announce:ann, createdAt:Date.now()}));
    if(!ok){ const t2 = document.getElementById("chat-input"); if(t2 && !t2.value) t2.value = text; }
    const t3 = document.getElementById("chat-input"); if(t3) t3.focus();
  },
  about: async (fd, form) => {
    const p = S.players.find(x=>x.id===form.dataset.id); if(!p) return;
    const main = fd.get("main");
    let pos = fd.getAll("pos"); if(main){ pos = [main].concat(pos.filter(x => x !== main)); }
    const extra = String(fd.get("strOther")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);
    const strengths = Array.from(new Set(fd.getAll("str").concat(extra)));
    closeModal();
    await saveProfile(p, {positions:pos, foot:fd.get("foot")||"", strengths, bio:String(fd.get("bio")||"").trim()}, "Profile saved");
  },
  visibility: async (fd, form) => {
    const p = S.players.find(x=>x.id===form.dataset.id); if(!p) return;
    const v = fd.get("vis"); closeModal();
    await saveProfile(p, {visibility: v === "public" ? "public" : "private"}, v === "public" ? "The Recruitment Profile is public. Use Copy profile link to share it." : "The Recruitment Profile is private. Others only see the name, club and age.");
  },
  video: async (fd, form) => {
    const p = S.players.find(x=>x.id===form.dataset.id); if(!p) return;
    const file = fd.get("file"), link = String(fd.get("link")||"").trim();
    const status = form.querySelector("#v-status");
    let entry = {title:String(fd.get("title")||"").trim(), date:fd.get("date")||"", addedAt:Date.now()};
    if(file && file.size){
      if(file.size > 50*1024*1024){ status.textContent = "That file is over 50 MB. Trim it, or paste a link instead."; return; }
      status.innerHTML = '<span class="uploading">Uploading… keep this open.</span>';
      try {
        const type = /\.webm$/i.test(file.name) ? "video/webm" : (file.type === "video/webm" ? "video/webm" : "video/mp4");
        const r = await S.assets.upload(file, {type, folder:p.id});
        entry.asset = r.id;
      } catch(e){ status.textContent = assetErr(e); return; }
    } else if(link){
      if(!/^https:\/\/[^\s]+\.[^\s]+/i.test(link)){ status.textContent = "Paste a full link that starts with https://"; return; }
      entry.link = link;
    } else { status.textContent = "Choose a video file or paste a link."; return; }
    const pr = profileFor(p.id) || {};
    closeModal();
    await saveProfile(p, {videos:(pr.videos||[]).concat(entry).slice(-24)}, "Video added");
  },
  recruitDetails: async (fd, form) => {
    const p = S.players.find(x => x.id === form.dataset.id); if(!p) return;
    const pr = profileFor(p.id) || {}, R = pr.recruit || {}, g = k => String(fd.get(k) || "").trim();
    closeModal();
    await saveProfile(p, {foot:g("foot"), recruit:{...R, summary:g("summary").slice(0,800), gradYear:g("gradYear"), height:g("height"), weight:g("weight"), school:g("school"), gpa:g("gpa"),
      test:g("test"), major:g("major"), ncaaId:g("ncaaId"), league:g("league"), divisions:fd.getAll("div").filter(d => DIVISIONS.includes(d)), colleges:g("colleges"),
      committed:fd.get("committed") === "yes", committedTo:g("committedTo"), contact:g("contact"), location:g("location"), searchable:fd.get("searchable") === "on"}}, "Recruiting details saved");
  },
  highlight: async (fd, form) => {
    const p = S.players.find(x => x.id === form.dataset.id); if(!p) return;
    const R = (profileFor(p.id) || {}).recruit || {};
    closeModal();
    await saveProfile(p, {recruit:{...R, highlights:(R.highlights || []).concat({title:String(fd.get("title")).trim(), year:String(fd.get("year") || "").trim(), details:String(fd.get("details") || "").trim()}).slice(-40)}}, "Highlight added");
  },
  stat: async (fd, form) => {
    const p = S.players.find(x => x.id === form.dataset.id); if(!p) return;
    const R = (profileFor(p.id) || {}).recruit || {}, n = k => { const v = String(fd.get(k) || "").trim(); return v === "" ? "" : Math.max(0, parseInt(v, 10) || 0); };
    closeModal();
    await saveProfile(p, {recruit:{...R, stats:(R.stats || []).concat({season:String(fd.get("season")).trim(), team:String(fd.get("team") || "").trim(), games:n("games"), goals:n("goals"), assists:n("assists"), cleanSheets:n("cleanSheets")}).slice(-30)}}, "Season added");
  },
  history: async (fd, form) => {
    const p = S.players.find(x=>x.id===form.dataset.id); if(!p) return;
    const pr = profileFor(p.id) || {};
    const to = String(fd.get("to")||"").trim();
    const h = {club:String(fd.get("club")).trim(), team:String(fd.get("team")||"").trim(), from:String(fd.get("from")||"").trim(), to: to || "Present", notes:String(fd.get("notes")||"").trim()};
    closeModal();
    await saveProfile(p, {history:(pr.history||[]).concat(h).slice(-30)}, "Club added");
  },
  comment: async (fd, form) => {
    closeModal();
    await save(() => S.db.collection("comments").doc().set({clubId:S.me.clubId, playerId:form.dataset.id, kind:fd.get("kind")==="comment"?"comment":"reference", text:String(fd.get("text")).trim(), authorId:S.uid, authorName:S.me.name||"", authorTitle:String(fd.get("title")||"").trim(), date:today(), createdAt:Date.now()}), "Posted");
  },
  clubSettings: async fd => { closeModal(); await save(() => S.db.doc("clubs/" + S.club.id).update({name:fd.get("name").trim(), familyAccess:fd.get("familyAccess")}), "Club updated"); }
};

/* ---------- events ---------- */
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]"); if(!el) return;
  const f = ACTS[el.dataset.act]; if(!f) return;
  if(el.dataset.act === "closeBg" && ev.target !== el) return;
  ev.preventDefault(); f(el.dataset, el, ev);
});
document.addEventListener("keydown", ev => {
  if(ev.key === "Escape" && document.getElementById("modal").innerHTML) closeModal();
  if(ev.key === "Enter" && !ev.shiftKey && !ev.isComposing && (ev.target.id === "chat-input" || ev.target.id === "pm-input")){ ev.preventDefault(); const f = ev.target.form; if(f) f.requestSubmit(); return; }
  if((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches("tr[data-act]")){ ev.preventDefault(); ACTS.open(ev.target.dataset); }
});
document.addEventListener("submit", async ev => {
  const form = ev.target.closest("form[data-form]"); if(!form) return;
  ev.preventDefault();
  if(!S.uid && form.dataset.form !== "auth" && form.dataset.form !== "contact"){ toast("Sign in to save.", true); return; }
  const btn = form.querySelector('button[type="submit"]'); if(btn) btn.disabled = true;
  try { await FORMS[form.dataset.form](new FormData(form), form); } finally { if(btn && document.body.contains(btn)) btn.disabled = false; }
});
document.addEventListener("input", ev => {
  const o = ev.target.dataset && ev.target.dataset.out;
  if(o){ const out = document.getElementById(o); if(out){ out.textContent = ev.target.value; if(ev.target.dataset.scale) out.title = SCALE[ev.target.value] || ""; } }
  if(ev.target.dataset && ev.target.dataset.scale) updateChangeHint(ev.target.form);
});
document.addEventListener("input", ev => {
  const t = ev.target; if(!t.dataset || t.dataset.input !== "clubSearch") return;
  clearTimeout(clubSearchTimer); clubSearchTimer = setTimeout(() => runClubSearch(t), 250);
});
document.addEventListener("change", ev => {
  const t = ev.target; if(!t.dataset) return;
  if(t.dataset.clubmode){
    const fs = t.closest(".clubpick"); if(!fs) return;
    fs.querySelectorAll("[data-mode-panel]").forEach(el => { el.hidden = el.dataset.modePanel !== t.value; });
    const oc = fs.querySelector('[name="otherClub"]'); if(oc) oc.required = t.value === "other";
  }
  if(t.dataset.preview && t.files && t.files[0]){
    const prev = document.getElementById(t.dataset.preview); if(!prev) return;
    const img = document.createElement("img"); img.className = "photo"; img.id = t.dataset.preview; img.alt = "Profile picture preview";
    img.src = URL.createObjectURL(t.files[0]); prev.replaceWith(img);
    const lbl = document.querySelector(`label[for="${t.id}"]`); if(lbl) lbl.textContent = "Change picture";
  }
});
document.addEventListener("change", ev => {
  const t = ev.target; if(t.dataset && t.dataset.autosubmit && t.form) t.form.requestSubmit();
});
document.addEventListener("error", ev => {
  const t = ev.target;
  if(t && t.tagName === "IMG" && t.classList.contains("photo")){
    const d = document.createElement("div"); d.className = "photo ph"; d.setAttribute("aria-hidden","true"); d.textContent = t.dataset.initials || "";
    t.replaceWith(d);
  }
}, true);
window.addEventListener("hashchange", readHash);
document.addEventListener("change", async ev => {
  const t = ev.target;
  if(t.dataset && t.dataset.upload === "photo" && t.files && t.files[0]){
    const p = S.players.find(x=>x.id===t.dataset.id); if(!p) return;
    if(!S.assets){ toast("Uploads aren't available for your account here.", true); return; }
    toast("Uploading photo…");
    try {
      const blob = await shrinkImage(t.files[0]);
      const r = await S.assets.upload(blob, {type: blob.type && /^image\/(jpeg|png|webp|gif)$/.test(blob.type) ? blob.type : "image/jpeg", folder:p.id});
      const old = (profileFor(p.id)||{}).photo;
      const ok = await saveProfile(p, {photo:r.id}, "Photo updated");
      if(ok && old){ try { await S.assets.delete(old); } catch(_){} }
    } catch(e){ toast(assetErr(e), true); }
    return;
  }
});
function updateChangeHint(form){
  const box = form && form.querySelector("#r-changes"); if(!box || !form.dataset.last) return;
  let last; try { last = JSON.parse(form.dataset.last); } catch(_){ return; }
  const f = (form.querySelector('input[name="form"]:checked') || {}).value || "field";
  if(f !== last.form){ box.textContent = "Different review type from last time, so ratings start fresh."; return; }
  const ch = skillsFor(f).map(s => ({label:s.label, from:validRating(last.ratings[s.k]), to:validRating((form.querySelector("#r-" + s.k) || {}).value)}))
    .filter(c => c.from != null && c.to != null && c.from !== c.to);
  box.innerHTML = ch.length ? ch.map(changeChip).join(" ") : "None yet. Move a slider to record a change.";
}
document.addEventListener("change", ev => {
  if(ev.target.dataset && ev.target.dataset.reviewform){
    const f = ev.target.value, form = ev.target.form;
    form.querySelectorAll(".rset").forEach(el => {
      const on = el.dataset.set === f; el.hidden = !on;
      el.querySelectorAll("input").forEach(i => i.disabled = !on);
    });
    updateChangeHint(form);
    return;
  }
  if(ev.target.dataset && ev.target.dataset.change === "skillFilter"){ S.skillFilter = ev.target.value || null; render(); const el = document.getElementById("skill-filter"); if(el) el.focus(); return; }
  if(ev.target.dataset && ev.target.dataset.change === "pmPlayer"){ S.pmPlayer = ev.target.value; S.meetingId = null; render(); return; }
  if(ev.target.dataset && ev.target.dataset.change === "chatTeam"){ S.chatTeam = ev.target.value; render(); return; }
  if(ev.target.dataset && ev.target.dataset.change === "chartSkill"){ S.chartSkill = ev.target.value; render(); const s = document.getElementById("chart-skill"); if(s) s.focus(); }
});


/* ---------- public site pages (menu next to the logo) ---------- */
const PRICES = {club:"$39", clubPer:"per month, per club", family:"$6.99", familyPer:"per month, per family"};
const PUBLIC_PAGES = [
  ["how-it-works","How it works"], ["drills","Drills"], ["clubs","Clubs & Teams"], ["recruiting","Recruiting"],
  ["for-parents","For Parents"], ["pricing","Pricing"], ["contact","Contact Us"]
];
const PAGE_IDS = PUBLIC_PAGES.map(p => p[0]);

function publicNav(){
  const links = PUBLIC_PAGES.map(([id,label]) => `<a href="#${id}" class="navlink" ${S.publicPage===id?'aria-current="page"':""}>${label}</a>`).join("");
  return `<button type="button" class="menu-btn" data-act="menu" aria-expanded="${!!S.menuOpen}" aria-controls="site-nav">${S.menuOpen ? "Close" : "Menu"}</button>
    <nav id="site-nav" class="site-nav${S.menuOpen ? " open" : ""}" aria-label="Site">${links}<a href="#signin" class="btn primary sm nav-signin">Sign in</a></nav>`;
}
function siteFooter(){
  return `<footer class="site-foot"><div class="foot-in">
    <span class="brand small-brand" aria-label="${APP_NAME}">${logoHtml()}</span>
    <nav aria-label="Footer">${PUBLIC_PAGES.map(([id,label]) => `<a href="#${id}">${label}</a>`).join("")}</nav>
    <span class="muted small">© ${new Date().getFullYear()} ${APP_NAME}</span>
  </div></footer>`;
}
const cta = (coachLabel = "Start your club", famLabel = "I'm a parent or player") => `<div class="row cta-row">
  <button type="button" class="btn primary" data-act="pickPortal" data-id="coach">${coachLabel}</button>
  <button type="button" class="btn" data-act="pickPortal" data-id="family">${famLabel}</button></div>`;
const feature = (title, text) => `<div class="card stack feature"><h3>${title}</h3><p class="muted">${text}</p></div>`;

function publicPage(){
  switch(S.publicPage){
    case "how-it-works": return pageHow();
    case "drills": return pageDrills();
    case "clubs": return pageClubs();
    case "recruiting": return pageRecruiting();
    case "for-parents": return pageParents();
    case "pricing": return pagePricing();
    case "contact": return pageContact();
  }
  return "";
}

function pageHow(){
  const step = (n, title, text) => `<div class="step"><span class="step-n">${n}</span><div class="stack" style="gap:4px"><b>${title}</b><p class="muted">${text}</p></div></div>`;
  return `<section class="page-hero stack"><span class="eyebrow">How it works</span>
    <h1>From the coach's notes to practice at home</h1>
    <p class="lead">${APP_NAME} connects what coaches see at training with what players work on between sessions.</p></section>
  <div class="grid2">
    <div class="card stack"><h2>For coaches and clubs</h2>
      ${step(1,"Create your club","Sign up as a coach and start your club. You get a club code to share with your other coaches.")}
      ${step(2,"Add your teams","Families find your club by name and ask to join a team. You approve each request.")}
      ${step(3,"Review and assign","Rate 13 field-player skills (or 7 for goalkeepers) from 1 to 5, add an update note, and assign home drills.")}
    </div>
    <div class="card stack"><h2>For parents and players</h2>
      ${step(1,"Create your player's profile","Sign up as a parent or player. No code needed. The profile belongs to your family.")}
      ${step(2,"Join your team","Find your club by name, pick your team and send a request. The coach approves it.")}
      ${step(3,"See feedback and train at home","Every review and what changed, plus drills recommended from it to tick off each week.")}
    </div>
  </div>
  <div class="grid3">
    ${feature("Reviews that show progress","Every update is saved. Families see exactly which skills went up, and why.")}
    ${feature("Drills picked for each player","Recommendations come from the lowest ratings and the coach's own 'work on' notes.")}
    ${feature("Team chat","One place for schedule changes, announcements and quick questions, per team.")}
  </div>
  ${cta()}`;
}

function paywallBanner(){
  const n = BUILTIN_DRILLS.length, free = BUILTIN_DRILLS.filter(d => d.free).length;
  return `<div class="card paywall stack">
    <div class="row between"><h2>🔒 Full instructions come with Home Training</h2><span class="pill good">${free} free sample drills</span></div>
    <p>Browse all ${n} drills below and try the free samples. Step-by-step instructions for every drill, plus drills picked from your coach's review, are part of <b>Home Training</b>: <b>${PRICES.family}</b> ${PRICES.familyPer}, or included when your club covers it.</p>
    <div class="row">${S.uid ? `<button class="btn primary" data-act="go" data-view="plans">See Home Training</button>` : `<button class="btn primary" data-act="pickPortal" data-id="family">Sign up as a family</button><a class="btn" href="#pricing">See pricing</a>`}</div>
  </div>`;
}
function pageDrills(){
  const list = BUILTIN_DRILLS;
  return `<section class="page-hero stack"><span class="eyebrow">Drills</span>
    <h1>${BUILTIN_DRILLS.length} drills players can do at home</h1>
    <p class="lead">A ball, a wall and a little space. Drills are sorted into Beginner, Intermediate and Advanced, and each lists the skills it trains. Signed-in players get the ones that match their coach's latest review.</p></section>
  ${paywallBanner()}
  ${drillLibraryHtml(list)}
  <div class="card stack callout"><h2>Get drills picked for you</h2><p>When your coach reviews you on ${APP_NAME}, we recommend the drills that work on exactly what they flagged.</p>${cta("Start as a coach","Sign up as a parent or player")}</div>`;
}

function pageClubs(){
  return `<section class="page-hero stack"><span class="eyebrow">Clubs & Teams</span>
    <h1>Every player's development, in one place</h1>
    <p class="lead">Give every coach the same review tools, keep families informed, and see how each team is progressing.</p></section>
  <div class="grid3">
    ${feature("Consistent player reviews","13 field-player skills and 7 goalkeeper skills on the same 1 to 5 scale, so every coach in the club reviews the same way.")}
    ${feature("Progress you can show","Each review needs an update note. The timeline keeps every review and shows what improved.")}
    ${feature("Home training that sticks",`Assign drills or let ${APP_NAME} suggest them from the review. See who did their drills this week.`)}
    ${feature("Team chat & announcements","A chat for every team with coaches and families. Pin announcements for schedule changes.")}
    ${feature("Simple onboarding","Coaches join with your club code. Families find your club by name and ask to join a team. You approve. No spreadsheets.")}
    ${feature("Private by design","Families only see their own child. Reviews never appear on public profiles.")}
  </div>
  <div class="card stack callout"><h2>Set up your club in 5 minutes</h2>
    <ol class="numbered"><li>Sign up as a coach and choose <b>Start a club</b>.</li><li>Share your club code with your other coaches.</li><li>Add your teams. Families find your club by name and ask to join; you approve each request from the Players page.</li></ol>
    <div class="row cta-row"><button type="button" class="btn primary" data-act="pickPortal" data-id="coach">Start your club</button><a class="btn" href="#contact">Talk to us first</a></div></div>`;
}

/* a made-up 17-year-old for the public Recruiting page */
const RECRUIT_EXAMPLE = {name:"Jordan Reyes", initials:"JR", clubLine:"Example FC · U17 ECNL", gradYear:"2027", age:17,
  facts:[["GPA","3.7"],["SAT / ACT","SAT 1310"],["Height","5'10\""],["Stronger foot","Left"],["Club league","ECNL"],["Intended major","Kinesiology"]],
  positions:["CDM","CM"], divisions:["NCAA D1","NCAA D2"],
  highlights:[{title:"ECNL Midwest conference all-conference", year:"2026"},{title:"Team captain", year:"2026"},{title:"High school all-district first team", year:"2025"}],
  stats:[{season:"2025–26", team:"U17 ECNL", games:24, goals:5, assists:11}],
  reference:{text:"Jordan controls the tempo of our games and is the first to organize the team when things get hard. A coachable, high-character player who will add value to a college program.", author:"Coach Rivera", title:"Director of Coaching, Example FC"}};
function pageRecruiting(){
  const J = RECRUIT_EXAMPLE;
  return `<section class="page-hero stack"><span class="eyebrow">College recruiting</span>
    <h1>Get seen by college coaches</h1>
    <p class="lead">Players aged ${RECRUIT_AGE} and over can create a Recruitment Profile: one link with everything a college program looks for. Families choose whether verified college coaches can find it in ${APP_NAME}.</p></section>
  <div class="grid2">
    <div class="stack" style="gap:16px">
      ${feature("Academics up front","Class of, high school, GPA, SAT / ACT, intended major and NCAA Eligibility Center ID.")}
      ${feature("The soccer details coaches ask for","Positions, club league, height, stronger foot, divisions you're interested in and commitment status.")}
      ${feature("Highlights, stats and video","Career highlights, season stats and highlight videos from YouTube, Hudl or Veo.")}
      ${feature("References from your coaches","Club coaches write references in their own words, right from the player's page.")}
      ${feature("You stay in control","It starts private. Make it public when you're ready, and separately choose whether college coaches can find it. Coach reviews, ratings and messages are never on it.")}
      ${feature("Free for college coaches","Create a free account with your school .edu email. Search by position, class, GPA, league and division interest, keep a private shortlist and message families directly.")}
    </div>
    <div class="card stack">
      <div class="row between"><h3>What a college coach sees</h3><span class="pill warn">Example</span></div>
      <div class="pcard"><div class="photo ph" style="width:96px;height:96px;font-size:2rem" aria-hidden="true">${esc(J.initials)}</div>
        <div class="stack" style="gap:6px"><h2>${esc(J.name)}</h2><p class="muted">Class of ${esc(J.gradYear)} · ${esc(J.clubLine)} · Age ${J.age}</p>
          <div class="chips">${J.positions.map((k,i) => posChip(k, i===0)).join("")}<span class="chip open-badge">Uncommitted</span>${J.divisions.map(d => `<span class="chip">${esc(d)}</span>`).join("")}</div></div></div>
      <div class="facts">${J.facts.map(([k,v]) => `<div class="fact"><span class="small muted">${k}</span><b>${esc(v)}</b></div>`).join("")}</div>
      <div class="list">${J.highlights.map(h => `<div class="hl"><div class="row between"><b>🏆 ${esc(h.title)}</b><span class="small muted num">${esc(h.year)}</span></div></div>`).join("")}</div>
      <div class="tbl-wrap"><table class="stats"><thead><tr><th>Season</th><th>Team</th><th class="num">GP</th><th class="num">G</th><th class="num">A</th></tr></thead><tbody>${J.stats.map(x => `<tr><td>${esc(x.season)}</td><td>${esc(x.team)}</td><td class="num">${x.games}</td><td class="num">${x.goals}</td><td class="num">${x.assists}</td></tr>`).join("")}</tbody></table></div>
      <div class="vid"><div class="vlink" style="aspect-ratio:16/7">▶ 2026 season highlights</div></div>
      <div class="ref reference"><blockquote>${esc(J.reference.text)}</blockquote><span class="small"><b>${esc(J.reference.author)}</b>, ${esc(J.reference.title)}</span></div>
    </div>
  </div>
  <div class="row cta-row">
    <button type="button" class="btn primary" data-act="pickPortal" data-id="family">Build a Recruitment Profile</button>
    <button type="button" class="btn" data-act="pickPortal" data-id="college">College coach? Join free</button></div>`;
}

function pageParents(){
  return `<section class="page-hero stack"><span class="eyebrow">For Parents</span>
    <h1>Know what your child is working on</h1>
    <p class="lead">See your coach's feedback as it happens, help with the right drills at home, and keep up with the team without digging through group texts.</p></section>
  <div class="grid3">
    ${feature("Real feedback","Ratings from 1 to 5, strengths, what to work on and a note from the coach after every review.")}
    ${feature("Progress over the season","Every review is saved, so you can see what's improving and what's next.")}
    ${feature("15 minutes at home","Drills picked from the coach's review, with step-by-step instructions. Tick them off each week.")}
    ${feature("Team chat","Schedule changes and announcements from the coach, in one place.")}
    ${feature(`College recruiting at ${RECRUIT_AGE}`,`From age ${RECRUIT_AGE}, a Recruitment Profile with academics, highlight videos and coach references for college coaches. You decide who sees it.`)}
    ${feature("Private and safe","Only your child's coaches and your family can see reviews. Other families can't.")}
  </div>
  <div class="card stack callout"><h2>How to join</h2>
    <ol class="numbered"><li>Sign up as a parent or player. No code needed.</li><li>Create your player's profile: positions, strengths, highlights.</li><li>Find your club by name, pick your team and send a request. Once the coach approves, you'll see their reviews, home drills and team chat.</li></ol>
    <div class="row cta-row"><button type="button" class="btn primary" data-act="pickPortal" data-id="family">Sign up as a parent or player</button></div></div>`;
}

function pagePricing(){
  return `<section class="page-hero stack"><span class="eyebrow">Pricing</span>
    <h1>Simple plans for clubs and families</h1>
    <p class="lead">Clubs choose whether Home Training is included for every family, or whether families add it themselves.</p></section>
  <div class="grid2">
    <div class="card plan">
      <span class="pill plain" style="align-self:flex-start">For clubs & coaches</span>
      <h2>Club plan</h2>
      <div><span class="price">${PRICES.club}</span> <span class="muted">${PRICES.clubPer}</span></div>
      <ul><li>Unlimited players, teams and coaches</li><li>Field player and goalkeeper reviews with update notes</li><li>Progress timeline for every player</li><li>Drill library, recommendations and your own club drills</li><li>Team chat with announcements</li><li>Option to include Home Training for every family</li></ul>
      <button type="button" class="btn primary" data-act="pickPortal" data-id="coach" style="align-self:flex-start">Start your club</button>
    </div>
    <div class="card plan featured">
      <span class="pill good" style="align-self:flex-start">For parents & players</span>
      <h2>Home Training</h2>
      <div><span class="price">${PRICES.family}</span> <span class="muted">${PRICES.familyPer}</span></div>
      <ul><li>Drills recommended from the coach's review</li><li>Full home drill library</li><li>Progress charts and full review timeline</li><li>Weekly drill tracking your coach can see</li></ul>
      <p class="small muted">Free with every club: the coach's latest review, skill ratings, player profile and team chat.</p>
      <button type="button" class="btn" data-act="pickPortal" data-id="family" style="align-self:flex-start">Sign up as a family</button>
    </div>
  </div>
  <div class="card plan college-plan">
    <div class="row between"><div class="stack" style="gap:4px"><span class="pill plain" style="align-self:flex-start">For college coaches</span>
      <h2>College recruiting</h2><div><span class="price">Free</span> <span class="muted">with a college coach account</span></div></div>
      <button type="button" class="btn" data-act="pickPortal" data-id="college" style="align-self:center">Create a free account</button></div>
    <ul><li>Search players aged ${RECRUIT_AGE}+ by position, class, GPA, league and division interest</li><li>Private shortlist with status and notes</li><li>Message families directly; they reply to your school email</li><li>Needs a school .edu email address</li></ul>
  </div>
  <div class="card stack"><h2>Questions</h2>
    <div class="faq"><b>Do college coaches pay?</b><p class="muted">No. Searching for players, the shortlist and messaging families are free once you create a college coach account with your school .edu email.</p></div>
    <div class="faq"><b>Is Home Training free if my club includes it?</b><p class="muted">Yes. If your club includes Home Training, every connected family gets it at no extra cost.</p></div>
    <div class="faq"><b>Do players need their own account?</b><p class="muted">No. One parent account can hold every child's profile.</p></div>
    <div class="faq"><b>What happens if we change clubs?</b><p class="muted">The profile belongs to your family, not the club. Leave the old team and ask to join the new one. You keep every past review and reference; the old club's coaches lose access.</p></div>
    <div class="faq"><b>Something else?</b><p class="muted"><a href="#contact">Contact us</a> and we'll get back to you.</p></div>
  </div>`;
}

function pageContact(){
  if(S.contactSent) return `<section class="page-hero stack"><span class="eyebrow">Contact Us</span><h1>Thanks, we got your message</h1>
    <p class="lead">We'll reply to ${esc(S.contactSent)} as soon as we can.</p><div><a class="btn" href="#how-it-works">See how ${APP_NAME} works</a></div></section>`;
  return `<section class="page-hero stack"><span class="eyebrow">Contact Us</span>
    <h1>Talk to us</h1>
    <p class="lead">Want a walkthrough for your club, have a question about pricing, or need help with your account? Send us a message.</p></section>
  <form class="card stack contact-form" data-form="contact" style="max-width:720px">
    <div class="grid2" style="gap:14px">
      <label class="f" for="ct-name">Your name<input type="text" id="ct-name" name="name" required maxlength="80" autocomplete="name"></label>
      <label class="f" for="ct-email">Email<input type="email" id="ct-email" name="email" required maxlength="120" autocomplete="email"></label>
      <label class="f" for="ct-role">I am a<select id="ct-role" name="role"><option>Club director</option><option>Coach</option><option>Parent</option><option>Player</option><option>Other</option></select></label>
      <label class="f" for="ct-topic">Topic<select id="ct-topic" name="topic"><option>Club demo</option><option>Pricing</option><option>Help with my account</option><option>Feedback</option><option>Other</option></select></label>
    </div>
    <label class="f" for="ct-club">Club or team (optional)<input type="text" id="ct-club" name="club" maxlength="120"></label>
    <label class="f" for="ct-msg">Message<textarea id="ct-msg" name="message" required maxlength="2000" style="min-height:140px"></textarea></label>
    <div class="hp" aria-hidden="true"><label for="ct-web">Leave this empty<input type="text" id="ct-web" name="website" tabindex="-1" autocomplete="off"></label></div>
    <p class="small" id="ct-msg-status" role="status" style="color:var(--accent);font-weight:600"></p>
    <div><button class="btn primary" type="submit">Send message</button></div>
  </form>`;
}

FORMS.contact = async (fd, form) => {
  const status = form.querySelector("#ct-msg-status");
  if(String(fd.get("website") || "")){ S.contactSent = "you"; render(); return; }
  const row = {name:String(fd.get("name")).trim(), email:String(fd.get("email")).trim(), role:String(fd.get("role")||""), topic:String(fd.get("topic")||""),
    club:String(fd.get("club")||"").trim(), message:String(fd.get("message")).trim()};
  const {error} = await sb.from("contact_messages").insert(row);
  if(error){ console.error(error); status.textContent = "Your message couldn't be sent right now. Please try again in a moment."; return; }
  S.contactSent = row.email; render(); window.scrollTo(0,0);
};
ACTS.menu = () => { S.menuOpen = !S.menuOpen; render(); };
ACTS.home = () => { S.publicPage = null; S.menuOpen = false; try { history.replaceState(null, "", location.pathname + location.search); } catch(_){} render(); window.scrollTo(0,0); };


/* ---------- private messages: coach / player / parent, plus a meeting room per player ---------- */
const MEETING_TOPICS = ["Discuss a review","Progress and goals","Playing time","Position","Training at home","Something else"];
const MEETING_STATUS = {requested:{label:"Requested",cls:"warn"}, scheduled:{label:"Scheduled",cls:"good"}, done:{label:"Done",cls:"plain"}, cancelled:{label:"Cancelled",cls:"plain"}};

const isAdmin = () => !!(S.me && S.me.role === "admin");
const coachesOfTeam = tid => S.teamCoaches.filter(tc => tc.team_id === tid).map(tc => S.members.find(m => m.id === tc.member_id)).filter(Boolean);
const teamsOfCoach = mid => S.teamCoaches.filter(tc => tc.member_id === mid).map(tc => S.teams.find(t => t.id === tc.team_id)).filter(Boolean);
const myCoachTeamIds = () => S.teamCoaches.filter(tc => tc.member_id === S.uid).map(tc => tc.team_id);
/* private chat & meetings: the player's own team coaches, the club admin, and the player's family */
function canMessage(p){
  if(!p || !S.me) return false;
  if(isAdmin()) return true;
  if(isStaff()) return !!p.teamId && myCoachTeamIds().includes(p.teamId);
  return (S.me.playerIds||[]).includes(p.id);
}
async function setTeamCoach(tid, mid, on){
  return save(async () => {
    const {error} = on ? await sb.from("team_coaches").insert({team_id:tid, member_id:mid})
                       : await sb.from("team_coaches").delete().eq("team_id", tid).eq("member_id", mid);
    if(error && !(on && /duplicate|unique/i.test(error.message||""))) throw dbErr(error);
    await loadKey("teamCoaches");
  });
}
function pmPlayers(){
  const list = S.players.filter(canMessage);
  const last = pid => { const m = S.pmessages.filter(x => x.playerId === pid); return m.length ? m[m.length-1].createdAt : 0; };
  return list.sort((a,b) => (last(b.id) - last(a.id)) || String(a.name).localeCompare(String(b.name)));
}
const pmThread = (pid, mid = null) => S.pmessages.filter(m => m.playerId === pid && (mid ? m.meetingId === mid : !m.meetingId));
const meetingsFor = pid => S.meetings.filter(m => m.playerId === pid);
const readKey = (pid, mid) => mid ? "m:" + mid : "p:" + pid;
function unreadIn(pid, mid){
  const lr = (S.me && S.me.lastRead && S.me.lastRead[readKey(pid, mid)]) || 0;
  return pmThread(pid, mid).filter(m => m.createdAt > lr && m.authorId !== S.uid).length;
}
function pmUnreadFor(pid){ return unreadIn(pid, null) + meetingsFor(pid).reduce((n, mt) => n + unreadIn(pid, mt.id), 0); }
function totalPmUnread(){ if(!S.me) return 0; return pmPlayers().reduce((n, p) => n + pmUnreadFor(p.id), 0); }
const openMeetings = pid => meetingsFor(pid).filter(m => m.status === "requested" || m.status === "scheduled").length;

let pmReadPending = false;
async function markPmRead(){
  const pid = S.pmPlayer; if(!pid || pmReadPending) return;
  const mid = S.pmTab === "meetings" ? S.meetingId : null;
  if(S.pmTab === "meetings" && !mid) return;
  const ms = pmThread(pid, mid); if(!ms.length) return;
  const newest = ms[ms.length-1].createdAt || 0, key = readKey(pid, mid);
  const lr = (S.me.lastRead && S.me.lastRead[key]) || 0;
  if(newest <= lr || document.hidden) return;
  pmReadPending = true;
  try { await S.db.doc("members/" + S.uid).update({lastRead:{...(S.me.lastRead||{}), [key]:newest}}); } catch(_){}
  pmReadPending = false;
}
document.addEventListener("visibilitychange", () => { if(!document.hidden && S.view === "messages") markPmRead(); });

function bubblesHtml(ms, emptyText){
  if(!ms.length) return `<div class="muted" style="margin:auto;text-align:center;max-width:44ch">${emptyText}</div>`;
  let lastDay = "", lastAuthor = "", lastTs = 0, out = "";
  for(const m of ms){
    const dl = dayLabel(m.createdAt);
    if(dl !== lastDay){ out += `<div class="day">${esc(dl)}</div>`; lastDay = dl; lastAuthor = ""; }
    const mine = m.authorId === S.uid, grouped = m.authorId === lastAuthor && m.createdAt - lastTs < 5*60*1000;
    const canDel = mine || (S.me && S.me.role === "admin");
    const tag = (m.role === "coach" || m.role === "admin") ? `<span class="pill good">Coach</span>` : `<span class="pill plain">Family</span>`;
    out += `<div class="msg${mine?" mine":""}">${grouped?"":`<div class="who">${mine?"":`<b>${esc(m.authorName||"Someone")}</b>${tag}`}<span>${msgTime(m.createdAt)}</span></div>`}<div class="bubble">${esc(m.text)}</div>${canDel?`<button class="btn ghost sm del" data-act="delPm" data-id="${esc(m.id)}" aria-label="Delete message">Delete</button>`:""}</div>`;
    lastAuthor = m.authorId; lastTs = m.createdAt;
  }
  return out;
}
function composerHtml(placeholder, form, extra = ""){
  return `<form class="composer" data-form="${form}">
    <label for="pm-input" class="small muted">${placeholder}</label>
    <textarea id="pm-input" name="text" maxlength="2000" rows="2" placeholder="Write a message. Enter sends, Shift+Enter adds a line."></textarea>
    <div class="row"><span class="small muted">🔒 Private: only this player's family, their team's coaches and the club admin can read this.</span>${extra}<button class="btn primary" type="submit">Send</button></div>
  </form>`;
}
function fmtWhen(ts){
  if(!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}) + " at " + d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
}
function locationHtml(loc){
  if(!loc) return "";
  return /^https:\/\/\S+$/i.test(loc) ? `<a class="btn primary sm" href="${esc(loc)}" target="_blank" rel="noopener noreferrer">Join video call</a> <span class="small muted">${esc(hostOf(loc))}</span>` : esc(loc);
}
function reviewMini(r){
  if(!r) return "";
  const rs = reviewsFor(r.playerId), i = rs.findIndex(x => x.id === r.id), prev = i > 0 ? rs[i-1] : null;
  const o = overall(r), po = overall(prev), ch = changesBetween(prev, r);
  return `<div class="review-mini stack" style="gap:6px">
    <div class="row between"><b>Review from ${fmtDate(r.date)}</b><span class="row"><span class="score num">${o!=null?fix1(o):"–"}</span>${o!=null&&po!=null?deltaHtml(o-po):""}</span></div>
    ${r.summary ? `<p class="tl-sum">“${esc(r.summary)}”</p>` : ""}
    ${ch.length ? `<div class="chips">${ch.map(changeChip).join("")}</div>` : ""}
    ${(r.improve||[]).length ? `<div class="chips">${r.improve.map(t=>`<span class="chip imp">Work on: ${esc(t)}</span>`).join("")}</div>` : ""}
  </div>`;
}

function messagesView(){
  const players = pmPlayers();
  if(!players.length){
    if(isStaff() && !isAdmin() && !myCoachTeamIds().length) return `<h1>Messages</h1><div class="locked"><h2>You're not assigned to a team yet</h2><p>Private conversations are only open to each player's own team coaches. Ask your club admin to add you to your teams on the Club page, or add yourself there.</p><button class="btn primary" data-act="go" data-view="club">Go to Club</button></div>`;
    return `<h1>Messages</h1><div class="locked"><h2>No players yet</h2><p>${isStaff() ? "Add players to your teams first. Each player gets a private chat with their family." : "Add your player and ask to join a team first. Private messages with the coaches open once you're on a team."}</p></div>`;
  }
  if(!players.find(p => p.id === S.pmPlayer)) S.pmPlayer = players[0].id;
  const p = players.find(x => x.id === S.pmPlayer);
  const fams = S.members.filter(m => m.role === "family" && (m.playerIds||[]).includes(p.id));
  const famNames = fams.map(m => m.name).filter(Boolean);
  const nOpen = openMeetings(p.id), mUnread = meetingsFor(p.id).reduce((n, mt) => n + unreadIn(p.id, mt.id), 0), cUnread = unreadIn(p.id, null);
  const side = `<aside class="chat-side" aria-label="Private conversations"><h3>${isStaff() ? "Players" : "Your player"}</h3>
    ${players.map(pl => { const last = pmThread(pl.id).slice(-1)[0], u = pmUnreadFor(pl.id), om = openMeetings(pl.id);
      return `<button data-act="pmPlayer" data-id="${esc(pl.id)}" aria-current="${pl.id===p.id}"><span class="tn"><span>${esc(pl.name)}${om?` <span class="pill warn" style="font-size:.68rem">${om} meeting${om>1?"s":""}</span>`:""}</span><span class="tp">${last ? esc((last.authorName||"") + ": " + last.text) : isStaff() ? esc(teamName(pl.teamId)) : "No messages yet"}</span></span>${u?`<span class="badge">${u}</span>`:""}</button>`; }).join("")}
  </aside>`;
  const head = `<div class="chat-head">
    <div class="stack" style="gap:0"><h2>${esc(p.name)}</h2><span class="small muted">🔒 ${(() => { const cs = coachesOfTeam(p.teamId).map(m => m.name).filter(Boolean); return cs.length ? esc(cs.join(", ")) + " (" + esc(teamName(p.teamId)) + " coaches)" : esc(teamName(p.teamId)) + " coaches"; })()} · club admin · ${famNames.length ? esc(famNames.join(", ")) : "family (not connected yet)"}</span></div>
    <select class="chat-pick" aria-label="Choose player" data-change="pmPlayer">${players.map(pl=>`<option value="${esc(pl.id)}" ${pl.id===p.id?"selected":""}>${esc(pl.name)}</option>`).join("")}</select>
  </div>
  <div class="subtabs pm-tabs" role="tablist">
    <button role="tab" data-act="pmTab" data-id="chat" aria-selected="${S.pmTab!=="meetings"}">Private chat${cUnread?` <span class="badge">${cUnread}</span>`:""}</button>
    <button role="tab" data-act="pmTab" data-id="meetings" aria-selected="${S.pmTab==="meetings"}">Meeting room${nOpen?` · ${nOpen} open`:""}${mUnread?` <span class="badge">${mUnread}</span>`:""}</button>
  </div>`;
  let main;
  if(S.pmTab !== "meetings"){
    main = `<div class="thread" id="pm-thread" data-key="${esc(readKey(p.id,null))}" aria-live="polite">${bubblesHtml(pmThread(p.id), isStaff() ? `Start a private conversation with ${esc(p.name)}'s family. Only they, ${esc(p.name)}'s team coaches and the club admin can see it.` : `Message your coaches privately. Only your family, your team's coaches and the club admin can see this.`)}</div>
      ${p.clubId ? composerHtml("Message about " + esc(p.name), "pm") : `<p class="small muted composer">${esc(p.name)} isn't on a team right now, so new messages are paused. Your past messages stay here.</p>`}`;
  } else if(S.meetingId && meetingsFor(p.id).some(m => m.id === S.meetingId)){
    main = meetingRoom(p, S.meetings.find(m => m.id === S.meetingId));
  } else {
    S.meetingId = null;
    main = meetingList(p);
  }
  return `<div class="chat pm">${side}<section class="chat-main" aria-label="Private conversation about ${esc(p.name)}">${head}${main}</section></div>`;
}

function meetingList(p){
  const ms = meetingsFor(p.id).slice().sort((a,b) => (b.scheduledAt||b.createdAt) - (a.scheduledAt||a.createdAt));
  const open = ms.filter(m => m.status === "requested" || m.status === "scheduled"), past = ms.filter(m => !(m.status === "requested" || m.status === "scheduled"));
  const card = m => { const st = MEETING_STATUS[m.status] || MEETING_STATUS.requested, u = unreadIn(p.id, m.id), r = S.reviews.find(x => x.id === m.reviewId);
    return `<button class="meeting-card" data-act="openMeeting" data-id="${esc(m.id)}">
      <span class="row between"><b>${esc(m.topic)}</b><span class="row" style="gap:6px">${u?`<span class="badge">${u}</span>`:""}<span class="pill ${st.cls}">${st.label}</span></span></span>
      <span class="small muted">${m.status==="scheduled" && m.scheduledAt ? "🗓 " + esc(fmtWhen(m.scheduledAt)) + (m.location && !/^https:/i.test(m.location) ? " · " + esc(m.location) : m.location ? " · video call" : "") : m.status==="requested" ? "Requested by " + esc(m.createdByName||"someone") + (m.preferredTimes ? " · prefers " + esc(m.preferredTimes) : "") : fmtDate(new Date(m.updatedAt||m.createdAt).toLocaleDateString("en-CA"))}</span>
      ${r ? `<span class="small">About the review from ${fmtDate(r.date)}</span>` : ""}
    </button>`; };
  return `<div class="meetings stack">
    <div class="row between"><div class="stack" style="gap:2px"><h3>Meeting room</h3><span class="small muted">Talk through a review or anything else, privately, then meet in person, by phone or on a video call.</span></div>
      <button class="btn primary sm" data-act="modal" data-m="meetingNew" data-player="${esc(p.id)}">${isStaff() ? "Set up a meeting" : "Request a meeting"}</button></div>
    ${open.length ? `<div class="stack" style="gap:10px">${open.map(card).join("")}</div>` : `<p class="muted">No open meetings.${isStaff() ? "" : " Want to talk through a review with your coach? Request a meeting."}</p>`}
    ${past.length ? `<details><summary class="small">Past meetings (${past.length})</summary><div class="stack" style="gap:10px;margin-top:10px">${past.map(card).join("")}</div></details>` : ""}
  </div>`;
}

function meetingRoom(p, m){
  const st = MEETING_STATUS[m.status] || MEETING_STATUS.requested, r = S.reviews.find(x => x.id === m.reviewId);
  const staff = isStaff(), mineReq = m.createdBy === S.uid, active = m.status === "requested" || m.status === "scheduled";
  return `<div class="meeting-room">
    <div class="meeting-info stack">
      <button class="btn ghost sm back" data-act="closeMeeting">← All meetings</button>
      <div class="row between"><h3>${esc(m.topic)}</h3><span class="pill ${st.cls}">${st.label}</span></div>
      <div class="meeting-facts">
        <div><span class="small muted">When</span><div>${m.scheduledAt ? esc(fmtWhen(m.scheduledAt)) : m.preferredTimes ? "Not set yet · prefers " + esc(m.preferredTimes) : "Not set yet"}</div></div>
        <div><span class="small muted">Where</span><div>${m.location ? locationHtml(m.location) : "Not set yet"}</div></div>
        <div><span class="small muted">Requested by</span><div>${esc(m.createdByName || "—")}</div></div>
      </div>
      ${m.details ? `<p style="white-space:pre-wrap">${esc(m.details)}</p>` : ""}
      ${r ? reviewMini(r) : ""}
      ${m.notes ? `<div class="note"><b>Meeting notes</b><p style="white-space:pre-wrap;margin-top:4px">${esc(m.notes)}</p></div>` : ""}
      <div class="row">
        ${staff && active ? `<button class="btn primary sm" data-act="modal" data-m="meetingSchedule" data-id="${esc(m.id)}">${m.status === "scheduled" ? "Change time or place" : "Schedule it"}</button>` : ""}
        ${staff && m.status !== "cancelled" ? `<button class="btn sm" data-act="modal" data-m="meetingNotes" data-id="${esc(m.id)}">${m.status === "done" ? "Edit notes" : "Add notes & mark done"}</button>` : ""}
        ${active && (staff || mineReq) ? `<button class="btn ghost sm" data-act="cancelMeeting" data-id="${esc(m.id)}">Cancel meeting</button>` : ""}
      </div>
    </div>
    <div class="thread" id="pm-thread" data-key="${esc(readKey(p.id, m.id))}" aria-live="polite">${bubblesHtml(pmThread(p.id, m.id), "This is the meeting room. Share questions or an agenda before you meet, and follow up afterwards.")}</div>
    ${composerHtml("Meeting room: " + esc(m.topic), "pmMeeting")}
  </div>`;
}

/* modals */
MODALS.teamCoaches = ds => {
  const t = S.teams.find(x => x.id === ds.id); if(!t) return "<p>Team not found.</p>";
  const staff = S.members.filter(m => m.role === "coach" || m.role === "admin");
  const on = new Set(coachesOfTeam(t.id).map(m => m.id));
  return `<h2>Coaches for ${esc(t.name)}</h2>
  <p class="small muted">Assigned coaches can see the private conversations and meetings of players on this team. You (club admin) see every team's.</p>
  <form data-form="teamCoaches" data-id="${esc(t.id)}">
    <div class="stack" style="gap:8px">${staff.map(m => `<label class="choice" for="tc-${esc(m.id)}"><input type="checkbox" id="tc-${esc(m.id)}" name="coach" value="${esc(m.id)}" ${on.has(m.id)?"checked":""}><span><b>${esc(m.name||"Coach")}</b> <span class="small muted">${m.role==="admin"?"Club admin":"Coach"}</span></span></label>`).join("") || '<p class="muted">No coaches have joined yet. Share your club code.</p>'}</div>
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div>
  </form>`;
};
FORMS.teamCoaches = async (fd, form) => {
  const tid = form.dataset.id, want = new Set(fd.getAll("coach")), have = new Set(coachesOfTeam(tid).map(m => m.id));
  closeModal();
  for(const mid of want) if(!have.has(mid)) await setTeamCoach(tid, mid, true);
  for(const mid of have) if(!want.has(mid)) await setTeamCoach(tid, mid, false);
  toast("Team coaches updated");
};
ACTS.selfCoach = async ds => { const ok = await setTeamCoach(ds.id, S.uid, ds.on === "1"); if(ok) toast(ds.on === "1" ? "You're now a coach on this team" : "You left this team"); };
MODALS.meetingNew = ds => {
  const p = S.players.find(x => x.id === ds.player); if(!p) return "<p>Player not found.</p>";
  const rs = reviewsFor(p.id).slice().reverse(), pre = ds.review || "";
  const topic = pre ? "Discuss a review" : "";
  return `<h2>${isStaff() ? "Set up a meeting" : "Request a meeting"} about ${esc(p.name)}</h2>
  <form data-form="meetingNew" data-player="${esc(p.id)}">
    <label class="f" for="mt-topic">Topic<select id="mt-topic" name="topic">${MEETING_TOPICS.map(t=>`<option ${t===topic?"selected":""}>${t}</option>`).join("")}</select></label>
    <label class="f" for="mt-review">Review to discuss (optional)<select id="mt-review" name="reviewId"><option value="">None</option>${rs.map(r=>`<option value="${esc(r.id)}" ${r.id===pre?"selected":""}>${fmtDate(r.date)}${r.summary?" · " + esc(String(r.summary).slice(0,60)):""}</option>`).join("")}</select></label>
    <label class="f" for="mt-details">What would you like to talk about?<textarea id="mt-details" name="details" maxlength="2000" required placeholder="${isStaff() ? "e.g. I'd like to go through the latest review and set goals for the spring." : "e.g. We'd like to understand the shooting rating and what to work on at home."}"></textarea></label>
    ${isStaff() ? `<div class="grid2" style="gap:14px">
        <label class="f" for="mt-when">When (optional)<input type="datetime-local" id="mt-when" name="when"></label>
        <label class="f" for="mt-where">Where or video link (optional)<input type="text" id="mt-where" name="where" maxlength="300" placeholder="Field 2, phone, or https://meet…"></label></div>`
      : `<label class="f" for="mt-times">Times that work for you (optional)<input type="text" id="mt-times" name="times" maxlength="300" placeholder="e.g. Weekday evenings after 6, or before Saturday practice"></label>`}
    <div class="row"><button class="btn primary" type="submit">${isStaff() ? "Create meeting" : "Send request"}</button><button class="btn" type="button" data-act="close">Cancel</button></div>
  </form>`;
};
const toLocalInput = ts => { if(!ts) return ""; const d = new Date(ts); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,16); };
MODALS.meetingSchedule = ds => {
  const m = S.meetings.find(x => x.id === ds.id); if(!m) return "<p>Meeting not found.</p>";
  return `<h2>Schedule: ${esc(m.topic)}</h2>${m.preferredTimes ? `<p class="small muted">They prefer: ${esc(m.preferredTimes)}</p>` : ""}
  <form data-form="meetingSchedule" data-id="${esc(m.id)}">
    <label class="f" for="ms-when">Date and time<input type="datetime-local" id="ms-when" name="when" required value="${toLocalInput(m.scheduledAt)}"></label>
    <label class="f" for="ms-where">Where<input type="text" id="ms-where" name="where" maxlength="300" value="${esc(m.location||"")}" placeholder="e.g. Oakley field after practice, by phone, or a video link (https://…)"></label>
    <p class="small muted">Paste a Google Meet, Zoom or Teams link to give everyone a "Join video call" button.</p>
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div>
  </form>`;
};
MODALS.meetingNotes = ds => {
  const m = S.meetings.find(x => x.id === ds.id); if(!m) return "<p>Meeting not found.</p>";
  return `<h2>Meeting notes: ${esc(m.topic)}</h2>
  <form data-form="meetingNotes" data-id="${esc(m.id)}">
    <label class="f" for="mn-notes">What did you agree?<textarea id="mn-notes" name="notes" maxlength="4000" required style="min-height:160px" placeholder="e.g. Agreed 3 shooting sessions a week at home; re-review in 6 weeks; try a new position in the next two games.">${esc(m.notes||"")}</textarea></label>
    <p class="small muted">The family sees these notes in the meeting room.</p>
    <div class="row"><button class="btn primary" type="submit">Save & mark done</button><button class="btn" type="button" data-act="close">Cancel</button></div>
  </form>`;
};

/* actions */
ACTS.setVis = async ds => {
  const p = S.players.find(x => x.id === ds.player); if(!p) return;
  if(visOf(profileFor(p.id)) === ds.v) return;
  await saveProfile(p, {visibility: ds.v === "public" ? "public" : "private"}, ds.v === "public" ? "The Recruitment Profile is public. Use Copy profile link to share it." : "The Recruitment Profile is private. Others only see the name, club and age.");
};
ACTS.previewPublic = ds => { S.previewAsOutsider = true; location.hash = "profile-" + ds.slug; };
ACTS.pmPlayer = ds => { S.pmPlayer = ds.id; S.meetingId = null; render(); };
ACTS.pmTab = ds => { S.pmTab = ds.id; S.meetingId = null; render(); };
ACTS.openMeeting = ds => { S.meetingId = ds.id; render(); };
ACTS.closeMeeting = () => { S.meetingId = null; render(); };
ACTS.delPm = async ds => { await save(() => S.db.doc("pmessages/" + ds.id).delete(), "Message deleted"); };
ACTS.cancelMeeting = async (ds, el) => {
  if(!el.dataset.armed){ el.dataset.armed = "1"; el.textContent = "Click again to cancel"; return; }
  await save(() => S.db.doc("meetings/" + ds.id).update({status:"cancelled", updatedAt:Date.now()}), "Meeting cancelled");
};
ACTS.messageFamily = ds => { S.view = "messages"; S.pmPlayer = ds.id; S.pmTab = "chat"; S.meetingId = null; window.scrollTo(0,0); render(); };
ACTS.discussReview = ds => {
  S.view = "messages"; S.pmPlayer = ds.player; S.pmTab = "meetings"; S.meetingId = null; window.scrollTo(0,0); render();
  openModal(MODALS.meetingNew({player:ds.player, review:ds.review}));
};

/* forms */
async function sendPm(fd, form, meetingId){
  const text = String(fd.get("text")||"").trim(); if(!text || !S.pmPlayer) return;
  const pl = S.players.find(x => x.id === S.pmPlayer);
  if(!pl || !pl.clubId){ toast("Messages open again once " + (pl ? pl.name : "your player") + " is on a team.", true); return; }
  const ta = form.querySelector("#pm-input"); if(ta) ta.value = "";
  const ok = await save(() => S.db.collection("pmessages").doc().set({clubId:pl.clubId, playerId:S.pmPlayer, meetingId: meetingId || null, authorId:S.uid, authorName:S.me.name||"", role:S.me.role, text:text.slice(0,2000), createdAt:Date.now()}));
  const t2 = document.getElementById("pm-input"); if(t2){ if(!ok && !t2.value) t2.value = text; t2.focus(); }
}
FORMS.pm = (fd, form) => sendPm(fd, form, null);
FORMS.scoutSearch = async fd => {
  const n = k => { const v = parseFloat(fd.get(k)); return isNaN(v) ? null : v; };
  S.scout = {...(S.scout || {}), f:{q:String(fd.get("q") || "").trim(), pos:fd.get("pos") || "", grad:n("grad"), gpa:n("gpa"), div:fd.get("div") || "", league:fd.get("league") || "",
    foot:fd.get("foot") || "", loc:String(fd.get("loc") || "").trim(), uncommitted:fd.get("uncommitted") === "on", video:fd.get("video") === "on"}};
  await runScout();
};
FORMS.interest = async (fd, form) => {
  const pid = form.dataset.player; closeModal();
  const ok = await save(() => rpc("send_interest", {pid, p_message:String(fd.get("message") || "").trim()}), "Message sent. The family will reply to your school email.");
  if(ok){ markScout(pid, {contacted:true}); schedule("shortlist"); schedule("interest"); }
};
FORMS.slSave = async (fd, form) => {
  await save(() => S.db.doc("shortlist/" + form.dataset.id).update({status:fd.get("status"), note:String(fd.get("note") || "").trim(), updatedAt:Date.now()}), "Shortlist updated");
  schedule("shortlist");
};
FORMS.collegeStart = async fd => {
  const g = k => String(fd.get(k) || "").trim();
  const ok = await save(() => rpc("start_college", {my_name:g("name"), p_title:g("title"), p_school:g("school"), p_program:g("program"), p_division:g("division")}));
  if(ok){ toast("Welcome! Start by searching for players."); S.view = "scout"; await loadMe(); }
};
FORMS.collegeEdit = async fd => {
  const g = k => String(fd.get(k) || "").trim();
  const ok = await save(() => rpc("update_college", {my_name:g("name"), p_title:g("title"), p_school:g("school"), p_program:g("program"), p_division:g("division")}), "Saved");
  if(ok){ schedule("college"); loadMe(); }
};
FORMS.editMine = async (fd, form) => {
  closeModal();
  const ok = await save(() => rpc("edit_player", {pid:form.dataset.id, p_name:String(fd.get("player")).trim(), p_birth_date: fd.get("dob") || null}), "Saved");
  if(ok) schedule("players");
};
FORMS.findClub = async fd => {
  if(!S.find) return;
  S.find.q = String(fd.get("q") || "").trim(); S.find.pick = null;
  if(S.find.q.length < 2){ S.find.results = []; S.find.short = true; openModal(findTeamModal()); return; }
  S.find.short = false;
  try { S.find.results = (await rpc("find_clubs", {q:S.find.q})) || []; }
  catch(e){ toast(e.userMessage || "Search didn't work. Try again.", true); return; }
  openModal(findTeamModal()); const q = document.getElementById("fc-q"); if(q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
};
FORMS.requestTeam = async fd => {
  const f = S.find; if(!f || !f.pick) return;
  closeModal();
  const ok = await save(() => rpc("request_team", {pid:f.pid, tid:f.pick.teamId, p_note:String(fd.get("note") || "").trim()}), "Request sent to " + f.pick.clubName);
  if(ok){ S.find = null; S.view = "home"; S.childId = f.pid; refreshAll(); }
};
FORMS.approveReq = async (fd, form) => {
  let name;
  const ok = await save(async () => { name = await rpc("decide_request", {rid:form.dataset.id, approve:true, tid:fd.get("teamId") || null}); });
  if(ok){ toast((name || "Player") + " is on your roster"); refreshAll(); }
};
FORMS.pmMeeting = (fd, form) => sendPm(fd, form, S.meetingId);
FORMS.meetingNew = async (fd, form) => {
  const pid = form.dataset.player, when = fd.get("when"), where = String(fd.get("where")||"").trim();
  const id = crypto.randomUUID();
  const row = {clubId:(S.players.find(x => x.id === pid) || {}).clubId || S.me.clubId, playerId:pid, topic:String(fd.get("topic")||"Meeting"), reviewId: fd.get("reviewId") || null,
    details:String(fd.get("details")||"").trim(), preferredTimes:String(fd.get("times")||"").trim(),
    status: when ? "scheduled" : "requested", scheduledAt: when ? new Date(when).getTime() : null, location: where,
    createdBy:S.uid, createdByName:S.me.name||"", createdAt:Date.now(), updatedAt:Date.now()};
  closeModal();
  const ok = await save(() => S.db.collection("meetings").doc(id).set(row), isStaff() ? "Meeting created" : "Meeting requested. Your coach will see it in the meeting room.");
  if(ok){ await loadKey("meetings"); S.view = "messages"; S.pmPlayer = pid; S.pmTab = "meetings"; S.meetingId = id; render(); }
};
FORMS.meetingSchedule = async (fd, form) => {
  const when = fd.get("when"); closeModal();
  await save(() => S.db.doc("meetings/" + form.dataset.id).update({status:"scheduled", scheduledAt:new Date(when).getTime(), location:String(fd.get("where")||"").trim(), updatedAt:Date.now()}), "Meeting scheduled");
};
FORMS.meetingNotes = async (fd, form) => {
  closeModal();
  await save(() => S.db.doc("meetings/" + form.dataset.id).update({status:"done", notes:String(fd.get("notes")||"").trim(), updatedAt:Date.now()}), "Notes saved");
};


/* ---------- drill library organised by skill (dropdowns) ---------- */
const SKILL_GROUPS = (() => {
  const groups = [];
  for(const sk of FIELD_SKILLS){ let g = groups.find(x => x.name === sk.group && !x.gk); if(!g){ g = {name:sk.group, gk:false, skills:[]}; groups.push(g); } g.skills.push(sk); }
  groups.push({name:"Goalkeepers", gk:true, skills:GK_SKILLS});
  return groups;
})();
if(!S.openSkills) S.openSkills = new Set();
function drillMatches(d, q){
  if(!q) return true;
  const hay = (d.title + " " + d.category + " " + (d.equipment||"") + " " + (d.skills||[]).map(k => SKILL_LABEL[k] || "").join(" ")).toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}
const LEVELS = ["Beginner","Intermediate","Advanced"];
const LEVEL_NOTE = {Beginner:"Simple technique you can do on your own with a ball.", Intermediate:"Combines skills, adds speed and pressure, sometimes with a helper.", Advanced:"Game-speed decisions, harder technique and position-specific work."};
/* every drill sits in exactly one level; older club drills marked "All levels" count as Beginner */
const levelOf = d => LEVELS.includes(d.level) ? d.level : "Beginner";
function drillLibraryHtml(list, opts = {}){
  const q = (S.drillSearch || "").trim();
  const lvl = LEVELS.includes(S.drillLevel) ? S.drillLevel : "Beginner";
  const matching = list.filter(d => drillMatches(d, q));
  const count = l => matching.filter(d => levelOf(d) === l).length;
  const shown = matching.filter(d => levelOf(d) === lvl);
  const tabs = `<div class="subtabs level-tabs" role="tablist" aria-label="Drill level">${LEVELS.map(l => `<button role="tab" data-act="drillLevel" data-id="${l}" aria-selected="${l===lvl}"><span class="lvl-dot lvl-${l.toLowerCase()}" aria-hidden="true"></span>${l} <span class="small muted">${count(l)}</span></button>`).join("")}</div>
    <p class="small muted lvl-note">${esc(LEVEL_NOTE[lvl])}</p>`;
  const section = (key, label, drills, sub) => {
    const n = drills.length; if(!n) return "";
    const free = drills.filter(d => d.free && stepsLocked()).length;
    const open = q ? true : S.openSkills.has(key);
    return `<details class="skill-dd" data-skill="${esc(key)}" ${open ? "open" : ""}>
      <summary><span class="sk-name">${esc(label)}</span>${sub ? `<span class="small muted">${esc(sub)}</span>` : ""}<span class="sk-count">${n} drill${n===1?"":"s"}${free ? ` · ${free} free` : ""}</span><span class="chev" aria-hidden="true"></span></summary>
      <div class="dgrid">${drills.slice().sort((a,b) => (b.free?1:0) - (a.free?1:0) || a.title.localeCompare(b.title)).map(d => drillCard(d, {assignable:opts.assignable})).join("")}</div>
    </details>`;
  };
  const custom = shown.filter(d => d.custom);
  let html = custom.length ? `<div class="skill-group"><h3 class="sg-title">Your club's drills</h3>${section("club", "Club drills", custom, "Added by your coaches")}</div>` : "";
  for(const g of SKILL_GROUPS){
    const parts = g.skills.map(sk => section(sk.k, sk.label, shown.filter(d => !d.custom && (!!d.gk === g.gk) && (d.skills||[]).includes(sk.k)))).join("");
    if(parts) html += `<div class="skill-group"><h3 class="sg-title">${g.gk ? "🧤 Goalkeepers" : esc(g.name)}${g.gk ? "" : ` <span class="small muted">· field players</span>`}</h3>${parts}</div>`;
  }
  const total = shown.length;
  return `${tabs}<div class="lib-tools row between">
      <label class="f small search-f" for="drill-search">Find a drill<input type="search" id="drill-search" data-input="drillSearch" value="${esc(S.drillSearch || "")}" placeholder="Search by name, skill or equipment, e.g. wall, shooting, cones"></label>
      <div class="row" style="gap:6px"><button type="button" class="btn sm" data-act="skillsAll" data-open="1">Open all</button><button type="button" class="btn sm" data-act="skillsAll" data-open="0">Close all</button></div>
    </div>
    <p class="small muted lib-note">${q ? `${total} ${lvl.toLowerCase()} drill${total===1?"":"s"} match “${esc(q)}”.${matching.length > total ? ` ${matching.length - total} more in the other levels.` : ""}` : `Pick a skill to see the ${lvl.toLowerCase()} drills that train it. Some drills train more than one skill, so they appear under each.`}</p>
    ${html || (q ? `<p class="muted">No ${lvl.toLowerCase()} drills match “${esc(q)}”.${matching.length ? " Try the other levels." : " Try another word."}</p>` : `<p class="muted">No ${lvl.toLowerCase()} drills yet.</p>`)}`;
}
ACTS.drillLevel = ds => { S.drillLevel = ds.id; render(); };
ACTS.skillsAll = ds => {
  const keys = ["club"].concat(FIELD_SKILLS.map(s => s.k), GK_SKILLS.map(s => s.k));
  S.openSkills = ds.open === "1" ? new Set(keys) : new Set();
  render();
};
document.addEventListener("toggle", ev => {
  const d = ev.target; if(!d.classList || !d.classList.contains("skill-dd") || (S.drillSearch||"").trim()) return;
  if(d.open) S.openSkills.add(d.dataset.skill); else S.openSkills.delete(d.dataset.skill);
}, true);
document.addEventListener("input", ev => {
  if(!ev.target.dataset || ev.target.dataset.input !== "drillSearch") return;
  S.drillSearch = ev.target.value;
  const pos = ev.target.selectionStart;
  render();
  const el = document.getElementById("drill-search"); if(el){ el.focus(); try{ el.setSelectionRange(pos, pos); }catch(_){} }
});

/* ---------- sign-in screens ---------- */
function setupView(){
  return `<div class="card stack" style="max-width:640px">
    <h1>Almost there</h1>
    <p>This copy of ${APP_NAME} isn't connected to its database yet. Open <b>config.js</b> and paste in your Supabase project URL and publishable key.</p>
  </div>`;
}
function authView(){
  if(!S.portal){
    return `<section class="stack" style="gap:24px">
      <div class="stack" style="gap:8px;max-width:640px">
        <h1>Player development your whole club can see</h1>
        <p class="muted">Coaches review each player's strengths and what to work on. Families see that feedback at home, practice with assigned drills, and keep up with the team in one place.</p>
      </div>
      ${portalCards("pickPortal")}
      ${exampleProfile()}
    </section>`;
  }
  const coach = S.portal === "coach", college = S.portal === "college";
  const mode = S.authMode || "signin";
  const title = mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Sign in";
  const side = college
    ? `<span class="pill plain" style="align-self:flex-start">College coach</span>
       <h1>${mode==="signup"?"Find your next recruits":"Welcome back, coach"}</h1>
       <p style="max-width:52ch">Search Recruitment Profiles of players aged ${RECRUIT_AGE} and over by position, class, GPA, league and division interest. Keep a private shortlist and message families directly.</p>
       <div class="card stack"><h3>Free for college coaches</h3><p class="small">Search, shortlist and messaging are free once you create an account. Use your school email address ending in <b>.edu</b>; families see it when you message them.</p></div>`
    : coach
    ? `<span class="pill warn" style="align-self:flex-start">Coach</span>
       <h1>${mode==="signup"?"Bring your club onto "+APP_NAME:"Welcome back, coach"}</h1>
       <p style="max-width:52ch">Track every player's development, assign home drills, write references for scouts and keep your teams in the loop.</p>
       <div class="card stack"><h3>New club?</h3><p class="small">Create an account, then start your club. You'll get a club code to share with your other coaches.</p></div>`
    : `<span class="pill good" style="align-self:flex-start">Parent / Player</span>
       <h1>${mode==="signup"?"Follow your player's progress":"Welcome back"}</h1>
       <p style="max-width:52ch">See your coach's reviews, practice the drills they pick for you, build a highlight profile and chat with your team.</p>
       <div class="card stack"><h3>First time here?</h3><p class="small">Create an account with your email and set up your player's profile. Then find your club and ask to join your team.</p></div>`;
  return `<button class="btn ghost back" data-act="pickPortal" data-id="">← ${college ? "Not a college coach? Go back" : coach?"Not a coach? Switch to Parent / Player":"Not a parent or player? Switch to Coach"}</button>
  <section class="hero">
    <div class="stack">${side}</div>
    <form class="card stack auth-${coach||college?"coach":"family"}" data-form="auth" style="align-self:start">
      <h2>${title}</h2>
      <label class="f" for="au-email">Email<input type="email" id="au-email" name="email" required autocomplete="email"></label>
      ${mode !== "reset" ? `<label class="f" for="au-pass">Password<input type="password" id="au-pass" name="password" required minlength="8" autocomplete="${mode==="signup"?"new-password":"current-password"}"></label>` : ""}
      ${mode === "signup" ? `<p class="small muted">At least 8 characters.</p>` : ""}
      <p class="small" id="auth-msg" role="status" style="color:var(--accent);font-weight:600"></p>
      <div><button class="btn primary" type="submit">${mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button></div>
      <div class="row small">
        ${mode !== "signin" ? `<button type="button" class="btn ghost sm" data-act="authMode" data-id="signin">I have an account</button>` : `<button type="button" class="btn ghost sm" data-act="authMode" data-id="signup">New here? Create an account</button>`}
        ${mode === "signin" ? `<button type="button" class="btn ghost sm" data-act="authMode" data-id="reset">Forgot password?</button>` : ""}
      </div>
    </form>
  </section>`;
}


/* illustrated headshot for the fictional example player (original artwork) */
const GRAY_AVATAR = `<svg viewBox="0 0 200 200" class="avatar-art-svg" role="img" aria-label="Cartoon headshot of the example player, Gray Patchett">
  <defs>
    <linearGradient id="gp-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6fd6"/><stop offset="1" stop-color="#16408f"/></linearGradient>
    <linearGradient id="gp-kit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ec6a37"/><stop offset="1" stop-color="#c94a1f"/></linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#gp-bg)"/>
  <rect x="0" width="33" height="200" fill="#ffffff" opacity=".06"/><rect x="67" width="33" height="200" fill="#ffffff" opacity=".06"/><rect x="134" width="33" height="200" fill="#ffffff" opacity=".06"/>
  <circle cx="100" cy="236" r="78" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="3"/>
  <path d="M26 200 C30 160 60 144 100 144 C140 144 170 160 174 200 Z" fill="url(#gp-kit)"/>
  <path d="M38 190 C44 170 56 160 72 154" stroke="#ffffff" stroke-width="4" fill="none" opacity=".85" stroke-linecap="round"/>
  <path d="M162 190 C156 170 144 160 128 154" stroke="#ffffff" stroke-width="4" fill="none" opacity=".85" stroke-linecap="round"/>
  <path d="M86 128 h28 v20 c-7 7 -21 7 -28 0z" fill="#c4875b"/>
  <path d="M80 147 L100 170 L120 147" fill="none" stroke="#14213a" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="141" y="191" font-family="Barlow Condensed, Arial Narrow, Arial, sans-serif" font-weight="700" font-size="24" fill="#ffffff">8</text>
  <ellipse cx="61" cy="96" rx="8" ry="11" fill="#d29a6b"/><ellipse cx="139" cy="96" rx="8" ry="11" fill="#d29a6b"/>
  <ellipse cx="100" cy="92" rx="39" ry="45" fill="#dca678"/>
  <path d="M60 88 C56 52 80 38 103 40 C128 41 146 56 140 88 C137 74 128 64 114 64 C101 56 84 58 73 68 C66 73 62 80 60 88Z" fill="#3b2a1f"/>
  <path d="M74 60 C86 50 104 48 118 54" stroke="#56402f" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M76 80 q9 -6 18 -1" stroke="#3b2a1f" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M106 79 q9 -5 18 1" stroke="#3b2a1f" stroke-width="4" fill="none" stroke-linecap="round"/>
  <g class="gp-eyes"><ellipse cx="86" cy="93" rx="5" ry="6.2" fill="#1f1a17"/><ellipse cx="114" cy="93" rx="5" ry="6.2" fill="#1f1a17"/>
    <circle cx="87.8" cy="90.8" r="1.7" fill="#ffffff"/><circle cx="115.8" cy="90.8" r="1.7" fill="#ffffff"/></g>
  <path d="M100 98 q-4 10 0 13 q3 1 5 -1" stroke="#b47a50" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="75" cy="110" r="6.5" fill="#e07a5f" opacity=".28"/><circle cx="125" cy="110" r="6.5" fill="#e07a5f" opacity=".28"/>
  <path d="M85 117 q15 13 30 0" stroke="#7a3b2a" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;
/* ---------- example profile on the front page (fictional player) ---------- */
const EXAMPLE = {
  name:"Gray Patchett", club:"Example FC", team:"U14 Boys Premier", positions:["CM","CAM"], foot:"Right",
  strengths:["Passing range","Scanning","Work rate","Composure"],
  bio:"Central midfielder who likes to get on the ball, switch play and set the tempo.",
  reviews:[
    {date:"2026-08-22", coachName:"Coach Rivera", summary:"Composed passer with a great attitude. Needs to win more duels and track back.",
     ratings:{first_touch:3,passing:4,shooting:2,dribbling:3,physicality:2,handling_speed:3,separation_speed:2,positional_awareness:3,decision_making:3,defending:2,tactical_understanding:3,communication:3,coachability:5},
     strengths:["Passing range","Work rate"], improve:["1v1 defending","Strength in duels"], note:""},
    {date:"2026-10-03", coachName:"Coach Rivera", summary:"Checking his shoulder before receiving has made his first touch much cleaner. Defending is improving.",
     ratings:{first_touch:4,passing:4,shooting:2,dribbling:3,physicality:3,handling_speed:3,separation_speed:3,positional_awareness:4,decision_making:3,defending:3,tactical_understanding:3,communication:3,coachability:5},
     strengths:["Scanning","Passing range"], improve:["Finishing","Weak foot"], note:""},
    {date:"2026-11-07", coachName:"Coach Rivera", summary:"Now dictating the tempo in midfield. Next step: arrive in the box and shoot with confidence.",
     ratings:{first_touch:4,passing:5,shooting:3,dribbling:3,physicality:3,handling_speed:3,separation_speed:3,positional_awareness:4,decision_making:4,defending:3,tactical_understanding:4,communication:4,coachability:5},
     strengths:["Passing range","Scanning","Communication"], improve:["Finishing","Weak foot","Staying goal-side"],
     note:"Gray, your range of passing has been the best in the group this month, and you're talking much more to organise the midfield. To take the next step:\n1. When the shooting window opens, take it instead of looking for one more pass.\n2. Keep working your left foot so defenders can't force you back inside.\n3. When we lose the ball, get goal-side first, then press.\nGreat attitude every session. Keep it up."}
  ],
  drills:[{title:"Target finishing", meta:"Shooting · 15 min", per:3, done:2, note:"Inside of the foot first, then laces. Pick your corner before you strike."},
          {title:"Weak-foot only", meta:"Ball mastery · 15 min", per:2, done:1, note:"Left foot only. Finish with 10 shots."}],
  reference:{text:"Gray is one of the most coachable players I've worked with. He reads the game early, keeps the ball moving and has become a real voice in our midfield. He takes feedback on board and turns it into progress week after week.", author:"Coach Rivera", title:"Head Coach, U14 Boys Premier"},
  history:[{club:"Example FC", team:"U14 Boys Premier", from:"2023", to:"Present", notes:"League runners-up, fall 2026"},
           {club:"Northside Rec", team:"U10 Coed", from:"2020", to:"2023", notes:"Started playing"}],
  recruit:{gradYear:"2031", height:"5'4\"", school:"Example Middle School", gpa:"3.8",
    highlights:[{title:"League runners-up", year:"2026", details:"Started every game in midfield."},{title:"Team captain", year:"2026", details:""}],
    stats:[{season:"Fall 2026", team:"U14 Boys Premier", games:14, goals:4, assists:9}]}
};
function exampleProfile(){
  const E = EXAMPLE, rs = E.reviews, last = rs[rs.length-1], prev = rs[rs.length-2];
  const o = overall(last), po = overall(prev);
  return `<section class="example stack" aria-labelledby="ex-h">
    <div class="row between">
      <div class="stack" style="gap:4px"><h2 id="ex-h">See what a player profile looks like</h2>
        <p class="muted small">Here's what a family sees after a few months of coach reviews.</p></div>
      <span class="pill warn">Example player, not a real person</span>
    </div>
    <div class="card pcard">
      <div class="photo avatar-art">${GRAY_AVATAR}</div>
      <div class="stack">
        <div class="stack" style="gap:2px"><h2 style="font-size:1.9rem">${esc(E.name)}</h2><p class="muted">${esc(E.club)} · ${esc(E.team)} · ${esc(E.foot)} footed</p></div>
        <div class="chips">${E.positions.map((k,i)=>posChip(k,i===0)).join("")}</div>
        <div class="chips">${E.strengths.map(t=>`<span class="chip">${esc(t)}</span>`).join("")}</div>
        <p style="max-width:65ch">${esc(E.bio)}</p>
      </div>
    </div>
    <div class="grid2">
      <div class="stack" style="gap:20px">
        <div class="card stack">
          <div class="row between"><h3>Coach's latest review</h3><span class="small muted">${fmtDate(last.date)} · ${esc(last.coachName)}</span></div>
          <div class="overall"><span class="big num">${fix1(o)}</span><span class="muted">/ 5 overall</span>${deltaHtml(o-po)}</div>
          <p class="tl-sum">“${esc(last.summary)}”</p>
          <div class="chips">${changesBetween(prev, last).map(changeChip).join("")}</div>
          <div class="stack" style="gap:6px"><b class="small">Strengths</b><div class="chips">${last.strengths.map(t=>`<span class="chip str">${esc(t)}</span>`).join("")}</div></div>
          <div class="stack" style="gap:6px"><b class="small">Work on</b><div class="chips">${last.improve.map(t=>`<span class="chip imp">${esc(t)}</span>`).join("")}</div></div>
          <div class="note" style="white-space:pre-wrap">${esc(last.note)}</div>
        </div>
        <div class="card stack">
          <h3>Home drills this week</h3>
          ${E.drills.map(d=>`<div class="drill"><div class="row between"><b>${esc(d.title)}</b><span class="small muted">${esc(d.meta)}</span></div>
            <div class="row small"><span class="num"><b>${d.done} of ${d.per}</b> this week</span><div class="progress" aria-hidden="true"><i style="width:${Math.round(d.done/d.per*100)}%"></i></div></div>
            <p class="small"><b>Coach:</b> ${esc(d.note)}</p></div>`).join("")}
        </div>
        <div class="card stack">
          <div class="row between"><h3>College recruiting</h3><span class="pill plain">From age ${RECRUIT_AGE}</span></div>
          <p class="small muted">At ${RECRUIT_AGE}, players can add a Recruitment Profile for college coaches: academics, highlights, stats, video and references like this one from their club coach.</p>
          <div class="ref reference"><blockquote>${esc(E.reference.text)}</blockquote><span class="small"><b>${esc(E.reference.author)}</b>, ${esc(E.reference.title)}</span></div>
          <div><a class="btn sm" href="#recruiting">How college recruiting works</a></div>
        </div>
      </div>
      <div class="stack" style="gap:20px">
        <div class="card stack"><h3>Skill ratings</h3>${ratingsHtml(last, prev)}</div>
        <div class="card stack"><h3>Progress & review timeline</h3>${progressSummary(rs)}${timelineHtml(rs)}</div>
      </div>
    </div>
    <div class="row" style="justify-content:center;gap:12px">
      <button type="button" class="btn primary" data-act="pickPortal" data-id="coach">Start as a coach</button>
      <button type="button" class="btn" data-act="pickPortal" data-id="family">I'm a parent or player</button>
    </div>
  </section>`;
}
function savePortal(p){ S.portal = p || null; try { if(p) localStorage.setItem("np.portal", p); else localStorage.removeItem("np.portal"); } catch(_){} }
ACTS.markInterest = async ds => { const ok = await save(() => rpc("mark_interest", {iid:ds.id, p_status:ds.status}), ds.status === "archived" ? "Archived" : null); if(ok) schedule("interest"); };
ACTS.pickPortal = ds => {
  savePortal(ds.id); S.publicPage = null; S.menuOpen = false;
  S.authMode = "signin";
  try { history.replaceState(null, "", location.pathname + location.search + (ds.id ? "#" + (ds.id === "coach" ? "coach" : ds.id === "college" ? "college" : "parent") : "")); } catch(_){}
  render(); const e = document.getElementById("au-email"); if(e) e.focus();
};
ACTS.setPortal = ds => { savePortal(ds.id); render(); };
function newPasswordView(){
  return `<form class="card stack" data-form="newPassword" style="max-width:480px">
    <h2>Choose a new password</h2>
    <label class="f" for="np-pass">New password<input type="password" id="np-pass" name="password" required minlength="8" autocomplete="new-password"></label>
    <p class="small" id="auth-msg" role="status" style="color:var(--accent);font-weight:600"></p>
    <div><button class="btn primary" type="submit">Save password</button></div>
  </form>`;
}
ACTS.authMode = ds => { S.authMode = ds.id; render(); const e = document.getElementById("au-email"); if(e) e.focus(); };

/* ---------- start ---------- */
async function onSession(session, event){
  if(event === "PASSWORD_RECOVERY") S.recovery = true;
  const uid = session && session.user ? session.user.id : null;
  S.email = session && session.user ? (session.user.email || "") : "";
  if(S.authChecked && uid === S.uid){ render(); return; }
  S.uid = uid; S.authChecked = true;
  if(!uid){
    subscribeClub(null); S.drillSteps = {}; S.stepsLoaded = false;
    S.me = undefined; S.loading = false; S.view = null; S.menuOpen = false; S.find = null; S.childId = null; S.authMode = "signin"; S.ptab = "dev"; S.playerId = null; S.chatTeam = null; S.pub = S.publicSlug ? S.pub : null;
    render();
    if(S.publicSlug && !S.pub) loadPublic(S.publicSlug);
    return;
  }
  S.loading = true; render();
  await loadMe();
  if(S.me && S.me.role){
    const actual = S.me.role === "family" ? "family" : S.me.role === "college" ? "college" : "coach";
    if(S.portal && S.portal !== actual && event === "SIGNED_IN") toast(actual === "family" ? "This is a parent / player account, so we opened the family view." : actual === "college" ? "This is a college coach account, so we opened college recruiting." : "This is a coach account, so we opened the coach view.");
    savePortal(actual);
  }
  if(S.publicSlug && !S.pub) loadPublic(S.publicSlug);
}

(async () => {
  const cfg = window.NEXTPLAY_CONFIG || {};
  const m = /^profile-([a-z0-9]+)$/.exec(location.hash.slice(1));
  if(m) S.publicSlug = m[1];
  try { S.portal = localStorage.getItem("np.portal") || null; } catch(_){}
  if(PAGE_IDS.includes(location.hash.slice(1))) S.publicPage = location.hash.slice(1);
  if(location.hash === "#coach") savePortal("coach");
  if(location.hash === "#parent") savePortal("family");
  if(location.hash === "#college") savePortal("college");
  if(!cfg.supabaseUrl || !cfg.supabaseKey || /YOUR_/.test(cfg.supabaseUrl + cfg.supabaseKey)){
    S.loading = false; S.noConfig = true; render(); return;
  }
  sb = createClient(cfg.supabaseUrl, cfg.supabaseKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
  S.db = DB; S.assets = ASSETS;
  render();
  loadTimer = setTimeout(() => { if(S.loading){ S.notice = "Still connecting. Check your internet connection."; render(); } }, 10000);
  sb.auth.onAuthStateChange((event, session) => { setTimeout(() => onSession(session, event), 0); });
  const {data} = await sb.auth.getSession();
  await onSession(data.session, "INITIAL");
})();
