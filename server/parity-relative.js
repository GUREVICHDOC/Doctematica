"use strict";

var loadEngine = require("./load-engine").loadEngine;
var studentDto = require("./student-dto");
var freq = require("./freq-table");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function ask(engine, index, typed, progress, intent, history, extra) {
  return askAt(engine, "stat-rel-1", index, typed, progress, intent, history, extra);
}

function askAt(engine, levelId, index, typed, progress, intent, history, extra) {
  extra = extra || {};
  return freq.handle(engine, Object.assign({
    intent: intent || "check",
    levelId: levelId,
    exerciseIndex: index,
    typed: typed || "",
    history: history || [],
    progress: progress || {},
  }, extra));
}

function tableCell(view, value) {
  var rows = (((view || {}).table || {}).rows) || [];
  var i;
  for (i = 0; i < rows.length; i++) {
    if (String(rows[i].value) === String(value)) return rows[i];
  }
  return null;
}

function shows(result) {
  return (result.lines || []).map(function (line) { return line.show; });
}

function cellByValue(view, value) {
  var cells = (((view || {}).work || {}).rows || [])[0];
  cells = cells && cells.cells || [];
  var i;
  for (i = 0; i < cells.length; i++) {
    if (String(cells[i].value) === String(value)) return cells[i];
  }
  return null;
}

function rowValues(view) {
  return ((((view || {}).table || {}).rows) || []).map(function (row) { return String(row.value); });
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) { checks.push(result); }
  function merge(progress, extra) {
    extra = extra || {};
    if (extra.phase) progress.phase = extra.phase;
    if (extra.got) Object.keys(extra.got).forEach(function (key) { progress.got[key] = extra.got[key]; });
    return progress;
  }
  function grades(part, extra) {
    var progress = { done: {}, got: {}, phase: {} };
    if (part !== "א") progress.done.n = true;
    if (part === "ג" || part === "ד") progress.done.nine = true;
    if (part === "ד") progress.got.rel9 = { fraction: "7/50", percent: "14%" };
    return merge(progress, extra);
  }
  function scoresAtFill() {
    return { done: { n: true }, got: {}, phase: {} };
  }
  function cars(part, extra) {
    var progress = { done: { freq: true }, got: {}, phase: {} };
    if (part !== "ב") progress.got.one = { fraction: "6/23" };
    if (part === "ד" || part === "ה") progress.got.none = { fraction: "3/23" };
    if (part === "ה") progress.got.more = { fraction: "9/23" };
    if (part === "ג") progress.got.one = { fraction: "6/23" };
    return merge(progress, extra);
  }

  var level = (engine.DoctematicaCurriculum.levels || []).filter(function (item) { return item.id === "stat-rel-1"; })[0];
  add(level && level.subtopic === "relative-freq" && level.exercises.length === 7 && level.exercises[0].parts.length === 4 && level.exercises[2].parts.length === 5
    ? { ok: true, id: "rel-count" }
    : fail("rel-count", String(level && level.exercises.length)));

  var openTotal = studentDto.openProblem(engine, "stat-rel-1", 0);
  var openRaw = JSON.stringify(openTotal);
  add(openTotal.problem.table.rows.length === 5 && openRaw.indexOf("7/50") < 0 && openRaw.indexOf("\"50\"") < 0
    ? { ok: true, id: "rel-open-total" }
    : fail("rel-open-total", openRaw.slice(0, 300)));
  add(!openTotal.view.work
    ? { ok: true, id: "rel-open-tools" }
    : fail("rel-open-tools", JSON.stringify(openTotal.view.work)));
  var openEight = ask(engine, 0, "", grades("ד"), "hint");
  add(openEight.view.work && openEight.view.work.available.length === 3 && openEight.view.work.rows.length === 0 && openEight.view.part.label === "ד"
    ? { ok: true, id: "rel-open-relative-tools" }
    : fail("rel-open-relative-tools", JSON.stringify(openEight.view && openEight.view.part && openEight.view.work)));

  var openBoth = ask(engine, 0, "", grades("ג"), "hint");
  var bothRaw = JSON.stringify(openBoth);
  add(openBoth.view.fields && openBoth.view.fields.length === 2 && !openBoth.view.fields[0].value && bothRaw.indexOf("7/50") < 0 && bothRaw.indexOf("14%") < 0
    ? { ok: true, id: "rel-open-fields" }
    : fail("rel-open-fields", bothRaw.slice(0, 400)));

  var openScores = studentDto.openProblem(engine, "stat-rel-1", 1);
  add(openScores.view.part.label === "א" && !openScores.view.work
    ? { ok: true, id: "scores-open-total" }
    : fail("scores-open-total", JSON.stringify(openScores.view && openScores.view.part)));
  var openFill = ask(engine, 1, "", scoresAtFill(), "hint");
  var fillRows = (openFill.view.work && openFill.view.work.rows) || [];
  add(fillRows.length === 2 && fillRows[0].required && !fillRows[0].removable && fillRows[0].cells.every(function (cell) { return !cell.text; })
    ? { ok: true, id: "rel-open-fill" }
    : fail("rel-open-fill", JSON.stringify(fillRows.map(function (row) { return row.row; }))));

  var total = ask(engine, 0, "50");
  add(total.ok && !total.view.solved && total.view.part.label === "ב" ? { ok: true, id: "grades-total" } : fail("grades-total", JSON.stringify(total.view && total.view.part)));
  var lookup = ask(engine, 0, "7", total.progress);
  add(lookup.ok && lookup.view.part.label === "ג" && lookup.view.fields && lookup.view.fields.length === 2
    ? { ok: true, id: "grades-lookup" }
    : fail("grades-lookup", JSON.stringify(lookup.view && lookup.view.part)));

  var sol = ask(engine, 0, "", grades("ג", { got: { rel8: { fraction: "20/50" } } }), "solution");
  var solLines = shows(sol);
  add(sol.view.solved && solLines[0] === "7 + 20 + 13 + 8 + 2" && solLines.indexOf("7/50") >= 0 && solLines.indexOf("(7/50)·100") >= 0 && solLines[solLines.length - 1] === "14%"
    ? { ok: true, id: "grades-nine-solution" }
    : fail("grades-nine-solution", solLines.join(" | ")));
  add(ask(engine, 0, "7/50", grades("ג")).ok && ask(engine, 0, "7/50", grades("ג")).view.part.label === "ג"
    ? { ok: true, id: "grades-nine-fraction-step" }
    : fail("grades-nine-fraction-step", ""));
  var percentAfter = ask(engine, 0, "14%", grades("ג", { got: { rel9: { fraction: "7/50" }, rel8: { fraction: "20/50" } }, phase: { rel9: "fraction" } }));
  add(percentAfter.view.solved ? { ok: true, id: "grades-nine-percent" } : fail("grades-nine-percent", JSON.stringify(percentAfter.view && percentAfter.view.part)));
  var fields = ask(engine, 0, "", grades("ג", { got: { rel8: { fraction: "20/50" } } }), "check", [], { answers: { fraction: "7/50", percent: "14" } });
  add(fields.view.solved && fields.part === "ג" && fields.shows && fields.shows.join(",") === "7/50,14%"
    ? { ok: true, id: "grades-nine-fields" }
    : fail("grades-nine-fields", JSON.stringify(fields.shows)));
  var oneField = ask(engine, 0, "", grades("ג"), "check", [], { answers: { fraction: "7/50", percent: "" } });
  add(oneField.ok && !oneField.view.solved && oneField.view.fields[0].locked && !oneField.view.fields[1].locked && oneField.shows && oneField.shows.join(",") === "7/50"
    ? { ok: true, id: "grades-nine-lock-one" }
    : fail("grades-nine-lock-one", JSON.stringify(oneField.shows)));
  var secondField = ask(engine, 0, "", oneField.progress, "check", [], { answers: { percent: "14" } });
  add(secondField.ok && secondField.view.part.label === "ד" && secondField.shows && secondField.shows.join(",") === "14%"
    ? { ok: true, id: "grades-nine-second-field" }
    : fail("grades-nine-second-field", JSON.stringify(secondField.shows) + " " + JSON.stringify(secondField.view && secondField.view.part)));

  add(ask(engine, 0, "20/50", grades("ד")).view.solved && ask(engine, 0, "2/5", grades("ד")).view.solved && ask(engine, 0, "0.4", grades("ד")).view.solved && ask(engine, 0, "40%", grades("ד")).view.solved
    ? { ok: true, id: "grades-eight-forms" }
    : fail("grades-eight-forms", ""));
  var eightSol = shows(ask(engine, 0, "", grades("ד"), "solution"));
  add(eightSol.indexOf("20/50") >= 0 && eightSol.indexOf("2/5") < 0 && eightSol[eightSol.length - 1] === "20/50"
    ? { ok: true, id: "grades-eight-unreduced" }
    : fail("grades-eight-unreduced", eightSol.join(" | ")));
  var freqErr = ask(engine, 0, "20", grades("ד"));
  add(!freqErr.ok && freqErr.message.indexOf("השכיחות עצמה") >= 0 && freqErr.message.indexOf("20/50") < 0
    ? { ok: true, id: "grades-eight-freq" }
    : fail("grades-eight-freq", freqErr.message));
  var div100 = ask(engine, 0, "20/100", grades("ד"));
  add(!div100.ok && div100.message.indexOf("100") >= 0 && div100.message.indexOf("20/50") < 0
    ? { ok: true, id: "grades-eight-div100" }
    : fail("grades-eight-div100", div100.message));
  var invert = ask(engine, 0, "50/20", grades("ד"));
  add(!invert.ok && invert.message.indexOf("מכנה") >= 0 && invert.message.indexOf("20/50") < 0
    ? { ok: true, id: "grades-eight-invert" }
    : fail("grades-eight-invert", invert.message));
  var barePct = ask(engine, 0, "", grades("ג", { got: { rel9: { fraction: "7/50" } } }), "check", [], { answers: { percent: "0.14" } });
  add(!barePct.ok && barePct.message.indexOf("100") >= 0 && barePct.message.indexOf("14%") < 0
    ? { ok: true, id: "grades-nine-bare-percent" }
    : fail("grades-nine-bare-percent", barePct.message));
  var shift = ask(engine, 0, "", grades("ג", { got: { rel9: { fraction: "7/50" } } }), "check", [], { answers: { percent: "1.4" } });
  add(!shift.ok && shift.message.indexOf("הנקודה") >= 0
    ? { ok: true, id: "grades-nine-shift" }
    : fail("grades-nine-shift", shift.message));
  var slip = ask(engine, 0, "7 + 20 + 13 + 8 + 2 = 49", grades("ד"));
  add(!slip.ok && slip.message.indexOf("טעות בחישוב") >= 0 && slip.message.indexOf("50") < 0
    ? { ok: true, id: "grades-calc" }
    : fail("grades-calc", slip.message));

  var hint0 = ask(engine, 0, "", grades("ד"), "hint");
  add(hint0.message.indexOf("חברו") >= 0 && hint0.message.indexOf("20/50") < 0 && hint0.message.indexOf("40") < 0
    ? { ok: true, id: "grades-hint-start" }
    : fail("grades-hint-start", hint0.message));
  var hintN = ask(engine, 0, "", grades("ד", { phase: { rel8: "total" } }), "hint", ["7 + 20 + 13 + 8 + 2", "50"]);
  add(hintN.message.indexOf("חלקו") >= 0 && hintN.message.indexOf("20/50") < 0
    ? { ok: true, id: "grades-hint-after-total" }
    : fail("grades-hint-after-total", hintN.message));
  add(ask(engine, 0, "", grades("ד"), "step").shows[0] === "7 + 20 + 13 + 8 + 2"
    ? { ok: true, id: "grades-step-sum" }
    : fail("grades-step-sum", ""));
  var stepFrac = ask(engine, 0, "", grades("ד", { phase: { rel8: "total" } }), "step", ["7 + 20 + 13 + 8 + 2", "50"]);
  add(stepFrac.shows[0] === "20/50" ? { ok: true, id: "grades-step-fraction" } : fail("grades-step-fraction", JSON.stringify(stepFrac.shows)));

  var scoresTotal = ask(engine, 1, "40");
  add(scoresTotal.ok && !scoresTotal.view.solved && scoresTotal.view.part.label === "ב" && scoresTotal.view.work && scoresTotal.view.work.rows.length === 2
    ? { ok: true, id: "scores-total" }
    : fail("scores-total", JSON.stringify(scoresTotal.view && scoresTotal.view.part)));
  var cell = ask(engine, 1, "", scoresAtFill(), "check", [], { fill: { row: "relativeFraction", value: "10", typed: "3/40" } });
  var lockedTen = cellByValue(cell.view, "10");
  add(cell.ok && !cell.view.solved && lockedTen && lockedTen.locked && lockedTen.text === "3/40"
    ? { ok: true, id: "scores-cell" }
    : fail("scores-cell", JSON.stringify(lockedTen)));
  var reducedCell = ask(engine, 1, "", scoresAtFill(), "check", [], { fill: { row: "relativeFraction", value: "8", typed: "7/20" } });
  var lockedEight = cellByValue(reducedCell.view, "8");
  add(reducedCell.ok && lockedEight && lockedEight.text === "7/20"
    ? { ok: true, id: "scores-reduced-cell" }
    : fail("scores-reduced-cell", JSON.stringify(lockedEight)));
  var fillSol = shows(ask(engine, 1, "", scoresAtFill(), "solution"));
  add(fillSol[0] === "3 + 8 + 14 + 9 + 4 + 2" && fillSol.indexOf("3/40") >= 0 && fillSol.indexOf("14/40") >= 0 && fillSol.indexOf("7.5%") >= 0 && ask(engine, 1, "", scoresAtFill(), "solution").view.solved
    ? { ok: true, id: "scores-solution" }
    : fail("scores-solution", fillSol.join(" | ")));

  var identified = ask(engine, 2, "מספר המשפחות");
  add(identified.ok && !identified.view.solved && identified.view.part.label === "ב"
    ? { ok: true, id: "cars-identify" }
    : fail("cars-identify", JSON.stringify(identified.view && identified.view.part)));
  add(ask(engine, 2, "6/23", cars("ב", { got: { none: { fraction: "3/23" }, more: { fraction: "9/23" }, fewer: { fraction: "14/23" } } })).view.solved
    && ask(engine, 2, "3/23", cars("ג", { got: { more: { fraction: "9/23" }, fewer: { fraction: "14/23" } } })).view.solved
    ? { ok: true, id: "cars-exact" }
    : fail("cars-exact", ""));
  var more = shows(ask(engine, 2, "", cars("ד", { got: { fewer: { fraction: "14/23" } } }), "solution"));
  add(more.indexOf("1 + 8") >= 0 && more[more.length - 1] === "9/23"
    ? { ok: true, id: "cars-more-solution" }
    : fail("cars-more-solution", more.join(" | ")));
  var comp = ask(engine, 2, "14/23", cars("ד"));
  add(comp.ok && !comp.view.solved ? { ok: true, id: "cars-complement-step" } : fail("cars-complement-step", JSON.stringify(comp)));
  var compNext = ask(engine, 2, "", cars("ד", { phase: { more: "part" } }), "step", ["14/23"]);
  add(compNext.shows[0] === "1 - 14/23" ? { ok: true, id: "cars-complement-continue" } : fail("cars-complement-continue", JSON.stringify(compNext.shows)));
  var compDone = ask(engine, 2, "1 - 14/23 = 9/23", cars("ד", { got: { fewer: { fraction: "14/23" } } }));
  add(compDone.view.solved ? { ok: true, id: "cars-complement-done" } : fail("cars-complement-done", JSON.stringify(compDone)));
  var values = ask(engine, 2, "4 + 3", cars("ד"));
  add(!values.ok && values.message.indexOf("ערכי המשתנה") >= 0
    ? { ok: true, id: "cars-values" }
    : fail("cars-values", values.message));
  var fewer = ask(engine, 2, "22/23", cars("ה"));
  add(!fewer.ok && fewer.message.indexOf("פחות מ") >= 0
    ? { ok: true, id: "cars-boundary" }
    : fail("cars-boundary", fewer.message));
  add(ask(engine, 2, "14/23", cars("ה")).view.solved && ask(engine, 2, "1 - 9/23 = 14/23", cars("ה")).view.solved
    ? { ok: true, id: "cars-fewer" }
    : fail("cars-fewer", ""));
  var hintMore = ask(engine, 2, "", cars("ד", { phase: { more: "total" } }), "hint", ["23"]);
  add(hintMore.message.indexOf("גדולים מ־2") >= 0 && hintMore.message.indexOf("9/23") < 0
    ? { ok: true, id: "cars-hint" }
    : fail("cars-hint", hintMore.message));
  var hintPicked = ask(engine, 2, "", cars("ד", { phase: { more: "part" } }), "hint", ["1 + 8", "9"]);
  add(hintPicked.message.indexOf("חלקו") >= 0 && hintPicked.message.indexOf("9/23") < 0
    ? { ok: true, id: "cars-hint-after-sum" }
    : fail("cars-hint-after-sum", hintPicked.message));

  var blocked = ask(engine, 0, "", {}, "work", [], { work: { action: "add", row: "relativeDecimal" } });
  add(!blocked.ok && !blocked.view.work ? { ok: true, id: "work-not-on-total" } : fail("work-not-on-total", JSON.stringify(blocked)));
  var added = ask(engine, 0, "", grades("ד"), "work", [], { work: { action: "add", row: "relativeDecimal" } });
  add(added.ok && added.view.work.rows.length === 1 && added.view.work.rows[0].removable
    ? { ok: true, id: "work-add" }
    : fail("work-add", JSON.stringify(added)));
  var again = ask(engine, 0, "", added.progress, "work", [], { work: { action: "add", row: "relativeDecimal" } });
  add(!again.ok && again.message.indexOf("כבר") >= 0 ? { ok: true, id: "work-duplicate" } : fail("work-duplicate", again.message));
  var removed = ask(engine, 0, "", added.progress, "work", [], { work: { action: "remove", row: "relativeDecimal" } });
  add(removed.ok && removed.view.work.rows.length === 0 ? { ok: true, id: "work-remove" } : fail("work-remove", JSON.stringify(removed.view && removed.view.work)));
  var keepRequired = ask(engine, 1, "", scoresAtFill(), "work", [], { work: { action: "remove", row: "relativeFraction" } });
  add(!keepRequired.ok && keepRequired.message.indexOf("להשלים") >= 0
    ? { ok: true, id: "work-required" }
    : fail("work-required", keepRequired.message));

  var old = studentDto.openProblem(engine, "stat-freq-1", 0);
  add(!old.view.work && old.view.part.label === "א"
    ? { ok: true, id: "old-table-tools" }
    : fail("old-table-tools", JSON.stringify(old.view && old.view.work)));

  var gradesView = ask(engine, 0, "", {}, "hint").view;
  add(gradesView.table && gradesView.table.columnOrder === "asc" && rowValues(gradesView).join(",") === "5,6,7,8,9"
    ? { ok: true, id: "rtl-numeric-order" }
    : fail("rtl-numeric-order", rowValues(gradesView).join(",")));
  var oldNumeric = studentDto.openProblem(engine, "stat-freq-1", 1);
  add(oldNumeric.view.table && oldNumeric.view.table.columnOrder === "asc" && rowValues(oldNumeric.view).join(",") === "0,1,2,3,4,5"
    ? { ok: true, id: "rtl-existing-numeric" }
    : fail("rtl-existing-numeric", rowValues(oldNumeric.view).join(",")));
  var letters = studentDto.openProblem(engine, "stat-freq-1", 0);
  add(letters.view.table && letters.view.table.columnOrder === "given" && rowValues(letters.view).join(",") === "א,ב,ג,ד,ה,ו"
    ? { ok: true, id: "given-order-letters" }
    : fail("given-order-letters", rowValues(letters.view).join(",")));
  var flowers = ask(engine, 5, "", {}, "hint").view;
  add(flowers.table && flowers.table.columnOrder === "given" && rowValues(flowers).join(",") === "אדום,צהוב,כחול,ורוד,לבן"
    ? { ok: true, id: "flowers-horizontal" }
    : fail("flowers-horizontal", rowValues(flowers).join(",")));

  var book = { done: { n: true, top: true }, got: {}, phase: {} };
  var dec = ask(engine, 3, "0.14", book);
  add(dec.ok && !dec.view.solved && dec.view.part.label === "ג"
    ? { ok: true, id: "book-decimal" }
    : fail("book-decimal", JSON.stringify(dec.view && dec.view.part)));
  var bothForms = ask(engine, 3, "7/50", book);
  var bothDone = ask(engine, 3, "0.14", bothForms.progress);
  add(bothForms.ok && !bothForms.progress.done.rel90 && bothDone.ok && bothDone.view.part.label === "ד"
    ? { ok: true, id: "book-fraction-then-decimal" }
    : fail("book-fraction-then-decimal", JSON.stringify(bothDone.view && bothDone.view.part)));
  var pct = ask(engine, 3, "80%", { done: { n: true, top: true, rel90: true }, got: { rel90: { fraction: "7/50", decimal: "0.14" }, rel80: { fraction: "20/50", percent: "40%" } }, phase: {} });
  add(pct.ok && pct.view.part.label === "ו" ? { ok: true, id: "book-percent-condition" } : fail("book-percent-condition", JSON.stringify(pct.view && pct.view.part)));
  var failPct = ask(engine, 3, "4%", pct.progress);
  add(failPct.ok && failPct.view.solved ? { ok: true, id: "book-fail-percent" } : fail("book-fail-percent", JSON.stringify(failPct.view && failPct.view.part)));
  var sumRel = freq.assess({
    variable: { label: "הציון" },
    frequency: { label: "מספר התלמידים" },
    rows: [{ value: 1, freq: 1 }, { value: 2, freq: 1 }],
  }, { id: "sum", kind: "relativeSum" }, "1", {});
  add(sumRel.ok && sumRel.done ? { ok: true, id: "relative-sum-one" } : fail("relative-sum-one", JSON.stringify(sumRel)));
  var sumPct = freq.assess({
    variable: { label: "הציון" },
    frequency: { label: "מספר התלמידים" },
    rows: [{ value: 1, freq: 1 }, { value: 2, freq: 1 }],
  }, { id: "sum", kind: "relativeSum", forms: ["percent"] }, "100%", {});
  add(sumPct.ok && sumPct.done ? { ok: true, id: "relative-sum-percent" } : fail("relative-sum-percent", JSON.stringify(sumPct)));
  var sumStep = freq.nextStep({
    variable: { label: "הציון" },
    frequency: { label: "מספר התלמידים" },
    rows: [{ value: 1, freq: 1 }, { value: 2, freq: 3 }],
  }, { id: "sum", kind: "relativeSum" }, {});
  add(sumStep.line === "1" ? { ok: true, id: "relative-sum-step" } : fail("relative-sum-step", String(sumStep.line)));

  var low = ask(engine, 5, "8/80", { done: { var: true, scale: true, mode: true, relMode: true }, got: {}, phase: {} });
  add(low.ok && low.view.solved ? { ok: true, id: "flowers-min-fraction" } : fail("flowers-min-fraction", JSON.stringify(low)));
  var flowerMode = ask(engine, 5, "לבן", { done: { var: true, scale: true }, got: {}, phase: {} });
  add(flowerMode.ok && flowerMode.view.part.label === "ג" ? { ok: true, id: "flowers-mode" } : fail("flowers-mode", JSON.stringify(flowerMode.view && flowerMode.view.part)));

  var blank = ask(engine, 6, "", {}, "hint").view;
  var blankRaw = JSON.stringify(blank);
  add(blank.table && rowValues(blank).join(",") === "0,1,2,3,4" && blank.table.rows[1].open && blank.table.rows[3].open && blankRaw.indexOf("\"6\"") < 0 && blankRaw.indexOf("\"8\"") < 0
    ? { ok: true, id: "unknown-open-cells" }
    : fail("unknown-open-cells", rowValues(blank).join(",")));
  var mark = ask(engine, 6, "", {}, "check", [], { fill: { value: "1", typed: "x" } });
  add(mark.ok && mark.progress.symbols.cells["1"] === "x" && !mark.progress.done.recover
    ? { ok: true, id: "unknown-mark" }
    : fail("unknown-mark", JSON.stringify(mark.progress && mark.progress.symbols)));
  var link = ask(engine, 6, "", mark.progress, "check", [], { fill: { value: "3", typed: "(4/3)x" } });
  add(link.ok && link.progress.symbols.cells["3"] === "(4/3)x"
    ? { ok: true, id: "unknown-other-scale" }
    : fail("unknown-other-scale", JSON.stringify(link.progress && link.progress.symbols)));
  var flipped = ask(engine, 6, "", mark.progress, "check", [], { fill: { value: "3", typed: "(3/4)x" } });
  add(!flipped.ok && flipped.message.indexOf("הפוך") >= 0 ? { ok: true, id: "unknown-inverse" } : fail("unknown-inverse", flipped.message));
  var sameX = ask(engine, 6, "", mark.progress, "check", [], { fill: { value: "3", typed: "x" } });
  add(!sameX.ok && sameX.message.indexOf("אותו ביטוי") >= 0 ? { ok: true, id: "unknown-same" } : fail("unknown-same", sameX.message));
  var guided = ask(engine, 6, "", {}, "step");
  add(guided.shows[0] === "3x" && guided.progress.symbols.cells["1"] === "3x"
    ? { ok: true, id: "unknown-step-mark" }
    : fail("unknown-step-mark", JSON.stringify(guided.shows)));
  var guidedLink = ask(engine, 6, "", guided.progress, "step");
  add(guidedLink.shows[0] === "4x" ? { ok: true, id: "unknown-step-link" } : fail("unknown-step-link", JSON.stringify(guidedLink.shows)));
  var guidedEq = ask(engine, 6, "", guidedLink.progress, "step");
  add(guidedEq.shows[0] === "3+3x+5+4x+1=23" ? { ok: true, id: "unknown-step-equation" } : fail("unknown-step-equation", JSON.stringify(guidedEq.shows)));
  var hintEq = ask(engine, 6, "", guidedEq.progress, "hint");
  add(hintEq.message && hintEq.message.indexOf("3x") < 0 ? { ok: true, id: "unknown-hint-equation" } : fail("unknown-hint-equation", hintEq.message));
  var alt = ask(engine, 6, "7x+9=23", guidedLink.progress);
  add(alt.ok && alt.progress.symbols.equation ? { ok: true, id: "unknown-equation" } : fail("unknown-equation", JSON.stringify(alt)));
  var moved = ask(engine, 6, "7x=14", alt.progress);
  add(moved.ok && moved.progress.symbols.eqCurrent === "7x=14" ? { ok: true, id: "unknown-engine-step" } : fail("unknown-engine-step", JSON.stringify(moved)));
  var solvedX = ask(engine, 6, "x=2", moved.progress);
  add(solvedX.ok && solvedX.progress.symbols.value === 2 && !solvedX.progress.done.recover
    ? { ok: true, id: "unknown-solved" }
    : fail("unknown-solved", JSON.stringify(solvedX.progress && solvedX.progress.symbols)));
  var badPlug = ask(engine, 6, "", solvedX.progress, "check", [], { fill: { value: "1", typed: "5" } });
  add(!badPlug.ok && badPlug.message.indexOf("הצבה") >= 0 ? { ok: true, id: "unknown-bad-plug" } : fail("unknown-bad-plug", badPlug.message));
  var plug = ask(engine, 6, "", solvedX.progress, "step");
  add(plug.shows[0] === "6" && plug.progress.symbols.resolved["1"] === 6
    ? { ok: true, id: "unknown-plug" }
    : fail("unknown-plug", JSON.stringify(plug.shows)));
  var earlyRel = ask(engine, 6, "3x/23", guidedLink.progress);
  add(!earlyRel.ok && earlyRel.message.indexOf("השכיחות עצמה") >= 0 ? { ok: true, id: "unknown-early-relative" } : fail("unknown-early-relative", earlyRel.message));
  var hintStart = ask(engine, 6, "", {}, "hint");
  add(hintStart.message.indexOf("נעלם") >= 0 && hintStart.message.indexOf("3x") < 0
    ? { ok: true, id: "unknown-hint-start" }
    : fail("unknown-hint-start", hintStart.message));
  var hintOne = ask(engine, 6, "", guided.progress, "hint");
  add(hintOne.message.indexOf("יחס") >= 0 && hintOne.message.indexOf("4x") < 0
    ? { ok: true, id: "unknown-hint-one" }
    : fail("unknown-hint-one", hintOne.message));
  var hintBoth = ask(engine, 6, "", guidedLink.progress, "hint");
  add(hintBoth.message.indexOf("סכום") >= 0 ? { ok: true, id: "unknown-hint-both" } : fail("unknown-hint-both", hintBoth.message));
  var direct = ask(engine, 6, "8");
  add(direct.ok && direct.view.part.label === "ב" && direct.progress.symbols.resolved["3"] === 8 && direct.progress.symbols.resolved["1"] === 6
    ? { ok: true, id: "unknown-direct" }
    : fail("unknown-direct", JSON.stringify(direct.view && direct.view.part)));
  var directCells = ask(engine, 6, "", {}, "check", [], { fill: { value: "1", typed: "6" } });
  var directBoth = ask(engine, 6, "", directCells.progress, "check", [], { fill: { value: "3", typed: "8" } });
  add(directCells.ok && directBoth.ok && directBoth.view.part.label === "ב"
    ? { ok: true, id: "unknown-direct-cells" }
    : fail("unknown-direct-cells", JSON.stringify(directBoth.view && directBoth.view.part)));
  var omitted = ask(engine, 6, "3x+4x+3+5=23", guidedLink.progress);
  add(!omitted.ok && omitted.message.indexOf("חסרה") >= 0 ? { ok: true, id: "unknown-omitted" } : fail("unknown-omitted", omitted.message));
  var valuesEq = ask(engine, 6, "0+1+2+3+4=23", guidedLink.progress);
  add(!valuesEq.ok && valuesEq.message.indexOf("ערכי המשתנה") >= 0 ? { ok: true, id: "unknown-values" } : fail("unknown-values", valuesEq.message));
  var wrongSide = ask(engine, 6, "3x+4x+9+23=0", guidedLink.progress);
  add(!wrongSide.ok && wrongSide.message.indexOf("הכולל") >= 0 ? { ok: true, id: "unknown-wrong-side" } : fail("unknown-wrong-side", wrongSide.message));
  var relAfter = ask(engine, 6, "6/23", direct.progress);
  add(relAfter.ok && relAfter.view.part.label === "ג" ? { ok: true, id: "unknown-back-to-relative" } : fail("unknown-back-to-relative", JSON.stringify(relAfter.view && relAfter.view.part)));
  var full = shows(ask(engine, 6, "", {}, "solution"));
  add(full[0] === "3x" && full.indexOf("x = 2") >= 0 && full.indexOf("8") >= 0 && full.indexOf("6/23") >= 0
    ? { ok: true, id: "unknown-solution" }
    : fail("unknown-solution", full.join(" | ")));

  var level2 = (engine.DoctematicaCurriculum.levels || []).filter(function (item) { return item.id === "stat-rel-2"; })[0];
  add(level2 && level2.exercises.length === 3 && level2.exercises[0].id === "stat-rel-2-ex-a001" && level2.exercises[2].parts.length === 4
    ? { ok: true, id: "rel2-count" }
    : fail("rel2-count", String(level2 && level2.exercises && level2.exercises.length)));

  var open15 = askAt(engine, "stat-rel-2", 0, "", {}, "hint");
  var open15Raw = JSON.stringify(open15.view);
  var cellX = tableCell(open15.view, 8);
  add(rowValues(open15.view).join(",") === "7,8,9,10" && cellX && cellX.expr === "x" && !cellX.open && cellX.freq == null && open15Raw.indexOf("\"25\"") < 0 && open15.message.indexOf("25") < 0
    ? { ok: true, id: "rel2-open-given-x" }
    : fail("rel2-open-given-x", open15Raw.slice(0, 400) + " " + open15.message));

  var fracProp = askAt(engine, "stat-rel-2", 0, "10/N=2/5");
  add(fracProp.ok && fracProp.shows[0] === "10/N = 2/5" && !fracProp.progress.done.n
    ? { ok: true, id: "rel2-fraction-prop" }
    : fail("rel2-fraction-prop", JSON.stringify(fracProp.shows) + " " + fracProp.message));
  var fracCross = askAt(engine, "stat-rel-2", 0, "2*N=50");
  add(fracCross.ok && fracCross.progress.solve.phase === "expr" && fracCross.progress.solve.total == null
    ? { ok: true, id: "rel2-cross" }
    : fail("rel2-cross", JSON.stringify(fracCross.progress && fracCross.progress.solve) + " " + fracCross.message));
  var fracDec = askAt(engine, "stat-rel-2", 0, "10/N=0.4");
  add(fracDec.ok && fracDec.progress.solve.phase === "proportion"
    ? { ok: true, id: "rel2-decimal" }
    : fail("rel2-decimal", JSON.stringify(fracDec.progress && fracDec.progress.solve) + " " + fracDec.message));
  var skipN = askAt(engine, "stat-rel-2", 0, "25");
  add(skipN.ok && skipN.view.part.label === "ב" && skipN.progress.solve.total === 25 && tableCell(skipN.view, 8).expr === "x"
    ? { ok: true, id: "rel2-skip-n" }
    : fail("rel2-skip-n", JSON.stringify(skipN.view && skipN.view.part) + " " + JSON.stringify(skipN.progress && skipN.progress.solve)));
  var afterN = askAt(engine, "stat-rel-2", 0, "", skipN.progress, "step");
  add(afterN.shows[0] === "2 + 8 + x + 10 = 25" && afterN.shows[0].indexOf("10/N") < 0
    ? { ok: true, id: "rel2-after-n-no-prop" }
    : fail("rel2-after-n-no-prop", JSON.stringify(afterN.shows)));
  var skipX = askAt(engine, "stat-rel-2", 0, "5", skipN.progress);
  add(skipX.ok && skipX.progress.solve.missing === 5 && tableCell(skipX.view, 8).freq === 5 && skipX.shows[0] === "x = 5"
    ? { ok: true, id: "rel2-skip-x" }
    : fail("rel2-skip-x", JSON.stringify(skipX.shows) + " " + JSON.stringify(tableCell(skipX.view, 8))));

  var pctProp = askAt(engine, "stat-rel-2", 1, "6/N=20/100");
  add(pctProp.ok && pctProp.shows[0] === "6/N = 20/100"
    ? { ok: true, id: "rel2-percent-prop" }
    : fail("rel2-percent-prop", JSON.stringify(pctProp.shows) + " " + pctProp.message));
  var pctDec = askAt(engine, "stat-rel-2", 1, "6/N=0.2");
  add(pctDec.ok ? { ok: true, id: "rel2-percent-decimal" } : fail("rel2-percent-decimal", pctDec.message));
  var pctAs20 = askAt(engine, "stat-rel-2", 1, "6/N=20");
  add(!pctAs20.ok && pctAs20.message.indexOf("20/100") >= 0 ? { ok: true, id: "rel2-percent-raw" } : fail("rel2-percent-raw", pctAs20.message));

  var expressed = askAt(engine, "stat-rel-2", 0, "N=x+20");
  var expressedStep = askAt(engine, "stat-rel-2", 0, "", expressed.progress, "step");
  add(expressed.ok && expressedStep.shows[0] === "10/(x+20) = 2/5"
    ? { ok: true, id: "rel2-expressed-continues" }
    : fail("rel2-expressed-continues", JSON.stringify(expressedStep.shows) + " " + expressedStep.message));
  var bridge = askAt(engine, "stat-rel-2", 0, "", expressedStep.progress, "step");
  add(bridge.ok && /2\s*\(\s*x\s*\+\s*20\s*\)/.test(String(bridge.shows[0] || "").replace(/·/g, ""))
    ? { ok: true, id: "rel2-bridge" }
    : fail("rel2-bridge", JSON.stringify(bridge.shows)));
  var taught = askAt(engine, "stat-rel-2", 0, "", bridge.progress, "step");
  var taughtNext = askAt(engine, "stat-rel-2", 0, "", taught.progress, "step");
  add(taught.ok && taughtNext.ok && String(taughtNext.shows[0] || "").indexOf("2x") >= 0
    ? { ok: true, id: "rel2-equation-engine" }
    : fail("rel2-equation-engine", JSON.stringify(taught.shows) + " | " + JSON.stringify(taughtNext.shows)));
  var directEq = askAt(engine, "stat-rel-2", 0, "2(x+20)=50");
  add(directEq.ok && directEq.progress.solve.equation
    ? { ok: true, id: "rel2-direct-equation" }
    : fail("rel2-direct-equation", JSON.stringify(directEq.progress && directEq.progress.solve) + " " + directEq.message));
  var solvedEq = askAt(engine, "stat-rel-2", 0, "x=5", directEq.progress);
  add(solvedEq.ok && solvedEq.progress.solve.missing === 5 && solvedEq.view.part.label === "א"
    ? { ok: true, id: "rel2-equation-back" }
    : fail("rel2-equation-back", JSON.stringify(solvedEq.view && solvedEq.view.part) + " " + JSON.stringify(solvedEq.progress && solvedEq.progress.solve)));

  var badNumerator = askAt(engine, "stat-rel-2", 0, "7/N=2/5");
  add(!badNumerator.ok && badNumerator.message.indexOf("השכיחות") >= 0 ? { ok: true, id: "rel2-value-numerator" } : fail("rel2-value-numerator", badNumerator.message));
  var badDen = askAt(engine, "stat-rel-2", 0, "10/x=2/5");
  add(!badDen.ok && badDen.message.indexOf("x") >= 0 && badDen.message.indexOf("כבר") >= 0 ? { ok: true, id: "rel2-x-denominator" } : fail("rel2-x-denominator", badDen.message));
  var flipped = askAt(engine, "stat-rel-2", 0, "N/10=2/5");
  add(!flipped.ok && flipped.message.indexOf("לא להפך") >= 0 ? { ok: true, id: "rel2-inverted-ratio" } : fail("rel2-inverted-ratio", flipped.message));
  var flippedFrac = askAt(engine, "stat-rel-2", 0, "10/N=5/2");
  add(!flippedFrac.ok && flippedFrac.message.indexOf("הפוך") >= 0 ? { ok: true, id: "rel2-inverted-fraction" } : fail("rel2-inverted-fraction", flippedFrac.message));
  var forgotX = askAt(engine, "stat-rel-2", 0, "10+8+2=25");
  add(!forgotX.ok && forgotX.message.indexOf("x") >= 0 ? { ok: true, id: "rel2-forgot-x" } : fail("rel2-forgot-x", forgotX.message));
  var omittedFreq = askAt(engine, "stat-rel-2", 0, "x=25-18");
  add(!omittedFreq.ok && omittedFreq.message.indexOf("חסרה") >= 0 ? { ok: true, id: "rel2-omitted-freq" } : fail("rel2-omitted-freq", omittedFreq.message));
  var valueSum = askAt(engine, "stat-rel-2", 0, "7+8+9+10");
  add(!valueSum.ok && valueSum.message.indexOf("ערכי המשתנה") >= 0 ? { ok: true, id: "rel2-value-sum" } : fail("rel2-value-sum", valueSum.message));

  var site = shows(askAt(engine, "stat-rel-2", 0, "", {}, "solution"));
  add(site[0] === "10/N = 2/5" && site.indexOf("N = 25") >= 0 && site.indexOf("x = 5") >= 0
    ? { ok: true, id: "rel2-site-solution" }
    : fail("rel2-site-solution", site.join(" | ")));
  var site16 = shows(askAt(engine, "stat-rel-2", 1, "", {}, "solution"));
  add(site16[0] === "20/100 = 6/N" && site16.indexOf("N = 30") >= 0 && site16.indexOf("x = 7") >= 0 && site16.indexOf("5/30") >= 0
    ? { ok: true, id: "rel2-percent-solution" }
    : fail("rel2-percent-solution", site16.join(" | ")));

  var later = askAt(engine, "stat-rel-2", 1, "1/6", { done: { n: true, x: true }, solve: {} });
  add(later.ok && later.view.solved && later.progress.solve.missing === 7
    ? { ok: true, id: "rel2-later-without-solve" }
    : fail("rel2-later-without-solve", JSON.stringify(later.view && later.view.part) + " " + later.message + " " + JSON.stringify(later.progress && later.progress.solve)));
  var laterDen = askAt(engine, "stat-rel-2", 1, "5/7", { done: { n: true, x: true }, solve: { total: 30, missing: 7 } });
  add(!laterDen.ok && laterDen.message.indexOf("המכנה") >= 0 ? { ok: true, id: "rel2-later-x-den" } : fail("rel2-later-x-den", laterDen.message));
  var laterStep = askAt(engine, "stat-rel-2", 1, "", { done: { n: true, x: true }, solve: { total: 30, missing: 7 } }, "step");
  add(laterStep.shows[0] === "5/30"
    ? { ok: true, id: "rel2-later-step-uses-n" }
    : fail("rel2-later-step-uses-n", JSON.stringify(laterStep.shows)));

  var families = shows(askAt(engine, "stat-rel-2", 2, "", {}, "solution"));
  add(families.indexOf("N = 20") >= 0 && families.indexOf("x = 7") >= 0 && families.indexOf("50%") >= 0 && families.indexOf("15%") >= 0
    ? { ok: true, id: "rel2-condition-solution" }
    : fail("rel2-condition-solution", families.join(" | ")));
  var boundary = askAt(engine, "stat-rel-2", 2, "17/20", { done: { n: true, x: true }, solve: { total: 20, missing: 7 } });
  add(!boundary.ok && boundary.message.indexOf("יותר מ") >= 0 ? { ok: true, id: "rel2-boundary" } : fail("rel2-boundary", boundary.message));
  var directPct = askAt(engine, "stat-rel-2", 2, "50%", { done: { n: true, x: true }, solve: {} });
  add(directPct.ok && directPct.view.part.label === "ד"
    ? { ok: true, id: "rel2-condition-direct" }
    : fail("rel2-condition-direct", JSON.stringify(directPct.view && directPct.view.part) + " " + directPct.message));
  var complement = askAt(engine, "stat-rel-2", 2, "17/20", { done: { n: true, x: true, more: true }, got: { more: { percent: "50%" } }, solve: { total: 20, missing: 7 } });
  add(complement.ok ? { ok: true, id: "rel2-complement" } : fail("rel2-complement", complement.message));

  ["y", "a", "t", "n"].forEach(function (letter) {
    var named = askAt(engine, "stat-rel-2", 0, "2/5=10/" + letter);
    var namedOk = named.ok && named.progress.solve.totalSymbol === letter && named.progress.solve.total == null;
    add(namedOk ? { ok: true, id: "rel2-letter-" + letter } : fail("rel2-letter-" + letter, JSON.stringify(named.progress && named.progress.solve) + " " + named.message));
  });
  var yStep = askAt(engine, "stat-rel-2", 0, "", askAt(engine, "stat-rel-2", 0, "2/5=10/y").progress, "step");
  add(yStep.ok && String(yStep.shows[0] || "").indexOf("y") >= 0 && String(yStep.shows[0] || "").indexOf("N") < 0
    ? { ok: true, id: "rel2-letter-continues" }
    : fail("rel2-letter-continues", JSON.stringify(yStep.shows)));
  var yValue = askAt(engine, "stat-rel-2", 0, "y=25", askAt(engine, "stat-rel-2", 0, "10/y=2/5").progress);
  add(yValue.ok && yValue.progress.solve.total === 25 && yValue.progress.solve.totalSymbol === "y" && String(yValue.shows[0] || "").indexOf("y") >= 0
    ? { ok: true, id: "rel2-letter-value" }
    : fail("rel2-letter-value", JSON.stringify(yValue.shows) + " " + JSON.stringify(yValue.progress && yValue.progress.solve) + " " + yValue.message));
  var bareTotal = askAt(engine, "stat-rel-2", 0, "25");
  add(bareTotal.ok && bareTotal.progress.solve.total === 25 && !bareTotal.progress.solve.totalSymbol
    ? { ok: true, id: "rel2-total-without-symbol" }
    : fail("rel2-total-without-symbol", JSON.stringify(bareTotal.progress && bareTotal.progress.solve)));

  ["10/x=2/5", "x=25", "2*x=50"].forEach(function (typed) {
    var owned = askAt(engine, "stat-rel-2", 0, typed);
    add(!owned.ok && owned.message.indexOf("x") >= 0 && owned.message.indexOf("כבר") >= 0
      ? { ok: true, id: "rel2-owned-" + typed }
      : fail("rel2-owned-" + typed, owned.message));
  });
  var yThenA = askAt(engine, "stat-rel-2", 0, "10/a=2/5", askAt(engine, "stat-rel-2", 0, "10/y=2/5").progress);
  add(!yThenA.ok && yThenA.message.indexOf("y") >= 0 && yThenA.message.indexOf("כבר") >= 0
    ? { ok: true, id: "rel2-symbol-clash" }
    : fail("rel2-symbol-clash", yThenA.message));

  ["2/5=10/(20+x)", "10/(x+20)=2/5", "2/5=10/(2+8+x+10)"].forEach(function (typed) {
    var expr = askAt(engine, "stat-rel-2", 0, typed);
    add(expr.ok && expr.progress.solve.equation && expr.progress.solve.missing == null
      ? { ok: true, id: "rel2-expr-" + typed }
      : fail("rel2-expr-" + typed, JSON.stringify(expr.progress && expr.progress.solve) + " " + expr.message));
  });
  var exprStep = askAt(engine, "stat-rel-2", 0, "", askAt(engine, "stat-rel-2", 0, "2/5=10/(20+x)").progress, "step");
  add(exprStep.ok && String(exprStep.shows[0] || "").indexOf("x") >= 0 && String(exprStep.shows[0] || "").indexOf("N") < 0
    ? { ok: true, id: "rel2-expr-continues" }
    : fail("rel2-expr-continues", JSON.stringify(exprStep.shows)));

  var viaX = askAt(engine, "stat-rel-2", 0, "2/5=10/(20+x)");
  var viaGuard = 0;
  while (viaX.progress.solve.missing == null && viaGuard < 12) {
    viaGuard += 1;
    viaX = askAt(engine, "stat-rel-2", 0, "", viaX.progress, "step");
  }
  var plugged = askAt(engine, "stat-rel-2", 0, "", viaX.progress, "step");
  add(viaX.progress.solve.missing === 5 && !viaX.progress.solve.equation && String(plugged.shows[0] || "").indexOf("20") >= 0 && String(plugged.shows[0] || "").indexOf("x") >= 0
    ? { ok: true, id: "rel2-x-then-total" }
    : fail("rel2-x-then-total", JSON.stringify(viaX.progress.solve) + " | " + JSON.stringify(plugged.shows)));

  var fullEq = askAt(engine, "stat-rel-2", 0, "2+8+x+10=25", skipN.progress);
  var fullNext = askAt(engine, "stat-rel-2", 0, "", fullEq.progress, "step");
  add(fullEq.ok && fullNext.ok && String(fullNext.shows[0] || "") !== "2 + 8 + x + 10 = 25"
    ? { ok: true, id: "rel2-full-sum-equation" }
    : fail("rel2-full-sum-equation", JSON.stringify(fullEq.progress && fullEq.progress.solve) + " | " + JSON.stringify(fullNext.shows) + " " + fullEq.message));
  var combined = askAt(engine, "stat-rel-2", 0, "x+20=25", skipN.progress);
  var combinedNext = askAt(engine, "stat-rel-2", 0, "", combined.progress, "step");
  add(combined.ok && String(combinedNext.shows[0] || "").indexOf("2 + 8 + x + 10") < 0
    ? { ok: true, id: "rel2-combined-equation" }
    : fail("rel2-combined-equation", JSON.stringify(combinedNext.shows) + " " + combined.message));
  var knownOnly = askAt(engine, "stat-rel-2", 0, "2+8+10", skipN.progress);
  var subtractNext = askAt(engine, "stat-rel-2", 0, "", knownOnly.progress, "step");
  add(knownOnly.ok && subtractNext.shows[0] === "x = 25 - 20"
    ? { ok: true, id: "rel2-subtract-path" }
    : fail("rel2-subtract-path", JSON.stringify(subtractNext.shows) + " " + knownOnly.message));
  var diff = askAt(engine, "stat-rel-2", 0, "25-20=5", skipN.progress);
  add(diff.ok && diff.progress.solve.missing === 5
    ? { ok: true, id: "rel2-subtract-result" }
    : fail("rel2-subtract-result", JSON.stringify(diff.progress && diff.progress.solve) + " " + diff.message));

  var startHint = askAt(engine, "stat-rel-2", 0, "", {}, "hint");
  add(startHint.message.indexOf("הציון 7") >= 0 && startHint.message.indexOf("ובשכיחות היחסית הנתונה") >= 0
    ? { ok: true, id: "rel2-hint-start" }
    : fail("rel2-hint-start", startHint.message));
  var sumHint = askAt(engine, "stat-rel-2", 0, "", skipN.progress, "hint");
  add(sumHint.message.indexOf("סכום כל השכיחויות") >= 0 && sumHint.message.indexOf("20") < 0 && sumHint.message.indexOf("5") < 0
    ? { ok: true, id: "rel2-hint-sum" }
    : fail("rel2-hint-sum", sumHint.message));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-relative: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log("FAIL " + item.id + " " + item.detail); });
  if (failed.length) process.exit(1);
}

main();
