// Friday to Sunday: the years. Graduation, growth over the summer, the classes of freshmen who come
// out for football, tradition, and the schools elsewhere in the state, rebuilt on paper for any year.
"use strict";

/* ---------- Freshman classes ---------- */
// Each year a class of freshmen comes out for football. How many depends on the school's enrollment
// and tradition, and how good they are on its tradition, plus some luck. The size and level of each
// class are kept with the school (classes: { [year]: { n, lv } }), so a school kept on paper can be
// rebuilt exactly in a later year, even after its tradition has changed.
// Your youth program (program.js: youth camp builds it) and the coach's Program building bring out
// more freshmen, and better ones.
function classParams(s, year) {
  const g = dice(hashSeed(`${s.seed}:${year}:class`)), y = s.youth || 0, pb = coachPbd(s.coach) - 42;
  const n = clamp(Math.round(4.5 + (s.enroll || 135) * .025 + ((s.trad || 50) - 50) * .03 + y * .25 + pb * .04 + g.n(0, 1.2)), 4, 13);
  const lv = CLASS_LEVEL[s.cls || "1A"] + Math.round(((s.trad || 50) - 50) * .06 + y * .8 + pb * .03 + g.n(0, 2));
  return { n, lv };
}
const classOf = (s, year) => (s.classes && s.classes[year]) || classParams(s, year);
// Who's in a class: over four years, about the mix of a whole roster. Every class has two linemen, a
// fast skill player and a defensive back. A passer comes out every other year and a kicker every
// other year too, so a roster almost always has a quarterback and a kicker.
const CLASS_POOL = { lineman: 2, speed: 1, runner: 3, bigath: 3, backer: 3 };
function classArchs(s, year, n, g) {
  const out = ["lineman", "lineman", "speed", "dback"];
  if ((year + s.seed) % 2 === 0) out.push(g.f() < .5 ? "passer" : "dual");
  if ((year + Math.floor(s.seed / 2)) % 2 === 0) out.push("kicker");
  while (out.length < n) out.push(g.w(CLASS_POOL));
  return out;
}
// A school's freshmen in a year, the same every time for the same school and year. Their potential is
// 5 higher than a freshman's in a brand-new state, since all four of their years are still ahead of
// them (that keeps a school's seniors about as good, year after year, as the ones the state began with).
const CLASS_POT = 5, FRESH_FLOOR = 12;
function genClass(s, year) {
  const P = classOf(s, year), g = dice(hashSeed(`${s.seed}:${year}:fresh`)), taken = new Set();
  const lastName = () => { for (let i = 0; i < 20; i++) { const n = g.pick(LAST_NAMES); if (!taken.has(n)) { taken.add(n); return n; } } return g.pick(LAST_NAMES); };
  return classArchs(s, year, P.n, g).map((arch, k) => {
    const p = genPlayer(g, { id: `${s.id}y${year}n${k + 1}`, arch, yr: 9, level: P.lv, last: lastName() });
    // Nobody comes out who can't play at all: a freshman starts at 12 or better at his position
    const lift = Math.max(0, FRESH_FLOOR - ovr(p, p.pos));
    if (lift) { for (const a in p.r) p.r[a] = Math.min(99, p.r[a] + lift); p.pot += lift; }
    p.pot = Math.min(99, p.pot + CLASS_POT); p.potSeen = clamp(potBand(p.pot) + (p.potSeen - potBand(p.pot - CLASS_POT)), 0, 3);
    return Object.assign(p, { from: year });
  });
}

/* ---------- A player's year ---------- */
// Each player's year has its own seeded dice, so a school kept on paper gets the same year every time
const playerRng = (s, p, year) => seededRandom(hashSeed(`${s.seed}:${p.id}:${year}`));
// A few players don't come back: they move, take a job, or pick another sport. The ones with less work
// ethic leave more often. Passers and kickers stay, so small rosters keep a quarterback and a kicker.
const STAY_ARCHS = new Set(["passer", "dual", "kicker"]);
const quitsAfter = (p, rng) => !STAY_ARCHS.has(p.arch) && rng() < .05 * clamp(1.5 - (p.eth || 50) / 100, .6, 1.3);
// The ratings that grow over the summer: everything that counts at his two positions
function summerAttrs(p) {
  const out = {};
  [p.pos, p.pos2].forEach(pos => { if (POS_INFO[pos]) for (const a in POS_INFO[pos].w) out[a] = 1; });
  return out;
}
// Growth over the summer, on top of the season's practice: a player matures, lifts and plays on his own.
// About 2 points at his position for a rising sophomore or junior, a little less for a rising senior,
// with work ethic and the coach's Development (opts.mul: anything extra). Nobody grows past potential.
const SUMMER_GROW = { 9: 1.9, 10: 2.1, 11: 1.7, 12: 0 };
const unitOfPos = pos => Object.keys(UNITS).find(u => UNITS[u][pos]);
function summerGrow(p, coach, rng, mul) {
  const amt = (SUMMER_GROW[p.yr] || 0) * ethMul(p) * devMul(coach) * unitGrowMul(coach, unitOfPos(p.pos)) * (mul || 1);
  if (amt <= 0) return;
  // In two steps, so growth near potential slows the way it does in practice
  for (let i = 0; i < 2; i++) growPlayer(p, summerAttrs(p), p.pos, amt / 2, rng, null);
  p.sta = Math.min(99, (p.sta || 50) + Math.round(rng() * 2));
}
// A season of practice on paper, for a player at a school nobody watches: what a balanced week does
// for his two positions, added up over the weeks (in steps, so growth near potential slows)
const PAPER_WEEKS = 14;
function seasonOnPaper(p, coach, rng) {
  const b = blocksOf(CPU_PLAN), dev = devMul(coach), steps = 5;
  [p.pos, p.pos2].forEach(pos => {
    const unit = unitOfPos(pos);
    if (!unit) return;
    const amt = GROW_RATE * effBlocks(b[unit]) * ethMul(p) * dev * (YEAR_GROW[p.yr] || 1) * PAPER_WEEKS / steps;
    for (let i = 0; i < steps; i++) growPlayer(p, UNITS[unit][pos], pos, amt, rng, null);
  });
  // Conditioning: stamina, and a little strength and speed
  const ce = effBlocks(b.cond) * PAPER_WEEKS;
  condition(p, .35 * ce * ethMul(p), rng, null);
  growPlayer(p, { str: .12, spd: .06 }, p.pos, GROW_RATE * ce * ethMul(p) * dev, rng, null);
}
// One player's year, from the end of one season to the next: graduation, leaving, then (on paper) the
// season's practice, and the summer. Returns "grad", "left" or "" (still on the team).
function playerYear(s, p, year, onPaper) {
  if (p.yr >= 12) return "grad";
  const rng = playerRng(s, p, year);
  if (quitsAfter(p, rng)) return "left";
  if (onPaper) seasonOnPaper(p, s.coach, rng);
  summerGrow(p, s.coach, rng, 1);
  p.yr++;
  return "";
}

/* ---------- Schools on paper, any year ---------- */
// A school outside your district as it stands at the start of a year: the roster it started with in
// the state's first year, or the classes that have come out since, each player taken through his
// years on paper. Only the last four classes matter, so this takes the same time in any year.
function rosterAt(sum, year) {
  const Y0 = SEASON.year0 || SEASON.year || year;
  // The first roster comes from the seed, with the tradition the school started with. Four years on,
  // everyone on it has graduated, and the school is all classes that came out since.
  let s;
  if (year < Y0 + 4) {
    const opts = { id: sum.id, cls: sum.cls, mascot: sum.mascot, town: sum.town, color: [sum.color, sum.colorName, sum.colorFam], trad: sum.trad0 != null ? sum.trad0 : sum.trad };
    s = genSchool(dice(sum.seed), opts);
    Object.assign(s, { seed: sum.seed, district: sum.district, colorFam: sum.colorFam, trad: sum.trad, classes: sum.classes, coach: clone(sum.coach), off: sum.off, def: sum.def });
    if (year <= Y0) return s;
  } else s = Object.assign({}, sum, { coach: clone(sum.coach), players: [] });
  let players = year < Y0 + 4 ? s.players : [];
  for (let E = Math.max(Y0 + 1, year - 3); E <= year; E++) players = players.concat(genClass(s, E));
  const used = new Set();
  const kept = players.filter(p => {
    for (let y = Math.max(p.from || Y0, Y0); y < year; y++) if (playerYear(s, p, y, true)) return false;
    return true;
  });
  // Numbers: the players who started with the school keep theirs, the new ones get free numbers
  kept.forEach(p => { if (p.num) used.add(p.num); });
  const g = dice(hashSeed(`${sum.seed}:${year}:numbers`));
  kept.forEach(p => { if (!p.num) p.num = jerseyFor(g, p.pos, used); });
  s.players = kept;
  s.depth = autoDepth(s);
  s.mastery = genMastery(dice(hashSeed(`${sum.seed}:${year}:book`)), s.off, s.def);
  return s;
}

/* ---------- Tradition ---------- */
// Tradition follows results, slowly: a tenth of the way toward this season's showing (winning
// percentage, plus 8 for each playoff win and 15 for a state title)
function newTradition(s, w, l, poWins, champ) {
  const perf = 100 * w / Math.max(1, w + l) + 8 * poWins + (champ ? 15 : 0);
  return clamp(Math.round(s.trad * .9 + perf * .1), 5, 95);
}

/* ---------- A school with its players, a year on ---------- */
// The end of a school's year, for real: the seniors graduate, a few players leave, everyone else
// grows over the summer and moves up a year, and the new freshmen come out. Injuries heal over the
// summer, and the team forgets some of its playbook. Returns { grads, left, fresh, grew }.
// A roster past 32 loses players off the bottom of the depth chart: kids who aren't getting on the
// field (not starting or first off the bench anywhere) quit, 3 percent more for each player past 32
const BIG_ROSTER = 32;
function benchQuits(s, year) {
  const n = s.players.length, plays = new Set();
  if (n <= BIG_ROSTER) return [];
  for (const pos in s.depth) (s.depth[pos] || []).slice(0, (STARTERS[pos] || 1) + 1).forEach(id => plays.add(id));
  const out = [];
  s.players = s.players.filter(p => {
    if (plays.has(p.id) || STAY_ARCHS.has(p.arch) || p.yr >= 12) return true;
    if (seededRandom(hashSeed(`${s.seed}:${p.id}:${year}:bench`))() < .03 * (n - BIG_ROSTER)) { out.push(p); return false; }
    return true;
  });
  return out;
}
function advanceSchool(s, year) {
  const rep = { grads: [], left: benchQuits(s, year), fresh: [], grew: [] }, before = {};
  s.players.forEach(p => { before[p.id] = ovr(p, p.pos); });
  s.players = s.players.filter(p => {
    const out = playerYear(s, p, year, false);
    if (out === "grad") rep.grads.push(p);
    if (out === "left") rep.left.push(p);
    if (!out) { p.inj = null; delete p.en; delete p.rest; }
    return !out;
  });
  rep.grew = s.players.map(p => [p.id, before[p.id], ovr(p, p.pos)]).filter(x => x[2] > x[1]).sort((a, b) => (b[2] - b[1]) - (a[2] - a[1]));
  // The new class, with numbers nobody's wearing
  const used = new Set(s.players.map(p => p.num)), g = dice(hashSeed(`${s.seed}:${year + 1}:numbers`));
  rep.fresh = genClass(s, year + 1);
  rep.fresh.forEach(p => { p.num = jerseyFor(g, p.pos, used); });
  s.players = s.players.concat(rep.fresh);
  // Where each player starts the new season, to see how far he comes
  s.players.forEach(p => { p.o0 = ovr(p, p.pos); });
  s.depth = autoDepth(s);
  for (const id in s.mastery || {}) s.mastery[id] = Math.round((s.mastery[id] - (s.mastery[id] - 30) * MASTERY_FORGET) * 100) / 100;
  s.rating = schoolRating(s);
  return rep;
}
// Over the summer a team slips 8 percent of the way back toward 30 on every play (a 72 becomes 69)
const MASTERY_FORGET = .08;

/* ---------- The state, a year on ---------- */
// Playoff games a school won this season
function playoffWins(id) {
  if (!SEASON.bracket) return 0;
  return SEASON.bracket.rounds.reduce((n, round) => n + round.filter(gm => played(gm) && winnerOf(gm) === id).length, 0);
}
// At the end of a season every school's year ends: tradition follows its results and its next class
// is set, then your district's schools graduate and grow for real and everyone else is rebuilt on
// paper for the new year (their quick-sim ratings come from that). Returns your school's report.
function advanceState() {
  const year = SEASON.year, next = year + 1;
  let mine = null;
  for (const id in SEASON.schools) {
    const s = SEASON.schools[id], r = fullRecord(id);
    if (s.trad0 == null) s.trad0 = s.trad;
    s.trad = newTradition(s, r.w, r.l, playoffWins(id), SEASON.champion === id);
    s.classes = s.classes || {};
    for (const k in s.classes) if (+k < next - 3) delete s.classes[k];
    s.classes[next] = classParams(s, next);
    if (isFull(s)) { const rep = advanceSchool(s, year); if (id === SEASON.myId) mine = rep; }
    else s.rating = schoolRating(rosterAt(s, next));
  }
  return mine;
}
// Your players' season stats go into their career totals
function keepCareerStats() {
  mySchool().players.forEach(p => {
    const st = SEASON.stats[p.id];
    if (!st) return;
    const c = p.cs || (p.cs = {});
    for (const k in st) c[k] = LONG_STATS.has(k) ? Math.max(c[k] || 0, st[k]) : (c[k] || 0) + st[k];
  });
}
// The two things a player will be remembered for: "2,104 passing yards and 18 touchdown passes"
function careerStatLine(cs) {
  if (!cs || !cs.g) return "";
  const n = numText, out = [];
  if ((cs.py || 0) >= 300) out.push(`${n(cs.py)} passing yards and ${plural(cs.ptd || 0, "touchdown pass", "touchdown passes")}`);
  if ((cs.ry || 0) >= 200) out.push(`${n(cs.ry)} rushing yards and ${plural(cs.rtd || 0, "rushing touchdown")}`);
  if ((cs.rcy || 0) >= 200) out.push(`${plural(cs.rec || 0, "catch", "catches")} for ${n(cs.rcy)} yards`);
  if ((cs.tk || 0) >= 20) out.push(plural(cs.tk, "tackle"));
  if ((cs.sck || 0) >= 3) out.push(plural(cs.sck, "sack"));
  if ((cs.int || 0) >= 2) out.push(plural(cs.int, "interception"));
  if ((cs.fgm || 0) >= 3) out.push(plural(cs.fgm, "field goal"));
  return out.slice(0, 2).join(", ");
}
const LEFT_WHY = ["moved away", "is playing another sport instead", "took an after-school job", "decided to stop playing"];
// What happened to your team over the year, kept with the new season for its report: the seniors who
// graduated and the players who left (as text, since they're gone), the freshmen, and who grew most
function yearReportOf(rep, year) {
  if (!rep) return null;
  const who = p => ({ name: fullName(p), pos: p.pos, ovr: ovr(p, p.pos), stats: careerStatLine(p.cs), why: LEFT_WHY[hashSeed(p.id + year) % LEFT_WHY.length] });
  const best = list => list.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
  return { from: year, grads: best(rep.grads).map(who), left: best(rep.left).map(who), fresh: rep.fresh.map(p => p.id), joined: (rep.joined || []).map(p => p.id),
    went: rep.went || 0, grew: rep.grew.slice(0, 10) };
}
