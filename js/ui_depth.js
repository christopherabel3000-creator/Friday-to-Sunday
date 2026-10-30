// Friday to Sunday: rosters, the depth chart, and lineup changes during a game
"use strict";

/* ---------- Which depth chart ---------- */
// A roster screen shows one team, from one of three places (APP.view.ctx):
//   "game": a team in the game being played (APP.view.team is 0 or 1), with the game's own copy of
//     the depth chart (changes last for this game only) and everyone's energy
//   "ex": a school in the exhibition matchup (0 or 1)
//   "season": a school in the season (its id)
// Outside a game, your school's depth chart applies to every game, or there's one for the next game
// only. The exhibition and the season each keep their own (depthHome).
const viewCtx = () => (APP.view && APP.view.ctx) || "ex";
const inGameView = () => viewCtx() === "game" && !!(S && S.teams);
const depthHome = () => viewCtx() === "season" ? SEASON : APP.ex;
// The team you coach in the game being played (0 or 1), or -1 when you're just watching
const myGameTeam = () => S && S.teams ? S.teams.findIndex(t => !t.cpu) : -1;
function isMine(ref) {
  const c = viewCtx();
  if (c === "game") return ref === myGameTeam();
  if (c === "season") return !!SEASON && ref === SEASON.myId;
  return ref === APP.ex.you;
}
// The school a roster screen names, outside a game
const baseSchool = ref => viewCtx() === "season" ? seasonSchool(ref) : APP.ex.schools[ref];
// The team a roster screen shows, with the depth chart that applies
function depthTeam(ref) {
  if (inGameView()) return S.teams[ref];
  const s = baseSchool(ref), h = depthHome();
  if (isMine(ref) && h.depthMode === "next") return Object.assign({}, s, { depth: pendingNext(ref) ? h.nextDepth.depth : s.depth });
  return s;
}
const canEdit = ref => isMine(ref) && (!inGameView() || !S.teams[ref].cpu);
// Stores an edited depth chart where it belongs
function setDepth(ref, depth) {
  if (inGameView()) { S.teams[ref].depth = depth; S.teams[ref].dver = (S.teams[ref].dver || 0) + 1; return; }
  const h = depthHome();
  if (h.depthMode === "next") h.nextDepth = { team: ref, depth };
  else { const s = baseSchool(ref); s.depth = depth; s.manual = true; }
}
// Whether your next kickoff has its own depth chart
const pendingNext = ref => { const h = depthHome(); return !!(h.nextDepth && h.nextDepth.team === ref); };
// How long a position's list can get
const depthMax = pos => DEPTH_SIZE[pos] + 3;
const ORD_WORDS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
const ordWord = k => ORD_WORDS[k] || `number ${k + 1}`;
// Moves a player on one position's list. how: "start", "up", "down", "off" or "add". Returns the
// sentence to announce.
function depthMove(i, pos, pid, how) {
  const tm = depthTeam(i), depth = clone(tm.depth), list = (depth[pos] || []).slice(), p = playerById(tm, pid);
  if (!p) return "";
  const at = list.indexOf(pid), n = STARTERS[pos], role = k => k < n ? (n === 1 ? "the starter" : "a starter") : `the ${ordWord(k - n)} backup`;
  let say = "";
  if (how === "start") {
    if (at >= 0 && at < n) return "";
    if (at >= 0) list.splice(at, 1);
    const to = Math.min(n - 1, list.length), bumped = list[to] ? playerById(tm, list[to]) : null;
    list.splice(to, 0, pid);
    say = `${p.last} is ${role(to)} at ${slotName(pos)}.${bumped && n === 1 ? ` ${bumped.last} moves to backup.` : bumped ? ` ${bumped.last} moves to the bench.` : ""}`;
  } else if (how === "up" || how === "down") {
    const to = at + (how === "up" ? -1 : 1);
    if (at < 0 || to < 0 || to >= list.length) return "";
    [list[at], list[to]] = [list[to], list[at]];
    say = `${p.last} is now ${ordWord(to)}: ${role(to)}.`;
  } else if (how === "off") {
    if (at < 0) return "";
    list.splice(at, 1);
    say = `${p.last} is off the depth chart at ${slotName(pos)}.`;
  } else if (how === "add") {
    if (at >= 0) return "";
    list.push(pid);
    let dropped = null;
    if (list.length > depthMax(pos)) dropped = playerById(tm, list.splice(list.length - 2, 1)[0]);
    say = `${p.last} is ${role(list.indexOf(pid))} at ${slotName(pos)}.${dropped ? ` ${dropped.last} comes off the list.` : ""}`;
  }
  depth[pos] = list;
  setDepth(i, depth);
  return say;
}
function resetDepth(i) {
  const tm = depthTeam(i), d = autoDepth(tm);
  setDepth(i, d);
  if (!inGameView() && depthHome().depthMode !== "next") baseSchool(i).manual = false;
}

/* ---------- Reading players ---------- */
// The ratings that matter most at each spot, for choosing between players
const KEY_RATINGS = { QB: ["acc", "arm", "spd"], RB: ["spd", "elu", "bsc"], WR: ["spd", "hnd", "rte"], TE: ["hnd", "blk", "spd"], OL: ["rbk", "pbk", "str"],
  DL: ["prs", "rst", "str"], LB: ["tkl", "cov", "spd"], CB: ["cov", "spd", "tkl"], S: ["cov", "tkl", "spd"], K: ["leg", "kac"], P: ["leg", "kac"],
  KR: ["spd", "elu", "bsc"], PR: ["spd", "elu", "bsc"] };
const keyRatings = (p, pos) => KEY_RATINGS[pos].map(a => `${ATTR_NAMES[a].toLowerCase()} ${p.r[a]}`).join(", ");
// During a game: "Tired, 58 percent." or "Resting, 66 percent."
function energyLine(p) {
  if (!inGameView() || p.en == null) return "";
  return p.rest ? ` Resting, ${Math.round(p.en)} percent.` : p.en < 85 ? ` ${capFirst(energyText(p.en))}.` : "";
}
// "Starter. Marcus Hill, junior, linebacker 39. Also starts at running back. Sure tackler."
// A backup: "Damian Blackwell, senior, linebacker 37. Also running back 40."
function slotLine(team, p, pos, starter, level) {
  const roles = depthRoles(team, p), elsewhere = roles.starts.filter(x => x !== pos && OFF_POS.concat(DEF_POS).includes(x));
  const also = elsewhere.length ? `Also starts at ${andList(elsewhere.map(slotName))}.`
    : (() => { const x = [p.pos, p.pos2].filter(q => q && q !== pos && POS_INFO[q]).map(q => `${posName(q)} ${ovr(p, q)}`); return x.length ? `Also ${x.join(" and ")}.` : ""; })();
  const st = strengths(p, level).map(a => ATTR_PRAISE[a]);
  return `${p.inj ? `Injured, ${injWhen(p)}. ` : starter ? "Starter. " : ""}${fullName(p)}, ${YEAR_NAMES[p.yr]}, ${slotName(pos)} ${slotRating(p, pos)}.${also ? " " + also : ""}${st.length ? ` ${capFirst(st.join(", "))}.` : ""}${energyLine(p)}`;
}
// How long an injured player is out, from where the screen is: hurt in the game you're watching, or
// out for weeks
const injWhen = p => inGameView() && p.inj.at === "game" ? "out for the rest of the game" : injText(p.inj);
// "Starts at quarterback and linebacker. Backs up at tight end."
function rolesLine(team, p) {
  const r = depthRoles(team, p), out = [];
  if (r.starts.length) out.push(`Starts at ${andList(r.starts.map(slotName))}.`);
  if (r.backs.length) out.push(`Backs up at ${andList(r.backs.map(slotName))}.`);
  return out.length ? out.join(" ") : "Not on the depth chart.";
}

/* ---------- The roster screen ---------- */
function rosterControls(i) {
  const tm = depthTeam(i), game = inGameView();
  const rot = game ? tm.rot : (depthHome().rot || "normal");
  const seg = (a, list, cur, label) => `<div style="display:grid;gap:6px" role="group" aria-label="${label}"><span class="eyebrow" aria-hidden="true">${label}</span><div class="seg">
    ${list.map(([v, l]) => `<button data-a="${a}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div></div>`;
  const mode = depthHome().depthMode === "next" ? "next" : "always";
  const modeNote = game ? "Changes here last for this game only."
    : mode === "next" ? "Changes here apply to the next game only. After it, the depth chart goes back to how it is for every game."
    : pendingNext(i) ? "Changes here apply to every game. Your next game has its own changes too: switch to Next game only to see them." : "Changes here apply to every game.";
  return `<section class="panel">
    ${game ? "" : seg("dmode", [["always", "Every game"], ["next", "Next game only"]], mode, "Depth chart for")}
    <p class="muted styledesc">${modeNote}</p>
    ${seg("rot", ROTATION_IDS.map(id => [id, ROTATION[id].name]), rot, "Rotation")}
    <p class="muted styledesc">${esc(ROTATION[rot].desc)}</p>
    <button class="btn ghost" data-a="dreset">Reset to automatic</button>
    ${!game && mode === "next" && pendingNext(i) ? `<button class="btn ghost" data-a="dnextoff">Drop the next-game changes</button>` : ""}
  </section>`;
}
function vRoster() {
  const i = APP.view.team, tm = depthTeam(i), level = tm.level, edit = canEdit(i), game = inGameView();
  const other = (APP.view.pair || [0, 1]).find(x => x !== i);
  const sec = ([title, slots]) => `<section class="panel"><h3>${title}</h3>${slots.map(pos => {
    // The starters are the first healthy players on the list
    const ids = (tm.depth[pos] || []).slice(0, depthMax(pos)), healthy = ids.filter(id => { const p = playerById(tm, id); return p && !p.inj; });
    return `<p class="sechead" role="heading" aria-level="4">${slotGroup(pos)}</p><ol class="roster">${ids.map(id => {
      const p = playerById(tm, id); if (!p) return "";
      return `<li><button class="rowbtn" data-a="player" data-v="${p.id}">${esc(slotLine(tm, p, pos, healthy.indexOf(id) >= 0 && healthy.indexOf(id) < STARTERS[pos], level))}</button></li>`;
    }).join("")}</ol>${edit ? `<button class="btn ghost slim" data-a="dedit" data-v="${pos}">Change ${slotGroup(pos).toLowerCase()}</button>` : ""}`;
  }).join("")}</section>`;
  const intro = game ? `${plural(tm.players.length, "player")}, with how fresh each one is.` : `${plural(tm.players.length, "player")}. Starters first, then the backups in order. Tap a player for all of his ratings.`;
  const back = game ? "Back to the game" : "Back";
  return `
    <div class="masthead" style="--team:${tm.color}">
      <p class="eyebrow">${edit && game ? "Lineup and substitutions" : "Roster and depth chart"}</p>
      <h2 data-focus tabindex="-1">${esc(teamTown(tm))} ${esc(teamMascot(tm))}</h2>
      <p class="muted">${intro}</p>
    </div>
    <div class="choices"><button class="btn ghost" data-a="back">${back}</button>${other != null ? `<button class="btn ghost" data-a="rteam" data-t="${other}">${esc(teamMascot(depthTeam(other)))} roster</button>` : ""}</div>
    ${edit ? rosterControls(i) : ""}
    ${DEPTH_GROUPS.map(sec).join("")}
    <button class="btn ghost" data-a="back">${back}</button>`;
}

/* ---------- Changing one position ---------- */
// Pick a player, then what to do with him
function vDepthEdit() {
  const i = APP.view.team, pos = APP.view.edit, tm = depthTeam(i), sel = APP.view.sel, n = STARTERS[pos];
  const listed = (tm.depth[pos] || []).map(id => playerById(tm, id)).filter(Boolean);
  const others = tm.players.filter(p => !listed.includes(p)).sort((a, b) => slotRating(b, pos) - slotRating(a, pos));
  const where = inGameView() ? "Changes last for this game only." : depthHome().depthMode === "next" ? "Changes apply to the next game only." : "Changes apply to every game.";
  const elsewhere = p => { const s = depthRoles(tm, p).starts.filter(x => x !== pos && !["KR", "PR"].includes(x)); return s.length ? ` Also starts at ${andList(s.map(slotName))}.` : ""; };
  const text = (p, k) => `${k != null ? `${k + 1}. ${k < n ? "Starter" : "Backup"}. ` : ""}${fullName(p)}, ${YEAR_NAMES[p.yr]}, ${slotName(pos)} ${slotRating(p, pos)}: ${keyRatings(p, pos)}.${elsewhere(p)}${energyLine(p)}${p.inj ? ` Injured, ${injWhen(p)}.` : ""}`;
  const act = (how, label, p) => `<button class="btn ghost slim" data-a="dmove" data-v="${how}" data-t="${p.id}">${label}</button>`;
  const actions = (p, k) => {
    if (sel !== p.id) return "";
    const b = [];
    if (k == null || k >= n) b.push(act("start", `Start ${esc(p.last)}`, p));
    if (k != null && k > 0) b.push(act("up", `Move ${esc(p.last)} up`, p));
    if (k != null && k < listed.length - 1) b.push(act("down", `Move ${esc(p.last)} down`, p));
    if (k == null) b.push(act("add", `Add ${esc(p.last)} as a backup`, p));
    else b.push(act("off", `Take ${esc(p.last)} off`, p));
    return `<div class="dacts" role="group" aria-label="${esc(fullName(p))}">${b.join("")}</div>`;
  };
  const row = (p, k) => `<li><button class="rowbtn" data-a="dsel" data-v="${p.id}" aria-pressed="${sel === p.id}">${esc(text(p, k))}</button>${actions(p, k)}</li>`;
  return `
    <div class="masthead" style="--team:${tm.color}">
      <p class="eyebrow">${esc(teamTown(tm))} ${esc(teamMascot(tm))} · ${n === 1 ? "1 starter" : `${n} starters`}</p>
      <h2 data-focus tabindex="-1">${slotGroup(pos)}</h2>
      <p class="muted">${where} Pick a player, then choose what to do with him.</p>
    </div>
    <section class="panel">
      <h3>On the depth chart</h3>
      <ol class="roster">${listed.map(row).join("")}</ol>
    </section>
    <section class="panel">
      <h3>Everyone else</h3>
      <ul class="roster">${others.map(p => row(p, null)).join("")}</ul>
    </section>
    <button class="btn" data-a="ddone">Done</button>`;
}

/* ---------- A player ---------- */
const ATTR_GROUPS = [["Athletic", ["spd", "str", "awr"]], ["Passing", ["acc", "arm"]], ["Running", ["elu", "bsc"]], ["Receiving", ["hnd", "rte"]],
  ["Blocking", ["blk", "rbk", "pbk"]], ["Defense", ["prs", "rst", "tkl", "cov"]], ["Kicking", ["leg", "kac"]]];
function vPlayer() {
  const tm = depthTeam(APP.view.team), p = playerById(tm, APP.view.player);
  if (!p) return vRoster();
  const fits = POS_IDS.map(pos => [pos, ovr(p, pos)]).sort((a, b) => b[1] - a[1]);
  const shown = [p.pos, p.pos2].filter(Boolean);
  const others = fits.filter(([pos]) => !shown.includes(pos)).slice(0, 3);
  const st = inGameView() ? S.ps[p.id] : null;
  // Season totals for your own players
  const mineInSeason = SEASON && SEASON.myId && (viewCtx() === "season" ? APP.view.team === SEASON.myId : inGameView() && S.season && S.teams[APP.view.team].id === SEASON.myId);
  return `
    <div class="masthead" style="--team:${tm.color}">
      <p class="eyebrow">${esc(teamTown(tm))} ${esc(teamMascot(tm))} · Number ${p.num}</p>
      <h2 data-focus tabindex="-1">${esc(fullName(p))}</h2>
      <p class="muted">${capFirst(YEAR_NAMES[p.yr])}. ${p.inj ? `Injured, ${esc(injWhen(p))}. ` : ""}${esc(rolesLine(tm, p))}${esc(energyLine(p))}</p>
    </div>
    <section class="panel">
      <h3>Overall</h3>
      <ul class="hlist">${shown.map(pos => `<li>${capFirst(posName(pos))} ${ovr(p, pos)}</li>`).join("")}
        <li>Next best fits: ${others.map(([pos, v]) => `${posName(pos)} ${v}`).join(", ")}</li></ul>
      <p>${capFirst(POT_BANDS[p.potSeen])} potential, by the staff's estimate. Work ethic ${p.eth}, stamina ${p.sta}, health ${p.hlt}.</p>
      ${p.o0 != null && mineInSeason && ovr(p, p.pos) > p.o0 ? `<p>Up from ${p.o0} at ${slotName(p.pos)} since the start of the season.</p>` : ""}
    </section>
    ${st ? `<section class="panel"><h3>This game</h3>${playerGameLine(st)}</section>` : ""}
    ${mineInSeason ? `<section class="panel"><h3>This season</h3>${playerSeasonLine(SEASON.stats[p.id])}</section>` : ""}
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
