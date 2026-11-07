// Friday to Sunday: the trade screen (ptrade.js). Pick a team, then add players and picks from both
// sides; the other team's answer reads out as you build. An offer from another team waits at the top.
"use strict";

const tradeTeamLine = (W, id) => {
  const s = W.schools[id], r = W.phase === "regular" ? ` (${proRecText(proRecord(id, W.week - 1))})` : "";
  return `${schoolName(s)}${r}`;
};
// One side's list: what's in the trade, with a button to take each out
function tradeSideList(W, T, side, full, holder, label) {
  const S = T[side], items = S.players.map(id => { const p = full.players.find(x => x.id === id); return [`p:${id}`, p ? `${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}, ${yearName(p)}, ${proContractText(p)}` : "A player who's gone"]; })
    .concat(S.picks.map(k => [`k:${k}`, capFirst(pickName(W, k, holder))]));
  return `<p class="sechead" role="heading" aria-level="4">${label}</p>${items.length ? `<ul class="hlist">${items.map(([v, t]) => `<li class="xprow"><span>${esc(t)}</span><button class="btn ghost slim" data-a="trout" data-t="${side}" data-v="${v}">Take out</button></li>`).join("")}</ul>` : `<p class="muted">Nothing yet.</p>`}`;
}
// What a team can add: its players at one position, and its picks
function tradeAddList(W, T, side, full, holder, pos) {
  const S = T[side], ps = full.players.filter(p => p.pos === pos && !S.players.includes(p.id)).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)).slice(0, 8);
  const picks = teamPicks(W, holder).filter(k => !S.picks.includes(k));
  return `<ul class="hlist">${ps.map(p => `<li class="xprow"><span>${esc(`${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}, ${yearName(p)}, ${capHit(p) ? `${bigMoney(capHit(p))} this year, ` : ""}${plural(ctYears(p), "year")} left${p.ir ? ", on injured reserve" : ""}`)}</span><button class="btn ghost slim" data-a="trin" data-t="${side}" data-v="p:${p.id}">Add</button></li>`).join("") || `<li class="muted">No one at this position.</li>`}</ul>
    <details><summary>${esc(`Draft picks (${picks.length})`)}</summary><ul class="hlist">${picks.map(k => `<li class="xprow"><span>${esc(capFirst(pickName(W, k, holder)))}</span><button class="btn ghost slim" data-a="trin" data-t="${side}" data-v="k:${k}">Add</button></li>`).join("")}</ul></details>`;
}
function vTrade() {
  const W = SEASON, s = mySchool(), J = CAREER.job, O = W.tradeOffer;
  const head = `<div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(`Cap room ${bigMoney(capRoom(s))} · ${onActive(s).length} on the roster`)}</p>
      <h2 data-focus tabindex="-1">Trades</h2>
      <p class="muted">${esc(!tradesOpen(W) ? "Trades are closed until the season ends. The deadline was the Tuesday after week 9." : W.phase === "regular" ? `Open until the deadline, the Tuesday after week ${TRADE_DEADLINE}.` : `Open now and through week ${TRADE_DEADLINE} of the season.`)}</p>
    </div>`;
  if (!J.ctl) return `${head}<p>Your GM makes the trades. Ask him for a move from his screen.</p><button class="btn ghost" data-a="back">Back</button>`;
  const offer = O ? `<section class="panel"><h3 id="troffer" tabindex="-1">${esc(`An offer from the ${schoolName(W.schools[O.with])}`)}</h3><p>${esc(tradeText(W, O))}</p>
      <div class="choices"><button class="btn" data-a="tracc">Accept it</button><button class="btn ghost" data-a="trno">Turn it down</button></div></section>` : "";
  if (!tradesOpen(W)) return `${head}<button class="btn ghost" data-a="back">Back</button>`;
  const T = APP.trade && W.schools[APP.trade.with] ? APP.trade : null;
  if (!T) return `${head}${offer}<section class="panel"><h3>Trade with</h3><ul class="hlist">${Object.keys(W.schools).filter(id => id !== W.myId).sort((a, b) => schoolName(W.schools[a]).localeCompare(schoolName(W.schools[b]))).map(id => `<li><button class="rowbtn" data-a="trteam" data-v="${id}">${esc(tradeTeamLine(W, id))}</button></li>`).join("")}</ul></section><button class="btn ghost" data-a="back">Back</button>`;
  const B = proRoster(W.schools[T.with]), ans = tradeAnswer(W, T), pos = APP.trpos && POS_INFO[APP.trpos] ? APP.trpos : (teamNeeds(B)[0] || "QB");
  return `${head}${offer}
    <section class="panel"><h3>${esc(`With the ${schoolName(W.schools[T.with])}`)}</h3>
      <p class="muted">${esc(`Their needs: ${teamNeeds(B).map(posName).join(", ")}. Cap room ${bigMoney(capRoom(B))}.`)}</p>
      ${tradeSideList(W, T, "give", s, s.id, "You give")}
      ${tradeSideList(W, T, "get", B, T.with, "You get")}
      <p id="trword" aria-live="polite">${esc(ans.word)}</p>
      <div class="choices"><button class="btn" data-a="trsend">Propose the trade</button><button class="btn ghost" data-a="trclear">Start over</button><button class="btn ghost" data-a="trother">Another team</button></div>
    </section>
    <section class="panel"><h3 id="traddhead" tabindex="-1">Add to the trade</h3>
      <div class="seg wrap" role="group" aria-label="Position">${POS_IDS.map(x => `<button data-a="trpos" data-v="${x}" aria-pressed="${x === pos}">${capFirst(posName(x))}</button>`).join("")}</div>
      <p class="sechead" role="heading" aria-level="4">Yours</p>${tradeAddList(W, T, "give", s, s.id, pos)}
      <p class="sechead" role="heading" aria-level="4">Theirs</p>${tradeAddList(W, T, "get", B, T.with, pos)}
    </section>
    <button class="btn ghost" data-a="back">Back</button>`;
}
function tradeAct(a, ds) {
  if (!inPros() || !SEASON.myId || !CAREER.job || CAREER.job.lvl !== "pro") return false;
  const W = SEASON, J = CAREER.job;
  switch (a) {
    case "trade": APP.trBack = APP.screen === "trade" ? APP.trBack : APP.screen; APP.screen = "trade"; scrollTop(); return true;
    case "trteam": if (W.schools[ds.v] && ds.v !== W.myId) { APP.trade = newTrade(ds.v); APP.trpos = null; scrollTop(); } return true;
    case "trother": APP.trade = null; scrollTop(); return true;
    case "trclear": if (APP.trade) APP.trade = newTrade(APP.trade.with); announce("Nothing in the trade."); return true;
    case "trpos": if (POS_INFO[ds.v]) { APP.trpos = ds.v; focusNext = { id: "traddhead" }; } return true;
    case "trin": case "trout": {
      const T = APP.trade, S = T && T[ds.t];
      if (!S || !J.ctl) return true;
      const [kind, v] = [ds.v.slice(0, 1), ds.v.slice(2)], list = kind === "p" ? S.players : S.picks;
      if (a === "trin") { if (!list.includes(v)) list.push(v); } else list.splice(list.indexOf(v), 1);
      announce(tradeAnswer(W, T).word);
      return true;
    }
    case "trsend": {
      const T = APP.trade;
      if (!T || !J.ctl || !tradesOpen(W)) return true;
      const ans = tradeAnswer(W, T);
      if (!ans.ok) { announce(ans.word); return true; }
      const text = tradeText(W, T);
      doTrade(W, T);
      (W.off ? W.off.news : (W.news[Math.max(1, W.week - 1)] = W.news[Math.max(1, W.week - 1)] || [])).push(`You made a trade: ${text}`);
      APP.trade = null;
      announce(`Done. ${text}`);
      scrollTop();
      return true;
    }
    case "tracc": case "trno": {
      const O = W.tradeOffer;
      if (!O || !J.ctl) return true;
      W.tradeOffer = null;
      if (a === "trno") { announce("Turned down."); return true; }
      if (!tradeStands(W, O) || /cap|players/.test(tradeAnswer(W, O).word)) { announce("That deal can't happen now."); return true; }
      const text = tradeText(W, O);
      doTrade(W, O);
      (W.off ? W.off.news : (W.news[Math.max(1, W.week - 1)] = W.news[Math.max(1, W.week - 1)] || [])).push(`You made a trade: ${text}`);
      announce(`Done. ${text}`);
      return true;
    }
    // Draft day: move down
    case "dtrade": {
      const D = W.draft, offers = D ? tradeDownOffers(W, D) : [], T = offers.find(t => t.with === ds.v);
      if (!T || !J.ctl) return true;
      const text = tradeText(W, T);
      doTrade(W, T);
      D.log.push({ t: `You traded down: ${text}` });
      const next = runDraft(W, D, true);
      focusNext = { id: "clock" };
      announce(`Done. ${text} ${next ? `Next: ${pickText(next)}.` : "The draft is done."}`);
      return true;
    }
    // With a GM: a move at a position before the deadline
    case "gmmove": {
      if (J.ctl || !POS_INFO[ds.v]) return true;
      const R = myReq();
      R.move = R.move === ds.v ? null : ds.v;
      announce(R.move ? `You asked for a move at ${posName(R.move)}. He'll look before the deadline.` : "Request dropped.");
      return true;
    }
  }
  return false;
}
