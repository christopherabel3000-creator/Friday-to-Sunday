// Friday to Sunday: playbooks and schemes (Milestone 7). Every team shares the 8 base plays and calls
// on each side (engine.js). A scheme adds plays only it can call: three in high school, a fourth in
// college and a fifth in the pros. They're installed in practice like any play, the scheme's
// strengths grow with how well they're known, and its weaknesses count in full from the first day.
// The Option offense is a high school and college scheme only. See "Milestone 7" in DESIGN.md.
"use strict";

/* ---------- The Option ---------- */
OFF_STYLE_IDS.push("opt");
OFF_STYLES.opt = { name: "Option", short: "Option", desc: "Read the defense and run. Built for a quarterback who can run. Outside runs and the sneak are strengths; throwing on schedule is not.",
  plays: { or: .5, ir: .3, qs: .5, pa: .3, sp: -.4, ms: -.5, dp: -.5, sc: -.3, hm: -.3 } };
CORE_PLAYS.opt = ["ir", "or", "dr", "pa"];
// Levels where a scheme can be run (the Option never in the pros)
const STYLE_LEVELS = { opt: ["hs", "col"] };
const styleAt = (id, lvl) => !STYLE_LEVELS[id] || STYLE_LEVELS[id].includes(lvl || "hs");
const offStylesAt = lvl => OFF_STYLE_IDS.filter(id => styleAt(id, lvl));
// A scheme that can't be run at this level falls back to Balanced
const styleFor = (id, lvl) => styleAt(id, lvl) ? id : "bal";

/* ---------- Tags and matchups ---------- */
// Each play has tags, and each call an edge against each tag, on the play-call scale (positive favors
// the offense). A play with two tags takes the average. A few named matchups go their own way. The
// 8 by 8 chart for the base plays (engine.js: M) stays as it is.
const TAG_NAMES = { in: "inside run", out: "outside run", mis: "misdirection", scr: "screen", qk: "quick", mid: "intermediate", deep: "deep", pa: "play-action", opt: "option" };
const BASE_TAGS = { ir: ["in"], or: ["out"], dr: ["in", "mis"], sc: ["scr"], sp: ["qk"], ms: ["qk", "mid"], dp: ["deep"], pa: ["pa", "deep"], qs: ["in"], hm: ["deep"], te: ["qk"] };
const TAG_EDGE = {
  //   inside, outside, misdirection, screen, quick, intermediate, deep, play-action, option
  rb: { in: -2, out: -2, mis: 1, scr: 1, qk: 0, mid: 1, deep: 1, pa: 2, opt: -1 },
  ba: { in: 0, out: 0, mis: -1, scr: 0, qk: 0, mid: 0, deep: 0, pa: 0, opt: -1 },
  ma: { in: 1, out: 0, mis: 1, scr: 0, qk: -1, mid: 1, deep: 1, pa: -1, opt: 1 },
  zo: { in: 1, out: 1, mis: 1, scr: -1, qk: 0, mid: -1, deep: -2, pa: 0, opt: 1 },
  c3: { in: -1, out: 0, mis: 0, scr: 0, qk: 1, mid: 0, deep: -1, pa: 0, opt: 0 },
  pr: { in: 1, out: 1, mis: 2, scr: 1, qk: 1, mid: 1, deep: -2, pa: -2, opt: 2 },
  ab: { in: -1, out: 1, mis: 2, scr: 2, qk: 1, mid: -1, deep: 0, pa: -2, opt: 1 },
  zb: { in: 0, out: -1, mis: 1, scr: -2, qk: -1, mid: 0, deep: 1, pa: 0, opt: 0 },
  qtr: { in: 0, out: .5, mis: 0, scr: 0, qk: 1, mid: -.5, deep: -2, pa: -1.5, opt: .5 },
  rob: { in: -.5, out: .5, mis: 0, scr: .5, qk: -1, mid: -1.5, deep: 1, pa: 0, opt: 0 },
  spy: { in: 0, out: 0, mis: -1, scr: .5, qk: .5, mid: .5, deep: 0, pa: 0, opt: -1 },
  smp: { in: 0, out: 0, mis: .5, scr: -1.5, qk: -1, mid: -.5, deep: .5, pa: 0, opt: 0 },
  tm2: { in: .5, out: .5, mis: .5, scr: -.5, qk: 0, mid: -1, deep: -1.5, pa: -.5, opt: 1 },
  cbz: { in: .5, out: -2, mis: 1, scr: -2, qk: 1.5, mid: 0, deep: 1.5, pa: 0, opt: -1 },
  dag: { in: -2, out: .5, mis: 2, scr: 2, qk: 0, mid: -1, deep: -1, pa: -1, opt: 0 },
  ovl: { in: 0, out: 0, mis: .5, scr: 1, qk: 1.5, mid: -1, deep: -1, pa: -1, opt: 0 },
  c0b: { in: 1, out: .5, mis: 1, scr: -2, qk: -1.5, mid: -.5, deep: -.5, pa: 0, opt: 1 },
  gdg: { in: -.5, out: 0, mis: 0, scr: .5, qk: 0, mid: -.5, deep: 0, pa: -1, opt: -.5 },
  brk: { in: 1, out: .5, mis: 1, scr: 0, qk: -1, mid: -1.5, deep: -1.5, pa: -.5, opt: 1 },
  ptm: { in: 0, out: 0, mis: .5, scr: 0, qk: -1, mid: -1, deep: -1, pa: 0, opt: .5 },
  tcn: { in: .5, out: .5, mis: 0, scr: -1, qk: -1.5, mid: 0, deep: 2, pa: 1, opt: .5 },
  cv6: { in: .5, out: 0, mis: 0, scr: 0, qk: 0, mid: -.5, deep: -1.5, pa: -1, opt: .5 },
  buz: { in: 0, out: 0, mis: 0, scr: 0, qk: -.5, mid: -1, deep: -1, pa: -.5, opt: 0 },
  ber: { in: -2, out: 1.5, mis: 0, scr: 1, qk: .5, mid: 0, deep: .5, pa: 2, opt: -.5 },
  lst: { in: -1.5, out: -1, mis: 2, scr: .5, qk: 0, mid: 0, deep: 0, pa: 0, opt: -.5 },
  scx: { in: 0, out: -.5, mis: 1.5, scr: .5, qk: .5, mid: .5, deep: .5, pa: .5, opt: -2.5 },
  tit: { in: -1.5, out: 0, mis: .5, scr: .5, qk: .5, mid: 0, deep: .5, pa: 1, opt: -1 },
  und: { in: -1, out: -1, mis: .5, scr: 0, qk: .5, mid: 0, deep: .5, pa: 1, opt: -.5 }
};
// The named matchups: [play][call] = edge
const SCHEME_EXC = {
  ir: { dag: -2, ber: -2, lst: -1.5 }, or: { cbz: -2 }, dr: { spy: -1.5, dag: 2, lst: 2 }, sc: { cbz: -1, dag: 2 }, sp: { rob: -1, cbz: 1.5, tcn: -1.5 },
  ms: { rob: -2, ptm: -2 }, dp: { tcn: 2, qtr: -2, cv6: -1.5 }, pa: { qtr: -1.5, ber: 2 }, qs: { ber: -2 },
  trp: { rb: .5, ab: .5, ba: -1.5, lst: 1, dag: 1.5 },
  btl: { rb: 2, ma: 1, zb: -1.5, spy: -1.5, scx: 2, cbz: -1.5 },
  tes: { zo: 1.5, c3: 1.5, ma: -1.5, brk: 1.5, qtr: .5 },
  rpg: { rb: 1.5, ab: 1, ber: 1.5, dag: 1.5, c3: -1, zb: -1.5 },
  dgr: { ab: -2, zb: -1, c3: 1.5, qtr: 1, c0b: 1 },
  fvt: { c3: 1.5, zo: 1, pr: -2, ab: -2, ptm: -2, qtr: -1.5, cv6: -1 },
  ycr: { ma: 1.5, zo: 1, zb: -1.5, rob: -2 },
  bub: { rb: 1, ab: 2, pr: 1.5, ma: -1.5, cbz: -2, c0b: -1.5, tcn: -1 },
  shc: { ma: 1.5, ab: 1, zo: -1, rob: -1.5 },
  dpo: { qtr: 1.5, cv6: 1, zo: -.5, ab: -2 },
  pwr: { rb: -1, ba: .5 },
  ctr: { rb: .5, ab: 1, lst: 1.5, ba: -1.5, scx: 1.5, ber: -1 },
  tss: { dag: 1.5, rb: 0, cbz: -2, c3: -.5 },
  pas: { rb: 2.5, ab: -1, zo: -.5, tcn: 1 },
  lek: { ma: 0, rb: 2, gdg: -1.5, brk: 1.5, scx: 1 },
  slf: { rb: 1, ab: 2, c3: 1.5, zo: -1.5, cbz: 2, tcn: -1.5, ovl: 1.5 },
  stk: { zo: 1, c3: 1, pr: 1, qtr: 1, ma: -1.5, ptm: -2 },
  tex: { ma: 2, ab: 1.5, gdg: -1.5, spy: -1 },
  drv: { zo: 1, c3: 1, ma: -.5, rob: -1.5, tm2: -1 },
  fld: { c3: 2, zo: .5, ma: -1, cv6: -1, buz: -1 },
  tri: { ma: 1, ba: -1.5, scx: -2.5, spy: -1, ab: .5, rb: 0 },
  qbk: { spy: -1.5, scx: -1, ber: -1.5, pr: 1.5 },
  opp: { rb: 3, ab: 1.5, ma: 0, scx: 1, tcn: 1, zo: -1, pr: -2 },
  zrd: { ba: -1.5, scx: -2, spy: -1, rb: 0, ab: 1 }
};

/* ---------- Scheme plays ---------- */
// like: the base play it's closest to (personnel fit, penalties, the computer's situational calls).
// qbRun: the share of carries the quarterback keeps. fumK, fumMax: option footballs come loose more
// while they're being learned. sackAdd: protection beyond the usual.
const SCHEME_OFFP = {
  trp: { name: "Trap", like: "ir", kind: "run", tag: "Run", tags: ["in", "mis"], desc: "Let a lineman through, then trap him from the side. A quick hitter inside. Beats blitzes and fronts that get upfield; a patient Base front waits for it.", mean: 3.8, sd: 3.2, tfl: .09, big: .03, fum: .012, oob: .04, way: "on the trap" },
  btl: { name: "Bootleg", like: "pa", kind: "pass", tag: "Pass", tags: ["pa", "mid"], desc: "Fake the run one way, and the quarterback rolls out the other. Beats Run Blitz and Man; a Zone Blitz is waiting on the edge.", comp: .6, mean: 11, sd: 5, min: 4, int: .025, sack: .045, air: 9,
    catch: (q, t) => `${q} rolls out on the bootleg and hits ${t}`, miss: (q, t) => `${q} rolls out but can't connect with ${t}.` },
  tes: { name: "Tight End Seam", like: "pa", kind: "pass", tag: "Pass", tags: ["mid"], desc: "The tight end splits the safeties down the middle. Beats Cover 2 and Cover 3; a man defender rides him.", comp: .5, mean: 13, sd: 5, min: 7, int: .035, sack: .05, air: 12, targets: { TE: 8, WR: 2 },
    catch: (q, t) => `${q} splits the safeties and finds ${t} up the seam`, miss: (q, t) => `${q}'s throw up the seam for ${t} falls incomplete.` },
  rpg: { name: "RPO Glance", like: "sp", kind: "pass", tag: "Pass", tags: ["qk", "in"], desc: "A run or a quick throw, read off one linebacker. Punishes a defense that loads the box; zone underneath takes it away.", comp: .7, mean: 7, sd: 3.5, min: 1, int: .02, sack: .02, air: 6,
    catch: (q, t) => `${q} pulls it from the back's belly and hits ${t} on the glance`, miss: (q, t) => `${q} pulls it and throws, but the glance to ${t} falls incomplete.` },
  dgr: { name: "Dagger", like: "dp", kind: "pass", tag: "Pass", tags: ["deep", "mid"], desc: "A deep in-breaking route behind a clearing seam. Beats Cover 3 and quarters, but it takes time: pressure kills it.", comp: .48, mean: 18, sd: 6, min: 10, int: .033, sack: .07, air: 16, deep: 1,
    catch: (q, t) => `${q} waits for the dagger and drills it to ${t}`, miss: (q, t) => `${q}'s dagger route to ${t} falls incomplete.` },
  fvt: { name: "Four Verticals", like: "dp", kind: "pass", tag: "Pass", tags: ["deep"], desc: "Four receivers run straight up the field and stretch the deep defenders. Beats Cover 3 and Cover 2; Prevent and the blitz shut it down.", comp: .42, mean: 22, sd: 8, min: 12, int: .04, sack: .065, air: 18, deep: 1,
    catch: (q, t) => `Four verticals, and ${q} hits ${t} up the field`, miss: (q, t) => `${q} lets it fly on four verticals, but it falls incomplete for ${t}.` },
  ycr: { name: "Y-Cross", like: "ms", kind: "pass", tag: "Pass", tags: ["mid"], desc: "A deep crossing route across the field. Beats Man and Cover 2; the dropping lineman in a Zone Blitz sits right in its path.", comp: .55, mean: 11, sd: 4, min: 6, int: .03, sack: .05, air: 10,
    catch: (q, t) => `${q} finds ${t} on the deep cross`, miss: (q, t) => `${q} misses ${t} on the deep cross.` },
  bub: { name: "Bubble Screen", like: "sc", kind: "pass", tag: "Pass", tags: ["scr"], desc: "A quick throw to a receiver bubbling out behind his blockers. Beats blitzes and soft corners; a pressed corner blows it up.", comp: .86, mean: 4.5, sd: 4, min: -2, int: .008, sack: .01, air: 0, targets: { WR: 9, RB: 1 },
    catch: (q, t) => `${q} flips the bubble screen out to ${t}`, miss: (q, t) => `The bubble screen to ${t} is blown up, and ${q}'s throw falls incomplete.` },
  shc: { name: "Shallow Cross", like: "ms", kind: "pass", tag: "Pass", tags: ["qk", "mid"], desc: "A receiver drags across the field just past the line. Beats Man and pressure; a robbing safety jumps it.", comp: .72, mean: 6, sd: 3.5, min: 2, int: .016, sack: .03, air: 3,
    catch: (q, t) => `${q} hits ${t} on the shallow cross`, miss: (q, t) => `${q}'s shallow cross for ${t} falls incomplete.` },
  dpo: { name: "Dig-Post", like: "dp", kind: "pass", tag: "Pass", tags: ["deep", "mid"], desc: "A dig under a post, built to beat four-deep coverage. Takes time to throw.", comp: .46, mean: 20, sd: 7, min: 11, int: .035, sack: .07, air: 17, deep: 1,
    catch: (q, t) => `${q} hits ${t} on the dig-post`, miss: (q, t) => `${q}'s dig-post throw for ${t} falls incomplete.` },
  pwr: { name: "Power", like: "ir", kind: "run", tag: "Run", tags: ["in"], desc: "A pulling guard leads the way. A steady gain against almost anything, with less to lose than Inside Run against a run blitz.", mean: 4.0, sd: 2.4, tfl: .07, big: .02, fum: .011, oob: .03, way: "behind the pulling guard" },
  ctr: { name: "Counter Trey", like: "ir", kind: "run", tag: "Run", tags: ["in", "mis"], desc: "Step one way, then two linemen pull back the other. Beats fronts that flow fast and stunts; a disciplined Base front stays home.", mean: 4.0, sd: 4.2, tfl: .11, big: .04, fum: .013, oob: .08, way: "on the counter" },
  tss: { name: "Toss Sweep", like: "or", kind: "run", tag: "Run", tags: ["out"], desc: "Pitch it to the back and race to the edge. Beats inside pressure; a corner blitz is waiting for it.", mean: 4.0, sd: 5.2, tfl: .14, big: .05, fum: .016, oob: .38, way: "on the toss sweep" },
  pas: { name: "Play-Action Shot", like: "pa", kind: "pass", tag: "Pass", tags: ["pa", "deep"], desc: "A run fake with everyone staying in to block, and a shot deep. Built to punish a run blitz.", comp: .4, mean: 23, sd: 8, min: 12, int: .038, sack: .04, air: 20, deep: 1,
    catch: (q, t) => `Max protection, the fake, and ${q} finds ${t} deep`, miss: (q, t) => `${q} sells the fake, but the shot for ${t} falls incomplete.` },
  lek: { name: "Leak", like: "pa", kind: "pass", tag: "Pass", tags: ["pa", "mid"], desc: "Play-action one way, and the tight end slips across the field the other way.", comp: .58, mean: 11, sd: 5, min: 4, int: .022, sack: .04, air: 9, targets: { TE: 8, RB: 1 },
    catch: (q, t) => `Play-action, and ${t} leaks out wide open for ${q}`, miss: (q, t) => `${q} looks for ${t} leaking across the field, but the throw falls incomplete.` },
  slf: { name: "Slant-Flat", like: "sp", kind: "pass", tag: "Pass", tags: ["qk"], desc: "A slant and a flat route on the same side, a quick read. Beats blitzes and Cover 3; Cover 2 corners squat on it.", comp: .7, mean: 6, sd: 3, min: 1, int: .022, sack: .03, air: 5,
    catch: (q, t) => `${q} reads it quick and hits ${t} on the slant-flat`, miss: (q, t) => `${q}'s quick throw to ${t} on the slant-flat falls incomplete.` },
  stk: { name: "Stick", like: "sp", kind: "pass", tag: "Pass", tags: ["qk"], desc: "A receiver sits down past the sticks. A high-percentage throw for third down. Beats zones; man coverage stays on him.", comp: .75, mean: 5.5, sd: 2.5, min: 2, int: .018, sack: .035, air: 5,
    catch: (q, t) => `${q} hits ${t} on the stick route`, miss: (q, t) => `${q}'s stick route to ${t} falls incomplete.` },
  tex: { name: "Texas", like: "sc", kind: "pass", tag: "Pass", tags: ["qk", "mid"], desc: "The running back's angle route, breaking back inside. Beats Man and All-Out Blitz.", comp: .7, mean: 6.5, sd: 4, min: 1, int: .016, sack: .035, air: 4, targets: { RB: 8, TE: 1, WR: 1 },
    catch: (q, t) => `${q} finds ${t} on the angle route out of the backfield`, miss: (q, t) => `${q}'s throw to ${t} on the angle route falls incomplete.` },
  drv: { name: "Drive", like: "ms", kind: "pass", tag: "Pass", tags: ["mid"], desc: "A shallow cross and a dig on top of it, stretching the underneath zones.", comp: .62, mean: 8, sd: 4, min: 3, int: .024, sack: .045, air: 7,
    catch: (q, t) => `${q} hits ${t} on the dig over the top of the drive concept`, miss: (q, t) => `${q}'s throw to ${t} on the drive concept falls incomplete.` },
  fld: { name: "Flood", like: "ms", kind: "pass", tag: "Pass", tags: ["mid", "deep"], desc: "Three receivers at three depths on one sideline. Overloads Cover 3.", comp: .56, mean: 11, sd: 5, min: 5, int: .028, sack: .05, air: 10,
    catch: (q, t) => `${q} floods the sideline and hits ${t}`, miss: (q, t) => `${q}'s throw to ${t} on the flood falls incomplete.` },
  tri: { name: "Triple Option", like: "or", kind: "run", tag: "Run", tags: ["opt", "out"], desc: "Give it to the fullback, keep it, or pitch it, read off two defenders. Beats Man and light boxes; a disciplined Base front and Scrape Exchange take it away. Footballs come loose while it's still being learned.", mean: 4.0, sd: 5, tfl: .12, big: .05, fum: .02, oob: .2, qbRun: .4, fumK: .02, fumMax: 2.2, way: "on the option" },
  qbk: { name: "QB Keeper", like: "ir", kind: "run", tag: "Run", tags: ["in"], desc: "A quarterback power run up the middle, with the back as a lead blocker. A QB Spy waits for it.", mean: 3.9, sd: 3.3, tfl: .08, big: .03, fum: .012, oob: .04, qbRun: 1, fumK: .012, fumMax: 1.8, way: "on the keeper" },
  opp: { name: "Option Pass", like: "pa", kind: "pass", tag: "Pass", tags: ["pa", "deep"], desc: "Run the option, then pull up and throw over a defense that came up to stop it. Beats Run Blitz badly; a low-percentage throw.", comp: .4, mean: 20, sd: 8, min: 8, int: .035, sack: .04, air: 16, deep: 1,
    catch: (q, t) => `${q} runs the option, pulls up, and hits ${t} behind the defense`, miss: (q, t) => `${q} pulls up on the option pass, but it's incomplete for ${t}.` },
  zrd: { name: "Zone Read", like: "or", kind: "run", tag: "Run", tags: ["opt", "in"], desc: "The quarterback reads the end: hand it off or keep it. With a bubble throw attached.", mean: 3.9, sd: 4.2, tfl: .1, big: .04, fum: .015, oob: .1, qbRun: .35, fumK: .016, fumMax: 1.9, way: "on the zone read" }
};
// sackAdd: more or fewer sacks than the call it's like. int: interception multipliers by tag.
// blitz: counts as pressure. steep: poor until it's well mastered.
const SCHEME_DEFP = {
  qtr: { name: "Quarters", like: "zo", tag: "Coverage", desc: "Four deep defenders. Takes away deep shots and play-action; soft against quick throws." },
  rob: { name: "Robber", like: "c3", tag: "Coverage", desc: "A safety sits in the middle of the field. Jumps Mesh, slants and crossing routes; open deep outside.", int: { mid: 1.5, qk: 1.2 } },
  spy: { name: "QB Spy", like: "ba", tag: "Front", desc: "A linebacker shadows the quarterback. Beats keepers, bootlegs and draws, with a weaker rush.", sackAdd: -.015 },
  smp: { name: "Simulated Pressure", like: "zb", tag: "Pressure", desc: "Show six rushers, send four from unexpected spots, and drop the rest. Pressure with fewer risks.", blitz: true },
  tm2: { name: "Tampa 2", like: "zo", tag: "Coverage", desc: "Cover 2 with the middle linebacker running deep down the middle. Takes away the seam and the deep middle; runs find room." },
  cbz: { name: "Corner Blitz", like: "ab", tag: "Pressure", desc: "A corner comes off the edge. Beats outside runs and bubble screens; a quick slant or a deep throw to that side beats it.", blitz: true },
  dag: { name: "Double A-Gap", like: "ab", tag: "Pressure", desc: "Two linebackers in the A-gaps, both coming. Beats inside runs and slow-developing passes; screens and draws gash it.", blitz: true },
  ovl: { name: "Overload", like: "zb", tag: "Pressure", desc: "Five rushers from one side with zone behind. A safer pressure; quick throws beat it.", blitz: true },
  c0b: { name: "Cover 0 Bluff", like: "c3", tag: "Coverage", desc: "Show an all-out blitz, then drop eight. Baits hot throws and screens; runs find room.", sackAdd: -.01 },
  gdg: { name: "Green Dog", like: "zb", tag: "Pressure", desc: "Linebackers in man on the backs and tight ends rush when their man stays in to block. Beats the back's routes and play-action.", blitz: true },
  brk: { name: "Bracket", like: "ma", tag: "Coverage", desc: "Two defenders on the offense's best receiver. Loses to runs and tight ends.", bracket: true },
  ptm: { name: "Pattern Match", like: "c3", tag: "Coverage", desc: "Zone that turns into man as the routes declare. Beats Mesh, Stick and Four Verticals, but it's poor until it's well mastered.", steep: true },
  tcn: { name: "Trap Corner", like: "zo", tag: "Coverage", desc: "The corner bails, then jumps the short outside throw for an interception. Burned deep.", int: { qk: 2.2, scr: 1.5 } },
  cv6: { name: "Cover 6", like: "zo", tag: "Coverage", desc: "Quarters to one side, Cover 2 to the other. Takes away the deep ball and the flood.", int: { deep: 1.2 } },
  buz: { name: "Buzz", like: "c3", tag: "Coverage", desc: "A safety rotates down to the hook zone at the snap. Takes away intermediate throws; the edge is a little light." },
  ber: { name: "Bear Front", like: "rb", tag: "Front", desc: "The center and both guards covered. Beats inside runs and sneaks; outside runs and play-action beat it." },
  lst: { name: "Line Stunt", like: "rb", tag: "Front", desc: "The linemen twist at the snap. Beats zone runs; draws and cutbacks find the holes it leaves." },
  scx: { name: "Scrape Exchange", like: "ba", tag: "Front", desc: "The end crashes and the linebacker scrapes over the top. The answer to option football. Counter Trey and Bootleg beat it." },
  tit: { name: "Tite Front", like: "ba", tag: "Front", desc: "Five big men tight to the ball. Built against inside runs and spread option looks." },
  und: { name: "Under Front", like: "ba", tag: "Front", desc: "A shifted front with a linebacker on the line. Sound against the run; play-action finds room." }
};
Object.assign(OFFP, SCHEME_OFFP);
Object.assign(DEFP, SCHEME_DEFP);
// Each scheme's plays, in order: three in high school, a fourth in college, a fifth in the pros
const SCHEME_PLAYS = { bal: ["trp", "btl", "tes", "rpg", "dgr"], air: ["fvt", "ycr", "bub", "shc", "dpo"], gnp: ["pwr", "ctr", "tss", "pas", "lek"], wc: ["slf", "stk", "tex", "drv", "fld"], opt: ["tri", "qbk", "opp", "zrd"] };
const SCHEME_CALLS = { bal: ["qtr", "rob", "spy", "smp", "tm2"], blz: ["cbz", "dag", "ovl", "c0b", "gdg"], nfz: ["brk", "ptm", "tcn", "cv6", "buz"], rs: ["ber", "lst", "scx", "tit", "und"] };
const SCHEME_N = { hs: 3, col: 4, pro: 5 };
const ALL_SCHEME_IDS = [].concat(...Object.values(SCHEME_PLAYS), ...Object.values(SCHEME_CALLS));
const isSchemeId = id => ALL_SCHEME_IDS.includes(id);
const schemePlaysAt = (style, lvl) => (SCHEME_PLAYS[style] || []).slice(0, SCHEME_N[lvl] || 3);
const schemeCallsAt = (style, lvl) => (SCHEME_CALLS[style] || []).slice(0, SCHEME_N[lvl] || 3);
// The scheme a play belongs to, and which side
function schemeOfId(id) {
  for (const k in SCHEME_PLAYS) if (SCHEME_PLAYS[k].includes(id)) return { side: "off", style: k };
  for (const k in SCHEME_CALLS) if (SCHEME_CALLS[k].includes(id)) return { side: "def", style: k };
  return null;
}
// The base play or call a scheme play is closest to
const lk = id => (OFFP[id] && OFFP[id].like) || (DEFP[id] && DEFP[id].like) || id;
const tagsOf = id => (OFFP[id] && OFFP[id].tags) || BASE_TAGS[id] || [];
// A real defensive call (not a special teams unit)
const isDefCall = id => !!DEFP[id] && id !== "blk" && id !== "ret";
const isBlitz = id => BLITZ_IDS.includes(id) || !!(DEFP[id] && DEFP[id].blitz);
// Fill the matchup chart for every play and call that isn't in the base 8 by 8
(function fillMatchups() {
  const offs = Object.keys(BASE_TAGS).concat(Object.keys(SCHEME_OFFP)), defs = DEF_IDS.concat(Object.keys(SCHEME_DEFP));
  offs.forEach(p => {
    M[p] = M[p] || {};
    defs.forEach(d => {
      if (BASE_TAGS[p] && DEF_IDS.includes(d)) return; // the base chart
      const ex = SCHEME_EXC[p] && SCHEME_EXC[p][d];
      M[p][d] = ex != null ? ex : Math.round(avg(tagsOf(p).map(x => TAG_EDGE[d][x] || 0)) * 100) / 100;
    });
    // The special teams units, as for the base plays
    if (SCHEME_OFFP[p]) { M[p].blk = M[p].ab; M[p].ret = OFFP[p].deep ? 1 : 2; }
  });
})();
// Package fit: a scheme play fits like the base play it's closest to
Object.keys(PKG_FIT).forEach(pk => Object.keys(SCHEME_OFFP).forEach(id => { const v = PKG_FIT[pk][lk(id)]; if (v != null && PKG_FIT[pk][id] == null) PKG_FIT[pk][id] = v; }));
Object.keys(OFF_PKGS).forEach(pk => { const c = OFF_PKGS[pk].comp; if (c) Object.keys(SCHEME_OFFP).forEach(id => { if (c[lk(id)] != null && c[id] == null) c[id] = c[lk(id)]; }); });

/* ---------- Looks ---------- */
// What the offense sees before the snap. Some calls share a look on purpose, so reading the defense
// stays a skill: the hint for a shared look names every call that comes out of it.
Object.assign(LOOKS, {
  rb: { name: "Eight in the box", hint: "A safety creeps down. Often a run blitz, sometimes a scrape exchange against the option." },
  ba: { name: "Even front, one high safety", hint: "Balanced. Doesn't tip much: a base front, a line stunt, a spy or a shifted front can all come from it." },
  ma: { name: "Press corners", hint: "Corners up in the receivers' faces. Often man coverage, sometimes a corner blitz or a green dog." },
  zo: { name: "Two high safeties", hint: "Deep help on both sides. Often Cover 2; quarters, Tampa 2, Cover 6 and a bracket look the same." },
  pr: { name: "Soft corners, safeties deep", hint: "Playing way off the ball. Often prevent, but a corner playing soft might be setting a trap." },
  ab: { name: "Linebackers walked up", hint: "Bodies on the line. Pressure could be coming, or they could all drop out." },
  c3: { name: "One high safety, corners bailing", hint: "A single safety deep in the middle and the corners backpedal at the snap. Often Cover 3; a robber, pattern match or buzz rotation look the same." },
  zb: { name: "Linebackers mugging the A-gaps", hint: "Looks like pressure, but one of those rushers might drop. A zone blitz, or both of them coming." }
});
const SHARED_LOOK = { qtr: "zo", tm2: "zo", cv6: "zo", brk: "zo", rob: "c3", ptm: "c3", buz: "c3", spy: "ba", lst: "ba", und: "ba", cbz: "ma", gdg: "ma", dag: "zb", smp: "ab", c0b: "ab", tcn: "pr", scx: "rb" };
Object.keys(SHARED_LOOK).forEach(id => { LOOKS[id] = LOOKS[SHARED_LOOK[id]]; });
Object.assign(LOOKS, {
  ovl: { name: "Bodies stacked to one side", hint: "Extra rushers lined up on one edge. An overload is coming from there." },
  ber: { name: "Center and guards covered", hint: "A bear front: big men head up on the interior. Built to stop the run inside." },
  tit: { name: "Tackles pinched inside", hint: "A tite front: five big men tight to the ball. Built against inside runs and the option." }
});
// The look a call shows, as one id (calls that share a look give the same one)
const lookKey = id => SHARED_LOOK[id] || id;
// How often a computer defense disguises each scheme call: like the call it's closest to
Object.keys(SCHEME_DEFP).forEach(id => { if (DISGUISE[id] == null) DISGUISE[id] = DISGUISE[lk(id)] ?? .3; });

/* ---------- A team's playbook in a game ---------- */
const gameLvl = () => (S && S.cfg && S.cfg.level) || "hs";
const offBook = t => OFF_IDS.concat(schemePlaysAt(offStyleOf(t), gameLvl()));
const defBook = t => DEF_IDS.concat(schemeCallsAt(defStyleOf(t), gameLvl()));
// How well a team has its scheme installed, 0 to 1: the average mastery of its scheme plays here
function installShare(t, side) {
  const ids = side === "off" ? schemePlaysAt(offStyleOf(t), gameLvl()) : schemeCallsAt(defStyleOf(t), gameLvl());
  return ids.length ? clamp(avg(ids.map(id => masteryOf(t, id))) / 100, 0, 1) : 1;
}
// A scheme's edges at this install: strengths scaled by it, weaknesses in full
const scaleUp = (v, k) => v > 0 ? v * k : v;
// Defense mastery: Pattern Match is poor until it's well mastered (twice the cost below 70)
const defMasteryEdge = (def, v) => masteryEdge(v) * (DEFP[def] && DEFP[def].steep && v < MASTERY_BASE ? 2 : 1);
// Fumbles on a play still being learned: option footballs come loose more
const fumMulFor = (off, v) => { const P = OFFP[off]; return P && P.fumK ? clamp(1 - P.fumK * (v - 60), .75, P.fumMax || 1.5) : masteryMul(v, .008); };
// The Option catches an unprepared defense: an edge for option plays, less the more film the
// defense studied (your opponent prep; a computer defense studies about a full week's worth)
const OPT_SURPRISE = [.3, .18, .08, 0];
const optSurprise = (off, d) => tagsOf(off).includes("opt") || off === "qbk" || off === "opp" ? OPT_SURPRISE[clamp(S.teams[d].prepLv ?? 2, 0, 3)] : 0;
// Interception multipliers from a scheme call against a play's tags
const schemeIntMul = (def, off) => { const t = DEFP[def] && DEFP[def].int; if (!t) return 1; return Math.max(1, ...tagsOf(off).map(x => t[x] || 1)); };

/* ---------- A school's playbook ---------- */
const schoolLvl = s => levelOf(s && s.cls);
// Every play a school can install: the base playbook and its schemes' plays at its level
const bookIds = s => INSTALL_IDS.concat(schemePlaysAt(s.off, schoolLvl(s)), schemeCallsAt(s.def, schoolLvl(s)));
// Scheme plays a school knows when it's built: the old coach installed them. Every other scheme's
// plays start at 0. A save from before Milestone 7 keeps its schemes, with their plays at solid.
const SCHEME_SOLID = 68;
// (worked out from how well the school knows its core plays, so building a school rolls no new dice)
function schemeMastery(m, off, def) {
  const core = (CORE_PLAYS[off] || CORE_PLAYS.bal).concat(CORE_CALLS[def] || CORE_CALLS.bal), base = avg(core.map(id => m[id] || 0)) - 6;
  const cur = (SCHEME_PLAYS[off] || []).concat(SCHEME_CALLS[def] || []);
  ALL_SCHEME_IDS.forEach(id => { const i = cur.indexOf(id); m[id] = i >= 0 ? clamp(Math.round(base + [3, 0, -3, -5, -8][i % 5]), 35, 85) : 0; });
  return m;
}
// Fills in any scheme play a school's playbook is missing (saves from before the milestone)
function fillSchemes(s) {
  if (!s || !s.mastery) return s;
  const m = s.mastery, cur = new Set((SCHEME_PLAYS[s.off] || []).concat(SCHEME_CALLS[s.def] || []));
  ALL_SCHEME_IDS.forEach(id => { if (m[id] == null) m[id] = cur.has(id) ? SCHEME_SOLID : 0; });
  return s;
}
// How installed a scheme is at a school: the average of its plays here, and a word for it
function schemeInstall(s, side, style) {
  const ids = side === "off" ? schemePlaysAt(style || s.off, schoolLvl(s)) : schemeCallsAt(style || s.def, schoolLvl(s)), m = (s && s.mastery) || {};
  const v = ids.length ? avg(ids.map(id => m[id] || 0)) : 0;
  return { v: Math.round(v), word: masteryWord(Math.round(v)), ids };
}
// Changing schemes: the old scheme's plays are shelved at half what they were. The new scheme's
// plays start wherever they are (0 if never installed here). Nothing is locked.
function switchScheme(s, side, style) {
  fillSchemes(s);
  const k = side === "off" ? "off" : "def", old = s[k], list = side === "off" ? SCHEME_PLAYS : SCHEME_CALLS;
  if (!style || style === old || !list[style] && style !== "bal") return false;
  if (s.mastery) (list[old] || []).forEach(id => { s.mastery[id] = Math.round((s.mastery[id] || 0) * 50) / 100; });
  s[k] = style;
  return true;
}
// The offseason: the scheme's own plays fade as other plays do (down toward 30, never up), and
// shelved schemes' plays lose half again
const SHELF_FADE = .5;
function fadeSchemes(s) {
  if (!s || !s.mastery) return;
  fillSchemes(s);
  const cur = new Set((SCHEME_PLAYS[s.off] || []).concat(SCHEME_CALLS[s.def] || []));
  ALL_SCHEME_IDS.forEach(id => {
    const v = s.mastery[id] || 0;
    s.mastery[id] = Math.round((cur.has(id) ? v - Math.max(0, v - 30) * MASTERY_FORGET : v * SHELF_FADE) * 100) / 100;
  });
}

/* ---------- Installing scheme plays ---------- */
// The scheme's plays are installed together, on a track of their own: every install session teaches
// them, on top of what the base playbook gets. Three weeks of heavy install in camp takes a new
// scheme to "learning" by week 1, "solid" around week 5 or 6, and "mastered" late in the year.
// A focus play learns faster. Balanced installs a quarter faster (it's the easy one to teach), and
// your coach installs a scheme faster for every season he's run it (4 percent each, up to 20).
const SCHEME_RATE = .314, SCHEME_FOCUS = 1.6, BAL_INSTALL = 1.25;
const SCHEME_YEAR = .04, SCHEME_YEARS_MAX = 5;
const schemeYears = (coach, side, style) => Math.min(SCHEME_YEARS_MAX, ((coach && coach.sch && coach.sch[side]) || {})[style] || 0);
const schemeSpeed = (coach, side, style) => (style === "bal" ? BAL_INSTALL : 1) * (1 + SCHEME_YEAR * schemeYears(coach, side, style));
function installSchemes(s, pts, focus, rep, coach, role) {
  const lvl = schoolLvl(s), sides = [["off", schemePlaysAt(s.off, lvl), s.off], ["def", schemeCallsAt(s.def, lvl), s.def]];
  sides.forEach(([side, ids, style]) => {
    if (role && (role === "oc") !== (side === "off")) return;
    const mul = schemeSpeed(coach, side, style);
    ids.forEach(id => {
      const m = s.mastery, before = m[id] || 0;
      m[id] = Math.round(Math.min(100, before + pts * SCHEME_RATE * mul * ((focus || []).includes(id) ? SCHEME_FOCUS : 1) * (1 - before / 100)) * 100) / 100;
      if (rep && Math.round(m[id]) > Math.round(before)) rep.mastery.push([id, Math.round(before), Math.round(m[id])]);
    });
  });
}
// A season in a scheme counts for your coach: the side (or sides) you ran
function bumpSchemeYears(c, s, role) {
  if (!c || !s) return;
  c.sch = c.sch || { off: {}, def: {} };
  if (role !== "dc") c.sch.off[s.off] = (c.sch.off[s.off] || 0) + 1;
  if (role !== "oc") c.sch.def[s.def] = (c.sch.def[s.def] || 0) + 1;
}

/* ---------- Roster fit ---------- */
// Advice only: how well a roster suits each scheme, now and once this year's last-year players are
// gone. Each scheme leans on some units; its fit is how they compare with the team's own average.
const FIT_UNITS = {
  off: { bal: { qb: 1, rb: 1, wr: 1, runBlock: 1, passPro: 1 }, air: { qb: 2, wr: 2, passPro: 1.5, rb: .3, runBlock: .3 }, gnp: { rb: 2, runBlock: 2, qb: .5, wr: .3, passPro: .5 },
    wc: { qb: 2, wr: 1.5, rb: 1, passPro: 1, runBlock: .5 }, opt: { qbRun: 2.5, rb: 1.5, runBlock: 1.5, qb: .3, wr: .2 } },
  def: { bal: { runD: 1, passRush: 1, cover: 1 }, blz: { passRush: 2, lbSpd: 1.5, cover: .7 }, nfz: { cover: 2.5, passRush: .7, runD: .3 }, rs: { runD: 2.5, passRush: .7, cover: .3 } }
};
const SCHEME_FIT_WORDS = [[2.5, "great"], [0, "good"], [-2.5, "fair"], [-99, "poor"]];
function fitUnits(team) {
  const u = unitRatings(team), o = lineupFor(team, "p11"), d = lineupFor(team, "base"), q = o.QB[0];
  u.qbRun = q ? Math.round(q.r.spd * .45 + q.r.elu * .35 + q.r.bsc * .2) : 0;
  u.lbSpd = Math.round(unitAvg(d.LB, { spd: .5, tkl: .3, prs: .2 }));
  return u;
}
function rosterFit(team) {
  const u = fitUnits(team), out = { off: {}, def: {} };
  ["off", "def"].forEach(side => {
    const sc = {}, ids = Object.keys(FIT_UNITS[side]);
    ids.forEach(id => { const w = FIT_UNITS[side][id]; let n = 0, t = 0; for (const k in w) { t += w[k] * (u[k] || 0); n += w[k]; } sc[id] = t / n; });
    const mean = avg(ids.map(id => sc[id]));
    ids.forEach(id => { const x = sc[id] - mean; out[side][id] = SCHEME_FIT_WORDS.find(([at]) => x >= at)[1]; });
  });
  return out;
}
// The same roster without the players in their last year (in the pros: 32 and older)
function nextYearTeam(s) {
  const pro = isPro(s.cls), stays = p => pro ? (p.age || 25) < 32 : p.yr < finalYear(s);
  const t = Object.assign({}, s, { players: s.players.filter(stays) });
  t.depth = autoDepth(t);
  return t;
}

/* ---------- Moving up ---------- */
// The Option isn't run in the pros: a coach who ran it brings Balanced for now and picks his offense
// when he gets there (your coach gets a note on the season screen)
function proOffense(c, s) {
  if (!s || !isPro(s.cls) || !c || c.off_style !== "opt") return;
  c.off_style = "bal";
  if (typeof CAREER !== "undefined" && CAREER && c === CAREER.coach) CAREER.optNote = true;
}
// A new job is a decision: bring your schemes and install them, or keep the ones the players know.
// (side: "offense" or "defense" for a coordinator's job, both for a head coach's)
function schemeTakeText(sum, c, side) {
  if (!sum || !c) return "";
  const one = sd => {
    const mine = sd === "off" ? c.off_style : c.def_style, his = sum[sd], book = sd === "off" ? OFF_STYLES : DEF_STYLES, w = sd === "off" ? "offense" : "defense";
    if (!book[mine] || !book[his]) return "";
    if (mine === his) return `He ran your ${book[mine].name} ${w}, so its own plays are already installed.`;
    return `The players know the ${book[his].name} ${w}'s own plays; yours would start new. You can bring yours or keep his.`;
  };
  return (side === "offense" ? ["off"] : side === "defense" ? ["def"] : ["off", "def"]).map(one).filter(Boolean).join(" ");
}
