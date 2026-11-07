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
      ${SEASON.phase !== "over" ? `<p class="muted">${esc(expectText(expectOf(id)))}</p>` : ""}
    </div>
    ${cutdownPanel()}
    ${camp && cutWait() ? `<section class="panel"><h3>Cutdown day</h3><p>${esc(`You're ${onActive(s).length - PRO_ACTIVE} over ${PRO_ACTIVE}, and the cuts are yours. Release players or move them to the practice squad from the roster, or let your staff cut to ${PRO_ACTIVE}.`)}</p><div class="choices"><button class="btn ghost" data-a="sroster" data-t="${id}">Your roster</button><button class="btn ghost" data-a="staffcut">Let your staff cut to ${PRO_ACTIVE}</button></div></section>` : ""}
    ${main}
    ${camp ? `<section class="panel"><h3>Your schemes</h3>${styleSegs(s.off, s.def)}<p class="muted styledesc">${esc(knownLine(s))}</p></section>` : ""}
    ${lastPanel}
    <section class="panel"><h3>${esc(proDivName(id))}</h3>${proDivTable(s.conf, Math.min(last, PRO_REG), true)}</section>
    <section class="panel"><h3>The season</h3>
      <div class="choices"><button class="btn ghost" data-a="standings">Standings and the playoff picture</button>${SEASON.post ? `<button class="btn ghost" data-a="bracket">The playoff</button>` : ""}</div>
      <div class="choices"><button class="btn ghost" data-a="schedule">Schedule and stats</button>${gm && !played(gm) && !live && !camp ? "" : `<button class="btn ghost" data-a="sroster" data-t="${id}">Roster and depth chart</button>`}<button class="btn ghost" data-a="coach">Your coach</button></div>
      <div class="choices"><button class="btn ghost" data-a="cap">The salary cap: ${esc(bigMoney(capRoom(s)))} of room</button><button class="btn ghost" data-a="gm">${CAREER.job && CAREER.job.ctl ? "Your front office" : "Your general manager"}</button>${CAREER.job && CAREER.job.ctl && tradesOpen(SEASON) ? `<button class="btn ghost" data-a="trade">Trades${SEASON.tradeOffer ? ", an offer waiting" : ""}</button>` : ""}${SEASON.draft ? `<button class="btn ghost" data-a="dboard">The ${SEASON.draft.year} draft board</button>` : ""}</div>
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
      <p class="muted">${esc(gone ? proStatus() : `${proStatus()} Re-signing and free agency come first, then the draft, then four weeks of the offseason program and training camp.`)}</p>
    </div>
    ${gone ? newJobPanel() : ""}
    ${gone ? "" : `<section class="panel"><h3>${CAREER.job && CAREER.job.ctl ? "Your front office" : "Your general manager"}</h3><p>${esc(gmLine())}</p><div class="choices"><button class="btn ghost" data-a="gm">${CAREER.job && CAREER.job.ctl ? "The front office" : "Requests for the GM"}</button>${CAREER.job && CAREER.job.ctl && tradesOpen(SEASON) ? `<button class="btn ghost" data-a="trade">Trades${SEASON.tradeOffer ? ", an offer waiting" : ""}</button>` : ""}</div></section>`}
    ${gone ? "" : offseasonFAPanels()}
    ${gone || !SEASON.draft || (SEASON.off && SEASON.off.stage !== "draft") ? "" : `<section class="panel"><h3>The ${SEASON.draft.year} draft</h3><p>${esc(SEASON.draft.done ? "The draft is done. Your rookies and undrafted free agents join you for camp." : `The combine is in. ${CAREER.job && CAREER.job.ctl ? "Your picks are yours" : "Your GM makes the picks, with a push from you each round"}. Whatever's left of the draft when the new season starts is picked for you.`)}</p><div class="choices"><button class="btn" data-a="draftroom">The draft room</button><button class="btn ghost" data-a="dboard">Your board</button></div></section>`}
    ${gone ? "" : `<section class="panel"><h3>The offseason program</h3><p>${esc("Four weeks of practice with your plan. Opponent prep time goes into install.")}</p><button class="btn ghost" data-a="practice">Practice plan</button></section>`}
    ${ownMoneyPanel()}
    <section class="panel"><h3>Your coach</h3><p>${CAREER.xp || 0} XP to spend on ratings and perks.</p><button class="btn ghost" data-a="coach">Spend XP</button></section>
    <button class="btn" data-a="nextyear">Start the ${SEASON.year + 1} preseason</button>`;
}

/* ---------- The salary cap ---------- */
// One line on the cap, then next year, the biggest contracts, the ones ending this year, and the dead money
function vCap() {
  const s = mySchool(), all = s.players.concat(teamPS(s)), used = capUsed(s), room = capRoom(s);
  const line = p => `${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}, ${yearName(p)}: ${proContractText(p)}`;
  const big = all.filter(p => p.ct).sort((a, b) => capHit(b) - capHit(a)).slice(0, 12), ending = all.filter(p => ctYears(p) === 1 && !teamPS(s).includes(p)).sort((a, b) => capHit(b) - capHit(a));
  const list = arr => `<ul class="hlist">${arr.map(p => `<li><button class="rowbtn" data-a="player" data-v="${p.id}">${esc(line(p))}</button></li>`).join("")}</ul>`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`${SEASON.year} · ${nameOf(s.id)}`)}</p>
      <h2 data-focus tabindex="-1">The salary cap</h2>
      <p class="muted">${esc(`The cap is ${bigMoney(capNow())} this year${s.carry ? `, plus ${bigMoney(s.carry)} carried over from last year` : ""}. ${bigMoney(used)} committed${s.dead ? `, ${bigMoney(s.dead)} of it dead money` : ""}. ${room >= 0 ? `${bigMoney(room)} of room` : `${bigMoney(-room)} over the cap`}.`)}</p>
    </div>
    <section class="panel"><h3>Next year</h3><p>${esc(`${bigMoney(capNext(s))} already committed for ${SEASON.year + 1}, against a cap of about ${bigMoney(capFor(SEASON.year + 1, capNow()))}.`)}</p></section>
    <section class="panel"><h3>The biggest contracts</h3>${list(big)}</section>
    ${ending.length ? `<section class="panel"><h3>Ending after this season</h3><p class="muted">Players with four or more seasons become free agents. The rest can be kept a year at their pay plus 10 percent.</p>${list(ending)}</section>` : ""}
    <section class="panel"><h3>How it works</h3><p>${esc(`A player's pay this year is his cap hit. When a player is cut, whatever's left of his guarantee counts against this year's cap as dead money, all at once. Unused cap space carries over to next year. The minimum salary goes from ${bigMoney(proMin(0))} for a rookie to ${bigMoney(proMin(7))} for a player with seven seasons or more.`)}</p></section>
    <button class="btn ghost" data-a="back">Back</button>`;
}
// Cutdown day, on the season screen until your first game
function cutdownPanel() {
  const C = SEASON.cutdown;
  if (!C || SEASON.week > 1 || inCamp()) return "";
  return `<section class="panel"><h3>Cutdown day</h3><p>${esc(`Your staff kept the best ${PRO_ACTIVE} and put ${C.ps} on the practice squad. ${C.cut.length ? `Let go: ${plural(C.cut.length, "player")}${C.dead ? `, with ${bigMoney(C.dead)} of dead money` : ""}.` : ""}${C.freed.length ? ` Released to get under the cap: ${andList(C.freed)}.` : ""}`)}</p>${C.cut.length ? `<details><summary>Who was let go</summary><ul class="hlist">${C.cut.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>` : ""}</section>`;
}

/* ---------- The general manager, or your front office ---------- */
// "General manager Dana Moss, a good one, builds through the draft. He listens to you."
function gmLine() {
  const J = CAREER.job, gm = proGM(mySchool());
  if (!J || J.lvl !== "pro") return "";
  if (J.ctl) return "You have control of the roster: the draft, free agency, trades and cuts are yours, and your staff handles what you hand it.";
  myReq();
  return `General manager ${gm.first} ${gm.last}, ${gmWord(gm.rt)}, ${GM_PHIL[gm.ph]}. ${standingWord(J.gms)} Your requests before re-signing, cutdown day, the draft and free agency: ${reqSummary()}.`;
}
function reqSummary() {
  const R = myReq(), s = mySchool(), nm = id => { const p = playerById(s, id); return p ? fullName(p) : "a player who's gone"; }, bits = [];
  if (R.needs.length) bits.push(`needs: ${R.needs.map(posName).join(", ")}`);
  if (R.keep.length) bits.push(`keep ${andList(R.keep.map(nm))}`);
  if (R.go.length) bits.push(`let go ${andList(R.go.map(nm))}`);
  if (R.want) bits.push(`go after ${R.want.name}`);
  return bits.length ? bits.join("; ") : "none yet";
}
const STAFF_JOBS = [["cut", "Cutdown day", "Your staff cuts to 53 at the end of camp."], ["board", "The draft board", "Your staff ranks the prospects, and you can move anyone."],
  ["late", "Late-round picks", "Your staff makes the picks from round 4 on."], ["udfa", "Undrafted free agents", "Your staff signs them after the draft."], ["trades", "Trade offers", "Your staff answers offers from other teams."]];
function vGM() {
  const s = mySchool(), J = CAREER.job, gm = proGM(s), R = myReq(), log = J.log || [];
  const nm = id => { const p = playerById(s, id); return p ? `${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}` : "a player who's gone"; };
  const reqList = (k, label) => `<p class="sechead" role="heading" aria-level="4">${label}</p>${R[k].length ? `<ul class="hlist">${R[k].map(id => `<li class="xprow"><span>${esc(nm(id))}</span><button class="btn ghost slim" data-a="gmdrop" data-t="${k}" data-v="${id}">Drop the request</button></li>`).join("")}</ul>` : `<p class="muted">None. Ask from a player's screen on your roster.</p>`}`;
  const body = J.ctl
    ? `<section class="panel"><h3>What your staff handles</h3><p class="muted">Anything big still waits for you.</p>${STAFF_JOBS.map(([k, name, desc]) => `<div class="xprow"><span>${esc(`${name}: ${desc}`)}</span><button class="btn ghost slim" data-a="staffjob" data-v="${k}" aria-pressed="${!!J.staff[k]}">${J.staff[k] ? "Staff handles it" : "You handle it"}</button></div>`).join("")}</section>`
    : `<section class="panel"><h3>Your needs</h3><p class="muted">Up to three positions, most important first, for the draft and free agency.</p><div class="seg wrap" role="group" aria-label="Needs">${POS_IDS.map(pos => `<button data-a="gmneed" data-v="${pos}" aria-pressed="${R.needs.includes(pos)}">${capFirst(posName(pos))}${R.needs.includes(pos) ? ` (${R.needs.indexOf(pos) + 1})` : ""}</button>`).join("")}</div></section>
      <section class="panel"><h3>Players</h3>${reqList("keep", "Keep")}${reqList("go", "Let go")}</section>
      ${SEASON.phase !== "regular" || SEASON.week <= TRADE_DEADLINE ? `<section class="panel"><h3>A trade</h3><p class="muted">${esc(`Ask him to trade for a starter at one position. He looks in the last week before the deadline, the Tuesday after week ${TRADE_DEADLINE}.`)}</p><div class="seg wrap" role="group" aria-label="Trade for">${POS_IDS.map(pos => `<button data-a="gmmove" data-v="${pos}" aria-pressed="${R.move === pos}">${capFirst(posName(pos))}</button>`).join("")}</div></section>` : ""}`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(nameOf(s.id))}</p>
      <h2 data-focus tabindex="-1">${J.ctl ? "Your front office" : "Your general manager"}</h2>
      <p class="muted">${esc(J.ctl ? gmLine() : `${gm.first} ${gm.last}, ${gmWord(gm.rt)} (rated ${gm.rt}), ${GM_PHIL[gm.ph]}. He runs the draft, free agency, re-signing, trades and cuts. ${standingWord(J.gms)} Your standing with him is ${Math.round(J.gms)} of 100: it rises when you win and when moves you backed work out.`)}</p>
    </div>
    ${body}
    ${log.length ? `<section class="panel"><h3>His answers</h3><ul class="hlist">${log.map(x => `<li>${esc(x.t)}.</li>`).join("")}</ul></section>` : ""}
    <button class="btn ghost" data-a="back">Back</button>`;
}
// A player's buttons in the pros, on your own roster: requests for the GM, or with control your moves
function proPlayerActions(tm, p) {
  const J = CAREER && CAREER.job;
  if (!inPros() || !J || J.lvl !== "pro" || tm.id !== SEASON.myId) return "";
  if (!J.ctl) {
    const R = myReq(), k = R.keep.includes(p.id), g = R.go.includes(p.id);
    return `<div class="choices"><button class="btn ghost" data-a="gmkeep" data-v="${p.id}" aria-pressed="${k}">${k ? "Asked the GM to keep him" : "Ask the GM to keep him"}</button><button class="btn ghost" data-a="gmgo" data-v="${p.id}" aria-pressed="${g}">${g ? "Asked the GM to let him go" : "Ask the GM to let him go"}</button></div>`;
  }
  const onPS = teamPS(tm).some(q => q.id === p.id), btns = [];
  if (onPS) btns.push(`<button class="btn ghost" data-a="tor" data-v="${p.id}">Promote him to the roster</button>`);
  else if (!p.ir && psEligible(tm, p) && teamPS(tm).length < PS_MAX) btns.push(`<button class="btn ghost" data-a="tops" data-v="${p.id}">Move him to the practice squad</button>`);
  btns.push(`<button class="btn ghost" data-a="release" data-v="${p.id}">${confirming === "release" ? `Tap again to release him${p.ct && p.ct.g ? ` (${bigMoney(p.ct.g)} of dead money)` : ""}` : "Release him"}</button>`);
  return `<div class="choices">${btns.join("")}</div>`;
}
function proAct(a, ds) {
  if (!inPros() || !SEASON.myId) return false;
  const J = CAREER && CAREER.job, s = mySchool();
  if (!J || J.lvl !== "pro") return false;
  switch (a) {
    case "gm": APP.gmBack = APP.screen; APP.screen = "gm"; scrollTop(); return true;
    case "gmneed": {
      const R = myReq(), i = R.needs.indexOf(ds.v);
      if (!POS_INFO[ds.v]) return true;
      if (i >= 0) R.needs.splice(i, 1); else if (R.needs.length < GM_REQ_MAX) R.needs.push(ds.v); else { announce(`Three needs at most. Drop one first.`); return true; }
      announce(R.needs.length ? `Needs: ${R.needs.map(posName).join(", ")}.` : "No needs."); return true;
    }
    case "gmkeep": case "gmgo": {
      const R = myReq(), k = a === "gmkeep" ? "keep" : "go", o = k === "keep" ? "go" : "keep", p = playerById(s, ds.v);
      if (!p) return true;
      if (R[k].includes(p.id)) { R[k] = R[k].filter(x => x !== p.id); announce("Request dropped."); return true; }
      if (R[k].length >= GM_REQ_MAX) { announce(`Three players at most. Drop one first.`); return true; }
      R[o] = R[o].filter(x => x !== p.id); R[k].push(p.id);
      announce(k === "keep" ? `You asked the GM to keep ${fullName(p)}.` : `You asked the GM to let ${fullName(p)} go.`); return true;
    }
    case "gmdrop": { const R = myReq(); if (R[ds.t]) R[ds.t] = R[ds.t].filter(x => x !== ds.v); announce("Request dropped."); return true; }
    case "staffjob": if (J.ctl && J.staff && ds.v in J.staff) { J.staff[ds.v] = !J.staff[ds.v]; announce(J.staff[ds.v] ? "Your staff handles it." : "You handle it."); } return true;
    case "release": {
      if (!J.ctl || !confirmed("release")) return true;
      const r = releasePlayer(s, ds.v);
      if (r) { APP.screen = "roster"; announce(`${fullName(r.p)} released.${r.dead ? ` ${bigMoney(r.dead)} of dead money.` : ""} ${onActive(s).length} on the roster.`); }
      return true;
    }
    case "tops": if (J.ctl && toPracticeSquad(s, ds.v)) { APP.screen = "roster"; announce(`Moved to the practice squad. ${onActive(s).length} on the roster, ${teamPS(s).length} on the practice squad.`); } return true;
    case "tor": if (J.ctl) { if (toRoster(s, ds.v)) { APP.screen = "roster"; announce(`Promoted to the roster. ${onActive(s).length} on the roster.`); } else announce(`The roster is full at ${PRO_ACTIVE}. Release or move someone first.`); } return true;
    case "staffcut": if (inCamp() && cutWait()) { J.staff.cut = true; const r = campNext(); J.staff.cut = false; APP.screen = "season"; announce(r ? "Your staff cut to 53. Camp is over: week 1 is next." : "Your staff cut to 53."); } return true;
  }
  return false;
}
