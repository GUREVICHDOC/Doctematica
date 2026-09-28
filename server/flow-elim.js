"use strict";

var loadEngine = require("./load-engine").loadEngine;
var createElimHandler = require("./systems-elim").createElimHandler;
var createSystemsHandler = require("./systems").createSystemsHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function main() {
  var engine = loadEngine();
  var handler = createElimHandler(engine);
  var subHandler = createSystemsHandler(engine);
  var Sys = engine.DoctematicaSystems;
  var levels = engine.DoctematicaCurriculum.levels;
  var level = null;
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-elim-1") level = levels[i];
  }
  var exercises = level.exercises;
  var passed = 0;
  var failed = [];
  function add(row) {
    if (row.ok) passed += 1;
    else failed.push(row);
  }

  function unfold(eq1, eq2, history, choices) {
    history = (history || []).slice();
    choices = (choices || []).slice();
    var eqs = [];
    var reasons = [];
    var guard = 0;
    var last = null;
    while (guard < 48) {
      guard += 1;
      var remote = handler.handle({
        topic: "systems-elim",
        intent: "one-step",
        eq1: eq1,
        eq2: eq2,
        history: history,
        choices: choices,
      });
      if (!remote || remote.ok === false) {
        return { ok: false, detail: (remote && remote.message) || "one-step", eq: remote && remote.eq, eqs: eqs };
      }
      if (!remote.step) break;
      if (remote.choice) choices = choices.concat([remote.choice]);
      if (remote.startEq) {
        eqs.push(remote.startEq);
        reasons.push("");
        history = history.concat([remote.startEq]);
      }
      eqs.push(remote.step);
      reasons.push(remote.reason || "");
      history = history.concat([remote.step]);
      last = remote;
      if (remote.solved) break;
    }
    return { ok: true, eqs: eqs, reasons: reasons, last: last, history: history, choices: choices };
  }

  function solutionEqs(eq1, eq2, history, choices) {
    var remote = handler.handle({
      topic: "systems-elim",
      intent: "solution",
      eq1: eq1,
      eq2: eq2,
      history: history || [],
      choices: choices || [],
    });
    return {
      ok: !!(remote && remote.ok),
      eqs: (remote.steps || []).map(function (s) {
        return s.eq;
      }),
      kind: remote && remote.kind,
      answer: remote && remote.answer,
    };
  }

  exercises.forEach(function (ex) {
    var walked = unfold(ex.eq1, ex.eq2);
    var sol = Sys.solvePair(ex.eq1, ex.eq2);
    var full = solutionEqs(ex.eq1, ex.eq2);
    var same = JSON.stringify(walked.eqs) === JSON.stringify(full.eqs);
    var paren = (walked.eqs[0] || "").indexOf("(") !== -1;
    var combined = walked.eqs.length > 1 && walked.eqs[0] !== walked.eqs[1];
    var kindOk = walked.ok && walked.last && walked.last.kind === sol.kind && full.kind === sol.kind;
    var numsOk =
      sol.kind !== "unique" ||
      (walked.last &&
        Math.abs(walked.last.known.x - sol.x) < 1e-6 &&
        Math.abs(walked.last.known.y - sol.y) < 1e-6);
    var op = Sys.bestElimOp(ex.eq1, ex.eq2);
    var cancelOk = !!(op && op.cancel);
    add(
      walked.ok && kindOk && numsOk && same && !paren && combined && cancelOk
        ? { ok: true, id: "elim:" + ex.n }
        : fail(
            "elim:" + ex.n,
            JSON.stringify({
              kindOk: kindOk,
              numsOk: numsOk,
              same: same,
              paren: paren,
              combined: combined,
              cancel: op && op.cancel,
              msg: walked.detail,
              eq: walked.eq,
              eqs: walked.eqs,
              known: walked.last && walked.last.known,
              sol: sol,
            })
          )
    );
    if (ex.n === 1) {
      console.log("TRACE 1");
      walked.eqs.forEach(function (eq, idx) {
        console.log((idx + 1) + ". " + eq + (walked.reasons[idx] ? "  |  " + walked.reasons[idx] : ""));
      });
      console.log("ANSWER " + (full.answer || ""));
    }
  });

  var hint0 = handler.handle({ topic: "systems-elim", intent: "hint", eq1: "x+y=11", eq2: "x-y=5", history: [], choices: [] });
  add(hint0 && hint0.ok && /y/.test(hint0.hint) && /חיבור/.test(hint0.hint) ? { ok: true, id: "hint-add-y" } : fail("hint-add-y", JSON.stringify(hint0)));
  var again = handler.handle({ topic: "systems-elim", intent: "setup", eq1: "x+y=11", eq2: "x-y=5", history: [], choices: [] });
  add(again.phase === "work_combine" ? { ok: true, id: "hint-does-not-move" } : fail("hint-does-not-move", again.phase));

  var skip = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "x+y=11",
    eq2: "x-y=5",
    history: [],
    choices: [],
    typed: "2x=16",
  });
  add(skip && skip.ok && skip.phase === "work_solve" ? { ok: true, id: "skip-to-reduced" } : fail("skip-to-reduced", JSON.stringify(skip && { ok: skip.ok, phase: skip.phase, msg: skip.message })));

  var direct = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "x+y=11",
    eq2: "x-y=5",
    history: [],
    choices: [],
    typed: "x=8",
  });
  add(direct && direct.ok && direct.phase === "pick_back" && direct.known && direct.known.x === 8 ? { ok: true, id: "skip-to-value" } : fail("skip-to-value", JSON.stringify(direct && { phase: direct.phase, known: direct.known, msg: direct.message })));

  var other = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "x+y=11",
    eq2: "x-y=5",
    history: [],
    choices: [],
    typed: "2y=6",
  });
  add(other && other.ok && other.phase === "work_solve" ? { ok: true, id: "accept-subtract" } : fail("accept-subtract", JSON.stringify(other && { phase: other.phase, msg: other.message })));
  var otherDone = unfold("x+y=11", "x-y=5", ["2y=6"], []);
  add(
    otherDone.ok && otherDone.last && otherDone.last.known.x === 8 && otherDone.last.known.y === 3 && otherDone.eqs[0] !== "x+y+x-y=11+5"
      ? { ok: true, id: "continue-student-sub" }
      : fail("continue-student-sub", JSON.stringify(otherDone.eqs))
  );

  var flipped = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "x+y=11",
    eq2: "x-y=5",
    history: [],
    choices: [],
    typed: "x+y-x-y=11-5",
  });
  add(flipped && flipped.ok === false && /סימן/.test(flipped.message) ? { ok: true, id: "partial-sign" } : fail("partial-sign", JSON.stringify(flipped)));

  var coef = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "3x+y=15",
    eq2: "7x-y=25",
    history: [],
    choices: [],
    typed: "9x=40",
  });
  add(coef && coef.ok === false && /10/.test(coef.message) ? { ok: true, id: "coef-arith" } : fail("coef-arith", JSON.stringify(coef)));

  var rhs = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "x+y=11",
    eq2: "x-y=5",
    history: [],
    choices: [],
    typed: "2x=11",
  });
  add(rhs && rhs.ok === false && /ימין/.test(rhs.message) ? { ok: true, id: "rhs-miss" } : fail("rhs-miss", JSON.stringify(rhs)));

  var nocancel = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "3x+y=15",
    eq2: "7x-y=25",
    history: [],
    choices: [],
    typed: "3x+y-7x+y=15-25",
  });
  add(nocancel && nocancel.ok === false && /לא ביטלה/.test(nocancel.message) ? { ok: true, id: "no-cancel" } : fail("no-cancel", JSON.stringify(nocancel)));

  var subStill = subHandler.handle({
    topic: "systems-sub",
    intent: "one-step",
    eq1: "5x+4y=18",
    eq2: "x+3y=8",
    history: [],
    choices: [],
  });
  add(subStill && subStill.ok && subStill.step === "x=8-3y" ? { ok: true, id: "sub-still-works" } : fail("sub-still-works", JSON.stringify(subStill && { step: subStill.step, msg: subStill.message })));

  var level2 = null;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-elim-2") level2 = levels[i];
  }
  add(level2 && level2.exercises.length === 15 ? { ok: true, id: "level2-count" } : fail("level2-count", String(level2 && level2.exercises.length)));

  (level2 ? level2.exercises : []).forEach(function (ex) {
    var walked = unfold(ex.eq1, ex.eq2);
    var sol = Sys.solvePair(ex.eq1, ex.eq2);
    var full = solutionEqs(ex.eq1, ex.eq2);
    var same = JSON.stringify(walked.eqs) === JSON.stringify(full.eqs);
    var ready = Sys.bestElimOp(ex.eq1, ex.eq2);
    var first = walked.eqs[0] || "";
    var prepOk = ready ? first.indexOf("mul:") !== 0 : first.indexOf("mul:") === 0 && (walked.eqs[1] || "").indexOf("sys:") === 0;
    var numsOk =
      walked.ok &&
      walked.last &&
      walked.last.kind === "unique" &&
      Math.abs(walked.last.known.x - sol.x) < 1e-6 &&
      Math.abs(walked.last.known.y - sol.y) < 1e-6;
    add(
      walked.ok && same && prepOk && numsOk && full.kind === "unique"
        ? { ok: true, id: "elim2:" + ex.n }
        : fail("elim2:" + ex.n, JSON.stringify({ same: same, prepOk: prepOk, numsOk: numsOk, msg: walked.detail, eqs: walked.eqs, sol: sol }))
    );
    if (ex.n === 10) {
      console.log("TRACE 10");
      walked.eqs.forEach(function (eq, idx) {
        console.log((idx + 1) + ". " + eq + (walked.reasons[idx] ? "  |  " + walked.reasons[idx] : ""));
      });
      console.log("ANSWER " + (full.answer || ""));
    }
  });

  var hint10 = handler.handle({ topic: "systems-elim", intent: "hint", eq1: "3x-2y=9", eq2: "x+y=8", history: [], choices: [] });
  add(hint10 && hint10.ok && /משוואה 2/.test(hint10.hint) && /y/.test(hint10.hint) ? { ok: true, id: "hint-prep-y" } : fail("hint-prep-y", JSON.stringify(hint10)));
  var phase10 = handler.handle({ topic: "systems-elim", intent: "setup", eq1: "3x-2y=9", eq2: "x+y=8", history: [], choices: [] });
  add(phase10.phase === "prep" ? { ok: true, id: "starts-prep" } : fail("starts-prep", phase10.phase));
  var phase20 = handler.handle({ topic: "systems-elim", intent: "setup", eq1: "7x+2y=27", eq2: "3x+2y=15", history: [], choices: [] });
  add(phase20.phase === "work_combine" && !phase20.prep ? { ok: true, id: "ready-skips-prep" } : fail("ready-skips-prep", phase20.phase));

  function prepCheck(id, typed, scale, expect) {
    var row = handler.handle({
      topic: "systems-elim",
      intent: "check",
      eq1: "3x-2y=9",
      eq2: "x+y=8",
      history: [],
      choices: [],
      typed: typed,
      scale: scale,
    });
    var ok = !!row && row.ok === expect.ok && (!expect.phase || row.phase === expect.phase) && (!expect.re || expect.re.test(row.message || ""));
    add(ok ? { ok: true, id: id } : fail(id, JSON.stringify({ ok: row && row.ok, phase: row && row.phase, msg: row && row.message })));
  }
  prepCheck("partial-term", "sys:3x-2y=9|2x+y=16", { index: 1, k: 2 }, { ok: false, re: /כל המשוואה/ });
  prepCheck("miss-rhs", "sys:3x-2y=9|2x+2y=8", { index: 1, k: 2 }, { ok: false, re: /ימין/ });
  prepCheck("scale-arith", "sys:3x-2y=9|4x+2y=16", { index: 1, k: 2 }, { ok: false, re: /טעות בכפל/ });
  prepCheck("other-changed", "sys:6x-4y=18|2x+2y=16", { index: 1, k: 2 }, { ok: false, re: /משוואה 1/ });
  prepCheck("keep-unready", "sys:3x-2y=9|5x+5y=40", { index: 1, k: 5 }, { ok: false, re: /שווים או נגדיים/ });
  var marked = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "3x+20y=20",
    eq2: "2x-5y=50",
    history: [],
    choices: [],
    typed: "mul:1:-4|3x+20y=20|2x-5y=50",
  });
  add(
    marked && marked.ok && marked.phase === "prep_write" && marked.prep && marked.prep.scale && marked.prep.scale.k === -4
      ? { ok: true, id: "mark-saved" }
      : fail("mark-saved", JSON.stringify(marked && { ok: marked.ok, phase: marked.phase, msg: marked.message }))
  );
  var wrote = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "3x+20y=20",
    eq2: "2x-5y=50",
    history: ["mul:1:-4|3x+20y=20|2x-5y=50"],
    choices: [],
    typed: "sys:3x+20y=20|-8x+20y=-200",
  });
  add(
    wrote && wrote.ok && wrote.phase === "work_combine" && /y/.test(wrote.message || "")
      ? { ok: true, id: "write-scaled-only" }
      : fail("write-scaled-only", JSON.stringify(wrote && { ok: wrote.ok, phase: wrote.phase, msg: wrote.message }))
  );
  prepCheck("prep-eq2", "sys:3x-2y=9|2x+2y=16", { index: 1, k: 2 }, { ok: true, phase: "work_combine" });
  prepCheck("prep-negative", "sys:3x-2y=9|-2x-2y=-16", { index: 1, k: -2 }, { ok: true, phase: "work_combine" });
  prepCheck("prep-other-var", "sys:3x-2y=9|3x+3y=24", { index: 1, k: 3 }, { ok: true, phase: "work_combine", re: /x/ });

  var eq1Mul = handler.handle({
    topic: "systems-elim",
    intent: "check",
    eq1: "x-y=4",
    eq2: "-3x-5y=-4",
    history: [],
    choices: [],
    typed: "sys:3x-3y=12|-3x-5y=-4",
    scale: { index: 0, k: 3 },
  });
  add(eq1Mul && eq1Mul.ok && eq1Mul.phase === "work_combine" ? { ok: true, id: "prep-eq1" } : fail("prep-eq1", JSON.stringify(eq1Mul && { ok: eq1Mul.ok, phase: eq1Mul.phase, msg: eq1Mul.message })));

  var alt = unfold("9x+2y=29", "-3x+4y=37", ["sys:9x+2y=29|-9x+12y=111"], []);
  var altSol = Sys.solvePair("9x+2y=29", "-3x+4y=37");
  add(
    alt.ok && alt.last && Math.abs(alt.last.known.x - altSol.x) < 1e-6 && Math.abs(alt.last.known.y - altSol.y) < 1e-6 && (alt.eqs[0] || "").indexOf("mul:") !== 0
      ? { ok: true, id: "continue-other-var" }
      : fail("continue-other-var", JSON.stringify(alt.eqs))
  );
  var hintAlt = handler.handle({
    topic: "systems-elim",
    intent: "hint",
    eq1: "3x-2y=9",
    eq2: "x+y=8",
    history: ["sys:3x-2y=9|3x+3y=24"],
    choices: [],
  });
  add(hintAlt && hintAlt.ok && /x/.test(hintAlt.hint) && !/ב־2/.test(hintAlt.hint) ? { ok: true, id: "hint-follows-student" } : fail("hint-follows-student", JSON.stringify(hintAlt)));
  var stepAlt = handler.handle({
    topic: "systems-elim",
    intent: "one-step",
    eq1: "3x-2y=9",
    eq2: "x+y=8",
    history: ["sys:3x-2y=9|3x+3y=24"],
    choices: [],
  });
  add(stepAlt && stepAlt.ok && stepAlt.step === "3x-2y-3x-3y=9-24" ? { ok: true, id: "step-follows-student" } : fail("step-follows-student", JSON.stringify(stepAlt && { step: stepAlt.step, msg: stepAlt.message })));

  var negDone = unfold("3x-2y=9", "x+y=8", ["sys:3x-2y=9|-2x-2y=-16"], []);
  add(
    negDone.ok && negDone.last && negDone.last.known.x === 5 && negDone.last.known.y === 3
      ? { ok: true, id: "negative-finishes" }
      : fail("negative-finishes", JSON.stringify(negDone.last && negDone.last.known))
  );

  var level3 = null;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-elim-3") level3 = levels[i];
  }
  add(level3 && level3.exercises.length === 12 ? { ok: true, id: "level3-count" } : fail("level3-count", String(level3 && level3.exercises.length)));

  function checkOn(eq1, eq2, typed, history, scale) {
    return handler.handle({
      topic: "systems-elim",
      intent: "check",
      eq1: eq1,
      eq2: eq2,
      history: history || [],
      choices: [],
      typed: typed,
      scale: scale,
    });
  }

  (level3 ? level3.exercises : []).forEach(function (ex) {
    var walked = unfold(ex.eq1, ex.eq2);
    var sol = Sys.solvePair(ex.eq1, ex.eq2);
    var full = solutionEqs(ex.eq1, ex.eq2);
    var same = JSON.stringify(walked.eqs) === JSON.stringify(full.eqs);
    var numsOk =
      walked.ok &&
      walked.last &&
      walked.last.kind === "unique" &&
      Math.abs(walked.last.known.x - sol.x) < 1e-6 &&
      Math.abs(walked.last.known.y - sol.y) < 1e-6;
    var bothMul = (walked.eqs[0] || "").indexOf(",") >= 0;
    add(
      walked.ok && same && numsOk && full.kind === "unique" && bothMul
        ? { ok: true, id: "elim3:" + ex.n }
        : fail("elim3:" + ex.n, JSON.stringify({ same: same, numsOk: numsOk, bothMul: bothMul, msg: walked.detail, eqs: walked.eqs, sol: sol }))
    );
    if (ex.n === 25) {
      console.log("TRACE 25 site");
      walked.eqs.forEach(function (eq, idx) {
        console.log((idx + 1) + ". " + eq + (walked.reasons[idx] ? "  |  " + walked.reasons[idx] : ""));
      });
      console.log("ANSWER " + (full.answer || "") + " x=" + sol.x + " y=" + sol.y);
    }
  });

  var ex25a = "5x+3y=29";
  var ex25b = "7x-5y=13";
  var x1 = Sys.scaleEquation(ex25a, 7);
  var x2 = Sys.scaleEquation(ex25b, 5);
  var y1 = Sys.scaleEquation(ex25a, 5);
  var y2 = Sys.scaleEquation(ex25b, 3);
  var big1 = Sys.scaleEquation(ex25a, 14);
  var big2 = Sys.scaleEquation(ex25b, 10);
  var neg1 = Sys.scaleEquation(ex25a, -7);
  var neg2 = Sys.scaleEquation(ex25b, -5);
  var minX = checkOn(ex25a, ex25b, "sys:" + x1 + "|" + x2, [], { factors: [7, 5] });
  add(minX && minX.ok && minX.phase === "work_combine" && /x/.test(minX.message || "") && !minX.note ? { ok: true, id: "min-x" } : fail("min-x", JSON.stringify(minX && { ok: minX.ok, phase: minX.phase, msg: minX.message, note: minX.note, eq: minX.prep })));
  var minY = checkOn(ex25a, ex25b, "sys:" + y1 + "|" + y2, [], { factors: [5, 3] });
  add(minY && minY.ok && minY.phase === "work_combine" && /y/.test(minY.message || "") && !minY.note ? { ok: true, id: "min-y" } : fail("min-y", JSON.stringify(minY && { ok: minY.ok, phase: minY.phase, msg: minY.message, note: minY.note })));
  var bothMark = checkOn(ex25a, ex25b, "mul:0:5,1:3|" + ex25a + "|" + ex25b, [], null);
  add(bothMark && bothMark.ok && bothMark.phase === "prep_write" && bothMark.prep && bothMark.prep.scale && bothMark.prep.scale.factors && bothMark.prep.scale.factors[0] === 5 && bothMark.prep.scale.factors[1] === 3 ? { ok: true, id: "both-mark" } : fail("both-mark", JSON.stringify(bothMark && { ok: bothMark.ok, phase: bothMark.phase, msg: bothMark.message, scale: bothMark.prep && bothMark.prep.scale })));
  var bothWrite = checkOn(ex25a, ex25b, "sys:" + y1 + "|" + y2, ["mul:0:5,1:3|" + ex25a + "|" + ex25b], null);
  add(bothWrite && bothWrite.ok && bothWrite.phase === "work_combine" && !bothWrite.note ? { ok: true, id: "both-write" } : fail("both-write", JSON.stringify(bothWrite && { ok: bothWrite.ok, phase: bothWrite.phase, msg: bothWrite.message, note: bothWrite.note })));
  var big = checkOn(ex25a, ex25b, "sys:" + big1 + "|" + big2, [], { factors: [14, 10] });
  add(big && big.ok && big.phase === "work_combine" && big.note && /קטנים יותר/.test(big.note) && big.prep == null ? { ok: true, id: "big-note" } : fail("big-note", JSON.stringify(big && { ok: big.ok, phase: big.phase, msg: big.message, note: big.note })));
  var bigWalk = unfold(ex25a, ex25b, ["sys:" + big1 + "|" + big2], []);
  var bigSol = Sys.solvePair(ex25a, ex25b);
  add(
    bigWalk.ok && bigWalk.last && Math.abs(bigWalk.last.known.x - bigSol.x) < 1e-6 && Math.abs(bigWalk.last.known.y - bigSol.y) < 1e-6 && (bigWalk.eqs[0] || "").indexOf("70") >= 0
      ? { ok: true, id: "big-continues" }
      : fail("big-continues", JSON.stringify(bigWalk.eqs))
  );
  console.log("TRACE 25 large");
  bigWalk.eqs.forEach(function (eq, idx) {
    console.log((idx + 1) + ". " + eq + (bigWalk.reasons[idx] ? "  |  " + bigWalk.reasons[idx] : ""));
  });
  var step1 = checkOn(ex25a, ex25b, "sys:" + x1 + "|" + ex25b, [], { factors: [7, null] });
  add(step1 && step1.ok === false && /שווים או נגדיים/.test(step1.message || "") ? { ok: true, id: "two-steps-first" } : fail("two-steps-first", JSON.stringify(step1 && { ok: step1.ok, phase: step1.phase, msg: step1.message })));
  var loneMul = checkOn(ex25a, ex25b, "mul:0:7|" + ex25a + "|" + ex25b, [], null);
  add(loneMul && loneMul.ok === false && /שווים או נגדיים/.test(loneMul.message || "") ? { ok: true, id: "lone-mul-rejected" } : fail("lone-mul-rejected", JSON.stringify(loneMul && { ok: loneMul.ok, msg: loneMul.message })));
  var step2 = checkOn(ex25a, ex25b, "sys:" + x1 + "|" + x2, [], { factors: [7, 5] });
  add(step2 && step2.ok && step2.phase === "work_combine" && !step2.note ? { ok: true, id: "two-steps-second" } : fail("two-steps-second", JSON.stringify(step2 && { ok: step2.ok, phase: step2.phase, msg: step2.message, note: step2.note })));
  var book34a = "9x-2y=55";
  var book34b = "7x-3y=50";
  var book34 = checkOn(book34a, book34b, "mul:0:4,1:3|" + book34a + "|" + book34b, [], null);
  add(book34 && book34.ok === false && /שווים או נגדיים/.test(book34.message || "") ? { ok: true, id: "book34-mismatch" } : fail("book34-mismatch", JSON.stringify(book34 && { ok: book34.ok, msg: book34.message })));
  var book34x2 = checkOn(book34a, book34b, "mul:0:2|" + book34a + "|" + book34b, [], null);
  add(book34x2 && book34x2.ok === false && /שווים או נגדיים/.test(book34x2.message || "") ? { ok: true, id: "book34-x2" } : fail("book34-x2", JSON.stringify(book34x2 && { ok: book34x2.ok, msg: book34x2.message })));
  var book34setup = handler.handle({ topic: "systems-elim", intent: "setup", eq1: book34a, eq2: book34b, history: [], choices: [] });
  add(book34setup && book34setup.prep && book34setup.prep.needsBoth === true ? { ok: true, id: "book34-needs-both" } : fail("book34-needs-both", JSON.stringify(book34setup && book34setup.prep)));
  var neg = checkOn(ex25a, ex25b, "sys:" + neg1 + "|" + neg2, [], { factors: [-7, -5] });
  add(neg && neg.ok && neg.phase === "work_combine" && !neg.note ? { ok: true, id: "neg-factors" } : fail("neg-factors", JSON.stringify(neg && { ok: neg.ok, phase: neg.phase, msg: neg.message, note: neg.note })));
  var bad1 = checkOn(ex25a, ex25b, "sys:25x+15y=145|" + x2, [], { factors: [7, 5] });
  add(bad1 && bad1.ok === false && /במשוואה 1/.test(bad1.message || "") ? { ok: true, id: "err-eq1" } : fail("err-eq1", JSON.stringify(bad1 && { ok: bad1.ok, msg: bad1.message })));
  var bad2 = checkOn(ex25a, ex25b, "sys:" + x1 + "|7x-5y=13", [], { factors: [7, 5] });
  add(bad2 && bad2.ok === false && /במשוואה 2/.test(bad2.message || "") && /כל המשוואה|ימין|טעות בכפל/.test(bad2.message || "") ? { ok: true, id: "err-eq2" } : fail("err-eq2", JSON.stringify(bad2 && { ok: bad2.ok, msg: bad2.message })));
  var missRhs = checkOn(ex25a, ex25b, "sys:" + x1 + "|35x-25y=13", [], { factors: [7, 5] });
  add(missRhs && missRhs.ok === false && /במשוואה 2/.test(missRhs.message || "") && /ימין/.test(missRhs.message || "") ? { ok: true, id: "miss-rhs-2" } : fail("miss-rhs-2", JSON.stringify(missRhs && missRhs.message)));
  var partial = checkOn(ex25a, ex25b, "sys:35x+3y=203|" + x2, [], { factors: [7, 5] });
  add(partial && partial.ok === false && /במשוואה 1/.test(partial.message || "") && /y/.test(partial.message || "") ? { ok: true, id: "partial-eq1" } : fail("partial-eq1", JSON.stringify(partial && partial.message)));
  var hintStart = handler.handle({ topic: "systems-elim", intent: "hint", eq1: ex25a, eq2: ex25b, history: [], choices: [] });
  add(hintStart && hintStart.ok && /ראשונה/.test(hintStart.hint || "") && /שנייה/.test(hintStart.hint || "") ? { ok: true, id: "hint-both" } : fail("hint-both", JSON.stringify(hintStart)));
  var hintMid = handler.handle({ topic: "systems-elim", intent: "hint", eq1: ex25a, eq2: ex25b, history: [], choices: [] });
  add(hintMid && hintMid.ok && /ראשונה/.test(hintMid.hint || "") && /שנייה/.test(hintMid.hint || "") ? { ok: true, id: "hint-after-one" } : fail("hint-after-one", JSON.stringify(hintMid)));
  var hintReady = handler.handle({ topic: "systems-elim", intent: "hint", eq1: ex25a, eq2: ex25b, history: ["sys:" + big1 + "|" + big2], choices: [] });
  add(hintReady && hintReady.ok && /70|חסרו|חברו/.test(hintReady.hint || "") ? { ok: true, id: "hint-ready-big" } : fail("hint-ready-big", JSON.stringify(hintReady)));
  var oneMid = handler.handle({ topic: "systems-elim", intent: "one-step", eq1: ex25a, eq2: ex25b, history: [], choices: [] });
  add(oneMid && oneMid.ok && oneMid.step && oneMid.step.indexOf("mul:0:5,1:3") === 0 ? { ok: true, id: "onestep-after-one" } : fail("onestep-after-one", JSON.stringify(oneMid && { step: oneMid.step, msg: oneMid.message })));
  var oneBig = handler.handle({ topic: "systems-elim", intent: "one-step", eq1: ex25a, eq2: ex25b, history: ["sys:" + big1 + "|" + big2], choices: [] });
  add(oneBig && oneBig.ok && oneBig.step && oneBig.step.indexOf("70") >= 0 && oneBig.step.indexOf("mul:") !== 0 ? { ok: true, id: "onestep-follows-big" } : fail("onestep-follows-big", JSON.stringify(oneBig && oneBig.step)));

  var l2a = "3x-2y=9";
  var l2b = "x+y=8";
  var short = handler.handle({ topic: "systems-elim", intent: "one-step", eq1: l2a, eq2: l2b, history: [], choices: [] });
  add(short && short.ok && short.step === "mul:1:2|" + l2a + "|" + l2b ? { ok: true, id: "l2-short-still" } : fail("l2-short-still", JSON.stringify(short && short.step)));
  var l2big1 = Sys.scaleEquation(l2a, -4);
  var l2big2 = Sys.scaleEquation(l2b, 8);
  var l2big = checkOn(l2a, l2b, "sys:" + l2big1 + "|" + l2big2, [], { factors: [-4, 8] });
  add(l2big && l2big.ok && l2big.phase === "work_combine" && l2big.note && /קטנים יותר/.test(l2big.note) ? { ok: true, id: "l2-both-big" } : fail("l2-both-big", JSON.stringify(l2big && { ok: l2big.ok, phase: l2big.phase, msg: l2big.message, note: l2big.note })));
  var l2next = handler.handle({ topic: "systems-elim", intent: "one-step", eq1: l2a, eq2: l2b, history: ["sys:" + l2big1 + "|" + l2big2], choices: [] });
  add(l2next && l2next.ok && l2next.step && l2next.step.indexOf("8y") >= 0 && l2next.step.indexOf("mul:") !== 0 ? { ok: true, id: "l2-stays-on-big" } : fail("l2-stays-on-big", JSON.stringify(l2next && l2next.step)));
  var l2done = unfold(l2a, l2b, ["sys:" + l2big1 + "|" + l2big2], []);
  add(l2done.ok && l2done.last && l2done.last.known.x === 5 && l2done.last.known.y === 3 ? { ok: true, id: "l2-big-finishes" } : fail("l2-big-finishes", JSON.stringify(l2done.last && l2done.last.known)));

  console.log("flow-elim: passed " + passed + ", failed " + failed.length);
  failed.forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
