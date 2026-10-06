"use strict";

var loadEngine = require("./load-engine").loadEngine;
var functionsApi = require("./functions");
var intervalsApi = require("./intervals");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function isParallel(step) {
  return !!(step && Array.isArray(step.parallel) && step.parallel.length >= 2);
}

function columnText(col) {
  return (col.steps || []).map(function (step) {
    if (step && step.parallel) return step.parallel.map(columnText).join(" ");
    if (step && step.eq != null) return String(step.eq);
    return String(step || "");
  }).join("\n");
}

function topText(step) {
  if (isParallel(step)) return "";
  if (step && step.eq != null) return String(step.eq);
  return String(step || "");
}

function main() {
  var engine = loadEngine();
  var handle = functionsApi.createFunctionsHandler(engine).handle;
  var intervals = intervalsApi.createIntervalsHandler(engine);
  var checks = [];
  function add(result) {
    checks.push(result);
  }
  function call(id, body) {
    body.levelId = "calc-poly-1";
    body.exerciseId = id;
    return handle(body);
  }

  var chainSol = call("calc-poly-1-ex-a002", { intent: "solution" });
  var forks = (chainSol.steps || []).filter(isParallel);
  var fork = forks[0];
  var before = [];
  var seen = false;
  (chainSol.steps || []).forEach(function (step) {
    if (step === fork) {
      seen = true;
      return;
    }
    if (!seen) before.push(topText(step));
  });
  add(fork && fork.parallel.length === 2
    ? { ok: true, id: "split-two-columns" }
    : fail("split-two-columns", JSON.stringify(fork && fork.parallel && fork.parallel.map(function (col) { return col.label; }))));
  var quadCol = fork && fork.parallel.filter(function (col) { return /x\^2|x²/.test(col.label + columnText(col)); })[0];
  var lineCol = fork && fork.parallel.filter(function (col) { return col !== quadCol; })[0];
  add(lineCol && /x\s*=\s*0/.test(columnText(lineCol)) && quadCol && /a\s*=/.test(columnText(quadCol)) && !/a\s*=/.test(before.join("\n"))
    ? { ok: true, id: "formula-stays-in-column" }
    : fail("formula-stays-in-column", JSON.stringify({ before: before, quad: quadCol && columnText(quadCol), line: lineCol && columnText(lineCol) })));
  add(lineCol && columnText(lineCol).split("\n").filter(Boolean).length >= 1 && quadCol && columnText(quadCol).split("\n").filter(Boolean).length >= 3
    ? { ok: true, id: "branch-chains" }
    : fail("branch-chains", JSON.stringify({ line: lineCol && columnText(lineCol), quad: quadCol && columnText(quadCol) })));

  var owned = call("calc-poly-1-ex-a002", { intent: "check", typed: "x^3-7x^2+10x=0" });
  var fact = call("calc-poly-1-ex-a002", { intent: "check", typed: "x(x^2-7x+10)=0", progress: owned.progress });
  var split = call("calc-poly-1-ex-a002", { intent: "split", progress: fact.progress });
  var letter = call("calc-poly-1-ex-a002", {
    intent: "check",
    phase: "abc",
    letter: "a",
    typed: "1",
    branch: 1,
    progress: split.progress,
  });
  var cols = letter && letter.parallel && letter.parallel.parallel;
  add(cols && cols.length === 2 && columnText(cols[1]).indexOf("a=1") >= 0 && columnText(cols[0]).indexOf("a=1") < 0
    ? { ok: true, id: "next-step-active-branch" }
    : fail("next-step-active-branch", JSON.stringify(cols && cols.map(columnText))));

  var both = call("calc-poly-1-ex-a003", { intent: "solution" });
  var bothFork = (both.steps || []).filter(isParallel)[0];
  add(bothFork && bothFork.parallel.every(function (col) { return columnText(col).split("\n").filter(Boolean).length >= 2; })
    ? { ok: true, id: "two-branches-several-steps" }
    : fail("two-branches-several-steps", JSON.stringify(bothFork && bothFork.parallel.map(columnText))));

  var signSol = call("calc-poly-1-ex-a007", { intent: "solution" });
  var signFork = (signSol.steps || []).filter(function (step) {
    return isParallel(step) && /חיובי/.test(step.parallel.map(function (col) { return col.label; }).join(" "));
  })[0];
  add(signFork && signFork.parallel.length === 2 && /שלילי/.test(signFork.parallel.map(function (col) { return col.label; }).join(" "))
    ? { ok: true, id: "sign-two-parts" }
    : fail("sign-two-parts", JSON.stringify(signFork && signFork.parallel && signFork.parallel.map(function (col) { return col.label; }))));
  var flatSign = (signSol.steps || []).filter(function (step) {
    return typeof step === "string" && /תחומי חיוביות|תחומי שליליות/.test(step);
  });
  add(signFork && !flatSign.length
    ? { ok: true, id: "sign-not-flattened" }
    : fail("sign-not-flattened", JSON.stringify(flatSign)));

  var linear = handle({ intent: "solution", levelId: "calc-linear-1", exerciseIndex: 1 });
  var linearForks = (linear.steps || []).filter(isParallel);
  function labeled(list, a, b) {
    return list.filter(function (step) {
      var labels = step.parallel.map(function (col) { return col.label; }).join(" ");
      return labels.indexOf(a) >= 0 && labels.indexOf(b) >= 0;
    })[0];
  }
  var mono = labeled(linearForks, "עלייה", "ירידה");
  var axes = labeled(linearForks, "ציר y", "ציר x");
  var sign = labeled(linearForks, "חיוביות", "שליליות");
  add(mono && mono.parallel.length === 2 ? { ok: true, id: "mono-two-parts" } : fail("mono-two-parts", JSON.stringify(linearForks.map(function (step) { return step.parallel.map(function (col) { return col.label; }); }))));
  add(axes && axes.parallel.length === 2 && axes.parallel.every(function (col) { return col.steps.length >= 1; })
    ? { ok: true, id: "axes-two-parts" }
    : fail("axes-two-parts", JSON.stringify(axes && axes.parallel)));
  add(sign && sign.parallel.length === 2 ? { ok: true, id: "fn-sign-two-parts" } : fail("fn-sign-two-parts"));
  add(linearForks.length && linearForks.every(function (step) { return (linear.steps || []).indexOf(step) >= 0; })
    ? { ok: true, id: "full-solution-keeps-parallel" }
    : fail("full-solution-keeps-parallel"));

  var three = intervals.handle({
    intent: "solution",
    op: "intersection",
    conds: ["x > 1", "x < 8", "x > 0"],
  });
  var threeFork = (three.steps || []).filter(isParallel)[0];
  add(threeFork && threeFork.parallel.length === 3 && threeFork.parallel.every(function (col) { return col.steps && col.steps.length >= 1; })
    ? { ok: true, id: "three-columns" }
    : fail("three-columns", JSON.stringify(threeFork && threeFork.parallel && threeFork.parallel.length)));

  var progress = null;
  var signCheck = null;
  [
    { typed: "f(3)=3+7" },
    { typed: "f(3)=10" },
    { typed: "f(-8)=-8+7" },
    { typed: "f(-8)=-1" },
    { typed: "(-8,-1)" },
    { typed: "x+7=0" },
    { typed: "x=-7" },
    { typed: "(-7,0)" },
    { typed: "חיובי: x > -7, שלילי: x < -7" },
  ].forEach(function (step) {
    var out = handle({
      intent: "check",
      levelId: "calc-linear-1",
      exerciseIndex: 0,
      progress: progress,
      typed: step.typed,
    });
    progress = out.progress;
    if (step.typed.indexOf("חיובי") === 0) signCheck = out;
  });
  var studentCols = signCheck && signCheck.parallel && signCheck.parallel.parallel;
  add(studentCols && studentCols.length === 2 && columnText(studentCols[0]).indexOf("חיובי") < 0 && /x/.test(columnText(studentCols[0])) && /x/.test(columnText(studentCols[1]))
    ? { ok: true, id: "student-sign-parts" }
    : fail("student-sign-parts", JSON.stringify(studentCols && studentCols.map(function (col) { return col.label + ":" + columnText(col); }))));

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-parallel: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL", item.id, item.detail);
  });
  if (failed.length) process.exit(1);
}

main();
