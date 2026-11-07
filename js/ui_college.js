// Friday to Sunday: the college season's screens (Milestone 4). The week ahead, each week's results,
// conference standings, the top 25, the postseason, and your schedule.
"use strict";

/* ---------- Reading a college season ---------- */
// "8-2, 5-1 in the Heartland Conference, No. 14 in the FBS"
function colStatus() {
  const me = SEASON.myId, s = mySchool(), r = colRecord(me), n = weeksDone(), ranks = colRanks(n), dv = divOf(s);
  const conf = s.conf ? `, ${r.cw}-${r.cl} in the ${confName(me)}` : "";
  const rank = ranks[me] <= 25 ? ` No. ${ranks[me]} in the ${DIVS[dv].name}.` : "";
  if (SEASON.phase === "preseason") return `Camp, then 12 games in the ${confName(me)}${COL_LEVELS[s.cls].title && s.conf ? ", a title game for the top two" : ""}, and the postseason.${rank}`;
  if (!n) return `12 games, then the postseason.${rank}`;
  let tail = "";
  if (SEASON.post) {
    const B = SEASON.post[dv], seed = B.seeds.indexOf(me) + 1, alive = B.cur.includes(me) && !B.champ;
    const bowl = SEASON.weeks[COL_POST].games.find(gm => gm.bowl && !gm.post && gameHas(gm, me));
    tail = B.champ === me ? ` National champions!` : seed ? (alive ? ` In the ${DIVS[dv].name} playoff as the No. ${seed} seed.` : ` Your playoff run is over.`) : bowl ? ` ${played(bowl) ? (winnerOf(bowl) === me ? "Won" : "Lost") + " the" : "Headed to the"} ${bowl.bowl}.` : " No postseason this year.";
  }
  return `${recText(r)}${conf}.${rank}${tail}`;
}
// "No. 7 Lakeshore State Panthers, 8-1"
const colTeamText = (id, ranks) => `${ranks && ranks[id] <= 25 ? `No. ${ranks[id]} ` : ""}${nameOf(id)}, ${recText(colRecord(id))}`;
function colScoreText(gm, ranks) {
  const w = winnerOf(gm), l = loserOf(gm), rk = id => ranks && ranks[id] <= 25 ? `No. ${ranks[id]} ` : "";
  return `${rk(w)}${nameOf(w)} ${Math.max(gm.hs, gm.as)}, ${rk(l)}${nameOf(l)} ${Math.min(gm.hs, gm.as)}${otText(gm)}${postName(gm) ? ` (${postName(gm)})` : ""}`;
}

/* ---------- The week ahead ---------- */
function vCSeason() {
  const s = mySchool(), id = s.id, n = SEASON.week, camp = inCamp(), live = liveSeasonGame(), gm = camp ? null : myGameIn(n), ranks = colRanks(weeksDone());
  let main = "";
  if (camp) main = campPanel();
  else if (live) main = `<section class="panel"><p class="eyebrow">${weekName(n)} · In progress</p><p>${esc(boardSummary())}</p><button class="btn" data-a="resume">Back to the game</button></section>`;
  else if (gm && !played(gm)) {
    const oid = opponentIn(gm, id), opp = seasonSchool(oid);
    main = `<section class="panel teamcard" style="--team:${opp.color}">
      <p class="eyebrow">${esc(`${weekName(n)} · ${colGameText(gm, id).replace(/: $/, "") || "Non-conference game"}${gm.neutral ? " · Neutral site" : ""}`)}</p>
      <h3>${esc(matchupText(gm))}</h3>
      <p class="muted">${esc(`${colTeamText(oid, ranks)}. ${levelName(opp.cls)}, ${confName(oid)}.`)} ${talentText(opp.rating)} Coach ${esc(coachName(opp.coach))}: ${esc(schemeText(opp))}.</p>
      <p>${esc(paperLine(gm))}</p>
      ${matchupTable(Object.assign({}, s, { depth: SEASON.nextDepth ? SEASON.nextDepth.depth : s.depth }), opp, s.mascot, opp.mascot)}
      <div class="choices"><button class="btn" data-a="playgame">${confirming === "playgame" ? "Tap again to leave the exhibition" : "Play the game"}</button><button class="btn ghost" data-a="keygame">${confirming === "keygame" ? "Tap again to leave the exhibition" : "Key moments"}</button><button class="btn ghost" data-a="simgame">${confirming === "simgame" ? "Tap again to leave the exhibition" : "Sim the game"}</button></div>
      <div class="choices"><button class="btn ghost" data-a="sroster" data-t="${id}">Your roster</button><button class="btn ghost" data-a="sroster" data-t="${oid}">${esc(opp.mascot)} roster</button></div>
    </section>
    ${practicePanel()}
    <section class="panel"><h3>Your schemes</h3>${styleSegs(s.off, s.def)}<p class="muted styledesc">${esc(knownLine(s))}</p></section>`;
  } else if (gm && played(gm)) main = `<section class="panel"><p class="eyebrow">${weekName(n)} · Final</p><h3>${esc(resultText(gm, id))}</h3><button class="btn" data-a="weekdone">${weekName(n)} results</button></section>`;
  else if (SEASON.phase === "over") {
    const ch = DIV_IDS.map(dv => `${DIVS[dv].name}: ${nameOf(SEASON.post[dv].champ)}`);
    main = `<section class="panel"><p class="eyebrow">${SEASON.year} season</p><h3>The season is over</h3><p>${esc(`${colFinishText(id)}. National champions. ${ch.join(". ")}.`)}</p>
      <button class="btn" data-a="summary">Season summary</button><div class="choices"><button class="btn ghost" data-a="offseason">On to the offseason</button><button class="btn ghost" data-a="bracket">The postseason</button></div></section>`;
  } else main = `<section class="panel"><p class="eyebrow">${weekName(n)}</p><h3>No game for you this week</h3><p>${esc(n <= COL_REG ? "A bye week." : "Your season is over, but the postseason goes on.")}</p><button class="btn" data-a="simweek">Sim the week</button></section>`;
  const last = weeksDone(), lastGm = last ? myGameIn(last) : null;
  const lastPanel = last && !(gm && played(gm)) && SEASON.phase !== "over" ? `<section class="panel"><p class="eyebrow">Last week</p>
      <p>${esc(weekName(last))}: ${lastGm && played(lastGm) ? esc(resultText(lastGm, id).replace(/^You/, "you")) + "." : "no game for you."}</p>
      <button class="btn ghost" data-a="week" data-v="${last}">${weekName(last)} results</button></section>` : "";
  const simBtn = camp ? null : SEASON.phase === "regular" && n <= COL_REG ? ["playoffs", "Sim to the postseason"] : SEASON.phase !== "over" ? ["end", "Sim the rest of the season"] : null;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`${SEASON.year} · ${levelName(s.cls)} · ${confName(id)}`)}</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(id))}</h2>
      <p class="muted">${esc(colStatus())}</p>
      ${SEASON.phase !== "over" ? `<p class="muted">${esc(expectText(expectOf(id)))}</p>` : ""}
    </div>
    ${main}
    ${camp ? `<section class="panel"><h3>Your schemes</h3>${styleSegs(s.off, s.def)}<p class="muted styledesc">${esc(knownLine(s))}</p></section>` : ""}
    ${lastPanel}
    ${SEASON.phase === "over" ? "" : recPanel()}
    ${s.conf ? `<section class="panel"><h3>${esc(confName(id))}</h3>${confTable(s.conf, Math.min(last, COL_REG), true)}</section>` : ""}
    <section class="panel"><h3>The season</h3>
      <div class="choices"><button class="btn ghost" data-a="standings">Conference standings</button><button class="btn ghost" data-a="top25">Top 25</button></div>
      <div class="choices"><button class="btn ghost" data-a="schedule">Schedule and stats</button>${SEASON.post ? `<button class="btn ghost" data-a="bracket">The postseason</button>` : ""}</div>
      <div class="choices">${gm && !played(gm) && !live && !camp ? "" : `<button class="btn ghost" data-a="sroster" data-t="${id}">Roster and depth chart</button>`}<button class="btn ghost" data-a="coach">Your coach</button></div>
    </section>
    ${simBtn && !live ? `<button class="btn ghost" data-a="simseason" data-v="${simBtn[0]}">${confirming === "simseason" ? `Tap again to ${simBtn[1].toLowerCase()}` : simBtn[1]}</button>`
      : camp ? `<button class="btn ghost" data-a="campsim">${confirming === "campsim" ? "Tap again to sim the rest of camp" : "Sim the rest of camp"}</button>` : ""}`;
}

/* ---------- Standings ---------- */
function confTable(cid, upTo, short) {
  const rows = confStandings(cid, upTo), started = upTo >= 1, c = SEASON.confs.find(x => x.id === cid);
  if (!started) rows.sort((a, b) => nameOf(a.id).localeCompare(nameOf(b.id)));
  const cols = short ? [["Conf", r => `${r.cw}-${r.cl}`], ["Overall", r => `${r.w}-${r.l}`]] : [["Conf", r => `${r.cw}-${r.cl}`], ["Overall", r => `${r.w}-${r.l}`], ["Scored", r => r.pf], ["Allowed", r => r.pa]];
  return `<div class="tablewrap flush"><table class="stand" aria-label="${esc(c.name)} standings">
    <thead><tr><th scope="col">School</th>${cols.map(([h]) => `<th scope="col">${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr${r.id === SEASON.myId ? ' class="me"' : ""}><th scope="row">${started ? `${r.place}. ` : ""}${esc(SEASON.schools[r.id].town)}${r.id === SEASON.myId ? " (you)" : ""}</th>${cols.map(([, f]) => `<td>${f(r)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}
function vCStandings() {
  const s = mySchool(), upTo = Math.min(weeksDone(), COL_REG);
  const confs = SEASON.confs.filter(c => c.cls === s.cls).sort((a, b) => (b.id === s.conf) - (a.id === s.conf));
  return `
    <div class="masthead">
      <p class="eyebrow">${esc(levelName(s.cls))}${upTo ? ` · Through ${weekName(upTo).toLowerCase()}` : ""}</p>
      <h2 data-focus tabindex="-1">Conference standings</h2>
      <p class="muted">Conference record first, then head-to-head, then the overall record.${COL_LEVELS[s.cls].title ? " The top two in each conference meet in its title game." : ""}</p>
    </div>
    ${confs.map(c => `<section class="panel"><h3>${esc(c.name)}${c.id === s.conf ? " (yours)" : ""}</h3>${confTable(c.id, upTo)}</section>`).join("")}
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- The top 25 ---------- */
function vCTop25() {
  const s = mySchool(), n = weeksDone(), dv = APP.topDiv && DIVS[APP.topDiv] ? APP.topDiv : divOf(s), top = colTop25(dv, n), ranks = colRanks(n);
  return `
    <div class="masthead">
      <p class="eyebrow">${SEASON.year} · ${n ? `Through ${weekName(n).toLowerCase()}` : "Preseason"}</p>
      <h2 data-focus tabindex="-1">${DIVS[dv].name} top 25</h2>
      <p class="muted">From each team's record, its schedule and its margins, with preseason talent counting less as the games come in.${ranks[s.id] > 25 && divOf(s) === dv ? ` You're No. ${ranks[s.id]}.` : ""}</p>
      <div style="display:grid;gap:6px" role="group" aria-label="Division"><span class="eyebrow" aria-hidden="true">Division</span><div class="seg">
        ${DIV_IDS.map(d => `<button data-a="topdiv" data-v="${d}" aria-pressed="${d === dv}">${DIVS[d].name}</button>`).join("")}</div></div>
    </div>
    <section class="panel"><ol class="hlist">${top.map(id => `<li${id === s.id ? ' class="me"' : ""}>${esc(`${ranks[id]}. ${SEASON.schools[id].town}, ${recText(colRecord(id, n))}${id === s.id ? " (you)" : ""}`)}</li>`).join("")}</ol></section>
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- The postseason ---------- */
function vCPost() {
  const s = mySchool(), me = s.id, dv = APP.topDiv && DIVS[APP.topDiv] ? APP.topDiv : divOf(s), B = SEASON.post[dv], ranks = colRanks(Math.min(weeksDone(), COL_TITLE_WEEK));
  const seed = id => B.seeds.indexOf(id) + 1, team = id => `No. ${seed(id)} seed ${nameOf(id)}`;
  const line = gm => played(gm) ? colScoreText(gm) : gm.neutral ? `${team(gm.h)} vs. ${team(gm.a)}` : `${team(gm.a)} at ${team(gm.h)}`;
  const rounds = B.rounds.map(r => r.map(([w, i]) => SEASON.weeks[w - 1].games[i]));
  const bowls = dv === "FBS" ? SEASON.weeks[COL_POST].games.filter(gm => gm.bowl && !gm.post) : [];
  const byes = B.seeds.filter(id => !(rounds[0] || []).some(gm => gameHas(gm, id)));
  return `
    <div class="masthead">
      <p class="eyebrow">${SEASON.year} postseason</p>
      <h2 data-focus tabindex="-1">${DIVS[dv].name} playoff</h2>
      <p class="muted">${esc(`${B.seeds.length} teams${dv === "FBS" ? ": the four power conference champions, the best-ranked champion of the other FBS conferences, and the best-ranked teams left" : ": the conference champions and the best-ranked teams left"}. Seeded by ranking${byes.length ? `, and the top ${byes.length} skip the first round` : ""}.${B.champ ? ` Champions: the ${nameOf(B.champ)}.` : ""}`)}</p>
      <div style="display:grid;gap:6px" role="group" aria-label="Division"><span class="eyebrow" aria-hidden="true">Division</span><div class="seg">
        ${DIV_IDS.map(d => `<button data-a="topdiv" data-v="${d}" aria-pressed="${d === dv}">${DIVS[d].name}</button>`).join("")}</div></div>
    </div>
    <section class="panel"><h3>The field</h3><ol class="hlist">${B.seeds.map((id, k) => `<li${id === me ? ' class="me"' : ""}>${esc(`${k + 1}. ${nameOf(id)}, ${recText(colRecord(id, COL_TITLE_WEEK))}`)}</li>`).join("")}</ol></section>
    ${rounds.map(r => `<section class="panel"><h3>${esc(r[0] ? capFirst(postName(r[0]).replace(/^.*playoff, /, "").replace(/ at the .*$/, "")) : "")}</h3><ul class="hlist">${r.map(gm => `<li${gameHas(gm, me) ? ' class="me"' : ""}>${esc(line(gm))}</li>`).join("")}</ul></section>`).join("")}
    ${bowls.length ? `<section class="panel"><h3>Bowls</h3><ul class="hlist">${bowls.map(gm => `<li${gameHas(gm, me) ? ' class="me"' : ""}>${esc(played(gm) ? colScoreText(gm, ranks) : `${gm.bowl}: ${colTeamText(gm.a, ranks)} vs. ${colTeamText(gm.h, ranks)}`)}</li>`).join("")}</ul></section>` : ""}
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- One week's results ---------- */
function vCWeek() {
  const n = APP.weekView, me = SEASON.myId, s = mySchool(), gm = myGameIn(n), mine = gm && played(gm), ranks = colRanks(n - 1);
  const list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const box = S && S.teams && S.season && S.season.seed === SEASON.seed && S.season.week === n && S.phase === "final";
  const games = weekGames(n).filter(played), news = SEASON.news[n] || [];
  const confGames = s.conf ? games.filter(g2 => SEASON.schools[g2.h].conf === s.conf || SEASON.schools[g2.a].conf === s.conf) : [];
  const ranked = games.filter(g2 => !confGames.includes(g2) && (ranks[g2.h] <= 25 && divOf(SEASON.schools[g2.h]) === divOf(s) || ranks[g2.a] <= 25 && divOf(SEASON.schools[g2.a]) === divOf(s)));
  const post = n >= COL_TITLE_WEEK ? games.filter(g2 => (g2.post || g2.bowl || g2.ctitle) && !confGames.includes(g2) && !ranked.includes(g2)) : [];
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${weekName(n)} results</p>
      <h2 data-focus tabindex="-1">${mine ? esc(resultText(gm, me)) : `${weekName(n)} results`}</h2>
      <p class="muted">${esc(colStatus())}</p>
    </div>
    ${box ? `<button class="btn ghost" data-a="boxscore">Box score and play-by-play</button>` : ""}
    ${xpLine(n) ? `<p class="banner">${esc(xpLine(n))}</p>` : ""}
    ${news.length ? `<section class="panel"><h3>News</h3>${list(news)}</section>` : ""}
    ${recWeekPanel(n)}
    ${injuryPanel(n)}
    ${confGames.length ? `<section class="panel"><h3>${esc(confName(me))}</h3>${list(confGames.map(g2 => colScoreText(g2, ranks)))}</section>` : ""}
    ${ranked.length ? `<section class="panel"><h3>Ranked teams</h3>${list(ranked.map(g2 => colScoreText(g2, ranks)))}</section>` : ""}
    ${post.length ? `<details><summary>The rest of the postseason</summary>${list(post.map(g2 => colScoreText(g2, ranks)))}</details>` : ""}
    ${APP.weekFrom === "schedule" ? `<button class="btn ghost" data-a="back">Back to the schedule</button>` : `<button class="btn" data-a="season">Continue</button>`}`;
}

/* ---------- Your schedule ---------- */
function vCSchedule() {
  const me = SEASON.myId, s = mySchool();
  const row = n => {
    const gm = myGameIn(n);
    if (!gm) return n <= COL_REG ? `<li class="sched">${weekName(n)}: bye.</li>` : "";
    const what = `${weekName(n)}, ${colGameText(gm, me).replace(/: $/, "").toLowerCase() || "non-conference"}: ${vsText(gm, me)}`;
    if (played(gm)) return `<li><button class="rowbtn" data-a="${n < SEASON.week ? "week" : "weekdone"}" data-v="${n}">${esc(what)}. ${esc(wonText(gm, me))}.</button></li>`;
    return `<li class="sched">${esc(what)}.${n === SEASON.week ? " Next game." : ""}</li>`;
  };
  const weeks = []; for (let n = 1; n <= COL_LAST; n++) weeks.push(n);
  const post = weeks.filter(n => n > COL_REG && myGameIn(n));
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(nameOf(me))}</p>
      <h2 data-focus tabindex="-1">Schedule and stats</h2>
      <p class="muted">${esc(colStatus())}</p>
    </div>
    <section class="panel"><h3>Regular season</h3><ol class="roster">${weeks.filter(n => n <= COL_REG).map(row).join("")}</ol></section>
    ${post.length ? `<section class="panel"><h3>Postseason</h3><ol class="roster">${post.map(row).join("")}</ol></section>` : ""}
    <section class="panel"><h3>Season stats</h3>${seasonStatsHtml(s)}</section>
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- The offseason ---------- */
// Who's moving on, who might leave early, and spring practice ahead
function vCOffseason() {
  const s = mySchool(), list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const line = p => `${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}.`;
  const seniors = s.players.filter(lastYearNow).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
  const early = s.players.filter(p => (p.yr === 11 || p.yr === 12) && ovr(p, p.pos) >= 74).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
  const gone = leavingSchool();
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(s.id))}</h2>
      <p class="muted">${esc(gone ? colStatus() : `${colStatus()} Spring practice comes next: four weeks with your practice plan, then the summer and fall camp.`)}</p>
    </div>
    ${gone ? newJobPanel() : ""}
    <section class="panel"><h3>Out of eligibility</h3>${seniors.length ? list(seniors.map(line)) : "<p>No fifth-year seniors are moving on.</p>"}</section>
    ${early.length ? `<section class="panel"><h3>Could leave early for the pros</h3><p>The best juniors and seniors may declare. The higher a player is rated, the likelier he goes.</p>${list(early.map(line))}</section>` : ""}
    ${portalPanel()}
    ${!gone && SEASON.rec && SEASON.rec.done ? `<section class="panel"><h3>Your new class</h3><p>${esc(recSummary(SEASON.rec))}</p><button class="btn ghost" data-a="board">The class</button></section>` : ""}
    ${gone ? "" : `<section class="panel"><h3>Spring practice</h3><p>${esc(`Four weeks with your practice plan. Opponent prep time goes into install.`)}</p><button class="btn ghost" data-a="practice">Practice plan</button></section>`}
    <section class="panel"><h3>Your coach</h3><p>${CAREER.xp || 0} XP to spend on ratings and perks.</p><button class="btn ghost" data-a="coach">Spend XP</button></section>
    <button class="btn" data-a="nextyear">Start the ${SEASON.year + 1} preseason</button>`;
}

/* ---------- Screens by level ---------- */
// The season's screens, for whichever level the season is
// (and the pros: ui_pros.js)
const byLevel = (hs, col, pro) => function () { return (SEASON && SEASON.lvl === "pro" && pro ? pro : SEASON && SEASON.lvl === "col" ? col : hs).apply(this, arguments); };
function collegeAct(a, ds) {
  if (!SEASON || SEASON.lvl !== "col") return false;
  switch (a) {
    case "top25": APP.topDiv = null; APP.screen = "top25"; scrollTop(); return true;
    case "topdiv": if (DIVS[ds.v]) { APP.topDiv = ds.v; announce(`${DIVS[ds.v].name}.`); } return true;
  }
  return false;
}
