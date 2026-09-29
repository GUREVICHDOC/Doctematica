"use strict";

var loadEngine = require("./load-engine").loadEngine;
var createFunctionsHandler = require("./functions").createFunctionsHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function walk(handler, index) {
  var progress = null;
  var shows = [];
  var guard = 0;
  while (guard < 160) {
    guard += 1;
    var step = handler.handle({
      intent: "one-step",
      levelId: "calc-quad-1",
      exerciseIndex: index,
      progress: progress,
    });
    if (!step || step.ok === false) {
      return { ok: false, shows: shows, message: step && step.message, progress: progress };
    }
    if (step.show) shows.push(step.show);
    progress = step.progress;
    if (step.solved) return { ok: true, shows: shows, progress: progress };
    if (!step.show) return { ok: false, shows: shows, message: "no show", progress: progress };
  }
  return { ok: false, shows: shows, message: "guard", progress: progress };
}

function main() {
  var engine = loadEngine();
  var handler = createFunctionsHandler(engine);
  var checks = [];
  function add(result) {
    checks.push(result);
  }

  var level = engine.DoctematicaCurriculum.levels.filter(function (item) {
    return item.id === "calc-quad-1";
  })[0];
  add(level && level.exercises.length === 12 && level.exercises[5].parts.length === 4 && level.exercises[8].parts.length === 5
    && level.exercises[10].parts.length === 7 && !/ח/.test(level.exercises[10].parts.map(function (part) { return part.label; }).join(""))
    ? { ok: true, id: "page" }
    : fail("page", String(level && level.exercises.length)));

  var i;
  for (i = 0; i < 12; i++) {
    var traced = walk(handler, i);
    add(traced.ok
      ? { ok: true, id: "walk-" + (i + 1) }
      : fail("walk-" + (i + 1), (traced.message || "") + " || " + traced.shows.join(" | ")));
  }

  var ex1 = walk(handler, 0);
  var text1 = (ex1.shows || []).join(" | ");
  add(ex1.ok && /f\(−2\)/.test(text1) && /27/.test(text1) && /x = 2/.test(text1) && /x = 6/.test(text1) && /\(4,−9\)/.test(text1)
    ? { ok: true, id: "ex1-answers" }
    : fail("ex1-answers", text1));

  var ex4 = walk(handler, 3);
  var text4 = (ex4.shows || []).join(" | ");
  var heads = [];
  var labelProgress = null;
  var guard4 = 0;
  var endMarks = [];
  while (guard4 < 160) {
    guard4 += 1;
    var step4 = handler.handle({
      intent: "one-step",
      levelId: "calc-quad-1",
      exerciseIndex: 3,
      progress: labelProgress,
    });
    if (!step4 || step4.ok === false) break;
    if (step4.heading) heads.push(step4.heading);
    labelProgress = step4.progress;
    endMarks = (step4.view && step4.view.figure && step4.view.figure.marks) || endMarks;
    if (step4.solved) break;
  }
  var endText = endMarks.map(function (mark) { return mark.label; }).join(" | ");
  add(ex4.ok && /A\(0,−5\)/.test(text4) && /M\(2,−9\)/.test(text4)
    && /A\(0,−5\)/.test(endText) && /B\(−1,0\)/.test(endText) && /C\(5,0\)/.test(endText) && /M\(2,−9\)/.test(endText)
    && heads.indexOf("נקודה A (ציר y)") >= 0 && heads.indexOf("נקודה B (ציר x)") >= 0 && heads.indexOf("נקודה C (ציר x)") >= 0 && heads.indexOf("נקודה M (קודקוד)") >= 0
    ? { ok: true, id: "point-headings" }
    : fail("point-headings", text4 + " || marks " + endText + " || heads " + heads.join(" / ")));

  var ex3 = walk(handler, 2);
  var text3 = (ex3.shows || []).join(" | ");
  add(ex3.ok && /1\.25/.test(text3) && /1\.125/.test(text3)
    ? { ok: true, id: "vertex-decimal" }
    : fail("vertex-decimal", text3));

  var ex5 = walk(handler, 4);
  var text5 = (ex5.shows || []).join(" | ");
  add(ex5.ok && /או/.test(text5) && text5.indexOf("2") >= 0
    ? { ok: true, id: "sign-union" }
    : fail("sign-union", text5));

  var M = engine.DoctematicaFnModel;
  var fn = M.analyze("x^2-8x+12");
  var pos = M.signRegions(fn).filter(function (r) { return r.sign === "pos"; });
  add(pos.length === 2 ? { ok: true, id: "two-positive" } : fail("two-positive", JSON.stringify(pos)));

  var opened = handler.handle({ intent: "hint", levelId: "calc-quad-1", exerciseIndex: 4 });
  add(opened.view && opened.view.figure && opened.view.figure.curve && opened.view.figure.curve.length > 8
    ? { ok: true, id: "parabola-figure" }
    : fail("parabola-figure", JSON.stringify(opened.view && opened.view.figure && opened.view.figure.curve && opened.view.figure.curve.length)));

  var countView = handler.handle({
    intent: "hint",
    levelId: "calc-quad-1",
    exerciseIndex: 4,
    progress: { done: { min: true, mono: true, minval: true, zeros: true, sign: true }, phase: {}, eq: {}, rootKnown: true, vertexKnown: true, axes: {}, regions: {}, got: {} },
  });
  add(countView.view && countView.view.reference && countView.view.reference.k === -2
    ? { ok: true, id: "reference-flag" }
    : fail("reference-flag", JSON.stringify(countView.view && countView.view.reference)));

  var ex7 = walk(handler, 6);
  var text7 = (ex7.shows || []).join(" | ");
  add(ex7.ok && /a = 1, b = −2, c = −3/.test(text7) && /מינימום/.test(text7) && /\(−1,0\)/.test(text7) && /\(3,0\)/.test(text7)
    ? { ok: true, id: "investigate-two-roots" }
    : fail("investigate-two-roots", text7));

  var ex8 = walk(handler, 7);
  var text8 = (ex8.shows || []).join(" | ");
  add(ex8.ok && /מקסימום/.test(text8) && /\(3,0\)/.test(text8) && /6x/.test(text8) && /חיובי: אין/.test(text8)
    ? { ok: true, id: "investigate-touch" }
    : fail("investigate-touch", text8));

  var ex9 = walk(handler, 8);
  var text9 = (ex9.shows || []).join(" | ");
  add(ex9.ok && /אין חיתוך עם ציר x/.test(text9) && /כל x/.test(text9) && /מינימום/.test(text9)
    ? { ok: true, id: "investigate-no-root" }
    : fail("investigate-no-root", text9));

  var badB = handler.handle({
    intent: "check",
    levelId: "calc-quad-1",
    exerciseIndex: 6,
    typed: "a=1, b=2, c=-3",
  });
  add(badB && badB.ok === false && /b/.test(badB.message || "")
    ? { ok: true, id: "vertex-b-sign" }
    : fail("vertex-b-sign", badB && badB.message));

  var ex10 = walk(handler, 9);
  var text10 = (ex10.shows || []).join(" | ");
  add(ex10.ok && /2 < x < 8/.test(text10) && /y ≤ 9/.test(text10) && /x < 5/.test(text10) && /k = 9/.test(text10) && /k < 9/.test(text10) && /k > 9/.test(text10)
    ? { ok: true, id: "range-and-level" }
    : fail("range-and-level", text10));

  var ex11 = walk(handler, 10);
  var text11 = (ex11.shows || []).join(" | ");
  add(ex11.ok && /\(5,−16\)/.test(text11) && /5 < x < 9/.test(text11) && /x < 1/.test(text11) && text11.indexOf("לא") >= 0 && text11.indexOf("כן") >= 0
    ? { ok: true, id: "both-and-claim" }
    : fail("both-and-claim", text11));

  var ex12 = walk(handler, 11);
  var text12 = (ex12.shows || []).join(" | ");
  add(ex12.ok && /x \+ 4/.test(text12) && /x = −4/.test(text12) && /מינימום/.test(text12) && /y ≥ −9/.test(text12) && /k = −9/.test(text12)
    ? { ok: true, id: "product-and-range" }
    : fail("product-and-range", text12));

  var strictRange = handler.handle({
    intent: "check",
    levelId: "calc-quad-1",
    exerciseIndex: 9,
    typed: "y<9",
    progress: { done: { pos: true, maxpick: true }, phase: {}, eq: {}, rootKnown: true, vertexKnown: true, vertexY: 9, axes: {}, regions: {}, got: {} },
  });
  add(strictRange && strictRange.ok === false && /≤/.test(strictRange.message || "")
    ? { ok: true, id: "range-strict" }
    : fail("range-strict", strictRange && strictRange.message));

  var xAsMax = handler.handle({
    intent: "check",
    levelId: "calc-quad-1",
    exerciseIndex: 9,
    typed: "5",
    progress: { done: { pos: true }, phase: { maxpick: "pick" }, eq: {}, rootKnown: true, vertexKnown: true, vertexY: 9, vertexX: 5, axes: {}, regions: {}, got: {} },
  });
  add(xAsMax && xAsMax.ok === false && /x/.test(xAsMax.message || "")
    ? { ok: true, id: "max-uses-x" }
    : fail("max-uses-x", xAsMax && xAsMax.message));

  var flippedK = handler.handle({
    intent: "check",
    levelId: "calc-quad-1",
    exerciseIndex: 9,
    typed: "k>9",
    progress: { done: { pos: true, maxpick: true, range: true, inc: true, k1: true }, phase: {}, eq: {}, rootKnown: true, vertexKnown: true, vertexY: 9, axes: {}, regions: {}, got: {} },
  });
  add(flippedK && flippedK.ok === false && /שני חיתוכים|אפס/.test(flippedK.message || "")
    ? { ok: true, id: "level-swapped" }
    : fail("level-swapped", flippedK && flippedK.message));

  var unionBoth = handler.handle({
    intent: "check",
    levelId: "calc-quad-1",
    exerciseIndex: 10,
    typed: "x>5 או 1<x<9",
    progress: { done: { vertex: true, zeros: true, y0: true, sketch: true }, phase: {}, eq: {}, rootKnown: true, vertexKnown: true, vertexY: -16, axes: {}, regions: {}, got: {} },
  });
  add(unionBoth && unionBoth.ok === false && /או/.test(unionBoth.message || "")
    ? { ok: true, id: "both-union" }
    : fail("both-union", unionBoth && unionBoth.message));

  var bothClaims = handler.handle({
    intent: "check",
    levelId: "calc-quad-1",
    exerciseIndex: 10,
    typed: "כן",
    progress: { done: { vertex: true, zeros: true, y0: true, sketch: true, upneg: true, downpos: true }, phase: {}, eq: {}, rootKnown: true, vertexKnown: true, vertexY: -16, axes: {}, regions: {}, got: {} },
  });
  add(bothClaims && bothClaims.ok === false && />/.test(bothClaims.message || "") && /≥/.test(bothClaims.message || "") && !/נכונה/.test(bothClaims.message || "")
    ? { ok: true, id: "claim-strict" }
    : fail("claim-strict", bothClaims && bothClaims.message));

  var signRoot = handler.handle({
    intent: "check",
    levelId: "calc-quad-1",
    exerciseIndex: 11,
    typed: "x=4",
    progress: { done: {}, phase: {}, eq: { "axes:x": "(x+4)(x-2)=0" }, axes: { axes: { y: "done", x: "set" } }, rootKnown: false, vertexKnown: false, axesReady: true, regions: {}, got: {} },
  });
  add(signRoot && signRoot.ok === false && /סימן/.test(signRoot.message || "")
    ? { ok: true, id: "factor-sign" }
    : fail("factor-sign", signRoot && signRoot.message));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-fn-quad: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL", item.id, item.detail);
  });
  if (failed.length) process.exit(1);
}

main();
