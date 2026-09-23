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
  add(subs.length === 2 && subs[0].id === "find-part" && subs[0].label === "מציאת כמות עבור אחוז"
    && subs[1].id === "find-whole" && subs[1].label === "מציאת הכמות היסודית"
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
  add(page && page.exercises.length === 15 ? { ok: true, id: "fifteen-exercises" } : fail("fifteen-exercises", String(page && page.exercises.length)));
  var tripEx = page.exercises[11];
  var heirEx = page.exercises[12];
  var savedEx = page.exercises[13];
  var partnersEx = page.exercises[14];
  add(tripEx && tripEx.parts && tripEx.parts.map(function (part) { return part.label; }).join(",") === "א,ב"
    && heirEx.parts.map(function (part) { return part.label; }).join(",") === "א,ב"
    && savedEx.parts.map(function (part) { return part.label; }).join(",") === "א,ב"
    && partnersEx.parts.map(function (part) { return part.label; }).join(",") === "א,ב,ג"
    ? { ok: true, id: "related-parts-one-exercise" }
    : fail("related-parts-one-exercise", ""));
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

  function ask(index, typed, answers, progress) {
    return percent.handle(engine, {
      intent: "check",
      levelId: "pct-part-1",
      exerciseIndex: index,
      typed: typed || "",
      answers: answers || {},
      progress: progress || { step: "", done: false, found: {}, guide: 0 },
    });
  }
  function standaloneNum(raw, n) {
    return new RegExp("(^|[^0-9])" + n + "([^0-9]|$)").test(raw);
  }
  var tripMinus = ask(11, "100-20=80");
  add(tripMinus.ok && !tripMinus.view.solved ? { ok: true, id: "trip-minus" } : fail("trip-minus", JSON.stringify(tripMinus)));
  var tripPct = ask(11, "100%-20%=80%");
  add(tripPct.ok && !tripPct.view.solved ? { ok: true, id: "trip-percent-signs" } : fail("trip-percent-signs", JSON.stringify(tripPct)));
  var tripBare = ask(11, "80%");
  add(tripBare.ok && !tripBare.view.solved ? { ok: true, id: "trip-bare-percent" } : fail("trip-bare-percent", JSON.stringify(tripBare)));
  var tripAmount = ask(11, "0.8*50=40");
  add(tripAmount.ok && !tripAmount.view.solved ? { ok: true, id: "trip-amount-direct" } : fail("trip-amount-direct", JSON.stringify(tripAmount)));
  var tripBad = ask(11, "20+20=40");
  add(!tripBad.ok ? { ok: true, id: "trip-rejects-unrelated" } : fail("trip-rejects-unrelated", JSON.stringify(tripBad)));
  var tripFields = ask(11, "", { "f-percent": "80%" });
  add(tripFields.ok && !tripFields.view.solved && tripFields.view.part && tripFields.view.part.label === "ב" && tripFields.view.fields.length === 1 && tripFields.view.fields[0].id === "f-amount"
    ? { ok: true, id: "trip-fields" }
    : fail("trip-fields", JSON.stringify(tripFields)));
  var tripAmountField = ask(11, "", { "f-amount": "40" }, { part: 1 });
  add(tripAmountField.ok && tripAmountField.view.solved && tripAmountField.view.fields.length === 1 && tripAmountField.view.fields[0].value === "40"
    ? { ok: true, id: "trip-amount-field" }
    : fail("trip-amount-field", JSON.stringify(tripAmountField)));
  var tripOne = ask(11, "", { "f-percent": "10" });
  add(!tripOne.ok && !tripOne.view.fields[0].locked && tripOne.message.indexOf("האחוז של מבוגרים") >= 0 && tripOne.message.indexOf("80") < 0
    ? { ok: true, id: "trip-one-field" }
    : fail("trip-one-field", JSON.stringify(tripOne)));
  var tripOpen = studentDto.openProblem(engine, "pct-part-1", 11);
  var tripRaw = JSON.stringify(tripOpen);
  add(!standaloneNum(tripRaw, "80") && !standaloneNum(tripRaw, "40") && tripOpen.view.fields.length === 1 && tripOpen.view.fields[0].label === "אחוז המבוגרים" && tripOpen.view.fields[0].unit === "%"
    ? { ok: true, id: "trip-open" }
    : fail("trip-open", tripRaw));
  var tripHint = percent.handle(engine, { intent: "hint", levelId: "pct-part-1", exerciseIndex: 11, progress: {} });
  add(tripHint.ok && tripHint.message.indexOf("מבוגרים") >= 0 && tripHint.message.indexOf("80") < 0 && tripHint.message.indexOf("40") < 0
    ? { ok: true, id: "trip-hint" }
    : fail("trip-hint", tripHint.message));
  var tripStep = percent.handle(engine, { intent: "step", levelId: "pct-part-1", exerciseIndex: 11, progress: {} });
  add(tripStep.ok && tripStep.shows[0] === "100% - 20% = 80%" && !tripStep.view.solved && tripStep.view.part && tripStep.view.part.label === "ב"
    ? { ok: true, id: "trip-one-step" }
    : fail("trip-one-step", JSON.stringify(tripStep)));
  var heir = ask(12, "0.4*20000");
  add(heir.ok && !heir.view.solved ? { ok: true, id: "heir-direct" } : fail("heir-direct", JSON.stringify(heir)));
  var heirMinus = ask(12, "20000-12000=8000");
  add(heirMinus.ok && !heirMinus.view.solved ? { ok: true, id: "heir-subtract" } : fail("heir-subtract", JSON.stringify(heirMinus)));
  var savedSum = ask(13, "35+18=53");
  add(savedSum.ok && !savedSum.view.solved ? { ok: true, id: "saved-sum" } : fail("saved-sum", JSON.stringify(savedSum)));
  var savedOrder = ask(13, "18+35=53");
  add(savedOrder.ok ? { ok: true, id: "saved-sum-order" } : fail("saved-sum-order", JSON.stringify(savedOrder)));
  var savedFromSum = ask(13, "100-53=47");
  add(savedFromSum.ok ? { ok: true, id: "saved-from-sum" } : fail("saved-from-sum", JSON.stringify(savedFromSum)));
  var savedChain = ask(13, "100-35-18=47");
  add(savedChain.ok ? { ok: true, id: "saved-chain" } : fail("saved-chain", JSON.stringify(savedChain)));
  var savedBare = ask(13, "47%");
  add(savedBare.ok && !savedBare.view.solved ? { ok: true, id: "saved-bare" } : fail("saved-bare", JSON.stringify(savedBare)));
  var savedAmount = ask(13, "0.47*500=235");
  add(savedAmount.ok && !savedAmount.view.solved ? { ok: true, id: "saved-amount" } : fail("saved-amount", JSON.stringify(savedAmount)));
  var savedSubtract = ask(13, "500-175-90=235");
  add(savedSubtract.ok ? { ok: true, id: "saved-subtract" } : fail("saved-subtract", JSON.stringify(savedSubtract)));
  var savedSubtractOrder = ask(13, "500-90-175");
  add(savedSubtractOrder.ok ? { ok: true, id: "saved-subtract-order" } : fail("saved-subtract-order", JSON.stringify(savedSubtractOrder)));
  var partChain = ask(14, "100-60-15=25");
  add(partChain.ok && !partChain.view.solved ? { ok: true, id: "partners-chain" } : fail("partners-chain", JSON.stringify(partChain)));
  var partSum = ask(14, "60+15=75");
  add(partSum.ok ? { ok: true, id: "partners-sum" } : fail("partners-sum", JSON.stringify(partSum)));
  var partFromSum = ask(14, "100-75=25");
  add(partFromSum.ok ? { ok: true, id: "partners-from-sum" } : fail("partners-from-sum", JSON.stringify(partFromSum)));
  var partDirect = ask(14, "25%");
  add(partDirect.ok ? { ok: true, id: "partners-bare-percent" } : fail("partners-bare-percent", JSON.stringify(partDirect)));
  var partAmount = ask(14, "0.25*9000=2250");
  add(partAmount.ok && !partAmount.view.solved ? { ok: true, id: "partners-by-percent" } : fail("partners-by-percent", JSON.stringify(partAmount)));
  var partSecondFirst = ask(14, "0.15*9000");
  add(partSecondFirst.ok && partSecondFirst.progress.found.g2 ? { ok: true, id: "partners-second-first" } : fail("partners-second-first", JSON.stringify(partSecondFirst)));
  var partFirst = ask(14, "0.6*9000=5400");
  add(partFirst.ok && partFirst.progress.found.g1 ? { ok: true, id: "partners-first" } : fail("partners-first", JSON.stringify(partFirst)));
  var partRest = ask(14, "9000-5400-1350=2250");
  add(partRest.ok && partRest.progress.found.g3 ? { ok: true, id: "partners-subtract" } : fail("partners-subtract", JSON.stringify(partRest)));
  var partRestOrder = ask(14, "9000-1350-5400");
  add(partRestOrder.ok && partRestOrder.progress.found.g3 ? { ok: true, id: "partners-subtract-order" } : fail("partners-subtract-order", JSON.stringify(partRestOrder)));
  var partBundle = ask(14, "5400+1350=6750");
  add(partBundle.ok && !partBundle.view.solved ? { ok: true, id: "partners-bundle" } : fail("partners-bundle", JSON.stringify(partBundle)));
  var partFromBundle = ask(14, "9000-6750=2250");
  add(partFromBundle.ok && partFromBundle.progress.found.g3 ? { ok: true, id: "partners-from-bundle" } : fail("partners-from-bundle", JSON.stringify(partFromBundle)));
  var partScaled = ask(14, "(60+15)/100*9000");
  add(partScaled.ok && !partScaled.view.solved ? { ok: true, id: "partners-scaled-sum" } : fail("partners-scaled-sum", JSON.stringify(partScaled)));
  var partJunk = ask(14, "20+5=25");
  add(!partJunk.ok ? { ok: true, id: "partners-rejects-unrelated" } : fail("partners-rejects-unrelated", JSON.stringify(partJunk)));
  var partFields = ask(14, "", { "f-first": "5400" });
  add(partFields.ok && !partFields.view.solved && partFields.view.part && partFields.view.part.label === "ב" && partFields.view.fields.length === 1
    ? { ok: true, id: "partners-fields-order" }
    : fail("partners-fields-order", JSON.stringify(partFields)));
  var partPercentField = ask(14, "", { "f-percent": "25%" }, { part: 1 });
  add(partPercentField.ok && !partPercentField.view.solved && partPercentField.view.part && partPercentField.view.part.label === "ג"
    ? { ok: true, id: "partners-percent-field" }
    : fail("partners-percent-field", JSON.stringify(partPercentField)));
  var partThirdField = ask(14, "", { "f-third": "2250" }, { part: 2 });
  add(partThirdField.ok && partThirdField.view.solved ? { ok: true, id: "partners-third-field" } : fail("partners-third-field", JSON.stringify(partThirdField)));
  var partOne = ask(14, "", { "f-percent": "20" }, { part: 1 });
  add(!partOne.ok && !partOne.view.fields[0].locked && partOne.message.indexOf("השותף השלישי") >= 0 && partOne.message.indexOf("2250") < 0 && partOne.message.indexOf("25") < 0
    ? { ok: true, id: "partners-one-field" }
    : fail("partners-one-field", JSON.stringify(partOne)));
  var partOpen = studentDto.openProblem(engine, "pct-part-1", 14);
  var partRaw = JSON.stringify(partOpen);
  add(!standaloneNum(partRaw, "5400") && !standaloneNum(partRaw, "2250") && !standaloneNum(partRaw, "25") && !standaloneNum(partRaw, "1350")
    && partOpen.view.part && partOpen.view.part.label === "א" && partOpen.view.fields.length === 1 && partOpen.view.fields[0].unit === "₪"
    && partOpen.problem.parts.length === 3
    ? { ok: true, id: "partners-open" }
    : fail("partners-open", partRaw));
  var partHint = percent.handle(engine, { intent: "hint", levelId: "pct-part-1", exerciseIndex: 14, progress: {} });
  add(partHint.ok && partHint.message.indexOf("25") < 0 && partHint.message.indexOf("5400") < 0 && partHint.message.indexOf("2250") < 0
    ? { ok: true, id: "partners-hint" }
    : fail("partners-hint", partHint.message));
  var partSol = percent.handle(engine, { intent: "solution", levelId: "pct-part-1", exerciseIndex: 14, progress: {} });
  var partLines = (partSol.lines || []).map(function (line) { return line.show; });
  add(partSol.view.solved && partLines.indexOf("x = 5400") >= 0 && partLines.indexOf("100% - 60% - 15% = 25%") >= 0 && partLines.indexOf("x = 2250") >= 0
    ? { ok: true, id: "partners-solution" }
    : fail("partners-solution", partLines.join(" | ")));

  function follow(index, intent, history) {
    return percent.handle(engine, {
      intent: intent,
      levelId: "pct-part-1",
      exerciseIndex: index,
      history: history,
      progress: {},
    });
  }
  var afterPercent = follow(13, "step", ["100% - 35% - 18% = 47%"]);
  add(afterPercent.ok && afterPercent.shows[0] === "47/100 = x/500" && afterPercent.shows[0].indexOf("100% - 35%") < 0
    ? { ok: true, id: "step-after-complement" }
    : fail("step-after-complement", JSON.stringify(afterPercent)));
  var afterProp = follow(12, "step", ["40", "40/100 = x/20000", "100% - 60% = 40%", "40/100 = x/20000"]);
  add(afterProp.ok && afterProp.shows[0] === "x = (20000·40)/100" && !afterProp.view.solved
    ? { ok: true, id: "step-after-proportion" }
    : fail("step-after-proportion", JSON.stringify(afterProp)));
  var afterDecimal = follow(12, "step", ["0.4·20000"]);
  add(afterDecimal.ok && afterDecimal.joinPrev && afterDecimal.shows[0] === "8000" && afterDecimal.shows[0].indexOf("40/100") < 0
    ? { ok: true, id: "step-after-decimal" }
    : fail("step-after-decimal", JSON.stringify(afterDecimal)));
  var afterAdults = follow(8, "step", ["0.8·2500 = 2000"]);
  add(afterAdults.ok && afterAdults.shows[0] === "2500 - 2000" && afterAdults.shows[0].indexOf("80/100") < 0
    ? { ok: true, id: "step-after-one-amount" }
    : fail("step-after-one-amount", JSON.stringify(afterAdults)));
  var afterTwo = follow(14, "step", ["0.15·9000 = 1350", "0.6·9000 = 5400"]);
  add(afterTwo.ok && afterTwo.shows[0] === "100% - 60% - 15% = 25%" && afterTwo.shows[0].indexOf("60/100") < 0 && afterTwo.shows[0].indexOf("15/100") < 0
    ? { ok: true, id: "step-after-two-of-three" }
    : fail("step-after-two-of-three", JSON.stringify(afterTwo)));
  var noRepeat = follow(13, "step", ["100% - 35% - 18% = 47%"]);
  add(noRepeat.shows[0] !== "100% - 60% = 40%"
    ? { ok: true, id: "step-skips-done" }
    : fail("step-skips-done", JSON.stringify(noRepeat)));
  var hintPercent = follow(13, "hint", ["100% - 35% - 18% = 47%"]);
  add(hintPercent.ok && hintPercent.message.indexOf("פחות האחוזים") < 0 && hintPercent.message.indexOf("פרופורציה") >= 0 && hintPercent.message.indexOf("8000") < 0
    ? { ok: true, id: "hint-after-complement" }
    : fail("hint-after-complement", hintPercent.message));
  var hintNow = follow(12, "hint", ["100% - 60% = 40%", "40/100 = x/20000"]);
  add(hintNow.ok && hintNow.message.indexOf("פחות האחוזים") < 0 && hintNow.message.indexOf("בודדו") >= 0 && hintNow.message.indexOf("8000") < 0
    ? { ok: true, id: "hint-follows-state" }
    : fail("hint-follows-state", hintNow.message));
  var solNow = follow(12, "solution", ["100% - 60% = 40%", "40/100 = x/20000"]);
  var solLines = (solNow.lines || []).map(function (line) { return line.show; });
  add(solNow.view.solved && solLines.indexOf("100% - 60% = 40%") < 0 && solLines.indexOf("40/100 = x/20000") < 0 && solLines[0] === "x = (20000·40)/100" && solLines.indexOf("x = 8000") >= 0
    ? { ok: true, id: "solution-skips-done" }
    : fail("solution-skips-done", solLines.join(" | ")));

  function ask2(index, typed, answers) {
    return percent.handle(engine, {
      intent: "check",
      levelId: "pct-part-2",
      exerciseIndex: index,
      typed: typed || "",
      answers: answers || {},
      progress: {},
    });
  }
  function follow2(index, intent, history) {
    return percent.handle(engine, {
      intent: intent,
      levelId: "pct-part-2",
      exerciseIndex: index,
      history: history || [],
      progress: {},
    });
  }
  var level2 = (engine.DoctematicaCurriculum.levels || []).filter(function (level) { return level.id === "pct-part-2"; })[0];
  add(level2 && level2.exercises.length === 11 && level2.title === "רמה 2" ? { ok: true, id: "level-2-count" } : fail("level-2-count", String(level2 && level2.exercises.length)));
  add(level2.exercises[0].parts == null && level2.exercises[1].parts == null && level2.exercises[4].parts.length === 2 && level2.exercises[9].parts.length === 2
    ? { ok: true, id: "level-2-related-parts" }
    : fail("level-2-related-parts", ""));
  add(ask2(0, "100+20=120").ok ? { ok: true, id: "grow-new-percent" } : fail("grow-new-percent", ""));
  add(ask2(0, "120/100=x/60").ok ? { ok: true, id: "grow-proportion" } : fail("grow-proportion", ""));
  add(ask2(0, "x=(60*120)/100").ok ? { ok: true, id: "grow-isolate" } : fail("grow-isolate", ""));
  add(ask2(0, "1.2*60=72").ok ? { ok: true, id: "grow-factor" } : fail("grow-factor", ""));
  add(ask2(0, "60*1.2").ok ? { ok: true, id: "grow-factor-order" } : fail("grow-factor-order", ""));
  add(ask2(0, "0.2*60=12").ok ? { ok: true, id: "grow-change" } : fail("grow-change", ""));
  add(ask2(0, "60+12=72").ok ? { ok: true, id: "grow-add" } : fail("grow-add", ""));
  add(ask2(0, "60+0.2*60").ok ? { ok: true, id: "grow-add-expr" } : fail("grow-add-expr", ""));
  var growField = ask2(0, "", { f: "72" });
  add(growField.ok && growField.view.solved ? { ok: true, id: "grow-field" } : fail("grow-field", JSON.stringify(growField)));
  add(ask2(1, "180*1.15=207").ok ? { ok: true, id: "grow-180" } : fail("grow-180", ""));
  add(ask2(5, "100%-20%=80%").ok ? { ok: true, id: "shrink-remain" } : fail("shrink-remain", ""));
  add(ask2(5, "0.8*35=28").ok ? { ok: true, id: "shrink-factor" } : fail("shrink-factor", ""));
  add(ask2(5, "80/100=x/35").ok ? { ok: true, id: "shrink-proportion" } : fail("shrink-proportion", ""));
  add(ask2(5, "0.2*35=7").ok ? { ok: true, id: "shrink-change" } : fail("shrink-change", ""));
  add(ask2(5, "35-7=28").ok ? { ok: true, id: "shrink-subtract" } : fail("shrink-subtract", ""));
  var decimal = ask2(6, "86*0.65=55.9", { f: "55.9" });
  add(decimal.ok && decimal.view.solved && decimal.view.fields[0].value === "55.9" ? { ok: true, id: "shrink-decimal" } : fail("shrink-decimal", JSON.stringify(decimal)));
  add(ask2(4, "1.2*15=18").ok ? { ok: true, id: "girls-factor" } : fail("girls-factor", ""));
  var classSum = percent.handle(engine, { intent: "check", levelId: "pct-part-2", exerciseIndex: 4, typed: "15+18=33", answers: {}, progress: { part: 1 } });
  var classField = percent.handle(engine, { intent: "check", levelId: "pct-part-2", exerciseIndex: 4, typed: "", answers: { "f-total": "33" }, progress: { part: 1 } });
  add(classSum.ok && classField.view.solved ? { ok: true, id: "class-sum" } : fail("class-sum", JSON.stringify(classField)));
  add(ask2(9, "120*0.7=84").ok ? { ok: true, id: "rooms-day" } : fail("rooms-day", ""));
  var roomsTotal = percent.handle(engine, { intent: "check", levelId: "pct-part-2", exerciseIndex: 9, typed: "120+84=204", answers: {}, progress: { part: 1 } });
  add(roomsTotal.ok ? { ok: true, id: "rooms-total" } : fail("rooms-total", JSON.stringify(roomsTotal)));
  add(ask2(10, "200*0.76=152").ok && ask2(10, "152*1.25=190").ok && ask2(10, "200+152+190=542").ok ? { ok: true, id: "invites-chain" } : fail("invites-chain", ""));
  var growStep = follow2(0, "step", ["100% + 20% = 120%"]);
  add(growStep.ok && growStep.shows[0] === "120/100 = x/60" && growStep.shows[0].indexOf("100% + 20%") < 0
    ? { ok: true, id: "grow-step-after-percent" }
    : fail("grow-step-after-percent", JSON.stringify(growStep)));
  var growProp = follow2(0, "step", ["100% + 20% = 120%", "120/100 = x/60"]);
  add(growProp.ok && growProp.shows[0] === "x = (60·120)/100" ? { ok: true, id: "grow-step-after-proportion" } : fail("grow-step-after-proportion", JSON.stringify(growProp)));
  var growAlt = follow2(0, "step", ["0.2·60 = 12"]);
  add(growAlt.ok && growAlt.shows[0] === "60 + 12 = 72" && growAlt.shows[0].indexOf("120") < 0
    ? { ok: true, id: "grow-step-after-change" }
    : fail("grow-step-after-change", JSON.stringify(growAlt)));
  var growHint = follow2(0, "hint", ["100% + 20% = 120%", "120/100 = x/60"]);
  add(growHint.ok && growHint.message.indexOf("האחוז החדש") < 0 && growHint.message.indexOf("בודדו") >= 0 && growHint.message.indexOf("72") < 0
    ? { ok: true, id: "grow-hint-follows" }
    : fail("grow-hint-follows", growHint.message));
  var growSol = follow2(0, "solution", ["100% + 20% = 120%", "120/100 = x/60"]);
  var growLines = (growSol.lines || []).map(function (line) { return line.show; });
  add(growSol.view.solved && growLines.indexOf("100% + 20% = 120%") < 0 && growLines[0] === "x = (60·120)/100" && growLines.indexOf("x = 72") >= 0
    ? { ok: true, id: "grow-solution-skips" }
    : fail("grow-solution-skips", growLines.join(" | ")));
  var growOpen = studentDto.openProblem(engine, "pct-part-2", 0);
  add(growOpen && !standaloneNum(JSON.stringify(growOpen), "72") && growOpen.view.fields.length === 1
    ? { ok: true, id: "grow-open" }
    : fail("grow-open", JSON.stringify(growOpen)));
  var badPercent = ask2(0, "", { f: "20" });
  add(!badPercent.ok && badPercent.message.indexOf("100%") >= 0 && badPercent.message.indexOf("72") < 0
    ? { ok: true, id: "grow-percent-as-result" }
    : fail("grow-percent-as-result", badPercent.message));
  var badChange = ask2(0, "", { f: "12" });
  add(!badChange.ok && badChange.message.indexOf("גודל השינוי") >= 0 && badChange.message.indexOf("72") < 0
    ? { ok: true, id: "grow-change-as-result" }
    : fail("grow-change-as-result", badChange.message));
  var badSign = ask2(0, "60-12=48");
  add(!badSign.ok && badSign.message.indexOf("מחברים") >= 0 ? { ok: true, id: "grow-subtracted" } : fail("grow-subtracted", badSign.message));
  var badDecimal = ask2(0, "0.02*60");
  add(!badDecimal.ok && badDecimal.message.indexOf("0.2") >= 0 && badDecimal.message.indexOf("0.02") >= 0
    ? { ok: true, id: "grow-decimal" }
    : fail("grow-decimal", badDecimal.message));
  var badShrink = ask2(5, "35+7=42");
  add(!badShrink.ok && badShrink.message.indexOf("מחסרים") >= 0 ? { ok: true, id: "shrink-added" } : fail("shrink-added", badShrink.message));
  var badBase = ask2(10, "200*1.25");
  add(!badBase.ok && badBase.message.indexOf("יום ג׳") >= 0 && badBase.message.indexOf("יום ב׳") >= 0 && badBase.message.indexOf("190") < 0
    ? { ok: true, id: "chain-wrong-base" }
    : fail("chain-wrong-base", badBase.message));
  var chainStep = follow2(10, "step", ["200*0.76 = 152", "152*0.25 = 38"]);
  add(chainStep.ok && chainStep.shows[0] === "152 + 38 = 190" && chainStep.shows[0].indexOf("125") < 0
    ? { ok: true, id: "chain-step-follows-student" }
    : fail("chain-step-follows-student", JSON.stringify(chainStep)));

  function askWhole(index, typed, answers, progress, intent, history) {
    return percent.handle(engine, {
      intent: intent || "check",
      levelId: "pct-whole-1",
      exerciseIndex: index,
      typed: typed || "",
      answers: answers || {},
      history: history || [],
      progress: progress || {},
    });
  }
  var wholeLevel = (engine.DoctematicaCurriculum.levels || []).filter(function (level) { return level.id === "pct-whole-1"; })[0];
  add(wholeLevel && wholeLevel.exercises.length === 10 && wholeLevel.subtopic === "find-whole" && wholeLevel.title === "רמה 1"
    ? { ok: true, id: "whole-count" }
    : fail("whole-count", String(wholeLevel && wholeLevel.exercises.length)));
  add(wholeLevel.exercises[0].parts == null && wholeLevel.exercises[4].parts.length === 2 && wholeLevel.exercises[8].parts.length === 2 && wholeLevel.exercises[9].parts.length === 2
    ? { ok: true, id: "whole-part-shape" }
    : fail("whole-part-shape", ""));
  var direct = askWhole(0, "0.7x");
  add(direct.ok && direct.view.solved ? { ok: true, id: "express-direct" } : fail("express-direct", JSON.stringify(direct)));
  var fraction = askWhole(0, "(70/100)*x");
  add(fraction.ok && !fraction.view.solved ? { ok: true, id: "express-fraction-step" } : fail("express-fraction-step", JSON.stringify(fraction)));
  add(askWhole(1, "0.15x").view.solved && askWhole(2, "0.09x").view.solved && askWhole(3, "1.6x").view.solved
    ? { ok: true, id: "express-factors" }
    : fail("express-factors", ""));
  add(askWhole(3, "160/100*x").ok && !askWhole(3, "160/100*x").view.solved ? { ok: true, id: "express-over-100" } : fail("express-over-100", ""));
  var plain = askWhole(0, "70x");
  add(!plain.ok && plain.message.indexOf("0.7") >= 0 && plain.message.indexOf("70") >= 0 ? { ok: true, id: "express-plain" } : fail("express-plain", plain.message));
  var badPlace = askWhole(2, "0.9x");
  add(!badPlace.ok && badPlace.message.indexOf("0.09") >= 0 && badPlace.message.indexOf("0.9") >= 0 ? { ok: true, id: "express-decimal" } : fail("express-decimal", badPlace.message));
  var expressStep = askWhole(0, "", {}, {}, "step", []);
  add(expressStep.ok && expressStep.shows[0] === "(70/100)·x" && !expressStep.view.solved ? { ok: true, id: "express-site-step" } : fail("express-site-step", JSON.stringify(expressStep)));
  var expressNext = askWhole(0, "", {}, {}, "step", ["(70/100)·x"]);
  add(expressNext.ok && expressNext.joinPrev && expressNext.shows[0] === "0.7x" ? { ok: true, id: "express-site-simplify" } : fail("express-site-simplify", JSON.stringify(expressNext)));
  var salaryProp = askWhole(6, "45/100=3600/x");
  add(salaryProp.ok && !salaryProp.view.solved ? { ok: true, id: "whole-proportion" } : fail("whole-proportion", JSON.stringify(salaryProp)));
  var salaryCross = askWhole(6, "45x=360000");
  add(salaryCross.ok && !salaryCross.view.solved ? { ok: true, id: "whole-cross" } : fail("whole-cross", JSON.stringify(salaryCross)));
  var salaryEq = askWhole(6, "(45/100)*x=3600");
  add(salaryEq.ok && !salaryEq.view.solved ? { ok: true, id: "whole-product" } : fail("whole-product", JSON.stringify(salaryEq)));
  var salaryDec = askWhole(6, "0.45x=3600");
  add(salaryDec.ok && !salaryDec.view.solved ? { ok: true, id: "whole-decimal" } : fail("whole-decimal", JSON.stringify(salaryDec)));
  add(askWhole(6, "x=8000").view.solved && askWhole(7, "x=150").view.solved ? { ok: true, id: "whole-values" } : fail("whole-values", ""));
  var salarySwap = askWhole(6, "45/100=x/3600");
  add(!salarySwap.ok && salarySwap.message.indexOf("החלפת") >= 0 && salarySwap.message.indexOf("8000") < 0
    ? { ok: true, id: "whole-placement" }
    : fail("whole-placement", salarySwap.message));
  var salaryGuide = askWhole(6, "", {}, {}, "step", []);
  add(salaryGuide.shows[0] === "(45/100)·x = 3600" ? { ok: true, id: "whole-site-start" } : fail("whole-site-start", JSON.stringify(salaryGuide)));
  var salaryAfter = askWhole(6, "", {}, {}, "step", ["(45/100)·x = 3600"]);
  add(salaryAfter.shows[0] === "0.45x = 3600" ? { ok: true, id: "whole-site-decimal" } : fail("whole-site-decimal", JSON.stringify(salaryAfter)));
  var salaryFromProp = askWhole(6, "", {}, {}, "step", ["45/100 = 3600/x"]);
  add(salaryFromProp.shows[0] === "x = (3600·100)/45" ? { ok: true, id: "whole-site-from-proportion" } : fail("whole-site-from-proportion", JSON.stringify(salaryFromProp)));
  var classNext = askWhole(4, "", {}, { part: 1 }, "step", ["(60/100)·x = 0.6x"]);
  add(classNext.ok && classNext.shows[0] === "0.6x = 21" && classNext.view.part && classNext.view.part.label === "ב"
    ? { ok: true, id: "class-continues" }
    : fail("class-continues", JSON.stringify(classNext)));
  add(askWhole(4, "x=35", {}, { part: 1 }).view.solved ? { ok: true, id: "class-solved" } : fail("class-solved", ""));
  add(askWhole(5, "0.3x=6", {}, { part: 1 }).ok && askWhole(5, "x=20", {}, { part: 1 }).view.solved ? { ok: true, id: "flower-solved" } : fail("flower-solved", ""));
  var partnersPct = askWhole(8, "", { "f-percent": "45%" });
  add(partnersPct.ok && !partnersPct.view.solved && partnersPct.view.part && partnersPct.view.part.label === "ב"
    ? { ok: true, id: "profit-percent-part" }
    : fail("profit-percent-part", JSON.stringify(partnersPct)));
  var partnersAlt = askWhole(8, "900/0.45=2000", {}, { part: 1 });
  add(partnersAlt.ok ? { ok: true, id: "profit-divide" } : fail("profit-divide", JSON.stringify(partnersAlt)));
  var partnersProp = askWhole(8, "45/100=900/x", {}, { part: 1 });
  add(partnersProp.ok ? { ok: true, id: "profit-proportion" } : fail("profit-proportion", JSON.stringify(partnersProp)));
  add(askWhole(8, "", { "f-all": "2000" }, { part: 1 }).view.solved ? { ok: true, id: "profit-total" } : fail("profit-total", ""));
  add(askWhole(9, "45+25=70").ok && askWhole(9, "100-70=30").ok ? { ok: true, id: "brothers-percent-paths" } : fail("brothers-percent-paths", ""));
  add(askWhole(9, "", { "f-percent": "30%" }).view.part.label === "ב" ? { ok: true, id: "brothers-percent-field" } : fail("brothers-percent-field", ""));
  add(askWhole(9, "0.3x=3000", {}, { part: 1 }).ok && askWhole(9, "", { "f-all": "10000" }, { part: 1 }).view.solved
    ? { ok: true, id: "brothers-total" }
    : fail("brothers-total", ""));
  var brothersStep = askWhole(9, "", {}, { part: 1 }, "step", ["100% - 45% - 25% = 30%"]);
  add(brothersStep.shows[0] === "(30/100)·x = 3000" && brothersStep.shows[0].indexOf("100% - 45%") < 0
    ? { ok: true, id: "brothers-step-skips-percent" }
    : fail("brothers-step-skips-percent", JSON.stringify(brothersStep)));
  var wholeOpen = studentDto.openProblem(engine, "pct-whole-1", 6);
  var wholeRaw = JSON.stringify(wholeOpen);
  add(!standaloneNum(wholeRaw, "8000") && !standaloneNum(wholeRaw, "0.45") && wholeOpen.view.part == null
    ? { ok: true, id: "whole-open" }
    : fail("whole-open", wholeRaw));
  var classOpen = studentDto.openProblem(engine, "pct-whole-1", 4);
  add(classOpen.view.part && classOpen.view.part.label === "א" && !standaloneNum(JSON.stringify(classOpen), "35") && !standaloneNum(JSON.stringify(classOpen), "0.6")
    ? { ok: true, id: "class-open" }
    : fail("class-open", JSON.stringify(classOpen.view)));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-percent: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL " + item.id + " " + item.detail);
  });
  if (failed.length) process.exit(1);
}

main();
