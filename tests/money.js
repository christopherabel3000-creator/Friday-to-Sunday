// Milestone 3b: boosters, the program fund, fundraisers, facilities, one-season purchases, coaching
// clinics, the colleges, offers, signing day and its rewards, and key moments.
// Usage: node tests/money.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
const fresh = () => { const sb = load(); return { sb, g: sb.__get }; };
const near = (a, b, t) => Math.abs(a - b) <= (t || 1e-9);
const start = (g, seed, pick) => g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); CAREER = null; newCareer("Pat", "Ruiz", "qb", "bal", "bal"); newSeason(${seed}, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[${pick || 0}]);`);
// Through the season to the offseason, with the market closed (you stay)
const toOffseason = g => g(`simSeason(); act("offseason"); autoMarket(); openBooks();`);

// ---- Boosters ----
{
  const { g } = fresh();
  start(g, 501);
  const all = g(`Object.values(SEASON.schools).map(s => [s.bst, s.trad])`);
  ok(all.length === 384 && all.every(([b]) => b >= 5 && b <= 95), "every school in the state has boosters, between 5 and 95");
  const hi = all.filter(x => x[1] >= 70), lo = all.filter(x => x[1] <= 30), mean = l => l.reduce((n, x) => n + x[0], 0) / l.length;
  ok(mean(hi) > mean(lo) + 15, `proud programs have keener boosters (${mean(hi).toFixed(0)} against ${mean(lo).toFixed(0)})`);
  ok(g(`[90, 70, 50, 30, 10].map(boostWord).join("|")`) === "all in|fired up|behind you|lukewarm|grumbling", "booster enthusiasm in words");
  ok(g(`boostText(68)`) === "The boosters are fired up (68).", "and in a sentence");
  // A season moves them: 4 a point of grade, 3 for a district title, 6 for a state title, then a tenth of the way home
  const mv = g(`(() => { const s = { id: "x", seed: 1, trad: 50, bst: 50 }; const a = moveBoosters(Object.assign({}, s), { g: 2, dt: 1, ch: 1 }); const b = moveBoosters(Object.assign({}, s), { g: -2 }); return [a, b]; })()`);
  ok(near(mv[0], 50 + (8 + 3 + 6) * .9, .05) && near(mv[1], 50 - 8 * .9, .05), "a season moves the boosters, and they slip back toward the school's usual");
  ok(g("boostPressure(50)") === 1 && near(g("boostPressure(80)"), 1.2) && g("boostPressure(100)") === 1.35, "boosters over 60 make a bad season count more, up to 1.35 times");
  ok(g("newSec(60, -2, 50, 50)") === 40 && g("newSec(60, -2, 50, 80)") === 36 && g("newSec(60, 2, 50, 95)") === 80, "keen boosters cost a coach more job security after a bad season, never after a good one");
}

// ---- Facilities ----
{
  const { g } = fresh();
  start(g, 502);
  const by = g(`(() => { const out = {}; CLASSES.forEach(c => { const l = Object.values(SEASON.schools).filter(s => s.cls === c).flatMap(s => s.fac); out[c] = l.reduce((a, b) => a + b, 0) / l.length; }); return out; })()`);
  ok(by["1A"] > 1.6 && by["1A"] < 2.6 && by["6A"] > 3.4 && by["6A"] <= 4.5, `a typical 1A school is basic and a 6A school great (1A ${by["1A"].toFixed(2)}, 6A ${by["6A"].toFixed(2)})`);
  ok(g(`Object.values(SEASON.schools).every(s => s.fac.length === 5 && s.fac.every(v => v >= 1 && v <= 5))`), "five facilities, each rated 1 to 5");
  ok(g(`JSON.stringify(facOf(Object.assign({}, SEASON.schools["d2s2"], { fac: null })))`) === g(`JSON.stringify(SEASON.schools["d2s2"].fac)`), "the same school starts with the same facilities every time");
  ok(g("builtCost(1)") === 0 && g("builtCost(3)") === 28000 && g("builtCost(5)") === 163000, "what it took to build each level");
  ok(g(`upkeepOf({ fac: [2, 2, 2, 2, 3] })`) === 4 * 320 + 1120, "upkeep: 4 percent of what each facility cost to build");
  ok(g(`[wtMul({ fac: [1, 2, 2, 2, 2] }), wtMul({ fac: [5, 2, 2, 2, 2] }), filmMul({ fac: [2, 4, 2, 2, 2] }), fieldInj({ fac: [2, 2, 5, 2, 2] }), eqInj({ fac: [2, 2, 2, 1, 2] })].join()`) === ".85,1.3,1.1,.78,1.1".replace(/(^|,)\./g, "$10."), "each facility's effect, by level");
  ok(g(`wtMul({})`) === 1 && g(`eqInj({})`) === 1 && g(`filmSharp({})`) === false, "an exhibition school is basic everywhere: no effect");
  ok(g(`JSON.stringify(strAttrs({ str: .5, rbk: 1 }, { fac: [4, 2, 2, 2, 2] }))`) === JSON.stringify({ str: .6, rbk: 1 }) && g(`JSON.stringify(strAttrs({ rbk: 1 }, { fac: [5, 2, 2, 2, 2] }))`) === JSON.stringify({ rbk: 1 }), "the weight room grows strength, and only strength");
  // A great film room: a fuller scouting report and more edge
  ok(g(`prepLevelFor(.5, { sct: 40 }, { fac: [2, 4, 2, 2, 2] })`) === 2 && g(`prepLevelFor(.5, { sct: 40 }, { fac: [2, 3, 2, 2, 2] })`) === 1 && g(`prepLevelFor(0, { sct: 40 }, { fac: [2, 5, 2, 2, 2] })`) === 0, "a great film room makes the scouting report one level fuller");
  // Practice injuries: a poor field and full pads against an elite field and elite equipment
  const hurt = fac => g(`(() => { let n = 0; setRandom(seededRandom(7)); for (let k = 0; k < 40; k++) { const s = clone(mySchool()); s.fac = ${JSON.stringify(fac)}; for (let w = 0; w < 14; w++) { n += practiceSchool(s, Object.assign(newPlan(), { contact: "pads" }), rand).hurt.length; healSchool(s, 1, rand); } } setRandom(null); return n / 40; })()`);
  const poor = hurt([2, 2, 1, 1, 2]), elite = hurt([2, 2, 5, 5, 2]);
  ok(elite < poor * .75, `a good field and equipment mean fewer practice injuries in full pads (${poor.toFixed(1)} a season, then ${elite.toFixed(1)})`);
  // Game injuries go with each team's equipment
  ok(g(`gameTeam(Object.assign(clone(mySchool()), { fac: [2, 2, 2, 5, 2] }), true).injk`) === .85 && g(`gameTeam(APP.ex.schools[0], true).injk`) === 1, "game injuries follow the equipment");
  // Computer schools build toward their class and tradition every three years
  const cpu = g(`(() => { const s = clone(SEASON.schools["6Ad1s1"]); s.fac = [1, 1, 1, 1, 1]; for (let y = 2026; y < 2060; y++) cpuFacilities(s, y); return s.fac; })()`);
  ok(cpu.reduce((a, b) => a + b, 0) >= 15, `a 6A school with poor facilities builds them up over the years (${cpu.join(", ")})`);
  const moves = g(`(() => { const s = clone(SEASON.schools["d3s3"]), was = s.fac.join(); let n = 0; for (let y = 2026; y < 2035; y++) { const b = s.fac.join(); cpuFacilities(s, y); if (s.fac.join() !== b) n++; } return n; })()`);
  ok(moves <= 3, "and moves at most one facility every three years");
}

// ---- The program fund, fundraisers and purchases ----
{
  const { g } = fresh();
  start(g, 503, 2);
  toOffseason(g);
  const B = g("SEASON.books"), s = g("mySchool()");
  ok(B && B.id === s.id && B.school === 3000 && B.boost > 0 && B.upkeep === g("upkeepOf(mySchool())"), "the offseason's books: the school's money, booster giving and upkeep");
  ok(B.raised.wash > 0 && Object.keys(B.raised).length === 1 && g("CAREER.fr").join() === "wash", "a new coach starts with a car wash");
  ok(g("mySchool().fund") === B.start + B.school + B.boost + B.raised.wash - B.upkeep, "the fund adds up");
  ok(g("openBooks() === SEASON.books"), "the books are opened once an offseason");
  ok(g("booksOpen()"), "and can be changed once the job market is closed");
  // More fundraisers: more money, less summer
  const f0 = g("mySchool().fund");
  ok(/raised/.test(g(`toggleFundraiser("signs")`)) && g("mySchool().fund") > f0 && g("fundWeeks()") === 1 && near(g(`Object.values(summerWeeks(newSummer())).reduce((a, b) => a + b, 0)`), 7), "a second fundraiser raises money and takes a summer week");
  const amt = g("SEASON.books.raised.signs");
  ok(g(`frAmount(mySchool(), "signs")`) === amt, "a fundraiser's money is rolled once a season");
  g(`toggleFundraiser("signs")`);
  ok(g("mySchool().fund") === f0 && g("fundWeeks()") === 0 && g("SEASON.books.raised.signs") === undefined, "turning it off gives the week back, and the money");
  const bst = g("mySchool().bst");
  g(`toggleFundraiser("banquet")`);
  ok(near(g("mySchool().bst"), Math.min(100, bst + 3)), "the booster banquet fires up the boosters");
  g(`toggleFundraiser("banquet")`);
  ok(near(g("mySchool().bst"), bst), "and calling it off takes that back");
  g(`mySchool().bst = 30`);
  ok(/aren't behind/.test(g(`toggleFundraiser("golf")`)) && !g("CAREER.fr").includes("golf"), "a golf tournament needs boosters who are behind the team");
  // Discount cards cost summer attendance
  g(`mySchool().bst = 60; toggleFundraiser("cards")`);
  const att = plan => g(`(() => { CAREER.fr = ${JSON.stringify(plan)}; let n = 0; for (let k = 0; k < 30; k++) { const s = clone(mySchool()); s.seed = k; n += runSummer(s, newSummer(), 2026); } return n; })()`);
  const withCards = att(["wash", "cards"]), without = att(["wash"]);
  g(`CAREER.fr = ["wash", "cards"]`);
  ok(withCards < without, `selling discount cards means fewer players at summer workouts (${without}, then ${withCards})`);
  // Facilities: upgrade, too expensive, cancel
  g(`mySchool().fund = 25000`);
  const lv0 = g(`facOf(mySchool())[0]`);
  const up = g(`upgradeFacility("wt")`);
  ok(g(`facOf(mySchool())[0]`) === lv0 + 1 && g("mySchool().fund") === 25000 - g(`FAC_COST[${lv0 + 1}]`) && /now/.test(up), "an upgrade costs the fund and raises the facility a level");
  g(`mySchool().fund = 100`);
  ok(/Not enough/.test(g(`upgradeFacility("film")`)), "an upgrade the fund can't pay for says so");
  ok(/cancelled/.test(g(`cancelUpgrade("wt")`)) && g(`facOf(mySchool())[0]`) === lv0 && g("mySchool().fund") === 100 + g(`FAC_COST[${lv0 + 1}]`), "an upgrade made this offseason can be cancelled for a refund");
  ok(g(`cancelUpgrade("wt")`) === "", "but only one that was made this offseason");
  // Purchases
  g(`mySchool().fund = 50000`);
  const back = g(`mySchool().players.filter(p => p.yr < 12).length`);
  ok(g(`buyCost(mySchool(), "tcamp")`) === 250 * back && g(`buyCost(mySchool(), "strength")`) === 3000 && g(`buyCost(mySchool(), "tutor")`) === 1500, "team camp is $250 a returning player; a strength coach $3,000 and a tutor $1,500");
  ["tcamp", "strength", "tutor"].forEach(id => g(`toggleBuy("${id}")`));
  ok(g("mySchool().fund") === 50000 - 250 * back - 4500 && g(`bought("tcamp") && bought("tutor")`), "booked, and paid from the fund");
  g(`toggleBuy("strength")`);
  ok(g("mySchool().fund") === 50000 - 250 * back - 1500 && !g(`bought("strength")`), "and a purchase can be called off");
  g(`toggleBuy("strength")`);
  // What they do over the summer
  const sum = buy => g(`(() => { const s = clone(mySchool()), fr = CAREER.fr; s.fac = [2, 2, 2, 2, 2]; CAREER.fr = ["wash"]; const p0 = s.players.map(p => [p.r.str, p.r.cov + p.r.hnd + p.r.acc, gradesOf(p)]); const m0 = Object.values(s.mastery).reduce((a, b) => a + b, 0);
    runSummer(s, newSummer(), 2026, ${JSON.stringify(buy)}); CAREER.fr = fr; return { str: s.players.reduce((t, p, i) => t + p.r.str - p0[i][0], 0), pass: s.players.reduce((t, p, i) => t + p.r.cov + p.r.hnd + p.r.acc - p0[i][1], 0),
      gr: s.players.reduce((t, p, i) => t + gradesOf(p) - p0[i][2], 0), book: Object.values(s.mastery).reduce((a, b) => a + b, 0) - m0, tc: s.players.filter(p => p.tc).length, tutor: s.tutor }; })()`);
  const plain = sum({}), extra = sum({ tcamp: 1, strength: 1, tutor: 1 });
  ok(extra.str > plain.str && extra.pass > plain.pass && extra.gr > plain.gr, `team camp, a strength coach and a tutor all help over the summer (strength ${plain.str} to ${extra.str}, passing game ${plain.pass} to ${extra.pass}, grades ${plain.gr} to ${extra.gr})`);
  ok(extra.book > 5 && plain.book === 0 && extra.tc > 0 && plain.tc === 0 && extra.tutor === 2027, "team camp teaches the playbook and gets players seen, and the tutor stays for the season");
  ok(g(`(() => { const s = { players: [] }; SEASON.year = 2027; s.tutor = 2027; const r = tutorOn(s); SEASON.year = 2026; return r; })()`), "the tutor works through the next season");
  // Clinics and gifts from your own money
  g(`CAREER.earned = 2500; CAREER.spent = 0; CAREER.xp = 0`);
  ok(/30 XP/.test(g(`attendClinic("state")`)) && g("CAREER.xp") === 30 && g("myCash()") === 1900, "a state clinic: $600 of your own money for 30 XP");
  ok(/already/.test(g(`attendClinic("state")`)) && /costs/.test(g(`attendClinic("national")`)) && g("CAREER.xp") === 30, "once each an offseason, and only with the money for it");
  const fund = g("mySchool().fund");
  ok(/gave/.test(g("giveToFund(1000)")) && g("myCash()") === 900 && g("mySchool().fund") === fund + 1000 && g("giveToFund(5000)").startsWith("You have"), "giving your own money to the fund");
  ok(g("giveToFund(777)") === "", "only in the amounts offered");
  // The next season: the purchases run with the summer, and the books close
  g("nextSeason()");
  ok(!g("SEASON.books") && g("mySchool().tutor") === 2027 && g("mySchool().players.some(p => p.tc === 2027)"), "the summer runs with the season's purchases");
  ok(g(`CAREER.fr.join()`) === "wash,cards", "and the fundraisers carry over");
}

// ---- Moving schools: the money stays behind ----
{
  const { g } = fresh();
  start(g, 504, 1);
  g(`simSeason(); act("offseason"); yearEndReview()`);
  const out = g(`(() => { const from = SEASON.myId; mySchool().fund = 12345; const id = Object.keys(SEASON.schools).find(x => x !== from && SEASON.schools[x].cls === "1A" && SEASON.schools[x].district !== SEASON.district);
    SEASON.market.offer = id; answerOffer(true); return { from, to: SEASON.myId, oldFund: SEASON.schools[from].fund, est: fundOf(SEASON.schools[from]), books: openBooks() }; })()`);
  ok(out.to !== out.from && out.oldFund === undefined && out.books.id === out.to && out.books.start === g(`fundOf(Object.assign({}, mySchool(), { fund: null }))`), "a new job comes with its own fund, and your old school's money stays behind");
  ok(g(`jobMoneyText(SEASON.schools["${out.from}"])`).includes("Program fund about"), "the job market shows a school's boosters, fund and facilities");
}

// ---- The colleges ----
{
  const { g } = fresh();
  start(g, 505);
  const cs = g("colleges()");
  ok(cs.length === 672 && [1, 2, 3].map(t => cs.filter(c => c.tier === t).length).join() === "68,196,408", "the colleges are the college world's 672 programs: the power conferences are Tier 1, the rest of FBS and the FCS Tier 2, and Divisions II and III Tier 3");
  ok(new Set(cs.map(c => c.name)).size === 672, "every college has its own name");
  ok(Math.abs(g("tierScale(1)") * 68 - 24) < 1e-9, "each college offers less often, so a tier's offers add up as before");
  ok(g("collegeOf(5).tier") === 1 && g("collegeOf(40).tier") === 2 && g("collegeOf(100).tier") === 3 && g("collegeOf(5).i") === g("collegeOf(5).i"), "an offer from before the college world goes to a program at the same tier");
  ok(JSON.stringify(g("(() => { COLLEGE_CACHE = null; return colleges(); })()")) === JSON.stringify(cs), "the same state always has the same colleges");
  ok(/^Tier [123] /.test(g("collegeText(5)")), "a college in words, with its tier");
  const needs = g(`(() => { const c = colleges()[3]; return ["OL", "DL", "K", "QB", "WR"].map(pos => [0, 1, 2, 3, 4, 5].map(k => collegeNeed(c, 2026 + k, pos))); })()`);
  ok(needs[0].concat(needs[1]).every(n => n >= 2 && n <= 4) && needs[2].every(n => n <= 1) && needs[3].concat(needs[4]).every(n => n >= 0 && n <= 3), "colleges need 2 to 4 linemen a side, a kicker now and then, and 0 to 3 at each other spot");
  // The recruit rating
  const rr = g(`(() => { const p = { pos: "WR", pos2: null, pot: 70, r: { hnd: 60, rte: 60, spd: 70, awr: 60, str: 50, acc: 1, arm: 1, elu: 1, bsc: 1, blk: 1, rbk: 1, pbk: 1, prs: 1, rst: 1, tkl: 1, cov: 1, leg: 1, kac: 1 } }; const o = ovr(p, "WR"); return [recruitOf(p).r, o + .4 * (70 - o) + 3]; })()`);
  ok(near(rr[0], rr[1], .06), "the recruit rating: overall, part of the way to his potential, and speed at the skill spots");
  ok(g(`[recruitWord(80), recruitWord(70), recruitWord(60), recruitWord(50)].join("|")`) === "a top prospect|a strong prospect|a college prospect|", "the recruit rating in words");
  ok(g(`offerChance(58, 58, 1)`) === .01 && g(`offerChance(68, 58, 1)`) === .03 && g(`offerChance(68, 58, .55)`) < .02 && g(`offerChance(400, 58, 1.2)`) === .5, "the chance of an offer: more over the bar, more exposure, never more than half");
}

// ---- Offers and signing day ----
{
  const { g } = fresh();
  start(g, 506, 4);
  // A senior star and a senior with poor grades
  g(`(() => { const s = mySchool(), ps = s.players.filter(p => p.yr === 12 && p.pos !== "K" && p.pos !== "P");
    const lift = (p, n) => { for (const a in p.r) p.r[a] = Math.min(99, p.r[a] + n); p.pot = 99; };
    lift(ps[0], 40); ps[0].gr = 90; lift(ps[1], 40); ps[1].gr = 40; ps[0].tag = "star"; ps[1].tag = "flunk"; })()`);
  const rr0 = g(`recruitOf(mySchool().players.find(p => p.tag === "star")).r`);
  ok(rr0 >= 74, `a star clears the Tier 1 bar (${rr0})`);
  g(`simSeason(9)`);
  const w4 = g(`(SEASON.offerNews || {})[4] || []`);
  ok(Array.isArray(w4) && g(`mySchool().players.find(p => p.tag === "star").off.length`) > 0, `offers come after week 4 (${w4.length} lines of news)`);
  ok(g(`mySchool().players.find(p => p.tag === "star").off.every(o => o[1] === "w4" || o[1] === "w8")`), "each offer remembers its window");
  ok(g(`(SEASON.xp || []).some(e => e.why === "offer")`), "your players' first offers from a tier earn XP");
  const again = g(`(() => { const s = mySchool(), p = s.players.find(p => p.tag === "star"), n = p.off.length; rollOffers(s, "w4"); return p.off.length === n; })()`);
  ok(again, "a window is rolled once: no new offers from it the second time");
  g(`simSeason(); act("offseason")`);
  ok(g("APP.screen") === "signing", "signing day comes before the athletic director's review");
  const sg = g("SEASON.signing");
  const star = g(`(() => { const p = mySchool().players.find(p => p.tag === "star"); return [p.sign, offersOf(p)[0].tier, p.sign != null ? collegeOf(p.sign).tier : 0]; })()`);
  ok(star[0] != null && star[2] === star[1] && star[1] <= 2, "the star signs with the best tier that offered him");
  ok(g(`(() => { const t1 = colleges().find(c => c.tier === 1), t3 = colleges().find(c => c.tier === 3); const p = { id: "z", pos: "QB", pot: 50, r: { acc: 50, arm: 50, awr: 50, spd: 50, str: 50 }, gr: 80, off: [[t3.i, "w4"], [t1.i, "w8"]] };
    const a = signWith(p, 2026).i === t1.i; p.gr = 50; const b = signWith(p, 2026).i === t3.i; p.off = [[t1.i, "w8"]]; return a && b && signWith(p, 2026) === null; })()`), "Tier 1 over Tier 3, unless his grades hold him back");
  ok(sg.pending.some(x => /\w/.test(x.name)) && g(`(() => { const p = mySchool().players.find(p => p.tag === "flunk"); return p.sign == null || collegeOf(p.sign).tier === 3; })()`), "the player with poor grades can't sign with Tier 1 or Tier 2");
  ok(sg.xp >= 20 && sg.rep > 0 && sg.rep <= 4, `signees earn XP and reputation (${sg.xp} XP, ${sg.rep} reputation)`);
  ok(g(`mySchool().sent[2026]`) === sg.mine.length && g(`CAREER.sent.reduce((a, b) => a + b, 0)`) === sg.mine.length, "the school and your career count the players sent to college");
  ok(g(`signingDay() === SEASON.signing`), "signing day happens once");
  ok(g(`sentLately(mySchool(), 2027)`) === sg.mine.length && g(`sentLately(mySchool(), 2026)`) === 0 && g(`sentLately(mySchool(), 2031)`) === 0, "signees help for the next four years");
  const yes = g(`(() => { const p = { interest: 1 }, s = mySchool(), a = yesChance(p, s); const keep = s.sent; s.sent = {}; const b = yesChance(p, s); s.sent = keep; return [a, b]; })()`);
  ok(yes[0] > yes[1], "players sent to college help your hallway pitches");
  ok(/Signing day/.test(g("vSigning()")) && /Signed/.test(g("vSigning()")) && /data-a="adreview"/.test(g("vSigning()")), "the signing day screen");
  g(`act("adreview")`);
  ok(g("APP.screen") === "review", "then the athletic director's review");
  ok(/College recruiting/.test(g("vRecruits()")) && /sent to college/.test(g("vRecruits()")), "the recruiting screen");
  g(`autoMarket(); nextSeason()`);
  ok(g(`SEASON.yearReport.grads.some(x => /^Tier [12] /.test(x.col))`), "the graduation report says where your seniors are going");
}

// ---- Key moments ----
{
  const { g } = fresh();
  start(g, 611, 1);
  g("setRandom(seededRandom(611)); simCamp()");
  let handed = 0, simmed = 0;
  for (let w = 0; w < 6; w++) {
    const r = g(`(() => { act("keygame"); const me = S.teams.findIndex(t => t.id === SEASON.myId), d = Math.abs(S.teams[0].score - S.teams[1].score);
      const o = { screen: APP.screen, phase: S.phase, q: S.quarter, d, key: S.key, mine: !S.teams[me].cpu, other: S.teams[1 - me].cpu, panel: keyPanel(),
        cpuSnaps: (S.chart || []).filter(e => e.hu & (1 << me)).length };
      return o; })()`);
    if (r.phase === "final") { simmed++; ok(/never got close/.test(r.key.note) && r.d > 8, "a game that never gets close late sims to the end"); }
    else {
      handed++;
      ok(r.q >= 4 && r.d <= 8 && r.mine && r.other && /^Key moment\. (\d\w\w quarter, \d+:\d\d left|Overtime)/.test(r.key.note), `close late: you take over (${r.key.note})`);
      ok(r.cpuSnaps === 0, "the snaps the computer called earn no snap XP");
      ok(/id="keymoment"/.test(r.panel) && /Scoring so far|No scoring/.test(r.panel), "a panel says where things stand, with the scoring so far");
    }
    g(`if (S.phase !== "final") simToEnd(); act("weekdone"); act("season");`);
  }
  ok(handed > 0, `some games are close late (${handed} of 6, ${simmed} simmed)`);
  ok(g(`(() => { S.key.at = -1; return keyPanel(); })()`) === "", "the panel goes away after the next snap");
}

// ---- Saves from before money ----
{
  const { g } = fresh();
  start(g, 507);
  const saved = g(`(() => { const s = clone(currentSave()); s.build = 9; Object.values(s.season.schools).forEach(x => { delete x.fac; delete x.bst; }); return JSON.stringify(s); })()`);
  const up = g(`upgradeSave(JSON.parse(${JSON.stringify(saved)}))`);
  ok(up.build === g("BUILD") && Object.values(up.season.schools).every(x => x.fac && x.fac.length === 5 && x.bst != null), "a save from before money gets boosters and facilities for every school");
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
