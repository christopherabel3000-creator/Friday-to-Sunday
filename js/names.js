// Friday to Sunday: names you choose (Milestone 4). Any school, high school or college, any college
// conference and any bowl can be renamed. The game itself ships only made-up names; the names you type
// are yours, kept on this device and in your saves, and can be copied out as a list and loaded back
// in, to share or to move to another device.
"use strict";

/* ---------- The names ---------- */
// NAMES: { s: { id: { t: name, m: mascot } }, c: { id: name }, b: { bowl's own name: name } }.
// School and conference ids follow the shape of the state and the college world (c0 is always the
// first program in the first power conference, d1s1 the first 1A school in District 1), so a list
// works in any career.
const NAMES_KEY = "friday-to-sunday-names", NAME_LEN = 40;
let NAMES = { s: {}, c: {}, b: {} };
const cleanNameText = v => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_LEN);
const namesEmpty = n => !n || (!Object.keys(n.s || {}).length && !Object.keys(n.c || {}).length && !Object.keys(n.b || {}).length);
function normNames(n) {
  const out = { s: {}, c: {}, b: {} };
  if (!n || typeof n !== "object") return out;
  for (const id in n.s || {}) { const x = n.s[id] || {}, t = cleanNameText(x.t), m = cleanNameText(x.m); if (t || m) out.s[id] = Object.assign(t ? { t } : {}, m ? { m } : {}); }
  for (const id in n.c || {}) { const t = cleanNameText(n.c[id]); if (t) out.c[id] = t; }
  for (const id in n.b || {}) { const t = cleanNameText(n.b[id]); if (t) out.b[id] = t; }
  return out;
}
function loadNames() { try { const n = JSON.parse(localStorage.getItem(NAMES_KEY) || "null"); if (n) NAMES = normNames(n); } catch (e) { /* no names yet */ } }
function storeNames() { try { localStorage.setItem(NAMES_KEY, JSON.stringify(NAMES)); } catch (e) { /* best-effort */ } }
// A save brings its names to a device that has none of its own
function adoptNames(n) { if (namesEmpty(NAMES) && !namesEmpty(n)) { NAMES = normNames(n); storeNames(); } }

/* ---------- Applying them ---------- */
// Each school and conference keeps its own name (town0, mascot0, name0) the first time it's renamed,
// so a name can always go back
function nameSchool(s) {
  if (!s || !s.id) return;
  const x = NAMES.s[s.id];
  if (s.town0 == null && x) { s.town0 = s.town; s.mascot0 = s.mascot; }
  if (s.town0 == null) return;
  s.town = (x && x.t) || s.town0; s.mascot = (x && x.m) || s.mascot0;
}
function nameConf(c) {
  if (!c) return;
  const x = NAMES.c[c.id];
  if (c.name0 == null && x) c.name0 = c.name;
  if (c.name0 != null) c.name = x || c.name0;
}
// A bowl by its own name, as you've named it
const bowlAs = b => (b && NAMES.b[b]) || b;
function nameWorld(se) {
  if (!se || !se.schools) return;
  for (const id in se.schools) nameSchool(se.schools[id]);
  (se.confs || []).forEach(nameConf);
  (se.weeks || []).forEach(wk => wk.games.forEach(gm => { if (gm.bowl) { if (!gm.b0) gm.b0 = gm.bowl; gm.bowl = bowlAs(gm.b0); } }));
}
function nameAll() {
  [SEASON, OTHER].forEach(nameWorld);
  if (typeof COLLEGE_CACHE !== "undefined") COLLEGE_CACHE = null;
}

/* ---------- Renaming ---------- */
// An empty name (or the school's own) goes back to the school's own name
function renameSchool(id, part, v) {
  const t = cleanNameText(v), s = (SEASON && SEASON.schools[id]) || (OTHER && OTHER.schools[id]);
  if (!s || (part !== "t" && part !== "m")) return false;
  const own = part === "t" ? (s.town0 != null ? s.town0 : s.town) : (s.mascot0 != null ? s.mascot0 : s.mascot);
  const x = Object.assign({}, NAMES.s[id]);
  if (!t || t === own) delete x[part]; else x[part] = t;
  if (Object.keys(x).length) NAMES.s[id] = x; else delete NAMES.s[id];
  nameSchool(s);
  if (typeof COLLEGE_CACHE !== "undefined") COLLEGE_CACHE = null;
  storeNames();
  return true;
}
function renameConf(id, v) {
  const W = colWorld(), c = W && W.confs.find(x => x.id === id), t = cleanNameText(v);
  if (!c) return false;
  if (!t || t === (c.name0 != null ? c.name0 : c.name)) delete NAMES.c[id]; else NAMES.c[id] = t;
  nameConf(c);
  storeNames();
  return true;
}
function renameBowl(b, v) {
  const t = cleanNameText(v);
  if (!allBowls().includes(b)) return false;
  if (!t || t === b) delete NAMES.b[b]; else NAMES.b[b] = t;
  const W = colWorld();
  if (W) (W.weeks || []).forEach(wk => wk.games.forEach(gm => { if (gm.bowl && (gm.b0 || gm.bowl) === b) { gm.b0 = b; gm.bowl = bowlAs(b); } }));
  storeNames();
  return true;
}
const allBowls = () => CFP_SITES.concat(BOWLS.map(b => `${b} Bowl`).filter(b => !CFP_SITES.includes(b)));
function resetNames() {
  NAMES = { s: {}, c: {}, b: {} };
  storeNames();
  nameAll();
}

/* ---------- The list ---------- */
// One name to a line:
//   school c12: Lakeshore State / Panthers
//   conference k3: Heartland Conference
//   bowl Lone Pine Bowl: Granite Bowl
function namesText() {
  const out = [];
  for (const id in NAMES.s) { const x = NAMES.s[id]; out.push(`school ${id}: ${x.t || ""} / ${x.m || ""}`); }
  for (const id in NAMES.c) out.push(`conference ${id}: ${NAMES.c[id]}`);
  for (const b in NAMES.b) out.push(`bowl ${b}: ${NAMES.b[b]}`);
  return out.join("\n");
}
// Loads a list (adding to the names you have). Returns how many names it read.
function loadNamesText(text) {
  const n = { s: Object.assign({}, NAMES.s), c: Object.assign({}, NAMES.c), b: Object.assign({}, NAMES.b) };
  let k = 0;
  String(text || "").split(/\r?\n/).forEach(line => {
    let m = line.match(/^\s*school\s+([A-Za-z0-9]+)\s*:\s*(.*?)\s*\/\s*(.*?)\s*$/i);
    if (m) { const t = cleanNameText(m[2]), ms = cleanNameText(m[3]); if (t || ms) { n.s[m[1]] = Object.assign({}, n.s[m[1]], t ? { t } : {}, ms ? { m: ms } : {}); k++; } return; }
    m = line.match(/^\s*conference\s+([A-Za-z0-9]+)\s*:\s*(.+?)\s*$/i);
    if (m) { const t = cleanNameText(m[2]); if (t) { n.c[m[1]] = t; k++; } return; }
    m = line.match(/^\s*bowl\s+(.+?)\s*:\s*(.+?)\s*$/i);
    if (m && allBowls().includes(m[1])) { const t = cleanNameText(m[2]); if (t) { n.b[m[1]] = t; k++; } }
  });
  if (k) { NAMES = normNames(n); storeNames(); nameAll(); }
  return k;
}
const namesCount = () => Object.keys(NAMES.s).length + Object.keys(NAMES.c).length + Object.keys(NAMES.b).length;
