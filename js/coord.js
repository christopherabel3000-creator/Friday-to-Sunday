// Friday to Sunday: the coordinator path (Milestone 6). Coordinator jobs in the job market, taking
// one (and leaving one), your side's expectation and grade, and what happens to a coordinator when
// his head coach is fired, retires or moves on.
"use strict";

/* ---------- Coordinator jobs ---------- */
// A head coaching job is named by its school's id. A coordinator job is the school's id, "~", and the
// role: "4Ad3s5~oc". jobSid and jobRole take either apart.
const JOB_SEP = "~";
const jobRole = jid => { const k = String(jid || "").split(JOB_SEP)[1]; return COORD_ROLES[k] ? k : ""; };
const jobSid = jid => String(jid || "").split(JOB_SEP)[0];
const coordJobId = (id, role) => id + JOB_SEP + role;
// "1st", "2nd", "3rd", "11th", "21st"
const nth = n => { const t = n % 100, u = n % 10; return n + (t >= 11 && t <= 13 ? "th" : u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th"); };
// "Offensive coordinator, Ridgeline Chargers" for a coordinator job, the school's name for a head coaching job
const jobTitle = jid => jobRole(jid) ? `${COORD_ROLES[jobRole(jid)]}, ${jobName(jid)}` : jobName(jid);
// Where openings come from: each year about one school in fourteen loses a coordinator, rolled once from
// the season's seed. A school that's changing head coaches isn't hiring coordinators yet.
const COORD_OPEN = 70;
const COORD_ROLLS = new Map();
function coordOpenings(W) {
  if (!W || !W.schools) return [];
  const key = `${W.seed}:${W.lvl || "hs"}`;
  if (!COORD_ROLLS.has(key)) {
    if (COORD_ROLLS.size > 12) COORD_ROLLS.clear();
    const out = [];
    for (const id in W.schools) { const x = hashSeed(`${W.seed}:${id}:coordjob`) % 1000; if (x < COORD_OPEN) out.push(coordJobId(id, x % 2 ? "oc" : "dc")); }
    COORD_ROLLS.set(key, out);
  }
  const R = W.review;
  return COORD_ROLLS.get(key).filter(jid => { const id = jobSid(jid); return id !== W.myId && !(R && R.why[id]) && W.schools[id] && W.schools[id].coach && !isYou(W.schools[id].coach); });
}

/* ---------- Who wants you as a coordinator ---------- */
// A coordinator job is open to you well below the head coaching job at the same school, and across
// levels sooner. In high school: the school's head coaching bar minus 24. High school to college: a
// high school reputation of 55 for Division III and II, 65 for the FCS, 75 for the rest of FBS.
// In college: the level's bar minus 20. College to the pros: a college reputation of 55 from a
// power-conference job, or 65 as a head coach in the rest of FBS. In the pros: a small bar for
// proud teams.
const COORD_HS_OFF = 24, COORD_COL_OFF = 20;
const HS_TO_COL_COORD = { D3: 55, D2: 55, FCS: 65, G5: 75 };
const COL_TO_PRO_COORD = { P4: 55, G5: 65 };
const levelOf = cls => isPro(cls) ? "pro" : isCollege(cls) ? "col" : "hs";
const LEVEL_RANK = { hs: 0, col: 1, pro: 2 };
const hereLevel = () => inPros() ? "pro" : inCollege() ? "col" : "hs";
const tradBit = s => .2 * Math.max(0, (s.trad == null ? 50 : s.trad) - 50);
// [your reputation as that school sees it, its bar], or null when it isn't looking at you at all
function coordBar(s) {
  const lvl = levelOf(s.cls), here = hereLevel(), C = CAREER || {};
  if (lvl === "hs") return [C.rep != null ? C.rep : REP_START, Math.max(0, REP_BAR[s.cls] - COORD_HS_OFF) + tradBit(s)];
  if (lvl === "col") {
    if (here === "hs") { const need = HS_TO_COL_COORD[s.cls]; return need == null ? null : [C.rep || 0, need + tradBit(s) / 2]; }
    return [C.crep || 0, Math.max(0, COL_JOB_BAR[s.cls] - COORD_COL_OFF) + tradBit(s)];
  }
  if (here === "pro") return [C.prep || 0, tradBit(s)];
  if (here !== "col" || !SEASON.myId) return null;
  const mine = mySchool().cls, need = mine === "P4" ? COL_TO_PRO_COORD.P4 : mine === "G5" && iRun() ? COL_TO_PRO_COORD.G5 : null;
  return need == null ? null : [C.crep || 0, need + tradBit(s) / 2];
}
// A coordinator job is listed only when it's a step up: a higher level, or a program clearly bigger
// than yours (10 points more on the head coaching bar from a head coaching job, any more from a
// coordinator job). A coach who's been let go sees every job that would have him.
const hcBarOf = s => (REP_BAR[s.cls] || 0) + tradBit(s) + 100 * LEVEL_RANK[levelOf(s.cls)];
function coordStepUp(s) {
  const R = SEASON.review;
  if ((R && R.fired) || !SEASON.myId) return true;
  return hcBarOf(s) - hcBarOf(mySchool()) >= (iRun() ? 10 : .5);
}
function coordInterest(s) {
  const b = coordBar(s);
  if (!b || !coordStepUp(s)) return "";
  const d = b[0] - b[1];
  return d >= 10 ? "high" : d >= 0 ? "medium" : d >= -8 ? "low" : "";
}
// Any job's interest in you: a coordinator job, a head coaching job, your own school's job when it
// offers you a promotion, or the job your head coach wants you to follow him to
function interestInJob(jid) {
  const R = SEASON.review, s = jobSchool(jid);
  if (!s) return "";
  if (R && (R.follow === jid || (R.promo && jid === SEASON.myId))) return "high";
  return jobRole(jid) ? coordInterest(s) : interestIn(s);
}
const sureThing = jid => { const R = SEASON.review; return !!R && (R.follow === jid || (R.promo && jid === SEASON.myId)); };
// The head coaching jobs in your market
const hcJobs = () => marketJobs().filter(id => !jobRole(id));
// The coordinator jobs you can pursue, in every world
function coordJobs() {
  const M = SEASON.market, R = SEASON.review;
  if (!CAREER || !M || !R) return [];
  const out = [SEASON, OTHER, THIRD].flatMap(W => coordOpenings(W)).filter(jid => !M.tried[jid] && !!coordInterest(jobSchool(jid)));
  if (R.follow && !M.tried[R.follow] && !out.includes(R.follow)) out.unshift(R.follow);
  return out;
}

/* ---------- Pay ---------- */
// A high school coordinator's stipend is 40 percent of the head coach's. College and pro
// coordinators are paid in real dollars, more at a proud program and with a bigger reputation.
const COORD_STIPEND = .4;
const COORD_PAY = { D3: [35000, 60000], D2: [45000, 90000], FCS: [80000, 250000], G5: [250000, 900000], P4: [900000, 2500000], PRO: [1000000, 6000000] };
const COORD_YEARS = { D3: 1, D2: 1, FCS: 2, G5: 2, P4: 3, PRO: 2 };
function coordPay(s) {
  if (levelOf(s.cls) === "hs") return Math.round(COORD_STIPEND * stipendOf(s) / 50) * 50;
  const [lo, hi] = COORD_PAY[isPro(s.cls) ? "PRO" : s.cls], rep = isPro(s.cls) ? (CAREER.prep || 0) : (CAREER.crep || 0);
  return Math.round((lo + (hi - lo) * clamp(.5 * ((s.trad || 50) - 20) / 75 + .5 * rep / 100, 0, 1)) / 5000) * 5000;
}
const coordYears = s => (levelOf(s.cls) === "hs" ? 0 : COORD_YEARS[isPro(s.cls) ? "PRO" : s.cls]);

/* ---------- Taking a job, to or from a coordinator's job ---------- */
// The game's own moves put your coach in charge of the school you arrive at, and a new coach in
// charge of the one you left. For a coordinator both are put right afterwards: the school you join
// keeps its head coach and his side of the ball, and the one you left keeps its head coach.
// MOVE_AS: { role: the job you're taking, wasCoord: you were a coordinator } while a move is under way
let MOVE_AS = null;
const schoolKeep = s => ({ coach: s.coach, off: s.off, def: s.def });
// You settle in as a coordinator at school id, under the head coach it had
function coordSettle(id, role, pre) {
  const s = SEASON.schools[id], c = CAREER.coach;
  s.coach = pre.coach;
  if (role === "oc") proOffense(c, s);
  s.off = role === "oc" ? (c.off_style || pre.off) : pre.off;
  s.def = role === "dc" ? (c.def_style || pre.def) : pre.def;
  if (isFull(s)) s.rating = schoolRating(s); else if (s.rating) s.rating.c = Math.round((s.coach.off + s.coach.def) / 2);
  const J = CAREER.job || startJob(id);
  Object.assign(J, { id, role, pay: coordPay(s), sec: SEC_START, ten: 0, tg: [] });
  if (coordYears(s)) J.yrs = coordYears(s);
  if (J.lvl === "pro") J.ctl = false;
  return J;
}
// The school you left as a coordinator keeps the head coach it had
function coordLeave(old, pre, hadWhy) {
  const R = SEASON.review, s = SEASON.schools[old];
  if (!s) return;
  s.coach = pre.coach; s.off = pre.off; s.def = pre.def;
  if (isFull(s)) s.rating = schoolRating(s); else if (s.rating) s.rating.c = Math.round((s.coach.off + s.coach.def) / 2);
  if (!hadWhy && R) { delete R.why[old]; R.open = R.open.filter(x => x !== old); }
}
// Promoted: your school's head coaching job, when its coach is gone and the school wants you
function coordPromote() {
  const M = SEASON.market, R = SEASON.review, id = SEASON.myId, s = mySchool(), c = CAREER.coach, lvl = hereLevel();
  s.coach = c;
  proOffense(c, s);
  if (c.off_style && c.def_style) { s.off = c.off_style; s.def = c.def_style; }
  s.rating = schoolRating(s);
  if (lvl === "pro") startProJob(id, false); else if (lvl === "col") startColJob(id); else startJob(id);
  R.open = R.open.filter(x => x !== id); R.promoted = true;
  Object.assign(M, { took: id, from: null, offer: null, done: true, stage: "done", transfers: [], promoted: true });
  fillJobs(); otherWorldFill();
}
// Every move that starts or ends at a coordinator's job. (takeJob hands these over: jobs.js)
function coordTakeJob(jid) {
  const role = jobRole(jid), id = jobSid(jid), M = SEASON.market, R = SEASON.review, old = SEASON.myId, wasCoord = !!coordRole();
  if (!role && id === old) { coordPromote(); return; }
  const oldPre = schoolKeep(SEASON.schools[old]), hadWhy = !!R.why[old];
  // A job in another world starts next season
  if (otherWorldJob(id)) {
    if (!wasCoord) {
      if (!R.why[old]) { R.open.push(old); R.why[old] = "left"; }
      SEASON.schools[old].coach = outsideCoach(SEASON.schools[old]);
      if (SEASON.schools[old].rating) SEASON.schools[old].rating.c = Math.round((SEASON.schools[old].coach.off + SEASON.schools[old].coach.def) / 2);
    }
    const W = jobWorld(id), cls = W.schools[id].cls;
    if (!role) W.review.why[id] = "taken";
    CAREER.next = { lvl: levelOf(cls), id, ctl: !role && isPro(cls) ? !!M.ctl : false, role };
    Object.assign(M, { took: id, tookRole: role, from: old, offer: null, done: true, stage: "done", transfers: [] });
    fillJobs(); otherWorldFill();
    return;
  }
  // In your own world: the game's move, with the carousel held until the head coaches are put right
  const pre = schoolKeep(SEASON.schools[id]), lvl = hereLevel();
  MOVE_AS = { role, wasCoord };
  R.filled = true;
  try { if (lvl === "pro") proMoveWithin(id); else if (lvl === "col") colMoveWithin(id); else hsMoveWithin(id); }
  finally { MOVE_AS = null; R.filled = false; }
  if (wasCoord) coordLeave(old, oldPre, hadWhy);
  if (role) coordSettle(id, role, pre);
  M.tookRole = role;
  fillJobs(); otherWorldFill();
}
// Arriving in another world as a coordinator (switchWorlds: cjobs.js)
function coordArrive(id, role, pre) {
  coordSettle(id, role, pre);
  if (inPros()) proSetExpectations(); else if (inCollege()) colSetExpectations(); else setExpectations();
}

/* ---------- Your side's expectation and grade ---------- */
// What's expected of your side: the points a game your team is expected to score (or allow) over the
// regular season, from the same ratings the team's expectation uses. Set once, the first time it's
// asked for in a season. SEASON.uexp: { id, pf, pa, n }
const regWeeks = () => inPros() ? PRO_REG : inCollege() ? COL_REG : REGULAR_WEEKS;
function myRegGames() {
  const me = SEASON.myId, out = [];
  SEASON.weeks.slice(0, regWeeks()).forEach(w => w.games.forEach(gm => { if (gameHas(gm, me)) out.push(gm); }));
  return out;
}
function unitExpect() {
  const me = SEASON.myId;
  if (SEASON.uexp && SEASON.uexp.id === me) return SEASON.uexp;
  let pf = 0, pa = 0, n = 0;
  // (with your rating on your side of the ball in place of the head coach's, as the games are played)
  const sch = mySchool(), role = coordRole(), keep = sch.rating.c, hc = sch.coach, c = CAREER.coach;
  if (role && hc) sch.rating.c = Math.round(((role === "oc" ? c.off : hc.off) + (role === "dc" ? c.def : hc.def)) / 2);
  try { myRegGames().forEach(gm => { const [h, a] = expectedPoints(gm.h, gm.a, gm.neutral); pf += gm.h === me ? h : a; pa += gm.h === me ? a : h; n++; }); }
  finally { sch.rating.c = keep; }
  SEASON.uexp = { id: me, pf: n ? Math.round(pf / n * 10) / 10 : 0, pa: n ? Math.round(pa / n * 10) / 10 : 0, n };
  return SEASON.uexp;
}
// Points a game scored and allowed in the regular-season games played so far: { pf, pa, n }
function pointsOf(id) {
  let pf = 0, pa = 0, n = 0;
  SEASON.weeks.slice(0, regWeeks()).forEach(w => w.games.forEach(gm => { if (!gameHas(gm, id) || !played(gm)) return; pf += gm.h === id ? gm.hs : gm.as; pa += gm.h === id ? gm.as : gm.hs; n++; }));
  return { pf: n ? Math.round(pf / n * 10) / 10 : 0, pa: n ? Math.round(pa / n * 10) / 10 : 0, n };
}
// The schools your side is ranked against: your district, your conference, or the league
function unitGroup() {
  const s = mySchool();
  if (inPros()) return { ids: Object.keys(SEASON.schools), name: "the league" };
  if (inCollege()) { const c = (SEASON.confs || []).find(x => x.id === s.conf); return { ids: c ? c.ids : [s.id], name: c ? "the conference" : "the independents" }; }
  return { ids: SEASON.districts[SEASON.district - 1].ids, name: "the district" };
}
// Where your side stands: { rank, of, name, pts }
function unitRank(role) {
  const G = unitGroup(), k = role === "oc" ? "pf" : "pa", me = SEASON.myId;
  const rows = G.ids.map(id => [id, pointsOf(id)]).filter(x => x[1].n > 0), mine = rows.find(x => x[0] === me);
  if (!mine) return null;
  const better = rows.filter(x => role === "oc" ? x[1][k] > mine[1][k] : x[1][k] < mine[1][k]).length;
  return { rank: better + 1, of: rows.length, name: G.name, pts: mine[1][k] };
}
// "Offense: 27.4 points a game, 3rd of 8 in the district. Expected about 24."
function unitLine(role) {
  const U = unitExpect(), r = unitRank(role), oc = role === "oc", exp = Math.round(oc ? U.pf : U.pa);
  if (!r) return `${oc ? "Your offense is expected to score" : "Your defense is expected to allow"} about ${exp} points a game.`;
  return `${oc ? "Offense" : "Defense"}: ${r.pts} points a game${oc ? "" : " allowed"}, ${nth(r.rank)} of ${r.of} in ${r.name}. Expected about ${exp}.`;
}
// The grade: three parts your side against its expectation (2.5 points a game is a grade point) and
// one part the team's grade. A coordinator's seasons move reputation at 0.7 of a head coach's, and
// the best side in the group adds 2 more.
const UNIT_PER = 2.5, COORD_REP = .7, TOP_UNIT_REP = 2;
function unitGrade(role) {
  const U = unitExpect(), P = pointsOf(SEASON.myId);
  if (!P.n) return 0;
  return Math.round((role === "oc" ? P.pf - U.pf : U.pa - P.pa) / UNIT_PER * 10) / 10;
}
function coordGrade(entry) {
  const me = SEASON.myId, role = coordRole(), r = finishState()[me], e = expectOf(me), tg = r.g != null ? r.g : seasonGrade(r, e), ug = unitGrade(role);
  const g = Math.round((.75 * ug + .25 * tg) * 10) / 10, lv = gameLevel(), cls = lv !== "hs" ? mySchool().cls : SEASON.cls, rk = unitRank(role);
  const top = !!rk && rk.rank === 1 && rk.of >= 6, top5 = !!rk && rk.rank <= 5 && rk.of >= 10;
  const before = myRep(), after = clamp(Math.round((before + COORD_REP * repChange(g, cls) + (top ? TOP_UNIT_REP : 0)) * 10) / 10, 0, 100);
  if (lv === "pro") CAREER.prep = after; else if (lv === "col") CAREER.crep = after; else CAREER.rep = after;
  const P = pointsOf(me), U = unitExpect();
  return Object.assign(entry, { cls, lvl: lv, g, tg, ug, ew: e.w, rep: after, drep: Math.round((after - before) * 10) / 10, role,
    pts: role === "oc" ? P.pf : P.pa, epts: role === "oc" ? U.pf : U.pa, urank: rk ? rk.rank : 0, uof: rk ? rk.of : 0, top, top5 });
}

/* ---------- The year-end review for a coordinator ---------- */
// Your grade moves your reputation and the head coach's trust in you (your job security, on the same
// meter). The head coach can let you go by the same rules an athletic director uses.
function coordYearEnd(R) {
  recordCareerSeason();
  const me = SEASON.myId, entry = CAREER.seasons.find(x => x.seed === SEASON.seed), J = myJob(), s = mySchool(), res = finishState();
  const g = entry ? entry.g : 0;
  J.ten++; if (J.tg.length < 2) J.tg.push(g);
  J.sec = newSec(J.sec, g, 50, 0);
  R.paid = J.pay; CAREER.earned = (CAREER.earned || 0) + J.pay;
  R.fired = firedAfter(J); R.sec = J.sec; R.role = J.role;
  if (J.lvl !== "col" && J.lvl !== "pro") { if (J.ten <= RAISE_YEARS) J.pay = Math.round(J.pay * (1 + RAISE) / 50) * 50; }
  else {
    J.yrs = Math.max(0, (J.yrs || 0) - 1);
    if (R.fired && J.yrs > 0) { R.buyout = Math.round(BUYOUT * J.pay * J.yrs / 1000) * 1000; CAREER.earned += R.buyout; }
    else if (!R.fired && J.yrs === 0) { J.yrs = coordYears(s); J.pay = Math.round(J.pay * 1.05 / 5000) * 5000; R.renewed = true; }
  }
  if (entry) Object.assign(entry, { sid: me, sec: J.sec, fired: R.fired, pay: R.paid, pw: res[me].pw, po: res[me].po, dt: res[me].dt, ch: res[me].ch });
}
// The head coach's own year is in (he's a computer coach like any other). If he's gone, the school
// may offer you his job: a grade of +1 or better and a reputation within 10 of the school's bar.
// Otherwise the new coach keeps you about half the time, more often after a good grade, or brings
// his own staff, which pays out your contract and isn't a firing.
const PROMO_GRADE = 1, PROMO_WITHIN = 10;
function coordAfterReview(R) {
  const me = SEASON.myId, s = mySchool(), J = myJob(), entry = CAREER.seasons.find(x => x.seed === SEASON.seed), g = entry ? entry.g : 0;
  R.hc = coachName(s.coach);
  if (!R.why[me] && !R.fired) hcMoveEarly(R);
  if (!R.why[me]) return;
  R.hcGone = R.why[me];
  if (R.fired) return;
  if (g >= PROMO_GRADE && jobRepFor(s) >= jobBarFor(s) - PROMO_WITHIN) { R.promo = true; return; }
  const keep = clamp(.5 + .1 * g, .2, .9);
  if (seededRandom(hashSeed(`${SEASON.seed}:${me}:kept`))() < keep) { R.kept = true; return; }
  R.fired = true; R.letGo = true;
  if (J.yrs > 0) { R.buyout = Math.round(J.pay * J.yrs / 1000) * 1000; CAREER.earned = (CAREER.earned || 0) + R.buyout; }
  if (entry) entry.fired = false;
}
// Your head coach takes a bigger job before your market opens, when he's the coach the carousel
// would send there anyway: the best reputation of the coaches who clear its bar and would be moving
// up. He asks you to come with him, in the same role.
function hcMoveEarly(R) {
  const me = SEASON.myId, mine = mySchool(), c = mine.coach, role = coordRole();
  if (!c || !c.job || c.job.ten < MOVE_AFTER) return;
  const up = (o, s) => !(o.cls === s.cls ? jobValue(o) + MOVE_UP > jobValue(s) : classIndex(o.cls) > classIndex(s.cls));
  const open = R.open.filter(id => id !== me).sort((a, b) => jobValue(SEASON.schools[b]) - jobValue(SEASON.schools[a]));
  for (const id of open) {
    const s = SEASON.schools[id], bar = jobBar(s) - 8;
    if (c.rep < bar || !up(mine, s)) continue;
    const rival = Object.keys(SEASON.schools).some(x => {
      if (x === me || x === id || R.why[x]) return false;
      const o = SEASON.schools[x], k = o.coach;
      return !!k && !isYou(k) && k.rep > c.rep && k.rep >= bar && !(k.job && k.job.ten < MOVE_AFTER) && up(o, s);
    });
    if (rival) continue;
    s.coach = c; c.job = newJob(); applyCoach(s);
    R.open = R.open.filter(x => x !== id); R.open.push(me); R.why[me] = "left";
    R.follow = coordJobId(id, role); R.hcTo = id;
    return;
  }
}
// "Coach Marsh was fired.", "Coach Marsh retired.", "Coach Marsh took the Ridgeline job."
function hcGoneText(R) {
  const who = `Coach ${R.hc}`;
  return R.hcGone === "retired" ? `${who} retired.` : R.hcGone === "fired" ? `${who} was fired.` : R.hcGone === "left" ? `${who} took the ${R.hcTo ? jobName(R.hcTo) : "another"} job.` : "";
}
