"use strict";

var handleMixed = require("./quad-mixed").handleMixed;
var handleFormula = require("./quad-formula").handleFormula;

function createQuadIneqHandler(engine) {
  var Q = engine.DoctematicaQuadratic;
  var M = engine.DoctematicaFnModel;

  function pretty(s) {
    return String(s || "").replace(/-/g, "−").replace(/<=/g, "≤").replace(/>=/g, "≥");
  }

  function ascii(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/²/g, "^2")
      .replace(/[×·]/g, "*")
      .replace(/\s+/g, "");
  }

  function splitRel(text) {
    var s = ascii(text);
    var m = s.match(/^(.*?)(<=|>=|<|>)(.*)$/);
    if (!m || !m[1] || m[3] == null || m[3] === "") return null;
    return { left: m[1], rel: m[2], right: m[3] };
  }

  function sqrtParts(n) {
    n = Math.round(Number(n));
    if (n < 0) return null;
    var coef = 1;
    var rest = n;
    var p = 2;
    while (p * p <= rest) {
      while (rest % (p * p) === 0) {
        coef *= p;
        rest /= p * p;
      }
      p += 1;
    }
    return { coef: coef, rest: rest };
  }

  function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function radicalText(a, b, c, value) {
    var D = b * b - 4 * a * c;
    var parts = sqrtParts(D);
    if (!parts || parts.rest <= 1) return null;
    var den0 = 2 * a;
    var signs = [1, -1];
    var i;
    for (i = 0; i < signs.length; i++) {
      var sign = signs[i];
      var num = -b;
      var coef = sign * parts.coef;
      var den = den0;
      var g = gcd(gcd(num, coef), den);
      num /= g;
      coef /= g;
      den /= g;
      if (den < 0) {
        num = -num;
        coef = -coef;
        den = -den;
      }
      var numeric = (num + coef * Math.sqrt(parts.rest)) / den;
      if (Math.abs(numeric - value) > 1e-6) continue;
      var rad = (Math.abs(coef) === 1 ? "" : String(Math.abs(coef))) + "√" + parts.rest;
      var body;
      if (num === 0) body = (coef < 0 ? "−" : "") + rad;
      else body = String(num).replace("-", "−") + (coef < 0 ? "−" : "+") + rad;
      if (den === 1) return body;
      return "(" + body + ")/" + den;
    }
    return null;
  }

  function rootLabel(a, b, c, value) {
    var analyzed = Q.analyze(a, b, c);
    var i;
    if (analyzed && analyzed.roots) {
      for (i = 0; i < analyzed.roots.length; i++) {
        var fr = analyzed.roots[i];
        if (Math.abs(fr.n / fr.d - value) < 1e-6) return pretty(Q.fmt(fr));
      }
    }
    var rad = radicalText(a, b, c, value);
    if (rad) return rad;
    if (Math.abs(value - Math.round(value)) < 1e-8) return String(Math.round(value)).replace("-", "−");
    return String(Math.round(value * 1000) / 1000).replace("-", "−");
  }

  function modelOf(text, original) {
    var norm = String(text || "").trim();
    var parts = splitRel(norm);
    if (!parts) return null;
    if (!standardWritten(norm)) {
      return {
        pendingNormalize: true,
        normalizationRequired: true,
        normalized: false,
        original: pretty(original || norm),
        rel: parts.rel,
      };
    }
    var expr = ascii(parts.right) === "0" ? parts.left : parts.right;
    var rel = ascii(parts.right) === "0" ? parts.rel : flipRel(parts.rel);
    parts = { left: expr, rel: rel, right: "0" };
    var fn = M.analyze(parts.left);
    if (!fn || fn.degree !== 2) return null;
    var roots = (fn.roots || []).slice().sort(function (p, q) { return p - q; });
    var uniq = [];
    roots.forEach(function (r) {
      if (!uniq.some(function (u) { return Math.abs(u - r) < 1e-8; })) uniq.push(r);
    });
    var labels = uniq.map(function (r) { return { value: r, text: rootLabel(fn.a, fn.b, fn.c, r) }; });
    var regions = openRegions(uniq).map(function (reg, index) {
      var sample = pickTest(reg.from, reg.to);
      var value = M.evalAt(fn, sample);
      var sign = Math.abs(value) < 1e-8 ? "zero" : value > 0 ? "pos" : "neg";
      return {
        index: index,
        from: reg.from,
        to: reg.to,
        sign: sign,
        sample: sample,
        label: regionLabel(reg.from, reg.to, labels),
      };
    });
    var solution = solutionFrom(regions, uniq, parts.rel);
    return {
      original: pretty(original || norm),
      normalizedForm: pretty(norm),
      normalizationRequired: ascii(original || norm) !== ascii(norm),
      normalized: true,
      expr: parts.left,
      rel: parts.rel,
      fn: fn,
      zeroEq: parts.left + "=0",
      roots: uniq,
      rootCount: uniq.length,
      rootMultiplicity: uniq.length === 1 ? 2 : 1,
      criticalPoints: labels,
      labels: labels,
      regions: regions,
      regionSigns: regions.map(function (reg) { return reg.sign; }),
      solution: solution,
      solutionSet: solution,
      answer: formatSet(solution, labels),
    };
  }

  function openRegions(roots) {
    if (!roots.length) return [{ from: "-inf", to: "inf" }];
    var out = [{ from: "-inf", to: roots[0] }];
    var i;
    for (i = 0; i < roots.length - 1; i++) out.push({ from: roots[i], to: roots[i + 1] });
    out.push({ from: roots[roots.length - 1], to: "inf" });
    return out;
  }

  function labelOf(value, labels) {
    var i;
    for (i = 0; i < labels.length; i++) {
      if (Math.abs(labels[i].value - value) < 1e-6) return labels[i].text;
    }
    return String(value);
  }

  function regionLabel(from, to, labels) {
    if (from === "-inf" && to === "inf") return "כל x";
    if (from === "-inf") return "x < " + labelOf(to, labels);
    if (to === "inf") return "x > " + labelOf(from, labels);
    return labelOf(from, labels) + " < x < " + labelOf(to, labels);
  }

  function pickTest(from, to) {
    if (from === "-inf" && to === "inf") return 0;
    if (from !== "-inf" && to !== "inf") {
      var n = Math.floor(from) + 1;
      if (n < to - 1e-9) return n;
      return (Number(from) + Number(to)) / 2;
    }
    if (to !== "inf") {
      var left = Math.floor(Number(to)) - 1;
      if (left >= to) left = Number(to) - 1;
      return left;
    }
    var right = Math.ceil(Number(from)) + 1;
    if (right <= from) right = Number(from) + 1;
    return right;
  }

  function standardWritten(text) {
    var parts = splitRel(text);
    if (!parts) return false;
    var left0 = ascii(parts.left) === "0";
    var right0 = ascii(parts.right) === "0";
    if (left0 === right0) return false;
    var side = right0 ? parts.left : parts.right;
    if (/[()]/.test(side)) return false;
    var fn = M.analyze(side);
    return !!(fn && fn.degree === 2);
  }

  function workIneq(text) {
    var parts = splitRel(text);
    if (!parts) return false;
    return /x\^2|x²/.test(ascii(text));
  }

  function latestIneq(body, start) {
    var hist = (body && body.history) || [];
    var i;
    for (i = hist.length - 1; i >= 0; i--) {
      if (workIneq(hist[i])) return String(hist[i]);
    }
    return start;
  }

  function sidePoly(expr) {
    var fn = M.analyze(expr);
    if (!fn) return null;
    return { a: fn.a, b: fn.b, c: fn.c };
  }

  function ineqPoly(text) {
    var parts = splitRel(text);
    if (!parts) return null;
    var left = sidePoly(parts.left);
    var right = sidePoly(parts.right);
    if (!left || !right) return null;
    return { a: left.a - right.a, b: left.b - right.b, c: left.c - right.c };
  }

  function eqPoly(eq) {
    var s = ascii(eq);
    var i = s.indexOf("=");
    if (i < 0) return null;
    return ineqPoly(s.slice(0, i) + "<=" + s.slice(i + 1));
  }

  function scaleOf(prev, next) {
    function ratio(a, b) {
      if (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9) return null;
      if (Math.abs(a) < 1e-9) return NaN;
      return b / a;
    }
    var ks = [ratio(prev.a, next.a), ratio(prev.b, next.b), ratio(prev.c, next.c)].filter(function (k) { return k != null; });
    if (!ks.length) return 1;
    var k = ks[0];
    if (ks.some(function (x) { return !(Math.abs(x - k) < 1e-6); })) return NaN;
    return k;
  }

  function fromEq(eq, rel) {
    var s = String(eq || "");
    var i = s.indexOf("=");
    if (i < 0) return s;
    return s.slice(0, i) + rel + s.slice(i + 1);
  }

  function restoreRel(prevText, nextEq) {
    var rel = relOf(prevText);
    var prev = ineqPoly(prevText);
    var next = eqPoly(nextEq);
    var k = prev && next ? scaleOf(prev, next) : 1;
    if (k < -1e-8) rel = flipRel(rel);
    return fromEq(nextEq, rel);
  }

  function relOf(text) {
    var parts = splitRel(text);
    return parts ? parts.rel : "";
  }

  function toEq(text) {
    var parts = splitRel(text);
    if (!parts) return "";
    return parts.left + "=" + parts.right;
  }

  function normalizeStep(text) {
    if (standardWritten(text)) return null;
    var eq = toEq(text);
    if (!eq) return null;
    var pack = Q.analyzeMixedStart(eq);
    var nxt = Q.nextMixedStep(eq, pack);
    if (!nxt || !nxt.eq) return null;
    return {
      eq: pretty(restoreRel(text, nxt.eq)),
      explain: nxt.explain || "מסדרים את אי־השוויון כך שבאגף אחד 0.",
    };
  }

  function wantSign(rel) {
    return rel === ">" || rel === ">=" ? "pos" : "neg";
  }

  function includeRoots(rel) {
    return rel === ">=" || rel === "<=";
  }

  function solutionFrom(regions, roots, rel) {
    var want = wantSign(rel);
    var pieces = [];
    regions.forEach(function (reg) {
      if (reg.sign !== want) return;
      if (reg.from === "-inf" && reg.to === "inf") {
        pieces.push({ from: "-inf", to: "inf", fromIncluded: false, toIncluded: false, all: true });
        return;
      }
      pieces.push({ from: reg.from, to: reg.to, fromIncluded: false, toIncluded: false });
    });
    if (includeRoots(rel)) {
      roots.forEach(function (r) {
        pieces.push({ from: r, to: r, fromIncluded: true, toIncluded: true, point: true });
      });
    }
    return M.combineIntervals(pieces, "union");
  }

  function formatBound(value, labels) {
    if (value === "inf") return "∞";
    if (value === "-inf") return "−∞";
    return labelOf(value, labels);
  }

  function formatOne(iv, labels) {
    if (!iv || iv.empty) return "אין פתרון";
    if (iv.all || (iv.from === "-inf" && iv.to === "inf")) return "כל x";
    if (iv.point || (typeof iv.from === "number" && iv.from === iv.to)) return "x = " + formatBound(iv.from, labels);
    var lo = iv.from !== "-inf";
    var hi = iv.to !== "inf";
    if (lo && hi) {
      return formatBound(iv.from, labels) + (iv.fromIncluded ? " ≤ " : " < ") + "x" + (iv.toIncluded ? " ≤ " : " < ") + formatBound(iv.to, labels);
    }
    if (lo) return "x " + (iv.fromIncluded ? "≥ " : "> ") + formatBound(iv.from, labels);
    return "x " + (iv.toIncluded ? "≤ " : "< ") + formatBound(iv.to, labels);
  }

  function formatSet(list, labels) {
    if (!list || !list.length) return "אין פתרון";
    if (list.length === 1 && (list[0].all || (list[0].from === "-inf" && list[0].to === "inf"))) return "כל x";
    return list.map(function (iv) { return formatOne(iv, labels); }).join(" או ");
  }

  function numerify(text) {
    return String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/²/g, "^2")
      .replace(/√\(?(\d+)\)?/g, function (_, n) {
        return "(" + String(Math.sqrt(Number(n))) + ")";
      });
  }

  function parseSet(text) {
    var raw = String(text || "").trim();
    if (!raw) return null;
    var parsed = M.parseRegionList(numerify(raw));
    if (parsed) return parsed;
    if (M.parseRegionList(raw)) return M.parseRegionList(raw);
    return null;
  }

  function sameSet(student, expected) {
    if (!student || !expected) return false;
    if (!student.length && !expected.length) return true;
    return M.sameIntervalSet(student, expected);
  }

  function flipRel(rel) {
    if (rel === "<") return ">";
    if (rel === ">") return "<";
    if (rel === "<=") return ">=";
    if (rel === ">=") return "<=";
    return rel;
  }

  function strictRel(rel) {
    if (rel === "<=") return "<";
    if (rel === ">=") return ">";
    if (rel === "<") return "<=";
    if (rel === ">") return ">=";
    return rel;
  }

  function samePoly(a, b) {
    var pa;
    var pb;
    try {
      pa = Q.parseABC(ascii(a));
      pb = Q.parseABC(ascii(b));
    } catch (err) {
      return false;
    }
    if (!pa || !pb) return false;
    return Math.abs(pa.a - pb.a) < 1e-8 && Math.abs(pa.b - pb.b) < 1e-8 && Math.abs(pa.c - pb.c) < 1e-8;
  }

  function equationLines(history, zeroEq) {
    var lines = history || [];
    var start = -1;
    var i;
    var z = ascii(zeroEq);
    var left = z.split("=")[0];
    for (i = 0; i < lines.length; i++) {
      var t = ascii(lines[i]);
      if (/[<>]/.test(t)) continue;
      if (t === z || t === "0=" + left) {
        start = i;
        break;
      }
    }
    if (start < 0) return [];
    var out = [zeroEq];
    for (i = start + 1; i < lines.length; i++) {
      if (looksLikeSolution(lines[i])) break;
      out.push(String(lines[i]));
    }
    return out;
  }

  function looksLikeSolution(text) {
    var t = ascii(text);
    if (/[<>]/.test(t)) return true;
    return /אין|כל|ℝ|∅/.test(String(text || ""));
  }

  function proxyMixed(body, model) {
    var raw = body.history || [];
    var hist = equationLines(raw, model.zeroEq);
    if (!hist.length) hist = [model.zeroEq];
    hist = includeProduct(hist, raw, model);
    var res = handleMixed(engine, {
      intent: body.intent,
      start: model.zeroEq,
      history: hist,
      previous: hist[hist.length - 1],
      typed: body.typed,
      phase: body.phase,
      letter: body.letter,
      slots: body.slots,
      root: body.root,
      compute: body.compute,
      picked: body.picked,
      md53: body.md53,
      factor: body.factor,
      domain: body.domain,
    });
    if (String(body.intent || "") === "hint") {
      var hinted = sqrtEngineNext(hist[hist.length - 1]);
      if (hinted) res = Object.assign({}, res, { hint: hinted.reason || hinted.hint || res.hint });
      return res;
    }
    if (String(body.intent || "") !== "one-step") return res;
    res = keepParabola(res, hist, body);
    if (res && res.split && !res.step) {
      var prod = matchingProduct(hist[hist.length - 1], model);
      var written = prod && nextFactorEquation(prod, raw);
      if (written) return written;
    }
    return applySqrtEngine(res, hist[hist.length - 1]);
  }

  function sqrtEngineNext(cur) {
    var Q = engine.DoctematicaQuadratic;
    var parsed = null;
    try {
      parsed = Q.parseABC(String(cur || ""));
    } catch (err) {
      parsed = null;
    }
    if (!parsed || Math.abs(parsed.b) > 1e-6 || Math.abs(parsed.a) < 1e-8 || Math.abs(parsed.c) < 1e-8) return null;
    if (Q.isRootAnswerText && Q.isRootAnswerText(cur)) return null;
    var out = null;
    try {
      out = require("./quadratic").createQuadraticHandler(engine).handle({
        subtopic: "sqrt",
        intent: "one-step",
        start: String(cur),
        history: [String(cur)],
        previous: String(cur),
      });
    } catch (errSq) {
      return null;
    }
    if (!out || !out.ok || !out.step) return null;
    return out;
  }

  function applySqrtEngine(res, cur) {
    var via = sqrtEngineNext(cur);
    if (!via) return res;
    var next = Object.assign({}, res || { ok: true });
    next.ok = true;
    next.step = via.step;
    next.reason = via.reason || "";
    next.hint = via.hint || next.hint || "";
    next.path = null;
    next.enter = null;
    next.solved = !!via.solved;
    return next;
  }

  function includeProduct(hist, raw, model) {
    var i;
    var j;
    for (i = 0; i < raw.length; i++) {
      if (!matchingProduct(raw[i], model)) continue;
      var seen = hist.some(function (line) { return ascii(line) === ascii(raw[i]); });
      if (!seen) hist.push(String(raw[i]));
      for (j = i + 1; j < raw.length; j++) {
        if (looksLikeSolution(raw[j])) break;
        if (hist.some(function (line) { return ascii(line) === ascii(raw[j]); })) continue;
        hist.push(String(raw[j]));
      }
      break;
    }
    return hist;
  }

  function keepParabola(res, hist, body) {
    if (!res || !res.step || res.path === "factor" || res.enter === "factor") return res;
    var prev = hist[hist.length - 1];
    if (!negativeMultiple(prev, res.step) || !Q.isStandardZero(prev)) return res;
    return handleMixed(engine, {
      intent: "formula-enter",
      start: prev,
      history: hist,
      previous: prev,
      md53: !!(body && body.md53),
    });
  }

  function negativeMultiple(prev, next) {
    var p;
    var n;
    try {
      p = Q.parseABC(prev);
      n = Q.parseABC(next);
    } catch (err) {
      return false;
    }
    if (!p || !n || !p.a || !n.a) return false;
    var k = p.a / n.a;
    if (!isFinite(k) || k >= -1e-8) return false;
    return Math.abs(p.b - k * n.b) < 1e-6 && Math.abs(p.c - k * n.c) < 1e-6;
  }

  function wrapMixed(res, model) {
    if (!res || typeof res !== "object") return res;
    var out = Object.assign({}, res);
    out.phase = "equation";
    if (out.step) {
      try {
        var prodStep = Q.parseProductEq(out.step);
        if (prodStep && prodStep.f1 && prodStep.f2) out.canSplit = true;
      } catch (errProd) {}
    }
    if (out.solved) {
      out.solved = false;
      out.rootsFound = true;
      out.phase = "signs";
      out.roots = model.labels;
      out.regions = model.regions.map(function (reg) { return { index: reg.index, label: reg.label }; });
      var tail = model.rootCount === 0
        ? " למשוואה אין נקודות אפס ממשיות. עכשיו בודקים את סימן הביטוי. זה עדיין לא אומר שאין פתרון לאי־שוויון."
        : model.rootCount === 1
          ? " יש נקודת אפס אחת. היא מחלקת את הישר לשני תחומים."
          : " מצאתם את נקודות האפס. עכשיו אפשר לכתוב את הפתרון, לשרטט פרבולה, או לבדוק סימנים.";
      out.message = (out.message || "") + tail;
      if (out.reason) out.reason = out.reason + tail;
    }
    return out;
  }

  function matchingProduct(typed, model) {
    var prod;
    try {
      prod = Q.parseProductEq(typed);
    } catch (err) {
      return null;
    }
    if (!prod || !prod.f1 || !prod.f2) return null;
    var A = prod.f1.a * prod.f2.a;
    var B = prod.f1.a * prod.f2.b + prod.f1.b * prod.f2.a;
    var C = prod.f1.b * prod.f2.b;
    var a = model.fn.a;
    var b = model.fn.b;
    var c = model.fn.c;
    if (Math.abs(A) < 1e-8) return null;
    if (Math.abs(A * b - B * a) > 1e-4) return null;
    if (Math.abs(A * c - C * a) > 1e-4) return null;
    return prod;
  }

  function statedRoots(history, model) {
    if (!model.roots.length) return false;
    var hit = {};
    (history || []).forEach(function (line) {
      var iv = M.parseInterval(String(line || ""));
      if (!iv || !iv.point) return;
      model.roots.forEach(function (r, index) {
        if (Math.abs(iv.from - r) < 1e-6) hit[index] = true;
      });
    });
    return model.roots.every(function (_, index) { return hit[index]; });
  }

  function rootsFound(body, model) {
    if (body && body.rootsDone) return true;
    if (statedRoots(body.history || [], model)) return true;
    var hist = equationLines(body.history || [], model.zeroEq);
    if (hist.length < 2) return false;
    var i;
    for (i = 1; i < hist.length; i++) {
      var res = handleMixed(engine, {
        intent: "check",
        start: model.zeroEq,
        history: hist.slice(0, i),
        typed: hist[i],
      });
      if (res && res.solved) return true;
    }
    return false;
  }

  function progress(message, extra) {
    var out = { ok: true, solved: false, message: message, reason: message };
    if (extra) Object.keys(extra).forEach(function (key) { out[key] = extra[key]; });
    return out;
  }

  function fail(errorId, message, extra) {
    var out = { ok: false, errorId: errorId, message: message };
    if (extra) Object.keys(extra).forEach(function (key) { out[key] = extra[key]; });
    return out;
  }

  function signWord(rel) {
    return wantSign(rel) === "pos" ? "חיובי" : "שלילי";
  }

  function isAllSet(list) {
    return !!(list && list.length === 1 && (list[0].all || (list[0].from === "-inf" && list[0].to === "inf")));
  }

  function isEmptySet(list) {
    return !list || !list.length;
  }

  function isSingleton(list) {
    return !!(list && list.length === 1 && (list[0].point || (typeof list[0].from === "number" && list[0].from === list[0].to)));
  }

  function signEvidence(body) {
    var rows = (body && body.sign && body.sign.regions) || [];
    if (rows.some(function (row) { return signCode(row && row.sign); })) return true;
    return ((body && body.history) || []).some(function (line) {
      return /נבדוק את סימן|חיובי|שלילי/.test(String(line || ""));
    });
  }

  function mergeAnswerRegions(got, solution, body) {
    var M = engine.DoctematicaFnModel;
    if (!M || !M.parseRegionList || !solution || solution.length < 2) return got;
    var bag = [];
    function keep(iv) {
      if (!bag.some(function (have) { return M.sameInterval(have, iv); })) bag.push(iv);
    }
    (got || []).forEach(keep);
    ((body && body.history) || []).forEach(function (line) {
      var list = M.parseRegionList(String(line || ""));
      if (!list || !list.length) return;
      list.forEach(function (iv) {
        if (solution.some(function (want) { return M.sameInterval(iv, want); })) keep(iv);
      });
    });
    return bag;
  }

  function judgeAnswer(typed, model, body) {
    var signSnap = body && body.sign;
    var got = parseSet(typed);
    if (!got) return null;
    if (sameSet(got, model.solution)) {
      if (model.rootCount === 0 && (isAllSet(got) || isEmptySet(got)) && !signEvidence(body)) {
        return fail("noRootsMeansNoSolution", "למשוואה אין נקודות אפס ממשיות, אבל אנחנו פותרים אי־שוויון. עדיין צריך לבדוק האם הביטוי חיובי או שלילי.");
      }
      return progress("זהו הפתרון: " + model.answer + ".", { solved: true, answer: model.answer });
    }
    var withEarlier = mergeAnswerRegions(got, model.solution, body);
    if (withEarlier && sameSet(withEarlier, model.solution)) {
      return progress("זהו הפתרון: " + model.answer + ".", { solved: true, answer: model.answer });
    }
    if (isSingleton(model.solution) && isAllSet(got)) {
      return fail("allRealsInsteadOfSingleton", "הביטוי שווה ל־0 רק בנקודת האפס. הפתרון הוא הנקודה הזאת, לא כל x.");
    }
    if (isSingleton(model.solution) && isEmptySet(got)) {
      return fail("emptySetInsteadOfSingleton", "בנקודת האפס הביטוי שווה ל־0, והסימן כולל שוויון. הנקודה הזאת כן פתרון.");
    }
    if (isAllSet(model.solution) && isSingleton(got)) {
      return fail("singletonInsteadOfAllReals", "נקודת האפס מתאימה, אבל הסימן משני הצדדים מתאים גם הוא. בדקו אם הפתרון הוא רק הנקודה.");
    }
    if (model.rootCount === 0 && isEmptySet(got) && !isEmptySet(model.solution)) {
      return fail("noRootsMeansNoSolution", "למשוואה אין נקודות אפס ממשיות, אבל אנחנו פותרים אי־שוויון. עדיין צריך לבדוק האם הביטוי חיובי או שלילי.");
    }
    var closed = solutionFrom(model.regions, model.roots, strictRel(model.rel));
    if (sameSet(got, closed) && !sameSet(closed, model.solution)) {
      if (includeRoots(model.rel)) {
        return fail("missingEqualityRoot", "מצאת נכון את התחום שבו הביטוי " + signWord(model.rel) + ", אבל הסימן " + pretty(model.rel) + " כולל גם את המקומות שבהם הביטוי שווה ל־0. בדוק את נקודות האפס.");
      }
      return fail("includedRootForStrictInequality", "הסימן " + pretty(model.rel) + " אינו כולל את נקודות האפס.");
    }
    var opposite = solutionFrom(model.regions, model.roots, flipRel(model.rel));
    if (sameSet(got, opposite) && !sameSet(opposite, model.solution)) {
      var marked = signSnap && signsMatch(signSnap, model);
      if (marked) {
        return fail(
          "wrongRegions",
          "קבעת נכון את סימן הפונקציה בכל תחום, אבל השאלה מבקשת את המקומות שבהם הביטוי " + (wantSign(model.rel) === "neg" ? "קטן מ־0" : "גדול מ־0") + ". בחר את התחומים שסומנו ב" + (wantSign(model.rel) === "neg" ? "שלילי" : "חיובי") + "."
        );
      }
      return fail(
        "wrongRegions",
        "זה התחום שבו הביטוי " + (wantSign(model.rel) === "neg" ? "חיובי" : "שלילי") + ". השאלה מבקשת את המקומות שבהם הביטוי " + signWord(model.rel) + "."
      );
    }
    if (model.rootCount === 1 && got.length === 1 && !isSingleton(got) && !isAllSet(got)) {
      var ray = got[0];
      var root = model.roots[0];
      var hitsRoot = (typeof ray.from === "number" && Math.abs(ray.from - root) < 1e-6) || (typeof ray.to === "number" && Math.abs(ray.to - root) < 1e-6);
      if (hitsRoot) {
        return fail("signFlippedAcrossDoubleRoot", "זו נקודת אפס כפולה. הפרבולה נוגעת בציר ואינה חוצה אותו, ולכן הסימן משני הצדדים נשאר אותו סימן.");
      }
    }
    if (model.rootCount === 1) {
      var bounds = [];
      got.forEach(function (iv) {
        if (typeof iv.from === "number") bounds.push(iv.from);
        if (typeof iv.to === "number" && (typeof iv.from !== "number" || Math.abs(iv.from - iv.to) > 1e-8)) bounds.push(iv.to);
      });
      var distinct = [];
      bounds.forEach(function (b) {
        if (!distinct.some(function (u) { return Math.abs(u - b) < 1e-6; })) distinct.push(b);
      });
      if (distinct.length > 1) {
        return fail("doubleRootTreatedAsTwoRoots", "יש רק נקודת אפס אחת. שורש כפול אינו שתי נקודות שונות.");
      }
    }
    if (model.solution.length > 1 && got.length && got.length < model.solution.length) {
      var used = {};
      var allHit = got.every(function (piece) {
        var j;
        for (j = 0; j < model.solution.length; j++) {
          if (used[j]) continue;
          if (M.sameInterval(piece, model.solution[j])) {
            used[j] = true;
            return true;
          }
        }
        return false;
      });
      if (allHit) return progress("התחום נכון. יש עוד תחום.");
    }
    var bounds = [];
    got.forEach(function (iv) {
      if (typeof iv.from === "number") bounds.push(iv.from);
      if (typeof iv.to === "number") bounds.push(iv.to);
    });
    if (bounds.length && bounds.some(function (b) {
      return !model.roots.some(function (r) { return Math.abs(r - b) < 1e-6; });
    })) {
      return fail("wrongRoots", "הגבולות אינם נקודות האפס של הביטוי.");
    }
    return fail("wrongRegions", "התחום אינו מתאים לסימן המבוקש.");
  }

  function signsMatch(snap, model) {
    var rows = (snap && snap.regions) || [];
    if (rows.length < model.regions.length) return false;
    return model.regions.every(function (reg) {
      var row = rows[reg.index] || {};
      var mark = signCode(row.sign);
      return mark && mark === (reg.sign === "pos" ? "+" : reg.sign === "neg" ? "-" : "0");
    });
  }

  function signCode(text) {
    var t = String(text || "").trim();
    if (t === "+" || t === "חיובי") return "+";
    if (t === "-" || t === "−" || t === "שלילי") return "-";
    if (t === "0" || t === "אפס") return "0";
    return "";
  }

  function inRegion(x, reg) {
    if (reg.from !== "-inf" && !(x > reg.from + 1e-9)) return false;
    if (reg.to !== "inf" && !(x < reg.to - 1e-9)) return false;
    return true;
  }

  function isRoot(x, model) {
    return model.roots.some(function (r) { return Math.abs(r - x) < 1e-8; });
  }

  function evalStudent(text) {
    try {
      return Q.evalExpr(ascii(text).replace(/√\(?(\d+)\)?/g, function (_, n) { return "(" + Math.sqrt(Number(n)) + ")"; }));
    } catch (err) {
      return null;
    }
  }

  function numOf(text) {
    var t = ascii(text);
    if (!t) return NaN;
    if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
    var wrapped = t.match(/^-\((\d+)\/(\d+)\)$/);
    if (wrapped && Number(wrapped[2])) return -Number(wrapped[1]) / Number(wrapped[2]);
    var m = t.match(/^(-?)(\d+)\/(\d+)$/);
    if (m && Number(m[3])) return (m[1] ? -1 : 1) * Number(m[2]) / Number(m[3]);
    return NaN;
  }

  function boundNum(value) {
    if (value == null || value === "" || value === "-inf" || value === "inf") return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  function checkSign(body, model) {
    var row = body.signRow || {};
    var field = String(row.field || "");
    var sample = readSample(row, model);
    if (sample.error) return sample.error;
    var want = sample.want;
    if (field === "x") {
      return progress("המספר נמצא בתחום. אפשר להציב אותו בביטוי, או לחשב ישר את הערך.", { phase: "signs", field: "x" });
    }
    var expr = String(row.expr || "").trim();
    var exprOk = false;
    if (field === "expr" || (!field && expr)) {
      if (!expr) return fail("signPlug", "מציבים את המספר בביטוי, ואז לוחצים אנטר.", { field: "expr" });
      var gotExpr = evalStudent(expr);
      if (gotExpr == null || Math.abs(gotExpr - want) > 1e-6) {
        return fail("signPlug", "ההצבה אינה מתאימה למספר שנבחר.", { field: "expr" });
      }
      exprOk = true;
      if (field === "expr") {
        return progress("ההצבה נכונה. עכשיו מחשבים את הערך.", { phase: "signs", field: "expr" });
      }
    }
    var valueText = String(row.value || "").trim();
    if (!valueText) {
      if (field === "value" || field === "sign") {
        return fail("signCalc", "מחשבים את ערך הביטוי, ואז לוחצים אנטר.", { field: "value" });
      }
      return progress(expr ? "ההצבה נכונה. עכשיו מחשבים את הערך." : "מחשבים את ערך הביטוי במספר שנבחר.", { phase: "signs", field: "value" });
    }
    var gotVal = evalStudent(valueText);
    if (gotVal == null || Math.abs(gotVal - want) > 1e-6) {
      return fail("signCalc", exprOk ? "ההצבה נכונה, אבל יש טעות בחישוב." : "התוצאה אינה מתאימה למספר שנבחר.", { field: "value" });
    }
    if (field === "value") {
      return progress("התוצאה נכונה. עכשיו מסמנים אם היא חיובית או שלילית.", { phase: "signs", field: "value" });
    }
    var wantMark = want > 1e-8 ? "+" : want < -1e-8 ? "-" : "0";
    var mark = signCode(row.sign);
    var word = wantMark === "+" ? "חיובית" : wantMark === "-" ? "שלילית" : "אפס";
    var signWordHe = wantMark === "+" ? "חיובי" : wantMark === "-" ? "שלילי" : "אפס";
    if (!mark) return progress("התוצאה " + word + ". מסמנים את הסימן.", { phase: "signs", field: "sign" });
    if (mark !== wantMark) return fail("signWrong", "החישוב נכון, אבל הסימן אינו מתאים לתוצאה.", { field: "sign" });
    return progress("התוצאה " + word + ", ולכן הביטוי " + signWordHe + " בכל התחום הזה.", { phase: "signs", field: "sign" });
  }

  function readSample(row, model) {
    var x = numOf(row.x);
    if (!isFinite(x)) return { error: fail("signPoint", "כותבים מספר מתוך התחום, ואז לוחצים אנטר.", { field: "x" }) };
    if (isRoot(x, model)) {
      return { error: fail("signRoot", "זו נקודת אפס של הפונקציה. כדי לבדוק את הסימן בתחום, בוחרים מספר שנמצא בתוך התחום ולא על נקודת הגבול.", { field: "x" }) };
    }
    var lo = boundNum(row.from);
    var hi = boundNum(row.to);
    var hasZone = row.from != null || row.to != null;
    if (hasZone) {
      if (lo != null && hi != null && lo > hi + 1e-8) {
        return { error: fail("parabolaOrder", "המספר הקטן צריך להיות משמאל למספר הגדול על הציר.", { field: "x" }) };
      }
      if (lo != null && !(x > lo + 1e-9)) {
        return { error: fail("signOutside", "המספר אינו נמצא בתחום הזה. בוחרים מספר גדול מ־" + (row.fromText || pretty(String(row.from))) + ".", { field: "x" }) };
      }
      if (hi != null && !(x < hi - 1e-9)) {
        return { error: fail("signOutside", "המספר אינו נמצא בתחום הזה. בוחרים מספר קטן מ־" + (row.toText || pretty(String(row.to))) + ".", { field: "x" }) };
      }
    } else {
      var reg = model.regions[Number(row.index)];
      if (!reg) return { error: fail("signRegion", "בוחרים תחום לבדיקה.", { field: "x" }) };
      if (!inRegion(x, reg)) {
        return { error: fail("signOutside", "המספר אינו נמצא בתחום הזה. בוחרים מספר בתחום " + reg.label + ".", { field: "x" }) };
      }
    }
    return { x: x, want: M.evalAt(model.fn, x) };
  }

  function checkParabola(body, model) {
    var drawing = body.parabola || {};
    var marks = (drawing.marks || []).map(function (mark) {
      return { value: Number(mark.value), pos: Number(mark.pos), x: Number(mark.x) };
    });
    var stroke = drawing.stroke || [];
    if (stroke.length >= 8) return checkDrawnParabola(stroke, marks, model);
    if (marks.length) return fail("parabolaEmpty", "לחצו «פרבולה» וציירו את הקו בעצמכם. אם סימנתם נקודות אפס, הפרבולה צריכה לעבור בהן.");
    return fail("parabolaEmpty", "לחצו «פרבולה» וציירו את הקו על הציר.");
  }

  function checkDrawnParabola(stroke, marks, model) {
    var pts = stroke.filter(function (p) { return p && isFinite(Number(p.x)) && isFinite(Number(p.above)); });
    if (pts.length < 8) return fail("parabolaEmpty", "ציירו קו ארוך יותר, קשת אחת של פרבולה.");
    var expect = model.fn.a > 0 ? "up" : "down";
    var open = strokeOpening(pts);
    if (!open) return fail("parabolaShape", "הקו לא נראה כמו פרבולה. ציירו קשת אחת, עם זרועות למעלה או למטה.");
    if (open !== expect) {
      return fail(
        "parabolaDirection",
        model.fn.a > 0
          ? "המקדם של x² חיובי, ולכן הפרבולה צריכה להיות פתוחה כלפי מעלה."
          : "המקדם של x² שלילי, ולכן הפרבולה צריכה להיות פתוחה כלפי מטה."
      );
    }
    var cuts = strokeCrossings(pts);
    var touches = strokeTouches(pts);
    var need = model.roots.length;
    if (need === 1 && cuts.length) {
      return fail("parabolaCrossesAtDoubleRoot", "זוהי נקודת אפס כפולה. הפרבולה נוגעת בציר x בנקודה הזאת ואינה חוצה אותו.");
    }
    if (need === 1 && touches.length !== 1) {
      return fail("parabolaRoots", "יש נקודת אפס כפולה. הפרבולה נוגעת בציר x בנקודה אחת ואינה חוצה אותו.");
    }
    if (need === 0 && (cuts.length || touches.length)) {
      return fail("parabolaRoots", "אין נקודות אפס, ולכן הפרבולה כולה נשארת בצד אחד של ציר x.");
    }
    if (need === 2 && cuts.length !== 2) {
      return fail("parabolaRoots", "הפרבולה צריכה לחתוך את ציר x בשתי נקודות.");
    }
    var anchors = need === 1 ? touches : cuts;
    if (marks.length) {
      if (marks.length !== need) {
        return fail("parabolaRoots", "מסמנים את נקודות האפס שמצאתם, או מציירים בלי מספרים.");
      }
      var i;
      for (i = 0; i < marks.length; i++) {
        if (!model.roots.some(function (r) { return Math.abs(r - marks[i].value) < 1e-6; })) {
          return fail("parabolaRoots", "סימנתם מספר שאינו נקודת אפס של הביטוי.");
        }
      }
      var ordered = marks.slice().sort(function (a, b) { return a.x - b.x; });
      for (i = 1; i < ordered.length; i++) {
        if (ordered[i].value < ordered[i - 1].value - 1e-8) {
          return fail("parabolaOrder", "השורש הקטן צריך להיות משמאל לשורש הגדול.");
        }
      }
      for (i = 0; i < marks.length; i++) {
        var near = anchors.some(function (x) { return Math.abs(x - marks[i].x) < 56; });
        if (!near) return fail("parabolaThrough", need === 1 ? "הפרבולה צריכה לגעת בציר בנקודת האפס." : "הפרבולה צריכה לעבור בנקודות האפס שעל הציר.");
      }
    }
    var shape = need === 0
      ? " ונשארת כולה בצד אחד של הציר."
      : need === 1
        ? " ונוגעת בציר בנקודת האפס."
        : (marks.length ? " ועוברת בנקודות האפס." : " וחותכת את הציר בשתי נקודות.");
    return progress("הסקיצה מתאימה: הפרבולה " + (expect === "up" ? "פתוחה למעלה" : "פתוחה למטה") + shape + " מעל הציר הביטוי חיובי, ומתחתיו שלילי.", { phase: "signs" });
  }

  function strokeTouches(pts) {
    var best = null;
    var i;
    for (i = 0; i < pts.length; i++) {
      var a = Number(pts[i].above);
      if (best == null || Math.abs(a) < Math.abs(Number(best.a))) best = { a: a, x: Number(pts[i].x) };
    }
    if (!best || Math.abs(best.a) > 12) return [];
    var left = Number(pts[0].above);
    var right = Number(pts[pts.length - 1].above);
    if (left * right <= 0) return [];
    if (Math.abs(left) < 16 || Math.abs(right) < 16) return [];
    return [best.x];
  }

  function strokeOpening(pts) {
    var sorted = pts.slice().sort(function (a, b) { return Number(a.x) - Number(b.x); });
    var n = sorted.length;
    var wing = Math.max(2, Math.floor(n / 5));
    function avg(list) {
      var sum = 0;
      list.forEach(function (p) { sum += Number(p.above); });
      return sum / list.length;
    }
    var ends = avg(sorted.slice(0, wing).concat(sorted.slice(n - wing)));
    var mid = avg(sorted.slice(Math.floor(n * 0.4), Math.max(Math.floor(n * 0.4) + 1, Math.floor(n * 0.6))));
    if (ends - mid > 16) return "up";
    if (mid - ends > 16) return "down";
    return "";
  }

  function strokeCrossings(pts) {
    var hits = [];
    var side = 0;
    var i;
    for (i = 0; i < pts.length; i++) {
      var a = Number(pts[i].above);
      var nextSide = a > 8 ? 1 : a < -8 ? -1 : 0;
      if (!nextSide) continue;
      if (side && nextSide !== side) {
        var x = Number(pts[i].x);
        if (!hits.length || Math.abs(x - hits[hits.length - 1]) > 28) hits.push(x);
      }
      side = nextSide;
    }
    return hits;
  }

  function sampleReason(model, reg, first) {
    if (model.rootCount === 0) return first ? "נבחר x = 0." : "נבחר x = 0.";
    if (model.rootCount === 1) {
      return first
        ? "יש נקודת אפס אחת. היא מחלקת את הישר לשני תחומים. נבחר מספר אחד מכל צד."
        : "נבדוק את הצד השני של נקודת האפס. נבחר מספר מתוך " + reg.label + ".";
    }
    return first
      ? "נקודות האפס מחלקות את הישר לשלושה תחומים. נבדוק תחילה את " + reg.label + "."
      : "נבדוק את התחום " + reg.label + ". נבחר מספר מתוך התחום.";
  }

  function nextSignAction(body, model) {
    var rows = ((body.sign && body.sign.regions) || []);
    var i;
    for (i = 0; i < model.regions.length; i++) {
      var reg = model.regions[i];
      var row = rows[i] || {};
      var x = row.x != null && row.x !== "" ? Number(row.x) : null;
      if (x == null || !isFinite(x)) {
        return {
          type: "sample",
          region: i,
          value: reg.sample,
          text: pretty(String(reg.sample)),
          reason: sampleReason(model, reg, i === 0 && !rows.some(function (r) { return r && r.x != null && r.x !== ""; })),
        };
      }
      if (isRoot(x, model) || !inRegion(x, reg)) {
        return {
          type: "sample",
          region: i,
          value: reg.sample,
          text: pretty(String(reg.sample)),
          reason: "נשארים עם מספר שנמצא בתוך " + reg.label + ".",
        };
      }
      if (!String(row.expr || "").trim()) {
        return {
          type: "expr",
          region: i,
          text: pretty(M.substText(model.fn, x, String(row.x))),
          reason: "מציבים את " + pretty(String(row.x)) + " בביטוי המקורי.",
        };
      }
      if (!String(row.value || "").trim()) {
        var val = M.evalAt(model.fn, x);
        return {
          type: "result",
          region: i,
          text: pretty(String(Math.round(val * 1000) / 1000)),
          reason: "מחשבים את ערך הביטוי.",
        };
      }
      if (!signCode(row.sign)) {
        var sign = M.evalAt(model.fn, x) > 0 ? "+" : "−";
        return {
          type: "mark",
          region: i,
          sign: sign,
          reason: model.rootCount === 0
            ? (sign === "+" ? "התוצאה חיובית" : "התוצאה שלילית") + ". מכיוון שאין נקודות אפס, הסימן אינו יכול לעבור מחיובי לשלילי דרך 0."
            : model.rootCount === 1
              ? (sign === "+" ? "התוצאה חיובית" : "התוצאה שלילית") + ". בנקודת אפס כפולה הסימן משני הצדדים נשאר אותו סימן."
              : (sign === "+" ? "התוצאה חיובית" : "התוצאה שלילית") + ", ולכן הביטוי " + (sign === "+" ? "חיובי" : "שלילי") + " בכל התחום הזה.",
        };
      }
    }
    return null;
  }

  function hintsFor(body, model, found) {
    if (!found && !equationLines(body.history || [], model.zeroEq).length) {
      return [
        "כדי לדעת היכן הביטוי חיובי או שלילי, כדאי קודם למצוא היכן הוא שווה ל־0.",
        "החליפו זמנית את סימן אי־השוויון בשוויון ופתרו את המשוואה הריבועית כדי למצוא את נקודות האפס.",
      ];
    }
    if (!found) {
      var mixedHint = proxyMixed(Object.assign({}, body, { intent: "hint" }), model);
      return [String((mixedHint && (mixedHint.hint || mixedHint.message)) || "ממשיכים לפתור את המשוואה הריבועית.")];
    }
    if (body.sign && body.sign.open) {
      var act = nextSignAction(body, model);
      if (act) return [act.reason];
    }
    if (model.rootCount === 0) {
      return [
        "אין נקודות שבהן הפונקציה שווה ל־0. מה זה אומר לגבי החיתוך של הפרבולה עם ציר x?",
        "בחר ערך x אחד ובדוק האם הביטוי חיובי או שלילי.",
        "מכיוון שאין נקודות אפס, הסימן אינו יכול לעבור מחיובי לשלילי דרך 0.",
      ];
    }
    if (model.rootCount === 1) {
      return [
        "מצאנו רק נקודת אפס אחת. בדוק מה קורה לפרבולה בנקודה הזו.",
        "כאשר למשוואה הריבועית יש שורש כפול, הפרבולה נוגעת בציר x בנקודת האפס.",
        "אפשר לבחור מספר אחד מכל צד של נקודת האפס ולבדוק את סימן הביטוי.",
      ];
    }
    return [
      "נקודות האפס מחלקות את הישר לשלושה תחומים. עכשיו צריך לקבוע את סימן הביטוי בכל תחום.",
      "אפשר לעשות זאת בעזרת סקיצה של הפרבולה או בעזרת הצבת מספר מבחן מכל תחום.",
    ];
  }

  function equationSteps(model) {
    var history = [model.zeroEq];
    var steps = [];
    var guard = 0;
    while (guard++ < 20) {
      var res = handleMixed(engine, { intent: "one-step", start: model.zeroEq, history: history });
      res = keepParabola(res, history, {});
      res = applySqrtEngine(res, history[history.length - 1]);
      if (!res) break;
      if ((res.enter === "formula" || res.path === "formula") && !res.step) {
        var form = handleFormula(engine, { intent: "solution", start: model.zeroEq, history: history });
        (form.steps || []).forEach(function (step) {
          var eq = step && step.eq != null ? step.eq : step;
          steps.push({ eq: pretty(eq), explain: (step && step.explain) || "פותרים את המשוואה הריבועית בנוסחת השורשים." });
        });
        break;
      }
      if (res.step) {
        steps.push({ eq: pretty(res.step), explain: res.reason || res.hint || res.message || "ממשיכים לפתור את המשוואה הריבועית." });
        history.push(res.step);
        if (res.solved) break;
        continue;
      }
      break;
    }
    return steps;
  }

  function answerExplain(model) {
    if (model.rootCount === 0 && model.answer === "כל x") {
      return "הביטוי שומר על אותו סימן לכל x, והסימן מתאים לאי־שוויון. אין x שאינו מקיים אותו, ולכן הפתרון הוא כל x.";
    }
    if (model.rootCount === 0) {
      return "הביטוי שומר על סימן שאינו הסימן המבוקש, ואין נקודת אפס שמשנה אותו. אין תחום שמתאים, ולכן אין פתרון.";
    }
    if (model.rootCount === 1 && model.answer === "כל x") {
      return "משני צדי נקודת האפס הסימן מתאים, והשוויון כולל גם את הנקודה. יחד זה כל x.";
    }
    if (model.rootCount === 1 && isSingleton(model.solution)) {
      return "הביטוי שווה ל־0 רק בנקודת האפס, ובשאר המקומות הסימן אינו מתאים. הפתרון הוא הנקודה.";
    }
    if (model.rootCount === 1 && model.answer === "אין פתרון") {
      return "הסימן המבוקש אינו מופיע באף תחום, וגם נקודת האפס אינה נכללת. אין פתרון.";
    }
    if (model.rootCount === 1) {
      return "הסימן מתאים משני צדי נקודת האפס. האי־שוויון חזק, ולכן הנקודה עצמה אינה נכללת.";
    }
    var include = includeRoots(model.rel);
    return "בוחרים את התחומים שבהם הביטוי " + signWord(model.rel) + (include ? ", וכוללים את נקודות האפס כי הסימן כולל שוויון." : ", בלי נקודות האפס.") + " הפתרון: " + model.answer + ".";
  }

  function solutionSteps(start) {
    var steps = [{ eq: pretty(start), explain: "זה אי־השוויון שפותרים." }];
    var cur = start;
    var guard = 0;
    while (!standardWritten(cur) && guard++ < 6) {
      var moved = normalizeStep(cur);
      if (!moved) break;
      steps.push({
        eq: moved.eq,
        explain: "כדי לפתור את אי־השוויון הריבועי, קודם נסדר אותו כך שבאגף אחד יהיה 0. " + moved.explain,
      });
      cur = moved.eq;
    }
    var model = modelOf(cur, start);
    if (!model || model.pendingNormalize) return steps;
    steps.push({
      eq: pretty(model.zeroEq),
      explain: "כדי למצוא את התחומים שבהם הביטוי חיובי או שלילי, נמצא את נקודות האפס. זו משוואת עזר, לא החלפה של אי־השוויון.",
    });
    equationSteps(model).forEach(function (step) {
      if (/אין פתרון/.test(String(step.eq))) {
        steps.push({
          eq: "אין נקודות אפס ממשיות",
          explain: "למשוואת העזר אין שורשים ממשיים. זה לא סוף הפתרון: עדיין בודקים אם הביטוי חיובי או שלילי.",
        });
        return;
      }
      steps.push(step);
    });
    if (model.rootCount === 2) {
      steps.push({
        eq: model.labels.map(function (r) { return "x = " + r.text; }).join(", "),
        explain: "נקודות האפס מחלקות את הישר לשלושה תחומים.",
      });
    } else if (model.rootCount === 1) {
      steps.push({
        eq: "x = " + model.labels[0].text,
        explain: "יש נקודת אפס אחת. היא מחלקת את הישר לשני תחומים. הפרבולה נוגעת בציר x ואינה חוצה אותו.",
      });
    } else {
      steps.push({
        eq: "אין נקודות אפס ממשיות",
        explain: "אין נקודות שמחלקות את הישר. כל הישר הוא תחום אחד, וצריך לקבוע את סימן הביטוי.",
      });
    }
    if (model.rootCount === 0) {
      steps.push({ eq: "x = 0", explain: "בחר מספר כלשהו ובדוק את סימן הביטוי. נבחר x = 0." });
    }
    model.regions.forEach(function (reg) {
      var plug = M.substText(model.fn, reg.sample);
      var val = M.evalAt(model.fn, reg.sample);
      var shown = pretty(String(Math.round(val * 1000) / 1000));
      var word = reg.sign === "pos" ? "חיובית" : "שלילית";
      var where = model.rootCount === 0
        ? "מציבים את המספר בביטוי. התוצאה " + word + ", ומכיוון שאין נקודות אפס הסימן נשאר כך לכל x."
        : model.rootCount === 1
          ? "בצד " + reg.label + " התוצאה " + word + ". בשורש כפול הסימן משני הצדדים זהה."
          : "בתחום " + reg.label + " מציבים מספר מבחן. התוצאה " + word + ", ולכן הביטוי " + (reg.sign === "pos" ? "חיובי" : "שלילי") + " בכל התחום.";
      steps.push({ eq: pretty(plug) + " = " + shown, explain: where });
    });
    if (model.answer === "כל x") {
      steps.push({ eq: "נבדוק אם יש x שאינו מקיים", explain: "בדוק האם קיים x כלשהו שאינו מקיים את אי־השוויון." });
    } else if (model.answer === "אין פתרון") {
      steps.push({ eq: "נבדוק אם יש תחום שמתאים", explain: "בדוק האם קיים תחום כלשהו שבו סימן הביטוי מתאים לסימן המבוקש." });
    }
    steps.push({ eq: model.answer, explain: answerExplain(model) });
    return steps;
  }

  function signPayload(model) {
    return {
      phase: "signs",
      rootCount: model.rootCount,
      roots: model.labels,
      criticalPoints: model.criticalPoints,
      regions: model.regions.map(function (reg) { return { index: reg.index, label: reg.label }; }),
    };
  }

  function resolvedModel(start) {
    var cur = start;
    var guard = 0;
    while (!standardWritten(cur) && guard++ < 6) {
      var moved = normalizeStep(cur);
      if (!moved) break;
      cur = moved.eq;
    }
    return modelOf(cur, start);
  }

  function respondNormalize(body, current) {
    var intent = String(body.intent || "");
    if (intent === "hint") {
      var arrange = "כדי לפתור את אי־השוויון הריבועי, קודם נסדר אותו כך שבאגף אחד יהיה 0.";
      return { ok: true, phase: "normalize", hint: arrange, hints: [arrange] };
    }
    if (intent === "one-step") {
      var moved = normalizeStep(current);
      if (!moved) return { ok: false, phase: "normalize", message: "קודם מסדרים את אי־השוויון כך שבאגף אחד 0." };
      return {
        ok: true,
        phase: "normalize",
        step: moved.eq,
        reason: "כדי לפתור את אי־השוויון הריבועי, קודם נסדר אותו כך שבאגף אחד יהיה 0. " + moved.explain,
        solved: false,
      };
    }
    var typed = String((body && body.typed) || "").trim();
    if (looksLikeSolution(typed) || /^x=/.test(ascii(typed))) {
      var target = resolvedModel(current);
      if (target && !target.pendingNormalize) {
        var judged = judgeAnswer(typed, target, body);
        if (judged) return judged;
      }
    }
    if (!workIneq(typed)) {
      return { ok: false, phase: "normalize", message: "כדי לפתור את אי־השוויון הריבועי, קודם נסדר אותו כך שבאגף אחד יהיה 0." };
    }
    var chk = Q.checkMixedTyped(toEq(current), toEq(typed), Q.analyzeMixedStart(toEq(current)));
    if (!chk || !chk.ok) return fail("moveTermSign", "בהעברת איבר מאגף לאגף הסימן של האיבר משתנה.");
    var prev = ineqPoly(current);
    var next = ineqPoly(typed);
    var k = prev && next ? scaleOf(prev, next) : 1;
    var expected = k < -1e-8 ? flipRel(relOf(current)) : relOf(current);
    if (relOf(typed) !== expected) {
      var prevParts = splitRel(current);
      var nextParts = splitRel(typed);
      var zeroMoved = !!(prevParts && nextParts && (ascii(prevParts.left) === "0") !== (ascii(nextParts.left) === "0"));
      if (k < -1e-8 && zeroMoved) {
        return fail("inequalitySwapDirection", "כאשר מחליפים בין שני אגפי אי־השוויון, צריך לכתוב את הסימן בכיוון המתאים כדי לשמור על אותה משמעות.");
      }
      if (k < -1e-8) {
        return fail("inequalityDirectionNotFlipped", "חילקת את שני אגפי אי־השוויון במספר שלילי. במקרה כזה צריך להפוך את כיוון אי־השוויון.");
      }
      return fail("inequalityDirectionFlipped", "חילקת במספר חיובי, ולכן כיוון אי־השוויון צריך להישאר ללא שינוי.");
    }
    return progress(standardWritten(typed) ? "האי־שוויון מסודר. עכשיו אפשר למצוא את נקודות האפס." : "צעד חוקי. ממשיכים לסדר את אי־השוויון.", {
      phase: standardWritten(typed) ? "equation" : "normalize",
    });
  }

  function handle(body) {
    body = body || {};
    var start = String(body.ineq || body.start || "").trim();
    var intent = String(body.intent || "");
    var current = latestIneq(body, start);
    if (intent === "solution") {
      var solvedModel = resolvedModel(start);
      if (!solvedModel || solvedModel.pendingNormalize) return { ok: false, message: "לא הצלחתי לקרוא את אי־השוויון הריבועי." };
      return { ok: true, steps: solutionSteps(start), answer: solvedModel.answer };
    }
    if (!standardWritten(current)) {
      var normRes = respondNormalize(body, current);
      if (normRes) return normRes;
    }
    var model = modelOf(current, start);
    if (!model || model.pendingNormalize) return { ok: false, message: "לא הצלחתי לקרוא את אי־השוויון הריבועי." };
    if (body.engine === "mixed" && !((intent === "one-step" || intent === "hint") && rootsFound(body, model))) {
      return wrapMixed(proxyMixed(body, model), model);
    }
    var found = rootsFound(body, model);
    if (intent === "hint") {
      var hints = hintsFor(body, model, found);
      return { ok: true, hint: hints[0], hints: hints, phase: found ? "signs" : "equation" };
    }
    if (intent === "sign-check") return checkSign(body, model);
    if (intent === "parabola-check") return checkParabola(body, model);
    if (intent === "regions") {
      if (!found) return { ok: false, message: "קודם מוצאים את נקודות האפס." };
      return Object.assign({ ok: true, rootsFound: true }, signPayload(model));
    }
    if (intent === "one-step") {
      var eqHist = equationLines(body.history || [], model.zeroEq);
      if (!eqHist.length) {
        return {
          ok: true,
          step: pretty(model.zeroEq),
          reason: "כדי למצוא את התחומים שבהם הביטוי חיובי או שלילי, נמצא תחילה את נקודות האפס שלו.",
          offerFormula: true,
          solved: false,
          phase: "equation",
        };
      }
      if (!found) {
        var produced = null;
        eqHist.forEach(function (line) {
          var hit = matchingProduct(line, model);
          if (hit) produced = hit;
        });
        if (produced) {
          var factorStep = nextFactorEquation(produced, body.history || []);
          if (factorStep) return factorStep;
        }
        var mixedStep = wrapMixed(proxyMixed(Object.assign({}, body, { intent: "one-step" }), model), model);
        if (mixedStep && mixedStep.rootsFound) mixedStep = Object.assign(mixedStep, signPayload(model));
        return mixedStep;
      }
      if (body.parabola && body.parabola.open) {
        var drawn = checkParabola(body, model);
        if (!drawn.ok) {
          return { ok: true, parabolaAction: { type: "fix" }, reason: drawn.message, solved: false, phase: "signs" };
        }
      }
      var histLines = body.history || [];
      if (model.rootCount === 0 && !histLines.some(function (line) { return /נבדוק את סימן/.test(String(line || "")); })) {
        return Object.assign({
          ok: true,
          step: "נבדוק את סימן הביטוי",
          reason: "אין נקודות אפס ממשיות, ולכן אין נקודות שמחלקות את הישר. נבחר מספר כלשהו ונבדוק את סימן הביטוי.",
          solved: false,
        }, signPayload(model));
      }
      var signAct = nextSignAction(body, model);
      if (signAct) {
        return Object.assign({ ok: true, boardAction: signAct, reason: signAct.reason, solved: false }, signPayload(model));
      }
      var already = histLines.some(function (line) { return sameSet(parseSet(line) || [], model.solution); });
      if (already) return { ok: true, done: true, hint: "הפתרון כבר רשום.", phase: "signs" };
      if ((model.answer === "כל x" || model.answer === "אין פתרון") && !histLines.some(function (line) { return /נבדוק אם יש/.test(String(line || "")); })) {
        var askAll = model.answer === "כל x";
        return Object.assign({
          ok: true,
          step: askAll ? "נבדוק אם יש x שאינו מקיים" : "נבדוק אם יש תחום שמתאים",
          reason: askAll
            ? "בדוק האם קיים x כלשהו שאינו מקיים את אי־השוויון."
            : "בדוק האם קיים תחום כלשהו שבו סימן הביטוי מתאים לסימן המבוקש.",
          solved: false,
        }, signPayload(model));
      }
      return {
        ok: true,
        step: model.answer,
        reason: answerExplain(model),
        solved: true,
        answer: model.answer,
        phase: "signs",
      };
    }
    var typed = String(body.typed || "").trim();
    if (!typed) return { ok: false, message: "כתבו צעד, או את פתרון אי־השוויון." };
    if (looksLikeSolution(typed) || (found && /^x=/.test(ascii(typed)))) {
      var judged = judgeAnswer(typed, model, body);
      if (judged) return Object.assign(judged, found ? signPayload(model) : { phase: "equation" });
    }
    if (isAuxiliary(typed, model)) {
      if (eqHistExists(body, model)) return { ok: false, message: "את משוואת העזר כבר רשמתם. המשיכו לפתור אותה." };
      return progress("כדי למצוא את התחומים שבהם הביטוי חיובי או שלילי, נמצא תחילה את נקודות האפס שלו.", { phase: "equation", offerFormula: true });
    }
    var eqHist = equationLines(body.history || [], model.zeroEq);
    var product = matchingProduct(typed, model);
    if (product && (eqHist.length || samePoly(typed, model.zeroEq))) {
      return progress("הפירוק נכון. עכשיו כל גורם יכול להיות שווה לאפס.", { phase: "equation", canSplit: true });
    }
    var followed = factorFollow(typed, model, eqHist);
    if (followed) return followed;
    if (!found && !/[<>]/.test(ascii(typed)) && (eqHist.length || samePoly(typed, model.zeroEq))) {
      var mixedBody = eqHist.length ? body : Object.assign({}, body, { history: [model.zeroEq] });
      var mixedRes = wrapMixed(proxyMixed(mixedBody, model), model);
      if (mixedRes && (mixedRes.ok || mixedRes.errorId || mixedRes.message)) {
        if (mixedRes.rootsFound) mixedRes = Object.assign(mixedRes, signPayload(model));
        return mixedRes;
      }
    }
    if (!eqHist.length) {
      return { ok: false, message: "כדי למצוא את התחומים, רשמו קודם את משוואת העזר שבה הביטוי שווה ל־0, או את הפתרון אם הוא כבר ידוע." };
    }
    if (!found) return { ok: false, message: "ממשיכים לפתור את המשוואה הריבועית, או רושמים את פתרון אי־השוויון." };
    return { ok: false, phase: "signs", message: "רשמו את פתרון אי־השוויון, למשל תחום או שני תחומים עם «או»." };
  }

  function nextFactorEquation(prod, history) {
    var Algebra = engine.DoctematicaAlgebra;
    var Teach = engine.DoctematicaTeach;
    var eqs = [prod.e1, prod.e2];
    var i;
    for (i = 0; i < eqs.length; i++) {
      var current = eqs[i];
      var seen = false;
      var solved = false;
      history.forEach(function (line) {
        if (ascii(line) === ascii(eqs[i])) seen = true;
        try {
          var lin = Algebra.checkStep(current, line);
          if (lin && lin.ok) {
            seen = true;
            current = line;
            if (lin.solved) solved = true;
          }
        } catch (err) {
          /* שורה של הגורם השני */
        }
      });
      if (!seen) {
        return {
          ok: true,
          step: pretty(eqs[i]),
          reason: "מכפלה שווה לאפס רק אם אחד הגורמים שווה לאפס.",
          solved: false,
          phase: "equation",
        };
      }
      if (!solved) {
        var act = Teach.nextAction(current);
        if (act && act.eq) {
          return {
            ok: true,
            step: pretty(act.eq),
            reason: act.explain || "מבודדים את x בגורם.",
            solved: false,
            phase: "equation",
          };
        }
      }
    }
    return null;
  }

  function factorFollow(typed, model, hist) {
    var prod = null;
    var i;
    for (i = (hist || []).length - 1; i >= 0; i--) {
      prod = matchingProduct(hist[i], model);
      if (prod) break;
    }
    if (!prod) return null;
    var Algebra = engine.DoctematicaAlgebra;
    var eqs = [prod.e1, prod.e2];
    var i;
    for (i = 0; i < eqs.length; i++) {
      if (ascii(typed) === ascii(eqs[i])) return progress("רושמים גורם ששווה לאפס.", { phase: "equation" });
      try {
        var lin = Algebra.checkStep(eqs[i], typed);
        if (lin && lin.solved) return progress("זה שורש של משוואת העזר. אם יש שורש נוסף, רשמו גם אותו.", { phase: "equation" });
        if (lin && lin.ok) return progress(lin.message || "צעד חוקי. ממשיכים לבודד את x.", { phase: "equation" });
      } catch (err) {
        /* לא צעד של הגורם הזה */
      }
    }
    return null;
  }

  function isAuxiliary(typed, model) {
    var t = ascii(typed);
    if (/[<>]/.test(t)) return false;
    var z = ascii(model.zeroEq);
    return t === z || t === "0=" + ascii(model.expr);
  }

  function eqHistExists(body, model) {
    return equationLines(body.history || [], model.zeroEq).length > 0;
  }

  return { handle: handle };
}

module.exports = { createQuadIneqHandler: createQuadIneqHandler };
