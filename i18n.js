/* NextPass language switch (English / Spanish).
   The app writes its pages in English. When Spanish is on, this module loads
   i18n/es.json and swaps visible text for its Spanish version as pages are drawn:
   - "d": whole strings, English -> Spanish
   - "p": sentence templates with {0}, {1}... for names and numbers
   Only text that is in the dictionary changes, so names, notes and messages that
   people type stay exactly as written. Mark anything that must never change with
   translate="no". */

const KEY = "np-lang";
export const LANG = (() => { try { return localStorage.getItem(KEY) === "es" ? "es" : "en"; } catch(_){ return "en"; } })();
/* locale for dates and times */
export const LOC = LANG === "es" ? "es" : undefined;

let DICT = null, PATS = [], INDEX = new Map(), LEAD = [];
const cache = new Map();
const norm = s => s.replace(/\s+/g, " ").trim();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function compile(pairs){
  pairs.forEach(([en, es]) => {
    const parts = en.split(/\{(\d)\}/);           /* literal, idx, literal, idx, ... */
    let src = "^", order = [], lit = "";
    for(let i = 0; i < parts.length; i++){
      if(i % 2 === 0){ src += reEsc(parts[i]); lit += parts[i]; }
      else { src += "(.*?)"; order.push(Number(parts[i])); }
    }
    if(lit.replace(/[^A-Za-z]/g, "").length < 3) return;
    const p = {re: new RegExp(src + "$"), order, es, weight: lit.length};
    const w = (lit.toLowerCase().match(/[a-z']{3,}/) || [])[0];
    PATS.push(p);
    if(w){ if(!INDEX.has(w)) INDEX.set(w, []); INDEX.get(w).push(p); } else LEAD.push(p);
  });
  INDEX.forEach(list => list.sort((a, b) => b.weight - a.weight));
}

function lookup(k, depth = 0){
  if(DICT.has(k)) return DICT.get(k);
  if(depth > 4) return null;
  /* sentence templates */
  const words = new Set(k.toLowerCase().match(/[a-z']{3,}/g) || []);
  let cands = [];
  words.forEach(w => { const l = INDEX.get(w); if(l) cands = cands.concat(l); });
  if(cands.length) cands = cands.concat(LEAD).sort((a, b) => b.weight - a.weight);
  for(const p of cands){
    const m = p.re.exec(k);
    if(!m) continue;
    const vals = {}, raw = {};
    p.order.forEach((n, i) => { const v = m[i + 1]; raw[n] = v;
      const t = /[A-Za-z]/.test(v) ? lookup(v.trim(), depth + 1) : null;
      vals[n] = t == null ? v : v.match(/^\s*/)[0] + t + v.match(/\s*$/)[0]; });
    /* {0} inserts a value; {0|one|many} picks a word by whether value 0 is 1 */
    return p.es.replace(/\{(\d)(?:\|([^|}]*)\|([^}]*))?\}/g, (_, n, one, many) =>
      one !== undefined ? (String(raw[n]).trim() === "1" ? one : many) : (vals[n] != null ? vals[n] : ""));
  }
  /* lists joined by separators: "A · B", "CB – Center Back", "Warm-up → Rondo", "a; b" */
  for(const sep of [" · ", " – ", " → ", "; ", ", "]){
    if(!k.includes(sep)) continue;
    const parts = k.split(sep), tp = parts.map(x => x.trim() ? lookup(x.trim(), depth + 1) : null);
    /* a comma list only counts when every item translates, so a sentence is never half done */
    if(sep === ", " ? tp.every((x, i) => x != null || !/[A-Za-z]/.test(parts[i])) : tp.some(x => x != null)) return parts.map((x, i) => tp[i] ?? x).join(sep);
  }
  /* “quoted text” */
  let q = /^([“"«])(.+)([”"»])$/.exec(k);
  if(q){ const t = lookup(q[2], depth + 1); if(t != null) return "“" + t + "”"; }
  /* "(inside)" */
  let m = /^\((.+)\)([.,]?)$/.exec(k);
  if(m){ const t = lookup(m[1], depth + 1); if(t != null) return "(" + t + ")" + m[2]; }
  /* trailing numbers, arrows or punctuation: "Defending 2 → 3 ▲", "Contacted 1", "For clubs →" */
  m = /^(.*?[A-Za-z].*?)(\s*[^A-Za-z]+)$/.exec(k);
  if(m && m[1]){ const t = lookup(m[1], depth + 1); if(t != null) return t + m[2]; }
  /* a leading separator: "· 12 (3 teams of 4)", ": 2 teams, $39.98 a month." */
  m = /^([·•–—:,]\s*)(.+)$/.exec(k);
  if(m){ const t = lookup(m[2], depth + 1); if(t != null) return m[1] + t; }
  /* a leading symbol or number: "✓ Saved", ": $199 a month…", "/ 5 overall" */
  m = /^([^A-Za-z]{1,8}?\s*)([A-Za-z].*)$/.exec(k);
  if(m){ const t = lookup(m[2], depth + 1); if(t != null) return m[1] + t; }
  /* sentence by sentence */
  if(/[.!?] [A-Z]/.test(k)){
    const parts = k.split(/(?<=[.!?]) (?=[A-Z])/), tp = parts.map(x => lookup(x, depth + 1));
    if(tp.some(x => x != null)) return parts.map((x, i) => tp[i] ?? x).join(" ");
  }
  return null;
}

/* translate one string (keeps surrounding spaces); unknown text comes back unchanged */
export function tr(s){
  if(!DICT || s == null) return s;
  const str = String(s);
  if(!/[A-Za-z]/.test(str)) return str;
  const key = norm(str);
  let out = cache.get(key);
  if(out === undefined){ out = lookup(key); cache.set(key, out); }
  if(out == null) return str;
  return str.match(/^\s*/)[0] + out + str.match(/\s*$/)[0];
}

const ATTRS = ["placeholder", "aria-label", "title", "alt", "data-text"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "NOSCRIPT"]);
function skipped(el){
  for(let e = el; e && e.nodeType === 1; e = e.parentElement){
    if(SKIP.has(e.tagName) || e.getAttribute("translate") === "no") return true;
  }
  return false;
}
/* test aid: with localStorage "np-i18n-shadow" = "1" the page stays in English and
   window.__npMiss collects visible text the dictionary can't translate */
const SHADOW = (() => { try { return localStorage.getItem("np-i18n-shadow") === "1"; } catch(_){ return false; } })();
function miss(v){ const k = norm(v); if(k && /[a-z]{3}/.test(k) && tr(v) === v){ window.__npMiss = window.__npMiss || {}; window.__npMiss[k] = (window.__npMiss[k] || 0) + 1; } }
function doText(n){
  const v = n.nodeValue;
  if(!v || !/[A-Za-z]/.test(v) || skipped(n.parentElement)) return;
  if(SHADOW){ miss(v); return; }
  const t = tr(v);
  if(t !== v) n.nodeValue = t;
}
function doAttrs(el){
  for(const a of ATTRS){
    const v = el.getAttribute && el.getAttribute(a);
    if(SHADOW){ if(v && /[A-Za-z]/.test(v)) miss(v); continue; }
    if(v && /[A-Za-z]/.test(v)){ const t = tr(v); if(t !== v) el.setAttribute(a, t); }
  }
  if(el.tagName === "INPUT" && (el.type === "button" || el.type === "submit") && el.value){ const t = tr(el.value); if(t !== el.value) el.value = t; }
}
function walk(root){
  if(root.nodeType === 3){ doText(root); return; }
  if(root.nodeType !== 1 || skipped(root)) return;
  doAttrs(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => n.nodeType === 1 && (SKIP.has(n.tagName) || n.getAttribute("translate") === "no") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
  for(let n = it.nextNode(); n; n = it.nextNode()){ if(n.nodeType === 3) doText(n); else doAttrs(n); }
}
function translateTitle(){ if(SHADOW) return; const t = tr(document.title); if(t !== document.title) document.title = t; }

function start(){
  walk(document.body); translateTitle();
  new MutationObserver(list => {
    for(const m of list){
      if(m.type === "childList") m.addedNodes.forEach(walk);
      else if(m.type === "characterData") doText(m.target);
      else if(m.type === "attributes") doAttrs(m.target);
    }
  }).observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS.concat(["value"])});
  new MutationObserver(translateTitle).observe(document.querySelector("title"), {childList:true, characterData:true, subtree:true});
}
function reveal(){ document.documentElement.classList.remove("i18n-wait"); }

export function setLang(l){
  try { localStorage.setItem(KEY, l === "es" ? "es" : "en"); } catch(_){}
  location.reload();
}
/* the button that switches language, written in its own language */
export const langToggle = (cls = "") => LANG === "es"
  ? `<button type="button" class="lang-btn ${cls}" data-act="setLang" data-id="en" lang="en" translate="no" aria-label="Switch to English">English</button>`
  : `<button type="button" class="lang-btn ${cls}" data-act="setLang" data-id="es" lang="es" translate="no" aria-label="Cambiar a español">Español</button>`;

window.npT = s => SHADOW ? s : tr(s);
if(LANG === "es" || SHADOW){
  if(!SHADOW) document.documentElement.lang = "es";
  setTimeout(reveal, 2500);
  fetch("i18n/es.json?v=" + (document.documentElement.dataset.i18nv || "1")).then(r => r.json()).then(j => {
    DICT = new Map(Object.entries(j.d || {}));
    compile(j.p || []);
    const go = () => { start(); reveal(); };
    if(document.body) go(); else document.addEventListener("DOMContentLoaded", go);
  }).catch(reveal);
}
