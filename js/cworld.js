// Friday to Sunday: the college world (Milestone 4). About 670 made-up programs in five levels, their
// conferences, the schedule, standings, the top 25, conference title games, bowls and the playoffs.
// A college season is a SEASON with lvl "col": your program keeps its full roster, every other one is
// a summary (ratings, coach, classes and seed) rebuilt only when you play it or open it, and every game
// but yours is a quick sim.
"use strict";

/* ---------- The levels ---------- */
// Sized like real college football in 2026. Conference sizes add up to each level's programs; the
// power conferences have one independent and the rest of FBS two.
const COL_LEVELS = {
  P4: { name: "Power conferences", short: "power conference", div: "FBS", confs: [18, 17, 16, 16], indep: 1, tier: 1, title: true },
  G5: { name: "The rest of FBS", short: "FBS", div: "FBS", confs: [14, 13, 12, 11, 9, 7], indep: 2, tier: 2, title: true },
  FCS: { name: "FCS", short: "FCS", div: "FCS", confs: [12, 11, 11, 10, 10, 10, 10, 10, 9, 9, 9, 9, 8], indep: 0, tier: 2, title: false },
  D2: { name: "Division II", short: "Division II", div: "D2", confs: [14, 13, 13, 12, 12, 12, 12, 12, 11, 11, 11, 11, 10, 10], indep: 0, tier: 3, title: false },
  D3: { name: "Division III", short: "Division III", div: "D3", confs: [11, 11, 11, 11, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 9, 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8], indep: 0, tier: 3, title: false }
};
const COL_ORDER = ["P4", "G5", "FCS", "D2", "D3"];
// The divisions that crown a champion: FBS (the power conferences and the rest), the FCS, Division II
// and Division III, each with its own playoff
const DIVS = { FBS: { name: "FBS", field: 12, levels: ["P4", "G5"] }, FCS: { name: "FCS", field: 24, levels: ["FCS"] }, D2: { name: "Division II", field: 28, levels: ["D2"] }, D3: { name: "Division III", field: 32, levels: ["D3"] } };
const DIV_IDS = ["FBS", "FCS", "D2", "D3"];
const divOf = s => COL_LEVELS[s.cls].div;
// Starters rate about this much above a program's level (measured from generated rosters)
const COL_BON = { o: 12, d: 11 };

/* ---------- Names ---------- */
// Made-up names that sound real, never a real school's: state schools, directional schools, A&M and
// Tech schools, and small private colleges
const COL_FORMS = {
  P4: [t => `${t} State`, t => `University of ${t}`, t => `${t} A&M`, t => `${t} Tech`],
  G5: [t => `${t} State`, t => `Central ${t}`, t => `Western ${t}`, t => `Eastern ${t}`, t => `${t} Tech`, t => `Northern ${t}`, t => `${t} University`],
  FCS: [t => `${t} State`, t => `Southern ${t}`, t => `${t} University`, t => `Northern ${t}`, t => `${t} A&M`, t => `${t} College`],
  D2: [t => `${t} State`, t => `${t} University`, t => `Western ${t}`, t => `${t} Tech`, t => `${t} College`, t => `${t} Christian`],
  D3: [t => `${t} College`, t => `${t} Wesleyan`, t => `${t} Christian`, t => `${t} State College`, t => `${t} University`]
};
const CONF_A = ["Heartland", "Tallgrass", "Bluestem", "Ironwood", "Riverbend", "Timberline", "Cottonwood", "Ridgeline", "Copperleaf", "Redrock", "Northwind",
  "Pinewood", "Sandhill", "Harborline", "Canyon Rim", "Prairie Star", "High Desert", "Tidewater", "Cumberland Gap", "Lakewood", "Bayside", "Highland Lakes",
  "Red River Valley", "Golden Plains", "Silver Creek", "Blue Ridge Valley", "Painted Hills", "Twin Rivers", "Crossroads", "Old Dominion Valley", "Iron Range",
  "Coastal Plain", "Grand Prairie", "Big Timber", "Long Valley", "Pine Barrens", "Four Rivers", "Granite Peaks", "Sunbelt Plains", "Western Slope",
  "North Woods", "Saltwater", "Cedar Valley", "Oak Savanna", "Upper Delta", "Bitterroot", "Sagebrush", "Thunder Basin", "Chisholm Trail", "Lone Star Plains",
  "Bluewater", "Maple Valley", "Big Bend", "Palmetto Coast", "Orchard Valley", "Copper Country", "Hill Country", "Mesa", "Cascade Valley", "Sand Hills",
  "Smoky Valley", "Gold Coast", "Wheatland"];
const CONF_B = ["Conference", "Athletic Conference", "League", "Athletic Association", "Football Conference", "Intercollegiate Conference"];
const POWER_CONFS = ["Continental Conference", "Union Athletic Conference", "Frontier Conference", "Coast-to-Coast Conference"];
const BOWLS = ["Lone Pine", "Riverboat", "Ironhorse", "Harvest Moon", "Copper Canyon", "Lighthouse", "Prairie Wind", "Timberline", "Bluewater", "Sandstone", "Redbud",
  "Golden Plains", "Cypress", "Thunder Basin", "Evergreen", "Pinecone", "Wildflower", "Stockyards", "Lakefront", "Cornerstone", "Bayou Lights", "Frontier",
  "Silver Spur", "Old Mill", "Starlight", "Harbor Lights", "Canyon Sun", "Big Sky Ranch", "Peachtree Lane", "Mesa Verde Road", "Iron Bridge", "Gulf Breeze",
  "Cowtown", "Pinehurst Lane", "Riverwalk", "Northern Lights", "Painted Desert", "Magnolia Lane", "Boardwalk", "Lantern"];
const CFP_SITES = ["Lighthouse Bowl", "Harvest Moon Bowl", "Copper Canyon Bowl", "Ironhorse Bowl", "Riverboat Bowl", "Lone Pine Bowl"];

/* ---------- The world ---------- */
// A program's summary: id, town (its name, as "Lakeshore State"), mascot, colors, cls (its level),
// conf (conference id, or "" for an independent), trad, seed, level (the ability of a typical junior
// there), coach, rating { off, def, c }, bon { o, d } (how far its starters stand above its classes),
// classes { year: { n, lv } }, enroll, bst and fac (money.js)
function genColWorld(seed, year) {
  const g = dice(hashSeed(`${seed}:college`)), towns = new Set(), names = new Set(), schools = {}, confs = [];
  let n = 0, ci = 0;
  const confNames = g.shuffle(CONF_A);
  COL_ORDER.forEach(cls => {
    const L = COL_LEVELS[cls], forms = COL_FORMS[cls];
    const sizes = L.confs.concat(L.indep ? [-L.indep] : []);
    sizes.forEach((size, k) => {
      const indep = size < 0, count = Math.abs(size);
      const conf = indep ? null : { id: `k${ci}`, name: cls === "P4" ? POWER_CONFS[k] : `${confNames[ci % confNames.length]} ${g.pick(CONF_B)}`, cls, ids: [] };
      if (conf) { confs.push(conf); ci++; }
      const used = new Set();
      for (let j = 0; j < count; j++) {
        const id = `c${n++}`;
        let nm = "";
        for (let i = 0; i < 30 && (!nm || names.has(nm)); i++) nm = g.pick(forms)(townName(g, towns));
        names.add(nm);
        const color = g.pick(SCHOOL_COLORS.filter(c => !used.has(c[2]))) || g.pick(SCHOOL_COLORS);
        used.add(color[2]);
        const trad = clamp(Math.round(g.n(45, 18)), 5, 95), sseed = g.seed(), sg = dice(sseed);
        // What genSchool would roll for this program, without building its roster
        const level = CLASS_LEVEL[cls] + Math.round((trad - 50) * .06 + sg.n(0, 2.5));
        const s = { id, town: nm, mascot: g.pick(MASCOTS), cls, conf: conf ? conf.id : "", trad, trad0: trad, seed: sseed, level, color: color[0], colorName: color[1], colorFam: color[2],
          enroll: g.i(...CLASS_INFO[cls].enroll), coach: genCoach(g, cls) };
        s.abbr = schoolAbbr(nm);
        s.off = s.coach.off_style; s.def = s.coach.def_style;
        s.bon = { o: COL_BON.o + Math.round(g.n(0, 1.2) * 10) / 10, d: COL_BON.d + Math.round(g.n(0, 1.2) * 10) / 10 };
        s.classes = {};
        for (let y = year - 3; y <= year; y++) s.classes[y] = { n: Math.round(CLASS_INFO[cls].roster / 4), lv: level };
        s.rating = colRating(s, year);
        schools[id] = s;
        if (conf) conf.ids.push(id);
      }
    });
  });
  return { schools, confs };
}
// A program's quick-sim ratings from its last four classes and its coach
function colRating(s, year) {
  const lvs = [0, 1, 2, 3].map(k => (s.classes[year - k] || { lv: s.level }).lv), lv = avg(lvs), dev = ((s.coach.dev || 50) - 50) * .03;
  return { off: Math.round((lv + s.bon.o + dev) * 10) / 10, def: Math.round((lv + s.bon.d + dev) * 10) / 10, c: Math.round((s.coach.off + s.coach.def) / 2) };
}
const confOf = id => (SEASON.confs || []).find(c => c.id === SEASON.schools[id].conf) || null;
const confName = id => { const c = confOf(id); return c ? c.name : "Independent"; };
const levelName = cls => (COL_LEVELS[cls] || {}).name || cls;

/* ---------- The schedule ---------- */
// 12 weeks. Conference play fills the last weeks: 9 games where a conference is big enough, every
// other member where it isn't. The other weeks are non-conference games within the same division,
// and now and then a power program pays a smaller one to come play it. Week 13 is for the FBS
// conference title games, and the postseason starts in week 14.
const COL_REG = 12, COL_TITLE_WEEK = 13, COL_POST = 14, COL_LAST = 18, CONF_GAMES = 9;
function makeColSchedule(se, g) {
  const weeks = [], homes = {}, wasHome = {};
  for (let w = 1; w <= COL_LAST; w++) weeks.push({ n: w, games: [] });
  const host = (a, b) => {
    const ka = homes[a] || 0, kb = homes[b] || 0;
    const h = ka !== kb ? (ka < kb ? a : b) : wasHome[a] !== wasHome[b] ? (wasHome[a] ? b : a) : g.f() < .5 ? a : b, v = h === a ? b : a;
    homes[h] = (homes[h] || 0) + 1; wasHome[h] = true; wasHome[v] = false;
    return { h, v };
  };
  const busy = {}; // busy[week]: ids playing that week
  for (let w = 1; w <= COL_REG; w++) busy[w] = new Set();
  const met = new Set(), key = (a, b) => a < b ? a + "|" + b : b + "|" + a;
  const add = (w, a, b, conf) => { const { h, v } = host(a, b); weeks[w - 1].games.push({ h, a: v, conf: !!conf, hs: null, as: null, ot: 0 }); busy[w].add(a); busy[w].add(b); met.add(key(a, b)); };
  // Conference play: the circle method, its rounds in the last weeks of the season
  se.confs.forEach(c => {
    const ids = g.shuffle(c.ids), list = ids.length % 2 ? ids.concat([null]) : ids, m = list.length, rounds = m - 1;
    const play = Math.min(CONF_GAMES, ids.length - 1), first = COL_REG - Math.min(rounds, CONF_GAMES) + 1;
    for (let r = 0; r < Math.min(rounds, CONF_GAMES); r++) {
      const rot = [list[0]].concat(list.slice(1).map((_, i) => list[1 + ((i + r) % (m - 1))]));
      for (let k = 0; k < m / 2; k++) { const a = rot[k], b = rot[m - 1 - k]; if (a && b) add(first + r, a, b, true); }
    }
    void play;
  });
  // Non-conference games: within the division, avoiding conference mates and rematches. A power
  // program left over may host an FCS program.
  for (let w = 1; w <= COL_REG; w++) {
    const free = id => !busy[w].has(id);
    DIV_IDS.forEach(dv => {
      const pool = g.shuffle(Object.keys(se.schools).filter(id => divOf(se.schools[id]) === dv && free(id)));
      pairUp(pool, (a, b) => se.schools[a].conf && se.schools[a].conf === se.schools[b].conf || met.has(key(a, b)), (a, b) => add(w, a, b, false));
    });
    // Buy games: power programs still free this week host FCS programs still free
    const p4 = Object.keys(se.schools).filter(id => se.schools[id].cls === "P4" && free(id)), fcs = g.shuffle(Object.keys(se.schools).filter(id => se.schools[id].cls === "FCS" && free(id)));
    p4.forEach(id => { const o = fcs.find(x => free(x) && !met.has(key(id, x))); if (o) { add(w, id, o, false); const gm = weeks[w - 1].games[weeks[w - 1].games.length - 1]; if (gm.h !== id) { gm.a = gm.h; gm.h = id; } } });
  }
  return weeks;
}
// Pairs a shuffled list two at a time, skipping pairs that clash; whoever's left over has a bye
function pairUp(pool, clash, add) {
  const left = pool.slice();
  while (left.length > 1) {
    const a = left.shift(), j = left.findIndex(b => !clash(a, b));
    if (j < 0) continue;
    add(a, left.splice(j, 1)[0]);
  }
}

/* ---------- Results ---------- */
// A program's record: { w, l, cw, cl, pf, pa }, through week upTo (the whole season by default),
// counting conference title games and the postseason as games
function colRecord(id, upTo) {
  const r = { w: 0, l: 0, cw: 0, cl: 0, pf: 0, pa: 0 };
  SEASON.weeks.forEach(wk => {
    if (upTo != null && wk.n > upTo) return;
    wk.games.forEach(gm => {
      if (!played(gm) || !gameHas(gm, id)) return;
      const mine = gm.h === id ? gm.hs : gm.as, theirs = gm.h === id ? gm.as : gm.hs, win = mine > theirs;
      r.pf += mine; r.pa += theirs;
      if (win) r.w++; else r.l++;
      if (gm.conf) { if (win) r.cw++; else r.cl++; }
    });
  });
  return r;
}
// A conference's standings through week upTo: conference record, then head-to-head, then the overall
// record, then point differential in conference games (at most 17 a game), then a coin flip
function confStandings(cid, upTo) {
  const c = SEASON.confs.find(x => x.id === cid), ids = c.ids, rec = {}, h2h = {}, diff = {};
  const last = Math.min(upTo == null ? COL_REG : upTo, COL_REG);
  ids.forEach(id => { rec[id] = colRecord(id, last); diff[id] = 0; });
  SEASON.weeks.forEach(wk => {
    if (wk.n > last) return;
    wk.games.forEach(gm => {
      if (!played(gm) || !gm.conf || SEASON.schools[gm.h].conf !== cid) return;
      const m = clamp(gm.hs - gm.as, -17, 17), hw = gm.hs > gm.as ? 1 : -1;
      diff[gm.h] += m; diff[gm.a] -= m; h2h[gm.h + ">" + gm.a] = hw; h2h[gm.a + ">" + gm.h] = -hw;
    });
  });
  const pct = id => { const r = rec[id], n = r.cw + r.cl; return n ? r.cw / n : 0; }, all = id => rec[id].w - rec[id].l, coin = id => hashSeed(SEASON.seed + id) % 1000;
  const sorted = ids.slice().sort((a, b) => pct(b) - pct(a)), out = [];
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j < sorted.length && pct(sorted[j]) === pct(sorted[i])) j++;
    const group = sorted.slice(i, j), h = id => group.reduce((s, o) => s + (h2h[id + ">" + o] || 0), 0);
    group.sort((a, b) => h(b) - h(a) || all(b) - all(a) || diff[b] - diff[a] || coin(b) - coin(a));
    out.push(...group);
    i = j;
  }
  return out.map((id, k) => Object.assign({ id, place: k + 1, diff: diff[id] }, rec[id]));
}

/* ---------- The top 25 ---------- */
// A power number for every program from its results: each game counts the opponent's power, 12 for
// a win (or minus 12 for a loss) and a third of the margin (at most 17), averaged, then blended with
// where its talent put it before the season until it has played a few games. Ranked within each
// division.
function colPower(upTo) {
  const ids = Object.keys(SEASON.schools), prior = {}, games = {};
  ids.forEach(id => { const r = SEASON.schools[id].rating; prior[id] = (r.off + r.def) / 2; games[id] = []; });
  SEASON.weeks.forEach(wk => { if (upTo != null && wk.n > upTo) return; wk.games.forEach(gm => { if (!played(gm)) return; games[gm.h].push([gm.a, gm.hs - gm.as]); games[gm.a].push([gm.h, gm.as - gm.hs]); }); });
  let pw = Object.assign({}, prior);
  for (let it = 0; it < 8; it++) {
    const next = {};
    ids.forEach(id => {
      const gs = games[id];
      if (!gs.length) { next[id] = prior[id]; return; }
      const v = avg(gs.map(([o, m]) => pw[o] + (m > 0 ? 12 : -12) + clamp(m, -17, 17) / 3)), w = gs.length / (gs.length + 2);
      next[id] = w * v + (1 - w) * prior[id];
    });
    pw = next;
  }
  return pw;
}
// The top 25 of a division: [id], best first
function colTop25(dv, upTo) {
  const pw = colPower(upTo);
  return Object.keys(SEASON.schools).filter(id => divOf(SEASON.schools[id]) === dv).sort((a, b) => pw[b] - pw[a]).slice(0, 25);
}
// Every program's place in its division, through week upTo
function colRanks(upTo) {
  const pw = colPower(upTo), out = {};
  DIV_IDS.forEach(dv => Object.keys(SEASON.schools).filter(id => divOf(SEASON.schools[id]) === dv).sort((a, b) => pw[b] - pw[a]).forEach((id, k) => { out[id] = k + 1; }));
  return out;
}
// "No. 7 Lakeshore State" or "Lakeshore State"
const rankedName = (id, ranks) => { const r = ranks && ranks[id]; return r && r <= 25 ? `No. ${r} ${SEASON.schools[id].town}` : SEASON.schools[id].town; };

/* ---------- Quick sims ---------- */
// Fit from full-engine college games across every level (Nov 2026): about 24 points a team, a margin
// of 2.5 points per point of starters, and 3 points of home field
const QUICK_COL = { base: 18.35, off: 1.282, def: -1.229, home: 3, coach: .144 };

/* ---------- Conference title games and the postseason ---------- */
// After week 12: the FBS conferences' top two meet in week 13
function colTitleGames() {
  const wk = SEASON.weeks[COL_TITLE_WEEK - 1];
  if (wk.games.length) return;
  SEASON.confs.forEach(c => {
    if (!COL_LEVELS[c.cls].title || c.ids.length < 8) return;
    const st = confStandings(c.id, COL_REG);
    wk.games.push({ h: st[0].id, a: st[1].id, conf: false, ctitle: c.id, neutral: true, hs: null, as: null, ot: 0 });
  });
}
// A conference's champion: its title game's winner, or the top of its standings
function confChamp(cid) {
  const tg = SEASON.weeks[COL_TITLE_WEEK - 1].games.find(gm => gm.ctitle === cid);
  if (tg && played(tg)) return winnerOf(tg);
  return confStandings(cid, COL_REG)[0].id;
}
// Bracket seed order for a field of P (a power of two): 1 v P, then the halves, as usual
function seedOrder(P) { let a = [1]; while (a.length < P) { const n = a.length * 2 + 1; a = a.flatMap(x => [x, n - x]); } return a; }
// Starts a division's playoff: seeds (best first), the week of its first round, and which rounds are
// at neutral sites (from round neutralFrom on; the final always is). SEASON.post[dv] = { seeds,
// cur (who's still in, in bracket order), round, week, games: [[week, index]] by round, champ }
function startPlayoff(dv, seeds, neutralFrom) {
  const P = 1 << Math.ceil(Math.log2(seeds.length));
  const B = { seeds, cur: seedOrder(P).map(sd => sd <= seeds.length ? seeds[sd - 1] : null), round: 0, week: COL_POST, rounds: [], champ: null, nf: neutralFrom || 99 };
  (SEASON.post = SEASON.post || {})[dv] = B;
  playoffRound(dv);
}
const PLAYOFF_NAMES = { 2: "Final", 4: "Semifinals", 8: "Quarterfinals" };
function playoffRound(dv) {
  const B = SEASON.post[dv], next = [], made = [], seedOf = id => B.seeds.indexOf(id);
  B.round++;
  const w = COL_POST + B.round - 1, wk = SEASON.weeks[w - 1], last = B.cur.length === 2;
  for (let k = 0; k < B.cur.length; k += 2) {
    const a = B.cur[k], b = B.cur[k + 1];
    if (!a || !b) { next.push(a || b); continue; }
    const hi = seedOf(a) < seedOf(b) ? a : b, lo = hi === a ? b : a, neutral = last || B.round >= B.nf;
    const gm = { h: hi, a: lo, conf: false, post: dv, round: B.round, left: B.cur.filter(Boolean).length, neutral, title: last, hs: null, as: null, ot: 0 };
    if (dv === "FBS" && neutral && !last) { gm.b0 = CFP_SITES[(made.length + B.round * 2) % CFP_SITES.length]; gm.bowl = bowlAs(gm.b0); }
    wk.games.push(gm); made.push([w, wk.games.length - 1]); next.push(null);
  }
  B.rounds.push(made); B.pending = next;
}
// After a round: the winners move on, and the next round starts (or the champion is crowned)
function advancePlayoff(dv) {
  const B = SEASON.post[dv];
  if (!B || B.champ) return;
  const games = B.rounds[B.rounds.length - 1].map(([w, i]) => SEASON.weeks[w - 1].games[i]);
  if (!games.every(played)) return;
  let gi = 0;
  B.cur = B.pending.map(x => x != null ? x : winnerOf(games[gi++]));
  if (B.cur.length === 1) { B.champ = B.cur[0]; return; }
  playoffRound(dv);
}
// The postseason, once the title games are in: the 12-team College Football Playoff (the four power
// conference champions, the best-ranked champion of the other FBS conferences, and the best-ranked
// teams left), bowls for the other FBS teams with 6 wins, and the FCS (24), Division II (28) and
// Division III (32) playoffs, each with its conference champions and the best-ranked teams left
function colPostseason() {
  if (SEASON.post) return;
  const ranks = colRanks(COL_TITLE_WEEK), byRank = ids => ids.slice().sort((a, b) => ranks[a] - ranks[b]);
  const champs = {};
  SEASON.confs.forEach(c => { champs[c.id] = confChamp(c.id); });
  DIV_IDS.forEach(dv => {
    const D = DIVS[dv], all = byRank(Object.keys(SEASON.schools).filter(id => divOf(SEASON.schools[id]) === dv));
    const cc = SEASON.confs.filter(c => D.levels.includes(c.cls));
    let auto;
    if (dv === "FBS") {
      const g5 = byRank(cc.filter(c => c.cls === "G5").map(c => champs[c.id]));
      auto = cc.filter(c => c.cls === "P4").map(c => champs[c.id]).concat(g5.slice(0, 1));
    } else auto = cc.map(c => champs[c.id]);
    const field = new Set(auto);
    all.forEach(id => { if (field.size < D.field) field.add(id); });
    startPlayoff(dv, byRank([...field]), dv === "FBS" ? 2 : 99);
  });
  // Bowls: FBS teams with 6 or more wins that aren't in the playoff, paired by ranking, in week 15
  const inCfp = new Set(SEASON.post.FBS.seeds), wk = SEASON.weeks[COL_POST];
  const eligible = byRank(Object.keys(SEASON.schools).filter(id => divOf(SEASON.schools[id]) === "FBS" && !inCfp.has(id) && colRecord(id, COL_TITLE_WEEK).w >= 6));
  const g = dice(hashSeed(`${SEASON.seed}:bowls`)), names = g.shuffle(BOWLS.filter(b => !CFP_SITES.includes(b + " Bowl")));
  for (let k = 0; k + 1 < eligible.length && k / 2 < names.length; k += 2) {
    let a = eligible[k], b = eligible[k + 1];
    // Teams from the same conference don't meet in a bowl: swap with the next pair if they can
    if (SEASON.schools[a].conf && SEASON.schools[a].conf === SEASON.schools[b].conf && eligible[k + 2]) { const c = eligible[k + 2]; eligible[k + 2] = b; b = c; eligible[k + 1] = b; }
    wk.games.push({ h: a, a: b, conf: false, b0: `${names[k / 2]} Bowl`, bowl: bowlAs(`${names[k / 2]} Bowl`), neutral: true, hs: null, as: null, ot: 0 });
  }
}

/* ---------- Weeks ---------- */
const colWeekName = n => n <= COL_REG ? `Week ${n}` : n === COL_TITLE_WEEK ? "Championship week" : n === COL_POST ? "Bowls and the first round" : n === COL_LAST ? "The finals" : `Postseason week ${n - COL_TITLE_WEEK}`;
// The name of a game's round, for your schedule and results: "Lone Pine Bowl", "FBS playoff, quarterfinals"
function postName(gm) {
  if (gm.ctitle) return `${SEASON.confs.find(c => c.id === gm.ctitle).name} championship`;
  if (gm.post) {
    const what = gm.title ? "national championship" : PLAYOFF_NAMES[gm.left] ? PLAYOFF_NAMES[gm.left].toLowerCase() : gm.round === 1 ? "first round" : "second round";
    return `${DIVS[gm.post].name} playoff, ${what}${gm.bowl ? ` at the ${gm.bowl}` : ""}`;
  }
  return gm.bowl || "";
}
// Plays out a week in the college world: every game but yours, as a quick sim, then title games or the
// postseason's next round
function colPlayWeek(n) {
  SEASON.weeks[n - 1].games.forEach(gm => { if (!played(gm) && !gameHas(gm, SEASON.myId)) quickGame(gm); });
}
function colAfterWeek(n) {
  if (n === COL_REG) colTitleGames();
  else if (n === COL_TITLE_WEEK) colPostseason();
  else if (n >= COL_POST) DIV_IDS.forEach(advancePlayoff);
  if (n >= COL_POST && DIV_IDS.every(dv => SEASON.post[dv].champ)) SEASON.phase = "over";
  else if (n >= COL_TITLE_WEEK) SEASON.phase = "playoffs";
}
// The whole season on paper (when you aren't coaching in college, or for a test): every game, every
// week, to the champions. Returns { champs: { FBS, FCS, D2, D3 } }.
function colSeasonOnPaper() {
  for (let guard = 0; guard < COL_LAST + 2 && SEASON.phase !== "over"; guard++) {
    const n = SEASON.week;
    colPlayWeek(n); colAfterWeek(n);
    SEASON.week = n + 1;
  }
  return { champs: Object.fromEntries(DIV_IDS.map(dv => [dv, SEASON.post[dv].champ])) };
}

/* ---------- A college season ---------- */
function newColSeason(seed, year, prev) {
  const w = prev ? { schools: prev.schools, confs: prev.confs } : genColWorld(seed, year), g = dice(hashSeed(`${seed}:${year}:colsched`));
  const se = { v: 1, lvl: "col", seed: hashSeed(`${seed}:${year}:col`), world: seed, year, year0: prev ? prev.year0 : year, myId: prev ? prev.myId : null,
    schools: w.schools, confs: w.confs, weeks: null, week: 1, phase: "regular", camp: 0, pre: PRESEASON_WEEKS, post: null, champion: null,
    rot: "normal", depthMode: "always", nextDepth: null, stats: {}, news: {}, plan: newPlan(), practice: null, cpuWeek: -PRESEASON_WEEKS, film: null, injLog: {},
    history: prev ? prev.history : [], summer: newSummer(), halls: null, cls: null,
    // "Your district" in college is just your program: the loops over it practice and heal your team
    district: 1, districts: [{ n: 1, ids: prev && prev.myId ? [prev.myId] : [] }] };
  se.weeks = makeColSchedule(se, g);
  moneyInit(se);
  nameWorld(se);
  inWorld(se, colSetExpectations);
  return se;
}
// Runs fn with SEASON set to se (the college world while you coach in high school, or the other way)
// (the world it was called from is kept in WORLD_FROM, so either world can still be found)
let WORLD_FROM = null;
function inWorld(se, fn) {
  const keep = SEASON, from = WORLD_FROM;
  SEASON = se; WORLD_FROM = keep;
  try { return fn(); } finally { SEASON = keep; WORLD_FROM = from; }
}

/* ---------- Your college season, week by week ---------- */
// The rest of the week once your game is in: practice for your program, every other game as a quick
// sim, healing, then title games or the postseason's next round, the news and XP
function colFinishWeek() {
  const n = SEASON.week, gm = myGameIn(n);
  if (!["regular", "playoffs"].includes(SEASON.phase) || (gm && !played(gm))) return 0;
  cpuPractice(n);
  colPlayWeek(n);
  endOfWeek();
  SEASON.week = n + 1;
  colAfterWeek(n);
  colPostXP(n);
  colNews(n);
  recWeek(n);
  if (SEASON.phase === "over") seasonEndXP(n);
  return n;
}
// XP at the end of the regular season and the title games: a postseason spot (the playoff, or a bowl
// at half), and a conference title
function colPostXP(n) {
  const me = SEASON.myId;
  if (!me || n !== COL_TITLE_WEEK || !SEASON.post) return;
  const s = SEASON.schools[me], inPlayoff = SEASON.post[divOf(s)].seeds.includes(me), bowl = SEASON.weeks[COL_POST].games.some(gm => gm.bowl && !gm.post && gameHas(gm, me));
  if (inPlayoff) giveXP(XP.playoffs, "playoffs", n); else if (bowl) giveXP(Math.round(XP.playoffs / 2), "playoffs", n);
  if (s.conf && confChamp(s.conf) === me) giveXP(XP.district, "district", n);
}
// A few lines after each week: upsets of ranked teams in your division, your conference's title
// race, the postseason fields and the champions. At most five, the most important first.
function colNews(n) {
  const me = SEASON.myId, lines = [], my = me ? SEASON.schools[me] : null, dv = my ? divOf(my) : "FBS";
  const before = colRanks(n - 1), now = colRanks(n);
  SEASON.weeks[n - 1].games.forEach(gm => {
    if (!played(gm) || gameHas(gm, me)) return;
    const w = winnerOf(gm), l = loserOf(gm), sc = `${Math.max(gm.hs, gm.as)}-${Math.min(gm.hs, gm.as)}`;
    if (divOf(SEASON.schools[l]) !== dv) return;
    if (before[l] <= 10 && before[w] > 25) lines.push({ p: 4, t: `Upset: ${SEASON.schools[w].town} beat No. ${before[l]} ${SEASON.schools[l].town}, ${sc}.` });
    if (gm.title) lines.push({ p: 10, t: `${SEASON.schools[w].town} won the ${DIVS[gm.post].name} national championship, ${sc} over ${SEASON.schools[l].town}.` });
    else if (gm.ctitle && my && gm.ctitle === my.conf) lines.push({ p: 8, t: `${SEASON.schools[w].town} won the ${SEASON.confs.find(c => c.id === gm.ctitle).name} championship.` });
  });
  if (my && n <= COL_TITLE_WEEK) { const r = now[me]; if (r <= 25) lines.push({ p: 6, t: `You're No. ${r} in the ${DIVS[dv].name} top 25.${before[me] <= 25 && before[me] !== r ? ` Last week: No. ${before[me]}.` : ""}` }); else if (before[me] <= 25) lines.push({ p: 6, t: `You dropped out of the ${DIVS[dv].name} top 25.` }); }
  if (n === COL_TITLE_WEEK && SEASON.post && my) {
    const B = SEASON.post[dv], seed = B.seeds.indexOf(me) + 1;
    lines.push({ p: 9, t: seed ? `You're in the ${DIVS[dv].name} playoff as the No. ${seed} seed.` : SEASON.weeks[COL_POST].games.some(gm => gm.bowl && !gm.post && gameHas(gm, me)) ? `You're going to the ${SEASON.weeks[COL_POST].games.find(gm => gm.bowl && !gm.post && gameHas(gm, me)).bowl}.` : "Your season is over: no postseason this year." });
  }
  SEASON.news[n] = lines.sort((a, b) => b.p - a.p).slice(0, 5).map(x => x.t);
}
// Your game in a week: the schedule's game, or none (a bye, or out of the postseason)
const colGameText = (gm, id) => { const k = postName(gm); return k ? `${k}: ` : gm.conf ? "Conference game: " : ""; };

/* ---------- Taking over a program ---------- */
// You take over a college program: its roster is built in full as it stands now, with your coach
// and your schemes, and camp opens (the job market brings you here; tests call it directly)
function colTakeOver(id) {
  const sum = SEASON.schools[id], b = rebuildSchool(sum, 0), c = CAREER.coach;
  const s = Object.assign({}, sum, { players: b.players, depth: b.depth, mastery: b.mastery });
  SEASON.schools[id] = s;
  s.coach = c;
  if (c.off_style && c.def_style) { s.off = c.off_style; s.def = c.def_style; }
  s.players.forEach(p => { p.o0 = ovr(p, p.pos); });
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  Object.assign(SEASON, { myId: id, districts: [{ n: 1, ids: [id] }], district: 1, phase: "preseason", camp: 1 });
  return s;
}
