// Friday to Sunday: the pro draft (Milestone 5, step 5). Prospects from the college world, among them
// the players you coached, scouting that narrows what you know about each one, the combine, your
// board, the draft order, the draft room, rookie contracts and undrafted free agents.
"use strict";

/* ---------- The prospects ---------- */
// About 400 a year: college players out of eligibility and juniors who declare, from programs at
// every level, most from the power conferences. Each comes from a real program in the college world;
// the players you coached are the real ones. Prospects are kept as short records (pworld.js).
const DRAFT_ROUNDS = 7, DRAFT_PER = { P4: 3.5, G5: 1.6, FCS: .4, D2: .05, D3: 0 };
const DRAFT_LEVEL = { P4: 62, G5: 59, FCS: 56, D2: 54, D3: 52 };
const DRAFT_ARCHS = ["passer", "dual", "runner", "speed", "speed", "bigath", "lineman", "lineman", "lineman", "backer", "backer", "dback", "dback", "kicker"];
// What the staff knows to start with: each prospect's overall within about 8 points, and a bias
// (how far off the first look is) that shrinks with the range
const SCOUT_W0 = 8, SCOUT_W_MIN = 1.5;
function draftPool(year) {
  const C = colWorld(), out = [], seen = new Set();
  if (!C) return out;
  const g = dice(hashSeed(`${C.world}:${year}:draftpool`));
  let k = 0;
  const add = (p, col, extra) => {
    if (seen.has(p.id)) return;
    seen.add(p.id);
    p.age = p.age || g.i(21, 23); p.exp = 0; p.yr = 13;
    if (p.pos2 && posSide(p.pos2) !== posSide(p.pos)) p.pos2 = null;
    proPotential(p, g);
    p.col = col;
    p.sc = { b: Math.round(clamp(g.n(0, 3.5), -8, 8) * 10) / 10, w: SCOUT_W0, pts: 0 };
    Object.assign(p, extra || {});
    delete p.ct; delete p.cs; delete p.inj; delete p.off; delete p.offT; delete p.sign; delete p.joined; delete p.from;
    out.push(p);
  };
  // Generated prospects from each program, by its level
  Object.values(C.schools).sort((a, b) => (a.id < b.id ? -1 : 1)).forEach(s => {
    const per = DRAFT_PER[s.cls] || 0, n = Math.floor(per) + (g.f() < per % 1 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const lv = DRAFT_LEVEL[s.cls] + (s.level - CLASS_LEVEL[s.cls]) * .5;
      const p = genPlayer(g, { id: `d${year}n${k++}`, arch: g.pick(DRAFT_ARCHS), yr: 13, level: lv - 7, last: g.pick(LAST_NAMES) });
      add(p, s.town, { cid: s.id, early: g.f() < .25 });
    }
  });
  // The players you coached: out of college this year, from your own program or the ones your high
  // school players signed with
  (proWorld() && proWorld().formers || []).filter(x => x.year === year).forEach(x => add(unpackPlayer(x.p), x.col, { you: x.why }));
  Object.values(C.schools).forEach(s => (s.joined || []).forEach(q => {
    if (!q.you || q.from + 4 !== year - 1 || isFull(s)) return;
    const full = inWorld(C, () => rosterAt(s, year - 1)), p = full.players.find(x => x.id === q.id);
    if (p && ovr(p, p.pos) >= 55) add(clone(p), s.town, { you: `You coached him in high school, at ${q.hsName || "your high school"}.` });
  }));
  return out;
}
// The players leaving your college program go to the next draft (cyear.js calls this)
function noteFormers(players, col, year) {
  const P = proWorld();
  if (!P) return;
  P.formers = (P.formers || []).filter(x => x.year >= year).concat(players.filter(p => ovr(p, p.pos) >= 55).map(p => ({ year: year + 1, col, why: `You coached him at ${col}.`, p: packPlayer(Object.assign(clone(p), { age: 21 + Math.max(0, (p.yr || 12) - 11), exp: 0 })) })));
}

/* ---------- What you know about a prospect ---------- */
// His overall at his position as a range: "about 68 to 76". The range narrows with scouting time and
// the combine; the true numbers show only once he's on a team.
function prospectRange(p) {
  const o = ovr(p, p.pos), sc = p.sc || { b: 0, w: 0 }, mid = o + sc.b * (sc.w / SCOUT_W0), h = sc.w / 2;
  return [Math.round(mid - h), Math.round(mid + h)];
}
const rangeText = p => { const [lo, hi] = prospectRange(p); return lo === hi ? `about ${lo}` : `about ${lo} to ${hi}`; };
const prospectEst = p => { const [lo, hi] = prospectRange(p); return (lo + hi) / 2; };
// Scouting points: each one narrows the range by about 7 percent
function scoutPoints(p, pts) {
  const sc = p.sc;
  sc.pts += pts;
  sc.w = Math.max(SCOUT_W_MIN, SCOUT_W0 * Math.pow(.93, sc.pts) * (sc.cmb ? .7 : 1));
}
// Your staff's scouting time each week, shared out by priority (a top prospect gets three times a
// normal one's time, high twice): more with a better Scouting rating, and the Talent evaluator perk
const SCOUT_WEEK = 24, PRI_WEIGHT = { 3: 3, 2: 2, 1: 1 };
function scoutWeek() {
  const D = SEASON.draft, c = CAREER && CAREER.coach;
  if (!D || D.done || !c) return;
  const board = D.board.map(id => D.byId[id]).filter(Boolean);
  if (!board.length) return;
  const per = SCOUT_WEEK * clamp((((c.sct || 50) - 25) / 50), .4, 1.6) * (coachHas(c, "tev") ? 1.4 : 1);
  const wsum = board.reduce((t, p) => t + PRI_WEIGHT[D.pri[p.id] || 1], 0);
  board.forEach(p => { const u = unpackPlayer(D.pool[p.i]); scoutPoints(u, per * PRI_WEIGHT[D.pri[p.id] || 1] / wsum); D.pool[p.i] = packPlayer(u); });
  D.v = (D.v || 0) + 1;
}
// The combine, after the season: the 40-yard dash, the bench press and the vertical jump, for every
// prospect, and the ranges narrow by about a third
function combine(D) {
  if (D.cmb) return;
  D.cmb = true;
  D.pool = D.pool.map(str => {
    const p = unpackPlayer(str), g = seededRandom(hashSeed(`${p.id}:combine`));
    p.cmb = { f40: Math.round((4.24 + (99 - p.r.spd) * .0125 + (g() - .5) * .06) * 100) / 100, bench: Math.max(4, Math.round(4 + p.r.str * .3 + (g() - .5) * 4)), vert: Math.round((24 + (p.r.spd + p.r.str) * .07 + (g() - .5) * 3) * 2) / 2 };
    p.sc.cmb = true; scoutPoints(p, 0);
    return packPlayer(p);
  });
  D.v = (D.v || 0) + 1;
}
const combineText = p => p.cmb ? `40-yard dash ${p.cmb.f40.toFixed(2)}, bench press ${p.cmb.bench} reps, vertical jump ${p.cmb.vert} inches.` : "";

/* ---------- The draft order ---------- */
// The teams that missed the playoff, worst record first, then the playoff teams by how far they went,
// ties to the weaker schedule. Seven rounds, with compensatory picks at the ends of rounds 3 to 7 for
// teams that lost more in free agency than they signed (at most four a team, 32 in all).
function proDraftOrder(W) {
  return inWorld(W, () => {
    const P = W.post, out = {}, sos = id => { const gs = proGamesOf(id, PRO_REG); return gs.length ? avg(gs.map(x => recPct(proRecord(x[0], PRO_REG)))) : .5; };
    const stage = id => { if (!P || !P[proCf(id)].seeds.includes(id)) return 0; if (P.champ === id) return 6; let r = 1; P.rounds.forEach((rd, k) => rd.forEach(([w, i]) => { const gm = W.weeks[w - 1].games[i]; if (played(gm) && gameHas(gm, id) && winnerOf(gm) === id) r = Math.max(r, k + 2); })); return r; };
    const ids = Object.keys(W.schools).sort((a, b) => stage(a) - stage(b) || recPct(proRecord(a, PRO_REG)) - recPct(proRecord(b, PRO_REG)) || sos(a) - sos(b) || (hashSeed(W.seed + a) % 997) - (hashSeed(W.seed + b) % 997));
    void out;
    return ids;
  });
}
function draftPicks(order, comp, year, owner) {
  const picks = [];
  for (let r = 1; r <= DRAFT_ROUNDS; r++) {
    order.forEach(team => { const key = year ? pickKey(year, r, team) : null; picks.push({ rd: r, team: key && owner ? owner(key) : team, key, orig: team }); });
    (comp || []).filter(c => c.rd === r).forEach(c => picks.push({ rd: r, team: c.team, comp: true }));
  }
  picks.forEach((p, i) => { p.n = i + 1; });
  return picks;
}

// This year's picks, with the traded ones in their new teams' hands (ptrade.js)
const draftPicksFor = W => draftPicks(proDraftOrder(W), W.comp || [], W.draft.year, k => pickOwnerOf(W, k));

/* ---------- The draft ---------- */
// SEASON.draft: { year, pool: [short records], byId: { id: { i } }, board: [ids] (yours, best first),
// pri: { id: 3 top, 2 high, 1 normal }, picks: [{ n, rd, team, comp, pid }], cur: the next pick,
// push: { round: id } (your pushes, with a GM), log: [lines], done }
function newProDraft(year) {
  const pool = draftPool(year), D = { year, pool: pool.map(packPlayer), byId: {}, board: [], pri: {}, picks: null, cur: 0, push: {}, log: [], done: false, cmb: false };
  pool.forEach((p, i) => { D.byId[p.id] = { i, id: p.id }; });
  return D;
}
// The class unpacked once and kept while the page is open (read only; D.v counts changes to the pool)
const DRAFT_CACHE = new WeakMap();
function draftPlayers(D) {
  let c = DRAFT_CACHE.get(D);
  if (!c || c.n !== D.pool.length || c.v !== (D.v || 0)) {
    c = { n: D.pool.length, v: D.v || 0, by: {} };
    D.pool.forEach(str => { const p = unpackPlayer(str); c.by[p.id] = p; });
    c.order = Object.keys(c.by).sort((a, b) => (ovr(c.by[b], c.by[b].pos) + c.by[b].pot) - (ovr(c.by[a], c.by[a].pos) + c.by[a].pot));
    DRAFT_CACHE.set(D, c);
  }
  return c;
}
const draftProspect = (D, id) => D.byId[id] ? draftPlayers(D).by[id] : null;
const draftFresh = (D, id) => D.byId[id] ? unpackPlayer(D.pool[D.byId[id].i]) : null;
const draftTaken = D => new Set((D.picks || []).filter(x => x.pid).map(x => x.pid));
// A team's needs: the positions where it's furthest short of a full roster, by its players under
// contract for next year
function teamNeeds(s) {
  const left = s.players.filter(p => ctYears(p) > 1 || (p.ct && p.ct.rk));
  return Object.keys(ROSTER_MIX).map(pos => [pos, left.filter(p => p.pos === pos).length / ROSTER_MIX[pos]]).sort((a, b) => a[1] - b[1]).slice(0, 4).map(x => x[0]);
}
// How a GM sees a prospect: his true overall and potential, through his own scouting (a better GM
// misses by less), plus his position's worth, plus a team's needs
function gmGrade(p, gm, needs, seed) {
  const err = (seededRandom(hashSeed(`${seed}:${p.id}:gm`))() - .5) * 2 * (14 - (gm.rt || 60) / 10);
  const pv = { QB: 4, DL: 2, WR: 1.5, OL: 1, CB: 1, LB: 0, S: 0, TE: -.5, RB: -1, K: -10, P: -12 }[p.pos] || 0;
  const k = needs ? needs.indexOf(p.pos) : -1;
  return ovr(p, p.pos) * .65 + (p.pot || 0) * .35 + err + pv + (k >= 0 ? 3 - k * .7 : 0) + (gm.ph === "draft" ? .5 : 0);
}
// Your staff's pick: the best on your board still there, or the best by its own estimate
function staffPick(D, avail, needs) {
  const onBoard = D.board.find(id => avail.has(id));
  if (onBoard) return onBoard;
  let best = null, bv = -1e9;
  avail.forEach(id => { const p = draftProspect(D, id), v = prospectEst(p) * .7 + p.pot * .3 + (needs.includes(p.pos) ? 2 : 0) + ({ K: -10, P: -12 }[p.pos] || 0); if (v > bv) { bv = v; best = id; } });
  return best;
}
// Who makes this pick, and whom: a computer team's GM, or for your team your choice, your staff, or
// your GM (who takes the player you pushed for this round if he goes along)
function makePick(W, D, pick, choice) {
  const taken = draftTaken(D), avail = new Set(Object.keys(D.byId).filter(id => !taken.has(id)));
  if (!avail.size) { pick.pid = null; return null; }
  const s = W.schools[pick.team], mine = pick.team === W.myId, J = CAREER && CAREER.job;
  let pid = null;
  if (mine && choice && avail.has(choice)) pid = choice;
  else if (mine && J && J.lvl === "pro" && J.ctl) pid = staffPick(D, avail, teamNeeds(s));
  else {
    const needs = mine && J && J.req && J.req.needs.length ? J.req.needs : isFull(s) ? teamNeeds(s) : (s.needs || []), gm = proGM(s);
    if (mine && D.push[pick.rd] && avail.has(D.push[pick.rd])) {
      const yes = gmFollows(`push:${D.year}:${pick.rd}`), p = draftProspect(D, D.push[pick.rd]);
      D.log.push({ yes, t: `Round ${pick.rd}: you pushed for ${fullName(p)}. ${yes ? "The GM took him." : "The GM went another way."}` });
      if (J) (J.log = J.log || []).push({ yes, t: `Push for ${fullName(p)} in round ${pick.rd}: ${yes ? "drafted" : "not drafted"}` });
      if (yes) pid = D.push[pick.rd];
    }
    if (!pid) {
      let bv = -1e9;
      // (a computer team looks at the best 60 left by consensus, to keep the draft quick)
      const C = draftPlayers(D), top = [];
      for (const id of C.order) { if (avail.has(id)) top.push(C.by[id]); if (top.length >= 60) break; }
      top.forEach(p => { const v = gmGrade(p, gm, needs, `${D.year}:${pick.team}`); if (v > bv) { bv = v; pid = p.id; } });
    }
  }
  pick.pid = pid;
  return pid;
}
// The rest of the draft, or up to (not including) your next pick when stopAtMine
function runDraft(W, D, stopAtMine) {
  if (!D.picks) D.picks = draftPicksFor(W);
  for (; D.cur < D.picks.length; D.cur++) {
    const pick = D.picks[D.cur];
    if (stopAtMine && pick.team === W.myId && !(CAREER.job && CAREER.job.ctl && CAREER.job.staff && CAREER.job.staff.late && pick.rd >= 4)) return pick;
    makePick(W, D, pick, null);
  }
  D.done = true;
  return null;
}
// Your pick, made: by you (choice), or by your staff or GM (choice null)
function myPick(W, D, choice) {
  const pick = D.picks && D.picks[D.cur];
  if (!pick || pick.team !== W.myId) return null;
  const pid = makePick(W, D, pick, choice);
  D.cur++;
  return pid;
}
// "Round 1, pick 7 (7th overall)"
const pickText = pk => `round ${pk.rd}, pick ${pk.n}${pk.comp ? ", a compensatory pick" : pk.orig && pk.orig !== pk.team ? `, from the ${SEASON.schools[pk.orig].mascot}` : ""}`;
// Everyone drafted, by team, with rookie contracts by where they were picked
function draftedBy(D) {
  const out = {};
  (D.picks || []).forEach(pk => {
    if (!pk.pid) return;
    const p = draftFresh(D, pk.pid);
    p.id = `${p.id}p`;
    p.ct = makeContract(rookieScale(pk.n), 4, { rk: true, g: pk.n <= 32 ? 1 : pk.n <= 64 ? .5 : .1, o5: pk.n <= 32 });
    p.pick = { year: D.year, n: pk.n, rd: pk.rd };
    delete p.sc; delete p.cmb; delete p.cid; delete p.early;
    (out[pk.team] = out[pk.team] || []).push(p);
  });
  return out;
}
// The best of the undrafted, to the teams with the most room, as undrafted free agents: three-year
// contracts at the minimum (about five a team)
function undrafted(D, teams) {
  const taken = draftTaken(D), left = Object.keys(D.byId).filter(id => !taken.has(id)).map(id => draftFresh(D, id)).sort((a, b) => (ovr(b, b.pos) + b.pot) - (ovr(a, a.pos) + a.pot)), out = {};
  teams.forEach(t => { out[t] = []; });
  left.slice(0, teams.length * 5).forEach((p, i) => {
    const t = teams[i % teams.length];
    p.id = `${p.id}u`;
    p.ct = makeContract(proMin(0), 3, { g: 0, rk: true });
    delete p.sc; delete p.cmb; delete p.cid; delete p.early;
    out[t].push(p);
  });
  return out;
}
// Your former players in this draft: where they went
function formersDrafted(D, W) {
  return (D.picks || []).filter(pk => pk.pid).map(pk => ({ pk, p: draftProspect(D, pk.pid) })).filter(x => x.p.you)
    .map(x => `${fullName(x.p)} (${posName(x.p.pos)}, ${x.p.col}): ${pickText(x.pk)}, by the ${schoolName(W.schools[x.pk.team])}.`);
}

/* ---------- Your board ---------- */
// The staff fills the board to 40 with the best prospects by its estimate, your needs first, keeping
// the order of the ones you've placed
const DRAFT_BOARD_MAX = 40;
function staffBoard(D, needs) {
  const on = new Set(D.board);
  const cands = Object.keys(D.byId).filter(id => !on.has(id)).map(id => draftProspect(D, id)).sort((a, b) => (prospectEst(b) + b.pot * .3 + (needs.includes(b.pos) ? 2 : 0) - ({ K: 10, P: 12 }[b.pos] || 0)) - (prospectEst(a) + a.pot * .3 + (needs.includes(a.pos) ? 2 : 0) - ({ K: 10, P: 12 }[a.pos] || 0)));
  for (const p of cands) { if (D.board.length >= DRAFT_BOARD_MAX) break; D.board.push(p.id); }
}
function boardMove(D, id, how) {
  const i = D.board.indexOf(id);
  if (how === "add") { if (i < 0 && D.byId[id]) D.board.push(id); return; }
  if (i < 0) return;
  D.board.splice(i, 1);
  if (how === "remove") { delete D.pri[id]; return; }
  const to = how === "top" ? 0 : how === "up" ? Math.max(0, i - 1) : how === "down" ? Math.min(D.board.length, i + 1) : i;
  D.board.splice(to, 0, id);
}

// The players you coached who left college this year join the class if they aren't in it yet
function draftAddFormers(D) {
  const have = new Set(Object.keys(D.byId));
  (proWorld() && proWorld().formers || []).filter(x => x.year === D.year).forEach(x => {
    const p = unpackPlayer(x.p);
    if (have.has(p.id)) return;
    const g = seededRandom(hashSeed(`${p.id}:late`));
    proPotential(p, dice(hashSeed(`${p.id}:pot`)));
    Object.assign(p, { col: x.col, you: x.why, exp: 0, yr: 13, sc: { b: Math.round((g() - .5) * 8 * 10) / 10, w: SCOUT_W0, pts: 0 } });
    D.byId[p.id] = { i: D.pool.length, id: p.id };
    D.pool.push(packPlayer(p));
    D.v = (D.v || 0) + 1;
  });
}
