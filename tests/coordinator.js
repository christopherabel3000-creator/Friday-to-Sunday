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


// ---- Steps 3 to 5: a coordinator's career ----
function career(seed, rep) {
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "wc", "blz"); newSeason(${seed}, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[0]); APP.screen = "season"; CAREER.rep = ${rep};`);
  return g;
}
// Sims the season and taps through the review and the carousel to the job market
function toMarket(g) {
  g(`simSeason(); act("offseason")`);
  for (let k = 0; g("APP.screen") !== "market" && k < 8; k++) { const s = g("APP.screen"); g(s === "signing" ? `act("adreview")` : s === "review" ? `act("carousel")` : `act("market")`); }
}
const take = (g, jid) => g(`SEASON.market.offer = ${JSON.stringify(jid)}; act("accept"); if (SEASON.market.counter) act("accept");`);
const text = html => html.replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");
{
  const g = career(78, 45);
  toMarket(g);
  g("CAREER.rep = 45");
  const old = g("SEASON.myId"), co = g("marketJobs().filter(jobRole)");
  ok(co.length >= 3 && g("hcJobs().every(id => !jobRole(id))"), "the job market lists coordinator jobs beside the head coaching jobs: " + co.length);
  ok(g(`marketJobs().filter(jobRole).every(j => jobSchool(j).coach && !isYou(jobSchool(j).coach) && hcBarOf(jobSchool(j)) - hcBarOf(mySchool()) >= 10 && !SEASON.review.why[jobSid(j)])`), "each at a bigger program than yours that isn't changing head coaches");
  ok(g(`marketJobs().filter(jobRole).every(j => { const s = jobSchool(j), d = CAREER.rep - (Math.max(0, REP_BAR[s.cls] - 24) + tradBit(s)); return d >= -8 && interestInJob(j) === (d >= 10 ? "high" : d >= 0 ? "medium" : "low"); })`), "open to you 24 points of reputation sooner than the head coaching job");
  ok(g(`Math.max(...marketJobs().filter(jobRole).map(j => classIndex(jobSchool(j).cls)))`) > g(`Math.max(...hcJobs().map(id => classIndex(jobSchool(id).cls)))`), "so coordinator jobs reach bigger classes than the head coaching jobs you could get");
  const html = g("vMarket()");
  ok(/data-a="jobrole" data-v="co"/.test(html) && /(Offensive|Defensive) coordinator, /.test(text(html)) && /Coach \w+ \w+, age \d+: Offense \d+/.test(text(html)), "the market has a Role filter, and each coordinator job names its head coach and his ratings");
  g(`act("jobrole", { v: "co" })`);
  ok(g("sortedJobs().length") === co.length && g("sortedJobs().every(jobRole)"), "the filter lists the coordinator jobs alone");
  g(`act("jobrole", { v: "all" })`);
  const jid = g(`marketJobs().filter(j => jobRole(j) === "oc").sort((a, b) => classIndex(jobSchool(b).cls) - classIndex(jobSchool(a).cls))[0]`), sid = jid.split("~")[0];
  const hc = g(`coachName(jobSchool(${JSON.stringify(jid)}).coach)`), hisDef = g(`jobSchool(${JSON.stringify(jid)}).def`);
  g(`act("joblook", { v: ${JSON.stringify(jid)} })`);
  ok(/The head coach/.test(g("vJobLook()")) && /You'd call the offense/.test(text(g("vJobLook()"))), "a closer look says what the job is");
  g(`act("back")`);
  take(g, jid);
  ok(g("SEASON.myId") === sid && g("coordRole()") === "oc" && g("CAREER.job.role") === "oc" && g("CAREER.job.id") === sid && g("CAREER.job.ten") === 0, "taking one makes you the school's offensive coordinator");
  ok(g("coachName(mySchool().coach)") === hc && !g("isYou(mySchool().coach)") && !g("iRun()") && g("progId()") === null, "under the head coach it had, who runs the program");
  ok(g("mySchool().off") === "wc" && g("mySchool().def") === hisDef, "your scheme on your side, his on the other");
  ok(g("CAREER.job.pay") === g("Math.round(.4 * stipendOf(mySchool()) / 50) * 50"), "the stipend is 40 percent of the head coach's");
  ok(g(`!isYou(SEASON.schools["${old}"].coach)`) && g("SEASON.market.done") === true && g("SEASON.review.filled") === true, "the school you left hires a new head coach");
  g("relinkCareer()");
  ok(!g("isYou(mySchool().coach)"), "and loading a save leaves the head coach in charge");
  ok(/offensive coordinator of the/.test(text(g("vOffseason()"))) && !/program fund|Hallway recruiting|The summer/i.test(text(g("vOffseason()")).replace(/runs the summer program, the hallways and the program fund/, "")), "the offseason has no program to run");
  g(`act("fund")`); g(`APP.screen = "fund"; currentView()`);
  ok(g("APP.screen") !== "fund", "and the program's screens are closed to a coordinator");
  g(`APP.screen = "offseason"; act("nextyear"); if (APP.screen === "newyear") act("season");`);
  ok(g("coordRole()") === "oc" && g("SEASON.year") === 2027 && !g("isYou(mySchool().coach)"), "the new season starts with you as coordinator");
  // The week
  const season = text(g("vSeason()"));
  ok(/Offensive coordinator under Coach/.test(season) && /Your offense is expected to score about \d+ points a game/.test(season) && /Your scheme/.test(season) && !/Defensive style/.test(season), "the season screen says your job, your side's expectation, and has your side's scheme only");
  g(`act("dstyle", { v: "${hisDef === "nfz" ? "rs" : "nfz"}" })`); const d0 = g("mySchool().def"), his = g("mySchool().coach.off_style");
  g(`act("ostyle", { v: "air" })`);
  ok(d0 === hisDef && g("mySchool().off") === "air" && g("CAREER.coach.off_style") === "air" && g("mySchool().coach.off_style") === his, "you can change your side's scheme and not his");
  g(`act("practice")`);
  const pr = text(g("currentView()()"));
  ok(/Your offense's practice/.test(pr) && !/Conditioning ·|Recovery ·|Presets/.test(pr), "the practice plan is your side's: fundamentals, install and opponent prep");
  const cond = g("SEASON.plan.areas.cond"); g(`act("parea", { t: "cond", v: ${cond === 3 ? 0 : 3} }); act("pcontact", { v: "full" })`);
  ok(g("SEASON.plan.areas.cond") === cond && g("SEASON.plan.contact") !== "full" || g("SEASON.plan.contact") === "full" && false, "conditioning and contact are the head coach's");
  g(`act("install")`);
  ok(/Offense/.test(g("vInstall()")) && !/<h3>Defense<\/h3>/.test(g("vInstall()")), "the install list is your side's plays");
  g(`act("pfocus", { v: DEF_IDS[0] }); act("pfocus", { v: OFF_IDS[0] })`);
  ok(g("SEASON.plan.focus.includes(OFF_IDS[0])") && !g("SEASON.plan.focus.includes(DEF_IDS[0])"), "and so is the install focus");
  g(`act("back"); act("back"); act("sroster", { t: SEASON.myId })`);
  const edits = (g("currentView()()").match(/data-a="dedit" data-v="([A-Z]+)"/g) || []).map(x => x.match(/data-v="([A-Z]+)"/)[1]);
  ok(edits.join() === "QB,RB,WR,TE,OL" && !/data-a="rot"/.test(g("currentView()()")), "on the depth chart your side's positions are yours to set, and no others");
  g(`act("back"); simCamp(); APP.screen = "season"`);
  const m0 = g("JSON.stringify(mySchool().mastery)");
  g(`act("hold")`);
  ok(g("SEASON.practice.role") === "oc" && g("SEASON.practice.prepHC") != null && g("JSON.stringify(mySchool().mastery)") !== m0, "practice is held with both coaches' plans");
  // The game
  g(`APP.screen = "season"; act("playgame"); if (APP.screen !== "game") act("playgame");`);
  const me = g("S.teams.findIndex(t => t.id === SEASON.myId)");
  ok(g("APP.screen") === "game" && g(`S.teams[${me}].role`) === "oc" && g(`S.teams[${1 - me}].role`) === "" && g(`S.teams[${me}].cpu`) === false, "your game is a coordinator's game");
  ok(g(`S.teams[${me}].coach.off`) === g("CAREER.coach.off") && g(`S.teams[${me}].coach.def`) === g("mySchool().coach.def") && g(`S.teams[${me}].coach.gm`) === g("mySchool().coach.gm") && g(`S.teams[${me}].trust`) === g("CAREER.job.sec / 100"), "played with your rating on offense, his on defense and his game management, and his trust in you");
  g(`simToEnd(); recordMyGame(); APP.screen = "season"`);
  // (the head coach is new in his job here, so he's neither let go nor hired away this year: what
  // happens to you when he goes is tested further down)
  g(`(() => { const c = coachCareer(mySchool().coach, mySchool()); c.job.ten = 0; c.job.tg = []; c.job.sec = 100; c.yrs = Math.min(c.yrs, c.span - 5); })()`);
  // The season and the review
  const rep0 = g("CAREER.rep");
  toMarket(g);
  const E = JSON.parse(g("JSON.stringify(CAREER.seasons[CAREER.seasons.length - 1])")), R = JSON.parse(g("JSON.stringify({ role: SEASON.review.role, fired: SEASON.review.fired, sec: SEASON.review.sec, hcGone: SEASON.review.hcGone || '' })"));
  ok(E.role === "oc" && Math.abs(E.g - Math.round((.75 * E.ug + .25 * E.tg) * 10) / 10) < .11 && Math.abs(E.ug - Math.round((E.pts - E.epts) / 2.5 * 10) / 10) < .11, "the grade is three parts your offense's points against its expectation and one part the team's season");
  ok(Math.abs(E.drep - Math.round(.7 * g(`repChange(${E.g}, "${E.cls}")`) * 10) / 10 - (E.top ? 2 : 0)) < .21 || E.rep === 0 || E.rep === 100, "reputation moves at 0.7 of a head coach's");
  ok(R.role === "oc" && R.fired === false && g("CAREER.job.ten") === 1 && Math.abs(g("CAREER.job.sec") - g(`newSec(60, ${E.g}, 50, 0)`)) < .01, "the head coach's trust moves with the grade, and a first-year coordinator isn't let go");
  g(`APP.screen = "review"`);
  ok(/The head coach's review/.test(text(g("vReview()"))) && /Your offense scored [\d.]+ points a game, against about \d+ expected/.test(text(g("vReview()"))), "the review is the head coach's, and explains the grade");
  g(`APP.screen = "coach"`);
  ok(/Your job: offensive coordinator/.test(text(g("currentView()()"))) && /1 season as a coordinator/.test(text(g("currentView()()"))), "your coach's page has the job and your seasons as a coordinator");
  ok(g("careerBySchool().length") === 2 && g("careerBySchool()[1].role") === "oc", "and the career list keeps the coordinator's seasons apart");
  // Leaving for a head coaching job: the school keeps its head coach
  g(`APP.screen = "market"`);
  const here = g("SEASON.myId"), boss = g("coachName(mySchool().coach)"), gone = R.hcGone;
  const hcj = g("hcJobs().filter(id => id !== SEASON.myId)[0]");
  if (hcj && !gone) {
    take(g, hcj);
    ok(g("SEASON.myId") === hcj && g("coordRole()") === "" && g("isYou(mySchool().coach)") && g("iRun()"), "a coordinator can take a head coaching job");
    ok(g(`!isYou(SEASON.schools["${here}"].coach)`) && (g(`coachName(SEASON.schools["${here}"].coach)`) === boss || g(`SEASON.review.why["${here}"]`) === "left"), "and the school he leaves keeps its head coach, unless the carousel takes him");
  }
}
// When the head coach is gone
{
  // He retires, and the school wants you: promoted
  const g = career(78, 45);
  toMarket(g);
  take(g, g(`marketJobs().filter(j => jobRole(j) === "dc")[0]`));
  g(`act("nextyear"); if (APP.screen === "newyear") act("season");`);
  g(`simSeason(); CAREER.rep = 99; (() => { const c = mySchool().coach; coachCareer(c, mySchool()); c.yrs = c.span; })(); pointsOf = () => ({ pf: 20, pa: 0, n: 10 }); (() => { const e = CAREER.seasons.find(x => x.seed === SEASON.seed); if (e && e.g != null) e.g = 2; })();`);
  g(`act("offseason")`);
  for (let k = 0; g("APP.screen") !== "market" && k < 8; k++) { const s = g("APP.screen"); g(s === "signing" ? `act("adreview")` : s === "review" ? `act("carousel")` : `act("market")`); }
  ok(g("SEASON.review.hcGone") === "retired" && g("SEASON.review.promo") === true && g("marketJobs().includes(SEASON.myId)") && g("interestInJob(SEASON.myId)") === "high", "when the head coach retires after a good year, the school offers you his job");
  g(`APP.screen = "review"`);
  ok(/The job is yours if you want it/.test(text(g("vReview()"))), "the review says so");
  const id = g("SEASON.myId");
  g(`APP.screen = "market"; act("pursue", { v: SEASON.myId })`);
  ok(g("SEASON.market.offer") === id, "the offer is certain");
  g(`act("accept")`);
  ok(g("SEASON.myId") === id && g("coordRole()") === "" && g("isYou(mySchool().coach)") && g("mySchool().off") === "wc" && g("mySchool().def") === "blz" && g("CAREER.job.ten") === 0 && !g("CAREER.job.role") && !g("SEASON.review.open.includes(SEASON.myId)"), "taking it makes you the head coach, with both schemes yours");
  g(`act("nextyear"); if (APP.screen === "newyear") act("season");`);
  ok(g("iRun()") && g("SEASON.year") === 2028 && /Your schemes/.test(g("vSeason()")), "and the next season is a head coach's");
}
{
  // He's fired after a poor year for you: the new coach keeps you, or brings his own staff
  let kept = 0, let_go = 0;
  // (the new coach's choice is a seeded roll against 0.2 to 0.9, by your grade. Left to the simmed
  // seasons, six schools now and then all went one way, so each school's grade is set here: a very
  // good year or a very bad one, by turns, unless its roll is one that goes
  // the same way whatever the grade)
  let n = 0;
  for (const seed of [78, 5, 911, 404, 1234, 77]) {
    const g = career(seed, 45);
    toMarket(g);
    take(g, g(`marketJobs().filter(j => jobRole(j))[0]`));
    g(`act("nextyear"); if (APP.screen === "newyear") act("season");`);
    g(`simSeason(); (() => { const c = coachCareer(mySchool().coach, mySchool()); c.job.ten = 5; c.job.sec = -100; c.job.tg = [-3, -3]; })(); CAREER.rep = 5;`);
    const roll = g("seededRandom(hashSeed(`${SEASON.seed}:${SEASON.myId}:kept`))()"), good = roll < .2 || (roll < .9 && n++ % 2 === 0);
    g(`CAREER.seasons[CAREER.seasons.length - 1].g = ${good ? 10 : -10}`);
    toMarket(g);
    const R = JSON.parse(g("JSON.stringify(SEASON.review)"));
    if (!R.hcGone) continue;
    ok(!R.promo && !!R.kept === good && !!R.letGo === !good, `seed ${seed}: after a ${good ? "very good" : "very bad"} year, the new coach ${good ? "keeps you" : "brings his own staff"}`);
    if (R.kept) {
      kept++;
      const before = g("coachName(mySchool().coach)");
      g(`act("stay")`);
      if (kept === 1) ok(g("coordRole()") !== "" && g("coachName(mySchool().coach)") !== before && !g("isYou(mySchool().coach)"), "kept: you stay, and the school hires a new head coach to work for");
    } else if (R.letGo) {
      let_go++;
      if (let_go === 1) {
        ok(R.fired === true && !/data-a="stay"/.test(g("vMarket()")) && /bringing his own staff/.test(text(g("vMarket()"))), "not kept: you need a new job, and it isn't called a firing");
        ok(g("CAREER.seasons[CAREER.seasons.length - 1].fired") === false, "nor counted as one");
        ok(g("marketJobs().length > 0 || !!SEASON.market.offer"), "and someone will hire you");
      }
    }
  }
  ok(kept + let_go >= 5 && kept >= 1 && let_go >= 1, "a new head coach keeps some coordinators and not others: " + kept + " kept, " + let_go + " let go");
}
{
  // He takes a bigger job and asks you along
  const g = career(78, 45);
  toMarket(g);
  take(g, g(`marketJobs().filter(j => jobRole(j) === "oc" && jobSchool(j).cls === "2A")[0] || marketJobs().filter(j => jobRole(j))[0]`));
  g(`act("nextyear"); if (APP.screen === "newyear") act("season");`);
  g(`simSeason(); (() => { const c = coachCareer(mySchool().coach, mySchool()); c.job.ten = 6; c.job.sec = 90; c.job.tg = [2, 2]; c.rep = 99; c.yrs = 3; c.span = 30; })();`);
  toMarket(g);
  const R = JSON.parse(g("JSON.stringify(SEASON.review)")), role = g("coordRole()"), boss = g("coachName(SEASON.schools[SEASON.review.hcTo || SEASON.myId].coach)");
  ok(R.hcGone === "left" && !!R.follow && R.follow.endsWith("~" + role) && g("marketJobs()[0]") !== undefined && g("marketJobs().includes(SEASON.review.follow)") && g("interestInJob(SEASON.review.follow)") === "high", "when the head coach takes a bigger job, he asks you to come with him");
  ok(g("SEASON.review.open.includes(SEASON.myId)") && g("SEASON.review.why[SEASON.myId]") === "left" && g("classIndex(jobSchool(SEASON.review.follow).cls) >= classIndex(mySchool().cls)"), "your school's job opens, and his new one is a step up");
  g(`act("pursue", { v: SEASON.review.follow })`);
  ok(g("SEASON.market.offer") === R.follow, "his offer is certain");
  g(`act("accept")`);
  ok(g("SEASON.myId") === R.follow.split("~")[0] && g("coordRole()") === role && g("coachName(mySchool().coach)") === boss && !g("isYou(mySchool().coach)"), "and you follow him, in the same role");
}
// Across levels
{
  const g = career(78, 64);
  toMarket(g);
  g("CAREER.rep = 64");
  const col = g(`marketJobs().filter(j => jobRole(j) && isCollege(jobSchool(j).cls)).map(j => jobSchool(j).cls)`);
  ok(col.length > 0 && col.every(c => ["D3", "D2", "FCS"].includes(c)) && col.includes("FCS") && g("hcJobs().every(id => !isCollege(jobSchool(id).cls))"), "a high school coach with a reputation of 64 finds college coordinator jobs up to the FCS, and no college head coaching jobs: " + col.length);
  ok(g(`marketJobs().every(j => !isPro(jobSchool(j).cls))`), "and no pro jobs");
  const jid = g(`marketJobs().filter(j => jobRole(j) && jobSchool(j).cls === "FCS")[0]`), sid = jid.split("~")[0], role = jid.split("~")[1];
  const boss = g(`coachName(jobSchool(${JSON.stringify(jid)}).coach)`);
  take(g, jid);
  ok(g("CAREER.next.role") === role && g("CAREER.next.id") === sid && g("CAREER.next.lvl") === "col" && /as (offensive|defensive) coordinator/.test(text(g("vOffseason()"))), "taking one waits for the next preseason, as any job in another world does");
  g(`act("nextyear"); if (APP.screen === "newyear") act("season");`);
  ok(g("SEASON.lvl") === "col" && g("SEASON.myId") === sid && g("coordRole()") === role && !g("isYou(mySchool().coach)") && g("CAREER.job.lvl") === "col" && g("CAREER.job.yrs") === 2 && g("CAREER.job.pay") >= 80000 && g("CAREER.job.pay") <= 250000, "then you're a college coordinator, on a contract in real dollars");
  ok(g("OTHER.myId == null && THIRD.myId == null") && g("[OTHER, THIRD].every(W => Object.values(W.schools).every(s => !isYou(s.coach)))"), "and the school you left has a coach of its own");
  const scr = text(g("currentView()()"));
  ok(/coordinator under Coach/.test(scr) && !/Recruiting board/.test(scr), "the college season screen is a coordinator's: no recruiting board");
  g(`simCamp && SEASON.camp && simCamp()`);
  g(`APP.screen = "season"; act("simgame")`);
  ok(g("recBoard().staff.nil") === 3 && g("recBoard().staff.fill") === true, "the head coach's staff runs recruiting, NIL included");
  toMarket(g);
  const E = JSON.parse(g("JSON.stringify(CAREER.seasons[CAREER.seasons.length - 1])"));
  ok(E.role === role && E.lvl === "col" && g("SEASON.review.role") === role && g("CAREER.job.yrs") <= 2, "a college season is graded and paid as a coordinator's");
  ok(/Spring practice/.test(text(g("(APP.screen = 'offseason', SEASON.market.done = true, vCOffseason())"))) && !/transfer portal<\/h3>|Your new class/.test(g("vCOffseason()")), "the college offseason has practice and your coach, and no recruiting or portal");
}
{
  // College to the pros
  const sb = load(), g = sb.__get;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026);`);
  g(`(() => { const C = OTHER; OTHER = SEASON; SEASON = C; arrangeWorlds([OTHER, THIRD]); CAREER.crep = 60; const id = SEASON.confs.find(c => c.cls === "P4").ids[0], pre = schoolKeep(SEASON.schools[id]); colTakeOver(id); startColJob(id); coordSettle(id, "dc", pre); colSetExpectations(); APP.screen = "season"; })()`);
  toMarket(g);
  g("CAREER.crep = 60");
  const pro = g(`marketJobs().filter(j => isPro(jobSchool(j).cls))`);
  ok(pro.length > 0 && pro.every(j => /~(oc|dc)$/.test(j)), "a power-conference coordinator at 60 finds pro coordinator jobs, and no pro head coaching jobs: " + pro.length);
  g("CAREER.crep = 45");
  ok(g(`marketJobs().filter(j => isPro(jobSchool(j).cls)).length`) === 0, "well under 55, none");
  g("CAREER.crep = 60");
  const jid = pro[0];
  g(`act("joblook", { v: ${JSON.stringify(jid)} })`);
  ok(/general manager runs the roster/.test(text(g("vJobLook()"))), "a pro coordinator job's closer look");
  g(`act("back")`);
  take(g, jid);
  g(`act("nextyear"); if (APP.screen === "newyear") act("season");`);
  ok(g("inPros()") && g("coordRole()") === jid.split("~")[1] && g("CAREER.job.ctl") === false && g("CAREER.job.lvl") === "pro" && g("CAREER.job.pay") >= 1000000 && g("CAREER.job.yrs") === 2 && !g("isYou(mySchool().coach)"), "then you're a pro coordinator: the general manager runs the roster");
  const scr = text(g("currentView()()"));
  ok(/coordinator under Coach/.test(scr) && !/salary cap:|general manager<\/button>/.test(g("currentView()()")), "the pro season screen has no cap or general manager buttons");
  g(`APP.screen = "cap"; currentView()`);
  ok(g("APP.screen") === "season", "and their screens are closed");
  toMarket(g);
  ok(g("CAREER.seasons[CAREER.seasons.length - 1].role") === jid.split("~")[1] && g("CAREER.seasons[CAREER.seasons.length - 1].lvl") === "pro", "a pro season is graded as a coordinator's");
  ok(g("hcJobs().every(id => !isPro(jobSchool(id).cls) || SEASON.review.fired || interestIn(jobSchool(id)) !== '')"), "pro head coaching jobs go by your pro reputation, as for anyone in the league");
}

console.log(`${checks - fails}/${checks} checks passed`);
if (fails) process.exit(1);
