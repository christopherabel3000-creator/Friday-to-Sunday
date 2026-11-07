// Friday to Sunday: names you choose (Milestone 4). Any school, high school or college, any college
// conference and any bowl can be renamed. The game itself ships only made-up names; the names you type
// are yours, kept on this device and in your saves, and can be copied out as a list and loaded back
// in, to share or to move to another device.
"use strict";

/* ---------- The names ---------- */
// NAMES: { s: { id: { t: name, m: mascot, a: abbreviation } }, c: { id: name }, b: { bowl's own name: name },
// l: { league, bowl, A, P } } (the pro league's name, its championship game and its two conferences).
// School and conference ids follow the shape of the state and the college world (c0 is always the
// first program in the first power conference, d1s1 the first 1A school in District 1), so a list
// works in any career.
const NAMES_KEY = "friday-to-sunday-names", NAME_LEN = 40;
let NAMES = { s: {}, c: {}, b: {}, l: {} };
const LEAGUE_PARTS = { league: "Sunday League", bowl: "Sunday Bowl", A: "Atlantic", P: "Pacific" };
// A scoreboard abbreviation: letters, numbers and &, up to five, in capitals
const ABBR_LEN = 5;
const cleanAbbr = v => String(v == null ? "" : v).toUpperCase().replace(/[^A-Z0-9&]/g, "").slice(0, ABBR_LEN);
const cleanNameText = v => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_LEN);
const namesEmpty = n => !n || ["s", "c", "b", "l"].every(k => !Object.keys(n[k] || {}).length);
function normNames(n) {
  const out = { s: {}, c: {}, b: {}, l: {} };
  if (!n || typeof n !== "object") return out;
  for (const id in n.s || {}) { const x = n.s[id] || {}, t = cleanNameText(x.t), m = cleanNameText(x.m), a = cleanAbbr(x.a); if (t || m || a) out.s[id] = Object.assign(t ? { t } : {}, m ? { m } : {}, a ? { a } : {}); }
  for (const id in n.c || {}) { const t = cleanNameText(n.c[id]); if (t) out.c[id] = t; }
  for (const id in n.b || {}) { const t = cleanNameText(n.b[id]); if (t) out.b[id] = t; }
  for (const k in n.l || {}) { const t = cleanNameText(n.l[k]); if (t && k in LEAGUE_PARTS) out.l[k] = t; }
  return out;
}
function loadNames() { try { const n = JSON.parse(localStorage.getItem(NAMES_KEY) || "null"); if (n) NAMES = normNames(n); } catch (e) { /* no names yet */ } }
function storeNames() { try { localStorage.setItem(NAMES_KEY, JSON.stringify(NAMES)); } catch (e) { /* best-effort */ } }
// A save brings its names to the device: all of them to a device with none of its own, and otherwise
// whatever the device doesn't have yet (a name you've typed on the device stays)
function adoptNames(n) {
  if (namesEmpty(n)) return;
  if (namesEmpty(NAMES)) { NAMES = normNames(n); storeNames(); return; }
  const x = normNames(n);
  let added = 0;
  for (const id in x.s) { const own = NAMES.s[id] || {}; for (const k in x.s[id]) if (!own[k]) { own[k] = x.s[id][k]; added++; } NAMES.s[id] = own; }
  ["c", "b", "l"].forEach(k => { for (const id in x[k]) if (!NAMES[k][id]) { NAMES[k][id] = x[k][id]; added++; } });
  if (added) storeNames();
}

/* ---------- Applying them ---------- */
// Each school and conference keeps its own name (town0, mascot0, name0) the first time it's renamed,
// so a name can always go back
function nameSchool(s) {
  if (!s || !s.id) return;
  const x = NAMES.s[s.id];
  if (s.town0 == null && x) { s.town0 = s.town; s.mascot0 = s.mascot; }
  if (s.town0 == null) return;
  if (s.abbr0 == null) s.abbr0 = s.abbr;
  s.town = (x && x.t) || s.town0; s.mascot = (x && x.m) || s.mascot0;
  // The abbreviation you gave it, or one made from its new name, or its own
  s.abbr = (x && x.a) || (x && x.t ? schoolAbbr(x.t) : s.abbr0);
}
function nameConf(c) {
  if (!c) return;
  const x = NAMES.c[c.id];
  // A pro division goes by its conference's name ("Atlantic North") unless you've named it
  if (c.cls === "PRO" && c.cf) { const own = c.name0 != null ? c.name0 : c.name; c.name0 = own; c.name = x || `${PRO_CONF_SHORT[c.cf]} ${own.split(" ").pop()}`; return; }
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
// The pro league's own names, and the conference and round names that come from them (pworld.js)
const leagueName = k => NAMES.l[k] || LEAGUE_PARTS[k];
function nameLeague() {
  PRO_LEAGUE = `the ${leagueName("league")}`;
  PRO_BOWL = leagueName("bowl");
  PRO_ROUND_NAMES[4] = PRO_BOWL;
  PRO_CONF_IDS.forEach(cf => { PRO_CONF_SHORT[cf] = leagueName(cf); PRO_CONF_NAMES[cf] = `${leagueName(cf)} Conference`; });
}
function nameAll() {
  nameLeague();
  [SEASON, OTHER, THIRD].forEach(nameWorld);
  if (typeof COLLEGE_CACHE !== "undefined") COLLEGE_CACHE = null;
}

/* ---------- Renaming ---------- */
// An empty name (or the school's own) goes back to the school's own name
function renameSchool(id, part, v) {
  const t = cleanNameText(v), s = (SEASON && SEASON.schools[id]) || (OTHER && OTHER.schools[id]) || (THIRD && THIRD.schools[id]);
  if (!s || !["t", "m", "a"].includes(part)) return false;
  const own = part === "t" ? (s.town0 != null ? s.town0 : s.town) : part === "m" ? (s.mascot0 != null ? s.mascot0 : s.mascot) : (s.abbr0 != null ? s.abbr0 : s.abbr);
  const x = Object.assign({}, NAMES.s[id]), val = part === "a" ? cleanAbbr(v) : t;
  if (!val || val === own) delete x[part]; else x[part] = val;
  if (Object.keys(x).length) NAMES.s[id] = x; else delete NAMES.s[id];
  nameSchool(s);
  if (typeof COLLEGE_CACHE !== "undefined") COLLEGE_CACHE = null;
  storeNames();
  return true;
}
// A college conference or a pro division
function renameConf(id, v) {
  const t = cleanNameText(v);
  let c = null;
  [SEASON, OTHER, THIRD].forEach(W => { if (W && !c) c = (W.confs || []).find(x => x.id === id); });
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
// The league's name, its championship game, a conference
function renameLeague(k, v) {
  const t = cleanNameText(v);
  if (!(k in LEAGUE_PARTS)) return false;
  if (!t || t === LEAGUE_PARTS[k]) delete NAMES.l[k]; else NAMES.l[k] = t;
  nameAll();
  storeNames();
  return true;
}
const allBowls = () => CFP_SITES.concat(BOWLS.map(b => `${b} Bowl`).filter(b => !CFP_SITES.includes(b)));
function resetNames() {
  NAMES = { s: {}, c: {}, b: {}, l: {} };
  storeNames();
  nameAll();
}

/* ---------- The list ---------- */
// One name to a line:
//   school c12: Lakeshore State / Panthers / LSU   (the abbreviation is optional)
//   conference k3: Heartland Conference
//   bowl Lone Pine Bowl: Granite Bowl
//   league bowl: Championship Sunday
function namesText() {
  const out = [];
  for (const id in NAMES.s) { const x = NAMES.s[id]; out.push(`school ${id}: ${x.t || ""} / ${x.m || ""}${x.a ? ` / ${x.a}` : ""}`); }
  for (const id in NAMES.c) out.push(`conference ${id}: ${NAMES.c[id]}`);
  for (const b in NAMES.b) out.push(`bowl ${b}: ${NAMES.b[b]}`);
  for (const k in NAMES.l) out.push(`league ${k}: ${NAMES.l[k]}`);
  return out.join("\n");
}
// Loads a list (adding to the names you have). Returns how many names it read.
function loadNamesText(text) {
  const n = { s: Object.assign({}, NAMES.s), c: Object.assign({}, NAMES.c), b: Object.assign({}, NAMES.b), l: Object.assign({}, NAMES.l) };
  let k = 0;
  String(text || "").split(/\r?\n/).forEach(line => {
    let m = line.match(/^\s*school\s+([A-Za-z0-9]+)\s*:\s*(.*?)\s*\/\s*(.*?)\s*(?:\/\s*([^/]*?)\s*)?$/i);
    if (m) { const t = cleanNameText(m[2]), ms = cleanNameText(m[3]), a = cleanAbbr(m[4]); if (t || ms || a) { n.s[m[1]] = Object.assign({}, n.s[m[1]], t ? { t } : {}, ms ? { m: ms } : {}, a ? { a } : {}); k++; } return; }
    m = line.match(/^\s*conference\s+([A-Za-z0-9]+)\s*:\s*(.+?)\s*$/i);
    if (m) { const t = cleanNameText(m[2]); if (t) { n.c[m[1]] = t; k++; } return; }
    m = line.match(/^\s*league\s+(league|bowl|A|P)\s*:\s*(.+?)\s*$/);
    if (m) { const t = cleanNameText(m[2]); if (t) { n.l[m[1]] = t; k++; } return; }
    m = line.match(/^\s*bowl\s+(.+?)\s*:\s*(.+?)\s*$/i);
    if (m && allBowls().includes(m[1])) { const t = cleanNameText(m[2]); if (t) { n.b[m[1]] = t; k++; } }
  });
  if (k) { NAMES = normNames(n); storeNames(); nameAll(); }
  return k;
}
const namesCount = () => ["s", "c", "b", "l"].reduce((t, k) => t + Object.keys(NAMES[k]).length, 0);
