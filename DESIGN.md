# Friday to Sunday: design

Status: planning. No code yet. The first playable version is one full high school season (Milestone 1 below).

## The pitch

You're a first-time head coach at a tiny high school with a losing tradition. You call every play with the same engine as Gridiron Duel, run the week's practice, and build the program. Win, and offers come in each offseason: bigger high schools, then college, and one day the pros. Friday nights to Sunday afternoons.

## Pillars

- **The call is the heart of the game.** Talent tilts every snap, but the play call still decides a lot of them. A well-coached underdog can win.
- **A career you build.** Players grow and graduate, your coach gets better, and your reputation follows you from job to job.
- **Management without busywork.** Plans stay in place until you change them, and reports only say what changed.
- **Screen reader first.** Everything works with VoiceOver on iPhone and with a screen reader on a computer.
- **A made-up world.** Fictional schools, conferences and pro league. Real NFL and college names and logos are trademarks.

## The career at a glance

- Levels: high school (classes 1A to 7A, by enrollment), college (three tiers of programs), and the pros.
- Talent arrives differently at each level: turnout in high school, recruiting and NIL in college, and the draft in the pros.
- Game rules follow the level: 12-minute quarters in high school and 15-minute quarters in college and the pros, with each level's real overtime (see Overtime by level).
- Each year runs through the offseason, summer, the regular season and the postseason.
- You move up through job offers. They come only in the offseason and depend on your reputation compared to what each school expects. Losing can put you on the hot seat.
- Later, a second path: coordinator jobs, where you call one side of the ball.

## Difficulty

The game starts with one difficulty level, Normal. Other levels come later. They adjust the strength of your team and your opponents, and how fast you earn XP.

## Milestone 1: one high school season

In this milestone:

- Start a career: name your coach, pick a background and a scheme, and take over a small 1A school.
- A roster of about 30 players with ratings, many of them playing both ways.
- A depth chart that can set itself, changes for a single game, and substitutions during a game.
- A fictional district of 8 schools plus 3 non-district games, for a 10-game schedule.
- Each week, set practice, then play every snap or sim the game.
- High school rules throughout, including 12-minute quarters, high school clock rules and high school overtime (see Rules by level).
- One difficulty level, Normal.
- Ratings drive the simulation. Play results name your players, and every player's stats are kept.
- Playbook installs and mastery, opponent prep and scouting reports, fatigue and injuries.
- District standings, a state playoff bracket for your class, and a champion.
- Saves on the device, a cloud save code, and export and import.
- A season summary at the end.

Not in this milestone: graduation and more seasons, program activities that bring in players, coach XP and perks, boosters and budgets, job offers, college, the pros, and the coordinator path.

Milestone 1 is done when:

- You can play a full season and the playoffs at a 1A school, snap by snap or simmed.
- Ratings visibly matter: the better team usually wins, but good calls swing close games.
- A save survives closing the page, and moves to another device with the cloud code.
- Every screen works with VoiceOver, on iPhone and on a computer.

## The world

- A fictional state with seven classes, from 1A (the smallest schools) to 7A (the largest). Bigger schools have more students to draw players from.
- Each school has a town, a mascot, colors, a class, enrollment, tradition (past success, which sets expectations) and community support. Facilities and boosters come in Milestone 3.
- The Milestone 1 league is your 8-school district in class 1A, 3 non-district opponents, and a 16-team state playoff for the class. Games in your district run on the full engine behind the scenes. Other districts are simulated quickly from team ratings to fill the playoff bracket.
- Each new career generates its own world from a random seed, with fictional names throughout.

## Players

### Positions

QB, RB, WR, TE, OL, DL, LB, CB, S, K and P. A player has a main position and can have a second one. At small schools most starters play both ways. The fullback in 21 personnel is the second running back.

### Ratings

Every rating runs from 1 to 100 on one scale for all levels, so moving up feels real. Typical starters:

- Small high school: 20s to 50s
- Big high school: 30s to 60s, with a few stars in the 70s
- College: 40s to 80s
- Pros: 60s to 90s

Each player has:

- Speed, Strength and Awareness. Awareness is football sense: fewer penalties and blown assignments, and faster learning.
- Two skills for their position:
  - QB: Accuracy and Arm
  - RB: Elusiveness and Ball security
  - WR: Hands and Route running
  - TE: Hands and Blocking
  - OL: Run blocking and Pass blocking
  - DL: Pass rush and Run stopping
  - LB: Tackling and Coverage
  - CB and S: Coverage and Tackling
  - K and P: Leg and Accuracy
- An overall rating for the position, mixed from those.
- A class year (freshman to senior), potential, work ethic, stamina and health. Potential is shown as your staff's estimate (low, average, high or elite), and the true number stays hidden. Work ethic sets how fast a player grows.

Grades and eligibility arrive with the high school program features in Milestone 2.

### How a player reads aloud

Each player is one sentence a screen reader can get through in a breath, for example: "Marcus Hill, junior, running back and safety, overall 46. Fast, sure hands, high potential." The player's own screen lists every rating.

## Depth chart and personnel

- The depth chart lists the starters and backups at each position. It can set itself completely by overall rating, and you can move anyone.
- Changes can be permanent or for one game only. For example, start a scrambling quarterback against a defense that blitzes a lot, or a stronger passer against one that sits back in coverage. After that game, the depth chart goes back to how it was.
- You can substitute during a game: between plays, put a different player in at any position. A substitute stays in until you change it back, or until fatigue or injury moves the depth chart along.
- Gridiron Duel's personnel packages pull players from the depth chart: 10, 11, 12, 21, 13 and Jumbo on offense, and Base, Nickel, Dime and Goal Line on defense. A package that needs a weak fourth receiver or third corner plays weaker.
- Fatigue builds with every snap and recovers on the bench. Two-way players tire faster. Tired starters come out automatically when a backup is ready, based on a rotation setting.

## How ratings change a snap

Gridiron Duel rolls each snap from one edge number: the play-call matchup plus personnel fit, team style, disguise cost and the computer's execution. That edge shifts run yards, tackles for loss and big plays, and for passes the completion, interception and big-play odds. Friday to Sunday keeps all of that and adds talent.

1. **The call edge stays.** The matchup chart, personnel fit, styles and disguises work as they do now. New pieces join them: how well your team knows the play (mastery), and later your coach's specialties.
2. **Talent edges come from the players on the field,** one for each part of the play:
   - Run blocking: the offensive line and other blockers against the defensive line and linebackers. Shifts tackles for loss and run yards.
   - Ball carrier: elusiveness and speed against tackling. Shifts big runs and yards after contact. Ball security against the defense shifts fumbles.
   - Protection: pass blocking against the pass rush. Scales the sack rate. A fast quarterback escapes some sacks and scrambles for yards when a pass play breaks down, which is what makes a scrambler worth starting against a blitzing defense.
   - Throw and catch: the quarterback's accuracy and the receivers' routes and hands against coverage. Shifts completions and interceptions. The quarterback's arm limits deep throws.
   - Speed: receivers against defensive backs. Shifts big plays after the catch.

   The starting point is about 0.05 of edge per rating point of difference, capped at 2 either way for each part. It then gets tuned with simulated seasons, the same way Gridiron Duel was tuned.
3. **The level of play comes from the ratings themselves,** not just the differences. Two weak teams should look like small-school football, not a slow NFL game:
   - Completion and interception rates follow quarterback accuracy.
   - Fumbles follow ball security.
   - Penalties follow team awareness.
   - Field goal range and accuracy follow the kicker's leg and accuracy. A kicker with a 35 leg tops out around 40 yards.
   - Punt distance follows the punter's leg.

   Targets for a 1A game: more runs than passes, a completion rate around 50 percent, and few field goals beyond 35 yards.
4. **Results name the players.** Each play names the passer, ball carrier, target and tackler, and every player's stats are kept.
5. **Each team has its own coach.** Gridiron Duel's difficulty settings (scouting, adapting, audibles, disguises, how sharply it calls plays, and execution) become each coach's ratings, set per team instead of once per game.
6. **Rules follow the level, exactly.** Every rule that differs by level, from quarter length and clock stoppages to kickoffs, tries, penalties and overtime, follows that level's real rules (see Rules by level and Overtime by level).

## Coaches

### Ratings

Every coach is rated 1 to 100 in Offense, Defense, Special teams, Development, Motivation, Game management and Scouting. Program building and Recruiting are added with the milestones that use them. A first-year high school head coach starts mostly in the 30s and 40s.

### What the ratings do

When you call the plays:

- Offense and Defense give a small execution edge to that side, like Gridiron Duel's difficulty does now.
- Scouting makes opponent reports more detailed, and at high ratings sometimes flags a disguised look at the line.
- Game management shows more help on the call sheet, such as the odds of converting on 4th down.
- Motivation helps late in games and in comebacks.
- Development speeds up player growth from practice.

When you sim a game, and for every computer coach, the ratings decide how well the computer calls plays: its scouting, adapting, audibles, disguises and call sharpness.

### Starting a career

Name your coach, then pick a background that sets your starting ratings:

- Former quarterback: Offense, and faster quarterback growth
- Former lineman: the run game, and faster line growth
- Defensive mind: Defense
- Special teams ace: Special teams, and faster kicker growth
- Teacher and motivator: Motivation and Development

Then pick your scheme: one of Gridiron Duel's offensive styles and one of its defensive styles.

### XP and perks (Milestone 2)

You earn XP for good things: winning snaps (Gridiron Duel already judges who won each snap), wins, upsets, players improving, players earning college offers, and titles. Spend it on ratings or perks. Perk ideas:

- Offensive guru: an edge on your scheme's best plays
- Line whisperer: faster line growth and a run-blocking edge
- Quarterback whisperer and Receiver guru
- Defensive mastermind and Blitz specialist
- Film junkie: the opponent's tendencies shown during the game
- Disguise detector
- Trick play artist: unlocks trick plays
- Motivator
- Recruiter, for college

## Practice

- Each week has 10 practice blocks: five practice days, two blocks each. You give each area none, light, normal or heavy.
- The areas:
  - Fundamentals, by unit: quarterbacks, running backs and receivers, the offensive line, the defensive front, the secondary, and kickers. Grows those players' ratings.
  - Install: raises playbook mastery (see Playbook and mastery).
  - Opponent prep: a detailed report on this week's opponent and a small edge against their habits.
  - Conditioning: stamina, so players tire less.
  - Recovery: health, and fresh legs on game day.
- Contact level (shorts, shells or full pads) trades faster growth against injury risk.
- Your plan stays in place every week until you change it. Presets give a quick start: balanced, install-heavy, game prep and rest.
- The practice report lists only what changed: who improved, new injuries, and mastery gains.
- Growth depends on the player's potential and work ethic, your Development rating, and practice time. Nobody grows past their potential.

## Playbook and mastery

- The plays are Gridiron Duel's. On offense: Inside Run, Outside Zone, Draw, Screen, Quick Game, Mesh, Deep Shot and Play-Action, plus QB Sneak, Hail Mary and Tackle Eligible in their situations. On defense: Run Blitz, Base 4-3, Man Coverage, Cover 2 Zone, Cover 3, Prevent, All-Out Blitz and Zone Blitz.
- Your team has a mastery level from 0 to 100 for each play. A play it hasn't mastered costs edge and draws more penalties and fumbles. Install practice raises mastery.
- A small school starts with about four offensive plays and four defensive calls it knows well. The rest have to be installed.
- Kicks, kneel-downs and spikes are always available.
- From Milestone 2, mastery fades some each offseason as seniors graduate.
- New plays can join later, starting with designed quarterback runs, like a QB draw and a read option, and trick plays.

## Game day

- Play every snap or sim the game. A key-moments mode, which sims until the game is close and late, comes later.
- Gridiron Duel's systems carry over: the game clock, timeouts, spikes and sideline routes, audibles, disguises and penalties. Their rules follow the level being played (see Rules by level).
- You can change the lineup between plays (see Depth chart and personnel).
- The opposing coach is computer-controlled, with its own ratings and scheme.
- Scouting lasts all season. Opposing coaches chart your habits across games, and your opponent prep shows theirs.
- After the game: the final score, box score, player stats and a short summary.

## Rules by level

Friday to Sunday follows each level's real rules as exactly as the game can: the national high school rules (NFHS) for high school, NCAA rules for college, and NFL rules for the pros. Each level has its own rules profile, and the engine reads every rule that differs by level from it instead of having it built in.

Rules change most years, so each level's rules get checked against current sources before that level is built. Items marked "to confirm" haven't been checked yet.

High school rules vary a little from state to state. Where they differ, the fictional state uses the most common choice.

### High school (NFHS), for Milestone 1

- 12-minute quarters and three timeouts per half. There's no two-minute warning.
- The clock stops on an incomplete pass, a player going out of bounds, a change of possession, a score, a timeout, a fair catch and a touchback. In each case it starts again on the snap.
- The clock also stops when a team earns a first down, and starts again when the ball is ready for play.
- After an accepted penalty, the clock starts when the ball is ready for play. In the last two minutes of either half, the team that was fouled can make it wait for the snap instead.
- On a kickoff, the clock starts when the receiving team touches the ball.
- Kickoffs are from the 40. Touchbacks are at the 20.
- Any kick that crosses the goal line is dead right away, for a touchback. Nobody returns a kick out of the end zone.
- After a fair catch, the ball goes at the spot of the catch.
- A missed field goal is treated like a punt. If it goes into the end zone, it's a touchback at the 20. If not, it can be downed or returned.
- Kicking tees are allowed for field goals and extra points.
- Tries are snapped from the 3-yard line, so an extra-point kick is about 20 yards. The defense can't score on a try. If it gets the ball, the try is over.
- Defensive pass interference is 15 yards, with no automatic first down. Offensive pass interference is 15 yards from the previous spot, with no loss of down. Only roughing the passer, kicker, snapper or holder gives an automatic first down.
- Running clock: once a team leads by 35 or more in the second half, the clock keeps running, stopping only for scores, timeouts and injuries. It stays that way even if the lead shrinks, and it isn't used in state championship games. 35 points is the margin Indiana and Michigan use (Ohio uses 30).

### College (NCAA), for Milestone 4

- 15-minute quarters and three timeouts per half. A team can't call two timeouts in a row.
- A two-minute timeout in each half, like the NFL's two-minute warning (since 2024).
- The clock keeps running after a first down, except in the last two minutes of each half (since 2023).
- A penalty at the end of the first or third quarter carries over to the next quarter instead of giving an untimed down.
- Kickoffs are from the 35. Touchbacks are at the 25, and a fair catch inside the 25 on a kickoff counts as a touchback (since 2018).
- Tries are snapped from the 3-yard line, so an extra-point kick is about 20 yards. The defense can return a try for two points.
- No kicking tees for field goals and extra points.
- To confirm: timing after a player goes out of bounds, missed field goals, and pass interference.

### Pros (NFL), for Milestone 5

- 15-minute quarters, three timeouts per half, and the two-minute warning.
- Gridiron Duel's timing: going out of bounds stops the clock until the snap only in the last two minutes of the first half and the last five minutes of the second half.
- The dynamic kickoff: the ball is kicked from the 35. A kick into the end zone is a touchback at the 35. A kick that lands between the goal line and the 20 is live and has to be returned, and if it rolls into the end zone and is downed there, the touchback is at the 20. A kick that lands short of the 20 gives the receiving team the ball at its 40. Gridiron Duel already has the touchback at the 35 and the short-kick rule. The rest is new.
- Onside kicks: any team can declare one at any point in the game, whatever the score (since 2026). Before that, it was only a team that was behind: in the fourth quarter in 2024, and at any time in 2025.
- Extra-point kicks are snapped from the 15, about a 33-yard kick. Two-point tries are from the 2. The defense can return a try for two points.
- To confirm: the receiving team's kickoff alignment, which changed again in 2026, and pass interference.

## Overtime by level

Each level uses its real overtime rules. The details get checked against the current rulebooks when each level is built.

- **High school,** using the format the NFHS suggests. State associations can pick their own format (Missouri starts at the 25, and Texas uses college rules), but this one is the standard. There's no clock. Each team gets a series starting first and goal at the opponent's 10-yard line. If one team is ahead after both series, it wins. Otherwise another overtime is played, and the choice of who goes first alternates. The defense can't score, since a turnover ends the series. Each team gets one timeout per overtime, and nobody has to go for two.
- **College:** there's no clock. Each team gets a possession starting at the opponent's 25-yard line. In the second overtime, a team that scores a touchdown must go for two. From the third overtime on, teams trade two-point plays until one of them wins. Each team gets one timeout per overtime.
- **Pros, regular season:** one 10-minute period, timed like a fourth quarter: the late-game clock rules start at the five-minute mark, and there's a two-minute warning. Each team gets two timeouts. Both teams get the ball, unless the defense scores on the first possession or that possession runs out the clock. After that, the team ahead wins, and a tie goes to the next score. When time runs out, the team ahead wins, even in the middle of the second team's possession, and if it's tied, the game ends in a tie.
- **Pros, playoffs:** 15-minute periods until there's a winner, with both teams guaranteed the ball. If a period ends before the second team's guaranteed possession is over, play continues into the next period. The first two periods play like a half, then there's a new kickoff, and a new coin toss after four periods. Gridiron Duel's overtime works exactly this way, so it carries over as is.

## The season

- The calendar: preseason (meet your team, set the depth chart and practice), then weeks 1 to 10, then up to four playoff rounds, then the season summary.
- Each week ends with scores from around the league, the standings and a few lines of news. Only what changed is read aloud.
- District champions and the next-best finishers make the state playoffs.

## Later milestones

### Milestone 2: more seasons

Graduation, player growth over the offseason, incoming freshmen based on enrollment and turnout, and coach XP and perks. Program activities that bring in players: recruiting athletes from other sports in the hallways, youth camps, summer weights, 7-on-7 leagues, booster fundraisers, and academic help to keep players eligible.

### Milestone 3: the high school job market

Reputation against expectations, job offers from bigger high schools each offseason, contracts, the hot seat and getting fired, and boosters, budgets and facilities.

### Milestone 4: college

Recruiting high school prospects, NIL budgets that are bigger at bigger schools, roster limits, the transfer portal, conferences, bowls and a playoff, and three tiers of programs to climb. Leagues this big get a quicker way to simulate the games you aren't in.

### Milestone 5: the pros

A fictional pro league. Talent comes through the draft, with simplified contracts, a salary cap and free agency.

### Milestone 6: the coordinator path

Take a coordinator job and call one side of the ball while a computer head coach calls the other. That needs one engine change: a team that's half yours and half the computer's. Coordinators can move up to head coaching jobs or specialize.

## Saves

- A career is one save. It saves on the device after every snap and every menu choice, like Gridiron Duel.
- Up to three careers at once.
- A cloud save code, 12 characters long, restores the career on any device. It uses the shared Firebase project, with its own section in the shared rules file, the same way Shardkin's cloud saves work. That rules file has to stay the same in every repo that shares the project.
- Export and import a save as text.
- The reason for all three: iPhone Safari can wipe saved data for games inside itch.io's frame, and a career is too much to lose.
- Saves stay small. Your team is saved in full detail, and everyone else as summaries plus the seeds to rebuild them.
- Each save records the game's version, and older saves are upgraded when they load.

## Accessibility

- Each new screen moves VoiceOver to its heading, as in Gridiron Duel.
- Scoreboards, standings and ratings read as plain sentences.
- Choices are buttons and button groups. No sliders and no drag and drop.
- Rosters are lists grouped under position headings. Tables appear only where columns help, like box scores and standings, with clear headers.
- Changes in place are announced once, briefly. No repeated instructions.

## Technical plan

- Plain HTML, CSS and JavaScript with no build step, like Gridiron Duel, but split into several files loaded in order:
  - engine.js: the snap simulation, copied from Gridiron Duel with its sections marked, so a fix can be copied between the two games. Rating hooks go in clearly marked places.
  - ai.js: the computer coordinator, driven by coach ratings.
  - players.js: player generation, ratings, growth, fatigue and injuries.
  - team.js: rosters, depth charts, and unit ratings for each package.
  - season.js: the league, schedule, standings, playoffs, and simulating other games.
  - practice.js: practice plans, growth and mastery.
  - coach.js: coach ratings, and later XP and perks.
  - save.js: device saves, cloud saves, and export and import.
  - rules.js: one rules profile per level (high school, college, pros). Everything that differs by level, from the clock to kickoffs, tries, penalties and overtime, is read from here.
  - ui.js, split further as it grows: the screens.
- A seeded random number generator, so a world and its rosters can be rebuilt from a seed.
- A headless test hook like Gridiron Duel's, plus a tests folder with scripts that play full seasons and check balance.
- Hosting: GitHub Pages while building, and itch.io when it's ready.
- No online multiplayer. Firebase is only for cloud saves.

## Decisions so far

- Talent: turnout in high school, recruiting and NIL in college, the draft in the pros.
- Quarters: 12 minutes in high school, 15 in college and the pros.
- Rules: every level follows its real rules exactly, NFHS for high school, NCAA for college and NFL for the pros, checked against current sources before each level is built. Where high school rules vary by state, the fictional state uses the most common choice.
- Overtime: each level's real rules. High school and college overtime have no clock. The pro regular season has one 10-minute period with fourth-quarter timing, two timeouts each, and ties possible. The pro playoffs use NFL playoff overtime, which Gridiron Duel now matches.
- Depth chart: automatic if you want it, with changes for a single game and substitutions during a game.
- Difficulty: Normal only to start.

## Open questions

None right now.
