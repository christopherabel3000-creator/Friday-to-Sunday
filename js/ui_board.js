// Friday to Sunday: the recruiting board's screens (Milestone 4). The board, one prospect, finding
// prospects, your staff's settings, and the recruiting panels on the season and week screens.
"use strict";

const recList = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
const noNil = () => !REC_LV[mySchool().cls];

/* ---------- On the season and week screens ---------- */
// The week ahead: one line on the class and the board's button
function recPanel() {
  if (coordRole()) return "";
  const rec = recBoard();
  if (!rec) return "";
  const dec = recDecisions(rec);
  return `<section class="panel"><h3>Recruiting</h3><p>${esc(recSummary(rec))}${dec.length ? ` ${esc(plural(dec.length, "decision"))} waiting for you.` : ""}</p><button class="btn ghost" data-a="board">Recruiting board</button></section>`;
}
// A week's results: only what changed, and the decisions waiting, each with its button
function recWeekPanel(n) {
  if (coordRole()) return "";
  const rec = SEASON.rec;
  if (!rec || rec.year !== SEASON.year + 1 || n > COL_REG) return "";
  const lines = rec.log[n] || [], dec = n === weeksDone() ? recDecisions(rec) : [];
  if (!lines.length && !dec.length) return "";
  return `<section class="panel"><h3>Recruiting</h3>${lines.length ? recList(lines) : ""}
    ${dec.map(d => `<p>${esc(d.text)}</p><div class="choices"><button class="btn ghost" data-a="rdecide" data-v="${d.id}">Offer ${esc(moneyText(d.amt))}</button></div>`).join("")}
    <button class="btn ghost" data-a="board">Recruiting board</button></section>`;
}

/* ---------- The board ---------- */
function vBoard() {
  const rec = recBoard(), s = mySchool();
  if (!rec) return `<div class="masthead"><h2 data-focus tabindex="-1">Recruiting board</h2><p class="muted">No recruiting right now.</p></div><button class="btn" data-a="back">Back</button>`;
  const dec = recDecisions(rec), row = p => `<li><button class="rowbtn" data-a="prospect" data-v="${p.id}">${esc(boardLine(rec, p))}</button></li>`;
  const sec = (title, list) => list.length ? `<section class="panel"><h3>${esc(title)}</h3><ul class="hlist">${list.map(row).join("")}</ul></section>` : "";
  const board = onBoard(rec).sort((a, b) => b.r - a.r);
  let body;
  if (rec.done) {
    const mine = rec.cls.filter(p => !p.walkOn).sort((a, b) => (b.stars || 2) - (a.stars || 2));
    const lost = rec.sum.lost.map(([id, cid]) => [recById(rec, id), cid]).filter(x => x[0] && x[0].pr).slice(0, 12);
    body = `<section class="panel"><h3>Signed with you</h3>${mine.length ? recList(mine.map(p => `${fullName(p)}, ${starText(p.stars || 2)}, ${posName(p.pos)}.`)) : "<p>Nobody.</p>"}
      ${rec.sum.walk ? `<p>${esc(`And ${plural(rec.sum.walk, "walk-on")}.`)}</p>` : ""}</section>
      ${lost.length ? `<section class="panel"><h3>Signed elsewhere</h3>${recList(lost.map(([p, cid]) => `${p.first} ${p.last}, ${starText(p.st)}, ${posName(p.pos)}: ${SEASON.schools[cid].town}.`))}</section>` : ""}`;
  } else {
    body = `${dec.length ? `<section class="panel"><h3>Waiting for you</h3>${dec.map(d => `<p>${esc(d.text)}</p><div class="choices"><button class="btn ghost" data-a="rdecide" data-v="${d.id}">Offer ${esc(moneyText(d.amt))}</button></div>`).join("")}</section>` : ""}
      ${sec("Committed", board.filter(p => p.cm === "me"))}
      ${sec("Top priority", board.filter(p => p.cm !== "me" && p.pr === 3))}
      ${sec("High priority", board.filter(p => p.cm !== "me" && p.pr === 2))}
      ${sec("Normal priority", board.filter(p => p.cm !== "me" && p.pr === 1))}
      ${board.length ? "" : `<p>Nobody's on the board yet.</p>`}
      <button class="btn" data-a="rfind">Find prospects</button>
      ${staffPanel(rec)}`;
  }
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`${nameOf(s.id)} · The class of ${rec.year}`)}</p>
      <h2 data-focus tabindex="-1">Recruiting board</h2>
      <p class="muted">${esc(recSummary(rec))}</p>
    </div>
    ${body}
    <button class="btn ghost" data-a="back">Back</button>`;
}
// How hands-off you are
function staffPanel(rec) {
  const st = rec.staff, tog = (k, label) => `<button class="btn ghost" data-a="rstaff" data-v="${k}" aria-pressed="${!!st[k]}">${label}: ${st[k] ? "on" : "off"}</button>`;
  const nilSeg = noNil() ? `<p class="muted">Division III can't pay players or give athletic scholarships.</p>`
    : `<div style="display:grid;gap:6px" role="group" aria-label="Staff NIL offers"><span class="eyebrow" aria-hidden="true">Staff NIL offers</span><div class="seg">${["Off", "A quarter", "Half", "All"].map((nm, k) => `<button data-a="rstaffnil" data-v="${k}" aria-pressed="${STAFF_NIL[k] === (st.nil || 0)}">${nm}</button>`).join("")}</div></div>
      <p class="muted">${esc(st.nil ? `Your staff can spend up to ${moneyText(st.nil * rec.budget)} of the class's NIL on its own (${moneyText(rec.staffNil || 0)} so far). Anything past that waits for you.` : "Your staff makes no NIL offers on its own: each one waits for you.")}</p>`;
  return `<section class="panel"><h3>Your staff</h3>
    <div class="choices">${tog("fill", "Staff fills the board")}${tog("visits", "Staff handles visits")}</div>
    <p class="muted">${esc(`${st.fill ? "Your staff adds the best fits for your needs and drops prospects who lose interest." : "Only you add and drop prospects."} ${st.visits ? "Your staff invites the best three prospects to each home game." : "Only you invite prospects to home games."}`)}</p>
    ${nilSeg}</section>`;
}

/* ---------- One prospect ---------- */
function vProspect() {
  const rec = recBoard(), p = rec && recById(rec, APP.prospect), s = mySchool();
  if (!p) return vBoard();
  const st = standing(p).slice(0, 5).map(([id, I]) => `${id === "me" ? "You" : SEASON.schools[id].town} ${Math.round(I)}`);
  const ask = myAsk(p), left = nilLeft(rec), vw = Object.keys(rec.vis).find(w => rec.vis[w].includes(p.id) && +w >= SEASON.week);
  let acts = "";
  if (rec.done) acts = "";
  else if (!p.pr) acts = `<div class="choices"><button class="btn" data-a="radd" data-v="${p.id}"${onBoard(rec).length >= BOARD_MAX ? " disabled" : ""}>${onBoard(rec).length >= BOARD_MAX ? "The board is full (30)" : "Add to the board"}</button></div>`;
  else {
    const pri = `<div style="display:grid;gap:6px" role="group" aria-label="Priority"><span class="eyebrow" aria-hidden="true">Priority</span><div class="seg">${[3, 2, 1].map(k => `<button data-a="rpri" data-v="${k}" aria-pressed="${p.pr === k}">${capFirst(PRI_NAMES[k])}</button>`).join("")}</div></div>`;
    let nil = "";
    if (!noNil() && ask) {
      const up = roundMoney((p.nil || ask) * 1.25);
      nil = `<p>${esc(`${p.nil ? `Your NIL offer: ${moneyText(p.nil)}.` : `No NIL offer yet. He's looking for about ${moneyText(ask)}.`} ${moneyText(left)} left for the class.`)}</p>
        <div class="choices">${p.nil ? `<button class="btn ghost" data-a="rnil" data-v="${up}"${up - p.nil > left ? " disabled" : ""}>Raise it to ${esc(moneyText(up))}</button><button class="btn ghost" data-a="rnil" data-v="0">Pull the offer</button>`
          : `<button class="btn ghost" data-a="rnil" data-v="${ask}"${ask > left ? " disabled" : ""}>Offer ${esc(moneyText(ask))}</button><button class="btn ghost" data-a="rnil" data-v="${up}"${up > left ? " disabled" : ""}>Offer ${esc(moneyText(up))}</button>`}</div>`;
    } else if (!noNil()) nil = `<p>He isn't looking for NIL money.</p>`;
    const vis = p.vd ? `<p>${esc(`He visited in ${weekName(p.vd)}.`)}</p>` : vw ? `<p>${esc(`Visit: the ${weekName(+vw)} home game.`)}</p><div class="choices"><button class="btn ghost" data-a="rcancel">Cancel the visit</button></div>`
      : homeWeeks().length ? `<div class="choices"><button class="btn ghost" data-a="rvisit">Invite him to a home game</button></div>` : `<p>No home games left for a visit.</p>`;
    acts = `${pri}${nil}${vis}<div class="choices"><button class="btn ghost" data-a="rremove">${confirming === "rremove" ? "Tap again to take him off" : "Take him off the board"}</button></div>`;
  }
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`${starText(p.st)} · ${capFirst(posName(p.pos))}`)}</p>
      <h2 data-focus tabindex="-1">${esc(`${p.first} ${p.last}`)}</h2>
      <p class="muted">${esc(`${capFirst(homeText(p))}. Recruit rating ${Math.round(p.r)}.${p.pr ? ` ${capFirst(PRI_NAMES[p.pr])} priority.` : " Not on your board."}`)}</p>
    </div>
    <section class="panel"><h3>Where he stands</h3><p id="pstand" tabindex="-1">${esc(`${interestWord(p)}. Interest: ${andList(st)}.`)}</p></section>
    <section class="panel"><h3>Recruiting him</h3>${acts || "<p>Signing day is done.</p>"}</section>
    <button class="btn ghost" data-a="back">Back</button>`;
}

/* ---------- Finding prospects ---------- */
const FIND_POS = ["all", "QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"];
function findList(rec) {
  const f = APP.rfind || {}, pos = f.pos || "all", stars = f.stars || 0, home = !!f.home;
  return rec.pool.filter(p => !p.pr && (pos === "all" || p.pos === pos) && (!stars || p.st === stars) && (!home || p.hs))
    .sort((a, b) => !!a.cm - !!b.cm || b.r - a.r).slice(0, 25);
}
function vFind() {
  const rec = recBoard(), s = mySchool();
  if (!rec) return vBoard();
  const f = APP.rfind || {}, list = findList(rec);
  const seg = (a, opts, cur, label) => `<div style="display:grid;gap:6px" role="group" aria-label="${label}"><span class="eyebrow" aria-hidden="true">${label}</span><div class="seg">${opts.map(([v, nm]) => `<button data-a="${a}" data-v="${v}" aria-pressed="${cur === v}">${nm}</button>`).join("")}</div></div>`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">Recruiting board</p>
      <h2 data-focus tabindex="-1">Find prospects</h2>
      <p class="muted">${esc(`${onBoard(rec).length} of 30 on the board. Biggest needs: ${needsText(rec)}.`)}</p>
    </div>
    <section class="panel">
      ${seg("rfpos", FIND_POS.map(x => [x, x === "all" ? "All" : x]), f.pos || "all", "Position")}
      ${seg("rfstars", [[0, "All"], [5, "5 stars"], [4, "4 stars"], [3, "3 stars"], [2, "2 stars"]], f.stars || 0, "Stars")}
      <div class="choices"><button class="btn ghost" data-a="rfhome" aria-pressed="${!!f.home}">From your old state only: ${f.home ? "on" : "off"}</button></div>
    </section>
    <section class="panel"><h3 id="findhead" tabindex="-1">${esc(list.length ? `${plural(list.length, "prospect")}, best first` : "Nobody matches")}</h3>
      <ul class="hlist">${list.map(p => `<li><button class="rowbtn" data-a="prospect" data-v="${p.id}">${esc(`${prospectHead(p)}. ${interestWord(p)} (${Math.round(p.I)}). ${rivalsText(p)}`)}</button></li>`).join("")}</ul></section>
    <button class="btn ghost" data-a="back">Back to the board</button>`;
}

/* ---------- Taps ---------- */
function boardAct(a, ds) {
  const rec = SEASON && SEASON.lvl === "col" ? recBoard() : null;
  if (!rec) return false;
  const p = recById(rec, ds.v != null && recById(rec, ds.v) ? ds.v : APP.prospect), nm = p ? `${p.first} ${p.last}` : "";
  if (!p && ["radd", "rpri", "rnil", "rvisit", "rcancel", "rremove"].includes(a)) return true;
  switch (a) {
    case "board": APP.boardBack = APP.screen === "board" ? APP.boardBack : APP.screen; APP.screen = "board"; scrollTop(); return true;
    case "prospect": APP.prospectBack = APP.screen; APP.prospect = ds.v; APP.screen = "prospect"; scrollTop(); return true;
    case "rfind": APP.screen = "rfind"; scrollTop(); return true;
    case "rfpos": APP.rfind = Object.assign({}, APP.rfind, { pos: ds.v }); focusNext = { id: "findhead" }; return true;
    case "rfstars": APP.rfind = Object.assign({}, APP.rfind, { stars: +ds.v || 0 }); focusNext = { id: "findhead" }; return true;
    case "rfhome": APP.rfind = Object.assign({}, APP.rfind, { home: !(APP.rfind || {}).home }); focusNext = { id: "findhead" }; return true;
    case "radd": if (addProspect(rec, p.id, 1)) announce(`${nm} is on the board, normal priority.`); return true;
    case "rpri": if (setPriority(rec, p.id, +ds.v)) announce(`${capFirst(PRI_NAMES[+ds.v])} priority.`); return true;
    case "rnil": if (setNil(rec, p.id, +ds.v)) announce(+ds.v ? `NIL offer: ${moneyText(p.nil)}. ${moneyText(nilLeft(rec))} left.` : `Offer pulled. ${moneyText(nilLeft(rec))} left.`); else announce("Not enough NIL money left."); return true;
    case "rdecide": {
      const d = recDecisions(rec).find(x => x.id === ds.v);
      if (d && setNil(rec, d.id, d.amt)) { announce(`NIL offer made to ${nm}: ${moneyText(d.amt)}. ${moneyText(nilLeft(rec))} left.`); focusNext = { a: "board" }; }
      return true;
    }
    case "rvisit": { const w = invite(rec, p.id); announce(w ? `Invited to the ${weekName(w)} home game.` : "Every home game left already has three visitors."); return true; }
    case "rcancel": if (cancelVisit(rec, p.id)) announce("Visit canceled."); return true;
    case "rremove":
      if (!confirmed("rremove")) return true;
      if (removeProspect(rec, p.id)) { announce(`${nm} is off the board.`); APP.screen = APP.prospectBack === "rfind" ? "rfind" : "board"; scrollTop(); }
      return true;
    case "rstaff": if (ds.v === "fill" || ds.v === "visits") { rec.staff[ds.v] = !rec.staff[ds.v]; if (ds.v === "visits") planVisits(rec); announce(`${ds.v === "fill" ? "Staff fills the board" : "Staff handles visits"}: ${rec.staff[ds.v] ? "on" : "off"}.`); } return true;
    case "rstaffnil": { const k = +ds.v; if (STAFF_NIL[k] != null) { rec.staff.nil = STAFF_NIL[k]; announce(k ? `Your staff can spend up to ${moneyText(rec.staff.nil * rec.budget)}.` : "Staff NIL offers: off."); } return true; }
  }
  return false;
}

/* ---------- The transfer portal ---------- */
// In the offseason: who of yours entered, and the button to the portal
function portalPanel() {
  if (coordRole()) return "";
  if (CAREER.next || (SEASON.market && SEASON.market.took) || (SEASON.review && SEASON.review.fired)) return "";
  const P = colPortal();
  if (!P) return "";
  const s = mySchool(), mine = P.out.length, keep = P.out.filter(x => x.keep).length, after = P.pool.filter(q => q.offer != null).length;
  return `<section class="panel"><h3>The transfer portal</h3><p>${esc(`${mine ? `${mine} of your players ${mine === 1 ? "has" : "have"} entered the portal${keep ? `, and you're keeping ${keep}` : ""}.` : "None of your players entered the portal."} ${plural(P.pool.length, "player")} from other programs are in it${after ? `, and you're after ${after}` : ""}. The window closes when the next season starts.`)}</p><button class="btn ghost" data-a="portal">The transfer portal</button></section>`;
}
const PORTAL_POS = FIND_POS;
function vPortal() {
  const P = colPortal(), s = mySchool();
  if (!P) return `<div class="masthead"><h2 data-focus tabindex="-1">The transfer portal</h2><p class="muted">The portal is closed.</p></div><button class="btn" data-a="back">Back</button>`;
  const money = !noNil(), left = portalMoney(P), spots = portalSpots(P), pos = APP.portalPos || "all";
  const seg = `<div style="display:grid;gap:6px" role="group" aria-label="Position"><span class="eyebrow" aria-hidden="true">Position</span><div class="seg">${PORTAL_POS.map(x => `<button data-a="ptpos" data-v="${x}" aria-pressed="${pos === x}">${x === "all" ? "All" : x}</button>`).join("")}</div></div>`;
  const mineRows = P.out.map(x => {
    const tag = x.why === "pay" ? (x.keep ? "Let him go" : `Keep him: ${moneyText(x.ask)}`) : (x.keep ? "Let him go" : "Ask him to stay");
    return `<li><p>${esc(portalOutLine(x))}</p><div class="choices"><button class="btn ghost" data-a="ptkeep" data-v="${x.id}">${esc(tag)}</button></div></li>`;
  }).join("");
  const list = P.pool.filter(q => pos === "all" || q.pos === pos).slice(0, 25);
  const rows = list.map(q => `<li><p>${esc(portalLine(s, q))}</p><div class="choices">${q.offer != null ? `<button class="btn ghost" data-a="ptoffer" data-v="${q.id}" data-t="pull">Stop going after him</button>`
    : `<button class="btn ghost" data-a="ptoffer" data-v="${q.id}">${esc(money && q.ask ? `Offer ${moneyText(q.ask)}` : "Go after him")}</button>`}</div></li>`).join("");
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`${nameOf(s.id)} · ${SEASON.year} offseason`)}</p>
      <h2 data-focus tabindex="-1">The transfer portal</h2>
      <p class="muted" id="ptmoney">${esc(`${money ? `${moneyText(Math.max(0, left))} left for next season's players, of ${moneyText(payBudget(s) + nilGift(s))}${nilGift(s) ? `, with your ${moneyText(nilGift(s))} gift` : ""}. ` : "Division III can't pay players. "}${plural(Math.max(0, spots), "roster spot")} open. The window closes when the next season starts: then the players you're after decide.`)}</p>
    </div>
    <section class="panel"><h3>Your players in the portal</h3>${P.out.length ? `<ul class="hlist">${mineRows}</ul>` : "<p>None of your players entered.</p>"}
      ${P.out.some(x => x.why !== "pay") ? `<p class="muted">Asking a player to stay works about half the time.</p>` : ""}</section>
    <section class="panel"><h3 id="pthead" tabindex="-1">From other programs</h3>${seg}<ul class="hlist">${rows || "<li>Nobody at that position.</li>"}</ul></section>
    <button class="btn ghost" data-a="back">Back</button>`;
}
function portalAct(a, ds) {
  const P = SEASON && SEASON.lvl === "col" ? colPortal() : null;
  if (!P) return false;
  switch (a) {
    case "portal": APP.screen = "portal"; scrollTop(); return true;
    case "ptpos": APP.portalPos = ds.v; focusNext = { id: "pthead" }; return true;
    case "ptkeep": {
      const x = P.out.find(y => y.id === ds.v), p = x && mySchool().players.find(q => q.id === x.id);
      if (!x) return true;
      if (portalKeep(P, x.id, !x.keep)) announce(x.keep ? `${fullName(p)}: ${x.why === "pay" ? "you're keeping him" : "you'll ask him to stay"}. ${noNil() ? "" : `${moneyText(Math.max(0, portalMoney(P)))} left.`}` : `${fullName(p)} is leaving.`);
      else announce("Not enough money left to keep him.");
      return true;
    }
    case "ptoffer": {
      const q = P.pool.find(y => y.id === ds.v);
      if (!q) return true;
      if (ds.t === "pull") { portalOffer(P, q.id, null); announce(`You stopped going after ${q.first} ${q.last}.`); return true; }
      if (portalOffer(P, q.id, q.ask)) announce(`You're after ${q.first} ${q.last}. He decides when the window closes.`);
      else announce(portalSpots(P) <= 0 ? "No roster spots left." : "Not enough money left.");
      return true;
    }
  }
  return false;
}
