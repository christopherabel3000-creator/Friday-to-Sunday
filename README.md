# Friday to Sunday

A single-player football coaching career. Start as the head coach of a tiny high school, call every play, run practice, build the program, and climb to bigger schools, college and the pros. Built on the [Gridiron Duel](https://github.com/christopherabel3000-creator/football-call-sheet) engine, and screen reader accessible from the start.

## Status

Building Milestone 1, one high school season (see [DESIGN.md](DESIGN.md)). Step 1 is playable: an exhibition game between two made-up 1A schools, under high school rules, with every player rated.

## What's in it so far

- Two generated small-town schools, each with about 30 players, a coach with ratings, an offensive and defensive scheme, and a depth chart that sets itself from the ratings. Most starters play both ways.
- Every player is rated 1 to 100 in speed, strength, awareness and the skills for each position, with an overall rating at every position. Small-school starters mostly rate in the 30s to 50s.
- The ratings drive every snap, on top of Gridiron Duel's play-call matchups: the line against the front, protection against the pass rush, passer and receiver against the coverage, ball carrier against the tacklers. A quick quarterback escapes some sacks and scrambles. A kicker's leg sets his range.
- Ratings also set the level of play: about 50% completions, more runs than passes, shaky kickers, more fumbles and penalties than the pros.
- High school (NFHS) rules: 12-minute quarters, no two-minute warning, the clock stopping for first downs and out of bounds all game, kickoffs from the 40 with touchbacks at the 20, missed field goals treated like punts, tries from the 3, 15-yard pass interference with no automatic first down, encroachment, untimed downs, and the running clock at 35 points in the second half.
- High school overtime: no clock, a series for each team from the 10, the defense can't score, and the first choice alternates each period.
- Play results name the players. Box score, player stats, game leaders, the halftime scouting report and the play-by-play.
- Coach the home team or the visitors, pick your schemes, or just watch. Sim to the end at any point.
- Roster and depth chart screens, and a screen for every player with all of his ratings.
- Saves on the device after every tap.
- Screen reader support carried over from Gridiron Duel: each new screen moves VoiceOver to its heading or the play result, and the scoreboard and field read as plain sentences.

## Playing it

Open `index.html` from a web server (GitHub Pages works). The game is plain HTML, CSS and JavaScript with no build step.

## Code

The scripts in `js/` load in order from `index.html` and share their top-level names, so each name must be unique across files and must not match anything browsers already put on the window (`tests/lint.js` checks).

- `util.js`: helpers and the seeded random numbers that rebuild a world from a seed
- `data.js`: names, towns, mascots and colors
- `rules.js`: the rules for each level (high school now, college and the pros later)
- `players.js`: ratings, positions, overall ratings, player generation, and how a player reads aloud
- `team.js`: schools, depth charts, who's on the field for each package, unit ratings
- `coach.js`: coach ratings, and how they turn into the computer's play calling
- `engine.js`: Gridiron Duel's game flow, clock, overtime, coin toss and audibles
- `sim.js`: the snap, rolled from the players on the field, plus penalties, kicking and tries
- `ai.js`: scouting and the computer coordinator
- `sound.js`: crowd and horn, synthesized in the browser
- `ui_game.js` and `ui.js`: the screens

## Tests

`npm install` once (for jsdom and acorn), then `npm test`, or run one at a time:

- `node tests/lint.js`: top-level names are unique and safe
- `node tests/rules.js`: high school rules, rosters and depth charts, checked against the real engine
- `node tests/dom.js`: the page in a simulated browser, played by tapping, with focus checks and a reload
- `node tests/balance.js 300`: plays 300 computer games and prints the numbers to tune against
