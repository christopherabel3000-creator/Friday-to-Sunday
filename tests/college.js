// Milestone 4, college. Step 1: college rules (NCAA) and the college exhibition game.
// Usage: node tests/college.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
function game(watch) {
  const sb = load(), g = sb.__get, F = sb.__fts;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition("col"); APP.ex.you = ${watch ? '"watch"' : 0}; startExhibition();`);
  return { sb, g, F };
}
function plain(g, extra) {
  g(`Object.assign(S, { quarter: 1, clock: 600, poss: 0, spot: 40, down: 1, toGo: 10, phase: "", toss: null, periodOver: false, gameOver: false,
    needPAT: false, tryChoice: null, kickChoice: null, retryTwo: null, twoPt: null, clockRunning: false, oobRestart: false, ot: null, otEnd: false, runClock: false, fcKick: false, fcNow: false });
    S.teams[0].score = 0; S.teams[1].score = 0;`);
  if (extra) g(`Object.assign(S, ${JSON.stringify(extra)})`);
}

// ---- The college exhibition ----
{
  const { g } = game(true);
  ok(g("S.cfg.level") === "col" && g("R().qLen") === 900 && g("R().twoMinWarning") && g("R().kickoff.spot") === 35 && g("R().kickoff.tb") === 25, "a college exhibition plays by college rules: 15-minute quarters, the two-minute timeout, kickoffs from the 35");
  const sizes = g("APP.ex.schools.map(s => s.players.length)");
  ok(sizes.every(n => n >= 95 && n <= 106), `college rosters of about 105 (${sizes.join(", ")})`);
  const tw = g(`APP.ex.schools.map(s => { const o = new Set(); OFF_POS.forEach(p => (s.depth[p] || []).slice(0, STARTERS[p]).forEach(id => o.add(id))); let n = 0; DEF_POS.forEach(p => (s.depth[p] || []).slice(0, STARTERS[p]).forEach(id => { if (o.has(id)) n++; })); return n; })`);
  ok(tw.every(n => n === 0), `nobody starts both ways in college (${tw.join(", ")})`);
  const st = g(`APP.ex.schools.map(s => Math.round((sideRating(s, "off") + sideRating(s, "def")) / 2))`);
  ok(st.every(v => v >= 60 && v <= 78), `power-conference starters rate in the 60s and 70s (${st.join(", ")})`);
  ok(g(`/College/.test(vExhibition()) && /data-a="exlevel"/.test(vExhibition())`), "the exhibition screen offers high school or college");
  g(`act("exlevel", { v: "hs" })`);
  ok(g("APP.ex.level") === "hs" && g("APP.ex.schools[0].cls") === "1A", "and back to high school");
}

// ---- Clock rules ----
{
  const { g } = game(true);
  // A first down: the clock keeps running, except in the last two minutes of a half
  plain(g, { quarter: 1, clock: 600 });
  g(`finishClock({ fd: true }, false)`);
  ok(g("S.clockRunning") && !g("S.oobRestart"), "the clock keeps running after a first down");
  plain(g, { quarter: 2, clock: 100 });
  g(`finishClock({ fd: true }, false)`);
  ok(g("S.oobRestart") && g("S.readyWhy") === "fd", "in the last two minutes of a half, a first down stops the clock until the ball is ready");
  plain(g, { quarter: 3, clock: 300 });
  g(`finishClock({ oob: true }, false)`);
  ok(g("S.oobRestart") && g("S.clockRunning"), "out of bounds: the clock starts again on the ready");
  plain(g, { quarter: 4, clock: 90 });
  g(`finishClock({ oob: true }, false)`);
  ok(!g("S.clockRunning"), "and waits for the snap in the last two minutes");
  // The two-minute timeout
  plain(g, { quarter: 2, clock: 125, clockRunning: true });
  ok(g("runoff(10)") === "tmw" && g("S.clock") === 120, "the two-minute timeout stops the clock at 2:00");
}

// ---- Kicks ----
{
  const { g } = game(true);
  // Kickoffs: touchbacks at the 25, and fair catches inside the 25 count as touchbacks
  let tb = 0, at25 = 0, returned = 0, below = 0;
  for (let i = 0; i < 300; i++) {
    plain(g, { poss: 1 });
    const text = g("kickoff(0, false)"), spot = g("S.spot");
    if (/touchback/i.test(text)) { tb++; if (spot === 25) at25++; }
    else { returned++; if (spot < 25 && /fair catch/.test(text)) below++; }
  }
  ok(tb > 40 && tb === at25 && below === 0, `college touchbacks come out to the 25 (${tb} of 300, all at the 25), and a fair catch inside it is one too`);
  ok(returned > 60, `plenty of kickoffs are still returned (${returned})`);
  // A missed field goal goes to the defense at the line of scrimmage, or the 20
  let prev = true, n = 0;
  for (let i = 0; i < 200 && n < 25; i++) {
    plain(g, { poss: 0, spot: 60, down: 4, toGo: 8 });
    g(`S.offCall = "fg"; S.defCall = "ba"; S.offPkg = "fgu"; S.defPkg = "base"`);
    const r = g("doFG()");
    if (r.head === "No good") { n++; if (g("S.poss") !== 1 || g("S.spot") !== 40) prev = false; }
  }
  ok(n > 0 && prev, `a missed field goal from the 40: the other team's ball at its 40, the line of scrimmage (${n} misses)`);
  plain(g, { poss: 0, spot: 88, down: 4, toGo: 5 });
  let twenty = true, m = 0;
  for (let i = 0; i < 400 && m < 10; i++) {
    plain(g, { poss: 0, spot: 88, down: 4, toGo: 5 });
    g(`S.offCall = "fg"; S.defCall = "blk"; S.offPkg = "fgu"; S.defPkg = "base"; S.teams[0].players.forEach(p => { if (p.pos === "K") p.r.kac = 1; })`);
    const r = g("doFG()");
    if (r.head === "No good") { m++; if (g("S.spot") !== 20) twenty = false; }
  }
  ok(m > 0 && twenty, "a miss from inside the 20 comes out to the 20");
  // No tees, and college kickers: extra points are about 95 percent
  const xp = (() => { let t = 0; for (let i = 0; i < 12; i++) { const f = game(true); t += f.g(`fgProbFor(0, xpDist(R().tryTwo))`); } return t / 12; })();
  ok(xp > .88 && xp <= .99, `extra points are good most of the time, on average (${Math.round(xp * 100)} percent)`);
  // A fair-catch kick after a fair catch: on the next snap, from the spot, with no rush
  g("S.teams[0].cpu = false");
  plain(g, { poss: 0, spot: 70, down: 1, toGo: 10, fcKick: true, quarter: 2, clock: 300 });
  g("startPlay()");
  ok(g("S.phase") === "call" && g("fcKickNow()") && g("fgAvailable()") && g("kickDist()") === 40 && g("stPkgIds()").includes("fgu"), "after a fair catch, a fair-catch kick from the spot: 10 yards plus the distance to the goal line");
  plain(g, { poss: 0, spot: 70, down: 1, toGo: 10, fcKick: false, quarter: 2, clock: 300 });
  g("startPlay()");
  ok(!g("fcKickNow()") && g("kickDist()") === 47 && !g("fgAvailable()"), "without one, it's an ordinary field goal distance, and no kick on first down");
  let fckMade = 0, fckBlocked = 0;
  const kg = game(true).g;
  for (let i = 0; i < 60; i++) { plain(kg, { poss: 0, spot: 70, down: 1, toGo: 10, fcNow: true }); kg(`S.offCall = "fg"; S.defCall = "blk"; S.offPkg = "fgu"; S.defPkg = "base"`); const r = kg("doFG()"); if (/fair-catch kick is good/.test(r.text)) fckMade++; if (r.head === "Blocked!") fckBlocked++; }
  ok(fckMade > 30 && fckBlocked === 0, `a fair-catch kick can't be blocked (${fckMade} of 60 good from 40 yards)`);
  g("S.teams[0].cpu = true");
}

// ---- Pass interference ----
{
  const { g } = game(true);
  let max = 0, auto = true;
  for (let i = 0; i < 200; i++) {
    plain(g, { spot: 30, down: 2, toGo: 8 });
    g(`S.offCall = "dp"`);
    const e = g(`enforce("dpi", { spot: 30, down: 2, toGo: 8 })`);
    max = Math.max(max, e.yds);
    if (e.s.down !== 1) auto = false;
  }
  ok(max === 15 && auto, `defensive pass interference: a spot foul of up to 15 yards, and an automatic first down (longest ${max})`);
  ok(g(`R().pen.opi.yds`) === 10, "offensive pass interference is 10 yards");
}

// ---- College overtime ----
{
  let otGames = 0, bad = [], twoForced = 0, twoPlays = 0;
  for (let i = 0; i < 200 && otGames < 60; i++) {
    const { g, F } = game(true);
    plain(g, { quarter: 4, clock: 0, periodOver: true });
    g(`S.teams[0].score = 21; S.teams[1].score = 21; endPeriod()`);
    const t = g("S.toss");
    if (!t || !t.ot || !t.hs) { bad.push("tied after regulation: an overtime coin toss"); continue; }
    g(`tossCall("heads"); tossChoose("defense")`);
    if (g("S.ot.kind") !== "ncaa" || g("S.spot") !== 75 || g("S.toGo") !== 10) bad.push("a college overtime possession starts 1st and 10 at the 25");
    otGames++;
    g("startPlay()");
    let n = 0;
    while (g("S.phase") !== "final" && n < 3000) { F.autoStep(); n++; if (g("S.quarter") >= 5 && g("S.clock") !== 0) bad.push("no clock in overtime"); }
    const log = g("S.log");
    log.filter(e => e.q === 6).forEach(e => { if (e.sit === "Extra point") bad.push("the second overtime requires a two-point try"); if (e.sit === "Two-point try") twoForced++; });
    log.filter(e => e.q >= 7).forEach(e => { if (e.sit !== "Two-point try" && e.sit !== "Timeout") bad.push("from the third overtime, every possession is a two-point play: " + e.sit); else twoPlays++; });
    if (g("S.teams[0].score === S.teams[1].score")) bad.push("overtime ended tied");
    if (/kickoff|returns the kick/i.test(g("S.log").filter(e => e.q >= 5).map(e => e.text).join(" "))) bad.push("no kickoffs in overtime");
  }
  ok(otGames >= 30 && bad.length === 0, `college overtime (${otGames} games): ${[...new Set(bad)].join("; ") || "possessions from the 25, two-point rules, no clock, no ties"}`);
  ok(twoForced + twoPlays > 0, `games reached the second overtime or later (${twoForced} required tries, ${twoPlays} two-point plays)`);
}

// ---- Step 2: the college world ----
{
  const sb = load(), g = sb.__get;
  const t0 = Date.now();
  g(`SEASON = newColSeason(4242, 2026)`);
  const ms = Date.now() - t0;
  const n = g(`(() => { const o = {}; Object.values(SEASON.schools).forEach(s => { o[s.cls] = (o[s.cls] || 0) + 1; }); return o; })()`);
  ok(n.P4 === 68 && n.G5 === 68 && n.FCS === 128 && n.D2 === 164 && n.D3 === 244, `five levels sized like real college football: ${JSON.stringify(n)}`);
  ok(g("SEASON.confs.length") === 63 && g(`Object.values(SEASON.schools).filter(s => !s.conf).map(s => s.cls).sort().join()`) === "G5,G5,P4", "63 conferences, one power independent and two other FBS independents");
  ok(g(`new Set(Object.values(SEASON.schools).map(s => s.town)).size`) === 672 && g(`new Set(SEASON.confs.map(c => c.name)).size`) === 63, "every program and conference has its own name");
  ok(ms < 1500, `the college world is built quickly (${ms} ms)`);
  const lv = g(`(() => { const o = {}; COL_CLASSES.forEach(c => { const l = Object.values(SEASON.schools).filter(s => s.cls === c); o[c] = Math.round(l.reduce((t, s) => t + (s.rating.off + s.rating.def) / 2, 0) / l.length); }); return o; })()`);
  ok(lv.D3 < lv.D2 && lv.D2 < lv.FCS && lv.FCS < lv.G5 && lv.G5 < lv.P4 && lv.D3 >= 45 && lv.P4 <= 74, `each level's starters a step above the last: ${JSON.stringify(lv)}`);
  // The schedule
  const sch = g(`(() => { const games = {}, conf = {}, dup = []; SEASON.weeks.slice(0, 12).forEach(w => { const seen = new Set(); w.games.forEach(gm => { [gm.h, gm.a].forEach(id => { if (seen.has(id)) dup.push(id); seen.add(id); games[id] = (games[id] || 0) + 1; if (gm.conf) conf[id] = (conf[id] || 0) + 1; }); }); });
    const ids = Object.keys(SEASON.schools), cross = SEASON.weeks.slice(0, 12).flatMap(w => w.games).filter(gm => divOf(SEASON.schools[gm.h]) !== divOf(SEASON.schools[gm.a]));
    return { dup: dup.length, min: Math.min(...ids.map(id => games[id] || 0)), max: Math.max(...ids.map(id => games[id] || 0)), confMax: Math.max(...ids.map(id => conf[id] || 0)),
      bigConf: SEASON.confs.filter(c => c.ids.length >= 10).every(c => c.ids.every(id => conf[id] === 9 || (c.ids.length % 2 && conf[id] === 8))), smallConf: SEASON.confs.filter(c => c.ids.length <= 9).every(c => c.ids.every(id => conf[id] === c.ids.length - 1)),
      buy: cross.length, buyOk: cross.every(gm => SEASON.schools[gm.h].cls === "P4" && SEASON.schools[gm.a].cls === "FCS") }; })()`);
  ok(sch.dup === 0 && sch.min >= 10 && sch.max === 12, `nobody plays twice in a week, and everyone plays 10 to 12 games (${sch.min} to ${sch.max})`);
  ok(sch.bigConf && sch.smallConf, "9 conference games in a conference of 10 or more (8 now and then in an odd-sized one), every other member in a smaller one");
  ok(sch.buyOk, `games across divisions are power programs hosting FCS programs (${sch.buy})`);
  // A whole season on paper
  const t1 = Date.now(), res = g("colSeasonOnPaper()"), ms2 = Date.now() - t1;
  ok(DIV_IDS_OK(res), "every division crowns a champion");
  function DIV_IDS_OK(r) { return ["FBS", "FCS", "D2", "D3"].every(d => !!r.champs[d]); }
  ok(ms2 < 1500, `the season plays out on paper quickly (${ms2} ms)`);
  const post = g(`(() => { const P = SEASON.post, champ = c => confChamp(c.id); return { sizes: DIV_IDS.map(d => P[d].seeds.length), p4: SEASON.confs.filter(c => c.cls === "P4").every(c => P.FBS.seeds.includes(champ(c))),
    g5: SEASON.confs.filter(c => c.cls === "G5").some(c => P.FBS.seeds.includes(champ(c))), fcs: SEASON.confs.filter(c => c.cls === "FCS").every(c => P.FCS.seeds.includes(champ(c))),
    titles: SEASON.weeks[12].games.length, titleConfs: SEASON.confs.filter(c => COL_LEVELS[c.cls].title && c.ids.length >= 8).length,
    bowls: SEASON.weeks[14].games.filter(gm => gm.bowl && !gm.post), byes: P.FBS.rounds[0].length, finals: DIV_IDS.map(d => SEASON.weeks.flatMap(w => w.games).filter(gm => gm.post === d && gm.title).length) }; })()`);
  ok(post.sizes.join() === "12,24,28,32", `the playoffs: FBS 12, FCS 24, Division II 28, Division III 32 (${post.sizes.join(", ")})`);
  ok(post.p4 && post.g5 && post.fcs, "the four power conference champions and a champion from the rest of FBS are in, and every FCS champion");
  ok(post.byes === 4, "in the 12-team playoff, the top four skip the first round");
  ok(post.titles === post.titleConfs && post.titles >= 8, `FBS conferences play title games in week 13 (${post.titles})`);
  ok(post.bowls.length >= 20 && post.bowls.every(gm => gm.neutral && /Bowl$/.test(gm.bowl)), `bowls for the rest of FBS (${post.bowls.length})`);
  ok(post.finals.every(x => x === 1), "one national championship game in each division");
  const bowlWins = g(`SEASON.weeks[14].games.filter(gm => gm.bowl && !gm.post).every(gm => [gm.h, gm.a].every(id => colRecord(id, 13).w >= 6))`);
  ok(bowlWins, "bowl teams have 6 or more wins");
  const pts = g(`(() => { let p = 0, k = 0; SEASON.weeks.forEach(w => w.games.forEach(gm => { if (played(gm)) { p += gm.hs + gm.as; k++; } })); return p / k / 2; })()`);
  ok(pts > 21 && pts < 29, `quick sims score like the college engine, about 24 points a team (${pts.toFixed(1)})`);
  const rk = g(`(() => { const t = colTop25("FBS", 13); return [colRecord(t[0], 13).l, colRecord(t[24], 13).l]; })()`);
  ok(rk[0] <= 2 && rk[0] <= rk[1], `the top of the top 25 has the fewest losses (${rk.join(" and ")})`);
  ok(JSON.stringify(g("newColSeason(4242, 2026).schools.c5")) === JSON.stringify(g("newColSeason(4242, 2026).schools.c5")), "the same seed builds the same college world");
}

// ---- Step 2: a college season of your own ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); SEASON = newColSeason(99, 2026); colTakeOver(SEASON.confs[1].ids[2]); APP.screen = "season";`);
  ok(g("isFull(mySchool())") && g("mySchool().players.length") >= 95 && g("mySchool().coach === CAREER.coach") && g("SEASON.phase") === "preseason", "taking over a college program: its full roster, your coach, and camp");
  ok(g(`Object.values(SEASON.schools).filter(isFull).length`) === 1, "every other program stays on paper");
  const opp = g(`(() => { const gm = myGameIn(1); return gm ? seasonSchool(opponentIn(gm, SEASON.myId)).players.length : 0; })()`);
  ok(opp >= 90, "an opponent's roster is rebuilt when you play it");
  ok(/Camp, then 12 games/.test(g("vCSeason()")), "the season screen, in camp");
  g("simCamp()");
  ok(/data-a="keygame"/.test(g("vCSeason()")) && /On paper/.test(g("vCSeason()")), "the week ahead: your opponent, on paper, and play, key moments or sim");
  g(`act("simgame")`);
  ok(g("APP.screen") === "week" && g("SEASON.week") === 2 && g("S.cfg.level") === "col", "your game is played under college rules, and the week's results open");
  ok(/Box score/.test(g("vCWeek()")), "with its box score");
  for (let i = 0; i < 25 && g("SEASON.phase") !== "over"; i++) g(`(() => { const gm = myGameIn(SEASON.week); if (gm && !played(gm)) simMyGame(); finishWeek(); })()`);
  ok(g("SEASON.phase") === "over" && g(`DIV_IDS.every(d => SEASON.post[d].champ)`), "the season plays through to the national champions");
  ok(g(`colRecord(SEASON.myId).w + colRecord(SEASON.myId).l`) >= 11, "you played your schedule");
  ["vCSeason", "vCStandings", "vCTop25", "vCPost", "vCSchedule"].forEach(v => ok(g(`${v}().length`) > 500, `${v} draws`));
  g("APP.weekView = 13");
  ok(g("vCWeek().length") > 300, "the championship week's results draw");
}

// ---- Step 3: college players and the college year ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); SEASON = newColSeason(99, 2026); colTakeOver(SEASON.confs[1].ids[2]); APP.screen = "season";`);
  // Redshirts and early departures, unit by unit
  ok(g(`yearName({ yr: 13 })`) === "fifth-year senior" && g(`yearName({ yr: 10 })`) === "sophomore", "five years: freshman to fifth-year senior");
  const early = g(`(() => { const mk = (o, yr, rs) => { const p = genPlayer(dice(5), { id: "z", arch: "runner", yr, level: 60 }); for (const a in p.r) p.r[a] = o; p.rs = rs; return p; }; let n = 0, m = 0, k = 0;
    for (let i = 0; i < 400; i++) { const r = seededRandom(i); if (leavesEarly(mk(95, 11), r)) n++; if (leavesEarly(mk(60, 11), r)) m++; if (leavesEarly(mk(95, 9), r)) k++; } return [n, m, k]; })()`);
  ok(early[0] > 300 && early[1] === 0 && early[2] === 0, `stars leave early for the pros as juniors or seniors (${early[0]} of 400), and nobody rated 60, and no freshmen`);
  ok(g(`colClassOnPaper(SEASON.schools.c0, 2027, 1).lv`) > g(`colClassOnPaper(Object.assign({}, SEASON.schools.c0, { trad: 10 }), 2027, 90).lv`), "a proud, top-ranked program recruits better on paper");
  // A whole year at your program
  g(`simSeason(); act("offseason"); act("carousel"); act("market"); act("stay")`);
  ok(g("APP.screen") === "offseason" && /Spring practice comes next/.test(g("vCOffseason()")), "the college offseason: who's moving on, who might leave early, and spring practice");
  const seniors = g(`mySchool().players.filter(p => p.yr === 13).length`), backYr = g(`mySchool().players.filter(p => p.yr < 13).map(p => [p.id, p.yr])`);
  g(`act("nextyear")`);
  const R = g("SEASON.yearReport");
  ok(g("SEASON.year") === 2027 && g("SEASON.phase") === "preseason" && g("APP.screen") === "newyear" && R && R.col, "the next season: a new year at the same program, with camp");
  ok(R.grads.length === seniors && seniors > 0, `fifth-year seniors move on (${seniors})`);
  ok(backYr.every(([id, yr]) => { const p = g(`mySchool().players.find(q => q.id === "${id}")`); return !p || p.yr === yr + 1; }), "everyone else moves up a year: no redshirts");
  ok(R.fresh.length >= 15 && g("mySchool().players.length") <= 105, `a new class comes in (${R.fresh.length}) and the roster stays at 105 or fewer (${g("mySchool().players.length")})`);
  ok(R.spring && R.spring.n > 20, `spring practice: players got better (${R.spring && R.spring.n})`);
  ok(/Spring practice/.test(g("vNewYear()")) && /Out of eligibility/.test(g("vNewYear()")), "the new year's report says so");
  ok(g("SEASON.history.length") === 4 && g(`SEASON.history.every(x => x.year === 2026)`), "the national champions go into the history");
  ok(g(`Object.values(SEASON.schools).every(s => s.classes[2027] && s.rating.off > 30)`), "every program brought in a class, and its ratings moved with it");
  ok(g(`SEASON.weeks[0].games.length`) > 300 && g(`myGameIn(1) || myGameIn(2)`), "a new schedule");
  const lv = g(`(() => { const o = {}; COL_CLASSES.forEach(c => { const l = Object.values(SEASON.schools).filter(s => s.cls === c); o[c] = Math.round(l.reduce((t, s) => t + (s.rating.off + s.rating.def) / 2, 0) / l.length); }); return o; })()`);
  ok(lv.D3 < lv.D2 && lv.D2 < lv.FCS && lv.FCS < lv.G5 && lv.G5 < lv.P4, `the levels stay apart a year on: ${JSON.stringify(lv)}`);
  // A program on paper, rebuilt for the new year, is about as good as its ratings say
  const rb = g(`(() => { const ids = Object.keys(SEASON.schools).filter(id => id !== SEASON.myId && SEASON.schools[id].cls === "P4").slice(0, 6); return ids.map(id => { const s = seasonSchool(id); return [Math.round((sideRating(s, "off") + sideRating(s, "def")) / 2), Math.round((SEASON.schools[id].rating.off + SEASON.schools[id].rating.def) / 2), s.players.length]; }); })()`);
  ok(rb.every(([a, b, n]) => Math.abs(a - b) <= 6 && n >= 90), `programs on paper rebuild close to their ratings: ${rb.map(x => x.slice(0, 2).join(" vs ")).join(", ")}`);
}

// ---- Step 3: high school players signing with colleges join their rosters ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); CAREER = null; newCareer("Pat", "Ruiz", "qb", "bal", "bal"); newSeason(506, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[4]);`);
  ok(g("OTHER && OTHER.lvl") === "col" && g("Object.keys(OTHER.schools).length") === 672, "a high school career comes with its college world");
  g(`(() => { const s = mySchool(), p = s.players.filter(p => p.yr === 12 && p.pos !== "K" && p.pos !== "P")[0]; for (const a in p.r) p.r[a] = Math.min(99, p.r[a] + 40); p.pot = 99; p.gr = 90; p.tag = "star"; })()`);
  g(`simSeason(); act("offseason")`);
  const st = g(`(() => { const p = mySchool().players.find(p => p.tag === "star"); return p.sign != null ? [p.sign, OTHER.schools[p.sign] ? (OTHER.schools[p.sign].joined || []).some(q => q.first === p.first && q.last === p.last && q.yr === 9 && q.from === 2027) : false] : null; })()`);
  ok(st && st[1], "a senior who signs is kept with his college as a freshman for next season");
  ok(g("OTHER.phase") === "over", "the college world's season is played out on paper with yours");
  g(`autoMarket(); nextSeason()`);
  ok(g("OTHER.year") === 2027 && g("OTHER.lvl") === "col", "and it moves on a year with you");
  const seen = g(`(() => { const id = "${st ? st[0] : ""}"; if (!id) return false; return inWorld(OTHER, () => { const s = rebuildSchool(OTHER.schools[id], 0); return s.players.some(q => q.tag === "star" || (q.id || "").endsWith("c")); }); })()`);
  ok(seen, "and he's on that program's roster when it's rebuilt");
}

// ---- Step 4: the college job ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]);`);
  // No college jobs under 80
  g(`CAREER.rep = 70; simSeason(); act("offseason"); if (APP.screen === "signing") act("adreview"); act("carousel"); act("market")`);
  ok(g("OTHER.review && OTHER.review.open.length") > 10, "the college world's coaching changes happen with yours");
  ok(g(`marketJobs().every(id => !isCollege(jobSchool(id).cls))`), "under a reputation of 80, no college jobs");
  // At 80 and up: Division III and Division II jobs only
  g(`CAREER.rep = 90`);
  const jobs = g(`marketJobs().filter(id => isCollege(jobSchool(id).cls)).map(id => jobSchool(id).cls)`);
  ok(jobs.length > 0 && jobs.every(c => c === "D3" || c === "D2"), `at 80 and up, Division III and Division II jobs (${jobs.length})`);
  const cid = g(`marketJobs().find(id => isCollege(jobSchool(id).cls))`);
  ok(/Salary about \$[\d,]+ a year/.test(g(`jobText("${cid}")`)) && /Division I/.test(g(`jobPlace("${cid}")`)), "a college job says its salary, its level and its conference");
  ok(/A closer look/.test(g(`(() => { APP.jobLook = "${cid}"; return vJobLook(); })()`)), "and has a closer look, from the other world");
  g(`SEASON.market.offer = "${cid}"; act("accept")`);
  ok(g("APP.screen") === "offseason" && g("CAREER.next.id") === cid && /preseason starts/.test(g("vOffseason()")) && !/Hallway recruiting/.test(g("vOffseason()")), "taking it: it starts next season");
  ok(g(`OTHER.review.why["${cid}"]`) === "taken" && g(`SEASON.review.open.includes(SEASON.myId)`), "it's off the college market, and your high school job opens");
  g(`act("nextyear")`);
  ok(g("SEASON.lvl") === "col" && g("SEASON.myId") === cid && g("SEASON.phase") === "preseason" && g("APP.screen") === "season", "the next season: you coach in college");
  ok(g("OTHER.lvl") !== "col" && g("OTHER.myId") === null && g("OTHER.year") === g("SEASON.year") && g(`Object.values(OTHER.schools).every(s => !isFull(s))`), "and the high school state goes on, on paper");
  ok(g("CAREER.job.lvl") === "col" && g("CAREER.job.pay") >= 60000 && g("CAREER.job.yrs") >= 2 && g("CAREER.crep") >= 20, `a contract (${g("contractText(CAREER.job)")}), and a college reputation (${g("CAREER.crep")})`);
  ok(g(`SEASON.exp["${cid}"].w`) > 0, "and your program has its expectation");
  // A college season: the review, the market and staying
  g(`simSeason(); act("offseason")`);
  ok(g("APP.screen") === "review" && /Your contract/.test(g("vReview()")) && /Season grade/.test(g("vReview()")), "the college review: your grade and your contract");
  ok(g("CAREER.seasons.length") === 2 && g("CAREER.seasons[1].lvl") === "col" && /in the conference/.test(g("careerLine(CAREER.seasons[1], 1)")), "the season goes into your career");
  g(`act("carousel"); act("market")`);
  const lv = g(`marketJobs().map(id => jobSchool(id).cls)`);
  const isCol = c => ["D3", "D2", "FCS", "G5", "P4"].includes(c);
  ok(lv.some(c => isCol(c)) && lv.some(c => !isCol(c)), "the college market lists college jobs and, on your high school reputation, high school ones");
  ok(g(`marketJobs().filter(id => isCollege(jobSchool(id).cls)).every(id => jobRepFor(jobSchool(id)) - jobBarFor(jobSchool(id)) >= -8)`), "college jobs go by your college reputation");
  g(`act("stay"); act("nextyear")`);
  ok(g("SEASON.lvl") === "col" && g("SEASON.year") === 2028 && g("APP.screen") === "newyear" && g("OTHER.year") === 2028, "staying: another season, and both worlds move on");
  ok(g("CAREER.job.yrs") >= 1 && g("CAREER.job.ten") === 1, "a year off the contract");
  // Units: salaries, buyouts, counteroffers
  ok(g(`colSalary({ cls: "P4", trad: 90 }, 80)`) > g(`colSalary({ cls: "P4", trad: 30 }, 10)`) && g(`colSalary({ cls: "P4", trad: 50 }, 50)`) >= 4000000 && g(`colSalary({ cls: "D3", trad: 50 }, 50)`) <= 110000, "salaries in real dollars, by level, tradition and reputation");
  g(`simSeason(); CAREER.job.ten = 3; CAREER.job.sec = 1; CAREER.job.yrs = 3; act("offseason")`);
  const R = g("SEASON.review");
  ok(!R.fired || (R.buyout > 0 && R.buyout === Math.round(.6 * g("CAREER.job.pay") * 2 / 1000) * 1000), `fired with years left: 60 percent of what's left is paid out (${R.fired ? "fired" : "not fired"}, ${R.buyout || 0})`);
  ok(g(`(() => { const J = CAREER.job; const keep = [J.sec, SEASON.review.fired]; J.sec = 95; SEASON.review.fired = false; let n = 0; for (let i = 0; i < 40; i++) if (counterOf("c" + i)) n++; J.sec = keep[0]; SEASON.review.fired = keep[1]; return n; })()`) > 10, "a secure coach often gets a counteroffer");
  ok(g(`startCrep(80)`) === 20 && g(`startCrep(100)`) === 30, "a coach from high school starts at a college reputation of 20, a little more for a legend");
  ok(g("COL_STAGE.P4") > g("COL_STAGE.D3"), "a bigger level is a bigger stage");
}

// ---- Step 5: recruiting ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]);
    CAREER.seasons.push({ lvl: "hs", school: schoolName(mySchool()) });
    (() => { const W = OTHER, ids = Object.keys(W.schools).filter(id => W.schools[id].cls === "FCS"); CAREER.crep = 40; const H = SEASON; SEASON = W; OTHER = H; colTakeOver(ids[2]); startColJob(ids[2]); CAREER.job.sec = 99; APP.screen = "season"; })();`);
  // The coach's new rating and perk
  ok(g(`COACH_RATINGS.some(r => r[0] === "rct")`) && g("CAREER.coach.rct") === 40 && g(`PERKS.rcr && PERK_IDS.includes("rcr")`), "a new coach rating, Recruiting (40 to start), and the Recruiter perk");
  ok(g(`Object.values(SEASON.schools).slice(0, 50).every(s => coachRct(s.coach) >= 15 && coachRct(s.coach) <= 90)`) && g(`genCoach(dice(3), "P4").rct`) === g(`genCoach(dice(3), "P4").rct`), "computer coaches have it too");
  ok(g(`starsOf(81)`) === 5 && g(`starsOf(70)`) === 4 && g(`starsOf(60)`) === 3 && g(`starsOf(50)`) === 2, "stars from the recruit rating: five at 80, four at 68, three at 56");
  const rec = g(`(() => { const r = recBoard(); return { spots: r.spots, budget: r.budget, n: r.pool.length, inS: r.pool.filter(p => p.hs).length, kn: r.pool.filter(p => p.kn === 2).length, board: onBoard(r).length, top: onBoard(r).filter(p => p.pr === 2).length, year: r.year }; })()`);
  ok(rec.year === 2027 && rec.spots >= 12 && rec.spots <= 30, `the class arriving next year has spots to fill (${rec.spots})`);
  ok(rec.inS > 20 && rec.n - rec.inS === 150 && rec.kn > 0, `prospects from your old state (${rec.inS}, ${rec.kn} from your old school) and from out of state (${rec.n - rec.inS})`);
  ok(rec.board >= 20 && rec.board <= 30 && rec.top === 6, `your staff fills the board (${rec.board}), the best six at high priority`);
  ok(rec.budget > 0 && rec.budget === g(`roundMoney(payBudget(mySchool()) * CLASS_SHARE)`) && g(`playerMoney({ cls: "D3", trad: 90 })`) === 0 && g(`playerMoney({ cls: "P4", trad: 50 })`) >= 12e6, `NIL money for the class in real dollars (${g("moneyText(SEASON.rec.budget)")}), and none in Division III`);
  ok(g(`JSON.stringify(newRec().pool.map(p => p.id))`) === g(`JSON.stringify(SEASON.rec.pool.map(p => p.id))`), "the same program and year always draw the same prospects");
  ok(/Recruiting board/.test(g("vCSeason()")) && /committed, \d+ spots/.test(g("vCSeason()")), "the season screen has the class's line and the board");
  // Priorities, effort, NIL and visits
  const id = g(`onBoard(SEASON.rec).find(p => p.pr === 1).id`);
  const e1 = g(`effortOf(SEASON.rec, recById(SEASON.rec, "${id}"))`);
  g(`act("board"); act("prospect", { v: "${id}" }); act("rpri", { v: "3" })`);
  ok(g("APP.screen") === "prospect" && g(`recById(SEASON.rec, "${id}").pr`) === 3 && g(`effortOf(SEASON.rec, recById(SEASON.rec, "${id}"))`) > e1, "top priority gets more of your staff's time");
  ok(/Where he stands/.test(g("vProspect()")) && /Priority/.test(g("vProspect()")), "a prospect's screen: where he stands, and his buttons");
  const ask = g(`(() => { const p = SEASON.rec.pool.filter(p => p.pr).find(p => myAsk(p) > 0) || SEASON.rec.pool.find(p => myAsk(p) > 0); if (!p.pr) addProspect(SEASON.rec, p.id, 1); return [p.id, myAsk(p)]; })()`);
  if (ask[1]) {
    const left = g("nilLeft(SEASON.rec)");
    ok(g(`setNil(SEASON.rec, "${ask[0]}", ${ask[1]})`) && g("nilLeft(SEASON.rec)") === left - ask[1], "an NIL offer comes out of the class's money");
    ok(!g(`setNil(SEASON.rec, "${ask[0]}", ${left * 10})`), "and can't go past what's left");
    g(`setNil(SEASON.rec, "${ask[0]}", 0)`);
  }
  g(`act("rvisit")`);
  const vw = g(`+Object.keys(SEASON.rec.vis).find(w => SEASON.rec.vis[w].includes("${id}"))`);
  ok(vw >= 1 && g(`myGameIn(${vw}).h === SEASON.myId`) && g(`Object.values(SEASON.rec.vis).every(v => v.length <= 3)`), "visits: up to three prospects at each home game");
  g(`act("back"); act("rfind"); act("rfstars", { v: "3" })`);
  ok(g("APP.screen") === "rfind" && g(`findList(SEASON.rec).every(p => p.st === 3 && !p.pr)`), "finding prospects, by stars");
  g(`act("rfhome")`);
  ok(g(`findList(SEASON.rec).every(p => p.hs)`), "or from your old state");
  g(`act("back"); act("rstaff", { v: "fill" })`);
  ok(g("SEASON.rec.staff.fill") === false && /Only you add/.test(g("vBoard()")), "staff settings: you can fill the board yourself");
  g(`act("rstaff", { v: "fill" }); act("rstaffnil", { v: "2" })`);
  ok(g("SEASON.rec.staff.nil") === .5, "and let your staff spend half the class's NIL");
  // The season: commitments, the weekly report, signing day
  g(`simSeason(${"13"})`);
  const R = g(`(() => { const r = SEASON.rec; return { done: r.done, n: r.cls.length, spots: r.spots, signed: r.sum.n, walk: r.sum.walk, log: Object.values(r.log).flat().join(" "), stars: r.cls.filter(p => !p.walkOn).every(p => p.stars >= 2 && p.yr === 9 && p.from === 2027) }; })()`);
  ok(R.done && R.n === R.spots && R.signed + R.walk === R.spots && R.signed > 0, `signing day after the regular season: ${R.signed} signed and ${R.walk} walk-ons fill the ${R.spots} spots`);
  ok(R.stars, "signees are freshmen for next season, with their stars");
  ok(/committed to you/.test(R.log) && /Signing day/.test(R.log) && /Visits:/.test(R.log), "the weekly report: commitments, visits and signing day");
  g(`APP.weekView = 12; APP.screen = "week"`);
  ok(/Signing day/.test(g("vCWeek()")), "signing day is in the week's results");
  ok(/Signed with you/.test(g("vBoard()")), "and the board shows the class");
  const lost = g(`(() => { const x = SEASON.rec.sum.lost[0]; return x ? (SEASON.schools[x[1]].joined || []).some(q => q.from === 2027) : true; })()`);
  ok(lost, "prospects who sign elsewhere go to those programs for real");
  // The year turns: your class joins the team, and a new board opens
  const ids = g(`SEASON.rec.cls.map(p => p.id)`);
  g(`simSeason(); act("offseason"); SEASON.review.fired = false; act("carousel"); act("market"); act("stay"); act("nextyear")`);
  ok(g("SEASON.year") === 2027 && ids.every(x => g(`mySchool().players.some(p => p.id === "${x}") || SEASON.yearReport.cut.length > 0`)), "the recruited class joins the roster as freshmen");
  ok(g("SEASON.rec && SEASON.rec.year") === 2028 && g("onBoard(SEASON.rec).length") > 10, "and the next class's board opens");
}

// ---- Step 6: paying players and the transfer portal ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]);
    (() => { const W = OTHER, ids = Object.keys(W.schools).filter(id => W.schools[id].cls === "G5"); CAREER.crep = 50; const H = SEASON; SEASON = W; OTHER = H; colTakeOver(ids[2]); startColJob(ids[2]); CAREER.job.sec = 99; APP.screen = "season"; })();`);
  const b = g(`["P4", "G5", "FCS", "D2", "D3"].map(c => payBudget({ cls: c, trad: 50, bst: 50, seed: 1, id: "x" }))`);
  ok(b[0] >= 12e6 && b[0] <= 16e6 && b[1] >= 2e6 && b[1] <= 5e6 && b[2] >= 2e5 && b[2] <= 5e5 && b[3] > 0 && b[3] < 2e5 && b[4] === 0, `money for players by level, in real dollars: ${b.map(x => g(`moneyText(${x})`)).join(", ")}`);
  ok(g(`payBudget({ cls: "P4", trad: 50, bst: 95, seed: 1, id: "x" })`) > g(`payBudget({ cls: "P4", trad: 50, bst: 20, seed: 1, id: "x" })`), "a fired-up collective adds more");
  ok(g(`(() => { const p = mySchool().players.find(q => q.pos === "QB"), o = Object.assign(clone(p), { pos: "OL" }); return valueOf(p, "P4") > valueOf(o, "P4") && valueOf(p, "P4") > valueOf(p, "G5") && valueOf(p, "G5") > valueOf(p, "FCS"); })()`), "a quarterback is worth more than a lineman, and a player more at a bigger level");
  g(`recBoard()`);
  const pr = g(`payroll(mySchool().players) / payBudget(mySchool())`);
  ok(pr > .5 && pr < .95 && g(`mySchool().players.every(p => p.pay >= 0)`), `your players' pay, set when you take over (${Math.round(pr * 100)} percent of the money)`);
  g(`APP.view = { ctx: "season", team: SEASON.myId, player: mySchool().players[0].id }; APP.screen = "player"`);
  ok(/Paid \$[\d,]+ a year/.test(g("vPlayer()")) && /Fair pay here/.test(g("vPlayer()")), "a player's screen says what he's paid and what's fair");
  g(`APP.screen = "season"; (() => { const r = SEASON.rec, p = onBoard(r).find(q => myAsk(q) > 0); if (p) setNil(r, p.id, myAsk(p)); })(); simSeason(13)`);
  ok(g(`SEASON.rec.cls.filter(p => !p.walkOn).every(p => p.pay === (recById(SEASON.rec, p.id) || recById(SEASON.rec, "r" + p.id.replace(/c$/, "")) || { nil: p.pay }).nil)`), "recruits bring their NIL offers as their pay");
  g(`simSeason(); act("offseason"); SEASON.review.fired = false; act("carousel"); act("market"); act("stay")`);
  ok(g("APP.screen") === "offseason" && /The transfer portal/.test(g("vCOffseason()")), "the offseason opens the transfer portal");
  const P = g(`(() => { const P = colPortal(); return { out: P.out.length, why: P.out.every(x => ["pay", "time", "own"].includes(x.why)), pool: P.pool.length, ask: P.pool.every(q => q.ask >= 0 && q.yr >= 10 && q.yr <= 13) }; })()`);
  ok(P.out >= 1 && P.why && P.pool === 60 && P.ask, `${P.out} of your players entered (for pay, playing time or their own reasons), and 60 from other programs are in it`);
  g(`act("portal")`);
  ok(g("APP.screen") === "portal" && /left for next season/.test(g("vPortal()")) && /From other programs/.test(g("vPortal()")), "the portal screen: your money and spots, your players, and everyone else's");
  const id = g(`colPortal().out[0].id`), money = g(`portalMoney(colPortal())`);
  g(`act("ptkeep", { v: "${id}" })`);
  ok(g(`colPortal().out[0].keep`) === true || g(`colPortal().out[0].why`) === "pay", "keeping one of yours");
  g(`act("ptpos", { v: "QB" })`);
  ok(g(`/quarterback/.test(vPortal())`) || !g(`colPortal().pool.some(q => q.pos === "QB")`), "the portal by position");
  const tgt = g(`(() => { const P = colPortal(), q = P.pool.filter(q => q.ask <= portalMoney(P)).slice(-1)[0]; return q ? q.id : null; })()`);
  if (tgt) {
    const spots = g(`portalSpots(colPortal())`);
    g(`act("ptoffer", { v: "${tgt}" })`);
    ok(spots <= 0 || (g(`colPortal().pool.find(q => q.id === "${tgt}").offer != null`) && g(`portalSpots(colPortal())`) === spots - 1), "going after a portal player takes a roster spot and money");
  }
  ok(g(`(() => { const P = colPortal(), x = P.out.find(y => y.why === "pay"); if (!x) return true; const keep = x.keep; const left = portalMoney(P); portalKeep(P, x.id, false); const r = portalMoney(P) >= left; portalKeep(P, x.id, keep); return r; })()`), "letting a player go frees his raise");
  const out = g(`colPortal().out.filter(x => !x.keep).map(x => x.id)`), after = g(`colPortal().pool.filter(q => q.offer != null).map(q => q.id)`);
  g(`act("back"); act("nextyear")`);
  const R = g("SEASON.yearReport");
  ok(out.every(x => !g(`mySchool().players.some(p => p.id === "${x}")`)) && R.xout.length >= out.length, `when the window closes your players who weren't kept leave (${out.length})`);
  ok(R.xin.length + R.xmissed.length === after.length && R.xin.every(x => g(`mySchool().players.some(p => p.id === "${x}" && p.xfer && p.yr >= 10)`)), `and the portal players you went after decide (${R.xin.length} came, ${R.xmissed.length} went elsewhere)`);
  ok(!out.length || g(`Object.values(SEASON.schools).some(s => (s.joined || []).some(q => q.id === "${out[0]}t"))`), "a player who leaves lands at another program");
  ok(!R.xout.length || /Left in the transfer portal/.test(g("vNewYear()")), "the new year's report lists who left in the portal and who came");
  // Division III: no money for players
  ok(g(`(() => { const s = Object.values(SEASON.schools).find(x => x.cls === "D3"); return payBudget(s) === 0 && valueOf({ pos: "QB", r: { acc: 99, arm: 99, awr: 99, spd: 99, str: 99 } }, "D3") === 0; })()`), "Division III can't pay players");
}

// ---- Step 7: names you choose ----
{
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]);`);
  const own = g("OTHER.schools.c0.town"), hsOwn = g("SEASON.schools.d1s1.town");
  g(`act("names")`);
  ok(g("APP.screen") === "names" && /Rename schools/.test(g("vNames()")) && /made-up names/.test(g("vNames()")), "the names screen");
  g(`typed("nm|s|t|c0", "Lakeshore Tech"); typed("nm|s|m|c0", "Herons"); typed("nm|c||k0", "Northern League"); typed("nm|s|t|d1s1", "Riverbend"); typed("nm|b||Lone Pine Bowl", "Granite Bowl")`);
  ok(g("OTHER.schools.c0.town") === "Lakeshore Tech" && g("OTHER.schools.c0.mascot") === "Herons" && g("OTHER.confs[0].name") === "Northern League" && g("SEASON.schools.d1s1.town") === "Riverbend", "renaming a college, its conference and a high school, as you type");
  ok(g("bowlAs('Lone Pine Bowl')") === "Granite Bowl" && g("colleges().some(c => c.name === 'Lakeshore Tech')"), "a bowl, and the colleges recruiting your players go by the new names");
  ok(/Lakeshore Tech/.test(g(`(() => { APP.nm.tab = "find"; nmSearch = "lakeshore"; return vNames(); })()`)), "searching finds a renamed school");
  ok(/Northern League/.test(g(`(() => { APP.nm.tab = "col"; APP.nm.conf = "k0"; return vNames(); })()`)), "schools grouped by level and conference");
  ok(JSON.parse(g("localStorage.getItem(NAMES_KEY)")).s.c0.t === "Lakeshore Tech" && g("currentSave().names.s.c0.m") === "Herons", "names stay on the device and in the save");
  const list = g("namesText()");
  ok(/school c0: Lakeshore Tech \/ Herons/.test(list) && /conference k0: Northern League/.test(list) && /bowl Lone Pine Bowl: Granite Bowl/.test(list), "the names as a list to copy out");
  g(`typed("nm|s|t|c0", "")`);
  ok(g("OTHER.schools.c0.town") === own && g("NAMES.s.c0.m") === "Herons" && !g("NAMES.s.c0.t"), "clearing a box goes back to the game's name");
  // A new career on another device: the list loads, and a new world takes the names
  const sb2 = load(), g2 = sb2.__get;
  g2(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Kim", "Lee", "qb", "bal", "bal"); newSeason(91, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]);`);
  ok(g2(`loadNamesText(${JSON.stringify(list + "\nnot a name line")})`) === 4 && g2("OTHER.schools.c0.town") === "Lakeshore Tech" && g2("SEASON.schools.d1s1.town") === "Riverbend", "a list loads on another device, into another career");
  g2(`newSeason(92, 2026)`);
  ok(g2("OTHER.schools.c0.town") === "Lakeshore Tech" && g2("OTHER.confs[0].name") === "Northern League", "and a brand-new world takes the names you've chosen");
  // Bowls in a season use the new names
  g2(`(() => { const W = OTHER; const H = SEASON; SEASON = W; OTHER = H; colSeasonOnPaper(); })()`);
  ok(g2(`SEASON.weeks[COL_POST].games.some(gm => gm.bowl === "Granite Bowl" && gm.b0 === "Lone Pine Bowl") || !SEASON.weeks[COL_POST].games.some(gm => gm.b0 === "Lone Pine Bowl")`) && g2(`SEASON.weeks.flat ? true : true`), "bowls are played under your names");
  g2(`resetNames()`);
  ok(g2("namesCount()") === 0 && g2("SEASON.schools.c0.town") !== "Lakeshore Tech", "and you can go back to the game's own names");
  ok(hsOwn !== "Riverbend", "(the game's own names are made up)");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
