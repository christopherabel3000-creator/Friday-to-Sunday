// Milestone 6, the coordinator path. Step 1: a team that's half yours (you call one side for a
// computer head coach). Step 2: the other side as drive summaries, and asking him to go for it.
// Usage: node tests/coordinator.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
function game(role, level) {
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(${JSON.stringify(level || "hs")}); APP.ex.role = ${JSON.stringify(role)}; startExhibition(); APP.screen = "game";`);
  return g;
}
// Makes a call the way the buttons do: the first package, any play on its sheet
const CALL = `(() => { const off = S.side === "off", pk = pkgChoices(off)[0]; if (off) { S.offPkg = pk; const ids = offCallsFor(pk); S.offCall = ids[ri(0, ids.length - 1)]; S.offSide = null; defStep(); } else { S.defPkg = pk; const ids = defCallsFor(); S.defCall = ids[ri(0, ids.length - 1)]; afterDef(); } })()`;
// Plays a whole game without summaries, counting the phases that stop for you
function playAll(g) {
  const seen = {}; let n = 0;
  g("S.everyPlay = true");
  while (g("S.phase") !== "final" && n++ < 5000) {
    const ph = g("S.phase"), key = ph + (ph === "call" ? ":" + g("S.side") + ":" + (g("S.poss") === 0 ? "mine" : "theirs") : "");
    seen[key] = (seen[key] || 0) + 1;
    if (ph === "call") g(CALL); else if (ph === "los") g("audible(null)"); else if (ph === "hcask") g("askPass()");
    else if (ph === "toss") g(`(S.toss.step === "call" ? tossCall("heads") : tossChoose(S.toss.hs ? "defense" : "receive"), tossNext())`);
    else g("autoStep()");
  }
  return seen;
}
function plain(g, extra) {
  g(`Object.assign(S, { quarter: 1, clock: 600, poss: 0, spot: 40, down: 1, toGo: 10, phase: "", toss: null, periodOver: false, gameOver: false,
    needPAT: false, tryChoice: null, kickChoice: null, retryTwo: null, twoPt: null, clockRunning: false, oobRestart: false, ot: null, otEnd: false, runClock: false, fcKick: false, fcNow: false, ask: null, sum: null, last: null });
    S.teams[0].score = 0; S.teams[1].score = 0;`);
  if (extra) g(`Object.assign(S, ${JSON.stringify(extra)})`);
}

// ---- Step 1: who calls what ----
{
  const g = game("oc"), seen = playAll(g), keys = Object.keys(seen);
  ok(g("S.phase") === "final", "an offensive coordinator's game plays to the end");
  ok(seen["call:off:mine"] > 8 && !keys.some(k => k.startsWith("call:def") || k === "call:off:theirs"), "he's asked for offensive calls with his team's ball, and nothing else");
  ok(!keys.some(k => ["toss", "pat", "trychoice", "kickchoice", "penalty"].includes(k)), "the toss, tries, kickoffs and penalties are the head coach's");
  ok(g("S.chart.filter(e => e.hu & 1).length") > 8 && g("S.chart.filter(e => (e.hu & 1) && e.o !== 0).length") === 0 && g("S.chart.filter(e => e.hu & 2).length") === 0, "only his offense's snaps count as his");
  ok(g("S.teams[0].st.plays") > 0 && (g("S.ps") !== null), "stats are kept as usual");
}
{
  const g = game("dc"), seen = playAll(g), keys = Object.keys(seen);
  ok(g("S.phase") === "final" && seen["call:def:theirs"] > 8 && !keys.some(k => k.startsWith("call:off") || k === "los" || k === "hcask"), "a defensive coordinator is asked for defensive calls only");
  ok(!keys.some(k => ["toss", "pat", "trychoice", "kickchoice", "penalty"].includes(k)), "and no head coach's decisions");
  ok(g("S.chart.filter(e => (e.hu & 1) && e.o !== 1).length") === 0, "only his defense's snaps count as his");
  // The head coach answers a kicking unit himself
  const g2 = game("dc"); plain(g2, { poss: 1, down: 4, toGo: 12, spot: 30 });
  g2("startPlay()");
  ok(g2("S.offCall") === "punt" && g2("S.phase") === "result", "when they punt, the head coach makes the return call and the play runs");
}
{
  const g = game(""), seen = playAll(g);
  ok(seen["call:off:mine"] > 8 && seen["call:def:theirs"] > 8 && (seen.pat || 0) + (seen.kickchoice || 0) + (seen.toss || 0) + (seen.penalty || 0) >= 0 && g("roleOf(0)") === "", "a head coach still calls both sides");
  const g3 = game(""); plain(g3, { down: 4, toGo: 2, spot: 50 }); g3("startPlay()");
  ok(g3("S.phase") === "call" && g3("pkgChoices(true).includes('punt')"), "and decides his own fourth downs, with the kicking units on his sheet");
}
{
  const g = game("oc");
  plain(g, { down: 2, toGo: 5 }); g("startPlay()");
  ok(g("S.phase") === "call" && g("S.side") === "off" && !g("pkgChoices(true).some(isST)"), "an offensive coordinator's sheet has no kicking units");
  ok(/Your job/.test(g("vExhibition()")) && /data-a="exrole" data-v="oc" aria-pressed="true"/.test(g("vExhibition()")) && !/Defensive style/.test(g("vExhibition()")), "the exhibition screen has the job, and only his side's style");
  g(`act("exrole", { v: "dc" })`);
  ok(g("APP.ex.role") === "dc" && /Offensive style/.test(g("vExhibition()")) === false && /Defensive style/.test(g("vExhibition()")), "which can be changed");
  // Two-point tries: the head coach decides to go, the coordinator calls it
  plain(g, {}); g("S.teams[0].role = 'oc'; startTwo(R().tryTwo)");
  ok(g("S.phase") === "call" && g("S.side") === "off" && !!g("S.twoPt"), "he calls the two-point play");
  // Simming from any point still works
  plain(g, { down: 4, toGo: 2, spot: 50 }); g("startPlay(); simToEnd()");
  ok(g("S.phase") === "final", "the game can be simmed to the end");
}

// ---- Step 2: drive summaries ----
{
  const g = game("oc");
  g("coordRun()");
  let n = 0, sums = 0, bad = 0, theirs = 0;
  while (g("S.phase") !== "final" && n++ < 3000) {
    const ph = g("S.phase");
    if (ph === "result" && !g("S.youCalled")) bad++;
    if (g("!!S.sum && S.sum.at === S.log.length") && ph !== "result") { sums++; if (/drive: \d+ plays?, (minus )?\d+ yards?/.test(g("S.sum.lines.join(' ')"))) theirs++; g("S.sum = null"); }
    if (ph === "call") g(CALL); else if (ph === "los") g("audible(null)"); else if (ph === "hcask") g(`act("asklet")`);
    else if (ph === "result") g(`act("cont")`); else if (ph === "halftime") g("startPlay(); coordRun()");
    else g("autoStep()");
  }
  ok(g("S.phase") === "final" && bad === 0, "with summaries, he never stops on a play that wasn't his");
  ok(sums >= 4 && theirs >= 3, "and hears the other side as drive summaries: " + sums + ", " + theirs);
  ok(/id="drivesum" data-focus/.test(g("(S.sum = { at: S.log.length, lines: ['A drive.'] }, drivePanel())")) && /How it ended/.test(g("drivePanel()")), "the summary is a panel that takes the focus");
}
{
  const g = game("dc");
  g("coordRun()");
  let n = 0, mine = 0;
  while (g("S.phase") !== "final" && n++ < 3000) {
    const ph = g("S.phase");
    if (g("!!S.sum && S.sum.at === S.log.length") && /Your offense: /.test(g("S.sum.lines.join(' ')"))) mine++;
    if (ph === "call") g(CALL); else if (ph === "result") g("cont(); coordRun()"); else if (ph === "halftime") g("startPlay(); coordRun()"); else g("autoStep()");
  }
  ok(g("S.phase") === "final" && mine >= 3, "a defensive coordinator hears his own offense's drives the same way");
}
{
  const g = game("oc");
  g(`act("everyplay")`);
  ok(g("S.everyPlay") === true && g("APP.everyPlay") === true && g("coordRun()") === false, "every play can be chosen instead");
  ok(/data-a="everyplay" aria-pressed="true"/.test(g("vExtras()")), "from the game's footer");
  const g2 = game("");
  ok(!/data-a="everyplay"/.test(g2("vExtras()")) && g2("coordRun()") === false, "a head coach's game has neither");
}

// ---- Step 2: asking the head coach to go for it ----
{
  let yes = 0, no = 0, asked = 0;
  for (let i = 0; i < 80; i++) {
    const g = game("oc");
    plain(g, { down: 4, toGo: 2, spot: 52 }); g("startPlay()");
    if (g("S.phase") !== "hcask") continue; // (a rare fake punt is his secret)
    asked++;
    if (i === 0) {
      const html = g("vHcAsk()");
      ok(/sends out the punt team/.test(html) && /data-a="askgo"/.test(html) && /data-a="asklet"/.test(html) && /4th (&|and) 2/.test(html.replace(/&amp;/g, "&")), "fourth and short: the punt team, and a button to ask");
    }
    g(`act("askgo")`);
    if (g("S.ask.yes") === 1) {
      yes++;
      if (yes === 1) {
        ok(g("S.side") === "off" && g("S.ask.used") === true && /waves the punt team off/.test(g("S.ask.note")) && /waves the punt team off/.test(g("vCall()")), "when he agrees, the call is yours and the screen says so");
        // (a flag before the snap means the down is played again)
        for (let k = 0; k < 6 && g("S.ask.pending"); k++) { if (g("S.phase") === "call") g(CALL); if (g("S.phase") === "los") g("audible(null)"); if (g("S.phase") === "result") g("cont()"); }
        ok(g("S.ask.pending") === false && Math.abs(g("S.ask.mem")) === 1, "and he remembers how it turned out");
        plain(g, { down: 4, toGo: 1, spot: 60, ask: { used: true, mem: 0, n: 1, yes: 1, made: 0 } }); g("startPlay()");
        ok(g("S.phase") !== "hcask", "he's asked once a possession");
        plain(g, { poss: 1, down: 1 }); g("S.ask = { used: true, mem: 0, n: 1, yes: 1, made: 0 }; startPlay()");
        ok(g("S.ask.used") === false, "and again after the other team has had the ball");
      }
    } else {
      no++;
      if (no === 1) ok(/shakes his head and sends out the punt team/.test(g("S.sum.lines[0]")) && g("S.sum.lines.length") >= 2 && g("S.phase") !== "hcask", "when he says no, the punt goes ahead and the summary starts with his answer");
    }
  }
  ok(asked >= 70 && yes >= 12 && no >= 12, "he says yes sometimes and no sometimes: " + yes + " of " + asked);
  const g = game("oc");
  plain(g, { down: 4, toGo: 2, spot: 52 }); g("startPlay()");
  const mid = g("S.phase === 'hcask' ? askChance() : -1");
  g("S.teams[0].trust = 1"); const hi = g("S.phase === 'hcask' ? askChance() : -1");
  g("S.teams[0].trust = 0"); const lo = g("S.phase === 'hcask' ? askChance() : -1");
  ok(mid < 0 || (hi > mid && mid > lo), "the more he trusts you, the likelier he agrees");
  plain(g, { down: 4, toGo: 6, spot: 52 }); g("startPlay()");
  ok(g("S.phase") !== "hcask", "fourth and long isn't up for discussion");
  const d = game("dc"); plain(d, { down: 4, toGo: 2, spot: 52 }); d("startPlay()");
  ok(d("S.phase") !== "hcask", "and it's the offensive coordinator's button only");
}

console.log(`${checks - fails}/${checks} checks passed`);
if (fails) process.exit(1);
