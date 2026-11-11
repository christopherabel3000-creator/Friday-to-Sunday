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

// ---- Job security and the stipend ----
{
  const { g } = fresh();
  ok(g("newSec(60, 2, 50)") === 80 && g("newSec(60, -2, 90)") === 32 && g("newSec(60, -2, 10)") === 48 && g("newSec(95, 3, 50)") === 100, "job security moves with the grade, and a proud program takes a bad one harder");
  const fired = j => g(`firedAfter(${JSON.stringify(j)})`);
  ok(!fired({ ten: 1, tg: [-5], sec: 0 }), "nobody is fired after his first season");
  ok(fired({ ten: 2, tg: [-1, -1.4], sec: 50 }) && !fired({ ten: 2, tg: [-.9, -3], sec: 10 }), "after two seasons: fired only if both were a win short or worse");
  ok(fired({ ten: 3, tg: [0, 0], sec: 24.9 }) && !fired({ ten: 3, tg: [-3, -3], sec: 25 }), "from the third season, fired under 25");
  ok(g("secWord(70)") === "Your job is safe." && g("secWord(45)") === "The athletic director expects improvement." && g("secWord(44)") === "You're on the hot seat.", "where you stand, in words");
  ok(g(`stipendOf({ cls: "1A", trad: 50 })`) === 4000 && g(`stipendOf({ cls: "3A", trad: 60 })`) === 7500 && g(`stipendOf({ cls: "6A", trad: 95 })`) === 17000, "the stipend: by class, plus up to $2,000 at a proud program");
  ok(g("moneyText(12345)") === "$12,345", "money reads with commas");
}

// ---- The year-end review and the carousel ----
{
  const { g } = fresh();
  career(g, 4321);
  const pay0 = g("CAREER.job.pay");
  ok(g("CAREER.job.ten") === 0 && g("CAREER.job.sec") === 60 && pay0 === g("stipendOf(mySchool())"), "taking a job: security 60, and the school's stipend");
  g("simSeason()");
  const R = g("yearEndReview()");
  ok(g("CAREER.job.ten") === 1 && !R.fired && R.paid === pay0 && g("CAREER.earned") === pay0 && g("CAREER.job.pay") === Math.round(pay0 * 1.03), "after the first season: never fired, paid, and a 3 percent raise");
  const e = g("CAREER.seasons[0]");
  ok(e.sid === g("SEASON.myId") && e.pay === pay0 && typeof e.sec === "number" && e.fired === false, "the season goes into your career with your job's standing");
  ok(JSON.stringify(g("yearEndReview()")) === JSON.stringify(R) && g("CAREER.job.ten") === 1, "the review happens once");
  const coaches = g(`Object.values(SEASON.schools).filter(s => !isYou(s.coach)).map(s => s.coach)`);
  ok(coaches.length === 383 && coaches.every(c => c.age >= 25 && c.span >= 30 && c.span <= 40 && c.yrs >= 1 && c.rep >= 0 && c.job && c.job.ten >= 1), "every computer coach has an age, a career and a job");
  ok(Object.entries(R.why).every(([id, w]) => { const c = g(`SEASON.schools["${id}"].coach`); return w === "retired" ? c.yrs >= c.span : w === "fired" ? c.job.ten >= 2 : false; }), "the open jobs: coaches who reached their years, and coaches who were fired");
  ok(R.open.length >= 8 && R.open.length <= 60, `a fair number of jobs open (${R.open.length})`);
  ok(R.news.length >= 1 && /head coaching jobs? (is|are) open around the state/.test(R.news[0]), "the news says how many jobs are open");
  // The market closes: computer coaches fill every open job
  ok(g("stayPut()") && g("SEASON.market.done") && g("SEASON.review.filled"), "staying closes the market, and the carousel runs");
  const st = g(`(() => { const seen = new Set(); let dup = 0, styles = true; for (const id in SEASON.schools) { const s = SEASON.schools[id]; if (seen.has(s.coach)) dup++; seen.add(s.coach); if (s.off !== s.coach.off_style || s.def !== s.coach.def_style) styles = false; } return { dup, styles }; })()`);
  ok(st.dup === 0, "every school has its own coach");
  ok(st.styles, "and runs his schemes");
  ok(g(`SEASON.review.open.every(id => SEASON.schools[id].coach.job.ten === 0)`), "every job that opened has a new coach");
  ok(g(`Object.keys(SEASON.review.why).filter(id => SEASON.review.why[id] === "left").every(id => SEASON.schools[id].coach.job.ten === 0)`), "and every job a coach left for a better one was filled too");
  ok(g("isYou(mySchool().coach)") && g("CAREER.job.ten") === 1, "you're still at your school");
  // The next season
  g("SEASON.phase = 'offseason'"); g("nextSeason()");
  ok(g("SEASON.year") === 2027 && !g("SEASON.review") && Object.keys(g("SEASON.exp")).length === 384, "the next season starts fresh, with new expectations");
}

// ---- Fired, and the market ----
{
  const { g } = fresh();
  career(g, 5555);
  g("simSeason()");
  // A coach on the hot seat with a bad season
  g(`CAREER.job.sec = 30; CAREER.job.ten = 4; CAREER.seasons[0].g = -3; CAREER.rep = 30;`);
  const R = g("yearEndReview()");
  ok(R.fired && R.open.includes(g("SEASON.myId")), "a bad season on the hot seat: fired");
  ok(!g("stayPut()"), "a fired coach can't stay");
  const old = g("SEASON.myId"), jobs = g("hcJobs()");
  ok(!jobs.includes(old) && jobs.every(id => R.open.includes(id) && g(`interestIn(SEASON.schools["${id}"])`) !== ""), "the market lists only open jobs interested in you, never your old one");
  ok(g(`interestIn({ cls: "2A", trad: 50 })`) === "medium" && g(`interestIn({ cls: "2A", trad: 90 })`) === "low" && g(`interestIn({ cls: "1A", trad: 50 })`) === "high" && g(`interestIn({ cls: "4A", trad: 50 })`) === "", "interest: your reputation against each school's bar");
  if (jobs.length) {
    const r = g(`pursueJob("${jobs[0]}")`);
    ok(r === "offer" || r === "no", `pursuing a job gets an answer (${r})`);
    if (r === "offer") {
      ok(jobs.length < 2 || g(`pursueJob("${jobs[1]}")`) === "", "an offer has to be answered before pursuing another job");
      ok(g("answerOffer(false)") === "declined" && !g("hcJobs()").includes(jobs[0]), "turning it down takes it off the list");
    } else ok(!g("hcJobs()").includes(jobs[0]) && g(`pursueJob("${jobs[0]}")`) === "", "a no takes it off the list for good");
  }
  // Everybody says no: the weakest 1A roster takes you
  g(`marketJobs().forEach(id => { SEASON.market.tried[id] = "no"; }); if (SEASON.market.offer && SEASON.market.offer !== SEASON.market.fallback) { SEASON.market.tried[SEASON.market.offer] = "declined"; SEASON.market.offer = null; } checkFallback();`);
  const fb = g("SEASON.market.fallback");
  ok(fb && fb === g("weakest1A()") && g(`SEASON.schools["${fb}"].cls`) === "1A" && g("SEASON.market.offer") === fb, "when every school says no, the 1A school with the weakest roster offers you its job");
  ok(g("answerOffer(false)") === "" && g("SEASON.market.offer") === fb, "and that offer can't be turned down");
  const cls0 = g("SEASON.cls"), d0 = g("SEASON.district");
  ok(g("answerOffer(true)") === "took" && g("SEASON.myId") === fb && g("SEASON.market.done") && g("SEASON.review.filled"), "you take it, and the carousel fills the rest");
  ok(g("isYou(mySchool().coach)") && !g(`isYou(SEASON.schools["${old}"].coach)`), "you coach your new school, and your old one has a new coach");
  ok(g("CAREER.job.ten") === 0 && g("CAREER.job.sec") === 60 && g("CAREER.job.pay") === g("stipendOf(mySchool())") && g("CAREER.job.id") === fb, "a fresh start at the new job");
  const s = g("mySchool()");
  ok(g("isFull(mySchool())") && g(`SEASON.districts[SEASON.district - 1].ids.every(id => isFull(SEASON.schools[id]))`) && g("Object.values(SEASON.schools).filter(isFull).length") === 8, "your new district has full rosters, and nobody else does");
  ok((g("SEASON.district") !== d0 || g("SEASON.cls") !== cls0) ? !g(`isFull(SEASON.schools["${old}"])`) : true, "your old district went back to paper");
  ok(g("movedSchools()") && s.players.length > 15, "the move is kept");
  g("SEASON.phase = 'offseason'"); g("nextSeason()");
  ok(g("SEASON.myId") === fb && g("SEASON.cls") === "1A" && g("SEASON.weeks.every(w => w.games.every(gm => SEASON.schools[gm.h].cls === '1A'))") && g("SEASON.phase") === "preseason", "the next season is at your new school, in its class");
  const hist = g("careerBySchool()");
  ok(hist.length === 1 && hist[0].w + hist[0].l >= 10, "your career by school");
}

// ---- Moving up a class, with players following ----
{
  const { g } = fresh();
  career(g, 2027);
  g("simSeason()");
  g("CAREER.rep = 60; yearEndReview()");
  const up = g(`SEASON.review.open.filter(id => id !== SEASON.myId && SEASON.schools[id].cls !== "1A" && interestIn(SEASON.schools[id]))`);
  ok(up.length > 0, `a coach with a good reputation is wanted at bigger schools (${up.length} jobs)`);
  const to = up[0], top5 = g(`mySchool().players.filter(p => p.yr < 12).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).slice(0, 5).map(p => p.id)`);
  const follow = g(`transfersFrom(mySchool(), "${to}").map(p => p.id)`);
  ok(follow.every(id => top5.includes(id)), "only your five best returning players might follow you");
  g(`SEASON.market.offer = "${to}"`);
  g("answerOffer(true)");
  ok(g("SEASON.myId") === to && g("SEASON.cls") === g(`SEASON.schools["${to}"].cls`) && g("SEASON.district") === g(`SEASON.schools["${to}"].district`), "you move up a class, to the new school's district");
  ok(follow.every(id => g(`!!playerById(mySchool(), "${id}")`)) && g("SEASON.market.transfers.length") === follow.length, `the players who followed you are on your new team (${follow.length})`);
  ok(g("new Set(mySchool().players.map(p => p.num)).size === mySchool().players.length"), "everyone has his own number");
  ok(g(`mySchool().off === CAREER.coach.off_style && mySchool().def === CAREER.coach.def_style`), "your schemes come with you");
  // Over several years with nobody at the controls, you always have a job, and every school a coach
  for (let y = 0; y < 3; y++) {
    g("SEASON.phase = 'offseason'"); g("nextSeason()"); g("simSeason()");
    g("SEASON.phase = 'offseason'"); g("yearEndReview(); autoMarket()");
    ok(g("SEASON.market.done") && g("isYou(mySchool().coach)") && g(`(() => { const seen = new Set(); return Object.values(SEASON.schools).every(s => { if (!s.coach || seen.has(s.coach)) return false; seen.add(s.coach); return true; }); })()`), `year ${y + 2}: you have a job, and every school its own coach`);
  }
  // A career from before job security gets a job at its school
  g("delete CAREER.job");
  ok(g("myJob().ten") === g("CAREER.seasons.filter(x => x.seed !== SEASON.seed).length") && g("CAREER.job.id") === g("SEASON.myId"), "a career from before job security gets its job back");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
