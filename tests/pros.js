// Milestone 5, the pros. Step 1: pro rules (NFL, 2026) and the pro exhibition game.
// Usage: node tests/pros.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
function game(watch, post) {
  const sb = load(), g = sb.__get, F = sb.__fts;
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition("pro"); APP.ex.you = ${watch ? '"watch"' : 0}; startExhibition();${post ? " S.cfg.post = true;" : ""}`);
  return { sb, g, F };
}
function plain(g, extra) {
  g(`Object.assign(S, { quarter: 1, clock: 600, poss: 0, spot: 40, down: 1, toGo: 10, phase: "", toss: null, periodOver: false, gameOver: false,
    needPAT: false, tryChoice: null, kickChoice: null, retryTwo: null, twoPt: null, clockRunning: false, oobRestart: false, ot: null, otEnd: false, runClock: false, fcKick: false, fcNow: false });
    S.teams[0].score = 0; S.teams[1].score = 0;`);
  if (extra) g(`Object.assign(S, ${JSON.stringify(extra)})`);
}

// ---- The pro exhibition ----
{
  const { g } = game(true);
  ok(g("S.cfg.level") === "pro" && g("R().qLen") === 900 && g("R().twoMinWarning") && g("R().kickoff.dynamic") && g("R().kickoff.tb") === 35, "a pro exhibition plays by pro rules: 15-minute quarters, the two-minute warning, the dynamic kickoff");
  ok(g("R().tryXp") === 85 && g("R().tryTwo") === 98 && g("R().defTryScore") && g("R().onside.declared") && g("R().onside.anyTime"), "extra points from the 15, two-point tries from the 2, the defense can return a try, and onside kicks are declared");
  const sizes = g("APP.ex.schools.map(s => s.players.length)");
  ok(sizes.every(n => n === 53), `pro rosters of 53 (${sizes.join(", ")})`);
  const tw = g(`APP.ex.schools.map(s => { const o = new Set(); OFF_POS.forEach(p => (s.depth[p] || []).slice(0, STARTERS[p]).forEach(id => o.add(id))); let n = 0; DEF_POS.forEach(p => (s.depth[p] || []).slice(0, STARTERS[p]).forEach(id => { if (o.has(id)) n++; })); return n; })`);
  ok(tw.every(n => n === 0), `nobody starts both ways in the pros (${tw.join(", ")})`);
  ok(g(`APP.ex.schools.every(s => s.players.every(p => !p.pos2 || posSide(p.pos2) === posSide(p.pos)))`), "pro players are specialists: a second position only on the same side of the ball");
  const st = g(`APP.ex.schools.map(s => Math.round((sideRating(s, "off") + sideRating(s, "def")) / 2))`);
  ok(st.every(v => v >= 66 && v <= 82), `pro starters rate in the 70s (${st.join(", ")})`);
  ok(g(`/Pros/.test(vExhibition()) && /data-v="pro"/.test(vExhibition())`), "the exhibition screen offers the pros");
  g(`act("exlevel", { v: "col" })`);
  ok(g("APP.ex.level") === "col" && g("APP.ex.schools[0].cls") === "P4", "and college");
  g(`act("exlevel", { v: "pro" })`);
  ok(g("APP.ex.level") === "pro" && g("APP.ex.schools[0].cls") === "PRO", "and back to the pros");
}

// ---- Regular-season overtime: one 10-minute period, and ties ----
{
  let otGames = 0, ties = 0, bad = [];
  for (let i = 0; i < 120 && otGames < 50; i++) {
    const { g, F } = game(true);
    plain(g, { quarter: 4, clock: 0, periodOver: true });
    g(`S.teams[0].score = 20; S.teams[1].score = 20; endPeriod()`);
    const t = g("S.toss");
    if (!t || !t.ot) { bad.push("tied after regulation: an overtime coin toss"); continue; }
    if (g("S.quarter") !== 5 || g("S.clock") !== 600 || g("S.tos").join() !== "2,2") bad.push("one 10-minute period with two timeouts each");
    otGames++;
    let n = 0;
    while (g("S.phase") !== "final" && n < 3000) { F.autoStep(); n++; if (g("S.quarter") > 5) { bad.push("only one overtime period in the regular season"); break; } }
    if (g("S.teams[0].score === S.teams[1].score")) ties++;
  }
  ok(otGames >= 30 && bad.length === 0, `regular-season overtime (${otGames} games): ${[...new Set(bad)].join("; ") || "one 10-minute period, two timeouts"}`);
  ok(ties > 0 && ties < otGames, `some end in ties (${ties} of ${otGames}), most don't`);
  // The period runs out with a lead during the second team's possession: the team ahead wins
  const { g } = game(true);
  plain(g, { quarter: 5, clock: 0, periodOver: true, ot: { a: 1, ph: 2 } });
  g(`S.teams[1].score = 23; S.teams[0].score = 20; endPeriod()`);
  ok(g("S.gameOver") && g("S.quarter") === 5, "when time runs out in overtime, the team ahead wins, even during the second possession");
}

// ---- Playoff overtime is unchanged ----
{
  const { g } = game(true, true);
  plain(g, { quarter: 4, clock: 0, periodOver: true });
  g(`S.teams[0].score = 17; S.teams[1].score = 17; endPeriod()`);
  ok(g("S.quarter") === 5 && g("S.clock") === 900 && g("S.tos").join() === "3,3", "a playoff game's overtime: 15-minute periods with three timeouts");
  plain(g, { quarter: 5, clock: 0, periodOver: true, ot: { a: 1, ph: 2 } });
  g(`S.teams[1].score = 23; S.teams[0].score = 20; endPeriod()`);
  ok(!g("S.gameOver") && g("S.quarter") === 6, "and a guaranteed possession carries into the next period");
}

// ---- A defensive try return ----
{
  let ret = 0;
  for (let i = 0; i < 400 && !ret; i++) { const { g } = game(true); if (g("defReturnsTry()")) ret++; }
  ok(ret > 0, "the defense can return a try in the pros");
}

// ---- Full games finish ----
{
  let done = 0;
  for (let i = 0; i < 20; i++) {
    const { g, F } = game(true);
    let n = 0;
    while (g("S.phase") !== "final" && n < 6000) { F.autoStep(); n++; }
    if (g("S.phase") === "final") done++;
  }
  ok(done === 20, `computer-coached pro games play to the end (${done} of 20)`);
}

console.log(`${checks - fails}/${checks} checks passed`);
if (fails) process.exit(1);
