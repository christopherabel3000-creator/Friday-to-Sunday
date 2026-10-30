// The game's scripts share one set of top-level names (see the note in js/util.js). This checks that
// no two files declare the same name, and that no name matches something browsers already put on
// the window, which some browsers refuse (Safari) or which would quietly replace a browser feature.
// Usage: node tests/lint.js   (needs acorn: npm install)
const fs = require("fs"), path = require("path"), acorn = require("acorn");
const { scripts, ROOT } = require("./load.js");
let fails = 0;
const fail = msg => { fails++; console.log("FAIL: " + msg); };
// Window properties in common browsers that a top-level name must not reuse
const WINDOW = new Set(["name", "status", "top", "parent", "self", "window", "document", "location", "history", "navigator", "screen", "frames", "length",
  "opener", "origin", "closed", "event", "external", "performance", "crypto", "caches", "chrome", "navigation", "scheduler", "toolbar", "menubar",
  "statusbar", "scrollbars", "locationbar", "personalbar", "visualViewport", "devicePixelRatio", "innerWidth", "innerHeight", "outerWidth",
  "outerHeight", "scrollX", "scrollY", "pageXOffset", "pageYOffset", "screenX", "screenY", "screenLeft", "screenTop", "localStorage", "sessionStorage",
  "indexedDB", "open", "close", "stop", "print", "find", "focus", "blur", "scroll", "scrollTo", "scrollBy", "moveTo", "moveBy", "resizeTo", "resizeBy",
  "alert", "confirm", "prompt", "fetch", "postMessage", "atob", "btoa", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "queueMicrotask",
  "requestAnimationFrame", "cancelAnimationFrame", "getComputedStyle", "matchMedia", "getSelection", "customElements", "speechSynthesis", "isSecureContext",
  "crossOriginIsolated", "trustedTypes", "cookieStore", "clientInformation", "styleMedia", "defaultStatus", "content", "credentialless", "onload", "Option",
  "Image", "Audio", "Notification", "Sound", "external", "console", "Map", "Set", "JSON", "Math", "Date", "Error"]);
const ALLOWED = new Set(["Sound"]); // ours, and no browser defines it
const seen = new Map();
for (const src of scripts()) {
  const code = fs.readFileSync(path.join(ROOT, src), "utf8");
  let ast;
  try { ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "script" }); } catch (e) { fail(`${src} doesn't parse: ${e.message}`); continue; }
  for (const node of ast.body) {
    const names = node.type === "VariableDeclaration" ? node.declarations.map(d => d.id.name)
      : node.type === "FunctionDeclaration" || node.type === "ClassDeclaration" ? [node.id.name] : [];
    for (const n of names) {
      if (!n) continue;
      if (seen.has(n)) fail(`"${n}" is declared in both ${seen.get(n)} and ${src}`);
      else seen.set(n, src);
      if (WINDOW.has(n) && !ALLOWED.has(n)) fail(`"${n}" in ${src} matches a window property`);
    }
  }
}
console.log(fails ? `${fails} problems` : `${seen.size} top-level names, all unique and safe`);
process.exit(fails ? 1 : 0);
