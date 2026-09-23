"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var handleMixed = require("./quad-mixed").handleMixed;
var handleFormula = require("./quad-formula").handleFormula;
var handleFactor = require("./quad-factor").handleFactor;
var createQuadraticHandler = require("./quadratic").createQuadraticHandler;
var createEquationsHandler = require("./equations").createEquationsHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function mixedEnter(engine, start, hist) {
  var guard = 0;
  var history = (hist && hist.slice()) || [start];
  while (guard < 20) {
    guard += 1;
    var res = handleMixed(engine, { intent: "one-step", start: start, history: history });
    if (res.chooseFormula) {
      var chosen = handleMixed(engine, { intent: "formula-enter", start: start, history: history });
      if (!chosen.ok) return fail("choose-formula:" + start, (chosen.message || "") + " last=" + history[history.length - 1]);
      return { ok: true, history: history, res: chosen, via: "formula" };
    }
    if (res.enter === "formula" || (res.path === "formula" && !res.step)) {
      return { ok: true, history: history, res: res, via: "formula" };
    }
    if (res.enter === "sqrt" || res.path === "sqrt") {
      if (res.step) history.push(res.step);
      return { ok: true, history: history, res: res, via: "sqrt" };
    }
    if (res.enter === "factor" || res.path === "factor") {
      if (res.step) history.push(res.step);
      return { ok: true, history: history, res: res, via: "factor", split: !!res.split };
    }
    if (res.enter === "linear" || res.path === "linear") {
      if (res.step) history.push(res.step);
      return { ok: true, history: history, res: res, via: "linear" };
    }
    if (!res.ok) return fail("enter-fail:" + start, (res.message || "") + " last=" + history[history.length - 1]);
    if (!res.step) return fail("enter-stuck:" + start, (res.hint || res.message || "no step") + " last=" + history[history.length - 1]);
    if (history[history.length - 1] === res.step) return fail("enter-loop:" + start, res.step);
    history.push(res.step);
  }
  return fail("enter-too-long:" + start, history[history.length - 1]);
}

function chainFormula(engine, start, history) {
  var phase = "abc";
  var letter = "a";
  var root = { at: 1 };
  var compute = {};
  var phases = ["abc"];
  var i;
  for (i = 0; i < 24; i++) {
    var res = handleMixed(engine, {
      intent: "one-step",
      start: start,
      history: history,
      phase: phase,
      letter: letter,
      root: root,
      compute: compute,
    });
    if (!res.ok) return fail("formula-step:" + start, phase + " " + (res.message || ""));
    if (res.solved) return { ok: true, phases: phases.concat([res.nextPhase || "done"]) };
    if (res.nextPhase && res.nextPhase !== phase) {
      phases.push(res.nextPhase);
      phase = res.nextPhase;
    }
    if (res.nextLetter) letter = res.nextLetter;
    if (res.nextRoot) root = { at: res.nextRoot };
    if (phase === "rootwork" && res.parts) {
      if (res.parts.num && res.parts.num.ok && !res.parts.num.more) root.numDone = true;
      if (res.parts.den && res.parts.den.ok && !res.parts.den.more) root.denDone = true;
      if (!res.more) {
        root.numDone = true;
        root.denDone = true;
      }
    }
    if (phase === "compute" && res.nextPhase && res.nextPhase !== "compute") {
      compute = { negBDone: true, discDone: true, denDone: true };
    }
  }
  return fail("formula-unsolved:" + start, "last phase " + phase);
}

function chainSqrt(engine, start, history) {
  var i;
  var hist = history.slice();
  for (i = 0; i < 16; i++) {
    var res = handleMixed(engine, { intent: "one-step", start: start, history: hist });
    if (res.solved) return { ok: true };
    if (!res.ok) return fail("sqrt-step:" + start, res.message || "");
    if (res.done && !res.step) return { ok: true };
    if (!res.step) return fail("sqrt-stuck:" + start, res.hint || res.message || "");
    if (hist[hist.length - 1] === res.step) return fail("sqrt-loop:" + start, res.step);
    hist.push(res.step);
  }
  return fail("sqrt-unsolved:" + start, hist[hist.length - 1]);
}

function chainLinear(engine, start, history) {
  var i;
  var hist = history.slice();
  for (i = 0; i < 16; i++) {
    var res = handleMixed(engine, { intent: "one-step", start: start, history: hist });
    if (res.solved) return { ok: true };
    if (!res.ok) return fail("linear-step:" + start, res.message || "");
    if (res.done && !res.step) return { ok: true };
    if (!res.step) return fail("linear-stuck:" + start, res.hint || res.message || "");
    hist.push(res.step);
  }
  return fail("linear-unsolved:" + start, hist[hist.length - 1]);
}

function chainFactor(engine, start, history, first) {
  var hist = history.slice();
  var split = !!first.split;
  var trails = [[], []];
  var i;
  for (i = 0; i < 20; i++) {
    var res = handleMixed(engine, {
      intent: "one-step",
      start: start,
      history: hist,
      factor: { split: split, trails: trails },
    });
    if (res.solvedAll || res.solved === true) return { ok: true };
    if (res.split && !split) {
      split = true;
      continue;
    }
    if (!res.ok) return fail("factor-step:" + start, res.message || "");
    if (res.done && !res.step) return { ok: true };
    if (!res.step) return fail("factor-stuck:" + start, res.hint || res.message || "");
    if (split) {
      var which = typeof res.which === "number" ? res.which : 1;
      trails[which] = trails[which].concat([res.step]);
    } else {
      hist.push(res.step);
    }
  }
  return fail("factor-unsolved:" + start, hist[hist.length - 1]);
}

function actionsAt(engine, start, history) {
  var hint = handleMixed(engine, { intent: "hint", start: start, history: history });
  var sol = handleMixed(engine, { intent: "solution", start: start, history: history });
  if (!hint || !hint.ok) return fail("hint:" + start, "missing hint");
  if (!sol || !sol.ok || !sol.steps || !sol.steps.length) return fail("solution:" + start, "missing steps");
  return { ok: true };
}

function walkMixedItem(engine, start) {
  var entered = mixedEnter(engine, start);
  if (!entered.ok) return entered;
  var acts = actionsAt(engine, start, entered.history);
  if (!acts.ok) return acts;
  if (entered.via === "formula") {
    if (entered.res.enter !== "formula" && entered.res.path !== "formula") {
      return fail("formula-enter-flag:" + start, JSON.stringify(entered.res));
    }
    if (!entered.res.view || entered.res.view.a == null) {
      return fail("formula-view:" + start, "missing view.a");
    }
    var chained = chainFormula(engine, start, entered.history);
    if (!chained.ok) return chained;
    var need = ["abc", "plug"];
    var pi;
    for (pi = 0; pi < need.length; pi++) {
      if (chained.phases.indexOf(need[pi]) < 0) {
        return fail("formula-phases:" + start, chained.phases.join(">"));
      }
    }
    return { ok: true, via: "formula" };
  }
  if (entered.via === "sqrt") return chainSqrt(engine, start, entered.history);
  if (entered.via === "linear") return chainLinear(engine, start, entered.history);
  if (entered.via === "factor") return chainFactor(engine, start, entered.history, entered);
  return fail("unknown-via:" + start, entered.via);
}

function chainPureFormula(engine, start) {
  var want = engine.DoctematicaQuadratic.analyzeStart(start);
  var phase = "abc";
  var letter = "a";
  var root = { at: 1 };
  var compute = {};
  var i;
  for (i = 0; i < 24; i++) {
    var res = handleFormula(engine, {
      intent: "one-step",
      start: start,
      history: [start],
      phase: phase,
      letter: letter,
      root: root,
      compute: compute,
    });
    if (!res.ok) return fail("pure-formula:" + start, phase + " " + (res.message || ""));
    if (res.solved) return { ok: true };
    if (res.nextPhase) phase = res.nextPhase;
    if (res.nextLetter) letter = res.nextLetter;
    if (res.nextRoot) root = { at: res.nextRoot };
    if (phase === "rootwork" && res.parts) {
      if (!res.more) {
        root.numDone = true;
        root.denDone = true;
      }
    }
  }
  return fail("pure-formula-unsolved:" + start, want.kind || phase);
}

function chainPureSqrt(engine, start) {
  var q = createQuadraticHandler(engine);
  var hist = [start];
  var i;
  for (i = 0; i < 16; i++) {
    var res = q.handle({
      topic: "quadratic",
      subtopic: "sqrt",
      intent: "one-step",
      start: start,
      history: hist,
    });
    if (res.solved || (res.done && !res.step)) return { ok: true };
    if (!res.ok) return fail("pure-sqrt:" + start, res.message || "");
    if (!res.step) return fail("pure-sqrt-stuck:" + start, res.hint || "");
    hist.push(res.step);
  }
  return fail("pure-sqrt-unsolved:" + start, hist[hist.length - 1]);
}

function chainPureFactor(engine, start) {
  var hist = [start];
  var split = false;
  var trails = [[], []];
  var i;
  for (i = 0; i < 20; i++) {
    var res = handleFactor(engine, {
      intent: "one-step",
      start: start,
      history: hist,
      factor: { split: split, trails: trails },
    });
    if (res.solvedAll || res.solved === true) return { ok: true };
    if (res.split && !split) {
      split = true;
      continue;
    }
    if (!res.ok) return fail("pure-factor:" + start, res.message || "");
    if (!res.step) return fail("pure-factor-stuck:" + start, res.hint || "");
    if (split) {
      var which = typeof res.which === "number" ? res.which : 1;
      trails[which] = trails[which].concat([res.step]);
    } else hist.push(res.step);
  }
  return fail("pure-factor-unsolved:" + start, hist[hist.length - 1]);
}

function chainBasic(engine, start) {
  var eq = createEquationsHandler(engine);
  var hist = [start];
  var i;
  for (i = 0; i < 16; i++) {
    var res = eq.handle({
      topic: "equations",
      subtopic: "basic",
      intent: "one-step",
      start: start,
      history: hist,
    });
    if (res.solved) return { ok: true };
    if (!res.ok) return fail("basic:" + start, res.message || "");
    if (res.done && !res.step) return { ok: true };
    if (!res.step) return fail("basic-stuck:" + start, res.hint || "");
    hist.push(res.step);
  }
  return fail("basic-unsolved:" + start, hist[hist.length - 1]);
}

function nodeOffContract() {
  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  var checks = [];
  function has(re, id) {
    if (re.test(src)) checks.push({ ok: true, id: "node-off:" + id });
    else checks.push(fail("node-off:" + id, "missing pattern"));
  }
  has(/equationsCheckBusy = false;\s*applyLcdOffer/, "busy-before-callback");
  has(/function beginMixedFormulaFromServer/, "formula-enter-from-response");
  has(/remote\.enter === "formula"/, "one-step-formula-enter");
  has(/remote\.enter === "sqrt"/, "one-step-sqrt-enter");
  has(/if \(remote\.step\) \{\s*applySqrtServerResult/, "sqrt-one-step-applies-step");
  var mixedBlock = src.split("function mixedOneStep")[1] || "";
  var serverPart = mixedBlock.split("if (isMixedServerMode())")[1] || "";
  var localPartIdx = serverPart.indexOf("var pack = state.problem.mixed");
  var serverHead = localPartIdx >= 0 ? serverPart.slice(0, localPartIdx) : serverPart.slice(0, 2500);
  if (serverHead.indexOf("nextMixedStep") !== -1) {
    checks.push(fail("node-off:mixed-local-next", "server mixedOneStep still calls nextMixedStep"));
  } else {
    checks.push({ ok: true, id: "node-off:mixed-no-local-next" });
  }
  return checks;
}

function pick(levels, mode, n) {
  var out = [];
  levels.forEach(function (level) {
    if (level.mode !== mode) return;
    (level.exercises || []).forEach(function (ex) {
      if (n && out.length >= n) return;
      out.push({ start: ex.start, id: level.id + "-n" + ex.n });
    });
  });
  return out;
}

function main() {
  var engine = loadEngine();
  var levels = engine.DoctematicaCurriculum.levels || [];
  var failed = [];
  var passed = 0;

  function add(result) {
    if (!result) return;
    if (result.ok) passed += 1;
    else failed.push(result);
  }

  nodeOffContract().forEach(add);

  pick(levels, "quad-mixed", 0).forEach(function (item) {
    if (/quad-mixed-[67]/.test(item.id)) return;
    if (engine.DoctematicaTeach.analyzeDomain(item.start)) return;
    add(Object.assign(walkMixedItem(engine, item.start), { id: item.id }));
  });

  pick(levels, "quad-formula", 4).forEach(function (item) {
    add(Object.assign(chainPureFormula(engine, item.start), { id: "formula-" + item.id }));
    var h = handleFormula(engine, { intent: "hint", start: item.start, history: [item.start], phase: "abc" });
    var s = handleFormula(engine, { intent: "solution", start: item.start, history: [item.start] });
    add(h && h.hint ? { ok: true } : fail("formula-hint:" + item.id, ""));
    add(s && s.ok && s.steps && s.steps.length ? { ok: true } : fail("formula-sol:" + item.id, ""));
  });

  pick(levels, "quad-sqrt", 4).forEach(function (item) {
    add(Object.assign(chainPureSqrt(engine, item.start), { id: "sqrt-" + item.id }));
  });

  pick(levels, "quad-factor", 4).forEach(function (item) {
    add(Object.assign(chainPureFactor(engine, item.start), { id: "factor-" + item.id }));
  });

  var basic = levels.filter(function (l) {
    return l.topic === "equations" && (l.subtopic || "basic") === "basic";
  })[0];
  if (basic && basic.exercises && basic.exercises[0]) {
    add(Object.assign(chainBasic(engine, basic.exercises[0].start), { id: "basic-" + basic.exercises[0].start }));
  }

  var samples = {
    formula: "6+7x=-x^2",
    sqrt: "5x^2+20=4x^2+84",
    factor: "5x^2-3x=x^2-2x",
    linear: "x(x+8)=x^2+24",
  };
  Object.keys(samples).forEach(function (via) {
    var got = mixedEnter(engine, samples[via]);
    if (!got.ok) {
      add(got);
      return;
    }
    if (got.via !== via) add(fail("sample-via:" + via, "got " + got.via));
    else add({ ok: true });
    var hint = handleMixed(engine, { intent: "hint", start: samples[via], history: got.history });
    if (via === "formula" && hint.path !== "formula") add(fail("sample-hint-path:" + via, hint.path));
    else add({ ok: true });
  });

  (function bothSidesOneStep() {
    var start = "5x^2+20=4x^2+84";
    var hist = [start, "5x^2-4x^2=84-20", "x^2=64", "√(x^2) = √(64)"];
    var res = handleMixed(engine, { intent: "one-step", start: start, history: hist });
    if (!res.ok || !res.step || !/±/.test(res.step)) {
      add(fail("sqrt-both-sides-one-step", JSON.stringify(res)));
      return;
    }
    if (res.done && !res.step) add(fail("sqrt-both-sides-done-no-step", ""));
    else add({ ok: true, id: "sqrt-both-sides-one-step" });
  })();

  (function mixedFactorEnterOneStep() {
    var start = "15-5(x+3)-x^2=0";
    var hist = [start];
    var i;
    var last = null;
    for (i = 0; i < 12; i++) {
      last = handleMixed(engine, { intent: "one-step", start: start, history: hist });
      if (!last.ok) {
        add(fail("mixed-factor-enter-ok", JSON.stringify(last)));
        return;
      }
      if (last.path === "factor" || last.enter === "factor") break;
      if (!last.step) {
        add(fail("mixed-factor-pre-stuck", JSON.stringify(last)));
        return;
      }
      if (String(last.message || last.hint || "").indexOf("undefined") >= 0) {
        add(fail("mixed-factor-pre-undefined", last.message));
        return;
      }
      hist.push(last.step);
    }
    if (!(last && (last.path === "factor" || last.enter === "factor"))) {
      add(fail("mixed-factor-no-enter", JSON.stringify(last)));
      return;
    }
    if (!last.step) {
      add(fail("mixed-factor-enter-no-step", JSON.stringify(last)));
      return;
    }
    if (!last.message || String(last.message).indexOf("undefined") >= 0) {
      add(fail("mixed-factor-enter-message", JSON.stringify(last)));
      return;
    }
    if (!last.factored && !last.canSplit) {
      add(fail("mixed-factor-enter-cansplit", JSON.stringify(last)));
      return;
    }
    hist.push(last.step);
    var split = handleMixed(engine, {
      intent: "one-step",
      start: start,
      history: hist,
      factor: { split: false, trails: [[], []] },
    });
    add(
      split && split.split && !split.step
        ? { ok: true, id: "mixed-factor-split-after-enter" }
        : fail("mixed-factor-split-after-enter", JSON.stringify(split))
    );
    add({ ok: true, id: "mixed-factor-enter-one-step" });
  })();

  console.log("flow-quadratic: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 12).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || f.fail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
