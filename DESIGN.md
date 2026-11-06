# Friday to Sunday: design

Status: Milestones 1, 2, 3a and 3b are done: a career that starts at a 1A school and can climb to 6A, with preseason camp, practice, playbook mastery, scouting reports, growth and injuries, coach XP and perks, the offseason program, expectations and season grades, reputation, job security, a coaching carousel, the job market, boosters, the program fund, facilities, college offers and signing day, and key moments. Next is Milestone 4, college (designed below, not built yet).

## The pitch

You're a first-time head coach at a tiny high school with a losing tradition. You call every play with the same engine as Gridiron Duel, run the week's practice, and build the program. Win, and offers come in each offseason: bigger high schools, then college, and one day the pros. Friday nights to Sunday afternoons.

## Pillars

- **The call is the heart of the game.** Talent tilts every snap, but the play call still decides a lot of them. A well-coached underdog can win.
- **A career you build.** Players grow and graduate, your coach gets better, and your reputation follows you from job to job.
- **Management without busywork.** Plans stay in place until you change them, and reports only say what changed.
- **Screen reader first.** Everything works with VoiceOver on iPhone and with a screen reader on a computer.
- **A made-up world.** Fictional schools, conferences and pro league. Real NFL and college names and logos are trademarks. Players can rename schools themselves (Milestone 4).

## The career at a glance

- Levels: high school (classes 1A to 6A, by enrollment), college (three tiers of programs), and the pros.
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

## Milestone 3a: the high school job market

Your record starts to mean something. Before each season your school says what it expects, and afterward the athletic director grades your season against it. Beat expectations and your reputation grows and bigger schools want you. Fall short and the hot seat comes, then the door. Money that buys things (boosters, budgets and facilities) is Milestone 3b.

In this milestone:

- A whole state of six classes, 1A to 6A, each with its own districts and state playoff.
- Expectations before every season, and a season grade after it, counting strength of schedule.
- Reputation, as a number and in words.
- Job security, the athletic director's year-end review, the hot seat and firing.
- Careers for every computer coach: they age, improve, move, get fired and retire.
- The job market every offseason, with a detailed look at each job.
- A coaching stipend, year to year.
- A few of your best players may follow you to a new school.
- Your career history by school.

Not in this milestone: contracts and buyouts, schools making counteroffers (that comes with college), interviews, named rivals or news that follows particular coaches, former players or assistants becoming coaches, news about your old school, and an age for your coach (you coach as long as you like).

Build steps, each one playable and tested before the next:

1. **Done:** the whole state, 1A to 6A: enrollment, rosters, freshman classes and talent by class, two-way play, districts and playoffs for every class, and the quick sim checked at every class.
2. **Done:** expectations, the season grade and reputation.
3. **Done:** job security, the athletic director's review, the hot seat and firing.
4. **Done:** computer coaches' careers and the coaching carousel.
5. **Done:** the job market, the stipend, transfers, moving schools and the career history.

Milestone 3a is done when:

- A new career starts at 1A, and a coach who keeps beating expectations can reach 6A in about 8 to 12 seasons.
- A coach who keeps falling short gets fired, and always finds work again.
- Jobs open up around the state every year as computer coaches move, get fired and retire.
- Every class plays like its level, and the whole state still moves on to a new year in a couple of seconds.
- Every new screen works with VoiceOver, on iPhone and on a computer.

### The state

- Six classes, 1A to 6A. Each has 8 districts of 8 schools, three non-district games and a 16-team playoff for the top two in each district, exactly as 1A does now. That's 384 schools and six state champions a year. Seasons don't get any longer.
- Every career starts at 1A, picking a school in a random 1A district as now.
- Districts stay numbered. No named regions.
- Size and tradition are separate: every class draws tradition the same way, so there are proud small schools and losing big ones, and moving up a class doesn't mean moving to a better program.
- Every class plays by the same NFHS rules.

| Class | Enrollment | Roster | Freshmen a year | Typical starter | Best players |
|---|---|---|---|---|---|
| 1A | 80 to 190 | about 30 | 4 to 12 | about 42 | low 50s |
| 2A | 190 to 400 | about 38 | 8 to 13 | about 45 | mid 50s |
| 3A | 400 to 750 | about 46 | 10 to 15 | about 48 | around 60 |
| 4A | 750 to 1,200 | about 56 | 12 to 18 | about 51 | low 60s |
| 5A | 1,200 to 1,900 | about 68 | 15 to 22 | about 54 | upper 60s |
| 6A | 1,900 to 3,200 | about 85 | 19 to 28 | about 57 | a few in the 70s |

- Freshman classes by class: the base size is about a quarter of the class's usual roster, and tradition, the youth program and Program building add to it as they do now, scaled to the class's size. The freshman level rises with each class, tuned so starters land where the table says after five to eight simulated years, as Milestone 2 checked for 1A.
- Two-way play: the depth chart sets itself so that a player starts on both sides only when he's at least 5 points better than the best player who would start on just that side. At 1A that's still most starters, and at 6A almost nobody, so fatigue matters much less at big schools. 1A's balance gets checked again after this change.
- Your district plays on the full engine and keeps full rosters. The other 376 schools stay on paper, rebuilt from their seeds and their last four classes. When you take a job, the new school's district is rebuilt in full and your old district goes back to paper.
- The quick sim was fit from 1A games. It gets checked against full-engine games at every class and refit if the bigger classes don't match.
- To measure first: rebuilding all six classes on paper at the turn of the year (about 4 ms a school now, more for 85-player rosters), and the save with a 6A district kept in full, which could be up to three times today's. If either is too much, the other schools in your district can be rebuilt from paper when they're needed instead of being saved.

### How it's built (step 1)

- Each class has an enrollment range, a usual roster (30, 38, 46, 56, 68 and 85) and a level, the average ability of a junior there (37, 38, 40, 42, 44 and 46). Bigger rosters let the best players start, so starters land about 42, 45, 48, 51.5, 54.5 and 57.5 after five years, measured over a whole state. Coaches start a little better at bigger schools (a typical 1A coach is 42, a 6A coach 52), and bigger schools' coaches throw a little more.
- A class's roster, its freshman classes and its roster limit (32 at 1A, past which bench players quit) are 1A's, scaled by its roster size. A class's freshman count uses enrollment against the middle of its range. 1A schools are built exactly as before, roll for roll, so older states rebuild the same.
- Two-way play: the depth chart is set once with no penalty, and then again with each player who started on both sides counting the gap less on the side that isn't his main position's. The gap is 5 points at 1A, scaled by roster size (about 14 at 6A), since 5 points alone left four or five two-way starters at 6A. Brand-new schools average 6 two-way starters at 1A (7.4 before this change) and 2.4 at 6A, with offense and defense even at every class.
- School ids: 1A keeps d3s5; other classes add the class, as in 4Ad3s5. 1A rolls the state's own seed and every other class its own, so a save from before classes gets exactly the classes a new state with its seed would have, rebuilt on paper for its year.
- Your class plays its season week by week as before. When it's over, each other class plays its season on paper: its own schedule, quick sims, the same standings, tiebreakers and bracket. Every school's season is kept (record, playoff wins, district title, state title) for tradition and, in later steps, expectations and grades, and every class's champion goes into the history.
- The quick sim was refit from full-engine games at 1A, 3A and 6A. The margin still moves 2.16 points per point of starters, but scoring barely rises with the level of play (about 18 to 19 points a team at 1A and 20 at 6A), so expected points are 13.48 + 1.1235 × offense − 1.0335 × defense, plus home field and coaching as before.
- Speed, in a desktop browser: a new state of 384 schools takes about half a second, and each new year (rebuilding every school on paper, and the carousel) 1.1 to 1.7 seconds, with a screen that says the state is moving on while it happens. The save is about 400 KB with a 1A district in full (up from 260) and about 790 KB with a 6A district.

### Expectations

- When a season opens, every school in the state gets an expectation. The whole class's season is quick-simmed on paper 200 times from preseason ratings, and each school's averages become its expected wins, expected playoff wins, and chances at the district title and the state title. Because it uses the real schedule, it counts strength of schedule: a school in a weak district is expected to win more, so winning there means less.
- Expectations come from talent (the roster, the coach and the schedule). Tradition doesn't raise them; it makes the athletic director less patient (see Job security).
- You see your expectation before the season starts, on the season screen and in each week's preview, in words with the number. For example: "Expected: about 6-4 and a playoff spot (6.1 wins)."

### The season grade

After the playoffs, each season is graded:

- Regular season: wins minus expected wins.
- Playoffs: half of playoff wins minus expected playoff wins.
- Rewarded whatever was expected: 0.5 for each playoff win, 1 for a district title, and 1.5 for a state title.

A team expected to go 7-3 with a playoff win that goes 9-1 and wins the state title grades about +8. A strong season of three wins over expectations and one playoff win grades about +4, so a title is worth about two strong seasons. A talented team that only does what it should still gains a little for a district title and playoff wins.

The grade in words: under −3 far below expectations, −3 to −1 below, −1 to +1 met expectations, +1 to +3 above, +3 to +6 far above, and +6 or more a season to remember.

### Reputation

- 0 to 100, shown as a number and in words: under 25 an unknown, 25 to 39 a rising name, 40 to 54 a respected coach, 55 to 69 a proven winner, 70 to 84 one of the state's best, and 85 and up a legend.
- A new coach starts at 20.
- Each season reputation moves by 3 times the season grade, times the class's stage: 1A 1.0, 2A 1.15, 3A 1.3, 4A 1.45, 5A 1.6 and 6A 1.75. A bigger class is a bigger stage, so the same season builds more reputation there. A bad season costs a little more at a bigger class too, but only half as much more: a grade below zero uses half the stage's extra (1A 1.0, 2A 1.075, 3A 1.15, 4A 1.225, 5A 1.3 and 6A 1.375).
- No fading with time. A coach who keeps meeting expectations holds steady. Reputation only falls when seasons fall short, so a school that's happy with 6-4 from a team that should go 5-5 keeps its coach, and his reputation doesn't slip.
- Your coach's page shows reputation, this season's change and why.

### How it's built (step 2)

- Expectations play each class's season 200 times with seeded dice, so the same season always expects the same. Each game's win chance comes from the quick sim's expected margin on a normal curve with a spread of 13.6 points (measured from 20,000 quick sims a margin). Standings go by district wins, then all wins, then a coin flip, and playoff games are played at a neutral site. Other classes use the schedule their season on paper will play.
- They're set when a season opens (a new state, and each new year), and again for your class when you take a job, since you're the school's new coach. A season from before expectations gets them from where the ratings stand when it first needs them.
- Over four simulated years of the whole state, schools averaged 5.00 regular-season wins against 5.00 expected, and 0.234 playoff wins against 0.236. Grades averaged +0.27 (the titles and playoff wins), with a spread of about 1.9: 44 percent met expectations, 20 percent above, 8 percent far above and 1 percent a season to remember; 24 percent below and 3 percent far below.
- Every school's grade goes with its season's result. Yours goes into your career with the class and your expected wins, and moves your reputation once.
- The season summary shows the grade, what it was made of and the reputation change. Your coach's page shows your reputation, and the career list gives each season's class and grade.

### Job security

- Job security runs from 0 to 100, and a new hire starts at 60. Each season it moves by 10 times the season grade. A grade below zero counts 1 + (tradition − 50) / 100 times as much, so a proud program (1.4 at a tradition of 90) is far less patient than a losing one (0.6 at 10).
- At the year-end review, the athletic director tells you where you stand: 70 and up, your job is safe; 45 to 69, the AD expects improvement; 25 to 44, you're on the hot seat; under 25, you're fired.
- Two full years: nobody is fired after his first season. After his second, a coach is fired if both seasons were a win short of expectations or worse (graded −1 or lower). From the third season on, job security decides.
- Firing happens only at the year-end review. There are no warnings during the season.
- Computer coaches follow the same rules.

### Computer coaches' careers

- Every computer coach has an age, a reputation and job security, by the same rules as yours, from his school's results against the same expectations.
- New coaches come in at 24 to 35 with ratings in the 30s and 40s and a reputation of 15. Each one coaches 30 to 40 years (his own number, from his seed) and then retires, so most retire between their late 50s and early 70s. A brand-new state spreads its coaches across those careers.
- Their ratings grow about a point a year for their first 15 years, then level off.
- Nobody is tracked by name in the news.

### The coaching carousel

At the end of each season, after the athletic director's review:

1. Retirements and firings open jobs around the state, about 20 to 30 of the 384 each year.
2. Your job market runs on those openings.
3. When you're done, computer coaches fill the rest, best job first. Each goes to the computer coach with the best reputation who clears its bar and would be moving to a bigger class or a better program. Each move opens his old job, which fills the same way, and whatever's left goes to new coaches.

Computer moves happen after your market, so the jobs you see are the ones open when the season ends.

The carousel news covers anything involving you, every coaching change in your district (your new district, if you moved), and notable changes in your class, like a state champion's coach moving up or a firing at a proud program. At most eight lines.

### The job market

- Only jobs that are interested in you are listed. Each school has a bar: 1A 0, 2A 28, 3A 40, 4A 52, 5A 64 and 6A 76, plus 0.2 a point of tradition over 50, since the best programs want more. With your reputation 10 or more over the bar the school's interest is high, at or over it medium, and up to 8 under it low. More than 8 under, it isn't listed.
- Each job lists the school, class, district, enrollment, tradition, stipend, the expectation for next season, the athletic director's patience in words, and its interest in you.
- A detailed look at any job: next season's roster (the players coming back, every rating, as on any roster screen), its last coach's schemes and how much of your playbook it knows, and last season's record.
- Sort by interest, class, tradition or talent, and filter by class. It starts sorted by interest, then class.
- You pursue one job at a time, and the school answers right away: an offer (85 percent of the time at high interest, 55 at medium and 25 at low) or a no. An offer has to be answered right away: take it, or turn it down and it comes off your list. A no takes that job off your list too. The rest stay open until you take a job.
- Stay where you are any time and the market closes. Staying doesn't change anything else.
- No minimum stay: you can leave after any season. Any move is allowed, up, sideways or down. A lower class pays less and builds reputation more slowly.
- If you're fired, the market works the same, except you can't stay. If every school says no, the 1A school with the weakest roster offers you its job, letting its coach go if it has to. You always have a job.
- The market comes before the offseason program, so you plan the summer at the school you'll coach.

### Moving schools

- You keep your coach, ratings, XP, perks and schemes. The new team keeps its own playbook mastery, so whatever it doesn't know has to be installed, as when you took your first job.
- Your old school goes to the carousel, and its players aren't followed.
- Transfers: each of your five best returning players (by overall, not counting seniors) follows you with a 15 percent chance. Most moves bring none or one, and now and then two or three. They're eligible from week 1.
- Your coach's page gets a career history by school: the years, record, playoff record, district and state titles, and the stipend, beside the season-by-season list.

### How it's built (steps 3 to 5)

- The year-end review happens once, when you go on from the season summary (or when the next season starts, for a test or an older save). Your season's grade moves your reputation and job security, your stipend is paid into your career earnings, and the raise is set. Every computer coach's reputation and security move with his school's grade, he gets a year older, and his ratings grow a point (for his first 15 years). A coach who has reached his years retires, and the athletic directors fire by the same rules as yours.
- A computer coach from before careers gets them from his seed: a career of 30 to 40 years, already partway through, a reputation around his class's bar (about 16 at 1A), security of about 62 and three seasons at his school, so the state's first year isn't a wave of firings.
- The carousel: a computer coach moves only after two seasons at his school, and only up a class or to a program with 30 more points of tradition in his own (otherwise more than a hundred coaches a year moved). Over eight simulated years, 20 to 30 jobs opened a year (about a third retirements), 40 to 90 coaches moved, and 20 to 30 newcomers came in. Good coaches end up at the biggest schools: 6A coaches' reputations drift into the 90s and 4A's into the 40s.
- The carousel news before the market covers how many jobs are open, and every retirement and firing in your district and the notable ones in your class. After the market, the offseason screen lists the hires in your district and the notable ones in your class.
- The job market: each school's answer is rolled once a season, so asking again or reloading never changes it. The list shows each job's class, district and interest, last season's record against what was expected, its starters, tradition, enrollment, stipend, its athletic director's patience and why the job is open, sorted by interest, class, tradition or talent, and filtered by class. Next season's expectation can't be known until its schedule is made, so the closer look shows its returning starters against this season's class average instead, with the returning roster by position group and how much of your playbook it knows.
- Moving: your old district goes back to paper and the new one is rebuilt in full as it stands at the end of the season. The season you just finished stays in your career, but its summary screen closes once you've moved, since it was at another school.
- A strong coach's climb, simulated with a grade of +1.5 every season and the biggest class that offers: 2A in year 1, 3A in year 3, 4A in year 5, 5A in year 7 and 6A in year 9. At +2 a season it took 7 years, and at +2.5, 6.

### The stipend

- High school head coaches are mostly teachers paid a coaching stipend on top. Each job's stipend comes from its class: 1A $4,000, 2A $5,500, 3A $7,000, 4A $9,000, 5A $11,500 and 6A $15,000, plus $50 a point of tradition over 50 (up to $2,000 more).
- Year to year, with no contracts. A 3 percent raise for each of your first five seasons at a school, then it stays there.
- Your coach's page shows this year's stipend and your career earnings. Money doesn't buy anything until 3b.

### Screens

- After the season summary: the athletic director's review (your grade and why, the reputation change and where you stand), the carousel news, the job market, and then the offseason program.
- Each new screen moves VoiceOver to its heading. Changes are announced once, briefly, with no repeated instructions.

## Milestone 3b: money and college offers

Your program finally has money to spend, and your players have somewhere to go. Boosters raise money and expect results. The program fund pays for better facilities and for one-season extras like team camp. Your own stipend pays for coaching clinics. Your best players draw interest from colleges, sign on signing day, and every player you send on helps your name and your program. All the numbers below are starting points, tuned with simulated careers like everything else.

In this milestone:

- A booster club at every school, with an enthusiasm that follows results.
- A program fund: the school's yearly money, booster giving and fundraisers.
- Fundraisers in the offseason, which cost summer time past the first one.
- Five facilities, each one making an existing system better.
- One-season purchases: team camp, a summer strength coach and a tutor.
- Coaching clinics, paid from your own career earnings, for XP.
- A fictional college world of 120 programs in three tiers, which Milestone 4 will use.
- College interest and offers for your juniors and seniors, and signing day.
- Rewards for sending players to college: XP, reputation, boosters and turnout.
- Key moments: sim a game until it's close late, then call it yourself.

Not in this milestone: assistant coaches, contracts, a stadium you name, ticket sales by game, recruiting for computer schools outside your district, and anything about where your former players go after they sign.

Build steps, each one playable and tested before the next:

1. **Done:** boosters, the program fund, fundraisers and coaching clinics.
2. **Done:** facilities and one-season purchases, for every school, and in the job market.
3. **Done:** the colleges, recruiting interest, offers, signing day and its rewards.
4. **Done:** key moments.

Milestone 3b is done when:

- Money is a real choice every offseason: a 1A program can afford one facility upgrade every two or three years, and a 6A program about one a year.
- Better facilities help, but a well-run program with poor facilities can still beat a rich one.
- A 1A school sends a player to college about every year or two, and a 6A school sends about eight a year, with one to a Tier 1 program most years.
- A career game can be played start to finish with key moments.
- Every new screen works with VoiceOver, on iPhone and on a computer.

### The booster club

- Every school has booster enthusiasm from 0 to 100. A school starts at 20 + 0.6 × tradition, give or take 10, between 5 and 95.
- In words: under 25 grumbling, 25 to 44 lukewarm, 45 to 64 behind you, 65 to 84 fired up, and 85 and up all in.
- Each season it moves by 4 times the season grade, plus 3 for a district title and 6 for a state title, then slips 10 percent of the way back to where the school's tradition would start it. Players signing with colleges add to it too (see Rewards).
- Pressure: boosters who care a lot are also less patient. A grade below zero moves job security that much more at a school with enthusiasm over 60: 1 + (enthusiasm − 60) / 100 times, up to 1.35, on top of tradition's patience. A happy booster club with a bad season is the dangerous one.
- Enthusiasm stays with the school when you leave.

### The program fund

- Money you control goes into the program fund. It belongs to the school, so it stays behind when you move, and your new school has its own.
- Each year, at the start of the offseason, the fund gets:
  - The school's football money, by class: 1A $3,000, 2A $4,500, 3A $6,000, 4A $8,000, 5A $10,000 and 6A $13,000.
  - Booster giving: 1A $4,000, 2A $7,000, 3A $11,000, 4A $17,000, 5A $26,000 and 6A $40,000, times 0.5 + enthusiasm / 100.
  - The fundraisers you ran.
- Upkeep comes out first: each facility costs 4 percent of what it took to build it each year, paid automatically. If the fund can't cover it, the newest upgrade slips a level, and the report says so.
- The rest carries over from year to year, so saving up for a big upgrade works.
- The offseason screen shows the fund in one line: what came in, what upkeep took and what's left.

### Fundraisers

Pick fundraisers in the offseason. The picks stay in place every year until you change them, like the practice plan. The first one is free; each one after it takes one of the eight summer weeks away from the summer program.

| Fundraiser | Base at 1A | Grows with | Also |
|---|---|---|---|
| Car wash | $1,200 | enrollment | Always works |
| Sponsor signs on the fence | $1,800 | enrollment and tradition | |
| Discount cards | $2,000 | enrollment | Players sell them, so summer attendance drops 5 points |
| Golf tournament | $3,500 | booster enthusiasm | Needs enthusiasm of 45 or more |
| Booster banquet | $1,500 | booster enthusiasm | Adds 3 to enthusiasm |

Each fundraiser's money is its base times the class's size (1A 1, 2A 1.5, 3A 2.2, 4A 3, 5A 4 and 6A 5.5), times what it grows with, give or take 20 percent. Each school's result is rolled once a season, so reloading never changes it.

### Facilities

Every school has five facilities, each rated 1 to 5: poor, basic, good, great and elite. Each one makes something already in the game work better.

| Facility | What it does, by level (1 / 2 / 3 / 4 / 5) |
|---|---|
| Weight room | Strength growth from summer weights and practice times 0.85 / 1 / 1.1 / 1.2 / 1.3, and 2 more points of summer attendance a level over 2 |
| Film room | The prep edge times 0.9 / 1 / 1.05 / 1.1 / 1.15, and at level 4 and up the scouting report is one level fuller |
| Practice field | Practice injuries times 1.15 / 1 / 0.92 / 0.85 / 0.78, and recovery heals a little faster at level 4 and up |
| Equipment | Game injuries times 1.1 / 1 / 0.95 / 0.9 / 0.85, and full pads' extra practice injuries cut by 0, 0, 10, 20 and 30 percent |
| Locker room and stadium | Booster giving 6 percent more a level over 2, and 2 more points on every hallway pitch a level over 2 |

- Upgrading one level costs, to reach level 2 $8,000, level 3 $20,000, level 4 $45,000 and level 5 $90,000, at every class. Bigger schools reach the top because they have more money, not because it's cheaper.
- You can upgrade any number of facilities in the offseason, as far as the fund goes, and cancel an upgrade made this offseason for a refund. Upgrades work from that summer on.
- Schools start with facilities from their class and tradition: about 2 + 0.4 a class above 1A + (tradition − 50) / 30, give or take about a level, between 1 and 5. A typical 1A school is basic, and a typical 6A school is great.
- Computer schools upgrade on paper: each one moves one facility a level toward where its class and tradition would start it every three years, from its own seed.
- Computer schools get the same effects: in full in your district, and on paper elsewhere (the weight room and the practice field in their rebuilt practice and summer).
- The job market and the closer look at each job show the school's facilities, its fund and its booster enthusiasm.

### One-season purchases

Bought in the offseason from the program fund. They last one summer and season, and the picks don't carry over.

- Team camp at a college: $250 a player who attends (attendance is the summer's attendance roll). Counts as 1.5 more weeks of 7-on-7, adds 20 install points spread over the playbook before camp, and gives everyone who attends college exposure (see College offers).
- A summer strength coach: $3,000 at every class. Summer weights count 1.25 times.
- A tutor: $1,500 at every class. Study hall counts 1.5 times, and report cards rule a player ineligible 30 percent less often.

### Coaching clinics

Your career earnings (the stipends you've been paid) finally buy something. Each offseason, on the program fund screen, you can attend up to two clinics:

- A state clinic: $600 for 30 XP.
- A national clinic: $2,000 for 70 XP.

You can also give any amount of your earnings to the program fund. Earnings never go below zero, and computer coaches don't attend clinics.

### The colleges

- The state's players are recruited by 120 fictional college programs, built from the seed: 24 in Tier 1 (the top programs), 36 in Tier 2 and 60 in Tier 3 (small colleges). Each has a name, a town and colors, made up like the high schools. Milestone 4 will put you in this same college world.
- Each year, each college needs players at a few positions: about 2 to 4 at each of OL and DL, and 0 to 3 at each other position, from its seed for that year.

### College offers

- Colleges look at your juniors and seniors, and at every junior and senior in your district (those schools keep full rosters), but not at schools on paper.
- How a college sees a player, his recruit rating: his overall at his best position, plus 0.4 times the gap to his true potential (colleges see past your staff's estimate), plus 0.15 a point of speed over 50 at the skill spots and the secondary, or of strength over 50 on the lines.
- Each tier has a bar: Tier 3 at 58, Tier 2 at 66 and Tier 1 at 74. A player has to clear a tier's bar for its colleges to get interested. In words: a college prospect, a strong prospect and a top prospect.
- Exposure, from 0.5 to 1.2: 1A 0.55, 2A 0.65, 3A 0.75, 4A 0.85, 5A 0.95 and 6A 1.0, plus 0.1 for team camp, and 0.05 a playoff game played (up to 0.15). Small-school stars are easy to miss, which is real, and team camp and a playoff run are how they get seen.
- Offers come in five windows: the spring after his junior season (in the offseason), the summer (team camp), after weeks 4 and 8 of his senior season, and after the playoffs. The summer window is only for players at team camp. In each window, each college that needs his position and whose bar he clears offers with a chance of 0.01 × exposure × (1 + (recruit rating − bar) / 5), up to 50 percent. Each window is rolled once, so reloading never changes it.
- Grades matter: a Tier 1 or Tier 2 offer needs grades of 60 or more on signing day. Under that, it's listed as pending grades, and study hall and the tutor help.
- Signing day comes after the season summary and before the athletic director's review. Each senior with an offer he qualifies for signs with the highest tier that offered, the college with the most need at his position if there's more than one.
- Where it landed, over simulated careers: a 1A school signs about 0.8 players a year (nearly all Tier 3; a Tier 1 is rare, since small-school stars are easy to miss), a 3A school about 1.7, and a 6A school about 8, about one of them Tier 1. Bigger schools have far more good seniors, so a 6A school sends many more.

### Rewards

- XP: 5 for each player's first offer from each tier, and on signing day 10 for a Tier 3 signee, 20 for Tier 2 and 40 for Tier 1.
- Reputation: 0.5 for each Tier 3 signee, 1 for Tier 2 and 2 for Tier 1, up to 4 a year, on top of the season grade's change. A coach known for sending players on gets noticed.
- Boosters: 1, 2 or 4 enthusiasm by tier.
- The program: for every player you signed in the last four years at this school, hallway pitches get 2 more points and freshman classes 0.1 more players. Word gets around.

### Key moments

- A third way to play a game, beside playing every snap and simming: the computer calls your plays until the game is close late, then hands it to you.
- It's close late from the start of the fourth quarter whenever the score is within 8 points, and in overtime. Once you have it, you keep it to the end. If it never gets close, the game sims to the end.
- When you take over, one sentence says where things stand, for example: "Key moment. 4th quarter, 9:12 left. You trail 14 to 10, ball on your 35, 1st and 10." Then a short list of the scoring plays so far, and the call sheet.
- Your coach's calls and XP work as when you sim: the snaps the computer called don't earn snap XP, and the ones you call do.
- Once you have it, Sim to the end still works as in any game.

### Screens

- Signing day comes first in the offseason, before the athletic director's review, when your players have college news: who signed where, late offers, offers held back by grades, and the spring offers for your juniors.
- After the job market, the offseason screen opens the program fund: the books, fundraisers, facilities, one-season purchases, and your own money (clinics and gifts to the fund), all on one screen.
- A recruiting screen lists your juniors and seniors with college interest: each one's recruit rating in words, his offers by tier, and anything pending grades.
- New offers are announced once in the week's results, for example: "Marcus Hill got an offer from Tier 2 Lakeshore State." The news can mention the district's top recruits.
- Each player's page shows his offers. The offseason screen and the graduation report say where your seniors signed, and your coach's page counts the players you've sent to college by tier.
- Every new screen moves VoiceOver to its heading, and choices are buttons, as everywhere else.

### Saves

- An older save gets boosters, facilities and the colleges from the seed, and no offers until the next window. Its fund starts from what its last coach saved.

### How it's built (steps 1 to 4)

- Files: money.js (boosters, the fund, fundraisers, facilities, purchases and clinics), recruit.js (the colleges, offers and signing day), ui_money.js (the program fund, signing day and recruiting screens). Key moments are in ai.js.
- Boosters (s.bst) and facilities (s.fac, five levels) are kept with every school, summaries included, from their own seeded dice, so a state still builds the same. The program fund (s.fund) is kept only for schools you've coached; anywhere else it's estimated from the seed as up to a year's money.
- The books open once an offseason, when the job market closes, at the school you'll coach: what was saved, the school's money, booster giving, upkeep, then your fundraisers. Starting the next season opens them if nobody did.
- Upkeep, measured: a typical 1A school pays about $2,000 a year and nets about $6,500, so a level 3 upgrade every three years; a typical 6A school pays $15,000 to $30,000 and nets about $40,000.
- Facility effects: the weight room scales strength wherever it grows (practice, conditioning, summer weights and practice on paper); the film room the prep edge and the report level; the practice field practice injuries and early returns; equipment every game injury roll (each game team's injk) and the extra injuries from full pads; the locker room and stadium booster giving and hallway pitches.
- Colleges are built from the state's first seed whenever they're needed and never saved. Offers are kept with the player (p.off), signings with the player (p.sign), the school (s.sent by year) and your career (CAREER.sent by tier).
- Key moments: the computer calls both sides, stopping after a play once the game is close late; you take over from the next snap. A panel with where things stand and the scoring so far gets VoiceOver's focus, and goes away after the next snap.

## Milestone 4: college

From Friday nights to Saturdays. A high school coach who has become one of the state's best gets a call from a small college, and the climb starts again: Division III or Division II, then the FCS, then the smaller FBS conferences, then the power conferences. College talent comes from recruiting, revenue sharing and NIL, and the transfer portal, so building a roster is the new heart of the game. Calling the plays still decides close games.

Decisions (Nov 2026):

- The college world has the real shape and size of college football, about 670 programs, with made-up names. Players can rename any school or conference themselves.
- College offers start at a high school reputation of 80, and they're Division III and Division II head coaching jobs.
- Head coaching only. Coordinator jobs come later, with Milestone 6.
- Recruiting runs from a board with priorities. You make the big calls (offers, visits, NIL) and nothing needs a tap every week.
- Money is in real dollars.

In this milestone:

- The college world: about 670 programs in five levels and about 60 conferences, each program with tradition, boosters and facilities.
- College rules, as the NCAA plays them in 2026, and college overtime.
- A college season: fall camp, 12 games, conference title games, a weekly top 25, bowls and the College Football Playoff, and playoffs for the FCS, Division II and Division III.
- College players: class years and redshirts, rosters of up to 105, early departures for the pros.
- A college reputation, college job markets, contracts, salaries, buyouts and counteroffers.
- Recruiting high school prospects, from your old state and beyond, with a new coach rating, Recruiting.
- Revenue sharing and NIL, with the boosters as the collective.
- The transfer portal, once a year.
- Spring practice in the offseason.
- Renaming schools and conferences.

Not in this milestone: assistant coaches on your staff, the coordinator path (Milestone 6), the pro draft (Milestone 5; players who leave early just leave), conference realignment, the NAIA and junior colleges, and detailed recruiting for any program but yours.

Build steps, each one playable and tested before the next:

1. College rules and an exhibition college game between two generated programs, with college level of play checked.
2. The college world and its season: every level and conference, schedules, the quick sim refit, rankings, title games, bowls and all four playoffs, with speed and save size measured. Milestone 3b's colleges move into it. (A test career can start at a college.)
3. College players: class years, redshirts, early departures, spring practice, and programs on paper with recruiting classes.
4. The college job: the college reputation, college jobs in the market, contracts, salaries, buyouts, counteroffers, expectations, grades, job security, and college coaches' careers.
5. Recruiting: the prospects, the Recruiting rating and perk, your recruiting board, visits, commitments and signing day.
6. Revenue sharing, NIL and the transfer portal.
7. Renaming schools and conferences, with a list of names to save and load.

Milestone 4 is done when:

- A coach who keeps beating expectations in high school reaches a reputation of 80 and gets Division III or Division II offers, and one who keeps winning in college can reach a power conference in about 12 to 18 seasons.
- Recruiting decides a program's talent over the years: a good recruiter at a modest program can build a winner.
- Every level plays like itself: Division III looks different from a power conference.
- The whole world, high school and college, moves on to a new year in a few seconds on a phone, and the save stays small enough for the cloud and save codes.
- Every new screen works with VoiceOver, on iPhone and on a computer.

### The college world

Five levels, sized like real college football in 2026 (about 136 FBS programs, 127 FCS, around 165 in Division II and 245 in Division III; the exact counts move every year, so these are targets, not rules):

| Level | Programs | Conferences | Postseason | Recruiting tier (3b) |
|---|---|---|---|---|
| Power conferences | 68 | 4 of 16 to 18, plus 1 independent | College Football Playoff and bowls | Tier 1 |
| The rest of FBS | 68 | 6 of 8 to 14, plus 2 independents | College Football Playoff and bowls | Tier 2 |
| FCS | 128 | 13 | 24-team playoff | Tier 2 |
| Division II | 164 | about 14 | 28-team playoff | Tier 3 |
| Division III | 244 | about 26 | a 28- or 32-team playoff (to confirm) | Tier 3 |

- Every school, conference and bowl has a made-up name. Names sound real: state schools, directional schools ("Central," "Western"), small private colleges, and A&M and Tech schools, but never a real school's name.
- Each program has tradition, boosters and the five facilities from 3b, set by its level and tradition: power programs mostly great and elite, Division III mostly basic and good.
- Your program keeps its full roster. Every other program is a summary: its ratings, coach, boosters, facilities and the size and level of each recruiting class. Its roster is rebuilt from its seed and those classes only when you play it or open it, so a new year never rebuilds 670 rosters.
- Only your games run on the full engine. Every other game is a quick sim, refit for each level from full-engine games.
- Milestone 3b's colleges become this world. Offers and signings go to programs at the matching tier, and the offer chances are rescaled for the bigger world so signing rates stay where 3b put them. A save from 3b keeps each signee's tier and gets a program at that tier from the seed.
- To measure in step 2: the new year (high school and college together) on a phone, and the save size with about 670 college summaries. If it's too much, Division III and Division II programs can be kept even more simply.

### The college season

- The calendar: spring practice and the summer in the offseason, three weeks of fall camp, 12 regular-season games, conference title games, then the postseason. Signing day and the transfer portal come in the offseason.
- The schedule: mostly conference games (9 at the biggest conferences, all of them in small ones), and the rest non-conference, mostly against the same level. Now and then a big program pays a smaller one to come play it.
- Standings: conference record, then head-to-head, then overall record. The top two meet in the conference title game, where a conference has one.
- The top 25: a weekly ranking of FBS from record, strength of schedule, margin of victory (capped) and quality wins, read as a plain list ("7. Lakeshore State, 8-1"). The FCS, Division II and Division III have their own top 25s.
- The College Football Playoff, as the real 12-team format works in 2026: the four power conference champions are guaranteed spots, and the rest are the best-ranked teams left (to confirm whether the best champion of the other FBS conferences is also guaranteed one). Seeded straight by ranking. The top four get byes, first-round games are on the higher seed's campus, and the rest are at neutral bowl sites.
- Bowls: the other FBS teams with 6 or more wins play in made-up bowls, matched by ranking and conference. A bowl win counts like a playoff win for grades and XP, at half the weight.
- The FCS, Division II and Division III playoffs: conference champions where they have automatic bids, plus at-large teams, seeded by ranking.

### College rules

Checked against current sources in November 2026, and to be checked against the 2026 rulebook again while step 1 is built. The rules section below has the full list. The changes from high school that matter most:

- 15-minute quarters, a two-minute timeout in each half, and the clock running again after a first down except in the last two minutes of each half.
- Kickoffs from the 35, touchbacks at the 25, and a fair catch inside the 25 counts as a touchback.
- No kicking tees for field goals and extra points, so kickers are a little less accurate.
- Defensive pass interference is a spot foul of up to 15 yards with an automatic first down. Offensive pass interference is 10 yards (new in 2026).
- A missed field goal goes to the defense at the line of scrimmage, or the 20 if that was inside the 20.
- The defense can return a try for two points.
- A fair-catch kick is allowed (new in college in 2026; high school allows it too, so high school gets it at the same time).
- College overtime: possessions from the 25, a two-point try required after a touchdown in the second overtime, and two-point plays from the third on.
- All five levels play by the same NCAA rules.

### College players

- Ratings stay on the one scale. Typical starters: Division III in the 40s and 50s, Division II in the 50s, the FCS in the 50s and 60s, the rest of FBS in the 60s, and the power conferences in the 60s to 80s, with a few stars higher. Your high school signees fit right in.
- Class years: freshman to senior, plus a redshirt. A player can play in up to four games and still keep the year, so he has five years to play four seasons. (Eligibility rules were under review in 2026: to confirm while step 3 is built.)
- Rosters of up to 105 at every level that opted into the 2025 House settlement, which replaced the old 85-scholarship limit with a 105-player roster limit. Smaller levels carry smaller rosters (about 90 to 100 in Division II and III). Nobody plays both ways, so fatigue matters less and depth matters more.
- Leaving: seniors run out of eligibility, players transfer, and the best juniors and redshirt sophomores may leave early for the pros, more likely the higher they're rated.
- Practice works as in high school, with the same plan and units. Spring practice is four weeks of practice in the offseason, so a new coach can install his schemes before fall camp.
- Your former players: the players you sent to college in Milestone 3b are kept with their programs, so they're on the roster when you take over there, or play against you.

### The college reputation and the job

- College has its own reputation, 0 to 100, with the same words as high school. Your high school reputation gets you in the door; the college one moves with your college seasons. A coach who arrives from high school starts at 20, plus a little for a high school legend.
- The way in: once your high school reputation reaches 80 (one of the state's best), Division III and Division II head coaching jobs appear in your high school job market, with the usual bar for a proud program.
- In college, each level's jobs have a bar on the college reputation: Division III 0, Division II 10, the FCS 30, the rest of FBS 45 and the power conferences 65, plus a bit for tradition. Expectations, the season grade and job security work as in high school, counting conference titles, bowls and playoff wins, and a bigger level is a bigger stage.
- Contracts, in real dollars (to check against current salaries while step 4 is built): Division III about $60,000 to $110,000 a year, often with teaching, Division II about $90,000 to $200,000, the FCS about $200,000 to $600,000, the rest of FBS about $700,000 to $3 million, and the power conferences about $4 million to $11 million, more at proud programs and for coaches with bigger reputations. Lengths run from 2 years in Division III to 6 at the top. Your earnings go into the same career earnings.
- Buyouts: a fired coach is paid most of what's left on his contract (60 percent here), which makes schools a little slower to fire. Leaving early is allowed; your new school pays your old one.
- Counteroffers: when another school offers you a job, your school may counter with a raise and more years, more likely the more it wants to keep you.
- You can go back to high school any time a high school job is interested in you, on your high school reputation.
- College coaches have careers like high school coaches, and the best high school coaches in the state move up to Division III and Division II jobs.

### Recruiting

- The prospects: each year's class of high school seniors. Some come from your old high school state, from the schools on paper, so you may recruit kids you coached against, or coached. The rest are made up, from out of state. Each prospect has the 3b recruit rating, shown as stars (two to five).
- A new coach rating, Recruiting, starts at 40 for every coach, and a Recruiter perk makes your pitches stronger. Computer coaches have it too.
- Your board: up to 30 prospects you're recruiting, each with a priority (top, high or normal). Your staff's recruiting time each week is shared out by priority, like the practice plan (a top prospect gets about three times a normal one's time), so nothing needs doing every week unless you want to.
- The board screen: one line on the class (commitments, spots to fill, how many are on the board, NIL left, the biggest needs), then the prospects under headings (Committed, Top priority, High priority, Normal). Each prospect is one sentence, for example: "Marcus Hill, 4 stars, running back, Bellmont Greyhounds, in your old state. Leaning your way (72). Your NIL offer: $150,000. Also after him: Lakeshore State and Central Ivesdale. Visit: week 6." His buttons: priority (top, high, normal), NIL offer (make, raise or pull, with what's left read out), invite to a home game, and remove. At the bottom: find prospects (by position, stars, or from your old state) and the staff settings.
- How hands-off you are, three staff settings:
  - Staff fills the board (on to start): your staff adds the best fits for your needs and drops prospects who lose interest. Anyone you remove stays off, and you can add anyone.
  - Staff handles visits (on to start): the best three visitors for each home game.
  - Staff makes NIL offers (off to start): you set how much of the budget the staff can spend on its own (a quarter, a half, all of it); anything past that waits for you.
- The weekly report, in each week's results: only what changed (commitments, flips, visits) and decisions waiting for you, such as a prospect who wants more NIL to stay interested, each with its button right there. Ignore it and the staff keeps going.
- What a prospect cares about: the program's level, tradition and ranking, playing time at his position (your depth chart), the NIL offer against what he's looking for, the facilities, your reputation and Recruiting, and knowing you (players from your old school, and players you coached against, start more interested). Division III can't pay or give athletic scholarships, so there it's playing time, the program and you.
- Visits: invite up to three prospects to each home game. A win in front of them helps.
- Interest is in words ("leaning your way", "in your top three", "not interested") with a number. A prospect commits when one school leads him by enough, and can flip until signing day.
- Signing day comes after the regular season. The weekly report lists only what changed: commitments, flips and visits.
- Computer programs recruit on paper: each one's class size comes from its roster needs, and its level from its level, tradition, ranking, coach and NIL. The prospects on your board go somewhere real when you lose them, and the news says where.

### Money: revenue sharing and NIL

- Each program has money to pay its players: revenue sharing from the school, plus NIL from its booster collective. In the real game the revenue-sharing cap was $20.5 million per school in 2025-26, rising at least 4 percent a year, with most of it going to football. Here, in real dollars: a power program has about $12 million to $16 million a year for football, the rest of FBS about $2 million to $5 million, the FCS a few hundred thousand, Division II scholarships and very little NIL, and Division III nothing. The collective adds more, by booster enthusiasm.
- You spend it on NIL offers to recruits and on keeping your own players. Every player has a value from his ratings and position, and an underpaid starter is likelier to enter the portal.
- Facilities belong to the athletic department in college: they're set by level and tradition and improve on their own, so your money goes to players.

### The transfer portal

- One window a year, after the postseason, as the real January window works (January 2 to 16 in 2026).
- Players enter for playing time, pay, or a coaching change (yours or a computer program's), and players move up and down levels.
- You see the portal's players, by position and stars, and pursue them like recruits, with NIL offers. Computer programs take the rest on paper.
- Your own players in the portal can be kept with a better offer, if you have the money.

### Renaming schools

- Any school (high school or college), conference or bowl can be renamed, from a names screen with a text field for each, grouped by level and conference, with a search.
- The names can be copied out as a list and loaded back in, to share or to move to another device.
- Names you type are yours and stay on your device and in your saves. The game itself ships only made-up names.

### Screens

- The season screen, as now, plus your ranking, conference standings and the recruiting board.
- The recruiting board, the weekly recruiting report, the top 25s, the bowl list and the playoff brackets, signing day, the portal, contract offers and counteroffers, and the names screen.
- Every new screen moves VoiceOver to its heading, choices are buttons, and changes are announced once, briefly. Long lists (a conference, a top 25, the portal) are grouped under headings so they can be skipped through.

## The world

- A fictional state with six classes, from 1A (the smallest schools) to 6A (the largest). Bigger schools have more students to draw players from. All six arrive in Milestone 3a.
- Each school has a town, a mascot, colors, a class, enrollment, tradition (past success) and community support. Facilities and boosters come in Milestone 3b.
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

   Where it stands now (Nov 2026, after Milestone 2, the out-of-bounds house rule and running the clock), over 300 simulated 1A games: about 18 points per team, 59 percent runs at 5.3 yards a carry (about 174 rushing yards a team), 52 percent completions, 3 percent interceptions, about 6 penalties a team, two-thirds of extra points good, overtime in about 3 percent of games, and the team with the better starters (by 4 or more rating points) winning about two games in three.
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

- Play every snap, sim the game, or play its key moments: the computer calls it until it's close late, then you take over (Milestone 3b).
- Gridiron Duel's systems carry over: the game clock, timeouts, spikes and sideline routes, audibles, disguises and penalties. Their rules follow the level being played (see Rules by level).
- Running the clock: in the 4th quarter, the team with the lead can choose to run the clock, using 36 to 39 seconds between plays (the top of the usual range when the clock only restarts on the ready). It can't be combined with no huddle or a spike. Computer coaches always do it with a 4th-quarter lead.
- You can change the lineup between plays (see Depth chart and personnel).
- The opposing coach is computer-controlled, with its own ratings and scheme.
- Scouting lasts all season. Opposing coaches chart your habits across games, and your opponent prep shows theirs.

How it's built (step 4):

- Film study: the opponent's coordinator is asked to call plays 60 times in each of short, medium and long yardage (down and distance only, before it knows your habits), against your usual personnel, and the calls are tallied. The report shows as much as your opponent prep earned: a light week gives their run and blitz rates and favorite calls; a full week gives each situation's run or blitz rate and top two calls, and what beats their favorites; a heavy week adds personnel, disguises and the top three calls.
- Prep edge: on a snap when they run a call you studied (their top two overall for a light week, top two in that situation for a full week, top three for a heavy one), your side gets 0.05, 0.09 or 0.13 on the play-call scale, times 0.8 plus 0.4 times your Scouting rating out of 100.
- Your film: after each game, the calls you made by situation go into the season's film (older games count 0.6 each week). Before the next game, the other coach starts with that film, at 0.6 times (his Scouting rating minus 25) out of 60, so a good scout counters your habits from the first snap.
- After the game: the final score, box score, player stats and a short summary.
- Injuries (step 4): each team has a 0.28 percent chance on every scrimmage snap that a player on the field gets hurt, about 0.36 injuries a team a game. Ball carriers, tacklers, targets and covering defenders are 2.5 times likelier, and so are tired players and players with poor health. 45 percent are out for the rest of the game, 27 percent miss the next game, 15 percent two or three, 9 percent four to six, and 4 percent the season. An injured player stays on the depth chart and the next healthy player behind him plays. Injuries go home with the schools that keep their rosters and heal a game at a time at the end of each week.
- Punting: three punts on the punt team's call sheet. A regular punt. Pin it deep: aim to drop it at their 10; the punter reaches his average minus 2 (give or take 5), and out of that range it's a high, short kick of his average minus 7. In range, it lands 1 yard past the 10, give or take 8 minus 0.05 per point of kicking accuracy (3.5 to 7.5), with 1.3 times the usual shank chance. It can't be returned for a touchdown: a return unit fair-catches it 75 percent of the time and the rest are short returns against the coverage plus 10, and with nobody back the coverage downs it. Boom it: 6 yards longer (give or take 6), rolling 4 to 12 with nobody back, 1.4 times the shank chance, a quarter likelier to be blocked, and it outkicks the coverage: a return unit fair-catches only 12 percent, returns run against the coverage minus 10 with a typical return of 11, and return touchdowns are three times likelier. The computer pins it from its 50 and in, and booms it from its 20 and back, with a chance of 0.35 plus 0.012 a point of Game management over 20 (booming at 0.8 of that), and punts normally otherwise.
- Carries: the feature back is spelled on 15 percent of carries, and more often once he has 18 in a game, so even a run-first team spreads the load.

## Rules by level

Friday to Sunday follows each level's real rules as exactly as the game can: the national high school rules (NFHS) for high school, NCAA rules for college, and NFL rules for the pros. Each level has its own rules profile, and the engine reads every rule that differs by level from it instead of having it built in.

Rules change most years, so each level's rules get checked against current sources before that level is built. Items marked "to confirm" haven't been checked yet.

High school rules vary a little from state to state. Where they differ, the fictional state uses the most common choice.

### High school (NFHS), for Milestone 1

- 12-minute quarters and three timeouts per half. There's no two-minute warning.
- The clock stops on an incomplete pass, a change of possession, a score, a timeout, a fair catch and a touchback. In each case it starts again on the snap.
- House rule (changed from NFHS after playtesting, Nov 2026): going out of bounds stops the clock until the snap only in the last two minutes of each half. Earlier, the clock starts again when the ball is ready for play. Stopping it all game let teams combine for 600+ rushing yards.
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

Checked against current sources in November 2026. Items marked "to confirm" get checked against the 2026 rulebook while step 1 is built.

- 15-minute quarters and three timeouts per half.
- A two-minute timeout in each half, like the NFL's two-minute warning (since 2024).
- The clock keeps running after a first down, except in the last two minutes of each half (since 2023).
- Going out of bounds stops the clock until the ball is ready for play, except in the last two minutes of each half, when it waits for the snap. (This is the same as the high school house rule.)
- A penalty at the end of the first or third quarter carries over to the next quarter instead of giving an untimed down.
- Kickoffs are from the 35. Touchbacks are at the 25, and a fair catch inside the 25 on a kickoff counts as a touchback (since 2018).
- After a fair catch, the team can try a fair-catch kick from the spot (new in 2026).
- Tries are snapped from the 3-yard line, so an extra-point kick is about 20 yards. The defense can return a try for two points.
- No kicking tees for field goals and extra points.
- Defensive pass interference: a spot foul of up to 15 yards from the previous spot, and an automatic first down. Offensive pass interference: 10 yards (down from 15 in 2026).
- A missed field goal goes to the defense at the previous spot (the line of scrimmage), or the 20 if that was inside the 20 (to confirm).
- To confirm: whether a team can call two timeouts in a row.

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

### Milestone 3a: the high school job market

See Milestone 3a near the top.

### Milestone 3b: money and college offers

See Milestone 3b near the top.

### Milestone 4: college

See Milestone 4 near the top.

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
