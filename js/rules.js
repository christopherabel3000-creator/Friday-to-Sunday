// Friday to Sunday: rules by level
// Every rule that differs between high school, college and the pros lives here, and the engine reads
// it from the profile of the level being played (see "Rules by level" in DESIGN.md).
//
// High school follows the national high school rules (NFHS). Where states differ, the fictional
// state uses the most common choice. College (NCAA) arrives with Milestone 4 and gets checked
// against the current rulebook then. The pros profile is Gridiron Duel's NFL rules, kept so the
// engine stays general; it gets the rest of the NFL's rules with Milestone 5.
"use strict";

const RULES = {
  hs: {
    id: "hs", name: "High school", book: "NFHS",
    qLen: 720,                 // 12-minute quarters
    timeouts: 3,               // per half
    twoMinWarning: false,
    // Out of bounds stops the clock until the snap only in the last two minutes of each half.
    // Earlier, the clock starts again when the ball is ready for play. (A house rule: real NFHS
    // stops it until the snap all game, which let rushing totals run away.)
    oob: "late2",
    // A first down stops the clock until the ball is ready for play
    fdStop: "always",
    // After an accepted penalty the clock starts when the ball is ready. In the last two minutes of
    // either half, the fouled team can make it wait for the snap.
    penClock: "ready",
    // Seconds that run between plays: clock running, starting on the ready, and no huddle
    runoff: { run: [26, 34], ready: [16, 24], nh: [13, 18], oob: [15, 22] },
    kickoff: { spot: 40, tb: 20, oobAt: 35, dynamic: false },
    // Any kick that crosses the goal line is dead right away: a touchback, never a return
    kickDeadInEndZone: true,
    puntTb: 20,
    // Field goal distance: yards to the goal line, plus 10 for the end zone and 7 for the hold
    fgAdd: 17,
    // A missed field goal is treated like a punt
    missedFg: "punt",
    tees: true,
    // Tries are snapped from the 3, kick or run. The defense can't score on a try.
    tryXp: 97, tryTwo: 97, defTryScore: false,
    // Onside kicks don't have to be announced. Late and trailing, the other team expects one.
    onside: { declared: false, expected: .2, surprise: .42 },
    // A period can't end on an accepted live-ball foul by either team: one untimed down
    untimed: "any",
    // A lead of 35 or more in the second half starts a running clock for the rest of the game
    runClock: { margin: 35 },
    // Free kick after a safety, from the 20
    safetyKick: 20,
    // Overtime: no clock. Each team gets a series from the 10, one timeout per period.
    ot: { kind: "hs", spot: 90, tos: 1 },
    pen: {
      fs: { name: "False start", on: "off", yds: 5, pre: true },
      dg: { name: "Delay of game", on: "off", yds: 5, pre: true },
      enc: { name: "Encroachment", on: "def", yds: 5, pre: true },
      oh: { name: "Holding", on: "off", yds: 10 },
      dh: { name: "Defensive holding", on: "def", yds: 10 },
      dpi: { name: "Pass interference", on: "def", yds: 15 },
      opi: { name: "Offensive pass interference", on: "off", yds: 15 },
      rtp: { name: "Roughing the passer", on: "def", yds: 15, auto: true },
      fm: { name: "Face mask", on: "def", yds: 15 },
      idf: { name: "Ineligible man downfield", on: "off", yds: 5 }
    },
    // Defensive fouls during a run that ends past the line are enforced from the end of the run
    endOfRun: true
  },
  pro: {
    id: "pro", name: "Pros", book: "NFL",
    qLen: 900, timeouts: 3, twoMinWarning: true,
    // Out of bounds stops the clock until the snap only late in each half
    oob: "late",
    fdStop: "never",
    penClock: "oob",
    runoff: { run: [30, 38], ready: [15, 22], nh: [15, 20], oob: [15, 22] },
    // The dynamic kickoff: touchbacks at the 35, a kick short of the landing zone gives the ball at the 40
    kickoff: { spot: 35, tb: 35, oobAt: 40, dynamic: true },
    kickDeadInEndZone: false,
    puntTb: 20, fgAdd: 18, missedFg: "spot", tees: false,
    tryXp: 85, tryTwo: 98, defTryScore: false,
    onside: { declared: true, expected: 1 / 15, surprise: 1 / 15 },
    untimed: "def",
    runClock: null,
    safetyKick: 20,
    ot: { kind: "nfl", tos: 3 },
    pen: {
      fs: { name: "False start", on: "off", yds: 5, pre: true },
      dg: { name: "Delay of game", on: "off", yds: 5, pre: true },
      os: { name: "Offside", on: "def", yds: 5 },
      oh: { name: "Holding", on: "off", yds: 10 },
      dh: { name: "Defensive holding", on: "def", yds: 5, auto: true },
      dpi: { name: "Pass interference", on: "def", spot: true, auto: true },
      opi: { name: "Offensive pass interference", on: "off", yds: 10 },
      rtp: { name: "Roughing the passer", on: "def", yds: 15, auto: true },
      fm: { name: "Face mask", on: "def", yds: 15, auto: true },
      idf: { name: "Ineligible man downfield", on: "off", yds: 5 }
    },
    endOfRun: false
  }
};
