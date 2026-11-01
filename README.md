# Friday to Sunday

A single-player football coaching career. Start as the head coach of a tiny high school, call every play, run practice, build the program, and climb to bigger schools, college and the pros. Built on the [Gridiron Duel](https://github.com/christopherabel3000-creator/football-call-sheet) engine, and screen reader accessible from the start.

## Status

Milestones 1 and 2 are built (see [DESIGN.md](DESIGN.md)): create your coach, take over a made-up 1A school, and coach it season after season. Each season opens with three weeks of preseason camp, then a full schedule to the state championship under high school rules, with weekly practice, a playbook your team has to learn, scouting reports, players who grow, tire and get hurt, a depth chart you can change, and a season summary at the end. In the offseason you plan the summer, talk athletes into coming out for football and spend your coach's XP; your seniors graduate and a new class of freshmen comes out. Saves move between devices with a save code, or with a cloud save once the database rules are published (see Cloud saves below). An exhibition game is on the main menu too.

## What's in it so far

- A career: name your coach, pick a background (former quarterback, former lineman, defensive mind, special teams ace, or teacher and motivator) and your offensive and defensive schemes. Every new head coach starts at 40 in each rating, plus what the background brings, and some backgrounds grow a unit faster or give the run game an edge.
- Your coach's ratings matter in the games you call: Offense and Defense on every snap, Special teams on kicks and coverage, Motivation late in close games and comebacks, Game management's fourth-down odds on the call sheet, Scouting's fuller reports and spotting disguised looks, and Development in practice. Your coach's page explains each one, lets you rename your coach, and lists every season you've finished.
- Picking a school: each one says what its last coach ran and how much of your playbook it already knows. You bring your schemes; the team learns them in practice.
- The season summary: your record and finish against where your talent ranked, how the season ended, the games to remember, your leaders and your most improved players.
- More seasons: after the summary comes the offseason. Your seniors graduate; the next season brings summer growth, a few players leaving, and a new class of freshmen sized by your school's enrollment and tradition. A report shows how the team changed. Tradition follows results, and the rest of the state moves on with you: every school graduates its seniors and brings in a class, kept on paper and rebuilt exactly for any year from its seed.
- Preseason camp: three weeks of practice before week 1, every season. Opponent prep time goes into install, so a new coach can start teaching their plays. Hold each week's practice, or sim the rest of camp and read one report for all of it.
- Career stats for your players, and the state champions by year.
- The offseason program: plan the summer (weights, 7-on-7, youth camp, hallway recruiting and study hall), and pitch athletes from other sports, and kids who don't play anything, to come out for football. A new coach rating, Program building, brings more freshmen, more players at summer workouts and more yeses.
- Grades and eligibility: report cards after weeks 4 and 8 can rule a player with poor grades ineligible for two games, and study hall helps.
- Coach XP: earned for wins, upsets, playoff runs and titles, the snaps your calls win, and players getting better. Spend it on your coach's page: rating points (the rating minus 20 in XP) and twelve perks, from faster growth for a unit to an edge on your style's best plays, fuller scouting reports, spotting disguises, trick plays, motivation and quicker installs.
- Saves: the game saves on the device after every tap. Copy a save code (the whole game as text, compressed), save it as a file, or save to the cloud and get a 12-character cloud save code to load the game on another device. Loading a save keeps the game it replaced as a backup.
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
- Three ways to punt: a regular punt, Pin it deep (a high, short kick aimed to drop inside the 10, where your punter's accuracy decides how close he gets; overkick it and it's a touchback) or Boom it (about 6 yards longer and it rolls, but it outkicks the coverage, so big returns and return touchdowns are likelier). Computer coaches pin you from around midfield and boom it when they're backed up deep, more often with better Game management.
- Injuries in games and in practice: a player may be out for the rest of a game or for weeks, the next player on the depth chart steps in, and rosters say who's hurt and for how long.
- Two generated small-town schools, each with about 30 players, a coach with ratings, an offensive and defensive scheme, and a depth chart that sets itself from the ratings. Most starters play both ways.
- Every player is rated 1 to 100 in speed, strength, awareness and the skills for each position, with an overall rating at every position. Small-school starters mostly rate in the 30s to 50s.
- The ratings drive every snap, on top of Gridiron Duel's play-call matchups: the line against the front, protection against the pass rush, passer and receiver against the coverage, ball carrier against the tacklers. A quick quarterback escapes some sacks and scrambles. A kicker's leg sets his range.
- Ratings also set the level of play: about 50% completions, more runs than passes, shaky kickers, more fumbles and penalties than the pros.
- High school (NFHS) rules: 12-minute quarters, no two-minute warning, the clock stopping for first downs all game and for out of bounds in the last two minutes of each half, kickoffs from the 40 with touchbacks at the 20, missed field goals treated like punts, tries from the 3, 15-yard pass interference with no automatic first down, encroachment, untimed downs, and the running clock at 35 points in the second half.
- High school overtime: no clock, a series for each team from the 10, the defense can't score, and the first choice alternates each period.
- Play results name the players. Box score, player stats, game leaders, the halftime scouting report and the play-by-play.
- In an exhibition: coach the home team or the visitors, pick your schemes, or just watch. Sim to the end at any point.
- Roster and depth chart screens, and a screen for every player with all of his ratings.
- Change the depth chart: pick a position, pick a player, then start him, move him up or down, or take him off. Before a game, changes apply to every game or to the next game only. During a game, Change the lineup makes substitutions that last for that game.
- Fatigue: every snap costs energy and the bench gives it back, so two-way starters wear down the most and a tired player plays below his ratings. A rotation setting (Keep starters in, Normal, Rotate often) sits tired starters when a fresh backup is listed behind them, and the call sheet says who came out.
- Pocket passers and dual-threat quarterbacks, so starting a scrambler against a blitzing defense is a real choice.
- Saves on the device after every tap: your career, the season and the game in progress together.
- Screen reader support carried over from Gridiron Duel: each new screen moves VoiceOver to its heading or the play result, and the scoreboard and field read as plain sentences.

## Playing it

Play it at [christopherabel3000-creator.github.io/Friday-to-Sunday](https://christopherabel3000-creator.github.io/Friday-to-Sunday/). GitHub Pages publishes `main` on every push (`.nojekyll` keeps the files served as they are). To run it yourself, open `index.html` from any web server. The game is plain HTML, CSS and JavaScript with no build step.

## Cloud saves

Cloud saves use the Firebase Realtime Database project shared with [Gridiron Duel](https://github.com/christopherabel3000-creator/football-call-sheet), [Hidden Ranks](https://github.com/christopherabel3000-creator/Hidden-Ranks) and [Shardkin: Eight Realms](https://github.com/christopherabel3000-creator/Shardkin-Eight-Realms) (call-sheet-football), under `fridayToSundaySaves/<KEY>`. Gridiron Duel's anonymous play counts live under `gridironStats` in the same file. The Firebase library loads only when a cloud save is first used. Save codes and files don't need it.

The rules are in `database.rules.json`, with a section for each game, and the other three repos have identical copies. To switch cloud saves on, paste the whole file into the Firebase console: Realtime Database, then Rules, then Publish. Keep the four copies the same, or the other games will stop working online. Until the rules are published, the game says cloud saves aren't switched on yet.

The rules only accept well-formed saves, require every save to be exactly one version newer than the last (so a save can't be rewound or wiped), and never allow deleting one. Nobody can list the saves; a save can only be read with its 12-character code.

## Code

The scripts in `js/` load in order from `index.html` and share their top-level names, so each name must be unique across files and must not match anything browsers already put on the window (`tests/lint.js` checks).

- `util.js`: helpers and the seeded random numbers that rebuild a world from a seed
- `data.js`: names, towns, mascots and colors
- `rules.js`: the rules for each level (high school now, college and the pros later)
- `players.js`: ratings, positions, overall ratings, player generation, and how a player reads aloud
- `team.js`: schools, depth charts, who's on the field for each package, unit ratings
- `coach.js`: coach ratings, how they turn into the computer's play calling, and the backgrounds for your coach
- `fatigue.js`: energy, how it runs down and comes back, rotation, and injuries in games
- `engine.js`: Gridiron Duel's game flow, clock, overtime, coin toss and audibles
- `sim.js`: the snap, rolled from the players on the field, plus penalties, kicking and tries
- `ai.js`: scouting, the computer coordinator, and simming a game
- `practice.js`: the practice plan, player growth, installs, conditioning, recovery, practice injuries, and film study
- `season.js`: the state's schools, the schedule, standings, the playoffs, quick sims and the news
- `career.js`: your career's coach, the seasons you've finished, and the season summary
- `years.js`: the passing of years: graduation, summer growth, freshman classes, tradition, and schools on paper rebuilt for any year
- `program.js`: the offseason program: the summer, hallway recruiting, and grades and eligibility
- `cloud.js`: save codes, cloud saves and backups
- `sound.js`: crowd and horn, synthesized in the browser
- `ui_game.js`, `ui_depth.js`, `ui_practice.js`, `ui_season.js`, `ui_career.js`, `ui_offseason.js` and `ui.js`: the screens (the game; rosters and the depth chart; practice and scouting reports; the season and camp; creating your coach, your coach's page, the season summary and saves; the offseason, hallway recruiting and how the team changed; the main menu, the exhibition, help and screen reader support)

## Tests

`npm install` once (for jsdom and acorn), then `npm test`, or run one at a time:

- `node tests/lint.js`: top-level names are unique and safe
- `node tests/rules.js`: high school rules, rosters, depth charts, fatigue and rotation, the three punts, checked against the real engine
- `node tests/practice.js`: playbook mastery in the snap, the computer's calls, a season of growth against potential, installs, contact and recovery, injuries in games and practice, film study and the prep edge
- `node tests/season.js`: the state, the schedule, standings and tiebreakers (clinching checked against every possible finish), the bracket, quick sims against the full engine, your games, whole simmed seasons, and saves mid-season
- `node tests/career.js`: creating a coach, what each rating does, taking a job with your schemes, faster growth from a background, the season summary, save codes, cloud saves against a stand-in for the database, and saves from before careers
- `node tests/program.js`: Program building, the summer, hallway recruiting, grades and report cards, and saves from before the offseason program
- `node tests/years.js`: preseason camp, schools on paper rebuilt for any year, graduation, freshmen, career stats, tradition, a state that stays at the same level for five years, and saves from before more seasons
- `node tests/dom.js`: the page in a simulated browser, played by tapping: an exhibition game, depth chart changes and substitutions, and a career from creating your coach through camp and a season to the summary, the offseason and the next season's camp, with practice, installs and scouting reports, focus checks, reloads, save codes and cloud saves on two devices
- `node tests/balance.js 300`: plays 300 computer games and prints the numbers to tune against
