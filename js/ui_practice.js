// Friday to Sunday: the practice screens. The week's plan, the plays to install, the practice report,
// and the scouting report on the next opponent.
"use strict";

/* ---------- Reading practice ---------- */
const blocksText = b => { const v = Math.round(b * 10) / 10; return `${v} block${v === 1 ? "" : "s"}`; };
// "fundamentals 5 blocks, install 1.7, opponent prep 1.7, conditioning 0.8, recovery 0.8"
function blocksLine(b) {
  const fund = ["qb", "skill", "ol", "front", "secondary", "kick"].reduce((s, a) => s + b[a], 0), r = v => Math.round(v * 10) / 10;
  const parts = [`fundamentals ${blocksText(fund)}`];
  [["install", "install"], ["prep", "opponent prep"], ["cond", "conditioning"], ["rec", "recovery"]].forEach(([a, nm]) => { if (b[a] > 0) parts.push(`${nm} ${r(b[a])}`); });
  return parts.join(", ");
}
const PREP_TEXT = ["no scouting report", "a short scouting report", "a full scouting report", "a full scouting report with every tendency"];
const playName = id => (OFFP[id] || DEFP[id]).name;
// "Inside Run, solid 74"
const masteryLine = (s, id) => { const v = Math.round(s.mastery[id]); return `${playName(id)}, ${masteryWord(v)} ${v}`; };

/* ---------- The practice plan ---------- */
function vPractice() {
  const plan = SEASON.plan, b = blocksOf(plan), pre = presetOf(plan), done = practiced(), n = SEASON.week;
  const seg = (a, list, cur, label, extra) => `<div style="display:grid;gap:6px" role="group" aria-label="${label}"><span class="eyebrow" aria-hidden="true">${label}${extra || ""}</span><div class="seg${list.length > 3 ? " grid2" : ""}">
    ${list.map(([v, l]) => `<button data-a="${a}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div></div>`;
  const row = id => `<div style="display:grid;gap:6px" role="group" aria-label="${AREA_NAMES[id]}"><span class="eyebrow" aria-hidden="true">${AREA_NAMES[id]} · ${blocksText(b[id])}</span>
    <div class="seg">${INTENSITY.map((nm, v) => `<button data-a="parea" data-t="${id}" data-v="${v}" aria-pressed="${(plan.areas[id] || 0) === v}">${nm}</button>`).join("")}</div></div>`;
  const focus = (plan.focus || []).filter(id => playName(id));
  return `
    <div class="masthead" style="--team:${mySchool().color}">
      <p class="eyebrow">${weekName(n)} · Practice</p>
      <h2 data-focus tabindex="-1">Practice plan</h2>
      <p class="muted">Ten blocks a week, two a day. Each area gets a share of them by its weight, so more for one means less for the rest. The plan carries over from week to week.</p>
    </div>
    ${done ? `<p class="banner">This week's practice is done. Changes here start next week.</p>` : ""}
    <section class="panel">
      ${seg("ppreset", PRESET_IDS.map(id => [id, PRESETS[id].name]), pre, "Presets")}
      ${seg("pcontact", CONTACT_IDS.map(id => [id, CONTACT[id].name]), plan.contact, "Contact")}
      <p class="muted styledesc">${esc(CONTACT[plan.contact].desc)}</p>
    </section>
    <section class="panel">
      <h3>Fundamentals</h3>
      <p class="muted styledesc">Players get better in the skills of the unit they practice with. Growth slows as a player nears his potential.</p>
      ${["qb", "skill", "ol", "front", "secondary", "kick"].map(row).join("")}
    </section>
    <section class="panel">
      <h3>Team</h3>
      ${row("install")}
      <p class="muted styledesc">${focus.length ? `Install focus: ${esc(andList(focus.map(playName)))}.` : "No install focus: install time is spread over the whole playbook."}</p>
      <button class="btn ghost slim" data-a="install">Pick plays to install</button>
      ${row("prep")}
      <p class="muted styledesc">Film study of this week's opponent: ${PREP_TEXT[prepLevelOf(b.prep)]}, and a small edge when they run the calls you studied.</p>
      ${row("cond")}
      <p class="muted styledesc">Stamina, so players tire more slowly, and a little strength and speed.</p>
      ${row("rec")}
      <p class="muted styledesc">Fewer practice injuries, faster healing, and fresher legs on game day.</p>
    </section>
    <section class="panel">
      <h3>This week</h3>
      <p>${capFirst(blocksLine(b))}. Your players should start the game about ${freshOf(b, plan.contact)} percent fresh.</p>
      ${done ? `<button class="btn" data-a="preport">Practice report</button>` : `<button class="btn" data-a="hold">Hold practice</button>`}
    </section>
    <button class="btn ghost" data-a="back">Back to the week</button>`;
}

/* ---------- Install focus ---------- */
function vInstall() {
  const s = mySchool(), focus = SEASON.plan.focus || [];
  const row = id => `<li><button class="rowbtn" data-a="pfocus" data-v="${id}" aria-pressed="${focus.includes(id)}">${esc(masteryLine(s, id))}${focus.includes(id) ? ". Focus" : ""}</button></li>`;
  const sec = (title, ids) => `<section class="panel"><h3>${title}</h3><ul class="roster">${ids.map(row).join("")}</ul></section>`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">Practice · Install</p>
      <h2 data-focus tabindex="-1">Install focus</h2>
      <p class="muted">Pick up to three plays. They get most of the install time, and the rest of the playbook gets a little. With none picked, it's spread over everything. ${focus.length ? `Picked: ${esc(andList(focus.map(playName)))}.` : ""}</p>
    </div>
    ${sec("Offense", OFF_IDS)}${sec("Defense", DEF_IDS)}${sec("Special plays", ["qs", "hm", "te"])}
    <button class="btn" data-a="back">Done</button>`;
}

/* ---------- The practice report ---------- */
function vPReport() {
  const P = SEASON.practice, s = mySchool(), n = P.week, gm = myGameIn(n), live = !!(gm && !played(gm));
  const nm = id => { const p = playerById(s, id); return p ? fullName(p) : ""; };
  const list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  // Who got better: the most improved first, a dozen at most
  const grew = Object.keys(P.grew).map(id => {
    const p = playerById(s, id);
    if (!p) return null;
    // "up a point in run blocking and strength, up 2 in pass blocking. Now 48 at offensive lineman."
    const g = P.grew[id], by = {};
    Object.keys(g).forEach(a => { const d = g[a][1] - g[a][0]; (by[d] = by[d] || []).push(a === "sta" ? "stamina" : ATTR_NAMES[a].toLowerCase()); });
    const parts = Object.keys(by).sort((a, b) => a - b).map(d => `up ${+d === 1 ? "a point" : d} in ${andList(by[d])}`);
    const ov = P.ovr.filter(x => x[0] === id).map(x => `${x[3]} at ${slotName(x[1])}`);
    // Starters first, then whoever improved the most
    const starts = depthRoles(s, p).starts.length ? 10 : 0;
    return { n: starts + Object.keys(g).length + 2 * ov.length, t: `${fullName(p)}: ${parts.join(", ")}.${ov.length ? ` Now ${andList(ov)}.` : ""}` };
  }).filter(Boolean).sort((a, b) => b.n - a.n);
  const hurt = P.hurt.map(id => { const p = playerById(s, id); return p ? `${fullName(p)}, ${injText(p.inj)}` : ""; }).filter(Boolean);
  const still = s.players.filter(p => p.inj && !P.hurt.includes(p.id)).map(p => `${fullName(p)}, ${injText(p.inj)}`);
  const opp = P.opp ? SEASON.schools[P.opp] : null;
  const actions = !live ? "" : APP.reportNext === "kickoff"
    ? `<button class="btn" data-a="playgame">Kick off</button>`
    : `<div class="choices"><button class="btn" data-a="playgame">Play the game</button><button class="btn ghost" data-a="simgame">Sim the game</button></div>`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${weekName(n)} · Practice</p>
      <h2 data-focus tabindex="-1">Practice report</h2>
      <p class="muted">${capFirst(blocksLine(P.blocks))}. In ${CONTACT[P.contact].name.toLowerCase()}.</p>
    </div>
    ${hurt.length || still.length ? `<section class="panel"><h3>Injuries</h3>${hurt.length ? `<p>Hurt in practice:</p>${list(hurt)}` : `<p>Nobody was hurt in practice.</p>`}${still.length ? `<p>Still out:</p>${list(still)}` : ""}</section>` : ""}
    <section class="panel"><h3>Who got better</h3>${grew.length ? list(grew.slice(0, 12).map(x => x.t)) + (grew.length > 12 ? `<p class="muted">And ${plural(grew.length - 12, "more player")}.</p>` : "") : `<p>Nobody moved up a full point this week.</p>`}</section>
    <section class="panel"><h3>Install</h3>${P.mastery.length ? list(P.mastery.slice().sort((a, b) => (b[2] - b[1]) - (a[2] - a[1])).slice(0, 8).map(([id, a, b]) => `${playName(id)}: ${a} to ${b}`)) : `<p>No play moved up a full point.</p>`}</section>
    <section class="panel">
      <h3>Game day</h3>
      <p>Your players should start the game about ${P.fresh} percent fresh.</p>
      ${opp ? `<p>Film study: ${PREP_TEXT[P.prep]} on the ${esc(opp.mascot)}.</p><button class="btn ghost" data-a="scout">Scouting report</button>` : ""}
    </section>
    ${actions}
    <button class="btn ghost" data-a="back">Back to the week</button>`;
}

/* ---------- The scouting report ---------- */
const pctText = v => `${Math.round(v * 100)} percent`;
const SCOUT_FROM = ["No film study this week. Give opponent prep some time for a report on their habits.", "A short report from a light week of film study.",
  "A full report from this week's film study.", "A full report with every tendency, from a heavy week of film study."];
const BUCKET_NAMES = { s: "Short yardage", m: "Medium yardage", l: "Long yardage" };
function vScout() {
  const P = SEASON.practice, F = P.film, lvl = P.prep, opp = seasonSchool(P.opp), me = mySchool(), n = P.week;
  const list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const names = (calls, k) => andList(calls.slice(0, k).map(([id]) => playName(id)));
  // On offense and defense, by situation as the film allows
  const offLines = [], defLines = [];
  if (lvl >= 1) {
    offLines.push(`They run on about ${pctText(F.run)} of their snaps. Favorite plays: ${names(F.offAll, 2)}.`);
    defLines.push(`They blitz on about ${pctText(F.blitz)} of their snaps. Favorite calls: ${names(F.defAll, 2)}.`);
  }
  if (lvl >= 2) ["s", "m", "l"].forEach(b => {
    const o = F.off[b], d = F.def[b], k = lvl >= 3 ? 3 : 2;
    offLines.push(`${BUCKET_NAMES[b]}: run ${pctText(o.run)}. ${names(o.calls, k)}.${lvl >= 3 && o.pkgs.length ? ` Mostly ${OFF_PKGS[o.pkgs[0][0]].name}.` : ""}`);
    defLines.push(`${BUCKET_NAMES[b]}: blitz ${pctText(d.blitz)}. ${names(d.calls, k)}.${lvl >= 3 && d.pkgs.length ? ` Mostly ${DEF_PKGS[d.pkgs[0][0]].name}.` : ""}`);
  });
  if (lvl >= 3) defLines.push(`They disguise their look ${F.disg >= .3 ? "a lot" : F.disg >= .2 ? "sometimes" : "rarely"}.`);
  // What beats their favorites (from the play-call table)
  // Only calls that clearly win the matchup (a 1 or better on the play-call table) are worth naming
  const plan = [], orList = ids => ids.length > 1 ? `${ids.slice(0, -1).join(", ")} or ${ids[ids.length - 1]}` : ids[0];
  if (lvl >= 2) {
    F.offAll.slice(0, 2).forEach(([id]) => {
      if (!M[id]) return;
      const v = Math.min(...DEF_IDS.map(d => M[id][d])), best = DEF_IDS.filter(d => M[id][d] === v).slice(0, 3).map(playName);
      if (v <= -1) plan.push(`Against ${playName(id)}: ${orList(best)}.`);
    });
    F.defAll.slice(0, 2).forEach(([id]) => {
      const v = Math.max(...OFF_IDS.map(o => M[o][id])), best = OFF_IDS.filter(o => M[o][id] === v).slice(0, 3).map(playName);
      plan.push(v >= 1 ? `Against ${playName(id)}: ${orList(best)}.` : `${playName(id)} has no clear weak spot. Call what your team runs best.`);
    });
  }
  // Players to watch: their quarterback, back, best receiver and two best defenders
  const st = pos => starterAt(opp, pos), lu = lineupFor(opp, "base"), defs = lineupPlayers(lu).map(p => [p, Object.keys(lu).find(k => lu[k].includes(p))]).sort((a, b) => ovr(b[0], b[1]) - ovr(a[0], a[1]));
  const wr = lineupFor(opp, "p11").WR.slice().sort((a, b) => ovr(b, "WR") - ovr(a, "WR"))[0];
  const watch = [[st("QB"), "QB"], [st("RB"), "RB"], [wr, "WR"]].concat(defs.slice(0, 2)).filter(([p]) => p)
    .map(([p, pos]) => { const sx = strengths(p, opp.level).map(a => ATTR_PRAISE[a]); return `${fullName(p)}, ${slotName(pos)} ${ovr(p, pos)}${sx.length ? `: ${sx.join(", ")}` : ""}.`; });
  // Where to attack, and what to watch out for, unit against unit
  const u = unitRatings(opp), m = unitRatings(Object.assign({}, me, { depth: SEASON.nextDepth ? SEASON.nextDepth.depth : me.depth }));
  const pairs = [["your run blocking", m.runBlock, "their run defense", u.runD], ["your pass protection", m.passPro, "their pass rush", u.passRush], ["your receivers", m.wr, "their coverage", u.cover],
    ["your run defense", m.runD, "their run blocking", u.runBlock], ["your pass rush", m.passRush, "their pass protection", u.passPro], ["your coverage", m.cover, "their receivers", u.wr]];
  const byGap = pairs.map(x => [x, x[1] - x[3]]).sort((a, b) => b[1] - a[1]);
  const attack = byGap.slice(0, 2).filter(([, d]) => d > 0).map(([x]) => `${capFirst(x[0])} (${x[1]}) against ${x[2]} (${x[3]}).`);
  const worry = byGap.slice(-1).filter(([, d]) => d < 0).map(([x]) => `${capFirst(x[2])} (${x[3]}) against ${x[0]} (${x[1]}).`);
  return `
    <div class="masthead" style="--team:${opp.color}">
      <p class="eyebrow">${weekName(n)} · Scouting report</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(opp.id))}</h2>
      <p class="muted">Coach ${esc(coachName(opp.coach))}: ${esc(schemeText(opp))}. ${talentText(schoolRating(opp))} ${SCOUT_FROM[lvl]}</p>
    </div>
    ${lvl ? `<section class="panel"><h3>Their offense</h3>${list(offLines)}</section><section class="panel"><h3>Their defense</h3>${list(defLines)}</section>` : ""}
    ${plan.length ? `<section class="panel"><h3>What beats their favorites</h3>${list(plan)}<p class="muted styledesc">Your team gets a small edge on snaps when they run the calls you studied.</p></section>` : lvl ? `<p class="muted">Your team gets a small edge on snaps when they run the calls you studied.</p>` : ""}
    <section class="panel"><h3>Players to watch</h3>${list(watch)}</section>
    <section class="panel"><h3>Matchups</h3>${attack.length ? `<p>Where to attack:</p>${list(attack)}` : ""}${worry.length ? `<p>Watch out for:</p>${list(worry)}` : ""}${!attack.length && !worry.length ? "<p>No big edges either way.</p>" : ""}</section>
    <button class="btn ghost" data-a="back">${APP.scoutBack === "game" ? "Back to the game" : "Back"}</button>`;
}
