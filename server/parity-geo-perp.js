"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createGeometryHandler = require("./geometry").createGeometryHandler;
var packFor = require("./geo-lengths").packFor;
var reconstruct = require("./geo-lengths").reconstruct;
var PERP_PAGE_IDS = require("./geo-lengths").PERP_PAGE_IDS;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function via(handler, payload) {
  return handler.handle(Object.assign({ topic: "analytic", capability: payload.capability || "perpendicular" }, payload));
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

  add(PERP_PAGE_IDS && PERP_PAGE_IDS["geo-perp-1"] ? { ok: true, id: "page-id" } : fail("page-id", "missing"));

  function chk(n, typed, history) {
    return via(handler, { intent: "check", levelId: "geo-perp-1", n: n, history: history || [], geo: {}, typed: typed });
  }

  var n1yes = chk(1, "כן", []);
  add(n1yes && n1yes.ok && n1yes.solved ? { ok: true, id: "n1-skip-yes" } : fail("n1-skip-yes", JSON.stringify(n1yes)));

  var n1prod = chk(1, "(−7) · (1/7) = −1", []);
  add(n1prod && n1prod.ok && !n1prod.solved ? { ok: true, id: "n1-product" } : fail("n1-product", JSON.stringify(n1prod)));

  var n2no = chk(2, "לא", []);
  add(n2no && n2no.ok && n2no.solved ? { ok: true, id: "n2-no" } : fail("n2-no", JSON.stringify(n2no)));

  var n3 = chk(3, "כן", []);
  add(n3 && n3.ok ? { ok: true, id: "n3-one-minus-one" } : fail("n3-one-minus-one", JSON.stringify(n3)));

  var n10 = chk(10, "כן", []);
  add(n10 && n10.ok && n10.solved ? { ok: true, id: "n10-hv-yes" } : fail("n10-hv-yes", JSON.stringify(n10)));

  var n11 = chk(11, "-1/4", []);
  add(n11 && n11.ok && n11.solved ? { ok: true, id: "n11-skip-number" } : fail("n11-skip-number", JSON.stringify(n11)));

  var n11form = chk(11, "m₁ · m₂ = −1", []);
  add(n11form && n11form.ok && !n11form.solved ? { ok: true, id: "n11-formula-first" } : fail("n11-formula-first", JSON.stringify(n11form)));

  var n13 = chk(13, "5", []);
  add(n13 && n13.ok ? { ok: true, id: "n13-neg-to-pos" } : fail("n13-neg-to-pos", JSON.stringify(n13)));

  var fakeDone = reconstruct(engine, packFor(engine, "geo-perp-1", 1), [], { done: { perp: true }, lastExpr: { perp: "כן" } });
  add(!(fakeDone.done && fakeDone.done.perp) ? { ok: true, id: "no-trust-client-done" } : fail("no-trust-client-done", JSON.stringify(fakeDone.done)));

  var setup1 = via(handler, { intent: "setup", levelId: "geo-perp-1", n: 1, history: [], geo: {} });
  add(setup1 && setup1.server && setup1.capability === "perpendicular" ? { ok: true, id: "setup-n1" } : fail("setup-n1", JSON.stringify(setup1)));

  var setup15 = via(handler, { intent: "setup", levelId: "geo-perp-1", n: 15, history: [], geo: {} });
  add(setup15 && setup15.server && setup15.capability === "slope" ? { ok: true, id: "setup-n15-slope" } : fail("setup-n15-slope", JSON.stringify(setup15)));

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/isGeoPerpPage/.test(src) && /geo-perp-1/.test(src) ? { ok: true, id: "gate-page" } : fail("gate-page", "missing"));
  add(/showBasicEqServerUnavailable/.test(src) && /isGeoPerpPage/.test(src) ? { ok: true, id: "node-off-wired" } : fail("node-off-wired", "missing"));

  var geoApi = fs.readFileSync(path.join(__dirname, "geometry.js"), "utf8");
  add(/capability === "perpendicular"/.test(geoApi) ? { ok: true, id: "capability-wired" } : fail("capability-wired", "missing"));

  console.log("parity-geo-perp: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 60).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
