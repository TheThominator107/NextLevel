/* NextPass introductory video for the home page: a short animated tour for coaches, players and parents.
   Everything is drawn from the time t, so it can be paused, scrubbed by chapter and exported frame by frame. */
import { animSvg, animScan, animSeek, animDur } from "./anim.js";
const tr = t => (window.npT ? window.npT(t) : t); /* Spanish when that language is on (i18n.js) */

const W = 640, H = 360;
const DRILL = "b-wall-pass";
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

const SCENES = [
  {id:"intro",   chap:"",           dur:4.6, cap:"One place for coaches, players and parents.",
    text:"NextPass brings coaches, players and parents together in one place, from first touch to first offer."},
  {id:"review",  chap:"Coaches",    dur:6.8, cap:"Coaches review each player and say what to work on.",
    text:"Coaches review each player on 19 field skills or 7 goalkeeper skills, mark a strength and what to work on, and add a note."},
  {id:"home",    chap:"Players",    dur:6.8, cap:"Players train at home with drills picked for them.",
    text:"Players get home drills picked from their latest review. Each drill has an animation and simple steps, and they tick them off as they go."},
  {id:"parents", chap:"Parents",    dur:6.4, cap:"Parents follow progress and message the coach.",
    text:"Parents see every review, follow their child's progress over the season, and message the coach in one place."},
  {id:"session", chap:"Teams",      dur:6.4, cap:"Coaches plan team practices from the drill library.",
    text:"Coaches plan team practices from a library of team drills, or build a session around what the team's reviews say it needs."},
  {id:"recruit", chap:"Recruiting", dur:6.8, cap:"Colleges, scouts and clubs can find players who are ready.",
    text:"Players 16 and over can open their profile to college coaches and approved pro scouts. Youth clubs can find players of any age, with a parent's permission."},
  {id:"end",     chap:"",           dur:4.8, cap:"Develop every player. Get every player seen.",
    text:"Develop every player. Get every player seen. Start your club or join your team on NextPass."}
];
let acc = 0; SCENES.forEach(s => { s.start = acc; acc += s.dur; });
export const INTRO_DURATION = acc;

/* ---------- markup ---------- */
const kick = (k, h, p) => `<div class="iv-side"><span class="iv-kick" data-in=".15">${k}</span><h3 class="iv-h" data-in=".3">${h}</h3><p class="iv-p" data-in=".5">${p}</p></div>`;
const LEVELS = {1:"Getting started", 2:"Developing", 3:"Solid", 4:"Strong", 5:"Standout"};
const pips = (n, at) => `<span class="iv-pips">${[1,2,3,4,5].map(i => `<i data-on="${(at + i * .09).toFixed(2)}"${i <= n ? ' class="fill"' : ""}></i>`).join("")}</span>`;

function sceneHtml(s){
  switch(s.id){
  case "intro": return `<div class="iv-center">
      <img src="brand/mark.svg" alt="" class="iv-mark" data-in=".2" data-fx="pop">
      <div class="iv-word" data-in=".55" translate="no">Next<span>Pass</span></div>
      <p class="iv-tag" data-in="1.1">Youth soccer development, from first touch to first offer.</p>
      <div class="iv-chips"><span data-in="1.8" data-fx="pop">Coaches</span><span data-in="2.05" data-fx="pop">Players</span><span data-in="2.3" data-fx="pop">Parents</span></div>
    </div>`;
  case "review": {
    const rows = [["First touch", 3], ["Passing", 4], ["Dribbling", 5], ["Decision making", 3], ["Defending", 4]];
    return `${kick("For coaches", "Review every player", "A level for each skill that matters, in plain words, plus a note on what to work on next.")}
    <div class="iv-card iv-review" data-in=".35" data-fx="left">
      <div class="iv-who"><span class="iv-av" style="background:#1f5fc9">MR</span><div><b>Maya R.</b><small>U12 Girls · Midfielder</small></div><span class="iv-date">Nov 14</span></div>
      ${rows.map(([l, n], i) => `<div class="iv-row"><span>${l}</span><span class="iv-rv">${pips(n, .9 + i * .38)}<b class="iv-lvl" data-in="${(1.45 + i * .38).toFixed(2)}" data-fx="pop">${LEVELS[n]}</b></span></div>`).join("")}
      <div class="iv-tags"><span class="good" data-in="3.2" data-fx="pop">Strength: Dribbling</span><span class="work" data-in="3.45" data-fx="pop">Work on: First touch</span></div>
      <p class="iv-note"><span data-type="3.9" data-text="Great energy this week. Keep that first touch out of your feet."></span><i class="iv-caret" data-blink="3.9"></i></p>
    </div>`; }
  case "home": return `${kick("For players", "Train at home", "Drills are picked from the latest review. Each one has an animation and simple steps.")}
    <div class="iv-phone" data-in=".3" data-fx="up">
      <div class="iv-ph-top"><b>This week</b><small>3 drills</small></div>
      <div class="iv-ph-drill">${animSvg(DRILL, "Wall passes")}</div>
      ${[["Wall passes", "10 min", 2.6], ["Toe taps", "5 min", 3.6], ["Cone weave", "10 min", 4.6]].map(([n, m, at]) => `<div class="iv-ph-row"><span class="iv-check" data-on="${at}"></span><span>${n}</span><small>${m}</small></div>`).join("")}
    </div>
    <span class="iv-badge" data-in="5.2" data-fx="pop">3 of 3 done this week</span>`;
  case "parents": return `${kick("For parents", "Follow every step", "See each review, the drills done at home, and message the coach in one place.")}
    <div class="iv-card iv-chart" data-in=".35" data-fx="left">
      <div class="iv-who"><span class="iv-av" style="background:#1f5fc9">MR</span><div><b>Maya's overall level</b><small>Developing → Solid</small></div><span class="iv-up" data-in="2.3" data-fx="pop">▲ Improved</span></div>
      <svg viewBox="0 0 300 96" aria-hidden="true"><g stroke="#e3e8f0" stroke-width="1"><line x1="10" y1="16" x2="290" y2="16"/><line x1="10" y1="48" x2="290" y2="48"/><line x1="10" y1="80" x2="290" y2="80"/></g>
        <path d="M20 72 L110 56 L200 40 L280 22" fill="none" stroke="#c4471c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" data-draw=".8,1.6"/>
        ${[[20,72,.8],[110,56,1.25],[200,40,1.75],[280,22,2.3]].map(([x, y, a]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#fff" stroke="#c4471c" stroke-width="3" data-in="${a}" data-fx="dot"/>`).join("")}
        <g font-size="10" fill="#475467" font-family="Inter, Arial, sans-serif"><text x="20" y="94" text-anchor="middle">Sep</text><text x="110" y="94" text-anchor="middle">Oct</text><text x="200" y="94" text-anchor="middle">Nov</text><text x="280" y="94" text-anchor="middle">Now</text></g></svg>
    </div>
    <div class="iv-msg coach" data-in="3.0" data-fx="up"><b>Coach</b> Big improvement in Maya's first touch this month!</div>
    <div class="iv-msg parent" data-in="4.2" data-fx="up">Thank you! She's done her wall passes every day.</div>`;
  case "session": {
    const blocks = [["Warm-up", "Rondo 4v1", 15, "#2f9e5b"], ["Possession", "Rondo 5v2", 15, "#1f5fc9"], ["Finishing", "2v1 to goal", 20, "#c4471c"], ["Game", "Dutch 4v4", 20, "#14213a"], ["Cool-down", "Reflection", 5, "#8a94a6"]];
    let sum = 0;
    return `${kick("For teams", "Plan the next practice", "Pick from 61 team drills, or build a session around what your team's reviews say it needs.")}
    <div class="iv-card iv-plan" data-in=".35" data-fx="left">
      <div class="iv-plan-h"><b>Tuesday practice</b><small>U12 Girls · 75 min</small></div>
      ${blocks.map(([p, n, m, c], i) => { sum += m; return `<div class="iv-blk" data-in="${(1 + i * .55).toFixed(2)}" data-fx="left"><i style="background:${c}"></i><span><b>${n}</b><small>${p}</small></span><em>${m} min</em></div>`; }).join("")}
      <div class="iv-total"><span class="iv-bar"><i data-fill="1,3.2" data-w="100"></i></span><small><b data-count="1,3.2" data-to="75">0</b> of 75 minutes</small></div>
    </div>`; }
  case "recruit": return `${kick("For recruiting", "Get seen", "Players 16 and over can open their profile to college coaches and approved pro scouts. Youth clubs can find players of any age.")}
    <div class="iv-card iv-prof" data-in=".35" data-fx="left">
      <div class="iv-who"><span class="iv-av" style="background:#c4471c">JT</span><div><b>Jordan T.</b><small>17 · Center back · Class of 2027</small></div></div>
      ${[["College coaches", 1.2], ["Approved pro scouts", 1.7], ["Youth clubs", 2.2]].map(([l, at]) => `<div class="iv-tog"><span>${l}</span><span class="iv-switch" data-on="${at}"><i></i></span></div>`).join("")}
    </div>
    <div class="iv-toast" data-in="3.1" data-fx="down" style="top:22px"><span class="iv-dot"></span><span><b>A college coach is interested</b><small>Division I · Ohio</small></span></div>
    <div class="iv-toast" data-in="4.3" data-fx="down" style="top:78px"><span class="iv-dot blue"></span><span><b>Club invite</b><small>Training session on Saturday</small></span></div>`;
  case "end": return `<div class="iv-center">
      <img src="brand/mark.svg" alt="" class="iv-mark sm" data-in=".2" data-fx="pop">
      <p class="iv-big" data-in=".5">Develop every player.<br><span>Get every player seen.</span></p>
      <p class="iv-tag" data-in="1.3">Coaches · Players · Parents · College coaches · Scouts</p>
      <span class="iv-cta" data-in="2" data-fx="pop">Start your club or join your team today</span>
    </div>`;
  }
  return "";
}

export function introHtml(){
  return `<div class="iv-wrap">
    <div class="iv" data-intro role="region" aria-label="Introduction to NextPass: an animated tour, about ${Math.round(INTRO_DURATION)} seconds, with optional music">
      <div class="iv-stage" aria-hidden="true">
        <div class="iv-bg"></div>
        ${SCENES.map((s, i) => `<section class="iv-scene iv-${s.id}" data-scene="${i}">${sceneHtml(s)}</section>`).join("")}
        <div class="iv-capbar"><span class="iv-prog"><i></i></span><span class="iv-step"></span><span class="iv-captext"></span></div>
      </div>
      <button type="button" class="iv-hit" data-iv="toggle" aria-label="Pause the introduction"></button>
    </div>
    <div class="iv-controls">
      <button type="button" class="btn sm iv-play" data-iv="toggle" aria-label="Pause the introduction"><span class="iv-ico" aria-hidden="true"></span><span class="iv-pl">Pause</span></button>
      <button type="button" class="btn sm iv-snd" data-iv="sound" aria-pressed="false"><span class="iv-sico" aria-hidden="true"></span>Sound</button>
      <div class="iv-chaps" role="group" aria-label="Jump to a part of the introduction">${SCENES.map((s, i) => s.chap ? `<button type="button" class="iv-chap" data-iv="chap" data-i="${i}">${esc(s.chap)}</button>` : "").join("")}</div>
    </div>
    <details class="iv-text small"><summary>Read the introduction as text</summary><ol>${SCENES.map(s => `<li>${s.chap ? `<b>${esc(s.chap)}.</b> ` : ""}${esc(s.text)}</li>`).join("")}</ol></details>
  </div>`;
}

/* ---------- player ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch(_){ return false; } };
const state = {t:0, playing:true, last:null, raf:null, root:null, visible:true, userPaused:false, sound:false, audio:null};
const JINGLE = "audio/intro-jingle.mp3?v=3";  /* bump when the jingle changes, so browsers fetch the new one */

/* the music only plays after someone turns the sound on. While it plays, the music is the clock and the
   animation follows it. The music is only moved on purpose (sound on, play, chapter, replay), never to chase
   the animation: phones (iPhone above all) stall for a moment on every jump, which made it stutter */
function audioOn(){ return state.sound && state.playing && state.visible && !document.hidden && state.root && state.root.isConnected; }
function syncAudio(){
  const a = state.audio; if(!a) return;
  if(!audioOn()){ if(!a.paused) a.pause(); state.playPending = false; return; }
  if(!a.src) return;                                     /* still loading */
  if(a.paused || a.ended){
    if(state.playPending) return;
    if(state.wantSeek || a.ended || Math.abs(a.currentTime - state.t) > .3){ try { a.currentTime = state.t; } catch(_){} }
    state.wantSeek = false; state.playPending = true;
    const done = () => { state.playPending = false; };
    const pr = a.play(); if(pr && pr.then) pr.then(done, done); else done();
  } else if(state.wantSeek){
    state.wantSeek = false; try { a.currentTime = state.t; } catch(_){}
  }
}
/* while the music is really playing, keep the animation on the music's time */
function followAudio(prevT){
  const a = state.audio;
  if(!a || !audioOn() || a.paused || a.seeking || a.readyState < 3 || state.wantSeek) return;
  if(state.t < prevT){ state.wantSeek = true; return; }  /* the animation looped: start the music again with it */
  const at = a.currentTime;
  if(at < INTRO_DURATION && Math.abs(at - state.t) > .12) state.t = at;
}

function fx(el, p, kind){
  const o = p, m = 1 - p;
  let tr = "";
  if(kind === "pop") tr = `scale(${(.6 + .4 * p).toFixed(3)})`;
  else if(kind === "left") tr = `translateX(${(m * 26).toFixed(1)}px)`;
  else if(kind === "down") tr = `translateY(${(-m * 18).toFixed(1)}px)`;
  else if(kind === "dot"){ el.style.opacity = o.toFixed(3); return; }
  else tr = `translateY(${(m * 14).toFixed(1)}px)`;
  el.style.opacity = o.toFixed(3); el.style.transform = tr;
}

function renderAt(root, t){
  t = ((t % INTRO_DURATION) + INTRO_DURATION) % INTRO_DURATION;
  const idx = SCENES.findIndex(s => t < s.start + s.dur), s = SCENES[idx < 0 ? SCENES.length - 1 : idx], lt = t - s.start;
  root.querySelectorAll(".iv-scene").forEach((sc, i) => {
    const on = SCENES[i] === s;
    sc.style.visibility = on ? "visible" : "hidden";
    if(!on) return;
    sc.style.opacity = Math.min(clamp(lt / .4), clamp((s.dur - lt) / .4)).toFixed(3);
    sc.querySelectorAll("[data-in]").forEach(el => fx(el, ease((lt - parseFloat(el.dataset.in)) / .5), el.dataset.fx));
    sc.querySelectorAll("[data-on]").forEach(el => el.classList.toggle("on", lt >= parseFloat(el.dataset.on)));
    sc.querySelectorAll("[data-draw]").forEach(el => { const [a, d] = el.dataset.draw.split(",").map(Number); el.style.strokeDashoffset = (1 - ease((lt - a) / d)).toFixed(4); });
    sc.querySelectorAll("[data-fill]").forEach(el => { const [a, d] = el.dataset.fill.split(",").map(Number); el.style.width = (ease((lt - a) / d) * parseFloat(el.dataset.w)).toFixed(2) + "%"; });
    sc.querySelectorAll("[data-count]").forEach(el => { const [a, d] = el.dataset.count.split(",").map(Number); el.textContent = Math.round(ease((lt - a) / d) * parseFloat(el.dataset.to)); });
    sc.querySelectorAll("[data-type]").forEach(el => { const a = parseFloat(el.dataset.type), txt = tr(el.dataset.text); el.textContent = txt.slice(0, Math.max(0, Math.floor((lt - a) * 34))); });
    sc.querySelectorAll("[data-blink]").forEach(el => { el.style.opacity = lt < parseFloat(el.dataset.blink) ? 0 : (Math.floor(lt * 2.4) % 2 ? .15 : 1); });
    const d = sc.querySelector(".drill-anim"); if(d){ const dur = animDur(DRILL) || 6; animSeek(d, Math.max(0, lt - .6) % dur); }
  });
  root.querySelector(".iv-step").textContent = `${SCENES.indexOf(s) + 1}/${SCENES.length}`;
  const ct = root.querySelector(".iv-captext"), capT = tr(s.cap); if(ct.textContent !== capT) ct.textContent = capT;
  root.querySelector(".iv-prog i").style.width = (t / INTRO_DURATION * 100).toFixed(2) + "%";
  return SCENES.indexOf(s);
}

function syncControls(wrap, idx){
  const label = state.playing ? "Pause the introduction" : "Play the introduction";
  wrap.querySelectorAll('[data-iv="toggle"]').forEach(b => b.setAttribute("aria-label", label));
  const pl = wrap.querySelector(".iv-pl"); if(pl) pl.textContent = tr(state.playing ? "Pause" : "Play");
  wrap.querySelector(".iv").classList.toggle("paused", !state.playing);
  const sb = wrap.querySelector(".iv-snd"); if(sb){ sb.setAttribute("aria-pressed", String(state.sound)); sb.classList.toggle("on", state.sound); }
  wrap.querySelectorAll(".iv-chap").forEach(b => { if(+b.dataset.i === idx) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
}

function scale(wrap){ const iv = wrap.querySelector(".iv"), st = wrap.querySelector(".iv-stage"); if(iv && st) st.style.transform = `scale(${iv.clientWidth / W})`; }

function loop(now){
  state.raf = null;
  const wrap = state.root; if(!wrap || !wrap.isConnected){ state.root = null; syncAudio(); if(state.audio) state.audio.pause(); return; }
  if(state.playing && state.visible && !document.hidden){
    const prevT = state.t;
    if(state.last != null) state.t = (state.t + Math.min(.1, (now - state.last) / 1000)) % INTRO_DURATION;
    state.last = now; followAudio(prevT);
    const idx = renderAt(wrap, state.t); syncControls(wrap, idx); syncAudio();
    state.raf = requestAnimationFrame(loop);
  } else { state.last = null; syncAudio(); }
}
const kickLoop = () => { if(!state.raf && state.root) state.raf = requestAnimationFrame(loop); };

export function introMount(root = document){
  const wrap = root.querySelector(".iv-wrap"); if(!wrap || wrap.dataset.mounted) return;
  wrap.dataset.mounted = "1"; state.root = wrap;
  /* the phone shows a real drill animation; it is driven by the video's clock, not by itself */
  wrap.querySelectorAll(".drill-anim").forEach(d => { d.removeAttribute("data-act"); d.removeAttribute("role"); d.removeAttribute("tabindex"); d.removeAttribute("title"); d.setAttribute("aria-hidden", "true"); });
  animScan(wrap);
  if(reduced() && !state.userPaused && state.t === 0){ state.playing = false; state.t = 2.9; }
  scale(wrap);
  if("ResizeObserver" in window) new ResizeObserver(() => scale(wrap)).observe(wrap.querySelector(".iv"));
  if("IntersectionObserver" in window) new IntersectionObserver(es => { state.visible = es[0].isIntersecting; kickLoop(); }, {threshold: .2}).observe(wrap.querySelector(".iv"));
  wrap.addEventListener("click", e => {
    const b = e.target.closest("[data-iv]"); if(!b) return;
    if(b.dataset.iv === "toggle"){ state.playing = !state.playing; state.userPaused = !state.playing; state.wantSeek = true; }
    if(b.dataset.iv === "chap"){ state.t = SCENES[+b.dataset.i].start + .01; state.wantSeek = true; }
    if(b.dataset.iv === "sound"){
      state.sound = !state.sound;
      if(state.sound){
        if(!state.audio){
          /* loaded as a blob so it can jump to any moment, whatever the server */
          state.audio = new Audio();
          fetch(JINGLE).then(r => r.blob()).then(bl => { state.audio.src = URL.createObjectURL(bl); syncAudio(); }).catch(() => { state.audio.src = JINGLE; syncAudio(); });
        }
        state.playing = true; state.userPaused = false; state.wantSeek = true;
      }
    }
    state.last = null;
    syncControls(wrap, renderAt(wrap, state.t)); syncAudio(); kickLoop();
  });
  syncControls(wrap, renderAt(wrap, state.t));
  kickLoop();
}
document.addEventListener("visibilitychange", () => { state.last = null; syncAudio(); kickLoop(); });

/* for exporting the video file and for tests: draw one exact moment */
export function introSeek(t){ const wrap = state.root; if(!wrap) return; state.playing = false; state.t = t; state.wantSeek = true; syncControls(wrap, renderAt(wrap, t)); syncAudio(); }
if(typeof window !== "undefined"){ window.__introSeek = introSeek; window.__introState = state; }
