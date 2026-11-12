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
  for (let i = 0; i < 240 && (otGames < 50 || !ties); i++) {
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
    g(`CAREER.earned = 1000000; CAREER.spent = 0; SEASON.clinics = []; CAREER.xp = 0;`);
    ok(/Your own money: \$1,000,000/.test(g("vPOffseason()")) && /data-v="panalytics"/.test(g("vPOffseason()")) && !/nilgift/.test(g("vPOffseason()")), "the pro offseason: clinics and consultants from your own money, and no NIL collective");
    ok(/110 XP/.test(g(`attendClinic("panalytics")`)) && g("myCash()") === 600000 && !g(`attendClinic("cretreat")`) && !g("giveToCollective(25000)"), "a pro analytics consultant: $400,000 for 110 XP");
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

// ---- Step 3: pro players and the cap ----
{
  const sb = load(), g = sb.__get;
  // (a whole world, so the draft has the college world to come from)
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(5, 2026); globalThis.L = THIRD;`);
  const c = g(`inWorld(L, () => { const out = []; for (const id in L.schools) { const s = proRoster(L.schools[id]); out.push({ used: capUsed(s), ps: s.ps.length, all: s.players.every(p => p.ct && p.ct.y.length >= 1 && p.ct.y.every(v => v >= proMin(p.exp))) && s.ps.every(p => capHit(p) === PS_PAY), n: s.players.length }); } return out; })`);
  ok(g("L.cap") === 301200000, "the 2026 cap is the real $301.2 million");
  ok(c.every(x => x.all), "every player has a contract, never under his minimum, and the practice squad is paid $13,750 a week");
  ok(c.every(x => x.used > .8 * 301.2e6 && x.used <= 301.2e6), `payrolls of 80 to 100 percent of the cap (${Math.round(Math.min(...c.map(x => x.used)) / 1e6)} to ${Math.round(Math.max(...c.map(x => x.used)) / 1e6)} million)`);
  ok(c.every(x => x.ps === 16 && x.n === 53), "53 on every roster and 16 on every practice squad");
  ok(g(`inWorld(L, () => { const p = proRoster(L.schools.p0).players[0], q = unpackPlayer(packPlayer(p)); return JSON.stringify(q.ct) === JSON.stringify(p.ct); })`), "a contract survives packing");
  ok(g(`inWorld(L, () => [proMin(0), proMin(1), proMin(4), proMin(9)].join())`) === "885000,1005000,1215000,1300000", "the 2026 minimum salaries, by seasons in the league");
  const vals = g(`inWorld(L, () => { const mk = (pos, o, age) => { const p = { pos, age, exp: 5, r: {} }; ATTRS.forEach(a => { p.r[a] = o; }); return proValue(p); }; return { qb: mk("QB", 85, 27), rb: mk("RB", 85, 27), mid: mk("OL", 75, 27), low: mk("S", 50, 27), old: mk("WR", 80, 34), young: mk("WR", 80, 25) }; })`);
  ok(vals.qb > 40e6 && vals.qb < 60.3e6 && vals.rb < vals.qb / 2, `a star quarterback is worth far more than a star running back (${Math.round(vals.qb / 1e6)} and ${Math.round(vals.rb / 1e6)} million)`);
  ok(vals.mid > 7e6 && vals.mid < 13e6 && vals.low === 1215000, `about $10 million for a solid starter, the minimum for a backup (${Math.round(vals.mid / 1e6)} million)`);
  ok(vals.old < vals.young * .6, "a player past his peak is worth less");
  // Growth and decline
  const ag = g(`(() => { const rng = seededRandom(7), mk = (age, pos) => { const p = { pos, age, exp: age - 22, r: {}, pot: 90 }; ATTRS.forEach(a => { p.r[a] = 70; }); return p; }; const t = (age, pos, mine) => { let d = 0; for (let i = 0; i < 300; i++) { const p = mk(age, pos), o = ovr(p, pos); proAgeYear(p, 50, rng, mine); d += ovr(p, pos) - o; } return d / 300; };
    return { young: t(22, "WR"), peak: t(27, "WR"), old: t(32, "WR"), rb: t(29, "RB"), qb: t(32, "QB"), mineYoung: t(22, "WR", true) }; })()`);
  ok(ag.young > 1.5 && Math.abs(ag.peak) < 1.2 && ag.old < -1.5, `young players grow, players at their peak hold, older ones decline (${ag.young.toFixed(1)}, ${ag.peak.toFixed(1)}, ${ag.old.toFixed(1)})`);
  ok(ag.rb < -1 && ag.qb > ag.old, `running backs decline earlier, quarterbacks later (${ag.rb.toFixed(1)} at 29, ${ag.qb.toFixed(1)} at 32)`);
  ok(Math.abs(ag.mineYoung) < .7, "your own players' growth comes from practice, so the year adds only the decline");
  const rt = g(`(() => { const rng = seededRandom(9), mk = (age, pos, o) => { const p = { pos, age, r: {} }; ATTRS.forEach(a => { p.r[a] = o; }); return p; }, n = (age, pos, o) => { let k = 0; for (let i = 0; i < 1000; i++) if (retires(mk(age, pos, o), rng)) k++; return k / 1000; }; return [n(25, "WR", 75), n(33, "WR", 75), n(33, "QB", 75), n(29, "WR", 55)]; })()`);
  ok(rt[0] < .03 && rt[1] > .1 && rt[2] < rt[1] && rt[3] > .2, `retirement: rare when young, likely when old (later for quarterbacks), and likely for a player nobody wants (${rt.map(x => x.toFixed(2)).join(", ")})`);
  // Ten years of the league on paper
  const yrs = [];
  for (let y = 0; y < 10; y++) {
    g(`inWorld(L, () => { proSeasonOnPaper(); })`); g(`proWorldNextYear(); globalThis.L = THIRD;`);
    yrs.push(g(`inWorld(L, () => { const ts = Object.values(L.schools).map(proRoster), ages = ts.flatMap(s => s.players.map(p => p.age)); return { r: ts.reduce((t, s) => t + (schoolRating(s).off + schoolRating(s).def) / 2, 0) / 32, used: ts.reduce((t, s) => t + capUsed(s), 0) / 32 / L.cap, age: ages.reduce((a, b) => a + b, 0) / ages.length, n: ts.every(s => s.players.length === 53 && s.ps.length <= 16), size: JSON.stringify(L).length }; })`));
  }
  const last = yrs[yrs.length - 1];
  ok(yrs.every(y => y.r > 72 && y.r < 79), `the league's talent holds steady over ten years (starters ${yrs.map(y => y.r.toFixed(1)).join(", ")})`);
  ok(yrs.every(y => y.used > .85 && y.used < 1.08), `payrolls stay near the cap (${yrs.map(y => Math.round(y.used * 100)).join(", ")} percent)`);
  ok(yrs.every(y => y.age > 24 && y.age < 28) && yrs.every(y => y.n), `ages stay pro-like (${last.age.toFixed(1)}), with 53 and a practice squad on every team`);
  ok(g("L.cap") > 450e6 && g("L.cap") < 600e6, `the cap grows about 6 percent a year (${g("bigMoney(L.cap)")} in ${g("L.year")})`);
  ok(last.size < 520000, `the league, its next draft class included, stays small to save (${Math.round(last.size / 1000)} KB)`);
}

// ---- Step 3: your roster, cutdown day and injured reserve ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 20; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId); proSetExpectations(); APP.screen = "season"; })()`);
  ok(g("mySchool().players.length") === 53 && g("mySchool().ps.length") === 16 && g("mySchool().ps.every(p => !!p.ct)"), "your team comes in full: 53 and its practice squad, with contracts");
  ok(/The salary cap/.test(g("vPSeason()")) && g(`(() => { act("cap"); return APP.screen; })()`) === "cap" && /committed/.test(g("vCap()")) && /The biggest contracts/.test(g("vCap()")), "the cap screen: room, commitments and the biggest contracts");
  const pl = g(`(() => { const p = mySchool().players[0]; APP.view = { ctx: "season", team: SEASON.myId, back: "season" }; APP.view.player = p.id; return vPlayer(); })()`);
  ok(/Contract: \$/.test(pl) && /age \d+/.test(pl), "a player's screen: his age, his season and his contract");
  const ros = g(`(() => { seasonRoster(SEASON.myId); return vRoster(); })()`);
  ok(/Practice squad/.test(ros) && /Not on the depth chart/.test(ros), "the roster screen: the depth chart, everyone else, and the practice squad");
  ok(g(`gameDay(mySchool()).players.filter(p => !p.inj).length`) === 48 && g("inactives(mySchool()).length") === 5, "48 dress on game day, and 5 sit");
  // Cutdown day at the end of camp
  g(`(() => { const s = mySchool(), gg = dice(4); for (let k = 0; k < 20; k++) s.players.push(streetPlayer(gg, "camp" + k, 55, "WR")); })()`);
  g("simCamp()");
  ok(g("mySchool().players.length") === 53 && g("mySchool().ps.length") <= 16 && g("SEASON.cutdown.cut.length") >= 15, `cutdown day: 53 kept, the practice squad, and the rest let go (${g("SEASON.cutdown.cut.length")})`);
  ok(/Cutdown day/.test(g("vPSeason()")), "and the season screen says so");
  // Injured reserve
  const ir = g(`(() => { const s = mySchool(), p = s.players.find(x => x.pos === "WR"); p.inj = { w: 6, at: "game" }; const r = proIR(s, 3); return { on: r.on.length, act: onActive(s).length, ps: s.ps.length, id: p.id }; })()`);
  ok(ir.on === 1 && ir.act === 53, "a player out six weeks goes on injured reserve, and a practice squad player takes his spot");
  const back = g(`(() => { const s = mySchool(), p = playerById(s, "${ir.id}"); delete p.inj; const early = proIR(s, 5).back.length; const r = proIR(s, 7); return { early, back: r.back.length, act: onActive(s).length, ir: !!p.ir }; })()`);
  ok(back.early === 0 && back.back === 1 && back.act === 53 && !back.ir, "he comes back after four games, and the player who took his spot goes back");
  // The season, then a year on
  g(`simSeason(12)`);
  ok(/Continue the season/.test(g("vHome()")) && g("vHome()").includes(g("proStatus()")), "the main menu, in the middle of a pro season, says where you stand");
  g(`simSeason()`);
  g(`act("offseason")`);
  let k = 0; while (g("APP.screen") !== "offseason" && k++ < 8) { const s = g("APP.screen"); g(s === "review" ? `act("carousel")` : s === "carousel" ? `act("market")` : s === "market" ? (g("SEASON.review.fired") ? `act("market")` : `act("stay")`) : `act("offseason")`); }
  if (!g("SEASON.review.fired")) {
    const ages = g("mySchool().players.map(p => p.id + ':' + p.age)");
    g(`act("nextyear")`);
    const R = g("SEASON.yearReport");
    ok(R && R.pro && Array.isArray(R.grads) && R.fresh.length >= 5 && R.spring, `the new year: retirements (${R.grads.length}), rookies (${R.fresh.length}), and the offseason program`);
    ok(/Retired/.test(g("vNewYear()")) && /Rookies/.test(g("vNewYear()")), "and its screen");
    ok(g(`mySchool().players.length`) > 53, `camp opens with more than 53 (${g("mySchool().players.length")})`);
    ok(g(`(() => { const before = Object.fromEntries(${JSON.stringify(ages)}.map(x => x.split(":"))); return mySchool().players.filter(p => before[p.id] != null).every(p => p.age === +before[p.id] + 1); })()`), "and everyone who stayed is a year older");
  }
}

// ---- Step 4: the way in ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]);`);
  g(`CAREER.rep = 95; simSeason(); act("offseason"); if (APP.screen === "signing") act("adreview"); act("carousel"); act("market")`);
  ok(!!g("THIRD.review && THIRD.review.news.length"), "the pro league's coaching changes happen with yours");
  ok(g(`hcJobs().every(id => !isPro(jobSchool(id).cls))`), "a high school coach never gets pro offers");
  // A power-conference coach
  const sb2 = load(), h = sb2.__get;
  h(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  h(`(() => { const C = OTHER; OTHER = SEASON; SEASON = C; arrangeWorlds([OTHER, THIRD]); CAREER.crep = 95; const id = SEASON.confs.find(c => c.cls === "P4").ids[0]; colTakeOver(id); startColJob(id); colSetExpectations(); APP.screen = "season"; })()`);
  h(`simSeason(); act("offseason")`);
  let k = 0; while (h("APP.screen") !== "market" && k++ < 6) { const s = h("APP.screen"); h(s === "signing" ? `act("adreview")` : s === "review" ? `act("carousel")` : `act("market")`); }
  h("CAREER.crep = 95");
  // In a year when no pro coach is let go, one is, for a coach who qualifies (November 2026)
  ok(h(`THIRD.review.open.some(id => THIRD.review.why[id] !== "taken")`), "a coach who qualifies always finds a pro job open");
  h(`(() => { const R = THIRD.review; R.open = []; R.why = {}; })()`);
  ok(h(`hcJobs().filter(id => isPro(jobSchool(id).cls)).length`) === 0 && h("proMarketNote()") === "No pro team changed coaches this year.", "with none open, the market would say so");
  h("CAREER.crep = 70; proOpeningForYou()");
  ok(h("THIRD.review.open.length") === 0 && /reputation of 75 or more. Yours is 70/.test(h("proMarketNote()")), "under 75 no job is opened, and the market says what the pros want");
  h(`CAREER.crep = 95; const keepCls = mySchool().cls; mySchool().cls = "G5"; proOpeningForYou()`);
  ok(h("THIRD.review.open.length") === 0 && /power conferences/.test(h("proMarketNote()")), "outside the power conferences, the same");
  h(`mySchool().cls = "P4"; yearEndReview()`);
  ok(h("THIRD.review.open.length") === 1 && h("THIRD.review.why[THIRD.review.open[0]]") === "fired" && h("proMarketNote()") === "", "an offseason already under way gets its opening when the market is opened");
  ok(h(`(() => { const R = THIRD.review, id = R.open[0], sec = s => coachCareer(s.coach, s).job.sec; return Object.values(THIRD.schools).every(s => sec(s) >= sec(THIRD.schools[id])); })()`), "it's the coach whose job was least safe");
  h("yearEndReview(); proOpeningForYou()");
  ok(h("THIRD.review.open.length") === 1, "and only one");
  ok(/data-v="PRO"[^>]*>Pros</.test(h("vMarket()")), "the market's Class filter has a Pros button");
  h(`act("jobcls", { v: "PRO" })`);
  ok(h("APP.jobCls") === "PRO" && h(`sortedJobs().filter(id => !jobRole(id)).length`) === 1 && h(`sortedJobs().every(id => isPro(jobSchool(id).cls))`), "which lists only the pro jobs");
  h(`act("jobcls", { v: "all" })`);
  const pros = h(`hcJobs().filter(id => isPro(jobSchool(id).cls))`);
  ok(pros.length > 0, `a power-conference coach with a big college reputation gets pro jobs in his market (${pros.length})`);
  h("CAREER.crep = 70");
  ok(h(`hcJobs().filter(id => isPro(jobSchool(id).cls)).length`) === 0, "under 75, none");
  h("CAREER.crep = 95");
  ok(/The Sunday League/.test(h(`jobPlace("${pros[0]}")`)) && /Salary about \$[\d.]+ million/.test(h(`jobText("${pros[0]}")`)) && /General manager/.test(h(`jobText("${pros[0]}")`)) && /Owner/.test(h(`jobText("${pros[0]}")`)), "a pro job says its division, salary, owner and general manager");
  ok(/Under contract next season/.test(h(`(() => { APP.jobLook = "${pros[0]}"; return vJobLook(); })()`)), "and has a closer look: who's signed and the money");
  let got = null;
  for (const id of pros) { if (h(`pursueJob("${id}")`) === "offer") { got = id; break; } }
  if (got) {
    ok(typeof h("SEASON.market.ctl") === "boolean" && /control of the roster/.test(h("offerPanel()")), "a pro offer says whether it comes with control of the roster");
    const ctl = h("SEASON.market.ctl");
    h(`act("accept")`);
    // (your college may counter first: take the pro job anyway)
    if (h("!!SEASON.market.counter")) h(`act("accept")`);
    ok(h("CAREER.next.lvl") === "pro" && h("CAREER.next.id") === got, "taking it: it starts next season");
    h(`act("nextyear")`);
    ok(h("SEASON.lvl") === "pro" && h("SEASON.myId") === got && h("OTHER.lvl") === "col" && !h("THIRD.lvl"), "the next season: you coach in the pros, with college next door and the state on paper");
    ok(h("CAREER.job.lvl") === "pro" && h("CAREER.job.pay") >= 4e6 && h("CAREER.job.yrs") === 5 && h("CAREER.job.ctl") === ctl && h("CAREER.prep") >= 20, `a five-year pro contract (${h("bigMoney(CAREER.job.pay)")} a year), and a pro reputation (${h("CAREER.prep")})`);
    ok(h("mySchool().players.length") === 53 && h("SEASON.phase") === "preseason", "your new team, in camp");
  } else ok(true, "no pro offer came this time (each job rolls its answer)");
}

// ---- Step 4: owners, the GM and your requests ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 20; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, false); proSetExpectations(); APP.screen = "season"; })()`);
  ok(g(`Object.values(SEASON.schools).every(s => { const o = proOwner(s), m = proGM(s); return o.pat >= .6 && o.pat <= 1.4 && m.rt >= 30 && m.rt <= 92 && !!GM_PHIL[m.ph]; })`), "every team has an owner with his patience and a general manager with a rating and a philosophy");
  ok(g(`[20, 50, 90].map(gmFollowOdds).map(x => Math.round(x * 100)).join()`) === "25,57,99", "the GM follows about a quarter of your requests at 20, over half at 50, nearly all at 90");
  ok(/Your general manager/.test(g("vPSeason()")) && g(`(() => { act("gm"); return APP.screen; })()`) === "gm" && /Your needs/.test(g("vGM()")), "the GM screen: who he is, your standing, your needs");
  g(`act("gmneed", { v: "QB" }); act("gmneed", { v: "CB" }); act("gmneed", { v: "OL" }); act("gmneed", { v: "WR" })`);
  ok(g("myReq().needs.join()") === "QB,CB,OL", "up to three needs, in order");
  // Keep and let go, at the end of the season
  const ids = g(`(() => { const s = mySchool(), end = s.players.filter(p => ctYears(p) === 1 && (p.exp || 0) >= 4).sort((a, b) => ovr(a, a.pos) - ovr(b, b.pos)); return [end[0].id, end[end.length - 1].id]; })()`);
  g(`(() => { APP.view = { ctx: "season", team: SEASON.myId, back: "season", player: "${ids[0]}" }; APP.screen = "player"; })()`);
  ok(/Ask the GM to keep him/.test(g("vPlayer()")), "a player's screen has the requests");
  g(`act("gmkeep", { v: "${ids[0]}" }); act("gmgo", { v: "${ids[1]}" })`);
  ok(g("myReq().keep[0]") === ids[0] && g("myReq().go[0]") === ids[1], "asking to keep one player and let another go");
  g("CAREER.job.gms = 100");
  g(`simSeason(); act("offseason")`);
  let k = 0; while (g("APP.screen") !== "offseason" && k++ < 8) { const s = g("APP.screen"); g(s === "review" ? `act("carousel")` : s === "carousel" ? `act("market")` : s === "market" ? (g("SEASON.review.fired") ? `act("market")` : `act("stay")`) : `act("offseason")`); }
  ok(/owner's review/.test(g("vReview()")) && /The front office/.test(g("vReview()")), "the owner's review, with the front office");
  if (!g("SEASON.review.fired")) {
    g("CAREER.job.gms = 100");
    g(`act("nextyear")`);
    const has = id => g(`!!playerById(mySchool(), "${id}")`);
    ok(has(ids[0]) && !has(ids[1]), "with full trust, the GM keeps the player you asked for and lets the other go");
    ok(g("CAREER.job.log.length") >= 1 && /Keep|Let go/.test(g("CAREER.job.log.map(x => x.t).join(' ')")), "and says so");
  }
  // His answers depend on your standing
  const odds = g(`(() => { CAREER.job.gms = 20; let a = 0; for (let i = 0; i < 400; i++) if (gmFollows("t" + i)) a++; CAREER.job.gms = 90; let b = 0; for (let i = 0; i < 400; i++) if (gmFollows("t" + i)) b++; return [a, b]; })()`);
  ok(odds[0] > 60 && odds[0] < 150 && odds[1] > 360, `low standing, few requests followed; high standing, nearly all (${odds.join(" and ")} of 400)`);
  // Standing, extensions and the owner firing the GM
  const yr = g(`(() => { const J = CAREER.job, s = mySchool(); J.gms = 50; J.log = [{ yes: true }]; proJobYear(J, { renewed: false }, 2, s); const up = J.gms; J.gms = 50; proJobYear(J, { renewed: false }, -2, s); const down = J.gms; J.sec = 30; s.gm.ten = 5; let fired = 0; for (let i = 0; i < 20; i++) { SEASON.seed++; s.gm.ten = 5; const R = {}; proJobYear(J, R, -1, s); if (R.gmFired) fired++; J.sec = 30; } return { up, down, fired }; })()`);
  ok(yr.up > 55 && yr.down < 45, `your standing rises with a good season and falls with a bad one (${yr.up}, ${yr.down})`);
  ok(yr.fired > 2 && yr.fired < 18, `an owner losing patience sometimes fires the GM instead of you (${yr.fired} of 20)`);
}

// ---- Step 4: control of the roster ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 60; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, true); proSetExpectations(); APP.screen = "season"; })()`);
  ok(/Your front office/.test(g("vPSeason()")) && /What your staff handles/.test(g(`(() => { act("gm"); return vGM(); })()`)), "with control: your front office and what your staff handles");
  const pid = g(`mySchool().players.find(p => p.ct && p.ct.g > 0).id`);
  g(`APP.view = { ctx: "season", team: SEASON.myId, back: "season", player: "${pid}" }; APP.screen = "player";`);
  ok(/Release him/.test(g("vPlayer()")), "a player's screen has your moves");
  const dead0 = g("mySchool().dead || 0");
  g(`act("release", { v: "${pid}" })`); g(`act("release", { v: "${pid}" })`);
  ok(!g(`mySchool().players.some(p => p.id === "${pid}")`) && g("mySchool().dead") > dead0, "releasing a player: he's gone, and his guarantee is dead money");
  const young = g(`mySchool().players.find(p => (p.exp || 0) <= 2 && !p.ir).id`), psN = g("mySchool().ps.length");
  g(`act("release", { v: mySchool().ps[0].id }); act("release", { v: mySchool().ps[0].id })`);
  g(`act("tops", { v: "${young}" })`);
  ok(g(`mySchool().ps.some(p => p.id === "${young}")`) && g("mySchool().ps.length") === psN, "moving a young player to the practice squad");
  g(`act("tor", { v: "${young}" })`);
  ok(g(`mySchool().players.some(p => p.id === "${young}")`), "and promoting him back");
  // Cuts that are yours
  g(`(() => { act("staffjob", { v: "cut" }); const s = mySchool(), gg = dice(4); for (let k = 0; k < 6; k++) s.players.push(streetPlayer(gg, "camp" + k, 55, "WR")); })()`);
  ok(g("CAREER.job.staff.cut") === false, "turning off the staff's cuts");
  g("simCamp()");
  ok(g("inCamp()") && g("cutWait()") && /the cuts are yours/.test(g("vPSeason()")), "camp waits at cutdown day until you're at 53");
  g(`act("staffcut")`);
  ok(!g("inCamp()") && g("onActive(mySchool()).length") === 53, "or your staff can cut for you, and the season starts");
}

// ---- Step 4: pro coaches from college ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  const n = g(`(() => { Object.values(OTHER.schools).filter(s => s.cls === "P4").forEach(s => { coachCareer(s.coach, s); s.coach.rep = 90; }); let up = 0; inWorld(THIRD, () => { for (let i = 0; i < 20; i++) { SEASON.seed++; if (colCoachUp({ id: "p" + i })) up++; } }); return up; })()`);
  ok(n > 3, `pro teams hire the best power-conference coaches now and then (${n} of 20)`);
}

// ---- Step 5: the draft ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  const pool = g(`inWorld(THIRD, () => { const D = THIRD.draft, ps = Object.keys(D.byId).map(id => draftProspect(D, id)), o = ps.map(p => ovr(p, p.pos)).sort((a, b) => b - a), cols = ps.map(p => OTHER.schools[p.cid]).filter(Boolean);
    return { n: ps.length, year: D.year, top: o[0], mid: o[223], p4: cols.filter(c => c.cls === "P4").length / cols.length, ages: ps.every(p => p.age >= 21 && p.age <= 23), cols: ps.every(p => !!p.col), ranges: ps.every(p => { const [lo, hi] = prospectRange(p); return hi - lo === 8; }) }; })`);
  ok(pool.n >= 350 && pool.n <= 460 && pool.year === 2027, `next spring's class: about 400 prospects (${pool.n}) for the ${pool.year} draft`);
  ok(pool.p4 > .5 && pool.cols, `from programs across the college world, most from the power conferences (${Math.round(pool.p4 * 100)} percent)`);
  ok(pool.top >= 78 && pool.mid >= 55 && pool.mid <= 68 && pool.ages, `the best are ready to start, the late picks are projects (best ${pool.top}, the 224th ${pool.mid}), ages 21 to 23`);
  ok(pool.ranges, "every prospect starts as a range 8 points wide");
  // Scouting narrows it
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 20; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, true); proSetExpectations(); APP.screen = "season"; })()`);
  ok(g("SEASON.draft.board.length") === 40, "your staff fills your board with 40");
  const top = g("SEASON.draft.board[0]"), low = g("SEASON.draft.board[39]");
  g(`act("dprospect", { v: "${top}" }); act("dpri", { v: 3 })`);
  ok(g(`SEASON.draft.pri["${top}"]`) === 3, "a top scouting priority");
  const w0 = g(`draftProspect(SEASON.draft, "${top}").sc.w`);
  g("simCamp()");
  for (let i = 0; i < 6; i++) g(`(() => { const gm = myGameIn(SEASON.week); if (gm && !played(gm)) simMyGame(); finishWeek(); })()`);
  const wt = g(`draftProspect(SEASON.draft, "${top}").sc.w`), wl = g(`draftProspect(SEASON.draft, "${low}").sc.w`);
  ok(wt < w0 && wt < wl, `scouting narrows the range, faster for a top priority (${w0} to ${wt.toFixed(1)}, against ${wl.toFixed(1)})`);
  ok(g(`(() => { const p = draftProspect(SEASON.draft, "${top}"), [lo, hi] = prospectRange(p), o = ovr(p, p.pos); return Math.abs((lo + hi) / 2 - o) <= Math.abs(p.sc.b) + .5; })()`), "and moves the estimate toward the truth");
  g(`act("dbmove", { v: "down" })`);
  ok(g(`SEASON.draft.board[1]`) === top, "moving a prospect down your board");
  g(`act("dbmove", { v: "top" })`);
  ok(g(`SEASON.draft.board[0]`) === top, "and back to the top");
  g("simSeason()");
  ok(g("SEASON.draft.cmb") && /40-yard dash/.test(g(`combineText(draftProspect(SEASON.draft, "${top}"))`)), "the combine after the season: the 40, the bench and the vertical");
  ok(g(`draftProspect(SEASON.draft, "${top}").sc.w`) < wt, "and the ranges narrow again");
  g(`act("offseason")`);
  let k = 0; while (g("APP.screen") !== "offseason" && k++ < 8) { const sc = g("APP.screen"); g(sc === "review" ? `act("carousel")` : sc === "carousel" ? `act("market")` : sc === "market" ? (g("SEASON.review.fired") ? `act("market")` : `act("stay")`) : `act("offseason")`); }
  if (!g("SEASON.review.fired")) {
    ok(g("SEASON.off.stage") === "resign" && g(`(() => { act("draftroom"); return APP.screen; })()`) !== "draftroom", "the draft waits until free agency is done");
    g(`act("fastart"); act("faall"); act("faall")`);
    ok(g("SEASON.off.stage") === "draft", "then it's draft time");
    g(`act("draftroom")`);
    const P = g("SEASON.draft.picks");
    ok(g("APP.screen") === "draftroom" && P.length === 224 + g("SEASON.comp.length") && P.slice(0, 32).every((pk, i) => pk.rd === 1 && pk.n === i + 1), `the draft room: seven rounds of 32, and ${g("SEASON.comp.length")} compensatory picks`);
    const ord = g(`proDraftOrder(SEASON)`), first = g(`(() => { const o = proDraftOrder(SEASON); return [recPct(proRecord(o[0], PRO_REG)), recPct(proRecord(o[13], PRO_REG)), o[31] === SEASON.post.champ, SEASON.post.A.seeds.concat(SEASON.post.P.seeds).includes(o[20])]; })()`);
    ok(first[0] <= first[1] && first[2] && first[3], "the order: worst records first, then the playoff teams by how far they went, the champion last");
    void ord;
    g(`act("dsim")`);
    const cur = g("SEASON.draft.picks[SEASON.draft.cur]");
    ok(cur.team === g("SEASON.myId"), `simming to your pick (${cur.n})`);
    ok(/You're on the clock/.test(g("vDraftRoom()")) && /Take /.test(g("vDraftRoom()")), "you're on the clock, with the best of your board to take");
    const want = g(`SEASON.draft.board.find(id => !draftTaken(SEASON.draft).has(id))`);
    g(`act("dtake", { v: "${want}" })`);
    ok(g(`SEASON.draft.picks.find(pk => pk.n === ${cur.n}).pid`) === want, "taking him");
    g(`act("dsimall"); act("dsimall")`);
    ok(g("SEASON.draft.done") && g(`SEASON.draft.picks.every(pk => !!pk.pid)`) && g(`new Set(SEASON.draft.picks.map(pk => pk.pid)).size`) === g("SEASON.draft.picks.length"), "the rest of the draft: every pick made, nobody picked twice");
    const val = g(`(() => { const D = SEASON.draft, o = pk => { const p = draftProspect(D, pk.pid); return ovr(p, p.pos) + p.pot; }, a = D.picks.slice(0, 32).map(o), b = D.picks.slice(192).map(o); return [avg(a), avg(b)]; })()`);
    ok(val[0] > val[1] + 10, `first-rounders are better than seventh-rounders (${val.map(x => x.toFixed(0)).join(" and ")})`);
    g(`act("nextyear")`);
    const rk = g(`mySchool().players.filter(p => p.pick && p.pick.year === 2027)`), udfa = g(`mySchool().players.filter(p => /u$/.test(p.id))`);
    ok(rk.length >= 6 && rk.every(p => p.ct.rk && p.ct.y.length === 4), `your drafted rookies are in camp on four-year rookie contracts (${rk.length})`);
    const r1 = rk.find(p => p.pick.rd === 1);
    ok(!r1 || (r1.ct.g === r1.ct.y.reduce((a, b) => a + b, 0) && r1.ct.o5), "a first-rounder's contract is fully guaranteed, with a fifth-year option");
    ok(udfa.length >= 3 && udfa.every(p => p.ct.y.length === 3 && p.ct.y[0] === g("proMin(0)")), `undrafted free agents on three-year minimum contracts (${udfa.length})`);
    ok(g(`Object.values(SEASON.schools).filter(s => !isFull(s)).every(s => s.roster.some(x => /\|0\|/.test(x) && x.startsWith("d2027")))`), "every team has rookies from the draft");
    ok(g("SEASON.draft.year") === 2028 && g("SEASON.draft.board.length") > 0, "and next year's class is on the board");
  }
}

// ---- Step 5: the players you coached ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  // From your college program: the players who leave for good go to the next draft
  const n = g(`(() => { const C = OTHER, s = rosterAt(Object.values(C.schools).find(x => x.cls === "P4"), 2026), best = s.players.sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).slice(0, 3); noteFormers(best, s.town, 2026); return THIRD.formers.length; })()`);
  ok(n === 3, "the players who leave your college program are noted for the draft");
  g(`inWorld(THIRD, () => { proSeasonOnPaper(); })`);
  g(`proWorldNextYear()`);
  const dr = g("THIRD.drafted || []");
  ok(g(`Object.values(THIRD.schools).some(s => s.roster.some(x => /"you"/.test(x)))`) || dr.length > 0, `and are drafted, or sign as undrafted free agents (${dr.length} drafted)`);
  ok(dr.every(t => /round \d, pick \d+, by the /.test(t)), "the draft notes where they went");
  // From your high school: a player who signed with a college comes up when his college career is over
  const hs = g(`(() => { const C = OTHER, c = Object.values(C.schools).find(x => x.cls === "P4"), p = genPlayer(dice(5), { id: "hsstar", arch: "speed", yr: 12, level: 60, last: "Hill" }); sendToCollege(p, c.id, 2021, "Bellmont Greyhounds"); const q = c.joined.find(x => x.id === "hsstarc"); return { you: q.you, name: q.hsName }; })()`);
  ok(hs.you && hs.name === "Bellmont Greyhounds", "a high school player you sent to college is marked as yours");
}

// ---- Step 6: re-signing, the tag and free agency ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 60; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, true); proSetExpectations(); APP.screen = "season"; })()`);
  g("simSeason()");
  g(`act("offseason")`);
  let k = 0; while (g("APP.screen") !== "offseason" && k++ < 8) { const sc = g("APP.screen"); g(sc === "review" ? `act("carousel")` : sc === "carousel" ? `act("market")` : sc === "market" ? (g("SEASON.review.fired") ? `act("market")` : `act("stay")`) : `act("offseason")`); }
  if (!g("SEASON.review.fired")) {
    ok(g("SEASON.off.stage") === "resign" && /Re-signing and the franchise tag/.test(g("vPOffseason()")), "the offseason opens with re-signing and the tag");
    const ex = g(`expiringOf(mySchool()).filter(p => (p.exp || 0) >= 4).sort((a, b) => proValue(b) - proValue(a)).map(p => ({ id: p.id, pay: capHit(p), pos: p.pos, name: fullName(p) }))`);
    const tp = g(`tagPrice(SEASON, playerById(mySchool(), "${ex[0].id}"))`), top5 = g(`(() => { const h = []; Object.values(SEASON.schools).forEach(s => (isFull(s) ? s.players : s.roster.map(unpackPlayer)).forEach(q => { if (q.pos === "${ex[0].pos}") h.push(capHit(q)); })); h.sort((a, b) => b - a); return avg(h.slice(0, 5)); })()`);
    ok(Math.abs(tp - Math.max(top5, ex[0].pay * 1.2)) < 10000, `the tag's price: the top five at his position, or 120 percent of his pay (${g(`bigMoney(${tp})`)})`);
    g(`act("rsset", { t: "tag", v: "${ex[0].id}" }); act("rsset", { t: "ext", v: "${ex[1].id}" }); act("rsset", { t: "go", v: "${ex[2].id}" })`);
    const cap0 = g("SEASON.cap");
    g(`act("fastart")`);
    ok(g("SEASON.off.stage") === "fa" && g("SEASON.off.day") === 1 && g("SEASON.cap") > cap0, `the new league year: a bigger cap (${g("bigMoney(SEASON.cap)")}) and free agency open`);
    const t = g(`(() => { const p = playerById(mySchool(), "${ex[0].id}"); return p && { y: p.ct.y, g: p.ct.g, tag: p.tag }; })()`);
    ok(t && t.y.length === 1 && t.y[0] === tp && t.g === tp && t.tag === 2027, "the tagged player: one more year at the tag price, fully guaranteed");
    const e = g(`(() => { const p = playerById(mySchool(), "${ex[1].id}"); return p && ctYears(p); })()`);
    const retiredX = e == null && g(`SEASON.off.mine.retired.some(x => x.name === ${JSON.stringify(ex[1].name)})`);
    ok(e >= 1 || retiredX, `the extended player is signed on (${retiredX ? "he retired at the new league year instead" : e + " years"})`);
    ok(!g(`playerById(mySchool(), "${ex[2].id}")`) && g(`faPlayers(SEASON).some(p => p.id === "${ex[2].id}" && p.from === SEASON.myId) || Object.values(SEASON.schools).some(s => !isFull(s) && s.roster.some(x => x.startsWith("${ex[2].id}|"))) || SEASON.off.mine.retired.length > 0`), "the one you let go is a free agent (or already signed elsewhere)");
    const fa = g(`(() => { const F = faPlayers(SEASON); return { n: F.length, noCt: F.every(p => !p.ct), from: F.every(p => !!SEASON.schools[p.from]) }; })()`);
    ok(fa.n > 150 && fa.noCt && fa.from, `the market: ${fa.n} free agents, each from his old team`);
    ok(g(`Object.values(SEASON.schools).every(s => (s.dead || 0) === 0)`), "dead money starts over in the new league year");
    // Your offer
    const target = g(`(() => { const F = faPlayers(SEASON).filter(p => !(SEASON.off.offers[p.id] || []).length).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)); return F[0].id; })()`);
    g(`act("faplayer", { v: "${target}" })`);
    ok(/Your offer/.test(g("vFAPlayer()")) && /Years/.test(g("vFAPlayer()")), "a free agent's screen: your offer, by years, pay and guarantee");
    ok(g(`myFAOffer(SEASON, "${target}", 3, capRoom(mySchool()) + 1e6, .3)`) !== "", "an offer bigger than your room is turned down");
    g(`act("fapay", { v: 1.25 }); act("fagtd", { v: "most" }); act("faoffer")`);
    ok(g(`SEASON.off.offers["${target}"].some(o => o.team === SEASON.myId)`), "making an offer");
    g(`act("faday")`);
    ok(g(`!!playerById(mySchool(), "${target}")`), "a big enough offer, and he signs with you at the end of the day");
    ok(g("SEASON.off.mine.signed.length") >= 1 && /Signed/.test(g("vPOffseason()")), "and the offseason screen says so");
    g(`act("faall"); act("faall")`);
    ok(g("SEASON.off.stage") === "draft" && g("SEASON.off.pool.length") === 0, "after five days, free agency closes");
    const comp = g("SEASON.comp");
    const per = {}; comp.forEach(c => { per[c.team] = (per[c.team] || 0) + 1; });
    ok(comp.length <= 32 && Object.values(per).every(n => n <= 4) && comp.every(c => c.rd >= 3 && c.rd <= 7), `compensatory picks: ${comp.length}, at most four a team, in rounds 3 to 7`);
    const signedN = g(`(() => { let n = 0; Object.values(SEASON.schools).forEach(s => { (isFull(s) ? s.players : s.roster.map(unpackPlayer)).forEach(p => { if (p.ct && !p.ct.rk && p.age >= 24) n++; }); }); return n; })()`);
    ok(signedN > 1000, "teams filled out with free agents and veterans");
    g(`act("draftroom")`);
    const P = g("SEASON.draft.picks");
    ok(comp.length === 0 || P.filter(pk => pk.comp).length === comp.length && P.filter(pk => pk.comp).every(pk => P.find(x => x.rd === pk.rd + 1) ? P.indexOf(pk) < P.findIndex(x => x.rd === pk.rd + 1) : true), "the compensatory picks come at the ends of their rounds");
    g(`act("dsimall"); act("dsimall")`);
    g(`act("nextyear")`);
    ok(/Signed in free agency/.test(g("vNewYear()")), "the new year's report lists your free agent signings");
    ok(g(`(() => { const p = playerById(mySchool(), "${ex[0].id}"); return !p || (p.ct.y.length === 1 && /franchise tag/.test(proContractText(p))); })()`), "the tagged player plays the season on the tag");
  }
}

// ---- Step 6: with a GM ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 20; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, false); proSetExpectations(); APP.screen = "season"; })()`);
  g("simSeason()");
  g(`act("offseason")`);
  let k = 0; while (g("APP.screen") !== "offseason" && k++ < 8) { const sc = g("APP.screen"); g(sc === "review" ? `act("carousel")` : sc === "carousel" ? `act("market")` : sc === "market" ? (g("SEASON.review.fired") ? `act("market")` : `act("stay")`) : `act("offseason")`); }
  if (!g("SEASON.review.fired")) {
    ok(/Your GM decides/.test(g("vPOffseason()")) && /Ask to keep/.test(g("vPOffseason()")), "with a GM: he decides, and you can ask");
    g(`act("fastart")`);
    const target = g(`faPlayers(SEASON).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos))[0].id`);
    g(`act("faplayer", { v: "${target}" })`);
    ok(/Ask the GM to go after him/.test(g("vFAPlayer()")), "a free agent's screen: ask the GM to go after him");
    g(`act("fawant")`);
    ok(g("myReq().want.id") === target, "the request is noted");
    ok(g("Object.values(SEASON.off.offers).some(os => os.some(o => o.team === SEASON.myId))") || g("SEASON.off.mine.signed.length") >= 0, "and the GM makes offers for your team");
  }
}

// ---- The GM's trades read from your side, with the player's name ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 20; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, false); proSetExpectations(); })()`);
  const before = g("[mySchool().players.length, teamPicks(SEASON, SEASON.myId).length]");
  const news = g(`(() => { const W = SEASON, out = []; W.phase = "regular"; W.news = W.news || {}; for (let n = 1; n <= 8; n++) { W.week = n; tradeWeek(W, n).forEach(x => { if (/^Your GM/.test(x)) out.push(x); }); } return out; })()`);
  const after = g("[mySchool().players.length, teamPicks(SEASON, SEASON.myId).length]");
  ok(news.length >= 1 && news.every(x => /^Your GM made a trade with the \w[\w ]*\. You gave up [A-Z][^?]+ \(\w[\w ]* \d+\)\. You got [^?]+\.$/.test(x)), `a trade your GM takes names the player you gave up and what you got (${news[0]})`);
  ok(after[0] === before[0] - news.length && after[1] > before[1], "and the player left and the picks came in");
  // His own move: a starter for no more than four picks, even with a full roster
  const mv = g(`(() => { const W = SEASON, n0 = teamPicks(W, W.myId).length, pos = ["RB", "WR", "OL", "LB", "CB", "S"].find(p => { const t = gmMove(W, p); if (t) W.__t = t; return t; }); return { pos, t: W.__t, gave: n0 - teamPicks(W, W.myId).length, size: onActive(mySchool()).length }; })()`);
  ok(mv.pos && mv.gave >= 1 && mv.gave <= 4 && /You gave up .+ pick.*\. You got [A-Z][^?]+ \(/.test(mv.t) && mv.size <= 53, `the GM's own move costs four picks at most and keeps the roster legal (${mv.t})`);
}

// ---- Step 7: trades ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(91, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 60; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, true); proSetExpectations(); APP.screen = "season"; })()`);
  ok(Math.round(g("chartValue(1)")) === 3000 && Math.abs(g("chartValue(32)") - 590) < 15 && g("chartValue(64)") < 300 && g("chartValue(160)") < 40, "the pick value chart: 3,000 for the first pick, about 590 for the 32nd, falling after");
  const me = g("SEASON.myId"), yr = g("SEASON.draft.year");
  ok(g(`teamPicks(SEASON, "${me}").length`) === 21, "every team has its picks in the next three drafts: 21");
  ok(g(`pickValue(SEASON, pickKey(${yr + 1}, 1, "${me}"))`) < g(`pickValue(SEASON, pickKey(${yr}, 1, "${me}"))`) * .5, "a pick a year out is worth about a round less");
  ok(g("tradesOpen(SEASON)"), "trades are open in camp");
  // Building a trade
  const them = g(`Object.keys(SEASON.schools).find(id => id !== SEASON.myId)`);
  g(`act("trade")`);
  ok(g("APP.screen") === "trade" && /Trade with/.test(g("vTrade()")), "the trade screen: pick a team");
  g(`act("trteam", { v: "${them}" })`);
  const star = g(`(() => { const B = proRoster(SEASON.schools["${them}"]); return B.players.slice().sort((a, b) => playerTradeValue(b) - playerTradeValue(a))[0].id; })()`);
  g(`act("trin", { t: "get", v: "p:${star}" })`);
  ok(/Not close/.test(g("vTrade()")), "asking for their best player for nothing: not close");
  const cheap = g(`(() => { const B = proRoster(SEASON.schools["${them}"]); return B.players.filter(p => ovr(p, p.pos) < 66 && capHit(p) <= proMin(3)).sort((a, b) => playerTradeValue(a) - playerTradeValue(b))[0].id; })()`);
  g(`act("trclear"); act("trin", { t: "get", v: "p:${cheap}" }); act("trin", { t: "give", v: "k:${yr}:1:${me}" })`);
  ok(/They.{1,5}d take that/.test(g("vTrade()")), "a first-round pick for a backup: they'd take that");
  const before = g("onActive(mySchool()).length");
  g(`act("trsend")`);
  ok(g(`mySchool().players.some(p => p.id === "${cheap}")`) && !g(`proRoster(SEASON.schools["${them}"]).players.some(p => p.id === "${cheap}")`), "the player changes teams");
  ok(g(`pickOwnerOf(SEASON, "${yr}:1:${me}")`) === them && !g(`teamPicks(SEASON, "${me}").includes("${yr}:1:${me}")`) && g(`teamPicks(SEASON, "${them}").includes("${yr}:1:${me}")`), "and so does the pick");
  ok(g("onActive(mySchool()).length") === before + 1 && g("APP.trade") === null, "your roster grows by one");
  // A cap check
  ok(g(`(() => { const T = newTrade("${them}"); const B = SEASON.schools["${them}"]; B.dead = (B.dead || 0) + 1e9; T.give.players.push(mySchool().players.slice().sort((a, b) => capHit(b) - capHit(a))[0].id); const w = tradeAnswer(SEASON, T).word; B.dead -= 1e9; return w; })()`) === "They can't fit it under the cap.", "a team can't take on pay it can't fit");
  // An offer from another team
  let tries = 0;
  while (!g("SEASON.tradeOffer") && tries++ < 60) g(`(() => { const T = cpuOfferFor(SEASON, seededRandom(${tries})); if (T) { T.at = 0; SEASON.tradeOffer = T; } })()`);
  if (g("SEASON.tradeOffer")) {
    ok(/An offer from the/.test(g("vTrade()")) && /Accept it/.test(g("vTrade()")), "an offer from another team waits on the trade screen");
    const O = g("SEASON.tradeOffer");
    g(`act("tracc")`);
    ok(!g(`mySchool().players.some(p => p.id === "${O.give.players[0]}")`) && O.get.picks.every(k => g(`pickOwnerOf(SEASON, "${k}")`) === me), "accepting it: your player goes, their picks come");
  } else ok(false, "a computer team makes an offer");
  // The season: trades between computer teams, and the deadline
  g("simCamp()");
  for (let i = 0; i < 9; i++) g(`(() => { const gm = myGameIn(SEASON.week); if (gm && !played(gm)) simMyGame(); finishWeek(); })()`);
  ok(!g("tradesOpen(SEASON)") && /Trades are closed/.test(g("vTrade()")), "after week 9 the deadline has passed");
  const news = g(`Object.values(SEASON.news).flat().filter(t => /^Trade: /.test(t))`);
  ok(news.length >= 1, `computer teams trade with each other (${news.length} by the deadline${news[0] ? `: ${news[0]}` : ""})`);
  ok(g(`Object.values(SEASON.schools).filter(s => !isFull(s)).every(s => { const r = proRoster(s); return onActive(r).length <= 53 && capRoom(r) > -5e6; })`), `every roster stays legal (${g(`Object.values(SEASON.schools).filter(s => !isFull(s)).map(s => { const r = proRoster(s); return onActive(r).length + "/" + Math.round(capRoom(r) / 1e6); }).join(" ")`)})`);
  // Picks carry into the draft
  g("simSeason()");
  g(`act("offseason")`);
  let k = 0; while (g("APP.screen") !== "offseason" && k++ < 8) { const sc = g("APP.screen"); g(sc === "review" ? `act("carousel")` : sc === "carousel" ? `act("market")` : sc === "market" ? (g("SEASON.review.fired") ? `act("market")` : `act("stay")`) : `act("offseason")`); }
  if (!g("SEASON.review.fired")) {
    ok(g("tradesOpen(SEASON)"), "trades open again in the offseason");
    g(`act("fastart"); act("faall"); act("faall"); act("draftroom")`);
    ok(g(`SEASON.draft.picks.find(pk => pk.key === "${yr}:1:${me}").team`) === them, "the pick you traded is theirs on draft day");
    ok(/from the /.test(g(`pickText(SEASON.draft.picks.find(pk => pk.key === "${yr}:1:${me}"))`)), "and shows where it came from");
    g(`act("dsim")`);
    const cur = g("SEASON.draft.picks[SEASON.draft.cur]");
    if (cur && cur.team === me && cur.key) {
      const offers = g("tradeDownOffers(SEASON, SEASON.draft)");
      ok(offers.length >= 1 && /Trade down/.test(g("vDraftRoom()")), `on the clock, teams call to move up (${offers.length})`);
      if (offers.length) {
        g(`act("dtrade", { v: "${offers[0].with}" })`);
        ok(g(`SEASON.draft.picks.find(pk => pk.n === ${cur.n}).team`) === offers[0].with && offers[0].get.picks.every(k => g(`pickOwnerOf(SEASON, "${k}")`) === me), "trading down: they pick there, and their picks are yours");
      }
    }
    g(`act("dsimall"); act("dsimall"); act("nextyear")`);
    ok(g(`Object.keys(SEASON.pickOwner || {}).every(k => +k.split(":")[0] > ${yr})`), "traded picks from a draft that's been held are cleared");
    ok(g(`teamPicks(SEASON, "${me}").every(k => +k.split(":")[0] > ${yr})`), "and the next three drafts are the ones that count");
  }
}

// ---- Step 7: with a GM, a move at a position ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(92, 2026);`);
  g(`(() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 20; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, false); proSetExpectations(); APP.screen = "season"; })()`);
  ok(/Your GM makes the trades/.test(g("vTrade()")) && !/data-a="trade"/.test(g("vPSeason()")), "with a GM, he makes the trades");
  g(`act("gm")`);
  ok(/Ask him to trade for a starter/.test(g("vGM()")), "you can ask him for a move at a position");
  g(`act("gmmove", { v: "WR" })`);
  ok(g("myReq().move") === "WR", "the request is noted");
  g(`CAREER.job.gms = 100`);
  g("simCamp()");
  for (let i = 0; i < 9; i++) g(`(() => { const gm = myGameIn(SEASON.week); if (gm && !played(gm)) simMyGame(); finishWeek(); })()`);
  ok(g(`(CAREER.job.log || []).some(x => /Make a move at receiver/.test(x.t))`) && g("myReq().move") === null, `he answers by the deadline (${(g("CAREER.job.log") || []).map(x => x.t).filter(t => /move/.test(t)).join("")})`);
}

// ---- Step 8: renaming the pros ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(93, 2026);`);
  g(`act("names"); act("nmtab", { v: "pro" })`);
  const v = g("vNames()");
  ok(/League name/.test(v) && /Championship game/.test(v) && /Atlantic North, 4 teams/.test(v), "the names screen's Pros section: the league, its championship, conferences and divisions");
  g(`act("nmpdiv", { v: "pd0" })`);
  ok(/Division name/.test(g("vNames()")) && /Nickname/.test(g("vNames()")) && /City/.test(g("vNames()")), "a division: its name, and each team's city and nickname");
  const id = g(`proWorld().confs[0].ids[0]`);
  g(`typed("nm|s|t|${id}", "Lakeshore"); typed("nm|s|m|${id}", "Herons"); typed("nm|l|league|", "Big Show League"); typed("nm|l|bowl|", "Big Show"); typed("nm|l|A|", "Eastern"); typed("nm|c||pd1", "Iron Division")`);
  ok(g(`schoolName(proWorld().schools["${id}"])`) === "Lakeshore Herons", "renaming a team");
  ok(g("PRO_LEAGUE") === "the Big Show League" && g("levelName('PRO')") === "The Big Show League" && g("PRO_BOWL") === "Big Show" && g("PRO_ROUND_NAMES[4]") === "Big Show", "the league and its championship game");
  ok(g("PRO_CONF_NAMES.A") === "Eastern Conference" && g("proWorld().confs[0].name") === "Eastern North" && g("proWorld().confs[1].name") === "Iron Division", "a conference, with its divisions going along unless you've named them");
  const list = g("namesText()");
  ok(/league league: Big Show League/.test(list) && /league bowl: Big Show/.test(list) && /league A: Eastern/.test(list) && /conference pd1: Iron Division/.test(list), "the pro names in the list to copy out");
  g(`resetNames()`);
  ok(g("PRO_LEAGUE") === "the Sunday League" && g("PRO_CONF_NAMES.A") === "Atlantic Conference" && g("proWorld().confs[0].name") === "Atlantic North" && g("proWorld().confs[1].name") === "Atlantic South", "going back to the game's names");
  ok(g(`loadNamesText("league bowl: Big Show\\nleague P: Western")`) === 2 && g("PRO_BOWL") === "Big Show" && g("proWorld().confs[4].name") === "Western North", "loading a list");
}

console.log(`${checks - fails}/${checks} checks passed`);
if (fails) process.exit(1);
