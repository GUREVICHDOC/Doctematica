"use strict";

var loadEngine = require("./load-engine").loadEngine;
var functionsApi = require("./functions");
var probe = require("./level-probe");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function main() {
  var engine = loadEngine();
  var handler = functionsApi.createFunctionsHandler(engine);
  var M = engine.DoctematicaFnModel;
  var checks = [];
  function add(item) { checks.push(item); }
  function ask(id, body) {
    body.levelId = "calc-extrema-1";
    body.exerciseId = id;
    if (body.progress) body.progress = JSON.parse(JSON.stringify(body.progress));
    return handler.handle(body);
  }
  function exOf(id) {
    var levels = engine.DoctematicaCurriculum.levels;
    var level = levels.filter(function (item) { return item.id === "calc-extrema-1"; })[0];
    return level.exercises.filter(function (item) { return item.id === id; })[0];
  }

  ["calc-extrema-1-ex-a021", "calc-extrema-1-ex-a022", "calc-extrema-1-ex-a023", "calc-extrema-1-ex-a024", "calc-extrema-1-ex-a025"].forEach(function (id) {
    var ex = exOf(id);
    var agree = true;
    (ex.parts || []).forEach(function (part) {
      (part.tasks || []).forEach(function (task) {
        if (task.kind !== "probeCount") return;
        var qy = M.qyForLevel(ex.figure.anchors, task.k);
        var seen = probe.crossings(ex.figure.curve, qy).length;
        var want = probe.probeCount(ex.profile, task.k);
        if (seen !== want) agree = false;
      });
    });
    add(agree ? { ok: true, id: id + "-geometry" } : fail(id + "-geometry", "curve crossings differ from the profile"));
  });

  var high = ask("calc-extrema-1-ex-a021", { intent: "check", typed: "2" });
  add(high.ok && high.show === "2" && high.view.part.label === "ב" ? { ok: true, id: "a021-two" } : fail("a021-two", high.errorId + " " + high.show));
  var touch = ask("calc-extrema-1-ex-a021", { intent: "check", progress: high.progress, typed: "נקודה אחת" });
  add(touch.ok && touch.show === "1" ? { ok: true, id: "a021-touch" } : fail("a021-touch", touch.errorId + " " + touch.message));
  var none = ask("calc-extrema-1-ex-a021", { intent: "check", progress: touch.progress, typed: "אין" });
  add(none.ok && none.solved ? { ok: true, id: "a021-none" } : fail("a021-none", none.errorId));
  var twice = ask("calc-extrema-1-ex-a021", { intent: "check", progress: high.progress, typed: "2" });
  add(twice.errorId === "countedTangentTwice" ? { ok: true, id: "a021-twice" } : fail("a021-twice", twice.errorId));
  var missed = ask("calc-extrema-1-ex-a021", { intent: "check", progress: high.progress, typed: "0" });
  add(missed.errorId === "missedTangentIntersection" ? { ok: true, id: "a021-missed-touch" } : fail("a021-missed-touch", missed.errorId));
  var xConf = ask("calc-extrema-1-ex-a021", { intent: "check", typed: "4" });
  add(xConf.errorId === "confusedXWithYLevel" ? { ok: true, id: "a021-x" } : fail("a021-x", xConf.errorId + " " + xConf.message));

  var low = ask("calc-extrema-1-ex-a022", { intent: "check", typed: "1" });
  var atMax = ask("calc-extrema-1-ex-a022", { intent: "check", progress: low.progress, typed: "2" });
  var mid = ask("calc-extrema-1-ex-a022", { intent: "check", progress: atMax.progress, typed: "3" });
  add(low.ok && atMax.ok && mid.ok && mid.solved ? { ok: true, id: "a022-counts" } : fail("a022-counts", [low, atMax, mid].map(function (item) { return item.errorId || item.show; }).join(" ")));
  var onlyTouch = ask("calc-extrema-1-ex-a022", { intent: "check", progress: low.progress, typed: "1" });
  add(onlyTouch.errorId === "missedOuterBranch" ? { ok: true, id: "a022-outer" } : fail("a022-outer", onlyTouch.errorId + " " + onlyTouch.message));
  var para = ask("calc-extrema-1-ex-a022", { intent: "check", progress: atMax.progress, typed: "2" });
  add(para.errorId === "assumedParabola" ? { ok: true, id: "a022-parabola" } : fail("a022-parabola", para.errorId));

  var f5 = ask("calc-extrema-1-ex-a023", { intent: "check", typed: "1" });
  var f1 = ask("calc-extrema-1-ex-a023", { intent: "check", progress: f5.progress, typed: "שלוש" });
  var f0 = ask("calc-extrema-1-ex-a023", { intent: "check", progress: f1.progress, typed: "2" });
  add(f5.ok && f1.ok && f0.ok && f0.solved ? { ok: true, id: "a023-fx" } : fail("a023-fx", [f5, f1, f0].map(function (item) { return item.errorId || item.show; }).join(" ")));
  var asX = ask("calc-extrema-1-ex-a023", { intent: "check", typed: "x=5" });
  add(asX.errorId === "treatedFxEqualsKDifferentlyFromYEqualsK" ? { ok: true, id: "a023-form" } : fail("a023-form", asX.errorId + " " + asX.message));
  var height = ask("calc-extrema-1-ex-a023", { intent: "check", typed: "5" });
  add(height.errorId === "treatedFxEqualsKDifferentlyFromYEqualsK" ? { ok: true, id: "a023-height" } : fail("a023-height", height.errorId));

  var one = ask("calc-extrema-1-ex-a024", { intent: "check", typed: "k<0 או k>2" });
  var two = ask("calc-extrema-1-ex-a024", { intent: "check", progress: one.progress, typed: "k=0, k=2" });
  var three = ask("calc-extrema-1-ex-a024", { intent: "check", progress: two.progress, typed: "0<k<2" });
  add(one.ok && two.ok && three.ok && three.solved ? { ok: true, id: "a024-bands" } : fail("a024-bands", [one, two, three].map(function (item) { return (item.errorId || item.show || "") + " " + (item.message || ""); }).join(" | ")));
  var wide = ask("calc-extrema-1-ex-a024", { intent: "check", progress: two.progress, typed: "0≤k≤2" });
  add(wide.errorId === "includedCriticalK" ? { ok: true, id: "a024-included" } : fail("a024-included", wide.errorId + " " + wide.message));
  var openEnd = ask("calc-extrema-1-ex-a024", { intent: "check", typed: "k≤0 או k>2" });
  add(openEnd.errorId === "includedCriticalK" ? { ok: true, id: "a024-closed-ray" } : fail("a024-closed-ray", openEnd.errorId + " " + openEnd.message));
  var half = ask("calc-extrema-1-ex-a024", { intent: "check", typed: "k>2" });
  add(half.errorId === "ignoredLocalMinimum" ? { ok: true, id: "a024-half" } : fail("a024-half", half.errorId + " " + half.message));
  var hint = ask("calc-extrema-1-ex-a024", { intent: "hint" });
  add(hint.ok && hint.hints[0].indexOf("מלמטה למעלה") >= 0 && hint.hints.join(" ").indexOf("k<") < 0
    ? { ok: true, id: "a024-hint" }
    : fail("a024-hint", (hint.hints || []).join(" / ")));

  var w2 = ask("calc-extrema-1-ex-a025", { intent: "check", typed: "k=0 או k>1" });
  var w3 = ask("calc-extrema-1-ex-a025", { intent: "check", progress: w2.progress, typed: "k=1" });
  var w4 = ask("calc-extrema-1-ex-a025", { intent: "check", progress: w3.progress, typed: "0<k<1" });
  var w0 = ask("calc-extrema-1-ex-a025", { intent: "check", progress: w4.progress, typed: "k<0" });
  add(w2.ok && w3.ok && w4.ok && w0.ok && w0.solved ? { ok: true, id: "a025-w" } : fail("a025-w", [w2, w3, w4, w0].map(function (item) { return (item.errorId || item.show || "") + " " + (item.message || ""); }).join(" | ")));
  var dropped = ask("calc-extrema-1-ex-a025", { intent: "check", typed: "k>1" });
  add(dropped.errorId === "excludedCriticalK" ? { ok: true, id: "a025-excluded" } : fail("a025-excluded", dropped.errorId + " " + dropped.message));
  var opened = ask("calc-extrema-1-ex-a021", { intent: "probe-check", probe: { on: false } });
  add(!opened.ok && /ישר/.test(opened.message) ? { ok: true, id: "probe-before-line" } : fail("probe-before-line", opened.message));
  var ex21 = exOf("calc-extrema-1-ex-a021");
  var qy10 = M.qyForLevel(ex21.figure.anchors, 10);
  var marked = ask("calc-extrema-1-ex-a021", { intent: "probe-check", probe: { on: true, qy: qy10 } });
  add(marked.ok && marked.probeMarkers && marked.probeMarkers.length === 2 && !marked.show
    ? { ok: true, id: "probe-markers" }
    : fail("probe-markers", String(marked.probeMarkers && marked.probeMarkers.length)));
  var step = ask("calc-extrema-1-ex-a024", { intent: "one-step" });
  add(step.ok && step.show.indexOf("k<") < 0 && step.show.indexOf("0<") < 0
    ? { ok: true, id: "a024-step-holds" }
    : fail("a024-step-holds", step.show));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-level-probe: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log("FAIL", item.id, item.detail); });
  if (failed.length) process.exit(1);
}

main();
