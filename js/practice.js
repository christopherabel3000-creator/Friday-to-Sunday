// Friday to Sunday: practice. The week's plan, players getting better, installing plays, conditioning
// and recovery, practice injuries, and opponent prep: film study of the next opponent.
"use strict";

/* ---------- The plan ---------- */
// Ten blocks a week: five days, two blocks a day. Each area gets a weight (none, light, normal or
// heavy), and the blocks are shared out by weight, so giving one area more time takes it from the rest.
const PRACTICE_BLOCKS = 10;
const PRACTICE_AREAS = [
  ["qb", "Quarterbacks"], ["skill", "Running backs and receivers"], ["ol", "Offensive line"], ["front", "Defensive front"],
  ["secondary", "Secondary"], ["kick", "Kickers"], ["install", "Install"], ["prep", "Opponent prep"], ["cond", "Conditioning"], ["rec", "Recovery"]
];
const AREA_IDS = PRACTICE_AREAS.map(a => a[0]);
const AREA_NAMES = Object.fromEntries(PRACTICE_AREAS);
const INTENSITY = ["None", "Light", "Normal", "Heavy"]; // the weights 0 to 3
// Contact: more hitting grows players a little faster, wears them down for game day, and hurts more of them
const CONTACT = {
  shorts: { name: "Shorts", grow: .85, risk: .3, wear: .25, desc: "Helmets only, no hitting. Slower growth, almost no injuries, fresh legs on game day." },
  shells: { name: "Shells", grow: 1, risk: 1, wear: .55, desc: "Helmets and shoulder pads, some hitting. The usual week." },
  pads: { name: "Full pads", grow: 1.12, risk: 2.1, wear: .9, desc: "Full contact. A little faster growth, but more injuries and tired legs on Friday." }
};
const CONTACT_IDS = ["shorts", "shells", "pads"];
const PRESETS = {
  balanced: { name: "Balanced", areas: { qb: 1, skill: 1, ol: 1, front: 1, secondary: 1, kick: 1, install: 2, prep: 2, cond: 1, rec: 1 }, contact: "shells" },
  install: { name: "Install", areas: { qb: 1, skill: 1, ol: 1, front: 1, secondary: 1, kick: 1, install: 3, prep: 1, cond: 0, rec: 1 }, contact: "shells" },
  gameprep: { name: "Game prep", areas: { qb: 1, skill: 1, ol: 1, front: 1, secondary: 1, kick: 1, install: 1, prep: 3, cond: 0, rec: 2 }, contact: "shells" },
  rest: { name: "Rest", areas: { qb: 1, skill: 1, ol: 1, front: 1, secondary: 1, kick: 1, install: 1, prep: 1, cond: 0, rec: 3 }, contact: "shorts" }
};
const PRESET_IDS = ["balanced", "install", "gameprep", "rest"];
// Every school starts with a balanced week, and the computer's schools keep it all season
const newPlan = () => ({ areas: clone(PRESETS.balanced.areas), contact: "shells", focus: [] });
const CPU_PLAN = newPlan();
// Blocks per area for a plan (a plan with nothing in it is a week of rest)
function blocksOf(plan) {
  const w = plan.areas, tot = AREA_IDS.reduce((s, a) => s + (w[a] || 0), 0), out = {};
  AREA_IDS.forEach(a => { out[a] = tot ? PRACTICE_BLOCKS * (w[a] || 0) / tot : (a === "rec" ? PRACTICE_BLOCKS : 0); });
  return out;
}
const presetOf = plan => PRESET_IDS.find(id => AREA_IDS.every(a => (PRESETS[id].areas[a] || 0) === (plan.areas[a] || 0))) || null;
// More blocks help, with diminishing returns
const effBlocks = b => b > 0 ? Math.pow(b, .75) : 0;
// Blocks spent on the field: fundamentals and conditioning (install and film are walk-throughs and meetings)
const physBlocks = b => ["qb", "skill", "ol", "front", "secondary", "kick", "cond"].reduce((s, a) => s + b[a], 0);
// Opponent prep: no report, a light one, a full one, or the works
const prepLevelOf = b => b <= 0 ? 0 : b < 1.25 ? 1 : b < 2.4 ? 2 : 3;
// A coach with Scouting 45 or better gets one level more out of the same film time
const SCOUT_SHARP = 45;
const prepLevelFor = (b, coach) => { const l = prepLevelOf(b); return l && coach && coach.sct >= SCOUT_SHARP ? Math.min(3, l + 1) : l; };
// How fresh the team is at kickoff, in percent of full energy
const freshOf = (b, contact) => clamp(Math.round(100 - physBlocks(b) * (CONTACT[contact] || CONTACT.shells).wear + 3 * b.rec), 86, 100);

/* ---------- Getting better ---------- */
// Fundamentals: the positions each unit works with, and the ratings it trains at each (with weights)
const UNITS = {
  qb: { QB: { acc: 1, arm: .6, awr: .8 } },
  skill: { RB: { elu: 1, bsc: .8, spd: .25 }, WR: { hnd: 1, rte: 1, spd: .25 }, TE: { hnd: .8, blk: 1, str: .3 } },
  ol: { OL: { rbk: 1, pbk: 1, str: .5, awr: .3 } },
  front: { DL: { prs: 1, rst: 1, str: .5 }, LB: { tkl: 1, cov: .6, awr: .4 } },
  secondary: { CB: { cov: 1, tkl: .5, spd: .2 }, S: { cov: 1, tkl: .7, awr: .3 } },
  kick: { K: { leg: .8, kac: 1 }, P: { leg: 1, kac: .8 } }
};
// About 4 points a season in a unit's main skills on a balanced week, for a player with room to grow
// (tests/season.js checks a season's growth)
const GROW_RATE = .3;
const YEAR_GROW = { 9: 1.15, 10: 1.08, 11: 1, 12: .9 };
const ethMul = p => .6 + .8 * (p.eth || 50) / 100;
// The coach's Development rating: 1 at a typical small-school coach's 42
const devMul = c => clamp(1 + (((c && c.dev) || 42) - 42) * .012, .6, 1.5);
// The players a unit works with: anyone who plays one of its positions (his own two, or a spot where
// the depth chart has him starting or first off the bench), with the ratings to train and the position
// his growth is measured at. Injured players sit out.
function unitPlayers(s, unit) {
  const u = UNITS[unit], out = [];
  s.players.forEach(p => {
    if (p.inj) return;
    const at = Object.keys(u).filter(pos => p.pos === pos || p.pos2 === pos || (s.depth[pos] || []).indexOf(p.id) >= 0 && (s.depth[pos] || []).indexOf(p.id) <= STARTERS[pos]);
    if (!at.length) return;
    const attrs = {};
    at.forEach(pos => { for (const a in u[pos]) attrs[a] = Math.max(attrs[a] || 0, u[pos][a]); });
    out.push([p, attrs, at.sort((a, b) => ovr(p, b) - ovr(p, a))[0]]);
  });
  return out;
}
// Nobody grows past his potential: growth slows over the last few points before it
const roomMul = (p, pos) => clamp((p.pot - ovr(p, pos)) / 4, 0, 1);
// Grows a player's ratings. Progress builds up between practices (p.gx) and a rating goes up a point
// at a time. Notes what changed in rep.
function growPlayer(p, attrs, pos, amount, rng, rep) {
  p.gx = p.gx || {};
  for (const a in attrs) {
    const room = roomMul(p, pos);
    if (room <= 0) continue;
    // Everyone starts partway to his next point, so improvement shows from the first week
    if (p.gx[a] == null) p.gx[a] = rng();
    p.gx[a] += amount * attrs[a] * room * (.5 + rng());
    while (p.gx[a] >= 1 && p.r[a] < 99) {
      p.gx[a] -= 1;
      if (rep) { const g = rep.grew[p.id] || (rep.grew[p.id] = {}); if (!g[a]) g[a] = [p.r[a], p.r[a]]; g[a][1] = p.r[a] + 1; }
      p.r[a]++;
    }
    // (kept to three places, so saves stay small)
    p.gx[a] = Math.round(p.gx[a] * 1000) / 1000;
  }
}
// Stamina is kept with the ratings it trains alongside, but it isn't one of the 18 ratings
function condition(p, amount, rng, rep) {
  p.gx = p.gx || {};
  if (p.gx.sta == null) p.gx.sta = rng();
  p.gx.sta += amount * (.5 + rng());
  while (p.gx.sta >= 1 && p.sta < 99) {
    p.gx.sta -= 1;
    if (rep) { const g = rep.grew[p.id] || (rep.grew[p.id] = {}); if (!g.sta) g.sta = [p.sta, p.sta]; g.sta[1] = p.sta + 1; }
    p.sta++;
  }
  p.gx.sta = Math.round(p.gx.sta * 1000) / 1000;
}

/* ---------- Installing plays ---------- */
// Install time raises mastery: up to three focus plays share most of it, and the rest of the
// playbook gets a little. With no focus, it's spread across everything, so the least-known plays
// gain the most. Smart teams (awareness) and good teachers (Development) learn faster.
const INSTALL_RATE = 20;
function learnMul(s) {
  const lu = lineupPlayers(lineupFor(s, "p11")).concat(lineupPlayers(lineupFor(s, "base")));
  return clamp(1 + (avg(lu.map(p => p.r.awr)) - 40) * .015, .7, 1.4) * devMul(s.coach);
}
function installPlays(s, blocks, focus, rep) {
  const m = s.mastery, pts = INSTALL_RATE * effBlocks(blocks) * learnMul(s);
  if (!m || pts <= 0) return;
  const ids = INSTALL_IDS.filter(id => m[id] != null), foc = (focus || []).filter(id => ids.includes(id)).slice(0, 3), rest = ids.filter(id => !foc.includes(id));
  const share = id => foc.length ? (foc.includes(id) ? .7 / foc.length : .3 / Math.max(1, rest.length)) : 1 / ids.length;
  ids.forEach(id => {
    const before = m[id];
    m[id] = Math.round(Math.min(100, m[id] + pts * share(id) * (1 - m[id] / 100)) * 100) / 100;
    if (rep && Math.round(m[id]) > Math.round(before)) rep.mastery.push([id, Math.round(before), Math.round(m[id])]);
  });
}

/* ---------- Injuries ---------- */
// Weeks out, as [share, games missed after this one]: most practice injuries cost one game
const PRACTICE_INJ = [[.6, 0], [.28, 1], [.1, 2], [.02, 4]];
const GAME_INJ = [[.45, 0], [.27, 1], [.15, 2], [.09, 4], [.04, 99]];
function injuryLength(table, rng) {
  let x = rng();
  for (const [share, w] of table) { if (x < share) return w === 2 ? 2 + (rng() < .5 ? 1 : 0) : w === 4 ? 4 + Math.floor(rng() * 3) : w; x -= share; }
  return 0;
}
// A player with poor health gets hurt more (1 at a health of 60)
const healthMul = p => clamp(1.6 - (p.hlt || 60) / 100, .6, 1.4);
// About one injury every three weeks in shells, at the usual amount of work. Recovery time cuts it.
const PRACTICE_RISK = .006;
function practiceInjuries(s, b, contact, rng, rep) {
  const recMul = 1 - .25 * Math.min(1, b.rec / 2), work = physBlocks(b) / 6, c = CONTACT[contact] || CONTACT.shells;
  s.players.forEach(p => {
    if (p.inj || rng() >= PRACTICE_RISK * c.risk * work * recMul * healthMul(p)) return;
    p.inj = { w: injuryLength(PRACTICE_INJ, rng), at: "practice" };
    if (rep) rep.hurt.push(p.id);
  });
}
// The end of a week: everyone who missed a game is a game closer to coming back. Recovery time
// sometimes gets a player back a week early.
function healSchool(s, recBlocks, rng) {
  const back = [];
  s.players.forEach(p => {
    if (!p.inj) return;
    if (p.inj.w <= 0) { delete p.inj; back.push(p.id); return; }
    if (p.inj.w >= 50) return;
    p.inj.w -= 1 + (rng() < .35 * Math.min(1, (recBlocks || 0) / 3) ? 1 : 0);
    if (p.inj.w < 0) { delete p.inj; back.push(p.id); }
  });
  return back;
}
// "out this week", "out this week and next", "out about 4 weeks", "out for the season"
function injText(inj) {
  if (!inj) return "";
  if (inj.w >= 50) return "out for the season";
  if (inj.w <= 0) return "out this week";
  if (inj.w === 1) return "out this week and next";
  return `out about ${inj.w + 1} weeks`;
}
// The same, looking ahead from the end of a week
function injTextNext(inj) {
  if (!inj) return "";
  if (inj.w >= 50) return "out for the season";
  if (inj.w <= 0) return "out next week";
  if (inj.w === 1) return "out the next two weeks";
  return `out about ${inj.w + 1} weeks`;
}

/* ---------- A week of practice ---------- */
// Runs a week of practice for a school with a plan. rng: Math.random for real practices, or a seeded
// generator for schools rebuilt on paper (opts.noInjuries). Returns the practice report.
function practiceSchool(s, plan, rng, opts) {
  opts = opts || {};
  const b = blocksOf(plan), c = CONTACT[plan.contact] || CONTACT.shells, dev = devMul(s.coach);
  const rep = { blocks: b, contact: plan.contact, grew: {}, mastery: [], hurt: [], fresh: freshOf(b, plan.contact), prep: prepLevelFor(b.prep, s.coach) };
  const before = {};
  s.players.forEach(p => { before[p.id] = {}; POS_IDS.forEach(pos => { before[p.id][pos] = ovr(p, pos); }); });
  // Fundamentals, unit by unit
  for (const unit in UNITS) {
    const eff = effBlocks(b[unit]);
    if (!eff) continue;
    // A coach's background can speed up one unit (a former quarterback's quarterbacks, say)
    const bg = (s.coach && s.coach.grow && s.coach.grow[unit]) || 1;
    unitPlayers(s, unit).forEach(([p, attrs, pos]) => growPlayer(p, attrs, pos, GROW_RATE * eff * ethMul(p) * dev * c.grow * bg * (YEAR_GROW[p.yr] || 1), rng, rep));
  }
  // Conditioning: stamina, and a little strength and speed
  const ce = effBlocks(b.cond);
  if (ce) s.players.forEach(p => { if (p.inj) return; condition(p, .35 * ce * ethMul(p), rng, rep); growPlayer(p, { str: .12, spd: .06 }, p.pos, GROW_RATE * ce * ethMul(p) * dev, rng, rep); });
  installPlays(s, b.install, plan.focus, rep);
  if (!opts.noInjuries) practiceInjuries(s, b, plan.contact, rng, rep);
  // Overall ratings that went up, for the report: at his own position, and wherever he starts
  rep.ovr = [];
  s.players.forEach(p => {
    const starts = depthRoles(s, p).starts.filter(pos => POS_INFO[pos]), at = [p.pos].concat(starts.filter(pos => pos !== p.pos));
    at.forEach(pos => { const was = before[p.id][pos], v = ovr(p, pos); if (v > was) rep.ovr.push([p.id, pos, was, v]); });
  });
  return rep;
}

/* ---------- Opponent prep ---------- */
// Film study: the next opponent's real tendencies. Their coordinator is asked to call plays a few
// hundred times in the usual situations, the way it would in a game before it knows your habits, and
// the calls are tallied by down and distance (short, medium and long yardage, as the scouting in
// ai.js charts them).
const FILM_SITS = {
  s: [[3, 1], [3, 2], [2, 1], [3, 3], [2, 2], [1, 2]],
  m: [[2, 5], [3, 4], [2, 6], [3, 6], [1, 5], [2, 7]],
  l: [[1, 10], [1, 10], [1, 10], [2, 8], [2, 10], [3, 8], [3, 12]]
};
const FILM_YOUR_PKGS = { s: ["p12", "p21", "p11"], m: ["p11", "p11", "p12"], l: ["p11", "p10", "p11"] };
// How often each situation comes up, for the overall numbers
const BUCKET_WT = { s: .2, m: .3, l: .5 };
const BLITZ_IDS = ["rb", "ab", "zb"];
const sharesOf = map => { const n = Object.values(map).reduce((a, b) => a + b, 0) || 1; return Object.keys(map).map(k => [k, map[k] / n]).sort((a, b) => b[1] - a[1]); };
function filmStudy(opp, me, n) {
  const keep = S, kt = kickTD, ke = kickEnded, out = { off: {}, def: {} };
  n = n || 60;
  try {
    initGame({ level: "hs", cpu: [true, true] }, [opp, me]);
    for (const b in FILM_SITS) {
      const off = {}, opk = {}, def = {}, dpk = {};
      let runs = 0, plays = 0, blitz = 0, calls = 0;
      for (let i = 0; i < n; i++) {
        const [down, toGo] = FILM_SITS[b][i % FILM_SITS[b].length], spot = 25 + (i * 7) % 45, q = 1 + (i % 3);
        Object.assign(S, { poss: 0, down, toGo, spot, quarter: q, clock: 600, twoPt: null, kneelSeries: false, nhLock: null });
        S.offPkg = cpuOffPkg();
        const c = cpuOff();
        if (OFFP[c] && !isST(S.offPkg)) { off[c] = (off[c] || 0) + 1; opk[S.offPkg] = (opk[S.offPkg] || 0) + 1; plays++; if (OFFP[c].kind === "run") runs++; }
        Object.assign(S, { poss: 1, down, toGo, spot, quarter: q });
        S.offPkg = FILM_YOUR_PKGS[b][i % 3];
        S.defPkg = cpuDefPkg();
        const d = cpuDef();
        if (DEF_IDS.includes(d)) { def[d] = (def[d] || 0) + 1; dpk[S.defPkg] = (dpk[S.defPkg] || 0) + 1; calls++; if (BLITZ_IDS.includes(d)) blitz++; }
      }
      out.off[b] = { run: plays ? runs / plays : 0, calls: sharesOf(off), pkgs: sharesOf(opk) };
      out.def[b] = { blitz: calls ? blitz / calls : 0, calls: sharesOf(def), pkgs: sharesOf(dpk) };
    }
    // Overall, weighted by how often each situation comes up
    const all = (side, k) => { const m = {}; for (const b in BUCKET_WT) out[side][b][k].forEach(([id, v]) => { m[id] = (m[id] || 0) + v * BUCKET_WT[b]; }); return sharesOf(m); };
    out.offAll = all("off", "calls"); out.defAll = all("def", "calls");
    out.run = Object.keys(BUCKET_WT).reduce((s, b) => s + out.off[b].run * BUCKET_WT[b], 0);
    out.blitz = Object.keys(BUCKET_WT).reduce((s, b) => s + out.def[b].blitz * BUCKET_WT[b], 0);
    out.disg = clamp(CP(0).disg * .35, 0, 1);
  } finally { S = keep; kickTD = kt; kickEnded = ke; }
  return out;
}
// What your team takes into the game from the film: the calls it studied in each situation, and
// how much of an edge it has when they come. A full report covers each team's top two calls in each
// situation, the works the top three; a light one only their two favorites overall.
const PREP_EDGE = [0, .05, .09, .13];
function prepFrom(film, level, scout) {
  if (!film || !level) return null;
  const k = PREP_EDGE[level] * (.8 + .4 * (scout || 42) / 100), top = (list, n) => list.slice(0, n).map(([id]) => id), p = { k, off: {}, def: {} };
  ["s", "m", "l"].forEach(b => {
    p.off[b] = level === 1 ? top(film.offAll, 2) : top(film.off[b].calls, level === 2 ? 2 : 3);
    p.def[b] = level === 1 ? top(film.defAll, 2) : top(film.def[b].calls, level === 2 ? 2 : 3);
  });
  return p;
}
// The edge on a snap from film study (positive favors the offense)
function prepEdge(o, off, def) {
  if (!S || !S.teams) return 0;
  const b = scoutBucket(), po = S.teams[o].prep, pd = S.teams[1 - o].prep;
  let e = 0;
  if (po && (po.def[b] || []).includes(def)) e += po.k;
  if (pd && (pd.off[b] || []).includes(off)) e -= pd.k;
  return e;
}
