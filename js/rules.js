// Friday to Sunday: rules by level
// Every rule that differs between high school, college and the pros lives here, and the engine reads
// it from the profile of the level being played (see "Rules by level" in DESIGN.md).
//
// High school follows the national high school rules (NFHS). Where states differ, the fictional
// state uses the most common choice. College (NCAA) came with Milestone 4 and the pros (NFL) with
// Milestone 5, each checked against that year's rulebook.
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
    // A fair catch can be followed by a free kick at the goal from the spot
    fck: true,
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
  // College (NCAA), checked against current sources in November 2026 (DESIGN.md: Rules by level)
  col: {
    id: "col", name: "College", book: "NCAA",
    qLen: 900,                 // 15-minute quarters
    timeouts: 3,
    // The two-minute timeout in each half (since 2024), timed like the NFL's two-minute warning
    twoMinWarning: true,
    // Out of bounds: the clock starts again on the ready, except in the last two minutes of each half
    oob: "late2",
    // A first down stops the clock only in the last two minutes of each half (since 2023)
    fdStop: "late",
    penClock: "ready",
    runoff: { run: [28, 36], ready: [16, 24], nh: [13, 18], oob: [15, 22] },
    // Kickoffs from the 35, touchbacks at the 25, and a fair catch inside the 25 counts as a touchback
    kickoff: { spot: 35, tb: 25, oobAt: 35, dynamic: false, fcTb: true },
    kickDeadInEndZone: false,
    puntTb: 20, fgAdd: 17,
    // A miss goes to the defense at the line of scrimmage, or the 20
    missedFg: "prev",
    // No kicking tees on field goals and extra points: kicks a little less sure
    tees: false, teeK: .97, kickSure: .09,
    // Tries from the 3. The defense can return one for two points.
    tryXp: 97, tryTwo: 97, defTryScore: true,
    onside: { declared: false, expected: .2, surprise: .4 },
    untimed: "def",
    runClock: null,
    safetyKick: 20,
    // A fair catch can be followed by a free kick at the goal from the spot (new in 2026)
    fck: true,
    // Overtime: possessions from the 25, two-point tries required in the second, two-point plays from the third
    ot: { kind: "ncaa", spot: 75, tos: 1 },
    pen: {
      fs: { name: "False start", on: "off", yds: 5, pre: true },
      dg: { name: "Delay of game", on: "off", yds: 5, pre: true },
      enc: { name: "Offside", on: "def", yds: 5, pre: true },
      oh: { name: "Holding", on: "off", yds: 10 },
      dh: { name: "Defensive holding", on: "def", yds: 10, auto: true },
      // A spot foul, up to 15 yards, and an automatic first down
      dpi: { name: "Pass interference", on: "def", spot: true, max: 15, auto: true },
      // 10 yards (down from 15 in 2026)
      opi: { name: "Offensive pass interference", on: "off", yds: 10 },
      rtp: { name: "Roughing the passer", on: "def", yds: 15, auto: true },
      fm: { name: "Face mask", on: "def", yds: 15, auto: true },
      idf: { name: "Ineligible man downfield", on: "off", yds: 5 }
    },
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
    // Tries: kicks snapped from the 15 and two-point tries from the 2. The defense can return a try
    // for two points (since 2015).
    tryXp: 85, tryTwo: 98, defTryScore: true,
    // Onside kicks have to be declared, and any team can declare one at any time (since 2026)
    onside: { declared: true, expected: 1 / 15, surprise: 1 / 15, anyTime: true },
    untimed: "def",
    runClock: null,
    safetyKick: 20,
    // Overtime: the playoffs as Gridiron Duel plays them (15-minute periods until someone wins). In
    // the regular season, one 10-minute period with two timeouts each, and a tie if nobody wins it.
    ot: { kind: "nfl", tos: 3, regLen: 600, regTos: 2 },
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
