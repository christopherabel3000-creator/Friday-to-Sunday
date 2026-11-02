// The whole state, 1A to 6A: schools, rosters and talent by class, two-way play, the other classes'
// seasons on paper, a state that stays at each class's level for years, and saves from before classes.
// Usage: node tests/state.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
const fresh = () => { const sb = load(); return { sb, g: sb.__get }; };
const CL = ["1A", "2A", "3A", "4A", "5A", "6A"];
const start = (g, seed) => g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newSeason(${seed}, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[0]);`);

// ---- Schools by class ----
{
  const { g } = fresh();
  // Brand-new schools: 60 of each class
  const by = g(`(() => { const out = {}; for (const cls of CLASSES) { const r = { roster: [], start: [], two: [], enroll: [], ok: true };
    for (let i = 0; i < 60; i++) { const s = genSchool(dice(1000 + i), { id: "x", cls, mascot: "M", towns: new Set() });
      r.roster.push(s.players.length); r.start.push((sideRating(s, "off") + sideRating(s, "def")) / 2); r.two.push(twoWayStarters(s).length); r.enroll.push(s.enroll);
      if (!s.depth.QB.length || !s.depth.K.length || s.cls !== cls) r.ok = false; }
    const a = x => x.reduce((p, v) => p + v, 0) / x.length;
    out[cls] = { roster: a(r.roster), start: a(r.start), two: a(r.two), lo: Math.min(...r.enroll), hi: Math.max(...r.enroll), ok: r.ok, info: CLASS_INFO[cls] }; } return out; })()`);
  CL.forEach((c, i) => {
    const x = by[c];
    ok(x.ok, `${c}: every school has a quarterback and a kicker`);
    ok(x.lo >= x.info.enroll[0] && x.hi <= x.info.enroll[1], `${c}: enrollment from ${x.info.enroll[0]} to ${x.info.enroll[1]} (${x.lo} to ${x.hi})`);
    ok(Math.abs(x.roster - x.info.roster) <= x.info.roster * .12, `${c}: rosters of about ${x.info.roster} (${x.roster.toFixed(1)})`);
    if (i) {
      const p = by[CL[i - 1]];
      ok(x.start > p.start + 1.5 && x.start < p.start + 5, `${c}'s starters are better than ${CL[i - 1]}'s (${x.start.toFixed(1)} against ${p.start.toFixed(1)})`);
      ok(x.two <= p.two + .3, `${c}: no more two-way starters than ${CL[i - 1]} (${x.two.toFixed(1)} against ${p.two.toFixed(1)})`);
    }
  });
  ok(by["1A"].two >= 5, `1A: plenty of starters still play both ways (${by["1A"].two.toFixed(1)})`);
  ok(by["6A"].two <= 3, `6A: hardly anybody plays both ways (${by["6A"].two.toFixed(1)})`);
  // Offense and defense come out even at every class
  ok(CL.every(c => { const s = g(`(() => { let o = 0, d = 0; for (let i = 0; i < 40; i++) { const s = genSchool(dice(5000 + i), { id: "x", cls: "${c}", mascot: "M", towns: new Set() }); o += sideRating(s, "off"); d += sideRating(s, "def"); } return [o / 40, d / 40]; })()`); return Math.abs(s[0] - s[1]) < 1.5; }), "offense and defense are about even at every class");
  // Bigger schools throw a little more
  const styles = g(`(() => { const out = {}; ["1A", "6A"].forEach(cls => { let air = 0; for (let i = 0; i < 400; i++) { const c = genCoach(dice(i + 1), cls); if (c.off_style === "air" || c.off_style === "wc") air++; } out[cls] = air; }); return out; })()`);
  ok(styles["6A"] > styles["1A"] * 1.3, `bigger schools' coaches throw more (${styles["1A"]} and ${styles["6A"]} of 400 pass-first)`);
  ok(g(`COACH_LEVEL["6A"] > COACH_LEVEL["1A"]`), "bigger schools hire better coaches");
}

// ---- The state ----
{
  const { g } = fresh();
  start(g, 2468);
  ok(g("SEASON.cls") === "1A" && g("mySchool().cls") === "1A", "a career starts at 1A");
  ok(g(`CLASSES.every(c => classDistricts(c).every(d => d.ids.every(id => SEASON.schools[id] && SEASON.schools[id].cls === c && SEASON.schools[id].district === d.n)))`), "every class's districts are its own schools");
  ok(g(`JSON.stringify(classDistricts("1A")) === JSON.stringify(SEASON.districts)`), "1A's districts are your season's");
  ok(g(`CLASSES.every(c => classDistricts(c).every(d => new Set(d.ids.map(id => SEASON.schools[id].colorFam)).size === 8))`), "district schools never share a color, in any class");
  ok(g(`CLASSES.every(c => new Set(Object.values(SEASON.schools).filter(s => s.cls === c).map(s => s.mascot)).size === 64)`), "every mascot in a class is different");
  // Rebuilt schools in other classes are the schools the state was built with
  const id = "5Ad4s2";
  ok(g(`(() => { const s = rebuildSchool(SEASON.schools["${id}"]); return s.players.length > 50 && s.cls === "5A" && Math.abs(schoolRating(s).off - SEASON.schools["${id}"].rating.off) < 1e-9; })()`), "a 5A school rebuilds with its whole roster and the same ratings");
  // The season: your class week by week, the others on paper when it's over
  g("simSeason()");
  ok(g("SEASON.phase") === "over" && !!g("SEASON.results"), "when your season is over, the whole state's results are in");
  const res = g("SEASON.results"), champs = g("SEASON.champs");
  ok(Object.keys(res).length === 384, "a result for every school");
  ok(CL.every(c => champs[c] && g(`SEASON.schools["${champs[c]}"].cls`) === c), "a state champion in every class");
  CL.forEach(c => {
    const ids = g(`Object.keys(SEASON.schools).filter(id => SEASON.schools[id].cls === "${c}")`), rs = ids.map(i => res[i]);
    ok(rs.every(r => r.rw + r.rl === 10), `${c}: everyone played ten regular-season games`);
    ok(rs.filter(r => r.po).length === 16 && rs.filter(r => r.dt).length === 8 && rs.filter(r => r.ch).length === 1, `${c}: 16 playoff teams, 8 district champions and one state champion`);
    ok(rs.reduce((n, r) => n + r.pw, 0) === 15 && rs.find(r => r.ch).pw === 4, `${c}: 15 playoff games, and the champion won 4`);
    ok(rs.reduce((n, r) => n + r.w, 0) === rs.reduce((n, r) => n + r.l, 0), `${c}: every win is someone's loss`);
  });
  ok(g(`(() => { const r = SEASON.results[SEASON.myId], f = fullRecord(SEASON.myId); return r.w === f.w && r.l === f.l && r.pw === playoffWins(SEASON.myId); })()`), "your own result is the season you played");
  ok(g("SEASON.weeks.every(w => w.games.every(gm => SEASON.schools[gm.h].cls === '1A'))") && g("SEASON.districts.length") === 8, "your season's schedule is still just your class");
}

// ---- Years on: every class stays at its level ----
{
  const { g } = fresh();
  start(g, 13579);
  const lv = [];
  for (let y = 0; y < 6; y++) {
    g("simSeason()"); g(`SEASON.phase = "offseason"`); g("nextSeason()");
    if (y >= 3) lv.push(g(`(() => { const out = {}; CLASSES.forEach(c => { const ss = Object.values(SEASON.schools).filter(s => s.cls === c); out[c] = ss.reduce((n, s) => n + (s.rating.off + s.rating.def) / 2, 0) / ss.length; }); return out; })()`));
  }
  const want = { "1A": 42, "2A": 45, "3A": 48, "4A": 51, "5A": 54, "6A": 57 };
  CL.forEach(c => { const a = lv.reduce((n, x) => n + x[c], 0) / lv.length; ok(Math.abs(a - want[c]) <= 1.5, `${c}: starters stay about ${want[c]} years on (${a.toFixed(1)})`); });
  // Schools on paper in each class, years later
  const ros = g(`(() => { const out = {}; CLASSES.forEach(c => { const ids = Object.keys(SEASON.schools).filter(id => SEASON.schools[id].cls === c && !isFull(SEASON.schools[id])).slice(0, 12); const ss = ids.map(id => rosterAt(SEASON.schools[id], SEASON.year)); out[c] = { n: ss.reduce((n, s) => n + s.players.length, 0) / ss.length, qb: ss.filter(s => s.players.some(p => p.pos === "QB" || p.pos2 === "QB")).length, k: ss.filter(s => s.players.some(p => ["K", "P"].includes(p.pos) || ["K", "P"].includes(p.pos2))).length, of: ss.length }; }); return out; })()`);
  CL.forEach(c => {
    const target = g(`CLASS_INFO["${c}"].roster`);
    ok(Math.abs(ros[c].n - target) <= target * .2, `${c}: rosters stay about ${target} years on (${ros[c].n.toFixed(1)})`);
    ok(ros[c].qb >= ros[c].of - 1 && ros[c].k >= ros[c].of - 2, `${c}: schools still have a quarterback and a kicker (${ros[c].qb} and ${ros[c].k} of ${ros[c].of})`);
  });
  ok(g("SEASON.history.length") === 36, "six seasons of champions in six classes");
}

// ---- A save from before there were classes ----
{
  const { g } = fresh();
  start(g, 8642);
  g("simSeason(5)");
  // Take the state back to 1A only, the way an older save has it
  const before = g(`(() => { for (const id in SEASON.schools) if (SEASON.schools[id].cls !== "1A") delete SEASON.schools[id]; delete SEASON.cls; return JSON.stringify(SEASON.schools); })()`);
  g(`(() => { const s = JSON.parse(JSON.stringify(currentSave())); s.build = 8; const up = upgradeSave(s); SEASON = up.season; })()`);
  ok(g("Object.keys(SEASON.schools).length") === 384 && g("SEASON.cls") === "1A", "an older save gets the other five classes");
  ok(g(`JSON.stringify(Object.fromEntries(Object.entries(SEASON.schools).filter(([, s]) => s.cls === "1A")))`) === before, "and its 1A schools are untouched");
  const { g: g2 } = fresh();
  start(g2, 8642);
  ok(g(`SEASON.schools["3Ad2s7"].town`) === g2(`SEASON.schools["3Ad2s7"].town`) && JSON.stringify(g(`SEASON.schools["3Ad2s7"].rating`)) === JSON.stringify(g2(`SEASON.schools["3Ad2s7"].rating`)), "the classes it gets are the ones a new state with its seed has");
  g("simSeason()");
  ok(g("Object.keys(SEASON.results).length") === 384, "and its season finishes for the whole state");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
