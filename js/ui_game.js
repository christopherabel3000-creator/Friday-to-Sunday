// Friday to Sunday: the game screens (from Gridiron Duel, with players, high school rules and the
// high school overtime added)
"use strict";

/* ---------- Scoreboard and field ---------- */
function board() {
  const t = S.teams, inGame = S.phase !== "final", tossing = S.phase === "toss";
  const team = i => `
    <div class="bteam ${i ? "right" : ""}" style="--team:${t[i].color}" aria-hidden="true">
      <span class="stripe"></span>
      <div class="id"><span class="abbr">${inGame && !tossing && S.poss === i ? '<span class="ballmark" title="Has the ball"></span>' : ""}${esc(t[i].abbr)}</span><span class="full">${esc(t[i].school)}</span>${inGame && S.tos ? `<span class="tos">${[0, 1, 2].slice(0, Math.max(S.tos[i], R().timeouts)).map(k => `<i class="${k < S.tos[i] ? "on" : ""}"></i>`).join("")}</span>` : ""}</div>
      <span class="pts">${t[i].score}</span>
    </div>`;
  return `<header class="board" aria-label="Scoreboard">
    <p class="sr-only">${esc(boardSummary())}</p>
    ${team(0)}
    <div class="bmid" aria-hidden="true"><span class="q">${S.phase === "final" ? "FINAL" : qLabel(S.quarter)}</span><span class="clk">${noClock() ? "OT" : fmtClock(S.clock)}</span></div>
    ${team(1)}
    ${tossing ? `<div class="sit" aria-hidden="true"><b>${S.toss && S.toss.ot ? "Overtime" : "Coin toss"}</b><span>${S.toss && S.toss.ot ? `Tied ${S.teams[0].score}-${S.teams[1].score}` : "Opening kickoff"}</span></div>` : inGame && sitNow() ? `<div class="sit" aria-hidden="true"><b>${esc(sitNow())}</b></div>` : inGame ? `<div class="sit" aria-hidden="true"><b>${S.twoPt && S.phase !== "result" ? "Two-point try" : downText()}</b><span>Ball on ${spotText(S.poss, S.spot)}${S.runClock ? " · Running clock" : ""}</span></div>` : ""}
  </header>`;
}
// What the scoreboard says, as one sentence for screen readers
function boardSummary() {
  const t = S.teams, sc = `${t[0].name} ${t[0].score}, ${t[1].name} ${t[1].score}.`;
  if (S.phase === "final") return `Final. ${sc}`;
  const per = S.quarter <= 4 ? `${ord(S.quarter)} quarter` : S.quarter === 5 ? "Overtime" : `Overtime ${S.quarter - 4}`;
  let txt = noClock() ? `${sc} ${per}, no clock.` : `${sc} ${per}, ${fmtClock(S.clock)} left.${S.runClock ? " Running clock." : ""}`;
  if (S.phase === "toss") return txt + (S.toss && S.toss.ot ? "" : " Coin toss.");
  // Between a score and the next snap, the down and distance don't apply
  const sit = sitNow();
  txt += sit ? ` ${sit}.` : ` ${t[S.poss].name} have the ball, ${S.twoPt && S.phase !== "result" ? "two-point try" : downText().replace("&", "and")}, ball on the ${spotText(S.poss, S.spot)}.`;
  if (S.tos && !noClock()) txt += ` Timeouts: ${t[0].abbr} ${S.tos[0]}, ${t[1].abbr} ${S.tos[1]}.`;
  return txt;
}
// What's next when it isn't a snap: a point after or a kickoff
function sitNow() {
  if (S.phase === "pat" || S.phase === "trychoice") return `Point after for the ${tname(S.patTeam)}`;
  if (S.phase === "kickchoice" && S.kickChoice) return `${tname(S.kickChoice.team)} kick off next`;
  return "";
}
// A spot on the field (0 to 100, home team driving left to right) in words
const absSpot = x => x >= 100 ? `${abbr(1)} end zone` : x <= 0 ? `${abbr(0)} end zone` : spotText(0, Math.round(x));
function field(opts) {
  const t = S.teams, pctX = x => ((10 + clamp(x, -9, 109)) / 120 * 100).toFixed(2) + "%";
  let nums = "";
  for (let x = 10; x <= 90; x += 10) nums += `<span class="yn" style="left:${pctX(x)}">${x <= 50 ? x : 100 - x}</span>`;
  let marks = "";
  if (opts.los != null) marks += `<span class="mk los" style="left:${pctX(opts.los)}"></span>`;
  if (opts.fd != null) marks += `<span class="mk fd" style="left:${pctX(opts.fd)}"></span>`;
  if (opts.from != null) { const a = Math.min(opts.from, opts.ball), b = Math.max(opts.from, opts.ball); marks += `<span class="trail" style="left:${pctX(a)};width:calc(${pctX(b)} - ${pctX(a)})"></span>`; }
  marks += `<span class="ball" style="left:${pctX(opts.ball)}"></span>`;
  const lbl = opts.label || (opts.from != null && opts.from !== opts.ball ? `Field. The play went from the ${absSpot(opts.from)} to the ${absSpot(opts.ball)}.` : `Field. Ball on the ${absSpot(opts.ball)}.`);
  return `<div class="field" role="img" aria-label="${esc(lbl)}">
    <div class="turf"></div>
    <div class="ez l" style="--team:${t[0].color}"><span>${esc(t[0].abbr)}</span></div>
    <div class="ez r" style="--team:${t[1].color}"><span>${esc(t[1].abbr)}</span></div>
    ${nums}${marks}
  </div>`;
}
function liveField() {
  const x = fx(S.poss, S.spot), fd = fx(S.poss, Math.min(S.spot + S.toGo, 100));
  const lbl = `Field. Ball on the ${spotText(S.poss, S.spot)}${S.spot + S.toGo >= 100 ? ", goal to go" : `, first-down line at the ${spotText(S.poss, S.spot + S.toGo)}`}.`;
  return field({ ball: x, los: x, fd: S.spot + S.toGo >= 100 ? null : fd, label: lbl }) +
    `<div class="legend" aria-hidden="true"><span><i style="background:#3E8EEA"></i>Line of scrimmage</span>${S.spot + S.toGo >= 100 ? "" : '<span><i style="background:var(--firstdown)"></i>First-down line</span>'}<span>${esc(tname(0))} drive left to right</span></div>`;
}
const bannerHtml = () => S.banner ? `<p class="banner">${esc(S.banner)}</p>` : "";
// The players a package puts on the field, by last name: "QB Reyes · RB Hill, tired · WR Banks, Tate"
function onFieldLine(t, pk) {
  const lu = onField(t, pk), order = ["QB", "RB", "TE", "WR", "OL", "DL", "LB", "CB", "S", "K", "P"];
  const nm = p => p.en != null && p.en < 65 ? `${p.last} (${energyWord(p.en)})` : p.last;
  const tiredLine = (lu.OL || []).filter(p => p.en != null && p.en < 65).map(nm);
  return order.filter(pos => lu[pos] && lu[pos].length && pos !== "OL").map(pos => `${pos} ${lu[pos].map(nm).join(", ")}`)
    .concat(tiredLine.length ? [`OL ${tiredLine.join(", ")}`] : []).join(" · ");
}

/* ---------- Calling a play ---------- */
function fitTagFor(pk, id) {
  const f = (PKG_FIT[pk] || {})[id] || 0, cm = ((OFF_PKGS[pk] || {}).comp || {})[id] || 1;
  if (f <= -1.5 || cm <= .4) return " · very poor fit";
  if (f <= -.5) return " · poor fit";
  if (f >= 1) return " · great fit";
  if (f >= .5) return " · good fit";
  return "";
}
// At the line: the offense reads the defense's look and can change the play once
function vLOS() {
  const o = S.poss, d = 1 - o, tm = S.teams[o], L = LOOKS[S.look.d], cur = OFFP[S.offCall];
  const card = id => `<button class="play" data-a="audpick" data-v="${id}" aria-pressed="${S.audSel === id}">
      <span class="tag">${OFFP[id].tag + fitTagFor(S.offPkg, id) + styleTag(true, id, o)}</span><span class="sr-only">. </span><span class="nm">${OFFP[id].name}</span><span class="sr-only">. </span><span class="ds">${OFFP[id].desc}</span></button>`;
  const to = S.audSel && OFFP[S.audSel];
  return `${board()}
    <div style="--team:${tm.color};display:grid;gap:14px">
      <div class="callhead" data-focus tabindex="-1">
        <p class="eyebrow">${esc(tm.name)} · At the line</p>
        <h2>Read the defense</h2>
        <p class="muted">${S.twoPt ? `Two-point try from the ${spotText(o, S.spot)}` : `${downText()} at the ${spotText(o, S.spot)}`}. You can audible once. Changing the play adds a small risk of a false start or delay of game${S.wasRunning ? " and burns a few seconds" : ""}.</p>
      </div>
      ${liveField()}
      <p class="banner">${esc(tname(d))} are in <b>${DEF_PKGS[S.defPkg].name}</b> (${DEF_PKGS[S.defPkg].who}).</p>
      <div class="lookcard"><span class="eyebrow">The look</span><span class="lk">${L.name}</span><span class="lh muted">${L.hint} Defenses disguise it sometimes, so it is not a sure thing.</span></div>
      <div class="mycall"><span class="eyebrow">Your call · ${OFF_PKGS[S.offPkg].short}</span><span class="nm">${cur.name}${S.offSide ? " · Sideline" : ""}</span></div>
      ${S.offSide ? `<p class="muted" style="font-size:14px">Checking to a play without a sideline version (Inside Run, Tackle Eligible) drops the sideline call.</p>` : ""}
      <p class="sechead">Check to</p>
      <div class="plays">${audIds().map(card).join("")}</div>
      <div class="lockbar two">
        ${to ? `<button class="btn team" data-a="audible">Audible to ${esc(to.name)}</button>` : ""}
        <button class="btn ${to ? "ghost" : "team"}" data-a="snap">Run ${esc(cur.name)}</button>
      </div>
    </div>`;
}
// Typical punt for this team's punter
const puntAvg = t => Math.round(22 + .28 * punterOf(t).r.leg);
function vCall() {
  const isOff = S.side === "off", t = isOff ? S.poss : 1 - S.poss, tm = S.teams[t];
  const choices = pkgChoices(isOff);
  let pk = S.pkgSel || (isOff ? "p11" : "nickel");
  if (!choices.includes(pk)) pk = choices[0];
  const kickUnit = isOff && isST(pk);
  const ids = isOff ? (kickUnit ? [] : offIds(pk)) : DEF_IDS, book = isOff ? OFFP : DEFP;
  const fitTag = id => (isOff ? fitTagFor(pk, id) : "") + styleTag(isOff, id, t);
  const pkgBook = isOff ? { ...OFF_PKGS, ...ST_PKGS } : DEF_PKGS;
  const pkgBtn = id => `<button class="pkg${isST(id) ? " stpkg" : ""}" data-a="pkg" data-v="${id}" aria-pressed="${pk === id}">
      <span class="pn">${pkgBook[id].name}</span><span class="sr-only">: </span><span class="pw">${pkgBook[id].who}</span></button>`;
  const regIds = choices.filter(id => !isST(id)), stIds = choices.filter(isST);
  const lockNote = S.nhLock && (isOff || !isST(S.offPkg))
    ? `<p class="banner">No huddle. Personnel is locked: ${isOff ? "you stay" : "you're stuck"} in <b>${pkgBook[S.nhLock[isOff ? "off" : "def"]].name}</b>${isOff && stIds.length ? ", unless you send out the kicking unit" : ""}.</p>` : "";
  const fgNote = isOff && S.down < 4 && stIds.includes("fgu") ? (hsOT() ? "In overtime you can kick on any down." : otFgWins() ? "A field goal wins it, so you can send out the field goal unit on any down." : "") : "";
  const pkgPicker = `<p class="sechead">${isOff ? "Personnel" : "Your package"}</p>${lockNote}
    ${regIds.length > 1 || stIds.length ? `<div class="pkgs ${isOff && regIds.length > 1 ? "" : "two"}">${regIds.map(pkgBtn).join("")}</div>` : ""}
    ${stIds.length ? `<p class="sechead">Special teams unit</p>${fgNote ? `<p class="muted pkdesc">${fgNote}</p>` : ""}<div class="pkgs two">${stIds.map(pkgBtn).join("")}</div>` : ""}
    <p class="muted pkdesc">${esc(pkgBook[pk].desc)}${isOff && S.down === 4 && !S.twoPt && stIds.length ? " The defense sees who runs onto the field before they call it." : ""}</p>
    ${!kickUnit ? `<p class="muted onfield">On the field: ${esc(onFieldLine(t, pk))}.</p><button class="linkbtn" data-a="lineup">Change the lineup</button>` : ""}`;
  const theirPkg = !isOff && S.offPkg ? `<p class="banner">${esc(tname(S.poss))} ${isST(S.offPkg)
      ? `sent out the <b>${ST_PKGS[S.offPkg].name.toLowerCase()}</b> (${ST_PKGS[S.offPkg].who}). They're lining up to kick, but it could be a fake.`
      : `are in <b>${OFF_PKGS[S.offPkg].name}</b> (${OFF_PKGS[S.offPkg].who}).${S.down === 4 && !S.twoPt && !hsOT() ? " They kept the offense on the field: they're going for it." : ""} Their play is hidden.`}</p>` : "";
  const card = (id, nm, tag, ds, extra) => `<button class="play ${extra || ""}" data-a="pick" data-v="${id}" aria-pressed="${S.sel === id}">
      <span class="tag">${tag}</span><span class="sr-only">. </span><span class="nm">${nm}</span><span class="sr-only">. </span><span class="ds">${ds}</span></button>`;
  let st = "";
  if (isOff && !kickUnit && kneelAvailable()) {
    st += `<p class="sechead">Run out the clock</p><div class="plays">` +
      card("kneel", "Kneel down", "Clock", `Take a knee. Lose a yard and let about 40 seconds run off. ${esc(tname(1 - S.poss))} have no timeouts left.`, "st") + `</div>`;
  }
  if (kickUnit) {
    st += `<p class="sechead">Kick</p><div class="plays">`;
    if (pk === "punt") st += card("punt", "Punt", "Kick", `Flip the field. ${esc(punterOf(t).last)} averages about ${puntAvg(t)} yards.`, "st");
    else { const k = kickDist(); st += card("fg", `${k}-yd field goal`, "Kick", `${esc(kickerOf(t).last)} makes it about ${Math.round(fgProbFor(t, k) * 100)}% of the time from here.`, "st"); }
    st += `</div><p class="sechead">Trick play</p><div class="plays">`;
    if (pk === "punt") st += card("fp", "Fake Punt", "Trick", "Line up to punt, then run or throw for the first down. Deadly if they sell out for the kick.", "st");
    else st += card("ffg", "Fake Field Goal", "Trick", "The holder keeps it. Works if they rush the kick, gets stuffed if they don't.", "st");
    st += `</div>`;
  }
  if (!isOff && isST(S.offPkg)) {
    st += `<p class="sechead">Special teams</p><div class="plays">`;
    st += card("blk", DEFP.blk.name, DEFP.blk.tag, DEFP.blk.desc, "st");
    if (S.offPkg === "punt") st += card("ret", DEFP.ret.name, DEFP.ret.tag, DEFP.ret.desc, "st");
    st += `</div>`;
  }
  const canSide = isOff && !kickUnit && sidelineOK(), sideNow = canSide && !!S.selSide && sideOn(S.sel);
  // Defense: show the real look at the line, or disguise it as another one
  const canDisg = !isOff && disguiseOK(), realCall = DEF_IDS.includes(S.sel) ? S.sel : null;
  const disgNow = canDisg && !!S.disgOn && !!realCall, fakeLook = disgNow && lookIdsFor(realCall).includes(S.disgSel) ? S.disgSel : null;
  const lookCard = id => `<button class="play" data-a="dlook" data-v="${id}" aria-pressed="${fakeLook === id}">
      <span class="tag">Look</span><span class="sr-only">. </span><span class="nm">${LOOKS[id].name}</span><span class="sr-only">. </span><span class="ds">${LOOKS[id].hint}</span></button>`;
  const disgPicker = canDisg ? `<p class="sechead">Pre-snap look</p>
      <div class="seg" role="group" aria-label="Pre-snap look">
        <button data-a="disg" data-v="0" aria-pressed="${!S.disgOn}">Show it<span class="sr-only">. </span><br><small class="muted">Line up in your real look</small></button>
        <button data-a="disg" data-v="1" aria-pressed="${!!S.disgOn}">Disguise it<span class="sr-only">. </span><br><small class="muted">Show something else</small></button>
      </div>
      <p class="muted pkdesc">${S.disgOn
        ? (realCall ? "Pick the look to show. A good fake can bait the offense into a bad audible, but rotating late leaves you a step slow at the snap: a small edge for the offense." : "Pick your call first, then the look to show.")
        : "The offense sees how you really line up. No cost, but a sharp offense will read it and check to a better play."}</p>
      ${disgNow ? `<p class="sechead">Show them</p><div class="plays">${lookIdsFor(realCall).map(lookCard).join("")}</div>
      ${fakeLook ? "" : `<p class="muted pkdesc">No look picked: a random one is shown.</p>`}` : ""}` : "";
  const sideToggle = canSide ? `<p class="sechead">Clock</p>
      <button class="btn ghost" data-a="side" aria-pressed="${sideNow}" ${sideOn(S.sel) ? "" : "disabled"} style="width:100%">${sideNow ? "Sideline: get out of bounds ✓" : "Run it to the sideline"}<span class="sr-only">. </span><br><small style="font-family:var(--body);font-weight:500;font-size:14px;text-transform:none">${sideOn(S.sel) || !S.sel ? "Stops the clock on most gains. Fewer yards, and Cover 2 sits on short throws to the sideline." : "Not available on this play."}</small></button>` : "";
  const selName = S.sel ? (S.sel === "punt" ? "Punt" : S.sel === "fg" ? "Field goal" : S.sel === "kneel" ? "Kneel down" : S.sel === "fp" ? "Fake punt" : S.sel === "ffg" ? "Fake field goal" : book[S.sel].name) : "";
  return `${board()}
    ${S.locked && !isOff && !bothHuman() ? "" : bannerHtml()}
    ${S.subNote ? `<p class="banner">${esc(S.subNote)}</p>` : ""}
    <div style="--team:${tm.color};display:grid;gap:14px">
      <div class="callhead" data-focus tabindex="-1">
        <p class="eyebrow">${esc(tm.name)} · ${isOff ? "Offense" : "Defense"}</p>
        <h2>${S.twoPt ? (isOff ? "Two-point play" : "Stop the two") : isOff ? "Call your play" : "Call your defense"}</h2>
        <p class="muted">${S.twoPt ? `Two-point try from the ${spotText(S.poss, S.spot)}` : `${downText()} at the ${spotText(S.poss, S.spot)}`}${isOff ? "" : `. ${esc(tname(S.poss))} have the ball`}.</p>
        <p class="muted idline">${isOff ? `Your ${OFF_STYLES[offStyleOf(t)].name} offense against their ${DEF_STYLES[defStyleOf(1 - t)].name} defense.` : `Your ${DEF_STYLES[defStyleOf(t)].name} defense against their ${OFF_STYLES[offStyleOf(1 - t)].name} offense.`}</p>
      </div>
      ${liveField()}
      ${theirPkg}
      ${pkgPicker}
      ${ids.length ? `<p class="sechead">${isOff ? "Plays" : "Calls"}</p>
      <div class="plays">${ids.map(id => card(id, book[id].name, book[id].tag + fitTag(id), book[id].desc)).join("")}</div>` : ""}
      ${st}
      ${sideToggle}
      ${disgPicker}
      <div class="lockbar"><button class="btn team" data-a="lock" ${S.sel ? "" : "disabled"}>${S.sel ? `Lock in ${esc(selName)}${sideNow ? " · Sideline" : ""}${disgNow ? ` · Disguised${fakeLook ? " as " + esc(LOOKS[fakeLook].name.toLowerCase()) : ""}` : ""}` : "Pick a call"}</button></div>
    </div>`;
}

/* ---------- Results and decisions ---------- */
// About how many seconds come off before the next snap, for the clock box
const midOf = ([a, b]) => Math.round((a + b) / 2 / 5) * 5;
function clockBox() {
  if (S.needPAT || S.tryChoice || S.retryTwo || S.kickChoice || S.periodOver || S.gameOver || !S.tos || noClock() || S.otEnd) return "";
  const o = S.poss, t = S.teams, RO = R().runoff;
  let stat;
  if (S.clockRunning) {
    const secs = S.spikeNext ? 10 : S.noHuddle ? midOf(RO.nh) : S.oobRestart ? midOf(S.readyWhy === "oob" ? RO.oob : RO.ready) : midOf(RO.run);
    const why = { fd: "The clock stopped for the first down and starts again when the ball is ready", pen: "The clock stopped for the penalty and starts again when the ball is ready",
      oob: "Out of bounds: the clock starts again when the ball is ready", to: "The running clock starts again when the ball is ready" }[S.readyWhy];
    stat = `${S.oobRestart && why ? why + ", so about" : `${S.runClock ? "Running clock" : "Clock running"}. About`} ${secs} seconds come off before the next snap.${S.noHuddle ? ` ${tname(o)} are going no huddle: nobody can change personnel.` : ""}`;
  } else stat = S.toNote ? S.toNote + " Clock stopped." : "Clock stopped until the next snap.";
  let btns = "";
  if (S.clockRunning) {
    [0, 1].forEach(i => { if (!t[i].cpu && S.tos[i] > 0 && !S.toUsed) btns += `<button class="btn ghost" data-a="to" data-t="${i}">${esc(t[i].abbr)} timeout (${S.tos[i]})</button>`; });
    if (!t[o].cpu && nhAvailable()) btns += `<button class="btn ghost" data-a="nohuddle" aria-pressed="${!!S.noHuddle}">${S.noHuddle ? "Going no huddle" : `${esc(t[o].abbr)}: no huddle`}</button>`;
    if (!t[o].cpu && (spikeOK() || S.spikeNext)) btns += `<button class="btn ghost" data-a="spike" aria-pressed="${!!S.spikeNext}">${S.spikeNext ? "Spiking next snap" : `${esc(t[o].abbr)}: spike next snap`}</button>`;
  }
  return `<div class="clockbox"><p class="cstat">${esc(stat)}</p>${btns ? `<div class="clockbtns">${btns}</div>` : ""}</div>`;
}
// After a human coach's score, the kickoff waits for the next tap: they can call an onside kick first
function onsideToggle() {
  const c = S.kickChoice;
  if (!c || !c.later || S.teams[c.team].cpu) return "";
  return `<button class="btn ghost" data-a="onside" aria-pressed="${!!c.onside}">${c.onside ? "Onside kick called" : `${esc(S.teams[c.team].abbr)}: onside kick`}</button>`;
}
function vResult() {
  const r = S.last, o = r.team, d = 1 - o;
  let offName, defName = r.defId ? DEFP[r.defId].name : null;
  if (r.offId === "punt") offName = "Punt"; else if (r.offId === "fg") offName = "Field goal";
  else if (r.offId === "xp") offName = "Extra point"; else if (r.offId === "two") offName = "Go for two";
  else if (r.offId === "spike") offName = "Spike";
  else if (r.offId === "kneel") offName = "Kneel down";
  else if (r.offId === "fp") offName = "Fake punt"; else if (r.offId === "ffg") offName = "Fake field goal";
  else if (r.offId === "onside") offName = "Onside kick"; else if (r.offId === "kickoff") offName = "Kickoff";
  else offName = OFFP[r.offId].name + (r.side ? " · Sideline" : "");
  let label = "Next play";
  if (S.needPAT || S.tryChoice) label = "Point after";
  else if (S.kickChoice) label = "Kickoff";
  else if (S.retryTwo) label = "Replay the try";
  else if (S.gameOver) label = "Final score";
  else if (S.otEnd) label = S.ot && S.ot.ser === 1 ? "Next series" : "Next overtime period";
  else if (S.periodOver) label = S.quarter === 2 ? "Go to halftime" : S.quarter >= 5 ? "End of the overtime period" : S.quarter === 4 ? "End of regulation" : "End of quarter";
  return `${board()}
    <section class="panel">
      <div class="calls">
        <div class="callchip" style="--team:${S.teams[o].color}"><div class="who">${esc(S.teams[o].abbr)} ${r.offId === "onside" || r.offId === "kickoff" ? "kickoff" : "offense"}</div><div class="nm">${offName}</div>${r.opk && OFF_PKGS[r.opk] && OFFP[r.offId] ? `<div class="pk">${OFF_PKGS[r.opk].name}</div>` : ""}${r.aud ? `<div class="pk">Audible from ${OFFP[r.aud.from].name}</div>` : ""}</div>
        ${defName ? `<div class="callchip" style="--team:${S.teams[d].color}"><div class="who">${esc(S.teams[d].abbr)} defense</div><div class="nm">${defName}</div>${r.dpk && DEF_PKGS[r.dpk] && OFFP[r.offId] ? `<div class="pk">${DEF_PKGS[r.dpk].name}</div>` : ""}</div>` : ""}
      </div>
      <div class="resmain" data-focus tabindex="-1">
      <h2 class="headline ${r.tone}">${r.head}</h2>
      ${r.read ? `<span class="read ${r.read.c}"><i aria-hidden="true"></i>${esc(r.read.t)}</span>` : ""}
      <p class="narr">${esc(r.text)}</p>
      ${r.audNote ? `<p class="audnote">${esc(r.audNote)}</p>` : ""}
      ${r.sub ? `<p class="next">${esc(r.sub)}</p>` : ""}
      ${r.subNote ? `<p class="audnote">${esc(r.subNote)}</p>` : ""}
      </div>
      ${r.tmw ? `<p class="banner">Two-minute warning. The clock is stopped.</p>` : ""}
      ${r.runNote ? `<p class="banner">Running clock: with a lead of ${R().runClock.margin} or more in the second half, the clock keeps running for the rest of the game.</p>` : ""}
      ${clockBox()}
      ${field({ ball: r.toX, los: r.fromX, from: r.fromX })}
      ${S.periodOver && !S.needPAT && !S.tryChoice && !S.retryTwo ? `<p class="banner">That's the end of ${S.quarter >= 5 ? "the overtime period" : "the " + ord(S.quarter) + " quarter"}.</p>` : ""}
      ${onsideToggle()}
      <button class="btn" data-a="cont">${label}</button>
    </section>`;
}
const SUB_STYLE = "font-family:var(--body);font-weight:500;font-size:15px;text-transform:none;letter-spacing:0;display:block;margin-top:4px;line-height:1.3";
function vPenalty() {
  const P = S.pen, pen = penOf(P.code), ch = S.teams[P.chooser], who = P.two ? P.who : P.r.who;
  const title = `${esc(pen.name)}${who ? ` on ${esc(who.last)}` : ""}, <span>${pen.on === "off" ? "offense" : "defense"}</span>`;
  if (P.two) {
    const acc = pen.on === "off"
      ? `The try moves back to the ${ydLine(P.spot - Math.min(pen.yds, Math.floor(P.spot / 2)))}. Then ${esc(tname(P.team))} choose: go for two again or kick.`
      : `Half the distance: the two-point try is replayed from the ${ydLine(Math.min(99, P.spot + Math.max(1, Math.floor((100 - P.spot) / 2))))}.`;
    const dec = P.good ? "The two-point try is good. 2 points count." : "The two-point try fails. No points.";
    return `${board()}
    <section class="panel handoff" style="--team:${ch.color}">
      <p class="eyebrow">Flag on the two-point try</p>
      <h2>${title}</h2>
      <p class="narr">${esc(P.text)}</p>
      <p class="muted">${esc(ch.name)} choose whether to accept the penalty.</p>
      <div style="display:grid;gap:10px">
        <button class="btn team" data-a="pen" data-v="1">Accept penalty<span style="${SUB_STYLE}">${acc}</span></button>
        <button class="btn ghost" data-a="pen" data-v="0">Decline, keep the result<span style="${SUB_STYLE}">${dec}</span></button>
      </div>
    </section>`;
  }
  const outcome = (x, isAccept) => {
    const sc = x.scores, pre = P.pre.scores;
    if (x.gameOver) return `${esc(tname(sc[0] > sc[1] ? 0 : 1))} win the game.`;
    if (sc[0] !== pre[0] || sc[1] !== pre[1]) {
      const w = sc[0] - pre[0] > sc[1] - pre[1] ? 0 : 1;
      return `${esc(tname(w))} score stands. ${esc(abbr(0))} ${sc[0]}, ${esc(abbr(1))} ${sc[1]}.`;
    }
    if (x.otEnd) return "The series is over.";
    const lead = isAccept ? esc(P.accDesc) + " " : "";
    if (x.poss !== P.pre.poss) return `${lead}${esc(tname(x.poss))} ball, ${downTextOf(x)} at the ${spotText(x.poss, x.spot)}.`;
    return `${lead}${downTextOf(x)} at the ${spotText(x.poss, x.spot)}.`;
  };
  return `${board()}
    <section class="panel handoff" style="--team:${ch.color}">
      <p class="eyebrow">Flag on the play</p>
      <h2>${title}</h2>
      <p class="narr">${esc(P.r.text)}</p>
      <p class="muted">${esc(ch.name)} choose whether to accept the penalty.</p>
      <div style="display:grid;gap:10px">
        <button class="btn team" data-a="pen" data-v="1">Accept penalty<span style="${SUB_STYLE}">${outcome(P.acc, true)}</span></button>
        <button class="btn ghost" data-a="pen" data-v="0">Decline, keep the play<span style="${SUB_STYLE}">${outcome(P.post, false)}</span></button>
      </div>
    </section>`;
}
const SMALL_STYLE = "font-family:var(--body);font-weight:500;font-size:14px;text-transform:none";
function vTry() {
  const c = S.tryChoice, tm = S.teams[c.team], d = xpDist(c.spot);
  return `${board()}
    <section class="panel handoff" style="--team:${tm.color}">
      <p class="eyebrow">${esc(tm.name)} · Point after</p>
      <h2>Go for two again or <span>kick it</span>?</h2>
      <p class="muted">After the penalty, the try is at the ${ydLine(c.spot)}. An extra point would be a ${d}-yard kick.</p>
      <div class="choices">
        <button class="btn team" data-a="try" data-v="kick">Kick<span class="sr-only">. </span><br><small style="${SMALL_STYLE}">1 point · ${d} yards · about ${Math.round(fgProbFor(c.team, d) * 100)}%</small></button>
        <button class="btn ghost" data-a="try" data-v="two">Go for two<span class="sr-only">. </span><br><small style="${SMALL_STYLE}">2 points · play from the ${100 - c.spot}</small></button>
      </div>
    </section>`;
}
function vKick() {
  const k = S.kickChoice.team, tm = S.teams[k], down = S.teams[1 - k].score - tm.score, Rl = R();
  const odds = Math.round(1 / Rl.onside.expected);
  return `${board()}
    <section class="panel handoff" style="--team:${tm.color}">
      <p class="eyebrow">${esc(tm.name)} · Kickoff</p>
      <h2>Kick deep or go <span>onside</span>?</h2>
      <p class="muted">Down ${down} with ${fmtClock(S.clock)} left${S.tos ? ` and ${plural(S.tos[k], "timeout")}` : ""}. ${Rl.onside.declared ? `An onside kick has to be announced, so ${esc(tname(1 - k))} will have their hands team ready.` : `Trailing this late, ${esc(tname(1 - k))} will be expecting one.`}</p>
      <div class="choices">
        <button class="btn ghost" data-a="kick" data-v="deep">Kick deep<span class="sr-only">. </span><br><small style="${SMALL_STYLE}">They usually start around their 30</small></button>
        <button class="btn team" data-a="kick" data-v="onside">Onside kick<span class="sr-only">. </span><br><small style="${SMALL_STYLE}">About 1 in ${odds} recovered. Miss and they start near midfield</small></button>
      </div>
    </section>`;
}
function vToss() {
  const t = S.toss;
  const who = t.step === "call" ? VISITOR : t.winner, tm = S.teams[who];
  const head = t.ot ? "Overtime" : "Coin toss";
  if (t.step === "call") return `${board()}
    ${t.lead ? `<p class="banner">${esc(t.lead)}</p>` : ""}
    <section class="panel handoff" style="--team:${tm.color}">
      <p class="eyebrow">${esc(tm.name)} · ${t.ot ? "Overtime coin toss" : "Coin toss"}</p>
      <h2>${esc(tm.name)}, call it in the <span>air</span></h2>
      <p class="muted">The visiting team makes the call. Whoever wins the toss chooses ${t.hs ? "to go on offense or defense first" : t.ot ? "to receive or kick" : "to receive the opening kickoff or defer to the second half"}.</p>
      <div class="choices">
        <button class="btn team" data-a="toss" data-v="heads">Heads</button>
        <button class="btn ghost" data-a="toss" data-v="tails">Tails</button>
      </div>
    </section>`;
  const other = esc(tname(1 - who));
  const opts = t.hs
    ? [["defense", "Defense first", "See what you need before your series"], ["offense", "Offense first", `Set the target for ${other}`]]
    : t.ot ? [["receive", "Receive", "Get the ball first"], ["kick", "Kick", `${other} get the ball first`]]
    : [["receive", "Receive", `Get the ball first. ${other} get it to start the 2nd half`], ["defer", "Defer", "Kick off now, get the ball to start the 2nd half"]];
  return `${board()}
    ${t.noFlip ? `<p class="banner">${esc(t.lead)}</p>` : `<p class="banner">${esc(tname(VISITOR))} call ${t.call}. It's ${t.flip}!</p>`}
    <section class="panel handoff" style="--team:${tm.color}">
      <p class="eyebrow">${esc(tm.name)} · ${head}</p>
      <h2>${t.noFlip ? `<span>${esc(tm.name)}</span> choose` : `<span>${esc(tm.name)}</span> win the toss`}</h2>
      <div class="choices">
        ${opts.map(([v, l, s], i) => `<button class="btn ${i ? "ghost" : "team"}" data-a="toss" data-v="${v}">${l}<span class="sr-only">. </span><br><small style="${SMALL_STYLE}">${s}</small></button>`).join("")}
      </div>
    </section>`;
}
function vPAT() {
  const t = S.patTeam, tm = S.teams[t], xp = Math.round(fgProbFor(t, xpDist(R().tryTwo)) * 100);
  return `${board()}
    <section class="panel handoff" style="--team:${tm.color}">
      <p class="eyebrow">${esc(tm.name)} · Point after</p>
      <h2>Kick it or go for <span>two</span>?</h2>
      <div class="choices">
        <button class="btn team" data-a="pat" data-v="kick">Kick<span class="sr-only">. </span><br><small style="${SMALL_STYLE}">1 point · ${esc(kickerOf(t).last)}, about ${xp}%</small></button>
        <button class="btn ghost" data-a="pat" data-v="two">Go for two<span class="sr-only">. </span><br><small style="${SMALL_STYLE}">2 points · run a play from the ${100 - R().tryTwo}</small></button>
      </div>
    </section>`;
}

/* ---------- Halftime report ---------- */
const BUCKET_HEAD = { s: "Short yardage (3 or less to go)", m: "Medium (4 to 7 to go)", l: "Long (8 or more to go)" };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const countBy = (rows, key) => { const c = {}; rows.forEach(e => { c[e[key]] = (c[e[key]] || 0) + 1; }); return c; };
const topOfCount = c => Object.keys(c).sort((a, b) => c[b] - c[a])[0];
const listNames = (ids, book) => ids.map(id => book[id].name).join(ids.length > 2 ? ", " : " and ");
// Plays that beat a defensive call, and calls that stop a play, from the matchup table
const beatsDef = d => OFF_IDS.filter(p => M[p][d] >= 1).sort((a, b) => M[b][d] - M[a][d]).slice(0, 2);
const stopsPlay = p => DEF_IDS.filter(d => M[p][d] <= -1).sort((a, b) => M[p][a] - M[p][b]).slice(0, 2);
// One team's first-half report: { off: [...lines], def: [...lines], tips: [...lines] }
function halfReport(t) {
  const rows = (S.chart || []).filter(e => e.h === 1), off = rows.filter(e => e.o === t), def = rows.filter(e => e.o !== t);
  const rep = { off: [], def: [], tips: [] };
  if (off.length) {
    const runs = off.filter(e => OFFP[e.off].kind === "run").length;
    rep.off.push(`${off.length} snaps: ${runs} runs, ${off.length - runs} passes (${pct(runs, off.length)}% run).`);
    ["s", "m", "l"].forEach(b => {
      const r = off.filter(e => e.b === b); if (r.length < 3) return;
      const c = countBy(r, "off"), top = topOfCount(c);
      rep.off.push(`${BUCKET_HEAD[b]}: ${OFFP[top].name} on ${c[top]} of ${r.length}.`);
      if (c[top] / r.length >= .45 && c[top] >= 3) {
        const stop = stopsPlay(top);
        if (stop.length) rep.tips.push({ side: "off", text: `${tname(t)} lean on ${OFFP[top].name} on ${BUCKET_TEXT[b]} (${c[top]} of ${r.length}). ${listNames(stop, DEFP)} ${stop.length > 1 ? "shut" : "shuts"} it down.` });
      }
    });
    const pc = countBy(off, "off"), works = [], fails = [];
    Object.keys(pc).forEach(p => { if (pc[p] < 3) return; const won = off.filter(e => e.off === p && e.s > 0).length; if (won / pc[p] >= .6) works.push([p, won, pc[p]]); else if (won / pc[p] <= .25) fails.push([p, won, pc[p]]); });
    works.sort((a, b) => b[1] / b[2] - a[1] / a[2]); fails.sort((a, b) => a[1] / a[2] - b[1] / b[2]);
    if (works.length) rep.off.push(`Working: ${works.slice(0, 2).map(([p, w, n]) => `${OFFP[p].name} won ${w} of ${n} snaps`).join("; ")}.`);
    if (fails.length) rep.off.push(`Not working: ${fails.slice(0, 2).map(([p, w, n]) => `${OFFP[p].name} won ${w} of ${n}`).join("; ")}.`);
    const looks = off.filter(e => e.look), auds = looks.filter(e => e.aud).length;
    if (looks.length) rep.off.push(`Audibled on ${auds} of ${looks.length} looks at the line.`);
  } else rep.off.push("No snaps on offense yet.");
  if (def.length) {
    ["s", "m", "l"].forEach(b => {
      const r = def.filter(e => e.b === b); if (r.length < 3) return;
      const c = countBy(r, "def"), top = topOfCount(c);
      rep.def.push(`${BUCKET_HEAD[b]}: ${DEFP[top].name} on ${c[top]} of ${r.length}.`);
      if (c[top] / r.length >= .45 && c[top] >= 3) {
        const beat = beatsDef(top);
        if (beat.length) rep.tips.push({ side: "def", text: `${tname(t)} keep calling ${DEFP[top].name} on ${BUCKET_TEXT[b]} (${c[top]} of ${r.length}). ${listNames(beat, OFFP)} ${beat.length > 1 ? "beat" : "beats"} it.` });
      }
    });
    const dc = countBy(def, "def"), stops = [];
    Object.keys(dc).forEach(d => { if (dc[d] < 3) return; const won = def.filter(e => e.def === d && e.s < 0).length; if (won / dc[d] >= .6) stops.push([d, won, dc[d]]); });
    stops.sort((a, b) => b[1] / b[2] - a[1] / a[2]);
    if (stops.length) rep.def.push(`Working: ${stops.slice(0, 2).map(([d, w, n]) => `${DEFP[d].name} won ${w} of ${n} snaps`).join("; ")}.`);
    const looks = def.filter(e => e.look), fakes = looks.filter(e => e.fake).length;
    if (looks.length) rep.def.push(`Disguised ${fakes} of ${looks.length} looks.`);
  } else rep.def.push("No snaps on defense yet.");
  return rep;
}
function vHalftime() {
  const t = S.teams, cpuT = t[0].cpu ? 0 : t[1].cpu ? 1 : -1, scouts = cpuT >= 0 && CP(cpuT).scout;
  const st = i => t[i].st;
  const statRow = (l, f) => `<tr><th scope="row">${l}</th><td>${f(0)}</td><td>${f(1)}</td></tr>`;
  const lines = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const coach = i => `Coach ${t[i].coach.last}`;
  const teamSec = i => {
    const r = halfReport(i);
    const tips = r.tips.map(x => x.text);
    return `<section class="panel" style="--team:${t[i].color}" aria-label="${esc(tname(i))} first half">
      <p class="eyebrow">${esc(t[i].school)} ${esc(t[i].name)} · ${esc(coach(i))}</p>
      <h3>${esc(identityText(i))}</h3>
      ${lines(leaderLines(i))}
      <p class="sechead">On offense</p>${lines(r.off)}
      <p class="sechead">On defense</p>${lines(r.def)}
      ${tips.length ? `<p class="sechead">${cpuT === i ? "How to beat it" : cpuT >= 0 ? `What ${esc(coach(1 - i))} has seen` : `Tendencies to attack`}</p>${lines(tips)}` : ""}
      ${!tips.length && cpuT >= 0 && cpuT !== i ? `<p class="muted pkdesc">No strong habits yet. ${scouts ? `${esc(coach(cpuT))} is still charting you.` : ""}</p>` : ""}
    </section>`;
  };
  // The computer's team first: how to beat it
  const order = t[0].cpu && !t[1].cpu ? [0, 1] : t[1].cpu && !t[0].cpu ? [1, 0] : [0, 1];
  return `${board()}
    <section class="panel" data-focus tabindex="-1">
      <p class="eyebrow">Halftime · Scouting report</p>
      <h2>${t[0].score === t[1].score ? `Tied ${t[0].score}-${t[1].score}` : `${esc(tname(t[0].score > t[1].score ? 0 : 1))} lead ${Math.max(t[0].score, t[1].score)}-${Math.min(t[0].score, t[1].score)}`}</h2>
      <p class="muted">What each coach called in the first half, what worked, and the habits worth attacking.${scouts ? ` ${esc(coach(cpuT))} has been charting you too, and will lean harder on your habits in the second half.` : ""}</p>
      <div class="tablewrap"><table aria-label="First half stats">
        <thead><tr><td></td><th scope="col">${esc(t[0].abbr)}</th><th scope="col">${esc(t[1].abbr)}</th></tr></thead>
        <tbody>${statRow("Total yards", i => st(i).yds)}${statRow("Rushing", i => st(i).rush)}${statRow("Passing", i => st(i).pass)}${statRow("First downs", i => st(i).fd)}${statRow("Turnovers", i => st(i).to)}</tbody></table></div>
    </section>
    ${order.map(teamSec).join("")}
    ${bannerHtml()}
    <button class="btn" data-a="half">Start the second half</button>`;
}

/* ---------- Player stats ---------- */
// Each team's players with stats, as [player, stats]
function statPlayers(t) { return S.teams[t].players.map(p => [p, S.ps[p.id] || {}]).filter(([, s]) => Object.keys(s).length); }
// The leaders in one line each: passing, rushing, receiving, tackles
function leaderLines(t) {
  const list = statPlayers(t), top = (k, min) => list.filter(([, s]) => (s[k] || 0) >= (min || 1)).sort((a, b) => (b[1][k] || 0) - (a[1][k] || 0))[0];
  const out = [], pass = top("pa"), rush = top("ru"), rec = top("rec"), tkl = top("tk");
  if (pass) { const s = pass[1]; out.push(`Passing: ${pass[0].last}, ${s.pc || 0} of ${s.pa} for ${yd(s.py || 0)}${s.ptd ? `, ${plural(s.ptd, "touchdown")}` : ""}${s.pi ? `, ${plural(s.pi, "interception")}` : ""}.`); }
  if (rush) { const s = rush[1]; out.push(`Rushing: ${rush[0].last}, ${plural(s.ru, "carry", "carries")} for ${yd(s.ry || 0)}${s.rtd ? `, ${plural(s.rtd, "touchdown")}` : ""}.`); }
  if (rec) { const s = rec[1]; out.push(`Receiving: ${rec[0].last}, ${plural(s.rec, "catch", "catches")} for ${yd(s.rcy || 0)}${s.rctd ? `, ${plural(s.rctd, "touchdown")}` : ""}.`); }
  if (tkl) { const s = tkl[1]; out.push(`Tackles: ${tkl[0].last}, ${s.tk}${s.sck ? `, ${plural(s.sck, "sack")}` : ""}.`); }
  return out.length ? out : ["No stats yet."];
}
// One table of player stats. cols: [[header, value(stats, player)], ...]
function statTable(caption, rows, cols) {
  if (!rows.length) return "";
  return `<div class="tablewrap"><table><caption>${caption}</caption>
    <thead><tr><th scope="col">Player</th>${cols.map(([h]) => `<th scope="col">${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(([p, s]) => `<tr><th scope="row">${esc(p.first[0])}. ${esc(p.last)}</th>${cols.map(([, f]) => `<td>${f(s, p)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function teamStatsHtml(t) {
  const list = statPlayers(t), by = (k, min) => list.filter(([, s]) => (s[k] || 0) >= (min || 1)).sort((a, b) => (b[1][k] || 0) - (a[1][k] || 0));
  const n = (s, k) => s[k] || 0;
  return `<h3 class="stathead" style="--team:${S.teams[t].color}">${esc(S.teams[t].school)} ${esc(S.teams[t].name)}</h3>` +
    statTable("Passing", by("pa"), [["C/A", s => `${n(s, "pc")}/${n(s, "pa")}`], ["Yds", s => n(s, "py")], ["TD", s => n(s, "ptd")], ["Int", s => n(s, "pi")]]) +
    statTable("Rushing", by("ru"), [["Car", s => n(s, "ru")], ["Yds", s => n(s, "ry")], ["TD", s => n(s, "rtd")], ["Long", s => n(s, "rl")]]) +
    statTable("Receiving", by("rec"), [["Rec", s => n(s, "rec")], ["Yds", s => n(s, "rcy")], ["TD", s => n(s, "rctd")], ["Long", s => n(s, "rcl")]]) +
    statTable("Defense", by("tk").concat(list.filter(([, s]) => !s.tk && (s.int || s.sck || s.pd))).slice(0, 8), [["Tkl", s => n(s, "tk")], ["TFL", s => n(s, "tfl")], ["Sacks", s => n(s, "sck")], ["Int", s => n(s, "int")]]) +
    statTable("Kicking", by("fga").concat(list.filter(([, s]) => !s.fga && s.xpa)), [["FG", s => `${n(s, "fgm")}/${n(s, "fga")}`], ["Long", s => s.fgl || "-"], ["XP", s => `${n(s, "xpm")}/${n(s, "xpa")}`]]) +
    statTable("Punting", by("pu"), [["Punts", s => n(s, "pu")], ["Avg", s => s.pu ? (s.puy / s.pu).toFixed(1) : "-"], ["Long", s => s.pul || "-"]]) +
    statTable("Returns", list.filter(([, s]) => s.kr || s.pr), [["Kick", s => `${n(s, "kr")}-${n(s, "kry")}`], ["Punt", s => `${n(s, "pr")}-${n(s, "pry")}`]]);
}

/* ---------- Final ---------- */
function vFinal() {
  const [a, b] = S.teams, tie = a.score === b.score, w = a.score > b.score ? 0 : 1;
  const lines = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  return `${board()}
    <section class="panel final handoff" style="--team:${tie ? "var(--ink)" : S.teams[w].color}">
      <p class="eyebrow">Final${S.quarter === 5 ? " · Overtime" : S.quarter > 5 ? ` · ${S.quarter - 4} overtimes` : ""}</p>
      <h2>${tie ? "It ends in a tie" : `<span>${esc(S.teams[w].name)}</span> win ${S.teams[w].score}-${S.teams[1 - w].score}`}</h2>
      ${[w, 1 - w].map(i => `<p class="sechead">${esc(S.teams[i].school)} ${esc(S.teams[i].name)}</p>${lines(leaderLines(i))}`).join("")}
      <div class="choices">
        <button class="btn" data-a="rematch">Play again</button>
        <button class="btn ghost" data-a="newmatch">New matchup</button>
      </div>
    </section>`;
}

/* ---------- Box score, play-by-play and the footer ---------- */
function vExtras() {
  if (!S || !S.teams) return "";
  const t = S.teams;
  const rows = [["Total yards", "yds"], ["Rushing", "rush"], ["Passing", "pass"], ["First downs", "fd"], ["Third downs", "d3"], ["Turnovers", "to"], ["Penalties", "pen"], ["Plays", "plays"]];
  const cell = (st, k) => k === "pen" ? `${st.pen || 0}-${st.penYds || 0}` : k === "d3" ? `${st.d3c || 0} of ${st.d3 || 0}` : st[k];
  const box = `<details ${S.phase === "final" ? "open" : ""}><summary>Box score</summary><p class="muted idline">${[0, 1].map(i => `${esc(t[i].abbr)}: ${identityText(i)}`).join("<br>")}</p><div class="tablewrap"><table aria-label="Team stats">
    <thead><tr><td></td><th scope="col">${esc(t[0].abbr)}</th><th scope="col">${esc(t[1].abbr)}</th></tr></thead>
    <tbody>${rows.map(([l, k]) => `<tr><th scope="row">${l}</th><td>${cell(t[0].st, k)}</td><td>${cell(t[1].st, k)}</td></tr>`).join("")}</tbody></table></div></details>`;
  const players = `<details><summary>Player stats</summary><div class="statwrap">${teamStatsHtml(0)}${teamStatsHtml(1)}</div></details>`;
  const log = S.log.length ? `<details><summary>Play-by-play</summary><ol class="log">${S.log.slice(0, 80).map(e => `
    <li style="--team:${t[e.team].color}">
      <span class="meta"><span>${qLabel(e.q)}${e.q >= 5 && R().ot.kind === "hs" ? "" : " " + fmtClock(e.clock)}</span><span>${esc(e.sit)}</span><span>${esc(t[0].abbr)} ${e.score.split("-")[0]} · ${esc(t[1].abbr)} ${e.score.split("-")[1]}</span></span>
      <span class="cl"><span class="tm"></span>${esc(e.off)}${e.def ? ` vs ${esc(e.def)}` : ""}</span>
      <span>${esc(e.text)}</span>
    </li>`).join("")}</ol></details>` : "";
  const live = S.phase !== "final";
  const foot = `<div class="foot">
    ${t[0].cpu && t[1].cpu ? `<button class="linkbtn" data-a="roster" data-t="0">Rosters</button>` : `<button class="linkbtn" data-a="lineup">Lineup and subs</button>`}
    ${live ? `<button class="linkbtn ${S.confirmSim ? "warn" : ""}" data-a="sim">${S.confirmSim ? "Tap again to sim to the end" : "Sim to the end"}</button>
    <button class="linkbtn ${S.confirmEnd ? "warn" : ""}" data-a="end">${S.confirmEnd ? "Tap again to end this game" : "End game"}</button>` : ""}
  </div>`;
  return box + players + log + foot;
}
