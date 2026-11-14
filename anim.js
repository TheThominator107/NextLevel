/* NextPlay drill animations.
   A small engine draws a top-down scene (grass, cones, wall, goal) and moves "actors"
   (player, helper, keeper, ball) between keyframes. Each drill has a short script below.
   Only animations on screen run; tap to pause or play; reduced-motion users tap to play. */

const W = 160, H = 90;
const BLUE = "#1f5fc9", ORANGE = "#d9572a", NAVY = "#14213a";

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
    // close-up footwork. Feet are [x, y, height]; the player faces the camera, right foot at larger x.
    const B = [80, 50], L = [77.6, 50, 0], R = [82.4, 50, 0], TOP = 3.5, k = [];
    const A = {body: "body", lf: "foot", rf: "foot", b: "ball"}, scene = [["grass", "close"]];
    if(kind === "tap"){
      for(let i = 0; i < 6; i++){ const t = i * 0.6, right = i % 2 === 0;
        k.push(K(t, {body: B, lf: right ? L : [79.6, 44.6, TOP], rf: right ? [80.4, 44.6, TOP] : R, b: [80, 43.6, 0]}, i < 3 ? "Tap the top, sole of each foot" : "Stay on the balls of your feet"));
        k.push(K(t + 0.3, {lf: right ? [78.4, 48.4, 1.7] : [78.6, 47.4, 1.9], rf: right ? [81.4, 47.4, 1.9] : [81.6, 48.4, 1.7]})); }
      k.push(K(3.6, {lf: L, rf: [80.4, 44.6, TOP]}));
      return {dur: 3.6, scene, actors: A, keys: k};
    }
    if(kind === "side"){
      const Lh = [75.4, 48.5, 0], Rh = [84.6, 48.5, 0];
      for(let i = 0; i < 7; i++){ const t = i * 0.5, left = i % 2 === 0;
        k.push(K(t, {body: B, lf: left ? [75.9, 48, 0.3] : Lh, rf: left ? Rh : [84.1, 48, 0.3], b: [left ? 78.3 : 81.7, 47.6, 0]}, "Inside of each foot, left-right-left"));
        if(i < 6) k.push(K(t + 0.25, {lf: [75.4, 48.5, 0.5], rf: [84.6, 48.5, 0.5]})); }
      return {dur: 3, scene, actors: A, keys: k};
    }
    if(kind === "roll"){
      const on = (x, y) => ({rf: [x + 0.3, y + 0.7, TOP], b: [x, y, 0]});
      k.push(K(0, {body: B, lf: L, ...on(83.5, 45)}, "Roll it across with the sole"));
      k.push(K(1.0, on(78.5, 45))); k.push(K(1.8, on(83.5, 45)));
      k.push(K(2.4, on(83.5, 47.4), "Pull back, push forward"));
      k.push(K(2.9, {rf: [83.4, 47.6, 0.5], b: [83.5, 43.6, 0]}));
      k.push(K(3.4, {rf: [83.8, 45.7, TOP], b: [83.5, 44.4, 0]})); k.push(K(3.8, on(83.5, 45)));
      return {dur: 3.8, scene, actors: A, keys: k};
    }
    if(kind === "inout"){
      // one foot: inside takes it across, outside brings it back, inside again; then the other foot
      const Y = 46.6, hop = 1.6; let t = 0;
      const set = (foot, mirror, cap0) => { const X = x => mirror ? 160 - x : x, F = (x, z = 0.3, y = 47.2) => ({[foot]: [X(x), y, z]}), ball = x => ({b: [X(x), Y, 0]});
        k.push(K(t, {...F(83.8), ...ball(81.5)}, cap0)); t += 0.5; k.push(K(t, {...F(80.8), ...ball(78.5)})); t += 0.25; k.push(K(t, F(78.5, hop, 48.4)));
        t += 0.25; k.push(K(t, {...F(76.2), ...ball(78.5)}, "…outside of the same foot back")); t += 0.5; k.push(K(t, {...F(79.2), ...ball(81.5)})); t += 0.25; k.push(K(t, F(81.5, hop, 48.4)));
        t += 0.25; k.push(K(t, {...F(83.8), ...ball(81.5)})); t += 0.45; k.push(K(t, {...F(80.8), ...ball(78.5)})); t += 0.3; k.push(K(t, {[foot]: mirror ? L : R})); t += 0.15; };
      k.push(K(0, {body: B, lf: L, rf: R})); set("rf", false, "Inside of the foot out…"); set("lf", true, "Then the other foot");
      return {dur: t, scene, actors: A, keys: k};
    }
    if(kind === "juggle"){
      for(let i = 0; i < 4; i++){ const t = i * 0.9, right = i % 2 === 0;
        k.push(K(t, {body: B, lf: right ? L : [79.3, 46.4, 1.7], rf: right ? [80.7, 46.4, 1.7] : R, b: [80, 46, 0.36]}, "Keep it up: feet, then alternate"));
        k.push(K(t + 0.45, {lf: L, rf: R, b: [80, 46, 1.15]})); }
      k.push(K(3.6, {rf: [80.7, 46.4, 1.7], b: [80, 46, 0.36]}));
      return {dur: 3.6, scene, actors: A, keys: k};
    }
    if(kind === "cushion"){
      k.push(K(0, {body: B, lf: L, rf: R, b: [80, 46.6, 1.3]}, "Toss it up")); k.push(K(0.4, {b: [80, 46.6, 1.3]})); k.push(K(0.95, {b: [80.6, 46.8, 2.05], rf: R}));
      k.push(K(1.5, {b: [81.8, 47.2, 1.28], rf: [82, 47.9, 4.6]}, "Cushion on the thigh")); k.push(K(1.9, {b: [81.4, 46.6, 1.6], rf: [82, 48.4, 3.4]}));
      k.push(K(2.5, {b: [80.9, 45.8, 0], rf: R}, "Let it drop")); k.push(K(2.95, {rf: [81.2, 46.5, TOP], b: [80.9, 45.8, 0]}, "Stop it with the sole")); k.push(K(3.8, {}));
      return {dur: 3.8, scene, actors: A, keys: k, hold: [[0, 0.42]]};
    }
    // circle: small touches round in a circle with the weaker foot
    const ring = [[83, 43.9], [85.6, 46.5], [83, 49.1], [80.4, 46.5]];
    ring.concat([ring[0]]).forEach((q, i) => k.push(K(i * 0.7, {body: B, lf: L, rf: [q[0] + 1.3, q[1] + 1.8, 0.4], b: [q[0], q[1], 0]}, cap2 || "Weaker foot only")));
    return {dur: 2.8, scene, actors: A, keys: k};
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
      t += 0.45; k.push(K(t, {b: [px + side, py - 4, 0]}));
      t += 0.7; k.push(K(t, {b: [px + side, top, 0]}));
      t += 0.8; k.push(K(t, {b: [px + side, py - 4, 0]}, o.recv ? o.recv[i % o.recv.length] : "Control"));
      if(o.after){ const a = o.after[i % o.after.length]; t += 0.7; k.push(K(t, {p: [a[0], a[1] + 4], b: [a[0], a[1], 0]}, a[2])); t += 0.5; }
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
    scene = field([["gate", 50, 24, 12, "#e0b400"], ["gate", 110, 24, 12, BLUE], ["gate", 80, 70, 12, "#c0392b"]]);
    k.push(K(0, {p: [80, 45], h: [122, 60]}, "Dribble in the middle, head up"));
    k.push(K(1, {p: [70, 40]}, null, {h: "Yellow!"})); k.push(K(2, {p: [51, 20]}, "Through the yellow gate")); k.push(K(2.8, {p: [80, 45]}));
    k.push(K(3.6, {p: [90, 50]}, null, {h: "Red!"})); k.push(K(4.5, {p: [80, 74]}, "Through the red gate")); k.push(K(5.3, {p: [80, 45]}));
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
      let t = 0; const holds = []; for(let i = 0; i < 2; i++){
        k.push(K(t, {p: [96, 47], b: [98, 46.6, 0.85]}, i ? "Half-volley: strike as it bounces" : "Toss it up")); holds.push([t, t + 0.4]);
        t += 0.4; k.push(K(t, {b: [98, 46.6, 0.85]})); t += 0.45; k.push(K(t, {b: [99.5, 46, i ? 1.3 : 1.6]}));
        if(i){ t += 0.4; k.push(K(t, {b: [100.5, 45.6, 0]})); t += 0.12; k.push(K(t, {b: [100.8, 45.5, 0.12], p: [97, 46]}, "Knee over, toes down")); }
        else { t += 0.45; k.push(K(t, {b: [100.5, 45.6, 0.42], p: [97, 46]}, "Volley it")); }
        t += 0.6; k.push(K(t, {b: [149, 40 + i * 10, 0.2]})); t += 0.7; }
      return {dur: t, scene, actors, keys: k, hold: holds};
    }
    if(kind === "firsttime"){
      actors.h = "helper"; let t = 0;
      for(let i = 0; i < 2; i++){
        k.push(K(t, {p: [96, 50], h: [110, 82], b: [110, 78, 0]}, "Helper rolls it across")); t += 0.45; k.push(K(t, {b: [110, 78, 0]}));
        t += 1.0; k.push(K(t, {b: [99, 51, 0], p: [97, 52]}, "Shoot first time"));
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
      k.push(K(0, {p: [96, 47], b: [100, 46, 0]}, "Inside of the foot, wrap round the ball")); k.push(K(0.6, {p: [98, 46], b: [100, 46, 0]}));
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
        k.push(K(t, {p: [62, 64], b: [65, 62, 0]}, kind === "long" ? (i ? "Lock the ankle, strike the bottom half" : "Lean back slightly") : (i ? "Land on your kicking foot" : "Across your body, knee over the ball")));
        t += 0.5; k.push(K(t, {p: [64, 63], b: [65, 62, 0]})); t += 0.3; k.push(K(t, {b: [66, 61.5, 0]}));
        k.push(K(t + 0.6, {b: [(65 + tgt[0]) / 2, (62 + tgt[1]) / 2, kind === "long" ? 1 : 0.12]})); t += 1.2; k.push(K(t, {b: [tgt[0], tgt[1], 0]}, kind === "long" ? "Into the box" : "Low and fast through the gate")); t += 0.6; }
      return {dur: t, scene, actors, keys: k};
    }
    if(kind === "cross"){
      scene = field([...goalRight, ["box", 120, 34, 14, 22]]);
      k.push(K(0, {p: [40, 82]}, "Dribble down the side")); k.push(K(1.4, {p: [112, 82]})); carry(k);
      k.push(K(1.8, {p: [114, 80], b: [117, 79, 0]}, "Plant foot at the target")); k.push(K(2.3, {b: [122, 62, 0.8]}, "Cross into the zone")); k.push(K(2.8, {b: [127, 44, 0]}));
      return {dur: 3.2, scene, actors, keys: k};
    }
    // switch of play
    scene = field([["wall", 50, 9, 110, 9], ["cone", 36, 46], ["cone", 124, 46]]); actors.h = "helper"; let t = 0;
    [[36, "Pressure!", [106, 58], "Check your shoulder, switch left"], [124, "Pressure!", [54, 58], "…or switch right"]].forEach(s => {
      k.push(K(t, {p: [80, 62], b: [80, 58, 0], h: s[2]}, "Pass to the wall")); t += 0.45; k.push(K(t, {b: [80, 58, 0]})); t += 0.6; k.push(K(t, {b: [80, 11, 0]}, null, {h: s[1]})); t += 0.6; k.push(K(t, {b: [80, 58, 0]}, s[3]));
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
      if(kind === "stance"){ k.push(K(2.45, {p: [88, 46], b: [91, 45, 0]})); k.push(K(2.85, {b: [80, 64, 0]})); k.push(K(3.4, {p: [82, 60], b: [80, 64, 0]}, "Won it")); }
      else { k.push(K(2.5, {p: [87, 45.5], b: [90, 45, 0]})); k.push(K(3.2, {p: [88, 45.5], b: [90.5, 45, 0]}, "Stay on your feet")); }
      return {dur: 3.6, scene, actors, keys: k};
    }
    if(kind === "press"){
      scene = field([["cone", 45, 18], ["cone", 115, 18], ["cone", 45, 74], ["cone", 115, 74]]);
      actors = {p: "player", h: "helper", h2: "helper", b: "ball"};
      k.push(K(0, {p: [80, 46], h: [45, 22], h2: [115, 70], b: [49, 24, 0]}, "Sprint to press")); k.push(K(1.0, {p: [58, 31], b: [49, 24, 0]}, "Curve your run to block one side"));
      k.push(K(1.7, {p: [58, 31], b: [111, 68, 0]})); k.push(K(2.7, {p: [103, 61], b: [111, 68, 0]}, "Arrive under control")); k.push(K(3.3, {b: [49, 24, 0]})); k.push(K(4.0, {p: [80, 46]}));
      return {dur: 4.2, scene, actors, keys: k};
    }
    if(kind === "line"){
      scene = field([["channel", 40, 124, 32, 58], ["finish", 120, 32, 58]]);
      k.push(K(0, {h: [45, 45], b: [49, 45, 0], p: [98, 45]}, "Attacker: stop the ball on the line"));
      k.push(K(1.2, {h: [72, 40], b: [76, 40, 0], p: [94, 43]}, "Defender: side-on, patient")); k.push(K(1.8, {h: [80, 50], b: [84, 52, 0], p: [95, 49]}, "Change of speed beats the defender"));
      k.push(K(2.8, {h: [116, 52], b: [120, 52, 0], p: [108, 50]})); k.push(K(3.6, {h: [45, 45], b: [49, 45, 0], p: [98, 45]}));
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
    const KP = [80, 17], SH = [56, 76]; // the server stands off to one side so the keeper is always in clear view
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
      [[72, 0], [90, 1.8]].forEach(([x, t]) => { k.push(K(t, {k: KP, h: [58, 70], b: [58, 66, 0]}, "React to the rebound")); k.push(K(t + 0.5, {b: [58, 66, 0]})); k.push(K(t + 0.9, {b: [x, 41, 0.3]})); k.push(K(t + 1.3, {b: [x, 19, 0.3], k: [x, 18]}, "Feet first, then hands")); });
      k.push(K(3.6, {k: KP}));
      return {dur: 3.6, scene, actors, keys: k};
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
      k.push(K(0, {k: [70, 17], h: SH, b: [56, 72, 0]}, "Shuffle, don't cross your feet")); k.push(K(0.6, {k: [90, 17]})); k.push(K(1.2, {k: [70, 17]})); k.push(K(1.8, {k: [80, 17]}, "'Set!'", {h: "Set!"}));
      k.push(K(2.3, {b: [56, 72, 0]})); k.push(K(3.0, {b: [80, 19, 0.4]}, "Catch it straight away")); k.push(K(3.6, {b: [80, 19, 0.4]}));
      return {dur: 3.8, scene, actors, keys: k};
    }
    if(kind === "comestay" || kind === "cross"){
      actors = {k: "keeper", b: "ball", h: "helper"};
      k.push(K(0, {k: KP, h: [124, 36], b: [120, 36, 0]}, kind === "cross" ? "Ball in from the side" : "Decide early"));
      k.push(K(0.8, {k: KP, b: [120, 36, 0]})); k.push(K(1.6, {b: [86, 26, 1], k: [84, 22]}, "'KEEPER!' Catch at the highest point", {k: "KEEPER!"})); k.push(K(2.2, {b: [85, 24, 0.6], k: [85, 24]}));
      if(kind === "comestay"){ k.push(K(3.0, {k: KP, h: [124, 36], b: [120, 36, 0]})); k.push(K(3.8, {k: KP, b: [120, 36, 0]})); k.push(K(4.6, {b: [76, 50, 0.9], k: KP}, "Too far? Call 'AWAY!' and stay set", {k: "AWAY!"})); k.push(K(5.4, {b: [66, 58, 0]})); return {dur: 5.6, scene, actors, keys: k}; }
      return {dur: 3, scene, actors, keys: k};
    }
    if(kind === "breakaway"){
      k.push(K(0, {k: KP, h: [58, 80], b: [59, 76, 0]}, "Close them down while their head is down")); k.push(K(1.2, {h: [68, 53], b: [69.5, 49, 0], k: [78, 27]}));
      k.push(K(1.7, {h: [71, 46], b: [75, 39.5, 0], k: [78.5, 31]}, "Big touch? Go down and smother")); k.push(K(2.1, {b: [76.5, 36.5, 0], k: [78.5, 34, 1]})); k.push(K(3.0, {k: [78.5, 34, 1]}));
      return {dur: 3.2, scene, actors, keys: k};
    }
    if(kind === "penalty"){
      scene = field([...goalTop, ["spot", 80, 44]]);
      k.push(K(0, {k: [80, 12], h: [92, 62], b: [80, 44, 0]}, "Watch the run-up, hips and plant foot")); k.push(K(1.2, {h: [83, 48]}, "Stay big and still"));
      k.push(K(1.6, {b: [80, 44, 0], k: [80, 12, 0]})); k.push(K(2.2, {b: [60, 10, 0.2], k: [63, 13, 1]}, "Dive to the side the clues show")); k.push(K(3.0, {}));
      return {dur: 3.2, scene, actors, keys: k};
    }
    // distribution
    if(kind === "rollout"){
      scene = field([...goalTop, ["gate", 80, 60, 12, NAVY]]); actors = {k: "keeper", b: "ball"};
      k.push(K(0, {k: KP, b: [80, 19.5, 0.85]}, "Step forward, bend low")); k.push(K(0.8, {k: [80, 21], b: [80, 24.2, 0.06]})); k.push(K(1.8, {b: [80, 62, 0]}, "Roll it: no bounce")); k.push(K(2.6, {k: KP}));
      return {dur: 3, scene, actors, keys: k};
    }
    if(kind === "goalkicks" || kind === "dist"){
      const targets = kind === "goalkicks" ? [[62, 62, 1, "Goal kick: under the ball"], [100, 62, 1, "Drop kick: strike as it lands"]]
        : [[58, 44, 0, "Roll it to a target"], [104, 46, 0.4, "Sidearm throw"], [80, 60, 1, "Overarm throw or kick"]];
      scene = field([...goalTop, ...targets.map(tg => ["box", tg[0] - 7, tg[1] - 5, 14, 10])]); actors = {k: "keeper", b: "ball"}; let t = 0;
      targets.forEach((tg, i) => { const held = kind === "dist";
        k.push(K(t, {k: KP, b: held ? [80, 19.5, 0.85] : [80, 21, 0]}, tg[3])); t += 0.5; k.push(K(t, {b: !held ? [80, 21, 0] : i === 0 ? [80, 20.6, 0.06] : i === 1 ? [82.4, 18.6, 0.95] : [80.6, 17.6, 1.95]})); k.push(K(t + 0.5, {b: [(80 + tg[0]) / 2, (21 + tg[1]) / 2, tg[2]]})); t += 1.0; k.push(K(t, {b: [tg[0], tg[1], 0]})); t += 0.5; });
      return {dur: t, scene, actors, keys: k};
    }
    // back-pass under pressure
    scene = field([...goalTop, ["cone", 50, 34], ["cone", 56, 34]]);
    k.push(K(0, {k: KP, h: [106, 48], b: [102, 46, 0]}, "Back-pass…")); k.push(K(0.45, {h: [106, 48], b: [102, 46, 0]})); k.push(K(1.3, {b: [82, 21, 0]}, "Scan first")); k.push(K(1.6, {h: [96, 38]}));
    k.push(K(2.2, {h: [90, 30], b: [77, 22, 0], k: [78, 18]}, "First touch away from the pressure")); k.push(K(3.0, {b: [53, 34, 0]}, "Then play it short and safe")); k.push(K(3.8, {h: [106, 48], k: KP}));
    return {dur: 4, scene, actors, keys: k};
  },

  // aerial control
  aerial(){
    const k = [];
    k.push(K(0, {h: [22, 18], b: [26, 20, 0], p: [112, 62]}, "Long, high ball in")); k.push(K(0.6, {h: [24, 19], b: [26, 20, 0]}));
    k.push(K(1.5, {b: [70, 42, 1]}, "Move your feet early")); k.push(K(2.4, {b: [108, 58, 0.3], p: [110, 60]}, "Cushion: chest, thigh or foot"));
    k.push(K(2.8, {b: [109, 59, 0]})); k.push(K(3.4, {b: [128, 52, 0], p: [124, 54]}, "Second touch into space")); k.push(K(4.0, {p: [112, 62]}));
    return {dur: 4.2, scene: field(), actors: {p: "player", h: "helper", b: "ball"}, keys: k, fit: [[90, 46], [132, 66]]};
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
      // body is [x, y, squat depth, lean (forward +, back -), turn side-on, tip sideways]
      const T0 = 1.4, L = [77.6, 50, 0], R = [82.4, 50, 0], st = (x = 80, z = 0, p = 0, tu = 0, ro = 0) => [x, 50, z, p, tu, ro];
      const ex = [
        ["Squats", {body: st(), lf: [76.8, 50, 0], rf: [83.2, 50, 0]}, {body: st(80, 0.45)}],
        ["Lunges", {body: st(80, 0.1), lf: [77.6, 53.5, 0], rf: [82.4, 44, 0]}, {body: st(80, 0.42)}],
        ["Glute bridges", {body: st(78, 0.86, -0.95, 1), lf: [84.4, 49, 0], rf: [84.4, 51, 0]}, {body: st(78, 0.58, -0.9, 1)}],
        ["Plank", {body: st(80, 0.58, 0.86, 1), lf: [68.4, 49.3, 0], rf: [68.4, 50.7, 0]}, {body: st(80, 0.6, 0.86, 1)}],
        ["Side plank", {body: st(80, 0, 0, 0, 0.72), lf: [79.3, 50, 0], rf: [80.7, 50, 0]}, {body: st(80, 0, 0, 0, 0.75)}],
        ["Balance on one leg", {body: st(), lf: [78.6, 50, 0], rf: [82.2, 48.2, 4.2]}, {body: st(80, 0.06)}]];
      ex.forEach(([name, a, b], i) => { const t = i * T0;
        k.push(K(t, i ? {} : {body: st(), lf: L, rf: R}, `${name}: 30 seconds`)); k.push(K(t + 0.3, a)); k.push(K(t + 0.65, {...a, ...b})); k.push(K(t + 1.0, a)); });
      k.push(K(ex.length * T0 + 0.2, {body: st(), lf: L, rf: R}));
      return {dur: ex.length * T0 + 0.4, scene: [["grass", "close"]], actors: {body: "body", lf: "foot", rf: "foot"}, keys: k};
    }
    if(kind === "jump"){
      k.push(K(0, {body: [56, 50, 0]}, "Jump up, land softly")); k.push(K(0.3, {body: [56, 50, 0.3]})); k.push(K(0.65, {body: [56, 50, -0.4]})); k.push(K(1.0, {body: [56, 50, 0.3]}, "Knees bent over toes"));
      k.push(K(1.5, {body: [80, 50, -0.4]}, "Jump forward")); k.push(K(1.95, {body: [80, 50, 0.3]})); k.push(K(2.45, {body: [104, 50, -0.4]})); k.push(K(2.9, {body: [104, 50, 0.3]}, "Quiet landings"));
      k.push(K(3.3, {body: [104, 50, 0]})); k.push(K(4.5, {body: [56, 50, 0]}, "Walk back and go again"));
      return {dur: 4.7, scene: [["grass", "close"]], actors: {body: "body"}, keys: k, wide: true};
    }
    // balance & reach: stand on the left leg, reach with the right
    const H0 = [82.4, 50, 0.7];
    k.push(K(0, {body: [80, 50, 0], lf: [78.4, 50, 0], rf: H0}, "Stand on one leg, knee soft"));
    [[82.4, 41.5, "Reach forward"], [90.5, 50, "To the side"], [84, 57, "Behind you"]].forEach((r, i) => { k.push(K(0.8 + i * 1.1, {rf: [r[0], r[1], 0.8]}, r[2])); k.push(K(1.35 + i * 1.1, {rf: H0})); });
    k.push(K(4.2, {}));
    return {dur: 4.2, scene: [["grass", "close"], ["path", [[82.4, 50], [82.4, 41.5]], "dash"], ["path", [[82.4, 50], [90.5, 50]], "dash"], ["path", [[82.4, 50], [84, 57]], "dash"]], actors: {body: "body", lf: "foot", rf: "foot"}, keys: k};
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
    k.push(K(t, {k: KP, b: [80, 19.5, 0.85]}, cap)); k.push(K(t + 0.25, {b: [80, 19.5, 0.85]})); k.push(K(t + 0.8, {b: [80, 44, Math.max(z, 0.3)]})); k.push(K(t + 1.4, {b: [80, 19.6, z]})); k.push(K(t + 1.75, {b: [80, 19.6, z]})); });
  return {dur: 5.4, scene: field([...goalTop, ["wall", 50, 46, 110, 46]]), actors: {k: "keeper", b: "ball"}, keys: k};
};

export const hasAnim = id => !!SCRIPTS[id];
const cache = {};
function getScript(id){ if(!cache[id]){ const f = SCRIPTS[id]; if(!f) return null; cache[id] = prep({...f(), id}); } return cache[id]; }

/* split keys per actor once */
function prep(s){
  const tracks = {}; Object.keys(s.actors).forEach(a => tracks[a] = []);
  s.keys.sort((a, b) => a.t - b.t).forEach(k => Object.entries(k.pos).forEach(([a, v]) => { if(tracks[a]) tracks[a].push([k.t, v]); }));
  Object.values(tracks).forEach(smooth);
  const caps = s.keys.filter(k => k.cap).map(k => [k.t, k.cap]);
  // numbered steps for the caption bar: a new number each time the text changes
  const capSeq = []; let n = -1, last = null;
  caps.forEach(([t, txt]) => { if(txt !== last){ n++; last = txt; capSeq.push([t, txt, n]); } });
  const says = []; s.keys.forEach(k => k.say && Object.entries(k.say).forEach(([a, txt]) => says.push([k.t, a, txt])));
  const out = {...s, tracks, caps, capSeq, capTotal: n + 1, says}; out.cam = camFor(s.id, out); if(!out.cam.flat) motion(out); return out;
}
/* Smooth paths: a monotone cubic through each actor's keyframes. Movement flows through waypoints
   instead of stopping at every one, holds stay perfectly still, and nothing overshoots its mark. */
function smooth(track){
  const n = track.length; if(!n) return;
  const dims = Math.max(...track.map(([, v]) => v.length));
  track.forEach(r => { const v = r[1].slice(); while(v.length < dims) v.push(0); r[1] = v; });
  const m = track.map(() => new Array(dims).fill(0));
  for(let j = 0; j < dims; j++){
    const d = []; for(let i = 0; i < n - 1; i++){ const h = track[i + 1][0] - track[i][0]; d.push(h > 1e-6 ? (track[i + 1][1][j] - track[i][1][j]) / h : 0); }
    for(let i = 1; i < n - 1; i++){
      const h0 = track[i][0] - track[i - 1][0], h1 = track[i + 1][0] - track[i][0], d0 = d[i - 1], d1 = d[i];
      if(d0 * d1 <= 0 || h0 <= 1e-6 || h1 <= 1e-6) continue;
      m[i][j] = 3 * (h0 + h1) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
    }
  }
  track.m = m;
}
function at(track, t){
  if(!track.length) return null;
  if(t <= track[0][0]) return track[0][1];
  for(let i = 1; i < track.length; i++){
    if(t <= track[i][0]){
      const [t0, a] = track[i - 1], [t1, b] = track[i], h = t1 - t0; if(h <= 1e-6) return b;
      const x = (t - t0) / h, x2 = x * x, x3 = x2 * x, h00 = 2 * x3 - 3 * x2 + 1, h10 = x3 - 2 * x2 + x, h01 = -2 * x3 + 3 * x2, h11 = x3 - x2;
      const ma = track.m ? track.m[i - 1] : null, mb = track.m ? track.m[i] : null;
      return a.map((v, j) => h00 * v + h01 * b[j] + h * (h10 * (ma ? ma[j] : 0) + h11 * (mb ? mb[j] : 0)));
    }
  }
  return track[track.length - 1][1];
}

/* ---------- which way the camera looks ----------
   The camera stands in front of the player, looking back at them. "top" = camera beyond the top edge
   looking down the field, "right" = beyond the right edge looking left, and so on. "flat" keeps the
   whiteboard / notebook drills as drawings. */
const CAM = {
  "b-5-10-5": "bottom", "b-first-step": "right", "b-accel-decel": "right", "b-quick-feet": "right", "b-recovery": "left",
  "b-color-gates": "bottom", "b-switch-play": "top", "b-jockey": "bottom", "b-stance": "bottom", "b-block-tackle": "bottom",
  "b-press-cover": "bottom", "b-1v1-line": "bottom", "b-defend-2v1": "left", "b-shield": "bottom", "b-aerial": "top",
  "b-call-ball": "left", "b-chip": "bottom", "b-lead-warmup": "bottom", "b-one-two": "right"
};
function camFor(id, s){
  if(s.scene.some(e => ["board", "screen", "paper"].includes(e[0]))) return {flat: true};
  if(s.zoom){ // close-ups: a camera above head height, tilted down, so the feet and the ball read clearly
    const th = 27 * Math.PI / 180, R = s.wide ? 200 : 152;
    return {side: "top", u0: 48.5 - R * Math.cos(th), lc: 0, f: 392, camH: 12.5 + R * Math.sin(th), cs: Math.cos(th), sn: Math.sin(th), cy: s.wide ? 44 : 49, hz: -100, H: 30, close: true}; }
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
  const gk = !!(s.id && s.id.startsWith("g-")), edge = [];
  Object.entries(s.tracks).forEach(([a, tr]) => tr.forEach(([, v]) => { if(gk && s.actors[a] === "helper"){ edge.push(UL(side, v[0], v[1])); people.push(UL(side, v[0], v[1])[0]); return; } if(!s.fit) P.push(v); if(s.actors[a] !== "ball") people.push(UL(side, v[0], v[1])[0]); }));
  s.scene.forEach(e => { const [k, ...a] = e;
    if(k === "cone") P.push([a[0], a[1]]);
    else if(k === "gate" || k === "spot" || k === "tape") P.push([a[0], a[1]]);
    else if(k === "box") P.push([a[0], a[1]], [a[0] + a[2], a[1] + a[3]]);
    else if(k === "goalTop") P.push([a[0] - a[2] / 2, a[1]], [a[0] + a[2] / 2, a[1]]);
    else if(k === "goalRight") P.push([a[0], a[1] - a[2] / 2], [a[0], a[1] + a[2] / 2]);
    else if(k === "goalLeft") P.push([8, 30], [8, 60]);
    else if(k === "ladder") P.push([a[0], a[1]], [a[0] + a[2] * a[3], a[1] + a[4]]); });
  if(s.fit){ P.length = 0; P.push(...s.fit); }
  const UL2 = P.map(v => UL(side, v[0], v[1]));
  const uMin = Math.min(...UL2.map(q => q[0])), lMin = Math.min(...UL2.map(q => q[1])), lMax = Math.max(...UL2.map(q => q[1]));
  // goalkeeper and chip drills: step the camera to one side so the shooter doesn't hide the keeper
  const shift = s.id && s.id.startsWith("g-") && s.id !== "g-roll-out" && s.id !== "g-goal-kicks" && s.id !== "g-distribution" ? 0.001 : 0;
  const dNear = 100, u0 = Math.min(uMin, ...edge.map(q => q[0])) - dNear, lc = (lMin + lMax) / 2 + shift;
  let f = 400; UL2.forEach(([u, l]) => { const depth = u - u0, off = Math.abs(l - lc) + 7; f = Math.min(f, 72 * depth / off); });
  edge.forEach(([u, l]) => { f = Math.min(f, 74 * (u - u0) / Math.max(1, Math.abs(l - lc)), 240); });
  // no player taller than about half the frame
  const nearest = Math.min(...people) - u0; f = Math.min(f, 50 * nearest / 16);
  f = Math.max(f, 40);
  const hz = shift ? 10 : 22, hc = (84 - hz) * dNear / f;
  return {side, u0, lc, f, hc, hz, H: 16, uPeople: Math.min(...people)};
}
function proj(c, x, y, z = 0){
  const [u, l] = UL(c.side, x, y);
  if(c.cs){ const d0 = u - c.u0, h = z - c.camH, zc = Math.max(d0 * c.cs - h * c.sn, 4), k = c.f / zc;
    return {x: 80 + (l - c.lc) * k, y: c.cy - (d0 * c.sn + h * c.cs) * k, k, depth: zc}; }
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
function actorSvg(id, kind, flip){
  const BLUE_ = flip ? ORANGE : BLUE, ORANGE_ = flip ? BLUE : ORANGE;
  const sh = (r) => `<circle cx=".35" cy=".7" r="${r}" fill="#0a1423" fill-opacity=".28"/>`;
  const g = (inner) => `<g data-a="${id}">${["dot", "dotMe", "oppDot", "dotA", "dotB", "dotC", "player", "helper"].includes(kind) ? sh(kind === "dot" || kind === "oppDot" ? 3.4 : 4) : ""}${inner}</g>`;
  switch(kind){
    case "player": return g(`<circle r="4" fill="${BLUE_}" stroke="#fff" stroke-width="1"/>`);
    case "helper": return g(`<circle r="4" fill="${ORANGE_}" stroke="#fff" stroke-width="1"/>`);
    case "keeper": return g(`<ellipse data-body rx="4.2" ry="4.2" fill="${BLUE}" stroke="#f2c81e" stroke-width="1.2"/>`);
    case "body": return g(`<circle data-body r="9" fill="${BLUE_}" stroke="#fff" stroke-width="1.2"/>`);
    case "foot": return g(`<ellipse rx="2.4" ry="3.4" fill="${NAVY}" stroke="#fff" stroke-width=".5"/>`);
    case "ball": return g(`<ellipse data-shadow cx="0" cy="1.6" rx="2" ry=".8" fill="#0003"/><g data-lift><circle data-ball r="2" fill="#fff" stroke="#1f2b3d" stroke-width=".55"/><path d="M-.9 -.6 L0 -1.3 L.9 -.6 L.6 .5 L-.6 .5z" fill="#1f2b3d"/></g>`);
    case "dot": return g(`<circle r="3.4" fill="${BLUE_}" stroke="#fff" stroke-width=".8"/>`);
    case "dotMe": return g(`<circle r="4" fill="#e0b400" stroke="#fff" stroke-width="1"/><text y="1.4" font-size="3.6" text-anchor="middle" fill="${NAVY}" font-weight="700">You</text>`);
    case "oppDot": return g(`<circle r="3.4" fill="${ORANGE_}" stroke="#fff" stroke-width=".8"/>`);
    case "dotA": case "dotB": case "dotC": return g(`<circle r="4" fill="${BLUE_}" stroke="#fff" stroke-width=".8"/><text y="1.4" font-size="4" text-anchor="middle" fill="#fff" font-weight="700">${kind.slice(-1)}</text>`);
    case "tick": return g(`<path data-tick d="M-2.6 0 L-.8 2 L2.8 -2.4" fill="none" stroke="#1d7a46" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>`);
  }
  return "";
}


/* ---------- drawing: front camera ---------- */
const f2 = n => n.toFixed(2);
const pts = arr => arr.map(p => f2(p.x) + "," + f2(p.y)).join(" ");
const DISPLAY_FONT = "Barlow Condensed, Arial Narrow, Arial, sans-serif";
let UID = 0;

const FLIP = new Set(["b-third-man", "b-draw-shape", "b-pro-watch", "b-film-review"]); // boards where the dots are the team on the ball
const hash = s => { let h = 2166136261; for(const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

function defs3(u, c){
  return `<defs>
  <linearGradient id="${u}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc8e8"/><stop offset="1" stop-color="#e3eff8"/></linearGradient>
  <linearGradient id="${u}grass" gradientUnits="userSpaceOnUse" x1="0" y1="${f2(Math.max(0, c.hz))}" x2="0" y2="${H}"><stop offset="0" stop-color="#4a925a"/><stop offset="1" stop-color="#7bc786"/></linearGradient>
  <linearGradient id="${u}haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef6fb" stop-opacity=".55"/><stop offset="1" stop-color="#eef6fb" stop-opacity="0"/></linearGradient>
  <linearGradient id="${u}shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".24"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
  <radialGradient id="${u}ball" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#f1f3f6"/><stop offset="1" stop-color="#aeb7c4"/></radialGradient>
  <radialGradient id="${u}sh"><stop offset="0" stop-color="#0b1a10" stop-opacity=".42"/><stop offset=".55" stop-color="#0b1a10" stop-opacity=".2"/><stop offset="1" stop-color="#0b1a10" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u}vig" cx=".5" cy=".48" r=".75"><stop offset=".6" stop-color="#0a1423" stop-opacity="0"/><stop offset="1" stop-color="#0a1423" stop-opacity=".32"/></radialGradient>
  <pattern id="${u}net" patternUnits="userSpaceOnUse" width="1.3" height="1.3"><path d="M0 0L1.3 1.3M1.3 0L0 1.3" stroke="#fff" stroke-width=".11" stroke-opacity=".6"/></pattern>
  </defs>`;
}
/* the corner badge and the progress line, shared by both kinds of scene */
const BUG = `<g aria-hidden="true"><rect x="3" y="3" width="25.5" height="5.8" rx="1.1" fill="${NAVY}" fill-opacity=".78"/><rect x="3" y="3" width="1.1" height="5.8" fill="${ORANGE}"/><text x="16.3" y="7.35" font-size="3.9" font-weight="700" letter-spacing=".35" text-anchor="middle" fill="#fff" font-family="${DISPLAY_FONT}">NEXTPLAY</text></g>`;
const PROGRESS = `<rect x="0" y="${H - 1}" width="${W}" height="1" fill="#0a1423" fill-opacity=".35"/><rect data-prog x="0" y="${H - 1}" width="0" height="1" fill="${ORANGE}"/>`;

function groundPoly(c, corners, attrs){ return `<polygon points="${pts(corners.map(q => proj(c, q[0], q[1], q[2] || 0)))}" ${attrs}/>`; }
function groundLine(c, a, b, attrs, z1 = 0, z2 = 0){ const p = proj(c, a[0], a[1], z1), q = proj(c, b[0], b[1], z2); return `<line x1="${f2(p.x)}" y1="${f2(p.y)}" x2="${f2(q.x)}" y2="${f2(q.y)}" ${attrs}/>`; }
function cone3(c, u, x, y, col = ORANGE, big){
  const p = proj(c, x, y), h = (big ? 3.4 : 2.5) * p.k, w = (big ? 1.6 : 1.25) * p.k, X = p.x, Y = p.y;
  const body = `M${f2(X - w)} ${f2(Y)} L${f2(X - w * 0.2)} ${f2(Y - h)} Q${f2(X)} ${f2(Y - h * 1.04)} ${f2(X + w * 0.2)} ${f2(Y - h)} L${f2(X + w)} ${f2(Y)} Q${f2(X)} ${f2(Y + w * 0.3)} ${f2(X - w)} ${f2(Y)}Z`;
  const b0 = 0.42, b1 = 0.58; // white band
  const bx = t => w * (1 - t * 0.8);
  return {d: p.depth, svg: `<ellipse cx="${f2(X + w * 0.25)}" cy="${f2(Y + w * 0.05)}" rx="${f2(w * 1.5)}" ry="${f2(w * 0.38)}" fill="url(#${u}sh)"/>`
    + `<ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(w * 1.3)}" ry="${f2(w * 0.34)}" fill="${col}"/><ellipse cx="${f2(X)}" cy="${f2(Y)}" rx="${f2(w * 1.3)}" ry="${f2(w * 0.34)}" fill="#000" fill-opacity=".18"/>`
    + `<path d="${body}" fill="${col}"/>`
    + `<polygon points="${f2(X - bx(b0))},${f2(Y - h * b0)} ${f2(X + bx(b0))},${f2(Y - h * b0)} ${f2(X + bx(b1))},${f2(Y - h * b1)} ${f2(X - bx(b1))},${f2(Y - h * b1)}" fill="#fff" fill-opacity=".85"/>`
    + `<path d="${body}" fill="url(#${u}shade)"/>`};
}
function goal3(c, u, a, b, back){ // posts at ground points a and b; back = offset vector of the net
  const GH = 14, A = proj(c, a[0], a[1]), B = proj(c, b[0], b[1]), At = proj(c, a[0], a[1], GH), Bt = proj(c, b[0], b[1], GH);
  const Ab = proj(c, a[0] + back[0], a[1] + back[1]), Bb = proj(c, b[0] + back[0], b[1] + back[1]), Abt = proj(c, a[0] + back[0], a[1] + back[1], GH * 0.7), Bbt = proj(c, b[0] + back[0], b[1] + back[1], GH * 0.7);
  const w = Math.max(0.35, 0.45 * (A.k + B.k) / 2);
  const panes = [[Ab, Abt, Bbt, Bb], [At, Abt, Bbt, Bt], [A, Ab, Abt, At], [B, Bb, Bbt, Bt]];
  const net = panes.map(q => `<polygon points="${pts(q)}" fill="#ffffff1c"/><polygon points="${pts(q)}" fill="url(#${u}net)"/>`).join("")
    + `<polyline points="${pts([Ab, Abt, Bbt, Bb])}" fill="none" stroke="#ffffffaa" stroke-width="${f2(w * 0.4)}"/>`
    + `<polygon points="${pts([A, B, Bb, Ab])}" fill="#0b1a10" fill-opacity=".12"/>`;
  const frame = `<polyline points="${pts([A, At, Bt, B])}" fill="none" stroke="#9aa6b5" stroke-width="${f2(w * 2.3)}" stroke-linejoin="round" transform="translate(${f2(w * 0.35)} ${f2(w * 0.2)})"/>`
    + `<polyline points="${pts([A, At, Bt, B])}" fill="none" stroke="#fff" stroke-width="${f2(w * 2)}" stroke-linejoin="round"/>`;
  return {d: Math.min(A.depth, B.depth), svg: net + frame};
}
function backdrop(c){
  const hz = c.hz; let s = "";
  // distant trees, two layers, then the perimeter boards
  [["#86ab93", 4.6, 3.1, 7], ["#4f8460", 3.4, 2.4, 3]].forEach(([col, base, r, seed]) => {
    s += `<rect y="${f2(hz - base)}" width="${W}" height="${f2(base)}" fill="${col}"/>`;
    for(let i = 0; i <= 42; i++){ const j = ((i * 53 + seed * 17) % 11) / 11, x = i * 4 - 1 + j * 2.4, rr = r * (0.75 + j * 0.5);
      s += `<circle cx="${f2(x)}" cy="${f2(hz - base + 0.6)}" r="${f2(rr)}" fill="${col}"/>`; }
  });
  s += `<rect y="${f2(hz - 1.9)}" width="${W}" height="1.9" fill="${NAVY}"/>`;
  for(let i = 0; i < 8; i++) s += `<rect x="${i * 20 + 0.6}" y="${f2(hz - 1.6)}" width="18.8" height="1.3" fill="${i % 2 ? BLUE : "#26375a"}"/>`;
  return s;
}
function scene3(c, u, scene){
  const back = [], front = []; let bg = "";
  const add = (o) => (o.d < c.d + 30 ? front : back).push(o);
  scene.forEach(e => {
    const [kind, ...a] = e;
    switch(kind){
      case "grass": {
        bg += `<rect width="${W}" height="${f2(Math.max(0, c.hz + 1))}" fill="url(#${u}sky)"/>` + (c.close ? "" : backdrop(c));
        bg += `<rect y="${f2(Math.max(0, c.hz))}" width="${W}" height="${H}" fill="url(#${u}grass)"/>`;
        for(let i = 0; i < 8; i += 2) bg += groundPoly(c, [[i * 20 + 20, -40], [i * 20 + 40, -40], [i * 20 + 40, 130], [i * 20 + 20, 130]], `fill="#fff" fill-opacity=".07"`);
        if(!c.close) bg += `<rect y="${f2(c.hz)}" width="${W}" height="9" fill="url(#${u}haze)"/>`;
        if(!c.close) bg += `<polygon points="${pts([[2, 2], [158, 2], [158, 88], [2, 88]].map(q => proj(c, q[0], q[1])))}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width=".55"/>`;
        break; }
      case "cone": add(cone3(c, u, a[0], a[1], a[2], a[3])); break;
      case "gate": { const v = a[4], col = a[3] || ORANGE, p1 = v ? [a[0], a[1] - a[2] / 2] : [a[0] - a[2] / 2, a[1]], p2 = v ? [a[0], a[1] + a[2] / 2] : [a[0] + a[2] / 2, a[1]];
        bg += groundLine(c, p1, p2, `stroke="${col}" stroke-dasharray="1.5 1.2" stroke-width=".6"`); add(cone3(c, u, p1[0], p1[1], col)); add(cone3(c, u, p2[0], p2[1], col)); break; }
      case "box": bg += groundPoly(c, [[a[0], a[1]], [a[0] + a[2], a[1]], [a[0] + a[2], a[1] + a[3]], [a[0], a[1] + a[3]]], `fill="#ffffff26" stroke="#fff" stroke-dasharray="1.6 1.2" stroke-width=".5"`); break;
      case "spot": { const p = proj(c, a[0], a[1]); bg += `<ellipse cx="${f2(p.x)}" cy="${f2(p.y)}" rx="${f2(0.8 * p.k)}" ry="${f2(0.3 * p.k)}" fill="#fff"/>`; break; }
      case "ladder": { const st = `stroke="#f5d94a" stroke-width=".65"`;
        for(let i = 0; i <= a[2]; i++) bg += groundLine(c, [a[0] + i * a[3], a[1]], [a[0] + i * a[3], a[1] + a[4]], st);
        bg += groundLine(c, [a[0], a[1]], [a[0] + a[2] * a[3], a[1]], `stroke="#1b1f2a" stroke-width=".55"`) + groundLine(c, [a[0], a[1] + a[4]], [a[0] + a[2] * a[3], a[1] + a[4]], `stroke="#1b1f2a" stroke-width=".55"`); break; }
      case "channel": bg += groundLine(c, [a[0], a[2]], [a[1], a[2]], `stroke="#ffffffcc" stroke-width=".6"`) + groundLine(c, [a[0], a[3]], [a[1], a[3]], `stroke="#ffffffcc" stroke-width=".6"`); break;
      case "finish": bg += groundLine(c, [a[0], a[1]], [a[0], a[2]], `stroke="#fff" stroke-width="1" stroke-dasharray="2 1"`); break;
      case "line": bg += groundLine(c, [a[0], a[1]], [a[2], a[3]], `stroke="#ffffffb0" stroke-width=".6"`); break;
      case "label": { const p = proj(c, a[0], a[1]); bg += `<text x="${f2(p.x)}" y="${f2(p.y)}" font-size="${f2(Math.min(4.5, 1.6 * p.k))}" fill="#fff" fill-opacity=".9" font-weight="700" font-family="${DISPLAY_FONT}" text-anchor="middle">${esc(a[2])}</text>`; break; }
      case "path": { let q = a[0];
        if(a[1] === "curve" && q.length === 4){ const out = []; for(let i = 0; i <= 16; i++){ const t = i / 16, v = 1 - t; out.push([v*v*v*q[0][0] + 3*v*v*t*q[1][0] + 3*v*t*t*q[2][0] + t*t*t*q[3][0], v*v*v*q[0][1] + 3*v*v*t*q[1][1] + 3*v*t*t*q[2][1] + t*t*t*q[3][1]]); } q = out; }
        bg += `<polyline points="${pts(q.map(r => proj(c, r[0], r[1])))}" fill="none" stroke="#ffffffd0" stroke-width=".5" stroke-dasharray="1.6 1.2" stroke-linecap="round"/>`; break; }
      case "tape": { const p = proj(c, a[0], a[1], 8.4); add({d: p.depth - 0.1, svg: `<rect x="${f2(p.x - 0.9 * p.k)}" y="${f2(p.y - 0.9 * p.k)}" width="${f2(1.8 * p.k)}" height="${f2(1.8 * p.k)}" fill="#e0b400" stroke="#9a7a00" stroke-width="${f2(0.1 * p.k)}"/>`}); break; }
      case "goalTop": add(goal3(c, u, [a[0] - a[2] / 2, a[1]], [a[0] + a[2] / 2, a[1]], [0, -5])); break;
      case "goalRight": add(goal3(c, u, [a[0], a[1] - a[2] / 2], [a[0], a[1] + a[2] / 2], [5, 0])); break;
      case "goalLeft": add(goal3(c, u, [8, 30], [8, 60], [-5, 0])); break;
      case "wall": { if(UL(c.side, (a[0] + a[2]) / 2, (a[1] + a[3]) / 2)[0] < (c.uPeople ?? 0) - 2) break; const Hh = 4, A = proj(c, a[0], a[1]), B = proj(c, a[2], a[3]), At = proj(c, a[0], a[1], Hh), Bt = proj(c, a[2], a[3], Hh);
        add({d: Math.min(A.depth, B.depth), svg: `<polygon points="${pts([A, At, Bt, B])}" fill="#a3aab3"/><polygon points="${pts([A, At, Bt, B])}" fill="url(#${u}shade)" opacity=".5"/><polyline points="${pts([At, Bt])}" fill="none" stroke="#cdd3da" stroke-width="${f2(Math.max(0.3, 0.25 * (A.k + B.k) / 2))}"/><polygon points="${pts([A, B, proj(c, a[2], a[3] + 0.01), proj(c, a[0], a[1] + 0.01)])}" fill="none" stroke="#6f7680" stroke-width=".25"/>`}); break; }
    }
  });
  const sortFar = arr => arr.sort((x, y) => y.d - x.d).map(o => o.svg).join("");
  return {bg: bg + sortFar(back), front: sortFar(front)};
}

/* ---------- players: a jointed figure posed in 3D, then drawn through the camera ----------
   Each player has a heading, a gait driven by how fast they move, and feet that go to the ball:
   dribble touches, a sole on a dead ball, a plant foot and a swinging leg for passes and shots.
   Orange = the team on the ball. Blue = defenders (and goalkeepers facing a shot). */
const PERSON = new Set(["player", "helper", "keeper", "body", "dot"]);
const SKINS = ["#f1c9a5", "#e0ac7e", "#c98f62", "#b07a4f", "#96623c", "#7a4a2b", "#5e3820", "#452a18"];
const HAIRS = ["#17110d", "#2b1d14", "#4a2f1c", "#7a5230", "#b98a4a"];
const KITS = {att: {shirt: ORANGE, shorts: NAVY, sock: ORANGE}, def: {shirt: BLUE, shorts: "#f3f5f8", sock: BLUE}};
// who defends in each drill (everyone else is on the ball)
const DEF = {"b-tight-space": ["h"], "b-1v1-recover": ["h"], "b-switch-play": ["h"], "b-shield": ["h"], "g-back-pass": ["h"], "b-jockey": ["p"], "b-stance": ["p"],
  "b-block-tackle": ["p"], "b-press-cover": ["p"], "b-1v1-line": ["p"], "b-defend-2v1": ["p"], "b-recovery": ["p"]};
const FLAGS = {"g-roll-out": {throws: 1}, "g-w-catch": {throws: 1}, "g-distribution": {throws: 1}, "g-back-pass": {kfeet: 1}, "g-goal-kicks": {kfeet: 1}};
const DT = 1 / 60, TW = 0.3, TF = 0.32;
const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2] || 0, b[2] || 0, t)];
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = a => Math.hypot(a[0], a[1], a[2]);
const unit3 = a => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const camDir = c => c.side === "top" ? [0, -1] : c.side === "bottom" ? [0, 1] : c.side === "right" ? [1, 0] : [-1, 0];
// middle joint of a two-bone limb from a to b, bending toward `bend`; returns [joint, reachable end]
function joint(a, b, l1, l2, bend){
  let d = sub3(b, a), L = len3(d); const max = (l1 + l2) * 0.999;
  if(L > max){ b = add3(a, d, max / L); d = sub3(b, a); L = max; }
  if(L < 1e-6) return [add3(a, unit3(bend), l1), b];
  const e = [d[0] / L, d[1] / L, d[2] / L], x = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let n = add3(bend, e, -dot3(bend, e)); n = len3(n) < 1e-4 ? [0, 0, 1] : unit3(n);
  return [add3(add3(a, e, x), n, h), b];
}

/* worked out once per drill: teams, looks, kicks, and each player's heading and stride over time */
function motion(s){
  const c = s.cam, U = c.H / 20, people = Object.keys(s.actors).filter(a => PERSON.has(s.actors[a]) && s.tracks[a].length);
  const h0 = hash(s.id || "x"), tb = s.tracks.b && s.tracks.b.length ? s.tracks.b : null, tc = camDir(c), n = Math.ceil(s.dur / DT) + 2;
  Object.assign(s, FLAGS[s.id] || {}); s.people = people; s.team = {}; s.looks = {}; s.kicks = []; s.mot = {};
  people.forEach((a, i) => {
    const keeper = s.actors[a] === "keeper";
    s.team[a] = keeper ? (people.length > 1 && s.id !== "g-back-pass" ? "def" : "att") : (DEF[s.id] || []).includes(a) ? "def" : "att";
    const si = (h0 + i * 3) % SKINS.length, hh = hash(s.id + ":" + a);
    s.looks[a] = {skin: SKINS[si], hair: HAIRS[si >= 4 ? hh % 2 : hh % HAIRS.length], style: (hh >>> 7) % 3};
  });
  // a kick: the ball leaves a player's feet and travels
  if(tb) for(let i = 0; i < tb.length - 1; i++){
    const [t0, p0] = tb[i], [t1, p1] = tb[i + 1], d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    if(t1 - t0 < 0.05 || d < 9) continue;
    let who = null, best = 7.5;
    people.forEach(p => { const v = at(s.tracks[p], t0), dd = Math.hypot(v[0] - p0[0], v[1] - p0[1]); if(dd < best){ best = dd; who = p; } });
    if(!who) continue;
    const e = at(s.tracks[who], t1); if(Math.hypot(e[0] - p1[0], e[1] - p1[1]) < 7) continue; // still at their feet: a dribble
    if(s.actors[who] === "keeper" && (s.throws || (p0[2] || 0) > 0.25)) continue;                // thrown, not kicked
    const dir = [(p1[0] - p0[0]) / d, (p1[1] - p0[1]) / d], v = at(s.tracks[who], t0), lat = (p0[0] - v[0]) * -dir[1] + (p0[1] - v[1]) * dir[0];
    s.kicks.push({t: t0, a: who, dir, b0: [p0[0], p0[1], Math.max(0, p0[2] || 0) * 10], foot: lat < -0.4 ? -1 : 1, pow: clamp(d / 45, 0.55, 1)});
  }
  people.forEach(a => {
    const tr = s.tracks[a], kind = s.actors[a], watcher = kind === "keeper" || s.id === "b-jockey" || (s.team[a] === "def" && tb);
    const M = {n, ang: new Float32Array(n), ph: new Float32Array(n), m: new Float32Array(n), sp: new Float32Array(n), mx: new Float32Array(n), my: new Float32Array(n), A: new Float32Array(n)};
    let ang = null, ph = 0, m = 0, mx = tc[0], my = tc[1], A = 1;
    for(let i = 0; i < n; i++){
      const t = i * DT, tA = Math.max(0, t - DT), p = at(tr, t), pa = at(tr, tA), pb = at(tr, t + DT);
      const vx = (pb[0] - pa[0]) / (t + DT - tA), vy = (pb[1] - pa[1]) / (t + DT - tA), sp = Math.hypot(vx, vy);
      const air = kind === "body" && (p[2] || 0) < -0.02, go = sp > 2 && !air;
      m += ((go ? 1 : 0) - m) * Math.min(1, DT * 9);
      if(go){ mx = vx / sp; my = vy / sp; const cad = clamp(2.4 + sp / 14, 2.6, 5.2); ph += Math.PI * cad * DT; A = clamp(sp / (2 * cad) / U, 0.6, 3.2); }
      const kk = s.kicks.find(k => k.a === a && t > k.t - TW && t < k.t + TF * 0.7);
      const b = tb ? at(tb, t) : null, bd = b ? Math.hypot(b[0] - p[0], b[1] - p[1]) : 0;
      let tx = null, ty = null, rate = 11;
      if(kk){ tx = kk.dir[0]; ty = kk.dir[1]; rate = 16; }
      else if(watcher && b){ if(bd > 1.5){ tx = (b[0] - p[0]) / bd; ty = (b[1] - p[1]) / bd; } }
      else if(sp > 3 && !air && s.id !== "b-jockey"){ tx = vx / sp; ty = vy / sp; }
      else if(b && kind !== "body"){ if(bd > 1.5 && bd < 75){ tx = (b[0] - p[0]) / bd; ty = (b[1] - p[1]) / bd; } }
      else if(!air){ tx = tc[0]; ty = tc[1]; rate = 6; }
      if(tx != null){ const ta = Math.atan2(ty, tx);
        if(ang == null) ang = ta; else { let d = ta - ang; d = Math.atan2(Math.sin(d), Math.cos(d)); ang += clamp(d, -rate * DT, rate * DT); } }
      else if(ang == null) ang = Math.atan2(tc[1], tc[0]);
      M.ang[i] = ang; M.ph[i] = ph; M.m[i] = m; M.sp[i] = sp; M.mx[i] = mx; M.my[i] = my; M.A[i] = A;
    }
    s.mot[a] = M;
  });
}

/* where every joint is at time t (world coordinates, z up) */
function pose(s, a, t){
  const c = s.cam, U = c.H / 20, M = s.mot[a], i = clamp(Math.round(t / DT), 0, M.n - 1);
  const kind = s.actors[a], keeper = kind === "keeper", v = at(s.tracks[a], t), zc = v[2] || 0;
  const ang = M.ang[i] + (kind === "body" ? (v[4] || 0) * Math.PI / 2 : 0);
  const f = [Math.cos(ang), Math.sin(ang), 0], r = [-f[1], f[0], 0], up = [0, 0, 1];
  const m = M.m[i], ph = M.ph[i], sp = M.sp[i], md = [M.mx[i], M.my[i], 0], P = [v[0], v[1], 0];
  const tb = s.tracks.b && s.tracks.b.length ? s.tracks.b : null, bv = tb ? at(tb, t) : null;
  const B = bv ? [bv[0], bv[1], Math.max(0, bv[2] || 0) * 10] : null, br = (c.close ? 0.06 : 0.1) * c.H;
  const bd = B ? Math.hypot(B[0] - P[0], B[1] - P[1]) / U : 99, lat = B ? (B[0] - P[0]) * r[0] + (B[1] - P[1]) * r[1] : 0;
  let crouch = 0, lift = 0, pitch = 0, roll = 0, rollDir = 1, dive = 0, scoop = 0;
  if(keeper){ dive = ease(clamp(zc, 0, 1)); roll = dive * 0.87; if(B) rollDir = lat < 0 ? -1 : 1; }
  else if(kind === "body"){ if(zc > 0) crouch = zc * 8; else lift = -zc * 14; pitch = (v[3] || 0) * Math.PI / 2; roll = v[5] || 0; }
  const set = keeper && !dive ? clamp(1 - sp / 25, 0, 1) : 0, guard = !keeper && s.team[a] === "def" ? 1 : 0;
  if(keeper && B && !dive && !s.kfeet && B[2] < 4 * U && bd < 6) scoop = ease((6 - bd) / 2.5) * ease((4 * U - B[2]) / (2 * U));
  crouch += scoop * 3.4;

  // feet
  const explicit = kind === "body" && s.tracks.lf && s.tracks.rf && s.tracks.lf.length > 0;
  const side = Math.abs(md[0] * r[0] + md[1] * r[1]), halfW = 1.5 + 0.8 * side * m + 0.75 * set + 0.45 * guard + crouch * 0.1;
  const A = lerp(M.A[i], Math.min(M.A[i], 1.1), side) * m, hl = (1 + 1.9 * Math.min(1, sp / 45)) * m;
  let feet, fdir = [f, f], busy = -1;
  if(explicit) feet = [at(s.tracks.lf, t), at(s.tracks.rf, t)].map(q => [q[0], q[1], q[2] || 0]);
  else {
    feet = [-1, 1].map(sg => { const p = ph + (sg > 0 ? Math.PI : 0), o = A * Math.sin(p);
      return [P[0] + U * (r[0] * sg * halfW + md[0] * o), P[1] + U * (r[1] * sg * halfW + md[1] * o), U * hl * Math.max(0, Math.cos(p))]; });
    const kk = s.kicks.find(k => k.a === a && t > k.t - TW && t < k.t + TF);
    if(kk){
      const q = t - kk.t, d = [kk.dir[0], kk.dir[1], 0], fi = kk.foot > 0 ? 1 : 0, pw = kk.pow, b0 = kk.b0; let back, hgt, w;
      if(q < 0){ const x = (q + TW) / TW, bs = x < 0.55 ? ease(x / 0.55) : 1 - ease((x - 0.55) / 0.45); back = -(1.1 + 3.6 * pw * bs); hgt = 0.3 + 3 * pw * bs; w = ease(x * 3); }
      else { const x = q / TF, sw = Math.sin(Math.min(1, x / 0.55) * Math.PI / 2); back = -1.1 + 5.4 * pw * sw; hgt = 0.3 + 3.2 * pw * sw; w = 1 - ease((x - 0.6) / 0.4); }
      feet[fi] = mix3(feet[fi], [b0[0] + d[0] * U * back, b0[1] + d[1] * U * back, b0[2] + U * hgt], w); fdir = [f, f]; fdir[fi] = d; busy = fi;
      const wp = q < 0 ? ease((q + TW) / TW * 2.2) : 1 - ease((q / TF - 0.55) / 0.45), sg = kk.foot > 0 ? -1 : 1;
      feet[1 - fi] = mix3(feet[1 - fi], [b0[0] - d[0] * U * 0.9 - d[1] * sg * U * 2.5, b0[1] - d[1] * U * 0.9 + d[0] * sg * U * 2.5, 0], wp * 0.9);
    }
    else if(B && !dive && !lift && !(keeper && !s.kfeet) && bd < 6.6 && B[2] < 8 * U){
      const fi = m > 0.4 ? (Math.sin(ph) > 0 ? 0 : 1) : (lat < -0.4 * U ? 0 : 1);
      const nx = (B[0] - P[0]) / (bd * U || 1), ny = (B[1] - P[1]) / (bd * U || 1), b1 = at(tb, t + DT), bsp = Math.hypot(b1[0] - bv[0], b1[1] - bv[1]) / DT;
      const w = ease((6.6 - bd) / 2.4) * lerp(1, 0.2 + 0.8 * Math.max(0, Math.sin(ph + (fi ? Math.PI : 0))), m); let tgt;
      if(B[2] > 1.2 * U) tgt = [B[0] - nx * br * 0.2, B[1] - ny * br * 0.2, Math.max(0, B[2] - U)];            // in the air: get the foot or thigh under it
      else if(sp < 1.5 && bsp < 3 && bd < 5.3) tgt = [B[0] - nx * br * 0.3, B[1] - ny * br * 0.3, 2 * br - 0.3 * U]; // dead ball: sole on top
      else tgt = [B[0] - nx * (br + 0.5 * U), B[1] - ny * (br + 0.5 * U), 0.35 * U];                              // a touch
      feet[fi] = mix3(feet[fi], tgt, w); busy = fi;
    }
  }
  if(lift) feet = feet.map(F => [F[0], F[1], F[2] + U * lift * 0.9]);

  // hips: as tall as the legs allow
  let hp = 9.2 - crouch - 0.7 * set - 0.5 * guard * (1 - m * 0.5) - 0.35 * m * Math.abs(Math.sin(ph));
  if(dive) hp = lerp(hp, clamp((B ? B[2] / U : 3) - 4.5, 2.6, 11), dive);
  const hipG = [-1, 1].map(sg => [P[0] + U * r[0] * sg * 1.45, P[1] + U * r[1] * sg * 1.45]);
  if(!dive) feet.forEach((F, j) => { const dx = F[0] - hipG[j][0], dy = F[1] - hipG[j][1]; let dH = Math.hypot(dx, dy) / U; const mxr = j === busy ? 7.6 : 6.4;
    if(!explicit && dH > mxr){ F[0] = hipG[j][0] + dx * mxr / dH; F[1] = hipG[j][1] + dy * mxr / dH; dH = mxr; }
    hp = Math.min(hp, Math.sqrt(Math.max(6, 82 - dH * dH)) + F[2] / U + 0.7 - lift * 0.9); });
  hp += lift;
  const Pz = [P[0], P[1], U * hp], ln = 0.3 * m * Math.min(1, sp / 45), pt = pitch + scoop * 0.95 + 0.12 * set + 0.1 * guard;
  const td = unit3([md[0] * ln + f[0] * Math.sin(pt), md[1] * ln + f[1] * Math.sin(pt), Math.cos(pt)]);
  const chest = add3(Pz, td, U * 6.3), head = add3(chest, unit3(add3(td, up, 0.6)), U * 2.9);
  const hips = [-1, 1].map(sg => add3(Pz, r, U * sg * 1.45)), sh = [-1, 1].map(sg => add3(add3(chest, r, U * sg * 2.7), td, -U * 0.35));
  if(dive) feet = feet.map((F, j) => mix3(F, add3(hips[j], up, -U * 8.6), dive));
  const pts = {pel: Pz, chest, head};
  feet.forEach((F, j) => { const sg = j ? 1 : -1, [kn, an] = joint(hips[j], [F[0], F[1], F[2] + 0.7 * U], 4.6 * U, 4.6 * U, add3(f, r, sg * (0.12 + Math.min(1, crouch / 4) * 0.5))), fz = an[2] - 0.25 * U, d = fdir[j];
    pts["hip" + j] = hips[j]; pts["knee" + j] = kn; pts["ank" + j] = an;
    pts["toe" + j] = [an[0] + d[0] * U * 1.7, an[1] + d[1] * U * 1.7, fz]; pts["heel" + j] = [an[0] - d[0] * U * 0.6, an[1] - d[1] * U * 0.6, fz]; });
  // arms
  const hold = !keeper && s.hold && s.hold.some(([t0, t1]) => t >= t0 && t <= t1), Bc = B ? [B[0], B[1], B[2] + br] : null;
  const arm = (S, Hd, sg) => joint(S, Hd, 3.3 * U, 3.1 * U, [-f[0] * 0.8 + r[0] * sg * 0.6, -f[1] * 0.8 + r[1] * sg * 0.6, -0.35]);
  [-1, 1].forEach((sg, j) => { const S = sh[j], sw = 0.5 * m - sg * Math.sin(ph) * 2.6 * m;
    let Hd = [S[0] + U * (r[0] * sg * (0.7 + 0.9 * guard) + f[0] * sw), S[1] + U * (r[1] * sg * (0.7 + 0.9 * guard) + f[1] * sw), S[2] - U * (5.7 - 2.1 * m - 0.5 * guard)];
    if(set) Hd = mix3(Hd, [S[0] + U * (f[0] * 2.6 + r[0] * sg * 1.2), S[1] + U * (f[1] * 2.6 + r[1] * sg * 1.2), S[2] - U * 2.5], set);
    if(lift) Hd = mix3(Hd, add3(add3(S, up, U * 4.5), r, U * sg * 1.5), clamp(lift / 4, 0, 1));
    if(dive) Hd = mix3(Hd, add3(S, td, U * 6), dive);
    if(Bc && (hold || (keeper && !(s.kfeet && B[2] < U)))){ const w = hold ? 1 : ease((10.5 - len3(sub3(Bc, chest)) / U) / 3);
      Hd = mix3(Hd, [Bc[0] + r[0] * sg * br * 0.75, Bc[1] + r[1] * sg * br * 0.75, Bc[2]], w); }
    if(Hd[2] < 0.4 * U){ const dz = S[2] - 0.4 * U, rem = Math.sqrt(Math.max(0, 32.5 * U * U - dz * dz)) * 0.9; // on the floor: lie along it
      Hd = [S[0] + f[0] * rem + r[0] * U * sg * 0.5, S[1] + f[1] * rem + r[1] * U * sg * 0.5, 0.4 * U]; }
    const [el, hd] = arm(S, Hd, sg); pts["sh" + j] = S; pts["el" + j] = el; pts["hd" + j] = hd; });
  // dives and side planks: roll the whole body about the line it faces along
  if(roll > 0.001){
    const th = roll * Math.PI / 2, cs = Math.cos(th), sn = Math.sin(th) * rollDir;
    for(const k in pts){ const o = sub3(pts[k], Pz), x = dot3(o, f), y = dot3(o, r), h = o[2], y2 = y * cs + h * sn, h2 = h * cs - y * sn;
      pts[k] = [Pz[0] + f[0] * x + r[0] * y2, Pz[1] + f[1] * x + r[1] * y2, Pz[2] + h2]; }
    [0, 1].forEach(j => { const S = pts["sh" + j], sg = j ? 1 : -1; let Hd = null;
      if(keeper && Bc){ const d = sub3(Bc, S), L = len3(d), mxl = 6.2 * U; Hd = mix3(pts["hd" + j], L > mxl ? add3(S, d, mxl / L) : Bc, dive); }
      else if(!keeper) Hd = (sg === rollDir) ? [S[0], S[1], -1e3] : add3(S, up, 5.9 * U);
      if(Hd){ const [el, hd] = arm(S, Hd, sg); pts["el" + j] = el; pts["hd" + j] = hd; } });
    let lo = Infinity; for(const k in pts) if(k.slice(0, 2) !== "hd" && k.slice(0, 2) !== "el") lo = Math.min(lo, pts[k][2]);
    const dz = 0.35 * U - lo; for(const k in pts) pts[k] = [pts[k][0], pts[k][1], Math.max(0.3 * U, pts[k][2] + dz)];
  }
  return {pts, f, P};
}

function drawFig(c, u, Q, o){
  const U = c.H / 20, g = proj(c, Q.P[0], Q.P[1], 0), wk = U * g.k, S = {}, T = Q.pts;
  for(const k in T) S[k] = proj(c, T[k][0], T[k][1], Math.max(0, T[k][2]));
  const ln = (a, b, w, col, cap = "round") => `<line x1="${f2(a.x)}" y1="${f2(a.y)}" x2="${f2(b.x)}" y2="${f2(b.y)}" stroke="${col}" stroke-width="${f2(w * wk)}" stroke-linecap="${cap}"/>`;
  const mx = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
  const dot = (p, rr, col, extra = "") => `<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(rr * wk)}" fill="${col}" ${extra}/>`;
  const kit = KITS[o.team], sk = o.look.skin;
  const leg = j => { const Hp = S["hip" + j], K = S["knee" + j], A = S["ank" + j], sock = mx(K, A, 0.42);
    return ln(Hp, K, 1.9, sk) + ln(K, A, 1.5, sk) + ln(sock, A, 1.66, kit.sock, "butt") + dot(A, 0.83, kit.sock) + ln(sock, mx(K, A, 0.5), 1.7, "#fff", "butt")
      + ln(S["heel" + j], S["toe" + j], 1.5, "#15181f") + ln(mx(S["heel" + j], S["toe" + j], 0.55), S["toe" + j], 0.55, "#fff") + ln(Hp, mx(Hp, K, 0.52), 2.5, kit.shorts, "butt") + dot(Hp, 1.25, kit.shorts); };
  const far = S.knee0.depth >= S.knee1.depth ? 0 : 1;
  let out = leg(far) + leg(1 - far) + ln(S.hip0, S.hip1, 2.7, kit.shorts);
  // torso: as wide as the shoulders look from here
  const base = mx(S.pel, S.chest, 0.1), dx = S.chest.x - base.x, dy = S.chest.y - base.y, dl = Math.hypot(dx, dy) || 1, n = {x: -dy / dl, y: dx / dl};
  const comp = (a, b) => ((b.x - a.x) * n.x + (b.y - a.y) * n.y) / wk;
  const fw = proj(c, T.chest[0] + Q.f[0] * U, T.chest[1] + Q.f[1] * U, T.chest[2]), cf = Math.abs(comp(S.chest, fw));
  const wS = Math.hypot(comp(S.sh0, S.sh1) / 2 * 0.9, 1.5 * cf) + 0.3, wW = Math.hypot(comp(S.hip0, S.hip1) / 2 * 1.45, 1.4 * cf) + 0.15;
  const q = (p, sg, w) => f2(p.x + n.x * sg * w * wk) + "," + f2(p.y + n.y * sg * w * wk);
  const poly = `${q(base, -1, wW)} ${q(S.chest, -1, wS)} ${q(S.chest, 1, wS)} ${q(base, 1, wW)}`;
  const torso = `<polygon points="${poly}" fill="${kit.shirt}" stroke="${kit.shirt}" stroke-width="${f2(0.9 * wk)}" stroke-linejoin="round"/><polygon points="${poly}" fill="url(#${u}shade)"/>`;
  const arm = j => { const Sh = S["sh" + j], E = S["el" + j], Hd = S["hd" + j];
    return o.keeper ? ln(Sh, E, 1.75, kit.shirt) + ln(E, Hd, 1.5, kit.shirt) + dot(Hd, 1.1, "#f2c81e", `stroke="#8a6d00" stroke-width="${f2(0.15 * wk)}"`)
      : ln(Sh, E, 1.35, sk) + ln(E, Hd, 1.15, sk) + ln(Sh, mx(Sh, E, 0.62), 1.9, kit.shirt, "butt") + dot(Sh, 0.95, kit.shirt) + dot(Hd, 0.68, sk); };
  const behind = j => S["sh" + j].depth > S.chest.depth + 0.3 * U;
  out += [0, 1].filter(behind).map(arm).join("") + torso;
  const tc = camDir(c), fc = Q.f[0] * tc[0] + Q.f[1] * tc[1], fxs = clamp((fw.x - S.chest.x) / wk, -1, 1);
  if(fc > 0.2){ const a = {x: S.chest.x - n.x * 0.95 * wk, y: S.chest.y - n.y * 0.95 * wk}, b = {x: S.chest.x + n.x * 0.95 * wk, y: S.chest.y + n.y * 0.95 * wk}, tip = mx(S.chest, base, 0.22);
    out += `<polyline points="${f2(a.x)},${f2(a.y)} ${f2(tip.x)},${f2(tip.y)} ${f2(b.x)},${f2(b.y)}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="${f2(0.34 * wk)}" stroke-linejoin="round" stroke-linecap="round"/>`; }
  // head and hair: more hair shows from behind, and it sits toward the back in profile
  const hc = S.head, R = 2.05 * wk, Rh = R * [1.05, 1.1, 1.17][o.look.style], b0 = 112 - 44 * fc;
  const tR = clamp(b0 - 46 * fxs, 38, 168) * Math.PI / 180, tL = clamp(b0 + 46 * fxs, 38, 168) * Math.PI / 180;
  const pL = [hc.x - Rh * Math.sin(tL), hc.y - Rh * Math.cos(tL)], pR = [hc.x + Rh * Math.sin(tR), hc.y - Rh * Math.cos(tR)];
  out += ln(S.chest, hc, 1.35, sk) + dot(hc, 2.05, sk) + `<circle cx="${f2(hc.x)}" cy="${f2(hc.y)}" r="${f2(R)}" fill="url(#${u}shade)" opacity=".7"/>`
    + `<path d="M${f2(pL[0])} ${f2(pL[1])} A${f2(Rh)} ${f2(Rh)} 0 ${tL + tR > Math.PI ? 1 : 0} 1 ${f2(pR[0])} ${f2(pR[1])} Q${f2((pL[0] + pR[0]) / 2)} ${f2((pL[1] + pR[1]) / 2 - Rh * 0.22)} ${f2(pL[0])} ${f2(pL[1])}Z" fill="${o.look.hair}"/>`;
  if(fc > 0.15) [-1, 1].forEach(sg => { const ox = sg * 0.74 * Math.max(0.35, fc) + fxs * 1.25; // eyes, when the face is in view
    if(Math.abs(ox) < 1.55) out += `<circle cx="${f2(hc.x + ox * wk)}" cy="${f2(hc.y + 0.22 * wk)}" r="${f2(0.24 * wk)}" fill="#161616" fill-opacity=".85"/>`; });
  out += [0, 1].filter(j => !behind(j)).map(arm).join("");
  const gc = proj(c, (T.pel[0] + T.chest[0]) / 2, (T.pel[1] + T.chest[1]) / 2, 0), ext = Math.hypot(T.chest[0] - Q.P[0], T.chest[1] - Q.P[1]) / U;
  return `<ellipse cx="${f2(gc.x + 0.4 * wk)}" cy="${f2(gc.y)}" rx="${f2((3.9 + ext * 0.55) * wk)}" ry="${f2((1.15 + ext * 0.05) * wk)}" fill="url(#${u}sh)"/>` + out;
}
function ball3(c, u, x, y, z, spin){
  const g = proj(c, x, y), p = proj(c, x, y, z * 10), r = (c.close ? 0.06 : 0.1) * c.H * p.k, sr = 1 / (1 + z * 0.6);
  const patch = (cx, cy, sz) => { let d = ""; for(let i = 0; i < 5; i++){ const a = (i * 72 - 90) * Math.PI / 180; d += (i ? "L" : "M") + f2(cx + Math.cos(a) * sz) + " " + f2(cy + Math.sin(a) * sz); } return d + "Z"; };
  let pat = patch(0, 0, 0.36 * r);
  for(let i = 0; i < 5; i++){ const a = (i * 72 + 90) * Math.PI / 180; pat += patch(Math.cos(a) * 0.82 * r, Math.sin(a) * 0.82 * r, 0.2 * r); }
  return `<ellipse cx="${f2(g.x + r * 0.15)}" cy="${f2(g.y)}" rx="${f2(r * 1.25 * sr)}" ry="${f2(r * 0.42 * sr)}" fill="url(#${u}sh)"/>`
    + `<g transform="translate(${f2(p.x)} ${f2(p.y - r)})"><circle r="${f2(r)}" fill="url(#${u}ball)" stroke="#27303f" stroke-width="${f2(r * 0.09)}"/>`
    + `<path d="${pat}" fill="#1f2633" transform="rotate(${f2(spin || 0)})"/><circle r="${f2(r)}" fill="none" stroke="#27303f" stroke-width="${f2(r * 0.09)}"/>`
    + `<ellipse cx="${f2(-0.35 * r)}" cy="${f2(-0.4 * r)}" rx="${f2(0.28 * r)}" ry="${f2(0.17 * r)}" fill="#fff" fill-opacity=".75" transform="rotate(-30 ${f2(-0.35 * r)} ${f2(-0.4 * r)})"/></g>`;
}
function bubble(x0, y0, txt){
  const w = txt.length * 2.3 + 6, x = Math.min(W - w - 1, Math.max(1, x0 - w / 2)), y = Math.max(1, y0 - 10.5), tx = Math.min(x + w - 2.5, Math.max(x + 2.5, x0));
  return `<g><rect x="${f2(x + 0.4)}" y="${f2(y + 0.6)}" width="${f2(w)}" height="7" rx="3.5" fill="#0a1423" fill-opacity=".22"/>`
    + `<path d="M${f2(tx - 1.5)} ${f2(y + 6.6)} L${f2(tx)} ${f2(y + 9)} L${f2(tx + 1.5)} ${f2(y + 6.6)}Z" fill="#fff"/>`
    + `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="7" rx="3.5" fill="#fff"/>`
    + `<text x="${f2(x + w / 2)}" y="${f2(y + 5)}" font-size="4.3" text-anchor="middle" fill="${NAVY}" font-weight="700" font-family="${DISPLAY_FONT}" letter-spacing=".15">${esc(txt)}</text></g>`;
}
function draw3(el, st, t){
  const s = st.s, c = s.cam, u = st.u, items = [];
  for(const [a, tr] of Object.entries(s.tracks)){
    const kind = s.actors[a], v = at(tr, t); if(!v || kind === "foot") continue;
    if(kind === "ball"){ const prev = st.prev[a], moved = prev ? Math.hypot(v[0] - prev[0], v[1] - prev[1]) : 0; st.prev[a] = [v[0], v[1]];
      const g = proj(c, v[0], v[1]); st.spin[a] = ((st.spin[a] || 0) + moved * 55) % 360;
      items.push({d: g.depth - 0.5, svg: ball3(c, u, v[0], v[1], Math.max(0, v[2] || 0), st.spin[a])}); continue; }
    if(!s.mot[a]) continue;
    items.push({d: proj(c, v[0], v[1]).depth, svg: drawFig(c, u, pose(s, a, t), {team: s.team[a], look: s.looks[a], keeper: kind === "keeper"})});
  }
  items.sort((x, y) => y.d - x.d);
  st.actEl.innerHTML = items.map(i => i.svg).join("");
  const says = s.says.filter(([t0]) => t >= t0 && t < t0 + 1.2);
  st.sayEl.innerHTML = says.map(([, a, txt]) => { const v = at(s.tracks[a] || [], t) || [80, 45]; const hp = proj(c, v[0], v[1], c.H * 1.15); return bubble(hp.x, hp.y, txt); }).join("");
}

/* caption bar: the current step, "2/4", and a short fade when it changes */
function showCaption(st, t){
  const s = st.s; let cur = null;
  for(const row of s.capSeq){ if(row[0] <= t + 0.001) cur = row; else break; }
  const txt = cur ? cur[1] : "", n = cur ? cur[2] : 0;
  if(txt !== st.cap){
    st.cap = txt; st.capEl.textContent = txt;
    if(st.stepEl) st.stepEl.textContent = s.capTotal > 1 && txt ? `${n + 1}/${s.capTotal}` : "";
    if(st.started && st.capEl.animate) try { st.capEl.animate([{opacity: 0, transform: "translateY(3px)"}, {opacity: 1, transform: "none"}], {duration: 260, easing: "ease-out"}); } catch(_){}
  }
  st.started = true;
  if(st.progEl) st.progEl.setAttribute("width", f2(W * Math.min(1, t / (s.dur || 1))));
}

export function animSvg(id, title){
  const s = getScript(id); if(!s) return "";
  const lbl = `role="img" aria-label="${esc((title ? title + ": " : "") + (s.cam.flat ? "animated diagram" : "animated demonstration"))}" tabindex="0" title="Tap to pause or play"`;
  const cap = `<div class="anim-cap" aria-hidden="true"><span class="anim-step"></span><span class="anim-text"></span></div><span class="anim-state" aria-hidden="true"></span>`;
  if(!s.cam.flat){
    const u = "np" + (++UID) + "-", sc = scene3(s.cam, u, s.scene);
    return `<div class="drill-anim" data-anim="${esc(id)}" data-uid="${u}" data-act="animToggle" ${lbl}>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs3(u, s.cam)}${sc.bg}<g data-actors3d></g>${sc.front}<rect width="${W}" height="${H}" fill="url(#${u}vig)"/><g data-say></g>${BUG}${PROGRESS}</svg>
    ${cap}</div>`;
  }
  const actors = Object.entries(s.actors).sort((a, b) => (a[1] === "ball") - (b[1] === "ball")).map(([a, k]) => actorSvg(a, k, FLIP.has(id))).join("");
  const bgKinds = ["grass", "board"], bg = sceneSvg(s.scene.filter(e => bgKinds.includes(e[0]))), fg = sceneSvg(s.scene.filter(e => !bgKinds.includes(e[0])));
  const z = s.zoom ? `translate(${s.zoom[0]} ${s.zoom[1]}) scale(${s.zoom[2]}) translate(${-s.zoom[0]} ${-s.zoom[1]})` : "";
  return `<div class="drill-anim" data-anim="${esc(id)}" data-act="animToggle" ${lbl}>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${bg}<g${z ? ` transform="${z}"` : ""}>${fg}<g data-actors>${actors}</g></g><g data-say></g>${BUG}${PROGRESS}</svg>
    ${cap}</div>`;
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
    else if(kind === "tick"){ node.querySelector("[data-tick]").setAttribute("opacity", Math.max(0, Math.min(1, v[2] || 0)).toFixed(2)); }
  }
  // speech bubbles shown for 1.2s
  const says = s.says.filter(([st0]) => t >= st0 && t < st0 + 1.2);
  const key = says.map(x => x.join("|")).join(";");
  if(key !== st.sayKey){ st.sayKey = key;
    st.sayEl.innerHTML = says.map(([, a, txt]) => { const v = at(s.tracks[a] || [], t) || [80, 45]; return bubble(v[0], v[1] - 2.5, txt); }).join(""); }
}
function frame(el, st, t){ (st.s.cam.flat ? draw : draw3)(el, st, t); showCaption(st, t); }
function loop(now){
  rafId = null; let any = false;
  live.forEach((st, el) => {
    if(!el.isConnected){ live.delete(el); return; }
    if(!st.visible || st.paused) return;
    any = true; if(st.last == null) st.last = now;
    st.t = (st.t + (now - st.last) / 1000) % (st.s.dur + 0.8); st.last = now;
    frame(el, st, Math.min(st.t, st.s.dur));
  });
  if(any) rafId = requestAnimationFrame(loop);
}
const kick = () => { if(rafId == null) rafId = requestAnimationFrame(loop); };

function attach(el){
  if(live.has(el)) return;
  const s = getScript(el.dataset.anim); if(!s) return;
  const nodes = {}; el.querySelectorAll("[data-a]").forEach(n => nodes[n.dataset.a] = n);
  const st = {s, nodes, t: 0, last: null, paused: reduced(), visible: false, cap: null, capEl: el.querySelector(".anim-text"), stepEl: el.querySelector(".anim-step"),
    sayEl: el.querySelector("[data-say]"), sayKey: null, progEl: el.querySelector("[data-prog]"), u: el.dataset.uid || "",
    actEl: el.querySelector("[data-actors3d]"), prev: {}, dist: {}, mov: {}, spin: {}};
  live.set(el, st); el.classList.toggle("paused", st.paused);
  frame(el, st, reduced() ? Math.min(s.dur, 1.2) : 0);
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
/* jump a paused animation to a moment in time (used for previews and tests) */
export function animSeek(el, t){
  const st = live.get(el); if(!st) return;
  st.paused = true; st.t = t; el.classList.add("paused"); frame(el, st, Math.min(t, st.s.dur));
}
export const animDur = id => { const s = getScript(id); return s ? s.dur : 0; };
