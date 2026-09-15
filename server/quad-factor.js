"use strict";

function cloneSt(st) {
  st = st || {};
  return {
    split: !!st.split,
    eqs: (st.eqs || []).slice(),
    solved: (st.solved || [false, false]).slice(),
    progress: {
      z: !!(st.progress && st.progress.z),
      o: !!(st.progress && st.progress.o),
    },
  };
}

function emptySt() {
  return cloneSt({ split: false, eqs: [], solved: [false, false], progress: { z: false, o: false } });
}

function applyFactorRes(st, res, prev, Q) {
  if (!res || !res.ok) return st;
  if (res.factored && res.eqs) {
    st.eqs = res.eqs.slice();
    st.solved = (res.solvedFlags || res.solved || st.solved).slice
      ? (res.solvedFlags || res.solved).slice()
      : st.solved.slice();
  }
  if (res.split) {
    st.split = true;
    var p0 = Q.parseProductEq(prev);
    if (p0) st.eqs = [p0.e1, p0.e2];
    else if (res.eqs) st.eqs = res.eqs.slice();
    if (res.solvedFlags) st.solved = res.solvedFlags.slice();
  }
  if (res.eqs) st.eqs = res.eqs.slice();
  if (Array.isArray(res.solvedFlags)) st.solved = res.solvedFlags.slice();
  else if (Array.isArray(res.solved) && typeof res.solved[0] === "boolean") st.solved = res.solved.slice();
  if (res.progress) st.progress = { z: !!res.progress.z, o: !!res.progress.o };
  return st;
}

function lastProduct(Q, pack, history) {
  var i;
  for (i = history.length - 1; i >= 0; i--) {
    var prod = Q.parseProductEq(history[i]);
    if (prod && Q.productMatches(pack, prod)) return { eq: history[i], prod: prod };
  }
  return null;
}

function reconstructFactor(engine, start, history, factorIn) {
  var Q = engine.DoctematicaQuadratic;
  var pack = Q.analyzeFactorStart(start);
  var hist = Array.isArray(history) && history.length ? history.map(String) : [start];
  var st = emptySt();
  var prev = hist[0] || start;
  var i;
  for (i = 1; i < hist.length; i++) {
    var typed = hist[i];
    var res = Q.checkFactorTyped(prev, typed, pack, cloneSt(st));
    if (!res || !res.ok) {
      continue;
    }
    applyFactorRes(st, res, prev, Q);
    if (res.factored || res.rearrange) prev = typed;
  }
  var found = lastProduct(Q, pack, hist);
  var canSplit = !!(found && !st.split);
  if (factorIn && factorIn.split && found) {
    if (!st.split) {
      st.split = true;
      st.eqs = [found.prod.e1, found.prod.e2];
      st.solved = [Q.linearSolved(found.prod.e1), Q.linearSolved(found.prod.e2)];
    }
    prev = found.eq;
  }
  if (st.split && factorIn && Array.isArray(factorIn.trails)) {
    var b;
    for (b = 0; b < factorIn.trails.length; b++) {
      var tr = factorIn.trails[b] || [];
      var t;
      for (t = 0; t < tr.length; t++) {
        var step = String(tr[t] || "");
        if (!step) continue;
        if (st.eqs[b] && step === st.eqs[b] && t === 0) continue;
        var r2 = Q.checkFactorTyped(prev, step, pack, cloneSt(st));
        if (r2 && r2.ok) applyFactorRes(st, r2, prev, Q);
      }
    }
  }
  return { pack: pack, st: st, prev: prev, canSplit: canSplit };
}

function snapshotFactor(res, extra) {
  res = res || {};
  extra = extra || {};
  var out = {
    ok: !!res.ok,
    factored: !!res.factored,
    split: extra.split != null ? !!extra.split : !!res.split,
    rearrange: !!res.rearrange,
    solvedAll: !!res.solvedAll,
    solvedOne: !!res.solvedOne,
    more: !!res.more,
    solved: res.solved === true || !!res.solvedAll,
    which: extra.which != null ? extra.which : res.which == null ? null : res.which,
    message: String(res.message || ""),
    canSplit: extra.canSplit != null ? !!extra.canSplit : !!res.canSplit,
  };
  if (res.eqs) out.eqs = res.eqs.map(String);
  if (res.solvedFlags) out.solvedFlags = res.solvedFlags.map(Boolean);
  else if (Array.isArray(res.solved) && typeof res.solved[0] === "boolean") {
    out.solvedFlags = res.solved.map(Boolean);
  }
  if (res.progress) out.progress = { z: !!res.progress.z, o: !!res.progress.o };
  if (extra.step) out.step = String(extra.step);
  if (extra.hint) out.hint = String(extra.hint);
  if (extra.done) out.done = true;
  return out;
}

function handleFactorCheck(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var start = String(body.start || "");
  var history = body.history || [start];
  var typed = String(body.typed || "").trim();
  var rec = reconstructFactor(engine, start, history, body.factor);
  var res = Q.checkFactorTyped(rec.prev, typed, rec.pack, cloneSt(rec.st));
  var st = cloneSt(rec.st);
  if (res && res.ok) applyFactorRes(st, res, rec.prev, Q);
  var found = lastProduct(Q, rec.pack, history.concat(res && res.factored ? [typed] : []));
  var canSplit = !!(found && !st.split);
  return snapshotFactor(res, { canSplit: canSplit });
}

function handleFactorSplit(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var start = String(body.start || "");
  var history = body.history || [start];
  var rec = reconstructFactor(engine, start, history, { split: false });
  var found = lastProduct(Q, rec.pack, history);
  if (!found) {
    return snapshotFactor({ ok: false, message: "קודם הוציאו גורם משותף, למשל x(x−5)=0." });
  }
  var eqs = [found.prod.e1, found.prod.e2];
  var solvedFlags = [Q.linearSolved(eqs[0]), Q.linearSolved(eqs[1])];
  return snapshotFactor(
    {
      ok: true,
      split: true,
      eqs: eqs,
      solvedFlags: solvedFlags,
      solvedAll: !!(solvedFlags[0] && solvedFlags[1]),
      message:
        solvedFlags[0] && solvedFlags[1]
          ? "שני הפתרונות: x = 0, x = " + rec.pack.otherF + "."
          : "מכפלה שווה אפס רק אם אחד הגורמים אפס. פתרו כל משוואה בנפרד.",
    },
    { canSplit: false }
  );
}

function handleFactorHint(engine, body) {
  var rec = reconstructFactor(engine, String(body.start || ""), body.history || [], body.factor);
  var act = engine.DoctematicaQuadratic.nextFactorStep(rec.prev, rec.pack, rec.st) || {};
  return {
    ok: true,
    hint: String(act.hint || "הוציאו גורם משותף x."),
    step: act.eq ? String(act.eq) : null,
    split: !!act.split,
    done: !!act.solved,
  };
}

function handleFactorOneStep(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var rec = reconstructFactor(engine, String(body.start || ""), body.history || [], body.factor);
  var act = Q.nextFactorStep(rec.prev, rec.pack, rec.st) || {};
  if (act.split) {
    var spl = handleFactorSplit(engine, body);
    spl.hint = String(act.hint || spl.message || "");
    return spl;
  }
  if (!act.eq) {
    return { ok: true, done: true, hint: String(act.hint || "התרגיל כבר פתור."), step: null };
  }
  var check = Q.checkFactorTyped(rec.prev, act.eq, rec.pack, cloneSt(rec.st));
  var out = snapshotFactor(check, { step: act.eq, hint: act.hint, canSplit: false, split: false });
  if (act.which != null) out.which = act.which;
  if (check && check.ok && (check.factored || check.rearrange)) {
    var found = lastProduct(Q, rec.pack, (body.history || []).concat([act.eq]));
    out.canSplit = !!(found && !check.split);
  }
  return out;
}

function handleFactorSolution(engine, body) {
  var pack = engine.DoctematicaQuadratic.analyzeFactorStart(String(body.start || ""));
  return {
    ok: true,
    steps: (pack.steps || []).map(function (eq) {
      return { eq: String(eq || ""), explain: "" };
    }),
    answer: String(pack.answer || ""),
  };
}

function handleFactor(engine, body) {
  var intent = String(body.intent || "");
  if (intent === "check") return handleFactorCheck(engine, body);
  if (intent === "split") return handleFactorSplit(engine, body);
  if (intent === "hint") return handleFactorHint(engine, body);
  if (intent === "one-step") return handleFactorOneStep(engine, body);
  if (intent === "solution") return handleFactorSolution(engine, body);
  return { error: "unknown intent", message: "unknown intent" };
}

module.exports = {
  handleFactor: handleFactor,
  reconstructFactor: reconstructFactor,
  snapshotFactor: snapshotFactor,
};
