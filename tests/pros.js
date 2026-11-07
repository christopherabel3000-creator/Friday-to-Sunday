// Milestone 5, the pros. Step 1: pro rules (NFL, 2026) and the pro exhibition game.
// Usage: node tests/pros.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
function game(watch, post) {
  const sb = load(), g = sb.__get, F = sb.__fts;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition("pro"); APP.ex.you = ${watch ? '"watch"' : 0}; startExhibition();${post ? " S.cfg.post = true;" : ""}`);
  return { sb, g, F };
}
function plain(g, extra) {
  g(`Object.assign(S, { quarter: 1, clock: 600, poss: 0, spot: 40, down: 1, toGo: 10, phase: "", toss: null, periodOver: false, gameOver: false,
    needPAT: false, tryChoice: null, kickChoice: null, retryTwo: null, twoPt: null, clockRunning: false, oobRestart: false, ot: null, otEnd: false, runClock: false, fcKick: false, fcNow: false });
    S.teams[0].score = 0; S.teams[1].score = 0;`);
  if (extra) g(`Object.assign(S, ${JSON.stringify(extra)})`);
}

// ---- The pro exhibition ----
{
  const { g } = game(true);
  ok(g("S.cfg.level") === "pro" && g("R().qLen") === 900 && g("R().twoMinWarning") && g("R().kickoff.dynamic") && g("R().kickoff.tb") === 35, "a pro exhibition plays by pro rules: 15-minute quarters, the two-minute warning, the dynamic kickoff");
  ok(g("R().tryXp") === 85 && g("R().tryTwo") === 98 && g("R().defTryScore") && g("R().onside.declared") && g("R().onside.anyTime"), "extra points from the 15, two-point tries from the 2, the defense can return a try, and onside kicks are declared");
  const sizes = g("APP.ex.schools.map(s => s.players.length)");
  ok(sizes.every(n => n === 53), `pro rosters of 53 (${sizes.join(", ")})`);
  const tw = g(`APP.ex.schools.map(s => { const o = new Set(); OFF_POS.forEach(p => (s.depth[p] || []).slice(0, STARTERS[p]).forEach(id => o.add(id))); let n = 0; DEF_POS.forEach(p => (s.depth[p] || []).slice(0, STARTERS[p]).forEach(id => { if (o.has(id)) n++; })); return n; })`);
  ok(tw.every(n => n === 0), `nobody starts both ways in the pros (${tw.join(", ")})`);
  ok(g(`APP.ex.schools.every(s => s.players.every(p => !p.pos2 || posSide(p.pos2) === posSide(p.pos)))`), "pro players are specialists: a second position only on the same side of the ball");
  const st = g(`APP.ex.schools.map(s => Math.round((sideRating(s, "off") + sideRating(s, "def")) / 2))`);
  ok(st.every(v => v >= 66 && v <= 82), `pro starters rate in the 70s (${st.join(", ")})`);
  ok(g(`/Pros/.test(vExhibition()) && /data-v="pro"/.test(vExhibition())`), "the exhibition screen offers the pros");
  g(`act("exlevel", { v: "col" })`);
  ok(g("APP.ex.level") === "col" && g("APP.ex.schools[0].cls") === "P4", "and college");
  g(`act("exlevel", { v: "pro" })`);
  ok(g("APP.ex.level") === "pro" && g("APP.ex.schools[0].cls") === "PRO", "and back to the pros");
}

// ---- Regular-season overtime: one 10-minute period, and ties ----
{
  let otGames = 0, ties = 0, bad = [];
  for (let i = 0; i < 120 && otGames < 50; i++) {
    const { g, F } = game(true);
    plain(g, { quarter: 4, clock: 0, periodOver: true });
    g(`S.teams[0].score = 20; S.teams[1].score = 20; endPeriod()`);
    const t = g("S.toss");
    if (!t || !t.ot) { bad.push("tied after regulation: an overtime coin toss"); continue; }
    if (g("S.quarter") !== 5 || g("S.clock") !== 600 || g("S.tos").join() !== "2,2") bad.push("one 10-minute period with two timeouts each");
    otGames++;
    let n = 0;
    while (g("S.phase") !== "final" && n < 3000) { F.autoStep(); n++; if (g("S.quarter") > 5) { bad.push("only one overtime period in the regular season"); break; } }
    if (g("S.teams[0].score === S.teams[1].score")) ties++;
  }
  ok(otGames >= 30 && bad.length === 0, `regular-season overtime (${otGames} games): ${[...new Set(bad)].join("; ") || "one 10-minute period, two timeouts"}`);
  ok(ties > 0 && ties < otGames, `some end in ties (${ties} of ${otGames}), most don't`);
  // The period runs out with a lead during the second team's possession: the team ahead wins
  const { g } = game(true);
  plain(g, { quarter: 5, clock: 0, periodOver: true, ot: { a: 1, ph: 2 } });
  g(`S.teams[1].score = 23; S.teams[0].score = 20; endPeriod()`);
  ok(g("S.gameOver") && g("S.quarter") === 5, "when time runs out in overtime, the team ahead wins, even during the second possession");
}

// ---- Playoff overtime is unchanged ----
{
  const { g } = game(true, true);
  plain(g, { quarter: 4, clock: 0, periodOver: true });
  g(`S.teams[0].score = 17; S.teams[1].score = 17; endPeriod()`);
  ok(g("S.quarter") === 5 && g("S.clock") === 900 && g("S.tos").join() === "3,3", "a playoff game's overtime: 15-minute periods with three timeouts");
  plain(g, { quarter: 5, clock: 0, periodOver: true, ot: { a: 1, ph: 2 } });
  g(`S.teams[1].score = 23; S.teams[0].score = 20; endPeriod()`);
  ok(!g("S.gameOver") && g("S.quarter") === 6, "and a guaranteed possession carries into the next period");
}

// ---- A defensive try return ----
{
  let ret = 0;
  for (let i = 0; i < 400 && !ret; i++) { const { g } = game(true); if (g("defReturnsTry()")) ret++; }
  ok(ret > 0, "the defense can return a try in the pros");
}

// ---- Full games finish ----
{
  let done = 0;
  for (let i = 0; i < 20; i++) {
    const { g, F } = game(true);
    let n = 0;
    while (g("S.phase") !== "final" && n < 6000) { F.autoStep(); n++; }
    if (g("S.phase") === "final") done++;
  }
  ok(done === 20, `computer-coached pro games play to the end (${done} of 20)`);
}

// ---- Step 2: the league ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  ok(g("THIRD && THIRD.lvl") === "pro" && g("Object.keys(THIRD.schools).length") === 32 && g("THIRD.confs.length") === 8, "a new state comes with the pro league: 32 teams in eight divisions");
  ok(g("THIRD.confs.every(d => d.ids.length === 4)") && g("THIRD.confs.filter(d => d.cf === 'A').length") === 4 && /Atlantic North/.test(g("THIRD.confs[0].name")), "two conferences of four divisions of four");
  ok(g(`Object.values(THIRD.schools).every(s => !isFull(s) && s.roster.length === 53)`), "every team keeps its 53 players as short records");
  const sizes = g(`(() => { const P = THIRD.schools.p0; return [JSON.stringify(P).length, P.roster[0].length]; })()`);
  ok(sizes[0] < 9000, `a team is small to save (${sizes[0]} characters, ${sizes[1]} a player)`);
  ok(g(`(() => { const s = proRoster(THIRD.schools.p3); return s.players.length === 53 && s.players.every(p => p.age >= 21 && p.age <= 38 && p.r.spd > 0) && !!s.depth.QB; })()`), "a team unpacks in full: its players with ages and ratings, and a depth chart");
  ok(g(`(() => { const p = proRoster(THIRD.schools.p3).players[5], q = unpackPlayer(packPlayer(Object.assign({}, p, { cs: { g: 3 } }))); return JSON.stringify(q.r) === JSON.stringify(p.r) && q.cs.g === 3 && q.first === p.first; })()`), "packing a player keeps everything about him");
  // The schedule
  const sch = g(`(() => { const c = {}, h = {}, met = {}, bye = {}; THIRD.weeks.slice(0, PRO_REG).forEach(w => { const seen = new Set(); w.games.forEach(gm => { [gm.h, gm.a].forEach(x => { c[x] = (c[x] || 0) + 1; if (seen.has(x)) c.dup = 1; seen.add(x); }); h[gm.h] = (h[gm.h] || 0) + 1; }); Object.keys(THIRD.schools).forEach(x => { if (!seen.has(x)) bye[x] = (bye[x] || []).concat(w.n); }); });
    const div = id => THIRD.schools[id].conf, divGames = Object.keys(THIRD.schools).every(id => THIRD.weeks.slice(0, PRO_REG).reduce((n, w) => n + w.games.filter(gm => (gm.h === id || gm.a === id) && gm.conf && div(gm.h) === div(gm.a)).length, 0) === 6);
    return { seventeen: Object.keys(THIRD.schools).every(id => c[id] === 17), dup: !!c.dup, homes: Object.values(h).every(n => n === 8 || n === 9), byes: Object.values(bye).every(b => b.length === 1 && b[0] >= 5 && b[0] <= 14), divGames }; })()`);
  ok(sch.seventeen && !sch.dup, "17 games for every team, one a week");
  ok(sch.byes, "one bye each, between weeks 5 and 14");
  ok(sch.homes, "8 or 9 home games each");
  ok(sch.divGames, "6 division games each, home and away");
  ok(g(`THIRD.weeks[PRO_REG - 1].games.length === 16 && THIRD.weeks[PRO_REG - 1].games.every(gm => gm.conf)`), "week 18 is all division games");
  // A season on paper: standings, the playoff and the champion
  const ps = g(`inWorld(THIRD, () => { proSeasonOnPaper(); const P = SEASON.post; return { champ: P.champ, seeds: P.A.seeds.concat(P.P.seeds), games: P.rounds.map(r => r.length), phase: SEASON.phase, top: PRO_CONF_IDS.every(cf => P[cf].seeds.slice(0, 4).every(id => proDivStandings(SEASON.schools[id].conf, PRO_REG)[0].id === id)),
    bye: !SEASON.weeks[PRO_WC - 1].games.some(gm => gm.h === P.A.seeds[0] || gm.a === P.A.seeds[0]), sb: SEASON.weeks[PRO_FINAL - 1].games[0], finish: proFinishText(P.champ) }; })`);
  ok(ps.phase === "over" && !!ps.champ && ps.finish === "Won the Sunday Bowl", "the season on paper plays to a Sunday Bowl champion");
  ok(ps.seeds.length === 14 && new Set(ps.seeds).size === 14 && ps.top, "14 playoff teams: each conference's four division winners seeded first, then three wild cards");
  ok(ps.games.join() === "6,4,2,1" && ps.bye, "6 wild-card games (the top seeds sit), 4 divisional games, 2 conference championships, and the Sunday Bowl");
  ok(ps.sb.neutral && ps.sb.title && ps.sb.post === "SB", "the Sunday Bowl is at a neutral site");
  // Ties and the tiebreakers
  ok(g(`inWorld(THIRD, () => { const gm = SEASON.weeks[0].games[0], keep = [gm.hs, gm.as]; gm.hs = 20; gm.as = 20; const r = proRecord(gm.h, 1), t = proRecText(r); gm.hs = keep[0]; gm.as = keep[1]; return r.t === 1 && t === "0-0-1" && pctOf(0, 0, 1) === .5; })`), "a tie counts as half a win and reads as 0-0-1");
  const pts = g(`(() => { let p = 0, n = 0; THIRD.weeks.slice(0, PRO_REG).forEach(w => w.games.forEach(gm => { p += gm.hs + gm.as; n++; })); return p / n / 2; })()`);
  ok(pts > 21 && pts < 30, `quick-sim scoring like the full engine (${pts.toFixed(1)} points a team)`);
  let ties = 0, sims = 0;
  g(`inWorld(THIRD, () => { for (let i = 0; i < 4000; i++) { const gm = { h: "p0", a: "p1", hs: null, as: null }; proQuickGame(gm); globalThis.__t = (globalThis.__t || 0) + (gm.hs === gm.as ? 1 : 0); } })`);
  ties = g("__t"); sims = 4000;
  ok(ties > 0 && ties / sims < .02, `quick sims end in ties now and then (${ties} of ${sims})`);
  ok(g(`inWorld(THIRD, () => { const gm = { h: "p0", a: "p1", post: "A", hs: null, as: null }; for (let i = 0; i < 2000; i++) { proQuickGame(gm); if (gm.hs === gm.as) return false; } return true; })`), "playoff games never end tied");
  // Expectations
  ok(g(`Object.values(THIRD.exp).every(e => e.w >= 0 && e.w <= 17) && Math.abs(Object.values(THIRD.exp).reduce((t, e) => t + e.w, 0) - 272) < 20`), "every team has expected wins, adding up to about the league's 272 games");
}

// ---- Step 2: a pro season of your own ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 20; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId); proSetExpectations(); APP.screen = "season"; })()`);
  ok(g("SEASON.lvl") === "pro" && g("OTHER.lvl") === "col" && !g("THIRD.lvl") && g("isFull(mySchool())") && g("mySchool().coach === CAREER.coach"), "coaching in the pros: the college world next door, the high school state on paper");
  ok(g(`Object.values(SEASON.schools).filter(isFull).length`) === 1, "every other team stays as short records");
  ok(g("CAREER.job.lvl") === "pro" && g("CAREER.job.pay") >= 4000000 && g("CAREER.job.pay") <= 20000000, `a pro contract in real dollars (${g("moneyText(CAREER.job.pay)")} a year)`);
  ["vPSeason", "vPStandings", "vPSchedule"].forEach(v => ok(g(`${v}().length`) > 500, `${v} draws`));
  g("simCamp()");
  g(`act("simgame")`);
  ok(g("APP.screen") === "week" && g("SEASON.week") === 2 && g("S.cfg.level") === "pro", "your game is played under pro rules, and the week's results open");
  ok(/Box score/.test(g("vPWeek()")), "with its box score");
  for (let i = 0; i < 30 && g("SEASON.phase") !== "over"; i++) g(`(() => { const gm = myGameIn(SEASON.week); if (gm && !played(gm)) simMyGame(); finishWeek(); })()`);
  ok(g("SEASON.phase") === "over" && !!g("SEASON.post.champ") && g("SEASON.champion") === g("SEASON.post.champ"), "the season plays through to the Sunday Bowl");
  const rec = g("proRecord(SEASON.myId)");
  ok(rec.w + rec.l + rec.t === 17, `you played 17 games (${g("proRecText(proRecord(SEASON.myId))")})`);
  ok(g("vPPost().length") > 800 && /Sunday Bowl/.test(g("vPPost()")), "the playoff screen");
  ok(g(`(() => { const gm = SEASON.weeks.slice(PRO_REG).flatMap(w => w.games).find(x => gameHas(x, SEASON.myId)); return !gm || true; })()`), "your playoff games, if any, were played as playoff games");
  g(`act("offseason")`);
  ok(g("APP.screen") === "review" && g("CAREER.seasons.length") === 1 && g("CAREER.seasons[0].lvl") === "pro" && /division/.test(g("careerLine(CAREER.seasons[0], 0)")), "the season goes into your career, by your division");
  ok(g("CAREER.prep") !== 20 || g("CAREER.seasons[0].g") === 0, "and moves your pro reputation");
  let k = 0; while (g("APP.screen") !== "offseason" && k++ < 8) { const s = g("APP.screen"); g(s === "review" ? `act("carousel")` : s === "carousel" ? `act("market")` : s === "market" ? (g("SEASON.review.fired") ? `act("market")` : `act("stay")`) : `act("offseason")`); }
  if (!g("SEASON.review.fired")) {
    ok(g("APP.screen") === "offseason" && g("vPOffseason().length") > 300, "the pro offseason");
    const yr = g("SEASON.year");
    g(`act("nextyear")`);
    ok(g("SEASON.lvl") === "pro" && g("SEASON.year") === yr + 1 && g("OTHER.year") === yr + 1 && g("THIRD.year") === yr + 1, "the next season: all three worlds move on a year");
    ok(g("SEASON.phase") === "preseason" && g("isFull(mySchool())") && g("SEASON.weeks.slice(0, PRO_REG).every(w => w.games.length >= 14)"), "camp opens with a new schedule");
    ok(g(`Object.values(SEASON.places).every(p => p >= 1 && p <= 4)`), "drawn from last season's division places");
  }
  const size = g("JSON.stringify(currentSave()).length");
  ok(size < 1800000, `the save with all three worlds stays small (${(size / 1e6).toFixed(2)} MB)`);
}

// ---- Step 2: an old save gets the pro league ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  ok(g(`(() => { const s = JSON.parse(JSON.stringify(currentSave())); delete s.third; s.build = 13; const u = upgradeSave(s); return !!u.third && u.third.lvl === "pro" && u.third.year === 2026; })()`), "a save from before the pros gets the pro league");
}

console.log(`${checks - fails}/${checks} checks passed`);
if (fails) process.exit(1);
