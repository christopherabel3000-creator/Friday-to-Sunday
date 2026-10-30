// Friday to Sunday: the game engine
// The play calling comes from Gridiron Duel (version 4): the playbook, personnel packages, team
// styles, audibles and disguises, the clock, overtime and the game flow. Its sections keep
// Gridiron Duel's names, so a fix can be carried between the two games. What's different here:
// every rule that differs by level is read from rules.js (R()), each team is a real roster with its
// own coach (team.js, coach.js), and the snap itself is rolled from the players on the field (sim.js).
"use strict";

/* ---------- Playbook ---------- */
const OFF_IDS = ["ir", "or", "dr", "sc", "sp", "ms", "dp", "pa"];
const DEF_IDS = ["rb", "ba", "ma", "zo", "c3", "pr", "ab", "zb"];
const OFFP = {
  ir: { name: "Inside Run", kind: "run", tag: "Run", desc: "Downhill between the tackles. Steady and low risk.", mean: 3.8, sd: 2.8, tfl: .08, big: .025, fum: .012, oob: .04 },
  or: { name: "Outside Zone", kind: "run", tag: "Run", desc: "Stretch to the edge. Boom or bust.", mean: 4.0, sd: 5, tfl: .15, big: .05, fum: .015, oob: .35 },
  dr: { name: "Draw", kind: "run", tag: "Run", desc: "Show pass, then hand it off. Gashes pass rushers and soft coverage, but a disciplined front sniffs it out.", mean: 4.0, sd: 4.2, tfl: .1, big: .04, fum: .012, oob: .05 },
  sc: { name: "Screen", kind: "pass", tag: "Pass", desc: "Let the rush come, then dump it off behind it.", comp: .80, mean: 5, sd: 4.5, min: -3, int: .012, sack: .02, air: 0 },
  sp: { name: "Quick Game", kind: "pass", tag: "Pass", desc: "Slants and outs. Moves the chains.", comp: .66, mean: 7, sd: 3, min: 1, int: .022, sack: .04, air: 6 },
  ms: { name: "Mesh", kind: "pass", tag: "Pass", desc: "Two receivers cross underneath and rub off each other. Built to beat man coverage.", comp: .70, mean: 6, sd: 3.5, min: 2, int: .018, sack: .035, air: 4 },
  dp: { name: "Deep Shot", kind: "pass", tag: "Pass", desc: "Go routes and posts. Big gain or nothing.", comp: .38, mean: 27, sd: 9, min: 13, int: .045, sack: .07, air: 22, deep: 1 },
  pa: { name: "Play-Action", kind: "pass", tag: "Pass", desc: "Sell the run, then throw over the top.", comp: .54, mean: 16, sd: 7, min: 6, int: .03, sack: .06, air: 14, deep: 1 },
  qs: { name: "QB Sneak", kind: "run", tag: "Short yardage", desc: "The quarterback lunges behind the center. Almost never more than a few yards, but hard to stop for one.", mean: 2.0, sd: 1.3, ms: .5, tfl: .06, big: 0, fum: .006, oob: 0, noBig: true, short: true },
  hm: { name: "Hail Mary", kind: "pass", tag: "Last play", desc: "Everybody sprints to the end zone and the QB heaves it. About 1 in 10 from 45 yards out (1 in 20 against Prevent), and about 1 in 5 gets picked off.", sack: .06, int: .2, air: 60, deep: 1, hail: true },
  te: { name: "Tackle Eligible", kind: "pass", tag: "Trick", desc: "Jumbo only. Throw to the tackle who reported eligible. Short, but a shock.", comp: .74, mean: 4, sd: 2.5, min: 1, int: .02, sack: .03, air: 3, noBig: true }
};
const DEFP = {
  rb: { name: "Run Blitz", tag: "Front", desc: "Crash the gaps. Stuffs runs, exposed to play-action." },
  ba: { name: "Base 4-3", tag: "Front", desc: "Balanced look. No big holes, no big wins." },
  ma: { name: "Man Coverage", tag: "Coverage", desc: "Tight on quick routes. Beatable deep." },
  zo: { name: "Cover 2 Zone", tag: "Coverage", desc: "Takes away deep shots and screens. Runs find room." },
  pr: { name: "Prevent", tag: "Coverage", desc: "Protect the deep ball. Gives up the short stuff." },
  c3: { name: "Cover 3", tag: "Coverage", desc: "Three deep, four underneath, an extra man near the box. Solid against the run and the deep ball, soft in the flats." },
  ab: { name: "All-Out Blitz", tag: "Pressure", desc: "Send everyone. Sack or get burned." },
  zb: { name: "Zone Blitz", tag: "Pressure", desc: "Rush five but drop a lineman into the short zones. Baits screens and hot throws into interceptions. Burned deep." },
  blk: { name: "Block the Kick", tag: "Special teams", desc: "Sell out to block it. Risks roughing the kicker, and a fake would walk right past you." },
  ret: { name: "Punt Return", tag: "Special teams", desc: "Set up a return. Better field position, but soft if they fake or go for it." }
};
const FAKE_IDS = ["fp", "ffg"];
// Plays that can be run to the sideline late in a half: the ball carrier aims to get out of bounds.
// Fewer yards on every play. Cover 2 corners squat on the short throws to the boundary, and man
// coverage tightens up on all sideline throws; the deep sideline throw is a Cover 2 "hole shot".
const SIDE_IDS = ["or", "sc", "sp", "dp", "pa"];
const SIDE_EDGE = { sc: { zo: -1, ma: -.5 }, sp: { zo: -1, ma: -.5 }, dp: { ma: -.5 }, pa: { ma: -.5 }, or: {} };
const sideOn = id => SIDE_IDS.includes(id);
// What the offense sees at the line for each defensive call. Defenses sometimes disguise it.
const LOOKS = {
  rb: { name: "Eight in the box", hint: "A safety creeps down. Often a run blitz." },
  ba: { name: "Even front, one high safety", hint: "Balanced. Doesn't tip much either way." },
  ma: { name: "Press corners", hint: "Corners up in the receivers' faces. Often man coverage." },
  zo: { name: "Two high safeties", hint: "Deep help on both sides. Often Cover 2." },
  pr: { name: "Soft corners, safeties deep", hint: "Playing way off the ball. Often prevent." },
  ab: { name: "Linebackers walked up", hint: "Bodies on the line. Pressure could be coming." },
  c3: { name: "One high safety, corners bailing", hint: "A single safety deep in the middle and the corners backpedal at the snap. Often Cover 3." },
  zb: { name: "Linebackers mugging the A-gaps", hint: "Looks like pressure, but one of those rushers might drop. Often a zone blitz."  },
  blk: { name: "Everyone on the line", hint: "The kick-block unit is out there. They're coming after the kick." },
  ret: { name: "Returner back deep", hint: "The punt return unit is on the field. Light up front." }
};
// Special teams units can't be disguised: you can see who ran onto the field
// How often a computer defense disguises each call (a human defense chooses for itself)
const DISGUISE = { rb: .3, ba: .25, ma: .4, zo: .33, c3: .35, pr: .28, ab: .45, zb: .5, blk: 0, ret: 0 };
// Disguising means rotating late into the real call, so the defense is a step slow at the snap:
// a small edge for the offense on that play (on the same scale as the play-call table)
const DISGUISE_COST = .25;
// Matchup edge for the offense: +2 great call, -2 the defense guessed right
const M = {
  ir: { rb: -2, ba: 0, ma: 1, zo: 1, pr: 1, ab: -1, c3: -1, zb: 0 },
  or: { rb: -2, ba: 0, ma: 0, zo: 1, pr: 1, ab: 1, c3: 0, zb: -1 },
  dr: { rb: -1, ba: -1, ma: 1, zo: 1, pr: 2, ab: 2, c3: 0, zb: 1 },
  sc: { rb: 1, ba: 0, ma: 0, zo: -1, pr: 1, ab: 2, c3: 0, zb: -2 },
  sp: { rb: 0, ba: 0, ma: -1, zo: 0, pr: 1, ab: 1, c3: 1, zb: -1 },
  ms: { rb: 0, ba: 0, ma: 2, zo: -1, pr: 1, ab: 0, c3: 0, zb: -1 },
  dp: { rb: 1, ba: 0, ma: 1, zo: -2, pr: -2, ab: 0, c3: -1, zb: 1 },
  pa: { rb: 2, ba: 0, ma: -1, zo: 0, pr: -2, ab: -2, c3: 0, zb: 0 },
  qs: { rb: -1, ba: 0, ma: 1, zo: 1, pr: 2, ab: 0, c3: 0, zb: 0 },
  hm: { rb: 1, ba: 0, ma: 1, zo: -1, pr: -2, ab: 0, c3: -1, zb: 0 },
  te: { rb: 2, ba: 1, ma: -1, zo: 0, pr: 0, ab: 1, c3: 0, zb: 0 }
};
// A kick-block unit plays a normal snap like an all-out blitz; a punt return unit is badly outnumbered
Object.keys(M).forEach(k => { M[k].blk = M[k].ab; M[k].ret = (k === "dp" || k === "pa") ? 1 : 2; });
const SACK = {
  rb: { sc: .01, sp: .01, dp: .02, pa: .02, hm: .02, ms: .01 },
  ab: { sc: .01, sp: .03, dp: .10, pa: .10, te: .01, hm: .08, ms: .03 },
  zb: { sp: .015, dp: .05, pa: .05, te: .01, hm: .04, ms: .015 },
  pr: { sc: -.01, sp: -.02, dp: -.03, pa: -.03, hm: -.03, ms: -.02 },
  blk: { sc: .01, sp: .03, dp: .10, pa: .10, te: .01, hm: .08, ms: .03 },
  ret: { sc: -.01, sp: -.02, dp: -.03, pa: -.03, hm: -.03, ms: -.02 }
};
// Interception multipliers: the dropping lineman in a zone blitz sits right in the short throwing lanes
const INT_MUL = {
  zb: { sc: 2.5, sp: 2, ms: 1.8, te: 1.5 }
};
/* ---------- Personnel ---------- */
const OFF_PKG_IDS = ["p10", "p11", "p12", "p21", "p13", "jumbo"];
const DEF_PKG_IDS = ["base", "nickel", "dime", "goal"];
const OFF_PKGS = {
  p10: { name: "10 Personnel", short: "10", who: "1 RB · 4 WR", desc: "Four wide. Spreads the defense out to pass.", sack: .02 },
  p11: { name: "11 Personnel", short: "11", who: "1 RB · 1 TE · 3 WR", desc: "The standard. Balanced.", sack: 0 },
  p12: { name: "12 Personnel", short: "12", who: "1 RB · 2 TE · 2 WR", desc: "Two tight ends. Run threat, good for play-action.", sack: -.01 },
  p21: { name: "21 Personnel", short: "21", who: "2 RB · 1 TE · 2 WR", desc: "A fullback leads the way. Downhill runs.", sack: -.005 },
  p13: { name: "13 Personnel", short: "13", who: "1 RB · 3 TE · 1 WR", desc: "Heavy. Power runs, few targets.", sack: -.015, comp: { dp: .65, sp: .9 } },
  jumbo: { name: "Jumbo", short: "Jumbo", who: "6 OL · 1 RB · 3 TE", desc: "Extra lineman for short yardage. The tackle can report eligible.", sack: -.02, comp: { dp: .3, sp: .75, sc: .8, pa: .85 } }
};
// Special teams units: sending one out is visible to the defense, and the kick (or a fake) is only possible from one
const ST_PKGS = {
  punt: { name: "Punt Team", short: "Punt team", who: "Punter · long snapper · gunners", desc: "Kick it away, or run the fake punt.", plays: ["punt", "fp"] },
  fgu: { name: "Field Goal Unit", short: "FG unit", who: "Kicker · holder · long snapper", desc: "Kick it, or run the fake field goal.", plays: ["fg", "ffg"] }
};
const isST = pk => !!ST_PKGS[pk];
const pkgInfo = pk => OFF_PKGS[pk] || ST_PKGS[pk];
const stPkgIds = () => (puntAvailable() ? ["punt"] : []).concat(fgAvailable() ? ["fgu"] : []);
const stPkgFor = id => id === "punt" || id === "fp" ? "punt" : id === "fg" || id === "ffg" ? "fgu" : null;
const DEF_PKGS = {
  base: { name: "Base 4-3", short: "Base", who: "4 DL · 3 LB · 4 DB", desc: "Built for balance and stopping the run." },
  nickel: { name: "Nickel", short: "Nickel", who: "4 DL · 2 LB · 5 DB", desc: "Extra corner for three-receiver sets." },
  dime: { name: "Dime", short: "Dime", who: "4 DL · 1 LB · 6 DB", desc: "Pass defense first. Light against the run." },
  goal: { name: "Goal Line", short: "Goal Line", who: "6 DL · 3 LB · 2 DB", desc: "Everyone in the box. Stuffs runs, thin in coverage." }
};
// How well each play suits the offensive package (added to the matchup edge)
const PKG_FIT = {
  p10: { ir: -1, or: -.5, sc: .5, sp: .5, dp: .5, pa: -1, qs: -.5, hm: .5, dr: .5, ms: .5 },
  p11: {},
  p12: { ir: .5, or: .5, sp: -.5, dp: -.5, pa: .5, qs: .5, hm: -.5, ms: -.5 },
  p21: { ir: .5, sc: -.5, sp: -.5, dp: -.5, pa: .5, qs: .5, hm: -.5, ms: -.5 },
  p13: { ir: .5, or: 0, sc: -.5, sp: -1, dp: -1.5, pa: .5, qs: .5, hm: -1.5, dr: -.5, ms: -1 },
  jumbo: { ir: 1, or: -.5, sc: -1.5, sp: -1.5, dp: -2, pa: 0, te: 0, qs: 1, hm: -2, dr: -1, ms: -1.5 }
};
// Offensive package against defensive package: edge for runs and for passes
const CLASH = {
  p10: { base: { run: .5, pass: 1 }, nickel: { run: 0, pass: 0 }, dime: { run: .5, pass: -.5 }, goal: { run: 1.5, pass: 2 } },
  p11: { base: { run: 0, pass: .5 }, nickel: { run: 0, pass: 0 }, dime: { run: .5, pass: -.5 }, goal: { run: 1, pass: 1.5 } },
  p12: { base: { run: 0, pass: 0 }, nickel: { run: 1, pass: 0 }, dime: { run: 1.5, pass: -.5 }, goal: { run: -.5, pass: 1 } },
  p21: { base: { run: 0, pass: 0 }, nickel: { run: 1, pass: 0 }, dime: { run: 1.5, pass: 0 }, goal: { run: -.5, pass: 1 } },
  p13: { base: { run: 0, pass: 0 }, nickel: { run: 1.5, pass: 0 }, dime: { run: 2, pass: 0 }, goal: { run: -1, pass: 1 } },
  jumbo: { base: { run: 0, pass: 0 }, nickel: { run: 1.5, pass: 0 }, dime: { run: 2, pass: .5 }, goal: { run: -1, pass: .5 } }
};
function pkgEdge(off, opk, dpk) {
  const fit = (PKG_FIT[opk] || {})[off] || 0, cl = ((CLASH[opk] || {})[dpk]) || { run: 0, pass: 0 };
  return fit + (OFFP[off].kind === "run" ? cl.run : cl.pass);
}
/* ---------- Team identities ---------- */
// Each team has an offensive and a defensive style. A style nudges the matchup edge (the same scale
// as the play-call table, where 1 is a clearly better call), so it tilts snaps without deciding them.
// Balanced has a small edge everywhere; the others trade weak spots for bigger strengths.
const OFF_STYLE_IDS = ["bal", "air", "gnp", "wc"];
const DEF_STYLE_IDS = ["bal", "blz", "nfz", "rs"];
const OFF_STYLES = {
  bal: { name: "Balanced", short: "Balanced", desc: "No weak spots. A small edge on every play.", all: .1 },
  air: { name: "Air Raid", short: "Air Raid", desc: "Spread it out and throw. Quick Game, Mesh and Deep Shot are strengths. The run game is thin.", plays: { sp: .5, ms: .5, dp: .5, hm: .3, ir: -.6, or: -.5, qs: -.4 } },
  gnp: { name: "Ground & Pound", short: "Ground & Pound", desc: "Run the ball and set up play-action. Quick throws and the deep ball are weaker.", plays: { ir: .4, or: .4, dr: .3, qs: .4, pa: .4, sc: -.3, sp: -.5, ms: -.5, dp: -.6, hm: -.3 } },
  wc: { name: "West Coast", short: "West Coast", desc: "Short, timed throws. Screens, Quick Game and Mesh are strengths. The deep ball is not.", plays: { sc: .8, sp: .8, ms: .8, dp: -.4 } }
};
// Defensive styles: an edge for the defense on some calls (calls) or against some kinds of plays (run, pass, deep)
const DEF_STYLES = {
  bal: { name: "Balanced", short: "Balanced", desc: "No weak spots. A small edge on every snap.", all: .1 },
  blz: { name: "Blitz-Happy", short: "Blitz-Happy", desc: "Bring pressure. Run Blitz, All-Out Blitz and Zone Blitz hit harder. The zone coverages are softer.", calls: { ab: .7, zb: .7, rb: .5, zo: -.2, c3: -.2, pr: -.3 } },
  nfz: { name: "No-Fly Zone", short: "No-Fly Zone", desc: "Lockdown secondary. Tougher against every pass, softer against the run.", pass: .6, run: -.45 },
  rs: { name: "Run Stuffers", short: "Run Stuffers", desc: "A wall up front. Tougher against every run, but deep passes can get over the top.", run: .9, deep: -.4 }
};
const RANDOM_STYLE = "rnd";
// Offensive and defensive style edges, on the play-call scale
const offStyleOf = t => (S && S.teams && S.teams[t] && OFF_STYLES[S.teams[t].off]) ? S.teams[t].off : "bal";
const defStyleOf = t => (S && S.teams && S.teams[t] && DEF_STYLES[S.teams[t].def]) ? S.teams[t].def : "bal";
function offStyleEdge(off, s) { const st = OFF_STYLES[s] || OFF_STYLES.bal; return (st.all || 0) + ((st.plays || {})[off] || 0); }
// Defensive style edge (in the defense's favor) for a call against a play
function defStyleEdge(off, def, s) {
  const st = DEF_STYLES[s] || DEF_STYLES.bal, P = OFFP[off];
  if (!P) return 0;
  return (st.all || 0) + ((st.calls || {})[def] || 0) + (P.kind === "run" ? st.run || 0 : st.pass || 0) + (P.deep ? st.deep || 0 : 0);
}
// Net edge for the offense team o: its offensive style minus the other team's defensive style
const styleParts = (off, def, o) => ({ off: offStyleEdge(off, offStyleOf(o)), def: defStyleEdge(off, def, defStyleOf(1 - o)) });
const styleEdge = (off, def, o) => { const p = styleParts(off, def, o); return p.off - p.def; };
const resolveStyle = (v, ids) => v === RANDOM_STYLE ? ids[Math.floor(rand() * ids.length)] : ids.includes(v) ? v : "bal";
function styleTag(isOff, id, t) {
  if (isOff) { const st = OFF_STYLES[offStyleOf(t)], v = (st.plays || {})[id] || 0; return v >= .4 ? " · style strength" : v <= -.4 ? " · style weakness" : ""; }
  const v = ((DEF_STYLES[defStyleOf(t)].calls) || {})[id] || 0;
  return v >= .4 ? " · style strength" : v <= -.3 ? " · style weakness" : "";
}
const identityText = t => `${OFF_STYLES[offStyleOf(t)].name} offense, ${DEF_STYLES[defStyleOf(t)].name} defense`;

/* ---------- Coaching ---------- */
// Each team's coach takes the place of Gridiron Duel's difficulty setting: coach.js turns the
// coach's ratings into the same numbers, per team (CP), for the computer's play calling and for the
// execution edge every coach gets from their Offense and Defense ratings.
const CP = t => S.teams[t].cp;
// Home field: the home team (team 0) plays a little sharper on both sides of the ball, except at a
// neutral site
const HOME_EDGE = .06;
const homeEdge = o => S && S.teams && !S.neutral ? (o === 0 ? HOME_EDGE : -HOME_EDGE) : 0;
// Motivation: late in a close game or a comeback (the fourth quarter and overtime, behind by any score
// or ahead by 8 or less), a team plays to its coach's Motivation: about +0.03 at a 50, +0.11 at a 70,
// and a little worse than usual under a coach below 42
const MOT_K = .004;
function motEdge(t) {
  if (!S || !S.teams || S.quarter < 4 || S.teams[t].score - S.teams[1 - t].score > 8) return 0;
  return (((S.teams[t].coach && S.teams[t].coach.mot) || 42) - 42) * MOT_K;
}
const execEdge = o => S && S.teams ? CP(o).execO - CP(1 - o).execD + homeEdge(o) + motEdge(o) - motEdge(1 - o) : 0;
// A coach's specialty: a former lineman's teams run the ball, and stop it, a little better
const SPEC_RUN = .05;
const specEdge = (o, off) => OFFP[off] && OFFP[off].kind === "run" ? ((S.teams[o].coach || {}).spec === "run" ? SPEC_RUN : 0) - ((S.teams[1 - o].coach || {}).spec === "run" ? SPEC_RUN : 0) : 0;
// Special teams: how far a coach's Special teams rating is from a typical small-school coach's
const stOf = t => (((S.teams[t].coach && S.teams[t].coach.st) || 42) - 42);
// Sharpen or flatten a set of play-call weights, by the coach making the call
function sharpen(w, t, isOff) { const k = isOff ? CP(t).sharpO : CP(t).sharpD; if (k !== 1) Object.keys(w).forEach(id => { w[id] = Math.pow(Math.max(0, w[id]), k); }); return w; }

/* ---------- Playbook mastery ---------- */
// How well a team knows each play, 0 to 100 (practice.js installs plays). A play a team knows better
// than a typical small school knows its own (70) is a small edge, on the play-call scale; one it's still
// learning costs edge and draws more flags and fumbles. A team without a playbook record (the pros, for
// now) plays every call at 70, and so do kicks and kneel-downs.
const MASTERY_BASE = 70;
const masteryOf = (t, id) => { const m = S && S.teams && S.teams[t] && S.teams[t].mastery; return m && m[id] != null ? m[id] : MASTERY_BASE; };
const masteryEdge = v => (v - MASTERY_BASE) * (v >= MASTERY_BASE ? .006 : .009);
// Flags and fumbles: more than usual (above 1) on a play still being learned, fewer on one mastered.
// Measured from 60, about what the average call is worth once the plays a team doesn't know well are
// mixed in with its core plays, so flag and fumble totals stay where the engine was tuned.
const masteryMul = (v, k) => clamp(1 - k * (v - 60), .75, 1.5);
// The computer calls the plays its team knows: weight from 0.3 (brand new) to 1 (mastered)
const masteryPref = v => .3 + .7 * Math.pow(clamp(v, 0, 100) / 100, 1.4);
const MASTERY_WORDS = [[85, "mastered"], [65, "solid"], [40, "learning"], [0, "new"]];
const masteryWord = v => MASTERY_WORDS.find(([at]) => v >= at)[1];

/* ---------- Helpers ---------- */
let S = null;
// The rules of the level being played (rules.js)
const R = () => RULES[(S && S.cfg && S.cfg.level) || "hs"];
const tname = t => S.teams[t].name;
const abbr = t => S.teams[t].abbr;
function spotText(team, spot) {
  if (spot === 50) return "50";
  return spot < 50 ? `${abbr(team)} ${spot}` : `${abbr(1 - team)} ${100 - spot}`;
}
function downText() {
  return `${ord(S.down)} & ${S.spot + S.toGo >= 100 ? "Goal" : S.toGo}`;
}
const fx = (team, spot) => team === 0 ? spot : 100 - spot;
const bothHuman = () => !S.teams[0].cpu && !S.teams[1].cpu;
// One coach on one device: Gridiron Duel's pass-the-phone screens never show
const passPhone = () => false;
// High school overtime has no clock: each team gets a series from the 10
const hsOT = () => !!(S && S.ot && S.ot.kind === "hs" && S.quarter >= 5);
const noClock = () => S.quarter >= 5 && R().ot.kind === "hs";
const nflOT = () => R().ot.kind === "nfl";
const kickDist = () => 100 - S.spot + R().fgAdd;
// Field goals: on 4th down, on any down in the last 40 seconds of a half, in pro overtime on any down
// once a field goal would win the game, and on any down at all in high school overtime. A coach can
// try one up to a few yards past the kicker's range.
const endHalfKick = () => (S.quarter === 2 || S.quarter >= 4) && S.clock <= 40 && !noClock();
const fgAvailable = () => !S.twoPt && kickDist() <= fgMaxTry(S.poss) && (S.down === 4 || endHalfKick() || otFgWins() || hsOT());
const puntAvailable = () => !S.twoPt && S.down === 4 && !hsOT();

/* ---------- Game flow ---------- */
const newTeamStats = () => ({ plays: 0, yds: 0, rush: 0, pass: 0, fd: 0, to: 0, pen: 0, penYds: 0, d3: 0, d3c: 0 });
// A school in a game: its coach, roster and depth chart, plus the game's own score and stats.
// styles: { off, def } to change the scheme for this game only.
function gameTeam(s, cpu, styles) {
  styles = styles || {};
  return { id: s.id, name: s.mascot, school: s.town, abbr: s.abbr, color: s.color, level: s.level, cpu: !!cpu,
    off: resolveStyle(styles.off || s.off, OFF_STYLE_IDS), def: resolveStyle(styles.def || s.def, DEF_STYLE_IDS),
    coach: clone(s.coach), cp: coachParams(s.coach), players: clone(s.players), depth: clone(s.depth), dver: 0,
    mastery: s.mastery ? clone(s.mastery) : null, score: 0, st: newTeamStats() };
}
// cfg: { level, cpu: [home, away], styles: [home, away], rot: [home, away], depth: [home, away], aud,
// title, neutral, fresh: [home, away] }. schools[0] is the home team. depth: a depth chart for this
// game only (or null). fresh: energy at kickoff (100 unless practice wore a team down).
// title: a state championship game (no running clock). neutral: played at a neutral site.
function initGame(cfg, schools) {
  const Rl = RULES[cfg.level] || RULES.hs, qLen = cfg.qLen || Rl.qLen;
  const t0 = gameTeam(schools[0], cfg.cpu[0], cfg.styles && cfg.styles[0]), t1 = gameTeam(schools[1], cfg.cpu[1], cfg.styles && cfg.styles[1]);
  if (t1.abbr === t0.abbr) t1.abbr = schoolAbbr(t1.school, t0.abbr);
  [t0, t1].forEach((t, i) => {
    if (cfg.depth && cfg.depth[i]) t.depth = clone(cfg.depth[i]);
    freshGame(t, cfg.rot && cfg.rot[i], cfg.fresh && cfg.fresh[i]);
  });
  const recv = rand() < .5 ? 0 : 1;
  S = { v: 1, cfg: { level: Rl.id, qLen, aud: cfg.aud !== false, title: !!cfg.title }, neutral: !!cfg.neutral, teams: [t0, t1], ps: {},
    quarter: 1, clock: qLen, poss: recv, spot: 35, down: 1, toGo: 10, firstRecv: recv,
    offCall: null, defCall: null, sel: null, side: "off", phase: "", banner: "", log: [], last: null,
    needPAT: false, patTeam: 0, periodOver: false, gameOver: false, runClock: false,
    tos: [Rl.timeouts, Rl.timeouts], clockRunning: false, oobRestart: false, spikeNext: false, toNote: "" };
  startToss(false, matchupLine());
  tossNext();
}
const matchupLine = () => `${S.teams[1].school} ${tname(1)} at ${S.teams[0].school} ${tname(0)}.`;
function startDrive(team, spot) { if (team !== S.poss) { otTurn(team); restAll("change"); } S.poss = team; S.spot = clamp(spot, 1, 99); S.down = 1; S.toGo = Math.min(10, 100 - S.spot); }
// kickTD: the last kickoff was returned for a touchdown. kickEnded: the kickoff after a score ended
// the game (a return touchdown in pro overtime), so that score's result keeps the kickoff in its text.
let kickTD = false, kickEnded = false;
// Onside kicks: in high school they don't have to be announced, so a coach can try one on any
// kickoff after their own score, and a surprise works far more often than one the other team is
// waiting for. Trailing in the last two minutes, a coach is asked outright (onsideOK); the computer
// only tries them then.
function onsideOK(k) {
  return S.quarter === 4 && S.clock > 0 && S.clock < 120 && !S.periodOver && !S.gameOver && S.teams[k].score < S.teams[1 - k].score;
}
function cpuWantsOnside(k) {
  const down = S.teams[1 - k].score - S.teams[k].score;
  return down >= 9 || S.clock <= 60 || S.tos[k] === 0;
}
// After a score: kick off right away, or let a human coach choose the kick first
function kickAfterScore(k) {
  kickEnded = false;
  // High school overtime has no kickoffs: the score ends the series
  if (hsOT()) { hsotEnd(); return ""; }
  // In pro overtime the scoring team's possession is over before the kick; that can decide the game
  if (!S.gameOver) otTurn(1 - k);
  if (S.gameOver) return "";
  // A score as time runs out in Q2, Q4 or 2OT, 4OT...: no kickoff, since the next period starts with one
  if (S.periodOver && kickoffNext()) return "";
  if (onsideOK(k)) {
    if (!S.teams[k].cpu) { S.kickChoice = { team: k }; return `${tname(k)} kick off next. Trailing late, they can kick deep or try an onside kick.`; }
    if (cpuWantsOnside(k)) return onsideKick(k).text;
  }
  // A human coach's kickoff waits for the next tap, so they can call an onside kick on the result screen
  if (!S.teams[k].cpu) { S.kickChoice = { team: k, later: true, onside: false }; return `${tname(k)} kick off next.`; }
  const text = kickoff(1 - k, true);
  kickEnded = kickTD && S.gameOver;
  return text;
}
// The kickoff a coach held for the next tap: onside if they called it, otherwise deep. A plain kickoff
// goes straight on to the next snap, with the return in the banner. An onside kick or a return
// touchdown gets its own result. Returns true when it showed a result.
function laterKick() {
  const c = S.kickChoice;
  if (c.onside) { doKickChoice("onside"); return true; }
  S.kickChoice = null;
  const text = kickoff(1 - c.team, true);
  if (kickTD) { kickResult(c.team, "deep", text); return true; }
  const r = {}; finishClock(r, true);
  S.banner = text + (r.tmw ? " Two-minute warning. The clock is stopped." : "");
  return false;
}
function doKickChoice(kind) {
  const c = S.kickChoice; if (!c) return;
  S.kickChoice = null;
  const k = c.team;
  if (kind === "onside") {
    const behind = S.teams[k].score < S.teams[1 - k].score, o = onsideKick(k);
    kickResult(k, "onside", o.text, o.ok, behind);
  } else kickResult(k, "deep", kickoff(1 - k, true));
}
// The result screen for a kickoff that gets one: an onside kick, or a kickoff returned for a touchdown
function kickResult(k, kind, text, ok, behind) {
  const td = kind !== "onside" && kickTD;
  const r = kind === "onside"
    ? { offId: "onside", team: k, head: ok ? "Recovered!" : "Onside fails", tone: ok ? "good" : "bad", s: ok ? 2 : -1, text,
        read: { c: ok ? "o" : "d", t: ok ? `${tname(k)} keep the ball. ${behind ? "The comeback is alive." : "The surprise worked."}` : `${tname(1 - k)} hold on. Great field position for them.` } }
    : { offId: "kickoff", team: k, head: td ? "Return TD" : "Kickoff", tone: td ? "bad" : "", text };
  r.fromX = fx(k, R().kickoff.spot); r.toX = td ? fx(1 - k, 100) : fx(S.poss, S.spot);
  r.sub = S.gameOver && S.quarter >= 5 ? `${tname(S.teams[0].score > S.teams[1].score ? 0 : 1)} win it in overtime!`
    : td ? "" : `${tname(S.poss)} ball. ${downText()} at the ${spotText(S.poss, S.spot)}.`;
  r.id = S.playId = (S.playId || 0) + 1;
  finishClock(r, true);
  S.last = r; S.phase = "result"; S.banner = "";
  S.log.unshift({ q: S.quarter, clock: S.clock, team: k, sit: "Kickoff", off: kind === "onside" ? "Onside kick" : "Kickoff", def: "", text: r.text + (r.sub ? " " + r.sub : ""), score: `${S.teams[0].score}-${S.teams[1].score}` });
}

/* ---------- Game clock ---------- */
// Play time comes off when the play runs; the time to line up for the next snap comes off when
// "Next play" is tapped, unless the clock is stopped. How the clock stops and starts follows the
// level's rules (rules.js).
const hasTwoMinute = () => R().twoMinWarning && (S.quarter === 2 || S.quarter >= 4);
function tick(sec) {
  if (noClock()) return;
  const before = S.clock;
  S.clock -= sec;
  if (hasTwoMinute() && before > 120 && S.clock <= 120 && S.clock > 0) S.tmwHit = true;
  if (S.clock <= 0) { S.clock = 0; S.periodOver = true; }
}
function runoff(sec) {
  if (noClock()) return "ok";
  const before = S.clock, after = before - sec;
  if (hasTwoMinute() && before > 120 && after <= 120) { S.clock = 120; S.clockRunning = false; S.tmwJust = true; S.banner = "Two-minute warning. The clock is stopped."; return "tmw"; }
  if (after <= 0) { S.clock = 0; S.periodOver = true; return "end"; }
  S.clock = after; return "ok";
}
// When going out of bounds stops the clock until the snap: all game long in high school; in the
// pros only inside 2:00 of the first half or 5:00 of the second half
const oobWindow = () => R().oob === "always" ? !noClock() : (S.quarter === 2 && S.clock <= 120) || (S.quarter >= 4 && S.clock <= 300);
// Whether the next period starts with a kickoff instead of carrying the drive over: after Q2
// (halftime), after Q4 (overtime), and after 2OT, 4OT, 6OT... in pro overtime (see startOT)
const kickoffNext = () => S.quarter <= 4 ? S.quarter % 2 === 0 : (S.quarter - 4) % 2 === 0;
// Spikes and sideline routes are only on the menu in the last two minutes of a period that's
// followed by a kickoff (Q2, Q4, and 2OT, 4OT... in the pros), for every team
const clockWindow = () => S.clock > 0 && S.clock <= 120 && kickoffNext() && !noClock();
const spikeOK = () => !!S.clockRunning && S.down <= 3 && clockWindow();
// The last two minutes of either half
const lateHalf = () => (S.quarter === 2 || S.quarter === 4) && S.clock <= 120;
// Late in a half, the team that was fouled chooses whether the clock waits for the snap. A team
// that's behind, or tied with the ball, wants it stopped.
function wantsClockStopped(t) { const d = S.teams[t].score - S.teams[1 - t].score; return d < 0 || (d === 0 && t === S.poss); }
// High school running clock: a lead of 35 or more in the second half keeps the clock running for the
// rest of regulation, even if the lead shrinks. Not used in a state championship game.
function checkRunClock(r) {
  const rc = R().runClock;
  if (!rc || S.runClock || S.cfg.title || S.quarter < 3 || S.quarter > 4) return;
  if (Math.abs(S.teams[0].score - S.teams[1].score) >= rc.margin) { S.runClock = true; if (r) r.runNote = true; }
}
// How the clock stands after a play. stopped: the play itself stopped it (an incompletion, a score,
// a change of possession, a kick). r.oob: out of bounds. r.fd: a first down. r.penClock: an
// accepted penalty, or a foul before the snap, by team r.penBy (r.penStop: the play would have
// stopped the clock anyway).
// S.clockRunning with S.oobRestart means the clock starts again when the ball is ready for play:
// less time comes off before the next snap (S.readyWhy says why).
function finishClock(r, stopped) {
  S.oobRestart = false; S.toNote = ""; S.readyWhy = "";
  if (noClock()) { S.clockRunning = false; return; }
  checkRunClock(r);
  if (S.runClock) {
    // Only scores (until the next kick or snap) and timeouts stop a running clock
    S.clockRunning = !S.periodOver && !S.needPAT && !S.tryChoice && !S.retryTwo && !S.kickChoice && !S.twoPt;
    return;
  }
  const Rl = R();
  if (!stopped && r.oob) { if (oobWindow()) stopped = true; else { S.oobRestart = true; S.readyWhy = "oob"; } }
  if (!stopped && r.penClock) {
    if (r.penStop) stopped = true;
    else if (Rl.penClock === "ready") {
      if (lateHalf() && r.penBy != null && wantsClockStopped(1 - r.penBy)) { stopped = true; r.penSnap = true; }
      else { S.oobRestart = true; S.readyWhy = "pen"; }
    } else if (oobWindow()) stopped = true;
    else { S.oobRestart = true; S.readyWhy = "pen"; }
  }
  if (!stopped && r.fd && !S.oobRestart && (Rl.fdStop === "always" || (Rl.fdStop === "late" && lateHalf()))) { S.oobRestart = true; S.readyWhy = "fd"; }
  if (S.tmwHit) { S.tmwHit = false; stopped = true; r.tmw = true; S.tmwJust = true; }
  S.clockRunning = !stopped && !S.periodOver;
}

/* ---------- Overtime ---------- */
// ---- High school (NFHS) ----
// No clock. Each team gets a series starting first and goal at the 10. The defense can't score:
// a turnover ends the series where it happens. After both series the team ahead wins; tied, there's
// another period, and the first choice goes to the other team. One timeout per team each period,
// and nobody has to go for two.
//   S.ot = { kind: "hs", n: period, ser: 1 or 2, first: team with the first series, toss: toss winner }
function hsotStart(lead) {
  S.quarter = 5; S.clock = 0; S.runClock = false; S.ot = null;
  restAll("quarter");
  S.tos = [R().ot.tos, R().ot.tos];
  startToss(true, `${lead} Each team gets a series from the 10. There's no clock, and the defense can't score.`);
}
function hsotSeries(t, lead) {
  S.poss = t; S.spot = R().ot.spot; S.down = 1; S.toGo = Math.min(10, 100 - S.spot);
  S.clockRunning = false; S.oobRestart = false;
  S.banner = `${lead ? lead + " " : ""}${tname(t)} ball, first and goal at the 10.`;
}
// The series is over: a score (after its try), a field goal try, a turnover, or a stop on downs
function hsotEnd() {
  if (S.gameOver) return;
  if (S.ot.ser === 2 && S.teams[0].score !== S.teams[1].score) S.gameOver = true;
  else S.otEnd = true;
}
// What comes next, for the result screen
function hsotNote() {
  const o = S.ot, a = o.first, b = 1 - a;
  if (o.ser === 1) {
    const lead = S.teams[a].score - S.teams[b].score;
    return lead > 0 ? `${tname(b)} get their series next, down ${lead}.` : `${tname(b)} get their series next. Any score wins it.`;
  }
  return "Still tied after both series. On to another overtime period.";
}
// After the result screen: the second series, or a new period
function hsotNext() {
  const o = S.ot; S.otEnd = false;
  if (o.ser === 1) { o.ser = 2; hsotSeries(1 - o.first, ""); return; }
  o.n++; o.ser = 1; S.quarter++; S.tos = [R().ot.tos, R().ot.tos];
  // The toss winner has the first choice in odd periods, the other team in even ones
  const chooser = o.n % 2 ? o.toss : 1 - o.toss;
  S.toss = { ot: true, hs: true, noFlip: true, step: "choose", winner: chooser, lead: `Still tied. Overtime period ${o.n}: ${tname(chooser)} have the first choice.` };
}
// ---- Pros (NFL playoffs), from Gridiron Duel ----
// S.ot = { a: team that received the OT kickoff, ph: phase }
//   ph 1: team a has its guaranteed possession
//   ph 2: the other team has its guaranteed possession
//   ph 3: both teams have had the ball, sudden death
// A score by the team without the ball (safety, pick-six, return TD) ends it at any time.
// S.ot.r: team that received the kickoff after the most recent OT coin toss.
// OT periods run in blocks of four, like halves of two periods each:
//   OT1 (and OT5, OT9...): coin toss, then kickoff
//   OT2, OT4...: play carries straight over from the previous period (same ball, down, spot)
//   OT3 (and OT7...): the team that received after the last toss kicks off
// A lead at the end of an OT period wins, except during the second team's guaranteed possession
// (ph 2): then play goes on into the next period, as in the NFL playoffs. Once sudden death starts
// it lasts the rest of the game, even through a later coin toss.
function otState() {
  if (!nflOT()) return null;
  if (!S.ot && S.quarter >= 5) S.ot = { a: S.poss, ph: 3 };
  return S.ot;
}
function score(team, pts) {
  S.teams[team].score += pts;
  if (S.gameOver) return;
  // High school overtime: the team with the second series wins the moment it goes ahead
  if (hsOT()) { if (S.ot.ser === 2 && team !== S.ot.first && S.teams[team].score > S.teams[1 - team].score) S.gameOver = true; return; }
  const o = otState(); if (!o) return;
  const ahead = S.teams[team].score > S.teams[1 - team].score;
  if (o.ph === 3 || (o.ph === 1 && team !== o.a) || (o.ph === 2 && (team === o.a || ahead))) S.gameOver = true;
}
// Pro overtime walk-off: the other team has already had its possession and 3 points would win it
// (sudden death, or the answering possession when tied or down by 1 or 2)
function otFgWins() {
  if (!S.teams || S.quarter < 5 || S.gameOver || S.twoPt || !nflOT()) return false;
  const o = S.ot || { a: S.poss, ph: 3 }, p = S.poss;
  const lead = S.teams[p].score - S.teams[1 - p].score;
  return (o.ph === 3 || (o.ph === 2 && p !== o.a)) && lead + 3 > 0;
}
// The ball is going to team np: closes out a guaranteed possession
function otTurn(np) {
  const o = otState(); if (!o || S.gameOver) return;
  if (o.ph === 1 && np !== o.a) o.ph = 2;
  else if (o.ph === 2 && np === o.a) {
    if (S.teams[0].score !== S.teams[1].score) S.gameOver = true;
    else o.ph = 3;
  }
}
function otNote() {
  const o = S.ot, b = 1 - o.a, down = S.teams[o.a].score - S.teams[b].score;
  if (o.ph === 2) return down > 0 ? `${tname(b)} get their overtime possession, down ${down}.` : `${tname(b)} get their overtime possession. Any score wins it.`;
  return "Both teams have had the ball. Sudden death: the next score wins.";
}
// Overtime wrap-up for a play's result: the winner, or what comes next
function otTail(r) {
  if (hsOT()) {
    if (S.gameOver) r.sub = `${tname(S.teams[0].score > S.teams[1].score ? 0 : 1)} win it in overtime!`;
    else if (S.otEnd) r.sub = (r.sub ? r.sub + " " : "") + hsotNote();
    return;
  }
  if (!S.ot || S.quarter < 5) return;
  if (S.gameOver) {
    const win = `${tname(S.teams[0].score > S.teams[1].score ? 0 : 1)} win it in overtime!`;
    // Keep a kickoff return that decided it, so the result says what happened
    r.sub = r.kickEnd && r.sub ? `${r.sub} ${win}` : win;
    return;
  }
  const was = S.snap && S.snap.ot;
  if (was && was.ph !== S.ot.ph) r.sub = (r.sub ? r.sub + " " : "") + otNote();
}
const otLen = () => R().qLen;
function startOT(lead) {
  if (!nflOT()) { hsotStart(lead); return; }
  S.quarter++; S.clock = otLen();
  const n = S.quarter - 4, step = (n - 1) % 4;
  if (step % 2 === 0) S.tos = [3, 3]; // 3 timeouts per two-period OT block (1OT-2OT, 3OT-4OT...)
  const o = n > 1 ? otState() : null;
  if (!o) { startToss(true, `${lead} Both teams get the ball unless the defense scores, then it's sudden death.`); return; }
  if (step === 0) { startToss(true, `${lead} New coin toss.${o.ph === 3 ? " Still sudden death: the next score wins." : ""}`); return; }
  if (step === 2) {
    const k = o.r !== undefined ? o.r : o.a, rcv = 1 - k;
    otTurn(rcv);
    S.banner = `${lead} ${tname(k)} received ${n === 3 ? "to start overtime" : `after the ${qLabel(S.quarter - 2)} coin toss`}, so they kick off now. ${kickoff(rcv, false)}`;
    return;
  }
  S.banner = `${lead} Play continues: ${tname(S.poss)} keep the ball, ${downText()} at the ${spotText(S.poss, S.spot)}.`;
}
const qLabel = q => q === 5 ? "OT" : q > 5 ? `${q - 4}OT` : "Q" + q;

/* ---------- Coin toss ---------- */
// The visitors (team 1) call it; the winner chooses to receive or defer. In pro overtime: receive or
// kick. In high school overtime: offense or defense first (most coaches take defense, so they know
// what they need).
const VISITOR = 1;
function startToss(ot, lead) { S.toss = { ot, hs: ot && R().ot.kind === "hs", lead, step: "call" }; S.phase = "toss"; S.banner = ""; }
function tossCall(c) {
  const t = S.toss; if (!t || t.step !== "call") return;
  t.call = c === "tails" ? "tails" : "heads";
  t.flip = rand() < .5 ? "heads" : "tails";
  t.winner = t.call === t.flip ? VISITOR : 1 - VISITOR;
  t.step = "choose";
}
function tossChoose(ch) {
  const t = S.toss; if (!t || t.step !== "choose") return;
  const w = t.winner;
  if (t.hs) {
    const first = ch === "offense" ? w : 1 - w, pick = ch === "offense" ? "go on offense first" : "play defense first";
    const said = t.noFlip ? `${tname(w)} choose to ${pick}.` : `${tname(VISITOR)} call ${t.call}. It's ${t.flip}, so ${tname(w)} win the toss and choose to ${pick}.`;
    S.toss = null;
    if (!S.ot) S.ot = { kind: "hs", n: 1, ser: 1, first, toss: w }; else S.ot.first = first;
    hsotSeries(first, `${t.lead ? t.lead + " " : ""}${said}`);
    return;
  }
  const recv = ch === "receive" ? w : 1 - w;
  const did = ch === "receive" ? "elect to receive" : t.ot ? "elect to kick" : "defer to the second half";
  const said = `${tname(VISITOR)} call ${t.call}. It's ${t.flip}, so ${tname(w)} win the toss and ${did}.`;
  S.toss = null;
  if (t.ot) {
    if (S.ot) { S.ot.r = recv; otTurn(recv); } // a later OT toss: sudden death (or any open guarantee) carries on
    else S.ot = { kind: "nfl", a: recv, ph: 1, r: recv };
  } else S.firstRecv = recv;
  S.banner = `${t.lead ? t.lead + " " : ""}${said}${recv !== w ? ` ${tname(recv)} receive.` : ""} ${kickoff(recv, false)}`;
}
// Lets computer coaches make their toss decisions, then starts play once the toss is settled
function tossNext() {
  const t = S.toss;
  if (t && t.step === "call" && S.teams[VISITOR].cpu) tossCall(rand() < .5 ? "heads" : "tails");
  if (S.toss && S.toss.step === "choose" && S.teams[S.toss.winner].cpu) tossChoose(S.toss.hs ? "defense" : S.toss.ot ? "receive" : "defer");
  if (S.toss) S.phase = "toss"; else startPlay();
}

// Kneel-down: offense tied or leading, opponent out of timeouts, inside the last two minutes.
// The option opens on a 1st down and stays open for the rest of that series.
function kneelBase() {
  const o = S.poss;
  return S.quarter === 4 && S.clock <= 120 && S.teams[o].score >= S.teams[1 - o].score && S.tos && S.tos[1 - o] === 0;
}
const kneelAvailable = () => !!S.kneelSeries && kneelBase();
function startPlay() {
  if (S.down === 1) S.kneelSeries = !S.twoPt && kneelBase();
  // Tired starters sit and rested ones come back. The coach hears about his own team's changes
  // (both teams' when the computer coaches both).
  const notes = [rotate(0), rotate(1)], watching = S.teams[0].cpu && S.teams[1].cpu;
  S.subNote = [0, 1].filter(t => notes[t].length && (watching || !S.teams[t].cpu)).map(t => (watching ? `${tname(t)}: ` : "") + rotationNote(notes[t])).join(" ");
  S.scoutNote = null; S.toUsed = false;
  S.offCall = null; S.defCall = null; S.sel = null; S.offSide = false; S.selSide = false; S.locked = false; S.aud = null; S.look = null; S.audSel = null; S.disgOn = false; S.disgSel = null; S.disg = null;
  S.snap = { total: S.teams[0].score + S.teams[1].score, poss: S.poss, spot: S.spot, down: S.down, toGo: S.toGo, sit: S.twoPt ? "Two-point try" : `${downText()} at the ${spotText(S.poss, S.spot)}`, q: S.quarter, clock: S.clock, ot: S.ot ? { a: S.ot.a, ph: S.ot.ph } : null };
  S.offPkg = null; S.defPkg = null;
  // No huddle: both sides stay in the personnel that was on the field for the last snap
  S.nhLock = S.noHuddle && S.last && S.last.team === S.poss && OFF_PKGS[S.last.opk] && S.last.dpk ? { off: S.last.opk, def: S.last.dpk } : null;
  S.noHuddle = false;
  if (!S.teams[S.poss].cpu) { S.side = "off"; S.pkgSel = S.nhLock ? S.nhLock.off : pkgMem(S.poss).off; S.phase = passPhone() ? "handoff" : "call"; }
  else {
    S.offPkg = S.nhLock ? S.nhLock.off : cpuOffPkg(); S.offCall = cpuOff(); S.offSide = cpuSide(S.offCall);
    if (stPkgFor(S.offCall)) S.offPkg = stPkgFor(S.offCall); // a kick or a fake needs the special teams unit on the field
    defStep();
  }
}
// Packages each side may choose this snap. No huddle locks personnel, but a special teams unit can still
// run on, and when it does the defense is allowed to substitute too.
function pkgChoices(isOff) {
  if (isOff) return (S.nhLock ? [S.nhLock.off] : OFF_PKG_IDS).concat(S.twoPt ? [] : stPkgIds());
  return S.nhLock && !isST(S.offPkg) ? [S.nhLock.def] : DEF_PKG_IDS;
}
// Plays the offense can call from a package: the kick and its fake from a special teams unit, the playbook otherwise
const offCallsFor = pk => isST(pk) ? ST_PKGS[pk].plays.filter(id => id === "punt" || id === "fp" ? puntAvailable() : fgAvailable())
  : offIds(pk).concat(kneelAvailable() ? ["kneel"] : []);
// Defensive calls: block and return units only answer a special teams unit
const defCallsFor = () => DEF_IDS.concat(S.offPkg === "punt" ? ["blk", "ret"] : S.offPkg === "fgu" ? ["blk"] : []);
function defStep() {
  const locked = S.nhLock && !isST(S.offPkg);
  if (!S.teams[1 - S.poss].cpu) { S.side = "def"; S.sel = null; S.pkgSel = locked ? S.nhLock.def : pkgMem(1 - S.poss).def; S.phase = passPhone() ? "handoff" : "call"; }
  else { S.defPkg = locked ? S.nhLock.def : cpuDefPkg(); S.defCall = cpuDef(); afterDef(); }
}
/* ---------- Audibles ---------- */
const audiblesOn = () => !S.cfg || S.cfg.aud !== false;
// The sideline option is offered only in the last two minutes of a half (when getting out of bounds stops the clock)
const sidelineOK = () => !S.twoPt && clockWindow() && oobWindow();
// QB sneak: 1 yard or less to go. Hail Mary: end of a half, 30+ yards from the end zone.
const sneakOK = () => !S.twoPt && S.toGo <= 1;
const hailOK = () => !S.twoPt && (S.quarter === 2 || S.quarter >= 4) && S.clock <= 15 && S.spot <= 70 && !noClock();
const offIds = pk => OFF_IDS.concat(sneakOK() ? ["qs"] : [], hailOK() ? ["hm"] : [], pk === "jumbo" ? ["te"] : []);
const audIds = () => offIds(S.offPkg).filter(id => id !== S.offCall);
// The look the offense sees at the line. A human defense picked it when it locked in its call;
// a computer defense decides here.
function makeLook() {
  const d = S.defCall;
  if (!S.teams[1 - S.poss].cpu) return S.disg && S.disg !== d && LOOKS[S.disg] ? { d: S.disg, fake: true } : { d, fake: false };
  return cpuLook(d);
}
// Calls a defense may show instead of its real one (special teams units can't hide who ran on)
const disguiseOK = () => audiblesOn() && !isST(S.offPkg);
const lookIdsFor = d => DEF_IDS.filter(x => x !== d);
// Per-team counts: how often each defense has disguised, and how often each offense has audibled
function lookStat(map, t) { S[map] = S[map] || [{ n: 0, k: 0 }, { n: 0, k: 0 }]; return S[map][t]; }
// A computer defense disguises more against an offense that audibles a lot, and picks the fake look
// that baits the worst check: the play the offense would want against the look, judged against the real call
function cpuLook(d) {
  const cp = CP(1 - S.poss);
  if (!DEF_IDS.includes(d) || !cp.disg) return { d, fake: false };
  const st = lookStat("audStats", S.poss), audRate = (st.k + 1) / (st.n + 4);
  if (rand() >= cp.disg * (DISGUISE[d] ?? .25) * clamp(.8 + 1.6 * audRate, .8, 1.8)) return { d, fake: false };
  const cands = lookIdsFor(d);
  if (rand() < cp.wild) return { d: cands[ri(0, cands.length - 1)], fake: true };
  let best = null, bv = 9;
  cands.forEach(L => {
    let bp = null, be = -9;
    OFF_IDS.forEach(p => { const e = M[p][L] + rand() * .5; if (e > be) { be = e; bp = p; } });
    const v = M[bp][d] + rand() * .5;
    if (v < bv) { bv = v; best = L; }
  });
  return { d: best, fake: true };
}
const edgeVs = (off, def) => clamp(M[off][def] + pkgEdge(off, S.offPkg, S.defPkg) + styleEdge(off, def, S.poss), -3, 3);
// Both calls are in: the offense gets one look at the defense before the snap
function afterDef() {
  if (!audiblesOn() || !OFFP[S.offCall]) { resolve(); return; }
  S.look = makeLook();
  // A coach with a sharp eye (Scouting 60 and up) sometimes spots a disguise
  const sct = ((S.teams[S.poss].coach || {}).sct) || 0;
  if (S.look.fake && !S.teams[S.poss].cpu && sct >= 60 && rand() < (sct - 50) / 100) S.look.flag = true;
  if (S.teams[S.poss].cpu) { cpuAudible(); resolve(); return; }
  S.audSel = null;
  S.side = "aud"; S.phase = passPhone() ? "handoff" : "los";
}
function audible(to) {
  if (to && to !== S.offCall && OFFP[to]) { S.aud = { from: S.offCall, to }; S.offCall = to; S.offSide = S.offSide && sideOn(to); }
  resolve();
}
// The computer checks out of a play only when the look says it is walking into a bad matchup
function cpuAudible() {
  const cp = CP(S.poss);
  if (!cp.aud) return;
  const ld = S.look.d, cur = edgeVs(S.offCall, ld);
  if (cur > -1) return;
  let best = null, be = -9;
  audIds().forEach(id => { const e = edgeVs(id, ld) + masteryEdge(masteryOf(S.poss, id)) + (S.toGo >= 8 && OFFP[id].kind === "run" ? -1 : 0) + (S.toGo <= 2 && id === "dp" ? -1 : 0); if (e > be) { be = e; best = id; } });
  // Trust the look less against a defense that has been disguising a lot
  const ds = lookStat("disgStats", 1 - S.poss), fakeRate = (ds.k + 1) / (ds.n + 3);
  if (best && be - cur >= 2 && rand() < cp.aud * clamp((1 - fakeRate) / .67, .25, 1.3)) { S.aud = { from: S.offCall, to: best }; S.offCall = best; S.offSide = S.offSide && sideOn(best); }
}
// Each coordinator's last package is remembered as the default for their next call
function pkgMem(t) { S.pkgMem = S.pkgMem || {}; return (S.pkgMem[t] = S.pkgMem[t] || { off: "p11", def: "nickel" }); }
function lock() {
  if (!S.sel) return;
  const isOff = S.side === "off", pk = S.pkgSel || (isOff ? "p11" : "nickel");
  if (!pkgChoices(isOff).includes(pk) || !(isOff ? offCallsFor(pk) : defCallsFor()).includes(S.sel)) return;
  if (isOff) { S.offPkg = pk; if (!isST(pk)) pkgMem(S.poss).off = pk; }
  else { S.defPkg = pk; pkgMem(1 - S.poss).def = S.defPkg; }
  if (S.side === "off") { S.offCall = S.sel; S.offSide = !!S.selSide && sideOn(S.sel) && sidelineOK(); S.locked = true; if (S.sel === "kneel") { S.defCall = null; resolve(); } else defStep(); }
  else {
    S.defCall = S.sel;
    S.disg = null;
    if (S.disgOn && disguiseOK() && DEF_IDS.includes(S.sel)) {
      const c = lookIdsFor(S.sel);
      S.disg = c.includes(S.disgSel) ? S.disgSel : c[ri(0, c.length - 1)];
    }
    afterDef();
  }
}
function resolve() {
  let r;
  scoutRecord();
  if (S.look && OFFP[S.offCall]) {
    const a = lookStat("audStats", S.poss), g = lookStat("disgStats", 1 - S.poss);
    a.n++; if (S.aud) a.k++;
    g.n++; if (S.look.fake) g.k++;
  }
  if (S.twoPt) { resolveTwo(); return; }
  if (S.aud && S.wasRunning && S.clock > 8) tick(ri(2, 4)); // changing the play at the line uses up play clock
  const pre = snapState();
  const noFlags = S.offCall === "punt" || S.offCall === "fg" || S.offCall === "kneel" || FAKE_IDS.includes(S.offCall);
  const preCode = noFlags ? null : rollPreSnap(S.defCall);
  if (preCode) r = doPreSnap(preCode, pre);
  else if (S.offCall === "punt") r = doPunt();
  else if (S.offCall === "fg") r = doFG();
  else if (S.offCall === "kneel") r = doKneel();
  else if (FAKE_IDS.includes(S.offCall)) r = doFake(S.offCall);
  else r = doScrimmage();
  // The players on the field tire (kicks and fouls before the snap don't count)
  if (!r.preSnap && S.offCall !== "punt" && S.offCall !== "fg") tireSnap(S.snap.poss, S.offPkg, S.defPkg);
  // Somebody might be hurt on the play
  if (!r.preSnap && OFFP[S.offCall]) { const hurt = injurySnap(r); if (hurt) r.injNote = hurt; }
  r.offId = S.offCall; r.defId = S.defCall; r.team = S.snap.poss; r.aud = S.aud;
  if (!r.opk) { r.opk = S.offPkg; r.dpk = S.defPkg; }
  if (r.m != null && !r.preSnap) { r.s = playScore(r, S.snap); r.read = verdict(r, S.snap); }
  if (S.aud) r.audNote = audNote();
  else if (S.look && S.look.fake && !r.preSnap && OFFP[S.offCall]) r.audNote = `The defense disguised it: they showed ${LOOKS[S.look.d].name.toLowerCase()} but played ${DEFP[S.defCall].name}. Rotating late cost them a step at the snap.`;
  else if (S.scoutNote && !r.preSnap) r.audNote = S.scoutNote.text;
  if (!noFlags && !preCode) {
    const code = rollLive(S.offCall, S.defCall, r);
    if (code) { setupPenalty(code, r, pre); return; }
  }
  finalize(r);
}
function audNote() {
  const a = S.aud, f = OFFP[a.from].name, t = OFFP[a.to].name, gain = edgeVs(a.to, S.defCall) - edgeVs(a.from, S.defCall);
  const fake = S.look && S.look.fake ? ` The defense showed ${LOOKS[S.look.d].name.toLowerCase()} but played ${DEFP[S.defCall].name}.` : "";
  if (gain >= 1) return `Smart check at the line. ${t} was a better call than ${f} against ${DEFP[S.defCall].name}.${fake}`;
  if (gain <= -1) return `The audible backfired. ${f} would have been the better call against ${DEFP[S.defCall].name}.${fake}`;
  return `Audible from ${f} to ${t}. About even against ${DEFP[S.defCall].name}.${fake}`;
}
// The game's charting sheet: one row per scrimmage snap, used by the halftime report
function chartSnap(r) {
  if (r.preSnap || r.accepted || r.s == null || !OFFP[S.offCall] || !DEF_IDS.includes(S.defCall) || !S.snap) return;
  const tg = S.snap.toGo, b = tg <= 3 ? "s" : tg <= 7 ? "m" : "l";
  (S.chart = S.chart || []).push({ o: S.snap.poss, b, off: S.offCall, def: S.defCall, aud: S.aud ? 1 : 0, look: S.look ? 1 : 0, fake: S.look && S.look.fake ? 1 : 0, s: r.s, h: S.snap.q <= 2 ? 1 : 2 });
}
function finalize(r) {
  if (r.preSnap) { r.penClock = true; finishClock(r, !S.wasRunning); }
  else {
    const scored = S.teams[0].score + S.teams[1].score !== S.snap.total;
    finishClock(r, !r.accepted && (r.head === "Incomplete" || S.poss !== S.snap.poss || scored || S.needPAT || S.offCall === "punt" || S.offCall === "fg"));
  }
  if (r.penSnap) r.sub = `${r.sub ? r.sub + " " : ""}${tname(1 - r.penBy)} choose to start the clock on the snap.`;
  // Third downs, for the box score
  if (!r.preSnap && !r.accepted && S.snap && S.snap.down === 3 && !S.twoPt && OFFP[S.offCall] && S.offCall !== "kneel") {
    const st = S.teams[S.snap.poss].st; st.d3++; if (r.fd || r.head === "Touchdown") st.d3c++;
  }
  otTail(r);
  chartSnap(r);
  if (S.subNote && S.teams[0].cpu && S.teams[1].cpu) r.subNote = S.subNote;
  S.subNote = "";
  r.id = S.playId = (S.playId || 0) + 1;
  S.last = r; S.phase = "result"; S.banner = "";
  S.log.unshift({ q: S.snap.q, clock: S.snap.clock, team: S.snap.poss, sit: S.snap.sit,
    off: S.offCall === "punt" ? "Punt" : S.offCall === "fg" ? "Field goal" : S.offCall === "kneel" ? "Kneel down" : S.offCall === "fp" ? "Fake punt" : S.offCall === "ffg" ? "Fake field goal" : `${OFF_PKGS[S.offPkg] ? OFF_PKGS[S.offPkg].short + " · " : ""}${OFFP[S.offCall].name}${S.offSide && sideOn(S.offCall) ? " (sideline)" : ""}${S.aud ? ` (audible from ${OFFP[S.aud.from].name})` : ""}`,
    def: S.defCall ? `${DEF_PKGS[S.defPkg] ? DEF_PKGS[S.defPkg].short + " · " : ""}${DEFP[S.defCall].name}${S.look && S.look.fake ? ` (disguised as ${LOOKS[S.look.d].name.toLowerCase()})` : ""}` : "", text: r.text + (r.sub ? " " + r.sub : "") + (r.injNote ? " " + r.injNote : ""), score: `${S.teams[0].score}-${S.teams[1].score}` });
}
// Seconds that come off before the next snap with the clock running
function betweenPlays() {
  const RO = R().runoff, pick = ([a, b]) => ri(a, b);
  if (S.spikeNext) return ri(8, 14);
  if (S.last && S.last.offId === "kneel") return ri(36, 40);
  let sec = S.oobRestart ? pick(S.readyWhy === "oob" ? RO.oob : RO.ready) : pick(RO.run);
  if (S.noHuddle) sec = Math.min(sec, pick(RO.nh));
  return sec;
}
function cont() {
  S.nhLock = null; // set again by startPlay when the next snap is a no-huddle snap
  if (S.tryChoice) {
    const c = S.tryChoice; S.patTeam = c.team;
    if (S.teams[c.team].cpu) { S.tryChoice = null; if (cpuTry(c) === "two") startTwo(c.spot); else doPAT("kick", xpDist(c.spot)); }
    else S.phase = "trychoice";
    return;
  }
  if (S.retryTwo) { const c = S.retryTwo; S.retryTwo = null; S.patTeam = c.team; startTwo(c.spot); return; }
  if (S.kickChoice) {
    if (!S.kickChoice.later) { S.phase = "kickchoice"; return; }
    if (laterKick()) return;
  }
  if (S.needPAT) {
    S.needPAT = false;
    if (S.teams[S.patTeam].cpu) doPAT(cpuPAT()); else S.phase = "pat";
    return;
  }
  // High school overtime: the next series, or the next period
  if (S.otEnd && !S.gameOver) { hsotNext(); if (S.toss) { tossNext(); return; } startPlay(); return; }
  if (!S.periodOver && !S.gameOver) {
    cpuClock();
    cpuNoHuddle();
    if (S.clockRunning) {
      if (S.noHuddle && !nhAvailable()) S.noHuddle = false;
      const res = runoff(betweenPlays());
      if (res !== "ok") S.noHuddle = false; // two-minute warning or end of the period: everyone can huddle and sub
      if (res === "tmw" && S.spikeNext) { S.spikeNext = false; S.banner = "Two-minute warning. The clock stopped on its own, so no spike needed."; }
    }
    S.oobRestart = false; S.toNote = "";
    if (S.spikeNext && !S.periodOver) { S.noHuddle = false; doSpike(); return; }
    S.spikeNext = false;
  }
  S.wasRunning = S.clockRunning;
  S.clockRunning = false;
  if (S.periodOver) S.noHuddle = false;
  if (S.periodOver && !S.gameOver) endPeriod();
  if (S.halftimeShow) { S.halftimeShow = false; S.hready = null; S.phase = "halftime"; return; }
  if (S.gameOver) { S.phase = "final"; return; }
  if (S.toss) { tossNext(); return; }
  startPlay();
}
function doSpike() {
  const o = S.poss, qb = starterAt(S.teams[o], "QB");
  S.spikeNext = false;
  tick(1);
  S.down++;
  pstat(qb, "pa");
  const r = { read: null, team: o, offId: "spike", defId: null, fromX: fx(o, S.spot), toX: fx(o, S.spot), head: "Spike", tone: "",
    text: `${tname(o)} hurry to the line, and ${qb.last} spikes the ball to stop the clock.`, sub: `${downText()} at the ${spotText(o, S.spot)}.` };
  r.id = S.playId = (S.playId || 0) + 1;
  finishClock(r, true);
  S.last = r; S.phase = "result"; S.banner = "";
  S.log.unshift({ q: S.quarter, clock: S.clock, team: o, sit: "Clock play", off: "Spike", def: "", text: r.text + " " + r.sub, score: `${S.teams[0].score}-${S.teams[1].score}` });
}
function callTimeout(t) {
  if (!S.clockRunning || !S.tos || S.tos[t] <= 0 || S.toUsed) return false;
  S.tos[t]--; S.oobRestart = false; S.spikeNext = false; S.noHuddle = false; S.toUsed = true;
  restAll("timeout");
  // A running clock starts again when the ball is ready for play
  if (S.runClock) { S.oobRestart = true; S.readyWhy = "to"; } else S.clockRunning = false;
  S.toNote = `Timeout, ${tname(t)}. ${S.tos[t]} left this ${S.quarter >= 5 ? "overtime" : "half"}.`;
  S.log.unshift({ q: S.quarter, clock: S.clock, team: t, sit: "Timeout", off: "Timeout", def: "", text: S.toNote, score: `${S.teams[0].score}-${S.teams[1].score}` });
  return true;
}
// Computer coordinators manage their own clock: timeouts when they need time, spikes when out of timeouts
function cpuClock() {
  if (!S.clockRunning) return;
  for (const t of [0, 1]) {
    if (!S.teams[t].cpu || !S.clockRunning || S.tos[t] <= 0 || S.toUsed) continue;
    const diff = S.teams[t].score - S.teams[1 - t].score, onO = t === S.poss;
    // Down by more than four scores late, timeouts don't matter anymore
    if (diff < -24 || S.runClock) continue;
    const late4 = S.quarter >= 4 && S.clock <= 180, late2 = S.quarter === 2 && S.clock <= 120;
    if (onO && ((late4 && diff <= 0) || (late2 && S.spot >= 45))) callTimeout(t);
    else if (!onO && late4 && diff < 0) callTimeout(t);
  }
  const o = S.poss, diff = S.teams[o].score - S.teams[1 - o].score;
  if (spikeOK() && S.teams[o].cpu && S.tos[o] === 0 && !S.oobRestart &&
      ((S.quarter >= 4 && diff <= 0 && S.clock <= 60) || (S.quarter === 2 && S.clock <= 40 && S.spot >= 55))) S.spikeNext = true;
}
// No huddle is only possible after a scrimmage play by the same offense that left the clock running
// (not after a timeout, out of bounds, incompletion, flag, two-minute warning, change of possession or kick)
function nhAvailable() {
  const r = S.last;
  return S.phase === "result" && S.clockRunning && !S.oobRestart && !S.periodOver && !S.gameOver && !S.needPAT && !S.tryChoice &&
    !S.retryTwo && !S.kickChoice && !S.twoPt && !!r && !r.pen && !r.accepted && !r.preSnap && !r.pat && r.team === S.poss &&
    !!OFFP[r.offId] && !!r.opk && !!r.dpk && S.down <= 4;
}
function cpuNoHuddle() {
  const o = S.poss;
  if (!S.teams[o].cpu || S.spikeNext || !nhAvailable()) return;
  const diff = S.teams[o].score - S.teams[1 - o].score;
  if ((S.quarter >= 4 && diff < 0 && diff >= -24 && S.clock <= 300) || (S.quarter === 2 && S.clock <= 150 && S.clock > 0)) S.noHuddle = true;
}
function endPeriod() {
  S.periodOver = false; S.clockRunning = false; S.oobRestart = false; S.spikeNext = false; S.toNote = "";
  const q = S.quarter, Rl = R();
  if (q === 1 || q === 3) { S.quarter++; S.clock = S.cfg.qLen; restAll("quarter"); S.banner = `End of the ${q === 1 ? "1st" : "3rd"} quarter.`; }
  else if (q === 2) { S.quarter = 3; S.clock = S.cfg.qLen; S.tos = [Rl.timeouts, Rl.timeouts]; restAll("half"); const r = 1 - S.firstRecv; S.banner = `Halftime. ${tname(r)} receive the second-half kickoff. ${kickoff(r, false)}`; S.halftimeShow = !(S.teams[0].cpu && S.teams[1].cpu); }
  else if (S.teams[0].score === S.teams[1].score) startOT(q === 4 ? "Tied after regulation. On to overtime." : "Still tied after overtime. On to another overtime period.");
  // NFL playoff rule: the clock running out doesn't take away the second team's guaranteed possession
  else if (q >= 5 && S.ot && S.ot.ph === 2) startOT(`${tname(1 - S.ot.a)} are guaranteed an overtime possession, so the game goes on.`);
  else S.gameOver = true;
}
