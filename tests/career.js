// Your career: creating a coach and what the ratings do, taking a job with your schemes, the season
// summary, save codes and cloud saves (against a stand-in for the online database), and old saves.
// Usage: node tests/career.js
const { load } = require("./load.js");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
// Save codes need the browser's text, compression and base64 helpers
const WEB = { TextEncoder, TextDecoder, Blob, Response, CompressionStream, DecompressionStream, btoa, atob, crypto: globalThis.crypto };
const fresh = extra => { const sb = load({ globals: Object.assign({}, WEB, extra || {}) }); return { sb, g: sb.__get, F: sb.__fts }; };
const RATING_IDS = ["off", "def", "st", "dev", "mot", "gm", "sct"];

(async () => {
  // ---- Creating your coach ----
  {
    const { g } = fresh();
    const bgs = g("BACKGROUNDS");
    for (const id of g("BACKGROUND_IDS")) {
      const c = g(`makeCoach("Pat", "Ruiz", "${id}", "air", "blz")`);
      ok(RATING_IDS.every(k => c[k] === 40 + (bgs[id].add[k] || 0)), `${bgs[id].name}: 40 in everything, plus the background`);
      ok(c.you && c.first === "Pat" && c.last === "Ruiz" && c.bg === id && c.off_style === "air" && c.def_style === "blz", `${bgs[id].name}: name, background and schemes`);
    }
    ok(g(`makeCoach("A", "B", "qb").grow.qb`) === 1.3 && g(`makeCoach("A", "B", "line").spec`) === "run" && !g(`makeCoach("A", "B", "teach").grow`), "growth and specialties come with the background");
    ok(g(`makeCoach("A", "B", "qb").gm`) >= 45 && g(`makeCoach("A", "B", "st").gm`) >= 45 && g(`makeCoach("A", "B", "def").sct`) >= 45 && g(`makeCoach("A", "B", "line").gm`) < 45, "the backgrounds that promise sharper help reach its thresholds");
    ok(g(`cleanName("  Mary   Ann  ")`) === "Mary Ann" && g(`cleanName("x".repeat(40))`).length === 20, "names are tidied and kept short");
    ok(g(`coachFullName({ first: "Pat", last: "Ruiz" })`) === "Coach Pat Ruiz" && g(`coachFullName({ first: "", last: "" })`) === "Your coach", "a coach's full name, or Your coach before there is one");
  }

  // ---- Taking a job with your schemes ----
  {
    const { g } = fresh();
    g(`newCareer("Pat", "Ruiz", "line", "air", "nfz"); newSeason(4242);`);
    const ids = g("SEASON.districts[SEASON.district - 1].ids"), pick = ids[3];
    const known = g(`coreKnown(SEASON.schools["${pick}"], "air", "nfz")`), oldOff = g(`SEASON.schools["${pick}"].off`);
    ok(known.off >= 0 && known.off <= 4 && known.def >= 0 && known.def <= 4, "how much of your playbook a school knows, out of 4 on each side");
    ok(g(`coreKnown(SEASON.schools["${pick}"], SEASON.schools["${pick}"].off, SEASON.schools["${pick}"].def).off`) >= 2, `a school knows its own schemes' core plays (it ran ${oldOff})`);
    const rank = g(`talentRank("${pick}")`);
    ok(g(`pickSchool("${pick}")`) && g("mySchool().coach === CAREER.coach"), "your coach takes the job");
    ok(g("mySchool().off") === "air" && g("mySchool().def") === "nfz", "your schemes come with you");
    ok(g("SEASON.expect") === rank && rank >= 1 && rank <= 8, `where your talent ranked in the district is kept (${rank})`);
    ok(g("mySchool().rating.c") === Math.round((46 + 46) / 2), "the quick sim uses your coach's ratings");
    // Changing schemes on the season screen changes your coach's too
    g(`APP = { v: 1, screen: "season", ex: null, view: null }; newExhibition(); APP.screen = "season";`);
    g(`act("ostyle", { v: "gnp" })`);
    ok(g("mySchool().off") === "gnp" && g("CAREER.coach.off_style") === "gnp", "your schemes are your coach's");
    // Without a career, the old way: an unnamed coach with the class average, running the school's schemes
    const t = fresh();
    t.g("newSeason(4242)");
    const off0 = t.g(`SEASON.schools["${pick}"].off`);
    t.g(`pickSchool("${pick}")`);
    ok(t.g("CAREER.coach.last") === "" && RATING_IDS.every(k => t.g(`mySchool().coach.${k}`) === 42) && t.g("mySchool().off") === off0 && t.g("CAREER.coach.off_style") === off0, "without a coach of your own: no name, 42 in everything, the school's schemes");
  }

  // ---- What the ratings do ----
  {
    const { g } = fresh();
    g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); APP.ex.you = "watch"; startExhibition();`);
    g(`S.teams.forEach(t => { t.coach = Object.assign({}, t.coach, { mot: 42, st: 42, spec: null, gm: 42, sct: 42 }); });`);
    // Motivation: only in the fourth quarter or overtime, within 8 points
    g(`S.teams[0].coach.mot = 67; S.quarter = 4; S.teams[0].score = 14; S.teams[1].score = 20;`);
    ok(Math.abs(g("motEdge(0)") - .1) < 1e-9 && g("motEdge(1)") === 0, "Motivation 67: +0.1 late in a close game");
    g("S.quarter = 3");
    ok(g("motEdge(0)") === 0, "not before the fourth quarter");
    g("S.quarter = 4; S.teams[1].score = 34");
    ok(Math.abs(g("motEdge(0)") - .1) < 1e-9, "a comeback from any score");
    g("S.teams[1].score = 20; S.teams[0].score = 28");
    ok(Math.abs(g("motEdge(0)") - .1) < 1e-9, "a lead of 8 or less counts too");
    g("S.teams[0].score = 29");
    ok(g("motEdge(0)") === 0, "but not a bigger lead");
    // A former lineman's run game, on both sides of the ball
    g(`S.teams[0].coach.spec = "run"`);
    ok(Math.abs(g(`specEdge(0, "ir")`) - .05) < 1e-9 && g(`specEdge(0, "dp")`) === 0 && Math.abs(g(`specEdge(1, "or")`) + .05) < 1e-9, "the run game: +0.05 running, and against the run");
    // Special teams: field goals, punts and coverage
    const K = g("kickerOf(0)");
    const base = g(`fgOdds(0, kickerOf(0), 35)`);
    g("S.teams[0].coach.st = 67");
    ok(Math.abs(g(`fgOdds(0, kickerOf(0), 35)`) - Math.min(.99, base * 1.1)) < 1e-9, `Special teams 67: field goals about 10 percent likelier (${K.last}: ${Math.round(base * 100)} to ${Math.round(g("fgOdds(0, kickerOf(0), 35)") * 100)} percent from 35)`);
    ok(Math.abs(g("coverRating(0)") - g("coverRating(1)") - (g(`unitAvg(coverUnit(0), { spd: .5, tkl: .5 })`) - g(`unitAvg(coverUnit(1), { spd: .5, tkl: .5 })`)) - 5) < 1e-9, "and better kick coverage");
    // Game management: the fourth-down odds on the call sheet
    g("Object.assign(S, { poss: 0, down: 4, toGo: 2, twoPt: null })");
    g("S.teams[0].coach.gm = 46");
    ok(/about \d+ percent to convert/.test(g("fourthDownNote(0)")), "Game management 46: the odds as a percentage");
    g("S.teams[0].coach.gm = 40");
    ok(/^Going for it: (likely to convert|about even|a tough ask|a long shot), by your staff's read\.$/.test(g("fourthDownNote(0)")), "below 45: a rough idea");
    g("S.teams[0].coach.gm = 60; S.toGo = 1");
    const p1 = +/(\d+) percent/.exec(g("fourthDownNote(0)"))[1];
    g("S.toGo = 9");
    const p9 = +/(\d+) percent/.exec(g("fourthDownNote(0)"))[1];
    ok(p1 > 50 && p9 < 35 && p1 > p9, `fourth and 1 is likelier than fourth and 9 (${p1} and ${p9} percent)`);
    // Scouting: a fuller report from the same film time at 45, and spotting disguises at 60
    ok(g("prepLevelFor(1, { sct: 46 })") === 2 && g("prepLevelFor(2, { sct: 46 })") === 3 && g("prepLevelFor(3, { sct: 46 })") === 3, "Scouting 46: one level more from the same film time");
    ok(g("prepLevelFor(1, { sct: 44 })") === 1 && g("prepLevelFor(0, { sct: 90 })") === 0, "below 45 it's the film time alone, and no film is no report");
    g(`S.teams[0].cpu = false; S.teams[1].cpu = true; S.offCall = "ir"; S.offPkg = "p11"; S.defCall = "c3"; S.defPkg = "base"; S.cfg.aud = true;`);
    g(`makeLook = () => ({ d: "zo", fake: true });`);
    const flags = sct => { let n = 0; for (let i = 0; i < 400; i++) { g(`S.teams[0].coach.sct = ${sct}; S.phase = "call"; afterDef();`); if (g("S.look.flag")) n++; } return n; };
    const f59 = flags(59), f90 = flags(90);
    ok(f59 === 0 && f90 > 100 && f90 < 220, `disguises spotted: none at Scouting 59, about 40 percent at 90 (${f90} of 400)`);
    ok(g("S.phase") === "los" && /Your staff thinks this look is a disguise/.test(g("(() => { S.look.flag = true; return vLOS(); })()")), "the call sheet at the line says so");
  }

  // ---- Faster growth from a background ----
  {
    const { g } = fresh();
    g(`newSeason(99); pickSchool(SEASON.districts[SEASON.district - 1].ids[0]);`);
    const grow = mul => g(`(() => {
      const s = clone(mySchool()); s.coach = Object.assign({}, s.coach, { grow: ${mul ? "{ qb: 1.3 }" : "null"} });
      // Growth to the thousandth of a point: the ratings plus the progress toward the next point
      // (accuracy and arm, which only the quarterback unit trains, each started halfway to its next point)
      const qbs = unitPlayers(s, "qb").map(([p]) => p);
      qbs.forEach(p => { p.gx = Object.assign({}, p.gx, { acc: .5, arm: .5 }); });
      const tot = () => qbs.reduce((t, p) => t + ["acc", "arm"].reduce((u, a) => u + p.r[a] + p.gx[a], 0), 0), before = tot();
      for (let w = 1; w <= 8; w++) practiceSchool(s, newPlan(), seededRandom(w), { noInjuries: true });
      return tot() - before;
    })()`);
    const plain = grow(false), qbBg = grow(true);
    ok(qbBg > plain * 1.15 && qbBg < plain * 1.45, `a former quarterback's quarterbacks grow about 30 percent faster (${plain.toFixed(2)} points without, ${qbBg.toFixed(2)} with)`);
  }

  // ---- The season summary ----
  {
    const { g } = fresh();
    g(`newCareer("Pat", "Ruiz", "teach", "gnp", "rs"); newSeason(31337); pickSchool(SEASON.districts[SEASON.district - 1].ids[2]); simSeason();`);
    ok(g("SEASON.phase") === "over" && g("CAREER.seasons.length") === 1, "the finished season goes into your career");
    ok(!g("recordCareerSeason()") && g("CAREER.seasons.length") === 1, "only once");
    const x = g("seasonSummary()"), games = x.games;
    ok(x.all.w + x.all.l === games.length && games.length >= 10 && games.length <= 14, `your record covers every game (${x.all.w}-${x.all.l})`);
    ok(x.pf === games.reduce((s, y) => s + y.us, 0) && x.pa === games.reduce((s, y) => s + y.them, 0), "points for and against");
    ok(x.place >= 1 && x.place <= 8 && x.expect >= 1 && x.expect <= 8, `your district finish (${x.place}) and preseason talent rank (${x.expect})`);
    ok(!x.best || x.best.win, "the best win is a win");
    ok(!x.close || (!x.close.win && games.filter(y => !y.win).every(y => y.them - y.us >= x.close.them - x.close.us)), "the closest loss is the closest");
    ok(!x.big || games.filter(y => y.win).every(y => y.us - y.them <= x.big.us - x.big.them), "the biggest win is the biggest");
    ok(x.leaders.pass && x.leaders.rush && x.leaders.tk, "passing, rushing and tackle leaders");
    ok(x.improved.length > 0 && x.improved.every((y, i) => y.d > 0 && (i === 0 || x.improved[i - 1].d >= y.d)), "the most improved players, most first");
    const champ = g("SEASON.champion === SEASON.myId"), finish = g("CAREER.seasons[0].finish");
    ok(champ ? finish === "State champions" : /^(Lost in the|Missed the playoffs)/.test(finish), `how it ended: ${finish}`);
    ok(/^Season 1: .+, \d+-\d+, (first|second|third|fourth|fifth|sixth|seventh|eighth) in the district\. .+\.$/.test(g("careerLine(CAREER.seasons[0], 0)")), "a line for your coach's page");
    // The summary screen draws
    g(`APP = { v: 1, screen: "summary", ex: null, view: null }; newExhibition();`);
    const html = g("vSummary()");
    ok(/The record/.test(html) && /Leaders/.test(html) && /Most improved/.test(html) && /data-a="nextseason"/.test(html) && /data-a="newcareer"/.test(html), "the summary: record, leaders, most improved, and what's next");
    // Another season with the same coach: a new district and school
    const seed = g("SEASON.seed");
    g(`act("nextseason")`);
    ok(g("APP.screen") === "pick" && g("SEASON.seed") !== seed && g("SEASON.myId") === null && g("CAREER.seasons.length") === 1, "coach another season: pick a new school");
    g(`pickSchool(SEASON.districts[SEASON.district - 1].ids[0])`);
    ok(g("mySchool().off") === "gnp" && g("mySchool().coach === CAREER.coach"), "with the same coach and schemes");
  }

  // ---- Save codes ----
  {
    const { g } = fresh();
    g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Ruiz", "qb", "air", "blz"); newSeason(5150); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]); simSeason(4);`);
    const before = g("JSON.stringify(currentSave())");
    const code = await g("encodeSave(currentSave())");
    ok(code.startsWith("FTS1Z.") && code.length < before.length / 2, `a save code is compressed (${Math.round(code.length / 1024)} KB for a ${Math.round(before.length / 1024)} KB save)`);
    const back = await g(`decodeSave(${JSON.stringify(code)})`);
    ok(back.save && JSON.stringify(back.save) === before, "it comes back exactly");
    const messy = code.replace(/(.{60})/g, "$1\n ") + "\n";
    ok((await g(`decodeSave(${JSON.stringify("Here's my save: " + messy)})`)).save, "spaces, line breaks and words around it don't matter");
    ok(/doesn't look like/.test((await g(`decodeSave("hello")`)).err), "not a save code");
    ok(/incomplete or damaged/.test((await g(`decodeSave(${JSON.stringify(code.slice(0, code.length - 400))})`)).err), "a cut-off code");
    const newer = await g(`encodeSave(Object.assign(currentSave(), { build: BUILD + 1 }))`);
    ok(/newer version/.test((await g(`decodeSave(${JSON.stringify(newer)})`)).err), "a save from a newer version asks for a reload");
    ok(/^Coach Pat Ruiz, .+ .+, \d-\d in week 4$/.test(g("saveSummary(currentSave())")), `a save in a sentence: ${g("saveSummary(currentSave())")}`);
    // A browser that can't compress writes a plain code, and one that can reads it
    const plain = fresh({ CompressionStream: undefined, DecompressionStream: undefined });
    plain.g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Lee", "Park", "def", "bal", "bal"); newSeason(77);`);
    const pcode = await plain.g("encodeSave(currentSave())");
    ok(pcode.startsWith("FTS1.") && !pcode.startsWith("FTS1Z."), "without compression: a plain code");
    ok(/looking for a job/.test(g(`saveSummary((${JSON.stringify(plain.g("currentSave()"))}))`)) && (await g(`decodeSave(${JSON.stringify(pcode)})`)).save.career.coach.last === "Park", "a plain code loads anywhere");
    ok(/can't open/.test((await plain.g(`decodeSave(${JSON.stringify(code)})`)).err), "a compressed code in a browser that can't open it says so");
    // Loading a save keeps the game it replaces as the backup
    const other = (await plain.g(`decodeSave(${JSON.stringify(pcode)})`)).save;
    g(`adoptSave(${JSON.stringify(other)}, null)`);
    ok(g("CAREER.coach.last") === "Park" && g("APP.screen") === "saves" && g("SEASON.seed") === 77, "load a save");
    ok(/^Coach Pat Ruiz/.test(g("saveSummary(readBackup())")), "the game it replaced is the backup");
  }

  // ---- Cloud saves ----
  {
    // A stand-in for the online database, with the rules' version check
    const data = {}; let deny = false;
    const denied = () => Object.assign(new Error("PERMISSION_DENIED: permission_denied"), { code: "PERMISSION_DENIED" });
    const db = { ref: path => ({
      transaction(fn) {
        if (deny) return Promise.reject(denied());
        const cur = data[path] === undefined ? null : JSON.parse(JSON.stringify(data[path]));
        const next = fn(cur);
        if (next === undefined) return Promise.resolve({ committed: false, snapshot: { exists: () => cur !== null } });
        if ((cur === null && next.ver !== 1) || (cur !== null && next.ver !== cur.ver + 1)) return Promise.reject(denied());
        data[path] = next;
        return Promise.resolve({ committed: true, snapshot: { exists: () => true } });
      },
      once() { return deny ? Promise.reject(denied()) : Promise.resolve({ val: () => data[path] === undefined ? null : data[path] }); }
    }) };
    const firebase = { apps: [], database: true, initializeApp() { this.apps.push(1); return { database: () => db }; }, app() { return { database: () => db }; } };
    const { g } = fresh({ firebase });
    g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition(); newCareer("Pat", "Ruiz", "qb", "air", "blz"); newSeason(5150); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]);`);
    let r = await g("cloudSave(false)");
    const key = g("APP.cloud.key");
    ok(r.ok && key.length === 12 && [...key].every(ch => g("KEY_CHARS").includes(ch)) && g("APP.cloud.ver") === 1, `a first cloud save gets a code (${key})`);
    ok(r.msg.includes(g("keyText(APP.cloud.key)")) && /like a password/.test(r.msg), "and says what it is");
    const rec = data["fridayToSundaySaves/" + key];
    ok(rec && rec.ver === 1 && rec.state.startsWith("FTS1Z.") && rec.by.length === 12 && rec.act === "save" && Math.abs(rec.t - Date.now()) < 60000, "the record matches the database rules");
    ok((await g(`decodeSave(${JSON.stringify(rec.state)})`)).save.app.cloud === null, "the cloud copy leaves out the cloud save code (a cloud load brings it along)");
    const shared = await g("encodeSave(portableSave())");
    ok((await g(`decodeSave(${JSON.stringify(shared)})`)).save.app.cloud === null && g("APP.cloud.key") === key, "so does a save code, so sharing one never shares the cloud save");
    g("simSeason(3)");
    r = await g("cloudSave(false)");
    ok(r.ok && g("APP.cloud.ver") === 2 && data["fridayToSundaySaves/" + key].ver === 2, "saving again bumps the version");
    // Another device saved since: ask first
    data["fridayToSundaySaves/" + key].ver = 3;
    r = await g("cloudSave(false)");
    ok(r.conflict && /changed on another device/.test(r.msg) && g("APP.cloud.ver") === 2, "a cloud save changed elsewhere isn't replaced without asking");
    r = await g("cloudSave(true)");
    ok(r.ok && g("APP.cloud.ver") === 4, "replace it when asked");
    // Load it on another device
    const other = fresh({ firebase });
    other.g(`APP = { v: 1, screen: "home", ex: null, view: null }; newExhibition();`);
    r = await other.g(`cloudFind(${JSON.stringify(" " + key.toLowerCase().replace(/(....)/g, "$1 ") + " ")})`);
    ok(r.found && r.found.cloud.key === key && r.found.cloud.ver === 4 && /^Found a cloud save from/.test(r.msg), "find it by its code, typed any old way");
    other.g(`adoptSave(${JSON.stringify(r.found.save)}, ${JSON.stringify(r.found.cloud)})`);
    ok(other.g("CAREER.coach.last") === "Ruiz" && other.g("SEASON.week") === 3 && other.g("APP.cloud.ver") === 4 && other.g("mySchool().coach === CAREER.coach"), "the other device has the game, and the cloud save's version");
    r = await other.g("cloudSave(false)");
    ok(r.ok && other.g("APP.cloud.ver") === 5, "and can save to it");
    ok(/12 letters and numbers/.test((await g(`cloudFind("ABC")`)).msg) && /There's no cloud save/.test((await g(`cloudFind("ABCD EFGH JK23")`)).msg), "a bad code, and one with no save");
    deny = true;
    ok(/switched on yet/.test((await g("cloudSave(false)")).msg) && /switched on yet/.test((await g(`cloudFind("${key}")`)).msg), "with the rules unpublished, it says what's missing");
  }

  // ---- Saves from before careers ----
  {
    const { g } = fresh();
    // A season under way: its unnamed coach becomes your career's
    g(`APP = { v: 1, screen: "season", ex: null, view: null }; newExhibition(); newSeason(808); pickSchool(SEASON.districts[SEASON.district - 1].ids[0]); simSeason(3);`);
    g(`localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, build: 4, app: APP, game: null, season: SEASON })); CAREER = null; SEASON = null; APP = null; start();`);
    ok(g("CAREER && CAREER.coach.you && CAREER.coach.last === ''") && g("mySchool().coach === CAREER.coach") && g("APP.screen") === "season", "an old season keeps going, with an unnamed coach of its own");
    g(`APP.screen = "coach"; typed("first", "Sam"); typed("last", " Okafor ");`);
    ok(g("mySchool().coach.last") === "Okafor" && g("coachFullName(CAREER.coach)") === "Coach Sam Okafor", "name him on his page");
    g("save(); CAREER = null; SEASON = null; APP = null; start();");
    ok(g("mySchool().coach === CAREER.coach") && g("CAREER.coach.first") === "Sam", "the name sticks, and the coach is still one coach after a reload");
    // Still picking a school: start over with a coach of your own
    g(`newSeason(909); localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, build: 4, app: Object.assign(APP, { screen: "pick" }), game: null, season: SEASON })); CAREER = null; SEASON = null; APP = null; start();`);
    ok(g("SEASON") === null && g("CAREER") === null && g("APP.screen") === "home", "an old season still waiting for its school is dropped");
  }

  console.log(`${checks - fails}/${checks} checks passed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log("FAIL: " + (e.stack || e)); process.exit(1); });
