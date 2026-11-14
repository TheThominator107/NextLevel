/* NextPlay drill animations.
   A small engine draws a top-down scene (grass, cones, wall, goal) and moves "actors"
   (player, helper, keeper, ball) between keyframes. Each drill has a short script below.
   Only animations on screen run; tap to pause or play; reduced-motion users tap to play. */

const W = 160, H = 90;
const BLUE = "#1f5fc9", ORANGE = "#d9572a", NAVY = "#14213a", KEEPER = "#7a3fc6";

/* ---------- script helpers ---------- */
// a keyframe: time (s), positions {actor:[x,y,z?]}, caption, speech {actor:"text"}
const K = (t, pos, cap, say) => ({t, pos: pos || {}, cap, say});
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

// ball that travels with a player: placed a few units ahead in the direction of movement
function carry(keys, who = "p", ball = "b", lead = 3.2){
  const pk = keys.filter(k => k.pos[who] && !k.pos[ball]);
  pk.forEach((k, i) => {
    const nx = pk[i + 1] || pk[i - 1]; if(!nx) return;
    const a = k.pos[who], c = nx.pos[who], dir = pk[i + 1] ? 1 : -1;
    let dx = (c[0] - a[0]) * dir, dy = (c[1] - a[1]) * dir; const L = Math.hypot(dx, dy) || 1;
    k.pos[ball] = [a[0] + dx / L * lead, a[1] + dy / L * lead, 0];
  });
  return keys;
}

/* ---------- scenes ---------- */
const field = (extra = []) => [["grass"], ...extra];
const goalTop = [["goalTop", 80, 8, 50]];
const goalRight = [["goalRight", 152, 45, 30]];
const wallTop = [["wall", 30, 9, 130, 9]];

/* ---------- templates ---------- */
const T = {
  // close-up ball mastery: body + two feet + ball
  mastery(kind, cap2){ return {...this._mastery(kind, cap2), zoom: [80, 44, 1.75]}; },
  _mastery(kind, cap2){
    const B = [80, 56], L = [72, 46], R = [88, 46];
    const base = {body: B};
    const k = [];
    if(kind === "tap"){
      for(let i = 0; i < 6; i++){ const t = i * 0.6, right = i % 2 === 0;
        k.push(K(t, {...base, lf: right ? L : [77, 40], rf: right ? [83, 40] : R, b: [80, 35, 0]}, i < 3 ? "Tap the top, sole of each foot" : "Stay on the balls of your feet"));
        k.push(K(t + 0.3, {lf: L, rf: R})); }
      return {dur: 3.6, scene: [["grass", "close"]], actors: {body: "body", lf: "foot", rf: "foot", b: "ball"}, keys: k};
    }
    if(kind === "side"){
      for(let i = 0; i < 6; i++){ const t = i * 0.5, toR = i % 2 === 0;
        k.push(K(t, {...base, lf: [70, 42], rf: [90, 42], b: [toR ? 74 : 86, 40, 0]}, "Inside of each foot, left-right-left")); }
      k.push(K(3, {b: [74, 40, 0]}));
      return {dur: 3, scene: [["grass", "close"]], actors: {body: "body", lf: "foot", rf: "foot", b: "ball"}, keys: k};
    }
    if(kind === "roll"){
      k.push(K(0, {...base, lf: L, rf: [70, 40], b: [70, 36, 0]}, "Roll it across with the sole"));
      k.push(K(1.2, {rf: [90, 40], b: [90, 36, 0]}));
      k.push(K(1.8, {rf: [88, 34], b: [88, 28, 0]}, "Pull back, push forward"));
      k.push(K(2.4, {rf: [88, 44], b: [88, 38, 0]}));
      k.push(K(3.0, {rf: [88, 36], b: [88, 30, 0]}));
      k.push(K(3.6, {rf: [70, 40], b: [70, 36, 0]}));
      return {dur: 3.6, scene: [["grass", "close"]], actors: {body: "body", lf: "foot", rf: "foot", b: "ball"}, keys: k};
    }
    if(kind === "inout"){
      k.push(K(0, {...base, lf: L, rf: [86, 42], b: [82, 38, 0]}, "Inside of the foot out…"));
      k.push(K(0.6, {rf: [94, 42], b: [96, 38, 0]}));
      k.push(K(1.2, {rf: [92, 40], b: [84, 38, 0]}, "…outside of the same foot back"));
      k.push(K(1.8, {rf: [86, 42], b: [82, 38, 0]}));
      k.push(K(2.4, {lf: [74, 42], rf: R, b: [78, 38, 0]}, "Then the other foot"));
      k.push(K(3.0, {lf: [66, 42], b: [64, 38, 0]}));
      k.push(K(3.6, {lf: [68, 40], b: [76, 38, 0]}));
      k.push(K(4.2, {lf: L, rf: [86, 42], b: [82, 38, 0]}));
      return {dur: 4.2, scene: [["grass", "close"]], actors: {body: "body", lf: "foot", rf: "foot", b: "ball"}, keys: k};
    }
    if(kind === "juggle" || kind === "cushion"){
      const cush = kind === "cushion";
      for(let i = 0; i < 4; i++){ const t = i * 0.9, right = i % 2 === 0;
        k.push(K(t, {...base, lf: right ? L : [78, 40], rf: right ? [82, 40] : R, b: [80, 38, cush && i === 0 ? 1 : 0.05]},
          cush ? ["Toss it up", "Cushion on the thigh", "Let it drop", "Stop it with the sole"][i] : "Keep it up: feet, then alternate"));
        k.push(K(t + 0.45, {lf: L, rf: R, b: [80, 38, cush ? (i === 0 ? 0.4 : 0.2) : 0.9]})); }
      k.push(K(3.6, {b: [80, 38, cush ? 1 : 0.05]}));
      return {dur: 3.6, scene: [["grass", "close"]], actors: {body: "body", lf: "foot", rf: "foot", b: "ball"}, keys: k};
    }
    // circle: ball around the weak foot
    const pts = [[90, 38], [96, 46], [90, 54], [84, 46]];
    pts.concat([pts[0]]).forEach((q, i) => k.push(K(i * 0.7, {...base, lf: L, rf: [q[0] - 4, q[1] + 2], b: [q[0], q[1], 0]}, cap2 || "Weaker foot only")));
    return {dur: 2.8, scene: [["grass", "close"]], actors: {body: "body", lf: "foot", rf: "foot", b: "ball"}, keys: k};
  },

  // passing against a wall (or a partner), with variations
  wall(o = {}){
    const y = o.y || 62, x = o.x || 80, top = o.partner ? 16 : 11;
    const scene = field([...(o.partner ? [] : wallTop), ...(o.scene || [])]);
    const actors = {p: "player", b: "ball", ...(o.partner || o.helper ? {h: "helper"} : {})};
    const k = []; let t = 0;
    const hpos = o.partner ? [x, top - 2] : o.helper;
    for(let i = 0; i < (o.n || 3); i++){
      const side = o.alt ? (i % 2 ? -2.5 : 2.5) : 0, px = o.moveTo ? o.moveTo[i % o.moveTo.length][0] : x, py = o.moveTo ? o.moveTo[i % o.moveTo.length][1] : y;
      k.push(K(t, {p: [px, py], b: [px + side, py - 4, 0], ...(hpos ? {h: hpos} : {})}, (o.caps || ["Pass"])[i % (o.caps || ["Pass"]).length], o.say ? {[o.sayWho || "h"]: o.say[i % o.say.length]} : null));
      t += 0.8; k.push(K(t, {b: [px + side, top, 0]}));
      t += 0.8; k.push(K(t, {b: [px + side, py - 4, 0]}, o.recv ? o.recv[i % o.recv.length] : "Control"));
      if(o.after){ const a = o.after[i % o.after.length]; t += 0.6; k.push(K(t, {p: [a[0], a[1] + 4], b: [a[0], a[1], 0]}, a[2])); t += 0.5; }
      t += 0.4;
    }
    k.push(K(t, {p: [x, y], b: [x, y - 4, 0]}));
    return {dur: t, scene, actors, keys: k};
  },

  // dribbling through cones and other patterns
  dribble(kind){
    let k = [], scene, cap;
    if(kind === "weave" || kind === "skill" || kind === "combo"){
      const n = kind === "weave" ? 6 : kind === "skill" ? 3 : 5, x0 = 30, dx = kind === "weave" ? 18 : kind === "skill" ? 34 : 22;
      const cy = 45; scene = field(Array.from({length: n}, (_, i) => ["cone", x0 + i * dx, kind === "combo" ? cy + (i % 2 ? -10 : 10) : cy]));
      k.push(K(0, {p: [14, 45]}, kind === "weave" ? "Weave: right foot only" : kind === "skill" ? "A move at every cone" : "Two moves together, fast"));
      for(let i = 0; i < n; i++){ const cx = x0 + i * dx, yy = kind === "combo" ? cy + (i % 2 ? -10 : 10) : cy, off = (kind === "combo" ? (i % 2 ? 9 : -9) : (i % 2 ? 7 : -7));
        if(kind === "skill"){ k.push(K(0.9 + i * 1.4, {p: [cx - 8, yy]}, ["Step-over", "Scissor", "Roll and cut"][i])); k.push(K(1.25 + i * 1.4, {p: [cx - 6, yy - 6]})); k.push(K(1.7 + i * 1.4, {p: [cx + 8, yy + 7]}, "Explode out of it")); }
        else k.push(K(0.55 + i * (kind === "weave" ? 0.55 : 0.75), {p: [cx, yy + off]}, i === Math.ceil(n / 2) && kind === "weave" ? "Then inside and outside" : undefined));
      }
      const last = k[k.length - 1].t + 0.6; k.push(K(last, {p: [150, 45]}));
      return {dur: last + 0.4, scene, actors: {p: "player", b: "ball"}, keys: carry(k)};
    }
    if(kind === "pushstop" || kind === "race"){
      scene = field([["cone", 20, 45], ["cone", 140, 45]]); const stops = kind === "pushstop" ? [50, 80, 110, 140] : [140];
      k.push(K(0, {p: [20, 45]}, kind === "pushstop" ? "Small touches…" : "Laces, every 2–3 steps")); let t = 0;
      stops.forEach(x => { t += kind === "pushstop" ? 0.9 : 1.6; k.push(K(t, {p: [x, 45]}, kind === "pushstop" ? "Stop it dead with the sole" : "Stop it dead on the line")); t += 0.5; k.push(K(t, {p: [x, 45]})); });
      t += kind === "pushstop" ? 1.6 : 1.4; k.push(K(t, {p: [20, 45]}, kind === "pushstop" ? "Other foot back" : "Turn and race back"));
      return {dur: t + 0.3, scene, actors: {p: "player", b: "ball"}, keys: carry(k)};
    }
    if(kind === "pace"){
      scene = field([["cone", 80, 45, ORANGE, "big"]]);
      k.push(K(0, {p: [15, 45]}, "Slow toward the cone…")); k.push(K(1.8, {p: [68, 45]})); k.push(K(2.3, {p: [70, 40]}, "Drop the shoulder"));
      k.push(K(2.6, {p: [74, 54]}, "…then explode away")); k.push(K(3.3, {p: [125, 60]})); k.push(K(3.8, {p: [145, 62]}));
      return {dur: 4.2, scene, actors: {p: "player", b: "ball"}, keys: carry(k)};
    }
    if(kind === "turns"){
      scene = field([["cone", 120, 45]]); const names = ["Inside hook", "Outside hook", "Cruyff", "Drag-back"]; let t = 0;
      names.forEach((n, i) => { k.push(K(t, {p: [40, 45]}, n)); t += 1.1; k.push(K(t, {p: [112, 45 + (i % 2 ? -3 : 3)]})); t += 0.35; k.push(K(t, {p: [110, 45 + (i % 2 ? 4 : -4)]}, "Accelerate away")); t += 0.9; });
      k.push(K(t, {p: [40, 45]}));
      return {dur: t + 0.2, scene, actors: {p: "player", b: "ball"}, keys: carry(k)};
    }
    // colour gates
    scene = field([["gate", 30, 18, 12, "#e0b400"], ["gate", 130, 18, 12, BLUE], ["gate", 80, 80, 12, "#c0392b"]]);
    k.push(K(0, {p: [80, 45], h: [148, 70]}, "Dribble in the middle, head up"));
    k.push(K(1, {p: [70, 40]}, null, {h: "Yellow!"})); k.push(K(2, {p: [32, 14]}, "Through the yellow gate")); k.push(K(2.8, {p: [80, 45]}));
    k.push(K(3.6, {p: [90, 50]}, null, {h: "Red!"})); k.push(K(4.5, {p: [80, 84]}, "Through the red gate")); k.push(K(5.3, {p: [80, 45]}));
    return {dur: 5.6, scene, actors: {p: "player", b: "ball", h: "helper"}, keys: carry(k)};
  },

  // running patterns without the ball
  run(kind){
    const k = []; let scene;
    if(kind === "5105"){
      scene = field([["cone", 50, 45], ["cone", 80, 45], ["cone", 110, 45], ["label", 65, 38, "5 yd"], ["label", 95, 38, "5 yd"]]);
      k.push(K(0, {p: [80, 50]}, "Start in the middle")); k.push(K(0.9, {p: [110, 50]}, "5 right")); k.push(K(2.4, {p: [50, 50]}, "10 left")); k.push(K(3.3, {p: [80, 50]}, "5 back"));
      return {dur: 4, scene, actors: {p: "player"}, keys: k};
    }
    if(kind === "first"){
      scene = field([["cone", 125, 45]]);
      k.push(K(0, {p: [45, 45], h: [35, 70]}, "Side-on, wait for the call")); k.push(K(1.0, {p: [45, 45]}, null, {h: "Go!"})); k.push(K(1.2, {p: [50, 45]}, "Short, quick first steps"));
      k.push(K(2.2, {p: [125, 45]})); k.push(K(3.2, {p: [125, 45]})); k.push(K(3.8, {p: [45, 45]}));
      return {dur: 4, scene, actors: {p: "player", h: "helper"}, keys: k};
    }
    if(kind === "accel"){
      scene = field([["cone", 15, 45], ["cone", 65, 45], ["cone", 90, 45], ["cone", 145, 45]]);
      k.push(K(0, {p: [15, 45]}, "Sprint")); k.push(K(1.0, {p: [65, 45]}, "Brake: short, choppy steps")); k.push(K(2.2, {p: [90, 45]}, "Go again")); k.push(K(3.1, {p: [145, 45]})); k.push(K(4.2, {p: [15, 45]}));
      return {dur: 4.4, scene, actors: {p: "player"}, keys: k};
    }
    if(kind === "ladder"){
      scene = field([["ladder", 30, 38, 8, 12, 14]]);
      k.push(K(0, {p: [24, 45]}, "One foot in each square"));
      for(let i = 0; i < 8; i++) k.push(K(0.3 + i * 0.28, {p: [36 + i * 12, 45 + (i % 2 ? 3 : -3)]}, i === 4 ? "Light, quick feet" : undefined));
      k.push(K(2.9, {p: [136, 45]})); k.push(K(3.8, {p: [24, 45]}));
      return {dur: 4, scene, actors: {p: "player"}, keys: k};
    }
    // recovery run
    scene = field([["cone", 120, 30], ["cone", 45, 62], ["goalLeft"]]);
    k.push(K(0, {p: [120, 34], h: [140, 70]}, "In attack…")); k.push(K(0.7, {p: [120, 34]}, null, {h: "Lost it!"}));
    k.push(K(2.0, {p: [45, 60]}, "Sprint back goal-side")); k.push(K(2.5, {p: [42, 58]}, "Turn, get side-on")); k.push(K(3.6, {p: [120, 34]}));
    return {dur: 3.8, scene, actors: {p: "player", h: "helper"}, keys: k};
  },

  // shooting at a goal on the right
  shoot(kind){
    const k = []; let scene = field(goalRight), actors = {p: "player", b: "ball"};
    const post1 = [149, 33], post2 = [149, 57];
    if(kind === "targets" || kind === "laces"){
      if(kind === "targets") scene = field([...goalRight, ["tape", 149, 32], ["tape", 149, 58]]);
      const shots = kind === "targets" ? [[149, 33, 0.1, "Inside of the foot: pick a corner"], [149, 57, 0.15, "Laces, knee over the ball"], [149, 34, 0.7, "Top corner"], [149, 56, 0.6, "Score a point per corner"]]
        : [[149, 52, 0.15, "Plant foot beside the ball"], [149, 40, 0.2, "Laces through the middle"], [149, 48, 0.1, "Keep it below waist height"]];
      let t = 0;
      shots.forEach(s => { k.push(K(t, {p: [92, 47], b: [96, 46, 0]}, s[3])); t += 0.5; k.push(K(t, {p: [95, 46], b: [96, 46, 0]})); t += 0.15; k.push(K(t, {b: [97, 46, 0]})); t += 0.45; k.push(K(t, {b: [s[0], s[1], s[2]]})); t += 0.6; });
      return {dur: t, scene, actors, keys: k};
    }
    if(kind === "volley"){
      let t = 0; for(let i = 0; i < 2; i++){
        k.push(K(t, {p: [96, 47], b: [99, 46, 0]}, i ? "Half-volley: strike as it bounces" : "Toss it up"));
        t += 0.6; k.push(K(t, {b: [100, 45, 1]})); t += 0.6; k.push(K(t, {b: [100, 45, i ? 0 : 0.35], p: [97, 46]}, i ? "Knee over, toes down" : "Volley it"));
        t += 0.6; k.push(K(t, {b: [149, 40 + i * 10, 0.2]})); t += 0.6; }
      return {dur: t, scene, actors, keys: k};
    }
    if(kind === "firsttime"){
      actors.h = "helper"; let t = 0;
      for(let i = 0; i < 2; i++){
        k.push(K(t, {p: [96, 50], h: [110, 82], b: [110, 78, 0]}, "Helper rolls it across"));
        t += 1.1; k.push(K(t, {b: [99, 51, 0], p: [97, 52]}, "Shoot first time"));
        t += 0.6; k.push(K(t, {b: [149, i ? 36 : 56, 0.1]}, i ? "Side-foot for accuracy" : "Head still, over the ball")); t += 0.6; }
      return {dur: t, scene, actors, keys: k};
    }
    if(kind === "angle"){
      scene = field([...goalRight, ["cone", 118, 12], ["cone", 118, 78]]); let t = 0;
      [[118, 14, 140, 24, [149, 33, 0.1], "Near post, low"], [118, 76, 140, 66, [149, 40, 0.15], "Or across to the far post"]].forEach(s => {
        k.push(K(t, {p: [s[0], s[1]]}, s[5])); t += 1.2; k.push(K(t, {p: [s[2], s[3]]}, "Look, then strike")); t += 0.6; k.push(K(t, {b: s[4]})); t += 0.7; });
      return {dur: t, scene, actors, keys: carry(k)};
    }
    if(kind === "dribbleshoot"){
      scene = field([...goalRight, ["cone", 40, 45], ["cone", 60, 45], ["cone", 80, 45]]);
      k.push(K(0, {p: [15, 45]}, "Dribble through the cones")); k.push(K(0.6, {p: [40, 37]})); k.push(K(1.2, {p: [60, 53]})); k.push(K(1.8, {p: [80, 37]}));
      k.push(K(2.4, {p: [98, 45]}, "Set it out of your feet")); carry(k);
      k.push(K(2.9, {p: [100, 45], b: [104, 45, 0]}, "Shoot within 2 touches")); k.push(K(3.5, {b: [149, 55, 0.15]})); k.push(K(4.2, {p: [125, 48], b: [149, 55, 0]}, "Follow it in"));
      return {dur: 4.5, scene, actors, keys: k};
    }
    if(kind === "chip"){
      actors.h = "keeper"; scene = field(goalRight);
      k.push(K(0, {p: [80, 45], h: [140, 45]}, "Dribble at the keeper")); k.push(K(1.2, {p: [112, 45], h: [134, 45]})); carry(k);
      k.push(K(1.6, {p: [114, 45], b: [117, 45, 0]}, "Stab under it")); k.push(K(2.2, {b: [133, 45, 1]}, "Over the keeper")); k.push(K(2.8, {b: [149, 45, 0.3]}));
      return {dur: 3.3, scene, actors, keys: k};
    }
    if(kind === "curl"){
      scene = field([...goalRight, ["cone", 124, 39], ["cone", 124, 44], ["cone", 124, 49], ["path", [[100, 46], [118, 30], [138, 30], [149, 38]], "curve"]]);
      k.push(K(0, {p: [96, 47], b: [100, 46, 0]}, "Inside of the foot, wrap round the ball")); k.push(K(0.6, {p: [98, 46]}));
      k.push(K(1.0, {b: [114, 33, 0.3]}, "Bend it round the wall")); k.push(K(1.4, {b: [130, 28, 0.35]})); k.push(K(1.8, {b: [149, 37, 0.2]})); k.push(K(2.6, {b: [149, 37, 0]}));
      return {dur: 2.8, scene, actors, keys: k};
    }
    // 1v1 with a recovering defender
    actors.h = "helper";
    k.push(K(0, {p: [35, 45], h: [24, 45]}, "On 'Go!', attack at speed", {h: "Go!"})); k.push(K(1.6, {p: [95, 45], h: [80, 48]}, "Protect it if they catch you"));
    k.push(K(2.4, {p: [118, 44], h: [108, 49]}, "Finish early")); carry(k);
    k.push(K(2.9, {b: [149, 56, 0.1]})); k.push(K(3.5, {h: [118, 50]}));
    return {dur: 3.8, scene, actors, keys: k};
  },

  // passing to a target
  pass(kind){
    const k = []; let scene, actors = {p: "player", b: "ball"};
    if(kind === "long" || kind === "driven"){
      const tgt = kind === "long" ? [128, 22] : [130, 30];
      scene = field([kind === "long" ? ["box", tgt[0] - 8, tgt[1] - 6, 16, 12] : ["gate", tgt[0], tgt[1], 8, NAVY, true]]);
      let t = 0; for(let i = 0; i < 2; i++){
        k.push(K(t, {p: [28, 66], b: [31, 64, 0]}, kind === "long" ? (i ? "Lock the ankle, strike the bottom half" : "Lean back slightly") : (i ? "Land on your kicking foot" : "Across your body, knee over the ball")));
        t += 0.5; k.push(K(t, {p: [30, 65], b: [31, 64, 0]})); t += 0.3; k.push(K(t, {b: [32, 63.5, 0]}));
        k.push(K(t + 0.6, {b: [(31 + tgt[0]) / 2, (64 + tgt[1]) / 2, kind === "long" ? 1 : 0.12]})); t += 1.2; k.push(K(t, {b: [tgt[0], tgt[1], 0]}, kind === "long" ? "Into the box" : "Low and fast through the gate")); t += 0.6; }
      return {dur: t, scene, actors, keys: k};
    }
    if(kind === "cross"){
      scene = field([...goalRight, ["box", 120, 34, 14, 22]]);
      k.push(K(0, {p: [40, 82]}, "Dribble down the side")); k.push(K(1.4, {p: [112, 82]})); carry(k);
      k.push(K(1.8, {p: [114, 80], b: [117, 79, 0]}, "Plant foot at the target")); k.push(K(2.3, {b: [122, 62, 0.8]}, "Cross into the zone")); k.push(K(2.8, {b: [127, 44, 0]}));
      return {dur: 3.2, scene, actors, keys: k};
    }
    // switch of play
    scene = field([...wallTop, ["cone", 14, 46], ["cone", 146, 46]]); actors.h = "helper"; let t = 0;
    [[14, "Pressure!", [118, 60], "Check your shoulder, switch left"], [146, "Pressure!", [42, 60], "…or switch right"]].forEach(s => {
      k.push(K(t, {p: [80, 62], b: [80, 58, 0], h: s[2]}, "Pass to the wall")); t += 0.6; k.push(K(t, {b: [80, 11, 0]}, null, {h: s[1]})); t += 0.6; k.push(K(t, {b: [80, 58, 0]}, s[3]));
      t += 0.4; k.push(K(t, {b: [80, 58, 0]})); t += 0.9; k.push(K(t, {b: [s[0], 46, 0.15]})); t += 0.5; });
    return {dur: t, scene, actors, keys: k};
  },

  // defending
  defend(kind){
    const k = []; let scene = field(), actors = {p: "player", h: "helper", b: "ball"};
    if(kind === "jockey"){
      scene = field([["cone", 55, 45], ["cone", 105, 45]]); actors = {p: "player"};
      k.push(K(0, {p: [60, 45]}, "Side-on, knees bent")); k.push(K(0.8, {p: [100, 49]}, "Shuffle, don't cross your feet")); k.push(K(1.6, {p: [62, 41]})); k.push(K(2.4, {p: [100, 47]})); k.push(K(3.2, {p: [60, 45]}));
      return {dur: 3.2, scene, actors, keys: k};
    }
    if(kind === "stance" || kind === "block"){
      k.push(K(0, {h: [140, 45], b: [136, 45, 0], p: [86, 45]}, "Side-on, arm's length away"));
      k.push(K(1.6, {h: [104, 45], b: [100, 45, 0], p: [78, 46]}, "Watch the ball, not their feet"));
      k.push(K(2.1, {h: [100, 45], b: [91, 45, 0], p: [78, 46]}, kind === "stance" ? "Heavy touch: poke it away!" : "Heavy touch: block through it"));
      k.push(K(2.5, {p: [86, 46], b: kind === "stance" ? [78, 62, 0] : [88, 45, 0]})); k.push(K(3.2, {p: kind === "stance" ? [80, 58] : [88, 45], b: kind === "stance" ? [74, 70, 0] : [86, 45, 0]}, kind === "stance" ? "Won it" : "Stay on your feet"));
      return {dur: 3.6, scene, actors, keys: k};
    }
    if(kind === "press"){
      scene = field([["cone", 45, 18], ["cone", 115, 18], ["cone", 45, 74], ["cone", 115, 74]]);
      k.push(K(0, {p: [80, 46], h: [45, 22], b: [49, 22, 0]}, "Sprint to press")); k.push(K(1.0, {p: [56, 30]}, "Curve your run to block one side"));
      k.push(K(1.6, {p: [56, 30], h: [115, 70], b: [111, 70, 0]})); k.push(K(2.6, {p: [104, 62]}, "Arrive under control")); k.push(K(3.2, {p: [80, 46], h: [45, 22], b: [49, 22, 0]}));
      return {dur: 3.4, scene, actors, keys: k};
    }
    if(kind === "line"){
      scene = field([["channel", 20, 140, 32, 58], ["finish", 140, 32, 58]]);
      k.push(K(0, {h: [25, 45], b: [29, 45, 0], p: [95, 45]}, "Attacker: stop the ball on the line"));
      k.push(K(1.2, {h: [70, 40], b: [74, 40, 0], p: [92, 43]}, "Defender: side-on, patient")); k.push(K(1.8, {h: [78, 50], b: [82, 52, 0], p: [94, 49]}, "Change of speed beats the defender"));
      k.push(K(2.8, {h: [136, 52], b: [140, 52, 0], p: [120, 50]})); k.push(K(3.6, {h: [25, 45], b: [29, 45, 0], p: [95, 45]}));
      return {dur: 3.6, scene, actors, keys: k};
    }
    if(kind === "2v1"){
      actors = {p: "player", h: "helper", h2: "helper", b: "ball"}; scene = field([["channel", 10, 150, 22, 68], goalRight[0]]);
      k.push(K(0, {h: [30, 32], h2: [30, 58], b: [34, 32, 0], p: [110, 45]}, "Delay: show them wide"));
      k.push(K(1.2, {h: [60, 32], h2: [60, 58], b: [64, 32, 0], p: [100, 40]}, "Stand where you block the pass"));
      k.push(K(2.2, {h: [80, 30], h2: [82, 60], b: [84, 30, 0], p: [96, 36]})); k.push(K(3.0, {h: [90, 28], b: [94, 28, 0], p: [100, 33]}, "Don't dive in"));
      k.push(K(3.8, {h: [30, 32], h2: [30, 58], b: [34, 32, 0], p: [110, 45]}));
      return {dur: 3.8, scene, actors, keys: k};
    }
    // shield
    k.push(K(0, {p: [80, 45], b: [74, 45, 0], h: [92, 45]}, "Body between them and the ball"));
    [[80, 60, 74, 42], [68, 48, 86, 50], [80, 32, 86, 50]].forEach((s, i) => { k.push(K(0.9 + i * 0.9, {h: [s[0], s[1]], b: [s[2], s[3], 0]}, i === 1 ? "Arm out, keep turning your back" : undefined)); });
    k.push(K(3.6, {h: [92, 45], b: [74, 45, 0]}));
    return {dur: 3.6, scene, actors, keys: k};
  },

  // goalkeeper: goal at the top
  gk(kind){
    const k = []; let scene = field(goalTop), actors = {k: "keeper", b: "ball", h: "helper"};
    const KP = [80, 17], SH = [80, 76];
    const shot = (t, to, z, cap, kp, dive) => { k.push(K(t, {k: KP, h: SH, b: [SH[0], SH[1] - 4, 0]}, cap)); k.push(K(t + 0.7, {k: KP, b: [SH[0], SH[1] - 4, 0]})); k.push(K(t + 1.3, {b: [to[0], to[1], z], k: kp ? [kp[0], kp[1], dive || 0] : KP})); k.push(K(t + 2.0, {b: [to[0], to[1], z], k: kp ? [kp[0], kp[1], dive || 0] : KP})); };
    if(kind === "setcatch"){ shot(0, [80, 19], 0.35, "Set: feet apart, hands ready"); shot(2.2, [80, 19], 0.65, "Above the waist: W-catch"); shot(4.4, [80, 19], 0.05, "Below it: scoop"); return {dur: 6.6, scene, actors, keys: k}; }
    if(kind === "scoop"){ shot(0, [80, 19], 0, "Get your body behind it"); shot(2.2, [77, 19], 0, "Scoop it into your chest", [78, 18]); return {dur: 4.4, scene, actors, keys: k}; }
    if(kind === "collapse" || kind === "lowdive" || kind === "topcorner"){
      const z = kind === "topcorner" ? 0.85 : 0.05, dx = kind === "collapse" ? 9 : 20;
      shot(0, [80 - dx - 2, 14], z, kind === "collapse" ? "Fall on your side, hands first" : kind === "lowdive" ? "Step and dive low" : "Drive off the near leg", [80 - dx, 16], 1);
      shot(2.4, [80 + dx + 2, 14], z, kind === "topcorner" ? "Push it wide if you can't hold it" : "Land on your side", [80 + dx, 16], 1);
      return {dur: 4.8, scene, actors, keys: k};
    }
    if(kind === "reaction"){
      scene = field([...goalTop, ["wall", 50, 40, 110, 40]]); actors = {k: "keeper", b: "ball", h: "helper"};
      [[72, 0], [90, 1.4]].forEach(([x, t]) => { k.push(K(t, {k: KP, h: [80, 70], b: [80, 66, 0]}, "React to the rebound")); k.push(K(t + 0.5, {b: [x, 41, 0.3]})); k.push(K(t + 0.9, {b: [x, 19, 0.3], k: [x, 18]}, "Feet first, then hands")); });
      k.push(K(2.8, {k: KP}));
      return {dur: 2.8, scene, actors, keys: k};
    }
    if(kind === "angles"){
      scene = field([...goalTop, ["cone", 40, 52], ["cone", 80, 62], ["cone", 120, 52], ["path", [[80, 8], [40, 52]], "dash"], ["path", [[80, 8], [120, 52]], "dash"]]);
      [[40, 52, [71, 20], "Line between ball and goal centre"], [80, 62, [80, 22], "One or two steps off the line"], [120, 52, [89, 20], "Shuffle as the ball moves"]].forEach((s, i) => {
        k.push(K(i * 1.6, {h: [s[0], s[1] + 3], b: [s[0], s[1], 0]}, s[3])); k.push(K(i * 1.6 + 0.8, {k: s[2]})); });
      k.push(K(4.8, {h: [40, 55], b: [40, 52, 0], k: [71, 20]}));
      return {dur: 4.8, scene, actors, keys: k};
    }
    if(kind === "shuffle"){
      scene = field([...goalTop, ["cone", 68, 22], ["cone", 92, 22]]);
      k.push(K(0, {k: [70, 17], h: SH, b: [80, 72, 0]}, "Shuffle, don't cross your feet")); k.push(K(0.6, {k: [90, 17]})); k.push(K(1.2, {k: [70, 17]})); k.push(K(1.8, {k: [80, 17]}, "'Set!'", {h: "Set!"}));
      k.push(K(2.3, {b: [80, 72, 0]})); k.push(K(3.0, {b: [80, 19, 0.4]}, "Catch it straight away")); k.push(K(3.6, {b: [80, 19, 0.4]}));
      return {dur: 3.8, scene, actors, keys: k};
    }
    if(kind === "comestay" || kind === "cross"){
      actors = {k: "keeper", b: "ball", h: "helper"};
      k.push(K(0, {k: KP, h: [148, 32], b: [144, 32, 0]}, kind === "cross" ? "Ball in from the side" : "Decide early"));
      k.push(K(0.8, {k: KP})); k.push(K(1.6, {b: [86, 26, 1], k: [84, 22]}, "'KEEPER!' Catch at the highest point", {k: "KEEPER!"})); k.push(K(2.2, {b: [85, 24, 0.6], k: [85, 24]}));
      if(kind === "comestay"){ k.push(K(3.0, {k: KP, h: [148, 32], b: [144, 32, 0]})); k.push(K(3.8, {k: KP})); k.push(K(4.6, {b: [70, 60, 0.9], k: KP}, "Too far? Call 'AWAY!' and stay set", {k: "AWAY!"})); k.push(K(5.4, {b: [60, 70, 0]})); return {dur: 5.6, scene, actors, keys: k}; }
      return {dur: 3, scene, actors, keys: k};
    }
    if(kind === "breakaway"){
      k.push(K(0, {k: KP, h: [80, 80], b: [80, 76, 0]}, "Close them down while their head is down")); k.push(K(1.2, {h: [80, 52], b: [80, 48, 0], k: [80, 28]}));
      k.push(K(1.7, {h: [80, 44], b: [80, 38, 0], k: [80, 32]}, "Big touch? Go down and smother")); k.push(K(2.1, {b: [80, 35, 0], k: [80, 34, 1]})); k.push(K(3.0, {k: [80, 34, 1]}));
      return {dur: 3.2, scene, actors, keys: k};
    }
    if(kind === "penalty"){
      scene = field([...goalTop, ["spot", 80, 44]]);
      k.push(K(0, {k: [80, 12], h: [92, 62], b: [80, 44, 0]}, "Watch the run-up, hips and plant foot")); k.push(K(1.2, {h: [83, 48]}, "Stay big and still"));
      k.push(K(1.6, {b: [80, 44, 0]})); k.push(K(2.2, {b: [60, 10, 0.2], k: [63, 13, 1]}, "Dive to the side the clues show")); k.push(K(3.0, {}));
      return {dur: 3.2, scene, actors, keys: k};
    }
    // distribution
    if(kind === "rollout"){
      scene = field([...goalTop, ["gate", 80, 60, 12, NAVY]]); actors = {k: "keeper", b: "ball"};
      k.push(K(0, {k: KP, b: [80, 21, 0]}, "Step forward, bend low")); k.push(K(0.6, {k: [80, 21]})); k.push(K(1.6, {b: [80, 62, 0]}, "Roll it: no bounce")); k.push(K(2.4, {k: KP}));
      return {dur: 2.6, scene, actors, keys: k};
    }
    if(kind === "goalkicks" || kind === "dist"){
      const targets = kind === "goalkicks" ? [[60, 84, 1, "Goal kick: under the ball"], [104, 84, 1, "Drop kick: strike as it lands"]]
        : [[45, 50, 0, "Roll it to a target"], [118, 60, 0.4, "Sidearm throw"], [80, 86, 1, "Overarm throw or kick"]];
      scene = field([...goalTop, ...targets.map(tg => ["box", tg[0] - 7, tg[1] - 5, 14, 10])]); actors = {k: "keeper", b: "ball"}; let t = 0;
      targets.forEach(tg => { k.push(K(t, {k: KP, b: [80, 21, 0]}, tg[3])); t += 0.5; k.push(K(t, {b: [80, 21, 0]})); k.push(K(t + 0.5, {b: [(80 + tg[0]) / 2, (21 + tg[1]) / 2, tg[2]]})); t += 1.0; k.push(K(t, {b: [tg[0], tg[1], 0]})); t += 0.5; });
      return {dur: t, scene, actors, keys: k};
    }
    // back-pass under pressure
    scene = field([...goalTop, ["cone", 30, 40], ["cone", 36, 40]]);
    k.push(K(0, {k: KP, h: [118, 52], b: [114, 50, 0]}, "Back-pass…")); k.push(K(0.9, {b: [82, 21, 0]}, "Scan first")); k.push(K(1.2, {h: [100, 40]}));
    k.push(K(1.8, {h: [90, 30], b: [80, 22, 0], k: [78, 19]}, "First touch away from the pressure")); k.push(K(2.6, {b: [33, 40, 0]}, "Then play it short and safe")); k.push(K(3.4, {h: [118, 52], k: KP}));
    return {dur: 3.6, scene, actors, keys: k};
  },

  // aerial control
  aerial(){
    const k = [];
    k.push(K(0, {h: [22, 18], b: [26, 20, 0], p: [112, 62]}, "Long, high ball in")); k.push(K(0.6, {h: [24, 19]}));
    k.push(K(1.5, {b: [70, 42, 1]}, "Move your feet early")); k.push(K(2.4, {b: [108, 58, 0.3], p: [110, 60]}, "Cushion: chest, thigh or foot"));
    k.push(K(2.8, {b: [109, 59, 0]})); k.push(K(3.4, {b: [128, 52, 0], p: [124, 54]}, "Second touch into space")); k.push(K(4.0, {p: [112, 62]}));
    return {dur: 4.2, scene: field(), actors: {p: "player", h: "helper", b: "ball"}, keys: k};
  },

  // tactics board (no real ball work)
  board(kind){
    const k = []; let scene = [["board"]], actors = {};
    if(kind === "thirdman"){
      actors = {a: "dotA", bb: "dotB", c: "dotC", b: "ball"}; scene = [["board"], ["path", [[40, 62], [82, 36]], "dash"], ["path", [[82, 36], [112, 50]], "dash"]];
      k.push(K(0, {a: [40, 66], bb: [82, 32], c: [70, 72], b: [44, 64, 0]}, "A passes to B…")); k.push(K(0.9, {b: [80, 36, 0]}));
      k.push(K(1.3, {c: [92, 62]}, "…C is already running…")); k.push(K(2.1, {b: [110, 52, 0], c: [112, 54]}, "…and B lays it off to C")); k.push(K(3.2, {}));
      return {dur: 3.4, scene, actors, keys: k};
    }
    if(kind === "shape"){
      const pos = [[30, 45], [55, 20], [55, 70], [52, 45], [85, 30], [85, 60], [80, 45], [115, 45], [110, 20], [110, 70]];
      actors = Object.fromEntries(pos.map((_, i) => ["t" + i, "dot"])); actors.me = "dotMe";
      const start = Object.fromEntries(pos.map((p, i) => ["t" + i, [p[0], 96]]));
      k.push(K(0, {...start, me: [80, 96]}, "Draw your team's shape"));
      pos.forEach((p, i) => k.push(K(0.3 + i * 0.12, {["t" + i]: p})));
      k.push(K(1.8, {me: [85, 45]}, "Where you stand with the ball…")); k.push(K(3.0, {me: [100, 40]})); k.push(K(3.6, {me: [70, 48]}, "…and where you go when it's lost")); k.push(K(4.8, {me: [70, 48]}));
      return {dur: 5, scene, actors, keys: k};
    }
    if(kind === "watch" || kind === "film"){
      scene = [["grass"], ["screen", 20, 8, 120, 68]]; actors = {d1: "dot", d2: "dot", d3: "oppDot", d4: "oppDot", me: "dotMe", b: "ball"};
      k.push(K(0, {d1: [45, 30], d2: [60, 60], d3: [100, 40], d4: [110, 25], me: [75, 40], b: [47, 31, 0]}, kind === "film" ? "Watch only yourself" : "Watch only the player in your position"));
      k.push(K(1.5, {d1: [55, 28], d2: [70, 58], d3: [95, 45], me: [88, 50], b: [86, 50, 0]}, kind === "film" ? "Note good decisions and ones to change" : "Where do they stand? Count shoulder checks"));
      k.push(K(3.0, {d2: [80, 62], d3: [90, 48], me: [100, 34], b: [110, 30, 0]})); k.push(K(4.4, {d1: [45, 30], d2: [60, 60], d3: [100, 40], me: [75, 40], b: [47, 31, 0]}, kind === "film" ? "Send your notes to your coach" : "Write down 3 things to copy"));
      return {dur: 4.6, scene, actors, keys: k};
    }
    if(kind === "triggers"){
      actors = {o1: "oppDot", o2: "oppDot", o3: "oppDot", t1: "dot", t2: "dot", t3: "dot", b: "ball"};
      k.push(K(0, {o1: [40, 45], o2: [70, 25], o3: [70, 65], t1: [100, 30], t2: [100, 60], t3: [115, 45], b: [74, 26, 0]}, "Watch the team without the ball"));
      k.push(K(1.2, {b: [44, 45, 0]}, "Trigger: a back-pass…")); k.push(K(2.2, {t1: [72, 30], t2: [72, 58], t3: [52, 45]}, "…press together!")); k.push(K(3.4, {}));
      return {dur: 3.6, scene, actors, keys: k};
    }
    if(kind === "organiser"){
      actors = {k: "keeper", d1: "dot", d2: "dot", d3: "dot", d4: "dot", o: "oppDot"}; scene = [["board"], ["goalLeftBoard"]];
      k.push(K(0, {k: [14, 45], d1: [40, 20], d2: [36, 38], d3: [36, 54], d4: [40, 70], o: [70, 50]}, "Short, loud, early calls", {k: "Push up!"}));
      k.push(K(1.4, {d1: [58, 20], d2: [54, 38], d3: [54, 54], d4: [58, 70]})); k.push(K(2.0, {o: [64, 42]}, null, {k: "Mark 9!"})); k.push(K(3.0, {d2: [60, 42]})); k.push(K(4.0, {}));
      return {dur: 4.2, scene, actors, keys: k};
    }
    if(kind === "lead"){
      actors = {p: "player", t1: "dot", t2: "dot", t3: "dot", t4: "dot", t5: "dot", t6: "dot"}; scene = [["grass"], ["cone", 30, 25], ["cone", 130, 25], ["cone", 30, 75], ["cone", 130, 75]];
      const grid = (dx) => ({t1: [55 + dx, 40], t2: [80 + dx, 40], t3: [105 + dx, 40], t4: [55 + dx, 60], t5: [80 + dx, 60], t6: [105 + dx, 60]});
      k.push(K(0, {p: [80, 18], ...grid(0)}, "Plan 3 short activities", {p: "Jog!"})); k.push(K(1.4, grid(-20))); k.push(K(2.8, grid(20), "Short instructions, demonstrate", {p: "Skips!"})); k.push(K(4.2, grid(0))); k.push(K(4.6, {}, "Ask your coach for feedback"));
      return {dur: 5, scene, actors, keys: k};
    }
    // call for the ball
    actors = {p: "player", h: "helper", b: "ball"}; scene = field();
    k.push(K(0, {h: [40, 45], b: [44, 45, 0], p: [80, 30]}, "Move into space")); k.push(K(1.0, {p: [100, 55]}, "Call: name + 'Yes!', hand out", {p: "Sam, yes!"}));
    k.push(K(1.4, {b: [44, 45, 0]})); k.push(K(2.2, {b: [98, 54, 0]}, "Receive, then pass back")); k.push(K(2.8, {b: [98, 54, 0]})); k.push(K(3.6, {b: [44, 45, 0], p: [80, 30]}));
    return {dur: 3.8, scene, actors, keys: k};
  },

  // notebooks and checklists
  note(kind){
    const rows = kind === "goal" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : kind === "reflect" ? ["What my coach asked", "What went well", "What I'll try next"] : ["3 good decisions", "3 to change", "What I'll do next time"];
    const scene = [["grass"], ["paper", kind === "goal" ? 22 : 40, 10, kind === "goal" ? 116 : 80, 70, rows, kind === "goal" ? "50 weak-foot passes a day" : kind === "reflect" ? "After practice" : "Game film notes"]];
    const actors = Object.fromEntries(rows.map((_, i) => ["c" + i, "tick"]));
    const pos = (i) => kind === "goal" ? [32.5 + i * 15.5, 50.5] : [50, 36 + i * 13];
    const k = [K(0, Object.fromEntries(rows.map((_, i) => ["c" + i, [...pos(i), 0]])), kind === "goal" ? "Tick off each day you do it" : "Write 3 short lines")];
    rows.forEach((_, i) => k.push(K(0.6 + i * 0.5, {["c" + i]: [...pos(i), 1]})));
    k.push(K(0.6 + rows.length * 0.5 + 1.2, {}, kind === "goal" ? "Show your coach at the end of the week" : "Read them before your next session"));
    return {dur: 0.6 + rows.length * 0.5 + 2, scene, actors, keys: k};
  },

  // bodyweight work
  body(kind){ const z = {circuit: [80, 45, 1.5], jump: [80, 52, 1.25], balance: [86, 48, 1.5]}[kind]; return {...this._body(kind), zoom: z}; },
  _body(kind){
    const k = [];
    if(kind === "circuit"){
      const ex = ["Squats", "Lunges", "Glute bridges", "Plank", "Side plank", "Balance on one leg"];
      ex.forEach((e, i) => { k.push(K(i * 1.0, {body: [80, 45, 0]}, `${e}: 30 seconds`)); k.push(K(i * 1.0 + 0.5, {body: [80, 45, 0.35]})); });
      k.push(K(6, {body: [80, 45, 0]}));
      return {dur: 6, scene: [["grass", "close"]], actors: {body: "body"}, keys: k};
    }
    if(kind === "jump"){
      k.push(K(0, {body: [50, 50, 0]}, "Jump up, land softly")); k.push(K(0.4, {body: [50, 50, -0.4]})); k.push(K(0.8, {body: [50, 50, 0.25]}, "Knees bent over toes"));
      k.push(K(1.4, {body: [80, 50, -0.4]}, "Jump forward")); k.push(K(1.9, {body: [80, 50, 0.25]})); k.push(K(2.5, {body: [110, 50, -0.4]})); k.push(K(3.0, {body: [110, 50, 0.25]}, "Quiet landings")); k.push(K(3.6, {body: [50, 50, 0]}));
      return {dur: 3.6, scene: [["grass", "close"], ["line", 20, 64, 140, 64]], actors: {body: "body"}, keys: k};
    }
    // balance & reach
    const C = [80, 52];
    k.push(K(0, {body: [...C, 0], lf: [76, 46], rf: [84, 46]}, "Stand on one leg, knee soft"));
    [[84, 26, "Reach forward"], [104, 46, "To the side"], [92, 70, "Behind you"]].forEach((r, i) => { k.push(K(0.8 + i * 1.1, {rf: [r[0], r[1]]}, r[2])); k.push(K(1.3 + i * 1.1, {rf: [84, 46]})); });
    k.push(K(4.2, {}));
    return {dur: 4.2, scene: [["grass", "close"], ["path", [[84, 46], [84, 26]], "dash"], ["path", [[84, 46], [104, 46]], "dash"], ["path", [[84, 46], [92, 70]], "dash"]], actors: {body: "body", lf: "foot", rf: "foot"}, keys: k};
  }
};

/* ---------- the 80 drills ---------- */
const SCRIPTS = {
  "b-toe-taps": () => T.mastery("tap"), "b-sole-roll": () => T.mastery("roll"), "b-juggle": () => T.mastery("juggle"),
  "b-tick-tock": () => T.mastery("side"), "b-inside-outside": () => T.mastery("inout"), "b-cushion": () => T.mastery("cushion"),
  "b-weak-foot": () => T.mastery("circle", "Weaker foot only, every touch"),
  "b-wall-pass": () => T.wall({alt: true, caps: ["Inside of the foot", "One touch to control", "Then the other foot"]}),
  "b-pass-gate": () => T.wall({scene: [["gate", 80, 36, 10, ORANGE]], caps: ["Through the gate", "Ankle locked, toe up", "Plant foot beside the ball"]}),
  "b-first-touch": () => T.wall({scene: [["cone", 62, 62], ["cone", 98, 62]], recv: ["Open your body", "Open your body"], after: [[62, 56, "First touch past the cone"], [98, 56, "Then the other side"]], n: 2}),
  "b-receive-turn": () => ({...T.wall({scene: [["cone", 80, 84]], recv: ["Check your shoulder, receive on the back foot"], after: [[86, 74, "Turn in one touch"]], n: 2})}),
  "b-scan": () => T.wall({helper: [80, 82], say: ["3!", "5!"], recv: ["Check, call the number, then receive"], caps: ["Pass", "Pass"], n: 2}),
  "b-scan-switch": () => T.wall({scene: [["gate", 36, 62, 10, BLUE, true], ["gate", 124, 62, 10, "#e0b400", true]], helper: [80, 84], say: ["Left!", "Right!"], recv: ["Shoulder check…"], after: [[44, 62, "…first touch to that gate"], [116, 62, "…first touch to that gate"]], n: 2}),
  "b-talk": () => T.wall({partner: true, say: ["Man on!", "Time!", "Turn!"], recv: ["One touch back", "Touch and look up", "Turn away"], n: 3}),
  "b-tight-space": () => T.wall({helper: [80, 70], recv: ["Check, then receive and protect it"], after: [[66, 64, "Spin away from the pressure"]], n: 2}),
  "b-one-two": () => {
    const k = [K(0, {p: [24, 66]}, "Dribble at the 'defender'"), K(1.0, {p: [56, 62]})]; carry(k);
    k.push(K(1.4, {b: [72, 11, 0]}, "Pass to the wall…")); k.push(K(1.6, {p: [62, 60]})); k.push(K(2.4, {p: [104, 44], b: [104, 41, 0]}, "…sprint past and take the return"));
    k.push(K(3.2, {p: [140, 40], b: [144, 39, 0]})); k.push(K(3.6, {}));
    return {dur: 3.8, scene: field([...wallTop, ["cone", 72, 56, ORANGE, "big"]]), actors: {p: "player", b: "ball"}, keys: k};
  },
  "b-cone-weave": () => T.dribble("weave"), "b-skill-moves": () => T.dribble("skill"), "b-combo-moves": () => T.dribble("combo"),
  "b-push-stop": () => T.dribble("pushstop"), "b-speed-dribble": () => T.dribble("race"), "b-change-pace": () => T.dribble("pace"),
  "b-four-turns": () => T.dribble("turns"), "b-color-gates": () => T.dribble("gates"),
  "b-5-10-5": () => T.run("5105"), "b-first-step": () => T.run("first"), "b-accel-decel": () => T.run("accel"), "b-quick-feet": () => T.run("ladder"), "b-recovery": () => T.run("recovery"),
  "b-targets": () => T.shoot("targets"), "b-laces": () => T.shoot("laces"), "b-volley": () => T.shoot("volley"), "b-first-time": () => T.shoot("firsttime"),
  "b-angle-finish": () => T.shoot("angle"), "b-dribble-shoot": () => T.shoot("dribbleshoot"), "b-chip": () => T.shoot("chip"), "b-curl": () => T.shoot("curl"), "b-1v1-recover": () => T.shoot("1v1"),
  "b-long-pass": () => T.pass("long"), "b-driven-pass": () => T.pass("driven"), "b-crossing": () => T.pass("cross"), "b-switch-play": () => T.pass("switch"),
  "b-jockey": () => T.defend("jockey"), "b-stance": () => T.defend("stance"), "b-block-tackle": () => T.defend("block"), "b-press-cover": () => T.defend("press"),
  "b-1v1-line": () => T.defend("line"), "b-defend-2v1": () => T.defend("2v1"), "b-shield": () => T.defend("shield"),
  "b-aerial": () => T.aerial(),
  "b-third-man": () => T.board("thirdman"), "b-draw-shape": () => T.board("shape"), "b-pro-watch": () => T.board("watch"), "b-film-review": () => T.board("film"),
  "b-press-triggers": () => T.board("triggers"), "b-lead-warmup": () => T.board("lead"), "b-call-ball": () => T.board("call"),
  "b-reflect": () => T.note("reflect"), "b-weekly-goal": () => T.note("goal"),
  "b-strength": () => T.body("circuit"), "b-jump-land": () => T.body("jump"), "b-balance": () => T.body("balance"),
  "g-set-catch": () => T.gk("setcatch"), "g-w-catch": () => T.gk("setcatch"), "g-scoop": () => T.gk("scoop"), "g-collapse": () => T.gk("collapse"),
  "g-low-dive": () => T.gk("lowdive"), "g-top-corner": () => T.gk("topcorner"), "g-reaction": () => T.gk("reaction"), "g-angles": () => T.gk("angles"),
  "g-shuffle": () => T.gk("shuffle"), "g-come-stay": () => T.gk("comestay"), "g-cross-catch": () => T.gk("cross"), "g-breakaway": () => T.gk("breakaway"),
  "g-penalties": () => T.gk("penalty"), "g-roll-out": () => T.gk("rollout"), "g-goal-kicks": () => T.gk("goalkicks"), "g-distribution": () => T.gk("dist"),
  "g-back-pass": () => T.gk("backpass"), "g-organiser": () => T.board("organiser")
};
// a wall-catch keeper drill throws at a wall in front instead of facing a shooter
SCRIPTS["g-w-catch"] = () => {
  const k = []; const KP = [80, 17];
  [[0, 0.65, "Throw at the wall: W-catch at head height"], [1.8, 0.35, "Basket catch at the chest"], [3.6, 0.03, "Scoop from the ground"]].forEach(([t, z, cap]) => {
    k.push(K(t, {k: KP, b: [80, 21, 0]}, cap)); k.push(K(t + 0.7, {b: [80, 44, z]})); k.push(K(t + 1.4, {b: [80, 20, z]})); });
  return {dur: 5.4, scene: field([...goalTop, ["wall", 50, 46, 110, 46]]), actors: {k: "keeper", b: "ball"}, keys: k};
};

export const hasAnim = id => !!SCRIPTS[id];
const cache = {};
function getScript(id){ if(!cache[id]){ const f = SCRIPTS[id]; if(!f) return null; cache[id] = prep({...f(), id}); } return cache[id]; }

/* split keys per actor once */
function prep(s){
  const tracks = {}; Object.keys(s.actors).forEach(a => tracks[a] = []);
  s.keys.sort((a, b) => a.t - b.t).forEach(k => Object.entries(k.pos).forEach(([a, v]) => { if(tracks[a]) tracks[a].push([k.t, v]); }));
  const caps = s.keys.filter(k => k.cap).map(k => [k.t, k.cap]);
  const says = []; s.keys.forEach(k => k.say && Object.entries(k.say).forEach(([a, txt]) => says.push([k.t, a, txt])));
  const out = {...s, tracks, caps, says}; out.cam = camFor(s.id, out); return out;
}
function at(track, t){
  if(!track.length) return null;
  if(t <= track[0][0]) return track[0][1];
  for(let i = 1; i < track.length; i++){
    if(t <= track[i][0]){ const [t0, a] = track[i - 1], [t1, b] = track[i], u = ease((t - t0) / ((t1 - t0) || 1));
      return a.map((v, j) => v + ((b[j] ?? 0) - v) * u).concat(b.slice(a.length)); }
  }
  return track[track.length - 1][1];
}

/* ---------- which way the camera looks ----------
   The camera stands in front of the player, looking back at them. "top" = camera beyond the top edge
   looking down the field, "right" = beyond the right edge looking left, and so on. "flat" keeps the
   whiteboard / notebook drills as drawings. */
const CAM = {
  "b-5-10-5": "bottom", "b-first-step": "right", "b-accel-decel": "right", "b-quick-feet": "right", "b-recovery": "left",
  "b-color-gates": "bottom", "b-switch-play": "top", "b-jockey": "bottom", "b-stance": "right", "b-block-tackle": "right",
  "b-press-cover": "bottom", "b-1v1-line": "left", "b-defend-2v1": "left", "b-shield": "bottom", "b-aerial": "top",
  "b-call-ball": "left", "b-lead-warmup": "bottom", "b-one-two": "right"
};
function camFor(id, s){
  if(s.scene.some(e => ["board", "screen", "paper"].includes(e[0]))) return {flat: true};
  if(s.zoom) return {side: "top", u0: -120, lc: 0, f: 340, hc: 34, hz: 12, H: 30, close: true};
  let side = CAM[id];
  if(!side){
    if(id.startsWith("g-")) side = "bottom";
    else if(s.scene.some(e => e[0] === "goalRight")) side = "right";
    else if(s.scene.some(e => e[0] === "wall" && e[2] < 20)) side = "top";
    else if(Object.values(s.actors).includes("keeper")) side = "bottom";
    else side = "right";
  }
  return fitCam(side, s);
}
/* frame the camera on where the action happens */
const UL = (side, x, y) => side === "top" ? [y, -(x - 80)] : side === "bottom" ? [90 - y, x - 80] : side === "right" ? [160 - x, -(y - 45)] : [x, y - 45];
function fitCam(side, s){
  const P = [], people = [];
  Object.entries(s.tracks).forEach(([a, tr]) => tr.forEach(([, v]) => { P.push(v); if(s.actors[a] !== "ball") people.push(UL(side, v[0], v[1])[0]); }));
  s.scene.forEach(e => { const [k, ...a] = e;
    if(k === "cone") P.push([a[0], a[1]]);
    else if(k === "gate" || k === "spot" || k === "tape") P.push([a[0], a[1]]);
    else if(k === "box") P.push([a[0], a[1]], [a[0] + a[2], a[1] + a[3]]);
    else if(k === "goalTop") P.push([a[0] - a[2] / 2, a[1]], [a[0] + a[2] / 2, a[1]]);
    else if(k === "goalRight") P.push([a[0], a[1] - a[2] / 2], [a[0], a[1] + a[2] / 2]);
    else if(k === "goalLeft") P.push([8, 30], [8, 60]);
    else if(k === "ladder") P.push([a[0], a[1]], [a[0] + a[2] * a[3], a[1] + a[4]]); });
  const UL2 = P.map(v => UL(side, v[0], v[1]));
  const uMin = Math.min(...UL2.map(q => q[0])), lMin = Math.min(...UL2.map(q => q[1])), lMax = Math.max(...UL2.map(q => q[1]));
  // goalkeeper and chip drills: step the camera to one side so the shooter doesn't hide the keeper
  const shift = s.id && (s.id.startsWith("g-") || s.id === "b-chip") && s.id !== "g-roll-out" && s.id !== "g-goal-kicks" && s.id !== "g-distribution" ? -15 : 0;
  const dNear = 50, u0 = uMin - dNear, lc = (lMin + lMax) / 2 + shift;
  let f = 400; UL2.forEach(([u, l]) => { const depth = u - u0, off = Math.abs(l - lc) + 6; f = Math.min(f, 72 * depth / off); });
  // no player taller than about half the frame
  const nearest = Math.min(...people) - u0; f = Math.min(f, 46 * nearest / 14);
  f = Math.max(f, 40);
  const hz = 22, hc = (84 - hz) * dNear / f;
  return {side, u0, lc, f, hc, hz, H: 14, uPeople: Math.min(...people)};
}
function proj(c, x, y, z = 0){
  const [u, l] = UL(c.side, x, y);
  const depth = Math.max(u - c.u0, 4), L = l - c.lc, k = c.f / depth;
  return {x: 80 + L * k, y: c.hz + (c.hc - z) * k, k, depth};
}

/* ---------- drawing: flat (whiteboard, notebook) ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
function sceneSvg(scene){
  return scene.map(e => {
    const [kind, ...a] = e;
    switch(kind){
      case "grass": return `<rect width="${W}" height="${H}" fill="#6fbf7a"/>` + Array.from({length: 8}, (_, i) => i % 2 ? `<rect x="${i * 20}" width="20" height="${H}" fill="#66b671"/>` : "").join("") + (a[0] === "close" ? "" : `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="#ffffff55" stroke-width=".6"/>`);
      case "board": return `<rect width="${W}" height="${H}" fill="#2e6b45"/><rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="#ffffffaa" stroke-width=".7"/><line x1="80" y1="4" x2="80" y2="${H - 4}" stroke="#ffffffaa" stroke-width=".7"/><circle cx="80" cy="45" r="10" fill="none" stroke="#ffffffaa" stroke-width=".7"/>`;
      case "wall": return `<line x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}" stroke="#8a8f99" stroke-width="3.5" stroke-linecap="round"/><text x="${a[2] + 2}" y="${a[3] + 1.2}" font-size="4" fill="#1f2b3d">wall</text>`;
      case "goalTop": return `<rect x="${a[0] - a[2] / 2}" y="${a[1] - 6}" width="${a[2]}" height="6" fill="#ffffff33" stroke="#fff" stroke-width=".5"/><line x1="${a[0] - a[2] / 2}" y1="${a[1]}" x2="${a[0] + a[2] / 2}" y2="${a[1]}" stroke="#fff" stroke-width="1.6"/>`;
      case "goalRight": return `<rect x="${a[0]}" y="${a[1] - a[2] / 2}" width="6" height="${a[2]}" fill="#ffffff33" stroke="#fff" stroke-width=".5"/><line x1="${a[0]}" y1="${a[1] - a[2] / 2}" x2="${a[0]}" y2="${a[1] + a[2] / 2}" stroke="#fff" stroke-width="1.6"/>`;
      case "goalLeft": return `<rect x="2" y="30" width="6" height="30" fill="#ffffff33" stroke="#fff" stroke-width=".5"/><line x1="8" y1="30" x2="8" y2="60" stroke="#fff" stroke-width="1.6"/>`;
      case "goalLeftBoard": return `<line x1="6" y1="35" x2="6" y2="55" stroke="#fff" stroke-width="1.6"/>`;
      case "cone": return `<path d="M${a[0]} ${a[1] - (a[3] ? 4 : 3)} l${a[3] ? 3.2 : 2.4} ${a[3] ? 6 : 4.6} h-${a[3] ? 6.4 : 4.8}z" fill="${a[2] || ORANGE}" stroke="#7a2d12" stroke-width=".3"/>`;
      case "gate": { const c = a[3] || ORANGE, v = a[4]; return v ? `<path d="M${a[0] - 1.6} ${a[1] - a[2] / 2 - 2.6} l1.6 3 h-3.2z M${a[0] - 1.6} ${a[1] + a[2] / 2 - 2.6} l1.6 3 h-3.2z" fill="${c}"/><line x1="${a[0]}" y1="${a[1] - a[2] / 2}" x2="${a[0]}" y2="${a[1] + a[2] / 2}" stroke="${c}" stroke-dasharray="1.5 1.5" stroke-width=".6"/>`
        : `<path d="M${a[0] - a[2] / 2} ${a[1] - 2.6} l1.6 3 h-3.2z M${a[0] + a[2] / 2} ${a[1] - 2.6} l1.6 3 h-3.2z" fill="${c}"/><line x1="${a[0] - a[2] / 2}" y1="${a[1]}" x2="${a[0] + a[2] / 2}" y2="${a[1]}" stroke="${c}" stroke-dasharray="1.5 1.5" stroke-width=".6"/>`; }
      case "box": return `<rect x="${a[0]}" y="${a[1]}" width="${a[2]}" height="${a[3]}" fill="#ffffff22" stroke="#fff" stroke-dasharray="2 1.5" stroke-width=".6"/>`;
      case "tape": return `<rect x="${a[0] - 2}" y="${a[1] - 2}" width="4" height="4" fill="#e0b400"/>`;
      case "spot": return `<circle cx="${a[0]}" cy="${a[1]}" r=".9" fill="#fff"/>`;
      case "ladder": { let s = ""; for(let i = 0; i <= a[2]; i++) s += `<line x1="${a[0] + i * a[3]}" y1="${a[1]}" x2="${a[0] + i * a[3]}" y2="${a[1] + a[4]}" stroke="#fff" stroke-width=".7"/>`;
        return s + `<line x1="${a[0]}" y1="${a[1]}" x2="${a[0] + a[2] * a[3]}" y2="${a[1]}" stroke="#fff" stroke-width=".7"/><line x1="${a[0]}" y1="${a[1] + a[4]}" x2="${a[0] + a[2] * a[3]}" y2="${a[1] + a[4]}" stroke="#fff" stroke-width=".7"/>`; }
      case "channel": return `<line x1="${a[0]}" y1="${a[2]}" x2="${a[1]}" y2="${a[2]}" stroke="#ffffffaa" stroke-width=".6"/><line x1="${a[0]}" y1="${a[3]}" x2="${a[1]}" y2="${a[3]}" stroke="#ffffffaa" stroke-width=".6"/>`;
      case "finish": return `<line x1="${a[0]}" y1="${a[1]}" x2="${a[0]}" y2="${a[2]}" stroke="#fff" stroke-width="1.2" stroke-dasharray="2 1"/>`;
      case "line": return `<line x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}" stroke="#ffffffaa" stroke-width=".6"/>`;
      case "label": return `<text x="${a[0]}" y="${a[1]}" font-size="3.6" fill="#1f2b3d" text-anchor="middle">${esc(a[2])}</text>`;
      case "path": { const p = a[0]; const d = a[1] === "curve" && p.length === 4 ? `M${p[0]} C${p[1]} ${p[2]} ${p[3]}` : "M" + p.map(q => q.join(" ")).join(" L");
        return `<path d="${d}" fill="none" stroke="#ffffffcc" stroke-width=".6" stroke-dasharray="2 1.5"/>`; }
      case "screen": return `<rect x="${a[0]}" y="${a[1]}" width="${a[2]}" height="${a[3]}" rx="3" fill="#2e6b45" stroke="${NAVY}" stroke-width="2.5"/><rect x="${a[0] + a[2] / 2 - 10}" y="${a[1] + a[3] + 1}" width="20" height="3" fill="${NAVY}"/>`;
      case "paper": { const [x, y, w, h, rows, title] = a, goal = rows.length > 3;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#fffdf6" stroke="#d8d2bf" stroke-width=".6"/><text x="${x + w / 2}" y="${y + 9}" font-size="5" font-weight="700" text-anchor="middle" fill="${NAVY}">${esc(title)}</text>` +
          rows.map((r, i) => goal ? `<rect x="${x + 4 + i * 15.5}" y="${y + 34}" width="13" height="13" rx="1.5" fill="#fff" stroke="#b9c3d6" stroke-width=".5"/><text x="${x + 10.5 + i * 15.5}" y="${y + 30}" font-size="3.6" text-anchor="middle" fill="${NAVY}">${r}</text>`
            : `<rect x="${x + 6}" y="${y + 22 + i * 13}" width="8" height="8" rx="1.5" fill="#fff" stroke="#b9c3d6" stroke-width=".5"/><text x="${x + 18}" y="${y + 28 + i * 13}" font-size="4.2" fill="${NAVY}">${esc(r)}</text>`).join(""); }
    }
    return "";
  }).join("");
}
function actorSvg(id, kind){
  const g = (inner) => `<g data-a="${id}">${inner}</g>`;
  switch(kind){
    case "player": return g(`<circle r="4" fill="${BLUE}" stroke="#fff" stroke-width="1"/>`);
    case "helper": return g(`<circle r="4" fill="${ORANGE}" stroke="#fff" stroke-width="1"/>`);
    case "keeper": return g(`<ellipse data-body rx="4.2" ry="4.2" fill="${KEEPER}" stroke="#fff" stroke-width="1"/>`);
    case "body": return g(`<circle data-body r="9" fill="${BLUE}" stroke="#fff" stroke-width="1.2"/>`);
    case "foot": return g(`<ellipse rx="2.4" ry="3.4" fill="${NAVY}" stroke="#fff" stroke-width=".5"/>`);
    case "ball": return g(`<ellipse data-shadow cx="0" cy="1.6" rx="2" ry=".8" fill="#0003"/><g data-lift><circle data-ball r="2" fill="#fff" stroke="#1f2b3d" stroke-width=".55"/><path d="M-.9 -.6 L0 -1.3 L.9 -.6 L.6 .5 L-.6 .5z" fill="#1f2b3d"/></g>`);
    case "dot": return g(`<circle r="3.4" fill="${BLUE}" stroke="#fff" stroke-width=".8"/>`);
    case "dotMe": return g(`<circle r="4" fill="#e0b400" stroke="#fff" stroke-width="1"/><text y="1.4" font-size="3.6" text-anchor="middle" fill="${NAVY}" font-weight="700">You</text>`);
    case "oppDot": return g(`<circle r="3.4" fill="${ORANGE}" stroke="#fff" stroke-width=".8"/>`);
    case "dotA": case "dotB": case "dotC": return g(`<circle r="4" fill="${BLUE}" stroke="#fff" stroke-width=".8"/><text y="1.4" font-size="4" text-anchor="middle" fill="#fff" font-weight="700">${kind.slice(-1)}</text>`);
    case "tick": return g(`<path data-tick d="M-2.6 0 L-.8 2 L2.8 -2.4" fill="none" stroke="#1d7a46" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>`);
  }
  return "";
}


/* ---------- drawing: front camera ---------- */
const f2 = n => n.toFixed(2);
const pts = arr => arr.map(p => f2(p.x) + "," + f2(p.y)).join(" ");
function groundPoly(c, corners, attrs){ return `<polygon points="${pts(corners.map(q => proj(c, q[0], q[1], q[2] || 0)))}" ${attrs}/>`; }
function groundLine(c, a, b, attrs, z1 = 0, z2 = 0){ const p = proj(c, a[0], a[1], z1), q = proj(c, b[0], b[1], z2); return `<line x1="${f2(p.x)}" y1="${f2(p.y)}" x2="${f2(q.x)}" y2="${f2(q.y)}" ${attrs}/>`; }
function cone3(c, x, y, col = ORANGE, big){ const p = proj(c, x, y), h = (big ? 3.4 : 2.4) * p.k, w = (big ? 1.6 : 1.2) * p.k;
  return {d: p.depth, svg: `<path d="M${f2(p.x)} ${f2(p.y - h)} L${f2(p.x + w)} ${f2(p.y)} L${f2(p.x - w)} ${f2(p.y)}Z" fill="${col}" stroke="#7a2d12" stroke-width="${f2(0.15 * p.k)}"/>`}; }
function goal3(c, a, b, back){ // posts at ground points a and b; back = offset vector of the net
  const H = 9, A = proj(c, a[0], a[1]), B = proj(c, b[0], b[1]), At = proj(c, a[0], a[1], H), Bt = proj(c, b[0], b[1], H);
  const Ab = proj(c, a[0] + back[0], a[1] + back[1]), Bb = proj(c, b[0] + back[0], b[1] + back[1]), Abt = proj(c, a[0] + back[0], a[1] + back[1], H * 0.7), Bbt = proj(c, b[0] + back[0], b[1] + back[1], H * 0.7);
  const w = f2(Math.max(0.35, 0.45 * (A.k + B.k) / 2));
  const net = `<polygon points="${pts([A, At, Bt, B])}" fill="#ffffff22"/><polygon points="${pts([At, Abt, Bbt, Bt])}" fill="#ffffff30"/><polygon points="${pts([A, Ab, Abt, At])}" fill="#ffffff26"/><polygon points="${pts([B, Bb, Bbt, Bt])}" fill="#ffffff26"/>`
    + `<polyline points="${pts([Ab, Abt, Bbt, Bb])}" fill="none" stroke="#ffffffaa" stroke-width="${f2(w * 0.4)}"/>`;
  const frame = `<polyline points="${pts([A, At, Bt, B])}" fill="none" stroke="#fff" stroke-width="${w * 2}" stroke-linejoin="round"/>`;
  return {d: Math.min(A.depth, B.depth), svg: net + frame};
}
function scene3(c, scene){
  const back = [], front = []; let bg = "";
  const add = (o) => (o.d < c.d + 30 ? front : back).push(o);
  scene.forEach(e => {
    const [kind, ...a] = e;
    switch(kind){
      case "grass": {
        const far = proj(c, 80, 45, 0); // sky, then grass from the horizon down
        bg += `<rect width="${W}" height="${H}" fill="#cfe6f7"/><rect y="${f2(c.hz)}" width="${W}" height="${H}" fill="#6fbf7a"/>`;
        bg += `<rect y="${f2(c.hz - 3)}" width="${W}" height="3" fill="#9fb8c9"/>`;
        for(let i = 0; i < 8; i += 2) bg += groundPoly(c, [[i * 20 + 20, -40], [i * 20 + 40, -40], [i * 20 + 40, 130], [i * 20 + 20, 130]], `fill="#66b671"`);
        if(!c.close) bg += `<polygon points="${pts([[2, 2], [158, 2], [158, 88], [2, 88]].map(q => proj(c, q[0], q[1])))}" fill="none" stroke="#ffffffaa" stroke-width=".5"/>`;
        break; }
      case "cone": add(cone3(c, a[0], a[1], a[2], a[3])); break;
      case "gate": { const v = a[4], col = a[3] || ORANGE, p1 = v ? [a[0], a[1] - a[2] / 2] : [a[0] - a[2] / 2, a[1]], p2 = v ? [a[0], a[1] + a[2] / 2] : [a[0] + a[2] / 2, a[1]];
        bg += groundLine(c, p1, p2, `stroke="${col}" stroke-dasharray="1.5 1.2" stroke-width=".6"`); add(cone3(c, p1[0], p1[1], col)); add(cone3(c, p2[0], p2[1], col)); break; }
      case "box": bg += groundPoly(c, [[a[0], a[1]], [a[0] + a[2], a[1]], [a[0] + a[2], a[1] + a[3]], [a[0], a[1] + a[3]]], `fill="#ffffff2a" stroke="#fff" stroke-dasharray="1.6 1.2" stroke-width=".5"`); break;
      case "spot": { const p = proj(c, a[0], a[1]); bg += `<ellipse cx="${f2(p.x)}" cy="${f2(p.y)}" rx="${f2(0.8 * p.k)}" ry="${f2(0.3 * p.k)}" fill="#fff"/>`; break; }
      case "ladder": { for(let i = 0; i <= a[2]; i++) bg += groundLine(c, [a[0] + i * a[3], a[1]], [a[0] + i * a[3], a[1] + a[4]], `stroke="#fff" stroke-width=".6"`);
        bg += groundLine(c, [a[0], a[1]], [a[0] + a[2] * a[3], a[1]], `stroke="#fff" stroke-width=".6"`) + groundLine(c, [a[0], a[1] + a[4]], [a[0] + a[2] * a[3], a[1] + a[4]], `stroke="#fff" stroke-width=".6"`); break; }
      case "channel": bg += groundLine(c, [a[0], a[2]], [a[1], a[2]], `stroke="#ffffffcc" stroke-width=".6"`) + groundLine(c, [a[0], a[3]], [a[1], a[3]], `stroke="#ffffffcc" stroke-width=".6"`); break;
      case "finish": bg += groundLine(c, [a[0], a[1]], [a[0], a[2]], `stroke="#fff" stroke-width="1" stroke-dasharray="2 1"`); break;
      case "line": bg += groundLine(c, [a[0], a[1]], [a[2], a[3]], `stroke="#ffffffaa" stroke-width=".6"`); break;
      case "label": { const p = proj(c, a[0], a[1]); bg += `<text x="${f2(p.x)}" y="${f2(p.y)}" font-size="${f2(Math.min(4.5, 1.6 * p.k))}" fill="#1f2b3d" text-anchor="middle">${esc(a[2])}</text>`; break; }
      case "path": { let q = a[0];
        if(a[1] === "curve" && q.length === 4){ const out = []; for(let i = 0; i <= 16; i++){ const t = i / 16, u = 1 - t; out.push([u*u*u*q[0][0] + 3*u*u*t*q[1][0] + 3*u*t*t*q[2][0] + t*t*t*q[3][0], u*u*u*q[0][1] + 3*u*u*t*q[1][1] + 3*u*t*t*q[2][1] + t*t*t*q[3][1]]); } q = out; }
        bg += `<polyline points="${pts(q.map(r => proj(c, r[0], r[1])))}" fill="none" stroke="#ffffffcc" stroke-width=".5" stroke-dasharray="1.6 1.2"/>`; break; }
      case "tape": { const p = proj(c, a[0], a[1], 8.4); add({d: p.depth - 0.1, svg: `<rect x="${f2(p.x - 0.9 * p.k)}" y="${f2(p.y - 0.9 * p.k)}" width="${f2(1.8 * p.k)}" height="${f2(1.8 * p.k)}" fill="#e0b400"/>`}); break; }
      case "goalTop": add(goal3(c, [a[0] - a[2] / 2, a[1]], [a[0] + a[2] / 2, a[1]], [0, -5])); break;
      case "goalRight": add(goal3(c, [a[0], a[1] - a[2] / 2], [a[0], a[1] + a[2] / 2], [5, 0])); break;
      case "goalLeft": add(goal3(c, [8, 30], [8, 60], [-5, 0])); break;
      case "wall": { if(UL(c.side, (a[0] + a[2]) / 2, (a[1] + a[3]) / 2)[0] < (c.uPeople ?? 0) - 2) break; const Hh = 4, A = proj(c, a[0], a[1]), B = proj(c, a[2], a[3]), At = proj(c, a[0], a[1], Hh), Bt = proj(c, a[2], a[3], Hh);
        add({d: Math.min(A.depth, B.depth), svg: `<polygon points="${pts([A, At, Bt, B])}" fill="#9aa1ab" stroke="#6f7680" stroke-width=".3"/>`}); break; }
    }
  });
  const sortFar = arr => arr.sort((x, y) => y.d - x.d).map(o => o.svg).join("");
  return {bg: bg + sortFar(back), front: sortFar(front)};
}

/* a front-facing player figure; feet at screen point p */
const SKIN = "#c68f62";
function figure(c, p, o){
  const k = c.H / 20 * p.k; // 20 local units tall
  const col = o.kind === "helper" ? ORANGE : o.kind === "keeper" ? KEEPER : BLUE;
  const lift = o.lift || 0, crouch = o.crouch || 0, ph = o.phase || 0, moving = o.moving || 0;
  const hipY = -9 + crouch * 3.2, sh = hipY - 7 + crouch * 0.8;
  let lf = o.feet ? o.feet[0] : [-2 + Math.sin(ph) * 0.6 * moving, -Math.max(0, Math.sin(ph)) * 2.2 * moving];
  let rf = o.feet ? o.feet[1] : [2 - Math.sin(ph) * 0.6 * moving, -Math.max(0, -Math.sin(ph)) * 2.2 * moving];
  // facing the camera: each hip connects to the foot on its own side of the screen, so legs never cross
  if(lf[0] > rf[0]) [lf, rf] = [rf, lf];
  if(crouch){ lf = [lf[0] - crouch * 1.2, lf[1]]; rf = [rf[0] + crouch * 1.2, rf[1]]; }
  const sw = Math.sin(ph) * 1.6 * moving, kneeOut = crouch * 1.4;
  const leg = (h, f, side) => `<polyline points="${side * 1.3},${hipY} ${f2((side * 1.3 + f[0]) / 2 + side * kneeOut)},${f2((hipY + f[1]) / 2)} ${f2(f[0])},${f2(f[1])}" fill="none" stroke="${SKIN}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<ellipse cx="${f2(f[0])}" cy="${f2(f[1])}" rx="1.3" ry=".8" fill="${NAVY}"/>`;
  const gloves = o.kind === "keeper";
  const armR = o.reach ? [6, sh - 3] : [4.6, hipY + 0.5 - sw], armL = o.reach ? [-6, sh - 3] : [-4.6, hipY + 0.5 + sw];
  const body = `${leg(0, lf, -1)}${leg(0, rf, 1)}
    <rect x="-3" y="${f2(hipY - 1.6)}" width="6" height="2.8" rx=".8" fill="${NAVY}"/>
    <path d="M-3.4 ${f2(sh + 1)} Q-3.6 ${f2(sh)} -2 ${f2(sh - 0.2)} H2 Q3.6 ${f2(sh)} 3.4 ${f2(sh + 1)} L3.1 ${f2(hipY - 1.2)} H-3.1Z" fill="${col}" stroke="#fff" stroke-width=".35"/>
    <polyline points="-3.1,${f2(sh + 0.8)} ${f2(armL[0])},${f2(armL[1])}" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/>
    <polyline points="3.1,${f2(sh + 0.8)} ${f2(armR[0])},${f2(armR[1])}" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/>
    ${gloves ? `<circle cx="${f2(armL[0])}" cy="${f2(armL[1])}" r=".95" fill="#e0b400"/><circle cx="${f2(armR[0])}" cy="${f2(armR[1])}" r=".95" fill="#e0b400"/>` : ""}
    <circle cx="0" cy="${f2(sh - 2.4)}" r="2.3" fill="${SKIN}"/><path d="M-2.3 ${f2(sh - 2.6)} Q0 ${f2(sh - 5.6)} 2.3 ${f2(sh - 2.6)} Q0 ${f2(sh - 3.6)} -2.3 ${f2(sh - 2.6)}Z" fill="#3b2a20"/>`;
  const rot = o.dive ? `rotate(${f2(o.dive * 72 * (o.diveDir || 1))} 0 ${hipY})` : "";
  const shadow = `<ellipse cx="${f2(p.x)}" cy="${f2(p.y)}" rx="${f2(3.2 * k)}" ry="${f2(0.9 * k)}" fill="#0000002e"/>`;
  return shadow + `<g transform="translate(${f2(p.x)} ${f2(p.y - lift * k)}) scale(${f2(k)}) ${rot}">${body}</g>`;
}
function ball3(c, x, y, z){
  const g = proj(c, x, y), p = proj(c, x, y, z * 10), r = (c.close ? 0.06 : 0.1) * c.H * p.k;
  return `<ellipse cx="${f2(g.x)}" cy="${f2(g.y)}" rx="${f2(r * 1.05)}" ry="${f2(r * 0.35)}" fill="#00000035"/>`
    + `<g transform="translate(${f2(p.x)} ${f2(p.y - r)})"><circle r="${f2(r)}" fill="#fff" stroke="#1f2b3d" stroke-width="${f2(r * 0.18)}"/><path d="M${f2(-0.45 * r)} ${f2(-0.3 * r)} L0 ${f2(-0.65 * r)} L${f2(0.45 * r)} ${f2(-0.3 * r)} L${f2(0.3 * r)} ${f2(0.25 * r)} L${f2(-0.3 * r)} ${f2(0.25 * r)}Z" fill="#1f2b3d"/></g>`;
}
function draw3(el, st, t){
  const s = st.s, c = s.cam, items = [];
  const feet = s.tracks.lf && s.tracks.rf ? [at(s.tracks.lf, t), at(s.tracks.rf, t)] : null;
  for(const [a, tr] of Object.entries(s.tracks)){
    const kind = s.actors[a], v = at(tr, t); if(!v) continue;
    if(kind === "foot") continue;
    if(kind === "ball"){ const g = proj(c, v[0], v[1]); items.push({d: g.depth - 0.5, svg: ball3(c, v[0], v[1], Math.max(0, v[2] || 0))}); continue; }
    const p = proj(c, v[0], v[1]);
    // stride: distance travelled since the last frame
    const prev = st.prev[a]; const moved = prev ? Math.hypot(v[0] - prev[0], v[1] - prev[1]) : 0; st.prev[a] = [v[0], v[1]];
    st.dist[a] = (st.dist[a] || 0) + moved; st.mov[a] = (st.mov[a] || 0) * 0.85 + Math.min(1, moved * 3) * 0.15;
    const o = {kind: kind === "body" || kind === "dot" ? "player" : kind, phase: st.dist[a] * 0.9, moving: st.mov[a]};
    if(kind === "body"){
      const z = v[2] || 0; if(z > 0) o.crouch = Math.min(1, z * 2.4); if(z < 0) o.lift = -z * 14;
      if(feet && feet[0] && feet[1]){ const kk = c.H / 20 * p.k; o.feet = feet.map(f => { const q = proj(c, f[0], f[1]); return [(q.x - p.x) / kk, (q.y - p.y) / kk]; }); }
    }
    if(kind === "keeper" && v[2]){ o.dive = v[2]; o.diveDir = p.x < 80 ? -1 : 1; o.lift = v[2] * 3; o.reach = true; }
    if(kind === "keeper" && !v[2]) o.reach = (s.tracks.b && (() => { const bv = at(s.tracks.b, t); return bv && (bv[2] || 0) > 0.3 && Math.hypot(bv[0] - v[0], bv[1] - v[1]) < 12; })());
    items.push({d: p.depth, svg: figure(c, p, o)});
  }
  items.sort((x, y) => y.d - x.d);
  st.actEl.innerHTML = items.map(i => i.svg).join("");
  let cap = ""; for(const [ct, cc] of s.caps){ if(ct <= t + 0.001) cap = cc; else break; }
  if(cap !== st.cap){ st.cap = cap; st.capEl.textContent = cap; }
  const says = s.says.filter(([t0]) => t >= t0 && t < t0 + 1.2);
  st.sayEl.innerHTML = says.map(([, a, txt]) => { const v = at(s.tracks[a] || [], t) || [80, 45]; const hp = proj(c, v[0], v[1], c.H * 1.15);
    const w = txt.length * 2.3 + 5, x = Math.min(W - w - 1, Math.max(1, hp.x - w / 2)), y = Math.max(1, hp.y - 9);
    return `<g><rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="7" rx="3.5" fill="#fff" stroke="${NAVY}" stroke-width=".4"/><text x="${f2(x + w / 2)}" y="${f2(y + 4.9)}" font-size="4.2" text-anchor="middle" fill="${NAVY}" font-weight="700">${esc(txt)}</text></g>`; }).join("");
}

export function animSvg(id, title){
  const s = getScript(id); if(!s) return "";
  const lbl = `role="img" aria-label="${esc((title ? title + ": " : "") + "animated demonstration")}" tabindex="0" title="Tap to pause or play"`;
  if(!s.cam.flat){
    const sc = scene3(s.cam, s.scene);
    return `<div class="drill-anim" data-anim="${esc(id)}" data-act="animToggle" ${lbl}>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sc.bg}<g data-actors3d></g>${sc.front}<g data-say></g></svg>
    <div class="anim-cap" aria-hidden="true"></div><span class="anim-state" aria-hidden="true"></span></div>`;
  }
  const actors = Object.entries(s.actors).sort((a, b) => (a[1] === "ball") - (b[1] === "ball")).map(([a, k]) => actorSvg(a, k)).join("");
  const bgKinds = ["grass", "board"], bg = sceneSvg(s.scene.filter(e => bgKinds.includes(e[0]))), fg = sceneSvg(s.scene.filter(e => !bgKinds.includes(e[0])));
  const z = s.zoom ? `translate(${s.zoom[0]} ${s.zoom[1]}) scale(${s.zoom[2]}) translate(${-s.zoom[0]} ${-s.zoom[1]})` : "";
  return `<div class="drill-anim" data-anim="${esc(id)}" data-act="animToggle" role="img" aria-label="${esc((title ? title + ": " : "") + "animated diagram")}" tabindex="0" title="Tap to pause or play">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${bg}<g${z ? ` transform="${z}"` : ""}>${fg}<g data-actors>${actors}</g></g><g data-say></g></svg>
    <div class="anim-cap" aria-hidden="true"></div><span class="anim-state" aria-hidden="true"></span></div>`;
}

/* ---------- player loop ---------- */
const live = new Map();   // element -> state
let rafId = null, io = null;
const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch(_){ return false; } };

function draw(el, st, t){
  const s = st.s;
  for(const [a, tr] of Object.entries(s.tracks)){
    const node = st.nodes[a]; if(!node) continue; const v = at(tr, t); if(!v){ node.setAttribute("display", "none"); continue; }
    const kind = s.actors[a];
    node.setAttribute("transform", `translate(${v[0].toFixed(2)} ${v[1].toFixed(2)})`);
    if(kind === "ball"){ const z = Math.max(0, v[2] || 0); const lift = node.querySelector("[data-lift]"); lift.setAttribute("transform", `translate(0 ${(-z * 7).toFixed(2)}) scale(${(1 + z * 0.55).toFixed(3)})`);
      node.querySelector("[data-shadow]").setAttribute("rx", (2 - z * 0.6).toFixed(2)); }
    else if(kind === "keeper"){ const d = v[2] || 0; const b = node.querySelector("[data-body]"); b.setAttribute("rx", (4.2 + d * 3.6).toFixed(2)); b.setAttribute("ry", (4.2 - d * 1.6).toFixed(2)); }
    else if(kind === "body"){ const z = v[2] || 0; node.querySelector("[data-body]").setAttribute("r", (9 * (1 - z * 0.25)).toFixed(2)); }
    else if(kind === "tick"){ node.querySelector("[data-tick]").setAttribute("opacity", (v[2] || 0).toFixed(2)); }
  }
  let cap = ""; for(const [ct, c] of s.caps){ if(ct <= t + 0.001) cap = c; else break; }
  if(cap !== st.cap){ st.cap = cap; st.capEl.textContent = cap; }
  // speech bubbles shown for 1.2s
  const says = s.says.filter(([st0]) => t >= st0 && t < st0 + 1.2);
  const key = says.map(x => x.join("|")).join(";");
  if(key !== st.sayKey){ st.sayKey = key;
    st.sayEl.innerHTML = says.map(([, a, txt]) => { const v = at(s.tracks[a] || [], t) || [80, 45]; const w = txt.length * 2.3 + 5, x = Math.min(W - w - 1, Math.max(1, v[0] - w / 2)), y = Math.max(1, v[1] - 13);
      return `<g><rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="#fff" stroke="${NAVY}" stroke-width=".4"/><text x="${x + w / 2}" y="${y + 4.9}" font-size="4.2" text-anchor="middle" fill="${NAVY}" font-weight="700">${esc(txt)}</text></g>`; }).join(""); }
}
function loop(now){
  rafId = null; let any = false;
  live.forEach((st, el) => {
    if(!el.isConnected){ live.delete(el); return; }
    if(!st.visible || st.paused) return;
    any = true; if(st.last == null) st.last = now;
    st.t = (st.t + (now - st.last) / 1000) % (st.s.dur + 0.8); st.last = now;
    (st.s.cam.flat ? draw : draw3)(el, st, Math.min(st.t, st.s.dur));
  });
  if(any) rafId = requestAnimationFrame(loop);
}
const kick = () => { if(rafId == null) rafId = requestAnimationFrame(loop); };

function attach(el){
  if(live.has(el)) return;
  const s = getScript(el.dataset.anim); if(!s) return;
  const nodes = {}; el.querySelectorAll("[data-a]").forEach(n => nodes[n.dataset.a] = n);
  const st = {s, nodes, t: 0, last: null, paused: reduced(), visible: false, cap: null, capEl: el.querySelector(".anim-cap"), sayEl: el.querySelector("[data-say]"), sayKey: null,
    actEl: el.querySelector("[data-actors3d]"), prev: {}, dist: {}, mov: {}};
  live.set(el, st); el.classList.toggle("paused", st.paused);
  (s.cam.flat ? draw : draw3)(el, st, reduced() ? Math.min(s.dur, 1.2) : 0);
  if(io) io.observe(el); else { st.visible = true; kick(); }
}
export function animScan(root = document){
  if(!io && "IntersectionObserver" in window){
    io = new IntersectionObserver(es => { es.forEach(e => { const st = live.get(e.target); if(!st) return; st.visible = e.isIntersecting; st.last = null; }); kick(); }, {rootMargin: "80px"});
  }
  root.querySelectorAll(".drill-anim[data-anim]").forEach(attach);
  kick();
}
export function animToggle(el){
  const st = live.get(el); if(!st) return;
  st.paused = !st.paused; st.last = null; el.classList.toggle("paused", st.paused); kick();
}
export const ANIM_COUNT = () => Object.keys(SCRIPTS).length;
