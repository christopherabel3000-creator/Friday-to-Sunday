// The season: the state's schools, the schedule, standings and tiebreakers, the playoff bracket, the
// quick sim against the full engine, your games, news, and saves in the middle of a season.
// Usage: node tests/season.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } };
const fresh = () => { const sb = load(); return { sb, g: sb.__get, F: sb.__fts }; };

// ---- The state ----
{
  const { g } = fresh();
  g("newSeason(4242)");
  const S0 = g("SEASON");
  const ids = Object.keys(S0.schools);
  ok(ids.length === 64 && S0.districts.length === 8 && S0.districts.every(d => d.ids.length === 8), "8 districts of 8 schools");
  ok(new Set(ids.map(id => S0.schools[id].town)).size === 64, "every town is different");
  ok(new Set(ids.map(id => S0.schools[id].mascot)).size === 64, "every mascot is different");
  ok(S0.districts.every(d => new Set(d.ids.map(id => S0.schools[id].colorFam)).size === 8), "schools in a district have different colors");
  ok(S0.districts.every(d => d.ids.every(id => !!S0.schools[id].players === (d.n === S0.district))), "only your district's schools are saved with their players");
  ok(ids.every(id => { const r = S0.schools[id].rating; return r.off >= 20 && r.off <= 70 && r.def >= 20 && r.def <= 70 && r.c > 0; }), "every school has ratings for quick sims");
  ok(S0.phase === "pick" && S0.myId === null && S0.week === 1, "a new season starts with picking a school");
  // A summary rebuilds into the same school a world with that district at home would have built
  const other = S0.districts.find(d => d.n !== S0.district), id = other.ids[3];
  const rebuilt = g(`rebuildSchool(SEASON.schools["${id}"])`);
  const { g: g2 } = fresh();
  const full = g2(`genWorld(4242, ${other.n}).schools["${id}"]`);
  ok(JSON.stringify(rebuilt) === JSON.stringify(full), "a summary rebuilds into exactly the same school");
  ok(JSON.stringify(g2(`genWorld(4242, ${other.n}).schools["${S0.districts[0].ids[0]}"].rating`)) === JSON.stringify(S0.schools[S0.districts[0].ids[0]].rating), "the same seed builds the same state");
  ok(g(`seasonSchool("${id}") === seasonSchool("${id}")`), "a rebuilt school is kept while the page is open");
  // Picking a school: you take over its coaching job
  ok(!g(`pickSchool("${id}")`), "you can only pick a school in your district");
  const mine = S0.districts[S0.district - 1].ids[2];
  ok(g(`pickSchool("${mine}")`) && g("SEASON.myId") === mine && g("SEASON.phase") === "preseason" && g("SEASON.camp") === 1, "pick a school: camp comes first");
  ok(g("mySchool().coach.you") && g("mySchool().coach.off") === g('COACH_LEVEL["1A"]'), "your coach has the class average ratings for now");
  ok(!g(`pickSchool("${S0.districts[S0.district - 1].ids[3]}")`), "and only once");
}

// ---- The schedule ----
{
  const { g } = fresh();
  for (const seed of [1, 99, 123456]) {
    g(`newSeason(${seed})`);
    const S0 = g("SEASON"), dist = id => S0.schools[id].district;
    ok(S0.weeks.length === 10, "ten regular-season weeks");
    ok(S0.weeks.every(w => { const seen = w.games.flatMap(gm => [gm.h, gm.a]); return seen.length === 64 && new Set(seen).size === 64; }), "every school plays exactly once a week");
    ok(S0.weeks.slice(0, 3).every(w => w.games.every(gm => !gm.dist && dist(gm.h) !== dist(gm.a))), "weeks 1 to 3: games against other districts");
    ok(S0.weeks.slice(3).every(w => w.games.every(gm => gm.dist && dist(gm.h) === dist(gm.a))), "weeks 4 to 10: district games");
    const pairs = new Set(), home = {};
    S0.weeks.forEach(w => w.games.forEach(gm => {
      if (gm.dist) pairs.add([gm.h, gm.a].sort().join("-"));
      home[gm.h] = (home[gm.h] || 0) + 1;
    }));
    ok(pairs.size === 8 * 28, "everyone plays everyone in their district exactly once");
    const opp = {};
    S0.weeks.slice(0, 3).forEach(w => w.games.forEach(gm => { (opp[gm.h] = opp[gm.h] || []).push(dist(gm.a)); (opp[gm.a] = opp[gm.a] || []).push(dist(gm.h)); }));
    ok(Object.values(opp).every(ds => new Set(ds).size === 3), "the three non-district games are against three different districts");
    const dhome = {};
    S0.weeks.slice(3).forEach(w => w.games.forEach(gm => { dhome[gm.h] = (dhome[gm.h] || 0) + 1; }));
    ok(Object.keys(S0.schools).every(id => (dhome[id] || 0) >= 3 && (dhome[id] || 0) <= 4), "three or four district home games each");
    ok(Object.keys(S0.schools).every(id => (home[id] || 0) >= 3 && (home[id] || 0) <= 7), "between three and seven home games each");
  }
}

// ---- Home games, over many schedules ----
{
  const { g } = fresh();
  const r = g(`(() => { const d = []; for (let i = 1; i <= 8; i++) d.push({ n: i, ids: Array.from({ length: 8 }, (_, k) => "d" + i + "s" + (k + 1)) });
    let teams = 0, distOk = 0, mid = 0, range = 0;
    for (let seed = 0; seed < 150; seed++) {
      const h = {}, dh = {};
      makeSchedule(d, dice(seed)).forEach(x => x.games.forEach(gm => { h[gm.h] = (h[gm.h] || 0) + 1; if (gm.dist) dh[gm.h] = (dh[gm.h] || 0) + 1; }));
      d.forEach(x => x.ids.forEach(id => { teams++; const a = dh[id] || 0, b = h[id] || 0; if (a >= 3 && a <= 4) distOk++; if (b >= 4 && b <= 6) mid++; if (b >= 3 && b <= 7) range++; }));
    }
    return { teams, distOk, mid, range }; })()`);
  ok(r.distOk === r.teams, `three or four district home games for every school, in 150 schedules (${r.teams - r.distOk} misses)`);
  ok(r.range === r.teams && r.mid / r.teams > .99, `four to six home games in all, nearly always (${(100 * r.mid / r.teams).toFixed(2)}%)`);
}

// ---- Standings and tiebreakers ----
{
  const { g } = fresh();
  g("newSeason(777); pickSchool(SEASON.districts[SEASON.district - 1].ids[0])");
  const d = g("SEASON.district"), ids = g(`SEASON.districts[${d} - 1].ids`);
  // Sets a district game's result between two schools: winner, loser, margin
  const setGame = (w, l, m) => g(`(() => { const gm = SEASON.weeks.flatMap(x => x.games).find(gm => gm.dist && ((gm.h === "${w}" && gm.a === "${l}") || (gm.h === "${l}" && gm.a === "${w}"))); if (gm.h === "${w}") { gm.hs = 20 + ${m}; gm.as = 20; } else { gm.as = 20 + ${m}; gm.hs = 20; } })()`);
  const clear = () => g("SEASON.weeks.forEach(w => w.games.forEach(gm => { gm.hs = null; gm.as = null; gm.ot = 0; }))");
  const order = () => g(`standings(${d}).map(r => r.id)`);
  // Everyone in a strict order: A beats everyone, B beats all but A...
  clear();
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) setGame(ids[i], ids[j], 7);
  ok(JSON.stringify(order()) === JSON.stringify(ids), "a clean order by district record");
  ok(g(`standings(${d})[0].dw`) === 7 && g(`standings(${d})[7].dl`) === 7, "district wins and losses");
  // Two tied: head-to-head decides. B beats A, then loses to the last-place school: A and B are both
  // 6-1, and B won the game between them.
  clear();
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) setGame(ids[i], ids[j], 7);
  setGame(ids[1], ids[0], 3); setGame(ids[7], ids[1], 3);
  let o = order();
  ok(o[0] === ids[1] && o[1] === ids[0] && o[2] === ids[2], "head-to-head breaks a two-way tie");
  // Three tied in a circle: head-to-head can't separate them; the overall record does
  clear();
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) setGame(ids[i], ids[j], 7);
  setGame(ids[1], ids[0], 3); setGame(ids[2], ids[1], 3); setGame(ids[0], ids[2], 3);
  // A, B and C are all 6-1 in district now? A beat C, lost to B; B beat A, lost to C; C beat B, lost to A.
  ok(g(`standings(${d}).slice(0, 3).every(r => r.dw === 6 && r.dl === 1)`), "a three-way tie at the top");
  // Give C the better overall record (a non-district win), A and B a loss
  g(`(() => { const nd = SEASON.weeks.slice(0, 3).flatMap(x => x.games); const res = (id, win) => { const gm = nd.find(gm => (gm.h === id || gm.a === id) && gm.hs == null); const mine = gm.h === id; gm.hs = mine === win ? 21 : 7; gm.as = mine === win ? 7 : 21; }; res("${ids[2]}", true); res("${ids[0]}", false); res("${ids[1]}", false); })()`);
  o = order();
  ok(o[0] === ids[2], "a three-way tie that head-to-head can't break goes to the overall record");
  // Same overall record: point differential in district games, capped at 14 a game
  clear();
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) setGame(ids[i], ids[j], 7);
  setGame(ids[1], ids[0], 3); setGame(ids[2], ids[1], 3); setGame(ids[0], ids[2], 3);
  setGame(ids[0], ids[5], 50); // A runs one up: only 14 of it counts
  setGame(ids[1], ids[6], 14); setGame(ids[1], ids[7], 14);
  const st = g(`standings(${d})`), diffOf = id => st.find(r => r.id === id).diff;
  ok(diffOf(ids[0]) === 3 - 3 + 14 + 7 * 4, `point differential is capped at 14 a game (${diffOf(ids[0])})`);
  ok(st[0].id === ids[1] && diffOf(ids[1]) > diffOf(ids[0]), "then the point differential decides");
  // Clinching
  clear();
  g("SEASON.week = 8");
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) setGame(ids[i], ids[j], 7);
  // Only the games through week 7 count after week 7: every school has played 4 district games
  const status = g(`SEASON.districts[${d} - 1].ids.map(id => raceStatus(id, 7))`);
  ok(status.every(s => ["title", "in", "out", ""].includes(s)), "race status reads");
  const after10 = g(`SEASON.districts[${d} - 1].ids.map(id => raceStatus(id, 10))`);
  ok(after10[0] === "title" && after10[1] === "in" && after10.slice(2).every(s => s === "out"), "after week 10: the champion, the runner-up, and everyone else out");
  ok(g(`raceStatus("${ids[0]}", 3)`) === "", "nobody clinches before district play");
}

// ---- Clinching, with a brute-force check ----
{
  const { g } = fresh();
  g("newSeason(31337); pickSchool(SEASON.districts[SEASON.district - 1].ids[0])");
  const d = g("SEASON.district"), ids = g(`SEASON.districts[${d} - 1].ids`);
  // District results through week n, the better schools usually winning, then every way the rest of
  // the district schedule could go
  let wrong = 0, claims = 0, missed = 0;
  const tally = { title: 0, in: 0, out: 0 };
  for (let trial = 0; trial < 120; trial++) {
    const n = 7 + (trial % 3);
    g(`SEASON.weeks.forEach(w => w.games.forEach(gm => { gm.hs = null; gm.as = null; }))`);
    g(`(() => { const rank = id => +id.split("s")[1]; SEASON.weeks.slice(3, ${n}).forEach(w => w.games.forEach(gm => { const hw = Math.random() < 1 / (1 + Math.exp((rank(gm.h) - rank(gm.a)) * .6)); gm.hs = hw ? 21 : 14; gm.as = hw ? 14 : 21; })); })()`);
    const status = ids.map(id => g(`raceStatus("${id}", ${n})`));
    const left = g(`SEASON.weeks.slice(${n}, 10).flatMap(w => w.games.filter(gm => SEASON.schools[gm.h].district === ${d})).map(gm => [gm.h, gm.a])`);
    const outcomes = [], now = {};
    ids.forEach(id => { now[id] = g(`recordOf("${id}", ${n}).dw`); });
    for (let mask = 0; mask < 1 << left.length; mask++) {
      const wins = Object.assign({}, now);
      left.forEach(([h, a], k) => { wins[(mask >> k) & 1 ? h : a]++; });
      outcomes.push(wins);
    }
    ids.forEach((id, k) => {
      const s = status[k];
      const best = outcomes.map(w => ({ above: ids.filter(x => x !== id && w[x] > w[id]).length, level: ids.filter(x => x !== id && w[x] >= w[id]).length }));
      // Nobody can catch a school in any outcome: it has the title, and should say so
      if (best.every(b => b.level === 0) && s !== "title") missed++;
      if (!s) return;
      claims++; tally[s]++;
      // "title": nobody can catch it; "in": at most one can; "out": two or more always finish ahead
      if (s === "title" && best.some(b => b.level > 0)) wrong++;
      if (s === "in" && best.some(b => b.level > 1)) wrong++;
      if (s === "out" && best.some(b => b.above < 2)) wrong++;
    });
  }
  ok(wrong === 0, `clinching and elimination are never claimed too early (${claims} claims checked: ${JSON.stringify(tally)})`);
  ok(tally.title > 0 && tally.in > 0 && tally.out > 0, `every kind of claim came up (${JSON.stringify(tally)})`);
  ok(missed === 0, `a title that's already won is always called (${missed} missed)`);
}

// ---- The playoffs ----
{
  const { g } = fresh();
  g("newSeason(2024); pickSchool(SEASON.districts[SEASON.district - 1].ids[0]); SEASON.weeks.forEach(w => w.games.forEach(gm => quickGame(gm))); SEASON.week = 11; makeBracket();");
  const b = g("SEASON.bracket"), dist = id => g(`districtOf("${id}")`);
  ok(b.slots.length === 16 && new Set(b.slots).size === 16, "16 different schools in the bracket");
  for (let d = 1; d <= 8; d++) {
    const top = g(`standings(${d}).slice(0, 2).map(r => r.id)`);
    ok(top.every(id => b.slots.includes(id)), `district ${d}'s top two are in`);
    ok(b.place[top[0]] === 1 && b.place[top[1]] === 2, `district ${d}: a champion and a runner-up`);
    const halves = top.map(id => b.slots.indexOf(id) < 8);
    ok(halves[0] !== halves[1], `district ${d}'s two schools start in opposite halves`);
  }
  ok(b.rounds[0].length === 8 && b.rounds[0].every(gm => b.place[gm.h] === 1 && b.place[gm.a] === 2 && dist(gm.h) !== dist(gm.a)), "district champions host runners-up from another district in the first round");
  ok(g("SEASON.phase") === "playoffs", "the playoffs begin");
  // Play it out
  for (let r = 0; r < 4; r++) {
    g(`SEASON.bracket.rounds[${r}].forEach(gm => quickGame(gm)); nextRound();`);
    const rounds = g("SEASON.bracket.rounds");
    if (r < 3) {
      const nx = rounds[r + 1];
      ok(nx.length === 8 >> (r + 1), `round ${r + 2} has ${8 >> (r + 1)} games`);
      ok(nx.every((gm, k) => { const prev = rounds[r]; const ws = [g(`winnerOf(SEASON.bracket.rounds[${r}][${2 * k}])`), g(`winnerOf(SEASON.bracket.rounds[${r}][${2 * k + 1}])`)]; return ws.includes(gm.h) && ws.includes(gm.a) && prev; }), `round ${r + 2}: the winners of neighboring games meet`);
      ok(nx.every(gm => { const rh = g(`fullRecord("${gm.h}")`), ra = g(`fullRecord("${gm.a}")`); return rh.w - rh.l >= ra.w - ra.l; }), `round ${r + 2}: the better record hosts`);
    }
  }
  const fin = g("SEASON.bracket.rounds[3][0]");
  ok(fin.neutral && fin.title, "the state championship is at a neutral site, with no running clock");
  ok(g("SEASON.phase") === "over" && g("SEASON.champion") === g("winnerOf(SEASON.bracket.rounds[3][0])"), "the winner of the final is the champion");
}

// ---- Quick sims against the full engine ----
{
  const { g } = fresh();
  g("SEASON = { seed: 5, schools: {} }");
  // Expected points for equal teams, home and away, from the fit
  const set = (h, a) => g(`SEASON.schools.h = { rating: ${JSON.stringify(h)} }; SEASON.schools.a = { rating: ${JSON.stringify(a)} };`);
  set({ off: 45, def: 45, c: 42 }, { off: 45, def: 45, c: 42 });
  const [eh, ea] = g(`expectedPoints("h", "a")`);
  ok(Math.abs(eh - ea - 2) < 1e-9 && eh > 17 && eh < 25, `even teams: about 20 points each, home field worth 2 (${eh.toFixed(1)} to ${ea.toFixed(1)})`);
  const [nh, na] = g(`expectedPoints("h", "a", true)`);
  ok(Math.abs(nh - na) < 1e-9, "no home field at a neutral site");
  // The quick sim scores what the fit expects, with football scores and no ties
  const run = (h, a, n) => g(`(() => { SEASON.schools.h = { rating: ${JSON.stringify(h)} }; SEASON.schools.a = { rating: ${JSON.stringify(a)} }; const out = []; for (let i = 0; i < ${n}; i++) { const gm = gameRec("h", "a"); quickGame(gm); out.push(gm); } return out; })()`);
  const games = run({ off: 45, def: 45, c: 42 }, { off: 45, def: 45, c: 42 }, 4000);
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const reg = games.filter(gm => !gm.ot);
  ok(Math.abs(mean(reg.map(gm => gm.hs)) - eh) < 1 && Math.abs(mean(reg.map(gm => gm.as)) - ea) < 1, `quick sims average the expected points (${mean(reg.map(gm => gm.hs)).toFixed(1)}, ${mean(reg.map(gm => gm.as)).toFixed(1)})`);
  ok(games.every(gm => gm.hs !== gm.as), "no ties: overtime settles them");
  const ot = games.filter(gm => gm.ot).length / games.length;
  ok(ot > .01 && ot < .07, `a few games go to overtime (${(ot * 100).toFixed(1)}%)`);
  const homeWin = games.filter(gm => gm.hs > gm.as).length / games.length;
  ok(homeWin > .52 && homeWin < .62, `the home team wins a little more than half (${(homeWin * 100).toFixed(1)}%)`);
  ok(games.every(gm => gm.hs !== 1 && gm.as !== 1 && gm.hs >= 0), "scores look like football scores");
  const strong = run({ off: 52, def: 52, c: 42 }, { off: 40, def: 40, c: 42 }, 2000);
  const sw = strong.filter(gm => gm.hs > gm.as).length / strong.length;
  ok(sw > .85, `a much better team almost always wins (${(sw * 100).toFixed(1)}%)`);
  // The full engine, on real schools: it scores about what the fit expects from their ratings
  g("newSeason(99); pickSchool(SEASON.districts[SEASON.district - 1].ids[0])");
  const ids = g("SEASON.districts[SEASON.district - 1].ids");
  let full = 0, want = 0;
  const N = 60;
  for (let k = 0; k < N; k++) {
    // Every pairing of the seven other schools, home and away
    const i = k % 7, off = 1 + (Math.floor(k / 7) % 6), h = ids[1 + i], a = ids[1 + (i + off) % 7];
    const r = g(`(() => { const gm = gameRec("${h}", "${a}", true); simFullGame(gm); return [gm.hs + gm.as, expectedPoints("${h}", "${a}").reduce((x, y) => x + y)]; })()`);
    full += r[0]; want += r[1];
  }
  ok(Math.abs(full / N - want / N) < 7, `full-engine games score about what the quick sim expects (${(full / N).toFixed(1)} and ${(want / N).toFixed(1)} a game)`);
}

// ---- Background games leave your game alone ----
{
  const { g, F } = fresh();
  g("newSeason(8080); pickSchool(SEASON.districts[SEASON.district - 1].ids[0]); simCamp(); startMyGame();");
  for (let i = 0; i < 60; i++) g("S.teams.forEach(t => t.cpu = true); autoStep(); S.teams.forEach(t => t.cpu = t.id !== SEASON.myId);");
  const before = g("JSON.stringify(S)"), ref = g("S");
  const ids = g("SEASON.districts[SEASON.district - 1].ids");
  g(`simFullGame(gameRec("${ids[3]}", "${ids[4]}", true))`);
  ok(g("JSON.stringify(S)") === before, "a game simmed in the background doesn't touch the game you're playing");
  void ref; void F;
}

// ---- Your games ----
{
  const { g } = fresh();
  g("newSeason(1001); pickSchool(SEASON.districts[SEASON.district - 1].ids[4]);");
  ok(!g("startMyGame()") && g("finishWeek()") === 0 && g("SEASON.phase") === "preseason", "no games in camp");
  g("simCamp()");
  ok(g("SEASON.phase") === "regular" && g("SEASON.week") === 1 && g("SEASON.camp") === 0, "after camp, week 1");
  const me = g("SEASON.myId");
  ok(g("finishWeek()") === 0 && g("SEASON.week") === 1, "the week can't finish before your game is played");
  // Next-game depth chart: used by the next kickoff, then gone
  const qb = g("mySchool().depth.QB.slice()");
  g(`SEASON.depthMode = "next"; SEASON.nextDepth = { team: "${me}", depth: Object.assign(clone(mySchool().depth), { QB: ["${qb[1]}", "${qb[0]}"] }) };`);
  ok(g("startMyGame()"), "kick off your game");
  const myT = g(`S.teams.findIndex(t => t.id === "${me}")`);
  ok(g(`S.teams[${myT}].depth.QB[0]`) === qb[1] && g("SEASON.nextDepth") === null && g("SEASON.depthMode") === "always", "your next-game depth chart is used, then gone");
  ok(g(`S.teams[${myT}].cpu`) === false && g(`S.teams[${1 - myT}].cpu`) === true, "you coach your team; the computer coaches the other");
  ok(g("isMyGame()") && g("S.season.week") === 1, "the game knows it's your week 1 game");
  ok(!g("recordMyGame()"), "nothing to record until it's over");
  g("simToEnd()");
  ok(g("recordMyGame()") && !g("recordMyGame()"), "a finished game is recorded once");
  const gm = g("myGameIn(1)");
  ok(gm.hs === g("S.teams[0].score") && gm.as === g("S.teams[1].score") && gm.hs !== gm.as, "its score goes in the schedule");
  const stats = g("SEASON.stats"), ps = g("S.ps"), myIds = g(`S.teams[${myT}].players.map(p => p.id)`);
  ok(myIds.filter(id => ps[id]).every(id => stats[id] && stats[id].g === 1 && (stats[id].ry || 0) === (ps[id].ry || 0)), "your players' stats start their season totals");
  ok(!Object.keys(stats).some(id => !myIds.includes(id)), "only your players");
  ok(g("finishWeek()") === 1 && g("SEASON.week") === 2 && g("weekGames(1).every(played)"), "then the rest of week 1 is played");
  ok(Array.isArray(g("SEASON.news[1]")), "and the week's news is written");
  // Sim a game: your coach calls it
  const ps1 = g("S.ps");
  ok(g("simMyGame()") && g("played(myGameIn(2))"), "sim your game");
  const ps2 = g("S.ps");
  g("finishWeek()");
  const st2 = g("SEASON.stats"), both = myIds.filter(id => ps1[id] && ps2[id] && ps1[id].ru && ps2[id].ru);
  ok(both.length > 0 && both.every(id => st2[id].g === 2 && st2[id].ry === ps1[id].ry + ps2[id].ry && st2[id].ru === ps1[id].ru + ps2[id].ru), "season stats add up across games");
  ok(both.every(id => st2[id].rl === Math.max(ps1[id].rl, ps2[id].rl)), "the longest run is the longest of the season, not a sum");
}

// ---- A whole season, simmed ----
{
  const { g } = fresh();
  let champs = 0, mineIn = 0;
  for (const seed of [11, 22, 33]) {
    g(`newSeason(${seed}); pickSchool(SEASON.districts[SEASON.district - 1].ids[0]); simSeason();`);
    const S0 = g("SEASON");
    ok(S0.phase === "over" && S0.week === 15, `season ${seed} plays to the end`);
    ok(S0.weeks.every(w => w.games.every(gm => gm.hs != null && gm.hs !== gm.as)), "every regular-season game has a winner");
    ok(S0.bracket.rounds.map(r => r.length).join() === "8,4,2,1" && S0.bracket.rounds.every(r => r.every(gm => gm.hs !== gm.as)), "the bracket plays down to a final");
    ok(S0.bracket.slots.includes(S0.champion), "the champion came from the bracket");
    champs++;
    const W = Object.keys(S0.schools).reduce((s, id) => s + g(`recordOf("${id}").w`), 0), L = Object.keys(S0.schools).reduce((s, id) => s + g(`recordOf("${id}").l`), 0);
    ok(W === L && W === 320, `every win is someone's loss (${W} and ${L})`);
    const myGames = g("SEASON.weeks.filter(w => myGameIn(w.n)).length") + g("SEASON.bracket.rounds.filter(r => r.some(gm => gm.h === SEASON.myId || gm.a === SEASON.myId)).length");
    const most = Math.max(...Object.values(S0.stats).map(s => s.g));
    ok(most === myGames, `your most-used player played every one of your ${myGames} games (${most})`);
    if (S0.bracket.slots.includes(S0.myId)) mineIn++;
    ok(Object.keys(S0.news).length === 14, "news for every week");
    ok(S0.news[14].some(l => /state champions/.test(l)), "the last news names the champion");
    ok(S0.news[10].some(l => /District \d title/.test(l)), "week 10 news names your district's champion");
  }
  ok(champs === 3, "three seasons played");
  void mineIn;
  // Stopping at the playoffs
  g("newSeason(44); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]); simSeason(REGULAR_WEEKS + 1);");
  ok(g("SEASON.week") === 11 && g("SEASON.phase") === "playoffs" && g("SEASON.bracket.rounds.length") === 1, "sim to the playoffs stops at the first round");
}

// ---- Saving in the middle of a season ----
{
  const { g, F } = fresh();
  g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newSeason(5150); pickSchool(SEASON.districts[SEASON.district - 1].ids[2]); simSeason(4); APP.screen = "season"; startMyGame(); APP.screen = "game";`);
  for (let i = 0; i < 40; i++) g("S.teams.forEach(t => t.cpu = true); autoStep(); S.teams.forEach(t => t.cpu = t.id !== SEASON.myId);");
  g("save()");
  const before = g("JSON.stringify(SEASON)"), game = g("JSON.stringify(S)");
  g("SEASON = null; S = null; APP = null; start();");
  ok(g("JSON.stringify(SEASON)") === before && g("JSON.stringify(S)") === game, "the season and the game in progress come back after a reload");
  ok(g("APP.screen") === "game" && g("isMyGame()"), "right where you left off");
  // Finish it the way the app does
  F.act("sim"); F.act("sim");
  ok(g("S.phase") === "final" && g("played(myGameIn(4))"), "sim to the end, and the result goes in the books right away");
  F.act("weekdone");
  ok(g("SEASON.week") === 5 && g("APP.screen") === "week" && g("APP.weekView") === 4, "week results: the rest of the week is played");
  F.act("weekdone");
  ok(g("SEASON.week") === 5, "seeing the results again doesn't play another week");
  // Out of the playoffs: seeing your last game's results again doesn't play the next round
  g("simSeason(REGULAR_WEEKS + 1)");
  if (!g("inPlayoffs(SEASON.myId)")) {
    const wk = g("SEASON.week");
    F.act("weekdone");
    ok(g("SEASON.week") === wk && g("APP.weekView") === 10, "with no game this week, week results don't play the week");
  } else {
    g("simSeason(REGULAR_WEEKS + 2)");
    ok(true, "(in the playoffs this time)");
  }
  // An older save (before the season) still loads
  g(`localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, build: 2, app: { v: 1, screen: "roster", ex: APP.ex, view: { team: 0, back: "home" } }, game: null })); SEASON = null; S = null; APP = null; start();`);
  ok(g("APP.screen") === "roster" && g("APP.view.ctx") === "ex" && g("APP.view.back") === "exhibition" && g("SEASON") === null, "a save from before the season loads into the exhibition's roster");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
