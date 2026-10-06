"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var handleHighChain = require("./high-chain").handleHighChain;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function walk(engine, start) {
  var Q = engine.DoctematicaQuadratic;
  var hist = [start];
  var factor = { split: false, trails: [], pending: [] };
  var guard = 0;
  while (guard < 40) {
    guard += 1;
    var res = handleHighChain(engine, { intent: "one-step", start: start, history: hist, factor: factor });
    if (!res || !res.ok) return fail(start, (res && res.message) || "one-step");
    if (res.solvedAll || res.solved) return { ok: true, id: start };
    if (res.path === "formula" || res.enter === "formula") {
      if (!res.view || res.view.a == null) return fail(start, "formula-view");
      var line = res.view.kind === "none" ? "אין פתרון ממשי" : Q.analyze(res.view.a, res.view.b, res.view.c).answer;
      var chk = handleHighChain(engine, { intent: "check", start: start, history: hist, typed: line, factor: factor });
      if (!chk || !chk.ok) return fail(start, "formula-roots " + ((chk && chk.message) || ""));
      factor = { split: true, trails: chk.trails || [], pending: chk.pending || [] };
      if (chk.solvedAll || chk.solved) return { ok: true, id: start };
      continue;
    }
    if (res.split) {
      factor = { split: true, trails: res.trails || [], pending: res.pending || [] };
      continue;
    }
    if (res.step) {
      if (!factor.split) hist.push(res.step);
      else factor = { split: true, trails: res.trails || [], pending: res.pending || [] };
      continue;
    }
    return fail(start, res.hint || res.message || "stuck");
  }
  return fail(start, "loop");
}

function main() {
  var engine = loadEngine();
  var level = (engine.DoctematicaCurriculum.levels || []).filter(function (item) {
    return item.id === "high-chain-4";
  })[0];
  var checks = [];
  function add(result) {
    checks.push(result);
  }
  add(level && level.exercises.length === 18 ? { ok: true, id: "eighteen" } : fail("eighteen", String(level && level.exercises.length)));
  add(level && level.exercises[0].n === 44 && level.exercises[17].n === 61 ? { ok: true, id: "site-numbers" } : fail("site-numbers", ""));

  (level.exercises || []).forEach(function (ex) {
    add(walk(engine, ex.start));
  });

  ["x^3=(-1)/125", "x^3=-1/125", "x^3=(-8)/27", "x^3=-8/27"].forEach(function (line) {
    var readable = null;
    try {
      readable = engine.DoctematicaQuadratic.analyzeHighRootStart(line);
    } catch (err) {
      readable = null;
    }
    add(readable && readable.n === 3
      ? { ok: true, id: "root-reads-" + line }
      : fail("root-reads-" + line, readable ? JSON.stringify(readable) : "unreadable"));
  });

  function generatedDivideLine(start) {
    var hist = [start];
    var factor = { split: false, trails: [], pending: [] };
    var guard = 0;
    while (guard < 8) {
      guard += 1;
      var res = handleHighChain(engine, { intent: "one-step", start: start, history: hist, factor: factor });
      if (!res || !res.ok) return "";
      var blob = JSON.stringify(res);
      var found = blob.match(/x\^3=\(-?\d+\)\/\d+/);
      if (found) return found[0];
      if (res.solvedAll || res.solved) return "";
      if (res.split) {
        factor = { split: true, trails: res.trails || [], pending: res.pending || [] };
        continue;
      }
      if (res.step) {
        if (!factor.split) hist.push(res.step);
        else factor = { split: true, trails: res.trails || [], pending: res.pending || [] };
      }
    }
    return "";
  }
  var generated = generatedDivideLine("125x^4+x=0");
  var reread = null;
  try {
    reread = generated ? engine.DoctematicaQuadratic.analyzeHighRootStart(generated) : null;
  } catch (err2) {
    reread = null;
  }
  add(generated && reread
    ? { ok: true, id: "engine-line-rereadable" }
    : fail("engine-line-rereadable", generated || "no generated line"));

  var lost = handleHighChain(engine, {
    intent: "check",
    start: "x^3-9x=0",
    history: ["x^3-9x=0"],
    typed: "x^2-9=0",
  });
  add(lost && !lost.ok && lost.errorId === "dividedByVariable" && /גורם משותף/.test(lost.message) ? { ok: true, id: "lost-root" } : fail("lost-root", JSON.stringify(lost)));

  var sign = handleHighChain(engine, {
    intent: "check",
    start: "x^3-9x=0",
    history: ["x^3-9x=0"],
    typed: "x^3+9x=0",
  });
  add(sign && !sign.ok && sign.errorId === "signOnMove" ? { ok: true, id: "sign-move" } : fail("sign-move", JSON.stringify(sign)));

  var partial = handleHighChain(engine, {
    intent: "check",
    start: "x^4+8x^3+15x^2=0",
    history: ["x^4+8x^3+15x^2=0"],
    typed: "x(x^3+8x^2+15x)=0",
  });
  add(partial && partial.ok && partial.canSplit ? { ok: true, id: "partial-factor" } : fail("partial-factor", JSON.stringify(partial)));

  var missing = handleHighChain(engine, {
    intent: "check",
    start: "x^3-7x^2+10x=0",
    history: ["x^3-7x^2+10x=0"],
    typed: "x(x^2-7x)=0",
  });
  add(missing && !missing.ok && missing.errorId === "missingTerm" ? { ok: true, id: "missing-term" } : fail("missing-term", JSON.stringify(missing)));

  var hint = handleHighChain(engine, { intent: "hint", start: "x^3+2x^2=8x", history: ["x^3+2x^2=8x"] });
  add(hint && hint.ok && /אגף אחד/.test(hint.hint) && !/7x/.test(hint.hint) ? { ok: true, id: "hint-rearrange" } : fail("hint-rearrange", JSON.stringify(hint)));

  var early = handleHighChain(engine, { intent: "split", start: "x^3+2x^2=8x", history: ["x^3+2x^2=8x"] });
  add(early && !early.ok && early.errorId === "splitBeforeProduct" ? { ok: true, id: "split-early" } : fail("split-early", JSON.stringify(early)));

  var sol = handleHighChain(engine, { intent: "solution", start: "x^3-7x^2+10x=0", history: ["x^3-7x^2+10x=0"] });
  var explained = sol && sol.steps && sol.steps.every(function (s) { return s.explain; });
  add(sol && sol.ok && explained && /x = 0/.test(sol.answer) && /5/.test(sol.answer) && /2/.test(sol.answer) ? { ok: true, id: "solution-explains" } : fail("solution-explains", JSON.stringify(sol && sol.answer)));

  var sqrtOnQuad = handleHighChain(engine, {
    intent: "check",
    start: "x^3-7x^2+10x=0",
    history: ["x^3-7x^2+10x=0", "x(x^2-7x+10)=0"],
    typed: "x^2=10",
    factor: { split: true, trails: [["x=0"], ["x^2-7x+10=0"]], pending: ["", ""] },
  });
  add(sqrtOnQuad && !sqrtOnQuad.ok && sqrtOnQuad.errorId === "sqrtOnFullQuadratic" ? { ok: true, id: "sqrt-on-quadratic" } : fail("sqrt-on-quadratic", JSON.stringify(sqrtOnQuad)));

  var entered = handleHighChain(engine, {
    intent: "formula-enter",
    start: "x^3-7x^2+10x=0",
    history: ["x^3-7x^2+10x=0", "x(x^2-7x+10)=0"],
    factor: { split: true, trails: [["x=0"], ["x^2-7x+10=0"]], pending: ["", ""] },
  });
  add(entered && entered.ok && entered.view && entered.view.a === 1 && entered.view.b === -7 && entered.view.c === 10 ? { ok: true, id: "formula-enter" } : fail("formula-enter", JSON.stringify(entered && entered.view)));

  var badA = handleHighChain(engine, {
    intent: "check",
    phase: "abc",
    letter: "a",
    slots: { a: "2" },
    start: "x^3-7x^2+10x=0",
    history: ["x^3-7x^2+10x=0", "x(x^2-7x+10)=0"],
    factor: { split: true, trails: [["x=0"], ["x^2-7x+10=0"]], pending: ["", ""], formulaBranch: 1 },
    formulaBranch: 1,
  });
  add(badA && !badA.ok && /a/.test(badA.message || "") ? { ok: true, id: "bad-a" } : fail("bad-a", JSON.stringify(badA)));

  var sqrtMid = {
    start: "x^3=16x",
    history: ["x^3=16x", "x^3-16x=0", "x(x^2-16)=0"],
    factor: { split: true, trails: [["x=0"], ["x^2-16=0", "x^2=16", "√(x^2)=√(16)"]], pending: ["", ""] },
  };
  var sqrtHint = handleHighChain(engine, Object.assign({ intent: "hint" }, sqrtMid));
  var sqrtStep = handleHighChain(engine, Object.assign({ intent: "one-step" }, sqrtMid));
  var sqrtOk = handleHighChain(engine, Object.assign({ intent: "check", typed: "x=±4" }, sqrtMid));
  var sqrtOne = handleHighChain(engine, Object.assign({ intent: "check", typed: "x=4, x=-4" }, sqrtMid));
  var sqrtBad = handleHighChain(engine, Object.assign({ intent: "check", typed: "x=±5" }, sqrtMid));
  add(
    sqrtHint && sqrtHint.ok && !sqrtHint.solved && /±4/.test(sqrtHint.hint || "") &&
    sqrtStep && sqrtStep.ok && /±4/.test(sqrtStep.step || "") && sqrtStep.solved &&
    sqrtOk && sqrtOk.ok && sqrtOk.solved &&
    sqrtOne && sqrtOne.ok && sqrtOne.solved &&
    sqrtBad && !sqrtBad.ok
      ? { ok: true, id: "sqrt-after-both" }
      : fail("sqrt-after-both", JSON.stringify({ hint: sqrtHint, step: sqrtStep && sqrtStep.step, ok: sqrtOk && sqrtOk.ok, one: sqrtOne && sqrtOne.ok, bad: sqrtBad && sqrtBad.message }))
  );

  var rootMid = {
    start: "x^4-8x=0",
    history: ["x^4-8x=0", "x^4-8x=0", "x(x^3-8)=0"],
    factor: { split: true, trails: [["x=0"], ["x^3-8=0", "x^3=8", "∛(x^3)=∛(8)"]], pending: ["", ""] },
  };
  var rootStep = handleHighChain(engine, Object.assign({ intent: "one-step" }, rootMid));
  var rootOk = handleHighChain(engine, Object.assign({ intent: "check", typed: "x=2" }, rootMid));
  add(
    rootStep && rootStep.ok && /x\s*=\s*2/.test(rootStep.step || "") &&
    rootOk && rootOk.ok && rootOk.solved
      ? { ok: true, id: "root-after-both" }
      : fail("root-after-both", JSON.stringify({ step: rootStep && rootStep.step, msg: rootStep && rootStep.message, ok: rootOk && rootOk.message, solved: rootOk && rootOk.solved }))
  );

  var answered = {
    start: "3x^4-108x^2=0",
    history: ["3x^4-108x^2=0", "3x^2(x^2-36)=0"],
    factor: {
      split: true,
      trails: [
        ["3x^2=0", "x=0"],
        ["x^2-36=0", "x^2=36", "x=6", "x=-6", "√(x^2)=√(36)"],
      ],
      pending: ["", ""],
    },
  };
  var answeredStep = handleHighChain(engine, Object.assign({ intent: "one-step" }, answered));
  add(
    answeredStep && answeredStep.ok && answeredStep.solved && !answeredStep.step && /0/.test(answeredStep.message || "") && /6/.test(answeredStep.message || "") &&
    (answeredStep.trails || []).every(function (row) {
      return (row || []).every(function (line) { return line.indexOf("√") < 0; });
    })
      ? { ok: true, id: "roots-before-sqrt" }
      : fail("roots-before-sqrt", JSON.stringify({ step: answeredStep && answeredStep.step, solved: answeredStep && answeredStep.solved, msg: answeredStep && answeredStep.message, trails: answeredStep && answeredStep.trails }))
  );

  var md53 = handleHighChain(engine, {
    intent: "check",
    start: "x^3+25x=10x^2",
    history: ["x^3+25x=10x^2", "x^3-10x^2+25x=0", "x(x^2-10x+25)=0"],
    phase: "abc",
    letter: "a",
    slots: { a: "1", b: "", c: "" },
    md53: true,
    formulaBranch: 1,
    factor: { split: true, trails: [["x=0"], ["x^2-10x+25=0"]], pending: ["", ""], formulaBranch: 1 },
  });
  add(md53 && md53.ok && md53.nextLetter === "b" ? { ok: true, id: "md53-a" } : fail("md53-a", JSON.stringify(md53 && { ok: md53.ok, message: md53.message, next: md53.nextLetter })));

  var half = {
    start: "x^3=16x",
    history: ["x^3=16x", "x^3-16x=0", "x(x^2-16)=0"],
    factor: { split: true, trails: [["x=0"], ["x^2-16=0", "x^2=16", "x=4"]], pending: ["", ""] },
  };
  var halfStep = handleHighChain(engine, Object.assign({ intent: "one-step" }, half));
  var halfAfter = {
    start: "x^3=16x",
    history: ["x^3=16x", "x^3-16x=0", "x(x^2-16)=0"],
    factor: { split: true, trails: [["x=0"], ["x^2-16=0", "x^2=16", "x=4", "√(x^2)=√(16)"]], pending: ["", ""] },
  };
  var halfSqrt = handleHighChain(engine, Object.assign({ intent: "one-step" }, halfAfter));
  add(
    halfStep && halfStep.ok && /−4|-4/.test(halfStep.step || "") && !/√/.test(halfStep.step || "") &&
    halfSqrt && halfSqrt.ok && /−4|-4/.test(halfSqrt.step || "") && !/√/.test(halfSqrt.step || "")
      ? { ok: true, id: "partial-root-next" }
      : fail("partial-root-next", JSON.stringify({ step: halfStep && halfStep.step, after: halfSqrt && halfSqrt.step, msg: halfStep && halfStep.message }))
  );

  var dup = engine.DoctematicaQuadratic.analyzeHighChainStart("x^4+8x^3+15x^2=0");
  add(dup.roots.length === 3 ? { ok: true, id: "unique-zero" } : fail("unique-zero", dup.roots.join(",")));

  var appSrc = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  var finishAt = appSrc.indexOf("function finishChainFormula");
  var finishBody = finishAt >= 0 ? appSrc.slice(finishAt, finishAt + 800) : "";
  var parkAt = finishBody.indexOf("parkFormulaSession");
  var clearAt = finishBody.indexOf("state.quad = null");
  add(
    parkAt >= 0 && clearAt > parkAt
      ? { ok: true, id: "formula-stays-in-chain-column" }
      : fail("formula-stays-in-chain-column", "the quadratic-formula trail must stay on the branch that was solved")
  );

  var failed = checks.filter(function (item) { return !item.ok; });
  console.log("parity-high-chain: passed " + (checks.length - failed.length) + ", failed " + failed.length);
  failed.forEach(function (item) {
    console.log("FAIL " + item.id + " " + item.detail);
  });
  if (failed.length) process.exitCode = 1;
}

main();
