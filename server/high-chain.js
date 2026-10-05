"use strict";

var handleFormula = require("./quad-formula").handleFormula;

function applyChain(st, res) {
  if (!res) return st;
  if (res.split) st.split = true;
  if (res.eqs) st.eqs = res.eqs.slice();
  if (res.solvedFlags) st.solved = res.solvedFlags.slice();
  if (res.trails) {
    st.trails = res.trails.map(function (t) {
      return (t || []).slice();
    });
  }
  if (res.got) {
    st.got = res.got.map(function (g) {
      return (g || []).slice();
    });
  }
  if (res.pending) st.pending = res.pending.slice();
  return st;
}

function cloneSt(st) {
  return {
    split: !!st.split,
    eqs: (st.eqs || []).slice(),
    solved: (st.solved || []).slice(),
    trails: (st.trails || []).map(function (t) {
      return (t || []).slice();
    }),
    got: (st.got || []).map(function (g) {
      return (g || []).slice();
    }),
    pending: (st.pending || []).slice(),
  };
}

function reconstructHighChain(engine, start, history, factorIn) {
  var Q = engine.DoctematicaQuadratic;
  var pack = Q.analyzeHighChainStart(start);
  var hist = Array.isArray(history) && history.length ? history.map(String) : [start];
  var st = { split: false, eqs: [], solved: [], trails: [], got: [], pending: [] };
  var prev = hist[0] || start;
  var i;
  for (i = 1; i < hist.length; i++) {
    var res = Q.checkHighChainTyped(prev, hist[i], pack, cloneSt(st));
    if (!res || !res.ok) continue;
    if (res.factored || res.rearrange) {
      prev = hist[i];
    }
  }
  if (factorIn && factorIn.split) {
    var splitRes = Q.chainSplit(pack, cloneSt(st), prev);
    if (splitRes && splitRes.ok) applyChain(st, splitRes);
    var trails = factorIn.trails || [];
    var b;
    for (b = 0; b < trails.length && b < (st.eqs || []).length; b++) {
      var tr = trails[b] || [];
      var t;
      for (t = 0; t < tr.length; t++) {
        var step = String(tr[t] || "");
        if (!step || step === st.eqs[b]) continue;
        var r2 = Q.checkHighChainTyped(st.eqs[b], step, pack, cloneSt(st));
        if (r2 && r2.ok) applyChain(st, r2);
      }
    }
    if (Array.isArray(factorIn.pending)) st.pending = factorIn.pending.map(String);
  }
  return { pack: pack, st: st, prev: prev };
}

function publicChain(res) {
  if (!res) return { ok: false, message: "" };
  var out = {
    ok: !!res.ok,
    message: String(res.message || ""),
    factored: !!res.factored,
    rearrange: !!res.rearrange,
    split: !!res.split,
    resplit: !!res.resplit,
    solvedAll: !!res.solvedAll,
    solved: !!res.solvedAll,
    more: !!res.more,
    canSplit: !!res.canSplit,
    offerFormula: !!res.offerFormula,
  };
  if (res.errorId) out.errorId = res.errorId;
  if (res.which != null) out.which = res.which;
  if (res.eqs) out.eqs = res.eqs.map(String);
  if (res.solvedFlags) out.solvedFlags = res.solvedFlags.map(Boolean);
  if (res.trails) {
    out.trails = res.trails.map(function (t) {
      return (t || []).map(String);
    });
  }
  if (res.got) out.got = res.got;
  if (res.pending) out.pending = res.pending.map(String);
  if (res.formulaEq) out.formulaEq = String(res.formulaEq);
  if (res.formulaBranch != null) out.formulaBranch = res.formulaBranch;
  if (res.hint) out.hint = String(res.hint);
  if (res.reason) out.reason = String(res.reason);
  if (res.step) out.step = String(res.step);
  if (res.enter) out.enter = String(res.enter);
  if (res.path) out.path = String(res.path);
  if (res.view) out.view = res.view;
  if (res.answer) out.answer = String(res.answer);
  return out;
}

function formulaEqOf(Q, rec, body) {
  var offer = Q.chainOffer(rec.st);
  var idx = offer.formulaBranch;
  if (body && body.formulaBranch != null) idx = body.formulaBranch;
  else if (body && body.factor && body.factor.formulaBranch != null && body.factor.formulaBranch !== "") {
    idx = body.factor.formulaBranch;
  }
  var eqs = (rec.st && rec.st.eqs) || [];
  if (idx != null && eqs[idx]) return { eq: eqs[idx], branch: idx };
  return { eq: offer.formulaEq || "", branch: offer.formulaBranch };
}

function delegateFormula(engine, body, rec) {
  var Q = engine.DoctematicaQuadratic;
  var loc = formulaEqOf(Q, rec, body);
  var eq = loc.eq;
  if (!eq) return { ok: false, message: "אין ענף ריבועי פתוח לנוסחת השורשים." };
  var formulaBody = Object.assign({}, body, { start: eq, history: [eq] });
  var res = handleFormula(engine, formulaBody);
  if (res && res.solved) {
    var absorbed = Q.chainAbsorbFormula(rec.pack, rec.st, loc.branch, res.answer || "");
    if (absorbed && absorbed.ok) {
      res = Object.assign({}, res, absorbed, {
        path: "formula",
        answer: res.answer,
        view: Object.assign({}, res.view || {}, { answer: res.answer, kind: res.kind }),
      });
    }
  }
  return res;
}

function handleHighChain(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  body = body || {};
  var intent = String(body.intent || "check");
  var start = String(body.start || "");
  var history = Array.isArray(body.history) && body.history.length ? body.history.map(String) : [start];
  var rec;
  try {
    rec = reconstructHighChain(engine, start, history, body.factor);
  } catch (err) {
    return { ok: false, message: String(err && err.message ? err.message : err) };
  }
  if (
    intent === "formula-enter" ||
    intent === "formula-check" ||
    ((intent === "check" || intent === "hint" || intent === "one-step") && body.phase)
  ) {
    if (intent === "formula-enter") {
      var loc = formulaEqOf(Q, rec, body);
      if (!loc.eq || !Q.isStandardZero(loc.eq)) {
        return { ok: false, message: "קודם סדרו את הענף הריבועי ל־ax²+bx+c=0." };
      }
      var parsed = Q.parseABC(loc.eq);
      if (!parsed || !parsed.a) return { ok: false, message: "הענף הזה אינו משוואה ריבועית." };
      var written = Q.analyze(parsed.a, parsed.b, parsed.c, loc.eq);
      return {
        ok: true,
        path: "formula",
        enter: "formula",
        md53: !!body.md53,
        formulaEq: loc.eq,
        formulaBranch: loc.branch,
        view: { a: written.a, b: written.b, c: written.c, D: written.D, s: written.s, kind: written.kind },
        message: body.md53
          ? "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון."
          : "נוסחת שורשים על הענף הריבועי. a, b, c הם המקדמים של ax²+bx+c=0.",
      };
    }
    var delegated = delegateFormula(engine, body, rec);
    return Object.assign({}, delegated, { path: "formula" });
  }
  if (intent === "hint") {
    var act = Q.nextHighChainStep(rec.prev, rec.pack, rec.st);
    var ui = Q.chainOffer(rec.st);
    return publicChain({
      ok: true,
      hint: act.solved ? "כל הפתרונות: " + String(rec.pack.answer || "") + "." : act.hint || "",
      solvedAll: !!act.solved,
      eqs: rec.st.eqs,
      solvedFlags: rec.st.solved,
      trails: rec.st.trails,
      got: rec.st.got,
      pending: rec.st.pending,
      canSplit: Q.chainCanSplit(rec.pack, rec.st, rec.prev),
      offerFormula: !!(ui.offerFormula || act.enter === "formula"),
      formulaEq: act.formulaEq || ui.formulaEq || "",
      formulaBranch: act.which != null ? act.which : ui.formulaBranch,
    });
  }
  if (intent === "one-step") {
    var step = Q.nextHighChainStep(rec.prev, rec.pack, rec.st);
    if (step.split) {
      var spl = Q.chainSplit(rec.pack, rec.st, step.which != null ? rec.st.eqs[step.which] : rec.prev);
      return publicChain(Object.assign({ ok: true }, spl, { hint: step.hint, reason: step.explain || spl.reason }));
    }
    if (step.enter === "formula") {
      return handleHighChain(engine, Object.assign({}, body, { intent: "formula-enter", formulaBranch: step.which }));
    }
    if (!step.eq) {
      return publicChain({
        ok: true,
        hint: step.solved ? "כל הפתרונות: " + String(rec.pack.answer || "") + "." : step.hint || "",
        message: step.solved ? "כל הפתרונות: " + String(rec.pack.answer || "") + "." : step.hint || "",
        solvedAll: !!step.solved,
        eqs: rec.st.eqs,
        solvedFlags: rec.st.solved,
        trails: rec.st.trails,
        got: rec.st.got,
        pending: rec.st.pending,
      });
    }
    var checked = Q.checkHighChainTyped(step.which != null ? rec.st.eqs[step.which] : rec.prev, step.eq, rec.pack, rec.st);
    return publicChain(
      Object.assign({}, checked, {
        step: step.eq,
        hint: step.hint,
        reason: step.explain,
        canSplit: checked.canSplit,
      })
    );
  }
  if (intent === "split") {
    return publicChain(Q.chainSplit(rec.pack, rec.st, rec.prev));
  }
  if (intent === "solution") {
    return {
      ok: true,
      steps: (rec.pack.steps || []).map(function (s) {
        return { eq: String(s.eq || s), explain: String(s.explain || "") };
      }),
      answer: String(rec.pack.answer || ""),
    };
  }
  if (intent === "absorb") {
    return publicChain(Q.chainAbsorbFormula(rec.pack, rec.st, body.formulaBranch, body.typed || body.answer || ""));
  }
  var typed = String(body.typed || "").trim();
  var prev = rec.st.split ? rec.st.eqs[0] || rec.prev : rec.prev;
  var checkedMain = Q.checkHighChainTyped(rec.st.split ? prev : rec.prev, typed, rec.pack, rec.st);
  if (rec.st.split) checkedMain = Q.checkHighChainTyped(rec.st.eqs[0], typed, rec.pack, rec.st);
  return publicChain(checkedMain);
}

module.exports = {
  handleHighChain: handleHighChain,
  reconstructHighChain: reconstructHighChain,
};
