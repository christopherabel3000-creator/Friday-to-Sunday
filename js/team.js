// Friday to Sunday: schools, depth charts and who is on the field
"use strict";

/* ---------- Schools ---------- */
// The average ability of a junior at a school of each class (more classes come with later milestones)
const CLASS_LEVEL = { "1A": 37 };
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
    enroll: g.i(80, 190), coach: genCoach(g, opts.cls), players: genRoster(g, id, level) };
  s.abbr = schoolAbbr(town, opts.otherAbbr);
  s.off = s.coach.off_style; s.def = s.coach.def_style;
  s.depth = autoDepth(s);
  return s;
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
// first, and a player starts at only one position per side (many start on both sides).
function autoDepth(team) {
  const ps = team.players.filter(p => !p.inj), d = {};
  const bonus = (p, pos) => p.pos === pos ? 4 : p.pos2 === pos ? 2 : -2;
  [OFF_POS, DEF_POS].forEach(side => {
    side.forEach(pos => { d[pos] = []; });
    const taken = new Set(), cands = [];
    // The quarterback comes first: the best one plays there, even if he'd also be a good tight end
    if (side === OFF_POS) { const qv = p => ovr(p, "QB") + (p.pos === "QB" ? 1 : 0), qb = ps.slice().sort((a, b) => qv(b) - qv(a))[0]; if (qb) { d.QB.push(qb.id); taken.add(qb.id); } }
    ps.forEach(p => side.forEach(pos => cands.push({ p, pos, v: ovr(p, pos) + bonus(p, pos) })));
    cands.sort((a, b) => b.v - a.v);
    cands.forEach(c => { if (!taken.has(c.p.id) && d[c.pos].length < DEPTH_SIZE[c.pos]) { d[c.pos].push(c.p.id); taken.add(c.p.id); } });
    // Anyone left over backs up wherever he fits best (a depth chart never runs dry)
    side.forEach(pos => { if (d[pos].length < DEPTH_SIZE[pos]) ps.filter(p => !d[pos].includes(p.id)).sort((a, b) => ovr(b, pos) - ovr(a, pos)).slice(0, DEPTH_SIZE[pos] - d[pos].length).forEach(p => d[pos].push(p.id)); });
  });
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
  return m.get(id);
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
