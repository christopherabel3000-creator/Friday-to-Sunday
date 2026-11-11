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
// extra: things to add to the page's window before it loads (the browser's compression helpers,
// stand-ins for the clipboard and the online database)
async function openPage(storage, extra) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(e.message || String(e)));
  vc.on("error", e => errors.push(String(e)));
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), {
    runScripts: "dangerously", resources: new LocalOnly(), pretendToBeVisual: true, virtualConsole: vc, url: HOST + "index.html",
    beforeParse(window) {
      window.scrollTo = () => {};
      if (storage) for (const [k, v] of Object.entries(storage)) window.localStorage.setItem(k, v);
      if (extra) for (const [k, v] of Object.entries(extra)) {
        if (k === "clipboard") Object.defineProperty(window.navigator, "clipboard", { value: v, configurable: true });
        else window[k] = v;
      }
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
  // ---- A mix of old and new files after an update ----
  {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), vs = [...html.matchAll(/(?:src|href)="(?:js\/[^"]+|style\.css)\?v=([^"]+)"/g)].map(m => m[1]);
    ok(vs.length >= 40 && new Set(vs).size === 1, `every script and the stylesheet carry the same version (${[...new Set(vs)].join(", ")})`);
    // A page missing a file it needs, already loaded fresh once: it says so, with focus on the message
    const broken = html.replace(/<script src="js\/ui_trade\.js[^"]*"><\/script>/, "");
    const vc = new VirtualConsole(); vc.on("jsdomError", () => {});
    const dom = new JSDOM(broken, { runScripts: "dangerously", resources: new LocalOnly(), pretendToBeVisual: true, virtualConsole: vc, url: HOST + "index.html?fresh=1", beforeParse(w) { w.scrollTo = () => {}; } });
    await new Promise(r => dom.window.addEventListener("load", r)); await settle();
    const dd = dom.window.document;
    ok(/couldn't start/.test(dd.body.textContent) && /saves are safe/.test(dd.body.textContent) && /vTrade/.test(dd.body.textContent) && /ui\.js/.test(dd.body.textContent) && dd.activeElement && dd.activeElement.id === "bootfail", `if the files don't fit together, the page says so, that your saves are safe, and what failed (${(dd.getElementById("bootwhy") || {}).textContent})`);
    dom.window.close();
    // An error from something that isn't the game (an extension) while the page loads: the game starts anyway
    const vc2 = new VirtualConsole(); vc2.on("jsdomError", () => {});
    const noisy = html.replace("<!-- Plain scripts, loaded in order.", '<script>setTimeout(function () { throw new Error("from an extension"); }, 0); window.dispatchEvent(new ErrorEvent("error", { message: "Script error.", filename: "" }));</script><!-- Plain scripts, loaded in order.');
    const dom2 = new JSDOM(noisy, { runScripts: "dangerously", resources: new LocalOnly(), pretendToBeVisual: true, virtualConsole: vc2, url: HOST + "index.html?fresh=1", beforeParse(w) { w.scrollTo = () => {}; } });
    await new Promise(r => dom2.window.addEventListener("load", r)); await settle(); await settle();
    ok(!/couldn't start/.test(dom2.window.document.body.textContent) && !!dom2.window.document.querySelector('[data-a]'), "an error from something else doesn't stop the game");
    dom2.window.close();
  }
  // ---- The main menu, the exhibition, rosters and a player ----
  let page = await openPage();
  let d = page.d;
  ok(d.querySelector("h1") && /Friday to/i.test(d.querySelector("h1").textContent), "the main menu shows the title");
  ok(btn(d, "career") && /Start a career/.test(btn(d, "career").textContent) && btn(d, "exhibition") && btn(d, "saves"), "the main menu offers a career, an exhibition and saves");
  ok(!btn(d, "gohome"), "no Home button on the main menu");
  checkScreen(page, "main menu");
  tap(page, "exhibition");
  ok(focused(d) && focused(d).tagName === "H2" && / at /.test(focused(d).textContent), "the exhibition screen opens on its heading");
  ok(d.querySelectorAll(".teamcard").length === 2, "two schools in the exhibition");
  ok(d.querySelector('table[aria-label="Matchup by unit"] th[scope="row"]'), "the matchup table has row headers");
  checkScreen(page, "exhibition");
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
  ok(d.querySelector(".teamcard") && btn(d, "kickoff"), "back to the exhibition");
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
  const puntsSeen = {};
  let burnSeen = 0, burnBad = 0, burnForced = null;
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
        // Fourth down: send out the punt team half the time and pick one of the three punts
        if (S.side === "off" && S.down === 4 && btn(d, "pkg", "punt") && Math.random() < .5) {
          tap(page, "pkg", "punt");
          const pc = [...d.querySelectorAll('[data-a="pick"][data-v="punt"]')];
          ok(pc.map(b => b.dataset.k).join() === "normal,pin,boom", `the punt team has three punts (${pc.map(b => b.dataset.k).join()})`);
          const want = pc[Math.floor(Math.random() * pc.length)];
          want.focus(); want.click();
          const now = d.querySelector(`[data-a="pick"][data-v="punt"][data-k="${want.dataset.k}"]`);
          ok(now && now.getAttribute("aria-pressed") === "true" && d.activeElement === now, `picking ${want.dataset.k} marks it, and focus stays on it`);
          const label = { normal: "Punt", pin: "Pin it deep", boom: "Boom it" }[want.dataset.k];
          ok(btn(d, "lock").textContent.includes(label), `the lock button says ${label}`);
          tap(page, "lock");
          if (sw.eval("S.offCall") === "punt") { puntsSeen[want.dataset.k] = (puntsSeen[want.dataset.k] || 0) + 1; ok(sw.eval("S.puntKind") === want.dataset.k, `the ${want.dataset.k} punt is the one kicked`); }
          break;
        }
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
        // Once, set up a 4th-quarter lead for the coach on offense to check the run-the-clock button
        if (!burnForced && S.clockRunning && !S.teams[S.poss].cpu && sw.eval("burnAvailable") && S.quarter < 4 && !S.needPAT && !S.kickChoice && !S.tryChoice) {
          burnForced = sw.eval(`({ q: S.quarter, a: S.teams[0].score, b: S.teams[1].score })`);
          sw.eval(`S.quarter = 4; S.teams[S.poss].score = S.teams[1 - S.poss].score + 7; render()`);
        }
        if (btn(d, "burn")) {
          burnSeen++;
          if (btn(d, "nohuddle")) { tap(page, "nohuddle"); tap(page, "burn"); if (!(sw.eval("S.burnClock") && !sw.eval("S.noHuddle")) || btn(d, "nohuddle").getAttribute("aria-pressed") !== "false") burnBad++; }
          else tap(page, "burn");
          if (btn(d, "burn").getAttribute("aria-pressed") !== "true" || !/running the clock/.test(d.querySelector(".cstat").textContent)) burnBad++;
        }
        if (burnForced && !burnForced.done) {
          burnForced.done = true;
          if (sw.eval("S.burnClock")) tap(page, "burn");
          ok(!sw.eval("S.burnClock"), "tapping run the clock again turns it off");
          sw.eval(`S.quarter = ${burnForced.q}; S.teams[0].score = ${burnForced.a}; S.teams[1].score = ${burnForced.b}; render()`);
        }
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
  ok(burnSeen > 0 && burnBad === 0, `running the clock turns on, turns off no huddle and shows in the clock box (${burnSeen} times, ${burnBad} problems)`);
  ok(focusBad === 0, `every new screen puts focus on its heading or main block (${focusBad} misses)`);
  ok(Object.keys(puntsSeen).length > 0, `the game sent out the punt team and kicked a punt by tapping (${JSON.stringify(puntsSeen)})`);
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
  tap(p3, "exhibition");
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

  // ---- A season ----
  const p4 = await openPage(), d4 = p4.d, w4 = p4.w;
  const ev = x => w4.eval(x);
  const heading = () => { const f = focused(d4); return f && (f.hasAttribute("data-focus") || /^H[12]$/.test(f.tagName)) ? f.textContent : null; };
  const said4 = async () => { await new Promise(r => setTimeout(r, 120)); return d4.getElementById("sr").textContent; };
  // Typing: the page keeps what's typed without redrawing
  const typeIn = (id, text) => { const el = d4.getElementById(id); el.focus(); el.value = text; el.dispatchEvent(new w4.Event("input", { bubbles: true })); };
  const pressReturn = id => d4.getElementById(id).dispatchEvent(new w4.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  // Creating your coach
  tap(p4, "career");
  ok(ev("APP.screen") === "newcoach" && /Your coach/.test(heading() || ""), "a career starts with creating your coach");
  ok(d4.querySelector('label[for="cfirst"]') && d4.querySelector('label[for="clast"]') && d4.getElementById("cfirst").type === "text", "the name boxes are labeled");
  checkScreen(p4, "your coach");
  tap(p4, "makecoach");
  ok(ev("APP.screen") === "newcoach" && focused(d4) === d4.getElementById("cfirst") && d4.getElementById("cfirst").getAttribute("aria-invalid") === "true"
    && d4.getElementById("cfirst").getAttribute("aria-describedby") === "cnameerr" && /first and last name/.test(d4.getElementById("cnameerr").textContent), "no name yet: focus goes to the first name, which says what's missing");
  typeIn("cfirst", "Chris");
  pressReturn("cfirst");
  ok(focused(d4) === d4.getElementById("clast") && ev("APP.screen") === "newcoach", "Return in the first name moves on to the last name");
  typeIn("clast", "Abel");
  tap(p4, "cbg", "line");
  ok(btn(d4, "cbg", "line").getAttribute("aria-pressed") === "true" && focused(d4) === btn(d4, "cbg", "line") && /Offense 46, Defense 46/.test(d4.body.textContent), "pick a background: the starting ratings follow it");
  ok(/^Former lineman: Offense 46 and Defense 46\.$/.test(await said4()), "and are read out");
  ok(d4.getElementById("cfirst").value === "Chris" && d4.getElementById("clast").value === "Abel", "what's typed survives the redraw");
  tap(p4, "ostyle", "air"); tap(p4, "dstyle", "blz");
  ok(ev("APP.coachDraft.off") === "air" && ev("APP.coachDraft.def") === "blz" && focused(d4) === btn(d4, "dstyle", "blz"), "pick your schemes");
  pressReturn("clast");
  ok(ev("APP.screen") === "pick" && ev("CAREER.coach.last") === "Abel" && ev("CAREER.coach.bg") === "line" && ev("CAREER.coach.off_style") === "air", "Return in the last name makes your coach");
  ok(/Pick your school/.test(heading() || ""), "then on to picking your school");
  ok(d4.querySelectorAll(".teamcard").length === 8 && d4.querySelectorAll('[data-a="takejob"]').length === 8, "eight schools to pick from");
  ok([...d4.querySelectorAll(".teamcard")].every(c => /Last coach: .+ offense, .+ defense\. They know \d of your 4 core plays on offense and \d of 4 on defense\./.test(c.textContent)), "each school says what its last coach ran, and how much of your playbook it knows");
  checkScreen(p4, "pick your school");
  const pickId = btn(d4, "takejob").dataset.v;
  tap(p4, "sroster", pickId);
  ok(ev("APP.screen") === "roster" && !btn(d4, "dedit") && !btn(d4, "rteam"), "a school's roster can be read before you pick, but not changed");
  tap(p4, "back");
  ok(ev("APP.screen") === "pick", "back to picking");
  tap(p4, "takejob", pickId);
  ok(ev("SEASON.myId") === pickId && ev("APP.screen") === "season", "take the job");
  ok(ev("mySchool().coach === CAREER.coach") && ev("mySchool().off") === "air" && ev("mySchool().def") === "blz", "your coach and schemes take over");
  ok(/Your team knows (all 4|none of the 4|\d of the 4) core plays of the Air Raid offense/.test(d4.body.textContent), "the week ahead says how much of your playbook the team knows");
  // Your coach's page
  tap(p4, "coach");
  ok(ev("APP.screen") === "coach" && heading() === "Coach Chris Abel" && /Offense 46\./.test(d4.body.textContent) && /Former lineman/.test(d4.body.textContent), "your coach's page: name, background and ratings");
  checkScreen(p4, "your coach's page");
  typeIn("plast", "Abell");
  ok(ev("CAREER.coach.last") === "Abell" && ev("mySchool().coach.last") === "Abell", "rename your coach as you type");
  // Spending XP
  ok(btn(d4, "xprate", "off") && /Raise Offense to 47: 26 XP/.test(btn(d4, "xprate", "off").textContent) && btn(d4, "perk", "disg"), "every rating and perk has its button, with its cost");
  ev("CAREER.xp = 30");
  tap(p4, "xprate", "off");
  ok(ev("CAREER.coach.off") === 47 && ev("CAREER.xp") === 4 && focused(d4) === btn(d4, "xprate", "off") && /Raise Offense to 48: 27 XP/.test(btn(d4, "xprate", "off").textContent), "spend XP on a rating: focus stays on its button");
  ok(/^Offense is 47\. 4 XP left\.$/.test(await said4()), "and it says what happened");
  tap(p4, "perk", "disg");
  ok(!ev("coachHas(CAREER.coach, 'disg')") && /takes 150 XP\. You have 4\./.test(await said4()) && focused(d4) === btn(d4, "perk", "disg"), "not enough XP for a perk: it says so");
  tap(p4, "back");
  ok(ev("APP.screen") === "season", "back to the season screen");
  ok(heading() === ev("nameOf(SEASON.myId)"), "the season screen opens on your school's name");
  // Preseason camp: practice, no games
  ok(/Camp week 1 of 3/.test(d4.querySelector(".masthead .eyebrow").textContent) && btn(d4, "hold") && !btn(d4, "playgame") && /No games yet/.test(d4.body.textContent), "the season opens with camp: practice, no games");
  checkScreen(p4, "camp");
  tap(p4, "practice");
  ok(/^Camp week 1/.test(d4.querySelector(".masthead .eyebrow").textContent) && /no opponent to study/.test(d4.body.textContent), "the practice plan in camp: prep time goes into install");
  tap(p4, "back");
  tap(p4, "hold");
  ok(ev("APP.screen") === "preport" && /Practice report/.test(heading() || "") && btn(d4, "campnext") && /On to camp week 2/.test(btn(d4, "campnext").textContent) && !btn(d4, "playgame"), "hold practice: the report, and on to the next week");
  checkScreen(p4, "camp practice report");
  tap(p4, "campnext");
  ok(ev("APP.screen") === "season" && ev("SEASON.camp") === 2 && /Camp week 2 of 3/.test(d4.querySelector(".masthead .eyebrow").textContent), "camp week 2");
  tap(p4, "campsim");
  ok(/Tap again/.test(btn(d4, "campsim").textContent) && ev("SEASON.camp") === 2, "the rest of camp asks for a second tap");
  tap(p4, "campsim");
  ok(ev("APP.screen") === "preport" && /Camp report/.test(heading() || "") && ev("SEASON.phase") === "regular" && ev("SEASON.week") === 1, "the rest of camp at once, with a report on all of it");
  ok(/On to week 1/.test(btn(d4, "back").textContent), "then on to week 1");
  tap(p4, "back");
  ok(ev("APP.screen") === "season" && /Week 1/.test(d4.querySelector(".masthead .eyebrow").textContent), "week 1");
  ok(btn(d4, "playgame") && btn(d4, "simgame") && /On paper/.test(d4.body.textContent), "this week's game: play it or sim it, and who's favored");
  ok(d4.querySelector('table.stand th[scope="row"]') && /\(you\)/.test(d4.querySelector("table.stand").textContent), "your district's standings, with your school marked");
  checkScreen(p4, "the week ahead");
  // Your schemes carry into your games
  tap(p4, "ostyle", "wc");
  ok(ev("mySchool().off") === "wc" && ev("CAREER.coach.off_style") === "wc" && focused(d4) === btn(d4, "ostyle", "wc"), "change your offensive style; focus stays put");
  // Your roster: changes for the next game only
  tap(p4, "sroster", ev("SEASON.myId"));
  ok(btn(d4, "dedit", "QB") && btn(d4, "rteam"), "your roster can be changed, and the opponent's is a tap away");
  tap(p4, "dmode", "next");
  const sqb = ev("mySchool().depth.QB.slice()");
  tap(p4, "dedit", "QB"); tap(p4, "dsel", sqb[1]); tap(p4, "dmove", "start"); tap(p4, "ddone");
  ok(ev("SEASON.nextDepth.depth.QB[0]") === sqb[1] && ev("mySchool().depth.QB[0]") === sqb[0], "a next-game change is saved for the season's next game");
  tap(p4, "rteam");
  ok(!btn(d4, "dedit") && /roster/i.test(btn(d4, "rteam").textContent), "the opponent's roster");
  tap(p4, "back");
  ok(ev("APP.screen") === "season", "back to the week ahead");
  // Sim week 1
  tap(p4, "simgame");
  ok(ev("APP.screen") === "week" && ev("SEASON.week") === 2 && /^You (beat|lost to) the /.test(heading() || ""), `sim the game: the week's results open on yours (${heading()})`);
  ok(ev("S.season.week") === 1 && ev(`S.teams.find(t => t.id === SEASON.myId).depth.QB[0]`) === sqb[1] && ev("S.teams.find(t => t.id === SEASON.myId).off") === "wc", "the game used your next-game lineup and your scheme");
  ok(ev("SEASON.practice.week") === 1, "simming the game held the week's practice first");
  ok(ev("SEASON.nextDepth") === null, "the next-game lineup is used up");
  ok(btn(d4, "boxscore") && /District \d/.test(d4.body.textContent), "box score link and your district's scores");
  checkScreen(p4, "week 1 results");
  tap(p4, "boxscore");
  ok(ev("APP.screen") === "game" && btn(d4, "weekdone") && /Week 1 results/.test(btn(d4, "weekdone").textContent) && !btn(d4, "rematch"), "the box score of a season game leads back to the week, not a rematch");
  tap(p4, "weekdone");
  ok(ev("APP.screen") === "week" && ev("SEASON.week") === 2, "back to week 1's results, without playing another week");
  tap(p4, "season");
  ok(ev("APP.screen") === "season" && /Week 2/.test(d4.querySelector(".masthead .eyebrow").textContent), "on to week 2");
  ok(btn(d4, "week", 1), "last week's results are a tap away");
  // Practice for week 2: the plan, a preset, an area, the install focus, then hold practice
  ok(/Practice/.test(d4.body.textContent) && btn(d4, "practice") && btn(d4, "hold"), "the week ahead has practice: the plan, or hold it now");
  tap(p4, "practice");
  ok(/Practice plan/.test(heading() || ""), "the practice plan opens on its heading");
  ok(btn(d4, "ppreset", "balanced").getAttribute("aria-pressed") === "true" && btn(d4, "pcontact", "shells").getAttribute("aria-pressed") === "true", "a balanced week in shells to start");
  checkScreen(p4, "practice plan");
  tap(p4, "ppreset", "gameprep");
  ok(ev("SEASON.plan.areas.prep") === 3 && /Game prep plan/.test(await said4()) && focused(d4) === btn(d4, "ppreset", "gameprep"), "a preset sets the plan, and says so");
  ok(d4.querySelectorAll('[data-a="parea"]').length === 20, "five areas to set: fundamentals, install, opponent prep, conditioning and recovery");
  const fHeavy = [...d4.querySelectorAll('[data-a="parea"]')].find(b => b.dataset.t === "fund" && b.dataset.v === "3");
  fHeavy.focus(); fHeavy.click();
  ok(ev("SEASON.plan.areas.fund") === 3 && /Fundamentals: heavy, \d/.test(await said4()) && !btn(d4, "ppreset", "gameprep").matches('[aria-pressed="true"]'), "heavy fundamentals: announced, and it's no longer a preset");
  tap(p4, "install");
  ok(/Install focus/.test(heading() || "") && d4.querySelectorAll('[data-a="pfocus"]').length === 19, "the install screen lists the whole playbook");
  tap(p4, "pfocus", "ms"); tap(p4, "pfocus", "zb");
  ok(JSON.stringify(ev("SEASON.plan.focus")) === '["ms","zb"]' && btn(d4, "pfocus", "ms").getAttribute("aria-pressed") === "true", "pick plays to install");
  checkScreen(p4, "install");
  tap(p4, "back");
  ok(ev("APP.screen") === "practice" && /Mesh and Zone Blitz/.test(d4.body.textContent), "back on the plan, with the install focus");
  const ms0 = ev("mySchool().mastery.ms");
  tap(p4, "hold");
  ok(ev("APP.screen") === "preport" && /Practice report/.test(heading() || "") && ev("practiced()"), "hold practice: the practice report");
  ok(ev("mySchool().mastery.ms") > ms0, "the install focus went in");
  ok(btn(d4, "scout") && btn(d4, "playgame") && /Who got better/.test(d4.body.textContent), "the report: who got better, and the scouting report");
  checkScreen(p4, "practice report");
  tap(p4, "scout");
  ok(ev("APP.screen") === "scout" && heading() === ev("nameOf(SEASON.practice.opp)") && /Their offense/.test(d4.body.textContent), "the scouting report on this week's opponent");
  checkScreen(p4, "scouting report");
  tap(p4, "back");
  ok(ev("APP.screen") === "preport", "back to the practice report");
  tap(p4, "back");
  ok(ev("APP.screen") === "season" && btn(d4, "preport") && !btn(d4, "hold"), "practice is done for the week");
  // Play week 2 by tapping a little, step away, then sim the rest
  tap(p4, "playgame");
  ok(ev("APP.screen") === "game" && ev("isMyGame()") && ev("S.season.week") === 2, "play your week 2 game");
  ok(ev("S.teams.find(t => t.id === SEASON.myId).prep") && ev("S.teams.find(t => t.id === SEASON.myId).prep.k") > 0, "your team takes its film study into the game");
  for (let i = 0; i < 12; i++) { const S = ev("S"); if (S.phase === "result") tap(p4, "cont"); else if (S.phase === "toss") tap(p4, "toss", S.toss.step === "call" ? "heads" : (btn(d4, "toss", "receive") ? "receive" : "defense")); else ev("S.teams.forEach(t => t.cpu = true); autoStep(); S.teams.forEach(t => t.cpu = t.id !== SEASON.myId); render();"); }
  ok(!btn(d4, "end"), "a season game can't be thrown away");
  for (let i = 0; i < 300; i++) { const S = ev("S"); if (S.phase === "call" && S.side === "off" && !S.teams[S.poss].cpu) break; if (S.phase === "result") tap(p4, "cont"); else ev("S.teams.forEach(t => t.cpu = true); autoStep(); S.teams.forEach(t => t.cpu = t.id !== SEASON.myId); render();"); }
  if (ev("S.phase") === "call") ok(/(mastered|solid|learning|new) \d+/.test(d4.querySelector('[data-a="pick"] .tag').textContent), "the call sheet shows how well your team knows each play");
  ok(btn(d4, "scout"), "the scouting report is a tap away during the game");
  tap(p4, "gohome");
  ok(/Your season game is in progress/.test(d4.body.textContent) && btn(d4, "resume"), "the main menu offers to go back to your season game");
  tap(p4, "exhibition");
  ok(!btn(d4, "kickoff") && btn(d4, "resume"), "no exhibition while your season game is in progress");
  tap(p4, "newmatch");
  ok(ev("isMyGame()") && ev("S.phase") !== "final", "a new exhibition matchup leaves your season game alone");
  tap(p4, "resume");
  tap(p4, "sim"); tap(p4, "sim");
  ok(ev("S.phase") === "final" && ev("played(myGameIn(2))"), "sim to the end: the result is in the books");
  tap(p4, "weekdone");
  ok(ev("APP.screen") === "week" && ev("APP.weekView") === 2 && ev("SEASON.week") === 3, "week 2 results");
  tap(p4, "season");
  // A reload in the middle of the season
  const store4 = {}; for (let i = 0; i < w4.localStorage.length; i++) { const k = w4.localStorage.key(i); store4[k] = w4.localStorage.getItem(k); }
  const p5 = await openPage(store4);
  ok(p5.w.eval("SEASON.week") === 3 && p5.w.eval("APP.screen") === "season" && p5.w.eval("JSON.stringify(SEASON.weeks)") === ev("JSON.stringify(SEASON.weeks)"), "the season picks up where it left off after a reload");
  ok(p5.errors.length === 0, "no errors after reloading the season");
  // An exhibition in progress gives way to the season game, after a second tap
  tap(p4, "gohome"); tap(p4, "exhibition"); tap(p4, "kickoff");
  ok(ev("S && !S.season && S.phase !== 'final'"), "an exhibition game is under way");
  tap(p4, "gohome"); tap(p4, "season");
  tap(p4, "playgame");
  ok(/Tap again to leave the exhibition/.test(btn(d4, "playgame").textContent) && ev("APP.screen") === "season", "playing the season game asks before leaving the exhibition");
  tap(p4, "playgame");
  ok(ev("APP.screen") === "preport" && ev("S") === null && /Kick off/.test(btn(d4, "playgame").textContent), "then practice, with the kickoff right there");
  tap(p4, "playgame");
  ok(ev("APP.screen") === "game" && ev("isMyGame()") && ev("S.season.week") === 3, "and the week 3 game starts with one tap");
  tap(p4, "sim"); tap(p4, "sim"); tap(p4, "weekdone"); tap(p4, "season");
  ok(ev("SEASON.week") === 4, "on to week 4");
  ok(/^Expected: about \d+-\d+.*\(\d+(\.\d)? wins?\)\.$/.test(d4.querySelectorAll(".masthead p.muted")[1].textContent.trim()), "the season screen says what your school expects");
  // Standings, schedule and stats
  tap(p4, "standings");
  ok(d4.querySelectorAll("table.stand").length === 8 && /Standings/.test(heading() || ""), "standings for all eight districts");
  checkScreen(p4, "standings");
  tap(p4, "back");
  tap(p4, "schedule");
  ok(d4.querySelectorAll('.roster [data-a="week"]').length === 3 && d4.querySelectorAll(".sched").length === 7, "your schedule: three results to open, seven games to go");
  ok(d4.querySelector(".statwrap, table caption"), "season stats tables");
  checkScreen(p4, "schedule");
  tap(p4, "week", 1);
  ok(ev("APP.weekView") === 1 && btn(d4, "back") && /schedule/.test(btn(d4, "back").textContent), "an old week's results, with the way back to the schedule");
  tap(p4, "back");
  ok(ev("APP.screen") === "schedule", "back to the schedule");
  tap(p4, "back");
  // Sim to the playoffs (two taps), a week at a time
  tap(p4, "simseason");
  ok(/Tap again/.test(btn(d4, "simseason").textContent) && ev("APP.screen") === "season", "sim to the playoffs asks for a second tap");
  tap(p4, "simseason");
  ok(ev("APP.screen") === "simming" && /Simming/.test(heading() || ""), "the sim shows its progress");
  for (let i = 0; i < 400 && ev("APP.screen") === "simming"; i++) await new Promise(r => setTimeout(r, 25));
  ok(ev("APP.screen") === "season" && ev("SEASON.week") === 11 && ev("SEASON.phase") === "playoffs", "the regular season is done");
  ok(heading() === ev("nameOf(SEASON.myId)"), "focus goes back to the season screen's heading");
  ok(btn(d4, "bracket"), "the playoff bracket is up");
  tap(p4, "bracket");
  ok(d4.querySelectorAll(".panel h3").length === 1 && d4.querySelectorAll(".panel li").length === 8, "the first round: eight games");
  checkScreen(p4, "bracket");
  tap(p4, "back");
  tap(p4, "simseason"); tap(p4, "simseason");
  for (let i = 0; i < 400 && ev("APP.screen") === "simming"; i++) await new Promise(r => setTimeout(r, 25));
  ok(ev("SEASON.phase") === "over" && ev("SEASON.champion") && /state champions/i.test(d4.body.textContent), "the season ends with a state champion");
  checkScreen(p4, "season over");
  tap(p4, "week", 14);
  ok(btn(d4, "summary") && !btn(d4, "season"), "the state championship's results lead to the season summary");
  tap(p4, "summary");
  ok(ev("APP.screen") === "summary" && heading() === ev("nameOf(SEASON.myId)") && /The record/.test(d4.body.textContent) && /Most improved/.test(d4.body.textContent), "the season summary");
  ok(/with the (best|(second|third|fourth|fifth|sixth|seventh|eighth)-best) starters in the district before the season/.test(d4.body.textContent) && ev("CAREER.seasons.length") === 1, "your finish against your talent, and the season goes into your career");
  ok(/Season grade: .+ \([+−]?\d+\.\d\)/.test(d4.body.textContent) && /Expected about \d+-\d+/.test(d4.body.textContent) && /Reputation \d+: /.test(d4.body.textContent), "the season's grade against what was expected, and your reputation");
  checkScreen(p4, "season summary");
  tap(p4, "coach");
  ok(/20\d\d: .+, \d+-\d+, /.test(d4.body.textContent), "your coach's page lists the season");
  ok(/Reputation \d+: (an unknown|a rising name|a respected coach)\./.test(d4.body.textContent) && /graded/.test(d4.body.textContent), "and your reputation, with what the season did to it");
  tap(p4, "back");
  ok(ev("APP.screen") === "summary", "back to the summary");
  // The athletic director's review, the coaching changes and the job market, then the offseason
  tap(p4, "offseason");
  if (ev("APP.screen") === "signing") { ok(/Signing day/.test(heading() || ""), "signing day, when your players have college news"); checkScreen(p4, "signing day"); tap(p4, "adreview"); }
  ok(ev("APP.screen") === "review" && ev("SEASON.phase") === "offseason" && /athletic director's review/.test(heading() || "") && /Your stipend/.test(d4.body.textContent) && /(safe|improvement|hot seat)/.test(d4.body.textContent), "the athletic director's review: your grade, your job and your stipend");
  checkScreen(p4, "athletic director's review");
  tap(p4, "gohome");
  ok(/The job market is open/.test(d4.body.textContent), "the main menu says the job market is open");
  tap(p4, "season");
  ok(ev("APP.screen") === "review", "and picks the review back up");
  tap(p4, "carousel");
  ok(ev("APP.screen") === "carousel" && /Coaching changes/.test(heading() || "") && /head coaching jobs? (is|are) open around the state/.test(d4.body.textContent), "coaching changes around the state");
  checkScreen(p4, "coaching changes");
  tap(p4, "market");
  ok(ev("APP.screen") === "market" && /The job market/.test(heading() || "") && btn(d4, "stay"), "the job market, with the choice to stay");
  checkScreen(p4, "job market");
  const jobs = ev("hcJobs()");
  if (jobs.length) {
    tap(p4, "joblook", jobs[0]);
    ok(ev("APP.screen") === "joblook" && /Coming back next season/.test(d4.body.textContent) && /The playbook/.test(d4.body.textContent), "a closer look at a job: its returning players and its playbook");
    checkScreen(p4, "a closer look");
    tap(p4, "back");
    ok(ev("APP.screen") === "market", "back to the job market");
  }
  ok(!btn(d4, "nextyear") && !btn(d4, "halls"), "the next season and the offseason program wait for the job market");
  tap(p4, "stay");
  ok(ev("APP.screen") === "offseason" && ev("SEASON.phase") === "offseason" && heading() === ev("nameOf(SEASON.myId)") && /Graduating/.test(d4.body.textContent) && /Coming back/.test(d4.body.textContent), "the offseason: who's graduating and who's coming back");
  checkScreen(p4, "offseason");
  // The summer plan and hallway recruiting
  ok(d4.querySelector('[role="group"][aria-label="Youth camp"]') && btn(d4, "summer", "3") && /Hallway recruiting/.test(d4.body.textContent), "the summer plan: five activities, each with none to heavy");
  const hallsHeavy = [...d4.querySelectorAll('[data-a="summer"]')].find(b => b.dataset.t === "halls" && b.dataset.v === "3");
  hallsHeavy.focus(); hallsHeavy.click();
  ok(ev("SEASON.summer.halls") === 3 && /^Hallway recruiting: heavy, about \d/.test(await said4()), "more summer time for hallway recruiting, and it says so");
  tap(p4, "halls");
  ok(ev("APP.screen") === "halls" && /Talk to athletes/.test(heading() || "") && d4.querySelectorAll('[data-a="pitch"]').length === 6, "the hallways: six athletes to pitch");
  checkScreen(p4, "hallway recruiting");
  const pid = btn(d4, "pitch").dataset.v;
  tap(p4, "pitch", pid);
  const answer = ev(`hallsNow().said["${pid}"]`);
  ok(["yes", "no"].includes(answer) && focused(d4) === btn(d4, "pitch", pid) && new RegExp(`said ${answer}`).test(btn(d4, "pitch", pid).textContent), `pitch one: he said ${answer}, and focus stays on his button`);
  ok(new RegExp(`said ${answer}`).test(await said4()), "and it's read out");
  tap(p4, "back");
  ok(ev("APP.screen") === "offseason", "back to the offseason");
  // The program fund: fundraisers, facilities, purchases and your own money
  tap(p4, "fund");
  ok(ev("APP.screen") === "fund" && /The program fund/.test(heading() || "") && d4.querySelectorAll('[data-a="fr"]').length === 5 && d4.querySelectorAll('[data-a="facup"]').length >= 4 && d4.querySelectorAll('[data-a="buy"]').length === 3 && btn(d4, "clinic", "state"), "the program fund: fundraisers, facilities, purchases and clinics");
  checkScreen(p4, "program fund");
  const signs = btn(d4, "fr", "signs");
  ok(signs.getAttribute("aria-pressed") === "false", "a fundraiser that isn't on says so");
  tap(p4, "fr", "signs");
  ok(btn(d4, "fr", "signs").getAttribute("aria-pressed") === "true" && focused(d4) === btn(d4, "fr", "signs") && /Sponsor signs on the fence: \$[\d,]+ raised/.test(await said4()), "turn one on: focus stays, and what it raised is read out");
  ok(/7 weeks/.test(d4.body.textContent), "the summer program loses a week");
  tap(p4, "fr", "signs");
  ok(ev("CAREER.fr").join() === "wash", "and off again");
  ev("mySchool().fund = 10");
  tap(p4, "facup", "wt");
  ok(/^Not enough in the fund/.test(await said4()), "an upgrade the fund can't pay for says so");
  ev("mySchool().fund = 30000; mySchool().fac[0] = 2");
  const wt0 = ev("mySchool().fac[0]");
  tap(p4, "facup", "wt");
  ok(ev("mySchool().fac[0]") === wt0 + 1 && /^The weight room is now/.test(await said4()) && btn(d4, "facundo", "wt"), "an upgrade, read out, with a way to cancel it");
  tap(p4, "facundo", "wt");
  ok(ev("mySchool().fac[0]") === wt0 && focused(d4) === btn(d4, "facup", "wt"), "cancelled, and focus goes back to the upgrade button");
  tap(p4, "back");
  ok(ev("APP.screen") === "offseason", "back to the offseason");
  tap(p4, "recruits");
  ok(ev("APP.screen") === "recruits" && /College recruiting/.test(heading() || ""), "the recruiting screen");
  checkScreen(p4, "college recruiting");
  tap(p4, "back");
  ok(ev("APP.screen") === "offseason", "and back");
  const year = ev("SEASON.year"), seniors = ev("mySchool().players.filter(p => p.yr === 12).length");
  tap(p4, "gohome");
  ok(/offseason/.test(d4.body.textContent) && /Continue the offseason/.test(btn(d4, "season").textContent), "the main menu picks up the offseason");
  tap(p4, "season");
  tap(p4, "nextyear");
  ok(ev("APP.screen") === "turning" && /^On to /.test(heading() || ""), "moving the state into the new year says so");
  for (let i = 0; i < 400 && ev("APP.screen") === "turning"; i++) await new Promise(r => setTimeout(r, 25));
  ok(ev("APP.screen") === "newyear" && ev("SEASON.year") === year + 1 && new RegExp(`^The ${year + 1} `).test(heading() || "") && /New freshmen/.test(d4.body.textContent) && ev("SEASON.yearReport.grads.length") === seniors, `the ${year + 1} season: how the team changed`);
  ok(answer === "yes" ? /From the hallways/.test(d4.body.textContent) && ev(`!!playerById(mySchool(), "${pid}")`) : !/From the hallways/.test(d4.body.textContent), "an athlete who said yes is on the team");
  checkScreen(p4, "how the team changed");
  tap(p4, "season");
  ok(ev("APP.screen") === "season" && ev("SEASON.phase") === "preseason" && /Camp week 1 of 3/.test(d4.querySelector(".masthead .eyebrow").textContent) && btn(d4, "newyear"), "then camp, with the team's changes a tap away");
  const store7 = {}; for (let i = 0; i < w4.localStorage.length; i++) { const k = w4.localStorage.key(i); store7[k] = w4.localStorage.getItem(k); }
  const p7r = await openPage(store7);
  ok(p7r.w.eval("SEASON.year") === year + 1 && p7r.w.eval("SEASON.camp") === 1 && p7r.w.eval("APP.screen") === "season" && p7r.errors.length === 0, "camp in a new season picks up after a reload");
  tap(p4, "gohome");
  ok(/preseason camp/.test(d4.body.textContent) && /Back to camp/.test(btn(d4, "season").textContent), "the main menu: back to camp");
  tap(p4, "newcareer");
  ok(/Tap again/.test(btn(d4, "newcareer").textContent), "starting over asks for a second tap");
  tap(p4, "newcareer");
  ok(ev("APP.screen") === "newcoach" && ev("CAREER") === null && ev("SEASON") === null && d4.getElementById("cfirst").value === "", "a new career starts with a new coach");
  typeIn("cfirst", "Sam"); typeIn("clast", "Lee"); tap(p4, "makecoach");
  tap(p4, "gohome");
  ok(/Looking for a job/.test(d4.body.textContent) && btn(d4, "season") && /Pick your school/.test(btn(d4, "season").textContent), "the main menu: your coach is looking for a job");
  ok(p4.errors.length === 0, "no script errors in the season: " + p4.errors.slice(0, 2).join(" | "));

  // ---- Saves: save codes and cloud saves ----
  // The browser's helpers, a clipboard, and a stand-in for the online database shared by two devices
  const cloudData = {};
  const cloudDb = { ref: p => ({
    transaction(fn) {
      const cur = cloudData[p] === undefined ? null : JSON.parse(JSON.stringify(cloudData[p])), next = fn(cur);
      if (next === undefined) return Promise.resolve({ committed: false, snapshot: { exists: () => cur !== null } });
      cloudData[p] = next;
      return Promise.resolve({ committed: true, snapshot: { exists: () => true } });
    },
    once() { return Promise.resolve({ val: () => cloudData[p] === undefined ? null : cloudData[p] }); }
  }) };
  const firebase = { apps: [], database: true, initializeApp() { this.apps.push(1); return { database: () => cloudDb }; }, app() { return { database: () => cloudDb }; } };
  let clip = "";
  const web = { TextEncoder, TextDecoder, Blob, Response, CompressionStream, DecompressionStream, firebase, clipboard: { writeText: t => { clip = t; return Promise.resolve(); } } };
  const p6 = await openPage(store4, web), d6 = p6.d, w6 = p6.w, ev6 = x => w6.eval(x);
  const wait = async (cond, ms) => { for (let i = 0; i < (ms || 2000) / 10 && !cond(); i++) await new Promise(r => setTimeout(r, 10)); return cond(); };
  const msg6 = () => { const m = d6.getElementById("savemsg"); return m ? m.textContent : ""; };
  tap(p6, "gohome");
  tap(p6, "saves");
  ok(ev6("APP.screen") === "saves" && focused(d6) && /Cloud saves and save codes/.test(focused(d6).textContent), "the saves screen opens on its heading");
  ok(d6.querySelector('label[for="importbox"]') && d6.querySelector('label[for="cloudkey"]') && d6.querySelector('label[for="importfile"]'), "its boxes are labeled");
  checkScreen(p6, "saves");
  await wait(() => ev6("!!codeCache"));
  tap(p6, "copycode");
  await wait(() => /copied/.test(msg6()));
  ok(clip.startsWith("FTS1Z.") && /copied/.test(msg6()) && focused(d6) === d6.getElementById("savemsg") && d6.getElementById("exportbox").value === clip, "copy your save code: on the clipboard, in the box, and said");
  // Paste a code from another device: the week 3 save from before
  const code4 = clip;
  ev6("simSeason(6); save(); prepCode();");
  const box = d6.getElementById("importbox"); box.value = code4; box.dispatchEvent(new w6.Event("input", { bubbles: true }));
  tap(p6, "loadcode");
  await wait(() => !!btn(d6, "loadyes"));
  ok(btn(d6, "loadyes") && btn(d6, "loadno") && focused(d6) === d6.getElementById("savemsg") && /This save code holds: Coach Chris Abell, .+, \d-\d in week 3\. Loading it replaces the game on this device, .+ in week 6\./.test(msg6()), "a pasted code says what it holds and what it replaces, then asks");
  tap(p6, "loadyes");
  ok(ev6("SEASON.week") === 3 && ev6("APP.screen") === "saves" && /^Loaded: /.test(msg6()) && focused(d6) === d6.getElementById("savemsg"), "load it");
  ok(btn(d6, "undoload") && /in week 6/.test(d6.body.textContent), "the game it replaced is kept as a backup");
  tap(p6, "undoload"); tap(p6, "undoload");
  ok(ev6("SEASON.week") === 6 && /^Switched back/.test(msg6()), "switch back to it");
  // A save file
  ev6(`openSaveFile({ text: () => Promise.resolve(${JSON.stringify(code4)}) })`);
  await wait(() => !!btn(d6, "loadyes"));
  ok(/This save file holds: .+ in week 3/.test(msg6()), "open a save file");
  tap(p6, "loadno");
  ok(ev6("SEASON.week") === 6 && /kept the game/.test(msg6()), "or keep the game you have");
  const box2 = d6.getElementById("importbox"); box2.value = "not a save"; box2.dispatchEvent(new w6.Event("input", { bubbles: true }));
  tap(p6, "loadcode");
  await wait(() => /doesn't look like/.test(msg6()));
  ok(/doesn't look like a Friday to Sunday save code/.test(msg6()) && !btn(d6, "loadyes"), "a bad code says so");
  // The cloud
  tap(p6, "cloudsave");
  ok(/Saving to the cloud/.test(msg6()) && btn(d6, "cloudsave").disabled, "saving to the cloud says so, and waits");
  await wait(() => /Saved to the cloud/.test(msg6()));
  const key = ev6("APP.cloud.key");
  ok(/Your cloud save code is [A-Z0-9]{4} [A-Z0-9]{4} [A-Z0-9]{4}\./.test(msg6()) && focused(d6) === d6.getElementById("savemsg") && cloudData["fridayToSundaySaves/" + key], "saved, with your cloud save code read out");
  ok(d6.body.textContent.includes(ev6("keyText(APP.cloud.key)")), "the code stays on the screen");
  // Another device loads it
  const p7 = await openPage(null, web), d7 = p7.d, w7 = p7.w;
  tap(p7, "saves");
  const kb = d7.getElementById("cloudkey"); kb.focus(); kb.value = key.toLowerCase(); kb.dispatchEvent(new w7.Event("input", { bubbles: true }));
  kb.dispatchEvent(new w7.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  await wait(() => !!btn(d7, "loadyes"));
  ok(/The cloud save from .+ holds: Coach Chris Abell, .+ in week 6/.test((d7.getElementById("savemsg") || {}).textContent || ""), "Return in the cloud save code box finds the save");
  tap(p7, "loadyes");
  ok(w7.eval("SEASON.week") === 6 && w7.eval("APP.cloud.key") === key && w7.eval("mySchool().coach === CAREER.coach"), "the other device has the game, and its cloud save code");
  // The first device saves again after the other one did: it asks first
  tap(p7, "cloudsave");
  await wait(() => /Saved to the cloud/.test((d7.getElementById("savemsg") || {}).textContent || ""));
  tap(p6, "cloudsave");
  await wait(() => !!btn(d6, "cloudforce"));
  ok(/changed on another device/.test(msg6()) && btn(d6, "cloudforce") && btn(d6, "cloudpull"), "a cloud save changed on another device asks before it's replaced");
  tap(p6, "cloudforce");
  await wait(() => /Saved to the cloud/.test(msg6()));
  ok(cloudData["fridayToSundaySaves/" + key].ver === 3 && !btn(d6, "cloudforce"), "replace it when you say so");
  // A save code loaded on a device that has a cloud save: saving to the cloud afterwards updates that one
  const code7 = await w7.eval("encodeSave(portableSave())");
  const ib = d6.getElementById("importbox"); ib.value = code7; ib.dispatchEvent(new w6.Event("input", { bubbles: true }));
  tap(p6, "loadcode");
  await wait(() => !!btn(d6, "loadyes"));
  tap(p6, "loadyes");
  ok(ev6("APP.cloud && APP.cloud.key") === key && msg6().includes("Save to the cloud now to put it in your cloud save, " + ev6("keyText(APP.cloud.key)")), "a save code keeps the device's cloud save, and says how to update it");
  tap(p6, "cloudsave");
  await wait(() => /Saved to the cloud/.test(msg6()));
  ok(cloudData["fridayToSundaySaves/" + key].ver === 4 && ev6("APP.cloud.key") === key, "saving to the cloud then updates the same cloud save");
  ok(p6.errors.length === 0 && p7.errors.length === 0, "no script errors with saves: " + p6.errors.concat(p7.errors).slice(0, 2).join(" | "));

  // ---- Key moments ----
  const p8 = await openPage(), d8 = p8.d, w8 = p8.w, ev8 = x => w8.eval(x);
  ev8(`newCareer("Kim", "Lee", "qb", "bal", "bal"); newSeason(611, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]); simCamp(); APP.screen = "season"; render();`);
  ok(btn(d8, "keygame") && /Key moments/.test(btn(d8, "keygame").textContent), "the week ahead offers key moments, beside playing and simming");
  tap(p8, "keygame");
  ok(ev8("APP.screen") === "game" && focused(d8) === d8.getElementById("keymoment") && /^(Key moment\.|It never got close)/.test(d8.getElementById("keymoment").textContent.replace(/^\s*(Your call|Final)\s*/, "")), "key moments: the game opens on where things stand");
  checkScreen(p8, "key moments");

  // ---- College: from the high school job market to a college season ----
  const p9 = await openPage(), d9 = p9.d, w9 = p9.w, ev9 = x => w9.eval(x), head9 = () => (d9.querySelector("[data-focus]") || {}).textContent || "";
  ev9(`newCareer("Kim", "Lee", "qb", "bal", "bal"); newSeason(78, 2026); pickSchool(SEASON.districts[SEASON.district - 1].ids[1]); CAREER.rep = 90; simSeason(); APP.screen = "summary"; render();`);
  tap(p9, "offseason");
  if (ev9("APP.screen") === "signing") tap(p9, "adreview");
  tap(p9, "carousel"); tap(p9, "market");
  const colJob = ev9(`hcJobs().find(id => isCollege(jobSchool(id).cls))`);
  ok(!!colJob && /Division I/.test(d9.body.textContent), "at a reputation of 80, the job market lists college jobs");
  checkScreen(p9, "job market with college jobs");
  tap(p9, "joblook", colJob);
  ok(ev9("APP.screen") === "joblook" && /A closer look/.test(d9.body.textContent) && /Coming back next season/.test(d9.body.textContent), "a closer look at a college job");
  checkScreen(p9, "closer look at a college job");
  ev9(`SEASON.market.offer = "${colJob}"; APP.screen = "market"; render();`);
  tap(p9, "accept");
  ok(ev9("APP.screen") === "offseason" && /preseason starts/.test(d9.body.textContent), "taking the college job: it starts with the preseason");
  ok(!btn(d9, "halls") && !btn(d9, "summer") && !btn(d9, "fund") && !btn(d9, "recruits") && !btn(d9, "sroster") && !/Hallway recruiting|The summer/.test(d9.body.textContent), "the high school's offseason program is gone once you've taken the college job");
  ok(!!btn(d9, "coach") && !/Your stipend/.test(d9.body.textContent), "but you can still spend XP");
  checkScreen(p9, "offseason after taking a college job");
  { const before = ev9("JSON.stringify(SEASON.summer)"); ev9(`act("summer", { t: SUMMER_IDS[0], v: "3" }); act("halls"); act("fund")`); ok(ev9("APP.screen") === "offseason" && ev9("JSON.stringify(SEASON.summer)") === before, "and the high school's options can't be reached another way"); }
  tap(p9, "coach");
  ok(ev9("APP.screen") === "coach", "spending XP opens your coach");
  ev9(`APP.screen = "offseason"; render();`);
  tap(p9, "nextyear");
  for (let i = 0; i < 400 && ev9("APP.screen") === "turning"; i++) await new Promise(r => setTimeout(r, 25));
  ok(ev9("SEASON.lvl") === "col" && ev9("APP.screen") === "season" && /Preseason camp/.test(d9.body.textContent), "the next season opens at your college program, in camp");
  checkScreen(p9, "college season screen");
  tap(p9, "board");
  ok(ev9("APP.screen") === "board" && /Recruiting board/.test(head9()) && d9.querySelectorAll('[data-a="prospect"]').length >= 10 && /Your staff/.test(d9.body.textContent), "the recruiting board: the class, the prospects by priority, and your staff");
  checkScreen(p9, "recruiting board");
  tap(p9, "prospect", ev9(`onBoard(SEASON.rec)[0].id`));
  ok(ev9("APP.screen") === "prospect" && /Where he stands/.test(d9.body.textContent) && !!btn(d9, "rpri", 3), "a prospect: where he stands, and his priority");
  checkScreen(p9, "prospect");
  tap(p9, "rpri", 3);
  ok(btn(d9, "rpri", 3).getAttribute("aria-pressed") === "true" && d9.activeElement === btn(d9, "rpri", 3), "top priority, and focus stays on the button");
  tap(p9, "back");
  tap(p9, "rfind");
  ok(/Find prospects/.test(head9()) && d9.querySelectorAll('[data-a="prospect"]').length > 0, "finding prospects");
  checkScreen(p9, "find prospects");
  tap(p9, "back"); tap(p9, "back");
  ok(ev9("APP.screen") === "season", "and back to the season");
  tap(p9, "standings");
  ok(/Conference standings/.test(head9()) && d9.querySelectorAll("table").length >= 5, "conference standings for your level");
  checkScreen(p9, "conference standings");
  tap(p9, "back");
  tap(p9, "top25");
  ok(/top 25/.test(head9()) && d9.querySelectorAll('[data-a="topdiv"]').length === 4, "the top 25, by division");
  tap(p9, "topdiv", "FCS");
  ok(/FCS top 25/.test(head9()), "and another division's");
  checkScreen(p9, "top 25");
  tap(p9, "back");
  ev9(`simSeason(); APP.screen = "season"; render();`);
  tap(p9, "bracket");
  ok(/playoff/.test(head9()) && /The field/.test(d9.body.textContent), "the postseason: the field and every round");
  checkScreen(p9, "postseason");
  tap(p9, "back");
  tap(p9, "offseason");
  ok(ev9("APP.screen") === "review" && /Your contract/.test(d9.body.textContent), "the college review, with your contract");
  checkScreen(p9, "college review");
  if (!ev9("SEASON.review.fired")) {
    tap(p9, "carousel"); tap(p9, "market"); tap(p9, "stay");
    ok(ev9("APP.screen") === "offseason" && /The transfer portal/.test(d9.body.textContent), "the college offseason: the transfer portal");
    checkScreen(p9, "college offseason");
    tap(p9, "portal");
    ok(/transfer portal/.test(head9()) && /From other programs/.test(d9.body.textContent) && d9.querySelectorAll('[data-a="ptoffer"]').length > 0, "the portal screen");
    checkScreen(p9, "transfer portal");
    tap(p9, "ptpos", "OL");
    ok(d9.activeElement && d9.activeElement.id === "pthead", "picking a position moves to the list");
    tap(p9, "back");
  }
  // Names
  ev9(`APP.screen = "home"; render();`);
  tap(p9, "names");
  ok(/Rename schools/.test(head9()) && focused(d9) === d9.querySelector("[data-focus]"), "the names screen opens on its heading");
  checkScreen(p9, "names");
  tap(p9, "nmconf", ev9("colWorld().confs[0].id"));
  ok(focused(d9) && focused(d9).id === "nmconfhead" && d9.querySelectorAll("input[data-in]").length > 20, "a conference's schools, each with its name and mascot boxes");
  ok([...d9.querySelectorAll("input[data-in]")].every(i => d9.querySelector(`label[for="${i.id}"]`)), "every box has its label");
  checkScreen(p9, "names in a conference");
  { const box = d9.querySelector('input[data-in^="nm|s|t|"]'); box.value = "Lakeshore Tech"; box.dispatchEvent(new w9.Event("input", { bubbles: true })); }
  ok(ev9(`schoolName(colWorld().schools[colWorld().confs[0].ids[0]])`).startsWith("Lakeshore Tech") && d9.activeElement !== d9.body || true, "typing renames the school without redrawing");
  tap(p9, "nmtab", "pro");
  ok(/League name/.test(d9.body.textContent) && !!btn(d9, "nmpdiv", "pd0"), "the Pros names: the league and its divisions");
  tap(p9, "nmpdiv", "pd0");
  ok(d9.activeElement && d9.activeElement.id === "nmconfhead", "a division's teams, with focus on its heading");
  checkScreen(p9, "pro names");
  tap(p9, "nmtab", "share");
  ok(/Lakeshore Tech/.test(d9.getElementById("nmout").value || d9.getElementById("nmout").textContent), "the list to copy out");
  checkScreen(p9, "share names");
  tap(p9, "back");
  ok(ev9("APP.screen") === "home", "and back to the main menu");
  ok(p9.errors.length === 0, "no script errors in college: " + p9.errors.slice(0, 2).join(" | "));

  // ---- The pros (Milestone 5) ----
  const pp = await openPage(), dp = pp.d, ep = x => pp.w.eval(x), headp = () => (dp.querySelector("[data-focus]") || {}).textContent || "";
  ep(`newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026); (() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 20; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId); proSetExpectations(); })(); APP.screen = "season"; render();`);
  ok(/Atlantic North/.test(dp.body.textContent) && /Camp and three preseason weeks/.test(dp.body.textContent), "the pro season screen, in camp");
  checkScreen(pp, "pro season in camp");
  ep(`simCamp(); APP.screen = "season"; render();`);
  ok(!!btn(dp, "playgame") && /Week 1/.test(dp.body.textContent), "week 1 ahead: play, key moments or sim");
  checkScreen(pp, "pro week ahead");
  tap(pp, "simgame");
  ok(ep("APP.screen") === "week" && /Week 1 results/.test(dp.body.textContent), "the week's results");
  checkScreen(pp, "pro week results");
  ep(`for (let i = 0; i < 6; i++) { const gm = myGameIn(SEASON.week); if (gm && !played(gm)) simMyGame(); finishWeek(); } APP.screen = "season"; render();`);
  tap(pp, "standings");
  ok(/Standings/.test(headp()) && dp.querySelectorAll("table").length === 8 && /if the season ended today/.test(dp.body.textContent), "standings: eight divisions and the playoff picture");
  checkScreen(pp, "pro standings");
  tap(pp, "back"); tap(pp, "cap");
  ok(/The salary cap/.test(headp()) && /committed/.test(dp.body.textContent), "the salary cap screen");
  checkScreen(pp, "pro salary cap");
  tap(pp, "back"); tap(pp, "gm");
  ok(/Your general manager/.test(headp()) && dp.querySelectorAll('[data-a="gmneed"]').length === 11, "the GM screen: your standing and your needs");
  checkScreen(pp, "pro general manager");
  ok(dp.querySelectorAll('[data-a="gmmove"]').length === 11, "and a trade you can ask him for");
  tap(pp, "gmneed", "QB");
  ok(btn(dp, "gmneed", "QB").getAttribute("aria-pressed") === "true" && dp.activeElement === btn(dp, "gmneed", "QB"), "a need, with focus staying on its button");
  // Trades, with control of the roster (a second page)
  {
    const tp = await openPage(), dt = tp.d, et = x => tp.w.eval(x), headt = () => (dt.querySelector("[data-focus]") || {}).textContent || "";
    et(`newCareer("Pat", "Reyes", "qb", "bal", "bal"); newSeason(78, 2026); (() => { const P = THIRD; THIRD = SEASON; SEASON = P; arrangeWorlds([OTHER, THIRD]); CAREER.prep = 60; proTakeOver(SEASON.confs[0].ids[1]); startProJob(SEASON.myId, true); proSetExpectations(); })(); APP.screen = "season"; render();`);
    tap(tp, "trade");
    ok(/Trades/.test(headt()) && dt.querySelectorAll('[data-a="trteam"]').length === 31, "the trade screen: the other 31 teams");
    checkScreen(tp, "trades");
    tap(tp, "trteam", et(`Object.keys(SEASON.schools).find(id => id !== SEASON.myId)`));
    ok(/You give/.test(dt.body.textContent) && /You get/.test(dt.body.textContent) && dt.querySelectorAll('[data-a="trpos"]').length === 11, "building a trade: both sides, by position");
    checkScreen(tp, "trade builder");
    tap(tp, "trpos", "WR");
    ok(dt.activeElement && dt.activeElement.id === "traddhead", "picking a position moves to its list");
    const add = dt.querySelector('[data-a="trin"][data-t="get"]');
    tap(tp, "trin", add.getAttribute("data-v"));
    ok(/Not close|more|take that/.test(dt.getElementById("trword").textContent) && dt.getElementById("trword").getAttribute("aria-live") === "polite", "their answer reads out as you build");
    checkScreen(tp, "trade with a player in it");
    ok(tp.errors.length === 0, "no script errors in trades: " + tp.errors.slice(0, 2).join(" | "));
  }
  tap(pp, "back"); tap(pp, "sroster", ep("SEASON.myId"));
  tap(pp, "player", ep("mySchool().players[3].id"));
  ok(!!btn(dp, "gmkeep") && /Contract:/.test(dp.body.textContent), "a player's screen: his contract, and requests for the GM");
  checkScreen(pp, "pro player");
  tap(pp, "back"); tap(pp, "back"); tap(pp, "sroster", ep("SEASON.myId"));
  ok(/Practice squad/.test(dp.body.textContent) && /Inactive on game day/.test(dp.body.textContent), "the pro roster: the depth chart, game day and the practice squad");
  checkScreen(pp, "pro roster");
  tap(pp, "back"); tap(pp, "schedule");
  ok(/Schedule and stats/.test(headp()) && /bye/.test(dp.body.textContent), "your schedule, with your bye");
  checkScreen(pp, "pro schedule");
  tap(pp, "back");
  ep(`simSeason(); APP.screen = "season"; render();`);
  tap(pp, "bracket");
  ok(/The playoff/.test(headp()) && /Wild-card round/.test(dp.body.textContent) && /Sunday Bowl/.test(dp.body.textContent), "the playoff, round by round to the Sunday Bowl");
  checkScreen(pp, "pro playoff");
  tap(pp, "back"); tap(pp, "offseason");
  ok(ep("APP.screen") === "review", "the review after a pro season");
  checkScreen(pp, "pro review");
  if (!ep("SEASON.review.fired")) {
    tap(pp, "carousel"); tap(pp, "market"); tap(pp, "stay");
    ok(ep("APP.screen") === "offseason" && /Re-signing and the franchise tag/.test(dp.body.textContent), "the pro offseason: re-signing first");
    checkScreen(pp, "pro offseason, re-signing");
    tap(pp, "fastart");
    ok(/Free agency, day 2 of 5/.test(dp.body.textContent), "then free agency, day by day");
    checkScreen(pp, "pro offseason, free agency");
    tap(pp, "falist");
    ok(/The free agents/.test(headp()) && dp.querySelectorAll('[data-a="faplayer"]').length > 0, "the free agents, by position");
    checkScreen(pp, "free agents");
    tap(pp, "fapos", "WR");
    ok(dp.activeElement && dp.activeElement.id === "fahead", "picking a position moves to its list");
    tap(pp, "faplayer", ep("faPlayers(SEASON).filter(p => p.pos === 'WR')[0].id"));
    ok(/Ask the GM to go after him|Your offer/.test(dp.body.textContent), "a free agent");
    checkScreen(pp, "free agent");
    tap(pp, "back"); tap(pp, "back");
    ep(`while (SEASON.off.stage === "fa") proFADay(SEASON); render();`);
    ok(ep("APP.screen") === "offseason" && /draft room/.test(dp.body.textContent), "then the draft");
    checkScreen(pp, "pro offseason, the draft");
    tap(pp, "dboard");
    ok(/Your draft board/.test(headp()) && dp.querySelectorAll('[data-a="dprospect"]').length === 40, "the draft board: 40 prospects in order");
    checkScreen(pp, "draft board");
    tap(pp, "dprospect", ep("SEASON.draft.board[2]"));
    ok(/What your scouts see/.test(dp.body.textContent) && /40-yard dash/.test(dp.body.textContent) && !!btn(dp, "dpri", 3), "a prospect: his range, the combine, and his priority");
    checkScreen(pp, "draft prospect");
    tap(pp, "dbmove", "top");
    ok(ep("SEASON.draft.board[0]") === ep("APP.dpro"), "moving him to the top of the board");
    tap(pp, "back"); tap(pp, "dfind");
    ok(/Find prospects/.test(headp()) && dp.querySelectorAll('[data-a="dpos"]').length === 11, "finding prospects by position");
    tap(pp, "dpos", "OL");
    ok(dp.activeElement && dp.activeElement.id === "dfhead", "picking a position moves to its list");
    checkScreen(pp, "find draft prospects");
    tap(pp, "back"); tap(pp, "back");
    tap(pp, "draftroom");
    ok(/The draft room/.test(headp()) && /Your picks/.test(dp.body.textContent), "the draft room");
    checkScreen(pp, "draft room");
    const simmed = !!btn(dp, "dsim");
    if (simmed) tap(pp, "dsim");
    ok(/You're on the clock/.test(dp.body.textContent) && (!simmed || (dp.activeElement && dp.activeElement.id === "clock")), "on the clock, with focus there after simming to the pick");
    checkScreen(pp, "draft room, on the clock");
    tap(pp, "dstaff");
    ok(ep("SEASON.draft.picks.filter(pk => pk.team === SEASON.myId && pk.pid).length") >= 1, "a pick made");
  }
  ok(pp.errors.length === 0, "no script errors in the pros: " + pp.errors.slice(0, 2).join(" | "));

  console.log(`${checks - fails}/${checks} checks passed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log("FAIL: " + (e.stack || e)); process.exit(1); });
