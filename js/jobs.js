// Friday to Sunday: the high school job market. What each school expects before a season, the
// season's grade against it, and your reputation.
"use strict";

/* ---------- Expectations ---------- */
// When a season opens, each class's season is played on paper 200 times from the schools' ratings,
// with the real schedule, and each school's averages are its expectation (SEASON.exp):
// { w: regular-season wins, pw: playoff wins, po, dt, ch: the chances of a playoff spot, the district
// title and the state title }. Because it uses the schedule, a weak district is expected to win more.
const EXPECT_SIMS = 200;
// The chance the home team wins a quick sim it's expected to win by m points (quick sims are close
// to a normal curve with a spread of 13.6 points)
const MARGIN_SD = 13.6;
function erfApprox(x) {
  const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const winProb = m => .5 * (1 + erfApprox(m / (MARGIN_SD * Math.SQRT2)));
// The schedule a class plays: yours is the season's, the others' are made from the season's seed
// (the same one their season on paper uses)
const paperSchedule = cls => makeSchedule(classDistricts(cls), dice(hashSeed(`${SEASON.seed}:${cls}:schedule`)));
const classSchedule = cls => cls === SEASON.cls ? SEASON.weeks : paperSchedule(cls);
function expectClass(cls) {
  const ds = classDistricts(cls), ids = ds.flatMap(d => d.ids), at = {}, N = ids.length;
  ids.forEach((id, i) => { at[id] = i; });
  const games = [];
  classSchedule(cls).forEach(w => w.games.forEach(gm => { const [mh, ma] = expectedPoints(gm.h, gm.a, gm.neutral); games.push([at[gm.h], at[gm.a], winProb(mh - ma), gm.dist]); }));
  // Playoff games: at a neutral site, from the two schools' ratings
  const po = (i, j) => { const [a, b] = expectedPoints(ids[i], ids[j], true); return winProb(a - b); };
  const sum = { w: new Float64Array(N), pw: new Float64Array(N), po: new Float64Array(N), dt: new Float64Array(N), ch: new Float64Array(N) };
  const rng = seededRandom(hashSeed(`${SEASON.seed}:${cls}:expect`));
  for (let sim = 0; sim < EXPECT_SIMS; sim++) {
    const w = new Int8Array(N), dw = new Int8Array(N), key = Float64Array.from({ length: N }, () => rng());
    games.forEach(([h, a, p, dist]) => { const win = rng() < p ? h : a; w[win]++; if (dist) dw[win]++; });
    // District standings: district wins, then all wins, then a coin flip
    const top = {};
    ds.forEach(d => { top[d.n] = d.ids.map(id => at[id]).sort((x, y) => dw[y] - dw[x] || w[y] - w[x] || key[y] - key[x]).slice(0, 2); });
    let field = BRACKET_ORDER.map(([d, place]) => top[d][place - 1]);
    field.forEach((i, k) => { sum.po[i]++; if (BRACKET_ORDER[k][1] === 1) sum.dt[i]++; });
    while (field.length > 1) {
      const next = [];
      for (let k = 0; k < field.length; k += 2) { const x = field[k], y = field[k + 1], win = rng() < po(x, y) ? x : y; sum.pw[win]++; next.push(win); }
      field = next;
    }
    sum.ch[field[0]]++;
    for (let i = 0; i < N; i++) sum.w[i] += w[i];
  }
  const r2 = v => Math.round(v / EXPECT_SIMS * 100) / 100, out = {};
  ids.forEach((id, i) => { out[id] = { w: r2(sum.w[i]), pw: r2(sum.pw[i]), po: r2(sum.po[i]), dt: r2(sum.dt[i]), ch: r2(sum.ch[i]) }; });
  return out;
}
// Every school's expectation for this season (or just one class's, when only it has changed)
function setExpectations(cls) {
  SEASON.exp = SEASON.exp || {};
  (cls ? [cls] : CLASSES).forEach(c => Object.assign(SEASON.exp, expectClass(c)));
  return SEASON.exp;
}
// A season from before expectations gets them from where the ratings stand now
const expectOf = id => (SEASON.exp && SEASON.exp[id]) || (inPros() ? proSetExpectations() : SEASON.lvl === "col" ? colSetExpectations() : setExpectations())[id];
// "about 6-4 and a playoff spot"
function expectWords(e) {
  if (inPros()) return proExpectWords(e);
  if (SEASON && SEASON.lvl === "col") return colExpectWords(e);
  const w = clamp(Math.round(e.w), 0, REGULAR_WEEKS), rec = `about ${w}-${REGULAR_WEEKS - w}`;
  const more = e.ch >= .25 ? "a run at the state title" : e.dt >= .5 ? "the district title" : e.po >= .5 ? "a playoff spot" : e.po >= .25 ? "a shot at the playoffs" : "";
  return more ? `${rec} and ${more}` : rec;
}
// "Expected: about 6-4 and a playoff spot (6.1 wins)."
const expectText = e => `Expected: ${expectWords(e)} (${plural(Math.round(e.w * 10) / 10, "win")}).`;

/* ---------- The season grade ---------- */
// Wins against expected wins, half of playoff wins against expected playoff wins, and rewards that
// count whatever was expected: half a point for each playoff win, a point for a district title and a
// point and a half for a state title. A title season grades about +8, a strong season about +4.
const GRADE = { po: .5, pwin: .5, dist: 1, state: 1.5 };
function seasonGrade(r, e) {
  if (!r || !e) return 0;
  const g = (r.rw - e.w) + GRADE.po * (r.pw - e.pw) + GRADE.pwin * r.pw + GRADE.dist * r.dt + GRADE.state * r.ch;
  return Math.round(g * 10) / 10;
}
const gradeWord = g => g >= 6 ? "a season to remember" : g >= 3 ? "far above expectations" : g >= 1 ? "above expectations" : g > -1 ? "met expectations" : g > -3 ? "below expectations" : "far below expectations";
// "+2.3" or "-1.0"
const signed = n => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}`;
// Every school's grade goes with its result when the state's season is over
function gradeState(res) {
  for (const id in res) res[id].g = seasonGrade(res[id], expectOf(id));
  return res;
}

/* ---------- Reputation ---------- */
// 0 to 100. A new coach starts at 20. Each season it moves by 3 times the grade, times the class's
// stage: a bigger class is a bigger stage. A bad season costs only half the stage's extra.
const REP_START = 20, REP_PER = 3;
const STAGE = { "1A": 1, "2A": 1.15, "3A": 1.3, "4A": 1.45, "5A": 1.6, "6A": 1.75 };
function repChange(g, cls) {
  const st = STAGE[cls] || 1;
  return Math.round(REP_PER * g * (g >= 0 ? st : 1 + (st - 1) / 2) * 10) / 10;
}
const newRep = (rep, g, cls) => clamp(Math.round((rep + repChange(g, cls)) * 10) / 10, 0, 100);
const repWord = r => r >= 85 ? "a legend" : r >= 70 ? "one of the state's best" : r >= 55 ? "a proven winner" : r >= 40 ? "a respected coach" : r >= 25 ? "a rising name" : "an unknown";
// (in college, your college reputation: cjobs.js)
const myRep = () => inPros() ? (CAREER && CAREER.prep != null ? CAREER.prep : PREP_START) : SEASON && SEASON.lvl === "col" ? (CAREER && CAREER.crep != null ? CAREER.crep : CREP_START) : CAREER && CAREER.rep != null ? CAREER.rep : REP_START;
// "Reputation 27: a rising name."
const repText = r => `Reputation ${Math.round(r)}: ${repWord(Math.round(r))}.`;
// Your season goes into your reputation once, when it's over. Returns the career's entry for it.
function gradeMySeason(entry) {
  const me = SEASON.myId, r = finishState()[me], e = expectOf(me), g = r.g != null ? r.g : seasonGrade(r, e);
  const lv = gameLevel(), cls = lv !== "hs" ? mySchool().cls : SEASON.cls, before = myRep(), after = newRep(before, g, cls);
  if (lv === "pro") CAREER.prep = after; else if (lv === "col") CAREER.crep = after; else CAREER.rep = after;
  return Object.assign(entry, { cls, lvl: lv, g, ew: e.w, rep: after, drep: Math.round((after - before) * 10) / 10 });
}
// What the grade was made of: "Expected about 6-4 and a playoff spot; you won 8 games and 1 playoff game, and the district title."
function gradeWhy(r, e) {
  const bits = [`won ${plural(r.rw, "regular-season game")}`];
  if (r.pw) bits.push(plural(r.pw, "playoff game"));
  const titles = [r.dt ? "the district title" : "", r.ch ? "the state title" : ""].filter(Boolean);
  return `Expected ${expectWords(e)}. You ${andList(bits)}${titles.length ? `, and ${andList(titles)}` : ""}.`;
}

/* ---------- Job security ---------- */
// 0 to 100; a new hire starts at 60. Each season it moves by 10 times the grade, and a bad grade
// counts more at a proud program: 1 + (tradition - 50) / 100 times as much. Nobody is fired after
// his first season. After his second, he's fired if both were a win short of expectations or worse.
// From the third on, he's fired under 25. job: { sec, ten: seasons at the school, tg: the first two
// grades there } (yours also has pay and id).
const SEC_START = 60, SEC_PER = 10, FIRE_AT = 25, SHORT = -1;
const adPatience = trad => 1 + ((trad == null ? 50 : trad) - 50) / 100;
// Boosters who care a lot are less patient too (money.js: boostPressure)
const newSec = (sec, g, trad, bst) => clamp(Math.round((sec + SEC_PER * g * (g < 0 ? adPatience(trad) * boostPressure(bst || 0) : 1)) * 10) / 10, 0, 100);
function firedAfter(J) {
  if (J.ten <= 1) return false;
  if (J.ten === 2) return J.tg.length >= 2 && J.tg[0] <= SHORT && J.tg[1] <= SHORT;
  return J.sec < FIRE_AT;
}
// Who decides your job: the athletic director, or in the pros the owner
const bossWord = () => inPros() ? "owner" : "athletic director";
const secWord = sec => sec >= 70 ? "Your job is safe." : sec >= 45 ? `The ${bossWord()} expects improvement.` : "You're on the hot seat.";
const patienceWord = trad => trad >= 65 ? `an impatient ${bossWord()}` : trad <= 35 ? `a patient ${bossWord()}` : `${bossWord() === "owner" ? "an owner" : "an athletic director"} who wants results`;
const newJob = () => ({ sec: SEC_START, ten: 0, tg: [] });

/* ---------- The stipend ---------- */
// High school head coaches are mostly teachers paid a coaching stipend: more at a bigger class, and
// $50 more a point of tradition over 50 (up to $2,000). A 3 percent raise for each of your first five
// seasons at a school, then it stays there.
const STIPEND = { "1A": 4000, "2A": 5500, "3A": 7000, "4A": 9000, "5A": 11500, "6A": 15000 };
const RAISE = .03, RAISE_YEARS = 5;
const stipendOf = s => STIPEND[s.cls] + Math.min(2000, 50 * Math.max(0, Math.round(s.trad) - 50));
const moneyText = n => "$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// Your job: taken when you pick a school or accept an offer. A career from before job security gets
// one at its school, counting the seasons already coached there.
function startJob(id) { CAREER.job = Object.assign(newJob(), { pay: stipendOf(SEASON.schools[id]), id }); return CAREER.job; }
function myJob() {
  if (!CAREER.job) {
    const J = startJob(SEASON.myId);
    J.ten = CAREER.seasons.filter(x => x.seed !== SEASON.seed).length;
  }
  return CAREER.job;
}

/* ---------- Computer coaches' careers ---------- */
// Every computer coach has an age, a career length (30 to 40 years, his own number), years coached, a
// reputation and job security. A coach from before careers gets them from his seed: a brand-new state
// spreads its coaches across their careers, with a reputation that fits their class.
const REP_BAR = { "1A": 0, "2A": 28, "3A": 40, "4A": 52, "5A": 64, "6A": 76 };
// What a school wants in a coach: its class's bar, plus 0.2 a point of tradition over 50
const jobBar = s => REP_BAR[s.cls] + .2 * Math.max(0, s.trad - 50);
const COACH_GROWTH_YEARS = 15, COACH_RATING_TOP = 95;
const isYou = c => !!(c && (c.you || (CAREER && c === CAREER.coach)));
function coachCareer(c, s) {
  if (!c || c.age != null || isYou(c)) return c;
  const g = dice(hashSeed(`${s.seed}:${c.first} ${c.last}:career`));
  const span = g.i(30, 40), yrs = g.i(0, span - 1), age0 = g.i(24, 35);
  const rep = clamp(Math.round(s.cls === "1A" ? g.n(16, 7) : REP_BAR[s.cls] + g.n(6, 8)), 3, 95);
  return Object.assign(c, { span, yrs, age: age0 + yrs, rep, job: { sec: clamp(Math.round(g.n(62, 12)), 30, 95), ten: 3, tg: [] } });
}
// A coach's ratings grow about a point a year for his first 15 years
function growCoach(c) {
  ROLLED_RATINGS.concat(["pbd", "rct"]).forEach(k => { if (c[k] != null) c[k] = Math.min(COACH_RATING_TOP, c[k] + 1); });
}
// A new coach from outside: young, with ratings in the 30s and 40s, and a reputation of 15
function outsideCoach(s) {
  const g = dice(hashSeed(`${s.seed}:${SEASON.year}:hire`)), c = genCoach(g, s.cls);
  ROLLED_RATINGS.forEach(k => { c[k] = clamp(Math.round(g.n(40, 5)), 30, 49); });
  delete c.pbd; c.pbd = coachPbd(c); delete c.rct; c.rct = coachRct(c);
  const span = g.i(30, 40);
  return Object.assign(c, { span, yrs: 0, age: g.i(24, 35), rep: 15, job: newJob() });
}
// A school with a new coach runs his schemes
function applyCoach(s) {
  s.off = s.coach.off_style; s.def = s.coach.def_style;
  if (s.rating) s.rating.c = Math.round((s.coach.off + s.coach.def) / 2);
}

/* ---------- The year-end review ---------- */
// After the season: every coach's reputation and job security move with his grade, computer coaches
// age and retire, and the athletic directors decide who stays. The jobs that open are the market's.
// SEASON.review: { open: [ids], why: { id: "retired", "fired" or "left" }, fired (you), sec, paid,
//   news: [lines], moves: [lines], filled }
// SEASON.market: { stage: "review", "news", "jobs" or "done", tried: { id: "no" or "declined" },
//   offer, fallback, took, from, transfers: [names], done }
function yearEndReview() {
  if (SEASON.review) return SEASON.review;
  // The other world's season is played out on paper too, and its coaching changes are in (cjobs.js)
  otherWorldReview();
  const res = finishState(), me = SEASON.myId, R = { open: [], why: {}, fired: false, news: [], moves: [], filled: false };
  if (CAREER && me) {
    recordCareerSeason();
    const entry = CAREER.seasons.find(x => x.seed === SEASON.seed), J = myJob(), s = mySchool();
    if (entry && entry.g == null) gradeMySeason(entry);
    const g = entry ? entry.g : 0;
    J.ten++; if (J.tg.length < 2) J.tg.push(g);
    J.sec = newSec(J.sec, g, patienceOf(s), inPros() ? 0 : boostersOf(s));
    R.paid = J.pay; CAREER.earned = (CAREER.earned || 0) + J.pay;
    if (J.lvl !== "col" && J.lvl !== "pro" && J.ten <= RAISE_YEARS) J.pay = Math.round(J.pay * (1 + RAISE));
    R.fired = firedAfter(J); R.sec = J.sec;
    // College contracts: a year off it each season. Fired with years left, you're paid most of them;
    // at the end of a contract that isn't ended, it's renewed with a raise.
    // (pro contracts work the same way, and a fired pro coach is paid all of what's left: pworld.js)
    if (J.lvl === "col" || J.lvl === "pro") {
      const pro = J.lvl === "pro";
      J.yrs = Math.max(0, (J.yrs || 0) - 1);
      if (R.fired && J.yrs > 0) { R.buyout = Math.round((pro ? PRO_BUYOUT : BUYOUT) * J.pay * J.yrs / 1000) * 1000; CAREER.earned += R.buyout; }
      else if (!R.fired && J.yrs === 0) { J.yrs = pro ? PRO_YEARS : COL_YEARS[s.cls]; J.pay = Math.round(J.pay * 1.05 / 5000) * 5000; R.renewed = true; }
    }
    // The pros: an extension may come with control of the roster, and your standing with the GM moves
    // with the season (pworld.js)
    if (J.lvl === "pro") proJobYear(J, R, g, s);
    if (entry) Object.assign(entry, { sid: me, sec: J.sec, fired: R.fired, pay: R.paid, pw: res[me].pw, po: res[me].po, dt: res[me].dt, ch: res[me].ch });
    if (R.fired) { R.open.push(me); R.why[me] = "fired"; }
  }
  for (const id in SEASON.schools) {
    if (id === me) continue;
    const s = SEASON.schools[id], c = coachCareer(s.coach, s), r = res[id], g = r ? r.g || 0 : 0;
    c.rep = newRep(c.rep, g, s.cls); c.age++; c.yrs++;
    if (c.yrs <= COACH_GROWTH_YEARS) growCoach(c);
    const J = c.job; J.ten++; if (J.tg.length < 2) J.tg.push(g);
    J.sec = newSec(J.sec, g, patienceOf(s), inPros() ? 0 : boostersOf(s));
    const why = c.yrs >= c.span ? "retired" : firedAfter(J) ? "fired" : "";
    if (why) { R.open.push(id); R.why[id] = why; }
  }
  // Boosters move with every school's season, and the computer schools build (money.js). Then the
  // last offers for the seniors, signing day, and the spring offers for the juniors (recruit.js).
  if (!inPros()) moneyYearEnd(res);
  if (CAREER && me && !worldy()) {
    R.post = offerWindow("post");
    const sg = signingDay();
    R.spring = offerWindow("spring");
    R.signRep = sg.rep;
  }
  SEASON.review = R;
  const sg = SEASON.signing, signNews = !!(sg && (sg.mine.length || sg.pending.length || (R.spring || []).length || (R.post || []).length));
  SEASON.market = { stage: signNews ? "signing" : "review", tried: {}, offer: null, fallback: null, took: null, from: null, transfers: [], done: false };
  R.news = carouselNews();
  checkFallback();
  return R;
}
// Who the news is about: your district, and the notable changes in your class (a firing at a proud
// program, or a state champion's coach)
const notable = id => { const s = SEASON.schools[id], r = SEASON.results && SEASON.results[id]; return s.trad >= 70 || !!(r && r.ch); };
const inMyDistrict = id => { const s = SEASON.schools[id]; if (worldy()) { const m = SEASON.myId && SEASON.schools[SEASON.myId]; return !!(m && s.conf && s.conf === m.conf); } return s.cls === SEASON.cls && s.district === SEASON.district; };
const NEWS_MAX = 8;
function carouselNews() {
  const R = SEASON.review, res = SEASON.results || {}, out = [];
  const mine = R.open.filter(id => id !== SEASON.myId), inCls = mine.filter(id => SEASON.schools[id].cls === SEASON.cls);
  out.push(inPros() ? `${plural(mine.length, "head coaching job is", "head coaching jobs are")} open in ${PRO_LEAGUE}.` : SEASON.lvl === "col" ? `${plural(mine.length, "head coaching job is", "head coaching jobs are")} open in college football.` : `${plural(mine.length, "head coaching job is", "head coaching jobs are")} open around the state, ${inCls.length} of them in Class ${SEASON.cls}.`);
  const line = id => {
    const s = SEASON.schools[id], c = s.coach, r = res[id];
    return R.why[id] === "retired" ? `Coach ${coachName(c)} retired from the ${nameOf(id)} after ${plural(c.yrs, "year")} of coaching.`
      : `The ${nameOf(id)} fired Coach ${coachName(c)}${r ? ` after a ${r.w}-${r.l} season` : ""}.`;
  };
  mine.filter(inMyDistrict).forEach(id => out.push(line(id)));
  inCls.filter(id => !inMyDistrict(id) && notable(id)).forEach(id => out.push(line(id)));
  return out.slice(0, NEWS_MAX);
}

/* ---------- The coaching carousel ---------- */
// Once your market is over, computer coaches fill the open jobs, best job first: each goes to the
// coach with the best reputation who clears its bar (or comes within 8 of it) and would be moving to
// a bigger class or a clearly better program in his own (30 points more tradition). A coach moves
// only after two seasons at his school. Each move opens his old job, which fills the same way, and
// whatever's left goes to new coaches from outside.
const jobValue = s => classIndex(s.cls) * 25 + s.trad * .3;
const MOVE_UP = 9, MOVE_AFTER = 2;
function fillJobs() {
  const R = SEASON.review;
  if (!R || R.filled) return;
  R.filled = true;
  const me = SEASON.myId, hired = new Set(), open = R.open.filter(id => id !== me), moves = [];
  const say = (id, c, from) => {
    if (!inMyDistrict(id) && !(SEASON.schools[id].cls === SEASON.cls && (notable(id) || (from && notable(from))))) return;
    moves.push(from ? `The ${nameOf(id)} hired Coach ${coachName(c)} from the ${nameOf(from)}${SEASON.schools[from].cls !== SEASON.schools[id].cls ? ` (${SEASON.schools[from].cls})` : ""}.` : `The ${nameOf(id)} hired Coach ${coachName(c)}, a newcomer.`);
  };
  for (let guard = 0; open.length && guard < 2000; guard++) {
    open.sort((a, b) => jobValue(SEASON.schools[b]) - jobValue(SEASON.schools[a]));
    const id = open.shift(), s = SEASON.schools[id], bar = jobBar(s) - 8, v = jobValue(s);
    let best = null;
    for (const x in SEASON.schools) {
      if (x === me || x === id || R.why[x] || open.includes(x)) continue;
      const o = SEASON.schools[x], c = o.coach;
      if (!c || isYou(c) || hired.has(c) || c.rep < bar || (c.job && c.job.ten < MOVE_AFTER)) continue;
      if (o.cls === s.cls ? jobValue(o) + MOVE_UP > v : classIndex(o.cls) > classIndex(s.cls)) continue;
      if (!best || c.rep > best.coach.rep) best = o;
    }
    if (best) {
      const c = best.coach;
      s.coach = c; c.job = newJob(); hired.add(c);
      R.why[best.id] = "left"; open.push(best.id);
      say(id, c, best.id);
    } else {
      // A Division III or II job with no college coach for it may go to one of the state's best high
      // school coaches (cjobs.js)
      // A pro job may go to one of the best power-conference coaches (pworld.js)
      const up = SEASON.lvl === "col" && HS_TO_COL_LEVELS.has(s.cls) ? hsCoachUp(s) : inPros() ? colCoachUp(s) : null;
      if (up) { s.coach = up.coach; hired.add(up.coach); moves.push(`The ${nameOf(id)} hired Coach ${coachName(up.coach)} from the ${up.from}, ${inPros() ? "in college" : "a high school"}.`); }
      else { s.coach = outsideCoach(s); hired.add(s.coach); say(id, s.coach, null); }
    }
    applyCoach(s);
  }
  R.moves = moves.slice(0, NEWS_MAX);
}

/* ---------- The job market ---------- */
// Only jobs that are interested in you are listed: your reputation against the school's bar. 10 or
// more over it is high interest, at or over it medium, and up to 8 under it low. You pursue one job at
// a time, and the school answers right away (its answer is rolled once a season, so it never changes).
// An offer has to be answered right away. If you're fired and every school says no, the 1A school
// with the weakest roster offers you its job, so you always have one.
const INTEREST_ODDS = { high: .85, medium: .55, low: .25 };
// (each school looks at the reputation for its own level: cjobs.js)
function interestIn(s) {
  // The pros: from a power-conference head coaching job only (pworld.js), and from the pros, college
  // jobs but no high school ones
  if (isPro(s.cls) && !inPros() && !(inCollege() && SEASON.myId && mySchool().cls === "P4" && (CAREER.crep || 0) >= COL_TO_PRO)) return "";
  if (inPros() && !isPro(s.cls) && !isCollege(s.cls)) return "";
  if (isCollege(s.cls) && !inCollege() && !inPros() && (!HS_TO_COL_LEVELS.has(s.cls) || ((CAREER && CAREER.rep) || 0) < HS_TO_COL)) return "";
  const d = jobRepFor(s) - jobBarFor(s); return d >= 10 ? "high" : d >= 0 ? "medium" : d >= -8 ? "low" : "";
}
// The jobs you can pursue: this world's, and the other world's that want you
function marketJobs() {
  const R = SEASON.review, M = SEASON.market;
  if (!R || !M) return [];
  return R.open.filter(id => id !== SEASON.myId && id !== (M.from || "") && !M.tried[id] && interestIn(SEASON.schools[id])).concat(otherJobs().filter(id => !M.tried[id]));
}
function weakest1A() {
  const str = s => s.rating.off + s.rating.def, low = inPros() ? "PRO" : SEASON.lvl === "col" ? "D3" : "1A";
  return Object.keys(SEASON.schools).filter(id => SEASON.schools[id].cls === low && id !== SEASON.myId).sort((a, b) => str(SEASON.schools[a]) - str(SEASON.schools[b]) || (a < b ? -1 : 1))[0];
}
function checkFallback() {
  const R = SEASON.review, M = SEASON.market;
  if (R.fired && !M.done && !M.offer && !marketJobs().length) { M.fallback = weakest1A(); M.offer = M.fallback; }
}
// Pursue a job: "offer", "no", or "" (not a job you can pursue right now)
function pursueJob(id) {
  const M = SEASON.market;
  if (!M || M.done || M.offer || !marketJobs().includes(id)) return "";
  const roll = seededRandom(hashSeed(`${SEASON.seed}:${id}:offer`))();
  if (roll < INTEREST_ODDS[interestIn(jobSchool(id))]) { M.offer = id; M.ctl = isPro(jobSchool(id).cls) ? offerHasControl(id) : false; return "offer"; }
  M.tried[id] = "no";
  checkFallback();
  return "no";
}
// Answer the offer: "took", "declined", or "" (no offer, or one you can't turn down)
function answerOffer(yes) {
  const M = SEASON.market, id = M && M.offer;
  if (!id || M.done) return "";
  // In college, your school may counter first (cjobs.js)
  if (yes && !M.countered && M.fallback !== id) { const C = counterOf(id); if (C) { M.counter = C; M.countered = true; return "counter"; } }
  if (yes) { M.counter = null; takeJob(id); return "took"; }
  if (M.fallback === id) return "";
  M.tried[id] = "declined"; M.offer = null;
  checkFallback();
  return "declined";
}
// Stay where you are: the market closes (not if you're fired, or with an offer to answer)
function stayPut() {
  const M = SEASON.market;
  if (!M || M.done || M.offer || SEASON.review.fired) return false;
  M.done = true; M.stage = "done";
  fillJobs(); otherWorldFill();
  return true;
}
// With nobody at the controls (a test, or a quick way through): stay, or if you're fired, take the
// first offer from the best interest down
function autoMarket() {
  yearEndReview();
  const M = SEASON.market;
  if (M.done) return;
  if (!SEASON.review.fired) { if (M.offer) answerOffer(false); if (stayPut()) return; }
  const rank = { high: 0, medium: 1, low: 2 };
  for (let guard = 0; guard < 400 && !M.done; guard++) {
    if (M.offer) { answerOffer(true); break; }
    const next = marketJobs().sort((a, b) => rank[interestIn(SEASON.schools[a])] - rank[interestIn(SEASON.schools[b])])[0];
    if (!next) { checkFallback(); if (!M.offer) break; continue; }
    pursueJob(next);
  }
}

/* ---------- Moving schools ---------- */
// After a move, the season that just ended was at another school
const movedSchools = () => !!(SEASON && SEASON.market && SEASON.market.took);
// Your career by school: [{ school, cls, from, to, w, l, pw, pl, dt, ch, pay }], oldest first.
// Seasons from before job security count by school name.
function careerBySchool() {
  const out = [];
  (CAREER.seasons || []).forEach(x => {
    const key = x.sid || x.school, last = out[out.length - 1];
    const st = last && last.key === key ? last : (out.push({ key, school: x.school, cls: x.cls || "1A", from: x.year, to: x.year, w: 0, l: 0, pw: 0, pl: 0, dt: 0, ch: 0, pay: 0 }), out[out.length - 1]);
    st.to = x.year; st.w += x.w; st.l += x.l; st.pw += x.pw || 0; st.pl += x.po && !x.ch ? 1 : 0; st.dt += x.dt ? 1 : 0; st.ch += x.ch ? 1 : 0; if (x.pay) st.pay = x.pay;
  });
  return out;
}
// "Bellmont Greyhounds (1A), 2026 to 2029: 28-14, 3-2 in the playoffs, 1 district title. Stipend $4,500."
function stintLine(st) {
  const yrs = st.from === st.to ? `${st.from}` : `${st.from} to ${st.to}`, bits = [`${st.w}-${st.l}`];
  if (st.pw || st.pl) bits.push(`${st.pw}-${st.pl} in the playoffs`);
  if (st.dt) bits.push(plural(st.dt, "district title"));
  if (st.ch) bits.push(plural(st.ch, "state title"));
  return `${st.school} (${st.cls}), ${yrs}: ${bits.join(", ")}.${st.pay ? ` Stipend ${moneyText(st.pay)}.` : ""}`;
}
// A few of your best returning players may follow you: each of your five best (not counting seniors)
// with a 15 percent chance
const TRANSFER_TOP = 5, TRANSFER_CHANCE = .15;
function transfersFrom(from, toId) {
  return from.players.filter(p => p.yr < 12).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).slice(0, TRANSFER_TOP)
    .filter(p => seededRandom(hashSeed(`${SEASON.seed}:${p.id}:${toId}:transfer`))() < TRANSFER_CHANCE);
}
// Your district goes back to paper, and the new one is rebuilt in full as it stands now
function switchDistrict(cls, d) {
  const wk = practiceWeeks();
  SEASON.districts[SEASON.district - 1].ids.forEach(x => { const o = SEASON.schools[x]; if (isFull(o)) { const sum = schoolSummary(o); sum.rating = schoolRating(o); SEASON.schools[x] = sum; } });
  classDistricts(cls)[d - 1].ids.forEach(x => {
    const sum = SEASON.schools[x];
    if (isFull(sum)) return;
    const b = rebuildSchool(sum, wk);
    SEASON.schools[x] = Object.assign({}, sum, { players: b.players, depth: b.depth, mastery: b.mastery });
  });
  Object.assign(SEASON, { cls, district: d, districts: classDistricts(cls) });
  REBUILT.clear();
}
function takeJob(id) {
  // A job in the other world starts next season; a move within college is its own (cjobs.js)
  if (otherWorldJob(id)) { takeJobAcross(id); return; }
  if (inPros()) { proMoveWithin(id); return; }
  if (SEASON.lvl === "col") { colMoveWithin(id); return; }
  const M = SEASON.market, R = SEASON.review, old = SEASON.myId, from = SEASON.schools[old], c = CAREER.coach;
  const moving = transfersFrom(from, id);
  // The money you raised stays with the school, and its next coach keeps the books
  delete from.fund;
  from.players = from.players.filter(p => !moving.includes(p));
  if (!R.why[old]) { R.open.push(old); R.why[old] = "left"; }
  const target = SEASON.schools[id];
  if (target.cls !== SEASON.cls || target.district !== SEASON.district) switchDistrict(target.cls, target.district);
  const s = SEASON.schools[id];
  // The players who followed you, with numbers nobody's wearing
  const used = new Set(s.players.map(p => p.num)), g = dice(hashSeed(`${SEASON.seed}:${id}:transfers`));
  moving.forEach(p => { if (used.has(p.num)) p.num = jerseyFor(g, p.pos, used); else used.add(p.num); p.inj = null; delete p.en; delete p.rest; p.o0 = ovr(p, p.pos); s.players.push(p); });
  // Your old school's coach is gone until the carousel fills the job
  SEASON.schools[old].coach = outsideCoach(SEASON.schools[old]);
  s.coach = c;
  if (c.off_style && c.def_style) { s.off = c.off_style; s.def = c.def_style; }
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  SEASON.myId = id; SEASON.halls = null;
  startJob(id);
  Object.assign(M, { took: id, from: old, offer: null, done: true, stage: "done", transfers: moving.map(p => fullName(p)) });
  // Your old school's job goes into the carousel with the rest
  fillJobs(); otherWorldFill();
}
