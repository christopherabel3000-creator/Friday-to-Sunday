// Friday to Sunday: your career. Your coach, the seasons you've finished, and the season summary.
"use strict";

/* ---------- Your career ---------- */
// CAREER: { v, coach, seasons: [{ seed, school, color, w, l, place, finish, champ }] }
// Your school's coach is the career's coach: the same object while the game runs. A save writes it
// twice, so relinkCareer joins them up again after a load.
let CAREER = null;
function newCareer(first, last, bg, off, def) {
  CAREER = { v: 1, coach: makeCoach(first, last, bg, off, def), seasons: [] };
  return CAREER;
}
// A coach from before you could create one: no name yet, no background, and 42 in everything
function legacyCoach() {
  const c = { first: "", last: "", you: true };
  COACH_RATINGS.forEach(([k]) => { c[k] = COACH_LEVEL["1A"]; });
  return c;
}
/* ---------- A coordinator's job (Milestone 6) ---------- */
// CAREER.job.role is "oc" or "dc" while you're a coordinator. The school you work at is still
// SEASON.myId (its roster, schedule and games are yours to see), but its coach is the computer head
// coach, who runs the program; your coach is CAREER.coach alone.
const coordRole = () => (CAREER && CAREER.job && COORD_ROLES[CAREER.job.role] && SEASON && SEASON.myId && SEASON.schools[SEASON.myId] ? CAREER.job.role : "");
// You run the program: the head coach of your school
const iRun = () => !!(SEASON && SEASON.myId && !coordRole());
// The school whose program you run, for the code that tells yours from the computer's
const progId = () => (iRun() ? SEASON.myId : null);
const headCoach = () => mySchool().coach;
const coordSideWord = () => COORD_SIDE[coordRole()] || "";
// "Coach Marsh", your head coach
const hcName = () => { const c = headCoach(); return c && c.last ? `Coach ${c.last}` : "The head coach"; };
function relinkCareer() {
  if (CAREER && SEASON && SEASON.myId && SEASON.schools[SEASON.myId] && !coordRole()) SEASON.schools[SEASON.myId].coach = CAREER.coach;
  dropStaleYou();
}
// Your coach belongs to one school only. A save from before November 2026 could leave him as the
// coach of a school you'd left (in the world you left), which stopped the offseason; that school
// gets a new coach.
function dropStaleYou() {
  if (typeof OTHER === "undefined") return;
  [SEASON, OTHER, THIRD].forEach(W => {
    if (!W || !W.schools) return;
    for (const id in W.schools) {
      const s = W.schools[id];
      if (id !== W.myId && s && isYou(s.coach)) {
        s.coach = inWorld(W, () => outsideCoach(s));
        if (s.rating && s.rating.c != null) s.rating.c = Math.round((s.coach.off + s.coach.def) / 2);
      }
    }
  });
}
const NAME_MAX = 20;
// Names as typed, without extra spaces, at most 20 characters
const cleanName = s => String(s || "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
// "Coach Christopher Abel", or "Your coach" before he has a name
const coachFullName = c => c && c.last ? `Coach ${c.first ? c.first + " " : ""}${c.last}` : "Your coach";
// How many of a coach's core plays (and calls) a school already knows well: "solid" or better
const KNOWS_AT = 65;
function coreKnown(s, off, def) {
  const m = s.mastery || {}, n = list => list.filter(id => (m[id] || 0) >= KNOWS_AT).length;
  return { off: n(CORE_PLAYS[off] || CORE_PLAYS.bal), def: n(CORE_CALLS[def] || CORE_CALLS.bal) };
}
// Where a school's talent ranked in its district before the season: 1 is the most talent
function talentRank(id) {
  const str = x => SEASON.schools[x].rating.off + SEASON.schools[x].rating.def;
  // (in college: in its conference, or 1 for an independent)
  const ids = worldy() ? ((SEASON.confs.find(c => c.id === SEASON.schools[id].conf) || { ids: [id] }).ids) : SEASON.districts[districtOf(id) - 1].ids;
  return 1 + ids.filter(x => x !== id && str(x) > str(id)).length;
}

/* ---------- The season summary ---------- */
// Your games this season, in order: { n, gm, opp, us, them, win }
function myGames() {
  const out = [], me = SEASON.myId;
  for (let n = 1; n <= (inPros() ? PRO_LAST : SEASON.lvl === "col" ? COL_LAST : LAST_WEEK); n++) {
    const gm = myGameIn(n);
    if (!gm || !played(gm)) continue;
    const us = gm.h === me ? gm.hs : gm.as, them = gm.h === me ? gm.as : gm.hs;
    out.push({ n, gm, opp: opponentIn(gm, me), us, them, win: us > them });
  }
  return out;
}
// How the season ended: "State champions", "Lost in the semifinals", "Missed the playoffs"
function finishText(id) {
  if (inPros()) return proFinishText(id);
  if (SEASON.lvl === "col") return colFinishText(id);
  if (SEASON.champion === id) return "State champions";
  const out = eliminatedIn(id);
  if (out) return out === PLAYOFF_ROUNDS.length ? "Lost in the state championship game" : `Lost in the ${PLAYOFF_ROUNDS[out - 1].toLowerCase()}`;
  if (inPlayoffs(id)) return "Still in the playoffs";
  return SEASON.week > REGULAR_WEEKS ? "Missed the playoffs" : "Season in progress";
}
// The leader in one stat among your players: [player, stats] or null
function statLeader(k) {
  const s = mySchool();
  let best = null;
  s.players.forEach(p => { const st = SEASON.stats[p.id]; if (st && (st[k] || 0) > 0 && (!best || st[k] > best[1][k])) best = [p, st]; });
  return best;
}
// Everything the summary screen shows
function seasonSummary() {
  const me = SEASON.myId, s = mySchool(), games = myGames(), all = fullRecord(me), reg = recordOf(me);
  const oppValue = id => { const r = fullRecord(id); return r.w - r.l + (SEASON.schools[id].rating.off + SEASON.schools[id].rating.def) / 1000; };
  const wins = games.filter(g => g.win), losses = games.filter(g => !g.win);
  const best = wins.slice().sort((a, b) => oppValue(b.opp) - oppValue(a.opp))[0] || null;
  const big = wins.slice().sort((a, b) => (b.us - b.them) - (a.us - a.them))[0] || null;
  const close = losses.slice().sort((a, b) => (a.them - a.us) - (b.them - b.us))[0] || null;
  const pf = games.reduce((t, g) => t + g.us, 0), pa = games.reduce((t, g) => t + g.them, 0);
  const improved = s.players.filter(p => p.o0 != null).map(p => [p, ovr(p, p.pos) - p.o0]).filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, d]) => ({ p, from: p.o0, to: ovr(p, p.pos), d }));
  return {
    all, reg, games, pf, pa, best, big, close, improved,
    place: inPros() ? placeOf(me, PRO_REG) : SEASON.lvl === "col" ? placeOf(me, COL_REG) : SEASON.week > REGULAR_WEEKS ? placeOf(me, REGULAR_WEEKS) : null, expect: SEASON.expect || null,
    finish: finishText(me), champ: inPros() ? SEASON.champion === me : SEASON.lvl === "col" ? !!(SEASON.post && SEASON.post[divOf(s)].champ === me) : SEASON.champion === me,
    leaders: { pass: statLeader("py"), rush: statLeader("ry"), rec: statLeader("rcy"), tk: statLeader("tk"), sck: statLeader("sck"), int: statLeader("int") }
  };
}
// A finished season goes into your career once
function recordCareerSeason() {
  if (!CAREER || !SEASON || SEASON.phase !== "over" || !SEASON.myId) return false;
  if (CAREER.seasons.some(x => x.seed === SEASON.seed)) return false;
  const me = SEASON.myId, r = fullRecord(me), s = mySchool();
  const col = SEASON.lvl === "col", pro = inPros();
  CAREER.seasons.push(gradeMySeason({ seed: SEASON.seed, year: SEASON.year, school: schoolName(s), color: s.color, w: r.w, l: r.l, t: r.t || 0, place: placeOf(me, pro ? PRO_REG : col ? COL_REG : REGULAR_WEEKS), finish: finishText(me),
    champ: col ? !!(SEASON.post && SEASON.post[divOf(s)].champ === me) : SEASON.champion === me }));
  // A season in your schemes: your coach installs them faster from now on (schemes.js)
  bumpSchemeYears(CAREER.coach, s, coordRole());
  return true;
}
// "Season 1: Pine Hollow Pirates, 9-3, first in the district. Lost in the semifinals."
const careerLine = (x, i) => `${x.year || `Season ${i + 1}`}: ${x.school}${x.cls ? ` (${x.lvl === "pro" ? "Pros" : x.lvl === "col" ? levelName(x.cls) : x.cls})` : ""}, ${x.w}-${x.l}${x.t ? `-${x.t}` : ""}, ${x.place <= 8 ? ordWord(x.place - 1) : `${x.place}th`} in the ${x.lvl === "pro" ? "division" : x.lvl === "col" ? "conference" : "district"}. ${x.finish}.${x.g != null ? ` Graded ${signed(x.g)}.` : ""}`;

/* ---------- XP ---------- */
// Your coach earns XP for winning games, upsets, the snaps your calls win, the playoffs and titles,
// and players getting better. CAREER.xp is what's left to spend, CAREER.xpAll everything ever earned,
// and SEASON.xp this season's: [{ w: week, n, why }].
const XP = { win: 10, pwin: 20, upset: 15, snaps: 4, playoffs: 15, district: 40, state: 60 };
const XP_WHY = { win: "a win", pwin: "a playoff win", upset: "an upset", snaps: "snaps your calls won", playoffs: "making the playoffs",
  district: "the district title", state: "the state title", growth: "your players getting better" };
// The same reasons in college and the pros: the conference or division title, the national title or
// the league's championship, the postseason, and postseason wins
function xpWhy(k) {
  const col = SEASON && SEASON.lvl === "col", pro = inPros();
  if (col || pro) {
    const w = { district: pro ? "the division title" : "the conference title", state: pro ? `winning the ${PRO_BOWL}` : "the national title",
      playoffs: pro ? "making the playoffs" : "making the postseason", pwin: pro ? "a playoff win" : "a postseason win" }[k];
    if (w) return w;
  }
  return XP_WHY[k] || k;
}
function giveXP(n, why, week) {
  n = Math.round(n);
  if (!CAREER || !SEASON || n <= 0) return 0;
  CAREER.xp = (CAREER.xp || 0) + n; CAREER.xpAll = (CAREER.xpAll || 0) + n;
  (SEASON.xp = SEASON.xp || []).push({ w: week, n, why });
  return n;
}
// After your game: a win, an upset (beating a team favored by 7 or more on paper), and a point for
// every 4 snaps your calls won while you were calling them (Gridiron Duel's verdict on each snap)
function gameXP(gm, me) {
  const n = SEASON.week, mine = SEASON.myId, opp = opponentIn(gm, mine), win = winnerOf(gm) === mine;
  if (win) {
    giveXP(isPlayoffWeek(n) ? XP.pwin : XP.win, isPlayoffWeek(n) ? "pwin" : "win", n);
    const [eh, ea] = expectedPoints(gm.h, gm.a, gm.neutral), favored = gm.h === opp ? eh - ea : ea - eh;
    if (favored >= 7) giveXP(XP.upset, "upset", n);
  }
  const won = (S.chart || []).filter(e => (e.hu & (1 << me)) && (e.o === me ? e.s > 0 : e.s < 0)).length;
  giveXP(Math.floor(won / XP.snaps), "snaps", n);
}
// The end of the regular season: making the playoffs, and the district title
function bracketXP(n) {
  const me = SEASON.myId;
  if (!inPlayoffs(me)) return;
  giveXP(XP.playoffs, "playoffs", n);
  if (SEASON.bracket.place[me] === 1) giveXP(XP.district, "district", n);
}
// The end of the season: the state title, and a point for every point your players' overall
// ratings went up since the season began
function seasonEndXP(n) {
  if (SEASON.xpDone) return;
  SEASON.xpDone = true;
  const me = SEASON.myId, s = mySchool();
  const champ = SEASON.lvl === "col" ? !!(SEASON.post && SEASON.post[divOf(s)] && SEASON.post[divOf(s)].champ === me) : SEASON.champion === me;
  if (champ) giveXP(XP.state, "state", n);
  // (a coordinator's players are his side's)
  const role = coordRole(), mine = role ? s.players.filter(p => COORD_POS[role].includes(p.pos)) : s.players;
  giveXP(mine.reduce((t, p) => t + Math.max(0, ovr(p, p.pos) - (p.o0 != null ? p.o0 : ovr(p, p.pos))), 0), "growth", n);
}
// XP by reason, most first: [[why, n]]
function xpBreakdown(entries) {
  const by = {};
  (entries || []).forEach(e => { by[e.why] = (by[e.why] || 0) + e.n; });
  return Object.keys(by).map(k => [k, by[k]]).sort((a, b) => b[1] - a[1]);
}
// Spending it: a rating point, or a perk. Each returns what to say, and whether it worked.
function raiseRating(k) {
  const c = CAREER && CAREER.coach, nm = (COACH_RATINGS.find(x => x[0] === k) || [])[1];
  if (!c || !nm) return { ok: false, say: "" };
  if (c[k] >= RATING_MAX) return { ok: false, say: `${nm} is as high as it goes.` };
  const cost = rateCost(c[k]), have = CAREER.xp || 0;
  if (have < cost) return { ok: false, say: `Raising ${nm} takes ${cost} XP. You have ${have}.` };
  CAREER.xp = have - cost; c[k]++;
  if (SEASON && SEASON.myId) mySchool().rating = schoolRating(mySchool());
  return { ok: true, say: `${nm} is ${c[k]}. ${CAREER.xp} XP left.` };
}
function learnPerk(k) {
  const c = CAREER && CAREER.coach, P = PERKS[k];
  if (!c || !P) return { ok: false, say: "" };
  if (coachHas(c, k)) return { ok: false, say: `${P.name}: learned. ${P.desc}` };
  const have = CAREER.xp || 0;
  if (have < P.cost) return { ok: false, say: `${P.name} takes ${P.cost} XP. You have ${have}.` };
  CAREER.xp = have - P.cost; (c.perks = c.perks || []).push(k);
  return { ok: true, say: `You learned ${P.name}. ${CAREER.xp} XP left.` };
}
