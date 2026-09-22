(function (global) {
  var EPS = 1e-8;
  var unknownKind = "x";

  function lab() {
    return unknownKind === "x2" ? "x²" : "x";
  }

  function near0(n) {
    return Math.abs(n) < EPS;
  }

  function rememberDecimals(text, into) {
    String(text || "")
      .replace(/[−–—]/g, "-")
      .replace(/-?\d+\.\d+/g, function (tok) {
        var v = parseFloat(tok);
        var mag = tok.replace(/^-/, "");
        var i;
        for (i = 0; i < into.length; i++) {
          if (Math.abs(Math.abs(into[i].value) - Math.abs(v)) < EPS) return tok;
        }
        into.push({ value: v, mag: mag });
        return tok;
      });
  }

  function fmt(n, decimals) {
    var pool = decimals || [];
    var i;
    for (i = 0; i < pool.length; i++) {
      if (Math.abs(Math.abs(pool[i].value) - Math.abs(n)) < EPS) {
        return (n < 0 ? "−" : "") + pool[i].mag;
      }
    }
    return String(global.DoctematicaAlgebra.formatNumber(n)).split(" או ")[0].replace(/-/g, "−");
  }

  function key(text) {
    return String(text)
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function splitEq(text) {
    var raw = String(text).replace(/[−–—]/g, "-");
    var i = raw.indexOf("=");
    if (i === -1) return null;
    return { left: raw.slice(0, i).trim(), right: raw.slice(i + 1).trim() };
  }

  function hasX(side) {
    return /x/i.test(side || "");
  }

  function formatAx(a, decimals) {
    if (near0(a)) return "";
    if (Math.abs(a - 1) < EPS) return lab();
    if (Math.abs(a + 1) < EPS) return "−" + lab();
    var s = fmt(a, decimals);
    var m = String(s)
      .replace(/−/g, "-")
      .match(/^(-)?(\d+)\/(\d+)$/);
    if (m) {
      var sign = m[1] ? "−" : "";
      if (m[2] === "1") return sign + lab() + "/" + m[3];
      return sign + m[2] + lab() + "/" + m[3];
    }
    return s + lab();
  }

  function prettySide(a, b, decimals) {
    if (near0(a) && near0(b)) return "0";
    if (near0(a)) return fmt(b, decimals);
    var xs = formatAx(a, decimals);
    if (near0(b)) return xs;
    if (b > 0) return xs + " + " + fmt(b, decimals);
    return xs + " − " + fmt(-b, decimals);
  }

  function prettyEq(La, Lb, Ra, Rb, decimals) {
    return prettySide(La, Lb, decimals) + " = " + prettySide(Ra, Rb, decimals);
  }

  function pendingArith(side) {
    if (hasX(side)) return false;
    var t = String(side || "").replace(/\s+/g, "");
    if (!t) return false;
    if (/[0-9.)].*[+−-].*[0-9.(]/.test(t)) return true;
    if (global.DoctematicaAlgebra.isolatedRhsKind("x=" + side, "x") === "unreduced") return true;
    return false;
  }

  function splitRawTerms(side) {
    var s = String(side || "").replace(/[−–—]/g, "-");
    s = s.replace(/(-?\d+)\s+(\d+)\s*\/\s*(\d+)/g, "($1+$2/$3)");
    s = s.replace(/\s+/g, "");
    var terms = [];
    var start = 0;
    var depth = 0;
    var i;
    for (i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (depth === 0 && i > 0 && (c === "+" || c === "-")) {
        var prev = s.charAt(i - 1);
        if (prev === "*" || prev === "/" || prev === "(") continue;
        terms.push(s.slice(start, i));
        start = i;
      }
    }
    terms.push(s.slice(start));
    return terms.filter(function (t) {
      return t && t !== "+" && t !== "-";
    });
  }

  function termKinds(side) {
    var terms = splitRawTerms(side);
    var xs = 0;
    var cs = 0;
    var i;
    for (i = 0; i < terms.length; i++) {
      if (/x/i.test(terms[i])) xs++;
      else cs++;
    }
    return { xs: xs, cs: cs };
  }

  function likePhrase(where, k) {
    if (k.xs >= 2 && k.cs < 2) return "אחדו איברים דומים " + where + " (האיברים עם " + lab() + ").";
    if (k.cs >= 2 && k.xs < 2) return "אחדו איברים דומים " + where + " (המספרים).";
    return "אחדו איברים דומים " + where + ".";
  }

  function gcdInt(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function lcmInt(a, b) {
    return Math.abs(a * b) / gcdInt(a, b);
  }

  function parseCompoundFrac(term) {
    var t = String(term || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var sign = "+";
    if (t.charAt(0) === "+" || t.charAt(0) === "-") {
      sign = t.charAt(0);
      t = t.slice(1);
    }
    var m = t.match(/^(\d*)\(([^()]+)\)\/(\d+)$/);
    if (!m) return null;
    return {
      sign: sign,
      k: m[1] === "" ? 1 : parseInt(m[1], 10),
      inner: m[2],
      den: parseInt(m[3], 10),
    };
  }

  function formatCompoundFrac(signedK, inner, den) {
    var neg = signedK < 0;
    var k = Math.abs(signedK);
    var body = k === 1 ? "(" + inner + ")/" + den : fmt(k) + "(" + inner + ")/" + den;
    return (neg ? "−" : "") + body;
  }

  function formatDroppedCompound(signedK, inner) {
    var neg = signedK < 0;
    var k = Math.abs(signedK);
    var body = k === 1 ? "(" + inner + ")" : fmt(k) + "(" + inner + ")";
    return (neg ? "−" : "") + body;
  }

  /** y-form equate with (1/2)x-style coeffs only — skip LCD, use move/combine like linear eqs. */
  function isCoeffFracEquateLinear(sides) {
    if (!sides) return false;
    var all = splitRawTerms(sides.left).concat(splitRawTerms(sides.right));
    var hasCoeffFrac = false;
    var i;
    for (i = 0; i < all.length; i++) {
      var info = splitTermDenExpr(all[i]);
      if (info.hasVar) return false;
      var t = String(all[i]).replace(/[−–—]/g, "-").replace(/\s+/g, "");
      if (/x/i.test(t) && info.numeric > 1 && /^\(?-?\d+\/-?\d+\)?x$/i.test(t)) hasCoeffFrac = true;
    }
    return hasCoeffFrac;
  }

  function isSimpleCoeffFracEq(sides) {
    if (!sides) return false;
    if (splitRawTerms(sides.left).length !== 1 || splitRawTerms(sides.right).length !== 1) return false;
    var L = String(sides.left)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/^[+]/, "");
    var R = String(sides.right).replace(/[−–—]/g, "-").replace(/\s+/g, "");
    var simpleX = /^(?:\d*)x\/\d+$/i.test(L) || /^\(?x\)?\/\d+$/i.test(L);
    return simpleX && isPlainNumberSide(sides.right);
  }

  function canonExpr(s) {
    return String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/×|·/g, "*")
      .replace(/²/g, "^2")
      .toLowerCase();
  }

  function unwrapOuterParens(s) {
    var t = String(s || "");
    while (t.charAt(0) === "(" && t.charAt(t.length - 1) === ")") {
      var depth = 0;
      var ok = true;
      var i;
      for (i = 0; i < t.length; i++) {
        if (t.charAt(i) === "(") depth += 1;
        else if (t.charAt(i) === ")") {
          depth -= 1;
          if (depth === 0 && i < t.length - 1) {
            ok = false;
            break;
          }
        }
      }
      if (!ok || depth !== 0) break;
      t = t.slice(1, -1);
    }
    return t;
  }

  /** Split a term into numerator body + denominator expression (may include x). */
  function splitTermDenExpr(term) {
    var cf = parseCompoundFrac(term);
    if (cf) {
      return {
        sign: cf.sign === "-" ? "-" : "",
        body: (cf.k === 1 ? "" : String(cf.k)) + "(" + cf.inner + ")",
        denExpr: String(cf.den),
        numeric: cf.den,
        hasVar: false,
      };
    }
    var raw = String(term || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var sign = "";
    if (raw.charAt(0) === "+") raw = raw.slice(1);
    if (raw.charAt(0) === "-") {
      sign = "-";
      raw = raw.slice(1);
    }
    var wrapped = raw.match(/^\((\d+)\/(\d+)\)x$/i);
    if (wrapped) {
      return {
        sign: sign,
        body: wrapped[1] + "x",
        denExpr: wrapped[2],
        numeric: parseInt(wrapped[2], 10),
        hasVar: false,
      };
    }
    var depth = 0;
    var slash = -1;
    var i;
    for (i = 0; i < raw.length; i++) {
      var ch = raw.charAt(i);
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      else if (depth === 0 && ch === "/") slash = i;
    }
    if (slash < 0) {
      return { sign: sign, body: raw, denExpr: "1", numeric: 1, hasVar: false };
    }
    var body = raw.slice(0, slash);
    var denExpr = unwrapOuterParens(raw.slice(slash + 1));
    if (!denExpr) denExpr = "1";
    var hasVar = /x/i.test(denExpr);
    var numeric = 1;
    if (/^\d+$/.test(denExpr)) numeric = parseInt(denExpr, 10);
    return { sign: sign, body: body, denExpr: denExpr, numeric: numeric, hasVar: hasVar };
  }

  /** Numeric denominator only (legacy). Algebraic dens count as 1 here. */
  function termDen(term) {
    var info = splitTermDenExpr(term);
    if (info.hasVar) return 1;
    return info.numeric > 0 ? info.numeric : 1;
  }

  function denHasVar(term) {
    return splitTermDenExpr(term).hasVar;
  }

  function eqHasVarDenom(eqText) {
    var sides = splitEq(eqText);
    if (!sides) return false;
    var terms = splitRawTerms(sides.left).concat(splitRawTerms(sides.right));
    var i;
    for (i = 0; i < terms.length; i++) {
      if (denHasVar(terms[i])) return true;
    }
    return false;
  }

  /**
   * Parse a linear expression into coefficients of ax+b.
   * Supports: x+2, x-3, 4-x, 6-2x, 3x+2, -4x+6, 1-x, …
   */
  function parseAxPlusB(expr) {
    var s = canonExpr(unwrapOuterParens(expr));
    if (!s || !/x/i.test(s)) return null;
    if (/x\^|x²|\*|\/|\(/.test(s)) return null;
    if (s.charAt(0) !== "+" && s.charAt(0) !== "-") s = "+" + s;
    var a = 0;
    var b = 0;
    var re = /([+-])(\d+(?:\.\d+)?)?(x)?/gi;
    var m;
    var consumed = 0;
    while ((m = re.exec(s))) {
      if (m.index !== consumed) return null;
      consumed = m.index + m[0].length;
      var sign = m[1] === "-" ? -1 : 1;
      var hasX = !!m[3];
      var coef = m[2] != null && m[2] !== "" ? parseFloat(m[2]) : hasX ? 1 : 0;
      if (!hasX && (m[2] == null || m[2] === "")) return null;
      if (hasX) a += sign * coef;
      else b += sign * coef;
    }
    if (consumed !== s.length) return null;
    return { a: a, b: b };
  }

  function formatAxPlusB(a, b) {
    if (near0(a) && near0(b)) return "0";
    if (near0(a)) return fmt(b);
    if (Math.abs(a + 1) < EPS && b > 0) return fmt(b) + "-x";
    var xs;
    if (Math.abs(a - 1) < EPS) xs = "x";
    else if (Math.abs(a + 1) < EPS) xs = "-x";
    else xs = fmt(a) + "x";
    if (near0(b)) return xs;
    if (b > 0) return xs + "+" + fmt(b);
    return xs + "-" + fmt(-b);
  }

  function peelNumericFactor(denExpr) {
    var d = unwrapOuterParens(denExpr);
    var m = String(d).match(/^(\d+)\((.+)\)$/);
    if (m) return { numeric: parseInt(m[1], 10), inner: m[2] };
    m = String(d).match(/^(\d+)\*(.+)$/);
    if (m) return { numeric: parseInt(m[1], 10), inner: m[2] };
    return null;
  }

  /**
   * Forbidden values from a denominator expression.
   * Handles x, k(x±a), linear ax+b, and x²−n².
   */
  function forbiddenFromDen(denExpr) {
    var raw = unwrapOuterParens(denExpr);
    var peel = peelNumericFactor(raw);
    if (peel) return forbiddenFromDen(peel.inner);
    var d = canonExpr(raw);
    if (!d || d === "1") return [];
    if (/^\d+(?:\.\d+)?$/.test(d)) return [];
    if (d === "x") return [{ value: 0, text: "0" }];
    var m = d.match(/^x(?:\^2|²)-(\d+(?:\.\d+)?)$/);
    if (m) {
      var n = parseFloat(m[1]);
      var r = Math.sqrt(n);
      if (Math.abs(r * r - n) < EPS && Math.abs(r - Math.round(r)) < EPS) {
        var rr = Math.round(r);
        return [
          { value: rr, text: fmt(rr) },
          { value: -rr, text: fmt(-rr) },
        ];
      }
      return [{ expr: "x^2", text: "±√" + fmt(n), symbolic: true }];
    }
    var lin = parseAxPlusB(raw);
    if (lin && !near0(lin.a)) {
      var v = -lin.b / lin.a;
      return [{ value: v, text: fmt(v) }];
    }
    return [{ expr: denExpr, text: unwrapOuterParens(denExpr) + "≠0", symbolic: true }];
  }

  function formatDomainDisplay(forbidden) {
    var parts = forbidden.map(function (f) {
      return "x≠" + f.text;
    });
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] + ", " + parts[1];
    return parts.join(", ");
  }

  function formatRawDomainDisplay(uniqueDens) {
    return uniqueDens
      .map(function (d) {
        return unwrapOuterParens(d) + "≠0";
      })
      .join(", ");
  }

  function densEquivalent(a, b) {
    var ca = canonExpr(unwrapOuterParens(a));
    var cb = canonExpr(unwrapOuterParens(b));
    if (ca === cb) return true;
    var peelA = peelNumericFactor(ca);
    var peelB = peelNumericFactor(cb);
    if (peelA) return densEquivalent(peelA.inner, b);
    if (peelB) return densEquivalent(a, peelB.inner);
    var la = parseAxPlusB(ca);
    var lb = parseAxPlusB(cb);
    if (la && lb) {
      if (near0(la.a - lb.a) && near0(la.b - lb.b)) return true;
      // Same line up to nonzero scalar (e.g. 2x-6 ~ x-3, or 2-x ~ x-2 with sign flip)
      if (!near0(la.a) && !near0(lb.a) && near0(la.a * lb.b - lb.a * la.b)) return true;
    }
    return false;
  }

  function analyzeDomain(eqText) {
    var sides = splitEq(eqText);
    if (!sides) return null;
    var terms = splitRawTerms(sides.left).concat(splitRawTerms(sides.right));
    var forbidden = [];
    var seen = {};
    var densVar = [];
    var uniqueKeys = {};
    var uniqueDens = [];
    var i;
    for (i = 0; i < terms.length; i++) {
      var info = splitTermDenExpr(terms[i]);
      if (!info.hasVar) continue;
      densVar.push(info.denExpr);
      var peel = peelNumericFactor(info.denExpr);
      var core = peel ? unwrapOuterParens(peel.inner) : info.denExpr;
      var uk = canonExpr(core);
      if (!uniqueKeys[uk]) {
        uniqueKeys[uk] = true;
        uniqueDens.push(core);
      }
      var fors = forbiddenFromDen(info.denExpr);
      var j;
      for (j = 0; j < fors.length; j++) {
        var f = fors[j];
        var k = f.symbolic ? "s:" + f.text : "v:" + String(f.value);
        if (seen[k]) continue;
        seen[k] = true;
        forbidden.push(f);
      }
    }
    if (!densVar.length) return null;
    forbidden.sort(function (a, b) {
      if (a.symbolic && !b.symbolic) return 1;
      if (!a.symbolic && b.symbolic) return -1;
      if (a.symbolic) return String(a.text).localeCompare(String(b.text));
      return a.value - b.value;
    });
    var display = formatDomainDisplay(forbidden);
    var parts = forbidden.map(function (f) {
      return "x≠" + f.text;
    });
    var rawParts = uniqueDens.map(function (d) {
      return unwrapOuterParens(d) + "≠0";
    });
    var rawDisplay = formatRawDomainDisplay(uniqueDens);
    var alts = [display, parts.join("; "), parts.join(",")];
    if (parts.length === 2) {
      alts.push(parts[0] + "ו" + parts[1]);
      alts.push(parts[0] + "ו־" + parts[1]);
      alts.push(parts[0] + " ו " + parts[1]);
    }
    if (forbidden.length === 1 && !forbidden[0].symbolic && near0(forbidden[0].value)) {
      alts.push("x≠0");
    }
    alts.push(rawDisplay);
    alts.push(rawParts.join(";"));
    var items = uniqueDens.map(domainItemFromDen);
    return {
      dens: densVar,
      uniqueDens: uniqueDens,
      count: forbidden.length,
      densCount: uniqueDens.length,
      forbidden: forbidden,
      display: display,
      parts: parts,
      rawParts: rawParts,
      rawDisplay: rawDisplay,
      items: items,
      alts: alts.filter(Boolean),
    };
  }

  function domainItemFromDen(denExpr) {
    var core = unwrapOuterParens(denExpr);
    var peel = peelNumericFactor(core);
    if (peel) core = unwrapOuterParens(peel.inner);
    var rawPart = core + "≠0";
    var fors = forbiddenFromDen(denExpr);
    var solvedParts = fors
      .filter(function (f) {
        return !f.symbolic;
      })
      .map(function (f) {
        return "x≠" + f.text;
      });
    var solvedPart =
      solvedParts.length === 1
        ? solvedParts[0]
        : solvedParts.length > 1
          ? solvedParts.join(", ")
          : rawPart;
    return {
      den: core,
      rawPart: rawPart,
      solvedPart: solvedPart,
      forbidden: fors[0] || null,
    };
  }

  function normalizeDomainTyped(typed) {
    return String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/≠|!=|<>|\\\\neq/gi, "≠")
      .replace(/\s+/g, "")
      .replace(/ו־|ו/g, ",")
      .toLowerCase();
  }

  function prettyDomainTyped(typed) {
    return String(typed || "")
      .replace(/[−–—]/g, "-")
      .replace(/≠|!=|<>|\\\\neq/gi, "≠")
      .replace(/\s+/g, "");
  }

  function domainConstraintToEq(text) {
    return prettyDomainTyped(text).replace(/≠/g, "=");
  }

  function domainEqToConstraint(text) {
    return prettyDomainTyped(text).replace(/=/g, "≠");
  }

  function parseDomainValues(raw) {
    var vals = [];
    var re = /(?:^|[,;])x≠([+\-]?\d+(?:\.\d+)?(?:\/\d+)?)/g;
    var m;
    while ((m = re.exec(raw))) {
      var tok = m[1];
      if (tok.indexOf("/") !== -1) {
        var fr = tok.split("/");
        var den = parseFloat(fr[1]);
        if (!den) continue;
        vals.push(parseFloat(fr[0]) / den);
      } else {
        vals.push(parseFloat(tok));
      }
    }
    return vals;
  }

  /** Parse expressions written as den≠0 (before solving for x). */
  function parseDomainRawExprs(raw) {
    var exprs = [];
    var re = /([^,;]+)≠0/g;
    var m;
    while ((m = re.exec(raw))) {
      exprs.push(unwrapOuterParens(m[1]));
    }
    return exprs;
  }

  function checkDomainRaw(info, raw) {
    var got = parseDomainRawExprs(raw);
    if (!got.length) return { ok: false };
    var need = info.uniqueDens || [];
    if (got.length !== need.length) {
      return {
        ok: false,
        message:
          need.length > 1
            ? "רשמו את כל המכנים ≠0, למשל " + info.rawDisplay + "."
            : "רשמו את המכנה ≠0, למשל " + info.rawDisplay + ".",
      };
    }
    var i;
    for (i = 0; i < need.length; i++) {
      var matched = got.some(function (g) {
        return densEquivalent(g, need[i]);
      });
      if (!matched) {
        return {
          ok: false,
          message: "בדקו את המכנים. אפשר לכתוב למשל " + info.rawDisplay + ", ואז לפתור ל־" + info.display + ".",
        };
      }
    }
    return { ok: true, display: info.rawDisplay, parts: info.rawParts };
  }

  function checkDomainSolved(info, raw) {
    var expected = info.forbidden.slice();
    if (!expected.length) {
      return { ok: true, display: info.display, info: info };
    }
    var allSymbolic = expected.every(function (f) {
      return f.symbolic;
    });
    if (allSymbolic) {
      var want = normalizeDomainTyped(info.display);
      if (raw === want || info.alts.some(function (a) { return normalizeDomainTyped(a) === raw; })) {
        return { ok: true, display: info.display, info: info };
      }
      return { ok: false, message: "בדקו את תחום ההצבה: המכנים עם נעלם לא יכולים להתאפס." };
    }
    var gotVals = parseDomainValues(raw);
    if (!gotVals.length) return { ok: false, emptyVals: true };
    var need = expected.filter(function (f) {
      return !f.symbolic;
    });
    if (gotVals.length !== need.length) {
      return {
        ok: false,
        message:
          "יש " +
          need.length +
          " ערכים אסורים" +
          (info.densCount > 1 ? " (מכנים שונים)" : "") +
          ". תחום ההצבה: " +
          info.display +
          ".",
      };
    }
    var i;
    for (i = 0; i < need.length; i++) {
      var okOne = gotVals.some(function (g) {
        return Math.abs(g - need[i].value) < EPS;
      });
      if (!okOne) {
        return { ok: false, message: "תחום ההצבה אינו מדויק. צפוי: " + info.display + "." };
      }
    }
    return { ok: true, display: info.display, info: info };
  }

  function checkDomainAlgebraStep(previous, typed) {
    var Algebra = global.DoctematicaAlgebra;
    if (!Algebra || typeof Algebra.checkStep !== "function") return { ok: false };
    var prevEq = domainConstraintToEq(previous);
    var nextEq = domainConstraintToEq(typed);
    if (!prevEq || !nextEq || nextEq.indexOf("=") === -1) return { ok: false };
    var res;
    try {
      res = Algebra.checkStep(prevEq, nextEq);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    if (!res || !res.ok) {
      return { ok: false, message: res && res.message };
    }
    var display = prettyDomainTyped(typed);
    if (display.indexOf("≠") === -1 && display.indexOf("=") !== -1) {
      display = domainEqToConstraint(display);
    }
    var isolated = false;
    var isoVal = null;
    try {
      var parsed = Algebra.parseEquation(nextEq);
      var leftX = Math.abs(parsed.left.a - 1) < EPS && Math.abs(parsed.left.b) < EPS;
      var rightX = Math.abs(parsed.right.a - 1) < EPS && Math.abs(parsed.right.b) < EPS;
      if (leftX && Math.abs(parsed.right.a) < EPS) {
        isolated = true;
        isoVal = parsed.right.b;
      } else if (rightX && Math.abs(parsed.left.a) < EPS) {
        isolated = true;
        isoVal = parsed.left.b;
      }
    } catch (err2) {}
    if (res.solved || isolated) {
      if (isoVal != null && Algebra.formatNumber) {
        display = "x≠" + Algebra.formatNumber(isoVal).split(" או ")[0];
      }
      return {
        ok: true,
        phase: "solved",
        display: display,
        message: "זהו הערך האסור.",
      };
    }
    return {
      ok: true,
      phase: "work",
      display: display,
      message: "צעד חוקי. המשיכו לפתור כמו משוואה, עד x≠…",
    };
  }

  function domainNextStep(constraint) {
    var eq = domainConstraintToEq(constraint);
    var act = nextAction(eq);
    if (!act || act.done || !act.eq) {
      return {
        done: true,
        hint: "זה כבר הצורה הסופית: x≠…",
        display: domainEqToConstraint(eq),
      };
    }
    return {
      done: false,
      hint: act.hint,
      display: domainEqToConstraint(act.eq),
    };
  }

  /**
   * Domain check: start from den≠0, then solve like an equation (transfers, divide…).
   * Jumping straight to x≠value is also OK.
   */
  function checkDomain(eqText, typed, opts) {
    opts = opts || {};
    var info = analyzeDomain(eqText);
    if (!info) return { ok: true, skip: true, message: "אין תחום הצבה מיוחד (אין נעלם במכנה)." };
    var raw = normalizeDomainTyped(typed);
    if (!raw) {
      return {
        ok: false,
        message:
          info.count > 1
            ? "רשמו תחום הצבה, למשל " + info.rawDisplay + " ואז " + info.display + "."
            : "רשמו תחום הצבה, למשל " + info.rawDisplay + " או " + info.display + ".",
      };
    }

    var solved = checkDomainSolved(info, raw);
    if (solved.ok) {
      return {
        ok: true,
        done: true,
        phase: "solved",
        display: solved.display,
        info: info,
        message: "תחום ההצבה נרשם.",
      };
    }

    var rawRes = checkDomainRaw(info, raw);
    if (rawRes.ok) {
      return {
        ok: true,
        done: false,
        phase: "raw",
        display: rawRes.display,
        parts: rawRes.parts,
        info: info,
        message: "נכון — המכנה לא יכול להיות 0. עכשיו פתרו כמו משוואה עד " + info.display + ".",
      };
    }

    if (info.items && info.items.length === 1) {
      var one = checkDomainOne(info.items[0].den, typed, {
        previous: opts.previous || info.items[0].rawPart,
        started: !!opts.started,
      });
      if (one.ok) {
        return {
          ok: true,
          done: one.phase === "solved",
          phase: one.phase,
          display: one.display,
          parts: [one.display],
          info: info,
          message: one.message,
        };
      }
      return { ok: false, message: one.message };
    }

    if (solved.message && !solved.emptyVals) {
      return { ok: false, message: solved.message };
    }
    if (rawRes.message) {
      return { ok: false, message: rawRes.message };
    }
    return {
      ok: false,
      message:
        info.densCount > 1
          ? "אפשר קודם " + info.rawDisplay + ", ואז לפתור כל מכנה כמו משוואה עד " + info.display + "."
          : "אפשר קודם " + info.rawDisplay + ", ואז לפתור עד " + info.display + ".",
    };
  }

  function checkDomainOne(denExpr, typed, opts) {
    opts = opts || {};
    var item = domainItemFromDen(denExpr);
    var raw = normalizeDomainTyped(typed);
    if (!raw) return { ok: false, message: "רשמו את התנאי." };
    var prev = opts.previous || item.rawPart;
    var started = !!opts.started;

    if (item.solvedPart && normalizeDomainTyped(item.solvedPart) === raw) {
      return { ok: true, phase: "solved", display: item.solvedPart };
    }

    var vals = parseDomainValues(raw);
    if (vals.length === 1 && item.forbidden && !item.forbidden.symbolic) {
      if (Math.abs(vals[0] - item.forbidden.value) < EPS) {
        return { ok: true, phase: "solved", display: item.solvedPart };
      }
    }

    var got = parseDomainRawExprs(raw);
    var isRawDen =
      (got.length >= 1 && got.some(function (g) { return densEquivalent(g, item.den); })) ||
      (densEquivalent(raw.replace(/≠0$/, ""), item.den) && /≠0$/.test(raw));
    if (isRawDen) {
      if (started && normalizeDomainTyped(prev) === raw) {
        return { ok: false, message: "זו אותה כתיבה. המשיכו לפתור כמו משוואה עד " + item.solvedPart + "." };
      }
      return {
        ok: true,
        phase: "raw",
        display: item.rawPart,
        message: "נכון — המכנה ≠ 0. עכשיו פתרו כמו משוואה עד " + item.solvedPart + ".",
      };
    }

    var alg = checkDomainAlgebraStep(prev, typed);
    if (alg.ok) {
      if (alg.phase === "solved") {
        if (item.forbidden && !item.forbidden.symbolic) {
          var gotSol = parseDomainValues(normalizeDomainTyped(alg.display));
          if (gotSol.length === 1 && Math.abs(gotSol[0] - item.forbidden.value) < EPS) {
            return { ok: true, phase: "solved", display: item.solvedPart, message: alg.message };
          }
        }
        if (item.solvedPart && normalizeDomainTyped(item.solvedPart) === normalizeDomainTyped(alg.display)) {
          return { ok: true, phase: "solved", display: item.solvedPart, message: alg.message };
        }
        return alg;
      }
      return alg;
    }

    return {
      ok: false,
      message: alg.message || ("למכנה " + item.den + " — פתרו כמו משוואה, מ-" + item.rawPart + " עד " + item.solvedPart + "."),
    };
  }

  function nextUnsolvedDomainItem(prog, items) {
    var i;
    for (i = 0; i < items.length; i++) {
      if (!prog[i] || prog[i].phase !== "solved") return i;
    }
    return -1;
  }

  function domainProgressDone(prog, items) {
    var i;
    var n = Math.max(prog.length, items.length);
    for (i = 0; i < n; i++) {
      if (!prog[i] || prog[i].phase !== "solved") return false;
    }
    return items.length > 0;
  }

  function domainItemTaken(prog, itemIdx, exceptSlot) {
    var s;
    for (s = 0; s < prog.length; s++) {
      if (s === exceptSlot) continue;
      if (prog[s] && prog[s].itemIndex === itemIdx && (prog[s].phase || (prog[s].trail && prog[s].trail.length))) {
        return true;
      }
    }
    return false;
  }

  function domainProgressDisplay(prog, items) {
    return items
      .map(function (it, i) {
        return (prog[i] && prog[i].display) || it.solvedPart;
      })
      .join(", ");
  }

  /** Multi-den domain: one value at a time, or split by branch. Full line still OK. */
  function checkDomainProgress(eqText, typed, progress, opts) {
    opts = opts || {};
    progress = progress || { items: [], split: false, activeBranch: 0 };

    var full = checkDomain(eqText, typed, opts);
    if (full.ok && full.done) return full;

    var info = analyzeDomain(eqText);
    if (!info || !info.items || info.items.length <= 1) {
      return checkDomain(eqText, typed, opts);
    }

    var items = info.items;
    var prog = progress.items || [];
    while (prog.length < items.length) prog.push({ phase: null, trail: [], itemIndex: null });

    var slot = progress.split ? progress.activeBranch || 0 : -1;
    var indices = [];
    if (progress.split) {
      if (prog[slot] && prog[slot].itemIndex != null) {
        indices = [prog[slot].itemIndex];
      } else {
        var u;
        for (u = 0; u < items.length; u++) {
          if (!domainItemTaken(prog, u, slot)) indices.push(u);
        }
      }
    } else {
      for (u = 0; u < items.length; u++) {
        if (prog[u].phase !== "solved") indices.push(u);
      }
    }

    var j;
    for (j = 0; j < indices.length; j++) {
      var denIdx = indices[j];
      var slotIdx = progress.split ? slot : denIdx;
      var prev =
        prog[slotIdx].trail && prog[slotIdx].trail.length
          ? prog[slotIdx].trail[prog[slotIdx].trail.length - 1].display
          : items[denIdx].rawPart;
      var one = checkDomainOne(items[denIdx].den, typed, {
        previous: prev,
        started: !!(prog[slotIdx].trail && prog[slotIdx].trail.length),
      });
      if (!one.ok) continue;

      var progCopy = prog.slice();
      progCopy[slotIdx] = {
        phase: one.phase === "solved" ? "solved" : one.phase,
        display: one.phase === "solved" ? one.display : progCopy[slotIdx] && progCopy[slotIdx].display,
        itemIndex: denIdx,
        trail: (progCopy[slotIdx] && progCopy[slotIdx].trail ? progCopy[slotIdx].trail.slice() : []).concat([
          { display: one.display },
        ]),
      };

      var allDone = domainProgressDone(progCopy, items);
      if (one.phase === "raw" || one.phase === "work") {
        return {
          ok: true,
          done: false,
          partial: true,
          itemIndex: slotIdx,
          phase: one.phase,
          display: one.display,
          info: info,
          progressItems: progCopy,
          message: one.message || "צעד חוקי. המשיכו לפתור עד x≠…",
        };
      }

      if (allDone) {
        return {
          ok: true,
          done: true,
          partial: true,
          itemIndex: slotIdx,
          phase: "solved",
          display: info.display,
          info: info,
          progressItems: progCopy,
          message: "תחום ההצבה נרשם.",
        };
      }

      var nextIdx = nextUnsolvedDomainItem(progCopy, items);
      return {
        ok: true,
        done: false,
        partial: true,
        itemIndex: slotIdx,
        phase: "solved",
        display: one.display,
        info: info,
        progressItems: progCopy,
        nextBranch: nextIdx,
        message: "נכון. עכשיו מלאו את התא השני (המכנה שעוד לא בדקתם).",
      };
    }

    if (full.ok && !full.done) return full;

    var gotVals = parseDomainValues(normalizeDomainTyped(typed));
    if (gotVals.length === 1 && !progress.split) {
      return {
        ok: false,
        message: "נכון חלקית — רשמו ערך אחד בכל פעם, או פצלו לשני עמודות.",
      };
    }

    return {
      ok: false,
      message: progress.split
        ? "רשמו תנאי לאחד המכנים שנותרו (מכנה≠0 או x≠…)."
        : "רשמו ערך אחד בכל פעם (למשל " +
          items[0].solvedPart +
          "), או פצלו לימין ושמאל.",
    };
  }

  /** Factor list for LCD: numeric part + algebraic factor strings. */
  function denFactors(denExpr) {
    var d = unwrapOuterParens(denExpr);
    var c = canonExpr(d);
    if (!c || c === "1") return { numeric: 1, factors: [] };
    if (/^\d+$/.test(c)) return { numeric: parseInt(c, 10), factors: [] };
    var peel = peelNumericFactor(d);
    if (peel) {
      var inner = denFactors(peel.inner);
      return { numeric: peel.numeric * inner.numeric, factors: inner.factors };
    }
    var diff = c.match(/^x(?:\^2|²)-(\d+)$/);
    if (diff) {
      var n = parseInt(diff[1], 10);
      var r = Math.round(Math.sqrt(n));
      if (r * r === n && r > 0) {
        return { numeric: 1, factors: ["x-" + r, "x+" + r] };
      }
    }
    var lin = parseAxPlusB(d);
    if (lin && !near0(lin.a)) {
      var ai = Math.round(lin.a);
      var bi = Math.round(lin.b);
      if (Math.abs(ai - lin.a) < EPS && Math.abs(bi - lin.b) < EPS) {
        var g = gcdInt(Math.abs(ai), Math.abs(bi));
        if (g > 1) {
          return { numeric: g, factors: [formatAxPlusB(ai / g, bi / g)] };
        }
      }
    }
    return { numeric: 1, factors: [d] };
  }

  function isSimpleLcdFactor(f) {
    var t = unwrapOuterParens(String(f || ""));
    return /^[a-z]$/i.test(t) || /^\d+$/.test(t);
  }

  /** Prefer bare letter/number left of parentheses: x(x-7), not (x-7)x. */
  function sortLcdFactors(factors) {
    return (factors || []).slice().sort(function (a, b) {
      var sa = isSimpleLcdFactor(a) ? 0 : 1;
      var sb = isSimpleLcdFactor(b) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return canonExpr(a).localeCompare(canonExpr(b));
    });
  }

  function formatLcdFactors(num, factors) {
    var s = "";
    if (num > 1) s += String(num);
    var ordered = sortLcdFactors(factors);
    var i;
    for (i = 0; i < ordered.length; i++) {
      var f = ordered[i];
      if (/^[a-z]$/i.test(f) || /^\d+$/.test(f)) s += f;
      else s += "(" + unwrapOuterParens(f) + ")";
    }
    return s || "1";
  }

  /** Parse typed LCD / multiplier product into {numeric, factors}, order-agnostic. */
  function parseLcdProduct(typed) {
    var t = canonExpr(typed).replace(/\*/g, "");
    if (!t || t === "0") return null;
    if (t === "1") return { numeric: 1, factors: [] };
    var num = 1;
    var factors = [];
    var i = 0;
    while (i < t.length) {
      if (/\d/.test(t.charAt(i))) {
        var dig = t.slice(i).match(/^\d+/);
        if (!dig) return null;
        num *= parseInt(dig[0], 10);
        i += dig[0].length;
        continue;
      }
      if (t.charAt(i) === "(") {
        var depth = 0;
        var j = i;
        for (; j < t.length; j++) {
          if (t.charAt(j) === "(") depth += 1;
          else if (t.charAt(j) === ")") {
            depth -= 1;
            if (depth === 0) {
              j += 1;
              break;
            }
          }
        }
        if (depth !== 0) return null;
        var inner = unwrapOuterParens(t.slice(i, j));
        if (!inner) return null;
        var peeled = denFactors(inner);
        num *= peeled.numeric;
        factors = factors.concat(peeled.factors);
        i = j;
        continue;
      }
      if (/[a-z]/i.test(t.charAt(i))) {
        if (t.slice(i, i + 3) === "x^2") {
          factors.push("x^2");
          i += 3;
          continue;
        }
        factors.push(t.charAt(i));
        i += 1;
        continue;
      }
      return null;
    }
    return { numeric: num, factors: factors };
  }

  function lcdPackKey(pack) {
    if (!pack) return "";
    var fs = (pack.factors || [])
      .map(function (f) {
        return canonExpr(unwrapOuterParens(f));
      })
      .sort();
    return String(pack.numeric || 1) + "|" + fs.join(",");
  }

  function lcdFromDenExprs(denExprs) {
    var num = 1;
    var factors = [];
    var seen = {};
    var i;
    for (i = 0; i < denExprs.length; i++) {
      var parts = denFactors(denExprs[i]);
      num = lcmInt(num, parts.numeric);
      var j;
      for (j = 0; j < parts.factors.length; j++) {
        var fk = canonExpr(parts.factors[j]);
        if (seen[fk]) continue;
        seen[fk] = true;
        factors.push(parts.factors[j]);
      }
    }
    factors = sortLcdFactors(factors);
    var display = formatLcdFactors(num, factors);
    return { numeric: num, factors: factors, display: display };
  }

  function mulDisplay(num, factors) {
    return formatLcdFactors(num, factors);
  }

  /** Multiplier = LCD / termDen as {numeric, factors, display}. */
  function mulForDen(lcdPack, denExpr) {
    var den = denFactors(denExpr);
    if (lcdPack.numeric % den.numeric !== 0) return null;
    var num = lcdPack.numeric / den.numeric;
    var left = [];
    var need = {};
    var i;
    for (i = 0; i < den.factors.length; i++) {
      var dk = canonExpr(den.factors[i]);
      need[dk] = (need[dk] || 0) + 1;
    }
    var pool = {};
    for (i = 0; i < lcdPack.factors.length; i++) {
      var lk = canonExpr(lcdPack.factors[i]);
      pool[lk] = (pool[lk] || 0) + 1;
    }
    for (i = 0; i < den.factors.length; i++) {
      var k = canonExpr(den.factors[i]);
      if (!pool[k]) return null;
      pool[k] -= 1;
    }
    for (i = 0; i < lcdPack.factors.length; i++) {
      var fk = canonExpr(lcdPack.factors[i]);
      if (pool[fk] > 0) {
        left.push(lcdPack.factors[i]);
        pool[fk] -= 1;
      }
    }
    return { numeric: num, factors: left, display: mulDisplay(num, left) };
  }

  function normalizeLcdTyped(typed) {
    return unwrapOuterParens(canonExpr(typed).replace(/\*/g, ""));
  }

  function stripTermDen(term) {
    var info = splitTermDenExpr(term);
    return {
      sign: info.sign,
      body: info.body,
      den: info.numeric,
      denExpr: info.denExpr,
      hasVar: info.hasVar,
    };
  }

  function applyLeadingMul(body, mul) {
    if (mul === 1 || mul === "1") return body;
    if (typeof mul === "string" && !/^\d+$/.test(mul)) {
      return applyExprMul(body, mul);
    }
    var nMul = typeof mul === "number" ? mul : parseFloat(mul);
    if (!(nMul > 0) && nMul !== 0) return body;
    if (nMul === 1) return body;
    if (/^\d+(?:\.\d+)?/.test(body)) {
      var nm = body.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (nm) {
        var n = parseFloat(nm[1], 10) * nMul;
        var rest = nm[2] || "";
        if (Math.abs(n - 1) < EPS && /^x/i.test(rest)) return rest;
        if (Math.abs(n + 1) < EPS && /^x/i.test(rest)) return "-" + rest;
        if (near0(n) && !rest) return "0";
        return fmt(n) + rest;
      }
    }
    if (/^x/i.test(body)) {
      if (nMul === -1) return "-" + body;
      return fmt(nMul) + body;
    }
    return fmt(nMul) + body;
  }

  /** Multiply numerator body by a multiplier that may include x (e.g. "5", "x", "5x", "(x+2)"). */
  function applyExprMul(body, mulDisp) {
    var rawMul = String(mulDisp == null ? "1" : mulDisp)
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    if (!rawMul || rawMul === "1") return body;
    var b = String(body || "");
    if (b === "0" || near0(parseFloat(b))) return "0";

    if (/^\d+$/.test(rawMul)) {
      return applyLeadingMul(b, parseInt(rawMul, 10));
    }

    var coef = 1;
    var alg = rawMul;
    var mCoef = rawMul.match(/^(\d+)(\(.*\)|[a-z].*)$/i);
    if (mCoef) {
      coef = parseInt(mCoef[1], 10);
      alg = mCoef[2];
    }

    function wrapAlg(expr) {
      var e = unwrapOuterParens(expr);
      if (/^[a-z]$/i.test(e) || /^\d+$/.test(e)) return e;
      if (/^[a-z]\^?\d*$/i.test(e)) return e;
      return "(" + e + ")";
    }

    if (/^\d+(?:\.\d+)?$/.test(b)) {
      var n = parseFloat(b) * coef;
      var w = wrapAlg(alg);
      if (Math.abs(n - 1) < EPS) return w.charAt(0) === "(" ? w : w;
      if (Math.abs(n + 1) < EPS) return "-" + w;
      if (w.charAt(0) === "(" || /^[a-z]/i.test(w)) return fmt(n) + w;
      return fmt(n) + "(" + w + ")";
    }

    if (/^x$/i.test(b) && /^x$/i.test(unwrapOuterParens(alg)) && coef === 1) {
      return "x^2";
    }

    var left = b;
    if (!/^\(.*\)$/.test(left) && /[+\-]/.test(left)) left = "(" + left + ")";
    if (coef !== 1) return fmt(coef) + left + wrapAlg(alg);
    return left + wrapAlg(alg);
  }

  function applySign(sign, cleared) {
    if (sign !== "-") return cleared;
    if (cleared.charAt(0) === "-") return cleared.slice(1);
    return "-" + cleared;
  }

  function clearTermDen(term, lcdOrMul) {
    var parts = stripTermDen(term);
    if (lcdOrMul && typeof lcdOrMul === "object" && lcdOrMul.display != null) {
      var clearedObj = applyExprMul(parts.body, lcdOrMul.display);
      return applySign(parts.sign, clearedObj);
    }
    if (typeof lcdOrMul === "string" && !/^\d+$/.test(lcdOrMul)) {
      return applySign(parts.sign, applyExprMul(parts.body, lcdOrMul));
    }
    var lcd = typeof lcdOrMul === "number" ? lcdOrMul : parseInt(lcdOrMul, 10);
    if (!(lcd > 0) || lcd % parts.den !== 0) return term;
    var mul = lcd / parts.den;
    return applySign(parts.sign, applyLeadingMul(parts.body, mul));
  }

  function clearEqDens(eqText) {
    var info = analyzeLcdNeed(eqText);
    if (info && info.terms && info.terms.length) {
      var left = joinPrettyParts(
        info.terms
          .filter(function (t) {
            return t.side === "L";
          })
          .map(function (t) {
            return clearTermDen(t.text, { display: String(t.mul) });
          })
      );
      var right = joinPrettyParts(
        info.terms
          .filter(function (t) {
            return t.side === "R";
          })
          .map(function (t) {
            return clearTermDen(t.text, { display: String(t.mul) });
          })
      );
      var next = left + " = " + right;
      if (key(next) === key(eqText)) return null;
      return next;
    }
    return dropSharedDens(eqText);
  }

  /** When every term already shares one denominator — just cancel/drop it. */
  function dropSharedDens(eqText) {
    var lcd = sharedLcd(eqText);
    if (!lcd || lcd === 0 || lcd === "1" || lcd <= 1 && typeof lcd === "number") return null;
    var sides = splitEq(eqText);
    if (!sides) return null;
    if (
      /^\s*x\s*$/i.test(sides.left) ||
      /^\s*x\s*$/i.test(sides.right) ||
      /^\s*(x\^2|x²)\s*$/i.test(sides.left) ||
      /^\s*(x\^2|x²)\s*$/i.test(sides.right)
    ) {
      var isolatedDrop = /^\s*(x\^2|x²|x)\s*$/i.test(sides.left) ? sides.right : sides.left;
      var otherHasVarDenDrop = splitRawTerms(isolatedDrop).some(function (term) {
        return splitTermDenExpr(term).hasVar;
      });
      if (!otherHasVarDenDrop) return null;
    }
    var isAlg = typeof lcd === "string";
    var left;
    var right;
    if (isAlg) {
      left = joinPrettyParts(
        splitRawTerms(sides.left).map(function (t) {
          var p = stripTermDen(t);
          return applySign(p.sign, p.body);
        })
      );
      right = joinPrettyParts(
        splitRawTerms(sides.right).map(function (t) {
          var p = stripTermDen(t);
          return applySign(p.sign, p.body);
        })
      );
    } else {
      left = joinPrettyParts(
        splitRawTerms(sides.left).map(function (t) {
          return clearTermDen(t, lcd);
        })
      );
      right = joinPrettyParts(
        splitRawTerms(sides.right).map(function (t) {
          return clearTermDen(t, lcd);
        })
      );
    }
    var next = left + " = " + right;
    if (key(next) === key(eqText)) return null;
    return next;
  }

  function formatLcdPiece(nx, nb, lcd) {
    var bits = [];
    if (!near0(nx)) {
      if (Math.abs(nx - 1) < EPS) bits.push("x/" + lcd);
      else if (Math.abs(nx + 1) < EPS) bits.push("−x/" + lcd);
      else bits.push(fmt(nx) + "x/" + lcd);
    }
    if (!near0(nb)) bits.push(fmt(nb) + "/" + lcd);
    if (!bits.length) return "0";
    return joinPrettyParts(bits);
  }

  function rewriteTermLcd(term, lcd, decimals) {
    var cf = parseCompoundFrac(term);
    if (cf) {
      var signed = (cf.sign === "-" ? -1 : 1) * cf.k * (lcd / cf.den);
      return formatCompoundFrac(signed, cf.inner, lcd);
    }
    var d = termDen(term);
    var parsed;
    try {
      parsed = global.DoctematicaAlgebra.parseEquation(term + "=0");
    } catch (err) {
      return term;
    }
    if (d === 1) {
      return formatLcdPiece(
        Math.round(parsed.left.a * lcd),
        Math.round(parsed.left.b * lcd),
        lcd
      );
    }
    var nx = Math.round(parsed.left.a * lcd);
    var nb = Math.round(parsed.left.b * lcd);
    return formatLcdPiece(nx, nb, lcd);
  }

  /** Keep multipliers explicit (notebook style) — student computes the products next. */
  function rewriteTermLcdKeepMul(term, lcd) {
    var cf = parseCompoundFrac(term);
    if (cf) {
      var signed = (cf.sign === "-" ? -1 : 1) * cf.k * (lcd / cf.den);
      return formatCompoundFrac(signed, cf.inner, lcd);
    }
    var raw = String(term || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var neg = false;
    if (raw.charAt(0) === "+") raw = raw.slice(1);
    if (raw.charAt(0) === "-") {
      neg = true;
      raw = raw.slice(1);
    }
    var wrapped = raw.match(/^\((\d+)\/(\d+)\)x$/i);
    var d;
    var numBody;
    if (wrapped) {
      d = parseInt(wrapped[2], 10);
      numBody = wrapped[1] + "x";
    } else {
      d = termDen(raw);
      numBody = raw;
      if (d > 1) {
        var mFrac = raw.match(/^(.*)\/(\d+)$/);
        if (mFrac && parseInt(mFrac[2], 10) === d) numBody = mFrac[1];
      }
    }
    if (!(d > 0) || lcd % d !== 0) return term;
    var mul = lcd / d;
    if (mul === 1) return (neg ? "−" : "") + numBody + "/" + lcd;
    return formatCompoundFrac(neg ? -mul : mul, numBody, lcd);
  }

  function lcdOfDens(dens) {
    if (!dens.length) return 1;
    var L = dens[0];
    var i;
    for (i = 1; i < dens.length; i++) L = lcmInt(L, dens[i]);
    return L;
  }

  function densOfSide(side) {
    return splitRawTerms(side).map(termDen);
  }

  function allDensEq(dens, d) {
    return dens.length > 0 && dens.every(function (x) {
      return x === d;
    });
  }

  function isBareXOverNumber(side) {
    var t = String(side || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    return /^\(?(x\^2|x²|x)\)?\/(\d+(?:\.\d+)?)$/i.test(t);
  }

  function isPlainNumberSideEarly(side) {
    var t = String(side || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    return /^-?\d+(\.\d+)?$/.test(t) || /^-?\d+\/\d+$/.test(t) || /^\(-?\d+\/\d+\)$/.test(t);
  }

  /**
   * מכנה מספרי רק בצד אחד (הצד השני בלי שברים).
   * הצעד המומלץ: כפל שני האגפים במכנה — לא מכנה משותף.
   * מחזיר את המכנה D, או null.
   */
  function oneSidedNumericDenom(eqText) {
    var sides = splitEq(eqText);
    if (!sides) return null;
    if (eqHasVarDenom(eqText)) return null;
    if (isSimpleCoeffFracEq(sides)) return null;
    if (
      /^\s*(x\^2|x²|x)\s*$/i.test(sides.left) ||
      /^\s*(x\^2|x²|x)\s*$/i.test(sides.right)
    ) {
      return null;
    }
    if (isBareXOverNumber(sides.left) && isPlainNumberSideEarly(sides.right)) return null;
    if (isBareXOverNumber(sides.right) && isPlainNumberSideEarly(sides.left)) return null;
    var denL = densOfSide(sides.left);
    var denR = densOfSide(sides.right);
    var D = 0;
    if (allDensEq(denL, 1) && denR.length && denR.every(function (d) {
      return d > 1;
    }) && allDensEq(denR, denR[0])) {
      D = denR[0];
    } else if (
      allDensEq(denR, 1) &&
      denL.length &&
      denL.every(function (d) {
        return d > 1;
      }) &&
      allDensEq(denL, denL[0])
    ) {
      D = denL[0];
    } else {
      return null;
    }
    return D > 1 ? D : null;
  }

  function unwrapSimpleProductParens(s) {
    var t = String(s || "").trim();
    var m = t.match(/^\(([^()]+)\)$/);
    if (!m) return s;
    var inner = m[1].replace(/×/g, "*").replace(/\s+/g, "");
    if (/[+\-]/.test(inner.replace(/^-/, ""))) return s;
    var p = inner.match(/^(\d+(?:\.\d+)?)\*([xyXY])$/);
    if (p) return p[1] + p[2];
    var p2 = inner.match(/^([xyXY])\*(\d+(?:\.\d+)?)$/);
    if (p2) return p2[2] + p2[1];
    return inner;
  }

  function oneSidedDenomClearStep(eqText, decimals) {
    var D = oneSidedNumericDenom(eqText);
    if (!D) return null;
    var sides = splitEq(eqText);
    var left = joinPrettyParts(
      splitRawTerms(sides.left).map(function (t) {
        return unwrapSimpleProductParens(clearTermDen(t, D));
      })
    );
    var right = joinPrettyParts(
      splitRawTerms(sides.right).map(function (t) {
        return unwrapSimpleProductParens(clearTermDen(t, D));
      })
    );
    var next = left + " = " + right;
    if (key(next) === key(eqText)) return null;
    var denShow = fmt(D, decimals);
    return {
      eq: next,
      hint: "כפלו את שני האגפים במכנה " + denShow + ". המכנה רק בצד אחד — אין צורך במכנה משותף.",
      explain: "מעבירים את המכנה " + denShow + " בכפל לשני האגפים.",
    };
  }

  function analyzeLcdNeed(eqText) {
    var sides = splitEq(eqText);
    if (!sides) return null;
    if (oneSidedNumericDenom(eqText)) return null;
    if (
      /^\s*x\s*$/i.test(sides.left) ||
      /^\s*x\s*$/i.test(sides.right) ||
      /^\s*(x\^2|x²)\s*$/i.test(sides.left) ||
      /^\s*(x\^2|x²)\s*$/i.test(sides.right)
    ) {
      var isolated = /^\s*(x\^2|x²|x)\s*$/i.test(sides.left) ? sides.right : sides.left;
      var otherHasVarDen = splitRawTerms(isolated).some(function (term) {
        return splitTermDenExpr(term).hasVar;
      });
      if (!otherHasVarDen) return null;
    }
    if (isSimpleCoeffFracEq(sides)) return null;
    if (isCoeffFracEquateLinear(sides)) return null;
    var leftTerms = splitRawTerms(sides.left);
    var rightTerms = splitRawTerms(sides.right);
    var all = leftTerms.concat(rightTerms);
    var denInfos = all.map(splitTermDenExpr);
    var hasAlg = denInfos.some(function (d) {
      return d.hasVar;
    });

    if (hasAlg) {
      var denExprs = denInfos.map(function (d) {
        return d.denExpr;
      });
      var uniqExpr = [];
      denExprs.forEach(function (e) {
        var k = canonExpr(e);
        if (k === "1") return;
        if (
          !uniqExpr.some(function (u) {
            return canonExpr(u) === k;
          })
        ) {
          uniqExpr.push(e);
        }
      });
      var hasDen1 = denExprs.some(function (e) {
        return canonExpr(e) === "1";
      });
      var allSame =
        uniqExpr.length === 1 &&
        !hasDen1 &&
        denExprs.every(function (e) {
          return canonExpr(e) === "1" || canonExpr(e) === canonExpr(uniqExpr[0]);
        });
      // If every non-1 den is identical and there is no integer term — drop dens instead.
      if (allSame && uniqExpr.length === 1) return null;
      if (uniqExpr.length < 1) return null;
      if (uniqExpr.length < 2 && !hasDen1) return null;
      var pack = lcdFromDenExprs(denExprs.filter(function (e) {
        return canonExpr(e) !== "1";
      }));
      if (pack.display === "1") return null;
      var terms = [];
      var i;
      for (i = 0; i < leftTerms.length; i++) {
        var mL = mulForDen(pack, denInfos[i].denExpr);
        if (!mL) return null;
        terms.push({
          text: leftTerms[i],
          den: denInfos[i].hasVar ? denInfos[i].denExpr : denInfos[i].numeric,
          denExpr: denInfos[i].denExpr,
          mul: mL.display === "1" ? 1 : /^\d+$/.test(mL.display) ? parseInt(mL.display, 10) : mL.display,
          mulDisplay: mL.display,
          side: "L",
        });
      }
      for (i = 0; i < rightTerms.length; i++) {
        var idx = leftTerms.length + i;
        var mR = mulForDen(pack, denInfos[idx].denExpr);
        if (!mR) return null;
        terms.push({
          text: rightTerms[i],
          den: denInfos[idx].hasVar ? denInfos[idx].denExpr : denInfos[idx].numeric,
          denExpr: denInfos[idx].denExpr,
          mul: mR.display === "1" ? 1 : /^\d+$/.test(mR.display) ? parseInt(mR.display, 10) : mR.display,
          mulDisplay: mR.display,
          side: "R",
        });
      }
      return {
        lcd: pack.display,
        lcdPack: pack,
        algebraic: true,
        leftTerms: leftTerms,
        rightTerms: rightTerms,
        terms: terms,
        dens: denExprs,
      };
    }

    var dens = all.map(termDen);
    var fracDens = dens.filter(function (d) {
      return d > 1;
    });
    var uniq = [];
    fracDens.forEach(function (d) {
      if (uniq.indexOf(d) === -1) uniq.push(d);
    });
    function sideMixed(terms) {
      var hasFracX = false;
      var hasIntX = false;
      var i;
      for (i = 0; i < terms.length; i++) {
        if (!/x/i.test(terms[i])) continue;
        if (termDen(terms[i]) > 1) hasFracX = true;
        else hasIntX = true;
      }
      return hasFracX && hasIntX;
    }
    var mixedX = sideMixed(leftTerms) || sideMixed(rightTerms);
    var hasDen1 = dens.some(function (d) {
      return d === 1;
    });
    if (uniq.length < 2 && !mixedX && !(uniq.length >= 1 && hasDen1)) return null;
    var lcd = lcdOfDens(uniq.length ? uniq : dens.filter(function (d) { return d > 1; }));
    if (mixedX) {
      var extra = dens.filter(function (d) {
        return d > 1;
      });
      lcd = lcdOfDens(extra);
    }
    if (lcd <= 1) return null;
    var termsN = [];
    function pushSide(list, side) {
      var i;
      for (i = 0; i < list.length; i++) {
        var den = termDen(list[i]);
        if (lcd % den !== 0) return false;
        termsN.push({
          text: list[i],
          den: den,
          denExpr: String(den),
          mul: lcd / den,
          mulDisplay: String(lcd / den),
          side: side,
        });
      }
      return true;
    }
    if (!pushSide(leftTerms, "L") || !pushSide(rightTerms, "R")) return null;
    return {
      lcd: lcd,
      algebraic: false,
      leftTerms: leftTerms,
      rightTerms: rightTerms,
      terms: termsN,
      dens: dens,
    };
  }

  function lcdStep(eqText, decimals) {
    var info = analyzeLcdNeed(eqText);
    if (!info) return null;
    var lcd = info.lcd;
    if (info.algebraic) {
      var cleared = clearEqDens(eqText);
      if (!cleared) return null;
      return {
        eq: cleared,
        hint: "הביאו למכנה משותף " + lcd + " (כפלו והורידו מכנים).",
        explain: "המכנה המשותף הוא " + lcd + ". כופלים ומורידים מכנים.",
      };
    }
    var left = joinPrettyParts(
      info.leftTerms.map(function (t) {
        return rewriteTermLcd(t, lcd, decimals);
      })
    );
    var right = joinPrettyParts(
      info.rightTerms.map(function (t) {
        return rewriteTermLcd(t, lcd, decimals);
      })
    );
    var next = left + " = " + right;
    if (key(next) === key(eqText)) return null;
    return {
      eq: next,
      hint: "הביאו למכנה משותף " + lcd + ".",
      explain: "המכנה המשותף האידיאלי הוא " + lcd + ".",
    };
  }

  function checkLcdValue(eqText, typed) {
    var info = analyzeLcdNeed(eqText);
    if (!info) return { ok: false, message: "כרגע אין צורך במכנה משותף במשוואה הזו." };
    var raw = normalizeLcdTyped(typed);
    if (!raw || raw === "0") {
      return {
        ok: false,
        message: info.algebraic
          ? "רשמו את המכנה המשותף (מספר, או ביטוי עם x כמו 5x)."
          : "רשמו את המכנה המשותף כמספר שלם חיובי.",
      };
    }
    if (info.algebraic) {
      var gotPack = parseLcdProduct(raw);
      var wantPack = info.lcdPack || parseLcdProduct(String(info.lcd));
      var matched =
        gotPack &&
        wantPack &&
        lcdPackKey(gotPack) === lcdPackKey(wantPack);
      if (!matched && normalizeLcdTyped(raw) !== normalizeLcdTyped(String(info.lcd))) {
        if (/^\d+$/.test(raw) && info.lcdPack && info.lcdPack.factors.length) {
          return {
            ok: false,
            message: "המכנה המשותף צריך לכלול גם את הנעלם שבמכנים. נסו " + info.lcd + ".",
          };
        }
        return {
          ok: false,
          reduced: true,
          lcd: info.lcd,
          message: "יש מכנה משותף מצומצם יותר: " + info.lcd + ".",
        };
      }
      return { ok: true, lcd: info.lcd, info: info, message: "עכשיו רשמו מעל כל איבר בכמה מכפילים." };
    }
    if (!/^\d+$/.test(raw)) {
      return { ok: false, message: "רשמו את המכנה המשותף כמספר שלם חיובי." };
    }
    var got = parseInt(raw, 10);
    var i;
    for (i = 0; i < info.dens.length; i++) {
      if (got % info.dens[i] !== 0) {
        return {
          ok: false,
          message: "זה לא מכנה משותף לכל האיברים. המכנה צריך להתחלק בכל המכנים שבמשוואה.",
        };
      }
    }
    if (got !== info.lcd) {
      return {
        ok: false,
        reduced: true,
        lcd: info.lcd,
        message: "יש מכנה משותף מצומצם יותר: " + info.lcd + ".",
      };
    }
    return { ok: true, lcd: info.lcd, info: info, message: "עכשיו רשמו מעל כל איבר בכמה מכפילים." };
  }

  function checkLcdMultiplier(termInfo, typed) {
    var raw = String(typed || "")
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/×|·|\*/g, "");
    if (!raw || raw === "0") {
      return { ok: false, message: "רשמו מעל האיבר בכמה מכפילים (מספר או ביטוי כמו x)." };
    }
    var wantStr = String(termInfo.mulDisplay != null ? termInfo.mulDisplay : termInfo.mul);
    var gotPack = parseLcdProduct(raw);
    var wantPack = parseLcdProduct(wantStr);
    if (
      gotPack &&
      wantPack &&
      lcdPackKey(gotPack) === lcdPackKey(wantPack)
    ) {
      return { ok: true, message: "נכון." };
    }
    if (normalizeLcdTyped(raw) === normalizeLcdTyped(wantStr)) {
      return { ok: true, message: "נכון." };
    }
    return {
      ok: false,
      message: "בדקו בכמה מכפילים: המכנה המשותף חלקי המכנה של האיבר הזה.",
    };
  }

  function rewriteEqWithLcd(eqText, lcd) {
    var sides = splitEq(eqText);
    if (!sides) return null;
    var left = joinPrettyParts(
      splitRawTerms(sides.left).map(function (t) {
        return rewriteTermLcdKeepMul(t, lcd);
      })
    );
    var right = joinPrettyParts(
      splitRawTerms(sides.right).map(function (t) {
        return rewriteTermLcdKeepMul(t, lcd);
      })
    );
    return left + " = " + right;
  }

  function sharedLcd(eqText) {
    var sides = splitEq(eqText);
    if (!sides) return 0;
    var terms = splitRawTerms(sides.left).concat(splitRawTerms(sides.right));
    var dens = [];
    var denExprs = [];
    var i;
    for (i = 0; i < terms.length; i++) {
      var t = String(terms[i])
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
        .replace(/^[+-]/, "");
      if (t === "0") continue;
      var info = splitTermDenExpr(terms[i]);
      dens.push(info.hasVar ? 0 : info.numeric);
      denExprs.push(info.denExpr);
    }
    if (!denExprs.length) return 0;
    if (denExprs.some(function (e) { return /x/i.test(e); })) {
      var first = null;
      for (i = 0; i < denExprs.length; i++) {
        if (canonExpr(denExprs[i]) === "1") return 0;
        if (!first) first = denExprs[i];
        else if (canonExpr(denExprs[i]) !== canonExpr(first)) return 0;
      }
      return first || 0;
    }
    var d0 = dens[0];
    if (d0 <= 1) return 0;
    for (i = 1; i < dens.length; i++) {
      if (dens[i] !== d0) return 0;
    }
    return d0;
  }

  function dropDenomsStep(eqText, decimals) {
    var dropped = dropSharedDens(eqText);
    if (!dropped) return null;
    var lcd = sharedLcd(eqText);
    return {
      eq: dropped,
      hint: "כופלו את שני האגפים במכנה המשותף " + lcd + ", כדי להוריד את המכנים.",
      explain: "כל המכנים זהים (" + lcd + "). כופלים את שני האגפים ב־" + lcd + " ומורידים את המכנים.",
    };
  }

  function joinPrettyParts(parts) {
    var cleaned = (parts || []).filter(function (p) {
      return p != null && String(p).trim() !== "" && String(p).trim() !== "+";
    });
    if (!cleaned.length) return "0";
    var out = stripLeadingPlus(String(cleaned[0]).trim());
    var i;
    for (i = 1; i < cleaned.length; i++) {
      var p = String(cleaned[i]).trim();
      if (/^[−-]/.test(p)) out += " " + p;
      else out += " + " + p;
    }
    return out;
  }

  function stripLeadingPlus(side) {
    return String(side || "")
      .replace(/^\s*\+\s*(?=[0-9(xyXY−-])/, "")
      .trim();
  }

  function normalizeEqDisplay(eq) {
    var s = String(eq || "")
      .replace(/[−–—]/g, "−")
      .replace(/\s*=\s*/g, " = ")
      .trim();
    var i = s.indexOf(" = ");
    if (i < 0) return stripLeadingPlus(s);
    return stripLeadingPlus(s.slice(0, i)) + " = " + stripLeadingPlus(s.slice(i + 3));
  }

  function expandOneTerm(term, decimals) {
    var A = global.DoctematicaAlgebra;
    var t = String(term).replace(/[−–—]/g, "-").replace(/\s+/g, "");
    var lead = "";
    if (t.charAt(0) === "+" || t.charAt(0) === "-") {
      lead = t.charAt(0);
      t = t.slice(1);
    }
    var m = t.match(/^(\d*)\(([^()]+)\)$/);
    if (m && /[+-]/.test(m[2].replace(/^-/, ""))) {
      var k = m[1] === "" ? 1 : parseInt(m[1], 10);
      if (lead === "-") k = -k;
      var inner = A.parseEquation("(" + m[2] + ")=0");
      return prettySide(k * inner.left.a, k * inner.left.b, decimals);
    }
    var atom = A.parseEquation((lead === "-" ? "-" : "") + t + "=0");
    return prettySide(atom.left.a, atom.left.b, decimals);
  }

  function expandSide(side, decimals) {
    var terms = splitRawTerms(side);
    if (!terms.length) return prettySide(0, 0, decimals);
    return joinPrettyParts(
      terms.map(function (term) {
        return expandOneTerm(term, decimals);
      })
    );
  }

  function termHasDistributableParens(term) {
    var t = String(term || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/^[+-]/, "");
    if (/\/\d+$/.test(t)) return false;
    return /^\d*\([^()]*[+-][^()]*\)$/.test(t);
  }

  function expandParensStep(eqText, decimals) {
    var sides = splitEq(eqText);
    if (!sides) return null;
    var leftTerms = splitRawTerms(sides.left);
    var rightTerms = splitRawTerms(sides.right);
    var leftHad = leftTerms.some(termHasDistributableParens);
    var rightHad = rightTerms.some(termHasDistributableParens);
    if (!leftHad && !rightHad) return null;
    var left = expandSide(sides.left, decimals);
    var right = expandSide(sides.right, decimals);
    var next = left + " = " + right;
    if (key(next) === key(eqText)) return null;
    var hint;
    var explain = "פותחים סוגריים: כופלים את המקדם בכל איבר שבתוך הסוגריים.";
    if (leftHad && rightHad) {
      hint = "פתחו את הסוגריים בשני האגפים.";
      explain = "פותחים סוגריים בשני האגפים: כופלים את המקדם בכל איבר שבתוך הסוגריים.";
    } else if (rightHad && !leftHad) {
      hint = "פתחו את הסוגריים באגף ימין.";
    } else {
      hint = "פתחו את הסוגריים.";
    }
    return { eq: next, hint: hint, explain: explain };
  }

  function flipX(c, decimals, leading) {
    if (near0(c)) return "";
    if (leading) return formatAx(-c, decimals);
    if (c > 0) return " − " + formatAx(c, decimals);
    return " + " + formatAx(-c, decimals);
  }

  function constTail(b, decimals) {
    if (near0(b)) return "";
    if (b > 0) return " + " + fmt(b, decimals);
    return " − " + fmt(-b, decimals);
  }

  function sumStr(p, q, decimals) {
    if (near0(q)) return fmt(p, decimals);
    if (near0(p)) return fmt(q, decimals);
    if (q > 0) return fmt(p, decimals) + " + " + fmt(q, decimals);
    return fmt(p, decimals) + " − " + fmt(-q, decimals);
  }

  function coeffPhrase(n, decimals) {
    var s = fmt(n, decimals);
    if (n < 0) return "(" + (s.charAt(0) === "−" || s.charAt(0) === "-" ? s.replace(/^-/, "−") : "−" + s) + ")";
    if (s.indexOf("/") !== -1) return "(" + s + ")";
    return s;
  }

  function isPlainNumberSide(side) {
    var t = String(side || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    return /^-?\d+(\.\d+)?$/.test(t) || /^-?\d+\/\d+$/.test(t) || /^\(-?\d+\/\d+\)$/.test(t);
  }

  function xOverNumber(side) {
    var t = String(side || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "");
    var m = t.match(/^\(?(x\^2|x²|x)\)?\/(\d+(?:\.\d+)?)$/i);
    if (!m) return null;
    return parseFloat(m[2]);
  }

  function mulDenomStep(otherSide, den, decimals) {
    var denShow = fmt(den, decimals);
    var other = String(otherSide)
      .trim()
      .replace(/[−–—]/g, "−");
    return {
      eq: lab() + " = " + other + " · " + denShow,
      hint: "כפלו את שני האגפים במכנה " + denShow + ". עדיין בלי לחשב.",
      explain: "מעבירים את המכנה " + denShow + " לאגף השני בכפל.",
    };
  }

  function skipWs(s, i) {
    while (i < s.length && /\s/.test(s.charAt(i))) i += 1;
    return i;
  }

  function isExplicitMul(ch) {
    return ch === "·" || ch === "*" || ch === "×";
  }

  function isChainOp(ch) {
    return isExplicitMul(ch) || ch === "/";
  }

  function readNumericAtom(s, i) {
    var j = i;
    var paren = false;
    if (s.charAt(j) === "(") {
      paren = true;
      j += 1;
    }
    var sign = 1;
    var ch = s.charAt(j);
    if (ch === "+" || ch === "-" || ch === "−") {
      if (ch !== "+") sign = -1;
      j += 1;
    }
    var m = s.slice(j).match(/^\d+(?:\.\d+)?/);
    if (!m) return null;
    var value = parseFloat(m[0]);
    j += m[0].length;
    if (paren && s.charAt(j) === "/") {
      var den = s.slice(j + 1).match(/^\d+(?:\.\d+)?/);
      if (!den || parseFloat(den[0]) === 0) return null;
      value = value / parseFloat(den[0]);
      j += 1 + den[0].length;
    }
    if (paren) {
      if (s.charAt(j) !== ")") return null;
      j += 1;
    }
    if (s.charAt(skipWs(s, j)) === "^") return null;
    if (!isFinite(value)) return null;
    return { end: j, value: sign * value, src: s.slice(i, j) };
  }

  function findNumericMulChains(src) {
    var chains = [];
    var i = 0;
    while (i < src.length) {
      if (i > 0 && /[0-9.^\w]/.test(src.charAt(i - 1))) {
        i += 1;
        continue;
      }
      var atom = readNumericAtom(src, i);
      if (!atom) {
        i += 1;
        continue;
      }
      var atoms = [atom];
      var ops = [];
      var j = atom.end;
      while (true) {
        var k = skipWs(src, j);
        var op = src.charAt(k);
        if (!isChainOp(op)) break;
        var next = readNumericAtom(src, skipWs(src, k + 1));
        if (!next) break;
        ops.push(op);
        atoms.push(next);
        j = next.end;
      }
      var sawMul = ops.some(isExplicitMul);
      if (sawMul) {
        chains.push({ start: i, end: j, atoms: atoms, ops: ops });
        i = j;
      } else {
        i = atom.end > i ? atom.end : i + 1;
      }
    }
    return chains;
  }

  function evalNumericChain(chain) {
    var v = chain.atoms[0].value;
    var t;
    for (t = 0; t < chain.ops.length; t++) {
      var r = chain.atoms[t + 1].value;
      if (chain.ops[t] === "/") {
        if (Math.abs(r) < EPS) return null;
        v = v / r;
      } else {
        v = v * r;
      }
    }
    return v;
  }

  function showSigned(src) {
    return String(src || "").replace(/[−–—-]/g, "−");
  }

  function chainDisplay(chain) {
    var s = showSigned(chain.atoms[0].src);
    var t;
    for (t = 0; t < chain.ops.length; t++) {
      s += (chain.ops[t] === "/" ? "/" : "·") + showSigned(chain.atoms[t + 1].src);
    }
    return s;
  }

  function formatProduct(n) {
    if (!isFinite(n)) return null;
    var rounded = Math.round(n * 1e9) / 1e9;
    if (Math.abs(rounded - Math.round(rounded)) < 1e-8) return String(Math.round(rounded));
    var shown = global.DoctematicaAlgebra.formatNumber(rounded);
    return String(shown).split(" או ")[0].replace(/-/g, "−");
  }

  function tidyComputedEq(s) {
    var t = String(s || "")
      .replace(/[−–—]/g, "-")
      .replace(/\+\s*-/g, " − ")
      .replace(/-\s*-/g, " + ")
      .replace(/([^ \n])\+/g, "$1 +")
      .replace(/\+([^ \n])/g, "+ $1")
      .replace(/\s*=\s*/g, " = ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/-/g, "−")
      .trim();
    return normalizeEqDisplay(t);
  }

  function numericMulStep(eqText) {
    var src = String(eqText || "");
    var chains = findNumericMulChains(src.replace(/[−–—]/g, "-"));
    if (!chains.length) return null;
    var values = [];
    var t;
    for (t = 0; t < chains.length; t++) {
      var v = evalNumericChain(chains[t]);
      var shown = v == null ? null : formatProduct(v);
      if (shown == null) return null;
      values.push(shown);
    }
    var next = src.replace(/[−–—]/g, "-");
    for (t = chains.length - 1; t >= 0; t--) {
      next = next.slice(0, chains[t].start) + values[t] + next.slice(chains[t].end);
    }
    next = tidyComputedEq(next);
    if (key(next) === key(eqText)) return null;
    var phrases = chains.map(function (chain) {
      var disp = chainDisplay(chain);
      var onlyMul = chain.ops.every(isExplicitMul);
      return onlyMul ? "הכפל " + disp : disp;
    });
    var hint =
      phrases.length === 1
        ? "חשבו את " + phrases[0] + "."
        : "חשבו את " + phrases.join(" ואת ") + ".";
    return {
      eq: next,
      hint: hint,
      explain: "מחשבים את " + chains.map(chainDisplay).join(" ואת ") + " לפני שממשיכים במשוואה.",
    };
  }

  function nextAction(eqText, opts) {
    opts = opts || {};
    unknownKind = opts.unknown === "x2" ? "x2" : "x";
    var decimals = [];
    rememberDecimals(eqText, decimals);
    var A = global.DoctematicaAlgebra;
    var sides = splitEq(eqText);
    if (!sides) return { done: true, hint: "כתבו משוואה עם סימן שוויון." };

    var mulNow = numericMulStep(eqText);
    if (mulNow) return mulNow;

    if (eqHasVarDenom(eqText)) {
      var lcdAlg = lcdStep(eqText, decimals);
      if (lcdAlg) return lcdAlg;
      var droppedAlg = dropDenomsStep(eqText, decimals);
      if (droppedAlg) return droppedAlg;
      var clearedOnce = clearEqDens(eqText);
      if (clearedOnce) {
        return {
          eq: clearedOnce,
          hint: "כפלו במכנה המשותף והורידו את המכנים (שימו לב לתחום ההצבה).",
          explain: "מכפילים במכנה המשותף ומורידים מכנים.",
        };
      }
    }

    var eq;
    try {
      eq = A.parseEquation(eqText, unknownKind === "x2" ? { unknown: "x2" } : {});
    } catch (err) {
      return { done: true, hint: err.message };
    }
    var La = eq.left.a;
    var Lb = eq.left.b;
    var Ra = eq.right.a;
    var Rb = eq.right.b;
    var kind = A.isolatedRhsKind(eqText, unknownKind);
    if (kind === "value") {
      return unknownKind === "x2"
        ? {
            done: true,
            isolated: true,
            hint: "בודדתם את x². עכשיו הוציאו שורש משני האגפים. אם הימין שלילי — אין פתרון ממשי.",
          }
        : { done: true, hint: "המשוואה כבר פתורה: x מבודד ומחושב." };
    }

    var oneSideClear = oneSidedDenomClearStep(eqText, decimals);
    if (oneSideClear) return oneSideClear;

    var lcdAct = unknownKind === "x2" && (kind === "unreduced" || kind === "expr") ? null : lcdStep(eqText, decimals);
    if (lcdAct) return lcdAct;

    var dropped = unknownKind === "x2" && (kind === "unreduced" || kind === "expr") ? null : dropDenomsStep(eqText, decimals);
    if (dropped) return dropped;

    var opened = expandParensStep(eqText, decimals);
    if (opened) return opened;

    var Lkind = termKinds(sides.left);
    var Rkind = termKinds(sides.right);
    var leftCombine = Lkind.xs >= 2 || (Lkind.cs >= 2 && Lkind.xs >= 1);
    var rightCombine = Rkind.xs >= 2 || (Rkind.cs >= 2 && Rkind.xs >= 1);
    var leftArith = pendingArith(sides.left);
    var rightArith = pendingArith(sides.right);
    if ((leftCombine || leftArith) && (rightCombine || rightArith)) {
      return {
        eq: prettyEq(La, Lb, Ra, Rb, decimals),
        hint: "אחדו איברים דומים בשני האגפים.",
        explain: "מאחדים איברים דומים בשני האגפים.",
      };
    }
    if (leftCombine) {
      return {
        eq: prettyEq(La, Lb, Ra, Rb, decimals),
        hint: likePhrase("באגף שמאל", Lkind),
        explain: "מאחדים איברים דומים באגף שמאל.",
      };
    }
    if (rightCombine) {
      return {
        eq: prettyEq(La, Lb, Ra, Rb, decimals),
        hint: likePhrase("באגף ימין", Rkind),
        explain: "מאחדים איברים דומים באגף ימין.",
      };
    }

    if (pendingArith(sides.left)) {
      return {
        eq: prettyEq(La, Lb, Ra, Rb, decimals),
        hint: "חשבו את הביטוי באגף שמאל.",
        explain: "מחשבים את אגף שמאל ומתקבל " + prettySide(La, Lb, decimals) + ".",
      };
    }
    if (pendingArith(sides.right) || kind === "expr" || kind === "unreduced") {
      if (kind === "unreduced") {
        return {
          eq: prettyEq(1, 0, 0, Rb, decimals),
          hint: "חשבו / צמצמו את השבר באגף ימין.",
          explain: "מחשבים את השבר ומתקבל " + lab() + " = " + fmt(Rb, decimals) + ".",
        };
      }
      return {
        eq: prettyEq(La, Lb, Ra, Rb, decimals),
        hint: "חשבו את הביטוי באגף ימין.",
        explain: "מחשבים את אגף ימין ומתקבל " + prettySide(Ra, Rb, decimals) + ".",
      };
    }

    var denLeft = xOverNumber(sides.left);
    var denRight = xOverNumber(sides.right);
    if (denLeft != null && isPlainNumberSide(sides.right)) {
      return mulDenomStep(sides.right, denLeft, decimals);
    }
    if (denRight != null && isPlainNumberSide(sides.left)) {
      return mulDenomStep(sides.left, denRight, decimals);
    }

    if (near0(La) && !near0(Ra)) {
      return {
        eq: flipX(Ra, decimals, true) + " = " + sumStr(Rb, -Lb, decimals),
        hint: "העבירו את איבר ה־" + lab() + " לאגף שמאל, והחליפו סימן. עדיין בלי לחשב.",
        explain:
          "מעבירים את " +
          formatAx(Ra, decimals) +
          " לאגף שמאל. פלוס הופך למינוס ומינוס לפלוס.",
      };
    }

    if (!near0(La) && !near0(Ra) && !near0(Lb)) {
      var leftConst = Lb > 0 ? "+" + fmt(Lb, decimals) : "−" + fmt(-Lb, decimals);
      return {
        eq: formatAx(La, decimals) + flipX(Ra, decimals) + " = " + sumStr(Rb, -Lb, decimals),
        hint: "העבירו את איבר ה־" + lab() + " לשמאל ואת המספר החופשי לימין, והחליפו סימן בכל אחד. עדיין בלי לחשב.",
        explain:
          "מעבירים את " +
          formatAx(Ra, decimals) +
          " לאגף שמאל ואת " +
          leftConst +
          " לאגף ימין. פלוס הופך למינוס ומינוס לפלוס.",
      };
    }

    if (!near0(La) && !near0(Ra)) {
      return {
        eq: formatAx(La, decimals) + flipX(Ra, decimals) + constTail(Lb, decimals) + " = " + prettySide(0, Rb, decimals),
        hint: "העבירו את איבר ה־" + lab() + " מאגף ימין לשמאל, והחליפו סימן.",
        explain: "מעבירים את " + formatAx(Ra, decimals) + " לאגף שמאל. פלוס הופך למינוס ומינוס לפלוס.",
      };
    }

    if (!near0(La) && !near0(Lb) && near0(Ra)) {
      var moved = formatAx(La, decimals) + " = " + sumStr(Rb, -Lb, decimals);
      var hintNum = fmt(Math.abs(Lb), decimals);
      return {
        eq: moved,
        hint: "העבירו את " + hintNum + " לאגף השני, והחליפו סימן. עדיין בלי לחשב.",
        explain:
          Lb > 0
            ? "מעבירים את +" +
              fmt(Lb, decimals) +
              " לאגף ימין: פלוס הופך למינוס."
            : "מעבירים את −" +
              fmt(-Lb, decimals) +
              " לאגף ימין: מינוס הופך לפלוס.",
      };
    }

    if (!near0(La) && near0(Lb) && near0(Ra) && Math.abs(La - 1) >= EPS) {
      var unN = coeffPhrase(Rb, decimals);
      var unD = coeffPhrase(La, decimals);
      return {
        eq: lab() + " = " + unN + "/" + unD,
        hint: "חלקו את שני האגפים במקדם של " + lab() + ", " + unD + ". עדיין בלי לחשב.",
        explain: "מחלקים את שני האגפים ב־" + unD + ".",
      };
    }

    return {
      eq: lab() + " = " + fmt(-eq.left.b / eq.left.a + eq.right.b / eq.left.a, decimals),
      hint: "בודדו את " + lab() + " עד שמתקבל " + lab() + " = מספר.",
      explain: "מסיימים את הבידוד של " + lab() + ".",
    };
  }

  function toClearedEquation(eqText) {
    var cur = String(eqText || "").trim();
    var guard = 0;
    while (guard++ < 8 && eqHasVarDenom(cur)) {
      var next = clearEqDens(cur) || dropSharedDens(cur);
      if (!next || key(next) === key(cur)) break;
      cur = next;
    }
    // Also clear pure numeric dens if needed
    guard = 0;
    while (guard++ < 8) {
      var n2 = clearEqDens(cur) || dropSharedDens(cur);
      if (!n2 || key(n2) === key(cur)) break;
      cur = n2;
    }
    return cur;
  }

  function solveRationalValue(eqText) {
    var cleared = toClearedEquation(eqText);
    var parsed = global.DoctematicaAlgebra.parseEquation(cleared);
    var d = parsed.left.a - parsed.right.a;
    if (near0(d)) return null;
    return (parsed.right.b - parsed.left.b) / d;
  }

  function checkRationalStep(previousText, nextText) {
    var A = global.DoctematicaAlgebra;
    if (key(previousText) === key(nextText)) {
      return {
        ok: false,
        same: true,
        message: "זו אותה משוואה. כתבו צעד חדש.",
      };
    }
    if (A.missingEqualsSign(nextText)) {
      return { ok: false, message: "חסר סימן שווה" };
    }
    var clearedPrev = toClearedEquation(previousText);
    var clearedNext = eqHasVarDenom(nextText) ? toClearedEquation(nextText) : String(nextText).trim();
    var prev;
    var next;
    try {
      prev = A.parseEquation(clearedPrev);
    } catch (err) {
      return { ok: false, message: "לא ניתן לפשט את המשוואה הקודמת: " + err.message };
    }
    try {
      next = A.parseEquation(clearedNext);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    if (!A.equivalent(prev, next)) {
      return {
        ok: false,
        message: "הצעד לא שקול. בדקו כפל במכנים / העברת אגפים (ושמרו על תחום ההצבה).",
      };
    }
    if (A.isSolved(next) || /^\s*x\s*=\s*[+\-]?\d/i.test(clearedNext.replace(/[−–—]/g, "-"))) {
      var sol = null;
      try {
        sol = solveRationalValue(previousText);
      } catch (e2) {}
      var domain = analyzeDomain(previousText);
      if (sol != null && domain) {
        var hit = domain.forbidden.some(function (f) {
          return !f.symbolic && Math.abs(f.value - sol) < EPS;
        });
        if (hit) {
          return {
            ok: false,
            message: "הערך שהתקבל מחוץ לתחום ההצבה (" + domain.display + ").",
          };
        }
      }
      if (A.isSolved(next)) {
        return {
          ok: true,
          solved: true,
          equation: next,
          message: "זהו הפתרון: x = " + A.formatNumber(sol != null ? sol : (next.right.b - next.left.b) / (next.left.a - next.right.a) || next.right.b) + ".",
        };
      }
    }
    return {
      ok: true,
      solved: false,
      equation: next,
      message: eqHasVarDenom(previousText) && !eqHasVarDenom(nextText)
        ? "צעד חוקי. הורדתם מכנים — המשיכו לפתור את המשוואה הרגילה."
        : "צעד חוקי. המשיכו עד x = מספר (תוך שמירה על תחום ההצבה).",
    };
  }

  function fullPath(start, opts) {
    opts = opts || {};
    unknownKind = opts.unknown === "x2" ? "x2" : "x";
    var out = [];
    var cur = String(start).trim();
    var guard = 0;
    var seen = {};
    seen[key(cur)] = true;
    while (guard++ < 28) {
      var act = nextAction(cur, opts);
      if (!act || act.done || !act.eq) break;
      if (seen[key(act.eq)]) break;
      seen[key(act.eq)] = true;
      out.push({ eq: act.eq, explain: act.explain, hint: act.hint });
      cur = act.eq;
    }
    var last = out[out.length - 1];
    var ans = last ? last.eq.replace(/^\s*x\s*=\s*/i, "") : "";
    try {
      var parsed = global.DoctematicaAlgebra.parseEquation(
        eqHasVarDenom(start) ? toClearedEquation(start) : start,
        opts.unknown === "x2" ? { unknown: "x2" } : {}
      );
      var d = parsed.left.a - parsed.right.a;
      if (!near0(d)) {
        var pool = [];
        rememberDecimals(start, pool);
        ans = fmt((parsed.right.b - parsed.left.b) / d, pool);
      }
    } catch (e) {}
    return { steps: out, answer: ans };
  }

  global.DoctematicaTeach = {
    nextAction: function (eqText, opts) {
      var act = nextAction(eqText, opts);
      if (act && act.eq) act.eq = normalizeEqDisplay(act.eq);
      return act;
    },
    normalizeEqDisplay: normalizeEqDisplay,
    stripLeadingPlus: stripLeadingPlus,
    fullPath: fullPath,
    analyzeLcdNeed: analyzeLcdNeed,
    checkLcdValue: checkLcdValue,
    checkLcdMultiplier: checkLcdMultiplier,
    rewriteEqWithLcd: rewriteEqWithLcd,
    clearEqDens: clearEqDens,
    dropSharedDens: dropSharedDens,
    analyzeDomain: analyzeDomain,
    checkDomain: checkDomain,
    checkDomainOne: checkDomainOne,
    checkDomainProgress: checkDomainProgress,
    domainNextStep: domainNextStep,
    eqHasVarDenom: eqHasVarDenom,
    checkRationalStep: checkRationalStep,
    toClearedEquation: toClearedEquation,
    splitTermDenExpr: splitTermDenExpr,
  };
})(window);
