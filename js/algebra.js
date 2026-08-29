(function (global) {
  var EPS = 1e-9;

  function near0(n) {
    return Math.abs(n) < EPS;
  }

  function lin(a, b) {
    return { a: a, b: b };
  }

  function add(u, v) {
    return lin(u.a + v.a, u.b + v.b);
  }

  function sub(u, v) {
    return lin(u.a - v.a, u.b - v.b);
  }

  function mul(u, v) {
    if (near0(u.a) && near0(v.a)) return lin(0, u.b * v.b);
    if (near0(u.a)) return lin(u.b * v.a, u.b * v.b);
    if (near0(v.a)) return lin(v.b * u.a, v.b * u.b);
    throw new Error("הכפל יוצר איבר עם x². בשלב זה מתרגלים משוואות ממעלה ראשונה.");
  }

  function div(u, v) {
    if (!near0(v.a) || near0(v.b)) {
      throw new Error("אפשר לחלק רק במספר קבוע שונה מאפס.");
    }
    return lin(u.a / v.b, u.b / v.b);
  }

  function mixedToImproper(w, n, d) {
    var whole = parseInt(w, 10);
    var num = parseInt(n, 10);
    var den = parseInt(d, 10);
    if (!den) throw new Error("שבר עם מכנה 0.");
    var sign = whole < 0 ? -1 : 1;
    whole = Math.abs(whole);
    return "(" + sign * (whole * den + num) + "/" + den + ")";
  }

  function rewriteFractions(text) {
    var s = String(text)
      .replace(/½/g, "(1/2)")
      .replace(/¼/g, "(1/4)")
      .replace(/¾/g, "(3/4)")
      .replace(/⅓/g, "(1/3)")
      .replace(/⅔/g, "(2/3)")
      .replace(/⁶/g, "^6")
      .replace(/⁵/g, "^5")
      .replace(/⁴/g, "^4")
      .replace(/³/g, "^3")
      .replace(/²/g, "^2")
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/:/g, "/");
    s = s.replace(/(-?\d+)_(\d+)\s*\/\s*(\d+)/g, function (_, w, n, d) {
      return mixedToImproper(w, n, d);
    });
    s = s.replace(/(-?\d+)\s+(\d+)\s*\/\s*(\d+)/g, function (_, w, n, d) {
      return mixedToImproper(w, n, d);
    });
    return s.replace(/\s+/g, "");
  }

  function asEquation(text) {
    var t = String(text).trim();
    if (!t) throw new Error("השדה ריק.");
    if (t.indexOf("=") !== -1) return t;
    if (/x/i.test(t)) {
      throw new Error("חסר סימן שווה");
    }
    return "x = " + t;
  }

  function missingEqualsSign(text) {
    var s = String(text || "").trim();
    if (!s) return false;
    if (/[=＝]/.test(s)) return false;
    if (/(אין\s*פתרון|כל\s*x|זהות|סתירה|אינסוף)/.test(s)) return false;
    if (/^[+\-−]?\d+([./]\d+)?$/.test(s.replace(/\s+/g, ""))) return false;
    return /[0-9xXyY()+\-−*/^√±]/.test(s);
  }

  function tokenize(text) {
    var s = rewriteFractions(asEquation(text));
    if (!s) throw new Error("השדה ריק.");
    var tokens = [];
    var i = 0;
    while (i < s.length) {
      var c = s.charAt(i);
      if ("=()+*/-".indexOf(c) !== -1) {
        tokens.push({ t: c });
        i += 1;
        continue;
      }
      if (c === "x" || c === "X") {
        if (s.slice(i + 1, i + 3) === "^2") {
          tokens.push({ t: "x2" });
          i += 3;
          continue;
        }
        tokens.push({ t: "x" });
        i += 1;
        continue;
      }
      if ((c >= "0" && c <= "9") || c === ".") {
        var m = s.slice(i).match(/^\d+(\.\d+)?/);
        if (!m) throw new Error("מספר לא תקין ליד: " + s.slice(i, i + 6));
        tokens.push({ t: "num", v: parseFloat(m[0], 10) });
        i += m[0].length;
        continue;
      }
      throw new Error("תו לא מוכר: «" + c + "». השתמשו ב־x, x², מספרים, + − × / ( ) ו־=.");
    }
    return insertImplicitMul(tokens);
  }

  function insertImplicitMul(tokens) {
    var out = [];
    function endsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "x2" || tok.t === ")");
    }
    function startsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "x2" || tok.t === "(");
    }
    for (var i = 0; i < tokens.length; i++) {
      var prev = out[out.length - 1];
      var cur = tokens[i];
      if (endsValue(prev) && startsValue(cur)) out.push({ t: "*" });
      out.push(cur);
    }
    return out;
  }

  function parseLinear(tokens, unknown) {
    unknown = unknown || "x";
    var i = 0;

    function peek() {
      return tokens[i];
    }

    function eat(t) {
      var tok = tokens[i];
      if (!tok || (t && tok.t !== t)) return null;
      i += 1;
      return tok;
    }

    function parseExpr() {
      var left = parseTerm();
      while (peek() && (peek().t === "+" || peek().t === "-")) {
        var op = eat().t;
        var right = parseTerm();
        left = op === "+" ? add(left, right) : sub(left, right);
      }
      return left;
    }

    function parseTerm() {
      var left = parseUnary();
      while (peek() && (peek().t === "*" || peek().t === "/")) {
        var op = eat().t;
        var right = parseUnary();
        left = op === "*" ? mul(left, right) : div(left, right);
      }
      return left;
    }

    function parseUnary() {
      if (peek() && peek().t === "+") {
        eat();
        return parseUnary();
      }
      if (peek() && peek().t === "-") {
        eat();
        return mul(lin(0, -1), parseUnary());
      }
      return parsePrimary();
    }

    function parsePrimary() {
      var tok = peek();
      if (!tok) throw new Error("הביטוי נקטע באמצע.");
      if (tok.t === "num") {
        eat();
        return lin(0, tok.v);
      }
      if (tok.t === "x2") {
        if (unknown === "x") {
          throw new Error("במשוואות ממעלה ראשונה אין x².");
        }
        eat();
        return lin(1, 0);
      }
      if (tok.t === "x") {
        if (unknown === "x2") {
          throw new Error("בשלב הזה מבודדים את x², לא את x. אחרי x² = מספר הוציאו שורש משני האגפים.");
        }
        eat();
        return lin(1, 0);
      }
      if (tok.t === "(") {
        eat();
        var inner = parseExpr();
        if (!eat(")")) throw new Error("חסר סוגריים סוגרים.");
        return inner;
      }
      throw new Error("לא ציפיתי ל־«" + tok.t + "» כאן.");
    }

    var value = parseExpr();
    return { value: value, rest: i };
  }

  function detectUnknown(tokens) {
    var sawX2 = false;
    var sawX = false;
    var i;
    for (i = 0; i < tokens.length; i++) {
      if (tokens[i].t === "x2") sawX2 = true;
      if (tokens[i].t === "x") sawX = true;
    }
    if (sawX2 && sawX) {
      throw new Error("בשלב הבידוד עובדים עם x². את x כותבים רק אחרי שמוציאים שורש.");
    }
    return sawX2 ? "x2" : "x";
  }

  function parseEquation(text, opts) {
    opts = opts || {};
    var tokens = tokenize(text);
    var unknown = opts.unknown || detectUnknown(tokens);
    var eqIndex = -1;
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i].t === "=") {
        if (eqIndex !== -1) throw new Error("יותר מסימן שוויון אחד.");
        eqIndex = i;
      }
    }
    if (eqIndex === -1) throw new Error("חסר סימן שווה");
    var leftToks = tokens.slice(0, eqIndex);
    var rightToks = tokens.slice(eqIndex + 1);
    if (!leftToks.length || !rightToks.length) throw new Error("חסר אגף במשוואה.");
    var left = parseLinear(leftToks, unknown);
    var right = parseLinear(rightToks, unknown);
    if (left.rest !== leftToks.length || right.rest !== rightToks.length) {
      throw new Error("לא הצלחתי לקרוא את כל המשוואה.");
    }
    return {
      left: left.value,
      right: right.value,
      source: String(text).trim(),
    };
  }

  function diff(eq) {
    return sub(eq.left, eq.right);
  }

  function normalizeKey(text) {
    return String(text)
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function equivalent(eqA, eqB) {
    var d1 = diff(eqA);
    var d2 = diff(eqB);
    if (near0(d1.a) && near0(d2.a)) {
      return near0(d1.b) === near0(d2.b);
    }
    if (near0(d1.a) || near0(d2.a)) return false;
    return near0(d1.a * d2.b - d2.a * d1.b);
  }

  function isBareX(side) {
    return isBareLetter(side, "x");
  }

  function isBareLetter(side, v) {
    if (v === "x2" || v === "x^2") {
      return /^[+\s]*(x\^2|x²)$/i.test(String(side).trim());
    }
    return new RegExp("^[+\\s]*" + v + "$", "i").test(String(side).trim());
  }

  function fracParts(side) {
    var t = rewriteFractions(String(side).trim());
    var m = t.match(/^-?\((\d+)\/(\d+)\)$/) || t.match(/^\((-?\d+)\/(\d+)\)$/) || t.match(/^(-?\d+)\/(\d+)$/);
    if (!m) return null;
    return { n: parseInt(m[1], 10), d: parseInt(m[2], 10) };
  }

  function isReducedNumber(side) {
    var t = rewriteFractions(String(side).trim());
    if (/^-?\d+(\.\d+)?$/.test(t)) return true;
    var p = fracParts(t);
    if (!p || p.d <= 0) return false;
    if (p.d === 1) return false;
    return gcdNum(p.n, p.d) === 1;
  }

  function isSimpleNumber(side) {
    return isReducedNumber(side);
  }

  function isUnreducedFraction(side) {
    var p = fracParts(side);
    if (!p || p.d <= 0) return false;
    return p.d === 1 || gcdNum(p.n, p.d) !== 1;
  }

  function isolatedOtherSide(text, v) {
    var eq = rewriteFractions(asEquation(String(text).trim()));
    var parts = eq.split("=");
    if (parts.length !== 2) return null;
    var other = null;
    if (isBareLetter(parts[0], v)) other = parts[1];
    else if (isBareLetter(parts[1], v)) other = parts[0];
    else return null;
    return { other: String(other).trim(), kind: isolatedRhsKind(text, v) };
  }

  function formatFracHint(side) {
    var p = fracParts(side);
    if (p) return String(p.n).replace(/-/g, "−") + "/" + p.d;
    return String(side).replace(/\s+/g, "").replace(/-/g, "−");
  }

  function pendingComputeHint(prevText, unknown) {
    var iso = isolatedOtherSide(prevText, unknown || "x");
    if (!iso) return null;
    if (iso.kind === "unreduced") {
      return "עכשיו צריך לחשב את השבר: " + formatFracHint(iso.other) + ".";
    }
    if (iso.kind === "expr") {
      var t = iso.other.replace(/\s+/g, "");
      if (/[+\-×*\/]/.test(t.replace(/^-/, ""))) {
        return "עכשיו צריך לחשב: " + t.replace(/-/g, "−").replace(/\*/g, "×") + ".";
      }
    }
    return null;
  }

  function isSolvedText(text) {
    var raw = String(text).trim();
    if (raw.indexOf("=") === -1 && !/x/i.test(raw)) {
      return isSimpleNumber(raw);
    }
    return isolatedRhsKind(raw, "x") === "value";
  }

  function otherHasUnknown(other, v) {
    var t = String(other || "");
    if (v === "x2" || v === "x^2") return /x\^2|x²/i.test(t);
    if (!v) return /x/i.test(t);
    return new RegExp(v, "i").test(t);
  }

  function isolatedRhsKind(text, v) {
    var eq = rewriteFractions(asEquation(String(text).trim()));
    var parts = eq.split("=");
    if (parts.length !== 2) return null;
    var other = null;
    if (isBareLetter(parts[0], v)) other = parts[1];
    else if (isBareLetter(parts[1], v)) other = parts[0];
    else return null;
    if (otherHasUnknown(other, v)) return null;
    if (isSimpleNumber(other)) return "value";
    if (isUnreducedFraction(other)) return "unreduced";
    return "expr";
  }

  function isSolved(eq) {
    return isSolvedText(eq.source);
  }

  function solutionOf(eq) {
    var d = diff(eq);
    if (near0(d.a)) return null;
    return -d.b / d.a;
  }

  function gcdNum(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  /** כמה ספרות אחרי הנקודה נדרשות לייצוג עשרוני מדויק (עד 3), או null */
  function terminatingDecimalPlaces(n, maxPlaces) {
    maxPlaces = maxPlaces == null ? 3 : maxPlaces;
    var i;
    for (i = 0; i <= maxPlaces; i++) {
      var scale = Math.pow(10, i);
      var scaled = n * scale;
      if (Math.abs(scaled - Math.round(scaled)) < 1e-6) {
        var val = Math.round(scaled) / scale;
        if (Math.abs(val - n) < 1e-6) return i;
      }
    }
    return null;
  }

  function formatDecimalFixed(n, places) {
    if (places === 0) return String(Math.round(n));
    var scale = Math.pow(10, places);
    var val = Math.round(n * scale) / scale;
    var s = val.toFixed(places);
    if (s.indexOf(".") >= 0) {
      s = s.replace(/0+$/, "").replace(/\.$/, "");
    }
    return s;
  }

  function formatNumber(n) {
    if (near0(n)) return "0";
    var decPlaces = terminatingDecimalPlaces(n, 3);
    if (decPlaces != null) {
      return formatDecimalFixed(n, decPlaces);
    }
    for (var d = 1; d <= 16; d++) {
      var num = Math.round(n * d);
      if (Math.abs(n * d - num) < 1e-6) {
        var g = gcdNum(num, d);
        var nn = num / g;
        var dd = d / g;
        if (dd === 1) return String(nn);
        var mixed = "";
        if (Math.abs(nn) > dd) {
          var sign = nn < 0 ? "-" : "";
          var absn = Math.abs(nn);
          mixed = " או " + sign + Math.floor(absn / dd) + " " + (absn % dd) + "/" + dd;
        }
        return nn + "/" + dd + mixed;
      }
    }
    return String(Math.round(n * 1000) / 1000);
  }

  function checkStep(previousText, nextText, opts) {
    opts = opts || {};
    var unknown = opts.unknown || (/x\^2|x²/i.test(String(previousText)) ? "x2" : "x");
    var parseOpts = { unknown: unknown };
    if (normalizeKey(previousText) === normalizeKey(nextText)) {
      return {
        ok: false,
        same: true,
        message: "זו אותה משוואה. כתבו צעד חדש — למשל חיבור/חיסור משני האגפים, או חילוק במקדם.",
      };
    }
    if (missingEqualsSign(nextText)) {
      return { ok: false, message: "חסר סימן שווה" };
    }
    var Teach = global.DoctematicaTeach;
    if (
      unknown !== "x2" &&
      Teach &&
      typeof Teach.eqHasVarDenom === "function" &&
      (Teach.eqHasVarDenom(previousText) || Teach.eqHasVarDenom(nextText)) &&
      typeof Teach.checkRationalStep === "function"
    ) {
      return Teach.checkRationalStep(previousText, nextText);
    }
    var prev;
    var next;
    try {
      prev = parseEquation(previousText, parseOpts);
    } catch (err) {
      if (Teach && typeof Teach.checkRationalStep === "function") {
        try {
          return Teach.checkRationalStep(previousText, nextText);
        } catch (e2) {}
      }
      return { ok: false, message: "המשוואה הקודמת לא ניתנת לקריאה: " + err.message };
    }
    try {
      next = parseEquation(nextText, parseOpts);
    } catch (err) {
      if (Teach && typeof Teach.checkRationalStep === "function") {
        try {
          return Teach.checkRationalStep(previousText, nextText);
        } catch (e2) {}
      }
      return { ok: false, message: err.message };
    }
    if (!equivalent(prev, next)) {
      var computeHint = pendingComputeHint(previousText, unknown);
      if (computeHint) {
        return { ok: false, errorId: "compute_rhs", message: computeHint };
      }
      var classified = DoctematicaErrors.classify(prev, next);
      return {
        ok: false,
        errorId: classified.id,
        message: classified.message,
      };
    }
    if (unknown === "x2") {
      var k2 = isolatedRhsKind(nextText, "x2");
      var x2Isolated =
        k2 === "expr" ||
        k2 === "unreduced" ||
        k2 === "value";
      if (k2 === "value") {
        return {
          ok: true,
          isolated: true,
          solved: false,
          equation: next,
          message: "x² מבודד. עכשיו הוציאו שורש משני האגפים. אם האגף השני שלילי — אין פתרון ממשי.",
        };
      }
      return {
        ok: true,
        solved: false,
        isolated: false,
        equation: next,
        message:
          k2 === "unreduced"
            ? "צעד חוקי: חלקו. עכשיו חשבו את השבר עד שמתקבל x² = מספר."
            : x2Isolated
              ? "צעד חוקי. פשטו את האגף עד שמתקבל x² = מספר."
              : "צעד חוקי. המשיכו לבודד את x² כמו במשוואה רגילה: העברת איבר, ואז חילוק במקדם.",
      };
    }
    if (isSolved(next) || isSolvedText(nextText)) {
      var sol2 = solutionOf(next);
      return {
        ok: true,
        solved: true,
        equation: next,
        message: "זהו הפתרון: x = " + formatNumber(sol2) + ".",
      };
    }
    var rewritten = rewriteFractions(asEquation(nextText));
    var sides = rewritten.split("=");
    var xIsolated =
      sides.length === 2 &&
      ((isBareX(sides[0]) && !isReducedNumber(sides[1])) ||
        (isBareX(sides[1]) && !isReducedNumber(sides[0])));
    var movedByDivision =
      sides.length === 2 &&
      ((isBareX(sides[0]) && isUnreducedFraction(sides[1])) ||
        (isBareX(sides[1]) && isUnreducedFraction(sides[0])));
    return {
      ok: true,
      solved: false,
      equation: next,
      message: movedByDivision
        ? "צעד חוקי: העברתם את המקדם בחילוק. עכשיו חשבו את השבר, למשל 8/2 → 4."
        : xIsolated
          ? "צעד חוקי, אבל זה עדיין לא הפתרון הסופי. פשטו את האגף עד שמקבלים מספר אחד, למשל 5+4 → 9."
          : "צעד חוקי, אבל זה עדיין לא הפתרון. המשיכו: העברת איבר, חילוק במקדם (x = 8/2), ואז חישוב השבר.",
    };
  }

  global.DoctematicaAlgebra = {
    parseEquation: parseEquation,
    checkStep: checkStep,
    isSolved: isSolved,
    isSolvedText: isSolvedText,
    solutionOf: solutionOf,
    equivalent: equivalent,
    formatNumber: formatNumber,
    terminatingDecimalPlaces: terminatingDecimalPlaces,
    asEquation: asEquation,
    isolatedRhsKind: isolatedRhsKind,
    missingEqualsSign: missingEqualsSign,
  };
})(window);
