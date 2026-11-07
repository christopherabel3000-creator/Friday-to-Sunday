// Friday to Sunday: the college job (Milestone 4). The college reputation, expectations and the
// season grade in college, contracts, salaries, buyouts and counteroffers, college jobs in the job
// market (from high school once your reputation reaches 80), and moving between the two worlds.
"use strict";

/* ---------- The college reputation ---------- */
// College has its own reputation (CAREER.crep), 0 to 100, with the same words. A coach who arrives
// from high school starts at 20, plus a little for a high school legend. A bigger level is a bigger
// stage, so the same grade builds more there.
const COL_STAGE = { D3: 1, D2: 1.2, FCS: 1.4, G5: 1.7, P4: 2 };
Object.assign(STAGE, COL_STAGE);
const CREP_START = 20;
const startCrep = hsRep => Math.round((CREP_START + Math.max(0, (hsRep || 0) - 80) / 2) * 10) / 10;
// Each level's bar on the college reputation, plus 0.2 a point of tradition over 50
const COL_JOB_BAR = { D3: 0, D2: 10, FCS: 30, G5: 45, P4: 65 };
Object.assign(REP_BAR, COL_JOB_BAR);
// From high school, only Division III and Division II jobs, and only from a reputation of 80
const HS_TO_COL = 80, HS_TO_COL_LEVELS = new Set(["D3", "D2"]);
const inCollege = () => !!(SEASON && SEASON.lvl === "col");

/* ---------- Expectations in college ---------- */
// The regular season played on paper 60 times from the season's opening ratings: expected wins, the
// chance of a conference title (the best conference record) and of the postseason (a top-third
// finish in the division by wins). Expected postseason wins are a third of the postseason chance.
const COL_EXPECT_SIMS = 60;
function colSetExpectations() {
  const ids = Object.keys(SEASON.schools), at = {}, N = ids.length;
  ids.forEach((id, i) => { at[id] = i; });
  const games = [];
  SEASON.weeks.slice(0, COL_REG).forEach(w => w.games.forEach(gm => { const [a, b] = expectedPoints(gm.h, gm.a, gm.neutral); games.push([at[gm.h], at[gm.a], winProb(a - b), gm.conf]); }));
  const sum = { w: new Float64Array(N), dt: new Float64Array(N), po: new Float64Array(N) }, rng = seededRandom(hashSeed(`${SEASON.seed}:expect`));
  const divIds = DIV_IDS.map(dv => ids.filter(id => divOf(SEASON.schools[id]) === dv).map(id => at[id])), field = DIV_IDS.map(dv => DIVS[dv].field + (dv === "FBS" ? 62 : 0));
  for (let k = 0; k < COL_EXPECT_SIMS; k++) {
    const w = new Int8Array(N), cw = new Int8Array(N), key = Float64Array.from({ length: N }, () => rng());
    games.forEach(([h, a, p, conf]) => { const win = rng() < p ? h : a; w[win]++; if (conf) cw[win]++; });
    SEASON.confs.forEach(c => { const best = c.ids.map(id => at[id]).sort((x, y) => cw[y] - cw[x] || w[y] - w[x] || key[y] - key[x])[0]; sum.dt[best]++; });
    divIds.forEach((list, d) => list.slice().sort((x, y) => w[y] - w[x] || key[y] - key[x]).slice(0, field[d]).forEach(i => { sum.po[i]++; }));
    for (let i = 0; i < N; i++) sum.w[i] += w[i];
  }
  const r2 = v => Math.round(v / COL_EXPECT_SIMS * 100) / 100;
  SEASON.exp = {};
  ids.forEach((id, i) => { const po = r2(sum.po[i]); SEASON.exp[id] = { w: r2(sum.w[i]), dt: r2(sum.dt[i]), po, pw: Math.round(po / 3 * 100) / 100, ch: 0 }; });
  return SEASON.exp;
}
// "Expected: about 8-4 and a bowl." in college words
function colExpectWords(e) {
  const w = clamp(Math.round(e.w), 0, COL_REG), rec = `about ${w}-${COL_REG - w}`;
  const more = e.dt >= .4 ? "the conference title" : e.po >= .6 ? "a postseason game" : e.po >= .3 ? "a shot at the postseason" : "";
  return more ? `${rec} and ${more}` : rec;
}
// Every program's season when it's over, with its grade: { w, l, rw, rl, pf, pa, pw, po, dt, ch, g }
function colFinishState() {
  if (SEASON.results) return SEASON.results;
  const res = {};
  Object.keys(SEASON.schools).forEach(id => {
    const r = colResultsOf(id), reg = colRecord(id, COL_REG), s = SEASON.schools[id];
    res[id] = { w: r.w, l: r.l, rw: reg.w, rl: reg.l, pf: reg.pf, pa: reg.pa, pw: r.pw, po: r.po || r.bowl ? 1 : 0, dt: s.conf && confChamp(s.conf) === id ? 1 : 0, ch: r.ch };
  });
  SEASON.results = gradeState(res);
  SEASON.champs = Object.fromEntries(DIV_IDS.map(dv => [dv, SEASON.post[dv].champ]));
  return res;
}

/* ---------- Contracts and salaries ---------- */
// In real dollars, by level, more at a proud program and for a coach with a bigger reputation
const COL_PAY = { D3: [60000, 110000], D2: [90000, 200000], FCS: [200000, 600000], G5: [700000, 3000000], P4: [4000000, 11000000] };
const COL_YEARS = { D3: 2, D2: 3, FCS: 4, G5: 5, P4: 6 };
const BUYOUT = .6;
function colSalary(s, crep) {
  const [lo, hi] = COL_PAY[s.cls], k = clamp(.5 * ((s.trad || 50) - 20) / 75 + .5 * (crep || 0) / 100, 0, 1);
  return Math.round((lo + (hi - lo) * k) / 5000) * 5000;
}
// A new college job: its salary and the years of the contract
function startColJob(id) {
  const s = SEASON.schools[id];
  CAREER.job = Object.assign(newJob(), { id, lvl: "col", pay: colSalary(s, CAREER.crep || 0), yrs: COL_YEARS[s.cls] });
  return CAREER.job;
}
// "$1,250,000 a year, 4 years left"
const contractText = J => `${moneyText(J.pay)} a year, ${plural(J.yrs, "year")} left on the contract`;

/* ---------- Jobs in both worlds ---------- */
// A school from either world, by id (high school ids look like d3s5 or 4Ad3s5, college ids like c123)
const jobSchool = id => (SEASON.schools[id]) || (OTHER && OTHER.schools[id]) || (THIRD && THIRD.schools[id]) || null;
// The world a job is in, when it isn't yours: OTHER or THIRD
const jobWorld = id => SEASON.schools[id] ? SEASON : OTHER && OTHER.schools[id] ? OTHER : THIRD && THIRD.schools[id] ? THIRD : null;
const otherWorldJob = id => !SEASON.schools[id] && !!jobWorld(id);
// The reputation a school looks at, and its bar: a high school looks at your high school
// reputation, a college at your college one (or, from high school, your high school one against 80)
// (a pro team looks at your pro reputation, or from college your college one against 75: pworld.js)
function jobRepFor(s) {
  if (isPro(s.cls)) return inPros() ? (CAREER.prep || 0) : (CAREER.crep || 0);
  if (!isCollege(s.cls)) return CAREER && CAREER.rep != null ? CAREER.rep : REP_START;
  return inCollege() || inPros() ? (CAREER.crep || 0) : (CAREER && CAREER.rep) || 0;
}
function jobBarFor(s) {
  if (isPro(s.cls)) return (inPros() ? REP_BAR.PRO : COL_TO_PRO) + .2 * Math.max(0, s.trad - 50);
  if (!isCollege(s.cls)) return REP_BAR[s.cls] + .2 * Math.max(0, s.trad - 50);
  if (!inCollege() && !inPros()) return HS_TO_COL + (s.cls === "D2" ? 3 : 0) + .1 * Math.max(0, s.trad - 50);
  return COL_JOB_BAR[s.cls] + .2 * Math.max(0, s.trad - 50);
}
// The open jobs in the other world that are interested in you
// (both other worlds: the pro league's jobs come from THIRD while you coach in college)
function otherJobs() {
  if (!CAREER) return [];
  return [OTHER, THIRD].flatMap(W => {
    const R = W && W.review;
    if (!R) return [];
    return R.open.filter(id => {
      const s = W.schools[id];
      if (!s || id === (W.myId || "") || R.why[id] === "taken") return false;
      return !!interestIn(s);
    });
  });
}
// The other world's year-end review and coaching changes happen with yours
// (both other worlds: the one next to yours and the third one; never from inside another world)
function otherWorldReview() {
  if (WORLD_FROM) return;
  [OTHER, THIRD].forEach(W => {
    if (!W || W.review) return;
    if (W.phase !== "over") inWorld(W, W.lvl === "col" ? colSeasonOnPaper : W.lvl === "pro" ? proSeasonOnPaper : hsSeasonOnPaper);
    inWorld(W, () => { const k1 = OTHER, k2 = THIRD; OTHER = null; THIRD = null; try { yearEndReview(); } finally { OTHER = k1; THIRD = k2; } });
  });
}
function otherWorldFill() { [OTHER, THIRD].forEach(W => { if (W && W.review) inWorld(W, fillJobs); }); }

/* ---------- Moving between worlds ---------- */
// Taking a job in the other world: it starts with next season. Your old job opens at once, and the
// job you took comes off the other world's market.
function takeJobAcross(id) {
  const M = SEASON.market, R = SEASON.review, old = SEASON.myId;
  if (!R.why[old]) { R.open.push(old); R.why[old] = "left"; }
  SEASON.schools[old].coach = outsideCoach(SEASON.schools[old]);
  if (SEASON.schools[old].rating) SEASON.schools[old].rating.c = Math.round((SEASON.schools[old].coach.off + SEASON.schools[old].coach.def) / 2);
  const W = jobWorld(id), cls = W.schools[id].cls;
  W.review.why[id] = "taken";
  CAREER.next = { lvl: isPro(cls) ? "pro" : isCollege(cls) ? "col" : "hs", id, ctl: isPro(cls) ? !!M.ctl : false };
  Object.assign(M, { took: id, from: old, offer: null, done: true, stage: "done", transfers: [] });
  fillJobs(); otherWorldFill();
}
// After the season turns over in both worlds: you take the new job. The world you're leaving keeps
// going on paper.
function switchWorlds() {
  const nx = CAREER.next;
  if (!nx) return;
  CAREER.next = null;
  const leaving = SEASON, arriving = [OTHER, THIRD].find(w => w && w.schools[nx.id]);
  // Your old district or program goes back to paper (a pro team as short records)
  leaving.districts.forEach(d => d.ids.forEach(x => { const o = leaving.schools[x]; if (isFull(o)) { const sum = isPro(o.cls) ? proToPaper(o) : schoolSummary(o); if (!isPro(o.cls)) sum.rating = o.lvl === "col" ? colRating(o, leaving.year) : schoolRating(o); leaving.schools[x] = sum; } }));
  leaving.myId = null;
  if (leaving.lvl === "col" || leaving.lvl === "pro") leaving.districts = [{ n: 1, ids: [] }];
  SEASON = arriving;
  arrangeWorlds([leaving, OTHER, THIRD].filter(w => w && w !== arriving));
  if (nx.lvl === "pro") {
    if (CAREER.prep == null) CAREER.prep = startPrep(CAREER.crep);
    proTakeOver(nx.id);
    startProJob(nx.id, nx.ctl);
    proSetExpectations();
  } else if (nx.lvl === "col") {
    if (CAREER.crep == null) CAREER.crep = startCrep(CAREER.rep);
    colTakeOver(nx.id);
    startColJob(nx.id);
    colSetExpectations();
  } else hsTakeOver(nx.id);
  SEASON.yearReport = null;
}
// With SEASON set, the other two worlds go where they belong: OTHER is the one whose jobs sit next to
// yours (college from high school or the pros, high school from college), THIRD the one left
function arrangeWorlds(rest) {
  const lv = w => w.lvl === "col" ? "col" : w.lvl === "pro" ? "pro" : "hs", want = lv(SEASON) === "col" ? "hs" : "col";
  OTHER = rest.find(w => lv(w) === want) || null;
  THIRD = rest.find(w => w !== OTHER) || null;
}
// Taking over a high school from college: its district comes in full, with your coach and schemes
function hsTakeOver(id) {
  const t = SEASON.schools[id];
  if (t.cls !== SEASON.cls || t.district !== SEASON.district || !isFull(t)) {
    const wk = 0;
    classDistricts(t.cls)[t.district - 1].ids.forEach(x => { const sum = SEASON.schools[x]; if (isFull(sum)) return; const b = rebuildSchool(sum, wk); SEASON.schools[x] = Object.assign({}, sum, { players: b.players, depth: b.depth, mastery: b.mastery }); });
    Object.assign(SEASON, { cls: t.cls, district: t.district, districts: classDistricts(t.cls) });
    REBUILT.clear();
  }
  const s = SEASON.schools[id], c = CAREER.coach;
  s.coach = c;
  if (c.off_style && c.def_style) { s.off = c.off_style; s.def = c.def_style; }
  s.players.forEach(p => { p.o0 = ovr(p, p.pos); });
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  SEASON.myId = id;
  startJob(id);
  Object.assign(SEASON, { phase: "preseason", camp: 1 });
  setExpectations();
}

/* ---------- The high school state on paper ---------- */
// While you coach in college: the state's season is quick-simmed to its champions, the year-end
// review and coaching changes run for every school, and every school moves on a year
function hsSeasonOnPaper() {
  if (SEASON.phase === "over") return;
  if (SEASON.phase === "preseason" || SEASON.phase === "pick") { SEASON.phase = "regular"; SEASON.camp = 0; }
  for (let guard = 0; guard < LAST_WEEK + 2 && SEASON.phase !== "over"; guard++) {
    const n = SEASON.week;
    weekGames(n).forEach(gm => { if (!played(gm)) quickGame(gm); });
    SEASON.week = n + 1;
    if (n === REGULAR_WEEKS) makeBracket(); else if (n > REGULAR_WEEKS) nextRound();
  }
  finishState();
}
function hsNextOnPaper() {
  const old = SEASON;
  hsSeasonOnPaper();
  const keep = OTHER, k3 = THIRD; OTHER = null; THIRD = null;
  try { yearEndReview(); fillJobs(); } finally { OTHER = keep; THIRD = k3; }
  const champs = old.champs || {};
  const history = (old.history || []).concat(CLASSES.filter(c => champs[c]).map(c => ({ year: old.year, cls: c, id: champs[c], name: nameOf(champs[c]) })));
  advanceState();
  const year = old.year + 1, seed = hashSeed(`${old.world}:${year}`), g = dice(seed ^ 0x5eed);
  SEASON = { v: 1, seed, world: old.world, year, year0: old.year0, cls: old.cls, district: old.district, myId: null, schools: old.schools, districts: old.districts,
    weeks: makeSchedule(old.districts, g), week: 1, phase: "regular", camp: 0, pre: PRESEASON_WEEKS, bracket: null, champion: null,
    rot: "normal", depthMode: "always", nextDepth: null, stats: {}, news: {}, plan: old.plan, practice: null, cpuWeek: 0, film: null, injLog: {}, history,
    summer: old.summer || newSummer(), halls: null };
  REBUILT.clear();
  setExpectations();
  return SEASON;
}
function hsWorldNextYear() {
  const W = [OTHER, THIRD].find(w => w && w.schools && w.lvl !== "col" && w.lvl !== "pro");
  if (!W) return;
  setWorld(W, inWorld(W, hsNextOnPaper));
}

/* ---------- Counteroffers ---------- */
// When another school offers you a job, your college may counter with a raise and more years: more
// likely the more secure you are and the better your last season
function counterOf(id) {
  const J = CAREER.job, last = CAREER.seasons[CAREER.seasons.length - 1];
  if (!inCollege() || !J || J.lvl !== "col" || SEASON.review.fired) return null;
  const chance = clamp(.15 + (J.sec - 50) / 100 + (last && last.g > 0 ? .2 : 0), .1, .8);
  if (seededRandom(hashSeed(`${SEASON.seed}:${id}:counter`))() >= chance) return null;
  return { id, raise: .15, yrs: 2 };
}
function acceptCounter() {
  const M = SEASON.market, C = M && M.counter;
  if (!C || M.done) return false;
  const J = CAREER.job;
  J.pay = Math.round(J.pay * (1 + C.raise) / 5000) * 5000; J.yrs += C.yrs;
  M.tried[C.id] = "declined"; M.offer = null; M.counter = null; M.countered = true;
  stayPut();
  return true;
}

/* ---------- Moving within college ---------- */
// Your old program goes back to paper and the new one comes in full, as it stands at the end of the
// season, with your coach and schemes and a new contract
function colMoveWithin(id) {
  const M = SEASON.market, R = SEASON.review, old = SEASON.myId, from = SEASON.schools[old], c = CAREER.coach;
  if (!R.why[old]) { R.open.push(old); R.why[old] = "left"; }
  const sum = schoolSummary(from); sum.rating = colRating(from, SEASON.year); sum.coach = outsideCoach(from); sum.off = sum.coach.off_style; sum.def = sum.coach.def_style;
  SEASON.schools[old] = sum;
  const t = SEASON.schools[id], b = rebuildSchool(t, 0), s = Object.assign({}, t, { players: b.players, depth: b.depth, mastery: b.mastery });
  SEASON.schools[id] = s;
  s.coach = c;
  if (c.off_style && c.def_style) { s.off = c.off_style; s.def = c.def_style; }
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  Object.assign(SEASON, { myId: id, districts: [{ n: 1, ids: [id] }], district: 1 });
  startColJob(id);
  Object.assign(M, { took: id, from: old, offer: null, done: true, stage: "done", transfers: [] });
  REBUILT.clear();
  fillJobs(); otherWorldFill();
}

/* ---------- How a college season ended ---------- */
// "National champions", "Lost in the FBS playoff quarterfinals", "Won the Lone Pine Bowl", "No postseason"
function colFinishText(id) {
  const dv = divOf(SEASON.schools[id]), B = SEASON.post && SEASON.post[dv];
  if (!B) return "Season in progress";
  if (B.champ === id) return "National champions";
  let lost = null;
  B.rounds.forEach(rd => rd.forEach(([w, i]) => { const gm = SEASON.weeks[w - 1].games[i]; if (played(gm) && gameHas(gm, id) && loserOf(gm) === id) lost = gm; }));
  if (lost) return `Lost in the ${postName(lost).replace(/ at the .*$/, "")}`;
  if (B.seeds.includes(id)) return B.champ ? "Out of the playoff" : "Still in the playoff";
  const bowl = SEASON.weeks[COL_POST].games.find(gm => gm.bowl && !gm.post && gameHas(gm, id));
  if (bowl) return played(bowl) ? `${winnerOf(bowl) === id ? "Won" : "Lost"} the ${bowl.bowl}` : `Headed to the ${bowl.bowl}`;
  return "No postseason";
}
// Where a job is: "Class 4A, District 3", or "Division II, Heartland Conference"
function jobPlace(id) {
  const s = jobSchool(id), W = jobWorld(id) || SEASON, c = (W.confs || []).find(x => x.id === s.conf);
  if (isPro(s.cls)) return `The Sunday League, ${c ? c.name : ""}`;
  if (!isCollege(s.cls)) return `Class ${s.cls}, District ${s.district}`;
  return `${levelName(s.cls)}, ${c ? c.name : "Independent"}`;
}
const jobName = id => schoolName(jobSchool(id));

/* ---------- High school coaches moving up ---------- */
// Half the time, a Division III or II job with no college coach for it goes to the high school coach
// with the best reputation of at least 80 (never you). His high school gets a new coach.
function hsCoachUp(job) {
  const H = hsWorld();
  if (!H || seededRandom(hashSeed(`${SEASON.seed}:${job.id}:hsup`))() >= .5) return null;
  const best = Object.values(H.schools).filter(x => x.coach && !isYou(x.coach) && x.id !== H.myId && (x.coach.rep || 0) >= HS_TO_COL && !x.coach.movedUp).sort((a, b) => b.coach.rep - a.coach.rep)[0];
  if (!best) return null;
  const c = clone(best.coach);
  Object.assign(c, { rep: startCrep(c.rep), job: newJob() });
  best.coach.movedUp = true;
  const from = schoolName(best);
  best.coach = inWorld(H, () => outsideCoach(best));
  applyCoach(best);
  return { coach: c, from };
}
