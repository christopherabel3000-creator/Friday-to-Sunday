// Friday to Sunday: trades (Milestone 5, step 7). Players and draft picks for up to three drafts
// ahead, between any two teams: in the offseason, in camp, and in the season until the deadline
// after week 9, as the NFL's is. What things are worth, a computer team's answer, offers that come to
// you, trades between computer teams, and trading a pick on draft day.
"use strict";

/* ---------- When trades are open ---------- */
const TRADE_DEADLINE = 9;
// (in the season, until week 9's game is in: the deadline is the Tuesday after it)
const tradesOpen = W => !!(W && W.lvl === "pro" && (W.phase === "offseason" || W.phase === "preseason" || (W.phase === "regular" && W.week <= TRADE_DEADLINE)));
// The next draft that hasn't been held
const draftYearNow = W => W.draft ? W.draft.year + (W.draft.done ? 1 : 0) : W.year + 1;

/* ---------- Draft picks ---------- */
// A pick: "2027:1:p5", the 2027 first-round pick that started as the p5 team's. W.pickOwner says who
// has each one that's been traded (everyone else has his own). Compensatory picks can't be traded.
const pickKey = (year, rd, orig) => `${year}:${rd}:${orig}`;
const parsePick = k => { const [y, r, o] = k.split(":"); return { year: +y, rd: +r, orig: o }; };
const pickOwnerOf = (W, k) => (W.pickOwner && W.pickOwner[k]) || parsePick(k).orig;
// The picks a team has now: the next three drafts, its own and the ones it got, minus the ones it
// traded, and none from a draft that's already been held
function teamPicks(W, id) {
  const first = draftYearNow(W), out = [];
  for (let y = first; y < first + 3; y++) for (let r = 1; r <= DRAFT_ROUNDS; r++) for (const o in W.schools) {
    const k = pickKey(y, r, o);
    if (pickOwnerOf(W, k) !== id) continue;
    if (W.draft && !W.draft.done && W.draft.year === y && W.draft.picks && W.draft.picks.some(pk => pk.key === k && pk.pid)) continue;
    out.push(k);
  }
  return out;
}
// Where a pick falls: its number in this year's order once that's known, otherwise the middle of
// its round
function pickNumber(W, k) {
  const p = parsePick(k), D = W.draft;
  if (D && D.year === p.year && D.picks) { const pk = D.picks.find(x => x.key === k); if (pk) return pk.n; }
  if (D && D.year === p.year && W.phase === "offseason") { const o = proDraftOrder(W).indexOf(p.orig); if (o >= 0) return (p.rd - 1) * 32 + o + 1; }
  return (p.rd - 1) * 32 + 16;
}
// The value chart, the way teams use one: 3,000 for the first pick, falling fast through the first
// round (590 for the 32nd), then more slowly (270 for the 64th, about 120 for the 96th, 25 for the
// 160th). A pick in a later draft is worth about a round less.
const chartValue = n => n <= 32 ? 3000 * Math.exp(-.052 * (n - 1)) : 590 * Math.exp(-.0245 * (n - 32));
function pickValue(W, k) {
  const p = parsePick(k), now = draftYearNow(W);
  return Math.round(chartValue(pickNumber(W, k) + 32 * Math.max(0, p.year - now)));
}
const roundWord = r => ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh"][r];
// "the Mustangs' 2027 first-round pick", with its number once the order is set
const possessive = name => /s$/.test(name) ? `${name}'` : `${name}'s`;
function pickName(W, k) {
  const p = parsePick(k), n = W.draft && W.draft.year === p.year && W.draft.picks ? pickNumber(W, k) : 0;
  return `the ${possessive(W.schools[p.orig].mascot)} ${p.year} ${roundWord(p.rd)}-round pick${n ? `, number ${n}` : ""}`;
}

/* ---------- What a player is worth in a trade ---------- */
// On the same chart: what he's worth over the years left on his contract against what he's paid
// (about $25,000 a point), plus a little for any good player, more for a young one. A team that needs
// his position values him a bit more.
function playerTradeValue(p, needs) {
  const yrs = Math.max(1, ctYears(p)), peak = peakAge(p);
  let surplus = 0;
  for (let k = 0; k < yrs; k++) {
    const decay = Math.max(.3, 1 - .14 * Math.max(0, p.age + k - peak - 1)), worth = proValue(p) * decay;
    surplus += (worth - (p.ct && p.ct.y[k] || 0)) * Math.pow(.9, k);
  }
  const o = ovr(p, p.pos), base = Math.max(0, o - 68) * 22 * (p.age <= 26 ? 1.3 : p.age >= 31 ? .6 : 1);
  const v = Math.max(0, surplus / (25000 * capScale()) + base);
  return Math.round(v * (needs && needs.includes(p.pos) ? 1.15 : 1));
}
// A side of a trade: { players: [ids], picks: [keys] }
function sideValue(W, teamFull, side, forTeam) {
  const needs = forTeam ? teamNeeds(forTeam) : null;
  return side.players.reduce((t, id) => { const p = teamFull.players.find(x => x.id === id); return t + (p ? playerTradeValue(p, needs) : 0); }, 0)
    + side.picks.reduce((t, k) => t + pickValue(W, k), 0);
}

/* ---------- A trade ---------- */
// The most a team can carry: 90 in the offseason (and your own camp), 53 once rosters are cut
const rosterMax = (W, s) => W.phase === "offseason" || (W.phase === "preseason" && isFull(s)) ? CAMP_MAX : PRO_ACTIVE;
// T: { with: team id, give: { players, picks }, get: { players, picks } } (give is yours)
const newTrade = id => ({ with: id, give: { players: [], picks: [] }, get: { players: [], picks: [] } });
// The other team's answer: { ok, ratio, word, why }. It takes a trade that gets it a bit more than it
// gives, that both teams can fit under the cap, and that leaves both rosters a legal size.
function tradeAnswer(W, T, from) {
  from = from || W.myId;
  const me = W.schools[from], them = W.schools[T.with], A = isFull(me) ? me : proRoster(me), B = isFull(them) ? them : proRoster(them);
  if (!T.give.players.length && !T.give.picks.length && !T.get.players.length && !T.get.picks.length) return { ok: false, ratio: 0, word: "Add something to the trade." };
  const recv = sideValue(W, A, T.give, B), give = sideValue(W, B, T.get, B), ratio = give ? recv / give : recv > 0 ? 9 : 0;
  const capIn = (s, ins, outs) => capRoom(s) - ins.reduce((t, p) => t + capHit(p), 0) + outs.reduce((t, p) => t + capHit(p), 0);
  const pin = T.give.players.map(id => A.players.find(x => x.id === id)).filter(Boolean), pout = T.get.players.map(id => B.players.find(x => x.id === id)).filter(Boolean);
  const max = rosterMax(W, me);
  if (capIn(B, pin, pout) < 0) return { ok: false, ratio, word: "They can't fit it under the cap." };
  if (capIn(A, pout, pin) < 0) return { ok: false, ratio, word: "You can't fit it under the cap." };
  if (from === W.myId && onActive(A).length - pin.length + pout.length > max) return { ok: false, ratio, word: `That would put you over ${max} players. Make room first.` };
  const word = ratio >= 1.08 ? "They'd take that." : ratio >= .95 ? "They'd want a bit more." : ratio >= .75 ? "They'd want more." : "Not close.";
  return { ok: ratio >= 1.08, ratio, word, recv, give };
}
// Players and picks change hands. A team on paper is unpacked and packed back; a team over its
// roster limit lets go of its lowest-rated player.
function doTrade(W, T, from) {
  from = from || W.myId;
  const ids = [from, T.with], full = {};
  ids.forEach(id => { full[id] = isFull(W.schools[id]) ? W.schools[id] : proRoster(W.schools[id]); });
  const A = full[from], B = full[T.with], move = (src, dst, pid) => { const p = src.players.find(x => x.id === pid); if (!p) return null; src.players = src.players.filter(x => x !== p); delete p.ir; p.o0 = ovr(p, p.pos); dst.players.push(p); return p; };
  const moved = { toThem: T.give.players.map(pid => move(A, B, pid)).filter(Boolean), toMe: T.get.players.map(pid => move(B, A, pid)).filter(Boolean) };
  W.pickOwner = W.pickOwner || {};
  T.give.picks.forEach(k => { W.pickOwner[k] = T.with; });
  T.get.picks.forEach(k => { W.pickOwner[k] = from; });
  if (W.draft && W.draft.picks) W.draft.picks.forEach(pk => { if (pk.key) pk.team = pickOwnerOf(W, pk.key); });
  ids.forEach(id => {
    const s = full[id];
    while (onActive(s).length > rosterMax(W, W.schools[id])) { const low = onActive(s).slice().sort((a, b) => ovr(a, a.pos) - ovr(b, b.pos))[0]; cutPlayer(s, low); }
    s.depth = autoDepth(s); s.rating = schoolRating(s);
    if (!isFull(W.schools[id])) W.schools[id] = Object.assign(proToPaper(s), { dead: s.dead, carry: s.carry });
  });
  REBUILT.clear();
  return moved;
}
// "The Mustangs get Marcus Hill and the 2027 second-round pick; the Express get Tyler Ross."
function tradeText(W, T, from) {
  const A = W.schools[from || W.myId], B = W.schools[T.with], nm = (s, side, holder) => {
    const full = isFull(s) ? s : proRoster(s);
    return andList(side.players.map(id => { const p = full.players.find(x => x.id === id); return p ? `${fullName(p)} (${posName(p.pos)} ${ovr(p, p.pos)})` : "?"; }).concat(side.picks.map(k => pickName(W, k, holder))));
  };
  const give = nm(A, T.give, A.id), get = nm(B, T.get, B.id);
  return `The ${B.mascot} get ${give || "nothing"}; the ${A.mascot} get ${get || "nothing"}.`;
}

/* ---------- Computer teams' trades ---------- */
// Now and then a computer team offers you a deal: one of your players at a position it needs, for
// picks (and sometimes a player) worth about what it gets, a little more. W.tradeOffer holds it
// until you answer (with control; your GM answers otherwise, and with the staff setting your staff).
function cpuOfferFor(W, rng) {
  const me = mySchool(), mine = me.players.filter(p => !p.ir && ctYears(p) >= 1 && ovr(p, p.pos) >= 70);
  if (!mine.length) return null;
  const others = Object.keys(W.schools).filter(id => id !== W.myId), id = others[Math.floor(rng() * others.length)], B = proRoster(W.schools[id]), needs = teamNeeds(B);
  const want = mine.filter(p => needs.includes(p.pos)).sort((a, b) => playerTradeValue(b, needs) - playerTradeValue(a, needs))[0];
  if (!want) return null;
  const T = newTrade(id), target = playerTradeValue(want, needs);
  T.give.players.push(want.id);
  // Their picks, best fit first, until it's worth a little more than he is to them
  let got = 0;
  teamPicks(W, id).map(k => [k, pickValue(W, k)]).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { if (got < target * 1.02 && got + v <= target * 1.25) { T.get.picks.push(k); got += v; } });
  if (got < target * .9) return null;
  const a = tradeAnswer(W, T);
  if (a.word.includes("cap") || a.word.includes("players")) return null;
  return T;
}
// Each week (and when the offseason's stages turn): maybe an offer for you, maybe a trade between two
// computer teams, maybe your GM makes the move you asked for
// (n: the week just played, or 0 in the offseason)
function tradeWeek(W, n) {
  if (W !== SEASON) return [];
  if (!W.myId || W.lvl !== "pro" || !(n ? W.phase === "regular" && n <= TRADE_DEADLINE : tradesOpen(W))) return [];
  const rng = seededRandom(hashSeed(`${W.seed}:${n}:trades`)), J = CAREER && CAREER.job, news = [];
  // An offer you haven't answered lapses after a week
  if (W.tradeOffer && W.tradeOffer.at !== n) W.tradeOffer = null;
  if (!W.tradeOffer && rng() < .2) {
    const T = cpuOfferFor(W, rng);
    if (T) {
      if (J && J.ctl && !J.staff.trades) { T.at = n; W.tradeOffer = T; news.push(`The ${W.schools[T.with].mascot} made you a trade offer.`); }
      else {
        // Your staff (or your GM) takes it if it gets a good deal back
        const back = sideValue(W, proRoster(W.schools[T.with]), T.get, mySchool()), out = sideValue(W, mySchool(), T.give, mySchool());
        if (back >= out * 1.1) { doTrade(W, T); news.push(`${J && J.ctl ? "Your staff" : "Your GM"} made a trade: ${tradeText(W, T)}`); }
      }
    }
  }
  // Two computer teams make a deal now and then
  if (rng() < .45) { const t = cpuCpuTrade(W, rng); if (t) news.push(`Trade: ${t}`); }
  // The move you asked your GM for, in the week before the deadline
  if (J && !J.ctl && J.req && J.req.move && n === TRADE_DEADLINE) {
    const pos = J.req.move, yes = gmFollows(`move:${W.year}:${pos}`), done = yes ? gmMove(W, pos) : null;
    (J.log = J.log || []).push({ yes: !!done, t: `Make a move at ${posName(pos)}: ${done ? `done. ${done}` : yes ? "he couldn't find a deal" : "he stood pat"}` });
    if (done) news.push(`Your GM made a trade: ${done}`);
    J.req.move = null;
  }
  if (news.length) { if (n) W.news[n] = (W.news[n] || []).concat(news); else if (W.off) W.off.news = W.off.news.concat(news); }
  return news;
}
// A computer team short at a position gets a player who'd start for it from a team that has a
// starter there already, for picks
function cpuCpuTrade(W, rng) {
  const ids = Object.keys(W.schools).filter(id => id !== W.myId), a = ids[Math.floor(rng() * ids.length)], A = proRoster(W.schools[a]), need = teamNeeds(A).find(pos => pos !== "K" && pos !== "P");
  if (!need) return null;
  const bar = startersAt(A, need)[(STARTERS[need] || 1) - 1] || 0;
  for (const b of ids.slice().sort(() => rng() - .5)) {
    if (b === a) continue;
    const B = proRoster(W.schools[b]), at = B.players.filter(p => p.pos === need && !p.ir).sort((x, y) => ovr(y, y.pos) - ovr(x, x.pos));
    const p = at.slice(1).find(x => ovr(x, x.pos) >= Math.max(68, bar + 2));
    if (!p) continue;
    const T = newTrade(b), target = playerTradeValue(p, [need]);
    T.get.players.push(p.id);
    let got = 0;
    teamPicks(W, a).map(k => [k, pickValue(W, k)]).sort((x, y) => y[1] - x[1]).forEach(([k, v]) => { if (got < target * 1.1 && got + v <= target * 1.4) { T.give.picks.push(k); got += v; } });
    if (got < target * 1.08) continue;
    const ans = tradeAnswer(W, T, a);
    if (!ans.ok) continue;
    const text = tradeText(W, T, a);
    doTrade(W, T, a);
    return text;
  }
  return null;
}
// Your GM's move at a position: a starter there from a team with one to spare, for picks
function gmMove(W, pos) {
  const me = mySchool(), bar = startersAt(me, pos)[(STARTERS[pos] || 1) - 1] || 0;
  for (const b of Object.keys(W.schools).filter(id => id !== W.myId)) {
    const B = proRoster(W.schools[b]), p = B.players.filter(x => x.pos === pos && ovr(x, x.pos) > bar + 2).sort((x, y) => ovr(y, y.pos) - ovr(x, x.pos))[0];
    if (!p) continue;
    const T = newTrade(b), target = playerTradeValue(p, teamNeeds(B));
    T.get.players.push(p.id);
    let got = 0;
    teamPicks(W, W.myId).map(k => [k, pickValue(W, k)]).sort((x, y) => y[1] - x[1]).forEach(([k, v]) => { if (got < target * 1.1 && got + v <= target * 1.4) { T.give.picks.push(k); got += v; } });
    if (!tradeAnswer(W, T).ok) continue;
    const text = tradeText(W, T);
    doTrade(W, T);
    return text;
  }
  return null;
}

// Is a trade still good: every player still with his team, every pick still in its team's hands?
function tradeStands(W, T, from) {
  from = from || W.myId;
  const has = (id, side) => { const s = W.schools[id], f = isFull(s) ? s : proRoster(s), picks = teamPicks(W, id); return side.players.every(pid => f.players.some(p => p.id === pid)) && side.picks.every(k => picks.includes(k)); };
  return has(from, T.give) && has(T.with, T.get);
}

/* ---------- Draft day ---------- */
// On the clock, teams behind you call to move up: one of their picks later in this draft (within a
// round of yours) and more picks to make up the chart, as teams trading up usually pay
function tradeDownOffers(W, D) {
  const cur = D.picks && D.picks[D.cur];
  if (!cur || !cur.key || cur.team !== W.myId) return [];
  const val = pickValue(W, cur.key), out = [], seen = new Set();
  for (const pk of D.picks.slice(D.cur + 1)) {
    if (out.length >= 3 || pk.n > cur.n + 32) break;
    if (pk.team === W.myId || !pk.key || seen.has(pk.team)) continue;
    seen.add(pk.team);
    const T = newTrade(pk.team);
    T.give.picks.push(cur.key); T.get.picks.push(pk.key);
    let got = pickValue(W, pk.key);
    teamPicks(W, pk.team).filter(k => k !== pk.key).map(k => [k, pickValue(W, k)]).sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => { if (got < val * 1.02 && got + v <= val * 1.15) { T.get.picks.push(k); got += v; } });
    if (got >= val * .97) out.push(T);
  }
  return out;
}
