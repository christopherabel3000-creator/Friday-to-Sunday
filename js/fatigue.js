// Friday to Sunday: fatigue, rotation and injuries during a game
// Every player starts a game fresh (energy 100, a little less after a hard week of practice). Each snap on the field costs energy, more for
// linemen than for quarterbacks, less for players with good stamina. Players recover on the bench,
// between quarters, at halftime and during timeouts. Two-way starters rarely leave the field, so they
// wear down the most. A tired player plays below his ratings, and before each snap a coach's rotation
// setting sits tired starters when the depth chart has a fresh backup behind them.
"use strict";

/* ---------- Energy ---------- */
// Energy each snap costs, by the spot a player fills
const TIRE_COST = { QB: .55, RB: .95, WR: .8, TE: .9, OL: .95, DL: 1, LB: .95, CB: .82, S: .8, K: 0, P: 0 };
const BENCH_REST = 1.2;          // energy back for each snap on the bench
const BREAK_REST = { quarter: 5, half: 40, timeout: 2, change: .8 };
// Stamina: a 50 is average, an 80 tires about a fifth slower and recovers faster
const staminaMul = p => .7 + .006 * (p.sta || 50);
// How much of his ratings a tired player keeps: all of them when fresh, about 88 percent at half energy
const fatigueMul = en => 1 - .35 * Math.pow(1 - clamp(en == null ? 100 : en, 0, 100) / 100, 1.5);
// The words a screen reader hears for a player's energy
function energyWord(en) {
  if (en == null || en >= 85) return "fresh";
  if (en >= 65) return "tiring";
  if (en >= 45) return "tired";
  return "exhausted";
}
const energyText = en => `${energyWord(en)}, ${Math.round(en)} percent`;
// A player on the field as he plays right now: his ratings scaled by fatigue. Everything else (name,
// id, positions) is his own, so stats still go to him.
function fatView(p) {
  const f = fatigueMul(p.en);
  if (f >= .999) return p;
  const r = {};
  for (const a in p.r) r[a] = a === "leg" || a === "kac" ? p.r[a] : p.r[a] * f;
  return Object.assign({}, p, { r, base: p });
}
const baseOf = p => p && p.base ? p.base : p;
// A new game: everyone fresh, nobody resting
function freshGame(team, rot, fresh) {
  team.players.forEach(p => { p.en = fresh || 100; p.rest = false; });
  team.rot = ROTATION[rot] ? rot : "normal";
}
// After a scrimmage snap: the players on the field tire, everyone else catches his breath
function tireSnap(o, opk, dpk) {
  [[o, OFF_PKGS[opk] ? opk : "p11"], [1 - o, DEF_PKGS[dpk] ? dpk : "nickel"]].forEach(([t, pk]) => {
    const team = S.teams[t], lu = lineupFor(team, pk), on = new Set();
    for (const pos in lu) lu[pos].forEach(p => {
      on.add(p.id);
      p.en = Math.max(0, p.en - (TIRE_COST[pos] || .6) / staminaMul(p));
    });
    team.players.forEach(p => { if (!on.has(p.id)) p.en = Math.min(100, p.en + BENCH_REST * staminaMul(p)); });
  });
  S.fe = (S.fe || 0) + 1;
}
// A break in play (a quarter ends, halftime, a timeout, the ball changes hands): everyone recovers some
function restAll(kind) {
  if (!S || !S.teams) return;
  const add = BREAK_REST[kind] || 0;
  S.teams.forEach(team => team.players.forEach(p => { if (p.en != null) p.en = Math.min(100, p.en + add * (kind === "half" ? 1 : staminaMul(p))); }));
  S.fe = (S.fe || 0) + 1;
}

/* ---------- Rotation ---------- */
// Each coach picks how hard to rotate. out: a starter sits when his energy drops below this, if a
// fresh backup is ready. back: he comes back in once he's recovered to this.
const ROTATION = {
  keep: { name: "Keep starters in", desc: "Starters come out only when they're exhausted.", out: 30, back: 55 },
  normal: { name: "Normal", desc: "Tired starters take a breather when a fresh backup is ready.", out: 55, back: 78 },
  often: { name: "Rotate often", desc: "Fresh legs: starters sit as soon as they tire, and backups play a lot more.", out: 70, back: 88 }
};
const ROTATION_IDS = ["keep", "normal", "often"];
// Before each snap: who sits and who comes back. Returns what changed, for the coach's notes:
// [{ out: player, in: player, pos }, { back: player }]
function rotate(t) {
  const team = S.teams[t], R = ROTATION[team.rot] || ROTATION.normal, notes = [];
  team.players.forEach(p => { if (p.rest && p.en >= R.back) { p.rest = false; notes.push({ back: p }); } });
  OFF_POS.concat(DEF_POS).forEach(pos => {
    const ids = (team.depth[pos] || []).filter(id => { const p = playerById(team, id); return p && !p.inj; });
    // Only players listed here can spell a starter: nobody gets a lineman's snaps at receiver
    const backups = ids.slice(STARTERS[pos]).map(id => playerById(team, id));
    ids.slice(0, STARTERS[pos]).map(id => playerById(team, id)).forEach(p => {
      if (p.rest || p.en >= R.out) return;
      const sub = backups.find(b => !b.rest && b.en >= R.back && !startsOnSide(team, b, pos));
      if (sub) { p.rest = true; notes.push({ out: p, in: sub, pos }); }
    });
  });
  if (notes.length) team.dver = (team.dver || 0) + 1;
  return notes;
}
// Whether a player already starts somewhere else on the same side of the ball as pos
function startsOnSide(team, p, pos) {
  const side = OFF_POS.includes(pos) ? OFF_POS : DEF_POS;
  return side.some(x => x !== pos && (team.depth[x] || []).slice(0, STARTERS[x]).includes(p.id));
}
// The coach's note for one team's changes: "Porter takes a breather; York in at running back."
function rotationNote(notes) {
  const outs = notes.filter(n => n.out).map(n => `${n.out.last} takes a breather, and ${n.in.last} comes in at ${slotName(n.pos)}`);
  const backs = notes.filter(n => n.back).map(n => n.back.last);
  const parts = outs.slice();
  if (backs.length) parts.push(`${andList(backs)} ${backs.length > 1 ? "are" : "is"} back in`);
  return parts.length ? capFirst(parts.join(". ")) + "." : "";
}

/* ---------- Injuries ---------- */
// Each team has a small chance on every scrimmage snap that somebody on the field gets hurt: about one
// player in three games for each team. The ball carrier and the tackler are the likeliest, then a
// tired player, then one with poor health. Most injured players are out for the rest of the game;
// some miss weeks (practice.js has the lengths, and heals them week by week).
const GAME_INJ_RATE = .0028;
function injurySnap(r) {
  if (!S || !S.teams || r.preSnap || !S.snap) return "";
  const notes = [], hot = new Set([r.carId, r.tklId, r.tgtId, r.covId].filter(Boolean)), watching = S.teams[0].cpu && S.teams[1].cpu;
  [0, 1].forEach(t => {
    if (rand() >= GAME_INJ_RATE) return;
    const isOff = t === S.snap.poss, pk = isOff ? (OFF_PKGS[S.offPkg] ? S.offPkg : "p11") : (DEF_PKGS[S.defPkg] ? S.defPkg : "nickel");
    const lu = onField(t, pk), team = S.teams[t];
    const p = pickBy(lineupPlayers(lu).map(baseOf), q => (hot.has(q.id) ? 2.5 : 1) * (1 + (100 - (q.en == null ? 100 : q.en)) / 60) * healthMul(q));
    if (!p || p.inj) return;
    const pos = Object.keys(lu).find(k => lu[k].some(q => baseOf(q).id === p.id));
    p.inj = { w: injuryLength(GAME_INJ, rand), at: "game" };
    p.rest = false;
    team.dver = (team.dver || 0) + 1;
    const next = pos ? depthOrder(team, pos).find(q => q.id !== p.id && !q.inj) : null;
    const who = watching || team.cpu ? `${team.name}' ${p.last}` : p.last;
    notes.push(`${who} is hurt on the play and won't return.${next && (!team.cpu || watching) ? ` ${next.last} comes in at ${slotName(pos)}.` : ""}`);
  });
  return notes.join(" ");
}
// A game's injuries go with the players back to their school
function keepInjuries(gameTeam, school) {
  gameTeam.players.forEach(p => { if (!p.inj) return; const q = playerById(school, p.id); if (q && !q.inj) q.inj = clone(p.inj); });
}

