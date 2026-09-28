"use strict";

var loadEngine = require("./load-engine").loadEngine;
var createQuadSystemsHandler = require("./systems-quad").createQuadSystemsHandler;
var createSystemsHandler = require("./systems").createSystemsHandler;
var createElimHandler = require("./systems-elim").createElimHandler;
var createArrangeHandler = require("./systems-arrange").createArrangeHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail || "" };
}

function main() {
  var engine = loadEngine();
  var handler = createQuadSystemsHandler(engine);
  var systems = createSystemsHandler(engine);
  var elim = createElimHandler(engine);
  var arrange = createArrangeHandler(engine);
  var Sys = engine.DoctematicaSystems;
  var level = null;
  var levels = engine.DoctematicaCurriculum.levels;
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-quad-1") level = levels[i];
  }
  var passed = 0;
  var failed = [];
  function add(row) {
    if (row.ok) passed += 1;
    else failed.push(row);
  }
  add(level && level.exercises.length === 9 ? { ok: true, id: "count" } : fail("count", String(level && level.exercises.length)));

  function call(intent, eq1, eq2, extra) {
    extra = extra || {};
    return handler.handle({
      topic: "systems-quad",
      intent: intent,
      eq1: eq1,
      eq2: eq2,
      history: extra.history || [],
      typed: extra.typed,
    });
  }

  function unfold(eq1, eq2) {
    var history = [];
    var eqs = [];
    var guard = 0;
    var last = null;
    while (guard < 80) {
      guard += 1;
      var remote = call("one-step", eq1, eq2, { history: history });
      if (!remote || remote.ok === false) return { ok: false, detail: remote && remote.message, eqs: eqs };
      if (!remote.step) break;
      eqs.push(remote.step);
      history.push(remote.step);
      last = remote;
      if (remote.solved) break;
    }
    return { ok: true, eqs: eqs, last: last, history: history };
  }

  var answers = {
    1: "(4, 16), (-4, 16)",
    2: "(0, 0), (3, 9)",
    3: "(4, 8), (-2, -4)",
    4: "(4, 8), (-1, -7)",
    5: "(4, 7), (-2, -5)",
    6: "(2, 0), (-1, -3)",
    7: "(3, 9), (2, 8)",
    8: "(4, 4), (-2, 4)",
    9: "(3, 13), (1, 9)",
  };

  (level.exercises || []).forEach(function (ex) {
    var walked = unfold(ex.eq1, ex.eq2);
    var full = call("solution", ex.eq1, ex.eq2, {});
    var same = JSON.stringify(walked.eqs) === JSON.stringify((full.steps || []).map(function (s) { return s.eq; }));
    add(walked.ok && full.ok && same && full.answer === answers[ex.n] ? { ok: true, id: "site:" + ex.n } : fail("site:" + ex.n, JSON.stringify({ same: same, answer: full.answer, detail: walked.detail })));
    var hint0 = call("hint", ex.eq1, ex.eq2, {});
    add(hint0 && /y/.test(hint0.hint || "") ? { ok: true, id: "hint-equate:" + ex.n } : fail("hint-equate:" + ex.n, hint0 && hint0.hint));
  });

  var eq1 = "y=x^2-8";
  var eq2 = "y=2x";
  var trace = call("solution", eq1, eq2, {});
  console.log("TRACE 3");
  (trace.steps || []).forEach(function (s, idx) {
    console.log((idx + 1) + ". " + s.eq + (s.reason ? "  |  " + s.reason : ""));
  });
  console.log("ANSWER " + trace.answer);

  add(call("check", eq1, eq2, { typed: "x^2-2x-8=0" }).ok ? { ok: true, id: "skip-arrange" } : fail("skip-arrange"));
  var moved = call("check", eq1, eq2, { typed: "x^2-8=2x" });
  var std = call("check", eq1, eq2, { history: ["x^2-8=2x"], typed: "x^2-2x-8=0" });
  add(moved.ok && moved.phase === "quad" && std.ok ? { ok: true, id: "move-terms" } : fail("move-terms", JSON.stringify({ moved: moved.phase, std: std })));

  var none = call("solution", "y=x^2+1", "y=0", {});
  add(none.ok && none.answer === "אין פתרון ממשי" && none.steps.every(function (s) { return s.eq.indexOf("y=") !== 0; }) ? { ok: true, id: "no-real" } : fail("no-real", JSON.stringify(none && { answer: none.answer, n: none.steps && none.steps.length })));

  var one = call("solution", "y=x^2", "y=0", {});
  add(one.ok && one.answer === "(0, 0)" ? { ok: true, id: "one-root" } : fail("one-root", one && one.answer));
  function noRecomputedY(sol) {
    return (sol.steps || []).every(function (s) { return !/^y=/.test(String(s.eq || "")); });
  }
  var known16 = call("solution", "y=x^2", "y=16", {});
  var hint16 = call("hint", "y=x^2", "y=16", {});
  add(known16.ok && known16.answer === "(4, 16), (-4, 16)" && noRecomputedY(known16) && /כבר ידוע/.test(hint16.hint || "")
    ? { ok: true, id: "known-y-16" }
    : fail("known-y-16", JSON.stringify({ answer: known16.answer, hint: hint16.hint, steps: (known16.steps || []).map(function (s) { return s.eq; }) })));
  var known4 = call("solution", "y=x^2-2x-4", "y=4", {});
  add(known4.ok && known4.answer === "(4, 4), (-2, 4)" && noRecomputedY(known4) ? { ok: true, id: "known-y-4" } : fail("known-y-4", known4 && known4.answer));

  var hist = [];
  var guard = 0;
  var atBack = null;
  while (guard < 40) {
    guard += 1;
    var step = call("one-step", eq1, eq2, { history: hist });
    if (!step.step) break;
    if (step.phase === "back" && String(step.step).indexOf("y=") === 0) {
      atBack = hist.slice();
      break;
    }
    hist.push(step.step);
  }
  var otherY = call("check", eq1, eq2, { history: atBack, typed: "y=(4)^2-8" });
  add(otherY.ok && /פשוט יותר/.test(otherY.note || "") ? { ok: true, id: "other-eq" } : fail("other-eq", JSON.stringify(otherY && { ok: otherY.ok, note: otherY.note, msg: otherY.message, phase: otherY.phase })));
  var wrongX = call("check", eq1, eq2, { history: atBack, typed: "y=2*(-2)" });
  add(wrongX.ok === false && /הערך השני/.test(wrongX.message || "") ? { ok: true, id: "wrong-x" } : fail("wrong-x", wrongX && wrongX.message));
  var badY = call("check", eq1, eq2, { history: atBack, typed: "y=2*4" });
  add(badY.ok && badY.phase === "back" ? { ok: true, id: "plug-mid" } : fail("plug-mid", JSON.stringify(badY && { ok: badY.ok, phase: badY.phase, msg: badY.message })));
  var yNow = call("check", eq1, eq2, { history: atBack.concat(["y=2*4"]), typed: "y=9" });
  add(yNow.ok === false && /לא נכון/.test(yNow.message || "") ? { ok: true, id: "bad-y" } : fail("bad-y", yNow && yNow.message));

  var doneHist = (trace.steps || []).map(function (s) { return s.eq; });
  doneHist.pop();
  function pair(typed) {
    return call("check", eq1, eq2, { history: doneHist, typed: typed });
  }
  add(pair("(4,8),(-2,-4)").ok ? { ok: true, id: "pair-comma" } : fail("pair-comma"));
  add(pair("(4 8) (-2 -4)").ok ? { ok: true, id: "pair-space" } : fail("pair-space", pair("(4 8) (-2 -4)").message));
  add(pair("x=4,y=8; x=-2,y=-4").ok && /קיצור/.test(pair("x=4 y=8; x=-2 y=-4").note || "") ? { ok: true, id: "pair-xy" } : fail("pair-xy", pair("x=4,y=8; x=-2,y=-4").message));
  add(pair("(-2,-4),(4,8)").ok ? { ok: true, id: "pair-order" } : fail("pair-order"));
  var swapped = pair("(8,4),(-4,-2)");
  add(!swapped.ok && /ראשון/.test(swapped.message || "") ? { ok: true, id: "pair-swap" } : fail("pair-swap", swapped.message));
  var mixed = pair("(4,-4),(-2,8)");
  add(!mixed.ok && /איזה ערך של y/.test(mixed.message || "") ? { ok: true, id: "pair-mix" } : fail("pair-mix", mixed.message));
  var missing = pair("(4,8)");
  add(missing.ok && missing.phase === "final_pair" && !missing.solved ? { ok: true, id: "pair-one" } : fail("pair-one", JSON.stringify(missing && { ok: missing.ok, phase: missing.phase, msg: missing.message })));
  var second = call("check", eq1, eq2, { history: doneHist.concat(["(4,8)"]), typed: "(-2,-4)" });
  add(second.ok && second.solved ? { ok: true, id: "pair-second" } : fail("pair-second", JSON.stringify(second && { ok: second.ok, phase: second.phase, msg: second.message })));
  var midHist = [];
  var midG = 0;
  while (midG < 40) {
    midG += 1;
    var midStep = call("one-step", eq1, eq2, { history: midHist });
    if (!midStep || !midStep.step) break;
    midHist.push(midStep.step);
    if (midStep.step === "y=8") break;
  }
  var early = call("check", eq1, eq2, { history: midHist, typed: "(4, 8)" });
  add(early.ok && early.phase === "back" ? { ok: true, id: "pair-early" } : fail("pair-early", JSON.stringify(early && { ok: early.ok, phase: early.phase, msg: early.message })));
  var cont = midHist.concat(["(4, 8)"]);
  var cg = 0;
  while (cg < 20) {
    cg += 1;
    var cs = call("one-step", eq1, eq2, { history: cont });
    if (!cs || !cs.step) break;
    cont.push(cs.step);
    if (cs.phase === "final_pair") break;
  }
  var onlySecond = call("check", eq1, eq2, { history: cont, typed: "(-2,-4)" });
  add(onlySecond.ok && onlySecond.solved ? { ok: true, id: "pair-unite" } : fail("pair-unite", JSON.stringify(onlySecond && { ok: onlySecond.ok, phase: onlySecond.phase, msg: onlySecond.message, hist: cont })));
  var dup = pair("(4,8),(4,8)");
  add(dup.ok && dup.phase === "final_pair" && !dup.solved ? { ok: true, id: "pair-dup" } : fail("pair-dup", dup.message));

  function linearPair(handler, topic, eq1s, eq2s) {
    var history = [];
    var choices = [];
    var guardN = 0;
    var saw = false;
    while (guardN < 70) {
      guardN += 1;
      var body = { topic: topic, intent: "one-step", eq1: eq1s, eq2: eq2s, history: history, choices: choices };
      var remote = handler.handle(body);
      if (!remote || remote.ok === false) return fail("lin", (remote && remote.message) || topic);
      if (remote.choice) choices = choices.concat([remote.choice]);
      if (remote.startEq) history = history.concat([remote.startEq]);
      if (remote.step) history = history.concat([remote.step]);
      if (remote.phase === "final_pair" || (remote.solved && String(remote.step || "").charAt(0) === "(")) saw = true;
      if (remote.solved) {
        return saw && remote.answer && remote.answer.charAt(0) === "(" ? { ok: true } : fail("lin-shape", JSON.stringify({ topic: topic, answer: remote.answer, phase: remote.phase, step: remote.step }));
      }
    }
    return fail("lin-guard", topic);
  }
  var subDone = linearPair(systems, "systems-sub", "y=x+5", "y=2x+4");
  add(subDone.ok ? { ok: true, id: "linear-sub-pair" } : fail("linear-sub-pair", subDone.detail));
  var elimDone = linearPair(elim, "systems-elim", "x+3y=36", "x=6");
  add(elimDone.ok ? { ok: true, id: "linear-elim-pair" } : fail("linear-elim-pair", elimDone.detail));

  function arrangeDone(method) {
    var history = [];
    var choices = [];
    var guardN = 0;
    var saw = false;
    while (guardN < 80) {
      guardN += 1;
      var setup = arrange.handle({ topic: "systems-arrange", intent: "setup", eq1: "4x+8y=59-3x", eq2: "4x-7y=5-2y", history: history, choices: choices });
      var hasMethod = history.some(function (line) { return String(line).indexOf("method:") === 0; });
      if (!hasMethod && setup.phase === "choose_method") {
        var chosen = arrange.handle({
          topic: "systems-arrange",
          intent: "choice",
          eq1: "4x+8y=59-3x",
          eq2: "4x-7y=5-2y",
          history: history,
          choices: choices,
          choice: { kind: "method", method: method },
        });
        if (!chosen || chosen.ok === false) return fail("arr", chosen && chosen.message);
        history = history.concat([chosen.historyMark]);
        continue;
      }
      var remote = arrange.handle({ topic: "systems-arrange", intent: "one-step", eq1: "4x+8y=59-3x", eq2: "4x-7y=5-2y", history: history, choices: choices });
      if (!remote || remote.ok === false) return fail("arr-step", remote && remote.message);
      if (remote.choice) choices = choices.concat([remote.choice]);
      if (remote.startEq) history = history.concat([remote.startEq]);
      if (remote.step) history = history.concat([remote.step]);
      if (String(remote.step || "").charAt(0) === "(") saw = true;
      if (remote.solved) return saw ? { ok: true } : fail("arr-no-pair", method + " " + remote.step);
    }
    return fail("arr-guard", method);
  }
  add(arrangeDone("sub").ok ? { ok: true, id: "arrange-sub-pair" } : fail("arrange-sub-pair", arrangeDone("sub").detail));
  add(arrangeDone("elim").ok ? { ok: true, id: "arrange-elim-pair" } : fail("arrange-elim-pair", arrangeDone("elim").detail));

  var swapLin = Sys.checkOrderedPairs("(3,2)", [{ x: 2, y: 3 }]);
  add(!swapLin.ok && /ראשון/.test(swapLin.message) ? { ok: true, id: "linear-swap-msg" } : fail("linear-swap-msg", swapLin.message));

  var level2 = null;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-quad-2") level2 = levels[i];
  }
  add(level2 && level2.exercises.length === 12 ? { ok: true, id: "l2-count" } : fail("l2-count"));
  var answers2 = {
    10: "(1, 1), (-2, 4)",
    11: "(2, 10), (-6, 18)",
    12: "(1.5, 0), (-1, 5)",
    13: "(0, -6), (5, 4)",
    14: "(1, 0), (0.8, -0.16)",
    15: "(0, -1), (1, 1)",
    16: "(4, 16), (-4, 16)",
    17: "(0, 0), (-5, 35)",
    18: "(2, 0), (0.5, 0.75)",
    19: "(3, 0)",
    20: "(3, 6)",
    21: "(0, -5)",
  };
  (level2.exercises || []).forEach(function (ex) {
    var walked = unfold(ex.eq1, ex.eq2);
    var full = call("solution", ex.eq1, ex.eq2, {});
    var same = JSON.stringify(walked.eqs) === JSON.stringify((full.steps || []).map(function (s) { return s.eq; }));
    var setup = call("setup", ex.eq1, ex.eq2, {});
    var saw = { isolate: setup.phase === "isolate", equate: setup.phase === "equate", quad: false, back: false, final_pair: false };
    var hist = [];
    var g = 0;
    while (g < 80) {
      g += 1;
      var step = call("one-step", ex.eq1, ex.eq2, { history: hist });
      if (!step || !step.step) break;
      if (saw.hasOwnProperty(step.phase)) saw[step.phase] = true;
      hist.push(step.step);
      if (step.solved) break;
    }
    var isoOk = setup.phase === "isolate" ? saw.isolate : setup.phase === "equate";
    add(walked.ok && full.solved && same && full.answer === answers2[ex.n] && isoOk && saw.equate && saw.quad && saw.back && saw.final_pair
      ? { ok: true, id: "l2-site:" + ex.n }
      : fail("l2-site:" + ex.n, JSON.stringify({ answer: full.answer, same: same, saw: saw, detail: walked.detail, msg: full.message })));
    if (setup.phase === "isolate") {
      add(/בודדו/.test(setup.prompt || "") ? { ok: true, id: "l2-hint0:" + ex.n } : fail("l2-hint0:" + ex.n, setup.prompt));
    } else {
      add(setup.phase === "equate" && /y/.test(setup.prompt || "") ? { ok: true, id: "l2-hint0:" + ex.n } : fail("l2-hint0:" + ex.n, setup.prompt));
    }
  });
  var both = call("solution", "y=2x^2+3x", "y=x^2-2x", {});
  add(both.ok && both.steps[0].eq === "2x^2+3x=x^2-2x" && both.steps[1].eq !== "x^2+5x=0" ? { ok: true, id: "l2-both-quad" } : fail("l2-both-quad", both.steps && both.steps[0] && both.steps[0].eq));

  var a = "y=x^2";
  var b = "x+y=2";
  var sign = call("check", a, b, { typed: "y=2+x" });
  add(!sign.ok && /סימן/.test(sign.message || "") ? { ok: true, id: "l2-sign" } : fail("l2-sign", sign && sign.message));
  var other = call("check", a, b, { typed: "x=2-y" });
  add(other.ok && other.phase === "equate" && /חוקית/.test(other.note || "") ? { ok: true, id: "l2-other-isol" } : fail("l2-other-isol", JSON.stringify(other && { ok: other.ok, phase: other.phase, note: other.note, msg: other.message })));
  var alt = [];
  var altHist = ["x=2-y"];
  var altAns = "";
  var ag = 0;
  while (ag < 40) {
    ag += 1;
    var as = call("one-step", a, b, { history: altHist });
    if (!as || as.ok === false) { altAns = as && as.message; break; }
    if (!as.step) break;
    alt.push(as.step);
    altHist.push(as.step);
    if (as.solved) { altAns = as.answer; break; }
  }
  add(alt[0] === "y=(2-y)^2" && altAns === "(-2, 4), (1, 1)" ? { ok: true, id: "l2-quad-in-y" } : fail("l2-quad-in-y", JSON.stringify({ first: alt[0], answer: altAns })));
  var partial = call("check", a, b, { history: ["y=2-x"], typed: "x^2=2-y" });
  add(!partial.ok && /חלקית/.test(partial.message || "") ? { ok: true, id: "l2-partial" } : fail("l2-partial", partial && partial.message));
  var parens = call("check", a, b, { history: ["x=2-y"], typed: "y=2-y^2" });
  add(!parens.ok && /סוגריים/.test(parens.message || "") ? { ok: true, id: "l2-parens" } : fail("l2-parens", parens && parens.message));
  var afterIso = call("hint", a, b, { history: ["y=2-x"] });
  add(afterIso.phase === "equate" && /הציבו/.test(afterIso.hint || "") ? { ok: true, id: "l2-hint-sub" } : fail("l2-hint-sub", afterIso && afterIso.hint));
  var mid = call("hint", "y=-x^2+7x-6", "2x-y=6", { history: ["-y=6-2x"] });
  add(mid.phase === "isolate" && mid.hint ? { ok: true, id: "l2-hint-mid" } : fail("l2-hint-mid", mid && mid.hint));

  var endHist = unfold(a, b).history;
  endHist.pop();
  var pair = call("check", a, b, { history: endHist, typed: "(1 1) (-2 4)" });
  add(pair.ok && pair.solved ? { ok: true, id: "l2-no-comma" } : fail("l2-no-comma", JSON.stringify(pair && { ok: pair.ok, msg: pair.message, phase: pair.phase })));
  var named = call("check", a, b, { history: endHist, typed: "x=1, y=1; x=-2, y=4" });
  add(named.ok && named.solved ? { ok: true, id: "l2-xy" } : fail("l2-xy", named && named.message));
  var rev = call("check", a, b, { history: endHist, typed: "(-2, 4), (1, 1)" });
  add(rev.ok ? { ok: true, id: "l2-order" } : fail("l2-order", rev && rev.message));
  var cross = call("check", a, b, { history: endHist, typed: "(1, 4), (-2, 1)" });
  add(!cross.ok && /מתאים/.test(cross.message || "") ? { ok: true, id: "l2-cross" } : fail("l2-cross", cross && cross.message));
  var one = call("check", a, b, { history: endHist, typed: "(1, 1)" });
  add(one.ok && one.phase === "final_pair" && !one.solved ? { ok: true, id: "l2-forgot" } : fail("l2-forgot", one && one.message));
  var swapped = call("check", a, b, { history: endHist, typed: "(4, -2), (1, 1)" });
  add(!swapped.ok && /ראשון/.test(swapped.message || "") ? { ok: true, id: "l2-swap" } : fail("l2-swap", swapped && swapped.message));

  console.log("TRACE 10");
  var trace10 = call("solution", a, b, {});
  (trace10.steps || []).forEach(function (s, idx) {
    console.log((idx + 1) + ". " + s.eq + (s.reason ? "  |  " + s.reason : ""));
  });
  console.log("ANSWER " + trace10.answer);
  console.log("TRACE 10 ALT");
  console.log("1. x=2-y  |  בידוד x במקום y");
  alt.forEach(function (eq, idx) {
    console.log((idx + 2) + ". " + eq);
  });

  var level3 = null;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-quad-3") level3 = levels[i];
  }
  add(level3 && level3.exercises.length === 8 ? { ok: true, id: "l3-count" } : fail("l3-count"));
  var answers3 = {
    50: "(4, 8), (-2, -4)",
    51: "(8, 6), (-20, 62)",
    52: "(3, 4), (-1.25, 10.375)",
    53: "(1, -5)",
    54: "(2, 6), (-6, -2)",
    55: "(1, 7), (-5, 1)",
    56: "(-274, 94), (2, 2)",
    57: "(5, 2), (-4, -2.5)",
  };
  function pairSet(text) {
    return String(text || "")
      .replace(/\s+/g, "")
      .split("),")
      .map(function (bit) { return bit.charAt(bit.length - 1) === ")" ? bit : bit + ")"; })
      .sort()
      .join("|");
  }
  (level3.exercises || []).forEach(function (ex) {
    var walked = unfold(ex.eq1, ex.eq2);
    var full = call("solution", ex.eq1, ex.eq2, {});
    var same = JSON.stringify(walked.eqs) === JSON.stringify((full.steps || []).map(function (s) { return s.eq; }));
    var setup = call("setup", ex.eq1, ex.eq2, {});
    var hintsOk = true;
    var hist = [];
    var g = 0;
    var phases = {};
    phases[setup.phase] = true;
    while (g < 80) {
      g += 1;
      var step = call("one-step", ex.eq1, ex.eq2, { history: hist });
      if (!step || !step.step) break;
      phases[step.phase] = true;
      if (!step.hint) hintsOk = false;
      hist.push(step.step);
      if (step.solved) break;
    }
    add(walked.ok && full.solved && same && full.answer === answers3[ex.n] && hintsOk && phases.equate && phases.quad && phases.back && phases.final_pair
      ? { ok: true, id: "l3-site:" + ex.n }
      : fail("l3-site:" + ex.n, JSON.stringify({ answer: full.answer, same: same, phases: phases, hintsOk: hintsOk, detail: walked.detail, msg: full.message })));
    if (setup.phase === "isolate") {
      add(/בודדו/.test(setup.prompt || "") ? { ok: true, id: "l3-hint0:" + ex.n } : fail("l3-hint0:" + ex.n, setup.prompt));
    } else {
      add(setup.phase === "equate" && setup.prompt ? { ok: true, id: "l3-hint0:" + ex.n } : fail("l3-hint0:" + ex.n, setup.prompt));
    }
  });

  var ex54 = level3.exercises.filter(function (ex) { return ex.n === 54; })[0];
  var s54 = call("solution", ex54.eq1, ex54.eq2, {});
  add(s54.steps[0].eq === "x^2+(x+4)^2=40" ? { ok: true, id: "l3-y2" } : fail("l3-y2", s54.steps[0].eq));
  var h54 = call("setup", ex54.eq1, ex54.eq2, {});
  add(/כבר מבודד/.test(h54.prompt || "") && /y²/.test(h54.prompt || "") ? { ok: true, id: "l3-hint-y2" } : fail("l3-hint-y2", h54.prompt));
  var badSq = call("check", ex54.eq1, ex54.eq2, { typed: "x^2+x^2+16=40" });
  add(!badSq.ok && /ריבוע/.test(badSq.message || "") ? { ok: true, id: "l3-bad-square" } : fail("l3-bad-square", badSq && badSq.message));
  var headOnly = call("check", ex54.eq1, ex54.eq2, { typed: "x^2+x^2+4=40" });
  add(!headOnly.ok && /החלק הראשון/.test(headOnly.message || "") ? { ok: true, id: "l3-head-only" } : fail("l3-head-only", headOnly && headOnly.message));
  var lost = call("check", ex54.eq1, ex54.eq2, { typed: "x^2+x+4^2=40" });
  add(!lost.ok && /סוגריים/.test(lost.message || "") ? { ok: true, id: "l3-lost-paren" } : fail("l3-lost-paren", lost && lost.message));
  var partial54 = call("check", ex54.eq1, ex54.eq2, { typed: "x^2+y^2=40" });
  add(!partial54.ok && /חלקית|הציבו/.test(partial54.message || "") ? { ok: true, id: "l3-partial" } : fail("l3-partial", partial54 && partial54.message));

  var ex55 = level3.exercises.filter(function (ex) { return ex.n === 55; })[0];
  var s55 = call("solution", ex55.eq1, ex55.eq2, {});
  add(s55.steps[0].eq === "(x+3)^2+((x+6)-5)^2=20" && s55.steps[1].eq === "(x+3)^2+(x+1)^2=20" && s55.steps[2].eq.indexOf("x^2") === 0
    ? { ok: true, id: "l3-two-squares" }
    : fail("l3-two-squares", s55.steps.slice(0, 3).map(function (s) { return s.eq; }).join(" || ")));
  var skipFold = call("check", ex55.eq1, ex55.eq2, { typed: "x^2+6x+9+x^2+2x+1=20" });
  add(skipFold.ok && /פשט/.test(skipFold.note || "") ? { ok: true, id: "l3-skip-fold" } : fail("l3-skip-fold", JSON.stringify(skipFold && { ok: skipFold.ok, note: skipFold.note, msg: skipFold.message })));

  var ex56 = level3.exercises.filter(function (ex) { return ex.n === 56; })[0];
  var s56 = call("solution", ex56.eq1, ex56.eq2, {});
  add(s56.steps[0].eq === "x=8-3y" && s56.steps[1].eq === "2(8-3y)^2-17y^2=-60" ? { ok: true, id: "l3-solve-y" } : fail("l3-solve-y", s56.steps.slice(0, 2).map(function (s) { return s.eq; }).join(" || ")));
  var alt56 = [];
  var alt56Hist = ["y=(8-x)/3"];
  var alt56Ans = "";
  var a56 = 0;
  while (a56 < 40) {
    a56 += 1;
    var st56 = call("one-step", ex56.eq1, ex56.eq2, { history: alt56Hist });
    if (!st56 || st56.ok === false) { alt56Ans = st56 && st56.message; break; }
    if (!st56.step) break;
    alt56.push(st56.step);
    alt56Hist.push(st56.step);
    if (st56.solved) { alt56Ans = st56.answer; break; }
  }
  add(pairSet(alt56Ans) === pairSet(answers3[56]) ? { ok: true, id: "l3-other-isol" } : fail("l3-other-isol", alt56Ans + " | " + (alt56[0] || "")));

  var ex57 = level3.exercises.filter(function (ex) { return ex.n === 57; })[0];
  var s57 = call("solution", ex57.eq1, ex57.eq2, {});
  add(s57.steps[0].eq === "(2y+1)y=10" && s57.steps[1].eq === "y(2y+1)=10" && s57.steps[2].eq === "2y^2+y=10" && s57.steps[3].eq === "2y^2+y-10=0"
    ? { ok: true, id: "l3-xy" }
    : fail("l3-xy", s57.steps.slice(0, 4).map(function (s) { return s.eq; }).join(" || ")));
  var lostXy = call("check", ex57.eq1, ex57.eq2, { typed: "2y+1y=10" });
  add(!lostXy.ok && /סוגריים/.test(lostXy.message || "") ? { ok: true, id: "l3-xy-paren" } : fail("l3-xy-paren", lostXy && lostXy.message));

  var end54 = unfold(ex54.eq1, ex54.eq2).history;
  end54.pop();
  var onePair = call("check", ex54.eq1, ex54.eq2, { history: end54, typed: "(2, 6)" });
  add(onePair.ok && onePair.phase === "final_pair" && !onePair.solved ? { ok: true, id: "l3-one-branch" } : fail("l3-one-branch", onePair && onePair.message));
  var crossed = call("check", ex54.eq1, ex54.eq2, { history: end54, typed: "(2, -2), (-6, 6)" });
  add(!crossed.ok && /מתאים/.test(crossed.message || "") ? { ok: true, id: "l3-cross" } : fail("l3-cross", crossed && crossed.message));
  var swapped54 = call("check", ex54.eq1, ex54.eq2, { history: end54, typed: "(6, 2), (-2, -6)" });
  add(!swapped54.ok && /ראשון/.test(swapped54.message || "") ? { ok: true, id: "l3-swap" } : fail("l3-swap", swapped54 && swapped54.message));
  var pairs54 = call("check", ex54.eq1, ex54.eq2, { history: end54, typed: "(-6, -2), (2, 6)" });
  add(pairs54.ok && pairs54.solved ? { ok: true, id: "l3-pairs" } : fail("l3-pairs", pairs54 && pairs54.message));

  var ex2 = level.exercises.filter(function (ex) { return ex.n === 2; })[0];
  var setup2 = call("setup", ex2.eq1, ex2.eq2, {});
  add(setup2.ok && !setup2.offerFormula ? { ok: true, id: "formula-hidden-start" } : fail("formula-hidden-start", JSON.stringify(setup2 && setup2.offerFormula)));
  var hist2 = [];
  var arranged2 = null;
  var guard2 = 0;
  while (guard2 < 20) {
    guard2 += 1;
    var step2 = call("one-step", ex2.eq1, ex2.eq2, { history: hist2 });
    if (!step2 || step2.ok === false || !step2.step) break;
    hist2.push(step2.step);
    if (step2.offerFormula) {
      arranged2 = { history: hist2.slice(), eq: step2.formulaEq, letter: step2.formulaLetter };
      break;
    }
  }
  add(arranged2 && arranged2.letter === "x" && arranged2.eq === "x^2-3x=0"
    ? { ok: true, id: "formula-offer-2" }
    : fail("formula-offer-2", JSON.stringify(arranged2)));
  var factored2 = call("one-step", ex2.eq1, ex2.eq2, { history: arranged2.history });
  add(factored2.ok && factored2.step === "x(x-3)=0" && !factored2.offerFormula
    ? { ok: true, id: "formula-hides-after-factor" }
    : fail("formula-hides-after-factor", JSON.stringify({ step: factored2 && factored2.step, offer: factored2 && factored2.offerFormula })));
  var roots2 = call("check", ex2.eq1, ex2.eq2, { history: arranged2.history, typed: "x = 3, x = 0" });
  add(roots2.ok && roots2.phase === "back" ? { ok: true, id: "formula-roots-2" } : fail("formula-roots-2", JSON.stringify({ ok: roots2 && roots2.ok, phase: roots2 && roots2.phase, message: roots2 && roots2.message })));
  var afterFormula = arranged2.history.concat(["x = 3, x = 0"]);
  var guardF = 0;
  var ansF = "";
  while (guardF < 20) {
    guardF += 1;
    var cont = call("one-step", ex2.eq1, ex2.eq2, { history: afterFormula });
    if (!cont || cont.ok === false || !cont.step) { ansF = cont && (cont.answer || cont.message); break; }
    afterFormula.push(cont.step);
    if (cont.solved) { ansF = cont.answer; break; }
  }
  add(pairSet(ansF) === pairSet(answers[2]) ? { ok: true, id: "formula-pairs-2" } : fail("formula-pairs-2", ansF));

  var ex56f = level3.exercises.filter(function (ex) { return ex.n === 56; })[0];
  var hist56 = [];
  var arranged56 = null;
  var guard56 = 0;
  while (guard56 < 40) {
    guard56 += 1;
    var step56 = call("one-step", ex56f.eq1, ex56f.eq2, { history: hist56 });
    if (!step56 || step56.ok === false || !step56.step) break;
    hist56.push(step56.step);
    if (step56.offerFormula) {
      arranged56 = { history: hist56.slice(), eq: step56.formulaEq, letter: step56.formulaLetter };
      break;
    }
  }
  add(arranged56 && arranged56.letter === "y" && arranged56.eq.indexOf("y") < 0
    ? { ok: true, id: "formula-offer-56" }
    : fail("formula-offer-56", JSON.stringify(arranged56)));
  var roots56 = call("check", ex56f.eq1, ex56f.eq2, { history: arranged56.history, typed: "y = 2, y = 94" });
  var after56 = arranged56.history.concat(["y = 2, y = 94"]);
  var ans56 = "";
  var guard56b = 0;
  if (roots56 && roots56.ok) {
    while (guard56b < 30) {
      guard56b += 1;
      var cont56 = call("one-step", ex56f.eq1, ex56f.eq2, { history: after56 });
      if (!cont56 || cont56.ok === false || !cont56.step) { ans56 = cont56 && (cont56.answer || cont56.message); break; }
      after56.push(cont56.step);
      if (cont56.solved) { ans56 = cont56.answer; break; }
    }
  }
  add(roots56 && roots56.ok && pairSet(ans56) === pairSet(answers3[56])
    ? { ok: true, id: "formula-pairs-56" }
    : fail("formula-pairs-56", (roots56 && roots56.message) + " | " + ans56 + " | " + (arranged56 && arranged56.eq)));

  [54, 55, 56, 57].forEach(function (n) {
    var ex = level3.exercises.filter(function (row) { return row.n === n; })[0];
    var trace = call("solution", ex.eq1, ex.eq2, {});
    console.log("TRACE " + n);
    (trace.steps || []).forEach(function (s, idx) {
      console.log((idx + 1) + ". " + s.eq + (s.reason ? "  |  " + s.reason : ""));
    });
    console.log("ANSWER " + trace.answer);
  });

  console.log("flow-quad-systems: passed " + passed + ", failed " + failed.length);
  failed.forEach(function (row) {
    console.log("FAIL", row.id, row.detail);
  });
  if (failed.length) process.exit(1);
}

main();
