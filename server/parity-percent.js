"use strict";

var loadEngine = require("./load-engine").loadEngine;
var studentDto = require("./student-dto");
var percent = require("./percent");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) {
    checks.push(result);
  }

  var topics = (engine.DoctematicaProblems.topics || []).map(function (topic) { return topic.id; });
  add(topics.join(",") === "equations,quadratic,high-power,systems-sub,percents,analytic,statistics"
    ? { ok: true, id: "topic-order" }
    : fail("topic-order", topics.join(",")));
  var subs = engine.DoctematicaProblems.subtopics.percents || [];
  add(subs.length === 1 && subs[0].id === "find-part" && subs[0].label === "מציאת כמות עבור אחוז"
    ? { ok: true, id: "subtopic" }
    : fail("subtopic", JSON.stringify(subs)));

  var page = (engine.DoctematicaCurriculum.levels || []).filter(function (level) {
    return level.id === "pct-part-1";
  })[0];
  add(page && page.topic === "percents" && page.subtopic === "find-part" && page.mode === "percent" && page.title === "רמה 1"
    ? { ok: true, id: "level" }
    : fail("level", page && page.id));
  var expect = [
    ["pct-part-1-ex-a001", 50, 80, 40],
    ["pct-part-1-ex-a002", 10, 250, 25],
    ["pct-part-1-ex-a003", 80, 150, 120],
    ["pct-part-1-ex-a004", 45, 60, 27],
    ["pct-part-1-ex-a005", 78, 350, 273],
    ["pct-part-1-ex-a006", 3, 400, 12],
  ];
  add(page && page.exercises.length === 11 ? { ok: true, id: "eleven-exercises" } : fail("eleven-exercises", String(page && page.exercises.length)));
  expect.forEach(function (row, index) {
    var ex = page && page.exercises[index];
    var target = ex ? percent.targetOf(ex) : null;
    add(ex && ex.id === row[0] && ex.unknown === "part" && ex.percent === row[1] && ex.all === row[2] && Math.abs(target - row[3]) < 1e-6 && !(ex.parts && ex.parts.length)
      ? { ok: true, id: "ex-" + row[0] }
      : fail("ex-" + row[0], ex && ex.id));
  });

  var opened = studentDto.openProblem(engine, "pct-part-1", 0);
  var raw = JSON.stringify(opened);
  add(opened && opened.problem && opened.problem.mode === "percent" && opened.problem.exerciseId === "pct-part-1-ex-a001" && opened.problem.displayNumber === 1
    ? { ok: true, id: "open-first" }
    : fail("open-first", raw));
  add(raw.indexOf('"40"') < 0 && raw.indexOf(":40") < 0 &&
    raw.indexOf('"percent":') < 0 && raw.indexOf('"unknown":') < 0 && raw.indexOf('"all":') < 0 && raw.indexOf('"part":') < 0 && raw.indexOf('"answer":') < 0
    ? { ok: true, id: "open-hides-answer" }
    : fail("open-hides-answer", raw));
  add(opened.problem.stem.indexOf("50%") >= 0 && opened.problem.stem.indexOf("80") >= 0
    ? { ok: true, id: "stem-shows-givens" }
    : fail("stem-shows-givens", opened.problem.stem));

  function check(index, typed, progress) {
    return percent.handle(engine, {
      intent: "check",
      levelId: "pct-part-1",
      exerciseIndex: index,
      typed: typed,
      progress: progress || { step: "", done: false },
    });
  }

  expect.forEach(function (row, index) {
    var direct = check(index, String(row[3]));
    add(direct.ok && direct.view && direct.view.solved && direct.progress.done
      ? { ok: true, id: "direct-" + row[0] }
      : fail("direct-" + row[0], JSON.stringify(direct)));
  });

  var first = page.exercises[0];
  var proportion = check(0, "50/100 = x/80");
  add(proportion.ok && !proportion.view.solved && proportion.progress.step === "proportion"
    ? { ok: true, id: "proportion" }
    : fail("proportion", JSON.stringify(proportion)));
  var reversed = check(0, "x/80 = 50/100");
  add(reversed.ok && !reversed.view.solved && reversed.progress.step === "proportion"
    ? { ok: true, id: "proportion-reversed" }
    : fail("proportion-reversed", JSON.stringify(reversed)));
  var equivalent = check(0, "1/2 = x/80");
  add(equivalent.ok && equivalent.progress.step === "proportion"
    ? { ok: true, id: "equivalent-proportion" }
    : fail("equivalent-proportion", JSON.stringify(equivalent)));

  var frac = check(0, "(50/100)*80");
  add(frac.ok && !frac.view.solved && frac.progress.step === "expr"
    ? { ok: true, id: "fraction-times-whole" }
    : fail("fraction-times-whole", JSON.stringify(frac)));
  var swappedMul = check(0, "80*(50/100)");
  add(swappedMul.ok && swappedMul.progress.step === "expr"
    ? { ok: true, id: "swapped-multiply" }
    : fail("swapped-multiply", JSON.stringify(swappedMul)));
  var joined = check(0, "=40", { step: "expr", done: false });
  add(joined.ok && joined.view.solved && joined.joinPrev && joined.shows && joined.shows[0] === "40"
    ? { ok: true, id: "equals-joins" }
    : fail("equals-joins", JSON.stringify(joined)));
  var decimal = check(0, "0.5*80");
  add(decimal.ok && decimal.progress.step === "expr" && !decimal.view.solved
    ? { ok: true, id: "decimal" }
    : fail("decimal", JSON.stringify(decimal)));
  var comma = check(0, "0,5 · 80");
  add(comma.ok && comma.progress.step === "expr"
    ? { ok: true, id: "comma-decimal" }
    : fail("comma-decimal", JSON.stringify(comma)));
  var oneLine = check(0, "0.5*80=40");
  add(oneLine.ok && oneLine.view.solved
    ? { ok: true, id: "one-line-decimal" }
    : fail("one-line-decimal", JSON.stringify(oneLine)));
  var oneLineFrac = check(0, "(50/100)*80=40");
  add(oneLineFrac.ok && oneLineFrac.view.solved
    ? { ok: true, id: "one-line-fraction" }
    : fail("one-line-fraction", JSON.stringify(oneLineFrac)));
  var productOrder = check(0, "50*80/100");
  add(productOrder.ok && productOrder.progress.step === "expr" && !productOrder.view.solved
    ? { ok: true, id: "product-order" }
    : fail("product-order", JSON.stringify(productOrder)));

  var plain = check(0, "50*80");
  add(!plain.ok && plain.message.indexOf("מספר רגיל") >= 0
    ? { ok: true, id: "plain-percent" }
    : fail("plain-percent", plain && plain.message));
  var place = check(0, "0.05*80");
  add(!place.ok && place.message.indexOf("0.05") >= 0 && place.message.indexOf("0.5") >= 0
    ? { ok: true, id: "wrong-decimal" }
    : fail("wrong-decimal", place && place.message));
  var placeFrac = check(0, "5/100*80");
  add(!placeFrac.ok && placeFrac.message.indexOf("אינה במקום הנכון") >= 0
    ? { ok: true, id: "wrong-decimal-fraction" }
    : fail("wrong-decimal-fraction", placeFrac && placeFrac.message));
  var bareWrong = check(0, "4");
  add(!bareWrong.ok && bareWrong.message.indexOf("עשרוני") < 0 && bareWrong.message.indexOf("שקול") >= 0
    ? { ok: true, id: "bare-wrong-generic" }
    : fail("bare-wrong-generic", bareWrong && bareWrong.message));
  var forgot = check(0, "50/100");
  add(!forgot.ok && forgot.message.indexOf("חסר הכפל") >= 0
    ? { ok: true, id: "forgot-whole" }
    : fail("forgot-whole", forgot && forgot.message));
  var forgotDec = check(0, "0.5");
  add(!forgotDec.ok && forgotDec.message.indexOf("חסר הכפל") >= 0
    ? { ok: true, id: "forgot-whole-decimal" }
    : fail("forgot-whole-decimal", forgotDec && forgotDec.message));
  var swap = check(0, "50/100=80/x");
  add(!swap.ok && swap.message.indexOf("השלם") >= 0 && swap.message.indexOf("80") >= 0 && swap.message.indexOf("x") >= 0 && swap.message.indexOf("x/80") < 0
    ? { ok: true, id: "swapped-slots" }
    : fail("swapped-slots", swap && swap.message));
  var swapWrapped = check(1, "10/100=(250)/(x)");
  add(!swapWrapped.ok && swapWrapped.message.indexOf("השלם") >= 0 && swapWrapped.message.indexOf("250") >= 0 && swapWrapped.message.indexOf("x/250") < 0 && swapWrapped.message.indexOf("10/100 = x") < 0
    ? { ok: true, id: "swap-part-all-wrapped" }
    : fail("swap-part-all-wrapped", swapWrapped && swapWrapped.message));
  var swapPlain = check(1, "10/100=250/x");
  add(!swapPlain.ok && swapPlain.message === swapWrapped.message
    ? { ok: true, id: "swap-part-all-plain" }
    : fail("swap-part-all-plain", swapPlain && swapPlain.message));
  var swapBase = check(1, "100/10=x/250");
  add(!swapBase.ok && swapBase.message.indexOf("האחוז הנתון") >= 0 && swapBase.message.indexOf("100") >= 0 && swapBase.message.indexOf("x/250") < 0
    ? { ok: true, id: "swap-percent-base" }
    : fail("swap-percent-base", swapBase && swapBase.message));
  var inverted = check(1, "100/10=250/x");
  add(inverted.ok && inverted.progress.step === "proportion" && !inverted.view.solved
    ? { ok: true, id: "both-fractions-inverted" }
    : fail("both-fractions-inverted", JSON.stringify(inverted)));
  var swapMany = check(1, "250/10=x/100");
  add(!swapMany.ok && swapMany.message.indexOf("ערכים הנכונים") >= 0 && swapMany.message.indexOf("x/250") < 0
    ? { ok: true, id: "swap-many" }
    : fail("swap-many", swapMany && swapMany.message));
  var swapAmbiguous = check(1, "10/250=x/100");
  add(!swapAmbiguous.ok && swapAmbiguous.message.indexOf("ערכים הנכונים") >= 0
    ? { ok: true, id: "swap-ambiguous" }
    : fail("swap-ambiguous", swapAmbiguous && swapAmbiguous.message));
  var swapOther = check(2, "150/100=x/80");
  add(swapOther.ok && swapOther.progress.step === "proportion"
    ? { ok: true, id: "equivalent-compensating" }
    : fail("equivalent-compensating", JSON.stringify(swapOther)));
  var notGiven = check(1, "10/100=25/x");
  add(!notGiven.ok && notGiven.message.indexOf("השלם") < 0 && notGiven.message.indexOf("ערכים הנכונים") < 0
    ? { ok: true, id: "not-a-placement" }
    : fail("not-a-placement", notGiven && notGiven.message));
  var wrappedOk = check(1, "(10)/(100)=(x)/(250)");
  add(wrappedOk.ok && wrappedOk.progress.step === "proportion" && !wrappedOk.view.solved
    ? { ok: true, id: "wrapped-correct" }
    : fail("wrapped-correct", JSON.stringify(wrappedOk)));

  var other = check(1, "250*(10/100)");
  add(other.ok && other.progress.step === "expr"
    ? { ok: true, id: "second-order" }
    : fail("second-order", JSON.stringify(other)));
  var tiny = check(5, "0.03*400");
  add(tiny.ok && !tiny.view.solved
    ? { ok: true, id: "three-percent-decimal" }
    : fail("three-percent-decimal", JSON.stringify(tiny)));
  var tinyWrong = check(5, "0.3*400");
  add(!tinyWrong.ok && tinyWrong.message.indexOf("0.03") >= 0
    ? { ok: true, id: "three-percent-place" }
    : fail("three-percent-place", tinyWrong && tinyWrong.message));

  var hint = percent.handle(engine, { intent: "hint", levelId: "pct-part-1", exerciseIndex: 0, progress: { step: "", done: true } });
  add(hint.ok && hint.message.indexOf("פרופורציה") >= 0 && hint.message.indexOf("40") < 0
    ? { ok: true, id: "hint-start" }
    : fail("hint-start", hint && hint.message));
  var step = percent.handle(engine, { intent: "step", levelId: "pct-part-1", exerciseIndex: 0, progress: {} });
  add(step.ok && !step.view.solved && step.shows && step.shows[0] === "50/100 = x/80" && step.progress.step === "proportion"
    ? { ok: true, id: "one-step-proportion" }
    : fail("one-step-proportion", JSON.stringify(step)));
  var solution = percent.handle(engine, { intent: "solution", levelId: "pct-part-1", exerciseIndex: 0, progress: {} });
  var lines = (solution.lines || []).map(function (line) { return line.show; });
  add(solution.view && solution.view.solved && lines.length === 3 && lines[0] === "50/100 = x/80" && lines[1] === "x = (80·50)/100" && lines[2] === "x = 40"
    ? { ok: true, id: "solution-three" }
    : fail("solution-three", lines.join(" | ")));
  var math = engine.DoctematicaMath;
  var stacked = math.toHTML("50/100 = x/80");
  var isolated = math.toHTML("x = (80·50)/100");
  add(stacked.indexOf("m-frac") >= 0 && stacked.indexOf("50/100") < 0
    ? { ok: true, id: "stacked-proportion" }
    : fail("stacked-proportion", stacked));
  add(isolated.indexOf("m-frac") >= 0 && isolated.indexOf("/100") < 0
    ? { ok: true, id: "stacked-isolate" }
    : fail("stacked-isolate", isolated));

  var percentUnknown = { unknown: "percent", part: 14, all: 40 };
  add(percent.proportionLine(percentUnknown) === "x/100 = 14/40" && Math.abs(percent.targetOf(percentUnknown) - 35) < 1e-6
    ? { ok: true, id: "unknown-percent-slot" }
    : fail("unknown-percent-slot", percent.proportionLine(percentUnknown)));
  var allUnknown = { unknown: "all", part: 14, percent: 35 };
  add(percent.proportionLine(allUnknown) === "35/100 = 14/x" && Math.abs(percent.targetOf(allUnknown) - 40) < 1e-6
    ? { ok: true, id: "unknown-all-slot" }
    : fail("unknown-all-slot", percent.proportionLine(allUnknown)));
  add(percent.assessTyped(percentUnknown, "x/100=14/40").step === "proportion"
    ? { ok: true, id: "unknown-percent-check" }
    : fail("unknown-percent-check", ""));

  var statues = check(6, "12");
  add(statues.ok && statues.view.solved ? { ok: true, id: "statues-direct" } : fail("statues-direct", JSON.stringify(statues)));
  var statuesPath = check(6, "0.15*80");
  add(statuesPath.ok && !statuesPath.view.solved && statuesPath.progress.step === "expr"
    ? { ok: true, id: "statues-decimal" }
    : fail("statues-decimal", JSON.stringify(statuesPath)));
  var flowers = check(7, "(30/100)*60=18");
  add(flowers.ok && flowers.view.solved ? { ok: true, id: "flowers-one-line" } : fail("flowers-one-line", JSON.stringify(flowers)));

  function museum(typed, progress, answers) {
    return percent.handle(engine, {
      intent: "check",
      levelId: "pct-part-1",
      exerciseIndex: 8,
      typed: typed,
      progress: progress || { step: "", done: false, found: {} },
      answers: answers || {},
    });
  }
  var adultsDec = museum("0.8*2500");
  add(adultsDec.ok && !adultsDec.view.solved && adultsDec.progress.found.g1
    ? { ok: true, id: "museum-given-decimal" }
    : fail("museum-given-decimal", JSON.stringify(adultsDec)));
  var adultsProp = museum("80/100=x/2500");
  add(adultsProp.ok && !adultsProp.view.solved && adultsProp.progress.step !== "done"
    ? { ok: true, id: "museum-proportion" }
    : fail("museum-proportion", JSON.stringify(adultsProp)));
  var childrenFirst = museum("0.2*2500");
  add(childrenFirst.ok && !childrenFirst.view.solved && childrenFirst.progress.found.g2 && !childrenFirst.progress.found.g1
    ? { ok: true, id: "museum-complement-first" }
    : fail("museum-complement-first", JSON.stringify(childrenFirst)));
  var childrenProp = museum("20/100=x/2500");
  add(childrenProp.ok && childrenProp.progress.found.g2 !== true && !childrenProp.view.solved
    ? { ok: true, id: "museum-complement-proportion" }
    : fail("museum-complement-proportion", JSON.stringify(childrenProp)));
  var complementPct = museum("100-80=20");
  add(complementPct.ok && !complementPct.view.solved
    ? { ok: true, id: "museum-complement-percent" }
    : fail("museum-complement-percent", JSON.stringify(complementPct)));
  var subtract = museum("2500-2000");
  add(subtract.ok && subtract.progress.found.g2
    ? { ok: true, id: "museum-subtract" }
    : fail("museum-subtract", JSON.stringify(subtract)));
  var subtractEq = museum("2500-2000=500", { step: "expr", found: { g1: true } });
  add(subtractEq.ok && !subtractEq.view.solved && subtractEq.progress.found.g2
    ? { ok: true, id: "museum-subtract-equals" }
    : fail("museum-subtract-equals", JSON.stringify(subtractEq)));
  var bothDirect = museum("(20/100)*2500");
  add(bothDirect.ok && bothDirect.progress.found.g2
    ? { ok: true, id: "museum-both-by-percent" }
    : fail("museum-both-by-percent", JSON.stringify(bothDirect)));
  var adultsAfter = museum("80/100*2500", { found: { g2: true } });
  add(adultsAfter.ok && adultsAfter.progress.found.g1 && adultsAfter.progress.found.g2 && !adultsAfter.view.solved
    ? { ok: true, id: "museum-order-free" }
    : fail("museum-order-free", JSON.stringify(adultsAfter)));
  var fields = museum("", {}, { g1: "2000", g2: "500" });
  add(fields.ok && fields.view.solved && fields.view.fields[0].value === "2000" && fields.view.fields[1].value === "500"
    ? { ok: true, id: "museum-both-fields" }
    : fail("museum-both-fields", JSON.stringify(fields)));
  var oneField = museum("", {}, { g1: "2000", g2: "400" });
  add(!oneField.ok && oneField.view.fields[0].locked && !oneField.view.fields[1].locked && oneField.message.indexOf("ילדים") >= 0 && oneField.message.indexOf("500") < 0
    ? { ok: true, id: "museum-one-field" }
    : fail("museum-one-field", JSON.stringify(oneField)));
  var swappedFields = museum("", {}, { g1: "500", g2: "2000" });
  add(!swappedFields.ok && swappedFields.message.indexOf("החלפת") >= 0 && !swappedFields.view.fields[0].locked
    ? { ok: true, id: "museum-swapped-fields" }
    : fail("museum-swapped-fields", JSON.stringify(swappedFields)));
  var cinema = percent.handle(engine, { intent: "check", levelId: "pct-part-1", exerciseIndex: 9, typed: "800-280", answers: {} });
  add(cinema.ok && cinema.progress.found.g2 ? { ok: true, id: "cinema-subtract" } : fail("cinema-subtract", JSON.stringify(cinema)));
  var cinemaPct = percent.handle(engine, { intent: "check", levelId: "pct-part-1", exerciseIndex: 9, typed: "0.65*800", answers: {} });
  add(cinemaPct.ok && cinemaPct.progress.found.g2 && !cinemaPct.progress.found.g1
    ? { ok: true, id: "cinema-complement-percent" }
    : fail("cinema-complement-percent", JSON.stringify(cinemaPct)));
  var cinemaFields = percent.handle(engine, { intent: "check", levelId: "pct-part-1", exerciseIndex: 9, typed: "", answers: { g1: "280", g2: "520" } });
  add(cinemaFields.ok && cinemaFields.view.solved ? { ok: true, id: "cinema-fields" } : fail("cinema-fields", JSON.stringify(cinemaFields)));
  var dress = check(10, "0.8*180=144");
  add(dress.ok && dress.view.solved ? { ok: true, id: "dress-direct" } : fail("dress-direct", JSON.stringify(dress)));
  var dressOpen = studentDto.openProblem(engine, "pct-part-1", 10);
  var dressRaw = JSON.stringify(dressOpen);
  add(dressRaw.indexOf("144") < 0 && dressRaw.indexOf("markdown") < 0 && dressRaw.indexOf('"price"') < 0
    ? { ok: true, id: "dress-hides-answer" }
    : fail("dress-hides-answer", dressRaw));
  add(page.exercises[10].price && page.exercises[10].price.change === "markdown"
    ? { ok: true, id: "dress-price-data" }
    : fail("dress-price-data", ""));
  var museumOpen = studentDto.openProblem(engine, "pct-part-1", 8);
  var museumRaw = JSON.stringify(museumOpen);
  function standalone(raw, n) {
    return new RegExp("(^|[^0-9])" + n + "([^0-9]|$)").test(raw);
  }
  var openOk = !standalone(museumRaw, "2000") && !standalone(museumRaw, "500") && museumRaw.indexOf('"percent":') < 0 && museumRaw.indexOf('"amount":') < 0
    && museumOpen.view.fields.length === 2 && museumOpen.view.fields[0].label === "מבוגרים" && museumOpen.view.fields[1].label === "ילדים";
  add(openOk ? { ok: true, id: "museum-open" } : fail("museum-open", museumRaw));
  var museumHint = percent.handle(engine, { intent: "hint", levelId: "pct-part-1", exerciseIndex: 8, progress: {} });
  add(museumHint.ok && museumHint.message.indexOf("מבוגרים") >= 0 && museumHint.message.indexOf("2000") < 0 && museumHint.message.indexOf("500") < 0
    ? { ok: true, id: "museum-hint" }
    : fail("museum-hint", museumHint.message));
  var museumStep = percent.handle(engine, { intent: "step", levelId: "pct-part-1", exerciseIndex: 8, progress: {} });
  add(museumStep.ok && museumStep.shows[0] === "80/100 = x/2500" && !museumStep.view.solved
    ? { ok: true, id: "museum-one-step" }
    : fail("museum-one-step", JSON.stringify(museumStep)));
  var museumSol = percent.handle(engine, { intent: "solution", levelId: "pct-part-1", exerciseIndex: 8, progress: {} });
  var museumLines = (museumSol.lines || []).map(function (line) { return line.show; });
  add(museumSol.view.solved && museumLines[0] === "80/100 = x/2500" && museumLines.indexOf("2500 - 2000") >= 0 && museumLines[museumLines.length - 1] === "500" && museumSol.lines[museumLines.length - 1].joinPrev
    ? { ok: true, id: "museum-solution" }
    : fail("museum-solution", museumLines.join(" | ")));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-percent: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL " + item.id + " " + item.detail);
  });
  if (failed.length) process.exit(1);
}

main();
