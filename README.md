# Friday to Sunday

A single-player football coaching career. Start as the head coach of a tiny high school, call every play, run practice, build the program, and climb to bigger schools, college and the pros. Built on the [Gridiron Duel](https://github.com/christopherabel3000-creator/football-call-sheet) engine, and screen reader accessible from the start.

## Status

Building Milestone 1, one high school season (see [DESIGN.md](DESIGN.md)). Steps 1 to 4 are playable: a full season at a made-up 1A school, from picking your school to the state championship, under high school rules, with weekly practice, a playbook your team has to learn, scouting reports, players who grow, tire and get hurt, and a depth chart you can change. An exhibition game is on the main menu too.

## What's in it so far

- A season: pick one of the eight schools in your district and take over as head coach. Three non-district games, then seven district games, then the state playoffs for the top two in each district, down to a state champion.
- Each week: a preview of your opponent (record, ratings, coach and schemes, the unit-by-unit matchup, and who's favored on paper), your schemes, then play the game snap by snap or sim it.
- After each week: your result, your district's scores and standings, a few lines of news (upsets, overtime games, unbeaten teams, who clinched what), and every score around the state.
- Standings for all eight districts, with real tiebreakers (head-to-head, overall record, then point differential), your schedule with every result, season stats for your players, and the playoff bracket.
- Games between schools in your district are played out on the full game engine behind the scenes. The rest of the state is simmed from team ratings, fit so those scores look like the engine's.
- Sim to the playoffs or to the end of the season, a week at a time.
- Practice: ten blocks a week shared out over fundamentals for each unit, installing plays, opponent prep, conditioning and recovery, with presets and a contact level (shorts, shells or full pads). The practice report lists who got better, who got hurt, and the plays your team learned.
- Players grow from practice, faster when they're young, hard-working and getting time, and never past their potential.
- A playbook your team has to learn: every play has a mastery from 0 to 100, shown on the call sheet. Known plays are an edge; new ones cost edge and draw flags and fumbles. Pick up to three plays to install each week. The computer calls what its team knows, too.
- Scouting reports from film study: the opponent's habits in short, medium and long yardage, their favorite calls, what beats them, players to watch, and where to attack. Your team gets a small edge when they run a call you studied, and every coach you face has watched your film.
- Injuries in games and in practice: a player may be out for the rest of a game or for weeks, the next player on the depth chart steps in, and rosters say who's hurt and for how long.
- Two generated small-town schools, each with about 30 players, a coach with ratings, an offensive and defensive scheme, and a depth chart that sets itself from the ratings. Most starters play both ways.
- Every player is rated 1 to 100 in speed, strength, awareness and the skills for each position, with an overall rating at every position. Small-school starters mostly rate in the 30s to 50s.
- The ratings drive every snap, on top of Gridiron Duel's play-call matchups: the line against the front, protection against the pass rush, passer and receiver against the coverage, ball carrier against the tacklers. A quick quarterback escapes some sacks and scrambles. A kicker's leg sets his range.
- Ratings also set the level of play: about 50% completions, more runs than passes, shaky kickers, more fumbles and penalties than the pros.
- High school (NFHS) rules: 12-minute quarters, no two-minute warning, the clock stopping for first downs and out of bounds all game, kickoffs from the 40 with touchbacks at the 20, missed field goals treated like punts, tries from the 3, 15-yard pass interference with no automatic first down, encroachment, untimed downs, and the running clock at 35 points in the second half.
- High school overtime: no clock, a series for each team from the 10, the defense can't score, and the first choice alternates each period.
- Play results name the players. Box score, player stats, game leaders, the halftime scouting report and the play-by-play.
- In an exhibition: coach the home team or the visitors, pick your schemes, or just watch. Sim to the end at any point.
- Roster and depth chart screens, and a screen for every player with all of his ratings.
- Change the depth chart: pick a position, pick a player, then start him, move him up or down, or take him off. Before a game, changes apply to every game or to the next game only. During a game, Change the lineup makes substitutions that last for that game.
- Fatigue: every snap costs energy and the bench gives it back, so two-way starters wear down the most and a tired player plays below his ratings. A rotation setting (Keep starters in, Normal, Rotate often) sits tired starters when a fresh backup is listed behind them, and the call sheet says who came out.
- Pocket passers and dual-threat quarterbacks, so starting a scrambler against a blitzing defense is a real choice.
- Saves on the device after every tap, the season and the game in progress together.
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
- `fatigue.js`: energy, how it runs down and comes back, rotation, and injuries in games
- `engine.js`: Gridiron Duel's game flow, clock, overtime, coin toss and audibles
- `sim.js`: the snap, rolled from the players on the field, plus penalties, kicking and tries
- `ai.js`: scouting, the computer coordinator, and simming a game
- `practice.js`: the practice plan, player growth, installs, conditioning, recovery, practice injuries, and film study
- `season.js`: the state's schools, the schedule, standings, the playoffs, quick sims and the news
- `sound.js`: crowd and horn, synthesized in the browser
- `ui_game.js`, `ui_depth.js`, `ui_practice.js`, `ui_season.js` and `ui.js`: the screens (the game; rosters and the depth chart; practice and scouting reports; the season; the main menu, the exhibition, help and screen reader support)

## Tests

`npm install` once (for jsdom and acorn), then `npm test`, or run one at a time:

- `node tests/lint.js`: top-level names are unique and safe
- `node tests/rules.js`: high school rules, rosters, depth charts, fatigue and rotation, checked against the real engine
- `node tests/practice.js`: playbook mastery in the snap, the computer's calls, a season of growth against potential, installs, contact and recovery, injuries in games and practice, film study and the prep edge
- `node tests/season.js`: the state, the schedule, standings and tiebreakers (clinching checked against every possible finish), the bracket, quick sims against the full engine, your games, whole simmed seasons, and saves mid-season
- `node tests/dom.js`: the page in a simulated browser, played by tapping: an exhibition game, depth chart changes and substitutions, and a season from picking a school to the state champion, with practice, installs and scouting reports, focus checks and reloads
- `node tests/balance.js 300`: plays 300 computer games and prints the numbers to tune against
