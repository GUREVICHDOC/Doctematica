"use strict";

var loadEngine = require("./load-engine").loadEngine;
var studentDto = require("./student-dto");
var freq = require("./freq-table");
var mean = require("./mean");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function ask(engine, exerciseId, intent, extra) {
  var body = {
    levelId: "stat-mean-1",
    exerciseId: exerciseId,
    intent: intent || "check",
    progress: extra && extra.progress ? extra.progress : {},
    typed: extra && extra.typed,
  };
  return freq.handle(engine, body);
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) {
    checks.push(result);
  }
  var level = (engine.DoctematicaCurriculum.levels || []).filter(function (item) { return item.id === "stat-mean-1"; })[0];
  add(level && level.subtopic === "mean" && level.mode === "mean" && level.title === "ממוצע מרשימה – רמה 1" && level.exercises.length === 4 && level.exercises[3].id === "stat-mean-1-ex-a004" && level.exercises[3].parts[0].label === "ב"
    ? { ok: true, id: "mean-page" }
    : fail("mean-page", JSON.stringify(level && { n: level && level.exercises.length, title: level.title, first: level.exercises[3] && level.exercises[3].parts[0].label })));
  add(level.exercises[3].parts[0].text.indexOf("הסבירו") < 0 && level.exercises[3].parts.length === 2
    ? { ok: true, id: "mean-skip-explain" }
    : fail("mean-skip-explain", level.exercises[3].parts.map(function (part) { return part.label; }).join(",")));

  var opened = studentDto.openProblem(engine, "stat-mean-1", 0);
  add(opened && opened.problem.mode === "freq-table" && opened.view && opened.view.list === "plain" && opened.view.keys === "mean" && opened.view.data.join(",") === "6,6,7,8,8"
    ? { ok: true, id: "mean-open" }
    : fail("mean-open", JSON.stringify(opened && opened.view && { list: opened.view.list, keys: opened.view.keys, data: opened.view.data })));
  add(!JSON.stringify(opened).includes("\"kind\"")
    ? { ok: true, id: "mean-hides-tasks" }
    : fail("mean-hides-tasks", ""));

  var bar = "x\u0304";
  var html = engine.DoctematicaMath.toHTML(bar + "=(6+6+7+8+8)/5");
  add(html.indexOf("m-bar") >= 0 && html.indexOf("m-frac") >= 0
    ? { ok: true, id: "mean-bar-html" }
    : fail("mean-bar-html", html));

  var direct = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "7" });
  add(direct.status === "solved" && direct.shows[0] === bar + "=7"
    ? { ok: true, id: "mean-direct" }
    : fail("mean-direct", direct.message + " " + JSON.stringify(direct.shows)));

  var withBar = ask(engine, "stat-mean-1-ex-a001", "check", { typed: bar + "=7" });
  add(withBar.status === "solved" ? { ok: true, id: "mean-bar-optional" } : fail("mean-bar-optional", withBar.message));

  var word = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "ממוצע = 7" });
  add(word.status === "solved" ? { ok: true, id: "mean-word" } : fail("mean-word", word.message));

  var frac = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "(8+8+7+6+6)/5" });
  add(frac.status === "step" && frac.shows[0] === bar + "=(6+6+7+8+8)/5" && frac.progress.mean.mean.formula
    ? { ok: true, id: "mean-fraction-step" }
    : fail("mean-fraction-step", frac.message + " " + JSON.stringify(frac.shows)));
  var afterFrac = ask(engine, "stat-mean-1-ex-a001", "step", { progress: frac.progress });
  add(afterFrac.shows[0] === bar + "=35/5"
    ? { ok: true, id: "mean-after-fraction" }
    : fail("mean-after-fraction", JSON.stringify(afterFrac.shows)));

  var summed = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "8+6+7+8+6=35" });
  add(summed.status === "step" && summed.progress.mean.mean.sum === 35
    ? { ok: true, id: "mean-sum-order" }
    : fail("mean-sum-order", summed.message + " " + JSON.stringify(summed.progress.mean)));
  var afterSum = ask(engine, "stat-mean-1-ex-a001", "step", { progress: summed.progress });
  add(afterSum.shows[0] === bar + "=35/5" && afterSum.shows[0].indexOf("6+6+7") < 0
    ? { ok: true, id: "mean-after-sum" }
    : fail("mean-after-sum", JSON.stringify(afterSum.shows)));
  var finish = ask(engine, "stat-mean-1-ex-a001", "step", { progress: afterSum.progress });
  add(finish.status === "solved" && finish.shows[0] === bar + "=7"
    ? { ok: true, id: "mean-after-quotient" }
    : fail("mean-after-quotient", finish.message + " " + JSON.stringify(finish.shows)));

  var oneLine = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "(6+6+7+8+8)/5=7" });
  add(oneLine.status === "solved" ? { ok: true, id: "mean-one-line" } : fail("mean-one-line", oneLine.message));
  var chain = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "(6+6+7+8+8)/5=35/5=7" });
  add(chain.status === "solved" ? { ok: true, id: "mean-chain" } : fail("mean-chain", chain.message));
  var grouped = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "(8+8)+(7)+(6+6)=35" });
  add(grouped.status === "step" ? { ok: true, id: "mean-grouped" } : fail("mean-grouped", grouped.message));
  var leadFrac = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "=35/5" });
  add(leadFrac.ok && leadFrac.status === "step" && leadFrac.shows[0].indexOf("35/5") >= 0
    ? { ok: true, id: "mean-leading-equals-frac" }
    : fail("mean-leading-equals-frac", leadFrac.message + " " + (leadFrac.shows || []).join("|")));
  var leadAnswer = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "=7" });
  add(leadAnswer.ok && leadAnswer.status === "solved"
    ? { ok: true, id: "mean-leading-equals-answer" }
    : fail("mean-leading-equals-answer", leadAnswer.status + " " + leadAnswer.message));
  var trailFrac = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "35/5=" });
  add(trailFrac.ok && trailFrac.status === "step"
    ? { ok: true, id: "mean-trailing-equals-frac" }
    : fail("mean-trailing-equals-frac", trailFrac.message));
  var partial = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "(12+15+8)/(5)" });
  add(partial.ok && partial.status === "step" && partial.shows[0].indexOf("12+15+8") >= 0 && partial.message.indexOf("אינו מופיע") < 0
    ? { ok: true, id: "mean-partial-sums" }
    : fail("mean-partial-sums", partial.message + " " + JSON.stringify(partial.shows)));
  var afterPartial = ask(engine, "stat-mean-1-ex-a001", "step", { progress: partial.progress });
  add(afterPartial.shows[0] === bar + "=35/5"
    ? { ok: true, id: "mean-partial-next" }
    : fail("mean-partial-next", JSON.stringify(afterPartial.shows)));
  var partialSum = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "12+15+8=35" });
  add(partialSum.ok && partialSum.progress.mean.mean.sum === 35
    ? { ok: true, id: "mean-partial-total" }
    : fail("mean-partial-total", partialSum.message));
  var partialWrong = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "12+15+8=36" });
  add(!partialWrong.ok && partialWrong.message.indexOf("הסכום שגוי") >= 0
    ? { ok: true, id: "mean-partial-arith" }
    : fail("mean-partial-arith", partialWrong.message));
  var partialMiss = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "12+15=27" });
  add(!partialMiss.ok && partialMiss.message.indexOf("חסר נתון") >= 0
    ? { ok: true, id: "mean-partial-omit" }
    : fail("mean-partial-omit", partialMiss.message));
  var notASum = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "9+26=35" });
  add(!notASum.ok && notASum.message.indexOf("אינו סכום") >= 0
    ? { ok: true, id: "mean-not-a-sum" }
    : fail("mean-not-a-sum", notASum.message));

  var hint0 = ask(engine, "stat-mean-1-ex-a001", "hint", {});
  add(hint0.message === "כדי לחשב ממוצע, חבר את כל הנתונים וחלק במספר הנתונים."
    ? { ok: true, id: "mean-hint-open" }
    : fail("mean-hint-open", hint0.message));
  var hint1 = ask(engine, "stat-mean-1-ex-a001", "hint", { progress: hint0.progress });
  add(hint1.message === "כמה נתונים יש ברשימה?"
    ? { ok: true, id: "mean-hint-count" }
    : fail("mean-hint-count", hint1.message));
  var hintSum = ask(engine, "stat-mean-1-ex-a001", "hint", { progress: summed.progress });
  add(hintSum.message === "כעת חלק את הסכום במספר הנתונים."
    ? { ok: true, id: "mean-hint-divide" }
    : fail("mean-hint-divide", hintSum.message));

  var badDiv = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "35/10" });
  add(badDiv.ok === false && badDiv.message.indexOf("מספר נתונים") >= 0
    ? { ok: true, id: "mean-wrong-divisor" }
    : fail("mean-wrong-divisor", badDiv.message));
  var off = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "35/4" });
  add(off.ok === false && off.message.indexOf("ספיר") >= 0
    ? { ok: true, id: "mean-count-off" }
    : fail("mean-count-off", off.message));
  var miss = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "6+6+7+8=27" });
  add(miss.ok === false && miss.message.indexOf("חסר נתון") >= 0
    ? { ok: true, id: "mean-omit" }
    : fail("mean-omit", miss.message));
  var twice = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "6+6+7+8+8+8=43" });
  add(twice.ok === false && twice.message.indexOf("פעמיים") >= 0
    ? { ok: true, id: "mean-twice" }
    : fail("mean-twice", twice.message));
  var arith = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "6+6+7+8+8=34" });
  add(arith.ok === false && arith.message.indexOf("הסכום שגוי") >= 0
    ? { ok: true, id: "mean-arith" }
    : fail("mean-arith", arith.message));
  var divWrong = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "35/5=8" });
  add(divWrong.ok === false && divWrong.message.indexOf("החילוק") >= 0
    ? { ok: true, id: "mean-bad-divide" }
    : fail("mean-bad-divide", divWrong.message));
  var early = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "6/5" });
  add(early.ok === false && early.message.indexOf("לפני שחיברתם") >= 0
    ? { ok: true, id: "mean-early-divide" }
    : fail("mean-early-divide", early.message));
  var sumAsMean = ask(engine, "stat-mean-1-ex-a001", "check", { typed: "35" });
  add(sumAsMean.ok === false && sumAsMean.message.indexOf("סכום") >= 0
    ? { ok: true, id: "mean-sum-as-answer" }
    : fail("mean-sum-as-answer", sumAsMean.message));

  var kilos = ask(engine, "stat-mean-1-ex-a002", "check", { typed: "9.4" });
  add(kilos.status === "solved" ? { ok: true, id: "mean-decimal" } : fail("mean-decimal", kilos.message));
  var kilosComma = ask(engine, "stat-mean-1-ex-a002", "check", { typed: "9,4 ק״ג" });
  add(kilosComma.status === "solved" ? { ok: true, id: "mean-decimal-comma" } : fail("mean-decimal-comma", kilosComma.message));
  var reduced = ask(engine, "stat-mean-1-ex-a002", "check", { typed: "47/5" });
  add(reduced.status === "solved" ? { ok: true, id: "mean-reduced" } : fail("mean-reduced", reduced.message));
  var unreduced = ask(engine, "stat-mean-1-ex-a002", "check", { typed: "94/10" });
  add(unreduced.status === "step" && unreduced.shows[0] === bar + "=94/10"
    ? { ok: true, id: "mean-unreduced-step" }
    : fail("mean-unreduced-step", unreduced.message + " " + JSON.stringify(unreduced.shows)));

  var variable = ask(engine, "stat-mean-1-ex-a003", "check", { typed: "איכותי" });
  add(variable.ok === false && variable.message.indexOf("כמותי") >= 0
    ? { ok: true, id: "mean-qualitative" }
    : fail("mean-qualitative", variable.message));
  var nameOnly = ask(engine, "stat-mean-1-ex-a003", "check", { typed: "הציון" });
  add(nameOnly.status === "step" && nameOnly.progress.mean.variable.named
    ? { ok: true, id: "mean-name" }
    : fail("mean-name", nameOnly.message));
  var both = ask(engine, "stat-mean-1-ex-a003", "check", { typed: "ציון כמותי" });
  add(both.status === "task" && both.view.part.label === "ב"
    ? { ok: true, id: "mean-variable-done" }
    : fail("mean-variable-done", both.status + " " + both.message + " " + (both.view && both.view.part && both.view.part.label)));
  var classMean = ask(engine, "stat-mean-1-ex-a003", "check", { typed: "85", progress: both.progress });
  add(classMean.view && classMean.view.part && classMean.view.part.label === "ג"
    ? { ok: true, id: "mean-class" }
    : fail("mean-class", classMean.message + " " + (classMean.view && classMean.view.part && classMean.view.part.label)));

  var topHint = ask(engine, "stat-mean-1-ex-a003", "hint", { progress: classMean.progress });
  add(topHint.message === "ראשית מצא את ארבעת הציונים הגבוהים ביותר."
    ? { ok: true, id: "mean-top-hint" }
    : fail("mean-top-hint", topHint.message + " part " + (topHint.view && topHint.view.part && topHint.view.part.label)));
  var notTop = ask(engine, "stat-mean-1-ex-a003", "check", { typed: "75+80+90+95=340", progress: classMean.progress });
  add(notTop.ok === false && notTop.message.indexOf("75") >= 0 && notTop.message.indexOf("גבוהים") >= 0
    ? { ok: true, id: "mean-not-top" }
    : fail("mean-not-top", notTop.message));
  var topDirect = ask(engine, "stat-mean-1-ex-a003", "check", { typed: "91.25", progress: classMean.progress });
  add(topDirect.status === "solved" && topDirect.shows[0] === bar + "=91.25"
    ? { ok: true, id: "mean-top-direct" }
    : fail("mean-top-direct", topDirect.message + " " + JSON.stringify(topDirect.shows)));
  var topStep = ask(engine, "stat-mean-1-ex-a003", "step", { progress: classMean.progress });
  add(topStep.shows[0] === "80, 90, 95, 100"
    ? { ok: true, id: "mean-top-pick" }
    : fail("mean-top-pick", JSON.stringify(topStep.shows)));

  var ages = ask(engine, "stat-mean-1-ex-a004", "check", { typed: "41" });
  add(ages.status === "task" && ages.view.ask.indexOf("כמה") >= 0
    ? { ok: true, id: "mean-ages" }
    : fail("mean-ages", ages.message + " " + (ages.view && ages.view.ask)));
  var ageStep = ask(engine, "stat-mean-1-ex-a004", "step", { progress: ages.progress });
  add(ageStep.shows[0] === "38, 37, 35, 27, 32" && ageStep.shows[0].indexOf("410") < 0
    ? { ok: true, id: "mean-below-list" }
    : fail("mean-below-list", JSON.stringify(ageStep.shows)));
  var ageCount = ask(engine, "stat-mean-1-ex-a004", "check", { typed: "5", progress: ageStep.progress });
  add(ageCount.status === "task" && ageCount.view.ask.indexOf("הממוצע") >= 0
    ? { ok: true, id: "mean-below-count" }
    : fail("mean-below-count", ageCount.message + " " + (ageCount.view && ageCount.view.ask)));
  var ageMeanStep = ask(engine, "stat-mean-1-ex-a004", "step", { progress: ageCount.progress });
  add(ageMeanStep.shows[0] === bar + "=(38+37+35+27+32)/5" && ageMeanStep.shows[0].indexOf("48") < 0
    ? { ok: true, id: "mean-below-reuses" }
    : fail("mean-below-reuses", JSON.stringify(ageMeanStep.shows)));
  var ageAnswer = ask(engine, "stat-mean-1-ex-a004", "check", { typed: "33.8", progress: ageCount.progress });
  add(ageAnswer.status === "solved"
    ? { ok: true, id: "mean-below-answer" }
    : fail("mean-below-answer", ageAnswer.message));
  var includeEqual = mean.checkMeanText({
    kind: "mean",
    of: "mean",
    source: { type: "list", values: [1, 2, 3] },
    select: { type: "compare", op: "<", against: "mean" },
  }, "1+2=3");
  add(includeEqual.ok === false && includeEqual.message.indexOf("שווה לממוצע") >= 0
    ? { ok: true, id: "mean-exclude-equal" }
    : fail("mean-exclude-equal", includeEqual.message));
  var countEqual = mean.checkMeanText({
    kind: "mean",
    of: "count",
    source: { type: "list", values: [1, 2, 3] },
    select: { type: "compare", op: "<", against: "mean" },
  }, "2");
  add(countEqual.ok === false && countEqual.message.indexOf("שווה לממוצע") >= 0
    ? { ok: true, id: "mean-count-equal" }
    : fail("mean-count-equal", countEqual.message));

  var weighted = mean.measure(mean.observations({
    type: "frequency",
    rows: [{ value: 2, freq: 3 }, { value: 5, freq: 1 }],
  }));
  add(weighted.sum === 11 && weighted.count === 4 && weighted.rational.n === 11 && weighted.rational.d === 4
    ? { ok: true, id: "mean-from-frequency" }
    : fail("mean-from-frequency", JSON.stringify(weighted)));

  function tableAsk(exerciseId, intent, extra) {
    return freq.handle(engine, {
      levelId: "stat-mean-table-1",
      exerciseId: exerciseId,
      intent: intent || "check",
      progress: extra && extra.progress ? extra.progress : {},
      typed: extra && extra.typed,
      fill: extra && extra.fill,
    });
  }
  function showText(res) {
    return (res && res.shows || []).join(" | ");
  }
  var tableLevel = (engine.DoctematicaCurriculum.levels || []).filter(function (item) { return item.id === "stat-mean-table-1"; })[0];
  add(tableLevel && tableLevel.mode === "freq-table" && tableLevel.subtopic === "mean" && tableLevel.title === "ממוצע מתוך טבלה – רמה 1" && tableLevel.exercises.length === 7
    ? { ok: true, id: "mean-table-page" }
    : fail("mean-table-page", JSON.stringify(tableLevel && { mode: tableLevel.mode, n: tableLevel.exercises.length, title: tableLevel.title })));
  var openedTable = studentDto.openProblem(engine, "stat-mean-table-1", 0);
  add(openedTable && openedTable.problem.table && openedTable.problem.table.rows[0].value === 5 && openedTable.problem.table.rows[0].freq === 4 && openedTable.view.keys === "mean" && openedTable.view.ask.indexOf("שכיחות") >= 0
    ? { ok: true, id: "mean-table-open" }
    : fail("mean-table-open", JSON.stringify(openedTable && openedTable.view && { keys: openedTable.view.keys, ask: openedTable.view.ask, row: openedTable.problem && openedTable.problem.table && openedTable.problem.table.rows[0] })));

  var identified = tableAsk("stat-mean-table-1-ex-a001", "check", { typed: "מספר התלמידים" });
  add(identified.status === "task" && identified.progress.done.freq && identified.view.ask.indexOf("מספר התלמידים") >= 0
    ? { ok: true, id: "mean-table-identify" }
    : fail("mean-table-identify", identified.message + " " + (identified.view && identified.view.ask)));
  var counted = tableAsk("stat-mean-table-1-ex-a001", "check", { typed: "40", progress: identified.progress });
  add(counted.status === "task" && counted.progress.done.total && counted.progress.solve.total === 40 && counted.view.part.label === "ג"
    ? { ok: true, id: "mean-table-total" }
    : fail("mean-table-total", JSON.stringify({ status: counted.status, total: counted.progress && counted.progress.solve && counted.progress.solve.total, ask: counted.view && counted.view.ask })));
  var reuse = tableAsk("stat-mean-table-1-ex-a001", "step", { progress: counted.progress });
  add(reuse.status === "step" && showText(reuse).indexOf("/40") >= 0 && showText(reuse).indexOf("4+7+18+7+4") < 0 && showText(reuse).indexOf("5·4") >= 0
    ? { ok: true, id: "mean-table-reuse-total" }
    : fail("mean-table-reuse-total", showText(reuse)));
  var hintReuse = tableAsk("stat-mean-table-1-ex-a001", "hint", { progress: counted.progress });
  add(hintReuse.message === "מספר הנתונים כבר ידוע. כעת חשב את סכום ערך × שכיחות."
    ? { ok: true, id: "mean-table-hint-known-total" }
    : fail("mean-table-hint-known-total", hintReuse.message));
  var hintFresh = tableAsk("stat-mean-table-1-ex-a003", "hint");
  add(hintFresh.message === "כל ערך מופיע מספר פעמים לפי השכיחות שלו. כפל כל ערך בשכיחות המתאימה לו."
    ? { ok: true, id: "mean-table-hint-start" }
    : fail("mean-table-hint-start", hintFresh.message));
  var skipAnswer = tableAsk("stat-mean-table-1-ex-a001", "check", { typed: "7", progress: counted.progress });
  add(skipAnswer.status === "solved" && showText(skipAnswer).indexOf("7") >= 0
    ? { ok: true, id: "mean-table-skip-answer" }
    : fail("mean-table-skip-answer", skipAnswer.status + " " + showText(skipAnswer) + " " + skipAnswer.message));
  var quotient = tableAsk("stat-mean-table-1-ex-a001", "check", { typed: "280/40", progress: counted.progress });
  add(quotient.status === "step" && quotient.progress.weighted && quotient.progress.weighted.mean && quotient.progress.weighted.mean.weightedSum === 280 && quotient.progress.weighted.mean.totalFrequency === 40
    ? { ok: true, id: "mean-table-quotient" }
    : fail("mean-table-quotient", quotient.status + " " + showText(quotient) + " " + JSON.stringify(quotient.progress && quotient.progress.weighted)));
  var afterQuotient = tableAsk("stat-mean-table-1-ex-a001", "step", { progress: quotient.progress });
  add(afterQuotient.status === "solved" && showText(afterQuotient).indexOf("280/40") < 0
    ? { ok: true, id: "mean-table-after-quotient" }
    : fail("mean-table-after-quotient", afterQuotient.status + " " + showText(afterQuotient)));
  var reduced = tableAsk("stat-mean-table-1-ex-a001", "check", { typed: "7/1", progress: counted.progress });
  add(reduced.status === "solved"
    ? { ok: true, id: "mean-table-reduced" }
    : fail("mean-table-reduced", reduced.status + " " + reduced.message));

  var boxes = "stat-mean-table-1-ex-a004";
  var numFirst = tableAsk(boxes, "check", { typed: "0*3+1*4+2*5+3*6+4*7=60" });
  add(numFirst.status === "step" && numFirst.progress.weighted.mean.weightedSum === 60 && numFirst.progress.weighted.mean.totalFrequency == null
    ? { ok: true, id: "mean-table-num-first" }
    : fail("mean-table-num-first", numFirst.status + " " + numFirst.message + " " + JSON.stringify(numFirst.progress && numFirst.progress.weighted)));
  var afterNum = tableAsk(boxes, "step", { progress: numFirst.progress });
  add(showText(afterNum).indexOf("3+4+5+6+7=25") >= 0 && showText(afterNum).indexOf("·") < 0
    ? { ok: true, id: "mean-table-num-then-den" }
    : fail("mean-table-num-then-den", showText(afterNum)));
  var hintNum = tableAsk(boxes, "hint", { progress: numFirst.progress });
  add(hintNum.message === "כעת מצא את מספר הנתונים הכולל על ידי חיבור השכיחויות."
    ? { ok: true, id: "mean-table-hint-den" }
    : fail("mean-table-hint-den", hintNum.message));
  var denFirst = tableAsk(boxes, "check", { typed: "3+4+5+6+7=25" });
  add(denFirst.status === "step" && denFirst.progress.weighted.mean.totalFrequency === 25 && denFirst.progress.weighted.mean.weightedSum == null
    ? { ok: true, id: "mean-table-den-first" }
    : fail("mean-table-den-first", denFirst.status + " " + denFirst.message + " " + JSON.stringify(denFirst.progress && denFirst.progress.weighted)));
  var afterDen = tableAsk(boxes, "step", { progress: denFirst.progress });
  add(showText(afterDen).indexOf("/25") >= 0 && showText(afterDen).indexOf("3+4+5+6+7") < 0
    ? { ok: true, id: "mean-table-den-then-num" }
    : fail("mean-table-den-then-num", showText(afterDen)));
  var hintDen = tableAsk(boxes, "hint", { progress: denFirst.progress });
  add(hintDen.message === "מספר הנתונים כבר ידוע. כעת חשב את סכום ערך × שכיחות."
    ? { ok: true, id: "mean-table-hint-num" }
    : fail("mean-table-hint-num", hintDen.message));
  var bothKnown = tableAsk(boxes, "check", { typed: "60", progress: denFirst.progress });
  var hintBoth = tableAsk(boxes, "hint", { progress: bothKnown.progress });
  add(bothKnown.progress.weighted.mean.weightedSum === 60 && hintBoth.message === "חלק את סכום ערך×שכיחות במספר הנתונים הכולל."
    ? { ok: true, id: "mean-table-hint-div" }
    : fail("mean-table-hint-div", hintBoth.message + " " + JSON.stringify(bothKnown.progress.weighted)));
  var afterFormula = tableAsk("stat-mean-table-1-ex-a001", "check", { typed: "5*4=20", progress: reuse.progress });
  var afterProduct = tableAsk("stat-mean-table-1-ex-a001", "step", { progress: afterFormula.progress });
  add(showText(afterProduct).indexOf("6·7=42") >= 0 && showText(afterProduct).indexOf("20+42") < 0
    ? { ok: true, id: "mean-table-next-product" }
    : fail("mean-table-next-product", showText(afterProduct)));
  var partial = tableAsk(boxes, "check", { typed: "1*4=4" });
  var partialNext = tableAsk(boxes, "check", { typed: "4+2*5+3*6+4*7", progress: partial.progress });
  add(partial.status === "step" && partialNext.ok && partialNext.progress.weighted.mean.knownProducts.length === 4
    ? { ok: true, id: "mean-table-partial" }
    : fail("mean-table-partial", partial.message + " | " + partialNext.message + " " + JSON.stringify(partialNext.progress && partialNext.progress.weighted)));
  var grouped = tableAsk("stat-mean-table-1-ex-a001", "check", { typed: "62+126+92=280", progress: counted.progress });
  add(grouped.ok && grouped.progress.weighted.mean.weightedSum === 280
    ? { ok: true, id: "mean-table-group" }
    : fail("mean-table-group", grouped.message + " " + JSON.stringify(grouped.progress && grouped.progress.weighted)));
  var oneLine = tableAsk(boxes, "check", { typed: "(0*3+1*4+2*5+3*6+4*7)/(3+4+5+6+7)=2.4" });
  add(oneLine.status === "solved"
    ? { ok: true, id: "mean-table-one-line" }
    : fail("mean-table-one-line", oneLine.status + " " + oneLine.message));
  var children = tableAsk("stat-mean-table-1-ex-a002", "check", { typed: "1.5", progress: { done: { freq: true } } });
  add(children.status === "solved"
    ? { ok: true, id: "mean-table-children" }
    : fail("mean-table-children", children.status + " " + children.message));
  var drivers = tableAsk("stat-mean-table-1-ex-a003", "check", { typed: "2.75" });
  add(drivers.status === "solved"
    ? { ok: true, id: "mean-table-drivers" }
    : fail("mean-table-drivers", drivers.status + " " + drivers.message));
  var boxesAnswer = tableAsk(boxes, "check", { typed: "2.4" });
  add(boxesAnswer.status === "solved"
    ? { ok: true, id: "mean-table-boxes" }
    : fail("mean-table-boxes", boxesAnswer.status + " " + boxesAnswer.message));
  var boxesLead = tableAsk(boxes, "check", { typed: "=60/25" });
  add(boxesLead.ok && boxesLead.status === "step"
    ? { ok: true, id: "mean-table-leading-equals" }
    : fail("mean-table-leading-equals", boxesLead.status + " " + boxesLead.message));

  function expectMiss(id, typed, text) {
    var res = tableAsk("stat-mean-table-1-ex-a001", "check", { typed: typed, progress: counted.progress });
    add(res.ok === false && res.message.indexOf(text) >= 0
      ? { ok: true, id: id }
      : fail(id, res.message));
  }
  expectMiss("mean-table-forget", "5+6+7+8+9", "לפי מספר הפעמים");
  expectMiss("mean-table-add", "5+4+6+7+7+18+8+7+9+4", "לא לחבר");
  expectMiss("mean-table-wrong-column", "5*7", "עמודה אחרת");
  expectMiss("mean-table-omit-column", "(5*4+6*7+7*18+8*7)/40", "חסרה עמודה");
  expectMiss("mean-table-omit-freq", "(5*4+6*7+7*18+8*7+9*4)/(4+7+18+7)", "חסרה שכיחות");
  expectMiss("mean-table-values-den", "280/(5+6+7+8+9)", "סכום ערכי המשתנה");
  expectMiss("mean-table-category", "280/5", "מספר הערכים השונים");
  expectMiss("mean-table-bad-den", "280/22", "המכנה שגוי");
  expectMiss("mean-table-bad-num", "100/40", "המונה שגוי");
  expectMiss("mean-table-swap", "40/280", "בין המונה למכנה");
  expectMiss("mean-table-product-sum", "5*4+6*7+7*18+8*7+9*4=270", "הסכום שלהן שגוי");
  expectMiss("mean-table-freq-sum", "4+7+18+7+4=41", "חיבור השכיחויות נכון");
  var shifted = tableAsk("stat-mean-table-1-ex-a002", "check", { typed: "0*2+1*5+2*7+3*8", progress: { done: { freq: true } } });
  add(shifted.ok === false && shifted.message.indexOf("הוזזה") >= 0
    ? { ok: true, id: "mean-table-shift" }
    : fail("mean-table-shift", shifted.message));
  var trap = tableAsk("stat-mean-table-1-ex-a002", "check", { typed: "6/4", progress: { done: { freq: true } } });
  add(trap.ok === false && trap.message.indexOf("לפי מספר הפעמים") >= 0
    ? { ok: true, id: "mean-table-trap" }
    : fail("mean-table-trap", trap.message));
  var solution = tableAsk("stat-mean-table-1-ex-a001", "solution", { progress: counted.progress });
  var meanLines = (solution.lines || []).filter(function (line) { return line.part === "ג"; }).map(function (line) { return line.show; });
  add(solution.status === "solved" && meanLines.length === 4 && meanLines[0].indexOf("/40") >= 0 && meanLines[0].indexOf("4+7+18") < 0 && meanLines[3].indexOf("7") >= 0
    ? { ok: true, id: "mean-table-solution" }
    : fail("mean-table-solution", meanLines.join(" || ")));

  var bikes = tableAsk("stat-mean-table-1-ex-a005", "check", { typed: "מספר זוגות אופניים" });
  bikes = tableAsk("stat-mean-table-1-ex-a005", "check", { typed: "מספר המשפחות", progress: bikes.progress });
  bikes = tableAsk("stat-mean-table-1-ex-a005", "check", { typed: "180", progress: bikes.progress });
  bikes = tableAsk("stat-mean-table-1-ex-a005", "check", { typed: "360", progress: bikes.progress });
  var bikeMean = tableAsk("stat-mean-table-1-ex-a005", "step", { progress: bikes.progress });
  add(bikeMean.shows[0] === bar + "=360/180"
    ? { ok: true, id: "mean-bikes-reuse" }
    : fail("mean-bikes-reuse", JSON.stringify(bikeMean.shows)));
  var bikeAnswer = tableAsk("stat-mean-table-1-ex-a005", "check", { typed: "2", progress: bikes.progress });
  add(bikeAnswer.status === "solved"
    ? { ok: true, id: "mean-bikes-answer" }
    : fail("mean-bikes-answer", bikeAnswer.message));

  var grades = tableAsk("stat-mean-table-1-ex-a006", "solution");
  var gradeLines = (grades.lines || []).map(function (line) { return line.show; });
  add(grades.status === "solved" && gradeLines.some(function (line) { return line.indexOf("7.2") >= 0; }) && gradeLines.some(function (line) { return line.indexOf("22/3") >= 0; })
    ? { ok: true, id: "mean-grades-join" }
    : fail("mean-grades-join", gradeLines.filter(function (line) { return line.indexOf(bar) === 0; }).join(" || ")));

  function unknownAsk(exerciseId, intent, extra) {
    return freq.handle(engine, {
      levelId: "stat-mean-unknown-1",
      exerciseId: exerciseId,
      intent: intent || "check",
      progress: extra && extra.progress ? extra.progress : {},
      typed: extra && extra.typed,
      fill: extra && extra.fill,
    });
  }
  var unknownLevel = (engine.DoctematicaCurriculum.levels || []).filter(function (item) { return item.id === "stat-mean-unknown-1"; })[0];
  add(unknownLevel && unknownLevel.subtopic === "mean" && unknownLevel.mode === "freq-table" && unknownLevel.exercises.length === 8
    ? { ok: true, id: "mean-unknown-page" }
    : fail("mean-unknown-page", JSON.stringify(unknownLevel && { n: unknownLevel.exercises.length, mode: unknownLevel.mode })));

  var wrongDen = unknownAsk("stat-mean-unknown-1-ex-a001", "check", { typed: "I" });
  var wrongNum = unknownAsk("stat-mean-unknown-1-ex-a001", "check", { typed: "III" });
  add(wrongDen.ok === false && wrongDen.message.indexOf("מכנה") >= 0 && wrongNum.ok === false && wrongNum.message.indexOf("מונה") >= 0
    ? { ok: true, id: "mean-unknown-choice-miss" }
    : fail("mean-unknown-choice-miss", wrongDen.message + " / " + wrongNum.message));
  var picked = unknownAsk("stat-mean-unknown-1-ex-a001", "check", { typed: "II" });
  var afterPick = unknownAsk("stat-mean-unknown-1-ex-a001", "hint", { progress: picked.progress });
  add(picked.status === "task" && afterPick.message.indexOf("סכום הנתונים חלקי") < 0 && afterPick.message.indexOf("כפל") >= 0
    ? { ok: true, id: "mean-unknown-hint-follows-equation" }
    : fail("mean-unknown-hint-follows-equation", afterPick.message));
  var simplified = unknownAsk("stat-mean-unknown-1-ex-a001", "step", { progress: picked.progress });
  var solved = unknownAsk("stat-mean-unknown-1-ex-a001", "check", { typed: "x=170", progress: simplified.progress });
  add(simplified.status === "step" && solved.status === "solved"
    ? { ok: true, id: "mean-unknown-distance" }
    : fail("mean-unknown-distance", simplified.message + " " + solved.message));
  var freshHint = unknownAsk("stat-mean-unknown-1-ex-a002", "hint");
  add(freshHint.message.indexOf("השכיחות החסרה") >= 0
    ? { ok: true, id: "mean-unknown-freq-hint" }
    : fail("mean-unknown-freq-hint", freshHint.message));
  var bus = unknownAsk("stat-mean-unknown-1-ex-a002", "check", { typed: "(182000+400*x)/(700+x)=302" });
  var busBad = unknownAsk("stat-mean-unknown-1-ex-a002", "check", { typed: "182000+400*x=302*700", progress: bus.progress });
  var busDone = unknownAsk("stat-mean-unknown-1-ex-a002", "check", { typed: "300", progress: bus.progress });
  add(bus.status === "step" && busBad.ok === false && busDone.status === "solved"
    ? { ok: true, id: "mean-unknown-bus-paths" }
    : fail("mean-unknown-bus-paths", bus.message + " / " + busBad.message + " / " + busDone.message));
  var busStep = unknownAsk("stat-mean-unknown-1-ex-a002", "step");
  var busLines = [];
  var busGuard = 0;
  while (busStep.status === "step" && busGuard < 12) {
    busLines.push(String((busStep.shows && busStep.shows[0]) || ""));
    busStep = unknownAsk("stat-mean-unknown-1-ex-a002", "step", { progress: busStep.progress });
    busGuard += 1;
  }
  var summedAt = busLines.findIndex(function (line) {
    return line.indexOf("182000") >= 0 && line.indexOf("700") >= 0 && line.indexOf("/") >= 0;
  });
  var clearedAt = busLines.findIndex(function (line) {
    return line.indexOf("182000") >= 0 && line.indexOf("/") < 0;
  });
  add(summedAt >= 0 && clearedAt > summedAt && busLines[clearedAt].indexOf("700") >= 0 && busLines[clearedAt].indexOf("80") < 0
    ? { ok: true, id: "mean-unknown-bus-sum-before-clear" }
    : fail("mean-unknown-bus-sum-before-clear", busLines.join(" || ")));
  var salary = unknownAsk("stat-mean-unknown-1-ex-a003", "check", { typed: "7500+9300+4700+8400+5600=35500" });
  var salaryStep = unknownAsk("stat-mean-unknown-1-ex-a003", "step", { progress: salary.progress });
  var salaryDone = unknownAsk("stat-mean-unknown-1-ex-a003", "check", { typed: "(35500+x)/6=7000", progress: salary.progress });
  salaryDone = unknownAsk("stat-mean-unknown-1-ex-a003", "check", { typed: "x=6500", progress: salaryDone.progress });
  add(salaryStep.shows[0].indexOf("35500") >= 0 && salaryDone.status === "solved"
    ? { ok: true, id: "mean-unknown-salary" }
    : fail("mean-unknown-salary", JSON.stringify(salaryStep.shows) + " " + salaryDone.message));
  var song = unknownAsk("stat-mean-unknown-1-ex-a004", "check", { typed: "4" });
  add(song.status === "solved" ? { ok: true, id: "mean-unknown-song-skip" } : fail("mean-unknown-song-skip", song.message));
  var ages = unknownAsk("stat-mean-unknown-1-ex-a005", "check", { typed: "29.4" });
  ages = unknownAsk("stat-mean-unknown-1-ex-a005", "check", { typed: "27.5", progress: ages.progress });
  ages = unknownAsk("stat-mean-unknown-1-ex-a005", "check", { typed: "x=139/2", progress: ages.progress });
  add(ages.status === "solved" && ages.shows[0] === "x=69.5"
    ? { ok: true, id: "mean-unknown-ages" }
    : fail("mean-unknown-ages", ages.message + " " + JSON.stringify(ages.shows)));
  var hotel = unknownAsk("stat-mean-unknown-1-ex-a006", "check", { typed: "x=28" });
  var rooms = hotel.view && hotel.view.table && hotel.view.table.rows.filter(function (row) { return String(row.value) === "3"; })[0];
  hotel = unknownAsk("stat-mean-unknown-1-ex-a006", "check", { typed: "כן", progress: hotel.progress });
  add(rooms && rooms.freq === 28 && hotel.status === "solved"
    ? { ok: true, id: "mean-unknown-hotel" }
    : fail("mean-unknown-hotel", JSON.stringify(rooms) + " " + hotel.message));
  var kids = unknownAsk("stat-mean-unknown-1-ex-a007", "check", { typed: "2" });
  add(kids.ok === false
    ? { ok: true, id: "mean-unknown-choice-before-scale" }
    : fail("mean-unknown-choice-before-scale", kids.message));
  kids = unknownAsk("stat-mean-unknown-1-ex-a007", "check", { typed: "מספר הילדים במשפחה" });
  kids = unknownAsk("stat-mean-unknown-1-ex-a007", "check", { typed: "כמותי בדיד", progress: kids.progress });
  kids = unknownAsk("stat-mean-unknown-1-ex-a007", "check", { typed: "(4*3+3*x+2*8+1*10)/(21+x)=2", progress: kids.progress });
  kids = unknownAsk("stat-mean-unknown-1-ex-a007", "check", { typed: "x=4", progress: kids.progress });
  kids = unknownAsk("stat-mean-unknown-1-ex-a007", "check", { typed: "25", progress: kids.progress });
  kids = unknownAsk("stat-mean-unknown-1-ex-a007", "check", { typed: "12%", progress: kids.progress });
  add(kids.status === "solved"
    ? { ok: true, id: "mean-unknown-children" }
    : fail("mean-unknown-children", kids.message));
  var cell = tableAsk("stat-mean-table-1-ex-a007", "check", { typed: "מספר הילדים במשפחה" });
  cell = tableAsk("stat-mean-table-1-ex-a007", "check", { typed: "כמותי בדיד", progress: cell.progress });
  cell = tableAsk("stat-mean-table-1-ex-a007", "check", { typed: "כן", progress: cell.progress });
  cell = tableAsk("stat-mean-table-1-ex-a007", "check", { fill: { value: "4", typed: "10" }, progress: cell.progress });
  var familyMean = tableAsk("stat-mean-table-1-ex-a007", "check", { typed: "2.76", progress: cell.progress });
  var familyShift = tableAsk("stat-mean-table-1-ex-a007", "check", { typed: "עלה", progress: familyMean.progress });
  add(cell.shows[0] === "x=10" && familyMean.status === "task" && familyShift.status === "solved"
    ? { ok: true, id: "mean-family-cell" }
    : fail("mean-family-cell", cell.message + " / " + familyMean.message + " / " + familyShift.message));
  var busSolution = unknownAsk("stat-mean-unknown-1-ex-a002", "solution");
  var busShows = (busSolution.lines || []).map(function (line) { return line.show; });
  var fractionAt = busShows.findIndex(function (line) { return line.indexOf("29400") >= 0 && line.indexOf("98") >= 0; });
  var answerAt = busShows.findIndex(function (line) { return /x\s*=\s*300/.test(line); });
  add(busSolution.status === "solved" && fractionAt >= 0 && answerAt > fractionAt
    ? { ok: true, id: "mean-unknown-bus-compute" }
    : fail("mean-unknown-bus-compute", busShows.join(" || ")));
  var held = unknownAsk("stat-mean-unknown-1-ex-a002", "check", { typed: "x=29400/98" });
  add(held.status === "step" && held.shows[0].indexOf("29400") >= 0
    ? { ok: true, id: "mean-unknown-bus-unreduced" }
    : fail("mean-unknown-bus-unreduced", held.status + " " + JSON.stringify(held.shows)));
  var distanceSolution = unknownAsk("stat-mean-unknown-1-ex-a001", "solution");
  add(distanceSolution.status === "solved" && (distanceSolution.lines || []).some(function (line) { return line.show.indexOf("x = 170") >= 0 || line.show.indexOf("x=170") >= 0; })
    ? { ok: true, id: "mean-unknown-solution" }
    : fail("mean-unknown-solution", (distanceSolution.lines || []).map(function (line) { return line.show; }).join(" || ")));

  var Unknown = require("./mean-unknown");
  var valueTable = {
    rows: [
      { value: 1, num: 1, freq: 4, givenExpr: "" },
      { value: "x", num: null, freq: 3, givenExpr: "" },
    ],
  };
  var valueTask = { kind: "meanUnknown", mean: 4 };
  var valueModel = Unknown.modelOf(valueTable, valueTask);
  var valueOk = Unknown.check(engine, valueTable, valueTask, "(1*4+3*x)/7=4", { unknown: {} });
  var valueBad = Unknown.check(engine, valueTable, valueTask, "(1*4+3*x)/(4+x)=4", { unknown: {} });
  add(valueModel.role === "value" && valueOk.ok && valueBad.ok === false && valueBad.message.indexOf("לא שכיחות") >= 0
    ? { ok: true, id: "mean-unknown-value-role" }
    : fail("mean-unknown-value-role", valueModel && valueModel.role + " / " + (valueBad && valueBad.message)));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-mean: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log(item.id + ": " + item.detail); });
  if (failed.length) process.exit(1);
}

main();
