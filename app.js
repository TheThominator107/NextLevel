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
const changeChip = c => `<span class="chip ${c.to>c.from?"str":"imp"}">${esc(c.label)} ${c.from} → ${c.to} ${c.to>c.from?"▲":"▼"}</span>`;
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
      ${admin ? `<div><button class="btn ghost sm" data-act="delReview" data-id="${esc(r.id)}" aria-label="Delete review from ${esc(fmtDate(r.date))}">Delete (admin)</button></div>` : ""}
    </div>`; }).join("")}</div>`;
}
const TAGS = ["First touch","Weak foot","Passing range","Scanning","1v1 attacking","1v1 defending","Finishing","Crossing","Heading","Shielding","Positioning","Decision making","Speed","Work rate","Communication","Confidence on the ball","Leadership","Composure"];
const POSITIONS = ["Goalkeeper","Defender","Midfielder","Forward","Not set"];
const CATS = ["Ball mastery","Passing","Dribbling","Shooting","Defending","Awareness","Speed & agility","Strength","Game understanding","Mindset","Goalkeeping"];

/* skills: review attributes a drill trains (used for recommendations); tags: matching "Work on" tags; gk: goalkeeper drill */
const BUILTIN_DRILLS = [
  /* ---- first touch & ball mastery ---- */
  {id:"b-toe-taps",title:"Toe taps",category:"Ball mastery",minutes:5,equipment:"Ball",level:"All levels",skills:["first_touch","handling_speed"],tags:["Confidence on the ball"],steps:["Ball still in front of you, tap the top with the sole of each foot in turn.","Stay on the balls of your feet and keep your head up.","3 rounds of 30 seconds, 30 seconds rest.","Make it harder: move the ball in a circle while tapping."]},
  {id:"b-sole-roll",title:"Sole rolls and pull-backs",category:"Ball mastery",minutes:8,equipment:"Ball",level:"Beginner",skills:["first_touch","dribbling"],tags:["Confidence on the ball"],steps:["Roll the ball across your body with the sole, side to side.","Add a pull-back: drag it back with the sole and push forward with the laces.","Alternate feet every 5 reps.","3 rounds of 45 seconds."]},
  {id:"b-juggle",title:"Juggling ladder",category:"Ball mastery",minutes:10,equipment:"Ball",level:"All levels",skills:["first_touch"],tags:["First touch","Composure"],steps:["Count your best juggle with any surface.","Then try feet only, then alternating feet.","Write down your record each time.","Goal: add 5 to your record each week."]},
  {id:"b-first-touch",title:"Open-body first touch",category:"Passing",minutes:10,equipment:"Ball, wall, 2 cones",level:"Intermediate",skills:["first_touch","positional_awareness","decision_making"],tags:["First touch","Composure"],steps:["Put a cone 2 yards to your left and one 2 yards to your right.","Pass at the wall; as it comes back, take your first touch past one cone with your back foot.","Alternate sides each rep.","20 reps each side. Open your hips before the ball arrives."]},
  {id:"b-volley",title:"Volleys and half-volleys",category:"Shooting",minutes:10,equipment:"Ball, wall or goal",level:"Intermediate",skills:["first_touch","shooting"],tags:["Finishing","Composure"],steps:["Toss the ball up to yourself (or have a helper toss it).","Cushion it down with your thigh or foot, then strike it at the wall or goal.","Next, strike it on the half-volley as it bounces: knee over the ball, toes down.","3 sets of 10. Count clean strikes."]},

  /* ---- passing ---- */
  {id:"b-wall-pass",title:"Two-touch wall passes",category:"Passing",minutes:10,equipment:"Ball, wall",level:"All levels",skills:["passing","first_touch"],tags:["Passing range"],steps:["Stand 3 to 5 yards from a wall.","Pass with the inside of your right foot, take one touch to control, pass again.","Do 25 passes, then switch to your left foot for 25.","Make it harder: step back to 8 yards and use one touch only."]},
  {id:"b-long-pass",title:"Long-pass targets",category:"Passing",minutes:15,equipment:"Ball(s), 4 cones",level:"Intermediate",skills:["passing","tactical_understanding"],tags:["Passing range","Crossing"],steps:["Make a 3x3 yard box with cones 20 to 30 yards away.","Strike the ball into the box: lean slightly back, lock your ankle, strike through the middle-bottom.","10 with each foot. Count how many land in the box.","Make it harder: move the box further away or to the side."]},
  {id:"b-weak-foot",title:"Weak-foot only",category:"Ball mastery",minutes:15,equipment:"Ball",level:"All levels",skills:["passing","shooting","dribbling"],tags:["Weak foot"],steps:["For one session, touch the ball with your weaker foot only.","Do 2 minutes each of: taps, rolls, wall passes, short dribbles.","Finish with 10 shots with the weak foot.","Note which part felt hardest for your coach."]},

  /* ---- shooting ---- */
  {id:"b-targets",title:"Target finishing",category:"Shooting",minutes:15,equipment:"Ball(s), goal or wall, tape",level:"All levels",skills:["shooting"],tags:["Finishing"],steps:["Mark the 4 corners of a goal or wall with tape or objects.","From 12 yards, aim for a corner with the inside of the foot.","Then laces, keeping your knee over the ball.","Score 1 point per corner hit. Best of 20."]},
  {id:"b-dribble-shoot",title:"Dribble, set and shoot",category:"Shooting",minutes:12,equipment:"Ball, 3 cones, goal or wall",level:"Intermediate",skills:["shooting","dribbling","decision_making"],tags:["Finishing","1v1 attacking"],steps:["Dribble through 3 cones, then take one touch to set the ball out of your feet.","Shoot within 2 touches of the last cone.","Pick your corner before you strike, and follow your shot in.","10 reps; alternate the foot you shoot with."]},

  /* ---- dribbling & speed with the ball ---- */
  {id:"b-cone-weave",title:"Cone weave dribble",category:"Dribbling",minutes:10,equipment:"Ball, 6 cones (or shoes)",level:"All levels",skills:["dribbling","handling_speed"],tags:["Confidence on the ball"],steps:["Set 6 cones in a line, 1 to 2 yards apart.","Weave through using only your right foot, then only your left.","Then use inside and outside of the same foot.","Time 3 runs each way and try to beat your best."]},
  {id:"b-speed-dribble",title:"Speed dribble races",category:"Dribbling",minutes:10,equipment:"Ball, 2 cones, timer",level:"All levels",skills:["handling_speed","dribbling","separation_speed"],tags:["Speed"],steps:["Set two cones 20 yards apart.","Dribble as fast as you can, touching the ball every 2 to 3 steps with your laces.","Stop the ball dead on the far line, turn, race back.","6 runs with full rest. Time them and try to beat your best."]},
  {id:"b-change-pace",title:"Change of pace and direction",category:"Dribbling",minutes:10,equipment:"Ball, 4 cones",level:"Intermediate",skills:["separation_speed","dribbling","handling_speed"],tags:["1v1 attacking","Speed"],steps:["Dribble slowly toward a cone as if it's a defender.","At 1 yard away, do a move (scissor, drop of the shoulder or cut) and explode away for 5 yards.","The burst is the point: go from slow to full speed in 2 touches.","10 reps each direction."]},
  {id:"b-shield",title:"Shield the ball",category:"Dribbling",minutes:10,equipment:"Ball, a helper",level:"Intermediate",skills:["physicality","dribbling"],tags:["Shielding"],steps:["Keep the ball on your far foot with your body between it and the helper.","Arm out for balance, knees bent, keep turning your back to them.","Rounds of 30 seconds: can you keep it?","Switch roles after each round."]},
  {id:"b-1v1-line",title:"1v1 to the line",category:"Dribbling",minutes:12,equipment:"Ball, 4 cones, a helper",level:"All levels",skills:["dribbling","defending","separation_speed"],tags:["1v1 attacking","1v1 defending"],steps:["Make a channel 8 yards wide and 15 yards long.","Attacker tries to stop the ball on the far line; defender tries to win it.","Attacker: change speed, don't just change direction. Defender: side-on, stay patient.","Best of 10, then swap roles."]},

  /* ---- speed & strength ---- */
  {id:"b-5-10-5",title:"5-10-5 shuttle",category:"Speed & agility",minutes:10,equipment:"3 cones",level:"All levels",skills:["separation_speed","physicality"],tags:["Speed"],steps:["Set 3 cones in a line, 5 yards apart.","Start at the middle, sprint 5 yards right and touch the line.","Sprint 10 yards left, then 5 back to the middle.","6 reps with full rest. Low hips on each turn."]},
  {id:"b-first-step",title:"First-step burst",category:"Speed & agility",minutes:8,equipment:"2 cones, a helper (optional)",level:"All levels",skills:["separation_speed"],tags:["Speed","1v1 attacking"],steps:["Start side-on or facing away from a cone 5 yards ahead.","On a clap or call, turn and sprint to the cone. Short, quick first steps; drive your arms.","Rest 30 seconds between reps.","8 reps. The first 2 steps matter most."]},
  {id:"b-strength",title:"Young player strength circuit",category:"Strength",minutes:15,equipment:"None (bodyweight only)",level:"All levels",skills:["physicality"],tags:["Shielding","Heading"],steps:["30 seconds each, 30 seconds rest: squats, forward lunges, glute bridges, plank, side plank (each side).","Then 30 seconds balancing on one leg, eyes closed if you can (each leg).","Go through the circuit twice.","Good form beats speed. Stop if anything hurts."]},
  {id:"b-recovery",title:"Recovery runs",category:"Defending",minutes:10,equipment:"3 cones",level:"All levels",skills:["defending","physicality"],tags:["Work rate"],steps:["Stand at a cone 'in attack'. A helper calls 'Lost it!'.","Sprint back past a cone 15 yards behind you, then turn and face forward in a defending stance.","Get goal-side first, then slow down and get side-on.","8 reps with a walk-back rest."]},

  /* ---- defending ---- */
  {id:"b-jockey",title:"Jockey footwork",category:"Defending",minutes:8,equipment:"2 cones",level:"All levels",skills:["defending"],tags:["1v1 defending"],steps:["Side-on stance, knees bent, weight on the balls of your feet.","Shuffle backward and sideways between two cones 5 yards apart without crossing your feet.","20 seconds on, 20 seconds off, 6 rounds.","Add a helper dribbling at you at walking pace."]},

  /* ---- awareness, decisions, tactics, mindset ---- */
  {id:"b-scan",title:"Shoulder checks",category:"Awareness",minutes:8,equipment:"Ball, wall, a helper",level:"Intermediate",skills:["positional_awareness","decision_making","communication"],tags:["Scanning"],steps:["A helper stands behind you and holds up fingers.","Check over your shoulder before each pass arrives and call the number.","Then receive and pass back to the wall.","Aim for 2 checks before every touch."]},
  {id:"b-color-gates",title:"Colour gate decisions",category:"Awareness",minutes:10,equipment:"Ball, 6 cones in 3 colours, a helper",level:"All levels",skills:["decision_making","positional_awareness","handling_speed"],tags:["Decision making","Scanning"],steps:["Make 3 small gates out of coloured cones around you.","Dribble in the middle. When the helper calls a colour, dribble through that gate as fast as you can.","Keep your head up so you already know where each gate is.","Make it harder: the helper holds up a colour instead of calling it."]},
  {id:"b-pro-watch",title:"Watch a pro in your position",category:"Game understanding",minutes:15,equipment:"A match on TV or online",level:"All levels",skills:["tactical_understanding","positional_awareness","coachability"],tags:["Positioning","Decision making"],steps:["Pick one player who plays your position and watch only them for 10 minutes.","Note where they stand when their team has the ball, and where they go when it's lost.","Count how often they check their shoulder before receiving.","Write down 3 things you'll copy and share them with your coach."]},
  {id:"b-draw-shape",title:"Draw the team shape",category:"Game understanding",minutes:10,equipment:"Paper and pen",level:"All levels",skills:["tactical_understanding","positional_awareness"],tags:["Positioning"],steps:["Draw a field and your team's formation.","Mark where you stand when we have the ball, and where you go when we lose it.","Draw one arrow for your best run and one for your best pass.","Bring it to practice and ask your coach if you got it right."]},
  {id:"b-talk",title:"Talk the game",category:"Mindset",minutes:8,equipment:"Ball, a helper",level:"All levels",skills:["communication","decision_making"],tags:["Communication","Leadership"],steps:["Pass back and forth with a helper.","Before each pass, they call 'Man on!', 'Time!' or 'Turn!'.","You react: one-touch pass back, take a touch and look up, or turn away.","Swap roles so you practise giving loud, short, clear calls too."]},
  {id:"b-reflect",title:"Session reflection",category:"Mindset",minutes:5,equipment:"Notebook or phone",level:"All levels",skills:["coachability","communication"],tags:["Work rate","Leadership"],steps:["After each practice or game, write 3 short lines.","1: One thing my coach asked me to do. 2: One thing that went well. 3: One thing I'll try next time.","Read last week's notes before your next session.","Show your coach once a month."]},

  /* ---- goalkeepers ---- */
  {id:"g-set-catch",title:"Set position and catch",category:"Goalkeeping",minutes:10,equipment:"Ball, a helper",level:"All levels",gk:true,skills:["gk_ball_handling","gk_shot_stopping","gk_positioning"],tags:[],steps:["Set position: feet shoulder-width, knees soft, weight forward, hands in front.","A helper throws or kicks at chest, waist and head height.","Catch with a 'W' (thumbs behind the ball) above the waist and scoop below it.","3 sets of 10. Get set before every shot."]},
  {id:"g-w-catch",title:"W-catch, basket and scoop",category:"Goalkeeping",minutes:8,equipment:"Ball, wall",level:"Beginner",gk:true,skills:["gk_ball_handling"],tags:[],steps:["Throw the ball at a wall and catch the rebound with a W-catch at head height.","Then a basket catch at your chest, then a scoop from the ground.","10 of each, then mix them up.","Make it harder: stand closer to the wall."]},
  {id:"g-collapse",title:"Collapse dive progression",category:"Goalkeeping",minutes:12,equipment:"Ball, soft grass or a mat, a helper",level:"All levels",gk:true,skills:["gk_diving","gk_shot_stopping"],tags:[],steps:["On grass or a mat only. Start kneeling: the helper rolls the ball to your side; fall on your side and catch it, hands first.","Next from a crouch, then from standing.","Land on your side (hip and shoulder), never on your elbow or stomach.","5 each side at each stage. Stop if it hurts."]},
  {id:"g-reaction",title:"Reaction saves",category:"Goalkeeping",minutes:8,equipment:"Tennis ball or ball, wall",level:"Intermediate",gk:true,skills:["gk_shot_stopping","gk_diving"],tags:[],steps:["Stand 3 yards from a wall in your set position.","A helper throws a tennis ball at the wall from behind you; react and catch the rebound.","Stay low and balanced; move your feet before your hands.","3 rounds of 10."]},
  {id:"g-angles",title:"Narrow the angle",category:"Goalkeeping",minutes:10,equipment:"4 cones or markers",level:"Intermediate",gk:true,skills:["gk_positioning","gk_decision_making"],tags:["Positioning"],steps:["Mark two posts and place 3 cones in an arc 12 yards out.","A helper stands on a cone. Move so you're on the line between the ball and the middle of the goal.","Take 1 to 2 steps off your line toward the ball. Check the angle by turning your head.","Helper moves to a new cone every 10 seconds."]},
  {id:"g-shuffle",title:"Shuffle and set",category:"Goalkeeping",minutes:8,equipment:"2 cones, a ball",level:"All levels",gk:true,skills:["gk_positioning","gk_shot_stopping"],tags:[],steps:["Shuffle sideways between two cones 3 yards apart without crossing your feet.","On a call of 'Set!', stop and get into your set position.","The helper throws a ball for you to catch right away.","6 rounds of 30 seconds."]},
  {id:"g-distribution",title:"Distribution targets",category:"Goalkeeping",minutes:15,equipment:"Ball(s), 2 cones or a helper",level:"All levels",gk:true,skills:["gk_distribution"],tags:["Passing range"],steps:["Roll the ball along the ground to a target 15 yards away, 10 times.","Then sidearm throws to 20 yards, then overarm throws to 25+ yards.","Finish with 10 kicks from your hands or the ground to a target.","Count how many reach the target."]},
  {id:"g-come-stay",title:"Come or stay?",category:"Goalkeeping",minutes:10,equipment:"Ball, a helper",level:"Intermediate",gk:true,skills:["gk_decision_making","gk_communication"],tags:["Decision making","Communication"],steps:["A helper throws high balls into your area from the side.","Decide early: call 'KEEPER!' and attack the ball at its highest point, or call 'AWAY!' and stay set.","Take off from one foot, knee up for protection.","10 balls each side."]},
  {id:"g-organiser",title:"Organiser calls",category:"Goalkeeping",minutes:10,equipment:"A match on TV or online",level:"All levels",gk:true,skills:["gk_communication","gk_positioning"],tags:["Communication","Leadership"],steps:["Watch 10 minutes of a match as if you're the keeper.","Say out loud what you'd tell your defenders: 'Push up!', 'Mark 9!', 'Time!', 'Away!'.","Keep calls short, loud and early.","Practise the same calls in your next session."]}
];

const S = {
  db:null, user:null, uid:null, canWrite:true, me:undefined, club:null,
  teams:[], players:[], reviews:[], assignments:[], drills:[], members:[],
  view:null, playerId:null, childId:null, teamFilter:"all", catFilter:"All",
  chartSkill:"overall", preview:false, loading:true, noDb:false, notice:null, subClubId:undefined,
  profiles:[], comments:[], ptab:"dev", assets:null, publicSlug:null, pub:null,
  messages:[], chatTeam:null
};
const APP_URL = location.origin + location.pathname;
const FIELD_POSITIONS = [["GK","Goalkeeper"],["RB","Right back"],["CB","Center back"],["LB","Left back"],["WB","Wing back"],["CDM","Defensive mid"],["CM","Central mid"],["CAM","Attacking mid"],["RM","Right mid"],["LM","Left mid"],["RW","Right wing"],["LW","Left wing"],["CF","Center forward"],["ST","Striker"]];
const VIS = {
  private:{label:"Private",cls:"plain",help:"Only coaches at your club and your family can see it."},
  club:{label:"Club",cls:"warn",help:"Anyone in your club can see it, plus your coaches and family."},
  public:{label:"Public",cls:"good",help:"Anyone with the profile link can see it, such as academy or college scouts. Coach references show; coach comments and skill ratings stay private."}
};
const profileFor = pid => S.profiles.find(x => x.playerId === pid) || null;
const blobUrl = id => sb ? sb.storage.from("media").getPublicUrl(id).data.publicUrl : "";
const canEditProfile = p => !!(S.me && !isStaff() && (S.me.playerIds||[]).includes(p.id));
async function saveProfile(p, changes, ok){
  const cur = profileFor(p.id);
  const base = cur ? Object.fromEntries(Object.entries(cur).filter(([k]) => k !== "id"))
    : {clubId:p.clubId, playerId:p.id, visibility:"private", slug:"p" + makeCode(9).toLowerCase(), positions:[], strengths:[], history:[], videos:[], createdAt:Date.now()};
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
  if(!S.club) return false;
  if(S.club.familyAccess !== "subscribe") return true;
  if(isStaff()) return false;
  return !!(S.me && S.me.familyPlan);
}
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
  members:"members", profiles:"player_profiles", comments:"comments", messages:"messages"};
const PK = {profiles:"player_id"};
const TABLE_TO_KEY = Object.fromEntries(Object.entries(TABLE).map(([k,v]) => [v,k]));
TABLE_TO_KEY.clubs = "club"; TABLE_TO_KEY.family_links = "links";

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
  const cid = S.me ? S.me.clubId : null;
  if(cid !== S.subClubId) subscribeClub(cid);
  fixView(); render();
}

const timers = {};
function schedule(key){
  if(!key) return;
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => loadKey(key), 150);
}
async function loadKey(key){
  const cid = S.subClubId; if(!cid) return;
  let q;
  if(key === "club") q = sb.from("clubs").select("*").eq("id", cid).maybeSingle();
  else if(key === "messages") q = sb.from("messages").select("*").eq("club_id", cid).order("created_at", {ascending:false}).limit(600);
  else if(key === "links") q = sb.from("family_links").select("*");
  else if(TABLE[key]) q = sb.from(TABLE[key]).select("*").eq("club_id", cid);
  else return;
  const {data, error} = await q;
  if(cid !== S.subClubId) return;
  if(error){ console.error(key, error); S.notice = "Some data couldn't load. Reload the page to try again."; render(); return; }
  if(key === "club"){ S.club = data ? camel(data) : null; S.clubLoaded = true; }
  else if(key === "messages") S.messages = data.map(camel).reverse();
  else if(key === "links") S.links = data;
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
  S.profiles = []; S.comments = []; S.messages = [];
  if(!cid) return;
  ["club","teams","players","reviews","assignments","drills","links","members","profiles","comments","messages"].forEach(k => loadKey(k));
  channel = sb.channel("club-" + cid)
    .on("postgres_changes", {event:"*", schema:"public"}, payload => {
      const key = TABLE_TO_KEY[payload.table];
      if(payload.table === "members" || payload.table === "family_links") loadMe();
      if(payload.table === "family_links") schedule("members");
      schedule(key);
    })
    .subscribe();
}
function fixView(){
  const staffViews = ["roster","player","chat","drills","plans","club"], famViews = ["home","chat","drills","plans","account"];
  if(!S.me) { S.view = null; return; }
  const ok = isStaff() ? staffViews : famViews;
  if(!ok.includes(S.view)) S.view = isStaff() ? "roster" : "home";
}

/* ---------- views ---------- */
const brandSvg = `<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect x="1.5" y="4.5" width="25" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="14" y1="4.5" x2="14" y2="23.5" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="14" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 10 l3 4 -3 4" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function topbar(){
  let tabs = "";
  if(S.me && S.club){
    const items = isStaff()
      ? [["roster","Players"],["chat","Team chat"],["drills","Drill library"],["plans","Plans"],["club","Club"]]
      : [["home","My player"],["chat","Team chat"],["drills","Home drills"],["plans","Plans"],["account","Account"]];
    const un = totalUnread();
    tabs = `<nav class="tabs" aria-label="Main">${items.map(([v,l]) => `<button data-act="go" data-view="${v}" ${!S.publicPage && (S.view===v || (v==="roster" && S.view==="player")) ? 'aria-current="page"' : ""}>${l}${v==="chat" && un ? `<span class="badge" aria-label="${un} unread">${un>99?"99+":un}</span>` : ""}</button>`).join("")}<a href="#contact" class="signout-link" ${S.publicPage==="contact"?'aria-current="page"':""}>Contact</a><button class="signout-link" data-act="signOut">Sign out</button></nav>`;
  }
  return `<header class="top"><div class="top-in">
    <a href="#" class="brand" data-act="home" aria-label="${APP_NAME} home">${brandSvg}<span>${APP_NAME}</span></a>
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
  else if(S.me && !S.club) body = S.clubLoaded ? clubMissing() : `<div class="card"><p>Loading your club…</p></div>`;
  else body = viewBody();
  const banners = (S.notice && !S.loading ? `<div class="banner">${esc(S.notice)}</div>` : "");
  const ci = document.getElementById("chat-input");
  const keep = ci ? {v:ci.value, f:document.activeElement===ci, s:ci.selectionStart, e:ci.selectionEnd, ann:(document.getElementById("chat-ann")||{}).checked} : null;
  const th = document.getElementById("thread");
  const atBottom = !th || (th.scrollHeight - th.scrollTop - th.clientHeight < 60);
  const prevScroll = th ? th.scrollTop : 0, prevTeam = S._renderedChatTeam;
  app.innerHTML = topbar() + `<main>${banners}${body}</main>` + (!S.uid || S.publicPage ? siteFooter() : "");
  const ci2 = document.getElementById("chat-input");
  if(ci2 && keep && prevTeam === S.chatTeam){ ci2.value = keep.v; const a = document.getElementById("chat-ann"); if(a) a.checked = !!keep.ann; if(keep.f){ ci2.focus(); try{ ci2.setSelectionRange(keep.s, keep.e); }catch(_){} } }
  const th2 = document.getElementById("thread");
  if(th2){ th2.scrollTop = (atBottom || prevTeam !== S.chatTeam) ? th2.scrollHeight : prevScroll; }
  S._renderedChatTeam = S.view === "chat" ? S.chatTeam : null;
  if(S.view === "chat") markRead();
}

function viewBody(){
  if(isStaff()){
    switch(S.view){
      case "player": return playerView();
      case "drills": return drillsView();
      case "plans": return plansView();
      case "club": return clubView();
      case "chat": return chatView();
      default: return rosterView();
    }
  }
  switch(S.view){
    case "drills": return drillsView();
    case "plans": return plansView();
    case "account": return accountView();
    case "chat": return chatView();
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
  const switcher = `<button type="button" class="btn ghost sm" data-act="setPortal" data-id="${portal==="coach"?"family":"coach"}">${portal==="coach"?"I'm actually a parent or player":"I'm actually a coach"}</button>`;
  if(portal === "family") return `<section class="hero">
    <div class="stack">
      <span class="pill good" style="align-self:flex-start">Parent / Player</span>
      <h1>Connect to your player</h1>
      <p style="max-width:52ch">Your coach gives every player a 6-letter code. Enter it once and you'll see their reviews, home drills, profile and team chat.</p>
      <p class="small muted">Have more than one child at the club? Add the others later under Account.</p>
    </div>
    <div class="stack">
      <form class="card stack auth-family" data-form="joinFamily">
        <h2>Enter your player code</h2>
        <label class="f" for="jf-name">Your name<input type="text" id="jf-name" name="name" required maxlength="60" autocomplete="name" placeholder="e.g. Sarah Brandt (Leo's mom)"></label>
        <label class="f" for="jf-code">Player code<input type="text" id="jf-code" name="code" required maxlength="12" placeholder="6-letter code" autocapitalize="characters"></label>
        <div><button class="btn primary" type="submit">Connect to my player</button></div>
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
  </div>`;
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
      <td><div class="pname">${esc(p.name)}</div><div class="small muted">${esc(p.position||"")}</div></td>
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
    <div class="row"><button class="btn" data-act="modal" data-m="team">Add team</button><button class="btn primary" data-act="modal" data-m="player">Add player</button></div>
  </div>
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
      : `<div class="locked"><h3>No players yet</h3><p class="muted">Add a team, then add your players. Each player gets a code you can give their family.</p><button class="btn primary" data-act="modal" data-m="player">Add player</button></div>`}
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
    <div class="row between"><h3>${esc(d.title)}</h3><span class="row" style="gap:6px">${a && byFamily(a) ? '<span class="pill good">Added from recommendations</span>' : ""}${d.gk?'<span class="pill warn">Goalkeeper</span>':""}${d.custom?'<span class="pill plain">Club drill</span>':""}</span></div>
    <div class="dmeta"><span>${esc(d.category)}</span><span>· ${esc(d.minutes)} min</span><span>· ${esc(d.equipment)}</span><span>· ${esc(d.level)}</span></div>
    ${(d.skills||[]).length ? `<div class="trains small"><span class="muted">Trains:</span> ${(d.skills).map(k => esc(SKILL_LABEL[k] || k)).join(" · ")}</div>` : ""}
    <details ${opts.open?"open":""}><summary>How to do it</summary><ol>${(d.steps||[]).map(s=>`<li>${esc(s)}</li>`).join("")}</ol></details>
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
  const historyCard = (home || !fam) ? `<div class="card stack"><h2>Progress & review timeline</h2>${progressSummary(rs)}${timelineHtml(rs, {staff:!fam})}</div>` : `<div class="locked"><h2>Review timeline</h2><p>Every past review is saved. See each update, what changed and progress since the first review with Home Training.</p><button class="btn primary" data-act="go" data-view="plans">See Home Training plan</button></div>`;

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
      <div class="stack" style="gap:2px"><h1>${esc(p.name)}</h1><p class="muted">${esc(p.position||"")} · ${esc(teamName(p.teamId))}${p.birthYear?" · Born "+esc(p.birthYear):""}</p>
      <p class="small">Family code: <span class="code">${esc(p.inviteCode)}</span> <button class="btn ghost sm" data-act="copy" data-text="${esc(p.inviteCode)}">Copy</button> <span class="pill ${st.cls}">${st.txt}</span></p></div></div>
    <div class="row">
      <button class="btn" data-act="preview">${S.preview?"Back to coach view":"See what the family sees"}</button>
      <button class="btn" data-act="modal" data-m="editPlayer" data-player="${esc(p.id)}">Edit</button>
      <button class="btn primary" data-act="modal" data-m="review" data-player="${esc(p.id)}">${reviewsFor(p.id).length ? "Update review" : "First review"}</button>
    </div>
  </div></div>
  ${subtabs()}
  ${S.preview ? `<div class="banner">Family preview: this is what ${esc(p.name)}'s family sees.${S.club.familyAccess==="subscribe" && S.ptab==="dev"?" Home drills show as locked until the family starts Home Training.":""}</div>` : ""}
  ${S.ptab === "profile" ? profileHtml(p, {staff:!S.preview}) : playerDetail(p, S.preview ? "preview" : "staff")}`;
}

function familyHome(){
  const ids = (S.me.playerIds || []);
  const kids = S.players.filter(p => ids.includes(p.id));
  if(!kids.length) return `<div class="card stack"><h2>No player connected</h2><p>Ask your coach for your player's code, then add it under Account.</p><div><button class="btn primary" data-act="modal" data-m="addChild">Add player code</button></div></div>`;
  if(!kids.find(k => k.id === S.childId)) S.childId = kids[0].id;
  const p = kids.find(k => k.id === S.childId);
  return `<div class="card"><div class="row between">
    <div class="phead"><div class="avatar">${esc(initials(p.name))}</div><div class="stack" style="gap:2px"><h1>${esc(p.name)}</h1><p class="muted">${esc(p.position||"")} · ${esc(teamName(p.teamId))} · ${esc(S.club.name)}</p></div></div>
    ${kids.length>1 ? `<div class="filters" role="group" aria-label="Choose player">${kids.map(k=>`<button data-act="child" data-id="${esc(k.id)}" aria-pressed="${k.id===p.id}">${esc(k.name)}</button>`).join("")}</div>` : ""}
  </div></div>
  ${subtabs()}
  ${S.ptab === "profile" ? profileHtml(p, {editable:canEditProfile(p)}) : playerDetail(p, "family")}`;
}

function subtabs(){
  return `<div class="subtabs" role="tablist" aria-label="Player sections">
    <button role="tab" data-act="ptab" data-id="dev" aria-selected="${S.ptab!=="profile"}">Development</button>
    <button role="tab" data-act="ptab" data-id="profile" aria-selected="${S.ptab==="profile"}">Player profile</button>
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
  const vis = VIS[pr.visibility] || VIS.private;
  const positions = pr.positions || [], strengths = pr.strengths || [];
  const history = (pr.history || []).slice().sort((a,b) => (b.to==="Present"?9999:+b.to||0) - (a.to==="Present"?9999:+a.to||0) || (+b.from||0) - (+a.from||0));
  const videos = pr.videos || [];
  const allComments = pub ? opts.pub.refs : S.comments.filter(c => c.playerId === p.id).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const posLabel = k => (FIELD_POSITIONS.find(x=>x[0]===k)||[k,k])[1];
  const clubName = pub ? (opts.pub.clubName||"") : (S.club ? S.club.name : "");
  const empty = (msg) => `<p class="muted">${msg}</p>`;

  const head = `<div class="card pcard">
    <div class="photo-wrap">${photoHtml(pr, p)}
      ${ed && !S.assets ? `<span class="small muted">Photo uploads aren't available on this account yet.</span>` : ""}
      ${ed && S.assets ? `<label class="btn sm" for="photo-in">${pr.photo?"Change photo":"Add photo"}</label><input type="file" id="photo-in" accept="image/jpeg,image/png,image/webp,image/gif" data-upload="photo" data-id="${esc(p.id)}" hidden>${pr.photo?`<button class="btn ghost sm" data-act="delPhoto" data-id="${esc(p.id)}">Remove photo</button>`:""}` : ""}
    </div>
    <div class="stack">
      <div class="row between">
        <div class="stack" style="gap:2px"><h1>${esc(p.name)}</h1><p class="muted">${esc(clubName)}${p.teamId && !pub ? " · " + esc(teamName(p.teamId)) : ""}${p.birthYear?" · Born "+esc(p.birthYear):""}${pr.foot?" · "+esc(pr.foot)+" footed":""}</p></div>
        ${pub ? "" : `<div class="vis"><span class="pill ${vis.cls}">${vis.label}</span>${ed?`<button class="btn sm" data-act="modal" data-m="visibility" data-player="${esc(p.id)}">Change</button>`:""}</div>`}
      </div>
      <div class="stack" style="gap:6px"><h3>Positions</h3><div class="chips">${positions.length?positions.map((k,i)=>`<span class="chip${i===0?" str":""}">${esc(posLabel(k))}${i===0?" · main":""}</span>`).join(""):'<span class="muted small">Not added yet</span>'}</div></div>
      <div class="stack" style="gap:6px"><h3>Strengths</h3><div class="chips">${strengths.length?strengths.map(t=>`<span class="chip">${esc(t)}</span>`).join(""):'<span class="muted small">Not added yet</span>'}</div></div>
      ${pr.bio ? `<p style="max-width:65ch">${esc(pr.bio)}</p>` : ""}
      ${ed ? `<div class="row"><button class="btn" data-act="modal" data-m="about" data-player="${esc(p.id)}">Edit positions, strengths & bio</button>${pr.visibility==="public"?`<button class="btn ghost sm" data-act="copy" data-text="${esc(APP_URL + "#profile-" + pr.slug)}">Copy profile link</button>`:""}</div>` : ""}
      ${staff && !pr.updatedAt ? `<p class="small muted">The family hasn't filled in this profile yet. They can do it from their account.</p>` : ""}
    </div>
  </div>`;

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
    ${!pub ? `<p class="small muted">References show on the profile when it's public. Comments stay between coaches and the family.</p>` : ""}
    ${comments.length ? comments.map(c=>`<div class="ref ${c.kind==="reference"?"reference":""}">
      <div class="row between"><span class="pill ${c.kind==="reference"?"good":"plain"}">${c.kind==="reference"?"Reference":"Comment"}</span><span class="small muted">${c.date?esc(fmtDate(c.date)):""}</span></div>
      <blockquote>${esc(c.text)}</blockquote>
      <div class="row between"><span class="small"><b>${esc(c.authorName||"Coach")}</b>${c.authorTitle?`, ${esc(c.authorTitle)}`:""}</span>${staff && c.authorId===S.uid?`<button class="btn ghost sm" data-act="delComment" data-id="${esc(c.id)}">Delete</button>`:""}</div>
    </div>`).join("") : empty(staff ? "No comments yet. A reference is what a scout or new coach would read." : "No coach comments yet.")}
  </div>`;

  let privCard = "";
  if(!pub){
    const rs = reviewsFor(p.id), last = rs[rs.length-1], prev = rs[rs.length-2];
    const o = overall(last), po = overall(prev);
    privCard = `<div class="card stack private-card">
      <div class="row between"><h2>Coach review</h2><span class="pill plain" title="Never shown on a public profile">🔒 Private</span></div>
      <p class="small muted">Only ${esc(p.name)}, their family and the club's coaches can see this. It never appears on the public profile.</p>
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
  return `${head}<div class="grid2"><div class="stack" style="gap:20px">${privCard}${vidCard}${histCard}</div><div class="stack" style="gap:20px">${comCard}</div></div>`;
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
  if(!teams.length) return `<h1>Team chat</h1><div class="locked"><h2>No team chats yet</h2><p class="muted">${isStaff() ? "Add a team and its chat appears here for the coaches and every family on that team." : "Your player isn't on a team yet. Ask your coach to add them to one."}</p>${isStaff()?`<button class="btn primary" data-act="modal" data-m="team">Add team</button>`:""}</div>`;
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
  if(P.error || !P.player) return back + `<div class="card"><p>The profile couldn't load. Try again in a moment.</p></div>`;
  return back + profileHtml(P.player, {pub:{profile:P.profile, refs:P.refs, clubName:P.clubName}});
}
async function loadPublic(slug){
  S.pub = {loading:true}; render();
  try{
    const {data, error} = await sb.rpc("get_public_profile", {p_slug: slug});
    if(error) throw error;
    if(!data || data.status === "missing"){ S.pub = {missing:true}; render(); return; }
    if(data.status === "private"){ S.pub = {private:true}; render(); return; }
    S.pub = {profile: camel(data.profile), player: {id:data.player.id, name:data.player.name, birthYear:data.player.birth_year},
      clubName: data.club_name || "", refs: (data.refs || []).map(camel)};
  } catch(e){ console.error(e); S.pub = {error:true}; }
  render();
}
function readHash(){
  const h = location.hash.slice(1);
  if(PAGE_IDS.includes(h)){ S.publicPage = h; S.menuOpen = false; S.publicSlug = null; S.pub = null; if(h !== "contact") S.contactSent = null; render(); window.scrollTo(0,0); return; }
  if(h === "signin" || h === ""){ S.publicPage = null; S.menuOpen = false; if(S.publicSlug){ S.publicSlug = null; S.pub = null; } render(); window.scrollTo(0,0); return; }
  if(h === "coach" || h === "parent"){ savePortal(h === "coach" ? "coach" : "family"); if(S.publicSlug){ S.publicSlug = null; S.pub = null; } if(!S.uid){ S.authMode = "signin"; } render(); return; }
  const m = /^profile-([a-z0-9]+)$/.exec(h);
  const slug = m ? m[1] : null;
  if(slug !== S.publicSlug){ S.publicSlug = slug; S.pub = null; if(slug && S.authChecked) loadPublic(slug); else render(); }
}

function drillsView(){
  const staff = isStaff();
  if(!staff && !familyHasHome()){
    return `<h1>Home drills</h1><div class="locked"><h2>Part of Home Training</h2><p>Your club hasn't included Home Training for families, so the drill library comes with the family plan.</p><button class="btn primary" data-act="go" data-view="plans">See Home Training plan</button></div>`;
  }
  const list = allDrills().filter(d => (S.catFilter === "All" || d.category === S.catFilter) && (!S.skillFilter || (d.skills||[]).includes(S.skillFilter)));
  let recs = "";
  if(!staff){
    const kids = S.players.filter(p => (S.me.playerIds||[]).includes(p.id));
    recs = kids.map(k => recommendCard(k, {family:true, title: kids.length > 1 ? "Recommended for " + k.name : "Recommended for you"})).join("");
  }
  return `<div class="row between"><div class="stack" style="gap:4px"><h1>${staff?"Drill library":"Home drills"}</h1><p class="muted small">${staff?"Built-in drills plus any your club adds. Assign them to players for home practice.":"Drills you can do at home with a ball and a little space."}</p></div>
    ${staff?`<button class="btn primary" data-act="modal" data-m="drill">Add club drill</button>`:""}</div>
  ${recs}
  <div class="row between"><h2>${staff ? "All drills" : "All home drills"}</h2>
    <label class="f small" for="skill-filter" style="min-width:220px">Works on<select id="skill-filter" data-change="skillFilter"><option value="">Any skill</option>
      <optgroup label="Field players">${FIELD_SKILLS.map(sk=>`<option value="${sk.k}" ${S.skillFilter===sk.k?"selected":""}>${sk.label}</option>`).join("")}</optgroup>
      <optgroup label="Goalkeepers">${GK_SKILLS.map(sk=>`<option value="${sk.k}" ${S.skillFilter===sk.k?"selected":""}>${sk.label}</option>`).join("")}</optgroup></select></label></div>
  <div class="filters" role="group" aria-label="Filter by category">${["All"].concat(CATS).map(c=>`<button data-act="cat" data-id="${esc(c)}" aria-pressed="${S.catFilter===c}">${esc(c)}</button>`).join("")}</div>
  ${list.length ? `<div class="dgrid">${list.map(d=>drillCard(d,{assignable:staff})).join("")}</div>` : `<p class="muted">No drills in this category yet.</p>`}`;
}

function plansView(){
  const staff = isStaff();
  const included = S.club.familyAccess !== "subscribe";
  const fp = S.me.familyPlan;
  let status;
  if(staff) status = included ? "Your club includes Home Training for every family." : "Families in your club subscribe to Home Training on their own.";
  else if(included) status = "Your club includes Home Training, so you already have it.";
  else status = fp ? "You're on a Home Training trial." : "Your club doesn't include Home Training. You can add it for your family.";
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
      <div class="list">${coaches.map(m=>`<div class="row between"><span>${esc(m.name||"Coach")}</span><span class="pill plain">${m.role==="admin"?"Club admin":"Coach"}</span></div>`).join("") || '<p class="muted">No coaches yet.</p>'}</div>
    </div>
    <div class="card stack">
      <div class="row between"><h2>Teams</h2><button class="btn sm" data-act="modal" data-m="team">Add team</button></div>
      <div class="list">${S.teams.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(t=>{const n=S.players.filter(p=>p.teamId===t.id).length;return `<div class="row between"><span><b>${esc(t.name)}</b> <span class="muted small">${esc(t.ageGroup||"")}</span></span><span class="row"><span class="muted small num">${n} player${n===1?"":"s"}</span>${n===0?`<button class="btn ghost sm" data-act="delTeam" data-id="${esc(t.id)}">Delete</button>`:""}</span></div>`;}).join("") || '<p class="muted">No teams yet.</p>'}</div>
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
      <div class="list">${kids.map(k=>`<div class="row between"><span><b>${esc(k.name)}</b> <span class="muted small">${esc(teamName(k.teamId))}</span></span></div>`).join("") || '<p class="muted">None yet.</p>'}</div>
      <div><button class="btn" data-act="modal" data-m="addChild">Add another player</button></div>
    </div>
    <div class="card stack"><h2>You</h2><p>${esc(S.me.name||"")} · Parent or player at ${esc(S.club.name)}</p>
      <div><button class="btn danger" data-act="modal" data-m="leave">Disconnect from this club</button></div></div>
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
  player: () => S.teams.length ? `<h2>Add player</h2><form data-form="player">
    <label class="f" for="p-name">Player name<input type="text" id="p-name" name="name" required maxlength="60"></label>
    <div class="grid2" style="gap:14px">
      <label class="f" for="p-team">Team<select id="p-team" name="teamId">${teamOptions(S.teamFilter)}</select></label>
      <label class="f" for="p-pos">Position<select id="p-pos" name="position">${POSITIONS.map(x=>`<option ${x==="Not set"?"selected":""}>${x}</option>`).join("")}</select></label>
    </div>
    <label class="f" for="p-year">Birth year (optional)<input type="number" id="p-year" name="birthYear" min="1990" max="2030"></label>
    <div class="row"><button class="btn primary" type="submit">Add player</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`
    : `<h2>Add a team first</h2><p>Players belong to a team.</p><div class="row"><button class="btn primary" data-act="modal" data-m="team">Add team</button><button class="btn" data-act="close">Cancel</button></div>`,
  editPlayer: (ds) => { const p = S.players.find(x=>x.id===ds.player); if(!p) return "<p>Player not found.</p>"; return `<h2>Edit ${esc(p.name)}</h2><form data-form="editPlayer" data-id="${esc(p.id)}">
    <label class="f" for="e-name">Player name<input type="text" id="e-name" name="name" required maxlength="60" value="${esc(p.name)}"></label>
    <div class="grid2" style="gap:14px">
      <label class="f" for="e-team">Team<select id="e-team" name="teamId">${teamOptions(p.teamId)}</select></label>
      <label class="f" for="e-pos">Position<select id="e-pos" name="position">${POSITIONS.map(x=>`<option ${x===p.position?"selected":""}>${x}</option>`).join("")}</select></label>
    </div>
    <label class="f" for="e-year">Birth year (optional)<input type="number" id="e-year" name="birthYear" min="1990" max="2030" value="${esc(p.birthYear||"")}"></label>
    <div class="row between"><div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div><button class="btn danger" type="button" data-act="delPlayer" data-id="${esc(p.id)}">Remove player</button></div></form>`; },
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
      <fieldset class="seg" style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:600;margin-bottom:6px">Review type</legend>
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
      <label class="f" for="d-lvl">Level<select id="d-lvl" name="level"><option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
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
    <label class="f" for="ac-code">Player code<input type="text" id="ac-code" name="code" required maxlength="12" autocapitalize="characters"></label>
    <div class="row"><button class="btn primary" type="submit">Connect</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  about: (ds) => {
    const p = S.players.find(x=>x.id===ds.player); if(!p) return "<p>Player not found.</p>";
    const pr = profileFor(p.id) || {}, pos = pr.positions || [], str = pr.strengths || [];
    const custom = str.filter(t => !TAGS.includes(t)).join(", ");
    return `<h2>${esc(p.name)}: about</h2><form data-form="about" data-id="${esc(p.id)}">
      <div class="stack" style="gap:6px"><b>Positions</b><span class="small muted">Tick every position you play. Your main one goes first.</span>
        <label class="f" for="ab-main" style="max-width:260px">Main position<select id="ab-main" name="main"><option value="">Choose…</option>${FIELD_POSITIONS.map(([k,l])=>`<option value="${k}" ${pos[0]===k?"selected":""}>${l} (${k})</option>`).join("")}</select></label>
        <div class="chips">${FIELD_POSITIONS.map(([k,l],i)=>`<label class="chipbox"><input type="checkbox" name="pos" value="${k}" id="ab-pos-${i}" ${pos.includes(k)?"checked":""}><span>${l}</span></label>`).join("")}</div></div>
      <label class="f" for="ab-foot" style="max-width:220px">Stronger foot<select id="ab-foot" name="foot">${["","Right","Left","Both"].map(f=>`<option value="${f}" ${pr.foot===f?"selected":""}>${f||"Not set"}</option>`).join("")}</select></label>
      <div class="stack" style="gap:6px"><b>Strengths</b><div class="chips">${TAGS.map((t,i)=>`<label class="chipbox"><input type="checkbox" name="str" value="${esc(t)}" id="ab-str-${i}" ${str.includes(t)?"checked":""}><span>${esc(t)}</span></label>`).join("")}</div>
        <input type="text" name="strOther" id="ab-str-other" value="${esc(custom)}" placeholder="Other strengths, separated by commas" aria-label="Other strengths"></div>
      <label class="f" for="ab-bio">Short bio<textarea id="ab-bio" name="bio" maxlength="600" placeholder="e.g. Two-footed midfielder who loves to switch the play. Captain of my U12 team.">${esc(pr.bio||"")}</textarea></label>
      <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`;
  },
  visibility: (ds) => {
    const p = S.players.find(x=>x.id===ds.player); if(!p) return "<p>Player not found.</p>";
    const cur = (profileFor(p.id)||{}).visibility || "private";
    return `<h2>Who can see ${esc(p.name)}'s profile?</h2><form data-form="visibility" data-id="${esc(p.id)}">
      ${Object.entries(VIS).map(([k,v])=>`<label class="choice" for="vis-${k}"><input type="radio" id="vis-${k}" name="vis" value="${k}" ${cur===k?"checked":""}><span><b>${v.label}</b><br><span class="small muted">${v.help}</span></span></label>`).join("")}
      <p class="small muted">Coach reviews, skill ratings and home drills stay private: they never show on a public profile. Change this any time.</p>
      <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`;
  },
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
      <label class="choice" for="c-ref"><input type="radio" id="c-ref" name="kind" value="reference" checked><span><b>Reference</b><br><span class="small muted">A recommendation for scouts or new coaches. Shows on the profile when it's public.</span></span></label>
      <label class="choice" for="c-com"><input type="radio" id="c-com" name="kind" value="comment"><span><b>Comment</b><br><span class="small muted">Feedback for the player and family only.</span></span></label>
    </fieldset>
    <label class="f" for="c-title">Your title (optional)<input type="text" id="c-title" name="title" maxlength="60" placeholder="e.g. Head Coach, U12 Boys"></label>
    <label class="f" for="c-text">What would you like to say?<textarea id="c-text" name="text" required maxlength="2000" style="min-height:140px"></textarea></label>
    <div class="row"><button class="btn primary" type="submit">Post</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  leave: () => `<h2>Leave ${esc(S.club.name)}?</h2><p>${isStaff()?"Players and reviews stay with the club. You can rejoin with the club code.":"Your coach's reviews stay with the club. You can reconnect with the player code."}</p>
    <div class="row"><button class="btn danger" data-act="leave">Leave</button><button class="btn" data-act="close">Cancel</button></div>`
};

/* ---------- actions ---------- */
const ACTS = {
  go: ds => { S.view = ds.view; S.preview = false; if(S.publicPage){ S.publicPage = null; try { history.replaceState(null, "", location.pathname + location.search); } catch(_){} } window.scrollTo(0,0); render(); },
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
  delPlayer: async ds => {
    const el = document.querySelector('[data-act="delPlayer"]');
    if(el && !el.dataset.armed){ el.dataset.armed = "1"; el.textContent = "Click again to remove"; return; }
    closeModal();
    const ok = await save(() => S.db.doc("players/" + ds.id).delete(), "Player removed");
    if(ok){
      S.view = "roster"; render();
    }
  },
  startPlan: async () => { await save(() => S.db.doc("members/" + S.uid).update({familyPlan:"trial", planStarted:today()}), "Home Training trial started"); },
  cancelPlan: async () => { await save(() => S.db.doc("members/" + S.uid).update({familyPlan:null}), "Trial cancelled"); },
  ptab: ds => { S.ptab = ds.id; render(); },
  selfAssign: async ds => {
    const d = drillById(ds.drill); if(!d) return;
    await save(async () => {
      try { await S.db.collection("assignments").doc().set({clubId:S.me.clubId, playerId:ds.player, drillId:d.id, drillTitle:d.title, perWeek:3, note:"", assignedBy:S.uid, done:[], active:true, createdAt:Date.now()}); }
      catch(e){ if(e.code === "invalid_argument"){ const x = new Error("x"); x.userMessage = "Adding drills yourself needs a quick database update (003). Ask your club admin, or ask your coach to assign it."; throw x; } throw e; }
    }, "Added to this week's drills. Your coach can see it too.");
  },
  chatTeam: ds => { S.chatTeam = ds.id; render(); const c = document.getElementById("chat-input"); if(c) c.focus(); },
  delMsg: async ds => { await save(() => S.db.doc("messages/" + ds.id).delete(), "Message deleted"); },
  exitPublic: () => { try { history.replaceState(null, "", location.pathname + location.search); } catch(_){ try { location.hash = ""; } catch(__){} } S.publicSlug = null; S.pub = null; render(); },
  delPhoto: async ds => { const p = S.players.find(x=>x.id===ds.id); if(p) await saveProfile(p, {photo:null}, "Photo removed"); },
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
  joinFamily: async fd => {
    let name = "";
    const ok = await save(async () => { name = await rpc("join_family", {player_code:fd.get("code").trim(), my_name:fd.get("name").trim()}); });
    if(ok){ toast("Connected to " + name); await loadMe(); }
  },
  addChild: async fd => {
    let name = "";
    const ok = await save(async () => { name = await rpc("join_family", {player_code:fd.get("code").trim(), my_name:S.me.name||""}); });
    if(ok){ closeModal(); toast("Added " + name); await loadMe(); schedule("players"); }
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
  team: async fd => { closeModal(); await save(() => S.db.collection("teams").doc().set({clubId:S.me.clubId, name:fd.get("name").trim(), ageGroup:fd.get("age").trim(), createdAt:Date.now()}), "Team added"); },
  player: async fd => {
    closeModal();
    let code = makeCode(6);
    const y = parseInt(fd.get("birthYear"),10);
    await save(() => S.db.collection("players").doc().set({clubId:S.me.clubId, name:fd.get("name").trim(), teamId:fd.get("teamId"), position:fd.get("position"), birthYear: isNaN(y)?null:y, inviteCode:code, createdAt:Date.now()}), "Player added");
  },
  editPlayer: async (fd, form) => {
    closeModal();
    const y = parseInt(fd.get("birthYear"),10);
    await save(() => S.db.doc("players/" + form.dataset.id).update({name:fd.get("name").trim(), teamId:fd.get("teamId"), position:fd.get("position"), birthYear: isNaN(y)?null:y}), "Saved");
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
    await save(() => S.db.collection("drills").doc().set({clubId:S.me.clubId, title:fd.get("title").trim(), category:fd.get("category"), minutes:Number(fd.get("minutes"))||10, equipment:fd.get("equipment").trim(), level:fd.get("level"), steps, createdBy:S.uid, createdAt:Date.now()}), "Drill added");
  },
  chat: async (fd, form) => {
    const text = String(fd.get("text")||"").trim(); if(!text || !S.chatTeam) return;
    const ann = isStaff() && !!fd.get("announce");
    const ta = form.querySelector("#chat-input"); if(ta) ta.value = "";
    const cb = form.querySelector("#chat-ann"); if(cb) cb.checked = false;
    const ok = await save(() => S.db.collection("messages").doc().set({clubId:S.me.clubId, teamId:S.chatTeam, authorId:S.uid, authorName:S.me.name||"", role:S.me.role, text:text.slice(0,1000), announce:ann, createdAt:Date.now()}));
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
    await saveProfile(p, {visibility: VIS[v] ? v : "private"}, v === "public" ? "Profile is public. Use Copy profile link to share it." : "Saved");
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
  if(ev.key === "Enter" && !ev.shiftKey && !ev.isComposing && ev.target.id === "chat-input"){ ev.preventDefault(); const f = ev.target.form; if(f) f.requestSubmit(); return; }
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
    <span class="brand small-brand">${brandSvg}<span>${APP_NAME}</span></span>
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
      ${step(2,"Add teams and players","Each player gets a 6-letter code to give their family.")}
      ${step(3,"Review and assign","Rate 13 field-player skills (or 7 for goalkeepers) from 1 to 5, add an update note, and assign home drills.")}
    </div>
    <div class="card stack"><h2>For parents and players</h2>
      ${step(1,"Connect with your code","Sign up as a parent or player and enter the code from your coach.")}
      ${step(2,"See the feedback","Every review, what changed since last time, and progress since the first review.")}
      ${step(3,"Train at home","Get drills recommended from the coach's review and tick them off each week.")}
    </div>
  </div>
  <div class="grid3">
    ${feature("Reviews that show progress","Every update is saved. Families see exactly which skills went up, and why.")}
    ${feature("Drills picked for each player","Recommendations come from the lowest ratings and the coach's own 'work on' notes.")}
    ${feature("Team chat","One place for schedule changes, announcements and quick questions, per team.")}
  </div>
  ${cta()}`;
}

function pageDrills(){
  const list = BUILTIN_DRILLS.filter(d => (S.catFilter === "All" || d.category === S.catFilter) && (!S.skillFilter || (d.skills||[]).includes(S.skillFilter)));
  return `<section class="page-hero stack"><span class="eyebrow">Drills</span>
    <h1>${BUILTIN_DRILLS.length} drills players can do at home</h1>
    <p class="lead">A ball, a wall and a little space. Each drill lists the skills it trains. Signed-in players get the ones that match their coach's latest review.</p></section>
  <div class="row between">
    <div class="filters" role="group" aria-label="Filter by category">${["All"].concat(CATS).map(c=>`<button data-act="cat" data-id="${esc(c)}" aria-pressed="${S.catFilter===c}">${esc(c)}</button>`).join("")}</div>
    <label class="f small" for="skill-filter" style="min-width:220px">Works on<select id="skill-filter" data-change="skillFilter"><option value="">Any skill</option>
      <optgroup label="Field players">${FIELD_SKILLS.map(sk=>`<option value="${sk.k}" ${S.skillFilter===sk.k?"selected":""}>${sk.label}</option>`).join("")}</optgroup>
      <optgroup label="Goalkeepers">${GK_SKILLS.map(sk=>`<option value="${sk.k}" ${S.skillFilter===sk.k?"selected":""}>${sk.label}</option>`).join("")}</optgroup></select></label>
  </div>
  ${list.length ? `<div class="dgrid">${list.map(d => drillCard(d)).join("")}</div>` : `<p class="muted">No drills match. Try another filter.</p>`}
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
    ${feature("Simple onboarding","Share one club code with coaches and one code per player with families. No spreadsheets.")}
    ${feature("Private by design","Families only see their own child. Reviews never appear on public profiles.")}
  </div>
  <div class="card stack callout"><h2>Set up your club in 5 minutes</h2>
    <ol class="numbered"><li>Sign up as a coach and choose <b>Start a club</b>.</li><li>Share your club code with your other coaches.</li><li>Add your teams and players, then send each family their player code.</li></ol>
    <div class="row cta-row"><button type="button" class="btn primary" data-act="pickPortal" data-id="coach">Start your club</button><a class="btn" href="#contact">Talk to us first</a></div></div>`;
}

function pageRecruiting(){
  const E = EXAMPLE;
  return `<section class="page-hero stack"><span class="eyebrow">Recruiting</span>
    <h1>A player profile you can send to scouts</h1>
    <p class="lead">Players build a profile with highlight videos, club history and coach references, then share one link with college programmes, academies or a new club.</p></section>
  <div class="grid2">
    <div class="stack" style="gap:16px">
      ${feature("Highlight videos","Upload clips or link YouTube, Hudl or Veo.")}
      ${feature("Coach references","Coaches write references that show on the public profile, in their own words.")}
      ${feature("Club history","Every club and team, with years and highlights.")}
      ${feature("You choose who sees it","Private, club only or public. Coach reviews and ratings always stay private.")}
    </div>
    <div class="card stack">
      <div class="row between"><h3>What a scout sees</h3><span class="pill warn">Example</span></div>
      <div class="pcard"><div class="photo avatar-art" style="width:96px;height:96px">${GRAY_AVATAR}</div>
        <div class="stack" style="gap:6px"><h2>${esc(E.name)}</h2><p class="muted">${esc(E.club)} · ${esc(E.team)}</p>
          <div class="chips"><span class="chip str">Central mid · main</span><span class="chip">Attacking mid</span></div></div></div>
      <div class="vid"><div class="vlink" style="aspect-ratio:16/7">▶ Fall 2026 highlights</div></div>
      <div class="ref reference"><blockquote>${esc(E.reference.text)}</blockquote><span class="small"><b>${esc(E.reference.author)}</b>, ${esc(E.reference.title)}</span></div>
      <div class="timeline">${E.history.map(h=>`<div class="titem${h.to==="Present"?" now":""}"><div class="row between"><b>${esc(h.club)}</b><span class="small muted num">${esc(h.from)} – ${esc(h.to)}</span></div><div class="small">${esc(h.team)}</div></div>`).join("")}</div>
    </div>
  </div>
  ${cta("I'm a coach","Build my player profile")}`;
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
    ${feature("A profile to be proud of","Photos, highlight videos and coach references. You decide if it's private or public.")}
    ${feature("Private and safe","Only your child's coaches and your family can see reviews. Other families can't.")}
  </div>
  <div class="card stack callout"><h2>How to join</h2>
    <ol class="numbered"><li>Get your child's 6-letter player code from their coach.</li><li>Sign up as a parent or player.</li><li>Enter the code. Older players can use the same code to make their own login.</li></ol>
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
  <div class="card stack"><h2>Questions</h2>
    <div class="faq"><b>Is Home Training free if my club includes it?</b><p class="muted">Yes. If your club includes Home Training, every connected family gets it at no extra cost.</p></div>
    <div class="faq"><b>Do players need their own account?</b><p class="muted">No. Parents can use one account; older players can make their own login with the same player code.</p></div>
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
  const coach = S.portal === "coach";
  const mode = S.authMode || "signin";
  const title = mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Sign in";
  const side = coach
    ? `<span class="pill warn" style="align-self:flex-start">Coach</span>
       <h1>${mode==="signup"?"Bring your club onto "+APP_NAME:"Welcome back, coach"}</h1>
       <p style="max-width:52ch">Track every player's development, assign home drills, write references for scouts and keep your teams in the loop.</p>
       <div class="card stack"><h3>New club?</h3><p class="small">Create an account, then start your club. You'll get a club code to share with your other coaches.</p></div>`
    : `<span class="pill good" style="align-self:flex-start">Parent / Player</span>
       <h1>${mode==="signup"?"Follow your player's progress":"Welcome back"}</h1>
       <p style="max-width:52ch">See your coach's reviews, practice the drills they pick for you, build a highlight profile and chat with your team.</p>
       <div class="card stack"><h3>First time here?</h3><p class="small">Create an account with your email. Then enter the 6-letter player code your coach gave you.</p></div>`;
  return `<button class="btn ghost back" data-act="pickPortal" data-id="">← ${coach?"Not a coach? Switch to Parent / Player":"Not a parent or player? Switch to Coach"}</button>
  <section class="hero">
    <div class="stack">${side}</div>
    <form class="card stack auth-${coach?"coach":"family"}" data-form="auth" style="align-self:start">
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
    <linearGradient id="gp-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8553"/><stop offset="1" stop-color="#1a4f31"/></linearGradient>
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
           {club:"Northside Rec", team:"U10 Coed", from:"2020", to:"2023", notes:"Started playing"}]
};
function exampleProfile(){
  const E = EXAMPLE, rs = E.reviews, last = rs[rs.length-1], prev = rs[rs.length-2];
  const o = overall(last), po = overall(prev);
  const posLabel = k => (FIELD_POSITIONS.find(x=>x[0]===k)||[k,k])[1];
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
        <div class="chips">${E.positions.map((k,i)=>`<span class="chip${i===0?" str":""}">${esc(posLabel(k))}${i===0?" · main":""}</span>`).join("")}</div>
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
          <h3>Coach reference</h3>
          <div class="ref reference"><blockquote>${esc(E.reference.text)}</blockquote><span class="small"><b>${esc(E.reference.author)}</b>, ${esc(E.reference.title)}</span></div>
        </div>
      </div>
      <div class="stack" style="gap:20px">
        <div class="card stack"><h3>Skill ratings</h3>${ratingsHtml(last, prev)}</div>
        <div class="card stack"><h3>Progress & review timeline</h3>${progressSummary(rs)}${timelineHtml(rs)}</div>
        <div class="card stack"><h3>Club history</h3>
          <div class="timeline">${E.history.map(h=>`<div class="titem${h.to==="Present"?" now":""}"><div class="row between"><b>${esc(h.club)}</b><span class="small muted num">${esc(h.from)} – ${esc(h.to)}</span></div><div class="small">${esc(h.team)}</div><p class="small muted">${esc(h.notes)}</p></div>`).join("")}</div>
        </div>
      </div>
    </div>
    <div class="row" style="justify-content:center;gap:12px">
      <button type="button" class="btn primary" data-act="pickPortal" data-id="coach">Start as a coach</button>
      <button type="button" class="btn" data-act="pickPortal" data-id="family">I'm a parent or player</button>
    </div>
  </section>`;
}
function savePortal(p){ S.portal = p || null; try { if(p) localStorage.setItem("np.portal", p); else localStorage.removeItem("np.portal"); } catch(_){} }
ACTS.pickPortal = ds => {
  savePortal(ds.id); S.publicPage = null; S.menuOpen = false;
  S.authMode = "signin";
  try { history.replaceState(null, "", location.pathname + location.search + (ds.id ? "#" + (ds.id === "coach" ? "coach" : "parent") : "")); } catch(_){}
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
  if(S.authChecked && uid === S.uid){ render(); return; }
  S.uid = uid; S.authChecked = true;
  if(!uid){
    subscribeClub(null);
    S.me = undefined; S.loading = false; S.view = null; S.authMode = "signin"; S.ptab = "dev"; S.playerId = null; S.chatTeam = null; S.pub = S.publicSlug ? S.pub : null;
    render();
    if(S.publicSlug && !S.pub) loadPublic(S.publicSlug);
    return;
  }
  S.loading = true; render();
  await loadMe();
  if(S.me && S.me.role){
    const actual = S.me.role === "family" ? "family" : "coach";
    if(S.portal && S.portal !== actual && event === "SIGNED_IN") toast(actual === "family" ? "This is a parent / player account, so we opened the family view." : "This is a coach account, so we opened the coach view.");
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
