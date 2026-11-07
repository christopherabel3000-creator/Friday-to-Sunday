// Friday to Sunday: the pro season's screens (Milestone 5). The week ahead, each week's results,
// division standings and the playoff picture, the playoff, and your schedule.
"use strict";

/* ---------- Reading a pro season ---------- */
// "10-5, 3-1 in the Atlantic North. No. 3 seed if the season ended today."
function proStatus() {
  const me = SEASON.myId, r = proRecord(me), n = weeksDone(), div = proDivName(me);
  if (SEASON.phase === "preseason") return `Camp and three preseason weeks, then 17 games in the ${div} and the ${PRO_CONF_NAMES[proCf(me)]}, and the playoff.`;
  if (!n) return `17 games, then the playoff.`;
  let tail = "";
  if (SEASON.post) {
    const B = SEASON.post[proCf(me)], seed = B.seeds.indexOf(me) + 1, alive = B.alive.includes(me) && !SEASON.post.champ;
    tail = SEASON.post.champ === me ? ` ${PRO_BOWL} champions!` : seed ? (alive ? ` In the playoff as the No. ${seed} seed.` : " Your playoff run is over.") : " No playoff this year.";
  } else if (n >= 4) {
    const seed = proPicture(proCf(me), n).indexOf(me) + 1;
    tail = seed ? ` The No. ${seed} seed if the season ended today.` : " Out of the playoff picture for now.";
  }
  return `${proRecText(r)}, ${r.dw}-${r.dl}${r.dt ? `-${r.dt}` : ""} in the ${div}.${tail}`;
}
// "Marlow Monarchs, 8-3"
const proTeamText = id => `${nameOf(id)}, ${proRecText(proRecord(id, PRO_LAST))}`;
function proScoreText(gm) {
  const tail = `${otText(gm)}${proPostName(gm) ? ` (${proPostName(gm)})` : ""}`;
  if (gm.hs === gm.as) return `${nameOf(gm.a)} ${gm.as}, ${nameOf(gm.h)} ${gm.hs}, a tie${tail}`;
  const w = winnerOf(gm), l = loserOf(gm);
  return `${nameOf(w)} ${Math.max(gm.hs, gm.as)}, ${nameOf(l)} ${Math.min(gm.hs, gm.as)}${tail}`;
}

/* ---------- The week ahead ---------- */
function vPSeason() {
  const s = mySchool(), id = s.id, n = SEASON.week, camp = inCamp(), live = liveSeasonGame(), gm = camp ? null : myGameIn(n);
  let main = "";
  if (camp) main = campPanel();
  else if (live) main = `<section class="panel"><p class="eyebrow">${weekName(n)} · In progress</p><p>${esc(boardSummary())}</p><button class="btn" data-a="resume">Back to the game</button></section>`;
  else if (gm && !played(gm)) {
    const oid = opponentIn(gm, id), opp = seasonSchool(oid);
    main = `<section class="panel teamcard" style="--team:${opp.color}">
      <p class="eyebrow">${esc(`${weekName(n)} · ${proGameText(gm).replace(/: $/, "") || (gm.cf ? "Conference game" : "Interconference game")}${gm.neutral ? " · Neutral site" : ""}`)}</p>
      <h3>${esc(matchupText(gm))}</h3>
      <p class="muted">${esc(`${proTeamText(oid)}. ${proDivName(oid)}.`)} ${talentText(opp.rating)} Coach ${esc(coachName(opp.coach))}: ${esc(schemeText(opp))}.</p>
      <p>${esc(paperLine(gm))}</p>
      ${matchupTable(Object.assign({}, s, { depth: SEASON.nextDepth ? SEASON.nextDepth.depth : s.depth }), opp, s.mascot, opp.mascot)}
      <div class="choices"><button class="btn" data-a="playgame">${confirming === "playgame" ? "Tap again to leave the exhibition" : "Play the game"}</button><button class="btn ghost" data-a="keygame">${confirming === "keygame" ? "Tap again to leave the exhibition" : "Key moments"}</button><button class="btn ghost" data-a="simgame">${confirming === "simgame" ? "Tap again to leave the exhibition" : "Sim the game"}</button></div>
      <div class="choices"><button class="btn ghost" data-a="sroster" data-t="${id}">Your roster</button><button class="btn ghost" data-a="sroster" data-t="${oid}">${esc(opp.mascot)} roster</button></div>
    </section>
    ${practicePanel()}
    <section class="panel"><h3>Your schemes</h3>${styleSegs(s.off, s.def)}<p class="muted styledesc">${esc(knownLine(s))}</p></section>`;
  } else if (gm && played(gm)) main = `<section class="panel"><p class="eyebrow">${weekName(n)} · Final</p><h3>${esc(resultText(gm, id))}</h3><button class="btn" data-a="weekdone">${weekName(n)} results</button></section>`;
  else if (SEASON.phase === "over") {
    main = `<section class="panel"><p class="eyebrow">${SEASON.year} season</p><h3>The season is over</h3><p>${esc(`${proFinishText(id)}. ${PRO_BOWL} champions: the ${nameOf(SEASON.post.champ)}.`)}</p>
      <button class="btn" data-a="summary">Season summary</button><div class="choices"><button class="btn ghost" data-a="offseason">On to the offseason</button><button class="btn ghost" data-a="bracket">The playoff</button></div></section>`;
  } else main = `<section class="panel"><p class="eyebrow">${weekName(n)}</p><h3>No game for you this week</h3><p>${esc(n <= PRO_REG ? "Your bye week." : SEASON.post && SEASON.post[proCf(id)].seeds[0] === id && n === PRO_WC ? "The top seed has a bye in the wild-card round." : "Your season is over, but the playoff goes on.")}</p><button class="btn" data-a="simweek">Sim the week</button></section>`;
  const last = weeksDone(), lastGm = last ? myGameIn(last) : null;
  const lastPanel = last && !(gm && played(gm)) && SEASON.phase !== "over" ? `<section class="panel"><p class="eyebrow">Last week</p>
      <p>${esc(weekName(last))}: ${lastGm && played(lastGm) ? esc(resultText(lastGm, id).replace(/^You/, "you")) + "." : "no game for you."}</p>
      <button class="btn ghost" data-a="week" data-v="${last}">${weekName(last)} results</button></section>` : "";
  const simBtn = camp ? null : SEASON.phase === "regular" && n <= PRO_REG ? ["playoffs", "Sim to the playoff"] : SEASON.phase !== "over" ? ["end", "Sim the rest of the season"] : null;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`${SEASON.year} · ${PRO_CONF_NAMES[proCf(id)]} · ${proDivName(id)}`)}</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(id))}</h2>
      <p class="muted">${esc(proStatus())}</p>
    </div>
    ${main}
    ${camp ? `<section class="panel"><h3>Your schemes</h3>${styleSegs(s.off, s.def)}<p class="muted styledesc">${esc(knownLine(s))}</p></section>` : ""}
    ${lastPanel}
    <section class="panel"><h3>${esc(proDivName(id))}</h3>${proDivTable(s.conf, Math.min(last, PRO_REG), true)}</section>
    <section class="panel"><h3>The season</h3>
      <div class="choices"><button class="btn ghost" data-a="standings">Standings and the playoff picture</button>${SEASON.post ? `<button class="btn ghost" data-a="bracket">The playoff</button>` : ""}</div>
      <div class="choices"><button class="btn ghost" data-a="schedule">Schedule and stats</button>${gm && !played(gm) && !live && !camp ? "" : `<button class="btn ghost" data-a="sroster" data-t="${id}">Roster and depth chart</button>`}<button class="btn ghost" data-a="coach">Your coach</button></div>
    </section>
    ${simBtn && !live ? `<button class="btn ghost" data-a="simseason" data-v="${simBtn[0]}">${confirming === "simseason" ? `Tap again to ${simBtn[1].toLowerCase()}` : simBtn[1]}</button>`
      : camp ? `<button class="btn ghost" data-a="campsim">${confirming === "campsim" ? "Tap again to sim the rest of camp" : "Sim the rest of camp"}</button>` : ""}`;
}

/* ---------- Standings and the playoff picture ---------- */
function proDivTable(did, upTo, short) {
  const rows = proDivStandings(did, upTo), started = upTo >= 1, d = SEASON.confs.find(x => x.id === did);
  if (!started) rows.sort((a, b) => nameOf(a.id).localeCompare(nameOf(b.id)));
  const cols = short ? [["Record", r => proRecText(r)], ["Division", r => proRecText({ w: r.dw, l: r.dl, t: r.dt })]]
    : [["Record", r => proRecText(r)], ["Division", r => proRecText({ w: r.dw, l: r.dl, t: r.dt })], ["Conference", r => proRecText({ w: r.cw, l: r.cl, t: r.ct })], ["Scored", r => r.pf], ["Allowed", r => r.pa]];
  return `<div class="tablewrap flush"><table class="stand" aria-label="${esc(d.name)} standings">
    <thead><tr><th scope="col">Team</th>${cols.map(([h]) => `<th scope="col">${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr${r.id === SEASON.myId ? ' class="me"' : ""}><th scope="row">${started ? `${r.place}. ` : ""}${esc(SEASON.schools[r.id].town)}${r.id === SEASON.myId ? " (you)" : ""}</th>${cols.map(([, f]) => `<td>${f(r)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}
function vPStandings() {
  const s = mySchool(), upTo = Math.min(weeksDone(), PRO_REG), mine = proCf(s.id);
  const cfs = mine === "A" ? ["A", "P"] : ["P", "A"];
  const picture = cf => {
    if (upTo < 1) return "";
    const seeds = SEASON.post ? SEASON.post[cf].seeds : proPicture(cf, upTo);
    return `<section class="panel"><h3>${esc(`${PRO_CONF_NAMES[cf]}: ${SEASON.post ? "the playoff field" : "if the season ended today"}`)}</h3><ol class="hlist">${seeds.map((id, k) => `<li${id === s.id ? ' class="me"' : ""}>${esc(`${k + 1}. ${nameOf(id)}, ${proRecText(proRecord(id, upTo))}${k < 4 ? ", division leader" : ", wild card"}${id === s.id ? " (you)" : ""}`)}</li>`).join("")}</ol></section>`;
  };
  return `
    <div class="masthead">
      <p class="eyebrow">${esc(PRO_LEAGUE.replace(/^the /, "The "))}${upTo ? ` · Through ${weekName(upTo).toLowerCase()}` : ""}</p>
      <h2 data-focus tabindex="-1">Standings</h2>
      <p class="muted">Ties count as half a win. Ties in the standings go to head-to-head, then the division record, common games, the conference record, and strength of victory. Seven teams from each conference make the playoff: the four division winners and three wild cards.</p>
    </div>
    ${cfs.map(cf => `${picture(cf)}${SEASON.confs.filter(d => d.cf === cf).sort((a, b) => (b.id === s.conf) - (a.id === s.conf)).map(d => `<section class="panel"><h3>${esc(d.name)}${d.id === s.conf ? " (yours)" : ""}</h3>${proDivTable(d.id, upTo)}</section>`).join("")}`).join("")}
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- The playoff ---------- */
function vPPost() {
  const s = mySchool(), me = s.id, P = SEASON.post;
  const seedOf = id => { const cf = proCf(id); return P[cf].seeds.indexOf(id) + 1; }, team = id => `No. ${seedOf(id)} ${nameOf(id)}`;
  const line = gm => played(gm) ? proScoreText(gm) : gm.neutral ? `${PRO_BOWL}: ${team(gm.a)} vs. ${team(gm.h)}` : `${team(gm.a)} at ${team(gm.h)}`;
  const rounds = P.rounds.map(r => r.map(([w, i]) => SEASON.weeks[w - 1].games[i]));
  return `
    <div class="masthead">
      <p class="eyebrow">${SEASON.year} playoff</p>
      <h2 data-focus tabindex="-1">The playoff</h2>
      <p class="muted">${esc(`Seven teams from each conference. The top seed has a bye, and the best seed left hosts the worst one left each round. The ${PRO_BOWL} is at a neutral site.${P.champ ? ` Champions: the ${nameOf(P.champ)}.` : ""}`)}</p>
    </div>
    ${PRO_CONF_IDS.map(cf => `<section class="panel"><h3>${esc(PRO_CONF_NAMES[cf])}</h3><ol class="hlist">${P[cf].seeds.map((id, k) => `<li${id === me ? ' class="me"' : ""}>${esc(`${k + 1}. ${nameOf(id)}, ${proRecText(proRecord(id, PRO_REG))}${k === 0 ? ", bye" : ""}`)}</li>`).join("")}</ol></section>`).join("")}
    ${rounds.map((r, k) => `<section class="panel"><h3>${esc(PRO_ROUND_NAMES[k + 1])}</h3><ul class="hlist">${r.map(gm => `<li${gameHas(gm, me) ? ' class="me"' : ""}>${esc(line(gm))}</li>`).join("")}</ul></section>`).join("")}
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- One week's results ---------- */
function vPWeek() {
  const n = APP.weekView, me = SEASON.myId, s = mySchool(), gm = myGameIn(n), mine = gm && played(gm);
  const list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const box = S && S.teams && S.season && S.season.seed === SEASON.seed && S.season.week === n && S.phase === "final";
  const games = weekGames(n).filter(played), news = SEASON.news[n] || [];
  const divGames = games.filter(g2 => SEASON.schools[g2.h].conf === s.conf || SEASON.schools[g2.a].conf === s.conf);
  const rest = games.filter(g2 => !divGames.includes(g2));
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${weekName(n)} results</p>
      <h2 data-focus tabindex="-1">${mine ? esc(resultText(gm, me)) : `${weekName(n)} results`}</h2>
      <p class="muted">${esc(proStatus())}</p>
    </div>
    ${box ? `<button class="btn ghost" data-a="boxscore">Box score and play-by-play</button>` : ""}
    ${xpLine(n) ? `<p class="banner">${esc(xpLine(n))}</p>` : ""}
    ${news.length ? `<section class="panel"><h3>News</h3>${list(news)}</section>` : ""}
    ${injuryPanel(n)}
    ${divGames.length ? `<section class="panel"><h3>${esc(proDivName(me))}</h3>${list(divGames.map(proScoreText))}</section>` : ""}
    ${rest.length ? `<details><summary>Around the league</summary>${list(rest.map(proScoreText))}</details>` : ""}
    ${APP.weekFrom === "schedule" ? `<button class="btn ghost" data-a="back">Back to the schedule</button>` : `<button class="btn" data-a="season">Continue</button>`}`;
}

/* ---------- Your schedule ---------- */
function vPSchedule() {
  const me = SEASON.myId, s = mySchool();
  const row = n => {
    const gm = myGameIn(n);
    if (!gm) return n <= PRO_REG ? `<li class="sched">${weekName(n)}: bye.</li>` : "";
    const what = `${weekName(n)}, ${proGameText(gm).replace(/: $/, "").toLowerCase() || (gm.cf ? "conference game" : "interconference game")}: ${vsText(gm, me)}`;
    if (played(gm)) return `<li><button class="rowbtn" data-a="${n < SEASON.week ? "week" : "weekdone"}" data-v="${n}">${esc(what)}. ${esc(wonText(gm, me))}.</button></li>`;
    return `<li class="sched">${esc(what)}.${n === SEASON.week ? " Next game." : ""}</li>`;
  };
  const weeks = []; for (let n = 1; n <= PRO_LAST; n++) weeks.push(n);
  const post = weeks.filter(n => n > PRO_REG && myGameIn(n));
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(nameOf(me))}</p>
      <h2 data-focus tabindex="-1">Schedule and stats</h2>
      <p class="muted">${esc(proStatus())}</p>
    </div>
    <section class="panel"><h3>Regular season</h3><ol class="roster">${weeks.filter(n => n <= PRO_REG).map(row).join("")}</ol></section>
    ${post.length ? `<section class="panel"><h3>Playoff</h3><ol class="roster">${post.map(row).join("")}</ol></section>` : ""}
    <section class="panel"><h3>Season stats</h3>${seasonStatsHtml(s)}</section>
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- The offseason ---------- */
function vPOffseason() {
  const s = mySchool(), gone = leavingSchool();
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(s.id))}</h2>
      <p class="muted">${esc(gone ? proStatus() : `${proStatus()} The offseason program comes next: four weeks with your practice plan, then training camp.`)}</p>
    </div>
    ${gone ? newJobPanel() : ""}
    ${gone ? "" : `<section class="panel"><h3>The offseason program</h3><p>${esc("Four weeks of practice with your plan. Opponent prep time goes into install.")}</p><button class="btn ghost" data-a="practice">Practice plan</button></section>`}
    <section class="panel"><h3>Your coach</h3><p>${CAREER.xp || 0} XP to spend on ratings and perks.</p><button class="btn ghost" data-a="coach">Spend XP</button></section>
    <button class="btn" data-a="nextyear">Start the ${SEASON.year + 1} preseason</button>`;
}
