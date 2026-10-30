// Friday to Sunday: shared helpers
// The game is plain scripts loaded in order by index.html. Each file's top-level names are shared
// with the files after it, so every top-level name must be unique across files, and none may match
// a property of the browser's window (no "name", "status", "top", "open"...). tests/lint.js checks.
"use strict";

/* ---------- Random numbers ---------- */
// The game itself rolls with Math.random. Building a world (schools, rosters, names) uses a seeded
// generator instead, so the same seed always rebuilds the same world.
let RNG = Math.random;
const rand = () => RNG();
// Tests can make a game repeatable
function setRandom(fn) { RNG = fn || Math.random; }
// mulberry32: small, fast and good enough for a game
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashSeed = str => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const newSeed = () => Math.floor(Math.random() * 4294967296);
// A seeded dice bag for generating things: g.f() 0..1, g.i(a, b) whole numbers, g.n(mean, sd),
// g.pick(list), g.w({ key: weight }), g.shuffle(list)
function dice(seed) {
  const f = seededRandom(seed);
  const g = {
    f,
    i: (a, b) => a + Math.floor(f() * (b - a + 1)),
    n: (m, s) => { let u = 0, v = 0; while (!u) u = f(); while (!v) v = f(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    pick: list => list[Math.floor(f() * list.length)],
    w: wts => { const ks = Object.keys(wts); let t = 0; ks.forEach(k => t += Math.max(0, wts[k])); let r = f() * t; for (const k of ks) { r -= Math.max(0, wts[k]); if (r <= 0) return k; } return ks[0]; },
    shuffle: list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    seed: () => Math.floor(f() * 4294967296)
  };
  return g;
}

/* ---------- Helpers ---------- */
const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function normal(m, s) { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function wpick(w) { const ks = Object.keys(w); let t = 0; ks.forEach(k => t += Math.max(0, w[k])); let r = rand() * t; for (const k of ks) { r -= Math.max(0, w[k]); if (r <= 0) return k; } return ks[0]; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const yd = n => `${n} yard${Math.abs(n) === 1 ? "" : "s"}`;
const ord = n => ["", "1st", "2nd", "3rd", "4th"][n] || n + "th";
const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const avg = list => list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + "s")}`;
const capFirst = s => s ? s[0].toUpperCase() + s.slice(1) : s;
// "a, b and c"
const andList = list => list.length <= 1 ? (list[0] || "") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
const clone = v => JSON.parse(JSON.stringify(v));
