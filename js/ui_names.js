// Friday to Sunday: the names screen (Milestone 4). Rename any school, conference or bowl, grouped by
// level and conference (or class and district), the pro league's teams, divisions and names (Milestone
// 5), with a search, and the list to copy out or load in.
"use strict";

let nmSearch = "", nmImport = "", nmMsg = "";
const NM_TABS = [["col", "College"], ["hs", "High school"], ["pro", "Pros"], ["bowls", "Bowls"], ["find", "Search"], ["share", "Share"]];
// A school's two fields, in a group named for the school
function nameFields(s, tl, ml) {
  const id = s.id, own = `${s.town0 != null ? s.town0 : s.town} ${s.mascot0 != null ? s.mascot0 : s.mascot}`;
  const field = (part, label, val) => `<div class="form"><label for="nm-${id}-${part}">${label}</label><input type="text" id="nm-${id}-${part}" data-in="nm|s|${part}|${id}" value="${esc(val)}" maxlength="${part === "a" ? ABBR_LEN : NAME_LEN}" autocomplete="off" autocapitalize="${part === "a" ? "characters" : "words"}" spellcheck="false"></div>`;
  return `<div role="group" aria-label="${esc(own)}" class="nmgroup"><p class="sechead" aria-hidden="true">${esc(own)}${s.town0 != null && (s.town !== s.town0 || s.mascot !== s.mascot0) ? ` · now ${esc(schoolName(s))}` : ""}</p>${field("t", tl || "Name", s.town)}${field("m", ml || "Mascot", s.mascot)}${field("a", "Scoreboard abbreviation", s.abbr)}</div>`;
}
const confField = c => `<div class="form"><label for="nm-${c.id}">${c.cls === "PRO" ? "Division name" : "Conference name"}</label><input type="text" id="nm-${c.id}" data-in="nm|c||${c.id}" value="${esc(c.name)}" maxlength="${NAME_LEN}" autocomplete="off" autocapitalize="words" spellcheck="false"></div>`;
const nmSeg = (a, opts, cur, label) => `<div style="display:grid;gap:6px" role="group" aria-label="${label}"><span class="eyebrow" aria-hidden="true">${label}</span><div class="seg">${opts.map(([v, nm]) => `<button data-a="${a}" data-v="${v}" aria-pressed="${cur === v}">${nm}</button>`).join("")}</div></div>`;
function vNames() {
  const N = APP.nm = APP.nm || { tab: "col" }, W = colWorld(), H = hsWorld();
  let body = "";
  if (N.tab === "col") {
    if (!W) body = `<p>Start a career to rename the colleges.</p>`;
    else {
      const lvl = N.lvl || "P4", confs = W.confs.filter(c => c.cls === lvl), indep = Object.values(W.schools).filter(s => s.cls === lvl && !s.conf);
      const conf = N.conf && (N.conf === "ind" || confs.some(c => c.id === N.conf)) ? N.conf : null;
      body = `${nmSeg("nmlvl", COL_ORDER.map(c => [c, c === "P4" ? "Power" : c === "G5" ? "FBS" : c]), lvl, "Level")}
        <h3 id="nmhead" tabindex="-1">${esc(levelName(lvl))}</h3>
        <ul class="hlist">${confs.map(c => `<li><button class="rowbtn" data-a="nmconf" data-v="${c.id}" aria-pressed="${conf === c.id}">${esc(`${c.name}, ${plural(c.ids.length, "school")}`)}</button></li>`).join("")}${indep.length ? `<li><button class="rowbtn" data-a="nmconf" data-v="ind" aria-pressed="${conf === "ind"}">${esc(`Independents, ${plural(indep.length, "school")}`)}</button></li>` : ""}</ul>`;
      if (conf) {
        const c = W.confs.find(x => x.id === conf), list = c ? c.ids.map(id => W.schools[id]) : indep;
        body += `<section class="panel"><h3 id="nmconfhead" tabindex="-1">${esc(c ? c.name : "Independents")}</h3>${c ? confField(c) : ""}${list.map(nameFields).join("")}</section>`;
      }
    }
  } else if (N.tab === "hs") {
    if (!H) body = `<p>Start a career to rename the high schools.</p>`;
    else {
      const cls = N.cls || "1A", d = N.dist || 0;
      body = `${nmSeg("nmcls", CLASSES.map(c => [c, c]), cls, "Class")}
        <h3 id="nmhead" tabindex="-1">${esc(`Class ${cls}`)}</h3>
        <div class="choices">${classDistricts(cls).map(x => `<button class="btn ghost" data-a="nmdist" data-v="${x.n}" aria-pressed="${d === x.n}">District ${x.n}</button>`).join("")}</div>`;
      if (d) body += `<section class="panel"><h3 id="nmconfhead" tabindex="-1">${esc(`Class ${cls}, District ${d}`)}</h3>${classDistricts(cls)[d - 1].ids.map(id => H.schools[id]).filter(Boolean).map(nameFields).join("")}</section>`;
    }
  } else if (N.tab === "pro") {
    const P = proWorld();
    if (!P) body = `<p>Start a career to rename the pro teams.</p>`;
    else {
      const lf = (k, label) => `<div class="form"><label for="nml-${k}">${label}</label><input type="text" id="nml-${k}" data-in="nm|l|${k}|" value="${esc(leagueName(k))}" maxlength="${NAME_LEN}" autocomplete="off" autocapitalize="words" spellcheck="false"></div>`;
      const div = N.pdiv && P.confs.some(c => c.id === N.pdiv) ? P.confs.find(c => c.id === N.pdiv) : null;
      body = `<h3 id="nmhead" tabindex="-1">The league</h3>
        ${lf("league", "League name")}${lf("bowl", "Championship game")}${PRO_CONF_IDS.map(cf => lf(cf, `Conference name (now the ${PRO_CONF_NAMES[cf]})`)).join("")}
        <p class="sechead" role="heading" aria-level="4">Divisions</p>
        <ul class="hlist">${P.confs.map(c => `<li><button class="rowbtn" data-a="nmpdiv" data-v="${c.id}" aria-pressed="${div === c}">${esc(`${c.name}, ${plural(c.ids.length, "team")}`)}</button></li>`).join("")}</ul>`;
      if (div) body += `<section class="panel"><h3 id="nmconfhead" tabindex="-1">${esc(div.name)}</h3>${confField(div)}${div.ids.map(id => P.schools[id]).map(s => nameFields(s, "City", "Nickname")).join("")}</section>`;
    }
  } else if (N.tab === "bowls") {
    body = `<h3 id="nmhead" tabindex="-1">Bowls</h3><p class="muted">The first six host the playoff games.</p>${allBowls().map((b, k) => `<div class="form"><label for="nmb${k}">${esc(b)}</label><input type="text" id="nmb${k}" data-in="nm|b||${esc(b)}" value="${esc(bowlAs(b))}" maxlength="${NAME_LEN}" autocomplete="off" autocapitalize="words" spellcheck="false"></div>`).join("")}`;
  } else if (N.tab === "find") {
    const q = cleanNameText(nmSearch).toLowerCase(), hits = [];
    if (q.length >= 2) [W, H, proWorld()].forEach(se => { if (se) for (const id in se.schools) { const s = se.schools[id], txt = `${schoolName(s)} ${s.town0 || ""} ${s.mascot0 || ""}`.toLowerCase(); if (txt.includes(q) && hits.length < 30) hits.push(s); } });
    const confHits = q.length >= 2 ? [W, proWorld()].filter(Boolean).flatMap(se => se.confs).filter(c => `${c.name} ${c.name0 || ""}`.toLowerCase().includes(q)).slice(0, 10) : [];
    body = `<div class="form"><label for="nmsearch">Search for a school, team, conference or division</label><input type="search" id="nmsearch" data-in="nmsearch" data-enter="nmgo" value="${esc(nmSearch)}" maxlength="${NAME_LEN}" autocomplete="off" spellcheck="false" enterkeyhint="search"></div>
      <button class="btn ghost" data-a="nmgo">Search</button>
      <h3 id="nmhead" tabindex="-1">${esc(q.length < 2 ? "Type at least two letters" : hits.length + confHits.length ? `${plural(hits.length + confHits.length, "match", "matches")}${hits.length >= 30 ? ", the first 30 schools" : ""}` : "Nothing matches")}</h3>
      ${confHits.map(confField).join("")}${hits.map(s => isPro(s.cls) ? nameFields(s, "City", "Nickname") : nameFields(s)).join("")}`;
  } else {
    const txt = namesText();
    body = `<h3 id="nmhead" tabindex="-1">Share your names</h3>
      <p class="muted">Copy the list to keep it, share it, or move it to another device, and paste a list here to load it. Loading adds to the names you have.</p>
      <div class="form"><label for="nmout">Your names (${namesCount()})</label><textarea id="nmout" readonly spellcheck="false">${esc(txt)}</textarea></div>
      <button class="btn ghost" data-a="nmcopy"${txt ? "" : " disabled"}>Copy the list</button>
      <div class="form"><label for="nmin">Paste a list of names</label><textarea id="nmin" data-in="nmimport" spellcheck="false" autocomplete="off">${esc(nmImport)}</textarea></div>
      <button class="btn ghost" data-a="nmload">Load these names</button>
      <button class="btn ghost" data-a="nmreset"${namesCount() ? "" : " disabled"}>${confirming === "nmreset" ? "Tap again to go back to the game's names" : "Go back to the game's own names"}</button>`;
  }
  return `
    <div class="masthead">
      <p class="eyebrow">Names</p>
      <h2 data-focus tabindex="-1">Rename schools and teams</h2>
      <p class="muted">Any school, conference, bowl or pro team, and the pro league itself, can have a name you choose. The game itself comes with made-up names. Names you type are yours: they stay on this device and in your saves. Clear a box to go back to the game's name.</p>
    </div>
    ${nmMsg ? `<p class="banner" id="nmmsg" tabindex="-1">${esc(nmMsg)}</p>` : ""}
    ${nmSeg("nmtab", NM_TABS, N.tab, "Show")}
    <section class="panel">${body}</section>
    <button class="btn ghost" data-a="back">Back</button>`;
}
// Typing in a box renames as you go, without redrawing the screen
function nameTyped(k, v) {
  const [, kind, part, id] = k.split("|");
  if (kind === "s") renameSchool(id, part, v);
  else if (kind === "c") renameConf(id, v);
  else if (kind === "b") renameBowl(id, v);
  else if (kind === "l") renameLeague(part, v);
  save();
}
function namesAct(a, ds) {
  const N = APP.nm = APP.nm || { tab: "col" };
  switch (a) {
    case "names": APP.namesBack = APP.screen === "names" ? APP.namesBack : APP.screen; APP.screen = "names"; nmMsg = ""; scrollTop(); return true;
    case "nmtab": if (NM_TABS.some(t => t[0] === ds.v)) { N.tab = ds.v; nmMsg = ""; focusNext = { id: ds.v === "find" ? "nmsearch" : "nmhead" }; } return true;
    case "nmlvl": N.lvl = ds.v; N.conf = null; focusNext = { id: "nmhead" }; return true;
    case "nmconf": N.conf = ds.v; focusNext = { id: "nmconfhead" }; return true;
    case "nmcls": N.cls = ds.v; N.dist = 0; focusNext = { id: "nmhead" }; return true;
    case "nmpdiv": N.pdiv = ds.v; focusNext = { id: "nmconfhead" }; return true;
    case "nmdist": N.dist = +ds.v || 0; focusNext = { id: "nmconfhead" }; return true;
    case "nmgo": focusNext = { id: "nmhead" }; return true;
    case "nmcopy": {
      const txt = namesText();
      let p = null;
      try { if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) p = navigator.clipboard.writeText(txt); } catch (e) { p = null; }
      const done = m => { nmMsg = m; focusNext = { id: "nmmsg" }; render(); };
      if (p && p.then) p.then(() => done("Your names are copied."), () => done("Select the text in the Your names box and copy it."));
      else { nmMsg = "Select the text in the Your names box and copy it."; focusNext = { id: "nmmsg" }; }
      return true;
    }
    case "nmload": { const k = loadNamesText(nmImport); nmMsg = k ? `Loaded ${plural(k, "name")}.` : "No names found. Each line looks like: school c12: Lakeshore State / Panthers / LSU"; if (k) { nmImport = ""; save(); } focusNext = { id: "nmmsg" }; return true; }
    case "nmreset": if (!confirmed("nmreset")) return true; resetNames(); save(); nmMsg = "Back to the game's own names."; focusNext = { id: "nmmsg" }; return true;
  }
  return false;
}
