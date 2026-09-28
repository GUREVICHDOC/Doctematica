"use strict";

var teach = require("./systems-teach");

function cloneKnown(known) {
  known = known || {};
  var out = {};
  if (typeof known.x === "number") out.x = known.x;
  if (typeof known.y === "number") out.y = known.y;
  return out;
}

function isolNumeric(isol) {
  return isol && Math.abs(isol.rhs.x) < 1e-8 && Math.abs(isol.rhs.y) < 1e-8;
}

function otherVar(v) {
  return v === "x" ? "y" : "x";
}

function bothKnown(st) {
  return typeof st.known.x === "number" && typeof st.known.y === "number";
}

function eqAt(st, i) {
  return st.eq[i];
}

function normEq(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
}

function initState(Sys, eq1, eq2) {
  var isos = Sys.isolationsOf(eq1, eq2);
  var st = {
    eq: [String(eq1 || ""), String(eq2 || "")],
    isolations: isos,
    isol: isos.length === 1 ? isos[0] : null,
    phase: isos.length ? "pick_sub" : "pick_isolate",
    known: {},
    found: null,
    workFrom: null,
    workTarget: null,
    wantVar: null,
    needSub: false,
    doneKind: null,
  };
  if (st.isol && isolNumeric(st.isol)) {
    st.known[st.isol.v] = st.isol.rhs.k;
  }
  return st;
}

function startEqForChoice(st, choice) {
  if (choice.kind === "isolate") return eqAt(st, choice.eqIndex);
  if (choice.kind === "sub" || choice.kind === "back") return eqAt(st, choice.target);
  return "";
}

function applyChoice(Sys, st, choice, confirm) {
  choice = choice || {};
  var kind = String(choice.kind || "");
  if (kind === "isolate") {
    if (st.phase !== "pick_isolate") {
      return { ok: false, message: "עכשיו לא בוחרים בידוד." };
    }
    var eqIndex = Number(choice.eqIndex);
    var v = choice.v === "y" ? "y" : choice.v === "x" ? "x" : "";
    if (eqIndex !== 0 && eqIndex !== 1) {
      return { ok: false, message: "בחרו משוואה 1 או 2." };
    }
    if (!v) return { ok: false, message: "בחרו משתנה x או y." };
    var adviceI = Sys.adviceIsolate(st.eq[0], st.eq[1], eqIndex, v);
    if (adviceI.tone === "tip" && !confirm) {
      return { ok: true, applied: false, advice: adviceI, choice: { kind: "isolate", eqIndex: eqIndex, v: v } };
    }
    st.workFrom = eqIndex;
    st.wantVar = v;
    st.phase = "work_isolate";
    st.needSub = false;
    return {
      ok: true,
      applied: true,
      advice: adviceI,
      startEq: st.eq[eqIndex],
      choice: { kind: "isolate", eqIndex: eqIndex, v: v },
    };
  }
  if (kind === "sub") {
    if (st.phase !== "pick_sub") {
      return { ok: false, message: "עכשיו לא בוחרים הצבה." };
    }
    var target = Number(choice.target);
    if (target !== 0 && target !== 1) {
      return { ok: false, message: "בחרו משוואה להצבה." };
    }
    var isol = st.isol;
    if (!isol) {
      var from = Number(choice.from);
      var j;
      for (j = 0; j < st.isolations.length; j++) {
        if (st.isolations[j].from === from) isol = st.isolations[j];
      }
    }
    if (!isol) return { ok: false, message: "אין ביטוי מבודד להצבה." };
    if (isol.from === target) {
      return { ok: false, message: "מציבים במשוואה האחרת, לא באותה משוואה." };
    }
    var adviceS = Sys.adviceSubstitute(isol, st.eq, target);
    if (adviceS.tone === "tip" && !confirm) {
      return {
        ok: true,
        applied: false,
        advice: adviceS,
        choice: { kind: "sub", from: isol.from, target: target },
      };
    }
    st.isol = isol;
    if (isolNumeric(isol)) st.known[isol.v] = isol.rhs.k;
    st.workTarget = target;
    st.phase = "work_sub";
    st.needSub = true;
    return {
      ok: true,
      applied: true,
      advice: adviceS,
      startEq: st.eq[target],
      choice: { kind: "sub", from: isol.from, target: target },
    };
  }
  if (kind === "back") {
    if (st.phase !== "pick_back" || !st.found) {
      return { ok: false, message: "עכשיו לא בוחרים הצבה חזרה." };
    }
    var backT = Number(choice.target);
    if (backT !== 0 && backT !== 1) {
      return { ok: false, message: "בחרו משוואה להצבה." };
    }
    var adviceB = Sys.adviceBack(st.found, st.eq, backT);
    if (adviceB.tone === "tip" && !confirm) {
      return {
        ok: true,
        applied: false,
        advice: adviceB,
        choice: { kind: "back", target: backT },
      };
    }
    st.workTarget = backT;
    st.phase = "work_back";
    st.needSub = true;
    return {
      ok: true,
      applied: true,
      advice: adviceB,
      startEq: st.eq[backT],
      choice: { kind: "back", target: backT },
    };
  }
  return { ok: false, message: "בחירה לא מוכרת." };
}

function applyOutcome(st, result) {
  if (!result || !result.ok) return;
  if (result.kind === "none") {
    st.phase = "done";
    st.doneKind = "none";
    st.needSub = false;
    return;
  }
  if (result.kind === "infinite") {
    st.phase = "done";
    st.doneKind = "infinite";
    st.needSub = false;
    return;
  }
  if (st.phase === "work_isolate") {
    if (result.kind === "isolated" || result.kind === "value") {
      var iso =
        result.kind === "isolated"
          ? result.isolation
          : { v: result.v, rhs: { x: 0, y: 0, k: result.value } };
      iso.from = st.workFrom;
      st.isol = iso;
      if (isolNumeric(iso)) st.known[iso.v] = iso.rhs.k;
      st.phase = "pick_sub";
      st.needSub = false;
    }
    return;
  }
  if (st.phase === "work_sub") {
    st.needSub = false;
    if (result.kind === "value") {
      st.found = { v: result.v, value: result.value };
      st.known[result.v] = result.value;
      if (bothKnown(st)) {
        st.phase = "final_pair";
        st.doneKind = "unique";
      } else {
        st.phase = "pick_back";
      }
    }
    return;
  }
  if (st.phase === "work_back") {
    st.needSub = false;
    if (result.kind === "value") {
      st.known[result.v] = result.value;
      if (bothKnown(st)) {
        st.phase = "final_pair";
        st.doneKind = "unique";
      }
    }
  }
}

function runCheck(Sys, st, prevText, typed) {
  if (st.needSub) {
    var isol =
      st.phase === "work_back"
        ? { v: st.found.v, rhs: { x: 0, y: 0, k: st.found.value } }
        : st.isol;
    return Sys.checkSubstituted(isol, st.eq[st.workTarget], typed);
  }
  return Sys.checkWorkStep(prevText, typed);
}

function reconstruct(Sys, eq1, eq2, history, choices) {
  var st = initState(Sys, eq1, eq2);
  var hist = Array.isArray(history) ? history.map(String) : [];
  var ch = Array.isArray(choices) ? choices : [];
  var i = 0;
  var c;
  for (c = 0; c < ch.length; c++) {
    if (st.phase === "done") break;
    var applied = applyChoice(Sys, st, ch[c], true);
    if (!applied.ok || !applied.applied) {
      return { st: st, error: applied.message || "בחירה לא חוקית בשיחזור." };
    }
    var startEq = applied.startEq;
    if (i < hist.length && normEq(hist[i]) === normEq(startEq)) i += 1;
    var prev = startEq;
    while (i < hist.length && String(st.phase).indexOf("work") === 0) {
      var typed = hist[i];
      var res = runCheck(Sys, st, prev, typed);
      if (!res || !res.ok) break;
      applyOutcome(st, res);
      prev = typed;
      i += 1;
    }
  }
  if (st.phase === "final_pair" && i < hist.length) {
    var pairChk = Sys.checkOrderedPairs(hist[i], [{ x: st.known.x, y: st.known.y }]);
    if (pairChk.ok) {
      st.phase = "done";
      i += 1;
    }
  }
  return { st: st, histUsed: i };
}

function workPrompt(st) {
  if (st.phase === "work_isolate") {
    return (
      "בודדו את " +
      (st.wantVar || "המשתנה") +
      " במשוואה " +
      (st.workFrom + 1) +
      " עד שהוא לבד באגף (מקדם 1)."
    );
  }
  if (st.phase === "work_sub") {
    return "הציבו, ואז פתרו את המשוואה עד שמתקבל משתנה = מספר.";
  }
  if (st.phase === "work_back") {
    return "הציבו את הערך שמצאתם, ופתרו עד למשתנה השני.";
  }
  return "";
}

function viewFromState(Sys, st, extra) {
  extra = extra || {};
  var buttons = [];
  var prompt = "";
  var input = false;
  if (st.phase === "pick_isolate") {
    prompt = "אין משתנה מבודד עדיין. בחרו באיזו משוואה לבודד, ואיזה משתנה.";
    buttons = [
      { label: "משוואה 1 · x", choice: { kind: "isolate", eqIndex: 0, v: "x" } },
      { label: "משוואה 1 · y", choice: { kind: "isolate", eqIndex: 0, v: "y" } },
      { label: "משוואה 2 · x", choice: { kind: "isolate", eqIndex: 1, v: "x" } },
      { label: "משוואה 2 · y", choice: { kind: "isolate", eqIndex: 1, v: "y" } },
    ];
  } else if (st.phase === "pick_sub") {
    if (!st.isol && st.isolations.length > 1) {
      prompt = "יש משתנה מבודד ביותר ממשוואה אחת. בחרו מה להציב ובאיזו משוואה.";
      st.isolations.forEach(function (iso) {
        var into = iso.from === 0 ? 1 : 0;
        buttons.push({
          label: "הציבו משוואה " + (iso.from + 1) + " במשוואה " + (into + 1),
          choice: { kind: "sub", from: iso.from, target: into },
        });
      });
    } else if (st.isol) {
      prompt = "יש ביטוי ל־" + st.isol.v + ". בחרו באיזו משוואה להציב את הביטוי.";
      var t;
      for (t = 0; t < 2; t++) {
        if (st.isol.from === t) continue;
        buttons.push({
          label: "משוואה " + (t + 1),
          choice: { kind: "sub", from: st.isol.from, target: t },
        });
      }
    }
  } else if (st.phase === "pick_back" && st.found) {
    prompt =
      st.found.v +
      " = " +
      Sys.fmt(st.found.value) +
      ". בחרו באיזו משוואה להציב כדי למצוא את " +
      otherVar(st.found.v) +
      ".";
    buttons = [
      { label: "משוואה 1", choice: { kind: "back", target: 0 } },
      { label: "משוואה 2", choice: { kind: "back", target: 1 } },
    ];
  } else if (st.phase === "final_pair") {
    prompt = "מצאתם את כל הערכים. רשמו את פתרון המערכת כזוג סדור.";
    input = true;
  } else if (String(st.phase).indexOf("work") === 0) {
    prompt = workPrompt(st);
    input = true;
  }

  var out = {
    ok: extra.ok != null ? !!extra.ok : true,
    phase: st.phase,
    prompt: prompt,
    buttons: buttons,
    input: input,
    needSub: !!st.needSub,
    known: cloneKnown(st.known),
    wantVar: st.wantVar || null,
    workFrom: st.workFrom,
    workTarget: st.workTarget,
    isolVar: st.isol ? st.isol.v : null,
    found: st.found ? { v: st.found.v, value: st.found.value } : null,
    solved: st.phase === "done",
    kind: st.doneKind || null,
    message: extra.message != null ? String(extra.message) : "",
    applied: extra.applied != null ? !!extra.applied : undefined,
    pendingChoice: extra.pendingChoice || null,
    startEq: extra.startEq || null,
    keep: !!extra.keep,
  };
  if (extra.advice) out.advice = { tone: extra.advice.tone, message: extra.advice.message };
  if (extra.choice) out.choice = extra.choice;
  if (extra.resultKind) out.resultKind = extra.resultKind;
  if (st.phase === "done" && st.doneKind === "unique") {
    out.answer = Sys.formatPairs([{ x: st.known.x, y: st.known.y }]);
  }
  if (st.phase === "done" && st.doneKind === "none") out.answer = "אין פתרון";
  if (st.phase === "done" && st.doneKind === "infinite") out.answer = "אינסוף פתרונות";
  return out;
}

function pairFromBody(body) {
  var eq1 = String((body && body.eq1) || "");
  var eq2 = String((body && body.eq2) || "");
  return { eq1: eq1, eq2: eq2 };
}

function handleSetup(engine, body) {
  var Sys = engine.DoctematicaSystems;
  var pair = pairFromBody(body);
  var rec = reconstruct(Sys, pair.eq1, pair.eq2, body.history || [], body.choices || []);
  if (rec.error) return { ok: false, message: rec.error };
  return viewFromState(Sys, rec.st);
}

function handleChoice(engine, body) {
  var Sys = engine.DoctematicaSystems;
  var pair = pairFromBody(body);
  var rec = reconstruct(Sys, pair.eq1, pair.eq2, body.history || [], body.choices || []);
  if (rec.error) return { ok: false, message: rec.error };
  var st = rec.st;
  var confirm = !!body.confirm;
  var tried = applyChoice(Sys, st, body.choice, confirm);
  if (!tried.ok) return { ok: false, message: tried.message, phase: st.phase };
  if (!tried.applied) {
    var pending = viewFromState(Sys, rec.st, {
      advice: tried.advice,
      applied: false,
      pendingChoice: tried.choice,
      message: tried.advice && tried.advice.message,
    });
    return pending;
  }
  return viewFromState(Sys, st, {
    advice: tried.advice,
    applied: true,
    startEq: tried.startEq,
    message: tried.advice ? tried.advice.message : "",
    choice: tried.choice,
  });
}

function handleCheck(engine, body) {
  var Sys = engine.DoctematicaSystems;
  var pair = pairFromBody(body);
  var rec = reconstruct(Sys, pair.eq1, pair.eq2, body.history || [], body.choices || []);
  if (rec.error) return { ok: false, message: rec.error };
  var st = rec.st;
  if (st.phase === "final_pair") {
    var typedPair = String((body && body.typed) || "").trim();
    if (!typedPair) return { ok: false, message: "כתבו את הצעד הבא.", phase: "final_pair" };
    var pairRes = Sys.checkOrderedPairs(typedPair, [{ x: st.known.x, y: st.known.y }]);
    if (!pairRes.ok) return { ok: false, message: pairRes.message, phase: "final_pair" };
    st.phase = "done";
    var pairView = viewFromState(Sys, st, { ok: true, message: pairRes.message || "" });
    pairView.ok = true;
    if (pairRes.note) pairView.note = pairRes.note;
    return pairView;
  }
  if (String(st.phase).indexOf("work") !== 0) {
    return { ok: false, message: "עכשיו בוחרים משוואה או משתנה, לא כותבים צעד.", phase: st.phase };
  }
  var typed = String((body && body.typed) || "").trim();
  if (!typed) return { ok: false, message: "כתבו את הצעד הבא." };
  var hist = Array.isArray(body.history) ? body.history.map(String) : [];
  var prev = hist.length ? hist[hist.length - 1] : "";
  var result = runCheck(Sys, st, prev, typed);
  if (!result.ok) {
    return { ok: false, message: result.message || "", phase: st.phase, kind: result.kind || null };
  }
  var keep =
    (st.phase === "work_isolate" && (result.kind === "isolated" || result.kind === "value")) ||
    ((st.phase === "work_sub" || st.phase === "work_back") && result.kind === "value");
  applyOutcome(st, result);
  var extra = {
    ok: true,
    message: result.message || "",
    keep: keep,
    resultKind: result.kind || null,
  };
  var view = viewFromState(Sys, st, extra);
  view.ok = true;
  return view;
}

function answerOf(Sys, st, pair) {
  if (st && st.phase === "done" && st.doneKind === "unique") {
    return Sys.formatPairs([{ x: st.known.x, y: st.known.y }]);
  }
  if (st && st.phase === "done" && st.doneKind === "none") return "אין פתרון";
  if (st && st.phase === "done" && st.doneKind === "infinite") return "אינסוף פתרונות";
  var sol = Sys.solvePair(pair.eq1, pair.eq2);
  if (sol.kind === "unique") return "x = " + Sys.fmt(sol.x) + ", y = " + Sys.fmt(sol.y);
  if (sol.kind === "none") return "אין פתרון";
  return "אינסוף פתרונות";
}

function teachFrom(engine, body) {
  var Sys = engine.DoctematicaSystems;
  var Algebra = engine.DoctematicaAlgebra;
  var pair = pairFromBody(body);
  var hist = Array.isArray(body.history) ? body.history.map(String) : [];
  var choices = Array.isArray(body.choices) ? body.choices : [];
  var rec = reconstruct(Sys, pair.eq1, pair.eq2, hist, choices);
  if (rec.error) return { error: rec.error, pair: pair, hist: hist, choices: choices };
  return { Sys: Sys, Algebra: Algebra, pair: pair, hist: hist, choices: choices, st: rec.st };
}

function handleHint(engine, body) {
  var ctx = teachFrom(engine, body);
  if (ctx.error) return { ok: false, message: ctx.error };
  if (ctx.st.phase === "done") {
    return { ok: true, done: true, hint: "התרגיל כבר פתור.", phase: "done" };
  }
  if (ctx.st.phase === "final_pair") {
    return { ok: true, done: false, hint: "מצאתם את כל הערכים. רשמו את פתרון המערכת כזוג סדור.", phase: "final_pair" };
  }
  var action = teach.nextAction(ctx.Sys, ctx.Algebra, ctx.st, ctx.hist);
  if (!action) return { ok: true, done: true, hint: "התרגיל כבר פתור.", phase: ctx.st.phase };
  if (action.error) return { ok: false, message: action.error };
  return { ok: true, done: false, hint: action.hint || action.reason || "", phase: ctx.st.phase };
}

function performTeach(engine, body) {
  var ctx = teachFrom(engine, body);
  if (ctx.error) return { ok: false, message: ctx.error };
  var Sys = ctx.Sys;
  var st = ctx.st;
  if (st.phase === "done") {
    return viewFromState(Sys, st, {
      ok: true,
      done: true,
      message: "התרגיל כבר פתור.",
    });
  }
  if (st.phase === "final_pair") {
    var pairText = Sys.formatPairs([{ x: st.known.x, y: st.known.y }]);
    st.phase = "done";
    var finished = viewFromState(Sys, st, { ok: true, message: "רשמו את פתרון המערכת כזוג סדור." });
    finished.step = pairText;
    finished.reason = "מצאתם את x ואת y. פתרון המערכת הוא זוג סדור.";
    finished.hint = "רשמו את הפתרון כזוג סדור: קודם x, אחר כך y.";
    finished.done = false;
    finished.solved = true;
    return finished;
  }
  var action = teach.nextAction(Sys, ctx.Algebra, st, ctx.hist);
  if (!action) {
    return viewFromState(Sys, st, { ok: true, done: true, message: "התרגיל כבר פתור." });
  }
  if (action.error || !action.eq) {
    return { ok: false, message: (action && action.error) || "אין צעד המשך.", eq: action && action.eq };
  }
  var choiceOut = null;
  var startOut = null;
  if (action.choice) {
    var applied = applyChoice(Sys, st, action.choice, true);
    if (!applied.ok || !applied.applied) {
      return { ok: false, message: (applied && applied.message) || "לא הצלחתי לבחור את המסלול." };
    }
    choiceOut = applied.choice;
    startOut = applied.startEq || null;
  }
  var prev = ctx.hist.length ? ctx.hist[ctx.hist.length - 1] : "";
  if (startOut) prev = startOut;
  var result = runCheck(Sys, st, prev, action.eq);
  if (!result.ok) {
    return { ok: false, message: result.message || "הצעד לא עבר את הבדיקה.", eq: action.eq };
  }
  var keep =
    (st.phase === "work_isolate" && (result.kind === "isolated" || result.kind === "value")) ||
    ((st.phase === "work_sub" || st.phase === "work_back") && result.kind === "value");
  applyOutcome(st, result);
  var view = viewFromState(Sys, st, {
    ok: true,
    message: action.reason || result.message || "",
    keep: keep,
    resultKind: result.kind || null,
    choice: choiceOut,
    startEq: startOut,
  });
  view.step = action.eq;
  view.reason = action.reason || "";
  view.hint = action.hint || action.reason || "";
  view.done = false;
  return view;
}

function handleOneStep(engine, body) {
  return performTeach(engine, body);
}

function handleSolution(engine, body) {
  var Sys = engine.DoctematicaSystems;
  var pair = pairFromBody(body);
  var hist = Array.isArray(body.history) ? body.history.map(String) : [];
  var choices = Array.isArray(body.choices) ? body.choices.slice() : [];
  var steps = [];
  var guard = 0;
  var last = null;
  while (guard < 48) {
    guard += 1;
    var remote = performTeach(engine, {
      eq1: pair.eq1,
      eq2: pair.eq2,
      history: hist,
      choices: choices,
    });
    if (!remote || remote.ok === false) return remote || { ok: false, message: "הפתרון נעצר." };
    if (remote.done && !remote.step) break;
    if (!remote.step) break;
    if (remote.choice) choices = choices.concat([remote.choice]);
    if (remote.startEq) {
      steps.push({ eq: remote.startEq, reason: "" });
      hist = hist.concat([remote.startEq]);
    }
    steps.push({ eq: remote.step, reason: remote.reason || "" });
    hist = hist.concat([remote.step]);
    last = remote;
    if (remote.solved) break;
  }
  var rec = reconstruct(Sys, pair.eq1, pair.eq2, hist, choices);
  var st = rec.st;
  var answer = answerOf(Sys, st, pair);
  return {
    ok: true,
    kind: (st && st.doneKind) || (last && last.kind) || Sys.solvePair(pair.eq1, pair.eq2).kind,
    answer: answer,
    steps: steps,
    solved: !!(st && st.phase === "done"),
    explain: "בודדו משתנה, הציבו במשוואה השנייה, ואז מצאו את המשתנה השני.",
  };
}

function createSystemsHandler(engine) {
  function handle(body) {
    body = body || {};
    var topic = String(body.topic || "systems-sub");
    if (topic !== "systems-sub") {
      return { error: "unknown topic", message: "unknown topic" };
    }
    var intent = String(body.intent || "");
    if (intent === "setup") return handleSetup(engine, body);
    if (intent === "choice") return handleChoice(engine, body);
    if (intent === "check") return handleCheck(engine, body);
    if (intent === "hint") return handleHint(engine, body);
    if (intent === "one-step") return handleOneStep(engine, body);
    if (intent === "solution") return handleSolution(engine, body);
    return { error: "unknown intent", message: "unknown intent" };
  }
  return {
    handle: handle,
    reconstruct: function (eq1, eq2, history, choices) {
      return reconstruct(engine.DoctematicaSystems, eq1, eq2, history, choices);
    },
  };
}

module.exports = {
  createSystemsHandler: createSystemsHandler,
  reconstruct: reconstruct,
  initState: initState,
};
