"use strict";

var fs = require("fs");
var path = require("path");
var loadEngine = require("./load-engine").loadEngine;
var createSystemsHandler = require("./systems").createSystemsHandler;

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function near0(n) {
  return Math.abs(n) < 1e-8;
}

function fmtN(_engine, n) {
  if (near0(n)) return "0";
  var d;
  for (d = 1; d <= 24; d++) {
    var num = Math.round(n * d);
    if (Math.abs(n * d - num) < 1e-6) {
      var aa = Math.abs(num);
      var bb = Math.abs(d);
      while (bb) {
        var t = aa % bb;
        aa = bb;
        bb = t;
      }
      var g = aa || 1;
      var nn = num / g;
      var dd = d / g;
      if (dd === 1) return String(nn);
      return nn + "/" + dd;
    }
  }
  return String(Math.round(n * 1000) / 1000);
}

function formatSide(engine, t) {
  var parts = [];
  function pushCoef(coef, letter) {
    if (near0(coef)) return;
    var sign = coef < 0 ? "-" : parts.length ? "+" : "";
    var a = Math.abs(coef);
    var body = letter ? (near0(a - 1) ? letter : fmtN(engine, a) + letter) : fmtN(engine, a);
    parts.push(sign + body);
  }
  pushCoef(t.x, "x");
  pushCoef(t.y, "y");
  if (!near0(t.k) || !parts.length) {
    var sign = t.k < 0 ? "-" : parts.length ? "+" : "";
    if (near0(t.k) && parts.length) {
      return parts.join("");
    }
    parts.push(sign + fmtN(engine, Math.abs(t.k)));
  }
  return parts.join("") || "0";
}

function formatEq(engine, left, right) {
  return formatSide(engine, left) + "=" + formatSide(engine, right);
}

function rowOf(eq) {
  return {
    x: eq.left.x - eq.right.x,
    y: eq.left.y - eq.right.y,
    k: eq.left.k - eq.right.k,
  };
}

function isolateStr(engine, Sys, eqText, v) {
  var eq = Sys.parseEquation(eqText);
  var r = rowOf(eq);
  var a = v === "x" ? r.x : r.y;
  var o = v === "x" ? r.y : r.x;
  if (near0(a)) return null;
  var rhs = v === "x" ? { x: 0, y: -o / a, k: -r.k / a } : { x: -o / a, y: 0, k: -r.k / a };
  return v + "=" + formatSide(engine, rhs);
}

function subSides(isol, eqText, Sys) {
  var eq = Sys.parseEquation(eqText);
  function repl(side) {
    if (isol.v === "x") {
      return {
        x: 0,
        y: side.y + isol.rhs.y * side.x,
        k: side.k + isol.rhs.k * side.x,
      };
    }
    return {
      x: side.x + isol.rhs.x * side.y,
      y: 0,
      k: side.k + isol.rhs.k * side.y,
    };
  }
  return { left: repl(eq.left), right: repl(eq.right) };
}

function valueStr(engine, v, value) {
  return v + "=" + fmtN(engine, value);
}

function curriculumSystems(engine) {
  var levels = engine.DoctematicaCurriculum.levels;
  var i;
  for (i = 0; i < levels.length; i++) {
    if (levels[i].id === "sys-sub-1") return levels[i].exercises;
  }
  return [];
}

function pickChoice(handler, ctx, view) {
  var buttons = view.buttons || [];
  if (!buttons.length) return fail("no-buttons:" + view.phase, JSON.stringify(view));
  var tips = [];
  var i;
  for (i = 0; i < buttons.length; i++) {
    var remote = handler.handle({
      topic: "systems-sub",
      intent: "choice",
      eq1: ctx.eq1,
      eq2: ctx.eq2,
      history: ctx.history,
      choices: ctx.choices,
      confirm: false,
      choice: buttons[i].choice,
    });
    if (remote && remote.applied) return { ok: true, remote: remote };
    if (remote && remote.pendingChoice && !/לא מופיע/.test(String(remote.message || ""))) {
      tips.push(remote);
    }
  }
  if (!tips.length) return fail("no-legal-choice", JSON.stringify(view));
  var confirmed = handler.handle({
    topic: "systems-sub",
    intent: "choice",
    eq1: ctx.eq1,
    eq2: ctx.eq2,
    history: ctx.history,
    choices: ctx.choices,
    confirm: true,
    choice: tips[0].pendingChoice,
  });
  if (confirmed && confirmed.applied) return { ok: true, remote: confirmed };
  return fail("confirm-failed", JSON.stringify(confirmed));
}

function workTyped(engine, handler, ctx, view) {
  var Sys = engine.DoctematicaSystems;
  var rec = handler.reconstruct(ctx.eq1, ctx.eq2, ctx.history, ctx.choices);
  var st = rec.st;
  if (view.needSub) {
    var isol =
      st.phase === "work_back"
        ? { v: st.found.v, rhs: { x: 0, y: 0, k: st.found.value } }
        : st.isol;
    var sides = subSides(isol, st.eq[st.workTarget], Sys);
    return formatEq(engine, sides.left, sides.right);
  }
  if (st.phase === "work_isolate") {
    return isolateStr(engine, Sys, st.eq[st.workFrom], st.wantVar);
  }
  var last = ctx.history[ctx.history.length - 1];
  var iso = Sys.readIsolation(Sys.parseEquation(last));
  if (iso && (Math.abs(iso.rhs.x) > 1e-8 || Math.abs(iso.rhs.y) > 1e-8)) {
    var pair = Sys.solvePair(ctx.eq1, ctx.eq2);
    if (pair.kind === "unique") return valueStr(engine, iso.v === "x" ? "y" : iso.v, pair[iso.v]);
  }
  var num = null;
  try {
    var parsed = Sys.parseEquation(last);
    var ready = Sys.readIsolation(parsed);
    if (ready && near0(ready.rhs.x) && near0(ready.rhs.y)) {
      return null;
    }
    var r = rowOf(parsed);
    if (near0(r.y) && !near0(r.x)) return valueStr(engine, "x", -r.k / r.x);
    if (near0(r.x) && !near0(r.y)) return valueStr(engine, "y", -r.k / r.y);
  } catch (e) {
    num = null;
  }
  return num;
}

function solveExercise(engine, handler, ex) {
  var ctx = { eq1: ex.eq1, eq2: ex.eq2, history: [], choices: [] };
  var view = handler.handle({
    topic: "systems-sub",
    intent: "setup",
    eq1: ex.eq1,
    eq2: ex.eq2,
    history: [],
    choices: [],
  });
  var guard = 0;
  var saw = [];
  while (guard < 60) {
    guard += 1;
    if (!view || view.ok === false) return fail("flow:" + ex.n, JSON.stringify(view));
    saw.push(view.phase + (view.needSub ? ":sub" : ""));
    if (view.solved) {
      return { ok: true, kind: view.kind, saw: saw, known: view.known, n: ex.n };
    }
    if (String(view.phase).indexOf("pick") === 0) {
      var picked = pickChoice(handler, ctx, view);
      if (!picked.ok) return fail("flow-pick:" + ex.n, picked.detail || view.phase);
      view = picked.remote;
      if (!view.applied || !view.choice) return fail("flow-apply:" + ex.n, JSON.stringify(view));
      ctx.choices = ctx.choices.concat([view.choice]);
      if (view.startEq) ctx.history = ctx.history.concat([view.startEq]);
      continue;
    }
    if (view.phase === "final_pair") {
      var pairText = engine.DoctematicaSystems.formatPairs([{ x: view.known.x, y: view.known.y }]);
      view = handler.handle({
        topic: "systems-sub",
        intent: "check",
        eq1: ex.eq1,
        eq2: ex.eq2,
        history: ctx.history,
        choices: ctx.choices,
        typed: pairText,
      });
      if (!view.ok) return fail("flow-pair:" + ex.n, pairText + " → " + (view.message || ""));
      ctx.history = ctx.history.concat([pairText]);
      continue;
    }
    if (String(view.phase).indexOf("work") === 0) {
      var typed = workTyped(engine, handler, ctx, view);
      if (!typed) return fail("flow-typed:" + ex.n, view.phase + " " + ctx.history[ctx.history.length - 1]);
      view = handler.handle({
        topic: "systems-sub",
        intent: "check",
        eq1: ex.eq1,
        eq2: ex.eq2,
        history: ctx.history,
        choices: ctx.choices,
        typed: typed,
      });
      if (!view.ok) return fail("flow-check:" + ex.n, typed + " → " + (view.message || JSON.stringify(view)));
      ctx.history = ctx.history.concat([typed]);
      continue;
    }
    return fail("flow-phase:" + ex.n, view.phase);
  }
  return fail("flow-long:" + ex.n, saw.join(">"));
}

function main() {
  var engine = loadEngine();
  var handler = createSystemsHandler(engine);
  var passed = 0;
  var failed = [];
  function add(item) {
    if (item && item.ok) passed += 1;
    else failed.push(item);
  }

  var exercises = curriculumSystems(engine);
  var results = [];
  exercises.forEach(function (ex) {
    var out = solveExercise(engine, handler, ex);
    results.push(out);
    add(out.ok ? { ok: true, id: "full:" + ex.n } : out);
  });

  var noneOut = solveExercise(engine, handler, { n: "none", eq1: "x+y=1", eq2: "x+y=2" });
  add(noneOut.ok && noneOut.kind === "none" ? { ok: true, id: "full-none-fixture" } : fail("full-none-fixture", JSON.stringify(noneOut)));

  var r1 = results[0];
  add(r1 && r1.ok && r1.kind === "unique" && r1.saw.indexOf("pick_back") === -1 ? { ok: true, id: "ex1-skip-back" } : fail("ex1-skip-back", JSON.stringify(r1)));
  add(r1 && r1.known && r1.known.x === 6 ? { ok: true, id: "ex1-x6-known" } : fail("ex1-x6-known", JSON.stringify(r1 && r1.known)));

  var r3 = results[2];
  add(r3 && r3.ok && r3.saw.indexOf("work_isolate") === -1 ? { ok: true, id: "ex3-expr-isol-skip-work-isolate" } : fail("ex3-expr-isol", JSON.stringify(r3 && r3.saw)));

  var r7 = results[6];
  add(r7 && r7.ok && r7.saw.indexOf("pick_sub") !== -1 ? { ok: true, id: "ex7-two-isolations" } : fail("ex7-two-isolations", JSON.stringify(r7 && r7.saw)));

  var r5 = results[4];
  add(r5 && r5.ok && r5.saw.indexOf("pick_isolate") !== -1 && r5.saw.indexOf("work_isolate") !== -1 ? { ok: true, id: "ex5-need-isolate" } : fail("ex5-need-isolate", JSON.stringify(r5 && r5.saw)));
  add(r5 && r5.saw.indexOf("pick_back") !== -1 && r5.saw.indexOf("work_back") !== -1 ? { ok: true, id: "ex5-back-sub" } : fail("ex5-back-sub", JSON.stringify(r5 && r5.saw)));

  var r15 = results[14];
  add(r15 && r15.ok && r15.kind === "infinite" ? { ok: true, id: "ex15-infinite" } : fail("ex15-infinite", JSON.stringify(r15)));

  var iso = handler.handle({
    topic: "systems-sub",
    intent: "choice",
    eq1: "5x+4y=18",
    eq2: "x+3y=8",
    history: [],
    choices: [],
    confirm: true,
    choice: { kind: "isolate", eqIndex: 1, v: "x" },
  });
  add(iso.phase === "work_isolate" && iso.input === true ? { ok: true, id: "trans-pick-isolate-work-isolate" } : fail("trans-pick-isolate-work-isolate", JSON.stringify(iso)));

  var given = handler.handle({
    topic: "systems-sub",
    intent: "setup",
    eq1: "x+3y=36",
    eq2: "x=6",
    history: [],
    choices: [],
  });
  add(
    given.phase === "pick_sub" && given.known && given.known.x === 6 && given.input === false
      ? { ok: true, id: "numeric-isol-skip-isolate-phase" }
      : fail("numeric-isol-skip-isolate-phase", JSON.stringify(given))
  );

  var src = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
  add(/equationsCheckBusy = false;\s*onResult/.test(src) ? { ok: true, id: "busy-before-callback" } : fail("busy-before-callback", "busy flag"));
  add(!/function handleSystemSubmit[\s\S]{0,400}checkWorkStep/.test(src) ? { ok: true, id: "submit-server" } : fail("submit-server", "local submit"));
  var teachSrc = fs.readFileSync(path.join(__dirname, "systems.js"), "utf8");
  add(/intent === "hint"/.test(teachSrc) ? { ok: true, id: "hint-handler" } : fail("hint-handler", "missing"));
  add(/intent === "one-step"/.test(teachSrc) ? { ok: true, id: "onestep-handler" } : fail("onestep-handler", "missing"));
  add(/performTeach\(engine, body\)/.test(teachSrc) ? { ok: true, id: "solution-uses-onestep" } : fail("solution-uses-onestep", "solution drifted"));

  function unfoldTeach(eq1, eq2, history, choices) {
    history = (history || []).slice();
    choices = (choices || []).slice();
    var eqs = [];
    var guard = 0;
    var last = null;
    while (guard < 48) {
      guard += 1;
      var remote = handler.handle({
        topic: "systems-sub",
        intent: "one-step",
        eq1: eq1,
        eq2: eq2,
        history: history,
        choices: choices,
      });
      if (!remote || remote.ok === false) return { ok: false, detail: (remote && remote.message) || "one-step", eq: remote && remote.eq };
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

  function solutionEqs(eq1, eq2, history, choices) {
    var remote = handler.handle({
      topic: "systems-sub",
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
      remote: remote,
    };
  }

  exercises.forEach(function (ex) {
    var walked = unfoldTeach(ex.eq1, ex.eq2);
    var sol = engine.DoctematicaSystems.solvePair(ex.eq1, ex.eq2);
    var full = solutionEqs(ex.eq1, ex.eq2);
    var same = JSON.stringify(walked.eqs) === JSON.stringify(full.eqs);
    var kindOk = walked.ok && walked.last && walked.last.kind === sol.kind && full.kind === sol.kind;
    var numsOk =
      sol.kind !== "unique" ||
      (walked.last &&
        Math.abs(walked.last.known.x - sol.x) < 1e-6 &&
        Math.abs(walked.last.known.y - sol.y) < 1e-6);
    add(walked.ok && kindOk && numsOk && same ? { ok: true, id: "teach:" + ex.n } : fail("teach:" + ex.n, JSON.stringify({ kindOk: kindOk, numsOk: numsOk, same: same, msg: walked.detail, eq: walked.eq })));
  });

  var bare = unfoldTeach("5x+4y=18", "x+3y=8");
  add(bare.ok && bare.eqs[0] === "x+3y=8" && bare.eqs[1] === "x=8-3y" ? { ok: true, id: "teach-no-isol-prefers-x" } : fail("teach-no-isol-prefers-x", JSON.stringify(bare.eqs && bare.eqs.slice(0, 4))));
  var hint0 = handler.handle({ topic: "systems-sub", intent: "hint", eq1: "5x+4y=18", eq2: "x+3y=8", history: [], choices: [] });
  add(hint0 && hint0.ok && /x/.test(hint0.hint) && /שנייה/.test(hint0.hint) ? { ok: true, id: "hint-convenient-x" } : fail("hint-convenient-x", JSON.stringify(hint0)));
  var again = handler.handle({ topic: "systems-sub", intent: "setup", eq1: "5x+4y=18", eq2: "x+3y=8", history: [], choices: [] });
  add(again.phase === "pick_isolate" ? { ok: true, id: "hint-does-not-move" } : fail("hint-does-not-move", again.phase));

  var givenTeach = unfoldTeach("x+3y=36", "x=6");
  add(givenTeach.ok && givenTeach.eqs.indexOf("x=6") === -1 && givenTeach.last && givenTeach.last.known.y === 10 ? { ok: true, id: "teach-numeric-isol" } : fail("teach-numeric-isol", JSON.stringify(givenTeach.eqs)));

  var exprTeach = unfoldTeach("5x+3y=36", "x=y+4");
  add(exprTeach.ok && exprTeach.eqs[0] === "5x+3y=36" && exprTeach.eqs[1].indexOf("(y+4)") !== -1 ? { ok: true, id: "teach-expr-isol" } : fail("teach-expr-isol", JSON.stringify(exprTeach.eqs && exprTeach.eqs.slice(0, 3))));

  var bothTeach = unfoldTeach("y=x+5", "y=2x+4");
  add(bothTeach.ok && bothTeach.eqs[0] === "y=2x+4" ? { ok: true, id: "teach-two-isolations" } : fail("teach-two-isolations", JSON.stringify(bothTeach.eqs && bothTeach.eqs.slice(0, 3))));

  var noneTeach = unfoldTeach("x+y=1", "x+y=2");
  add(noneTeach.ok && noneTeach.last && noneTeach.last.kind === "none" ? { ok: true, id: "teach-none" } : fail("teach-none", JSON.stringify(noneTeach.last && noneTeach.last.kind)));
  var infTeach = unfoldTeach("x+3y=10", "2x+6y=20");
  add(infTeach.ok && infTeach.last && infTeach.last.kind === "infinite" ? { ok: true, id: "teach-infinite" } : fail("teach-infinite", JSON.stringify(infTeach.last && infTeach.last.kind)));

  var altChoice = handler.handle({
    topic: "systems-sub",
    intent: "choice",
    eq1: "5x+4y=18",
    eq2: "x+3y=8",
    history: [],
    choices: [],
    confirm: true,
    choice: { kind: "isolate", eqIndex: 1, v: "y" },
  });
  var altHist = [altChoice.startEq];
  var altChoices = [altChoice.choice];
  var altHint = handler.handle({
    topic: "systems-sub",
    intent: "hint",
    eq1: "5x+4y=18",
    eq2: "x+3y=8",
    history: altHist,
    choices: altChoices,
  });
  var altStep = handler.handle({
    topic: "systems-sub",
    intent: "one-step",
    eq1: "5x+4y=18",
    eq2: "x+3y=8",
    history: altHist,
    choices: altChoices,
  });
  add(altHint && /y/.test(altHint.hint) && !/לבודד את x/.test(altHint.hint) ? { ok: true, id: "hint-follows-student" } : fail("hint-follows-student", JSON.stringify(altHint)));
  add(altStep && altStep.ok && altStep.step === "3y=8-x" && altStep.phase === "work_isolate" ? { ok: true, id: "onestep-follows-student" } : fail("onestep-follows-student", JSON.stringify(altStep && { step: altStep.step, phase: altStep.phase, msg: altStep.message })));
  var altDone = unfoldTeach("5x+4y=18", "x+3y=8", altHist.concat([altStep.step]), altChoices);
  add(altDone.ok && altDone.last && altDone.last.kind === "unique" && altDone.last.known.x === 2 && altDone.last.known.y === 2 ? { ok: true, id: "onestep-alternate-finishes" } : fail("onestep-alternate-finishes", JSON.stringify(altDone.last && altDone.last.known)));

  console.log("flow-systems: passed " + passed + ", failed " + failed.length);
  failed.slice(0, 25).forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main();
