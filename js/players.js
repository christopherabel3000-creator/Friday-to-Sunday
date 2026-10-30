// Friday to Sunday: players, their ratings, and how they read aloud
"use strict";

/* ---------- Ratings ---------- */
// Every rating runs from 1 to 100 on one scale for every level, so moving up feels real
const ATTRS = ["spd", "str", "awr", "acc", "arm", "elu", "bsc", "hnd", "rte", "blk", "rbk", "pbk", "prs", "rst", "tkl", "cov", "leg", "kac"];
const ATTR_NAMES = { spd: "Speed", str: "Strength", awr: "Awareness", acc: "Accuracy", arm: "Arm", elu: "Elusiveness", bsc: "Ball security", hnd: "Hands",
  rte: "Route running", blk: "Blocking", rbk: "Run blocking", pbk: "Pass blocking", prs: "Pass rush", rst: "Run stopping", tkl: "Tackling", cov: "Coverage",
  leg: "Leg", kac: "Kick accuracy" };
// How a strength reads in a player's one-line summary
const ATTR_PRAISE = { spd: "fast", str: "strong", awr: "smart", acc: "accurate", arm: "strong arm", elu: "elusive", bsc: "rarely fumbles", hnd: "sure hands",
  rte: "crisp routes", blk: "good blocker", rbk: "road grader", pbk: "good pass protector", prs: "gets after the quarterback", rst: "stout against the run",
  tkl: "sure tackler", cov: "sticky in coverage", leg: "big leg", kac: "accurate kicker" };

/* ---------- Positions ---------- */
const POS_IDS = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"];
const OFF_POS = ["QB", "RB", "WR", "TE", "OL"], DEF_POS = ["DL", "LB", "CB", "S"];
// skills: the two ratings shown for the position. w: how the overall rating is mixed.
const POS_INFO = {
  QB: { name: "quarterback", group: "Quarterbacks", skills: ["acc", "arm"], w: { acc: .45, arm: .27, awr: .16, spd: .08, str: .04 } },
  RB: { name: "running back", group: "Running backs", skills: ["elu", "bsc"], w: { elu: .28, spd: .3, bsc: .14, str: .16, awr: .12 } },
  WR: { name: "receiver", group: "Receivers", skills: ["hnd", "rte"], w: { hnd: .26, rte: .28, spd: .34, awr: .12 } },
  TE: { name: "tight end", group: "Tight ends", skills: ["hnd", "blk"], w: { hnd: .24, blk: .3, str: .2, spd: .14, awr: .12 } },
  OL: { name: "offensive lineman", group: "Offensive line", skills: ["rbk", "pbk"], w: { rbk: .34, pbk: .34, str: .22, awr: .1 } },
  DL: { name: "defensive lineman", group: "Defensive line", skills: ["prs", "rst"], w: { prs: .28, rst: .3, str: .24, spd: .1, awr: .08 } },
  LB: { name: "linebacker", group: "Linebackers", skills: ["tkl", "cov"], w: { tkl: .3, cov: .14, str: .16, spd: .2, awr: .2 } },
  CB: { name: "cornerback", group: "Cornerbacks", skills: ["cov", "tkl"], w: { cov: .4, spd: .34, tkl: .1, awr: .16 } },
  S: { name: "safety", group: "Safeties", skills: ["cov", "tkl"], w: { cov: .3, tkl: .26, spd: .24, awr: .2 } },
  K: { name: "kicker", group: "Kickers", skills: ["leg", "kac"], w: { leg: .55, kac: .45 } },
  P: { name: "punter", group: "Punters", skills: ["leg", "kac"], w: { leg: .65, kac: .35 } }
};
const YEAR_NAMES = { 9: "freshman", 10: "sophomore", 11: "junior", 12: "senior" };
// A player's overall rating at a position
function ovr(p, pos) {
  const w = POS_INFO[pos].w; let v = 0;
  for (const a in w) v += w[a] * p.r[a];
  return Math.round(v);
}
// Kick and punt returners: speed and moves, and hanging on to the ball
const retRating = p => Math.round(.5 * p.r.spd + .3 * p.r.elu + .2 * p.r.bsc);
const fullName = p => `${p.first} ${p.last}`;
const posName = pos => POS_INFO[pos] ? POS_INFO[pos].name : pos;

/* ---------- Generation ---------- */
// How common each skill is: a player's ratings start from his general ability, minus this
const ATTR_BASE = { spd: 0, str: 0, awr: 0, acc: -18, arm: -13, elu: -6, bsc: -4, hnd: -6, rte: -8, blk: -8, rbk: -10, pbk: -10, prs: -8, rst: -6, tkl: -4, cov: -6, leg: -22, kac: -22 };
// Body types and the skills that come with them. pref: the positions this kind of player is
// usually put at, as a bonus when the depth chart is built.
const ARCHETYPES = {
  passer: { add: { acc: 14, arm: 11, awr: 6, str: -3, elu: -2, hnd: -3, rte: -6, cov: -2, tkl: -4 }, pref: { QB: 8, S: 1, LB: 0 } },
  // A dual threat: a little less of a passer, a lot more of a runner
  dual: { add: { acc: 9, arm: 8, awr: 4, spd: 9, elu: 8, bsc: 3, str: -2, hnd: -3, rte: -5, cov: -2, tkl: -3 }, pref: { QB: 8, S: 2, RB: 1 } },
  runner: { add: { elu: 10, spd: 6, bsc: 6, str: 3, hnd: -2, rte: -4, cov: -3, tkl: 1 }, pref: { RB: 6, LB: 2, S: 2, CB: 0 } },
  speed: { add: { spd: 10, hnd: 6, rte: 6, cov: 3, elu: 3, tkl: -4, str: -6 }, pref: { WR: 6, CB: 4, S: 0 } },
  bigath: { add: { str: 6, blk: 8, hnd: 4, tkl: 3, rst: 3, rbk: 3, spd: -3 }, pref: { TE: 6, LB: 2, DL: 2 } },
  lineman: { add: { str: 10, rbk: 8, pbk: 7, prs: 5, rst: 7, spd: -16, elu: -22, hnd: -18, rte: -25, cov: -25, acc: -20, arm: -12, tkl: 0 }, pref: { OL: 5, DL: 5 } },
  backer: { add: { tkl: 10, str: 5, awr: 4, rst: 5, spd: 1, cov: 1, elu: -3 }, pref: { LB: 6, RB: 1, TE: 1, S: 1 } },
  dback: { add: { cov: 10, spd: 6, tkl: 3, hnd: 2, rte: -3, str: -6 }, pref: { CB: 5, S: 5, WR: 1 } },
  kicker: { add: { leg: 25, kac: 24, str: -8, tkl: -14, spd: -4, rbk: -14, pbk: -14, prs: -14, rst: -14, acc: -8, arm: -4 }, pref: { K: 12, P: 10 } }
};
// Roster recipe for a small school: about 30 players, most of them playing both ways
const ROSTER_1A = [["passer", 1], ["dual", 1], ["runner", 3], ["speed", 5], ["bigath", 3], ["lineman", 10], ["backer", 3], ["dback", 4], ["kicker", 1]];
const YEAR_MEAN = { 9: -10, 10: -5, 11: 0, 12: 4 };
// level: the average ability of a junior at this kind of school
function genPlayer(g, opts) {
  const yr = opts.yr, arch = ARCHETYPES[opts.arch], t = g.n(opts.level + YEAR_MEAN[yr], 8);
  const r = {};
  ATTRS.forEach(a => { r[a] = clamp(Math.round(t + ATTR_BASE[a] + (arch.add[a] || 0) + g.n(0, 5)), 1, 99); });
  const girlKicker = opts.arch === "kicker" && g.f() < .12;
  const p = { id: opts.id, first: girlKicker ? g.pick(FIRST_NAMES_K) : g.pick(FIRST_NAMES), last: opts.last, yr, arch: opts.arch, r,
    eth: clamp(Math.round(g.n(52, 15)), 5, 99), sta: clamp(Math.round(g.n(opts.arch === "lineman" ? 46 : 54, 12)), 10, 99), hlt: clamp(Math.round(g.n(62, 14)), 10, 99) };
  setPositions(p);
  // Potential: how good the player can become. The true number stays hidden.
  const room = { 9: g.n(16, 7), 10: g.n(12, 6), 11: g.n(7, 5), 12: g.n(3, 3) }[yr];
  p.pot = clamp(Math.round(ovr(p, p.pos) + Math.max(0, room)), 1, 99);
  // The staff's estimate is right most of the time
  const band = potBand(p.pot), miss = g.f();
  p.potSeen = clamp(band + (miss < .08 ? -1 : miss > .92 ? 1 : 0), 0, 3);
  return p;
}
// The main position is the best fit for this body type; the second is the best one on the other
// side of the ball (or kicking for a kicker)
function setPositions(p) {
  const pref = ARCHETYPES[p.arch].pref, fit = pos => ovr(p, pos) + (pref[pos] || -6);
  const best = list => list.slice().sort((a, b) => fit(b) - fit(a))[0];
  if (p.arch === "kicker") { p.pos = fit("K") >= fit("P") ? "K" : "P"; p.pos2 = p.pos === "K" ? "P" : "K"; return; }
  const o = best(OFF_POS), d = best(DEF_POS);
  if (fit(o) >= fit(d)) { p.pos = o; p.pos2 = d; } else { p.pos = d; p.pos2 = o; }
}
const POT_BANDS = ["low", "average", "high", "elite"];
const potBand = pot => pot < 40 ? 0 : pot < 50 ? 1 : pot < 60 ? 2 : 3;
// Jersey numbers by position, the way most teams hand them out
function jerseyFor(g, pos, used) {
  const ranges = { QB: [[1, 19]], RB: [[20, 49]], WR: [[1, 19], [80, 89]], TE: [[80, 89], [40, 49]], OL: [[50, 79]], DL: [[50, 79], [90, 99]], LB: [[40, 59]], CB: [[1, 49]],
    S: [[1, 49]], K: [[1, 19]], P: [[1, 19]] }[pos];
  for (let tries = 0; tries < 60; tries++) { const [a, b] = g.pick(ranges); const n = g.i(a, b); if (!used.has(n)) { used.add(n); return n; } }
  for (let n = 1; n < 100; n++) if (!used.has(n)) { used.add(n); return n; }
  return 0;
}
function genRoster(g, schoolId, level) {
  const lasts = g.shuffle(LAST_NAMES), archs = [], players = [];
  const recipe = ROSTER_1A.map(([a, n]) => [a, n]);
  // Not every small school has a full roster: drop a few players at random
  for (let drop = g.i(0, 4); drop > 0; drop--) { const k = g.pick(recipe.filter(x => x[1] > (x[0] === "lineman" ? 8 : 1) && !["kicker", "passer", "dual"].includes(x[0]))); if (k) k[1]--; }
  recipe.forEach(([arch, n]) => { for (let i = 0; i < n; i++) archs.push(arch); });
  const used = new Set();
  archs.forEach((arch, i) => {
    // The kid who's been groomed to play quarterback is usually an upperclassman
    const yr = +g.w(arch === "passer" ? { 9: 8, 10: 20, 11: 34, 12: 38 } : { 9: 22, 10: 24, 11: 27, 12: 27 });
    const p = genPlayer(g, { id: `${schoolId}p${i + 1}`, arch, yr, level, last: lasts[i] });
    p.num = jerseyFor(g, p.pos, used);
    players.push(p);
  });
  return players;
}

/* ---------- Reading a player aloud ---------- */
// The ratings worth praising for the positions this player plays, best first
function strengths(p, level) {
  const keys = new Set(["spd", "str", "awr"]);
  [p.pos, p.pos2].forEach(pos => { if (pos && POS_INFO[pos]) POS_INFO[pos].skills.forEach(a => keys.add(a)); });
  if (p.pos === "K" || p.pos === "P") ["spd", "str", "awr"].forEach(a => keys.delete(a));
  const bar = (level || 37) + 15;
  return [...keys].filter(a => p.r[a] >= bar && !(a === "spd" && (p.pos === "OL" || p.pos === "DL") && p.r[a] < bar + 8))
    .sort((a, b) => p.r[b] - p.r[a]).slice(0, 2);
}
// "Marcus Hill, junior. Running back 46, linebacker 39. Fast, sure hands. High potential."
function playerLine(p, level, opts) {
  opts = opts || {};
  const posPart = [p.pos, p.pos2].filter(Boolean).map((pos, i) => `${i ? posName(pos) : capFirst(posName(pos))} ${ovr(p, pos)}`).join(", ");
  const st = strengths(p, level).map(a => ATTR_PRAISE[a]);
  const bits = [`${fullName(p)}, ${YEAR_NAMES[p.yr]}.`, `${posPart}.`];
  if (st.length) bits.push(`${capFirst(st.join(", "))}.`);
  if (!opts.noPot) bits.push(`${capFirst(POT_BANDS[p.potSeen])} potential.`);
  if (p.inj) bits.push("Injured.");
  return bits.join(" ");
}
