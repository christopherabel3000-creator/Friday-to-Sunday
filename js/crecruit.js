// Friday to Sunday: recruiting for your college program (Milestone 4). Each year's class of high
// school seniors (from your old state and from out of state), your recruiting board with
// priorities, your staff's settings, visits, NIL offers, commitments and flips, and signing day.
// Computer programs still recruit on paper (cyear.js: colClassOnPaper).
"use strict";

/* ---------- Stars and levels ---------- */
// The 3b recruit rating (recruit.js: recruitOf) as stars: five at 80 and up, four at 68, three at 56,
// and two below that. A typical power-conference freshman is about a 60, a Division III one a 38.
const starsOf = r => r >= 80 ? 5 : r >= 68 ? 4 : r >= 56 ? 3 : 2;
const starText = n => `${n} star${n === 1 ? "" : "s"}`;
// Levels in order, Division III (0) to the power conferences (4), and a typical freshman's recruit
// rating at each
const REC_LV = { D3: 0, D2: 1, FCS: 2, G5: 3, P4: 4 };
const REC_LV_ORDER = ["D3", "D2", "FCS", "G5", "P4"];
const LEVEL_MEDIAN = [38, 43, 47, 52, 60];
// The level a prospect aims for, from his rating: a 52 aims for the rest of FBS, a 60 for the power
// conferences, and the best aim a little higher still (for the power programs that win)
function aimLevel(r) {
  const M = LEVEL_MEDIAN;
  if (r <= M[0]) return (r - M[0]) / 6;
  for (let i = 1; i < M.length; i++) if (r <= M[i]) return i - 1 + (r - M[i - 1]) / (M[i] - M[i - 1]);
  return Math.min(4.6, 4 + (r - M[4]) / 12);
}

/* ---------- Money ---------- */
// What a program has to pay its players each year, in real dollars: revenue sharing for football
// plus the collective's NIL. A power program has about $12 million to $16 million, the rest of FBS
// $2 million to $5 million, the FCS a few hundred thousand, Division II a little and Division III
// nothing (it can't pay players). More tradition, more money.
const PAY_RANGE = { P4: [12e6, 16e6], G5: [2e6, 5e6], FCS: [2e5, 5e5], D2: [4e4, 15e4], D3: [0, 0] };
const roundMoney = x => x <= 0 ? 0 : x < 100000 ? Math.max(5000, Math.round(x / 5000) * 5000) : Math.round(x / 25000) * 25000;
function playerMoney(s) {
  const [lo, hi] = PAY_RANGE[s.cls] || [0, 0];
  return hi ? roundMoney(lo + (hi - lo) * clamp(((s.trad || 50) - 30) / 60, 0, 1)) : 0;
}
// The share of it that goes to each year's new class
const CLASS_SHARE = .3;
// What a prospect is looking for, at a power program: five stars $1 million to $2.5 million, four
// stars $250,000 to $900,000, three stars $40,000 to $200,000, two stars up to $30,000. Elsewhere
// less: about 40 percent of that in the rest of FBS, 5 percent in the FCS, 1.5 percent in Division
// II, and nothing in Division III.
const ASK_RANGE = { 5: [1e6, 2.5e6], 4: [25e4, 9e5], 3: [4e4, 2e5], 2: [0, 3e4] };
const LEVEL_PAY = [0, .015, .05, .4, 1];
const askAt = (p, L) => { const x = p.ask * LEVEL_PAY[L]; return x < 2500 ? 0 : roundMoney(x); };
const myAsk = p => askAt(p, REC_LV[mySchool().cls]);

/* ---------- The class ---------- */
// Spots to fill: the program's roster size less the players who aren't in their fifth year, with five left for
// the transfer portal (early departures and cuts make more room), from 12 to 30
const classSpots = s => clamp((CLASS_INFO[s.cls] || CLASS_INFO.P4).roster - 5 - s.players.filter(p => !lastYearNow(p)).length, 12, 30);
// A full roster's mix of positions (for 77 scholarship players; the rest are walk-ons)
const POS_MIX = { QB: 4, RB: 5, WR: 9, TE: 5, OL: 16, DL: 12, LB: 9, CB: 8, S: 6, K: 2, P: 1 };
const POS_MIX_SUM = 77;
// What the class needs at each position: the gaps the fifth-year seniors leave against a full roster's mix,
// shared out over the spots. Returns { pos: n }.
function classNeeds(s, spots) {
  const roster = (CLASS_INFO[s.cls] || CLASS_INFO.P4).roster, gap = {}, out = {};
  for (const pos in POS_MIX) {
    const back = s.players.filter(p => p.pos === pos && !lastYearNow(p)).length;
    gap[pos] = Math.max(0, POS_MIX[pos] * roster / POS_MIX_SUM - back) + POS_MIX[pos] / POS_MIX_SUM;
  }
  const tot = Object.values(gap).reduce((a, b) => a + b, 0) || 1;
  let left = spots;
  const parts = Object.keys(gap).map(pos => { const x = gap[pos] * spots / tot; out[pos] = Math.floor(x); left -= out[pos]; return [pos, x - out[pos]]; });
  parts.sort((a, b) => b[1] - a[1]).forEach(([pos]) => { if (left > 0) { out[pos]++; left--; } });
  return out;
}
// "linemen on both sides, a quarterback and receivers": the biggest needs, for the board's summary line
const NEED_WORDS = { QB: ["a quarterback", "quarterbacks"], RB: ["a running back", "running backs"], WR: ["a receiver", "receivers"], TE: ["a tight end", "tight ends"], OL: ["an offensive lineman", "offensive linemen"],
  DL: ["a defensive lineman", "defensive linemen"], LB: ["a linebacker", "linebackers"], CB: ["a cornerback", "cornerbacks"], S: ["a safety", "safeties"], K: ["a kicker", "kickers"], P: ["a punter", "punters"] };
function needsText(rec) {
  const left = needsLeft(rec), top = Object.keys(left).filter(pos => left[pos] > 0).sort((a, b) => left[b] / POS_MIX[b] - left[a] / POS_MIX[a] || left[b] - left[a]).slice(0, 3);
  return top.length ? andList(top.map(pos => NEED_WORDS[pos][left[pos] > 1 ? 1 : 0])) : "nothing in particular";
}
// The needs less the commitments you already have
function needsLeft(rec) {
  const out = Object.assign({}, rec.needs);
  rec.pool.forEach(p => { if (p.cm === "me" && out[p.pos] != null) out[p.pos]--; });
  return out;
}

/* ---------- The prospects ---------- */
// From your old state: its seniors, the players on its rosters on paper. A window around your level
// (and a few who'd be a reach), plus every senior from your old school and your old district, the
// kids you coached and coached against.
const IN_STATE_MAX = 70, OUT_STATE_N = 150;
function knownSchools(H) {
  const names = new Set((CAREER && CAREER.seasons || []).filter(x => x.lvl !== "col").map(x => x.school)), mine = new Set(), near = new Set();
  inWorld(H, () => {
    for (const id in H.schools) if (names.has(schoolName(H.schools[id]))) mine.add(id);
    for (const id in H.schools) { const t = H.schools[id]; if (!mine.has(id) && [...mine].some(m => H.schools[m].cls === t.cls && H.schools[m].district === t.district)) near.add(id); }
  });
  return { mine, near };
}
// The state's seniors, noted as each school on paper is rebuilt for the new year (years.js:
// advanceState), so the board doesn't have to rebuild them again. Kept while the page is open.
let SENIORS = null;
function noteSeniors(world, year, id, t) {
  if (!SENIORS || SENIORS.world !== world || SENIORS.year !== year) SENIORS = { world, year, by: {} };
  SENIORS.by[id] = t.players.filter(p => p.yr === 12).map(p => { const { r, pos } = recruitOf(p); return { id: p.id, first: p.first, last: p.last, pos, r, o: ovr(p, pos) }; });
}
function inStatePool(s, year) {
  const H = hsWorld();
  if (!H || H === SEASON) return [];
  const m = LEVEL_MEDIAN[REC_LV[s.cls]], K = knownSchools(H), all = [];
  // (every school's seniors if they were noted as the year turned; otherwise the schools you know and
  // a third of the rest, picked by luck, since each roster has to be rebuilt from paper)
  const noted = SENIORS && SENIORS.world === H.world && SENIORS.year === H.year ? SENIORS.by : null;
  const pick = seededRandom(hashSeed(`${SEASON.world}:${year}:${s.id}:hsschools`));
  inWorld(H, () => {
    for (const id in H.schools) {
      const kn = K.mine.has(id) ? 2 : K.near.has(id) ? 1 : 0, sum = H.schools[id];
      let list = noted && noted[id];
      if (!list) {
        if (!noted && !kn && pick() >= 1 / 3) continue;
        const t = isFull(sum) ? sum : rosterAt(sum, H.year);
        list = t.players.filter(p => p.yr === 12).map(p => { const { r, pos } = recruitOf(p); return { id: p.id, first: p.first, last: p.last, pos, r, o: ovr(p, pos) }; });
      }
      list.forEach(q => {
        if (q.r < m - (kn ? 12 : 10)) return;
        all.push({ id: `r${q.id}`, first: q.first, last: q.last, pos: q.pos, r: q.r, o: q.o, kn, hs: id, pid: q.id, home: schoolName(sum) });
      });
    }
  });
  // The kids you know, then a reach or two above your level, then the rest of the window by luck
  const g = dice(hashSeed(`${SEASON.world}:${year}:${s.id}:instate`)), known = all.filter(p => p.kn), rest = all.filter(p => !p.kn);
  const reach = g.shuffle(rest.filter(p => p.r >= m + 12 && p.r < m + 26)).slice(0, 12), mid = g.shuffle(rest.filter(p => p.r < m + 12));
  return known.sort((a, b) => b.kn - a.kn || b.r - a.r).slice(0, 30).concat(reach, mid).slice(0, IN_STATE_MAX);
}
// From out of state: made-up seniors around your level (with a few better ones), built from a seed so
// a signee can be built again exactly
const POS_ARCH = { QB: "passer", RB: "runner", WR: "speed", TE: "bigath", OL: "lineman", DL: "lineman", LB: "backer", CB: "dback", S: "dback", K: "kicker", P: "kicker" };
const OUT_ARCHS = { lineman: 8, speed: 4, runner: 3, bigath: 3, backer: 3, dback: 4, passer: 1.2, dual: .6, kicker: .5 };
function outStatePlayer(q) {
  const g = dice(q.seed), p = genPlayer(g, { id: q.id, arch: q.arch, yr: 9, level: q.lv, last: q.last });
  // As a class of freshmen is built (years.js: genClass): nobody below 12, and four years ahead
  const lift = Math.max(0, FRESH_FLOOR - ovr(p, p.pos));
  if (lift) { for (const a in p.r) p.r[a] = Math.min(99, p.r[a] + lift); p.pot += lift; }
  p.pot = Math.min(99, p.pot + CLASS_POT); p.potSeen = clamp(potBand(p.pot) + (p.potSeen - potBand(p.pot - CLASS_POT)), 0, 3);
  if (p.pos2 && posSide(p.pos2) !== posSide(p.pos)) p.pos2 = null;
  if (q.first) p.first = q.first;
  return p;
}
function outStatePool(s, year) {
  const m = LEVEL_MEDIAN[REC_LV[s.cls]], g = dice(hashSeed(`${SEASON.world}:${year}:${s.id}:outstate`)), out = [];
  for (let k = 0; k < OUT_STATE_N; k++) {
    const elite = g.f() < .15, lv = Math.round(elite ? m + 9 + Math.abs(g.n(0, 7)) : m + g.n(0, 7));
    const q = { id: `rx${year}${s.id}n${k}`, arch: g.w(OUT_ARCHS), lv, last: g.pick(LAST_NAMES), seed: hashSeed(`${SEASON.world}:${year}:${s.id}:oos:${k}`) };
    const p = outStatePlayer(q), { r, pos } = recruitOf(p);
    out.push({ id: q.id, first: p.first, last: p.last, pos, r, o: ovr(p, pos), kn: 0, arch: q.arch, lv, seed: q.seed, home: "" });
  }
  return out;
}

/* ---------- What a prospect looks for ---------- */
// How much a program appeals to a prospect, about 0 to 100: its level against his (a player better
// than the level's typical freshman thinks he can do better, 2 points a point of rating, and one
// below it likes being wanted there; at the top level, the more tradition the more the best ones want
// you),
// tradition, ranking, playing time, NIL against what he's looking for, facilities, the coach, knowing
// the coach, and his own taste (a little luck for each school)
const tasteOf = (p, id) => (hashSeed(`${p.id}:${id}:taste`) % 1300) / 100 - 6.5;
const facAvg = s => { const f = facOf(s); return f.reduce((a, b) => a + b, 0) / f.length; };
function appealOf(p, s, o) {
  const L = REC_LV[s.cls], gap = p.r - LEVEL_MEDIAN[L];
  let a = 55 + (gap < 0 ? Math.min(-gap, 10) * .8 : L === 4 ? gap * (((s.trad || 50) - 60) * .02 - .8) : -gap * 2);
  a += ((s.trad || 50) - 50) * .25;
  a += o.rank <= 10 ? 8 : o.rank <= 25 ? 4 : 0;
  // Division III can't pay players or give athletic scholarships: there it's playing time, the
  // program and the coach
  const d3 = L === 0 ? 1.5 : 1;
  a += (o.pt || 0) * d3;
  const ask = askAt(p, L);
  if (ask > 0) a += 10 * Math.min(1.25, (o.nil || 0) / ask) - 5;
  a += (facAvg(s) - 3) * 3;
  a += ((o.rct || 45) - 50) * .15 + ((o.rep || 50) - 50) * .1;
  a += (o.kn === 2 ? 12 : o.kn === 1 ? 5 : 0) * d3;
  return a + tasteOf(p, s.id);
}
// Playing time at your program: a chance to start soon if few returning players at his position are
// as good as he is, buried behind a crowd if many are
function playingTime(s, p) {
  const st = STARTERS[p.pos] || 1, ahead = s.players.filter(q => q.pos === p.pos && !lastYearNow(q) && ovr(q, q.pos) >= p.o - 3).length;
  return ahead < st ? 10 : ahead < 2 * st ? 4 : -4 - Math.min(6, ahead - 2 * st);
}
function myAppeal(p, s, rank) {
  const c = CAREER.coach;
  return appealOf(p, s, { rank, pt: playingTime(s, p), nil: p.nil || 0, rct: coachRct(c), rep: CAREER.crep || 0, kn: p.kn });
}
// Another program after him: what it offers in NIL and playing time is its own luck
function rivalAppeal(p, t, rank) {
  const g = dice(hashSeed(`${p.id}:${t.id}:rival`)), L = REC_LV[t.cls];
  const o = { rank, pt: g.i(-4, 6), nil: askAt(p, L) * (.4 + .5 * g.f()), rct: coachRct(t.coach), rep: 50 + ((t.trad || 50) - 50) * .5, kn: 0 };
  return appealOf(p, t, o) + g.i(0, 8);
}

/* ---------- Your staff's time ---------- */
// Recruiting time each week is shared out by priority: top 3, high 2, normal 1. A prospect who gets an
// sixth of it or more gets all the effort one prospect can take, and less counts for less (a
// prospect with a quarter of that time still gets half the effort). Recruiting (40 for a new coach) and
// the Recruiter perk make it count for more.
const PRI_W = { 3: 3, 2: 2, 1: 1 };
const PRI_NAMES = { 3: "top", 2: "high", 1: "normal" };
function effortOf(rec, p) {
  const tot = rec.pool.reduce((n, q) => n + (q.pr ? PRI_W[q.pr] : 0), 0) || 1, c = CAREER.coach;
  const rf = (.6 + coachRct(c) / 100) * (coachHas(c, "rcr") ? 1.2 : 1);
  return 34 * rf * Math.sqrt(Math.min(1, 6 * PRI_W[p.pr || 1] / tot));
}

/* ---------- The board ---------- */
// SEASON.rec: the class arriving next year. { year, spots, needs, budget, staff { fill, visits, nil },
// pool [prospects], vis { week: [ids] }, log { week: [lines] }, done, cls (the signed class, full
// players), sum (signing day's summary) }. A prospect: id, first, last, pos, r (recruit rating), o
// (overall at his position), d (the level he aims for), ask, kn (2: your old school, 1: your old
// district), hs/pid (his high school and id in your old state) or arch/lv/seed (out of state), I (his
// interest in you), rv [[program, interest, target]] (the others after him, best first), cw (the week
// he'd commit on his own), pr (on your board: 3 top, 2 high, 1 normal; 0 off), nil (your offer), vd
// (the week he visited), cm (committed: "me" or a program), out (you took him off), drop (your staff did).
const BOARD_MAX = 30;
const recById = (rec, id) => rec.pool.find(p => p.id === id) || null;
const onBoard = rec => rec.pool.filter(p => p.pr);
const commitsToMe = rec => rec.pool.filter(p => p.cm === "me");
const nilSpent = rec => rec.pool.reduce((n, p) => n + (p.nil && p.cm !== "lost" ? p.nil : 0), 0);
const nilLeft = rec => Math.max(0, rec.budget - nilSpent(rec));
// Your program's board, made when the season starts (and for a save from before there was one)
function recBoard() {
  const se = SEASON;
  if (!se || se.lvl !== "col" || !se.myId || !CAREER || !isFull(se.schools[se.myId])) return null;
  if (se.rec && se.rec.year === se.year + 1) return se.rec;
  se.rec = newRec();
  return se.rec;
}
function newRec() {
  const s = mySchool(), year = SEASON.year + 1, spots = classSpots(s), ranks = colRanks(weeksDone());
  payInit(s);
  const rec = { year, spots, needs: classNeeds(s, spots), budget: roundMoney(payBudget(s) * CLASS_SHARE), staff: { fill: true, visits: true, nil: coordRole() ? 3 : 0 }, pool: [], vis: {}, log: {}, done: false, cls: null, sum: null, staffNil: 0 };
  rec.pool = inStatePool(s, year).concat(outStatePool(s, year));
  rec.pool.forEach(p => setupProspect(p, s, ranks));
  // What's left of your gift to the collective (cportal.js) goes to this class, then it's used up
  if (CAREER && CAREER.nil) { if (CAREER.nil.id === s.id && CAREER.nil.amt > 0) { rec.budget += CAREER.nil.amt; rec.gift = CAREER.nil.amt; } CAREER.nil = null; }
  staffFill(rec, weeksDone(), true, ranks);
  planVisits(rec);
  return rec;
}
// His level, his asking price, the programs after him, where he stands with you, and the week he'd
// commit on his own if nobody pushed
const LEVEL_IDS = {};
function levelIds(cls) {
  const key = `${SEASON.world}:${cls}`;
  if (!LEVEL_IDS[key]) LEVEL_IDS[key] = Object.keys(SEASON.schools).filter(id => SEASON.schools[id].cls === cls);
  return LEVEL_IDS[key];
}
function setupProspect(p, s, ranks) {
  const g = dice(hashSeed(`${p.id}:${SEASON.year}:setup`)), st = starsOf(p.r), [lo, hi] = ASK_RANGE[st];
  p.st = st; p.d = aimLevel(p.r); p.ask = Math.round(lo + (hi - lo) * g.f());
  const n = g.i(2, 4), rv = [];
  for (let k = 0, tries = 0; k < n && tries < 40; tries++) {
    const L = clamp(Math.round(p.d + g.n(0, .8)), 0, 4), ids = levelIds(REC_LV_ORDER[L]), id = g.pick(ids), t = SEASON.schools[id];
    if (id === s.id || rv.some(x => x[0] === id)) continue;
    const tgt = rivalAppeal(p, t, ranks[id]);
    rv.push([id, Math.round(20 + g.i(0, 15)), Math.round(tgt)]); k++;
  }
  p.rv = rv.sort((a, b) => b[2] - a[2]);
  p.I = Math.round(clamp(18 + p.kn * 12 + (coachHas(CAREER.coach, "rcr") ? 6 : 0) + g.n(0, 4), 0, 60));
  p.cw = 3 + g.i(0, 9); p.wk = 0; p.pr = 0; p.nil = 0; p.vd = 0; p.cm = null;
}
// Interest moves 30 percent of the way to where it's headed each week. Bring the other programs'
// interest up to the week.
const INTEREST_RATE = .3;
function catchUp(p, n) {
  if (n <= p.wk) return;
  const k = Math.pow(1 - INTEREST_RATE, n - p.wk);
  p.rv.forEach(x => { x[1] = Math.round(x[2] + (x[1] - x[2]) * k); });
  p.wk = n;
}
// Where you stand with him: the schools after him with their interest, best first (you as "me")
function standing(p) {
  return [["me", p.I]].concat(p.rv.map(x => [x[0], x[1]])).sort((a, b) => b[1] - a[1]);
}
const myPlace = p => standing(p).findIndex(x => x[0] === "me") + 1;
// "Leaning your way", "in your top three", "interested", "not interested" (and commitments)
function interestWord(p) {
  if (p.cm === "me") return "Committed to you";
  if (p.cm === "lost") return "Signed elsewhere";
  if (p.cm) return `Committed to ${SEASON.schools[p.cm].town}`;
  const st = standing(p), place = myPlace(p);
  if (place === 1 && p.I - (st[1] ? st[1][1] : 0) >= 5) return "Leaning your way";
  if (place <= 3 && p.I >= 35) return "Has you in his top three";
  return p.I >= 40 ? "Interested" : p.I >= 15 ? "Listening" : "Not interested";
}
// The others after him: "Also after him: Lakeshore State and Central Ivesdale."
const rivalsText = p => p.rv.length ? `Also after him: ${andList(p.rv.slice(0, 3).map(x => SEASON.schools[x[0]].town))}.` : "Nobody else is after him yet.";
const hsHome = p => { const H = hsWorld(), t = H && H !== SEASON && H.schools[p.hs]; return t ? schoolName(t) : p.home; };
const homeText = p => p.hs ? `${hsHome(p)}, in your old state${p.kn === 2 ? " (your old school)" : p.kn === 1 ? " (your old district)" : ""}` : "from out of state";
// "Marcus Hill, 4 stars, running back, Bellmont Greyhounds, in your old state."
const prospectHead = p => `${p.first} ${p.last}, ${starText(p.st)}, ${posName(p.pos)}, ${homeText(p)}`;
function boardLine(rec, p) {
  const ask = myAsk(p), nil = REC_LV[mySchool().cls] ? (p.nil ? ` Your NIL offer: ${moneyText(p.nil)}.` : ask ? ` Looking for about ${moneyText(ask)} in NIL.` : "") : "";
  const vw = Object.keys(rec.vis).find(w => rec.vis[w].includes(p.id));
  const vis = p.vd ? ` Visited in ${weekName(p.vd)}.` : vw && +vw >= SEASON.week ? ` Visit: ${weekName(+vw)}.` : "";
  return `${prospectHead(p)}. ${interestWord(p)} (${Math.round(p.I)}).${nil} ${rivalsText(p)}${vis}`;
}

/* ---------- Your moves ---------- */
function addProspect(rec, id, pr) {
  const p = recById(rec, id);
  if (!p || p.pr || rec.done || onBoard(rec).length >= BOARD_MAX) return false;
  catchUp(p, weeksDone());
  p.pr = pr || 1; p.out = false;
  return true;
}
function removeProspect(rec, id) {
  const p = recById(rec, id);
  if (!p || !p.pr) return false;
  p.pr = 0; p.out = true; p.nil = p.cm === "me" ? p.nil : 0;
  if (p.cm === "me") p.cm = null;
  for (const w in rec.vis) rec.vis[w] = rec.vis[w].filter(x => x !== id);
  return true;
}
function setPriority(rec, id, pr) {
  const p = recById(rec, id);
  if (!p || !p.pr || !PRI_W[pr]) return false;
  p.pr = pr;
  return true;
}
// NIL: his asking price, a quarter more, or nothing. Returns false if the money isn't there.
function setNil(rec, id, amt) {
  const p = recById(rec, id);
  if (!p || rec.done || !REC_LV[mySchool().cls]) return false;
  amt = roundMoney(amt);
  if (amt - (p.nil || 0) > nilLeft(rec)) return false;
  p.nil = amt; p.nilBy = "you";
  return true;
}
// Your home games still to come, with their visitors
function homeWeeks() {
  const me = SEASON.myId, out = [];
  for (let n = SEASON.week; n <= COL_REG; n++) { const gm = myGameIn(n); if (gm && gm.h === me && !played(gm)) out.push(n); }
  return out;
}
const VISITS_PER_GAME = 3;
// Invite him to the next home game with room. Returns the week, or 0.
function invite(rec, id) {
  const p = recById(rec, id);
  if (!p || !p.pr || p.vd || Object.values(rec.vis).some(v => v.includes(id))) return 0;
  const w = homeWeeks().find(n => (rec.vis[n] || []).length < VISITS_PER_GAME);
  if (!w) return 0;
  (rec.vis[w] = rec.vis[w] || []).push(id);
  return w;
}
function cancelVisit(rec, id) {
  let any = false;
  for (const w in rec.vis) if (+w >= SEASON.week && rec.vis[w].includes(id)) { rec.vis[w] = rec.vis[w].filter(x => x !== id); any = true; }
  return any;
}

/* ---------- Your staff ---------- */
// Filling the board: your staff keeps it at the class's spots plus eight (up to 30), adding the best
// fits for your needs who'd really come, and drops normal-priority prospects who lose interest.
// Anyone you took off stays off.
function staffFill(rec, n, first, ranks) {
  const s = mySchool(), log = [];
  ranks = ranks || colRanks(n);
  if (n >= 4) onBoard(rec).forEach(p => {
    if (p.pr !== 1 || p.cm === "me") return;
    const st = standing(p), lead = st[0][1];
    if ((p.cm && lead - p.I > 20) || (myPlace(p) > 3 && p.I < 30)) { p.pr = 0; p.drop = true; p.nil = 0; log.push(`${p.first} ${p.last}`); }
  });
  const aim = Math.min(BOARD_MAX, rec.spots + 8), left = needsLeft(rec);
  onBoard(rec).forEach(p => { if (left[p.pos] != null && p.cm !== "me") left[p.pos]--; });
  const m = LEVEL_MEDIAN[REC_LV[s.cls]];
  const cands = rec.pool.filter(p => !p.pr && !p.out && !p.drop && !p.cm && p.r >= m - 8).map(p => {
    catchUp(p, n);
    const a = myAppeal(p, s, ranks[s.id]);
    // Your staff knows who'd really come: how you stack up against the best program after him
    const best = p.rv.length ? p.rv[0][2] : 30;
    return { p, a, k: a + Math.min(10, a + 10 - best) + (p.r - m) * 1.2 + ((left[p.pos] || 0) > 0 ? 10 : -8) };
  }).filter(x => x.a >= 35).sort((a, b) => b.k - a.k);
  const added = [];
  for (const x of cands) {
    if (onBoard(rec).length >= aim) break;
    if ((left[x.p.pos] || 0) <= 0 && cands.some(y => !y.p.pr && (left[y.p.pos] || 0) > 0 && y.a >= 35)) continue;
    addProspect(rec, x.p.id, 1); added.push(x.p);
    if (left[x.p.pos] != null) left[x.p.pos]--;
  }
  // At the start, the best few get high priority
  if (first) added.slice().sort((a, b) => b.r - a.r).slice(0, 6).forEach(p => { p.pr = 2; });
  return { added, dropped: log };
}
// Visits: the best three for the next home game, by priority, for prospects who haven't visited and
// aren't committed yet
function planVisits(rec) {
  if (!rec.staff.visits || rec.done) return;
  const w = homeWeeks()[0];
  if (!w) return;
  const have = rec.vis[w] = rec.vis[w] || [];
  const taken = new Set([].concat(...Object.values(rec.vis)));
  onBoard(rec).filter(p => !p.vd && !p.cm && !taken.has(p.id)).sort((a, b) => b.pr - a.pr || myPlace(a) - myPlace(b) || b.r - a.r).forEach(p => { if (have.length < VISITS_PER_GAME) have.push(p.id); });
}
// NIL by your staff: his asking price to top and high priority prospects who have you in their top
// three, up to the share of the budget you let them spend
const STAFF_NIL = [0, .25, .5, 1];
function staffNil(rec) {
  const share = rec.staff.nil || 0, lines = [];
  if (!share || !REC_LV[mySchool().cls]) return lines;
  onBoard(rec).filter(p => p.pr >= 2 && !p.nil && !(p.cm && p.cm !== "me") && myPlace(p) <= 3).sort((a, b) => b.pr - a.pr || b.r - a.r).forEach(p => {
    const ask = myAsk(p);
    if (!ask || rec.staffNil + ask > share * rec.budget || ask > nilLeft(rec)) return;
    p.nil = ask; p.nilBy = "staff"; rec.staffNil += ask;
    lines.push(`${p.first} ${p.last} (${moneyText(ask)})`);
  });
  return lines;
}
// Decisions waiting for you: prospects on your board who have you in their top three and want an NIL
// offer (the highest priority first), with the money there to make it
function recDecisions(rec) {
  if (!rec || rec.done || !REC_LV[mySchool().cls]) return [];
  return onBoard(rec).filter(p => !p.nil && !(p.cm && p.cm !== "me") && myPlace(p) <= 3 && myAsk(p) && myAsk(p) <= nilLeft(rec))
    .sort((a, b) => b.pr - a.pr || b.r - a.r).slice(0, 3).map(p => ({ id: p.id, amt: myAsk(p), text: `${p.first} ${p.last} (${starText(p.st)}, ${posName(p.pos)}) wants an NIL offer: about ${moneyText(myAsk(p))}.` }));
}

/* ---------- Each week ---------- */
// After each regular-season week: visitors see the game, interest moves, prospects commit and flip,
// and your staff does what you've left to it. After the last regular-season week: signing day.
const COMMIT_AT = 55, COMMIT_LEAD = 8, FLIP_LEAD = 15, COMMIT_WEEK = 3;
function recWeek(n) {
  const rec = recBoard();
  if (!rec || rec.done || n > COL_REG) return null;
  const s = mySchool(), ranks = colRanks(n), myRank = ranks[s.id], log = [];
  const gm = myGameIn(n), home = gm && played(gm) && gm.h === s.id, won = home && winnerOf(gm) === s.id;
  const vis = (rec.vis[n] || []).map(id => recById(rec, id)).filter(p => p && p.pr);
  if (home && vis.length) {
    vis.forEach(p => { p.I = clamp(p.I + 6 + (won ? 6 : -2), 0, 100); p.vd = n; });
    log.push(`Visits: ${andList(vis.map(p => `${p.first} ${p.last}`))} ${vis.length === 1 ? "was" : "were"} at the ${won ? "win" : "loss"}.`);
  }
  const full = () => commitsToMe(rec).length >= rec.spots;
  rec.pool.forEach(p => {
    if (!p.pr && p.cm !== "me") {
      if (!p.cm && n >= p.cw && p.rv.length) { catchUp(p, n); p.cm = p.rv[0][0]; }
      return;
    }
    const g = seededRandom(hashSeed(`${p.id}:${n}:week`)), tgt = myAppeal(p, s, myRank) + effortOf(rec, p);
    p.I = Math.round(clamp(p.I + (tgt - p.I) * INTEREST_RATE + (g() - .5) * 4, 0, 100));
    catchUp(p, n - 1);
    p.rv.forEach(x => { x[2] = Math.round(rivalAppeal(p, SEASON.schools[x[0]], ranks[x[0]])); x[1] = Math.round(clamp(x[1] + (x[2] - x[1]) * INTEREST_RATE + (g() - .5) * 4, 0, 100)); });
    p.wk = n;
    const st = standing(p), lead = st[0], second = st[1] || [null, 0], name = `${p.first} ${p.last}`;
    const blocked = x => x[0] === "me" && full();
    if (!p.cm) {
      if (n >= COMMIT_WEEK && lead[1] >= COMMIT_AT && lead[1] - second[1] >= COMMIT_LEAD && !blocked(lead)) {
        p.cm = lead[0];
        log.push(lead[0] === "me" ? `${name}, a ${p.st}-star ${posName(p.pos)}, committed to you.` : `${name} committed to ${SEASON.schools[lead[0]].town}.`);
      }
    } else {
      const cur = st.find(x => x[0] === p.cm);
      if (lead[0] !== p.cm && lead[1] - (cur ? cur[1] : 0) >= FLIP_LEAD && !blocked(lead)) {
        const from = p.cm;
        p.cm = lead[0];
        log.push(lead[0] === "me" ? `Flip: ${name} flipped to you from ${SEASON.schools[from].town}.` : from === "me" ? `Flip: ${name} flipped from you to ${SEASON.schools[lead[0]].town}.` : `${name} flipped to ${SEASON.schools[lead[0]].town}.`);
      }
    }
  });
  if (rec.staff.fill) {
    const f = staffFill(rec, n, false, ranks);
    if (f.dropped.length) log.push(`Your staff took ${andList(f.dropped)} off the board: not interested.`);
    if (f.added.length) log.push(`Your staff added ${plural(f.added.length, "prospect")} to the board.`);
  }
  const paid = staffNil(rec);
  if (paid.length) log.push(`Your staff made NIL offers to ${andList(paid)}.`);
  if (n === COL_REG) log.push(...colSigningDay(rec));
  else planVisits(rec);
  rec.log[n] = log;
  return log;
}

/* ---------- Signing day ---------- */
// After the regular season. Committed prospects sign where they're committed, the rest of your board
// with the school he likes best (you, if you have a spot), and walk-ons fill any spots left. The
// prospects who sign elsewhere go to those programs for real.
const asFreshman = (p, year) => Object.assign(clone(p), { yr: 9, from: year, inj: null, off: undefined, offT: undefined, sign: undefined, tc: undefined, num: undefined });
function prospectPlayer(p) {
  if (p.hs) {
    const H = hsWorld(), sum = H && H.schools[p.hs];
    const q = sum ? inWorld(H, () => (isFull(sum) ? sum : rosterAt(sum, H.year)).players.find(x => x.id === p.pid)) : null;
    if (q) {
      const c = clone(q);
      delete c.cs; delete c.en; delete c.rest;
      c.id = `${q.id}c`;
      if (c.pos2 && posSide(c.pos2) !== posSide(c.pos)) c.pos2 = null;
      return c;
    }
  }
  return outStatePlayer({ id: p.id, arch: p.arch || POS_ARCH[p.pos] || "speed", lv: p.lv != null ? p.lv : p.r - 3, last: p.last, first: p.first, seed: p.seed || hashSeed(p.id) });
}
function colSigningDay(rec) {
  if (rec.done) return [];
  const s = mySchool(), year = rec.year, mine = [], lost = [];
  const ranks = colRanks(COL_REG);
  const list = rec.pool.filter(p => p.pr || p.cm === "me").sort((a, b) => (b.cm === "me") - (a.cm === "me") || b.pr - a.pr || b.r - a.r);
  list.forEach(p => {
    let to = p.cm;
    if (!to) to = standing(p)[0][0];
    if (to === "me" && mine.length >= rec.spots) to = (p.rv[0] || [null])[0];
    if (to === "me") mine.push(p);
    else if (to) lost.push([p, to]);
    if (to !== "me") { p.cm = to ? "lost" : null; p.to = to; }
  });
  const signees = mine.map(p => Object.assign(asFreshman(prospectPlayer(p), year), { stars: p.st, pay: p.nil || 0 }));
  // Walk-ons, for the spots left: a class rolled on paper, without its best third
  const walk = Math.max(0, rec.spots - signees.length);
  if (!s.classes) s.classes = {};
  if (!s.classes[year]) s.classes[year] = colClassOnPaper(s, year, ranks[s.id]);
  const paper = genClass(s, year).sort((a, b) => recruitOf(a).r - recruitOf(b).r), keep = paper.slice(0, Math.max(walk, Math.ceil(paper.length * 2 / 3)));
  const walks = walk ? dice(hashSeed(`${s.seed}:${year}:walkons`)).shuffle(keep).slice(0, walk).map(p => Object.assign(p, { walkOn: true, pay: 0 })) : [];
  rec.cls = signees.concat(walks);
  const rs = signees.map(p => recruitOf(p).r);
  rec.paper = { n: rec.cls.length, lv: Math.round(((rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : LEVEL_MEDIAN[REC_LV[s.cls]] - 4) - 3) * 10) / 10 };
  lost.forEach(([p, cid]) => { if (SEASON.schools[cid]) sendToCollege(prospectPlayer(p), cid, SEASON.year); });
  rec.done = true;
  const byStars = [5, 4, 3, 2].map(k => [k, mine.filter(p => p.st === k).length]).filter(x => x[1]);
  rec.sum = { n: mine.length, stars: byStars, walk, lost: lost.map(([p, cid]) => [p.id, cid]) };
  const lines = [mine.length ? `Signing day: ${plural(mine.length, "player")} signed with you (${andList(byStars.map(([k, c]) => `${c} with ${starText(k)}`))}).${walk ? ` ${plural(walk, "walk-on")} ${walk === 1 ? "fills" : "fill"} the last ${walk === 1 ? "spot" : "spots"}.` : ""}`
    : `Signing day: nobody signed with you. ${plural(walk, "walk-on")} fill the class.`];
  const big = lost.filter(([p]) => p.pr >= 2).slice(0, 4);
  if (big.length) lines.push(`Signed elsewhere: ${andList(big.map(([p, cid]) => `${p.first} ${p.last} with ${SEASON.schools[cid].town}`))}.`);
  return lines;
}
// The board's one-line summary: "8 committed of 24 spots. 27 on the board. $1,250,000 in NIL left. Biggest needs: ..."
function recSummary(rec) {
  if (rec.done) return `Signing day is done: ${plural(rec.sum.n, "player")} signed${rec.sum.walk ? `, and ${plural(rec.sum.walk, "walk-on")}` : ""}. They join the team next season.`;
  const nil = REC_LV[mySchool().cls] ? ` ${moneyText(nilLeft(rec))} in NIL left.` : "";
  return `${commitsToMe(rec).length} committed, ${rec.spots} spots. ${plural(onBoard(rec).filter(p => p.cm !== "me").length, "more prospect")} on the board.${nil} Biggest needs: ${needsText(rec)}.`;
}
