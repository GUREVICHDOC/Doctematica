"use strict";

function lastEq(body) {
  body = body || {};
  if (Array.isArray(body.history) && body.history.length) {
    return String(body.history[body.history.length - 1] || "");
  }
  if (body.previous) return String(body.previous);
  return String(body.start || "");
}

function emptySt() {
  return {
    split: false,
    eqs: [],
    solved: [false, false],
    progress: { z: false, o: false, n: false },
    sqrtProg: { pos: false, neg: false },
  };
}

function cloneSt(st) {
  st = st || emptySt();
  return {
    split: !!st.split,
    eqs: (st.eqs || []).slice(),
    solved: (st.solved || [false, false]).slice(),
    progress: {
      z: !!(st.progress && st.progress.z),
      o: !!(st.progress && st.progress.o),
      n: !!(st.progress && st.progress.n),
    },
    sqrtProg: {
      pos: !!(st.sqrtProg && st.sqrtProg.pos),
      neg: !!(st.sqrtProg && st.sqrtProg.neg),
    },
  };
}

function isZeroEq(eq) {
  return /^x\s*=\s*0$/i.test(String(eq || "").replace(/\s+/g, ""));
}

function e1SolvedOnSplit(Q, e1) {
  return !!(Q.linearSolved(e1) && /x\s*=\s*0/i.test(e1));
}

function applyHighFactorRes(st, res, prev, Q) {
  if (!res || !res.ok) return st;
  if (res.factored && res.eqs) {
    st.eqs = res.eqs.slice();
    if (res.solvedFlags) st.solved = res.solvedFlags.slice();
    else if (Array.isArray(res.solved) && typeof res.solved[0] === "boolean") {
      st.solved = res.solved.slice();
    }
  }
  if (res.split) {
    st.split = true;
    var p0 = Q.parseHighProductEq(prev);
    if (p0) st.eqs = [p0.e1, p0.e2];
    else if (res.eqs) st.eqs = res.eqs.slice();
    if (res.solvedFlags) st.solved = res.solvedFlags.slice();
  }
  if (res.eqs) st.eqs = res.eqs.slice();
  if (Array.isArray(res.solvedFlags)) st.solved = res.solvedFlags.slice();
  else if (Array.isArray(res.solved) && typeof res.solved[0] === "boolean") {
    st.solved = res.solved.slice();
  }
  if (res.progress) {
    st.progress = {
      z: !!res.progress.z,
      o: !!res.progress.o,
      n: !!res.progress.n,
    };
  }
  if (res.sqrtProg) {
    st.sqrtProg = { pos: !!res.sqrtProg.pos, neg: !!res.sqrtProg.neg };
  }
  return st;
}

function lastHighProduct(Q, pack, history) {
  var i;
  for (i = (history || []).length - 1; i >= 0; i--) {
    var prod = Q.parseHighProductEq(history[i]);
    if (prod && Q.highProductMatches(pack, prod)) {
      return { eq: history[i], prod: prod };
    }
  }
  return null;
}

function branchHasResplitProduct(Q, eq) {
  var bp = Q.parseProductEq(eq) || Q.parseHighProductEq(eq);
  return !!(bp && (bp.e2Kind === "linear" || (bp.f1 && bp.f2)));
}

function canSplitHigh(Q, pack, st, last) {
  if (!st.split) {
    var hi = Q.parseHighProductEq(last);
    return !!(hi && Q.highProductMatches(pack, hi));
  }
  var bi;
  for (bi = 0; bi < 2; bi++) {
    if (st.solved && st.solved[bi]) continue;
    if (branchHasResplitProduct(Q, (st.eqs && st.eqs[bi]) || "")) return true;
  }
  return false;
}

function pickResplit(Q, st) {
  var bi;
  for (bi = 0; bi < 2; bi++) {
    if (st.solved && st.solved[bi]) continue;
    var beq = (st.eqs && st.eqs[bi]) || "";
    var bp = Q.parseProductEq(beq) || Q.parseHighProductEq(beq);
    if (bp && (bp.e2Kind === "linear" || (bp.f1 && bp.f2))) {
      return { which: bi, prod: bp };
    }
  }
  return null;
}

function resplitEqs(Q, prod) {
  var zEq = null;
  var otherEq = prod.e2;
  var e1z = isZeroEq(prod.e1) || (Q.linearSolved(prod.e1) && /x\s*=\s*0/i.test(prod.e1));
  var e2z = isZeroEq(prod.e2) || (Q.linearSolved(prod.e2) && /x\s*=\s*0/i.test(prod.e2));
  if (e1z) {
    zEq = prod.e1;
    otherEq = prod.e2;
  } else if (e2z) {
    zEq = prod.e2;
    otherEq = prod.e1;
  } else if (prod.e2Kind === "linear") {
    otherEq = prod.e2;
    var e1raw = String(prod.e1 || "").replace(/\s+/g, "");
    if (/^x=0$/i.test(e1raw) || /^x$/i.test(e1raw.replace(/=0$/, ""))) {
      zEq = prod.e1.indexOf("=") >= 0 ? prod.e1 : "x=0";
    }
  }
  return { zEq: zEq, otherEq: otherEq };
}

function reconstructHighFactor(engine, start, history, factorIn) {
  var Q = engine.DoctematicaQuadratic;
  var pack = Q.analyzeHighFactorStart(start);
  var hist = Array.isArray(history) && history.length ? history.map(String) : [start];
  var st = emptySt();
  var prev = hist[0] || start;
  var i;
  for (i = 1; i < hist.length; i++) {
    var typed = hist[i];
    var res = Q.checkFactorTyped(prev, typed, pack, cloneSt(st));
    if (!res || !res.ok) continue;
    applyHighFactorRes(st, res, prev, Q);
    if (res.factored || res.rearrange) prev = typed;
  }
  var found = lastHighProduct(Q, pack, hist);
  if (factorIn && factorIn.split && found) {
    if (!st.split) {
      st.split = true;
      st.eqs = [found.prod.e1, found.prod.e2];
      st.solved = [e1SolvedOnSplit(Q, found.prod.e1), false];
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
        if (r2 && r2.ok) applyHighFactorRes(st, r2, prev, Q);
      }
    }
  }
  var last = hist[hist.length - 1] || start;
  var canSplit = canSplitHigh(Q, pack, st, last);
  return { pack: pack, st: st, prev: prev, canSplit: canSplit };
}

function snapshotHighFactor(res, extra) {
  res = res || {};
  extra = extra || {};
  var out = {
    ok: !!res.ok,
    factored: !!res.factored,
    split: extra.split != null ? !!extra.split : !!res.split,
    rearrange: !!res.rearrange,
    resplit: extra.resplit != null ? !!extra.resplit : !!res.resplit,
    solvedAll: !!res.solvedAll,
    solvedOne: !!res.solvedOne,
    more: !!res.more,
    solved: res.solved === true || !!res.solvedAll,
    which: extra.which != null ? extra.which : res.which == null ? null : res.which,
    message: String(res.message || extra.message || ""),
    canSplit: extra.canSplit != null ? !!extra.canSplit : !!res.canSplit,
  };
  if (res.eqs) out.eqs = res.eqs.map(String);
  else if (extra.eqs) out.eqs = extra.eqs.map(String);
  if (res.solvedFlags) out.solvedFlags = res.solvedFlags.map(Boolean);
  else if (extra.solvedFlags) out.solvedFlags = extra.solvedFlags.map(Boolean);
  else if (Array.isArray(res.solved) && typeof res.solved[0] === "boolean") {
    out.solvedFlags = res.solved.map(Boolean);
  }
  if (res.progress) {
    out.progress = {
      z: !!res.progress.z,
      o: !!res.progress.o,
      n: !!res.progress.n,
    };
  }
  if (res.sqrtProg) {
    out.sqrtProg = { pos: !!res.sqrtProg.pos, neg: !!res.sqrtProg.neg };
  } else if (extra.sqrtProg) {
    out.sqrtProg = extra.sqrtProg;
  }
  if (res.trailAlso || extra.trailAlso) out.trailAlso = String(res.trailAlso || extra.trailAlso);
  if (extra.step) out.step = String(extra.step);
  if (extra.hint) out.hint = String(extra.hint);
  if (extra.done) out.done = true;
  if (extra.done === false) out.done = false;
  return out;
}

function handleHighFactorCheck(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var start = String(body.start || "");
  var history = body.history || [start];
  var typed = String(body.typed || "").trim();
  var rec = reconstructHighFactor(engine, start, history, body.factor);
  var res = Q.checkFactorTyped(rec.prev, typed, rec.pack, cloneSt(rec.st));
  var st = cloneSt(rec.st);
  if (res && res.ok) applyHighFactorRes(st, res, rec.prev, Q);
  var hist2 = history.concat(res && (res.factored || res.rearrange) ? [typed] : []);
  var found = lastHighProduct(Q, rec.pack, hist2);
  var canSplit = canSplitHigh(Q, rec.pack, st, hist2[hist2.length - 1] || start);
  if (found && !st.split && res && res.factored) canSplit = true;
  return snapshotHighFactor(res, { canSplit: canSplit });
}

function handleHighFactorSplit(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var start = String(body.start || "");
  var history = body.history || [start];
  var rec = reconstructHighFactor(engine, start, history, body.factor);

  if (rec.st.split) {
    var picked = pickResplit(Q, rec.st);
    if (!picked) {
      return snapshotHighFactor({ ok: false, message: "אין מכפלה לפיצול בענף." }, { canSplit: false });
    }
    var parts = resplitEqs(Q, picked.prod);
    var eqs = rec.st.eqs.slice();
    var solved = rec.st.solved.slice();
    eqs[picked.which] = parts.otherEq;
    solved[picked.which] = false;
    return snapshotHighFactor(
      {
        ok: true,
        split: true,
        resplit: true,
        eqs: eqs,
        solvedFlags: solved,
        which: picked.which,
        trailAlso: parts.zEq,
        solvedAll: !!(solved[0] && solved[1]),
        message:
          "חילקנו שוב. שוב קיבלתם x = 0 (כבר מהענף הראשון) ואת המשוואה " +
          parts.otherEq +
          " — בודדו את x עד הסוף.",
      },
      { canSplit: false, resplit: true, split: true }
    );
  }

  var found = lastHighProduct(Q, rec.pack, history);
  if (!found) {
    return snapshotHighFactor({
      ok: false,
      message: "קודם הוציאו גורם משותף, למשל x(x²−9)=0.",
    });
  }
  var firstEqs = [found.prod.e1, found.prod.e2];
  var solvedFlags = [e1SolvedOnSplit(Q, firstEqs[0]), false];
  return snapshotHighFactor(
    {
      ok: true,
      split: true,
      eqs: firstEqs,
      solvedFlags: solvedFlags,
      solvedAll: !!(solvedFlags[0] && solvedFlags[1]),
      message:
        found.prod.e2Kind === "axbx"
          ? "חילקנו. בענף השני אפשר להוציא שוב גורם x ואז לפצל פעם נוספת."
          : "מכפלה שווה אפס רק אם אחד הגורמים אפס. פתרו כל משוואה בנפרד.",
    },
    { canSplit: false, split: true }
  );
}

function handleHighFactorHint(engine, body) {
  var rec = reconstructHighFactor(
    engine,
    String(body.start || ""),
    body.history || [],
    body.factor
  );
  var act = engine.DoctematicaQuadratic.nextFactorStep(rec.prev, rec.pack, rec.st) || {};
  return {
    ok: true,
    hint: String(act.hint || "הוציאו חזקה משותפת של x."),
    step: act.eq ? String(act.eq) : null,
    split: !!act.split,
    resplit: !!act.resplit,
    which: act.which == null ? null : act.which,
    done: !!act.solved && !act.eq,
    canSplit: rec.canSplit,
  };
}

function handleHighFactorOneStep(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var rec = reconstructHighFactor(
    engine,
    String(body.start || ""),
    body.history || [],
    body.factor
  );
  var act = Q.nextFactorStep(rec.prev, rec.pack, rec.st) || {};
  if (act.split) {
    var spl = handleHighFactorSplit(engine, body);
    spl.hint = String(act.hint || spl.message || "");
    spl.done = false;
    if (act.resplit || rec.st.split) spl.resplit = true;
    return spl;
  }
  if (!act.eq) {
    return {
      ok: true,
      done: true,
      hint: String(act.hint || "התרגיל כבר פתור."),
      step: null,
      canSplit: rec.canSplit,
    };
  }
  var check = Q.checkFactorTyped(rec.prev, act.eq, rec.pack, cloneSt(rec.st));
  var st = cloneSt(rec.st);
  if (check && check.ok) applyHighFactorRes(st, check, rec.prev, Q);
  var hist2 = (body.history || []).concat(
    check && (check.factored || check.rearrange) ? [act.eq] : []
  );
  var canSplit = canSplitHigh(Q, rec.pack, st, hist2[hist2.length - 1] || rec.prev);
  var out = snapshotHighFactor(check, {
    step: act.eq,
    hint: act.hint,
    canSplit: canSplit,
    split: false,
    done: false,
  });
  if (act.which != null) out.which = act.which;
  return out;
}

function handleHighFactorSolution(engine, body) {
  var pack = engine.DoctematicaQuadratic.analyzeHighFactorStart(String(body.start || ""));
  return {
    ok: true,
    steps: (pack.steps || []).map(function (eq) {
      return { eq: String(eq || ""), explain: "" };
    }),
    answer: String(pack.answer || ""),
  };
}

function handleHighFactor(engine, body) {
  var intent = String(body.intent || "");
  if (intent === "check") return handleHighFactorCheck(engine, body);
  if (intent === "split") return handleHighFactorSplit(engine, body);
  if (intent === "hint") return handleHighFactorHint(engine, body);
  if (intent === "one-step") return handleHighFactorOneStep(engine, body);
  if (intent === "solution") return handleHighFactorSolution(engine, body);
  return { error: "unknown intent", message: "unknown intent" };
}

module.exports = {
  handleHighFactor: handleHighFactor,
  reconstructHighFactor: reconstructHighFactor,
  snapshotHighFactor: snapshotHighFactor,
};
