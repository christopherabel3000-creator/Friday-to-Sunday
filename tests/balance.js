// Plays full computer-vs-computer games between generated 1A schools and prints the numbers that
// show whether the level of play looks like small-school football (see DESIGN.md: more runs than
// passes, completions around 50 percent, few field goals beyond 35 yards, and the better team
// usually winning).
// Usage: node tests/balance.js [games]
const { load } = require("./load.js");
const N = +(process.argv[2] || 300);
const sb = load(), g = sb.__get, F = sb.__fts;
const tot = {}, add = (k, v) => { tot[k] = (tot[k] || 0) + (v || 0); }, inc = k => add(k, 1);
const fgBy = {}; let games = 0, ot = 0, runClock = 0, better = 0, betterN = 0, ties = 0, steps = 0, margin = [];
for (let i = 0; i < N; i++) {
  g("APP = { v: 1, screen: 'home', ex: null, view: null }; newExhibition(); APP.ex.you = 'watch'; startExhibition();");
  let n = 0;
  while (g("S.phase") !== "final" && n < 6000) { F.autoStep(); n++; }
  steps += n;
  const S = g("S");
  if (S.phase !== "final") { console.log("game did not finish", S.phase); continue; }
  games++;
  if (S.quarter >= 5) ot++;
  if (S.runClock) runClock++;
  const sc = S.teams.map(t => t.score);
  add("pts", sc[0] + sc[1]); margin.push(Math.abs(sc[0] - sc[1]));
  if (sc[0] === sc[1]) ties++;
  // Better team by average starter rating
  const r = [0, 1].map(t => g(`sideRating(S.teams[${t}], "off") + sideRating(S.teams[${t}], "def")`));
  if (Math.abs(r[0] - r[1]) >= 4) { betterN++; if ((r[0] > r[1]) === (sc[0] > sc[1])) better++; }
  S.teams.forEach(t => { const st = t.st; add("plays", st.plays); add("yds", st.yds); add("rushY", st.rush); add("passY", st.pass); add("fd", st.fd); add("to", st.to); add("pen", st.pen); add("penY", st.penYds); add("d3", st.d3); add("d3c", st.d3c); });
  for (const id in S.ps) {
    const s = S.ps[id];
    ["pa", "pc", "py", "ptd", "pi", "sk", "ru", "ry", "rtd", "fl", "rec", "fga", "fgm", "xpa", "xpm", "pu", "puy", "kr", "kry", "krtd", "pr", "pry", "ko", "kotb", "tk", "sck", "int"].forEach(k => add(k, s[k]));
  }
  S.log.forEach(e => {
    const m = /(\d+)-yard (field goal is good|try is)/.exec(e.text);
    if (m) { const d = +m[1], b = d < 30 ? "<30" : d < 35 ? "30-34" : d < 40 ? "35-39" : d < 45 ? "40-44" : "45+"; fgBy[b] = fgBy[b] || [0, 0]; fgBy[b][1]++; if (/good/.test(m[2])) fgBy[b][0]++; }
    if (/two-point try is good/.test(e.text)) inc("two_good");
    if (e.sit === "Two-point try" && !/Whistled dead/.test(e.text)) inc("two_att");
    
  });
}
const per = k => (tot[k] / games).toFixed(1), perTeam = k => (tot[k] / games / 2).toFixed(1);
const pct = (a, b) => (100 * tot[a] / tot[b]).toFixed(1) + "%";
console.log(`${games} games, ${(steps / games).toFixed(0)} steps each`);
console.log(`Points per game ${per("pts")}, per team ${perTeam("pts")}; average margin ${(margin.reduce((a, b) => a + b, 0) / games).toFixed(1)}; ties ${ties}; overtime ${ot}; running clock ${runClock}`);
console.log(`Plays per team ${perTeam("plays")}, yards ${perTeam("yds")} (rush ${perTeam("rushY")}, pass ${perTeam("passY")}), first downs ${perTeam("fd")}, third downs ${pct("d3c", "d3")}`);
console.log(`Rushes per team ${perTeam("ru")} for ${(tot.ry / tot.ru).toFixed(2)} a carry; passes ${perTeam("pa")}; run share ${(100 * tot.ru / (tot.ru + tot.pa + tot.sk)).toFixed(1)}%`);
console.log(`Completion ${pct("pc", "pa")}, ${(tot.py / tot.pa).toFixed(2)} yards an attempt, TD passes ${perTeam("ptd")}, INT rate ${pct("pi", "pa")}, sacks per team ${perTeam("sk")}`);
console.log(`Turnovers per team ${perTeam("to")}, fumbles lost ${perTeam("fl")}, penalties per team ${perTeam("pen")} for ${perTeam("penY")} yards`);
console.log(`Field goals per team ${perTeam("fga")} (${pct("fgm", "fga")}); by distance: ${Object.keys(fgBy).sort().map(k => `${k}: ${fgBy[k][0]}/${fgBy[k][1]}`).join(", ")}`);
console.log(`Extra points ${pct("xpm", "xpa")} (${perTeam("xpa")} per team), two-point tries ${((tot.two_att || 0) / games / 2).toFixed(2)} per team, good ${(100 * (tot.two_good || 0) / (tot.two_att || 1)).toFixed(1)}%`);
console.log(`Punts per team ${perTeam("pu")} averaging ${(tot.puy / tot.pu).toFixed(1)}; kick returns ${perTeam("kr")} averaging ${(tot.kry / tot.kr).toFixed(1)}, return TDs ${tot.krtd || 0}; touchbacks ${pct("kotb", "ko")}`);
console.log(`Better team (4+ points of starter rating) won ${better} of ${betterN} (${(100 * better / betterN).toFixed(1)}%)`);
