"use strict";

var loadEngine = require("./load-engine").loadEngine;
var createArrangeHandler = require("./systems-arrange").createArrangeHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function main() {
  var engine = loadEngine();
  var handler = createArrangeHandler(engine);
  var Sys = engine.DoctematicaSystems;
  var level = null;
  var i;
  var levels = engine.DoctematicaCurriculum.levels;
  var level2 = null;
  var level3 = null;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-arr-1") level = levels[i];
    if (levels[i].id === "sys-arr-2") level2 = levels[i];
    if (levels[i].id === "sys-arr-3") level3 = levels[i];
  }
  var passed = 0;
  var failed = [];
  function add(row) {
    if (row.ok) passed += 1;
    else failed.push(row);
  }
  add(level && level.exercises.length === 8 ? { ok: true, id: "level-count" } : fail("level-count", String(level && level.exercises.length)));
  add(level2 && level2.exercises.length === 6 ? { ok: true, id: "level2-count" } : fail("level2-count", String(level2 && level2.exercises.length)));
  add(level3 && level3.exercises.length === 12 ? { ok: true, id: "level3-count" } : fail("level3-count", String(level3 && level3.exercises.length)));

  function call(intent, eq1, eq2, extra) {
    extra = extra || {};
    return handler.handle({
      topic: "systems-arrange",
      intent: intent,
      eq1: eq1,
      eq2: eq2,
      history: extra.history || [],
      choices: extra.choices || [],
      typed: extra.typed,
      choice: extra.choice,
    });
  }

  function unfold(eq1, eq2) {
    var history = [];
    var choices = [];
    var eqs = [];
    var guard = 0;
    var last = null;
    while (guard < 90) {
      guard += 1;
      var remote = call("one-step", eq1, eq2, { history: history, choices: choices });
      if (!remote || remote.ok === false) return { ok: false, detail: (remote && remote.message) || "one-step", eqs: eqs };
      if (!remote.step) break;
      if (remote.choice) choices = choices.concat([remote.choice]);
      if (remote.startEq) {
        eqs.push(remote.startEq);
        history = history.concat([remote.startEq]);
      }
      eqs.push(remote.step);
      history = history.concat([remote.step]);
      last = remote;
      if (remote.solved) break;
    }
    return { ok: true, eqs: eqs, last: last, history: history, choices: choices };
  }

  function finishWith(eq1, eq2, method) {
    var history = [];
    var choices = [];
    var guard = 0;
    var last = null;
    while (guard < 90) {
      guard += 1;
      var setup = call("setup", eq1, eq2, { history: history, choices: choices });
      var hasMethod = history.some(function (line) { return String(line).indexOf("method:") === 0; });
      if (!hasMethod && setup.phase === "choose_method") {
        var chosen = call("choice", eq1, eq2, { history: history, choices: choices, choice: { kind: "method", method: method } });
        if (!chosen || chosen.ok === false) return { ok: false, detail: chosen && chosen.message };
        history = history.concat([chosen.historyMark]);
        last = chosen;
        continue;
      }
      var remote = call("one-step", eq1, eq2, { history: history, choices: choices });
      if (!remote || remote.ok === false) return { ok: false, detail: remote && remote.message };
      if (!remote.step) return { ok: false, detail: "no step" };
      if (remote.choice) choices = choices.concat([remote.choice]);
      if (remote.startEq) history = history.concat([remote.startEq]);
      history = history.concat([remote.step]);
      last = remote;
      if (remote.solved) return { ok: true, last: last, history: history, phase: remote.phase };
    }
    return { ok: false, detail: "guard", phase: last && last.phase };
  }

  [level, level2, level3].forEach(function (lv) {
    if (!lv) return;
  (lv.exercises || []).forEach(function (ex) {
    var sol = Sys.solvePair(ex.eq1, ex.eq2);
    var walked = unfold(ex.eq1, ex.eq2);
    var full = call("solution", ex.eq1, ex.eq2, {});
    var same = JSON.stringify(walked.eqs) === JSON.stringify((full.steps || []).map(function (s) { return s.eq; }));
    var nums = walked.ok && walked.last && walked.last.known && Math.abs(walked.last.known.x - sol.x) < 1e-6 && Math.abs(walked.last.known.y - sol.y) < 1e-6;
    add(walked.ok && full.ok && same && nums ? { ok: true, id: "site:" + ex.n } : fail("site:" + ex.n, JSON.stringify({ same: same, nums: nums, detail: walked.detail, answer: full.answer, n: full.steps && full.steps.length })));
    ["sub", "elim"].forEach(function (method) {
      var done = finishWith(ex.eq1, ex.eq2, method);
      var ok = done.ok && done.last && done.last.known && Math.abs(done.last.known.x - sol.x) < 1e-6 && Math.abs(done.last.known.y - sol.y) < 1e-6;
      add(ok ? { ok: true, id: method + ":" + ex.n } : fail(method + ":" + ex.n, JSON.stringify({ detail: done.detail, known: done.last && done.last.known, sol: sol })));
    });
    if (ex.n === 1 || ex.n === 11 || ex.n === 17 || ex.n === 24) {
      console.log("TRACE " + ex.n + " site");
      (full.steps || []).forEach(function (s, idx) { console.log((idx + 1) + ". " + s.eq + (s.reason ? "  |  " + s.reason : "")); });
      console.log("ANSWER " + full.answer);
    }
  });
  });

  var subWalk = finishWith("4x+8y=59-3x", "4x-7y=5-2y", "sub");
  console.log("TRACE 1 sub choice phase-start skipped; solved", subWalk.ok, subWalk.last && subWalk.last.answer);

  var yx = call("check", "4x+8y=59-3x", "4x-7y=5-2y", { typed: "sys:8y+7x=59|4x-5y=5" });
  add(yx && yx.ok && yx.phase === "choose_method" && yx.arrange && yx.arrange.eq1.indexOf("8y+7x") === 0 ? { ok: true, id: "y-before-x" } : fail("y-before-x", JSON.stringify(yx && { ok: yx.ok, phase: yx.phase, eq: yx.arrange && yx.arrange.eq1, msg: yx.message })));

  var both = call("check", "4x+8y=59-3x", "4x-7y=5-2y", { typed: "sys:7x+8y=59|4x-5y=5" });
  add(both && both.ok && both.phase === "choose_method" ? { ok: true, id: "both-at-once" } : fail("both-at-once", JSON.stringify(both && { ok: both.ok, phase: both.phase, msg: both.message })));

  var eq2first = call("check", "4x+8y=59-3x", "4x-7y=5-2y", { typed: "sys:4x+8y=59-3x|4x-5y=5" });
  add(eq2first && eq2first.ok && eq2first.phase === "normalize" && eq2first.arrange.eq1 === "4x+8y=59-3x" ? { ok: true, id: "eq2-first" } : fail("eq2-first", JSON.stringify(eq2first && { ok: eq2first.ok, phase: eq2first.phase, msg: eq2first.message })));

  var copyReady = call("check", "4x+8y=59-3x", "4x-7y=5-2y", {
    history: ["sys:7x+8y=59|4x-7y=5-2y"],
    typed: "sys:7x+8y=59|4x-5y=5",
  });
  add(copyReady && copyReady.ok && copyReady.arrange.eq1 === "7x+8y=59" ? { ok: true, id: "copy-ready" } : fail("copy-ready", JSON.stringify(copyReady && { ok: copyReady.ok, eq: copyReady.arrange, msg: copyReady.message })));

  var sign = call("check", "4x+8y=59-3x", "4x-7y=5-2y", { typed: "sys:4x+8y=59+3x|4x-7y=5-2y" });
  add(sign && sign.ok === false && /במשוואה 1/.test(sign.message || "") && /סימן/.test(sign.message || "") ? { ok: true, id: "sign-flip" } : fail("sign-flip", JSON.stringify(sign && sign.message)));

  var oneSide = call("check", "4x+8y=59-3x", "4x-7y=5-2y", { typed: "sys:4x+8y+3x=59-3x|4x-7y=5-2y" });
  add(oneSide && oneSide.ok === false && /במשוואה 1/.test(oneSide.message || "") && /אגף/.test(oneSide.message || "") ? { ok: true, id: "one-side" } : fail("one-side", JSON.stringify(oneSide && oneSide.message)));

  var badJoin = call("check", "4x+8y=59-3x", "4x-7y=5-2y", { typed: "sys:8x+8y=59|4x-7y=5-2y" });
  add(badJoin && badJoin.ok === false && /במשוואה 1/.test(badJoin.message || "") ? { ok: true, id: "bad-combine" } : fail("bad-combine", JSON.stringify(badJoin && badJoin.message)));

  var only2 = call("check", "4x+8y=59-3x", "4x-7y=5-2y", { typed: "sys:7x+8y=59|4x-7y=5" });
  add(only2 && only2.ok === false && /במשוואה 2/.test(only2.message || "") && !/במשוואה 1/.test(only2.message || "") ? { ok: true, id: "err-eq2" } : fail("err-eq2", JSON.stringify(only2 && only2.message)));

  var longer = call("check", "4x+8y=59-3x", "4x-7y=5-2y", {
    history: ["sys:4x+3x+8y=59|4x-7y=5-2y"],
    typed: "sys:4x+3x+8y-59=0|4x-7y=5-2y",
  });
  add(longer && longer.ok && /לכנס קודם/.test(longer.note || "") ? { ok: true, id: "longer-note" } : fail("longer-note", JSON.stringify(longer && { ok: longer.ok, note: longer.note, msg: longer.message })));

  var idle = call("check", "7x+8y=59", "4x-5y=5", { typed: "sys:8y+7x=59|4x-5y=5" });
  add(idle && idle.ok && /כבר הייתה מסודרת/.test(idle.note || "") && idle.arrange.eq1.indexOf("8y") === 0 ? { ok: true, id: "already-note" } : fail("already-note", JSON.stringify(idle && { ok: idle.ok, note: idle.note, eq: idle.arrange && idle.arrange.eq1 })));

  var hint0 = call("hint", "4x+8y=59-3x", "4x-7y=5-2y", {});
  add(hint0 && hint0.ok && /x/.test(hint0.hint || "") ? { ok: true, id: "hint-start" } : fail("hint-start", JSON.stringify(hint0)));
  var hintMid = call("hint", "4x+8y=59-3x", "4x-7y=5-2y", { history: ["sys:7x+8y=59|4x-7y=5-2y"] });
  add(hintMid && hintMid.ok && /משוואה 1 כבר מסודרת/.test(hintMid.hint || "") && /משוואה 2/.test(hintMid.hint || "") ? { ok: true, id: "hint-after-one" } : fail("hint-after-one", JSON.stringify(hintMid)));

  var isoHist = ["sys:7x-3y=10|y=(3/2)x"];
  var isoPick = call("choice", "7x-5y+8=18-2y", "3x=2y", { history: isoHist, choice: { kind: "method", method: "sub" } });
  add(isoPick && isoPick.ok && isoPick.phase === "pick_sub" && isoPick.historyMark === "method:sub" ? { ok: true, id: "handoff-iso" } : fail("handoff-iso", JSON.stringify(isoPick && { ok: isoPick.ok, phase: isoPick.phase, msg: isoPick.message, mark: isoPick.historyMark })));
  var isoStep = call("one-step", "7x-5y+8=18-2y", "3x=2y", { history: isoHist.concat(["method:sub"]) });
  add(isoStep && isoStep.ok && String(isoStep.step || "").indexOf("method:") !== 0 && String(isoStep.phase || "").indexOf("isolate") < 0 ? { ok: true, id: "handoff-iso-nostart" } : fail("handoff-iso-nostart", JSON.stringify(isoStep && { phase: isoStep.phase, step: isoStep.step, msg: isoStep.message })));

  var elimPhase = call("choice", "2x+3y=7+x", "x+y=4", {
    history: ["sys:x+3y=7|x+y=4"],
    choice: { kind: "method", method: "elim" },
  });
  var readyElim2 = finishWith("2x+3y=7+x", "x+y=4", "elim");
  add(elimPhase && elimPhase.phase === "work_combine" && readyElim2.ok ? { ok: true, id: "handoff-ready-elim" } : fail("handoff-ready-elim", JSON.stringify({ phase: elimPhase && elimPhase.phase, err: readyElim2.detail, msg: elimPhase && elimPhase.message })));

  var oneMul = call("choice", "2x+y=4+x", "3x+2y=7", {
    history: ["sys:x+y=4|3x+2y=7"],
    choice: { kind: "method", method: "elim" },
  });
  var oneMulStep = call("one-step", "2x+y=4+x", "3x+2y=7", { history: ["sys:x+y=4|3x+2y=7", "method:elim"] });
  add(oneMul && oneMul.phase === "prep" && oneMulStep && oneMulStep.ok && /^mul:\d+:/.test(oneMulStep.step || "") && String(oneMulStep.step).indexOf(",") < 0 ? { ok: true, id: "handoff-one-mul" } : fail("handoff-one-mul", JSON.stringify({ phase: oneMul && oneMul.phase, step: oneMulStep && oneMulStep.step, msg: oneMulStep && oneMulStep.message })));

  var twoMul = call("one-step", "4x+8y=59-3x", "4x-7y=5-2y", { history: ["sys:7x+8y=59|4x-5y=5", "method:elim"] });
  add(twoMul && twoMul.ok && String(twoMul.step || "").indexOf("mul:") === 0 && String(twoMul.step).indexOf(",") >= 0 ? { ok: true, id: "handoff-two-mul" } : fail("handoff-two-mul", JSON.stringify(twoMul && { step: twoMul.step, phase: twoMul.phase, msg: twoMul.message })));

  var valued = call("choice", "x+3=8", "2x+y=11", {
    history: ["sys:x=5|2x+y=11"],
    choice: { kind: "method", method: "sub" },
  });
  add(valued && valued.ok && valued.phase === "pick_sub" && valued.known && valued.known.x === 5 ? { ok: true, id: "handoff-value" } : fail("handoff-value", JSON.stringify(valued && { ok: valued.ok, phase: valued.phase, known: valued.known, msg: valued.message })));
  var valueStep = call("one-step", "x+3=8", "2x+y=11", { history: ["sys:x=5|2x+y=11", "method:sub"] });
  add(valueStep && valueStep.ok && /5/.test(valueStep.step || "") && String(valueStep.step).indexOf("x=5") !== 0 ? { ok: true, id: "handoff-value-uses" } : fail("handoff-value-uses", JSON.stringify(valueStep && { step: valueStep.step, phase: valueStep.phase, msg: valueStep.message })));

  var book = level2.exercises;
  var ex11 = book[0];
  var hintParen = call("hint", ex11.eq1, ex11.eq2, {});
  add(hintParen && /סוגריים/.test(hintParen.hint || "") ? { ok: true, id: "l2-hint-paren" } : fail("l2-hint-paren", JSON.stringify(hintParen)));
  var stepParen = call("one-step", ex11.eq1, ex11.eq2, {});
  add(stepParen && stepParen.ok && /6y-15=6\+x/.test(stepParen.step || "") && /6x-8=4x-2/.test(stepParen.step || "") && /כפלנו את 3/.test(stepParen.reason || "") && /כפלנו את 2/.test(stepParen.reason || "") ? { ok: true, id: "l2-open-positive" } : fail("l2-open-positive", JSON.stringify(stepParen && { step: stepParen.step, reason: stepParen.reason, msg: stepParen.message })));
  var negCoef = call("one-step", book[1].eq1, book[1].eq2, { history: ["sys:5x+4y=30|7x-6(y-7)=26"] });
  add(negCoef && negCoef.ok && /כפלנו את −6|כפלנו את -6/.test(negCoef.reason || "") && /7x-6\(y-7\)/.test(negCoef.step || "") === false ? { ok: true, id: "l2-neg-coef" } : fail("l2-neg-coef", JSON.stringify(negCoef && { step: negCoef.step, reason: negCoef.reason, msg: negCoef.message })));
  var minusParen = call("one-step", book[5].eq1, book[5].eq2, {});
  add(minusParen && minusParen.ok && /מינוס שלפני הסוגריים|כפלנו את המקדם/.test(minusParen.reason || "") ? { ok: true, id: "l2-minus-paren" } : fail("l2-minus-paren", JSON.stringify(minusParen && { step: minusParen.step, reason: minusParen.reason })));
  var twoGroups = call("one-step", book[3].eq1, book[3].eq2, {});
  add(twoGroups && twoGroups.ok && /7x\+21\+6y-12=50/.test(twoGroups.step || "") && /5x-5y\+3y=23/.test(twoGroups.step || "") && /משוואה 1/.test(twoGroups.reason || "") && /משוואה 2/.test(twoGroups.reason || "") ? { ok: true, id: "l2-two-groups" } : fail("l2-two-groups", JSON.stringify(twoGroups && { step: twoGroups.step, reason: twoGroups.reason })));
  var bothVars = call("one-step", book[5].eq1, "x=1", {});
  add(bothVars && bothVars.ok && /15x-10y/.test(bothVars.step || "") && /3y-6x|6x/.test(bothVars.step || "") ? { ok: true, id: "l2-xy-paren" } : fail("l2-xy-paren", JSON.stringify(bothVars && bothVars.step)));
  var afterOpen = call("one-step", book[3].eq1, book[3].eq2, { history: [twoGroups.step] });
  add(afterOpen && afterOpen.ok && /כינסנו איברים דומים/.test(afterOpen.reason || "") ? { ok: true, id: "l2-combine-after" } : fail("l2-combine-after", JSON.stringify(afterOpen && { step: afterOpen.step, reason: afterOpen.reason, msg: afterOpen.message })));
  var skipped = call("check", ex11.eq1, ex11.eq2, { typed: "sys:-x+6y=21|2x=6" });
  add(skipped && skipped.ok && skipped.phase === "choose_method" && !/חייב|סוגריים/.test(skipped.note || "") ? { ok: true, id: "l2-skip-ready" } : fail("l2-skip-ready", JSON.stringify(skipped && { ok: skipped.ok, phase: skipped.phase, note: skipped.note, msg: skipped.message })));
  var onlyOne = call("check", ex11.eq1, ex11.eq2, { typed: "sys:6y-15=6+x|" + ex11.eq2 });
  add(onlyOne && onlyOne.ok && onlyOne.phase === "normalize" && onlyOne.arrange.eq2 === ex11.eq2 ? { ok: true, id: "l2-one-eq" } : fail("l2-one-eq", JSON.stringify(onlyOne && { ok: onlyOne.ok, phase: onlyOne.phase, msg: onlyOne.message })));
  var bothChanged = call("check", ex11.eq1, ex11.eq2, { typed: "sys:6y-15=6+x|6x-8=4x-2" });
  add(bothChanged && bothChanged.ok ? { ok: true, id: "l2-both-eq" } : fail("l2-both-eq", JSON.stringify(bothChanged && bothChanged.message)));
  var bad1 = call("check", ex11.eq1, ex11.eq2, { typed: "sys:6y-5=6+x|" + ex11.eq2 });
  add(bad1 && bad1.ok === false && /במשוואה 1/.test(bad1.message || "") && /סוגריים/.test(bad1.message || "") ? { ok: true, id: "l2-err-eq1" } : fail("l2-err-eq1", JSON.stringify(bad1 && bad1.message)));
  var bad2 = call("check", ex11.eq1, ex11.eq2, { typed: "sys:6y-15=6+x|6x-4=4x-2" });
  add(bad2 && bad2.ok === false && /במשוואה 2/.test(bad2.message || "") && /סוגריים/.test(bad2.message || "") && !/במשוואה 1/.test(bad2.message || "") ? { ok: true, id: "l2-err-eq2" } : fail("l2-err-eq2", JSON.stringify(bad2 && bad2.message)));
  var kept = call("check", ex11.eq1, ex11.eq2, { history: ["sys:-x+6y=21|" + ex11.eq2], typed: "sys:-x+6y=21|2x=6" });
  add(kept && kept.ok && /משוואה 1 כבר מסודרת/.test(call("hint", ex11.eq1, ex11.eq2, { history: ["sys:-x+6y=21|" + ex11.eq2] }).hint || "") ? { ok: true, id: "l2-hint-other-ready" } : fail("l2-hint-other-ready", JSON.stringify(kept && { ok: kept.ok, msg: kept.message })));
  var subHand = call("choice", ex11.eq1, ex11.eq2, { history: ["sys:-x+6y=21|2x=6"], choice: { kind: "method", method: "sub" } });
  var elimHand = call("choice", ex11.eq1, ex11.eq2, { history: ["sys:-x+6y=21|2x=6"], choice: { kind: "method", method: "elim" } });
  add(subHand && subHand.ok && String(subHand.phase || "").indexOf("pick") === 0 ? { ok: true, id: "l2-handoff-sub" } : fail("l2-handoff-sub", JSON.stringify(subHand && { phase: subHand.phase, msg: subHand.message })));
  add(elimHand && elimHand.ok && (elimHand.phase === "prep" || elimHand.phase === "work_combine") ? { ok: true, id: "l2-handoff-elim" } : fail("l2-handoff-elim", JSON.stringify(elimHand && { phase: elimHand.phase, msg: elimHand.message })));

  var subStill = call("setup", "x+y=11", "x-y=5", {});
  add(subStill && subStill.phase === "choose_method" ? { ok: true, id: "already-standard-chooses" } : fail("already-standard-chooses", subStill && subStill.phase));

  var frac = "x/2-y/5=1";
  var plain = "y-x=4";
  var denStep = call("one-step", frac, plain, {});
  add(denStep && denStep.ok && /5x\/10/.test(denStep.step || "") && /2y\/10/.test(denStep.step || "") && /y-x=4/.test(denStep.step || "") && /×5/.test(denStep.reason || "") && /×2/.test(denStep.reason || "") ? { ok: true, id: "l3-one-den" } : fail("l3-one-den", JSON.stringify(denStep && { step: denStep.step, reason: denStep.reason, msg: denStep.message })));
  var denDrop = call("one-step", frac, plain, { history: [denStep.step] });
  add(denDrop && denDrop.ok && /5x-2y=10|5x -2y = 10/.test(String(denDrop.step || "").replace(/\s+/g, "")) && /y-x=4/.test(denDrop.step || "") ? { ok: true, id: "l3-drop" } : fail("l3-drop", JSON.stringify(denDrop && { step: denDrop.step, reason: denDrop.reason, msg: denDrop.message })));
  var bothFrac = call("one-step", "x/5+y/4=1", "x/3+y/2=1", {});
  add(bothFrac && bothFrac.ok && /\/20/.test(bothFrac.step || "") && /\/6/.test(bothFrac.step || "") && /משוואה 1/.test(bothFrac.reason || "") && /משוואה 2/.test(bothFrac.reason || "") ? { ok: true, id: "l3-both-dens" } : fail("l3-both-dens", JSON.stringify(bothFrac && { step: bothFrac.step, reason: bothFrac.reason, msg: bothFrac.message })));
  var only2 = call("one-step", "4x-3y=18", "x/3+y/5=6", {});
  add(only2 && only2.ok && /4x-3y=18/.test(only2.step || "") && /משוואה 2/.test(only2.reason || "") && !/משוואה 1:/.test(only2.reason || "") ? { ok: true, id: "l3-den-eq2" } : fail("l3-den-eq2", JSON.stringify(only2 && { step: only2.step, reason: only2.reason })));
  var skipClear = call("check", frac, plain, { typed: "sys:5x-2y=10|" + plain });
  add(skipClear && skipClear.ok && skipClear.phase === "choose_method" ? { ok: true, id: "l3-skip" } : fail("l3-skip", JSON.stringify(skipClear && { ok: skipClear.ok, phase: skipClear.phase, note: skipClear.note, msg: skipClear.message })));
  var bigClear = call("check", frac, plain, { typed: "sys:10x-4y=20|" + plain });
  add(bigClear && bigClear.ok && /קטן יותר/.test(bigClear.note || "") && /10/.test(bigClear.note || "") ? { ok: true, id: "l3-big-lcd" } : fail("l3-big-lcd", JSON.stringify(bigClear && { ok: bigClear.ok, note: bigClear.note, msg: bigClear.message })));
  var missRhs = call("check", frac, plain, { typed: "sys:5x-2y=1|" + plain });
  add(missRhs && missRhs.ok === false && /משוואה 1/.test(missRhs.message || "") && /ימין/.test(missRhs.message || "") ? { ok: true, id: "l3-miss-rhs" } : fail("l3-miss-rhs", JSON.stringify(missRhs && missRhs.message)));
  var lostSign = call("check", frac, plain, { typed: "sys:5x+2y=10|" + plain });
  add(lostSign && lostSign.ok === false && /משוואה 1/.test(lostSign.message || "") && /סימן/.test(lostSign.message || "") ? { ok: true, id: "l3-sign" } : fail("l3-sign", JSON.stringify(lostSign && lostSign.message)));
  var badMulEq = call("check", frac, plain, { typed: "sys:5x-y=10|" + plain });
  add(badMulEq && badMulEq.ok === false && /משוואה 1/.test(badMulEq.message || "") && /מכפיל/.test(badMulEq.message || "") ? { ok: true, id: "l3-bad-mul-eq" } : fail("l3-bad-mul-eq", JSON.stringify(badMulEq && badMulEq.message)));
  var badLcd = call("check", frac, plain, { typed: "lcdv:0:7" });
  add(badLcd && badLcd.ok === false && /מכנה משותף|מתחלק/.test(badLcd.message || "") ? { ok: true, id: "l3-bad-lcd" } : fail("l3-bad-lcd", JSON.stringify(badLcd && badLcd.message)));
  var markLcd = call("check", frac, plain, { typed: "lcdv:0:10" });
  add(markLcd && markLcd.ok && markLcd.lcdAssist && markLcd.phase === "muls" && markLcd.terms && markLcd.terms[0].mul === 5 && markLcd.terms[1].mul === 2 ? { ok: true, id: "l3-mark" } : fail("l3-mark", JSON.stringify(markLcd && { ok: markLcd.ok, phase: markLcd.phase, msg: markLcd.message, terms: markLcd.terms })));
  var bigMark = call("check", frac, plain, { typed: "lcdv:0:20" });
  add(bigMark && bigMark.ok && /קטן יותר/.test(bigMark.note || "") && bigMark.terms && bigMark.terms[0].mul === 10 ? { ok: true, id: "l3-big-mark" } : fail("l3-big-mark", JSON.stringify(bigMark && { ok: bigMark.ok, note: bigMark.note, terms: bigMark.terms, msg: bigMark.message })));
  var wrongHat = call("check", frac, plain, { typed: "lcdm:0:10:5,5,10" });
  add(wrongHat && wrongHat.ok === false && /מכפיל|חלקי/.test(wrongHat.message || "") ? { ok: true, id: "l3-wrong-hat" } : fail("l3-wrong-hat", JSON.stringify(wrongHat && wrongHat.message)));
  var rightHat = call("check", frac, plain, { typed: "lcdm:0:10:5,2,10" });
  add(rightHat && rightHat.ok && rightHat.phase === "write" ? { ok: true, id: "l3-right-hat" } : fail("l3-right-hat", JSON.stringify(rightHat && { ok: rightHat.ok, phase: rightHat.phase, msg: rightHat.message })));
  var hintDen = call("hint", frac, plain, {});
  add(hintDen && /מכנים/.test(hintDen.hint || "") && /10/.test(hintDen.hint || "") ? { ok: true, id: "l3-hint" } : fail("l3-hint", JSON.stringify(hintDen)));
  var hintReady = call("hint", frac, plain, { history: ["sys:5x-2y=10|" + plain] });
  add(hintReady && /מוכנות/.test(hintReady.hint || "") ? { ok: true, id: "l3-hint-ready" } : fail("l3-hint-ready", JSON.stringify(hintReady)));
  var isoSetup = call("setup", "x=2y-8", "x/2+y/6=3", {});
  add(isoSetup && isoSetup.arrange && isoSetup.arrange.lcd && isoSetup.arrange.lcd[0] == null && isoSetup.arrange.lcd[1] && isoSetup.arrange.lcd[1].lcd === 6 ? { ok: true, id: "l3-keep-iso" } : fail("l3-keep-iso", JSON.stringify(isoSetup && isoSetup.arrange)));
  var coefNum = call("one-step", "3x/5-2y/3=8/15", "x/2-y=0", {});
  add(coefNum && coefNum.ok && /8\/15/.test(coefNum.step || "") && /משוואה 1/.test(coefNum.reason || "") && /משוואה 2/.test(coefNum.reason || "") ? { ok: true, id: "l3-frac-const" } : fail("l3-frac-const", JSON.stringify(coefNum && { step: coefNum.step, reason: coefNum.reason, msg: coefNum.message })));
  var afterNorm = call("check", "3x+y/3=21+2y", "x/4+5y=11", { typed: "sys:9x+y=63+6y|x+20y=44" });
  add(afterNorm && afterNorm.ok && afterNorm.phase === "normalize" ? { ok: true, id: "l3-then-normalize" } : fail("l3-then-normalize", JSON.stringify(afterNorm && { ok: afterNorm.ok, phase: afterNorm.phase, msg: afterNorm.message, note: afterNorm.note })));
  var handSub = call("choice", frac, plain, { history: ["sys:5x-2y=10|" + plain], choice: { kind: "method", method: "sub" } });
  var handElim = call("choice", frac, plain, { history: ["sys:5x-2y=10|" + plain], choice: { kind: "method", method: "elim" } });
  add(handSub && handSub.ok && String(handSub.phase || "").indexOf("pick") === 0 ? { ok: true, id: "l3-handoff-sub" } : fail("l3-handoff-sub", JSON.stringify(handSub && { phase: handSub.phase, msg: handSub.message })));
  add(handElim && handElim.ok && (handElim.phase === "prep" || handElim.phase === "work_combine") ? { ok: true, id: "l3-handoff-elim" } : fail("l3-handoff-elim", JSON.stringify(handElim && { phase: handElim.phase, msg: handElim.message })));

  console.log("flow-arrange: passed " + passed + ", failed " + failed.length);
  failed.forEach(function (f) { console.log("FAIL " + f.id + " " + (f.detail || "")); });
  if (failed.length) process.exitCode = 1;
}

main();
