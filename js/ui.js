// Friday to Sunday: the app, its screens outside a game, and screen reader support
"use strict";
const SAVE_KEY = "friday-to-sunday-v1";
// Version of the game code. Raise it by 1 with every release (GitHub Pages and itch.io together).
// Saves record it, so older saves can be upgraded when they load.
const BUILD = 1;

/* ---------- The app ---------- */
// APP holds everything outside the game itself:
//   screen: "home", "roster", "player" or "game"
//   ex: the exhibition matchup { seed, schools: [home, away], you: 0, 1 or "watch", styles: { off, def } }
//   view: what the roster screens show { team, player, back }
// S (engine.js) is the game being played.
let APP = null;
function newExhibition() {
  const seed = newSeed(), g = dice(seed), towns = new Set(), colors = new Set(), mascots = g.shuffle(MASCOTS);
  const h = genSchool(g, { id: "h", cls: "1A", mascot: mascots[0], towns, colorsTaken: colors });
  const v = genSchool(g, { id: "v", cls: "1A", mascot: mascots[1], towns, colorsTaken: colors, otherAbbr: h.abbr });
  APP.ex = { seed, schools: [h, v], you: 0, styles: { off: h.off, def: h.def } };
}
function startExhibition() {
  const ex = APP.ex, you = ex.you;
  initGame({ level: "hs", cpu: [you !== 0, you !== 1], styles: [you === 0 ? ex.styles : null, you === 1 ? ex.styles : null] }, ex.schools);
  APP.screen = "game";
}
// The team a roster screen shows: during a game, the game's own copy
const rosterTeam = i => APP.view && APP.view.back === "game" && S && S.teams ? S.teams[i] : APP.ex.schools[i];
const teamTown = tm => tm.town || tm.school;
const teamMascot = tm => tm.mascot || tm.name;

/* ---------- Saving ---------- */
// The whole app saves on the device after every tap, game and all
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, build: BUILD, app: APP, game: S })); } catch (e) {} }
function loadSaved() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); return s && s.v === 1 && s.app && s.app.ex ? s : null; } catch (e) { return null; }
}

/* ---------- Home ---------- */
function styleCfgHtml(isOff) {
  const ids = isOff ? OFF_STYLE_IDS : DEF_STYLE_IDS, book = isOff ? OFF_STYLES : DEF_STYLES, cur = APP.ex.styles[isOff ? "off" : "def"] || "bal";
  const a = isOff ? "ostyle" : "dstyle", lbl = isOff ? "Offensive style" : "Defensive style";
  return `<div style="display:grid;gap:6px" role="group" aria-label="${lbl}"><span class="eyebrow" aria-hidden="true">${lbl}</span><div class="seg grid2">
      ${ids.map(id => `<button data-a="${a}" data-v="${id}" aria-pressed="${cur === id}">${book[id].short}</button>`).join("")}
    </div><p class="muted styledesc">${esc(book[cur].desc)}</p></div>`;
}
// One sentence about a school
function schoolLine(s) {
  const two = twoWayStarters(s).length;
  return `Coach ${coachName(s.coach)}. ${OFF_STYLES[s.off].name} offense, ${DEF_STYLES[s.def].name} defense. ${plural(s.players.length, "player")}, ${two} of them starting on both sides of the ball.`;
}
function matchupTable(a, b) {
  const ua = unitRatings(a), ub = unitRatings(b);
  const rows = [["Quarterback", "qb"], ["Running back", "rb"], ["Receivers", "wr"], ["Run blocking", "runBlock"], ["Pass protection", "passPro"],
    ["Run defense", "runD"], ["Pass rush", "passRush"], ["Coverage", "cover"], ["Kicker", "k"], ["Punter", "p"]];
  return `<div class="tablewrap flush"><table aria-label="Matchup by unit">
    <thead><tr><td></td><th scope="col">${esc(a.abbr)}</th><th scope="col">${esc(b.abbr)}</th></tr></thead>
    <tbody>${rows.map(([l, k]) => `<tr><th scope="row">${l}</th><td>${ua[k]}</td><td>${ub[k]}</td></tr>`).join("")}</tbody></table></div>`;
}
function vHome() {
  const ex = APP.ex, [h, v] = ex.schools, inGame = S && S.teams && S.phase !== "final";
  const card = (s, i) => `<section class="panel teamcard" style="--team:${s.color}" aria-label="${esc(teamTown(s))} ${esc(s.mascot)}">
      <p class="eyebrow">${i ? "Visitors" : "Home"} · Class ${s.cls}</p>
      <h3>${esc(s.town)} ${esc(s.mascot)}</h3>
      <p class="muted">${esc(schoolLine(s))}</p>
      <button class="btn ghost" data-a="roster" data-t="${i}">Roster and depth chart</button>
    </section>`;
  const youBtn = (val, label) => `<button data-a="you" data-v="${val}" aria-pressed="${String(ex.you) === String(val)}">${label}</button>`;
  return `
    <div class="masthead">
      <p class="eyebrow">High school football</p>
      <h1>Friday to <em>Sunday</em></h1>
      <p class="muted">Coach a small-town team. Call every play.</p>
    </div>
    ${inGame ? `<section class="panel"><p>A game is in progress: ${esc(boardSummary())}</p><button class="btn" data-a="resume">Back to the game</button></section>` : ""}
    <section class="panel">
      <div style="display:grid;gap:4px"><span class="eyebrow">Exhibition game</span>
      <h2 class="h2small">${esc(v.town)} at ${esc(h.town)}</h2>
      <p class="muted">Two small schools, class 1A, under high school rules. Every player is rated, and the ratings decide how well each call works.</p></div>
    </section>
    ${card(h, 0)}${card(v, 1)}
    <section class="panel">
      <span class="eyebrow">Matchup</span>
      ${matchupTable(h, v)}
    </section>
    <section class="panel">
      <div style="display:grid;gap:6px" role="group" aria-label="You coach"><span class="eyebrow" aria-hidden="true">You coach</span><div class="seg">
        ${youBtn(0, esc(h.mascot))}${youBtn(1, esc(v.mascot))}${youBtn("watch", "Just watch")}
      </div></div>
      ${ex.you === "watch" ? `<p class="muted styledesc">Both teams are coached by the computer. Tap through the plays, or sim to the end.</p>` : styleCfgHtml(true) + styleCfgHtml(false)}
      <button class="btn" data-a="kickoff">${inGame ? "Start a new game" : "Kick off"}</button>
      <button class="btn ghost" data-a="newmatch">New matchup</button>
    </section>`;
}

/* ---------- Rosters ---------- */
// "Starter. Marcus Hill, junior, linebacker 39. Also starts at running back. Sure tackler."
// A backup: "Damian Blackwell, senior, linebacker 37. Also running back 40."
function slotLine(team, p, pos, starter, level) {
  const roles = depthRoles(team, p), elsewhere = roles.starts.filter(x => x !== pos && OFF_POS.concat(DEF_POS).includes(x));
  const also = elsewhere.length ? `Also starts at ${andList(elsewhere.map(slotName))}.`
    : (() => { const x = [p.pos, p.pos2].filter(q => q && q !== pos && POS_INFO[q]).map(q => `${posName(q)} ${ovr(p, q)}`); return x.length ? `Also ${x.join(" and ")}.` : ""; })();
  const st = strengths(p, level).map(a => ATTR_PRAISE[a]);
  return `${starter ? "Starter. " : ""}${fullName(p)}, ${YEAR_NAMES[p.yr]}, ${slotName(pos)} ${slotRating(p, pos)}.${also ? " " + also : ""}${st.length ? ` ${capFirst(st.join(", "))}.` : ""}`;
}
// "Starts at quarterback and linebacker. Backs up at tight end."
function rolesLine(team, p) {
  const r = depthRoles(team, p), out = [];
  if (r.starts.length) out.push(`Starts at ${andList(r.starts.map(slotName))}.`);
  if (r.backs.length) out.push(`Backs up at ${andList(r.backs.map(slotName))}.`);
  return out.length ? out.join(" ") : "Not on the depth chart.";
}
function vRoster() {
  const i = APP.view.team, tm = rosterTeam(i), level = tm.level, other = rosterTeam(1 - i);
  const sec = ([title, slots]) => `<section class="panel"><h3>${title}</h3>${slots.map(pos => {
    const ids = (tm.depth[pos] || []).slice(0, DEPTH_SIZE[pos]);
    return `<p class="sechead" role="heading" aria-level="4">${slotGroup(pos)}</p><ol class="roster">${ids.map((id, k) => {
      const p = playerById(tm, id); if (!p) return "";
      return `<li><button class="rowbtn" data-a="player" data-v="${p.id}">${esc(slotLine(tm, p, pos, k < STARTERS[pos], level))}</button></li>`;
    }).join("")}</ol>`;
  }).join("")}</section>`;
  return `
    <div class="masthead" style="--team:${tm.color}">
      <p class="eyebrow">Roster and depth chart</p>
      <h2 data-focus tabindex="-1">${esc(teamTown(tm))} ${esc(teamMascot(tm))}</h2>
      <p class="muted">${plural(tm.players.length, "player")}. The depth chart is set from the ratings: starters first, then the backups in order. Tap a player for all of his ratings.</p>
    </div>
    <div class="choices"><button class="btn ghost" data-a="back">Back</button><button class="btn ghost" data-a="rteam" data-t="${1 - i}">${esc(teamMascot(other))} roster</button></div>
    ${DEPTH_GROUPS.map(sec).join("")}
    <button class="btn ghost" data-a="back">Back</button>`;
}
const ATTR_GROUPS = [["Athletic", ["spd", "str", "awr"]], ["Passing", ["acc", "arm"]], ["Running", ["elu", "bsc"]], ["Receiving", ["hnd", "rte"]],
  ["Blocking", ["blk", "rbk", "pbk"]], ["Defense", ["prs", "rst", "tkl", "cov"]], ["Kicking", ["leg", "kac"]]];
function vPlayer() {
  const tm = rosterTeam(APP.view.team), p = playerById(tm, APP.view.player);
  if (!p) return vRoster();
  const fits = POS_IDS.map(pos => [pos, ovr(p, pos)]).sort((a, b) => b[1] - a[1]);
  const shown = [p.pos, p.pos2].filter(Boolean);
  const others = fits.filter(([pos]) => !shown.includes(pos)).slice(0, 3);
  const st = S && S.ps && APP.view.back === "game" ? S.ps[p.id] : null;
  return `
    <div class="masthead" style="--team:${tm.color}">
      <p class="eyebrow">${esc(teamTown(tm))} ${esc(teamMascot(tm))} · Number ${p.num}</p>
      <h2 data-focus tabindex="-1">${esc(fullName(p))}</h2>
      <p class="muted">${capFirst(YEAR_NAMES[p.yr])}. ${esc(rolesLine(tm, p))}</p>
    </div>
    <section class="panel">
      <h3>Overall</h3>
      <ul class="hlist">${shown.map(pos => `<li>${capFirst(posName(pos))} ${ovr(p, pos)}</li>`).join("")}
        <li>Next best fits: ${others.map(([pos, v]) => `${posName(pos)} ${v}`).join(", ")}</li></ul>
      <p>${capFirst(POT_BANDS[p.potSeen])} potential, by the staff's estimate. Work ethic ${p.eth}, stamina ${p.sta}, health ${p.hlt}.</p>
    </section>
    ${st ? `<section class="panel"><h3>This game</h3>${playerGameLine(st)}</section>` : ""}
    <section class="panel">
      <h3>Ratings</h3>
      ${ATTR_GROUPS.map(([g, list]) => `<p class="sechead" role="heading" aria-level="4">${g}</p><ul class="hlist ratings">${list.map(a => `<li>${ATTR_NAMES[a]} ${p.r[a]}</li>`).join("")}</ul>`).join("")}
    </section>
    <button class="btn ghost" data-a="back">Back to the roster</button>`;
}
function playerGameLine(s) {
  const bits = [];
  if (s.pa) bits.push(`${s.pc || 0} of ${s.pa} passing for ${yd(s.py || 0)}`);
  if (s.ru) bits.push(`${plural(s.ru, "carry", "carries")} for ${yd(s.ry || 0)}`);
  if (s.rec) bits.push(`${plural(s.rec, "catch", "catches")} for ${yd(s.rcy || 0)}`);
  if (s.tk) bits.push(plural(s.tk, "tackle"));
  if (s.sck) bits.push(plural(s.sck, "sack"));
  if (s.int) bits.push(plural(s.int, "interception"));
  if (s.fga || s.xpa) bits.push(`${s.fgm || 0} of ${s.fga || 0} field goals, ${s.xpm || 0} of ${s.xpa || 0} extra points`);
  if (s.pu) bits.push(`${plural(s.pu, "punt")}`);
  return `<p>${bits.length ? capFirst(bits.join(", ")) + "." : "No stats yet."}</p>`;
}

/* ---------- How to play ---------- */
let helpOpen = false;
function vHelp() {
  const sec = (h, body) => `<section class="panel help"><h2>${h}</h2>${body}</section>`;
  const ul = items => `<ul class="hlist">${items.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const Rl = RULES.hs;
  return `
    <div class="masthead">
      <p class="eyebrow">Friday to Sunday</p>
      <h1>How to <em>play</em></h1>
      <p class="muted">You're the head coach. Each snap, both sides call a play in secret, then the play runs. Your calls and your players decide it.</p>
    </div>
    ${sec("A snap, step by step", `<ol class="steps">
        <li>The offense picks its personnel (who's on the field) and a play, then locks it in.</li>
        <li>The defense sees the offense's personnel, but not the play. It picks a package and a call, and decides whether to show its real look or disguise it.</li>
        <li>The offense sees the defense's look at the line and can audible to a different play once.</li>
        <li>The play runs. The result names the players, and says who won the snap and why.</li>
      </ol>`)}
    ${sec("Your players", ul([
      "Every player is rated from 1 to 100 in speed, strength, awareness and the skills for each position. Each one has an overall rating at every position.",
      "Small-school starters mostly rate in the 30s to 50s. At a school this size most starters play both ways.",
      "The depth chart decides who's on the field for each personnel package. Spread sets put your fourth receiver out there; heavy sets bring in tight ends and a fullback.",
      "On every snap the players matter: the line against the front on runs, the protection against the rush, the passer and receiver against the coverage, the ball carrier against the tacklers.",
      "A quick quarterback slips some sacks and takes off when nobody's open. Kickers have a range set by their leg."
    ]))}
    ${sec("Winning the call", ul([
      "Every play has calls it beats and calls that beat it. Inside Run gashes Cover 2 but runs into a Run Blitz; Deep Shot burns Man Coverage but dies against Prevent.",
      "Personnel matters too. Heavy sets run better, spread sets throw better, and each package matches up differently against Base, Nickel, Dime and Goal Line.",
      "A good call makes a good result more likely, never certain. Better players tilt every snap, and a good call can still beat a better team."
    ]))}
    ${sec("Audibles, disguises and styles", ul([
      "At the line, the offense sees a look like \"Eight in the box\" or \"Two high safeties,\" each with a hint about which call it usually means. Defenses can disguise it, at the cost of a step at the snap.",
      "Each team has an offensive style (Balanced, Air Raid, Ground &amp; Pound, West Coast) and a defensive style (Balanced, Blitz-Happy, No-Fly Zone, Run Stuffers) that make some calls stronger and others weaker.",
      "Every coach has ratings too. The other team's coach scouts your habits as the game goes on."
    ]))}
    ${sec("High school rules", ul([
      `${Rl.qLen / 60}-minute quarters and three timeouts each half. There's no two-minute warning.`,
      "The clock stops for an incomplete pass, a player going out of bounds, a change of possession, a score and a timeout, and starts again on the snap.",
      "It also stops for a first down and after a penalty, and starts again when the ball is ready for play, so a little less time comes off.",
      `Kickoffs are from the ${Rl.kickoff.spot}. Any kick that reaches the end zone is a touchback at the ${Rl.kickoff.tb}, and nobody returns it.`,
      "A missed field goal is treated like a punt: into the end zone it's a touchback at the 20.",
      `Tries are from the ${100 - Rl.tryTwo}-yard line, so an extra point is a ${xpDistFor(Rl)}-yard kick. Plenty of small schools go for two.`,
      "Pass interference is 15 yards and doesn't give an automatic first down. Only roughing the passer or kicker does.",
      `A lead of ${Rl.runClock.margin} or more in the second half starts a running clock that keeps going for the rest of the game.`
    ]))}
    ${sec("Overtime", ul([
      "There's no clock. Each team gets a series starting first and goal at the 10, and the defense can't score: a turnover just ends the series.",
      "A field goal can be kicked on any down. After both series, the team ahead wins. If it's still tied, there's another period, and the first choice goes to the other team.",
      "Each team gets one timeout per period, and nobody has to go for two."
    ]))}
    ${sec("Clock and situations", ul([
      "Late in a half: use timeouts, or go no huddle (faster snaps, but nobody can change personnel).",
      "In the last two minutes of each half you can also spike the ball, or run a play to the sideline to stop the clock.",
      "Fourth down: send out the punt team or field goal unit, or keep the offense on the field and go for it. The defense sees who runs on, and kicking units can run a fake.",
      "Leading late with the other team out of timeouts, you can kneel to run out the clock.",
      "After your team scores, you can call an onside kick before the kickoff. High school teams don't have to announce one, so a surprise works a lot more often. Trailing in the last two minutes, you're asked every time."
    ]))}
    ${sec("Tips", ul([
      "Check the matchup table before kickoff. Attack the other team's weakest unit.",
      "Read the halftime report. It shows each side's habits by down and distance and what beats them.",
      "Open the box score, player stats and play-by-play at the bottom of any game screen. Sim to the end finishes the game with your coach calling the plays.",
      "With VoiceOver, each new screen starts at its heading or the play result. Swipe right to hear the rest."
    ]))}
    <button class="btn" data-a="help">${APP && APP.screen === "game" ? "Back to the game" : "Back"}</button>
    <p class="muted" style="font-size:14px;text-align:center">Friday to Sunday, version ${BUILD}</p>`;
}
// The extra point distance for a level's rules (from its two-point spot)
const xpDistFor = Rl => 100 - Rl.tryXp + Rl.fgAdd;

/* ---------- Drawing the screen ---------- */
const GAME_VIEWS = { call: vCall, result: vResult, pat: vPAT, trychoice: vTry, penalty: vPenalty, final: vFinal, halftime: vHalftime, los: vLOS, kickchoice: vKick, toss: vToss };
function currentView() {
  if (helpOpen) return vHelp;
  if (APP.screen === "game" && S && S.teams) return GAME_VIEWS[S.phase] || vHome;
  return { home: vHome, roster: vRoster, player: vPlayer }[APP.screen] || vHome;
}
function render() {
  if (typeof document === "undefined") return;
  const app = document.getElementById("app");
  const view = currentView();
  const on = !Sound.muted();
  const icon = on
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  const homeBtn = APP.screen === "game" && !helpOpen ? `<button class="soundbtn" data-a="gohome">Home</button>` : "";
  const top = `<div class="topbar">${homeBtn}<button class="soundbtn" data-a="help" aria-expanded="${helpOpen}">${helpOpen ? "Close How to play" : "How to play"}</button><button class="soundbtn" data-a="mute" aria-pressed="${on}">${icon}Sound ${on ? "on" : "off"}</button></div>`;
  const key = screenKey(view), prev = focusSig(app);
  app.innerHTML = top + view() + (APP.screen === "game" && !helpOpen ? vExtras() : "");
  placeFocus(app, key, prev);
}

/* ---------- Screen reader support ---------- */
// Every tap redraws the screen. A redraw that stays on the same screen (picking a play, toggling a
// setting) puts focus back on the same control. A redraw that lands on a new screen moves focus to
// that screen's heading or main block, so VoiceOver starts reading the new screen from the top.
let lastKey = null, srTimer = null;
function screenKey(view) {
  const g = APP.screen === "game" && S ? [S.phase, S.side, S.playId || 0, S.toss ? S.toss.step : "", S.pen ? S.pen.code : "", S.twoPt ? 1 : 0, S.locked ? 1 : 0] : [];
  return [view.name, APP.screen, APP.view ? APP.view.team : "", APP.view ? APP.view.player : "", APP.ex ? APP.ex.seed : ""].concat(g).join("|");
}
function focusSig(app) {
  const el = document.activeElement;
  if (!el || el === document.body || !app.contains(el)) return null;
  if (el.id) return { id: el.id };
  const b = el.closest("[data-a]");
  return b ? { a: b.dataset.a, v: b.dataset.v, t: b.dataset.t, c: b.dataset.c } : null;
}
function placeFocus(app, key, prev) {
  const changed = lastKey !== null && key !== lastKey;
  lastKey = key;
  let el = null;
  if (!changed) {
    if (!prev) return;
    if (prev.id) el = document.getElementById(prev.id);
    else el = [...app.querySelectorAll("[data-a]")].find(b => b.dataset.a === prev.a && b.dataset.v === prev.v && b.dataset.t === prev.t && b.dataset.c === prev.c);
    if (!el || el.disabled) el = app.querySelector("[data-focus]");
  } else {
    el = app.querySelector("[data-focus]") || app.querySelector("h1, h2");
    if (el && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  }
  if (el) try { el.focus({ preventScroll: true }); } catch (e) {}
}
// Speak a short message without moving focus (a timeout, a toggle)
function announce(text) {
  if (typeof document === "undefined" || !text) return;
  const sr = document.getElementById("sr"); if (!sr) return;
  sr.textContent = "";
  clearTimeout(srTimer);
  srTimer = setTimeout(() => { sr.textContent = text; }, 80);
}
const scrollTop = () => { if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0); };

/* ---------- Simming ---------- */
// One step of a game in which the computer makes every decision
function autoStep() {
  switch (S.phase) {
    case "call": if (S.side === "off") startPlay(); else defStep(); break;
    case "los": cpuAudible(); resolve(); break;
    case "pat": doPAT(cpuPAT()); break;
    case "trychoice": { const c = S.tryChoice; S.tryChoice = null; S.patTeam = c.team; if (cpuTry(c) === "two") startTwo(c.spot); else doPAT("kick", xpDist(c.spot)); break; }
    case "kickchoice": doKickChoice(cpuWantsOnside(S.kickChoice.team) ? "onside" : "deep"); break;
    case "penalty": { const P = S.pen; if (P.two) chooseTwoPenalty(penOf(P.code).on === "off" ? P.good : !P.good); else choosePenalty(stateValue(P.acc, P.chooser) > stateValue(P.post, P.chooser)); break; }
    case "toss": tossNext(); break;
    case "halftime": startPlay(); break;
    default: cont();
  }
}
// Sim to the end: every remaining decision goes to the computer, using each team's own coach
function simToEnd() {
  if (!S || S.phase === "final") return;
  const keep = [S.teams[0].cpu, S.teams[1].cpu];
  S.teams[0].cpu = S.teams[1].cpu = true;
  S.halftimeShow = false;
  for (let i = 0; i < 5000 && S.phase !== "final"; i++) autoStep();
  S.teams[0].cpu = keep[0]; S.teams[1].cpu = keep[1];
  S.simmed = true;
}

/* ---------- Events ---------- */
function preSnap(a) {
  const pre = S && S.teams ? { teams: true, snap: S.snap, quarter: S.quarter, phase: S.phase, scores: [S.teams[0].score, S.teams[1].score], lastId: S.last && S.last.id } : { phase: S && S.phase };
  if (a === "pen" && S && S.pen && S.pen.pre) pre.scores = S.pen.pre.scores.slice();
  return pre;
}
let confirmTimer = null;
// Some buttons need a second tap within a few seconds: S.confirmEnd, S.confirmSim
function confirmTap(flag) {
  if (S[flag]) return true;
  S.confirmEnd = false; S.confirmSim = false; S[flag] = true;
  clearTimeout(confirmTimer);
  confirmTimer = setTimeout(() => { if (S && S[flag]) { S[flag] = false; render(); } }, 3500);
  return false;
}
function act(a, ds) {
  ds = ds || {};
  const pre = preSnap(a);
  if (a === "mute") { Sound.toggle(); render(); return; }
  // The help screen sits on top of whatever is going on; it never touches the game itself
  if (a === "help") { helpOpen = !helpOpen; render(); scrollTop(); return; }
  const inGame = APP.screen === "game" && S && S.teams;
  switch (a) {
    // Home and roster screens
    case "you": { const ex = APP.ex; ex.you = ds.v === "watch" ? "watch" : +ds.v; if (ex.you !== "watch") ex.styles = { off: ex.schools[ex.you].off, def: ex.schools[ex.you].def }; break; }
    case "ostyle": case "dstyle": { const ids = a === "ostyle" ? OFF_STYLE_IDS : DEF_STYLE_IDS; if (ids.includes(ds.v)) APP.ex.styles[a === "ostyle" ? "off" : "def"] = ds.v; break; }
    case "newmatch": newExhibition(); S = null; APP.screen = "home"; scrollTop(); break;
    case "kickoff": startExhibition(); scrollTop(); break;
    case "resume": if (S && S.teams) APP.screen = "game"; scrollTop(); break;
    case "gohome": APP.screen = "home"; scrollTop(); break;
    case "roster": APP.view = { team: +ds.t || 0, back: APP.screen === "game" ? "game" : "home" }; APP.screen = "roster"; scrollTop(); break;
    case "rteam": APP.view.team = +ds.t || 0; scrollTop(); break;
    case "player": APP.view.player = ds.v; APP.screen = "player"; scrollTop(); break;
    case "back": APP.screen = APP.screen === "player" ? "roster" : (APP.view && APP.view.back === "game" && S && S.teams ? "game" : "home"); scrollTop(); break;
    // The game
    case "audpick": if (inGame && S.phase === "los") S.audSel = S.audSel === ds.v ? null : ds.v; break;
    case "audible": if (inGame && S.phase === "los") { audible(S.audSel); scrollTop(); } break;
    case "snap": if (inGame && S.phase === "los") { audible(null); scrollTop(); } break;
    case "pick": if (inGame && S.phase === "call") S.sel = ds.v; break;
    case "disg": if (inGame && S.phase === "call" && S.side === "def") S.disgOn = ds.v === "1"; break;
    case "dlook": if (inGame && S.phase === "call" && S.side === "def" && LOOKS[ds.v]) S.disgSel = S.disgSel === ds.v ? null : ds.v; break;
    case "side": if (inGame && S.phase === "call" && S.side === "off" && sideOn(S.sel)) S.selSide = !S.selSide; break;
    case "pkg": {
      if (!inGame || S.phase !== "call") break;
      const isOff = S.side === "off";
      if (!pkgChoices(isOff).includes(ds.v)) break;
      S.pkgSel = ds.v;
      if (isOff && S.sel && !offCallsFor(ds.v).includes(S.sel)) { S.sel = null; S.selSide = false; }
      break;
    }
    case "lock": if (inGame && S.phase === "call") { lock(); scrollTop(); } break;
    case "cont": if (inGame && S.phase === "result") { cont(); scrollTop(); } break;
    case "pat": if (inGame && S.phase === "pat") { doPAT(ds.v); scrollTop(); } break;
    case "kick": if (inGame && S.phase === "kickchoice") { doKickChoice(ds.v); scrollTop(); } break;
    case "onside": {
      const c = inGame && S.kickChoice;
      if (c && S.phase === "result" && c.later && !S.teams[c.team].cpu) { c.onside = !c.onside; announce(c.onside ? "Onside kick called." : "Onside kick called off. Kicking deep."); }
      break;
    }
    case "toss": if (inGame && S.phase === "toss" && S.toss) { if (S.toss.step === "call") tossCall(ds.v); else tossChoose(ds.v); tossNext(); scrollTop(); } break;
    case "try": { const c = inGame && S.tryChoice; if (!c || S.phase !== "trychoice") break; S.tryChoice = null; S.patTeam = c.team; if (ds.v === "two") startTwo(c.spot); else doPAT("kick", xpDist(c.spot)); scrollTop(); break; }
    case "pen": if (inGame && S.phase === "penalty") { choosePenalty(ds.v === "1"); scrollTop(); } break;
    case "half": if (inGame && S.phase === "halftime") { S.hready = null; startPlay(); scrollTop(); } break;
    case "to": if (inGame && callTimeout(+ds.t)) announce(S.toNote); break;
    case "spike": if (inGame && (S.spikeNext || spikeOK())) { S.spikeNext = !S.spikeNext; if (S.spikeNext) S.noHuddle = false; announce(S.spikeNext ? "Spike set for the next snap." : "Spike cancelled."); } break;
    case "nohuddle": if (inGame && nhAvailable()) { S.noHuddle = !S.noHuddle; if (S.noHuddle) S.spikeNext = false; announce(S.noHuddle ? "Going no huddle." : "No huddle cancelled."); } break;
    case "sim": if (inGame && confirmTap("confirmSim")) { simToEnd(); scrollTop(); } break;
    case "end": if (inGame && confirmTap("confirmEnd")) { S = null; APP.screen = "home"; scrollTop(); } break;
    case "rematch": startExhibition(); scrollTop(); break;
    default: return;
  }
  // Any other tap calls off a pending "tap again"
  if (S && a !== "end" && a !== "sim") { S.confirmEnd = false; S.confirmSim = false; }
  save();
  render();
  if (S && APP.screen === "game") Sound.play(cuesFor(a, pre));
}

function start() {
  const saved = loadSaved();
  if (saved) { APP = saved.app; S = saved.game && saved.game.teams ? saved.game : null; }
  if (!APP || !APP.ex) { APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); }
  if (APP.screen !== "home" && APP.screen !== "roster" && APP.screen !== "player" && !(S && S.teams)) APP.screen = "home";
  if ((APP.screen === "roster" || APP.screen === "player") && !APP.view) APP.screen = "home";
  render();
}

if (typeof document !== "undefined") {
  document.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (b && !b.disabled) act(b.dataset.a, b.dataset); });
  start();
} else {
  // Headless test hook (tests/ load the scripts into Node)
  globalThis.__fts = { act, start, autoStep, simToEnd, initGame, cont, startPlay, newExhibition, startExhibition,
    get S() { return S; }, set S(v) { S = v; }, get APP() { return APP; }, set APP(v) { APP = v; } };
}
