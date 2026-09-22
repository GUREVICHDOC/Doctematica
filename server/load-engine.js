"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

/** Same order as index.html, without DOM UI (app / math-field / coord-board). */
var ENGINE_SCRIPTS = [
  "js/algebra.js",
  "js/quadratic.js",
  "js/geo/distance.js",
  "js/geo/dist-unknown.js",
  "js/geo/perp.js",
  "js/geo/parallel.js",
  "js/geo/slope.js",
  "js/geo/midpoint.js",
  "js/geo/axis-lines.js",
  "js/geo/line-eq.js",
  "js/geometry.js",
  "js/geo/draw.js",
  "js/teach.js",
  "js/systems.js",
  "js/errors.js",
  "js/math-render.js",
  "js/bank.js",
  "data/curriculum.js",
  "data/geometry/segments.js",
  "data/geometry/triangle-area.js",
  "data/geometry/rect-area.js",
  "data/geometry/line-points.js",
  "data/geometry/line-axis.js",
  "data/geometry/line-mb.js",
  "data/geometry/line-match.js",
  "data/geometry/line-intersect.js",
  "data/geometry/line-summary.js",
  "data/geometry/line-equation.js",
  "data/geometry/slope.js",
  "data/geometry/parallel.js",
  "data/geometry/perpendicular.js",
  "data/geometry/axis-lines.js",
  "data/geometry/midpoint.js",
  "data/geometry/distance.js",
  "data/curriculum-geo.js",
  "data/statistics/freq-table.js",
  "data/checks.js",
  "js/content.js",
  "js/problems.js",
];

function repoRoot() {
  return path.join(__dirname, "..");
}

function loadEngine(root) {
  root = root || repoRoot();
  var sandbox = {
    console: console,
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  ENGINE_SCRIPTS.forEach(function (rel) {
    var file = path.join(root, rel);
    var code = fs.readFileSync(file, "utf8");
    vm.runInContext(code, sandbox, { filename: rel });
  });
  return sandbox;
}

module.exports = {
  ENGINE_SCRIPTS: ENGINE_SCRIPTS,
  loadEngine: loadEngine,
  repoRoot: repoRoot,
};
