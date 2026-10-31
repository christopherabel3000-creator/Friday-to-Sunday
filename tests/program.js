// The offseason program: Program building, the summer, hallway recruiting, and grades and eligibility.
// Usage: node tests/program.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
const fresh = () => { const sb = load(); return { sb, g: sb.__get, F: sb.__fts }; };
const start = (g, seed, pick) => g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); CAREER = null; newCareer("Pat", "Ruiz", "teach", "bal", "bal"); newSeason(${seed}, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[${pick || 0}]);`);

// ---- Program building ----
{
  const { g } = fresh();
  ok(g(`COACH_RATINGS.map(r => r[0]).includes("pbd")`) && g(`makeCoach("A", "B", "qb").pbd`) === 40, "Program building is a coach rating, 40 for a new coach");
  const c = g(`(() => { const c = genCoach(dice(99), "1A"); const d = Object.assign({}, c); delete d.pbd; return [c.pbd, coachPbd(d), coachPbd(d)]; })()`);
  ok(c[0] === c[1] && c[1] === c[2] && c[0] >= 15 && c[0] <= 90, "a computer coach's Program building is worked out the same way every time");
  // The same seed still builds the same coach otherwise: Program building rolls no dice
  const a = g(`JSON.stringify(Object.assign(genCoach(dice(7), "1A"), { pbd: 0 }))`), b = g(`(() => { const g2 = dice(7); g2.n(42, 7); return 1; })()`);
  ok(a && b === 1 && g(`(() => { const x = dice(7), c = genCoach(x, "1A"), next = x.f(); const y = dice(7); y.n(42, 7); y.pick(COACH_FIRST); y.pick(LAST_NAMES); ROLLED_RATINGS.forEach(() => y.n(0, 8)); y.w({ bal: 3, gnp: 4, air: 1.5, wc: 1.5 }); y.w({ bal: 3, blz: 2, nfz: 1.5, rs: 2.5 }); return next === y.f(); })()`), "and it doesn't use up any of the seed's dice");
  // More freshmen, and better ones, with a youth program and Program building
  start(g, 31);
  const base = g(`classParams(Object.assign({}, mySchool(), { youth: 0, coach: Object.assign({}, mySchool().coach, { pbd: 42 }) }), 2027)`);
  const built = g(`classParams(Object.assign({}, mySchool(), { youth: 5, coach: Object.assign({}, mySchool().coach, { pbd: 80 }) }), 2027)`);
  ok(built.n >= base.n + 2 && built.lv >= base.lv + 3, `a youth program and Program building bring out more freshmen, and better ones (${base.n} at ${base.lv} to ${built.n} at ${built.lv})`);
}

// ---- The summer ----
{
  const { g } = fresh();
  start(g, 2024, 3);
  const wk = g(`summerWeeks({ weights: 3, seven: 1, camp: 0, halls: 0, study: 0 })`);
  ok(Math.abs(wk.weights - 6) < 1e-9 && Math.abs(wk.seven - 2) < 1e-9 && wk.camp === 0, "eight weeks of summer, shared out by weight");
  ok(Math.abs(g(`attendRate({ eth: 80 }, { pbd: 42 })`) - .85) < 1e-9 && g(`attendRate({ eth: 80 }, { pbd: 60 })`) > g(`attendRate({ eth: 80 }, { pbd: 42 })`) && g(`attendRate({ eth: 20 }, { pbd: 42 })`) < .6, "who shows up: work ethic and Program building");
  // All weights, against no summer at all, for the same players
  const run = plan => g(`(() => { const s = clone(mySchool()); s.youth = 0; const before = s.players.map(p => p.r.str); const went = runSummer(s, ${plan}, 2026); return { went, str: s.players.reduce((t, p, i) => t + p.r.str - before[i], 0), youth: s.youth, back: s.players.filter(p => p.yr < 12).length }; })()`);
  const heavy = run(`{ weights: 3, seven: 0, camp: 0, halls: 0, study: 0 }`), none = run(`{ weights: 0, seven: 0, camp: 0, halls: 0, study: 0 }`);
  ok(heavy.str > none.str + 15 && none.str === 0, `summer weights: strength for the players who show up (${heavy.str} points)`);
  ok(heavy.went > heavy.back * .5 && heavy.went < heavy.back, `most players come back for summer workouts, not all (${heavy.went} of ${heavy.back})`);
  const camp = run(`{ weights: 0, seven: 0, camp: 3, halls: 0, study: 0 }`);
  ok(camp.youth > 2 && none.youth === 0, `youth camp builds the youth program (${camp.youth.toFixed(2)})`);
  // 7-on-7 works on the passing game
  const seven = g(`(() => { const s = clone(mySchool()); const qb = s.players.find(p => p.pos === "QB" && p.yr < 12); if (!qb) return null; const acc = qb.r.acc, str = qb.r.str; qb.eth = 99; s.coach = Object.assign({}, s.coach, { pbd: 90 }); runSummer(s, { weights: 0, seven: 3, camp: 0, halls: 0, study: 0 }, 2026); return [qb.r.acc - acc, qb.r.str - str]; })()`);
  ok(!seven || (seven[0] >= 1 && seven[1] === 0), "7-on-7: accuracy for a quarterback, not strength");
  // Study hall: grades up for the players who need it
  const st = g(`(() => { const s = clone(mySchool()); s.players.forEach(p => { p.gr = 40; p.eth = 99; }); s.coach = Object.assign({}, s.coach, { pbd: 90 }); runSummer(s, { weights: 0, seven: 0, camp: 0, halls: 0, study: 3 }, 2026); return s.players.filter(p => p.yr < 12).map(p => p.gr); })()`);
  ok(st.filter(x => x > 40).length > st.length * .7 && Math.max(...st) <= 60, `study hall raises low grades (to ${Math.max(...st)})`);
}

// ---- Hallway recruiting ----
{
  const { g } = fresh();
  start(g, 555, 1);
  const a = g(`JSON.stringify(hallProspects(mySchool(), 2026))`), b = g(`JSON.stringify(hallProspects(mySchool(), 2026))`), P = JSON.parse(a);
  ok(a === b && P.length === 6, "six athletes in the hallways, the same every time for a school and year");
  ok(P.every(p => p.yr >= 10 && p.yr <= 12 && p.sport && [0, 1, 2].includes(p.interest) && p.from === 2027 && p.id.includes("h2027")), "each one: next season's year, a sport, and an interest");
  ok(g(`prospectLine(hallProspects(mySchool(), 2026)[0], mySchool())`).match(/^.+, (sophomore|junior|senior) next season\. .+\. .+ \d+, .+ \d+\..* (Low|Average|High|Elite) potential\. (Not very interested|A little interested|Interested)\.$/), `an athlete in a sentence: ${g(`prospectLine(hallProspects(mySchool(), 2026)[0], mySchool())`)}`);
  ok(g(`pitchesFor({ weights: 2, seven: 2, camp: 2, halls: 0, study: 2 }, { perks: [] })`) === 1 && g(`pitchesFor({ weights: 0, seven: 0, camp: 0, halls: 3, study: 0 }, { perks: [] })`) === 6 && g(`pitchesFor({ halls: 0 }, { perks: ["rec"] })`) === 2, "pitches: one, more with summer time, one more with the Hallway recruiter perk");
  const p0 = P[0];
  ok(g(`yesChance(${JSON.stringify(Object.assign({}, p0, { interest: 2 }))}, mySchool())`) > g(`yesChance(${JSON.stringify(Object.assign({}, p0, { interest: 0 }))}, mySchool())`), "more interest, more likely to say yes");
  ok(g(`yesChance(${JSON.stringify(p0)}, Object.assign({}, mySchool(), { coach: Object.assign({}, mySchool().coach, { perks: ["rec"], pbd: 70 }) }))`) > g(`yesChance(${JSON.stringify(p0)}, mySchool())`), "Program building and the perk help");
  // The offseason: pitch, then the ones who said yes join next season
  g(`simSeason(); SEASON.phase = "offseason"; SEASON.summer = { weights: 0, seven: 0, camp: 0, halls: 3, study: 0 };`);
  ok(g("pitchesLeft()") === 6 && g("hallsNow().players.length") === 6, "six pitches with the whole summer in the hallways");
  g(`hallsNow().players.forEach(p => { p.interest = 2; }); mySchool().coach.pbd = 99; mySchool().trad = 95;`);
  const said = g(`hallsNow().players.map(p => pitch(p.id))`);
  ok(said.every(x => x === "yes" || x === "no") && said.filter(x => x === "yes").length >= 3 && g("pitchesLeft()") === 0, `pitch all six (${said.filter(x => x === "yes").length} said yes)`);
  ok(g(`pitch(hallsNow().players[0].id)`) === "", "no pitches left, and nobody is asked twice");
  const yes = g(`hallsNow().players.filter(p => hallsNow().said[p.id] === "yes").map(p => [p.id, p.yr])`);
  const rep = g("nextSeason()");
  const now = g("mySchool().players");
  ok(yes.every(([id, yr]) => { const p = now.find(x => x.id === id); return p && p.yr === yr && p.o0 === g(`ovr(playerById(mySchool(), "${id}"), playerById(mySchool(), "${id}").pos)`); }) && rep.joined.length === yes.length, `the athletes who said yes are on the team (${yes.length})`);
  ok(new Set(now.map(p => p.num)).size === now.length && new Set(now.map(p => p.id)).size === now.length, "with their own numbers");
  ok(g("SEASON.halls") === null && g("JSON.stringify(SEASON.summer)") === JSON.stringify({ weights: 0, seven: 0, camp: 0, halls: 3, study: 0 }), "next offseason starts fresh in the hallways, with the same summer plan");
}

// ---- Grades and eligibility ----
{
  const { g } = fresh();
  start(g, 808, 2);
  const grades = g(`Object.values(SEASON.schools).filter(isFull).flatMap(s => s.players.map(p => gradesOf(p)))`);
  const avg = grades.reduce((t, v) => t + v, 0) / grades.length;
  ok(avg > 62 && avg < 74 && Math.min(...grades) >= 20 && Math.max(...grades) <= 99, `grades average about 68 (${avg.toFixed(1)})`);
  ok(g(`gradesOf(mySchool().players[0])`) === g(`gradesOf(mySchool().players[0])`), "the same every time until study hall changes them");
  // Report cards: poor grades can mean two games out
  g(`mySchool().players.forEach(p => { p.gr = 20; p.inj = null; });`);
  const out = g(`reportCards(mySchool(), () => .1)`);
  ok(out.length === g("mySchool().players.length") && g(`mySchool().players.every(p => p.inj && p.inj.w === 1 && p.inj.at === "grades")`), "grades of 20: ruled ineligible");
  g(`mySchool().players.forEach(p => { p.gr = 60; p.inj = null; });`);
  ok(g(`reportCards(mySchool(), () => .0)`).length === 0, "grades of 55 or better are safe");
  // Ineligible: the next player on the depth chart plays, but he still practices
  g(`(() => { const s = mySchool(), qb = s.players.find(p => p.id === s.depth.QB[0]); qb.inj = { w: 1, at: "grades" }; })()`);
  const qb = g("mySchool().depth.QB[0]");
  ok(g(`starterAt(mySchool(), "QB").id`) !== qb, "an ineligible starter sits: the next quarterback starts");
  ok(g(`unitPlayers(mySchool(), "qb").some(([p]) => p.id === "${qb}")`), "but he still practices");
  ok(/Ineligible\./.test(g(`playerLine(playerById(mySchool(), "${qb}"))`)), "his line says he's ineligible");
  // Two games, and recovery doesn't bring him back early
  g(`healSchool(mySchool(), 99, () => 0)`);
  ok(g(`playerById(mySchool(), "${qb}").inj.w`) === 0, "a week later: out one more game, no matter the recovery time");
  g(`healSchool(mySchool(), 99, () => 0)`);
  ok(!g(`playerById(mySchool(), "${qb}").inj`), "then eligible again");
  // Report cards come out after weeks 4 and 8, for every school in your district
  g(`Object.values(SEASON.schools).filter(isFull).forEach(s => s.players.forEach(p => { p.gr = 20; p.inj = null; }));`);
  g("simCamp(); simSeason(5);");
  ok(g("SEASON.week") === 5 && g(`SEASON.injLog[4] && SEASON.injLog[4].grades.length`) > 0, "report cards after week 4");
  ok(g(`SEASON.districts[SEASON.district - 1].ids.filter(id => id !== SEASON.myId).every(id => SEASON.schools[id].players.some(p => p.inj && p.inj.at === "grades"))`), "for the other schools in your district too");
}

// ---- Saves from before the offseason program ----
{
  const { g } = fresh();
  start(g, 4321, 4);
  g(`delete CAREER.coach.pbd; delete SEASON.summer;`);
  g(`localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(currentSave(), { build: 7 }))); SEASON = null; CAREER = null; APP = null; start();`);
  ok(g("CAREER.coach.pbd") === 40 && g("mySchool().coach === CAREER.coach") && g("JSON.stringify(SEASON.summer)") === JSON.stringify(g("newSummer()")), "an older career gets Program building 40, and a summer plan");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
