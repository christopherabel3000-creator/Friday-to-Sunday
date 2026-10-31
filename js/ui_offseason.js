// Friday to Sunday: the offseason screens. Who's graduating and who's coming back, then, once the new
// season starts, how the team changed: graduation, players who left, the freshmen, and summer growth.
"use strict";

/* ---------- The offseason ---------- */
// A season's stats so far, with this season's added in (career totals are kept when the season ends)
function statsWithThisSeason(p) {
  const out = Object.assign({}, p.cs || {}), st = SEASON.stats[p.id] || {};
  for (const k in st) out[k] = LONG_STATS.has(k) ? Math.max(out[k] || 0, st[k]) : (out[k] || 0) + st[k];
  return out;
}
function vOffseason() {
  const s = mySchool(), list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const seniors = s.players.filter(p => p.yr >= 12).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
  const starters = new Set(), back = s.players.filter(p => p.yr < 12);
  OFF_POS.concat(DEF_POS, ["K", "P"]).forEach(pos => (s.depth[pos] || []).slice(0, STARTERS[pos]).forEach(id => starters.add(id)));
  const returning = back.filter(p => starters.has(p.id)).length;
  // The summer plan, and the freshmen it should bring (youth camp builds up the youth program)
  const plan = SEASON.summer || (SEASON.summer = newSummer()), wk = summerWeeks(plan);
  const expected = classParams(Object.assign({}, s, { youth: Math.min(6, (s.youth || 0) * .6 + effBlocks(wk.camp) * .5) }), SEASON.year + 1).n;
  const row = id => `<div style="display:grid;gap:6px" role="group" aria-label="${SUMMER_NAMES[id]}"><span class="eyebrow" aria-hidden="true">${SUMMER_NAMES[id]} · ${weeksText(wk[id])}</span>
    <div class="seg">${INTENSITY.map((nm, v) => `<button data-a="summer" data-t="${id}" data-v="${v}" aria-pressed="${(plan[id] || 0) === v}">${nm}</button>`).join("")}</div>
    <p class="muted styledesc">${esc(SUMMER_DESC[id])}</p></div>`;
  const H = hallsNow(), yes = H.players.filter(p => H.said[p.id] === "yes").length, left = pitchesLeft();
  const line = p => { const st = careerStatLine(statsWithThisSeason(p)); return `${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}${st ? `: ${st}` : ""}.`; };
  const champ = SEASON.champion;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(s.id))}</h2>
      <p class="muted">The seniors graduate and everyone else gets a summer older. Then a new class of freshmen comes out, and ${plural(PRESEASON_WEEKS, "week")} of camp open the ${SEASON.year + 1} season.</p>
    </div>
    <section class="panel">
      <h3>Graduating</h3>
      ${seniors.length ? `<p>${plural(seniors.length, "senior")}:</p>${list(seniors.map(line))}` : "<p>No seniors this year.</p>"}
    </section>
    <section class="panel">
      <h3>Coming back</h3>
      <p>${plural(back.length, "player")}, ${returning} of them starters. About ${plural(expected, "freshman", "freshmen")} should come out for football.</p>
      <button class="btn ghost" data-a="sroster" data-t="${s.id}">Roster and depth chart</button>
    </section>
    <section class="panel">
      <h3>The summer</h3>
      <p class="muted styledesc">Eight weeks, shared out by weight. Workouts are voluntary: players with more work ethic show up more, and so do more of them under a coach with better Program building.</p>
      ${SUMMER_IDS.map(row).join("")}
    </section>
    <section class="panel">
      <h3>Hallway recruiting</h3>
      <p>${plural(H.players.length, "athlete")} at school could play football. ${plural(left, "pitch", "pitches")} left${yes ? `, and ${yes} said yes` : ""}.</p>
      <button class="btn ghost" data-a="halls">Talk to them</button>
    </section>
    <section class="panel">
      <h3>Your coach</h3>
      <p>${CAREER.xp || 0} XP to spend on ratings and perks.</p>
      <button class="btn ghost" data-a="coach">Spend XP</button>
    </section>
    ${champ ? `<p class="muted">${champ === s.id ? `Your team won the ${SEASON.year} Class 1A state championship.` : `${SEASON.year} Class 1A state champions: the ${esc(nameOf(champ))}.`}</p>` : ""}
    <button class="btn" data-a="nextyear">Start the ${SEASON.year + 1} preseason</button>
    <button class="btn ghost" data-a="summary">${SEASON.year} season summary</button>`;
}

/* ---------- How the team changed ---------- */
function vNewYear() {
  const R = SEASON.yearReport, s = mySchool(), list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const fresh = R.fresh.map(id => playerById(s, id)).filter(Boolean).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
  const grew = R.grew.map(([id, a, b]) => { const p = playerById(s, id); return p ? `${fullName(p)}, ${YEAR_NAMES[p.yr]}: ${a} to ${b} at ${posName(p.pos)}.` : ""; }).filter(Boolean).slice(0, 8);
  const rank = talentRank(s.id);
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} preseason</p>
      <h2 data-focus tabindex="-1">The ${SEASON.year} ${esc(s.mascot)}</h2>
      <p class="muted">${talentText(s.rating)} ${rank === 1 ? "The best starters" : `The ${ordWord(rank - 1)}-best starters`} in District ${SEASON.district}. ${plural(s.players.length, "player")} on the roster.</p>
    </div>
    <section class="panel"><h3>Graduated</h3>${R.grads.length ? list(R.grads.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}${x.stats ? `: ${x.stats}` : ""}.`)) : "<p>Nobody graduated.</p>"}</section>
    ${R.left.length ? `<section class="panel"><h3>Left the team</h3>${list(R.left.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}: ${x.why}.`))}</section>` : ""}
    <section class="panel"><h3>New freshmen</h3>${fresh.length ? list(fresh.map(p => playerLine(p, s.level))) : "<p>No freshmen came out this year.</p>"}</section>
    ${(R.joined || []).length ? `<section class="panel"><h3>From the hallways</h3>${list(R.joined.map(id => playerById(s, id)).filter(Boolean).map(p => playerLine(p, s.level)))}</section>` : ""}
    <section class="panel"><h3>Grew over the summer</h3>${R.went ? `<p>${plural(R.went, "player")} came to summer workouts.</p>` : ""}${grew.length ? list(grew) : "<p>Nobody's overall rating went up over the summer.</p>"}</section>
    <button class="btn" data-a="season">${inCamp() ? "On to preseason camp" : "Back to the season"}</button>`;
}

/* ---------- Hallway recruiting ---------- */
// "about 1.6 weeks"
const weeksText = w => !w ? "none" : `${w < 1 ? "under a week" : `about ${Math.round(w * 10) / 10} weeks`}`;
// One athlete in a sentence: "Marcus Hill, junior next season. Plays basketball. Receiver 34, cornerback 29. Fast. High potential."
function prospectLine(p, s) {
  const sp = SPORTS.find(x => x.id === p.sport), st = strengths(p, s.level).map(a => ATTR_PRAISE[a]);
  return `${fullName(p)}, ${YEAR_NAMES[p.yr]} next season. ${capFirst(sp ? sp.what : "")}. ${capFirst(posName(p.pos))} ${ovr(p, p.pos)}, ${posName(p.pos2)} ${ovr(p, p.pos2)}.${st.length ? ` ${capFirst(st.join(", "))}.` : ""} ${capFirst(POT_BANDS[p.potSeen])} potential. ${capFirst(INTEREST[p.interest])}.`;
}
function vHalls() {
  const s = mySchool(), H = hallsNow(), left = pitchesLeft();
  const card = p => {
    const said = H.said[p.id];
    // After a pitch the button stays (focus stays on it) and says how it went
    return `<li class="xprow"><span>${esc(prospectLine(p, s))}</span>
      <button class="btn ghost slim" data-a="pitch" data-v="${p.id}"${said ? ' aria-pressed="true"' : ""}>${said ? `${esc(fullName(p))} said ${said}` : `Pitch ${esc(fullName(p))}`}</button></li>`;
  };
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason · Hallway recruiting</p>
      <h2 data-focus tabindex="-1">Talk to athletes</h2>
      <p class="muted">${plural(left, "pitch", "pitches")} left. Athletes from other sports, and kids who don't play anything, who could help next season. Interest, your Program building and your school's tradition decide who says yes. More summer time for hallway recruiting means more pitches.</p>
    </div>
    <section class="panel"><ul class="hlist xplist">${H.players.map(card).join("")}</ul></section>
    <button class="btn ghost" data-a="back">Back to the offseason</button>`;
}
