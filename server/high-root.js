"use strict";

function lastEq(body) {
  body = body || {};
  if (Array.isArray(body.history) && body.history.length) {
    return String(body.history[body.history.length - 1] || "");
  }
  if (body.previous) return String(body.previous);
  return String(body.start || "");
}

function looseNorm(s) {
  return String(s || "")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
}

function snapshotRoot(res, extra) {
  res = res || {};
  extra = extra || {};
  var out = {
    ok: !!res.ok,
    solved: !!res.solved,
    more: !!res.more,
    isolated: !!res.isolated,
    rearrange: !!res.rearrange,
    same: !!res.same,
    message: String(res.message || ""),
    kind: extra.kind || res.kind || null,
  };
  if (res.progress) {
    out.progress = { pos: !!res.progress.pos, neg: !!res.progress.neg };
  }
  if (extra.step) out.step = String(extra.step);
  if (extra.hint) out.hint = String(extra.hint);
  if (extra.done) out.done = true;
  if (extra.done === false) out.done = false;
  return out;
}

function progressFromHistory(Q, history, pack) {
  var prog = { pos: false, neg: false };
  var i;
  for (i = 0; i < (history || []).length; i++) {
    var h = String(history[i] || "");
    var fin;
    try {
      fin = Q.checkHighRootFinish(h, pack, { pos: prog.pos, neg: prog.neg });
    } catch (err) {
      continue;
    }
    if (fin && fin.ok && fin.progress) {
      prog.pos = !!fin.progress.pos;
      prog.neg = !!fin.progress.neg;
    }
  }
  return prog;
}

function historyIsolated(history, pack) {
  var iso = looseNorm(pack && pack.isolated);
  var i;
  for (i = 0; i < (history || []).length; i++) {
    var h = String(history[i] || "");
    if (iso && looseNorm(h) === iso) return true;
    if (/√\[|∛|∜|√\(/.test(h)) return true;
  }
  return false;
}

function checkHighRoot(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var A = engine.DoctematicaAlgebra;
  var start = String((body && body.start) || lastEq(body) || "");
  var history =
    Array.isArray(body.history) && body.history.length ? body.history.map(String) : [lastEq(body)];
  var previous = lastEq(body);
  var typed = String((body && body.typed) || "").trim();
  var pack = Q.analyzeHighRootStart(start);

  if (A.missingEqualsSign(typed) && !Q.isRootAnswerText(typed) && !/אין/.test(typed)) {
    return snapshotRoot({ ok: false, message: "חסר סימן שווה" }, { kind: "equals" });
  }

  var both = Q.checkHighRootBothSides(previous, typed, pack);
  if (both) {
    return snapshotRoot(
      { ok: both.ok, solved: false, message: both.message },
      { kind: "both" }
    );
  }

  var res = Q.checkHighRootTyped(previous, typed, pack) || {};
  if (!res.ok) {
    if (historyIsolated(history, pack)) {
      var prog = progressFromHistory(Q, history, pack);
      var fin = Q.checkHighRootFinish(typed, pack, prog) || {};
      return snapshotRoot(
        {
          ok: fin.ok,
          solved: !!fin.solved,
          more: !!fin.more,
          progress: fin.progress,
          message: fin.message || res.message,
        },
        { kind: "finish" }
      );
    }
    return snapshotRoot({ ok: false, message: res.message || "כתבו את הצעד הבא." });
  }
  return snapshotRoot(res, {
    kind: res.isolated ? "isolated" : res.rearrange ? "rearrange" : res.solved ? "finish" : "step",
  });
}

function handleHighRootHint(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var start = String((body && body.start) || lastEq(body) || "");
  var cur = lastEq(body);
  var pack = Q.analyzeHighRootStart(start);
  var act = Q.nextHighRootStep(cur, pack) || {};
  return {
    ok: true,
    done: !!act.solved && !act.eq,
    hint: String(act.hint || "בודדו ואז שורש n."),
    step: act.eq ? String(act.eq) : null,
  };
}

function handleHighRootOneStep(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var start = String((body && body.start) || lastEq(body) || "");
  var cur = lastEq(body);
  var pack = Q.analyzeHighRootStart(start);
  var act = Q.nextHighRootStep(cur, pack) || {};
  if (!act.eq) {
    return {
      ok: true,
      done: true,
      solved: false,
      hint: String(act.hint || "התרגיל כבר פתור."),
      step: null,
      message: "",
    };
  }
  var check = checkHighRoot(
    engine,
    Object.assign({}, body, { typed: act.eq, previous: cur })
  );
  check.done = false;
  check.step = String(act.eq);
  check.hint = String(act.hint || check.message || "");
  return check;
}

function handleHighRootSolution(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var start = String((body && body.start) || lastEq(body) || "");
  var pack = Q.analyzeHighRootStart(start);
  return {
    ok: true,
    steps: (pack.steps || []).map(function (eq) {
      return { eq: String(eq || ""), explain: "" };
    }),
    answer: String(pack.answer || ""),
  };
}

function handleHighRoot(engine, body) {
  var intent = String((body && body.intent) || "");
  if (intent === "check") return checkHighRoot(engine, body);
  if (intent === "hint") return handleHighRootHint(engine, body);
  if (intent === "one-step") return handleHighRootOneStep(engine, body);
  if (intent === "solution") return handleHighRootSolution(engine, body);
  return { error: "unknown intent", message: "unknown intent" };
}

module.exports = {
  handleHighRoot: handleHighRoot,
  checkHighRoot: checkHighRoot,
  snapshotRoot: snapshotRoot,
};
