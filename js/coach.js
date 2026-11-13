// Friday to Sunday: coaches
"use strict";

/* ---------- Coach ratings ---------- */
// Every coach is rated 1 to 100. Program building came with more seasons (Milestone 2); Recruiting
// arrives with college.
const COACH_RATINGS = [["off", "Offense"], ["def", "Defense"], ["st", "Special teams"], ["dev", "Development"], ["mot", "Motivation"], ["gm", "Game management"], ["sct", "Scouting"], ["pbd", "Program building"], ["rct", "Recruiting"]];
// Small-school coaches: mostly 30s to 50s, a few better or worse
// A typical coach at each class: bigger schools hire a little better
const COACH_LEVEL = { "1A": 42, "2A": 44, "3A": 46, "4A": 48, "5A": 50, "6A": 52, D3: 52, D2: 55, FCS: 58, G5: 61, P4: 65, PRO: 70 };
// The ratings a generated coach rolls dice for, in the order they're rolled. Program building is
// worked out from the coach instead (coachPbd), so the same seed still builds the same state.
const ROLLED_RATINGS = ["off", "def", "st", "dev", "mot", "gm", "sct"];
function genCoach(g, cls) {
  const base = g.n(COACH_LEVEL[cls] || 42, 7), c = { first: g.pick(COACH_FIRST), last: g.pick(LAST_NAMES) };
  ROLLED_RATINGS.forEach(k => { c[k] = clamp(Math.round(base + g.n(0, 8)), 15, 90); });
  c.pbd = coachPbd(c);
  c.rct = coachRct(c);
  // Small schools lean on the run, and bigger ones throw a little more
  // (college coaches throw about as much as a 4A coach: real college teams still run about half the time)
  // (pro coaches throw more: real NFL teams pass on about three plays in five)
  const k = isPro(cls) ? 6 : Math.min(4, classIndex(cls));
  c.off_style = g.w({ bal: 3, gnp: 4 - .4 * k, air: 1.5 + .3 * k, wc: 1.5 + .3 * k });
  c.def_style = g.w({ bal: 3, blz: 2, nfz: 1.5, rs: 2.5 });
  // About one run-first coach in four runs the Option, below the pros (worked out from his name, so
  // building a coach rolls no new dice)
  if (c.off_style === "gnp" && !isPro(cls) && hashSeed(`${c.first} ${c.last}:option`) % 4 === 0) c.off_style = "opt";
  return c;
}
const coachName = c => `${c.first} ${c.last}`;
// Program building for a coach who doesn't have it yet: about his Motivation, give or take 8
function coachPbd(c) {
  if (!c) return 42;
  if (c.pbd != null) return c.pbd;
  return clamp(Math.round(42 + ((c.mot || 42) - 42) * .5 + (hashSeed(`${c.first} ${c.last}:pbd`) % 17) - 8), 15, 90);
}

// Recruiting (for college) for a coach who doesn't have it yet: about his Program building, give or take 8
function coachRct(c) {
  if (!c) return 45;
  if (c.rct != null) return c.rct;
  return clamp(Math.round(45 + (coachPbd(c) - 45) * .5 + (hashSeed(`${c.first} ${c.last}:rct`) % 17) - 8), 15, 90);
}

/* ---------- How ratings coach a game ---------- */
// For every computer coach, and for any game that's simmed, the ratings decide how the plays get
// called, on Gridiron Duel's difficulty scale (its Pro setting is about a 65 here):
//   scout: whether it charts the other team's habits; adapt/prior: how hard and how fast it trusts them
//   counter: how hard it plays against the other team's style
//   aud: how likely it is to audible out of a bad play; disg: how often it disguises
//   sharpO/sharpD: how closely play calls follow the situation (lower = more random)
//   wild: how often a disguise shows a random look instead of the best bait
// Offense and Defense also give every coach, human or computer, a small execution edge on that side.
function coachParams(c) {
  const t = r => (r - 20) / 70; // a 20 is the bottom of each range, a 90 the top
  return {
    scout: c.sct >= 25, adapt: lerp(.3, 1.3, t(c.sct)), prior: lerp(5, 2, t(c.sct)), counter: lerp(.4, 1.3, t(c.sct)),
    aud: lerp(.15, .9, t(c.gm)), disg: lerp(.35, 1.1, t(c.def)), wild: lerp(.35, .15, t(c.def)),
    sharpO: lerp(.7, 1.15, t(c.off)), sharpD: lerp(.7, 1.15, t(c.def)),
    execO: (c.off - 50) * .005, execD: (c.def - 50) * .005
  };
}

/* ---------- Coordinators (Milestone 6) ---------- */
// A coordinator calls one side of the ball for a computer head coach. His side: the positions on its
// depth chart, the practice units he runs, and the perks that work on it.
const COORD_ROLES = { oc: "Offensive coordinator", dc: "Defensive coordinator" };
const COORD_SIDE = { oc: "offense", dc: "defense" };
const COORD_POS = { oc: ["QB", "RB", "WR", "TE", "OL"], dc: ["DL", "LB", "CB", "S"] };
const COORD_UNITS = { oc: ["qb", "skill", "ol"], dc: ["front", "secondary"] };
const COORD_PERKS = { oc: ["offg", "disg"], dc: ["defm", "blitz"] };
const coordPlay = (role, id) => (role === "oc") === !!OFFP[id];
// The coach a coordinator's team takes into a game: the head coach, with the coordinator's rating,
// perks, specialty and Motivation on his side of the ball. (Scouting at the line is the offense's.)
function gameCoach(hc, me, role) {
  const c = clone(hc), oc = role === "oc", k = oc ? "off" : "def", side = COORD_PERKS[role], other = COORD_PERKS[oc ? "dc" : "oc"];
  c[k] = me[k];
  if (oc) c.sct = me.sct;
  c.perks = (hc.perks || []).filter(p => !side.includes(p)).concat((me.perks || []).filter(p => side.includes(p)));
  c.sideMot = oc ? { off: me.mot, def: hc.mot } : { off: hc.mot, def: me.mot };
  c.sideMotv = oc ? { off: coachHas(me, "motv"), def: coachHas(hc, "motv") } : { off: coachHas(hc, "motv"), def: coachHas(me, "motv") };
  c.sideSpec = oc ? { off: me.spec || "", def: hc.spec || "" } : { off: hc.spec || "", def: me.spec || "" };
  c.you = false;
  return c;
}

/* ---------- Your coach ---------- */
// A first-year high school head coach starts at 40 in everything, plus what the background brings.
// grow: faster growth for those practice units (practice.js). spec: a specialty ("run": the run game,
// a small edge on runs and against them).
const COACH_START = 40;
const BACKGROUNDS = {
  qb: { name: "Former quarterback", desc: "Offense, and faster quarterback growth.", add: { off: 12, gm: 6 }, grow: { qb: 1.3 } },
  line: { name: "Former lineman", desc: "The run game, and faster growth on both lines.", add: { off: 6, def: 6 }, grow: { ol: 1.3, front: 1.3 }, spec: "run" },
  def: { name: "Defensive mind", desc: "Defense, and a sharp eye for scouting.", add: { def: 12, sct: 6 } },
  st: { name: "Special teams ace", desc: "Special teams, and faster kicker growth.", add: { st: 15, gm: 5 }, grow: { kick: 1.3 } },
  teach: { name: "Teacher and motivator", desc: "Motivation and Development.", add: { mot: 10, dev: 10 } }
};
const BACKGROUND_IDS = ["qb", "line", "def", "st", "teach"];
function makeCoach(first, last, bg, offStyle, defStyle) {
  const b = BACKGROUNDS[bg] || BACKGROUNDS.teach, c = { first, last, you: true, bg: BACKGROUNDS[bg] ? bg : "teach", off_style: offStyle, def_style: defStyle };
  COACH_RATINGS.forEach(([k]) => { c[k] = COACH_START + (b.add[k] || 0); });
  if (b.grow) c.grow = clone(b.grow);
  if (b.spec) c.spec = b.spec;
  return c;
}
// "Coach Abel", or just "Your coach" before he has a name
const yourCoachName = c => c && c.last ? `Coach ${c.last}` : "Your coach";
// What each rating does, for the coach's own screen
const RATING_EFFECTS = {
  off: "A small edge on every snap on offense.",
  def: "A small edge on every snap on defense.",
  st: "Field goals, punts, and covering kicks.",
  dev: "How fast your players grow in practice.",
  mot: "An edge late in close games and comebacks.",
  gm: "Help on the call sheet. At 45 and up, your staff gives the odds of converting on fourth down as a percentage.",
  pbd: "More freshmen come out, more of your players show up for the summer program, and more of the athletes you pitch say yes.",
  rct: "College recruiting: how much your staff's time with a prospect counts, and how prospects see you.",
  sct: "Scouting reports and the edge from film study. At 45 and up, a fuller report from the same film time. At 60 and up, your staff sometimes spots a disguised look at the line."
};

/* ---------- XP and perks ---------- */
// Your coach earns XP during the season (career.js) and spends it on ratings and perks. A rating point
// costs the rating minus 20 (21 XP to go from 41 to 42, 41 from 61 to 62), so each one costs more.
const rateCost = r => Math.max(10, r - 20);
const RATING_MAX = 99;
// Perks: what each one does is wired in where it happens (practice, the snap, scouting)
const PERKS = {
  qbw: { name: "Quarterback whisperer", cost: 180, desc: "Your quarterbacks grow 25 percent faster, in practice and over the summer." },
  linew: { name: "Line whisperer", cost: 180, desc: "Your offensive linemen, defensive linemen and linebackers grow 25 percent faster." },
  skill: { name: "Skill position coach", cost: 180, desc: "Your running backs, receivers and tight ends grow 25 percent faster." },
  dbs: { name: "Secondary coach", cost: 180, desc: "Your cornerbacks and safeties grow 25 percent faster." },
  offg: { name: "Offensive guru", cost: 250, desc: "A bigger edge on the plays your offensive style is built around." },
  defm: { name: "Defensive mastermind", cost: 250, desc: "A bigger edge on the calls your defensive style is built around." },
  blitz: { name: "Blitz specialist", cost: 200, desc: "Your blitzes get home a little more often: Run Blitz, All-Out Blitz and Zone Blitz." },
  film: { name: "Film junkie", cost: 200, desc: "A fuller scouting report from the same film time, and a bigger edge on the calls you studied." },
  disg: { name: "Disguise detector", cost: 150, desc: "Your staff spots a disguised look at the line about a third of the time, whatever your Scouting." },
  trick: { name: "Trick play artist", cost: 150, desc: "Fake punts, fake field goals and Tackle Eligible work more often." },
  motv: { name: "Motivator", cost: 200, desc: "A bigger edge late in close games and comebacks." },
  inst: { name: "Install expert", cost: 200, desc: "Install time teaches plays 30 percent faster." },
  rec: { name: "Hallway recruiter", cost: 150, desc: "One more pitch each offseason, and athletes say yes more often." },
  rcr: { name: "Recruiter", cost: 200, desc: "College recruiting: your staff's time with each prospect counts 20 percent more, and prospects start out more interested in you." },
  tev: { name: "Talent evaluator", cost: 200, desc: "The pro draft: your staff's scouting time goes 40 percent further, so what you know about each prospect narrows faster." }
};
const PERK_IDS = ["qbw", "linew", "skill", "dbs", "offg", "defm", "blitz", "film", "disg", "trick", "motv", "inst", "rec", "rcr", "tev"];
const coachHas = (c, k) => !!(c && c.perks && c.perks.includes(k));
// Growth for one practice unit: the background's (1.3 for a former quarterback's quarterbacks, say),
// times 1.25 for a perk that covers it
const PERK_UNITS = { qbw: ["qb"], linew: ["ol", "front"], skill: ["skill"], dbs: ["secondary"] };
function unitGrowMul(c, unit) {
  let m = (c && c.grow && c.grow[unit]) || 1;
  ((c && c.perks) || []).forEach(k => { if ((PERK_UNITS[k] || []).includes(unit)) m *= 1.25; });
  return m;
}
