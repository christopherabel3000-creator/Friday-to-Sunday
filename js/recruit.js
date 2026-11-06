// Friday to Sunday: college recruiting. The state's colleges, how they see a player, the offers that
// come in five windows, signing day, and what sending players on does for your program (Milestone 3b).
"use strict";

/* ---------- The colleges ---------- */
// 120 fictional programs, built from the state's first seed: 24 in Tier 1 (the top programs), 36 in
// Tier 2 and 60 in Tier 3 (small colleges). Milestone 4 will put you in this same college world.
// Kept while the page is open, never saved: the same seed always builds the same colleges.
const TIER_SIZES = [24, 36, 60];
const TIER_NAMES = ["", "Tier 1", "Tier 2", "Tier 3"];
const COLLEGE_FORMS = [
  [t => `${t} State`, t => `University of ${t}`, t => `${t} A&M`],
  [t => `${t} State`, t => `${t} Tech`, t => `Central ${t}`, t => `${t} University`],
  [t => `${t} College`, t => `${t} Christian`, t => `${t} Wesleyan`, t => `${t} State College`]
];
let COLLEGE_CACHE = null;
// The colleges are the college world's programs (cworld.js): the power conferences are Tier 1, the
// rest of FBS and the FCS Tier 2, and Division II and III Tier 3. Without a college world (an
// exhibition, an old test), 120 made-up colleges as before.
const LEVEL_TIER = { P4: 1, G5: 2, FCS: 2, D2: 3, D3: 3 };
function colleges() {
  const W = colWorld();
  if (W) {
    if (COLLEGE_CACHE && COLLEGE_CACHE.world === W.world && COLLEGE_CACHE.col) return COLLEGE_CACHE.list;
    const list = Object.values(W.schools).map(s => ({ i: s.id, tier: LEVEL_TIER[s.cls], name: s.town, mascot: s.mascot, color: s.color }));
    COLLEGE_CACHE = { world: W.world, col: true, list, by: Object.fromEntries(list.map(c => [c.i, c])) };
    return list;
  }
  const world = SEASON ? SEASON.world : 0;
  if (COLLEGE_CACHE && COLLEGE_CACHE.world === world && !COLLEGE_CACHE.col) return COLLEGE_CACHE.list;
  const g = dice(hashSeed(`${world}:colleges`)), taken = new Set(), names = new Set(), list = [], mascots = g.shuffle(MASCOTS);
  TIER_SIZES.forEach((n, t) => {
    for (let k = 0; k < n; k++) {
      let nm = "";
      for (let i = 0; i < 20 && (!nm || names.has(nm)); i++) nm = g.pick(COLLEGE_FORMS[t])(townName(g, taken));
      names.add(nm);
      const color = g.pick(SCHOOL_COLORS);
      list.push({ i: list.length, tier: t + 1, name: nm, mascot: mascots[list.length % mascots.length], color: color[0] });
    }
  });
  COLLEGE_CACHE = { world, list, by: Object.fromEntries(list.map(c => [c.i, c])) };
  return list;
}
// A college by id. An offer from before the college world (a number) goes to a program at the same
// tier, the same one every time.
function collegeOf(i) {
  const list = colleges();
  if (COLLEGE_CACHE.by[i]) return COLLEGE_CACHE.by[i];
  if (typeof i === "number" && COLLEGE_CACHE.col) {
    const tier = i < TIER_SIZES[0] ? 1 : i < TIER_SIZES[0] + TIER_SIZES[1] ? 2 : 3, at = list.filter(c => c.tier === tier);
    return at[i % at.length];
  }
  return null;
}
// "Tier 2 Lakeshore State"
const collegeText = i => { const c = collegeOf(i); return c ? `${TIER_NAMES[c.tier]} ${c.name}` : ""; };
// How many players a college wants at a position this year: 2 to 4 linemen on each side, up to a
// kicker or punter, and 0 to 3 at each other spot
function collegeNeed(c, year, pos) {
  const h = hashSeed(`${SEASON.world}:${c.i}:${year}:${pos}:need`);
  return pos === "OL" || pos === "DL" ? 2 + h % 3 : pos === "K" || pos === "P" ? h % 2 : h % 4;
}
// The offer chances were set for 120 colleges (24, 36 and 60 by tier); the college world has more at
// each tier, so each one offers less often and the totals stay where they were
function tierScale(tier) {
  const cs = colleges(), n = cs.filter(c => c.tier === tier).length;
  return n ? TIER_SIZES[tier - 1] / n : 1;
}

/* ---------- How a college sees a player ---------- */
// His recruit rating: his overall at his best position, plus 0.4 of the gap to his true potential
// (colleges see past your staff's estimate), plus 0.15 a point of speed over 50 at the skill spots and
// in the secondary, or of strength over 50 on the lines
const SPEED_SPOTS = new Set(["RB", "WR", "TE", "CB", "S"]), STRENGTH_SPOTS = new Set(["OL", "DL"]);
function recruitOf(p) {
  const pos = [p.pos, p.pos2].filter(x => POS_INFO[x]).sort((a, b) => ovr(p, b) - ovr(p, a))[0] || p.pos, o = ovr(p, pos);
  let r = o + .4 * Math.max(0, (p.pot || o) - o);
  if (SPEED_SPOTS.has(pos)) r += .15 * Math.max(0, p.r.spd - 50);
  if (STRENGTH_SPOTS.has(pos)) r += .15 * Math.max(0, p.r.str - 50);
  return { r: Math.round(r * 10) / 10, pos };
}
// Each tier's bar (index by tier): a player has to clear it for that tier's colleges to get interested
const TIER_BAR = [0, 74, 66, 58];
const recruitWord = r => r >= TIER_BAR[1] ? "a top prospect" : r >= TIER_BAR[2] ? "a strong prospect" : r >= TIER_BAR[3] ? "a college prospect" : "";
// Exposure, from 0.5 to 1.2: bigger schools get seen more, and team camp and playoff games help
const EXPOSURE = { "1A": .55, "2A": .65, "3A": .75, "4A": .85, "5A": .95, "6A": 1 };
const playoffGames = id => SEASON.bracket ? SEASON.bracket.rounds.reduce((n, r) => n + r.filter(gm => gameHas(gm, id) && played(gm)).length, 0) : 0;
const exposureOf = (s, p) => clamp(EXPOSURE[s.cls || "1A"] + (p.tc === offerYear(p) ? .1 : 0) + Math.min(.15, .05 * playoffGames(s.id)), .5, 1.2);
// The season a player's offers count for: his senior season
const offerYear = p => SEASON.year + (12 - p.yr);
// The chance a college that needs him offers in one window
const OFFER_K = .01, OFFER_MAX = .5;
const offerChance = (rr, bar, expo) => Math.min(OFFER_MAX, OFFER_K * expo * (1 + (rr - bar) / 5));

/* ---------- Offers ---------- */
// Five windows: the spring after his junior season ("spring"), the summer for players at team camp
// ("summer"), after weeks 4 and 8 of his senior season ("w4", "w8"), and after the playoffs
// ("post"). Each window is rolled once (its dice come from the player and the window), so reloading
// never changes it. Offers are kept with the player: p.off = [[college, window]].
const WINDOWS = { spring: 11, summer: 11, w4: 12, w8: 12, post: 12 };
function rollOffers(s, w) {
  const yr = WINDOWS[w], out = [];
  if (!yr || !isFull(s)) return out;
  const cs = colleges(), scale = [0, 1, 2, 3].map(t => t ? tierScale(t) : 0);
  s.players.forEach(p => {
    if (p.yr !== yr || (w === "summer" && p.tc !== SEASON.year + 1)) return;
    const { r, pos } = recruitOf(p), year = offerYear(p), expo = exposureOf(s, p);
    if (r < TIER_BAR[3]) return;
    const have = new Set((p.off || []).map(o => o[0]));
    cs.forEach(c => {
      const bar = TIER_BAR[c.tier];
      if (r < bar || have.has(c.i) || !collegeNeed(c, year, pos)) return;
      if (seededRandom(hashSeed(`${SEASON.world}:${p.id}:${year}:${w}:${c.i}`))() >= offerChance(r, bar, expo) * scale[c.tier]) return;
      (p.off = p.off || []).push([c.i, w]); have.add(c.i);
      out.push({ s, p, c });
    });
  });
  return out;
}
// A player's offers, best tier first: [{ c, tier }]
const offersOf = p => (p.off || []).map(o => collegeOf(o[0])).filter(Boolean).sort((a, b) => a.tier - b.tier || a.i - b.i);
// "two Tier 2 offers and one Tier 3 offer"
function offerSummary(p) {
  const n = [0, 0, 0, 0];
  offersOf(p).forEach(c => n[c.tier]++);
  return andList([1, 2, 3].filter(t => n[t]).map(t => plural(n[t], `${TIER_NAMES[t]} offer`)));
}
// Rolls a window for every school in your district, and for your players gives XP for each first
// offer from a tier. Returns the news: your players' offers, and the district's Tier 1 offers.
const OFFER_XP = 5;
function offerWindow(w) {
  if (!SEASON || !SEASON.myId) return [];
  const news = [];
  SEASON.districts[SEASON.district - 1].ids.forEach(id => {
    const s = SEASON.schools[id], mine = id === SEASON.myId;
    rollOffers(s, w).forEach(({ p, c }) => {
      if (mine) {
        const tiers = p.offT || (p.offT = []);
        if (!tiers.includes(c.tier)) { tiers.push(c.tier); giveXP(OFFER_XP, "offer", SEASON.week); }
        news.push(`${fullName(p)} got an offer from ${collegeText(c.i)}.`);
      } else if (c.tier === 1) news.push(`The ${s.mascot}' ${fullName(p)} got an offer from ${collegeText(c.i)}.`);
    });
  });
  return news;
}

/* ---------- Signing day ---------- */
// After the season summary, before the athletic director's review. Each senior with an offer he
// qualifies for signs with the highest tier that offered. Tier 1 and Tier 2 need grades of 60 or more.
// p.sign: the college he signed with.
const GRADE_NEED = 60;
const qualifies = (p, tier) => tier === 3 || gradesOf(p) >= GRADE_NEED;
function signWith(p, year) {
  const ok = offersOf(p).filter(c => qualifies(p, c.tier));
  if (!ok.length) return null;
  const pos = recruitOf(p).pos, top = ok[0].tier;
  return ok.filter(c => c.tier === top).sort((a, b) => collegeNeed(b, year, pos) - collegeNeed(a, year, pos) || a.i - b.i)[0];
}
// Rewards by tier (index by tier): XP, reputation (up to 4 a year), and booster enthusiasm
const SIGN_XP = [0, 40, 20, 10], SIGN_REP = [0, 2, 1, .5], SIGN_REP_MAX = 4, SIGN_BOOST = [0, 4, 2, 1];
// Every school in your district signs its seniors. Yours earn XP, reputation and booster enthusiasm.
// SEASON.signing: { mine: [{ id, name, pos, c }], pending: [{ name, tier }] (offers held back by
// grades), xp, rep, others: [lines] }
function signingDay() {
  if (SEASON.signing) return SEASON.signing;
  const year = SEASON.year, me = SEASON.myId, out = { mine: [], pending: [], xp: 0, rep: 0, others: [] };
  SEASON.districts[SEASON.district - 1].ids.forEach(id => {
    const s = SEASON.schools[id];
    if (!isFull(s)) return;
    let n = 0;
    s.players.filter(p => p.yr >= 12 && p.off && p.off.length).forEach(p => {
      const c = signWith(p, year), held = offersOf(p).filter(x => !qualifies(p, x.tier) && (!c || x.tier < c.tier));
      if (id === me && held.length) out.pending.push({ name: fullName(p), tier: held[0].tier, signed: !!c });
      if (!c) return;
      p.sign = c.i; n++;
      // He joins that program's roster next season (cyear.js)
      if (typeof c.i === "string") sendToCollege(p, c.i, year);
      s.bst = clamp(boostersOf(s) + SIGN_BOOST[c.tier], 0, 100);
      if (id === me) {
        out.mine.push({ id: p.id, name: fullName(p), pos: recruitOf(p).pos, c: c.i });
        out.xp += giveXP(SIGN_XP[c.tier], "signed", 0);
        out.rep += SIGN_REP[c.tier];
      } else if (c.tier <= 2) out.others.push(`The ${s.mascot}' ${fullName(p)} signed with ${collegeText(c.i)}.`);
    });
    if (n) (s.sent = s.sent || {})[year] = n;
  });
  out.rep = Math.min(SIGN_REP_MAX, out.rep);
  if (CAREER && out.rep) CAREER.rep = clamp(Math.round((myRep() + out.rep) * 10) / 10, 0, 100);
  if (CAREER) {
    const sent = CAREER.sent || (CAREER.sent = [0, 0, 0, 0]);
    out.mine.forEach(x => { sent[collegeOf(x.c).tier]++; });
  }
  out.others = out.others.slice(0, 4);
  SEASON.signing = out;
  return out;
}
// Players a school has sent to college in the four years before this one: word gets around, so each
// one adds 2 points to every hallway pitch and 0.1 to every freshman class
const sentLately = (s, year) => { let n = 0; for (const y in s.sent || {}) if (+y < year && +y >= year - 4) n += s.sent[y]; return n; };
// "Tier 1: 1. Tier 2: 3. Tier 3: 6." (CAREER.sent by tier)
function sentText() {
  const n = (CAREER && CAREER.sent) || [0, 0, 0, 0], tot = n[1] + n[2] + n[3];
  return tot ? `${plural(tot, "player")} sent to college: ${[1, 2, 3].filter(t => n[t]).map(t => `${n[t]} to ${TIER_NAMES[t]}`).join(", ")}.` : "No players sent to college yet.";
}
// Your juniors and seniors that colleges are interested in, best first
function myProspects() {
  return mySchool().players.filter(p => p.yr >= 11 && (recruitOf(p).r >= TIER_BAR[3] || (p.off && p.off.length))).sort((a, b) => recruitOf(b).r - recruitOf(a).r);
}
// One prospect in a sentence: "Marcus Hill, senior running back: a strong prospect. Two Tier 2 offers. Tier 2 offers wait on his grades (54)."
function prospectText(p) {
  const { r, pos } = recruitOf(p), w = recruitWord(r), offs = offersOf(p), held = offs.filter(c => !qualifies(p, c.tier));
  const bits = [`${fullName(p)}, ${yearName(p)} ${posName(pos)}${w ? `: ${w}` : ""}.`];
  bits.push(offs.length ? `${capFirst(offerSummary(p))}.` : "No offers yet.");
  if (p.sign != null) bits.push(`Signed with ${collegeText(p.sign)}.`);
  else if (held.length) bits.push(`His ${TIER_NAMES[held[0].tier]} offers need grades of ${GRADE_NEED}; he has ${gradesOf(p)}.`);
  return bits.join(" ");
}
