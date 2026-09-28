"use strict";

var teach = require("./systems-elim-teach");

function cloneKnown(known) {
  known = known || {};
  var out = {};
  if (typeof known.x === "number") out.x = known.x;
  if (typeof known.y === "number") out.y = known.y;
  return out;
}

function otherVar(v) {
  return v === "x" ? "y" : "x";
}

function bothKnown(st) {
  return typeof st.known.x === "number" && typeof st.known.y === "number";
}

function normEq(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
}

function initState(Sys, eq1, eq2) {
  var original = [String(eq1 || ""), String(eq2 || "")];
  var ready = Sys.bestElimOp(original[0], original[1]);
  return {
    original: original,
    eq: original.slice(),
    phase: ready ? "work_combine" : "prep",
    scale: null,
    op: null,
    known: {},
    found: null,
    workTarget: null,
    needSub: false,
    doneKind: null,
  };
}

function bankOf(st) {
  return st.original || st.eq;
}

function factorsOf(scale) {
  if (!scale) return [null, null];
  if (scale.factors) {
    return [
      scale.factors[0] == null || scale.factors[0] === "" ? null : Number(scale.factors[0]),
      scale.factors[1] == null || scale.factors[1] === "" ? null : Number(scale.factors[1]),
    ];
  }
  var out = [null, null];
  if (scale.index === 0 || scale.index === 1) out[Number(scale.index)] = Number(scale.k);
  return out;
}

function parseMulToken(token) {
  var body = String(token).slice(4);
  var bits = body.split("|");
  var factors = [null, null];
  String(bits[0] || "")
    .split(",")
    .forEach(function (part) {
      if (!part) return;
      var head = part.split(":");
      var index = Number(head[0]);
      var k = Number(head[1]);
      if (index === 0 || index === 1) factors[index] = k;
    });
  var single = factors[0] != null && factors[1] == null ? 0 : factors[1] != null && factors[0] == null ? 1 : null;
  return {
    factors: factors,
    index: single == null ? null : single,
    k: single == null ? null : factors[single],
    eq1: bits[1] || "",
    eq2: bits[2] || "",
  };
}

function parseSysToken(token) {
  var bits = String(token).slice(4).split("|");
  return { eq1: bits[0] || "", eq2: bits[1] || "" };
}

function copyOp(op) {
  if (!op) return null;
  return {
    name: op.name,
    order: op.order,
    a: op.a,
    b: op.b,
    c: op.c,
    cancel: op.cancel,
    cost: op.cost,
    coef1: op.coef1,
    coef2: op.coef2,
  };
}

function applyChoice(Sys, st, choice, confirm) {
  choice = choice || {};
  if (choice.kind !== "back") return { ok: false, message: "עכשיו לא בוחרים את הפעולה הזו." };
  if (st.phase !== "pick_back" || !st.found) {
    return { ok: false, message: "עכשיו לא בוחרים משוואה להצבה." };
  }
  var target = Number(choice.target);
  if (target !== 0 && target !== 1) return { ok: false, message: "בחרו משוואה להצבה." };
  var advice = Sys.adviceBack(st.found, bankOf(st), target);
  if (advice.tone === "tip" && !confirm) {
    return { ok: true, applied: false, advice: advice, choice: { kind: "back", target: target } };
  }
  st.workTarget = target;
  st.phase = "work_back";
  st.needSub = true;
  return {
    ok: true,
    applied: true,
    advice: advice,
    startEq: bankOf(st)[target],
    choice: { kind: "back", target: target },
  };
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
  if (st.phase === "prep" || st.phase === "prep_write") {
    if (result.kind === "scale") {
      var saved = { factors: result.factors || [null, null] };
      if (result.index === 0 || result.index === 1) {
        saved.index = result.index;
        saved.k = result.k;
      }
      st.scale = saved;
      st.phase = "prep_write";
      return;
    }
    if (result.kind === "system") {
      st.eq = [result.eq1, result.eq2];
      st.scale = null;
      st.phase = result.ready ? "work_combine" : "prep";
    }
    return;
  }
  if (st.phase === "work_combine") {
    st.op = copyOp(result.op);
    if (result.kind === "value") {
      st.found = { v: result.v, value: result.value };
      st.known[result.v] = result.value;
      st.phase = bothKnown(st) ? "final_pair" : "pick_back";
      if (st.phase === "final_pair") st.doneKind = "unique";
    } else if (result.kind === "written") {
      st.phase = "work_simplify";
    } else {
      st.phase = "work_solve";
    }
    return;
  }
  if (st.phase === "work_simplify") {
    if (result.kind === "value") {
      st.found = { v: result.v, value: result.value };
      st.known[result.v] = result.value;
      st.phase = bothKnown(st) ? "final_pair" : "pick_back";
      if (st.phase === "final_pair") st.doneKind = "unique";
    } else if (result.kind === "reduced") {
      st.phase = "work_solve";
    }
    return;
  }
  if (st.phase === "work_solve") {
    if (result.kind === "value") {
      st.found = { v: result.v, value: result.value };
      st.known[result.v] = result.value;
      st.phase = bothKnown(st) ? "final_pair" : "pick_back";
      if (st.phase === "final_pair") st.doneKind = "unique";
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

function prepPayload(Sys, st) {
  if (st.phase !== "prep" && st.phase !== "prep_write") return null;
  var payload = { eq1: st.eq[0], eq2: st.eq[1], scale: st.scale };
  if (st.phase === "prep") {
    var plan = Sys.bestPrep(st.eq[0], st.eq[1]);
    payload.needsBoth = !!(plan && plan.factors && plan.factors[0] != null && plan.factors[1] != null);
  }
  return payload;
}

function runCheck(Sys, st, prev, typed) {
  if (st.phase === "prep" || st.phase === "prep_write") {
    if (String(typed).indexOf("mul:") === 0) {
      var mul = parseMulToken(typed);
      if (Sys.bestElimOp(st.eq[0], st.eq[1])) {
        return { ok: false, message: "כבר אפשר לחבר או לחסר בלי להכפיל. אין צורך בכפל." };
      }
      var factors = mul.factors || [null, null];
      var active = [];
      var fi;
      for (fi = 0; fi < 2; fi++) {
        if (factors[fi] == null || !isFinite(factors[fi])) continue;
        var chosen = Sys.checkScaleChoice(st.eq[0], st.eq[1], fi, factors[fi]);
        if (!chosen || !chosen.ok) return chosen || { ok: false, message: "הכפל לא מתאים." };
        active.push(fi);
      }
      if (!active.length) return { ok: false, message: "בחרו כופל שלם, שונה מ־1, למשוואה אחת או לשתיהן." };
      var preview = [st.eq[0], st.eq[1]];
      for (fi = 0; fi < 2; fi++) {
        if (factors[fi] == null || !isFinite(factors[fi])) continue;
        preview[fi] = Sys.scaleEquation(preview[fi], factors[fi]);
      }
      if (!Sys.bestElimOp(preview[0], preview[1])) {
        return {
          ok: false,
          message: "הכופלים לא יוצרים מקדמים שווים או נגדיים. אפשר לאשר כפל רק כשמקדם של x או של y נעשה שווה או נגדי בשתי המשוואות.",
        };
      }
      var message;
      if (active.length === 1) {
        var other = active[0] === 0 ? 2 : 1;
        message = "נרשם הכופל. משוואה " + other + " נשארת כמו שהיא. כתבו את משוואה " + (active[0] + 1) + " אחרי הכפל.";
      } else {
        message = "נרשמו הכופלים. כתבו את שתי המשוואות אחרי הכפל.";
      }
      var scaleResult = {
        ok: true,
        kind: "scale",
        factors: factors,
        message: message,
      };
      if (active.length === 1) {
        scaleResult.index = active[0];
        scaleResult.k = factors[active[0]];
      }
      return scaleResult;
    }
    if (String(typed).indexOf("sys:") === 0) {
      var pair = parseSysToken(typed);
      var declared = st.scale;
      return Sys.checkPrepSystem(st.eq[0], st.eq[1], pair.eq1, pair.eq2, declared);
    }
    return { ok: false, message: "בשלב הזה כותבים את שתי המשוואות של המערכת." };
  }
  if (st.phase === "work_combine") return Sys.checkElimStep(st.eq[0], st.eq[1], typed);
  if (st.phase === "work_simplify" || st.phase === "work_solve") {
    var res = Sys.checkWorkStep(prev, typed);
    if ((!res || !res.ok) && st.phase === "work_simplify") {
      var why = Sys.diagnoseElim(st.eq[0], st.eq[1], typed, st.op);
      if (why && why.message && why.id && why.id !== "not_equivalent") return why;
    }
    if (res && res.ok && st.phase === "work_simplify" && res.kind !== "value" && st.op && !Sys.showsVar(typed, st.op.cancel)) {
      return { ok: true, kind: "reduced", message: "כינסתם איברים דומים.", op: st.op };
    }
    return res;
  }
  if (st.needSub && st.found) {
    return Sys.checkSubstituted(
      { v: st.found.v, rhs: { x: 0, y: 0, k: st.found.value } },
      bankOf(st)[st.workTarget],
      typed
    );
  }
  return Sys.checkWorkStep(prev, typed);
}

function reconstruct(Sys, eq1, eq2, history, choices) {
  var st = initState(Sys, eq1, eq2);
  var hist = Array.isArray(history) ? history.map(String) : [];
  var ch = Array.isArray(choices) ? choices : [];
  var i = 0;
  var c = 0;
  while (st.phase !== "done" && (i < hist.length || (st.phase === "pick_back" && c < ch.length))) {
    if (st.phase === "pick_back") {
      if (c >= ch.length) break;
      var applied = applyChoice(Sys, st, ch[c], true);
      c += 1;
      if (!applied.ok || !applied.applied) return { st: st, error: (applied && applied.message) || "בחירה לא חוקית בשיחזור." };
      if (i < hist.length && normEq(hist[i]) === normEq(applied.startEq)) i += 1;
      continue;
    }
    if (i >= hist.length) break;
    var prev = "";
    if (st.phase !== "work_combine" && st.phase !== "prep" && st.phase !== "prep_write" && !(st.phase === "work_back" && st.needSub)) {
      prev = i > 0 ? hist[i - 1] : "";
    }
    var typed = hist[i];
    var res = runCheck(Sys, st, prev, typed);
    if (!res || !res.ok) break;
    applyOutcome(st, res);
    i += 1;
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
  if (st.phase === "prep") return "סמנו כופל ליד משוואה אחת, או ליד שתיהן.";
  if (st.phase === "prep_write" && st.scale) {
    var marked = factorsOf(st.scale);
    var bits = [];
    var mi;
    for (mi = 0; mi < 2; mi++) {
      if (marked[mi] == null) continue;
      bits.push("משוואה " + (mi + 1) + " ב־" + String(marked[mi]).replace("-", "−"));
    }
    if (bits.length === 2) return "כתבו את שתי המשוואות אחרי הכפל: " + bits[0] + ", " + bits[1] + ".";
    var only = marked[0] != null ? 0 : 1;
    var otherN = only === 0 ? 2 : 1;
    var kn = String(marked[only]).replace("-", "−");
    return "משוואה " + otherN + " נשארת כמו שהיא. כתבו את משוואה " + (only + 1) + " אחרי הכפל ב־" + kn + ".";
  }
  if (st.phase === "work_combine") return "חברו או חסרו את המשוואות כדי לבטל משתנה אחד.";
  if (st.phase === "work_simplify") return "כנסו איברים דומים.";
  if (st.phase === "work_solve") {
    var v = st.op && st.op.cancel === "x" ? "y" : "x";
    return "נשארה משוואה בנעלם אחד. בודדו את " + v + ".";
  }
  if (st.phase === "work_back") return "הציבו את הערך שמצאתם, ופתרו עד למשתנה השני.";
  return "";
}

function viewFromState(Sys, st, extra) {
  extra = extra || {};
  var buttons = [];
  var prompt = "";
  var input = false;
  if (st.phase === "pick_back" && st.found) {
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
  } else if (st.phase === "prep" || st.phase === "prep_write") {
    prompt = workPrompt(st);
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
    wantVar: st.found ? otherVar(st.found.v) : null,
    workFrom: null,
    workTarget: st.workTarget,
    prep: prepPayload(Sys, st),
    isolVar: null,
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
  return { eq1: String((body && body.eq1) || ""), eq2: String((body && body.eq2) || "") };
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
  var tried = applyChoice(Sys, rec.st, body.choice, !!body.confirm);
  if (!tried.ok) return { ok: false, message: tried.message, phase: rec.st.phase };
  if (!tried.applied) {
    return viewFromState(Sys, rec.st, {
      advice: tried.advice,
      applied: false,
      pendingChoice: tried.choice,
      message: tried.advice && tried.advice.message,
    });
  }
  return viewFromState(Sys, rec.st, {
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
  if (String(st.phase).indexOf("work") !== 0 && st.phase !== "prep" && st.phase !== "prep_write") {
    return { ok: false, message: "עכשיו בוחרים משוואה להצבה, לא כותבים צעד.", phase: st.phase };
  }
  if (body && body.scale && (st.phase === "prep" || st.phase === "prep_write") && !st.scale) {
    st.scale = body.scale.factors ? { factors: body.scale.factors } : { index: Number(body.scale.index), k: Number(body.scale.k) };
  }
  var typed = String((body && body.typed) || "").trim();
  if (!typed) return { ok: false, message: "כתבו את הצעד הבא." };
  var hist = Array.isArray(body.history) ? body.history.map(String) : [];
  var prev = hist.length ? hist[hist.length - 1] : "";
  var result = runCheck(Sys, st, prev, typed);
  if (!result || !result.ok) {
    return { ok: false, message: (result && result.message) || "", phase: st.phase };
  }
  var keep = result.kind === "value" && st.phase !== "work_back";
  applyOutcome(st, result);
  var view = viewFromState(Sys, st, {
    ok: true,
    message: result.message || "",
    keep: keep,
    resultKind: result.kind || null,
  });
  view.ok = true;
  if (result.kind === "system") view.ready = !!result.ready;
  if (result.note) view.note = result.note;
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
  if (rec.error) return { error: rec.error };
  return { Sys: Sys, Algebra: Algebra, pair: pair, hist: hist, choices: choices, st: rec.st };
}

function handleHint(engine, body) {
  var ctx = teachFrom(engine, body);
  if (ctx.error) return { ok: false, message: ctx.error };
  if (ctx.st.phase === "done") return { ok: true, done: true, hint: "התרגיל כבר פתור.", phase: "done" };
  if (ctx.st.phase === "final_pair") {
    return { ok: true, done: false, hint: "מצאתם את כל הערכים. רשמו את פתרון המערכת כזוג סדור.", phase: "final_pair" };
  }
  var action = teach.nextAction(ctx.Sys, ctx.Algebra, ctx.st, ctx.hist);
  if (!action) return { ok: true, done: true, hint: "התרגיל כבר פתור.", phase: ctx.st.phase };
  if (action.error && !action.eq && !action.token) {
    return { ok: true, done: false, hint: action.hint || action.error, phase: ctx.st.phase };
  }
  if (action.error) return { ok: false, message: action.error };
  return { ok: true, done: false, hint: action.hint || action.reason || "", phase: ctx.st.phase };
}

function performTeach(engine, body) {
  var ctx = teachFrom(engine, body);
  if (ctx.error) return { ok: false, message: ctx.error };
  var Sys = ctx.Sys;
  var st = ctx.st;
  if (st.phase === "done") {
    return viewFromState(Sys, st, { ok: true, done: true, message: "התרגיל כבר פתור." });
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
  if (!action) return viewFromState(Sys, st, { ok: true, done: true, message: "התרגיל כבר פתור." });
  var stepText = action.token || action.eq;
  if (action.error || !stepText) {
    return { ok: false, message: (action && action.error) || "אין צעד המשך.", eq: action && action.eq };
  }
  var choiceOut = null;
  var startOut = null;
  if (action.choice) {
    var applied = applyChoice(Sys, st, action.choice, true);
    if (!applied.ok || !applied.applied) {
      return { ok: false, message: (applied && applied.message) || "לא הצלחתי לבחור את המשוואה." };
    }
    choiceOut = applied.choice;
    startOut = applied.startEq || null;
  }
  var prev = ctx.hist.length ? ctx.hist[ctx.hist.length - 1] : "";
  if (startOut) prev = startOut;
  var result = runCheck(Sys, st, prev, stepText);
  if (!result || !result.ok) {
    return { ok: false, message: (result && result.message) || "הצעד לא עבר את הבדיקה.", eq: stepText };
  }
  var keep = result.kind === "value" && st.phase !== "work_back";
  applyOutcome(st, result);
  var view = viewFromState(Sys, st, {
    ok: true,
    message: action.reason || result.message || "",
    keep: keep,
    resultKind: result.kind || null,
    choice: choiceOut,
    startEq: startOut,
  });
  view.step = stepText;
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
    var remote = performTeach(engine, { eq1: pair.eq1, eq2: pair.eq2, history: hist, choices: choices });
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
  return {
    ok: true,
    kind: (st && st.doneKind) || (last && last.kind) || Sys.solvePair(pair.eq1, pair.eq2).kind,
    answer: answerOf(Sys, st, pair),
    steps: steps,
    solved: !!(st && st.phase === "done"),
    explain: "חיברו או חיסרו את המשוואות כדי לבטל משתנה, פתרו את הנעלם שנשאר, ואז הציבו במשוואה המקורית.",
  };
}

function createElimHandler(engine) {
  function handle(body) {
    body = body || {};
    var topic = String(body.topic || "");
    if (topic !== "systems-elim") return { error: "unknown topic", message: "unknown topic" };
    var intent = String(body.intent || "");
    if (intent === "setup") return handleSetup(engine, body);
    if (intent === "choice") return handleChoice(engine, body);
    if (intent === "check") return handleCheck(engine, body);
    if (intent === "hint") return handleHint(engine, body);
    if (intent === "one-step") return handleOneStep(engine, body);
    if (intent === "solution") return handleSolution(engine, body);
    return { error: "unknown intent", message: "unknown intent" };
  }
  return { handle: handle };
}

module.exports = {
  createElimHandler: createElimHandler,
};
