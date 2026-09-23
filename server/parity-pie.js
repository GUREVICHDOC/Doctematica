"use strict";

var loadEngine = require("./load-engine").loadEngine;
var studentDto = require("./student-dto");
var freq = require("./freq-table");
var pie = require("./pie-chart");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function ask(index, typed, progress, intent) {
  return freq.handle(loadEngine(), {
    intent: intent || "check",
    levelId: "stat-pie-1",
    exerciseIndex: index,
    typed: typed || "",
    progress: progress || {},
  });
}

function shows(result) {
  return (result.shows || []).join(" | ");
}

function main() {
  var engine = loadEngine();
  var checks = [];
  function add(result) { checks.push(result); }

  var level = (engine.DoctematicaCurriculum.levels || []).filter(function (item) { return item.id === "stat-pie-1"; })[0];
  add(level && level.subtopic === "pie-chart" && level.exercises.length === 3
    ? { ok: true, id: "pie-count" }
    : fail("pie-count", String(level && level.exercises && level.exercises.length)));

  var opened = studentDto.openProblem(engine, "stat-pie-1", 0);
  var sectors = opened && opened.problem && opened.problem.pie && opened.problem.pie.sectors;
  var alef = sectors && sectors.filter(function (sector) { return sector.label === "א"; })[0];
  var angleSum = (sectors || []).reduce(function (sum, sector) { return sum + sector.angle; }, 0);
  add(opened && opened.problem && !opened.problem.table && sectors && sectors.length === 6 && alef && alef.text === "x" && Math.abs(angleSum - 360) < 0.2 && Math.abs(alef.angle - 32.4) > 5
    ? { ok: true, id: "pie-open" }
    : fail("pie-open", JSON.stringify(alef) + " " + angleSum));

  add(!pie.hasMajority(50) && pie.hasMajority(51) && !pie.hasMajority(31)
    ? { ok: true, id: "pie-majority-boundary" }
    : fail("pie-majority-boundary", ""));

  var direct = ask(0, "9");
  var shownAlef = direct.view.pie && direct.view.pie.sectors.filter(function (sector) { return sector.label === "א"; })[0];
  add(direct.ok && direct.progress.done.alef && direct.view.part.label === "ב" && shownAlef && shownAlef.text === "9%" && Math.abs(shownAlef.angle - 32.4) < 0.2
    ? { ok: true, id: "pie-direct-x" }
    : fail("pie-direct-x", direct.message + " " + JSON.stringify(shownAlef)));
  var knownSum = ask(0, "91");
  add(!knownSum.ok && knownSum.message.indexOf("ידועים") >= 0
    ? { ok: true, id: "pie-known-sum-trap" }
    : fail("pie-known-sum-trap", knownSum.message));
  var decimal = ask(0, "0.09");
  add(!decimal.ok && decimal.message.indexOf("עשרוני") >= 0
    ? { ok: true, id: "pie-decimal" }
    : fail("pie-decimal", decimal.message));
  var complement = ask(0, "100-91");
  add(complement.ok && complement.progress.pie.x === 9
    ? { ok: true, id: "pie-complement" }
    : fail("pie-complement", complement.message + " " + JSON.stringify(complement.progress && complement.progress.pie)));
  var equation = ask(0, "30+18+24+8+x+11=100");
  add(equation.ok && !equation.progress.done.alef && equation.progress.pie.equation
    ? { ok: true, id: "pie-equation" }
    : fail("pie-equation", equation.message + " " + JSON.stringify(equation.progress && equation.progress.pie && equation.progress.pie.x)));
  var solvedEq = ask(0, "x=9");
  add(solvedEq.ok && solvedEq.progress.done.alef
    ? { ok: true, id: "pie-solved-equation" }
    : fail("pie-solved-equation", solvedEq.message));
  var forgot = ask(0, "80+x=100");
  add(!forgot.ok && forgot.message.indexOf("חסרה") >= 0
    ? { ok: true, id: "pie-forgot-sector" }
    : fail("pie-forgot-sector", forgot.message));
  var degrees = ask(0, "91+x=360");
  add(!degrees.ok && degrees.message.indexOf("360") >= 0
    ? { ok: true, id: "pie-degrees" }
    : fail("pie-degrees", degrees.message));

  var hint = ask(0, "", {}, "hint");
  add(hint.message.indexOf("100%") >= 0 && hint.message.indexOf("9") < 0
    ? { ok: true, id: "pie-hint-before" }
    : fail("pie-hint-before", hint.message));
  var afterEq = ask(0, "", equation.progress, "hint");
  add(afterEq.message.indexOf("בנו משוואה") < 0 && afterEq.message.indexOf("= 9") < 0
    ? { ok: true, id: "pie-hint-after-equation" }
    : fail("pie-hint-after-equation", afterEq.message));

  var first = ask(0, "", {}, "step");
  add(first.shows[0].indexOf("= 100") >= 0 && first.shows[0].indexOf("x") >= 0 && first.progress.pie.x == null
    ? { ok: true, id: "pie-step-equation" }
    : fail("pie-step-equation", shows(first)));
  var walk = first;
  var guard = 0;
  while (walk.view && walk.view.part && walk.view.part.label === "א" && guard < 8) {
    guard += 1;
    walk = ask(0, "", walk.progress, "step");
  }
  add(walk.progress.pie.x === 9 && walk.progress.done.alef
    ? { ok: true, id: "pie-step-to-x" }
    : fail("pie-step-to-x", shows(walk) + " " + JSON.stringify(walk.progress && walk.progress.pie && walk.progress.pie.x)));

  var reused = ask(0, "", walk.progress, "step");
  add(reused.shows[0].indexOf("9 + 18 + 24") >= 0 && reused.shows[0].indexOf("= 100") < 0
    ? { ok: true, id: "pie-reuse-x" }
    : fail("pie-reuse-x", shows(reused)));
  var totaled = ask(0, "", reused.progress, "step");
  add(totaled.progress.pie.groups.bloc === 51 && totaled.view.entry === "choice"
    ? { ok: true, id: "pie-group-then-choice" }
    : fail("pie-group-then-choice", shows(totaled) + " " + totaled.view.entry));
  var yes = ask(0, "כן", totaled.progress);
  add(yes.ok && yes.progress.done.bloc && yes.view.part.label === "ג"
    ? { ok: true, id: "pie-yes" }
    : fail("pie-yes", yes.message + " " + JSON.stringify(yes.view && yes.view.part)));
  var earlyYes = ask(0, "כן", walk.progress);
  add(earlyYes.ok && earlyYes.progress.done.bloc
    ? { ok: true, id: "pie-direct-yes" }
    : fail("pie-direct-yes", earlyYes.message));
  var wrongNo = ask(0, "לא", walk.progress);
  add(!wrongNo.ok && wrongNo.message.indexOf("50%") >= 0
    ? { ok: true, id: "pie-wrong-no" }
    : fail("pie-wrong-no", wrongNo.message));

  var joinG = ask(0, "ג", yes.progress);
  var joinHe = ask(0, "ה", yes.progress);
  var joinAlef = ask(0, "א", yes.progress);
  add(joinG.ok && joinG.view.solved && joinHe.ok && !joinAlef.ok && joinAlef.message.indexOf("50%") >= 0
    ? { ok: true, id: "pie-pick" }
    : fail("pie-pick", joinG.message + " | " + joinHe.message + " | " + joinAlef.message));
  var already = ask(0, "ב", yes.progress);
  add(!already.ok && already.message.indexOf("כבר") >= 0
    ? { ok: true, id: "pie-pick-in-bloc" }
    : fail("pie-pick-in-bloc", already.message));

  var city = ask(1, "6");
  add(city.ok && city.progress.done.he
    ? { ok: true, id: "pie-city-x" }
    : fail("pie-city-x", city.message));
  var cityNo = ask(1, "לא", city.progress);
  add(cityNo.ok && cityNo.progress.done.bloc
    ? { ok: true, id: "pie-city-no" }
    : fail("pie-city-no", cityNo.message));
  var exact = ask(1, "ג", cityNo.progress);
  add(!exact.ok && exact.message.indexOf("בדיוק") >= 0
    ? { ok: true, id: "pie-exact-50" }
    : fail("pie-exact-50", exact.message));
  var cityJoin = ask(1, "א", cityNo.progress);
  var cityVav = ask(1, "ו", cityNo.progress);
  add(cityJoin.view.solved && cityVav.view.solved
    ? { ok: true, id: "pie-city-pick" }
    : fail("pie-city-pick", cityJoin.message + " " + cityVav.message));

  var both = ask(2, "8+16+2x+26+14+x=100");
  add(both.ok && both.progress.pie.x == null
    ? { ok: true, id: "pie-two-terms" }
    : fail("pie-two-terms", both.message));
  var combined = ask(2, "64+3x=100", both.progress);
  add(combined.ok && combined.progress.pie.eqCurrent.indexOf("64") >= 0
    ? { ok: true, id: "pie-combined" }
    : fail("pie-combined", combined.message + " " + (combined.progress && combined.progress.pie && combined.progress.pie.eqCurrent)));
  var asX = ask(2, "64+2x=100");
  add(!asX.ok && asX.message.indexOf("2x") >= 0
    ? { ok: true, id: "pie-2x-as-x" }
    : fail("pie-2x-as-x", asX.message));
  var asPlus = ask(2, "66+2x=100");
  add(!asPlus.ok && asPlus.message.indexOf("פעמיים") >= 0
    ? { ok: true, id: "pie-2x-as-plus" }
    : fail("pie-2x-as-plus", asPlus.message));
  var xValue = ask(2, "x=12");
  var shownBet = xValue.view.pie && xValue.view.pie.sectors.filter(function (sector) { return sector.label === "ב"; })[0];
  var shownHe = xValue.view.pie && xValue.view.pie.sectors.filter(function (sector) { return sector.label === "ה"; })[0];
  add(xValue.ok && xValue.progress.done.bet && !xValue.progress.done.he && xValue.progress.pie.x === 12 && shownBet && shownBet.text === "12%" && shownHe && shownHe.text === "24%"
    ? { ok: true, id: "pie-x-found" }
    : fail("pie-x-found", xValue.message + " " + JSON.stringify(xValue.progress && xValue.progress.done)));
  var double = ask(2, "2*12=24", xValue.progress);
  add(double.ok && double.progress.done.he
    ? { ok: true, id: "pie-double" }
    : fail("pie-double", double.message));
  var directDouble = ask(2, "24");
  add(directDouble.ok && directDouble.progress.pie.x === 12 && !directDouble.progress.done.bet
    ? { ok: true, id: "pie-direct-2x" }
    : fail("pie-direct-2x", directDouble.message + " " + JSON.stringify(directDouble.progress && directDouble.progress.done)));
  var usedX = ask(2, "12", directDouble.progress);
  add(usedX.ok && usedX.view.part.label === "ב"
    ? { ok: true, id: "pie-then-x" }
    : fail("pie-then-x", usedX.message + " " + JSON.stringify(usedX.view && usedX.view.part)));
  var wrongUse = ask(2, "8+12+16", usedX.progress);
  add(!wrongUse.ok && wrongUse.message.indexOf("x") >= 0
    ? { ok: true, id: "pie-used-x-for-2x" }
    : fail("pie-used-x-for-2x", wrongUse.message));
  var councilNo = ask(2, "לא", usedX.progress);
  add(councilNo.ok && councilNo.view.solved
    ? { ok: true, id: "pie-council-no" }
    : fail("pie-council-no", councilNo.message + " " + JSON.stringify(councilNo.view && councilNo.view.part)));
  var again = ask(2, "", xValue.progress, "step");
  add(again.shows[0].indexOf("2·12") >= 0 && again.shows[0].indexOf("64") < 0
    ? { ok: true, id: "pie-step-after-x" }
    : fail("pie-step-after-x", shows(again)));

  var solution = ask(0, "", {}, "solution");
  var text = (solution.lines || []).map(function (line) { return line.show; }).join(" | ");
  add(solution.view.solved && text.indexOf("= 100") >= 0 && text.indexOf("כן") >= 0 && text.indexOf("ג") >= 0
    ? { ok: true, id: "pie-solution" }
    : fail("pie-solution", text));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-pie: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) { console.log(item.id + ": " + item.detail); });
  if (failed.length) process.exit(1);
}

main();
