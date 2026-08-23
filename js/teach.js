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

  function termDen(term) {
    var cf = parseCompoundFrac(term);
    if (cf) return cf.den;
    var t = String(term || "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/^[+-]/, "");
    var m = t.match(/^\((\d+)\/(\d+)\)x$/i);
    if (m) return parseInt(m[2], 10);
    m = t.match(/^(?:\d*)x\/(\d+)$/i);
    if (m) return parseInt(m[1], 10);
    m = t.match(/^(\d+)\/(\d+)$/);
    if (m) return parseInt(m[2], 10);
    return 1;
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

  function lcdOfDens(dens) {
    if (!dens.length) return 1;
    var L = dens[0];
    var i;
    for (i = 1; i < dens.length; i++) L = lcmInt(L, dens[i]);
    return L;
  }

  function lcdStep(eqText, decimals) {
    var sides = splitEq(eqText);
    if (!sides) return null;
    if (/^\s*x\s*$/i.test(sides.left) || /^\s*x\s*$/i.test(sides.right)) return null;
    if (isSimpleCoeffFracEq(sides)) return null;
    var leftTerms = splitRawTerms(sides.left);
    var rightTerms = splitRawTerms(sides.right);
    var all = leftTerms.concat(rightTerms);
    var dens = all.map(termDen);
    var fracDens = dens.filter(function (d) {
      return d > 1;
    });
    var uniq = [];
    fracDens.forEach(function (d) {
      if (uniq.indexOf(d) === -1) uniq.push(d);
    });
    var mixedX = false;
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
    mixedX = sideMixed(leftTerms) || sideMixed(rightTerms);
    var hasDen1 = dens.some(function (d) {
      return d === 1;
    });
    if (uniq.length < 2 && !mixedX && !(uniq.length >= 1 && hasDen1)) return null;
    var lcd = lcdOfDens(uniq.length ? uniq : dens.filter(function (d) { return d > 1; }));
    if (mixedX) {
      var extra = dens.filter(function (d) { return d > 1; });
      lcd = lcdOfDens(extra);
    }
    if (lcd <= 1) return null;
    var left = joinPrettyParts(
      leftTerms.map(function (t) {
        return rewriteTermLcd(t, lcd, decimals);
      })
    );
    var right = joinPrettyParts(
      rightTerms.map(function (t) {
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

  function sharedLcd(eqText) {
    var sides = splitEq(eqText);
    if (!sides) return 0;
    var terms = splitRawTerms(sides.left).concat(splitRawTerms(sides.right));
    var dens = [];
    var i;
    for (i = 0; i < terms.length; i++) {
      var t = String(terms[i])
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, "")
        .replace(/^[+-]/, "");
      if (t === "0") continue;
      dens.push(termDen(terms[i]));
    }
    if (!dens.length) return 0;
    var d0 = dens[0];
    if (d0 <= 1) return 0;
    for (i = 1; i < dens.length; i++) {
      if (dens[i] !== d0) return 0;
    }
    return d0;
  }

  function dropDenomsStep(eqText, decimals) {
    var lcd = sharedLcd(eqText);
    if (lcd <= 1) return null;
    var sides = splitEq(eqText);
    function dropSide(side) {
      return joinPrettyParts(
        splitRawTerms(side).map(function (term) {
          var cf = parseCompoundFrac(term);
          if (cf) {
            var signed = (cf.sign === "-" ? -1 : 1) * cf.k;
            return formatDroppedCompound(signed, cf.inner);
          }
          var parsed;
          try {
            parsed = global.DoctematicaAlgebra.parseEquation(term + "=0");
          } catch (err) {
            return term;
          }
          return prettySide(
            Math.round(parsed.left.a * lcd),
            Math.round(parsed.left.b * lcd),
            decimals
          );
        })
      );
    }
    var next = dropSide(sides.left) + " = " + dropSide(sides.right);
    if (key(next) === key(eqText)) return null;
    return {
      eq: next,
      hint: "כופלו את שני האגפים במכנה המשותף " + lcd + ", כדי להוריד את המכנים.",
      explain: "כופלים את שני האגפים ב־" + lcd + " ומורידים את המכנים. ממשיכים כמו משוואה בלי שברים.",
    };
  }

  function joinPrettyParts(parts) {
    var out = parts[0] || "0";
    var i;
    for (i = 1; i < parts.length; i++) {
      var p = parts[i];
      if (/^[−-]/.test(p)) out += " " + p;
      else out += " + " + p;
    }
    return out;
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

  function flipX(c, decimals) {
    if (near0(c)) return "";
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

  function nextAction(eqText, opts) {
    opts = opts || {};
    unknownKind = opts.unknown === "x2" ? "x2" : "x";
    var decimals = [];
    rememberDecimals(eqText, decimals);
    var A = global.DoctematicaAlgebra;
    var sides = splitEq(eqText);
    if (!sides) return { done: true, hint: "כתבו משוואה עם סימן שוויון." };
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

    var lcdAct = lcdStep(eqText, decimals);
    if (lcdAct) return lcdAct;

    var dropped = dropDenomsStep(eqText, decimals);
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
        eq: prettyEq(Ra, Rb, La, Lb, decimals),
        hint: "העבירו את " + lab() + " לאגף שמאל — אפשר להחליף בין האגפים.",
        explain: "מחליפים בין האגפים כדי ש־" + lab() + " יהיה בשמאל.",
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
        start,
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
    nextAction: nextAction,
    fullPath: fullPath,
  };
})(window);
