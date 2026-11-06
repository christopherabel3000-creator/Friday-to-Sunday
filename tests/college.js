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

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
