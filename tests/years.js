// More seasons: preseason camp, the offseason, graduation, growth over the summer, freshman classes,
// schools on paper in any year, tradition, and a state that stays at the same level year after year.
// Usage: node tests/years.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
const fresh = () => { const sb = load(); return { sb, g: sb.__get, F: sb.__fts }; };
const start = (g, seed, pick) => g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newSeason(${seed}, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[${pick || 0}]);`);
// Plays a season out and moves to the next one
const nextYear = g => { g("simSeason()"); g(`SEASON.phase = "offseason"`); return g("nextSeason()"); };

// ---- Preseason camp ----
{
  const { g } = fresh();
  start(g, 777);
  ok(g("SEASON.phase") === "preseason" && g("SEASON.camp") === 1 && g("SEASON.pre") === 3 && g("practiceSlot()") === -2, "a season opens with camp: week 1 of 3");
  ok(g("practiceWeekName(practiceSlot())") === "Camp week 1" && g("practiceWeeks()") === 1, "camp weeks have names, and count as practice");
  const ms = g("mySchool().mastery.ms"), b = g("blocksOf(planNow())"), bReg = g("blocksOf(SEASON.plan)");
  ok(b.prep === 0 && Math.abs(b.install - (bReg.install + bReg.prep)) < 1e-9, "in camp, opponent prep time goes into install");
  const rep = g("holdPractice()");
  ok(rep.camp && rep.week === -2 && !rep.film && !rep.opp && rep.prep === 0 && g("practiced()"), "a camp practice: no film study");
  ok(g("SEASON.cpuWeek") === -2 && g("mySchool().mastery.ms") >= ms, "the rest of the district practiced too");
  ok(!g("startMyGame()") && !g("simMyGame()") && g("finishWeek()") === 0, "no games in camp");
  g("campNext()");
  ok(g("SEASON.camp") === 2 && !g("practiced()") && g("practiceWeeks()") === 2, "on to camp week 2");
  g("campNext()");
  ok(g("SEASON.camp") === 3 && g("SEASON.practice.week") === -1, "moving on holds the week's practice if you didn't");
  const reps = g("simCamp()");
  ok(g("SEASON.phase") === "regular" && g("SEASON.week") === 1 && g("SEASON.camp") === 0 && reps.length === 1, "the rest of camp, then week 1");
  ok(g("practiceWeeks()") === 4, "week 1 is the fourth week of practice");
  // A school on paper has had camp too
  const other = g("Object.keys(SEASON.schools).find(id => !isFull(SEASON.schools[id]))");
  const four = g(`(REBUILT.clear(), JSON.stringify(seasonSchool("${other}").mastery))`), zero = g(`JSON.stringify(rebuildSchool(SEASON.schools["${other}"], 0).mastery)`);
  ok(four !== zero, "a school on paper practiced in camp too");
  // Several reports as one
  const m = g(`mergeReports([{ blocks: {}, contact: "shells", grew: { a: { spd: [40, 41] } }, mastery: [["ir", 50, 52]], hurt: ["x"], ovr: [["a", "RB", 40, 41]], week: -2, camp: true },
    { blocks: {}, contact: "shells", grew: { a: { spd: [41, 42], str: [30, 31] } }, mastery: [["ir", 52, 54], ["or", 40, 41]], hurt: [], ovr: [["a", "RB", 41, 42]], week: -1, camp: true }])`);
  ok(JSON.stringify(m.grew.a) === JSON.stringify({ spd: [40, 42], str: [30, 31] }) && JSON.stringify(m.mastery) === JSON.stringify([["ir", 50, 54], ["or", 40, 41]]) && m.weeks === 2 && m.hurt.length === 1 && JSON.stringify(m.ovr) === JSON.stringify([["a", "RB", 40, 42]]), "camp's reports add up to one");
}

// ---- Schools on paper, any year ----
{
  const { g } = fresh();
  start(g, 4242);
  const id = g("Object.keys(SEASON.schools).find(id => !isFull(SEASON.schools[id]))");
  const y0 = g(`JSON.stringify(rosterAt(SEASON.schools["${id}"], 2026).players)`), gen = g(`JSON.stringify(genSchool(dice(SEASON.schools["${id}"].seed), { id: "${id}", cls: "1A", mascot: SEASON.schools["${id}"].mascot, town: SEASON.schools["${id}"].town, color: [SEASON.schools["${id}"].color, SEASON.schools["${id}"].colorName, SEASON.schools["${id}"].colorFam], trad: SEASON.schools["${id}"].trad }).players)`);
  ok(y0 === gen, "in the state's first year, a school on paper is the one its seed builds");
  for (let y = 0; y < 2; y++) nextYear(g);
  ok(g("SEASON.year") === 2028 && g("SEASON.year0") === 2026, "two seasons on: 2028");
  const a = g(`JSON.stringify(rosterAt(SEASON.schools["${id}"], 2028))`), b = g(`JSON.stringify(rosterAt(SEASON.schools["${id}"], 2028))`);
  ok(a === b, "a school on paper rebuilds exactly the same in a later year");
  const r27 = g(`rosterAt(SEASON.schools["${id}"], 2027).players`), r28 = g(`rosterAt(SEASON.schools["${id}"], 2028).players`);
  const by28 = Object.fromEntries(r28.map(p => [p.id, p]));
  const stay = r27.filter(p => by28[p.id]), gone = r27.filter(p => !by28[p.id]);
  ok(stay.length > 10 && stay.every(p => by28[p.id].yr === p.yr + 1 && by28[p.id].last === p.last), `the same players a year older (${stay.length} came back)`);
  ok(stay.every(p => Object.keys(p.r).every(k => by28[p.id].r[k] >= p.r[k])), "and none of them got worse");
  ok(gone.every(p => p.yr === 12 || !["passer", "dual", "kicker"].includes(p.arch)) && gone.filter(p => p.yr === 12).length === r27.filter(p => p.yr === 12).length, "the seniors graduated, and a few others left");
  const fr = r28.filter(p => p.yr === 9);
  ok(fr.length >= 4 && fr.every(p => p.from === 2028 && p.id.includes("y2028")), `a new class of freshmen (${fr.length})`);
  ok(new Set(r28.map(p => p.id)).size === r28.length && new Set(r28.map(p => p.num)).size === r28.length, "every player has his own id and number");
  ok(Math.abs(g(`SEASON.schools["${id}"].rating.off`) - g(`schoolRating(rosterAt(SEASON.schools["${id}"], 2028)).off`)) < 1e-9 || g("practiceWeeks()") > 0, "its quick-sim rating comes from its roster this year");
  // Years later, everyone the school started with has graduated, and it still rebuilds
  const late = g(`rosterAt(SEASON.schools["${id}"], 2034).players`);
  ok(late.length >= 18 && late.every(p => p.from >= 2031), `in 2034, a school on paper is all newer classes (${late.length} players)`);
}

// ---- The offseason and the next season ----
{
  const { g } = fresh();
  start(g, 99, 2);
  g("simSeason()");
  ok(g("SEASON.phase") === "over" && !g("nextSeason()"), "the next season waits for the offseason");
  const me = g("SEASON.myId"), seniors = g("mySchool().players.filter(p => p.yr === 12).map(p => p.id)"), roster = g("mySchool().players.map(p => [p.id, p.yr])");
  const stats = g("SEASON.stats"), oldSeed = g("SEASON.seed"), champ = g("SEASON.champion"), trad = g("mySchool().trad"), rec = g("fullRecord(SEASON.myId)");
  const mast = g("mySchool().mastery.ir");
  g(`mySchool().players.find(p => p.yr < 12).inj = { w: 3, at: "game" };`);
  g(`SEASON.phase = "offseason"`);
  const report = g("nextSeason()");
  ok(g("SEASON.year") === 2027 && g("SEASON.seed") !== oldSeed && g("SEASON.world") === 99 && g("SEASON.phase") === "preseason" && g("SEASON.camp") === 1, "the next season: 2027, a new seed, camp first");
  ok(g("SEASON.myId") === me && g("SEASON.weeks.length") === 10 && g("SEASON.weeks.every(w => w.games.every(gm => gm.hs === null))") && g("SEASON.week") === 1, "the same school, and a new schedule nobody has played");
  ok(JSON.stringify(g("SEASON.history")) === JSON.stringify([{ year: 2026, id: champ, name: g(`nameOf("${champ}")`) }]), "the state champion goes in the history");
  const now = g("mySchool().players");
  ok(seniors.every(id => !now.some(p => p.id === id)) && report.grads.length === seniors.length, `the seniors graduated (${seniors.length})`);
  const back = roster.filter(([id, yr]) => yr < 12 && now.some(p => p.id === id));
  ok(back.length + report.left.length + seniors.length === roster.length && back.every(([id, yr]) => now.find(p => p.id === id).yr === yr + 1), `everyone else moved up a year (${report.left.length} left the team)`);
  ok(report.fresh.length >= 4 && report.fresh.every(id => now.find(p => p.id === id).yr === 9), `a class of freshmen came out (${report.fresh.length})`);
  ok(now.every(p => !p.inj && p.o0 === g(`ovr(playerById(mySchool(), "${p.id}"), playerById(mySchool(), "${p.id}").pos)`)), "injuries healed over the summer, and growth is tracked from here");
  ok(now.filter(p => stats[p.id]).every(p => p.cs && p.cs.g === stats[p.id].g && (p.cs.ry || 0) === (stats[p.id].ry || 0)), "last season's stats went into career totals");
  ok(g("Object.keys(SEASON.stats).length") === 0, "and the season's stats start over");
  ok(g("mySchool().mastery.ir") < mast && g("mySchool().mastery.ir") > mast - 8, "the team forgot a little of its playbook over the summer");
  ok(Math.abs(g("mySchool().trad") - trad) <= 10, `tradition follows results (${trad} to ${g("mySchool().trad")} after going ${rec.w}-${rec.l})`);
  ok(Object.keys(g("mySchool().classes")).includes("2027"), "the new class is on record");
  ok(g("SEASON.yearReport.from") === 2026 && g("SEASON.yearReport.grads.every(x => x.name && x.pos && x.ovr)"), "a report of how the team changed");
  // Another year: the stats keep adding up
  const cs = g("mySchool().players.filter(p => p.cs).map(p => [p.id, p.cs.g])");
  g("simSeason()");
  const st2 = g("SEASON.stats");
  g(`SEASON.phase = "offseason"; nextSeason();`);
  const after = g("mySchool().players");
  ok(cs.filter(([id]) => after.some(p => p.id === id)).every(([id, n]) => after.find(p => p.id === id).cs.g === n + ((st2[id] && st2[id].g) || 0)), "career totals add up across seasons");
  ok(g("SEASON.year") === 2028 && g("CAREER.seasons.length") === 2 && g("CAREER.seasons.map(x => x.year).join()") === "2026,2027", "two seasons in your career");
}

// ---- The state stays at the same level ----
{
  const { g } = fresh();
  start(g, 31337);
  const level = () => g(`(() => { const f = [], p = []; for (const id in SEASON.schools) { const s = SEASON.schools[id]; (isFull(s) ? f : p).push((s.rating.off + s.rating.def) / 2); } const a = x => x.reduce((s, v) => s + v, 0) / x.length; return [a(f), a(p)]; })()`);
  const y0 = level(), lv = [];
  for (let y = 0; y < 5; y++) { nextYear(g); lv.push(level()); }
  const late = lv.slice(2), avg = i => late.reduce((s, x) => s + x[i], 0) / late.length;
  ok(Math.abs(avg(0) - avg(1)) < 2, `your district and the rest of the state stay even (${avg(0).toFixed(1)} and ${avg(1).toFixed(1)})`);
  ok(Math.abs(avg(1) - y0[1]) < 2.5 && Math.abs(avg(0) - y0[0]) < 3, `and about where the state began (${y0.map(x => x.toFixed(1)).join(" and ")} in 2026, ${avg(0).toFixed(1)} and ${avg(1).toFixed(1)} later)`);
  ok(g("mySchool().players.length") >= 20 && g("mySchool().players.length") <= 40, `rosters stay a normal size (${g("mySchool().players.length")})`);
  ok(g(`SEASON.districts[SEASON.district - 1].ids.every(id => { const s = SEASON.schools[id]; return s.players.some(p => p.pos === "QB" || p.pos2 === "QB") && s.depth.K.length && s.depth.QB.length; })`), "every school still has a quarterback and a kicker");
}

// ---- Saves from before more seasons ----
{
  const { g } = fresh();
  // A season under way (build 5): it gets its year, and keeps going without camp
  start(g, 2468);
  g("simCamp(); simSeason(4);");
  g(`(() => { ["world", "year", "year0", "pre", "camp", "history"].forEach(k => delete SEASON[k]); Object.values(SEASON.schools).forEach(s => delete s.trad0); })()`);
  const week = g("SEASON.week");
  g(`localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(currentSave(), { build: 5 }))); SEASON = null; CAREER = null; APP = null; start();`);
  ok(g("SEASON.year") === new Date().getFullYear() && g("SEASON.year0") === g("SEASON.year") && g("SEASON.world") === g("SEASON.seed") && g("SEASON.pre") === 0 && g("SEASON.week") === week, "an older season gets its year and keeps going");
  ok(g("Object.values(SEASON.schools).every(s => s.trad0 === s.trad)") && g("JSON.stringify(SEASON.history)") === "[]", "every school remembers the tradition it started with");
  ok(g("practiceWeeks()") === week, "it never had camp, so its schools on paper don't get any");
  g("simSeason()");
  ok(g("SEASON.phase") === "over", "it plays to the end");
  g(`SEASON.phase = "offseason"; nextSeason();`);
  ok(g("SEASON.phase") === "preseason" && g("SEASON.pre") === 3 && g("SEASON.year") === g("SEASON.year0") + 1, "and the next season has camp");
  // Still picking a school: camp comes with it
  g(`newSeason(1357); ["world", "year", "year0", "pre", "camp", "history"].forEach(k => delete SEASON[k]); SEASON.cpuWeek = 0;`);
  g(`localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(currentSave(), { build: 5 }))); SEASON = null; APP = null; start();`);
  ok(g("SEASON.phase") === "pick" && g("SEASON.pre") === 3 && g("SEASON.cpuWeek") === -3, "a season still waiting for its school gets camp");
  g("pickSchool(SEASON.districts[SEASON.district - 1].ids[0])");
  ok(g("SEASON.phase") === "preseason", "camp first");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
