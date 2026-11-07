// Friday to Sunday: schools, depth charts and who is on the field
"use strict";

/* ---------- Schools ---------- */
// The state's six classes, smallest to largest. Each class has its enrollment range, its usual roster
// size, and level: the average ability of a junior there. Bigger schools have more players to choose
// from, so their starters are better on top of the higher level.
const CLASSES = ["1A", "2A", "3A", "4A", "5A", "6A"];
const CLASS_INFO = {
  "1A": { enroll: [80, 190], roster: 30, level: 37 },
  "2A": { enroll: [190, 400], roster: 38, level: 38 },
  "3A": { enroll: [400, 750], roster: 46, level: 40 },
  "4A": { enroll: [750, 1200], roster: 56, level: 42 },
  "5A": { enroll: [1200, 1900], roster: 68, level: 44 },
  "6A": { enroll: [1900, 3200], roster: 85, level: 46 },
  // College (Milestone 4): Division III, Division II, the FCS, the rest of FBS and the power
  // conferences. Rosters of up to 105, and nobody plays both ways.
  D3: { enroll: [900, 4000], roster: 95, level: 38 },
  D2: { enroll: [2000, 9000], roster: 95, level: 43 },
  FCS: { enroll: [4000, 20000], roster: 100, level: 47 },
  G5: { enroll: [10000, 35000], roster: 105, level: 51 },
  P4: { enroll: [20000, 55000], roster: 105, level: 57 },
  // The pros (Milestone 5): 53 players on the roster, and nobody plays both ways
  PRO: { enroll: [0, 0], roster: 53, level: 59 }
};
const COL_CLASSES = ["D3", "D2", "FCS", "G5", "P4"];
// The roster limit since the 2025 House settlement
const COL_ROSTER_MAX = 105;
const isCollege = cls => COL_CLASSES.includes(cls);
const isPro = cls => cls === "PRO";
// College and pro players are specialists: one side of the ball
const specialists = cls => isCollege(cls) || isPro(cls);
const PRO_ROSTER = 53;
const CLASS_LEVEL = {};
CLASSES.concat(COL_CLASSES, ["PRO"]).forEach(c => { CLASS_LEVEL[c] = CLASS_INFO[c].level; });
// How many times a 1A school's numbers a class's rosters and freshman classes are
const classScale = cls => (CLASS_INFO[cls] || CLASS_INFO["1A"]).roster / 30;
// (college levels rank above 6A: Division III is 3 and the power conferences 7, for styles and facilities)
const classIndex = cls => CLASSES.includes(cls) ? CLASSES.indexOf(cls) : isCollege(cls) ? 3 + COL_CLASSES.indexOf(cls) : isPro(cls) ? 8 : 0;
function townName(g, taken) {
  for (let i = 0; i < 50; i++) {
    const t = g.f() < .55 ? g.pick(TOWN_FIRST) + g.pick(TOWN_LAST) : g.pick(TOWNS);
    if (!taken.has(t)) { taken.add(t); return t; }
  }
  return "Union " + g.i(2, 99);
}
// Three-letter scoreboard abbreviation: "Pine Hollow" is PHO, "Harlan" is HAR
function schoolAbbr(town, other) {
  const words = town.toUpperCase().replace(/[^A-Z ]/g, "").split(" ").filter(Boolean);
  let a = words.length > 1 ? (words[0][0] + words[words.length - 1].slice(0, 2)) : words[0].slice(0, 3);
  if (other && a === other) a = (words.length > 1 ? words[0].slice(0, 2) + words[words.length - 1][0] : words[0].slice(0, 2) + words[0][words[0].length - 1]);
  return a;
}
// A school. opts: id, cls, mascot, and optionally town, color ([hex, name, family]) and trad
// (tradition, 1 to 100). Given those, everything else comes from g alone, so a school can be rebuilt
// from its seed: genSchool(dice(seed), opts).
function genSchool(g, opts) {
  // Programs with a winning tradition tend to have a little more talent
  const trad = opts.trad != null ? opts.trad : clamp(Math.round(g.n(45, 18)), 5, 95);
  const level = CLASS_LEVEL[opts.cls] + (opts.boost || 0) + Math.round((trad - 50) * .06 + g.n(0, 2.5));
  const town = opts.town || townName(g, opts.towns), id = opts.id;
  const col = opts.color || g.pick(SCHOOL_COLORS.filter(c => !opts.colorsTaken || !opts.colorsTaken.has(c[2])));
  if (opts.colorsTaken) opts.colorsTaken.add(col[2]);
  const s = { id, town, mascot: opts.mascot, cls: opts.cls, level, trad, color: col[0], colorName: col[1],
    enroll: g.i(...CLASS_INFO[opts.cls].enroll), coach: genCoach(g, opts.cls), players: genRoster(g, id, level, opts.cls) };
  s.abbr = schoolAbbr(town, opts.otherAbbr);
  s.off = s.coach.off_style; s.def = s.coach.def_style;
  s.depth = autoDepth(s);
  s.mastery = genMastery(g, s.off, s.def);
  return s;
}
// The playbook a school knows: about four plays on each side of the ball, the core of its schemes,
// and a little of everything else (engine.js: playbook mastery)
const CORE_PLAYS = { bal: ["ir", "or", "sp", "pa"], air: ["sp", "ms", "dp", "sc"], gnp: ["ir", "or", "dr", "pa"], wc: ["sc", "sp", "ms", "ir"] };
const CORE_CALLS = { bal: ["ba", "ma", "zo", "c3"], blz: ["rb", "ab", "zb", "ma"], nfz: ["zo", "c3", "ma", "pr"], rs: ["rb", "ba", "c3", "zb"] };
// Plays that can be installed: the playbook plus the special plays (kicks, kneels and spikes are always known)
const INSTALL_IDS = ["ir", "or", "dr", "sc", "sp", "ms", "dp", "pa", "qs", "hm", "te", "rb", "ba", "ma", "zo", "c3", "pr", "ab", "zb"];
function genMastery(g, off, def) {
  const core = new Set((CORE_PLAYS[off] || CORE_PLAYS.bal).concat(CORE_CALLS[def] || CORE_CALLS.bal)), m = {};
  INSTALL_IDS.forEach(id => { m[id] = clamp(Math.round(core.has(id) ? g.n(72, 6) : g.n(32, 9)), 8, 90); });
  // The sneak is simple, the Hail Mary gets a little practice, and the tackle-eligible trick is rare
  m.qs = clamp(Math.round(g.n(66, 8)), 30, 90); m.hm = clamp(Math.round(g.n(44, 8)), 15, 70); m.te = clamp(Math.round(g.n(26, 7)), 8, 55);
  return m;
}
const schoolName = s => `${s.town} ${s.mascot}`;
// How a school's tradition reads
const tradWord = t => t >= 80 ? "a proud winning tradition" : t >= 62 ? "a winning tradition" : t >= 40 ? "a middle-of-the-pack program" : t >= 22 ? "a losing tradition" : "years of losing";

/* ---------- Depth chart ---------- */
// How many players each position lists. The first ones start; the rest are the backups in order.
const DEPTH_SIZE = { QB: 2, RB: 3, WR: 5, TE: 2, OL: 7, DL: 6, LB: 4, CB: 4, S: 3, K: 1, P: 1, KR: 2, PR: 2 };
const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, OL: 5, DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1, KR: 1, PR: 1 };
const DEPTH_GROUPS = [["Offense", OFF_POS], ["Defense", DEF_POS], ["Special teams", ["K", "P", "KR", "PR"]]];
const SLOT_NAMES = { KR: "kick returner", PR: "punt returner" };
const slotName = pos => SLOT_NAMES[pos] || posName(pos);
const SLOT_GROUPS = { KR: "Kick returners", PR: "Punt returners" };
const slotGroup = pos => SLOT_GROUPS[pos] || POS_INFO[pos].group;
// A player's rating for a depth chart slot
const slotRating = (p, pos) => pos === "KR" || pos === "PR" ? retRating(p) : ovr(p, pos);
// Builds the whole depth chart from the ratings. On each side of the ball, the best fits are placed
// first, and a player starts at only one position per side. A player who would start on both sides
// then counts the two-way gap less on the side that isn't his main position's, so he starts both ways
// only when he's that much better than whoever would play just that side. The gap is 5 points at 1A
// and grows with the roster, so most small-school starters still go both ways and almost nobody does
// at the biggest schools.
const TWO_WAY_GAP = 5;
const posSide = pos => OFF_POS.includes(pos) ? "off" : DEF_POS.includes(pos) ? "def" : "";
// away: what playing out of position costs (college players are specialists, so it costs more there)
function depthSide(ps, side, d, pen, away) {
  side.forEach(pos => { d[pos] = []; });
  const taken = new Set(), cands = [];
  const bonus = (p, pos) => p.pos === pos ? 4 : p.pos2 === pos ? 2 : (away || -2);
  // The quarterback comes first: the best one plays there, even if he'd also be a good tight end
  // In college only players listed at a position compete for it (anyone fills in if it runs short)
  const spec = (away || 0) <= -10, fits = (p, pos) => !spec || p.pos === pos || p.pos2 === pos;
  if (side === OFF_POS) { const qv = p => ovr(p, "QB") + (p.pos === "QB" ? 1 : 0), qb = ps.filter(p => fits(p, "QB")).sort((a, b) => qv(b) - qv(a))[0]; if (qb) { d.QB.push(qb.id); taken.add(qb.id); } }
  ps.forEach(p => side.forEach(pos => { if (fits(p, pos)) cands.push({ p, pos, v: ovr(p, pos) + bonus(p, pos) - pen(p) }); }));
  cands.sort((a, b) => b.v - a.v);
  cands.forEach(c => { if (!taken.has(c.p.id) && d[c.pos].length < DEPTH_SIZE[c.pos]) { d[c.pos].push(c.p.id); taken.add(c.p.id); } });
  // Anyone left over backs up wherever he fits best (a depth chart never runs dry)
  // (in college, players from this side of the ball first, so nobody ends up starting both ways)
  const mine = p => !spec || side.includes(p.pos) || side.includes(p.pos2) ? 1 : 0;
  side.forEach(pos => { if (d[pos].length < DEPTH_SIZE[pos]) { const o = new Map(ps.map(p => [p, ovr(p, pos) + 100 * mine(p)])); ps.filter(p => !d[pos].includes(p.id)).sort((a, b) => o.get(b) - o.get(a)).slice(0, DEPTH_SIZE[pos] - d[pos].length).forEach(p => d[pos].push(p.id)); } });
}
function autoDepth(team) {
  const ps = team.players.filter(p => !p.inj), d = {}, none = () => 0, away = specialists(team.cls) ? -15 : -2;
  depthSide(ps, OFF_POS, d, none, away); depthSide(ps, DEF_POS, d, none, away);
  const starts = side => { const out = new Set(); side.forEach(pos => d[pos].slice(0, STARTERS[pos]).forEach(id => out.add(id))); return out; };
  const so = starts(OFF_POS), sd = starts(DEF_POS), two = new Set([...so].filter(id => sd.has(id)));
  if (two.size) {
    // (college: nobody plays both ways)
    const gap = specialists(team.cls) ? 99 : TWO_WAY_GAP * classScale(team.cls || "1A");
    depthSide(ps, OFF_POS, d, p => two.has(p.id) && posSide(p.pos) === "def" ? gap : 0, away);
    depthSide(ps, DEF_POS, d, p => two.has(p.id) && posSide(p.pos) !== "def" ? gap : 0, away);
  }
  ["K", "P", "KR", "PR"].forEach(pos => {
    d[pos] = ps.slice().sort((a, b) => slotRating(b, pos) + (b.pos === pos ? 4 : 0) - slotRating(a, pos) - (a.pos === pos ? 4 : 0))
      // The starting quarterback doesn't return kicks
      .filter(p => !((pos === "KR" || pos === "PR") && d.QB[0] === p.id)).slice(0, DEPTH_SIZE[pos]).map(p => p.id);
  });
  return d;
}
// Looking players up by id, through a map built once per roster
const ROSTER_MAPS = new WeakMap();
function playerById(team, id) {
  let m = ROSTER_MAPS.get(team.players);
  if (!m || m.size !== team.players.length) { m = new Map(team.players.map(p => [p.id, p])); ROSTER_MAPS.set(team.players, m); }
  // (a pro team's practice squad, for its roster screens)
  return m.get(id) || (Array.isArray(team.ps) ? team.ps.find(p => p.id === id) : undefined);
}
// Where a player is on the depth chart: { starts: [slots], backs: [slots] }
function depthRoles(team, p) {
  const starts = [], backs = [];
  Object.keys(DEPTH_SIZE).forEach(pos => {
    const i = (team.depth[pos] || []).indexOf(p.id);
    if (i < 0) return;
    (i < STARTERS[pos] ? starts : backs).push(pos);
  });
  return { starts, backs };
}
// The players listed at a slot, in depth order, with anyone resting (fatigue.js) moved to the back
function depthOrder(team, pos) {
  const listed = (team.depth[pos] || []).map(id => playerById(team, id)).filter(p => p && !p.inj);
  return listed.some(p => p.rest) ? listed.filter(p => !p.rest).concat(listed.filter(p => p.rest)) : listed;
}
// Everyone not listed at a slot, best first: who fills in when the list runs out
function fillIns(team, pos, skip) {
  return team.players.filter(p => !p.inj && !skip.has(p.id)).sort((a, b) => (a.rest ? 1 : 0) - (b.rest ? 1 : 0) || slotRating(b, pos) - slotRating(a, pos));
}
// The listed players, then everyone else who could fill in
function depthList(team, pos) {
  const listed = depthOrder(team, pos);
  return listed.concat(fillIns(team, pos, new Set(listed.map(p => p.id))));
}

/* ---------- Who is on the field ---------- */
// Players each personnel package needs, filled in this order (so a player listed at two spots on
// the same side plays the first one)
const PKG_NEEDS = {
  p10: [["QB", 1], ["OL", 5], ["RB", 1], ["WR", 4]],
  p11: [["QB", 1], ["OL", 5], ["RB", 1], ["TE", 1], ["WR", 3]],
  p12: [["QB", 1], ["OL", 5], ["RB", 1], ["TE", 2], ["WR", 2]],
  p21: [["QB", 1], ["OL", 5], ["RB", 2], ["TE", 1], ["WR", 2]],
  p13: [["QB", 1], ["OL", 5], ["RB", 1], ["TE", 3], ["WR", 1]],
  jumbo: [["QB", 1], ["OL", 6], ["RB", 1], ["TE", 3]],
  punt: [["P", 1], ["OL", 5], ["TE", 2], ["WR", 2], ["LB", 1]],
  fgu: [["K", 1], ["OL", 5], ["TE", 2], ["QB", 1], ["WR", 2]],
  base: [["DL", 4], ["LB", 3], ["CB", 2], ["S", 2]],
  nickel: [["DL", 4], ["LB", 2], ["CB", 3], ["S", 2]],
  dime: [["DL", 4], ["LB", 1], ["CB", 4], ["S", 2]],
  goal: [["DL", 6], ["LB", 3], ["CB", 1], ["S", 1]]
};
// { QB: [player], OL: [...], ... } for a team in a package
function lineupFor(team, pk) {
  const need = PKG_NEEDS[pk] || PKG_NEEDS.p11, used = new Set(), out = {};
  need.forEach(([pos, n]) => {
    out[pos] = [];
    const take = list => { for (const p of list) { if (out[pos].length >= n) break; if (!used.has(p.id)) { out[pos].push(p); used.add(p.id); } } };
    take(depthOrder(team, pos));
    if (out[pos].length < n) take(fillIns(team, pos, used));
  });
  return out;
}
const starterAt = (team, pos) => depthOrder(team, pos)[0] || fillIns(team, pos, new Set())[0];
const lineupPlayers = lu => Object.values(lu).flat();

/* ---------- Unit ratings ---------- */
// The average of a rating across a group of players (with optional weights per rating)
function unitAvg(players, w) {
  if (!players || !players.length) return 30;
  return avg(players.map(p => { let v = 0, tw = 0; for (const a in w) { v += w[a] * p.r[a]; tw += w[a]; } return v / tw; }));
}
// What the pregame report and the depth chart screen show: each unit's strength in its base looks
function unitRatings(team) {
  const o = lineupFor(team, "p11"), d = lineupFor(team, "base"), nk = lineupFor(team, "nickel");
  return {
    runBlock: Math.round(unitAvg(o.OL, { rbk: .8, str: .2 }) * .8 + unitAvg(o.TE, { blk: .8, str: .2 }) * .2),
    passPro: Math.round(unitAvg(o.OL, { pbk: .85, awr: .15 })),
    qb: ovr(o.QB[0], "QB"),
    rb: ovr(o.RB[0], "RB"),
    wr: Math.round(avg(o.WR.concat(o.TE).map(p => ovr(p, p === o.TE[0] ? "TE" : "WR")))),
    runD: Math.round(unitAvg(d.DL, { rst: .7, str: .3 }) * .65 + unitAvg(d.LB, { tkl: .6, str: .2, awr: .2 }) * .35),
    passRush: Math.round(unitAvg(d.DL, { prs: .8, spd: .2 })),
    cover: Math.round(unitAvg(nk.CB.concat(nk.S), { cov: .7, spd: .3 })),
    k: ovr(starterAt(team, "K"), "K"), p: ovr(starterAt(team, "P"), "P")
  };
}
// Average overall of the 11 starters on a side, at the positions they start
function sideRating(team, side) {
  const lu = lineupFor(team, side === "off" ? "p11" : "base");
  const list = [];
  for (const pos in lu) lu[pos].forEach(p => list.push(ovr(p, pos)));
  return Math.round(avg(list));
}
// Players who start on both sides of the ball
function twoWayStarters(team) {
  const o = new Set(lineupPlayers(lineupFor(team, "p11")).map(p => p.id));
  return lineupPlayers(lineupFor(team, "base")).filter(p => o.has(p.id));
}
