// Friday to Sunday: the pro draft's screens (Milestone 5, step 5). Your draft board, a prospect,
// finding prospects by position, and the draft room.
"use strict";

/* ---------- Reading a prospect ---------- */
// "Marcus Hill, receiver, Lakeshore State, age 21. About 68 to 76."
const prospectLineD = p => `${fullName(p)}, ${posName(p.pos)}, ${p.col}, age ${p.age}. ${capFirst(rangeText(p))}.${p.you ? " Your former player." : ""}`;
const DPRI_NAMES = { 3: "top priority", 2: "high priority", 1: "normal priority" };
function draftHere() { return inPros() && SEASON.myId && SEASON.draft ? SEASON.draft : null; }
// Where a prospect went, once he's picked: "Taken in round 1, pick 7, by the Marlow Mustangs."
function takenText(D, id) {
  const pk = (D.picks || []).find(x => x.pid === id);
  return pk ? `Taken in ${pickText(pk)}, by the ${pk.team === SEASON.myId ? "you" : schoolName(SEASON.schools[pk.team])}.`.replace("by the you", "by you") : "";
}

/* ---------- Your board ---------- */
function vDBoard() {
  const D = draftHere(), s = mySchool(), J = CAREER.job, taken = draftTaken(D);
  const row = (id, k) => { const p = draftProspect(D, id); return `<li><button class="rowbtn" data-a="dprospect" data-v="${id}">${esc(`${k + 1}. ${prospectLineD(p)} ${capFirst(DPRI_NAMES[D.pri[id] || 1])}.${taken.has(id) ? ` ${takenText(D, id)}` : ""}`)}</button></li>`; };
  const staff = !J.ctl || J.staff.board;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`The ${D.year} draft · ${plural(Object.keys(D.byId).length, "prospect")}`)}</p>
      <h2 data-focus tabindex="-1">Your draft board</h2>
      <p class="muted">${esc(`The prospects in the order you'd take them. ${staff ? "Your staff keeps the board filled with the best it sees, your needs first, and keeps the order of anyone you've moved." : "You build the board yourself."} Your staff's scouting time each week goes by priority: a top prospect gets three times a normal one's time. ${D.cmb ? "The combine is in." : "The combine comes after the season."} Your needs: ${myNeeds().map(posName).join(", ") || "none named"}.`)}</p>
    </div>
    <section class="panel"><h3>The board</h3>${D.board.length ? `<ol class="roster">${D.board.map(row).join("")}</ol>` : "<p>Nobody on your board yet.</p>"}</section>
    <div class="choices"><button class="btn ghost" data-a="dfind">Find prospects</button>${SEASON.phase === "offseason" && !leavingSchool() ? `<button class="btn ghost" data-a="draftroom">The draft room</button>` : ""}</div>
    <button class="btn ghost" data-a="back">Back</button>`;
}
function vDProspect() {
  const D = draftHere(), id = APP.dpro, p = draftProspect(D, id), on = D.board.includes(id), k = D.board.indexOf(id), pri = D.pri[id] || 1, done = draftTaken(D).has(id);
  if (!p) return vDBoard();
  const st = strengths(p, CLASS_LEVEL.PRO).map(a => ATTR_PRAISE[a]);
  return `
    <div class="masthead">
      <p class="eyebrow">${esc(`The ${D.year} draft · ${capFirst(posName(p.pos))}`)}</p>
      <h2 data-focus tabindex="-1">${esc(fullName(p))}</h2>
      <p class="muted">${esc(`${capFirst(posName(p.pos))}, ${p.col}, age ${p.age}${p.early ? ", a junior who declared early" : ""}.`)}</p>
    </div>
    <section class="panel"><h3>What your scouts see</h3>
      <p>${esc(`Overall at ${posName(p.pos)}: ${rangeText(p)}.${st.length ? ` ${capFirst(st.join(", "))}.` : ""} ${combineText(p)}`)}</p>
      ${p.you ? `<p>${esc(p.you)}</p>` : ""}
      ${done ? `<p>${esc(takenText(D, id))}</p>` : on ? `<p>${esc(`Number ${k + 1} on your board, ${DPRI_NAMES[pri]}.`)}</p>` : "<p>Not on your board.</p>"}
    </section>
    ${done ? "" : on ? `<section class="panel"><h3>Scouting priority</h3><div class="seg" role="group" aria-label="Priority">${[[3, "Top"], [2, "High"], [1, "Normal"]].map(([v, nm]) => `<button data-a="dpri" data-v="${v}" aria-pressed="${pri === v}">${nm}</button>`).join("")}</div></section>
      <section class="panel"><h3>On your board</h3><div class="choices"><button class="btn ghost" data-a="dbmove" data-v="top">Move to the top</button><button class="btn ghost" data-a="dbmove" data-v="up">Move up</button><button class="btn ghost" data-a="dbmove" data-v="down">Move down</button><button class="btn ghost" data-a="dbmove" data-v="remove">Take him off the board</button></div></section>`
      : `<button class="btn" data-a="dbmove" data-v="add">Put him on your board</button>`}
    <button class="btn ghost" data-a="back">Back</button>`;
}
function vDFind() {
  const D = draftHere(), pos = APP.dpos && POS_INFO[APP.dpos] ? APP.dpos : "QB", taken = draftTaken(D);
  const list = Object.keys(D.byId).map(id => draftProspect(D, id)).filter(p => p.pos === pos && !taken.has(p.id)).sort((a, b) => prospectEst(b) - prospectEst(a)).slice(0, 25);
  return `
    <div class="masthead">
      <p class="eyebrow">${esc(`The ${D.year} draft`)}</p>
      <h2 data-focus tabindex="-1">Find prospects</h2>
      <p class="muted">The best at each position by what your scouts see, the ones on your board marked.</p>
      <div class="seg" role="group" aria-label="Position">${POS_IDS.map(x => `<button data-a="dpos" data-v="${x}" aria-pressed="${x === pos}">${capFirst(posName(x))}</button>`).join("")}</div>
    </div>
    <section class="panel"><h3 id="dfhead" tabindex="-1">${esc(POS_INFO[pos].group)}</h3><ul class="hlist">${list.map(p => `<li><button class="rowbtn" data-a="dprospect" data-v="${p.id}">${esc(`${prospectLineD(p)}${D.board.includes(p.id) ? " On your board." : ""}`)}</button></li>`).join("")}</ul></section>
    <button class="btn ghost" data-a="back">Back to the board</button>`;
}

/* ---------- The draft room ---------- */
function vDraftRoom() {
  const D = draftHere(), W = SEASON, s = mySchool(), J = CAREER.job;
  if (!D.picks) D.picks = draftPicks(proDraftOrder(W), W.comp || []);
  const mine = D.picks.filter(pk => pk.team === s.id), cur = D.picks[D.cur], taken = draftTaken(D);
  const avail = D.board.filter(id => !taken.has(id)).slice(0, 8);
  const recent = D.picks.slice(Math.max(0, D.cur - 8), D.cur).reverse().map(pk => `${pk.n}. ${pk.team === s.id ? "You" : `The ${SEASON.schools[pk.team].mascot}`}: ${pk.pid ? `${fullName(draftProspect(D, pk.pid))}, ${posName(draftProspect(D, pk.pid).pos)}, ${draftProspect(D, pk.pid).col}` : "no pick"}.`);
  const myClass = mine.filter(pk => pk.pid).map(pk => `${capFirst(pickText(pk))}: ${prospectLineD(draftProspect(D, pk.pid))}`);
  let clock = "";
  if (D.done) clock = `<section class="panel"><h3>The draft is done</h3><p>${esc(`Your class: ${plural(myClass.length, "player")}. Undrafted free agents sign before camp.`)}</p></section>`;
  else if (cur && cur.team === s.id) {
    const push = !J.ctl, pushed = D.push[cur.rd];
    clock = `<section class="panel teamcard" style="--team:${s.color}"><p class="eyebrow">${esc(capFirst(pickText(cur)))}</p><h3 id="clock" tabindex="-1">You're on the clock</h3>
      <p>${esc(push ? `Your GM makes the pick. You get one push a round for a player you want${pushed ? `: this round, ${fullName(draftProspect(D, pushed))}` : ""}. ${standingWord(J.gms)}` : "The pick is yours.")}</p>
      ${avail.length ? `<ul class="hlist">${avail.map(id => { const p = draftProspect(D, id); return `<li class="xprow"><span>${esc(prospectLineD(p))}</span><button class="btn ghost slim" data-a="${push ? "dpush" : "dtake"}" data-v="${id}"${push && pushed === id ? ' aria-pressed="true"' : ""}>${push ? (pushed === id ? `Pushing for ${esc(p.first)}` : `Push for ${esc(p.first)}`) : `Take ${esc(fullName(p))}`}</button></li>`; }).join("")}</ul>` : "<p>Nobody from your board is left.</p>"}
      <div class="choices"><button class="btn" data-a="dstaff">${push ? "Let the GM pick" : "Let your staff pick"}</button><button class="btn ghost" data-a="dboard">Your board</button><button class="btn ghost" data-a="dfind">Find prospects</button></div></section>`;
  } else if (cur) clock = `<section class="panel"><p class="eyebrow">${esc(capFirst(pickText(cur)))}</p><h3 id="clock" tabindex="-1">${esc(`On the clock: the ${schoolName(SEASON.schools[cur.team])}`)}</h3>
      <div class="choices"><button class="btn" data-a="dsim">Sim to your next pick</button><button class="btn ghost" data-a="dsimall">${confirming === "dsimall" ? "Tap again to sim the rest of the draft" : "Sim the rest of the draft"}</button></div></section>`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`The ${D.year} draft · ${plural(D.picks.length, "pick")}`)}</p>
      <h2 data-focus tabindex="-1">The draft room</h2>
      <p class="muted">${esc(`Your picks: ${mine.map(pk => `round ${pk.rd} (${pk.n})`).join(", ") || "none"}.`)}</p>
    </div>
    ${clock}
    ${myClass.length ? `<section class="panel"><h3>Your class</h3><ul class="hlist">${myClass.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
    ${recent.length ? `<section class="panel"><h3>The last picks</h3><ul class="hlist">${recent.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
    ${(D.log || []).length ? `<section class="panel"><h3>Your GM</h3><ul class="hlist">${D.log.map(x => `<li>${esc(x.t)}</li>`).join("")}</ul></section>` : ""}
    <button class="btn ghost" data-a="back">Back to the offseason</button>`;
}
// After the computer teams pick: one line on what went from your board (only those are announced)
function boardGone(D, from) {
  const gone = D.picks.slice(from, D.cur).filter(pk => pk.pid && D.board.includes(pk.pid) && pk.team !== SEASON.myId);
  return gone.length ? ` From your board: ${gone.map(pk => `${fullName(draftProspect(D, pk.pid))} at ${pk.n}`).join(", ")}.` : "";
}
function draftAct(a, ds) {
  const D = draftHere();
  if (!D) return false;
  const J = CAREER.job;
  switch (a) {
    case "dboard": APP.dBack = ["draftroom", "dprospect", "dfind", "dboard"].includes(APP.screen) ? APP.dBack : APP.screen; APP.screen = "dboard"; scrollTop(); return true;
    case "dprospect": if (D.byId[ds.v]) { APP.dproBack = APP.screen; APP.dpro = ds.v; APP.screen = "dprospect"; scrollTop(); } return true;
    case "dfind": APP.dfindBack = APP.screen; APP.screen = "dfind"; scrollTop(); return true;
    case "dpos": if (POS_INFO[ds.v]) { APP.dpos = ds.v; focusNext = { id: "dfhead" }; announce(`${POS_INFO[ds.v].group}.`); } return true;
    case "dpri": if (D.board.includes(APP.dpro) && DPRI_NAMES[ds.v]) { D.pri[APP.dpro] = +ds.v; announce(`${capFirst(DPRI_NAMES[ds.v])}.`); } return true;
    case "dbmove": {
      const id = APP.dpro;
      boardMove(D, id, ds.v);
      const k = D.board.indexOf(id);
      announce(ds.v === "remove" ? "Off your board." : k >= 0 ? `Number ${k + 1} on your board.` : "");
      return true;
    }
    case "draftroom": if (SEASON.phase === "offseason" && marketClosed() && !leavingSchool()) { combine(D); if (!D.picks) D.picks = draftPicks(proDraftOrder(SEASON), SEASON.comp || []); APP.screen = "draftroom"; scrollTop(); } return true;
    case "dsim": { if (D.done) return true; const from = D.cur, pk = runDraft(SEASON, D, true); focusNext = { id: "clock" }; announce(pk ? `You're on the clock: ${pickText(pk)}.${boardGone(D, from)}` : `The draft is done.${boardGone(D, from)}`); return true; }
    case "dsimall": { if (D.done || !confirmed("dsimall")) return true; const from = D.cur; while (!D.done) { const pk = runDraft(SEASON, D, true); if (pk) myPick(SEASON, D, null); } announce(`The draft is done.${boardGone(D, from)}`); return true; }
    case "dtake": case "dstaff": {
      const pk = D.picks && D.picks[D.cur];
      if (!pk || pk.team !== SEASON.myId || (a === "dtake" && !J.ctl)) return true;
      const pid = myPick(SEASON, D, a === "dtake" ? ds.v : null), p = pid ? draftProspect(D, pid) : null;
      const next = runDraft(SEASON, D, true);
      focusNext = { id: "clock" };
      announce(`${p ? `You took ${fullName(p)}, ${posName(p.pos)}, ${p.col}.` : ""} ${next ? `Next: ${pickText(next)}.` : "The draft is done."}`);
      return true;
    }
    case "dpush": { const pk = D.picks && D.picks[D.cur]; if (!pk || pk.team !== SEASON.myId || J.ctl || !D.byId[ds.v]) return true; D.push[pk.rd] = ds.v; announce(`You're pushing for ${fullName(draftProspect(D, ds.v))}. Let the GM pick when you're ready.`); return true; }
  }
  return false;
}
