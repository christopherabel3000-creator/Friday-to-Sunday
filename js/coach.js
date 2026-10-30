// Friday to Sunday: coaches
"use strict";

/* ---------- Coach ratings ---------- */
// Every coach is rated 1 to 100. Program building and Recruiting arrive with the milestones that use them.
const COACH_RATINGS = [["off", "Offense"], ["def", "Defense"], ["st", "Special teams"], ["dev", "Development"], ["mot", "Motivation"], ["gm", "Game management"], ["sct", "Scouting"]];
// Small-school coaches: mostly 30s to 50s, a few better or worse
const COACH_LEVEL = { "1A": 42 };
function genCoach(g, cls) {
  const base = g.n(COACH_LEVEL[cls] || 42, 7), c = { first: g.pick(COACH_FIRST), last: g.pick(LAST_NAMES) };
  COACH_RATINGS.forEach(([k]) => { c[k] = clamp(Math.round(base + g.n(0, 8)), 15, 90); });
  // Small schools lean on the run
  c.off_style = g.w({ bal: 3, gnp: 4, air: 1.5, wc: 1.5 });
  c.def_style = g.w({ bal: 3, blz: 2, nfz: 1.5, rs: 2.5 });
  return c;
}
const coachName = c => `${c.first} ${c.last}`;

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
  inst: { name: "Install expert", cost: 200, desc: "Install time teaches plays 30 percent faster." }
};
const PERK_IDS = ["qbw", "linew", "skill", "dbs", "offg", "defm", "blitz", "film", "disg", "trick", "motv", "inst"];
const coachHas = (c, k) => !!(c && c.perks && c.perks.includes(k));
// Growth for one practice unit: the background's (1.3 for a former quarterback's quarterbacks, say),
// times 1.25 for a perk that covers it
const PERK_UNITS = { qbw: ["qb"], linew: ["ol", "front"], skill: ["skill"], dbs: ["secondary"] };
function unitGrowMul(c, unit) {
  let m = (c && c.grow && c.grow[unit]) || 1;
  ((c && c.perks) || []).forEach(k => { if ((PERK_UNITS[k] || []).includes(unit)) m *= 1.25; });
  return m;
}
