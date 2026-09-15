"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var handleHighRoot = require("./high-root").handleHighRoot;
var handleHighFactor = require("./high-factor").handleHighFactor;
var createHighPowerHandler = require("./high-power").createHighPowerHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function hp(engine) {
  return createHighPowerHandler(engine);
}

function chainRoot(engine, start) {
  var hist = [start];
  var i;
  var hints = 0;
  for (i = 0; i < 16; i++) {
    var hint = handleHighRoot(engine, { intent: "hint", start: start, history: hist });
    if (!hint || !hint.hint) return fail("root-hint:" + start, "last=" + hist[hist.length - 1]);
    hints += 1;
    var res = handleHighRoot(engine, { intent: "one-step", start: start, history: hist });
    if (!res.ok) return fail("root-step:" + start, res.message || "");
    if (res.step) {
      if (hist[hist.length - 1] === res.step) return fail("root-loop:" + start, res.step);
      hist.push(res.step);
      if (res.solved) return { ok: true, history: hist, hints: hints };
      continue;
    }
    if (res.solved || (res.done && !res.step)) return { ok: true, history: hist, hints: hints };
    return fail("root-stuck:" + start, res.hint || res.message || "");
  }
  return fail("root-unsolved:" + start, hist[hist.length - 1]);
}

function chainFactor(engine, start) {
  var hist = [start];
  var split = false;
  var trails = [[], []];
  var i;
  for (i = 0; i < 24; i++) {
    var hint = handleHighFactor(engine, {
      intent: "hint",
      start: start,
      history: hist,
      factor: { split: split, trails: trails },
    });
    if (!hint || !hint.hint) return fail("factor-hint:" + start, "last=" + hist[hist.length - 1]);
    var res = handleHighFactor(engine, {
      intent: "one-step",
      start: start,
      history: hist,
      factor: { split: split, trails: trails },
    });
    if (res.solvedAll || res.solved === true) {
      if (res.step) {
        if (split) {
          var w0 = typeof res.which === "number" ? res.which : 1;
          trails[w0] = trails[w0].concat([res.step]);
        } else hist.push(res.step);
      }
      return { ok: true, history: hist, split: split };
    }
    if (res.resplit) {
      var wr = typeof res.which === "number" ? res.which : 1;
      if (res.trailAlso) trails[wr] = trails[wr].concat([res.trailAlso]);
      if (res.eqs && res.eqs[wr]) trails[wr] = trails[wr].concat([res.eqs[wr]]);
      continue;
    }
    if (res.split && !split) {
      split = true;
      continue;
    }
    if (!res.ok) return fail("factor-step:" + start, res.message || "");
    if (res.done && !res.step) return { ok: true, history: hist, split: split };
    if (!res.step) return fail("factor-stuck:" + start, res.hint || res.message || "");
    if (split) {
      var which = typeof res.which === "number" ? res.which : 1;
      trails[which] = trails[which].concat([res.step]);
    } else {
      if (hist[hist.length - 1] === res.step) return fail("factor-loop:" + start, res.step);
      hist.push(res.step);
    }
  }
  return fail("factor-unsolved:" + start, hist[hist.length - 1]);
}

function nodeOffContract() {
  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  var content = fs.readFileSync(path.join(__dirname, "../js/content.js"), "utf8");
  var checks = [];
  function has(re, id) {
    if (re.test(src)) checks.push({ ok: true, id: "node-off:" + id });
    else checks.push(fail("node-off:" + id, "missing pattern"));
  }
  has(/HIGH_POWER_URL/, "high-power-url");
  has(/function requestHighPowerAction/, "request-high-power");
  has(/equationsCheckBusy = false;\s*onResult/, "busy-before-high-callback");
  has(/if \(remote\.step\) \{\s*applyHighRootServerResult/, "root-one-step-applies-step");
  has(/remote\.resplit \|\| \(remote\.split && !\(state\.factor && state\.factor.split\)\)/, "factor-one-step-resplit");
  has(/if \(isHighPowerTopic\(\)\) \{\s*showBasicEqServerUnavailable/, "no-local-high-factor-fallback");
  if (/analyzeHighRootStart/.test(content) || /analyzeHighFactorStart/.test(content)) {
    checks.push(fail("node-off:content-analyze", "content.js still analyzes high-power on load"));
  } else {
    checks.push({ ok: true, id: "node-off:content-stripped" });
  }
  var rootHintFn = src.split("function highRootHint")[1] || "";
  if (rootHintFn.slice(0, 800).indexOf("nextHighRootStep") !== -1) {
    checks.push(fail("node-off:root-hint-local", "highRootHint still calls nextHighRootStep"));
  } else {
    checks.push({ ok: true, id: "node-off:root-hint-server" });
  }
  return checks;
}

function pick(levels, mode) {
  var out = [];
  levels.forEach(function (level) {
    if (level.mode !== mode) return;
    (level.exercises || []).forEach(function (ex) {
      out.push({ start: ex.start, id: level.id + "-n" + ex.n, n: ex.n });
    });
  });
  return out;
}

function main() {
  var engine = loadEngine();
  var handler = hp(engine);
  var levels = engine.DoctematicaCurriculum.levels || [];
  var failed = [];
  var passed = 0;

  function add(result) {
    if (!result) return;
    if (result.ok) passed += 1;
    else failed.push(result);
  }

  nodeOffContract().forEach(add);

  var strippedRoot = engine.DoctematicaContent.problem("high-root-3", 0);
  add(
    strippedRoot && !strippedRoot.answer && !strippedRoot.highRoot && !strippedRoot.solutionSteps
      ? { ok: true, id: "strip-root" }
      : fail("strip-root", JSON.stringify(strippedRoot && Object.keys(strippedRoot)))
  );
  var strippedFa = engine.DoctematicaContent.problem("high-factor-1", 0);
  add(
    strippedFa && !strippedFa.answer && !strippedFa.factor && !strippedFa.solutionSteps
      ? { ok: true, id: "strip-factor" }
      : fail("strip-factor", JSON.stringify(strippedFa && Object.keys(strippedFa)))
  );

  pick(levels, "high-root").forEach(function (item) {
    var walked = chainRoot(engine, item.start);
    add(Object.assign(walked, { id: walked.ok ? "root-walk-" + item.id : walked.id || "root-walk-" + item.id }));
    var sol = handleHighRoot(engine, { intent: "solution", start: item.start, history: [item.start] });
    add(sol && sol.ok && sol.steps && sol.steps.length && sol.answer ? { ok: true, id: "root-sol-" + item.id } : fail("root-sol:" + item.id, ""));
  });

  (function rootCases() {
    var even = chainRoot(engine, "x^4=81");
    add(even.ok && even.history.some(function (h) { return /±/.test(h); }) ? { ok: true, id: "root-even-pm" } : fail("root-even-pm", JSON.stringify(even)));
    var none = chainRoot(engine, "x^4+16=0");
    add(none.ok && none.history.some(function (h) { return /אין/.test(h); }) ? { ok: true, id: "root-even-none" } : fail("root-even-none", JSON.stringify(none)));
    add(Object.assign(chainRoot(engine, "x^3=27"), { id: "root-odd-pos" }));
    add(Object.assign(chainRoot(engine, "x^3+125=0"), { id: "root-odd-neg" }));
    add(Object.assign(chainRoot(engine, "x^5=0"), { id: "root-zero" }));
    add(Object.assign(chainRoot(engine, "x^3-64=0"), { id: "root-arrange" }));

    var skip = handleHighRoot(engine, {
      intent: "check",
      start: "x^3-64=0",
      history: ["x^3-64=0"],
      typed: "x=4",
    });
    add(skip && skip.ok && skip.solved ? { ok: true, id: "root-skip-legal" } : fail("root-skip-legal", JSON.stringify(skip)));
    var bad = handleHighRoot(engine, {
      intent: "check",
      start: "x^3-64=0",
      history: ["x^3-64=0"],
      typed: "x=5",
    });
    add(bad && !bad.ok ? { ok: true, id: "root-skip-illegal" } : fail("root-skip-illegal", JSON.stringify(bad)));

    var isoHist = ["x^3=27"];
    var both = handleHighRoot(engine, { intent: "one-step", start: "x^3=27", history: isoHist });
    add(both && both.ok && both.step ? { ok: true, id: "root-one-step-has-step" } : fail("root-one-step-has-step", JSON.stringify(both)));
    if (both && both.done && !both.step) add(fail("root-one-step-done-no-step", ""));
    else add({ ok: true, id: "root-one-step-not-done-over-step" });
  })();

  pick(levels, "high-factor").forEach(function (item) {
    var walked = chainFactor(engine, item.start);
    add(Object.assign(walked, { id: walked.ok ? "factor-walk-" + item.id : walked.id || "factor-walk-" + item.id }));
    var sol = handleHighFactor(engine, { intent: "solution", start: item.start, history: [item.start] });
    add(sol && sol.ok && sol.steps && sol.steps.length && sol.answer ? { ok: true, id: "factor-sol-" + item.id } : fail("factor-sol:" + item.id, ""));
  });

  (function factorCases() {
    add(Object.assign(chainFactor(engine, "x^3=16x"), { id: "factor-x3-eq-16x" }));
    add(Object.assign(chainFactor(engine, "x^3-9x=0"), { id: "factor-quad-two" }));
    add(Object.assign(chainFactor(engine, "x^3+x=0"), { id: "factor-quad-none" }));
    add(Object.assign(chainFactor(engine, "x^3-4x^2=0"), { id: "factor-linear" }));
    add(Object.assign(chainFactor(engine, "x^4-x^2=0"), { id: "factor-xq-quad" }));

    var start = "x^3-9x=0";
    var factored = handleHighFactor(engine, {
      intent: "one-step",
      start: start,
      history: [start],
    });
    add(factored && factored.ok && factored.step && factored.canSplit ? { ok: true, id: "factor-canSplit-after-factor" } : fail("factor-canSplit-after-factor", JSON.stringify(factored)));
    var hist = [start, factored.step];
    var afterSplit = handleHighFactor(engine, {
      intent: "one-step",
      start: start,
      history: hist,
      factor: { split: false, trails: [[], []] },
    });
    add(afterSplit && afterSplit.split && !afterSplit.step ? { ok: true, id: "factor-split-no-step" } : fail("factor-split-no-step", JSON.stringify(afterSplit)));
    var afterSplitAgain = handleHighFactor(engine, {
      intent: "one-step",
      start: start,
      history: hist,
      factor: { split: true, trails: [[afterSplit.eqs[0]], [afterSplit.eqs[1]]] },
    });
    add(
      afterSplitAgain && afterSplitAgain.step && !afterSplitAgain.split
        ? { ok: true, id: "factor-one-step-after-split-not-split-again" }
        : fail("factor-one-step-after-split-not-split-again", JSON.stringify(afterSplitAgain))
    );

    var partial = handleHighFactor(engine, {
      intent: "check",
      start: "x^3-4x^2=0",
      history: ["x^3-4x^2=0"],
      typed: "x(x^2-4x)=0",
    });
    add(partial && partial.ok ? { ok: true, id: "factor-partial" } : fail("factor-partial", JSON.stringify(partial)));

    var full = handleHighFactor(engine, {
      intent: "check",
      start: "x^3-4x^2=0",
      history: ["x^3-4x^2=0"],
      typed: "x^2(x-4)=0",
    });
    add(full && full.ok && full.factored ? { ok: true, id: "factor-full" } : fail("factor-full", JSON.stringify(full)));

    var e2First = handleHighFactor(engine, {
      intent: "check",
      start: "x^3-4x^2=0",
      history: ["x^3-4x^2=0", "x^2(x-4)=0"],
      typed: "x=4",
      factor: { split: true, trails: [["x^2=0"], ["x-4=0"]] },
    });
    add(e2First && e2First.ok ? { ok: true, id: "factor-e2-before-e1" } : fail("factor-e2-before-e1", JSON.stringify(e2First)));

    var viaHandler = handler.handle({
      topic: "high-power",
      subtopic: "factor",
      intent: "solution",
      start: "x^3=16x",
    });
    add(viaHandler && viaHandler.ok && viaHandler.answer ? { ok: true, id: "handler-factor-sol" } : fail("handler-factor-sol", JSON.stringify(viaHandler)));
  })();

  console.log("flow-high-power: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 20).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
