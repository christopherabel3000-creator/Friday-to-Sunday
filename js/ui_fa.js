// Friday to Sunday: re-signing and free agency's screens (Milestone 5, step 6). On the offseason
// screen: your expiring contracts, then free agency day by day; the free agents by position; one
// free agent and your offer.
"use strict";

/* ---------- On the offseason screen ---------- */
function offseasonFAPanels() {
  const W = SEASON, off = W.off, s = mySchool(), J = CAREER.job;
  if (!off || leavingSchool()) return "";
  const news = off.news.slice(-6).reverse(), newsHtml = news.length ? `<details><summary>Around the league</summary><ul class="hlist">${news.map(t => `<li>${esc(t)}</li>`).join("")}</ul></details>` : "";
  if (off.stage === "resign") {
    const ex = expiringOf(s).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)), R = myReq();
    const row = p => {
      const ask = (p.exp || 0) < 3 ? Math.max(proMin(p.exp + 1), Math.round(capHit(p) * 1.1 / 5000) * 5000) : askFor(p), who = `${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}, ${yearName(p)}`, rs = off.rs[p.id];
      if (!J.ctl) return `<li class="xprow"><span>${esc(`${who}. Asking about ${bigMoney(ask)} a year.`)}</span><span class="choices"><button class="btn ghost slim" data-a="gmkeep" data-v="${p.id}" aria-pressed="${R.keep.includes(p.id)}">${R.keep.includes(p.id) ? "Asked to keep" : `Ask to keep ${esc(p.first)}`}</button><button class="btn ghost slim" data-a="gmgo" data-v="${p.id}" aria-pressed="${R.go.includes(p.id)}">${R.go.includes(p.id) ? "Asked to let go" : `Ask to let ${esc(p.first)} go`}</button></span></li>`;
      const btn = (v, label) => `<button class="btn ghost slim" data-a="rsset" data-t="${v}" data-v="${p.id}" aria-pressed="${rs === v}">${label}</button>`;
      return `<li class="xprow"><span>${esc(`${who}. Asking about ${bigMoney(ask)} a year.`)}</span><span class="choices">${p.ct.o5 ? btn("opt", `Fifth-year option, ${esc(bigMoney(optionPrice(p)))}`) : btn("ext", `Extend ${esc(p.first)}`)}${(p.exp || 0) >= 4 ? btn("tag", `Tag ${esc(p.first)}, ${esc(bigMoney(tagPrice(W, p)))}`) : ""}${btn("go", `Let ${esc(p.first)} go`)}</span></li>`;
    };
    return `<section class="panel"><h3>Re-signing and the franchise tag</h3>
      <p>${esc(`${plural(ex.length, "contract")} ${ex.length === 1 ? "ends" : "end"} after this season. ${J.ctl ? "Extend the players you want, put the franchise tag on one (a year at the price of his position's top five, fully guaranteed), or let them go. Anyone you leave alone, your staff decides." : "Your GM decides, with your requests in mind."} About ${bigMoney(nextYearRoom(W, s))} of room for next year, after the rookies.`)}</p>
      ${ex.length ? `<ul class="hlist">${ex.map(row).join("")}</ul>` : ""}
      <button class="btn" data-a="fastart">On to free agency</button></section>${newsHtml}`;
  }
  if (off.stage === "fa") {
    const mineOffers = Object.keys(off.offers).filter(pid => off.offers[pid].some(o => o.team === s.id)), FA = faPlayers(W), name = pid => { const p = FA.find(x => x.id === pid); return p ? fullName(p) : "?"; };
    return `<section class="panel"><h3>${esc(`Free agency, day ${off.day + 1} of ${FA_DAYS}`)}</h3>
      <p>${esc(`${plural(FA.length, "free agent")} on the market. Cap room: ${bigMoney(capRoom(s))}${mineOffers.length ? `, ${bigMoney(pendingFor(W, s.id))} of it in your offers` : ""}. Each day the teams make offers, and each player signs the best one if it's close enough to what he's asking; the longer he waits, the less he holds out for.${J.ctl ? "" : " Your GM makes the offers, by your needs."}`)}</p>
      ${mineOffers.length ? `<p>${esc(`Your offers: ${andList(mineOffers.map(name))}.`)}</p>` : ""}
      ${(off.mine.signed || []).length ? `<p>${esc(`Signed: ${off.mine.signed.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}`).join("; ")}.`)}</p>` : ""}
      <div class="choices"><button class="btn" data-a="falist">The free agents</button><button class="btn ghost" data-a="faday">Next day</button><button class="btn ghost" data-a="faall">${confirming === "faall" ? "Tap again to sim the rest of free agency" : "Sim the rest of free agency"}</button></div></section>${newsHtml}`;
  }
  return newsHtml;
}

/* ---------- The free agents ---------- */
const faOffersOn = (W, pid) => (W.off.offers[pid] || []);
function faLine(W, p) {
  const n = faOffersOn(W, p.id).length, mine = faOffersOn(W, p.id).some(o => o.team === SEASON.myId);
  return `${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}, age ${p.age}${p.from ? `, from the ${SEASON.schools[p.from].mascot}` : ""}. Asking ${bigMoney(askFor(p))} a year. ${n ? `${plural(n, "offer")}${mine ? ", yours among them" : ""}.` : "No offers yet."}`;
}
function vFAList() {
  const W = SEASON, pos = APP.fapos && POS_INFO[APP.fapos] ? APP.fapos : (myNeeds()[0] || "QB"), FA = faPlayers(W).filter(p => p.pos === pos).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).slice(0, 30);
  return `
    <div class="masthead">
      <p class="eyebrow">${esc(`Free agency, day ${W.off.day + 1} of ${FA_DAYS} · Cap room ${bigMoney(capRoom(mySchool()))}`)}</p>
      <h2 data-focus tabindex="-1">The free agents</h2>
      <p class="muted">${esc(`The best at each position. Your needs: ${myNeeds().map(posName).join(", ") || "none named"}.`)}</p>
      <div class="seg" role="group" aria-label="Position">${POS_IDS.map(x => `<button data-a="fapos" data-v="${x}" aria-pressed="${x === pos}">${capFirst(posName(x))}</button>`).join("")}</div>
    </div>
    <section class="panel"><h3 id="fahead" tabindex="-1">${esc(POS_INFO[pos].group)}</h3>${FA.length ? `<ul class="hlist">${FA.map(p => `<li><button class="rowbtn" data-a="faplayer" data-v="${p.id}">${esc(faLine(W, p))}</button></li>`).join("")}</ul>` : "<p>Nobody left at this position.</p>"}</section>
    <button class="btn ghost" data-a="back">Back to the offseason</button>`;
}
function vFAPlayer() {
  const W = SEASON, p = faPlayers(W).find(x => x.id === APP.fap), J = CAREER.job, s = mySchool();
  if (!p) return vFAList();
  const st = strengths(p, CLASS_LEVEL.PRO).map(a => ATTR_PRAISE[a]), mine = faOffersOn(W, p.id).find(o => o.team === s.id);
  const F = APP.faForm && APP.faForm.id === p.id ? APP.faForm : (APP.faForm = { id: p.id, yrs: marketContract(p, seededRandom(hashSeed(p.id))).y.length, k: 1, g: "some" });
  const pay = Math.round(askFor(p) * F.k / 5000) * 5000, gs = FA_GTD.find(x => x[0] === F.g)[1], room = capRoom(s) - pendingFor(W, s.id) + (mine ? mine.pay : 0);
  const seg = (a, opts, cur, label) => `<div style="display:grid;gap:6px" role="group" aria-label="${label}"><span class="eyebrow" aria-hidden="true">${label}</span><div class="seg">${opts.map(([v, nm]) => `<button data-a="${a}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${nm}</button>`).join("")}</div></div>`;
  return `
    <div class="masthead">
      <p class="eyebrow">${esc(`Free agent · ${capFirst(posName(p.pos))}`)}</p>
      <h2 data-focus tabindex="-1">${esc(fullName(p))}</h2>
      <p class="muted">${esc(`${capFirst(posName(p.pos))} ${ovr(p, p.pos)}, ${yearName(p)}${p.from ? `, from the ${schoolName(W.schools[p.from])}` : ""}.${st.length ? ` ${capFirst(st.join(", "))}.` : ""} Asking ${bigMoney(askFor(p))} a year. ${plural(faOffersOn(W, p.id).length, "team has", "teams have")} made offers.`)}</p>
    </div>
    ${J.ctl ? `<section class="panel"><h3>Your offer</h3>
      ${seg("fayrs", [1, 2, 3, 4, 5].map(n => [n, plural(n, "year")]), F.yrs, "Years")}
      ${seg("fapay", [[.9, "10% under"], [1, "His ask"], [1.1, "10% over"], [1.25, "25% over"]], F.k, "Pay")}
      ${seg("fagtd", FA_GTD.map(([k, v]) => [k, `${capFirst(k)} guaranteed (${Math.round(v * 100)}%)`]), F.g, "Guarantee")}
      <p id="faterms">${esc(`${bigMoney(pay)} a year for ${plural(F.yrs, "year")}, ${bigMoney(Math.round(pay * gs * F.yrs / 5000) * 5000)} guaranteed. Room for it: ${bigMoney(Math.max(0, room))}.${mine ? ` Your offer now: ${bigMoney(mine.pay)} a year for ${plural(mine.yrs, "year")}.` : ""}`)}</p>
      <div class="choices"><button class="btn" data-a="faoffer">${mine ? "Change your offer" : "Make the offer"}</button>${mine ? `<button class="btn ghost" data-a="fapull">Pull your offer</button>` : ""}</div></section>`
      : `<section class="panel"><h3>Your GM</h3><p>${esc(standingWord(J.gms))}</p><button class="btn" data-a="fawant" aria-pressed="${!!(myReq().want && myReq().want.id === p.id)}">${myReq().want && myReq().want.id === p.id ? "Asked the GM to go after him" : "Ask the GM to go after him"}</button></section>`}
    <button class="btn ghost" data-a="back">Back to the free agents</button>`;
}
function faAct(a, ds) {
  if (!inPros() || !SEASON.myId || !SEASON.off) return false;
  const W = SEASON, off = W.off, J = CAREER.job, s = mySchool();
  switch (a) {
    case "rsset": { const p = playerById(s, ds.v); if (!J.ctl || off.stage !== "resign" || !p) return true; off.rs[p.id] = off.rs[p.id] === ds.t ? null : ds.t; announce(off.rs[p.id] ? { ext: `You'll extend ${fullName(p)}.`, tag: `You'll tag ${fullName(p)}.`, opt: `You'll pick up ${fullName(p)}'s option.`, go: `You'll let ${fullName(p)} go.` }[ds.t] : "Your staff decides."); return true; }
    case "fastart": if (off.stage === "resign") { proResignAll(W); proFADay(W); announce(`Free agency is open. Day 1: ${plural(off.mine.signed.length, "signing")} for you so far.`); } return true;
    case "faday": if (off.stage === "fa") { const n0 = off.mine.signed.length; proFADay(W); const n = off.mine.signed.length - n0; announce(off.stage === "fa" ? `Day ${off.day}.${n ? ` You signed ${plural(n, "player")}.` : ""}` : `Free agency is done.${n ? ` You signed ${plural(n, "player")}.` : ""} The draft is next.`); } return true;
    case "faall": if (off.stage === "fa" && confirmed("faall")) { while (off.stage === "fa") proFADay(W); announce(`Free agency is done. The draft is next.`); APP.screen = "offseason"; } return true;
    case "falist": if (off.stage === "fa") { APP.screen = "falist"; scrollTop(); } return true;
    case "fapos": if (POS_INFO[ds.v]) { APP.fapos = ds.v; focusNext = { id: "fahead" }; announce(`${POS_INFO[ds.v].group}.`); } return true;
    case "faplayer": APP.fap = ds.v; APP.faForm = null; APP.screen = "faplayer"; scrollTop(); return true;
    case "fayrs": if (APP.faForm) { APP.faForm.yrs = clamp(+ds.v, 1, 5); focusNext = { a: "fayrs", v: String(ds.v) }; announce(plural(APP.faForm.yrs, "year")); } return true;
    case "fapay": if (APP.faForm) { APP.faForm.k = +ds.v; focusNext = { a: "fapay", v: String(ds.v) }; const p = faPlayers(W).find(x => x.id === APP.fap); announce(p ? `${bigMoney(Math.round(askFor(p) * APP.faForm.k / 5000) * 5000)} a year.` : ""); } return true;
    case "fagtd": if (APP.faForm && FA_GTD.some(x => x[0] === ds.v)) { APP.faForm.g = ds.v; focusNext = { a: "fagtd", v: ds.v }; announce(`${capFirst(ds.v)} guaranteed.`); } return true;
    case "faoffer": {
      const F = APP.faForm, p = faPlayers(W).find(x => x.id === APP.fap);
      if (!F || !p) return true;
      const pay = Math.round(askFor(p) * F.k / 5000) * 5000, why = myFAOffer(W, p.id, F.yrs, pay, FA_GTD.find(x => x[0] === F.g)[1]);
      announce(why || `Offer made: ${bigMoney(pay)} a year for ${plural(F.yrs, "year")}. He decides at the end of the day.`);
      return true;
    }
    case "fapull": pullFAOffer(W, APP.fap); announce("Offer pulled."); return true;
    case "fawant": { const p = faPlayers(W).find(x => x.id === APP.fap), R = myReq(); if (!p) return true; R.want = R.want && R.want.id === p.id ? null : { id: p.id, name: fullName(p) }; announce(R.want ? `You asked the GM to go after ${fullName(p)}.` : "Request dropped."); return true; }
  }
  return false;
}
