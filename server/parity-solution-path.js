"use strict";

var loadEngine = require("./load-engine").loadEngine;
var handleMixed = require("./quad-mixed").handleMixed;
var handleBiquad = require("./biquad").handleBiquad;
var createFunctionsHandler = require("./functions").createFunctionsHandler;
var createIntervalsHandler = require("./intervals").createIntervalsHandler;
var createQuadIneqHandler = require("./quad-ineq").createQuadIneqHandler;
var createArrangeHandler = require("./systems-arrange").createArrangeHandler;
var createMeetHandler = require("./meet").createMeetHandler;
var polyApi = require("./poly");
var extremaApi = require("./extrema");

function norm(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function textOf(res) {
  if (!res) return "";
  return String(res.step || res.eq || res.show || res.hint || res.message || "");
}

function actionSig(res) {
  res = res || {};
  return [
    res.path || res.enter || "",
    res.split ? "split" : "",
    norm(res.step || res.eq || res.show || ""),
  ].join("|");
}

function looksExpanded(text) {
  var t = norm(text);
  return t.indexOf("(") < 0 && /x\^?[0-9]/.test(t);
}

function bareNumber(text) {
  return /^-?\d+$/.test(norm(text));
}

function levelById(engine, id) {
  return (engine.DoctematicaCurriculum.levels || []).filter(function (level) {
    return level.id === id;
  })[0];
}

function exerciseIndex(level, id) {
  var list = (level && level.exercises) || [];
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i].id === id) return i;
  }
  return -1;
}

function main() {
  var engine = loadEngine();
  var Q = engine.DoctematicaQuadratic;
  var A = engine.DoctematicaAlgebra;
  var Teach = engine.DoctematicaTeach;
  var Fn = engine.DoctematicaFn;
  var M = engine.DoctematicaFnModel;
  var functionsApi = createFunctionsHandler(engine);
  var intervals = createIntervalsHandler(engine);
  var quadIneq = createQuadIneqHandler(engine);
  var arrange = createArrangeHandler(engine);
  var meet = createMeetHandler(engine);
  var checks = [];

  function add(ok, id, detail) {
    checks.push({ ok: !!ok, id: id, detail: detail || "" });
  }

  function run(id, fn) {
    try {
      var detail = fn();
      add(detail == null || detail === true, id, detail === true ? "" : detail || "");
    } catch (err) {
      add(false, id, err && err.stack ? err.stack.split("\n")[0] : String(err));
    }
  }

  run("product-site-splits", function () {
    var pack = Q.analyzeFactorStart("x^2-5x=0");
    var nxt = Q.nextFactorStep("x(x-5)=0", pack, {});
    if (!nxt || !nxt.split) return "expected split, got " + JSON.stringify(nxt);
    var hinted = String(nxt.hint || "") + String(nxt.explain || "");
    if (/פתחו את הסוגריים|פתיחת הסוגריים/.test(hinted)) return "site hint expands: " + hinted;
    var chain = Q.analyzeHighChainStart("x^3-3x^2=0");
    var chainNext = Q.nextHighChainStep(chain.factored, chain, {});
    if (!chainNext || !chainNext.split) return "high-power product did not split: " + JSON.stringify(chainNext);
    return true;
  });

  run("product-student-expand-continues", function () {
    var pack = Q.analyzeFactorStart("x^2-5x=0");
    var expanded = "x^2-5x=0";
    var chk = Q.checkFactorTyped("x(x-5)=0", expanded, pack, {});
    if (!chk || !chk.ok) return "classic factor rejected equivalent expansion: " + (chk && chk.message);
    var nxt = Q.nextFactorStep(expanded, pack, {});
    if (nxt && nxt.split) return "after expansion, next step split the original product";
    var mixed = Q.nextMixedStep(expanded, Q.analyzeMixedStart(expanded));
    if (!nxt || !mixed || norm(nxt.eq || "") !== norm(mixed.eq || "")) {
      return "next step did not continue from the expanded equation: " + JSON.stringify(nxt) + " vs " + JSON.stringify(mixed);
    }
    var voice = String(nxt.hint || "") + String(nxt.explain || "");
    if (/פצלו את המכפלה/.test(voice)) return "hint returned to splitting the original product: " + voice;
    return true;
  });

  run("product-expand-no-engine-falls-back", function () {
    var start = "(x^2-7x+1)*(x-2)=0";
    var expanded = "x^3-9x^2+15x-2=0";
    var ex = {
      id: "path-product",
      poly: true,
      fn: "(x^2-7x+1)*(x-2)",
      stem: "",
      parts: [{ label: "", text: "אפסים" }],
      tasks: [{ id: "z", kind: "zeros" }],
    };
    var progress = {
      poly: true,
      task: 0,
      phase: "algebra",
      algebra: [start],
      chain: null,
      route: { engine: "product", start: start },
      points: [],
      plugs: {},
      known: [],
    };
    var chk = polyApi.handle(engine, ex, { intent: "check", typed: expanded, progress: progress });
    if (!chk || !chk.ok) return "equivalent cubic expansion rejected: " + (chk && chk.message);
    var blob = String(chk.message || "") + String(chk.hint || "");
    if (!/פתיחה נכונה/.test(blob)) return "acceptance did not say the expansion was correct: " + blob;
    if (/x₁|נוסחת/.test(blob) && /מעלה שלישית|cubic/.test(blob)) return "invented a cubic method: " + blob;
    var next = polyApi.handle(engine, ex, { intent: "one-step", progress: chk.progress });
    var hint = polyApi.handle(engine, ex, { intent: "hint", progress: chk.progress });
    var follow = String(next && (next.message || next.hint || next.show || "")) + String(hint && hint.hint || "");
    if (!/פתיחה נכונה/.test(follow)) return "next step did not acknowledge the expansion: " + follow;
    if (!/מכפלה המקורית/.test(follow)) return "next step did not fall back to the factored form: " + follow;
    var chain = next && next.progress && next.progress.chain;
    var eqs = (chain && chain.eqs) || [];
    if (!chain || !chain.split) return "did not split the original product: " + JSON.stringify(chain);
    var joined = norm(eqs.join(" "));
    if (joined.indexOf("x^2-7x+1=0") < 0 || joined.indexOf("x-2=0") < 0) {
      return "split did not use the original factors: " + eqs.join(" | ");
    }
    return true;
  });

  run("quadratic-same-path-from-function", function () {
    var level = levelById(engine, "calc-quad-1");
    var index = exerciseIndex(level, "calc-quad-1-ex-a001");
    var progress = Fn.freshProgress();
    progress.done = { f2: true };
    var built = functionsApi.handle({
      intent: "one-step",
      levelId: "calc-quad-1",
      exerciseIndex: index,
      progress: progress,
    });
    if (!built || !built.ok) return "function did not build an equation: " + (built && built.message);
    var eq = String(built.show || "");
    var mixed = handleMixed(engine, { intent: "one-step", start: eq, history: [eq] });
    var again = functionsApi.handle({
      intent: "one-step",
      levelId: "calc-quad-1",
      exerciseIndex: index,
      progress: built.progress,
    });
    if (!again || !again.ok) return "function next after equation failed: " + (again && again.message);
    if (actionSig(mixed) !== actionSig(again)) {
      return "function " + actionSig(again) + " != mixed " + actionSig(mixed) + " on " + eq;
    }
    var hintFn = functionsApi.handle({
      intent: "hint",
      levelId: "calc-quad-1",
      exerciseIndex: index,
      progress: built.progress,
    });
    var hintMixed = handleMixed(engine, { intent: "hint", start: eq, history: [eq] });
    if (norm(hintFn && hintFn.hint) !== norm(hintMixed && hintMixed.hint)) {
      return "hint function [" + (hintFn && hintFn.hint) + "] != mixed [" + (hintMixed && hintMixed.hint) + "]";
    }
    return true;
  });

  run("quadratic-same-path-from-poly", function () {
    var ex = {
      id: "path-quad",
      poly: true,
      fn: "x^2-5x+6",
      stem: "",
      parts: [{ label: "", text: "אפסים" }],
      tasks: [{ id: "z", kind: "zeros" }],
    };
    var eq = "x^2-5x+6=0";
    var progress = {
      poly: true,
      task: 0,
      phase: "algebra",
      algebra: [eq],
      chain: null,
      route: { engine: "quad", start: eq },
      points: [],
      plugs: {},
      known: [],
    };
    var step = polyApi.handle(engine, ex, { intent: "one-step", progress: progress });
    var mixed = handleMixed(engine, { intent: "one-step", start: eq, history: [eq] });
    if (actionSig(step) !== actionSig(mixed)) {
      return "poly " + actionSig(step) + " != mixed " + actionSig(mixed);
    }
    var hint = polyApi.handle(engine, ex, { intent: "hint", progress: progress });
    var hintMixed = handleMixed(engine, { intent: "hint", start: eq, history: [eq] });
    if (norm(hint && hint.hint) !== norm(hintMixed && hintMixed.hint)) {
      return "hint poly [" + (hint && hint.hint) + "] != mixed [" + (hintMixed && hintMixed.hint) + "]";
    }
    return true;
  });

  run("function-product-splits", function () {
    var level = levelById(engine, "calc-quad-1");
    var index = exerciseIndex(level, "calc-quad-1-ex-a012");
    var progress = Fn.freshProgress();
    progress.axes = { axes: { y: "done", x: "set" } };
    progress.eq = { "axes:x": "(x+4)(x-2)=0" };
    var step = functionsApi.handle({
      intent: "one-step",
      levelId: "calc-quad-1",
      exerciseIndex: index,
      progress: progress,
    });
    var shown = textOf(step);
    if (looksExpanded(shown)) return "next step expanded the product: " + shown;
    if (norm(shown).indexOf("x+4=0") < 0 && norm(shown).indexOf("x-2=0") < 0 && norm(shown).indexOf("x+4") < 0) {
      return "expected a split factor, got " + shown;
    }
    return true;
  });

  run("biquad-site-substitutes-detected-power", function () {
    var start = "x^4-10x^2+9=0";
    var step = handleBiquad(engine, { intent: "one-step", start: start, history: [start] });
    if (norm(textOf(step)).indexOf("t=x^2") < 0) return "expected t=x^2, got " + textOf(step);
    var higher = "x^6-9x^3+8=0";
    var highStep = handleBiquad(engine, { intent: "one-step", start: higher, history: [higher] });
    if (norm(textOf(highStep)).indexOf("t=x^3") < 0) return "expected t=x^3, got " + textOf(highStep);
    var sol = handleBiquad(engine, { intent: "solution", start: start, history: [] });
    var eqs = (sol.steps || []).map(function (s) { return norm(s.eq); }).join(" ");
    if (eqs.indexOf("t=x^2") < 0) return "solution missing substitution";
    if (eqs.indexOf("x^2=") < 0 && eqs.indexOf("x=") < 0) return "solution does not return to x";
    return true;
  });

  run("biquad-direct-t-equation", function () {
    var start = "x^4-10x^2+9=0";
    var direct = handleBiquad(engine, {
      intent: "check",
      start: start,
      history: [start],
      typed: "t^2-10t+9=0",
    });
    if (!direct || !direct.ok || direct.solved) return "direct t equation not accepted as a continuing step: " + JSON.stringify(direct);
    var nxt = handleBiquad(engine, {
      intent: "one-step",
      start: start,
      history: [start, "t^2-10t+9=0"],
    });
    if (norm(textOf(nxt)) === "t=x^2") return "next step forced the skipped substitution line";
    return true;
  });

  run("biquad-cannot-finish-at-t", function () {
    var start = "x^4-10x^2+9=0";
    var closed = handleBiquad(engine, {
      intent: "check",
      start: start,
      history: [start, "t=x^2", "t^2-10t+9=0", "t=1, t=9"],
      typed: "t=1, t=9",
    });
    if (closed && closed.solved) return "finished at t values";
    var nxt = handleBiquad(engine, {
      intent: "one-step",
      start: start,
      history: [start, "t=x^2", "t^2-10t+9=0", "t=1, t=9"],
    });
    var shown = norm(textOf(nxt));
    if (shown.indexOf("x") < 0) return "next step did not return to x: " + textOf(nxt);
    return true;
  });

  run("meet-prefers-equate", function () {
    var step = meet.handle({
      topic: "calculus-meet",
      intent: "one-step",
      eq1: "y=x+5",
      eq2: "y=2x+4",
      history: [],
    });
    var shown = norm(textOf(step));
    if (shown.indexOf("x+5") < 0 || shown.indexOf("2x+4") < 0) return "expected equated equation, got " + textOf(step);
    var sol = meet.handle({
      topic: "calculus-meet",
      intent: "solution",
      eq1: "y=x+5",
      eq2: "y=2x+4",
      history: [],
    });
    var blob = (sol.steps || []).map(function (s) { return norm(s.eq || s); }).join(" ");
    if (blob.indexOf("x+5") < 0) return "solution did not equate";
    if (blob.indexOf("(") < 0 && blob.indexOf(",") < 0) return "solution did not reach an ordered point";
    return true;
  });

  run("meet-equivalent-substitution-accepted", function () {
    var chk = meet.handle({
      topic: "calculus-meet",
      intent: "check",
      eq1: "y=x+5",
      eq2: "y=2x+4",
      history: [],
      typed: "x+5=2x+4",
    });
    if (!chk || chk.ok === false) return "equated line rejected: " + (chk && chk.message);
    return true;
  });

  run("axis-continues-started-x", function () {
    var level = levelById(engine, "calc-linear-1");
    var index = exerciseIndex(level, "calc-linear-1-ex-a002");
    var progress = Fn.freshProgress();
    progress.done = { mono: true };
    var started = functionsApi.handle({
      intent: "check",
      levelId: "calc-linear-1",
      exerciseIndex: index,
      progress: progress,
      typed: "y=0",
    });
    if (!started || !started.ok) return "y=0 rejected: " + (started && started.message);
    var nxt = functionsApi.handle({
      intent: "one-step",
      levelId: "calc-linear-1",
      exerciseIndex: index,
      progress: started.progress,
    });
    if (norm(textOf(nxt)) === "x=0") return "next step left the started x-intercept for the y-axis";
    return true;
  });

  run("axis-continues-started-y", function () {
    var index = exerciseIndex(levelById(engine, "calc-linear-1"), "calc-linear-1-ex-a002");
    var progress = Fn.freshProgress();
    progress.done = { mono: true };
    var started = functionsApi.handle({
      intent: "check",
      levelId: "calc-linear-1",
      exerciseIndex: index,
      progress: progress,
      typed: "x=0",
    });
    if (!started || !started.ok) return "x=0 rejected: " + (started && started.message);
    var nxt = functionsApi.handle({
      intent: "one-step",
      levelId: "calc-linear-1",
      exerciseIndex: index,
      progress: started.progress,
    });
    var shown = norm(textOf(nxt));
    if (shown.indexOf("y=0") >= 0 || shown.indexOf("=0") === 0) return "next step left the y-intercept: " + textOf(nxt);
    if (shown.indexOf("f(0)") < 0 && shown.indexOf("-2") < 0 && shown.indexOf("(0") < 0) {
      return "expected f(0) or the y-intercept point, got " + textOf(nxt);
    }
    return true;
  });

  run("x-intercept-ends-as-point", function () {
    var index = exerciseIndex(levelById(engine, "calc-linear-1"), "calc-linear-1-ex-a001");
    var progress = Fn.freshProgress();
    progress.done = { f3: true, pt: true };
    progress.phase = { zero: "root" };
    progress.rootKnown = true;
    var bare = functionsApi.handle({
      intent: "check",
      levelId: "calc-linear-1",
      exerciseIndex: index,
      progress: progress,
      typed: "-7",
    });
    if (bare && bare.ok && bare.progress && bare.progress.done && bare.progress.done.zero) {
      return "bare x value closed the x-intercept";
    }
    var point = functionsApi.handle({
      intent: "check",
      levelId: "calc-linear-1",
      exerciseIndex: index,
      progress: progress,
      typed: "(-7,0)",
    });
    if (!point || !point.ok) return "ordered point rejected: " + (point && point.message);
    return true;
  });

  run("y-intercept-ends-as-point", function () {
    var index = exerciseIndex(levelById(engine, "calc-linear-1"), "calc-linear-1-ex-a002");
    var progress = Fn.freshProgress();
    progress.done = { mono: true };
    progress.axes = { axes: { x: "", y: "value" } };
    var point = functionsApi.handle({
      intent: "check",
      levelId: "calc-linear-1",
      exerciseIndex: index,
      progress: progress,
      typed: "(0,-2)",
    });
    if (!point || !point.ok) return "(0,-2) rejected: " + (point && point.message);
    var polyEx = levelById(engine, "calc-poly-1").exercises[0];
    var wrong = polyApi.handle(engine, polyEx, { intent: "check", typed: "x=0" });
    if (wrong && wrong.ok) return "poly accepted x=0 as an x-intercept";
    return true;
  });

  run("empty-wording", function () {
    var samples = ["אין", "אין פתרון", "אין פתרונות", "אף x", "∅"];
    var i;
    for (i = 0; i < samples.length; i++) {
      var word = samples[i];
      if (!M.isEmptySet(word)) return "shared parser rejected " + word;
      var lin = A.checkIneqStep("5<3", word);
      if (!lin || !lin.ok || !lin.solved) return "linear inequality rejected " + word + ": " + (lin && lin.message);
    }
    var falseNone = A.checkIneqStep("2<5", "אין פתרון");
    if (falseNone && falseNone.ok && falseNone.solved) return "אין פתרון accepted for a true inequality";
    return true;
  });

  run("all-x-wording", function () {
    var samples = ["כל x", "כל איקס", "כל המספרים הממשיים", "R", "ℝ"];
    var i;
    for (i = 0; i < samples.length; i++) {
      var word = samples[i];
      if (!M.isAllReals(word)) return "shared parser rejected " + word;
      var lin = A.checkIneqStep("2<5", word);
      if (!lin || !lin.ok || !lin.solved) return "linear inequality rejected " + word + ": " + (lin && lin.message);
    }
    return true;
  });

  run("min-max-wording", function () {
    var mins = ["min", "minimum", "מינ", "מין", "מינימום"];
    var maxes = ["max", "maximum", "מקס", "מקסימום"];
    var i;
    for (i = 0; i < mins.length; i++) {
      if (extremaApi.normalizeExtremumType(mins[i]) !== "MIN") return "extrema rejected " + mins[i];
    }
    for (i = 0; i < maxes.length; i++) {
      if (extremaApi.normalizeExtremumType(maxes[i]) !== "MAX") return "extrema rejected " + maxes[i];
    }
    if (extremaApi.normalizeExtremumType("MIN") !== "MIN") return "case folded max/min failed";
    var index = exerciseIndex(levelById(engine, "calc-quad-1"), "calc-quad-1-ex-a009");
    var progress = Fn.freshProgress();
    progress.phase = { ext: "point" };
    var named = functionsApi.handle({
      intent: "check",
      levelId: "calc-quad-1",
      exerciseIndex: index,
      progress: progress,
      typed: "min",
    });
    if (!named || !named.ok) return "parabola rejected min: " + (named && named.message);
    var swapped = functionsApi.handle({
      intent: "check",
      levelId: "calc-quad-1",
      exerciseIndex: index,
      progress: progress,
      typed: "מקסימום",
    });
    if (swapped && swapped.ok) return "parabola accepted maximum for a minimum";
    var card = extremaApi.handle(engine, levelById(engine, "calc-extrema-1").exercises[0], {
      intent: "check",
      extrema: [{ x: "3", type: "מינ" }],
    });
    if (!card || !card.ok) return "extrema card rejected מין: " + (card && card.message);
    return true;
  });

  run("graph-count-not-revealed", function () {
    var level = levelById(engine, "calc-quad-1");
    var index = -1;
    var ex = null;
    (level.exercises || []).forEach(function (item, i) {
      if (index >= 0) return;
      if ((item.tasks || []).some(function (task) { return task.kind === "fnCount"; })) {
        index = i;
        ex = item;
      }
    });
    var progress = Fn.freshProgress();
    (ex.tasks || []).forEach(function (task) {
      if (task.kind !== "fnCount") progress.done[task.id] = true;
    });
    var step = functionsApi.handle({
      intent: "one-step",
      levelId: "calc-quad-1",
      exerciseIndex: index,
      progress: progress,
    });
    if (bareNumber(textOf(step))) return "fnCount next step revealed " + textOf(step);
    var probeLevel = levelById(engine, "calc-extrema-1");
    var probeIndex = exerciseIndex(probeLevel, "calc-extrema-1-ex-a021");
    var probeProgress = {};
    var guard = 0;
    while (guard < 4) {
      guard += 1;
      var probe = functionsApi.handle({
        intent: "one-step",
        levelId: "calc-extrema-1",
        exerciseIndex: probeIndex,
        progress: probeProgress,
      });
      if (bareNumber(textOf(probe))) return "level probe revealed the count: " + textOf(probe);
      probeProgress = (probe && probe.progress) || probeProgress;
      if (probe && probe.solved) break;
    }
    return true;
  });

  run("linear-inequality-negative-flip", function () {
    var bad = A.checkIneqStep("-3x>21", "x>-7");
    if (bad && bad.ok) return "division by negative without a flip was accepted";
    var good = A.checkIneqStep("-3x>21", "x<-7");
    if (!good || !good.ok) return "correct flip rejected: " + (good && good.message);
    return true;
  });

  run("linear-inequality-positive-no-flip", function () {
    var bad = A.checkIneqStep("3x>12", "x<4");
    if (bad && bad.ok) return "flip after a positive division was accepted";
    var good = A.checkIneqStep("3x>12", "x>4");
    if (!good || !good.ok) return "keeping the sign was rejected: " + (good && good.message);
    return true;
  });

  run("and-is-intersection", function () {
    var body = { op: "intersection", conds: ["x > 3", "x < 7"], history: ["x > 3", "x < 7"], typed: "x > 3 או x < 7" };
    var bad = intervals.handle(Object.assign({ intent: "check" }, body));
    if (bad && bad.ok && bad.solved) return "union accepted for AND";
    var good = intervals.handle({
      intent: "check",
      op: "intersection",
      conds: ["x > 3", "x < 7"],
      history: ["x > 3", "x < 7"],
      typed: "3 < x < 7",
    });
    if (!good || !good.ok) return "intersection rejected: " + (good && good.message);
    return true;
  });

  run("or-is-union", function () {
    var bad = intervals.handle({
      intent: "check",
      op: "union",
      conds: ["x > 6", "x < 1"],
      history: ["x > 6", "x < 1"],
      typed: "1 ≤ x ≤ 6",
    });
    if (bad && bad.ok && bad.solved) return "intersection accepted for OR";
    var good = intervals.handle({
      intent: "check",
      op: "union",
      conds: ["x > 6", "x < 1"],
      history: ["x > 6", "x < 1"],
      typed: "x < 1 או x > 6",
    });
    if (!good || !good.ok) return "union rejected: " + (good && good.message);
    return true;
  });

  run("drawing-optional", function () {
    var good = intervals.handle({
      intent: "check",
      op: "intersection",
      conds: ["x > 3", "x < 7"],
      history: ["x > 3", "x < 7"],
      typed: "3 < x < 7",
    });
    if (!good || !good.solved) return "final domain required a drawing";
    var step = intervals.handle({
      intent: "one-step",
      op: "intersection",
      conds: ["x > 3", "x < 7"],
      history: ["x > 3", "x < 7"],
    });
    if (step && step.drawingAction && !step.step) return "next step required a drawing before the domain";
    return true;
  });

  run("terminating-decimal-not-fraction", function () {
    if (A.formatNumber(-7 / 2) !== "-3.5") return "formatNumber(-7/2) = " + A.formatNumber(-7 / 2);
    if (A.formatNumber(1 / 3).indexOf("/") < 0) return "1/3 became a decimal";
    if (Q.fmt({ n: -7, d: 2 }) !== "-3.5") return "root fmt = " + Q.fmt({ n: -7, d: 2 });
    if (Q.fmt({ n: 1, d: 3 }) !== "1/3") return "repeating root fmt = " + Q.fmt({ n: 1, d: 3 });
    var sol = quadIneq.handle({ intent: "solution", ineq: "-4x^2-28x-49>0" });
    var blob = (sol.steps || []).map(function (s) { return String(s.eq || ""); }).join(" ");
    var flat = blob.replace(/[−–—]/g, "-");
    if (flat.indexOf("-3.5") < 0) return "double root was not written as a decimal: " + blob;
    if (flat.indexOf("-7/2") >= 0 || flat.indexOf("7/2") >= 0) return "terminating root stayed a fraction: " + blob;
    return true;
  });

  run("quadratic-ineq-parabola-default", function () {
    var sol = quadIneq.handle({ intent: "solution", ineq: "x^2-7x+10<0" });
    var blob = (sol.steps || []).map(function (s) { return String(s.eq || "") + " " + String(s.explain || ""); }).join("\n");
    if (!/פרבולה/.test(blob)) return "full solution did not use the parabola";
    var sampleBeforeSketch = /מציבים מספר מבחן/.test(blob) && blob.indexOf("מציבים מספר מבחן") < blob.indexOf("פרבולה");
    if (sampleBeforeSketch) return "full solution used test points before the parabola";
    return true;
  });

  run("quadratic-ineq-stay-on-sign-check", function () {
    var step = quadIneq.handle({
      intent: "one-step",
      ineq: "x^2-7x+10<0",
      history: ["x^2-7x+10=0", "x=2", "x=5"],
      sign: { open: true, regions: [{ x: "0" }] },
    });
    if (step && step.parabolaAction) return "next step switched from sign check to the parabola";
    var shown = textOf(step) + String((step && step.reason) || "");
    if (/פרבולה/.test(shown) && !/הצב|סימן|מספר/.test(shown)) return "next step left the sign check: " + shown;
    return true;
  });

  run("strict-excludes-zeros", function () {
    var bad = quadIneq.handle({
      intent: "check",
      ineq: "x^2-7x+10<0",
      history: ["x^2-7x+10=0", "x=2", "x=5"],
      typed: "2 ≤ x ≤ 5",
    });
    if (bad && bad.ok && bad.solved) return "closed interval accepted for <";
    var good = quadIneq.handle({
      intent: "check",
      ineq: "x^2-7x+10<0",
      history: ["x^2-7x+10=0", "x=2", "x=5"],
      typed: "2 < x < 5",
    });
    if (!good || !(good.ok || good.solved)) return "open interval rejected: " + (good && good.message);
    return true;
  });

  run("weak-includes-zeros", function () {
    var bad = quadIneq.handle({
      intent: "check",
      ineq: "x^2-7x+10<=0",
      history: ["x^2-7x+10=0", "x=2", "x=5"],
      typed: "2 < x < 5",
    });
    if (bad && bad.ok && bad.solved) return "open interval accepted for <=";
    var good = quadIneq.handle({
      intent: "check",
      ineq: "x^2-7x+10<=0",
      history: ["x^2-7x+10=0", "x=2", "x=5"],
      typed: "2 ≤ x ≤ 5",
    });
    if (!good || !(good.ok || good.solved)) return "closed interval rejected: " + (good && good.message);
    return true;
  });

  run("arrange-keeps-substitution", function () {
    var step = arrange.handle({
      topic: "systems-arrange",
      intent: "one-step",
      eq1: "x+y=5",
      eq2: "x-y=1",
      history: ["method:sub"],
    });
    var blob = JSON.stringify(step);
    if (blob.indexOf("method:elim") >= 0) return "substitution was replaced by elimination";
    var hint = arrange.handle({
      topic: "systems-arrange",
      intent: "hint",
      eq1: "x+y=5",
      eq2: "x-y=1",
      history: ["method:sub"],
    });
    if (/השוואת מקדמים/.test(String(hint && hint.hint)) && !/הצב/.test(String(hint && hint.hint))) {
      return "hint left substitution: " + hint.hint;
    }
    return true;
  });

  run("arrange-keeps-elimination", function () {
    var step = arrange.handle({
      topic: "systems-arrange",
      intent: "one-step",
      eq1: "x+y=5",
      eq2: "x-y=1",
      history: ["method:elim"],
    });
    var blob = JSON.stringify(step);
    if (blob.indexOf("method:sub") >= 0) return "elimination was replaced by substitution";
    return true;
  });

  run("arrange-default-when-unchosen", function () {
    var step = arrange.handle({
      topic: "systems-arrange",
      intent: "one-step",
      eq1: "x+y=5",
      eq2: "x-y=1",
      history: [],
    });
    if (!step || step.ok === false) return "no default method: " + (step && step.message);
    if (String(step.step || "").indexOf("method:") !== 0) return "expected a method choice, got " + step.step;
    return true;
  });

  run("meet-point-survives", function () {
    var level = levelById(engine, "calc-meet-1");
    var index = -1;
    (level.exercises || []).forEach(function (ex, i) {
      if (ex.stage === "compare" && index < 0) index = i;
    });
    var progress = {
      done: {},
      phase: {},
      work: [],
      known: { xs: [1], points: [{ x: 1, y: 2 }] },
      held: null,
    };
    var hint = functionsApi.handle({
      intent: "hint",
      levelId: "calc-meet-1",
      exerciseIndex: index,
      progress: progress,
    });
    if (/מצאו את נקודת המפגש|השוו בין/.test(String(hint && hint.hint)) && !(hint.view && hint.view.task && hint.view.task.kind !== "meetPoint")) {
      var taskKind = hint.view && hint.view.task && hint.view.task.kind;
      if (taskKind === "meetPoint" || taskKind === "meetX") return "later part asked to find the intersection again: " + hint.hint;
    }
    return true;
  });

  run("zeros-survive-for-sign", function () {
    var index = exerciseIndex(levelById(engine, "calc-linear-1"), "calc-linear-1-ex-a001");
    var progress = Fn.freshProgress();
    progress.done = { f3: true, pt: true, zero: true };
    progress.rootKnown = true;
    var step = functionsApi.handle({
      intent: "one-step",
      levelId: "calc-linear-1",
      exerciseIndex: index,
      progress: progress,
    });
    if (norm(textOf(step)).indexOf("=0") >= 0 && norm(textOf(step)).indexOf("x+7") >= 0) {
      return "sign part solved f(x)=0 again: " + textOf(step);
    }
    return true;
  });

  run("parameter-survives", function () {
    var index = exerciseIndex(levelById(engine, "calc-param-1"), "calc-param-1-ex-a009");
    var progress = Fn.freshProgress();
    progress.done = { p: true };
    progress.params = { m: -7 };
    var step = functionsApi.handle({
      intent: "one-step",
      levelId: "calc-param-1",
      exerciseIndex: index,
      progress: progress,
    });
    var shown = textOf(step);
    if (/מצאו את m|מצאו את הפרמטר/.test(shown)) return "parameter was requested again: " + shown;
    if (shown.indexOf("-7") < 0 && shown.indexOf("−7") < 0) return "updated function was not used: " + shown;
    return true;
  });

  run("extremum-survives", function () {
    var ex = levelById(engine, "calc-extrema-1").exercises[0];
    var step = extremaApi.handle(engine, ex, {
      intent: "one-step",
      progress: { phase: "domains", found: [{ x: 3, type: "MIN" }] },
    });
    var shown = textOf(step);
    if (/מינימום|מקסימום|min|max/.test(shown) && /עול|יורד|x/.test(shown) === false) {
      return "extrema part asked for the type again: " + shown;
    }
    if (!/x|עול|יורד|3/.test(shown)) return "expected a monotonicity interval, got " + shown;
    return true;
  });

  run("linear-poly-matches-teach", function () {
    var eq = "2x+4=0";
    var teach = Teach.nextAction(eq) || {};
    var ex = {
      id: "path-linear",
      poly: true,
      fn: "2x+4",
      stem: "",
      parts: [{ label: "", text: "אפסים" }],
      tasks: [{ id: "z", kind: "zeros" }],
    };
    var progress = {
      poly: true,
      task: 0,
      phase: "algebra",
      algebra: [eq],
      route: { engine: "linear", start: eq },
      points: [],
      plugs: {},
      known: [],
    };
    var step = polyApi.handle(engine, ex, { intent: "one-step", progress: progress });
    if (norm(textOf(step)) !== norm(teach.eq || "")) {
      return "poly " + textOf(step) + " != teach " + teach.eq;
    }
    return true;
  });

  run("lost-zero-rejected", function () {
    var start = "x^3-3x^2=0";
    var pack = Q.analyzeHighChainStart(start);
    var dropped = Q.checkHighChainTyped(start, "x=3", pack, {});
    if (dropped && (dropped.solved || dropped.solvedAll)) return "x=3 alone closed an equation that also has x=0";
    var divided = Q.checkHighChainTyped(start, "x-3=0", pack, {});
    if (divided && divided.ok && !divided.errorId && (divided.solved || divided.solvedAll)) {
      return "dividing off the power of x was accepted as the whole solution";
    }
    return true;
  });

  run("skip-keeps-solutions", function () {
    var jump = A.checkStep("2(x+6)=20", "x=4");
    if (!jump || !jump.ok || !jump.solved) return "equivalent final line rejected: " + (jump && jump.message);
    var wrong = A.checkStep("2(x+6)=20", "x=5");
    if (wrong && wrong.ok) return "a wrong final line was accepted";
    return true;
  });

  var failed = checks.filter(function (item) { return !item.ok; });
  checks.forEach(function (item) {
    if (item.ok) console.log("ok  " + item.id);
    else console.log("FAIL " + item.id + (item.detail ? "\n     " + item.detail : ""));
  });
  console.log(checks.length + " checks, " + failed.length + " failed");
  process.exit(failed.length ? 1 : 0);
}

main();
