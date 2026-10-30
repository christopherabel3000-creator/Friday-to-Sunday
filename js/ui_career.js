// Friday to Sunday: the career screens. Creating your coach, your coach's page, the season summary,
// and saves: cloud saves and save codes.
"use strict";

/* ---------- Creating your coach ---------- */
// APP.coachDraft holds the coach being created: { first, last, bg, off, def }
const newDraft = () => ({ first: "", last: "", bg: "qb", off: "bal", def: "bal" });
let draftErr = false;
// "Offense 52, Defense 40, ..."
const ratingsLine = c => COACH_RATINGS.map(([k, nm]) => `${nm} ${c[k]}`).join(", ");
// The ratings a background raises: "Offense 52 and Game management 46"
const raisedLine = c => andList(COACH_RATINGS.filter(([k]) => c[k] > COACH_START).map(([k, nm]) => `${nm} ${c[k]}`));
// What a background brings beyond its ratings
function bgPerks(c) {
  const out = [], g = c.grow || {};
  if (g.qb) out.push("Your quarterbacks grow faster in practice.");
  if (g.ol || g.front) out.push("Your offensive and defensive linemen grow faster in practice.");
  if (g.kick) out.push("Your kickers and punters grow faster in practice.");
  if (c.spec === "run") out.push("Your teams run the ball, and stop the run, a little better.");
  return out;
}
function nameField(id, k, label, val, extra) {
  return `<div class="form"><label for="${id}">${label}</label><input type="text" id="${id}" data-in="${k}" value="${esc(val || "")}" maxlength="${NAME_MAX}" autocomplete="off" autocapitalize="words" spellcheck="false"${extra || ""}></div>`;
}
function vNewCoach() {
  const d = APP.coachDraft || (APP.coachDraft = newDraft()), c = makeCoach(d.first, d.last, d.bg, d.off, d.def);
  // After a try without a name: the empty boxes say what's missing, until they're filled in
  const bad = k => draftErr && !cleanName(d[k]) ? ` aria-invalid="true" aria-describedby="cnameerr"` : "";
  const missing = draftErr && (!cleanName(d.first) || !cleanName(d.last));
  const bgBtn = id => `<button class="play" data-a="cbg" data-v="${id}" aria-pressed="${d.bg === id}"><span class="nm">${BACKGROUNDS[id].name}</span><span class="sr-only">. </span><span class="ds">${BACKGROUNDS[id].desc}</span></button>`;
  const perks = bgPerks(c);
  return `
    <div class="masthead">
      <p class="eyebrow">New career</p>
      <h2 data-focus tabindex="-1">Your coach</h2>
      <p class="muted">You're a first-time head coach. Every new head coach starts at 40 in each rating, plus what the background brings.</p>
    </div>
    <section class="panel">
      <h3>Name</h3>
      ${nameField("cfirst", "first", "First name", d.first, `${bad("first")} enterkeyhint="next" data-next="clast"`)}
      ${nameField("clast", "last", "Last name", d.last, `${bad("last")} enterkeyhint="done" data-enter="makecoach"`)}
      ${missing ? `<p class="err" id="cnameerr">Your coach needs a first and last name.</p>` : ""}
    </section>
    <section class="panel" style="--team:var(--ink)">
      <h3>Background</h3>
      <div class="plays one" role="group" aria-label="Background">${BACKGROUND_IDS.map(bgBtn).join("")}</div>
      <p>Starting ratings: ${esc(ratingsLine(c))}.${perks.length ? ` ${esc(perks.join(" "))}` : ""}</p>
    </section>
    <section class="panel">
      <h3>Your schemes</h3>
      ${styleSegs(d.off, d.def)}
      <p class="muted styledesc">A school whose last coach ran your schemes already knows much of your playbook. Anywhere else, your team learns it in practice, a few plays at a time. You can change schemes any week.</p>
    </section>
    <button class="btn" data-a="makecoach">Find a job</button>`;
}
// Creates your coach and starts a season: on to picking a school
function makeCoachNow() {
  const d = APP.coachDraft || newDraft(), first = cleanName(d.first), last = cleanName(d.last);
  if (!first || !last) { draftErr = true; focusNext = { id: first ? "clast" : "cfirst" }; return false; }
  draftErr = false;
  newCareer(first, last, d.bg, d.off, d.def);
  APP.coachDraft = null;
  if (S && S.season) S = null;
  newSeason();
  return true;
}

/* ---------- Your coach ---------- */
function vCoach() {
  const c = CAREER.coach, bg = BACKGROUNDS[c.bg], me = SEASON && SEASON.myId ? mySchool() : null, perks = bgPerks(c);
  const schemes = OFF_STYLES[c.off_style] && DEF_STYLES[c.def_style] ? `${OFF_STYLES[c.off_style].name} offense, ${DEF_STYLES[c.def_style].name} defense.` : "";
  return `
    <div class="masthead"${me ? ` style="--team:${me.color}"` : ""}>
      <p class="eyebrow">Your coach${me ? ` · ${esc(nameOf(me.id))}` : ""}</p>
      <h2 data-focus tabindex="-1">${esc(coachFullName(c))}</h2>
      <p class="muted">${bg ? `${esc(bg.name)}. ` : ""}${esc(schemes)}</p>
    </div>
    <section class="panel">
      <h3>Ratings</h3>
      <ul class="hlist">${COACH_RATINGS.map(([k, nm]) => `<li><b>${nm} ${c[k]}.</b> ${esc(RATING_EFFECTS[k])}</li>`).join("")}</ul>
      ${perks.length ? `<p>${esc(perks.join(" "))}</p>` : ""}
      <p class="muted">When you sim a game, your ratings also decide how well your coach calls the plays.</p>
    </section>
    <section class="panel">
      <h3>Name</h3>
      ${nameField("pfirst", "first", "First name", c.first)}
      ${nameField("plast", "last", "Last name", c.last)}
      <p class="muted">Changes save as you type.</p>
    </section>
    ${CAREER.seasons.length ? `<section class="panel"><h3>Career</h3><ul class="hlist">${CAREER.seasons.map((x, i) => `<li>${esc(careerLine(x, i))}</li>`).join("")}</ul></section>` : ""}
    <button class="btn ghost" data-a="back">Back</button>`;
}
// Typing in a text box: the coach's name, a save code or a cloud save code. Nothing redraws.
let importText = "", cloudKeyText = "";
function typed(k, v) {
  if (k === "first" || k === "last") {
    if (APP.screen === "newcoach") { (APP.coachDraft = APP.coachDraft || newDraft())[k] = String(v).slice(0, NAME_MAX); }
    else if (APP.screen === "coach" && CAREER) CAREER.coach[k] = cleanName(v);
    save();
  } else if (k === "importtext") importText = String(v);
  else if (k === "cloudkey") cloudKeyText = String(v);
}

/* ---------- The season summary ---------- */
// 1,084
const numText = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function vSummary() {
  const me = SEASON.myId, s = mySchool(), x = seasonSummary(), c = s.coach, n = Math.max(1, x.games.length);
  const list = arr => `<ul class="hlist">${arr.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`;
  const score = g => `${Math.max(g.us, g.them)}-${Math.min(g.us, g.them)}${otText(g.gm)}`;
  const oppRec = id => recText(fullRecord(id));
  const memorable = [];
  if (x.best) memorable.push(`Best win: the ${nameOf(x.best.opp)} (${oppRec(x.best.opp)}), ${score(x.best)} in ${weekName(x.best.n).replace(/^Week/, "week")}.`);
  if (x.big && x.big !== x.best) memorable.push(`Biggest win: the ${nameOf(x.big.opp)}, ${score(x.big)} in ${weekName(x.big.n).replace(/^Week/, "week")}.`);
  if (x.close) memorable.push(`Closest loss: the ${nameOf(x.close.opp)}, ${score(x.close)} in ${weekName(x.close.n).replace(/^Week/, "week")}.`);
  const L = x.leaders, ld = [], v = (st, k) => st[k] || 0, yds = (st, k) => numText(v(st, k));
  if (L.pass) ld.push(`Passing: ${fullName(L.pass[0])}, ${v(L.pass[1], "pc")} of ${v(L.pass[1], "pa")} for ${yds(L.pass[1], "py")} yards, ${plural(v(L.pass[1], "ptd"), "touchdown")} and ${plural(v(L.pass[1], "pi"), "interception")}.`);
  if (L.rush) ld.push(`Rushing: ${fullName(L.rush[0])}, ${yds(L.rush[1], "ry")} yards on ${plural(v(L.rush[1], "ru"), "carry", "carries")}, ${plural(v(L.rush[1], "rtd"), "touchdown")}.`);
  if (L.rec) ld.push(`Receiving: ${fullName(L.rec[0])}, ${plural(v(L.rec[1], "rec"), "catch", "catches")} for ${yds(L.rec[1], "rcy")} yards, ${plural(v(L.rec[1], "rctd"), "touchdown")}.`);
  if (L.tk) ld.push(`Tackles: ${fullName(L.tk[0])}, ${v(L.tk[1], "tk")}.`);
  if (L.sck) ld.push(`Sacks: ${fullName(L.sck[0])}, ${v(L.sck[1], "sck")}.`);
  if (L.int) ld.push(`Interceptions: ${fullName(L.int[0])}, ${v(L.int[1], "int")}.`);
  const better = x.improved.map(y => `${fullName(y.p)}, ${YEAR_NAMES[y.p.yr]} ${posName(y.p.pos)}: ${y.from} to ${y.to}.`);
  const record = [`${recText(x.all)} overall, ${x.reg.dw}-${x.reg.dl} in district.`];
  // Where you finished, against where your starters ranked before the season
  if (x.place) record.push(`Finished ${ordWord(x.place - 1)} in District ${SEASON.district}${x.expect ? `, with ${x.expect === 1 ? "the best" : `the ${ordWord(x.expect - 1)}-best`} starters in the district before the season` : ""}.`);
  record.push(`${x.finish}.`, `Scored ${numText(x.pf)} points and allowed ${numText(x.pa)}, about ${Math.round(x.pf / n)} to ${Math.round(x.pa / n)} a game.`);
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">Season summary · Class 1A, District ${SEASON.district}</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(me))}</h2>
      <p class="muted">${esc(`${recText(x.all)}. ${x.finish}.`)}</p>
    </div>
    ${x.champ ? `<section class="panel teamcard" style="--team:${s.color}"><p class="eyebrow">Class 1A state champions</p><h3>You won it all</h3></section>` : ""}
    <section class="panel"><h3>The record</h3>${list(record)}</section>
    ${memorable.length ? `<section class="panel"><h3>Games to remember</h3>${list(memorable)}</section>` : ""}
    ${ld.length ? `<section class="panel"><h3>Leaders</h3>${list(ld)}</section>` : ""}
    <section class="panel"><h3>Most improved</h3>${better.length ? list(better) : `<p>Nobody's overall rating went up this season.</p>`}</section>
    <section class="panel"><h3>Your coach</h3><p>${esc(coachFullName(c))}${BACKGROUNDS[c.bg] ? `, ${esc(BACKGROUNDS[c.bg].name.toLowerCase())}` : ""}. ${esc(ratingsLine(c))}.</p>
      ${CAREER && CAREER.seasons.length > 1 ? list(CAREER.seasons.map(careerLine)) : ""}
      <button class="btn ghost" data-a="coach">Your coach</button></section>
    <section class="panel">
      <h3>What's next</h3>
      <p class="muted">The offseason: your seniors graduate, the rest of the team gets a summer older, and a new class of freshmen comes out. Or start over with a new coach.</p>
      <button class="btn" data-a="${SEASON.phase === "offseason" ? "season" : "offseason"}">${SEASON.phase === "offseason" ? "Back to the offseason" : "On to the offseason"}</button>
      <button class="btn ghost" data-a="newcareer">${confirming === "newcareer" ? "Tap again to start over" : "Start a new career"}</button>
    </section>
    ${SEASON.phase === "over" ? `<button class="btn ghost" data-a="back">Back to the season</button>` : ""}`;
}

/* ---------- Saves ---------- */
// What the saves screen is doing: its last message, a save waiting to be loaded, a cloud save that
// changed elsewhere, and the save code (made in the background when the screen opens, so Copy can
// put it on the clipboard right away). None of it is saved.
let saveMsg = "", pendingLoad = null, cloudConflict = false, savesBusy = false, codeCache = null, exportText = "";
function openSaves() {
  saveMsg = ""; pendingLoad = null; cloudConflict = false; exportText = ""; importText = "";
  prepCode();
  checkStorage();
  APP.screen = "saves";
}
function prepCode() {
  codeCache = null;
  const p = encodeSave(portableSave());
  p.then(c => { codeCache = c; }, () => {});
  return p;
}
// A message from the saves screen: read out where you are
function setSaveMsg(msg) { saveMsg = msg; focusNext = { id: "savemsg" }; }
function showSaveMsg(msg) {
  saveMsg = msg; savesBusy = false;
  save();
  if (APP.screen === "saves") { focusNext = { id: "savemsg" }; render(); } else { render(); announce(msg); }
}
function vSaves() {
  const C = APP.cloud, dis = savesBusy ? " disabled" : "", back = readBackup();
  // A save waiting to be loaded: what it holds, and what it replaces (read out first, in place of a message)
  const P = pendingLoad ? `<section class="panel">
      <p id="savemsg" tabindex="-1">${esc(`${pendingLoad.what}: ${saveSummary(pendingLoad.save)}. Loading it replaces the game on this device, ${saveSummary(currentSave())}. The game on this device is kept as a backup you can switch back to.`)}</p>
      <div class="choices"><button class="btn" data-a="loadyes">Load it</button><button class="btn ghost" data-a="loadno">Keep my game</button></div>
    </section>` : "";
  const conflict = cloudConflict ? `<section class="panel">
      <div class="choices"><button class="btn" data-a="cloudforce"${dis}>Replace the cloud save</button><button class="btn ghost" data-a="cloudpull"${dis}>Load the cloud save</button></div>
    </section>` : "";
  const keep = storeKept === false ? `<section class="panel"><h3>Storage</h3><p class="muted">Some browsers clear a site's storage after a while without visits. You can ask yours to keep the game's.</p><button class="btn ghost" data-a="persist">Ask to keep the game's storage</button></section>` : "";
  return `
    <div class="masthead">
      <p class="eyebrow">Saves</p>
      <h2 data-focus tabindex="-1">Cloud saves and save codes</h2>
      <p class="muted">The game saves on this device as you play. To play on another device, or to keep a backup, save to the cloud or keep a save code.</p>
    </div>
    ${saveMsg && !pendingLoad ? `<p class="banner" id="savemsg" tabindex="-1">${esc(saveMsg)}</p>` : ""}
    ${P}${conflict}
    <section class="panel">
      <h3>Cloud save</h3>
      ${C && C.key ? `<p>Your cloud save code is <b>${keyText(C.key)}</b>. Last saved or loaded on this device ${esc(dateText(C.at))}.</p>`
        : `<p class="muted">Save to the cloud to get a 12-character cloud save code. Enter it on another device to load your game there. Anyone with the code can load or replace the save, so keep it like a password.</p>`}
      <button class="btn" data-a="cloudsave"${dis}>${C && C.key ? "Save to the cloud now" : "Save to the cloud"}</button>
      <div class="form"><label for="cloudkey">Load a cloud save code</label><input type="text" id="cloudkey" class="codein" data-in="cloudkey" data-enter="cloudfind" value="${esc(cloudKeyText)}" maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go"></div>
      <button class="btn ghost" data-a="cloudfind"${dis}>Find the cloud save</button>
    </section>
    <section class="panel">
      <h3>Save code</h3>
      <p class="muted">Your whole game as text. Keep it in Notes or an email, or as a file, and load it here on any device.</p>
      <div class="choices"><button class="btn ghost" data-a="copycode">Copy your save code</button><button class="btn ghost" data-a="savefile">Save it as a file</button></div>
      ${exportText ? `<div class="form"><label for="exportbox">Your save code</label><textarea id="exportbox" readonly>${esc(exportText)}</textarea></div>` : ""}
      <div class="form"><label for="importbox">Paste a save code</label><textarea id="importbox" data-in="importtext" spellcheck="false" autocomplete="off">${esc(importText)}</textarea></div>
      <button class="btn ghost" data-a="loadcode"${dis}>Load this save code</button>
      <div class="form"><label for="importfile">Or open a save file</label><input type="file" id="importfile" accept=".txt,text/plain"></div>
    </section>
    ${back ? `<section class="panel"><h3>Backup</h3><p class="muted">${esc(`The game you had before your last load or new career: ${saveSummary(back)}.`)}</p><button class="btn ghost" data-a="undoload">${confirming === "undoload" ? "Tap again to switch back" : "Switch back to it"}</button></section>` : ""}
    ${keep}`;
}
// Copy: the code was made when the screen opened, so the clipboard gets it during the tap (Safari
// insists). A tap before it's ready waits for it, and may have to ask for a manual copy.
const COPIED = "Your save code is copied. Paste it into Notes or an email to keep it safe. It's also in the Your save code box below.";
const COPY_BY_HAND = "Your save code is in the Your save code box below. Select all of its text and copy it, then keep it in Notes or an email.";
function copyCode() {
  const put = code => {
    exportText = code;
    let p = null;
    try { if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) p = navigator.clipboard.writeText(code); } catch (e) { p = null; }
    if (p && p.then) p.then(() => showSaveMsg(COPIED), () => showSaveMsg(COPY_BY_HAND)); else showSaveMsg(COPY_BY_HAND);
  };
  if (codeCache) put(codeCache); else prepCode().then(put, () => showSaveMsg("The save code couldn't be made."));
}
function saveFile() {
  const put = code => {
    try {
      const url = URL.createObjectURL(new Blob([code], { type: "text/plain" })), a = document.createElement("a"), d = new Date();
      a.href = url; a.download = `friday-to-sunday-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.txt`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 20000);
      showSaveMsg("Your save file should be downloading. Keep it somewhere safe, and open it here on any device to load your game. If nothing downloads, copy your save code instead.");
    } catch (e) { showSaveMsg("This browser couldn't save a file. Copy your save code instead."); }
  };
  if (codeCache) put(codeCache); else prepCode().then(put, () => showSaveMsg("The save code couldn't be made."));
}
// Reads a save code (pasted, or from a file). A good one waits for Load it or Keep my game.
function checkCode(text, what) {
  savesBusy = true; pendingLoad = null;
  return decodeSave(text).then(r => {
    if (r.err) { showSaveMsg(r.err); return; }
    pendingLoad = { save: r.save, what };
    showSaveMsg("");
  }, () => showSaveMsg("That save code couldn't be read."));
}
function openSaveFile(file) {
  if (!file || !file.text || APP.screen !== "saves") return;
  file.text().then(t => checkCode(t, "This save file holds"), () => showSaveMsg("That file couldn't be read."));
}
// Loads a save in place of the game on this device, keeping that game as the backup
function adoptSave(d, cloud) {
  keepBackup();
  APP = d.app; S = d.game && d.game.teams ? d.game : null; SEASON = d.season || null; CAREER = d.career || null;
  if (!APP.ex) newExhibition();
  if (cloud) APP.cloud = cloud;
  relinkCareer();
  if (SEASON && isMyGame() && S.phase === "final") recordMyGame();
  recordCareerSeason();
  APP.screen = "saves"; helpOpen = false;
  save();
  prepCode();
}
function cloudSaveNow(force) {
  savesBusy = true; cloudConflict = false; setSaveMsg("Saving to the cloud.");
  cloudSave(force).then(r => { cloudConflict = !!r.conflict; showSaveMsg(r.msg); }, () => showSaveMsg(CONN_ERR));
}
function cloudFindNow(text) {
  savesBusy = true; pendingLoad = null; setSaveMsg("Looking for the cloud save.");
  cloudFind(text).then(r => {
    if (r.found) { cloudConflict = false; pendingLoad = { save: r.found.save, cloud: r.found.cloud, what: `The cloud save from ${dateText(r.found.cloud.at)} holds` }; }
    showSaveMsg(r.found ? "" : r.msg);
  }, () => showSaveMsg(CONN_ERR));
}
// The saves screen's buttons. Returns false for anything else.
function savesAct(a) {
  switch (a) {
    case "saves": openSaves(); scrollTop(); return true;
    case "copycode": copyCode(); return true;
    case "savefile": saveFile(); return true;
    case "loadcode":
      if (!importText.trim()) setSaveMsg("Paste a save code into the Paste a save code box first.");
      else if (!savesBusy) checkCode(importText, "This save code holds");
      return true;
    case "loadyes": {
      if (!pendingLoad) return true;
      const L = pendingLoad; pendingLoad = null; cloudConflict = false;
      adoptSave(L.save, L.cloud);
      exportText = ""; importText = "";
      setSaveMsg(`Loaded: ${saveSummary(currentSave())}. The game you had before is kept as a backup on this screen.`);
      return true;
    }
    case "loadno": pendingLoad = null; setSaveMsg("You kept the game on this device."); return true;
    case "undoload": {
      if (!confirmed("undoload")) return true;
      const b = readBackup(), r = b ? checkSave(b) : null;
      if (!r || r.err) { setSaveMsg(r ? r.err : "There's no backup to switch back to."); return true; }
      adoptSave(r.save, null);
      exportText = "";
      setSaveMsg(`Switched back: ${saveSummary(currentSave())}. The game you just left is the backup now, so you can switch again.`);
      return true;
    }
    case "cloudsave": if (!savesBusy) cloudSaveNow(false); return true;
    case "cloudforce": if (!savesBusy) cloudSaveNow(true); return true;
    case "cloudfind": if (!savesBusy) cloudFindNow(cloudKeyText); return true;
    case "cloudpull": if (!savesBusy && APP.cloud && APP.cloud.key) cloudFindNow(APP.cloud.key); return true;
    case "persist": askPersist().then(v => showSaveMsg(v ? "Your browser will keep the game's storage." : "Your browser said no for now. Installing the game as an app, or adding it to your Home Screen, usually changes that.")); return true;
  }
  return false;
}
