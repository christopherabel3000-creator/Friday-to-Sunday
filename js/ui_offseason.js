// Friday to Sunday: the offseason screens. Who's graduating and who's coming back, then, once the new
// season starts, how the team changed: graduation, players who left, the freshmen, and summer growth.
"use strict";

/* ---------- The offseason ---------- */
// You've taken a job in the other world (high school to college, or back): it starts with the
// preseason, and until then nothing at the school you're leaving is yours to run. XP still is.
const leavingSchool = () => !!(CAREER && CAREER.next);
// "You take over the ... when the 2028 preseason starts."
const newJobPanel = () => `<section class="panel"><h3>Your new job</h3><p>${esc(`You take over the ${jobName(CAREER.next.id)} (${jobPlace(CAREER.next.id)}) when the ${SEASON.year + 1} preseason starts. Your players here stay behind.`)}</p></section>`;
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
  const line = p => { const st = careerStatLine(statsWithThisSeason(p)); return `${fullName(p)}, ${posName(p.pos)} ${ovr(p, p.pos)}${st ? `: ${st}` : ""}.${p.sign != null ? ` Signed with ${collegeText(p.sign)}.` : ""}`; };
  const champ = movedSchools() ? null : SEASON.champion, M = SEASON.market, R = SEASON.review;
  const gone = leavingSchool(), newJob = gone ? newJobPanel() : M && M.took ? `<section class="panel"><h3>Your new job</h3><p>${esc(`You're the new head coach of the ${nameOf(s.id)}, in Class ${s.cls}, District ${s.district}. Stipend: ${moneyText(CAREER.job.pay)}.`)}</p>
      <p>${esc(M.transfers.length ? `Following you from the ${nameOf(M.from)}: ${andList(M.transfers)}.` : `None of your players from the ${nameOf(M.from)} followed you.`)}</p></section>` : "";
  // The school's offseason program: only while it's still your school
  const program = () => `
    <section class="panel">
      <h3>Coming back</h3>
      <p>${plural(back.length, "player")}, ${returning} of them starters. About ${plural(expected, "freshman", "freshmen")} should come out for football.</p>
      <button class="btn ghost" data-a="sroster" data-t="${s.id}">Roster and depth chart</button>
    </section>
    <section class="panel">
      <h3>The summer</h3>
      <p class="muted styledesc">${plural(SUMMER_WEEKS - fundWeeks(), "week")}, shared out by weight${fundWeeks() ? ` (your fundraisers take ${plural(fundWeeks(), "week")})` : ""}. Workouts are voluntary: players with more work ethic show up more, and so do more of them under a coach with better Program building.</p>
      ${SUMMER_IDS.map(row).join("")}
    </section>
    <section class="panel">
      <h3>Hallway recruiting</h3>
      <p>${plural(H.players.length, "athlete")} at school could play football. ${plural(left, "pitch", "pitches")} left${yes ? `, and ${yes} said yes` : ""}.</p>
      <button class="btn ghost" data-a="halls">Talk to them</button>
    </section>
    <section class="panel">
      <h3>The program fund</h3>
      <p>${esc(`${moneyText(openBooks() ? s.fund : 0)} to spend on fundraisers, facilities, team camp and more. ${boostText(boostersOf(s))}`)}</p>
      <button class="btn ghost" data-a="fund">The program fund</button>
    </section>
    ${recruitPanel()}
`;
  const moves = R && R.moves && R.moves.length ? `<section class="panel"><h3>Coaching changes</h3><ul class="hlist">${R.moves.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>` : "";
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} offseason</p>
      <h2 data-focus tabindex="-1">${esc(nameOf(s.id))}</h2>
      <p class="muted">${gone ? `Your last days here. Your new job starts with the ${SEASON.year + 1} preseason, and until then you can still spend XP on your coach.` : `The seniors graduate and everyone else gets a summer older. Then a new class of freshmen comes out, and ${plural(PRESEASON_WEEKS, "week")} of camp open the ${SEASON.year + 1} season.`}</p>
    </div>
    ${newJob}
    <section class="panel">
      <h3>Graduating</h3>
      ${seniors.length ? `<p>${plural(seniors.length, "senior")}:</p>${list(seniors.map(line))}` : "<p>No seniors this year.</p>"}
    </section>
    ${gone ? "" : program()}
    <section class="panel">
      <h3>Your coach</h3>
      <p>${CAREER.xp || 0} XP to spend on ratings and perks.${CAREER.job && !gone ? ` Your stipend next season: ${moneyText(CAREER.job.pay)}.` : ""}</p>
      <button class="btn ghost" data-a="coach">Spend XP</button>
    </section>
    ${moves}
    ${champ ? `<p class="muted">${champ === s.id ? `Your team won the ${SEASON.year} Class ${SEASON.cls} state championship.` : `${SEASON.year} Class ${SEASON.cls} state champions: the ${esc(nameOf(champ))}.`}</p>` : ""}
    <button class="btn" data-a="nextyear">Start the ${SEASON.year + 1} preseason</button>
    ${movedSchools() ? "" : `<button class="btn ghost" data-a="summary">${SEASON.year} season summary</button>`}`;
}

/* ---------- How the team changed ---------- */
function vNewYear() {
  const R = SEASON.yearReport, s = mySchool(), list = arr => `<ul class="hlist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const fresh = R.fresh.map(id => playerById(s, id)).filter(Boolean).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
  const grew = R.grew.map(([id, a, b]) => { const p = playerById(s, id); return p ? `${fullName(p)}, ${yearName(p)}: ${a} to ${b} at ${posName(p.pos)}.` : ""; }).filter(Boolean).slice(0, 8);
  const rank = talentRank(s.id);
  if (R.pro) return proNewYear(R, s, fresh, grew, rank, list);
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} preseason</p>
      <h2 data-focus tabindex="-1">The ${SEASON.year} ${esc(s.mascot)}</h2>
      <p class="muted">${talentText(s.rating)} ${rank === 1 ? "The best starters" : rank <= 8 ? `The ${ordWord(rank - 1)}-best starters` : `Starters ranked ${rank}th`} in ${worldy() ? esc(s.conf ? `the ${confName(s.id)}` : "your schedule") : `District ${SEASON.district}`}. ${plural(s.players.length, "player")} on the roster.</p>
    </div>
    ${R.col && R.spring ? `<section class="panel"><h3>Spring practice</h3><p>${esc(`Four weeks with your practice plan: ${plural(R.spring.n, "player")} improved.${R.spring.mastery.length ? ` Plays learned: ${R.spring.mastery.map(([id, a, b]) => `${playName(id)} ${a} to ${b}`).join(", ")}.` : ""}`)}</p></section>` : ""}
    ${R.col && R.pros.length ? `<section class="panel"><h3>Left early for the pros</h3>${list(R.pros.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}${x.stats ? `: ${x.stats}` : ""}.`))}</section>` : ""}
    <section class="panel"><h3>${R.col ? "Out of eligibility" : "Graduated"}</h3>${R.grads.length ? list(R.grads.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}${x.stats ? `: ${x.stats}` : ""}.${x.col ? ` On to ${x.col}.` : ""}`)) : "<p>Nobody graduated.</p>"}</section>
    ${(R.offers || []).length ? `<section class="panel"><h3>Offers from team camp</h3>${list(R.offers)}</section>` : ""}
    ${R.left.length ? `<section class="panel"><h3>Left the team</h3>${list(R.left.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}: ${x.why}.`))}</section>` : ""}
    ${R.col && (R.xout || []).length ? `<section class="panel"><h3>Left in the transfer portal</h3>${list(R.xout.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}${x.to ? `, to ${x.to}` : ""}.`))}</section>` : ""}
    ${R.col && (R.xin || []).length ? `<section class="panel"><h3>From the transfer portal</h3>${list(R.xin.map(id => playerById(s, id)).filter(Boolean).map(p => playerLine(p, s.level)))}</section>` : ""}
    ${R.col && (R.xmissed || []).length ? `<p>${esc(`Went elsewhere: ${andList(R.xmissed)}.`)}</p>` : ""}
    ${R.col && (R.cut || []).length ? `<section class="panel"><h3>Over the roster limit</h3>${list(R.cut.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}.`))}</section>` : ""}
    <section class="panel"><h3>${R.col ? "The new class" : "New freshmen"}</h3>${fresh.length ? list(fresh.map(p => playerLine(p, s.level))) : "<p>No freshmen came out this year.</p>"}</section>
    ${(R.joined || []).length ? `<section class="panel"><h3>${R.col ? "From your old high school state" : "From the hallways"}</h3>${list(R.joined.map(id => playerById(s, id)).filter(Boolean).map(p => playerLine(p, s.level)))}</section>` : ""}
    <section class="panel"><h3>Grew over the summer</h3>${R.went ? `<p>${plural(R.went, "player")} came to summer workouts.</p>` : ""}${grew.length ? list(grew) : "<p>Nobody's overall rating went up over the summer.</p>"}</section>
    <button class="btn" data-a="season">${inCamp() ? "On to preseason camp" : "Back to the season"}</button>`;
}

// A pro team's new year: who retired, who left, who was kept, the rookies, and who grew (pcap.js)
function proNewYear(R, s, fresh, grew, rank, list) {
  const who = x => `${x.name}, ${posName(x.pos)} ${x.ovr}, age ${x.age}${x.stats ? `: ${x.stats}` : ""}.`;
  return `
    <div class="masthead" style="--team:${s.color}">
      <p class="eyebrow">${SEASON.year} preseason</p>
      <h2 data-focus tabindex="-1">The ${SEASON.year} ${esc(s.mascot)}</h2>
      <p class="muted">${talentText(s.rating)} ${rank === 1 ? "The best starters" : rank <= 4 ? `The ${ordWord(rank - 1)}-best starters` : `Starters ranked ${rank}th`} in the ${esc(proDivName(s.id))}. ${plural(onActive(s).length, "player")} in camp: cutdown day at the end of camp leaves ${PRO_ACTIVE}. ${esc(`Cap room: ${bigMoney(capRoom(s))}.`)}</p>
    </div>
    ${R.spring ? `<section class="panel"><h3>The offseason program</h3><p>${esc(`Four weeks with your practice plan: ${plural(R.spring.n, "player")} improved.${R.spring.mastery.length ? ` Plays learned: ${R.spring.mastery.map(([id, a, b]) => `${playName(id)} ${a} to ${b}`).join(", ")}.` : ""}`)}</p></section>` : ""}
    <section class="panel"><h3>Retired</h3>${R.grads.length ? list(R.grads.map(who)) : "<p>Nobody retired.</p>"}</section>
    ${R.left.length ? `<section class="panel"><h3>Let go</h3><p class="muted">Their contracts ran out and they weren't kept, or they were released to get under the cap.</p>${list(R.left.map(who))}</section>` : ""}
    ${(R.kept || []).length ? `<section class="panel"><h3>Kept, with new contracts</h3>${list(R.kept.map(x => `${x.name}, ${posName(x.pos)} ${x.ovr}: ${x.ct}`))}</section>` : ""}
    <section class="panel"><h3>Rookies</h3>${fresh.length ? list(fresh.map(p => `${playerLine(p, s.level)}${p.pick ? ` Round ${p.pick.rd}, pick ${p.pick.n}.` : ""}`)) : "<p>No rookies this year.</p>"}</section>
    <section class="panel"><h3>A year older</h3>${grew.length ? list(grew) : "<p>Nobody's overall rating went up this year.</p>"}</section>
    <button class="btn" data-a="season">${inCamp() ? "On to training camp" : "Back to the season"}</button>`;
}

/* ---------- Hallway recruiting ---------- */
// "about 1.6 weeks"
const weeksText = w => !w ? "none" : `${w < 1 ? "under a week" : `about ${Math.round(w * 10) / 10} weeks`}`;
// One athlete in a sentence: "Marcus Hill, junior next season. Plays basketball. Receiver 34, cornerback 29. Fast. High potential."
function prospectLine(p, s) {
  const sp = SPORTS.find(x => x.id === p.sport), st = strengths(p, s.level).map(a => ATTR_PRAISE[a]);
  return `${fullName(p)}, ${yearName(p)} next season. ${capFirst(sp ? sp.what : "")}. ${capFirst(posName(p.pos))} ${ovr(p, p.pos)}, ${posName(p.pos2)} ${ovr(p, p.pos2)}.${st.length ? ` ${capFirst(st.join(", "))}.` : ""} ${capFirst(POT_BANDS[p.potSeen])} potential. ${capFirst(INTEREST[p.interest])}.`;
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
