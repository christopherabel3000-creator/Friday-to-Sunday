// The weekly game plan (Milestone 8): featured plays, how many count, the edge, leans, the
// computer's plans, halftime swaps, the install focus, and the screens. Checked against the real engine.
// Usage: node tests/gameplan.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
const fresh = () => { const sb = load(); return { sb, g: sb.__get, F: sb.__fts }; };
const strip = h => String(h).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const season = g => g(`newCareer("Pat", "Ruiz", "line", "air", "nfz"); newSeason(4242); pickSchool(SEASON.districts[SEASON.district - 1].ids[2]); APP = { v: 1, screen: "season", ex: null, view: null }; while (inCamp()) { holdPractice(); act("campnext"); }`);

// ---- Plans ----
{
  const { g } = fresh();
  season(g);
  const s = g("mySchool()"), m = s.mastery;
  const p = g("JSON.stringify(myPlan())") && g("myPlan()");
  const best = side => g(`planIds(mySchool(), "${side}", "hs")`).slice().sort((a, b) => m[b] - m[a]).slice(0, 4);
  ok(p.off.length === 4 && p.def.length === 4 && p.off.every(id => best("off").includes(id)) && p.def.every(id => best("def").includes(id)), "before the first game, the staff features the plays the team knows best");
  ok(["off", "def"].every(sd => ["s", "m", "l"].every(b => p.lean[sd][b] === "bal")), "and leans nowhere");
  ok(!p.off.some(id => ["qs", "hm", "te"].includes(id)), "special plays aren't featured");
  // How many count, by film study
  const of = lv => g(`gamePlanOf(myPlan(), ${lv})`);
  ok(of(0).off.length === 0 && of(1).off.length === 2 && of(2).off.length === 3 && of(3).off.length === 4, "no film, none; a light week 2; a full week 3; a heavy week 4");
  ok(JSON.stringify(of(1).off) === JSON.stringify(p.off.slice(0, 2)), "the plays picked first are the ones that count");
  ok(!of(2).lean && !!of(3).lean, "leans count only with a heavy week");
  ok(g(`gamePlanOf(myPlan(), 3, "off").def.length`) === 0 && g(`gamePlanOf(myPlan(), 3, "def").off.length`) === 0, "a coordinator's plan is his side's");
  // The plan stays week to week, and is kept to the playbook
  g(`SEASON.gplan.off = ["fvt", "ir"]`);
  ok(JSON.stringify(g("myPlan().off")) === JSON.stringify(["fvt", "ir"]), "your plan stays as you left it");
  g(`switchScheme(mySchool(), "off", "wc")`);
  ok(JSON.stringify(g("myPlan().off")) === JSON.stringify(["ir"]), "change schemes and the old scheme's plays drop off it");
}

// ---- In a game ----
{
  const { g } = fresh();
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition("hs"); APP.ex.you = "watch"; startExhibition();`);
  ok(g("S.teams.every(t => t.gp && t.gp.off.length >= 2 && t.gp.def.length >= 2)"), "both teams in an exhibition take a staff plan into the game");
  g(`S.poss = 0; S.teams[0].gp = { off: ["ir"], def: ["ba"], lean: null, n: 3, swaps: 0 }; S.teams[1].gp = { off: ["sp"], def: ["ma"], lean: null, n: 3, swaps: 0 }; S.teams[0].mastery.ir = 60; S.teams[1].mastery.ma = 60;`);
  ok(Math.abs(g(`planEdge(0, "ir", "zo")`) - .06) < 1e-9 && g(`planEdge(0, "or", "zo")`) === 0, "a featured play gets +0.06 when it's called");
  ok(Math.abs(g(`planEdge(0, "or", "ma")`) + .06) < 1e-9 && Math.abs(g(`planEdge(0, "ir", "ma")`)) < 1e-9, "a featured call takes it back, and the two cancel");
  g(`S.teams[0].mastery.ir = 30`);
  ok(g(`planEdge(0, "ir", "zo")`) === 0, "a featured play that's still new gets nothing");
  // The computer calls featured plays more, and follows a lean
  const w = g(`planWeights({ ir: 1, or: 1, sp: 1, dp: 1 }, 1, "off")`);
  ok(w.sp === 1.6 && w.ir === 1, "featured plays are called more");
  g(`S.teams[1].gp.lean = { off: { s: "run", m: "pass", l: "pass" }, def: { s: "press", m: "bal", l: "cover" } }; S.toGo = 1; S.twoPt = null;`);
  const wl = g(`planWeights({ ir: 1, or: 1, sp: 1, dp: 1 }, 1, "off")`), wd = g(`planWeights({ ab: 1, zo: 1, ba: 1 }, 1, "def")`);
  ok(wl.ir === 1.4 && wl.dp === .8 && Math.abs(wl.sp - 1.6 * .8) < 1e-9, "a run lean on short yardage: runs up, passes down");
  ok(wd.ab === 1.4 && wd.zo === .8 && Math.abs(wd.ma === undefined ? 0 : 0) === 0, "a pressure lean: blitzes up");
  ok(JSON.stringify(g(`(S.teams[1].gp.off = ["sp", "ir"], planFirst(1, "off", ["ir", "or", "sp"]))`)) === JSON.stringify(["ir", "sp"]), "on the call sheet the lean's plays come first");
  // Halftime swaps
  g(`S.phase = "halftime"; S.teams[0].gp = { off: ["ir", "or"], def: ["ba"], lean: null, n: 2, swaps: 0 };`);
  ok(/Already 2/.test(g(`planSwap(0, "off", "sp")`)), "a full plan has no room until a play comes off");
  g(`planSwap(0, "off", "ir")`); g(`planSwap(0, "off", "sp")`);
  ok(JSON.stringify(g("S.teams[0].gp.off")) === JSON.stringify(["or", "sp"]) && g("S.teams[0].gp.swaps") === 1, "take one off, put one on: one swap");
  g(`planSwap(0, "off", "or")`); g(`planSwap(0, "off", "dp")`); g(`planSwap(0, "off", "dp")`); g(`planSwap(0, "off", "ms")`);
  ok(g("S.teams[0].gp.swaps") === 2 && /No swaps left/.test(g(`planSwap(0, "off", "ms")`)) && !g("S.teams[0].gp.off").includes("ms"), "two swaps at most");
  g(`S.phase = "call"`);
  ok(g(`planSwap(0, "off", "sp")`) === "", "swaps only at halftime");
  // The computer's plan against your habits
  g(`globalThis.FILM = { o: { "*": { pa: 10, dp: 8 } }, d: { "*": { rb: 10 } }, dp: {} }; S.teams[1].mastery = Object.fromEntries(Object.keys(S.teams[1].mastery).map(k => [k, 70]));`);
  const cp = g(`cpuPlan(S.teams[1], "hs", FILM, 3)`);
  ok(cp.off.every(id => g(`M["${id}"].rb`) >= 1), `against a run-blitzing defense, it features the plays that beat Run Blitz (${cp.off.join(", ")})`);
  ok(cp.def.every(id => g(`M.pa["${id}"] + M.dp["${id}"]`) <= -2), `and against a play-action offense, the calls that stop it (${cp.def.join(", ")})`);
  ok(g("cpuPlanN({ sct: 30 })") === 2 && g("cpuPlanN({ sct: 45 })") === 3 && g("cpuPlanN({ sct: 60 })") === 4, "a better scout features more");
  // Games run with plans on both sides
  const { g: g2, F } = fresh();
  for (const lvl of ["hs", "pro"]) {
    g2(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition("${lvl}"); APP.ex.you = "watch"; startExhibition();`);
    let n = 0; while (g2("S.phase") !== "final" && n < 6000) { F.autoStep(); n++; }
    ok(g2("S.phase") === "final", `a ${lvl} game with game plans finishes`);
  }
}

// ---- The week ----
{
  const { g } = fresh();
  season(g);
  g(`SEASON.gplan = { off: ["dp", "ir"], def: ["ab"], lean: { off: { s: "run", m: "bal", l: "pass" }, def: { s: "bal", m: "bal", l: "bal" } } }; mySchool().mastery.dp = 20; mySchool().mastery.ab = 10; mySchool().mastery.ir = 90; SEASON.plan.focus = [];`);
  ok(JSON.stringify(g("planFocus()")) === JSON.stringify(["ab", "dp"]), "without your own install focus, the featured plays still being learned get it, least-known first");
  const dp0 = g("mySchool().mastery.dp");
  g("holdPractice()");
  ok(g("mySchool().mastery.dp") - dp0 > 4 && JSON.stringify(g("SEASON.practice.focus")) === JSON.stringify(["ab", "dp"]), "practice installs them as the focus");
  ok(/Game plan: on offense Deep Shot and Inside Run; on defense All-Out Blitz\./.test(g("planLine()")), "the week screen says your plan");
  ok(/data-a="gameplan"/.test(g("practicePanel()")), "and opens it");
  // The game: your plan, as far as the film study allows, and theirs
  const lv = g("SEASON.practice.prep");
  g("startMyGame()");
  const me = g("S.teams.findIndex(t => t.id === SEASON.myId)");
  const gp = g(`S.teams[${me}].gp`), n = g(`GP_N[${lv}]`);
  ok(JSON.stringify(gp.off) === JSON.stringify(["dp", "ir"].slice(0, n)) && gp.n === n, `you take your plan into the game, ${n} a side with this film study`);
  ok(!!g(`S.teams[${1 - me}].gp`) && g(`S.teams[${1 - me}].gp.off.length`) >= 2, "and so does the other coach");
  // The call sheet: featured plays first, under their own heading
  g(`S.poss = ${me}; S.side = "off"; S.phase = "call"; S.twoPt = null; S.down = 1; S.toGo = 10; S.spot = 30; S.pkgSel = "p11"; S.nhLock = null; S.offPkg = null;`);
  const sheet = strip(g("vCall()"));
  ok(/Game plan/.test(sheet) && sheet.indexOf("Game plan") < sheet.indexOf("Plays") && sheet.indexOf("Deep Shot") < sheet.indexOf("Plays"), "the call sheet lists the game plan first");
  ok((sheet.match(/Deep Shot/g) || []).length === 1, "and doesn't list a featured play twice");
  // The halftime panel
  g(`S.phase = "halftime"`);
  ok(/Your game plan/.test(strip(g("halfPlanPanel()"))) && /swaps? left/.test(strip(g("halfPlanPanel()"))), "at halftime you can swap featured plays");
  g(`S.phase = "call"`);
  // No film study: no featured plays
  const { g: g3 } = fresh();
  season(g3);
  g3(`SEASON.plan.areas.prep = 0; holdPractice(); startMyGame();`);
  ok(g3("S.teams.find(t => t.id === SEASON.myId).gp.off.length") === 0, "a week with no film study, and the plan doesn't count");
}

// ---- The plan screen ----
{
  const { g } = fresh();
  season(g);
  g(`holdPractice(); act("gameplan")`);
  ok(g("APP.screen") === "gameplan", "the game plan screen opens from the week");
  const v = strip(g("vGamePlan()"));
  ok(/This week.{1,6}s film study/.test(v) && /Featured, first/.test(v) && /What they expect from you/.test(v) && /Beats their/.test(v), "it says how many count, which plays are featured, what each beats, and what they expect from you");
  const first = g("myPlan().off[0]");
  g(`act("gpick", { s: "off", v: "${first}" })`);
  ok(!g("myPlan().off").includes(first), "tap a featured play to take it off");
  g(`act("gpick", { s: "off", v: "ms" })`);
  ok(g("myPlan().off")[3] === "ms", "tap another to feature it, last in line");
  g(`act("gpick", { s: "off", v: "dr" })`);
  ok(!g("myPlan().off").includes("dr") && g("myPlan().off").length === 4, "four at most");
  g(`act("glean", { s: "off", b: "s", v: "run" }); act("glean", { s: "def", b: "l", v: "cover" }); act("glean", { s: "def", b: "l", v: "nonsense" })`);
  ok(g("myPlan().lean.off.s") === "run" && g("myPlan().lean.def.l") === "cover", "leans are set by situation");
  g(`act("back")`);
  ok(g("APP.screen") === "season", "back to the week");
  // What they expect from you, from your film
  g(`SEASON.film = { o: { s: { ir: 7, sp: 3 }, l: { sp: 6, dp: 4 } }, d: { s: { rb: 6, ab: 2, ba: 2 } }, dp: {} }`);
  const ex = g(`expectLines("off")`), exd = g(`expectLines("def")`);
  ok(/Short yardage: they'll expect a run \(70 percent\), most of all Inside Run \(70 percent\)/.test(ex[0]) && /Long yardage: they'll expect a pass \(100 percent\)/.test(ex[1]), "what they expect from your offense");
  ok(/Short yardage: they'll expect pressure \(80 percent\), most of all Run Blitz/.test(exd[0]), "and from your defense");
}

console.log(fails ? `${fails} of ${checks} checks failed` : `${checks}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
