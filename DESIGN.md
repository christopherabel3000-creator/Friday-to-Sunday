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
- Each year runs through the offseason, summer, the regular season and the postseason.
- You move up through job offers. They come only in the offseason and depend on your reputation compared to what each school expects. Losing can put you on the hot seat.
- Later, a second path: coordinator jobs, where you call one side of the ball.

## Milestone 1: one high school season

In this milestone:

- Start a career: name your coach, pick a background and a scheme, and take over a small 1A school.
- A roster of about 30 players with ratings, many of them playing both ways.
- A depth chart that fills itself, with your changes on top.
- A fictional district of 8 schools plus 3 non-district games, for a 10-game schedule.
- Each week, set practice, then play every snap or sim the game.
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

- The depth chart lists the starters and backups at each position. It fills itself by overall rating, and you can move anyone.
- Gridiron Duel's personnel packages pull players from the depth chart: 10, 11, 12, 21, 13 and Jumbo on offense, and Base, Nickel, Dime and Goal Line on defense. A package that needs a weak fourth receiver or third corner plays weaker.
- Fatigue builds with every snap and recovers on the bench. Two-way players tire faster. Tired starters come out automatically when a backup is ready, based on a rotation setting.

## How ratings change a snap

Gridiron Duel rolls each snap from one edge number: the play-call matchup plus personnel fit, team style, disguise cost and the computer's execution. That edge shifts run yards, tackles for loss and big plays, and for passes the completion, interception and big-play odds. Friday to Sunday keeps all of that and adds talent.

1. **The call edge stays.** The matchup chart, personnel fit, styles and disguises work as they do now. New pieces join them: how well your team knows the play (mastery), and later your coach's specialties.
2. **Talent edges come from the players on the field,** one for each part of the play:
   - Run blocking: the offensive line and other blockers against the defensive line and linebackers. Shifts tackles for loss and run yards.
   - Ball carrier: elusiveness and speed against tackling. Shifts big runs and yards after contact. Ball security against the defense shifts fumbles.
   - Protection: pass blocking against the pass rush. Scales the sack rate.
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
6. **Rules follow the level.** Rules that differ by level, like overtime and extra-point distance, follow the level being played. See the open questions.

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

## Game day

- Play every snap or sim the game. A key-moments mode, which sims until the game is close and late, comes later.
- Gridiron Duel's rules carry over: the clock, timeouts, spikes and sideline routes, audibles, disguises, penalties and overtime.
- The opposing coach is computer-controlled, with its own ratings and scheme.
- Scouting lasts all season. Opposing coaches chart your habits across games, and your opponent prep shows theirs.
- After the game: the final score, box score, player stats and a short summary.

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

A fictional pro league, with a simplified draft, contracts and salary cap, and free agency.

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
  - ui.js, split further as it grows: the screens.
- A seeded random number generator, so a world and its rosters can be rebuilt from a seed.
- A headless test hook like Gridiron Duel's, plus a tests folder with scripts that play full seasons and check balance.
- Hosting: GitHub Pages while building, and itch.io when it's ready.
- No online multiplayer. Firebase is only for cloud saves.

## Open questions

1. Recruiting: this design assumes recruiting and NIL start at college, with high school rosters coming from turnout. Is that right?
2. Quarter length: Gridiron Duel offers 4, 8 and 15-minute quarters, and real high school quarters are 12 minutes. Should the career offer a choice, and what should the default be?
3. Overtime: keep Gridiron Duel's overtime, or use real high school and college overtime, where teams trade possessions from a set yard line?
4. Roster control: should you set every depth chart spot yourself, or just the starters, with the rest automatic?
5. Career difficulty: should there be a setting at the start (relaxed, standard or hard) that changes opposing coaches, player growth, and later job security?
