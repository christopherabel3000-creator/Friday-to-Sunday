// Loads the game's scripts into Node, in the order index.html loads them, and returns the test hook.
// Every call gets a fresh copy of the game.
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
function scripts() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
}
function load(opts) {
  opts = opts || {};
  const store = new Map();
  const sb = Object.assign({ console, setTimeout, clearTimeout, Math, JSON,
    localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) } }, opts.globals || {});
  vm.createContext(sb);
  for (const src of scripts()) vm.runInContext(fs.readFileSync(path.join(ROOT, src), "utf8"), sb, { filename: src });
  // Everything the scripts declared at the top level, for tests that need more than the hook
  sb.__get = expr => vm.runInContext(expr, sb);
  return sb;
}
module.exports = { load, scripts, ROOT };
