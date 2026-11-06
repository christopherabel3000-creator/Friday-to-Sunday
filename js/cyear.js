// Friday to Sunday: the college year (Milestone 4). Five years for every player, fifth-year seniors
// moving on, juniors and seniors leaving early for the pros, spring practice, recruiting classes, and every program a year on: yours in
// full, the rest on paper.
"use strict";

/* ---------- Your players' year ---------- */
// Every college player has five years: freshman, sophomore, junior, senior and fifth-year senior, no
// redshirts and no exceptions. The best juniors and seniors may leave early for the pros: none under
// 74 at their position, about half at 80, nearly all from 86.
const lastYearNow = p => p.yr >= 13;
function leavesEarly(p, rng) {
  if (p.yr !== 11 && p.yr !== 12) return false;
  const o = ovr(p, p.pos), chance = clamp((o - 74) / 12, 0, .9);
  return chance > 0 && rng() < chance;
}
// One of your players' year, from the end of the season to the next: "grad", "pros", "left" or ""
function colPlayerYear(s, p, year) {
  const rng = playerRng(s, p, year);
  if (lastYearNow(p)) return "grad";
  if (leavesEarly(p, rng)) return "pros";
  if (quitsAfter(p, rng)) return "left";
  summerGrow(p, s.coach, rng, 1);
  p.yr++;
  return "";
}
// Spring practice: four weeks with your practice plan (opponent prep goes into install, as in camp),
// with no hitting injuries to speak of. Returns the merged report.
const SPRING_WEEKS = 4;
function springPractice(s, plan, year) {
  const reps = [];
  for (let w = 1; w <= SPRING_WEEKS; w++) reps.push(practiceSchool(s, campPlan(plan || newPlan()), seededRandom(hashSeed(`${s.seed}:${year}:spring:${w}`)), { noInjuries: true }));
  return mergeReports(reps);
}
// Over the 105-player limit: the players who aren't starting or first off the bench, lowest rated
// first, are let go
function cutToLimit(s) {
  const plays = new Set(), out = [];
  for (const pos in s.depth) (s.depth[pos] || []).slice(0, (STARTERS[pos] || 1) + 1).forEach(id => plays.add(id));
  const extra = s.players.length - COL_ROSTER_MAX;
  if (extra <= 0) return out;
  const cands = s.players.filter(p => !plays.has(p.id) && p.yr > 9).sort((a, b) => ovr(a, a.pos) - ovr(b, b.pos)).slice(0, extra);
  s.players = s.players.filter(p => !cands.includes(p));
  return cands;
}
// Your program a year on: spring practice, then fifth-year seniors moving on, early departures and
// summer growth, then the new class (with any of your old high school players who signed here).
// Returns { grads, pros, left, rs, fresh, joined, cut, grew, spring }.
function colAdvanceMine(s, year, plan) {
  const rep = { grads: [], pros: [], left: [], fresh: [], joined: [], cut: [], grew: [] }, before = {};
  // The transfer portal closes first (cportal.js): the players who left are gone before spring practice
  const xfer = portalClose(s);
  rep.xout = xfer.out; rep.xkept = xfer.kept; rep.xin = xfer.in; rep.xmissed = xfer.missed;
  rep.spring = springPractice(s, plan, year);
  s.players.forEach(p => { before[p.id] = ovr(p, p.pos); });
  s.players = s.players.filter(p => {
    const out = colPlayerYear(s, p, year);
    if (out === "grad") rep.grads.push(p);
    if (out === "pros") rep.pros.push(p);
    if (out === "left") rep.left.push(p);
    if (!out) { p.inj = null; delete p.en; delete p.rest; }
    return !out;
  });
  rep.grew = s.players.map(p => [p.id, before[p.id], ovr(p, p.pos)]).filter(x => x[2] > x[1]).sort((a, b) => (b[2] - b[1]) - (a[2] - a[1]));
  const used = new Set(s.players.map(p => p.num)), g = dice(hashSeed(`${s.seed}:${year + 1}:numbers`));
  // The class you recruited (crecruit.js), or for a season without a board, one rolled on paper
  const rec = SEASON.rec;
  rep.fresh = rec && rec.year === year + 1 && rec.cls ? rec.cls.map(p => clone(p)) : genClass(s, year + 1);
  rep.joined = joinedFor(s, year + 1);
  rep.fresh.concat(rep.joined, rep.xin).forEach(p => { p.num = jerseyFor(g, p.pos, used); });
  s.players = s.players.concat(rep.fresh, rep.joined, rep.xin);
  s.players.forEach(p => { p.o0 = ovr(p, p.pos); });
  s.depth = autoDepth(s);
  rep.cut = cutToLimit(s);
  s.depth = autoDepth(s);
  for (const id in s.mastery || {}) s.mastery[id] = Math.round((s.mastery[id] - (s.mastery[id] - 30) * MASTERY_FORGET) * 100) / 100;
  s.rating = schoolRating(s);
  return rep;
}

/* ---------- Your old high school players ---------- */
// The players you (and your district) sent to college on signing day are kept with their programs:
// s.joined, as freshmen for the year they arrive. A program on paper adds them to its roster when
// it's rebuilt (years.js: rosterAt); yours takes them in at the turn of the year.
function sendToCollege(p, cid, year) {
  const W = colWorld(), c = W && W.schools[cid];
  if (!c) return;
  const q = clone(p);
  Object.assign(q, { id: `${p.id}c`, yr: 9, from: year + 1, inj: null, off: undefined, offT: undefined, sign: undefined, tc: undefined, gr: p.gr, hsFrom: p.hsFrom || null });
  delete q.cs; delete q.en; delete q.rest; delete q.num;
  (c.joined = c.joined || []).push(q);
  c.joined = c.joined.filter(x => x.from > year - 5);
}
const joinedFor = (s, year) => (s.joined || []).filter(p => p.from === year).map(p => clone(p));

/* ---------- Programs on paper ---------- */
// A recruiting class on paper: about a fifth of the roster, at a level from the program's level,
// tradition, last season's ranking and its coach. (Your own class is recruited for real from step 5;
// until then it's rolled the same way.)
function colClassOnPaper(s, year, rank) {
  const g = dice(hashSeed(`${s.seed}:${year}:recruits`)), cls = s.cls;
  const rk = rank <= 10 ? 1.5 : rank <= 25 ? .8 : rank <= 60 ? 0 : -.5;
  const coach = (((s.coach.rct != null ? s.coach.rct : s.coach.pbd) || 45) - 50) * .04;
  const lv = Math.round((CLASS_LEVEL[cls] + (s.trad - 50) * .06 + rk + coach + g.n(0, 1.8)) * 10) / 10;
  return { n: clamp(Math.round(CLASS_INFO[cls].roster / 5 + g.n(0, 2)), 12, 28), lv };
}

/* ---------- The college world, a year on ---------- */
// After the season (yours, or one played on paper): tradition follows results, every program brings
// in a class, the ratings move, your program advances in full, and a new schedule is made. Returns
// your program's report (or null) and leaves SEASON as the new season.
function colResultsOf(id) {
  const r = colRecord(id), dv = divOf(SEASON.schools[id]), B = SEASON.post && SEASON.post[dv];
  let pw = 0;
  if (B) B.rounds.forEach(rd => rd.forEach(([w, i]) => { const gm = SEASON.weeks[w - 1].games[i]; if (played(gm) && winnerOf(gm) === id) pw++; }));
  const bowl = SEASON.weeks[COL_POST] && SEASON.weeks[COL_POST].games.find(gm => gm.bowl && !gm.post && gameHas(gm, id) && played(gm));
  return { w: r.w, l: r.l, cw: r.cw, cl: r.cl, pw: pw + (bowl && winnerOf(bowl) === id ? .5 : 0), po: B && B.seeds.includes(id) ? 1 : 0, ch: B && B.champ === id ? 1 : 0, bowl: bowl ? 1 : 0 };
}
function colNextSeason() {
  const old = SEASON, year = old.year, next = year + 1, ranks = colRanks(COL_LAST), me = old.myId;
  let mine = null;
  if (me && old.rec && old.rec.year === next && !old.rec.done && isFull(old.schools[me])) colSigningDay(old.rec);
  if (me && isFull(old.schools[me])) colPortal();
  for (const id in old.schools) {
    const s = old.schools[id], r = colResultsOf(id);
    if (s.trad0 == null) s.trad0 = s.trad;
    s.trad = newTradition(s, r.w, r.l, Math.floor(r.pw), !!r.ch);
    s.classes = s.classes || {};
    for (const k in s.classes) if (+k < next - 4) delete s.classes[k];
    s.classes[next] = id === me && old.rec && old.rec.year === next && old.rec.paper ? old.rec.paper : colClassOnPaper(s, next, ranks[id]);
    if (id === me && isFull(s)) mine = colAdvanceMine(s, year, old.plan);
    else s.rating = colRating(s, next);
  }
  const champs = Object.fromEntries(DIV_IDS.map(dv => [dv, old.post && old.post[dv] ? old.post[dv].champ : null]));
  const history = (old.history || []).concat(DIV_IDS.filter(dv => champs[dv]).map(dv => ({ year, div: dv, id: champs[dv], name: nameOf(champs[dv]) })));
  const se = newColSeason(old.world, next, old);
  Object.assign(se, { history, plan: old.plan, rot: old.rot, phase: me ? "preseason" : "regular", camp: me ? 1 : 0 });
  se.districts = [{ n: 1, ids: me ? [me] : [] }];
  if (mine) { se.yearReport = colYearReport(mine, year); se.expect = 0; }
  SEASON = se;
  REBUILT.clear();
  return se.yearReport || null;
}
// The college world while you coach high school: its season is played on paper when yours ends, and
// it moves on when your next season starts (both on OTHER)
function colWorldSeasonDone() {
  const W = OTHER && OTHER.lvl === "col" ? OTHER : null;
  if (W && W.phase !== "over") inWorld(W, colSeasonOnPaper);
}
function colWorldNextYear() {
  if (!(OTHER && OTHER.lvl === "col")) return;
  colWorldSeasonDone();
  OTHER = inWorld(OTHER, () => { colNextSeason(); return SEASON; });
}
// What happened to your team over the year, for the new season's report (as years.js does for high school)
function colYearReport(rep, year) {
  const who = p => ({ name: fullName(p), pos: p.pos, ovr: ovr(p, p.pos), stats: careerStatLine(p.cs), why: LEFT_WHY[hashSeed(p.id + year) % LEFT_WHY.length] });
  const best = list => list.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
  return { col: true, from: year, grads: best(rep.grads).map(who), pros: best(rep.pros).map(who), left: best(rep.left).map(who), cut: best(rep.cut).map(who),
    xout: best(rep.xout || []).map(p => Object.assign(who(p), { to: p.xferTo ? SEASON.schools[p.xferTo].town : "" })), xin: (rep.xin || []).map(p => p.id), xkept: (rep.xkept || []).map(p => p.id),
    xmissed: (rep.xmissed || []).map(q => `${q.first} ${q.last}`),
    fresh: rep.fresh.map(p => p.id), joined: rep.joined.map(p => p.id), grew: rep.grew.slice(0, 10), went: 0, offers: [],
    spring: rep.spring ? { mastery: rep.spring.mastery.slice(0, 8), n: Object.keys(rep.spring.grew).length } : null };
}
