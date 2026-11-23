import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { LANG, LOC, langToggle, setLang } from "./i18n.js";
import { animSvg, animScan, animToggle, hasAnim } from "./anim.js";
import { introHtml, introMount } from "./intro.js";
import { TEAM_DRILLS, teamDrillById, METHODS, PHASES, PHASE_NOTE, TIPS_LABEL, diagramSvg, DIAGRAM_KEY, playersText, LEVELS as TD_LEVELS, LEVEL_NOTE as TD_LEVEL_NOTE } from "./teamdrills.js";
"use strict";
const APP_NAME = "NextPass";

const FIELD_SKILLS = [
  {k:"first_touch",label:"First Touch",group:"Technical"},
  {k:"passing",label:"Passing",group:"Technical"},
  {k:"shooting",label:"Shooting",group:"Technical"},
  {k:"dribbling",label:"Dribbling",group:"Technical"},
  {k:"weak_foot",label:"Weak Foot",group:"Technical"},
  {k:"skill_moves",label:"Skill Moves",group:"Technical"},
  {k:"physicality",label:"Physicality",group:"Speed & physical"},
  {k:"sprint_speed",label:"Sprint Speed",group:"Speed & physical"},
  {k:"handling_speed",label:"Handling Speed",group:"Speed & physical"},
  {k:"separation_speed",label:"Separation Speed",group:"Speed & physical"},
  {k:"stamina",label:"Stamina",group:"Speed & physical"},
  {k:"positional_awareness",label:"Positional Awareness",group:"Tactical"},
  {k:"vision",label:"Vision",group:"Tactical"},
  {k:"decision_making",label:"Decision Making",group:"Tactical"},
  {k:"defending",label:"Defending",group:"Tactical"},
  {k:"tactical_understanding",label:"Tactical Understanding",group:"Tactical"},
  {k:"communication",label:"Communication",group:"Mindset"},
  {k:"attitude",label:"Attitude",group:"Mindset"},
  {k:"coachability",label:"Coachability",group:"Mindset"}
];
/* mindset skills that no drill trains, so they never drive drill picks */
const MINDSET_ONLY = ["coachability", "attitude"];
/* What a review's ratings are measured against. The coach picks one for every review. */
const BASELINES = [
  {k:"age", label:"Age group", help:"Compared with players of the same age"},
  {k:"league", label:"League", help:"Compared with players in the league they play in"},
  {k:"team", label:"Team", help:"Compared with their own teammates"},
  {k:"higher", label:"Higher level", help:"Ready to play at a higher level (U16 and up)", minU:16}
];
const baselineOf = r => BASELINES.find(b => b.k === (r && r.baseline)) || null;
/* the player's age group (U-number): the team's age group, or the birth year for the current season (Aug to Jul) */
function uGroupOf(p){
  if(!p) return null;
  if(p.uGroup) return p.uGroup;
  const t = S.teams.find(x => x.id === p.teamId);
  const m = String((t && t.ageGroup) || (t && t.name) || "").match(/U-?\s?(\d{1,2})\b/i);
  if(m) return Number(m[1]);
  const by = p.birthDate ? Number(String(p.birthDate).slice(0, 4)) : Number(p.birthYear) || null;
  if(!by) return null;
  const n = new Date(), seasonEnd = n.getMonth() >= 7 ? n.getFullYear() + 1 : n.getFullYear();
  return seasonEnd - by;
}
function baselineText(r, p){
  const b = baselineOf(r); if(!b) return "";
  if(b.k === "age"){ const u = uGroupOf(p); return u ? `their age group (U${u})` : "their age group"; }
  if(b.k === "team"){ const t = p && S.teams.find(x => x.id === p.teamId); return t ? `their team (${t.name})` : "their team"; }
  if(b.k === "league") return "their league";
  return "the next level up";
}
const baselinePill = (r, p) => baselineOf(r) ? `<span class="pill plain bl-pill" title="${esc(baselineOf(r).help)}">Rated against ${esc(baselineText(r, p))}</span>` : "";
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
/* discuss and admin-delete buttons for one review */
function reviewActions(r, opts={}){
  const admin = S.me && S.me.role === "admin" && opts.staff;
  const discuss = opts.discuss && S.me && canMessage(S.players.find(x => x.id === r.playerId));
  if(!discuss && !admin) return "";
  return `<div class="row" style="gap:6px">${discuss ? `<button class="btn sm" data-act="discussReview" data-player="${esc(r.playerId)}" data-review="${esc(r.id)}">💬 Discuss this review</button>` : ""}${admin ? `<button class="btn ghost sm" data-act="delReview" data-id="${esc(r.id)}" aria-label="Delete review from ${esc(fmtDate(r.date))}">Delete (admin)</button>` : ""}</div>`;
}
/* every review newest first; opts.skipLast leaves out the latest (it is shown above), opts.player adds the baseline */
function timelineHtml(rs, opts={}){
  if(!rs.length) return '<p class="muted">No reviews yet.</p>';
  const items = rs.map((r,i) => ({r, prev: rs[i-1], i}));
  const shown = (opts.skipLast ? items.slice(0, -1) : items).reverse();
  if(!shown.length) return "";
  return `<div class="tl">${shown.map(({r, prev, i}) => {
    const o = overall(r), po = overall(prev), ch = changesBetween(prev, r);
    const str = r.strengths || [], imp = r.improve || [];
    return `<div class="tl-item">
      <div class="row between"><div><b>${fmtDate(r.date)}</b> <span class="small muted">${esc(r.coachName||"Coach")}${i === 0 ? " · first review" : ""}${reviewForm(r)==="gk"?" · goalkeeper":""}</span></div>
        <div class="row"><span class="score num">${o!=null?fix1(o):"–"}</span>${o!=null&&po!=null?deltaHtml(o-po):""}</div></div>
      ${r.summary ? `<p class="tl-sum">“${esc(r.summary)}”</p>` : ""}
      ${ch.length ? `<div class="chips">${ch.map(changeChip).join("")}</div>` : (prev && reviewForm(prev)===reviewForm(r) ? `<span class="small muted">No rating changes</span>` : "")}
      ${str.length || imp.length ? `<div class="chips">${str.map(t=>`<span class="chip str">${esc(t)}</span>`).join("")}${imp.map(t=>`<span class="chip imp">Work on: ${esc(t)}</span>`).join("")}</div>` : ""}
      <details class="tl-more"><summary class="small">Ratings${r.note ? " and coach's note" : ""}</summary><div class="stack" style="gap:10px;margin-top:8px">${ratingsHtml(r, prev, opts.player)}${r.note ? `<div class="note small">${esc(r.note)}</div>` : ""}</div></details>
      ${reviewActions(r, opts)}
    </div>`; }).join("")}</div>`;
}
/* "Show review history" under the latest review */
function reviewHistoryHtml(rs, opts={}){
  if(rs.length < 2) return "";
  const n = rs.length - 1;
  return `<details class="rv-hist"><summary><span class="rh-show">Show review history</span><span class="rh-hide">Hide review history</span> <span class="small muted">${n} earlier review${n===1?"":"s"}</span></summary>${timelineHtml(rs, {...opts, skipLast:true})}</details>`;
}
const TAGS = ["First touch","Weak foot","Passing range","Scanning","1v1 attacking","1v1 defending","Finishing","Crossing","Heading","Shielding","Positioning","Decision making","Speed","Work rate","Communication","Confidence on the ball","Leadership","Composure"];
const POSITIONS = ["Goalkeeper","Defender","Midfielder","Forward","Not set"];
const CATS = ["Ball mastery","First touch","Passing","Dribbling","Finishing","Speed & agility","Defending","Fitness","Goalkeeping"];

/* skills: review attributes a drill trains (used for recommendations); tags: matching "Work on" tags; gk: goalkeeper drill.
   Step-by-step instructions live in Supabase (drill_steps) behind Home Training; only the free samples carry steps here. */
const BUILTIN_DRILLS = [
  /* Solo drills for ages 10 to 18: a ball, a few cones and a wall. Built from tools/drills.py; edit that file, not this list. */
  {free:true,id:"b-toe-taps",title:"Toe taps",category:"Ball mastery",minutes:6,equipment:"Ball",level:"Beginner",skills:["first_touch", "handling_speed"],tags:["Confidence on the ball"],goal:"Quick, light feet and a feel for the ball with the sole: the base for every other touch.",setup:"A ball and 2 yards of flat space.",steps:["Stand behind the ball with your knees soft and weight on the balls of your feet.", "Tap the top of the ball with the sole of your right foot, then your left, in a steady rhythm.", "Only the front of the foot touches the ball. Don't push it away.", "Keep your arms relaxed and your eyes up between touches."],reps:"4 × 30 seconds, 30 seconds rest. Count your touches each round.",points:["Light touches: the ball shouldn't move.", "Stay on your toes; your heels never touch the ground.", "Eyes up: glance at the ball, then look ahead."],easier:"Go slower and look down. Hold onto a wall with one hand for balance.",harder:"Move around the ball in a full circle while tapping, then change direction."},
  {id:"b-tick-tock",title:"Tick-tocks",category:"Ball mastery",minutes:6,equipment:"Ball",level:"Beginner",skills:["first_touch", "dribbling", "handling_speed"],tags:["Confidence on the ball", "Weak foot"],goal:"Fast, soft touches with the inside of both feet: close control in tight spaces."},
  {id:"b-sole-roll",title:"Sole rolls across the body",category:"Ball mastery",minutes:6,equipment:"Ball",level:"Beginner",skills:["first_touch", "dribbling"],tags:["Confidence on the ball"],goal:"Control the ball with the sole so it stays glued to you when you move sideways."},
  {id:"b-inside-outside",title:"Inside-outside touches",category:"Ball mastery",minutes:6,equipment:"Ball",level:"Beginner",skills:["first_touch", "dribbling"],tags:["Confidence on the ball", "Weak foot"],goal:"Use the inside and outside of the same foot to move the ball and keep it close."},
  {id:"b-pull-push",title:"Pull-back and push",category:"Ball mastery",minutes:6,equipment:"Ball",level:"Beginner",skills:["first_touch", "dribbling"],tags:["Confidence on the ball"],goal:"Drag the ball back with the sole and push it forward again: the start of most turns."},
  {id:"b-juggle-basics",title:"Juggling: kick, bounce, catch",category:"Ball mastery",minutes:8,equipment:"Ball",level:"Beginner",skills:["first_touch"],tags:["First touch"],goal:"Learn to strike the ball softly and straight up: the first step to juggling."},
  {id:"b-cushion",title:"Throw, cushion and control",category:"First touch",minutes:8,equipment:"Ball",level:"Beginner",skills:["first_touch"],tags:["First touch", "Composure"],goal:"Take the pace off a dropping ball so it stays within a step of you."},
  {free:true,id:"b-wall-pass",title:"Two-touch wall passes",category:"Passing",minutes:10,equipment:"Ball, wall",level:"Beginner",skills:["passing", "first_touch"],tags:["Weak foot"],goal:"Clean, firm passes with the inside of the foot and a controlled first touch.",setup:"Stand 5 yards from a solid wall.",steps:["Pass the ball against the wall with the inside of your right foot.", "Control the return with one touch, setting it for your next pass.", "Pass with the left foot next time.", "Keep the ball on the ground all the time."],reps:"4 × 1 minute, 30 seconds rest. Count your passes.",points:["Plant foot beside the ball, pointing at the wall.", "Ankle locked and toe up when you pass.", "Strike through the middle of the ball so it stays down."],easier:"Stand closer (3 yards) and stop the ball before each pass.",harder:"Move back to 8 yards, or pass with your weaker foot only."},
  {id:"b-pass-gate",title:"Wall passes through a gate",category:"Passing",minutes:10,equipment:"Ball, wall, 2 cones",level:"Beginner",skills:["passing"],tags:["Weak foot", "Passing range"],goal:"Accurate passing: put the ball through a small gate on its way to the wall."},
  {id:"b-wall-control",title:"Control with every surface",category:"First touch",minutes:10,equipment:"Ball, wall",level:"Beginner",skills:["first_touch"],tags:["First touch"],goal:"Comfortable receiving with the inside, outside and sole of both feet."},
  {id:"b-cone-weave",title:"Cone weave dribble",category:"Dribbling",minutes:10,equipment:"Ball, 6 cones",level:"Beginner",skills:["dribbling", "handling_speed"],tags:["Confidence on the ball"],goal:"Close control through tight gaps using both feet."},
  {id:"b-push-stop",title:"Push and stop",category:"Dribbling",minutes:8,equipment:"Ball, 2 cones",level:"Beginner",skills:["dribbling", "first_touch"],tags:["Confidence on the ball"],goal:"Change from running with the ball to a full stop and back: a key dribbling skill."},
  {id:"b-box-dribble",title:"Dribble the box",category:"Dribbling",minutes:10,equipment:"Ball, 4 cones",level:"Beginner",skills:["dribbling", "handling_speed"],tags:["Confidence on the ball", "Weak foot"],goal:"Keep the ball close while turning corners with both feet."},
  {id:"b-basic-turns",title:"Hook turns",category:"Dribbling",minutes:10,equipment:"Ball, 2 cones",level:"Beginner",skills:["dribbling", "first_touch"],tags:["Confidence on the ball"],goal:"Turn away from trouble with the inside and outside hook."},
  {id:"b-laces",title:"Laces strike at a wall target",category:"Finishing",minutes:10,equipment:"Ball, wall, 2 cones",level:"Beginner",skills:["shooting"],tags:["Finishing"],goal:"A clean, low, powerful strike with the laces."},
  {id:"b-quick-feet",title:"Cone quick feet",category:"Speed & agility",minutes:8,equipment:"6 cones",level:"Beginner",skills:["handling_speed", "separation_speed"],tags:["Speed"],goal:"Fast, light footwork and coordination."},
  {id:"b-balance",title:"Balance and reach",category:"Fitness",minutes:8,equipment:"3 cones",level:"Beginner",skills:["physicality"],tags:["Work rate"],goal:"Strong ankles, knees and hips that protect against injury."},
  {id:"g-w-catch",title:"W-catch, basket and scoop",category:"Goalkeeping",minutes:8,equipment:"Ball, wall",level:"Beginner",skills:["gk_ball_handling", "gk_shot_stopping"],tags:["First touch"],goal:"Safe catching technique at head height, chest height and on the ground.",gk:true},
  {id:"g-shuffle",title:"Shuffle and set",category:"Goalkeeping",minutes:8,equipment:"Ball, wall, 2 cones",level:"Beginner",skills:["gk_positioning", "gk_shot_stopping"],tags:["Positioning"],goal:"Move across the goal without crossing your feet and be set before the shot.",gk:true},
  {id:"g-roll-out",title:"Roll-outs to a target",category:"Goalkeeping",minutes:8,equipment:"Ball, 2 cones",level:"Beginner",skills:["gk_distribution"],tags:["Passing range"],goal:"Quick, accurate bowling distribution to start attacks.",gk:true},
  {id:"b-v-pull",title:"V pull-backs",category:"Ball mastery",minutes:8,equipment:"Ball",level:"Intermediate",skills:["first_touch", "dribbling"],tags:["Confidence on the ball"],goal:"Change direction with the sole and inside of the same foot."},
  {id:"b-juggle",title:"Juggling ladder",category:"First touch",minutes:10,equipment:"Ball",level:"Intermediate",skills:["first_touch"],tags:["First touch", "Composure"],goal:"Soft touch and control with every surface."},
  {id:"b-weak-foot",title:"Weak-foot only",category:"Passing",minutes:12,equipment:"Ball, wall, 4 cones",level:"Intermediate",skills:["passing", "dribbling", "first_touch"],tags:["Weak foot"],goal:"Make your weaker foot a real option."},
  {id:"b-first-touch",title:"Open-body first touch",category:"First touch",minutes:10,equipment:"Ball, wall, 2 cones",level:"Intermediate",skills:["first_touch", "positional_awareness", "decision_making"],tags:["First touch", "Composure", "Scanning"],goal:"Receive side-on and take your first touch into space to play forward."},
  {id:"b-receive-turn",title:"Receive and turn off the wall",category:"First touch",minutes:10,equipment:"Ball, wall, 1 cone",level:"Intermediate",skills:["first_touch", "positional_awareness", "decision_making"],tags:["Scanning", "Composure"],goal:"Turn with your first touch, like a midfielder checking away from a defender."},
  {id:"b-scan",title:"Shoulder checks",category:"First touch",minutes:8,equipment:"Ball, wall, 4 cones",level:"Intermediate",skills:["positional_awareness", "decision_making", "first_touch"],tags:["Scanning"],goal:"Build the habit of looking over both shoulders before every touch."},
  {free:true,id:"b-wall-one-touch",title:"One-touch wall passing",category:"Passing",minutes:10,equipment:"Ball, wall",level:"Intermediate",skills:["passing", "first_touch", "handling_speed"],tags:["Weak foot"],goal:"Quick, accurate one-touch passing with both feet.",setup:"Stand 4 yards from a wall.",steps:["Pass against the wall with your right foot.", "Pass the rebound back first time with your left foot.", "Keep alternating feet without stopping the ball.", "Stay on your toes, ready to move to the ball."],reps:"4 × 45 seconds, 30 seconds rest. Count passes.",points:["Body faces the wall.", "Small steps to get in line.", "Pass with the inside of the foot every time."],easier:"Two touches: control, then pass.",harder:"Move back to 6 yards, or move sideways along the wall as you pass."},
  {id:"b-one-two",title:"One-two off the wall and go",category:"Passing",minutes:10,equipment:"Ball, wall, 2 cones",level:"Intermediate",skills:["passing", "separation_speed", "decision_making"],tags:["1v1 attacking"],goal:"Beat a defender with a give-and-go."},
  {id:"b-four-turns",title:"Four turns",category:"Dribbling",minutes:12,equipment:"Ball, 2 cones",level:"Intermediate",skills:["dribbling", "first_touch"],tags:["Confidence on the ball"],goal:"Four turns that get you out of tight spaces."},
  {id:"b-skill-moves",title:"Skill move ladder",category:"Dribbling",minutes:12,equipment:"Ball, 3 cones",level:"Intermediate",skills:["dribbling", "separation_speed"],tags:["1v1 attacking"],goal:"Use a move to beat a defender, then speed away."},
  {id:"b-change-pace",title:"Change of pace and direction",category:"Dribbling",minutes:10,equipment:"Ball, 4 cones",level:"Intermediate",skills:["dribbling", "separation_speed"],tags:["1v1 attacking", "Speed"],goal:"Slow down to set up the defender, then accelerate away."},
  {id:"b-speed-dribble",title:"Speed dribble and stop",category:"Dribbling",minutes:10,equipment:"Ball, 2 cones",level:"Intermediate",skills:["dribbling", "separation_speed"],tags:["Speed"],goal:"Run fast with the ball, then stop under control."},
  {id:"b-dribble-shoot",title:"Dribble, set and shoot",category:"Finishing",minutes:12,equipment:"Ball, wall, 5 cones",level:"Intermediate",skills:["shooting", "dribbling"],tags:["Finishing"],goal:"Combine dribbling and finishing at game speed."},
  {id:"b-wall-return-finish",title:"Wall return, set and finish",category:"Finishing",minutes:12,equipment:"Ball, wall, 4 cones",level:"Intermediate",skills:["shooting", "first_touch"],tags:["Finishing", "Composure"],goal:"Score after receiving: control, set and strike."},
  {id:"b-5-10-5",title:"5-10-5 shuttle",category:"Speed & agility",minutes:10,equipment:"3 cones",level:"Intermediate",skills:["separation_speed", "physicality"],tags:["Speed"],goal:"Quick change of direction."},
  {id:"b-jockey",title:"Jockey footwork",category:"Defending",minutes:8,equipment:"2 cones",level:"Intermediate",skills:["defending", "physicality"],tags:["1v1 defending"],goal:"Defend side-on and keep up with an attacker."},
  {id:"b-jump-land",title:"Cone hops: jump and land",category:"Fitness",minutes:10,equipment:"4 cones",level:"Intermediate",skills:["physicality"],tags:["Work rate"],goal:"Power and safe landings that protect your knees."},
  {id:"g-collapse",title:"Collapse saves off the wall",category:"Goalkeeping",minutes:12,equipment:"Ball, wall",level:"Intermediate",skills:["gk_diving", "gk_shot_stopping"],tags:["Composure"],goal:"Save shots close to your body by falling sideways.",gk:true},
  {id:"g-reaction",title:"Reaction saves off the wall",category:"Goalkeeping",minutes:8,equipment:"Ball, wall",level:"Intermediate",skills:["gk_shot_stopping", "gk_ball_handling"],tags:["Composure"],goal:"Fast hands and quick feet on rebounds.",gk:true},
  {id:"g-distribution",title:"Distribution to targets",category:"Goalkeeping",minutes:15,equipment:"Ball, 4 cones",level:"Intermediate",skills:["gk_distribution"],tags:["Passing range"],goal:"Accurate throws to start attacks.",gk:true},
  {id:"b-combo-moves",title:"Combination moves at speed",category:"Dribbling",minutes:12,equipment:"Ball, 5 cones",level:"Advanced",skills:["dribbling", "separation_speed", "handling_speed"],tags:["1v1 attacking"],goal:"Link two moves together at game speed to beat a defender who doesn't buy the first one."},
  {id:"b-aerial",title:"Aerial control off the wall",category:"First touch",minutes:12,equipment:"Ball, wall",level:"Advanced",skills:["first_touch", "decision_making"],tags:["First touch", "Composure"],goal:"Bring a high, dropping ball under control with chest, thigh or foot."},
  {id:"b-volley",title:"Volleys and half-volleys",category:"Finishing",minutes:10,equipment:"Ball, wall, 2 cones",level:"Advanced",skills:["shooting", "first_touch"],tags:["Finishing", "Composure"],goal:"Strike a dropping ball cleanly and keep it down."},
  {id:"b-switch-play",title:"Receive, scan and switch",category:"Passing",minutes:12,equipment:"Ball, wall, 4 cones",level:"Advanced",skills:["passing", "positional_awareness", "decision_making"],tags:["Scanning", "Passing range"],goal:"Change the point of attack quickly, like a central midfielder."},
  {id:"b-driven-pass",title:"Driven passes at a wall target",category:"Passing",minutes:12,equipment:"Ball, wall, 2 cones",level:"Advanced",skills:["passing"],tags:["Passing range"],goal:"Low, fast passes over distance that a teammate can control."},
  {id:"b-long-pass",title:"Long passes into a box",category:"Passing",minutes:15,equipment:"Ball, 4 cones",level:"Advanced",skills:["passing"],tags:["Passing range"],goal:"Hit long, lofted passes that land where you want them."},
  {id:"b-curl",title:"Curl round the wall",category:"Finishing",minutes:15,equipment:"Ball, wall, 5 cones",level:"Advanced",skills:["shooting"],tags:["Finishing"],goal:"Bend the ball round a defensive wall into the corner."},
  {id:"b-chip",title:"Chips into a box",category:"Finishing",minutes:12,equipment:"Ball, 7 cones",level:"Advanced",skills:["passing", "shooting"],tags:["Finishing", "Passing range"],goal:"Lift the ball over a defender or keeper and land it softly."},
  {id:"b-first-time",title:"First-time finishing",category:"Finishing",minutes:12,equipment:"Ball, wall, 4 cones",level:"Advanced",skills:["shooting", "first_touch"],tags:["Finishing", "Composure"],goal:"Finish without a controlling touch: the fastest way to score."},
  {id:"b-tight-space",title:"Receive, protect and spin",category:"First touch",minutes:12,equipment:"Ball, wall, 1 cone",level:"Advanced",skills:["first_touch", "physicality", "dribbling"],tags:["Shielding", "Composure"],goal:"Receive with your back to pressure, protect the ball and turn away."},
  {id:"b-weak-finish",title:"Weak-foot finishing",category:"Finishing",minutes:12,equipment:"Ball, wall, 4 cones",level:"Advanced",skills:["shooting"],tags:["Weak foot", "Finishing"],goal:"Score with your weaker foot so defenders can't force you one way."},
  {id:"b-accel-decel",title:"Acceleration and deceleration",category:"Speed & agility",minutes:12,equipment:"4 cones",level:"Advanced",skills:["separation_speed", "physicality"],tags:["Speed"],goal:"Sprint, brake under control and go again: how you get away from defenders."},
  {id:"b-arrowhead",title:"Arrowhead agility with the ball",category:"Speed & agility",minutes:12,equipment:"Ball, 4 cones",level:"Advanced",skills:["dribbling", "separation_speed", "handling_speed"],tags:["Speed", "Confidence on the ball"],goal:"Sharp cuts with the ball at full speed."},
  {id:"b-recovery",title:"Recovery runs",category:"Defending",minutes:10,equipment:"3 cones",level:"Advanced",skills:["defending", "separation_speed"],tags:["1v1 defending", "Work rate"],goal:"Sprint back goal-side when your team loses the ball."},
  {id:"b-defend-approach",title:"Approach, break down and block",category:"Defending",minutes:10,equipment:"Ball, wall",level:"Advanced",skills:["defending", "physicality"],tags:["1v1 defending"],goal:"Close an attacker down fast, slow down, and win the ball."},
  {id:"b-dribble-intervals",title:"Dribble intervals",category:"Fitness",minutes:15,equipment:"Ball, 2 cones",level:"Advanced",skills:["physicality", "dribbling"],tags:["Work rate", "Speed"],goal:"Keep your touch when you're tired, like late in a game."},
  {id:"b-game-sim",title:"Game-speed wall circuit",category:"Finishing",minutes:15,equipment:"Ball, wall, 6 cones",level:"Advanced",skills:["passing", "first_touch", "dribbling", "shooting", "decision_making"],tags:["Composure", "Finishing"],goal:"Pass, receive, turn, dribble and finish in one sequence at match speed."},
  {id:"g-low-dive",title:"Low diving saves off the wall",category:"Goalkeeping",minutes:12,equipment:"Ball, wall",level:"Advanced",skills:["gk_diving", "gk_shot_stopping"],tags:["Composure"],goal:"Dive to save low shots near the post.",gk:true},
  {id:"g-angles",title:"Narrow the angle",category:"Goalkeeping",minutes:10,equipment:"6 cones",level:"Advanced",skills:["gk_positioning", "gk_decision_making"],tags:["Positioning"],goal:"Stand in the right place to cover the most goal on every shot.",gk:true},
  {id:"g-goal-kicks",title:"Goal kicks and drop kicks",category:"Goalkeeping",minutes:15,equipment:"Ball, 4 cones",level:"Advanced",skills:["gk_distribution"],tags:["Passing range"],goal:"Long, accurate kicks to start attacks.",gk:true}
];
/* drills that were retired: old assignments open the closest current drill */
const LEGACY_DRILLS = {"b-targets": "b-laces", "b-shield": "b-tight-space", "b-1v1-line": "b-change-pace", "b-first-step": "b-accel-decel", "b-strength": "b-balance", "b-stance": "b-defend-approach", "b-block-tackle": "b-defend-approach", "b-press-cover": "b-recovery", "b-defend-2v1": "b-jockey", "b-scan-switch": "b-scan", "b-color-gates": "b-scan", "b-talk": "b-wall-pass", "b-call-ball": "b-wall-pass", "b-crossing": "b-long-pass", "b-angle-finish": "b-first-time", "b-1v1-recover": "b-dribble-shoot", "g-set-catch": "g-w-catch", "g-scoop": "g-w-catch", "g-cross-catch": "g-w-catch", "g-come-stay": "g-angles", "g-breakaway": "g-low-dive", "g-penalties": "g-low-dive", "g-top-corner": "g-low-dive", "g-back-pass": "g-distribution"};

const S = {
  db:null, user:null, uid:null, canWrite:true, me:undefined, club:null,
  teams:[], players:[], reviews:[], assignments:[], drills:[], members:[],
  view:null, playerId:null, childId:null, teamFilter:"all", catFilter:"All",
  chartSkill:"overall", preview:false, loading:true, noDb:false, notice:null, subClubId:undefined,
  profiles:[], comments:[], ptab:"dev", assets:null, publicSlug:null, pub:null,
  sessions:[], sessTab:"plan", sessTeam:null, draft:null, tdPhase:"All", tdSkill:"", tdSearch:"", tdAllAges:false,
  messages:[], chatTeam:null, pmessages:[], reactions:[], reactFor:null, opps:[], oppKind:"", oppGender:"", oppQ:"", meetings:[], teamCoaches:[], pmPlayer:null, pmTab:"chat", meetingId:null
};
const APP_URL = location.origin + location.pathname;
/* invite links: coaches get #coach-join-<club code>, families get #team-<team id> */
const coachInviteUrl = () => APP_URL + "#coach-join-" + S.club.code;
const teamInviteUrl = t => APP_URL + "#team-" + t.id;
function saveInvite(v){ S.invite = v || null; try { v ? localStorage.setItem("np-invite", JSON.stringify(v)) : localStorage.removeItem("np-invite"); } catch(_){} }
function readInviteHash(h){
  let m = /^coach-join-([A-Za-z0-9]{4,12})$/.exec(h || "");
  if(m){ saveInvite({kind:"coach", code:m[1].toUpperCase()}); savePortal("coach"); return true; }
  m = /^team-([0-9a-fA-F-]{36})$/.exec(h || "");
  if(m){ saveInvite({kind:"team", teamId:m[1].toLowerCase()}); savePortal("family"); return true; }
  return false;
}
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
const fmtDob = d => d ? new Date(d + "T00:00:00").toLocaleDateString(LOC, {year:"numeric", month:"short", day:"numeric"}) : "";
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
const fmtDate = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString(LOC,{month:"short",day:"numeric",year:"numeric"}) : "";
const shortDate = iso => new Date(iso + "T12:00:00").toLocaleDateString(LOC,{month:"short",day:"numeric"});
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
const allDrills = () => BUILTIN_DRILLS.concat(S.drills.map(d => ({...d, category:d.category === "Shooting" ? "Finishing" : d.category, custom:true, steps:Array.isArray(d.steps)?d.steps:[]})));
const drillById = id => allDrills().find(d => d.id === id) || (LEGACY_DRILLS[id] ? allDrills().find(d => d.id === LEGACY_DRILLS[id]) : undefined);
const SKILL_LABEL = Object.fromEntries(FIELD_SKILLS.concat(GK_SKILLS).map(s => [s.k, s.label]));
/* coach "Work on" tags -> review attributes */
const TAG_SKILLS = {
  "First touch":["first_touch","gk_ball_handling"], "Weak foot":["weak_foot","passing","shooting"], "Passing range":["passing","vision","gk_distribution"],
  "Scanning":["vision","positional_awareness","decision_making"], "1v1 attacking":["dribbling","separation_speed"], "1v1 defending":["defending"],
  "Finishing":["shooting"], "Crossing":["passing"], "Heading":["physicality"], "Shielding":["physicality","dribbling"],
  "Positioning":["positional_awareness","gk_positioning"], "Decision making":["decision_making","gk_decision_making"],
  "Speed":["sprint_speed","separation_speed","handling_speed"], "Work rate":["stamina","attitude"],
  "Communication":["communication","gk_communication"], "Confidence on the ball":["skill_moves","dribbling","first_touch"],
  "Leadership":["communication","gk_communication"], "Composure":["decision_making","first_touch"]
};
/* The six newer review skills (weak foot, skill moves, sprint speed, stamina, vision) are matched to drills from what each drill already trains. */
function addDerivedSkills(d){
  const sk = new Set(d.skills || []), tags = d.tags || [], txt = ((d.title || "") + " " + (d.summary || d.goal || "")).toLowerCase();
  if(sk.has("weak_foot") || tags.includes("Weak foot") || /weak(er)? foot|both feet|either foot/.test(txt)) sk.add("weak_foot");
  if(sk.has("dribbling") && (["Dribbling","Ball mastery"].includes(d.category) || /1v1|turn|feint|move|beat/.test(txt))) sk.add("skill_moves");
  if(sk.has("separation_speed") || d.category === "Speed & agility" || /sprint/.test(txt)) sk.add("sprint_speed");
  if(d.category === "Fitness" || tags.includes("Work rate") || ["conditioning","pressing","wave"].includes(d.method) || (sk.has("physicality") && sk.has("separation_speed"))) sk.add("stamina");
  if(tags.includes("Scanning") || tags.includes("Passing range") || /scan|switch|between the lines|third man/.test(txt) || (sk.has("passing") && sk.has("positional_awareness"))) sk.add("vision");
  if(d.gk) ["weak_foot","skill_moves","sprint_speed","stamina","vision"].forEach(k => sk.delete(k));
  d.skills = Array.from(sk);
}
BUILTIN_DRILLS.forEach(addDerivedSkills); TEAM_DRILLS.forEach(addDerivedSkills);
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
/* a current club that isn't on NextPass, from the profile's club history */
const outsideClub = pr => ((pr && pr.history || []).find(h => h.to === "Present") || {}).club || "";
/* the coach's position, or the family's main position */
const posText = p => p.position && p.position !== "Not set" ? p.position : (((profileFor(p.id) || {}).positions || [])[0] ? positionLabel(profileFor(p.id).positions[0]) : "");
const pendingFor = pid => (S.requests || []).find(r => r.playerId === pid && r.status === "pending");
const pendingRequests = () => (S.requests || []).filter(r => r.status === "pending");
const isCollege = () => !!(S.me && S.me.role === "college");
const isPro = () => !!(S.me && S.me.role === "pro");
const isScout = () => isCollege() || isPro();                 // accounts that only recruit
/* the recruiting section someone searches in: college coaches, pro scouts, or club coaches (youth) */
const mySection = () => isCollege() ? "college" : isPro() ? "pro" : isStaff() ? "youth" : null;
const SECTIONS = {
  college:{label:"College", age:"16 and over", who:"college coaches", search:"College coach search", by:"Verified college coaches (school .edu email)"},
  pro:{label:"Pro", age:"16 and over", who:"pro scouts", search:"Pro scout search", by:"Pro scouts and academy staff that " + APP_NAME + " has approved one by one"},
  youth:{label:"Youth clubs", age:"All ages", who:"club coaches", search:"Youth club search", by:"Coaches and admins of clubs on " + APP_NAME}};
const SECTION_KEYS = ["college","pro","youth"];
const PRO_LEVELS = ["MLS","MLS NEXT Pro","USL Championship","USL League One","NWSL","USL Super League","Pro academy","Abroad"];
const PRO_STATUS = ["Amateur","Free agent","Under contract"];
const ORG_TYPES = ["Professional club","Academy","Agency","National federation","Other"];
const YOUTH_LEVELS = ["Recreational","Travel / Select","Premier / Elite"];
const YOUTH_LOOKING = ["New club","Tryouts","Guest player"];
const secOf = i => SECTION_KEYS.includes(i.section) ? i.section : "college";
const newInterest = sec => isStaff() || isScout() ? [] : (S.interest || []).filter(i => i.status === "new" && (!sec || secOf(i) === sec));
const pendingScouts = () => (S.scouts || []).filter(x => x.status === "pending");
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
  el.innerHTML = `<div class="toast${err?" err":""}" role="${err ? "alert" : "status"}">${esc(msg)}</div>`;
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
  pmessages:"private_messages", meetings:"meetings", requests:"join_requests", interest:"recruit_interest", shortlist:"college_shortlist", college:"college_coaches", sessions:"team_sessions", reactions:"message_reactions", opps:"opportunities"};
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
  /* update 017 adds setup, reps, coaching points and easier / harder; older databases only have the steps */
  let {data, error} = await sb.from("drill_steps").select("drill_id,steps,setup,reps,points,easier,harder");
  if(error) ({data, error} = await sb.from("drill_steps").select("drill_id,steps"));
  if(error){ console.warn("drill_steps", error.message); S.drillSteps = {}; S.stepsError = true; S.stepsLoaded = true; render(); return; }
  S.drillSteps = Object.fromEntries((data||[]).map(r => [r.drill_id, {steps:r.steps || [], setup:r.setup || "", reps:r.reps || "", points:r.points || [], easier:r.easier || "", harder:r.harder || ""}]));
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
  const cid = S.me ? (S.me.role === "family" ? "fam:" + S.uid : S.me.role === "college" ? "college:" + S.uid : S.me.role === "pro" ? "pro:" + S.uid : S.me.clubId) : null;
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
  const fam = cid.startsWith("fam:"), col = cid.startsWith("college:"), pro = cid.startsWith("pro:");
  /* college coaches and pro scouts only load their own details, shortlist and messages */
  if(col && !["college","shortlist","interest","opps"].includes(key)) return;
  if(pro && !["pro","shortlist","interest"].includes(key)) return;
  if((key === "college" && !col) || (key === "pro" && !pro) || (key === "shortlist" && fam) || (key === "sessions" && fam)) return;
  const byClub = t => fam ? sb.from(t).select("*") : sb.from(t).select("*").eq("club_id", cid);
  let q;
  if(key === "club") q = fam ? sb.rpc("family_clubs") : sb.from("clubs").select("*").eq("id", cid).maybeSingle();
  else if(key === "messages") q = byClub("messages").order("created_at", {ascending:false}).limit(600);
  else if(key === "pmessages") q = byClub("private_messages").order("created_at", {ascending:false}).limit(1500);
  else if(key === "opps") q = sb.from("opportunities").select("*").gte("starts_on", new Date(Date.now() - 60*86400000).toLocaleDateString("en-CA")).order("starts_on", {ascending:true}).limit(1000);
  else if(key === "reactions") q = byClub("message_reactions").order("created_at", {ascending:false}).limit(5000);
  else if(key === "requests") q = byClub("join_requests").order("created_at", {ascending:false}).limit(300);
  else if(key === "interest") q = sb.from("recruit_interest").select("*").order("created_at", {ascending:false}).limit(300);
  else if(key === "pro") q = sb.from("pro_scouts").select("*").eq("id", S.uid).maybeSingle();
  else if(key === "owner") q = sb.from("platform_admins").select("user_id");
  else if(key === "scouts") q = sb.rpc("scout_requests");
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
  if(error){ console.error(key, error); if(key === "owner" || key === "scouts") return; /* not there until database update 016 is run */
    if(key === "sessions"){ S.sessionsMissing = true; render(); return; } /* not there until database update 018 is run */
    if(key === "reactions"){ S.reactionsMissing = true; render(); return; } /* not there until database update 022 is run */
    if(key === "opps"){ S.oppsMissing = true; render(); return; } /* not there until database update 024 is run */
    S.notice = "Some data couldn't load. Reload the page to try again."; render(); return; }
  if(key === "club" && fam){ const before = JSON.stringify(S.clubs); S.clubs = (Array.isArray(data) ? data : []).map(camel); S.club = null; S.clubLoaded = true; if(before !== JSON.stringify(S.clubs)) loadSteps(); }
  else if(key === "club"){ const before = S.club && S.club.familyAccess; S.club = data ? camel(data) : null; S.clubLoaded = true; if(S.club && before !== undefined && before !== S.club.familyAccess) loadSteps(); }
  else if(key === "messages" || key === "pmessages") S[key] = data.map(camel).reverse();
  else if(key === "links") S.links = data;
  else if(key === "shortlist") S.shortlist = (Array.isArray(data) ? data : []).map(camel);
  else if(key === "college") S.college = data ? camel(data) : null;
  else if(key === "pro"){ S.pro = data ? camel(data) : null; S.proLoaded = true; }
  else if(key === "owner") S.owner = (data || []).length > 0;
  else if(key === "scouts") S.scouts = (Array.isArray(data) ? data : []).map(camel);
  else if(key === "teamCoaches") S.teamCoaches = data || [];
  else { if(key === "sessions") S.sessionsMissing = false; if(key === "reactions") S.reactionsMissing = false; if(key === "opps") S.oppsMissing = false; S[key] = data.map(camel); }
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
  S.profiles = []; S.comments = []; S.messages = []; S.pmessages = []; S.reactions = []; S.reactFor = null; S.opps = []; S.meetings = []; S.teamCoaches = []; S.clubs = []; S.requests = []; S.interest = []; S.shortlist = []; S.scout = null; S.college = null; S.pro = null; S.proLoaded = false; S.scouts = []; S.owner = false; S.sessions = []; S.sessionsMissing = false; S.draft = null;
  if(!cid) return;
  ALL_KEYS.forEach(k => loadKey(k));
  channel = sb.channel("club-" + cid)
    .on("postgres_changes", {event:"*", schema:"public"}, payload => {
      const key = TABLE_TO_KEY[payload.table];
      if(payload.table === "members" || payload.table === "family_links") loadMe();
      if(payload.table === "family_links") schedule("members");
      /* a player joining or leaving a club changes what else is visible */
      if(payload.table === "players" || payload.table === "join_requests" || payload.table === "recruit_interest") ["club","teams","players","messages","members","drills","profiles","assignments","reviews","comments","requests","interest"].forEach(schedule);
      if(payload.table === "pro_scouts"){ schedule("pro"); schedule("scouts"); }
      schedule(key);
    })
    .subscribe();
}
const ALL_KEYS = ["club","teams","players","reviews","assignments","drills","links","members","profiles","comments","messages","pmessages","reactions","opps","meetings","teamCoaches","requests","interest","shortlist","college","pro","owner","scouts","sessions"];
function refreshAll(){ ALL_KEYS.forEach(schedule); }
function fixView(){
  const staffViews = ["roster","player","sessions","chat","messages","drills","recruit","plans","club"], famViews = ["home","chat","messages","drills","recruit","plans","account"];
  if(!S.me) { S.view = null; return; }
  if(isScout()){ if(!["scout","shortlist","account"].includes(S.view)) S.view = "scout"; return; }
  const ok = isStaff() ? staffViews : famViews;
  if(!ok.includes(S.view)) S.view = isStaff() ? "roster" : "home";
}

/* ---------- views ---------- */
/* NextPass wordmark (words only; the standalone mark lives in /brand) */
const logoHtml = () => `<img class="logo-mark" src="brand/mark.svg" alt="" width="36" height="36"><span class="wordmark" translate="no"><span class="wm-word">Next</span><span class="wm-word wm-pass">Pass</span></span>`;
const brandSvg = "";

/* the signed-in menu: plain links and dropdown groups ({g, l, items}) */
const curSec = () => SECTION_KEYS.includes(S.rsec) ? S.rsec : isStaff() ? "youth" : "college";
function navItems(){
  if(isScout()) return [{v:"scout", l:"Find players"}, {v:"shortlist", l:"Shortlist"}].concat(S.me && S.me.role === "college" ? [{v:"opps", l:"Opportunities"}] : []).concat([{v:"account", l:"Account"}]);
  const un = totalUnread(), pmu = totalPmUnread() + totalMeetingRequests();
  const inbox = {g:"inbox", l:"Inbox", n:un + pmu, items:[{v:"chat", l:"Team Chat", n:un}, {v:"messages", l:"Messages", n:pmu}]};
  const recruit = {g:"recruit", l:"Recruiting", n:newInterest().length, items:[["pro","Pro"],["college","College"],["youth","Youth"]].map(([k,l]) => ({v:"recruit", sec:k, l, n:newInterest(k).length})).concat([{v:"opps", l:"Opportunities"}])};
  if(isStaff()){
    const all = S.teams.slice().sort((a,b) => String(a.name).localeCompare(String(b.name)));
    const coached = myCoachTeamIds(), mine = all.filter(t => coached.includes(t.id));
    const list = !isAdmin() && mine.length ? mine : all;
    const req = pendingRequests().length;
    /* the club's own name heads the menu: Club, My Teams and each team */
    const ps = pendingScouts().length;
    const club = {g:"club", l:S.club.name, brand:true, n:req + ps, items:[{v:"club", l:"Club", n:ps}, {v:"roster", team:"all", l:"My Teams", n:req}]
      .concat(list.map(t => ({v:"roster", team:t.id, l:t.name, sub:true})))};
    return [club, {g:"training", l:"Training", items:[{v:"sessions", l:"Team Drills"}, {v:"drills", l:"Home Drills"}]}, inbox, recruit, {v:"plans", l:"Pricing"}];
  }
  /* families: Recruiting is one page, with a "what are you looking for" filter on it */
  return [{v:"home", l:"My player"}, {v:"drills", l:"Home Drills"}, inbox, {v:"recruit", l:"Recruiting", n:newInterest().length}, {v:"plans", l:"Pricing"}, {v:"account", l:"Account", n:pendingScouts().length}];
}
function navCurrent(it){
  if(S.publicPage) return false;
  if(it.team) return (S.view === "roster" || S.view === "player") && (S.teamFilter || "all") === it.team;
  if(it.sec) return S.view === "recruit" && curSec() === it.sec;
  return S.view === it.v;
}
const navBadge = (n, label) => n ? `<span class="badge" aria-label="${n} ${label || "new"}">${n > 99 ? "99+" : n}</span>` : "";
function navBtn(it){
  return `<button data-act="go" data-view="${it.v}"${it.sub ? ` class="dd-sub" translate="no"` : ""}${it.team ? ` data-team="${esc(it.team)}"` : ""}${it.sec ? ` data-sec="${it.sec}"` : ""} ${navCurrent(it) ? 'aria-current="page"' : ""}>${esc(it.l)}${navBadge(it.n)}</button>`;
}
function navGroup(gr){
  const open = S.navOpen === gr.g, cur = gr.items.some(navCurrent);
  return `<div class="nav-dd${open ? " open" : ""}">
    <button type="button" class="nav-dd-btn${cur ? " cur" : ""}" data-act="navDd" data-g="${gr.g}" aria-expanded="${open}" aria-controls="dd-${gr.g}"${gr.brand ? ` title="${esc(gr.l)}"` : ""}>${gr.brand ? `<span class="dd-club" translate="no">${esc(gr.l)}</span>` : esc(gr.l)}${open ? "" : navBadge(gr.n)}<span class="dd-chev" aria-hidden="true"></span></button>
    <div class="nav-dd-menu" id="dd-${gr.g}" ${open ? "" : "hidden"}>${gr.items.map(navBtn).join("")}</div>
  </div>`;
}
function topbar(){
  let tabs = "";
  if(S.me && (S.club || !isStaff())){
    const items = navItems();
    const allUnread = totalUnread() + totalPmUnread() + totalMeetingRequests();
    tabs = `${bellHtml()}<button type="button" class="menu-btn app-menu-btn" data-act="menu" aria-expanded="${!!S.menuOpen}" aria-controls="app-nav">${S.menuOpen ? "Close" : "Menu"}${!S.menuOpen && allUnread ? `<span class="badge">${allUnread>99?"99+":allUnread}</span>` : ""}</button>
    <nav id="app-nav" class="tabs app-tabs${S.menuOpen ? " open" : ""}${S.navQuiet ? " dd-quiet" : ""}" aria-label="Main">${items.map(it => it.g ? navGroup(it) : navBtn(it)).join("")}<a href="#contact" class="signout-link" ${S.publicPage==="contact"?'aria-current="page"':""}>Contact</a>${langToggle("nav-lang")}<button class="signout-link" data-act="signOut">Sign out</button></nav>`;
  }
  return `<header class="top"><div class="top-in">
    <a href="#" class="brand" data-act="home" aria-label="${APP_NAME} home">${logoHtml()}</a>

    ${!S.uid && !S.noConfig ? publicNav() : (tabs || (S.uid ? `<nav class="tabs"><a href="#contact" class="signout-link">Contact</a>${langToggle("nav-lang")}<button class="signout-link" data-act="signOut">Sign out</button></nav>` : ""))}
  </div></header>`;
}
function render(){
  if(S.me && !S.loading) setTimeout(checkNotices, 0);
  if(S.invite && S.me && !S.loading && !S.inviteBusy) setTimeout(applyInvite, 0);
  const app = document.getElementById("app");
  let body;
  if(S.loading) body = `<div class="card"><p>Loading your club…</p>${S.notice?`<p class="muted small" style="margin-top:8px">${esc(S.notice)}</p>`:""}</div>`;
  else if(S.noConfig) body = setupView();
  else if(S.publicSlug) body = publicView();
  else if(S.publicPage && !(S.uid && S.loading)) body = publicPage();
  else if(S.recovery && S.uid) body = newPasswordView();
  else if(!S.uid) body = authView();
  else if(S.me === null) body = onboarding();
  else if(S.me && isScout()) body = scoutBody();
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
  app.innerHTML = `<a class="skip" href="#main-content" data-act="skipMain">Skip to content</a>` + topbar() + `<main id="main-content" tabindex="-1">${banners}${body}</main>` + (!S.uid || S.publicPage ? siteFooter() : "");
  setTitle();
  animScan(app);
  introMount(app);
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
      case "sessions": return sessionsView();
      case "plans": return plansView();
      case "club": return clubView();
      case "recruit": return staffRecruit();
      case "opps": return oppsView();
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
    case "opps": return oppsView();
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
  if(portal === "pro") return `<section class="hero">
    <div class="stack">
      <span class="pill plain" style="align-self:flex-start">Pro scout</span>
      <h1>Tell us who you scout for</h1>
      <p style="max-width:52ch">${APP_NAME} approves every pro scout by hand before they can see any players. Tell us where you work and we'll check it. Pro recruiting on ${APP_NAME} is free.</p>
      <button type="button" class="btn ghost sm" data-act="setPortal" data-id="" style="align-self:flex-start">I'm not a pro scout</button>
    </div>
    <div class="stack"><form class="card stack auth-coach" data-form="proStart"><h2>Your details</h2>${proFields({})}
      <p class="small muted">You're signed in as <b>${esc(S.email || "")}</b>. A club or agency email address makes approval quicker.</p>
      <div><button class="btn primary" type="submit">Ask for access</button></div></form></div>
  </section>`;
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
      ${S.invite && S.invite.kind === "coach" ? inviteBanner() + joinCoachForm() : ""}
      <form class="card stack" data-form="createClub">
        <h2>Start a club</h2>
        <p class="small muted">For club directors setting up ${APP_NAME} for the first time.</p>
        <label class="f" for="cc-name">Your name<input type="text" id="cc-name" name="name" required maxlength="60" autocomplete="name"></label>
        <label class="f" for="cc-club">Club or team name<input type="text" id="cc-club" name="club" required maxlength="80"></label>
        <div><button class="btn primary" type="submit">Create club</button></div>
      </form>
      ${S.invite && S.invite.kind === "coach" ? "" : joinCoachForm()}
      <div>${switcher}</div>
    </div>
  </section>`;
}

function joinCoachForm(){
  const code = S.invite && S.invite.kind === "coach" ? S.invite.code : "";
  return `<form class="card stack" data-form="joinCoach">
        <h2>Join your club</h2>
        <label class="f" for="jc-name">Your name<input type="text" id="jc-name" name="name" required maxlength="60" autocomplete="name"></label>
        <label class="f" for="jc-code">Club code<input type="text" id="jc-code" name="code" required maxlength="12" placeholder="6-letter code" autocapitalize="characters" value="${esc(code)}"></label>
        <div><button class="btn primary" type="submit">Join club</button></div>
      </form>`;
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
  <p class="college-link">College coach? <button type="button" class="linkbtn" data-act="${act}" data-id="college">Find players aged ${RECRUIT_AGE}+, free →</button>
    <span class="sep" aria-hidden="true"> · </span>Pro scout? <button type="button" class="linkbtn" data-act="${act}" data-id="pro">Ask for a scout account →</button></p>`;
}

/* roster */
/* invite box: club code, then links ready to copy and paste */
function inviteCard(team){
  if(!isStaff() || !S.club) return "";
  const teams = S.teams.slice().sort((a,b) => String(a.name).localeCompare(String(b.name)));
  const ft = team || teams.find(t => t.id === S.invTeam) || teams[0];
  const linkRow = (id, label, url, extra) => `<div class="invite-row"><label class="f" for="${id}">${label}${extra || ""}<input type="text" readonly id="${id}" value="${esc(url)}" data-select-all aria-describedby="${id}-h"></label><button type="button" class="btn sm primary" data-act="copyField" data-for="${id}" data-label="${esc(label)}">Copy link</button></div>`;
  return `<section class="card invite-box" aria-labelledby="inv-h">
    <div class="row between"><h2 id="inv-h" class="h3" style="margin:0">Invite people</h2>
      <div class="invite-code small">Club code <b class="code">${esc(S.club.code)}</b><button type="button" class="btn ghost sm" data-act="copy" data-text="${esc(S.club.code)}">Copy code</button></div></div>
    ${linkRow("inv-coach", "Coach invite link", coachInviteUrl())}
    <p class="small muted" id="inv-coach-h" style="margin:-6px 0 0">Coaches who open it sign up with the club code already filled in.</p>
    ${ft ? `${linkRow("inv-fam", team ? `Family invite link for ${esc(team.name)}` : "Family invite link", teamInviteUrl(ft), !team && teams.length > 1 ? `<select class="inv-team" aria-label="Team for the family invite link" data-change="invTeam">${teams.map(t => `<option value="${esc(t.id)}" ${t.id === ft.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>` : !team ? ` (${esc(ft.name)})` : "")}
    <p class="small muted" id="inv-fam-h" style="margin:-6px 0 0">Families who open it sign up with ${esc(ft.name)} already picked. You approve each request here.</p>`
      : `<p class="small muted">Add a team to get a family invite link.</p>`}
  </section>`;
}
/* a short checklist for new clubs; it goes away once everything is done or the coach hides it */
function setupFamBtn(){
  const t = S.teams.find(x => x.id === S.teamFilter) || S.teams.slice().sort((a,b) => String(a.name).localeCompare(String(b.name)))[0];
  return t ? `<button class="btn sm" data-act="copy" data-text="${esc(teamInviteUrl(t))}" data-label="Family invite link for ${esc(t.name)}">Copy link for ${esc(t.name)}</button>` : `<span class="small muted">Add a team first</span>`;
}
function setupCard(){
  if(!isStaff() || !S.club) return "";
  const key = "np-setup-hidden-" + S.club.id; let hidden = false; try { hidden = localStorage.getItem(key) === "1"; } catch(_){}
  const steps = [
    [S.teams.length > 0, "Add your teams", "One for each team, training group or camp.", `<button class="btn sm" data-act="modal" data-m="team">Add a team</button>`],
    [S.players.length > 0, "Get families to join", `Send each team's family invite link. Families sign up with the team already picked, and you approve them here.`, setupFamBtn()],
    [S.reviews.length > 0, "Write your first review", "Open a player, rate each skill from 1 to 5 and add a short note.", ""],
    [S.assignments.length > 0, "Assign a home drill", "Pick from the drill library, or use the drills suggested after a review.", `<button class="btn sm" data-act="go" data-view="drills">Open the drill library</button>`]];
  const done = steps.filter(x => x[0]).length;
  if(done === steps.length) return "";
  const bar = `<div class="setup-bar" role="progressbar" aria-label="Club setup" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${done}"><i style="width:${done / steps.length * 100}%"></i></div>`;
  if(hidden) return `<section class="card setup-card setup-mini" aria-labelledby="setup-h">
    <div class="row between"><div class="stack" style="gap:6px;flex:1;min-width:180px"><h2 id="setup-h" class="h3">Get your club set up <span class="small muted">· ${done} of ${steps.length} done</span></h2>${bar}</div>
      <button type="button" class="btn sm" data-act="showSetup" aria-expanded="false">Show steps</button></div></section>`;
  return `<section class="card stack setup-card" aria-labelledby="setup-h">
    <div class="row between"><div class="stack" style="gap:2px"><h2 id="setup-h">Get your club set up</h2><p class="small muted">${done} of ${steps.length} done</p></div>
      <button type="button" class="btn ghost sm" data-act="hideSetup" aria-expanded="true">Hide steps</button></div>
    <div class="setup-bar" role="progressbar" aria-label="Club setup" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${done}"><i style="width:${done / steps.length * 100}%"></i></div>
    <ol class="setup-list">${steps.map(([ok, t, x, btn], i) => `<li class="${ok ? "done" : ""}"><span class="tick" aria-hidden="true">${ok ? "✓" : i + 1}</span>
      <span class="what"><b>${t}</b><span class="sr-only">${ok ? " (done)" : " (to do)"}</span><br><span class="small muted">${x}</span></span>${ok ? "" : btn}</li>`).join("")}</ol>
  </section>`;
}
function rosterView(){
  if(S.teamFilter !== "all" && !S.teams.some(t => t.id === S.teamFilter)) S.teamFilter = "all";
  const team = S.teams.find(t => t.id === S.teamFilter);
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
    <div class="stack" style="gap:4px"><h1>${team ? esc(team.name) : "All teams"}</h1>${team ? `<p class="muted small">${players.length} player${players.length===1?"":"s"}${team.ageGroup ? " · " + esc(team.ageGroup) : ""}</p>` : ""}</div>
    <div class="row"><button class="btn" data-act="modal" data-m="team">Add team</button></div>
  </div>
  ${setupCard()}
  ${requestsCard()}
  ${inviteCard(team)}
  <div class="grid3">
    <div class="card tile"><div class="big num">${S.players.length}</div><div class="lbl">Players in ${esc(S.club.name)}</div></div>
    <div class="card tile"><div class="big num" style="color:${due?"var(--warn)":"var(--good)"}">${due}</div><div class="lbl">Need a review (none in 30 days)</div></div>
    <div class="card tile"><div class="big num">${target?Math.round(done/target*100)+"%":"–"}</div><div class="lbl">Home drills done this week${target?` (${done} of ${target})`:""}</div></div>
  </div>
  <div class="card stack">
    ${players.length ? `<div class="tbl-wrap"><table>
      <thead><tr><th>Player</th><th>Team</th><th>Overall</th><th>Last review</th><th>Home drills this week</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`
      : team ? `<p class="muted">No players on ${esc(team.name)} yet.</p>` : `<div class="locked"><h2 class="h3">No players yet</h2><p class="muted">${S.teams.length ? `Families find ${esc(S.club.name)} by name in ${APP_NAME} and ask to join a team. Their requests show up here for you to approve.` : `Add your teams first. Families then find ${esc(S.club.name)} by name and ask to join one.`}</p>${S.teams.length ? "" : `<button class="btn primary" data-act="modal" data-m="team">Add team</button>`}</div>`}
  </div>`;
}

function deltaHtml(d){
  if(Math.abs(d) < 0.05) return "";
  return d > 0 ? `<span class="delta up" aria-label="up ${fix1(d)}">▲ ${fix1(d)}</span>` : `<span class="delta down" aria-label="down ${fix1(-d)}">▼ ${fix1(-d)}</span>`;
}

function ratingsHtml(last, prev, p){
  if(!last) return `<p class="muted">No review yet.</p>`;
  const form = reviewForm(last);
  let html = `<div class="row" style="gap:6px"><span class="pill ${form==="gk"?"warn":"plain"}">${formLabel(form)}</span>${baselinePill(last, p)}</div>`, g = "";
  for(const s of skillsFor(form)){
    if(s.group !== g){ g = s.group; html += `<div class="rgroup">${g}</div>`; }
    const v = Number(last.ratings[s.k]) || 0, pvRaw = prev && prev.ratings ? Number(prev.ratings[s.k]) : NaN;
    const pv = pvRaw >= 1 && pvRaw <= 5 ? pvRaw : null;
    html += `<div class="rate${v ? "" : " unrated"}"><span>${s.label}</span><div class="bar" role="img" aria-label="${v ? v + " out of 5, " + esc(SCALE[v]) : "not rated in this review"}"><i style="width:${v*20}%"></i></div><span class="num" title="${esc(SCALE[v]||"")}"><span class="score">${v||"–"}</span>${pv!=null && v && v!==pv ? " "+deltaHtml(v-pv) : ""}</span></div>`;
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
  const W=560,H=224,L=34,R=24,T=30,B=30, iw=W-L-R, ih=H-T-B;
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
      <text x="${x(pts.length-1)}" y="${y(last.v)-12}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">${fix1(last.v)}</text>
    </svg></div></div>`;
}

function stepsLocked(){ return !S.uid || (!isStaff() && !familyHasHome()); }
/* drill videos are part of Home Training: a slim locked bar instead of the animation */
function animLockedHtml(){
  const go = S.uid ? `<button type="button" class="btn sm" data-act="go" data-view="plans">See Home Training</button>` : `<a class="btn sm" href="#pricing">See Home Training</a>`;
  return `<div class="anim-locked"><span class="al-play" aria-hidden="true">▶</span><span class="al-txt">🔒 The animated demo comes with Home Training</span>${go}</div>`;
}
/* full instructions: inline for free samples and club drills, otherwise from drill_steps (Home Training) */
function drillInfo(d){
  if(d.steps && d.steps.length) return {steps:d.steps, setup:d.setup || "", reps:d.reps || "", points:d.points || [], easier:d.easier || "", harder:d.harder || ""};
  const r = (S.drillSteps || {})[d.id];
  return r && (r.steps || []).length ? r : null;
}
function stepsFor(d){ const i = drillInfo(d); return i ? i.steps : null; }
function drillStepsHtml(d, opts){
  const st = drillInfo(d);
  if(st) return `<details class="drill-how" ${opts.open?"open":""}><summary>How to do it</summary>
    ${st.setup ? `<p class="dh-row"><b>Set up</b> ${esc(st.setup)}</p>` : ""}
    <ol>${st.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
    ${st.reps ? `<p class="dh-row"><b>Sets & reps</b> ${esc(st.reps)}</p>` : ""}
    ${(st.points || []).length ? `<div class="dh-points"><b>Coaching points</b><ul>${st.points.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${st.easier || st.harder ? `<div class="dh-adjust">${st.easier ? `<p><span class="pill plain">Easier</span> ${esc(st.easier)}</p>` : ""}${st.harder ? `<p><span class="pill warn">Harder</span> ${esc(st.harder)}</p>` : ""}</div>` : ""}
  </details>`;
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
    ${hasAnim(d.id) ? (stepsLocked() ? animLockedHtml() : animSvg(d.id, d.title)) : ""}
    <div class="dmeta"><span>${esc(d.category)}</span><span>· ${esc(d.minutes)} min</span><span>· ${esc(d.equipment)}</span><span>· ${esc(levelOf(d))}</span></div>
    ${d.goal ? `<p class="dgoal">${esc(d.goal)}</p>` : ""}
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
      ${last.note?`<div class="note">${esc(last.note)}</div>`:""}
      ${reviewActions(last, {staff:!fam, discuss:!preview})}
      ${reviewHistoryHtml(rs, {staff:!fam, discuss:!preview, player:p})}`
      : `<p class="muted">${fam?"Your coach hasn't posted a review yet.":"No reviews yet. Start with a first review to set a baseline."}</p>`}
  </div>`;

  const ratingsCard = `<div class="card stack"><h2>Skill ratings</h2>${ratingsHtml(last, prev, p)}</div>`;

  let drillsCard;
  if(home){
    drillsCard = `<div class="card stack">
      <div class="row between"><h2>${fam ? "Home drills" : "Assign drills"}</h2>${!fam?`<button class="btn sm primary" data-act="modal" data-m="assign" data-player="${esc(p.id)}">Assign a drill</button>`:""}</div>
      ${as.length ? `<div class="stack">${as.map(a=>{const d=drillById(a.drillId)||{title:a.drillTitle||"Drill",category:"",minutes:"",equipment:"",level:"",steps:[]};return drillCard(d,{assignment:a,family:fam,staff:!fam,preview});}).join("")}</div>`
        : `<p class="muted">${fam?"No drills assigned yet. Browse the library under Home Drills.":"No drills assigned yet. Pick one for home practice, or use the suggestions below."}</p>`}
    </div>`;
  } else {
    drillsCard = `<div class="locked"><h2>Home Training</h2><p>Get the drills your coach picks for you, the full drill library and progress charts over time.</p><button class="btn primary" data-act="go" data-view="plans">See Home Training plan</button></div>`;
  }

  const progressCard = home ? `<div class="card stack"><h2>Progress over time</h2>${progressSummary(rs)}${chartHtml(rs)}</div>`
    : rs.length > 1 ? `<div class="locked"><h2>Progress over time</h2><p>See a chart of every skill over time and what improved most since the first review with Home Training.</p><button class="btn primary" data-act="go" data-view="plans">See Home Training plan</button></div>` : "";
  const historyCard = "";

  return `<div class="grid2">
    <div class="stack" style="gap:20px">${reviewCard}${drillsCard}${recommendCard(p, {staff:!fam, family:fam, preview, locked: fam && !home, title: fam ? "Recommended for you" : "Suggested home drills"})}</div>
    <div class="stack" style="gap:20px">${ratingsCard}${progressCard}${historyCard}</div>
  </div>`;
}

function playerView(){
  const p = S.players.find(x => x.id === S.playerId);
  if(!p) return `<button class="btn ghost back" data-act="go" data-view="roster">← All players</button><div class="card"><p>This player was removed.</p></div>`;
  const st = reviewStatus(p.id);
  const backTeam = S.teams.find(t => t.id === S.teamFilter);
  return `<button class="btn ghost back" data-act="go" data-view="roster">← ${backTeam ? esc(backTeam.name) : "All teams"}</button>
  <div class="card"><div class="row between">
    <div class="phead"><div class="avatar">${esc(initials(p.name))}</div>
      <div class="stack" style="gap:2px"><h1>${esc(p.name)}</h1><p class="muted">${[posText(p), teamName(p.teamId), playerAge(p) != null ? "Age " + playerAge(p) : ""].filter(Boolean).map(esc).join(" · ")}</p>
      <p class="small"><span class="pill ${st.cls}">${st.txt}</span></p></div></div>
    <div class="row">
      ${canMessage(p) ? `<button class="btn" data-act="messageFamily" data-id="${esc(p.id)}">Message family</button>` : ""}
      <button class="btn" data-act="modal" data-m="editPlayer" data-player="${esc(p.id)}">Edit</button>
      <button class="btn primary" data-act="modal" data-m="review" data-player="${esc(p.id)}">${reviewsFor(p.id).length ? "Update review" : "First review"}</button>
    </div>
  </div></div>
  ${subtabs()}
  ${S.preview ? `<div class="banner">Family preview: this is what ${esc(p.name)}'s family sees.${S.club.familyAccess==="subscribe" && S.ptab==="dev"?" Home drills show as locked until the family starts Home Training.":""}</div>` : ""}
  ${S.ptab === "profile" ? profileHtml(p, {staff:!S.preview}) : S.ptab === "recruit" ? recruitHtml(p, {staff:!S.preview, section:S.recSec || undefined}) : playerDetail(p, S.preview ? "preview" : "staff")}`;
}

/* families: pick which of their players they're looking at */
function playerSelect(kids, p, withAdd){
  return `<label class="f player-select" for="sel-player">Select Player<select id="sel-player" data-change="childSel">${kids.map(k => `<option value="${esc(k.id)}" ${k.id === p.id ? "selected" : ""}>${esc(k.name)}</option>`).join("")}${withAdd ? `<option value="__add">+ Add another player</option>` : ""}</select></label>`;
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
    ${playerSelect(kids, p, true)}
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
/* current club: search NextPass, or name a club that isn't on it yet, or none */
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
      ${(() => { const iv = S.invite && S.invite.kind === "team" && S.invite.info ? S.invite.info : null;
        return `<input type="hidden" name="teamId" id="${px}-team" value="${iv ? esc(iv.team_id) : ""}">
      <p class="picked" id="${px}-picked" ${iv ? "" : "hidden"}>${iv ? `✓ <b>${esc(iv.team_name)}</b> at <b>${esc(iv.club_name)}</b> (from your invite link). The coach gets a request when you save.` : ""}</p>`; })()}
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
  if(mode === "search"){ try { await rpc("request_team", {pid, tid, p_note:""}); sent = true; if(S.invite && S.invite.kind === "team") saveInvite(null); } catch(e){ toast(errMsg(e), true); } }
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
      ${f.choose ? `<label class="f" for="rq-pid">Which player?<select id="rq-pid" name="pid">${f.choose.map(id => { const k = S.players.find(x => x.id === id); return k ? `<option value="${esc(id)}" ${id === f.pid ? "selected" : ""}>${esc(k.name)}</option>` : ""; }).join("")}</select></label>` : ""}
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
        ${ratingsHtml(last, prev, p)}
        ${last.note?`<div class="note">${esc(last.note)}</div>`:""}
        ${reviewHistoryHtml(rs, {player:p})}`
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
  const age = playerAge(p), adult = age != null && age >= RECRUIT_AGE;
  /* which recruiting section this view is for; coaches see the youth section for under-16s */
  const sec = SECTION_KEYS.includes(opts.section) ? opts.section : (!pub && staff && !adult ? "youth" : "college");
  const X = (sec === "college" ? R : R[sec]) || {}, who = SECTIONS[sec].who, Who = who[0].toUpperCase() + who.slice(1);
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
    ${!pub ? `<p class="small muted">References show on the Recruitment Profile, to the coaches and scouts the family shares it with. Comments stay between coaches and the family.</p>` : ""}
    ${comments.length ? comments.map(c=>`<div class="ref ${c.kind==="reference"?"reference":""}">
      <div class="row between"><span class="pill ${c.kind==="reference"?"good":"plain"}">${c.kind==="reference"?"Reference":"Comment"}</span><span class="small muted">${c.date?esc(fmtDate(c.date)):""}</span></div>
      <blockquote>${esc(c.text)}</blockquote>
      <div class="row between"><span class="small"><b>${esc(c.authorName||"Coach")}</b>${c.authorTitle?`, ${esc(c.authorTitle)}`:""}</span>${staff && c.authorId===S.uid?`<button class="btn ghost sm" data-act="delComment" data-id="${esc(c.id)}">Delete</button>`:""}</div>
    </div>`).join("") : empty(staff ? "No comments yet. A reference is what a scout or new coach would read." : pub ? "No references yet." : "No coach comments or references yet.")}
  </div>`;


  if(!pub && sec !== "youth" && !adult){
    const d16 = p.birthDate ? new Date(new Date(p.birthDate + "T00:00:00").setFullYear(new Date(p.birthDate + "T00:00:00").getFullYear() + RECRUIT_AGE)) : null;
    const when = d16 ? d16.toLocaleDateString(LOC, {year:"numeric", month:"long", day:"numeric"}) : "";
    const msg = age == null ? (ed ? "Add the date of birth under Account → Edit first." : "The family hasn't added a date of birth yet.")
      : ed ? `${esc(p.name)} can be listed here from ${esc(when || "their 16th birthday")}. Until then, keep building the player profile and collecting coach references.`
      : `${esc(p.name)} turns ${RECRUIT_AGE} on ${esc(when || "their 16th birthday")}. References you write now will be ready for it.`;
    return `<div class="card stack recruit-intro"><h2>${SECTIONS[sec].label} recruiting opens at ${RECRUIT_AGE}</h2><p>${msg}</p>
      <p class="small muted">College and Pro recruiting on ${APP_NAME} are for players aged ${RECRUIT_AGE} and over.${ed ? ` The <button type="button" class="linkish" data-act="rsec" data-id="youth">Youth clubs section</button> is open at any age.` : ""}</p></div>${staff ? comCard : ""}`;
  }
  if(!R.created && !pub){
    const ticks = sec === "pro" ? ["Playing status, the levels you're aiming for and whether you're open to trials", "Nationality and representation, if you have an agent", "Height, weight, stronger foot and location"]
      : sec === "youth" ? ["What you're looking for: a new club, tryouts or guest playing", "The level you play at and the area you can travel in", "Birth year, positions and stronger foot"]
      : ["Class of, high school, GPA, SAT / ACT, intended major and NCAA Eligibility Center ID", "Club league, divisions you're interested in and commitment status", "Height, weight, stronger foot, location and a contact email for coaches"];
    if(ed) return `<div class="card stack recruit-intro">
      <h2>Create ${esc(p.name)}'s Recruitment Profile</h2>
      <p style="max-width:62ch">${sec === "youth" ? `One profile for club coaches looking for players. ${adult ? "" : "Under 16 there is no public link: only signed-in club coaches on " + APP_NAME + " can see it, and only while you keep youth club search on. "}It brings together:`
        : `One link for ${who}, and an opt-in listing in ${APP_NAME}'s ${sec === "pro" ? "pro scout" : "college coach"} search. It brings together:`}</p>
      <ul class="ticks">
        ${ticks.map(t => `<li>${t}</li>`).join("")}
        <li>Career highlights and season stats</li>
        <li>Highlight videos</li>
        <li>Club history</li>
        <li>References from your coaches</li>
      </ul>
      <p class="small muted">It starts private and unlisted, and the same profile is used in all three sections: you choose section by section who can find it. Coach reviews, ratings, home drills and messages are never shown on it.</p>
      <div><button class="btn primary" data-act="createRecruit" data-id="${esc(p.id)}">Create Recruitment Profile</button></div>
    </div>`;
    return `<div class="card stack"><h2>Recruitment Profile</h2><p class="muted">${esc(p.name)}'s family hasn't created a Recruitment Profile yet. References you write now will show on it once they do.</p></div>${comCard}`;
  }

  const by = p.birthDate ? String(p.birthDate).slice(0, 4) : p.birthYear ? String(p.birthYear) : "";
  const facts = (sec === "pro" ? [["Status", X.status], ["Nationality", X.nationality], ["Representation", X.agent], ["Height", R.height], ["Weight", R.weight], ["Stronger foot", pr.foot], ["Location", R.location], ["Club league", R.league], ["Will relocate", X.relocate ? "Yes" : ""]]
    : sec === "youth" ? [["Birth year", by], ["Area", X.area], ["Can travel", X.travel], ["Available", X.available], ["Stronger foot", pr.foot], ["Height", R.height]]
    : [["Class of", R.gradYear], ["GPA", R.gpa], ["SAT / ACT", R.test], ["High school", R.school], ["Club league", R.league], ["Height", R.height], ["Weight", R.weight],
       ["Stronger foot", pr.foot], ["Location", R.location], ["Intended major", R.major], ["NCAA ID", R.ncaaId]]).filter(x => x[1]);
  const secChips = sec === "pro" ? `${X.status ? `<span class="chip ${X.status === "Under contract" ? "str" : "open-badge"}">${esc(X.status)}</span>` : ""}${(X.levels || []).map(d => `<span class="chip">${esc(d)}</span>`).join("")}${X.trials ? `<span class="chip">Open to trials</span>` : ""}`
    : sec === "youth" ? `${(X.looking || []).map(d => `<span class="chip open-badge">${esc(d)}</span>`).join("")}${(X.levels || []).map(d => `<span class="chip">${esc(d)}</span>`).join("")}`
    : `${R.committed ? `<span class="chip str">✅ Committed${R.committedTo ? " to " + esc(R.committedTo) : ""}</span>` : `<span class="chip open-badge">Uncommitted</span>`}${(R.divisions || []).map(d => `<span class="chip">${esc(d)}</span>`).join("")}`;
  const listed = !!X.searchable, needsPublic = sec !== "youth", isPub = visOf(pr) === "public";
  const status = !listed ? `${SECTIONS[sec].search} is off. Turn it on under Edit ${SECTIONS[sec].label.toLowerCase()} details so ${who} can find ${esc(p.name)} and get in touch.`
    : needsPublic && !isPub ? `${SECTIONS[sec].search} is on, but the profile is Private, so ${who} can't find it yet.`
    : `✓ ${Who} can find this profile in ${APP_NAME} search.${sec === "youth" && !adult ? " They see " + esc(shortName(p.name)) + ", not the full name." : ""}`;
  const head = `<div class="card pcard recruit-head">
    <div class="photo-wrap">${photoHtml(pr, p)}</div>
    <div class="stack">
      <div class="row between">
        <div class="stack" style="gap:2px"><span class="eyebrow">Recruitment Profile${pub ? "" : " · " + SECTIONS[sec].label}</span><h1>${esc(p.name)}</h1>
          <p class="muted">${[sec === "college" && R.gradYear ? "Class of " + R.gradYear : "", clubName, p.teamId && p.clubId && !pub ? teamName(p.teamId) : "", age != null ? "Age " + age : ""].filter(Boolean).map(esc).join(" · ")}</p></div>
        ${pub ? "" : !adult ? `<div class="vis"><span class="pill plain" title="Public links start at ${RECRUIT_AGE}">🔒 No public link under ${RECRUIT_AGE}</span></div>` : ed ? visSwitch(p, pr) : `<div class="vis"><span class="pill ${VIS[visOf(pr)].cls}">${VIS[visOf(pr)].icon} ${VIS[visOf(pr)].label}</span></div>`}
      </div>
      <div class="chips">${positions.map((k,i) => posChip(k, i===0)).join("")}${secChips}</div>
      ${sec === "college" && R.colleges ? `<p class="small"><b>Interested in:</b> ${esc(R.colleges)}</p>` : ""}
      ${sec === "youth" && X.currentLevel ? `<p class="small"><b>Plays now:</b> ${esc(X.currentLevel)}</p>` : ""}
      ${ed ? `<p class="small listing-status ${listed && (!needsPublic || isPub) ? "on" : "muted"}">${status}</p>` : ""}
      ${facts.length ? `<div class="facts">${facts.map(([k,v]) => `<div class="fact"><span class="small muted">${k}</span><b>${esc(v)}</b></div>`).join("")}</div>` : ed ? `<p class="small muted">Add the details ${who} look for under Edit ${SECTIONS[sec].label.toLowerCase()} details.</p>` : ""}
      ${R.summary || pr.bio ? `<p style="max-width:65ch">${esc(R.summary || pr.bio)}</p>` : ""}
      ${strengths.length ? `<div class="chips">${strengths.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
      ${R.contact && (pub || sec !== "youth") ? `<p class="small">📧 Coaches can contact the family at <a href="mailto:${esc(R.contact)}">${esc(R.contact)}</a></p>` : ""}
      ${ed ? `<div class="row"><button class="btn" data-act="modal" data-m="${sec === "pro" ? "proDetails" : sec === "youth" ? "youthDetails" : "recruitDetails"}" data-player="${esc(p.id)}">Edit ${SECTIONS[sec].label.toLowerCase()} details</button>${adult && pr.slug ? `<button class="btn ghost sm" data-act="copy" data-text="${esc(APP_URL + "#profile-" + pr.slug)}">Copy profile link</button><a class="btn ghost sm" href="#profile-${esc(pr.slug)}" data-act="previewPublic" data-slug="${esc(pr.slug)}">See what coaches see</a>` : ""}</div>
        <p class="small muted">Photo, positions, strengths and the short bio come from the player profile. Videos, highlights, stats, club history and references below are shared by all three sections.</p>` : ""}
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

/* ---------- finding players: college coaches, pro scouts and club coaches (youth) ---------- */
const SL_STATUS = [["watching","Watching"],["contacted","Contacted"],["evaluating","Evaluating"],["offered","Offered"],["committed","Committed"],["passed","Passed"]];
const SCOUT_COPY = {
  college:{intro:`Players aged ${RECRUIT_AGE}+ whose families made their Recruitment Profile public and opted in to college coach search.`, q:"Name, high school, major…",
    none:`Try fewer filters. Players appear once they're ${RECRUIT_AGE} or older and their family makes the Recruitment Profile public and opts in to college coach search.`,
    private:"Your private list. Other coaches, even at your school, don't see it.", hidden:"The family has stopped sharing this profile with college coaches, so details are hidden.",
    msg:"Introduce yourself and your program, what you liked in the profile, and next steps such as an ID camp, a visit or a call.", sent:"Message sent. The family will reply to your school email.",
    note:"e.g. Watched at the ECNL showcase; strong in the air"},
  pro:{intro:`Players aged ${RECRUIT_AGE}+ whose families made their Recruitment Profile public and opted in to pro scout search.`, q:"Name, nationality, keywords…",
    none:`Try fewer filters. Players appear once they're ${RECRUIT_AGE} or older and their family makes the Recruitment Profile public and opts in to pro scout search.`,
    private:"Your private list. Nobody else sees it.", hidden:"The family has stopped sharing this profile with pro scouts, so details are hidden.",
    msg:"Introduce yourself and your club or organization, what you liked in the profile, and the next step you're offering, such as a trial or a call with the family.", sent:"Message sent. The family will reply to your email.",
    note:"e.g. Watched at regionals; invite to the March trial"},
  youth:{intro:"Players of any age whose parents opted in to youth club search. Under-16s are shown by first name and last initial, and players already at your club aren't listed.", q:"First name or keywords…",
    none:"Try fewer filters. Players appear once a parent creates a Recruitment Profile and turns on youth club search.",
    private:"Your private list. Other coaches, even at your club, don't see it.", hidden:"The family has stopped sharing this profile with club coaches, so details are hidden.",
    msg:"Introduce yourself, your club and team, and the next step you're offering, such as a tryout date, a training session to join or a guest spot.", sent:"Message sent. The family will reply to your email.",
    note:"e.g. Saw at the spring tournament; invite to U13 tryouts"}};
function scoutBody(){
  if(isCollege() && !S.college && !S.collegeLoaded){ S.collegeLoaded = true; schedule("college"); }
  if(isPro()){
    if(!S.pro) return S.proLoaded ? proMissing() : `<div class="card"><p>Loading your account…</p></div>`;
    if(S.view === "account") return proAccount();
    if(S.pro.status !== "approved") return proPending();
  }
  if(S.view === "shortlist") return shortlistHtml();
  if(S.view === "account") return collegeAccount();
  if(S.view === "opps") return oppsView();
  return scoutView();
}
function proMissing(){ return `<div class="card stack"><h2>Your scout details can't be found</h2><p class="muted">Sign out and back in. If that doesn't help, contact us.</p><div><button class="btn" data-act="signOut">Sign out</button></div></div>`; }
function proPending(){
  const s = S.pro, dec = s.status === "declined";
  return `<div class="card stack" style="max-width:640px">
    <span class="pill ${dec ? "bad" : "warn"}" style="align-self:flex-start">${dec ? "Not approved" : "Waiting for approval"}</span>
    <h1>${dec ? "Your scout account wasn't approved" : "Thanks, " + esc(s.name.split(" ")[0] || "scout") + ". We're checking your details"}</h1>
    <p>${dec ? `We couldn't confirm your role at <b>${esc(s.org)}</b>. If something on your account is wrong, fix it under Account and it goes back for another look.`
      : `${APP_NAME} approves every pro scout by hand before they can see players, because the players listed are 16 and 17 as well as adults. We'll check your role at <b>${esc(s.org)}</b> and may email you at <b>${esc(s.email)}</b>.`}</p>
    <p class="small muted">Until then you can't search for players or message families. This page updates by itself once you're approved.</p>
    <div class="row"><button class="btn" data-act="go" data-view="account">Check my details</button><a class="btn ghost" href="#contact">Contact us</a></div>
  </div>`;
}
function markScout(pid, ch){ if(S.scout && S.scout.res){ S.scout.res = S.scout.res.map(r => r.playerId === pid ? {...r, ...ch} : r); render(); } }
async function runScout(){
  const f = (S.scout && S.scout.f) || {}, sec = mySection();
  S.scout = {...(S.scout || {}), f, loading:true}; render();
  try {
    const pos = f.pos ? [f.pos] : [];
    const data = sec === "pro" ? await rpc("search_pro", {q:f.q || "", p_positions:pos, age_min:f.amin ?? null, age_max:f.amax ?? null, p_foot:f.foot || "", p_status:f.status || "", p_level:f.level || "", p_location:f.loc || "", video_only:!!f.video})
      : sec === "youth" ? await rpc("search_youth", {q:f.q || "", p_positions:pos, p_birth_year:f.by ?? null, p_level:f.level || "", p_looking:f.looking || "", p_location:f.loc || "", video_only:!!f.video})
      : await rpc("search_recruits", {q:f.q || "", p_positions:pos, grad:f.grad ?? null, gpa_min:f.gpa ?? null,
          p_division:f.div || "", p_league:f.league || "", p_foot:f.foot || "", p_location:f.loc || "", uncommitted_only:!!f.uncommitted, video_only:!!f.video});
    S.scout = {...S.scout, res:(data || []).filter(Boolean).map(camel), loading:false, error:false};
  } catch(e){ console.error(e); S.scout = {...S.scout, res:[], loading:false, error:true}; }
  render();
}
function scoutPhoto(r){ return r.photo ? `<img class="photo" src="${esc(blobUrl(r.photo))}" alt="" data-initials="${esc(initials(r.name))}">` : `<div class="photo ph" aria-hidden="true">${esc(initials(r.name || "?"))}</div>`; }
/* the one-line facts and chips for a player, by section */
function scoutMeta(r, sec){
  const pro = r.pro || {}, yo = r.youth || {};
  if(sec === "pro") return [r.age != null ? "Age " + r.age : "", r.height || "", r.foot ? r.foot + " foot" : "", r.location || "", pro.nationality || ""].filter(Boolean);
  if(sec === "youth") return [r.birthYear ? "Born " + r.birthYear : "", yo.area || r.location || "", r.foot ? r.foot + " foot" : ""].filter(Boolean);
  return [r.gradYear ? "Class of " + r.gradYear : "", r.age != null ? "Age " + r.age : "", r.gpa ? "GPA " + r.gpa : "", r.location || ""].filter(Boolean);
}
function scoutChips(r, sec){
  const pro = r.pro || {}, yo = r.youth || {};
  const extra = sec === "pro" ? `${pro.status ? `<span class="chip ${pro.status === "Under contract" ? "str" : "open-badge"}">${esc(pro.status)}</span>` : ""}${(pro.levels || []).map(d => `<span class="chip">${esc(d)}</span>`).join("")}${pro.trials ? `<span class="chip">Open to trials</span>` : ""}`
    : sec === "youth" ? `${(yo.looking || []).map(d => `<span class="chip open-badge">${esc(d)}</span>`).join("")}${(yo.levels || []).map(d => `<span class="chip">${esc(d)}</span>`).join("")}`
    : `${r.committed ? `<span class="chip str">✅ Committed${r.committedTo ? " to " + esc(r.committedTo) : ""}</span>` : `<span class="chip open-badge">Uncommitted</span>`}${(r.divisions || []).map(d => `<span class="chip">${esc(d)}</span>`).join("")}`;
  return `${(r.positions || []).slice(0,4).map((k,i) => posChip(k, i===0)).join("")}${extra}${r.videos ? `<span class="chip">🎥 ${r.videos}</span>` : ""}${r.highlights ? `<span class="chip">🏆 ${r.highlights}</span>` : ""}`;
}
const viewBtn = (r, sec) => sec === "youth" ? `<button class="btn sm" data-act="youthOpen" data-player="${esc(r.playerId)}">View profile</button>` : r.slug ? `<a class="btn sm" href="#profile-${esc(r.slug)}">View profile</a>` : "";
function scoutCard(r){
  const sec = mySection();
  return `<div class="card scout-card">
    <div class="scout-top">${scoutPhoto(r)}
      <div class="stack" style="gap:2px;min-width:0"><b class="scout-name">${esc(r.name)}</b>
        <span class="small muted">${scoutMeta(r, sec).map(esc).join(" · ")}</span>
        <span class="small">${esc([r.clubName, r.league].filter(Boolean).join(" · ") || "No current club")}</span></div></div>
    <div class="chips">${scoutChips(r, sec)}</div>
    ${r.summary ? `<p class="small">${esc(r.summary)}</p>` : ""}
    <div class="row scout-actions">
      ${viewBtn(r, sec)}
      ${r.shortlisted ? `<button class="btn ghost sm" data-act="${isStaff() ? "rview" : "go"}" data-view="shortlist" data-id="shortlist">★ Shortlisted</button>` : `<button class="btn sm" data-act="shortlistAdd" data-player="${esc(r.playerId)}">☆ Shortlist</button>`}
      ${r.contacted ? `<span class="pill good">Message sent</span>` : `<button class="btn primary sm" data-act="modal" data-m="interest" data-player="${esc(r.playerId)}">I'm interested</button>`}
    </div>
  </div>`;
}
function scoutFilters(f, sec){
  const y = new Date().getFullYear(), sel = (id, name, label, opts, cur, any) => `<label class="f" for="${id}">${label}<select id="${id}" name="${name}" data-autosubmit="1"><option value="">${any}</option>${opts.map(o => `<option ${cur===o?"selected":""}>${o}</option>`).join("")}</select></label>`;
  const foot = `<label class="f" for="sc-foot">Stronger foot<select id="sc-foot" name="foot" data-autosubmit="1">${[["","Any"],["Right","Right"],["Left","Left"],["Both","Both"]].map(([v,l]) => `<option value="${v}" ${f.foot===v?"selected":""}>${l}</option>`).join("")}</select></label>`;
  const mid = sec === "pro" ? `<div class="grid2" style="gap:10px">
      <label class="f" for="sc-amin">Min age<input type="number" id="sc-amin" name="amin" min="${RECRUIT_AGE}" max="40" value="${esc(f.amin ?? "")}" placeholder="${RECRUIT_AGE}"></label>
      <label class="f" for="sc-amax">Max age<input type="number" id="sc-amax" name="amax" min="${RECRUIT_AGE}" max="40" value="${esc(f.amax ?? "")}" placeholder="Any"></label>
    </div>${sel("sc-level", "level", "Interested in", PRO_LEVELS, f.level, "Any level")}${sel("sc-status", "status", "Status", PRO_STATUS, f.status, "Any status")}${foot}
    <label class="f" for="sc-loc">Location or nationality<input type="text" id="sc-loc" name="loc" maxlength="60" value="${esc(f.loc || "")}" placeholder="City, state or country"></label>`
    : sec === "youth" ? `<label class="f" for="sc-by">Birth year<input type="number" id="sc-by" name="by" min="${y - 19}" max="${y - 4}" value="${esc(f.by ?? "")}" placeholder="Any, e.g. ${y - 12}"></label>
    ${sel("sc-level", "level", "Level they play", YOUTH_LEVELS, f.level, "Any level")}${sel("sc-looking", "looking", "Looking for", YOUTH_LOOKING, f.looking, "Anything")}
    <label class="f" for="sc-loc">Area<input type="text" id="sc-loc" name="loc" maxlength="60" value="${esc(f.loc || "")}" placeholder="City or neighborhood"></label>`
    : `<div class="grid2" style="gap:10px">
      <label class="f" for="sc-grad">Class of<input type="number" id="sc-grad" name="grad" min="${y - 1}" max="${y + 4}" value="${esc(f.grad ?? "")}" placeholder="Any"></label>
      <label class="f" for="sc-gpa">Min GPA<input type="number" id="sc-gpa" name="gpa" min="0" max="5" step="0.1" value="${esc(f.gpa ?? "")}" placeholder="Any"></label>
    </div>${sel("sc-div", "div", "Interested in", DIVISIONS, f.div, "Any division")}${sel("sc-league", "league", "Club league", LEAGUES, f.league, "Any league")}${foot}
    <label class="f" for="sc-loc">Location<input type="text" id="sc-loc" name="loc" maxlength="60" value="${esc(f.loc || "")}" placeholder="City or state"></label>
    <label class="check" for="sc-unc"><input type="checkbox" id="sc-unc" name="uncommitted" data-autosubmit="1" ${f.uncommitted?"checked":""}> Uncommitted only</label>`;
  return `<form class="card scout-filters" data-form="scoutSearch">
    <label class="f" for="sc-q">Search<input type="search" id="sc-q" name="q" maxlength="60" value="${esc(f.q || "")}" placeholder="${SCOUT_COPY[sec].q}"></label>
    <label class="f" for="sc-pos">Position<select id="sc-pos" name="pos" data-autosubmit="1"><option value="">Any position</option>${FIELD_POSITIONS.map(([k,l]) => `<option value="${k}" ${f.pos===k?"selected":""}>${k} – ${l}</option>`).join("")}</select></label>
    ${mid}
    <label class="check" for="sc-video"><input type="checkbox" id="sc-video" name="video" data-autosubmit="1" ${f.video?"checked":""}> Has highlight video</label>
    <div class="row"><button class="btn primary" type="submit">Search</button>${Object.values(f).some(v => v !== "" && v != null && v !== false) ? `<button class="btn ghost sm" type="button" data-act="scoutClear">Clear filters</button>` : ""}</div>
  </form>`;
}
function scoutView(){
  if(!S.scout || (!S.scout.res && !S.scout.loading)) setTimeout(runScout, 0);
  const f = (S.scout && S.scout.f) || {}, sec = mySection(), c = S.college || {}, ps = S.pro || {};
  const who = sec === "college" ? [c.school, c.program, c.division].filter(Boolean).join(" · ") : sec === "pro" ? [ps.org, ps.orgType].filter(Boolean).join(" · ") : (S.club || {}).name || "";
  const head = `<div class="stack" style="gap:4px">${isStaff() ? "" : "<h1>Find players</h1>"}<p class="muted small${isStaff() ? " panel-note" : ""}">${who ? esc(who) + ". " : ""}${SCOUT_COPY[sec].intro}</p></div>`;
  const sc = S.scout || {};
  const results = sc.loading && !sc.res ? `<div class="card"><p class="muted">Searching…</p></div>`
    : sc.error ? `<div class="card stack"><p>Search didn't work. Try again in a moment.</p></div>`
    : !(sc.res || []).length ? `<div class="locked"><h2 class="h3">No players match</h2><p class="muted">${SCOUT_COPY[sec].none}</p></div>`
    : `<p class="small muted">${sc.res.length} player${sc.res.length===1?"":"s"}${sc.res.length >= 60 ? " (showing the 60 most recently updated; narrow your filters)" : ""}</p><div class="scout-grid">${sc.res.map(scoutCard).join("")}</div>`;
  return head + `<div class="scout-layout">${scoutFilters(f, sec)}<div class="stack" style="gap:12px">${results}</div></div>`;
}
function shortlistHtml(){
  const all = S.shortlist || [], sec = mySection(), staff = isStaff();
  const head = `<div class="stack" style="gap:4px">${staff ? "" : "<h1>Shortlist</h1>"}<p class="muted small">${SCOUT_COPY[sec].private}</p></div>`;
  if(!all.length) return head + `<div class="locked"><h2 class="h3">Your shortlist is empty</h2><p class="muted">Use ☆ Shortlist on any player in Find players.</p><button class="btn primary" data-act="${staff ? "rview" : "go"}" data-view="scout" data-id="find">Find players</button></div>`;
  const fl = S.slFilter || "all";
  const list = all.filter(x => fl === "all" || x.status === fl);
  const counts = Object.fromEntries(SL_STATUS.map(([k]) => [k, all.filter(x => x.status === k).length]));
  return head + `<div class="filters" role="group" aria-label="Filter by status"><button data-act="slFilter" data-id="all" aria-pressed="${fl==="all"}">All ${all.length}</button>${SL_STATUS.filter(([k]) => counts[k]).map(([k,l]) => `<button data-act="slFilter" data-id="${k}" aria-pressed="${fl===k}">${l} ${counts[k]}</button>`).join("")}</div>
  <div class="stack" style="gap:12px">${list.map(x => `<div class="card sl-item">
      <div class="scout-top">${scoutPhoto(x)}
        <div class="stack" style="gap:2px;min-width:0"><b class="scout-name">${esc(x.name)}</b>
          ${x.shared ? `<span class="small muted">${scoutMeta(x, sec).map(esc).join(" · ")}</span>
          <div class="chips">${(x.positions || []).slice(0,4).map((k,i) => posChip(k, i===0)).join("")}${x.committed ? `<span class="chip str">✅ Committed</span>` : ""}</div>`
          : `<span class="small muted">${SCOUT_COPY[sec].hidden}</span>`}
          <span class="small muted">Added ${esc(relDays(new Date(x.createdAt).toLocaleDateString("en-CA")).toLowerCase())}${x.contacted ? " · You sent a message" : ""}</span>
        </div>
        <div class="row" style="margin-left:auto;align-self:flex-start">${x.shared ? viewBtn(x, sec) : ""}
          ${x.shared && !x.contacted ? `<button class="btn primary sm" data-act="modal" data-m="interest" data-player="${esc(x.playerId)}">I'm interested</button>` : ""}</div>
      </div>
      <form class="sl-form college" data-form="slSave" data-id="${esc(x.id)}">
        <label class="f" for="sl-st-${esc(x.id)}">Status<select id="sl-st-${esc(x.id)}" name="status">${SL_STATUS.map(([k,l]) => `<option value="${k}" ${x.status===k?"selected":""}>${l}</option>`).join("")}</select></label>
        <label class="f sl-note" for="sl-no-${esc(x.id)}">Notes<input type="text" id="sl-no-${esc(x.id)}" name="note" maxlength="1000" value="${esc(x.note || "")}" placeholder="${SCOUT_COPY[sec].note}"></label>
        <div class="row"><button class="btn sm" type="submit">Save</button><button class="btn ghost sm" type="button" data-act="shortlistRemove" data-id="${esc(x.id)}">Remove</button></div>
      </form>
    </div>`).join("") || `<p class="muted">No players with this status.</p>`}</div>`;
}
const sentList = empty => { const sent = (S.interest || []).filter(i => i.coachId === S.uid);
  return sent.length ? `<div class="list">${sent.map(i => `<div class="req"><div class="stack" style="gap:4px"><span><b>${esc(mySection() === "youth" ? shortName(i.playerName) : i.playerName)}</b> <span class="small muted">${esc(relDays(new Date(i.createdAt).toLocaleDateString("en-CA")))}</span></span><span class="small">“${esc(i.message)}”</span><span class="small muted">${i.status === "new" ? "Not read yet" : "Read by the family"}</span></div></div>`).join("")}</div>` : `<p class="muted">${empty}</p>`; };
const shortName = n => { const w = String(n || "").trim().split(/\s+/); return w.length > 1 ? w[0] + " " + w[w.length - 1][0] + "." : w[0] || ""; };
function collegeAccount(){
  const c = S.college || {};
  return `<div class="stack" style="gap:4px"><h1>Account</h1></div>
  <div class="grid2">
    <form class="card stack" data-form="collegeEdit"><h2>Your program</h2>
      ${collegeFields(c)}
      <p class="small muted">Families see your name, title, school, program, division and school email (${esc(c.email || "")}) when you message them.</p>
      <div><button class="btn primary" type="submit">Save</button></div></form>
    ${detailsCard(false)}
    <div class="card stack"><h2>Messages you've sent</h2>${sentList("None yet. Families reply to your school email.")}</div>
  </div>`;
}
const collegeFields = (c = {}) => `<label class="f" for="cl-name">Your name<input type="text" id="cl-name" name="name" required maxlength="60" autocomplete="name" value="${esc(c.name || "")}"></label>
      <label class="f" for="cl-title">Title<input type="text" id="cl-title" name="title" maxlength="80" value="${esc(c.title || "")}" placeholder="e.g. Assistant Coach"></label>
      <label class="f" for="cl-school">College or university<input type="text" id="cl-school" name="school" required maxlength="100" value="${esc(c.school || "")}" placeholder="e.g. State University"></label>
      <div class="grid2" style="gap:14px">
        <label class="f" for="cl-program">Program<select id="cl-program" name="program">${["Men's Soccer","Women's Soccer","Men's & Women's Soccer"].map(x => `<option ${c.program===x?"selected":""}>${x}</option>`).join("")}</select></label>
        <label class="f" for="cl-div">Division<select id="cl-div" name="division" required><option value="">Choose…</option>${[...DIVISIONS, "Other"].map(d => `<option ${c.division===d?"selected":""}>${d}</option>`).join("")}</select></label>
      </div>`;
function proAccount(){
  const s = S.pro || {}, st = s.status;
  return `<div class="stack" style="gap:4px"><h1>Account</h1></div>
  <div class="grid2">
    <form class="card stack" data-form="proEdit"><div class="row between"><h2>Your details</h2><span class="pill ${st === "approved" ? "good" : st === "declined" ? "bad" : "warn"}">${st === "approved" ? "Approved" : st === "declined" ? "Not approved" : "Waiting for approval"}</span></div>
      ${proFields(s)}
      <p class="small muted">Families see your name, title, organization and email (${esc(s.email || "")}) when you message them.${st === "approved" ? " If you change your organization, your account goes back for approval." : ""}</p>
      <div><button class="btn primary" type="submit">Save</button></div></form>
    ${detailsCard(false)}
    <div class="card stack"><h2>Messages you've sent</h2>${sentList("None yet. Families reply to your email.")}</div>
  </div>`;
}
const proFields = (s = {}) => `<label class="f" for="ps-name">Your name<input type="text" id="ps-name" name="name" required maxlength="60" autocomplete="name" value="${esc(s.name || "")}"></label>
      <label class="f" for="ps-title">Title<input type="text" id="ps-title" name="title" maxlength="80" value="${esc(s.title || "")}" placeholder="e.g. Head of Recruitment"></label>
      <label class="f" for="ps-org">Club or organization<input type="text" id="ps-org" name="org" required maxlength="100" value="${esc(s.org || "")}" placeholder="e.g. FC Cincinnati Academy"></label>
      <div class="grid2" style="gap:14px">
        <label class="f" for="ps-type">Type<select id="ps-type" name="orgType" required><option value="">Choose…</option>${ORG_TYPES.map(x => `<option ${s.orgType===x?"selected":""}>${x}</option>`).join("")}</select></label>
        <label class="f" for="ps-region">League or country<input type="text" id="ps-region" name="region" maxlength="80" value="${esc(s.region || "")}" placeholder="e.g. MLS NEXT Pro"></label>
      </div>
      <label class="f" for="ps-about">How can we confirm your role? (optional)<textarea id="ps-about" name="about" maxlength="600" rows="3" placeholder="A staff page link, your club email, or someone at the club we can ask.">${esc(s.about || "")}</textarea></label>`;

/* club coaches: the Recruit tab (youth clubs section) */
const STAFF_SEC_COPY = {
  college:`Players aged ${RECRUIT_AGE} and over can list a Recruitment Profile in the college coach search. The family decides if it's listed; you can help with references.`,
  pro:`Players aged ${RECRUIT_AGE} and over can list a Recruitment Profile for approved pro scouts and academies. The family decides if it's listed; you can help with references.`};
function staffSectionView(sec){
  const all = S.players.slice().sort((a,b) => String(a.name).localeCompare(String(b.name)));
  const older = all.filter(p => { const a = playerAge(p); return a != null && a >= RECRUIT_AGE; });
  const younger = all.length - older.length;
  const rows = older.map(p => {
    const pr = profileFor(p.id) || {}, R = pr.recruit || {}, X = (sec === "college" ? R : R[sec]) || {};
    const listed = R.created && X.searchable && visOf(pr) === "public";
    const refs = S.comments.filter(c => c.playerId === p.id && c.kind === "reference").length;
    const st = !R.created ? `<span class="pill plain">No profile yet</span>` : listed ? `<span class="pill good">Listed</span>` : `<span class="pill warn">Profile, not listed</span>`;
    return `<tr data-act="openRec" data-id="${esc(p.id)}" data-sec="${sec}" tabindex="0"><td><div class="pname">${esc(p.name)}</div><div class="small muted">${esc(posText(p))}</div></td>
      <td>${esc(teamName(p.teamId))}</td><td class="num">${esc(playerAge(p))}</td><td>${st}</td><td class="num">${refs || '<span class="muted">None</span>'}</td></tr>`;
  }).join("");
  return `<div class="stack" style="gap:4px"><h1>${SECTIONS[sec].label} recruiting</h1><p class="muted small">${STAFF_SEC_COPY[sec]}</p></div>
  <div class="card stack">
    ${older.length ? `<div class="tbl-wrap"><table><thead><tr><th>Player</th><th>Team</th><th>Age</th><th>${SECTIONS[sec].label} profile</th><th>References</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : `<p class="muted">None of your players are ${RECRUIT_AGE} or over yet.</p>`}
    ${younger ? `<p class="small muted">${younger} younger player${younger===1?"":"s"} can be listed from ${RECRUIT_AGE}. References you write now carry over.</p>` : ""}
  </div>`;
}
function staffRecruit(){
  if(curSec() !== "youth") return staffSectionView(curSec());
  const v = ["find","shortlist","sent"].includes(S.rview) ? S.rview : "find", n = (S.shortlist || []).length;
  const tabs = `<div class="subtabs level-tabs" role="tablist" aria-label="Recruit">${[["find","Find players"],["shortlist","Shortlist" + (n ? " · " + n : "")],["sent","Messages sent"]].map(([k,l]) => `<button role="tab" data-act="rview" data-id="${k}" aria-selected="${v===k}">${l}</button>`).join("")}</div>`;
  const body = v === "shortlist" ? shortlistHtml() : v === "sent" ? `<div class="card stack"><h2>Messages you've sent</h2><p class="small muted">Families see your name, your club and your email, and reply by email.</p>${sentList("None yet.")}</div>` : scoutView();
  return `<div class="stack" style="gap:4px"><h1>Youth recruiting</h1><p class="muted small">Find players for your teams in the Youth clubs section. Parents choose to be listed, and can turn it off at any time.</p></div>${tabs}${body}`;
}
/* NextPass owners: approve pro scouts */
function scoutApprovals(){
  if(!S.owner) return "";
  const all = S.scouts || [], pend = all.filter(x => x.status === "pending"), rest = all.filter(x => x.status !== "pending");
  const row = x => `<div class="req"><div class="stack" style="gap:4px"><span><b>${esc(x.name)}</b>${x.title ? ", " + esc(x.title) : ""} <span class="pill ${x.status === "approved" ? "good" : x.status === "declined" ? "bad" : "warn"}">${x.status === "approved" ? "Approved" : x.status === "declined" ? "Declined" : "Waiting"}</span></span>
      <span class="small"><b>${esc(x.org)}</b> · ${esc(x.orgType)}${x.region ? " · " + esc(x.region) : ""}</span>
      <span class="small">✉️ <a href="mailto:${esc(x.email)}">${esc(x.email)}</a> <span class="muted">· asked ${esc(relDays(new Date(x.createdAt).toLocaleDateString("en-CA")).toLowerCase())}</span></span>
      ${x.about ? `<span class="small muted">“${esc(x.about)}”</span>` : ""}</div>
    <div class="row">${x.status !== "approved" ? `<button class="btn primary sm" data-act="decideScout" data-id="${esc(x.id)}" data-ok="1">Approve</button>` : ""}${x.status !== "declined" ? `<button class="btn ghost sm" data-act="decideScout" data-id="${esc(x.id)}" data-ok="">${x.status === "approved" ? "Remove access" : "Decline"}</button>` : ""}</div></div>`;
  return `<div class="card stack scout-approvals" style="grid-column:1/-1">
    <div class="row between"><h2>Pro scout approvals${pend.length ? ` <span class="badge">${pend.length}</span>` : ""}</h2><span class="pill plain">${APP_NAME} owner</span></div>
    <p class="small muted">Pro scouts can't see any players until you approve them here. Check that the person really works for the club or agency they name before you approve.</p>
    ${pend.length ? `<div class="list">${pend.map(row).join("")}</div>` : `<p class="muted">Nobody is waiting.</p>`}
    ${rest.length ? `<details><summary class="small">Already decided (${rest.length})</summary><div class="list" style="margin-top:8px">${rest.map(row).join("")}</div></details>` : ""}
  </div>`;
}

/* family: the Recruiting tab, in three sections */
const SECTION_BLURB = {
  college:`For players aged ${RECRUIT_AGE} and over aiming for college soccer. Verified college coaches with a school .edu email can find the profile if you turn that on.`,
  pro:`For players aged ${RECRUIT_AGE} and over aiming for professional clubs and academies. Only scouts that ${APP_NAME} has approved one by one can find the profile, and only if you turn that on.`,
  youth:`For players of any age looking for a new club, tryouts or guest playing. Only coaches of clubs on ${APP_NAME} can find the profile, and only if you turn that on. Under-16s never get a public link.`};
/* what each recruiting path usually looks for; families can change the ticks */
const OPP_PLURAL = {tryout:"Tryouts", combine:"Combines", showcase:"Showcases", id_camp:"ID camps", camp:"Camps", other:"Other events"};
const PATH_KINDS = {college:["id_camp","showcase","combine"], pro:["tryout","combine","showcase"], youth:["tryout","camp"]};
const recKinds = sec => (S.recKinds && S.recKinds[sec]) || PATH_KINDS[sec];
function recruitView(){
  const kids = S.players.filter(p => (S.me.playerIds || []).includes(p.id));
  const sec = curSec(), kinds = recKinds(sec);
  const head = p => `<div class="row between"><div class="stack" style="gap:4px"><h1>Recruiting</h1><p class="muted small">Get seen by college coaches, pro scouts and youth clubs, and find tryouts, camps and showcases.</p></div>${p && kids.length > 1 ? playerSelect(kids, p, false) : ""}</div>`;
  if(!kids.length) return head(null) + `<div class="card stack"><h2>Add your player first</h2><div><button class="btn primary" data-act="modal" data-m="addChild">Add player</button></div></div>`;
  const p = kids.find(k => k.id === S.childId) || kids[0];
  /* 1. the filter */
  const look = `<section class="card stack rec-look" aria-labelledby="look-h"><h2 id="look-h" class="h3">What are you looking for?</h2>
    <div class="fchips" role="radiogroup" aria-label="Recruiting path">${SECTION_KEYS.map(k => `<button type="button" class="fchip" role="radio" data-act="recSec" data-id="${k}" aria-checked="${k === sec}">${SECTIONS[k].label}${newInterest(k).length ? ` <span class="badge" aria-label="${newInterest(k).length} new">${newInterest(k).length}</span>` : ""}</button>`).join("")}</div>
    <p class="small muted">${SECTION_BLURB[sec]}</p>
    <div class="stack" style="gap:6px"><span class="small"><b>Events</b></span>
    <div class="fchips" role="group" aria-label="Events to show">${OPP_KINDS.map(([k]) => `<button type="button" class="fchip" data-act="recKind" data-id="${k}" aria-pressed="${kinds.includes(k)}">${OPP_PLURAL[k]}</button>`).join("")}</div></div>
  </section>`;
  /* 2. opportunities that match */
  const today = new Date().toLocaleDateString("en-CA"), q = (S.recQ || "").trim().toLowerCase();
  const list = S.opps.filter(o => (o.endsOn || o.startsOn) >= today && kinds.includes(o.kind)
      && (!q || [o.title, o.host, o.location, o.ages, o.details].join(" ").toLowerCase().includes(q)))
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn) || a.title.localeCompare(b.title));
  const shown = S.recAll ? list : list.slice(0, 5);
  const opps = S.oppsMissing ? "" : `<section class="stack" aria-labelledby="ropp-h">
    <div class="row between" style="align-items:flex-end"><h2 id="ropp-h">Upcoming opportunities</h2>
      <form class="opp-search" data-form="recSearch" role="search"><label class="f small" for="rec-q">Search<input type="search" id="rec-q" name="q" value="${esc(S.recQ || "")}" placeholder="Place, club, school or age"></label><button class="btn" type="submit">Search</button></form></div>
    <p class="small muted" aria-live="polite">${list.length ? `${list.length} upcoming` : ""}</p>
    ${list.length ? `<div class="opp-list">${shown.map(oppCardHtml).join("")}</div>${list.length > shown.length ? `<div><button class="btn" data-act="recAll">Show all ${list.length}</button></div>` : ""}`
      : `<div class="card stack"><p class="muted">${kinds.length ? "Nothing coming up for these events yet. Tick more events above, or check back: coaches add new ones all the time." : "Tick at least one event above to see what's coming up."}</p>${q ? `<div><button class="btn" data-act="recClearQ">Clear the search</button></div>` : ""}</div>`}
    <p class="small muted">Listings come from coaches on ${APP_NAME}. Check the details with the host before you sign up or pay.</p>
  </section>`;
  /* 3. interest and the recruitment profile for that path */
  const msgs = (S.interest || []).filter(i => i.status !== "archived" && secOf(i) === sec);
  const from = sec === "college" ? "colleges" : sec === "pro" ? "pro scouts" : "youth clubs";
  const intCard = msgs.length ? `<div class="card stack invites"><h2>Interest from ${from}${newInterest(sec).length ? ` <span class="badge">${newInterest(sec).length} new</span>` : ""}</h2>
    <p class="small muted">${sec === "college" ? "College coaches" : sec === "pro" ? "Approved pro scouts" : "Club coaches"} found a Recruitment Profile and want to hear from you. Reply from your own email; ${APP_NAME} never shares your contact details unless you added them to the profile.</p>
    <div class="list">${msgs.map(i => `<div class="req${i.status === "new" ? " is-new" : ""}"><div class="stack" style="gap:4px">
        <span><b>${esc(i.school)}</b>${i.program ? ` · ${esc(i.program)}` : ""}${i.division ? ` <span class="chip">${esc(i.division)}</span>` : ""} → <b>${esc(i.playerName)}</b></span>
        <span class="small muted">${esc(i.coachName)}${i.coachTitle ? ", " + esc(i.coachTitle) : ""} · ${esc(relDays(new Date(i.createdAt).toLocaleDateString("en-CA")))}</span>
        <span class="small">“${esc(i.message)}”</span>
        <span class="small">✉️ <a href="mailto:${esc(i.coachEmail)}?subject=${encodeURIComponent("Re: " + i.playerName + " – " + APP_NAME)}">${esc(i.coachEmail)}</a></span></div>
      <div class="row">${i.status === "new" ? `<button class="btn sm" data-act="markInterest" data-id="${esc(i.id)}" data-status="seen">Mark as read</button>` : ""}<button class="btn ghost sm" data-act="markInterest" data-id="${esc(i.id)}" data-status="archived">Archive</button></div></div>`).join("")}</div></div>` : "";
  return `${head(p)}
  ${look}
  ${opps}
  <h2 class="rec-path-h">${SECTIONS[sec].label} recruiting${kids.length > 1 ? ` · ${esc(p.name)}` : ""}</h2>
  ${intCard}
  ${recruitHtml(p, {editable:canEditProfile(p), section:sec})}`;
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
function msgTime(ts){ return new Date(ts).toLocaleTimeString(LOC,{hour:"numeric",minute:"2-digit"}); }
function dayLabel(ts){
  const d = new Date(ts).toLocaleDateString("en-CA");
  if(d === today()) return "Today";
  const y = new Date(); y.setDate(y.getDate()-1);
  if(d === y.toLocaleDateString("en-CA")) return "Yesterday";
  return new Date(ts).toLocaleDateString(LOC,{weekday:"short",month:"short",day:"numeric"});
}
/* ---------- Recruiting: opportunities listed by club and college coaches ---------- */
const OPP_KINDS = [["tryout","Tryout"],["combine","Combine"],["showcase","Showcase"],["id_camp","ID camp"],["camp","Camp"],["other","Other"]];
const oppKindLabel = k => (OPP_KINDS.find(x => x[0] === k) || ["", "Other"])[1];
const canListOpps = () => isStaff() || (S.me && S.me.role === "college");
const oppDay = iso => new Date(iso + "T12:00:00");
function oppWhen(o){
  const f = {weekday:"short", month:"short", day:"numeric", year:"numeric"};
  const a = oppDay(o.startsOn).toLocaleDateString(LOC, f);
  const b = o.endsOn && o.endsOn !== o.startsOn ? oppDay(o.endsOn).toLocaleDateString(LOC, f) : "";
  return b ? `${a} – ${b}` : a;
}
function oppCardHtml(o){
    const mine = o.createdBy === S.uid, canDel = mine || (isAdmin() && o.clubId && o.clubId === S.me.clubId), d = oppDay(o.startsOn);
    const facts = [o.ages, o.gender === "Any" ? "Boys and girls" : o.gender, o.cost].filter(Boolean).join(" · ");
    return `<article class="card opp">
      <div class="opp-date" aria-hidden="true"><span class="od-m">${esc(d.toLocaleDateString(LOC, {month:"short"}))}</span><span class="od-d">${d.getDate()}</span></div>
      <div class="stack opp-body">
        <div class="row" style="gap:8px"><span class="pill opp-kind k-${esc(o.kind)}">${oppKindLabel(o.kind)}</span><span class="small muted">${esc(o.host)}</span></div>
        <h2 class="h3">${esc(o.title)}</h2>
        <p class="small"><b>${esc(oppWhen(o))}</b>${o.timeNote ? ` · ${esc(o.timeNote)}` : ""}</p>
        <p class="small">${esc(o.location)}</p>
        ${facts ? `<p class="small muted">${esc(facts)}</p>` : ""}
        ${o.details ? `<p class="small opp-details">${esc(o.details)}</p>` : ""}
        <div class="row" style="gap:8px">
          ${o.link ? `<a class="btn sm primary" href="${esc(o.link)}" target="_blank" rel="noopener noreferrer">More info and sign-up<span class="sr-only"> for ${esc(o.title)} (opens in a new tab)</span></a>` : ""}
          ${o.contact ? `<span class="small">Contact: ${esc(o.contact)}</span>` : ""}
          ${mine ? `<button class="btn sm" data-act="modal" data-m="opp" data-id="${esc(o.id)}">Edit<span class="sr-only"> ${esc(o.title)}</span></button>` : ""}
          ${canDel ? `<button class="btn sm ghost" data-act="delOpp" data-id="${esc(o.id)}">Delete<span class="sr-only"> ${esc(o.title)}</span></button>` : ""}
        </div>
      </div></article>`;
  }
function oppsView(){
  const today = new Date().toLocaleDateString("en-CA"), can = canListOpps();
  const q = S.oppQ.trim().toLowerCase();
  const all = S.opps.filter(o => (o.endsOn || o.startsOn) >= today);
  const list = all.filter(o => (!S.oppKind || o.kind === S.oppKind)
      && (!S.oppGender || o.gender === S.oppGender || o.gender === "Any")
      && (!q || [o.title, o.host, o.location, o.ages, o.details].join(" ").toLowerCase().includes(q)))
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn) || a.title.localeCompare(b.title));
  const head = `<div class="row between" style="align-items:flex-end"><div class="stack" style="gap:6px"><h1>Opportunities</h1>
      <p class="lead">Tryouts, combines, showcases and ID camps listed by club and college coaches.</p></div>
      ${can && !S.oppsMissing ? `<button class="btn primary" data-act="modal" data-m="opp">List an opportunity</button>` : ""}</div>`;
  if(S.oppsMissing) return head + `<div class="card stack"><h2>Opportunities aren't switched on yet</h2><p class="muted">Your club admin needs to run the latest database update. Then listings show up here.</p></div>`;
  const tools = `<div class="lib-tools opp-tools">
      <label class="f small" for="opp-kind">Type<select id="opp-kind" data-change="oppKind"><option value="">All types</option>${OPP_KINDS.map(([k,l]) => `<option value="${k}" ${S.oppKind === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f small" for="opp-gender">Players<select id="opp-gender" data-change="oppGender"><option value="">Boys and girls</option><option value="Boys" ${S.oppGender === "Boys" ? "selected" : ""}>Boys</option><option value="Girls" ${S.oppGender === "Girls" ? "selected" : ""}>Girls</option></select></label>
      <form class="opp-search" data-form="oppSearch" role="search"><label class="f small" for="opp-q">Search<input type="search" id="opp-q" name="q" value="${esc(S.oppQ)}" placeholder="Place, club, school or age"></label><button class="btn" type="submit">Search</button></form>
    </div>
    <p class="small muted" aria-live="polite">${list.length} upcoming${list.length !== all.length ? ` of ${all.length}` : ""}</p>`;
  const card = oppCardHtml;
  const empty = all.length
    ? `<div class="card stack"><h2>Nothing matches</h2><p class="muted">Try another type or clear the search.</p><div><button class="btn" data-act="oppClear">Show all</button></div></div>`
    : `<div class="card stack"><h2>No upcoming opportunities yet</h2><p class="muted">${can ? (S.me.role === "college" ? "List your program's ID camps and showcases so families can find them." : "List your club's tryouts, combines, showcases or ID camps so families can find them.") : "When club and college coaches list tryouts, combines, showcases or ID camps, they show up here."}</p>${can ? `<div><button class="btn primary" data-act="modal" data-m="opp">List an opportunity</button></div>` : ""}</div>`;
  return head + tools + (list.length ? `<div class="opp-list">${list.map(card).join("")}</div>` : empty)
    + `<p class="small muted">Listings come from coaches on ${APP_NAME}. Check the details with the host before you sign up or pay.</p>`;
}
/* emoji reactions on chat messages: one per person per message */
const REACTS = [["👍","Thumbs up"],["👎","Thumbs down"],["❗","Important"],["❓","Question"],["😂","Laughing"]];
const SMILE_SVG = `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="12" r="8"/><path d="M8 14.2c.8 1.1 1.8 1.6 3 1.6s2.2-.5 3-1.6"/><circle cx="8.6" cy="9.8" r=".6" fill="currentColor"/><circle cx="13.4" cy="9.8" r=".6" fill="currentColor"/><path d="M20 2.5v5M17.5 5h5" stroke-width="1.6"/></svg>`;
/* click (mouse) or press and hold (touch) a message to react */
const rAttr = (kind, m) => S.reactionsMissing ? "" : ` data-rk="${kind}" data-rid="${esc(m.id)}"`;
function reactIndex(){
  const by = new Map();
  for(const r of S.reactions){ if(!by.has(r.messageId)) by.set(r.messageId, []); by.get(r.messageId).push(r); }
  return by;
}
function reactsHtml(kind, m, idx){
  if(S.reactionsMissing) return "";
  const rs = idx.get(m.id) || [], key = kind + ":" + m.id, open = S.reactFor === key;
  const mineE = (rs.find(r => r.userId === S.uid) || {}).emoji;
  const chips = REACTS.map(([e, label]) => {
    const who = rs.filter(r => r.emoji === e); if(!who.length) return "";
    const names = who.map(r => r.userId === S.uid ? "You" : (r.userName || "Someone")).join(", ");
    return `<button type="button" class="react-chip${mineE === e ? " on" : ""}" data-act="react" data-k="${kind}" data-id="${esc(m.id)}" data-e="${e}" aria-pressed="${mineE === e}" title="${esc(names)}"><span aria-hidden="true">${e}</span><span class="sr-only">${label}</span> ${who.length}<span class="sr-only">: ${esc(names)}</span></button>`;
  }).join("");
  const pick = open ? `<div class="react-pick" role="group" aria-label="Pick a reaction">${REACTS.map(([e, label]) => `<button type="button" class="react-opt${mineE === e ? " on" : ""}" data-act="react" data-k="${kind}" data-id="${esc(m.id)}" data-e="${e}" aria-pressed="${mineE === e}" title="${label}"><span aria-hidden="true">${e}</span><span class="sr-only">${label}</span></button>`).join("")}</div>` : "";
  return `<div class="reacts">${chips}<button type="button" class="react-add" data-act="reactOpen" data-k="${kind}" data-id="${esc(m.id)}" aria-expanded="${open}" aria-label="Add a reaction" title="Add a reaction">${SMILE_SVG}</button>${pick}</div>`;
}
function chatView(){
  const teams = myTeams();
  if(!teams.length) return `<h1>Team Chat</h1><div class="locked"><h2>No team chats yet</h2><p class="muted">${isStaff() ? "Add a team and its chat appears here for the coaches and every family on that team." : "Your player isn't on a team yet. Find your club under My player and ask to join a team. The chat opens once a coach approves."}</p>${isStaff()?`<button class="btn primary" data-act="modal" data-m="team">Add team</button>`:""}</div>`;
  if(!teams.find(t => t.id === S.chatTeam)) S.chatTeam = teams[0].id;
  const team = teams.find(t => t.id === S.chatTeam);
  const ms = teamMsgs(team.id);
  const fams = S.members.filter(m => m.role === "family" && S.players.some(p => p.teamId === team.id && (m.playerIds||[]).includes(p.id))).length;
  const coaches = S.members.filter(m => m.role === "coach" || m.role === "admin").length;
  const pin = ms.filter(m => m.announce).slice(-1)[0];
  let lastDay = "", lastAuthor = "", lastTs = 0, thread = "";
  const ridx = reactIndex();
  for(const m of ms){
    const dl = dayLabel(m.createdAt);
    if(dl !== lastDay){ thread += `<div class="day">${esc(dl)}</div>`; lastDay = dl; lastAuthor = ""; }
    const mine = m.authorId === S.uid;
    const grouped = !m.announce && m.authorId === lastAuthor && m.createdAt - lastTs < 5*60*1000;
    const canDel = mine || isStaff();
    const roleTag = (m.role === "coach" || m.role === "admin") ? `<span class="pill good">Coach</span>` : "";
    if(m.announce){
      thread += `<div class="msg announce"><div class="row between"><span class="pill warn">Announcement</span><span class="small muted">${esc(m.authorName||"Coach")} · ${msgTime(m.createdAt)}</span></div><div class="bubble"${rAttr("team", m)}>${esc(m.text)}</div>${reactsHtml("team", m, ridx)}${canDel?`<button class="btn ghost sm del" data-act="delMsg" data-id="${esc(m.id)}">Delete</button>`:""}</div>`;
    } else {
      thread += `<div class="msg${mine?" mine":""}">${grouped?"":`<div class="who">${mine?"":`<b>${esc(m.authorName||"Someone")}</b>${roleTag}`}<span>${msgTime(m.createdAt)}</span></div>`}<div class="bubble"${rAttr("team", m)}>${esc(m.text)}</div>${reactsHtml("team", m, ridx)}${canDel?`<button class="btn ghost sm del" data-act="delMsg" data-id="${esc(m.id)}" aria-label="Delete message">Delete</button>`:""}</div>`;
    }
    lastAuthor = m.announce ? "" : m.authorId; lastTs = m.createdAt;
  }
  if(!ms.length) thread = `<div class="muted" style="margin:auto;text-align:center;max-width:40ch">No messages yet. ${isStaff()?"Post a welcome or this week's schedule.":"Say hi to your team."}</div>`;
  return `<h1 class="sr-only">Team chat</h1><div class="chat">
    <aside class="chat-side" aria-label="Team chats"><h2 class="side-h">Your teams</h2>
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
        ${MONITOR_NOTE}
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
  if(readInviteHash(h)){
    S.publicPage = null; S.menuOpen = false; S.publicSlug = null; S.pub = null; S.inviteDone = false;
    if(!S.uid) S.authMode = "signup";
    try { history.replaceState(null, "", location.pathname + location.search); } catch(_){}
    loadInviteInfo(); render(); window.scrollTo(0,0); return;
  }
  if(PAGE_IDS.includes(h)){ S.publicPage = h; S.menuOpen = false; S.navQuiet = S.navOpen === "features" || !!(document.activeElement && document.activeElement.closest && document.activeElement.closest(".nav-dd")); S.navOpen = null; S.publicSlug = null; S.pub = null; if(h !== "contact") S.contactSent = null; render(); window.scrollTo(0,0);
    if(h === "for-parents"){ const sec = document.getElementById("for-parents-sec"); if(sec){ sec.scrollIntoView({block:"start"}); sec.focus({preventScroll:true}); } }
    return; }
  if(h === "signin" || h === ""){ S.wantSignin = h === "signin"; S.publicPage = null; S.menuOpen = false; if(S.publicSlug){ S.publicSlug = null; S.pub = null; } render(); window.scrollTo(0,0); return; }
  if(h === "coach" || h === "parent" || h === "college" || h === "pro"){ savePortal(h === "coach" ? "coach" : h === "college" ? "college" : h === "pro" ? "pro" : "family"); S.publicPage = null; if(S.publicSlug){ S.publicSlug = null; S.pub = null; } if(!S.uid){ S.authMode = "signin"; } render(); return; }
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
  return `<div class="row between"><div class="stack" style="gap:4px"><h1>Home Drills</h1><p class="muted small">${staff?"Solo drills for home practice, plus any your club adds. For team practices, see Training → Team Drills.":"Drills you can do at home with a ball and a little space."}</p></div>
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
  else status = fp ? "You're on a Home Training trial." : (S.clubs || []).length ? "Your club doesn't include Home Training. You can add it for " + PRICES.family + " " + PRICES.familyPer + "." : "You can add Home Training for " + PRICES.family + " " + PRICES.familyPer + ". Some clubs include it once you join their team.";
  return `<div class="stack" style="gap:4px"><h1>Pricing</h1><p class="muted">${status}</p></div>
  ${staff ? planSummary() : ""}
  <div class="grid3 plans3">
    ${clubPlanCard("team", staff)}
    ${clubPlanCard("unlimited", staff)}
    <div class="card plan">
      <span class="pill good" style="align-self:flex-start">For players & parents</span>
      <h2>Home Training</h2>
      <div><span class="price">${PRICES.family}</span> <span class="muted">${PRICES.familyPer}</span></div>
      <p class="small muted">For players whose club doesn't include it.</p>
      <ul><li>Drills your coach assigns, with step-by-step instructions</li><li>Full home drill library</li><li>Progress charts for every skill</li><li>Weekly drill tracking your coach can see</li></ul>
      <p class="small muted">Free with every club: the coach's latest review and skill ratings.</p>
      ${!staff && !included ? (fp ? `<div class="row"><span class="pill good">Trial active</span><button class="btn ghost sm" data-act="cancelPlan">Cancel trial</button></div>` : `<div><button class="btn primary" data-act="startPlan">Start 14-day free trial</button></div>`) : ""}
    </div>
  </div>
  <p class="small muted">Payments aren't connected in this version: starting a trial unlocks Home Training without charging anything.</p>`;
}

function clubPlanCard(k, staff){
  const pi = staff ? planInfo() : null, cur = pi && pi.plan === k, admin = staff && isAdmin();
  return `<div class="card plan${cur ? " featured" : ""}">
    <div class="row between"><span class="pill ${k === "unlimited" ? "warn" : "plain"}">${k === "unlimited" ? "Best for 10+ teams" : "For clubs & coaches"}</span>${cur ? `<span class="pill good">✓ Your plan</span>` : ""}</div>
    <h2>${planName(k)}</h2>
    <div><span class="price">${k === "unlimited" ? PRICES.unlimited : PRICES.club}</span> <span class="muted">${k === "unlimited" ? PRICES.unlimitedPer : PRICES.clubPer + " you register"}</span></div>
    ${pi ? `<p class="small">${k === "unlimited" ? `For your club: <b>${money(PRICE_NUM.unlimited)}</b> a month, however many teams you add.` : `For your club: ${pi.n} team${pi.n===1?"":"s"} × ${PRICES.club} = <b>${money(pi.perTeam)}</b> a month.`}</p>` : ""}
    <ul><li>${k === "unlimited" ? "<b>Unlimited teams</b>, players and coaches" : "Unlimited players and coaches on each team"}</li>${CLUB_FEATURES}</ul>
    ${admin && !cur ? `<div style="margin-top:auto"><button class="btn${k === "unlimited" ? " primary" : ""}" data-act="setPlan" data-id="${k}">Switch to ${planName(k)}</button></div>` : ""}
  </div>`;
}
function planSummary(){
  const pi = planInfo();
  const tip = pi.plan === "team" && pi.save > 0 ? ` <b>Switch to Club Unlimited to save ${money(pi.save)} a month.</b>` : pi.plan === "unlimited" && pi.save < 0 ? ` With ${pi.n} team${pi.n===1?"":"s"}, the per-team plan would cost ${money(pi.perTeam)} a month.` : "";
  return `<div class="card plan-summary"><p>Your club is on <b>${planName(pi.plan)}</b>: ${pi.plan === "unlimited" ? `${money(PRICE_NUM.unlimited)} a month for unlimited teams (${pi.n} now)` : `${pi.n} team${pi.n===1?"":"s"}, ${money(pi.perTeam)} a month`}.${tip}</p>
    ${isAdmin() ? `<div class="row"><button class="btn sm" data-act="modal" data-m="clubSettings">Club settings</button></div>` : `<p class="small muted">Only the club admin can change the plan.</p>`}</div>`;
}
function clubView(){
  const admin = S.me.role === "admin";
  const coaches = S.members.filter(m => m.role === "coach" || m.role === "admin");
  const fams = S.members.filter(m => m.role === "family");
  return `<h1>Club</h1>
  <div class="grid2">
    <div class="card stack">
      <div class="row between"><h2>${esc(S.club.name)}</h2>${admin?`<button class="btn sm" data-act="modal" data-m="clubSettings">Edit</button>`:""}</div>
      <p>Coach join code: <span class="code">${esc(S.club.code)}</span> <button class="btn ghost sm" data-act="copy" data-text="${esc(S.club.code)}">Copy code</button> <button class="btn ghost sm" data-act="copy" data-text="${esc(coachInviteUrl())}" data-label="Coach invite link">Copy invite link</button></p>
      <p>Home Training for families: <b>${S.club.familyAccess==="subscribe"?"families subscribe themselves":"included by the club"}</b></p>
      ${(() => { const pi = planInfo(); return `<p>Plan: <b>${planName(pi.plan)}</b> · ${pi.plan === "unlimited" ? money(PRICE_NUM.unlimited) + " a month, unlimited teams" : money(pi.perTeam) + " a month for " + pi.n + " team" + (pi.n===1?"":"s")}</p>${pi.plan === "team" && pi.save > 0 ? `<p class="small"><b>Tip:</b> Club Unlimited would save you ${money(pi.save)} a month. <button class="btn ghost sm" data-act="go" data-view="plans">Compare plans</button></p>` : ""}`; })()}
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
    ${detailsCard(true)}
    <div class="card stack">
      <h2>Your account</h2>
      <p>${esc(S.me.name||"")} · ${admin?"Club admin":"Coach"}</p>
      <div><button class="btn danger" data-act="modal" data-m="leave">Leave this club</button></div>
    </div>
    ${scoutApprovals()}
  </div>`;
}

/* Account: your own details. Names show to your club; phone and email stay private to you. */
function splitName(n){ const t = String(n || "").trim().split(/\s+/); return [t[0] || "", t.slice(1).join(" ")]; }
function detailsCard(withName){
  const m = S.meta || {}, [f0, l0] = splitName(S.me && S.me.name);
  const first = m.first_name != null ? m.first_name : f0, last = m.last_name != null ? m.last_name : l0;
  const college = S.me && S.me.role === "college";
  return `<form class="card stack" data-form="myDetails" data-names="${withName ? 1 : 0}"><h2>Your details</h2>
    ${withName ? `<div class="grid2" style="gap:14px">
      <label class="f" for="md-first">First name<input type="text" id="md-first" name="first" required maxlength="30" autocomplete="given-name" value="${esc(first)}"></label>
      <label class="f" for="md-last">Last name<input type="text" id="md-last" name="last" maxlength="29" autocomplete="family-name" value="${esc(last)}"></label></div>` : ""}
    <label class="f" for="md-phone">Phone number<input type="tel" id="md-phone" name="phone" maxlength="25" autocomplete="tel" inputmode="tel" pattern="[0-9+()\\-. ]{7,25}" value="${esc(m.phone || "")}" aria-describedby="md-phone-note"></label>
    <p class="small muted" id="md-phone-note">Only you can see your phone number.</p>
    <label class="f" for="md-email">Email<input type="email" id="md-email" name="email" required maxlength="120" autocomplete="email" value="${esc(S.email || "")}" aria-describedby="md-email-note"></label>
    <p class="small muted" id="md-email-note">${S.pendingEmail ? `Waiting for you to confirm <b>${esc(S.pendingEmail)}</b>. Open the link we emailed you. Until then you sign in with ${esc(S.email)}.` : college ? "You sign in with this email. College coach accounts need a school email ending in .edu." : "You sign in with this email. If you change it, we email a link to confirm the new address."}</p>
    <div><button class="btn primary" type="submit">Save details</button></div>
  </form>`;
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
    ${detailsCard(true)}
    <div class="card stack"><h2>You</h2><p>${esc(S.me.name||"")} · Parent / player account</p>
      <p class="small muted">Your players' profiles, reviews and messages belong to your account. If a player leaves a club, you keep everything; that club's coaches lose access.</p></div>
    ${scoutApprovals()}
  </div>`;
}

/* ---------- modals ---------- */
let modalReturn = null;
function openModal(html){
  const m = document.getElementById("modal"), wasOpen = !!m.innerHTML;
  if(!wasOpen) modalReturn = document.activeElement;
  m.innerHTML = `<div class="backdrop" data-act="closeBg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}<button type="button" class="m-close" data-act="close" aria-label="Close">×</button></div></div>`;
  const h = m.querySelector(".modal h2, .modal h3"); if(h){ h.id = "modal-title"; h.tabIndex = -1; }
  const app = document.getElementById("app"); if(app) app.inert = true;
  const f = m.querySelector(".modal input:not([type=hidden]):not([type=file]),.modal select,.modal textarea,.modal button.primary") || h;
  if(f) f.focus();
}
function closeModal(){
  document.getElementById("modal").innerHTML = "";
  const app = document.getElementById("app"); if(app) app.inert = false;
  const r = modalReturn; modalReturn = null;
  if(r && document.body.contains(r)) try { r.focus(); } catch(_){}
}
/* keep keyboard focus inside an open dialog */
document.addEventListener("keydown", ev => {
  if(ev.key !== "Tab") return;
  const m = document.querySelector("#modal .modal"); if(!m) return;
  const f = [...m.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e => e.offsetParent !== null);
  if(!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if(ev.shiftKey && (document.activeElement === first || !m.contains(document.activeElement))){ ev.preventDefault(); last.focus(); }
  else if(!ev.shiftKey && (document.activeElement === last || !m.contains(document.activeElement))){ ev.preventDefault(); first.focus(); }
});
const teamOptions = sel => S.teams.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(t=>`<option value="${esc(t.id)}" ${t.id===sel?"selected":""}>${esc(t.name)}</option>`).join("");

const MODALS = {
  team: () => `<h2>Add team</h2><form data-form="team">
    <label class="f" for="t-name">Team name<input type="text" id="t-name" name="name" required maxlength="60" placeholder="e.g. U12 Boys Premier"></label>
    <label class="f" for="t-age">Age group<input type="text" id="t-age" name="age" maxlength="20" placeholder="e.g. U12"></label>
    ${(() => { const pi = planInfo(); return pi.plan === "unlimited" ? `<p class="small muted">Included in Club Unlimited: add as many teams as you like.</p>`
      : `<p class="small muted">Adds ${PRICES.club} a month: ${pi.n + 1} team${pi.n ? "s" : ""} = ${money((pi.n + 1) * PRICE_NUM.team)} a month.${(pi.n + 1) * PRICE_NUM.team > PRICE_NUM.unlimited ? " Club Unlimited (" + PRICES.unlimited + ") would be cheaper." : ""}</p>`; })()}
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
    <p class="small muted">${last?`Sliders start at the last review's ratings (${fmtDate(last.date)}). Move only what has changed. The previous review stays in the review history.`:"This first review sets the baseline that future progress is measured from."} 1 Needs a lot of work · 2 Developing · 3 Solid for their level · 4 Strong · 5 Excellent</p>
    <form data-form="review" data-id="${esc(p.id)}" data-last="${last ? esc(JSON.stringify({form:lastForm, ratings:last.ratings})) : ""}">
      <label class="f" for="r-date" style="max-width:200px">Date<input type="date" id="r-date" name="date" value="${today()}" required></label>
      <fieldset class="rtype" style="border:0;padding:0;margin:0;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><legend class="small" style="font-weight:600;margin-bottom:6px;color:var(--blue-deep)">Review type</legend>
        <label class="chipbox" for="rf-field"><input type="radio" id="rf-field" name="form" value="field" data-reviewform="1" ${form==="field"?"checked":""}><span>Field player</span></label>
        <label class="chipbox" for="rf-gk"><input type="radio" id="rf-gk" name="form" value="gk" data-reviewform="1" ${form==="gk"?"checked":""}><span>Goalkeeper</span></label>
      </fieldset>
      ${(() => { const u = uGroupOf(p), lastB = last && baselineOf(last) ? last.baseline : "";
        const opts = BASELINES.filter(b => !b.minU || (u != null && u >= b.minU) || lastB === b.k);
        return `<fieldset class="bl-pick"><legend>Rate against <span class="small muted">(required)</span></legend>
        <p class="small muted" style="margin:0 0 6px">What should a 3 (“solid for their level”) mean in this review?${u != null && u < 16 ? " Higher level is available from U16." : ""}</p>
        <div class="chips">${opts.map(b => `<label class="chipbox" for="bl-${b.k}" title="${esc(b.help)}"><input type="radio" id="bl-${b.k}" name="baseline" value="${b.k}" required ${lastB === b.k ? "checked" : ""}><span>${esc(b.label)}</span></label>`).join("")}</div>
        <p class="small muted bl-help" id="bl-help" data-last="${esc(lastB)}">${lastB ? esc(baselineOf(last).help) + ". Same as the last review." : "Pick one so families know what the ratings are compared with."}</p></fieldset>`; })()}
      <div class="stack rset" data-set="field" style="gap:8px" ${form==="field"?"":"hidden"}>${sliderSet("field")}</div>
      <div class="stack rset" data-set="gk" style="gap:8px" ${form==="gk"?"":"hidden"}>${sliderSet("gk")}</div>
      <div class="update-box stack" style="gap:8px">
        ${last ? `<div class="small"><b>Changes since last review:</b> <span id="r-changes" class="muted">None yet. Move a slider to record a change.</span></div>` : ""}
        <label class="f" for="r-summary">${last ? "What changed since the last review?" : "One-line summary"} <span class="small muted">(required, shown in the review history)</span>
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
  clubSettings: () => { const pi = planInfo(); return `<h2>Club settings</h2><form data-form="clubSettings">
    <label class="f" for="c-name">Club name<input type="text" id="c-name" name="name" required maxlength="80" value="${esc(S.club.name)}"></label>
    <fieldset class="stack" style="border:0;padding:0;margin:0"><legend style="font-weight:600;margin-bottom:8px">Plan</legend>
      <label class="choice" for="pl-team"><input type="radio" id="pl-team" name="plan" value="team" ${pi.plan==="team"?"checked":""}><span><b>Club (per team): ${PRICES.club} a month per team</b><br><span class="small muted">With your ${pi.n} team${pi.n===1?"":"s"}: ${money(pi.perTeam)} a month.</span></span></label>
      <label class="choice" for="pl-unl"><input type="radio" id="pl-unl" name="plan" value="unlimited" ${pi.plan==="unlimited"?"checked":""}><span><b>Club Unlimited: ${PRICES.unlimited} a month</b><br><span class="small muted">Unlimited teams, players and coaches.${pi.save > 0 ? " Saves you " + money(pi.save) + " a month." : " Worth it from 10 teams."}</span></span></label>
    </fieldset>
    <fieldset class="stack" style="border:0;padding:0;margin:0"><legend style="font-weight:600;margin-bottom:8px">Home Training for families</legend>
      <label class="choice" for="fa-inc"><input type="radio" id="fa-inc" name="familyAccess" value="included" ${S.club.familyAccess!=="subscribe"?"checked":""}><span><b>Included by the club</b><br><span class="small muted">Every connected family gets home drills and progress charts. Your club plan covers it.</span></span></label>
      <label class="choice" for="fa-sub"><input type="radio" id="fa-sub" name="familyAccess" value="subscribe" ${S.club.familyAccess==="subscribe"?"checked":""}><span><b>Families subscribe themselves</b><br><span class="small muted">Families see the latest review free and can add Home Training on their own.</span></span></label>
    </fieldset>
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  addChild: () => `<h2>Add a player</h2><form data-form="addChild">
    ${playerSetupFields("ac")}
    <div class="row"><button class="btn primary" type="submit">Add player</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`,
  editMine: ds => { const p = S.players.find(x => x.id === ds.player); if(!p) return "<p>Player not found.</p>";
    const [fn, ln] = splitName(p.name), pr = profileFor(p.id) || {}, main = (pr.positions || [])[0] || "";
    return `<h2>Edit ${esc(p.name)}</h2><form data-form="editMine" data-id="${esc(p.id)}" class="stack">
    <div class="grid2" style="gap:14px">
      <label class="f" for="em-first">Player's first name<input type="text" id="em-first" name="first" required maxlength="30" value="${esc(fn)}"></label>
      <label class="f" for="em-last">Player's last name<input type="text" id="em-last" name="last" maxlength="29" value="${esc(ln)}"></label></div>
    <label class="f" for="em-dob">Date of birth<input type="date" id="em-dob" name="dob" min="1990-01-01" max="${new Date().toLocaleDateString("en-CA")}" value="${esc(p.birthDate||"")}"></label>
    <div class="grid2" style="gap:14px">
      <label class="f" for="em-pos">Main position<select id="em-pos" name="main"><option value="">Not set</option>${FIELD_POSITIONS.map(([k,l]) => `<option value="${k}" ${main===k?"selected":""}>${k} – ${l}</option>`).join("")}</select></label>
      <label class="f" for="em-foot">Stronger foot<select id="em-foot" name="foot">${["","Right","Left","Both"].map(f => `<option value="${f}" ${(pr.foot||"")===f?"selected":""}>${f||"Not set"}</option>`).join("")}</select></label></div>
    <p class="small muted">More about ${esc(fn || "your player")}, like strengths, a bio and highlights, is under Player profile.</p>
    <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  opp: ds => {
    const o = ds.id ? S.opps.find(x => x.id === ds.id) || {} : {}, today = new Date().toLocaleDateString("en-CA");
    return `<h2>${o.id ? "Edit opportunity" : "List an opportunity"}</h2><form data-form="opp" data-id="${esc(o.id || "")}" class="stack">
    <div class="grid2" style="gap:14px">
      <label class="f" for="op-kind">Type<select id="op-kind" name="kind" required><option value="">Choose…</option>${OPP_KINDS.map(([k,l]) => `<option value="${k}" ${o.kind === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f" for="op-gender">Players<select id="op-gender" name="gender">${[["Any","Boys and girls"],["Boys","Boys"],["Girls","Girls"]].map(([v,l]) => `<option value="${v}" ${(o.gender || "Any") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <label class="f" for="op-title">Title<input type="text" id="op-title" name="title" required maxlength="100" value="${esc(o.title || "")}" placeholder="e.g. U15 and U16 Boys tryouts"></label>
    <div class="grid2" style="gap:14px">
      <label class="f" for="op-start">Date<input type="date" id="op-start" name="start" required min="${o.id ? "" : today}" value="${esc(o.startsOn || "")}"></label>
      <label class="f" for="op-end">Last day (if more than one)<input type="date" id="op-end" name="end" value="${esc(o.endsOn || "")}"></label></div>
    <div class="grid2" style="gap:14px">
      <label class="f" for="op-time">Time<input type="text" id="op-time" name="time" maxlength="60" value="${esc(o.timeNote || "")}" placeholder="e.g. 9am to 12pm"></label>
      <label class="f" for="op-ages">Ages<input type="text" id="op-ages" name="ages" maxlength="60" value="${esc(o.ages || "")}" placeholder="e.g. U14 to U17, or born 2010 to 2012"></label></div>
    <label class="f" for="op-loc">Location<input type="text" id="op-loc" name="location" required maxlength="160" value="${esc(o.location || "")}" placeholder="Field or venue, city"></label>
    <div class="grid2" style="gap:14px">
      <label class="f" for="op-cost">Cost<input type="text" id="op-cost" name="cost" maxlength="40" value="${esc(o.cost || "")}" placeholder="e.g. Free, or $40"></label>
      <label class="f" for="op-contact">Contact<input type="text" id="op-contact" name="contact" maxlength="120" value="${esc(o.contact || "")}" placeholder="Email or phone for questions"></label></div>
    <label class="f" for="op-link">Sign-up or info link<input type="url" id="op-link" name="link" maxlength="300" value="${esc(o.link || "")}" placeholder="https://"></label>
    <label class="f" for="op-details">Details<textarea id="op-details" name="details" maxlength="1500" rows="4" placeholder="What to bring, how players are picked, how to register.">${esc(o.details || "")}</textarea></label>
    <p class="small muted">Every signed-in family, player and coach on ${APP_NAME} can see this. It's listed under ${esc(S.me.role === "college" ? ((S.college || {}).school || "your school") : (S.club || {}).name || "your club")}.</p>
    <div class="row"><button class="btn primary" type="submit">${o.id ? "Save changes" : "List it"}</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`;
  },
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
  interest: ds => { const r = (S.scout && S.scout.res || []).find(x => x.playerId === ds.player) || (S.shortlist || []).find(x => x.playerId === ds.player) || {}; const c = S.college || {}, ps = S.pro || {}, sec = mySection();
    const seen = sec === "pro" ? `your name, title, ${esc(ps.org || "organization")} and your email (${esc(ps.email || "")}), and replies by email. Contact with players under 18 should go through a parent.`
      : sec === "youth" ? `your name, ${esc((S.club || {}).name || "your club")} and your email (${esc(S.email || "")}), and replies by email. Please follow your league's rules on approaching players at other clubs.`
      : `your name, title, ${esc(c.school || "school")} and your school email (${esc(c.email || "")}), and replies by email. Please follow the recruiting contact rules for your division.`;
    return `<h2>Message ${esc(r.name ? r.name + "'s family" : "the family")}</h2><form data-form="interest" data-player="${esc(ds.player)}">
      <label class="f" for="in-msg">Message<textarea id="in-msg" name="message" required maxlength="1500" rows="6" placeholder="${SCOUT_COPY[sec].msg}"></textarea></label>
      <p class="small muted">The family sees your message with ${seen}</p>
      <div class="row"><button class="btn primary" type="submit">Send</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  proDetails: ds => { const p = S.players.find(x => x.id === ds.player); if(!p) return "<p>Player not found.</p>";
    const pr = profileFor(p.id) || {}, R = pr.recruit || {}, X = R.pro || {}, lv = X.levels || [];
    return `<h2>Pro details</h2><form data-form="proDetails" data-id="${esc(p.id)}">
      <label class="f" for="pd-sum">Recruiting summary<textarea id="pd-sum" name="summary" maxlength="800" rows="4" placeholder="What makes ${esc(p.name)} stand out: playing style, strengths and the kind of club you're looking for.">${esc(R.summary || "")}</textarea><span class="small muted">Shared with the other sections.</span></label>
      <h3 class="form-sec">Playing status</h3>
      <div class="grid2" style="gap:14px">
        <label class="f" for="pd-status">Status<select id="pd-status" name="status">${["", ...PRO_STATUS].map(x => `<option value="${x}" ${X.status===x?"selected":""}>${x || "Not set"}</option>`).join("")}</select></label>
        <label class="f" for="pd-agent">Agent or representation (optional)<input type="text" id="pd-agent" name="agent" maxlength="80" value="${esc(X.agent || "")}" placeholder="e.g. None, or the agency's name"></label>
        <label class="f" for="pd-nat">Nationality<input type="text" id="pd-nat" name="nationality" maxlength="80" value="${esc(X.nationality || "")}" placeholder="e.g. USA, Netherlands"></label>
        <label class="f" for="pd-league">Club league<select id="pd-league" name="league">${["", ...LEAGUES].map(l => `<option value="${l}" ${R.league===l?"selected":""}>${l || "Not set"}</option>`).join("")}</select></label>
      </div>
      <fieldset class="plain"><legend class="small"><b>Levels you're interested in</b></legend>
        <div class="chips">${PRO_LEVELS.map((d,i) => `<label class="chipbox"><input type="checkbox" name="level" value="${d}" id="pd-lv-${i}" ${lv.includes(d)?"checked":""}><span>${d}</span></label>`).join("")}</div></fieldset>
      <label class="check" for="pd-trials"><input type="checkbox" id="pd-trials" name="trials" ${X.trials ? "checked" : ""}> Open to trials</label>
      <label class="check" for="pd-reloc"><input type="checkbox" id="pd-reloc" name="relocate" ${X.relocate ? "checked" : ""}> Willing to relocate</label>
      <h3 class="form-sec">Physical & contact</h3>
      <div class="grid2" style="gap:14px">
        <label class="f" for="pd-foot">Stronger foot<select id="pd-foot" name="foot">${["","Right","Left","Both"].map(f => `<option value="${f}" ${pr.foot===f?"selected":""}>${f || "Not set"}</option>`).join("")}</select></label>
        <label class="f" for="pd-h">Height<input type="text" id="pd-h" name="height" maxlength="20" value="${esc(R.height || "")}" placeholder="e.g. 5'10&quot;"></label>
        <label class="f" for="pd-w">Weight (optional)<input type="text" id="pd-w" name="weight" maxlength="20" value="${esc(R.weight || "")}" placeholder="e.g. 160 lb"></label>
        <label class="f" for="pd-loc">Location<input type="text" id="pd-loc" name="location" maxlength="60" value="${esc(R.location || "")}" placeholder="City and state"></label>
      </div>
      <label class="f" for="pd-mail">Contact email for coaches and scouts (optional)<input type="email" id="pd-mail" name="contact" maxlength="120" value="${esc(R.contact || "")}" placeholder="A parent's email is best"></label>
      <label class="choice" for="pd-search"><input type="checkbox" id="pd-search" name="searchable" ${X.searchable ? "checked" : ""}><span><b>Let approved pro scouts find this profile in ${APP_NAME}</b><br><span class="small muted">${SECTIONS.pro.by} can search for it and send you a message. Only works while the profile is Public. Turn it off any time.</span></span></label>
      <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  youthDetails: ds => { const p = S.players.find(x => x.id === ds.player); if(!p) return "<p>Player not found.</p>";
    const pr = profileFor(p.id) || {}, R = pr.recruit || {}, X = R.youth || {}, lv = X.levels || [], lk = X.looking || [], adult = playerAge(p) != null && playerAge(p) >= RECRUIT_AGE;
    return `<h2>Youth club details</h2><form data-form="youthDetails" data-id="${esc(p.id)}">
      <label class="f" for="yd-sum">About ${esc(p.name)}<textarea id="yd-sum" name="summary" maxlength="800" rows="4" placeholder="Playing style, strengths, what ${esc(p.name)} enjoys, and the kind of team you're looking for.">${esc(R.summary || "")}</textarea><span class="small muted">Shared with the other sections.</span></label>
      <fieldset class="plain"><legend class="small"><b>Looking for</b></legend>
        <div class="chips">${YOUTH_LOOKING.map((d,i) => `<label class="chipbox"><input type="checkbox" name="looking" value="${d}" id="yd-lk-${i}" ${lk.includes(d)?"checked":""}><span>${d}</span></label>`).join("")}</div></fieldset>
      <fieldset class="plain"><legend class="small"><b>Level you want to play</b></legend>
        <div class="chips">${YOUTH_LEVELS.map((d,i) => `<label class="chipbox"><input type="checkbox" name="level" value="${d}" id="yd-lv-${i}" ${lv.includes(d)?"checked":""}><span>${d}</span></label>`).join("")}</div></fieldset>
      <div class="grid2" style="gap:14px">
        <label class="f" for="yd-now">Plays now (optional)<input type="text" id="yd-now" name="currentLevel" maxlength="80" value="${esc(X.currentLevel || "")}" placeholder="e.g. U12 travel, first division"></label>
        <label class="f" for="yd-area">Area<input type="text" id="yd-area" name="area" maxlength="60" value="${esc(X.area || "")}" placeholder="City or neighborhood, e.g. West Chester, OH"></label>
        <label class="f" for="yd-travel">How far you can travel (optional)<input type="text" id="yd-travel" name="travel" maxlength="40" value="${esc(X.travel || "")}" placeholder="e.g. Up to 30 minutes"></label>
        <label class="f" for="yd-avail">Available from (optional)<input type="text" id="yd-avail" name="available" maxlength="40" value="${esc(X.available || "")}" placeholder="e.g. Fall season, or now"></label>
        <label class="f" for="yd-foot">Stronger foot<select id="yd-foot" name="foot">${["","Right","Left","Both"].map(f => `<option value="${f}" ${pr.foot===f?"selected":""}>${f || "Not set"}</option>`).join("")}</select></label>
        <label class="f" for="yd-h">Height (optional)<input type="text" id="yd-h" name="height" maxlength="20" value="${esc(R.height || "")}"></label>
      </div>
      <label class="choice" for="yd-search"><input type="checkbox" id="yd-search" name="searchable" ${X.searchable ? "checked" : ""}><span><b>Let club coaches find ${esc(p.name)} in ${APP_NAME}</b><br><span class="small muted">${SECTIONS.youth.by} can search for this profile and send you a message. ${adult ? "" : `They see <b>${esc(shortName(p.name))}</b> and the birth year, never the full name or date of birth, and there is no public link. `}They see the photo, positions, the details above, videos, highlights, stats, club history and coach references. Coaches at ${esc(p.name)}'s current club don't see the listing in their search. Turn it off any time.</span></span></label>
      <div class="row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="close">Cancel</button></div></form>`; },
  youthProfile: () => { const Y = S.youthView; if(!Y) return "<p>Profile not found.</p>"; const r = camel(Y.card || {}), yo = r.youth || {};
    const facts = [["Born", r.birthYear], ["Area", yo.area], ["Can travel", yo.travel], ["Available", yo.available], ["Plays now", yo.currentLevel], ["Stronger foot", r.foot], ["Height", r.height], ["Club", r.clubName]].filter(x => x[1]);
    const vids = Y.videos || [], hls = Y.highlights || [], stats = Y.stats || [], refs = Y.refs || [], hist = Y.history || [];
    return `<div class="scout-top">${scoutPhoto(r)}<div class="stack" style="gap:2px"><span class="eyebrow">Youth clubs · Recruitment Profile</span><h2>${esc(r.name)}</h2></div></div>
      <div class="chips" style="margin-top:10px">${scoutChips(r, "youth")}</div>
      ${facts.length ? `<div class="facts" style="margin-top:10px">${facts.map(([k,v]) => `<div class="fact"><span class="small muted">${k}</span><b>${esc(v)}</b></div>`).join("")}</div>` : ""}
      ${Y.summary ? `<p style="margin-top:10px">${esc(Y.summary)}</p>` : ""}
      ${(Y.strengths || []).length ? `<div class="chips">${Y.strengths.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
      ${vids.length ? `<h3 class="form-sec">Highlight videos</h3><div class="list">${vids.map(v => v.asset ? `<video controls preload="metadata" src="${esc(blobUrl(v.asset))}" style="width:100%;border-radius:10px"></video>` : `<a class="vlink" href="${esc(v.link)}" target="_blank" rel="noopener noreferrer">▶ ${esc(v.title || "Highlights")} on ${esc(hostOf(v.link))}</a>`).join("")}</div>` : ""}
      ${hls.length ? `<h3 class="form-sec">Career highlights</h3><div class="list">${hls.map(h => `<div class="hl"><div class="row between"><b>🏆 ${esc(h.title)}</b><span class="small muted num">${esc(h.year || "")}</span></div>${h.details ? `<p class="small muted">${esc(h.details)}</p>` : ""}</div>`).join("")}</div>` : ""}
      ${stats.length ? `<h3 class="form-sec">Season stats</h3><div class="tbl-wrap"><table class="stats"><thead><tr><th>Season</th><th>Team</th><th class="num">GP</th><th class="num">G</th><th class="num">A</th></tr></thead><tbody>${stats.map(x => `<tr><td>${esc(x.season)}</td><td>${esc(x.team || "")}</td><td class="num">${esc(x.games ?? "")}</td><td class="num">${esc(x.goals ?? "")}</td><td class="num">${esc(x.assists ?? "")}</td></tr>`).join("")}</tbody></table></div>` : ""}
      ${hist.length ? `<h3 class="form-sec">Club history</h3><div class="list">${hist.map(h => `<div class="row between"><span><b>${esc(h.club)}</b>${h.team ? ` <span class="small muted">${esc(h.team)}</span>` : ""}</span><span class="small muted num">${esc(h.from || "")}${h.to ? " – " + esc(h.to) : ""}</span></div>`).join("")}</div>` : ""}
      ${refs.length ? `<h3 class="form-sec">Coach references</h3>${refs.map(c => `<div class="ref reference"><blockquote>${esc(c.text)}</blockquote><span class="small"><b>${esc(c.author_name || "Coach")}</b>${c.author_title ? ", " + esc(c.author_title) : ""}</span></div>`).join("")}` : ""}
      <div class="row" style="margin-top:14px">${r.contacted ? `<span class="pill good">Message sent</span>` : `<button class="btn primary" data-act="modal" data-m="interest" data-player="${esc(r.playerId)}">I'm interested</button>`}<button class="btn" type="button" data-act="close">Close</button></div>`; },
  recruitDetails: ds => { const p = S.players.find(x => x.id === ds.player); if(!p) return "<p>Player not found.</p>";
    const pr = profileFor(p.id) || {}, R = pr.recruit || {}, y = new Date().getFullYear(), divs = R.divisions || [];
    return `<h2>College details</h2><form data-form="recruitDetails" data-id="${esc(p.id)}">
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
  go: (ds, el) => { S.view = ds.view; S.preview = false; S.menuOpen = false; S.navOpen = null; S.navQuiet = !!(el && el.closest && el.closest(".nav-dd"));
    if(ds.team){ S.teamFilter = ds.team; S.view = "roster"; }
    if(ds.sec) S.rsec = ds.sec; if(S.publicPage){ S.publicPage = null; try { history.replaceState(null, "", location.pathname + location.search); } catch(_){} } window.scrollTo(0,0); render(); },
  open: ds => { S.playerId = ds.id; S.view = "player"; S.preview = false; S.chartSkill = "overall"; S.ptab = "dev"; S.recSec = null; window.scrollTo(0,0); render(); },
  team: ds => { S.teamFilter = ds.id; render(); },
  cat: ds => { S.catFilter = ds.id; render(); },
  child: ds => { S.childId = ds.id; render(); },
  preview: () => { S.preview = !S.preview; render(); },
  modal: ds => { const f = MODALS[ds.m]; if(f) openModal(f(ds)); },
  close: () => closeModal(),
  closeBg: (ds, el, ev) => { if(ev.target === el) closeModal(); },
  copy: async ds => { try { await navigator.clipboard.writeText(ds.text); toast(ds.label ? ds.label + " copied" : "Copied " + ds.text); } catch(_){ toast("Copy didn't work here. Select it and copy: " + ds.text); } },
  copyField: async ds => {
    const f = document.getElementById(ds.for); if(!f) return;
    f.focus(); f.select();
    try { await navigator.clipboard.writeText(f.value); toast((ds.label || "Link") + " copied. Paste it in a text, email or team chat."); }
    catch(_){ try { document.execCommand("copy"); toast((ds.label || "Link") + " copied."); } catch(__){ toast("Press Ctrl+C (or Cmd+C) to copy the selected link."); } }
  },
  done: async ds => {
    const a = S.assignments.find(x => x.id === ds.id); if(!a) return;
    const t = today(); const had = (a.done||[]).includes(t);
    await save(async () => { const {error} = await sb.rpc("toggle_done", {aid:a.id, d:t}); if(error) throw dbErr(error); schedule("assignments"); }, had ? "Unmarked" : "Nice work! Logged for today.");
  },
  unassign: async ds => { await save(() => S.db.doc("assignments/" + ds.id).delete(), "Drill removed"); },
  delDrill: async ds => { await save(() => S.db.doc("drills/" + ds.id).delete(), "Drill deleted"); },
  delTeam: async ds => { if(S.teamFilter === ds.id) S.teamFilter = "all"; await save(() => S.db.doc("teams/" + ds.id).delete(), "Team deleted"); },
  delReview: async (ds, el) => {
    await save(() => S.db.doc("reviews/" + ds.id).delete(), "Review deleted");
  },
  removeFromClub: async ds => {
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
  setPlan: async ds => { if(!isAdmin()) return; const plan = ds.id === "unlimited" ? "unlimited" : "team";
    const ok = await save(() => S.db.doc("clubs/" + S.club.id).update({plan}), "You're now on " + planName(plan));
    if(ok){ S.club = {...S.club, plan}; render(); schedule("club"); } },
  scoutClear: () => { S.scout = {f:{}}; runScout(); },
  rsec: ds => { S.rsec = ds.id; render(); },
  rview: ds => { S.rview = ds.id; render(); },
  youthOpen: async ds => {
    try { S.youthView = await rpc("youth_profile", {pid:ds.player}); openModal(MODALS.youthProfile()); }
    catch(e){ console.error(e); toast((e && e.message) || "This profile can't be opened right now."); }
  },
  decideScout: async ds => {
    const ok = await save(() => rpc("decide_scout", {sid:ds.id, approve:!!ds.ok}), ds.ok ? "Scout approved. They can search now." : "Done. They can't search for players.");
    if(ok) schedule("scouts");
  },
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
    await saveProfile(p, {recruit:{...R, created:true}, visibility:"private"}, playerAge(p) != null && playerAge(p) >= RECRUIT_AGE ? "Recruitment Profile created. It's private and unlisted until you change that." : "Recruitment Profile created. Nobody can find it until you turn on youth club search.");
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

/* team invites: look up the team and club name (works before sign-in) */
async function loadInviteInfo(){
  const iv = S.invite;
  if(!iv || iv.kind !== "team" || iv.info || !sb) return;
  try {
    const d = await rpc("team_invite_info", {p_team: iv.teamId});
    if(S.invite !== iv) return;
    if(d){ iv.info = d; saveInvite(iv); }
    else { saveInvite(null); toast("That invite link doesn't work anymore. Ask your coach for a new one.", true); }
  } catch(_){ /* update 020 not run yet: the family can still search by name */ }
  render();
}
/* once signed in and loaded, act on an invite link */
function applyInvite(){
  const iv = S.invite; if(!iv || !S.me || S.loading || S.inviteBusy) return;
  if(iv.kind === "coach"){
    if(isStaff() && S.club){
      if(String(S.club.code).toUpperCase() !== iv.code) toast(`You're already in ${S.club.name}. To join another club, leave this one under Club first.`, true);
      saveInvite(null); return;
    }
    if(!isStaff()){ toast("That link is for coaches joining a club. You're signed in with a different kind of account.", true); saveInvite(null); }
    return; /* coach without a club: the setup screen has the code filled in */
  }
  if(iv.kind === "team"){
    if(S.me.role !== "family"){ toast(`That's a family invite link${iv.info ? " for " + iv.info.team_name : ""}. Families open it to ask to join.`, true); saveInvite(null); return; }
    if(!iv.info) return;
    const kids = S.players.filter(p => (S.me.playerIds || []).includes(p.id));
    if(!kids.length) return; /* no player yet: the setup form has the team picked */
    const on = kids.filter(p => p.teamId === iv.info.team_id);
    const free = kids.filter(p => p.teamId !== iv.info.team_id && !pendingFor(p.id));
    saveInvite(null);
    if(!free.length){ toast(on.length ? `${on[0].name} is already on ${iv.info.team_name}.` : "Your player already has a request waiting. Cancel it first to ask a different team.", !on.length); return; }
    const pick = free.find(p => !p.clubId) || free.find(p => p.id === S.childId) || free[0];
    S.find = {pid: pick.id, q:"", results:null, pick:{clubId:iv.info.club_id, clubName:iv.info.club_name, teamId:iv.info.team_id, teamName:iv.info.team_name}, choose: free.length > 1 ? free.map(p => p.id) : null};
    S.inviteBusy = true; setTimeout(() => { S.inviteBusy = false; openModal(findTeamModal()); }, 0);
  }
}
function inviteBanner(){
  const iv = S.invite; if(!iv) return "";
  if(iv.kind === "coach") return `<div class="card stack invite-banner"><h2 class="h3">You're invited to coach on ${APP_NAME}</h2><p class="small">Create your account or sign in. Your club code <b class="code">${esc(iv.code)}</b> is filled in for you on the next step.</p></div>`;
  return `<div class="card stack invite-banner"><h2 class="h3">${iv.info ? `You're invited to join ${esc(iv.info.team_name)} at ${esc(iv.info.club_name)}` : "You're invited to join a team"}</h2><p class="small">Create your account or sign in. The team is picked for you; a coach approves the request.</p></div>`;
}
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
    if(ok){ saveInvite(null); toast("Welcome to " + name); await loadMe(); }
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
    const baseline = BASELINES.some(b => b.k === fd.get("baseline")) ? fd.get("baseline") : "";
    if(!baseline){ toast("Pick what the ratings are compared with: age group, league, team or higher level.", true); return; }
    closeModal();
    const row = {clubId:S.me.clubId, playerId:form.dataset.id, coachId:S.uid, coachName:S.me.name||"", date:fd.get("date")||today(), ratings, strengths, improve, note:fd.get("note").trim(), summary:String(fd.get("summary")||"").trim().slice(0,280), baseline, createdAt:Date.now()};
    await save(async () => {
      try { await S.db.collection("reviews").doc().set(row); }
      catch(e){
        if(/baseline/i.test(e.message||"")){
          const {baseline:_b, ...rest} = row;
          await S.db.collection("reviews").doc().set(rest);
          toast("Saved without the “rate against” choice. Ask your admin to run database update 019.", true);
          return;
        }
        if(!/summary/i.test(e.message||"")) throw e;
        const {summary, ...rest} = row;
        await S.db.collection("reviews").doc().set({...rest, note: (summary ? "Update: " + summary + (rest.note ? "\n\n" + rest.note : "") : rest.note)});
        toast("Saved. Ask your admin to run database update 002 so update notes get their own field.", true);
      }
    }, "Review saved. The previous one stays in the review history.");
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
  proDetails: async (fd, form) => {
    const p = S.players.find(x => x.id === form.dataset.id); if(!p) return;
    const pr = profileFor(p.id) || {}, R = pr.recruit || {}, g = k => String(fd.get(k) || "").trim();
    closeModal();
    await saveProfile(p, {foot:g("foot"), recruit:{...R, summary:g("summary").slice(0,800), height:g("height"), weight:g("weight"), location:g("location"), league:g("league"), contact:g("contact"),
      pro:{...(R.pro || {}), status:PRO_STATUS.includes(g("status")) ? g("status") : "", agent:g("agent"), nationality:g("nationality"), levels:fd.getAll("level").filter(d => PRO_LEVELS.includes(d)),
        trials:fd.get("trials") === "on", relocate:fd.get("relocate") === "on", searchable:fd.get("searchable") === "on"}}}, "Pro details saved");
  },
  youthDetails: async (fd, form) => {
    const p = S.players.find(x => x.id === form.dataset.id); if(!p) return;
    const pr = profileFor(p.id) || {}, R = pr.recruit || {}, g = k => String(fd.get(k) || "").trim();
    closeModal();
    await saveProfile(p, {foot:g("foot"), recruit:{...R, summary:g("summary").slice(0,800), height:g("height"),
      youth:{...(R.youth || {}), looking:fd.getAll("looking").filter(d => YOUTH_LOOKING.includes(d)), levels:fd.getAll("level").filter(d => YOUTH_LEVELS.includes(d)), currentLevel:g("currentLevel"),
        area:g("area"), travel:g("travel"), available:g("available"), searchable:fd.get("searchable") === "on"}}}, "Youth club details saved");
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
  clubSettings: async fd => { closeModal(); const plan = fd.get("plan") === "unlimited" ? "unlimited" : "team";
    const ch = {name:fd.get("name").trim(), familyAccess:fd.get("familyAccess"), plan};
    const ok = await save(() => S.db.doc("clubs/" + S.club.id).update(ch), "Club updated");
    if(ok){ S.club = {...S.club, ...ch}; render(); schedule("club"); } }
};

/* ---------- events ---------- */
/* actions that delete something: ask first, in plain words */
const CONFIRM = {
  delTeam: ["Delete this team?", "Players stay in your club but won't be on a team, and the team chat is deleted.", "Delete team"],
  delReview: ["Delete this review?", "It disappears from the player's review history for the family and every coach. This can't be undone.", "Delete review"],
  removeFromClub: ["Remove this player from your club?", "The family keeps the profile; your coaches lose access to it. They can ask to join again.", "Remove player"],
  delDrill: ["Delete this club drill?", "It's removed from your library and from any player it was assigned to.", "Delete drill"],
  unassign: ["Remove this drill from the player's week?", "Their progress on it this week is cleared.", "Remove drill"],
  delMsg: ["Delete this message?", "It's removed from the team chat for everyone.", "Delete message"],
  delPm: ["Delete this message?", "It's removed from the conversation for everyone.", "Delete message"],
  delOpp: ["Delete this opportunity?", "Families won't see it under Recruiting any more.", "Delete"],
  delPhoto: ["Remove the profile photo?", "You can add a new one at any time.", "Remove photo"],
  delVideo: ["Remove this video?", "It's removed from the profile. Uploaded files are deleted.", "Remove video"],
  delHistory: ["Remove this club from the history?", "", "Remove"],
  delHighlight: ["Remove this highlight?", "", "Remove"],
  delStat: ["Remove this season's stats?", "", "Remove"],
  delComment: ["Delete this comment?", "It's removed for the family and the other coaches.", "Delete"]
};
let confirmed = null;
/* dropdowns: one open at a time; click outside or Escape closes */
ACTS.setLang = ds => setLang(ds.id);
ACTS.recSec = ds => { S.rsec = ds.id; S.recAll = false; render(); const b = document.querySelector(`[data-act="recSec"][data-id="${ds.id}"]`); if(b) b.focus(); };
ACTS.recKind = ds => {
  const sec = curSec(), cur = recKinds(sec).slice(), i = cur.indexOf(ds.id);
  if(i >= 0) cur.splice(i, 1); else cur.push(ds.id);
  S.recKinds = {...(S.recKinds || {}), [sec]: cur}; render();
  const b = document.querySelector(`[data-act="recKind"][data-id="${ds.id}"]`); if(b) b.focus();
};
ACTS.recAll = () => { S.recAll = true; render(); };
ACTS.recClearQ = () => { S.recQ = ""; render(); const el = document.getElementById("rec-q"); if(el) el.focus(); };
FORMS.recSearch = async fd => { S.recQ = String(fd.get("q") || ""); S.recAll = false; render(); const el = document.getElementById("rec-q"); if(el) el.focus(); };
ACTS.ptdPhase = ds => { S.ptdPhase = ds.id; render(); const b = document.querySelector(`[data-act="ptdPhase"][data-id="${CSS.escape(ds.id)}"]`); if(b) b.focus(); };
ACTS.ptdLevel = ds => { S.ptdLevel = ds.id; render(); const b = document.querySelector(`[data-act="ptdLevel"][data-id="${CSS.escape(ds.id)}"]`); if(b) b.focus(); };
ACTS.navDd = ds => { S.navOpen = S.navOpen === ds.g ? null : ds.g; render(); const b = document.querySelector(`.nav-dd-btn[data-g="${ds.g}"]`); if(b) b.focus(); };
document.addEventListener("click", ev => {
  if(S.navOpen && !ev.target.closest(".nav-dd")){ S.navOpen = null; render(); }
  if(S.notifOpen && !ev.target.closest(".notif-wrap")){ S.notifOpen = false; render(); }
  if(S.reactFor && !ev.target.closest(".reacts") && !ev.target.closest(".bubble[data-rk]")){ S.reactFor = null; render(); }
}, true);
/* reactions: a mouse click on a message opens the emoji; on a phone, press and hold */
let rxPress = null, rxLastPointer = "mouse", rxHeld = false;
document.addEventListener("pointerdown", ev => {
  rxLastPointer = ev.pointerType || "mouse"; rxHeld = false;
  const b = ev.target.closest(".bubble[data-rk]"); if(!b || ev.pointerType === "mouse") return;
  clearTimeout(rxPress && rxPress.t);
  rxPress = {x:ev.clientX, y:ev.clientY, t:setTimeout(() => {
    rxHeld = true; rxPress = null;
    try { if(navigator.vibrate) navigator.vibrate(12); } catch(_){}
    const sel = window.getSelection && window.getSelection(); if(sel) sel.removeAllRanges();
    openReact(b.dataset.rk, b.dataset.rid);
  }, 450)};
});
const rxCancel = ev => { if(rxPress && (!ev || ev.type !== "pointermove" || Math.hypot(ev.clientX - rxPress.x, ev.clientY - rxPress.y) > 10)){ clearTimeout(rxPress.t); rxPress = null; } };
["pointerup","pointercancel","pointermove"].forEach(t => document.addEventListener(t, rxCancel, {passive:true}));
document.addEventListener("contextmenu", ev => { if(rxHeld || ev.target.closest(".bubble[data-rk]") && rxLastPointer !== "mouse") ev.preventDefault(); });
document.addEventListener("click", ev => {
  const b = ev.target.closest(".bubble[data-rk]"); if(!b) return;
  if(rxLastPointer !== "mouse" && rxLastPointer !== "pen") return;      /* phones: press and hold instead of a tap */
  const sel = window.getSelection && window.getSelection();
  if(sel && String(sel).trim() && b.contains(sel.anchorNode)) return;     /* selecting text to copy, not reacting */
  openReact(b.dataset.rk, b.dataset.rid);
});
function openReact(kind, id){
  const key = kind + ":" + id;
  S.reactFor = S.reactFor === key ? null : key; render();
  const el = document.querySelector(S.reactFor ? `.react-pick [data-id="${CSS.escape(id)}"]` : `.react-add[data-id="${CSS.escape(id)}"]`);
  if(el) el.focus({preventScroll:true});
}
/* after picking from a hover menu, keep it shut until the mouse leaves it */
document.addEventListener("mouseover", ev => {
  if(S.navQuiet && !ev.target.closest(".nav-dd")){ S.navQuiet = false; document.querySelectorAll("#app-nav, #site-nav").forEach(n => n.classList.remove("dd-quiet")); }
});
document.addEventListener("keydown", ev => {
  if(ev.key === "Escape" && S.notifOpen){ S.notifOpen = false; render(); const b = document.querySelector(".bell-btn"); if(b) b.focus(); return; }
  if(ev.key === "Escape" && S.reactFor){ const id = S.reactFor.split(":")[1]; S.reactFor = null; render(); const b = document.querySelector(`.react-add[data-id="${CSS.escape(id)}"]`); if(b) b.focus({preventScroll:true}); return; }
  if(ev.key === "Escape" && S.navOpen){ const g = S.navOpen; S.navOpen = null; render(); const b = document.querySelector(`.nav-dd-btn[data-g="${g}"]`); if(b) b.focus(); }
});

ACTS.openRec = ds => { S.playerId = ds.id; S.view = "player"; S.preview = false; S.ptab = "recruit"; S.recSec = ds.sec; window.scrollTo(0,0); render(); };
ACTS.delOpp = async ds => { const ok = await save(() => S.db.doc("opps/" + ds.id).delete(), "Opportunity deleted"); if(ok) schedule("opps"); };
ACTS.oppClear = () => { S.oppKind = ""; S.oppGender = ""; S.oppQ = ""; render(); };
ACTS.reactOpen = ds => openReact(ds.k, ds.id);
ACTS.react = async ds => {
  const id = ds.id + ":" + S.uid, cur = S.reactions.find(r => r.id === id), off = cur && cur.emoji === ds.e;
  /* show it at once, then save; a failed save reloads the real state */
  const before = S.reactions;
  S.reactions = S.reactions.filter(r => r.id !== id);
  if(!off) S.reactions = [{id, messageId:ds.id, kind:ds.k, userId:S.uid, userName:S.me.name || "", emoji:ds.e, createdAt:Date.now()}, ...S.reactions];
  S.reactFor = null; render();
  const back = document.querySelector(`.react-add[data-id="${CSS.escape(ds.id)}"]`); if(back) back.focus({preventScroll:true});
  const ok = await save(() => off ? S.db.doc("reactions/" + id).delete()
    : S.db.collection("reactions").doc(id).set({messageId:ds.id, kind:ds.k, userId:S.uid, userName:S.me.name || "", emoji:ds.e}));
  if(!ok){ S.reactions = before; schedule("reactions"); render(); }
};
ACTS.hideSetup = () => { try { localStorage.setItem("np-setup-hidden-" + S.club.id, "1"); } catch(_){} render(); const b = document.querySelector('[data-act="showSetup"]'); if(b) b.focus(); };
ACTS.showSetup = () => { try { localStorage.removeItem("np-setup-hidden-" + S.club.id); } catch(_){} render(); const b = document.querySelector('[data-act="hideSetup"]'); if(b) b.focus(); };
ACTS.confirmGo = () => { const c = confirmed; confirmed = null; closeModal(); if(c) ACTS[c.act](c.ds, c.el, null); };
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]"); if(!el) return;
  const f = ACTS[el.dataset.act]; if(!f) return;
  const ask = CONFIRM[el.dataset.act];
  if(ask){
    ev.preventDefault();
    confirmed = {act: el.dataset.act, ds: {...el.dataset}, el};
    const back = document.getElementById("modal").innerHTML ? null : el;
    openModal(`<h2>${ask[0]}</h2>${ask[1] ? `<p>${ask[1]}</p>` : ""}<div class="confirm-actions"><button type="button" class="btn danger solid" data-act="confirmGo">${ask[2]}</button><button type="button" class="btn" data-act="close">Cancel</button></div>`);
    if(back) modalReturn = back;
    return;
  }
  if(el.dataset.act === "closeBg" && ev.target !== el) return;
  ev.preventDefault(); f(el.dataset, el, ev);
});
document.addEventListener("keydown", ev => {
  if(ev.key === "Escape" && document.getElementById("modal").innerHTML) closeModal();
  if(ev.key === "Enter" && !ev.shiftKey && !ev.isComposing && (ev.target.id === "chat-input" || ev.target.id === "pm-input")){ ev.preventDefault(); const f = ev.target.form; if(f) f.requestSubmit(); return; }
  if((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches("tr[data-act]")){ ev.preventDefault(); (ACTS[ev.target.dataset.act] || ACTS.open)(ev.target.dataset); }
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
/* invite links: one click selects the whole link */
document.addEventListener("focusin", ev => { if(ev.target.matches && ev.target.matches("input[data-select-all]")) setTimeout(() => ev.target.select(), 0); });
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
  if(ev.target.name === "baseline" && ev.target.form && ev.target.form.dataset.form === "review"){
    const help = ev.target.form.querySelector("#bl-help"), b = BASELINES.find(x => x.k === ev.target.value);
    if(help && b){ const lastB = help.dataset.last; help.textContent = b.help + "." + (lastB && lastB !== b.k ? ` The last review was rated against ${(BASELINES.find(x => x.k === lastB) || {}).label.toLowerCase()}, so changes may partly reflect the new comparison.` : lastB ? " Same as the last review." : ""); }
  }
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
  if(ev.target.dataset && ev.target.dataset.change === "invTeam"){ S.invTeam = ev.target.value; render(); const el = document.querySelector(".inv-team"); if(el) el.focus(); return; }
  if(ev.target.dataset && ev.target.dataset.change === "childSel"){
    if(ev.target.value === "__add"){ ev.target.value = S.childId || ev.target.options[0].value; openModal(MODALS.addChild({})); return; }
    S.childId = ev.target.value; render(); const el = document.getElementById("sel-player"); if(el) el.focus(); return; }
  if(ev.target.dataset && (ev.target.dataset.change === "oppKind" || ev.target.dataset.change === "oppGender")){ S[ev.target.dataset.change] = ev.target.value; render(); const el = document.getElementById(ev.target.id); if(el) el.focus(); return; }
  if(ev.target.dataset && ev.target.dataset.change === "chatTeam"){ S.chatTeam = ev.target.value; render(); return; }
  if(ev.target.dataset && ev.target.dataset.change === "chartSkill"){ S.chartSkill = ev.target.value; render(); const s = document.getElementById("chart-skill"); if(s) s.focus(); }
});


/* ---------- public site pages (menu next to the logo) ---------- */
const PRICES = {club:"$19.99", clubPer:"per month, per team", unlimited:"$199", unlimitedPer:"per month, unlimited teams", family:"$4.99", familyPer:"per month, per player"};
const PRICE_NUM = {team:19.99, unlimited:199};
const money = n => "$" + n.toFixed(2).replace(/\.00$/, "");
/* the club's plan and what it costs this month */
function planInfo(){
  const plan = S.club && S.club.plan === "unlimited" ? "unlimited" : "team", n = (S.teams || []).length;
  const perTeam = Math.round(n * PRICE_NUM.team * 100) / 100;
  return {plan, n, perTeam, cost: plan === "unlimited" ? PRICE_NUM.unlimited : perTeam, save: Math.round((perTeam - PRICE_NUM.unlimited) * 100) / 100};
}
const planName = k => k === "unlimited" ? "Club Unlimited" : "Club (per team)";
const CLUB_FEATURES = `<li>Player and keeper reviews</li><li>Progress timelines</li><li>Drill library and session planner</li><li>Team chat</li><li>Optional Home Training for all</li>`;
const FEATURE_PAGES = ["drills","team-drills","clubs","recruiting"];
const PUBLIC_PAGES = [
  ["how-it-works","How it works"], ["drills","Home Drills"], ["team-drills","Team Drills"], ["clubs","Clubs & Teams"], ["recruiting","Recruiting"],
  ["pricing","Pricing"], ["contact","Contact Us"]
];
const FOOTER_PAGES = [["safety","Safety"],["privacy","Privacy"],["terms","Terms"],["accessibility","Accessibility"]];
const PAGE_IDS = PUBLIC_PAGES.concat(FOOTER_PAGES, [["for-parents"]]).map(p => p[0]);   /* #for-parents: the parents section of How it works (older links) */

function publicNav(){
  const cur = S.publicPage === "for-parents" ? "how-it-works" : S.publicPage;   /* the parents section lives on How it works */
  const link = ([id,label]) => `<a href="#${id}" class="navlink" ${cur===id?'aria-current="page"':""}>${label}</a>`;
  /* Home Drills, Team Drills, Clubs & Teams and Recruiting sit under one "Features" menu, after How it works */
  const feat = PUBLIC_PAGES.filter(([id]) => FEATURE_PAGES.includes(id)), open = S.navOpen === "features";
  const features = `<div class="nav-dd${open ? " open" : ""}">
      <button type="button" class="nav-dd-btn navlink${feat.some(([id]) => id === cur) ? " cur" : ""}" data-act="navDd" data-g="features" aria-expanded="${open}" aria-controls="dd-features">Features<span class="dd-chev" aria-hidden="true"></span></button>
      <div class="nav-dd-menu" id="dd-features" ${open ? "" : "hidden"}>${feat.map(link).join("")}</div></div>`;
  const rest = PUBLIC_PAGES.filter(([id]) => !FEATURE_PAGES.includes(id));
  const links = link(rest[0]) + features + rest.slice(1).map(link).join("");   /* How it works, Features, Pricing, Contact */
  return `<button type="button" class="menu-btn" data-act="menu" aria-expanded="${!!S.menuOpen}" aria-controls="site-nav">${S.menuOpen ? "Close" : "Menu"}</button>
    <nav id="site-nav" class="site-nav${S.menuOpen ? " open" : ""}${S.navQuiet ? " dd-quiet" : ""}" aria-label="Site">${links}${langToggle("navlink")}<a href="#signin" class="btn primary sm nav-signin">Sign in</a></nav>`;
}
function siteFooter(){
  const col = (h, links) => `<div class="fcol"><h2 class="fh">${h}</h2>${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</div>`;
  return `<footer class="site-foot"><div class="foot-in">
    <div class="fbrand stack" style="gap:8px"><span class="brand small-brand" aria-label="${APP_NAME}">${logoHtml()}</span>
      <p class="small muted">Coach reviews, at-home training and recruiting for youth soccer.</p></div>
    <nav class="fcols" aria-label="Footer">
      ${col("Product", [["#how-it-works","How it works"],["#drills","Home drills"],["#team-drills","Team drills"],["#recruiting","Recruiting"],["#pricing","Pricing"]])}
      ${col("Who it's for", [["#clubs","Clubs, leagues & trainers"],["#for-parents","Parents & players"],["#college","College coaches"],["#pro","Pro scouts"]])}
      ${col("Company", [["#contact","Contact us"],["#safety","Safety"],["#accessibility","Accessibility"],["#privacy","Privacy Policy"],["#terms","Terms of Use"]])}
    </nav>
  </div><div class="foot-base"><span class="small muted">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</span><a class="small" href="#signin">Sign in</a></div></footer>`;
}
const cta = (coachLabel = "Start your club", famLabel = "I'm a parent or player") => `<div class="row cta-row">
  <button type="button" class="btn primary" data-act="pickPortal" data-id="coach" data-mode="signup">${coachLabel}</button>
  <button type="button" class="btn" data-act="pickPortal" data-id="family" data-mode="signup">${famLabel}</button></div>`;
const feature = (title, text) => `<div class="card stack feature"><h2 class="h3">${title}</h2><p class="muted">${text}</p></div>`;

function publicPage(){
  switch(S.publicPage){
    case "how-it-works": return pageHow();
    case "drills": return pageDrills();
    case "team-drills": return pageTeamDrills();
    case "clubs": return pageClubs();
    case "recruiting": return pageRecruiting();
    case "for-parents": return pageHow();
    case "pricing": return pagePricing();
    case "contact": return pageContact();
    case "safety": return pageSafety();
    case "privacy": return legalPage("privacy");
    case "terms": return legalPage("terms");
    case "accessibility": return pageAccessibility();
  }
  return "";
}

function pageHow(){
  const step = (n, title, text) => `<div class="step"><span class="step-n">${n}</span><div class="stack" style="gap:4px"><b>${title}</b><p class="muted">${text}</p></div></div>`;
  return `<section class="page-hero stack"><span class="eyebrow">How it works</span>
    <h1>From the coach's notes to practice at home</h1>
    <p class="lead">What the coach sees at training becomes what the player works on at home.</p></section>
  <div class="grid2">
    <div class="card stack"><h2>For coaches and clubs</h2>
      ${step(1,"Create your club","Sign up and share your club code with your coaches.")}
      ${step(2,"Add your teams","Families ask to join. You approve.")}
      ${step(3,"Review and assign","Rate each player, add a note, assign drills.")}
    </div>
    <div class="card stack"><h2>For parents and players</h2>
      ${step(1,"Create a profile","Sign up as a parent or player. No code needed.")}
      ${step(2,"Join your team","Find your club, pick your team, send a request.")}
      ${step(3,"Train at home","See each review and tick off the drills picked for you.")}
    </div>
  </div>
  <div class="grid3">
    ${feature("Reviews that show progress","Ratings, strengths and a note after every review. Every review is saved, so families see what improved.")}
    ${feature("Drills picked for each player","Based on the lowest ratings and the coach's notes. About 15 minutes at home, ticked off each week.")}
    ${feature("Team chat",`Schedule changes and announcements in one place. Chats are monitored by the club and ${APP_NAME}.`)}
  </div>
  <section id="for-parents-sec" class="card stack callout" aria-labelledby="h-parents" tabindex="-1">
    <span class="eyebrow">For parents</span>
    <h2 id="h-parents">Know what your child is working on</h2>
    <p>See the coach's feedback and help with the right drills at home.</p>
    <div class="grid2">
      <div class="stack" style="gap:4px"><b>Private and safe</b><p class="muted">Only your family and your child's coaches see reviews. <a href="#safety">How we keep players safe</a></p></div>
      <div class="stack" style="gap:4px"><b>Recruiting when ready</b><p class="muted">Youth clubs at any age, colleges and scouts from ${RECRUIT_AGE}. <a href="#recruiting">How recruiting works</a></p></div>
    </div>
  </section>
  ${cta()}`;
}

function paywallBanner(){
  const n = BUILTIN_DRILLS.length, free = BUILTIN_DRILLS.filter(d => d.free).length;
  return `<div class="card paywall stack">
    <div class="row between"><h2>🔒 Full instructions come with Home Training</h2><span class="pill good">${free} free sample drills</span></div>
    <p>Try the free samples. Full steps for every drill come with <b>Home Training</b>, or free when your club includes it.</p>
    <div class="row">${S.uid ? `<button class="btn primary" data-act="go" data-view="plans">See Home Training</button>` : `<button class="btn primary" data-act="pickPortal" data-id="family">Sign up as a family</button><a class="btn" href="#pricing">See pricing</a>`}</div>
  </div>`;
}
function pageDrills(){
  const list = BUILTIN_DRILLS;
  return `<section class="page-hero stack"><span class="eyebrow">Home Drills</span>
    <h1>${BUILTIN_DRILLS.length} solo drills for ages 10 to 18</h1>
    <p class="lead">All you need is a ball, a few cones and a wall. Every drill has clear steps, from Beginner to Advanced.</p></section>
  ${paywallBanner()}
  ${drillLibraryHtml(list)}
  <div class="card stack callout"><h2>Get drills picked for you</h2><p>When your coach reviews you, we suggest drills for exactly what they flagged.</p>${cta("Start as a coach","Sign up as a parent or player")}</div>`;
}

/* public Team Drills page: the whole library with diagrams; full instructions for a few samples,
   all of them for coaches (they come with a club or team plan) */
const TD_SAMPLE_IDS = (() => { const ids = []; for(const ph of ["Warm-up","Possession","Game"]){ const d0 = TEAM_DRILLS.find(d => d.phase === ph && d.level === "Beginner") || TEAM_DRILLS.find(d => d.phase === ph); if(d0) ids.push(d0.id); } return ids; })();
function pageTeamDrills(){
  const open = isStaff(), ph = S.ptdPhase || "All", lv = S.ptdLevel || "All";
  const list = TEAM_DRILLS.filter(dr => (ph === "All" || dr.phase === ph) && (lv === "All" || dr.level === lv))
    .sort((a, b) => TD_LEVELS.indexOf(a.level) - TD_LEVELS.indexOf(b.level) || PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase));
  const card = dr => {
    const sample = TD_SAMPLE_IDS.includes(dr.id), m = METHODS[dr.method] || {};
    return `<article class="drill tdrill">
      <div class="row between top-al"><h3>${esc(dr.title)}</h3><span class="row td-pills">${sample && !open ? `<span class="pill good">Free sample</span>` : ""}${lvlPill(dr)}<span class="pill plain">${esc(dr.phase)}</span></span></div>
      <div class="tdiag-w">${diagramSvg(dr)}</div>
      <div class="dmeta"><span>${esc(dr.minutes)} min</span><span>· ${esc(playersText(dr))}</span><span>· ${esc(dr.area)}</span><span>· Ages ${esc(dr.minAge)}+</span></div>
      <p class="dgoal">${esc(dr.summary)}</p>
      <div class="trains small"><span class="muted">Works on:</span> ${(dr.skills || []).map(k => esc(SKILL_LABEL[k] || k)).join(" · ")}</div>
      ${open || sample ? teamDrillDetails(dr) : `<p class="small muted td-lock">🔒 Set-up, steps and coaching points come with a club or team plan.${m.name ? ` Based on ${esc(m.name)}.` : ""}</p>`}
    </article>`;
  };
  return `<section class="page-hero stack"><span class="eyebrow">Team Drills</span>
    <h1>${TEAM_DRILLS.length} team drills for practice</h1>
    <p class="lead">Academy-style practices for coaches, from warm-ups and rondos to finishing and small-sided games. Each one shows the set-up on a diagram.</p></section>
  ${open ? "" : `<div class="card paywall stack">
    <div class="row between"><h2>🔒 Full instructions come with a club or team plan</h2><span class="pill good">${TD_SAMPLE_IDS.length} free sample drills</span></div>
    <p>Coaches get every drill with set-up, steps and coaching points, plus a session planner that suggests drills from your players' reviews.</p>
    <div class="row"><button class="btn primary" data-act="pickPortal" data-id="coach" data-mode="signup">Start as a coach</button><a class="btn" href="#pricing">See pricing</a></div></div>`}
  <div class="lib-tools stack">
    <div class="fchips" role="group" aria-label="Part of the session">${["All", ...PHASES].map(p => `<button type="button" class="fchip" data-act="ptdPhase" data-id="${esc(p)}" aria-pressed="${p === ph}">${esc(p === "All" ? "All parts" : p)}</button>`).join("")}</div>
    <div class="fchips" role="group" aria-label="Level">${["All", ...TD_LEVELS].map(l => `<button type="button" class="fchip" data-act="ptdLevel" data-id="${esc(l)}" aria-pressed="${l === lv}">${esc(l === "All" ? "All levels" : l)}</button>`).join("")}</div>
  </div>
  ${DIAGRAM_KEY}
  <p class="small muted" aria-live="polite">${list.length} drill${list.length === 1 ? "" : "s"}</p>
  <div class="dgrid tdgrid">${list.map(card).join("")}</div>
  <div class="card stack callout"><h2>Plan a practice in minutes</h2><p>Pick a team and the session planner suggests drills for what your players' reviews flagged.</p>${cta("Start as a coach","Sign up as a parent or player")}</div>`;
}
/* ---------- the public site: home, audiences, safety and legal ---------- */
const AUD_ICONS = {select:`<path d="M8 21h8M12 16v5M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4"/>`,rec:`<circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.8 2.8-1.4 4.4H9.6l-1.4-4.4z"/><path d="M12 3v4.5M20.6 9.3l-4.8 1M17.3 19.4l-2.9-4.7M6.7 19.4l2.9-4.7M3.4 9.3l4.8 1"/>`,trainers:`<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>`,coaches:`<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>`,parents:`<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.3"/><path d="M15.5 14.4A4.5 4.5 0 0 1 21 19"/>`,players:`<circle cx="12" cy="7.5" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>`,college:`<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3.5 2.3 8.5 2.3 12 0v-5M22 9v6"/>`,scouts:`<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20.5 20.5l-5.4-5.4"/>`};
const audIcon = id => `<span class="aud-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${AUD_ICONS[id] || ""}</svg></span>`;
const AUDIENCES = [
  {id:"select", title:"Select & travel clubs", text:"One review standard for every coach and age group.", link:["#clubs","For clubs"]},
  {id:"rec", title:"Recreational leagues", text:"Reviews a volunteer coach can do in minutes.", link:["#clubs","For rec programs"]},
  {id:"trainers", title:"Trainers & academies", text:"Written feedback and homework for every group.", link:["#clubs","For trainers"]},
  {id:"coaches", title:"Coaches", text:"Review players, plan practices and assign drills.", link:["#coach","Start as a coach"]},
  {id:"parents", title:"Parents", text:"See the feedback and what to practice at home.", link:["#for-parents","For parents"]},
  {id:"players", title:"Players", text:"Animated drills picked from your review.", link:["#drills","See the drills"]},
  {id:"college", title:"College coaches", text:`Search players ${RECRUIT_AGE}+ and message families.`, link:["#college","Join free"]},
  {id:"scouts", title:"Pro scouts", text:`Search players ${RECRUIT_AGE}+. Every scout is approved.`, link:["#pro","Ask for access"]}];
const HOME_FAQ = [
  ["Who owns a player's profile?", `The family. If the player changes clubs, the family keeps everything and the old club loses access.`],
  ["Is it safe for young players?", `Yes. Reviews are private to the family and their coaches, players under ${RECRUIT_AGE} never get a public link, and every scout is approved by hand. Chats are monitored by clubs and ${APP_NAME}. <a href="#safety">How we keep players safe</a>`],
  ["What does it cost?", `Clubs pay per team or one price for unlimited teams. College coaches and scouts are free. <a href="#pricing">See pricing</a>`],
  ["Do the drills need a team or a coach?", `No. Every solo drill needs only a ball, a few cones and a wall.`],
  ["Can a rec league or a private trainer use it?", `Yes. Each team or training group is set up the same way. <a href="#clubs">See how</a>`],
  ["Do we need to install anything?", `No. ${APP_NAME} works in any browser on a phone, tablet or computer. Add it to your home screen for one-tap access.`]];

function homeView(){
  const step = (n, t, x) => `<div class="hstep"><span class="step-n">${n}</span><div class="stack" style="gap:4px"><h3>${t}</h3><p class="muted">${x}</p></div></div>`;
  const facts = [[FIELD_SKILLS.length + " + " + GK_SKILLS.length, "field and keeper skills per review"], [String(BUILTIN_DRILLS.length), "animated solo drills"], [String(TEAM_DRILLS.length), "team drills for practice"], ["3", "ways to get recruited"]];
  return `<section class="home-hero card">
    <div class="stack hh-copy">
      <span class="eyebrow">Youth soccer, from first touch to first offer</span>
      <h1>Develop every player.<br>Get every player seen.</h1>
      <p class="lead">Coach reviews, home training and recruiting for youth soccer, all in one place.</p>
    </div>
    <div class="hh-art">${introHtml()}</div>
    <div class="stack hh-signup">
      <div class="row hh-cta"><button type="button" class="btn primary lg" data-act="pickPortal" data-id="coach" data-mode="signup">Start your club</button><button type="button" class="btn lg" data-act="pickPortal" data-id="family" data-mode="signup">I'm a parent or player</button></div>
      <p class="small muted hh-alt">College coach? <a href="#college">Join free</a> · Scout? <a href="#pro">Ask for access</a> · <a href="#signin">Sign in</a></p>
    </div>
  </section>
  <section class="home-facts" aria-label="${APP_NAME} at a glance">${facts.map(([n, t]) => `<div><b>${n}</b><span>${t}</span></div>`).join("")}</section>

  <section class="stack home-sec" aria-labelledby="h-who">
    <div class="sec-head"><span class="eyebrow">Who it's for</span><h2 id="h-who">Built for everyone in youth soccer</h2></div>
    <div class="aud-grid">${AUDIENCES.map(a => `<a class="aud card" href="${a.link[0]}">${audIcon(a.id)}<h3>${a.title}</h3><p class="muted small">${a.text}</p><span class="aud-go">${a.link[1]} →</span></a>`).join("")}</div>
  </section>

  <section class="stack home-sec" aria-labelledby="h-how">
    <div class="sec-head"><span class="eyebrow">How it works</span><h2 id="h-how">Review. Train. Get seen.</h2></div>
    <div class="grid3 hsteps">
      ${step(1, "The coach reviews", "Ratings, strengths and a short note after every review.")}
      ${step(2, "The player trains at home", "Short, animated drills picked from what the coach flagged.")}
      ${step(3, "The right people notice", `Colleges and approved scouts can find players from age ${RECRUIT_AGE}, when a parent says yes.`)}
    </div>
  </section>

  ${exampleProfile()}

  <section class="card safety-band" aria-labelledby="h-safe">
    <div class="stack" style="gap:8px"><span class="eyebrow">Safety first</span><h2 id="h-safe">Built for children, run by their parents</h2>
      <p class="muted">Most players are kids, so every rule starts there.</p></div>
    <ul class="ticks safe-list">
      <li>Profiles belong to the family, not the club.</li>
      <li>Reviews stay private to the family and their coaches.</li>
      <li>Recruiting is off until a parent turns it on.</li>
      <li>No ads. We never sell anyone's data.</li>
    </ul>
    <div><a class="btn" href="#safety">How we keep players safe</a></div>
  </section>

  <section class="card stack" aria-labelledby="h-faq"><h2 id="h-faq">Questions</h2>
    ${HOME_FAQ.map(([q, a]) => `<details class="faq-d"><summary>${q}</summary><p class="muted">${a}</p></details>`).join("")}
  </section>

  <section class="final-cta card stack">
    <h2>Ready when you are</h2>
    <p class="lead" style="margin:0 auto">Set up your club in five minutes, or join your team.</p>
    ${cta("Start your club", "I'm a parent or player")}
    <p class="small muted" style="text-align:center">Want a walkthrough first? <a href="#contact">Talk to us</a></p>
  </section>`;
}

/* ---------- clubs: one page, four kinds of program ---------- */
const PROGRAMS = [
  {id:"select", title:"Select, travel & academy clubs", pill:"Most popular", lead:"One development standard across every age group.",
   points:["The same skills and 1–5 scale for every coach", "Progress timelines for families and your board", `Recruitment Profiles and references for players ${RECRUIT_AGE}+`],
   plan:`Club Unlimited is usually cheapest from 10 teams.`},
  {id:"rec", title:"Recreational leagues", pill:"Volunteer friendly", lead:"Simple enough for a volunteer coach.",
   points:["A review takes about five minutes on a phone", "Home drills for every child", "Team chat instead of long email chains"],
   plan:`Small leagues pay per team; large programs choose Club Unlimited.`},
  {id:"trainers", title:"Private trainers & academies", pill:"Camps & small groups", lead:"Show families what each session builds toward.",
   points:["Set up each group, camp or clinic as a team", "Review after a block of sessions", "Assign homework and see who did it"],
   plan:`Most trainers start on the per-team plan.`},
  {id:"school", title:"High school & middle school teams", pill:"Season-long", lead:"Keep players developing between seasons.",
   points:["Review at the start, middle and end of the season", "References go straight onto the Recruitment Profile", "Off-season drills for every player"],
   plan:`One team on the per-team plan, or Club Unlimited for a program.`}];
function pageClubs(){
  return `<section class="page-hero stack"><span class="eyebrow">Clubs & Teams</span>
    <h1>Every player's development, in one place</h1>
    <p class="lead">The same review tools for every coach, and progress every family can see.</p></section>
  <nav class="prog-tabs" aria-label="Kinds of program">${PROGRAMS.map(p => `<a href="#clubs" data-act="progJump" data-id="${p.id}">${p.title}</a>`).join("")}</nav>
  <div class="prog-list">${PROGRAMS.map(p => `<section class="card prog" id="prog-${p.id}" aria-labelledby="ph-${p.id}">
      <div class="stack" style="gap:6px"><span class="pill ${p.id === "select" ? "warn" : "plain"}" style="align-self:flex-start">${p.pill}</span><h2 id="ph-${p.id}">${p.title}</h2><p class="lead" style="font-size:1.05rem">${p.lead}</p></div>
      <ul class="ticks">${p.points.map(x => `<li>${x}</li>`).join("")}</ul>
      <p class="small prog-plan"><b>Plan:</b> ${p.plan}</p>
    </section>`).join("")}</div>
  <div class="grid3">
    ${feature("Consistent reviews","Every coach uses the same skills and scale.")}
    ${feature("Progress you can show","A timeline of every review and what improved.")}
    ${feature("Home training that sticks","Drills from the review, and who did them this week.")}
    ${feature("Team chat & messages","A chat per team, plus private family messages.")}
    ${feature("Simple onboarding","Coaches use your club code. Families ask to join.")}
    ${feature("Private by design","Families only ever see their own child.")}
  </div>
  <div class="card stack"><h2>For club directors</h2>
    <div class="grid2" style="gap:16px">
      <div class="stack" style="gap:6px"><h3>See the whole club</h3><p class="muted">Every team, coach and player in one list.</p></div>
      <div class="stack" style="gap:6px"><h3>Stay in control</h3><p class="muted">You approve families and choose who sees each team.</p></div>
      <div class="stack" style="gap:6px"><h3>Show families the value</h3><p class="muted">Written feedback families remember at re-sign time.</p></div>
      <div class="stack" style="gap:6px"><h3>Recruit for tryouts</h3><p class="muted">Find players whose parents say they're looking.</p></div>
    </div>
  </div>
  <div class="card stack callout"><h2>Set up your club in 5 minutes</h2>
    <ol class="numbered"><li>Sign up and choose <b>Start a club</b>.</li><li>Share your club code with your coaches.</li><li>Add teams. Families ask to join; you approve.</li></ol>
    <div class="row cta-row"><button type="button" class="btn primary" data-act="pickPortal" data-id="coach">Start your club</button><a class="btn" href="#contact">Book a walkthrough</a></div></div>`;
}
ACTS.progJump = (ds, el, ev) => { if(ev) ev.preventDefault(); const t = document.getElementById("prog-" + ds.id); if(t){ t.scrollIntoView({behavior:"smooth", block:"start"}); t.classList.add("flash"); setTimeout(() => t.classList.remove("flash"), 1200); } };

/* ---------- safety and the legal pages ---------- */
const LEGAL_UPDATED = "November 18, 2026";
function pageSafety(){
  const row = (what, who) => `<tr><th scope="row">${what}</th><td>${who}</td></tr>`;
  return `<section class="page-hero stack"><span class="eyebrow">Safety</span>
    <h1>How we keep players safe</h1>
    <p class="lead">Most players are children. Here is who can see what, and the rules we built in.</p></section>
  <div class="card stack"><h2>Who can see what</h2>
    <div class="tbl-wrap"><table class="who-sees"><thead><tr><th scope="col">Information</th><th scope="col">Who can see it</th></tr></thead><tbody>
      ${row("Coach reviews and notes", "The family, their coaches and the club admin. Never public.")}
      ${row("Private messages", "The family, their coaches and the club admin. Monitored by the club and " + APP_NAME + " for safety.")}
      ${row("Team chat", "Families and coaches on that team. Monitored by the club and " + APP_NAME + " for safety.")}
      ${row("Player profile", "The family and their club. Public only if the family chooses, from " + RECRUIT_AGE + ".")}
      ${row("Recruiting: College", `Verified college coaches, if the parent turns it on. Ages ${RECRUIT_AGE}+.`)}
      ${row("Recruiting: Pro", `Approved scouts, if the parent turns it on. Ages ${RECRUIT_AGE}+.`)}
      ${row("Recruiting: Youth clubs", `Other clubs' coaches, if the parent turns it on. Under ${RECRUIT_AGE}: first name and last initial only.`)}
    </tbody></table></div>
  </div>
  <div class="grid2">
    <div class="card stack"><h2>Parents are in charge</h2><ul class="ticks">
      <li>Under-13 accounts are run by a parent.</li>
      <li>The profile belongs to the family.</li>
      <li>Recruiting starts off, with a switch per section.</li>
      <li>Families ask to join teams; coaches approve.</li></ul></div>
    <div class="card stack"><h2>Who can contact a player</h2><ul class="ticks">
      <li>Colleges and scouts message the family, never the player.</li>
      <li>At most one message a week per coach or scout.</li>
      <li>Coaches only message their own teams' families.</li>
      <li>Team chats and private messages are monitored by the club and ${APP_NAME}.</li>
      <li>Scouts who change organization are checked again.</li></ul></div>
  </div>
  <div class="card stack"><h2>Tips for families</h2><ul class="ticks">
    <li>Use a parent's email on the Recruitment Profile.</li>
    <li>Check a coach or scout on their school or club's staff page.</li>
    <li>Turn off recruiting sections you're not using.</li></ul></div>
  <div class="card stack callout"><h2>Report a concern</h2>
    <p>If anyone makes you or your child uncomfortable, tell us straight away. If a child is in danger, call 911 first.</p>
    <div><a class="btn primary" href="#contact" data-act="contactTopic" data-id="Safety concern">Report a concern</a></div></div>`;
}
function pageAccessibility(){
  return `<section class="page-hero stack"><span class="eyebrow">Accessibility</span>
    <h1>${APP_NAME} for everyone</h1>
    <p class="lead">${APP_NAME} should work for everyone, on any device. We aim to meet WCAG 2.2 level AA.</p></section>
  <div class="grid2">
    <div class="card stack"><h2>What we've built in</h2><ul class="ticks">
      <li>Works with a keyboard alone, with a "Skip to content" link.</li>
      <li>Built for screen readers, with labelled buttons and fields.</li>
      <li>AA colour contrast in light and dark mode.</li>
      <li>Works zoomed to 400% and on narrow phones.</li>
      <li>Animations start paused if you prefer reduced motion.</li></ul></div>
    <div class="card stack"><h2>Drill animations</h2>
      <p>Every animation can be paused, and every drill also has full written steps.</p>
      <h2>Known limits</h2>
      <p>Videos families link to (YouTube, Hudl, Veo) may not have captions.</p></div>
  </div>
  <div class="card stack callout"><h2>Tell us what's not working</h2>
    <p>Tell us what you were trying to do and we'll fix it or help another way.</p>
    <div><a class="btn primary" href="#contact" data-act="contactTopic" data-id="Accessibility">Report an accessibility problem</a></div>
    <p class="small muted">Last reviewed ${LEGAL_UPDATED}.</p></div>`;
}
function legalPage(kind){
  const P = (h, ...ps) => `<h2>${h}</h2>${ps.map(x => x.startsWith("<") ? x : `<p>${x}</p>`).join("")}`;
  const L = (...xs) => `<ul>${xs.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const body = kind === "privacy" ? [
    P("Who we are", `${APP_NAME} is a youth soccer development website for clubs, coaches, families, college coaches and scouts. This policy explains what information we collect, why, who can see it and the choices you have. Questions: <a href="#contact">contact us</a> and choose <b>Privacy request</b>.`),
    P("What we collect", L(
      "<b>Account details:</b> your email address, a password (stored in scrambled, hashed form by our sign-in provider, never in plain text) and your name.",
      "<b>Player information a family adds:</b> the player's name, date of birth, positions, photo, bio, club history, highlights, stats, videos and recruiting details such as school, GPA and test scores.",
      "<b>Information coaches add:</b> reviews, ratings, notes, comments, references and assigned drills.",
      "<b>Messages:</b> team chat, private messages, meeting requests and messages from college coaches and scouts.",
      "<b>College coach and scout details:</b> name, title, school or organization, and how to confirm your role.",
      "<b>Contact form messages</b> you send us.")),
    P("What we don't do", L("We don't show ads.", "We don't sell or rent anyone's information.", "We don't use your information to build advertising profiles.")),
    P("How we use it", "To run the service: show reviews and drills to the right people, recommend drills, deliver messages, show Recruitment Profiles in the sections a family has turned on, check college coach and scout accounts, answer your questions, and keep the service secure."),
    P("Monitoring of chats", `To keep players safe, team chats, private messages and meeting rooms are monitored by the club the team belongs to and by ${APP_NAME}. Messages that break our <a href="#terms">Terms of Use</a> can be removed, and concerns about a child's safety can be reported to the authorities.`),
    P("Who can see it", `Each part of a player's information is only shown to the people listed on our <a href="#safety">Safety page</a>. Recruiting listings are off until a parent turns them on. We share information with the companies that host and run ${APP_NAME} for us (database and file storage, and website hosting) only so they can provide that service, and we'd share it if the law required us to.`),
    P("Children", `Many players are under 13. Accounts for players under 13 must be created and managed by a parent or guardian, who gives consent for the information they add. Players under ${RECRUIT_AGE} never have a public profile link, and youth club coaches only see their first name, last initial and birth year. A parent can review, change or delete their child's information at any time from their account, or by contacting us.`),
    P("Your choices", L("Edit your player's profile and recruiting details at any time.", "Turn each recruiting section on or off at any time.", "Make a profile private.", "Leave a team or club; the club loses access to your player's information.", `Ask us to delete your account and your players' information: <a href="#contact">contact us</a> and choose <b>Privacy request</b>.`)),
    P("Cookies and storage", "We use your browser's storage to keep you signed in and to remember small preferences. We don't use advertising or tracking cookies."),
    P("Security", "Information is sent over encrypted connections, and the database only lets each person read what this policy says they can see. No system is perfectly secure, so please use a strong password and don't share it."),
    P("Changes", "If we change this policy in a way that matters, we'll tell you on the site before the change takes effect.")
  ] : [
    P("Agreeing to these terms", `By creating an account or using ${APP_NAME} you agree to these terms. If you're using ${APP_NAME} for a club or organization, you agree on its behalf.`),
    P("Accounts", L("Give accurate information and keep your password safe.", "Accounts for players under 13 must be created and run by a parent or guardian. Players aged 13 to 17 need a parent or guardian's permission.", "College coach accounts need a current school email address. Pro scout accounts are only active after we approve them, and we can remove that approval.", "You're responsible for what happens under your account.")),
    P("Your content", `Families own their players' profiles and the content they add. Coaches and clubs keep responsibility for the reviews, notes and references they write. You give ${APP_NAME} permission to store and show your content to the people allowed to see it, only to run the service.`),
    P("Acceptable use", "Don't use NextPass to:", L("harass, bully or embarrass anyone, especially a child;", "contact a player other than through their family, or ask a minor to move a conversation elsewhere;", "pretend to be someone you're not, or claim a role or organization you don't have;", "copy, scrape or collect other people's information;", "upload anything you don't have the right to share, or anything unlawful or sexual;", "try to break, overload or get around the security of the service."), "We can remove content or suspend accounts that break these rules, and report concerns about a child's safety to the authorities."),
    P("Plans and payment", `Prices are shown on the <a href="#pricing">Pricing</a> page. We'll always tell you the price and get your agreement before you're charged. College coach and approved scout accounts are free.`),
    P("Recruiting", `${APP_NAME} helps families share information with college coaches, scouts and clubs. We don't act as an agent, we don't guarantee any offer, and we're not responsible for decisions made by schools, clubs or scouts. College coaches are responsible for following the recruiting rules that apply to them.`),
    P("Drills and physical activity", "Drills involve physical activity. Players should warm up, use a safe space and stop if something hurts. Parents decide which drills suit their child. Drills aren't medical or professional advice."),
    P("The service", `We work hard to keep ${APP_NAME} available and accurate, but it's provided as it is, and features may change. To the extent the law allows, we aren't liable for indirect losses, and our total liability is limited to what you paid us in the 12 months before a claim.`),
    P("Ending your account", "You can stop using NextPass and ask us to delete your account at any time. We can suspend or close accounts that break these terms."),
    P("Changes and contact", `If we change these terms in a way that matters, we'll tell you on the site first. These terms are governed by the laws of the State of Ohio. Questions: <a href="#contact">contact us</a>.`)
  ];
  return `<section class="page-hero stack"><span class="eyebrow">${kind === "privacy" ? "Privacy" : "Terms"}</span>
    <h1>${kind === "privacy" ? "Privacy Policy" : "Terms of Use"}</h1><p class="muted small">Last updated ${LEGAL_UPDATED}</p></section>
  <article class="card legal">${body.join("")}</article>`;
}
/* the browser tab title follows the page */
const PAGE_TITLES = {"how-it-works":"How it works", drills:"Solo soccer drills for ages 10 to 18", "team-drills":"Team soccer drills for practice", clubs:"For clubs, leagues and trainers", recruiting:"Recruiting: college, pro and youth clubs",
  "for-parents":"For parents and players", pricing:"Pricing", contact:"Contact us", safety:"How we keep players safe", privacy:"Privacy Policy", terms:"Terms of Use", accessibility:"Accessibility"};
function setTitle(){
  const t = S.publicPage ? PAGE_TITLES[S.publicPage] : S.publicSlug ? (S.pub && S.pub.player ? S.pub.player.name + " · Recruitment Profile" : "Recruitment Profile")
    : !S.uid ? (S.portal || S.wantSignin ? "Sign in" : "") : "";
  const want = t ? `${t} · ${APP_NAME}` : `${APP_NAME} · Youth soccer player development and recruiting`;
  if(!S.uid || S.publicPage || S.publicSlug){ if(document.title !== want) document.title = want; } else if(document.title !== APP_NAME) document.title = APP_NAME;
}
ACTS.skipMain = () => { const m = document.getElementById("main-content"); if(m) m.focus(); };
ACTS.contactTopic = ds => { S.contactTopic = ds.id; location.hash = "contact"; };

/* a made-up 17-year-old for the public Recruiting page */
const RECRUIT_EXAMPLE = {name:"Jordan Reyes", initials:"JR", clubLine:"Example FC · U17 ECNL", gradYear:"2027", age:17,
  facts:[["GPA","3.7"],["SAT / ACT","SAT 1310"],["Height","5'10\""],["Stronger foot","Left"],["Club league","ECNL"],["Intended major","Kinesiology"]],
  positions:["CDM","CM"], divisions:["NCAA D1","NCAA D2"],
  highlights:[{title:"ECNL Midwest conference all-conference", year:"2026"},{title:"Team captain", year:"2026"},{title:"High school all-district first team", year:"2025"}],
  stats:[{season:"2025–26", team:"U17 ECNL", games:24, goals:5, assists:11}],
  reference:{text:"Jordan controls the tempo of our games and is the first to organize the team when things get hard. A coachable, high-character player who will add value to a college program.", author:"Coach Rivera", title:"Director of Coaching, Example FC"}};
function pageRecruiting(){
  const J = RECRUIT_EXAMPLE;
  return `<section class="page-hero stack"><span class="eyebrow">Recruiting</span>
    <h1>Get seen by the right coaches</h1>
    <p class="lead">One profile, three sections. Families choose who can find their player.</p></section>
  <div class="grid3 sec-cards">
    <div class="card stack"><span class="pill plain" style="align-self:flex-start">Ages ${RECRUIT_AGE} and over</span><h2>College</h2>
      <p>Academics and division interest, seen by verified college coaches.</p>
      <div><button type="button" class="btn sm" data-act="pickPortal" data-id="college">College coach? Join free</button></div></div>
    <div class="card stack"><span class="pill plain" style="align-self:flex-start">Ages ${RECRUIT_AGE} and over</span><h2>Pro</h2>
      <p>Playing level and trial availability, seen only by approved scouts.</p>
      <div><button type="button" class="btn sm" data-act="pickPortal" data-id="pro">Pro scout? Ask for access</button></div></div>
    <div class="card stack"><span class="pill good" style="align-self:flex-start">All ages</span><h2>Youth clubs</h2>
      <p>For new clubs, tryouts or guest playing. Under-16s show first name only.</p>
      <div><button type="button" class="btn sm" data-act="pickPortal" data-id="coach">Club coach? Sign in</button></div></div>
  </div>
  <div class="grid2">
    <div class="stack" style="gap:16px">
      ${feature("Academics up front","Class, GPA, test scores and NCAA ID.")}
      ${feature("The soccer details","Positions, league, foot and division interest.")}
      ${feature("Highlights and video","Stats plus YouTube, Hudl or Veo links.")}
      ${feature("Coach references","Written by club coaches, in their own words.")}
      ${feature("You stay in control","Off by default. One switch per section.")}
      ${feature("Free for coaches and scouts","Search, shortlist and message families.")}
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

function pagePricing(){
  return `<section class="page-hero stack"><span class="eyebrow">Pricing</span>
    <h1>Simple plans for clubs and families</h1>
    <p class="lead">Pay per team, or one price for the whole club. Families can add Home Training.</p></section>
  <div class="grid3 plans3">
    <div class="card plan">
      <span class="pill plain" style="align-self:flex-start">For clubs & coaches</span>
      <h2>Club</h2>
      <div><span class="price">${PRICES.club}</span> <span class="muted">${PRICES.clubPer} you register</span></div>
      <p class="small muted">5 teams: $99.95 a month.</p>
      <ul><li>Unlimited players and coaches</li>${CLUB_FEATURES}</ul>
      <button type="button" class="btn" data-act="pickPortal" data-id="coach" style="align-self:flex-start;margin-top:auto">Start your club</button>
    </div>
    <div class="card plan featured">
      <span class="pill warn" style="align-self:flex-start">Best for 10+ teams</span>
      <h2>Club Unlimited</h2>
      <div><span class="price">${PRICES.unlimited}</span> <span class="muted">${PRICES.unlimitedPer}</span></div>
      <p class="small muted">Cheaper than per-team from 10 teams.</p>
      <ul><li><b>Unlimited teams</b> and players</li>${CLUB_FEATURES}</ul>
      <button type="button" class="btn primary" data-act="pickPortal" data-id="coach" style="align-self:flex-start;margin-top:auto">Start your club</button>
    </div>
    <div class="card plan">
      <span class="pill good" style="align-self:flex-start">For parents & players</span>
      <h2>Home Training</h2>
      <div><span class="price">${PRICES.family}</span> <span class="muted">${PRICES.familyPer}</span></div>
      <p class="small muted">For players whose club doesn't include it.</p>
      <ul><li>Drills picked from the review</li><li>Full drill library</li><li>Progress charts for every skill</li><li>Weekly drill tracking</li></ul>
      <p class="small muted">Always free: latest review, ratings, profile and team chat.</p>
      <button type="button" class="btn" data-act="pickPortal" data-id="family" style="align-self:flex-start;margin-top:auto">Sign up as a family</button>
    </div>
  </div>
  <div class="card plan college-plan">
    <div class="row between"><div class="stack" style="gap:4px"><span class="pill plain" style="align-self:flex-start">For college coaches</span>
      <h2>College recruiting</h2><div><span class="price">Free</span> <span class="muted">with a college coach account</span></div></div>
      <button type="button" class="btn" data-act="pickPortal" data-id="college" style="align-self:center">Create a free account</button></div>
    <ul><li>Search players ${RECRUIT_AGE}+ by position, class and GPA</li><li>Private shortlist and notes</li><li>Message families directly</li><li>Needs a school .edu email</li></ul>
  </div>
  <section class="card stack" aria-labelledby="h-pfaq"><h2 id="h-pfaq">Questions</h2>
    ${[["Do college coaches or scouts pay?", "No. Both are free. Scouts are approved by hand first."],
       ["How is the Club plan charged?", `${PRICES.club} a month per team, with unlimited players and coaches.`],
       ["When is Club Unlimited worth it?", `From 10 teams. Ten teams per-team cost $199.90; Unlimited is ${PRICES.unlimited}.`],
       ["Is Home Training free if my club includes it?", "Yes, for every player on the club's teams."],
       ["We have two children. Do we pay twice?", `${PRICES.family} a month for each player whose club doesn't include it.`],
       ["What happens if we change clubs?", "You keep the profile and every review. The old club loses access."],
       ["Something else?", `<a href="#contact">Contact us</a> and we'll get back to you.`]].map(([q, a]) => `<details class="faq-d"><summary>${q}</summary><p class="muted">${a}</p></details>`).join("")}
  </section>`;
}

function pageContact(){
  if(S.contactSent) return `<section class="page-hero stack"><span class="eyebrow">Contact Us</span><h1>Thanks, we got your message</h1>
    <p class="lead">We'll reply to ${esc(S.contactSent)} as soon as we can.</p><div><a class="btn" href="#how-it-works">See how ${APP_NAME} works</a></div></section>`;
  return `<section class="page-hero stack"><span class="eyebrow">Contact Us</span>
    <h1>Talk to us</h1>
    <p class="lead">Questions, a club walkthrough or help with your account. We reply by email.</p></section>
  <form class="card stack contact-form" data-form="contact" style="max-width:720px">
    <div class="grid2" style="gap:14px">
      <label class="f" for="ct-name">Your name<input type="text" id="ct-name" name="name" required maxlength="80" autocomplete="name"></label>
      <label class="f" for="ct-email">Email<input type="email" id="ct-email" name="email" required maxlength="120" autocomplete="email"></label>
      <label class="f" for="ct-role">I am a<select id="ct-role" name="role">${["Club director","Rec league organizer","Private trainer","Coach","Parent","Player","College coach","Pro scout","Other"].map(o => `<option>${o}</option>`).join("")}</select></label>
      <label class="f" for="ct-topic">Topic<select id="ct-topic" name="topic">${["Club walkthrough","Pricing","Recruiting","Help with my account","Accessibility","Safety concern","Privacy request","Feedback","Other"].map(o => `<option ${S.contactTopic === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
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
/* ---------- meeting notifications ----------
   The bell lists what changed in your meetings since you last looked, plus reminders
   a day and an hour before. With permission, the same news shows as a phone or computer
   notification while NextPass is open in any tab. Who changed a meeting comes from
   updated_by (database update 021); without it, the person who created it. */
const DAY = 864e5, HOUR = 36e5;
const nKey = k => "np-" + k + "-" + (S.uid || "");
function lsGet(k, d){ try { const v = localStorage.getItem(nKey(k)); return v == null ? d : JSON.parse(v); } catch(_){ return d; } }
function lsSet(k, v){ try { localStorage.setItem(nKey(k), JSON.stringify(v)); } catch(_){} }
function meetingNotices(){
  if(!S.me || isScout() || isCollege()) return [];
  const now = Date.now(), out = [], mine = new Set(pmPlayers().map(p => p.id));
  for(const m of S.meetings){
    if(!mine.has(m.playerId)) continue;
    const p = S.players.find(x => x.id === m.playerId), who = m.createdByName || "Someone";
    const theirs = m.updatedBy ? m.updatedBy !== S.uid : (!isStaff() || m.createdBy !== S.uid);   /* only coaches schedule, so for families any change came from the coach */
    const base = {m, p, pname: p ? p.name : ""};
    if(m.status === "requested" && m.createdBy !== S.uid)
      out.push({...base, kind:"request", at:m.createdAt || 0, icon:"📩", text:`${who} asked for a meeting: ${m.topic}`});
    if(m.status === "scheduled" && theirs && m.scheduledAt > now - HOUR)
      out.push({...base, kind:"scheduled", at:m.updatedAt || 0, icon:"🗓", text:`Meeting scheduled: ${m.topic}`, sub:fmtWhen(m.scheduledAt)});
    if(m.status === "cancelled" && theirs && (m.updatedAt || 0) > now - 14 * DAY)
      out.push({...base, kind:"cancelled", at:m.updatedAt || 0, icon:"✖", text:`Meeting cancelled: ${m.topic}`});
    if(m.status === "scheduled" && m.scheduledAt > now){
      const left = m.scheduledAt - now;
      if(left <= HOUR) out.push({...base, kind:"soon1", at:Math.max(m.scheduledAt - HOUR, m.updatedAt || 0), icon:"⏰", text:`Meeting in less than an hour: ${m.topic}`, sub:fmtWhen(m.scheduledAt)});
      else if(left <= DAY) out.push({...base, kind:"soon24", at:Math.max(m.scheduledAt - DAY, m.updatedAt || 0), icon:"⏰", text:`Meeting coming up: ${m.topic}`, sub:fmtWhen(m.scheduledAt)});
    }
  }
  out.forEach(n => n.key = n.m.id + ":" + n.kind + ":" + n.at);
  return out.sort((a, b) => b.at - a.at);
}
const noticesUnread = list => { const seen = lsGet("notif-seen", 0); return list.filter(n => n.at > seen).length; };
function bellHtml(){
  if(!S.me || isScout() || isCollege()) return "";
  const list = meetingNotices(), n = noticesUnread(list), open = !!S.notifOpen;
  return `<div class="notif-wrap">
    <button type="button" class="bell-btn" data-act="notifToggle" aria-expanded="${open}" aria-controls="notif-panel" aria-label="Notifications${n ? ", " + n + " new" : ""}">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
      ${n ? `<span class="badge bell-badge">${n > 9 ? "9+" : n}</span>` : ""}</button>
    ${open ? notifPanel(list) : ""}
  </div>`;
}
function notifPanel(list){
  const seen = S.notifSeenBefore || 0;
  const perm = typeof Notification === "undefined" ? "none" : Notification.permission;
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) && !window.navigator.standalone;
  const onOff = perm === "default" ? `<div class="notif-perm"><p class="small">Get a notification on this device when a meeting is scheduled, changed or about to start.</p><button type="button" class="btn sm primary" data-act="notifAllow">Turn on notifications</button></div>`
    : perm === "denied" ? `<p class="small muted notif-perm">Notifications are blocked for this site. Turn them on in your browser's site settings.</p>`
    : perm === "none" && ios ? `<p class="small muted notif-perm">On iPhone, tap Share → Add to Home Screen and open NextPass from there to get notifications.</p>` : "";
  return `<div class="notif-panel" id="notif-panel" role="region" aria-label="Notifications">
    <div class="row between"><h2 class="h3" style="margin:0">Notifications</h2>${perm === "granted" ? `<span class="small muted">🔔 On for this device</span>` : ""}</div>
    ${list.length ? `<ul class="notif-list">${list.map(n => `<li><button type="button" class="notif-item${n.at > seen ? " new" : ""}" data-act="notifOpen" data-id="${esc(n.m.id)}">
        <span class="ni-ic" aria-hidden="true">${n.icon}</span><span class="ni-body"><b>${esc(n.text)}</b>${n.sub ? `<span class="small">${esc(n.sub)}</span>` : ""}<span class="small muted">${esc(n.pname)}${n.at > seen ? ` · <span class="ni-new">New</span>` : ""}</span></span></button></li>`).join("")}</ul>`
      : `<p class="small muted">Nothing new. Meeting requests, scheduled times and reminders show up here.</p>`}
    ${onOff}
  </div>`;
}
ACTS.notifToggle = () => {
  S.notifOpen = !S.notifOpen;
  if(S.notifOpen){ S.notifSeenBefore = lsGet("notif-seen", 0); lsSet("notif-seen", Date.now()); }
  render(); const b = document.querySelector(".bell-btn"); if(b) b.focus();
};
ACTS.notifOpen = ds => {
  const m = S.meetings.find(x => x.id === ds.id); S.notifOpen = false; if(!m) return render();
  S.view = "messages"; S.pmPlayer = m.playerId; S.pmTab = "meetings"; S.meetingId = m.id; S.menuOpen = false; render(); window.scrollTo(0, 0);
};
ACTS.notifAllow = async () => {
  try { await Notification.requestPermission(); } catch(_){}
  if(typeof Notification !== "undefined" && Notification.permission === "granted"){ lsSet("notified", meetingNotices().map(n => n.key)); toast("Notifications are on for this device"); }
  render();
};
/* show a phone/computer notification (or a toast) for anything new since the last check */
function checkNotices(){
  if(!S.me || S.loading) return;
  const list = meetingNotices(), done = lsGet("notified", null), keys = list.map(n => n.key);
  if(done === null){ lsSet("notified", keys); return; }   /* first visit on this device: no flood of old news */
  const fresh = list.filter(n => !done.includes(n.key) && n.at > Date.now() - DAY);
  if(!fresh.length) return;
  lsSet("notified", Array.from(new Set(done.concat(keys))).slice(-300));
  const sys = typeof Notification !== "undefined" && Notification.permission === "granted";
  for(const n of fresh.slice(0, 3)){
    const title = window.npT ? window.npT(n.text) : n.text, body = [n.sub, n.pname].filter(Boolean).join(" · ");
    if(sys){
      try { const note = new Notification(title, {body, tag:n.key, icon:"brand/mark.svg"}); note.onclick = () => { window.focus(); ACTS.notifOpen({id:n.m.id}); note.close(); }; } catch(_){ toast(title); }
    } else toast(title + (body ? " · " + body : ""));
  }
  const badge = document.querySelector(".bell-btn"); if(badge && !S.notifOpen) render();
}
setInterval(checkNotices, 60 * 1000);

/* add a scheduled meeting to the phone's or computer's calendar, with reminders a day and an hour before */
function icsEsc(t){ return String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsDate(ms){ return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
ACTS.meetingIcs = ds => {
  const m = S.meetings.find(x => x.id === ds.id); if(!m || !m.scheduledAt) return;
  const p = S.players.find(x => x.id === m.playerId) || {}, video = /^https:/i.test(m.location || "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NextPass//Meetings//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    "UID:" + m.id + "@nextpasssoccer.com", "DTSTAMP:" + icsDate(Date.now()), "DTSTART:" + icsDate(m.scheduledAt), "DTEND:" + icsDate(m.scheduledAt + 30 * 60e3),
    "SUMMARY:" + icsEsc(APP_NAME + " meeting: " + m.topic + (p.name ? " (" + p.name + ")" : "")),
    "LOCATION:" + icsEsc(video ? "Video call" : m.location), "URL:" + (video ? m.location : APP_URL),
    "DESCRIPTION:" + icsEsc((m.details ? m.details + "\n\n" : "") + (video ? "Join: " + m.location + "\n" : "") + "Meeting room: " + APP_URL),
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(m.topic), "TRIGGER:-P1D", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(m.topic), "TRIGGER:-PT1H", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], {type:"text/calendar;charset=utf-8"}));
  const a = document.createElement("a"); a.href = url; a.download = "nextpass-meeting.ics"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast("Calendar file ready. Open it to add the meeting and its reminders.");
};

const readKey = (pid, mid) => mid ? "m:" + mid : "p:" + pid;
function unreadIn(pid, mid){
  const lr = (S.me && S.me.lastRead && S.me.lastRead[readKey(pid, mid)]) || 0;
  return pmThread(pid, mid).filter(m => m.createdAt > lr && m.authorId !== S.uid).length;
}
function pmUnreadFor(pid){ return unreadIn(pid, null) + meetingsFor(pid).reduce((n, mt) => n + unreadIn(pid, mt.id), 0); }
function totalPmUnread(){ if(!S.me) return 0; return pmPlayers().reduce((n, p) => n + pmUnreadFor(p.id), 0); }
const openMeetings = pid => meetingsFor(pid).filter(m => m.status === "requested" || m.status === "scheduled").length;
/* meeting requests waiting on you: coaches see every new request; families see requests the coach made */
const meetingRequests = pid => meetingsFor(pid).filter(m => m.status === "requested" && m.createdBy !== S.uid).length;
function totalMeetingRequests(){ if(!S.me) return 0; return pmPlayers().reduce((n, p) => n + meetingRequests(p.id), 0); }
const MONITOR_NOTE = `<p class="small muted chat-monitor">🛡 Chats are monitored by your club and ${APP_NAME} to keep players safe.</p>`;
const reqBadge = n => n ? `<span class="badge req-badge" aria-label="${n} meeting request${n>1?"s":""}">${n} request${n>1?"s":""}</span>` : "";

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
  const ridx = reactIndex();
  for(const m of ms){
    const dl = dayLabel(m.createdAt);
    if(dl !== lastDay){ out += `<div class="day">${esc(dl)}</div>`; lastDay = dl; lastAuthor = ""; }
    const mine = m.authorId === S.uid, grouped = m.authorId === lastAuthor && m.createdAt - lastTs < 5*60*1000;
    const canDel = mine || (S.me && S.me.role === "admin");
    const tag = (m.role === "coach" || m.role === "admin") ? `<span class="pill good">Coach</span>` : `<span class="pill plain">Family</span>`;
    out += `<div class="msg${mine?" mine":""}">${grouped?"":`<div class="who">${mine?"":`<b>${esc(m.authorName||"Someone")}</b>${tag}`}<span>${msgTime(m.createdAt)}</span></div>`}<div class="bubble"${rAttr("private", m)}>${esc(m.text)}</div>${reactsHtml("private", m, ridx)}${canDel?`<button class="btn ghost sm del" data-act="delPm" data-id="${esc(m.id)}" aria-label="Delete message">Delete</button>`:""}</div>`;
    lastAuthor = m.authorId; lastTs = m.createdAt;
  }
  return out;
}
function composerHtml(placeholder, form, extra = ""){
  return `<form class="composer" data-form="${form}">
    <label for="pm-input" class="small muted">${placeholder}</label>
    <textarea id="pm-input" name="text" maxlength="2000" rows="2" placeholder="Write a message. Enter sends, Shift+Enter adds a line."></textarea>
    <div class="row"><span class="small muted">🔒 Private to this player's family, their team's coaches and the club admin.</span>${extra}<button class="btn primary" type="submit">Send</button></div>
    ${MONITOR_NOTE}
  </form>`;
}
function fmtWhen(ts){
  if(!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(LOC,{weekday:"short",month:"short",day:"numeric"}) + (LANG === "es" ? " a las " : " at ") + d.toLocaleTimeString(LOC,{hour:"numeric",minute:"2-digit"});
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
  const nReq = meetingRequests(p.id), mUnread = meetingsFor(p.id).reduce((n, mt) => n + unreadIn(p.id, mt.id), 0), cUnread = unreadIn(p.id, null);
  const side = `<aside class="chat-side" aria-label="Private conversations"><h2 class="side-h">${isStaff() ? "Players" : "Your player"}</h2>
    ${players.map(pl => { const last = pmThread(pl.id).slice(-1)[0], u = pmUnreadFor(pl.id), rq = meetingRequests(pl.id);
      return `<button data-act="pmPlayer" data-id="${esc(pl.id)}" aria-current="${pl.id===p.id}"><span class="tn"><span>${esc(pl.name)}${rq ? " " + reqBadge(rq) : ""}</span><span class="tp">${last ? esc((last.authorName||"") + ": " + last.text) : isStaff() ? esc(teamName(pl.teamId)) : "No messages yet"}</span></span>${u?`<span class="badge">${u}</span>`:""}</button>`; }).join("")}
  </aside>`;
  const head = `<div class="chat-head">
    <div class="stack" style="gap:0"><h2>${esc(p.name)}</h2><span class="small muted">🔒 ${(() => { const cs = coachesOfTeam(p.teamId).map(m => m.name).filter(Boolean); return cs.length ? esc(cs.join(", ")) + " (" + esc(teamName(p.teamId)) + " coaches)" : esc(teamName(p.teamId)) + " coaches"; })()} · club admin · ${famNames.length ? esc(famNames.join(", ")) : "family (not connected yet)"}</span></div>
    <select class="chat-pick" aria-label="Choose player" data-change="pmPlayer">${players.map(pl=>`<option value="${esc(pl.id)}" ${pl.id===p.id?"selected":""}>${esc(pl.name)}</option>`).join("")}</select>
  </div>
  <div class="subtabs pm-tabs" role="tablist">
    <button role="tab" data-act="pmTab" data-id="chat" aria-selected="${S.pmTab!=="meetings"}">Private chat${cUnread?` <span class="badge">${cUnread}</span>`:""}</button>
    <button role="tab" data-act="pmTab" data-id="meetings" aria-selected="${S.pmTab==="meetings"}">Meeting room${nReq ? " " + reqBadge(nReq) : ""}${mUnread?` <span class="badge">${mUnread}</span>`:""}</button>
  </div>`;
  let main;
  if(S.pmTab !== "meetings"){
    main = `<div class="thread" id="pm-thread" data-key="${esc(readKey(p.id,null))}" aria-live="polite">${bubblesHtml(pmThread(p.id), isStaff() ? `Start a private conversation with ${esc(p.name)}'s family. It's shared with them, ${esc(p.name)}'s team coaches and the club admin.` : `Message your coaches privately. It's shared with your family, your team's coaches and the club admin.`)}</div>
      ${p.clubId ? composerHtml("Message about " + esc(p.name), "pm") : `<p class="small muted composer">${esc(p.name)} isn't on a team right now, so new messages are paused. Your past messages stay here.</p>`}`;
  } else if(S.meetingId && meetingsFor(p.id).some(m => m.id === S.meetingId)){
    main = meetingRoom(p, S.meetings.find(m => m.id === S.meetingId));
  } else {
    S.meetingId = null;
    main = meetingList(p);
  }
  return `<h1 class="sr-only">Messages</h1><div class="chat pm">${side}<section class="chat-main" aria-label="Private conversation about ${esc(p.name)}">${head}${main}</section></div>`;
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
        ${m.status === "scheduled" && m.scheduledAt > Date.now() ? `<button class="btn sm" data-act="meetingIcs" data-id="${esc(m.id)}">🗓 Add to calendar</button>` : ""}
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
    foot:fd.get("foot") || "", loc:String(fd.get("loc") || "").trim(), uncommitted:fd.get("uncommitted") === "on", video:fd.get("video") === "on",
    amin:n("amin"), amax:n("amax"), by:n("by"), level:fd.get("level") || "", status:fd.get("status") || "", looking:fd.get("looking") || ""}};
  await runScout();
};
FORMS.interest = async (fd, form) => {
  const pid = form.dataset.player; closeModal();
  const ok = await save(() => rpc("send_interest", {pid, p_message:String(fd.get("message") || "").trim()}), SCOUT_COPY[mySection()].sent);
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
const proArgs = fd => { const g = k => String(fd.get(k) || "").trim(); return {my_name:g("name"), p_title:g("title"), p_org:g("org"), p_org_type:g("orgType"), p_region:g("region"), p_about:g("about")}; };
FORMS.proStart = async fd => {
  const ok = await save(() => rpc("start_pro", proArgs(fd)));
  if(ok){ toast("Thanks. We'll check your details and let you in."); S.view = "scout"; await loadMe(); }
};
FORMS.proEdit = async fd => {
  const ok = await save(() => rpc("update_pro", proArgs(fd)), "Saved");
  if(ok){ schedule("pro"); loadMe(); }
};
FORMS.opp = async (fd, form) => {
  const g = k => String(fd.get(k) || "").trim();
  const start = g("start"), end = g("end"), link = g("link");
  if(end && end < start){ toast("The last day can't be before the first day.", true); return; }
  if(link && !/^https?:\/\/\S+$/i.test(link)){ toast("Use a full link that starts with https://", true); return; }
  const id = form.dataset.id || crypto.randomUUID(), editing = !!form.dataset.id;
  const row = {kind:g("kind"), gender:g("gender") || "Any", title:g("title"), startsOn:start, endsOn:end || null, timeNote:g("time"), ages:g("ages"),
    location:g("location"), cost:g("cost"), contact:g("contact"), link, details:g("details")};
  closeModal();
  const ok = await save(() => editing ? S.db.doc("opps/" + id).update(row) : S.db.collection("opps").doc(id).set({...row, createdBy:S.uid}), editing ? "Changes saved" : "Listed. Families see it on their Recruiting page.");
  if(ok) schedule("opps");
};
FORMS.oppSearch = async fd => { S.oppQ = String(fd.get("q") || ""); render(); const el = document.getElementById("opp-q"); if(el) el.focus(); };
FORMS.myDetails = async (fd, form) => {
  const names = form.dataset.names === "1";
  const first = String(fd.get("first") || "").trim(), last = String(fd.get("last") || "").trim();
  const phone = String(fd.get("phone") || "").trim(), email = String(fd.get("email") || "").trim().toLowerCase();
  if(names && !first){ toast("Add your first name.", true); return; }
  if(phone && !/^[0-9+()\-. ]{7,25}$/.test(phone)){ toast("Check the phone number: digits, spaces, + ( ) - only.", true); return; }
  const emailChange = email && email !== String(S.email || "").toLowerCase();
  if(emailChange && S.me.role === "college" && !/\.edu$/.test(email)){ toast("College coach accounts need a school email ending in .edu.", true); return; }
  const btn = form.querySelector("button[type=submit]"); if(btn) btn.disabled = true;
  try {
    const name = names ? (first + " " + last).trim().slice(0, 60) : null;
    if(names && name !== S.me.name){ const {error} = await sb.from("members").update({name}).eq("id", S.uid); if(error) throw dbErr(error); S.me.name = name; schedule("members"); }
    const data = {phone}; if(names){ data.first_name = first; data.last_name = last; }
    const r1 = await sb.auth.updateUser({data}); if(r1.error) throw r1.error;
    S.meta = {...(S.meta || {}), ...data};
    if(emailChange){
      const r2 = await sb.auth.updateUser({email}, {emailRedirectTo: APP_URL});
      if(r2.error) throw r2.error;
      S.pendingEmail = email;
      toast(`Saved. We emailed a confirmation link to ${email}. Your email changes once you open it.`);
    } else toast("Details saved");
  } catch(e){
    console.error(e);
    const m = String((e && e.message) || "");
    toast(/already.*(registered|exists)|in use/i.test(m) ? "That email already has a NextPass account." : /rate|seconds/i.test(m) ? "Please wait a minute before trying again." : /invalid/i.test(m) && emailChange ? "That email address doesn't look right." : "Couldn't save your details. Try again.", true);
  }
  render();
};
FORMS.editMine = async (fd, form) => {
  const p = S.players.find(x => x.id === form.dataset.id); if(!p) return;
  const name = (String(fd.get("first") || "").trim() + " " + String(fd.get("last") || "").trim()).trim().slice(0, 60);
  if(!name){ toast("Add the player's first name.", true); return; }
  closeModal();
  let ok = true;
  if(name !== p.name || (fd.get("dob") || null) !== (p.birthDate || null)) ok = await save(() => rpc("edit_player", {pid:p.id, p_name:name, p_birth_date: fd.get("dob") || null}));
  const pr = profileFor(p.id) || {}, cur = pr.positions || [], main = fd.get("main") || "", foot = fd.get("foot") || "";
  if(ok && (main !== (cur[0] || "") || foot !== (pr.foot || ""))){
    const positions = main ? [main].concat(cur.filter(x => x !== main)) : cur.slice(1);
    ok = await saveProfile(p, {positions, foot});
  }
  if(ok){ toast("Saved"); schedule("players"); }
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
  if(fd.get("pid") && (f.choose || []).includes(fd.get("pid"))) f.pid = fd.get("pid");
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
  await save(() => S.db.doc("meetings/" + form.dataset.id).update({status:"scheduled", scheduledAt:new Date(when).getTime(), location:String(fd.get("where")||"").trim(), updatedAt:Date.now()}), "Meeting scheduled. The family gets a notification.");
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
  const hay = (d.title + " " + d.category + " " + (d.equipment||"") + " " + (d.goal||"") + " " + (d.tags||[]).join(" ") + " " + (d.skills||[]).map(k => SKILL_LABEL[k] || "").join(" ")).toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}
const LEVELS = ["Beginner","Intermediate","Advanced"];
const LEVEL_NOTE = {Beginner:"Core technique: clean touches, simple passing and striking. A good start for ages 10 and up, and a warm-up for everyone.",
  Intermediate:"Combines skills and adds speed: receiving on the half-turn, turns, finishing and footwork.", Advanced:"Game-speed technique and decisions: switching play, long passing, finishing first time and position-specific work."};
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
    const parts = g.skills.map(sk => section(sk.k, sk.k === "shooting" ? "Finishing" : sk.label, shown.filter(d => !d.custom && (!!d.gk === g.gk) && (d.skills||[]).includes(sk.k)))).join("");
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
ACTS.animToggle = (ds, el) => animToggle(el);
document.addEventListener("keydown", ev => { const el = ev.target; if(el.classList && el.classList.contains("drill-anim") && (ev.key === "Enter" || ev.key === " ")){ ev.preventDefault(); animToggle(el); } });
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

/* ---------- team training sessions ---------- */
const TD_SKILLS = FIELD_SKILLS.filter(s => !MINDSET_ONLY.includes(s.k));
const SESS_LENGTHS = [45, 60, 75, 90, 105, 120];
const ageOfTeam = t => { const m = String((t && t.ageGroup) || (t && t.name) || "").match(/U-?\s?(\d{1,2})\b/i) || String((t && t.ageGroup) || "").match(/(\d{1,2})/); return m ? Number(m[1]) : null; };
const tdAgeOk = (dr, age) => age == null || (dr.minAge || 0) <= age;
/* the level that usually suits a team's age group */
const levelForAge = age => age == null ? null : age <= 10 ? "Beginner" : age <= 13 ? "Intermediate" : "Advanced";
function levelFit(dr, age){
  const want = levelForAge(age); if(!want) return 0;
  const diff = TD_LEVELS.indexOf(dr.level) - TD_LEVELS.indexOf(want);
  return diff === 0 ? 1.5 : diff === 1 ? -1 : diff >= 2 ? -3 : diff === -1 ? 0 : -1;
}
const lvlPill = dr => `<span class="pill plain lvl-pill"><span class="lvl-dot lvl-${String(dr.level).toLowerCase()}" aria-hidden="true"></span>${esc(dr.level)}</span>`;
const blockDrill = b => b && !b.custom ? teamDrillById(b.drillId) : null;
const blockTitle = b => b.custom ? (b.title || "Your activity") : (blockDrill(b) || {}).title || "Drill no longer in the library";
const blockPhase = b => b.custom ? "Your activity" : (blockDrill(b) || {}).phase || "";
const sessTotal = blocks => (blocks || []).reduce((n, b) => n + (Number(b.minutes) || 0), 0);
const draftKey = () => "np-session-draft-" + (S.uid || "");

function sessTeamId(){
  const ts = myTeams();
  if(S.sessTeam === "all" || ts.some(t => t.id === S.sessTeam)) return S.sessTeam;
  return ts.length ? ts[0].id : "all";
}
/* team picture from each player's latest review: lowest team averages, players rated 1 or 2, and the coach's "Work on" tags */
function teamFocus(teamId){
  const players = S.players.filter(p => teamId === "all" || p.teamId === teamId);
  const vals = {}, low = {}, tagged = {};
  let reviewed = 0, keepers = 0;
  for(const p of players){
    const rs = reviewsFor(p.id), last = rs[rs.length - 1]; if(!last || !last.ratings) continue;
    reviewed++; const form = reviewForm(last); if(form === "gk") keepers++;
    for(const sk of skillsFor(form)){
      const v = validRating(last.ratings[sk.k]); if(v == null) continue;
      (vals[sk.k] = vals[sk.k] || []).push(v);
      if(v <= 2) (low[sk.k] = low[sk.k] || []).push(p);
    }
    for(const t of (last.improve || [])) for(const k of (TAG_SKILLS[t] || [])) (tagged[k] = tagged[k] || new Set()).add(p.id);
  }
  const skills = Object.keys(vals).filter(k => !MINDSET_ONLY.includes(k)).map(k => {
    const v = vals[k], avg = v.reduce((a, b) => a + b, 0) / v.length, gk = k.startsWith("gk_");
    const pool = Math.max(1, gk ? keepers : reviewed - keepers);
    const tags = tagged[k] ? tagged[k].size : 0, lows = low[k] || [];
    const need = Math.max(0, 4 - avg) * 2 + (tags / pool) * 2 + (lows.length / v.length) * 2;
    return {k, label:SKILL_LABEL[k] || k, avg, n:v.length, gk, need, low:lows, tags};
  }).sort((a, b) => b.need - a.need || a.avg - b.avg);
  return {players, reviewed, keepers, skills, field:skills.filter(s => !s.gk), gk:skills.filter(s => s.gk), need:Object.fromEntries(skills.map(s => [s.k, s.need]))};
}
const defaultFocus = F => F.field.filter(s => s.need > 0.5).slice(0, 3).map(s => s.k);

function newDraft(teamId){
  const F = teamFocus(teamId);
  return {id:null, title:"", teamId, date:"", minutes:75, focus:defaultFocus(F), blocks:[], notes:"", focusTouched:false};
}
function draft(){
  const tid = sessTeamId();
  if(!S.draft){
    try { const j = JSON.parse(localStorage.getItem(draftKey()) || "null"); if(j && Array.isArray(j.blocks)) S.draft = j; } catch(_){}
    if(!S.draft) S.draft = newDraft(tid);
  }
  return S.draft;
}
function keepDraft(){ try { localStorage.setItem(draftKey(), JSON.stringify(S.draft)); } catch(_){} }

function scoreTeamDrill(dr, F, focus, age){
  const hits = (dr.skills || []).filter(k => focus.includes(k));
  const base = (dr.skills || []).reduce((s, k) => s + (F.need[k] || 0), 0) / Math.sqrt((dr.skills || []).length || 1) + hits.length * 3;
  return {score: base > 0 ? base + levelFit(dr, age) : 0, hits};
}
function whyDrill(dr, F, focus){
  const fs = Object.fromEntries(F.skills.map(s => [s.k, s]));
  const ks = (dr.skills || []).filter(k => focus.includes(k) || (fs[k] && fs[k].need > 1)).sort((a, b) => (focus.includes(b) - focus.includes(a)) || ((fs[b] || {}).need || 0) - ((fs[a] || {}).need || 0)).slice(0, 2);
  return ks.map(k => fs[k] ? `${SKILL_LABEL[k]} (team average ${fix1(fs[k].avg)}/5)` : `${SKILL_LABEL[k]} (your focus)`);
}
function recommendTeamDrills(F, focus, age, n = 5){
  const used = new Set((S.draft ? S.draft.blocks : []).map(b => b.drillId));
  return TEAM_DRILLS.filter(d => tdAgeOk(d, age) && d.id !== "t-cooldown" && !used.has(d.id))
    .map(d => ({d, ...scoreTeamDrill(d, F, focus, age)})).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score).slice(0, n);
}
/* a full session: warm-up, a technical or possession practice, an opposed practice, a game, and a cool-down for longer sessions */
function autoBuild(minutes, F, focus, age){
  const ok = TEAM_DRILLS.filter(d => tdAgeOk(d, age) && d.id !== "t-cooldown");
  const sc = d => scoreTeamDrill(d, F, focus, age).score + (focus.length || F.skills.length ? 0 : levelFit(d, age));
  const pick = (phases, not) => ok.filter(d => phases.includes(d.phase) && !not.includes(d.id)).sort((a, b) => sc(b) - sc(a) || a.minutes - b.minutes)[0];
  const warm = pick(["Warm-up"], []);
  const m1 = pick(["Technical", "Possession"], [warm && warm.id]);
  const m2 = pick(["Possession", "Finishing", "Defending", "Transition"], [warm && warm.id, m1 && m1.id]);
  const game = pick(["Game"], []);
  const cool = minutes >= 75 ? teamDrillById("t-cooldown") : null;
  const r5 = x => Math.max(5, Math.round(x / 5) * 5);
  const wMin = minutes >= 75 ? 15 : 10, cMin = cool ? 5 : 0, rem = Math.max(15, minutes - wMin - cMin);
  const a = r5(rem * 0.3), b = r5(rem * 0.33), c = Math.max(5, rem - a - b);
  return [[warm, wMin], [m1, a], [m2, b], [game, c], [cool, cMin]].filter(([d, m]) => d && m > 0).map(([d, m]) => ({drillId:d.id, minutes:m, notes:""}));
}

function tipsHtml(dr){ return (dr.tips || []).map(t => `<span class="tips-b" title="Ajax TIPS: ${TIPS_LABEL[t]}">${TIPS_LABEL[t]}</span>`).join(""); }
function teamDrillDetails(dr, open){
  const m = METHODS[dr.method] || {};
  return `<details class="drill-how" ${open ? "open" : ""}><summary>How it works</summary>
    <p class="dh-row"><b>Set up</b>${esc(dr.setup)}</p>
    <p class="dh-row"><b>Equipment</b>${esc(dr.equipment)}</p>
    <div class="dh-row"><b>How to run it</b><ol>${dr.how.map(s => `<li>${esc(s)}</li>`).join("")}</ol></div>
    <div class="dh-points"><b>Coaching points</b><ul>${dr.points.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
    <p class="dh-row"><b>Make it harder</b>${esc(dr.progress)}</p>
    <p class="dh-row"><b>Make it easier</b>${esc(dr.regress)}</p>
    ${dr.note ? `<p class="dh-row note-safe"><b>Safety</b>${esc(dr.note)}</p>` : ""}
    ${m.name ? `<p class="dh-row method"><b>Where this comes from: ${esc(m.name)}</b>${esc(m.from)}</p>` : ""}
  </details>`;
}
function teamDrillCard(dr, opts = {}){
  const d0 = S.draft, inPlan = d0 && d0.blocks.some(b => b.drillId === dr.id);
  return `<article class="drill tdrill">
    <div class="row between top-al"><h3>${esc(dr.title)}</h3><span class="row td-pills">${lvlPill(dr)}<span class="pill plain">${esc(dr.phase)}</span></span></div>
    <div class="tdiag-w">${diagramSvg(dr)}</div>
    <div class="dmeta"><span>${esc(dr.minutes)} min</span><span>· ${esc(playersText(dr))}</span><span>· ${esc(dr.area)}</span><span>· Ages ${esc(dr.minAge)}+</span></div>
    <p class="dgoal">${esc(dr.summary)}</p>
    <div class="trains small"><span class="muted">Works on:</span> ${(dr.skills || []).map(k => esc(SKILL_LABEL[k] || k)).join(" · ")}</div>
    <div class="tips-row small"><span class="muted">TIPS:</span> ${tipsHtml(dr)}</div>
    ${opts.why && opts.why.length ? `<p class="small rec-why"><b>Why for this team:</b> works on ${esc(opts.why.join("; "))}</p>` : ""}
    ${teamDrillDetails(dr)}
    <div class="row"><button class="btn sm ${inPlan ? "" : "primary"}" data-act="sessAdd" data-id="${esc(dr.id)}" aria-label="Add ${esc(dr.title)} to your session">${inPlan ? "Add again" : "Add to session"}</button>${inPlan ? `<span class="small good-t">✓ In your session</span>` : ""}</div>
  </article>`;
}

function sessionsView(){
  const tab = ["plan", "library", "saved"].includes(S.sessTab) ? S.sessTab : "plan";
  const n = (S.sessions || []).length;
  const head = `<div class="stack" style="gap:4px"><h1>Team Drills</h1>
    <p class="muted small">Plan team practices from the team drill library. Recommendations come from your players' latest reviews.</p></div>
    <div class="subtabs" role="tablist" aria-label="Session sections">
      <button role="tab" data-act="sessTab" data-id="plan" aria-selected="${tab === "plan"}">Plan a session</button>
      <button role="tab" data-act="sessTab" data-id="library" aria-selected="${tab === "library"}">Team drill library</button>
      <button role="tab" data-act="sessTab" data-id="saved" aria-selected="${tab === "saved"}">Saved sessions${n ? ` (${n})` : ""}</button>
    </div>
    ${S.sessionsMissing ? `<div class="banner" role="status"><b>One step left:</b> run database update 018 (or <code>supabase/all_updates.sql</code>) in Supabase so sessions can be saved. You can still plan and print.</div>` : ""}`;
  if(tab === "library") return head + teamLibraryHtml();
  if(tab === "saved") return head + savedSessionsHtml();
  return head + sessionPlanHtml();
}

function sessionPlanHtml(){
  const d = draft(), teams = myTeams(), tid = sessTeamId();
  if(d.teamId !== tid && !d.blocks.length && !d.id){ S.draft = newDraft(tid); return sessionPlanHtml(); }
  const team = teams.find(t => t.id === d.teamId), age = ageOfTeam(team);
  const F = teamFocus(d.teamId || "all");
  const focus = d.focus || [];
  const chip = s => `<button type="button" class="fchip" data-act="sessFocus" data-id="${esc(s.k)}" aria-pressed="${focus.includes(s.k)}">${esc(s.label)}${s.n ? `<span class="fc-avg num">${fix1(s.avg)}</span>` : ""}</button>`;
  const ranked = F.field.slice(0, 6);
  const others = TD_SKILLS.filter(s => !ranked.some(r => r.k === s.k)).map(s => ({k:s.k, label:s.label, n:0}));
  const watch = F.field.filter(s => focus.includes(s.k) && s.low.length);
  const focusCard = `<section class="card stack" aria-labelledby="tf-h">
    <div class="row between"><h2 id="tf-h">Team focus</h2>
      <label class="f small inline-f" for="sess-team">Team<select id="sess-team" data-sd="teamId">
        ${teams.map(t => `<option value="${esc(t.id)}" ${t.id === d.teamId ? "selected" : ""}>${esc(t.name)}</option>`).join("")}
        <option value="all" ${d.teamId === "all" ? "selected" : ""}>All players in the club</option></select></label></div>
    ${F.reviewed ? `<p class="small muted">From the latest reviews of ${F.reviewed} of ${F.players.length} player${F.players.length === 1 ? "" : "s"}. Lowest team averages first; the number is the team average out of 5. Pick up to 4 to focus on.</p>
      <div class="fchips" role="group" aria-label="Focus skills, lowest team average first">${ranked.map(chip).join("")}</div>
      <details class="small"><summary>Other skills</summary><div class="fchips" style="margin-top:8px">${others.map(chip).join("")}</div></details>
      ${F.gk.length ? `<p class="small"><b>Keepers:</b> ${F.gk.slice(0, 2).map(s => `${esc(s.label)} ${fix1(s.avg)}/5`).join(" · ")}</p>` : ""}
      ${watch.length ? `<div class="small watch"><b>Players to watch</b>${watch.map(s => `<p>${esc(s.label)}: ${s.low.map(p => esc(p.name)).join(", ")} (rated 1 or 2)</p>`).join("")}</div>` : ""}`
    : `<p class="small">${F.players.length ? "No reviews yet for this team." : "No players on this team yet."} Review players under My Teams and recommendations will follow. For now, pick what you want to work on:</p>
      <div class="fchips" role="group" aria-label="Focus skills">${TD_SKILLS.map(s => chip({k:s.k, label:s.label, n:0})).join("")}</div>`}
    <div class="row"><button class="btn primary" data-act="${d.blocks.length ? "sessAutoReplace" : "sessAuto"}">Build a ${esc(d.minutes || 75)}-minute session for me</button></div>
  </section>`;
  const recs = recommendTeamDrills(F, focus, age, 4);
  const recCard = `<section class="card stack" aria-labelledby="tr-h"><h2 id="tr-h">Recommended for ${esc(team ? team.name : "your players")}</h2>
    ${age != null ? `<p class="small muted">Suitable for ${esc(team.ageGroup || "U" + age)}. ${focus.length ? "Matched to your focus: " + focus.map(k => esc(SKILL_LABEL[k])).join(", ") + "." : ""}</p>` : ""}
    ${recs.length ? `<ul class="rec-list">${recs.map(x => `<li><div class="stack" style="gap:2px"><b>${esc(x.d.title)}</b><span class="small muted">${esc(x.d.level)} · ${esc(x.d.phase)} · ${esc(x.d.minutes)} min · ${esc(playersText(x.d))}</span>
      ${whyDrill(x.d, F, focus).length ? `<span class="small">Works on ${esc(whyDrill(x.d, F, focus).join("; "))}</span>` : ""}</div>
      <div class="row nowrap"><button class="btn sm" data-act="modal" data-m="tdrill" data-id="${esc(x.d.id)}" aria-label="Details for ${esc(x.d.title)}">Details</button><button class="btn sm primary" data-act="sessAdd" data-id="${esc(x.d.id)}" aria-label="Add ${esc(x.d.title)} to your session">Add</button></div></li>`).join("")}</ul>`
      : `<p class="small muted">Pick a focus above to see recommendations.</p>`}
    <button class="btn ghost sm" data-act="sessTab" data-id="library">Browse all ${TEAM_DRILLS.length} team drills</button>
  </section>`;
  return `<div class="grid2 sess-grid"><div class="stack">${focusCard}${recCard}</div>${builderHtml(d)}</div>`;
}

function builderHtml(d){
  const total = sessTotal(d.blocks), plan = Number(d.minutes) || 0;
  const lens = SESS_LENGTHS.includes(plan) ? SESS_LENGTHS : SESS_LENGTHS.concat(plan).sort((a, b) => a - b);
  const blk = (b, i) => { const dr = blockDrill(b), last = i === d.blocks.length - 1, t = blockTitle(b);
    return `<li class="blk">
      <div class="blk-h"><span class="blk-n num" aria-hidden="true">${i + 1}</span><div class="stack" style="gap:2px;min-width:0"><b>${esc(t)}</b>
        <span class="small muted">${esc(blockPhase(b))}${dr ? ` · ${esc(dr.level)} · ${esc(playersText(dr))} · ${esc(dr.area)}` : ""}</span></div></div>
      <div class="blk-f">
        <label class="f small min-f" for="blk-m-${i}">Minutes<input type="number" id="blk-m-${i}" min="1" max="120" inputmode="numeric" data-blk="${i}" data-k="minutes" value="${esc(b.minutes)}"></label>
        <label class="f small grow" for="blk-n-${i}">Notes for this block<input type="text" id="blk-n-${i}" maxlength="300" data-blk="${i}" data-k="notes" value="${esc(b.notes || "")}" placeholder="e.g. Focus on body shape"></label>
      </div>
      <div class="row blk-a">
        <button class="btn ghost sm" data-act="sessMove" data-i="${i}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Move ${esc(t)} up">↑ Up</button>
        <button class="btn ghost sm" data-act="sessMove" data-i="${i}" data-dir="1" ${last ? "disabled" : ""} aria-label="Move ${esc(t)} down">↓ Down</button>
        ${dr ? `<button class="btn ghost sm" data-act="modal" data-m="tdrill" data-id="${esc(dr.id)}" aria-label="Details for ${esc(t)}">Details</button>` : ""}
        <button class="btn ghost sm" data-act="sessRemove" data-i="${i}" aria-label="Remove ${esc(t)}">Remove</button>
      </div></li>`; };
  return `<section class="card stack sess-builder" aria-labelledby="sb-h">
    <div class="row between"><h2 id="sb-h">${d.id ? "Edit session" : "Session plan"}</h2>${d.id ? `<span class="pill good">Saved</span>` : ""}</div>
    <label class="f" for="sd-title">Title<input type="text" id="sd-title" maxlength="100" data-sd="title" value="${esc(d.title)}" placeholder="e.g. Tuesday: playing through pressure"></label>
    <div class="row wrap-f">
      <label class="f" for="sd-date">Date<input type="date" id="sd-date" data-sd="date" value="${esc(d.date || "")}"></label>
      <label class="f" for="sd-min">Planned length<select id="sd-min" data-sd="minutes">${lens.map(m => `<option value="${m}" ${m === plan ? "selected" : ""}>${m} minutes</option>`).join("")}</select></label>
    </div>
    <p class="sess-total small" id="sess-total" aria-live="polite">${totalText(total, plan)}</p>
    ${d.blocks.length ? `<ol class="blocks">${d.blocks.map(blk).join("")}</ol>`
      : `<div class="empty small"><p><b>No drills yet.</b> Use “Build a session for me”, add a recommended drill, or browse the team drill library.</p></div>`}
    <details class="add-own"><summary>Add your own activity</summary>
      <form data-form="sessCustom" class="row wrap-f" style="margin-top:8px">
        <label class="f grow" for="own-t">Activity<input type="text" id="own-t" name="title" required maxlength="80" placeholder="e.g. Set pieces: corners"></label>
        <label class="f min-f" for="own-m">Minutes<input type="number" id="own-m" name="minutes" min="1" max="120" value="10" required></label>
        <button class="btn" type="submit">Add</button>
      </form></details>
    <label class="f" for="sd-notes">Notes for the session<textarea id="sd-notes" rows="3" maxlength="4000" data-sd="notes" placeholder="Equipment to bring, who's missing, reminders">${esc(d.notes || "")}</textarea></label>
    <div class="row">
      <button class="btn primary" data-act="sessSave">${d.id ? "Save changes" : "Save session"}</button>
      <button class="btn" data-act="sessPrint" ${d.blocks.length ? "" : "disabled"}>Print or save as PDF</button>
      <button class="btn ghost" data-act="${d.blocks.length || d.id ? "sessNewConfirm" : "sessNew"}">Start a new plan</button>
    </div>
  </section>`;
}
function totalText(total, plan){
  const diff = plan - total;
  return `<b class="num">${total}</b> of ${plan} minutes planned` + (total && diff > 0 ? ` · ${diff} left` : total && diff < 0 ? ` · <span class="over">${-diff} over</span>` : "");
}
function updSessTotal(){ const el = document.getElementById("sess-total"); if(el && S.draft) el.innerHTML = totalText(sessTotal(S.draft.blocks), Number(S.draft.minutes) || 0); }

function teamLibraryHtml(){
  const d = draft(), team = myTeams().find(t => t.id === d.teamId), age = S.tdAllAges ? null : ageOfTeam(team);
  const q = (S.tdSearch || "").trim().toLowerCase(), ph = S.tdPhase || "All", sk = S.tdSkill || "";
  const lvl = TD_LEVELS.includes(S.tdLevel) ? S.tdLevel : (levelForAge(ageOfTeam(team)) || "Beginner");
  const matching = TEAM_DRILLS.filter(dr => (ph === "All" || dr.phase === ph) && (!sk || dr.skills.includes(sk)) && tdAgeOk(dr, age)
    && (!q || [dr.title, dr.summary, dr.phase, dr.level, (METHODS[dr.method] || {}).name, ...dr.skills.map(k => SKILL_LABEL[k])].join(" ").toLowerCase().includes(q)));
  const list = matching.filter(dr => dr.level === lvl);
  const levelTabs = `<div class="subtabs level-tabs" role="tablist" aria-label="Drill level">${TD_LEVELS.map(l => `<button role="tab" data-act="tdLevel" data-id="${l}" aria-selected="${l === lvl}"><span class="lvl-dot lvl-${l.toLowerCase()}" aria-hidden="true"></span>${l} <span class="small muted">(${matching.filter(dr => dr.level === l).length})</span></button>`).join("")}</div>
    <p class="small muted lvl-note">${esc(TD_LEVEL_NOTE[lvl])}${levelForAge(ageOfTeam(team)) === lvl ? ` Suggested for ${esc(team.ageGroup || team.name)}.` : ""}</p>`;
  return `<div class="panel-note small"><p>Academy-style team practices, written by NextPass in plain language. Each drill notes the publicly documented coaching method it comes from: rondos and positional play (Ajax and Barcelona), the Ajax TIPS model, Dutch 4v4, Funino, FIFA 11+ and U.S. Soccer's Play-Practice-Play. They aren't any club's own curriculum, and no club endorses NextPass.</p></div>
    ${levelTabs}
    <div class="lib-tools stack">
      <div class="fchips" role="group" aria-label="Part of the session">${["All", ...PHASES].map(p => `<button type="button" class="fchip" data-act="tdPhase" data-id="${esc(p)}" aria-pressed="${p === ph}">${esc(p === "All" ? "All parts" : p)}</button>`).join("")}</div>
      <div class="row wrap-f">
        <label class="f small search-f" for="td-search">Find a drill<input type="search" id="td-search" data-input="tdSearch" value="${esc(S.tdSearch || "")}" placeholder="e.g. rondo, pressing, finishing"></label>
        <label class="f small" for="td-skill">Works on<select id="td-skill" data-td="skill"><option value="">Any skill</option>${TD_SKILLS.concat(GK_SKILLS).map(s => `<option value="${esc(s.k)}" ${s.k === sk ? "selected" : ""}>${esc(s.label)}</option>`).join("")}</select></label>
        ${ageOfTeam(team) != null ? `<label class="chk small"><input type="checkbox" data-td="allAges" ${S.tdAllAges ? "checked" : ""}> Show drills for all ages (now: suitable for ${esc(team.ageGroup || team.name)})</label>` : ""}
      </div>
    </div>
    ${DIAGRAM_KEY}
    ${ph !== "All" ? `<p class="small muted">${esc(PHASE_NOTE[ph])}</p>` : ""}
    <h2 class="sr-only">${esc(lvl)} drills</h2><p class="small muted" aria-live="polite">${list.length} ${esc(lvl.toLowerCase())} drill${list.length === 1 ? "" : "s"}${matching.length > list.length ? ` · ${matching.length - list.length} more in the other levels` : ""}</p>
    ${list.length ? `<div class="dgrid tdgrid">${list.map(dr => teamDrillCard(dr)).join("")}</div>` : `<div class="empty"><p>No ${esc(lvl.toLowerCase())} drills match. Try another level, part of the session or skill${age != null ? ", or show drills for all ages" : ""}.</p></div>`}`;
}

function savedSessionsHtml(){
  const list = (S.sessions || []).slice().sort((a, b) => String(b.sessionDate || "").localeCompare(String(a.sessionDate || "")) || (b.updatedAt || 0) - (a.updatedAt || 0));
  if(!list.length) return `<div class="empty"><p><b>No saved sessions yet.</b> Plan one on the “Plan a session” tab and save it to reuse or share with your coaches.</p></div>`;
  return `<div class="list sess-list">${list.map(s => `<article class="card sess-item">
    <div class="row between"><div class="stack" style="gap:2px"><h2 class="h3">${esc(s.title)}</h2>
      <span class="small muted">${[s.teamId ? teamName(s.teamId) : "All players", s.sessionDate ? fmtDate(s.sessionDate) : "No date", `${sessTotal(s.blocks)} min`, `${(s.blocks || []).length} block${(s.blocks || []).length === 1 ? "" : "s"}`].map(esc).join(" · ")}</span></div></div>
    ${(s.focus || []).length ? `<p class="small"><span class="muted">Focus:</span> ${(s.focus).map(k => esc(SKILL_LABEL[k] || k)).join(" · ")}</p>` : ""}
    <p class="small muted">${(s.blocks || []).map(b => esc(blockTitle(b))).join(" → ")}</p>
    <div class="row"><button class="btn sm primary" data-act="sessOpen" data-id="${esc(s.id)}" aria-label="Open ${esc(s.title)}">Open</button>
      <button class="btn sm" data-act="sessPrint" data-id="${esc(s.id)}" aria-label="Print ${esc(s.title)}">Print</button>
      <button class="btn sm" data-act="sessCopy" data-id="${esc(s.id)}" aria-label="Copy ${esc(s.title)} into a new plan">Use as template</button>
      ${s.createdBy === S.uid || isAdmin() ? `<button class="btn ghost sm" data-act="sessDel" data-id="${esc(s.id)}" aria-label="Delete ${esc(s.title)}">Delete</button>` : ""}</div>
  </article>`).join("")}</div>`;
}

function printSessionHtml(s){
  const blocks = s.blocks || [];
  let t = 0;
  return `<div class="sess-print">
    <h2>${esc(s.title || "Training session")}</h2>
    <p class="small muted">${[s.teamId ? teamName(s.teamId) : "All players", s.sessionDate ? fmtDate(s.sessionDate) : "", `${sessTotal(blocks)} minutes`].filter(Boolean).map(esc).join(" · ")}${(s.focus || []).length ? ` · Focus: ${s.focus.map(k => esc(SKILL_LABEL[k] || k)).join(", ")}` : ""}</p>
    ${s.notes ? `<p class="small" style="white-space:pre-wrap">${esc(s.notes)}</p>` : ""}
    ${blocks.map((b, i) => { const dr = blockDrill(b), from = t; t += Number(b.minutes) || 0;
      return `<section class="pblk"><h3>${i + 1}. ${esc(blockTitle(b))} <span class="small muted">· ${esc(b.minutes)} min (${from}–${t})</span></h3>
        ${b.notes ? `<p class="small"><b>Notes:</b> ${esc(b.notes)}</p>` : ""}
        ${dr ? `<div class="pblk-in"><div class="pdiag">${diagramSvg(dr)}</div><div class="stack small" style="gap:6px">
          <p><b>Set up:</b> ${esc(dr.setup)} <span class="muted">(${esc(playersText(dr))}; ${esc(dr.equipment)})</span></p>
          <ol>${dr.how.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
          <p><b>Coaching points:</b> ${dr.points.map(esc).join(" ")}</p>
          <p><b>Harder:</b> ${esc(dr.progress)} <b>Easier:</b> ${esc(dr.regress)}</p></div></div>` : ""}
      </section>`; }).join("")}
    <div class="row no-print"><button class="btn primary" type="button" data-act="printNow">Print or save as PDF</button><button class="btn" type="button" data-act="close">Close</button></div>
  </div>`;
}

MODALS.tdrill = ds => { const dr = teamDrillById(ds.id); if(!dr) return `<h2>Drill not found</h2>`;
  return `<h2>${esc(dr.title)}</h2>${teamDrillCard(dr).replace('<article class="drill tdrill">', '<article class="tdrill in-modal">').replace(/<h3>[\s\S]*?<\/h3>/, "").replace('<details class="drill-how" >', '<details class="drill-how" open>')}`; };
MODALS.sessPrint = () => printSessionHtml(S.printSess || {});

Object.assign(CONFIRM, {
  sessDel: ["Delete this session?", "It's removed for every coach in your club. This can't be undone.", "Delete session"],
  sessAutoReplace: ["Replace your current plan?", "The drills in your plan are replaced with a new recommended session. Your title, date and notes stay.", "Replace drills"],
  sessNewConfirm: ["Start a new plan?", "Anything you haven't saved in the current plan is cleared.", "Start new plan"]
});
Object.assign(ACTS, {
  sessTab: ds => { S.sessTab = ds.id; render(); },
  sessFocus: ds => { const d = draft(), f = d.focus || (d.focus = []); const i = f.indexOf(ds.id);
    if(i >= 0) f.splice(i, 1); else { if(f.length >= 4) return toast("Pick up to 4 focus skills. Remove one first.", true); f.push(ds.id); }
    d.focusTouched = true; keepDraft(); render(); },
  sessAuto: () => { const d = draft(), team = myTeams().find(t => t.id === d.teamId);
    const F = teamFocus(d.teamId || "all"); d.blocks = autoBuild(Number(d.minutes) || 75, F, d.focus || [], ageOfTeam(team));
    if(!d.title) d.title = (team ? team.name + ": " : "") + ((d.focus || []).length ? d.focus.slice(0, 2).map(k => SKILL_LABEL[k]).join(" and ") : "Training");
    keepDraft(); render(); toast(`Session built: ${d.blocks.length} blocks, ${sessTotal(d.blocks)} minutes. Change anything you like.`);
    const el = document.getElementById("sb-h"); if(el){ el.tabIndex = -1; el.focus(); } },
  sessAdd: ds => { const dr = teamDrillById(ds.id); if(!dr) return; const d = draft();
    if(d.blocks.length >= 30) return toast("A session can have up to 30 blocks.", true);
    d.blocks.push({drillId:dr.id, minutes:dr.minutes, notes:""}); keepDraft(); if(document.querySelector("#modal .tdrill")) closeModal(); render();
    toast(`Added “${dr.title}” (${dr.minutes} min). Total: ${sessTotal(d.blocks)} of ${d.minutes} minutes.`); },
  sessMove: ds => { const d = draft(), i = +ds.i, j = i + (+ds.dir); if(j < 0 || j >= d.blocks.length) return;
    [d.blocks[i], d.blocks[j]] = [d.blocks[j], d.blocks[i]]; keepDraft(); render();
    const b = document.querySelector(`[data-act="sessMove"][data-i="${j}"][data-dir="${ds.dir}"]:not([disabled])`) || document.querySelector(`[data-act="sessMove"][data-i="${j}"]:not([disabled])`); if(b) b.focus(); },
  sessRemove: ds => { const d = draft(), b = d.blocks[+ds.i]; if(!b) return; d.blocks.splice(+ds.i, 1); keepDraft(); render(); toast(`Removed “${blockTitle(b)}”.`);
    const h = document.getElementById("sb-h"); if(h){ h.tabIndex = -1; h.focus(); } },
  sessNew: () => { S.draft = newDraft(sessTeamId()); keepDraft(); render(); },
  sessSave: async () => {
    const d = draft(); if(!d.blocks.length) return toast("Add at least one drill before saving.", true);
    const team = S.teams.find(t => t.id === d.teamId);
    const title = (d.title || "").trim() || `${team ? team.name : "Team"} session${d.date ? " · " + fmtDate(d.date) : ""}`;
    const id = d.id || crypto.randomUUID();
    const row = {clubId:S.me.clubId, teamId:team ? team.id : null, title:title.slice(0, 100), sessionDate:d.date || null, minutes:Number(d.minutes) || 0,
      focus:(d.focus || []).slice(0, 4), notes:(d.notes || "").slice(0, 4000), updatedAt:Date.now(),
      blocks:d.blocks.slice(0, 30).map(b => b.custom ? {custom:true, title:String(b.title || "").slice(0, 80), minutes:Math.max(0, Math.min(120, Number(b.minutes) || 0)), notes:String(b.notes || "").slice(0, 300)}
        : {drillId:b.drillId, minutes:Math.max(0, Math.min(120, Number(b.minutes) || 0)), notes:String(b.notes || "").slice(0, 300)})};
    if(!d.id){ row.createdBy = S.uid; row.createdAt = Date.now(); }
    const ok = await save(() => S.db.collection("sessions").doc(id).set(row), d.id ? "Session updated" : "Session saved. Find it under Saved sessions.");
    if(ok){ d.id = id; d.title = row.title; keepDraft(); render(); }
  },
  sessOpen: ds => { const s = (S.sessions || []).find(x => x.id === ds.id); if(!s) return;
    S.draft = {id:s.id, title:s.title, teamId:s.teamId || "all", date:s.sessionDate || "", minutes:s.minutes || sessTotal(s.blocks), focus:(s.focus || []).slice(), blocks:JSON.parse(JSON.stringify(s.blocks || [])), notes:s.notes || "", focusTouched:true};
    S.sessTeam = S.draft.teamId; S.sessTab = "plan"; keepDraft(); render(); window.scrollTo(0, 0); },
  sessCopy: ds => { ACTS.sessOpen(ds); if(S.draft){ S.draft.id = null; S.draft.date = ""; S.draft.title = S.draft.title + " (copy)"; keepDraft(); render(); toast("Copied into a new plan. Save it when you're ready."); } },
  sessDel: async ds => { const ok = await save(() => S.db.doc("sessions/" + ds.id).delete(), "Session deleted");
    if(ok && S.draft && S.draft.id === ds.id){ S.draft.id = null; keepDraft(); render(); } },
  sessPrint: ds => { const s = ds.id ? (S.sessions || []).find(x => x.id === ds.id) : (() => { const d = draft(); return {...d, teamId:d.teamId === "all" ? null : d.teamId, sessionDate:d.date}; })();
    if(!s) return; S.printSess = s; openModal(printSessionHtml(s)); },
  printNow: () => window.print(),
  tdPhase: ds => { S.tdPhase = ds.id; render(); },
  tdLevel: ds => { S.tdLevel = ds.id; render(); const b = document.querySelector(`[data-act="tdLevel"][data-id="${ds.id}"]`); if(b) b.focus(); }
});
ACTS.sessAutoReplace = ACTS.sessAuto;
ACTS.sessNewConfirm = ACTS.sessNew;
FORMS.sessCustom = async fd => {
  const d = draft(), title = String(fd.get("title") || "").trim(); if(!title) return;
  if(d.blocks.length >= 30) return toast("A session can have up to 30 blocks.", true);
  d.blocks.push({custom:true, title:title.slice(0, 80), minutes:Math.max(1, Math.min(120, Number(fd.get("minutes")) || 10)), notes:""});
  keepDraft(); render(); toast(`Added “${title}”.`);
};
document.addEventListener("input", ev => {
  const t = ev.target; if(!t.dataset || !S.draft) return;
  if(t.dataset.sd && t.dataset.sd !== "teamId"){ const k = t.dataset.sd; S.draft[k] = k === "minutes" ? Number(t.value) || 0 : t.value; if(k === "minutes") updSessTotal(); keepDraft(); }
  else if(t.dataset.blk != null){ const b = S.draft.blocks[+t.dataset.blk]; if(!b) return; const k = t.dataset.k;
    b[k] = k === "minutes" ? Math.max(0, Math.min(120, Number(t.value) || 0)) : t.value; if(k === "minutes") updSessTotal(); keepDraft(); }
  else if(t.dataset.input === "tdSearch"){ S.tdSearch = t.value; const pos = t.selectionStart; render();
    const el = document.getElementById("td-search"); if(el){ el.focus(); try { el.setSelectionRange(pos, pos); } catch(_){} } }
});
document.addEventListener("change", ev => {
  const t = ev.target; if(!t.dataset) return;
  if(t.dataset.sd === "teamId" && S.draft){ S.sessTeam = t.value;
    if(S.draft.blocks.length || S.draft.id){ S.draft.teamId = t.value; if(!S.draft.focusTouched) S.draft.focus = defaultFocus(teamFocus(t.value)); }
    else S.draft = newDraft(t.value);
    keepDraft(); render(); const el = document.getElementById("sess-team"); if(el) el.focus(); }
  if(t.dataset.sd === "minutes" && S.draft){ render(); const el = document.getElementById("sd-min"); if(el) el.focus(); }
  if(t.dataset.td === "skill"){ S.tdSkill = t.value; render(); const el = document.getElementById("td-skill"); if(el) el.focus(); }
  if(t.dataset.td === "allAges"){ S.tdAllAges = t.checked; render(); const el = document.querySelector('[data-td="allAges"]'); if(el) el.focus(); }
});

/* ---------- sign-in screens ---------- */
function setupView(){
  return `<div class="card stack" style="max-width:640px">
    <h1>Almost there</h1>
    <p>This copy of ${APP_NAME} isn't connected to its database yet. Open <b>config.js</b> and paste in your Supabase project URL and publishable key.</p>
  </div>`;
}
function authView(){
  if(!S.portal && S.wantSignin) return `<section class="stack" style="gap:20px"><div class="stack" style="gap:6px"><h1>Sign in to ${APP_NAME}</h1><p class="muted">Choose how you use ${APP_NAME}.</p></div>${portalCards("pickPortal")}</section>`;
  if(!S.portal) return homeView();
  const coach = S.portal === "coach", college = S.portal === "college", pro = S.portal === "pro";
  const mode = S.authMode || "signin";
  const title = mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Sign in";
  let side = pro
    ? `<span class="pill plain" style="align-self:flex-start">Pro scout</span>
       <h1>${mode==="signup"?"Scout the next generation":"Welcome back"}</h1>
       <p style="max-width:52ch">Search Recruitment Profiles of players aged ${RECRUIT_AGE} and over by position, age, playing status and level. Keep a private shortlist and message families directly.</p>
       <div class="card stack"><h2 class="h3">Approved scouts only</h2><p class="small">Create an account and tell us which club, academy or agency you work for. ${APP_NAME} checks every scout before they can see players. It's free.</p></div>`
    : college
    ? `<span class="pill plain" style="align-self:flex-start">College coach</span>
       <h1>${mode==="signup"?"Find your next recruits":"Welcome back, coach"}</h1>
       <p style="max-width:52ch">Search Recruitment Profiles of players aged ${RECRUIT_AGE} and over by position, class, GPA, league and division interest. Keep a private shortlist and message families directly.</p>
       <div class="card stack"><h2 class="h3">Free for college coaches</h2><p class="small">Search, shortlist and messaging are free once you create an account. Use your school email address ending in <b>.edu</b>; families see it when you message them.</p></div>`
    : coach
    ? `<span class="pill warn" style="align-self:flex-start">Coach</span>
       <h1>${mode==="signup"?"Bring your club onto "+APP_NAME:"Welcome back, coach"}</h1>
       <p style="max-width:52ch">Track every player's development, assign home drills, write references for scouts and keep your teams in the loop.</p>
       <div class="card stack"><h2 class="h3">New club?</h2><p class="small">Create an account, then start your club. You'll get a club code to share with your other coaches.</p></div>`
    : `<span class="pill good" style="align-self:flex-start">Parent / Player</span>
       <h1>${mode==="signup"?"Follow your player's progress":"Welcome back"}</h1>
       <p style="max-width:52ch">See your coach's reviews, practice the drills they pick for you, build a highlight profile and chat with your team.</p>
       <div class="card stack"><h2 class="h3">First time here?</h2><p class="small">Create an account with your email and set up your player's profile. Then find your club and ask to join your team.</p></div>`;
  if(S.invite && (coach || S.portal === "family")) side = inviteBanner() + side;
  return `<button class="btn ghost back" data-act="pickPortal" data-id="">← ${pro ? "Not a pro scout? Go back" : college ? "Not a college coach? Go back" : coach?"Not a coach? Switch to Parent / Player":"Not a parent or player? Switch to Coach"}</button>
  <section class="hero">
    <div class="stack">${side}</div>
    <form class="card stack auth-${coach||college||pro?"coach":"family"}" data-form="auth" style="align-self:start">
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
  <text x="141" y="191" font-family="Inter Display, Inter, Arial, sans-serif" font-weight="700" font-size="24" fill="#ffffff">8</text>
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
    {date:"2026-08-22", coachName:"Coach Rivera", baseline:"age", summary:"Composed passer with a great attitude. Needs to win more duels and track back.",
     ratings:{first_touch:3,passing:4,shooting:2,dribbling:3,physicality:2,handling_speed:3,separation_speed:2,positional_awareness:3,decision_making:3,defending:2,tactical_understanding:3,communication:3,coachability:5,weak_foot:2,skill_moves:2,sprint_speed:2,stamina:3,vision:3,attitude:5},
     strengths:["Passing range","Work rate"], improve:["1v1 defending","Strength in duels"], note:""},
    {date:"2026-10-03", coachName:"Coach Rivera", baseline:"age", summary:"Checking his shoulder before receiving has made his first touch much cleaner. Defending is improving.",
     ratings:{first_touch:4,passing:4,shooting:2,dribbling:3,physicality:3,handling_speed:3,separation_speed:3,positional_awareness:4,decision_making:3,defending:3,tactical_understanding:3,communication:3,coachability:5,weak_foot:2,skill_moves:3,sprint_speed:3,stamina:3,vision:4,attitude:5},
     strengths:["Scanning","Passing range"], improve:["Finishing","Weak foot"], note:""},
    {date:"2026-11-07", coachName:"Coach Rivera", baseline:"age", summary:"Now dictating the tempo in midfield. Next step: arrive in the box and shoot with confidence.",
     ratings:{first_touch:4,passing:5,shooting:3,dribbling:3,physicality:3,handling_speed:3,separation_speed:3,positional_awareness:4,decision_making:4,defending:3,tactical_understanding:4,communication:4,coachability:5,weak_foot:3,skill_moves:3,sprint_speed:3,stamina:4,vision:5,attitude:5},
     strengths:["Passing range","Scanning","Communication"], improve:["Finishing","Weak foot","Staying goal-side"],
     note:"Gray, your range of passing has been the best in the group this month, and you're talking much more to organise the midfield. To take the next step:\n1. When the shooting window opens, take it instead of looking for one more pass.\n2. Keep working your left foot so defenders can't force you back inside.\n3. When we lose the ball, get goal-side first, then press.\nGreat attitude every session. Keep it up."}
  ],
  drills:[{title:"Laces strike at a wall target", meta:"Finishing · 10 min", per:3, done:2, note:"Pick your corner before you strike. Keep it below knee height."},
          {title:"Weak-foot only", meta:"Passing · 12 min", per:2, done:1, note:"Left foot only, every touch."}],
  reference:{text:"Gray is one of the most coachable players I've worked with. He reads the game early, keeps the ball moving and has become a real voice in our midfield. He takes feedback on board and turns it into progress week after week.", author:"Coach Rivera", title:"Head Coach, U14 Boys Premier"},
  history:[{club:"Example FC", team:"U14 Boys Premier", from:"2023", to:"Present", notes:"League runners-up, fall 2026"},
           {club:"Northside Rec", team:"U10 Coed", from:"2020", to:"2023", notes:"Started playing"}],
  recruit:{gradYear:"2031", height:"5'4\"", school:"Example Middle School", gpa:"3.8",
    highlights:[{title:"League runners-up", year:"2026", details:"Started every game in midfield."},{title:"Team captain", year:"2026", details:""}],
    stats:[{season:"Fall 2026", team:"U14 Boys Premier", games:14, goals:4, assists:9}]}
};
const EX_P = {uGroup:14};
function exampleProfile(){
  const E = EXAMPLE, rs = E.reviews, last = rs[rs.length-1], prev = rs[rs.length-2];
  const o = overall(last), po = overall(prev);
  return `<section class="example stack" aria-labelledby="ex-h">
    <div class="row between">
      <div class="stack" style="gap:4px"><h2 id="ex-h">See what a player profile looks like</h2>
        <p class="muted small">What a family sees after a few months of reviews.</p></div>
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
          <div class="stack" style="gap:6px"><b class="small">Strengths</b><div class="chips">${last.strengths.map(t=>`<span class="chip str">${esc(t)}</span>`).join("")}</div></div>
          <div class="stack" style="gap:6px"><b class="small">Work on</b><div class="chips">${last.improve.map(t=>`<span class="chip imp">${esc(t)}</span>`).join("")}</div></div>
          <div class="note" style="white-space:pre-wrap">${esc(last.note)}</div>
          ${reviewHistoryHtml(rs, {player:EX_P})}
        </div>
      </div>
      <div class="stack" style="gap:20px">
        <div class="card stack"><h3>Skill ratings</h3>${ratingsHtml(last, prev, EX_P)}</div>
      </div>
    </div>
    <details class="ex-more">
      <summary>See home drills, recruiting and progress</summary>
      <div class="grid2">
        <div class="stack" style="gap:20px">
        <div class="card stack">
          <h3>Home drills this week</h3>
          ${E.drills.map(d=>`<div class="drill"><div class="row between"><b>${esc(d.title)}</b><span class="small muted">${esc(d.meta)}</span></div>
            <div class="row small"><span class="num"><b>${d.done} of ${d.per}</b> this week</span><div class="progress" aria-hidden="true"><i style="width:${Math.round(d.done/d.per*100)}%"></i></div></div>
            <p class="small"><b>Coach:</b> ${esc(d.note)}</p></div>`).join("")}
        </div>
        <div class="card stack">
          <div class="row between"><h3>College recruiting</h3><span class="pill plain">From age ${RECRUIT_AGE}</span></div>
          <p class="small muted">From ${RECRUIT_AGE}, a Recruitment Profile adds academics, highlights and references like this one.</p>
          <div class="ref reference"><blockquote>${esc(E.reference.text)}</blockquote><span class="small"><b>${esc(E.reference.author)}</b>, ${esc(E.reference.title)}</span></div>
          <div><a class="btn sm" href="#recruiting">How college recruiting works</a></div>
        </div>
        </div>
        <div class="stack" style="gap:20px">
          <div class="card stack"><h3>Progress over time</h3>${progressSummary(rs)}</div>
        </div>
      </div>
    </details>
  </section>`;
}
function savePortal(p){ S.portal = p || null; try { if(p) localStorage.setItem("np.portal", p); else localStorage.removeItem("np.portal"); } catch(_){} }
ACTS.markInterest = async ds => { const ok = await save(() => rpc("mark_interest", {iid:ds.id, p_status:ds.status}), ds.status === "archived" ? "Archived" : null); if(ok) schedule("interest"); };
ACTS.pickPortal = ds => {
  savePortal(ds.id); S.publicPage = null; S.menuOpen = false;
  S.authMode = ds.mode === "signup" ? "signup" : "signin";
  try { history.replaceState(null, "", location.pathname + location.search + (ds.id ? "#" + (ds.id === "coach" ? "coach" : ds.id === "college" ? "college" : ds.id === "pro" ? "pro" : "parent") : "")); } catch(_){}
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
  S.meta = session && session.user ? (session.user.user_metadata || {}) : {};
  S.pendingEmail = session && session.user ? (session.user.new_email || "") : "";
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
    const actual = S.me.role === "family" ? "family" : S.me.role === "college" ? "college" : S.me.role === "pro" ? "pro" : "coach";
    if(S.portal && S.portal !== actual && event === "SIGNED_IN") toast(actual === "family" ? "This is a parent / player account, so we opened the family view." : actual === "college" ? "This is a college coach account, so we opened college recruiting." : actual === "pro" ? "This is a pro scout account, so we opened pro recruiting." : "This is a coach account, so we opened the coach view.");
    savePortal(actual);
  }
  if(S.publicSlug && !S.pub) loadPublic(S.publicSlug);
}

(async () => {
  const cfg = window.NEXTPASS_CONFIG || window.NEXTPLAY_CONFIG || {}; /* NEXTPLAY_CONFIG: older config.js files */
  const m = /^profile-([a-z0-9]+)$/.exec(location.hash.slice(1));
  if(m) S.publicSlug = m[1];
  try { S.portal = localStorage.getItem("np.portal") || null; } catch(_){}
  if(PAGE_IDS.includes(location.hash.slice(1))) S.publicPage = location.hash.slice(1);
  if(location.hash === "#for-parents"){ let n = 0; const go = () => { const sec = document.getElementById("for-parents-sec"); if(sec){ sec.scrollIntoView({block:"start"}); sec.focus({preventScroll:true}); } else if(++n < 30) setTimeout(go, 150); }; setTimeout(go, 150); }
  if(location.hash === "#coach") savePortal("coach");
  if(location.hash === "#parent") savePortal("family");
  if(location.hash === "#college") savePortal("college");
  if(location.hash === "#pro") savePortal("pro");
  try { S.invite = JSON.parse(localStorage.getItem("np-invite") || "null"); } catch(_){ S.invite = null; }
  if(readInviteHash(location.hash.slice(1))){ S.authMode = "signup"; try { history.replaceState(null, "", location.pathname + location.search); } catch(_){} }
  if(!cfg.supabaseUrl || !cfg.supabaseKey || /YOUR_/.test(cfg.supabaseUrl + cfg.supabaseKey)){
    S.loading = false; S.noConfig = true; render(); return;
  }
  sb = createClient(cfg.supabaseUrl, cfg.supabaseKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
  S.db = DB; S.assets = ASSETS;
  loadInviteInfo();
  render();
  loadTimer = setTimeout(() => { if(S.loading){ S.notice = "Still connecting. Check your internet connection."; render(); } }, 10000);
  sb.auth.onAuthStateChange((event, session) => { setTimeout(() => onSession(session, event), 0); });
  const {data} = await sb.auth.getSession();
  await onSession(data.session, "INITIAL");
})();
