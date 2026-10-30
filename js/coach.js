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
