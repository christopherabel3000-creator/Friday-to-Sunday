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
  const xp = (() => { const f = game(true); return f.g(`fgProbFor(0, xpDist(R().tryTwo))`); })();
  ok(xp > .88 && xp <= .99, `extra points are good most of the time (${Math.round(xp * 100)} percent)`);
  // A fair-catch kick after a fair catch: on the next snap, from the spot, with no rush
  g("S.teams[0].cpu = false");
  plain(g, { poss: 0, spot: 58, down: 1, toGo: 10, fcKick: true, quarter: 2, clock: 300 });
  g("startPlay()");
  ok(g("S.phase") === "call" && g("fcKickNow()") && g("fgAvailable()") && g("kickDist()") === 52 && g("stPkgIds()").includes("fgu"), "after a fair catch, a fair-catch kick from the spot: 10 yards plus the distance to the goal line");
  plain(g, { poss: 0, spot: 58, down: 1, toGo: 10, fcKick: false, quarter: 2, clock: 300 });
  g("startPlay()");
  ok(!g("fcKickNow()") && g("kickDist()") === 59 && !g("fgAvailable()"), "without one, it's an ordinary field goal distance, and no kick on first down");
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

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
