# Friday to Sunday: design

Status: building Milestone 1, one high school season. Steps 1 to 4 of the build plan below are done: a full 1A season, from picking your school through the state championship, with weekly practice, playbook mastery, scouting reports, player growth and injuries, every game played snap by snap or simmed, plus the exhibition game.

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

Build steps, each one playable and tested before the next:

1. **Done:** an exhibition game between two generated 1A schools, with rated rosters, an automatic depth chart, ratings driving every snap, high school rules and overtime, player stats, and VoiceOver support.
2. **Done:** the depth chart: moving players, changes for the next game only, substitutions during a game, fatigue and rotation, and dual-threat quarterbacks.
3. **Done:** the season: the district, the schedule, standings, the state playoffs, and quick sims of the games you aren't in.
4. **Done:** practice: the weekly plan, playbook installs and mastery, opponent prep and scouting reports, growth, and injuries.
5. **Done:** the career: creating your coach, cloud save codes, export and import, and the season summary.

Milestone 1 is done when:

- You can play a full season and the playoffs at a 1A school, snap by snap or simmed.
- Ratings visibly matter: the better team usually wins, but good calls swing close games.
- A save survives closing the page, and moves to another device with the cloud code.
- Every screen works with VoiceOver, on iPhone and on a computer.

## Milestone 2: more seasons

The same state goes on from year to year. Your school keeps its players, minus the seniors, plus a class of freshmen and whoever you talk into joining. In the offseason you spend your coach's XP and plan the summer, and every season opens with three weeks of preseason camp.

In this milestone:

- Seasons that follow one another in the same state: graduation, growth over the summer, incoming freshmen based on enrollment, tradition and your youth program, a new schedule each year, and tradition that follows results.
- Preseason camp: three weeks of practice before week 1 every season, the first one included, so a new coach can start installing their schemes. With no opponent yet, opponent prep time goes into install.
- Career stats for your players, a graduation report, and the state champions by year.
- Coach XP from wins, upsets, titles, playoff runs, players improving and the snaps your calls win. Spend it on ratings and perks.
- The offseason program: hallway recruiting (pitch athletes from other sports, and kids who don't play anything, to come out for football), youth camp, summer weights, 7-on-7 and study hall, with a new coach rating, Program building.
- Grades and eligibility: a report card can make a player ineligible for a couple of weeks, and study hall helps.

Booster fundraisers move to Milestone 3, with budgets.

Build steps, each one playable and tested before the next:

1. **Done:** more seasons: the offseason with graduation, growth and freshmen, the next season with its preseason camp, and the rest of the state moving on with you.
2. **Done:** coach XP and perks.
3. **Done:** the offseason program: hallway recruiting, the summer, Program building, and grades and eligibility.

How it's built (step 1):

- The calendar: camp, weeks 1 to 10, the playoffs, the season summary, then the offseason. Starting the next season ends every school's year, and the new one opens with camp.
- Camp is three weeks of practice. Its weeks are numbered with the games (0, -1 and -2 come before week 1), so practice, injuries and healing work as they do in the season. With no opponent, the plan's opponent prep weight moves to install, for the computer's schools too. Hold each week's practice and move on, or sim the rest of camp and read one report for all of it.
- The year ends for real at your district's schools: seniors graduate, a few players leave (5 percent a year, more with less work ethic; passers and kickers stay), everyone else grows over the summer and moves up a year, injuries heal, the team slips 8 percent of the way back toward 30 on every play, and a class of freshmen comes out. Each player's year has its own seeded dice.
- Summer growth: 1.9 points at his positions for a rising sophomore, 2.1 for a rising junior and 1.7 for a rising senior, times work ethic and the coach's Development, in two steps so it slows near potential.
- Freshman classes: 4.5 + 2.5 percent of enrollment + 0.03 × (tradition − 50) players, give or take 1.2 (4 to 12), at a level of 37 + 0.06 × (tradition − 50), give or take 2. Every class has two linemen, a fast skill player and a defensive back; a passer comes every other year and a kicker every other year, and the rest are runners, big athletes, linebackers, linemen and speed players. Their potential is 5 above a freshman's in a brand-new state, which keeps seniors about as good year after year. Each school keeps the size and level of its last four classes.
- Schools on paper: their first roster comes from the seed until all of it has graduated. After that a school is only its last four classes, each player taken through his years: a season of balanced practice on paper (14 weeks, in five steps) and the summer. Rebuilding takes the same time in any year, about 4 ms a school, so the whole state moves on in a fraction of a second. Their quick-sim ratings come from that roster each year, and grow 0.14 a week through camp and the season (about what your district's schools do).
- Tradition: 90 percent of last year's plus 10 percent of the season's showing: winning percentage, 8 for each playoff win and 15 for a state title, kept between 5 and 95.
- Over five to eight simulated years, starters average about 42 in your district and in the rest of the state alike, against about 43.5 in a brand-new state.
- Each season has its own seed and year. Your players keep career totals of their stats, the state keeps its champions by year, and the new season keeps a report of how your team changed.

How it's built (step 2):

- XP: 10 for a win, 20 for a playoff win, 15 for an upset (beating a team favored by 7 or more on paper), 15 for making the playoffs, 40 for the district title, 60 for the state title, a point for every 4 snaps your calls win while you're calling them (Gridiron Duel's verdict on each snap; simmed snaps don't count), and at the end of the season a point for every point your players' overall ratings went up. A simmed season earns about 125 to 140; playing the snaps adds about 60 to 80, and a playoff run more.
- Spending: a rating point costs the rating minus 20 (26 XP to go from 46 to 47), up to 99. Spend it any time on your coach's page.
- Perks (your coach's only; computer coaches don't get them):
  - Quarterback whisperer, Line whisperer (linemen and linebackers), Skill position coach (backs, receivers, tight ends) and Secondary coach: that unit grows 25 percent faster in practice and over the summer, on top of a background's 30 percent. 180 XP each.
  - Offensive guru and Defensive mastermind: +0.04 on the plays or calls the style is built around (a style weight of 0.4 or more). 250 XP each.
  - Blitz specialist: +0.05 for the defense on Run Blitz, All-Out Blitz and Zone Blitz. 200 XP.
  - Film junkie: the scouting report one level fuller (on top of Scouting 45), and the film-study edge a quarter bigger. 200 XP.
  - Disguise detector: your staff flags a disguised look 33 percent of the time, plus what Scouting 60 and up adds. 150 XP.
  - Trick play artist: fake punts and fake field goals 10 points likelier to work, and +0.15 on Tackle Eligible. 150 XP.
  - Motivator: +0.04 more late in close games and comebacks. 200 XP.
  - Install expert: install time teaches 30 percent faster. 200 XP.
- The week's XP shows on its results, the season's on the summary, and what's left to spend on the offseason screen and your coach's page.

How it's built (step 3):

- Program building, a new coach rating: your coach starts at 40 (an older unnamed coach at 42). A computer coach's is worked out from his Motivation, give or take 8, so it rolls none of the seed's dice and the same seed still builds the same state. Each point over 42 adds 0.04 freshmen and 0.03 to their level, a point of summer attendance, and a point on every pitch.
- The summer: eight weeks shared out by weight (none 0 to heavy 3) among summer weights, 7-on-7, youth camp, hallway recruiting and study hall; the plan carries over. Workouts are voluntary: a player shows up with a chance of 0.45 + half his work ethic (as a fraction) + a point per point of Program building over 42, between 20 and 98 percent. It happens for the players coming back, before the year turns over.
  - Weights: strength (and 0.3 as much speed) grows 0.9 × weeks to the 0.75 power × work ethic, like practice: about a point at normal, four with the whole summer.
  - 7-on-7: the same for accuracy, arm and awareness (quarterbacks), hands and routes (backs, receivers, tight ends) and coverage (linebackers and defensive backs).
  - Youth camp builds a youth program that keeps 60 percent from year to year and adds half the camp weeks to the 0.75 power (at most 6). Each point of it adds 0.25 freshmen and 0.8 to their level.
  - Hallway recruiting: one pitch, plus the hallway weeks to the 0.75 power (rounded), plus one with the Hallway recruiter perk (a 13th perk, 150 XP, which also adds 15 points to every pitch).
  - Study hall: grades up by 3.5 × weeks to the 0.75 power for players under 70 (a third of that for the rest).
- Hallway recruiting: six students who aren't on the team, the same for a school and year: a sport (basketball, baseball, track, soccer, wrestling, or none) and a body type to go with it, next season's year (sophomore to senior), a level 4 below the school's and 8 less awareness, and an interest. The really good ones are less interested. A pitch works 25, 50 or 75 percent of the time by interest, plus Program building, 0.3 a point of tradition over 50, and the perk (5 to 95 percent). Those who say yes join at the start of next season.
- A roster past 32 loses players off the bottom of the depth chart: each one not starting or first off the bench anywhere quits with a chance of 3 percent for every player past 32.
- Grades: 68 on average, give or take 22, plus 0.4 a point of work ethic over 52, until study hall changes them. Report cards come out after weeks 4 and 8 for every school in your district: a player under 55 is ruled ineligible for the next two games with a 2.5 percent chance a point under 55 (at most half). It's kept like an injury, so the depth chart plays the next player and the player still practices, and recovery doesn't bring him back early. About one or two players a team a season.

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
- How it's built: a player starts each game at 100 energy. A snap costs about 1 point for a lineman, a little less at the skill spots and about half that for a quarterback, scaled by stamina. Each snap on the bench gives back about 1.2, and quarter breaks, halftime and timeouts give back more. Two-way starters end up in the 50s and 60s late in a half, one-way starters stay close to fresh. A player at 50 energy plays at about 88 percent of his ratings. Rotation settings: Keep starters in (sit below 30, back at 55), Normal (below 55, back at 78) and Rotate often (below 70, back at 88). A starter only sits when a backup listed behind him at that position is fresh and isn't already starting elsewhere on the same side of the ball.

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

   How it's built: Gridiron Duel's numbers describe players rated about 75 (the pros), so each level-of-play adjustment scales from 75. A kicker's range is about 25 yards plus 0.44 per point of leg (a 35 leg reaches about 40 yards, a 90 about 64), and accuracy sets how often a kick inside that range is good.

   Where step 1 landed, over 300 simulated 1A games: about 20 points per team, 59 percent runs, 51 percent completions, 3 percent interceptions, about 6 penalties a team, field goals mostly inside 35 yards, about two-thirds of extra points good with a quarter of tries going for two, and the team with the better starters (by 4 or more rating points) winning about three games in four.
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

### How it's built (step 5)

- Every new head coach starts at 40 in each rating, plus the background:

  | Background | Ratings | Also |
  |---|---|---|
  | Former quarterback | Offense +12, Game management +6 | Quarterbacks grow 1.3 times as fast |
  | Former lineman | Offense +6, Defense +6 | Both lines grow 1.3 times as fast; +0.05 on runs, and against them |
  | Defensive mind | Defense +12, Scouting +6 | |
  | Special teams ace | Special teams +15, Game management +5 | Kickers and punters grow 1.3 times as fast |
  | Teacher and motivator | Motivation +10, Development +10 | |

- What each rating does when you call the plays (a computer coach gets the same, and a typical 1A coach is a 42):
  - Offense and Defense: (rating − 50) × 0.005 on every snap on that side, as before.
  - Special teams: field goal and extra point odds times 1 + 0.004 × (rating − 42), punts 0.05 yards longer per point, and 0.2 more kick coverage per point.
  - Motivation: (rating − 42) × 0.004 on every snap in the fourth quarter and overtime, when behind by any score or ahead by 8 or less.
  - Game management: on fourth down the call sheet gives the staff's read on going for it. At 45 and up it's a percentage; below that, words (likely, about even, a tough ask, a long shot). The odds are the engine's conversion rate for the distance on third and fourth down, measured over 700 computer games (64 percent on fourth and 1, 48 on fourth and 4, 18 on fourth and 10), plus 0.0065 per point of your offense's starters over their defense's.
  - Scouting: the prep edge times 0.8 + 0.4 × rating / 100, as before. At 45 and up, the same film time gives a report one level fuller. At 60 and up, your staff flags a disguised look at the line (rating − 50) percent of the time.
  - Development: growth times 1 + 0.012 × (rating − 42), as before.
- Your schemes replace the school's when you take the job. The team keeps its playbook mastery, so a school whose last coach ran your schemes is ready, and anywhere else your plays are learned in practice (six or seven weeks of heavy install to get three new plays to solid). The pick screen gives each school's last schemes and how many of your four core plays on each side it knows well (65 or better). Changing schemes during the season changes your coach's too.
- Ratings don't change yet: XP and perks come with Milestone 2.
- When the season is over, Coach another season keeps your coach and schemes and starts a new season in a new district, until Milestone 2 brings the next season at the same school. Each finished season goes on your coach's page.
- The season summary: your record and district finish against where your starters ranked in the district before the season, how it ended, points for and against, the best win (over the opponent with the best record), the biggest win and the closest loss, your leaders in passing, rushing, receiving, tackles, sacks and interceptions, and the three players whose overall rating at their position went up the most.

### XP and perks (Milestone 2, see step 2 there)

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

How it's built (step 4):

- The blocks are shared out by weight: none 0, light 1, normal 2, heavy 3. Giving one area more takes time from the rest, and every plan is valid. A plan with nothing in it is a week of rest. The balanced preset gives each of the six fundamentals units 0.8 blocks, install and opponent prep 1.7 each, and conditioning and recovery 0.8 each.
- The fundamentals units: quarterbacks (accuracy, arm, awareness), running backs and receivers (elusiveness, ball security, hands, route running, blocking for tight ends, a little speed), the offensive line (run and pass blocking, strength, awareness), the defensive front (pass rush, run stopping and strength for linemen; tackling, coverage and awareness for linebackers), the secondary (coverage, tackling) and kickers (leg, accuracy). A player trains at his own two positions and wherever the depth chart has him starting or first off the bench. Injured players sit out.
- Each week a rating gains 0.3 times the unit's blocks to the 0.75 power (more time helps, with diminishing returns), times the rating's weight in that unit, work ethic (0.6 to 1.4), year (freshmen 1.15 down to seniors 0.9), your Development rating (1 at 42), contact, and a random factor from 0.5 to 1.5. Progress builds up between practices, and a rating goes up a point at a time. Growth slows over the last four points before a player's potential and stops there.
- Over a balanced season a player gains about 3 points at his position as a freshman, 3 as a sophomore, 2.4 as a junior and 1.6 as a senior, and a team's starters about 2.5 points on each side of the ball. Conditioning adds about 4 points of stamina a season.
- Contact: shorts grow players at 0.85 of the usual rate with 0.3 of the usual practice injuries, shells are the usual, and full pads grow at 1.12 with 2.1 times the injuries. A team starts the game at 100 percent energy, minus 0.25, 0.55 or 0.9 for each block on the field (fundamentals and conditioning) in shorts, shells or pads, plus 3 for each block of recovery, kept between 86 and 100.
- Practice injuries: about two a season in shells on a balanced week. Most cost one game. Recovery cuts the risk by up to a quarter, and heals players faster.
- Computer schools practice a balanced week all season. Schools outside your district practice on paper when they're rebuilt (with their own seeded dice, and no injuries), and their quick-sim ratings grow 0.175 a week, about what a balanced week does.

## Playbook and mastery

- The plays are Gridiron Duel's. On offense: Inside Run, Outside Zone, Draw, Screen, Quick Game, Mesh, Deep Shot and Play-Action, plus QB Sneak, Hail Mary and Tackle Eligible in their situations. On defense: Run Blitz, Base 4-3, Man Coverage, Cover 2 Zone, Cover 3, Prevent, All-Out Blitz and Zone Blitz.
- Your team has a mastery level from 0 to 100 for each play. A play it hasn't mastered costs edge and draws more penalties and fumbles. Install practice raises mastery.
- A small school starts with about four offensive plays and four defensive calls it knows well. The rest have to be installed.
- Kicks, kneel-downs and spikes are always available.
- From Milestone 2, mastery fades some each offseason as seniors graduate.
- New plays can join later, starting with designed quarterback runs, like a QB draw and a read option, and trick plays.

How it's built (step 4):

- A school's core plays come from its schemes: Balanced runs Inside Run, Outside Zone, Quick Game and Play-Action; Air Raid Quick Game, Mesh, Deep Shot and Screen; Ground & Pound Inside Run, Outside Zone, Draw and Play-Action; West Coast Screen, Quick Game, Mesh and Inside Run. On defense, Balanced plays Base 4-3, Man, Cover 2 and Cover 3; Blitz-Happy Run Blitz, All-Out Blitz, Zone Blitz and Man; No-Fly Zone Cover 2, Cover 3, Man and Prevent; Run Stuffers Run Blitz, Base 4-3, Cover 3 and Zone Blitz. Core plays start around 72, the rest around 32, the sneak around 66, the Hail Mary around 44 and the tackle-eligible trick around 26.
- The edge on a snap, on the play-call scale, is (mastery minus 70) times 0.006 above 70 and 0.009 below, for the offense's play minus the defense's call: a mastered play is worth up to about +0.18, a brand-new one about −0.5.
- Flags and fumbles are multiplied by 1 minus 0.009 (fumbles 0.008) times (mastery minus 60), between 0.75 and 1.5. Centered at 60, about what the average call is worth once the plays a team doesn't know are mixed in, so totals stay where the engine was tuned.
- The computer weights each play by 0.3 plus 0.7 times (mastery / 100) to the 1.4 power, so it calls its core plays about twice as often as new ones. Its audibles count mastery too.
- Install: 20 points times install blocks to the 0.75 power, times how fast the team learns (starters' awareness and your Development rating). Up to three focus plays share 70 percent and the rest of the playbook shares 30; with no focus it's spread evenly. Each play gains its share times (1 minus mastery / 100), so it slows near 100. A normal week takes a focus play from about 45 to 57.
- The call sheet shows each play as mastered (85 and up), solid (65), learning (40) or new.

## Game day

- Play every snap or sim the game. A key-moments mode, which sims until the game is close and late, comes later.
- Gridiron Duel's systems carry over: the game clock, timeouts, spikes and sideline routes, audibles, disguises and penalties. Their rules follow the level being played (see Rules by level).
- You can change the lineup between plays (see Depth chart and personnel).
- The opposing coach is computer-controlled, with its own ratings and scheme.
- Scouting lasts all season. Opposing coaches chart your habits across games, and your opponent prep shows theirs.

How it's built (step 4):

- Film study: the opponent's coordinator is asked to call plays 60 times in each of short, medium and long yardage (down and distance only, before it knows your habits), against your usual personnel, and the calls are tallied. The report shows as much as your opponent prep earned: a light week gives their run and blitz rates and favorite calls; a full week gives each situation's run or blitz rate and top two calls, and what beats their favorites; a heavy week adds personnel, disguises and the top three calls.
- Prep edge: on a snap when they run a call you studied (their top two overall for a light week, top two in that situation for a full week, top three for a heavy one), your side gets 0.05, 0.09 or 0.13 on the play-call scale, times 0.8 plus 0.4 times your Scouting rating out of 100.
- Your film: after each game, the calls you made by situation go into the season's film (older games count 0.6 each week). Before the next game, the other coach starts with that film, at 0.6 times (his Scouting rating minus 25) out of 60, so a good scout counters your habits from the first snap.
- After the game: the final score, box score, player stats and a short summary.
- Injuries (step 4): each team has a 0.28 percent chance on every scrimmage snap that a player on the field gets hurt, about 0.36 injuries a team a game. Ball carriers, tacklers, targets and covering defenders are 2.5 times likelier, and so are tired players and players with poor health. 45 percent are out for the rest of the game, 27 percent miss the next game, 15 percent two or three, 9 percent four to six, and 4 percent the season. An injured player stays on the depth chart and the next healthy player behind him plays. Injuries go home with the schools that keep their rosters and heal a game at a time at the end of each week.
- Carries: the feature back is spelled on 15 percent of carries, and more often once he has 18 in a game, so even a run-first team spreads the load.

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

How it's built (step 3):

- Class 1A has 8 districts of 8 schools, each district with one school in each color family, so district games never clash. Your district's schools are saved with their full rosters. Everyone else is saved as a summary (town, mascot, colors, tradition, coach, ratings) plus the seed that rebuilds the whole school, exactly, whenever you play them or open their roster.
- A new season puts you in a random district and lets you pick any of its eight schools. You take over the coach's job with your own coach and schemes (see Coaches).
- The schedule: weeks 1 to 3 are against three other districts (district d meets d XOR w, so every week brings a different district), and weeks 4 to 10 are a district round robin made with the circle method. Home games are handed out to keep things even: every school gets three or four district home games, and almost always four to six in all.
- Standings: district record first. Ties go to head-to-head among the tied schools, then the overall record, then point differential in district games (capped at 14 a game), then a coin flip from the season's seed.
- Clinching is called only when it's certain: a school has the title when nobody can reach its district wins, a playoff spot when at most one school can, and is out when two schools already have more wins than it can reach. A tie could break either way, so a tie is never counted as clinched.
- The playoffs: the top two in each district make a 16-team bracket. District champions host runners-up from another district in the first round, and a district's two schools start in opposite halves, so they can only meet in the final. After the first round the better record hosts, then a district champion over a runner-up. The state championship is at a neutral site, with no home edge and no running clock.
- Home field: the home team plays about 0.06 sharper on both sides of the ball (home teams win about 56 percent of games between equal teams, by about 2 points).
- Games between two schools in your district run on the full engine in the background, with the computer coaching both sides. Every other game is a quick sim: expected points of 9.56 + 1.196 times the offense's starter rating, minus 0.961 times the defense's, plus 2 at home (1 each at a neutral site), plus 0.147 per point of coaching edge. The points come from 14 drives that end in a touchdown now and then, or once in a while a field goal (12 percent of scores). A touchdown is worth 7 about half the time, 6 about three times in eight (a missed kick or a failed two) and 8 the rest, as in the engine, so the scores look like football scores. A tie goes to overtime series until somebody wins.
- That fit came from 800 full-engine games: about 20 points per team with a spread of about 12, and the quick sim matches the engine's averages, spread, shutouts, overtime rate (about 3 percent) and how often the favorite wins at each predicted margin.
- Your game each week: play it snap by snap or sim it with your coach calling the plays. Your players' stats go into season totals either way. The finished game stays open for its box score until the next one starts.
- News after each week: upsets (a team favored by 9 or more losing), overtime games, unbeaten teams in your district, who clinched what, the district title, and the state champion. At most five lines, the most important first.

## Later milestones

### Milestone 2: more seasons

See Milestone 2 near the top.

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
- Up to three careers at once (later).
- A cloud save code, 12 characters long, restores the career on any device. It uses the shared Firebase project, with its own section in the shared rules file, the same way Shardkin's cloud saves work. That rules file has to stay the same in every repo that shares the project.
- Export and import a save as text.
- The reason for all three: iPhone Safari can wipe saved data for games inside itch.io's frame, and a career is too much to lose.
- Saves stay small. Your team is saved in full detail, and everyone else as summaries plus the seeds to rebuild them.
- Each save records the game's version, and older saves are upgraded when they load.

How it's built (step 5):

- A save code is FTS1Z. and the save gzipped, in base64: about 75 KB for a whole season (the save itself is about 260 KB). A browser that can't compress writes FTS1. and plain base64. Spaces and line breaks are ignored when pasting. The same code can be saved as a text file and opened later.
- A cloud save lives at fridayToSundaySaves/KEY as { ver, state, t, by, act }, where state is the save code. The first cloud save makes a 12-character key (no 0, O, 1 or I). Each save goes in a transaction that only writes when the cloud copy is the version this device last saved or loaded; otherwise the game asks whether to replace it or load it. The database rules require each save to be exactly one version newer and never allow deleting one, and nobody can list the keys.
- Neither a save code nor the cloud copy carries this device's cloud key, so sharing a save code never shares the cloud save. Loading a cloud save brings its key along.
- Loading a save, or starting a new career, keeps the game it replaces as a backup that can be switched back to.
- A save from a newer version of the game asks for a reload instead of loading.

## Accessibility

- Each new screen moves VoiceOver to its heading, as in Gridiron Duel.
- Scoreboards, standings and ratings read as plain sentences.
- Choices are buttons and button groups. No sliders and no drag and drop.
- Rosters are lists grouped under position headings. Tables appear only where columns help, like box scores and standings, with clear headers.
- Changes in place are announced once, briefly. No repeated instructions.

## Technical plan

- Plain HTML, CSS and JavaScript with no build step, like Gridiron Duel, but split into several files loaded in order. The files share their top-level names, so each name is unique across files and never matches a browser window property (a test checks).
  - engine.js: Gridiron Duel's game flow, clock, overtime, coin toss and audibles, with its sections marked, so a fix can be copied between the two games.
  - sim.js: the snap, rolled from the players on the field, plus penalties, kicking and tries.
  - ai.js: the computer coordinator, driven by coach ratings.
  - players.js: player generation and ratings. Growth, fatigue and injuries join it in later steps.
  - team.js: schools, rosters, depth charts, and who's on the field for each package.
  - season.js: the state's schools, the schedule, standings and tiebreakers, the playoff bracket, quick sims, full games nobody's watching, your games, and the news.
  - practice.js: the practice plan, growth, installs, conditioning and recovery, practice injuries and healing, and film study.
  - coach.js: coach ratings, backgrounds, and later XP and perks.
  - career.js: your career's coach, the seasons you've finished, and the season summary.
  - fatigue.js: energy during a game, rotation, and injuries in games.
  - cloud.js: save codes, cloud saves and backups. Device saves are in ui.js.
  - rules.js: one rules profile per level. Everything that differs by level, from the clock to kickoffs, tries, penalties and overtime, is read from here. High school is in; the pros profile holds Gridiron Duel's NFL rules so the engine stays general; college comes with Milestone 4.
  - util.js and data.js: helpers, the seeded random numbers, and the name lists.
  - ui_game.js, ui_depth.js, ui_practice.js, ui_season.js, ui_career.js and ui.js: the screens (the game; rosters and the depth chart; practice and scouting reports; the season; creating your coach, your coach's page, the season summary and saves; and the main menu, the exhibition, help and screen reader support), split further as they grow.
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
- The season: an 8-school district, three non-district games, and a 16-team state playoff for the top two in each district. Games in your district run on the full engine; the rest of the state is quick-simmed from ratings fit to the engine.
- Difficulty: Normal only to start.

## Open questions

None right now.
