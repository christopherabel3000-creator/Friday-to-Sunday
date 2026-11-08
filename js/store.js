// Friday to Sunday: saving on this device.
// The game used to save only in localStorage, which a browser caps at about 5 MB for the whole site,
// shared by every game on the same github.io address. A career with three worlds can fill it, and
// then saves failed without a word and a reload went back to the last save that fit (Nov 2026: a
// finished game came back with two minutes left). Now every save also goes to IndexedDB, which has
// far more room. localStorage still gets a copy when it fits. Loading takes whichever copy is newer
// (each save carries the time it was made), and if neither copy could be written, the game says so.
"use strict";

const IDB_NAME = "friday-to-sunday", IDB_STORE = "saves";
let idbConn = null;
// Whether the last write to each place worked (null: not tried yet)
const storeState = { ls: null, idb: null, warned: false };
function idbOpen() {
  if (idbConn) return Promise.resolve(idbConn);
  return new Promise((res, rej) => {
    if (typeof indexedDB === "undefined" || !indexedDB) { rej(new Error("no IndexedDB")); return; }
    let rq;
    try { rq = indexedDB.open(IDB_NAME, 1); } catch (e) { rej(e); return; }
    rq.onupgradeneeded = () => { try { rq.result.createObjectStore(IDB_STORE); } catch (e) { /* already there */ } };
    rq.onsuccess = () => { idbConn = rq.result; idbConn.onclose = () => { idbConn = null; }; idbConn.onversionchange = () => { try { idbConn.close(); } catch (e) { /* fine */ } idbConn = null; }; res(idbConn); };
    rq.onerror = () => rej(rq.error || new Error("IndexedDB failed"));
    rq.onblocked = () => rej(new Error("IndexedDB blocked"));
  });
}
function idbPut(key, text) {
  return idbOpen().then(db => new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => res(true);
    tx.onerror = tx.onabort = () => rej(tx.error || new Error("IndexedDB write failed"));
    tx.objectStore(IDB_STORE).put(text, key);
  }));
}
function idbGet(key) {
  return idbOpen().then(db => new Promise((res, rej) => {
    const rq = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
    rq.onsuccess = () => res(typeof rq.result === "string" ? rq.result : null);
    rq.onerror = () => rej(rq.error);
  }));
}
// Writes go one at a time, and only the newest waiting write is kept: a burst of taps writes the
// last one, never an older one after a newer one
const idbQueue = {};
function idbWrite(key, text, done) {
  const q = idbQueue[key] || (idbQueue[key] = { busy: false, next: null });
  q.next = { text, done };
  if (!q.busy) idbFlush(key);
}
function idbFlush(key) {
  const q = idbQueue[key], job = q.next;
  q.next = null;
  if (!job) { q.busy = false; return; }
  q.busy = true;
  idbPut(key, job.text).then(() => job.done && job.done(true), () => job.done && job.done(false)).then(() => idbFlush(key));
}

// Write one save to both places. A full localStorage first lets go of the backup kept from before a
// load (it's in IndexedDB too), then tries again.
function storeText(key, text, onTrouble) {
  let ls = false;
  try { localStorage.setItem(key, text); ls = true; } catch (e) {
    if (key !== BACKUP_KEY) { try { localStorage.removeItem(BACKUP_KEY); localStorage.setItem(key, text); ls = true; } catch (e2) { /* still full */ } }
  }
  if (key === SAVE_KEY) storeState.ls = ls;
  idbWrite(key, text, ok => {
    // A copy left in localStorage that this save couldn't replace is out of date: take it away, so
    // it can never be loaded instead of the newer one
    if (ok && !ls) { try { localStorage.removeItem(key); } catch (e) { /* fine */ } }
    if (key === SAVE_KEY) { storeState.idb = ok; if (!ok && !ls && onTrouble) onTrouble(); }
  });
  // No IndexedDB here at all (the tests, or an old browser): localStorage is all there is
  if (!ls && key === SAVE_KEY && typeof indexedDB === "undefined" && onTrouble) { storeState.idb = false; onTrouble(); }
}
// Neither place could take the last save
const saveTrouble = () => storeState.ls === false && storeState.idb === false;

// At startup: what IndexedDB holds, read before the game starts (or nothing, after a short wait)
const idbLoaded = { save: null, backup: null };
function idbLoadAll() {
  if (typeof indexedDB === "undefined" || !indexedDB) return Promise.resolve();
  const read = Promise.all([idbGet(SAVE_KEY), idbGet(BACKUP_KEY)]).then(([s, b]) => {
    idbLoaded.save = s; idbLoaded.backup = b;
    // A backup from before this change is only in localStorage: copy it over, since a full
    // localStorage lets go of it first
    let lb = null;
    try { lb = localStorage.getItem(BACKUP_KEY); } catch (e) { /* none */ }
    if (lb && newerSave(b, lb) === lb && lb !== b) { idbLoaded.backup = lb; idbWrite(BACKUP_KEY, lb); }
  }, () => {});
  return Promise.race([read, new Promise(res => setTimeout(res, 2500))]);
}
// The newer of two saved texts, by the time each was made (older saves have none)
function newerSave(a, b) {
  const at = t => { try { const m = /"at":(\d+)/.exec(t.slice(0, 200)); return m ? +m[1] : 0; } catch (e) { return 0; } };
  if (!a) return b; if (!b) return a;
  return at(b) >= at(a) ? b : a;
}
