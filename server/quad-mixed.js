"use strict";

var createEquationsHandler = require("./equations").createEquationsHandler;
var handleFactor = require("./quad-factor").handleFactor;
var handleFormula = require("./quad-formula").handleFormula;

function checkSqrtTyped(engine, body, pack) {
  return require("./quadratic").checkSqrtTyped(engine, body, pack);
}

function lastEq(body) {
  if (Array.isArray(body.history) && body.history.length) {
    return String(body.history[body.history.length - 1] || "");
  }
  return String(body.start || "");
}

function formulaView(pack) {
  var q = pack && pack.quad;
  if (!q) return null;
  return { a: q.a, b: q.b, c: q.c, D: q.D, s: q.s, kind: q.kind };
}

function factorCheckEnter(engine, pack, typed, extra) {
  extra = extra || {};
  var f2 = handleFactor(engine, {
    intent: "check",
    start: (pack.factor && pack.factor.start) || pack.standard,
    history: [(pack.factor && pack.factor.start) || pack.standard],
    typed: String(typed || ""),
  });
  f2.path = "factor";
  f2.enter = "factor";
  if (extra.step) f2.step = String(extra.step);
  if (extra.hint) f2.hint = String(extra.hint);
  f2.done = false;
  if (!f2.message) f2.message = String(extra.hint || "");
  return f2;
}

function mixedEnter(path, nAct, pack) {
  var out = {
    ok: true,
    path: path,
    enter: path,
    hint: String((nAct && nAct.hint) || ""),
    step: null,
    message: String((nAct && (nAct.hint || nAct.explain)) || ""),
  };
  if (path === "formula") {
    var view = formulaView(pack);
    if (view) out.view = view;
  }
  return out;
}

function walkPath(Q, pack, history) {
  var prev = String(history[0] || pack.start || "");
  var path = null;
  var splitAt = 0;
  var i;
  for (i = 1; i < history.length; i++) {
    var typed = history[i];
    var res = Q.checkMixedTyped(prev, typed, pack);
    if (res && res.ok) {
      if (res.path === "factor" || res.enter === "factor") path = "factor";
      else if (res.enter === "sqrt") path = "sqrt";
      else if (res.enter === "linear") path = "linear";
      if (path) {
        splitAt = i;
        return { path: path, splitAt: splitAt, prev: prev, lastMixed: prev };
      }
      prev = typed;
    }
  }
  return { path: null, splitAt: history.length, prev: prev, lastMixed: prev };
}

function suffixHistory(history, splitAt) {
  return history.slice(splitAt);
}

function handleMixed(engine, body) {
  var Q = engine.DoctematicaQuadratic;
  var Algebra = engine.DoctematicaAlgebra;
  var Teach = engine.DoctematicaTeach;
  var eq = createEquationsHandler(engine);
  var intent = String(body.intent || "");
  var start = String(body.start || "");
  var history = Array.isArray(body.history) && body.history.length ? body.history.map(String) : [start];

  if (
    intent === "setup" ||
    intent.indexOf("domain-") === 0 ||
    intent.indexOf("lcd-") === 0
  ) {
    return eq.handle(
      Object.assign({}, body, { topic: "equations", subtopic: "denom" })
    );
  }

  var pack;
  try {
    pack = Q.analyzeMixedStart(start);
  } catch (err) {
    return { ok: false, message: String(err && err.message ? err.message : err) };
  }

  var info = Teach.analyzeDomain(start);
  if (info) {
    var st = eq.domainStatus(start, body.domain);
    if (st.needed && !st.done) {
      return {
        ok: false,
        solved: false,
        errorId: "domain-required",
        message: "קודם רשמו את תחום ההצבה.",
      };
    }
  }

  if (intent === "formula-enter") {
    var last = lastEq(body);
    if (!Q.isStandardZero(last)) {
      return { ok: false, message: "קודם הביאו לצורה ax²+bx+c=0." };
    }
    var p = Q.parseABC(last);
    if (!p || !p.a) {
      return { ok: false, message: "קודם סדרו ל־ax²+bx+c=0 (גם אם b או c אפס)." };
    }
    return {
      ok: true,
      path: "formula",
      enter: "formula",
      md53: !!body.md53,
      view: formulaView(pack),
      message: body.md53
        ? "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון."
        : "נוסחת שורשים. a, b, c הם המקדמים אחרי האיסוף, בצורה ax²+bx+c=0.",
    };
  }

  if (intent === "solution") {
    return {
      ok: true,
      steps: (pack.steps || []).map(function (eqText) {
        return { eq: String(eqText || ""), explain: "" };
      }),
      answer: String(pack.answer || ""),
    };
  }

  var walked = walkPath(Q, pack, history);
  var path = walked.path;
  if (!path && (body.phase || intent === "formula-check")) path = "formula";
  if (path === "formula" && !Q.isAbcOrder(lastEq({ history: history, start: start }))) {
    if (!body.phase) path = null;
  }

  var mixedBody = Object.assign({}, body);
  if (path === "sqrt") {
    var sqrtHist = [walked.lastMixed].concat(suffixHistory(history, walked.splitAt));
    mixedBody.history = sqrtHist;
    mixedBody.previous = sqrtHist[sqrtHist.length - 1];
    mixedBody.start = walked.lastMixed;
    if (intent === "check") {
      var sq = checkSqrtTyped(engine, mixedBody, pack.sqrt);
      sq.path = "sqrt";
      return sq;
    }
    if (intent === "hint" || intent === "one-step") {
      mixedBody.intent = intent;
      mixedBody.subtopic = "sqrt";
      var Qh = engine.DoctematicaQuadratic;
      var Teach2 = engine.DoctematicaTeach;
      var cur = lastEq(mixedBody);
      var extra = null;
      var isoCur = null;
      try {
        extra = pack.sqrt ? Qh.nextSqrtStep(cur, pack.sqrt) : null;
      } catch (errSq) {
        extra = null;
      }
      try {
        isoCur = Qh.isolatedK(cur);
      } catch (errIso) {
        isoCur = null;
      }
      var atSqrt =
        Qh.isRootAnswerText(cur) ||
        (isoCur && (isoCur.kind === "value" || isoCur.kind === "unreduced"));
      var act = {};
      if (!Qh.isRootAnswerText(cur)) {
        act = Teach2.nextAction(cur, { unknown: "x2" }) || {};
      }
      if (intent === "hint") {
        var hint = extra && extra.hint ? extra.hint : act.hint;
        return {
          ok: true,
          path: "sqrt",
          hint: String(hint || ""),
          step: extra && extra.eq ? String(extra.eq) : act.eq || null,
          done: !!(extra && extra.solved),
        };
      }
      var nextEq = extra && extra.eq ? extra.eq : act.eq;
      if (!nextEq) {
        return {
          ok: true,
          path: "sqrt",
          done: true,
          solved: !!(extra && extra.solved),
          hint: String((extra && extra.hint) || act.hint || "התרגיל כבר פתור."),
          step: null,
        };
      }
      mixedBody.typed = nextEq;
      var one = checkSqrtTyped(engine, mixedBody, pack.sqrt);
      one.path = "sqrt";
      one.step = String(nextEq);
      one.hint = String((extra && extra.hint) || act.hint || "");
      one.done = false;
      return one;
    }
  }

  if (path === "factor") {
    var facStart = pack.factor && pack.factor.start ? pack.factor.start : pack.standard;
    var facHist = [facStart].concat(suffixHistory(history, walked.splitAt));
    var facBody = Object.assign({}, body, { start: facStart, history: facHist, intent: intent === "split" ? "split" : intent });
    var fac = handleFactor(engine, facBody);
    fac.path = "factor";
    return fac;
  }

  if (path === "linear") {
    var linPrev = lastEq({ history: history, start: start });
    if (intent === "hint" || intent === "one-step") {
      var linAct = Teach.nextAction(linPrev);
      if (intent === "hint") {
        return { ok: true, path: "linear", hint: String((linAct && linAct.hint) || ""), step: linAct && linAct.eq ? String(linAct.eq) : null, done: !!(linAct && linAct.done) };
      }
      if (!linAct || linAct.done || !linAct.eq) {
        return { ok: true, path: "linear", done: true, hint: String((linAct && linAct.hint) || "המשוואה כבר פתורה."), step: null };
      }
      var linCheck = Algebra.checkStep(linPrev, linAct.eq);
      return {
        ok: !!linCheck.ok,
        path: "linear",
        solved: !!linCheck.solved,
        message: String(linCheck.message || ""),
        step: String(linAct.eq),
        hint: String(linAct.hint || ""),
      };
    }
    if (intent === "check") {
      var lin = Algebra.checkStep(linPrev, String(body.typed || ""));
      return {
        ok: !!lin.ok,
        path: "linear",
        solved: !!lin.solved,
        same: !!lin.same,
        errorId: lin.errorId || null,
        message: String(lin.message || ""),
      };
    }
  }

  if (path === "formula") {
    var want = pack.quad;
    var fBody = Object.assign({}, body, { start: pack.standard });
    var form = handleFormula(engine, fBody, want);
    form.path = "formula";
    return form;
  }

  if (intent === "hint") {
    var hAct = Q.nextMixedStep(lastEq(body), pack) || {};
    return {
      ok: true,
      path: hAct.path || null,
      hint: String(hAct.hint || Q.mixedHintFor(pack, lastEq(body))),
      step: hAct.eq ? String(hAct.eq) : null,
    };
  }

  if (intent === "one-step") {
    var nAct = Q.nextMixedStep(lastEq(body), pack) || {};
    var lastNow = lastEq(body);
    if (nAct.path === "formula" && !nAct.eq) {
      var formStep = handleFormula(
        engine,
        Object.assign({}, body, { intent: "one-step", phase: "abc", letter: "a" }),
        pack.quad
      );
      formStep.path = "formula";
      formStep.enter = "formula";
      formStep.view = Object.assign({}, formulaView(pack) || {}, formStep.view || {});
      return formStep;
    }
    if (nAct.path && nAct.eq) {
      var nxt = Q.checkMixedTyped(lastNow, nAct.eq, pack);
      if (!nxt.ok && /אותה משוואה/.test(String(nxt.message || ""))) {
        return mixedEnter(nAct.path, nAct, pack);
      }
      if (nxt.ok && (nAct.path === "factor" || nxt.path === "factor" || nxt.enter === "factor")) {
        return factorCheckEnter(engine, pack, nAct.eq, { step: nAct.eq, hint: nAct.hint || nxt.message });
      }
      nxt.step = String(nAct.eq);
      nxt.hint = String(nAct.hint || nxt.message || "");
      nxt.path = nAct.path || nxt.path || nxt.enter || null;
      nxt.enter = nAct.path || nxt.enter || nxt.path;
      if (!nxt.message) nxt.message = String(nAct.hint || nxt.hint || "");
      return nxt;
    }
    if (nAct.path && !nAct.eq) {
      return mixedEnter(nAct.path, nAct, pack);
    }
    if (!nAct.eq) {
      return { ok: true, hint: String(nAct.hint || "התרגיל כבר פתור."), step: null, path: nAct.path || null };
    }
    var nxtEq = Q.checkMixedTyped(lastNow, nAct.eq, pack);
    nxtEq.step = String(nAct.eq);
    nxtEq.hint = String(nAct.hint || "");
    nxtEq.path = nAct.path || nxtEq.path || nxtEq.enter || null;
    return nxtEq;
  }

  if (intent !== "check") {
    return { error: "unknown intent", message: "unknown intent" };
  }

  var res = Q.checkMixedTyped(lastEq(body), String(body.typed || ""), pack);
  if (res && res.ok && (res.enter === "sqrt" || res.path === "sqrt")) {
    var sq2 = checkSqrtTyped(
      engine,
      Object.assign({}, body, { start: lastEq(body), history: [lastEq(body)], previous: lastEq(body) }),
      pack.sqrt
    );
    sq2.path = "sqrt";
    sq2.enter = "sqrt";
    if (!sq2.ok && res.ok) {
      return {
        ok: true,
        path: "sqrt",
        enter: "sqrt",
        message: res.message,
      };
    }
    return sq2;
  }
  if (res && res.ok && (res.path === "factor" || res.enter === "factor")) {
    return factorCheckEnter(engine, pack, String(body.typed || ""), { step: body.typed, hint: res.message });
  }
  if (res && res.ok && res.enter === "linear") {
    res.path = "linear";
  }
  return res;
}

module.exports = {
  handleMixed: handleMixed,
};
