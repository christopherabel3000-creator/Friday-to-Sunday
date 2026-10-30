// Friday to Sunday: the app, the main menu, the exhibition, and screen reader support
"use strict";
const SAVE_KEY = "friday-to-sunday-v1";
// Version of the game code. Raise it by 1 with every release (GitHub Pages and itch.io together).
// Saves record it, so older saves can be upgraded when they load.
const BUILD = 7;

/* ---------- The app ---------- */
// APP holds everything outside the game itself:
//   screen: "home" (the main menu), "exhibition", "newcoach", "coach", "pick", "season", "week",
//     "standings", "schedule", "bracket", "summary", "simming", "roster", "player", "depth", "practice",
//     "install", "preport", "scout", "saves" or "game"
//   ex: the exhibition matchup { seed, schools: [home, away], you: 0, 1 or "watch", styles: { off, def } }
//   view: what the roster screens show { ctx, team, pair, player, back, edit, sel } (ui_depth.js)
//   weekView, weekFrom: the week the results screen shows, and the screen that opened it
//   reportNext: "kickoff" when the practice report leads straight into the game
//   scoutBack: the screen the scouting report goes back to
//   coachDraft: the coach being created (ui_career.js), coachBack: the screen your coach's page goes back to
//   cloud: this game's cloud save { key, ver, at } (cloud.js)
// S (engine.js) is the game being played, SEASON (season.js) the season, and CAREER (career.js) your
// coach and the seasons you've finished.
let APP = null;
function newExhibition() {
  const seed = newSeed(), g = dice(seed), towns = new Set(), colors = new Set(), mascots = g.shuffle(MASCOTS);
  const h = genSchool(g, { id: "h", cls: "1A", mascot: mascots[0], towns, colorsTaken: colors });
  const v = genSchool(g, { id: "v", cls: "1A", mascot: mascots[1], towns, colorsTaken: colors, otherAbbr: h.abbr });
  APP.ex = { seed, schools: [h, v], you: 0, styles: { off: h.off, def: h.def } };
}
function startExhibition() {
  const ex = APP.ex, you = ex.you, mine = i => you === i;
  const next = i => mine(i) && ex.nextDepth && ex.nextDepth.team === i ? ex.nextDepth.depth : null;
  initGame({ level: "hs", cpu: [!mine(0), !mine(1)], styles: [mine(0) ? ex.styles : null, mine(1) ? ex.styles : null],
    rot: [mine(0) ? ex.rot : "normal", mine(1) ? ex.rot : "normal"], depth: [next(0), next(1)] }, ex.schools);
  // A depth chart for the next game only is used up by this game
  ex.nextDepth = null; ex.depthMode = "always";
  APP.screen = "game";
}
// A school as the exhibition screen shows it: with your changes for the next game, if any
const homeTeam = i => APP.ex.nextDepth && APP.ex.nextDepth.team === i ? Object.assign({}, APP.ex.schools[i], { depth: APP.ex.nextDepth.depth }) : APP.ex.schools[i];
const teamTown = tm => tm.town || tm.school;
const teamMascot = tm => tm.mascot || tm.name;
// A game that hasn't finished: in progress, in the exhibition or the season
const liveGame = () => !!(S && S.teams && S.phase !== "final");
const liveExhibition = () => liveGame() && !S.season;
const liveSeasonGame = () => liveGame() && !!S.season;

/* ---------- Saving ---------- */
// The whole app saves on the device after every tap: the season, and the game in progress
const currentSave = () => ({ v: 1, build: BUILD, app: APP, game: S, season: SEASON, career: CAREER });
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(currentSave())); } catch (e) {} }
function loadSaved() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); return s && s.v === 1 && s.app && s.app.ex ? upgradeSave(s) : null; } catch (e) { return null; }
}
// A save from an older version gets what's new since then
function upgradeSave(s) {
  // Version 2: fatigue and rotation in a game in progress
  const g = s.game;
  if (g && g.teams) g.teams.forEach(t => { if (!t.rot) t.rot = "normal"; t.players.forEach(p => { if (p.en == null) p.en = 100; if (p.rest == null) p.rest = false; }); });
  // Version 3: the season. The exhibition moved off the main menu, and roster screens say whose
  // depth chart they show.
  const v = s.app.view;
  if (v && !v.ctx) { v.ctx = v.back === "game" ? "game" : "ex"; if (v.back === "home") v.back = "exhibition"; }
  if ((s.build || 0) < 3 && s.app.screen === "home") s.app.screen = "exhibition";
  // Version 4: practice, playbooks and injuries. Every school that keeps its roster gets a playbook
  // from its schemes, and the season gets a practice plan.
  const book = sc => { if (sc && sc.players && !sc.mastery) sc.mastery = genMastery(dice(hashSeed(`${sc.seed || 0}:${sc.id}:book`)), (sc.coach && sc.coach.off_style) || sc.off, (sc.coach && sc.coach.def_style) || sc.def); };
  if (s.app.ex) s.app.ex.schools.forEach(book);
  const se = s.season;
  if (se && se.schools) {
    Object.values(se.schools).forEach(book);
    if (!se.plan) Object.assign(se, { plan: newPlan(), practice: null, cpuWeek: Math.max(0, (se.week || 1) - 1), film: null, injLog: {} });
    const me = se.myId && se.schools[se.myId];
    if (me && me.players) me.players.forEach(p => { if (p.o0 == null) p.o0 = ovr(p, p.pos); });
  }
  // Version 5: your career. A season already under way keeps its unnamed coach, who can be named on
  // his page; a season still waiting for its school is dropped, to start with a new coach.
  if (!s.career && (s.build || 0) < 5) {
    const me = se && se.myId && se.schools && se.schools[se.myId];
    if (me && me.coach) { me.coach.you = true; s.career = { v: 1, coach: me.coach, seasons: [] }; }
    else if (se) { s.season = null; if (["pick", "season"].includes(s.app.screen)) s.app.screen = "home"; }
  }
  // Version 6: more seasons. A season gets its year, the state its first year and seed, and every
  // school its first tradition. A season already under way had no camp; one still waiting for its
  // school gets camp.
  const se6 = s.season;
  if (se6 && se6.schools && se6.year == null) {
    const y = thisYear(), picking = se6.phase === "pick";
    Object.assign(se6, { world: se6.seed, year: y, year0: y, pre: picking ? PRESEASON_WEEKS : 0, camp: 0, history: [] });
    if (picking) se6.cpuWeek = -PRESEASON_WEEKS;
    Object.values(se6.schools).forEach(sc => { if (sc.trad0 == null) sc.trad0 = sc.trad; });
  }
  s.build = BUILD;
  return s;
}

/* ---------- The main menu ---------- */
function vHome() {
  const live = liveGame(), me = SEASON && SEASON.myId ? mySchool() : null, c = CAREER && CAREER.coach;
  const restart = `<button class="btn ghost" data-a="newcareer">${confirming === "newcareer" ? "Tap again to start over" : "Start a new career"}</button>`;
  let season;
  // Where the season stands: its week, camp, or the offseason, and the button that picks it up
  const ph = SEASON && SEASON.phase, when = ph === "over" ? `${SEASON.year} season over` : ph === "offseason" ? `${SEASON.year} offseason` : ph === "preseason" ? `${SEASON.year} preseason camp` : SEASON ? weekName(Math.min(SEASON.week, LAST_WEEK)) : "";
  const go = ph === "over" ? ["summary", "Season summary"] : ph === "offseason" ? ["season", "Continue the offseason"] : ph === "preseason" ? ["season", "Back to camp"] : ["season", "Continue the season"];
  if (me) season = `<section class="panel teamcard" style="--team:${me.color}">
      <span class="eyebrow">${esc(coachFullName(c))} · ${when}</span>
      <h2 class="h2small">${esc(nameOf(me.id))}</h2>
      <p class="muted">${esc(ph === "offseason" ? "The seniors are graduating. The next season starts with camp." : ph === "preseason" ? `Camp week ${SEASON.camp} of ${SEASON.pre}. No games yet.` : seasonStatus())}</p>
      <button class="btn" data-a="${go[0]}">${go[1]}</button>
      <div class="choices"><button class="btn ghost" data-a="coach">Your coach</button>${restart}</div>
    </section>`;
  else if (c && SEASON) season = `<section class="panel">
      <span class="eyebrow">${esc(coachFullName(c))}</span>
      <h2 class="h2small">Looking for a job</h2>
      <p class="muted">Eight schools in District ${SEASON.district} need a head coach.</p>
      <button class="btn" data-a="season">Pick your school</button>
      <div class="choices"><button class="btn ghost" data-a="coach">Your coach</button>${restart}</div>
    </section>`;
  else season = `<section class="panel">
      <span class="eyebrow">Career</span>
      <h2 class="h2small">Your first head coaching job</h2>
      <p class="muted">Create your coach and take over a small 1A school. Play a ten-game schedule, win your district, and make a run in the state playoffs.</p>
      <button class="btn" data-a="career">${APP.coachDraft ? "Finish creating your coach" : "Start a career"}</button>
    </section>`;
  return `
    <div class="masthead">
      <p class="eyebrow">High school football</p>
      <h1>Friday to <em>Sunday</em></h1>
      <p class="muted">Coach a small-town team. Call every play.</p>
    </div>
    ${live ? `<section class="panel"><p>${S.season ? "Your season game" : "An exhibition game"} is in progress: ${esc(boardSummary())}</p><button class="btn" data-a="resume">Back to the game</button></section>` : ""}
    ${season}
    <section class="panel">
      <span class="eyebrow">Exhibition</span>
      <p class="muted">One game between two made-up schools, to try a scheme or just watch.</p>
      <button class="btn ghost" data-a="exhibition">Exhibition game</button>
    </section>
    <section class="panel">
      <span class="eyebrow">Saves</span>
      <p class="muted">The game saves on this device as you play. Save to the cloud or keep a save code to play on another device.</p>
      <button class="btn ghost" data-a="saves">Cloud saves and save codes</button>
    </section>`;
}

/* ---------- The exhibition ---------- */
function styleCfgHtml(isOff) {
  const ids = isOff ? OFF_STYLE_IDS : DEF_STYLE_IDS, book = isOff ? OFF_STYLES : DEF_STYLES, cur = APP.ex.styles[isOff ? "off" : "def"] || "bal";
  const a = isOff ? "ostyle" : "dstyle", lbl = isOff ? "Offensive style" : "Defensive style";
  return `<div style="display:grid;gap:6px" role="group" aria-label="${lbl}"><span class="eyebrow" aria-hidden="true">${lbl}</span><div class="seg grid2">
      ${ids.map(id => `<button data-a="${a}" data-v="${id}" aria-pressed="${cur === id}">${book[id].short}</button>`).join("")}
    </div><p class="muted styledesc">${esc(book[cur].desc)}</p></div>`;
}
// One sentence about a school
function schoolLine(s) {
  const two = twoWayStarters(s).length;
  return `Coach ${coachName(s.coach)}. ${OFF_STYLES[s.off].name} offense, ${DEF_STYLES[s.def].name} defense. ${plural(s.players.length, "player")}, ${two} of them starting on both sides of the ball.`;
}
// Unit by unit, two schools side by side (column headings la and lb, the abbreviations by default)
function matchupTable(a, b, la, lb) {
  const ua = unitRatings(a), ub = unitRatings(b);
  const rows = [["Quarterback", "qb"], ["Running back", "rb"], ["Receivers", "wr"], ["Run blocking", "runBlock"], ["Pass protection", "passPro"],
    ["Run defense", "runD"], ["Pass rush", "passRush"], ["Coverage", "cover"], ["Kicker", "k"], ["Punter", "p"]];
  return `<div class="tablewrap flush"><table aria-label="Matchup by unit">
    <thead><tr><td></td><th scope="col">${esc(la || a.abbr)}</th><th scope="col">${esc(lb || b.abbr)}</th></tr></thead>
    <tbody>${rows.map(([l, k]) => `<tr><th scope="row">${l}</th><td>${ua[k]}</td><td>${ub[k]}</td></tr>`).join("")}</tbody></table></div>`;
}
function vExhibition() {
  const ex = APP.ex, [h, v] = [homeTeam(0), homeTeam(1)], live = liveExhibition(), blocked = liveSeasonGame();
  const card = (s, i) => `<section class="panel teamcard" style="--team:${s.color}">
      <p class="eyebrow">${i ? "Visitors" : "Home"} · Class ${s.cls}</p>
      <h3>${esc(s.town)} ${esc(s.mascot)}</h3>
      <p class="muted">${esc(schoolLine(s))}</p>
      <button class="btn ghost" data-a="roster" data-t="${i}">Roster and depth chart</button>
    </section>`;
  const youBtn = (val, label) => `<button data-a="you" data-v="${val}" aria-pressed="${String(ex.you) === String(val)}">${label}</button>`;
  return `
    <div class="masthead">
      <p class="eyebrow">Exhibition game · Class 1A</p>
      <h2 data-focus tabindex="-1">${esc(v.town)} at ${esc(h.town)}</h2>
      <p class="muted">Two made-up small schools, under high school rules. Every player is rated, and the ratings decide how well each call works.</p>
    </div>
    ${live ? `<section class="panel"><p>This game is in progress: ${esc(boardSummary())}</p><button class="btn" data-a="resume">Back to the game</button></section>` : ""}
    ${card(h, 0)}${card(v, 1)}
    <section class="panel">
      <span class="eyebrow">Matchup</span>
      ${matchupTable(h, v)}
    </section>
    <section class="panel">
      <div style="display:grid;gap:6px" role="group" aria-label="You coach"><span class="eyebrow" aria-hidden="true">You coach</span><div class="seg">
        ${youBtn(0, esc(h.mascot))}${youBtn(1, esc(v.mascot))}${youBtn("watch", "Just watch")}
      </div></div>
      ${ex.you === "watch" ? `<p class="muted styledesc">Both teams are coached by the computer. Tap through the plays, or sim to the end.</p>` : styleCfgHtml(true) + styleCfgHtml(false)}
      ${blocked ? `<p>Your season game is in progress. Finish it, or sim it, before you kick off an exhibition.</p><button class="btn" data-a="resume">Back to your season game</button>`
        : `<button class="btn" data-a="kickoff">${live ? "Start a new game" : "Kick off"}</button>`}
      <button class="btn ghost" data-a="newmatch">New matchup</button>
    </section>`;
}

/* ---------- How to play ---------- */
let helpOpen = false;
function vHelp() {
  const sec = (h, body) => `<section class="panel help"><h2>${h}</h2>${body}</section>`;
  const ul = items => `<ul class="hlist">${items.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const Rl = RULES.hs;
  return `
    <div class="masthead">
      <p class="eyebrow">Friday to Sunday</p>
      <h1>How to <em>play</em></h1>
      <p class="muted">You're the head coach. Each snap, both sides call a play in secret, then the play runs. Your calls and your players decide it.</p>
    </div>
    ${sec("A snap, step by step", `<ol class="steps">
        <li>The offense picks its personnel (who's on the field) and a play, then locks it in.</li>
        <li>The defense sees the offense's personnel, but not the play. It picks a package and a call, and decides whether to show its real look or disguise it.</li>
        <li>The offense sees the defense's look at the line and can audible to a different play once.</li>
        <li>The play runs. The result names the players, and says who won the snap and why.</li>
      </ol>`)}
    ${sec("Your players", ul([
      "Every player is rated from 1 to 100 in speed, strength, awareness and the skills for each position. Each one has an overall rating at every position.",
      "Small-school starters mostly rate in the 30s to 50s. At a school this size most starters play both ways.",
      "The depth chart decides who's on the field for each personnel package. Spread sets put your fourth receiver out there; heavy sets bring in tight ends and a fullback.",
      "On every snap the players matter: the line against the front on runs, the protection against the rush, the passer and receiver against the coverage, the ball carrier against the tacklers.",
      "A quick quarterback slips some sacks and takes off when nobody's open. Kickers have a range set by their leg."
    ]))}
    ${sec("Your coach", ul([
      "A career starts with your coach: a name, a background and your schemes. Every new head coach starts at 40 in each rating, plus what the background brings.",
      "Offense and Defense give a small edge on every snap on that side of the ball. Special teams helps field goals, punts and kick coverage. Development speeds up your players' growth in practice. Motivation helps late in close games and in comebacks.",
      "Game management: at 45 and up, your staff gives the odds of converting on fourth down as a percentage. Below that, you get a rough idea.",
      "Scouting improves scouting reports and the edge from film study. At 45 and up, the same film time gives a fuller report. At 60 and up, your staff sometimes spots a disguised look at the line.",
      "A former quarterback's quarterbacks grow faster. A former lineman's linemen grow faster, and that coach's teams run the ball, and stop the run, a little better. A special teams ace's kickers and punters grow faster.",
      "When you sim a game, your ratings also decide how well your coach calls the plays.",
      "You bring your schemes to your new school. The team still knows its last coach's playbook, and learns yours in practice."
    ]))}
    ${sec("XP and perks", ul([
      "Your coach earns XP: 10 for a win and 20 for a playoff win, 15 for an upset (beating a team favored by 7 or more), 15 for making the playoffs, 40 for a district title and 60 for a state title.",
      "When you call the plays yourself, every 4 snaps your calls win are worth a point. Simmed snaps don't count.",
      "At the end of the season, every point your players' overall ratings went up is worth a point too.",
      "Spend XP on your coach's page. Raising a rating a point costs the rating minus 20, so 46 to 47 costs 26.",
      "Perks cost 150 to 250 XP. Some speed up a unit's growth, some give an edge on certain plays, and some help scouting, motivation or installs. Each perk's page entry says what it does."
    ]))}
    ${sec("The season", ul([
      "Pick your school from the eight in your district. You take over as head coach. Each school's card says what its last coach ran, and how much of your playbook it already knows.",
      "Every season opens with three weeks of preseason camp: practice, and no games. With no opponent to study, opponent prep time goes into install, so camp is the time to teach your plays. Hold each week's practice, or sim the rest of camp.",
      "Weeks 1 to 3 are against schools from other districts. Weeks 4 to 10 are the district schedule: you play everyone in your district once.",
      "The top two in each district make the 16-team state playoffs. Ties in the standings go to head-to-head, then the overall record, then point differential in district games, up to 14 points a game.",
      "District champions host the first round. After that the better record hosts, and the state championship is at a neutral site.",
      "Each week, play your game snap by snap or sim it. Your coach calls the plays in a sim, and your players' stats count either way.",
      "Games between schools in your district run on the full game engine behind the scenes. The rest of the state is simmed from each team's ratings.",
      "Your schemes, rotation and depth chart carry from week to week. A depth chart for the next game only goes back to normal after that game.",
      "Once there's a state champion, the season summary has your record and finish, the games to remember, your leaders and who improved the most."
    ]))}
    ${sec("The offseason", ul([
      "After the season summary comes the offseason. Your seniors graduate, and the offseason screen shows who's leaving and who's coming back.",
      "Starting the next season, everyone else gets a summer older: players grow over the summer, a few leave the team, and a new class of freshmen comes out. How many depends on your school's size and tradition.",
      "Tradition follows results, a little each year, and better tradition brings out more freshmen, and better ones.",
      "The rest of the state moves on with you: every school graduates its seniors and brings in a new class, and the schedule is new each year.",
      "Your players keep their career stats. Their screens show what they did before this season."
    ]))}
    ${sec("Practice", ul([
      "Each week has ten practice blocks. Give each area none, light, normal or heavy, and the blocks are shared out by weight. Presets give a quick start: Balanced, Install, Game prep and Rest.",
      "Fundamentals grow the players in each unit: quarterbacks, running backs and receivers, the offensive line, the defensive front, the secondary and the kickers. Growth depends on the player's work ethic, his year, your Development rating and the time spent, and slows as he nears his potential.",
      "Contact trades growth against injuries: shorts, shells or full pads. Conditioning builds stamina. Recovery means fewer practice injuries, faster healing and fresher legs on game day.",
      "Practice happens once a week, before the game. Hold it yourself to read the practice report first, or it happens on its own when you play or sim the game.",
      "The practice report lists only what changed: who got better, who got hurt, and the plays your team learned."
    ]))}
    ${sec("Playbook and mastery", ul([
      "Your team knows each play from 0 to 100. A small school starts out knowing about four plays on each side of the ball well, the core of its schemes.",
      "A play your team knows well is a small edge. A play it's still learning costs edge, and draws more flags and fumbles. The call sheet shows each play's mastery.",
      "Install time raises mastery. Pick up to three plays to focus on, or spread it over the whole playbook. Change your schemes and you'll have new plays to learn.",
      "The other team's coach calls the plays his team knows best, too."
    ]))}
    ${sec("Scouting", ul([
      "Opponent prep is film study of this week's opponent. A little time gives a short report; more gives their habits in short, medium and long yardage, the personnel they use, how often they blitz and disguise, and what beats their favorite calls.",
      "On snaps when they run a call you studied, your team gets a small edge.",
      "Every coach you play has watched your earlier games, and starts out knowing your habits. A good scout trusts that film more."
    ]))}
    ${sec("Injuries", ul([
      "Players get hurt now and then in games and in practice. Ball carriers, tacklers, tired players and players with poor health get hurt the most.",
      "Most injuries cost the rest of a game or the next one. Some cost weeks, and a few end the season.",
      "An injured player stays on your depth chart, and the next healthy player behind him plays. Rosters say who's hurt and for how long."
    ]))}
    ${sec("Depth chart and fatigue", ul([
      "Change the depth chart from your roster: pick a position, pick a player, then start him, move him up or down, or take him off. Reset to automatic puts everyone back by the ratings.",
      "Before a game, changes can apply to every game or to the next game only. After that game, the depth chart goes back to how it was.",
      "During a game, Change the lineup on the call sheet makes substitutions for the rest of that game.",
      "Players tire with every snap and recover on the bench, between quarters, at halftime and in timeouts. Two-way starters wear down the most, and a tired player plays below his ratings.",
      "Your rotation setting decides when tired starters take a breather: Keep starters in, Normal, or Rotate often. They only come out when a fresh backup is listed behind them."
    ]))}
    ${sec("Winning the call", ul([
      "Every play has calls it beats and calls that beat it. Inside Run gashes Cover 2 but runs into a Run Blitz; Deep Shot burns Man Coverage but dies against Prevent.",
      "Personnel matters too. Heavy sets run better, spread sets throw better, and each package matches up differently against Base, Nickel, Dime and Goal Line.",
      "A good call makes a good result more likely, never certain. Better players tilt every snap, and a good call can still beat a better team."
    ]))}
    ${sec("Audibles, disguises and styles", ul([
      "At the line, the offense sees a look like \"Eight in the box\" or \"Two high safeties,\" each with a hint about which call it usually means. Defenses can disguise it, at the cost of a step at the snap.",
      "Each team has an offensive style (Balanced, Air Raid, Ground &amp; Pound, West Coast) and a defensive style (Balanced, Blitz-Happy, No-Fly Zone, Run Stuffers) that make some calls stronger and others weaker.",
      "Every coach has ratings too. The other team's coach scouts your habits as the game goes on."
    ]))}
    ${sec("High school rules", ul([
      `${Rl.qLen / 60}-minute quarters and three timeouts each half. There's no two-minute warning.`,
      "The clock stops for an incomplete pass, a player going out of bounds, a change of possession, a score and a timeout, and starts again on the snap.",
      "It also stops for a first down and after a penalty, and starts again when the ball is ready for play, so a little less time comes off.",
      `Kickoffs are from the ${Rl.kickoff.spot}. Any kick that reaches the end zone is a touchback at the ${Rl.kickoff.tb}, and nobody returns it.`,
      "A missed field goal is treated like a punt: into the end zone it's a touchback at the 20.",
      `Tries are from the ${100 - Rl.tryTwo}-yard line, so an extra point is a ${xpDistFor(Rl)}-yard kick. Plenty of small schools go for two.`,
      "Pass interference is 15 yards and doesn't give an automatic first down. Only roughing the passer or kicker does.",
      `A lead of ${Rl.runClock.margin} or more in the second half starts a running clock that keeps going for the rest of the game.`
    ]))}
    ${sec("Overtime", ul([
      "There's no clock. Each team gets a series starting first and goal at the 10, and the defense can't score: a turnover just ends the series.",
      "A field goal can be kicked on any down. After both series, the team ahead wins. If it's still tied, there's another period, and the first choice goes to the other team.",
      "Each team gets one timeout per period, and nobody has to go for two."
    ]))}
    ${sec("Clock and situations", ul([
      "Late in a half: use timeouts, or go no huddle (faster snaps, but nobody can change personnel).",
      "In the last two minutes of each half you can also spike the ball, or run a play to the sideline to stop the clock.",
      "Fourth down: send out the punt team or field goal unit, or keep the offense on the field and go for it. The defense sees who runs on, and kicking units can run a fake.",
      "Leading late with the other team out of timeouts, you can kneel to run out the clock.",
      "After your team scores, you can call an onside kick before the kickoff. High school teams don't have to announce one, so a surprise works a lot more often. Trailing in the last two minutes, you're asked every time."
    ]))}
    ${sec("Saves", ul([
      "The game saves on this device after every tap.",
      "Save to the cloud to get a 12-character cloud save code. Enter it on another device to load your game there. Anyone with the code can load or replace that save, so keep it like a password.",
      "If the cloud save was changed on another device since you last saved or loaded it here, the game asks before replacing it.",
      "A save code is your whole game as text. Copy it into Notes or an email, or save it as a file, and load it on any device.",
      "Loading a save, or starting a new career, keeps the game you had as a backup, so you can switch back."
    ]))}
    ${sec("Tips", ul([
      "Check the matchup table before kickoff. Attack the other team's weakest unit. \"On paper\" says who the ratings favor, and by about how much.",
      "Read the halftime report. It shows each side's habits by down and distance and what beats them.",
      "Open the box score, player stats and play-by-play at the bottom of any game screen. Sim to the end finishes the game with your coach calling the plays.",
      "With VoiceOver, each new screen starts at its heading or the play result. Swipe right to hear the rest."
    ]))}
    <button class="btn" data-a="help">${APP && APP.screen === "game" ? "Back to the game" : "Back"}</button>
    <p class="muted" style="font-size:14px;text-align:center">Friday to Sunday, version ${BUILD}</p>`;
}
// The extra point distance for a level's rules (from its two-point spot)
const xpDistFor = Rl => 100 - Rl.tryXp + Rl.fgAdd;

/* ---------- Drawing the screen ---------- */
const GAME_VIEWS = { call: vCall, result: vResult, pat: vPAT, trychoice: vTry, penalty: vPenalty, final: vFinal, halftime: vHalftime, los: vLOS, kickchoice: vKick, toss: vToss };
const SCREENS = { home: vHome, exhibition: vExhibition, pick: vPick, season: vSeason, week: vWeek, standings: vStandings, schedule: vSchedule,
  bracket: vBracket, simming: vSimming, roster: vRoster, player: vPlayer, depth: vDepthEdit, practice: vPractice, install: vInstall, preport: vPReport, scout: vScout,
  newcoach: vNewCoach, coach: vCoach, summary: vSummary, saves: vSaves, offseason: vOffseason, newyear: vNewYear };
function currentView() {
  if (helpOpen) return vHelp;
  if (APP.screen === "game" && S && S.teams) return GAME_VIEWS[S.phase] || vHome;
  return SCREENS[APP.screen] || vHome;
}
function render() {
  if (typeof document === "undefined") return;
  const app = document.getElementById("app");
  const view = currentView();
  const on = !Sound.muted();
  const icon = on
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  const homeBtn = APP.screen !== "home" && APP.screen !== "simming" && !helpOpen ? `<button class="soundbtn" data-a="gohome">Home</button>` : "";
  const top = `<div class="topbar">${homeBtn}<button class="soundbtn" data-a="help" aria-expanded="${helpOpen}">${helpOpen ? "Close How to play" : "How to play"}</button><button class="soundbtn" data-a="mute" aria-pressed="${on}">${icon}Sound ${on ? "on" : "off"}</button></div>`;
  const key = screenKey(view), prev = focusSig(app);
  app.innerHTML = top + view() + (APP.screen === "game" && !helpOpen ? vExtras() : "");
  placeFocus(app, key, prev);
}

/* ---------- Screen reader support ---------- */
// Every tap redraws the screen. A redraw that stays on the same screen (picking a play, toggling a
// setting) puts focus back on the same control. A redraw that lands on a new screen moves focus to
// that screen's heading or main block, so VoiceOver starts reading the new screen from the top.
let lastKey = null, srTimer = null;
function screenKey(view) {
  const g = APP.screen === "game" && S ? [S.phase, S.side, S.playId || 0, S.toss ? S.toss.step : "", S.pen ? S.pen.code : "", S.twoPt ? 1 : 0, S.locked ? 1 : 0] : [];
  // The season's week and phase, except while a sim is running (its progress shouldn't move focus)
  const sea = SEASON && APP.screen !== "simming" ? [SEASON.seed, SEASON.week, SEASON.phase, APP.weekView || ""] : [];
  return [view.name, APP.screen, APP.view ? APP.view.ctx : "", APP.view ? APP.view.team : "", APP.view ? APP.view.player : "", APP.view ? APP.view.edit : "", APP.ex ? APP.ex.seed : ""].concat(g, sea).join("|");
}
function focusSig(app) {
  const el = document.activeElement;
  if (!el || el === document.body || !app.contains(el)) return null;
  if (el.id) return { id: el.id };
  const b = el.closest("[data-a]");
  return b ? { a: b.dataset.a, v: b.dataset.v, t: b.dataset.t, c: b.dataset.c } : null;
}
// An action can name the control that should have focus after the redraw (focusNext)
let focusNext = null;
function placeFocus(app, key, prev) {
  const changed = lastKey !== null && key !== lastKey;
  lastKey = key;
  let el = null;
  if (focusNext && focusNext.id) { const f = document.getElementById(focusNext.id); focusNext = null; if (f) { try { f.focus({ preventScroll: false }); } catch (e) {} return; } }
  if (focusNext) { prev = focusNext; focusNext = null; if (changed) { const f = [...app.querySelectorAll("[data-a]")].find(b => b.dataset.a === prev.a && b.dataset.v === prev.v); if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} return; } } }
  if (!changed) {
    if (!prev) return;
    if (prev.id) el = document.getElementById(prev.id);
    else el = [...app.querySelectorAll("[data-a]")].find(b => b.dataset.a === prev.a && b.dataset.v === prev.v && b.dataset.t === prev.t && b.dataset.c === prev.c);
    if (!el || el.disabled) el = app.querySelector("[data-focus]");
  } else {
    el = app.querySelector("[data-focus]") || app.querySelector("h1, h2");
    if (el && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  }
  if (el) try { el.focus({ preventScroll: true }); } catch (e) {}
}
// Speak a short message without moving focus (a timeout, a toggle)
function announce(text) {
  if (typeof document === "undefined" || !text) return;
  const sr = document.getElementById("sr"); if (!sr) return;
  sr.textContent = "";
  clearTimeout(srTimer);
  srTimer = setTimeout(() => { sr.textContent = text; }, 80);
}
const scrollTop = () => { if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0); };

/* ---------- Events ---------- */
function preSnap(a) {
  const pre = S && S.teams ? { teams: true, snap: S.snap, quarter: S.quarter, phase: S.phase, scores: [S.teams[0].score, S.teams[1].score], lastId: S.last && S.last.id } : { phase: S && S.phase };
  if (a === "pen" && S && S.pen && S.pen.pre) pre.scores = S.pen.pre.scores.slice();
  return pre;
}
// Some buttons need a second tap within a few seconds (ending a game, simming a season, starting
// over). confirming names the button waiting for its second tap; any other tap calls it off.
let confirming = null, confirmTimer = null, priorConfirm = null;
function confirmed(flag) {
  clearTimeout(confirmTimer);
  if (priorConfirm === flag) return true;
  confirming = flag;
  confirmTimer = setTimeout(() => { if (confirming === flag) { confirming = null; render(); } }, 3500);
  return false;
}
// The roster screens for a season school. From the week ahead, the other button shows this week's
// opponent.
function seasonRoster(id) {
  const gm = SEASON.myId && APP.screen === "season" ? myGameIn(SEASON.week) : null;
  const pair = gm && !played(gm) ? [SEASON.myId, opponentIn(gm, SEASON.myId)] : [id];
  APP.view = { ctx: "season", team: id, pair, back: APP.screen };
  APP.screen = "roster";
}
// The screen for the season as it stands
const seasonScreen = () => !SEASON ? "home" : SEASON.phase === "pick" ? "pick" : SEASON.phase === "offseason" ? "offseason" : "season";
function act(a, ds) {
  ds = ds || {};
  const pre = preSnap(a);
  if (a === "mute") { Sound.toggle(); render(); return; }
  // The help screen sits on top of whatever is going on; it never touches the game itself
  if (a === "help") { helpOpen = !helpOpen; render(); scrollTop(); return; }
  // Nothing else while a season sim is running
  if (simJob) return;
  priorConfirm = confirming; confirming = null;
  const inGame = APP.screen === "game" && S && S.teams;
  switch (a) {
    // The main menu and the exhibition
    case "gohome": APP.screen = "home"; scrollTop(); break;
    case "exhibition": APP.screen = "exhibition"; scrollTop(); break;
    case "you": { const ex = APP.ex; ex.you = ds.v === "watch" ? "watch" : +ds.v; if (ex.you !== "watch") ex.styles = { off: ex.schools[ex.you].off, def: ex.schools[ex.you].def }; break; }
    case "ostyle": case "dstyle": {
      const ids = a === "ostyle" ? OFF_STYLE_IDS : DEF_STYLE_IDS, k = a === "ostyle" ? "off" : "def";
      if (!ids.includes(ds.v)) break;
      if (APP.screen === "newcoach") (APP.coachDraft = APP.coachDraft || newDraft())[k] = ds.v;
      // Your schemes are your coach's: they go with him to the next job
      else if (APP.screen === "season" && SEASON && SEASON.myId) { const me = mySchool(); me[k] = ds.v; me.coach[k + "_style"] = ds.v; }
      else APP.ex.styles[k] = ds.v;
      break;
    }
    // A new matchup drops an exhibition game, never your season game
    case "newmatch": newExhibition(); if (S && !S.season) S = null; APP.screen = "exhibition"; scrollTop(); break;
    case "kickoff": if (!liveSeasonGame()) { startExhibition(); scrollTop(); } break;
    case "rematch": if (S && !S.season) { startExhibition(); scrollTop(); } break;
    case "resume": if (S && S.teams) APP.screen = "game"; scrollTop(); break;
    // The season
    // Your career: creating your coach, then a job
    case "career": case "season":
      if (!CAREER || !SEASON) { if (!APP.coachDraft) APP.coachDraft = newDraft(); draftErr = false; APP.screen = "newcoach"; }
      else APP.screen = seasonScreen();
      scrollTop(); break;
    case "cbg": if (BACKGROUNDS[ds.v] && APP.coachDraft) { APP.coachDraft.bg = ds.v; announce(`${BACKGROUNDS[ds.v].name}: ${raisedLine(makeCoach("", "", ds.v))}.`); } break;
    case "makecoach": if (makeCoachNow()) { APP.screen = "pick"; scrollTop(); } break;
    case "coach": if (CAREER) { if (APP.screen !== "coach") APP.coachBack = APP.screen; APP.screen = "coach"; scrollTop(); } break;
    // Spending XP: a rating point, or a perk. Focus stays on the button; the result is read out.
    case "xprate": if (CAREER) announce(raiseRating(ds.v).say); break;
    case "perk": if (CAREER) announce(learnPerk(ds.v).say); break;
    case "summary": if (SEASON && ["over", "offseason"].includes(SEASON.phase) && SEASON.myId) { recordCareerSeason(); APP.screen = "summary"; scrollTop(); } break;
    // Preseason camp: on to the next week, or the rest of camp at once (with a report on all of it)
    case "campnext":
      if (!inCamp()) break;
      campNext(); APP.reportView = null; APP.screen = "season";
      if (!inCamp()) announce("Camp is over. Week 1 is next.");
      scrollTop(); break;
    case "campsim":
      if (!inCamp() || !confirmed("campsim")) break;
      SEASON.campReport = mergeReports(simCamp()); APP.reportView = SEASON.campReport ? "camp" : null; APP.screen = SEASON.campReport ? "preport" : "season"; scrollTop(); break;
    // The offseason, then the next season
    case "offseason":
      if (!SEASON || SEASON.phase !== "over" || !SEASON.myId) break;
      recordCareerSeason(); SEASON.phase = "offseason"; APP.screen = "offseason"; scrollTop(); break;
    case "nextyear":
      if (!SEASON || SEASON.phase !== "offseason") break;
      if (S && S.season) S = null;
      nextSeason(); APP.screen = "newyear"; scrollTop(); break;
    case "newyear": if (SEASON && SEASON.yearReport) { APP.screen = "newyear"; scrollTop(); } break;
    case "newcareer":
      if (!confirmed("newcareer")) break;
      keepBackup();
      if (S && S.season) S = null;
      CAREER = null; SEASON = null; APP.coachDraft = newDraft(); draftErr = false; APP.cloud = null;
      APP.screen = "newcoach"; scrollTop(); break;
    case "takejob": if (pickSchool(ds.v)) { APP.screen = "season"; scrollTop(); } break;
    case "playgame": case "simgame": {
      if (!SEASON || !SEASON.myId) break;
      if (isMyGame() && S.phase !== "final") { APP.screen = "game"; scrollTop(); break; }
      // Your season game takes the place of an exhibition game in progress, after a second tap
      if (liveExhibition()) { if (!confirmed(a)) break; S = null; }
      // Playing the game: the week's practice first, and its report, with the kickoff right there
      if (a === "playgame" && !practiced()) { holdPractice(); APP.reportNext = "kickoff"; APP.screen = "preport"; scrollTop(); break; }
      if (a === "playgame") { if (startMyGame()) APP.screen = "game"; }
      else if (simMyGame()) { const n = finishWeek(); if (n) { APP.weekView = n; APP.weekFrom = "season"; APP.screen = "week"; } }
      scrollTop(); break;
    }
    // Practice
    case "practice": APP.screen = "practice"; scrollTop(); break;
    case "parea": {
      const v = +ds.v;
      if (!AREA_NAMES[ds.t] || !(v >= 0 && v <= 3)) break;
      SEASON.plan.areas[ds.t] = v;
      announce(`${AREA_NAMES[ds.t]}: ${INTENSITY[v].toLowerCase()}, ${blocksText(blocksOf(planNow())[ds.t])}.`); break;
    }
    case "pcontact": if (CONTACT[ds.v]) { SEASON.plan.contact = ds.v; announce(`${CONTACT[ds.v].name}.`); } break;
    case "ppreset": if (PRESETS[ds.v]) { SEASON.plan.areas = clone(PRESETS[ds.v].areas); SEASON.plan.contact = PRESETS[ds.v].contact; announce(`${PRESETS[ds.v].name} plan, in ${CONTACT[SEASON.plan.contact].name.toLowerCase()}.`); } break;
    case "install": APP.screen = "install"; scrollTop(); break;
    case "pfocus": {
      const f = SEASON.plan.focus || (SEASON.plan.focus = []), i = f.indexOf(ds.v);
      if (!INSTALL_IDS.includes(ds.v)) break;
      if (i >= 0) { f.splice(i, 1); announce(`${playName(ds.v)} off the install focus.`); }
      else if (f.length >= 3) announce("Three plays already. Take one off first.");
      else { f.push(ds.v); announce(`${playName(ds.v)} added to the install focus.`); }
      break;
    }
    case "hold": if (SEASON && SEASON.myId && !practiced()) { holdPractice(); APP.reportNext = null; APP.screen = "preport"; scrollTop(); } break;
    case "preport": if (SEASON && SEASON.practice) { APP.reportNext = null; APP.reportView = null; APP.screen = "preport"; scrollTop(); } break;
    case "scout": if (SEASON && SEASON.practice && SEASON.practice.film) { APP.scoutBack = APP.screen; APP.screen = "scout"; scrollTop(); } break;
    case "weekdone": {
      recordMyGame();
      const n = S && S.season && S.season.seed === SEASON.seed ? S.season.week : SEASON.week;
      if (n === SEASON.week) { const gm = myGameIn(n); if (gm && !played(gm)) break; finishWeek(); }
      APP.weekView = n; APP.weekFrom = "season"; APP.screen = "week"; scrollTop(); break;
    }
    case "simweek": { const gm = myGameIn(SEASON.week); if (gm && !played(gm)) break; const n = finishWeek(); if (n) { APP.weekView = n; APP.weekFrom = "season"; APP.screen = "week"; } scrollTop(); break; }
    case "simseason":
      if (liveSeasonGame() || !confirmed("simseason")) break;
      runSeasonSim(ds.v === "playoffs" ? REGULAR_WEEKS + 1 : LAST_WEEK + 1); scrollTop(); break;
    case "week": if (+ds.v >= 1 && +ds.v < SEASON.week) { APP.weekFrom = APP.screen; APP.weekView = +ds.v; APP.screen = "week"; scrollTop(); } break;
    case "standings": case "schedule": APP.screen = a; scrollTop(); break;
    case "bracket": if (SEASON && SEASON.bracket) { APP.screen = a; scrollTop(); } break;
    case "boxscore": if (S && S.teams) { APP.screen = "game"; scrollTop(); } break;
    case "sroster": if (SEASON && SEASON.schools[ds.t]) { seasonRoster(ds.t); scrollTop(); } break;
    // Roster screens
    case "roster": APP.view = { ctx: APP.screen === "game" ? "game" : "ex", team: ds.t != null ? +ds.t || 0 : Math.max(0, myGameTeam()), back: APP.screen }; APP.screen = "roster"; scrollTop(); break;
    case "lineup": APP.view = { ctx: "game", team: Math.max(0, myGameTeam()), back: "game" }; APP.screen = "roster"; scrollTop(); break;
    case "rteam": APP.view.team = viewCtx() === "season" ? ds.t : +ds.t || 0; scrollTop(); break;
    case "player": APP.view.player = ds.v; APP.screen = "player"; scrollTop(); break;
    case "back": {
      if (APP.screen === "player" || APP.screen === "depth") APP.screen = "roster";
      else if (APP.screen === "install") APP.screen = "practice";
      else if (APP.screen === "scout" && ["game", "preport"].includes(APP.scoutBack)) APP.screen = APP.scoutBack === "game" && !(S && S.teams) ? "season" : APP.scoutBack;
      else if (APP.screen === "roster") { const b = APP.view && APP.view.back; APP.screen = b === "game" && !(S && S.teams) ? "home" : b || "home"; }
      else if (APP.screen === "week" && APP.weekFrom === "schedule") APP.screen = "schedule";
      else if (APP.screen === "coach") APP.screen = SCREENS[APP.coachBack] && APP.coachBack !== "coach" ? APP.coachBack : "home";
      else APP.screen = seasonScreen();
      APP.reportView = null;
      scrollTop(); break;
    }
    // The depth chart
    case "dmode": if (ds.v === "next" || ds.v === "always") depthHome().depthMode = ds.v; break;
    case "dnextoff": depthHome().nextDepth = null; announce("Next-game changes dropped."); break;
    case "rot": {
      if (!ROTATION[ds.v] || !canEdit(APP.view.team)) break;
      if (inGameView()) { S.teams[APP.view.team].rot = ds.v; } else depthHome().rot = ds.v;
      announce(`Rotation: ${ROTATION[ds.v].name}.`); break;
    }
    case "dreset": if (canEdit(APP.view.team)) { resetDepth(APP.view.team); announce("The depth chart is back to automatic."); } break;
    case "dedit": if (canEdit(APP.view.team)) { APP.view.edit = ds.v; APP.view.sel = null; APP.screen = "depth"; scrollTop(); } break;
    case "dsel": APP.view.sel = APP.view.sel === ds.v ? null : ds.v; break;
    case "dmove": {
      if (!canEdit(APP.view.team)) break;
      const said = depthMove(APP.view.team, APP.view.edit, ds.t, ds.v);
      if (said) announce(said);
      focusNext = { a: "dsel", v: ds.t };
      break;
    }
    case "ddone": focusNext = { a: "dedit", v: APP.view.edit }; APP.screen = "roster"; break;
    // The game
    case "audpick": if (inGame && S.phase === "los") S.audSel = S.audSel === ds.v ? null : ds.v; break;
    case "audible": if (inGame && S.phase === "los") { audible(S.audSel); scrollTop(); } break;
    case "snap": if (inGame && S.phase === "los") { audible(null); scrollTop(); } break;
    case "pick": if (inGame && S.phase === "call") S.sel = ds.v; break;
    case "disg": if (inGame && S.phase === "call" && S.side === "def") S.disgOn = ds.v === "1"; break;
    case "dlook": if (inGame && S.phase === "call" && S.side === "def" && LOOKS[ds.v]) S.disgSel = S.disgSel === ds.v ? null : ds.v; break;
    case "side": if (inGame && S.phase === "call" && S.side === "off" && sideOn(S.sel)) S.selSide = !S.selSide; break;
    case "pkg": {
      if (!inGame || S.phase !== "call") break;
      const isOff = S.side === "off";
      if (!pkgChoices(isOff).includes(ds.v)) break;
      S.pkgSel = ds.v;
      if (isOff && S.sel && !offCallsFor(ds.v).includes(S.sel)) { S.sel = null; S.selSide = false; }
      break;
    }
    case "lock": if (inGame && S.phase === "call") { lock(); scrollTop(); } break;
    case "cont": if (inGame && S.phase === "result") { cont(); scrollTop(); } break;
    case "pat": if (inGame && S.phase === "pat") { doPAT(ds.v); scrollTop(); } break;
    case "kick": if (inGame && S.phase === "kickchoice") { doKickChoice(ds.v); scrollTop(); } break;
    case "onside": {
      const c = inGame && S.kickChoice;
      if (c && S.phase === "result" && c.later && !S.teams[c.team].cpu) { c.onside = !c.onside; announce(c.onside ? "Onside kick called." : "Onside kick called off. Kicking deep."); }
      break;
    }
    case "toss": if (inGame && S.phase === "toss" && S.toss) { if (S.toss.step === "call") tossCall(ds.v); else tossChoose(ds.v); tossNext(); scrollTop(); } break;
    case "try": { const c = inGame && S.tryChoice; if (!c || S.phase !== "trychoice") break; S.tryChoice = null; S.patTeam = c.team; if (ds.v === "two") startTwo(c.spot); else doPAT("kick", xpDist(c.spot)); scrollTop(); break; }
    case "pen": if (inGame && S.phase === "penalty") { choosePenalty(ds.v === "1"); scrollTop(); } break;
    case "half": if (inGame && S.phase === "halftime") { S.hready = null; startPlay(); scrollTop(); } break;
    case "to": if (inGame && callTimeout(+ds.t)) announce(S.toNote); break;
    case "spike": if (inGame && (S.spikeNext || spikeOK())) { S.spikeNext = !S.spikeNext; if (S.spikeNext) S.noHuddle = false; announce(S.spikeNext ? "Spike set for the next snap." : "Spike cancelled."); } break;
    case "nohuddle": if (inGame && nhAvailable()) { S.noHuddle = !S.noHuddle; if (S.noHuddle) S.spikeNext = false; announce(S.noHuddle ? "Going no huddle." : "No huddle cancelled."); } break;
    case "sim": if (inGame && S.phase !== "final" && confirmed("sim")) { simToEnd(); scrollTop(); } break;
    // A season game can't be thrown away: only an exhibition can end early
    case "end": if (inGame && !S.season && confirmed("end")) { S = null; APP.screen = "exhibition"; scrollTop(); } break;
    default: if (!savesAct(a)) return;
  }
  // A season game that just ended goes in the books right away
  if (SEASON && isMyGame() && S.phase === "final") recordMyGame();
  save();
  render();
  if (S && APP.screen === "game") Sound.play(cuesFor(a, pre));
}

// The screens that make sense to come back to after closing the page
function startScreen() {
  const sc = APP.screen, season = !!(SEASON && SEASON.myId);
  if (sc === "game") return S && S.teams ? sc : "home";
  if (sc === "roster" || sc === "player" || sc === "depth") return APP.view && (APP.view.ctx !== "season" || SEASON) && (APP.view.ctx !== "game" || (S && S.teams)) ? sc : "home";
  if (sc === "pick") return SEASON && SEASON.phase === "pick" && CAREER ? sc : "home";
  if (sc === "newcoach") return APP.coachDraft ? sc : "home";
  if (sc === "coach") return CAREER ? sc : "home";
  if (sc === "summary") return season && ["over", "offseason"].includes(SEASON.phase) ? sc : season ? "season" : "home";
  if (sc === "offseason") return season && SEASON.phase === "offseason" ? sc : season ? "season" : "home";
  if (sc === "newyear") return season && SEASON.yearReport ? sc : season ? "season" : "home";
  if (sc === "simming") return season ? "season" : "home";
  if (sc === "week") return season && APP.weekView && APP.weekView < SEASON.week ? sc : season ? "season" : "home";
  if (sc === "bracket") return season && SEASON.bracket ? sc : season ? "season" : "home";
  if (sc === "preport") return season && (SEASON.practice || (APP.reportView === "camp" && SEASON.campReport)) ? sc : season ? "season" : "home";
  if (sc === "scout") return season && SEASON.practice && SEASON.practice.film ? sc : season ? "season" : "home";
  if (sc === "practice" || sc === "install") return season ? sc : "home";
  if (["season", "standings", "schedule"].includes(sc)) return season ? sc : "home";
  return SCREENS[sc] ? sc : "home";
}
function start() {
  const saved = loadSaved();
  if (saved) { APP = saved.app; S = saved.game && saved.game.teams ? saved.game : null; SEASON = saved.season || null; CAREER = saved.career || null; }
  if (!APP || !APP.ex) { APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); }
  relinkCareer();
  APP.screen = startScreen();
  if (APP.screen === "saves") openSaves();
  if (SEASON && isMyGame() && S.phase === "final") recordMyGame();
  recordCareerSeason();
  checkStorage();
  render();
}

if (typeof document !== "undefined") {
  document.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (b && !b.disabled) act(b.dataset.a, b.dataset); });
  // Text boxes keep what's typed without redrawing. Return moves on to the next box, or does the
  // box's action (data-enter).
  document.addEventListener("input", e => { const el = e.target; if (el && el.dataset && el.dataset.in) typed(el.dataset.in, el.value); });
  document.addEventListener("keydown", e => {
    const el = e.target;
    if (e.key !== "Enter" || !el || !el.dataset || el.tagName === "TEXTAREA") return;
    if (el.dataset.next) { const n = document.getElementById(el.dataset.next); if (n) { e.preventDefault(); n.focus(); } }
    else if (el.dataset.enter) { e.preventDefault(); act(el.dataset.enter, el.dataset); }
  });
  document.addEventListener("change", e => { const el = e.target; if (el && el.id === "importfile" && el.files && el.files[0]) openSaveFile(el.files[0]); });
  start();
} else {
  // Headless test hook (tests/ load the scripts into Node)
  globalThis.__fts = { act, start, autoStep, simToEnd, initGame, cont, startPlay, newExhibition, startExhibition, typed,
    get S() { return S; }, set S(v) { S = v; }, get APP() { return APP; }, set APP(v) { APP = v; },
    get SEASON() { return SEASON; }, set SEASON(v) { SEASON = v; }, get CAREER() { return CAREER; }, set CAREER(v) { CAREER = v; } };
}
