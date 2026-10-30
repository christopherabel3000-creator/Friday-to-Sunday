// Friday to Sunday: the season. The state's 1A schools, the schedule, results, district standings,
// the state playoffs, and quick sims of the games nobody's watching.
"use strict";

/* ---------- The state ---------- */
// Class 1A has 8 districts of 8 schools. The schools in your district have full rosters, and their
// games against each other run on the full engine. Everyone else is kept as a summary: ratings, plus
// the seed that rebuilds the whole school whenever you play them or look at their roster.
const DISTRICTS = 8, PER_DISTRICT = 8;
// A school's strength for quick sims: the average rating of its starters on each side, and its coach
function schoolRating(s) {
  return { off: sideRating(s, "off"), def: sideRating(s, "def"), c: Math.round((s.coach.off + s.coach.def) / 2) };
}
// Everything about a school except its players and playbook
function schoolSummary(s) {
  const out = {};
  for (const k in s) if (k !== "players" && k !== "depth" && k !== "mastery") out[k] = s[k];
  out.coach = clone(s.coach);
  return out;
}
const isFull = s => !!(s && s.players);
// Builds the state: every school, with full rosters only for the schools in district homeD
function genWorld(seed, homeD) {
  const g = dice(seed), towns = new Set(), mascots = g.shuffle(MASCOTS), schools = {}, districts = [];
  for (let d = 1; d <= DISTRICTS; d++) {
    // Every school in a district has its own color family, so district games never clash
    const ids = [], used = new Set();
    for (let k = 1; k <= PER_DISTRICT; k++) {
      const id = `d${d}s${k}`, color = g.pick(SCHOOL_COLORS.filter(c => !used.has(c[2])));
      used.add(color[2]);
      const opts = { id, cls: "1A", mascot: mascots[(d - 1) * PER_DISTRICT + k - 1], town: townName(g, towns), color, trad: clamp(Math.round(g.n(45, 18)), 5, 95) };
      const sseed = g.seed(), s = genSchool(dice(sseed), opts);
      Object.assign(s, { seed: sseed, district: d, colorFam: color[2] });
      s.rating = schoolRating(s);
      schools[id] = d === homeD ? s : schoolSummary(s);
      ids.push(id);
    }
    districts.push({ n: d, ids });
  }
  return { schools, districts };
}
// Rebuilds a whole school from its summary: the same seed builds the same school, as it stands at the
// start of this season (years.js). weeks: how many weeks of practice it has had this season, camp
// included, played out on paper with its own seeded dice (no injuries), so it has grown about as much
// as the schools you can watch.
function rebuildSchool(sum, weeks) {
  const s = rosterAt(sum, SEASON.year), pre = SEASON.pre || 0, first = SEASON.year === SEASON.year0;
  for (let w = 1; w <= (weeks || 0); w++) {
    const rng = seededRandom(hashSeed(first ? `${sum.seed}:${w}` : `${sum.seed}:${SEASON.year}:${w}`));
    practiceSchool(s, w <= pre ? CPU_CAMP : CPU_PLAN, rng, { noInjuries: true });
  }
  return Object.assign(s, { rating: sum.rating });
}
// Weeks of practice so far, camp included: this week's counts as soon as the week starts
const practiceWeeks = () => !SEASON || SEASON.phase === "pick" ? 0 : SEASON.phase === "preseason" ? SEASON.camp : (SEASON.pre || 0) + Math.min(SEASON.week, LAST_WEEK);
// A school with its players: the saved one in your district, or one rebuilt from its summary (kept
// while the page is open; games and roster screens only read it)
const REBUILT = new Map();
function seasonSchool(id) {
  const s = SEASON.schools[id];
  if (!s || isFull(s)) return s;
  const wk = practiceWeeks(), key = `${SEASON.seed}:${id}:${wk}`;
  if (!REBUILT.has(key)) REBUILT.set(key, rebuildSchool(s, wk));
  return REBUILT.get(key);
}

/* ---------- The schedule ---------- */
// Weeks 1 to 3: games against schools from other districts. Weeks 4 to 10: each district plays a
// round robin. Weeks 11 to 14: the state playoffs.
const REGULAR_WEEKS = 10, DISTRICT_START = 4, PLAYOFF_ROUNDS = ["First round", "Quarterfinals", "Semifinals", "State championship"];
const LAST_WEEK = REGULAR_WEEKS + PLAYOFF_ROUNDS.length;
const gameRec = (h, a, dist) => ({ h, a, dist: !!dist, hs: null, as: null, ot: 0 });
function makeSchedule(districts, g) {
  const weeks = [], homes = {}, dhomes = {}, wasHome = {};
  // Who hosts: the school with fewer home games so far (counting district games first in district
  // play), then the one that was away last week, then a coin flip. Everyone gets three or four district
  // home games and four to six in all.
  const host = (a, b, dist) => {
    const key = id => [dist ? dhomes[id] || 0 : 0, homes[id] || 0, wasHome[id] ? 1 : 0], ka = key(a), kb = key(b);
    let h = null;
    for (let i = 0; i < ka.length && !h; i++) if (ka[i] !== kb[i]) h = ka[i] < kb[i] ? a : b;
    if (!h) h = g.f() < .5 ? a : b;
    const v = h === a ? b : a;
    homes[h] = (homes[h] || 0) + 1;
    if (dist) dhomes[h] = (dhomes[h] || 0) + 1;
    wasHome[h] = true; wasHome[v] = false;
    return gameRec(h, v, dist);
  };
  for (let w = 1; w < DISTRICT_START; w++) {
    const games = [];
    // District d meets district d XOR w (counting from 0): a different district each week
    for (let d = 0; d < DISTRICTS; d++) {
      const e = d ^ w;
      if (e < d) continue;
      const A = g.shuffle(districts[d].ids), B = g.shuffle(districts[e].ids);
      A.forEach((id, k) => games.push(host(id, B[k], false)));
    }
    weeks.push({ n: w, games });
  }
  // The circle method: the first school stays put and the rest rotate one place a week
  for (let r = 0; r < PER_DISTRICT - 1; r++) {
    const games = [];
    districts.forEach(dist => {
      const ids = dist.ids, rot = [ids[0]].concat(ids.slice(1).map((_, i) => ids[1 + ((i + r) % (PER_DISTRICT - 1))]));
      for (let k = 0; k < PER_DISTRICT / 2; k++) games.push(host(rot[k], rot[PER_DISTRICT - 1 - k], true));
    });
    weeks.push({ n: DISTRICT_START + r, games });
  }
  districts.forEach(dist => balanceHomes(dist.ids, weeks.slice(DISTRICT_START - 1).flatMap(w => w.games)));
  return weeks;
}
// Now and then the greedy pick leaves a school with two or five district home games. Swapping who
// hosts fixes it: the school with too many gives one home game to the school with too few, directly
// or through a school that hosted one and visited the other.
function balanceHomes(ids, games) {
  const set = new Set(ids), dg = games.filter(gm => set.has(gm.h) && set.has(gm.a));
  const count = id => dg.filter(gm => gm.h === id).length, flip = gm => { const h = gm.h; gm.h = gm.a; gm.a = h; };
  for (let guard = 0; guard < 20; guard++) {
    const c = {}; ids.forEach(id => { c[id] = count(id); });
    const x = ids.find(id => c[id] > 4) || ids.slice().sort((a, b) => c[b] - c[a])[0];
    const y = ids.find(id => c[id] < 3) || ids.slice().sort((a, b) => c[a] - c[b])[0];
    if (c[x] <= 4 && c[y] >= 3) return;
    const direct = dg.find(gm => gm.h === x && gm.a === y);
    if (direct) { flip(direct); continue; }
    const z = ids.find(id => dg.some(gm => gm.h === x && gm.a === id) && dg.some(gm => gm.h === id && gm.a === y));
    if (!z) return;
    flip(dg.find(gm => gm.h === x && gm.a === z)); flip(dg.find(gm => gm.h === z && gm.a === y));
  }
}

/* ---------- A new season ---------- */
// SEASON: the season being played (saved with the app)
//   seed (this season's), world (the state's first seed), year, year0 (the state's first year), cls,
//   district (yours), myId (your school, null until you pick one), schools, districts,
//   weeks: [{ n, games: [{ h, a, dist, hs, as, ot }] }] (h is the home team), week: the week to play
//   next, phase: "pick", "preseason", "regular", "playoffs", "over" or "offseason", camp: the week of
//   preseason camp (1 to pre), pre: how many weeks of camp this season has, bracket: { slots, place, rounds },
//   champion, rot, depthMode, nextDepth: your rotation and depth chart choices (as in an exhibition),
//   stats: your players' season totals, news: { [week]: [lines] }, expect: where your school's talent
//   ranked in the district at the start of the season, history: the state champions of past years
//   [{ year, id, name }], yearReport: what happened to your team since last season (years.js)
let SEASON = null;
// Every season opens with three weeks of preseason camp: practice, and no games
const PRESEASON_WEEKS = 3;
const thisYear = () => new Date().getFullYear();
function newSeason(seed, year) {
  seed = seed == null ? newSeed() : seed;
  year = year || thisYear();
  const g = dice(seed ^ 0x5eed), district = g.i(1, DISTRICTS);
  const w = genWorld(seed, district);
  SEASON = { v: 1, seed, world: seed, year, year0: year, cls: "1A", district, myId: null, schools: w.schools, districts: w.districts, weeks: makeSchedule(w.districts, g),
    week: 1, phase: "pick", camp: 0, pre: PRESEASON_WEEKS, bracket: null, champion: null, rot: "normal", depthMode: "always", nextDepth: null, stats: {}, news: {},
    plan: newPlan(), practice: null, cpuWeek: -PRESEASON_WEEKS, film: null, injLog: {}, history: [] };
  return SEASON;
}
// The next season in the same state: every school's year ends (years.js), then a new schedule, and
// camp before week 1. Your players' season stats go into their career totals first.
function nextSeason() {
  const old = SEASON;
  if (!old || old.phase !== "offseason" || !old.myId) return null;
  keepCareerStats();
  const champ = old.champion, history = (old.history || []).concat(champ ? [{ year: old.year, id: champ, name: nameOf(champ) }] : []);
  const report = advanceState();
  const year = old.year + 1, seed = hashSeed(`${old.world}:${year}`), g = dice(seed ^ 0x5eed);
  SEASON = { v: 1, seed, world: old.world, year, year0: old.year0, cls: old.cls, district: old.district, myId: old.myId, schools: old.schools, districts: old.districts,
    weeks: makeSchedule(old.districts, g), week: 1, phase: "preseason", camp: 1, pre: PRESEASON_WEEKS, bracket: null, champion: null,
    rot: old.rot, depthMode: "always", nextDepth: null, stats: {}, news: {}, plan: old.plan, practice: null, cpuWeek: -PRESEASON_WEEKS, film: null, injLog: {}, history };
  SEASON.expect = talentRank(SEASON.myId);
  SEASON.yearReport = yearReportOf(report, old.year);
  REBUILT.clear();
  return SEASON.yearReport;
}
// You take over a school, and its coach's job, with your coach (career.js) and your schemes. The team
// still knows the old coach's playbook: yours gets learned in practice. Without a career (a test, or
// a save from before you could create a coach), you're an unnamed coach with the class average in
// every rating, running the school's schemes.
function pickSchool(id) {
  if (!SEASON || SEASON.phase !== "pick" || !SEASON.districts[SEASON.district - 1].ids.includes(id)) return false;
  const s = SEASON.schools[id];
  if (!CAREER) CAREER = { v: 1, coach: legacyCoach(), seasons: [] };
  const c = CAREER.coach;
  if (c.off_style && c.def_style) { s.off = c.off_style; s.def = c.def_style; } else { c.off_style = s.off; c.def_style = s.def; }
  SEASON.expect = talentRank(id);
  s.coach = c; s.rating = schoolRating(s);
  // Where each player started, to see how far he's come
  s.players.forEach(p => { p.o0 = ovr(p, p.pos); });
  SEASON.myId = id;
  // Camp first, then week 1
  if (SEASON.pre) { SEASON.phase = "preseason"; SEASON.camp = 1; } else SEASON.phase = "regular";
  return true;
}
const mySchool = () => SEASON.schools[SEASON.myId];
const nameOf = id => schoolName(SEASON.schools[id]);
const districtOf = id => SEASON.schools[id].district;
const isPlayoffWeek = n => n > REGULAR_WEEKS;
const weekName = n => n <= REGULAR_WEEKS ? `Week ${n}` : PLAYOFF_ROUNDS[n - REGULAR_WEEKS - 1];
// Practice weeks are numbered with the games: camp weeks come before week 1 (0, -1 and -2 for three
// weeks of camp)
const practiceSlot = () => SEASON.phase === "preseason" ? SEASON.camp - SEASON.pre : SEASON.week;
const practiceWeekName = n => n <= 0 ? `Camp week ${n + (SEASON.pre || PRESEASON_WEEKS)}` : weekName(n);
const inCamp = () => !!(SEASON && SEASON.phase === "preseason");
// A week's games: the schedule, or a playoff round
function weekGames(n) {
  if (n <= REGULAR_WEEKS) return (SEASON.weeks[n - 1] || { games: [] }).games;
  return (SEASON.bracket && SEASON.bracket.rounds[n - REGULAR_WEEKS - 1]) || [];
}
const gameHas = (gm, id) => gm.h === id || gm.a === id;
const gameOf = (n, id) => weekGames(n).find(gm => gameHas(gm, id)) || null;
const myGameIn = n => SEASON.myId ? gameOf(n, SEASON.myId) : null;
const played = gm => gm.hs != null;
const winnerOf = gm => gm.hs > gm.as ? gm.h : gm.a;
const loserOf = gm => gm.hs > gm.as ? gm.a : gm.h;
const opponentIn = (gm, id) => gm.h === id ? gm.a : gm.h;
// The last week that's been played all the way through
const weeksDone = () => SEASON.week - 1;

/* ---------- Records and standings ---------- */
// { w, l, dw, dl, pf, pa } in the regular season, through week upTo (all of it by default)
function recordOf(id, upTo) {
  const r = { w: 0, l: 0, dw: 0, dl: 0, pf: 0, pa: 0 };
  SEASON.weeks.forEach(wk => {
    if (upTo != null && wk.n > upTo) return;
    wk.games.forEach(gm => {
      if (!played(gm) || !gameHas(gm, id)) return;
      const mine = gm.h === id ? gm.hs : gm.as, theirs = gm.h === id ? gm.as : gm.hs, win = mine > theirs;
      r.pf += mine; r.pa += theirs;
      if (win) r.w++; else r.l++;
      if (gm.dist) { if (win) r.dw++; else r.dl++; }
    });
  });
  return r;
}
// The regular season plus the playoffs
function fullRecord(id) {
  const r = recordOf(id);
  if (SEASON.bracket) SEASON.bracket.rounds.forEach(round => round.forEach(gm => { if (played(gm) && gameHas(gm, id)) { if (winnerOf(gm) === id) r.w++; else r.l++; } }));
  return r;
}
const recText = r => `${r.w}-${r.l}`;
// A district's standings through week upTo, best first: [{ id, place, w, l, dw, dl, pf, pa, diff }].
// Ties on the district record go to head-to-head among the tied schools, then the overall record,
// then point differential in district games (at most 14 a game), then a coin flip.
function standings(d, upTo) {
  const ids = SEASON.districts[d - 1].ids, rec = {}, h2h = {}, diff = {};
  ids.forEach(id => { rec[id] = recordOf(id, upTo); diff[id] = 0; });
  SEASON.weeks.forEach(wk => {
    if (upTo != null && wk.n > upTo) return;
    wk.games.forEach(gm => {
      if (!played(gm) || !gm.dist || districtOf(gm.h) !== d) return;
      const m = clamp(gm.hs - gm.as, -14, 14), hw = gm.hs > gm.as ? 1 : -1;
      diff[gm.h] += m; diff[gm.a] -= m;
      h2h[gm.h + ">" + gm.a] = hw; h2h[gm.a + ">" + gm.h] = -hw;
    });
  });
  const net = id => rec[id].dw - rec[id].dl, all = id => rec[id].w - rec[id].l, coin = id => hashSeed(SEASON.seed + id) % 1000;
  const sorted = ids.slice().sort((a, b) => net(b) - net(a)), out = [];
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j < sorted.length && net(sorted[j]) === net(sorted[i])) j++;
    const group = sorted.slice(i, j), h = id => group.reduce((s, o) => s + (h2h[id + ">" + o] || 0), 0);
    group.sort((a, b) => h(b) - h(a) || all(b) - all(a) || diff[b] - diff[a] || coin(b) - coin(a));
    out.push(...group);
    i = j;
  }
  return out.map((id, k) => Object.assign({ id, place: k + 1, diff: diff[id] }, rec[id]));
}
const placeOf = (id, upTo) => standings(districtOf(id), upTo).find(r => r.id === id).place;
// Where a school stands in the playoff race after week n: "title" (has won the district), "in" (has
// a playoff spot), "out" (can't finish in the top two), or "" (still in the race). A tie could go
// either way, so a school has clinched only when nobody can draw level with it.
function raceStatus(id, n) {
  if (n < DISTRICT_START) return "";
  if (n >= REGULAR_WEEKS) { const p = placeOf(id, REGULAR_WEEKS); return p === 1 ? "title" : p === 2 ? "in" : "out"; }
  const ids = SEASON.districts[districtOf(id) - 1].ids, left = REGULAR_WEEKS - n, rec = {};
  ids.forEach(x => { rec[x] = recordOf(x, n); });
  const me = rec[id], others = ids.filter(x => x !== id), reach = others.filter(x => rec[x].dw + left >= me.dw).length;
  if (reach === 0) return "title";
  if (reach === 1) return "in";
  return others.filter(x => rec[x].dw > me.dw + left).length >= 2 ? "out" : "";
}

/* ---------- The playoffs ---------- */
// The top two in each district make a 16-team bracket. District champions host the first round, and
// two schools from the same district start in opposite halves, so they can only meet in the final.
const BRACKET_ORDER = [[1, 1], [2, 2], [3, 1], [4, 2], [5, 1], [6, 2], [7, 1], [8, 2], [2, 1], [1, 2], [4, 1], [3, 2], [6, 1], [5, 2], [8, 1], [7, 2]];
function makeBracket() {
  const top = {};
  for (let d = 1; d <= DISTRICTS; d++) top[d] = standings(d).slice(0, 2).map(r => r.id);
  const slots = BRACKET_ORDER.map(([d, place]) => top[d][place - 1]), place = {};
  BRACKET_ORDER.forEach(([, p], i) => { place[slots[i]] = p; });
  const round = [];
  for (let k = 0; k < slots.length; k += 2) round.push(Object.assign(gameRec(slots[k], slots[k + 1]), { po: 1 }));
  SEASON.bracket = { slots, place, rounds: [round] };
  SEASON.phase = "playoffs";
}
// The next round, once the last one is over. The better record hosts (then a district champion over
// a runner-up); the final is at a neutral site.
function nextRound() {
  const b = SEASON.bracket, last = b.rounds[b.rounds.length - 1];
  if (!last.every(played)) return;
  if (last.length === 1) { SEASON.champion = winnerOf(last[0]); SEASON.phase = "over"; return; }
  const n = b.rounds.length + 1, final = n === PLAYOFF_ROUNDS.length, round = [];
  for (let k = 0; k < last.length; k += 2) {
    const x = winnerOf(last[k]), y = winnerOf(last[k + 1]), rx = fullRecord(x), ry = fullRecord(y);
    const edge = (rx.w - rx.l) - (ry.w - ry.l) || b.place[y] - b.place[x] || (hashSeed(SEASON.seed + x + y) % 2 ? 1 : -1);
    round.push(Object.assign(edge > 0 ? gameRec(x, y) : gameRec(y, x), { po: n }, final ? { neutral: true, title: true } : {}));
  }
  b.rounds.push(round);
}
// How a school got into the bracket: "District 3 champions" or "District 3 runners-up"
const seedText = id => `District ${districtOf(id)} ${SEASON.bracket.place[id] === 1 ? "champions" : "runners-up"}`;
const inPlayoffs = id => !!(SEASON.bracket && SEASON.bracket.slots.includes(id));
// The round a school lost in (1 to 4), or 0
function eliminatedIn(id) {
  if (!SEASON.bracket) return 0;
  for (let r = 0; r < SEASON.bracket.rounds.length; r++) { const gm = SEASON.bracket.rounds[r].find(x => gameHas(x, id) && played(x)); if (gm && loserOf(gm) === id) return r + 1; }
  return 0;
}

/* ---------- Quick sims ---------- */
// Fit to the full engine (tests/season.js checks they agree): expected points from the offense's
// starters against the defense's, home field and the coaches. The points come from about 14 drives,
// each one ending in a touchdown now and then and a field goal once in a while, so the scores look
// like football scores.
const QUICK = { base: 9.56, off: 1.196, def: -.961, home: 2, coach: .147, drives: 14, fg: .12,
  // A touchdown and its try: the kick is good about two times in three, and plenty of small schools go for two
  td: [[7, .52], [6, .375], [8, .105]] };
const TD_AVG = QUICK.td.reduce((s, [v, p]) => s + v * p, 0);
// [home, away] expected points. rh, ra: ratings to use instead of the saved ones (your school as it
// would line up this week)
function expectedPoints(hId, aId, neutral, rh, ra) {
  const h = rh || SEASON.schools[hId].rating, a = ra || SEASON.schools[aId].rating, hh = neutral ? QUICK.home / 2 : QUICK.home, ha = neutral ? QUICK.home / 2 : 0;
  return [QUICK.base + QUICK.off * h.off + QUICK.def * a.def + hh + QUICK.coach * (h.c - a.c),
    QUICK.base + QUICK.off * a.off + QUICK.def * h.def + ha + QUICK.coach * (a.c - h.c)];
}
function tdPoints() { let x = rand(); for (const [v, p] of QUICK.td) { if (x < p) return v; x -= p; } return 7; }
function quickPoints(mu) {
  const per = (1 - QUICK.fg) * TD_AVG + QUICK.fg * 3, p = clamp(mu / (QUICK.drives * per), .005, .85);
  let pts = 0;
  for (let i = 0; i < QUICK.drives; i++) if (rand() < p) pts += rand() < QUICK.fg ? 3 : tdPoints();
  if (rand() < .03) pts += 2; // a safety
  return pts;
}
function quickGame(gm) {
  const [mh, ma] = expectedPoints(gm.h, gm.a, gm.neutral);
  let hs = quickPoints(mh), as = quickPoints(ma), ot = 0;
  // Tied: high school overtime, a series each from the 10 until someone wins
  const series = edge => rand() < clamp(.62 + .015 * edge, .3, .9) ? (rand() < .8 ? tdPoints() : 3) : 0;
  while (hs === as) { ot++; hs += series(mh - ma); as += series(ma - mh); if (ot >= 6 && hs === as) hs += 3; }
  Object.assign(gm, { hs, as, ot });
}

/* ---------- Practice ---------- */
// Your practice this week, with your plan, and the rest of your district's with a balanced week.
// Practice happens once a week: when you hold it, or on its own before the games are played.
const practiced = () => !!(SEASON.practice && SEASON.practice.week === practiceSlot());
// In camp there's no opponent to study, so opponent prep time goes into install
const campPlan = plan => Object.assign({}, plan, { areas: Object.assign({}, plan.areas, { install: (plan.areas.install || 0) + (plan.areas.prep || 0), prep: 0 }) });
const CPU_CAMP = campPlan(CPU_PLAN);
const planNow = () => inCamp() ? campPlan(SEASON.plan) : SEASON.plan;
function holdPractice() {
  const n = practiceSlot();
  if (practiced()) return SEASON.practice;
  cpuPractice(n);
  const camp = inCamp(), me = mySchool(), rep = practiceSchool(me, planNow(), rand), gm = camp ? null : myGameIn(n);
  Object.assign(rep, { week: n, focus: (SEASON.plan.focus || []).slice(), camp });
  // Opponent prep: film study of this week's opponent
  if (gm && !played(gm)) { rep.opp = opponentIn(gm, me.id); rep.film = filmStudy(seasonSchool(rep.opp), me); }
  me.rating = schoolRating(me);
  SEASON.practice = rep;
  return rep;
}
function cpuPractice(n) {
  if (SEASON.cpuWeek >= n) return;
  SEASON.cpuWeek = n;
  SEASON.districts[SEASON.district - 1].ids.forEach(id => {
    if (id === SEASON.myId) return;
    const s = SEASON.schools[id];
    practiceSchool(s, inCamp() ? CPU_CAMP : CPU_PLAN, rand);
    s.rating = schoolRating(s);
  });
}
// The end of a week of camp: injuries heal a week, and the schools elsewhere get a little better
function endOfCamp() {
  SEASON.districts[SEASON.district - 1].ids.forEach(id => {
    const s = SEASON.schools[id], mine = id === SEASON.myId;
    healSchool(s, mine ? SEASON.practice.blocks.rec : blocksOf(CPU_CAMP).rec, rand);
    s.rating = schoolRating(s);
  });
  for (const id in SEASON.schools) { const s = SEASON.schools[id]; if (!isFull(s)) { s.rating.off += WEEKLY_GROWTH; s.rating.def += WEEKLY_GROWTH; } }
}
// On to the next week of camp (practice happens first, if you haven't held it), or to week 1
function campNext() {
  if (!inCamp()) return false;
  holdPractice();
  endOfCamp();
  SEASON.camp++;
  if (SEASON.camp > SEASON.pre) { SEASON.phase = "regular"; SEASON.camp = 0; SEASON.expect = talentRank(SEASON.myId); }
  return true;
}
// The rest of camp, every practice held with your plan. Returns the week's practice reports.
function simCamp() {
  const reps = [];
  while (inCamp()) { if (!practiced()) reps.push(holdPractice()); campNext(); }
  return reps;
}
// Several practice reports as one: each rating and play from where it started to where it ended up,
// everyone who got hurt, and the plan of the last week
function mergeReports(reps) {
  if (!reps || !reps.length) return null;
  const last = reps[reps.length - 1], out = { blocks: last.blocks, contact: last.contact, grew: {}, mastery: [], hurt: [], fresh: last.fresh, prep: 0, ovr: [],
    week: reps[0].week, weeks: reps.length, camp: !!last.camp, focus: last.focus };
  reps.forEach(r => {
    for (const id in r.grew) {
      const g = out.grew[id] || (out.grew[id] = {});
      for (const a in r.grew[id]) { const [x, y] = r.grew[id][a]; g[a] = g[a] ? [Math.min(g[a][0], x), Math.max(g[a][1], y)] : [x, y]; }
    }
    r.mastery.forEach(([id, x, y]) => { const m = out.mastery.find(e => e[0] === id); if (m) { m[1] = Math.min(m[1], x); m[2] = Math.max(m[2], y); } else out.mastery.push([id, x, y]); });
    r.hurt.forEach(id => { if (!out.hurt.includes(id)) out.hurt.push(id); });
    r.ovr.forEach(([id, pos, was, now]) => { const o = out.ovr.find(e => e[0] === id && e[1] === pos); if (o) { o[2] = Math.min(o[2], was); o[3] = Math.max(o[3], now); } else out.ovr.push([id, pos, was, now]); });
  });
  return out;
}
// How much a typical school's starters improve each week on a balanced plan (tests/practice.js
// measures it), for the quick-sim ratings of the schools that only practice on paper
const WEEKLY_GROWTH = .14;
// The end of a week: injuries heal a week, and the schools elsewhere in the state get a little better
function endOfWeek() {
  SEASON.districts[SEASON.district - 1].ids.forEach(id => {
    const s = SEASON.schools[id], mine = id === SEASON.myId;
    const back = healSchool(s, mine ? (practiced() ? SEASON.practice.blocks.rec : blocksOf(SEASON.plan).rec) : blocksOf(CPU_PLAN).rec, rand);
    if (mine) injLog(SEASON.week).back = back;
    s.rating = schoolRating(s);
  });
  for (const id in SEASON.schools) { const s = SEASON.schools[id]; if (!isFull(s)) { s.rating.off += WEEKLY_GROWTH; s.rating.def += WEEKLY_GROWTH; } }
}

// Your injury news by week: who was hurt in the game, and who's back (the last few weeks are kept)
function injLog(n) {
  const L = SEASON.injLog || (SEASON.injLog = {});
  Object.keys(L).forEach(k => { if (+k < n - 2) delete L[k]; });
  return L[n] || (L[n] = { game: [], back: [] });
}

/* ---------- Film of your habits ---------- */
// Every coach you play has watched your earlier games: after each game, what your team called by
// situation goes into the season's film (older games count for less), and before the next one the
// other coach starts out knowing it. A better scout trusts it more.
function keepFilm(t) {
  const sc = S.scout && S.scout[t];
  if (!sc) return;
  const f = SEASON.film || (SEASON.film = { o: {}, d: {}, dp: {} });
  ["o", "d", "dp"].forEach(kind => {
    const dst = f[kind], src = sc[kind] || {};
    for (const key in dst) for (const id in dst[key]) dst[key][id] *= .6;
    for (const key in src) { const m = dst[key] || (dst[key] = {}); for (const id in src[key]) m[id] = (m[id] || 0) + src[key][id]; }
  });
}
function seedFilm(t, coach) {
  const f = SEASON.film, k = clamp((((coach && coach.sct) || 42) - 25) / 60, 0, 1) * .6;
  if (!f || k <= 0) return;
  const sc = scoutOf(t);
  ["o", "d", "dp"].forEach(kind => { for (const key in f[kind]) { const m = sc[kind][key] = {}; for (const id in f[kind][key]) m[id] = f[kind][key][id] * k; } });
}

/* ---------- Full games nobody's watching ---------- */
// The computer coaches both teams, then the game you were looking at (S) comes back
function simFullGame(gm) {
  const keep = S, kt = kickTD, ke = kickEnded;
  try {
    const hs = seasonSchool(gm.h), as = seasonSchool(gm.a);
    initGame({ level: "hs", cpu: [true, true], title: !!gm.title, neutral: !!gm.neutral }, [hs, as]);
    for (let i = 0; i < 8000 && S.phase !== "final"; i++) autoStep();
    Object.assign(gm, { hs: S.teams[0].score, as: S.teams[1].score, ot: Math.max(0, S.quarter - 4) });
    // Injuries stay with the schools that keep their rosters
    [hs, as].forEach((s, i) => { if (isFull(SEASON.schools[s.id])) keepInjuries(S.teams[i], s); });
  } finally { S = keep; kickTD = kt; kickEnded = ke; }
  if (gm.hs === gm.as) quickGame(gm);
}
// Plays this week's other games: on the full engine when both schools are in your district
function playOthers(n) {
  weekGames(n).forEach(gm => {
    if (played(gm) || gameHas(gm, SEASON.myId)) return;
    if (isFull(SEASON.schools[gm.h]) && isFull(SEASON.schools[gm.a])) simFullGame(gm); else quickGame(gm);
  });
}

/* ---------- Your games ---------- */
// Is the game in S your game this week?
const isMyGame = () => !!(S && S.teams && S.season && SEASON && S.season.seed === SEASON.seed && S.season.week === SEASON.week);
function myGameConfig(gm) {
  const mine = i => [gm.h, gm.a][i] === SEASON.myId, nd = SEASON.nextDepth, fresh = practiced() ? SEASON.practice.fresh : 100;
  return { level: "hs", cpu: [!mine(0), !mine(1)], rot: [mine(0) ? SEASON.rot : "normal", mine(1) ? SEASON.rot : "normal"],
    depth: [mine(0) && nd ? nd.depth : null, mine(1) && nd ? nd.depth : null], title: !!gm.title, neutral: !!gm.neutral,
    fresh: [mine(0) ? fresh : 100, mine(1) ? fresh : 100] };
}
// Kicks off your game this week, after the week's practice. A depth chart for the next game only is
// used up by it. Your team takes its film study into the game, and the other coach has watched yours.
function startMyGame() {
  const gm = myGameIn(SEASON.week);
  if (!gm || played(gm) || inCamp()) return false;
  holdPractice();
  initGame(myGameConfig(gm), [seasonSchool(gm.h), seasonSchool(gm.a)]);
  S.season = { seed: SEASON.seed, week: SEASON.week, my: SEASON.myId };
  const me = S.teams.findIndex(t => t.id === SEASON.myId), P = SEASON.practice;
  if (P && P.film && P.opp === S.teams[1 - me].id) {
    const pr = prepFrom(P.film, P.prep, mySchool().coach.sct);
    if (pr && coachHas(mySchool().coach, "film")) pr.k *= FILM_JUNKIE;
    S.teams[me].prep = pr;
  }
  seedFilm(me, S.teams[1 - me].coach);
  SEASON.nextDepth = null; SEASON.depthMode = "always";
  return true;
}
// The Film junkie perk: a quarter more edge on the calls you studied
const FILM_JUNKIE = 1.25;
// Stats that keep the best game instead of adding up
const LONG_STATS = new Set(["rl", "rcl", "fgl", "pul"]);
// Your game is over: its score goes in the schedule, and your players' stats into their season totals
function recordMyGame() {
  if (!isMyGame() || S.phase !== "final" || S.season.done) return false;
  const gm = myGameIn(SEASON.week);
  S.season.done = true;
  if (!gm || played(gm)) return false;
  Object.assign(gm, { hs: S.teams[0].score, as: S.teams[1].score, ot: Math.max(0, S.quarter - 4) });
  // Injuries go home with the players (the other school's too, when it keeps its roster), and your
  // calls go into the film other coaches will watch
  const me = S.teams.findIndex(t => t.id === SEASON.myId);
  injLog(SEASON.week).game = S.teams[me].players.filter(p => p.inj && !playerById(mySchool(), p.id).inj).map(p => p.id);
  S.teams.forEach(t => { const s = SEASON.schools[t.id]; if (isFull(s)) keepInjuries(t, s); });
  keepFilm(me);
  S.teams.find(t => t.id === SEASON.myId).players.forEach(p => {
    const st = S.ps[p.id];
    if (!st) return;
    const tot = SEASON.stats[p.id] || (SEASON.stats[p.id] = { g: 0 });
    tot.g++;
    for (const k in st) tot[k] = LONG_STATS.has(k) ? Math.max(tot[k] || 0, st[k]) : (tot[k] || 0) + st[k];
  });
  gameXP(gm, me);
  return true;
}
// Sims your game this week (your coach calls it). The finished game stays in S for its box score.
function simMyGame() {
  const gm = myGameIn(SEASON.week);
  if (!gm || played(gm) || inCamp()) return false;
  if (!isMyGame() || S.phase === "final") startMyGame();
  simToEnd();
  return recordMyGame();
}
// The rest of the week, once your game is in: everyone else's games, the news, then the next week
// (or the bracket, the next round, or the end of the season). Returns the week it finished.
function finishWeek() {
  const n = SEASON.week, gm = myGameIn(n);
  if (!["regular", "playoffs"].includes(SEASON.phase) || (gm && !played(gm))) return 0;
  cpuPractice(n);
  playOthers(n);
  endOfWeek();
  SEASON.week = n + 1;
  if (n === REGULAR_WEEKS) { makeBracket(); bracketXP(n); }
  else if (n > REGULAR_WEEKS) nextRound();
  writeNews(n);
  // A finished season goes into your career (career.js)
  if (SEASON.phase === "over") { seasonEndXP(n); recordCareerSeason(); }
  return n;
}
// Sims everything up to the week before stopAt (the end of the season by default), your games too,
// and the rest of camp first
function simSeason(stopAt) {
  if (inCamp()) simCamp();
  for (let guard = 0; guard < LAST_WEEK + 2 && SEASON.phase !== "over" && SEASON.phase !== "pick" && SEASON.week < (stopAt || 99); guard++) {
    simMyGame();
    if (!finishWeek()) break;
  }
}

/* ---------- News ---------- */
// A few lines after each week: upsets, overtime games, unbeaten teams in your district, who has
// clinched what, and the playoffs. The most interesting first, and never more than five.
function writeNews(n) {
  const lines = [], me = SEASON.myId, home = id => districtOf(id) === SEASON.district;
  weekGames(n).forEach(gm => {
    if (!played(gm) || gameHas(gm, me)) return;
    const w = winnerOf(gm), l = loserOf(gm), score = `${Math.max(gm.hs, gm.as)}-${Math.min(gm.hs, gm.as)}`;
    const [eh, ea] = expectedPoints(gm.h, gm.a, gm.neutral), favoredBy = (w === gm.h ? ea - eh : eh - ea);
    const local = home(w) || home(l) ? 2 : 0;
    if (favoredBy >= 9) lines.push({ p: 3 + local + (isPlayoffWeek(n) ? 2 : 0), t: `Upset: ${nameOf(w)} beat ${nameOf(l)}, ${score}.` });
    else if (gm.ot) lines.push({ p: 2 + local, t: `${nameOf(w)} beat ${nameOf(l)} ${score} in ${gm.ot > 1 ? `${gm.ot} overtimes` : "overtime"}.` });
  });
  if (n >= DISTRICT_START && n <= REGULAR_WEEKS) {
    SEASON.districts[SEASON.district - 1].ids.forEach(id => {
      const now = raceStatus(id, n), before = raceStatus(id, n - 1), who = id === me ? "You" : nameOf(id);
      if (n === REGULAR_WEEKS) {
        if (now === "title") lines.push({ p: 9, t: `${who} won the District ${SEASON.district} title.` });
        else if (now === "in") lines.push({ p: 8, t: `${who} took the district's other playoff spot.` });
        else if (id === me) lines.push({ p: 7, t: "You missed the playoffs." });
      } else if (now === "title" && before !== "title") lines.push({ p: 8, t: `${who} clinched the District ${SEASON.district} title.` });
      else if (now === "in" && before !== "in" && before !== "title") lines.push({ p: 7, t: `${who} clinched a playoff spot.` });
      else if (now === "out" && before !== "out" && id === me) lines.push({ p: 7, t: "You're out of the playoff race." });
    });
  }
  if (n < REGULAR_WEEKS) SEASON.districts[SEASON.district - 1].ids.forEach(id => {
    const r = recordOf(id, n);
    if (id !== me && r.l === 0 && r.w >= 5) lines.push({ p: 1, t: `${nameOf(id)} are still unbeaten at ${recText(r)}.` });
  });
  if (n === LAST_WEEK && SEASON.champion) lines.push({ p: 10, t: `${nameOf(SEASON.champion)} are the 1A state champions.` });
  SEASON.news[n] = lines.sort((a, b) => b.p - a.p).slice(0, 5).map(x => x.t);
}
