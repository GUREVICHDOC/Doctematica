"use strict";

var loadEngine = require("./load-engine").loadEngine;
var signGraph = require("./sign-graph");
var studentDto = require("./student-dto");
var functionsApi = require("./functions");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function main() {
  var engine = loadEngine();
  var handle = functionsApi.createFunctionsHandler(engine).handle;
  var levels = engine.DoctematicaCurriculum.levels || [];
  var level = levels.filter(function (item) { return item.id === "calc-sign-1"; })[0];
  var checks = [];

  function add(result) {
    checks.push(result);
  }

  add(level && level.subtopic === "pre" && level.title === "חיוביות ושליליות של פונקציה"
    ? { ok: true, id: "level" }
    : fail("level", level && level.title));
  add(level && level.exercises.length === 16 ? { ok: true, id: "sixteen" } : fail("sixteen", String(level && level.exercises.length)));

  var answers = {
    "calc-sign-1-ex-a001": { pos: "x<2", neg: "x>2" },
    "calc-sign-1-ex-a002": { pos: "x<3 או x>6", neg: "3<x<6" },
    "calc-sign-1-ex-a003": { pos: "x<−3 או x>−3", neg: "אין" },
    "calc-sign-1-ex-a004": { pos: "אין", neg: "כל x" },
    "calc-sign-1-ex-a005": { pos: "x>−2", neg: "x<−2" },
    "calc-sign-1-ex-a006": { pos: "0<x<4 או x>8", neg: "x<0 או 4<x<8" },
    "calc-sign-1-ex-a007": { pos: "x<−2 או 0<x<2", neg: "−2<x<0 או x>2" },
    "calc-sign-1-ex-a008": { pos: "−3<x<−1 או 3<x<5", neg: "x<−3 או −1<x<3 או x>5" },
    "calc-sign-1-ex-a009": { pos: "0<x<4 או x>4", neg: "x<0" },
    "calc-sign-1-ex-a010": { pos: "x<−3 או −3<x<3 או x>3", neg: "אין" },
  };
  var equivalents = {
    "calc-sign-1-ex-a001": { pos: "2>x", neg: "2<x" },
    "calc-sign-1-ex-a002": { pos: "x<3, x>6", neg: "3<x<6" },
    "calc-sign-1-ex-a003": { pos: "−3>x או x>−3", neg: "אין פתרון" },
    "calc-sign-1-ex-a004": { pos: "אף x", neg: "לכל x" },
    "calc-sign-1-ex-a006": { pos: "x>8 או 0<x<4", neg: "4<x<8 או x<0" },
    "calc-sign-1-ex-a009": { pos: "4>x>0 או x>4", neg: "0>x" },
    "calc-sign-1-ex-a010": { pos: "x>3 או −3<x<3 או x<−3", neg: "∅" },
  };
  var mistakes = [
    { id: "calc-sign-1-ex-a001", domains: { pos: "x>2", neg: "x<2" }, errorId: "positiveNegativeReversed" },
    { id: "calc-sign-1-ex-a001", domains: { pos: "x≤2", neg: "x>2" }, errorId: "zeroIncludedInPositive" },
    { id: "calc-sign-1-ex-a001", domains: { pos: "x<2", neg: "x≥2" }, errorId: "zeroIncludedInNegative" },
    { id: "calc-sign-1-ex-a001", domains: { pos: "x>2", neg: "אין" }, errorId: "boundaryDirectionError" },
    { id: "calc-sign-1-ex-a001", domains: { pos: "אין", neg: "x>2" }, errorId: "emptySetIncorrect" },
    { id: "calc-sign-1-ex-a002", domains: { pos: "3<x<6", neg: "אין" }, errorId: "wrongDoubleInterval" },
    { id: "calc-sign-1-ex-a003", domains: { pos: "כל x", neg: "אין" }, errorId: "allRealsButHasZeros" },
    { id: "calc-sign-1-ex-a003", domains: { pos: "x<−3", neg: "x>−3" }, errorId: "touchingTreatedAsCrossing" },
    { id: "calc-sign-1-ex-a003", domains: { pos: "x≤−3 או x≥−3", neg: "אין" }, errorId: "zeroIncludedInPositive" },
    { id: "calc-sign-1-ex-a005", domains: { pos: "x>0", neg: "x<−2" }, errorId: "splitAtExtremum" },
    { id: "calc-sign-1-ex-a004", domains: { pos: "כל x", neg: "אין" }, errorId: "positiveNegativeReversed" },
    { id: "calc-sign-1-ex-a008", domains: { pos: "−1<x<3", neg: "אין" }, errorId: "wrongDoubleInterval" },
    { id: "calc-sign-1-ex-a009", domains: { pos: "0<x<4", neg: "x<0 או x>4" }, errorId: "touchingTreatedAsCrossing" },
    { id: "calc-sign-1-ex-a009", domains: { pos: "x<0 או 0<x<4 או x>4", neg: "אין" }, errorId: "crossingTreatedAsTouching" },
    { id: "calc-sign-1-ex-a009", domains: { pos: "0≤x<4 או x>4", neg: "x<0" }, errorId: "zeroIncludedInPositive" },
    { id: "calc-sign-1-ex-a009", domains: { pos: "0<x<4 או x>4", neg: "x≤0" }, errorId: "zeroIncludedInNegative" },
    { id: "calc-sign-1-ex-a009", domains: { pos: "x<0", neg: "x>4" }, errorId: "wrongSignAfterTouch" },
    { id: "calc-sign-1-ex-a010", domains: { pos: "כל x", neg: "אין" }, errorId: "allRealsButHasZeros" },
    { id: "calc-sign-1-ex-a010", domains: { pos: "x<−3 או −3<x<3 או x>3", neg: "x>5" }, errorId: "emptyNegativeSetNotRecognized" },
    { id: "calc-sign-1-ex-a010", domains: { pos: "x<−3 או x>3", neg: "−3<x<3" }, errorId: "touchingTreatedAsCrossing" },
  ];

  (level.exercises || []).forEach(function (ex, index) {
    if (ex.freeSketch) {
      add(ex.parts && ex.parts.length >= 3 ? { ok: true, id: "sketch-parts:" + ex.id } : fail("sketch-parts:" + ex.id, String(ex.parts && ex.parts.length)));
      return;
    }
    var zeros = (ex.zeros || []).map(function (zero) { return zero.x; });
    add(zeros.length === [1, 2, 1, 0, 1, 3, 3, 4, 2, 2][index] ? { ok: true, id: "zeros:" + ex.id } : fail("zeros:" + ex.id, String(zeros.length)));
    var regions = ex.regions || [];
    var i;
    for (i = 0; i < regions.length; i++) {
      var prev = i ? regions[i - 1] : null;
      if (prev && prev.to !== regions[i].from) add(fail("gap:" + ex.id, String(i)));
    }
    if (regions[0] && regions[0].from !== "-inf") add(fail("start:" + ex.id, ""));
    if (regions.length && regions[regions.length - 1].to !== "inf") add(fail("end:" + ex.id, ""));
    (ex.zeros || []).forEach(function (zero) {
      var left = regions.filter(function (region) { return region.to === zero.x; })[0];
      var right = regions.filter(function (region) { return region.from === zero.x; })[0];
      if (!left || !right) {
        add(fail("zero-split:" + ex.id, String(zero.x)));
        return;
      }
      var same = left.property === right.property;
      if (zero.kind === "touch" && !same) add(fail("touch-same:" + ex.id, String(zero.x)));
      if (zero.kind !== "touch" && same) add(fail("cross-flip:" + ex.id, String(zero.x)));
    });
    add((ex.figure && ex.figure.marks ? ex.figure.marks.length : 0) === (ex.zeros || []).length
      ? { ok: true, id: "marks:" + ex.id }
      : fail("marks:" + ex.id, ""));

    var opened = studentDto.openProblem(engine, "calc-sign-1", index);
    var problem = opened && opened.problem;
    var view = opened && opened.view;
    add(problem && problem.displayNumber === index + 1 && !problem.regions && !problem.zeros
      ? { ok: true, id: "slim:" + ex.id }
      : fail("slim:" + ex.id, JSON.stringify(problem && { n: problem.displayNumber, regions: problem.regions, zeros: problem.zeros })));
    add(view && view.input === "domains" && view.figure && view.figure.curve && view.domains && view.domains[0].id === "pos" && view.domains[1].id === "neg" && !view.regions
      ? { ok: true, id: "view:" + ex.id }
      : fail("view:" + ex.id, ""));

    function ask(domains, intent, progress) {
      return handle({
        intent: intent || "check",
        levelId: "calc-sign-1",
        exerciseId: ex.id,
        domains: domains,
        progress: progress,
      });
    }

    var correct = ask(answers[ex.id]);
    add(correct && correct.ok && correct.solved && !correct.error
      && correct.show && correct.show.indexOf("חיובי:") === 0 && correct.show.indexOf(", שלילי:") > 0 && correct.show.indexOf("חיובית") < 0
      ? { ok: true, id: "answer:" + ex.id }
      : fail("answer:" + ex.id, correct && (correct.errorId || correct.show || correct.message)));
    if (equivalents[ex.id]) {
      var alt = ask(equivalents[ex.id]);
      add(alt && alt.ok && alt.solved ? { ok: true, id: "alt:" + ex.id } : fail("alt:" + ex.id, alt && alt.message));
    }
    var oneSide = ask({ pos: answers[ex.id].pos, neg: "" });
    add(oneSide && oneSide.ok && !oneSide.solved && oneSide.view && oneSide.view.domains[0].locked && !oneSide.view.domains[1].locked
      ? { ok: true, id: "one-side:" + ex.id }
      : fail("one-side:" + ex.id, oneSide && (oneSide.errorId || oneSide.message)));
    var otherSide = ask({ pos: "", neg: answers[ex.id].neg }, "check", oneSide.progress);
    add(otherSide && otherSide.ok && otherSide.solved
      ? { ok: true, id: "second-side:" + ex.id }
      : fail("second-side:" + ex.id, otherSide && (otherSide.errorId || otherSide.message)));

    var hints = ask(null, "hint");
    add(hints && hints.hints && hints.hints[0].indexOf("הסתכלו על מיקום הגרף") === 0 && !/[<>]/.test(hints.hints[0])
      ? { ok: true, id: "hint:" + ex.id }
      : fail("hint:" + ex.id, hints && hints.hints && hints.hints[0]));

    var solution = ask(null, "solution");
    add(solution && solution.steps && solution.steps.length === 6 && solution.steps.join(" ").indexOf("y=") < 0
      ? { ok: true, id: "solution:" + ex.id }
      : fail("solution:" + ex.id, solution && solution.steps && String(solution.steps.length)));
    if (ex.id === "calc-sign-1-ex-a001") {
      var tableHtml = engine.DoctematicaMath.proseHTML(solution.steps[3]);
      var infAt = tableHtml.indexOf("∞, 2");
      var fxAt = tableHtml.indexOf("f(");
      add(infAt >= 0 && fxAt > infAt && tableHtml.indexOf('dir="ltr"') >= 0
        ? { ok: true, id: "table-ltr" }
        : fail("table-ltr", tableHtml));
    }

    var step = ask(null, "one-step", {});
    add(step && step.ok && !step.solved && step.show && step.show.indexOf("חיובית") < 0 && !/[<>]/.test(step.show)
      ? { ok: true, id: "first-step:" + ex.id }
      : fail("first-step:" + ex.id, step && step.show));
    var guard = 0;
    var asked = 0;
    var sawTouchNote = false;
    while (step && !step.solved && guard < 40) {
      if (step.show && /בדקו|מה קורה/.test(step.show) && step.show.indexOf("חיובית") < 0) asked += 1;
      if (step.show && step.show.indexOf("נוגע") >= 0) sawTouchNote = true;
      if (step.show && step.show.indexOf("חיובית") >= 0 && asked < (ex.regions || []).length) add(fail("early-answer:" + ex.id, step.show));
      step = ask(null, "one-step", step.progress);
      guard += 1;
    }
    add(step && step.solved && asked === (ex.regions || []).length ? { ok: true, id: "walk:" + ex.id } : fail("walk:" + ex.id, step && step.show));
    if ((ex.zeros || []).some(function (zero) { return zero.kind === "touch"; })) {
      add(sawTouchNote ? { ok: true, id: "touch-step:" + ex.id } : fail("touch-step:" + ex.id, ""));
      add(hints.hints.join(" ").indexOf("אינה מחייבת שינוי סימן") >= 0
        ? { ok: true, id: "touch-hint:" + ex.id }
        : fail("touch-hint:" + ex.id, hints.hints.join(" | ")));
    }
  });

  mistakes.forEach(function (item) {
    var result = handle({
      intent: "check",
      levelId: "calc-sign-1",
      exerciseId: item.id,
      domains: item.domains,
    });
    add(result && result.ok === false && result.errorId === item.errorId && result.message && !result.error
      ? { ok: true, id: item.errorId + ":" + item.id }
      : fail(item.errorId + ":" + item.id, result && (result.errorId + " " + result.message)));
  });

  var almostAll = handle({
    intent: "check",
    levelId: "calc-sign-1",
    exerciseId: "calc-sign-1-ex-a010",
    domains: { pos: "כל x", neg: "אין" },
  });
  add(almostAll && almostAll.errorId === "allRealsButHasZeros" && /x=−3/.test(almostAll.message) && /x=3/.test(almostAll.message) && /f\(x\)=0/.test(almostAll.message) && /f\(x\)>0/.test(almostAll.message)
    ? { ok: true, id: "all-reals-names-zeros" }
    : fail("all-reals-names-zeros", almostAll && almostAll.message));

  var junk = handle({
    intent: "check",
    levelId: "calc-sign-1",
    exerciseId: "calc-sign-1-ex-a001",
    domains: { pos: "שלום", neg: "אין" },
  });
  add(junk && junk.errorId === "unparsedInterval" ? { ok: true, id: "unparsed" } : fail("unparsed", junk && junk.errorId));

  var emptyForms = ["אין", "אין פתרון", "אף x", "∅"];
  emptyForms.forEach(function (text) {
    var result = handle({
      intent: "check",
      levelId: "calc-sign-1",
      exerciseId: "calc-sign-1-ex-a003",
      domains: { pos: "x<−3 או x>−3", neg: text },
    });
    add(result && result.solved ? { ok: true, id: "empty:" + text } : fail("empty:" + text, result && result.message));
  });

  function column(view, id) {
    return view && view.domains && view.domains.filter(function (field) { return field.id === id; })[0];
  }
  var another = handle({
    intent: "check",
    levelId: "calc-sign-1",
    exerciseId: "calc-sign-1-ex-a002",
    domains: { pos: "x<3", neg: "3<x<6" },
  });
  var posCol = column(another && another.view, "pos");
  var negCol = column(another && another.view, "neg");
  add(another && another.ok && !another.solved && posCol && posCol.rows && posCol.rows.length === 2 && posCol.rows[0].locked && !posCol.rows[1].locked && negCol && negCol.locked
    ? { ok: true, id: "extra-row" }
    : fail("extra-row", another && (another.errorId + " " + another.message + " " + JSON.stringify(posCol && posCol.rows))));
  var finished = handle({
    intent: "check",
    levelId: "calc-sign-1",
    exerciseId: "calc-sign-1-ex-a002",
    domains: { pos: "x<3 או x>6", neg: "3<x<6" },
    progress: another && another.progress,
  });
  add(finished && finished.ok && finished.solved ? { ok: true, id: "extra-row-done" } : fail("extra-row-done", finished && (finished.errorId || finished.message)));

  var bad = checks.filter(function (item) { return !item.ok; });
  console.log(JSON.stringify({ passed: checks.length - bad.length, failed: bad.length, failures: bad }, null, 2));
  if (bad.length) process.exit(1);
}

main();
