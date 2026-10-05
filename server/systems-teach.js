"use strict";

var EPS = 1e-8;

function near0(n) {
  return Math.abs(n) < EPS;
}

function near(a, b) {
  return Math.abs(a - b) < EPS;
}

function fmtPlain(Sys, n) {
  return String(Sys.fmt(n)).split(" או ")[0].replace(/−/g, "-");
}

function prose(s) {
  return String(s || "").replace(/-/g, "−");
}

function eqWord(i) {
  return i === 0 ? "הראשונה" : "השנייה";
}

function otherVar(v) {
  return v === "x" ? "y" : "x";
}

function termsFromVector(t) {
  var out = [];
  if (!near0(t.x)) out.push({ k: "x", c: t.x });
  if (!near0(t.y)) out.push({ k: "y", c: t.y });
  if (!near0(t.k) || !out.length) out.push({ k: "n", c: near0(t.k) ? 0 : t.k });
  return out;
}

function formatTerms(Sys, terms) {
  var list = (terms || []).filter(function (t) {
    return !near0(t.c);
  });
  if (!list.length) return "0";
  if (list[0].c < 0) {
    var idx = -1;
    var i;
    for (i = 1; i < list.length; i++) {
      if (list[i].k === "n" && list[i].c > 0) {
        idx = i;
        break;
      }
    }
    if (idx > 0) list.unshift(list.splice(idx, 1)[0]);
  }
  var s = "";
  list.forEach(function (t, i) {
    var abs = fmtPlain(Sys, Math.abs(t.c));
    var body = t.k === "n" ? abs : abs === "1" ? t.k : abs + t.k;
    if (i === 0) s += (t.c < 0 ? "-" : "") + body;
    else s += (t.c < 0 ? "-" : "+") + body;
  });
  return s;
}

function formatEq(Sys, left, right) {
  return formatTerms(Sys, left) + "=" + formatTerms(Sys, right);
}

function termLabel(Sys, term) {
  return prose(formatTerms(Sys, [term]));
}

function vectorOf(eq, side) {
  return side === "right" ? eq.right : eq.left;
}

function regionNeeds(s) {
  var xs = (String(s).match(/x/gi) || []).length;
  var ys = (String(s).match(/y/gi) || []).length;
  if (xs > 1 || ys > 1) return true;
  var noVar = String(s).replace(/[0-9.]*[xy]/gi, " ");
  var constants = noVar.match(/\d+(?:\.\d+)?/g) || [];
  return constants.length > 1;
}

function sideNeedsCombine(side) {
  var regions = [];
  var re = /\(([^()]*)\)/g;
  var m;
  var outside = String(side).replace(/\([^()]*\)/g, " ");
  outside = outside.replace(/\/\d+(?:\.\d+)?/g, "");
  regions.push(outside);
  while ((m = re.exec(side))) regions.push(m[1]);
  var i;
  for (i = 0; i < regions.length; i++) {
    if (regionNeeds(regions[i])) return true;
  }
  return false;
}

function collectDistributes(Sys, text) {
  var hits = [];
  var from = 0;
  var guard = 0;
  var src = String(text || "").replace(/\s+/g, "");
  while (guard < 8) {
    guard += 1;
    var hit = Sys.findDistribute(src.slice(from));
    if (!hit) break;
    hit.start += from;
    hit.end += from;
    hits.push(hit);
    from = hit.end;
  }
  return hits;
}

function improperMixed(wholeStr, numStr, denStr) {
  var whole = parseInt(wholeStr, 10);
  var num = parseInt(numStr, 10);
  var den = parseInt(denStr, 10);
  if (!den) return null;
  var sign = whole < 0 ? -1 : 1;
  var imp = sign * (Math.abs(whole) * den + num);
  var body = den === 1 ? String(Math.abs(imp)) : Math.abs(imp) + "/" + den;
  var shown = (imp < 0 ? "-" : "") + body;
  return shown.indexOf("/") >= 0 ? "(" + shown + ")" : shown;
}

function mixedNumberStep(text) {
  var count = 0;
  var next = String(text || "").replace(/(-?\d+)\s+(\d+)\s*\/\s*(\d+)/g, function (_m, w, n, d) {
    var imp = improperMixed(w, n, d);
    if (imp == null) return _m;
    count += 1;
    return imp;
  });
  next = next.replace(/\((-?\d+)\+(\d+)\/(\d+)\)/g, function (_m, w, n, d) {
    var imp = improperMixed(w, n, d);
    if (imp == null) return _m;
    count += 1;
    return imp;
  });
  if (!count || next.replace(/\s+/g, "") === String(text || "").replace(/\s+/g, "")) return null;
  return {
    eq: next.replace(/\s*=\s*/, "=").replace(/\s+/g, ""),
    hint: "המירו את המספרים המעורבים לשברים מדומים.",
    reason: "ממירים מספר מעורב לשבר מדומה: כופלים את השלם במכנה ומוסיפים את המונה.",
  };
}

function expandStep(Sys, text) {
  var src = String(text || "").replace(/\s+/g, "");
  var hits = collectDistributes(Sys, src);
  if (!hits.length) return null;
  var eqAt = src.indexOf("=");
  var left = false;
  var right = false;
  var next = src;
  var i;
  for (i = hits.length - 1; i >= 0; i--) {
    var hit = hits[i];
    if (eqAt >= 0 && hit.start > eqAt) right = true;
    else left = true;
    var parsed;
    try {
      parsed = Sys.parseEquation(hit.inside + "=0");
    } catch (err) {
      return null;
    }
    var scaled = {
      x: parsed.left.x * hit.coef,
      y: parsed.left.y * hit.coef,
      k: parsed.left.k * hit.coef,
    };
    var body = hit.dropOnly ? hit.inside : formatTerms(Sys, termsFromVector(scaled));
    var before = hit.start > 0 ? next.charAt(hit.start - 1) : "";
    if (body.charAt(0) !== "-" && body.charAt(0) !== "+" && before && before !== "+" && before !== "=") {
      body = "+" + body;
    }
    next = next.slice(0, hit.start) + body + next.slice(hit.end);
  }
  if (next === src) return null;
  var hint = "פתחו את הסוגריים.";
  var reason;
  if (hits.length === 1 && hits[0].dropOnly) {
    hint = "הורידו סוגריים מיותרים.";
    reason = "הורדנו סוגריים מיותרים.";
  } else if (hits.length === 1 && near(hits[0].coef, -1)) {
    reason = "פתחנו את הסוגריים: המינוס שלפני הסוגריים כופל כל איבר שבפנים.";
  } else if (hits.length === 1) {
    reason = "פתחנו את הסוגריים: כפלנו את " + prose(fmtPlain(Sys, hits[0].coef)) + " בכל איבר שבסוגריים.";
  } else {
    if (left && right) hint = "פתחו את הסוגריים בשני האגפים.";
    else if (right && !left) hint = "פתחו את הסוגריים באגף ימין.";
    reason = "פתחנו את הסוגריים: כפלנו את המקדם בכל איבר שבתוך הסוגריים.";
  }
  return { eq: next, hint: hint, reason: reason };
}

function productStep(Sys, text) {
  var re = /(-?\d+(?:\.\d+)?)[·*](-?\d+(?:\.\d+)?)/;
  var m = re.exec(text);
  if (!m) return null;
  var val = parseFloat(m[1], 10) * parseFloat(m[2], 10);
  var next = text.slice(0, m.index) + fmtPlain(Sys, val) + text.slice(m.index + m[0].length);
  if (next === text) return null;
  var shown = prose(m[1] + "·" + m[2]);
  return {
    eq: next,
    hint: "חשבו את " + shown + ".",
    reason: "חישבנו " + shown + " = " + prose(fmtPlain(Sys, val)) + ".",
  };
}

function combineStep(Sys, text) {
  var parts = String(text).split("=");
  if (parts.length !== 2) return null;
  if (!sideNeedsCombine(parts[0]) && !sideNeedsCombine(parts[1])) return null;
  var numeric = false;
  var changed = false;
  var shown = "";
  var nextParts = parts.map(function (side) {
    if (!sideNeedsCombine(side)) return side;
    if (!/[xy]/i.test(side)) numeric = true;
    if (!shown) shown = side;
    var parsed = Sys.parseEquation(side + "=0");
    var formatted = formatTerms(Sys, termsFromVector(parsed.left));
    if (formatted !== side) changed = true;
    return formatted;
  });
  if (!changed) return null;
  var next = nextParts.join("=");
  if (numeric) {
    var got = sideNeedsCombine(parts[0]) ? nextParts[0] : nextParts[1];
    return {
      eq: next,
      hint: "חשבו את " + prose(shown) + ".",
      reason: "חישבנו את " + prose(shown) + " וקיבלנו " + prose(got) + ".",
    };
  }
  return {
    eq: next,
    hint: "כנסו איברים דומים.",
    reason: "כינסנו איברים דומים.",
  };
}

function isolationOf(Sys, text) {
  try {
    return Sys.readIsolation(Sys.parseEquation(text));
  } catch (err) {
    return null;
  }
}

function isValueText(Sys, Algebra, text) {
  var iso = isolationOf(Sys, text);
  if (!iso || !near0(iso.rhs.x) || !near0(iso.rhs.y)) return false;
  return Algebra.isolatedRhsKind(text, iso.v) === "value";
}

function rowOf(eq) {
  return {
    x: eq.left.x - eq.right.x,
    y: eq.left.y - eq.right.y,
    k: eq.left.k - eq.right.k,
  };
}

function terminalKind(Sys, text) {
  var eq = Sys.parseEquation(text);
  var r = rowOf(eq);
  if (near0(r.x) && near0(r.y) && near0(r.k)) return "infinite";
  if (near0(r.x) && near0(r.y) && !near0(r.k)) return "none";
  return null;
}

function goalMet(Sys, Algebra, text, goal) {
  if (goal.mode === "isolate") {
    var iso = isolationOf(Sys, text);
    return !!(iso && iso.v === goal.v);
  }
  return isValueText(Sys, Algebra, text);
}

function reduceNumberStep(Sys, Algebra, text) {
  var iso = isolationOf(Sys, text);
  if (!iso || !near0(iso.rhs.x) || !near0(iso.rhs.y)) return null;
  var kind = Algebra.isolatedRhsKind(text, iso.v);
  if (kind !== "unreduced" && kind !== "expr") return null;
  var parts = String(text).split("=");
  var other = parts[0].replace(/\s/g, "") === iso.v ? parts[1] : parts[0];
  if (/[xy]/i.test(other)) return null;
  var pretty = fmtPlain(Sys, iso.rhs.k);
  if (other.replace(/\s/g, "") === pretty) return null;
  return {
    eq: iso.v + "=" + pretty,
    hint: "חשבו את " + prose(other) + " עד שמקבלים מספר אחד.",
    reason: "חישבנו את " + prose(other) + " וקיבלנו " + iso.v + " = " + prose(pretty) + ".",
  };
}

function listTerms(eq) {
  return {
    left: termsFromVector(eq.left).filter(function (t) {
      return !near0(t.c);
    }),
    right: termsFromVector(eq.right).filter(function (t) {
      return !near0(t.c);
    }),
  };
}

function findTerm(terms, kind) {
  var i;
  for (i = 0; i < terms.length; i++) {
    if (terms[i].k === kind) return i;
  }
  return -1;
}

function moveTerm(left, right, fromLeft, index, compute) {
  var src = fromLeft ? left.slice() : right.slice();
  var dst = fromLeft ? right.slice() : left.slice();
  var term = src[index];
  src.splice(index, 1);
  var moved = { k: term.k, c: -term.c };
  dst = dst.concat([moved]);
  if (compute && moved.k === "n" && dst.every(function (t) { return t.k === "n"; })) {
    var sum = 0;
    dst.forEach(function (t) {
      sum += t.c;
    });
    dst = near0(sum) ? [] : [{ k: "n", c: sum }];
  }
  if (fromLeft) return { left: src, right: dst, term: term };
  return { left: dst, right: src, term: term };
}

function balanceStep(Sys, text, goal) {
  var eq = Sys.parseEquation(text);
  var sides = listTerms(eq);
  var v = goal.v;
  var other = otherVar(v);
  var left = sides.left;
  var right = sides.right;
  var vLeft = findTerm(left, v);
  var vRight = findTerm(right, v);
  var moved;
  var hint;
  var reason;
  var where;

  if (vLeft < 0 && vRight >= 0) {
    var flipped = formatEq(Sys, right, left);
    return {
      eq: flipped,
      hint: "הפכו אגפים כדי ש־" + v + " יהיה בצד שמאל.",
      reason: "הפכנו אגפים כדי ש־" + v + " יהיה בצד שמאל.",
    };
  }

  if (vRight >= 0) {
    moved = moveTerm(left, right, false, vRight, false);
    where = "שמאל";
  } else if (findTerm(left, other) >= 0) {
    moved = moveTerm(left, right, true, findTerm(left, other), false);
    where = "השני";
  } else if (findTerm(left, "n") >= 0 && vLeft >= 0) {
    moved = moveTerm(left, right, true, findTerm(left, "n"), false);
    where = "השני";
  } else if (left.length === 1 && left[0].k === v && !near(left[0].c, 1)) {
    return divideStep(Sys, text, left, right, v);
  } else {
    return null;
  }

  var next = formatEq(Sys, moved.left, moved.right);
  var label = termLabel(Sys, moved.term);
  if (where === "שמאל") {
    hint = "העבירו את " + label + " לאגף שמאל והחליפו סימן.";
    reason = "העברנו את " + label + " לאגף שמאל והחלפנו סימן.";
  } else if (moved.term.k === "n") {
    var purpose = goal.mode === "isolate" ? " כדי לבודד את " + v : "";
    var pending = moved.right.filter(function (t) {
      return t.k === "n" && !near0(t.c);
    }).length > 1;
    hint = "העבירו את " + label + " לאגף השני" + purpose + (pending ? ". עדיין בלי לחשב." : ".");
    reason = "העברנו את " + label + " לאגף השני והחלפנו סימן" + purpose + ".";
  } else {
    hint = "העבירו את " + label + " לאגף השני כדי להשאיר את " + v + " לבד.";
    reason = (moved.term.c > 0 ? "החסרנו " : "העברנו את ") + label + (moved.term.c > 0 ? " משני אגפי המשוואה" : " לאגף השני והחלפנו סימן") + " כדי לבודד את " + v + ".";
  }
  if (next === text) return null;
  return { eq: next, hint: hint, reason: reason };
}

function divideStep(Sys, text, left, right, v) {
  var c = left[0].c;
  var numeric = right.every(function (t) {
    return t.k === "n";
  });
  if (near(c, -1)) {
    var neg = right.map(function (t) {
      return { k: t.k, c: -t.c };
    });
    var next = formatEq(Sys, [{ k: v, c: 1 }], neg);
    return {
      eq: next,
      hint: "כפלו את שני האגפים ב־−1 כדי שמקדם " + v + " יהיה 1.",
      reason: "כפלנו את שני האגפים ב־−1 וקיבלנו " + prose(next) + ".",
    };
  }
  if (numeric && right.length === 1) {
    var numS = fmtPlain(Sys, right[0].c);
    var denS = fmtPlain(Sys, c);
    var numBody = numS.indexOf("/") >= 0 ? "(" + numS + ")" : numS;
    var denBody = denS.indexOf("/") >= 0 ? "(" + denS + ")" : denS;
    var frac = c < 0 ? "(" + numBody + ")/(" + denBody + ")" : numBody + "/" + denBody;
    return {
      eq: v + "=" + frac,
      hint: "חלקו את שני האגפים ב־" + prose(denS) + ". עדיין בלי לחשב.",
      reason: "חילקנו את שני האגפים ב־" + prose(denS) + ".",
    };
  }
  var rhs = formatTerms(Sys, right);
  var divText = c < 0 ? v + "=-(" + rhs + ")/" + fmtPlain(Sys, Math.abs(c)) : v + "=(" + rhs + ")/" + fmtPlain(Sys, c);
  return {
    eq: divText,
    hint: "חלקו את שני האגפים ב־" + prose(fmtPlain(Sys, c)) + ".",
    reason: "חילקנו את שני האגפים ב־" + prose(fmtPlain(Sys, c)) + ".",
  };
}

function withTerminal(Sys, prev, step) {
  if (!step) return null;
  var chk = Sys.checkWorkStep(prev, step.eq);
  if (!chk.ok) return { error: chk.message, eq: step.eq };
  if (chk.kind === "none" && step.reason.indexOf("סתירה") < 0) {
    step.reason += " מתקבלת סתירה, ולכן אין פתרון.";
    step.hint = step.hint.replace(/\.$/, "") + " — כאן תתקבל סתירה.";
  }
  if (chk.kind === "infinite" && step.reason.indexOf("זהות") < 0) {
    step.reason += " מתקבלת זהות, ולכן יש אינסוף פתרונות.";
  }
  step.kind = chk.kind || "step";
  return step;
}

function nextAlgebra(Sys, Algebra, text, goal) {
  var term = terminalKind(Sys, text);
  if (term) return { already: true, terminal: term };
  if (goalMet(Sys, Algebra, text, goal)) return { already: true };

  var mixed = mixedNumberStep(text);
  if (mixed) return withTerminal(Sys, text, mixed);
  var expanded = expandStep(Sys, text);
  if (expanded) return withTerminal(Sys, text, expanded);
  var product = productStep(Sys, text);
  if (product) return withTerminal(Sys, text, product);
  var combined = combineStep(Sys, text);
  if (combined) return withTerminal(Sys, text, combined);
  var reduced = reduceNumberStep(Sys, Algebra, text);
  if (reduced) return withTerminal(Sys, text, reduced);
  if (goalMet(Sys, Algebra, text, goal)) return { already: true };
  var balanced = balanceStep(Sys, text, goal);
  if (balanced) return withTerminal(Sys, text, balanced);
  return { error: "אין צעד המשך ל־" + text };
}

function exprOf(Sys, isol) {
  return formatTerms(Sys, termsFromVector(isol.rhs));
}

function pieceForSub(Sys, coef, isol) {
  var numeric = near0(isol.rhs.x) && near0(isol.rhs.y);
  var expr = exprOf(Sys, isol);
  if (numeric) {
    var n = isol.rhs.k;
    if (near(Math.abs(coef), 1)) return fmtPlain(Sys, coef < 0 ? -n : n);
    var absC = fmtPlain(Sys, Math.abs(coef));
    var absN = fmtPlain(Sys, Math.abs(n));
    var body = (near(Math.abs(coef), 1) ? "" : absC) + "·" + (n < 0 ? "(" + fmtPlain(Sys, n) + ")" : absN);
    return (coef < 0 ? "-" : "") + body;
  }
  if (near(coef, 1)) return expr;
  if (near(coef, -1)) return "-(" + expr + ")";
  return (coef < 0 ? "-" : "") + fmtPlain(Sys, Math.abs(coef)) + "(" + expr + ")";
}

function replaceVarInSide(Sys, side, isol) {
  var re = new RegExp("(-?)(\\d*\\.?\\d+)?" + isol.v, "g");
  return String(side).replace(re, function (_full, sign, digits, offset) {
    var coef = (digits ? parseFloat(digits, 10) : 1) * (sign === "-" ? -1 : 1);
    var piece = pieceForSub(Sys, coef, isol);
    var before = offset > 0 ? side.charAt(offset - 1) : "";
    if (piece.charAt(0) !== "-" && piece.charAt(0) !== "+" && before && before !== "+" && before !== "=") {
      return "+" + piece;
    }
    return piece;
  });
}

function substitutionText(Sys, isol, eqText) {
  var parts = String(eqText).split("=");
  if (parts.length !== 2) return eqText;
  return replaceVarInSide(Sys, parts[0], isol) + "=" + replaceVarInSide(Sys, parts[1], isol);
}

function subReason(Sys, isol, target, chk) {
  var expr = prose(isol.v + " = " + exprOf(Sys, isol));
  var base = "הצבנו " + expr + " במשוואה " + eqWord(target) + ".";
  if (chk && chk.kind === "none") return base + " מתקבלת סתירה, ולכן אין פתרון.";
  if (chk && chk.kind === "infinite") return base + " מתקבלת זהות, ולכן יש אינסוף פתרונות.";
  return base;
}

function currentEq(st, history) {
  var hist = history || [];
  if (hist.length) return String(hist[hist.length - 1]);
  if (st.phase === "work_isolate" && st.workFrom != null) return st.eq[st.workFrom];
  if ((st.phase === "work_sub" || st.phase === "work_back") && st.workTarget != null) return st.eq[st.workTarget];
  return "";
}

function solveGoal(Sys, text, fallback) {
  var eq;
  try {
    eq = Sys.parseEquation(text);
  } catch (err) {
    return { mode: "value", v: fallback || "x" };
  }
  var r = rowOf(eq);
  var hasX = !near0(r.x);
  var hasY = !near0(r.y);
  if (hasX && !hasY) return { mode: "value", v: "x" };
  if (hasY && !hasX) return { mode: "value", v: "y" };
  return { mode: "value", v: fallback || (hasY ? "y" : "x") };
}

function nextAction(Sys, Algebra, st, history) {
  if (!st || st.phase === "done") return null;
  var hist = history || [];

  if (st.phase === "pick_isolate") {
    var best = Sys.bestIsolateChoice(st.eq[0], st.eq[1]);
    if (!best) return { error: "אין משתנה שאפשר לבודד." };
    var start = st.eq[best.eqIndex];
    var alg = nextAlgebra(Sys, Algebra, start, { mode: "isolate", v: best.v });
    if (!alg || alg.error || !alg.eq) return alg || { error: "אין צעד בידוד." };
    var why = best.why ? best.why : "זה הבידוד הנוח כאן.";
    return {
      choice: { kind: "isolate", eqIndex: best.eqIndex, v: best.v },
      startEq: start,
      eq: alg.eq,
      reason: alg.reason,
      hint: "נוח לבודד את " + best.v + " במשוואה " + eqWord(best.eqIndex) + ": " + why + " " + alg.hint,
    };
  }

  if (st.phase === "work_isolate") {
    var curI = currentEq(st, hist);
    var algI = nextAlgebra(Sys, Algebra, curI, { mode: "isolate", v: st.wantVar || "x" });
    if (algI && algI.already) return null;
    return algI;
  }

  if (st.phase === "pick_sub" || (st.phase === "work_sub" && st.needSub)) {
    var isol = st.isol;
    var target = st.workTarget;
    var choice = null;
    if (st.phase === "pick_sub") {
      if (!isol && st.isolations && st.isolations.length) {
        var ready = Sys.bestReadySub(st.eq, st.isolations);
        if (!ready) return { error: "אין לאן להציב." };
        isol = ready.isol;
        target = ready.target;
        choice = { kind: "sub", from: ready.from, target: ready.target };
      } else if (isol) {
        var into = Sys.bestReadySub(st.eq, [isol]);
        if (!into) return { error: "אין לאן להציב." };
        target = into.target;
        choice = { kind: "sub", from: isol.from, target: into.target };
      } else {
        return { error: "אין ביטוי להצבה." };
      }
    }
    var host = st.eq[target];
    var subEq = substitutionText(Sys, isol, host);
    var chk = Sys.checkSubstituted(isol, host, subEq);
    if (!chk.ok) return { error: chk.message, eq: subEq };
    var expr = prose(isol.v + " = " + exprOf(Sys, isol));
    return {
      choice: choice,
      startEq: st.phase === "pick_sub" ? host : null,
      eq: subEq,
      reason: subReason(Sys, isol, target, chk),
      hint: "הציבו את " + expr + " במשוואה " + eqWord(target) + ".",
    };
  }

  if (st.phase === "work_sub") {
    var curS = currentEq(st, hist);
    var algS = nextAlgebra(Sys, Algebra, curS, solveGoal(Sys, curS, st.isol ? otherVar(st.isol.v) : "x"));
    if (algS && algS.already) return null;
    return algS;
  }

  if (st.phase === "pick_back" || (st.phase === "work_back" && st.needSub)) {
    if (!st.found) return { error: "אין עדיין ערך להצבה." };
    var back = st.phase === "pick_back" ? Sys.bestBackChoice(st.found, st.eq) : { target: st.workTarget, absA: null, need: otherVar(st.found.v) };
    if (!back) return { error: "אין משוואה להצבת הערך." };
    var backIsol = { v: st.found.v, rhs: { x: 0, y: 0, k: st.found.value }, from: -1 };
    var backHost = st.eq[back.target];
    var backEq = substitutionText(Sys, backIsol, backHost);
    var backChk = Sys.checkSubstituted(backIsol, backHost, backEq);
    if (!backChk.ok) return { error: backChk.message, eq: backEq };
    var foundExpr = prose(st.found.v + " = " + fmtPlain(Sys, st.found.value));
    var coefNote = back.absA != null ? " המקדם של " + back.need + " שם הוא " + prose(fmtPlain(Sys, back.absA)) + "." : "";
    return {
      choice: st.phase === "pick_back" ? { kind: "back", target: back.target } : null,
      startEq: st.phase === "pick_back" ? backHost : null,
      eq: backEq,
      reason: subReason(Sys, backIsol, back.target, backChk),
      hint: "הציבו את " + foundExpr + " במשוואה " + eqWord(back.target) + " כדי למצוא את " + otherVar(st.found.v) + "." + coefNote,
    };
  }

  if (st.phase === "work_back") {
    var curB = currentEq(st, hist);
    var algB = nextAlgebra(Sys, Algebra, curB, solveGoal(Sys, curB, st.found ? otherVar(st.found.v) : "x"));
    if (algB && algB.already) return null;
    return algB;
  }

  return null;
}

function varTermCount(terms) {
  var n = 0;
  var i;
  for (i = 0; i < terms.length; i++) if (terms[i].k !== "n") n += 1;
  return n;
}

function firstOfKind(terms, wantNum) {
  var i;
  for (i = 0; i < terms.length; i++) {
    if (wantNum ? terms[i].k === "n" : terms[i].k !== "n") return i;
  }
  return -1;
}

function arrangeMove(Sys, text) {
  var eq = Sys.parseEquation(text);
  var sides = listTerms(eq);
  var left = sides.left;
  var right = sides.right;
  var lv = varTermCount(left);
  var rv = varTermCount(right);
  var moved;
  var gather = false;
  if (lv > 0 && rv > 0) {
    var fromRight = rv <= lv;
    var src = fromRight ? right : left;
    moved = moveTerm(left, right, !fromRight, firstOfKind(src, false), false);
    gather = true;
  } else if (lv > 0 || rv > 0) {
    var onLeft = lv > 0;
    var host = onLeft ? left : right;
    var numAt = firstOfKind(host, true);
    if (numAt < 0) return null;
    moved = moveTerm(left, right, onLeft, numAt, false);
  } else {
    return null;
  }
  var next = formatEq(Sys, moved.left, moved.right);
  if (next === String(text).replace(/\s+/g, "")) return null;
  var label = termLabel(Sys, moved.term);
  var absLabel = termLabel(Sys, { k: moved.term.k, c: Math.abs(moved.term.c) });
  var hint;
  var reason;
  if (gather) {
    if (moved.term.c < 0) {
      hint = "הוסיפו " + absLabel + " לשני האגפים כדי לרכז את איברי " + moved.term.k + " באותו אגף.";
      reason = "הוספנו " + absLabel + " לשני האגפים כדי לרכז את איברי " + moved.term.k + " באותו אגף.";
    } else {
      hint = "החסירו " + absLabel + " משני האגפים כדי לרכז את איברי " + moved.term.k + " באותו אגף.";
      reason = "החסרנו " + absLabel + " משני האגפים כדי לרכז את איברי " + moved.term.k + " באותו אגף.";
    }
  } else {
    hint = "המספר " + label + " נמצא יחד עם המשתנים. העבירו אותו לאגף השני. עדיין בלי לחשב.";
    reason = "העברנו את " + label + " לאגף השני והחלפנו סימן.";
  }
  return { eq: next, hint: hint, reason: reason };
}

function arrangeStep(Sys, text) {
  if (Sys.equationStatus(text).ready) return { already: true };
  if (typeof Sys.numericDenomStep === "function") {
    var denom = Sys.numericDenomStep(text);
    if (denom && denom.eq) return withTerminal(Sys, text, denom);
  }
  var mixed = mixedNumberStep(text);
  if (mixed) return withTerminal(Sys, text, mixed);
  var expanded = expandStep(Sys, text);
  if (expanded) return withTerminal(Sys, text, expanded);
  var product = productStep(Sys, text);
  if (product) return withTerminal(Sys, text, product);
  var combined = combineStep(Sys, text);
  if (combined) {
    var raw = String(text);
    var xs = (raw.match(/x/gi) || []).length;
    var ys = (raw.match(/y/gi) || []).length;
    if (xs > 1 && ys <= 1) combined.hint = "כנסו את איברי x שנמצאים באותו אגף.";
    else if (ys > 1 && xs <= 1) combined.hint = "כנסו את איברי y שנמצאים באותו אגף.";
    else combined.hint = "כנסו איברים דומים שנמצאים באותו אגף.";
    return withTerminal(Sys, text, combined);
  }
  var moved = arrangeMove(Sys, text);
  if (moved) return withTerminal(Sys, text, moved);
  return { error: "אין צעד סידור ל־" + text };
}

module.exports = {
  nextAction: nextAction,
  nextAlgebra: nextAlgebra,
  arrangeStep: arrangeStep,
};
