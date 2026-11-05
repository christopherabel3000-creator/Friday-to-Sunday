// Friday to Sunday: the money and recruiting screens. The program fund (fundraisers, facilities,
// one-season purchases and your own money), signing day, and your college prospects.
"use strict";

/* ---------- The program fund ---------- */
// "This offseason: $3,000 from the school, $4,600 from the boosters and $1,300 from fundraisers. Upkeep took $1,600."
function booksText(B) {
  const raised = Object.values(B.raised).reduce((a, b) => a + b, 0);
  const parts = [`${moneyText(B.school)} from the school`, `${moneyText(B.boost)} from the boosters`].concat(raised ? [`${moneyText(raised)} from fundraisers`] : []);
  return `Saved from before: ${moneyText(B.start)}. This offseason: ${andList(parts)}. Upkeep on the facilities took ${moneyText(B.upkeep)}.`;
}
// What a facility does at its level, in a sentence
function facEffect(id, lv) {
  const pct = m => `${m >= 1 ? "+" : "−"}${Math.round(Math.abs(m - 1) * 100)} percent`;
  switch (id) {
    case "wt": return `Strength growth ${pct(WT_MUL[lv - 1])}, summer attendance ${lv >= 2 ? "+" : "−"}${Math.abs(2 * (lv - 2))} points.`;
    case "film": return `Opponent prep edge ${pct(FILM_MUL[lv - 1])}${lv >= 4 ? ", and a fuller scouting report" : ""}.`;
    case "field": return `Practice injuries ${pct(FIELD_INJ[lv - 1])}${lv >= 4 ? ", and players heal a little faster" : ""}.`;
    case "eq": return `Game injuries ${pct(EQ_INJ[lv - 1])}${PADS_CUT[lv - 1] ? `, and ${Math.round(PADS_CUT[lv - 1] * 100)} percent fewer extra injuries in full pads` : ""}.`;
    case "stad": return `Booster giving ${pct(1 + .06 * (lv - 2))}, hallway pitches ${lv >= 2 ? "+" : "−"}${Math.abs(2 * (lv - 2))} points.`;
  }
  return "";
}
function vFund() {
  const B = openBooks(), s = mySchool(), lv = facOf(s), plan = myFundraisers();
  const frRow = ([id, name, , desc]) => {
    const on = plan.includes(id), amt = B.raised[id], ok = frOK(s, id);
    const say = on ? `raised ${moneyText(amt || 0)}` : ok ? `about ${moneyText(frGuess(s, id))}` : `needs booster enthusiasm of ${GOLF_NEEDS}`;
    return `<li class="xprow"><span>${esc(`${name}: ${say}. ${desc}`)}</span>
      <button class="btn ghost slim" data-a="fr" data-v="${id}" aria-pressed="${on}">${esc(name)}</button></li>`;
  };
  const facRow = ([id, name], k) => {
    const L = lv[k], built = B.built.includes(id), next = L < 5 ? FAC_COST[L + 1] : 0;
    return `<li class="xprow"><span>${esc(`${name}: ${facWord(L)}. ${facEffect(id, L)}${built ? " Upgraded this offseason." : ""}`)}</span>
      <div class="choices">${L < 5 ? `<button class="btn ghost slim" data-a="facup" data-v="${id}">${esc(`Upgrade to ${facWord(L + 1)}: ${moneyText(next)}`)}</button>` : ""}${built ? `<button class="btn ghost slim" data-a="facundo" data-v="${id}">Cancel the upgrade</button>` : ""}</div></li>`;
  };
  const buyRow = ([id, name, desc]) => {
    const on = B.bought[id] != null;
    return `<li class="xprow"><span>${esc(`${name}: ${moneyText(on ? B.bought[id] : buyCost(s, id))}. ${desc}`)}</span>
      <button class="btn ghost slim" data-a="buy" data-v="${id}" aria-pressed="${on}">${esc(name)}</button></li>`;
  };
  const done = SEASON.clinics || [];
  const clinicRow = c => `<li class="xprow"><span>${esc(`${c.name}: ${moneyText(c.cost)} for ${c.xp} XP.`)}</span>
      <button class="btn ghost slim" data-a="clinic" data-v="${c.id}" aria-pressed="${done.includes(c.id)}">${esc(c.name)}</button></li>`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason · ${esc(nameOf(s.id))}</p>
      <h2 data-focus tabindex="-1">The program fund</h2>
      <p class="muted">${esc(`${moneyText(s.fund)} to spend. ${boostText(boostersOf(s))} What's left carries over to next year.`)}</p>
    </div>
    <section class="panel"><h3>The books</h3><p>${esc(booksText(B))}</p>
      ${B.slipped.length ? `<p>${esc(`The fund couldn't cover upkeep, so ${andList(B.slipped.map(id => `the ${FACILITIES[FAC_IDS.indexOf(id)][1].toLowerCase()}`))} slipped a level.`)}</p>` : ""}</section>
    <section class="panel"><h3>Fundraisers</h3>
      <p class="muted styledesc">${esc(`The first one is free. Each one after it takes a week of the summer program: ${summerLeftText()} Your picks carry over to next year.`)}</p>
      <ul class="hlist xplist">${FUNDRAISERS.map(frRow).join("")}</ul></section>
    <section class="panel"><h3>Facilities</h3>
      <p class="muted styledesc">${esc(`Upgrades work from this summer on. Upkeep is 4 percent of what a facility cost to build, every year: ${moneyText(upkeepOf(s))} a year now.`)}</p>
      <ul class="hlist xplist">${FACILITIES.map(facRow).join("")}</ul></section>
    <section class="panel"><h3>This summer and season</h3>
      <ul class="hlist xplist">${PURCHASES.map(buyRow).join("")}</ul></section>
    <section class="panel"><h3>Your own money</h3>
      <p>${esc(`${moneyText(myCash())} of your career earnings to spend. Up to two clinics each offseason.`)}</p>
      <ul class="hlist xplist">${CLINICS.map(([id]) => clinicRow(CLINIC[id])).join("")}</ul>
      <div class="choices">${GIFTS.map(n => `<button class="btn ghost slim" data-a="gift" data-v="${n}">${esc(`Give ${moneyText(n)} to the fund`)}</button>`).join("")}</div></section>
    <button class="btn ghost" data-a="back">Back to the offseason</button>`;
}

/* ---------- Signing day ---------- */
function vSigning() {
  const sg = SEASON.signing || signingDay(), R = SEASON.review || {}, s = mySchool(), list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const mine = sg.mine.map(x => `${x.name}, ${posName(x.pos)}: ${collegeText(x.c)}.`);
  const pend = sg.pending.map(x => `${x.name}'s ${TIER_NAMES[x.tier]} offers needed grades of ${GRADE_NEED}${x.signed ? ", so he signed lower" : ""}.`);
  const rewards = sg.mine.length ? `${plural(sg.xp, "XP", "XP")} for your coach${sg.rep ? `, and your reputation goes up ${sg.rep}` : ""}. ${boostText(boostersOf(s))}` : "";
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason · ${esc(nameOf(s.id))}</p>
      <h2 data-focus tabindex="-1">Signing day</h2>
      <p class="muted">${esc(sg.mine.length ? `${plural(sg.mine.length, "senior")} signed with colleges. ${rewards}` : "None of your seniors signed with a college this year.")}</p>
    </div>
    ${mine.length ? `<section class="panel"><h3>Signed</h3>${list(mine)}</section>` : ""}
    ${(R.post || []).length ? `<section class="panel"><h3>Late offers</h3>${list(R.post)}</section>` : ""}
    ${pend.length ? `<section class="panel"><h3>Held back by grades</h3>${list(pend)}</section>` : ""}
    ${(R.spring || []).length ? `<section class="panel"><h3>Spring offers for your juniors</h3>${list(R.spring)}</section>` : ""}
    ${sg.others.length ? `<section class="panel"><h3>Around the district</h3>${list(sg.others)}</section>` : ""}
    <button class="btn" data-a="adreview">The athletic director's review</button>`;
}

/* ---------- Your prospects ---------- */
function vRecruits() {
  const s = mySchool(), ps = myProspects(), back = SEASON.phase === "offseason" ? "Back to the offseason" : "Back to the season";
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} · ${esc(nameOf(s.id))}</p>
      <h2 data-focus tabindex="-1">College recruiting</h2>
      <p class="muted">${esc(`Colleges look at juniors and seniors. Offers come in the spring after the junior season, at team camp, after weeks 4 and 8 of the senior season, and after the playoffs. Seniors sign on signing day, after the season. Tier 1 and Tier 2 offers need grades of ${GRADE_NEED}. ${sentText()}`)}</p>
    </div>
    <section class="panel">${ps.length ? `<ul class="hlist">${ps.map(p => `<li>${esc(prospectText(p))}</li>`).join("")}</ul>` : "<p>No juniors or seniors are on colleges' lists yet.</p>"}</section>
    <button class="btn ghost" data-a="back">${back}</button>`;
}
// The prospects panel for the season and offseason screens
function recruitPanel() {
  const ps = myProspects(), offered = ps.filter(p => p.off && p.off.length).length;
  return `<section class="panel"><h3>College recruiting</h3><p>${esc(ps.length ? `${plural(ps.length, "player is", "players are")} on colleges' lists, ${offered} with offers.` : "No juniors or seniors are on colleges' lists yet.")}</p>
    <button class="btn ghost" data-a="recruits">Your prospects</button></section>`;
}
// A player's offers, for his page
function playerOffersHtml(p) {
  if (!SEASON || p.yr < 11) return "";
  const { r } = recruitOf(p), w = recruitWord(r), offs = offersOf(p);
  if (!w && !offs.length && p.sign == null) return "";
  return `<section class="panel"><h3>College recruiting</h3><p>${esc(`${w ? capFirst(w) + "." : "Not on colleges' lists."} ${offs.length ? `${capFirst(offerSummary(p))}: ${offs.map(c => collegeText(c.i)).join(", ")}.` : "No offers yet."}${p.sign != null ? ` Signed with ${collegeText(p.sign)}.` : ""}`)}</p></section>`;
}
// A school's money and facilities, for the job market: "Facilities: weight room good, ..."
const facLine = s => `Facilities: ${FACILITIES.map(([id, name], k) => `${name.toLowerCase()} ${facWord(facOf(s)[k])}`).join(", ")}.`;
const jobMoneyText = s => `${boostText(boostersOf(s))} Program fund about ${moneyText(fundOf(s))}. ${facLine(s)}`;

/* ---------- Actions ---------- */
function moneyAct(a, ds) {
  switch (a) {
    case "fund": if (SEASON && SEASON.phase === "offseason" && marketClosed() && openBooks()) { APP.screen = "fund"; scrollTop(); } return true;
    case "fr": announce(toggleFundraiser(ds.v)); return true;
    case "facup": announce(upgradeFacility(ds.v)); return true;
    case "facundo": { const say = cancelUpgrade(ds.v); if (say) { focusNext = { a: "facup", v: ds.v }; announce(say); } return true; }
    case "buy": announce(toggleBuy(ds.v)); return true;
    case "clinic": announce(attendClinic(ds.v)); return true;
    case "gift": announce(giveToFund(+ds.v)); return true;
    case "recruits": if (SEASON && SEASON.myId) { APP.recruitBack = APP.screen; APP.screen = "recruits"; scrollTop(); } return true;
    case "adreview": { const M = SEASON && SEASON.market; if (M && M.stage === "signing") M.stage = "review"; if (SEASON && SEASON.phase === "offseason") { APP.screen = offseasonScreen(); scrollTop(); } return true; }
  }
  return false;
}
