// Friday to Sunday: the schemes screen (Milestone 7). Your schemes, how installed their own plays
// are, how your roster fits each scheme now and next year, and changing schemes.
"use strict";

// "Four Verticals learning 45, Y-Cross new 12 and Bubble Screen solid 66"
const schemePlayList = (s, ids) => andList(ids.map(id => { const v = Math.round((s.mastery || {})[id] || 0); return `${playName(id)} ${masteryWord(v)} ${v}`; }));
const sideWord = side => side === "off" ? "offense" : "defense";
const styleBook = side => side === "off" ? OFF_STYLES : DEF_STYLES;
// One line on how installed a school's scheme is: "Its own plays: ... Its strengths count at 45 percent."
function installLine(s, side) {
  fillSchemes(s);
  const st = s[side], I = schemeInstall(s, side, st);
  return `Its own ${side === "off" ? "plays" : "calls"}: ${schemePlayList(s, I.ids)}. Its strengths count at ${I.v} percent, as far as they're installed.`;
}
// What changing schemes costs, before the second tap
function switchWarn(s, side, style) {
  fillSchemes(s);
  const book = styleBook(side), old = s[side], I = schemeInstall(s, side, style), O = schemeInstall(s, side, old);
  const half = O.v ? ` The ${book[old].name} plays are shelved at half, from ${O.word} ${O.v} to about ${Math.round(O.v / 2)}.` : "";
  return `Change to the ${book[style].name} ${sideWord(side)}? Its plays here are ${I.word}, averaging ${I.v}, so its strengths count for ${I.v ? "only that much" : "nothing"} until they're installed, and its weak spots count right away.${half} Tap again to change.`;
}
// The panel on a season screen: your schemes, how installed they are, and the way to the schemes screen
function schemesSummary(s) {
  fillSchemes(s);
  const role = coordRole(), sides = role === "oc" ? ["off"] : role === "dc" ? ["def"] : ["off", "def"];
  const line = side => { const I = schemeInstall(s, side); return `${styleBook(side)[s[side]].name} ${sideWord(side)}: its own ${side === "off" ? "plays" : "calls"} are ${I.word}, averaging ${I.v}.`; };
  const his = role ? ` ${hcName()} runs the ${role === "oc" ? DEF_STYLES[s.def || "bal"].name : OFF_STYLES[s.off || "bal"].name} ${hcSideWord()}.` : "";
  const opt = CAREER && CAREER.optNote && inPros() ? `<p class="banner">The Option isn't run in the pros. Your offense is Balanced for now: pick yours on the schemes screen.</p>` : "";
  return `<section class="panel"><h3>${role ? "Your scheme" : "Your schemes"}</h3>${opt}
    <p>${esc(sides.map(line).join(" ") + his)}</p>
    <button class="btn ghost" data-a="schemes">Schemes and roster fit</button></section>`;
}
function vSchemes() {
  const s = mySchool(), role = coordRole(), lvl = schoolLvl(s), c = role ? CAREER.coach : s.coach;
  fillSchemes(s);
  if (CAREER) CAREER.optNote = false;
  const now = rosterFit(s), next = rosterFit(nextYearTeam(s)), later = isPro(s.cls) ? "next year, without the players 32 and older" : isCollege(s.cls) ? "next year, after this year's last-year players leave" : "next year, after this year's seniors leave";
  const side = sd => {
    const book = styleBook(sd), ids = sd === "off" ? offStylesAt(lvl) : DEF_STYLE_IDS, cur = s[sd], a = sd === "off" ? "ostyle" : "dstyle";
    const I = schemeInstall(s, sd), yrs = schemeYears(c, sd, cur);
    const row = id => {
      const J = schemeInstall(s, sd, id), here = id === cur, pending = confirming === `${a}:${id}`;
      const plays = andList(J.ids.map(playName)), fit = `Roster fit: ${now[sd][id]} now, ${next[sd][id]} next year.`;
      const learned = here ? `Your scheme. Installed: ${J.word}, ${J.v}.` : J.v ? `Its plays here: ${J.word}, ${J.v}.` : "Not installed here.";
      return `<li><button class="rowbtn" data-a="${a}" data-v="${id}" aria-pressed="${here}"><b>${book[id].name}.</b> ${esc(`${learned} ${fit}`)}${pending ? " Tap again to change." : ""}</button>
        <p class="muted">${esc(`${book[id].desc} Its own ${sd === "off" ? "plays" : "calls"}: ${plays}.${id === "bal" ? " Installs a quarter faster." : ""}`)}</p></li>`;
    };
    const yrsLine = yrs ? ` Your coach has run it ${plural(yrs, "season")}: he installs it ${Math.round(SCHEME_YEAR * yrs * 100)} percent faster.` : "";
    return `<section class="panel"><h3>${sd === "off" ? "Offense" : "Defense"}</h3>
      <p>${esc(`${book[cur].name}. ${installLine(s, sd)}${yrsLine}`)}</p>
      <ul class="roster">${ids.map(row).join("")}</ul></section>`;
  };
  const sides = role === "oc" ? ["off"] : role === "dc" ? ["def"] : ["off", "def"];
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${esc(nameOf(s.id))} · Schemes</p>
      <h2 data-focus tabindex="-1">Schemes</h2>
      <p class="muted">${esc(`Every team shares the 8 base plays on each side. A scheme adds ${SCHEME_N[lvl]} plays of its own here, learned with install time in practice. Its strengths grow as they're learned; its weak spots count from the first day. You can change schemes any time, but the old scheme's plays are shelved at half, and the new one's start where they are. Roster fit is advice only: the first rating is for this year, the second for ${later}.`)}</p>
      ${role ? `<p class="muted">${esc(`${hcName()} runs the ${role === "oc" ? DEF_STYLES[s.def || "bal"].name : OFF_STYLES[s.off || "bal"].name} ${hcSideWord()}.`)}</p>` : ""}
    </div>
    ${sides.map(side).join("")}
    <button class="btn" data-a="back">Back</button>`;
}
// Your coach's seasons in each scheme, for his page
function schemeYearsLine(c) {
  const sch = c && c.sch, parts = [];
  if (sch) ["off", "def"].forEach(sd => Object.keys(sch[sd] || {}).forEach(id => { const n = sch[sd][id], book = styleBook(sd); if (n && book[id]) parts.push(`${book[id].name} ${sideWord(sd)} ${plural(n, "season")}`); }));
  return parts.length ? `Seasons in each scheme: ${andList(parts)}. Each one makes him 4 percent faster at installing it, up to 20.` : "";
}
