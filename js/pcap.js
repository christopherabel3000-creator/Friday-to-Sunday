// Friday to Sunday: pro players and the salary cap (Milestone 5, step 3). Ages, growth to a peak and
// the decline after it, retirement, contracts, cap space and dead money, the 53-man roster and its
// game-day 48, the practice squad, injured reserve, the offseason roster of up to 90 and cutdown day.
"use strict";

/* ---------- The cap and the minimum ---------- */
// The real 2026 numbers: a $301.2 million cap, rising about 6 percent a year, and minimum salaries by
// seasons in the league (NFL Football Operations). Practice squad players are paid $13,750 a week,
// about $250,000 a season (contracts here are counted in steps of $5,000).
const PRO_CAP0 = 301200000, PRO_CAP_YEAR = 2026, PRO_CAP_GROWTH = .06;
const PRO_MIN = [885000, 1005000, 1075000, 1145000, 1215000, 1215000, 1215000, 1300000];
const PS_PAY = 250000, PS_MAX = 16, PS_VETS = 6, PRO_ACTIVE = 53, PRO_DRESS = 48, CAMP_MAX = 90, IR_WEEKS = 4, IR_RETURNS = 8, PS_CALLUPS = 2;
// The league's cap this year, and how far it has grown since 2026 (salaries grow with it)
const capNow = () => (SEASON && SEASON.cap) || PRO_CAP0;
const capScale = () => capNow() / PRO_CAP0;
const proMin = exp => Math.round(PRO_MIN[Math.min(exp || 0, 7)] * capScale() / 5000) * 5000;
// The cap for a year: 2026's, grown about 6 percent a year (a little more or less)
function capFor(year, prev, g) {
  if (prev) return Math.round(prev * (1 + PRO_CAP_GROWTH + (g ? g.n(0, .012) : 0)) / 100000) * 100000;
  return Math.round(PRO_CAP0 * Math.pow(1 + PRO_CAP_GROWTH, year - PRO_CAP_YEAR) / 100000) * 100000;
}
// "$301.2 million", "$14.3 million", "$885,000"
const bigMoney = n => Math.abs(n) >= 1e6 ? `$${(Math.round(n / 1e5) / 10).toLocaleString("en-US")} million` : moneyText(n);

/* ---------- What a player is worth ---------- */
// From his overall, his position and his age: about $10 million a year for a solid starter (75) at
// most positions, doubling every 6 points, much more at quarterback and on the pass rush, and less at
// running back and for kickers. Past his peak, a player is worth less each year.
const VAL_POS = { QB: 1.8, DL: 1.2, WR: 1.1, OL: 1, CB: 1, LB: .8, S: .75, TE: .7, RB: .6, K: .25, P: .2 };
// Ages players peak at, by position: running backs early, quarterbacks and kickers late
const PEAK_AGE = { RB: 26, QB: 30, K: 32, P: 32 };
const peakAge = p => PEAK_AGE[p.pos] || 28;
function proValue(p) {
  const o = ovr(p, p.pos), past = Math.max(0, p.age - peakAge(p) - 1);
  let v = 10e6 * Math.pow(2, (o - 75) / 6) * (VAL_POS[p.pos] || .8) * Math.max(.3, 1 - .14 * past);
  if (p.inj && p.inj.w >= 50) v *= .7;
  return clamp(Math.round(v * capScale() / 5000) * 5000, proMin(p.exp), Math.round(.2 * capNow()));
}

/* ---------- Contracts ---------- */
// p.ct = { y: [this year's cap hit, next year's...], g: guaranteed money still owed, rk: a rookie
// contract, o5: a first-round pick's fifth-year option still to decide }. Pay rises 3 percent a year.
// The guarantee is the share of the money a player of his value gets: a star about two thirds of it,
// a minimum player almost none.
function makeContract(pay, yrs, opts) {
  opts = opts || {};
  const y = [];
  for (let k = 0; k < yrs; k++) y.push(Math.round(pay * Math.pow(1.03, k) / 5000) * 5000);
  const total = y.reduce((a, b) => a + b, 0), share = opts.g != null ? opts.g : clamp(pay / capNow() * 5, .03, .65);
  return { y, g: Math.round(total * share / 5000) * 5000, rk: !!opts.rk, o5: !!opts.o5 };
}
const capHit = p => p.ct && p.ct.y.length ? p.ct.y[0] : 0;
const ctYears = p => p.ct ? p.ct.y.length : 0;
const ctTotal = p => p.ct ? p.ct.y.reduce((a, b) => a + b, 0) : 0;
// "$14.3 million this year, 3 years left ($44.2 million in all), $20 million guaranteed. Rookie contract."
function proContractText(p) {
  if (!p.ct || !p.ct.y.length) return "No contract.";
  const n = p.ct.y.length;
  return `${bigMoney(p.ct.y[0])} this year${n > 1 ? `, ${plural(n, "year")} left (${bigMoney(ctTotal(p))} in all)` : ", the last year of his contract"}${p.ct.g ? `, ${bigMoney(p.ct.g)} guaranteed` : ""}.${p.ct.rk ? " Rookie contract." : ""}`;
}
// A new contract for a player at what he's worth: longer for a young player, shorter for an old one
function marketContract(p, rng) {
  const v = proValue(p), r = rng || rand, yrs = p.age >= 32 ? 1 : p.age >= 30 ? 1 + (r() < .5 ? 1 : 0) : v >= 8e6 * capScale() ? 3 + Math.floor(r() * 3) : 1 + Math.floor(r() * 3);
  return makeContract(Math.round(v * (.9 + .2 * r()) / 5000) * 5000, yrs);
}

/* ---------- A team's money ---------- */
// A team's players: the 53 (plus anyone on injured reserve) in players, and its practice squad in ps
// (psr as short records on a team that isn't yours). dead: this year's dead money. carry: last
// year's unused cap space, carried over.
const teamPS = s => s.ps || (s.psr || []).map(unpackPlayer);
const onActive = s => s.players.filter(p => !p.ir);
function capUsed(s) {
  const all = s.players.concat(teamPS(s));
  return all.reduce((t, p) => t + capHit(p), 0) + (s.dead || 0);
}
const capLimit = s => capNow() + (s.carry || 0);
const capRoom = s => capLimit(s) - capUsed(s);
// Next year's commitments: every contract's next year
const capNext = s => s.players.concat(teamPS(s)).reduce((t, p) => t + (p.ct && p.ct.y[1] || 0), 0);
// Cutting a player: whatever's left of his guarantee counts against this year's cap, all at once
function cutPlayer(s, p) {
  const dead = p.ct ? p.ct.g || 0 : 0;
  s.dead = (s.dead || 0) + dead;
  s.players = s.players.filter(x => x !== p);
  if (s.ps) s.ps = s.ps.filter(x => x !== p);
  delete p.ir; delete p.ct;
  return dead;
}

/* ---------- Ages and growth ---------- */
// A year older. Young players grow fast for their first few seasons, slower toward a peak around 26
// to 29, then decline: running backs earlier, quarterbacks and kickers later. Speed goes first. A
// team's Development helps the growing. mine: your team, whose players already grew in practice
// all season, so only the decline is new.
function proAgeYear(p, dev, rng, mine) {
  const a = p.age, peak = peakAge(p), o = ovr(p, p.pos), kick = p.pos === "K" || p.pos === "P";
  let d = 0;
  if (!mine) d = a <= 23 ? 2.2 + 1.3 * gauss(rng) : a <= 26 ? 1 + 1 * gauss(rng) : a <= peak ? .2 + .8 * gauss(rng) : 0;
  if (d > 0) d = Math.min(d * (1 + ((dev || 50) - 50) * .01), Math.max(0, (p.pot || o) - o));
  const past = a - peak;
  if (past >= 1) d -= past * .9 + .7 * Math.abs(gauss(rng));
  const keys = kick ? ["leg", "kac"] : ATTRS.filter(k => k !== "leg" && k !== "kac");
  keys.forEach(k => { p.r[k] = clamp(Math.round(p.r[k] + d + (k === "spd" && past >= 0 ? -.6 * (past + 1) : 0) + .6 * gauss(rng)), 1, 99); });
  p.age = a + 1; p.exp = (p.exp || 0) + 1;
  return Math.round(d * 10) / 10;
}
// A pro player's potential: how far he can still grow, by age (the true number stays hidden, and the
// staff's estimate is right most of the time)
function proPotential(p, g) {
  const room = p.age <= 22 ? g.n(8, 4) : p.age <= 23 ? g.n(6, 3) : p.age <= 25 ? g.n(3, 2) : g.n(1, 1.5);
  p.pot = clamp(Math.round(ovr(p, p.pos) + Math.max(0, room)), 1, 99);
  const band = proPotBand(p.pot), miss = g.f();
  p.potSeen = clamp(band + (miss < .08 ? -1 : miss > .92 ? 1 : 0), 0, 3);
}
// In the pros, potential reads against pro talent: low under 70, average under 77, high under 84
const proPotBand = pot => pot < 70 ? 0 : pot < 77 ? 1 : pot < 84 ? 2 : 3;
// A normal deviate from a seeded generator
function gauss(rng) { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
// Retirement: likelier with age (later for quarterbacks and kickers, sooner for running backs), with a
// season-ending injury, and for a player who isn't good enough to be wanted
function retires(p, rng) {
  const late = { QB: 3, K: 4, P: 4, RB: -2 }[p.pos] || 0, a = p.age - late;
  let pr = a < 30 ? .01 : a < 32 ? .06 : a < 34 ? .18 : a < 36 ? .4 : .7;
  if (ovr(p, p.pos) < 60 && a >= 28) pr += .25;
  if (p.inj && p.inj.w >= 50) pr += .08;
  return rng() < pr;
}

/* ---------- Building a roster ---------- */
// How many of each position a 53-man roster carries
const ROSTER_MIX = { QB: 3, RB: 4, WR: 6, TE: 3, OL: 9, DL: 9, LB: 7, CB: 6, S: 4, K: 1, P: 1 };
// The best 53 of a team's players, position by position, then the best of the rest
function pick53(players) {
  const left = players.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)), keep = [];
  for (const pos in ROSTER_MIX) {
    const at = left.filter(p => p.pos === pos).slice(0, ROSTER_MIX[pos]);
    at.forEach(p => { keep.push(p); left.splice(left.indexOf(p), 1); });
  }
  while (keep.length < PRO_ACTIVE && left.length) keep.push(left.shift());
  return { keep, rest: left };
}
// Practice squad: players with two or fewer seasons, and up to six veterans, the best prospects first
function pickPS(players) {
  const young = players.filter(p => (p.exp || 0) <= 2), vets = players.filter(p => (p.exp || 0) > 2);
  const by = (a, b) => (b.pot || 0) + ovr(b, b.pos) - (a.pot || 0) - ovr(a, a.pos);
  const ps = vets.sort(by).slice(0, PS_VETS).concat(young.sort(by)).sort(by).slice(0, PS_MAX);
  return { ps, rest: players.filter(p => !ps.includes(p)) };
}
// A young player off the street, for camp or the practice squad: a minimum contract
function streetPlayer(g, id, level, pos) {
  const arch = { QB: "passer", RB: "runner", WR: "speed", TE: "bigath", OL: "lineman", DL: "lineman", LB: "backer", CB: "dback", S: "dback", K: "kicker", P: "kicker" }[pos] || g.pick(["speed", "lineman", "backer", "dback"]);
  const p = genPlayer(g, { id, arch, yr: 13, level, last: g.pick(LAST_NAMES) });
  if (p.pos2 && posSide(p.pos2) !== posSide(p.pos)) p.pos2 = null;
  // (journeymen as well as young players: 22 to 30)
  p.age = g.i(22, 30); p.exp = clamp(p.age - 22 + g.i(-2, 0), 0, 8);
  proPotential(p, g);
  p.ct = makeContract(proMin(p.exp), 1, { g: 0 });
  return p;
}

/* ---------- A new league's contracts ---------- */
// Every player gets a contract when the league is made: years left by age, pay from his value (less
// for the young players still on rookie deals), and the team's payroll fit under the cap. Each team
// also gets a practice squad of 16.
function proLeagueContracts(sum, g, year) {
  const s = proRoster(sum), cap = capFor(year);
  s.players.forEach(p => proPotential(p, g));
  s.players.forEach(p => {
    const v = proValue(p), young = (p.exp || 0) <= 3;
    const yrs = clamp(young ? 4 - (p.exp || 0) : p.age >= 31 ? g.i(1, 2) : g.i(1, 4), 1, 5);
    const pay = young ? Math.max(proMin(p.exp), Math.round(v * (.15 + .25 * g.f()) / 5000) * 5000) : Math.round(v * (.85 + .3 * g.f()) / 5000) * 5000;
    p.ct = makeContract(pay, yrs, { rk: young });
  });
  s.ps = [];
  for (let k = 0; k < PS_MAX; k++) { const p = streetPlayer(g, `${sum.id}x${k}`, CLASS_LEVEL.PRO - 6, g.pick(Object.keys(ROSTER_MIX))); p.ct = makeContract(PS_PAY, 1, { g: 0 }); s.ps.push(p); }
  // Payroll: most teams spend 85 to 98 percent of the cap (the contracts above the minimum are scaled to fit)
  const target = cap * (.85 + .13 * g.f());
  for (let it = 0; it < 4; it++) {
    const used = s.players.concat(s.ps).reduce((t, p) => t + capHit(p), 0), base = s.players.concat(s.ps).reduce((t, p) => t + Math.min(capHit(p), proMin(p.exp)), 0);
    if (Math.abs(used - target) < cap * .005) break;
    const k = (target - base) / Math.max(1, used - base);
    s.players.forEach(p => { const m = proMin(p.exp), pay = Math.max(m, Math.round((m + (capHit(p) - m) * k) / 5000) * 5000); p.ct = makeContract(pay, p.ct.y.length, { rk: p.ct.rk }); });
  }
  sum.roster = s.players.map(packPlayer);
  sum.psr = s.ps.map(packPlayer);
  sum.dead = 0; sum.carry = 0;
  sum.rating = schoolRating(s);
}

/* ---------- Game day ---------- */
// The 48 who dress: everyone healthy on the depth chart first, then the best of the rest. With fewer
// than 48 healthy, up to two practice squad players are called up for the game.
function gameDay(s) {
  if (!isPro(s.cls) || !s.players) return s;
  const healthy = s.players.filter(p => !p.inj && !p.ir), onDepth = new Set();
  for (const pos in s.depth) (s.depth[pos] || []).forEach(id => onDepth.add(id));
  const order = healthy.slice().sort((a, b) => (onDepth.has(b.id) - onDepth.has(a.id)) || ovr(b, b.pos) - ovr(a, a.pos));
  let dress = order.slice(0, PRO_DRESS);
  if (dress.length < PRO_DRESS) dress = dress.concat(teamPS(s).filter(p => !p.inj).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).slice(0, Math.min(PS_CALLUPS, PRO_DRESS - dress.length)));
  const ids = new Set(dress.map(p => p.id)), out = Object.assign({}, s, { players: s.players.filter(p => ids.has(p.id) || p.inj).concat(dress.filter(p => !s.players.includes(p))) });
  return out;
}
// Who sits on game day: the healthy players who don't dress
function inactives(s) {
  const d = gameDay(s), dressed = new Set(d.players.filter(p => !p.inj).map(p => p.id));
  return s.players.filter(p => !p.inj && !p.ir && !dressed.has(p.id));
}

/* ---------- Injured reserve ---------- */
// After your game: a player out four weeks or more goes on injured reserve, which frees his spot, and
// the best practice squad player at his position takes it. After four games (and with returns left,
// eight a season), a healed player comes back, and the player who took his spot goes back to the
// practice squad, or is let go if it's full.
function proIR(s, week) {
  if (!isPro(s.cls) || !s.ps) return { on: [], back: [] };
  const on = [], back = [];
  s.players.forEach(p => {
    if (p.ir || !p.inj || p.inj.w < IR_WEEKS) return;
    p.ir = { wk: week };
    on.push(p);
    const up = s.ps.filter(q => q.pos === p.pos).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos))[0] || s.ps.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos))[0];
    if (up) { s.ps = s.ps.filter(q => q !== up); up.up = p.id; up.ct = makeContract(Math.max(proMin(up.exp), capHit(up)), Math.max(1, ctYears(up)), { g: 0 }); s.players.push(up); }
  });
  s.irBack = s.irBack || 0;
  s.players.forEach(p => {
    if (!p.ir || p.inj || week - p.ir.wk < IR_WEEKS || s.irBack >= IR_RETURNS) return;
    delete p.ir; s.irBack++; back.push(p);
    const sub = s.players.find(q => q.up === p.id);
    if (sub) { delete sub.up; s.players = s.players.filter(q => q !== sub); if (s.ps.length < PS_MAX && (sub.exp || 0) <= 2) { sub.ct = makeContract(PS_PAY, 1, { g: 0 }); s.ps.push(sub); } else cutPlayer(s, sub); }
  });
  if (on.length || back.length) s.depth = autoDepth(s);
  return { on, back };
}

/* ---------- Cutdown day ---------- */
// At the end of camp: the best 53, the practice squad, and everyone else let go (any guarantee left is
// dead money). Returns { cut: [players], ps: [players] }.
function cutdown(s, req, log) {
  if (!isPro(s.cls)) return null;
  const all = s.players.filter(p => !p.ir).concat(s.ps || []), ir = s.players.filter(p => p.ir);
  let { keep, rest } = pick53(all);
  // Your requests: keep a player on the 53, or let him go, if the GM goes along
  if (req) {
    req.keep.forEach(id => { const p = rest.find(x => x.id === id); if (!p) return; const yes = gmFollows(`cutkeep:${id}`); if (log) log.push({ yes, t: `Keep ${fullName(p)} on the roster: ${yes ? "he made the 53" : "the GM cut him"}` }); if (yes) { const out = keep.filter(x => x.pos === p.pos && !req.keep.includes(x.id)).sort((a, b) => ovr(a, a.pos) - ovr(b, b.pos))[0] || keep.filter(x => !req.keep.includes(x.id)).sort((a, b) => ovr(a, a.pos) - ovr(b, b.pos))[0]; if (out) { keep = keep.filter(x => x !== out).concat(p); rest = rest.filter(x => x !== p).concat(out); } } });
    req.go.forEach(id => { const p = keep.find(x => x.id === id); if (!p) return; const yes = gmFollows(`cutgo:${id}`); if (log) log.push({ yes, t: `Let ${fullName(p)} go: ${yes ? "he was cut" : "the GM kept him"}` }); if (yes) { keep = keep.filter(x => x !== p); rest = rest.filter(x => x !== p); const fill = rest.filter(x => x.pos === p.pos).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos))[0] || rest.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos))[0]; if (fill) { keep.push(fill); rest = rest.filter(x => x !== fill); } s.dead = (s.dead || 0) + (p.ct ? p.ct.g || 0 : 0); } });
  }
  const { ps, rest: gone } = pickPS(rest);
  ps.forEach(p => { if (!p.ct || capHit(p) < PS_PAY || !p.ct.rk) p.ct = makeContract(PS_PAY, 1, { g: 0 }); });
  const deadBefore = s.dead || 0;
  s.players = keep.concat(ir); s.ps = ps;
  gone.forEach(p => { s.dead = (s.dead || 0) + (p.ct ? p.ct.g || 0 : 0); });
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  return { cut: gone, ps, dead: (s.dead || 0) - deadBefore };
}

// With control of the roster and the staff's cuts turned off, you cut to 53 yourself; the end of camp
// only trims the practice squad to 16
function cutdownManual(s) {
  const extra = (s.ps || []).slice().sort((a, b) => ovr(a, a.pos) - ovr(b, b.pos)).slice(0, Math.max(0, (s.ps || []).length - PS_MAX));
  extra.forEach(p => cutPlayer(s, p));
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  return { cut: extra, ps: (s.ps || []).length, dead: 0 };
}

// The last week of camp waits for you to get to 53, when cuts are yours
function cutWait() {
  if (!inPros() || !SEASON.myId || SEASON.camp < SEASON.pre) return false;
  const J = CAREER && CAREER.job;
  return !!(J && J.ctl && J.staff && !J.staff.cut && onActive(mySchool()).length > PRO_ACTIVE);
}

/* ---------- Moves you make yourself (with control of the roster) ---------- */
// Releasing a player: his guarantee left is dead money now. Practice squad moves: a player with two
// seasons or fewer (or one of six veterans) can go down, and anyone on it can come up to the 53.
const psEligible = (s, p) => (p.exp || 0) <= 2 || teamPS(s).filter(q => (q.exp || 0) > 2).length < PS_VETS;
function releasePlayer(s, id) {
  const p = playerById(s, id);
  if (!p) return null;
  const dead = cutPlayer(s, p);
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  return { p, dead };
}
function toPracticeSquad(s, id) {
  const p = s.players.find(x => x.id === id);
  if (!p || p.ir || (s.ps || []).length >= PS_MAX || !psEligible(s, p)) return false;
  s.players = s.players.filter(x => x !== p);
  const dead = p.ct ? p.ct.g || 0 : 0;
  s.dead = (s.dead || 0) + dead;
  p.ct = makeContract(PS_PAY, 1, { g: 0 });
  (s.ps = s.ps || []).push(p);
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  return true;
}
function toRoster(s, id) {
  const p = (s.ps || []).find(x => x.id === id);
  if (!p || (onActive(s).length >= PRO_ACTIVE && !inCamp())) return false;
  s.ps = s.ps.filter(x => x !== p);
  p.ct = makeContract(proMin(p.exp), 1, { g: 0 });
  s.players.push(p);
  s.depth = autoDepth(s); s.rating = schoolRating(s);
  return true;
}

/* ---------- A team's year ---------- */
// At the end of a season, for every team: everyone a year older (growing or declining), retirements,
// contracts a year shorter, expiring contracts kept or let go, and the roster filled back to camp
// size with rookies and young players off the street. Then the team gets under the cap.
// s: a team in full. Returns what happened: { retired, left, kept, rookies, grew }.
// req: your requests to the GM, for your team (pworld.js: myReq), and log: where his answers go
function proTeamYear(s, year, rng, mine, rookies, oldCap, req, log) {
  const out = { retired: [], left: [], kept: [], rookies: [], grew: [], freed: [] };
  // Last year's unused cap space carries over (up to $30 million, in 2026 dollars)
  const carry = Math.max(0, Math.min((oldCap || capNow()) + (s.carry || 0) - capUsed(s), 30e6 * capScale()));
  const all = s.players.concat(s.ps || []);
  all.forEach(p => { delete p.ir; delete p.up; if (p.inj && p.inj.w < 50) delete p.inj; });
  const before = {};
  all.forEach(p => { before[p.id] = ovr(p, p.pos); proAgeYear(p, s.coach.dev, rng, mine); if (p.inj) delete p.inj; });
  // Retirements
  const stay = all.filter(p => { if (retires(p, rng)) { out.retired.push(p); return false; } return true; });
  // Contracts a year shorter: what was paid comes off the guarantee
  const lastPay = {};
  stay.forEach(p => { if (!p.ct) return; const paid = p.ct.y.shift() || 0; lastPay[p.id] = paid; p.ct.g = Math.max(0, (p.ct.g || 0) - paid); });
  // Expiring contracts, within the money left: the team keeps the players it wants most, best first
  // (a new contract at what he's worth, or, with fewer than four seasons, a year at his pay plus 10
  // percent), and the rest leave
  (rookies || []).forEach(p => { out.rookies.push(p); });
  const signed = stay.filter(p => p.ct && p.ct.y.length).concat(out.rookies);
  let budget = (oldCap ? capNow() : capNow()) + carry - signed.reduce((t, p) => t + capHit(p), 0) - 30 * proMin(0);
  const ranked = stay.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)), wantN = 46;
  stay.filter(p => !(p.ct && p.ct.y.length)).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).forEach(p => {
    let wanted = ranked.indexOf(p) < wantN && ovr(p, p.pos) >= 60;
    const ct = (p.exp || 0) < 4 ? makeContract(Math.max(proMin(p.exp), Math.round((lastPay[p.id] || proMin(p.exp)) * 1.1 / 5000) * 5000), 1, { g: 0 }) : marketContract(p, rng);
    // Your requests: a player you asked to keep, or to let go, if the GM goes along
    if (req && (req.keep.includes(p.id) || req.go.includes(p.id))) {
      const keep = req.keep.includes(p.id), yes = gmFollows(`${keep ? "keep" : "go"}:${p.id}`) && !(keep && ct.y[0] > budget + 20 * proMin(0));
      if (log) log.push({ yes, t: `${keep ? "Keep" : "Let go"} ${fullName(p)}: ${yes ? (keep ? `re-signed, ${proContractText({ ct })}` : "his contract ran out and he's gone") : keep ? (ct.y[0] > budget + 20 * proMin(0) ? "there wasn't the money" : "the GM let him go") : "the GM kept him"}` });
      if (yes) wanted = keep;
      else wanted = !keep && wanted;
    }
    if (!wanted || ct.y[0] > budget + (req && req.keep.includes(p.id) ? 20 * proMin(0) : 0)) { delete p.ct; out.left.push(p); return; }
    p.ct = ct; budget -= ct.y[0];
    out.kept.push(p);
  });
  const left = new Set(out.left);
  let team = stay.filter(p => !left.has(p)).concat(out.rookies);
  // Young players off the street, to about 80 in camp
  const g = dice(hashSeed(`${s.seed}:${year}:street`));
  let k = 0;
  while (team.length < 80) { const need = Object.keys(ROSTER_MIX).sort((a, b) => team.filter(p => p.pos === a).length / ROSTER_MIX[a] - team.filter(p => p.pos === b).length / ROSTER_MIX[b])[0]; team.push(streetPlayer(g, `${s.id}y${year}n${k++}`, CLASS_LEVEL.PRO - 6, need)); }
  s.players = team; s.ps = [];
  // Last year's unused cap space carries over, and the new year starts with no dead money
  s.carry = carry; s.dead = 0;
  out.grew = team.filter(p => before[p.id] != null && ovr(p, p.pos) > before[p.id]).map(p => [p.id, before[p.id], ovr(p, p.pos)]).sort((a, b) => (b[2] - b[1]) - (a[2] - a[1]));
  return out;
}
// Over the cap: the team lets go of the players who cost the most for what they do, cheapest dead
// money first, until it fits (only veterans, never below 53)
function getUnderCap(s) {
  const freed = [];
  for (let guard = 0; guard < 40 && capRoom(s) < 0; guard++) {
    const cand = s.players.filter(p => !p.ct || !p.ct.rk).map(p => ({ p, save: capHit(p) - (p.ct ? p.ct.g || 0 : 0), over: capHit(p) - proValue(p) })).filter(x => x.save > 0).sort((a, b) => b.over - a.over || b.save - a.save)[0];
    if (!cand || s.players.length <= PRO_ACTIVE) break;
    cutPlayer(s, cand.p); freed.push(cand.p);
  }
  return freed;
}

/* ---------- Rookie contracts ---------- */
// Each drafted rookie gets a four-year contract by where he was picked: the 2026 scale, about $54.6
// million over four years for the first pick, $16.1 million for the last of the first round, and
// $4.4 million for the last pick of the draft (pdraft.js).
function rookieScale(pick) {
  const total = pick <= 32 ? 54.6e6 - (54.6e6 - 16.1e6) * (pick - 1) / 31 : Math.max(4.4e6, 16.1e6 * Math.pow(pick / 32, -.75));
  return Math.round(total * capScale() / 4 / 5000) * 5000;
}
