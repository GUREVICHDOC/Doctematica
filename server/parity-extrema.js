"use strict";

var loadEngine = require("./load-engine").loadEngine;
var extrema = require("./extrema");
var studentDto = require("./student-dto");
var functionsApi = require("./functions");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function main() {
  var engine = loadEngine();
  var handle = functionsApi.createFunctionsHandler(engine).handle;
  var levels = engine.DoctematicaCurriculum.levels || [];
  var level = levels.filter(function (item) { return item.id === "calc-extrema-1"; })[0];
  var checks = [];

  function add(result) {
    checks.push(result);
  }

  add(level && level.subtopic === "pre" && level.title === "נקודות קיצון ותחומי עלייה וירידה"
    ? { ok: true, id: "level" }
    : fail("level", level && level.title));
  add(level && level.exercises.length === 25 ? { ok: true, id: "twenty-five" } : fail("twenty-five", String(level && level.exercises.length)));

  var byId = {};
  (level.exercises || []).forEach(function (ex) { byId[ex.id] = ex; });

  ["a001", "a002", "a003"].forEach(function (tail) {
    var ex = byId["calc-extrema-1-ex-" + tail];
    add(ex && ex.yKnown === false ? { ok: true, id: "x-only-" + tail } : fail("x-only-" + tail));
  });
  ["a004", "a005", "a006"].forEach(function (tail) {
    var ex = byId["calc-extrema-1-ex-" + tail];
    add(ex && ex.yKnown === true ? { ok: true, id: "point-" + tail } : fail("point-" + tail));
  });

  (level.exercises || []).forEach(function (ex) {
    (ex.extrema || []).forEach(function (pt) {
      var left = extrema.sideLeft(ex, pt.x);
      var right = extrema.sideRight(ex, pt.x);
      var expect = left === "dec" && right === "inc" ? "min" : left === "inc" && right === "dec" ? "max" : "";
      add(pt.type === expect
        ? { ok: true, id: "mono-" + ex.n + "-" + pt.x }
        : fail("mono-" + ex.n + "-" + pt.x, left + " " + right + " " + pt.type));
    });
  });

  ["min", "MIN", "Min", "minimum", "Minimum", "MINIMUM", "מינ", "מין", "מינימום"].forEach(function (word) {
    add(extrema.normalizeExtremumType(word) === "MIN" ? { ok: true, id: "norm-min-" + word } : fail("norm-min-" + word, extrema.normalizeExtremumType(word)));
  });
  ["max", "MAX", "Max", "maximum", "Maximum", "MAXIMUM", "מקס", "מקסימום"].forEach(function (word) {
    add(extrema.normalizeExtremumType(word) === "MAX" ? { ok: true, id: "norm-max-" + word } : fail("norm-max-" + word, extrema.normalizeExtremumType(word)));
  });
  add(extrema.normalizeExtremumType("  מינימום  ") === "MIN" ? { ok: true, id: "norm-trim" } : fail("norm-trim"));
  add(extrema.normalizeExtremumType("גדול") === "UNKNOWN" ? { ok: true, id: "norm-unknown" } : fail("norm-unknown"));

  function post(id, body) {
    return handle(Object.assign({ levelId: "calc-extrema-1", exerciseId: id, intent: "check" }, body));
  }

  var open = studentDto.openProblem(engine, "calc-extrema-1", 0);
  add(open && open.view && open.view.input === "extrema" && open.view.extrema.length === 1 && open.view.extrema[0].yKnown === false
    ? { ok: true, id: "open-1" }
    : fail("open-1", JSON.stringify(open && open.view && open.view.input)));
  var dumped = JSON.stringify(open && open.problem);
  add(open && open.problem && !open.problem.extrema && !open.problem.regions && dumped.indexOf('"type"') < 0 && dumped.indexOf("regions") < 0
    ? { ok: true, id: "dto-hides-answers" }
    : fail("dto-hides-answers", dumped));
  var open5 = studentDto.openProblem(engine, "calc-extrema-1", 4);
  add(open5 && open5.view.extrema.length === 2 && open5.view.extrema[0].yKnown && open5.view.extrema[1].yKnown
    ? { ok: true, id: "open-5" }
    : fail("open-5"));

  var step1 = post("calc-extrema-1-ex-a001", { intent: "one-step", progress: {} });
  add(step1 && step1.ok && step1.show && step1.show.indexOf("x=3") >= 0 && step1.show.indexOf("נקודת מינימום") < 0
    ? { ok: true, id: "step-locates" }
    : fail("step-locates", step1 && step1.show));

  var typedMin = post("calc-extrema-1-ex-a001", { extrema: [{ x: "3", type: "min" }] });
  add(typedMin && typedMin.ok && typedMin.view && typedMin.view.input === "domains" && !typedMin.solved
    ? { ok: true, id: "ex1-extrema" }
    : fail("ex1-extrema", typedMin && typedMin.errorId));

  var swapped = post("calc-extrema-1-ex-a001", {
    progress: typedMin.progress,
    domains: { inc: "x<3", dec: "x>3" },
  });
  add(swapped && swapped.errorId === "increasingDecreasingSwapped" ? { ok: true, id: "swap-sides" } : fail("swap-sides", swapped && swapped.errorId));

  var closed = post("calc-extrema-1-ex-a001", {
    progress: typedMin.progress,
    domains: { dec: "x≤3", inc: "x>3" },
  });
  add(closed && closed.errorId === "includedExtremumInOpenInterval" ? { ok: true, id: "open-bound" } : fail("open-bound", closed && closed.errorId));

  var ySide = post("calc-extrema-1-ex-a001", {
    progress: typedMin.progress,
    domains: { inc: "y>2", dec: "x<3" },
  });
  add(ySide && ySide.errorId === "usedYInsteadOfXForInterval" ? { ok: true, id: "y-interval" } : fail("y-interval", ySide && ySide.errorId));

  var positive = post("calc-extrema-1-ex-a001", {
    progress: typedMin.progress,
    domains: { inc: "חיובית", dec: "x<3" },
  });
  add(positive && positive.errorId === "positiveConfusedWithIncreasing" ? { ok: true, id: "pos-word" } : fail("pos-word", positive && positive.errorId));

  var solved1 = post("calc-extrema-1-ex-a001", {
    progress: typedMin.progress,
    domains: { dec: "x<3", inc: "x>3" },
  });
  add(solved1 && solved1.solved && solved1.show && solved1.show.indexOf("עולה:") >= 0 && solved1.show.indexOf("יורדת:") >= 0
    ? { ok: true, id: "ex1-solved" }
    : fail("ex1-solved", solved1 && solved1.show));

  var height = post("calc-extrema-1-ex-a001", { extrema: [{ x: "3", type: "מקסימום" }] });
  add(height && height.errorId === "extremumChosenByHeightOnly" ? { ok: true, id: "height" } : fail("height", height && height.errorId));
  var heightHint = post("calc-extrema-1-ex-a001", { intent: "hint", progress: height.progress });
  add(heightHint && heightHint.hints && heightHint.hints[0].indexOf("המיקום שמצאתם נכון") >= 0
    ? { ok: true, id: "height-hint" }
    : fail("height-hint", heightHint && heightHint.hints && heightHint.hints[0]));

  var extra = post("calc-extrema-1-ex-a001", { extrema: [{ x: "3", type: "min" }, { x: "7", type: "max" }] });
  add(extra && extra.errorId === "extraExtremum" ? { ok: true, id: "extra-point" } : fail("extra-point", extra && extra.errorId));
  var badX = post("calc-extrema-1-ex-a002", { extrema: [{ x: "5", type: "max" }] });
  add(badX && badX.errorId === "wrongExtremumX" ? { ok: true, id: "bad-x" } : fail("bad-x", badX && badX.errorId));
  var ex2 = post("calc-extrema-1-ex-a002", { extrema: [{ x: "2", type: "MAX" }] });
  var ex2done = post("calc-extrema-1-ex-a002", { progress: ex2.progress, domains: { inc: "x<2", dec: "x>2" } });
  add(ex2done && ex2done.solved ? { ok: true, id: "ex2" } : fail("ex2", ex2 && ex2.errorId));

  var oneOfTwo = post("calc-extrema-1-ex-a003", { extrema: [{ x: "1", type: "מקסימום" }, { x: "", type: "" }] });
  add(oneOfTwo && oneOfTwo.ok === false && oneOfTwo.errorId === "missingExtremum" && oneOfTwo.view.extrema[0].locked && !oneOfTwo.view.extrema[1].locked
    ? { ok: true, id: "lock-one" }
    : fail("lock-one", oneOfTwo && oneOfTwo.errorId));
  var both = post("calc-extrema-1-ex-a003", {
    progress: oneOfTwo.progress,
    extrema: [{ x: "1", type: "max" }, { x: "4", type: "מינימום" }],
  });
  add(both && both.view && both.view.input === "domains" ? { ok: true, id: "ex3-extrema" } : fail("ex3-extrema", both && both.errorId));
  var partialInc = post("calc-extrema-1-ex-a003", {
    progress: both.progress,
    domains: { inc: "x>4", dec: "" },
  });
  add(partialInc && partialInc.ok && partialInc.view.domains[0].rows.length === 2
    ? { ok: true, id: "extra-row" }
    : fail("extra-row", partialInc && partialInc.message));
  var otherOrder = post("calc-extrema-1-ex-a003", {
    progress: both.progress,
    domains: { inc: "x>4 או x<1", dec: "1<x<4" },
  });
  add(otherOrder && otherOrder.solved ? { ok: true, id: "order-free" } : fail("order-free", otherOrder && otherOrder.errorId));
  var stepProgress = {};
  var stepShows = [];
  var stepLast = null;
  var stepGuard = 0;
  while (stepGuard < 12) {
    stepLast = post("calc-extrema-1-ex-a003", { intent: "one-step", progress: stepProgress });
    stepShows.push(stepLast && stepLast.show);
    if (!stepLast || !stepLast.ok || stepLast.solved) break;
    stepProgress = stepLast.progress;
    stepGuard += 1;
  }
  var monoTables = stepShows.filter(function (line) { return line && line.indexOf("עולה:") >= 0; });
  add(stepLast && stepLast.solved && monoTables.length >= 2 && monoTables.every(function (line) { return line.indexOf("יורדת:") >= 0; })
    && monoTables[0].indexOf("x < 1") >= 0 && monoTables[0].indexOf("x > 4") < 0
    && stepLast.show.indexOf("x < 1") >= 0 && stepLast.show.indexOf("x > 4") >= 0 && stepLast.show.indexOf("1 < x < 4") >= 0
    ? { ok: true, id: "ex3-step-advances" }
    : fail("ex3-step-advances", stepShows.join(" | ")));

  var cross = post("calc-extrema-1-ex-a003", {
    progress: both.progress,
    domains: { inc: "x<4", dec: "x>4" },
  });
  add(cross && cross.errorId === "intervalCrossesExtremum" ? { ok: true, id: "cross" } : fail("cross", cross && cross.errorId));

  var badPoint = post("calc-extrema-1-ex-a004", { extrema: [{ x: "1", y: "5", type: "min" }] });
  add(badPoint && badPoint.errorId === "wrongExtremumPoint" ? { ok: true, id: "bad-point" } : fail("bad-point", badPoint && badPoint.errorId));
  var ex4 = post("calc-extrema-1-ex-a004", { extrema: [{ x: "1", y: "2", type: "minimum" }] });
  var ex4done = post("calc-extrema-1-ex-a004", { progress: ex4.progress, domains: { dec: "x<1", inc: "x>1" } });
  add(ex4done && ex4done.solved ? { ok: true, id: "ex4" } : fail("ex4", ex4 && ex4.errorId));

  var swappedTypes = post("calc-extrema-1-ex-a005", {
    extrema: [{ x: "-3", y: "4", type: "min" }, { x: "2", y: "2", type: "max" }],
  });
  add(swappedTypes && swappedTypes.errorId === "minMaxSwapped" ? { ok: true, id: "swap-types" } : fail("swap-types", swappedTypes && swappedTypes.errorId));
  var ex5 = post("calc-extrema-1-ex-a005", {
    extrema: [{ x: "−3", y: "4", type: "מקס" }, { x: "2", y: "2", type: "מינ" }],
  });
  add(ex5 && ex5.view && ex5.view.input === "domains" ? { ok: true, id: "ex5-points" } : fail("ex5-points", ex5 && ex5.errorId));
  var ex5done = post("calc-extrema-1-ex-a005", {
    progress: ex5.progress,
    domains: { inc: "x<−3 או x>2", dec: "−3<x<2" },
  });
  add(ex5done && ex5done.solved ? { ok: true, id: "ex5" } : fail("ex5", ex5done && ex5done.errorId));

  var ex6 = post("calc-extrema-1-ex-a006", {
    extrema: [{ x: "0", y: "2", type: "מינימום" }, { x: "3", y: "4", type: "מקסימום" }],
  });
  var ex6done = post("calc-extrema-1-ex-a006", {
    progress: ex6.progress,
    domains: { dec: "x>3 או x<0", inc: "0<x<3" },
  });
  add(ex6done && ex6done.solved ? { ok: true, id: "ex6" } : fail("ex6", ex6 && ex6.errorId));

  var solution = post("calc-extrema-1-ex-a003", { intent: "solution" });
  var joined = solution && solution.steps ? solution.steps.join(" ") : "";
  add(joined.indexOf("יורדת") >= 0 && joined.indexOf("עולה") >= 0 && joined.indexOf("מינימום") >= 0 && joined.indexOf("מקסימום") >= 0
    ? { ok: true, id: "solution" }
    : fail("solution", joined));

  var hint = post("calc-extrema-1-ex-a001", { intent: "hint", progress: {} });
  add(hint && hint.hints && hint.hints[0].indexOf("x=") < 0 && hint.hints.length >= 2
    ? { ok: true, id: "hint-gradual" }
    : fail("hint-gradual", hint && hint.hints && hint.hints[0]));

  var domainHint = post("calc-extrema-1-ex-a003", { intent: "hint", progress: both.progress });
  add(domainHint && domainHint.hints && domainHint.hints[0].indexOf("משמאל לימין") >= 0 && domainHint.hints.join(" ").indexOf("x<1") < 0
    ? { ok: true, id: "hint-domains" }
    : fail("hint-domains", domainHint && domainHint.hints && domainHint.hints.join(" | ")));

  var open7 = studentDto.openProblem(engine, "calc-extrema-1", 6);
  add(open7 && open7.view && open7.view.input === "domains" && !open7.view.extrema
    ? { ok: true, id: "open-7-domains" }
    : fail("open-7-domains", open7 && open7.view && open7.view.input));

  var inners = post("calc-extrema-1-ex-a007", {
    domains: { inc: "0<x<2", dec: "−3<x<0" },
  });
  add(inners && inners.errorId === "missedOuterInterval" && inners.progress && inners.progress.correctIncreasingIntervals.length === 1
    ? { ok: true, id: "missed-outer" }
    : fail("missed-outer", inners && inners.errorId));
  var ex7 = post("calc-extrema-1-ex-a007", {
    domains: { inc: "x<−3 או 0<x<2", dec: "x>2 או −3<x<0" },
  });
  add(ex7 && ex7.solved ? { ok: true, id: "ex7" } : fail("ex7", ex7 && ex7.errorId));

  var oneInc = post("calc-extrema-1-ex-a008", { domains: { inc: "x<−4", dec: "" } });
  add(oneInc && oneInc.ok && oneInc.view.domains[0].rows.length === 2
    ? { ok: true, id: "five-regions-row" }
    : fail("five-regions-row", oneInc && oneInc.message));
  var ex8 = post("calc-extrema-1-ex-a008", {
    progress: oneInc.progress,
    domains: { inc: "x>5 או −1<x<2 או x<−4", dec: "2<x<5 או −4<x<−1" },
  });
  add(ex8 && ex8.solved && ex8.progress && ex8.progress.isComplete && ex8.progress.completedRegions === 5
    ? { ok: true, id: "ex8" }
    : fail("ex8", ex8 && (ex8.errorId || ex8.progress && ex8.progress.completedRegions)));

  var flat = post("calc-extrema-1-ex-a009", { domains: { inc: "x<0 או x>0", dec: "אין" } });
  add(flat && flat.errorId === "falseExtremumFromFlatAppearance" ? { ok: true, id: "flat" } : fail("flat", flat && flat.errorId));
  var allWords = ["כל x", "לכל x", "x∈R", "x∈ℝ", "(−∞,∞)"];
  allWords.forEach(function (word) {
    var got = post("calc-extrema-1-ex-a009", { domains: { inc: word, dec: "אין" } });
    add(got && got.solved ? { ok: true, id: "all-" + word } : fail("all-" + word, got && got.errorId));
  });
  var noneWords = ["אין", "אין תחום", "אף x"];
  noneWords.forEach(function (word) {
    var got = post("calc-extrema-1-ex-a009", { domains: { inc: "כל x", dec: word } });
    add(got && got.solved ? { ok: true, id: "none-" + word } : fail("none-" + word, got && got.errorId));
  });
  var stepFlat = post("calc-extrema-1-ex-a009", { intent: "one-step", progress: {} });
  add(stepFlat && stepFlat.ok && stepFlat.show && stepFlat.show.indexOf("כל x") < 0
    ? { ok: true, id: "flat-step" }
    : fail("flat-step", stepFlat && stepFlat.show));

  var sameY = post("calc-extrema-1-ex-a010", { domains: { inc: "−3<x<3", dec: "x>3" } });
  add(sameY && sameY.errorId === "sameYMeansSameInterval" ? { ok: true, id: "same-y" } : fail("same-y", sameY && sameY.errorId));
  var ex10 = post("calc-extrema-1-ex-a010", {
    domains: { inc: "0<x<3 או x<−3", dec: "−3<x<0 או x>3" },
  });
  add(ex10 && ex10.solved ? { ok: true, id: "ex10" } : fail("ex10", ex10 && ex10.errorId));
  var solution7 = post("calc-extrema-1-ex-a007", { intent: "solution" });
  var text7 = solution7 && solution7.steps ? solution7.steps.join(" ") : "";
  add(text7.indexOf("−3") >= 0 && text7.indexOf("עולה") >= 0 && text7.indexOf("יורד") >= 0
    ? { ok: true, id: "solution-7" }
    : fail("solution-7", text7));
  var hint7 = post("calc-extrema-1-ex-a007", { intent: "hint", progress: {} });
  add(hint7 && hint7.hints[0].indexOf("משמאל לימין") >= 0 && hint7.hints.join(" ").indexOf("x<−3") < 0
    ? { ok: true, id: "hint-7" }
    : fail("hint-7", hint7 && hint7.hints && hint7.hints.join(" | ")));

  var open11 = studentDto.openProblem(engine, "calc-extrema-1", 10);
  add(open11 && open11.view && open11.view.input === "domains" && open11.view.part && open11.view.part.label === "א"
    && open11.view.domains[0].label === "עלייה"
    ? { ok: true, id: "open-11" }
    : fail("open-11", open11 && open11.view && open11.view.part && open11.view.part.label));

  var mono11 = post("calc-extrema-1-ex-a011", {
    domains: { inc: "x<2 או x>5", dec: "2<x<5" },
  });
  add(mono11 && mono11.ok && !mono11.solved && mono11.view && mono11.view.part.label === "ב" && mono11.view.domains[0].label === "חיובית"
    ? { ok: true, id: "ex11-mono" }
    : fail("ex11-mono", mono11 && mono11.errorId));
  var zeroBound = post("calc-extrema-1-ex-a011", { domains: { inc: "x<0", dec: "x>0" } });
  add(zeroBound && zeroBound.errorId === "zeroUsedAsMonotonicityBoundary" ? { ok: true, id: "zero-as-mono" } : fail("zero-as-mono", zeroBound && zeroBound.errorId));
  var extremumSign = post("calc-extrema-1-ex-a011", {
    progress: mono11.progress,
    domains: { pos: "2<x<5", neg: "x<2" },
  });
  add(extremumSign && extremumSign.errorId === "extremumUsedAsSignBoundary" ? { ok: true, id: "extremum-as-sign" } : fail("extremum-as-sign", extremumSign && extremumSign.errorId));
  var touchMerge = post("calc-extrema-1-ex-a011", {
    progress: mono11.progress,
    domains: { pos: "x>0", neg: "x<0" },
  });
  add(touchMerge && (touchMerge.errorId === "includedZeroInPositiveInterval" || touchMerge.errorId === "touchingZeroAssumedCrossing")
    ? { ok: true, id: "touch-merge" }
    : fail("touch-merge", touchMerge && touchMerge.errorId));
  var sign11 = post("calc-extrema-1-ex-a011", {
    progress: mono11.progress,
    domains: { pos: "0<x<5 או x>5", neg: "x<0" },
  });
  add(sign11 && sign11.solved && sign11.progress && sign11.progress.signComplete && sign11.progress.monotonicityComplete
    ? { ok: true, id: "ex11" }
    : fail("ex11", sign11 && sign11.errorId));
  var signStep = mono11.progress;
  var signShows = [];
  var signLast = null;
  var signGuard = 0;
  while (signGuard < 8) {
    signLast = post("calc-extrema-1-ex-a011", { intent: "one-step", progress: signStep });
    signShows.push(signLast && signLast.show);
    if (!signLast || !signLast.ok || signLast.solved) break;
    signStep = signLast.progress;
    signGuard += 1;
  }
  var signTables = signShows.filter(function (line) { return line && line.indexOf("חיובי:") >= 0; });
  add(signLast && signLast.solved && signTables.length >= 2 && signTables.every(function (line) { return line.indexOf("שלילי:") >= 0; })
    && signLast.show.split("0 < x < 5").length === 2 && signLast.show.split("x > 5").length === 2 && signLast.show.indexOf("x < 0") >= 0
    ? { ok: true, id: "ex11-sign-once" }
    : fail("ex11-sign-once", signShows.join(" | ")));

  var mono12 = post("calc-extrema-1-ex-a012", {
    domains: { inc: "1<x<5 או x<−3", dec: "x>5 או −3<x<1" },
  });
  var sign12 = post("calc-extrema-1-ex-a012", {
    progress: mono12.progress,
    domains: { pos: "3<x<7 או −5<x<−1", neg: "x>7 או −1<x<3 או x<−5" },
  });
  add(sign12 && sign12.solved ? { ok: true, id: "ex12" } : fail("ex12", mono12 && mono12.errorId, sign12 && sign12.errorId));

  var approach = post("calc-extrema-1-ex-a013", {
    progress: post("calc-extrema-1-ex-a013", { domains: { dec: "x<0", inc: "x>0" } }).progress,
    domains: { pos: "אין", neg: "x<0 או x>0" },
  });
  add(approach && approach.errorId === "approachingAxisAssumedZero" ? { ok: true, id: "approach" } : fail("approach", approach && approach.errorId));
  var ex13 = post("calc-extrema-1-ex-a013", {
    progress: post("calc-extrema-1-ex-a013", { domains: { dec: "x<0", inc: "x>0" } }).progress,
    domains: { pos: "אין", neg: "כל x" },
  });
  add(ex13 && ex13.solved ? { ok: true, id: "ex13" } : fail("ex13", ex13 && ex13.errorId));

  var bothInInc = post("calc-extrema-1-ex-a014", { domains: { inc: "x<-2, x>-2" } });
  add(bothInInc && bothInInc.ok && !bothInInc.errorId && bothInInc.view && bothInInc.view.part && bothInInc.view.part.label === "ב"
    && bothInInc.progress && bothInInc.progress.sides && bothInInc.progress.sides.inc && bothInInc.progress.sides.dec
    && !(bothInInc.progress.openText && bothInInc.progress.openText.inc)
    ? { ok: true, id: "ex14-both-in-one-box" }
    : fail("ex14-both-in-one-box", bothInInc && (bothInInc.errorId || bothInInc.message), bothInInc && bothInInc.view && bothInInc.view.part && bothInInc.view.part.label));
  var mono14 = post("calc-extrema-1-ex-a014", { domains: { dec: "x<−2", inc: "x>−2" } });
  var downMeansNeg = post("calc-extrema-1-ex-a014", {
    progress: mono14.progress,
    domains: { pos: "x>−2", neg: "x<−2" },
  });
  add(downMeansNeg && downMeansNeg.errorId === "negativeConfusedWithDecreasing" ? { ok: true, id: "down-not-neg" } : fail("down-not-neg", downMeansNeg && downMeansNeg.errorId));
  var ex14 = post("calc-extrema-1-ex-a014", {
    progress: mono14.progress,
    domains: { pos: "x<−2 או x>−2", neg: "אין" },
  });
  add(ex14 && ex14.solved ? { ok: true, id: "ex14" } : fail("ex14", ex14 && ex14.errorId));

  var hintSign = post("calc-extrema-1-ex-a011", { intent: "hint", progress: mono11.progress });
  add(hintSign && hintSign.hints && hintSign.hints[0].indexOf("ציר") >= 0 && hintSign.hints.join(" ").indexOf("0<x<5") < 0
    ? { ok: true, id: "hint-sign" }
    : fail("hint-sign", hintSign && hintSign.hints && hintSign.hints.join(" | ")));
  var solution11 = post("calc-extrema-1-ex-a011", { intent: "solution" });
  function blob(step) {
    if (step && step.parallel) {
      return step.parallel.map(function (col) {
        return col.label + " " + (col.steps || []).map(blob).join(" ");
      }).join(" ");
    }
    if (step && step.eq != null) return String(step.eq);
    return String(step || "");
  }
  var text11 = solution11 && solution11.steps ? solution11.steps.map(blob).join(" ") : "";
  add(text11.indexOf("עלייה") >= 0 && text11.indexOf("חיוביות") >= 0 && text11.indexOf("מגע") >= 0
    ? { ok: true, id: "solution-11" }
    : fail("solution-11", text11));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, failures: failed }, null, 2));
  if (failed.length) process.exit(1);
}

main();
