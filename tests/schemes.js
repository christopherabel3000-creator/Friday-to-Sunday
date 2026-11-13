// Playbooks and schemes (Milestone 7): scheme plays, strengths that grow with install, changing
// schemes, the install pace, the offseason, the Option, roster fit, your coach's seasons in a scheme,
// looks, tempo, and saves from before the milestone. Checked against the real engine.
// Usage: node tests/schemes.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
const fresh = () => { const sb = load(); return { sb, g: sb.__get, F: sb.__fts }; };
const school = (g, seed, cls) => g(`genSchool(dice(${seed}), { id: "t${seed}", cls: "${cls || "1A"}", mascot: "Mules", town: "Testville", color: SCHOOL_COLORS[0], trad: 45 })`);
const exGame = (g, level) => g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition("${level || "hs"}"); APP.ex.you = "watch"; startExhibition();`);

// ---- The plays and the chart ----
{
  const { g } = fresh();
  const offs = g("Object.keys(OFFP).filter(k => M[k])"), defs = g("DEF_IDS.concat(Object.keys(SCHEME_DEFP))");
  ok(offs.every(p => defs.every(d => typeof g(`M["${p}"]["${d}"]`) === "number")), "every play has a matchup against every call");
  ok(g("JSON.stringify(M.ir.rb)") === "-2" && g("M.dp.zo") === -2 && g("M.pa.rb") === 2, "the base chart is unchanged");
  ok(["bal", "air", "gnp", "wc"].every(s => g(`schemePlaysAt("${s}", "hs").length`) === 3 && g(`schemePlaysAt("${s}", "col").length`) === 4 && g(`schemePlaysAt("${s}", "pro").length`) === 5), "three scheme plays in high school, four in college, five in the pros");
  ok(["bal", "blz", "nfz", "rs"].every(s => g(`schemeCallsAt("${s}", "hs").length`) === 3 && g(`schemeCallsAt("${s}", "pro").length`) === 5), "and the same for each defense");
  ok(g(`schemePlaysAt("opt", "col").length`) === 4 && !g(`offStylesAt("pro").includes("opt")`) && g(`offStylesAt("hs").includes("opt")`), "the Option: four plays through college, none in the pros");
  ok(g(`M.tri.scx`) <= -2 && g(`M.tri.ma`) >= 1 && g(`M.opp.rb`) >= 2.5 && g(`M.ctr.scx`) >= 1 && g(`M.btl.scx`) >= 1.5, "Scrape Exchange answers the option; Counter Trey and Bootleg beat it; Option Pass beats Run Blitz badly");
  ok(g("M.fvt.c3") > 1 && g("M.fvt.pr") <= -2 && g("M.stk.ma") < 0 && g("M.ycr.ma") > 1 && g("M.ms.rob") <= -2 && g("M.ms.ptm") <= -2, "named matchups from the design");
  ok(g(`ALL_SCHEME_IDS.every(id => OFFP[id] ? !!OFFP[lk(id)] && OFF_IDS.includes(lk(id)) : DEF_IDS.includes(lk(id)))`), "every scheme play is like a base play, for personnel, flags and the computer's situations");
  // A scheme play is better than a base play in its best spots and worse outside them
  const spread = id => { const v = g(`DEF_IDS.map(d => M["${id}"][d])`); return Math.max(...v) - Math.min(...v); };
  ok(g("Object.keys(SCHEME_OFFP)").every(id => spread(id) >= 1.5), "every scheme play has real strengths and weak spots");
  ok(g("Object.keys(SCHEME_OFFP)").every(id => Math.abs(g(`avg(DEF_IDS.map(d => M["${id}"][d]))`)) <= .6), "and none is better than a base play everywhere");
  // Looks: some calls share one on purpose, and a disguise has to show something different
  ok(g("LOOKS.qtr === LOOKS.zo") && g("LOOKS.dag === LOOKS.zb") && g("!!LOOKS.ovl && !!LOOKS.ber"), "scheme calls have looks, some shared");
  exGame(g, "pro");
  g(`S.teams[1].def = "nfz"; S.poss = 0;`);
  const lk = g(`lookIdsFor("zo").map(lookKey)`);
  ok(!lk.includes("zo") && new Set(lk).size === lk.length, "a disguise never shows the real look, or the same look twice");
}

// ---- A team's playbook in a game ----
{
  const { g } = fresh();
  exGame(g, "hs");
  ok(g(`S.teams.every((t, i) => offBook(i).concat(defBook(i)).filter(isSchemeId).every(id => t.mastery[id] >= SCHEME_SOLID))`), "an exhibition team knows its scheme plays at solid or better");
  g(`S.teams[0].off = "air"; S.teams[1].def = "blz"; S.poss = 0; S.down = 1; S.toGo = 10; S.spot = 30; S.twoPt = null;`);
  ok(g(`offIds("p11").includes("fvt") && !offIds("p11").includes("trp") && !offIds("p11").includes("shc")`), "the call sheet has your scheme's plays only, at your level");
  ok(g(`defCallsFor().includes("cbz") && !defCallsFor().includes("qtr")`), "and the defense's");
  // Strengths scale with install; weaknesses don't
  g(`S.teams[0].off = "air"; S.teams[1].def = "bal";`);
  g(`schemePlaysAt("air", "hs").forEach(id => S.teams[0].mastery[id] = 0)`);
  const at0 = g(`styleParts("sp", "ba", 0).off`), weak0 = g(`styleParts("ir", "ba", 0).off`);
  g(`schemePlaysAt("air", "hs").forEach(id => S.teams[0].mastery[id] = 100)`);
  const at100 = g(`styleParts("sp", "ba", 0).off`), weak100 = g(`styleParts("ir", "ba", 0).off`);
  ok(at0 === 0 && Math.abs(at100 - .5) < 1e-9, `a strength is worth nothing uninstalled and all of it fully installed (${at0}, ${at100})`);
  ok(weak0 === weak100 && weak0 < 0, "a weak spot counts in full from the first day");
  g(`schemePlaysAt("air", "hs").forEach(id => S.teams[0].mastery[id] = 50)`);
  ok(Math.abs(g(`styleParts("sp", "ba", 0).off`) - .25) < 1e-9, "half installed, half the strength");
  // The defense's too
  g(`S.teams[1].def = "rs"; schemeCallsAt("rs", "hs").forEach(id => S.teams[1].mastery[id] = 40);`);
  ok(Math.abs(g(`styleParts("ir", "ba", 0).def`) - .9 * .4) < 1e-9 && Math.abs(g(`styleParts("dp", "ba", 0).def`) - (-.4)) < 1e-9, "a defense's strengths scale too, and its weak spots don't");
  // Pattern Match is poor until it's well mastered
  ok(Math.abs(g(`defMasteryEdge("ptm", 40)`) - 2 * g(`masteryEdge(40)`)) < 1e-9 && g(`defMasteryEdge("ptm", 90)`) === g(`masteryEdge(90)`), "Pattern Match costs twice as much while it's being learned");
  // Option footballs come loose while it's learned
  ok(g(`fumMulFor("tri", 10)`) > g(`fumMulFor("or", 10)`) && g(`fumMulFor("tri", 90)`) <= g(`fumMulFor("or", 90)`), "the triple option fumbles more at low mastery");
  // The Option catches an unprepared defense
  g(`S.teams[1].prepLv = 0`); const sur0 = g(`optSurprise("tri", 1)`);
  g(`S.teams[1].prepLv = 3`); const sur3 = g(`optSurprise("tri", 1)`);
  ok(sur0 > 0 && sur3 === 0 && g(`optSurprise("ir", 1)`) === 0, "an unprepared defense gives up more to the option; a heavy week of film takes it away");
  // The Option isn't run in the pros
  const { g: g2 } = fresh();
  g2(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition("pro"); APP.ex.schools[0].off = "opt"; APP.ex.you = "watch"; startExhibition();`);
  ok(g2("S.teams[0].off") === "bal", "an Option team plays Balanced in a pro game");
}

// ---- The computer calls scheme plays, and games run ----
{
  const { g, F } = fresh();
  let sch = 0, all = 0, dsch = 0;
  for (let i = 0; i < 6; i++) {
    exGame(g, ["hs", "col", "pro"][i % 3]);
    let n = 0; while (g("S.phase") !== "final" && n < 6000) { F.autoStep(); n++; }
    ok(g("S.phase") === "final", "a game with scheme plays finishes");
    (g("S.chart") || []).forEach(e => { all++; if (g(`isSchemeId("${e.off}")`)) sch++; if (g(`isSchemeId("${e.def}")`)) dsch++; });
  }
  ok(sch / all > .1 && sch / all < .45, `the computer calls its scheme plays on some snaps, not most (${(100 * sch / all).toFixed(0)} percent)`);
  ok(dsch / all > .1 && dsch / all < .45, `and its scheme calls (${(100 * dsch / all).toFixed(0)} percent)`);
}

// ---- Changing schemes, installing them, and the offseason ----
{
  const { g } = fresh();
  const s0 = school(g, 7), from = s0.off === "air" ? "wc" : "air";
  g(`globalThis.T = genSchool(dice(7), { id: "t7", cls: "1A", mascot: "Mules", town: "Testville", color: SCHOOL_COLORS[0], trad: 45 }); switchScheme(T, "off", "${from}");`);
  const old = g(`schemePlaysAt("${s0.off}", "hs").map(id => T.mastery[id])`), before = schemePlays => schemePlays;
  ok(g(`schemePlaysAt("${from}", "hs").every(id => T.mastery[id] === 0)`), "a new scheme's plays start at 0");
  ok(old.every((v, i) => Math.abs(v - s0.mastery[g(`schemePlaysAt("${s0.off}", "hs")`)[i]] / 2) < .02), "the old scheme's plays are shelved at half");
  ok(!g(`switchScheme(T, "off", "${from}")`), "switching to the scheme you run does nothing");
  // The install pace: three heavy weeks of camp, then a balanced season
  g(`T.players.forEach(p => { p.r.awr = 40; }); T.coach.dev = 42;`);
  const camp = g(`blocksOf(campPlan(PRESETS.install)).install`), wk = g(`blocksOf(PRESETS.balanced).install`);
  const avgNow = () => g(`avg(schemePlaysAt("${from}", "hs").map(id => T.mastery[id]))`);
  for (let i = 0; i < 3; i++) g(`installPlays(T, ${camp}, [], null)`);
  const wk1 = avgNow();
  ok(wk1 >= 33 && wk1 <= 50, `three weeks of heavy install in camp: learning by week 1 (${wk1.toFixed(0)})`);
  let solidAt = 0, masteredAt = 0;
  for (let w = 1; w <= 16; w++) { g(`installPlays(T, ${wk}, [], null)`); const v = avgNow(); if (!solidAt && v >= 65) solidAt = w; if (!masteredAt && v >= 85) masteredAt = w; }
  ok(solidAt >= 4 && solidAt <= 8, `solid around week 5 or 6 (week ${solidAt})`);
  ok(masteredAt >= 10 && masteredAt <= 16, `mastered late in the year (week ${masteredAt})`);
  // A focus play learns faster; Balanced installs faster; so does a coach who's run the scheme
  const gain = (style, focus, years) => g(`(() => { const s = genSchool(dice(9), { id: "x", cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[1], trad: 45 }); switchScheme(s, "off", s.off === "${style}" ? "gnp" : "${style}"); switchScheme(s, "off", "${style}"); const id = schemePlaysAt("${style}", "hs")[0]; s.mastery[id] = 0;
    s.coach.sch = { off: { ${style}: ${years || 0} }, def: {} }; installPlays(s, 2, ${focus ? `[id]` : "[]"}, null); return s.mastery[id]; })()`);
  ok(gain("air", true) > gain("air", false) * 1.4, "a focus play learns faster");
  ok(Math.abs(gain("bal", false) / gain("air", false) - 1.25) < .02, "Balanced installs a quarter faster");
  ok(Math.abs(gain("air", false, 3) / gain("air", false) - 1.12) < .02 && Math.abs(gain("air", false, 9) / gain("air", false) - 1.2) < .02, "4 percent faster for each season in the scheme, up to 20");
  // A coordinator installs his side's only
  g(`globalThis.U = genSchool(dice(11), { id: "u", cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[1], trad: 45 }); [schemePlaysAt(U.off, "hs"), schemeCallsAt(U.def, "hs")].flat().forEach(id => U.mastery[id] = 10);`);
  g(`installPlays(U, 2, [], null, U.coach, "oc")`);
  ok(g(`schemePlaysAt(U.off, "hs").every(id => U.mastery[id] > 10) && schemeCallsAt(U.def, "hs").every(id => U.mastery[id] === 10)`), "an offensive coordinator's install teaches his side's scheme plays only");
  // The offseason: the scheme's plays fade like the rest (never up), shelved ones lose half
  g(`globalThis.V = genSchool(dice(13), { id: "v", cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[2], trad: 45 }); schemePlaysAt(V.off, "hs").forEach(id => V.mastery[id] = 90); V.mastery.${from === "air" ? "fvt" : "slf"} = 40;`);
  const cur0 = g(`V.mastery[schemePlaysAt(V.off, "hs")[0]]`);
  g(`(() => { const o = V.off === "air" ? "wc" : "air"; schemePlaysAt(o, "hs").forEach(id => V.mastery[id] = 40); V.other = o; })()`);
  g(`fadeSchemes(V)`);
  ok(Math.abs(g(`V.mastery[schemePlaysAt(V.off, "hs")[0]]`) - (cur0 - (cur0 - 30) * .08)) < .02, "a returning scheme's plays fade a little over the offseason");
  ok(g(`schemePlaysAt(V.other, "hs").every(id => Math.abs(V.mastery[id] - 20) < .02)`), "a shelved scheme's plays fade by half");
  g(`schemePlaysAt(V.off, "hs").forEach(id => V.mastery[id] = 12); fadeSchemes(V)`);
  ok(g(`schemePlaysAt(V.off, "hs").every(id => V.mastery[id] === 12)`), "a scheme play below 30 doesn't drift up");
}

// ---- Schools, coaches and saves ----
{
  const { g } = fresh();
  let opt = 0, n = 0, known = true;
  for (let k = 0; k < 80; k++) {
    const s = school(g, 300 + k);
    n++; if (s.off === "opt") opt++;
    const cur = g(`schemePlaysAt("${s.off}", "hs").concat(schemeCallsAt("${s.def}", "hs"))`);
    if (!cur.every(id => s.mastery[id] >= 35) || !g("ALL_SCHEME_IDS").every(id => s.mastery[id] != null)) known = false;
  }
  ok(known, "a school knows its coach's scheme plays, and has a number for every other");
  ok(opt >= 2 && opt <= 25, `some small-school coaches run the Option (${opt} of ${n})`);
  ok([...Array(40).keys()].every(k => school(g, 500 + k, "PRO").off !== "opt"), "no pro coach does");
  ok(JSON.stringify(school(g, 77).mastery) === JSON.stringify(school(g, 77).mastery), "the same seed builds the same playbook");
  // A save from before the milestone: the scheme it runs now at solid, every other at 0
  g(`globalThis.W = genSchool(dice(15), { id: "w", cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[2], trad: 45 }); ALL_SCHEME_IDS.forEach(id => delete W.mastery[id]); fillSchemes(W);`);
  ok(g(`schemePlaysAt(W.off, "pro").concat(schemeCallsAt(W.def, "pro")).every(id => W.mastery[id] === SCHEME_SOLID) && ALL_SCHEME_IDS.filter(id => !SCHEME_PLAYS[W.off].includes(id) && !SCHEME_CALLS[W.def].includes(id)).every(id => W.mastery[id] === 0)`), "an old playbook gets its schemes' plays at solid, so no career is set back");
  // Your coach's seasons in a scheme
  g(`globalThis.C = { off_style: "air", def_style: "nfz" }; bumpSchemeYears(C, { off: "air", def: "nfz" }); bumpSchemeYears(C, { off: "air", def: "rs" }, "oc");`);
  ok(g("C.sch.off.air") === 2 && g("C.sch.def.nfz") === 1 && !g("C.sch.def.rs"), "your coach's seasons in each scheme count, a coordinator's on his side only");
  ok(/Air Raid offense 2 seasons/.test(g("schemeYearsLine(C)")), "and his page says so");
  // Roster fit
  const s = school(g, 21), fit = g(`rosterFit(genSchool(dice(21), { id: "t21", cls: "1A", mascot: "Mules", town: "Testville", color: SCHOOL_COLORS[0], trad: 45 }))`);
  const words = ["poor", "fair", "good", "great"];
  ok(g("OFF_STYLE_IDS").every(id => words.includes(fit.off[id])) && g("DEF_STYLE_IDS").every(id => words.includes(fit.def[id])), "roster fit rates every scheme");
  const fit2 = g(`(() => { const t = genSchool(dice(21), { id: "t21", cls: "1A", mascot: "Mules", town: "Testville", color: SCHOOL_COLORS[0], trad: 45 }); const q = lineupFor(t, "p11").QB[0]; q.r.spd = 99; q.r.elu = 99; q.r.acc = 10; q.r.arm = 10; t.depth = autoDepth(t); return rosterFit(t).off; })()`);
  ok(["good", "great"].includes(fit2.opt) && ["poor", "fair"].includes(fit2.air), `a running quarterback who can't throw suits the Option, not the Air Raid (${fit2.opt}, ${fit2.air})`);
  ok(g(`nextYearTeam(genSchool(dice(21), { id: "t21", cls: "1A", mascot: "Mules", town: "Testville", color: SCHOOL_COLORS[0], trad: 45 })).players.every(p => p.yr < 12)`), "next year's roster leaves out this year's seniors");
}

// ---- A season: changing schemes takes two taps, and the screens ----
{
  const { g } = fresh();
  g(`newCareer("Pat", "Ruiz", "line", "air", "nfz"); newSeason(4242);`);
  const pick = g("SEASON.districts[SEASON.district - 1].ids")[2];
  g(`pickSchool("${pick}"); APP = { v: 1, screen: "season", ex: null, view: null };`);
  ok(g(`schemePlaysAt("air", "hs").every(id => mySchool().mastery[id] === 0 || SEASON.schools["${pick}"].off === "air")`), "your scheme's plays start new at a school that ran something else");
  ok(/Schemes and roster fit/.test(g("vSeason()")) && /own plays are/.test(g("vSeason()")), "the season screen shows how installed your schemes are");
  g(`act("schemes")`);
  const v = g("vSchemes()");
  ok(g("APP.screen") === "schemes" && /Roster fit: \w+ now, \w+ next year/.test(v) && /Option/.test(v) && /Tap/.test(g(`(act("ostyle", { v: "gnp" }), vSchemes())`)), "the schemes screen: roster fit for each scheme, and a second tap to change");
  ok(g("mySchool().off") === "air", "one tap doesn't change your scheme");
  g(`act("ostyle", { v: "gnp" })`);
  ok(g("mySchool().off") === "gnp" && g("CAREER.coach.off_style") === "gnp", "the second tap does, for your coach too");
  ok(/Ground & Pound plays/.test(g("vInstall()")) && /Power/.test(g("vInstall()")), "the install screen lists your scheme's own plays first");
  g(`act("back")`);
  ok(g("APP.screen") === "season", "back to the season");
  // Season over: a season in the scheme for your coach
  g(`SEASON.phase = "over"; recordCareerSeason()`);
  ok(g("CAREER.coach.sch.off.gnp") === 1 && g("CAREER.coach.sch.def.nfz") === 1, "a finished season counts for your coach's schemes");
  // The scouting report names their schemes
  ok(/its own plays/.test(g(`oppSchemes(seasonSchool(SEASON.districts[SEASON.district - 1].ids[0]))`)), "the scouting report names the opponent's schemes and how installed they are");
}

// ---- The Option in the pros ----
{
  const { g } = fresh();
  g(`CAREER = { coach: { off_style: "opt", def_style: "bal" }, seasons: [] }; proOffense(CAREER.coach, { cls: "PRO" });`);
  ok(g("CAREER.coach.off_style") === "bal" && g("CAREER.optNote") === true, "an Option coach who takes a pro job runs Balanced until he picks his offense");
  g(`CAREER.coach.off_style = "opt"; CAREER.optNote = false; proOffense(CAREER.coach, { cls: "P4" });`);
  ok(g("CAREER.coach.off_style") === "opt" && !g("CAREER.optNote"), "in college he keeps it");
}

// ---- Tempo ----
{
  const { g, F } = fresh();
  exGame(g, "hs");
  g(`S.tempo = [true, true];`);
  let n = 0; while (g("S.phase") !== "final" && n < 6000) { F.autoStep(); if (g("S.tempoNow")) break; n++; }
  ok(!g("S.tempoNow") && !g("tempoLevel()"), "no tempo in high school");
  exGame(g, "col");
  ok(g("tempoLevel()"), "tempo in college");
  g(`Object.assign(CPU_TEMPO, { air: 1, wc: 1, bal: 1, gnp: 1, opt: 1 })`); // (every computer offense up-tempo, for the check)
  let saw = 0, fake = 0, lockedDef = 0, k = 0;
  while (g("S.phase") !== "final" && k < 6000) {
    F.autoStep(); k++;
    // (a kicking unit can still run on, and then the defense can sub too)
    if (g("S.phase") === "result" && g("S.tempoNow && !!OFFP[S.last.offId]")) { saw++; if (g("S.look && S.look.fake")) fake++; if (g("S.nhLock && S.last.dpk === S.nhLock.def")) lockedDef++; }
  }
  ok(saw > 5, `computer offenses can go up-tempo in college (${saw} snaps)`);
  ok(fake === 0 && lockedDef === saw, "on a tempo snap the defense can't disguise or change personnel");
  // Both sides tire faster
  exGame(g, "pro");
  const tire = on => g(`(() => { S.teams.forEach(t => t.players.forEach(p => { p.en = 100; })); S.tempoNow = ${on}; tireSnap(0, "p11", "nickel"); const q = lineupFor(S.teams[0], "p11").OL[0]; return 100 - q.en; })()`);
  ok(Math.abs(tire(true) / tire(false) - 1.4) < .01, "a tempo snap tires both sides 40 percent faster");
}

console.log(fails ? `${fails} of ${checks} checks failed` : `${checks}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
