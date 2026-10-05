"use strict";

var loadEngine = require("./load-engine").loadEngine;
var freeSketch = require("./free-sketch");
var studentDto = require("./student-dto");
var functionsApi = require("./functions");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function layout(pairs) {
  var xs = [];
  var ys = [];
  pairs.forEach(function (pt) {
    if (xs.indexOf(pt.x) < 0) xs.push(pt.x);
    if (ys.indexOf(pt.y) < 0) ys.push(pt.y);
  });
  xs.sort(function (a, b) { return a - b; });
  ys.sort(function (a, b) { return a - b; });
  function qxOf(x) {
    if (x === 0) return 0;
    var group = xs.filter(function (value) { return x < 0 ? value < 0 : value > 0; });
    var index = group.indexOf(x);
    if (x < 0) return -0.28 - 0.16 * (group.length - 1 - index);
    return 0.28 + 0.16 * index;
  }
  function qyOf(y) {
    if (y === 0) return 0;
    var group = ys.filter(function (value) { return y < 0 ? value < 0 : value > 0; });
    var index = group.indexOf(y);
    if (y < 0) return -0.24 - 0.14 * (group.length - 1 - index);
    return 0.24 + 0.14 * index;
  }
  return pairs.map(function (pt) {
    return { x: pt.x, y: pt.y, qx: qxOf(pt.x), qy: qyOf(pt.y), role: "given" };
  });
}

function strokeThrough(points, bump) {
  var sorted = points.slice().sort(function (a, b) { return a.x - b.x; });
  var samples = [];
  var i;
  var k;
  for (i = 0; i < sorted.length - 1; i++) {
    var a = sorted[i];
    var b = sorted[i + 1];
    var steps = 10;
    for (k = 0; k <= steps; k++) {
      var t = k / steps;
      var lift = 0;
      if (typeof bump === "function") lift = bump(a, b, t) || 0;
      else if (bump && k > 0 && k < steps) lift = bump * Math.sin(Math.PI * t);
      samples.push({
        qx: a.qx + (b.qx - a.qx) * t,
        qy: a.qy + (b.qy - a.qy) * t + lift,
      });
    }
  }
  return samples;
}

function board(points, samples) {
  return { points: points, strokes: [samples] };
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) {
    checks.push(result);
  }
  function exOf(id) {
    var found = null;
    (engine.DoctematicaCurriculum.levels || []).forEach(function (level) {
      (level.exercises || []).forEach(function (ex) {
        if (ex.id === id) found = ex;
      });
    });
    return found;
  }
  function ask(ex, body) {
    return freeSketch.handle(engine, ex, body || {});
  }

  var ex1 = exOf("calc-sketch-1-ex-a001");
  var ex2 = exOf("calc-sketch-1-ex-a002");
  var ex3 = exOf("calc-sketch-1-ex-a003");
  var ex4 = exOf("calc-sketch-1-ex-a004");
  add(ex1 && ex2 && ex3 && ex4 ? { ok: true, id: "exercises-present" } : fail("exercises-present", ""));

  var opened = studentDto.openProblem(engine, "calc-sketch-1", 0);
  add(opened && opened.view && opened.view.family === "free" && opened.view.input === "sketch" && opened.view.sketch
    ? { ok: true, id: "opening-free-sketch" }
    : fail("opening-free-sketch", JSON.stringify(opened && opened.view)));
  add(opened && opened.problem && !opened.problem.constraints && opened.problem.displayNumber === 1
    ? { ok: true, id: "answers-stay-on-server" }
    : fail("answers-stay-on-server", ""));
  var catalog = studentDto.catalog(engine);
  var pre = ((catalog.subtopics || {}).calculus || []).some(function (item) { return item.id === "pre"; });
  var listed = (catalog.levels || []).filter(function (level) { return level.id === "calc-sketch-1"; })[0];
  add(pre && listed && listed.subtopic === "pre" && listed.exercises.length === 4
    ? { ok: true, id: "catalog-pre" }
    : fail("catalog-pre", ""));

  var routed = functionsApi.createFunctionsHandler(engine).handle({
    intent: "hint",
    levelId: "calc-sketch-1",
    exerciseId: "calc-sketch-1-ex-a001",
    exerciseIndex: 0,
  });
  add(routed && routed.ok && /f\(a\)=b/.test(routed.hint || "")
    ? { ok: true, id: "routed-opening-hint" }
    : fail("routed-opening-hint", routed && routed.hint));

  var pts1 = layout([{ x: 0, y: 5 }, { x: 2, y: 1 }, { x: 5, y: 10 }]);
  var straight = ask(ex1, { intent: "sketch", sketch: board(pts1, strokeThrough(pts1, 0)) });
  add(straight.ok && straight.show === "סקיצה אפשרית" ? { ok: true, id: "straight-still-possible" } : fail("straight-still-possible", straight.message));
  var bumpy = ask(ex1, { intent: "sketch", sketch: board(pts1, strokeThrough(pts1, 0.07)) });
  add(bumpy.ok ? { ok: true, id: "bump-not-required-monotone" } : fail("bump-not-required-monotone", bumpy.message));
  var squeezed = pts1.map(function (pt) {
    return { x: pt.x, y: pt.y, qx: pt.qx, qy: pt.y === 10 ? 0.42 : pt.qy, role: "given" };
  });
  var relative = ask(ex1, { intent: "sketch", sketch: board(squeezed, strokeThrough(squeezed, 0)) });
  add(relative.ok ? { ok: true, id: "relative-not-pixel" } : fail("relative-not-pixel", relative.message));

  var swapped = ask(ex1, { intent: "sketch-point", point: { x: 1, y: 2, qx: 0.2, qy: 0.3 }, sketch: { points: [] } });
  add(swapped.errorId === "swappedCoordinates" && /x=2 ו־y=1/.test(swapped.message)
    ? { ok: true, id: "swappedCoordinates" }
    : fail("swappedCoordinates", swapped.message));
  var wrongSide = ask(ex1, { intent: "sketch-point", point: { x: 2, y: 1, qx: -0.4, qy: 0.24 }, sketch: { points: [] } });
  add(wrongSide.errorId === "pointOnWrongSideOfAxis" ? { ok: true, id: "pointOnWrongSideOfAxis" } : fail("pointOnWrongSideOfAxis", wrongSide.errorId));
  var yAxis = ask(ex1, { intent: "sketch-point", point: { x: 0, y: 5, qx: 0.45, qy: 0.38 }, sketch: { points: [] } });
  add(yAxis.errorId === "wrongYIntercept" ? { ok: true, id: "wrongYIntercept" } : fail("wrongYIntercept", yAxis.errorId));
  var given = ask(ex1, { intent: "sketch-point", point: pts1[0], sketch: { points: [] } });
  add(given.ok && given.role === "given" ? { ok: true, id: "given-role" } : fail("given-role", given.role));
  var unrelated = ask(ex1, { intent: "sketch-point", point: { x: 2, y: 12, qx: 0.3, qy: 0.15 }, sketch: { points: pts1 } });
  add(unrelated.errorId === "unrelatedPoint" && /f\(2\)=1/.test(unrelated.message) && /לא \(2,12\)/.test(unrelated.message) && !/סדר הגבהים/.test(unrelated.message)
    ? { ok: true, id: "unrelated-known-x" }
    : fail("unrelated-known-x", unrelated.message));
  var stray = ask(ex1, { intent: "sketch-point", point: { x: 4, y: 7, qx: 0.5, qy: 0.4 }, sketch: { points: [] } });
  add(stray.errorId === "unrelatedPoint" && /אינה נובעת מהנתונים/.test(stray.message) && !/סדר/.test(stray.message)
    ? { ok: true, id: "unrelated-point" }
    : fail("unrelated-point", stray.message));
  var badX = ask(ex1, { intent: "sketch-point", point: { x: 5, y: 10, qx: 0.1, qy: pts1[2].qy }, sketch: { points: [pts1[0], pts1[1]] } });
  add(badX.errorId === "wrongRelativeXOrder" ? { ok: true, id: "wrongRelativeXOrder" } : fail("wrongRelativeXOrder", badX.errorId + " " + badX.message));
  var badY = ask(ex1, { intent: "sketch-point", point: { x: 2, y: 1, qx: pts1[1].qx, qy: 0.7 }, sketch: { points: [pts1[0]] } });
  add(badY.errorId === "wrongRelativeYOrder" ? { ok: true, id: "wrongRelativeYOrder" } : fail("wrongRelativeYOrder", badY.message));

  var missing = ask(ex1, { intent: "sketch", sketch: board([pts1[0], pts1[1]], strokeThrough([pts1[0], pts1[1]], 0)) });
  add(missing.errorId === "missingGivenPoint" ? { ok: true, id: "missingGivenPoint" } : fail("missingGivenPoint", missing.errorId));
  var skipMiddle = strokeThrough([pts1[0], pts1[2]], 0);
  var missed = ask(ex1, { intent: "sketch", sketch: board(pts1, skipMiddle) });
  add(missed.errorId === "curveMissesRequiredPoint" ? { ok: true, id: "curveMissesRequiredPoint" } : fail("curveMissesRequiredPoint", missed.errorId + " " + missed.message));
  var shortPath = strokeThrough([pts1[0], pts1[1]], 0);
  var outside = ask(ex1, { intent: "sketch", sketch: board(pts1, shortPath) });
  add(outside.errorId === "outsideDomain" ? { ok: true, id: "outsideDomain" } : fail("outsideDomain", outside.errorId + " " + outside.message));
  var past = strokeThrough(pts1, 0).concat([{ qx: pts1[2].qx + 0.55, qy: pts1[2].qy }]);
  var continued = ask(ex1, { intent: "sketch", sketch: board(pts1, past) });
  add(continued.errorId === "continuedPastDomain" ? { ok: true, id: "continuedPastDomain" } : fail("continuedPastDomain", continued.errorId + " " + continued.message));
  var loop = [];
  var t;
  for (t = 0; t <= 8; t++) loop.push({ qx: t * 0.08, qy: 0.3 });
  for (t = 7; t >= 0; t--) loop.push({ qx: t * 0.08, qy: -0.2 });
  var folded = ask(ex1, { intent: "sketch", sketch: board(pts1, loop) });
  add(folded.errorId === "verticalLineTestViolation" && /יותר מערך y אחד/.test(folded.message)
    ? { ok: true, id: "verticalLineTestViolation" }
    : fail("verticalLineTestViolation", folded.errorId + " " + folded.message));

  var partB = { partIndex: 1, taskIndex: 0, done: { sketch: true }, answers: {} };
  var yes6 = ask(ex1, { intent: "check", typed: "כן", progress: partB, sketch: board(pts1, strokeThrough(pts1, 0)) });
  add(yes6.ok && yes6.show === "כן" ? { ok: true, id: "f3-eq-6-possible" } : fail("f3-eq-6-possible", yes6.message));
  var yes8 = ask(ex1, { intent: "check", typed: "כן", progress: { partIndex: 1, taskIndex: 1, done: { sketch: true, y6: true }, answers: {} } });
  add(yes8.ok ? { ok: true, id: "f3-eq-8-possible" } : fail("f3-eq-8-possible", yes8.message));
  var assumed = ask(ex1, { intent: "check", typed: "לא", progress: partB, sketch: board(pts1, strokeThrough(pts1, 0)) });
  add(assumed.errorId === "assumedStraightLineBetweenPoints" ? { ok: true, id: "assumedStraightLineBetweenPoints" } : fail("assumedStraightLineBetweenPoints", assumed.errorId));
  var userPoint = { x: 3, y: 6, qx: (pts1[1].qx + pts1[2].qx) / 2, qy: (pts1[0].qy + pts1[2].qy) / 2, role: "user" };
  var shown = pts1.concat([userPoint]);
  var clash = ask(ex1, { intent: "check", typed: "לא", progress: partB, sketch: board(shown, strokeThrough(pts1, 0)) });
  add(clash.errorId === "contradictsPreviousAnswer" ? { ok: true, id: "contradictsPreviousAnswer" } : fail("contradictsPreviousAnswer", clash.errorId + " " + clash.message));

  var pts2 = layout([{ x: -2, y: -6 }, { x: 1, y: 3 }, { x: 3, y: -1 }]);
  var sketch2 = ask(ex2, { intent: "sketch", sketch: board(pts2, strokeThrough(pts2, 0.05)) });
  add(sketch2.ok ? { ok: true, id: "ex2-sketch" } : fail("ex2-sketch", sketch2.message));
  var twice = ask(ex2, { intent: "check", typed: "כן", progress: { partIndex: 2, taskIndex: 0, done: {}, answers: {} } });
  add(twice.ok ? { ok: true, id: "twice-possible" } : fail("twice-possible", twice.message));
  var twiceNo = ask(ex2, { intent: "check", typed: "לא", progress: { partIndex: 2, taskIndex: 0, done: {}, answers: {} } });
  add(twiceNo.errorId === "treatedPossibleAsNecessary" ? { ok: true, id: "treatedPossibleAsNecessary" } : fail("treatedPossibleAsNecessary", twiceNo.errorId));
  var once = ask(ex2, { intent: "check", typed: "כן", progress: { partIndex: 2, taskIndex: 1, done: {}, answers: {} } });
  add(once.errorId === "missingRequiredZero" ? { ok: true, id: "missingRequiredZero" } : fail("missingRequiredZero", once.errorId + " " + once.message));
  var onceNo = ask(ex2, { intent: "check", typed: "לא", progress: { partIndex: 2, taskIndex: 1, done: {}, answers: {} } });
  add(onceNo.ok && onceNo.show === "לא" ? { ok: true, id: "once-impossible" } : fail("once-impossible", onceNo.message));
  var z1 = ask(ex2, { intent: "check", typed: "כן", progress: { partIndex: 1, taskIndex: 0, done: {}, answers: {} } });
  var z0 = ask(ex2, { intent: "check", typed: "כן", progress: { partIndex: 1, taskIndex: 1, done: {}, answers: {} } });
  add(z1.ok && z0.ok ? { ok: true, id: "ex2-zeros-possible" } : fail("ex2-zeros-possible", (z1.message || "") + " | " + (z0.message || "")));

  var pts3 = layout([{ x: 0, y: -9 }, { x: 1, y: -11 }, { x: 5, y: 11 }, { x: 6, y: 9 }]);
  var sketch3 = ask(ex3, { intent: "sketch", sketch: board(pts3, strokeThrough(pts3, 0)) });
  add(sketch3.ok ? { ok: true, id: "ex3-sketch" } : fail("ex3-sketch", sketch3.message));
  var wiggle = [];
  var leg = strokeThrough([pts3[0], { x: 0.4, y: 9, qx: 0.12, qy: 0.3, role: "user" }], 0);
  wiggle = wiggle.concat(leg);
  wiggle = wiggle.concat(strokeThrough([{ x: 0.4, y: 9, qx: 0.12, qy: 0.3 }, pts3[1], pts3[2], pts3[3]], 0));
  var extraZeros = ask(ex3, { intent: "sketch", sketch: board(pts3, wiggle) });
  add(extraZeros.ok ? { ok: true, id: "extra-zeros-allowed" } : fail("extra-zeros-allowed", extraZeros.message));
  var least = ask(ex3, { intent: "check", typed: "1", progress: { partIndex: 1, taskIndex: 0, done: { sketch: true }, answers: {} } });
  add(least.ok && least.show === "לפחות 1" ? { ok: true, id: "minimum-one" } : fail("minimum-one", least.show + " " + least.message));
  var exact = ask(ex3, { intent: "check", typed: "3", progress: { partIndex: 1, taskIndex: 0, done: { sketch: true }, answers: {} } });
  add(exact.errorId === "treatedMinimumAsExact" ? { ok: true, id: "treatedMinimumAsExact" } : fail("treatedMinimumAsExact", exact.errorId + " " + exact.message));
  var leastHint = ask(ex3, { intent: "hint", progress: { partIndex: 1, taskIndex: 0, done: { sketch: true }, answers: {} } });
  add(leastHint.hints && leastHint.hints.length && !/לפחות 1/.test(leastHint.hints[0])
    ? { ok: true, id: "least-hint-hides-count" }
    : fail("least-hint-hides-count", leastHint.hint));

  var pts4 = layout([{ x: -2, y: 0 }, { x: 0, y: 3 }, { x: 2, y: 6 }, { x: 6, y: 6 }]);
  var flat = ask(ex4, {
    intent: "sketch",
    sketch: board(pts4, strokeThrough(pts4, function (a, b, t) {
      if (a.y === 6 && b.y === 6) return 0.03 * Math.sin(Math.PI * t);
      return 0.05 * Math.sin(Math.PI * t);
    })),
  });
  add(flat.ok ? { ok: true, id: "constant-wobble-ok" } : fail("constant-wobble-ok", flat.message));
  var endsOnly = pts4.map(function (pt) { return { qx: pt.qx, qy: pt.qy }; });
  var ends = ask(ex4, { intent: "sketch", sketch: board(pts4, endsOnly) });
  add(ends.errorId === "constantIntervalNotConstant" ? { ok: true, id: "constantIntervalNotConstant" } : fail("constantIntervalNotConstant", ends.errorId + " " + ends.message));
  var dipped = ask(ex4, {
    intent: "sketch",
    sketch: board(pts4, strokeThrough(pts4, function (a, b, t) {
      if (a.y === 6 && b.y === 6) return -0.35 * Math.sin(Math.PI * t);
      return 0;
    })),
  });
  add(dipped.errorId === "constantIntervalNotConstant" ? { ok: true, id: "constant-dip" } : fail("constant-dip", dipped.errorId + " " + dipped.message));
  var wrongFlat = strokeThrough([pts4[0], pts4[1]], 0);
  var qx2 = pts4[2].qx;
  var qx6 = pts4[3].qx;
  var qy3 = pts4[1].qy;
  var k;
  for (k = 0; k <= 10; k++) wrongFlat.push({ qx: qx2 + (qx6 - qx2) * (k / 10), qy: qy3 });
  var wrongValue = ask(ex4, { intent: "sketch", sketch: board(pts4, wrongFlat) });
  add(wrongValue.errorId === "wrongConstantValue" ? { ok: true, id: "wrongConstantValue" } : fail("wrongConstantValue", wrongValue.errorId + " " + wrongValue.message));
  var xZero = ask(ex4, { intent: "sketch-point", point: { x: -2, y: 0, qx: pts4[0].qx, qy: 0.45 }, sketch: { points: [] } });
  add(xZero.errorId === "wrongXIntercept" ? { ok: true, id: "wrongXIntercept" } : fail("wrongXIntercept", xZero.errorId));
  var constantHint = ask(ex4, { intent: "hint", sketch: { points: pts4, strokes: [] } });
  add(constantHint.hints && constantHint.hints.some(function (line) { return /קבוע/.test(line); }) && constantHint.hints.some(function (line) { return /אופקי/.test(line); })
    ? { ok: true, id: "constant-hints" }
    : fail("constant-hints", (constantHint.hints || []).join(" | ")));

  var below = JSON.parse(JSON.stringify(ex1));
  below.constraints.push({ type: "MUST_BE_BELOW_X_AXIS", fromX: 0, toX: 2 });
  var band = ask(below, { intent: "sketch", sketch: board(pts1, strokeThrough(pts1, 0)) });
  add(!band.ok && /מתחת/.test(band.message || "") ? { ok: true, id: "below-axis-constraint" } : fail("below-axis-constraint", band.message));

  var solution = ask(ex1, { intent: "solution" });
  var solutionText = (solution.steps || []).join(" ");
  add(/סקיצה אפשרית/.test(solutionText) && !/הגרף הנכון/.test(solutionText)
    ? { ok: true, id: "solution-is-possible-sketch" }
    : fail("solution-is-possible-sketch", solutionText));
  var next = ask(ex1, { intent: "one-step", sketch: board(pts1, skipMiddle) });
  add(next.ok && next.show === "סקיצה אפשרית" && next.board && next.board.strokes && next.board.strokes[0] && next.board.strokes[0].length > 4 && !next.solved && next.view && next.view.part && next.view.part.label === "ב"
    ? { ok: true, id: "next-step-draws-over-gap" }
    : fail("next-step-draws-over-gap", (next.show || "") + " " + (next.view && next.view.part && next.view.part.label)));
  [ex1, ex2, ex3, ex4].forEach(function (ex) {
    var sketch = { points: [], strokes: [] };
    var progress = null;
    var counts = [];
    var guard = 0;
    var last = null;
    while (guard < 8) {
      last = ask(ex, { intent: "one-step", sketch: sketch, progress: progress });
      if (!last || !last.ok) break;
      if (last.board) sketch = last.board;
      progress = last.progress;
      counts.push((sketch.points || []).length + ":" + ((sketch.strokes && sketch.strokes[0] && sketch.strokes[0].length) || 0));
      if (last.show === "סקיצה אפשרית") break;
      guard += 1;
    }
    var needed = freeSketch.requiredPoints(ex).length;
    var pointSteps = counts.slice(0, -1);
    var grew = pointSteps.length === needed && pointSteps.every(function (item, index) {
      return Number(item.split(":")[0]) === index + 1 && Number(item.split(":")[1]) === 0;
    });
    var drew = last && last.ok && last.show === "סקיצה אפשרית" && last.board && last.board.strokes && last.board.strokes[0] && last.board.strokes[0].length > 4;
    add(grew && drew ? { ok: true, id: "one-step-marks-then-draws-" + ex.n } : fail("one-step-marks-then-draws-" + ex.n, counts.join(" | ") + " show=" + (last && last.show) + " " + (last && last.message)));
    if (ex === ex2 && last && last.board && last.board.strokes && last.board.strokes[0]) {
      var ink = last.board.strokes[0];
      var bends = 0;
      var bi;
      for (bi = 1; bi < ink.length - 1; bi++) {
        var ax = ink[bi].qx - ink[bi - 1].qx;
        var ay = ink[bi].qy - ink[bi - 1].qy;
        var bx = ink[bi + 1].qx - ink[bi].qx;
        var by = ink[bi + 1].qy - ink[bi].qy;
        var scale = Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by);
        if (scale > 1e-6 && Math.abs(ax * by - ay * bx) / scale > 0.03) bends += 1;
      }
      add(bends > 8 ? { ok: true, id: "guide-curve-not-polyline" } : fail("guide-curve-not-polyline", String(bends)));
    }
  });

  var signEx = exOf("calc-sign-1-ex-a011");
  var signOpen = studentDto.openProblem(engine, "calc-sign-1", 10);
  add(signEx && signOpen && signOpen.problem && signOpen.problem.displayNumber === 11 && !signOpen.problem.constraints
    && signOpen.view && signOpen.view.family === "free" && !signOpen.view.domain && signOpen.view.parts && signOpen.view.parts.length === 3
    ? { ok: true, id: "sign-sketch-opening" }
    : fail("sign-sketch-opening", JSON.stringify(signOpen && signOpen.view && { domain: signOpen.view.domain, parts: signOpen.view.parts, n: signOpen.problem && signOpen.problem.displayNumber })));
  var given = { x: 2, y: 6, qx: 0.28, qy: 0.28, role: "given" };
  function ink(pairs) {
    return pairs.map(function (pair) { return { qx: pair[0], qy: pair[1] }; });
  }
  function sketchOf(pairs) {
    return { points: [given], strokes: [ink(pairs)] };
  }
  var above = [[-0.7, 0.4], [-0.2, 0.34], [0.28, 0.28], [0.55, 0.36], [0.85, 0.42]];
  var crossing = [[-0.7, -0.35], [-0.2, -0.08], [0.05, 0.12], [0.28, 0.28], [0.7, 0.42]];
  var touching = [[-0.65, 0.46], [-0.15, 0.22], [0.02, 0.02], [0.12, 0.16], [0.28, 0.28], [0.7, 0.4]];
  var twice = [[-0.75, 0.42], [-0.45, -0.22], [-0.1, 0.2], [0.28, 0.28], [0.55, -0.24], [0.85, 0.3]];
  var along = [[-0.4, 0.4], [0.05, 0.3], [0.28, 0.28], [0.4, 0.04], [0.48, 0], [0.7, 0], [0.95, 0], [1.05, 0.22]];
  function partAsk(index, pairs, intent) {
    return ask(signEx, {
      intent: intent || "sketch",
      progress: { partIndex: index, taskIndex: 0, done: {} },
      sketch: sketchOf(pairs),
    });
  }
  var partA = partAsk(0, above);
  add(partA.ok && partA.show === "סקיצה אפשרית" && partA.view.part.label === "ב"
    ? { ok: true, id: "part-a-above" }
    : fail("part-a-above", partA.message || partA.show));
  var partAZero = partAsk(0, crossing);
  add(partAZero.errorId === "unexpectedZero" ? { ok: true, id: "unexpectedZero" } : fail("unexpectedZero", partAZero.errorId + " " + partAZero.message));
  var partB = partAsk(1, crossing);
  add(partB.ok && partB.view.part.label === "ג" ? { ok: true, id: "part-b-cross" } : fail("part-b-cross", partB.errorId + " " + partB.message));
  var partBTouch = partAsk(1, touching);
  add(partBTouch.errorId === "noNegativeValues" ? { ok: true, id: "noNegativeValues" } : fail("noNegativeValues", partBTouch.errorId + " " + partBTouch.message));
  var partBTwice = partAsk(1, twice);
  add(partBTwice.errorId === "tooManyZeros" ? { ok: true, id: "tooManyZeros" } : fail("tooManyZeros", partBTwice.errorId + " " + partBTwice.message));
  var partC = partAsk(2, touching);
  add(partC.ok && partC.solved ? { ok: true, id: "part-c-touch" } : fail("part-c-touch", partC.errorId + " " + partC.message));
  var partCCross = partAsk(2, crossing);
  add(partCCross.errorId === "crossingWhenNoNegativeAllowed" ? { ok: true, id: "crossingWhenNoNegativeAllowed" } : fail("crossingWhenNoNegativeAllowed", partCCross.errorId + " " + partCCross.message));
  var partCSegment = partAsk(2, along);
  add(partCSegment.errorId === "zeroSegmentInsteadOfPoint" ? { ok: true, id: "zeroSegmentInsteadOfPoint" } : fail("zeroSegmentInsteadOfPoint", partCSegment.errorId + " " + partCSegment.message));
  var partBNone = partAsk(1, above);
  add(partBNone.errorId === "missingZero" ? { ok: true, id: "missingZero" } : fail("missingZero", partBNone.errorId + " " + partBNone.message));
  var missedPoint = ask(signEx, { intent: "sketch", sketch: { points: [given], strokes: [ink([[-0.4, 0.7], [0.2, 0.65], [0.8, 0.7]])] } });
  add(missedPoint.errorId === "missingKnownPoint" ? { ok: true, id: "missingKnownPoint" } : fail("missingKnownPoint", missedPoint.errorId + " " + missedPoint.message));
  var swappedSign = ask(signEx, { intent: "sketch-point", point: { x: 6, y: 2, qx: 0.4, qy: 0.2 }, sketch: { points: [] } });
  add(swappedSign.errorId === "swappedCoordinates" ? { ok: true, id: "sign-swapped" } : fail("sign-swapped", swappedSign.errorId));
  var ownZero = ask(signEx, {
    intent: "sketch-point",
    progress: { partIndex: 1, taskIndex: 0, done: {} },
    point: { x: 4, y: 0, qx: 0.45, qy: 0 },
    sketch: { points: [given] },
  });
  add(ownZero.ok && ownZero.role === "user" ? { ok: true, id: "user-zero-allowed" } : fail("user-zero-allowed", ownZero.errorId + " " + ownZero.message));
  var hintsA = ask(signEx, { intent: "hint", sketch: { points: [], strokes: [] } });
  add(hintsA.hints && hintsA.hints[0].indexOf("f(2)=6") >= 0 && hintsA.hints.join(" ").indexOf("מינימום") < 0
    ? { ok: true, id: "hint-a-no-sketch" }
    : fail("hint-a-no-sketch", hintsA.hints && hintsA.hints.join(" | ")));
  var hintsC = ask(signEx, { intent: "hint", progress: { partIndex: 2, taskIndex: 0, done: {} }, sketch: { points: [given], strokes: [] } });
  add(hintsC.hints && hintsC.hints[hintsC.hints.length - 1].indexOf("מינימום") >= 0
    ? { ok: true, id: "hint-c-late" }
    : fail("hint-c-late", hintsC.hints && hintsC.hints.join(" | ")));
  var step1 = ask(signEx, { intent: "one-step", sketch: { points: [], strokes: [] } });
  add(step1.ok && !step1.solved && step1.board && step1.board.points.length === 1 && !(step1.board.strokes && step1.board.strokes.length) && step1.view.part.label === "א"
    ? { ok: true, id: "sign-step-marks-point" }
    : fail("sign-step-marks-point", step1.show + " " + (step1.message || "")));
  var step2 = ask(signEx, { intent: "one-step", sketch: step1.board, progress: step1.progress });
  add(step2.ok && step2.show === "סקיצה אפשרית" && step2.board && step2.board.strokes && step2.board.strokes[0].length > 4 && step2.view.part.label === "ב"
    ? { ok: true, id: "sign-step-draws-curve" }
    : fail("sign-step-draws-curve", (step2.errorId || "") + " " + (step2.show || "") + " " + (step2.message || "")));
  var step3 = ask(signEx, { intent: "one-step", sketch: sketchOf(above), progress: step1.progress });
  add(step3.ok && step3.show === "סקיצה אפשרית" && step3.view.part.label === "ב" && step3.board && step3.board.strokes && step3.board.strokes[0].length === above.length
    ? { ok: true, id: "sign-step-keeps-student-curve" }
    : fail("sign-step-keeps-student-curve", step3.show + " " + (step3.view && step3.view.part && step3.view.part.label)));
  var signSolution = ask(signEx, { intent: "solution" });
  var signSolutionText = (signSolution.steps || []).join(" ");
  add(/סקיצה אפשרית/.test(signSolutionText) && !/הגרף הנכון/.test(signSolutionText) && /סעיף א/.test(signSolutionText) && /סעיף ג/.test(signSolutionText)
    ? { ok: true, id: "sign-solution-possible" }
    : fail("sign-solution-possible", signSolutionText));
  var exampleOk = signSolution.examples && signSolution.examples.length === 3 && signSolution.examples.every(function (example, index) {
    var drawn = ask(signEx, {
      intent: "sketch",
      progress: { partIndex: index, taskIndex: 0, done: {} },
      sketch: { points: [given], strokes: [example.stroke.map(function (pt) { return { qx: pt[0], qy: pt[1] }; })] },
    });
    return drawn.ok;
  });
  add(exampleOk ? { ok: true, id: "sign-examples-valid" } : fail("sign-examples-valid", JSON.stringify((signSolution.examples || []).map(function (example) { return example.label; }))));

  var ex12 = exOf("calc-sign-1-ex-a012");
  var ex13 = exOf("calc-sign-1-ex-a013");
  var ex14 = exOf("calc-sign-1-ex-a014");
  var open12 = studentDto.openProblem(engine, "calc-sign-1", 11);
  var open13 = studentDto.openProblem(engine, "calc-sign-1", 12);
  var open14 = studentDto.openProblem(engine, "calc-sign-1", 13);
  add(open12 && open12.problem.displayNumber === 12 && open12.view.part.label === "א(1)" && open12.view.input === "sketch" && open12.view.parts.length === 3
    ? { ok: true, id: "ex12-open" }
    : fail("ex12-open", JSON.stringify(open12 && open12.view && { n: open12.problem.displayNumber, part: open12.view.part, input: open12.view.input })));
  add(open13 && open13.problem.displayNumber === 13 && open13.view.part.label === "א" && open13.view.input === "math" && !open13.view.sketch
    ? { ok: true, id: "ex13-open-one-part" }
    : fail("ex13-open-one-part", JSON.stringify(open13 && open13.view && { part: open13.view.part, input: open13.view.input, sketch: open13.view.sketch })));
  add(open14 && open14.problem.displayNumber === 14 && open14.view.part.label === "א" && open14.view.parts.length === 3
    ? { ok: true, id: "ex14-open" }
    : fail("ex14-open", ""));
  var known12 = layout([{ x: -3, y: -1 }, { x: 0, y: 4 }]);
  var oneZero = strokeThrough(known12, 0);
  var twoZero = oneZero.concat([
    { qx: 0.35, qy: -0.16 },
    { qx: 0.62, qy: -0.28 },
  ]);
  var sketchTwo = ask(ex12, { intent: "sketch", sketch: board(known12, twoZero) });
  add(sketchTwo.ok && sketchTwo.view.part.label === "א(2)" ? { ok: true, id: "ex12-two-zeros" } : fail("ex12-two-zeros", sketchTwo.errorId + " " + sketchTwo.message));
  var sketchOne = ask(ex12, { intent: "sketch", progress: { partIndex: 1, taskIndex: 0, done: {} }, sketch: board(known12, oneZero) });
  add(sketchOne.ok && sketchOne.view.part.label === "ב" ? { ok: true, id: "ex12-one-zero" } : fail("ex12-one-zero", sketchOne.errorId + " " + sketchOne.message));
  var sketchOneShort = ask(ex12, { intent: "sketch", progress: { partIndex: 1, taskIndex: 0, done: {} }, sketch: board(known12, twoZero) });
  add(sketchOneShort.errorId === "tooManyZeros" ? { ok: true, id: "ex12-too-many" } : fail("ex12-too-many", sketchOneShort.errorId + " " + sketchOneShort.message));
  var yesNone = ask(ex12, { intent: "check", progress: { partIndex: 2, taskIndex: 0, done: {}, answers: {} }, typed: "כן, אפשר לעקוף את הציר" });
  add(yesNone.errorId === "bypassAxis" ? { ok: true, id: "ex12-bypass" } : fail("ex12-bypass", yesNone.errorId + " " + yesNone.message));
  var noNone = ask(ex12, { intent: "check", progress: { partIndex: 2, taskIndex: 0, done: {}, answers: {} }, typed: "לא" });
  add(noNone.ok && !noNone.solved && noNone.show === "לא" && noNone.view.input === "math"
    ? { ok: true, id: "ex12-no-then-reason" }
    : fail("ex12-no-then-reason", noNone.show + " " + (noNone.view && noNone.view.input)));
  var whyNone = ask(ex12, { intent: "check", progress: noNone.progress, typed: "f(−3) שלילי ומתחת לציר, ו־f(0) חיובי ומעל הציר, לכן הגרף חוצה את הציר" });
  add(whyNone.ok && whyNone.solved ? { ok: true, id: "ex12-reason-accepted" } : fail("ex12-reason-accepted", whyNone.errorId + " " + whyNone.message));
  var stepZero = ask(ex13, { intent: "one-step", typed: "" });
  add(stepZero.ok && stepZero.show.indexOf("בגבול") >= 0 && stepZero.show.indexOf("x=") < 0
    ? { ok: true, id: "ex13-step-boundary" }
    : fail("ex13-step-boundary", stepZero.show));
  var wroteX = ask(ex13, { intent: "check", typed: "x=2" });
  add(wroteX.errorId === "zeroNeedsPoint" ? { ok: true, id: "ex13-x-not-a-point" } : fail("ex13-x-not-a-point", wroteX.errorId));
  var wroteZero = ask(ex13, { intent: "check", typed: "(2,0)" });
  add(wroteZero.ok && wroteZero.show === "(2,0)" && wroteZero.view.part.label === "ב(1)" && wroteZero.view.input === "yesno"
    ? { ok: true, id: "ex13-zero-then-ask" }
    : fail("ex13-zero-then-ask", wroteZero.errorId + " " + wroteZero.show + " " + (wroteZero.view && wroteZero.view.input) + " " + (wroteZero.view && wroteZero.view.part && wroteZero.view.part.label)));
  var increasing = ask(ex13, { intent: "check", progress: wroteZero.progress, typed: "לא" });
  add(increasing.errorId === "positiveMeansIncreasing" ? { ok: true, id: "ex13-positive-not-increasing" } : fail("ex13-positive-not-increasing", increasing.errorId + " " + increasing.message));
  var yesGt = ask(ex13, { intent: "check", progress: wroteZero.progress, typed: "כן" });
  add(yesGt.ok && yesGt.view.input === "sketch" && yesGt.view.part.label === "ב(1)"
    ? { ok: true, id: "ex13-yes-opens-sketch" }
    : fail("ex13-yes-opens-sketch", yesGt.view && yesGt.view.input + " " + (yesGt.view.part && yesGt.view.part.label)));
  var zeroPt = yesGt.board.points[0];
  function relStroke(endHigh) {
    return [
      { qx: zeroPt.qx - 0.55, qy: -0.34 },
      { qx: zeroPt.qx - 0.2, qy: -0.16 },
      { qx: zeroPt.qx, qy: 0 },
      { qx: zeroPt.qx + 0.22, qy: 0.14 },
      { qx: zeroPt.qx + 0.4, qy: endHigh ? 0.18 : 0.32 },
      { qx: zeroPt.qx + 0.62, qy: endHigh ? 0.36 : 0.12 },
    ];
  }
  var gtSketch = ask(ex13, { intent: "sketch", progress: yesGt.progress, sketch: { points: [zeroPt], strokes: [relStroke(true)] } });
  add(gtSketch.ok && gtSketch.view.part.label === "ב(2)" ? { ok: true, id: "ex13-gt-sketch" } : fail("ex13-gt-sketch", gtSketch.errorId + " " + gtSketch.message));
  var ltWrong = ask(ex13, { intent: "sketch", progress: yesGt.progress, sketch: { points: [zeroPt], strokes: [relStroke(false)] } });
  add(ltWrong.errorId === "wrongValueRelation" ? { ok: true, id: "ex13-wrong-height" } : fail("ex13-wrong-height", ltWrong.errorId + " " + ltWrong.message));
  var onlyOne = ask(ex14, { intent: "check", typed: "(0,0)" });
  add(onlyOne.ok && !onlyOne.solved && onlyOne.show === "(0,0)" && onlyOne.view.part.label === "א"
    ? { ok: true, id: "ex14-one-point-waits" }
    : fail("ex14-one-point-waits", onlyOne.errorId + " " + onlyOne.show + " " + (onlyOne.view && onlyOne.view.part && onlyOne.view.part.label)));
  var bare14 = ask(ex14, { intent: "check", progress: onlyOne.progress, typed: "x=3" });
  add(bare14.errorId === "zeroNeedsPoint" ? { ok: true, id: "ex14-x-not-a-point" } : fail("ex14-x-not-a-point", bare14.errorId));
  var zeros14 = ask(ex14, { intent: "check", progress: onlyOne.progress, typed: "(3,0)" });
  add(zeros14.ok && zeros14.show.indexOf("(0,0)") >= 0 && zeros14.show.indexOf("(3,0)") >= 0 && zeros14.view.part.label === "ב(1)" && zeros14.view.input === "sketch"
    ? { ok: true, id: "ex14-zeros" }
    : fail("ex14-zeros", zeros14.errorId + " " + zeros14.show + " " + (zeros14.view && zeros14.view.part && zeros14.view.part.label)));
  var z14 = zeros14.board.points;
  var low14 = [
    { qx: z14[0].qx - 0.5, qy: -0.4 },
    { qx: z14[0].qx - 0.18, qy: -0.14 },
    { qx: z14[0].qx, qy: 0 },
    { qx: (z14[0].qx + z14[1].qx) / 2, qy: 0.28 },
    { qx: z14[1].qx, qy: 0 },
    { qx: z14[1].qx + 0.25, qy: -0.22 },
    { qx: z14[1].qx + 0.48, qy: -0.3 },
  ];
  var sketch14 = ask(ex14, { intent: "sketch", progress: zeros14.progress, sketch: { points: z14, strokes: [low14] } });
  add(sketch14.ok && sketch14.view.part.label === "ב(2)" ? { ok: true, id: "ex14-low-sketch" } : fail("ex14-low-sketch", sketch14.errorId + " " + sketch14.message));
  var high14 = low14.slice();
  high14[0] = { qx: high14[0].qx, qy: -0.12 };
  high14[1] = { qx: high14[1].qx, qy: -0.36 };
  var flipped14 = ask(ex14, { intent: "sketch", progress: zeros14.progress, sketch: { points: z14, strokes: [high14] } });
  add(flipped14.errorId === "wrongValueRelation" ? { ok: true, id: "ex14-wrong-height" } : fail("ex14-wrong-height", flipped14.errorId + " " + flipped14.message));

  var ex15 = exOf("calc-sign-1-ex-a015");
  var ex16 = exOf("calc-sign-1-ex-a016");
  var open15 = studentDto.openProblem(engine, "calc-sign-1", 14);
  add(open15 && open15.problem.displayNumber === 15 && open15.view.part.label === "א" && open15.view.parts.length === 5
    ? { ok: true, id: "ex15-open" }
    : fail("ex15-open", ""));
  var zeros15 = ask(ex15, { intent: "check", typed: "(−6,0), (1,0), (5,0)" });
  add(zeros15.ok && zeros15.view.part.label === "ב" && zeros15.view.input === "sketch"
    ? { ok: true, id: "ex15-zeros" }
    : fail("ex15-zeros", zeros15.errorId + " " + zeros15.show));
  var draw15 = ask(ex15, { intent: "one-step", progress: zeros15.progress, sketch: zeros15.board });
  add(draw15.ok && draw15.show === "סקיצה אפשרית" && draw15.board && draw15.board.strokes && draw15.board.strokes[0].length > 4 && draw15.view.part.label === "ג(1)"
    ? { ok: true, id: "ex15-step-draws" }
    : fail("ex15-step-draws", (draw15.errorId || "") + " " + (draw15.show || "") + " " + (draw15.message || "")));
  var sol15 = ask(ex15, { intent: "solution" });
  var sol14 = ask(ex14, { intent: "solution" });
  add(sol15.examples && sol15.examples.length === 1 && sol15.examples[0].stroke.length > 4 && sol14.examples && sol14.examples.length === 2
    ? { ok: true, id: "region-solution-sketches" }
    : fail("region-solution-sketches", String(sol15.examples && sol15.examples.length) + " " + String(sol14.examples && sol14.examples.length)));
  var stepLocate = ask(ex15, { intent: "one-step", progress: { partIndex: 2, taskIndex: 0, answers: {}, done: {} } });
  add(stepLocate.ok && stepLocate.show.indexOf("מקמו") >= 0 && stepLocate.show.indexOf("לא") < 0 && stepLocate.view.part.label === "ג(1)"
    ? { ok: true, id: "ex15-locate-before-answer" }
    : fail("ex15-locate-before-answer", stepLocate.show));
  var noNeg = ask(ex15, { intent: "check", progress: { partIndex: 2, taskIndex: 0, answers: {}, done: {} }, typed: "לא" });
  var yesNeg = ask(ex15, { intent: "check", progress: { partIndex: 2, taskIndex: 0, answers: {}, done: {} }, typed: "כן" });
  add(noNeg.ok && noNeg.show === "לא" && yesNeg.errorId === "wrongIntervalLookup"
    ? { ok: true, id: "ex15-interval-lookup" }
    : fail("ex15-interval-lookup", yesNeg.errorId));
  var yesCmp = ask(ex15, { intent: "check", progress: { partIndex: 3, taskIndex: 0, answers: {}, done: {} }, typed: "כן" });
  var noCmp = ask(ex15, { intent: "check", progress: { partIndex: 3, taskIndex: 0, answers: {}, done: {} }, typed: "לא" });
  add(noCmp.ok && noCmp.view.part.label === "ג(3)" && yesCmp.errorId === "ignoredKnownSignsWhenComparing"
    ? { ok: true, id: "ex15-sign-compare" }
    : fail("ex15-sign-compare", yesCmp.errorId + " " + (noCmp.view && noCmp.view.part && noCmp.view.part.label)));
  var no60 = ask(ex15, { intent: "check", progress: { partIndex: 4, taskIndex: 0, answers: {}, done: {} }, typed: "לא" });
  var big60 = ask(ex15, { intent: "check", progress: { partIndex: 4, taskIndex: 0, answers: {}, done: {} }, typed: "לא, כי הערך גדול" });
  var yes60 = ask(ex15, { intent: "check", progress: { partIndex: 4, taskIndex: 0, answers: {}, done: {} }, typed: "כן" });
  add(yes60.ok && yes60.solved && no60.errorId === "possibleConfusedWithNecessary" && big60.errorId === "positiveMeansLarge"
    ? { ok: true, id: "ex15-magnitude" }
    : fail("ex15-magnitude", no60.errorId + " " + big60.errorId));
  var bad16 = ask(ex16, { intent: "check", typed: "(0,0), (5,0)" });
  var ok16 = ask(ex16, { intent: "check", typed: "(0,0)" });
  add(ok16.ok && ok16.show === "(0,0)" && bad16.errorId === "unknownPointAssumedZero"
    ? { ok: true, id: "ex16-known-zero-only" }
    : fail("ex16-known-zero-only", bad16.errorId + " " + ok16.show));
  var mustYes = ask(ex16, { intent: "check", progress: { partIndex: 2, taskIndex: 0, answers: {}, done: {} }, typed: "כן" });
  var mustHole = ask(ex16, { intent: "check", progress: { partIndex: 2, taskIndex: 0, answers: {}, done: {} }, typed: "כן, הפונקציה לא מוגדרת שם" });
  var mustNo = ask(ex16, { intent: "check", progress: { partIndex: 2, taskIndex: 0, answers: {}, done: {} }, typed: "לא" });
  add(mustNo.ok && mustNo.show === "לא" && mustNo.view.part.label === "ג(2)" && mustYes.errorId === "unknownPointAssumedZero" && mustHole.errorId === "excludedFromSignMeansUndefined"
    ? { ok: true, id: "ex16-must-vs-can" }
    : fail("ex16-must-vs-can", mustYes.errorId + " " + mustHole.errorId + " " + (mustNo.view && mustNo.view.part && mustNo.view.part.label)));
  var canYes = ask(ex16, { intent: "check", progress: mustNo.progress, typed: "כן" });
  add(canYes.ok && canYes.solved ? { ok: true, id: "ex16-can-greater" } : fail("ex16-can-greater", canYes.errorId + " " + canYes.message));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-free-sketch: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log("FAIL", item.id, item.detail); });
  if (failed.length) process.exit(1);
}

main();
