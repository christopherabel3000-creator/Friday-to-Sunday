// Friday to Sunday: the pro offseason and free agency (Milestone 5, step 6). In the NFL's order:
// re-signing and the franchise tag, the new league year (contracts run out, retirements, the new
// cap), five days of free agency, cheap one-year deals for whoever's left, compensatory picks, then
// the draft (pdraft.js) and, when the new season starts, every player a year older (pcap.js).
"use strict";

/* ---------- The offseason, stage by stage ---------- */
// W.off: { stage: "resign", "fa", "draft"; day: free agency's day (1 to 5); pool: free agents as
// short records; offers: { player id: [{ team, yrs, pay, g }] }; rs: your re-signing choices
// { player id: "ext", "tag", "opt", "keep" or "go" }; mine: what happened to your team; news; lost
// and gained: free agents each team lost and signed, for compensatory picks }
const FA_DAYS = 5, FA_NEED = [1, .96, .92, .88, .84];
function proOffseasonStart(W) {
  if (W.off) return W.off;
  W.off = { stage: "resign", day: 0, pool: [], offers: {}, rs: {}, mine: { retired: [], left: [], kept: [], signed: [] }, news: [], lost: {}, gained: {} };
  W.capNext = capFor(W.year + 1, W.cap, dice(hashSeed(`${W.world}:${W.year + 1}:cap`)));
  if (W.draft) combine(W.draft);
  return W.off;
}
// Runs fn with every team in full (the ones on paper unpacked, then packed back)
function withTeams(W, fn) {
  const T = {};
  for (const id in W.schools) T[id] = isFull(W.schools[id]) ? W.schools[id] : proRoster(W.schools[id]);
  try { return fn(T); } finally {
    for (const id in W.schools) if (!isFull(W.schools[id])) { const s = T[id], keep = { dead: s.dead, carry: s.carry }; W.schools[id] = Object.assign(proToPaper(s), keep); }
  }
}
// What a team still owes next year: every contract's next year, and about what its draft picks will cost
const nextYearOwed = s => s.players.reduce((t, p) => t + (p.ct && p.ct.y[1] || 0), 0);
const ROOKIE_RESERVE = 12e6;
function nextYearRoom(W, s) {
  return (W.capNext || capNow()) - nextYearOwed(s) - ROOKIE_RESERVE * capScale() - 22 * proMin(0);
}
// The players whose contracts end after this season (not the practice squad's, whose deals run a year)
const expiringOf = s => s.players.filter(p => ctYears(p) === 1);

/* ---------- Re-signing, the tag and the fifth-year option ---------- */
// What a player asks for: about what he's worth, a little more after a big year
const askFor = p => Math.round(proValue(p) * (ovr(p, p.pos) >= 80 ? 1.08 : 1) / 5000) * 5000;
// The franchise tag: one player a year, for one more year at the average of the five biggest cap hits
// at his position, or 120 percent of his own pay if that's more, fully guaranteed
// (each position's figure is worked out once an offseason, from the cap hits when it starts)
function tagPrice(W, p) {
  const off = W.off || {};
  if (!off.tagBase) {
    const hits = {};
    for (const id in W.schools) { const s = W.schools[id]; (isFull(s) ? s.players : (s.roster || []).map(unpackPlayer)).forEach(q => { (hits[q.pos] = hits[q.pos] || []).push(capHit(q)); }); }
    off.tagBase = {};
    for (const pos in hits) off.tagBase[pos] = Math.round(avg(hits[pos].sort((a, b) => b - a).slice(0, 5)));
  }
  return Math.round(Math.max(off.tagBase[p.pos] || 0, capHit(p) * 1.2) / 5000) * 5000;
}
// A first-round pick's fifth-year option: one more year at about what he's worth, fully guaranteed
const optionPrice = p => Math.round(Math.max(proValue(p), capHit(p) * 1.25) / 5000) * 5000;
// An extension: new years after the one left, at his ask (a year at his pay plus 10 percent for a
// player with fewer than four seasons)
function extensionFor(p, rng) {
  if ((p.exp || 0) < 3) return makeContract(Math.max(proMin(p.exp + 1), Math.round(capHit(p) * 1.1 / 5000) * 5000), 1, { g: 0 });
  const yrs = p.age >= 32 ? 1 : p.age >= 30 ? 2 : 2 + Math.floor((rng || rand)() * 3);
  return makeContract(askFor(p), yrs);
}
// (the new years' guarantee is kept apart until this year's pay is off the books: gx)
function addYears(p, ct) {
  p.ct.y = p.ct.y.concat(ct.y);
  p.ct.gx = (p.ct.gx || 0) + (ct.g || 0);
  p.ct.rk = false; p.ct.o5 = false;
}
// A team's choices before free agency: the tag on its best expiring player if he's worth it, the
// fifth-year option, and extensions for the players it wants most within its money. For your team,
// your choices (with control) or your GM's (with your requests in mind).
function teamResign(W, s, rng, mine) {
  const J = mine && CAREER && CAREER.job, rs = mine ? W.off.rs : {}, ctl = !!(J && J.ctl), req = mine && J ? myReq() : null, out = { kept: [], tag: null };
  let budget = nextYearRoom(W, s);
  const ex = expiringOf(s).sort((a, b) => proValue(b) - proValue(a)), ranked = s.players.slice().sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos));
  const wantN = 44, wants = p => ranked.indexOf(p) < wantN && ovr(p, p.pos) >= 62;
  let tagged = false;
  ex.forEach(p => {
    let how = mine && ctl ? rs[p.id] || null : null;
    if (!how) {
      const tp = (p.exp || 0) >= 4 && !tagged ? tagPrice(W, p) : 0;
      if (p.ct.o5 && wants(p) && proValue(p) >= optionPrice(p) * .85 && optionPrice(p) <= budget) how = "opt";
      else if (tp && proValue(p) >= tp * .9 && tp <= budget && ovr(p, p.pos) >= 78) how = "tag";
      else how = wants(p) ? "ext" : "go";
      if (req && !ctl && (req.keep.includes(p.id) || req.go.includes(p.id))) {
        const keep = req.keep.includes(p.id), yes = gmFollows(`${keep ? "keep" : "go"}:${p.id}`);
        J.log = J.log || [];
        J.log.push({ yes, t: `${keep ? "Keep" : "Let go"} ${fullName(p)}: ${yes ? (keep ? "the GM went to work on a new contract" : "the GM let his contract run out") : keep ? "the GM let his contract run out" : "the GM kept him"}` });
        if (yes) how = keep ? (how === "go" ? "ext" : how) : "go";
        else if (!keep && how === "go") how = "ext";
        if (yes && keep) p.ask1 = true;
        if (yes && !keep) p.lg = s.id;
      }
    } else if (how === "go") p.lg = s.id;
    if (how === "tag" && !tagged) {
      const price = tagPrice(W, p);
      if (price <= budget + (mine ? 1e12 : 0)) { addYears(p, makeContract(price, 1, { g: 1 })); p.tag = W.year + 1; tagged = true; budget -= price; out.tag = p; out.kept.push(p); return; }
      how = "ext";
    }
    if (how === "opt" && p.ct.o5) { const price = optionPrice(p); addYears(p, makeContract(price, 1, { g: 1 })); budget -= price; out.kept.push(p); return; }
    if (how === "ext" || how === "keep") {
      const ct = extensionFor(p, rng), over = p.ask1 ? 20 * proMin(0) : 0;
      delete p.ask1;
      if (ct.y[0] <= budget + over || (mine && ctl)) { addYears(p, ct); budget -= ct.y[0]; out.kept.push(p); return; }
    }
  });
  return out;
}
function proResignAll(W) {
  const off = proOffseasonStart(W);
  if (off.stage !== "resign") return;
  withTeams(W, T => {
    for (const id in T) {
      const mine = id === W.myId, rng = seededRandom(hashSeed(`${W.world}:${W.year}:${id}:resign`)), r = teamResign(W, T[id], rng, mine);
      if (mine) off.mine.kept = r.kept.map(p => p.id);
      if (r.tag && (mine || r.tag.r && ovr(r.tag, r.tag.pos) >= 82)) off.news.push(`The ${schoolName(T[id])} put the franchise tag on ${fullName(r.tag)}, ${posName(r.tag.pos)}.`);
    }
  });
  proLeagueYear(W);
}

/* ---------- The new league year ---------- */
// The new cap, every contract a year shorter (what was paid comes off the guarantee), and whoever has
// nothing left becomes a free agent. Retirements come now, and dead money starts over; last year's
// unused cap space carries over (up to $30 million, in 2026 dollars).
function proLeagueYear(W) {
  const off = W.off, oldCap = W.cap, pool = [];
  W.cap = W.capNext || capFor(W.year + 1, W.cap); W.capYear = W.year + 1;
  withTeams(W, T => {
    for (const id in T) {
      const s = T[id], mine = id === W.myId, rng = seededRandom(hashSeed(`${W.world}:${W.year}:${id}:leagueyear`));
      const carry = Math.max(0, Math.min(oldCap + (s.carry || 0) - capUsed(s), 30e6 * capScale()));
      s.players.concat(s.ps || []).forEach(p => { delete p.ir; delete p.up; if (p.inj && p.inj.w < 50) delete p.inj; });
      // Retirements (a year older now, by the time camp opens)
      const stay = p => { if (retires(Object.assign({}, p, { age: p.age + 1 }), rng)) { if (mine) off.mine.retired.push(proBrief(p)); return false; } return true; };
      s.players = s.players.filter(stay);
      s.ps = (s.ps || []).filter(stay);
      [s.players, s.ps].forEach(list => list.forEach(p => { if (!p.ct) return; const paid = p.ct.y.shift() || 0; p.ct.g = Math.max(0, (p.ct.g || 0) - paid) + (p.ct.gx || 0); delete p.ct.gx; }));
      // The practice squad's young players stay on it; its veterans are free agents
      const psGone = s.ps.filter(p => (p.exp || 0) >= 2);
      s.ps = s.ps.filter(p => !psGone.includes(p));
      s.ps.forEach(p => { p.ct = makeContract(PS_PAY, 1, { g: 0 }); });
      const gone = s.players.filter(p => !p.ct || !p.ct.y.length);
      s.players = s.players.filter(p => !gone.includes(p));
      gone.concat(psGone).forEach(p => { delete p.ct; p.from = id; pool.push(p); if (mine) off.mine.left.push(proBrief(p)); });
      s.dead = 0; s.carry = carry;
    }
  });
  off.pool = pool.map(packPlayer);
  off.stage = "fa"; off.day = 0;
}
const proBrief = p => ({ name: fullName(p), pos: p.pos, ovr: ovr(p, p.pos), age: p.age, stats: careerStatLine(p.cs) });

/* ---------- Free agency ---------- */
// Each day: the computer teams (and your GM, without control) make offers, by their needs and their
// room; then each free agent looks at his offers and signs the best one if it's close enough to what
// he asked for (less close as the days go by). What a player cares about: the money, the guarantee,
// his chance to start, the team's chance to win, and the coach.
const faPlayers = W => W.off.pool.map(unpackPlayer);
function pendingFor(W, team) { let t = 0; for (const pid in W.off.offers) W.off.offers[pid].forEach(o => { if (o.team === team) t += o.pay; }); return t; }
// A team's best at a position: what a free agent would have to beat to start
function startersAt(s, pos) { return s.players.filter(p => p.pos === pos).map(p => ovr(p, p.pos)).sort((a, b) => b - a); }
function startChance(s, p) { const at = startersAt(s, p.pos), n = STARTERS[p.pos] || 1, bar = at[n - 1] || 0; return ovr(p, p.pos) >= bar ? 1 : ovr(p, p.pos) >= bar - 4 ? .5 : 0; }
function offerScore(W, p, o, T) {
  const s = T[o.team], ask = askFor(p), total = o.pay * o.yrs, rank = Object.values(T).filter(x => (x.rating.off + x.rating.def) > (s.rating.off + s.rating.def)).length;
  const coach = s.coach && (s.coach.rep != null ? s.coach.rep : isYou(s.coach) ? (CAREER.prep || 20) : 30);
  return .55 * (o.pay / ask) + .15 * (o.g / Math.max(1, total)) + .12 * startChance(s, p) + .1 * (1 - rank / 31) + .08 * clamp(coach / 100, 0, 1) + (isYou(s.coach) && coachHas(s.coach, "rcr") ? .02 : 0);
}
// A computer team's offers for the day: up to two, at its biggest needs, for free agents who'd start
// or nearly, within its room. A GM who buys in free agency pays a little more.
function teamOffers(W, s, FA, needs, want) {
  const gm = proGM(s), room = capRoom(s) - pendingFor(W, s.id) - ROOKIE_RESERVE * capScale() - 10 * proMin(0), made = [];
  let left = room;
  // (never a player this team just let go on purpose)
  const cands = FA.filter(p => p.lg !== s.id && !(W.off.offers[p.id] || []).some(o => o.team === s.id));
  const pickFor = pos => cands.filter(p => p.pos === pos && startChance(s, p) > 0 && askFor(p) <= left).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos))[0];
  const list = (want ? [want] : []).concat(needs.map(pickFor).filter(Boolean));
  for (const p of list) {
    if (made.length >= 2 || made.includes(p)) continue;
    const ask = askFor(p), pay = Math.round(ask * (gm.ph === "fa" ? 1.08 : 1) * (.96 + .08 * seededRandom(hashSeed(`${W.seed}:${s.id}:${p.id}`))()) / 5000) * 5000;
    if (pay > left) continue;
    const ct = marketContract(p, seededRandom(hashSeed(`${W.seed}:${s.id}:${p.id}:yrs`)));
    (W.off.offers[p.id] = W.off.offers[p.id] || []).push({ team: s.id, yrs: ct.y.length, pay, g: Math.round(ct.g / ct.y[0] * pay / 5000) * 5000 });
    left -= pay; made.push(p);
  }
}
function proFADay(W) {
  const off = W.off;
  if (off.stage !== "fa") return;
  off.day++;
  const J = CAREER && CAREER.job, me = W.myId;
  withTeams(W, T => {
    let FA = faPlayers(W);
    const order = Object.keys(T).sort((a, b) => (hashSeed(`${W.seed}:${off.day}:${a}`) % 997) - (hashSeed(`${W.seed}:${off.day}:${b}`) % 997));
    // Computer offers start over each day; yours stay until you pull them or the player signs
    for (const pid in off.offers) off.offers[pid] = off.offers[pid].filter(o => o.team === me && J && J.ctl);
    order.forEach(id => {
      const s = T[id], mine = id === me;
      if (mine && J && J.ctl) return;
      const R = mine && J ? myReq() : null, needs = R && R.needs.length ? R.needs : teamNeeds(s);
      const want = R && R.want && off.day === 1 && gmFollows(`want:${R.want.id}`) ? FA.find(p => p.id === R.want.id) : null;
      if (mine && R && R.want && off.day === 1) { J.log = J.log || []; J.log.push({ yes: !!want, t: `Go after ${R.want.name}: ${want ? "the GM made him an offer" : "the GM passed"}` }); }
      teamOffers(W, s, FA, needs, want);
    });
    // The free agents decide
    const signed = [];
    FA.forEach(p => {
      const os = (off.offers[p.id] || []).filter(o => T[o.team]);
      if (!os.length) return;
      const best = os.map(o => [o, offerScore(W, p, o, T)]).sort((a, b) => b[1] - a[1])[0][0];
      if (best.pay < askFor(p) * FA_NEED[Math.min(off.day, FA_DAYS) - 1]) return;
      const s = T[best.team], y = []; for (let k = 0; k < best.yrs; k++) y.push(Math.round(best.pay * Math.pow(1.03, k) / 5000) * 5000);
      if (best.pay > capRoom(s) && best.team !== me) return;
      p.ct = { y, g: best.g * best.yrs <= y.reduce((a, b) => a + b, 0) ? best.g * best.yrs : y[0], rk: false, o5: false };
      p.ct.g = Math.min(p.ct.g, y.reduce((a, b) => a + b, 0));
      const from = p.from; delete p.from; delete p.lg;
      s.players.push(p); signed.push(p.id);
      if (from && from !== s.id) { (off.lost[from] = off.lost[from] || []).push(best.pay); (off.gained[s.id] = off.gained[s.id] || []).push(best.pay); }
      if (best.team === me) off.mine.signed.push(Object.assign(proBrief(p), { ct: proContractText(p) }));
      if (best.pay >= 10e6 * capScale() || best.team === me || from === me) off.news.push(`${fullName(p)}, ${posName(p.pos)}, signed with the ${schoolName(s)}: ${proContractText(p)}${from && from !== s.id ? ` He was with the ${schoolName(T[from])}.` : ""}`);
      delete off.offers[p.id];
    });
    FA = FA.filter(p => !signed.includes(p.id));
    off.pool = FA.map(packPlayer);
  });
  if (off.day >= FA_DAYS) proFAClose(W);
}
// After the fifth day: whoever's left signs a cheap one-year deal with a team short at his position
// (or isn't in the league this year), and the compensatory picks are set
function proFAClose(W) {
  const off = W.off;
  if (off.stage !== "fa") return;
  withTeams(W, T => {
    const FA = faPlayers(W).sort((a, b) => ovr(b, b.pos) - ovr(a, a.pos)), me = W.myId, J = CAREER && CAREER.job;
    FA.forEach(p => {
      const pay = Math.max(proMin(p.exp), Math.round(askFor(p) * .45 / 5000) * 5000);
      const team = Object.values(T).filter(s => !(s.id === me && J && J.ctl) && s.players.filter(q => q.pos === p.pos).length < ROSTER_MIX[p.pos] && capRoom(s) - ROOKIE_RESERVE * capScale() * .5 > pay && startersAt(s, p.pos).length < ROSTER_MIX[p.pos])
        .sort((a, b) => startChance(b, p) - startChance(a, p) || capRoom(b) - capRoom(a))[0];
      if (!team || ovr(p, p.pos) < 58 || team.id === p.lg) return;
      delete p.from; delete p.lg;
      p.ct = makeContract(pay, 1, { g: 0 });
      team.players.push(p);
      if (team.id === me) off.mine.signed.push(Object.assign(proBrief(p), { ct: proContractText(p) }));
    });
  });
  off.pool = [];
  off.offers = {};
  W.comp = compPicks(W);
  off.stage = "draft";
}
// Compensatory picks: a team that lost more free agents than it signed gets a pick for each one
// more, by what he signed for (round 3 for the biggest contracts, down to round 7), at most four a
// team and 32 in all, at the ends of rounds 3 to 7
function compPicks(W) {
  const off = W.off, out = [], big = 2 * proMin(4);
  Object.keys(W.schools).forEach(id => {
    const lost = (off.lost[id] || []).filter(v => v >= big).sort((a, b) => b - a), gained = (off.gained[id] || []).filter(v => v >= big).length;
    lost.slice(gained, gained + 4).forEach(v => out.push({ team: id, v, rd: v >= 20e6 * capScale() ? 3 : v >= 10e6 * capScale() ? 4 : v >= 5e6 * capScale() ? 5 : v >= 2.5e6 * capScale() ? 6 : 7 }));
  });
  return out.sort((a, b) => b.v - a.v).slice(0, 32).sort((a, b) => a.rd - b.rd || b.v - a.v);
}
// The rest of the offseason on its own (a league on paper, or whatever you leave when the season starts)
function proOffseasonAuto(W) {
  proOffseasonStart(W);
  if (W.off.stage === "resign") proResignAll(W);
  for (let guard = 0; guard < FA_DAYS + 2 && W.off.stage === "fa"; guard++) proFADay(W);
}

/* ---------- Your offers ---------- */
// An offer: years, pay a year, and the share guaranteed. It has to fit in your room this year (less
// what your other offers would take). Returns "" when it's made, or why not.
const FA_GTD = [["low", .1], ["some", .35], ["most", .65]];
function myFAOffer(W, pid, yrs, pay, gShare) {
  const off = W.off, J = CAREER && CAREER.job, s = mySchool();
  if (!off || off.stage !== "fa" || !J || !J.ctl) return "Free agency isn't open.";
  const p = faPlayers(W).find(x => x.id === pid);
  if (!p) return "He's signed.";
  const list = (off.offers[pid] || []).filter(o => o.team !== s.id), room = capRoom(s) - pendingFor(W, s.id) + ((off.offers[pid] || []).find(o => o.team === s.id) || { pay: 0 }).pay;
  if (pay > room) return `That's more than your room: ${bigMoney(Math.max(0, room))}.`;
  off.offers[pid] = list.concat([{ team: s.id, yrs, pay, g: Math.round(pay * gShare / 5000) * 5000 }]);
  return "";
}
function pullFAOffer(W, pid) { const off = W.off; if (off && off.offers[pid]) off.offers[pid] = off.offers[pid].filter(o => o.team !== W.myId); }
