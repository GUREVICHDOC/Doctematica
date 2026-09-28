"use strict";

var loadEngine = require("./load-engine").loadEngine;
var freq = require("./freq-table");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function ask(index, typed, progress, intent, extra) {
  extra = extra || {};
  return freq.handle(loadEngine(), Object.assign({
    intent: intent || "check",
    levelId: "stat-mode-1",
    exerciseIndex: index,
    typed: typed || "",
    history: [],
    progress: progress || {},
  }, extra));
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) { checks.push(result); }
  var level = (engine.DoctematicaCurriculum.levels || []).filter(function (item) { return item.id === "stat-mode-1"; })[0];
  add(level && level.subtopic === "mode" && level.exercises.length === 9 && level.exercises[4].id === "stat-mode-1-ex-a005" && level.exercises[8].id === "stat-mode-1-ex-a009"
    ? { ok: true, id: "mode-count" }
    : fail("mode-count", JSON.stringify(level && level.exercises && level.exercises.map(function (ex) { return ex.id; }))));

  var list = ask(0, "8");
  add(list.ok && list.progress.done.grades && list.view.part.label === "ב" && list.view.data && list.view.data.join(",") === "2,4,4,5,5,2,2,1,4,3,3,4,5"
    ? { ok: true, id: "mode-list-one" }
    : fail("mode-list-one", list.message + " " + JSON.stringify(list.view && list.view.part)));
  var listHint = ask(0, "", {}, "hint");
  add(listHint.message.indexOf("הכי הרבה") >= 0 && listHint.message.indexOf("8") < 0
    ? { ok: true, id: "mode-list-hint" }
    : fail("mode-list-hint", listHint.message));
  var counted = ask(0, "השכיחות של 8 היא 6");
  var countHint = ask(0, "", counted.progress, "hint");
  add(counted.ok && !counted.progress.done.grades && countHint.message.indexOf("שסיימת לספור") >= 0
    ? { ok: true, id: "mode-list-counted" }
    : fail("mode-list-counted", counted.message + " | " + countHint.message));
  var slip = ask(0, "השכיחות של 8 היא 5");
  add(!slip.ok && slip.message.indexOf("מופע") >= 0
    ? { ok: true, id: "mode-list-off-one" }
    : fail("mode-list-off-one", slip.message));
  var listStep = ask(0, "", {}, "step");
  add(listStep.shows[0] === "השכיחות של 5 היא 2" && !listStep.progress.done.grades
    ? { ok: true, id: "mode-list-step" }
    : fail("mode-list-step", JSON.stringify(listStep.shows)));

  var pair = freq.assess({
    variable: { label: "מספר" },
    frequency: { label: "שכיחות" },
    rows: [{ value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }],
  }, { id: "m", kind: "mode", select: true }, "3 ו-4", null, [2, 3, 3, 4, 4, 5, 7]);
  add(pair.done ? { ok: true, id: "mode-list-two" } : fail("mode-list-two", pair.message));

  var table = ask(1, "", {}, "hint");
  add(table.view && table.view.entry === "pick" && table.view.options.some(function (option) { return option.label === "אין שכיח"; }) && table.message.indexOf("השכיחות הגבוהה ביותר") >= 0 && table.message.indexOf("7") < 0
    ? { ok: true, id: "mode-table-hint" }
    : fail("mode-table-hint", table.message));
  var freqPick = ask(1, "8");
  add(!freqPick.ok && freqPick.message.indexOf("שכיחות") >= 0
    ? { ok: true, id: "mode-pick-frequency" }
    : fail("mode-pick-frequency", freqPick.message));
  var biggest = ask(1, "10");
  add(!biggest.ok && biggest.message.indexOf("הגדול ביותר") >= 0
    ? { ok: true, id: "mode-pick-largest" }
    : fail("mode-pick-largest", biggest.message));
  var grade = ask(1, "", {}, "check", { pick: ["7"] });
  add(grade.ok && grade.progress.done.grade
    ? { ok: true, id: "mode-table-one" }
    : fail("mode-table-one", grade.message));
  var afterMax = ask(1, "השכיחות הגבוהה ביותר היא 8");
  var valueHint = ask(1, "", afterMax.progress, "hint");
  add(afterMax.ok && !afterMax.progress.done.grade && valueHint.message.indexOf("לאיזה ערך") >= 0
    ? { ok: true, id: "mode-after-max" }
    : fail("mode-after-max", afterMax.message + " | " + valueHint.message));

  var rooms = ask(2, "", {}, "check", { pick: ["4"] });
  add(rooms.ok && rooms.progress.done.rooms
    ? { ok: true, id: "mode-rooms" }
    : fail("mode-rooms", rooms.message));

  var oneCar = ask(3, "", {}, "check", { pick: ["1"] });
  add(oneCar.ok && !oneCar.progress.done.cars && oneCar.message.indexOf("ערך נוסף") >= 0
    ? { ok: true, id: "mode-partial" }
    : fail("mode-partial", oneCar.message));
  var tieHint = ask(3, "", oneCar.progress, "hint");
  add(tieHint.message.indexOf("יותר מפעם אחת") >= 0
    ? { ok: true, id: "mode-tie-hint" }
    : fail("mode-tie-hint", tieHint.message));
  var tieStep = ask(3, "", oneCar.progress, "step");
  add(tieStep.shows[0] === "2" && tieStep.progress.done.cars
    ? { ok: true, id: "mode-tie-step" }
    : fail("mode-tie-step", JSON.stringify(tieStep.shows)));
  var both = ask(3, "", {}, "check", { pick: ["2", "1"] });
  add(both.ok && both.progress.done.cars
    ? { ok: true, id: "mode-table-two" }
    : fail("mode-table-two", both.message));
  var extra = ask(3, "", {}, "check", { pick: ["1", "2", "4"] });
  add(!extra.ok && extra.message.indexOf("אינו מופיע") >= 0
    ? { ok: true, id: "mode-extra" }
    : fail("mode-extra", extra.message));

  var chart = ask(4, "", {}, "hint");
  add(chart.view && chart.view.chart && !chart.view.table && chart.message.indexOf("העמודה הגבוהה ביותר") >= 0 && chart.message.indexOf("7") < 0
    ? { ok: true, id: "mode-chart-hint" }
    : fail("mode-chart-hint", chart.message + " " + JSON.stringify(!!(chart.view && chart.view.table))));
  var height = ask(4, "6");
  add(!height.ok && height.message.indexOf("שכיחות") >= 0
    ? { ok: true, id: "mode-chart-height" }
    : fail("mode-chart-height", height.message));
  var chartMode = ask(4, "", {}, "check", { pick: ["7"] });
  add(chartMode.ok && chartMode.view.part.label === "ב"
    ? { ok: true, id: "mode-chart" }
    : fail("mode-chart", chartMode.message));
  var shiftHint = ask(4, "", chartMode.progress, "hint");
  add(shiftHint.message.indexOf("עדכן") >= 0 && shiftHint.message.indexOf("8") >= 0 && shiftHint.message.indexOf("7") < 0
    ? { ok: true, id: "mode-shift-hint" }
    : fail("mode-shift-hint", shiftHint.message));
  var oldMode = ask(4, "7", chartMode.progress);
  add(!oldMode.ok && oldMode.message.indexOf("לפני השינוי") >= 0
    ? { ok: true, id: "mode-old" }
    : fail("mode-old", oldMode.message));
  var bumped = ask(4, "12", chartMode.progress);
  add(!bumped.ok && bumped.message.indexOf("לשכיחות") >= 0
    ? { ok: true, id: "mode-bump-value" }
    : fail("mode-bump-value", bumped.message));
  var shiftStep = ask(4, "", chartMode.progress, "step");
  add(shiftStep.shows[0] === "השכיחות של 8 היא 3"
    ? { ok: true, id: "mode-shift-step" }
    : fail("mode-shift-step", JSON.stringify(shiftStep.shows)));
  var walk = chartMode.progress;
  var lines = [];
  var guard = 0;
  while (guard < 8 && walk && !walk.done.joined) {
    var step = ask(4, "", walk, "step");
    lines.push(step.shows[0]);
    walk = step.progress;
    guard += 1;
  }
  add(lines[0] === "השכיחות של 8 היא 3" && lines.indexOf("3 + 4") >= 0 && lines.indexOf("3 + 4 = 7") >= 0 && lines.indexOf("השכיחות הגבוהה ביותר היא 7") >= 0 && lines[lines.length - 1] === "8" && walk.done.joined
    ? { ok: true, id: "mode-shift-new" }
    : fail("mode-shift-new", lines.join(" | ")));

  var tied = freq.assess({
    variable: { label: "ערך" },
    frequency: { label: "שכיחות" },
    rows: [{ value: 1, freq: 5 }, { value: 2, freq: 3 }, { value: 3, freq: 1 }],
  }, { id: "m", kind: "mode", select: true, adjust: { value: 2, delta: 2 } }, "1 ו-2");
  add(tied.done ? { ok: true, id: "mode-adjust-tie" } : fail("mode-adjust-tie", tied.message));

  var none = freq.assess({
    variable: { label: "ערך" },
    frequency: { label: "שכיחות" },
    rows: [{ value: 1, freq: 4 }, { value: 2, freq: 4 }, { value: 3, freq: 4 }],
  }, { id: "m", kind: "mode", select: true }, "אין שכיח");
  var noneValues = freq.assess({
    variable: { label: "ערך" },
    frequency: { label: "שכיחות" },
    rows: [{ value: 1, freq: 4 }, { value: 2, freq: 4 }, { value: 3, freq: 4 }],
  }, { id: "m", kind: "mode", select: true }, "1 ו-2 ו-3");
  add(none.done && !noneValues.ok && noneValues.message.indexOf("אין שכיח") >= 0
    ? { ok: true, id: "mode-none" }
    : fail("mode-none", none.message + " | " + noneValues.message));

  var rooms = ask(5, "", {}, "check", { pick: ["2"] });
  add(rooms.ok && !rooms.progress.done.rooms && rooms.message.indexOf("ערך נוסף") >= 0
    ? { ok: true, id: "rooms-partial" }
    : fail("rooms-partial", rooms.message));
  var roomsBoth = ask(5, "", {}, "check", { pick: ["3", "2"] });
  add(roomsBoth.ok && roomsBoth.view.part.label === "ב"
    ? { ok: true, id: "rooms-modes" }
    : fail("rooms-modes", roomsBoth.message));
  var equalRaise = ask(5, "4", roomsBoth.progress);
  add(!equalRaise.ok && equalRaise.message.indexOf("יחיד") >= 0
    ? { ok: true, id: "rooms-tie-not-unique" }
    : fail("rooms-tie-not-unique", equalRaise.message));
  var axisRaise = ask(5, "11", roomsBoth.progress);
  add(!axisRaise.ok && axisRaise.message.indexOf("ציר") >= 0
    ? { ok: true, id: "rooms-change-x" }
    : fail("rooms-change-x", axisRaise.message));
  var raised = ask(5, "5", roomsBoth.progress);
  add(raised.ok && raised.progress.done.build
    ? { ok: true, id: "rooms-raise" }
    : fail("rooms-raise", raised.message));
  var raiseHint = ask(5, "", roomsBoth.progress, "hint");
  add(raiseHint.message.indexOf("גבוהה") >= 0 && raiseHint.message.indexOf("5") < 0
    ? { ok: true, id: "rooms-raise-hint" }
    : fail("rooms-raise-hint", raiseHint.message));
  var raiseStep = ask(5, "", roomsBoth.progress, "step");
  add(raiseStep.shows[0] === "השכיחות הגבוהה ביותר היא 7"
    ? { ok: true, id: "rooms-raise-step" }
    : fail("rooms-raise-step", JSON.stringify(raiseStep.shows)));

  var rel = ask(6, "15/60");
  add(rel.ok && rel.view.part.label === "ב"
    ? { ok: true, id: "grade-relative" }
    : fail("grade-relative", rel.message + " " + JSON.stringify(rel.view && rel.view.part)));
  var gradeMode = ask(6, "", rel.progress, "step");
  add(gradeMode.shows[0].indexOf("15/60") < 0 && gradeMode.shows[0].indexOf("27") >= 0
    ? { ok: true, id: "grade-mode-skips-relative" }
    : fail("grade-mode-skips-relative", JSON.stringify(gradeMode.shows)));
  var gradePick = ask(6, "", rel.progress, "check", { pick: ["7"] });
  add(gradePick.ok && gradePick.progress.done.grade
    ? { ok: true, id: "grade-mode" }
    : fail("grade-mode", gradePick.message));

  var heightValue = ask(7, "135");
  add(!heightValue.ok && heightValue.message.indexOf("שכיחות") >= 0
    ? { ok: true, id: "height-value-not-freq" }
    : fail("height-value-not-freq", heightValue.message));
  var height = ask(7, "x = 10");
  add(height.ok && height.progress.solve.missing === 10 && height.view.part.label === "ב"
    ? { ok: true, id: "height-tie" }
    : fail("height-tie", height.message + " " + JSON.stringify(height.progress && height.progress.solve)));
  var ge = ask(7, "x >= 10", height.progress);
  var lt = ask(7, "10 < x", height.progress);
  var gt = ask(7, "x>10", height.progress);
  add(!ge.ok && ge.message.indexOf("שני שכיחים") >= 0 && lt.ok && lt.progress.done.only && gt.ok
    ? { ok: true, id: "height-unique-compare" }
    : fail("height-unique-compare", ge.message + " | " + lt.message + " | " + gt.message));
  var boundStep = ask(7, "", height.progress, "step");
  add(boundStep.shows[0].indexOf("10") >= 0 && boundStep.shows[0].indexOf(">") < 0
    ? { ok: true, id: "height-bound-step" }
    : fail("height-bound-step", JSON.stringify(boundStep.shows)));

  var workers = ask(8, "50");
  add(workers.ok && workers.progress.solve.total === 50 && workers.view.part.label === "ב"
    ? { ok: true, id: "pay-total" }
    : fail("pay-total", workers.message + " " + JSON.stringify(workers.progress && workers.progress.solve)));
  var payRel = ask(8, "", workers.progress, "step");
  add(payRel.shows[0] === "6/50" && payRel.progress.solve.total === 50
    ? { ok: true, id: "pay-relative-reuses-total" }
    : fail("pay-relative-reuses-total", JSON.stringify(payRel.shows)));
  var payMode = ask(8, "", payRel.progress, "step");
  add(payMode.shows[0].indexOf("x") >= 0 && payMode.shows[0].indexOf("50") >= 0 && payMode.shows[0].indexOf("8%") < 0
    ? { ok: true, id: "pay-find-x" }
    : fail("pay-find-x", JSON.stringify(payMode.shows)));
  var payX = ask(8, "", payMode.progress, "step");
  add(payX.shows[0] === "x = 10" && payX.progress.solve && payX.progress.solve.missing === 10
    ? { ok: true, id: "pay-solve-x" }
    : fail("pay-solve-x", JSON.stringify(payX.shows) + " " + JSON.stringify(payX.progress && payX.progress.solve)));
  var payMax = ask(8, "", payX.progress, "step");
  add(payMax.shows[0] === "השכיחות הגבוהה ביותר היא 20"
    ? { ok: true, id: "pay-max" }
    : fail("pay-max", JSON.stringify(payMax.shows)));
  var payValue = ask(8, "", payMax.progress, "step");
  add(payValue.shows[0] === "6000" && payValue.progress.done && payValue.progress.done.pay
    ? { ok: true, id: "pay-mode-step" }
    : fail("pay-mode-step", JSON.stringify(payValue.shows) + " " + JSON.stringify(payValue.progress && payValue.progress.done)));
  var payAgain = ask(8, "", payValue.progress, "step");
  add(payAgain.ok === false || (payAgain.shows || []).join("").indexOf("40 + x") < 0
    ? { ok: true, id: "pay-no-loop" }
    : fail("pay-no-loop", JSON.stringify(payAgain.shows)));
  var payAnswer = ask(8, "", payRel.progress, "check", { pick: ["6000"] });
  add(payAnswer.ok && payAnswer.progress.done.pay
    ? { ok: true, id: "pay-mode" }
    : fail("pay-mode", payAnswer.message));
  var payFreq = ask(8, "10", payRel.progress);
  add(!payFreq.ok && payFreq.message.indexOf("שכיחות") >= 0
    ? { ok: true, id: "pay-x-not-salary" }
    : fail("pay-x-not-salary", payFreq.message));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-mode: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log(item.id + ": " + item.detail); });
  if (failed.length) process.exit(1);
}

main();
