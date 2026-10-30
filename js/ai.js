// Friday to Sunday: scouting and the computer coordinator (from Gridiron Duel, with each team's coach
// in place of the difficulty setting, and kicking decisions that know their own kicker)
"use strict";

/* ---------- Scouting ---------- */
// Every snap is charted for both coaches: what the offense ran and what the defense played, by situation.
// Older snaps fade, so a coach who changes things up is noticed. Computer coordinators lean their calls
// toward whatever beats the opponent's habits, but never stop mixing, so a coach can counter them in turn.
const SCOUT_DECAY = .9;  // each new snap in a situation shrinks the weight of the older ones
// How fast a coach trusts a tendency, and how hard it counters, come from the coach's ratings (CP)
const scoutBucket = () => S.twoPt || S.toGo <= 3 ? "s" : S.toGo <= 7 ? "m" : "l";
const BUCKET_TEXT = { s: "short yardage", m: "medium-yardage downs", l: "long-yardage downs" };
function scoutOf(t) {
  S.scout = S.scout || [null, null];
  const s = S.scout[t] || (S.scout[t] = {});
  s.o = s.o || {}; s.d = s.d || {}; s.dp = s.dp || {};
  return s;
}
function bump(map, key, item) {
  const m = map[key] = map[key] || {};
  Object.keys(m).forEach(k => { m[k] *= SCOUT_DECAY; });
  m[item] = (m[item] || 0) + 1;
}
function scoutRecord() {
  if (isST(S.offPkg)) return;
  const b = scoutBucket(), opk = S.offPkg;
  if (OFFP[S.offCall] && S.offCall !== "hm") {
    const s = scoutOf(S.poss);
    bump(s.o, b, S.offCall); bump(s.o, b + "|" + opk, S.offCall); bump(s.o, "*", S.offCall);
  }
  if (DEF_IDS.includes(S.defCall)) {
    const s = scoutOf(1 - S.poss);
    bump(s.d, b, S.defCall); bump(s.d, "*", S.defCall);
    if (DEF_PKGS[S.defPkg]) { bump(s.dp, b, S.defPkg); bump(s.dp, b + "|" + opk, S.defPkg); }
  }
}
// Blend charted situations (most specific first) into shares that add up to 1, plus how much coach
// t trusts them
function tendency(map, keys, t) {
  const f = {}; let n = 0;
  keys.forEach(([k, wt]) => { const m = map[k]; if (!m) return; for (const id in m) { f[id] = (f[id] || 0) + m[id] * wt; n += m[id] * wt; } });
  if (n < .5 || !CP(t).scout) return null;
  for (const id in f) f[id] /= n;
  return { f, conf: n / (n + CP(t).prior) };
}
const adaptMul = (e, t) => clamp(Math.exp(CP(t).adapt * e), .2, 5);
const clashFor = (off, opk, dpk) => { const cl = ((CLASH[opk] || {})[dpk]) || { run: 0, pass: 0 }; return OFFP[off].kind === "run" ? cl.run : cl.pass; };
// The offense's habits in this situation, given the personnel they just sent out, as the defense sees them
const offTend = () => tendency(scoutOf(S.poss).o, [[scoutBucket() + "|" + S.offPkg, 1], [scoutBucket(), .5], ["*", .15]], 1 - S.poss);
const topOf = f => Object.keys(f).sort((a, b) => f[b] - f[a])[0];

/* ---------- Computer coordinator ---------- */
// Lean on the run: tuned in Gridiron Duel so the computer runs on about 40% of its calls in a pro game
const RUN_BIAS = 3.3;
// Small schools run more. Each team also leans toward whatever its players do best: a team with a
// good back and a weak passer runs more, and the reverse.
const LEVEL_RUN = { hs: 2.2, pro: 1 };
function runLean(t) {
  const tm = S.teams[t];
  if (tm.rl == null) {
    const u = unitRatings(tm), run = (u.rb + u.runBlock) / 2, pass = (u.qb * 2 + u.wr + u.passPro) / 4;
    tm.rl = RUN_BIAS * (LEVEL_RUN[S.cfg.level] || 1) * clamp(Math.exp(.04 * (run - pass)), .55, 1.8);
  }
  return tm.rl;
}
// Team identity: the computer leans into its own style and away from what the other side's style does well
const STYLE_LEAN = 1.1, STYLE_COUNTER = .6;
function mixOf(ids, f) { const w = {}; let n = 0; ids.forEach(id => { w[id] = Math.exp(STYLE_LEAN * f(id)); n += w[id]; }); for (const id in w) w[id] /= n; return w; }
// How a defense with this style tends to call it, and how an offense with this style tends to call it
const defStyleMix = s => mixOf(DEF_IDS, d => ((DEF_STYLES[s] || DEF_STYLES.bal).calls || {})[d] || 0);
const offStyleMix = s => mixOf(OFF_IDS, p => offStyleEdge(p, s));
function cpuOffStyle(w) {
  const me = S.poss, os = offStyleOf(me), ds = defStyleOf(1 - me), mx = defStyleMix(ds), mx0 = defStyleMix("bal");
  Object.keys(w).forEach(k => {
    if (!M[k]) return;
    let e = 0, e0 = 0;
    for (const d in mx) e += mx[d] * (M[k][d] - defStyleEdge(k, d, ds));
    for (const d in mx0) e0 += mx0[d] * (M[k][d] - defStyleEdge(k, d, "bal"));
    w[k] *= clamp(Math.exp(STYLE_LEAN * (offStyleEdge(k, os) - offStyleEdge(k, "bal")) + STYLE_COUNTER * CP(me).counter * (e - e0)), .3, 3);
  });
}
function cpuDefStyle(w) {
  const ds = defStyleOf(1 - S.poss), os = offStyleOf(S.poss), q = offStyleMix(os), q0 = offStyleMix("bal");
  DEF_IDS.forEach(d => {
    let e = 0, e0 = 0;
    for (const p in q) e += q[p] * M[p][d];
    for (const p in q0) e0 += q0[p] * M[p][d];
    w[d] *= clamp(Math.exp(STYLE_LEAN * (((DEF_STYLES[ds].calls) || {})[d] || 0) - STYLE_COUNTER * CP(1 - S.poss).counter * (e - e0)), .3, 3);
  });
}
function cpuOffPkg() {
  const diff = S.teams[S.poss].score - S.teams[1 - S.poss].score, late = S.quarter >= 4 && S.clock <= 180 && !noClock();
  let w;
  if (S.twoPt) w = { p11: 2, p12: 2, p13: 1, jumbo: 1, p10: 1 };
  else if (S.toGo <= 1) w = { jumbo: 3, p13: 2, p21: 2, p12: 1 };
  else if (late && diff < 0) w = { p10: 3, p11: 4 };
  else if (S.toGo <= 3) w = { p12: 3, p21: 2, p13: 1, p11: 2, jumbo: .5 };
  else if (S.toGo >= 8) w = { p10: 3, p11: 5, p12: 1 };
  else w = { p11: 5, p12: 2, p21: 1, p10: 1, p13: .7 };
  // Send out the personnel that matches up best with the packages this defense has been using here
  const dp = scoutOf(1 - S.poss).dp, b = scoutBucket();
  Object.keys(w).forEach(pk => {
    const t = tendency(dp, [[b + "|" + pk, 1], [b, .4]], S.poss); if (!t) return;
    let e = 0;
    for (const d in t.f) { const cl = ((CLASH[pk] || {})[d]) || { run: 0, pass: 0 }; e += t.f[d] * Math.max(cl.run, cl.pass); }
    w[pk] *= clamp(Math.exp(.6 * t.conf * e), .3, 4);
  });
  return wpick(w);
}
function cpuDefPkg() {
  const w = ({ p10: { dime: 3, nickel: 3, base: .3 }, p11: { nickel: 5, base: 1.5, dime: 1 }, p12: { base: 4, nickel: 2 },
    p21: { base: 5, nickel: 1 }, p13: { base: 4, goal: 1 }, jumbo: { goal: 3, base: 2 },
    punt: { base: 3, nickel: 1 }, fgu: { base: 2, goal: 2 } })[S.offPkg || "p11"];
  const x = Object.assign({ base: 0, nickel: 0, dime: 0, goal: 0 }, w);
  if (S.toGo >= 8) { x.dime += 2; x.nickel += 1; x.goal = 0; }
  if (S.spot >= 95 || S.twoPt) x.goal += 2;
  if (S.toGo <= 1) x.goal += 1.5;
  // Match the package to what this offense actually runs from this personnel, not just the down and distance
  const t = !isST(S.offPkg) && offTend();
  if (t) Object.keys(x).forEach(pk => {
    let e = 0;
    for (const p in t.f) e += t.f[p] * pkgEdge(p, S.offPkg, pk);
    x[pk] = (x[pk] + .2) * adaptMul(-t.conf * e, 1 - S.poss);
  });
  return wpick(x);
}
// Scale play weights by how well each play suits the chosen package
function fitWeights(w) {
  const f = PKG_FIT[S.offPkg] || {};
  Object.keys(w).forEach(k => { w[k] *= Math.max(.12, 1 + .45 * (f[k] || 0)); });
  if (S.offPkg === "jumbo") w.te = 1.2;
  return w;
}
// Kicks and fourth downs, with this team's own kicker in mind
function cpuKickCall() {
  const me = S.poss, diff = S.teams[me].score - S.teams[1 - me].score;
  const late = S.quarter >= 4 && S.clock <= 180 && !noClock();
  const kd = kickDist(), fgP = fgAvailable() ? fgProbFor(me, kd) : 0;
  // High school overtime: no punts. A field goal on the second series when it's enough, on the first
  // series on 4th down.
  if (hsOT()) {
    const second = S.ot.ser === 2, need = S.teams[1 - me].score - S.teams[me].score;
    if (second && need <= 2 && fgP >= .5 && S.down >= 3) return "fg";
    if (S.down === 4 && ((second && need <= 2 && fgP >= .12) || (second && need === 3 && fgP >= .2) || (!second && fgP >= .3))) return "fg";
    return null;
  }
  // Pro overtime: trailing on the answering possession means giving the ball back loses the game
  const ot = S.quarter >= 5 ? S.ot : null;
  const lastChance = !!ot && ot.ph === 2 && me !== ot.a && diff < 0;
  const needTD = (late || lastChance) && diff < -3;
  // End of a half: kick it on any down rather than let the clock run out
  if (fgAvailable() && S.down < 4 && endHalfKick() && !needTD && fgP >= .3) return "fg";
  // Pro overtime walk-off: kick early only when it's close to automatic
  if (fgAvailable() && S.down < 4 && otFgWins() && (fgP >= .9 || (S.down === 3 && fgP >= .75))) return "fg";
  // Last snap of a half and out of field goal range: throw it up
  if (hailOK() && S.clock <= 8 && (S.quarter === 2 || diff <= 0) && !(fgP >= .3 && diff >= -3)) return "hm";
  if (S.down !== 4) return null;
  // Late and behind: a field goal when three points are enough, otherwise go for it
  if (lastChance || (late && diff < 0)) return !needTD && diff >= -3 && fgP >= .35 ? "fg" : null;
  // Fourth down. Small-school coaches go for it a lot more than the pros, and only kick when their
  // kicker is likely to make it.
  if (S.spot >= 80) {
    if (S.toGo <= 2 && fgP < .9) return null;
    if (S.toGo <= 5 && fgP < .75) return null;
    return fgP >= .5 ? "fg" : null;
  }
  if (S.spot >= 60) {
    if (S.toGo <= 2) return null;
    if (fgP >= .55) return "fg";
    if (S.toGo <= 4 && S.spot >= 65) return null;
  } else if (S.toGo <= 1 && S.spot >= 40) return null;
  // A rare fake when it's short yardage
  if (S.toGo <= 4 && rand() < .04) return S.spot < 62 || fgP < .3 ? "fp" : "ffg";
  return "punt";
}
function cpuOff() {
  if (S.twoPt) return wpick(fitWeights({ ir: 4, or: 1.5, sc: 1, sp: 3.5, ms: 2, dp: .3, pa: 2 }));
  if (kneelAvailable()) {
    const lead = S.teams[S.poss].score - S.teams[1 - S.poss].score;
    if (lead > 0 || (lead === 0 && S.spot < 50)) return "kneel";
  }
  const kick = cpuKickCall();
  if (kick) return kick;
  const me = S.poss, diff = S.teams[me].score - S.teams[1 - me].score;
  const late = S.quarter >= 4 && S.clock <= 180 && !noClock();
  const w = { ir: 3, or: 2, dr: .3, sc: 1.5, sp: 3, ms: 2, dp: 1.5, pa: 2 };
  if (sneakOK()) w.qs = 5;
  if (S.toGo >= 8) { w.ir = 1; w.or = 1; w.dr = .4; w.sc += 1; w.sp += 2; w.ms += 1; w.dp += 2; w.pa += 1; }
  if (S.toGo <= 2) { w.ir += 3; w.or += 1; w.dr = .3; w.dp = .7; }
  if (S.spot >= 88) { w.dp = .3; w.ir += 1; w.ms += 1; }
  if (late && diff < 0) { w.ir = .5; w.or = .5; w.dr = .2; w.dp += 2; w.sp += 1; w.ms += 1; }
  // Way ahead late: keep it on the ground and let the clock run
  if (S.quarter >= 4 && diff >= 17) { w.ir *= 2; w.or *= 1.5; w.dp *= .3; w.pa *= .5; }
  fitWeights(w);
  cpuOffStyle(w);
  const lean = late && diff < 0 ? RUN_BIAS : runLean(me);
  w.ir *= lean; w.or *= lean; w.dr *= lean;
  if (w.qs) w.qs *= Math.sqrt(lean);
  // Attack the defense's habits: its usual calls here, and the packages it sends out against this personnel
  const sc = scoutOf(1 - S.poss), b = scoutBucket();
  const td = tendency(sc.d, [[b, 1], ["*", .3]], me), tp = tendency(sc.dp, [[b + "|" + S.offPkg, 1], [b, .4]], me);
  const mul = {};
  Object.keys(w).forEach(k => {
    if (!M[k]) return;
    let e = 0;
    if (td) for (const d in td.f) e += td.conf * td.f[d] * M[k][d];
    if (tp) for (const pk in tp.f) e += tp.conf * tp.f[pk] * clashFor(k, S.offPkg, pk);
    w[k] *= (mul[k] = adaptMul(e, me));
  });
  const call = wpick(sharpen(w, me, true));
  if (td && mul[call] >= 2) {
    const top = topOf(td.f);
    if (td.f[top] >= .45 && M[call][top] >= 1) S.scoutNote = { side: "off", text: `Their offense has noticed you play ${DEFP[top].name} a lot on ${BUCKET_TEXT[b]}, and called ${OFFP[call].name} to beat it.` };
  }
  return call;
}
// Computer offenses work the sideline when they need to stop the clock
function cpuSide(id) {
  if (!sidelineOK() || !sideOn(id)) return false;
  const diff = S.teams[S.poss].score - S.teams[1 - S.poss].score;
  if (S.quarter >= 4 && diff <= 0) return rand() < .8;
  if (S.quarter === 2) return rand() < .6;
  return false;
}
function cpuDef() {
  // The kicking unit ran on: usually set up the return or go after the kick. Staying in a real
  // defense guards against the fake. Against regular personnel on 4th down they know it's a go.
  if (isST(S.offPkg)) {
    const x = rand(), fakeRisk = S.toGo <= 3 ? .1 : 0;
    if (S.offPkg === "punt") { if (x < .58 - fakeRisk) return "ret"; if (x < .72 - fakeRisk) return "blk"; }
    else if (x < .18 - fakeRisk / 2) return "blk";
  }
  const dt = 1 - S.poss;
  const w = { rb: 2, ba: 3, ma: 2, zo: 2, c3: 2, pr: 1, ab: 1, zb: 1 };
  if (S.toGo >= 8) { w.rb = .7; w.pr = 2.5; w.zo = 3; w.ab = 1.5; w.c3 = 2.5; w.zb = 1.5; }
  if (S.toGo <= 2) { w.rb = 4; w.ba = 3; w.pr = .3; w.c3 = 1.5; w.zb = .5; }
  if (S.spot >= 88) { w.pr = .2; w.ab = 2; w.zb = 1.5; }
  // Last snap of a half with the offense out of range: drop everyone deep for the Hail Mary
  if (hailOK() && S.clock <= 8 && !fgAvailable()) { w.pr += 6; w.zo += 1; }
  // Sit on the sideline when the offense needs to stop the clock
  if (sidelineOK() && S.teams[S.poss].score <= S.teams[dt].score && (S.quarter >= 4 || S.quarter === 2)) w.zo += 1.5;
  cpuDefStyle(w);
  // Take away what this offense keeps running in this situation
  const t = !isST(S.offPkg) && offTend(), mul = {};
  if (t) DEF_IDS.forEach(d => {
    let e = 0;
    for (const p in t.f) e += t.f[p] * (M[p][d] || 0);
    w[d] = (w[d] + .15) * (mul[d] = adaptMul(-t.conf * e, dt));
  });
  const call = wpick(sharpen(w, dt, false));
  if (t && mul[call] >= 2) {
    const top = topOf(t.f);
    if (t.f[top] >= .45 && (M[top][call] || 0) <= -1) S.scoutNote = { side: "def", text: `The defense has seen a lot of ${OFFP[top].name} from you on ${BUCKET_TEXT[scoutBucket()]}, and called ${DEFP[call].name} to stop it.` };
  }
  return call;
}
// Point after: kick or go for two. The chart for the score late in the game, the kicker for the rest.
// A small school with a shaky kicker goes for two.
const TWO_P = .42; // about how often a high school two-point try from the 3 is good
function cpuPAT() {
  const t = S.patTeam, diff = S.teams[t].score - S.teams[1 - t].score, xp = fgProbFor(t, xpDist(R().tryTwo));
  if (hsOT()) {
    // The second series: tied after the touchdown, either one wins it; down 1, the kick only ties
    if (S.ot.ser === 2) { if (diff === 0) return xp >= .55 ? "kick" : "two"; if (diff === -1) return xp * .5 >= TWO_P ? "kick" : "two"; return "two"; }
    return xp >= .7 ? "kick" : "two";
  }
  if (S.quarter >= 4 && (diff === -2 || diff === 1 || diff === -5)) return "two";
  return xp >= .66 ? "kick" : "two";
}
// After a penalty moved the try: go for two only if it's still a decent bet from there
function cpuTry(c) {
  const wantTwo = cpuPAT() === "two", p2 = Math.max(.15, TWO_P + .02 - (R().tryTwo - c.spot) * .025);
  return wantTwo && p2 >= .25 ? "two" : "kick";
}
