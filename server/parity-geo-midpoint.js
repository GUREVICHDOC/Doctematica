"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var packFor = require("./geo-lengths").packFor;
var reconstruct = require("./geo-lengths").reconstruct;
var MIDPOINT_PAGE_IDS = require("./geo-lengths").MIDPOINT_PAGE_IDS;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function via(handler, payload) {
  return handler.handle(Object.assign({ topic: "analytic", capability: payload.capability || "midpoint" }, payload));
}

function main() {
  var engine = loadEngine();
  var G = engine.DoctematicaGeometry;
  var handler = createGeometryHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  add(MIDPOINT_PAGE_IDS && MIDPOINT_PAGE_IDS["geo-midpoint-1"] ? { ok: true, id: "page-id" } : fail("page-id", "missing"));

  function chk(n, typed, history) {
    return via(handler, { intent: "check", levelId: "geo-midpoint-1", n: n, history: history || [], geo: {}, typed: typed });
  }

  var n1 = chk(1, "M(4;5)", []);
  add(n1 && n1.ok && n1.solved && n1.done.M ? { ok: true, id: "n1-direct" } : fail("n1-direct", JSON.stringify(n1)));

  var n1rev = chk(1, "x=(6+2)/2", []);
  add(n1rev && n1rev.ok && !n1rev.solved && !n1rev.done.M ? { ok: true, id: "n1-reverse-not-done" } : fail("n1-reverse-not-done", JSON.stringify(n1rev)));

  var n3 = chk(3, "x = (-4 + 6)/2", []);
  add(n3 && n3.ok ? { ok: true, id: "n3-neg-first" } : fail("n3-neg-first", JSON.stringify(n3)));

  var n4 = chk(4, "x = (1 + (-5))/2", []);
  add(n4 && n4.ok ? { ok: true, id: "n4-paren-neg" } : fail("n4-paren-neg", JSON.stringify(n4)));

  var n6 = chk(6, "x=1/2", []);
  add(n6 && n6.ok && n6.coords && n6.coords.M && n6.coords.M.x && !n6.solved ? { ok: true, id: "n6-half-closes-x" } : fail("n6-half-closes-x", JSON.stringify(n6)));

  var n7 = chk(7, "x=21/2", []);
  add(n7 && n7.ok && n7.coords && n7.coords.M && n7.coords.M.x && !n7.solved ? { ok: true, id: "n7-21-2-closes-x" } : fail("n7-21-2-closes-x", JSON.stringify(n7)));

  var n1sum = chk(1, "x=8/2", []);
  add(n1sum && n1sum.ok && n1sum.partial && n1sum.partial.M && !(n1sum.coords && n1sum.coords.M && n1sum.coords.M.x) ? { ok: true, id: "n1-8-2-still-divide" } : fail("n1-8-2-still-divide", JSON.stringify(n1sum)));

  var n8 = chk(8, "B(5;6)", []);
  add(n8 && n8.ok && n8.solved && n8.done.B ? { ok: true, id: "n8-direct-end" } : fail("n8-direct-end", JSON.stringify(n8)));

  var n8copy = chk(8, "M(3;4)", []);
  add(n8copy && !n8copy.ok && /אמצע/.test(String(n8copy.message || "")) ? { ok: true, id: "n8-copy-M" } : fail("n8-copy-M", JSON.stringify(n8copy)));

  var n8x = chk(8, "x=7", []);
  add(n8x && !n8x.ok ? { ok: true, id: "n8-2m-plus" } : fail("n8-2m-plus", JSON.stringify(n8x)));

  var n12 = chk(12, "-5.5 = (-3 + x)/2", []);
  add(n12 && n12.ok && !n12.solved ? { ok: true, id: "n12-mixed-plug" } : fail("n12-mixed-plug", JSON.stringify(n12)));

  var pack13 = packFor(engine, "geo-midpoint-1", 13);
  var can13 = G.canonicalMidpointSteps(pack13.tasks[0], pack13, { done: {}, coords: {}, lastExpr: {}, partial: {} });
  var n13step = chk(13, can13[0], []);
  add(n13step && n13step.ok ? { ok: true, id: "n13-canonical-accepted" } : fail("n13-canonical-accepted", JSON.stringify({ step: can13[0], res: n13step })));

  var n14e = chk(14, "E(4;2.5)", []);
  add(n14e && !n14e.ok ? { ok: true, id: "n14-E-before-B-rejected" } : fail("n14-E-before-B-rejected", JSON.stringify(n14e)));

  var n14b = chk(14, "B(0;2)", []);
  add(n14b && n14b.ok && n14b.done.B && !n14b.done.E ? { ok: true, id: "n14-B-first" } : fail("n14-B-first", JSON.stringify(n14b)));
  var n14e2 = chk(14, "E(4;2.5)", ["B(0;2)"]);
  add(n14e2 && n14e2.ok && n14e2.done.E ? { ok: true, id: "n14-E-after-B" } : fail("n14-E-after-B", JSON.stringify(n14e2)));

  var n15skip = chk(15, "M(2;-1.5)", []);
  add(n15skip && n15skip.ok && n15skip.done.M && n15skip.done.A && n15skip.done.B ? { ok: true, id: "n15-skip-M-marks-intercepts" } : fail("n15-skip-M-marks-intercepts", JSON.stringify(n15skip)));

  var fakeAB = reconstruct(engine, packFor(engine, "geo-midpoint-1", 15), [], { done: { A: true, B: true }, coords: { A: { x: true, y: true }, B: { x: true, y: true } } });
  add(!(fakeAB.done && fakeAB.done.A) ? { ok: true, id: "n15-no-trust-done" } : fail("n15-no-trust-done", JSON.stringify(fakeAB.done)));

  var n16y0 = chk(16, "y=0", []);
  add(n16y0 && n16y0.ok && n16y0.coords && n16y0.coords.B && n16y0.coords.B.y && !n16y0.done.B ? { ok: true, id: "n16-early-y0" } : fail("n16-early-y0", JSON.stringify(n16y0)));

  var n16x = chk(16, "x=0", []);
  add(n16x && n16x.ok && n16x.coords.A && n16x.coords.A.x && !n16x.solved ? { ok: true, id: "n16-xA-not-solved" } : fail("n16-xA-not-solved", JSON.stringify(n16x)));

  var n20m = chk(20, "M(4;3)", []);
  add(n20m && !n20m.ok ? { ok: true, id: "n20-M-before-E-rejected" } : fail("n20-M-before-E-rejected", JSON.stringify(n20m)));

  var n20e = chk(20, "E(4;7)", []);
  add(n20e && n20e.ok && n20e.done.E && !n20e.done.M ? { ok: true, id: "n20-E-first" } : fail("n20-E-first", JSON.stringify(n20e)));
  var n20m2 = chk(20, "M(4;3)", ["E(4;7)"]);
  add(n20m2 && n20m2.ok && n20m2.done.M ? { ok: true, id: "n20-M-after-E" } : fail("n20-M-after-E", JSON.stringify(n20m2)));

  var pack21 = packFor(engine, "geo-midpoint-1", 21);
  var rec21 = reconstruct(engine, pack21, ["x = 9", "7 = (9 + x)/2", "14 = 9 + x", "x = 5"], {});
  add(rec21.coords && rec21.coords.A && rec21.coords.A.x && !rec21.done.A ? { ok: true, id: "n21-until-Ax" } : fail("n21-until-Ax", JSON.stringify(rec21)));
  var partNow = G.currentPartText(pack21, rec21);
  add(partNow && partNow.label === "ב" ? { ok: true, id: "n21-part-a-closes-on-Ax" } : fail("n21-part-a-closes-on-Ax", JSON.stringify(partNow && partNow.label)));

  var n18yes = chk(18, "כן", []);
  add(n18yes && !n18yes.ok ? { ok: true, id: "n18-yes-too-soon" } : fail("n18-yes-too-soon", JSON.stringify(n18yes)));

  var fakeDone = reconstruct(engine, packFor(engine, "geo-midpoint-1", 1), [], { done: { M: true }, coords: { M: { x: true, y: true } }, lastExpr: { M: "M(4;5)" } });
  add(!(fakeDone.done && fakeDone.done.M) ? { ok: true, id: "no-trust-client-done" } : fail("no-trust-client-done", JSON.stringify(fakeDone.done)));

  var setup1 = via(handler, { intent: "setup", levelId: "geo-midpoint-1", n: 1, history: [], geo: {} });
  add(setup1 && setup1.server && setup1.capability === "midpoint" ? { ok: true, id: "setup-n1" } : fail("setup-n1", JSON.stringify(setup1)));

  var gatePerp = via(handler, { capability: "midpoint", intent: "one-step", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(gatePerp && gatePerp.ok && !gatePerp.local ? { ok: true, id: "gate-perp-server" } : fail("gate-perp-server", JSON.stringify(gatePerp)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoMidpointPage/.test(src) && /geo-midpoint-1/.test(src) ? { ok: true, id: "gate-page" } : fail("gate-page", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoMidpointPage/.test(src) ? { ok: true, id: "node-off-wired" } : fail("node-off-wired", "missing"));
  add(/showGeometryProcessingError/.test(src) && /err\.status/.test(src) ? { ok: true, id: "http-vs-unreachable" } : fail("http-vs-unreachable", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "midpoint"/.test(geoApi) ? { ok: true, id: "capability-wired" } : fail("capability-wired", "missing"));

  console.log("parity-geo-midpoint: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 60).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
