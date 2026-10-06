"use strict";

var loadEngine = require("./load-engine").loadEngine;
var createFunctionsHandler = require("./functions").createFunctionsHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function play(handler, levelId, index, lines) {
  var progress = null;
  var i;
  for (i = 0; i < lines.length; i++) {
    var step = lines[i];
    var body = {
      intent: step.sketch ? "sketch" : "check",
      levelId: levelId,
      exerciseIndex: index,
      progress: progress,
      typed: step.typed,
      sketch: step.sketch,
    };
    var out = handler.handle(body);
    if (!out.ok) return { ok: false, at: step.typed || "sketch", message: out.message, progress: progress };
    progress = out.progress;
  }
  return { ok: true, progress: progress, solved: !!(progress && handler.handle({
    intent: "hint",
    levelId: levelId,
    exerciseIndex: index,
    progress: progress,
  })) };
}

function main() {
  var engine = loadEngine();
  var handler = createFunctionsHandler(engine);
  var checks = [];
  function add(result) {
    checks.push(result);
  }

  var levels = engine.DoctematicaCurriculum.levels.filter(function (level) {
    return level.id === "calc-linear-1";
  });
  add(levels.length === 1 && levels[0].exercises.length === 3
    ? { ok: true, id: "page" }
    : fail("page", String(levels.length)));

  var sol1 = handler.handle({ intent: "solution", levelId: "calc-linear-1", exerciseIndex: 0 });
  add(sol1.ok && sol1.steps && sol1.steps.length >= 5
    ? { ok: true, id: "sol1" }
    : fail("sol1", JSON.stringify(sol1.steps)));

  var opened = handler.handle({ intent: "hint", levelId: "calc-linear-1", exerciseIndex: 0, progress: engine.DoctematicaFn.freshProgress() });
  var fig = opened.view && opened.view.figure;
  var figLine = fig && fig.line;
  var xHit = figLine ? figLine.x1 + (0 - figLine.y1) / (figLine.y2 - figLine.y1) * (figLine.x2 - figLine.x1) : 0;
  var yHit = figLine ? figLine.y1 + (0 - figLine.x1) / (figLine.x2 - figLine.x1) * (figLine.y2 - figLine.y1) : 0;
  var markLeft = fig && fig.marks && fig.marks[0] ? fig.marks[0].qx : 0;
  add(opened.ok && opened.view && opened.view.part && opened.view.part.label === "א"
    && figLine && xHit < -0.35 && yHit > 0.35 && markLeft < xHit
    ? { ok: true, id: "open1" }
    : fail("open1", JSON.stringify({ xHit: xHit, yHit: yHit, markLeft: markLeft, fig: fig })));

  var ex1 = play(handler, "calc-linear-1", 0, [
    { typed: "f(3)=3+7" },
    { typed: "f(3)=10" },
    { typed: "f(-8)=-8+7" },
    { typed: "f(-8)=-1" },
    { typed: "(-8,-1)" },
    { typed: "x+7=0" },
    { typed: "x=-7" },
    { typed: "(-7,0)" },
    { typed: "חיובי: x > -7, שלילי: x < -7" },
    { typed: "עולה: כל x, יורדת: אין" },
  ]);
  var done1 = ex1.progress && ex1.progress.done;
  add(ex1.ok && done1 && done1.f3 && done1.pt && done1.zero && done1.sign && done1.mono
    ? { ok: true, id: "ex1-path" }
    : fail("ex1-path", JSON.stringify(ex1)));

  var skip = play(handler, "calc-linear-1", 0, [
    { typed: "10" },
    { typed: "(-8,-1)" },
    { typed: "(-7,0)" },
    { typed: "x>-7" },
    { typed: "x<-7" },
    { typed: "עולה: כל x" },
    { typed: "יורדת: אין" },
  ]);
  add(skip.ok && skip.progress.done.mono ? { ok: true, id: "ex1-skip" } : fail("ex1-skip", JSON.stringify(skip)));

  var early = handler.handle({
    intent: "check",
    levelId: "calc-linear-1",
    exerciseIndex: 0,
    typed: "x > -7",
    progress: (function () {
      var p = engine.DoctematicaFn.freshProgress();
      p.done = { f3: true, pt: true, zero: true };
      p.rootKnown = false;
      return p;
    })(),
  });
  add(!early.ok && /סימן השוויון/.test(early.message || "") ? { ok: true, id: "sign-needs-root" } : fail("sign-needs-root", early.message));

  function equationProgress(eq) {
    var p = engine.DoctematicaFn.freshProgress();
    p.done = { f3: true, pt: true };
    p.phase = { zero: "eq" };
    p.eq = { zero: eq };
    p.rootKnown = false;
    return p;
  }
  ["x>-7", "x>=-7", "x<=-7", "x≥-7", "x≤-7"].forEach(function (typed) {
    var rejected = handler.handle({
      intent: "check",
      levelId: "calc-linear-1",
      exerciseIndex: 0,
      typed: typed,
      progress: equationProgress("x+7=0"),
    });
    add(!rejected.ok && /סימן השוויון/.test(rejected.message || "")
      ? { ok: true, id: "equation-keeps-equal-" + typed }
      : fail("equation-keeps-equal-" + typed, rejected.message || ""));
  });
  var solvedEq = handler.handle({
    intent: "check",
    levelId: "calc-linear-1",
    exerciseIndex: 0,
    typed: "x=-7",
    progress: equationProgress("x+7=0"),
  });
  add(solvedEq.ok ? { ok: true, id: "equation-accepts-root" } : fail("equation-accepts-root", solvedEq.message || ""));

  var domainView = handler.handle({ intent: "hint", levelId: "calc-linear-1", exerciseIndex: 1 });
  add(domainView.view && domainView.view.input === "domains"
    && domainView.view.domains && domainView.view.domains[0].label === "תחומי עלייה"
    && domainView.view.domains[1].label === "תחומי ירידה"
    ? { ok: true, id: "ex2-domain-view" }
    : fail("ex2-domain-view", JSON.stringify(domainView.view)));

  var domainWrong = handler.handle({
    intent: "check",
    levelId: "calc-linear-1",
    exerciseIndex: 1,
    domains: { inc: "כל x", dec: "אין" },
  });
  add(!domainWrong.ok && /עלייה/.test(domainWrong.message || "")
    ? { ok: true, id: "ex2-domain-wrong" }
    : fail("ex2-domain-wrong", domainWrong.message || ""));

  var domainOk = handler.handle({
    intent: "check",
    levelId: "calc-linear-1",
    exerciseIndex: 1,
    domains: { inc: "אין", dec: "כל x" },
  });
  add(domainOk.ok && domainOk.progress.done.mono && domainOk.view && domainOk.view.input !== "domains"
    ? { ok: true, id: "ex2-domain-fields" }
    : fail("ex2-domain-fields", JSON.stringify(domainOk)));

  var ex2 = play(handler, "calc-linear-1", 1, [
    { typed: "יורדת: כל x, עולה: אין" },
    { typed: "x=0" },
    { typed: "f(0)=-0-2" },
    { typed: "f(0)=-2" },
    { typed: "(0,-2)" },
    { typed: "-x-2=0" },
    { typed: "x=-2" },
    { typed: "(-2,0)" },
    {
      sketch: {
        points: [
          { x: 0, y: -2, qx: 0.02, qy: -0.42 },
          { x: -2, y: 0, qx: -0.48, qy: 0.02 },
        ],
        line: { x1: -0.48, y1: 0.02, x2: 0.02, y2: -0.42 },
      },
    },
    { typed: "חיובי: x < -2, שלילי: x > -2" },
    { typed: "f(-10)=-(-10)-2" },
    { typed: "f(-10)=8" },
    { typed: "לא" },
  ]);
  add(ex2.ok && ex2.progress.done.sketch && ex2.progress.done.on
    ? { ok: true, id: "ex2-path" }
    : fail("ex2-path", JSON.stringify(ex2)));

  var badPoint = handler.handle({
    intent: "sketch-point",
    levelId: "calc-linear-1",
    exerciseIndex: 1,
    point: { x: 0, y: -2, qx: 0.4, qy: -0.4 },
    sketch: { points: [] },
    progress: { done: { mono: true, axes: true }, phase: {}, eq: {}, rootKnown: true, axes: {}, regions: {} },
  });
  add(!badPoint.ok ? { ok: true, id: "point-off-axis" } : fail("point-off-axis", badPoint.message));

  var offGraph = handler.handle({
    intent: "sketch-point",
    levelId: "calc-linear-1",
    exerciseIndex: 1,
    point: { x: -1, y: 0, qx: -0.22, qy: 0.02 },
    sketch: { points: [] },
    progress: { done: { mono: true, axes: true }, phase: {}, eq: {}, rootKnown: true, axes: {}, regions: {} },
  });
  add(!offGraph.ok && /אינה על גרף/.test(offGraph.message || "")
    ? { ok: true, id: "point-off-graph" }
    : fail("point-off-graph", offGraph.message || ""));

  var offGraphLine = handler.handle({
    intent: "sketch",
    levelId: "calc-linear-1",
    exerciseIndex: 1,
    sketch: {
      points: [{ x: -1, y: 0, qx: -0.22, qy: 0.02 }],
      line: { x1: -0.22, y1: 0.02, x2: 0.4, y2: -0.62 },
    },
    progress: { done: { mono: true, axes: true }, phase: {}, eq: {}, rootKnown: true, axes: {}, regions: {} },
  });
  add(!offGraphLine.ok && /אינה על גרף/.test(offGraphLine.message || "")
    ? { ok: true, id: "line-on-wrong-point" }
    : fail("line-on-wrong-point", offGraphLine.message || ""));

  var flat = handler.handle({
    intent: "sketch",
    levelId: "calc-linear-1",
    exerciseIndex: 2,
    sketch: { points: [], line: { x1: -0.8, y1: 0.36, x2: 0.75, y2: 0.34 } },
    progress: { done: { mono: true }, phase: {}, eq: {}, rootKnown: false, axes: {}, regions: { mono: { inc: true, dec: true } } },
  });
  add(flat.ok ? { ok: true, id: "flat-above" } : fail("flat-above", flat.message));

  var flatLow = handler.handle({
    intent: "sketch",
    levelId: "calc-linear-1",
    exerciseIndex: 2,
    sketch: { points: [], line: { x1: -0.8, y1: -0.36, x2: 0.75, y2: -0.34 } },
    progress: { done: { mono: true }, phase: {}, eq: {}, rootKnown: false, axes: {}, regions: {} },
  });
  add(!flatLow.ok ? { ok: true, id: "flat-below" } : fail("flat-below", flatLow.message));

  var ex3 = play(handler, "calc-linear-1", 2, [
    { typed: "פונקציה קבועה שלא עולה ולא יורדת" },
    { sketch: { points: [], line: { x1: -0.7, y1: 0.4, x2: 0.7, y2: 0.42 } } },
    { typed: "חיובי: כל x, שלילי: אין" },
    { typed: "כן" },
  ]);
  add(ex3.ok && ex3.progress.done.claim ? { ok: true, id: "ex3-path" } : fail("ex3-path", JSON.stringify(ex3)));

  var claimNo = handler.handle({
    intent: "check",
    levelId: "calc-linear-1",
    exerciseIndex: 2,
    typed: "לא",
    progress: { done: { mono: true, sketch: true, sign: true }, phase: {}, eq: {}, rootKnown: false, axes: {}, regions: {} },
  });
  add(!claimNo.ok ? { ok: true, id: "claim-no" } : fail("claim-no", claimNo.message));

  var graph = engine.DoctematicaFnGraph;
  var expectRise = engine.DoctematicaFnModel.sketchExpectations(engine.DoctematicaFnModel.analyze("x+7"));
  var rise = graph.validateSketch({
    line: { x1: -0.5, y1: -0.1, x2: 0.45, y2: 0.6 },
    points: [],
  }, expectRise);
  add(rise.ok ? { ok: true, id: "rise-ok" } : fail("rise-ok", rise.message));
  var riseWrong = graph.validateSketch({
    line: { x1: -0.2, y1: 0.5, x2: 0.6, y2: -0.2 },
    points: [],
  }, expectRise);
  add(!riseWrong.ok ? { ok: true, id: "rise-wrong" } : fail("rise-wrong", riseWrong.message));

  var byY = play(handler, "calc-linear-1", 0, [
    { typed: "y=3+7" },
    { typed: "y=10" },
    { typed: "y=-8+7" },
    { typed: "y=-1" },
    { typed: "(-8,-1)" },
    { typed: "x+7=0" },
    { typed: "x=-7" },
    { typed: "(-7,0)" },
    { typed: "חיובי: x > -7, שלילי: x < -7" },
    { typed: "עולה: כל x, יורדת: אין" },
  ]);
  add(byY.ok && byY.progress.done.mono && /f\(3\)/.test(String((handler.handle({
    intent: "one-step",
    levelId: "calc-linear-1",
    exerciseIndex: 0,
  }).show || "")))
    ? { ok: true, id: "y-equals" }
    : fail("y-equals", JSON.stringify(byY)));

  var yAxes = play(handler, "calc-linear-1", 1, [
    { typed: "יורדת: כל x, עולה: אין" },
    { typed: "x=0" },
    { typed: "y=-0-2" },
    { typed: "y=-2" },
    { typed: "(0,-2)" },
    { typed: "y=0" },
    { typed: "x=-2" },
    { typed: "(-2,0)" },
  ]);
  add(yAxes.ok && yAxes.progress.done.axes
    ? { ok: true, id: "y-intercept" }
    : fail("y-intercept", JSON.stringify(yAxes)));

  var onY = handler.handle({
    intent: "check",
    levelId: "calc-linear-1",
    exerciseIndex: 1,
    typed: "y=-(-10)-2",
    progress: { done: { mono: true, axes: true, sketch: true, sign: true }, phase: {}, eq: {}, rootKnown: true, axes: {}, regions: {} },
  });
  add(onY.ok && /f\(/.test(onY.show || "")
    ? { ok: true, id: "y-on-graph" }
    : fail("y-on-graph", JSON.stringify(onY)));

  var sketchProgress = { done: { mono: true, axes: true }, phase: {}, eq: {}, rootKnown: true, axes: {}, regions: {} };
  var sketchShows = [];
  var sketchBoards = [];
  var sketchOk = true;
  var sketchDetail = "";
  var si;
  for (si = 0; si < 4 && sketchOk; si++) {
    var sketchStep = handler.handle({
      intent: "one-step",
      levelId: "calc-linear-1",
      exerciseIndex: 1,
      progress: sketchProgress,
    });
    if (!sketchStep.ok) {
      sketchOk = false;
      sketchDetail = sketchStep.message || "one-step";
      break;
    }
    sketchShows.push(sketchStep.show);
    sketchBoards.push(sketchStep.board);
    sketchProgress = sketchStep.progress;
    if (sketchProgress.done && sketchProgress.done.sketch) break;
  }
  add(sketchOk && sketchShows.length === 3
    && sketchShows[0] === "(0,−2)" && sketchShows[1] === "(−2,0)" && sketchShows[2] === "שרטוט הגרף"
    && sketchBoards[0] && sketchBoards[0].points.length === 1 && !sketchBoards[0].line
    && sketchBoards[1] && sketchBoards[1].points.length === 2 && !sketchBoards[1].line
    && sketchBoards[2] && sketchBoards[2].line && sketchProgress.done.sketch
    ? { ok: true, id: "sketch-one-step" }
    : fail("sketch-one-step", sketchDetail || JSON.stringify(sketchShows)));

  var flatProgress = { done: { mono: true }, phase: {}, eq: {}, rootKnown: false, axes: {}, regions: { mono: { inc: true, dec: true } } };
  var flatPoint = handler.handle({
    intent: "one-step",
    levelId: "calc-linear-1",
    exerciseIndex: 2,
    progress: flatProgress,
  });
  var flatLine = flatPoint.ok ? handler.handle({
    intent: "one-step",
    levelId: "calc-linear-1",
    exerciseIndex: 2,
    progress: flatPoint.progress,
  }) : null;
  add(flatPoint.ok && flatPoint.show === "(0,1)" && flatPoint.board && !flatPoint.board.line
    && flatLine && flatLine.ok && flatLine.show === "שרטוט הגרף" && flatLine.board && flatLine.board.line
    && flatLine.progress.done.sketch
    ? { ok: true, id: "sketch-constant" }
    : fail("sketch-constant", JSON.stringify({ point: flatPoint && flatPoint.show, line: flatLine && flatLine.show, message: (flatLine && flatLine.message) || (flatPoint && flatPoint.message) })));

  var sol2 = handler.handle({ intent: "solution", levelId: "calc-linear-1", exerciseIndex: 1 });
  function stepBlob(step) {
    if (step && step.parallel) return step.parallel.map(function (col) { return (col.steps || []).map(stepBlob).join(" "); }).join(" ");
    if (step && step.eq != null) return String(step.eq);
    return String(step || "");
  }
  var sol2text = (sol2.steps || []).map(stepBlob).join(" | ");
  add(sol2.ok && sol2text.indexOf("(0,−2)") >= 0 && sol2text.indexOf("(−2,0)") >= 0 && sol2text.indexOf("שרטוט הגרף") >= 0
    ? { ok: true, id: "sol2-sketch" }
    : fail("sol2-sketch", sol2text));

  var rootProg = null;
  var rootSplit = null;
  var rootGuard;
  for (rootGuard = 0; rootGuard < 40; rootGuard++) {
    var rootStep = handler.handle({
      intent: "one-step",
      levelId: "calc-quad-1",
      exerciseId: "calc-quad-1-ex-a007",
      progress: rootProg,
    });
    if (!rootStep.ok) break;
    rootProg = rootStep.progress;
    var rootCols = rootStep.parallel && rootStep.parallel.parallel;
    if (rootStep.axis === "x" && rootCols && rootCols.length === 2) {
      rootSplit = rootStep;
      break;
    }
  }
  var rootBlob = rootSplit ? stepBlob(rootSplit.parallel) : "";
  add(rootSplit && rootSplit.axis === "x" && /x₁/.test(rootBlob) && /x₂/.test(rootBlob) && /\(2\s*\+\s*4\)\/2/.test(rootBlob) && /\(2\s*[−-]\s*4\)\/2/.test(rootBlob) && rootSplit.show !== "x = 3"
    ? { ok: true, id: "formula-root-split" }
    : fail("formula-root-split", rootBlob || (rootSplit && rootSplit.message) || "missing"));
  var rootSol = handler.handle({ intent: "solution", levelId: "calc-quad-1", exerciseId: "calc-quad-1-ex-a007" });
  var rootSolText = (rootSol.steps || []).map(stepBlob).join(" | ");
  add(/x₁/.test(rootSolText) && /x₂/.test(rootSolText) && /\(2\s*\+\s*4\)\/2/.test(rootSolText)
    ? { ok: true, id: "formula-root-solution" }
    : fail("formula-root-solution", rootSolText.slice(0, 500)));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-fn: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL", item.id, item.detail);
  });
  if (failed.length) process.exit(1);
}

main();
