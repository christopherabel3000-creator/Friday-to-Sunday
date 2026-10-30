// Friday to Sunday: the season's screens. Picking your school, the week ahead, each week's results,
// standings, your schedule and season stats, and the playoff bracket.
"use strict";

/* ---------- Reading the season ---------- */
const otText = gm => gm.ot ? (gm.ot > 1 ? ` in ${gm.ot} overtimes` : " in overtime") : "";
// "Hillsboro Hawks 28, Pine Hollow Pirates 21", the winner first
function scoreText(gm) {
  const w = winnerOf(gm), l = loserOf(gm);
  return `${nameOf(w)} ${Math.max(gm.hs, gm.as)}, ${nameOf(l)} ${Math.min(gm.hs, gm.as)}${otText(gm)}`;
}
// "Pine Hollow Pirates at Hillsboro Hawks", or "vs." at a neutral site
const matchupText = gm => gm.neutral ? `${nameOf(gm.h)} vs. ${nameOf(gm.a)}` : `${nameOf(gm.a)} at ${nameOf(gm.h)}`;
// From your side: "at Hillsboro Hawks" or "vs. Hillsboro Hawks"
const vsText = (gm, id) => gm.h === id || gm.neutral ? `vs. ${nameOf(opponentIn(gm, id))}` : `at ${nameOf(gm.h)}`;
const myScore = (gm, id) => gm.h === id ? [gm.hs, gm.as] : [gm.as, gm.hs];
// "You beat the Hillsboro Hawks 28-21" or "You lost to the Hillsboro Hawks 28-21"
function resultText(gm, id) {
  const [m, t] = myScore(gm, id), opp = nameOf(opponentIn(gm, id));
  return `${m > t ? `You beat the ${opp}` : `You lost to the ${opp}`} ${Math.max(m, t)}-${Math.min(m, t)}${otText(gm)}`;
}
// "Won 28-21" or "Lost 28-21 in overtime"
const wonText = (gm, id) => { const [m, t] = myScore(gm, id); return `${m > t ? "Won" : "Lost"} ${Math.max(m, t)}-${Math.min(m, t)}${otText(gm)}`; };
// "District game", "Non-district game", or the playoff round
function gameKind(gm, n) {
  if (isPlayoffWeek(n)) return gm.title ? "State championship · Neutral site" : `State playoffs · ${weekName(n)}`;
  return gm.dist ? "District game" : "Non-district game";
}
const schemeText = s => `${OFF_STYLES[s.off].name} offense, ${DEF_STYLES[s.def].name} defense`;
const talentText = r => `Starters rate ${Math.round(r.off)} on offense and ${Math.round(r.def)} on defense.`;
// "4-1, 2-0 in district" (the district part once district play has started)
function recLine(id, upTo) {
  const r = recordOf(id, upTo), n = upTo == null ? SEASON.week : upTo;
  return `${recText(r)}${n >= DISTRICT_START ? `, ${r.dw}-${r.dl} in district` : ""}`;
}
// Your school's strength as it would play this week: its depth chart for the next game, if you set one
function myRatingNow() {
  const s = mySchool(), nd = SEASON.nextDepth;
  return schoolRating(nd ? Object.assign({}, s, { depth: nd.depth }) : s);
}
// "On paper: the Hawks by about 6." from the quick sim's expected points
function paperLine(gm) {
  const me = SEASON.myId, mine = myRatingNow();
  const [eh, ea] = expectedPoints(gm.h, gm.a, gm.neutral, gm.h === me ? mine : null, gm.a === me ? mine : null);
  const d = Math.round(eh - ea), fav = d > 0 ? gm.h : gm.a;
  if (Math.abs(d) < 2) return "On paper, it's a toss-up.";
  return `On paper: ${fav === me ? "your team" : `the ${SEASON.schools[fav].mascot}`} by about ${Math.abs(d)}.`;
}
// Where you stand, in a sentence or two
function seasonStatus() {
  const me = SEASON.myId, r = fullRecord(me), n = weeksDone(), d = SEASON.district;
  if (SEASON.phase === "regular") {
    if (!n) return `Ten games, then the state playoffs for the top two in District ${d}.`;
    const p = placeOf(me, Math.min(n, REGULAR_WEEKS)), race = raceStatus(me, n);
    const raceLine = race === "title" ? " You've clinched the district title." : race === "in" ? " You've clinched a playoff spot." : race === "out" ? " You're out of the playoff race." : "";
    return `${recLine(me, n)}. ${n >= DISTRICT_START ? `${capFirst(ordWord(p - 1))} in District ${d}.` : ""}${raceLine}`.trim();
  }
  const out = eliminatedIn(me), titled = SEASON.champion === me;
  const how = !inPlayoffs(me) ? "You missed the playoffs." : titled ? "State champions!" : out ? `Your season ended in the ${weekName(REGULAR_WEEKS + out).toLowerCase().replace("state championship", "state championship game")}.` : `${seedText(me)}, still alive in the playoffs.`;
  return `${recText(r)}. ${how}`;
}

/* ---------- Picking your school ---------- */
function vPick() {
  const d = SEASON.district, str = id => SEASON.schools[id].rating.off + SEASON.schools[id].rating.def;
  const ids = SEASON.districts[d - 1].ids.slice().sort((a, b) => str(b) - str(a));
  const card = id => {
    const s = SEASON.schools[id], seniors = s.players.filter(p => p.yr === 12).length;
    return `<section class="panel teamcard" style="--team:${s.color}">
      <p class="eyebrow">${esc(s.colorName)} · ${plural(s.players.length, "player")}</p>
      <h3>${esc(nameOf(id))}</h3>
      <p class="muted">${talentText(s.rating)} ${capFirst(tradWord(s.trad))}. ${plural(seniors, "senior")}.</p>
      <div class="choices"><button class="btn" data-a="takejob" data-v="${id}">Coach the ${esc(s.mascot)}</button><button class="btn ghost" data-a="sroster" data-t="${id}">${esc(s.mascot)} roster</button></div>
    </section>`;
  };
  return `
    <div class="masthead">
      <p class="eyebrow">New season · Class 1A, District ${d}</p>
      <h2 data-focus tabindex="-1">Pick your school</h2>
      <p class="muted">Every school in District ${d} needs a head coach. They're listed from the most talent to the least. Tradition is how the program has done over the years.</p>
    </div>
    ${ids.map(card).join("")}`;
}

/* ---------- The week ahead ---------- */
function vSeason() {
  const me = mySchool(), id = me.id, n = SEASON.week, gm = myGameIn(n), live = isMyGame() && S.phase !== "final";
  const eyebrow = SEASON.phase === "over" ? "Season over" : SEASON.phase === "playoffs" ? `State playoffs · ${weekName(n)}` : `${weekName(n)} · Class 1A, District ${SEASON.district}`;
  let main = "";
  if (live) main = `<section class="panel"><p class="eyebrow">${weekName(n)} · In progress</p><p>${esc(boardSummary())}</p><button class="btn" data-a="resume">Back to the game</button></section>`;
  else if (gm && !played(gm)) {
    const opp = seasonSchool(opponentIn(gm, id)), r = opp.id;
    main = `<section class="panel teamcard" style="--team:${opp.color}">
      <p class="eyebrow">${gameKind(gm, n)}</p>
      <h3>${esc(matchupText(gm))}</h3>
      <p class="muted">The ${esc(opp.mascot)}${isPlayoffWeek(n) ? `: ${seedText(r)}, ${recText(fullRecord(r))}.` : weeksDone() ? `: ${recLine(r, weeksDone())}.` : "."} ${talentText(opp.rating)} Coach ${esc(coachName(opp.coach))}: ${esc(schemeText(opp))}.</p>
      <p>${esc(paperLine(gm))}</p>
      ${matchupTable(Object.assign({}, me, { depth: SEASON.nextDepth ? SEASON.nextDepth.depth : me.depth }), opp, me.mascot, opp.mascot)}
      <div class="choices"><button class="btn" data-a="playgame">${confirming === "playgame" ? "Tap again to leave the exhibition" : "Play the game"}</button><button class="btn ghost" data-a="simgame">${confirming === "simgame" ? "Tap again to leave the exhibition" : "Sim the game"}</button></div>
      <div class="choices"><button class="btn ghost" data-a="sroster" data-t="${id}">Your roster</button><button class="btn ghost" data-a="sroster" data-t="${r}">${esc(opp.mascot)} roster</button></div>
    </section>
    ${practicePanel()}
    <section class="panel">
      <h3>Your schemes</h3>
      ${styleSegs(me.off, me.def)}
    </section>`;
  } else if (gm && played(gm)) main = `<section class="panel"><p class="eyebrow">${weekName(n)} · Final</p><h3>${esc(resultText(gm, id))}</h3><button class="btn" data-a="weekdone">${weekName(n)} results</button></section>`;
  else if (SEASON.phase === "playoffs") main = `<section class="panel"><p class="eyebrow">${weekName(n)}</p>
      <p>${inPlayoffs(id) ? "You're out of the playoffs." : "You're not in the playoffs."} The rest of the bracket plays on.</p>
      <button class="btn" data-a="simweek">Sim the ${weekName(n).toLowerCase()}</button></section>`;
  else if (SEASON.phase === "over") {
    const ch = SEASON.champion, mine = ch === id, fin = SEASON.bracket.rounds[PLAYOFF_ROUNDS.length - 1][0];
    main = `<section class="panel final handoff" style="--team:${SEASON.schools[ch].color}">
      <p class="eyebrow">Class 1A state champions</p>
      <h3>${mine ? "Your team won it all" : esc(nameOf(ch))}</h3>
      <p>${mine ? `The ${esc(me.mascot)} beat the ${esc(nameOf(loserOf(fin)))} ${Math.max(fin.hs, fin.as)}-${Math.min(fin.hs, fin.as)} in the final.` : `They beat the ${esc(nameOf(loserOf(fin)))} ${Math.max(fin.hs, fin.as)}-${Math.min(fin.hs, fin.as)} in the final.`}</p>
      <button class="btn ghost" data-a="week" data-v="${LAST_WEEK}">State championship results</button>
      <button class="btn" data-a="newseason">${confirming === "newseason" ? "Tap again to start over" : "Start a new season"}</button>
    </section>`;
  }
  const last = weeksDone(), lastGm = last ? myGameIn(last) : null;
  const lastPanel = last && !(gm && played(gm)) && SEASON.phase !== "over" ? `<section class="panel"><p class="eyebrow">Last week</p>
      <p>${esc(weekName(last))}: ${lastGm && played(lastGm) ? esc(resultText(lastGm, id).replace(/^You/, "you")) + "." : "no game for you."}</p>
      <button class="btn ghost" data-a="week" data-v="${last}">${weekName(last)} results</button></section>` : "";
  // The rest of the season's screens. Your roster is with this week's game when there is one.
  const more = [SEASON.bracket ? `<button class="btn ghost" data-a="bracket">Playoff bracket</button>` : "", gm && !played(gm) && !live ? "" : `<button class="btn ghost" data-a="sroster" data-t="${id}">Roster and depth chart</button>`].filter(Boolean);
  const simBtn = SEASON.phase === "regular" ? ["playoffs", "Sim to the playoffs"] : SEASON.phase === "playoffs" ? ["end", "Sim the rest of the season"] : null;
  return `
    <div class="masthead" style="--team:${me.color}">
      <p class="eyebrow">${eyebrow}</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(id))}</h2>
      <p class="muted">${esc(seasonStatus())}</p>
    </div>
    ${main}
    ${lastPanel}
    <section class="panel">
      <h3>District ${SEASON.district}</h3>
      ${standingsTable(SEASON.district, Math.min(last, REGULAR_WEEKS), true)}
      <div class="choices"><button class="btn ghost" data-a="standings">All standings</button><button class="btn ghost" data-a="schedule">Schedule and stats</button></div>
      ${more.length > 1 ? `<div class="choices">${more.join("")}</div>` : more.join("")}
    </section>
    ${simBtn && !live ? `<button class="btn ghost" data-a="simseason" data-v="${simBtn[0]}">${confirming === "simseason" ? `Tap again to ${simBtn[1].toLowerCase()}` : simBtn[1]}</button>` : ""}`;
}
// This week's practice: the plan or the report, and who's hurt
function practicePanel() {
  const done = practiced(), P = SEASON.practice, plan = SEASON.plan, pre = presetOf(plan), hurt = mySchool().players.filter(p => p.inj);
  const planText = `${pre ? PRESETS[pre].name : "Your own"} plan, in ${CONTACT[plan.contact].name.toLowerCase()}`;
  return `<section class="panel">
      <h3>Practice</h3>
      <p>${done ? `Done for the week: ${planText}. ${P.prep ? `The scouting report is ready.` : "No film study this week."}` : `This week: ${planText}. Practice happens before kickoff if you don't hold it first.`}</p>
      ${hurt.length ? `<p>Injured: ${esc(andList(hurt.map(p => `${p.last}, ${injText(p.inj)}`)))}.</p>` : ""}
      <div class="choices"><button class="btn ghost" data-a="practice">Practice plan</button>${done ? `<button class="btn ghost" data-a="preport">Practice report</button>` : `<button class="btn ghost" data-a="hold">Hold practice</button>`}</div>
      ${done && P.film ? `<button class="btn ghost" data-a="scout">Scouting report</button>` : ""}
    </section>`;
}
// Offensive and defensive style buttons. The current one is pressed.
function styleSegs(off, def) {
  const one = isOff => {
    const ids = isOff ? OFF_STYLE_IDS : DEF_STYLE_IDS, book = isOff ? OFF_STYLES : DEF_STYLES, cur = (isOff ? off : def) || "bal";
    const a = isOff ? "ostyle" : "dstyle", lbl = isOff ? "Offensive style" : "Defensive style";
    return `<div style="display:grid;gap:6px" role="group" aria-label="${lbl}"><span class="eyebrow" aria-hidden="true">${lbl}</span><div class="seg grid2">
      ${ids.map(x => `<button data-a="${a}" data-v="${x}" aria-pressed="${cur === x}">${book[x].short}</button>`).join("")}
    </div><p class="muted styledesc">${esc(book[cur].desc)}</p></div>`;
  };
  return one(true) + one(false);
}

/* ---------- Standings ---------- */
// One district's table. short: just the records (for the week screen and the season screen).
function standingsTable(d, upTo, short) {
  const rows = standings(d, upTo), dist = (upTo == null ? weeksDone() : upTo) >= DISTRICT_START;
  const cols = short ? [["District", r => `${r.dw}-${r.dl}`], ["Overall", r => `${r.w}-${r.l}`]]
    : [["District", r => `${r.dw}-${r.dl}`], ["Overall", r => `${r.w}-${r.l}`], ["Scored", r => r.pf], ["Allowed", r => r.pa]];
  const show = dist ? cols : cols.filter(([h]) => h !== "District");
  // Before anyone has played, there's no order yet: the schools go alphabetically, without places
  const started = (upTo == null ? weeksDone() : upTo) >= 1;
  if (!started) rows.sort((a, b) => nameOf(a.id).localeCompare(nameOf(b.id)));
  return `<div class="tablewrap flush"><table class="stand" aria-label="District ${d} standings">
    <thead><tr><th scope="col">School</th>${show.map(([h]) => `<th scope="col">${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr${r.id === SEASON.myId ? ' class="me"' : ""}><th scope="row">${started ? `${r.place}. ` : ""}${esc(nameOf(r.id))}${r.id === SEASON.myId ? " (you)" : ""}</th>${show.map(([, f]) => `<td>${f(r)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}
function vStandings() {
  const ds = [SEASON.district].concat(SEASON.districts.map(x => x.n).filter(d => d !== SEASON.district));
  const upTo = Math.min(weeksDone(), REGULAR_WEEKS);
  return `
    <div class="masthead">
      <p class="eyebrow">Class 1A${upTo ? ` · Through ${weekName(upTo).toLowerCase()}` : ""}</p>
      <h2 data-focus tabindex="-1">Standings</h2>
      <p class="muted">The top two in each district make the state playoffs. Ties go to head-to-head, then the overall record, then point differential in district games, up to 14 points a game.</p>
    </div>
    ${ds.map(d => `<section class="panel"><h3>District ${d}${d === SEASON.district ? " (yours)" : ""}</h3>${standingsTable(d, upTo)}</section>`).join("")}
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- One week's results ---------- */
function vWeek() {
  const n = APP.weekView, me = SEASON.myId, gm = myGameIn(n), mine = gm && played(gm);
  const games = weekGames(n).filter(played), local = gm2 => districtOf(gm2.h) === SEASON.district || districtOf(gm2.a) === SEASON.district;
  const list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const box = S && S.teams && S.season && S.season.seed === SEASON.seed && S.season.week === n && S.phase === "final";
  const playoffs = isPlayoffWeek(n), news = SEASON.news[n] || [];
  const nearby = playoffs ? games : games.filter(local), others = games.filter(g2 => !nearby.includes(g2));
  // Everyone else: by district once district play starts
  const around = !others.length ? "" : n >= DISTRICT_START
    ? SEASON.districts.filter(x => x.n !== SEASON.district).map(x => `<h3 class="stathead">District ${x.n}</h3>${list(others.filter(g2 => districtOf(g2.h) === x.n).map(scoreText))}`).join("")
    : list(others.map(scoreText));
  const status = playoffs ? (mine ? `You're ${recText(fullRecord(me))}.` : "") : `You're ${recLine(me, n)}.`;
  return `
    <div class="masthead" style="--team:${mySchool().color}">
      <p class="eyebrow">${weekName(n)} results</p>
      <h2 data-focus tabindex="-1">${mine ? esc(resultText(gm, me)) : `${weekName(n)} results`}</h2>
      ${status ? `<p class="muted">${esc(status)}</p>` : ""}
    </div>
    ${box ? `<button class="btn ghost" data-a="boxscore">Box score and play-by-play</button>` : ""}
    ${news.length ? `<section class="panel"><h3>News</h3>${list(news)}</section>` : ""}
    ${injuryPanel(n)}
    <section class="panel"><h3>${playoffs ? weekName(n) : `District ${SEASON.district}`}</h3>${list(nearby.map(scoreText))}</section>
    ${!playoffs && n >= DISTRICT_START ? `<section class="panel"><h3>Standings</h3>${standingsTable(SEASON.district, n, true)}</section>` : ""}
    ${around ? `<details><summary>Scores around the state</summary><div class="statwrap">${around}</div></details>` : ""}
    ${APP.weekFrom === "schedule" ? `<button class="btn ghost" data-a="back">Back to the schedule</button>` : `<button class="btn" data-a="season">Continue</button>`}`;
}

// Your injury news for the week just played: who got hurt in the game, and who's back
function injuryPanel(n) {
  const L = (SEASON.injLog || {})[n], s = mySchool();
  if (!L || n !== weeksDone()) return "";
  const who = id => playerById(s, id), list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const hurt = (L.game || []).map(who).filter(Boolean).map(p => `${fullName(p)}, ${p.inj ? injTextNext(p.inj) : "back for next week"}`);
  const back = (L.back || []).map(who).filter(p => p && !(L.game || []).includes(p.id)).map(fullName);
  if (!hurt.length && !back.length) return "";
  return `<section class="panel"><h3>Injuries</h3>${hurt.length ? `<p>Hurt in the game:</p>${list(hurt)}` : ""}${back.length ? `<p>Back from injury: ${esc(andList(back))}.</p>` : ""}</section>`;
}

/* ---------- Your schedule and season stats ---------- */
function vSchedule() {
  const me = SEASON.myId, s = mySchool();
  const row = n => {
    const gm = myGameIn(n);
    if (!gm) return "";
    const what = `${weekName(n)}${isPlayoffWeek(n) ? "" : gm.dist ? ", district" : ", non-district"}: ${vsText(gm, me)}`;
    // This week's game, before the rest of the week is played: its button finishes the week
    if (played(gm)) return `<li><button class="rowbtn" data-a="${n < SEASON.week ? "week" : "weekdone"}" data-v="${n}">${esc(what)}. ${esc(wonText(gm, me))}.</button></li>`;
    return `<li class="sched">${esc(what)}.${n === SEASON.week ? " Next game." : ""}</li>`;
  };
  const weeks = []; for (let n = 1; n <= LAST_WEEK; n++) weeks.push(n);
  const po = weeks.filter(n => isPlayoffWeek(n) && myGameIn(n));
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(nameOf(me))}</p>
      <h2 data-focus tabindex="-1">Schedule and stats</h2>
      <p class="muted">${esc(seasonStatus())}</p>
    </div>
    <section class="panel"><h3>Regular season</h3><ol class="roster">${weeks.filter(n => !isPlayoffWeek(n)).map(row).join("")}</ol></section>
    ${po.length ? `<section class="panel"><h3>Playoffs</h3><ol class="roster">${po.map(row).join("")}</ol></section>` : ""}
    <section class="panel"><h3>Season stats</h3>${seasonStatsHtml(s)}</section>
    <button class="btn ghost" data-a="back">Back</button>`;
}
// Your players' season totals: the leaders, then a table for each kind of stat
function seasonStatsHtml(s) {
  const list = s.players.map(p => [p, SEASON.stats[p.id]]).filter(([, st]) => st && Object.keys(st).length > 1);
  if (!list.length) return `<p class="muted">No games played yet.</p>`;
  const by = (k, min) => list.filter(([, st]) => (st[k] || 0) >= (min || 1)).sort((a, b) => (b[1][k] || 0) - (a[1][k] || 0)), n = (st, k) => st[k] || 0;
  return statTable("Passing", by("pa"), [["G", st => st.g], ["C/A", st => `${n(st, "pc")}/${n(st, "pa")}`], ["Yds", st => n(st, "py")], ["TD", st => n(st, "ptd")], ["Int", st => n(st, "pi")]]) +
    statTable("Rushing", by("ru"), [["G", st => st.g], ["Car", st => n(st, "ru")], ["Yds", st => n(st, "ry")], ["TD", st => n(st, "rtd")], ["Long", st => n(st, "rl")]]) +
    statTable("Receiving", by("rec"), [["G", st => st.g], ["Rec", st => n(st, "rec")], ["Yds", st => n(st, "rcy")], ["TD", st => n(st, "rctd")], ["Long", st => n(st, "rcl")]]) +
    statTable("Defense", by("tk").concat(list.filter(([, st]) => !st.tk && (st.int || st.sck))).slice(0, 12), [["G", st => st.g], ["Tkl", st => n(st, "tk")], ["TFL", st => n(st, "tfl")], ["Sacks", st => n(st, "sck")], ["Int", st => n(st, "int")]]) +
    statTable("Kicking", by("fga").concat(list.filter(([, st]) => !st.fga && st.xpa)), [["FG", st => `${n(st, "fgm")}/${n(st, "fga")}`], ["Long", st => st.fgl || "-"], ["XP", st => `${n(st, "xpm")}/${n(st, "xpa")}`]]) +
    statTable("Punting", by("pu"), [["Punts", st => n(st, "pu")], ["Avg", st => st.pu ? (st.puy / st.pu).toFixed(1) : "-"], ["Long", st => st.pul || "-"]]);
}
// A player's season on his own screen
function playerSeasonLine(st) {
  return st && st.g ? `<p>${plural(st.g, "game")}. ${playerGameLine(st).replace(/^<p>|<\/p>$/g, "")}</p>` : `<p>No games yet.</p>`;
}

/* ---------- The playoff bracket ---------- */
function vBracket() {
  const b = SEASON.bracket, me = SEASON.myId;
  const team = id => `${nameOf(id)} (${seedText(id)}, ${recText(recordOf(id))})`;
  const line = gm => played(gm) ? scoreText(gm) : gm.neutral ? `${team(gm.h)} vs. ${team(gm.a)}` : `${team(gm.a)} at ${team(gm.h)}`;
  return `
    <div class="masthead">
      <p class="eyebrow">Class 1A state playoffs</p>
      <h2 data-focus tabindex="-1">Playoff bracket</h2>
      <p class="muted">District champions host the first round. After that the better record hosts, and the state championship is at a neutral site.${SEASON.champion ? ` Champions: the ${esc(nameOf(SEASON.champion))}.` : ""}</p>
    </div>
    ${b.rounds.map((round, r) => `<section class="panel"><h3>${PLAYOFF_ROUNDS[r]}</h3><ul class="hlist">${round.map(gm => `<li${gameHas(gm, me) ? ' class="me"' : ""}>${esc(line(gm))}</li>`).join("")}</ul></section>`).join("")}
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- Simming the season ---------- */
// A long sim runs a week at a time, so the screen can show how far along it is
let simJob = null;
function runSeasonSim(stopAt) {
  simJob = { stopAt, from: SEASON.week };
  APP.screen = "simming";
  const step = () => {
    if (!simJob) return;
    if (SEASON.phase === "over" || SEASON.week >= simJob.stopAt) { simJob = null; APP.screen = "season"; save(); render(); scrollTop(); return; }
    simMyGame();
    if (!finishWeek()) { simJob = null; APP.screen = "season"; save(); render(); return; }
    save(); render();
    setTimeout(step, 0);
  };
  setTimeout(step, 30);
}
function vSimming() {
  const done = simJob ? SEASON.week - simJob.from : 0, total = simJob ? Math.min(simJob.stopAt, LAST_WEEK + 1) - simJob.from : 1;
  return `
    <div class="masthead">
      <p class="eyebrow">${esc(nameOf(SEASON.myId))}</p>
      <h2 data-focus tabindex="-1">Simming the season</h2>
      <p class="muted" aria-hidden="true">${SEASON.week <= LAST_WEEK ? `${weekName(SEASON.week)}…` : "Finishing up…"}</p>
    </div>
    <div class="simbar" aria-hidden="true"><i style="width:${Math.round(100 * clamp(done / Math.max(1, total), 0, 1))}%"></i></div>`;
}
