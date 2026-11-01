// High school rules checks: clock, kicks, tries, penalties, the running clock and overtime, plus
// rosters, depth charts, fatigue and rotation. Each check sets up a game state and runs the real engine.
// Usage: node tests/rules.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } };
// A fresh game between two generated schools. You coach team 0 unless watch is set.
function game(watch) {
  const sb = load(), g = sb.__get, F = sb.__fts;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); APP.ex.you = ${watch ? '"watch"' : 0}; startExhibition();`);
  return { sb, g, F, S: () => g("S") };
}
// Puts a game into a plain mid-game state: Q1, team 0 with the ball, no pending decisions
function plain(g, extra) {
  g(`Object.assign(S, { quarter: 1, clock: 600, poss: 0, spot: 40, down: 1, toGo: 10, phase: "", toss: null, periodOver: false, gameOver: false,
    needPAT: false, tryChoice: null, kickChoice: null, retryTwo: null, twoPt: null, clockRunning: false, oobRestart: false, ot: null, otEnd: false, runClock: false });
    S.teams[0].score = 0; S.teams[1].score = 0;`);
  if (extra) g(`Object.assign(S, ${JSON.stringify(extra)})`);
}

// ---- Rosters and depth charts ----
{
  const { g } = game(true);
  let small = 0, total = 0, startersIn = 0, startersAll = 0, twoWay = 0, schools = 0;
  for (let i = 0; i < 40; i++) {
    g(`newExhibition()`);
    for (const k of [0, 1]) {
      schools++;
      const s = g(`APP.ex.schools[${k}]`);
      total += s.players.length;
      ok(s.players.length >= 25 && s.players.length <= 31, `roster size ${s.players.length}`);
      ok(s.players.every(p => Object.values(p.r).every(v => v >= 1 && v <= 99)), "ratings between 1 and 99");
      ok(new Set(s.players.map(p => p.last)).size === s.players.length, "last names are unique on a team");
      for (const pk of ["p10", "p11", "p12", "p21", "p13", "jumbo", "base", "nickel", "dime", "goal"]) {
        const ids = g(`lineupPlayers(lineupFor(APP.ex.schools[${k}], "${pk}")).map(p => p.id)`);
        ok(ids.length === 11 && new Set(ids).size === 11, `${pk} puts 11 different players on the field (${ids.length})`);
      }
      const ovrs = g(`(() => { const t = APP.ex.schools[${k}], out = []; for (const pk of ["p11", "base"]) { const lu = lineupFor(t, pk); for (const pos in lu) lu[pos].forEach(p => out.push(ovr(p, pos))); } return out; })()`);
      ovrs.forEach(v => { startersAll++; if (v >= 20 && v <= 59) startersIn++; });
      twoWay += g(`twoWayStarters(APP.ex.schools[${k}]).length`);
      const k0 = g(`APP.ex.schools[${k}].depth.K[0]`), kick = g(`playerById(APP.ex.schools[${k}], "${k0}")`);
      if (kick.r.leg <= 45) small++;
    }
  }
  ok(startersIn / startersAll >= .85, `small-school starters mostly rate 20 to 59 (${(100 * startersIn / startersAll).toFixed(0)}%)`);
  ok(twoWay / schools >= 4, `many starters play both ways (${(twoWay / schools).toFixed(1)} a team)`);
  ok(small / schools >= .5, `most small-school kickers have a modest leg (${small} of ${schools})`);
  const range = g(`Math.round(fgRange({ r: { leg: 35 } }))`);
  ok(range >= 38 && range <= 42, `a 35 leg tops out around 40 yards (${range})`);
  // The same seed always builds the same world
  const a = g(`(() => { const g1 = dice(12345); return genSchool(g1, { id: "x", cls: "1A", mascot: "Owls", towns: new Set() }); })()`);
  const b = g(`(() => { const g1 = dice(12345); return genSchool(g1, { id: "x", cls: "1A", mascot: "Owls", towns: new Set() }); })()`);
  ok(JSON.stringify(a) === JSON.stringify(b), "a seed rebuilds the same school");
}

// ---- Clock ----
{
  const { g } = game(false);
  plain(g);
  ok(g("S.cfg.qLen") === 720 && g("R().qLen") === 720, "12-minute quarters");
  ok(g("S.tos[0]") === 3, "three timeouts a half");
  // Out of bounds early in a half: the clock starts again on the ready
  g(`finishClock({ oob: true }, false)`);
  ok(g("S.clockRunning") === true && g("S.oobRestart") === true && g("S.readyWhy") === "oob", "out of bounds in the 1st quarter restarts the clock on the ready");
  // In the last two minutes of a half, out of bounds stops it until the snap
  const q0 = g("S.quarter"), c0 = g("S.clock");
  for (const [q, c] of [[2, 100], [4, 30]]) {
    g(`S.quarter = ${q}; S.clock = ${c}`); g(`finishClock({ oob: true }, false)`);
    ok(g("S.clockRunning") === false, `out of bounds in Q${q} at ${c}s stops the clock until the snap`);
  }
  g(`S.quarter = 4; S.clock = 200`); g(`finishClock({ oob: true }, false)`);
  ok(g("S.clockRunning") === true, "out of bounds in Q4 with 3:20 left restarts on the ready");
  g(`S.quarter = ${q0}; S.clock = ${c0}`);
  // A first down stops the clock until the ball is ready
  g(`finishClock({ fd: true }, false)`);
  ok(g("S.clockRunning") === true && g("S.oobRestart") === true && g("S.readyWhy") === "fd", "a first down restarts the clock on the ready");
  // A gain short of the line to gain: the clock keeps running
  g(`finishClock({}, false)`);
  ok(g("S.clockRunning") === true && g("S.oobRestart") === false, "an in-bounds gain keeps the clock running");
  // An accepted penalty: on the ready, or on the snap in the last two minutes when the fouled team wants it
  g(`finishClock({ penClock: true, penBy: 1 }, false)`);
  ok(g("S.oobRestart") === true && g("S.readyWhy") === "pen", "an accepted penalty restarts the clock on the ready");
  g(`Object.assign(S, { quarter: 4, clock: 90 }); S.teams[0].score = 0; S.teams[1].score = 7; finishClock({ penClock: true, penBy: 1 }, false)`);
  ok(g("S.clockRunning") === false, "late, a trailing team that was fouled starts the clock on the snap");
  g(`S.teams[0].score = 14; finishClock({ penClock: true, penBy: 1 }, false)`);
  ok(g("S.clockRunning") === true && g("S.oobRestart") === true, "late, a leading team that was fouled lets it start on the ready");
  // No two-minute warning
  g(`Object.assign(S, { quarter: 2, clock: 130, tmwHit: false }); tick(15)`);
  ok(!g("S.tmwHit") && g("S.clock") === 115, "no two-minute warning when the clock passes 2:00 during a play");
  g(`Object.assign(S, { quarter: 2, clock: 130 }); runoff(20)`);
  ok(g("S.clock") === 110, "no two-minute warning between plays");
}

// ---- Running clock ----
{
  const { g } = game(true);
  plain(g, { quarter: 3, clock: 500 });
  g(`S.teams[0].score = 42; S.teams[1].score = 7; finishClock({}, true)`);
  ok(g("S.runClock") === true, "a 35-point lead in the second half starts the running clock");
  ok(g("S.clockRunning") === true, "the running clock keeps going through an incompletion");
  g(`S.teams[1].score = 21; finishClock({ oob: true }, false)`);
  ok(g("S.runClock") === true && g("S.clockRunning") === true, "it stays on even when the lead shrinks");
  g(`S.needPAT = true; finishClock({}, true)`);
  ok(g("S.clockRunning") === false, "it stops for a score");
  plain(g, { quarter: 2, clock: 500 });
  g(`S.teams[0].score = 42; S.teams[1].score = 0; finishClock({}, true)`);
  ok(g("S.runClock") === false, "not in the first half");
  plain(g, { quarter: 3, clock: 500 });
  g(`S.cfg.title = true; S.teams[0].score = 42; S.teams[1].score = 0; finishClock({}, true); S.cfg.title = false`);
  ok(g("S.runClock") === false, "not in a state championship game");
}

// ---- Kickoffs, punts and field goals ----
{
  const { g } = game(true);
  plain(g);
  // A kicker with a big leg, so some kicks reach the end zone (a weak one almost never gets there)
  g(`[0, 1].forEach(t => { starterAt(S.teams[t], "K").r.leg = 52; S.teams[t].dver++; })`);
  let tb = 0, tbBad = 0, oob = 0, oobBad = 0, ret = 0, retClock = 0;
  for (let i = 0; i < 3000; i++) {
    plain(g, { clock: 600 });
    const text = g(`kickoff(1, false)`);
    if (/Touchback/.test(text)) { tb++; if (g("S.spot") !== 20 || g("S.clock") !== 600) tbBad++; }
    else if (/out of bounds/.test(text)) { oob++; if (g("S.spot") !== 35) oobBad++; }
    else { ret++; if (g("S.clock") < 600) retClock++; }
  }
  ok(tb > 0 && tbBad === 0, `a kick into the end zone is a touchback at the 20 with no time off (${tb})`);
  ok(oob > 0 && oobBad === 0, `a kick out of bounds gives the ball at the 35 (${oob})`);
  ok(ret > tb * 5, `most small-school kickoffs are returned (${ret} returned, ${tb} touchbacks)`);
  ok(retClock === ret, "the clock runs during a kickoff return");
  // A big leg reaches the end zone a lot more
  g(`(() => { const K = kickerOf(0); K.r.leg = 95; })()`);
  let bigTb = 0;
  for (let i = 0; i < 400; i++) { plain(g); if (/Touchback/.test(g(`kickoff(1, false)`))) bigTb++; }
  ok(bigTb > 120, `a 95 leg kicks a lot of touchbacks (${bigTb} of 400)`);
  // Punts into the end zone: touchback at the 20
  let ptb = 0, ptbBad = 0;
  g(`(() => { const P = punterOf(0); P.r.leg = 95; P.r.kac = 90; })()`);
  for (let i = 0; i < 400; i++) {
    plain(g, { spot: 62, down: 4, toGo: 8 });
    g(`S.defCall = "ba"; S.offCall = "punt";`);
    const r = g(`doPunt()`);
    if (/into the end zone/.test(r.text)) { ptb++; if (g("S.spot") !== 20 || g("S.poss") !== 1) ptbBad++; }
  }
  ok(ptb > 0 && ptbBad === 0, `a punt into the end zone is a touchback at the 20 (${ptb})`);
  // Missed field goals are treated like punts
  g(`(() => { const K = kickerOf(0); K.r.leg = 40; K.r.kac = 30; })()`);
  let wide = 0, wideBad = 0, short = 0, shortBad = 0;
  for (let i = 0; i < 1500; i++) {
    plain(g, { spot: 72, down: 4, toGo: 6 });
    g(`S.defCall = "ba"; S.offCall = "fg";`);
    const r = g(`doFG()`);
    if (/wide/.test(r.text)) { wide++; if (g("S.spot") !== 20 || g("S.poss") !== 1) wideBad++; }
    if (/short/.test(r.text)) { short++; const sp = g("S.spot"); if (sp < 2 || sp > 9 || g("S.poss") !== 1) shortBad++; }
  }
  ok(wide > 0 && wideBad === 0, `a missed field goal into the end zone is a touchback at the 20 (${wide})`);
  ok(short > 0 && shortBad === 0, `a field goal that comes down short is downed near the goal line (${short})`);
  ok(g("kickDist()") === 100 - g("S.spot") + 17, "field goal distance is yards to the goal line plus 17");
  // Free kick after a safety comes from the 20
  plain(g, { spot: 1, down: 2, toGo: 10 });
  let safeties = 0, safetyBad = 0;
  for (let i = 0; i < 3000 && safeties < 5; i++) {
    plain(g, { spot: 1, down: 2, toGo: 10 });
    g(`S.offPkg = "p11"; S.defPkg = "base"; S.offCall = "dp"; S.defCall = "ab"; S.snap = { total: 0, poss: 0, spot: 1, down: 2, toGo: 10, q: 1, clock: 600 };`);
    const r = g(`doScrimmage()`);
    // (2 points, or 8 when the free kick comes back for a touchdown)
    if (r.head === "Safety") { safeties++; const pts = g("S.teams[1].score"); if (!/free kick from their own 20/.test(r.sub || "") || !(pts === 2 || (pts === 8 && /all the way/.test(r.sub)))) safetyBad++; }
  }
  ok(safeties > 0 && safetyBad === 0, `a safety is followed by a free kick from the 20 (${safeties})`);
}

// ---- Tries ----
{
  const { g } = game(true);
  plain(g);
  ok(g("R().tryTwo") === 97 && g("R().tryXp") === 97, "tries are snapped from the 3");
  ok(g("xpDist(R().tryTwo)") === 20, "an extra point is a 20-yard kick");
  ok(g("xpDist(92)") === 25, "a try backed up 5 yards is a 25-yard kick");
  // The defense can't score on a try
  let ints = 0, intPts = 0;
  for (let i = 0; i < 2000 && ints < 10; i++) {
    // (at the end of the half, so no kickoff follows the try)
    plain(g, { quarter: 2, clock: 0, periodOver: true }); g(`S.patTeam = 0; S.teams[0].score = 6; startTwo();`);
    // team 0 is computer-controlled in a watch game: the try runs to its result
    const s = g("S");
    if (s.last && /intercepted/.test(s.last.text)) { ints++; if (s.teams[1].score !== 0) intPts++; }
  }
  ok(ints > 0 && intPts === 0, `an interception on a try ends it, with no points for the defense (${ints})`);
  // A touchdown on the last play that decides the game: no try
  plain(g, { quarter: 4, clock: 0, periodOver: true });
  g(`S.teams[0].score = 20; S.teams[1].score = 14; afterTD(0)`);
  ok(g("S.needPAT") === false, "no try after a deciding touchdown on the last play");
  g(`S.teams[0].score = 20; S.teams[1].score = 20; afterTD(0)`);
  ok(g("S.needPAT") === true, "a try when it can still decide the game");
  plain(g, { quarter: 2, clock: 0, periodOver: true });
  g(`S.teams[0].score = 20; S.teams[1].score = 0; afterTD(0)`);
  ok(g("S.needPAT") === true, "a try at the end of the first half");
}

// ---- Penalties ----
{
  const { g } = game(true);
  plain(g);
  const base = { poss: 0, spot: 40, down: 3, toGo: 20, needPAT: false, patTeam: 0, gameOver: false, ot: null, scores: [0, 0], st: [{}, {}], ps: {} };
  g(`S.offCall = "dp"`);
  const dpi = g(`enforce("dpi", ${JSON.stringify(base)})`);
  ok(dpi.s.spot === 55 && dpi.s.down === 3 && dpi.s.toGo === 5, `pass interference: 15 yards, no automatic first down (${JSON.stringify(dpi.s)})`);
  const dh = g(`enforce("dh", ${JSON.stringify(base)})`);
  ok(dh.s.spot === 50 && dh.s.down === 3, "defensive holding: 10 yards, no automatic first down");
  const rtp = g(`enforce("rtp", ${JSON.stringify(base)})`);
  ok(rtp.s.spot === 55 && rtp.s.down === 1, "roughing the passer: 15 yards and an automatic first down");
  const fm = g(`enforce("fm", ${JSON.stringify(base)})`);
  ok(fm.s.spot === 55 && fm.s.down === 3, "face mask: 15 yards, no automatic first down");
  const opi = g(`enforce("opi", ${JSON.stringify(base)})`);
  ok(opi.s.spot === 25 && opi.s.down === 3 && opi.s.toGo === 35, "offensive pass interference: 15 yards from the previous spot, no loss of down");
  ok(g(`penOf("enc").pre === true`) && g(`penOf("os")`) == null, "encroachment is a dead-ball foul before the snap; there's no free-play offside");
  // Near the goal line: half the distance
  const goal = g(`enforce("dpi", ${JSON.stringify(Object.assign({}, base, { spot: 92, toGo: 8, down: 2 }))})`);
  ok(goal.s.spot === 96, "half the distance to the goal");
  // Defensive fouls during a run past the line are enforced from the end of the run
  let found = 0, bad = 0;
  for (let i = 0; i < 4000 && found < 6; i++) {
    plain(g, { spot: 30, down: 1, toGo: 10 });
    g(`S.offPkg = "p11"; S.defPkg = "base"; S.offCall = "ir"; S.defCall = "ba"; S.snap = { total: 0, poss: 0, spot: 30, down: 1, toGo: 10, q: 1, clock: 600 }; S.teams[0].cpu = false;`);
    const pre = g(`snapState()`);
    const r = g(`(() => { const r = doScrimmage(); window_r = r; return r; })()`);
    if (!(r.y > 0 && r.y < 20 && !r.fumble && r.head !== "Touchdown" && g("S.poss") === 0)) continue;
    g(`setupPenalty("dh", window_r, ${JSON.stringify(pre)})`);
    const P = g("S.pen");
    found++;
    if (!P.endOfPlay || P.acc.spot !== Math.min(30 + r.y + 10, 99)) bad++;
  }
  ok(found > 0 && bad === 0, `defensive holding on a run is enforced from the end of the run (${found})`);
  // A period can't end on an accepted foul by either team: one untimed down
  let untimed = 0;
  for (let i = 0; i < 4000 && untimed < 3; i++) {
    plain(g, { quarter: 2, clock: 4, spot: 50 });
    g(`S.offPkg = "p11"; S.defPkg = "base"; S.offCall = "sp"; S.defCall = "ba"; S.snap = { total: 0, poss: 0, spot: 50, down: 1, toGo: 10, q: 2, clock: 4 };`);
    const pre = g(`snapState()`);
    g(`window_r = doScrimmage()`);
    if (!g("S.periodOver") || g("S.poss") !== 0) continue;
    g(`S.teams[1].cpu = false; setupPenalty("oh", window_r, ${JSON.stringify(pre)}); choosePenalty(true); S.teams[1].cpu = true`);
    untimed++;
    ok(g("S.periodOver") === false && /untimed down/.test(g("S.last.sub")), "an accepted offensive foul at 0:00 gives one untimed down");
  }
  ok(untimed > 0, "found plays that ended the half");
}

// ---- Overtime ----
{
  let games = 0, otGames = 0, bad = [], ends = { second: 0, after: 0 }, choiceSwitch = 0, choiceChecks = 0;
  for (let i = 0; i < 400 && otGames < 150; i++) {
    const { g, F } = game(true);
    plain(g, { quarter: 4, clock: 0, periodOver: true });
    g(`S.teams[0].score = 14; S.teams[1].score = 14; endPeriod()`);
    games++;
    const t = g("S.toss");
    if (!t || !t.ot || !t.hs) { bad.push("tied after regulation: an overtime coin toss"); continue; }
    g(`tossCall("heads"); tossChoose(rand() < .5 ? "defense" : "offense")`);
    if (g("S.toss") !== null || g("S.ot.kind") !== "hs") bad.push("the toss settles who goes first");
    if (g("S.spot") !== 90 || g("S.toGo") !== 10 || g("S.down") !== 1) bad.push("a series starts first and goal at the 10");
    if (g("S.tos[0]") !== 1 || g("S.tos[1]") !== 1) bad.push("one timeout per team in overtime");
    if (!g("fgAvailable()")) bad.push("a field goal can be tried on any down in overtime");
    if (g("puntAvailable()")) bad.push("no punting in overtime");
    otGames++;
    g(`startPlay()`);
    const first = g("S.ot.first"), tossWinner = g("S.ot.toss");
    let n = 0, lastQ = 5, seenScoreByDefense = false;
    while (g("S.phase") !== "final" && n < 3000) {
      const before = g("[S.teams[0].score, S.teams[1].score, S.poss, S.quarter]");
      F.autoStep(); n++;
      const after = g("[S.teams[0].score, S.teams[1].score, S.poss, S.quarter]");
      // The ball always belongs to the team whose series it is (a turnover just ends the series)
      const o = g("S.ot");
      if (g("S.phase") !== "final" && o && after[2] !== (o.ser === 1 ? o.first : 1 - o.first)) bad.push("the ball stays with the team whose series it is");
      // From the second period on, the first choice alternates (computer coaches choose defense first)
      if (o && o.n >= 2 && o.ser === 1) { choiceChecks++; if (o.first === (o.n % 2 ? 1 - tossWinner : tossWinner)) choiceSwitch++; }
      if (after[3] >= 5 && g("S.clock") !== 0) bad.push("no clock in overtime");
      // The defense never scores in overtime
      const def = 1 - before[2];
      if (after[def] > before[def] && g("S.ot && S.ot.kind") === "hs" && before[3] >= 5 && g("S.last && S.last.team") === before[2] && !/two-point|extra point/i.test(g("S.last.text") || "")) seenScoreByDefense = true;
    }
    if (seenScoreByDefense) bad.push("the defense scored in overtime");
    const s = g("S");
    if (/returned all the way|Returned for a|Safety/.test(s.log.filter(e => e.q >= 5).map(e => e.text).join(" "))) bad.push("a defensive score in overtime");
    if (s.teams[0].score === s.teams[1].score) bad.push("overtime ended tied");
    if (/kick reaches the end zone|returns the kick|kickoff/i.test(s.log.filter(e => e.q >= 5).map(e => e.text).join(" "))) bad.push("a kickoff in overtime");
    // The game ends after both series, or when the second team goes ahead
    const lastEntry = s.log[0];
    if (s.ot.ser === 2) ends.second++; else bad.push("the game ended during the first series");
    void first; void lastQ; void lastEntry;
  }
  ok(otGames >= 30, `played overtime games (${otGames})`);
  ok(bad.length === 0, "overtime rules: " + [...new Set(bad)].join("; "));
  ok(choiceChecks > 0 && choiceSwitch === choiceChecks, `the first choice alternates each period (${choiceSwitch} of ${choiceChecks})`);
}

// ---- Fatigue ----
{
  const { g } = game(false);
  plain(g);
  ok(g("fatigueMul(100)") === 1 && Math.abs(g("fatigueMul(50)") - .876) < .01, "fresh players play at their ratings; at half energy, about 88 percent");
  const qb = g(`starterAt(S.teams[0], "QB").id`);
  g(`playerById(S.teams[0], "${qb}").en = 50; S.fe++`);
  const v = g(`onField(0, "p11").QB[0]`), base = g(`playerById(S.teams[0], "${qb}")`);
  ok(v.id === base.id && Math.abs(v.r.acc - base.r.acc * g("fatigueMul(50)")) < .001, "a tired player's ratings drop on the field, and his stats still count for him");
  ok(g(`onField(0, "fgu").K[0].r.leg`) === g(`starterAt(S.teams[0], "K").r.leg`), "kicking doesn't tire");
  // One snap: the players on the field tire, the bench recovers
  g(`S.teams.forEach(t => t.players.forEach(p => { p.en = 80; p.rest = false; })); S.teams.forEach(t => t.dver++);`);
  const onIds = g(`lineupPlayers(lineupFor(S.teams[0], "p11")).map(p => p.id)`);
  const benchId = g(`S.teams[0].players.find(p => !${JSON.stringify(onIds)}.includes(p.id) && !lineupPlayers(lineupFor(S.teams[1], "base")).includes(p)).id`);
  g(`tireSnap(0, "p11", "base")`);
  const after = g(`Object.fromEntries(S.teams[0].players.map(p => [p.id, p.en]))`);
  ok(onIds.every(id => after[id] < 80), "players on the field lose energy each snap");
  ok(after[benchId] > 80, "players on the bench get it back");
  g(`restAll("half")`);
  ok(g(`S.teams[0].players.every(p => p.en >= 100 || p.en >= 80 + 39)`), "halftime brings everyone most of the way back");
  // Over whole games, two-way starters wear down more than one-way starters
  let two = [], one = [];
  for (let i = 0; i < 12; i++) {
    const G = game(true);
    const tw = G.g(`twoWayStarters(S.teams[0]).map(p => p.id)`), on = G.g(`lineupPlayers(lineupFor(S.teams[0], "p11")).map(p => p.id)`).filter(id => !tw.includes(id));
    let n = 0, low = {};
    while (G.g("S.phase") !== "final" && n < 6000) { G.F.autoStep(); n++; if (G.g("S.quarter") === 4) G.g("S.teams[0].players").forEach(p => { low[p.id] = Math.min(low[p.id] ?? 100, p.en); }); }
    tw.forEach(id => two.push(low[id] ?? 100)); on.forEach(id => one.push(low[id] ?? 100));
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  ok(mean(two) < mean(one) - 15, `two-way starters tire more (lowest in the 4th quarter: ${mean(two).toFixed(0)} against ${mean(one).toFixed(0)})`);
}

// ---- Rotation ----
{
  const { g } = game(true);
  plain(g);
  g(`S.teams.forEach(t => t.players.forEach(p => { p.en = 100; p.rest = false; }))`);
  const rb1 = g(`S.teams[0].depth.RB[0]`), rb2 = g(`S.teams[0].depth.RB[1]`);
  g(`S.teams[0].rot = "normal"; playerById(S.teams[0], "${rb1}").en = 50; playerById(S.teams[0], "${rb2}").en = 95;`);
  // The second back must not start anywhere else on offense for this check
  g(`["QB", "WR", "TE", "OL"].forEach(pos => { S.teams[0].depth[pos] = S.teams[0].depth[pos].filter(id => id !== "${rb2}"); })`);
  const notes = g(`rotate(0)`);
  ok(g(`playerById(S.teams[0], "${rb1}").rest`) === true, "a tired starter sits when a fresh backup is ready");
  ok(notes.length && /breather/.test(g(`rotationNote(${JSON.stringify(notes)})`)), "the coach hears about it");
  g(`S.fe++`);
  ok(g(`onField(0, "p11").RB[0].id`) === rb2, "the backup is on the field");
  g(`playerById(S.teams[0], "${rb1}").en = 80; rotate(0); S.fe++`);
  ok(g(`playerById(S.teams[0], "${rb1}").rest`) === false && g(`onField(0, "p11").RB[0].id`) === rb1, "he comes back once he's recovered");
  // Keep starters in: only exhaustion takes him out
  g(`S.teams[0].rot = "keep"; playerById(S.teams[0], "${rb1}").en = 40; rotate(0)`);
  ok(g(`playerById(S.teams[0], "${rb1}").rest`) === false, "keep starters in: a tired starter stays in");
  g(`playerById(S.teams[0], "${rb1}").en = 25; rotate(0)`);
  ok(g(`playerById(S.teams[0], "${rb1}").rest`) === true, "keep starters in: an exhausted starter sits");
  // No fresh backup on the list: he plays on
  // (and not listed anywhere else, where a backup could spell him)
  g(`playerById(S.teams[0], "${rb1}").rest = false; S.teams[0].rot = "often"; Object.keys(S.teams[0].depth).forEach(pos => { S.teams[0].depth[pos] = S.teams[0].depth[pos].filter(id => id !== "${rb1}"); }); S.teams[0].depth.RB = ["${rb1}"]; playerById(S.teams[0], "${rb1}").en = 40; rotate(0)`);
  ok(g(`playerById(S.teams[0], "${rb1}").rest`) === false, "nobody listed behind him: a tired starter plays on");
  // The rotation note reaches the coach's call screen
  const G = game(false);
  plain(G.g);
  const r1 = G.g(`S.teams[0].depth.RB[0]`), r2 = G.g(`S.teams[0].depth.RB[1]`);
  G.g(`S.teams[0].players.forEach(p => p.en = 100); ["QB", "WR", "TE", "OL"].forEach(pos => { S.teams[0].depth[pos] = S.teams[0].depth[pos].filter(id => id !== "${r2}"); }); playerById(S.teams[0], "${r1}").en = 40; startPlay();`);
  ok(/breather/.test(G.g("S.subNote")), "the call screen tells you who came out");
}

// ---- Editing the depth chart ----
{
  const { g, F } = game(false);
  g(`S = null; APP.screen = "home"; APP.ex.you = 0; APP.ex.depthMode = "always"; APP.view = { ctx: "ex", team: 0, back: "exhibition" };`);
  const school = () => g("APP.ex.schools[0]");
  const qb = school().depth.QB.slice();
  let said = g(`depthMove(0, "QB", "${qb[1]}", "start")`);
  ok(school().depth.QB[0] === qb[1] && school().depth.QB[1] === qb[0], "start: the backup quarterback starts, the old starter backs him up");
  ok(/is the starter at quarterback\. .+ moves to backup\./.test(said), "the change is announced: " + said);
  g(`depthMove(0, "QB", "${qb[1]}", "down")`);
  ok(school().depth.QB[0] === qb[0], "move down");
  g(`depthMove(0, "QB", "${qb[1]}", "up")`);
  ok(school().depth.QB[0] === qb[1], "move up");
  g(`depthMove(0, "QB", "${qb[0]}", "off")`);
  ok(!school().depth.QB.includes(qb[0]) && school().depth.QB.length === 1, "take a player off");
  const wr = school().depth.WR.slice(), outsider = g(`APP.ex.schools[0].players.find(p => !APP.ex.schools[0].depth.WR.includes(p.id)).id`);
  g(`depthMove(0, "WR", "${outsider}", "start")`);
  ok(school().depth.WR.indexOf(outsider) === 2 && school().depth.WR[3] === wr[2], "start a new receiver: he's the third starter, the old third starter is the first backup");
  for (let i = 0; i < 6; i++) { const id = g(`APP.ex.schools[0].players.filter(p => !APP.ex.schools[0].depth.WR.includes(p.id))[0].id`); g(`depthMove(0, "WR", "${id}", "add")`); }
  ok(school().depth.WR.length === g("depthMax('WR')"), "a list can't grow past its limit");
  g(`resetDepth(0)`);
  ok(JSON.stringify(school().depth) === JSON.stringify(g("autoDepth(APP.ex.schools[0])")) && !school().manual, "reset to automatic");
  // Next game only: used by the next kickoff, then gone
  const before = JSON.stringify(school().depth), qb2 = school().depth.QB[1];
  g(`APP.ex.depthMode = "next"; depthMove(0, "QB", "${qb2}", "start")`);
  ok(JSON.stringify(school().depth) === before, "a next-game change leaves the every-game depth chart alone");
  ok(g("APP.ex.nextDepth.depth.QB[0]") === qb2, "it's saved for the next game");
  g(`startExhibition()`);
  ok(g("S.teams[0].depth.QB[0]") === qb2, "the next kickoff uses it");
  ok(g("APP.ex.nextDepth") === null && JSON.stringify(school().depth) === before, "then it's used up, and the every-game chart is unchanged");
  // During a game: changes last for this game only, and take effect on the next snap
  g(`APP.view = { ctx: "game", team: 0, back: "game" }; APP.screen = "roster";`);
  const rb = g("S.teams[0].depth.RB.slice()"), dv = g("S.teams[0].dver");
  g(`depthMove(0, "RB", "${rb[1]}", "start")`);
  ok(g("S.teams[0].depth.RB[0]") === rb[1] && g("S.teams[0].dver") > dv, "a substitution changes this game's depth chart");
  ok(school().depth.RB[0] === rb[0], "and not the school's");
  g(`S.teams[0].players.forEach(p => { p.en = 100; p.rest = false; }); S.fe++`);
  ok(g(`onField(0, "p11").RB[0].id`) === rb[1], "the substitute is on the field for the next snap");
  F.act("rot", { v: "often" });
  ok(g("S.teams[0].rot") === "often", "the rotation setting can change during a game");
  // The best quarterback starts at quarterback
  let bad = 0;
  for (let i = 0; i < 40; i++) { g("newExhibition()"); for (const k of [0, 1]) { const s = g(`APP.ex.schools[${k}]`); const q = g(`ovr(playerById(APP.ex.schools[${k}], APP.ex.schools[${k}].depth.QB[0]), "QB")`); const best = g(`Math.max(...APP.ex.schools[${k}].players.map(p => ovr(p, "QB")))`); if (q < best - 1) bad++; void s; } }
  ok(bad === 0, `the automatic depth chart starts the best quarterback (${bad} misses)`);
}

// ---- Saves ----
{
  // A game saved by version 1 (before fatigue) loads and plays to the end
  const { g, F } = game(false);
  g(`S.teams.forEach(t => { delete t.rot; t.players.forEach(p => { delete p.en; delete p.rest; }); }); localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, build: 1, app: APP, game: S }));`);
  g(`S = null; APP = null; start(); S.teams[0].cpu = true;`);
  let n = 0;
  while (g("S.phase") !== "final" && n < 6000) { F.autoStep(); n++; }
  ok(g("S.phase") === "final" && g(`S.teams.every(t => t.rot && t.players.every(p => Number.isFinite(p.en)))`), "an older save is upgraded and plays on");
}

// ---- Punt choices: a regular punt, Pin it deep and Boom it ----
{
  const { g } = game(true);
  plain(g);
  const setP = (leg, kac) => g(`(() => { const P = punterOf(0); P.r.leg = ${leg}; P.r.kac = ${kac}; S.teams[0].dver++; })()`);
  // Punt n times from a spot against a call; returns touchbacks, inside the 10, net yards, return TDs, return yards
  const punts = (kind, spot, dc, n) => {
    const out = { tb: 0, in10: 0, net: 0, td: 0, ry: 0, kept: 0, pinned: 0 };
    for (let i = 0; i < n; i++) {
      plain(g, { spot, down: 4, toGo: 8 });
      g(`S.defCall = "${dc}"; S.offCall = "punt"; S.puntKind = "${kind}";`);
      const before = g("S.teams[1].score"), r = g(`doPunt()`);
      if (/Blocked/.test(r.head)) continue;
      if (g("S.teams[1].score") > before) { out.td++; continue; }
      out.kept++;
      if (/into the end zone/.test(r.text)) out.tb++;
      if (g("S.spot") <= 10) out.in10++;
      if (r.head === "Pinned deep") out.pinned++;
      out.net += 100 - g("S.spot") - spot;
      const m = /returns it (\d+)/.exec(r.text); if (m) out.ry += +m[1];
    }
    out.net /= out.kept; return out;
  };
  setP(55, 55);
  // From their 40: a regular punt sails into the end zone a lot; pinning it stops short and downs it deep
  const nm = punts("normal", 60, "ba", 1500), pin = punts("pin", 60, "ba", 1500);
  ok(pin.tb * 3 < nm.tb, `pinning it from their 40 means far fewer touchbacks (${pin.tb} against ${nm.tb})`);
  ok(pin.in10 > nm.in10 * 1.5, `and a lot more punts downed inside the 10 (${pin.in10} against ${nm.in10})`);
  ok(pin.net > nm.net, `and a better net (${pin.net.toFixed(1)} against ${nm.net.toFixed(1)})`);
  ok(pin.pinned > 0, `a punt downed inside the 10 reads as pinned deep (${pin.pinned})`);
  // Backed up at the 10 with nobody back: booming it flips the field
  const nmDeep = punts("normal", 10, "ba", 1500), boomDeep = punts("boom", 10, "ba", 1500);
  ok(boomDeep.net > nmDeep.net + 5, `booming it from your 10 with nobody back gains real yards (${boomDeep.net.toFixed(1)} against ${nmDeep.net.toFixed(1)})`);
  // Against a return unit it outkicks the coverage: longer returns and more return touchdowns
  const nmRet = punts("normal", 10, "ret", 4000), boomRet = punts("boom", 10, "ret", 4000), pinRet = punts("pin", 10, "ret", 4000);
  ok(boomRet.ry / boomRet.kept > (nmRet.ry / nmRet.kept) * 1.3, `a boomed punt is returned farther (${(boomRet.ry / boomRet.kept).toFixed(1)} a punt against ${(nmRet.ry / nmRet.kept).toFixed(1)})`);
  ok(boomRet.td > nmRet.td * 1.5, `and returned for a touchdown more often (${boomRet.td} against ${nmRet.td} of 4000)`);
  ok(Math.abs(boomRet.net - nmRet.net) < 5, `but against a return its net is close to a regular punt's: a gamble, not a free win (${boomRet.net.toFixed(1)} against ${nmRet.net.toFixed(1)})`);
  // Out of range, pinning it is a short, high kick: almost never returned, and never for a touchdown
  ok(pinRet.td === 0 && pinRet.ry / pinRet.kept < 2, `a pooch punt is hard to return (${(pinRet.ry / pinRet.kept).toFixed(1)} yards a punt, ${pinRet.td} touchdowns)`);
  ok(pinRet.net < nmRet.net + 2, `and from your own 10 it gives up distance (${pinRet.net.toFixed(1)} against ${nmRet.net.toFixed(1)})`);
  // An accurate punter drops it inside the 10 more often
  setP(55, 90); const acc = punts("pin", 55, "ba", 1500);
  setP(55, 20); const wild = punts("pin", 55, "ba", 1500);
  ok(acc.in10 > wild.in10 * 1.15, `an accurate punter pins them deeper (${acc.in10} inside the 10 against ${wild.in10})`);
  // A bigger leg booms it farther
  setP(85, 55); const bigLeg = punts("boom", 10, "ba", 1000);
  setP(30, 55); const smallLeg = punts("boom", 10, "ba", 1000);
  ok(bigLeg.net > smallLeg.net + 8, `a big leg booms it farther (${bigLeg.net.toFixed(1)} against ${smallLeg.net.toFixed(1)})`);
  // A regular punt still works as before when no style is set
  setP(55, 55);
  plain(g, { spot: 30, down: 4, toGo: 8 }); g(`S.defCall = "ba"; S.offCall = "punt"; S.puntKind = null;`);
  ok(/punts|shanks/.test(g(`doPunt()`).text), "a punt with no style set is a regular punt");
  // The computer: pins from around midfield and booms it backed up, more often with better game management
  const cpuKinds = (spot, gm) => { const c = { normal: 0, pin: 0, boom: 0 }; g(`S.teams[0].coach.gm = ${gm}`);
    for (let i = 0; i < 600; i++) { plain(g, { spot, down: 4, toGo: 8 }); c[g(`cpuPuntKind()`)]++; } return c; };
  const mid = cpuKinds(58, 70), deep = cpuKinds(8, 70), open = cpuKinds(35, 70), midLow = cpuKinds(58, 25);
  ok(mid.pin > 400 && mid.boom === 0, `the computer pins them from their 42 (${JSON.stringify(mid)})`);
  ok(deep.boom > 250 && deep.pin === 0, `and booms it from its own 8 (${JSON.stringify(deep)})`);
  ok(open.normal === 600, `and punts normally in between (${JSON.stringify(open)})`);
  ok(midLow.pin < mid.pin, `a coach with weak game management pins them less often (${midLow.pin} against ${mid.pin})`);
}

// ---- Whole games ----
{
  const { g, F } = game(true);
  let finished = 0;
  for (let i = 0; i < 30; i++) {
    g(`newExhibition(); APP.ex.you = "watch"; startExhibition();`);
    let n = 0;
    while (g("S.phase") !== "final" && n < 6000) { F.autoStep(); n++; }
    if (g("S.phase") === "final") finished++;
    const s = g("S");
    // Stats add up: team rushing yards equal the players' rushing yards (sacks count as passing)
    for (const t of [0, 1]) {
      const ids = new Set(s.teams[t].players.map(p => p.id));
      let ry = 0, py = 0, sackY = 0;
      for (const id in s.ps) if (ids.has(id)) { ry += s.ps[id].ry || 0; py += s.ps[id].py || 0; sackY += s.ps[id].sky || 0; }
      ok(ry === s.teams[t].st.rush, `team rushing yards match the players' (${s.teams[t].st.rush} and ${ry})`);
      ok(py - sackY === s.teams[t].st.pass, `team passing yards match the players' minus sacks (${s.teams[t].st.pass} and ${py - sackY})`);
    }
  }
  ok(finished === 30, `every game reaches a final (${finished} of 30)`);
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
