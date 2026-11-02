// Friday to Sunday: the high school job market. What each school expects before a season, the
// season's grade against it, and your reputation.
"use strict";

/* ---------- Expectations ---------- */
// When a season opens, each class's season is played on paper 200 times from the schools' ratings,
// with the real schedule, and each school's averages are its expectation (SEASON.exp):
// { w: regular-season wins, pw: playoff wins, po, dt, ch: the chances of a playoff spot, the district
// title and the state title }. Because it uses the schedule, a weak district is expected to win more.
const EXPECT_SIMS = 200;
// The chance the home team wins a quick sim it's expected to win by m points (quick sims are close
// to a normal curve with a spread of 13.6 points)
const MARGIN_SD = 13.6;
function erfApprox(x) {
  const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const winProb = m => .5 * (1 + erfApprox(m / (MARGIN_SD * Math.SQRT2)));
// The schedule a class plays: yours is the season's, the others' are made from the season's seed
// (the same one their season on paper uses)
const paperSchedule = cls => makeSchedule(classDistricts(cls), dice(hashSeed(`${SEASON.seed}:${cls}:schedule`)));
const classSchedule = cls => cls === SEASON.cls ? SEASON.weeks : paperSchedule(cls);
function expectClass(cls) {
  const ds = classDistricts(cls), ids = ds.flatMap(d => d.ids), at = {}, N = ids.length;
  ids.forEach((id, i) => { at[id] = i; });
  const games = [];
  classSchedule(cls).forEach(w => w.games.forEach(gm => { const [mh, ma] = expectedPoints(gm.h, gm.a, gm.neutral); games.push([at[gm.h], at[gm.a], winProb(mh - ma), gm.dist]); }));
  // Playoff games: at a neutral site, from the two schools' ratings
  const po = (i, j) => { const [a, b] = expectedPoints(ids[i], ids[j], true); return winProb(a - b); };
  const sum = { w: new Float64Array(N), pw: new Float64Array(N), po: new Float64Array(N), dt: new Float64Array(N), ch: new Float64Array(N) };
  const rng = seededRandom(hashSeed(`${SEASON.seed}:${cls}:expect`));
  for (let sim = 0; sim < EXPECT_SIMS; sim++) {
    const w = new Int8Array(N), dw = new Int8Array(N), key = Float64Array.from({ length: N }, () => rng());
    games.forEach(([h, a, p, dist]) => { const win = rng() < p ? h : a; w[win]++; if (dist) dw[win]++; });
    // District standings: district wins, then all wins, then a coin flip
    const top = {};
    ds.forEach(d => { top[d.n] = d.ids.map(id => at[id]).sort((x, y) => dw[y] - dw[x] || w[y] - w[x] || key[y] - key[x]).slice(0, 2); });
    let field = BRACKET_ORDER.map(([d, place]) => top[d][place - 1]);
    field.forEach((i, k) => { sum.po[i]++; if (BRACKET_ORDER[k][1] === 1) sum.dt[i]++; });
    while (field.length > 1) {
      const next = [];
      for (let k = 0; k < field.length; k += 2) { const x = field[k], y = field[k + 1], win = rng() < po(x, y) ? x : y; sum.pw[win]++; next.push(win); }
      field = next;
    }
    sum.ch[field[0]]++;
    for (let i = 0; i < N; i++) sum.w[i] += w[i];
  }
  const r2 = v => Math.round(v / EXPECT_SIMS * 100) / 100, out = {};
  ids.forEach((id, i) => { out[id] = { w: r2(sum.w[i]), pw: r2(sum.pw[i]), po: r2(sum.po[i]), dt: r2(sum.dt[i]), ch: r2(sum.ch[i]) }; });
  return out;
}
// Every school's expectation for this season (or just one class's, when only it has changed)
function setExpectations(cls) {
  SEASON.exp = SEASON.exp || {};
  (cls ? [cls] : CLASSES).forEach(c => Object.assign(SEASON.exp, expectClass(c)));
  return SEASON.exp;
}
// A season from before expectations gets them from where the ratings stand now
const expectOf = id => (SEASON.exp && SEASON.exp[id]) || setExpectations()[id];
// "about 6-4 and a playoff spot"
function expectWords(e) {
  const w = clamp(Math.round(e.w), 0, REGULAR_WEEKS), rec = `about ${w}-${REGULAR_WEEKS - w}`;
  const more = e.ch >= .25 ? "a run at the state title" : e.dt >= .5 ? "the district title" : e.po >= .5 ? "a playoff spot" : e.po >= .25 ? "a shot at the playoffs" : "";
  return more ? `${rec} and ${more}` : rec;
}
// "Expected: about 6-4 and a playoff spot (6.1 wins)."
const expectText = e => `Expected: ${expectWords(e)} (${plural(Math.round(e.w * 10) / 10, "win")}).`;

/* ---------- The season grade ---------- */
// Wins against expected wins, half of playoff wins against expected playoff wins, and rewards that
// count whatever was expected: half a point for each playoff win, a point for a district title and a
// point and a half for a state title. A title season grades about +8, a strong season about +4.
const GRADE = { po: .5, pwin: .5, dist: 1, state: 1.5 };
function seasonGrade(r, e) {
  if (!r || !e) return 0;
  const g = (r.rw - e.w) + GRADE.po * (r.pw - e.pw) + GRADE.pwin * r.pw + GRADE.dist * r.dt + GRADE.state * r.ch;
  return Math.round(g * 10) / 10;
}
const gradeWord = g => g >= 6 ? "a season to remember" : g >= 3 ? "far above expectations" : g >= 1 ? "above expectations" : g > -1 ? "met expectations" : g > -3 ? "below expectations" : "far below expectations";
// "+2.3" or "-1.0"
const signed = n => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}`;
// Every school's grade goes with its result when the state's season is over
function gradeState(res) {
  for (const id in res) res[id].g = seasonGrade(res[id], expectOf(id));
  return res;
}

/* ---------- Reputation ---------- */
// 0 to 100. A new coach starts at 20. Each season it moves by 3 times the grade, times the class's
// stage: a bigger class is a bigger stage. A bad season costs only half the stage's extra.
const REP_START = 20, REP_PER = 3;
const STAGE = { "1A": 1, "2A": 1.15, "3A": 1.3, "4A": 1.45, "5A": 1.6, "6A": 1.75 };
function repChange(g, cls) {
  const st = STAGE[cls] || 1;
  return Math.round(REP_PER * g * (g >= 0 ? st : 1 + (st - 1) / 2) * 10) / 10;
}
const newRep = (rep, g, cls) => clamp(Math.round((rep + repChange(g, cls)) * 10) / 10, 0, 100);
const repWord = r => r >= 85 ? "a legend" : r >= 70 ? "one of the state's best" : r >= 55 ? "a proven winner" : r >= 40 ? "a respected coach" : r >= 25 ? "a rising name" : "an unknown";
const myRep = () => CAREER && CAREER.rep != null ? CAREER.rep : REP_START;
// "Reputation 27: a rising name."
const repText = r => `Reputation ${Math.round(r)}: ${repWord(r)}.`;
// Your season goes into your reputation once, when it's over. Returns the career's entry for it.
function gradeMySeason(entry) {
  const me = SEASON.myId, r = finishState()[me], e = expectOf(me), g = r.g != null ? r.g : seasonGrade(r, e);
  const before = myRep(), after = newRep(before, g, SEASON.cls);
  CAREER.rep = after;
  return Object.assign(entry, { cls: SEASON.cls, g, ew: e.w, rep: after, drep: Math.round((after - before) * 10) / 10 });
}
// What the grade was made of: "Expected about 6-4 and a playoff spot; you won 8 games and 1 playoff game, and the district title."
function gradeWhy(r, e) {
  const bits = [`won ${plural(r.rw, "regular-season game")}`];
  if (r.pw) bits.push(plural(r.pw, "playoff game"));
  const titles = [r.dt ? "the district title" : "", r.ch ? "the state title" : ""].filter(Boolean);
  return `Expected ${expectWords(e)}. You ${andList(bits)}${titles.length ? `, and ${andList(titles)}` : ""}.`;
}
