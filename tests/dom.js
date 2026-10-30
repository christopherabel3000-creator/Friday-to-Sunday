// Loads the real page in jsdom and plays it by tapping buttons, the way a person would. Checks that
// every screen draws, that focus lands where VoiceOver should start reading, that buttons and tables
// are labeled, and that a game survives a reload.
// Usage: node tests/dom.js   (needs jsdom: npm install)
const path = require("path"), fs = require("fs");
const { JSDOM, VirtualConsole, ResourceLoader } = require("jsdom");
const ROOT = path.join(__dirname, "..");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } };
const settle = () => new Promise(r => setTimeout(r, 0));

// The page is served from a made-up address (so it gets real storage), backed by the repo's files.
// Nothing loads from the network (no fonts).
const HOST = "https://fts.test/";
class LocalOnly extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith(HOST)) return null;
    const p = Promise.resolve(fs.readFileSync(path.join(ROOT, url.slice(HOST.length).split("?")[0])));
    p.abort = () => {};
    return p;
  }
}
async function openPage(storage) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(e.message || String(e)));
  vc.on("error", e => errors.push(String(e)));
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), {
    runScripts: "dangerously", resources: new LocalOnly(), pretendToBeVisual: true, virtualConsole: vc, url: HOST + "index.html",
    beforeParse(window) {
      window.scrollTo = () => {};
      if (storage) for (const [k, v] of Object.entries(storage)) window.localStorage.setItem(k, v);
    }
  });
  await new Promise(r => dom.window.addEventListener("load", r));
  await settle();
  return { dom, w: dom.window, d: dom.window.document, errors };
}
const btn = (d, a, v) => [...d.querySelectorAll(`[data-a="${a}"]`)].find(b => v == null || b.dataset.v === String(v) || b.dataset.t === String(v));
function tap(page, a, v) {
  const b = btn(page.d, a, v);
  if (!b) throw new Error(`no button ${a} ${v == null ? "" : v}`);
  // A tap (or VoiceOver double-tap) puts focus on the button before it acts
  b.focus();
  b.click();
  return b;
}
// The element VoiceOver starts on after a tap
const focused = d => d.activeElement;
function checkScreen(page, label) {
  const d = page.d;
  ok(page.errors.length === 0, `${label}: no script errors (${page.errors.slice(0, 2).join(" | ")})`);
  [...d.querySelectorAll("button")].forEach(b => ok((b.textContent || "").trim().length > 0 || b.getAttribute("aria-label"), `${label}: every button has a name`));
  const ids = [...d.querySelectorAll("[id]")].map(e => e.id);
  ok(new Set(ids).size === ids.length, `${label}: no duplicate ids`);
  [...d.querySelectorAll("table")].forEach(t => ok(t.querySelectorAll("th").length > 0, `${label}: tables have headers`));
}

(async () => {
  // ---- Home, rosters and a player ----
  let page = await openPage();
  let d = page.d;
  ok(d.querySelector("h1") && /Friday to/i.test(d.querySelector("h1").textContent), "the home screen shows the title");
  ok(d.querySelectorAll(".teamcard").length === 2, "two schools on the home screen");
  ok(d.querySelector('table[aria-label="Matchup by unit"] th[scope="row"]'), "the matchup table has row headers");
  checkScreen(page, "home");
  tap(page, "roster", 0);
  ok(/Roster and depth chart/.test(d.body.textContent), "the roster screen opens");
  ok(focused(d) && focused(d).tagName === "H2", "focus moves to the roster heading");
  ok(d.querySelectorAll(".rowbtn").length >= 30, "the roster lists players by position");
  const firstLine = d.querySelector(".rowbtn").textContent;
  ok(/^Starter\. .+, (freshman|sophomore|junior|senior), quarterback \d+/.test(firstLine), `players read as one sentence: ${firstLine}`);
  checkScreen(page, "roster");
  d.querySelector(".rowbtn").focus(); d.querySelector(".rowbtn").click();
  ok(d.querySelectorAll(".ratings li").length === 18, "a player's screen lists every rating");
  ok(focused(d) && focused(d).tagName === "H2", "focus moves to the player's name");
  checkScreen(page, "player");
  tap(page, "back");
  ok(/Roster and depth chart/.test(d.body.textContent), "back to the roster");
  tap(page, "rteam");
  tap(page, "back");
  ok(d.querySelector(".teamcard"), "back home");
  // Pick the away team and a style, then kick off
  tap(page, "you", 1);
  ok(btn(d, "you", 1).getAttribute("aria-pressed") === "true", "you coach the away team");
  ok(focused(d) === btn(d, "you", 1), "focus stays on the button after a toggle");
  tap(page, "ostyle", "air");
  ok(btn(d, "ostyle", "air").getAttribute("aria-pressed") === "true", "offensive style picked");
  tap(page, "kickoff");
  checkScreen(page, "kickoff");

  // ---- Play a game by tapping ----
  const seen = new Set();
  let steps = 0, focusBad = 0, lastHead = "";
  const sw = page.w;
  while (steps < 4000) {
    steps++;
    const S = sw.eval("S");
    if (!S || S.phase === "final") break;
    seen.add(S.phase);
    const before = sw.eval("lastKey");
    switch (S.phase) {
      case "toss": tap(page, "toss", S.toss.step === "call" ? "heads" : (btn(d, "toss", "receive") ? "receive" : "defense")); break;
      case "call": {
        const pk = d.querySelector('[data-a="pkg"][aria-pressed="true"]');
        const plays = [...d.querySelectorAll('[data-a="pick"]')];
        const pick = plays[Math.floor(Math.random() * plays.length)];
        pick.focus(); pick.click();
        if (S.side === "def" && Math.random() < .2 && btn(d, "disg", 1)) tap(page, "disg", 1);
        tap(page, "lock"); void pk; break;
      }
      case "los": if (Math.random() < .3 && d.querySelector('[data-a="audpick"]')) { tap(page, "audpick", d.querySelector('[data-a="audpick"]').dataset.v); tap(page, "audible"); } else tap(page, "snap"); break;
      case "result": {
        if (btn(d, "to") && Math.random() < .05) tap(page, "to");
        if (btn(d, "onside") && Math.random() < .1) tap(page, "onside");
        tap(page, "cont"); break;
      }
      case "pat": tap(page, "pat", Math.random() < .3 ? "two" : "kick"); break;
      case "trychoice": tap(page, "try", "kick"); break;
      case "kickchoice": tap(page, "kick", "deep"); break;
      case "penalty": tap(page, "pen", Math.random() < .5 ? 1 : 0); break;
      case "halftime": ok(/Scouting report/i.test(d.body.textContent), "the halftime report shows"); tap(page, "half"); break;
      default: throw new Error("stuck on " + S.phase);
    }
    const after = sw.eval("lastKey");
    if (after !== before) {
      const f = focused(d);
      if (!f || !(f.hasAttribute("data-focus") || /^H[12]$/.test(f.tagName))) focusBad++;
    }
    if (page.errors.length) break;
    const h = d.querySelector(".headline"); if (h) lastHead = h.textContent;
  }
  void lastHead;
  ok(page.errors.length === 0, "no script errors during the game: " + page.errors.slice(0, 3).join(" | "));
  ok(sw.eval("S.phase") === "final", `the game reaches the final by tapping (${steps} taps, last screen ${sw.eval("S.phase")})`);
  ok(focusBad === 0, `every new screen puts focus on its heading or main block (${focusBad} misses)`);
  ok(["toss", "call", "result"].every(p => seen.has(p)), "saw the toss, call sheet and results: " + [...seen].join(", "));
  ok(/win|tie/.test(d.querySelector(".final h2").textContent), "the final screen names the winner");
  ok(d.querySelectorAll(".statwrap table").length >= 4, "player stats tables in the box score");
  ok(d.querySelector(".statwrap caption"), "stat tables have captions");
  checkScreen(page, "final");
  // Play again, then sim to the end (it takes two taps)
  tap(page, "rematch");
  ok(sw.eval("S.phase") !== "final", "play again starts a new game");
  tap(page, "sim");
  ok(sw.eval("S.phase") !== "final" && /Tap again/.test(btn(d, "sim").textContent), "sim to the end asks for a second tap");
  tap(page, "sim");
  ok(sw.eval("S.phase") === "final", "sim to the end finishes the game");
  ok(focused(d) && focused(d).hasAttribute("data-focus") || /^H[12]$/.test(focused(d).tagName), "focus lands on the final");
  checkScreen(page, "simmed");

  // ---- Reload in the middle of a game ----
  tap(page, "newmatch");
  tap(page, "kickoff");
  for (let i = 0; i < 30 && sw.eval("S.phase") !== "final"; i++) { const S = sw.eval("S"); if (S.phase === "result") tap(page, "cont"); else sw.eval("autoStep(); save(); render();"); }
  const snapshot = sw.eval("JSON.stringify({ score: S.teams.map(t => t.score), phase: S.phase, q: S.quarter, clock: S.clock, play: S.playId })");
  const store = {}; for (let i = 0; i < sw.localStorage.length; i++) { const k = sw.localStorage.key(i); store[k] = sw.localStorage.getItem(k); }
  const page2 = await openPage(store);
  const again = page2.w.eval("JSON.stringify({ score: S.teams.map(t => t.score), phase: S.phase, q: S.quarter, clock: S.clock, play: S.playId })");
  ok(again === snapshot, `a game picks up where it left off after a reload (${snapshot} vs ${again})`);
  ok(page2.errors.length === 0, "no errors after the reload");
  // The help screen opens and closes without touching the game
  tap(page2, "help");
  ok(/How to/i.test(page2.d.querySelector("h1").textContent) && /High school rules/.test(page2.d.body.textContent), "How to play explains the high school rules");
  tap(page2, "help");
  ok(page2.w.eval("JSON.stringify({ score: S.teams.map(t => t.score), phase: S.phase, q: S.quarter, clock: S.clock, play: S.playId })") === again, "the help screen doesn't change the game");
  // Home in the middle of a game, then back
  tap(page2, "gohome");
  ok(btn(page2.d, "resume"), "home offers to go back to the game");
  tap(page2, "resume");
  ok(page2.w.eval("APP.screen") === "game", "back in the game");

  // ---- The depth chart, before a game ----
  const p3 = await openPage(), d3 = p3.d, w3 = p3.w;
  const school = () => w3.eval("APP.ex.schools[0]");
  const said = async () => { await new Promise(r => setTimeout(r, 120)); return d3.getElementById("sr").textContent; };
  tap(p3, "roster", 0);
  ok(btn(d3, "dmode", "always").getAttribute("aria-pressed") === "true", "your roster: changes apply to every game unless you say otherwise");
  ok(btn(d3, "rot", "normal").getAttribute("aria-pressed") === "true", "rotation starts at normal");
  tap(p3, "rot", "often");
  ok(w3.eval("APP.ex.rot") === "often" && /Rotation: Rotate often/.test(await said()), "pick a rotation, and hear it");
  tap(p3, "dedit", "QB");
  ok(focused(d3) && focused(d3).tagName === "H2" && /Quarterbacks/.test(focused(d3).textContent), "the quarterbacks screen opens on its heading");
  checkScreen(p3, "edit quarterbacks");
  const qb = school().depth.QB.slice();
  tap(p3, "dsel", qb[1]);
  ok(btn(d3, "dsel", qb[1]).getAttribute("aria-pressed") === "true" && d3.querySelector(".dacts"), "picking a player shows what you can do with him");
  ok(focused(d3) === btn(d3, "dsel", qb[1]), "focus stays on the player you picked");
  tap(p3, "dmove", "start");
  ok(school().depth.QB[0] === qb[1], "start the backup quarterback");
  ok(/is the starter at quarterback/.test(await said()), "the change is announced");
  ok(focused(d3) === btn(d3, "dsel", qb[1]), "focus follows the player to his new spot");
  ok(/^1\. Starter\./.test(btn(d3, "dsel", qb[1]).textContent), "he's listed first now");
  tap(p3, "dmove", "down");
  ok(school().depth.QB[0] === qb[0] && focused(d3) === btn(d3, "dsel", qb[1]), "move him back down; focus stays with him");
  tap(p3, "ddone");
  ok(focused(d3) === btn(d3, "dedit", "QB"), "done: focus returns to the Change quarterbacks button");
  // Next game only
  tap(p3, "dmode", "next");
  tap(p3, "dedit", "QB");
  tap(p3, "dsel", qb[1]); tap(p3, "dmove", "start");
  tap(p3, "ddone"); tap(p3, "back");
  ok(school().depth.QB[0] === qb[0], "a next-game change leaves the every-game chart alone");
  tap(p3, "kickoff");
  ok(w3.eval("S.teams[0].depth.QB[0]") === qb[1] && w3.eval("S.teams[0].rot") === "often", "the game starts with the next-game lineup and your rotation");
  checkScreen(p3, "kickoff with changes");

  // ---- Substitutions during a game ----
  // Play on until you're calling an offensive play: results move on as usual, and the computer makes
  // your other decisions along the way
  for (let i = 0; i < 400; i++) {
    const S = w3.eval("S");
    if (S.phase === "call" && S.side === "off") break;
    w3.eval(S.phase === "result" ? "cont(); render();" : "S.teams[0].cpu = true; autoStep(); S.teams[0].cpu = false; render();");
  }
  ok(w3.eval("S.phase") === "call" && btn(d3, "lineup"), "the call sheet has a way to change the lineup");
  tap(p3, "lineup");
  ok(/Lineup and substitutions/.test(d3.body.textContent) && /this game only/.test(d3.body.textContent), "the lineup screen says changes last for this game");
  ok(!btn(d3, "dmode"), "no every-game choice in the middle of a game");
  const rb = w3.eval("S.teams[0].depth.RB.slice()");
  tap(p3, "dedit", "RB"); tap(p3, "dsel", rb[1]); tap(p3, "dmove", "start"); tap(p3, "ddone");
  tap(p3, "back");
  ok(w3.eval("APP.screen") === "game" && w3.eval("S.phase") === "call", "back on the call sheet");
  const sub = w3.eval(`playerById(S.teams[0], "${rb[1]}").last`);
  w3.eval("S.teams[0].players.forEach(p => p.rest = false); S.teams[0].dver++; render();");
  ok(new RegExp(`RB ${sub}`).test(d3.querySelector(".onfield").textContent), `the substitute is on the field: ${d3.querySelector(".onfield").textContent}`);
  ok(school().depth.RB[0] === rb[0], "the school's depth chart is unchanged");
  checkScreen(p3, "after a substitution");
  // Finish the game: the next one is back to the every-game chart
  tap(p3, "sim"); tap(p3, "sim");
  tap(p3, "rematch");
  ok(w3.eval("S.teams[0].depth.QB[0]") === qb[0], "after that game, the depth chart goes back to the every-game one");
  ok(p3.errors.length === 0, "no script errors in the depth chart screens: " + p3.errors.slice(0, 2).join(" | "));

  console.log(`${checks - fails}/${checks} checks passed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log("FAIL: " + (e.stack || e)); process.exit(1); });
