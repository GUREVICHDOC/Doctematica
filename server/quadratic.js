"use strict";

function lastEq(body) {
  body = body || {};
  if (Array.isArray(body.history) && body.history.length) {
    return String(body.history[body.history.length - 1] || "");
  }
  if (body.previous) return String(body.previous);
  return String(body.start || "");
}

function snapshotSqrtCheck(result) {
  result = result || {};
  var out = {
    ok: !!result.ok,
    solved: !!result.solved,
    same: !!result.same,
    more: !!result.more,
    isolated: !!result.isolated,
    errorId: result.errorId || null,
    message: String(result.message || ""),
    kind: result.kind || null,
  };
  if (result.progress) {
    out.progress = {
      pos: !!result.progress.pos,
      neg: !!result.progress.neg,
    };
  }
  if (result.step) out.step = String(result.step);
  if (result.hint) out.hint = String(result.hint);
  return out;
}

function progressFromHistory(Q, history, pack) {
  var prog = { pos: false, neg: false };
  var i;
  for (i = 0; i < (history || []).length; i++) {
    var h = String(history[i] || "");
    if (!Q.isRootAnswerText(h)) continue;
    var finH;
    try {
      finH = Q.checkSqrtFinish(h, pack, { pos: prog.pos, neg: prog.neg });
    } catch (err) {
      continue;
    }
    if (finH && finH.ok && finH.progress) {
      prog.pos = !!finH.progress.pos;
      prog.neg = !!finH.progress.neg;
    }
  }
  return prog;
}

function checkSqrtTyped(engine, body, packOverride) {
  var Q = engine.DoctematicaQuadratic;
  var A = engine.DoctematicaAlgebra;
  var start = String((body && body.start) || lastEq(body) || "");
  var history = Array.isArray(body.history) && body.history.length ? body.history.map(String) : [lastEq(body)];
  var previous = lastEq(body);
  var typed = String((body && body.typed) || "").trim();
  var pack = packOverride || Q.analyzeSqrtStart(start);

  if (A.missingEqualsSign(typed)) {
    return snapshotSqrtCheck({ ok: false, message: "חסר סימן שווה", kind: "equals" });
  }

  var both = Q.checkSqrtBothSides(previous, typed);
  if (both) {
    return snapshotSqrtCheck({
      ok: both.ok,
      solved: false,
      message: both.message,
      kind: "both",
    });
  }

  var isolated = false;
  var h;
  for (h = 0; h < history.length; h++) {
    var isoH = Q.isolatedK(history[h]);
    if (isoH && (isoH.kind === "value" || isoH.kind === "unreduced")) isolated = true;
  }
  var rootAns = Q.isRootAnswerText(typed);
  var stillX2 = Q.hasX2(typed);
  var prevRoot = Q.isRootAnswerText(previous) || Q.isNoneText(previous);
  if (prevRoot) {
    isolated = true;
    stillX2 = false;
  }
  if ((!isolated || stillX2) && !rootAns && !prevRoot) {
    var result = A.checkStep(previous, typed, { unknown: "x2" }) || {};
    return snapshotSqrtCheck({
      ok: result.ok,
      solved: false,
      isolated: result.isolated,
      same: result.same,
      errorId: result.errorId,
      message: result.message,
      kind: "step",
    });
  }

  var prog = progressFromHistory(Q, history, pack);
  var fin = Q.checkSqrtFinish(typed, pack, prog) || {};
  return snapshotSqrtCheck({
    ok: fin.ok,
    solved: fin.solved,
    more: fin.more,
    progress: fin.progress,
    message: fin.message,
    kind: "finish",
  });
}

function handleSqrtHint(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var Teach = engine.DoctematicaTeach;
  var start = String((body && body.start) || lastEq(body) || "");
  var cur = lastEq(body);
  var pack = Q.analyzeSqrtStart(start);
  var act = Teach.nextAction(cur, { unknown: "x2" }) || {};
  var extra = (act.isolated || act.done) && Q.nextSqrtStep(cur, pack);
  return {
    ok: true,
    done: !!((extra && extra.solved) || (act.done && !extra)),
    hint: String((extra && extra.hint) || act.hint || ""),
    step: extra && extra.eq ? String(extra.eq) : act.eq ? String(act.eq) : null,
  };
}

function handleSqrtOneStep(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var Teach = engine.DoctematicaTeach;
  var start = String((body && body.start) || lastEq(body) || "");
  var cur = lastEq(body);
  var pack = Q.analyzeSqrtStart(start);
  var act = Teach.nextAction(cur, { unknown: "x2" }) || {};
  var nextEq = act.eq;
  var hint = act.hint;
  if (!nextEq) {
    var fin = Q.nextSqrtStep(cur, pack);
    if (fin && fin.eq) {
      nextEq = fin.eq;
      hint = fin.hint || hint;
    }
  }
  if (!nextEq) {
    return {
      ok: true,
      done: true,
      solved: false,
      hint: String(hint || "התרגיל כבר פתור."),
      step: null,
      message: "",
    };
  }
  var check = checkSqrtTyped(
    engine,
    Object.assign({}, body, { typed: nextEq, previous: cur })
  );
  check.done = false;
  check.step = String(nextEq);
  check.hint = String(hint || check.message || "");
  return check;
}

function handleSqrtSolution(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var start = String((body && body.start) || lastEq(body) || "");
  var pack = Q.analyzeSqrtStart(start);
  return {
    ok: true,
    steps: (pack.steps || []).map(function (eq) {
      return { eq: String(eq || ""), explain: "" };
    }),
    answer: String(pack.answer || ""),
  };
}

function mixedOfferFormula(engine, body, mixed) {
  var Q = engine.DoctematicaQuadratic;
  if (!Q || typeof Q.isAbcOrder !== "function" || typeof Q.parseABC !== "function") return false;
  if (mixed && mixed.enter) return false;
  if (mixed && mixed.chooseFormula) return true;
  var hist = body && Array.isArray(body.history) ? body.history : [];
  var last = hist.length ? String(hist[hist.length - 1] || "") : String((body && body.start) || "");
  if (mixed && mixed.ok && mixed.step) last = String(mixed.step);
  else if (
    mixed &&
    mixed.ok &&
    body &&
    String(body.intent || "") === "check" &&
    body.typed != null &&
    String(body.typed).trim()
  ) {
    last = String(body.typed);
  }
  try {
    if (!Q.isAbcOrder(last)) return false;
    var parsed = Q.parseABC(last);
    return !!(parsed && parsed.a);
  } catch (err) {
    return false;
  }
}

function createQuadraticHandler(engine) {
  var handleFactor = require("./quad-factor").handleFactor;
  var handleFormula = require("./quad-formula").handleFormula;
  var handleMixed = require("./quad-mixed").handleMixed;

  function handle(body) {
    body = body || {};
    var topic = String(body.topic || "quadratic");
    var subtopic = String(body.subtopic || "");
    if (topic !== "quadratic") {
      return { error: "unknown topic", message: "unknown topic" };
    }
    var intent = String(body.intent || "");
    if (subtopic === "sqrt") {
      if (intent === "check") return checkSqrtTyped(engine, body);
      if (intent === "hint") return handleSqrtHint(engine, body);
      if (intent === "one-step") return handleSqrtOneStep(engine, body);
      if (intent === "solution") return handleSqrtSolution(engine, body);
      return { error: "unknown intent", message: "unknown intent" };
    }
    if (subtopic === "factor") return handleFactor(engine, body);
    if (subtopic === "formula") return handleFormula(engine, body);
    if (subtopic === "mixed") {
      var mixed = handleMixed(engine, body);
      if (mixed && typeof mixed === "object") {
        mixed.offerFormula = mixedOfferFormula(engine, body, mixed);
      }
      return mixed;
    }
    return { error: "unknown subtopic", message: "unknown subtopic" };
  }

  return {
    handle: handle,
    checkSqrtTyped: function (body) {
      return checkSqrtTyped(engine, body);
    },
  };
}

module.exports = {
  createQuadraticHandler: createQuadraticHandler,
  checkSqrtTyped: checkSqrtTyped,
  snapshotSqrtCheck: snapshotSqrtCheck,
};
