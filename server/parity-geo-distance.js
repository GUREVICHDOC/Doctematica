"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var packFor = require("./geo-lengths").packFor;
var reconstruct = require("./geo-lengths").reconstruct;
var DISTANCE_PAGE_IDS = require("./geo-lengths").DISTANCE_PAGE_IDS;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function via(handler, payload) {
  return handler.handle(Object.assign({ topic: "analytic", capability: payload.capability || "distance" }, payload));
}

function main() {
  var engine = loadEngine();
  var handler = createGeometryHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  add(DISTANCE_PAGE_IDS && DISTANCE_PAGE_IDS["geo-distance-1"] ? { ok: true, id: "page-id" } : fail("page-id", "missing"));

  function chk(n, typed, history) {
    return via(handler, { intent: "check", levelId: "geo-distance-1", n: n, history: history || [], geo: {}, typed: typed });
  }

  var n1 = chk(1, "5", []);
  add(n1 && n1.ok && n1.solved ? { ok: true, id: "n1-direct" } : fail("n1-direct", JSON.stringify(n1)));

  var n6dec = chk(6, "10.82", []);
  add(n6dec && !n6dec.ok ? { ok: true, id: "n6-reject-decimal" } : fail("n6-reject-decimal", JSON.stringify(n6dec)));

  var n6 = chk(6, "3√13", []);
  add(n6 && n6.ok && n6.solved ? { ok: true, id: "n6-radical" } : fail("n6-radical", JSON.stringify(n6)));

  var n7 = chk(7, "√5", []);
  add(n7 && n7.ok && n7.solved ? { ok: true, id: "n7-sqrt5" } : fail("n7-sqrt5", JSON.stringify(n7)));

  var n9eq = chk(9, "AB=BC", ["dAB=5√2", "dBC=5√2"]);
  add(n9eq && n9eq.ok ? { ok: true, id: "n9-equal-after-dists" } : fail("n9-equal-after-dists", JSON.stringify(n9eq)));

  var n16keep = chk(16, "B(16;16)", []);
  add(n16keep && n16keep.ok && n16keep.solved ? { ok: true, id: "n16-skip-keep-point" } : fail("n16-skip-keep-point", JSON.stringify(n16keep)));

  var n16bad = chk(16, "B(0;16)", []);
  add(n16bad && !n16bad.ok ? { ok: true, id: "n16-discard-q1" } : fail("n16-discard-q1", JSON.stringify(n16bad)));

  var n17both = chk(17, "y=18, y=-6", []);
  add(n17both && n17both.ok && n17both.solved ? { ok: true, id: "n17-both-roots" } : fail("n17-both-roots", JSON.stringify(n17both)));

  var fakeDone = reconstruct(engine, packFor(engine, "geo-distance-1", 1), [], { done: { AB: true }, lastExpr: { AB: "5" } });
  add(!(fakeDone.done && fakeDone.done.AB) ? { ok: true, id: "no-trust-client-done" } : fail("no-trust-client-done", JSON.stringify(fakeDone.done)));

  var fakeUnk = reconstruct(engine, packFor(engine, "geo-distance-1", 16), [], { distUnk: { B: { squared: true, found: [16], keepFound: [16] } }, done: { B: true } });
  add(!(fakeUnk.done && fakeUnk.done.B) ? { ok: true, id: "no-trust-distUnk" } : fail("no-trust-distUnk", JSON.stringify(fakeUnk.done)));

  var setup1 = via(handler, { intent: "setup", levelId: "geo-distance-1", n: 1, history: [], geo: {} });
  add(setup1 && setup1.server && setup1.capability === "distance" ? { ok: true, id: "setup-n1" } : fail("setup-n1", JSON.stringify(setup1)));

  var setup10 = via(handler, { intent: "setup", levelId: "geo-distance-1", n: 10, history: [], geo: {} });
  add(setup10 && setup10.server && setup10.capability === "line-intersect" ? { ok: true, id: "setup-n10-intersect" } : fail("setup-n10-intersect", JSON.stringify(setup10)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoDistancePage/.test(src) && /geo-distance-1/.test(src) ? { ok: true, id: "gate-page" } : fail("gate-page", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoDistancePage/.test(src) ? { ok: true, id: "node-off-wired" } : fail("node-off-wired", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "distance"/.test(geoApi) ? { ok: true, id: "capability-wired" } : fail("capability-wired", "missing"));

  console.log("parity-geo-distance: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 60).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
