// Friday to Sunday: the game plan screen (Milestone 8), its line on the week screen, and the halftime swaps
"use strict";

// This week's film study, as far as the plan goes: how many featured plays count, and whether leans do
function planStatus() {
  const P = SEASON.practice, gm = myGameIn(SEASON.week), done = practiced() && P && !P.camp && gm && P.opp === opponentIn(gm, SEASON.myId);
  if (!done) return { known: false, text: "This week's film study sets how many featured plays count: 2 a side with a light report, 3 with a full one, 4 with a heavy one, which also brings the situation leans." };
  const lv = P.prep || 0, n = GP_N[lv];
  return { known: true, n, lean: lv >= GP_LEAN_AT, text: !n ? "No film study this week, so the plan doesn't count in this game. Give opponent prep some time next week." : `This week's film study: ${PREP_TEXT[lv]}. ${n} featured plays a side count, the ones you picked first${lv >= GP_LEAN_AT ? ", and so do your situation leans" : ". Situation leans need a heavy week of film"}.` };
}
// One line for the week screen
function planLine() {
  const p = myPlan(), role = coordRole(), st = planStatus();
  const sides = (role === "dc" ? [] : [`on offense ${andList(p.off.map(playName)) || "nothing"}`]).concat(role === "oc" ? [] : [`on defense ${andList(p.def.map(playName)) || "nothing"}`]);
  return `Game plan: ${sides.join("; ")}.${st.known ? ` ${st.n ? `${st.n} a side count this week.` : "It doesn't count this week: no film study."}` : ""}`;
}
function vGamePlan() {
  const s = mySchool(), p = myPlan(), role = coordRole(), lvl = schoolLvl(s), st = planStatus(), P = SEASON.practice;
  const film = st.known && P.film ? P.film : null, gm = myGameIn(SEASON.week), opp = gm ? seasonSchool(opponentIn(gm, s.id)) : null;
  const m = s.mastery || {};
  // What each play beats among their favorite calls (from the film, when there is one)
  const favs = side => film ? (side === "off" ? film.defAll : film.offAll).slice(0, 3).map(([id]) => id) : [];
  const beats = (id, side) => favs(side).filter(f => side === "off" ? M[id][f] >= 1 : M[f][id] <= -1);
  const sec = side => {
    const on = p[side], ids = planIds(s, side, lvl), word = side === "off" ? "plays" : "calls";
    const row = id => {
      const v = Math.round(m[id] || 0), i = on.indexOf(id), b = beats(id, side);
      const counts = st.known && i >= 0 && i >= st.n ? " Doesn't count this week." : "";
      return `<li><button class="rowbtn" data-a="gpick" data-s="${side}" data-v="${id}" aria-pressed="${i >= 0}">${esc(`${playName(id)}, ${masteryWord(v)} ${v}${i >= 0 ? `. Featured, ${ordWord(i)}` : ""}${b.length ? `. Beats their ${andList(b.map(playName))}` : ""}.${counts}`)}</button></li>`;
    };
    const leans = st.known && !st.lean ? "" : `<p class="sechead">Situation leans</p>${GP_BUCKETS.map(([b, nm]) => `<div role="group" aria-label="${nm}"><span class="eyebrow" aria-hidden="true">${nm}</span><div class="seg">
        ${GP_LEANS[side].map(([k, l]) => `<button data-a="glean" data-s="${side}" data-b="${b}" data-v="${k}" aria-pressed="${p.lean[side][b] === k}">${l}</button>`).join("")}</div></div>`).join("")}`;
    const exp = expectLines(side);
    return `<section class="panel"><h3>${side === "off" ? "Offense" : "Defense"}</h3>
      <p>${esc(on.length ? `Featured ${word}: ${andList(on.map(playName))}.` : `No featured ${word}.`)}</p>
      <ul class="roster">${ids.map(row).join("")}</ul>
      ${leans}
      <p class="sechead">What they expect from you</p>${exp.length ? `<ul class="hlist">${exp.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted">No film of your ${side === "off" ? "offense" : "defense"} yet.</p>`}
    </section>`;
  };
  const sides = role === "oc" ? ["off"] : role === "dc" ? ["def"] : ["off", "def"];
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(weekName(SEASON.week))} · Game plan${opp ? ` · ${esc(opp.mascot)}` : ""}</p>
      <h2 data-focus tabindex="-1">Game plan</h2>
      <p class="muted">${esc(`Feature up to ${GP_MAX} ${role === "dc" ? "calls" : "plays"} a side for this opponent. A featured play is a little sharper when you call it, unless it's still new, and your staff calls them more in a sim. Unless you pick your own install focus, the featured plays still being learned get it. The plan stays the same week to week until you change it.`)}</p>
      <p>${esc(st.text)}</p>
      ${film ? "" : `<p class="muted">Hold practice for the scouting report, and each play will say which of their favorite calls it beats.</p>`}
    </div>
    ${sides.map(sec).join("")}
    <button class="btn" data-a="back">Back</button>`;
}
// Halftime: swap featured plays, two at most
function halfPlanPanel() {
  const t = [0, 1].find(i => !S.teams[i].cpu && S.teams[i].gp);
  if (t == null) return "";
  const p = S.teams[t].gp, left = GP_SWAPS - (p.swaps || 0), sides = ["off", "def"].filter(sd => (sd === "off" ? youCallOff(t) : youCallDef(t)) && p.n);
  if (!sides.length) return "";
  const sec = sd => {
    const on = p[sd] || [], open = left > 0 && on.length < p.n, book = sd === "off" ? offBook(t) : defBook(t);
    const btn = id => { const v = Math.round(masteryOf(t, id)); return `<li><button class="rowbtn" data-a="gpswap" data-s="${sd}" data-v="${id}" aria-pressed="${on.includes(id)}">${esc(`${playName(id)}, ${masteryWord(v)} ${v}${on.includes(id) ? ". Featured" : ""}`)}</button></li>`; };
    return `<p class="sechead">${sd === "off" ? "Offense" : "Defense"}</p><ul class="roster">${on.map(btn).join("")}${open ? book.filter(id => !on.includes(id)).map(btn).join("") : ""}</ul>`;
  };
  return `<section class="panel"><h3>Your game plan</h3>
    <p class="muted">${esc(`Tap a featured play to take it off. With a spot open, tap another to feature it: ${left ? `${plural(left, "swap")} left` : "no swaps left"}.`)}</p>
    ${sides.map(sec).join("")}</section>`;
}
