// Saving on the device (store.js): saves go to IndexedDB and to localStorage when it fits, a reload
// takes the newer copy, and a full localStorage no longer loses the game.
// Usage: node tests/store.js   (needs fake-indexeddb: npm install)
const { load } = require("./load.js");
const { IDBFactory } = require("fake-indexeddb");
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FAIL: " + msg); } else if (process.env.VERBOSE) console.log("ok: " + msg); };
const wait = ms => new Promise(r => setTimeout(r, ms));

// A localStorage that holds at most cap characters in all, like a phone's (about 5 MB per site)
function cappedStorage(cap) {
  const m = new Map(), used = () => [...m].reduce((n, [k, v]) => n + k.length + v.length, 0);
  return { map: m, getItem: k => m.has(k) ? m.get(k) : null, removeItem: k => m.delete(k),
    setItem(k, v) { v = String(v); const old = m.get(k); m.delete(k); if (used() + k.length + v.length > cap) { if (old != null) m.set(k, old); const e = new Error("QuotaExceededError"); e.name = "QuotaExceededError"; throw e; } m.set(k, v); } };
}
// The game on a device with this storage: started the way the page starts it
async function boot(ls, idb) {
  const sb = load({ globals: { localStorage: ls, indexedDB: idb } }), g = sb.__get;
  g("start()");
  await wait(50);
  return g;
}
const SAVE_KEY = "friday-to-sunday-v1", BACKUP_KEY = "friday-to-sunday-before-load";

(async () => {
  // ---- A full localStorage: the save goes to IndexedDB, and a reload gets it ----
  {
    const idb = new IDBFactory(), ls = cappedStorage(60000);
    let g = await boot(ls, idb);
    g(`newExhibition(); startExhibition(); simToEnd(); save();`);
    const size = g("JSON.stringify(currentSave()).length");
    await wait(50);
    ok(size > 60000 && ls.getItem(SAVE_KEY) === null && g("storeState.idb") === true && g("storeState.ls") === false && !g("saveTrouble()"), `a save too big for localStorage (${size} characters) goes to IndexedDB`);
    g = await boot(ls, idb);
    ok(g("S && S.phase") === "final", "and a reload loads it: the finished game, not an older one");
  }
  // ---- The newer copy wins ----
  {
    const idb = new IDBFactory(), ls = cappedStorage(1e9);
    let g = await boot(ls, idb);
    g(`newExhibition(); startExhibition(); save();`);
    await wait(50);
    const early = ls.getItem(SAVE_KEY);
    g(`simToEnd(); save();`);
    await wait(50);
    ok(ls.getItem(SAVE_KEY) !== early && g("storeState.ls") && g("storeState.idb"), "a save that fits goes to both places");
    // localStorage keeps an old copy (as when a write to it failed before this change)
    ls.setItem(SAVE_KEY, early.replace(/"at":\d+/, '"at":1'));
    g = await boot(ls, idb);
    ok(g("S && S.phase") === "final", "a reload takes the newer of the two copies");
    ok(g(`newerSave('{"v":1,"at":5}', '{"v":1,"at":9}')`) === '{"v":1,"at":9}' && g(`newerSave('{"v":1}', '{"v":1,"at":9}')`) === '{"v":1,"at":9}' && g(`newerSave('{"v":1,"at":9}', null)`) === '{"v":1,"at":9}', "newer by the time each save was made; a save from before has none");
  }
  // ---- Only localStorage (an old save, before this change) still loads ----
  {
    const idb = new IDBFactory(), ls = cappedStorage(1e9);
    let g = await boot(ls, null);
    g(`newExhibition(); startExhibition(); simToEnd(); save();`);
    ok(g("storeState.ls") === true && !g("saveTrouble()"), "with no IndexedDB, localStorage alone");
    ls.setItem(SAVE_KEY, ls.getItem(SAVE_KEY).replace(/"at":\d+,/, ""));
    g = await boot(ls, idb);
    ok(g("S && S.phase") === "final", "a save from before IndexedDB loads");
  }
  // ---- A full localStorage lets go of the backup, after it's copied to IndexedDB ----
  {
    const idb = new IDBFactory(), ls = cappedStorage(70000);
    ls.setItem(BACKUP_KEY, JSON.stringify({ v: 1, at: 7, app: { ex: {} }, mark: "x".repeat(30000) }));
    let g = await boot(ls, idb);
    ok(g("readBackup() && readBackup().mark.length") === 30000, "an old backup is still there");
    g(`newExhibition(); startExhibition(); simToEnd(); S.log = S.log.slice(0, 40); save();`);
    await wait(50);
    g = await boot(ls, idb);
    ok(g("readBackup() && readBackup().mark.length") === 30000, "the backup survives a full localStorage, in IndexedDB");
  }
  // ---- Neither place works: the game says so ----
  {
    const ls = cappedStorage(10), broken = { open() { throw new Error("no"); } };
    const g = await boot(ls, broken);
    g(`newExhibition(); startExhibition(); save();`);
    await wait(50);
    ok(g("saveTrouble()"), "when no save works, the game knows (and warns on every screen)");
  }
  console.log(fails ? `${checks - fails}/${checks} checks passed` : `${checks}/${checks} checks passed`);
  process.exit(fails ? 1 : 0);
})();
