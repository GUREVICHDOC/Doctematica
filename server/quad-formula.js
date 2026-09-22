"use strict";

function wantFrom(engine, start) {
  return engine.DoctematicaQuadratic.analyzeStart(String(start || ""));
}

function slotsOf(body) {
  return (body && body.slots) || {};
}

function nextAfterCompute(want) {
  return want.kind === "none" ? "count" : "sqrt";
}

// The browser stub only displays these; it does not recompute −b ± √Δ or 2a.
function rootWorkView(Q, want) {
  var view = {
    a: want.a,
    b: want.b,
    c: want.c,
    D: want.D,
    s: want.s,
    kind: want.kind,
  };
  if (!want || want.kind === "none" || want.s == null) return view;
  view.denWant = Q.denWant(want);
  view.numWant = Q.numWant(want, 1);
  view.numWantNeg = Q.numWant(want, -1);
  view.rootNum = Q.rootNumExpr(want, 1);
  view.rootNumNeg = Q.rootNumExpr(want, -1);
  return view;
}

function formulaHint(Q, want, phase, md53) {
  var tips = {
    abc: "a מקדם x², b מקדם x, c החופשי. כאן a = " + want.a + ".",
    plug: "הציבו a, b, c. אם b שלילי, ב־b² כתבו עם סוגריים, למשל (−4)².",
    compute:
      "חשבו −b, את " + Q.discExpr(want.a, want.b, want.c) + ", ואת 2a. שני מינוסים הופכים לפלוס.",
    sqrt: "√(" + want.D + ") הוא מספר שלם.",
    count: "הסתכלו על סימן הדיסקרימיננטה Δ = " + want.D + ". אפשר גם ללחוץ המשך.",
    nosol: "רשמו שאין פתרון ממשי.",
    rootwork: "חשבו קודם את המונה, ואז את השבר עם קו השבר. אחר כך את התוצאה.",
    roots: "x = (−b ± √Δ) / (2a). צמצמו את השבר.",
    done: "התרגיל כבר פתור.",
  };
  if (md53 && phase === "abc") {
    return "md53: רשמו a, אחר כך b, אחר כך c. אחרי שלושתם מופיע הפתרון.";
  }
  return tips[phase] || "התרגיל כבר פתור.";
}

function fillForPhase(Q, want, phase, root) {
  root = root || {};
  var sign = root.at || 1;
  if (phase === "abc") {
    return { a: String(want.a), b: String(want.b), c: String(want.c) };
  }
  if (phase === "plug") {
    return {
      b1: String(want.b),
      b2: want.b < 0 ? "(" + want.b + ")" : String(want.b),
      a1: String(want.a),
      a2: String(want.a),
      c: String(want.c),
    };
  }
  if (phase === "compute") {
    return { negB: String(-want.b), disc: String(want.D), den: String(2 * want.a) };
  }
  if (phase === "sqrt") {
    return { s: String(want.s) };
  }
  if (phase === "count") {
    return { kind: want.kind };
  }
  if (phase === "nosol") {
    return { none: "אין פתרון ממשי" };
  }
  if (phase === "rootwork") {
    if (!root.numDone || !root.denDone) {
      return { rnum: String(Q.numWant(want, sign)), rden: String(Q.denWant(want)) };
    }
    return { rval: Q.fmt(Q.rootWant(want, sign)) };
  }
  return {};
}

function snapshotFormula(res, extra) {
  extra = extra || {};
  var out = {
    ok: !!res.ok,
    more: !!res.more,
    skip: !!res.skip,
    solved: !!extra.solved,
    message: String(res.message || extra.message || ""),
    phase: extra.phase || null,
    nextPhase: extra.nextPhase || extra.phase || null,
    letter: extra.letter || null,
    nextLetter: extra.nextLetter || null,
    nextRoot: extra.nextRoot == null ? null : extra.nextRoot,
  };
  if (res.parts) out.parts = res.parts;
  if (extra.view) out.view = extra.view;
  if (extra.fill) out.fill = extra.fill;
  if (extra.kind) out.kind = extra.kind;
  if (extra.answer != null) out.answer = extra.answer;
  if (extra.step) out.step = extra.step;
  if (extra.hint) out.hint = extra.hint;
  if (extra.done) out.done = true;
  return out;
}

function handleFormulaCheck(engine, body, wantOverride) {
  var Q = engine.DoctematicaQuadratic;
  var want = wantOverride || wantFrom(engine, body.start);
  var phase = String(body.phase || "abc");
  var slots = slotsOf(body);
  var md53 = !!body.md53;
  var root = body.root || {};

  if (phase === "nosol" && want.kind !== "none") {
    return snapshotFormula({ ok: false, message: "יש פתרון ממשי — לא רושמים שאין פתרון." }, { phase: phase });
  }
  if (phase === "rootwork" && want.kind === "none") {
    return snapshotFormula({ ok: false, message: "אין פתרון ממשי לחשב." }, { phase: phase });
  }
  if (phase === "sqrt" && want.kind === "none") {
    return snapshotFormula({ ok: false, message: "הדיסקרימיננטה שלילית — אין שורש ממשי." }, { phase: phase });
  }

  if (phase === "abc") {
    var letter = String(body.letter || "a");
    var typed = body.typed != null && body.typed !== "" ? body.typed : slots[letter];
    var one = Q.checkCoeff(want, letter, typed);
    if (!one.ok) return snapshotFormula(one, { phase: "abc", letter: letter, nextLetter: letter });
    if (letter === "a") {
      return snapshotFormula(one, { phase: "abc", letter: "a", nextLetter: "b", nextPhase: "abc" });
    }
    if (letter === "b") {
      return snapshotFormula(one, { phase: "abc", letter: "b", nextLetter: "c", nextPhase: "abc" });
    }
    var abcView = { a: want.a, b: want.b, c: want.c };
    if (md53) {
      return snapshotFormula(
        { ok: true, message: "לפי md53: " + want.answer },
        {
          phase: "abc",
          letter: "c",
          nextPhase: "done",
          solved: true,
          kind: want.kind,
          answer: String(want.answer || ""),
          view: { a: want.a, b: want.b, c: want.c, kind: want.kind, answer: String(want.answer || "") },
        }
      );
    }
    return snapshotFormula(
      { ok: true, message: "המקדמים נכונים. עכשיו הציבו בנוסחת השורשים." },
      { phase: "abc", letter: "c", nextPhase: "plug", view: abcView }
    );
  }

  if (phase === "plug") {
    var plug = Q.checkPlug(want, {
      a1: slots.a1,
      a2: slots.a2,
      b1: slots.b1,
      b2: slots.b2,
      c: slots.c,
    });
    return snapshotFormula(plug, {
      phase: "plug",
      nextPhase: plug.ok && !plug.more ? "compute" : "plug",
      view: { a: want.a, b: want.b, c: want.c },
    });
  }

  if (phase === "compute") {
    var c = body.compute || {};
    var comp = Q.checkCompute(want, {
      negB: c.negBDone ? String(-want.b) : slots.negB,
      disc: c.discDone ? String(want.D) : slots.disc,
      den: c.denDone ? String(2 * want.a) : slots.den,
    });
    var next = "compute";
    var view = { a: want.a, b: want.b, c: want.c };
    if (comp.ok && !comp.more) {
      next = nextAfterCompute(want);
      view.D = want.D;
    }
    return snapshotFormula(comp, { phase: "compute", nextPhase: next, view: view });
  }

  if (phase === "sqrt") {
    var sq = Q.checkSqrt(want, slots.s != null ? slots.s : body.typed);
    var viewS = { a: want.a, b: want.b, c: want.c, D: want.D };
    var nextS = "sqrt";
    if (sq.ok && !sq.more) {
      nextS = "count";
      viewS.s = want.s;
    }
    return snapshotFormula(sq, { phase: "sqrt", nextPhase: nextS, view: viewS });
  }

  if (phase === "count") {
    var picked = body.picked != null ? body.picked : body.typed;
    var cnt = Q.checkCount(want, picked);
    var nextC = "count";
    if (cnt.ok) {
      nextC = want.kind === "none" ? "nosol" : "rootwork";
    }
    return snapshotFormula(cnt, {
      phase: "count",
      nextPhase: nextC,
      kind: want.kind,
      view:
        cnt.ok && nextC === "rootwork"
          ? rootWorkView(Q, want)
          : { a: want.a, b: want.b, c: want.c, D: want.D, s: want.s, kind: want.kind },
    });
  }

  if (phase === "nosol") {
    var none = Q.checkNone(slots.none != null ? slots.none : body.typed);
    return snapshotFormula(none, {
      phase: "nosol",
      nextPhase: none.ok ? "done" : "nosol",
      solved: !!none.ok,
      kind: "none",
      answer: want.answer,
      view: { kind: "none", D: want.D },
    });
  }

  if (phase === "rootwork") {
    var sign = root.at || 1;
    if (!root.numDone || !root.denDone) {
      var fields = {
        num: root.numDone ? String(Q.numWant(want, sign)) : slots.rnum,
        den: root.denDone ? String(Q.denWant(want)) : slots.rden,
      };
      var rc = Q.checkRootCompute(want, sign, fields);
      return snapshotFormula(rc, { phase: "rootwork", nextPhase: "rootwork", view: rootWorkView(Q, want) });
    }
    var typedR = slots.rval != null ? slots.rval : body.typed;
    var fin = Q.checkRootFinal(want, sign, typedR);
    if (!fin.ok || fin.more) {
      return snapshotFormula(fin, { phase: "rootwork", nextPhase: "rootwork" });
    }
    if (sign > 0 && want.kind === "two") {
      return snapshotFormula(fin, {
        phase: "rootwork",
        nextPhase: "rootwork",
        nextLetter: "x2",
        nextRoot: -1,
        view: rootWorkView(Q, want),
      });
    }
    return snapshotFormula(fin, {
      phase: "rootwork",
      nextPhase: "done",
      solved: true,
      kind: want.kind,
      answer: want.answer,
      view: { kind: want.kind, answer: want.answer },
    });
  }

  return snapshotFormula({ ok: false, message: "שלב לא מוכר." }, { phase: phase });
}

function handleFormulaHint(engine, body, wantOverride) {
  var Q = engine.DoctematicaQuadratic;
  var want = wantOverride || wantFrom(engine, body.start);
  var phase = String(body.phase || "abc");
  return {
    ok: true,
    hint: formulaHint(Q, want, phase, !!body.md53),
    phase: phase,
  };
}

function handleFormulaOneStep(engine, body, wantOverride) {
  var Q = engine.DoctematicaQuadratic;
  var want = wantOverride || wantFrom(engine, body.start);
  var phase = String(body.phase || "abc");
  var fill = fillForPhase(Q, want, phase, body.root);
  var nextBody = Object.assign({}, body, { slots: Object.assign({}, slotsOf(body), fill), fill: fill });
  if (phase === "abc") {
    nextBody.letter = "c";
    nextBody.typed = String(want.c);
  }
  if (phase === "count") nextBody.picked = want.kind;
  if (phase === "nosol") nextBody.typed = "אין פתרון ממשי";
  var check = handleFormulaCheck(engine, nextBody, want);
  check.fill = fill;
  check.hint = formulaHint(Q, want, phase, !!body.md53);
  return check;
}

function handleFormulaSolution(engine, body, wantOverride) {
  var want = wantOverride || wantFrom(engine, body.start);
  return {
    ok: true,
    steps: (want.steps || []).map(function (eq) {
      return { eq: String(eq || ""), explain: "" };
    }),
    answer: String(want.answer || ""),
    kind: want.kind,
  };
}

function handleFormula(engine, body, wantOverride) {
  var intent = String(body.intent || "");
  if (intent === "check") return handleFormulaCheck(engine, body, wantOverride);
  if (intent === "hint") return handleFormulaHint(engine, body, wantOverride);
  if (intent === "one-step") return handleFormulaOneStep(engine, body, wantOverride);
  if (intent === "solution") return handleFormulaSolution(engine, body, wantOverride);
  return { error: "unknown intent", message: "unknown intent" };
}

module.exports = {
  handleFormula: handleFormula,
  handleFormulaCheck: handleFormulaCheck,
  snapshotFormula: snapshotFormula,
};
