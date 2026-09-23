"use strict";

var loadEngine = require("./load-engine").loadEngine;
var studentDto = require("./student-dto");
var freq = require("./freq-table");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function ask(index, typed, progress, intent, extra) {
  extra = extra || {};
  return freq.handle(loadEngine(), Object.assign({
    intent: intent || "check",
    levelId: "stat-bar-1",
    exerciseIndex: index,
    typed: typed || "",
    history: [],
    progress: progress || {},
  }, extra));
}

function shows(result) {
  return (result.shows || []).slice();
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) { checks.push(result); }

  var level = (engine.DoctematicaCurriculum.levels || []).filter(function (item) { return item.id === "stat-bar-1"; })[0];
  add(level && level.subtopic === "bar-chart" && level.exercises.length === 4 && level.exercises[3].id === "stat-bar-1-ex-a004"
    ? { ok: true, id: "bar-count" }
    : fail("bar-count", JSON.stringify(level && level.exercises && level.exercises.map(function (ex) { return ex.id; }))));

  var opened = studentDto.openProblem(engine, "stat-bar-1", 0);
  add(opened && opened.problem && opened.problem.chart && opened.problem.chart.bars.length === 7 && !opened.problem.table && opened.view && opened.view.chart && !opened.view.table
    ? { ok: true, id: "bar-open-chart" }
    : fail("bar-open-chart", JSON.stringify(opened && opened.problem && { table: opened.problem.table, bars: opened.problem.chart && opened.problem.chart.bars.length, viewTable: opened.view && opened.view.table })));

  var five = ask(0, "4");
  var seven = ask(0, "6", five.progress);
  add(five.ok && seven.ok && seven.view && seven.view.part && seven.view.part.label === "ב"
    ? { ok: true, id: "bar-two-freqs" }
    : fail("bar-two-freqs", five.message + " | " + seven.message + " " + JSON.stringify(seven.view && seven.view.part)));
  var swapped = ask(0, "6");
  add(swapped.ok && swapped.progress.done.seven && !swapped.progress.done.five
    ? { ok: true, id: "bar-freq-either-order" }
    : fail("bar-freq-either-order", JSON.stringify(swapped.progress && swapped.progress.done) + " " + swapped.message));
  var axisValue = ask(0, "5");
  add(!axisValue.ok && axisValue.message.indexOf("ציר האופקי") >= 0
    ? { ok: true, id: "bar-read-axis" }
    : fail("bar-read-axis", axisValue.message));
  var offOne = ask(0, "3");
  add(!offOne.ok && offOne.message.indexOf("יחידה") >= 0
    ? { ok: true, id: "bar-off-by-one" }
    : fail("bar-off-by-one", offOne.message));
  var readHint = ask(0, "", {}, "hint");
  add(readHint.message.indexOf("גובה") >= 0 && readHint.message.indexOf("4") < 0 && readHint.message.indexOf("6") < 0
    ? { ok: true, id: "bar-read-hint" }
    : fail("bar-read-hint", readHint.message));
  var readStep = ask(0, "", {}, "step");
  add(readStep.shows[0] === "4"
    ? { ok: true, id: "bar-read-step" }
    : fail("bar-read-step", JSON.stringify(readStep.shows)));

  var order = [10, 4, 7, 5, 9, 6, 8];
  var freqs = { 4: "2", 5: "4", 6: "1", 7: "6", 8: "3", 9: "5", 10: "2" };
  var filling = seven.progress;
  var i;
  for (i = 0; i < order.length; i++) {
    filling = ask(0, "", filling, "check", { fill: { value: order[i], typed: freqs[order[i]] } }).progress;
  }
  var filledView = ask(0, "", filling, "hint");
  var locked = filledView.view && filledView.view.table && filledView.view.table.rows || [];
  add(filledView.view && filledView.view.part && filledView.view.part.label === "ג" && locked.length === 7 && locked.every(function (row) { return row.locked; }) && String(locked[0].value) !== "10"
    ? { ok: true, id: "bar-fill-any-order" }
    : fail("bar-fill-any-order", JSON.stringify(filledView.view && filledView.view.part) + " " + locked.map(function (row) { return row.value + ":" + row.freq + ":" + row.locked; }).join(",")));
  var classSize = ask(0, "23", filling);
  add(classSize.ok && classSize.view && classSize.view.solved && classSize.progress.solve.total === 23
    ? { ok: true, id: "bar-total" }
    : fail("bar-total", classSize.message + " " + JSON.stringify(classSize.progress && classSize.progress.solve)));
  var valueSum = ask(0, "49", filling);
  add(!valueSum.ok && valueSum.message.indexOf("ציר האופקי") >= 0
    ? { ok: true, id: "bar-sum-values" }
    : fail("bar-sum-values", valueSum.message));
  var missed = ask(0, "22", filling);
  add(!missed.ok && missed.message.indexOf("אחת העמודות") >= 0
    ? { ok: true, id: "bar-missed-column" }
    : fail("bar-missed-column", missed.message));
  var totalHint = ask(0, "", filling, "hint");
  add(totalHint.message.indexOf("גובה") >= 0 && totalHint.message.indexOf("23") < 0
    ? { ok: true, id: "bar-total-hint" }
    : fail("bar-total-hint", totalHint.message));

  var roomsFilled = { done: { table: true, families: true }, filled: { 1: 2, 2: 7, 3: 10, 4: 6, 5: 5, 6: 3, 7: 1 }, solve: { total: 34 } };
  var under = ask(1, "19", roomsFilled);
  add(under.ok && under.progress.done.under4
    ? { ok: true, id: "bar-lt" }
    : fail("bar-lt", under.message));
  var underBoundary = ask(1, "25", roomsFilled);
  add(!underBoundary.ok && underBoundary.message.indexOf("פחות מ") >= 0
    ? { ok: true, id: "bar-lt-boundary" }
    : fail("bar-lt-boundary", underBoundary.message));
  var atMost = ask(3, "25", { done: { table: true, families: true }, filled: { 1: 2, 2: 7, 3: 10, 4: 6, 5: 5, 6: 3, 7: 1 }, solve: { total: 34 } });
  add(atMost.ok
    ? { ok: true, id: "bar-lte" }
    : fail("bar-lte", atMost.message + " " + JSON.stringify(atMost.view && atMost.view.part)));
  var atMostBoundary = ask(3, "19", { done: { table: true, families: true }, filled: { 1: 2, 2: 7, 3: 10, 4: 6, 5: 5, 6: 3, 7: 1 }, solve: { total: 34 } });
  add(!atMostBoundary.ok && atMostBoundary.message.indexOf("לכל היותר") >= 0
    ? { ok: true, id: "bar-lte-boundary" }
    : fail("bar-lte-boundary", atMostBoundary.message));

  var mode = ask(3, "3", atMost.progress);
  var modeFreq = ask(3, "10", atMost.progress);
  add(mode.ok && mode.progress.done.rooms && !modeFreq.ok && modeFreq.message.indexOf("שכיחות") >= 0
    ? { ok: true, id: "bar-mode" }
    : fail("bar-mode", mode.message + " | " + modeFreq.message));
  var modeHint = ask(3, "", atMost.progress, "hint");
  add(modeHint.message.indexOf("עמודה") >= 0 && modeHint.message.indexOf("3") < 0
    ? { ok: true, id: "bar-mode-hint" }
    : fail("bar-mode-hint", modeHint.message));

  var raised = ask(3, "", mode.progress, "step");
  add(raised.shows[0] === "5 + 3 + 1" && raised.progress.solve.total === 34
    ? { ok: true, id: "bar-reuse-total" }
    : fail("bar-reuse-total", JSON.stringify(raised.shows) + " " + JSON.stringify(raised.progress && raised.progress.solve)));
  var guided = ask(3, "", mode.progress, "step", { history: ["סעיף:ג", "2 + 7 + 10 + 6 = 25", "סעיף:ה"] });
  add(guided.shows[0] === "5 + 3 + 1"
    ? { ok: true, id: "bar-ignore-earlier-complement" }
    : fail("bar-ignore-earlier-complement", JSON.stringify(guided.shows)));
  var chose = ask(3, "25", mode.progress);
  var choseNext = ask(3, "", mode.progress, "step", { history: ["סעיף:ה", "25"] });
  add(chose.ok && !chose.view.solved && choseNext.shows[0] === "25/34"
    ? { ok: true, id: "bar-complement-choice" }
    : fail("bar-complement-choice", chose.message + " " + JSON.stringify(choseNext.shows)));
  var raisedAnswer = ask(3, "9/34", mode.progress);
  add(raisedAnswer.ok && raisedAnswer.view && raisedAnswer.view.solved
    ? { ok: true, id: "bar-relative" }
    : fail("bar-relative", raisedAnswer.message + " " + JSON.stringify(raisedAnswer.view && raisedAnswer.view.part)));
  var groupDen = ask(3, "9/9", mode.progress);
  add(!groupDen.ok && groupDen.message.indexOf("מכנה") >= 0
    ? { ok: true, id: "bar-group-denominator" }
    : fail("bar-group-denominator", groupDen.message));
  var raisedFreq = ask(3, "9", mode.progress);
  add(raisedFreq.ok && !raisedFreq.view.solved && raisedFreq.message.indexOf("חלקו") >= 0
    ? { ok: true, id: "bar-freq-not-relative" }
    : fail("bar-freq-not-relative", raisedFreq.message + " " + JSON.stringify(raisedFreq.view && raisedFreq.view.part)));

  var dept = ask(2, "30");
  var band = ask(2, "60%", dept.progress);
  add(dept.ok && dept.progress.solve.total === 30 && band.ok && band.view.part.label === "ג"
    ? { ok: true, id: "bar-percent" }
    : fail("bar-percent", dept.message + " | " + band.message + " " + JSON.stringify(band.view && band.view.part)));
  var bandStep = ask(2, "", dept.progress, "step");
  add(bandStep.shows[0] === "3 + 6 + 9"
    ? { ok: true, id: "bar-several-bars" }
    : fail("bar-several-bars", JSON.stringify(bandStep.shows)));
  var gt = ask(2, "18", band.progress);
  add(!gt.ok && (gt.message.indexOf("יותר מ") >= 0 || gt.message.indexOf("לפחות") >= 0)
    ? { ok: true, id: "bar-gt" }
    : fail("bar-gt", gt.message));

  var directYes = ask(2, "כן", band.progress);
  add(directYes.ok && directYes.view && directYes.view.solved
    ? { ok: true, id: "bar-yes-direct" }
    : fail("bar-yes-direct", directYes.message));
  var compareNums = ask(2, "15=15", band.progress);
  var compareStep = ask(2, "", compareNums.progress, "step");
  add(compareNums.ok && compareNums.view && compareNums.view.entry === "choice" && compareNums.view.input === "yesno" && compareStep.shows[0] === "כן"
    ? { ok: true, id: "bar-compare-numerators" }
    : fail("bar-compare-numerators", compareNums.message + " | " + JSON.stringify(compareNums.view && { entry: compareNums.view.entry, input: compareNums.view.input }) + " | " + JSON.stringify(compareStep.shows)));
  var compareSums = ask(2, "6+9=12+3", band.progress);
  add(compareSums.ok && compareSums.progress.got && compareSums.progress.got.same && compareSums.progress.got.same.compared === "freqs"
    ? { ok: true, id: "bar-compare-sums" }
    : fail("bar-compare-sums", compareSums.message + " " + JSON.stringify(compareSums.progress && compareSums.progress.got)));
  var walk = band.progress;
  var lines = [];
  var guard = 0;
  var choiceView = null;
  while (guard < 12) {
    var step = ask(2, "", walk, "step");
    lines.push(step.shows[0]);
    walk = step.progress;
    choiceView = step.view;
    if (step.view && step.view.entry === "choice") break;
    if (step.view && step.view.solved) break;
    guard += 1;
  }
  add(lines[0] === "9, 10" && lines.indexOf("6 + 9") >= 0 && lines.indexOf("15/30") >= 0 && lines.indexOf("7, 8") >= 0 && lines.indexOf("12 + 3") >= 0 && choiceView && choiceView.entry === "choice"
    ? { ok: true, id: "bar-compare-steps" }
    : fail("bar-compare-steps", lines.join(" | ")));
  var choiceHint = ask(2, "", walk, "hint");
  add(choiceHint.message.indexOf("כן") >= 0 && choiceHint.message.indexOf("15/30") < 0
    ? { ok: true, id: "bar-compare-hint" }
    : fail("bar-compare-hint", choiceHint.message));
  var no = ask(2, "לא", walk);
  add(!no.ok
    ? { ok: true, id: "bar-compare-no" }
    : fail("bar-compare-no", no.message));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-bar: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log(item.id + ": " + item.detail); });
  if (failed.length) process.exit(1);
}

main();
