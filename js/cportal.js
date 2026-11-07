// Friday to Sunday: paying college players and the transfer portal (Milestone 4). Each program's
// money for players (revenue sharing plus the booster collective), what every player is worth, your
// players' pay, and one portal window a year, after the postseason.
"use strict";

/* ---------- The money ---------- */
// The year's money for players: revenue sharing (crecruit.js: playerMoney) plus the booster
// collective, which adds up to a quarter more when the boosters are all in and takes a little off
// when they're grumbling. Division III has none.
const payBudget = s => { const base = playerMoney(s); return base ? roundMoney(base * (1 + (boostersOf(s) - 50) / 200)) : 0; };
// What a player is worth at a level: about $400,000 for a typical power-conference starter, doubling
// every 5 points of overall, with quarterbacks worth twice as much and kickers much less. Elsewhere
// it scales with the level's money.
const POS_VALUE = { QB: 2, RB: .9, WR: 1.1, TE: .8, OL: 1.1, DL: 1.2, LB: .9, CB: 1, S: .9, K: .3, P: .25 };
const VALUE_SCALE = [0, .007, .025, .25, 1];
function valueOf(p, cls) {
  const L = REC_LV[cls || "P4"], o = ovr(p, p.pos), x = 400000 * VALUE_SCALE[L] * (POS_VALUE[p.pos] || 1) * Math.pow(2, (o - (LEVEL_MEDIAN[L] + 10)) / 5);
  return x < 2500 ? 0 : roundMoney(Math.min(x, 6e6));
}
// What your program can pay for that worth: a full roster's worth shared out over three quarters of
// the year's money (never more than the market). A player's fair pay is his worth times that.
function payScale(s) {
  const tot = s.players.reduce((n, p) => n + valueOf(p, s.cls), 0);
  return tot ? Math.min(1, .75 * payBudget(s) / tot) : 0;
}
const fairPay = (p, s, k) => roundMoney(valueOf(p, s.cls) * (k == null ? payScale(s) : k));
// Your players' pay, set when you take over: each one's fair pay, give or take a quarter. Recruits
// bring their NIL offers, and portal players theirs.
function payInit(s) {
  if (!s || !s.players || s.players.every(p => p.pay != null)) return;
  const k = payScale(s);
  s.players.forEach(p => { if (p.pay == null) p.pay = roundMoney(valueOf(p, s.cls) * k * (.75 + .5 * seededRandom(hashSeed(`${p.id}:pay`))())); });
}
const payroll = list => list.reduce((n, p) => n + (p.pay || 0), 0);

/* ---------- Your gift to the collective ---------- */
// Your own money, given to the booster collective in the offseason (Nov 2026): CAREER.nil = { id, amt }.
// It goes to next season's players: first the transfer portal (keeping your players and going after
// others), then whatever the portal didn't use goes to the next recruiting class's NIL budget. It
// belongs to the program, so it's lost if you leave. Not in Division III, which can't pay players.
const NIL_GIFTS = [25000, 100000, 500000, 2000000];
const nilGift = s => CAREER && CAREER.nil && s && CAREER.nil.id === s.id ? CAREER.nil.amt || 0 : 0;
const nilGiftOpen = () => !!(SEASON && SEASON.lvl === "col" && SEASON.phase === "offseason" && SEASON.myId && REC_LV[mySchool().cls] && !leavingSchool() && (!SEASON.market || SEASON.market.done) && !(SEASON.portal && SEASON.portal.closed));
function giveToCollective(amt) {
  if (!NIL_GIFTS.includes(amt) || !nilGiftOpen()) return "";
  if (myCash() < amt) return `You have ${moneyText(myCash())} of your own money.`;
  const s = mySchool();
  if (!CAREER.nil || CAREER.nil.id !== s.id) CAREER.nil = { id: s.id, amt: 0 };
  CAREER.spent = (CAREER.spent || 0) + amt; CAREER.nil.amt += amt; CAREER.nilAll = (CAREER.nilAll || 0) + amt;
  return `You gave ${moneyText(amt)} to the collective, ${moneyText(CAREER.nil.amt)} in all for next season's players. ${moneyText(myCash())} of your own money left.`;
}

/* ---------- The portal ---------- */
// SEASON.portal: { year, out: [{ id, why, ask, keep }] (your players who entered), pool [portal
// players], spent }. A portal player: id, first, last, pos, yr (next season's), o, st (stars), from
// (his program), lv, arch, seed, ask, fit (playing time), offer, rs. It opens in the offseason, after
// the postseason, and closes when the next season starts.
const PORTAL_N = 60;
function colPortal() {
  const se = SEASON;
  if (!se || se.lvl !== "col" || se.phase !== "offseason" || !se.myId || !isFull(se.schools[se.myId])) return null;
  if (se.portal && se.portal.year === se.year) return se.portal;
  const s = mySchool();
  payInit(s);
  se.portal = { year: se.year, out: portalEntries(s), pool: portalPool(s), spent: 0 };
  // Your staff suggests keeping the starters who entered for pay, if the money's there
  const P = se.portal;
  P.out.filter(x => x.why === "pay" && x.start).sort((a, b) => b.ask - a.ask).forEach(x => { if (x.ask - payOf(x.id) <= portalMoney(P)) x.keep = true; });
  return P;
}
const payOf = id => { const p = mySchool().players.find(q => q.id === id); return p ? p.pay || 0 : 0; };
// Who's a starter (or first off the bench) on your depth chart
function startersOf(s) {
  const out = new Set();
  for (const pos in s.depth) (s.depth[pos] || []).slice(0, STARTERS[pos] || 1).forEach(id => out.add(id));
  return out;
}
// Your players who enter: underpaid starters (for pay: paid less than his fair pay over 1.3), good players stuck behind others (for
// playing time), and a few for their own reasons. Seniors moving on and players leaving for the pros
// don't. Each player's choice is rolled once for the year.
function portalEntries(s) {
  const st = startersOf(s), out = [], d3 = !REC_LV[s.cls], k = payScale(s);
  s.players.forEach(p => {
    if (lastYearNow(p)) return;
    const g = seededRandom(hashSeed(`${p.id}:${SEASON.year}:portal`)), v = fairPay(p, s, k), o = ovr(p, p.pos), start = st.has(p.id);
    const best = Math.max(...s.players.filter(q => q.pos === p.pos && st.has(q.id)).map(q => ovr(q, q.pos)), 0);
    let why = "", ch = .02;
    if (!d3 && start && v > (p.pay || 0) * 1.3 + 5000) { ch = clamp(.2 + .25 * (v / Math.max(5000, p.pay || 0) - 1.3), .2, .6); why = "pay"; }
    else if (!start && p.yr >= 10 && o >= best - 4 && o >= LEVEL_MEDIAN[REC_LV[s.cls]] + 4) { ch = .3; why = "time"; }
    else if (!start && p.yr >= 10) { ch = .08; why = "time"; }
    if (g() >= ch) return;
    out.push({ id: p.id, why: why || "own", ask: why === "pay" ? roundMoney(v) : p.pay || 0, start, keep: false });
  });
  return out;
}
// The money left for next season: the year's money less what next year's roster is paid (the players
// staying, the class you signed, your players you keep, and the portal players you're after)
function portalMoney(P) {
  const s = mySchool(), out = new Set(P.out.filter(x => !x.keep).map(x => x.id));
  const stay = s.players.filter(p => !lastYearNow(p) && !out.has(p.id));
  const raises = P.out.filter(x => x.keep).reduce((n, x) => n + Math.max(0, x.ask - payOf(x.id)), 0);
  const rec = SEASON.rec && SEASON.rec.cls ? payroll(SEASON.rec.cls) : 0;
  const offers = P.pool.reduce((n, q) => n + (q.offer || 0), 0);
  return payBudget(s) + nilGift(s) - payroll(stay) - raises - rec - offers;
}
// Roster spots for next season: 105 less the players staying and the class you signed (walk-ons
// make room), and no more than 15 from the portal
const PORTAL_MAX = 15;
function portalSpots(P) {
  const s = mySchool(), out = new Set(P.out.filter(x => !x.keep).map(x => x.id));
  const stay = s.players.filter(p => !lastYearNow(p) && !out.has(p.id)).length;
  const signed = SEASON.rec && SEASON.rec.cls ? SEASON.rec.cls.filter(p => !p.walkOn).length : 0, after = P.pool.filter(q => q.offer != null).length;
  return Math.min(PORTAL_MAX - after, COL_ROSTER_MAX - stay - signed - after);
}
// Players from other programs: experienced players around your level, a level up or down, more of
// them from programs that just changed coaches, at the positions you need most
function portalPool(s) {
  const L = REC_LV[s.cls], g = dice(hashSeed(`${SEASON.world}:${SEASON.year}:${s.id}:portal`)), out = [], scale = payScale(s);
  const changed = SEASON.review && SEASON.review.open ? SEASON.review.open.filter(id => SEASON.schools[id] && id !== s.id) : [];
  const arch = { lineman: 8, speed: 4, runner: 3, bigath: 3, backer: 3, dback: 4, passer: 1.5, kicker: .4 };
  for (let k = 0; k < PORTAL_N; k++) {
    const fl = clamp(L + g.w({ "-1": 2, 0: 5, 1: 2 }) * 1, 0, 4), from = changed.length && g.f() < .35 ? g.pick(changed) : g.pick(levelIds(REC_LV_ORDER[fl]));
    const yr = +g.w({ 10: 3, 11: 3, 12: 3, 13: 2 }), lv = Math.round(LEVEL_MEDIAN[REC_LV[SEASON.schools[from].cls]] + 2 + g.n(0, 3));
    const q = { id: `pt${SEASON.year}${s.id}n${k}`, arch: g.w(arch), yr, lv, last: g.pick(LAST_NAMES), seed: hashSeed(`${SEASON.world}:${SEASON.year}:${s.id}:pt:${k}`), from };
    const p = portalPlayer(q);
    Object.assign(q, { first: p.first, pos: p.pos, o: ovr(p, p.pos), offer: null });
    q.st = starsOf(q.o + 4); q.ask = fairPay(p, s, scale);
    out.push(q);
  }
  return out.sort((a, b) => b.o - a.o);
}
// A portal player in full, the same every time: built as a player of his year (next season's)
function portalPlayer(q) {
  const g = dice(q.seed), p = genPlayer(g, { id: q.id, arch: q.arch, yr: Math.min(13, q.yr), level: q.lv, last: q.last });
  if (p.pos2 && posSide(p.pos2) !== posSide(p.pos)) p.pos2 = null;
  if (q.first) p.first = q.first;
  return Object.assign(p, { from: SEASON.year + 1 });
}
// Where he'd fit on your depth chart next season: "start", "compete" or "backup"
function portalFit(s, q) {
  const st = STARTERS[q.pos] || 1, better = s.players.filter(p => p.pos === q.pos && !lastYearNow(p) && ovr(p, p.pos) >= q.o).length;
  return better < st ? "start" : better < 2 * st ? "compete" : "backup";
}
const FIT_WORDS = { start: "He'd start for you", compete: "He'd compete for a starting job", backup: "He'd be a backup" };
// Whether he comes: playing time, the level he'd move to, your program and you, and your offer
// against what he's looking for. Rolled once when the window closes.
function portalYes(s, q) {
  const L = REC_LV[s.cls], fl = REC_LV[SEASON.schools[q.from].cls], fit = portalFit(s, q);
  let a = 50 + (fit === "start" ? 18 : fit === "compete" ? 6 : -14) + (L - fl) * 10 + ((s.trad || 50) - 50) * .2 + ((CAREER.crep || 0) - 50) * .15 + (coachRct(CAREER.coach) - 50) * .15;
  if (q.ask > 0) a += 15 * Math.min(1.3, (q.offer || 0) / q.ask) - 10;
  return clamp(a / 100, .05, .95);
}
const YR_WORD = { 10: "sophomore", 11: "junior", 12: "senior", 13: "fifth-year senior" };
function portalLine(s, q) {
  const t = SEASON.schools[q.from];
  return `${q.first} ${q.last}, ${starText(q.st)}, ${posName(q.pos)}, a ${YR_WORD[q.yr] || "senior"} next season, overall ${q.o}, from ${t.town} (${levelName(t.cls)}). ${FIT_WORDS[portalFit(s, q)]}.${q.ask ? ` Looking for about ${moneyText(q.ask)}.` : ""}${q.offer != null ? ` You're after him${q.offer ? `: ${moneyText(q.offer)}` : ""}.` : ""}`;
}
const WHY_WORDS = { pay: "for more money", time: "for playing time", own: "for his own reasons" };
function portalOutLine(x) {
  const p = mySchool().players.find(q => q.id === x.id);
  if (!p) return "";
  return `${fullName(p)}, ${posName(p.pos)}, ${yearName(p)}, overall ${ovr(p, p.pos)}${x.start ? ", a starter" : ""}. Entered ${WHY_WORDS[x.why]}.${x.why === "pay" ? ` Paid ${moneyText(p.pay || 0)}, looking for ${moneyText(x.ask)}.` : ""} ${x.keep ? "You're keeping him." : "He's leaving."}`;
}

/* ---------- Your moves ---------- */
// Keep one of yours: match what he's looking for (for pay), or, for playing time or his own reasons,
// talk him into staying (that works about half the time, rolled when the window closes)
function portalKeep(P, id, on) {
  const x = P.out.find(y => y.id === id);
  if (!x) return false;
  if (on && x.why === "pay" && x.ask - payOf(id) > portalMoney(P)) return false;
  x.keep = !!on;
  return true;
}
// Go after a portal player (with his asking price, or nothing where there's no money), or pull out
function portalOffer(P, id, amt) {
  const q = P.pool.find(y => y.id === id);
  if (!q) return false;
  if (amt == null) { q.offer = null; return true; }
  amt = REC_LV[mySchool().cls] ? roundMoney(amt) : 0;
  if (q.offer == null && portalSpots(P) <= 0) return false;
  if (amt - (q.offer || 0) > portalMoney(P)) return false;
  q.offer = amt;
  return true;
}
// When the window closes (the next season starts): your players who weren't kept leave (for a
// program at a level that fits them), the ones you kept get their raise, and the portal players you
// went after decide. Returns { out: [players], kept: [players], in: [players], missed: [portal players] }.
function portalClose(s) {
  const P = SEASON.portal, rep = { out: [], kept: [], in: [], missed: [] };
  if (!P || P.year !== SEASON.year || P.closed) return rep;
  // What's left of your gift once the portal has its share goes to the next recruiting class
  const gift = nilGift(s);
  if (gift) CAREER.nil.amt = Math.min(gift, Math.max(0, portalMoney(P)));
  P.closed = true;
  P.out.forEach(x => {
    const p = s.players.find(q => q.id === x.id);
    if (!p) return;
    const stays = x.keep && (x.why === "pay" || seededRandom(hashSeed(`${x.id}:${P.year}:talk`))() < .5);
    if (stays) { if (x.why === "pay") p.pay = Math.max(p.pay || 0, x.ask); rep.kept.push(p); return; }
    rep.out.push(p);
  });
  const gone = new Set(rep.out.map(p => p.id));
  s.players = s.players.filter(p => !gone.has(p.id));
  rep.out.forEach(p => transferAway(p, s));
  P.pool.filter(q => q.offer != null).forEach(q => {
    if (seededRandom(hashSeed(`${q.id}:${P.year}:yes`))() < portalYes(s, q)) rep.in.push(Object.assign(portalPlayer(q), { pay: q.offer || 0, xfer: q.from }));
    else rep.missed.push(q);
  });
  return rep;
}
// One of your players who left lands at a program that fits him, on paper (it adds him when it's rebuilt)
function transferAway(p, s) {
  const o = ovr(p, p.pos), L = clamp(REC_LV_ORDER.findIndex((c, i) => i === 4 || o < LEVEL_MEDIAN[i + 1] + 10), 0, 4);
  const ids = levelIds(REC_LV_ORDER[L]).filter(id => id !== s.id), cid = ids[hashSeed(`${p.id}:xfer`) % ids.length], c = SEASON.schools[cid];
  if (!c) return;
  const q = Object.assign(clone(p), { id: `${p.id}t`, from: SEASON.year + 1, inj: null, pay: undefined });
  delete q.cs; delete q.en; delete q.rest; delete q.num;
  q.yr = Math.min(13, p.yr + 1);
  (c.joined = c.joined || []).push(q);
  p.xferTo = cid;
}
