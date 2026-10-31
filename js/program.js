// Friday to Sunday: the offseason program. The summer (weights, 7-on-7, youth camp, hallway recruiting
// and study hall), the athletes you pitch in the hallways, and grades and eligibility.
"use strict";

/* ---------- The summer ---------- */
// Eight weeks of summer, shared out by weight (none 0 to heavy 3) like the practice plan. The plan
// carries over from year to year (SEASON.summer).
const SUMMER_WEEKS = 8;
const SUMMER_AREAS = [["weights", "Summer weights"], ["seven", "7-on-7 league"], ["camp", "Youth camp"], ["halls", "Hallway recruiting"], ["study", "Study hall"]];
const SUMMER_IDS = SUMMER_AREAS.map(a => a[0]);
const SUMMER_NAMES = Object.fromEntries(SUMMER_AREAS);
const SUMMER_DESC = {
  weights: "Strength, and a little speed, for everyone who shows up.",
  seven: "Passing, catching, routes and coverage, against other schools' players.",
  camp: "Camps for the kids in town. Next year's freshmen, and the classes after them, come out in bigger numbers and better.",
  halls: "Time to talk to athletes from other sports, and kids who don't play anything, about coming out for football: more pitches.",
  study: "Help for players whose grades need it, so fewer are ruled ineligible when report cards come out."
};
const newSummer = () => ({ weights: 2, seven: 2, camp: 2, halls: 2, study: 2 });
function summerWeeks(plan) {
  const tot = SUMMER_IDS.reduce((t, a) => t + (plan[a] || 0), 0), out = {};
  SUMMER_IDS.forEach(a => { out[a] = tot ? SUMMER_WEEKS * (plan[a] || 0) / tot : 0; });
  return out;
}
// Summer workouts are voluntary: who shows up depends on work ethic and the coach's Program building
const attendRate = (p, coach) => clamp(.45 + .5 * (p.eth || 50) / 100 + (coachPbd(coach) - 42) * .01, .2, .98);
// What 7-on-7 works on: passing for quarterbacks, hands and routes for backs, receivers and tight
// ends, coverage for linebackers and defensive backs
function sevenAttrs(p) {
  const at = [p.pos, p.pos2], a = {};
  if (at.includes("QB")) Object.assign(a, { acc: 1, arm: .4, awr: .5 });
  if (at.some(x => ["WR", "TE", "RB"].includes(x))) Object.assign(a, { hnd: 1, rte: .8 });
  if (at.some(x => ["CB", "S", "LB"].includes(x))) Object.assign(a, { cov: 1 });
  return Object.keys(a).length ? a : null;
}
// A point of growth per unit of this, times the weeks (to the 0.75 power, like practice blocks)
const SUMMER_K = .9, STUDY_K = 3.5;
// Your summer, for the players coming back (it happens before the year turns over in nextSeason).
// Youth camp builds up your youth program (s.youth), which makes the next classes bigger and better.
// Returns how many players showed up.
function runSummer(s, plan, year) {
  const wk = summerWeeks(plan), c = s.coach;
  let went = 0;
  s.players.forEach(p => {
    if (p.yr >= 12) return;
    const rng = seededRandom(hashSeed(`${s.seed}:${p.id}:${year}:summer`));
    if (rng() >= attendRate(p, c)) return;
    went++;
    const e = ethMul(p);
    if (wk.weights) growPlayer(p, { str: 1, spd: .3 }, p.pos, SUMMER_K * effBlocks(wk.weights) * e, rng, null);
    const a = sevenAttrs(p);
    if (wk.seven && a) growPlayer(p, a, p.pos, SUMMER_K * effBlocks(wk.seven) * e, rng, null);
    if (wk.study) { const gr = gradesOf(p); p.gr = Math.min(99, gr + Math.round(STUDY_K * effBlocks(wk.study) * (gr < 70 ? 1 : .3))); }
  });
  s.youth = Math.min(6, (s.youth || 0) * .6 + effBlocks(wk.camp) * .5);
  return went;
}

/* ---------- Hallway recruiting ---------- */
// Six students at school who aren't on the team: athletes from other sports and kids who don't play
// anything. Each is listed at the year he'll be next season. The same school and year always has the
// same six.
const SPORTS = [
  { id: "basketball", what: "plays basketball", archs: ["speed", "bigath", "dback"] },
  { id: "baseball", what: "plays baseball", archs: ["passer", "speed", "dback"] },
  { id: "track", what: "runs track", archs: ["speed", "runner", "dback"] },
  { id: "soccer", what: "plays soccer", archs: ["kicker", "kicker", "speed"] },
  { id: "wrestling", what: "wrestles", archs: ["lineman", "backer", "bigath"] },
  { id: "none", what: "doesn't play a sport", archs: ["lineman", "lineman", "bigath", "runner"] }
];
const INTEREST = ["not very interested", "a little interested", "interested"];
function hallProspects(s, year) {
  const g = dice(hashSeed(`${s.seed}:${year}:halls`)), out = [], taken = new Set(s.players.map(p => p.last));
  for (let k = 0; k < 6; k++) {
    const sp = g.pick(SPORTS), arch = g.pick(sp.archs), yr = g.i(10, 12);
    let last = g.pick(LAST_NAMES);
    for (let i = 0; i < 10 && taken.has(last); i++) last = g.pick(LAST_NAMES);
    taken.add(last);
    // The best athletes at a small school mostly play football already: these are a little behind a
    // typical player their age, and new to the game (less of a feel for it). The few really good
    // ones are the hardest to talk into it.
    const lv = (s.level || CLASS_LEVEL["1A"]) - 4;
    const p = genPlayer(g, { id: `${s.id}h${year + 1}n${k + 1}`, arch, yr, level: lv, last });
    p.r.awr = Math.max(1, p.r.awr - 8);
    let interest = +g.w({ 0: 3, 1: 4, 2: 2 });
    if (ovr(p, p.pos) >= lv + YEAR_MEAN[yr] + 10) interest = Math.max(0, interest - 1);
    Object.assign(p, { sport: sp.id, from: year + 1, interest });
    out.push(p);
  }
  return out;
}
// Pitches this offseason: one, plus the summer's hallway time, plus the Hallway recruiter perk
const pitchesFor = (plan, coach) => 1 + Math.round(effBlocks(summerWeeks(plan).halls)) + (coachHas(coach, "rec") ? 1 : 0);
// The chance an athlete says yes: his interest, your Program building and tradition, and the perk
const yesChance = (p, s) => clamp([.25, .5, .75][p.interest] + (coachPbd(s.coach) - 42) * .01 + ((s.trad || 50) - 50) * .003 + (coachHas(s.coach, "rec") ? .15 : 0), .05, .95);
// The offseason's hallways: SEASON.halls = { players, said: { id: "yes" | "no" } }
function hallsNow() {
  if (!SEASON.halls) SEASON.halls = { players: hallProspects(mySchool(), SEASON.year), said: {} };
  return SEASON.halls;
}
const pitchesLeft = () => Math.max(0, pitchesFor(SEASON.summer || newSummer(), mySchool().coach) - Object.keys(hallsNow().said).length);
// Pitches one athlete. Returns "yes", "no", or "" (no pitch left, or already asked).
function pitch(id) {
  const H = hallsNow(), p = H.players.find(x => x.id === id);
  if (!p || H.said[id] || !pitchesLeft()) return "";
  H.said[id] = rand() < yesChance(p, mySchool()) ? "yes" : "no";
  return H.said[id];
}
// The athletes who said yes join the team for next season (in nextSeason, after the year turns over)
function joinRecruits(s, halls) {
  if (!halls) return [];
  const used = new Set(s.players.map(p => p.num)), g = dice(hashSeed(`${s.seed}:${SEASON.year}:recruits`));
  const joined = halls.players.filter(p => halls.said[p.id] === "yes").map(p => Object.assign(clone(p), { o0: null }));
  joined.forEach(p => { p.num = jerseyFor(g, p.pos, used); p.o0 = ovr(p, p.pos); delete p.interest; s.players.push(p); });
  return joined;
}

/* ---------- Grades and eligibility ---------- */
// Every player has grades from 1 to 100, worked out from his work ethic and his own dice until study
// hall changes them (p.gr)
function gradesOf(p) {
  if (p.gr != null) return p.gr;
  const h = (hashSeed(`${p.id}:grades`) % 1000) / 1000;
  return clamp(Math.round(68 + ((p.eth || 52) - 52) * .4 + (h - .5) * 44), 20, 99);
}
// Report cards come out after weeks 4 and 8. A player under 55 may be ruled ineligible for the next
// two games: a 2.5 percent chance for each point under 55, at most half. Ineligible is kept like an
// injury (at: "grades"), so the depth chart plays the next man up; it heals a week at a time, and
// recovery doesn't speed it up.
const REPORT_WEEKS = [4, 8];
function reportCards(s, rng) {
  const out = [];
  s.players.forEach(p => {
    if (p.inj) return;
    const risk = clamp((55 - gradesOf(p)) * .025, 0, .5);
    if (risk > 0 && rng() < risk) { p.inj = { w: 1, at: "grades" }; out.push(p.id); }
  });
  return out;
}
const isOut = p => !!p.inj;
const outWord = p => p.inj && p.inj.at === "grades" ? "Ineligible" : "Injured";
