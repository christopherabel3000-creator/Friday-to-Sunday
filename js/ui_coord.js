// Friday to Sunday: a coordinator's screens (Milestone 6). What the season, practice, review, job
// market and coach's page say when you call one side of the ball for a computer head coach.
"use strict";

/* ---------- The head coach ---------- */
// "Coach Tom Knight: Offense 55, Defense 48, Special teams 50, Game management 52. He runs the Spread offense and the 4-3 defense."
function hcLine(s) {
  const c = s.coach;
  if (!c) return "";
  const rate = [["off", "Offense"], ["def", "Defense"], ["st", "Special teams"], ["gm", "Game management"]].filter(([k]) => c[k] != null).map(([k, nm]) => `${nm} ${Math.round(c[k])}`).join(", ");
  return `Coach ${coachName(c)}${c.age ? `, age ${c.age}` : ""}: ${rate}.`;
}
// "Offensive coordinator under Coach Knight."
const coordUnderLine = () => `${COORD_ROLES[coordRole()]} under ${hcName()}.`;
// The side of the ball a head coach calls himself on your team
const hcSideWord = () => (coordRole() === "oc" ? "defense" : "offense");

/* ---------- The season screen ---------- */
// Under the school's name: your job, and your side's rank and expectation
function coordMast() {
  const role = coordRole();
  if (!role) return "";
  return `<p class="muted">${esc(coordUnderLine())}</p>${SEASON.phase !== "offseason" ? `<p class="muted">${esc(unitLine(role))}</p>` : ""}`;
}
// Your scheme: your side's style only. The head coach's style runs the other side.
function coordSchemes(me) {
  const role = coordRole(), isOff = role === "oc", ids = isOff ? OFF_STYLE_IDS : DEF_STYLE_IDS, book = isOff ? OFF_STYLES : DEF_STYLES, cur = (isOff ? me.off : me.def) || "bal";
  const a = isOff ? "ostyle" : "dstyle", lbl = isOff ? "Offensive style" : "Defensive style", his = isOff ? DEF_STYLES[me.def || "bal"] : OFF_STYLES[me.off || "bal"];
  return `<section class="panel"><h3>Your scheme</h3>
    <div style="display:grid;gap:6px" role="group" aria-label="${lbl}"><span class="eyebrow" aria-hidden="true">${lbl}</span><div class="seg grid2">
      ${ids.map(x => `<button data-a="${a}" data-v="${x}" aria-pressed="${cur === x}">${book[x].short}</button>`).join("")}
    </div><p class="muted styledesc">${esc(book[cur].desc)}</p></div>
    <p class="muted styledesc">${esc(`${hcName()} runs the ${his ? his.name : "Balanced"} ${hcSideWord()}.`)}</p></section>`;
}

/* ---------- Practice ---------- */
const hcPlanNow = () => (inCamp() ? CPU_CAMP : CPU_PLAN);
const UNIT_WORDS = { oc: "quarterbacks, backs, receivers and tight ends, and the offensive line", dc: "the defensive line and linebackers, and the secondary" };
function vCoordPractice() {
  const role = coordRole(), plan = SEASON.plan, hc = hcPlanNow(), b = blocksOf(coordPlan(planNow(), hc)), done = practiced(), n = practiceSlot(), camp = inCamp();
  const row = id => `<div style="display:grid;gap:6px" role="group" aria-label="${AREA_NAMES[id]}"><span class="eyebrow" aria-hidden="true">${AREA_NAMES[id]} · ${blocksText(b[id])}</span>
    <div class="seg">${INTENSITY.map((nm, v) => `<button data-a="parea" data-t="${id}" data-v="${v}" aria-pressed="${(plan.areas[id] || 0) === v}">${nm}</button>`).join("")}</div></div>`;
  const focus = (plan.focus || []).filter(id => playName(id) && coordPlay(role, id));
  return `
    <div class="masthead" style="--team:${mySchool().color}">
      <p class="eyebrow">${practiceWeekName(n)} · Practice</p>
      <h2 data-focus tabindex="-1">Your ${COORD_SIDE[role]}'s practice</h2>
      <p class="muted">${esc(`${hcName()} sets the week: ${CONTACT[hc.contact].name.toLowerCase()}, with his own share for conditioning and recovery, and he runs the ${hcSideWord()} and the kickers. You plan your side's time: fundamentals, install and opponent prep. The plan carries over from week to week.`)}</p>
    </div>
    ${done ? `<p class="banner">This week's practice is done. Changes here start next week.</p>` : ""}
    <section class="panel">
      <h3>Fundamentals</h3>
      ${row("fund")}
      <p class="muted styledesc">${esc(`Individual periods for your position groups: ${UNIT_WORDS[role]}. They grow with your Development rating.`)}</p>
    </section>
    <section class="panel">
      <h3>Team</h3>
      ${row("install")}
      <p class="muted styledesc">${focus.length ? `Install focus: ${esc(andList(focus.map(playName)))}.` : `No install focus: install time is spread over your ${COORD_SIDE[role]}'s whole playbook.`}</p>
      <button class="btn ghost slim" data-a="install">Pick plays to install</button>
      ${row("prep")}
      <p class="muted styledesc">${camp ? "In camp there's no opponent to study, so this time goes into install." : `Film study of their ${role === "oc" ? "defense" : "offense"}: ${PREP_TEXT[prepLevelFor(b.prep, CAREER.coach, mySchool())]}, and a small edge when they run the calls you studied.`}</p>
    </section>
    <section class="panel">
      <h3>This week</h3>
      <p>${capFirst(blocksLine({ fund: b.fund, install: b.install, prep: b.prep }))}.${camp ? "" : ` The team should start the game about ${freshOf(blocksOf(hc), hc.contact)} percent fresh.`}</p>
      ${done ? `<button class="btn" data-a="preport">Practice report</button>` : `<button class="btn" data-a="hold">Hold practice</button>`}
    </section>
    <button class="btn ghost" data-a="back">Back to the week</button>`;
}
// The practice panel on the season screen
function coordPracticePanel() {
  const done = practiced(), P = SEASON.practice, hurt = mySchool().players.filter(p => p.inj);
  return `<section class="panel">
      <h3>Practice</h3>
      <p>${done ? `Done for the week. ${P.prep ? "The scouting report is ready." : "No film study this week."}` : `Your ${coordSideWord()}'s week is planned. Practice happens before kickoff if you don't hold it first.`}</p>
      ${hurt.length ? `<p>Out: ${esc(andList(hurt.map(outLine)))}.</p>` : ""}
      <div class="choices"><button class="btn ghost" data-a="practice">Practice plan</button>${done ? `<button class="btn ghost" data-a="preport">Practice report</button>` : `<button class="btn ghost" data-a="hold">Hold practice</button>`}</div>
      ${done && P.film ? `<button class="btn ghost" data-a="scout">Scouting report</button>` : ""}
    </section>`;
}

/* ---------- The grade ---------- */
// "Your offense scored 27.4 points a game, against about 24 expected, 3rd of 8 in the district. The team's season counts for a quarter: met expectations."
function coordGradeWhy(x) {
  const oc = x.role === "oc", side = oc ? "offense" : "defense";
  const rank = x.urank ? `, ${nth(x.urank)} of ${x.uof} in ${unitGroup().name}` : "";
  return `Your ${side} ${oc ? "scored" : "allowed"} ${x.pts} points a game, against about ${Math.round(x.epts)} expected${rank}. That's three parts of the grade (${signed(x.ug)}); the team's season is the fourth (${signed(x.tg)}, ${gradeWord(x.tg)}).${x.top ? ` The best ${side} in ${unitGroup().name}.` : ""}`;
}
function coordGradePanel(last) {
  return `<section class="panel"><h3>Your grade: ${esc(capFirst(gradeWord(last.g)))} (${signed(last.g)})</h3>
    <p>${esc(coordGradeWhy(last))}</p>
    <p>${esc(`${repText(last.rep)} That's ${last.drep >= 0 ? "up" : "down"} ${Math.abs(last.drep).toFixed(1)}.`)}</p></section>`;
}

/* ---------- The head coach's review ---------- */
const trustWord = sec => sec >= 70 ? `${hcName()} trusts you.` : sec >= 45 ? `${hcName()} expects more from your side.` : "You're on the hot seat.";
function vCoordReview() {
  const R = yearEndReview(), s = mySchool(), J = myJob(), last = CAREER.seasons.find(x => x.seed === SEASON.seed), role = R.role || J.role, title = (COORD_ROLES[role] || "coordinator").toLowerCase();
  const seasons = plural(J.ten, "season"), gone = R.hcGone ? hcGoneText(R) : "";
  let head, body;
  if (R.letGo) { head = "The new coach is bringing his own staff"; body = `${gone} The school's next head coach isn't keeping you as ${title}.${R.buyout ? ` The rest of your contract is paid out: ${moneyText(R.buyout)}.` : ""} It isn't a firing, and every job that's interested in you is in the job market.`; }
  else if (R.fired) { head = "You're let go"; body = `Coach ${R.hc} let you go after ${seasons} as his ${title}. Every job that's interested in you is in the job market, and someone will hire you.`; }
  else if (R.promo) { head = "The job is yours if you want it"; body = `${gone} The ${jobName(s.id)} want you as their next head coach. The offer is in the job market${R.follow ? `, and so is his: he wants you to come with him as his ${title}` : ""}.`; }
  else if (R.follow) { head = "He wants you to come with him"; body = `${gone} He's asked you to come along as his ${title}: the offer is in the job market. If you stay, you'll work for whoever the ${jobName(s.id)} hire.`; }
  else if (R.kept) { head = "You're staying on"; body = `${gone} The school's next head coach is keeping you as ${title}.`; }
  else { head = trustWord(J.sec); body = J.ten === 1 ? `After your first season as Coach ${R.hc}'s ${title}. A new coordinator gets two full seasons before he can be let go.` : `After ${seasons} as Coach ${R.hc}'s ${title}.`; }
  const raise = !R.fired && J.ten <= RAISE_YEARS;
  const pay = J.lvl === "col" || J.lvl === "pro" ? `<section class="panel"><h3>Your contract</h3><p>${esc(`${moneyText(R.paid || 0)} for this season.${R.fired ? "" : R.renewed ? ` Your contract was renewed: ${contractText(J)}.` : ` ${capFirst(contractText(J))}.`} Career earnings: ${moneyText(CAREER.earned || 0)}.`)}</p></section>`
    : `<section class="panel"><h3>Your stipend</h3><p>${esc(`${moneyText(R.paid || 0)} for this season.${R.fired ? "" : ` Next season: ${moneyText(J.pay)}${raise ? ", a 3 percent raise" : ""}.`} Career earnings: ${moneyText(CAREER.earned || 0)}.`)}</p></section>`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason · ${esc(jobName(s.id))}</p>
      <h2 data-focus tabindex="-1">The head coach's review</h2>
      <p class="muted">${esc(last && last.g != null ? `Your ${COORD_SIDE[role]} graded ${gradeWord(last.g)}. ${repText(myRep())}` : repText(myRep()))}</p>
    </div>
    ${last && last.g != null && last.role ? coordGradePanel(last) : ""}
    <section class="panel"><h3>${esc(head)}</h3><p>${esc(body)}</p></section>
    ${pay}
    <button class="btn" data-a="carousel">Coaching changes around the ${inPros() ? "league" : worldy() ? "country" : "state"}</button>`;
}

/* ---------- Coordinator jobs in the market ---------- */
// One coordinator job, in a few sentences
function coordJobText(jid) {
  const s = jobSchool(jid), R = SEASON.review, sid = jobSid(jid), lvl = levelOf(s.cls);
  const pay = lvl === "hs" ? `Stipend ${moneyText(coordPay(s))}.` : `Salary about ${moneyText(coordPay(s))} a year, for ${plural(coordYears(s), "year")}.`;
  const why = R && R.follow === jid ? "Your head coach took this job and wants you to come with him." : "";
  return `${why} ${hcLine(s)} He runs the ${schemeText(s)}. ${lastSeasonText(sid)} ${talentText(s.rating)} ${capFirst(tradWord(s.trad))} (tradition ${Math.round(s.trad)}). ${pay}`.replace(/\s+/g, " ").trim();
}
// Your own school's head coaching job, offered to you
const promoText = () => `${hcGoneText(SEASON.review)} The school wants you to take over.`;
// A coordinator job's closer look, at a pro team (the others share the head coaching job's screen)
function coordProLook(jid, canPursue, isOffer, interest) {
  const s = jobSchool(jid);
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">A closer look · ${esc(jobPlace(jid))}${interest ? ` · ${interest} interest` : ""}</p>
      <h2 data-focus tabindex="-1">${esc(jobTitle(jid))}</h2>
      <p class="muted">${esc(coordJobText(jid))}</p>
    </div>
    <section class="panel"><h3>The job</h3><p>${esc(`You'd call the ${COORD_SIDE[jobRole(jid)]}. The head coach calls the other side and the kicking game, and the general manager runs the roster.`)}</p></section>
    <div class="choices">${canPursue ? `<button class="btn" data-a="pursue" data-v="${jid}">Pursue the job</button>` : ""}${isOffer ? `<button class="btn" data-a="accept">Take the job</button>` : ""}<button class="btn ghost" data-a="back">Back to the job market</button></div>`;
}

/* ---------- Your coach's page ---------- */
function coordJobPanel() {
  const J = CAREER.job, role = J.role, here = SEASON.myId === J.id && !movedSchools();
  if (!here) return "";
  const U = unitExpect(), oc = role === "oc", done = ["over", "offseason"].includes(SEASON.phase);
  const exp = `${hcName()}'s expectation ${done ? "for this past season was" : "this season:"} your ${COORD_SIDE[role]} ${oc ? "scoring" : "allowing"} about ${Math.round(oc ? U.pf : U.pa)} points a game.`;
  const sec = J.ten === 0 ? "Your first season here. A new coordinator gets two full seasons before he can be let go."
    : J.ten === 1 ? `${trustWord(J.sec)} After one season here, you get one more full season before you can be let go.`
    : `${trustWord(J.sec)} ${plural(J.ten, "season")} here.`;
  const pay = J.yrs ? `${capFirst(contractText(J))}.` : J.pay ? `Your stipend: ${moneyText(J.pay)} a season.` : "";
  return `<section class="panel"><h3>Your job: ${esc(COORD_ROLES[role].toLowerCase())}, ${esc(jobName(J.id))}</h3><p>${esc(coordUnderLine())} ${esc(hcLine(mySchool()))}</p><p>${esc(exp)}</p><p>${esc(sec)}</p>${pay ? `<p>${esc(pay)}</p>` : ""}</section>`;
}
// Seasons as a coordinator, on your coach's page: "3 seasons as a coordinator: 1 top unit, 2 in the top five."
function coordCareerLine() {
  const co = (CAREER.seasons || []).filter(x => x.role);
  if (!co.length) return "";
  const top = co.filter(x => x.top).length, top5 = co.filter(x => x.top5 || x.top).length;
  return `${plural(co.length, "season")} as a coordinator${top || top5 ? `: ${[top ? plural(top, "top unit") : "", top5 ? `${top5} in the top five` : ""].filter(Boolean).join(", ")}` : ""}.`;
}

/* ---------- College and the pros ---------- */
// "Your schemes" on a season screen: both for a head coach, your side's for a coordinator
function schemesPanel(s) {
  return coordRole() ? coordSchemes(s) : `<section class="panel"><h3>Your schemes</h3>${styleSegs(s.off, s.def)}<p class="muted styledesc">${esc(knownLine(s))}</p></section>`;
}
// A coordinator's offseason in college or the pros: the program is the head coach's (and, in the
// pros, the general manager's), so it's your new job if you took one, practice and your coach
function vCoordOffseason() {
  const s = mySchool(), gone = leavingSchool(), M = SEASON.market, role = coordRole(), pro = inPros();
  const who = pro ? `${hcName()} and the general manager run the roster: free agency, the draft and the cap.` : `${hcName()} and his staff run recruiting, NIL and the transfer portal.`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(s.id))}</h2>
      <p class="muted">${esc(gone ? "Your last days here." : `${coordUnderLine()} ${who}`)}</p>
    </div>
    ${gone ? newJobPanel() : M && M.took && M.tookRole ? `<section class="panel"><h3>Your new job</h3><p>${esc(`You're the new ${COORD_ROLES[role].toLowerCase()} of the ${nameOf(s.id)}, under ${hcName()}. ${capFirst(contractText(CAREER.job))}.`)}</p></section>` : ""}
    ${gone ? "" : `<section class="panel"><h3>${pro ? "The offseason program" : "Spring practice"}</h3><p>${esc(`Four weeks with your ${COORD_SIDE[role]}'s practice plan. Opponent prep time goes into install.`)}</p><div class="choices"><button class="btn ghost" data-a="practice">Practice plan</button><button class="btn ghost" data-a="sroster" data-t="${s.id}">Roster and depth chart</button></div></section>`}
    ${ownMoneyPanel()}
    <section class="panel"><h3>Your coach</h3><p>${CAREER.xp || 0} XP to spend on ratings and perks.</p><button class="btn ghost" data-a="coach">Spend XP</button></section>
    <button class="btn" data-a="nextyear">Start the ${SEASON.year + 1} preseason</button>`;
}
