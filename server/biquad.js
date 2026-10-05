"use strict";

var handleFormula = require("./quad-formula").handleFormula;

function letterToX(eq, letter) {
  var L = letter && letter !== "x" ? letter : "t";
  return String(eq || "").replace(new RegExp(L + "\\^", "g"), "x^").replace(new RegExp(L, "g"), "x");
}

function publicBi(extra) {
  extra = extra || {};
  var out = {
    ok: extra.ok !== false,
    message: extra.message || "",
    solved: !!extra.solved,
    more: !!extra.more,
  };
  if (extra.errorId) out.errorId = extra.errorId;
  if (extra.step) out.step = extra.step;
  if (extra.branch != null) out.branch = extra.branch;
  if (extra.hint) out.hint = extra.hint;
  if (extra.reason) out.reason = extra.reason;
  if (extra.enter) out.enter = extra.enter;
  if (extra.path) out.path = extra.path;
  if (extra.view) out.view = extra.view;
  if (extra.split) {
    out.split = true;
    out.eqs = extra.eqs || [];
    out.solvedFlags = extra.solvedFlags || [];
    out.trails = extra.trails || [];
    out.heads = extra.heads || [];
  }
  if (extra.offerFormula) {
    out.offerFormula = true;
    out.formulaEq = extra.formulaEq || "";
  }
  if (extra.sub) out.sub = extra.sub;
  return out;
}

function stateView(st, extra) {
  var out = Object.assign({}, extra || {});
  if (st && st.split) {
    out.split = true;
    out.eqs = st.eqs;
    out.solvedFlags = st.solved;
    out.trails = st.trails;
    out.heads = st.heads;
  }
  if (st && st.tEq && !st.split && st.tGot && st.tGot.length === 0) {
    out.offerFormula = true;
    out.formulaEq = st.tEq;
  }
  return out;
}

function formulaStart(engine, pack, st) {
  var eq = (st && st.tEq) || pack.tEq;
  var letter = (st && st.sub && st.sub.letter) || "t";
  return letterToX(eq, letter);
}

function handleBiquad(engine, body) {
  body = body || {};
  var B = engine.DoctematicaBiquad;
  var Q = engine.DoctematicaQuadratic;
  var start = String(body.start || "");
  var intent = String(body.intent || "check");
  var pack;
  try {
    pack = B.analyzeBiquadStart(start);
  } catch (err) {
    return { ok: false, message: String(err && err.message ? err.message : err) };
  }
  var st = B.reconstructBiquad(pack, body.history || [], body.factor || null);
  if (body.branch != null && body.branch !== "") st.preferBranch = Number(body.branch);
  var inFormula =
    !st.split &&
    (intent === "formula-enter" ||
      ((intent === "check" || intent === "hint" || intent === "one-step") && body.phase));
  if (inFormula) {
    var xStart = formulaStart(engine, pack, st);
    if (intent === "formula-enter") {
      var written;
      try {
        written = Q.analyzeStart(xStart);
      } catch (err2) {
        return { ok: false, message: "קודם כתבו את המשוואה הריבועית ב־t." };
      }
      return {
        ok: true,
        path: "formula",
        enter: "formula",
        md53: !!body.md53,
        formulaEq: st.tEq || pack.tEq,
        view: { a: written.a, b: written.b, c: written.c, D: written.D, s: written.s, kind: written.kind },
        message: body.md53
          ? "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון של t."
          : "נוסחת שורשים עבור t. a, b ו־c הם המקדמים של המשוואה ב־t.",
      };
    }
    var delegated = handleFormula(engine, Object.assign({}, body, { start: xStart }));
    if (delegated && delegated.solved) delegated.keepOpen = true;
    return Object.assign({}, delegated, { path: "formula" });
  }
  if (intent === "hint") {
    return publicBi({
      ok: true,
      hint: B.biquadHint(st.prev, pack, st, Number(body.hintLevel) || 0),
      offerFormula: !!(st.tEq && !st.split && pack.quad.kind !== "none"),
      formulaEq: st.tEq || "",
    });
  }
  if (intent === "one-step") {
    var step = B.nextBiquadStep(st.prev, pack, st);
    if (step.enter === "formula") {
      return handleBiquad(engine, Object.assign({}, body, { intent: "formula-enter" }));
    }
    if (step.solved && !st.split) {
      var done = B.checkBiquadTyped(st.prev, step.eq, pack, st);
      return publicBi(Object.assign({}, done, { step: step.eq, reason: step.explain || "" }));
    }
    var prevLine = st.prev;
    if (st.split && step.branch != null && st.trails[step.branch]) {
      prevLine = st.trails[step.branch][st.trails[step.branch].length - 1];
    }
    var checked = B.checkBiquadTyped(prevLine, step.eq, pack, st);
    return publicBi(
      Object.assign({}, checked, {
        step: step.eq,
        hint: step.hint || "",
        reason: step.explain || "",
        offerFormula: !!((checked.tEq || st.tEq) && !checked.split && !checked.solved && pack.quad.kind !== "none"),
        formulaEq: checked.formulaEq || checked.tEq || st.tEq || pack.tEq,
      })
    );
  }
  if (intent === "solution") {
    return {
      ok: true,
      steps: (pack.steps || []).map(function (s) {
        return { eq: String(s.eq || ""), explain: String(s.explain || "") };
      }),
      answer: String(pack.answer || ""),
    };
  }
  if (intent === "absorb") {
    var rawAns = String(body.typed || body.answer || "");
    var absorbed = B.checkBiquadTyped(st.prev, rawAns, pack, st);
    var usedAns = rawAns;
    if (!absorbed || !absorbed.ok) {
      usedAns = rawAns.replace(/x/g, (st.sub && st.sub.letter) || "t");
      absorbed = B.checkBiquadTyped(st.prev, usedAns, pack, st);
    }
    if (absorbed && absorbed.ok) absorbed.step = usedAns;
    return publicBi(absorbed || { ok: false, message: "לא הצלחתי לקרוא את ערכי t." });
  }
  var typed = String(body.typed || "").trim();
  var prev = st.split ? st.prev : st.prev;
  var result = B.checkBiquadTyped(prev, typed, pack, st);
  if (result && result.ok && !result.split && !st.split && pack.quad.kind !== "none") {
    var nextSt = {
      sub: result.sub || st.sub,
      tEq: result.tEq || st.tEq,
      split: false,
    };
    if (nextSt.tEq) {
      result.offerFormula = true;
      result.formulaEq = nextSt.tEq;
    }
  }
  return publicBi(result);
}

function nearSolved(res) {
  return !!(res && res.solved);
}

function createBiquadHandler(engine) {
  return {
    handle: function (body) {
      return handleBiquad(engine, body);
    },
  };
}

module.exports = {
  createBiquadHandler: createBiquadHandler,
  handleBiquad: handleBiquad,
};
