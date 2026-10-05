"use strict";

var loadEngine = require("./load-engine").loadEngine;
var freeSketch = require("./free-sketch");
var studentDto = require("./student-dto");

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

function strokeThrough(points) {
  var sorted = points.slice().sort(function (a, b) { return a.qx - b.qx; });
  var samples = [];
  var i;
  var k;
  for (i = 0; i < sorted.length - 1; i++) {
    var a = sorted[i];
    var b = sorted[i + 1];
    var steps = 12;
    for (k = 0; k <= steps; k++) {
      var t = k / steps;
      samples.push({
        qx: a.qx + (b.qx - a.qx) * t,
        qy: a.qy + (b.qy - a.qy) * t,
      });
    }
  }
  return samples;
}

function board(points, samples, refs) {
  return { points: points, strokes: [samples], refs: refs || [] };
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

  var ex8 = exOf("calc-extrema-1-ex-a015");
  var ex9 = exOf("calc-extrema-1-ex-a016");
  var ex10 = exOf("calc-extrema-1-ex-a017");
  var ex11 = exOf("calc-extrema-1-ex-a018");
  add(ex8 && ex9 && ex10 && ex11 && ex8.n === 15 && ex11.n === 18 && !ex8.parts.some(function (part) { return part.label === "ד"; })
    ? { ok: true, id: "site-15-18" }
    : fail("site-15-18"));

  var opened = studentDto.openProblem(engine, "calc-extrema-1", 14);
  var dumped = JSON.stringify(opened && opened.problem);
  add(opened && opened.view && opened.view.input === "sketch" && opened.view.family === "free" && dumped.indexOf("EXTREMUM") < 0 && dumped.indexOf("constraints") < 0
    ? { ok: true, id: "open-15" }
    : fail("open-15", dumped));

  var hint0 = ask(ex8, { intent: "hint", sketch: { points: [], strokes: [] } });
  add(hint0.ok && hint0.hint.indexOf("נקודות הידועות") >= 0 ? { ok: true, id: "hint-mark-first" } : fail("hint-mark-first", hint0.hint));

  var pts8 = layout([{ x: 0, y: -6 }, { x: 3, y: 0 }, { x: 5, y: 4 }, { x: 7, y: 0 }]);
  var good8 = ask(ex8, { intent: "sketch", sketch: board(pts8, strokeThrough(pts8)) });
  add(good8.ok && good8.show === "סקיצה אפשרית" && good8.view.part.label === "ב" && good8.view.keepBoard && good8.view.helperLine && good8.view.helperLine.y === 6
    ? { ok: true, id: "ex8-sketch" }
    : fail("ex8-sketch", good8.errorId + " " + good8.message));

  var rising = pts8.slice();
  var peak = rising.filter(function (pt) { return pt.x === 5; })[0];
  var right = rising.filter(function (pt) { return pt.x === 7; })[0];
  var over = strokeThrough(rising.concat([{ qx: (peak.qx + right.qx) / 2, qy: peak.qy + 0.2 }]));
  var stillUp = ask(ex8, { intent: "sketch", sketch: board(pts8, over) });
  add(stillUp.errorId === "wrongExtremumType" && stillUp.message.indexOf("לאחר x=5") >= 0
    ? { ok: true, id: "ex8-keeps-rising" }
    : fail("ex8-keeps-rising", stillUp.errorId + " " + stillUp.message));

  var wiggle = strokeThrough([
    pts8.filter(function (pt) { return pt.x === 0; })[0],
    pts8.filter(function (pt) { return pt.x === 3; })[0],
    peak,
    { qx: peak.qx + 0.05, qy: peak.qy - 0.12 },
    { qx: peak.qx + 0.1, qy: peak.qy + 0.08 },
    right,
  ]);
  var extra = ask(ex8, { intent: "sketch", sketch: board(pts8, wiggle) });
  add(extra.errorId === "extraExtremum" && extra.message.indexOf("אחת בלבד") >= 0
    ? { ok: true, id: "ex8-extra" }
    : fail("ex8-extra", extra.errorId + " " + extra.message));

  var meet = ask(ex8, { intent: "check", progress: good8.progress, typed: "לא" });
  add(meet.ok && meet.show === "לא" && meet.view.input === "math" && meet.view.keepBoard
    ? { ok: true, id: "ex8-no" }
    : fail("ex8-no", meet.errorId + " " + (meet.view && meet.view.input)));
  var meetEn = ask(ex8, { intent: "check", progress: good8.progress, typed: "No" });
  add(meetEn.ok && meetEn.show === "לא" ? { ok: true, id: "ex8-no-en" } : fail("ex8-no-en", meetEn.errorId));
  var confused = ask(ex8, { intent: "check", progress: good8.progress, typed: "כן, כי x=6 בתחום" });
  add(confused.errorId === "horizontalLineXYConfusion" ? { ok: true, id: "ex8-xy" } : fail("ex8-xy", confused.errorId + " " + confused.message));
  var lowLine = ask(ex8, {
    intent: "check",
    progress: good8.progress,
    typed: "לא",
    sketch: { points: pts8, strokes: [], refs: [{ x1: -1, y1: peak.qy - 0.05, x2: 1, y2: peak.qy - 0.05 }] },
  });
  add(lowLine.errorId === "helperLineBelowMax" ? { ok: true, id: "ex8-line-low" } : fail("ex8-line-low", lowLine.errorId));
  var highLine = ask(ex8, {
    intent: "check",
    progress: good8.progress,
    typed: "לא",
    sketch: { points: pts8, strokes: [], refs: [{ x1: -1, y1: peak.qy + 0.2, x2: 1, y2: peak.qy + 0.2 }] },
  });
  add(highLine.ok ? { ok: true, id: "ex8-line-high" } : fail("ex8-line-high", highLine.errorId));
  var hintLine = ask(ex8, {
    intent: "hint",
    progress: good8.progress,
    sketch: { points: pts8, strokes: [], refs: [{ x1: -1, y1: 0.8, x2: 1, y2: 0.8 }] },
  });
  add(hintLine.hint.indexOf("הישר האופקי") >= 0 ? { ok: true, id: "ex8-hint-line" } : fail("ex8-hint-line", hintLine.hint));

  ["f(x)≤4", "f(x)<=4", "y≤4", "(−∞,4]"].forEach(function (text) {
    var ranged = ask(ex8, { intent: "check", progress: meet.progress, typed: text });
    add(ranged.ok && ranged.solved ? { ok: true, id: "ex8-range-" + text } : fail("ex8-range-" + text, ranged.errorId + " " + ranged.message));
  });
  var domainish = ask(ex8, { intent: "check", progress: meet.progress, typed: "x≤4" });
  add(domainish.errorId === "rangeConfusedWithDomain" ? { ok: true, id: "ex8-range-x" } : fail("ex8-range-x", domainish.errorId));

  var typeHint = ask(ex9, { intent: "hint" });
  add(typeHint.hint.indexOf("לפני") >= 0 && typeHint.hint.indexOf("מינימום") < 0
    ? { ok: true, id: "ex9-hint" }
    : fail("ex9-hint", typeHint.hint));
  var typeStep = ask(ex9, { intent: "one-step", progress: {} });
  add(typeStep.ok && typeStep.show.indexOf("מינימום") < 0 ? { ok: true, id: "ex9-step-1" } : fail("ex9-step-1", typeStep.show));
  var typeStep2 = ask(ex9, { intent: "one-step", progress: typeStep.progress });
  add(typeStep2.ok && typeStep2.show === "מינימום" ? { ok: true, id: "ex9-step-2" } : fail("ex9-step-2", typeStep2.show));
  var badType = ask(ex9, { intent: "check", typed: "מקסימום" });
  add(badType.errorId === "wrongExtremumType" ? { ok: true, id: "ex9-max" } : fail("ex9-max", badType.errorId));
  var goodType = ask(ex9, { intent: "check", typed: "min" });
  add(goodType.ok && goodType.show === "מינימום" && goodType.view.input === "sketch"
    ? { ok: true, id: "ex9-min" }
    : fail("ex9-min", goodType.errorId + " " + goodType.show));

  var pts9 = layout([{ x: 0, y: 9 }, { x: 5, y: 3 }]);
  var min9 = pts9.filter(function (pt) { return pt.x === 5; })[0];
  var path9 = pts9.concat([{ qx: min9.qx + 0.28, qy: min9.qy + 0.2 }]);
  var sketch9 = ask(ex9, { intent: "sketch", progress: goodType.progress, sketch: board(pts9, strokeThrough(path9)) });
  add(sketch9.ok && sketch9.view.part.label === "ג" ? { ok: true, id: "ex9-sketch" } : fail("ex9-sketch", sketch9.errorId + " " + sketch9.message));
  var usedX = ask(ex9, { intent: "check", progress: sketch9.progress, typed: "כן, המינימום הוא 5" });
  add(usedX.errorId === "minimumXUsedInsteadOfMinimumY" ? { ok: true, id: "ex9-used-x" } : fail("ex9-used-x", usedX.errorId + " " + usedX.message));
  var noNeg = ask(ex9, { intent: "check", progress: sketch9.progress, typed: "לא" });
  add(noNeg.ok && noNeg.solved ? { ok: true, id: "ex9-no" } : fail("ex9-no", noNeg.errorId));

  var pts10 = layout([
    { x: -2, y: 0 },
    { x: -1, y: 2 },
    { x: 0, y: 0 },
    { x: 1, y: -2 },
    { x: 2, y: 0 },
  ]);
  var good10 = ask(ex10, { intent: "sketch", sketch: board(pts10, strokeThrough(pts10)) });
  add(good10.ok && good10.solved ? { ok: true, id: "ex10-sketch" } : fail("ex10-sketch", good10.errorId + " " + good10.message));
  var max10 = pts10.filter(function (pt) { return pt.x === -1; })[0];
  var zero10 = pts10.filter(function (pt) { return pt.x === 0; })[0];
  var bumpy10 = strokeThrough([
    pts10.filter(function (pt) { return pt.x === -2; })[0],
    max10,
    { qx: (max10.qx + zero10.qx) / 2 - 0.02, qy: max10.qy - 0.16 },
    { qx: (max10.qx + zero10.qx) / 2 + 0.02, qy: max10.qy - 0.02 },
    zero10,
    pts10.filter(function (pt) { return pt.x === 1; })[0],
    pts10.filter(function (pt) { return pt.x === 2; })[0],
  ]);
  var extra10 = ask(ex10, { intent: "sketch", sketch: board(pts10, bumpy10) });
  add(extra10.errorId === "extraExtremum" ? { ok: true, id: "ex10-extra" } : fail("ex10-extra", extra10.errorId + " " + extra10.message));

  var pts11 = layout([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }]);
  var left11 = { qx: -0.3, qy: 0.4 };
  var right11 = { qx: 0.72, qy: 0.55 };
  var good11 = ask(ex11, { intent: "sketch", sketch: board(pts11, strokeThrough([left11].concat(pts11, [right11]))) });
  add(good11.ok && good11.solved ? { ok: true, id: "ex11-asymmetric" } : fail("ex11-asymmetric", good11.errorId + " " + good11.message));
  var short11 = ask(ex11, { intent: "sketch", sketch: board(pts11, strokeThrough(pts11)) });
  add(short11.errorId === "graphViolatesGivenInterval" ? { ok: true, id: "ex11-tails" } : fail("ex11-tails", short11.errorId + " " + short11.message));

  var stepProgress = { partIndex: 0, taskIndex: 0, answers: {}, done: {} };
  var stepSketch = { points: [], strokes: [] };
  var stepDrawn = null;
  var stepGuard = 0;
  while (stepGuard < 8) {
    stepDrawn = ask(ex8, { intent: "one-step", progress: stepProgress, sketch: stepSketch });
    if (!stepDrawn || !stepDrawn.ok || stepDrawn.show === "סקיצה אפשרית") break;
    stepSketch = stepDrawn.board || stepSketch;
    stepProgress = stepDrawn.progress;
    stepGuard += 1;
  }
  add(stepDrawn && stepDrawn.ok && stepDrawn.show === "סקיצה אפשרית" && stepDrawn.board && stepDrawn.board.strokes && stepDrawn.board.strokes[0].length > 4
    ? { ok: true, id: "ex8-step-draws" }
    : fail("ex8-step-draws", stepDrawn && ((stepDrawn.errorId || "") + " " + (stepDrawn.show || "") + " " + (stepDrawn.message || ""))));

  var solution = ask(ex8, { intent: "solution" });
  var solutionText = (solution.steps || []).join(" ");
  add(solutionText.indexOf("מסמנים") >= 0 && solutionText.indexOf("סקיצה") >= 0 && solutionText.indexOf("לא") >= 0 && solutionText.indexOf("f(x)") >= 0
    ? { ok: true, id: "solution-build" }
    : fail("solution-build", solutionText));

  var ex19 = exOf("calc-extrema-1-ex-a019");
  var ex20 = exOf("calc-extrema-1-ex-a020");
  add(ex19 && ex20 && ex19.n === 19 && ex20.n === 20 ? { ok: true, id: "site-19-20" } : fail("site-19-20"));
  var minWord = ask(ex19, { intent: "check", typed: "מינימום" });
  add(minWord.ok && minWord.show === "מינימום" && minWord.view.part.label === "ב"
    ? { ok: true, id: "ex19-min" }
    : fail("ex19-min", minWord.errorId + " " + minWord.message));
  var maxWord = ask(ex19, { intent: "check", typed: "מקסימום" });
  add(maxWord.errorId === "wrongExtremumType" ? { ok: true, id: "ex19-swapped" } : fail("ex19-swapped", maxWord.errorId));
  var minAlias = ask(ex19, { intent: "check", typed: "min" });
  add(minAlias.ok ? { ok: true, id: "ex19-min-en" } : fail("ex19-min-en", minAlias.errorId));
  function nearNum(a, b) { return Math.abs(a - b) < 1e-6; }
  var pts19 = layout([{ x: 0, y: 7 }, { x: 2, y: 2 }, { x: 5, y: 4 }]);
  var sketch19 = ask(ex19, { intent: "sketch", progress: minWord.progress, sketch: board(pts19, strokeThrough(pts19)) });
  add(sketch19.ok && sketch19.show === "סקיצה אפשרית"
    ? { ok: true, id: "ex19-sketch" }
    : fail("ex19-sketch", sketch19.errorId + " " + sketch19.message));
  var lowMin = pts19.map(function (pt) { return nearNum(pt.x, 2) ? { x: 2, y: -1, qx: pt.qx, qy: -0.3, role: "extremum" } : pt; });
  var dipped = ask(ex19, { intent: "sketch", progress: minWord.progress, sketch: board(lowMin, strokeThrough(lowMin)) });
  add(dipped.errorId === "belowInPositiveInterval" ? { ok: true, id: "ex19-positive" } : fail("ex19-positive", dipped.errorId + " " + dipped.message));
  var past19 = strokeThrough(pts19).concat([{ qx: pts19[2].qx + 0.8, qy: pts19[2].qy }]);
  var beyond = ask(ex19, { intent: "sketch", progress: minWord.progress, sketch: board(pts19, past19) });
  add(beyond.errorId === "extendedBeyondDomain" ? { ok: true, id: "ex19-beyond" } : fail("ex19-beyond", beyond.errorId + " " + beyond.message));
  var badEnd = ask(ex19, { intent: "sketch-point", progress: minWord.progress, point: { x: 0, y: 3, qx: 0, qy: 0.2 }, sketch: { points: [] } });
  add(badEnd.errorId === "wrongEndpoint" ? { ok: true, id: "ex19-endpoint" } : fail("ex19-endpoint", badEnd.errorId + " " + badEnd.message));

  var pts20 = layout([{ x: 0, y: 1 }, { x: 1.2, y: 1.6 }, { x: 2, y: 3 }, { x: 4, y: 1 }]);
  var sketch20 = ask(ex20, { intent: "sketch", sketch: board(pts20, strokeThrough(pts20)) });
  add(sketch20.ok && sketch20.view.part.label === "ב" && sketch20.view.keepBoard
    ? { ok: true, id: "ex20-asymmetric" }
    : fail("ex20-asymmetric", sketch20.errorId + " " + sketch20.message));
  ["יורד", "קטן", "פוחת", "יורדת"].forEach(function (word) {
    var trend = ask(ex20, { intent: "check", progress: sketch20.progress, typed: word });
    add(trend.ok && trend.show === "יורד" && trend.view.part.label === "ג"
      ? { ok: true, id: "ex20-trend-" + word }
      : fail("ex20-trend-" + word, trend.errorId + " " + (trend.message || "")));
  });
  var grows = ask(ex20, { intent: "check", progress: sketch20.progress, typed: "גדל" });
  add(grows.errorId === "xIncreaseMeansYIncrease" ? { ok: true, id: "ex20-x-grows" } : fail("ex20-x-grows", grows.errorId + " " + grows.message));
  var sym = ask(ex20, { intent: "check", progress: sketch20.progress, typed: "סימטרי" });
  add(sym.errorId === "assumedSymmetry" ? { ok: true, id: "ex20-symmetry" } : fail("ex20-symmetry", sym.errorId));
  var invented = ask(ex20, { intent: "check", progress: sketch20.progress, typed: "3" });
  add(invented.errorId === "inventedExtremumY" ? { ok: true, id: "ex20-invented-y" } : fail("ex20-invented-y", invented.errorId));
  var allX = ask(ex20, { intent: "check", progress: sketch20.progress && ask(ex20, { intent: "check", progress: sketch20.progress, typed: "יורד" }).progress, domains: { pos: "כל x", neg: "אין" } });
  add(allX.errorId === "usedAllRealNumbersInsteadOfDomain" ? { ok: true, id: "ex20-all-x" } : fail("ex20-all-x", allX.errorId + " " + allX.message));
  var signProgress = ask(ex20, { intent: "check", progress: sketch20.progress, typed: "יורד" }).progress;
  var opened = ask(ex20, { intent: "check", progress: signProgress, domains: { pos: "0<x<4", neg: "אין" } });
  add(opened.errorId === "excludedDomainEndpointFromSignInterval" ? { ok: true, id: "ex20-open" } : fail("ex20-open", opened.errorId + " " + opened.message));
  var closed = ask(ex20, { intent: "check", progress: signProgress, domains: { pos: "0≤x≤4", neg: "אין" } });
  add(closed.ok && closed.solved ? { ok: true, id: "ex20-closed" } : fail("ex20-closed", closed.errorId + " " + closed.message));
  var bracket = ask(ex20, { intent: "check", progress: signProgress, domains: { pos: "[0,4]", neg: "אין" } });
  add(bracket.ok && bracket.solved ? { ok: true, id: "ex20-bracket" } : fail("ex20-bracket", bracket.errorId + " " + bracket.message));

  var typeStep = ask(ex19, { intent: "one-step" });
  add(typeStep.ok && typeStep.show.indexOf("מינימום") < 0 && typeStep.show.indexOf("לפני") >= 0
    ? { ok: true, id: "ex19-type-hint" }
    : fail("ex19-type-hint", (typeStep.show || "") + " " + (typeStep.message || "")));
  var step19 = { points: [], strokes: [] };
  var prog19 = ask(ex19, { intent: "check", typed: "מינימום" }).progress;
  var drawn19 = null;
  var guard19 = 0;
  while (guard19 < 8) {
    drawn19 = ask(ex19, { intent: "one-step", progress: prog19, sketch: step19 });
    if (!drawn19 || !drawn19.ok || drawn19.show === "סקיצה אפשרית") break;
    step19 = drawn19.board || step19;
    prog19 = drawn19.progress;
    guard19 += 1;
  }
  var ys19 = ((drawn19 && drawn19.board && drawn19.board.points) || []).map(function (pt) { return pt.y; });
  var minY = ys19.filter(function (y) { return y !== 7 && y !== 4; })[0];
  add(drawn19 && drawn19.ok && drawn19.show === "סקיצה אפשרית" && minY > 0 && minY < 4
    && drawn19.message.indexOf("אינו נקבע") >= 0
    ? { ok: true, id: "ex19-step-draws" }
    : fail("ex19-step-draws", drawn19 && ((drawn19.errorId || "") + " " + (drawn19.show || "") + " " + (drawn19.message || "") + " y=" + minY)));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-extrema-sketch: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log("FAIL", item.id, item.detail); });
  if (failed.length) process.exit(1);
}

main();
