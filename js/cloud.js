// Friday to Sunday: saves you can take with you. A save code is the whole game as text, to copy into
// Notes or keep as a file. A cloud save is the whole game in the online database, under a 12-character
// cloud save code, to load on another device.
"use strict";

/* ---------- Save codes ---------- */
// FTS1Z. and the saved game gzipped, in base64. A browser that can't compress writes FTS1. and plain
// base64 instead, about four times as long. Spaces and line breaks are ignored when pasting, so codes
// survive Notes and email.
const CODE_HEAD = "FTS1.", CODE_HEAD_Z = "FTS1Z.";
// Loading a save keeps the game it replaces here, to switch back to
const BACKUP_KEY = "friday-to-sunday-before-load";
function bytesToB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  return btoa(bin);
}
function b64ToBytes(b64) {
  const bin = atob(b64), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function pipeBytes(bytes, through) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(through)).arrayBuffer());
}
async function encodeSave(d) {
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  if (typeof CompressionStream === "function") {
    try { return CODE_HEAD_Z + bytesToB64(await pipeBytes(bytes, new CompressionStream("gzip"))); } catch (e) { /* the plain code below */ }
  }
  return CODE_HEAD + bytesToB64(bytes);
}
// { save } upgraded to this version, or { err } to read out
async function decodeSave(text) {
  const m = String(text || "").replace(/\s+/g, "").match(/FTS1(Z?)\.([A-Za-z0-9+/]+=*)/);
  if (!m) return { err: "That doesn't look like a Friday to Sunday save code. A save code starts with FTS1 and a period. Make sure you copied all of it." };
  let d;
  try {
    let bytes = b64ToBytes(m[2]);
    if (m[1]) {
      if (typeof DecompressionStream !== "function") return { err: "This browser can't open that save code. The latest Safari, Chrome, Edge or Firefox can." };
      bytes = await pipeBytes(bytes, new DecompressionStream("gzip"));
    }
    d = JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { return { err: "That save code is incomplete or damaged. Make sure you copied all of it." }; }
  return checkSave(d);
}
function checkSave(d) {
  if (!d || d.v !== 1 || !d.app || typeof d.app !== "object") return { err: "That isn't a Friday to Sunday save." };
  if ((d.build || 0) > BUILD) return { err: "That save is from a newer version of the game. Reload this page to get the newest version, then try again." };
  try { return { save: upgradeSave(d) }; } catch (e) { return { err: "That save couldn't be read." }; }
}
// Wins and losses in a saved season, playoffs included
function savedRecord(se, id) {
  let w = 0, l = 0;
  const count = gm => {
    if (gm.hs == null || (gm.h !== id && gm.a !== id)) return;
    if ((gm.h === id ? gm.hs : gm.as) > (gm.h === id ? gm.as : gm.hs)) w++; else l++;
  };
  (se.weeks || []).forEach(wk => wk.games.forEach(count));
  if (se.bracket) se.bracket.rounds.forEach(r => r.forEach(count));
  return { w, l };
}
// A save in a sentence: "Coach Christopher Abel, Pine Hollow Pirates, 4-1 in week 6"
function saveSummary(d) {
  const ca = d && d.career, se = d && d.season, c = ca && ca.coach, who = c && c.last ? coachFullName(c) : "";
  const me = se && se.myId && se.schools && se.schools[se.myId];
  if (me) {
    const r = savedRecord(se, se.myId), when = se.phase === "over" ? "season over" : se.week > REGULAR_WEEKS ? `in the ${(PLAYOFF_ROUNDS[se.week - REGULAR_WEEKS - 1] || "playoffs").toLowerCase()}` : `in week ${se.week}`;
    return `${who ? who + ", " : ""}${me.town} ${me.mascot}, ${r.w}-${r.l} ${when}`;
  }
  if (c) return `${who || "a new coach"}, looking for a job`;
  return "no season started";
}
// The game to put in a save code or the cloud. It leaves out this device's cloud save code, so sharing
// a save code never shares the cloud save (a cloud load brings the code with it).
const portableSave = () => Object.assign(currentSave(), { app: Object.assign({}, APP, { cloud: null }) });
function keepBackup() { try { localStorage.setItem(BACKUP_KEY, JSON.stringify(currentSave())); } catch (e) { /* backups are best-effort */ } }
function readBackup() { try { return JSON.parse(localStorage.getItem(BACKUP_KEY) || "null"); } catch (e) { return null; } }
const dateText = t => new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

/* ---------- Cloud saves ---------- */
// Cloud saves use the Firebase Realtime Database of the call-sheet-football project, shared with
// Christopher's other games. These values identify the project; they are not passwords. Access is
// controlled by the rules in database.rules.json, which have to be published in the Firebase console.
// The Firebase library loads only when a cloud save is first used.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCY2-1Q7F5GJmrIs33-emT0_rwYN-TfiAw",
  authDomain: "call-sheet-football.firebaseapp.com",
  databaseURL: "https://call-sheet-football-default-rtdb.firebaseio.com",
  projectId: "call-sheet-football",
  storageBucket: "call-sheet-football.firebasestorage.app",
  messagingSenderId: "448422352869",
  appId: "1:448422352869:web:4eb76ce7d666c4ed02410c"
};
const FB_LIB = "https://www.gstatic.com/firebasejs/10.12.2/";
// A save lives at fridayToSundaySaves/KEY as { ver, state, t, by, act }: state is the save code.
// Saves are numbered, so the game can tell when the cloud copy was changed from another device since
// you last saved or loaded it here, and asks before replacing it.
const CLOUD_PATH = "fridayToSundaySaves/";
const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ONLINE_OFF = "Cloud saves aren't switched on yet: the online database's rules still need to be published in the Firebase console. Save codes work without them.";
const CONN_ERR = "Couldn't reach the cloud. Check your internet connection and try again.";
let fbLoading = null, cloudDb = null;
function randKey() {
  const n = new Uint32Array(12);
  try { crypto.getRandomValues(n); } catch (e) { for (let i = 0; i < 12; i++) n[i] = Math.floor(Math.random() * 4294967296); }
  return [...n].map(x => KEY_CHARS[x % KEY_CHARS.length]).join("");
}
const keyText = k => `${k.slice(0, 4)} ${k.slice(4, 8)} ${k.slice(8)}`;
function deviceId() {
  let id = null;
  try { id = localStorage.getItem("friday-to-sunday-device"); } catch (e) { id = null; }
  if (!id) { id = randKey(); try { localStorage.setItem("friday-to-sunday-device", id); } catch (e) { /* a new id next time */ } }
  return id;
}
function loadFirebase() {
  if (typeof firebase !== "undefined" && firebase.database) return Promise.resolve(true);
  if (!fbLoading) {
    const add = src => new Promise((ok, no) => { const el = document.createElement("script"); el.src = src; el.onload = ok; el.onerror = no; document.head.appendChild(el); });
    fbLoading = add(FB_LIB + "firebase-app-compat.js").then(() => add(FB_LIB + "firebase-database-compat.js")).then(() => true, () => { fbLoading = null; return false; });
  }
  return fbLoading;
}
async function netDb() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
  if (cloudDb) return cloudDb;
  if (!(await loadFirebase())) return null;
  const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
  cloudDb = app.database();
  return cloudDb;
}
const netErr = e => /permission/i.test(String(e && (e.code || e.message))) ? ONLINE_OFF : CONN_ERR;
// Saves the game to its cloud save code (a new one the first time). force replaces a cloud save that
// was changed on another device. Returns { ok, msg } or { conflict, msg }.
async function cloudSave(force) {
  const db = await netDb();
  if (!db) return { msg: CONN_ERR };
  const C = APP.cloud || {}, fresh = !C.key, key = C.key || randKey(), code = await encodeSave(portableSave());
  let conflict = false, ver = 0, at = 0;
  try {
    const res = await db.ref(CLOUD_PATH + key).transaction(cur => {
      conflict = false;
      if (cur && (fresh || (!force && cur.ver !== C.ver))) { conflict = true; return; }
      ver = cur ? cur.ver + 1 : 1; at = Date.now();
      return { ver, state: code, t: at, by: deviceId(), act: "save" };
    }, null, false);
    if (!res.committed) {
      if (conflict && fresh) return cloudSave(force);
      if (conflict) return { conflict: true, msg: "The cloud save was changed on another device since you last saved or loaded it here. Replace it with the game on this device, or load the cloud save instead." };
      return { msg: CONN_ERR };
    }
    APP.cloud = { key, ver, at };
    return { ok: true, msg: fresh ? `Saved to the cloud. Your cloud save code is ${keyText(key)}. Keep it somewhere safe, like a password: it loads this game on another device, and anyone with it can load or replace this save.`
      : `Saved to the cloud under your code ${keyText(key)}.` };
  } catch (e) { return { msg: netErr(e) }; }
}
// Looks up a cloud save. Returns { found: { save, cloud }, msg } or { msg }.
async function cloudFind(text) {
  const key = String(text || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (key.length !== 12 || [...key].some(ch => !KEY_CHARS.includes(ch))) return { msg: "A cloud save code is 12 letters and numbers, like ABCD EFGH JK23. Check the code and try again." };
  const db = await netDb();
  if (!db) return { msg: CONN_ERR };
  try {
    const v = (await db.ref(CLOUD_PATH + key).once("value")).val();
    if (!v) return { msg: `There's no cloud save with the code ${keyText(key)}.` };
    const r = await decodeSave(v.state);
    if (r.err) return { msg: r.err };
    return { found: { save: r.save, cloud: { key, ver: v.ver, at: v.t } }, msg: `Found a cloud save from ${dateText(v.t)}: ${saveSummary(r.save)}.` };
  } catch (e) { return { msg: netErr(e) }; }
}

/* ---------- Keeping the browser's storage ---------- */
// Some browsers clear a site's storage after a while without visits. This asks them to keep it.
// storeKept is true, false, or null when the browser can't say.
let storeKept = null;
function checkStorage() {
  try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(v => { storeKept = !!v; }, () => {}); } catch (e) { /* not supported */ }
}
function askPersist() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return Promise.resolve(null);
    return navigator.storage.persist().then(v => { storeKept = !!v; return storeKept; }, () => false);
  } catch (e) { return Promise.resolve(null); }
}
