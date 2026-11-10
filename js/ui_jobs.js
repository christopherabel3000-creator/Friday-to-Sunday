// Friday to Sunday: the job market screens. After the season summary: the athletic director's review,
// the coaching changes around the state, then the job market, with a closer look at any job.
"use strict";

// The market's last message (who said no, an offer turned down), shown at the top until the next one
let marketMsg = "";

/* ---------- The athletic director's review ---------- */
function vReview() {
  const R = yearEndReview(), s = mySchool(), J = myJob(), last = CAREER.seasons.find(x => x.seed === SEASON.seed);
  const seasons = plural(J.ten, "season");
  const job = R.fired
    ? `<section class="panel"><h3>You're fired</h3><p>${esc(`The ${jobName(s.id)} ${bossWord()} let you go after ${seasons}. Every school that's interested in you is in the job market, and someone will hire you.`)}</p></section>`
    : `<section class="panel"><h3>${esc(secWord(J.sec))}</h3><p>${esc(J.ten === 1 ? `After your first season at the ${jobName(s.id)}. A new coach gets two full seasons before the ${bossWord()} can let him go.`
      : J.ten === 2 ? `After ${seasons} at the ${jobName(s.id)}. From here on, the ${bossWord()} looks at how you've done over the years, and ${patienceWord(patienceOf(s))} at a ${inPros() ? "team" : "program"} like this one takes bad seasons hard.`
      : `After ${seasons} at the ${jobName(s.id)}, with ${patienceWord(patienceOf(s))}.`)}</p></section>`;
  const raise = !R.fired && J.ten <= RAISE_YEARS;
  const pay = J.lvl === "col" || J.lvl === "pro" ? `<section class="panel"><h3>Your contract</h3><p>${esc(`${moneyText(R.paid || 0)} for this season.${R.buyout ? ` The rest of your contract is paid out: ${moneyText(R.buyout)}.` : R.fired ? "" : R.renewed ? ` Your contract was renewed: ${contractText(J)}.` : ` ${capFirst(contractText(J))}.`} Career earnings: ${moneyText(CAREER.earned || 0)}.`)}</p></section>`
    : `<section class="panel"><h3>Your stipend</h3><p>${esc(`${moneyText(R.paid || 0)} for this season.${R.fired ? "" : ` Next season: ${moneyText(J.pay)}${raise ? ", a 3 percent raise" : ""}.`} Career earnings: ${moneyText(CAREER.earned || 0)}.`)}</p></section>`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason · ${esc(jobName(s.id))}</p>
      <h2 data-focus tabindex="-1">The ${bossWord()}'s review</h2>
      <p class="muted">${esc(last && last.g != null ? `Your season graded ${gradeWord(last.g)}. ${repText(myRep())}` : repText(myRep()))}</p>
    </div>
    ${gradePanel()}
    ${job}
    ${pay}
    ${inPros() ? gmReviewPanel() : ""}
    <button class="btn" data-a="carousel">Coaching changes around the ${inPros() ? "league" : worldy() ? "country" : "state"}</button>`;
}

/* ---------- Coaching changes ---------- */
function vCarousel() {
  const R = yearEndReview(), n = marketJobs().length;
  return `
    <div class="masthead">
      <p class="eyebrow">${SEASON.year} offseason · The coaching carousel</p>
      <h2 data-focus tabindex="-1">Coaching changes</h2>
      <p class="muted">Coaches retire and get fired every year, and those jobs open up.</p>
    </div>
    <section class="panel"><ul class="hlist">${R.news.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>
    <section class="panel"><h3>The job market</h3><p>${esc(n ? `${plural(n, "school is", "schools are")} interested in you.` : R.fired ? "Nobody's interested in you yet, but someone will take you." : "No school is interested in you right now.")}</p>
      <button class="btn" data-a="market">The job market</button></section>`;
}

/* ---------- The job market ---------- */
const JOB_SORTS = [["interest", "Interest"], ["cls", "Class"], ["trad", "Tradition"], ["talent", "Talent"]];
const INTEREST_RANK = { high: 0, medium: 1, low: 2 };
// What a school's last season was: "6-4, expected about 5-5"
function lastSeasonText(id) {
  if (otherWorldJob(id)) return inWorld(jobWorld(id), () => lastSeasonText(id));
  const r = SEASON.results && SEASON.results[id], e = SEASON.exp && SEASON.exp[id];
  if (!r) return "";
  if (isPro(SEASON.schools[id].cls)) return `Last season: ${proRecText(r)}${r.ch ? `, ${PRO_BOWL} champions` : r.pw ? `, ${plural(r.pw, "playoff win")}` : r.po ? ", lost in the playoff" : ""}${e ? `, expected ${expectWords(e)}` : ""}.`;
  if (isCollege(SEASON.schools[id].cls)) return `Last season: ${r.w}-${r.l}${r.ch ? ", national champions" : r.dt ? ", conference champions" : r.pw ? `, ${plural(r.pw, "postseason win")}` : r.po ? ", lost in the postseason" : ""}${e ? `, expected ${expectWords(e)}` : ""}.`;
  return `Last season: ${r.w}-${r.l}${r.ch ? ", state champions" : r.pw ? `, ${plural(r.pw, "playoff win")}` : r.po ? ", lost in the first round" : ""}${e ? `, expected ${expectWords(e)}` : ""}.`;
}
const whyOpen = id => ({ retired: "Its coach retired.", fired: "Its coach was fired.", left: "Its coach left." })[(jobWorld(id) || SEASON).review.why[id]] || "";
// One job, in a few sentences: everything the list says about it
function jobText(id) {
  const s = jobSchool(id), col = isCollege(s.cls);
  if (isPro(s.cls)) return proJobText(id);
  const pay = col ? `Salary about ${moneyText(colSalary(s, inCollege() ? CAREER.crep || 0 : startCrep(CAREER.rep)))} a year, for ${plural(COL_YEARS[s.cls], "year")}.` : `Enrollment ${numText(s.enroll)}. Stipend ${moneyText(stipendOf(s))}.`;
  return `${lastSeasonText(id)} ${talentText(s.rating)} ${capFirst(tradWord(s.trad))} (tradition ${Math.round(s.trad)}). ${pay} ${capFirst(patienceWord(s.trad))}. ${whyOpen(id)} ${col ? `${boostText(boostersOf(s))} ${facLine(s)}` : jobMoneyText(s)}`.replace(/\s+/g, " ").trim();
}
function sortedJobs() {
  const by = APP.jobSort || "interest", cls = APP.jobCls || "all", talent = s => s.rating.off + s.rating.def;
  const list = marketJobs().filter(id => cls === "all" || jobSchool(id).cls === cls);
  const S2 = id => jobSchool(id);
  return list.sort((a, b) => {
    const x = S2(a), y = S2(b);
    const k = by === "cls" ? classIndex(y.cls) - classIndex(x.cls) : by === "trad" ? y.trad - x.trad : by === "talent" ? talent(y) - talent(x) : INTEREST_RANK[interestIn(x)] - INTEREST_RANK[interestIn(y)];
    return k || classIndex(y.cls) - classIndex(x.cls) || (a < b ? -1 : 1);
  });
}
function offerPanel() {
  const M = SEASON.market, id = M.offer, s = jobSchool(id), fb = M.fallback === id;
  return `<section class="panel teamcard" style="--team:${s.color}">
      <p class="eyebrow">${esc(jobPlace(id))}</p>
      <h3 id="offer" tabindex="-1">Offer: the ${esc(jobName(id))}</h3>
      ${M.counter ? `<p>${esc(`${jobName(SEASON.myId)} want to keep you: a ${Math.round(M.counter.raise * 100)} percent raise and ${plural(M.counter.yrs, "more year")} on your contract.`)}</p>
      <div class="choices"><button class="btn" data-a="counterstay">Stay, with the raise</button><button class="btn ghost" data-a="accept">Take the new job anyway</button></div>` : ""}
      <p>${esc(fb ? `Nobody else is hiring you this year. The ${jobName(id)}, the weakest roster ${inPros() ? "in the league" : "in Class 1A"}, will take you, and their coach is let go to make room.` : `The ${jobName(id)} want you as their head coach.${isPro(s.cls) ? ` ${M.ctl ? "The job comes with control of the roster: the draft, free agency, trades and cuts are yours." : "Their general manager keeps control of the roster; you coach the team and make requests."}` : ""} You have to answer now.`)}</p>
      <p class="muted">${esc(jobText(id))}</p>
      ${M.counter ? "" : `<div class="choices"><button class="btn" data-a="accept">Take the job</button>${fb ? "" : `<button class="btn ghost" data-a="decline">Turn it down</button>`}<button class="btn ghost" data-a="joblook" data-v="${id}">A closer look</button></div>`}
    </section>`;
}
function vMarket() {
  const R = yearEndReview(), M = SEASON.market, me = mySchool(), jobs = sortedJobs(), all = marketJobs();
  const classes = CLASSES.concat(COL_CLASSES, ["PRO"]).filter(c => all.some(id => jobSchool(id).cls === c));
  const proNote = proMarketNote();
  const sort = APP.jobSort || "interest", cls = APP.jobCls || "all";
  const card = id => {
    const s = jobSchool(id);
    return `<section class="panel teamcard" style="--team:${s.color}">
      <p class="eyebrow">${esc(jobPlace(id))} · ${interestIn(s)} interest</p>
      <h3>${esc(jobName(id))}</h3>
      <p class="muted">${esc(jobText(id))}</p>
      ${M.offer ? "" : `<div class="choices"><button class="btn" data-a="pursue" data-v="${id}">Pursue the ${esc(s.mascot)} job</button><button class="btn ghost" data-a="joblook" data-v="${id}">A closer look</button></div>`}
    </section>`;
  };
  const seg = (a, opts, cur, label) => `<div style="display:grid;gap:6px" role="group" aria-label="${label}"><span class="eyebrow" aria-hidden="true">${label}</span><div class="seg">${opts.map(([v, nm]) => `<button data-a="${a}" data-v="${v}" aria-pressed="${cur === v}">${nm}</button>`).join("")}</div></div>`;
  return `
    <div class="masthead">
      <p class="eyebrow">${SEASON.year} offseason · ${esc(repText(myRep()))}</p>
      <h2 data-focus tabindex="-1">The job market</h2>
      <p class="muted">${esc(R.fired ? "You were fired, so you need a new job. " : "")}Only schools that are interested in you are listed. Pursue one job at a time, and the school answers right away. A school that says no is off the list.</p>
    </div>
    ${marketMsg ? `<p class="panel" id="mktmsg" tabindex="-1">${esc(marketMsg)}</p>` : ""}
    ${proNote ? `<p class="panel">${esc(proNote)}</p>` : ""}
    ${M.offer ? offerPanel() : ""}
    ${all.length > 1 ? `<section class="panel">${seg("jobsort", JOB_SORTS, sort, "Sort by")}${classes.length > 1 ? seg("jobcls", [["all", "All"]].concat(classes.map(c => [c, c === "PRO" ? "Pros" : c])), classes.includes(cls) ? cls : "all", "Class") : ""}</section>` : ""}
    ${jobs.length ? jobs.map(card).join("") : `<section class="panel"><p>${esc(all.length ? "No jobs in that class. Pick All to see the rest." : M.offer ? "No other schools are interested right now." : "No other schools are interested in you right now.")}</p></section>`}
    ${R.fired || M.offer ? "" : `<button class="btn${jobs.length ? " ghost" : ""}" data-a="stay">Stay at ${esc(jobName(me.id))}</button>`}
    <button class="btn ghost" data-a="coach">Your coach</button>`;
}

/* ---------- A closer look ---------- */
// Next season's roster (the players coming back), what the last coach ran and how much of your
// playbook the team knows, and how its returning starters compare with the class
function vJobLook() {
  const id = APP.jobLook, M = SEASON.market, canPursue0 = !M.done && !M.offer && marketJobs().includes(id), isOffer0 = M.offer === id, interest0 = marketJobs().includes(id) ? interestIn(jobSchool(id)) : "";
  if (otherWorldJob(id)) return inWorld(jobWorld(id), () => jobLookHtml(id, M, canPursue0, isOffer0, interest0));
  return jobLookHtml(id, M, canPursue0, isOffer0, interest0);
}
function jobLookHtml(id, M, canPursue, isOffer, interest) {
  if (isPro(SEASON.schools[id].cls)) return proJobLook(id, M, canPursue, isOffer, interest);
  const sum = SEASON.schools[id], s = seasonSchool(id), c = CAREER.coach;
  const back = s.players.filter(p => p.yr < finalYear(s)), team = { id, cls: s.cls, players: back.map(p => p), coach: s.coach };
  team.depth = autoDepth(team);
  const ro = sideRating(team, "off"), rd = sideRating(team, "def");
  const peers = Object.values(SEASON.schools).filter(x => x.cls === s.cls), avgR = Math.round(peers.reduce((n, x) => n + (x.rating.off + x.rating.def) / 2, 0) / peers.length);
  const k = coreKnown(s, c.off_style, c.def_style);
  const groups = {};
  back.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).forEach(p => { const gname = POS_INFO[p.pos].group; (groups[gname] = groups[gname] || []).push(p); });
  const order = OFF_POS.concat(DEF_POS, ["K", "P"]).map(pos => POS_INFO[pos].group).filter((x, i, a) => a.indexOf(x) === i && groups[x]);
  return `
    <div class="masthead" style="--team:${sum.color}">
      <p class="eyebrow">A closer look · ${esc(jobPlace(id))}${interest ? ` · ${interest} interest` : ""}</p>
      <h2 data-focus tabindex="-1">${esc(jobName(id))}</h2>
      <p class="muted">${esc(jobText(id))}</p>
    </div>
    <section class="panel"><h3>The playbook</h3><p>${esc(`The last coach ran the ${schemeText(sum)}. The team knows ${k.off} of your 4 core plays on offense and ${k.def} of 4 on defense well. Whatever it doesn't know, you install in practice.`)}</p></section>
    <section class="panel"><h3>Coming back next season</h3>
      <p>${esc(`${plural(back.length, "player")} coming back, after ${plural(s.players.length - back.length, "senior")} graduate. Its returning starters rate about ${ro} on offense and ${rd} on defense. This season's ${isCollege(s.cls) ? levelName(s.cls) : `Class ${s.cls}`} starters averaged about ${avgR}. ${isPro(s.cls) ? "Free agency and the draft come before next season, too." : isCollege(s.cls) ? "A recruiting class and the transfer portal come before next season, too." : "Freshmen come out before next season, too."}`)}</p>
      ${order.map(gname => `<p class="sechead" role="heading" aria-level="4">${esc(gname)}</p><ul class="hlist">${groups[gname].map(p => `<li>${esc(playerLine(p, s.level))}</li>`).join("")}</ul>`).join("")}
    </section>
    <div class="choices">${canPursue ? `<button class="btn" data-a="pursue" data-v="${id}">Pursue the ${esc(sum.mascot)} job</button>` : ""}${isOffer ? `<button class="btn" data-a="accept">Take the job</button>` : ""}<button class="btn ghost" data-a="back">Back to the job market</button></div>`;
}

/* ---------- Actions ---------- */
// The market's buttons. Returns false for anything that isn't one of them.
function jobsAct(a, ds) {
  const M = SEASON && SEASON.market, open = !!(M && !M.done && SEASON.phase === "offseason");
  switch (a) {
    case "carousel": if (!open) return true; M.stage = M.stage === "review" || M.stage === "signing" ? "news" : M.stage; APP.screen = "carousel"; scrollTop(); return true;
    case "market": if (!open) return true; M.stage = "jobs"; marketMsg = ""; APP.screen = "market"; scrollTop(); return true;
    case "jobsort": if (JOB_SORTS.some(x => x[0] === ds.v)) { APP.jobSort = ds.v; announce(`Sorted by ${JOB_SORTS.find(x => x[0] === ds.v)[1].toLowerCase()}.`); } return true;
    case "jobcls": if (ds.v === "all" || ds.v === "PRO" || CLASSES.includes(ds.v) || COL_CLASSES.includes(ds.v)) { APP.jobCls = ds.v; announce(ds.v === "all" ? `Every class: ${plural(sortedJobs().length, "job")}.` : ds.v === "PRO" ? `Pros: ${plural(sortedJobs().length, "job")}.` : `Class ${ds.v}: ${plural(sortedJobs().length, "job")}.`); } return true;
    case "joblook": if (open && marketJobs().includes(ds.v) || (M && M.offer === ds.v)) { APP.jobLook = ds.v; APP.screen = "joblook"; scrollTop(); } return true;
    case "pursue": {
      if (!open) return true;
      const r = pursueJob(ds.v);
      if (!r) return true;
      APP.screen = "market"; scrollTop();
      if (r === "offer") { marketMsg = ""; focusNext = { id: "offer" }; }
      else { marketMsg = `The ${jobName(ds.v)} said no. ${SEASON.market.offer ? "But one school will take you." : marketJobs().length ? `${plural(marketJobs().length, "school is", "schools are")} still interested.` : "No other schools are interested right now."}`; focusNext = { id: "mktmsg" }; }
      return true;
    }
    case "accept": {
      if (!open || !M.offer) return true;
      const r = answerOffer(true);
      if (r === "took") { marketMsg = ""; APP.screen = "offseason"; scrollTop(); }
      else if (r === "counter") { marketMsg = ""; focusNext = { id: "offer" }; }
      return true;
    }
    case "counterstay": if (open && acceptCounter()) { marketMsg = ""; APP.screen = "offseason"; scrollTop(); } return true;
    case "decline": {
      if (!open || !M.offer) return true;
      const id = M.offer;
      if (answerOffer(false) === "declined") { marketMsg = `You turned down the ${jobName(id)}.${SEASON.market.offer ? " One school will still take you." : ""}`; APP.screen = "market"; focusNext = { id: "mktmsg" }; scrollTop(); }
      return true;
    }
    case "stay": if (open && stayPut()) { marketMsg = ""; APP.screen = "offseason"; scrollTop(); } return true;
  }
  return false;
}
/* ---------- Into the new year ---------- */
// Moving the whole state into the next year takes a second or two (every school a year older, on
// paper), so a screen says so first, and taps wait until it's done (simJob blocks them)
function runNextYear() {
  // With no page to draw (tests), it happens right away. A new job has no report on how the team changed.
  if (typeof document === "undefined") { nextSeason(); APP.screen = SEASON.yearReport ? "newyear" : "season"; return; }
  simJob = { year: true };
  APP.screen = "turning";
  setTimeout(() => {
    try { nextSeason(); APP.screen = SEASON.yearReport ? "newyear" : "season"; } finally { simJob = null; }
    save(); render(); scrollTop();
  }, 30);
}
function vTurning() {
  return `
    <div class="masthead">
      <p class="eyebrow">${esc(jobName(SEASON.myId))}</p>
      <h2 data-focus tabindex="-1">On to ${SEASON.year + 1}</h2>
      <p class="muted">${inPros() ? "Every team's players get a year older, and the new league year begins…" : SEASON.lvl === "col" ? "Every program's seniors move on and its recruiting class arrives…" : "Every school in the state graduates its seniors and brings in its freshmen…"}</p>
    </div>`;
}
// Where the offseason stands: the review, the coaching changes, the market, or the offseason program
function offseasonScreen() {
  const M = SEASON.market;
  if (!M || M.done) return "offseason";
  return M.stage === "signing" ? "signing" : M.stage === "review" ? "review" : M.stage === "news" ? "carousel" : "market";
}
