"use strict";

var subTeach = require("./systems-teach");

function remainVar(op) {
  if (!op) return "x";
  if (op.cancel === "x") return "y";
  if (op.cancel === "y") return "x";
  return "x";
}

function nextAction(Sys, Algebra, st, history) {
  if (!st || st.phase === "done") return null;
  var hist = history || [];
  if (st.phase === "prep") {
    var prep = Sys.bestPrep(st.eq[0], st.eq[1]);
    if (!prep) {
      var stuck = "מהמערכת הנוכחית אין כופלים שלמים שיוצרים מקדמים שווים או נגדיים.";
      return { error: stuck, hint: stuck };
    }
    var bits = [];
    (prep.factors || []).forEach(function (k, i) {
      if (k != null) bits.push(i + ":" + k);
    });
    return {
      token: "mul:" + bits.join(",") + "|" + st.eq[0] + "|" + st.eq[1],
      reason: prep.reason,
      hint: prep.hint,
    };
  }
  if (st.phase === "prep_write" && st.scale) {
    var marked = [null, null];
    if (st.scale.factors) {
      marked[0] = st.scale.factors[0] == null ? null : Number(st.scale.factors[0]);
      marked[1] = st.scale.factors[1] == null ? null : Number(st.scale.factors[1]);
    } else if (st.scale.index === 0 || st.scale.index === 1) {
      marked[st.scale.index] = Number(st.scale.k);
    }
    var nextEq = st.eq.slice();
    var used = [];
    var wi;
    for (wi = 0; wi < 2; wi++) {
      if (marked[wi] == null) continue;
      nextEq[wi] = Sys.scaleEquation(st.eq[wi], marked[wi]);
      used.push(wi);
    }
    var reason;
    var hint;
    if (used.length === 2) {
      reason =
        "כפלנו את משוואה 1 ב־" +
        String(marked[0]).replace("-", "−") +
        " ואת משוואה 2 ב־" +
        String(marked[1]).replace("-", "−") +
        ".";
      hint = "כתבו את שתי המשוואות אחרי הכפל.";
    } else {
      var idx = used[0];
      var kn = String(marked[idx]).replace("-", "−");
      var other = idx === 0 ? 1 : 0;
      reason = "כפלנו את משוואה " + (idx + 1) + " ב־" + kn + ". משוואה " + (other + 1) + " הועתקה כמו שהיא.";
      hint = "כתבו את משוואה " + (idx + 1) + " אחרי הכפל ב־" + kn + ", והעתיקו את משוואה " + (other + 1) + " כמו שהיא.";
    }
    return {
      token: "sys:" + nextEq[0] + "|" + nextEq[1],
      reason: reason,
      hint: hint,
    };
  }
  if (st.phase === "work_combine") {
    var best = Sys.bestElimOp(st.eq[0], st.eq[1]);
    if (!best) return { error: "אין משתנה שאפשר לבטל בלי להכפיל משוואה." };
    return {
      eq: Sys.formatElim(st.eq[0], st.eq[1], best),
      reason: best.reason,
      hint: best.hint,
    };
  }
  if (st.phase === "work_simplify") {
    return {
      eq: Sys.formatReduced(st.op),
      reason: "כינסנו איברים דומים.",
      hint: "כנסו איברים דומים.",
    };
  }
  if (st.phase === "work_solve") {
    var cur = hist.length ? String(hist[hist.length - 1]) : Sys.formatReduced(st.op);
    var alg = subTeach.nextAlgebra(Sys, Algebra, cur, { mode: "value", v: remainVar(st.op) });
    if (alg && alg.already) return null;
    return alg;
  }
  if (st.phase === "pick_back" || st.phase === "work_back") {
    var backSt = {
      phase: st.phase,
      eq: st.original || st.eq,
      found: st.found,
      known: st.known,
      needSub: st.needSub,
      workTarget: st.workTarget,
    };
    var action = subTeach.nextAction(Sys, Algebra, backSt, hist);
    if (action && st.phase === "pick_back" && st.found) {
      action.hint =
        "מצאתם " +
        st.found.v +
        " = " +
        Sys.fmt(st.found.value) +
        ". הציבו אותו באחת המשוואות המקוריות כדי למצוא את " +
        (st.found.v === "x" ? "y" : "x") +
        ".";
    }
    return action;
  }
  return null;
}

module.exports = {
  nextAction: nextAction,
};
