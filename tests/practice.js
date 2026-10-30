// Practice, playbook mastery, injuries and opponent prep, checked against the real engine.
// Usage: node tests/practice.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } };
const fresh = () => { const sb = load(); return { sb, g: sb.__get, F: sb.__fts }; };
const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
// A school built the way the season builds them
const school = (g, seed) => g(`genSchool(dice(${seed}), { id: "t${seed}", cls: "1A", mascot: "Mules", town: "Testville", color: SCHOOL_COLORS[0], trad: 45 })`);

// ---- Playbooks ----
{
  const { g } = fresh();
  let coreHi = 0, coreN = 0, restLo = 0, restN = 0;
  for (let k = 0; k < 30; k++) {
    const s = school(g, 100 + k), core = new Set(g(`CORE_PLAYS["${s.off}"].concat(CORE_CALLS["${s.def}"])`));
    ok(g("INSTALL_IDS").every(id => s.mastery[id] >= 0 && s.mastery[id] <= 100), "every play has a mastery from 0 to 100");
    for (const id of g("INSTALL_IDS")) { if (["qs", "hm", "te"].includes(id)) continue; if (core.has(id)) { coreN++; if (s.mastery[id] >= 55) coreHi++; } else { restN++; if (s.mastery[id] < 55) restLo++; } }
  }
  ok(coreHi / coreN > .97 && restLo / restN > .95, `a school knows its core plays and not much else (${coreHi}/${coreN} core known, ${restLo}/${restN} others not)`);
  ok(g(`Object.keys(CORE_PLAYS).every(k => CORE_PLAYS[k].length === 4) && Object.keys(CORE_CALLS).every(k => CORE_CALLS[k].length === 4)`), "about four core plays on each side for every scheme");
  ok(JSON.stringify(school(g, 7).mastery) === JSON.stringify(school(g, 7).mastery), "the same seed builds the same playbook");
}

// ---- Mastery in a snap ----
{
  const { g } = fresh();
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); APP.ex.you = "watch"; startExhibition();
     Object.assign(S, { quarter: 1, clock: 600, poss: 0, spot: 40, down: 1, toGo: 10, phase: "", look: null, twoPt: null });`);
  // The same dice, a play known well and one that's brand new: the edge differs by exactly the mastery edge
  const roll = (mo, md) => g(`(() => { S.teams[0].mastery.ir = ${mo}; S.teams[1].mastery.ba = ${md}; setRandom(seededRandom(99)); const r = rollPlay("ir", "ba", "p11", "base"); setRandom(null); return r.m; })()`);
  const known = roll(90, 70), raw = roll(20, 70), want = g("masteryEdge(90) - masteryEdge(20)");
  ok(Math.abs((known - raw) - want) < 1e-9 && want > .5, `a known play is an edge over a new one (${(known - raw).toFixed(2)})`);
  ok(Math.abs((roll(70, 20) - roll(70, 95)) - (g("masteryEdge(95)") - g("masteryEdge(20)"))) < 1e-9, "the defense's mastery counts the other way");
  ok(g("masteryEdge(70)") === 0 && g("masteryEdge(100)") > 0 && g("masteryEdge(20)") < -.4, "70 is the usual level; above helps, below hurts more");
  // Flags: a call the team is still learning draws more of them
  const flags = (mo, md) => g(`(() => { S.teams[0].mastery.ir = ${mo}; S.teams[1].mastery.ba = ${md}; return flagMuls("ir", "ba"); })()`);
  ok(flags(20, 70)[0] > 1.25 && flags(95, 70)[0] < .85 && flags(70, 20)[1] > 1.25, "flags follow how well each side knows its call");
  ok(g(`(() => { S.teams[0].mastery = null; return masteryOf(0, "ir"); })()`) === g("MASTERY_BASE"), "a team without a playbook record plays every call at the usual level");
  // The computer calls what its team knows
  g(`(() => { const s = APP.ex.schools[0]; s.mastery = genMastery(dice(1), "bal", "bal"); INSTALL_IDS.forEach(id => s.mastery[id] = 50); s.mastery.ir = 95; s.mastery.or = 5; })(); startExhibition();`);
  const tally = g(`(() => { const t = {}; for (let i = 0; i < 1500; i++) { Object.assign(S, { quarter: 1, clock: 600, poss: 0, spot: 40, down: 1 + (i % 2), toGo: 6, twoPt: null, kneelSeries: false, offPkg: "p11" }); const c = cpuOff(); t[c] = (t[c] || 0) + 1; } return t; })()`);
  ok((tally.ir || 0) > 2 * (tally.or || 0), `the computer calls the play it knows (Inside Run ${tally.ir}, Outside Zone ${tally.or})`);
}

// ---- A week of practice ----
{
  const { g } = fresh();
  ok(g(`AREA_IDS.every(id => PRESET_IDS.every(p => PRESETS[p].areas[id] != null))`), "every preset sets every area");
  for (const p of g("PRESET_IDS")) { const b = g(`blocksOf(PRESETS.${p})`); ok(Math.abs(Object.values(b).reduce((s, v) => s + v, 0) - 10) < 1e-9, `${p}: ten blocks`); }
  const rest = g(`blocksOf({ areas: {}, contact: "shells" })`);
  ok(rest.rec === 10, "a plan with nothing in it is a week of rest");
  const heavyOl = g(`blocksOf({ areas: Object.assign({}, PRESETS.balanced.areas, { ol: 3 }), contact: "shells" })`), bal = g("blocksOf(PRESETS.balanced)");
  ok(heavyOl.ol > bal.ol && heavyOl.qb < bal.qb, "more weight for one area takes time from the rest");
  ok(g(`presetOf(newPlan())`) === "balanced", "a new plan is the balanced preset");
  // A season of practice: players grow, nobody past his potential, juniors and seniors less than freshmen
  const r = g(`(() => {
    const out = { over: 0, gain: { 9: [], 10: [], 11: [], 12: [] }, sta: [], below: 0 };
    for (let k = 0; k < 24; k++) {
      const s = genSchool(dice(500 + k), { id: "g" + k, cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[1], trad: 45 }), o0 = {}, st0 = {};
      s.players.forEach(p => { o0[p.id] = ovr(p, p.pos); st0[p.id] = p.sta; });
      for (let w = 0; w < 14; w++) { practiceSchool(s, CPU_PLAN, Math.random, { noInjuries: true }); }
      s.players.forEach(p => { const v = ovr(p, p.pos); if (o0[p.id] < p.pot) { out.below++; if (v > p.pot) out.over++; } out.gain[p.yr].push(v - o0[p.id]); out.sta.push(p.sta - st0[p.id]); });
    }
    return out; })()`);
  ok(r.over === 0, `nobody grows past his potential (${r.over} of ${r.below})`);
  ok(mean(r.gain[9]) > mean(r.gain[12]) && mean(r.gain[10]) > mean(r.gain[12]), `younger players grow more (freshmen ${mean(r.gain[9]).toFixed(1)}, seniors ${mean(r.gain[12]).toFixed(1)})`);
  ok(mean(r.gain[9]) > 2 && mean(r.gain[9]) < 6 && mean(r.gain[11]) > 1.2, `a balanced season grows players a few points (freshmen ${mean(r.gain[9]).toFixed(1)}, juniors ${mean(r.gain[11]).toFixed(1)})`);
  ok(mean(r.sta) > 2, `conditioning builds stamina (${mean(r.sta).toFixed(1)} a season)`);
  // Heavy work for one unit grows its players more than none at all
  const unitGain = w => g(`(() => { let t = 0, n = 0; for (let k = 0; k < 16; k++) { const s = genSchool(dice(700 + k), { id: "u" + k, cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[2], trad: 45 });
      const ol = s.players.filter(p => p.pos === "OL"), r0 = ol.map(p => p.r.rbk + p.r.pbk), plan = { areas: Object.assign({}, PRESETS.balanced.areas, { ol: ${w} }), contact: "shells", focus: [] };
      for (let w = 0; w < 8; w++) practiceSchool(s, plan, Math.random, { noInjuries: true });
      ol.forEach((p, i) => { t += p.r.rbk + p.r.pbk - r0[i]; n++; }); } return t / n; })()`);
  const none = unitGain(0), heavy = unitGain(3);
  ok(heavy > none + 1.5, `a heavy line week grows the line (heavy ${heavy.toFixed(1)}, none ${none.toFixed(1)} in blocking over 8 weeks)`);
  // Install: the focus plays gain the most
  const inst = g(`(() => { const s = genSchool(dice(42), { id: "i", cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[3], trad: 45 }); const m0 = clone(s.mastery);
      const plan = { areas: PRESETS.install.areas, contact: "shells", focus: ["dp", "ab"] }; for (let w = 0; w < 4; w++) practiceSchool(s, plan, Math.random, { noInjuries: true });
      return { dp: s.mastery.dp - m0.dp, ab: s.mastery.ab - m0.ab, other: INSTALL_IDS.filter(id => id !== "dp" && id !== "ab").map(id => s.mastery[id] - m0[id]) }; })()`);
  ok(inst.dp > 15 && inst.ab > 15 && inst.dp > 4 * Math.max(...inst.other), `install focus plays gain the most (Deep Shot +${inst.dp.toFixed(0)}, All-Out Blitz +${inst.ab.toFixed(0)}, others at most +${Math.max(...inst.other).toFixed(1)})`);
  ok(inst.other.every(v => v >= 0), "the rest of the playbook doesn't slip");
  // Contact and recovery: injuries and fresh legs
  const hurt = plan => g(`(() => { let n = 0; for (let k = 0; k < 40; k++) { const s = genSchool(dice(900 + k), { id: "h" + k, cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[4], trad: 45 });
      for (let w = 0; w < 14; w++) { n += practiceSchool(s, ${plan}, Math.random).hurt.length; healSchool(s, blocksOf(${plan}).rec, Math.random); } } return n / 40; })()`);
  const pads = hurt(`{ areas: PRESETS.balanced.areas, contact: "pads" }`), shorts = hurt(`{ areas: PRESETS.balanced.areas, contact: "shorts" }`), shells = hurt(`{ areas: PRESETS.balanced.areas, contact: "shells" }`);
  ok(pads > shells && shells > shorts && shells > .8 && shells < 4.5, `full pads hurt the most players, shorts the fewest (a season: pads ${pads.toFixed(1)}, shells ${shells.toFixed(1)}, shorts ${shorts.toFixed(1)})`);
  ok(g(`freshOf(blocksOf(PRESETS.rest), "shorts")`) === 100 && g(`freshOf(blocksOf({ areas: Object.assign({}, PRESETS.balanced.areas, { rec: 0, ol: 3, front: 3 }) }), "pads")`) < 95, "rest keeps legs fresh; heavy hitting with no recovery wears them down");
  // Healing: a game at a time, the season-ending kind never
  const heal = g(`(() => { const s = genSchool(dice(3), { id: "x", cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[5], trad: 45 }); const [a, b, c] = s.players;
      a.inj = { w: 0 }; b.inj = { w: 2 }; c.inj = { w: 99 }; const out = []; for (let k = 0; k < 4; k++) { healSchool(s, 0, () => .99); out.push([!!a.inj, b.inj ? b.inj.w : -1, !!c.inj]); } return out; })()`);
  ok(JSON.stringify(heal) === JSON.stringify([[false, 1, true], [false, 0, true], [false, -1, true], [false, -1, true]]), `injuries heal a game at a time: ${JSON.stringify(heal)}`);
  ok(g(`injText({ w: 0 })`) === "out this week" && g(`injText({ w: 1 })`) === "out this week and next" && g(`injText({ w: 3 })`) === "out about 4 weeks" && g(`injText({ w: 99 })`) === "out for the season", "injuries read plainly");
}

// ---- Injuries in games ----
{
  const { g, F } = fresh();
  let hurt = 0, games = 0, badField = 0;
  for (let i = 0; i < 80; i++) {
    g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); APP.ex.you = "watch"; startExhibition();`);
    let n = 0;
    while (g("S.phase") !== "final" && n < 6000) {
      F.autoStep(); n++;
      // Nobody hurt is on the field for a snap after it
      if (n % 25 === 0) badField += g(`[0, 1].reduce((s, t) => s + lineupPlayers(onField(t, "p11")).concat(lineupPlayers(onField(t, "base"))).filter(p => p.inj).length, 0)`);
    }
    hurt += g("S.teams.reduce((s, t) => s + t.players.filter(p => p.inj).length, 0)");
    games++;
  }
  const per = hurt / (games * 2);
  ok(per > .15 && per < .7, `about one injury every two or three games for each team (${per.toFixed(2)})`);
  ok(badField === 0, "injured players don't play");
  const notes = g("S.log.filter(e => /hurt on the play/.test(e.text)).length");
  ok(notes === g("S.teams.reduce((s, t) => s + t.players.filter(p => p.inj && p.inj.at === 'game').length, 0)"), "every injury is in the play-by-play");
}

// ---- Opponent prep ----
{
  const { g } = fresh();
  g(`newSeason(123); pickSchool(SEASON.districts[SEASON.district - 1].ids[0]);`);
  const ids = g("SEASON.districts[SEASON.district - 1].ids");
  // Film study tells a running team from a throwing one
  const film = (off) => g(`(() => { const o = seasonSchool("${ids[1]}"); o.off = "${off}"; const f = filmStudy(o, mySchool()); return f; })()`);
  const gnp = film("gnp"), air = film("air");
  ok(gnp.run > air.run + .15, `film study sees a running team (Ground & Pound ${Math.round(gnp.run * 100)}%, Air Raid ${Math.round(air.run * 100)}%)`);
  ok(["s", "m", "l"].every(b => Math.abs(gnp.off[b].calls.reduce((s, x) => s + x[1], 0) - 1) < 1e-9), "each situation's calls add up");
  ok(gnp.off.s.run > gnp.off.l.run, "they run more on short yardage than long");
  ok(g("S") === null, "film study leaves the game in progress alone");
  // The prep edge: only on the calls studied, for the side that studied them
  const P = g(`prepFrom(${JSON.stringify(gnp)}, 2, 42)`);
  ok(P.k > 0 && ["s", "m", "l"].every(b => P.off[b].length === 2 && P.def[b].length === 2), "a full report covers the top two calls in each situation");
  ok(g(`prepFrom(${JSON.stringify(gnp)}, 3, 42)`).k > P.k && g(`prepFrom(${JSON.stringify(gnp)}, 1, 42)`).k < P.k && g(`prepFrom(${JSON.stringify(gnp)}, 0, 42)`) === null, "more prep, more edge; none, none");
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); APP.ex.you = "watch"; startExhibition(); Object.assign(S, { poss: 0, down: 1, toGo: 10, twoPt: null });`);
  g(`S.teams[1].prep = { k: .1, off: { s: ["ir"], m: ["ir"], l: ["ir"] }, def: { s: [], m: [], l: [] } };`);
  ok(Math.abs(g(`prepEdge(0, "ir", "ba")`) + .1) < 1e-9 && g(`prepEdge(0, "dp", "ba")`) === 0, "the defense that studied Inside Run is ready for it, and only for it");
  g(`S.teams[0].prep = { k: .08, off: { s: [], m: [], l: [] }, def: { s: ["zo"], m: ["zo"], l: ["zo"] } }; S.teams[1].prep = null;`);
  ok(Math.abs(g(`prepEdge(0, "ir", "zo")`) - .08) < 1e-9, "an offense that studied Cover 2 has the edge against it");
}

// ---- Practice in the season ----
{
  const { g } = fresh();
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newSeason(2468); pickSchool(SEASON.districts[SEASON.district - 1].ids[3]);`);
  ok(!g("practiced()"), "practice hasn't happened yet");
  const rep = g("holdPractice()");
  ok(g("practiced()") && rep.week === 1 && rep.film && rep.opp === g("opponentIn(myGameIn(1), SEASON.myId)"), "hold practice: a report, with film study of this week's opponent");
  ok(g("SEASON.cpuWeek") === 1, "the rest of the district practiced too");
  const again = g("JSON.stringify(holdPractice())");
  ok(again === JSON.stringify(rep), "practice happens once a week");
  ok(g("startMyGame()") && g("S.teams.find(t => t.id === SEASON.myId).prep") !== null, "your team takes the film study into the game");
  ok(g("S.teams.find(t => t.id === SEASON.myId).players.every(p => p.en === SEASON.practice.fresh)"), "and starts the game as fresh as practice left it");
  g("simToEnd(); recordMyGame()");
  ok(g("SEASON.film") && Object.keys(g("SEASON.film.o")).length > 0, "your calls go into the season's film");
  g("finishWeek(); startMyGame();");
  // The week 2 opponent watched week 1: his scouting of your team starts from the film
  const meIdx = g("S.teams.findIndex(t => t.id === SEASON.myId)"), sct = g(`S.teams[${1 - meIdx}].coach.sct`);
  ok(sct < 25 || Object.keys(g(`scoutOf(${meIdx}).o`)).length > 0, `the other coach starts out knowing your habits (Scouting ${sct})`);
  // Somebody gets hurt in the game: it goes home with him, and heals a week at a time
  g(`simToEnd(); S.teams[${meIdx}].players.find(p => !p.inj).inj = { w: 2, at: "game" };`);
  const hurtId = g(`S.teams[${meIdx}].players.find(p => p.inj && p.inj.w === 2 && p.inj.at === "game").id`);
  g("recordMyGame()");
  ok(g(`playerById(mySchool(), "${hurtId}").inj.w`) === 2 && g("SEASON.injLog[2].game").includes(hurtId), "an injury in your game goes home with the player, and into the week's injury news");
  ok(g("played(myGameIn(2))"), "week 2 is in the books");
  g("finishWeek()");
  ok(g(`playerById(mySchool(), "${hurtId}").inj.w`) <= 1, "then heals a week");
  // A background game's injuries stay with that school too
  const pair = g("SEASON.districts[SEASON.district - 1].ids.filter(id => id !== SEASON.myId).slice(0, 2)");
  const hurtNow = () => g(`[${JSON.stringify(pair[0])}, ${JSON.stringify(pair[1])}].reduce((n, id) => n + SEASON.schools[id].players.filter(p => p.inj).length, 0)`);
  const before = hurtNow();
  for (let i = 0; i < 12 && hurtNow() === before; i++) g(`simFullGame(gameRec(${JSON.stringify(pair[0])}, ${JSON.stringify(pair[1])}, true))`);
  ok(hurtNow() > before, "injuries in the district's background games stay with those schools");
  ok(g("SEASON.practice.week") === 2, "simming a game holds that week's practice first");
  // Rebuilt schools grow on paper, the same way every time
  const other = g(`SEASON.districts.find(d => d.n !== SEASON.district).ids[0]`);
  const w0 = g(`JSON.stringify(rebuildSchool(SEASON.schools["${other}"], 0).players.map(p => p.r))`), w6 = g(`JSON.stringify(rebuildSchool(SEASON.schools["${other}"], 6).players.map(p => p.r))`);
  ok(w6 !== w0 && w6 === g(`JSON.stringify(rebuildSchool(SEASON.schools["${other}"], 6).players.map(p => p.r))`), "a school rebuilt for week 6 has grown, the same way every time");
  const r0 = g(`schoolRating(rebuildSchool(SEASON.schools["${other}"], 0))`), r14 = g(`schoolRating(rebuildSchool(SEASON.schools["${other}"], 14))`);
  ok(r14.off + r14.def > r0.off + r0.def, `and its starters got better (${r0.off + r0.def} to ${r14.off + r14.def})`);
  // The weekly growth used for quick sims matches what practice does, on average
  const grow = g(`(() => { let t = 0, n = 0; for (let k = 0; k < 30; k++) { const s = genSchool(dice(3000 + k), { id: "w" + k, cls: "1A", mascot: "M", town: "T", color: SCHOOL_COLORS[6], trad: 45 }); const a = sideRating(s, "off") + sideRating(s, "def");
      for (let w = 0; w < 14; w++) practiceSchool(s, CPU_PLAN, Math.random, { noInjuries: true }); t += (sideRating(s, "off") + sideRating(s, "def") - a) / 28; n++; } return t / n; })()`);
  ok(Math.abs(grow - g("WEEKLY_GROWTH")) < .07, `quick-sim schools grow about as fast as practice grows real ones (${grow.toFixed(3)} a week, using ${g("WEEKLY_GROWTH")})`);
  // A season played to the end with practice every week
  g("simSeason()");
  ok(g("SEASON.phase") === "over", "a whole season with practice plays to the end");
  ok(g("mySchool().players.filter(p => ovr(p, p.pos) > p.o0).length") >= 8, `your players got better over the season (${g("mySchool().players.filter(p => ovr(p, p.pos) > p.o0).length")} of them)`);
  ok(g("Object.values(SEASON.schools).filter(s => s.players).every(s => s.players.every(p => !p.inj || p.inj.w >= 0))"), "injury records stay sane");
  // An older save gets a practice plan and playbooks
  g(`(() => { const se = clone(SEASON); delete se.plan; Object.values(se.schools).forEach(s => { delete s.mastery; }); localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, build: 3, app: APP, game: null, season: se })); SEASON = null; APP = null; start(); })()`);
  ok(g("SEASON.plan") && g("presetOf(SEASON.plan)") === "balanced" && g("Object.values(SEASON.schools).filter(s => s.players).every(s => s.mastery && s.mastery.ir > 0)"), "a save from before practice gets a plan and playbooks");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
