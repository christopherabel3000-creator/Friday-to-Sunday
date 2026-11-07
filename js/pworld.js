// Friday to Sunday: the pro league (Milestone 5). The Sunday League's 32 made-up teams in two
// conferences of four divisions, the NFL's 17-game schedule over 18 weeks, standings with ties and
// the NFL's tiebreakers, and the 14-team playoff to the Sunday Bowl. A pro season is a SEASON with lvl
// "pro". Every team keeps its real players as short records (packPlayer), since trades and free
// agency need them, but only yours is kept in full; the rest are unpacked when you play them or
// open them, and every game but yours is a quick sim.
"use strict";

/* ---------- Names ---------- */
const PRO_LEAGUE = "the Sunday League", PRO_BOWL = "Sunday Bowl";
const PRO_CONF_IDS = ["A", "P"];
const PRO_CONF_NAMES = { A: "Atlantic Conference", P: "Pacific Conference" }, PRO_CONF_SHORT = { A: "Atlantic", P: "Pacific" };
const PRO_DIV_NAMES = ["North", "South", "East", "West"];
const PRO_CITIES = ["Port Calder", "New Halston", "Bayview", "Lakeport", "Granite City", "Fort Ashby", "Mesa Grande", "Saint Corwin", "Riverton Falls", "North Harbor",
  "Westbrook", "Elk Ridge", "Silver Bay", "Cedar Point", "Iron Hills", "Carver City", "Maple Heights", "Stonebridge", "Clearwater Bay", "Harmon", "Redcliff", "Bellport",
  "Kingsbridge", "Pine Valley", "Highmoor", "Ashford", "Coral Shores", "Marlow", "Summit City", "Thornbury", "Lowell Park", "Eastgate", "Grand Mesa", "Sunridge",
  "Brightwater", "Fairhaven", "Oakmont", "Larkspur", "Windham", "Copper City"];
// Never a real pro team's nickname
const PRO_NICKS = ["Admirals", "Barons", "Bombers", "Comets", "Condors", "Cyclones", "Dragons", "Express", "Foxes", "Generals", "Gladiators", "Grizzlies", "Hammers",
  "Hornets", "Hurricanes", "Knights", "Lancers", "Marauders", "Mavericks", "Monarchs", "Mustangs", "Nighthawks", "Outlaws", "Pioneers", "Pirates", "Racers",
  "Renegades", "Riveters", "Rockets", "Sabers", "Sentinels", "Sharks", "Stallions", "Storm", "Thunder", "Timberwolves", "Tornadoes", "Wolverines", "Wranglers", "Yetis"];

/* ---------- The calendar ---------- */
// 18 weeks of the regular season (17 games and a bye between weeks 5 and 14), then the wild-card
// round, the divisional round, the conference championships and the Sunday Bowl
const PRO_REG = 18, PRO_WC = 19, PRO_DIVR = 20, PRO_CCG = 21, PRO_FINAL = 22, PRO_LAST = 22;
const PRO_BYES = { 5: 2, 6: 4, 7: 4, 8: 4, 9: 2, 10: 4, 11: 4, 12: 4, 13: 2, 14: 2 };
const PRO_ROUND_NAMES = { 1: "Wild-card round", 2: "Divisional round", 3: "Conference championship", 4: PRO_BOWL };
const proWeekName = n => n <= PRO_REG ? `Week ${n}` : PRO_ROUND_NAMES[n - PRO_REG];

/* ---------- Pro players as short records ---------- */
// "id|first|last|age|seasons|pos|pos2|arch|ratings|eth.sta.hlt.pot.potSeen.num|contract|extra": the ratings in
// base 36, two characters each, and anything else the player carries (his contract, his college,
// career stats) as JSON at the end
const PACKED_KEYS = new Set(["id", "first", "last", "age", "exp", "pos", "pos2", "arch", "r", "eth", "sta", "hlt", "pot", "potSeen", "num", "yr", "ct"]);
// A contract in a few characters: each year's pay and the guarantee in units of $5,000, and r for a
// rookie contract, o for a fifth-year option still to decide: "200,206/150/r"
// (and the guarantee on years added by an extension, until the league year: "200/150/r/40")
const packCt = ct => ct ? `${ct.y.map(v => Math.round(v / 5000)).join(",")}/${Math.round((ct.g || 0) / 5000)}/${ct.rk ? "r" : ""}${ct.o5 ? "o" : ""}${ct.gx ? `/${Math.round(ct.gx / 5000)}` : ""}` : "";
function unpackCt(s) {
  if (!s) return null;
  const [y, g, f, gx] = s.split("/"), ct = { y: y ? y.split(",").map(v => +v * 5000) : [], g: +g * 5000, rk: f.includes("r"), o5: f.includes("o") };
  if (gx) ct.gx = +gx * 5000;
  return ct;
}
// (in-season state that doesn't need keeping on a team that isn't yours)
const UNPACKED_SKIP = new Set(["inj", "o0", "fat", "elig"]);
function packPlayer(p) {
  const extra = {};
  for (const k in p) if (!PACKED_KEYS.has(k) && !UNPACKED_SKIP.has(k) && p[k] != null) extra[k] = p[k];
  const rs = ATTRS.map(a => clamp(p.r[a] | 0, 0, 99).toString(36).padStart(2, "0")).join("");
  return [p.id, p.first, p.last, p.age || 25, p.exp || 0, p.pos, p.pos2 || "", p.arch, rs, [p.eth, p.sta, p.hlt, p.pot, p.potSeen, p.num || 0].join("."), packCt(p.ct),
    Object.keys(extra).length ? JSON.stringify(extra) : ""].join("|");
}
function unpackPlayer(str) {
  const f = str.split("|"), nums = f[9].split(".").map(Number), r = {};
  ATTRS.forEach((a, i) => { r[a] = parseInt(f[8].slice(2 * i, 2 * i + 2), 36); });
  const p = { id: f[0], first: f[1], last: f[2], age: +f[3], exp: +f[4], pos: f[5], pos2: f[6] || null, arch: f[7], r, yr: 13,
    eth: nums[0], sta: nums[1], hlt: nums[2], pot: nums[3], potSeen: nums[4], num: nums[5] };
  const ct = unpackCt(f[10]);
  if (ct) p.ct = ct;
  if (f[11]) Object.assign(p, JSON.parse(f.slice(11).join("|")));
  return p;
}
// A pro player's age when the league is made: most are 23 to 29, quarterbacks and kickers a
// little older now and then
function proAgeRoll(g, p) {
  const old = p.pos === "QB" || p.pos === "K" || p.pos === "P";
  return clamp(Math.round(g.n(old ? 27.5 : 26, old ? 3.6 : 3)), 21, old ? 38 : 34);
}

/* ---------- The league ---------- */
// A team: id ("p0" to "p31"), town (its city), mascot (its nickname), cls "PRO", conf (its division's
// id), trad, seed, coach, off, def, rating, colors, and roster: its players as short records
function genProLeague(seed, year) {
  // (made with the year's cap in place, for the contracts: pcap.js)
  return inWorld({ cap: capFor(year), world: seed, year }, () => genProTeams(seed, year));
}
function genProTeams(seed, year) {
  const g = dice(hashSeed(`${seed}:pros`)), cities = g.shuffle(PRO_CITIES), nicks = g.shuffle(PRO_NICKS), schools = {}, confs = [];
  let n = 0;
  PRO_CONF_IDS.forEach(cf => PRO_DIV_NAMES.forEach(dn => {
    const d = { id: `pd${confs.length}`, cf, name: `${PRO_CONF_SHORT[cf]} ${dn}`, cls: "PRO", ids: [] };
    confs.push(d);
    const used = new Set();
    for (let j = 0; j < 4; j++) {
      const id = `p${n}`, color = g.pick(SCHOOL_COLORS.filter(c => !used.has(c[2]))) || g.pick(SCHOOL_COLORS);
      used.add(color[2]);
      const trad = clamp(Math.round(g.n(50, 18)), 5, 95), sseed = g.seed(), sg = dice(sseed);
      const s = genSchool(sg, { id, cls: "PRO", mascot: nicks[n], town: cities[n], color, trad });
      s.players.forEach(p => { p.age = proAgeRoll(sg, p); p.exp = clamp(p.age - 22 + sg.i(-1, 1), 0, 16); });
      const sum = schoolSummary(s);
      Object.assign(sum, { seed: sseed, conf: d.id, trad0: trad, colorFam: color[2], roster: s.players.map(packPlayer), rating: schoolRating(s), year0: year });
      proLeagueContracts(sum, sg, year);
      schools[id] = sum; d.ids.push(id); n++;
    }
  }));
  return { schools, confs };
}
const proDiv = id => SEASON.confs.find(c => c.id === SEASON.schools[id].conf);
const proCf = id => proDiv(id).cf;
const proDivName = id => proDiv(id).name;
// A pro team with its players: its saved roster unpacked, and its playbook (rosterAt calls this)
function proRoster(sum) {
  const s = {};
  for (const k in sum) if (k !== "roster" && k !== "psr") s[k] = sum[k];
  s.coach = clone(sum.coach);
  s.players = (sum.roster || []).map(unpackPlayer);
  s.ps = (sum.psr || []).map(unpackPlayer);
  s.mastery = sum.mastery ? clone(sum.mastery) : genMastery(dice(hashSeed(`${sum.seed}:${sum.coach.last}:plays`)), sum.off, sum.def);
  s.depth = autoDepth(s);
  return s;
}
// Your team goes back to short records (when you leave it)
function proToPaper(s) {
  const sum = schoolSummary(s);
  sum.roster = s.players.map(packPlayer);
  sum.psr = (s.ps || []).map(packPlayer);
  delete sum.ps;
  sum.mastery = clone(s.mastery);
  sum.rating = schoolRating(s);
  return sum;
}

/* ---------- The schedule ---------- */
// The NFL's formula: 6 division games, 4 against a division in the same conference and 4 against
// one in the other (both rotating each year), 2 against the same-place teams in the conference's
// other two divisions, and a 17th against a same-place team from another division in the other
// conference. places: each team's place in its division last year.
function proOpponents(se, places) {
  const D = se.confs, y = se.year, games = [], key = new Set();
  const add = (h, a, kind) => { const k = h < a ? h + "|" + a : a + "|" + h; if (kind !== "div" && key.has(k)) return; key.add(k); games.push({ h, a, kind }); };
  const atPlace = (d, p) => D[d].ids.slice().sort((x, z) => (places[x] || 9) - (places[z] || 9) || (x < z ? -1 : 1))[p - 1];
  // Division games, home and away
  D.forEach(d => d.ids.forEach(a => d.ids.forEach(b => { if (a !== b) add(a, b, "div"); })));
  // The same-conference rotation (three years) and the other-conference rotation (four years)
  const intra = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]][y % 3];
  [0, 4].forEach(off => intra.forEach(([i, j]) => {
    const A = D[off + i].ids, B = D[off + j].ids;
    A.forEach((a, ka) => B.forEach((b, kb) => { if ((ka + kb + y) % 2) add(a, b, "conf"); else add(b, a, "conf"); }));
  }));
  for (let i = 0; i < 4; i++) {
    const A = D[i].ids, B = D[4 + (i + y) % 4].ids;
    A.forEach((a, ka) => B.forEach((b, kb) => { if ((ka + kb + y) % 2) add(a, b, "x"); else add(b, a, "x"); }));
  }
  // Same place in the conference's other two divisions
  [0, 4].forEach(off => {
    for (let i = 0; i < 4; i++) {
      const partner = intra.find(pr => pr.includes(i)), other = partner[0] === i ? partner[1] : partner[0];
      [0, 1, 2, 3].filter(j => j !== i && j !== other).forEach(j => {
        if (j < i) return;
        for (let p = 1; p <= 4; p++) { const a = atPlace(off + i, p), b = atPlace(off + j, p); if ((p + y + i) % 2) add(a, b, "conf"); else add(b, a, "conf"); }
      });
    }
  });
  // The 17th game: the same place, in the other conference's division two along from the rotation;
  // the Atlantic hosts in even years
  for (let i = 0; i < 4; i++) {
    const j = 4 + (i + y + 2) % 4;
    for (let p = 1; p <= 4; p++) { const a = atPlace(i, p), b = atPlace(j, p); if (y % 2 === 0) add(a, b, "x"); else add(b, a, "x"); }
  }
  // Every team gets 8 or 9 home games: games outside the division are flipped until it works out
  const home = {};
  games.forEach(gm => { home[gm.h] = (home[gm.h] || 0) + 1; home[gm.a] = home[gm.a] || 0; });
  for (let pass = 0; pass < 200; pass++) {
    const gm = games.find(x => x.kind !== "div" && home[x.h] > 9 && home[x.a] < 9) || games.find(x => x.kind !== "div" && home[x.h] > 8 && home[x.a] < 8);
    if (!gm) break;
    home[gm.h]--; home[gm.a]++; const t = gm.h; gm.h = gm.a; gm.a = t;
  }
  return games;
}
// The games spread over 18 weeks, each team with one bye between weeks 5 and 14. Week 18 is all
// division games, as in the NFL. Tries again with fresh dice if the weeks don't work out.
function makeProSchedule(se, g, places) {
  const games = proOpponents(se, places), ids = Object.keys(se.schools);
  for (let attempt = 0; attempt < 400; attempt++) {
    const order = g.shuffle(ids), bye = {};
    let k = 0;
    Object.keys(PRO_BYES).forEach(w => { for (let i = 0; i < PRO_BYES[w]; i++) bye[order[k++]] = +w; });
    const left = g.shuffle(games.map((gm, i) => i)), used = new Set(), weeks = [];
    // Week 18 first: two division games in every division
    const last = [];
    se.confs.forEach(d => {
      const [a, b, c, e] = g.shuffle(d.ids);
      [[a, b], [c, e]].forEach(([x, y]) => { const i = left.find(j => !used.has(j) && games[j].kind === "div" && ((games[j].h === x && games[j].a === y) || (games[j].h === y && games[j].a === x))); used.add(i); last.push(games[i]); });
    });
    let ok = true;
    for (let w = 1; w < PRO_REG && ok; w++) {
      const teams = ids.filter(id => bye[id] !== w), pick = proMatch(teams, left.filter(i => !used.has(i)).map(i => games[i]), false, g);
      if (!pick) { ok = false; break; }
      pick.forEach(gm => used.add(games.indexOf(gm)));
      weeks.push({ n: w, games: pick.map(gm => ({ h: gm.h, a: gm.a, conf: gm.kind === "div", cf: gm.kind !== "x", hs: null, as: null, ot: 0 })) });
    }
    if (!ok || used.size !== games.length) continue;
    weeks.push({ n: PRO_REG, games: last.map(gm => ({ h: gm.h, a: gm.a, conf: true, cf: true, hs: null, as: null, ot: 0 })) });
    for (let w = PRO_REG + 1; w <= PRO_LAST; w++) weeks.push({ n: w, games: [] });
    return weeks;
  }
  throw new Error("no pro schedule");
}
// A full set of games for one week, everyone in teams playing once: the team with the fewest
// choices goes first (division games first in the last week)
function proMatch(teams, avail, lastWeek, g) {
  const by = {};
  teams.forEach(t => { by[t] = []; });
  const inWeek = new Set(teams);
  avail.forEach(gm => { if (inWeek.has(gm.h) && inWeek.has(gm.a)) { by[gm.h].push(gm); by[gm.a].push(gm); } });
  const taken = new Set(), out = [];
  let steps = 0;
  function go() {
    if (++steps > 4000) return false;
    let best = null, bestN = 99;
    for (const t of teams) {
      if (taken.has(t)) continue;
      const n = by[t].filter(gm => !taken.has(gm.h) && !taken.has(gm.a)).length;
      if (n < bestN) { best = t; bestN = n; }
    }
    if (!best) return true;
    if (!bestN) return false;
    let opts = g.shuffle(by[best].filter(gm => !taken.has(gm.h) && !taken.has(gm.a)));
    if (lastWeek) opts = opts.filter(gm => gm.kind === "div").concat(opts.filter(gm => gm.kind !== "div"));
    for (const gm of opts) {
      taken.add(gm.h); taken.add(gm.a); out.push(gm);
      if (go()) return true;
      out.pop(); taken.delete(gm.h); taken.delete(gm.a);
    }
    return false;
  }
  return go() ? out : null;
}

/* ---------- Results ---------- */
// A team's record through week upTo (the regular season by default; PRO_LAST counts the playoff):
// { w, l, t, dw, dl, dt, cw, cl, ct, pf, pa }. dw...: division games, cw...: conference games.
function proRecord(id, upTo) {
  const r = { w: 0, l: 0, t: 0, dw: 0, dl: 0, dt: 0, cw: 0, cl: 0, ct: 0, pf: 0, pa: 0 }, last = upTo == null ? PRO_REG : upTo;
  SEASON.weeks.forEach(wk => {
    if (wk.n > last) return;
    wk.games.forEach(gm => {
      if (!played(gm) || !gameHas(gm, id)) return;
      const mine = gm.h === id ? gm.hs : gm.as, theirs = gm.h === id ? gm.as : gm.hs, k = mine > theirs ? "w" : mine < theirs ? "l" : "t";
      r.pf += mine; r.pa += theirs; r[k]++;
      if (gm.conf) r["d" + k]++;
      if (gm.cf) r["c" + k]++;
    });
  });
  return r;
}
const pctOf = (w, l, t) => { const n = w + l + t; return n ? (w + t / 2) / n : 0; };
const recPct = r => pctOf(r.w, r.l, r.t);
// "10-7" or "9-7-1"
const proRecText = r => `${r.w}-${r.l}${r.t ? `-${r.t}` : ""}`;
// Every regular-season game a team played through week upTo: [[opponent, points for, points against]]
function proGamesOf(id, upTo) {
  const out = [];
  SEASON.weeks.forEach(wk => { if (wk.n > upTo) return; wk.games.forEach(gm => { if (played(gm) && gameHas(gm, id)) out.push(gm.h === id ? [gm.a, gm.hs, gm.as] : [gm.h, gm.as, gm.hs]); }); });
  return out;
}
// The NFL's tiebreakers, in order: head-to-head among the tied teams, division record (when they're
// all in one division), record in common games (at least four), conference record, strength of
// victory, strength of schedule, then a coin flip. ids: the teams to order, best first.
function proOrder(ids, upTo) {
  upTo = upTo == null ? PRO_REG : Math.min(upTo, PRO_REG);
  const rec = {}, games = {};
  ids.forEach(id => { rec[id] = proRecord(id, upTo); games[id] = proGamesOf(id, upTo); });
  const allPct = {}, pctFor = id => allPct[id] != null ? allPct[id] : (allPct[id] = recPct(proRecord(id, upTo)));
  const sorted = ids.slice().sort((a, b) => recPct(rec[b]) - recPct(rec[a])), out = [];
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j < sorted.length && recPct(rec[sorted[j]]) === recPct(rec[sorted[i]])) j++;
    const group = sorted.slice(i, j);
    if (group.length > 1) {
      const gs = new Set(group), oneDiv = group.every(id => SEASON.schools[id].conf === SEASON.schools[group[0]].conf);
      const opps = group.map(id => new Set(games[id].map(x => x[0]))), common = [...opps[0]].filter(o => opps.every(s => s.has(o)));
      const key = {};
      group.forEach(id => {
        const vs = (list) => { let w = 0, l = 0, t = 0; games[id].forEach(([o, a, b]) => { if (list(o)) { if (a > b) w++; else if (a < b) l++; else t++; } }); return { w, l, t }; };
        const h = vs(o => gs.has(o)), c = vs(o => common.includes(o)), beat = games[id].filter(([, a, b]) => a > b).map(x => x[0]);
        key[id] = [h.w + h.l + h.t ? pctOf(h.w, h.l, h.t) : .5, oneDiv ? pctOf(rec[id].dw, rec[id].dl, rec[id].dt) : 0, common.length >= 4 ? pctOf(c.w, c.l, c.t) : 0,
          pctOf(rec[id].cw, rec[id].cl, rec[id].ct), beat.length ? avg(beat.map(pctFor)) : 0, games[id].length ? avg(games[id].map(x => pctFor(x[0]))) : 0, (hashSeed(SEASON.seed + id) % 1000) / 1000];
      });
      group.sort((a, b) => { for (let k = 0; k < key[a].length; k++) if (key[a][k] !== key[b][k]) return key[b][k] - key[a][k]; return 0; });
    }
    out.push(...group);
    i = j;
  }
  return out;
}
// A division's standings through week upTo: [{ id, place, w, l, t, dw, dl, dt, cw, cl, ct, pf, pa }]
function proDivStandings(did, upTo) {
  const d = SEASON.confs.find(c => c.id === did);
  return proOrder(d.ids, upTo).map((id, k) => Object.assign({ id, place: k + 1 }, proRecord(id, upTo)));
}
// A conference's seven playoff teams, seeded: the four division winners 1 to 4, then three wild cards
function proSeeds(cf, upTo) {
  const divs = SEASON.confs.filter(d => d.cf === cf), winners = divs.map(d => proDivStandings(d.id, upTo)[0].id);
  const rest = divs.flatMap(d => d.ids).filter(id => !winners.includes(id));
  return proOrder(winners, upTo).concat(proOrder(rest, upTo).slice(0, 3));
}
// The playoff picture during the season: the seven who'd be in if it ended now
const proPicture = (cf, upTo) => proSeeds(cf, upTo);

/* ---------- Quick sims ---------- */
// Fit from full-engine pro games (Nov 2026): about 26 points a team, a margin of about 2.2 points per
// point of starters, and 1.9 points of home field. Pro scoring: about 11 drives, a field goal on
// about two scores in five, and the extra point almost always good.
const QUICK_PRO = { base: 9.04, off: 1.199, def: -.989, home: 1.86, coach: .149, drives: 11, fg: .4, td: [[7, .93], [6, .04], [8, .03]] };
// A pro game on paper. Tied after four quarters: in the regular season, one 10-minute overtime that
// ends tied about one time in eight; in the playoff, someone always wins.
function proQuickGame(gm) {
  const [mh, ma] = expectedPoints(gm.h, gm.a, gm.neutral);
  let hs = quickPoints(mh, QUICK_PRO), as = quickPoints(ma, QUICK_PRO), ot = 0;
  if (hs === as) {
    ot = 1;
    if (gm.post || rand() >= .13) { const pts = rand() < .6 ? 3 : 6; if (rand() < clamp(.5 + .03 * (mh - ma), .2, .8)) hs += pts; else as += pts; }
  }
  Object.assign(gm, { hs, as, ot });
}

/* ---------- The playoff ---------- */
// SEASON.post: { A: { seeds, alive, champ }, P: {...}, rounds: [[[week, index]]], champ }. The top
// seed in each conference has a bye. Each round the best seed left hosts the worst one left. The
// Sunday Bowl is at a neutral site; the Atlantic champion is the home team in even years.
function proPostseason() {
  if (SEASON.post) return;
  const P = SEASON.post = { rounds: [], champ: null };
  PRO_CONF_IDS.forEach(cf => { const seeds = proSeeds(cf, PRO_REG); P[cf] = { seeds, alive: seeds.slice(), champ: null }; });
  proRound(1);
}
function proRound(round) {
  const P = SEASON.post, w = PRO_REG + round, wk = SEASON.weeks[w - 1], made = [];
  const push = gm => { wk.games.push(Object.assign({ conf: false, cf: false, round, hs: null, as: null, ot: 0 }, gm)); made.push([w, wk.games.length - 1]); };
  if (round <= 3) PRO_CONF_IDS.forEach(cf => {
    const B = P[cf], seedOf = id => B.seeds.indexOf(id), left = B.alive.slice().sort((a, b) => seedOf(a) - seedOf(b));
    const playing = round === 1 ? left.slice(1) : left;
    for (let k = 0; k < playing.length / 2; k++) push({ h: playing[k], a: playing[playing.length - 1 - k], post: cf, title: false });
  });
  else {
    const a = P.A.champ, p = P.P.champ, atlHome = SEASON.year % 2 === 0;
    push({ h: atlHome ? a : p, a: atlHome ? p : a, post: "SB", neutral: true, title: true });
  }
  P.rounds.push(made);
}
// After a playoff week: the losers go home, and the next round is set (or the champion crowned)
function proAdvance() {
  const P = SEASON.post;
  if (!P || P.champ) return;
  const games = P.rounds[P.rounds.length - 1].map(([w, i]) => SEASON.weeks[w - 1].games[i]);
  if (!games.every(played)) return;
  games.forEach(gm => { if (gm.post !== "SB") { const B = P[gm.post]; B.alive = B.alive.filter(id => id !== loserOf(gm)); if (B.alive.length === 1) B.champ = B.alive[0]; } else P.champ = winnerOf(gm); });
  if (P.champ) { SEASON.champion = P.champ; return; }
  proRound(P.rounds.length + 1);
}
// "Atlantic wild-card round", "Pacific Conference championship", "Sunday Bowl"
function proPostName(gm) {
  if (!gm.post) return "";
  if (gm.post === "SB") return PRO_BOWL;
  return gm.round === 3 ? `${PRO_CONF_NAMES[gm.post]} championship` : `${PRO_CONF_SHORT[gm.post]} ${PRO_ROUND_NAMES[gm.round].toLowerCase()}`;
}

/* ---------- Weeks ---------- */
function proPlayWeek(n) {
  SEASON.weeks[n - 1].games.forEach(gm => { if (!played(gm) && !gameHas(gm, SEASON.myId)) proQuickGame(gm); });
}
function proAfterWeek(n) {
  if (n === PRO_REG) proPostseason();
  else if (n > PRO_REG) proAdvance();
  if (SEASON.post && SEASON.post.champ) SEASON.phase = "over";
  else if (n >= PRO_REG) SEASON.phase = "playoffs";
}
// The whole season on paper (while you aren't coaching in the pros, or for a test)
function proSeasonOnPaper() {
  if (SEASON.phase === "preseason" || SEASON.phase === "pick") { SEASON.phase = "regular"; SEASON.camp = 0; }
  for (let guard = 0; guard < PRO_LAST + 2 && SEASON.phase !== "over"; guard++) {
    const n = SEASON.week;
    proPlayWeek(n); proAfterWeek(n);
    SEASON.week = n + 1;
  }
  return { champ: SEASON.post.champ };
}

/* ---------- A pro season ---------- */
// places: every team's place in its division last year (for the schedule), by its talent in the
// first year
function proPlacesFrom(se, prev) {
  const out = {};
  se.confs.forEach(d => {
    const order = prev ? inWorld(prev, () => proOrder(d.ids, PRO_REG)) : d.ids.slice().sort((a, b) => (se.schools[b].rating.off + se.schools[b].rating.def) - (se.schools[a].rating.off + se.schools[a].rating.def));
    order.forEach((id, k) => { out[id] = k + 1; });
  });
  return out;
}
function newProSeason(seed, year, prev) {
  const w = prev ? { schools: prev.schools, confs: prev.confs } : genProLeague(seed, year), g = dice(hashSeed(`${seed}:${year}:prosched`));
  const se = { v: 1, lvl: "pro", seed: hashSeed(`${seed}:${year}:pro`), world: seed, year, year0: prev ? prev.year0 : year, myId: prev ? prev.myId : null,
    schools: w.schools, confs: w.confs, weeks: null, week: 1, phase: "regular", camp: 0, pre: PRESEASON_WEEKS, post: null, champion: null,
    rot: "normal", depthMode: "always", nextDepth: null, stats: {}, news: {}, plan: prev ? prev.plan : newPlan(), practice: null, cpuWeek: -PRESEASON_WEEKS, film: null, injLog: {},
    history: prev ? prev.history : [], summer: newSummer(), halls: null, cls: null,
    district: 1, districts: [{ n: 1, ids: prev && prev.myId ? [prev.myId] : [] }] };
  se.cap = prev ? (prev.capYear === year ? prev.cap : capFor(year, prev.cap, g)) : capFor(year);
  se.places = proPlacesFrom(se, prev);
  se.weeks = makeProSchedule(se, g, se.places);
  nameWorld(se);
  inWorld(se, proSetExpectations);
  // Next spring's draft class, scouted all season (pdraft.js)
  se.formers = prev ? prev.formers : [];
  // Traded picks (ptrade.js), but none from a draft that's been held
  if (prev && prev.pickOwner) { se.pickOwner = {}; for (const k in prev.pickOwner) if (+k.split(":")[0] > year) se.pickOwner[k] = prev.pickOwner[k]; }
  se.draft = inWorld(se, () => newProDraft(year + 1));
  return se;
}

/* ---------- Expectations in the pros ---------- */
// The regular season played on paper 60 times from the opening ratings: expected wins, the chance of
// a division title and of a playoff spot (the top seven in the conference by wins). Expected playoff
// wins are a third of the playoff chance.
const PRO_EXPECT_SIMS = 60;
function proSetExpectations() {
  const ids = Object.keys(SEASON.schools), at = {}, N = ids.length;
  ids.forEach((id, i) => { at[id] = i; });
  const games = [];
  SEASON.weeks.slice(0, PRO_REG).forEach(w => w.games.forEach(gm => { const [a, b] = expectedPoints(gm.h, gm.a, gm.neutral); games.push([at[gm.h], at[gm.a], winProb(a - b)]); }));
  const sum = { w: new Float64Array(N), dt: new Float64Array(N), po: new Float64Array(N) }, rng = seededRandom(hashSeed(`${SEASON.seed}:expect`));
  const cfIds = PRO_CONF_IDS.map(cf => ids.filter(id => proCf(id) === cf).map(id => at[id]));
  for (let k = 0; k < PRO_EXPECT_SIMS; k++) {
    const w = new Int8Array(N), key = Float64Array.from({ length: N }, () => rng());
    games.forEach(([h, a, p]) => { w[rng() < p ? h : a]++; });
    SEASON.confs.forEach(d => { const best = d.ids.map(id => at[id]).sort((x, y) => w[y] - w[x] || key[y] - key[x])[0]; sum.dt[best]++; });
    cfIds.forEach(list => list.slice().sort((x, y) => w[y] - w[x] || key[y] - key[x]).slice(0, 7).forEach(i => { sum.po[i]++; }));
    for (let i = 0; i < N; i++) sum.w[i] += w[i];
  }
  const r2 = v => Math.round(v / PRO_EXPECT_SIMS * 100) / 100;
  SEASON.exp = {};
  ids.forEach((id, i) => { const po = r2(sum.po[i]); SEASON.exp[id] = { w: r2(sum.w[i]), dt: r2(sum.dt[i]), po, pw: Math.round(po / 3 * 100) / 100, ch: 0 }; });
  return SEASON.exp;
}
// "about 10-7 and a playoff spot"
function proExpectWords(e) {
  const w = clamp(Math.round(e.w), 0, PRO_GAMES), rec = `about ${w}-${PRO_GAMES - w}`;
  const more = e.dt >= .45 ? "the division title" : e.po >= .55 ? "a playoff spot" : e.po >= .3 ? "a shot at the playoff" : "";
  return more ? `${rec} and ${more}` : rec;
}
const PRO_GAMES = 17;
// A team's season: playoff wins, whether it made the playoff, won its division or the Sunday Bowl
function proResultsOf(id) {
  const r = proRecord(id, PRO_LAST), P = SEASON.post;
  let pw = 0;
  if (P) P.rounds.forEach(rd => rd.forEach(([w, i]) => { const gm = SEASON.weeks[w - 1].games[i]; if (played(gm) && winnerOf(gm) === id) pw++; }));
  const reg = proRecord(id, PRO_REG), dt = proDivStandings(SEASON.schools[id].conf, PRO_REG)[0].id === id ? 1 : 0;
  return { w: r.w, l: r.l, t: r.t, rw: reg.w + reg.t / 2, rl: reg.l + reg.t / 2, pf: reg.pf, pa: reg.pa, pw, po: P && P[proCf(id)].seeds.includes(id) ? 1 : 0, dt, ch: P && P.champ === id ? 1 : 0 };
}
// Every team's season when it's over, graded
function proFinishState() {
  if (SEASON.results) return SEASON.results;
  const res = {};
  Object.keys(SEASON.schools).forEach(id => { res[id] = proResultsOf(id); });
  SEASON.results = gradeState(res);
  SEASON.champs = { PRO: SEASON.post && SEASON.post.champ };
  return res;
}
// "Won the Sunday Bowl", "Lost in the Atlantic divisional round", "Missed the playoff"
function proFinishText(id) {
  const P = SEASON.post;
  if (!P) return SEASON.week > 1 ? "Season in progress" : "Season ahead";
  if (P.champ === id) return `Won the ${PRO_BOWL}`;
  let lost = null;
  P.rounds.forEach(rd => rd.forEach(([w, i]) => { const gm = SEASON.weeks[w - 1].games[i]; if (played(gm) && gameHas(gm, id) && loserOf(gm) === id) lost = gm; }));
  if (lost) return lost.post === "SB" ? `Lost the ${PRO_BOWL}` : `Lost in the ${proPostName(lost)}`;
  if (P[proCf(id)].seeds.includes(id)) return P.champ ? "Out of the playoff" : "Still in the playoff";
  return "Missed the playoff";
}

/* ---------- Your pro season, week by week ---------- */
function proFinishWeek() {
  const n = SEASON.week, gm = myGameIn(n);
  if (!["regular", "playoffs"].includes(SEASON.phase) || (gm && !played(gm))) return 0;
  cpuPractice(n);
  proPlayWeek(n);
  endOfWeek();
  SEASON.week = n + 1;
  proAfterWeek(n);
  proPostXP(n);
  proNews(n);
  tradeWeek(SEASON, n);
  // Your staff scouts the draft class (pdraft.js); the combine comes after the season
  if (SEASON.draft) { scoutWeek(); if (CAREER && CAREER.job && CAREER.job.lvl === "pro" && (!CAREER.job.ctl || CAREER.job.staff.board)) staffBoard(SEASON.draft, myNeeds()); }
  if (SEASON.phase === "over") { seasonEndXP(n); if (SEASON.draft) combine(SEASON.draft); }
  return n;
}
// XP when the regular season ends: a playoff spot, and the division title
function proPostXP(n) {
  const me = SEASON.myId;
  if (!me || n !== PRO_REG || !SEASON.post) return;
  if (SEASON.post[proCf(me)].seeds.includes(me)) giveXP(XP.playoffs, "playoffs", n);
  if (proDivStandings(SEASON.schools[me].conf, PRO_REG)[0].id === me) giveXP(XP.district, "district", n);
}
// A few lines after each week: big upsets, your division's leader, unbeaten teams, the playoff field
// and the champions. At most five, the most important first.
function proNews(n) {
  const me = SEASON.myId, lines = [], my = me ? SEASON.schools[me] : null;
  SEASON.weeks[n - 1].games.forEach(gm => {
    if (!played(gm) || gameHas(gm, me)) return;
    const sc = `${Math.max(gm.hs, gm.as)}-${Math.min(gm.hs, gm.as)}`;
    if (gm.hs === gm.as) { lines.push({ p: 2, t: `The ${nameOf(gm.h)} and the ${nameOf(gm.a)} played to a ${gm.hs}-${gm.as} tie.` }); return; }
    const w = winnerOf(gm), l = loserOf(gm), [eh, ea] = expectedPoints(gm.h, gm.a, gm.neutral), fav = w === gm.h ? ea - eh : eh - ea;
    if (gm.title) lines.push({ p: 10, t: `The ${nameOf(w)} won the ${PRO_BOWL}, ${sc} over the ${nameOf(l)}.` });
    else if (gm.post && gm.round === 3) lines.push({ p: 8, t: `The ${nameOf(w)} won the ${PRO_CONF_NAMES[gm.post]} championship.` });
    else if (fav >= 7) lines.push({ p: gm.post ? 6 : 3, t: `Upset: the ${nameOf(w)} beat the ${nameOf(l)}, ${sc}.` });
  });
  if (my && n <= PRO_REG && n >= 4) {
    const st = proDivStandings(my.conf, n), lead = st[0];
    lines.push({ p: 4, t: lead.id === me ? `You lead the ${proDivName(me)} at ${proRecText(lead)}.` : `The ${nameOf(lead.id)} lead the ${proDivName(me)} at ${proRecText(lead)}.` });
  }
  if (n < PRO_REG) Object.keys(SEASON.schools).forEach(id => { const r = proRecord(id, n); if (id !== me && !r.l && !r.t && r.w >= 6) lines.push({ p: 1, t: `The ${nameOf(id)} are still unbeaten at ${proRecText(r)}.` }); });
  if (n === PRO_REG && SEASON.post && my) {
    const seed = SEASON.post[proCf(me)].seeds.indexOf(me) + 1;
    lines.push({ p: 9, t: seed ? `You're in the playoff as the No. ${seed} seed in the ${PRO_CONF_NAMES[proCf(me)]}${seed === 1 ? ", with a bye" : ""}.` : "Your season is over: you missed the playoff." });
  }
  SEASON.news[n] = lines.sort((a, b) => b.p - a.p).slice(0, 5).map(x => x.t);
}
const proGameText = gm => { const k = proPostName(gm); return k ? `${k}: ` : gm.conf ? "Division game: " : ""; };

/* ---------- Taking over a team ---------- */
// You take over a pro team: its players come in full, with your coach and your schemes, and camp
// opens (the job market brings you here; tests call it directly)
function proTakeOver(id) {
  const sum = SEASON.schools[id], s = proRoster(sum), c = CAREER.coach;
  SEASON.schools[id] = s;
  s.coach = c;
  if (c.off_style && c.def_style) { s.off = c.off_style; s.def = c.def_style; }
  s.players.forEach(p => { p.o0 = ovr(p, p.pos); });
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  Object.assign(SEASON, { myId: id, districts: [{ n: 1, ids: [id] }], district: 1, phase: "preseason", camp: 1 });
  if (SEASON.draft && !SEASON.draft.board.length) staffBoard(SEASON.draft, teamNeeds(s));
  return s;
}

/* ---------- The next pro season ---------- */
// Every team's year ends: tradition moves with its season, then a new schedule from this year's
// places. (Players' ages, contracts and the draft come with later steps of Milestone 5.)
function proNextSeason() {
  const old = SEASON, me = old.myId;
  if (!old.results) proFinishState();
  for (const id in old.schools) {
    const s = old.schools[id], r = old.results[id];
    if (s.trad0 == null) s.trad0 = s.trad;
    s.trad = newTradition(s, r.w, r.l, r.pw, !!r.ch);
  }
  // The rest of the offseason, whatever you've left of it (pfa.js): re-signing, the new league year
  // and free agency, then the draft (pdraft.js), by the computer GMs, your staff or your GM
  proOffseasonAuto(old);
  const D = old.draft || inWorld(old, () => newProDraft(old.year + 1));
  inWorld(old, () => { draftAddFormers(D); combine(D); runDraft(old, D, false); });
  const order = proDraftOrder(old);
  old.drafted = inWorld(old, () => formersDrafted(D, old));
  // Every team a year older, with its rookies (pcap.js); the cap is already the new year's
  let mine = null;
  inWorld(old, () => {
    const drafted = draftedBy(D), udfa = undrafted(D, order.slice().reverse()), rookies = {};
    order.forEach(id => { rookies[id] = (drafted[id] || []).concat(udfa[id] || []); });
    for (const id in old.schools) {
      const sum = old.schools[id], full = isFull(sum), s = full ? sum : proRoster(sum), rng = seededRandom(hashSeed(`${old.world}:${old.year}:${id}:year`));
      const rep = proTeamAge(s, old.year + 1, rng, full, rookies[id]);
      rep.freed = getUnderCap(s);
      // Your team's offseason program: four weeks with your practice plan, like college spring practice
      if (full) { s.depth = autoDepth(s); rep.spring = springPractice(s, old.plan, old.year + 1); mine = rep; s.depth = autoDepth(s); s.rating = schoolRating(s); continue; }
      // A team on paper holds its cutdown right away
      cutdown(s);
      getUnderCap(s);
      old.schools[id] = Object.assign(proToPaper(s), { dead: s.dead, carry: s.carry });
    }
  });
  const champ = old.post && old.post.champ;
  const history = (old.history || []).concat(champ ? [{ year: old.year, cls: "PRO", id: champ, name: nameOf(champ) }] : []);
  const se = newProSeason(old.world, old.year + 1, Object.assign({}, old, { history }));
  se.myId = me;
  if (me) { se.districts = [{ n: 1, ids: [me] }]; se.phase = "preseason"; se.camp = 1; se.plan = old.plan; se.rot = old.rot; }
  // Ratings for the new season, from the rosters
  for (const id in se.schools) { const s = se.schools[id]; if (isFull(s)) s.rating = schoolRating(s); }
  SEASON = se;
  REBUILT.clear();
  proSetExpectations();
  if (me && se.draft) inWorld(se, () => staffBoard(se.draft, teamNeeds(se.schools[me])));
  if (me && mine) {
    const who = p => ({ name: fullName(p), pos: p.pos, ovr: ovr(p, p.pos), age: p.age, stats: careerStatLine(p.cs) });
    const best = list => list.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
    const O = old.off.mine, s = se.schools[me], keptP = O.kept.map(id => playerById(s, id)).filter(Boolean);
    se.yearReport = { pro: true, from: old.year, grads: O.retired, left: O.left.concat(best(mine.freed).map(who)), kept: best(keptP).map(p => Object.assign(who(p), { ct: proContractText(p) })), signed: O.signed,
      fresh: mine.rookies.map(p => p.id), joined: [], grew: mine.grew.slice(0, 10), went: 0, offers: [], drafted: old.drafted || [],
      spring: mine.spring ? { mastery: mine.spring.mastery.slice(0, 8), n: Object.keys(mine.spring.grew).length } : null };
  }
  return se;
}
// The pro league moves on a year on paper while you coach elsewhere
function proWorldNextYear() {
  const W = proWorld();
  if (!W || W === SEASON) return;
  const next = inWorld(W, () => { if (W.phase !== "over") proSeasonOnPaper(); proNextSeason(); return SEASON; });
  next.phase = "regular"; next.camp = 0; next.cpuWeek = 0;
  setWorld(W, next);
  // Your former players in the draft go in your new year's report
  if (W.drafted && W.drafted.length && SEASON.yearReport) SEASON.yearReport.drafted = W.drafted;
}

/* ---------- The pro job ---------- */
// The pros have their own reputation, 0 to 100, with the same words. A coach who arrives from college
// starts at 20, plus a little for a college legend. The pros are the biggest stage.
const PREP_START = 20;
const startPrep = colRep => Math.round((PREP_START + Math.max(0, (colRep || 0) - 80) / 2) * 10) / 10;
STAGE.PRO = 2.4;
REP_BAR.PRO = 15;
// Head coaching contracts in real dollars (2026): about $4 million to $20 million a year, more at a
// proud team and for a bigger reputation. Five years, and a fired coach is paid all of what's left.
const PRO_PAY = [4000000, 20000000], PRO_YEARS = 5, PRO_BUYOUT = 1;
function proSalary(s, prep) {
  const [lo, hi] = PRO_PAY, k = clamp(.4 * ((s.trad || 50) - 20) / 75 + .6 * (prep || 0) / 100, 0, 1);
  return Math.round((lo + (hi - lo) * k) / 50000) * 50000;
}
// Moving to another pro team: yours goes back to short records and the new one comes in full
function proMoveWithin(id) {
  const M = SEASON.market, R = SEASON.review, old = SEASON.myId, from = SEASON.schools[old], c = CAREER.coach;
  if (!R.why[old]) { R.open.push(old); R.why[old] = "left"; }
  const sum = proToPaper(from); sum.coach = outsideCoach(from); sum.off = sum.coach.off_style; sum.def = sum.coach.def_style;
  SEASON.schools[old] = sum;
  proTakeOver(id);
  SEASON.phase = "offseason"; SEASON.camp = 0;
  void c;
  startProJob(id, M.ctl);
  Object.assign(M, { took: id, from: old, offer: null, done: true, stage: "done", transfers: [] });
  REBUILT.clear();
  fillJobs(); otherWorldFill();
}

/* ---------- Owners and general managers ---------- */
// Every team has an owner (his patience: 0.6 to 1.4, how hard he takes a bad season) and a general
// manager (a rating, how well he scouts and builds, and a philosophy: building through the draft, or
// buying in free agency). Both are made up and kept from year to year.
const GM_PHIL = { draft: "builds through the draft", fa: "buys in free agency", bal: "builds through the draft and free agency both" };
function proOwner(s) {
  if (!s.owner) { const g = dice(hashSeed(`${s.seed}:owner`)); s.owner = { first: g.pick(COACH_FIRST), last: g.pick(LAST_NAMES), pat: Math.round(clamp(g.n(1, .2), .6, 1.4) * 100) / 100 }; }
  return s.owner;
}
function newGM(g) {
  return { first: g.pick(COACH_FIRST), last: g.pick(LAST_NAMES), rt: clamp(Math.round(g.n(60, 12)), 30, 92), ph: g.pick(["draft", "draft", "fa", "bal", "bal"]), ten: g.i(0, 8) };
}
function proGM(s) {
  if (!s.gm) s.gm = newGM(dice(hashSeed(`${s.seed}:gm`)));
  return s.gm;
}
// How patient a team's boss is, on the tradition scale the job security reads (50 is average): a pro
// team's owner, or a school's tradition
const patienceOf = s => isPro(s.cls) ? 50 + (proOwner(s).pat - 1) * 100 : s.trad;
const ownerWord = pat => pat >= 1.15 ? "who takes losing hard" : pat <= .85 ? "a patient one" : "who wants results";
const gmWord = r => r >= 80 ? "one of the league's best" : r >= 65 ? "a good one" : r >= 50 ? "an average one" : "one of the league's weaker ones";

/* ---------- The way in, and pro offers ---------- */
// Pro jobs come to a power-conference head coach with a college reputation of 75 or more, the best
// openings wanting a little more
const COL_TO_PRO = 75;
// Whether an offer comes with control of the roster: more likely the bigger your pro reputation, the
// worse the team was last season and the more the owner wants you. A first-time pro coach rarely
// gets it. (Rolled once a season for each job, so it never changes.)
function offerHasControl(id) {
  const W = jobWorld(id) || SEASON, s = W.schools[id], r = W.results && W.results[id], rep = inPros() ? (CAREER.prep || 0) : 0;
  const bad = r ? clamp((8 - (r.rw || 0)) / 16, 0, .5) : .2, want = clamp((jobRepFor(s) - jobBarFor(s)) / 60, 0, .3);
  const first = !(CAREER.seasons || []).some(x => x.lvl === "pro");
  const p = clamp((first ? .03 : -.15 + rep / 100 * .8) + bad * (first ? .2 : .6) + want, .02, .9);
  return seededRandom(hashSeed(`${W.seed}:${id}:control`))() < p;
}
// One pro job, in a few sentences
function proJobText(id) {
  const s = jobSchool(id), o = proOwner(s), gm = proGM(s), M = SEASON.market, offer = M && M.offer === id;
  const rep = inPros() ? CAREER.prep || 0 : startPrep(CAREER.crep);
  return `${lastSeasonText(id)} ${talentText(s.rating)} ${capFirst(tradWord(s.trad))} (tradition ${Math.round(s.trad)}). Salary about ${bigMoney(proSalary(s, rep))} a year, for ${plural(PRO_YEARS, "year")}. Owner ${o.first} ${o.last}, ${ownerWord(o.pat)}. General manager ${gm.first} ${gm.last}, ${gmWord(gm.rt)}, ${GM_PHIL[gm.ph]}.${offer ? M.ctl ? " This offer comes with control of the roster." : " The GM keeps control of the roster." : ""} ${whyOpen(id)}`.replace(/\s+/g, " ").replace(/\.\./g, ".").trim();
}
// A closer look at a pro job: the roster under contract next season, by position, and the cap
function proJobLook(id, M, canPursue, isOffer, interest) {
  const sum = SEASON.schools[id], s = seasonSchool(id), c = CAREER.coach;
  const back = s.players.filter(p => ctYears(p) > 1), k = coreKnown(s, c.off_style, c.def_style);
  const groups = {};
  back.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).forEach(p => { const gname = POS_INFO[p.pos].group; (groups[gname] = groups[gname] || []).push(p); });
  const order = OFF_POS.concat(DEF_POS, ["K", "P"]).map(pos => POS_INFO[pos].group).filter((x, i, a) => a.indexOf(x) === i && groups[x]);
  return `
    <div class="masthead" style="--team:${sum.color}">
      <p class="eyebrow">A closer look · ${esc(jobPlace(id))}${interest ? ` · ${interest} interest` : ""}</p>
      <h2 data-focus tabindex="-1">${esc(jobName(id))}</h2>
      <p class="muted">${esc(jobText(id))}</p>
    </div>
    <section class="panel"><h3>The playbook</h3><p>${esc(`The last coach ran the ${schemeText(sum)}. The team knows ${k.off} of your 4 core plays on offense and ${k.def} of 4 on defense well.`)}</p></section>
    <section class="panel"><h3>The money</h3><p>${esc(`${bigMoney(capUsed(s))} committed against this year's cap of ${bigMoney(capNow())}, and ${bigMoney(capNext(s))} already for next year.`)}</p></section>
    <section class="panel"><h3>Under contract next season</h3>
      <p>${esc(`${plural(back.length, "player")} signed past this season. The rest have contracts ending, and rookies and free agents come in before camp.`)}</p>
      ${order.map(gname => `<p class="sechead" role="heading" aria-level="4">${esc(gname)}</p><ul class="hlist">${groups[gname].map(p => `<li>${esc(`${playerLine(p, s.level)} ${bigMoney(capHit(p))}.`)}</li>`).join("")}</ul>`).join("")}
    </section>
    ${canPursue ? `<button class="btn" data-a="pursue" data-v="${id}">Pursue the ${esc(sum.mascot)} job</button>` : isOffer ? `<button class="btn" data-a="accept">Take the job</button>` : ""}
    <button class="btn ghost" data-a="back">Back to the job market</button>`;
}
// One of the best power-conference coaches moves up to a pro job (never you): about half the time,
// the best one with a college reputation of 75 or more. His college program gets a new coach.
function colCoachUp(job) {
  const C = colWorld();
  if (!C || seededRandom(hashSeed(`${SEASON.seed}:${job.id}:colup`))() >= .5) return null;
  const best = Object.values(C.schools).filter(x => x.cls === "P4" && x.coach && !isYou(x.coach) && x.id !== C.myId && (x.coach.rep || 0) >= COL_TO_PRO && !x.coach.movedUp).sort((a, b) => b.coach.rep - a.coach.rep)[0];
  if (!best) return null;
  const c = clone(best.coach);
  Object.assign(c, { rep: startPrep(c.rep), job: newJob() });
  best.coach.movedUp = true;
  const from = schoolName(best);
  best.coach = inWorld(C, () => outsideCoach(best));
  applyCoach(best);
  return { coach: c, from };
}

/* ---------- Your pro job, year by year ---------- */
// Your requests to the GM: up to three needs by position, up to three players to keep and three to
// let go, and one player to go after. job.gms: your standing with him, 0 to 100, starting at 50.
// The higher it is, the more he follows: about a quarter of the time at 20, nearly always at 90.
const GM_REQ_MAX = 3;
const newReq = () => ({ needs: [], keep: [], go: [], want: null });
const gmFollowOdds = st => clamp(.25 + (st - 20) * .0107, .1, .99);
function myReq() { const J = CAREER.job; if (!J.req) J.req = newReq(); if (J.gms == null) J.gms = 50; return J.req; }
// Does the GM go along with one request? With control of the roster, your word is final.
function gmFollows(key) {
  const J = CAREER.job;
  if (J.ctl) return true;
  myReq();
  return seededRandom(hashSeed(`${SEASON.seed}:${key}:gm`))() < gmFollowOdds(J.gms);
}
const standingWord = st => st >= 80 ? "He trusts you completely." : st >= 60 ? "He listens to you." : st >= 40 ? "He hears you out." : st >= 20 ? "He mostly goes his own way." : "He barely listens.";
function startProJob(id, ctl) {
  const s = SEASON.schools[id];
  CAREER.job = Object.assign(newJob(), { id, lvl: "pro", pay: proSalary(s, CAREER.prep || 0), yrs: PRO_YEARS, ctl: !!ctl, req: newReq(), gms: 50,
    staff: { cut: true, board: true, late: true, udfa: true, trades: false } });
  return CAREER.job;
}
// After each pro season: your standing with the GM moves with your grade (and a little more when he
// followed your requests and you won); an extension may come with control of the roster; and an
// owner who's losing patience may fire the GM instead of you.
function proJobYear(J, R, g, s) {
  const gm = proGM(s), ownerMad = J.sec < 45 && !R.fired;
  if (!J.ctl) {
    const followed = (J.log || []).filter(x => x.yes).length;
    J.gms = clamp(Math.round(((J.gms == null ? 50 : J.gms) + clamp(5 * g, -15, 15) + (g > 0 && followed ? 3 : 0)) * 10) / 10, 0, 100);
  }
  J.log = [];
  gm.ten = (gm.ten || 0) + 1;
  if (R.renewed && !J.ctl && seededRandom(hashSeed(`${SEASON.seed}:extension:control`))() < clamp(-.1 + (CAREER.prep || 0) / 100 * .9, .05, .85)) { J.ctl = true; R.ctlNow = true; }
  if (!J.ctl && ownerMad && gm.ten >= 3 && seededRandom(hashSeed(`${SEASON.seed}:gmfire`))() < .4) {
    R.gmFired = `${gm.first} ${gm.last}`;
    s.gm = newGM(dice(hashSeed(`${SEASON.seed}:${s.id}:newgm`))); s.gm.ten = 0;
    J.gms = 50; J.sec = Math.min(100, J.sec + 15);
  }
}
// The GM on the owner's review
function gmReviewPanel() {
  const R = SEASON.review, J = CAREER.job, s = mySchool(), gm = proGM(s);
  if (!J || J.lvl !== "pro") return "";
  const lines = [];
  if (R.ctlNow) lines.push("Your new contract gives you control of the roster: the draft, free agency, trades and cuts are yours now.");
  if (R.gmFired) lines.push(`The owner fired general manager ${R.gmFired}. The new GM is ${gm.first} ${gm.last}, ${gmWord(gm.rt)}, who ${GM_PHIL[gm.ph]}.`);
  if (!J.ctl) lines.push(`General manager ${gm.first} ${gm.last}. ${standingWord(J.gms)} (Your standing with him: ${Math.round(J.gms)}.)`);
  return lines.length ? `<section class="panel"><h3>The front office</h3>${lines.map(t => `<p>${esc(t)}</p>`).join("")}</section>` : "";
}

// Your needs for the draft and free agency: the ones you named for the GM, or the roster's own
const myNeeds = () => { const R = CAREER && CAREER.job && CAREER.job.req; return R && R.needs.length ? R.needs : SEASON.myId ? teamNeeds(mySchool()) : []; };
