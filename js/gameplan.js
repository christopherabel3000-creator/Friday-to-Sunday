// Friday to Sunday: the weekly game plan (Milestone 8). Each week you feature a few plays and calls
// for this opponent, and lean each situation (short, medium and long yardage) one way. The team
// practices the plan, so a featured play is a little sharper when you call it. Film study sets how
// many count. Computer coaches plan too, against your habits. See "Milestone 8" in DESIGN.md.
"use strict";

const GP_EDGE = .06;          // a featured play or call, on the play-call scale, when it's called
const GP_MAX = 4;             // featured plays a side, at most
const GP_N = [0, 2, 3, 4];    // how many count, by the week's film study (none, light, full, heavy)
const GP_LEAN_AT = 3;         // situation leans need a heavy week of film
const GP_SWAPS = 2;           // featured plays you can swap at halftime
const GP_KNOWN = 40;          // a play still "new" gets no featured edge
const GP_LEANS = { off: [["run", "Run"], ["bal", "Balanced"], ["pass", "Pass"]], def: [["press", "Pressure"], ["bal", "Balanced"], ["cover", "Coverage"]] };
const GP_BUCKETS = [["s", "Short yardage"], ["m", "Medium yardage"], ["l", "Long yardage"]];
const newLeans = () => ({ off: { s: "bal", m: "bal", l: "bal" }, def: { s: "bal", m: "bal", l: "bal" } });

/* ---------- Plans ---------- */
// The plays a team can feature on a side: its playbook, base and scheme (not the special plays).
// tm: a school or a team in a game (both have off, def and mastery); lvl: "hs", "col" or "pro".
const planIds = (tm, side, lvl) => side === "off" ? OFF_IDS.concat(schemePlaysAt(tm.off, lvl)) : DEF_IDS.concat(schemeCallsAt(tm.def, lvl));
const planMastery = (tm, id) => ((tm.mastery || {})[id] ?? MASTERY_BASE);
// The plays a team knows best, best first (ties in playbook order)
function bestKnown(tm, side, lvl, n) {
  const ids = planIds(tm, side, lvl);
  return ids.map((id, i) => [id, planMastery(tm, id), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).slice(0, n).map(x => x[0]);
}
// The staff's plan, before your first game: the plays the team knows best on each side
function staffPlan(s) {
  fillSchemes(s);
  const lvl = schoolLvl(s);
  return { off: bestKnown(s, "off", lvl, GP_MAX), def: bestKnown(s, "def", lvl, GP_MAX), lean: newLeans() };
}
// Your plan: the one you used last (kept to your playbook as it is now), or the staff's before your first game
function myPlan() {
  const s = mySchool(), lvl = schoolLvl(s);
  // (in camp there's no game yet: the staff's plan is worked out at the first game week)
  if (!SEASON.gplan) { if (inCamp()) return staffPlan(s); SEASON.gplan = staffPlan(s); }
  const p = SEASON.gplan;
  ["off", "def"].forEach(sd => { const ok = new Set(planIds(s, sd, lvl)); p[sd] = (p[sd] || []).filter(id => ok.has(id)).slice(0, GP_MAX); });
  p.lean = p.lean || newLeans();
  return p;
}
// The plan a team takes into a game: the plays picked first, as many as the film study allows, and
// the leans with a heavy week. side: "off", "def", or both when it's left out.
function gamePlanOf(p, prepLv, side) {
  const n = GP_N[clamp(prepLv || 0, 0, 3)];
  return { off: side === "def" ? [] : (p.off || []).slice(0, n), def: side === "off" ? [] : (p.def || []).slice(0, n), lean: prepLv >= GP_LEAN_AT ? clone(p.lean || newLeans()) : null, n, swaps: 0 };
}
// How many plays a computer coach features: more with a better scout
const cpuPlanN = coach => { const v = (coach && coach.sct) || 42; return v >= 55 ? 4 : v >= 40 ? 3 : 2; };
// A computer coach's plan: the plays that beat the other team's habits (from its film), among the
// ones his team knows; with no film, the ones his team knows best
function cpuPlan(tm, lvl, film, n) {
  const pick = side => {
    const habits = film ? filmShares(film, side === "off" ? "d" : "o", "*") : [];
    const ids = planIds(tm, side, lvl).filter(id => planMastery(tm, id) >= GP_KNOWN);
    if (!habits.length) return bestKnown(tm, side, lvl, n);
    const top = habits.slice(0, 3), val = id => top.reduce((v, [h, w]) => v + w * (side === "off" ? M[id][h] : -M[h][id]), 0) + planMastery(tm, id) / 1000;
    return ids.map((id, i) => [id, val(id), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).slice(0, n).map(x => x[0]);
  };
  return { off: pick("off"), def: pick("def"), lean: null, n, swaps: 0 };
}
// Shares of a film's calls in one situation ("*" for all of them), biggest first: [[id, share]]
function filmShares(film, kind, key) {
  const m = ((film || {})[kind] || {})[key] || {}, tot = Object.values(m).reduce((a, b) => a + b, 0);
  if (!tot) return [];
  return Object.keys(m).filter(id => kind === "o" ? !!OFFP[id] : isDefCall(id)).map(id => [id, m[id] / tot]).sort((a, b) => b[1] - a[1]);
}

/* ---------- In a game ---------- */
// S.teams[t].gp: { off: [ids], def: [ids], lean: null or { off: { s, m, l }, def: { s, m, l } }, n, swaps }
const featured = (t, side, id) => { const p = S && S.teams && S.teams[t].gp; return !!(p && (p[side] || []).includes(id)); };
// The edge on a snap (positive favors the offense): a featured play that's known well enough
const planEdge = (o, off, def) => (featured(o, "off", off) && masteryOf(o, off) >= GP_KNOWN ? GP_EDGE : 0) - (featured(1 - o, "def", def) && masteryOf(1 - o, def) >= GP_KNOWN ? GP_EDGE : 0);
// The lean for this situation, for team t's side
const leanNow = (t, side) => { const p = S.teams[t].gp; return p && p.lean ? p.lean[side][scoutBucket()] : "bal"; };
const leanFits = (id, side, lean) => side === "off" ? (lean === "run" ? OFFP[id].kind === "run" : lean === "pass" ? OFFP[id].kind === "pass" : false)
  : (lean === "press" ? isBlitz(id) : lean === "cover" ? (DEFP[id] || {}).tag === "Coverage" : false);
// The computer (and your coach, in a sim) calls the featured plays more, and follows the leans
const GP_CALL = 1.6, GP_LEAN_W = 1.4, GP_OFF_LEAN = .8;
function planWeights(w, t, side) {
  const p = S.teams[t].gp;
  if (!p) return w;
  const lean = leanNow(t, side);
  Object.keys(w).forEach(id => {
    if (side === "off" ? !OFFP[id] : !isDefCall(id)) return;
    if ((p[side] || []).includes(id)) w[id] *= GP_CALL;
    if (lean !== "bal") w[id] *= leanFits(id, side, lean) ? GP_LEAN_W : GP_OFF_LEAN;
  });
  return w;
}
// The call sheet: the featured plays you can call right now, with this situation's lean first
function planFirst(t, side, ids) {
  const p = S.teams[t].gp;
  if (!p) return [];
  const lean = leanNow(t, side), list = (p[side] || []).filter(id => ids.includes(id));
  return lean === "bal" ? list : list.filter(id => leanFits(id, side, lean)).concat(list.filter(id => !leanFits(id, side, lean)));
}
// Halftime: take a featured play off (free), or put one on (one of the two swaps)
function planSwap(t, side, id) {
  const p = S && S.teams && S.teams[t].gp;
  if (!p || S.phase !== "halftime") return "";
  const list = p[side] || (p[side] = []), i = list.indexOf(id);
  if (i >= 0) { list.splice(i, 1); return `${playName(id)} off the game plan.`; }
  if ((p.swaps || 0) >= GP_SWAPS) return "No swaps left.";
  if (list.length >= p.n) return `Already ${p.n} featured. Take one off first.`;
  if (!(side === "off" ? offBook(t) : defBook(t)).includes(id)) return "";
  list.push(id); p.swaps = (p.swaps || 0) + 1;
  return `${playName(id)} on the game plan. ${GP_SWAPS - p.swaps ? "One swap left." : "No swaps left."}`;
}

/* ---------- The week ---------- */
// Install focus: unless you picked your own, the featured plays still being learned get it, the
// least-known first (a coordinator's side only)
function planFocus() {
  if (!SEASON || !SEASON.myId) return [];
  const s = mySchool(), p = myPlan(), role = coordRole(), m = s.mastery || {};
  const ids = (role === "dc" ? [] : p.off).concat(role === "oc" ? [] : p.def).filter(id => (m[id] || 0) < 85);
  return ids.sort((a, b) => (m[a] || 0) - (m[b] || 0)).slice(0, 3);
}
const planWithFocus = plan => (plan.focus || []).length ? plan : Object.assign({}, plan, { focus: planFocus() });
// Your team's plan for this week's game, and the other team's (a coordinator plans his side; the
// head coach's staff plans the other side as a computer coach would)
function planGame(me) {
  const P = SEASON.practice, opp = S.teams[1 - me], lvl = gameLvl(), role = coordRole();
  const studied = P && P.film && P.opp === opp.id, lv = studied ? (P.prep || 0) : 0;
  const mine = gamePlanOf(myPlan(), lv, role === "oc" ? "off" : role === "dc" ? "def" : null);
  if (role) {
    const hc = cpuPlan(S.teams[me], lvl, null, GP_N[studied ? (P.prepHC || 0) : 0]);
    if (role === "oc") mine.def = hc.def; else mine.off = hc.off;
  }
  S.teams[me].gp = mine;
  opp.gp = cpuPlan(opp, lvl, SEASON.film, cpuPlanN(opp.coach));
}
// Both teams in a game nobody's coaching (an exhibition, a full game simmed elsewhere): computer plans
function planBoth(film) { [0, 1].forEach(t => { S.teams[t].gp = cpuPlan(S.teams[t], gameLvl(), film || null, cpuPlanN(S.teams[t].coach)); }); }

/* ---------- What they expect from you ---------- */
// From your film: what the other coach will expect, situation by situation. side "off": your offense.
function expectLines(side) {
  const f = SEASON && SEASON.film, out = [];
  if (!f) return out;
  GP_BUCKETS.forEach(([b, nm]) => {
    const sh = filmShares(f, side === "off" ? "o" : "d", b);
    if (!sh.length) return;
    const top = sh[0], pct = x => Math.round(x * 100);
    if (side === "off") { const run = sh.filter(([id]) => OFFP[id].kind === "run").reduce((a, [, v]) => a + v, 0); out.push(`${nm}: they'll expect ${run >= .5 ? "a run" : "a pass"} (${pct(run >= .5 ? run : 1 - run)} percent), most of all ${playName(top[0])} (${pct(top[1])} percent).`); }
    else { const bl = sh.filter(([id]) => isBlitz(id)).reduce((a, [, v]) => a + v, 0); out.push(`${nm}: they'll expect ${bl >= .4 ? "pressure" : "coverage"} (${pct(bl >= .4 ? bl : 1 - bl)} percent), most of all ${playName(top[0])} (${pct(top[1])} percent).`); }
  });
  return out;
}
