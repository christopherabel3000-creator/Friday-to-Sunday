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
function relinkCareer() {
  if (CAREER && SEASON && SEASON.myId && SEASON.schools[SEASON.myId]) SEASON.schools[SEASON.myId].coach = CAREER.coach;
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
  return 1 + SEASON.districts[districtOf(id) - 1].ids.filter(x => x !== id && str(x) > str(id)).length;
}

/* ---------- The season summary ---------- */
// Your games this season, in order: { n, gm, opp, us, them, win }
function myGames() {
  const out = [], me = SEASON.myId;
  for (let n = 1; n <= LAST_WEEK; n++) {
    const gm = myGameIn(n);
    if (!gm || !played(gm)) continue;
    const us = gm.h === me ? gm.hs : gm.as, them = gm.h === me ? gm.as : gm.hs;
    out.push({ n, gm, opp: opponentIn(gm, me), us, them, win: us > them });
  }
  return out;
}
// How the season ended: "State champions", "Lost in the semifinals", "Missed the playoffs"
function finishText(id) {
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
    place: SEASON.week > REGULAR_WEEKS ? placeOf(me, REGULAR_WEEKS) : null, expect: SEASON.expect || null,
    finish: finishText(me), champ: SEASON.champion === me,
    leaders: { pass: statLeader("py"), rush: statLeader("ry"), rec: statLeader("rcy"), tk: statLeader("tk"), sck: statLeader("sck"), int: statLeader("int") }
  };
}
// A finished season goes into your career once
function recordCareerSeason() {
  if (!CAREER || !SEASON || SEASON.phase !== "over" || !SEASON.myId) return false;
  if (CAREER.seasons.some(x => x.seed === SEASON.seed)) return false;
  const me = SEASON.myId, r = fullRecord(me), s = mySchool();
  CAREER.seasons.push({ seed: SEASON.seed, year: SEASON.year, school: schoolName(s), color: s.color, w: r.w, l: r.l, place: placeOf(me, REGULAR_WEEKS), finish: finishText(me), champ: SEASON.champion === me });
  return true;
}
// "Season 1: Pine Hollow Pirates, 9-3, first in the district. Lost in the semifinals."
const careerLine = (x, i) => `${x.year || `Season ${i + 1}`}: ${x.school}, ${x.w}-${x.l}, ${ordWord(x.place - 1)} in the district. ${x.finish}.`;
