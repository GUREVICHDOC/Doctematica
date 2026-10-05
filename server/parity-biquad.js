"use strict";

var loadEngine = require("./load-engine").loadEngine;
var handleBiquad = require("./biquad").handleBiquad;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function tValueLine(engine, start) {
  var pack = engine.DoctematicaBiquad.analyzeBiquadStart(start);
  var Q = engine.DoctematicaQuadratic;
  var seen = {};
  var parts = [];
  (pack.quad.roots || []).forEach(function (fr) {
    if (!fr) return;
    var key = fr.n + "/" + fr.d;
    if (seen[key]) return;
    seen[key] = true;
    parts.push("t=" + Q.fmt(fr));
  });
  return parts.join(", ");
}

function walk(engine, start) {
  var hist = [start];
  var factor = { split: false, trails: [] };
  var guard = 0;
  while (guard < 40) {
    guard += 1;
    var res = handleBiquad(engine, { intent: "one-step", start: start, history: hist, factor: factor });
    if (!res || res.ok === false) return fail(start, (res && res.message) || "one-step");
    if (res.path === "formula" || res.enter === "formula") {
      var absorbed = handleBiquad(engine, {
        intent: "absorb",
        start: start,
        history: hist,
        typed: tValueLine(engine, start),
        factor: factor,
      });
      if (!absorbed || absorbed.ok === false) return fail(start, (absorbed && absorbed.message) || "formula");
      if (absorbed.step) hist.push(absorbed.step);
      if (absorbed.trails) factor = { split: true, trails: absorbed.trails };
      if (absorbed.solved) return { ok: true, id: start };
      continue;
    }
    if (res.solved) return { ok: true, id: start };
    if (res.branch == null && res.step) hist.push(res.step);
    if (res.trails) factor = { split: true, trails: res.trails };
  }
  return fail(start, "stuck");
}

function main() {
  var engine = loadEngine();
  var level = (engine.DoctematicaCurriculum.levels || []).filter(function (item) {
    return item.id === "biquad-1";
  })[0];
  var checks = [];
  if (!level || level.exercises.length !== 20) {
    checks.push(fail("page", "missing biquad-1"));
  } else {
    checks.push(level.topic === "biquad" && level.mode === "biquad" ? { ok: true, id: "topic" } : fail("topic"));
    checks.push(level.exercises[0].n === 1 && level.exercises[19].n === 20 ? { ok: true, id: "numbers" } : fail("numbers"));
    level.exercises.forEach(function (ex) {
      checks.push(walk(engine, ex.start));
    });
  }
  var start = "x^4-10x^2+9=0";
  function check(typed, hist) {
    return handleBiquad(engine, { intent: "check", start: start, history: hist || [start], typed: typed });
  }
  var badSub = check("t=x");
  checks.push(badSub && badSub.errorId === "badSub" ? { ok: true, id: "bad-sub" } : fail("bad-sub", badSub && badSub.message));
  var power = check("t^4-10t^2+9=0", [start, "t=x^2"]);
  checks.push(power && power.errorId === "badSubPower" ? { ok: true, id: "bad-power" } : fail("bad-power", power && power.message));
  var direct = check("t^2-10t+9=0");
  checks.push(direct && direct.ok && !direct.solved ? { ok: true, id: "direct-sub" } : fail("direct-sub"));
  var dup = check("x=3, x=3, x=1, x=-1, x=-3");
  checks.push(dup && dup.errorId === "duplicateRoot" ? { ok: true, id: "duplicate" } : fail("duplicate", dup && dup.errorId));
  var missing = check("x=1, x=-1");
  checks.push(missing && missing.errorId === "missingRoot" ? { ok: true, id: "missing" } : fail("missing", missing && missing.errorId));
  var hint = handleBiquad(engine, { intent: "hint", start: start, history: [start], hintLevel: 0 });
  checks.push(hint && hint.hint && hint.hint.indexOf("t=x^2") < 0 ? { ok: true, id: "hint-soft" } : fail("hint-soft", hint && hint.hint));
  var paren = handleBiquad(engine, {
    intent: "hint",
    start: "(x^2+2)(x^2-12)=72",
    history: ["(x^2+2)(x^2-12)=72"],
    hintLevel: 0,
  });
  checks.push(paren && paren.hint && paren.hint.indexOf("סוגריים") >= 0 ? { ok: true, id: "hint-parens" } : fail("hint-parens"));
  var sol = handleBiquad(engine, { intent: "solution", start: "x^4-13x^2+36=0", history: [] });
  var eqs = (sol.steps || []).map(function (s) { return s.eq; }).join(" ");
  checks.push(
    sol && sol.steps && sol.steps.every(function (s) { return s.explain; }) && eqs.indexOf("t=x^2") >= 0 && eqs.indexOf("x^2=9") >= 0
      ? { ok: true, id: "solution" }
      : fail("solution")
  );
  var odd = handleBiquad(engine, {
    intent: "check",
    start: "x^6-9x^3+8=0",
    history: ["x^6-9x^3+8=0", "t=x^3", "t^2-9t+8=0", "t=8, t=1"],
    typed: "x=±2",
    factor: { split: true, trails: [["x^3=8"], ["x^3=1"]] },
  });
  checks.push(odd && odd.ok === false ? { ok: true, id: "odd-pm" } : fail("odd-pm", odd && odd.message));
  var negHist = ["x^4+8x^2-9=0", "t=x^2", "t^2+8t-9=0", "t=1, t=-9"];
  var negFactor = { split: true, trails: [[], []] };
  ["אין", "אין פתרון"].forEach(function (phrase) {
    var shortNone = handleBiquad(engine, {
      intent: "check",
      start: "x^4+8x^2-9=0",
      history: negHist,
      factor: negFactor,
      branch: 1,
      typed: phrase,
    });
    checks.push(
      shortNone && shortNone.ok && shortNone.solvedFlags && shortNone.solvedFlags[1] && !shortNone.solvedFlags[0]
        ? { ok: true, id: "neg-branch-" + phrase }
        : fail("neg-branch-" + phrase, shortNone && shortNone.message)
    );
  });
  var routed = handleBiquad(engine, {
    intent: "check",
    start: "x^4+8x^2-9=0",
    history: negHist,
    factor: negFactor,
    branch: 0,
    typed: "אין",
  });
  checks.push(
    routed && routed.ok && routed.branch === 1 && routed.solvedFlags && routed.solvedFlags[1] && !routed.solvedFlags[0]
      ? { ok: true, id: "אין-routes-to-neg" }
      : fail("אין-routes-to-neg", routed && routed.message)
  );
  var falseNone = handleBiquad(engine, {
    intent: "check",
    start: "x^4+8x^2-9=0",
    history: negHist,
    factor: { split: true, trails: [[], ["אין"]] },
    branch: 0,
    typed: "אין",
  });
  checks.push(falseNone && falseNone.ok === false ? { ok: true, id: "pos-branch-אין" } : fail("pos-branch-אין", falseNone && falseNone.message));
  var xHist = ["x^10-31x^5-32=0", "t=x^5", "t^2-31t-32=0", "t=32, t=-1"];
  var xFactor = { split: true, trails: [[], []] };
  var asT = handleBiquad(engine, {
    intent: "check",
    start: "x^10-31x^5-32=0",
    history: xHist,
    factor: xFactor,
    typed: "t=2",
  });
  checks.push(asT && asT.ok === false && asT.errorId === "branchLetter" ? { ok: true, id: "branch-t" } : fail("branch-t", asT && asT.message));
  var asX = handleBiquad(engine, {
    intent: "check",
    start: "x^10-31x^5-32=0",
    history: xHist,
    factor: xFactor,
    typed: "x=2",
  });
  checks.push(asX && asX.ok && asX.branch != null ? { ok: true, id: "branch-x" } : fail("branch-x", asX && asX.message));
  var none = handleBiquad(engine, {
    intent: "check",
    start: "x^4-6x^2+10=0",
    history: ["x^4-6x^2+10=0", "t=x^2", "t^2-6t+10=0"],
    typed: "אין פתרון ממשי",
  });
  checks.push(none && none.ok && none.solved ? { ok: true, id: "no-real-t" } : fail("no-real-t", none && none.message));
  var bad = checks.filter(function (c) { return !c.ok; });
  console.log(checks.length - bad.length + "/" + bad.length);
  bad.forEach(function (c) {
    console.log("FAIL", c.id, c.detail || "");
  });
  process.exit(bad.length ? 1 : 0);
}

main();
