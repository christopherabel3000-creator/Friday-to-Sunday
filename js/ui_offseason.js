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
  const expected = classParams(s, SEASON.year + 1).n;
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
      <h3>Your coach</h3>
      <p>${CAREER.xp || 0} XP to spend on ratings and perks.</p>
      <button class="btn ghost" data-a="coach">Spend XP</button>
    </section>
    ${champ ? `<p class="muted">${SEASON.year} Class 1A state champions: the ${esc(nameOf(champ))}.</p>` : ""}
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
    <section class="panel"><h3>Grew over the summer</h3>${grew.length ? list(grew) : "<p>Nobody's overall rating went up over the summer.</p>"}</section>
    <button class="btn" data-a="season">${inCamp() ? "On to preseason camp" : "Back to the season"}</button>`;
}
