// Friday to Sunday: the snap
// Gridiron Duel rolls each snap from one edge: the play-call matchup plus personnel, styles,
// disguises and execution. Here the players on the field add their own edges, one for each part of
// the play, and their ratings set the level of play (see "How ratings change a snap" in DESIGN.md).
"use strict";

/* ---------- Ratings on the field ---------- */
// Gridiron Duel's numbers describe a game between players rated about 75 (the pros). The level-of-play
// adjustments below scale from there, so a small-school game plays like a small-school game.
const REF = 75;
// About 0.05 of edge per rating point of difference, capped at 2 each way, for each part of a play
const TALENT_K = .05, TALENT_CAP = 2;
const tEdge = (o, d) => clamp(TALENT_K * (o - d), -TALENT_CAP, TALENT_CAP);
// The players on the field for a team in a package, each as he plays right now (fatigue.js). Worked
// out once per snap: until the depth chart changes (team.dver) or anyone's energy does (S.fe).
const LINEUPS = new WeakMap();
function onField(t, pk) {
  const team = S.teams[t];
  let c = LINEUPS.get(team);
  if (!c || c.v !== team.dver || c.e !== S.fe) { c = { v: team.dver, e: S.fe, m: {} }; LINEUPS.set(team, c); }
  if (!c.m[pk]) { const lu = lineupFor(team, pk), out = {}; for (const pos in lu) out[pos] = lu[pos].map(fatView); c.m[pk] = out; }
  return c.m[pk];
}
const kickerOf = t => onField(t, "fgu").K[0];
const punterOf = t => onField(t, "punt").P[0];
const returnerOf = (t, slot) => starterAt(S.teams[t], slot);
// A random player from a list, weighted
function pickBy(list, wf) {
  list = (list || []).filter(Boolean); if (!list.length) return null;
  let tot = 0; const ws = list.map(p => { const w = Math.max(.01, wf(p)); tot += w; return w; });
  let x = rand() * tot;
  for (let i = 0; i < list.length; i++) { x -= ws[i]; if (x <= 0) return list[i]; }
  return list[list.length - 1];
}
const dbsOf = D => (D.CB || []).concat(D.S || []);
// The ball carrier on a run. The second back spells the starter now and then, and more often once
// the starter has carried it 18 times in a game, so even a run-first team spreads the load.
function pickCarrier(t, L) {
  const rbs = L.RB || [], lead = rbs[0], carries = lead && S.ps[lead.id] ? S.ps[lead.id].ru || 0 : 0;
  const spell = clamp(.15 + .012 * Math.max(0, carries - 18), .15, .45);
  if (rbs.length > 1 && rand() < .22) return rbs[1];
  // The second back comes in for a carry (tired backs also rotate out, fatigue.js)
  if (rbs.length === 1 && rand() < spell) {
    const on = new Set(lineupPlayers(L).map(p => p.id)), b = depthOrder(S.teams[t], "RB").find(p => !on.has(p.id) && !p.rest);
    if (b) return fatView(b);
  }
  return rbs[0] || (L.QB || [])[0];
}
// Who each pass play looks for
const TARGETS = { sc: { RB: 6, WR: 3, TE: 1 }, sp: { WR: 7, TE: 2, RB: .7 }, ms: { WR: 6, TE: 3, RB: 1.5 }, dp: { WR: 9, TE: 1 }, pa: { WR: 6, TE: 3, RB: 1 }, hm: { WR: 10, TE: 1 } };
function pickTarget(off, L) {
  if (off === "te") { const ol = L.OL || []; return { p: ol[ol.length - 1], pos: "OL", idx: 0 }; } // the tackle who reported eligible
  const w = TARGETS[off] || TARGETS.sp, deep = !!(OFFP[off] && OFFP[off].deep), cands = [];
  ["WR", "TE", "RB"].forEach(pos => (L[pos] || []).forEach((p, i) => {
    const look = (w[pos] || 0) * (i === 0 ? 1.3 : i === 1 ? 1 : .75);
    const skill = .5 + (pos === "RB" ? p.r.hnd : (p.r.hnd + p.r.rte) / 2) / 100 + (deep ? p.r.spd / 100 : 0);
    if (look > 0) cands.push({ p, pos, idx: i, w: look * skill });
  }));
  if (!cands.length) return { p: (L.QB || [])[0], pos: "QB", idx: 0 };
  let tot = 0; cands.forEach(c => tot += c.w);
  let x = rand() * tot;
  for (const c of cands) { x -= c.w; if (x <= 0) return c; }
  return cands[cands.length - 1];
}
// The defender in coverage on a target: corners on the outside receivers, then safeties and
// linebackers on the slot, tight ends and backs
function coverFor(tg, D) {
  const cbs = D.CB || [], ss = D.S || [], lbs = D.LB || [];
  if (tg.pos === "WR") return cbs[tg.idx] || ss[tg.idx - cbs.length] || lbs[0] || ss[0] || cbs[0];
  if (tg.pos === "TE") return pickBy(lbs.slice(0, 2).concat(ss), p => p.r.cov) || cbs[0];
  if (tg.pos === "RB") return pickBy(lbs.length ? lbs : ss, p => p.r.cov + 20) || cbs[0];
  return pickBy(lineupPlayers(D), p => p.r.cov);
}
// Who makes the tackle: linemen near the line, then linebackers, then the secondary
function pickTackler(D, kind, y, cov) {
  const groups = kind === "pass" ? [[cov ? [cov] : [], 6], [D.LB, 1.6], [D.S, 1.6], [D.CB, 1]]
    : y <= 0 ? [[D.DL, 6], [D.LB, 4]]
    : y <= 4 ? [[D.DL, 3], [D.LB, 5], [D.S, 1.5], [D.CB, .5]]
    : y <= 12 ? [[D.DL, 1], [D.LB, 4.5], [D.S, 3], [D.CB, 1.5]]
    : [[D.LB, 1.5], [D.S, 5], [D.CB, 3.5]];
  const live = groups.filter(([g]) => g && g.length);
  if (!live.length) return pickBy(lineupPlayers(D), p => p.r.tkl);
  let tot = 0; live.forEach(([, w]) => tot += w);
  let x = rand() * tot, grp = live[0][0];
  for (const [g, w] of live) { x -= w; if (x <= 0) { grp = g; break; } }
  return pickBy(grp, p => p.r.tkl + p.r.spd * .3);
}
// The edges from the players, one for each part of the play (positive favors the offense):
//   blk: run blocking against the front; car: the ball carrier against the tacklers
//   pro: pass protection against the rush; thr: the throw and catch against the coverage;
//   spd: the receiver against the defender after the catch
function talentEdges(off, def, x) {
  const P = OFFP[off], L = x.L, D = x.D, e = {};
  if (P.kind === "run") {
    const helpers = (L.TE || []).concat((L.RB || []).length > 1 ? [L.RB[1]] : []);
    let blkO = unitAvg(L.OL, { rbk: .8, str: .2 });
    if (helpers.length) blkO = blkO * .78 + unitAvg(helpers, { blk: .6, str: .4 }) * .22;
    const blkD = unitAvg(D.DL, { rst: .7, str: .3 }) * .65 + unitAvg(D.LB, { tkl: .5, str: .25, awr: .25 }) * .35;
    e.blk = tEdge(blkO, blkD);
    const c = x.car;
    const carO = off === "qs" ? c.r.str * .6 + c.r.elu * .2 + c.r.spd * .2 : c.r.elu * .45 + c.r.spd * .35 + c.r.str * .2;
    e.car = tEdge(carO, unitAvg((D.LB || []).concat(D.S || []), { tkl: .6, spd: .25, awr: .15 }));
  } else {
    let proD = unitAvg(D.DL, { prs: .8, spd: .2 });
    if (["ab", "zb", "rb", "blk"].includes(def)) proD = proD * .75 + unitAvg(D.LB, { spd: .5, str: .3, tkl: .2 }) * .25;
    e.pro = tEdge(unitAvg(L.OL, { pbk: .85, awr: .15 }), proD);
    const q = x.qb, t = x.tgt.p, cv = x.cov;
    e.thr = tEdge(q.r.acc * .55 + (t.r.rte * .5 + t.r.hnd * .5) * .45, cv.r.cov * .7 + unitAvg(dbsOf(D), { cov: 1 }) * .3);
    e.spd = tEdge(t.r.spd * .7 + t.r.elu * .3, cv.r.spd * .6 + cv.r.tkl * .4);
  }
  return e;
}
// Ball security, for any ball carrier: 1 at the pro reference, more fumbles below it
const fumLvl = p => clamp(1 - .01 * (p.r.bsc - REF), .6, 1.8);

/* ---------- Simulation ---------- */
// Who won the snap is judged by what actually happened, then explained with the call matchup.
function playScore(r, snap) {
  if (r.head === "Touchdown") return 2;
  if (r.tod || ["Picked off", "Pick six", "Fumble", "Scoop & score", "Safety", "Sack"].includes(r.head)) return -2;
  if (r.head === "Incomplete") return -1;
  const y = r.y, toGo = snap.toGo;
  if (y < 0) return -2;
  if (y === 0) return -1;
  if (y >= 15 || (y >= toGo && y >= 10)) return 2;
  if (y >= 10) return 1;
  const need = snap.down === 1 ? .4 * toGo : snap.down === 2 ? .6 * toGo : toGo;
  return y >= need ? 1 : -1;
}
function verdict(r, snap) {
  const v = verdictCalls(r, snap), pe = r.pe || 0;
  if (Math.abs(pe) >= 1 && OFF_PKGS[r.opk] && DEF_PKGS[r.dpk])
    v.t += ` ${OFF_PKGS[r.opk].name} against ${DEF_PKGS[r.dpk].name} ${pe > 0 ? "gave the offense an edge" : "favored the defense"}.`;
  // Explain the snap with the team identities when a style strength or weak spot pointed the same way as the result
  const sp = r.sp, o = r.team;
  let noted = false;
  // (Not every time, so the note stays worth reading.)
  if (sp && S.teams && o != null && rand() < .6) {
    const dsId = defStyleOf(1 - o), os = OFF_STYLES[offStyleOf(o)], ds = DEF_STYLES[dsId], on = OFFP[r.offId].name, dn = DEFP[r.defId] ? DEFP[r.defId].name : "";
    const run = OFFP[r.offId].kind === "run", n0 = v.t.length;
    const defStrong = dsId === "nfz" ? `Throwing on the ${ds.name} secondary is tough.` : dsId === "rs" ? `The ${ds.name} front is built to stop the run.` : `The ${ds.name} defense is built for ${dn}.`;
    const defSoft = dsId === "nfz" ? `Runs are the soft spot in a ${ds.name} defense.` : dsId === "rs" ? `Deep throws are the soft spot in a ${ds.name} defense.` : `${dn} is a soft spot for a ${ds.name} defense.`;
    if (v.c === "o" && sp.off >= .4) v.t += ` ${on} is a strength of the ${os.name} offense.`;
    else if (v.c === "d" && sp.def >= .4) v.t += " " + defStrong;
    else if (v.c === "d" && sp.off <= -.4) v.t += ` ${on} is a weak spot for the ${os.name} offense.`;
    else if (v.c === "o" && sp.def <= -.3 && (dsId !== "nfz" || run)) v.t += " " + defSoft;
    noted = v.t.length > n0;
  }
  // The week's film study, when the side that studied won the snap
  if (!noted && r.pr && rand() < .6 && ((r.pr > 0 && v.c === "o") || (r.pr < 0 && v.c === "d"))) {
    const t = r.pr > 0 ? o : 1 - o;
    v.t += ` ${tname(t)} were ready for ${r.pr > 0 ? DEFP[r.defId].name : OFFP[r.offId].name}: the film study paid off.`;
    noted = true;
  }
  // A play still being learned, when it cost the side running it
  if (!noted && S.teams && o != null && rand() < .6) {
    if (v.c === "d" && r.mo != null && r.mo < 45) { v.t += ` The ${tname(o)} are still learning ${OFFP[r.offId].name}.`; noted = true; }
    else if (v.c === "o" && r.md != null && r.md < 45 && DEFP[r.defId]) { v.t += ` The ${tname(1 - o)} are still learning ${DEFP[r.defId].name}.`; noted = true; }
  }
  // Otherwise, the players: who won their part of the play
  if (!noted) { const tn = talentNote(r, v); if (tn) v.t += " " + tn; }
  return v;
}
function talentNote(r, v) {
  const T = r.T, off = v.c === "o";
  if (!T) return "";
  if (r.kind === "run" && !r.scr) {
    if (off && T.blk >= .8) return "The line won up front.";
    if (!off && T.blk <= -.8) return "Their front won at the line.";
    if (off && T.car >= .8 && r.y >= 8) return "The back made tacklers miss.";
    return "";
  }
  if (r.head === "Sack" && T.pro <= -.8) return "Their pass rush beat the protection.";
  if (off && T.thr >= .8 && r.y > 0 && !r.scr) return "The receiver won the matchup.";
  if (!off && T.thr <= -.8 && r.head === "Incomplete") return "The coverage won.";
  return "";
}
function verdictCalls(r, snap) {
  const s = playScore(r, snap), m = r.mc != null ? r.mc : r.m, on = OFFP[r.offId].name, dn = DEFP[r.defId].name;
  if (s > 0) {
    if (m > 0) return { c: "o", t: s === 2 ? `Offense wins the call. ${on} beats ${dn}.` : `Offense wins the snap. ${on} was the right call against ${dn}.` };
    if (m === 0) return { c: "o", t: s === 2 ? "Offense wins the snap with a big play." : "Offense wins the snap." };
    return { c: "o", t: `Offense wins the snap anyway. ${dn} had ${on} covered on paper, but they made it work.` };
  }
  if (m < 0) return { c: "d", t: s === -2 ? `Defense wins the call. ${dn} shuts down ${on}.` : `Defense wins the snap. ${dn} was the right call against ${on}.` };
  if (m === 0) return { c: "d", t: s === -2 ? "Defense wins the snap with a big stop." : "Defense wins the snap." };
  return { c: "d", t: `Defense wins the snap anyway. ${on} had ${dn} beat on paper, but the defense made the play.` };
}

const INT_SCALE = .8; // interceptions trimmed 20% after Gridiron Duel's full-game simulation check
// The dice for one snap: yards, and whether it was a sack, scramble, interception, incompletion or
// fumble. x: the players involved and the talent edges.
function rollPlay(off, def, opk, dpk, side) {
  opk = opk || "p11"; dpk = dpk || "nickel"; side = !!side && sideOn(off);
  const o = S.poss, P = OFFP[off];
  const L = onField(o, OFF_PKGS[opk] ? opk : "p11"), D = onField(1 - o, DEF_PKGS[dpk] ? dpk : "nickel");
  const x = { L, D, qb: (L.QB || [])[0] || starterAt(S.teams[o], "QB") };
  if (P.kind === "run") x.car = off === "qs" ? x.qb : pickCarrier(o, L);
  else { x.tgt = pickTarget(off, L); x.cov = coverFor(x.tgt, D); }
  const T = x.T = talentEdges(off, def, x);
  // Execution: disguises, the coaches, how well each side knows its call, and the week's film study
  const mo = masteryOf(o, off), md = masteryOf(1 - o, def), pr = prepEdge(o, off, def);
  const dc = (S.look && S.look.fake ? DISGUISE_COST : 0) + execEdge(o) + specEdge(o, off) + masteryEdge(mo) - masteryEdge(md) + pr + perkEdge(o, off, def);
  const pe = pkgEdge(off, opk, dpk), se = styleEdge(off, def, o), m = clamp(M[off][def] + pe + se + dc + (side ? SIDE_EDGE[off][def] || 0 : 0), -3, 3);
  const OP = OFF_PKGS[opk] || {}, compMul = (OP.comp || {})[off] || 1, fumMul = masteryMul(mo, .008);
  // Missed tackles: weak tackling means more big plays
  const tklAbs = unitAvg((D.LB || []).concat(dbsOf(D)), { tkl: .7, spd: .3 }), bigMul = clamp(1 - .012 * (tklAbs - REF), .7, 1.8);
  let y = 0, time = 0, fumble = false, int = false, sack = false, inc = false, oob = false, scr = false;
  if (P.kind === "run") {
    const c = x.car;
    let tfl = Math.max(.02, P.tfl - .05 * m - .045 * T.blk) + (m <= -2 ? .12 : 0);
    if (rand() < tfl) y = -ri(1, 4);
    else {
      y = Math.max(-2, Math.round(normal(P.mean + (P.ms || 1.8) * m + 1.2 * T.blk + .5 * T.car, P.sd)));
      if (!P.noBig && rand() < Math.max(.005, P.big + .025 * m + .02 * T.car + .01 * T.blk) * bigMul * (side ? .5 : 1)) y += ri(12, 45);
      if (side && y > 2) y = Math.max(2, Math.round(y * .8));
    }
    fumble = rand() < P.fum * (m <= -2 ? 2 : 1) * fumLvl(c) * fumMul;
    oob = rand() < (side ? (y > 0 ? .75 : .3) : P.oob);
    time = P.short ? ri(3, 5) : ri(4, 7);
    return { y, time, fumble, int, sack, inc, oob, scr, m, pe, se, x, mo, md, pr };
  }
  const q = x.qb, t = x.tgt.p, cv = x.cov;
  const covAbs = unitAvg(dbsOf(D), { cov: .8, spd: .2 });
  // Sacks: the protection against the rush, and how long the quarterback holds the ball
  const sackP = Math.max(.005, P.sack + ((SACK[def] || {})[off] || 0) + (OP.sack || 0)) * Math.exp(-.4 * (T.pro || 0)) * clamp(1 - .006 * (q.r.awr - REF), .8, 1.4);
  if (rand() < sackP) {
    // A quick quarterback slips some sacks and takes off
    if (rand() < clamp(.04 + .012 * (q.r.spd - unitAvg(D.DL, { spd: 1 })), 0, .55)) scr = "rush";
    else { sack = true; y = -ri(3, 9); fumble = rand() < .08 * clamp(fumLvl(q), .7, 1.6) * fumMul; time = ri(5, 8); }
  }
  if (P.hail && !sack && !scr) {
    // A jump ball in the end zone: the longer the throw, the less likely anyone comes down with it,
    // and a quarterback without the arm can't get it there
    const dist = 100 - S.spot, reach = 30 + .45 * q.r.arm;
    const catchP = clamp((.13 - Math.max(0, dist - 40) * .003 + .025 * m) * compMul * (dist + 5 > reach ? .3 : 1), .005, .2), intP = clamp(P.int - .02 * m, .08, .3), roll = rand();
    time = ri(7, 10);
    if (roll < catchP) y = dist; // caught in the end zone
    else if (roll < catchP + .03) { y = dist - ri(1, 6); } // caught, but tackled short of the goal line
    else if (roll < catchP + .03 + intP) int = true;
    else inc = true;
  } else if (!sack && !scr) {
    const deep = !!P.deep;
    const armMul = deep ? clamp(.65 + .0045 * q.r.arm, .7, 1.05) : 1;
    // Level of play: the quarterback's accuracy and the target's hands, against the coverage
    const compLvl = .004 * (q.r.acc - REF) + .0015 * (t.r.hnd - REF) - .0025 * (covAbs - REF);
    const intMul = clamp(1 - .015 * (q.r.acc - REF) + .006 * (covAbs - REF), .5, 3) * Math.exp(-.25 * T.thr);
    const intP = clamp(P.int * INT_SCALE * (1 - .3 * m) * (((INT_MUL[def] || {})[off]) || 1) * intMul, .003, .15);
    const compP = clamp((P.comp + .09 * m + .05 * T.thr + compLvl - (side ? .04 : 0)) * compMul * armMul, .04, .93), roll = rand();
    if (roll < intP) { int = true; time = ri(6, 11); }
    else if (roll < intP + compP) {
      const ydsMul = deep ? clamp(.6 + .0055 * q.r.arm, .75, 1.05) : 1;
      y = Math.max(P.min, Math.round(normal((P.mean + (deep ? 3 : 2) * m + 1.2 * T.spd) * ydsMul, P.sd)));
      // Yards after the catch: a good call or a faster receiver breaks more, and so does weak tackling
      const bigE = Math.max(0, m + .8 * T.spd);
      if (rand() < (.07 * bigE + .02 * (bigMul - 1)) * bigMul * (side ? .5 : 1)) y += P.noBig ? ri(1, 4) : ri(10, 35);
      if (side) y = Math.max(P.min, Math.round(y * .8));
      fumble = rand() < .008 * clamp(fumLvl(t), .7, 1.6) * fumMul; oob = rand() < (side ? .85 : .2);
      time = ri(5, 9);
    } else if (rand() < clamp(.02 + .005 * (q.r.spd - 45), 0, .22)) scr = "open"; // nobody open: a runner tucks it and goes
    else { inc = true; time = ri(4, 7); }
  }
  if (scr) {
    y = Math.max(-2, Math.round(normal(3 + .08 * (q.r.spd - 50), 4)));
    if (rand() < .04 * bigMul * clamp(q.r.spd / 60, .5, 1.6)) y += ri(10, 35);
    fumble = rand() < .012 * clamp(fumLvl(q), .7, 1.6) * fumMul;
    oob = rand() < (side ? .8 : .35);
    time = ri(5, 9);
  }
  return { y, time, fumble, int, sack, inc, oob, scr, m, pe, se, x, mo, md, pr };
}

/* ---------- Player stats ---------- */
// S.ps[player id] = { pa: attempts, pc: completions, py: passing yards, ptd, pi: interceptions thrown,
//   sk/sky: times sacked and yards lost, ru: rushes, ry: rushing yards, rtd, rl: long run, fl: fumbles lost,
//   tg: targets, rec: catches, rcy: receiving yards, rctd, rcl: long catch,
//   tk: tackles, tfl, sck: sacks, int: interceptions, pd: passes defended, ff: forced fumbles,
//   fr: fumble recoveries, dtd: defensive touchdowns,
//   kr/kry/krtd and pr/pry/prtd: returns, fga/fgm/fgl: field goals, xpa/xpm: extra points,
//   ko: kickoffs, kotb: touchbacks, pu/puy/pul/pu20: punts }
function pstat(p, k, n) { if (!p) return; const s = S.ps[p.id] || (S.ps[p.id] = {}); s[k] = (s[k] || 0) + (n == null ? 1 : n); }
function pmax(p, k, v) { if (!p) return; const s = S.ps[p.id] || (S.ps[p.id] = {}); if (s[k] == null || v > s[k]) s[k] = v; }
// A touchdown: the try comes next, unless a touchdown on the last play of the game decides it
// whatever the try does (then it isn't played)
function afterTD(t) {
  const m = S.teams[t].score - S.teams[1 - t].score;
  const decided = S.quarter === 4 && S.periodOver && (m >= 1 || m <= -3);
  S.needPAT = !S.gameOver && !decided; S.patTeam = t;
}

/* ---------- Narration ---------- */
const gainText = y => y > 0 ? `for ${yd(y)}` : y < 0 ? `for a loss of ${-y}` : "for no gain";
const RUN_WAY = { ir: "up the middle", or: "around the edge", dr: "on the draw", qs: "on the sneak" };
const CATCH_LEAD = {
  sc: (q, t) => `${q} dumps a screen to ${t}`, sp: (q, t) => `${q} hits ${t} on a quick throw`, ms: (q, t) => `${q} finds ${t} crossing the middle`,
  dp: (q, t) => `${q} goes deep and connects with ${t}`, pa: (q, t) => `Play-action, and ${q} hits ${t}`, te: (q, t) => `${q} throws to the tackle, ${t}`,
  hm: (q, t) => `${q}'s Hail Mary is pulled down by ${t}`
};
const MISS_TEXT = {
  sc: (q, t) => `The screen to ${t} is sniffed out, and ${q} throws it away.`, sp: (q, t) => `${q}'s quick throw to ${t} falls incomplete.`,
  ms: (q, t) => `${q} misses ${t} over the middle.`, dp: (q, t) => `${q}'s deep shot for ${t} sails incomplete.`,
  pa: (q, t) => `${q}'s play-action pass for ${t} falls incomplete.`, te: (q, t) => `The throw to ${t}, the tackle, falls incomplete.`,
  hm: () => "The Hail Mary is batted down in a crowd in the end zone."
};

function doScrimmage() {
  const o = S.poss, d = 1 - o, off = S.offCall, def = S.defCall, P = OFFP[off];
  const roll = rollPlay(off, def, S.offPkg, S.defPkg, S.offSide), m = roll.m, x = roll.x;
  const st = S.teams[o].st, from = S.spot, ot = hsOT();
  st.plays++;
  const r = { read: null, m, fromX: fx(o, from), tone: "", sub: "" };
  let { y, time, fumble, int, sack, inc, oob, scr } = roll, text = "";
  Object.assign(r, { mc: M[off][def], pe: roll.pe, sp: styleParts(off, def, o), opk: S.offPkg, dpk: S.defPkg, side: !!S.offSide && sideOn(off), T: x.T, kind: P.kind, scr, mo: roll.mo, md: roll.md, pr: roll.pr });
  tick(time);
  r.oob = oob;
  const qb = x.qb, tg = x.tgt ? x.tgt.p : null, cov = x.cov, pass = P.kind === "pass", D = x.D;
  r.covId = cov ? cov.id : null; r.tgtId = tg ? tg.id : null;
  // Who has the ball at the end of the play
  const holder = pass ? (scr || sack ? qb : tg) : x.car;
  if (pass && !sack && !scr) { pstat(qb, "pa"); pstat(tg, "tg"); }

  // Interception
  if (int) {
    st.to++;
    const picker = pickBy([cov, cov, cov].concat(dbsOf(D), D.LB || []), p => p.r.cov + p.r.hnd / 2) || cov;
    pstat(qb, "pi"); pstat(picker, "int"); pstat(picker, "pd");
    const raw = P.hail ? 100 : from + P.air + ri(-2, 4), thr = P.hail ? `${qb.last}'s Hail Mary` : `${qb.last}'s pass for ${tg.last}`;
    // High school overtime: the defense can't score, and the series is over
    if (ot) {
      Object.assign(r, { head: "Picked off", tone: "bad", text: `${thr} is intercepted by ${picker.last}. The ball is dead right there.`, toX: fx(o, clamp(raw, 1, 99)) });
      hsotEnd(); return r;
    }
    if (raw >= 100) {
      startDrive(d, 20);
      Object.assign(r, { head: "Picked off", tone: "bad", text: `${thr} is intercepted in the end zone by ${picker.last}. Touchback.`, toX: fx(d, 20) });
      r.sub = `${tname(d)} ball. ${downText()} at the ${spotText(d, 20)}.`;
      return r;
    }
    const iSpot = clamp(raw, 1, 99);
    const ret = rand() < .05 * clamp(picker.r.spd / 55, .6, 1.5) ? ri(30, 100) : ri(0, 18);
    const dSpot = 100 - iSpot + ret;
    if (dSpot >= 100) {
      score(d, 6); pstat(picker, "dtd"); afterTD(d);
      Object.assign(r, { head: "Pick six", tone: "bad", text: `${thr} is intercepted by ${picker.last} and returned all the way. ${tname(d)} touchdown!`, toX: fx(d, 100) });
      return r;
    }
    startDrive(d, dSpot);
    Object.assign(r, { head: "Picked off", tone: "bad", text: `${thr} is intercepted by ${picker.last}${ret ? ` and returned ${yd(ret)}` : ""}.`, toX: fx(d, S.spot) });
    r.sub = `${tname(d)} ball. ${downText()} at the ${spotText(d, S.spot)}.`;
    return r;
  }

  let ns = from + y;
  if (ns >= 100) y = 100 - from;
  const td = ns >= 100, safety = ns <= 0 && !ot;
  st.yds += y; if (P.kind === "run" || scr) st.rush += y; else st.pass += y;
  // The tackle, if there was one
  const tk = td || inc ? null : sack ? pickBy(["ab", "zb", "rb", "blk"].includes(def) ? D.DL.concat(D.LB || [], D.LB || []) : D.DL.concat(D.DL, D.LB || []), p => p.r.prs + p.r.spd * .4)
    : pickTackler(D, pass && !scr ? "pass" : "run", y, pass && !scr ? cov : null);
  if (tk && !(oob && rand() < .5)) { pstat(tk, "tk"); if (y < 0 && !sack) pstat(tk, "tfl"); }
  r.carId = holder ? holder.id : null; r.tklId = tk ? tk.id : null;

  // Base narration and the stats that go with it
  if (sack) {
    pstat(qb, "sk"); pstat(qb, "sky", -y); pstat(tk, "sck"); pstat(tk, "tfl");
    text = `${qb.last} is sacked by ${tk.last} for a loss of ${-y}.`;
  } else if (inc) {
    const broke = !P.hail && cov && rand() < .35;
    if (broke) pstat(cov, "pd");
    text = broke ? `${qb.last}'s pass for ${tg.last} is broken up by ${cov.last}.` : MISS_TEXT[off](qb.last, tg.last);
  } else if (scr || P.kind === "run") {
    const c = holder;
    pstat(c, "ru"); pstat(c, "ry", y); pmax(c, "rl", y); if (td) pstat(c, "rtd");
    if (scr) {
      const how = scr === "rush" ? "escapes the rush and scrambles" : "can't find anyone open and takes off";
      text = td ? `${c.last} ${how}, ${yd(y)}, for the touchdown!` : `${c.last} ${how} ${gainText(y)}${tk ? `, ${oob ? "pushed out by" : "brought down by"} ${tk.last}` : ""}.`;
    }
    else {
      const way = RUN_WAY[off] || "up the middle";
      if (td) text = y >= 15 ? `${c.last} breaks loose ${way} and goes ${yd(y)} for the touchdown!` : `${c.last} ${way}, ${yd(y)}, into the end zone!`;
      else if (y < 0) text = `${c.last} is stuffed in the backfield by ${tk.last} for a loss of ${-y}.`;
      else if (y === 0) text = `${c.last} is stopped ${way} by ${tk.last}. No gain.`;
      else if (y >= 15) text = `${c.last} breaks loose ${way} for ${yd(y)} before ${tk.last} ${oob ? "forces the runner out" : "makes the tackle"}!`;
      else text = `${c.last} ${way} for ${yd(y)}, ${oob ? "pushed out of bounds by" : "tackled by"} ${tk.last}.`;
    }
  } else {
    pstat(qb, "pc"); pstat(qb, "py", y); pstat(tg, "rec"); pstat(tg, "rcy", y); pmax(tg, "rcl", y);
    if (td) { pstat(qb, "ptd"); pstat(tg, "rctd"); }
    const lead = CATCH_LEAD[off](qb.last, tg.last);
    if (td) text = `${lead} for ${yd(y)}, and it's a touchdown!`;
    else if (y >= 20) text = `${lead} for ${yd(y)}!${oob ? " Out of bounds." : ` ${tk.last} makes the tackle.`}`;
    else text = `${lead} ${gainText(y)}${oob ? ", out of bounds" : `, tackled by ${tk.last}`}.`;
  }

  // Touchdown
  if (td) {
    score(o, 6); afterTD(o);
    Object.assign(r, { head: "Touchdown", tone: "good", text, toX: fx(o, 100) });
    if (S.gameOver) r.sub = `${tname(o)} win it in overtime!`;
    return r;
  }
  // Fumble
  if (fumble) {
    st.to++;
    const fs = clamp(ns, 1, 99), rec = pickBy(lineupPlayers(D), p => 10 + p.r.awr);
    pstat(holder, "fl"); if (tk) pstat(tk, "ff"); pstat(rec, "fr");
    text += ` ${holder.last} fumbles, and ${rec.last} recovers for the defense!`;
    if (ot) { Object.assign(r, { head: "Fumble", tone: "bad", text: text + " The ball is dead right there.", toX: fx(o, fs) }); hsotEnd(); return r; }
    const ret = rand() < .03 ? 100 : ri(0, 8);
    const dSpot = 100 - fs + ret;
    if (dSpot >= 100) {
      score(d, 6); pstat(rec, "dtd"); afterTD(d);
      Object.assign(r, { head: "Scoop & score", tone: "bad", text: text + ` Returned for a ${tname(d)} touchdown!`, toX: fx(d, 100) });
      return r;
    }
    startDrive(d, dSpot);
    Object.assign(r, { head: "Fumble", tone: "bad", text, toX: fx(d, S.spot) });
    r.sub = `${tname(d)} ball. ${downText()} at the ${spotText(d, S.spot)}.`;
    return r;
  }
  // Safety, then a free kick from the 20
  if (safety) {
    score(d, 2);
    Object.assign(r, { head: "Safety", tone: "bad", text: text.replace(/\.$/, "") + ` in the end zone. Safety, 2 points for ${tname(d)}.`, toX: fx(o, 0) });
    if (!S.gameOver) r.sub = `${tname(o)} free kick from their own ${R().safetyKick}. ${kickoff(d, true, R().safetyKick)}`;
    return r;
  }
  // Normal result
  ns = Math.max(1, ns);
  r.toX = fx(o, ns); r.y = y;
  r.head = sack ? "Sack" : inc ? "Incomplete" : y > 0 ? `+${y}` : y < 0 ? `−${-y}` : "No gain";
  r.tone = (sack || y < 0) ? "bad" : (y >= S.toGo || y >= 10) ? "good" : "";
  r.text = text;
  if (y >= S.toGo) {
    S.spot = ns; S.down = 1; S.toGo = Math.min(10, 100 - ns); st.fd++; r.fd = true;
    r.sub = `First down! ${downText()} at the ${spotText(o, S.spot)}.`;
  } else {
    S.down++; S.spot = ns; S.toGo = Math.min(S.toGo - y, 100 - ns);
    if (S.down > 4) {
      r.tone = "bad"; r.tod = true;
      if (r.head.startsWith("+") || r.head === "No gain" || r.head === "Incomplete") r.head = "Stopped";
      if (ot) { r.sub = "Turnover on downs. The series is over."; hsotEnd(); return r; }
      startDrive(d, 100 - ns);
      r.sub = `Turnover on downs. ${tname(d)} take over at the ${spotText(d, S.spot)}.`;
    } else r.sub = `${downText()} at the ${spotText(o, S.spot)}.`;
  }
  return r;
}

/* ---------- Penalties ---------- */
// The fouls and their yardage come from the level's rules (rules.js)
const penOf = code => R().pen[code];
const FLAG_RATE = 1.2; // tuned so about 1 snap in 12 draws a flag at the pro reference
function pickFrom(w) { let x = rand() / FLAG_RATE; for (const k in w) { x -= w[k]; if (x < 0) return k; } return null; }
// Awareness: sharp teams commit fewer penalties. 1 at the pro reference.
const penLvl = aw => clamp(1 + .011 * (REF - aw), .7, 1.7);
const offOnField = () => onField(S.poss, OFF_PKGS[S.offPkg] ? S.offPkg : "p11");
const defOnField = () => onField(1 - S.poss, DEF_PKGS[S.defPkg] ? S.defPkg : "nickel");
// Fouls before the snap (the play never runs)
// A play still being learned draws more flags on the side running it (masteryMul)
const flagMuls = (off, def) => [masteryMul(masteryOf(S.poss, off), .009), masteryMul(masteryOf(1 - S.poss, def), .009)];
function rollPreSnap(def) {
  const L = offOnField(), D = defOnField(), q = (L.QB || [])[0], [mo, md] = flagMuls(S.offCall, def);
  // A play changed at the line is more likely to end in confusion: a false start or the play clock running out
  const w = { fs: (.008 + (S.aud ? .009 : 0)) * penLvl(unitAvg(L.OL, { awr: 1 })) * mo, dg: (.003 + (S.aud ? .007 : 0)) * penLvl(q ? q.r.awr : 50) * mo };
  // High school: a defender who jumps into the neutral zone kills the play before the snap
  if (penOf("enc")) w.enc = (.004 + (def === "rb" ? .005 : def === "ab" || def === "blk" ? .008 : def === "zb" ? .006 : 0)) * penLvl(unitAvg(D.DL, { awr: 1 })) * md;
  return pickFrom(w);
}
// Fouls during the play depend on the matchup and on each side's awareness
function rollLive(off, def, r) {
  const P = OFFP[off], thrown = P.kind === "pass" && r.head !== "Sack" && !r.scr;
  const complete = thrown && !["Incomplete", "Picked off", "Pick six"].includes(r.head);
  const L = offOnField(), D = defOnField(), T = r.T || {}, w = {};
  const olAw = penLvl(unitAvg(L.OL, { awr: 1 })), dbAw = penLvl(unitAvg(dbsOf(D), { awr: 1 })), dlAw = penLvl(unitAvg(D.DL, { awr: 1 }));
  // Offside: the play runs anyway (a "free play"). Blitzing defenses jump more often. (Pros only;
  // in high school it's encroachment, before the snap.)
  w.os = (.004 + (def === "rb" ? .006 : def === "ab" || def === "blk" ? .01 : def === "zb" ? .007 : 0)) * dlAw;
  // Holding: more when the line is overmatched
  w.oh = (P.kind === "run" ? (off === "or" ? .034 : .028) : (P.deep ? .035 : .016)) * olAw * clamp(1 - .25 * (P.kind === "run" ? T.blk || 0 : T.pro || 0), .6, 1.6);
  if (def === "rb" || def === "ab" || def === "blk" || def === "zb") w.oh += .008 * olAw;
  if (thrown) w.dh = (.008 + (def === "ma" ? .012 : def === "zo" ? .004 : 0)) * dbAw;
  if (thrown && !complete && P.air >= 6) w.dpi = ({ sp: .012, dp: .04, pa: .03, hm: .03 }[off]) * ({ ma: 2, zo: 1, c3: 1, pr: .5, ab: 1.5, zb: 1.2, rb: 1, ba: 1, blk: 1.5, ret: .5 }[def]) * dbAw * clamp(1 + .2 * (T.thr || 0), .6, 1.5);
  if (thrown && P.air >= 6) w.opi = ({ sp: .004, dp: .007, pa: .005, hm: .02 }[off]) * (def === "ma" ? 1.5 : 1) * penLvl(unitAvg((L.WR || []).concat(L.TE || []), { awr: 1 }));
  if (thrown) w.rtp = (def === "ab" ? .012 : def === "zb" ? .007 : def === "rb" ? .004 : .0015) * dlAw;
  w.fm = (P.kind === "run" ? .004 : complete ? .002 : 0) * dbAw;
  if (S.offPkg === "jumbo" && thrown) w.idf = .015 * olAw;
  // Fouls by the side still learning its call
  const [mo, md] = flagMuls(off, def);
  Object.keys(w).forEach(k => { const p = R().pen[k]; if (p) w[k] *= p.on === "off" ? mo : md; });
  // Only the fouls this level has
  const pen = R().pen;
  Object.keys(w).forEach(k => { if (!pen[k] || pen[k].pre) delete w[k]; });
  return pickFrom(w);
}
// Who committed a foul, for the call
// (only the name is kept, so the game state stays small)
function penPlayer(code, r) {
  const L = offOnField(), D = defOnField(), byId = id => id ? playerById(S.teams[0], id) || playerById(S.teams[1], id) : null;
  const pick = () => {
    switch (code) {
      case "fs": case "oh": case "idf": return pickBy(L.OL.concat(L.TE || []), p => 100 - p.r.awr);
      case "enc": case "os": case "rtp": return pickBy(D.DL, p => 100 - p.r.awr);
      case "dh": case "dpi": return byId(r && r.covId) || pickBy(dbsOf(D), p => 100 - p.r.awr);
      case "opi": return byId(r && r.tgtId) || pickBy(L.WR || [], p => 100 - p.r.awr);
      case "fm": return pickBy(lineupPlayers(D), p => p.r.tkl);
      default: return null;
    }
  };
  const p = pick();
  return p ? { last: p.last, id: p.id } : null;
}
const foulCall = (code, offender, p) => `${penOf(code).name}${p ? ` on ${p.last}` : ""}, ${penOf(code).on === "off" ? "offense" : "defense"} (${abbr(offender)})`;
function snapState() {
  return clone({ poss: S.poss, spot: S.spot, down: S.down, toGo: S.toGo, needPAT: S.needPAT, patTeam: S.patTeam,
    gameOver: S.gameOver, ot: S.ot || null, otEnd: !!S.otEnd, scores: [S.teams[0].score, S.teams[1].score], st: [S.teams[0].st, S.teams[1].st], ps: S.ps });
}
function applyState(x) {
  S.poss = x.poss; S.spot = x.spot; S.down = x.down; S.toGo = x.toGo; S.needPAT = x.needPAT; S.patTeam = x.patTeam; S.gameOver = x.gameOver; S.otEnd = x.otEnd;
  if (x.ot !== undefined) S.ot = x.ot ? clone(x.ot) : null;
  [0, 1].forEach(i => { S.teams[i].score = x.scores[i]; S.teams[i].st = clone(x.st[i]); });
  S.ps = clone(x.ps);
}
const downTextOf = x => `${ord(x.down)} & ${x.spot + x.toGo >= 100 ? "Goal" : x.toGo}`;
// Enforce a foul from the previous spot (or the end of the run, or the spot of the foul for pro pass
// interference), with half-the-distance near the goal lines
function enforce(code, base, endOfPlay) {
  const pen = penOf(code), s = clone(base), L = s.spot;
  let yds, half = false, desc;
  if (pen.on === "off") {
    yds = Math.min(pen.yds, Math.floor(L / 2)); half = yds < pen.yds;
    s.spot = L - yds; s.toGo = Math.min(s.toGo + yds, 100 - s.spot);
    desc = `${yds}-yard penalty${half ? ", half the distance to the goal" : ""}. Replay ${ord(s.down)} down.`;
  } else {
    if (pen.spot) {
      const air = OFFP[S.offCall].air + ri(-2, 9);
      s.spot = Math.min(99, Math.max(L + 1, L + air)); yds = s.spot - L;
      desc = s.spot === 99 && L + air >= 100 ? "Foul in the end zone. Ball at the 1." : `Spot foul, ${yd(yds)}.`;
    } else {
      yds = Math.min(pen.yds, Math.floor((100 - L) / 2)); half = yds < pen.yds;
      s.spot = Math.min(L + yds, 99);
      desc = endOfPlay ? `${yds} yards added to the end of the play${half ? " (half the distance to the goal)" : ""}.` : `${yds}-yard penalty${half ? ", half the distance to the goal" : ""}.`;
    }
    if (pen.auto) { s.down = 1; s.toGo = Math.min(10, 100 - s.spot); desc += " Automatic first down."; }
    else {
      s.toGo = Math.min(s.toGo - yds, 100 - s.spot);
      if (s.toGo <= 0) { s.down = 1; s.toGo = Math.min(10, 100 - s.spot); desc += " First down."; }
      else desc += ` Replay ${ord(s.down)} down.`;
    }
  }
  return { s, yds, desc };
}
function doPreSnap(code, pre) {
  const pen = penOf(code), o = S.snap.poss, offender = pen.on === "off" ? o : 1 - o, who = penPlayer(code);
  const e = enforce(code, pre);
  applyState(e.s);
  S.teams[offender].st.pen++; S.teams[offender].st.penYds += e.yds;
  return { preSnap: true, pen: true, penBy: offender, m: null, head: "Flag", tone: pen.on === "off" ? "bad" : "good", s: pen.on === "off" ? -1 : 1,
    read: { c: pen.on === "off" ? "d" : "o", t: pen.on === "off" ? "Pre-snap flag on the offense." : "Pre-snap flag on the defense." },
    text: `${foulCall(code, offender, who)}. Whistled dead before the snap.`,
    sub: `${e.desc} ${downText()} at the ${spotText(S.poss, S.spot)}.`, fromX: fx(o, pre.spot), toX: fx(o, S.spot) };
}
// How good a game state is for one team: points first, then field position and down
function stateValue(x, team) {
  const pts = i => x.scores[i] + (x.needPAT && x.patTeam === i ? .95 : 0);
  if (x.gameOver) return x.scores[team] > x.scores[1 - team] ? 999 : -999;
  let v = pts(team) - pts(1 - team);
  if (!x.needPAT) {
    let ep = (x.spot - 25) / 15 - (x.down - 1) * .5 - (Math.min(x.toGo, 20) - 10) * .07;
    if (x.down === 4) ep -= .8;
    v += x.poss === team ? ep : -ep;
  }
  return v;
}
function setupPenalty(code, r, pre) {
  const pen = penOf(code), o = S.snap.poss, offender = pen.on === "off" ? o : 1 - o, chooser = 1 - offender;
  const post = snapState();
  const sameScore = post.scores[0] === pre.scores[0] && post.scores[1] === pre.scores[1];
  // Roughing the passer and face mask on a play that gained yards are added to the end of the play.
  // In high school, so is any defensive foul during a run that ends past the line. Otherwise from
  // the previous spot.
  const runPlay = r.kind === "run" || r.scr;
  const endOfPlay = (code === "rtp" || code === "fm" || (R().endOfRun && pen.on === "def" && runPlay)) && r.y > 0 && post.poss === pre.poss && !post.needPAT && !post.gameOver && sameScore && !post.otEnd;
  const e = enforce(code, endOfPlay ? post : pre, endOfPlay);
  // Would the play itself have stopped the clock?
  const playStop = post.poss !== pre.poss || !sameScore || r.head === "Incomplete" || !!r.oob;
  r.who = penPlayer(code, r);
  S.pen = { code, offender, chooser, r, pre, post, endOfPlay, playStop, acc: e.s, accDesc: e.desc, accYds: e.yds, periodOver: S.periodOver };
  if (S.teams[chooser].cpu) choosePenalty(stateValue(e.s, chooser) > stateValue(S.pen.post, chooser));
  else S.phase = "penalty";
}
function choosePenalty(accept) {
  const P = S.pen; if (!P) return;
  if (P.two) { chooseTwoPenalty(accept); return; }
  S.pen = null;
  const pen = penOf(P.code), call = foulCall(P.code, P.offender, P.r.who);
  let r = P.r;
  r.pen = true;
  if (accept) {
    applyState(P.acc);
    S.teams[P.offender].st.pen++; S.teams[P.offender].st.penYds += P.accYds;
    let untimed = false;
    // A period can't end on an accepted foul (in the pros, a defensive one): one untimed down
    if ((pen.on === "def" || R().untimed === "any") && P.periodOver && S.clock === 0) { S.periodOver = false; untimed = true; }
    r = { offId: r.offId, defId: r.defId, opk: r.opk, dpk: r.dpk, team: r.team, aud: r.aud, audNote: r.audNote, injNote: r.injNote, m: null, accepted: true, pen: true, penClock: true, penBy: P.offender, penStop: P.playStop,
      head: "Flag", tone: pen.on === "off" ? "bad" : "good", s: pen.on === "off" ? -2 : 2, fromX: r.fromX, toX: fx(S.poss, S.spot),
      read: { c: pen.on === "off" ? "d" : "o", t: pen.on === "off" ? "A flag on the offense wipes out the play." : P.endOfPlay ? `A flag on the defense adds ${P.accYds} yards to the gain.` : "A flag on the defense hands the offense free yards." },
      text: P.endOfPlay ? `${P.r.text} Flag on the play: ${call}. Penalty accepted, and the gain stands.` : `${P.r.text} Flag on the play: ${call}. Penalty accepted, so the play doesn't count.`,
      sub: `${P.accDesc} ${downText()} at the ${spotText(S.poss, S.spot)}.${untimed ? " The half can't end on an accepted penalty, so there will be one untimed down." : ""}` };
  } else {
    applyState(P.post);
    r.sub = `${r.sub ? r.sub + " " : ""}Flag: ${call}. Declined.`;
  }
  finalize(r);
}
function doKneel() {
  const o = S.poss, d = 1 - o, st = S.teams[o].st, from = S.spot, qb = starterAt(S.teams[o], "QB");
  st.plays++;
  tick(ri(1, 2));
  const y = from > 1 ? -1 : 0;
  st.yds += y; st.rush += y; pstat(qb, "ru"); pstat(qb, "ry", y);
  const r = { read: null, fromX: fx(o, from), toX: fx(o, from + y), head: "Kneel", tone: "", y };
  const victory = S.clock <= 40;
  r.text = victory ? `Victory formation. ${qb.last} takes a knee.` : `${qb.last} takes a knee${y ? " for a loss of 1" : ""}. The clock keeps running.`;
  S.spot = from + y; S.down++; S.toGo = Math.min(S.toGo - y, 100 - S.spot);
  if (S.down > 4) { startDrive(d, 100 - S.spot); r.tod = true; r.sub = `Turnover on downs. ${tname(d)} take over at the ${spotText(d, S.spot)}.`; }
  else r.sub = `${downText()} at the ${spotText(o, S.spot)}.`;
  return r;
}

/* ---------- Kicking ---------- */
// Field goal range comes from the kicker's leg: a 35 leg tops out around 40 yards, a 90 around 64.
// Inside the range, accuracy sets how often it's good, falling off sharply near the limit.
const fgRange = K => 24.7 + .436 * K.r.leg;
const fgMaxTry = t => Math.round(fgRange(kickerOf(t)) + 4);
function fgChance(K, d) {
  const max = fgRange(K), sure = clamp(.5 + .005 * K.r.kac, .55, .97);
  if (d > max) return clamp(.03 * (max + 4 - d), .005, .03);
  return clamp(sure * (1 - Math.pow(d / max, 8)), .01, .99);
}
// A good special teams coach makes a few more kicks: about 5 percent more at a 55
const fgOdds = (t, K, d) => clamp(fgChance(K, d) * (1 + .004 * stOf(t)), .005, .99);
const fgProbFor = (t, d) => fgOdds(t, kickerOf(t), d);
// Kicks get blocked more behind a weak line
function kickBlockMul(t) { return clamp(1 - .02 * (unitAvg(onField(t, "fgu").OL, { pbk: .7, str: .3 }) - REF), 1, 2.2); }
// The kicking team's coverage
function coverUnit(t) { const lu = onField(t, "nickel"); return (lu.LB || []).concat(lu.S || [], lu.CB || []); }
const coverRating = t => unitAvg(coverUnit(t), { spd: .5, tkl: .5 }) + .2 * stOf(t);
const coverTackler = t => pickBy(coverUnit(t), p => p.r.tkl + p.r.spd);
// Return yards: the returner against the coverage. base: a typical return.
function returnYards(ret, cover, base) {
  const e = tEdge(retRating(ret), cover);
  let y = Math.round(normal(base + 3 * e, base * .45));
  if (rand() < clamp(.045 + .02 * e, .01, .12)) y += ri(12, 35);
  return Math.max(0, y);
}
// Kickoffs. The kicker's leg sets the distance. In high school, from the 40: a kick that reaches the
// end zone is dead for a touchback at the 20, so everything short of it is returned. from: the
// kicking team's yard line (the 20 for a free kick after a safety).
function kickoff(rcv, allowTD, from) {
  kickTD = false;
  const k = 1 - rcv, KO = R().kickoff, K = kickerOf(k), ret = returnerOf(rcv, "KR");
  from = from == null ? KO.spot : from;
  pstat(K, "ko");
  if (KO.dynamic) return proKickoff(rcv, allowTD, K, ret);
  if (rand() < .025) { startDrive(rcv, 100 - (from + 25)); return `${K.last}'s kick goes out of bounds. ${tname(rcv)} take it at the ${spotText(rcv, S.spot)}.`; }
  const dist = Math.round(normal(30 + .38 * K.r.leg, 5.5)), land = 100 - (from + dist);
  if (land <= 0 && R().kickDeadInEndZone) { pstat(K, "kotb"); startDrive(rcv, KO.tb); return `${K.last}'s kick reaches the end zone. Touchback: ${tname(rcv)} start at their own ${KO.tb}.`; }
  tick(ri(4, 7));
  const cover = coverRating(k), e = tEdge(retRating(ret), cover), y0 = Math.max(1, land);
  let ry = returnYards(ret, cover, 17);
  pstat(ret, "kr");
  if (allowTD && (y0 + ry >= 100 || rand() < clamp(.006 + .005 * e, .002, .025))) {
    ry = 100 - y0; pstat(ret, "kry", ry); pstat(ret, "krtd");
    score(rcv, 6); afterTD(rcv); startDrive(rcv, 99); kickTD = true;
    return `${ret.last} takes the kick at the ${y0} and returns it all the way! ${tname(rcv)} touchdown!`;
  }
  const spot = clamp(y0 + ry, 1, 95);
  ry = spot - y0; pstat(ret, "kry", ry);
  startDrive(rcv, spot);
  const tk = coverTackler(k); pstat(tk, "tk");
  return ry >= 30 ? `Big return! ${ret.last} brings the kick back ${yd(ry)} to the ${spotText(rcv, spot)}.` : `${ret.last} returns the kick ${yd(ry)} to the ${spotText(rcv, spot)}, where ${tk.last} makes the tackle.`;
}
// The pros' dynamic kickoff (Gridiron Duel): touchbacks to the 35, most kicks returned
function proKickoff(rcv, allowTD, K, ret) {
  const roll = rand();
  if (roll < .25) { pstat(K, "kotb"); startDrive(rcv, 35); return `${K.last}'s kickoff is a touchback. ${tname(rcv)} start at their own 35.`; }
  if (roll < .27) { startDrive(rcv, 40); return `${K.last}'s kickoff lands short of the landing zone. ${tname(rcv)} get the ball at their own 40.`; }
  tick(ri(5, 8));
  pstat(ret, "kr");
  if (allowTD && rand() < .006) {
    score(rcv, 6); afterTD(rcv); startDrive(rcv, 99); kickTD = true; pstat(ret, "krtd");
    return `${ret.last} returns the kickoff all the way! ${tname(rcv)} touchdown!`;
  }
  let spot = Math.round(normal(29, 6));
  const big = rand() < .05;
  if (big) spot += ri(15, 35);
  spot = clamp(spot, 8, 95);
  const caught = ri(-3, 6);
  startDrive(rcv, spot);
  const ry = spot - caught; pstat(ret, "kry", ry);
  return big ? `Big kickoff return! ${ret.last} brings it back ${yd(ry)} to the ${spotText(rcv, spot)}.` : `${ret.last} returns the kickoff ${yd(ry)} to the ${spotText(rcv, spot)}.`;
}
// Onside kick: it has to go 10 yards. How often the kicking team gets it back depends on whether
// the other team was ready for it (rules.js).
function onsideKick(k) {
  const rcv = 1 - k, Rl = R(), land = Rl.kickoff.spot + ri(10, 13), K = kickerOf(k);
  tick(ri(3, 5));
  const expected = Rl.onside.declared || (S.quarter >= 4 && S.teams[k].score < S.teams[1 - k].score);
  pstat(K, "ko");
  if (rand() < (expected ? Rl.onside.expected : Rl.onside.surprise)) { startDrive(k, land); return { ok: true, text: `Onside kick by ${K.last}... and ${tname(k)} recover it at the ${spotText(k, land)}!` }; }
  startDrive(rcv, 100 - land);
  return { ok: false, text: `Onside kick by ${K.last}, but ${tname(rcv)} fall on it at the ${spotText(rcv, S.spot)}.` };
}
function doPunt() {
  const o = S.poss, d = 1 - o, from = S.spot, Pn = punterOf(o), ret = returnerOf(d, "PR");
  const r = { read: null, fromX: fx(o, from), tone: "" };
  tick(ri(9, 13));
  const dc = S.defCall;
  if (dc === "blk" && rand() < .04) return roughKicker(r, "punt");
  pstat(Pn, "pu");
  if (rand() < (dc === "blk" ? .08 : dc === "ab" ? .05 : .01) * kickBlockMul(o)) {
    const bs = Math.max(from - 7, 1);
    startDrive(d, 100 - bs);
    Object.assign(r, { head: "Blocked!", tone: "bad", text: `${Pn.last}'s punt is blocked! ${tname(d)} recover at the ${spotText(d, S.spot)}.`, toX: fx(d, S.spot) });
    return r;
  }
  // The punter's leg sets the distance. A shank or a low snap now and then, more for a shaky punter.
  // With no return unit on the field the ball is left to roll; a return unit sets up a real runback.
  const roll = dc === "ret" || dc === "blk" ? 0 : ri(2, 8);
  const shank = rand() < clamp(.07 - .0008 * Pn.r.kac, .01, .06);
  const gross = shank ? ri(12, 24) : Math.max(15, Math.round(normal(22 + .28 * Pn.r.leg + .05 * stOf(o), 5)));
  const dist = gross + roll, land = from + dist;
  if (land >= 100) {
    pstat(Pn, "puy", 100 - from); pmax(Pn, "pul", 100 - from);
    startDrive(d, R().puntTb);
    Object.assign(r, { head: "Punt", text: `${Pn.last} punts ${yd(100 - from)} into the end zone. Touchback.`, toX: fx(d, R().puntTb) });
  } else {
    pstat(Pn, "puy", dist); pmax(Pn, "pul", dist); if (land >= 80) pstat(Pn, "pu20");
    const cover = coverRating(o);
    if (dc === "ret" && rand() < .015 * clamp(retRating(ret) / 50, .6, 1.6)) {
      score(d, 6); afterTD(d); pstat(ret, "pr"); pstat(ret, "pry", 100 - land); pstat(ret, "prtd");
      Object.assign(r, { head: "Return TD", tone: "bad", text: `${Pn.last} punts ${yd(dist)}, and ${ret.last} returns it all the way! ${tname(d)} touchdown!`, toX: fx(d, 100) });
      return r;
    }
    let ry = 0, how;
    if (dc === "ret") { if (rand() < .3) how = "fair"; else { ry = returnYards(ret, cover, 7); how = "ret"; } }
    else if (dc === "blk") { if (rand() < .5) how = "fair"; else { ry = ri(0, 5); how = "ret"; } }
    else how = "roll";
    if (how === "ret") { ry = Math.min(ry, 99 - (100 - land)); pstat(ret, "pr"); pstat(ret, "pry", ry); }
    startDrive(d, Math.min(100 - land + ry, 99));
    const tail = how === "ret" ? `, and ${ret.last} returns it ${yd(ry)}` : how === "fair" ? `. ${ret.last} calls for a fair catch` : ". Nobody back to return it, so it rolls";
    Object.assign(r, { head: "Punt", text: `${Pn.last} ${shank ? "shanks it" : "punts"}, ${yd(dist)}${tail}.`, toX: fx(d, S.spot) });
  }
  r.sub = `${tname(d)} ball. ${downText()} at the ${spotText(d, S.spot)}.`;
  return r;
}
function doFG() {
  const o = S.poss, d = 1 - o, from = S.spot, dist = kickDist(), K = kickerOf(o);
  const r = { read: null, fromX: fx(o, from), tone: "" };
  tick(ri(4, 6));
  const dc = S.defCall, rush = dc === "ab" || dc === "blk";
  const blocked = rand() < (dc === "blk" ? .09 : dc === "ab" ? .04 : .012) * kickBlockMul(o);
  const good = !blocked && rand() < fgOdds(o, K, dist) - (rush ? .04 : 0);
  // Roughing the kicker on a miss: the offense keeps the ball (on a make they just take the points)
  if (!good && dc === "blk" && rand() < .12) return roughKicker(r, "fg");
  pstat(K, "fga");
  if (good) {
    score(o, 3); pstat(K, "fgm"); pmax(K, "fgl", dist);
    Object.assign(r, { head: "It's good", tone: "good", text: `${K.last}'s ${dist}-yard field goal is good. 3 points for ${tname(o)}.`, toX: fx(o, 110) });
    if (S.gameOver) r.sub = `${tname(o)} win it in overtime!`;
    else { r.sub = kickAfterScore(o); r.kickEnd = kickEnded; }
    return r;
  }
  // A long try often comes down short of the goal posts
  const shortMiss = !blocked && rand() < clamp((dist - (fgRange(K) - 8)) / 12, 0, .8);
  const miss = blocked ? `${K.last}'s ${dist}-yard try is blocked!` : `${K.last}'s ${dist}-yard try is ${shortMiss ? "short" : rand() < .5 ? "wide left" : "wide right"}.`;
  Object.assign(r, { head: blocked ? "Blocked!" : "No good", tone: "bad", text: miss });
  if (hsOT()) { r.toX = fx(o, from); hsotEnd(); return r; }
  if (blocked) startDrive(d, Math.min(99, 100 - Math.max(from - 7, 1) + ri(0, 8)));
  else if (R().missedFg === "punt") {
    // High school: a miss is treated like a punt. In the end zone, it's a touchback at the 20; a
    // kick that comes down short of it is downed where it stops.
    if (shortMiss) startDrive(d, ri(2, 9));
    else startDrive(d, R().puntTb);
  } else startDrive(d, Math.max(100 - (from - 8), 20));
  r.toX = fx(d, S.spot);
  r.sub = `${tname(d)} ball. ${downText()} at the ${spotText(d, S.spot)}.`;
  return r;
}
function roughKicker(r, kind) {
  const o = S.poss, d = 1 - o, st = S.teams[d].st, from = S.spot;
  const yds = Math.min(15, Math.floor((100 - from) / 2));
  S.spot = Math.min(99, from + yds); S.down = 1; S.toGo = Math.min(10, 100 - S.spot);
  st.pen++; st.penYds += yds;
  const k = kind === "punt" ? punterOf(o) : kickerOf(o);
  return Object.assign(r, { head: "Flag", tone: "good", s: 2, toX: fx(o, S.spot), accepted: true, pen: true, penClock: true, penBy: d,
    read: { c: "o", t: "Selling out for the block cost the defense." },
    text: `${k.last} gets run into. Roughing the kicker, defense (${abbr(d)}).`,
    sub: `${yds}-yard penalty. Automatic first down. ${downText()} at the ${spotText(o, S.spot)}.` });
}
// Fake punt / fake field goal: works when the defense sold out for the kick, rarely when they kept a real defense out there
function doFake(kind) {
  const o = S.poss, d = 1 - o, st = S.teams[o].st, from = S.spot, def = S.defCall, isPunt = kind === "fp";
  st.plays++; tick(ri(5, 8));
  const who = isPunt ? punterOf(o) : (onField(o, "fgu").QB || [])[0] || punterOf(o);
  const pOK = (def === "blk" ? .72 : def === "ret" ? .5 : .18) + (hasPerk(o, "trick") ? .1 : 0);
  const ok = rand() < pOK, pass = rand() < .5;
  let y = ok ? S.toGo + ri(0, 7) + (rand() < .15 ? ri(10, 40) : 0) : ri(-4, Math.max(-1, S.toGo - 1));
  const r = { fromX: fx(o, from), tone: "", s: ok ? 2 : -2 };
  const catcher = pass ? pickBy(onField(o, isPunt ? "punt" : "fgu").TE || [], p => p.r.hnd) : null;
  let text = pass ? `Fake! ${who.last} throws for ${catcher ? catcher.last : "the tight end"}` : `Fake! ${who.last} takes off running`;
  let ns = from + y;
  if (ns >= 100) { y = 100 - from; ns = 100; }
  if (pass && !ok && rand() < .5) { y = 0; ns = from; text += ", but it falls incomplete."; pstat(who, "pa"); }
  else {
    text += ok ? ` and picks up ${yd(y)}!` : y > 0 ? ` but only gets ${yd(y)}.` : ` and is dropped${y < 0 ? ` for a loss of ${-y}` : " at the line"}.`;
    if (pass) { pstat(who, "pa"); pstat(who, "pc"); pstat(who, "py", y); pstat(catcher, "rec"); pstat(catcher, "rcy", y); }
    else { pstat(who, "ru"); pstat(who, "ry", y); }
  }
  st.yds += y; if (pass) st.pass += y; else st.rush += y;
  r.read = ok ? { c: "o", t: `The fake caught ${DEFP[def].name} napping.` }
    : { c: "d", t: def === "blk" || def === "ret" ? "Sold out for the kick and still stopped it." : `${DEFP[def].name} stayed home and sniffed out the fake.` };
  if (ns >= 100) {
    score(o, 6); afterTD(o);
    if (pass) { pstat(who, "ptd"); pstat(catcher, "rctd"); } else pstat(who, "rtd");
    return Object.assign(r, { head: "Touchdown", tone: "good", text: text.replace(/!$/, ", all the way for a touchdown!"), toX: fx(o, 100) });
  }
  if (ns <= 0) {
    score(d, 2);
    return Object.assign(r, { head: "Safety", tone: "bad", text: text + ` Down in the end zone. 2 points for ${tname(d)}.`, toX: fx(o, 0), sub: S.gameOver ? "" : `${tname(o)} free kick from their own ${R().safetyKick}. ${kickoff(d, true, R().safetyKick)}` });
  }
  r.toX = fx(o, ns); r.y = y; r.text = text;
  if (y >= S.toGo) {
    S.spot = ns; S.down = 1; S.toGo = Math.min(10, 100 - ns); st.fd++; r.fd = true;
    r.head = "Fake works"; r.tone = "good"; r.sub = `First down! ${downText()} at the ${spotText(o, S.spot)}.`;
  } else {
    S.down++; S.spot = ns; S.toGo = Math.min(S.toGo - y, 100 - ns);
    r.head = "Fake stopped"; r.tone = "bad";
    if (S.down > 4) {
      r.tod = true;
      if (hsOT()) { r.sub = "Turnover on downs. The series is over."; hsotEnd(); }
      else { startDrive(d, 100 - ns); r.sub = `Turnover on downs. ${tname(d)} take over at the ${spotText(d, S.spot)}.`; }
    } else r.sub = `${downText()} at the ${spotText(o, S.spot)}.`;
  }
  return r;
}

/* ---------- Point after touchdown ---------- */
// Tries come from the rules: in high school both kicks and two-point plays are snapped from the 3,
// so an extra point is a 20-yard kick. In the pros an extra point is snapped 13 yards behind the
// two-point spot. twoSpot: where a two-point play would be snapped (after any penalty).
const xpDist = twoSpot => 100 - (twoSpot - (R().tryTwo - R().tryXp)) + R().fgAdd;
const ydLine = spot => `${100 - spot}-yard line`;
function startTwo(spot) {
  const t = S.patTeam;
  S.twoPt = { team: t, spot: spot || R().tryTwo };
  S.poss = t; S.spot = S.twoPt.spot; S.down = 1; S.toGo = 100 - S.spot;
  startPlay();
}
function twoResult(r) {
  if (!r.opk) { r.opk = S.offPkg; r.dpk = S.defPkg; }
  otTail(r);
  if (S.aud && r.offId) { r.aud = S.aud; if (!r.audNote) r.audNote = audNote(); }
  else if (S.scoutNote && r.offId && !r.audNote) r.audNote = S.scoutNote.text;
  r.id = S.playId = (S.playId || 0) + 1;
  finishClock(r, true);
  S.last = r; S.phase = "result"; S.banner = "";
  S.log.unshift({ q: S.quarter, clock: S.clock, team: r.team, sit: "Two-point try", off: r.offId && OFFP[r.offId] ? OFFP[r.offId].name + (r.aud ? ` (audible from ${OFFP[r.aud.from].name})` : "") : "",
    def: r.defId && DEFP[r.defId] ? DEFP[r.defId].name : "", text: r.text + (r.sub ? " " + r.sub : ""), score: `${S.teams[0].score}-${S.teams[1].score}` });
}
function resolveTwo() {
  const o = S.twoPt.team, spot = S.twoPt.spot, off = S.offCall, def = S.defCall, P = OFFP[off];
  const flagBase = { pat: "flag", m: null, team: o, offId: off, defId: def, fromX: fx(o, spot) };
  // Pre-snap foul by the offense: the try is backed up, then the offense chooses again
  const preCode = rollPreSnap(def);
  // A defensive foul before the snap: half the distance, and the try is replayed
  if (preCode && penOf(preCode).on === "def") {
    const ns = Math.min(99, spot + Math.max(1, Math.floor((100 - spot) / 2)));
    S.teams[1 - o].st.pen++; S.teams[1 - o].st.penYds += ns - spot;
    S.twoPt = null; S.retryTwo = { team: o, spot: ns };
    twoResult(Object.assign(flagBase, { head: "Flag", tone: "good", s: 1, toX: fx(o, ns), read: { c: "o", t: "Pre-snap flag on the defense." },
      text: `${foulCall(preCode, 1 - o, penPlayer(preCode))}. Whistled dead before the snap.`,
      sub: `Half the distance to the goal. The two-point try is replayed from the ${ydLine(ns)}.` }));
    return;
  }
  if (preCode) {
    const pen = penOf(preCode), yds = Math.min(pen.yds, Math.floor(spot / 2)), ns = spot - yds;
    S.teams[o].st.pen++; S.teams[o].st.penYds += yds;
    S.twoPt = null; S.tryChoice = { team: o, spot: ns };
    twoResult(Object.assign(flagBase, { head: "Flag", tone: "bad", s: -1, toX: fx(o, ns), read: { c: "d", t: "Pre-snap flag on the offense." },
      text: `${foulCall(preCode, o, penPlayer(preCode))}. Whistled dead before the snap.`,
      sub: `The try moves back to the ${ydLine(ns)}. ${tname(o)} can go for two again or kick the extra point.` }));
    return;
  }
  const res = rollPlay(off, def, S.offPkg, S.defPkg), m = res.m, x = res.x;
  tireSnap(o, S.offPkg, S.defPkg);
  // The end zone squeezes everything: some completions in open field are broken up here, and some
  // runs that would have made it are stuffed at the goal line
  const need = 100 - spot;
  if (P.kind === "pass" && !res.int && !res.sack && !res.inc && !res.scr && rand() < .12) { res.inc = true; res.y = 0; }
  else if ((P.kind === "run" || res.scr) && !res.fumble && res.y >= need && rand() < .1) res.y = need - 1;
  const good = !res.int && !res.sack && !res.inc && !res.fumble && res.y >= need;
  const q = x.qb.last, c = x.car ? x.car.last : res.scr ? q : null, t = x.tgt ? x.tgt.p.last : null;
  let text;
  if (good) text = c ? `${c} punches it in from the ${need}. The two-point try is good!` : `${q} finds ${t} in the end zone. The two-point try is good!`;
  else if (res.int) text = `${q}'s pass is intercepted. The two-point try fails.`;
  else if (res.sack) text = `${q} is sacked. The two-point try fails.`;
  else if (res.fumble) text = `${c || t || q} fumbles! The two-point try fails.`;
  else if (res.inc) text = `${q}'s pass for ${t} falls incomplete. The two-point try fails.`;
  else text = `${c || t} is stopped ${res.y <= 0 ? "at the line" : "short of the goal line"}. The two-point try fails.`;
  const fake = { head: res.sack ? "Sack" : res.int ? "Picked off" : res.inc ? "Incomplete" : "+" + res.y, T: x.T, scr: res.scr, covId: x.cov ? x.cov.id : null, tgtId: x.tgt ? x.tgt.p.id : null };
  const code = rollLive(off, def, fake);
  if (code) {
    const pen = penOf(code), offender = pen.on === "off" ? o : 1 - o, chooser = 1 - offender;
    const keep = Object.assign({}, res); delete keep.x;
    S.pen = { two: true, code, team: o, offender, chooser, good, res: keep, text, spot, m, off, def, opk: S.offPkg, dpk: S.defPkg, who: penPlayer(code, fake) };
    // Computer: the defense accepts an offensive foul only if the try was good; the offense accepts a defensive foul only if it failed
    if (S.teams[chooser].cpu) chooseTwoPenalty(pen.on === "off" ? good : !good);
    else S.phase = "penalty";
    return;
  }
  finishTwo(good, res, text, "", m, off, def, spot);
}
function finishTwo(good, res, text, note, m, off, def, spot) {
  const o = S.twoPt.team;
  if (good) score(o, 2);
  S.twoPt = null;
  const ko = kickAfterScore(o);
  const r = { pat: "two", m, mc: M[off][def], pe: res.pe, opk: S.offPkg, dpk: S.defPkg, team: o, offId: off, defId: def, fromX: fx(o, spot), toX: fx(o, good ? 100 : Math.min(99, spot + Math.max(res.y, -3))),
    head: good ? "Two-point good" : "No good", tone: good ? "good" : "bad", text: note ? `${text} ${note}` : text, sub: ko, kickEnd: kickEnded, y: res.y };
  if (!good) r.tod = true;
  r.read = verdict(Object.assign({}, r, { head: good ? "Touchdown" : "Stopped" }), { down: 1, toGo: 2 });
  r.s = good ? 2 : -2;
  twoResult(r);
}
function chooseTwoPenalty(accept) {
  const P = S.pen; S.pen = null;
  const pen = penOf(P.code), o = P.team, call = foulCall(P.code, P.offender, P.who);
  if (!accept) { S.offPkg = P.opk; S.defPkg = P.dpk; finishTwo(P.good, P.res, P.text, `Flag: ${call}. Declined.`, P.m, P.off, P.def, P.spot); return; }
  S.twoPt = null;
  const base = { pat: "flag", m: null, team: o, offId: P.off, defId: P.def, fromX: fx(o, P.spot) };
  if (pen.on === "off") {
    const yds = Math.min(pen.yds, Math.floor(P.spot / 2)), ns = P.spot - yds;
    S.teams[o].st.pen++; S.teams[o].st.penYds += yds;
    S.tryChoice = { team: o, spot: ns };
    twoResult(Object.assign(base, { head: "Flag", tone: "bad", s: -2, toX: fx(o, ns), read: { c: "d", t: "A flag on the offense wipes out the try." },
      text: `${P.text} Flag on the play: ${call}. Penalty accepted, so the try doesn't count.`,
      sub: `The try moves back to the ${ydLine(ns)}. ${tname(o)} can go for two again or kick the extra point.` }));
  } else {
    // Defensive foul: half the distance to the goal, then replay the two-point try
    const ns = Math.min(99, P.spot + Math.max(1, Math.floor((100 - P.spot) / 2)));
    S.teams[1 - o].st.pen++; S.teams[1 - o].st.penYds += ns - P.spot;
    S.retryTwo = { team: o, spot: ns };
    twoResult(Object.assign(base, { head: "Flag", tone: "good", s: 2, toX: fx(o, ns), read: { c: "o", t: "A flag on the defense gives the offense another try, closer." },
      text: `${P.text} Flag on the play: ${call}. Penalty accepted, so the try doesn't count.`,
      sub: `Half the distance to the goal. The two-point try is replayed from the ${ydLine(ns)}.` }));
  }
}
function doPAT(kind, dist) {
  if (kind === "two") { startTwo(); return; }
  const t = S.patTeam, K = kickerOf(t), base = xpDist(R().tryTwo), d = dist || base;
  const blocked = rand() < .02 * kickBlockMul(t);
  const ok = !blocked && rand() < fgOdds(t, K, d);
  pstat(K, "xpa");
  if (ok) { score(t, 1); pstat(K, "xpm"); }
  const ko = kickAfterScore(t), kick = d !== base ? `${K.last}'s ${d}-yard extra point` : `${K.last}'s extra point`;
  const r = { read: null, team: t, offId: "xp", defId: null, fromX: fx(t, 100 - (d - R().fgAdd)), toX: fx(t, ok ? 110 : 98),
    head: ok ? "Extra point good" : blocked ? "Blocked!" : "Extra point missed", tone: ok ? "good" : "bad",
    text: ok ? `${kick} is good.` : blocked ? `${kick} is blocked!` : `${kick} is no good.`,
    sub: ko, kickEnd: kickEnded, pat: true };
  otTail(r);
  r.id = S.playId = (S.playId || 0) + 1;
  finishClock(r, true);
  S.last = r; S.phase = "result";
  S.log.unshift({ q: S.quarter, clock: S.clock, team: t, sit: "Extra point", off: "Kick", def: "", text: r.text + (r.sub ? " " + r.sub : ""), score: `${S.teams[0].score}-${S.teams[1].score}` });
}
