"use strict";

var loadEngine = require("./load-engine").loadEngine;
var functionsApi = require("./functions");
var studentDto = require("./student-dto");

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function main() {
  var engine = loadEngine();
  var Q = engine.DoctematicaQuadratic;
  var handle = functionsApi.createFunctionsHandler(engine).handle;
  var level = (engine.DoctematicaCurriculum.levels || []).filter(function (item) {
    return item.id === "calc-poly-1";
  })[0];
  var checks = [];
  function add(result) {
    checks.push(result);
  }
  function call(id, body) {
    body.levelId = "calc-poly-1";
    body.exerciseId = id;
    return handle(body);
  }
  function expect(id, res, ok, errorId) {
    var good = !!res && res.ok === ok && (!errorId || res.errorId === errorId);
    add(good ? { ok: true, id: id } : fail(id, res && (res.errorId + " " + res.message)));
  }

  add(level && level.subtopic === "pre" && level.mode === "fn" && level.title === "פונקציות פולינום"
    ? { ok: true, id: "level" }
    : fail("level", level && level.title));
  add(level && level.exercises.length === 13 ? { ok: true, id: "thirteen" } : fail("thirteen", String(level && level.exercises.length)));
  add(level.exercises[0].id === "calc-poly-1-ex-a001" && level.exercises[12].id === "calc-poly-1-ex-a013"
    ? { ok: true, id: "ids" }
    : fail("ids"));

  function walk(id) {
    var progress = null;
    var i;
    for (i = 0; i < 80; i++) {
      var res = call(id, { intent: "one-step", progress: progress });
      if (res && res.enter === "formula") {
        var written = Q.analyze(res.view.a, res.view.b, res.view.c);
        var typed = written.answer;
        if (written.s == null && written.kind !== "none") {
          typed = "x=(" + (-written.b) + "±√" + written.D + ")/" + (2 * written.a);
        }
        res = call(id, { intent: "check", progress: res.progress, typed: typed });
      }
      if (!res || res.ok === false) return fail(id, res && res.message);
      progress = res.progress;
      if (res.solved) return { ok: true, id: id + "-walk" };
    }
    return fail(id + "-walk", "loop");
  }
  level.exercises.forEach(function (ex) {
    add(walk(ex.id));
  });

  expect("axis", call("calc-poly-1-ex-a001", { intent: "check", typed: "x=0" }), false, "axisSwap");
  var opened = call("calc-poly-1-ex-a001", { intent: "check", typed: "y=0" });
  add(opened && opened.ok && opened.progress && opened.progress.route && opened.progress.route.engine === "root" && !opened.progress.route.roots
    ? { ok: true, id: "route-root" }
    : fail("route-root", JSON.stringify(opened && opened.progress && opened.progress.route)));
  var chain = call("calc-poly-1-ex-a002", { intent: "check", typed: "x^3-7x^2+10x=0" });
  add(chain && chain.ok && chain.progress.route.engine === "chain" ? { ok: true, id: "route-chain" } : fail("route-chain"));
  var factored = call("calc-poly-1-ex-a002", { intent: "check", typed: "x(x^2-7x+10)=0", progress: chain.progress });
  add(factored && factored.ok && factored.view && factored.view.canSplit ? { ok: true, id: "split-ready" } : fail("split-ready", factored && factored.message));
  var split = call("calc-poly-1-ex-a002", { intent: "split", progress: factored.progress });
  add(split && split.ok && split.view && split.view.fork && split.view.input === "fork" && split.view.fork.eqs && split.view.fork.eqs.length === 2 && !split.view.fork.keepMain
    ? { ok: true, id: "split-fork" }
    : fail("split-fork", split && split.message));
  var productProg = null;
  var productGuard;
  for (productGuard = 0; productGuard < 6; productGuard++) {
    var productStep = call("calc-poly-1-ex-a010", { intent: "one-step", progress: productProg });
    productProg = productStep.progress;
    if (productStep.view && productStep.view.input === "fork") break;
  }
  var productMd = call("calc-poly-1-ex-a010", { intent: "formula-enter", md53: true, progress: productProg });
  var productPlain = call("calc-poly-1-ex-a010", { intent: "formula-enter", progress: productProg });
  add(productMd && productMd.md53 === true && productMd.progress && productMd.progress.md53 && /md53/.test(productMd.message || "") && productPlain && !productPlain.md53
    ? { ok: true, id: "product-md53-stays" }
    : fail("product-md53-stays", productMd && productMd.message));
  var openedFormula = call("calc-poly-1-ex-a002", { intent: "formula-enter", md53: true, progress: split.progress });
  add(openedFormula && openedFormula.enter === "formula" && openedFormula.formulaEq && openedFormula.formulaEq.indexOf("x^2") >= 0 && openedFormula.view && openedFormula.view.a === 1
    ? { ok: true, id: "branch-formula" }
    : fail("branch-formula", openedFormula && (openedFormula.message + " " + openedFormula.formulaEq)));
  var ownedEnter = call("calc-poly-1-ex-a002", { intent: "formula-enter", progress: split.progress });
  var ownedAlgebra = (ownedEnter.progress.algebra || []).join("|");
  function ownedTrails(res) {
    return (res.view && res.view.fork && res.view.fork.trails) || [[], []];
  }
  function ownedWork(res) {
    return res.progress && res.progress.chain && res.progress.chain.work && res.progress.chain.work[1];
  }
  var ownedA = call("calc-poly-1-ex-a002", {
    intent: "check", phase: "abc", letter: "a", typed: "1", branch: 1, progress: ownedEnter.progress,
  });
  var workA = ownedWork(ownedA);
  add(ownedA && ownedA.ok && ownedA.nextPhase === "abc" && workA && workA.phase === "abc" && workA.slots && workA.slots.a === "1" && workA.letter === "b" && ownedTrails(ownedA)[1].indexOf("a=1") >= 0 && ownedTrails(ownedA)[0].indexOf("a=1") < 0 && (ownedA.progress.algebra || []).join("|") === ownedAlgebra
    ? { ok: true, id: "branch-owns-a" }
    : fail("branch-owns-a", JSON.stringify(workA)));
  var ownedAway = call("calc-poly-1-ex-a002", { intent: "hint", branch: 0, progress: ownedA.progress });
  var ownedBack = call("calc-poly-1-ex-a002", { intent: "one-step", branch: 1, progress: ownedAway.progress });
  var workB = ownedWork(ownedBack);
  add(ownedBack && ownedBack.ok && ownedBack.nextPhase === "abc" && ownedBack.nextLetter === "c" && ownedBack.fill && ownedBack.fill.b === "-7" && workB && workB.phase === "abc" && workB.slots.a === "1" && workB.slots.b === "-7" && ownedTrails(ownedBack)[0].join("|") === "x=0"
    ? { ok: true, id: "branch-keeps-a-then-b" }
    : fail("branch-keeps-a-then-b", JSON.stringify({ fill: ownedBack && ownedBack.fill, work: workB, trails: ownedTrails(ownedBack) })));
  var ownedBad = call("calc-poly-1-ex-a002", {
    intent: "check", phase: "abc", letter: "c", typed: "3", slots: { a: "1", b: "-7" }, branch: 1, progress: ownedBack.progress,
  });
  add(ownedBad && ownedBad.ok === false && ownedBad.nextPhase === "abc" && ownedBad.nextLetter === "c" && ownedWork(ownedBad).history.indexOf("c=3") < 0
    ? { ok: true, id: "branch-rejects-bad-c" }
    : fail("branch-rejects-bad-c", ownedBad && ownedBad.message));
  var ownedC = call("calc-poly-1-ex-a002", {
    intent: "check", phase: "abc", letter: "c", typed: "10", slots: { a: "1", b: "-7" }, branch: 1, progress: ownedBack.progress,
  });
  var quadTrail = ownedTrails(ownedC)[1] || [];
  add(ownedC && ownedC.ok && ownedC.nextPhase === "plug" && quadTrail.indexOf("a=1") >= 0 && quadTrail.indexOf("b=-7") >= 0 && quadTrail.indexOf("c=10") >= 0 && ownedTrails(ownedC)[0].indexOf("c=10") < 0 && (ownedC.progress.algebra || []).join("|") === ownedAlgebra
    ? { ok: true, id: "branch-owns-abc" }
    : fail("branch-owns-abc", JSON.stringify(ownedTrails(ownedC))));
  var ownedDone = call("calc-poly-1-ex-a002", {
    intent: "check", typed: Q.analyze(1, -7, 10).answer, progress: ownedC.progress,
  });
  add(ownedDone && ownedDone.ok && /x = 0/.test(ownedDone.message || "") && /x = 5/.test(ownedDone.message || "") && /x = 2/.test(ownedDone.message || "")
    ? { ok: true, id: "branch-collects-roots" }
    : fail("branch-collects-roots", ownedDone && ownedDone.message));
  var pointed = call("calc-poly-1-ex-a002", { intent: "check", typed: "(5, 0)", progress: ownedDone.progress });
  var pointTrails = ownedTrails(pointed);
  var pointInQuad = (pointTrails[1] || []).some(function (line) {
    return /\(5,\s*0\)/.test(String(line || "").replace(/\s+/g, ""));
  });
  var pointInZero = (pointTrails[0] || []).some(function (line) {
    return /\(5,\s*0\)/.test(String(line || "").replace(/\s+/g, ""));
  });
  add(pointed && pointed.ok && pointed.view && pointed.view.fork && pointed.view.fork.keepMain && pointInQuad && !pointInZero
    ? { ok: true, id: "point-stays-in-root-column" }
    : fail("point-stays-in-root-column", JSON.stringify(pointTrails)));
  var sqrtChain = call("calc-poly-1-ex-a007", { intent: "check", typed: "x^3-16x=0" });
  var sqrtFact = call("calc-poly-1-ex-a007", { intent: "check", typed: "x(x^2-16)=0", progress: sqrtChain.progress });
  var sqrtSplit = call("calc-poly-1-ex-a007", { intent: "split", progress: sqrtFact.progress });
  var sqrtStep = call("calc-poly-1-ex-a007", { intent: "one-step", branch: 1, progress: sqrtSplit.progress });
  var sqrtTrails = ownedTrails(sqrtStep);
  add(sqrtStep && sqrtStep.ok && sqrtTrails[1].indexOf("x^2=16") >= 0 && sqrtTrails[0].join("|") === "x=0" && (sqrtStep.progress.algebra || []).indexOf("x^2=16") < 0
    ? { ok: true, id: "branch-owns-sqrt" }
    : fail("branch-owns-sqrt", JSON.stringify(sqrtTrails)));
  var sqrtHalf = sqrtSplit;
  var sqrtHalfGuard;
  for (sqrtHalfGuard = 0; sqrtHalfGuard < 6 && !(sqrtHalf.progress.chain && sqrtHalf.progress.chain.solved && sqrtHalf.progress.chain.solved[0] && !sqrtHalf.progress.chain.solved[1]); sqrtHalfGuard++) {
    sqrtHalf = call("calc-poly-1-ex-a007", { intent: "one-step", progress: sqrtHalf.progress });
  }
  var sqrtBefore = ((sqrtHalf.view && sqrtHalf.view.fork && sqrtHalf.view.fork.trails) || [[], []])[1] || [];
  var sqrtFromDone = call("calc-poly-1-ex-a007", { intent: "one-step", branch: 0, progress: sqrtHalf.progress });
  var sqrtAfter = ((sqrtFromDone.view && sqrtFromDone.view.fork && sqrtFromDone.view.fork.trails) || [[], []])[1] || [];
  add(sqrtFromDone && sqrtFromDone.ok && (sqrtFromDone.message || "").indexOf("הענף הזה כבר נפתר") < 0 && sqrtAfter.length > sqrtBefore.length
    ? { ok: true, id: "solved-column-continues-open-branch" }
    : fail("solved-column-continues-open-branch", sqrtFromDone && sqrtFromDone.message));
  var sqrtPoints = sqrtFromDone;
  var sqrtPointGuard;
  for (sqrtPointGuard = 0; sqrtPointGuard < 8 && !(sqrtPoints.progress && sqrtPoints.progress.phase === "points"); sqrtPointGuard++) {
    sqrtPoints = call("calc-poly-1-ex-a007", { intent: "one-step", branch: 0, progress: sqrtPoints.progress });
  }
  var sqrtPoint = call("calc-poly-1-ex-a007", { intent: "one-step", branch: 0, progress: sqrtPoints.progress });
  add(sqrtPoint && sqrtPoint.ok && sqrtPoints.progress.phase === "points" && /\(/.test(sqrtPoint.show || "") && (sqrtPoint.message || "").indexOf("הענף הזה כבר נפתר") < 0
    ? { ok: true, id: "solved-column-writes-point" }
    : fail("solved-column-writes-point", (sqrtPoint && sqrtPoint.message) + " " + (sqrtPoint && sqrtPoint.show)));
  var productHalf = null;
  var productHalfGuard;
  for (productHalfGuard = 0; productHalfGuard < 8; productHalfGuard++) {
    productHalf = call("calc-poly-1-ex-a010", { intent: "one-step", progress: productHalf && productHalf.progress });
    var productFlags = productHalf.progress && productHalf.progress.chain && productHalf.progress.chain.solved;
    if (productFlags && productFlags[1] && !productFlags[0]) break;
  }
  var productNext = call("calc-poly-1-ex-a010", { intent: "one-step", branch: 1, progress: productHalf.progress });
  var productAbc = call("calc-poly-1-ex-a010", { intent: "one-step", branch: 1, progress: productNext.progress });
  add(productNext && productNext.enter === "formula" && productNext.formulaBranch === 0 && productAbc && productAbc.fill && productAbc.fill.a === "1" && (productAbc.message || "").indexOf("הענף הזה כבר נפתר") < 0
    ? { ok: true, id: "solved-linear-opens-quadratic" }
    : fail("solved-linear-opens-quadratic", JSON.stringify({ enter: productNext && productNext.enter, branch: productNext && productNext.formulaBranch, fill: productAbc && productAbc.fill, message: productAbc && productAbc.message })));
  var cubeProg = null;
  var cubeClosed = null;
  var cubeGuard;
  for (cubeGuard = 0; cubeGuard < 10; cubeGuard++) {
    var cubeStep = call("calc-poly-1-ex-a003", { intent: "one-step", progress: cubeProg });
    cubeProg = cubeStep.progress;
    if (cubeProg && cubeProg.phase === "points") {
      cubeClosed = cubeStep;
      break;
    }
  }
  var cubeParallel = cubeClosed && cubeClosed.parallel && cubeClosed.parallel.parallel;
  var cubeText = cubeParallel ? JSON.stringify(cubeParallel) : "";
  var cubeForkTrails = cubeClosed && cubeClosed.view && cubeClosed.view.fork && cubeClosed.view.fork.trails;
  var cubeForkText = cubeForkTrails ? JSON.stringify(cubeForkTrails) : "";
  add(cubeParallel && !cubeClosed.historyFork && cubeClosed.view && cubeClosed.view.fork && cubeClosed.view.fork.keepMain && cubeForkText.indexOf("x^2=0") >= 0 && cubeText.indexOf("x=0") >= 0 && cubeText.indexOf("5x-2=0") >= 0 && cubeText.indexOf("x=2/5") >= 0
    ? { ok: true, id: "fork-history" }
    : fail("fork-history", cubeForkText + " " + cubeText));
  var quart = null;
  var quartSplit = null;
  var quartOpen;
  for (quartOpen = 0; quartOpen < 8; quartOpen++) {
    var quartStepOpen = call("calc-poly-1-ex-a009", { intent: "one-step", progress: quart && quart.progress });
    quart = quartStepOpen;
    if (quart.view && quart.view.input === "fork") {
      quartSplit = quart;
      break;
    }
  }
  add(quartSplit && quartSplit.view && quartSplit.view.input === "fork" && quartSplit.view.fork && quartSplit.view.fork.eqs.length === 2
    ? { ok: true, id: "quart-column-input" }
    : fail("quart-column-input", quartSplit && quartSplit.view && quartSplit.view.input));
  var quartRight = call("calc-poly-1-ex-a009", { intent: "one-step", branch: 1, progress: quartSplit.progress });
  var quartTrails = (quartRight.view && quartRight.view.fork && quartRight.view.fork.trails) || [];
  add(quartRight && quartRight.ok && quartTrails[1] && quartTrails[1].indexOf("x^2=4") >= 0 && quartTrails[0] && quartTrails[0].indexOf("x=0") < 0
    ? { ok: true, id: "quart-active-column" }
    : fail("quart-active-column", JSON.stringify(quartTrails)));
  var quartPoint = null;
  var quartProg = quartSplit.progress;
  var quartGuard;
  for (quartGuard = 0; quartGuard < 8; quartGuard++) {
    var quartStep = call("calc-poly-1-ex-a009", { intent: "one-step", progress: quartProg });
    quartProg = quartStep.progress;
    if (quartProg && quartProg.phase === "points") {
      quartPoint = quartStep;
      break;
    }
  }
  var quartAgain = call("calc-poly-1-ex-a009", { intent: "check", typed: "(0, 0)", progress: quartProg });
  var againCols = (quartAgain && quartAgain.parallel && quartAgain.parallel.parallel) || [];
  var pointInColumn = againCols.some(function (col) {
    var blob = [col.label].concat(col.steps || []).join(" ").replace(/\s+/g, "");
    return /x\^2=0/.test(blob) && /0,0/.test(blob);
  });
  add(quartPoint && quartPoint.parallel && quartPoint.parallel.parallel && !quartPoint.historyFork && quartAgain && quartAgain.ok && pointInColumn && againCols.length === quartPoint.parallel.parallel.length
    ? { ok: true, id: "quart-archive-once" }
    : fail("quart-archive-once", JSON.stringify({
      closed: !!(quartPoint && quartPoint.parallel),
      fork: !!(quartPoint && quartPoint.historyFork),
      show: quartAgain && quartAgain.show,
      cols: againCols.map(function (col) { return col.label + ":" + (col.steps || []).join(" "); }),
    })));
  var signProg = quartAgain.progress;
  var signCard = null;
  var signGuard;
  for (signGuard = 0; signGuard < 12 && signProg; signGuard++) {
    var signStep = call("calc-poly-1-ex-a009", { intent: "one-step", progress: signProg });
    if (!signStep || !signStep.ok) break;
    signProg = signStep.progress;
    if (signStep.parallel && signStep.parallel.parallel && signStep.parallel.parallel.length >= 2) {
      var signLabels = signStep.parallel.parallel.map(function (col) { return col.label; }).join(" ");
      if (/חיובי/.test(signLabels) && /שלילי/.test(signLabels)) {
        signCard = signStep.parallel;
        break;
      }
    }
  }
  add(signCard
    ? { ok: true, id: "sign-two-columns" }
    : fail("sign-two-columns", "positive and negative must arrive as one parallel step"));
  var chainSol = call("calc-poly-1-ex-a002", { intent: "solution" });
  var splitFork = (chainSol.steps || []).filter(function (step) { return step && step.parallel; })[0];
  add(splitFork && splitFork.parallel.length >= 2 && splitFork.parallel.some(function (col) { return /x\s*=\s*0/.test(JSON.stringify(col.steps)); }) && splitFork.parallel.some(function (col) { return /x\^2/.test(JSON.stringify(col.steps)); })
    ? { ok: true, id: "split-solution" }
    : fail("split-solution", JSON.stringify(splitFork && splitFork.parallel && splitFork.parallel.map(function (col) { return col.label; }))));
  expect(
    "divided",
    call("calc-poly-1-ex-a002", {
      intent: "check",
      typed: "x^2-7x+10=0",
      progress: chain.progress,
    }),
    false,
    "dividedByVariable"
  );
  var points = {
    poly: true,
    task: 0,
    phase: "points",
    algebra: [],
    route: { engine: "chain", start: "5x^3-2x^2=0" },
    points: [],
    plugs: {},
    paramEq: "",
    chain: null,
    formulaBranch: null,
    signGot: [],
  };
  expect("dup", call("calc-poly-1-ex-a003", { intent: "check", typed: "(0, 0), (0, 0)", progress: points }), false, "duplicateZero");
  var frac = call("calc-poly-1-ex-a003", { intent: "check", typed: "(0, 0), (2/5, 0)", progress: points });
  add(frac && frac.ok && frac.progress.task === 1 ? { ok: true, id: "one-intercept" } : fail("one-intercept", frac && frac.message));
  expect(
    "bare-x",
    call("calc-poly-1-ex-a001", {
      intent: "check",
      typed: "x=2",
      progress: Object.assign({}, points, { route: { engine: "root", start: "x^3-8=0" }, phase: "points" }),
    }),
    false,
    "pointsMissing"
  );
  expect("value-zero", call("calc-poly-1-ex-a004", { intent: "check", typed: "f(x)=0" }), false, "solveInsteadOfPlug");
  var both = call("calc-poly-1-ex-a004", { intent: "check", typed: "f(2)=-32, f(-2)=32" });
  add(both && both.ok && both.progress.task === 1 ? { ok: true, id: "values" } : fail("values", both && both.message));
  var started = call("calc-poly-1-ex-a004", { intent: "check", typed: "f(2)=-4*2^3" });
  var follow = call("calc-poly-1-ex-a004", { intent: "one-step", progress: started.progress });
  add(started && started.ok && started.message.indexOf("לחשב") >= 0 && follow && follow.show && follow.show.indexOf("f(2)") >= 0 && follow.show.indexOf("-32") >= 0
    ? { ok: true, id: "continue-plug" }
    : fail("continue-plug", (started && started.message) + " | " + (follow && follow.show)));
  expect(
    "solve-not-plug",
    call("calc-poly-1-ex-a004", {
      intent: "check",
      typed: "f(2)=-32",
      progress: both.progress,
    }),
    false,
    "plugInsteadOfSolve"
  );
  expect("bare-power", call("calc-poly-1-ex-a005", { intent: "check", typed: "f(-3)=-3^4-k" }), false, "bareNegativePower");
  expect("even", call("calc-poly-1-ex-a005", { intent: "check", typed: "f(-3)=-81-k" }), false, "evenPowerSign");
  var cmpProg = null;
  var cmpShows = [];
  var cmpGuard;
  for (cmpGuard = 0; cmpGuard < 6; cmpGuard++) {
    var cmpStep = call("calc-poly-1-ex-a005", { intent: "one-step", progress: cmpProg });
    cmpProg = cmpStep.progress;
    if (cmpStep.show) cmpShows.push(cmpStep.show);
    if (cmpProg && cmpProg.task !== 0) break;
  }
  add(cmpShows.join(" ").indexOf("81-k") >= 0 && cmpShows.join(" ").indexOf("f(-3)") >= 0 && cmpShows.join(" ").indexOf("f(3)") >= 0
    ? { ok: true, id: "compare-computed" }
    : fail("compare-computed", cmpShows.join(" | ")));
  var cmpSol = call("calc-poly-1-ex-a005", { intent: "solution" });
  add((cmpSol.steps || []).join(" ").indexOf("81-k") >= 0 ? { ok: true, id: "compare-solution" } : fail("compare-solution"));
  var compared = call("calc-poly-1-ex-a005", { intent: "check", typed: "f(-3)=81-k, f(3)=81-k" });
  add(compared && compared.ok && compared.progress.task === 1 ? { ok: true, id: "compare" } : fail("compare", compared && compared.message));
  expect("k-sign", call("calc-poly-1-ex-a005", { intent: "check", typed: "k=-16", progress: compared.progress }), false, "evenPowerSign");
  var swappedPlug = call("calc-poly-1-ex-a005", {
    intent: "check",
    typed: "0=(-2)^4-k",
    progress: { poly: true, task: 1, phase: "work", algebra: [], route: null, points: [], plugs: {}, paramEq: "", chain: null, formulaBranch: null, signGot: [], known: [] },
  });
  add(swappedPlug && swappedPlug.ok ? { ok: true, id: "swapped-plug" } : fail("swapped-plug", swappedPlug && swappedPlug.message));
  var cube = call("calc-poly-1-ex-a008", { intent: "hint" });
  var curve = (cube && cube.view && cube.view.figure && cube.view.figure.curve) || [];
  var atZero = curve.filter(function (p) { return Math.abs(p.qx) < 0.08; }).sort(function (a, b) { return Math.abs(a.qx) - Math.abs(b.qx); })[0];
  var leftCross = curve.some(function (p, i) {
    var nxt = curve[i + 1];
    return nxt && p.qx < -0.2 && ((p.qy <= 0 && nxt.qy >= 0) || (p.qy >= 0 && nxt.qy <= 0));
  });
  add(atZero && atZero.qy > 0.3 && leftCross ? { ok: true, id: "cube-shift" } : fail("cube-shift", JSON.stringify(atZero)));
  var productFig = call("calc-poly-1-ex-a010", { intent: "hint" });
  var productCurve = (productFig && productFig.view && productFig.view.figure && productFig.view.figure.curve) || [];
  var productHump = productCurve.some(function (p) { return p.qx > 0.05 && p.qx < 0.25 && p.qy > 0.08; });
  var productDip = productCurve.some(function (p) { return p.qx > 0.35 && p.qx < 0.6 && p.qy < -0.4; });
  var productFlat = productCurve.filter(function (p) { return p.qx > 0.15; }).every(function (p) { return Math.abs(p.qy) < 0.02; });
  add(productHump && productDip && !productFlat
    ? { ok: true, id: "product-graph" }
    : fail("product-graph", JSON.stringify(productCurve.filter(function (p, i) { return i % 8 === 0; }))));
  var foundK = call("calc-poly-1-ex-a005", { intent: "check", typed: "k=16", progress: compared.progress });
  add(foundK && foundK.ok && foundK.solved ? { ok: true, id: "param" } : fail("param", foundK && foundK.message));
  expect("quarter", call("calc-poly-1-ex-a006", { intent: "check", typed: "f(-1)=-7/4" }), true);
  expect("bare-frac-power", call("calc-poly-1-ex-a006", { intent: "check", typed: "f(-1)=(-1^4)/4-2" }), false, "bareNegativePower");
  expect("bare-even-square", call("calc-poly-1-ex-a006", { intent: "check", typed: "f(-1)=(-1^2)/4-2" }), false, "bareNegativePower");
  expect("paren-even-power", call("calc-poly-1-ex-a006", { intent: "check", typed: "f(-1)=(-1)^4/4+2*(-1)" }), true);
  expect(
    "verify-solve",
    call("calc-poly-1-ex-a006", {
      intent: "check",
      typed: "f(x)=0",
      progress: { poly: true, task: 1, phase: "work", algebra: [], route: null, points: [], plugs: {}, paramEq: "", chain: null, formulaBranch: null, signGot: [] },
    }),
    false,
    "solveInsteadOfPlug"
  );
  var odd = {
    poly: true,
    task: 0,
    phase: "algebra",
    algebra: ["x^3=-64"],
    route: { engine: "root", start: "x^3+64=0" },
    points: [],
    plugs: {},
    paramEq: "",
    chain: null,
    formulaBranch: null,
    signGot: [],
  };
  expect("odd", call("calc-poly-1-ex-a008", { intent: "check", typed: "אין", progress: odd }), false, "oddRoot");
  var sign = {
    poly: true,
    task: 1,
    phase: "sign",
    algebra: [],
    route: null,
    points: [{ x: -4, y: 0 }, { x: 0, y: 0 }, { x: 4, y: 0 }],
    plugs: {},
    paramEq: "",
    chain: null,
    formulaBranch: null,
    signGot: [],
  };
  expect("zero-in", call("calc-poly-1-ex-a007", { intent: "check", domains: { pos: "−4≤x≤0" }, progress: sign }), false, "zeroIncludedInPositive");
  expect("swap", call("calc-poly-1-ex-a007", { intent: "check", domains: { pos: "x<−4 או 0<x<4" }, progress: sign }), false, "positiveNegativeReversed");
  var partial = call("calc-poly-1-ex-a007", { intent: "check", domains: { pos: "x>4" }, progress: sign });
  add(partial && partial.ok === true && !partial.solved && partial.progress && partial.progress.signGot && partial.progress.signGot.length === 1 && partial.progress.task === 1
    ? { ok: true, id: "partial" }
    : fail("partial", partial && (partial.errorId + " " + partial.message + " task=" + (partial.progress && partial.progress.task))));
  var partialDone = call("calc-poly-1-ex-a007", { intent: "check", domains: { pos: "−4<x<0" }, progress: partial.progress });
  add(partialDone && partialDone.ok && partialDone.progress.task === 2
    ? { ok: true, id: "partial-rest" }
    : fail("partial-rest", partialDone && partialDone.message));
  expect("y-bound", call("calc-poly-1-ex-a007", { intent: "check", domains: { pos: "y>0" }, progress: sign }), false, "yBound");
  var pos = call("calc-poly-1-ex-a007", { intent: "check", domains: { pos: "−4<x<0 או x>4" }, progress: sign });
  add(pos && pos.ok && pos.progress.task === 2 ? { ok: true, id: "positive" } : fail("positive", pos && pos.message));
  var neg = call("calc-poly-1-ex-a007", { intent: "check", domains: { neg: "x<−4 או 0<x<4" }, progress: pos.progress });
  add(neg && neg.ok && neg.solved ? { ok: true, id: "negative" } : fail("negative", neg && neg.message));

  var openedProblem = studentDto.openProblem(engine, "calc-poly-1", 6);
  add(openedProblem && openedProblem.problem && openedProblem.problem.exerciseId === "calc-poly-1-ex-a007" && !openedProblem.problem.fn
    ? { ok: true, id: "dto" }
    : fail("dto"));
  add(openedProblem && openedProblem.view && openedProblem.view.figure && openedProblem.view.figure.marks && openedProblem.view.figure.marks.length === 0
    ? { ok: true, id: "hidden-marks" }
    : fail("hidden-marks"));
  var plugSol = call("calc-poly-1-ex-a012", { intent: "solution" });
  var plugText = ((plugSol && plugSol.steps) || []).join(" ");
  add(plugText.indexOf("-7^3") >= 0 && plugText.indexOf("15*7^2") >= 0 && plugText.indexOf("(7)^") < 0 && plugText.indexOf("*(7)") < 0 && plugText.indexOf("*(1)") < 0 && plugText.indexOf("(1)^") < 0
    ? { ok: true, id: "positive-plug" }
    : fail("positive-plug", plugText.slice(0, 300)));
  var solution = call("calc-poly-1-ex-a007", { intent: "solution" });
  var told = ((solution && solution.steps) || []).concat((solution && solution.notes) || []).join(" ");
  add(solution && solution.steps && solution.steps.indexOf("f(x)=0") >= 0 && told.indexOf("f(x) > 0") >= 0 && told.indexOf("f(x) < 0") >= 0
    ? { ok: true, id: "solution" }
    : fail("solution", told.slice(0, 240)));
  var chainOpen = call("calc-poly-1-ex-a009", { intent: "check", typed: "f(x)=0" });
  add(chainOpen && chainOpen.progress && chainOpen.progress.route && chainOpen.progress.route.engine === "chain"
    ? { ok: true, id: "w-chain" }
    : fail("w-chain"));
  var touchSign = { poly: true, task: 1, phase: "sign", algebra: [], route: null, points: [{ x: -2, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 }], plugs: {}, paramEq: "", chain: null, formulaBranch: null, signGot: [], known: [] };
  var oneSide = call("calc-poly-1-ex-a009", { intent: "check", domains: { pos: "x>2" }, progress: touchSign });
  add(oneSide && oneSide.ok && !oneSide.solved && oneSide.progress.signGot.length === 1
    ? { ok: true, id: "partial-touch" }
    : fail("partial-touch", oneSide && oneSide.message));
  var flipped = call("calc-poly-1-ex-a009", { intent: "check", domains: { pos: "x>2 או −2<x<0" }, progress: touchSign });
  add(flipped && flipped.ok === false && flipped.message && flipped.message.indexOf("נוגע") >= 0
    ? { ok: true, id: "touch-note" }
    : fail("touch-note", flipped && (flipped.errorId + " " + flipped.message)));
  var product = call("calc-poly-1-ex-a010", { intent: "check", typed: "y=0" });
  var productHint = call("calc-poly-1-ex-a010", { intent: "hint", progress: product.progress });
  add(productHint && productHint.hint && productHint.hint.indexOf("פצלו") >= 0
    ? { ok: true, id: "product-hint" }
    : fail("product-hint", productHint && productHint.hint));
  expect("early-round", call("calc-poly-1-ex-a010", { intent: "check", typed: "(6.85, 0)", progress: Object.assign({}, product.progress, { phase: "points", points: [] }) }), false, "earlyRound");
  var decimals = call("calc-poly-1-ex-a010", { intent: "check", typed: "(6.854, 0), (0.146, 0), (2, 0)", progress: Object.assign({}, product.progress, { phase: "points", points: [] }) });
  add(decimals && decimals.ok && decimals.progress.task === 1 ? { ok: true, id: "three-decimals" } : fail("three-decimals", decimals && decimals.message));
  expect("swap-plug", call("calc-poly-1-ex-a011", { intent: "check", typed: "f(0)=3" }), false, "swappedPlug");
  var biquadOpen = call("calc-poly-1-ex-a013", { intent: "check", typed: "f(x)=0" });
  add(biquadOpen && biquadOpen.progress.route.engine === "biquad" ? { ok: true, id: "biquad-route" } : fail("biquad-route"));
  var biquadProg = null;
  var biquadDone = null;
  var biquadGuard;
  for (biquadGuard = 0; biquadGuard < 40 && !(biquadDone && biquadDone.parallel); biquadGuard++) {
    var biquadStep = call("calc-poly-1-ex-a013", { intent: "one-step", progress: biquadProg });
    if (biquadStep && biquadStep.enter === "formula") {
      var biquadWritten = Q.analyze(biquadStep.view.a, biquadStep.view.b, biquadStep.view.c);
      biquadStep = call("calc-poly-1-ex-a013", { intent: "check", progress: biquadStep.progress, typed: biquadWritten.answer });
    }
    biquadProg = biquadStep.progress;
    if (biquadProg && biquadProg.phase !== "points" && biquadProg.task > 0 && biquadStep.parallel) biquadDone = biquadStep;
  }
  var biquadCols = (biquadDone && biquadDone.parallel && biquadDone.parallel.parallel) || [];
  function biquadHas(label, point) {
    return biquadCols.some(function (col) {
      return String(col.label || "").replace(/\s+/g, "") === label && (col.steps || []).indexOf(point) >= 0;
    });
  }
  add(biquadHas("x^2=4", "(-2, 0)") && biquadHas("x^2=4", "(2, 0)") && biquadHas("x^2=1", "(-1, 0)") && biquadHas("x^2=1", "(1, 0)") && !biquadHas("x^2=4", "(-1, 0)")
    ? { ok: true, id: "biquad-point-stays-with-its-root" }
    : fail("biquad-point-stays-with-its-root", JSON.stringify(biquadCols)));
  expect("k-range", call("calc-poly-1-ex-a009", { intent: "check", typed: "k>2", progress: { poly: true, task: 3, phase: "level", algebra: [], route: null, points: [], plugs: {}, paramEq: "", chain: null, formulaBranch: null, signGot: [], known: [] } }), false, "levelRange");

  var hint = call("calc-poly-1-ex-a001", { intent: "hint" });
  add(hint && hint.hints && hint.hints[0].indexOf("y") >= 0 && hint.hints[0].indexOf("x = 2") < 0
    ? { ok: true, id: "hint" }
    : fail("hint", hint && hint.hints && hint.hints[0]));

  var appSrc = require("fs").readFileSync(require("path").join(__dirname, "../js/app.js"), "utf8");
  var stashAt = appSrc.indexOf("function stashFnFormulaTrail");
  var stashBody = stashAt >= 0 ? appSrc.slice(stashAt, stashAt + 1100) : "";
  var forkKeep = stashBody.indexOf("formulaSplitOwned");
  var globalKeep = stashBody.indexOf("⌘formula");
  add(forkKeep >= 0 && globalKeep > forkKeep && stashBody.indexOf("parkFormulaSession") > forkKeep && stashBody.indexOf("parkFormulaSession") < globalKeep
    ? { ok: true, id: "formula-stays-in-fork-column" }
    : fail("formula-stays-in-fork-column", "after the formula, its steps stay in the split column"));

  var mergeAt = appSrc.indexOf("function mergeParkedFormula");
  var mergeEnd = appSrc.indexOf("function showFormulaSession", mergeAt);
  var mergeBody = mergeAt >= 0 && mergeEnd > mergeAt ? appSrc.slice(mergeAt, mergeEnd) : "";
  add(mergeBody.indexOf("htmlSteps.slice(0, -1)") >= 0 && mergeBody.indexOf("seenAnswers") >= 0
    ? { ok: true, id: "archived-column-keeps-one-answer" }
    : fail("archived-column-keeps-one-answer", "the finished column keeps the formula once and one answer line"));

  var bad = checks.filter(function (item) { return !item.ok; });
  console.log(JSON.stringify({ passed: checks.length - bad.length, failed: bad.length, failures: bad }, null, 2));
  if (bad.length) process.exit(1);
}

main();
