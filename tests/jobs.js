// The high school job market: expectations, the season grade and reputation.
// Usage: node tests/jobs.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
const fresh = () => { const sb = load(); return { sb, g: sb.__get }; };
const near = (a, b, t) => Math.abs(a - b) <= (t || 1e-9);
const career = (g, seed) => g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(${seed}, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[2]);`);

// ---- Expectations ----
{
  const { g } = fresh();
  ok(near(g("winProb(0)"), .5) && near(g("winProb(8) + winProb(-8)"), 1) && near(g("winProb(8)"), .72, .02) && near(g("winProb(14)"), .85, .02), "win chances follow the quick sim's spread");
  career(g, 1234);
  const exp = g("SEASON.exp");
  ok(Object.keys(exp).length === 384, "every school in the state has an expectation when the season opens");
  ["1A", "3A", "6A"].forEach(c => {
    const es = g(`Object.keys(SEASON.schools).filter(id => SEASON.schools[id].cls === "${c}")`).map(id => exp[id]), t = k => es.reduce((n, e) => n + e[k], 0);
    ok(near(t("w"), 320, 1) && near(t("pw"), 15, .5) && near(t("po"), 16, .5) && near(t("dt"), 8, .5) && near(t("ch"), 1, .2), `${c}: expected wins, playoff spots and titles add up for the class`);
  });
  // Talent: the better a school's starters, the more it's expected to win
  const pairs = g(`Object.keys(SEASON.schools).filter(id => SEASON.schools[id].cls === "4A").map(id => [SEASON.schools[id].rating.off + SEASON.schools[id].rating.def, SEASON.exp[id].w])`);
  const mx = pairs.reduce((n, p) => n + p[0], 0) / pairs.length, my = pairs.reduce((n, p) => n + p[1], 0) / pairs.length;
  const cor = pairs.reduce((n, p) => n + (p[0] - mx) * (p[1] - my), 0) / Math.sqrt(pairs.reduce((n, p) => n + (p[0] - mx) ** 2, 0) * pairs.reduce((n, p) => n + (p[1] - my) ** 2, 0));
  ok(cor > .8, `more talent, more expected wins (correlation ${cor.toFixed(2)})`);
  // Strength of schedule: the same school is expected to win less in a tougher district
  const sos = g(`(() => { const e0 = expectClass("3A"), d = classDistricts("3A")[1], id = d.ids.slice().sort((a, b) => Math.abs(e0[a].w - 5) - Math.abs(e0[b].w - 5))[0], before = e0[id].w;
    d.ids.forEach(x => { if (x !== id) { SEASON.schools[x].rating.off += 5; SEASON.schools[x].rating.def += 5; } });
    const after = expectClass("3A")[id].w;
    d.ids.forEach(x => { if (x !== id) { SEASON.schools[x].rating.off -= 5; SEASON.schools[x].rating.def -= 5; } });
    return [before, after]; })()`);
  ok(sos[1] < sos[0] - 1, `a tougher district lowers a school's expectation (${sos[0]} wins, then ${sos[1]})`);
  ok(JSON.stringify(g(`expectClass("2A")`)) === JSON.stringify(g(`expectClass("2A")`)), "expectations are the same every time for the same season");
  // Words
  ok(g(`expectText({ w: 6.12, pw: .4, po: .6, dt: .3, ch: .02 })`) === "Expected: about 6-4 and a playoff spot (6.1 wins).", "an expectation in words");
  ok(g(`expectWords({ w: 9.3, pw: 2, po: .99, dt: .8, ch: .3 })`) === "about 9-1 and a run at the state title" && g(`expectWords({ w: 2.2, pw: 0, po: .05, dt: 0, ch: 0 })`) === "about 2-8", "from a title run to a long year");
  // Expectations are set when the season opens, and stay put
  const mine = g("SEASON.myId"), at0 = g(`SEASON.exp["${mine}"]`);
  g("simSeason(6)");
  ok(JSON.stringify(g(`SEASON.exp["${mine}"]`)) === JSON.stringify(at0), "your expectation doesn't change during the season");
}

// ---- The season grade ----
{
  const { g } = fresh();
  const grade = (r, e) => g(`seasonGrade(${JSON.stringify(r)}, ${JSON.stringify(e)})`);
  ok(grade({ rw: 9, pw: 4, dt: 1, ch: 1 }, { w: 7, pw: 1 }) === 8, "a title season grades about +8");
  ok(near(grade({ rw: 8, pw: 1, dt: 0, ch: 0 }, { w: 5, pw: .5 }), 3.8, .05), "three wins over and a playoff win: about +4");
  ok(grade({ rw: 5, pw: 0, dt: 0, ch: 0 }, { w: 5, pw: 0 }) === 0, "doing what was expected grades 0");
  ok(grade({ rw: 9, pw: 1, dt: 1, ch: 0 }, { w: 9, pw: 1 }) === 1.5, "a talented team that does what it should still gets credit for its titles and wins");
  ok(grade({ rw: 3, pw: 0, dt: 0, ch: 0 }, { w: 6, pw: .3 }) < -3, "three wins short is far below");
  const words = [[7, "a season to remember"], [3, "far above expectations"], [1.2, "above expectations"], [-.9, "met expectations"], [-1, "below expectations"], [-3, "far below expectations"]];
  ok(words.every(([v, w]) => g(`gradeWord(${v})`) === w), "the grade in words");
  ok(g("signed(2.34)") === "+2.3" && g("signed(-1)") === "−1.0" && g("signed(0)") === "0.0", "grades read with their sign");
}

// ---- Reputation ----
{
  const { g } = fresh();
  ok(g(`repChange(2, "1A")`) === 6 && g(`repChange(2, "6A")`) === 10.5, "a good season builds more reputation at a bigger class");
  ok(g(`repChange(-2, "1A")`) === -6 && near(g(`repChange(-1, "6A")`), -4.1, .05) && g(`repChange(-1, "6A")`) > g(`repChange(-1, "1A")`) * 1.5, "a bad season costs a little more at a bigger class, but only half the stage's extra");
  ok(g(`newRep(98, 5, "6A")`) === 100 && g(`newRep(3, -4, "1A")`) === 0, "reputation stays between 0 and 100");
  const words = [[0, "an unknown"], [25, "a rising name"], [40, "a respected coach"], [55, "a proven winner"], [70, "one of the state's best"], [85, "a legend"]];
  ok(words.every(([v, w]) => g(`repWord(${v})`) === w), "reputation in words");
  ok(g("myRep()") === 20, "a new coach starts at 20");
  // A whole season
  career(g, 777);
  g("simSeason()");
  const res = g("SEASON.results"), me = g("SEASON.myId"), last = g("CAREER.seasons[0]");
  ok(Object.values(res).every(r => typeof r.g === "number"), "every school in the state gets a grade");
  const gs = Object.values(res).map(r => r.g), mean = gs.reduce((a, b) => a + b, 0) / gs.length;
  ok(mean > 0 && mean < .6, `grades average a little over zero, from the titles and playoff wins (${mean.toFixed(2)})`);
  ok(last.g === res[me].g && last.cls === "1A" && last.ew === g(`SEASON.exp["${me}"].w`), "your season's grade goes into your career");
  ok(near(last.rep, g(`newRep(20, ${last.g}, "1A")`)) && near(g("CAREER.rep"), last.rep) && near(last.drep, last.rep - 20, .051), `and your reputation moves with it (${last.g} graded, reputation ${last.rep})`);
  ok(g("recordCareerSeason()") === false && g("CAREER.rep") === last.rep, "a season counts once");
  ok(/^Expected about \d+-\d+.*\. You won \d+ regular-season games?/.test(g(`gradeWhy(SEASON.results[SEASON.myId], expectOf(SEASON.myId))`)), "what the grade was made of");
  // A season that started before expectations: it gets one when it's needed
  g("delete SEASON.exp");
  ok(g(`expectOf(SEASON.myId).w`) > 0 && Object.keys(g("SEASON.exp")).length === 384, "a season from before expectations gets them when it needs them");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
