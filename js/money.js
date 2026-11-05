// Friday to Sunday: money. Booster clubs, the program fund, fundraisers, facilities, one-season
// purchases, and the coaching clinics your own earnings pay for (Milestone 3b).
"use strict";

/* ---------- Booster clubs ---------- */
// Every school's boosters have an enthusiasm from 0 to 100 (s.bst). A school starts at 20 + 0.6 times
// its tradition, give or take 10. Each season it moves by 4 times the season grade, plus 3 for a
// district title and 6 for a state title, then slips a tenth of the way back to where the school's
// tradition would start it.
const BOOST_BASE = 20, BOOST_TRAD = .6, BOOST_PER = 4, BOOST_DT = 3, BOOST_CH = 6, BOOST_SLIP = .1;
const boostHome = trad => BOOST_BASE + BOOST_TRAD * (trad == null ? 50 : trad);
function boostersOf(s) {
  if (s.bst == null) s.bst = clamp(Math.round(boostHome(s.trad) + dice(hashSeed(`${s.seed}:${s.id}:boosters`)).n(0, 10)), 5, 95);
  return s.bst;
}
const boostWord = b => b >= 85 ? "all in" : b >= 65 ? "fired up" : b >= 45 ? "behind you" : b >= 25 ? "lukewarm" : "grumbling";
const BOOST_SAY = { "all in": "all in", "fired up": "fired up", "behind you": "behind the team", lukewarm: "lukewarm", grumbling: "grumbling" };
// "The boosters are fired up (68)."
const boostText = b => `The boosters are ${BOOST_SAY[boostWord(b)]} (${Math.round(b)}).`;
function moveBoosters(s, r) {
  const b = boostersOf(s) + BOOST_PER * ((r && r.g) || 0) + (r && r.dt ? BOOST_DT : 0) + (r && r.ch ? BOOST_CH : 0);
  s.bst = clamp(Math.round((b + (boostHome(s.trad) - b) * BOOST_SLIP) * 10) / 10, 0, 100);
  return s.bst;
}
// Boosters who care a lot are less patient: a bad grade moves job security up to 1.35 times as much
// at a school with enthusiasm over 60
const boostPressure = b => b > 60 ? Math.min(1.35, 1 + (b - 60) / 100) : 1;

/* ---------- Facilities ---------- */
// Five facilities, each rated 1 to 5 (s.fac: [weight room, film room, practice field, equipment,
// locker room and stadium]). Each one makes something already in the game work better.
const FACILITIES = [
  ["wt", "Weight room", "Strength growth from summer weights and practice, and more players at summer workouts."],
  ["film", "Film room", "A bigger edge from opponent prep, and at great and elite a fuller scouting report."],
  ["field", "Practice field", "Fewer practice injuries, and at great and elite injured players heal a little faster."],
  ["eq", "Equipment", "Fewer injuries in games, and fewer extra injuries from practicing in full pads."],
  ["stad", "Locker room and stadium", "More booster money, and a better pitch to athletes in the hallways."]
];
const FAC_IDS = FACILITIES.map(f => f[0]);
const FAC_LEVELS = ["", "poor", "basic", "good", "great", "elite"];
// What it costs to reach each level from the one below it, at every class
const FAC_COST = [0, 0, 8000, 20000, 45000, 90000];
const FAC_UPKEEP = .04;
const WT_MUL = [.85, 1, 1.1, 1.2, 1.3], FILM_MUL = [.9, 1, 1.05, 1.1, 1.15], FIELD_INJ = [1.15, 1, .92, .85, .78], EQ_INJ = [1.1, 1, .95, .9, .85], PADS_CUT = [0, 0, .1, .2, .3];
// Where a school's facilities start: 2 + 0.4 a class above 1A + (tradition - 50) / 30, give or take a
// level, between 1 and 5. A typical 1A school is basic and a typical 6A school great. Each facility's
// own luck is kept with the school's seed, so its target moves only with its tradition.
const facNoise = s => { const g = dice(hashSeed(`${s.seed}:${s.id}:fac`)); return FAC_IDS.map(() => g.n(0, .7)); };
const facAim = (s, trad, k, noise) => clamp(Math.round(2 + .4 * classIndex(s.cls || "1A") + ((trad == null ? 50 : trad) - 50) / 30 + noise[k]), 1, 5);
function facOf(s) {
  if (!s.fac) { const nz = facNoise(s); s.fac = FAC_IDS.map((_, k) => facAim(s, s.trad, k, nz)); }
  return s.fac;
}
// A school's level at one facility. A school outside the state (an exhibition) is basic everywhere.
const facLv = (s, id) => s && s.fac ? s.fac[FAC_IDS.indexOf(id)] : 2;
const facWord = lv => FAC_LEVELS[lv] || "basic";
// What a facility cost to build up to its level, and its upkeep: 4 percent of that a year
const builtCost = lv => FAC_COST.slice(2, lv + 1).reduce((a, b) => a + b, 0);
const upkeepOf = s => facOf(s).reduce((t, lv) => t + Math.round(FAC_UPKEEP * builtCost(lv) / 10) * 10, 0);
// The effects
const wtMul = s => WT_MUL[facLv(s, "wt") - 1];
const filmMul = s => FILM_MUL[facLv(s, "film") - 1];
const fieldInj = s => FIELD_INJ[facLv(s, "field") - 1];
const eqInj = s => EQ_INJ[facLv(s, "eq") - 1];
const padsCut = s => PADS_CUT[facLv(s, "eq") - 1];
const filmSharp = s => facLv(s, "film") >= 4;
const fieldHeals = s => facLv(s, "field") >= 4;
// Two points of summer attendance a level of weight room over basic (and two fewer at poor)
const wtAttend = s => .02 * (facLv(s, "wt") - 2);
const stadBoost = s => 1 + .06 * (facLv(s, "stad") - 2);
const stadPitch = s => .02 * (facLv(s, "stad") - 2);
// Strength in a set of ratings to train grows with the weight room
function strAttrs(attrs, s) {
  const m = wtMul(s);
  return m === 1 || !attrs.str ? attrs : Object.assign({}, attrs, { str: attrs.str * m });
}
// Computer schools move one facility a level toward where their class and tradition would put it,
// every three years, from their own seed
function cpuFacilities(s, year) {
  if ((year + (s.seed || 0)) % 3) return;
  const lv = facOf(s), nz = facNoise(s);
  let best = -1, gap = 0;
  FAC_IDS.forEach((_, k) => { const d = facAim(s, s.trad, k, nz) - lv[k]; if (Math.abs(d) > Math.abs(gap)) { gap = d; best = k; } });
  if (best >= 0) lv[best] += Math.sign(gap);
}

/* ---------- The program fund ---------- */
// Money you control, kept with the school (s.fund), so it stays behind when you move. Each offseason
// it gets the school's football money, booster giving and your fundraisers, and pays upkeep first.
const SCHOOL_MONEY = { "1A": 3000, "2A": 4500, "3A": 6000, "4A": 8000, "5A": 10000, "6A": 13000 };
const BOOSTER_MONEY = { "1A": 4000, "2A": 7000, "3A": 11000, "4A": 17000, "5A": 26000, "6A": 40000 };
const round100 = n => Math.round(n / 100) * 100;
const boosterGiving = s => round100(BOOSTER_MONEY[s.cls || "1A"] * (.5 + boostersOf(s) / 100) * stadBoost(s));
// A school you haven't coached has whatever its last coach saved: up to a year's money, from its seed
function fundOf(s) {
  if (s.fund != null) return s.fund;
  const k = seededRandom(hashSeed(`${s.seed}:${s.id}:${SEASON ? SEASON.year : 0}:fund`))();
  return Math.max(0, round100((SCHOOL_MONEY[s.cls || "1A"] + boosterGiving(s) - upkeepOf(s)) * (.2 + .8 * k)));
}

/* ---------- Fundraisers ---------- */
// Picked in the offseason; the picks stay in place every year (CAREER.fr). The first is free, and
// each one after it takes a week of the summer program.
const FUNDRAISERS = [
  ["wash", "Car wash", 1200, "A Saturday car wash. Always works, and more students bring more cars."],
  ["signs", "Sponsor signs on the fence", 1800, "Local businesses buy signs on the stadium fence. Bigger, prouder schools sell more."],
  ["cards", "Discount cards", 2000, "Players sell discount cards around town. Good money, but it costs them some summer workouts."],
  ["golf", "Golf tournament", 3500, "A booster golf tournament. The best money, if the boosters are behind the team."],
  ["banquet", "Booster banquet", 1500, "A dinner for the boosters. Less money, but it fires them up."]
];
const FR_IDS = FUNDRAISERS.map(f => f[0]);
const FR = Object.fromEntries(FUNDRAISERS.map(([id, name, base, desc]) => [id, { id, name, base, desc }]));
const FR_SIZE = { "1A": 1, "2A": 1.5, "3A": 2.2, "4A": 3, "5A": 4, "6A": 5.5 };
const GOLF_NEEDS = 45, BANQUET_BOOST = 3, CARDS_ATTEND = .05;
// Enrollment within the class's range: 0.8 at the bottom to 1.2 at the top
const enrollMul = s => { const [lo, hi] = CLASS_INFO[s.cls || "1A"].enroll; return .8 + .4 * clamp(((s.enroll || lo) - lo) / (hi - lo), 0, 1); };
const frGrows = (s, id) => id === "wash" || id === "cards" ? enrollMul(s) : id === "signs" ? enrollMul(s) * (.7 + .6 * (s.trad || 50) / 100) : .5 + boostersOf(s) / 100;
const frOK = (s, id) => id !== "golf" || boostersOf(s) >= GOLF_NEEDS;
// What a fundraiser brings in this offseason, rolled once a season, so reloading never changes it
function frAmount(s, id) {
  const k = .8 + .4 * seededRandom(hashSeed(`${SEASON.seed}:${s.id}:${id}:raise`))();
  return frOK(s, id) ? round100(FR[id].base * FR_SIZE[s.cls || "1A"] * frGrows(s, id) * k) : 0;
}
// "about $1,400": a fundraiser before it's run (the middle of its range)
const frGuess = (s, id) => frOK(s, id) ? round100(FR[id].base * FR_SIZE[s.cls || "1A"] * frGrows(s, id)) : 0;
const myFundraisers = () => (CAREER && CAREER.fr) || (CAREER ? (CAREER.fr = ["wash"]) : ["wash"]);
// Summer weeks the fundraisers take: one for each past the first
const fundWeeks = () => Math.max(0, myFundraisers().length - 1);

/* ---------- The offseason's books ---------- */
// SEASON.books, made when the job market closes, at the school you'll coach: { id, start (what was
// saved), school, boost, raised: { id: amount }, upkeep, slipped: [facility ids], built: [facility
// ids], bought: { id: amount }, banquet }. Upkeep comes out first; if the fund can't cover it, the
// best facility slips a level until it can.
function openBooks() {
  if (!SEASON || !SEASON.myId) return null;
  const s = mySchool(), B = SEASON.books;
  if (B && B.id === s.id) return B;
  facOf(s);
  const start = fundOf(s), school = SCHOOL_MONEY[s.cls || "1A"], boost = boosterGiving(s), slipped = [];
  let fund = start + school + boost;
  for (let guard = 0; guard < 25 && fund < upkeepOf(s); guard++) {
    const lv = s.fac, k = lv.indexOf(Math.max(...lv));
    if (lv[k] <= 1) break;
    lv[k]--; slipped.push(FAC_IDS[k]);
  }
  const upkeep = Math.min(fund, upkeepOf(s));
  fund -= upkeep;
  SEASON.books = { id: s.id, start, school, boost, upkeep, slipped, raised: {}, built: [], bought: {}, banquet: false };
  s.fund = fund;
  myFundraisers().forEach(id => runFundraiser(id));
  return SEASON.books;
}
function runFundraiser(id) {
  const B = SEASON.books, s = mySchool();
  if (!B || B.raised[id] != null) return 0;
  const amt = frAmount(s, id);
  B.raised[id] = amt; s.fund += amt;
  if (id === "banquet" && !B.banquet) { B.banquet = true; s.bst = clamp(boostersOf(s) + BANQUET_BOOST, 0, 100); }
  return amt;
}
const booksOpen = () => !!(SEASON && SEASON.phase === "offseason" && SEASON.books && SEASON.books.id === SEASON.myId && (!SEASON.market || SEASON.market.done));
// Turns a fundraiser on or off. Returns what happened, in a sentence.
function toggleFundraiser(id) {
  if (!FR[id] || !booksOpen()) return "";
  const plan = myFundraisers(), B = SEASON.books, s = mySchool(), on = plan.includes(id);
  if (on) {
    const amt = B.raised[id] || 0;
    if (s.fund < amt) return `You've already spent the ${moneyText(amt)} from the ${FR[id].name.toLowerCase()}.`;
    s.fund -= amt; delete B.raised[id];
    if (id === "banquet" && B.banquet) { B.banquet = false; s.bst = clamp(boostersOf(s) - BANQUET_BOOST, 0, 100); }
    plan.splice(plan.indexOf(id), 1);
    return `${FR[id].name} off. ${moneyText(s.fund)} in the fund. ${summerLeftText()}`;
  }
  if (!frOK(s, id)) return `The boosters aren't behind the team enough for a golf tournament yet. It needs enthusiasm of ${GOLF_NEEDS}.`;
  plan.push(id);
  const amt = runFundraiser(id);
  return `${FR[id].name}: ${moneyText(amt)} raised. ${moneyText(s.fund)} in the fund. ${summerLeftText()}`;
}
const summerLeftText = () => `${plural(SUMMER_WEEKS - fundWeeks(), "week")} of summer program left.`;
// Upgrades a facility a level, or cancels an upgrade made this offseason. Returns a sentence.
function upgradeFacility(id) {
  const k = FAC_IDS.indexOf(id);
  if (k < 0 || !booksOpen()) return "";
  const s = mySchool(), B = SEASON.books, lv = facOf(s), name = FACILITIES[k][1];
  if (lv[k] >= 5) return `The ${name.toLowerCase()} is already elite.`;
  const cost = FAC_COST[lv[k] + 1];
  if (s.fund < cost) return `Not enough in the fund: the upgrade costs ${moneyText(cost)}, and the fund has ${moneyText(s.fund)}.`;
  s.fund -= cost; lv[k]++; B.built.push(id);
  return `The ${name.toLowerCase()} is now ${facWord(lv[k])}. ${moneyText(s.fund)} left in the fund.`;
}
function cancelUpgrade(id) {
  const k = FAC_IDS.indexOf(id), B = SEASON.books;
  if (k < 0 || !booksOpen() || !B.built.includes(id)) return "";
  const s = mySchool(), lv = facOf(s), cost = FAC_COST[lv[k]];
  lv[k]--; s.fund += cost; B.built.splice(B.built.lastIndexOf(id), 1);
  return `Upgrade cancelled. The ${FACILITIES[k][1].toLowerCase()} is back to ${facWord(lv[k])}, and ${moneyText(cost)} is back in the fund.`;
}

/* ---------- One-season purchases ---------- */
// Bought in the offseason, for one summer and season (SEASON.books.bought). Team camp is $250 a
// returning player, and everyone who shows up for the summer goes.
const PURCHASES = [
  ["tcamp", "Team camp at a college", "A week at a college's camp: more 7-on-7, a head start on installing your plays, and college coaches get a look at your players."],
  ["strength", "A summer strength coach", "Summer weights count a quarter more."],
  ["tutor", "A tutor", "Study hall counts half again as much, and report cards rule players ineligible 30 percent less often this season."]
];
const BUY_IDS = PURCHASES.map(p => p[0]);
const BUY_NAMES = Object.fromEntries(PURCHASES.map(p => [p[0], p[1]]));
const TCAMP_EACH = 250, STRENGTH_COST = 3000, TUTOR_COST = 1500;
const TCAMP_SEVEN = 1.5, TCAMP_INSTALL = 20, STRENGTH_MUL = 1.25, TUTOR_STUDY = 1.5, TUTOR_CARDS = .7;
const buyCost = (s, id) => id === "tcamp" ? TCAMP_EACH * s.players.filter(p => p.yr < 12).length : id === "strength" ? STRENGTH_COST : TUTOR_COST;
const bought = id => !!(SEASON && SEASON.books && SEASON.books.id === SEASON.myId && SEASON.books.bought[id] != null);
function toggleBuy(id) {
  if (!BUY_NAMES[id] || !booksOpen()) return "";
  const s = mySchool(), B = SEASON.books;
  if (B.bought[id] != null) { s.fund += B.bought[id]; delete B.bought[id]; return `${BUY_NAMES[id]}: cancelled. ${moneyText(s.fund)} in the fund.`; }
  const cost = buyCost(s, id);
  if (s.fund < cost) return `Not enough in the fund: ${BUY_NAMES[id].toLowerCase()} costs ${moneyText(cost)}, and the fund has ${moneyText(s.fund)}.`;
  s.fund -= cost; B.bought[id] = cost;
  return `${BUY_NAMES[id]}: booked for ${moneyText(cost)}. ${moneyText(s.fund)} left in the fund.`;
}
// A tutor works through the season the summer leads into (s.tutor: that season's year)
const tutorOn = s => !!(s && SEASON && s.tutor === SEASON.year);

/* ---------- Coaching clinics ---------- */
// Your career earnings (CAREER.earned, less CAREER.spent) pay for up to two clinics an offseason
// (SEASON.clinics), and you can give some to the program fund
const CLINICS = [["state", "State clinic", 600, 30], ["national", "National clinic", 2000, 70]];
const CLINIC = Object.fromEntries(CLINICS.map(([id, name, cost, xp]) => [id, { id, name, cost, xp }]));
const myCash = () => CAREER ? Math.max(0, (CAREER.earned || 0) - (CAREER.spent || 0)) : 0;
const GIFTS = [500, 1000, 5000];
Object.assign(XP_WHY, { clinic: "coaching clinics", offer: "college offers for your players", signed: "players signing with colleges" });
function attendClinic(id) {
  const c = CLINIC[id];
  if (!c || !booksOpen()) return "";
  const done = SEASON.clinics || (SEASON.clinics = []);
  if (done.includes(id)) return `You've already been to the ${c.name.toLowerCase()} this offseason.`;
  if (myCash() < c.cost) return `The ${c.name.toLowerCase()} costs ${moneyText(c.cost)}, and you have ${moneyText(myCash())}.`;
  CAREER.spent = (CAREER.spent || 0) + c.cost; done.push(id);
  giveXP(c.xp, "clinic", 0);
  return `You went to the ${c.name.toLowerCase()}: ${c.xp} XP. ${moneyText(myCash())} of your own money left.`;
}
function giveToFund(amt) {
  if (!GIFTS.includes(amt) || !booksOpen()) return "";
  if (myCash() < amt) return `You have ${moneyText(myCash())} of your own money.`;
  CAREER.spent = (CAREER.spent || 0) + amt; mySchool().fund += amt;
  return `You gave ${moneyText(amt)}. ${moneyText(mySchool().fund)} in the fund, and ${moneyText(myCash())} of your own money left.`;
}

/* ---------- Every school ---------- */
// Boosters and facilities for every school in the state (a new state, and saves from before money)
function moneyInit(se) {
  const keep = SEASON;
  SEASON = se;
  try { for (const id in se.schools) { const s = se.schools[id]; boostersOf(s); facOf(s); } } finally { SEASON = keep; }
}
// The year-end review moves every school's boosters with its season, and the computer schools build
function moneyYearEnd(res) {
  for (const id in SEASON.schools) {
    const s = SEASON.schools[id];
    moveBoosters(s, res[id]);
    if (id !== SEASON.myId) cpuFacilities(s, SEASON.year);
  }
}
