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
    if (/<=|>=|[<=>≤≥＝]/.test(t)) return t;
    if (/x/i.test(t)) {
      throw new Error("חסר סימן שווה");
    }
    return "x = " + t;
  }

  function missingEqualsSign(text) {
    var s = String(text || "").trim();
    if (!s) return false;
    if (/<=|>=|[<=>≤≥＝]/.test(s)) return false;
    if (/(אין\s*פתרון|כל\s*x|זהות|סתירה|אינסוף)/.test(s)) return false;
    if (/^[+\-−]?\d+([./]\d+)?$/.test(s.replace(/\s+/g, ""))) return false;
    return /[0-9xXyY()+\-−*/^√±]/.test(s);
  }

  function tokenize(text, opts) {
    opts = opts || {};
    var s = rewriteFractions(asEquation(text)).replace(/<=/g, "≤").replace(/>=/g, "≥");
    if (!s) throw new Error("השדה ריק.");
    var tokens = [];
    var i = 0;
    while (i < s.length) {
      var c = s.charAt(i);
      if (c === "<" || c === ">" || c === "≤" || c === "≥") {
        tokens.push({
          t: "rel",
          v: c === "<" ? "LT" : c === ">" ? "GT" : c === "≤" ? "LTE" : "GTE",
        });
        i += 1;
        continue;
      }
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
      if (opts.allowParams && ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z"))) {
        tokens.push({ t: "param", v: c.toLowerCase() });
        i += 1;
        continue;
      }
      throw new Error("תו לא מוכר: «" + c + "». השתמשו ב־x, x², מספרים, + − × / ( ) ו־=.");
    }
    return insertImplicitMul(tokens);
  }

  function insertImplicitMul(tokens) {
    var out = [];
    function endsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "x2" || tok.t === "param" || tok.t === ")");
    }
    function startsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "x2" || tok.t === "param" || tok.t === "(");
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
    var rel = "EQ";
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i].t === "=" || tokens[i].t === "rel") {
        if (eqIndex !== -1) throw new Error("יותר מסימן יחס אחד.");
        eqIndex = i;
        rel = tokens[i].t === "=" ? "EQ" : tokens[i].v;
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
      rel: rel,
      source: String(text).trim(),
    };
  }

  function relChar(code) {
    return { LT: "<", GT: ">", LTE: "≤", GTE: "≥", EQ: "=" }[code] || "=";
  }

  function flipRelCode(code) {
    return { LT: "GT", GT: "LT", LTE: "GTE", GTE: "LTE", EQ: "EQ" }[code] || code;
  }

  function relLess(code) {
    return code === "LT" || code === "LTE";
  }

  function relStrict(code) {
    return code === "LT" || code === "GT";
  }

  function isInequalityText(text) {
    return /<=|>=|[<>≤≥]/.test(String(text || ""));
  }

  function ineqConclusion(text) {
    var t = String(text || "").replace(/\s+/g, "");
    if (/^(כלx|כלמספר|כלxמתאים|תמיד|זהות)$/i.test(t)) return "all";
    if (/^(איןפתרון|איןפתרונות|סתירה)$/.test(t)) return "none";
    return "";
  }

  function relationHolds(left, code, right) {
    if (code === "LT") return left < right - EPS;
    if (code === "GT") return left > right + EPS;
    if (code === "LTE") return left <= right + EPS;
    if (code === "GTE") return left >= right - EPS;
    return near0(left - right);
  }

  function ineqScale(prev, next) {
    var d1 = diff(prev);
    var d2 = diff(next);
    if (near0(d1.a) && near0(d2.a)) {
      if (near0(d1.b) && near0(d2.b)) return 1;
      if (near0(d1.b) || near0(d2.b)) return null;
      return d2.b / d1.b;
    }
    if (near0(d1.a) || near0(d2.a)) return null;
    var k = d2.a / d1.a;
    if (!near0(d2.b - k * d1.b)) return null;
    return k;
  }

  function linSame(u, v) {
    return near0(u.a - v.a) && near0(u.b - v.b);
  }

  function toEquationText(text) {
    return String(text || "").replace(/<=/g, "=").replace(/>=/g, "=").replace(/[<>≤≥]/g, "=");
  }

  function bareXText(side) {
    return /^x$/i.test(String(side || "").replace(/\s+/g, ""));
  }

  function splitIneqText(text) {
    var s = String(text || "").trim().replace(/<=/g, "≤").replace(/>=/g, "≥");
    var m = s.match(/≤|≥|<|>/);
    if (!m) return null;
    return {
      left: s.slice(0, m.index).trim(),
      right: s.slice(m.index + m[0].length).trim(),
      symbol: m[0],
    };
  }

  function ineqSolvedShape(text, parsed) {
    var sp = splitIneqText(text);
    if (!sp || !parsed) return false;
    if (bareXText(sp.left) && isolatedRhsKind("x=" + sp.right, "x") === "value") return true;
    if (bareXText(sp.right) && isolatedRhsKind("x=" + sp.left, "x") === "value") return true;
    return false;
  }

  function checkIneqStep(previousText, nextText) {
    if (normalizeKey(previousText) === normalizeKey(nextText)) {
      return {
        ok: false,
        same: true,
        message: "זה אותו אי־שוויון. כתבו צעד חדש.",
      };
    }
    var prev;
    try {
      prev = parseEquation(previousText);
    } catch (err) {
      return { ok: false, message: "האי־שוויון הקודם לא ניתן לקריאה: " + err.message };
    }
    if (prev.rel === "EQ") {
      return { ok: false, message: "זה לא אי־שוויון." };
    }
    var concluded = ineqConclusion(nextText);
    if (!concluded && global.DoctematicaFnModel) {
      if (global.DoctematicaFnModel.isEmptySet(nextText)) concluded = "none";
      else if (global.DoctematicaFnModel.isAllReals(nextText)) concluded = "all";
    }
    if (concluded) {
      var d0 = diff(prev);
      if (!near0(d0.a)) {
        return { ok: false, message: "עדיין יש x באי־שוויון. זו לא זהות וגם לא סתירה." };
      }
      var holds0 = relationHolds(prev.left.b, prev.rel, prev.right.b);
      if (concluded === "all" && holds0) {
        return { ok: true, solved: true, message: "זהו הפתרון: כל x." };
      }
      if (concluded === "none" && !holds0) {
        return { ok: true, solved: true, message: "זהו הפתרון: אין פתרון." };
      }
      return {
        ok: false,
        errorId: concluded === "all" ? "inequalityIdentity" : "inequalityEmpty",
        message: holds0
          ? "האי־שוויון נכון לכל x. אין לומר שאין פתרון."
          : "האי־שוויון אינו נכון. אין לומר שכל x מתאים.",
      };
    }
    if (!isInequalityText(nextText) && /=/.test(String(nextText))) {
      return {
        ok: false,
        errorId: "inequalityBecameEqual",
        message: "החלפתם את סימן אי־השוויון בסימן שוויון.",
      };
    }
    var next;
    try {
      next = parseEquation(nextText);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    if (next.rel === "EQ") {
      return {
        ok: false,
        errorId: "inequalityBecameEqual",
        message: "החלפתם את סימן אי־השוויון בסימן שוויון.",
      };
    }
    var eqPrev;
    var eqNext;
    try {
      eqPrev = parseEquation(toEquationText(previousText));
      eqNext = parseEquation(toEquationText(nextText));
    } catch (err2) {
      return { ok: false, message: err2.message };
    }
    if (!equivalent(eqPrev, eqNext)) {
      var classified = DoctematicaErrors.classify(eqPrev, eqNext);
      return { ok: false, errorId: classified.id, message: classified.message };
    }
    var k = ineqScale(eqPrev, eqNext);
    var expected = k != null && k < -EPS ? flipRelCode(prev.rel) : prev.rel;
    if (next.rel === expected) {
      var show = String(nextText).trim().replace(/-/g, "−").replace(/<=/g, "≤").replace(/>=/g, "≥");
      if (ineqSolvedShape(nextText, next)) {
        return { ok: true, solved: true, message: "זהו הפתרון: " + show + "." };
      }
      if (near0(diff(next).a)) {
        return {
          ok: true,
          solved: false,
          message: relationHolds(next.left.b, next.rel, next.right.b)
            ? "צעד חוקי. לא נשאר x, והאי־שוויון נכון. רשמו שכל x מתאים."
            : "צעד חוקי. לא נשאר x, והאי־שוויון אינו נכון. רשמו שאין פתרון.",
        };
      }
      return { ok: true, solved: false, message: "צעד חוקי. המשיכו לבודד את x." };
    }
    if (relLess(next.rel) === relLess(expected) && relStrict(next.rel) !== relStrict(expected)) {
      return {
        ok: false,
        errorId: "inequalityStrictness",
        message: relStrict(expected)
          ? "אי־השוויון חזק. אין להוסיף שוויון: הסימן נשאר " + relChar(expected) + "."
          : "אי־השוויון כולל שוויון. הסימן צריך להישאר " + relChar(expected) + ", לא " + relChar(next.rel) + ".",
      };
    }
    var swapped = linSame(prev.left, next.right) && linSame(prev.right, next.left);
    if (swapped) {
      return {
        ok: false,
        errorId: "inequalitySwapDirection",
        message: "כאשר מחליפים בין שני אגפי אי־השוויון, צריך לכתוב את הסימן בכיוון המתאים כדי לשמור על אותה משמעות.",
      };
    }
    var divisor = null;
    if (near0(prev.left.b) && near0(prev.right.a) && !near0(prev.left.a)) divisor = prev.left.a;
    else if (near0(prev.right.b) && near0(prev.left.a) && !near0(prev.right.a)) divisor = prev.right.a;
    if (divisor != null && divisor < 0 && relLess(next.rel) === relLess(prev.rel)) {
      return {
        ok: false,
        errorId: "inequalityDirectionNotFlipped",
        message: "חילקת את שני אגפי אי־השוויון במספר שלילי. במקרה כזה צריך להפוך את כיוון אי־השוויון.",
      };
    }
    if (divisor != null && divisor > 0) {
      return {
        ok: false,
        errorId: "inequalityDirectionFlipped",
        message: "חילקת במספר חיובי, ולכן כיוון אי־השוויון צריך להישאר ללא שינוי.",
      };
    }
    if (k != null && k < -EPS) {
      return {
        ok: false,
        errorId: "inequalityDirectionNotFlipped",
        message: "כפלתם או חילקתם במספר שלילי. במקרה כזה צריך להפוך את כיוון אי־השוויון.",
      };
    }
    return {
      ok: false,
      errorId: "inequalityDirectionFlipped",
      message: "העברת אגף אינה סיבה להפוך את כיוון אי־השוויון.",
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
    var decPlaces = terminatingDecimalPlaces(n, 4);
    if (decPlaces != null) {
      return formatDecimalFixed(n, decPlaces);
    }
    for (var d = 1; d <= 64; d++) {
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

  function continueFromEquation(eqText) {
    var Teach = global.DoctematicaTeach;
    if (Teach && typeof Teach.nextAction === "function") {
      try {
        var act = Teach.nextAction(eqText);
        if (act && act.hint && !act.done) return act.hint;
      } catch (err) {}
    }
    return "המשיכו לפי המשוואה שכתבתם.";
  }

  function checkStep(previousText, nextText, opts) {
    opts = opts || {};
    if (hasParamLetter(previousText) || hasParamLetter(nextText)) {
      return checkParamStep(previousText, nextText, opts);
    }
    if (isInequalityText(previousText) || isInequalityText(nextText) || ineqConclusion(nextText)) {
      return checkIneqStep(previousText, nextText);
    }
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
      if (DoctematicaErrors.distributionMistake) {
        var distributed = DoctematicaErrors.distributionMistake(previousText, nextText);
        if (distributed) {
          return { ok: false, errorId: distributed.id, message: distributed.message };
        }
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
        : continueFromEquation(nextText),
    };
  }

  function hasParamLetter(text) {
    return /[a-wyz]/i.test(rewriteFractions(String(text || "")));
  }

  function pClean(p) {
    var o = {};
    Object.keys(p || {}).forEach(function (k) {
      if (!near0(p[k])) o[k] = p[k];
    });
    return o;
  }

  function pNum(n) {
    return near0(n) ? {} : { "": n };
  }

  function pIsZero(p) {
    return Object.keys(pClean(p)).length === 0;
  }

  function pIsNumber(p) {
    var keys = Object.keys(pClean(p));
    return keys.length === 0 || (keys.length === 1 && keys[0] === "");
  }

  function pConst(p) {
    return (p && p[""]) || 0;
  }

  function pAdd(a, b) {
    var o = {};
    Object.keys(a || {}).forEach(function (k) {
      o[k] = a[k];
    });
    Object.keys(b || {}).forEach(function (k) {
      o[k] = (o[k] || 0) + b[k];
    });
    return pClean(o);
  }

  function pSub(a, b) {
    return pAdd(a, pScale(b, -1));
  }

  function pScale(a, s) {
    var o = {};
    Object.keys(a || {}).forEach(function (k) {
      o[k] = a[k] * s;
    });
    return pClean(o);
  }

  function monoKey(ka, kb) {
    if (!ka) return kb || "";
    if (!kb) return ka;
    return (ka + "*" + kb).split("*").sort().join("*");
  }

  function pMul(a, b) {
    var o = {};
    Object.keys(a || {}).forEach(function (ka) {
      Object.keys(b || {}).forEach(function (kb) {
        var key = monoKey(ka, kb);
        o[key] = (o[key] || 0) + a[ka] * b[kb];
      });
    });
    return pClean(o);
  }

  function pNear(a, b) {
    var keys = {};
    Object.keys(a || {}).forEach(function (k) {
      keys[k] = true;
    });
    Object.keys(b || {}).forEach(function (k) {
      keys[k] = true;
    });
    var ok = true;
    Object.keys(keys).forEach(function (k) {
      if (!near0(((a && a[k]) || 0) - ((b && b[k]) || 0))) ok = false;
    });
    return ok;
  }

  function fZero() {
    return { x: {}, k: {} };
  }

  function fAdd(u, v) {
    return { x: pAdd(u.x, v.x), k: pAdd(u.k, v.k) };
  }

  function fSub(u, v) {
    return { x: pSub(u.x, v.x), k: pSub(u.k, v.k) };
  }

  function fScale(u, s) {
    return { x: pScale(u.x, s), k: pScale(u.k, s) };
  }

  function fMul(u, v) {
    if (!pIsZero(u.x) && !pIsZero(v.x)) {
      throw new Error("הכפל יוצר איבר עם x². בשלב זה מתרגלים משוואות ממעלה ראשונה.");
    }
    if (pIsZero(u.x) && pIsZero(v.x)) return { x: {}, k: pMul(u.k, v.k) };
    if (pIsZero(u.x)) return { x: pMul(u.k, v.x), k: pMul(u.k, v.k) };
    return { x: pMul(v.k, u.x), k: pMul(v.k, u.k) };
  }

  function fDiv(u, v) {
    if (!pIsZero(v.x)) throw new Error("אפשר לחלק רק במספר קבוע שונה מאפס.");
    if (!pIsNumber(v.k)) {
      var err = new Error("param-div");
      err.code = "param-div";
      throw err;
    }
    var n = pConst(v.k);
    if (near0(n)) throw new Error("אי אפשר לחלק באפס.");
    return fScale(u, 1 / n);
  }

  function parseParamEquation(text, target) {
    target = target || "x";
    var tokens = tokenize(text, { allowParams: true });
    var eqIndex = -1;
    var i;
    for (i = 0; i < tokens.length; i++) {
      if (tokens[i].t === "=") {
        if (eqIndex !== -1) throw new Error("יותר מסימן שוויון אחד.");
        eqIndex = i;
      }
    }
    if (eqIndex === -1) throw new Error("חסר סימן שווה");
    var leftToks = tokens.slice(0, eqIndex);
    var rightToks = tokens.slice(eqIndex + 1);
    if (!leftToks.length || !rightToks.length) throw new Error("חסר אגף במשוואה.");
    var left = parseParamSide(leftToks, target);
    var right = parseParamSide(rightToks, target);
    return {
      left: left,
      right: right,
      source: String(text).trim(),
      param: true,
      target: target,
    };
  }

  function parseParamSide(tokens, target) {
    target = target || "x";
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
        left = op === "+" ? fAdd(left, right) : fSub(left, right);
      }
      return left;
    }
    function parseTerm() {
      var left = parseUnary();
      while (peek() && (peek().t === "*" || peek().t === "/")) {
        var op = eat().t;
        var right = parseUnary();
        left = op === "*" ? fMul(left, right) : fDiv(left, right);
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
        return fMul({ x: {}, k: { "": -1 } }, parseUnary());
      }
      return parsePrimary();
    }
    function parsePrimary() {
      var tok = peek();
      if (!tok) throw new Error("הביטוי נקטע באמצע.");
      if (tok.t === "num") {
        eat();
        return { x: {}, k: pNum(tok.v) };
      }
      if (tok.t === "x2") throw new Error("בשלב הזה מבודדים את " + target + ", בלי חזקות.");
      if (tok.t === "x" || tok.t === "param") {
        var name = tok.t === "x" ? "x" : tok.v;
        eat();
        if (name === target) return { x: { "": 1 }, k: {} };
        var pk = {};
        pk[name] = 1;
        return { x: {}, k: pk };
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
    if (i !== tokens.length) throw new Error("לא הצלחתי לקרוא את כל המשוואה.");
    return value;
  }

  function paramEquivalent(eqA, eqB) {
    var d1 = fSub(eqA.left, eqA.right);
    var d2 = fSub(eqB.left, eqB.right);
    var z1 = pIsZero(d1.x);
    var z2 = pIsZero(d2.x);
    if (z1 && z2) return pIsZero(d1.k) === pIsZero(d2.k);
    if (z1 || z2) return false;
    return pIsZero(pSub(pMul(d1.x, d2.k), pMul(d2.x, d1.k)));
  }

  function asciiEq(text) {
    return rewriteFractions(String(text || "")).replace(/\s+/g, "");
  }

  function splitParamTerms(side) {
    var s = String(side || "").replace(/\s+/g, "").replace(/[−–—]/g, "-");
    var terms = [];
    var depth = 0;
    var start = 0;
    var i;
    for (i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === "(") depth += 1;
      else if (c === ")") depth -= 1;
      else if (depth === 0 && (c === "+" || c === "-") && i > start) {
        terms.push(s.slice(start, i));
        start = i;
      }
    }
    if (start < s.length) terms.push(s.slice(start));
    return terms.filter(function (t) {
      return t && t !== "+";
    });
  }

  function eqSides(text) {
    var raw = String(text || "").replace(/[−–—]/g, "-");
    var i = raw.indexOf("=");
    if (i < 0) return null;
    return { left: raw.slice(0, i).trim(), right: raw.slice(i + 1).trim() };
  }

  function bareXSide(side) {
    return /^[+\s]*x$/i.test(String(side || "").replace(/[−–—]/g, "-").trim());
  }

  function fracOk(term) {
    var m = String(term || "").match(/(-?\d*)\/(\d+)/);
    if (!m) return true;
    var raw = m[1];
    var n = raw === "" || raw === "-" || raw === "+" ? 1 : Math.abs(parseInt(raw, 10));
    var d = parseInt(m[2], 10);
    if (!d || n !== n) return false;
    if (gcdNum(n, d) !== 1) return false;
    if (n % d === 0) return false;
    return true;
  }

  function termMonomial(term) {
    var t = String(term || "").replace(/^\+/, "");
    if (/[()*]/.test(t)) return null;
    if (!fracOk(t)) return null;
    if (!/^-?(?:\d+\/\d+|\d+)?[a-z]?$/i.test(t) && !/^-?[a-z]\/\d+$/i.test(t)) return null;
    var letter = (t.match(/[a-z]/i) || [""])[0].toLowerCase();
    if (letter === "x") return "x";
    return letter;
  }

  function sideSimplified(side) {
    var terms = splitParamTerms(side);
    if (!terms.length) return false;
    var seen = {};
    var i;
    for (i = 0; i < terms.length; i++) {
      var key = termMonomial(terms[i]);
      if (key == null) return false;
      if (seen[key]) return false;
      seen[key] = true;
    }
    return true;
  }

  function bareTargetSide(side, target) {
    return new RegExp("^[+\\s]*" + (target || "x") + "$", "i").test(String(side || "").replace(/[−–—]/g, "-").trim());
  }

  function isolatedWritten(text, target) {
    target = target || "x";
    var sides = eqSides(text);
    if (!sides) return null;
    if (bareTargetSide(sides.left, target) || bareXSide(sides.left) && target === "x") {
      if (bareTargetSide(sides.left, target)) return { rhs: sides.right, simplified: sideSimplified(sides.right) };
    }
    if (bareTargetSide(sides.left, target)) return { rhs: sides.right, simplified: sideSimplified(sides.right) };
    if (bareTargetSide(sides.right, target)) return { rhs: sides.left, simplified: sideSimplified(sides.left) };
    return null;
  }

  function letterCount(text, letter) {
    var s = asciiEq(text);
    var n = 0;
    var i;
    for (i = 0; i < s.length; i++) if (s.charAt(i).toLowerCase() === String(letter || "").toLowerCase()) n += 1;
    return n;
  }

  function plugToken(value, prevChar) {
    var num = String(value);
    var wrapped = value < 0 ? "(" + num + ")" : num;
    if (/[0-9a-z)]/i.test(prevChar || "")) return "*" + wrapped;
    return wrapped;
  }

  function substitutePlug(text, letter, value) {
    var s = asciiEq(text);
    var want = String(letter).toLowerCase();
    var out = "";
    var i;
    for (i = 0; i < s.length; i++) {
      if (s.charAt(i).toLowerCase() !== want) {
        out += s.charAt(i);
        continue;
      }
      var prev = i > 0 ? s.charAt(i - 1) : "";
      if (/[a-z]/i.test(prev) && prev.toLowerCase() !== want) {
        var name = out.charAt(out.length - 1);
        var before = out.length >= 2 ? out.charAt(out.length - 2) : "";
        var earlier = out.length >= 3 ? out.charAt(out.length - 3) : "";
        var signed = before === "-" && (out.length === 2 || /[=+(]/.test(earlier));
        var bare = out.length === 1 || /[=+(]/.test(before);
        if (signed || bare) {
          var coef = (signed ? -1 : 1) * Number(value);
          out = out.slice(0, signed ? -2 : -1);
          if (coef < 0 && out.charAt(out.length - 1) === "+") out = out.slice(0, -1);
          out += letterTimes(name, coef).text;
          continue;
        }
      }
      out += plugToken(value, prev);
    }
    return out;
  }

  function prettyCompactEq(eq) {
    var s = String(eq || "");
    var out = "";
    var depth = 0;
    var i;
    for (i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === "(") depth += 1;
      if (c === ")" && depth) depth -= 1;
      if (depth === 0 && i > 0 && (c === "+" || c === "-") && s.charAt(i - 1) !== "(" && s.charAt(i - 1) !== "=") {
        out += c === "+" ? " + " : " − ";
        continue;
      }
      out += c === "-" ? "−" : c;
    }
    return out.replace(/\s*=\s*/g, " = ").replace(/\s+/g, " ").trim();
  }

  function plugSolvedMessage(nextText, target) {
    var iso = isolatedWritten(nextText, target);
    if (iso && iso.simplified) {
      return {
        ok: true,
        solved: true,
        message: "זהו הפתרון: " + target + " = " + uMinus(String(iso.rhs).replace(/\s+/g, "").replace(/-/g, "−")) + ".",
      };
    }
    if (iso) {
      return { ok: true, solved: false, message: "הפתרון נכון עד כאן. אפשר עדיין לפשט את הביטוי." };
    }
    return { ok: true, solved: false, message: "צעד חוקי. המשיכו לבודד את " + target + "." };
  }

  function describeProduct(text) {
    var s = asciiEq(text);
    var starParen = s.match(/(-?\d+)\*\((-?\d+)\)/);
    if (starParen) {
      var starP = Number(starParen[1]) * Number(starParen[2]);
      return uMinus(starParen[1]) + "·(" + uMinus(starParen[2]) + ") = " + uMinus(String(starP));
    }
    var star = s.match(/(-?\d+)\*(-?\d+)/);
    if (star) {
      var starN = Number(star[1]) * Number(star[2]);
      return uMinus(star[1]) + "·" + uMinus(star[2]) + " = " + uMinus(String(starN));
    }
    var m = s.match(/(-?\d+)\((-?\d+)\)/);
    if (m) {
      var prod = Number(m[1]) * Number(m[2]);
      return uMinus(m[1]) + "·(" + uMinus(m[2]) + ") = " + uMinus(String(prod));
    }
    var u = s.match(/-\((-?\d+)\)/);
    if (u) {
      var val = -Number(u[1]);
      return "−(" + uMinus(u[1]) + ") = " + uMinus(String(val));
    }
    return "";
  }

  function plugVerdict(previousText, nextText, opts) {
    if (!opts || !opts.given || opts.given.value == null || opts.given.value === "") return null;
    var letter = String(opts.given.letter || "x");
    var value = Number(opts.given.value);
    var target = opts.target || "a";
    if (!letterCount(previousText, letter)) return null;
    if (normalizeKey(previousText) === normalizeKey(nextText)) return null;
    var before = letterCount(previousText, letter);
    var after = letterCount(nextText, letter);
    if (after > 0 && after < before) {
      return {
        ok: false,
        errorId: "partial_plug",
        message: letter + " מופיע ביותר ממקום אחד במשוואה. ודא שהצבת את הערך בכל המופעים שלו.",
      };
    }
    if (after === before) {
      var tb = letterCount(previousText, target);
      var ta = letterCount(nextText, target);
      if (ta < tb && asciiEq(nextText).indexOf(String(Math.abs(value))) >= 0) {
        return {
          ok: false,
          errorId: "plug_wrong_letter",
          message: "הנתון הוא ערך של " + letter + ", לא של " + target + ". מציבים את " + uMinus(String(value)) + " במקום " + letter + ".",
        };
      }
      return null;
    }
    var good = substitutePlug(previousText, letter, value);
    var goodParsed;
    var nextParsed;
    try {
      goodParsed = parseParamEquation(good, target);
      nextParsed = parseParamEquation(nextText, target);
    } catch (err) {
      return { ok: false, message: err.message || "לא הצלחתי לקרוא את המשוואה אחרי ההצבה." };
    }
    if (paramEquivalent(goodParsed, nextParsed)) return plugSolvedMessage(nextText, target);
    var dropped = asciiEq(previousText).replace(new RegExp("\\d+" + letter, "gi"), value < 0 ? "(" + value + ")" : String(value));
    dropped = dropped.replace(new RegExp(letter, "gi"), value < 0 ? "(" + value + ")" : String(value));
    try {
      if (paramEquivalent(parseParamEquation(dropped, target), nextParsed)) {
        var coef = (asciiEq(previousText).match(new RegExp("(\\d+)" + letter, "i")) || [])[1];
        if (coef) {
          return {
            ok: false,
            errorId: "drop_coeff",
            message: coef + letter + " עם " + letter + " = " + uMinus(String(value)) + " הופך ל־" + coef + "*" + (value < 0 ? "(" + uMinus(String(value)) + ")" : uMinus(String(value))) + ", לא ל־" + uMinus(String(value)) + ".",
          };
        }
      }
    } catch (e1) {}
    var signLost = "";
    var src = asciiEq(previousText);
    var i;
    for (i = 0; i < src.length; i++) {
      if (src.charAt(i).toLowerCase() !== letter) {
        signLost += src.charAt(i);
        continue;
      }
      var prevCh = i > 0 ? src.charAt(i - 1) : "";
      var before2 = i > 1 ? src.charAt(i - 2) : "";
      if (prevCh === "-" && !/[0-9]/.test(before2)) signLost += String(Math.abs(value));
      else signLost += plugToken(value, prevCh);
    }
    try {
      if (signLost !== good && paramEquivalent(parseParamEquation(signLost, target), nextParsed)) {
        return {
          ok: false,
          errorId: "plug_sign",
          message: "שימו לב לסימן. " + letter + " = " + uMinus(String(value)) + ", ולכן −" + letter + " = −(" + uMinus(String(value)) + "), לא " + uMinus(String(value)) + ".",
        };
      }
    } catch (e2) {}
    if (pNear(goodParsed.left.x, nextParsed.left.x) && pNear(goodParsed.right.x, nextParsed.right.x)) {
      var shown = describeProduct(good);
      return {
        ok: false,
        errorId: "plug_arith",
        message: shown
          ? "ההצבה נכונה, אבל יש טעות בחישוב. " + shown + "."
          : "ההצבה נכונה, אבל יש טעות בחישוב.",
      };
    }
    return { ok: false, errorId: "plug", message: "הצעד לא שקול להצבה של " + letter + " = " + uMinus(String(value)) + "." };
  }

  function showTerm(coeff, letter) {
    var neg = coeff < 0;
    var abs = Math.abs(coeff);
    var body;
    if (!letter) body = formatNumber(abs).split(" או ")[0];
    else if (near0(abs - 1)) body = letter;
    else {
      var num = formatNumber(abs).split(" או ")[0];
      if (num.indexOf("/") >= 0 && num.indexOf(" ") < 0) {
        var bits = num.split("/");
        body = (bits[0] === "1" ? letter : bits[0] + letter) + "/" + bits[1];
      } else body = num + letter;
    }
    return (neg ? "−" : "") + body;
  }

  function uMinus(s) {
    return String(s || "").replace(/-/g, "−");
  }

  function numericXOnly(form) {
    return pIsNumber(form.x) && pIsZero(form.k);
  }

  function classifyParam(prevText, nextText, prev, next) {
    var expandMsg = diagnoseExpand(prevText, prev, next);
    if (expandMsg) return { id: "expand", message: expandMsg };
    var flip = movedWithoutFlip(prev, next);
    if (flip) return { id: "move_without_sign_flip", message: flip };
    var subCoeff = subtractedCoeff(prev, next);
    if (subCoeff) return { id: "subtract_coeff", message: subCoeff };
    var partial = partialDivide(prev, next);
    if (partial) return { id: "partial_divide", message: partial };
    var wrong = wrongDivisor(prev, next, nextText);
    if (wrong) return { id: "wrong_divisor", message: wrong };
    var unlike = unlikeCombine(prev, next);
    if (unlike) return { id: "unlike", message: unlike };
    var arith = arithMiss(prev, next);
    if (arith) return { id: "arith", message: arith };
    return { id: "not_equivalent", message: "הצעד לא חוקי: המשוואה החדשה אינה שקולה לקודמת." };
  }

  function diagnoseExpand(prevText, prev, next) {
    var compact = asciiEq(prevText);
    var m = compact.match(/([+-]?\d*)\(([^()]+)\)/);
    if (!m) return null;
    var coefRaw = m[1];
    if (coefRaw === "" || coefRaw === "+") coefRaw = "1";
    if (coefRaw === "-") coefRaw = "-1";
    var k = parseInt(coefRaw, 10);
    if (!k) return null;
    var innerTerms = splitParamTerms(m[2]);
    if (innerTerms.length < 2) return null;
    var side = compact.indexOf(m[0]) < compact.indexOf("=") ? "left" : "right";
    var other = side === "left" ? "right" : "left";
    if (!pNear(prev[other].x, next[other].x) || !pNear(prev[other].k, next[other].k)) return null;
    var exp = prev[side];
    var got = next[side];
    if (pNear(exp.x, got.x) && pNear(exp.k, got.k)) return null;
    var first = innerTerms[0];
    var second = innerTerms[1];
    var firstLetter = ((first.match(/[a-z]/i) || [""])[0] || "").toLowerCase();
    var secondLetter = ((second.match(/[a-z]/i) || [""])[0] || "").toLowerCase();
    var unk = (prev && prev.target) || "x";
    function coeffOf(form, letter) {
      if (!letter) return 0;
      if (letter === unk) return pConst(form.x);
      return form.k[letter] || 0;
    }
    var f1 = coeffOf(got, firstLetter);
    var f2 = coeffOf(got, secondLetter);
    var e1 = coeffOf(exp, firstLetter);
    var e2 = coeffOf(exp, secondLetter);
    var i1 = coeffOf(parseInnerTerm(first, unk), firstLetter);
    var i2 = coeffOf(parseInnerTerm(second, unk), secondLetter);
    var expectedBits = [];
    var bi;
    for (bi = 0; bi < innerTerms.length; bi++) {
      var scaledBit = scaleWrittenTerm(innerTerms[bi], k);
      if (scaledBit) expectedBits.push(scaledBit);
    }
    var expectedShow = expectedBits.length ? joinParamTerms(expectedBits) : formatForm(exp);
    if (near0(f1 - e1) && near0(f2 - i2) && !near0(e2 - i2)) {
      return "הכפלתם רק את האיבר הראשון בסוגריים. צריך לכפול את " + String(Math.abs(k)) + " בכל איבר.";
    }
    if (near0(f2 - e2) && near0(f1 - i1) && !near0(e1 - i1)) {
      return "הכפלתם רק את האיבר השני בסוגריים. צריך לכפול את " + String(Math.abs(k)) + " בכל איבר.";
    }
    if (near0(f1 - e1) && near0(f2 + e2) && !near0(e2)) {
      return "סימן המינוס אבד בפתיחת הסוגריים. " + uMinus(m[0]) + " = " + expectedShow + ".";
    }
    if (near0(f1 + e1) && near0(f2 - e2) && !near0(e1)) {
      return "סימן המינוס אבד בפתיחת הסוגריים. " + uMinus(m[0]) + " = " + expectedShow + ".";
    }
    return "פתיחת הסוגריים לא נכונה. כופלים את המקדם שבחוץ בכל איבר שבפנים.";
  }

  function parseInnerTerm(term, target) {
    var t = String(term || "").replace(/^\+/, "");
    if (!t) return fZero();
    try {
      return parseParamEquation(t + "=0", target || "x").left;
    } catch (err) {
      return fZero();
    }
  }

  function formatForm(form) {
    return formatPolyMix(form.k, form.x);
  }

  function formatPolyMix(kPoly, xPoly, letter) {
    letter = letter || "x";
    var chunks = [];
    function pushChunk(text, first) {
      if (!text) return;
      if (!chunks.length) {
        chunks.push(text);
        return;
      }
      if (text.charAt(0) === "−") chunks.push("− " + text.slice(1));
      else chunks.push("+ " + text);
    }
    if (xPoly && !pIsZero(xPoly) && pIsNumber(xPoly)) {
      pushChunk(showTerm(pConst(xPoly), letter), true);
    }
    var keys = Object.keys(kPoly || {}).sort();
    keys.forEach(function (key) {
      if (!key) return;
      pushChunk(showTerm(kPoly[key], key), !chunks.length);
    });
    if (kPoly && kPoly[""] && !near0(kPoly[""])) pushChunk(showTerm(kPoly[""], ""), !chunks.length);
    if (!chunks.length) return "0";
    return chunks.join(" ").replace(/\s+/g, " ").trim();
  }

  function letterOfKey(key, prev) {
    if (key === "x") {
      var n = pConst(prev.left.x) || pConst(prev.right.x) || 1;
      return showTerm(n === 0 ? 1 : Math.abs(n) === 1 ? 1 : n, "x").replace(/^−/, "");
    }
    if (!key) return null;
    return key;
  }

  function movedWithoutFlip(prev, next) {
    var unkName = (prev && prev.target) || "x";
    var bags = [{ name: unkName, read: function (side) { return pConst(side.x); } }];
    var seen = { "": true };
    ["left", "right"].forEach(function (sd) {
      [prev, next].forEach(function (eq) {
        Object.keys(eq[sd].k || {}).forEach(function (k) {
          seen[k] = true;
        });
      });
    });
    Object.keys(seen).forEach(function (k) {
      bags.push({
        name: k,
        read: function (side) {
          return k ? side.k[k] || 0 : pConst(side.k);
        },
      });
    });
    var hit = null;
    bags.forEach(function (bag) {
      if (hit) return;
      var l0 = bag.read(prev.left);
      var l1 = bag.read(next.left);
      var r0 = bag.read(prev.right);
      var r1 = bag.read(next.right);
      var fromLeft = l0 - l1;
      var fromRight = r0 - r1;
      if (Math.abs(fromLeft) > 1e-8 && near0(r1 - (r0 + fromLeft)) && !near0(r1 - (r0 - fromLeft))) {
        hit = signFlipText(fromLeft, bag.name);
      } else if (Math.abs(fromRight) > 1e-8 && near0(l1 - (l0 + fromRight)) && !near0(l1 - (l0 - fromRight))) {
        hit = signFlipText(fromRight, bag.name);
      }
    });
    return hit;
  }

  function signFlipText(taken, key) {
    var shown = !key
      ? formatNumber(Math.abs(taken)).split(" או ")[0]
      : showTerm(taken, key);
    return "העברת את " + uMinus(shown) + " לאגף השני, אבל הסימן שלו לא השתנה.";
  }

  function subtractedCoeff(prev, next) {
    if (!numericXOnly(prev.left) || !pIsZero(prev.right.x)) return null;
    var iso = isolatedWritten(next.source || "");
    if (!iso) return null;
    var c = pConst(prev.left.x);
    if (near0(Math.abs(c) - 1) || near0(c)) return null;
    var rhs = fSub(next.right, next.left);
    var bareLeft = bareXSide(eqSides(next.source).left);
    var got = bareLeft ? next.right.k : next.left.k;
    if (pIsZero(bareLeft ? next.right.x : next.left.x) && pNear(got, pAdd(prev.right.k, pNum(-c)))) {
      return "חיסרתם את המקדם במקום לחלק בו.";
    }
    if (pNear(got, pAdd(prev.right.k, pNum(c)))) return "חיסרתם את המקדם במקום לחלק בו.";
    return null;
  }

  function partialDivide(prev, next) {
    if (!pIsNumber(prev.left.x) || !pIsZero(prev.left.k) || !pIsZero(prev.right.x)) return null;
    var c = pConst(prev.left.x);
    if (near0(c) || near0(Math.abs(c) - 1)) return null;
    if (!near0(pConst(next.left.x) - 1) || !pIsZero(next.left.k)) return null;
    if (!pIsZero(next.right.x)) return null;
    if (pNear(next.right.k, prev.right.k)) return "חילקתם רק חלק מהאגף. צריך לחלק את שני האגפים במקדם.";
    return null;
  }

  function wrongDivisor(prev, next, nextText) {
    if (!pIsNumber(prev.left.x) || !pIsZero(prev.right.x)) return null;
    var c = pConst(prev.left.x);
    if (near0(c) || near0(Math.abs(c) - 1)) return null;
    var iso = isolatedWritten(nextText);
    if (!iso) return null;
    var expect = pScale(prev.right.k, 1 / c);
    var gotSide = bareXSide(eqSides(nextText).left) ? next.right.k : next.left.k;
    if (pNear(gotSide, expect)) return null;
    if (/\/\d*[a-wyz]/i.test(asciiEq(nextText))) {
      return "החלוקה צריכה להתבצע במקדם של " + ((prev && prev.target) || "x") + ", כלומר " + formatNumber(c).split(" או ")[0] + ", ולא בפרמטר.";
    }
    return "החלוקה צריכה להתבצע במקדם של " + ((prev && prev.target) || "x") + ", כלומר " + formatNumber(c).split(" או ")[0] + ".";
  }

  function unlikeCombine(prev, next) {
    var letters = [];
    ["left", "right"].forEach(function (sd) {
      Object.keys(prev[sd].k || {}).forEach(function (k) {
        if (k && letters.indexOf(k) < 0) letters.push(k);
      });
    });
    var msg = null;
    ["left", "right"].forEach(function (sd) {
      if (msg) return;
      var other = sd === "left" ? "right" : "left";
      if (!pNear(prev[other].x, next[other].x) || !pNear(prev[other].k, next[other].k)) return;
      letters.forEach(function (letter) {
        if (msg) return;
        var xv = pConst(prev[sd].x);
        var pv = prev[sd].k[letter] || 0;
        if (near0(xv) || near0(pv)) return;
        var nx = pConst(next[sd].x);
        var np = next[sd].k[letter] || 0;
        if ((near0(nx - (xv + pv)) && near0(np)) || (near0(np - (xv + pv)) && near0(nx))) {
          msg = "אי אפשר לכנס את x עם " + letter + ". אלה איברים שאינם דומים.";
        }
      });
    });
    return msg;
  }

  function arithMiss(prev, next) {
    var px0 = pConst(prev.left.x);
    var px1 = pConst(prev.right.x);
    var nx0 = pConst(next.left.x);
    var nx1 = pConst(next.right.x);
    if (!pIsNumber(prev.left.x) || !pIsNumber(prev.right.x) || !pIsNumber(next.left.x) || !pIsNumber(next.right.x)) return null;
    if (near0(nx1) && !near0(px1) && pNear(prev.left.k, next.left.k) && pNear(prev.right.k, next.right.k)) {
      var expect = px0 - px1;
      if (!near0(nx0 - expect) && !near0(nx0 - px0)) {
        return "הפעולה האלגברית נכונה, אבל יש טעות בחישוב. איברי " + ((prev && prev.target) || "x") + " מצטרפים ל־" + showTerm(expect, (prev && prev.target) || "x") + ".";
      }
    }
    var keys = {};
    ["left", "right"].forEach(function (sd) {
      Object.keys(prev[sd].k || {}).concat(Object.keys(next[sd].k || {})).forEach(function (k) {
        if (k) keys[k] = true;
      });
    });
    var found = null;
    Object.keys(keys).forEach(function (letter) {
      if (found) return;
      var a0 = prev.left.k[letter] || 0;
      var a1 = prev.right.k[letter] || 0;
      var b0 = next.left.k[letter] || 0;
      var b1 = next.right.k[letter] || 0;
      if (near0(b0) && !near0(a0) && near0(pConst(prev.left.x) - pConst(next.left.x)) && near0(pConst(prev.right.x) - pConst(next.right.x))) {
        var expectK = a1 - a0;
        if (!near0(b1 - expectK) && !near0(b1 - a1)) {
          found = "הפעולה האלגברית נכונה, אבל יש טעות בחישוב באיברי " + letter + ".";
        }
      }
    });
    return found;
  }

  function checkParamStep(previousText, nextText, opts) {
    opts = opts || {};
    var target = opts.target || "x";
    if (normalizeKey(previousText) === normalizeKey(nextText)) {
      return {
        ok: false,
        same: true,
        message: "זו אותה משוואה. כתבו צעד חדש — למשל העברת איבר, פתיחת סוגריים, או חילוק במקדם.",
      };
    }
    if (missingEqualsSign(nextText)) return { ok: false, message: "חסר סימן שווה" };
    var computedNow = computeOneNumber(previousText);
    if (computedNow && normalizeKey(computedNow.eq) === normalizeKey(nextText)) {
      return { ok: true, solved: false, message: "מחשבים " + computedNow.shown + "." };
    }
    if (/\^|²/.test(asciiEq(previousText))) {
      var reducedPow = grindComputes(previousText);
      if (normalizeKey(reducedPow) !== normalizeKey(previousText)) {
        var afterPow = checkParamStep(reducedPow, nextText, opts);
        if (afterPow && afterPow.ok) return afterPow;
        var powErr = powerMistake(previousText, nextText);
        if (powErr) return powErr;
        var prodErr = wrongProduct(computedNow && computedNow.eq, nextText);
        if (prodErr) return prodErr;
        return afterPow || { ok: false, message: "הצעד לא שקול למשוואה." };
      }
    }
    var plugged = plugVerdict(previousText, nextText, opts);
    if (plugged) return plugged;
    var prev;
    var next;
    try {
      prev = parseParamEquation(previousText, target);
    } catch (err) {
      return { ok: false, message: "המשוואה הקודמת לא ניתנת לקריאה: " + err.message };
    }
    try {
      next = parseParamEquation(nextText, target);
    } catch (err) {
      if (err && err.code === "param-div") {
        var c = pIsNumber(prev.left.x) ? pConst(prev.left.x) : null;
        return {
          ok: false,
          errorId: "param_div",
          message: c && !near0(c)
            ? "החלוקה צריכה להתבצע במקדם של " + target + ", כלומר " + formatNumber(c).split(" או ")[0] + ", ולא בפרמטר."
            : "אי אפשר לחלק בביטוי עם פרמטר בלי לבדוק שהוא לא מתאפס.",
        };
      }
      return { ok: false, message: err.message };
    }
    prev.source = String(previousText);
    next.source = String(nextText);
    if (!paramEquivalent(prev, next)) {
      if (pNear(prev.left.x, next.left.x) && pNear(prev.right.x, next.right.x)) {
        var prod = describeProduct(previousText);
        if (prod && asciiEq(nextText).indexOf(asciiEq(prod.split("=")[0] || "___")) < 0 && /\(/.test(asciiEq(previousText))) {
          return { ok: false, errorId: "plug_arith", message: "ההצבה נכונה, אבל יש טעות בחישוב. " + prod + "." };
        }
      }
      var classified = classifyParam(previousText, nextText, prev, next);
      return { ok: false, errorId: classified.id, message: classified.message };
    }
    if (opts.given && letterCount(nextText, String(opts.given.letter || "x"))) {
      return {
        ok: true,
        solved: false,
        equation: next,
        message: "צעד חוקי. כעת הציבו את " + String(opts.given.letter || "x") + ".",
      };
    }
    var iso = isolatedWritten(nextText, target);
    if (iso && iso.simplified) {
      return {
        ok: true,
        solved: true,
        equation: next,
        message: "זהו הפתרון: " + target + " = " + uMinus(String(iso.rhs).replace(/\s+/g, "").replace(/-/g, "−")) + ".",
      };
    }
    if (iso) {
      return {
        ok: true,
        solved: false,
        equation: next,
        message: "הפתרון נכון עד כאן. אפשר עדיין לפשט את הביטוי.",
      };
    }
    return {
      ok: true,
      solved: false,
      equation: next,
      message: "צעד חוקי. המשיכו לבודד את " + target + ".",
    };
  }

  function joinParamTerms(terms) {
    if (!terms.length) return "0";
    var s = String(terms[0] || "").replace(/^\+/, "");
    if (s.charAt(0) === "-") s = "−" + s.slice(1);
    var i;
    for (i = 1; i < terms.length; i++) {
      var t = String(terms[i] || "");
      if (t.charAt(0) === "+") s += " + " + t.slice(1);
      else if (t.charAt(0) === "-") s += " − " + t.slice(1);
      else s += " + " + t;
    }
    return s;
  }

  function signedTerms(terms) {
    return terms
      .map(function (t) {
        var s = String(t || "").replace(/^\+/, "").replace(/−/g, "-");
        if (s.charAt(0) !== "-") s = "+" + s;
        return uMinus(s);
      })
      .join(" ואת ");
  }

  function flipWritten(term) {
    var t = String(term || "").replace(/^\+/, "");
    if (t.charAt(0) === "-") return "+" + t.slice(1);
    return "-" + t;
  }

  function termLetter(term, target) {
    target = target || "x";
    var letters = String(term || "").replace(/[^a-z]/gi, "").toLowerCase();
    if (letters.indexOf(target) >= 0) return target;
    return letters;
  }

  function needsCombine(side, target) {
    var seen = {};
    var terms = splitParamTerms(side);
    var i;
    for (i = 0; i < terms.length; i++) {
      if (/\(/.test(terms[i])) return false;
      var key = termLetter(terms[i], target);
      if (seen[key]) return true;
      seen[key] = true;
    }
    return false;
  }

  function combineSide(side, target) {
    target = target || "x";
    var dummy = side + "=0";
    var eq = parseParamEquation(dummy, target);
    var form = eq.left;
    return formatPolyMix(form.k, form.x, target);
  }

  function grindComputes(eqText) {
    var cur = eqText;
    var guard = 0;
    while (guard++ < 8) {
      var step = computeOneNumber(cur);
      if (!step) break;
      cur = step.eq;
    }
    return cur;
  }

  function powerMistake(prev, next) {
    var s = asciiEq(prev);
    var wrapped = s.match(/\((-?\d+)\)\^(\d+)/);
    if (wrapped) {
      var base = Number(wrapped[1]);
      var exp = Number(wrapped[2]);
      var correct = Math.pow(base, exp);
      var dropped = prettyCompactEq(s.replace(wrapped[0], String(base)));
      var keptParen = prettyCompactEq(s.replace(wrapped[0], "(" + String(base) + ")"));
      if (normalizeKey(dropped) === normalizeKey(next) || normalizeKey(keptParen) === normalizeKey(next)) {
        return {
          ok: false,
          errorId: "power",
          message: "טעות בחזקה. (" + uMinus(String(base)) + ")^" + exp + " = " + uMinus(String(correct)) + ", לא " + uMinus(String(base)) + ".",
        };
      }
      return null;
    }
    var bare = s.match(/(^|[=+\-*/])(\d+)\^(\d+)/);
    if (!bare) return null;
    var bareCorrect = Math.pow(Number(bare[2]), Number(bare[3]));
    var bareDropped = prettyCompactEq(s.replace(bare[2] + "^" + bare[3], bare[2]));
    if (normalizeKey(bareDropped) === normalizeKey(next)) {
      return {
        ok: false,
        errorId: "power",
        message: "טעות בחזקה. " + bare[2] + "^" + bare[3] + " = " + String(bareCorrect) + ", לא " + bare[2] + ".",
      };
    }
    return null;
  }

  function wrongProduct(fromEq, nextText) {
    if (!fromEq) return null;
    var s = asciiEq(fromEq);
    var m = s.match(/(-?\d+)\((-?\d+)\)/);
    if (!m) return null;
    var prod = Number(m[1]) * Number(m[2]);
    var flipped = prettyCompactEq(s.replace(m[0], String(-prod)));
    if (normalizeKey(flipped) !== normalizeKey(nextText)) return null;
    return {
      ok: false,
      errorId: "plug_arith",
      message: "ההצבה נכונה, אבל יש טעות בחישוב. " + uMinus(m[1]) + "·(" + uMinus(m[2]) + ") = " + uMinus(String(prod)) + ".",
    };
  }

  function computeOneNumber(eqText) {
    var s = asciiEq(eqText);
    var pow = s.match(/\((-?\d+)\)\^(\d+)/);
    var barePow = s.match(/(^|[=+\-*/(])(\d+)\^(\d+)/);
    if (pow && (!barePow || s.indexOf(pow[0]) <= s.indexOf(barePow[2] + "^" + barePow[3]))) {
      var p = Math.pow(Number(pow[1]), Number(pow[2]));
      var at = s.indexOf(pow[0]);
      var prev = at > 0 ? s.charAt(at - 1) : "";
      var repl = /[0-9a-z)]/i.test(prev) ? "(" + String(p) + ")" : String(p);
      return {
        eq: prettyCompactEq(s.slice(0, at) + repl + s.slice(at + pow[0].length)),
        shown: "(" + uMinus(pow[1]) + ")^" + pow[2],
      };
    }
    if (barePow) {
      var token = barePow[2] + "^" + barePow[3];
      var bareVal = Math.pow(Number(barePow[2]), Number(barePow[3]));
      return { eq: prettyCompactEq(s.replace(token, String(bareVal))), shown: token };
    }
    var shown = [];
    function swap(re, build) {
      s = s.replace(re, function () {
        var hit = build.apply(null, arguments);
        shown.push(hit.shown);
        return hit.text;
      });
    }
    swap(/(-?\d+)\*\((-?\d+)\)/g, function (all, a, b) {
      return { text: String(Number(a) * Number(b)), shown: uMinus(a) + "·(" + uMinus(b) + ")" };
    });
    swap(/(-?\d+)\*(-?\d+)/g, function (all, a, b) {
      return { text: String(Number(a) * Number(b)), shown: uMinus(a) + "·" + uMinus(b) };
    });
    swap(/([a-z])\*\((-?\d+)\)/gi, function (all, name, b) {
      return letterTimes(name, Number(b));
    });
    swap(/([a-z])\*(-?\d+)/gi, function (all, name, b) {
      return letterTimes(name, Number(b));
    });
    swap(/(-?\d+)\((-?\d+)\)/g, function (all, a, b) {
      return { text: String(Number(a) * Number(b)), shown: uMinus(a) + "·(" + uMinus(b) + ")" };
    });
    swap(/-\((-?\d+)\)/g, function (all, a) {
      return { text: String(-Number(a)), shown: "−(" + uMinus(a) + ")" };
    });
    swap(/([a-z])\((-?\d+)\)/gi, function (all, name, b) {
      return letterTimes(name, Number(b));
    });
    if (!shown.length) return null;
    return { eq: prettyCompactEq(s), shown: shown.join(" וגם ") };
  }

  function letterTimes(name, coef) {
    var text = coef === 0 ? "0" : coef === 1 ? name : coef === -1 ? "-" + name : String(coef) + name;
    return { text: text, shown: name + "·(" + uMinus(String(coef)) + ")" };
  }

  function foldOneParen(eqText) {
    var s = asciiEq(eqText);
    var changed = false;
    var folded = 0;
    var next = s.replace(/\(([^()]*)\)/g, function (all, inner) {
      if (!/[a-z]/i.test(inner)) return all;
      var terms = splitParamTerms(inner);
      var nums = [];
      var rest = [];
      terms.forEach(function (t) {
        if (/[a-z]/i.test(t)) rest.push(t);
        else nums.push(t);
      });
      if (nums.length < 2) return all;
      var sum = 0;
      nums.forEach(function (t) {
        sum += Number(t);
      });
      var pieces = [];
      if (sum > 0) pieces.push(String(sum));
      pieces = pieces.concat(rest);
      if (sum < 0) pieces.push(String(sum));
      changed = true;
      folded += 1;
      return "(" + pieces.join("").replace(/^\+/, "") + ")";
    });
    if (!changed) return null;
    var bothFolds = folded > 1;
    return {
      eq: prettyCompactEq(next),
      hint: bothFolds ? "אחדו את המספרים שבתוך הסוגריים בשני האגפים." : "ההצבה נכונה. כעת בצע את החישובים המספריים שנוצרו.",
      hints: ["אחדו את המספרים שבתוך הסוגריים.", "אחדו בכל סוגריים את המספרים, בשני האגפים."],
      explain: bothFolds ? "מאחדים את המספרים שבתוך הסוגריים בשני האגפים." : "מאחדים את המספרים שבתוך הסוגריים.",
    };
  }

  function scaleWrittenTerm(term, k) {
    var t = String(term || "").replace(/^\+/, "");
    var sign = 1;
    if (t.charAt(0) === "-") {
      sign = -1;
      t = t.slice(1);
    }
    var m = t.match(/^(\d+)?([a-z])?$/i);
    if (!m) return null;
    var n = (m[1] ? parseInt(m[1], 10) : m[2] ? 1 : 0) * sign * k;
    if (!m[2] && !m[1]) return null;
    var letter = m[2] ? m[2].toLowerCase() : "";
    if (letter === "x") letter = "x";
    var abs = Math.abs(n);
    var body = !letter ? String(abs) : abs === 1 ? letter : String(abs) + letter;
    return (n < 0 ? "-" : "+") + body;
  }

  function expandWrittenSide(side) {
    var terms = splitParamTerms(side);
    var out = [];
    var changed = false;
    var i;
    for (i = 0; i < terms.length; i++) {
      var t = terms[i];
      var body = t.replace(/^\+/, "");
      var lead = "";
      if (body.charAt(0) === "-") {
        lead = "-";
        body = body.slice(1);
      }
      var m = body.match(/^(\d*)\(([^()]+)\)$/);
      if (!m || !/[+-]/.test(m[2].replace(/^-/, ""))) {
        out.push(t);
        continue;
      }
      var k = (m[1] === "" ? 1 : parseInt(m[1], 10)) * (lead === "-" ? -1 : 1);
      var inner = splitParamTerms(m[2]);
      var j;
      var ok = true;
      var scaled = [];
      for (j = 0; j < inner.length; j++) {
        var one = scaleWrittenTerm(inner[j], k);
        if (!one) ok = false;
        else scaled.push(one);
      }
      if (!ok) {
        out.push(t);
        continue;
      }
      changed = true;
      out = out.concat(scaled);
    }
    return { text: joinParamTerms(out), changed: changed };
  }

  function paramNames(text) {
    var found = [];
    var s = asciiEq(text);
    var i;
    for (i = 0; i < s.length; i++) {
      var c = s.charAt(i).toLowerCase();
      if (c >= "a" && c <= "z" && c !== "x" && found.indexOf(c) < 0) found.push(c);
    }
    return found;
  }

  function nextParamAction(eqText, opts) {
    opts = opts || {};
    var target = opts.target || "x";
    var given = opts.given || null;
    var plugLetter = given && given.letter ? String(given.letter) : "";
    var plugValue = given && given.value != null && given.value !== "" ? Number(given.value) : null;
    if (plugLetter && plugValue != null && !isNaN(plugValue) && letterCount(eqText, plugLetter)) {
      var times = letterCount(eqText, plugLetter);
      var plugHints = [
        "נתון לך הערך של " + plugLetter + ". התחל בהצבתו בכל מקום שבו " + plugLetter + " מופיע במשוואה.",
      ];
      if (times > 1) plugHints.push("שים לב ש־" + plugLetter + " מופיע ביותר ממקום אחד במשוואה.");
      plugHints.push("הציבו " + plugLetter + " = " + uMinus(String(plugValue)) + " בכל המופעים.");
      return {
        eq: prettyCompactEq(substitutePlug(eqText, plugLetter, plugValue)),
        hint: plugHints[0],
        hints: plugHints,
        explain: "מציבים " + plugLetter + " = " + uMinus(String(plugValue)) + " במשוואה.",
      };
    }
    var computed = computeOneNumber(eqText);
    if (computed) {
      return {
        eq: computed.eq,
        hint: "ההצבה נכונה. כעת בצעו את החישובים המספריים שנוצרו.",
        hints: [
          "ההצבה נכונה. כעת בצעו את החישובים המספריים שנוצרו.",
          "חשבו את " + computed.shown + ".",
        ],
        explain: "מחשבים " + computed.shown + ".",
      };
    }
    var folded = foldOneParen(eqText);
    if (folded) return folded;
    var sides = eqSides(eqText);
    if (!sides) return { done: true, hint: "כתבו משוואה עם סימן שוויון." };
    var iso = isolatedWritten(eqText, target);
    if (iso && iso.simplified) {
      return { done: true, hint: "המשוואה כבר פתורה: " + target + " מבודד." };
    }
    var names = paramNames(eqText).filter(function (name) { return name !== target; });
    var pname = names[0] || "הפרמטר";
    if (/\(/.test(asciiEq(eqText))) {
      var leftEx = expandWrittenSide(sides.left);
      var rightEx = expandWrittenSide(sides.right);
      if (leftEx.changed || rightEx.changed) {
        var expandLeft = leftEx.changed ? leftEx.text : joinParamTerms(splitParamTerms(sides.left));
        var expandRight = rightEx.changed ? rightEx.text : joinParamTerms(splitParamTerms(sides.right));
        var bothSides = leftEx.changed && rightEx.changed;
        return {
          eq: expandLeft + " = " + expandRight,
          hint: bothSides ? "פתחו את הסוגריים בשני האגפים באמצעות חוק הפילוג." : "פתחו את הסוגריים באמצעות חוק הפילוג.",
          hints: ["פתחו את הסוגריים באמצעות חוק הפילוג.", "כפלו את המקדם שבחוץ בכל איבר שבפנים."],
          explain: bothSides ? "פותחים את הסוגריים בשני האגפים." : "פתיחת סוגריים באמצעות חוק הפילוג.",
        };
      }
    }
    var rightTerms = splitParamTerms(sides.right);
    var leftHasUnk = splitParamTerms(sides.left).some(function (t) {
      return termLetter(t, target) === target;
    });
    var xOnRight = rightTerms.some(function (t) {
      return termLetter(t, target) === target;
    });
    if (xOnRight && !leftHasUnk) {
      return {
        eq: joinParamTerms(rightTerms) + " = " + joinParamTerms(splitParamTerms(sides.left)),
        hint: "בודדו את " + target + ".",
        hints: ["בודדו את " + target + ".", "אפשר להחליף בין האגפים."],
        explain: "מחליפים בין האגפים.",
      };
    }
    if (xOnRight) {
      var leftAll = splitParamTerms(sides.left);
      var leftOther = leftAll.filter(function (t) {
        return termLetter(t, target) !== target;
      });
      var stay = [];
      var moved = [];
      rightTerms.forEach(function (t) {
        if (termLetter(t, target) === target) moved.push(flipWritten(t));
        else stay.push(t);
      });
      if (leftOther.length) {
        var kept = leftAll.filter(function (t) {
          return termLetter(t, target) === target;
        });
        var otherWord = leftOther.every(function (t) {
          return !/[a-z]/i.test(String(t));
        })
          ? "המספר החופשי"
          : "הפרמטר";
        var movedFromRight = rightTerms.filter(function (t) {
          return termLetter(t, target) === target;
        });
        var bothHint = "העבירו את איבר ה־" + target + " לשמאל ואת " + otherWord + " לימין, והחליפו סימן בכל אחד. עדיין בלי לחשב.";
        return {
          eq: joinParamTerms(kept.concat(moved)) + " = " + joinParamTerms(stay.concat(leftOther.map(flipWritten))),
          hint: bothHint,
          hints: [bothHint, "פלוס הופך למינוס ומינוס לפלוס. עדיין בלי לאחד איברים דומים."],
          explain:
            "מעבירים את " +
            signedTerms(movedFromRight) +
            " לאגף שמאל ואת " +
            signedTerms(leftOther) +
            " לאגף ימין. פלוס הופך למינוס ומינוס לפלוס.",
        };
      }
      var leftTerms = leftAll.concat(moved);
      var collectHint = given
        ? "כעת נשארה משוואה לינארית ב־" + target + ". סדרו אותה כך שאיברי " + target + " יהיו באגף אחד."
        : "אספו את כל איברי " + target + " באגף אחד ואת איברי הפרמטר באגף השני.";
      return {
        eq: joinParamTerms(leftTerms) + " = " + joinParamTerms(stay),
        hint: collectHint,
        hints: [collectHint, "העבירו את איברי ה־" + target + " לאגף אחד, והחליפו סימן."],
        explain: "מרכזים את איברי " + target + " באגף אחד.",
      };
    }
    if (needsCombine(sides.left, target) && needsCombine(sides.right, target)) {
      return {
        eq: combineSide(sides.left, target) + " = " + combineSide(sides.right, target),
        hint: "אחדו איברים דומים בשני האגפים.",
        hints: ["אחדו איברים דומים בשני האגפים."],
        explain: "מאחדים איברים דומים בשני האגפים.",
      };
    }
    if (needsCombine(sides.left, target)) {
      return {
        eq: combineSide(sides.left, target) + " = " + joinParamTerms(splitParamTerms(sides.right)),
        hint: "אחדו איברים דומים.",
        hints: ["אחדו איברים דומים.", "חשבו את הסכום של האיברים הדומים."],
        explain: "מאחדים איברים דומים.",
      };
    }
    if (needsCombine(sides.right, target)) {
      return {
        eq: joinParamTerms(splitParamTerms(sides.left)) + " = " + combineSide(sides.right, target),
        hint: "אחדו איברים דומים.",
        hints: ["אחדו איברים דומים.", "חשבו את הסכום של האיברים הדומים."],
        explain: "מאחדים איברים דומים.",
      };
    }
    var leftTermsNow = splitParamTerms(sides.left);
    var junk = leftTermsNow.filter(function (t) {
      return termLetter(t, target) !== target;
    });
    var keepX = leftTermsNow.filter(function (t) {
      return termLetter(t, target) === target;
    });
    if (keepX.length && junk.length) {
      var flipped = junk.map(flipWritten);
      var rightNow = splitParamTerms(sides.right).concat(flipped);
      var shown = junk[0].replace(/^\+/, "").replace(/^-/, "");
      var rightHasParam = splitParamTerms(sides.right).some(function (t) {
        var letter = termLetter(t, target);
        return letter && letter !== target;
      });
      var gentle = !given && !rightHasParam && keepX.length === 1 && bareTargetSide(keepX[0], target);
      var moveHints = gentle
        ? [
            "המטרה היא להשאיר את " + target + " לבד באחד האגפים.",
            "איזה איבר נמצא יחד עם " + target + " וצריך לעבור לאגף השני?",
            "העבירו את " + uMinus(shown) + " לאגף השני ושנו את סימנו.",
          ]
        : given
          ? [
              "כעת נשארה משוואה לינארית ב־" + target + ". סדרו אותה כך שאיברי " + target + " יהיו באגף אחד.",
              "העבירו את " + uMinus(shown) + " לאגף השני ושנו את סימנו.",
              "בודדו את " + target + ".",
            ]
          : [
              "כעת אספו את איברי " + (termLetter(junk[0], target) || pname) + " באגף השני.",
              "העבירו את " + uMinus(shown) + " לאגף השני ושנו את סימנו.",
            ];
      return {
        eq: joinParamTerms(keepX) + " = " + joinParamTerms(rightNow),
        hint: moveHints[0],
        hints: moveHints,
        explain: "מעבירים את " + uMinus(shown) + " לאגף השני. פלוס הופך למינוס ומינוס לפלוס.",
      };
    }
    if (keepX.length === 1 && !junk.length) {
      var coeff = keepX[0].replace(/^\+/, "");
      var cm = coeff.match(new RegExp("^(-?\\d+)" + target + "$", "i"));
      if (cm && cm[1] !== "1" && cm[1] !== "+1") {
        var n = parseInt(cm[1], 10);
        var div = n < 0 ? n : n;
        var rhs0 = joinParamTerms(splitParamTerms(sides.right)).replace(/\s+/g, "");
        var rhsBody = rhs0.charAt(0) === "−" ? "-" + rhs0.slice(1) : rhs0;
        var frac = div < 0 ? "(" + rhsBody + ")/(" + String(div) + ")" : rhsBody + "/" + String(div);
        return {
          eq: target + " = " + uMinus(frac),
          hint: given ? "בודדו את " + target + "." : "באיזו פעולה אפשר לבטל את המקדם " + String(div).replace("-", "−") + " של " + target + "?",
          hints: given
            ? ["בודדו את " + target + ".", "חלקו את שני אגפי המשוואה ב־" + String(Math.abs(div)) + "."]
            : [
                "באיזו פעולה אפשר לבטל את המקדם " + String(Math.abs(div)) + " של " + target + "?",
                "חלקו את שני אגפי המשוואה ב־" + String(Math.abs(div)) + ".",
              ],
          explain: "מחלקים את שני האגפים ב־" + String(Math.abs(div)) + ".",
        };
      }
    }
    try {
      var coeffNow = parseParamEquation(eqText, target);
      if (!pIsNumber(coeffNow.left.x) && pIsZero(coeffNow.right.x)) {
        return {
          done: true,
          hint: "המקדם של " + target + " מכיל פרמטר. לא מחלקים בו לפני שבודקים שהוא לא מתאפס.",
        };
      }
    } catch (err) {}
    if (iso && !iso.simplified) {
      var parsed = parseParamEquation(eqText, target);
      var rhsForm = bareTargetSide(sides.left, target) ? parsed.right : parsed.left;
      return {
        eq: target + " = " + formatPolyMix(rhsForm.k, rhsForm.x, target),
        hint: "הפתרון נכון עד כאן. אפשר עדיין לפשט את הביטוי.",
        hints: ["הפתרון נכון עד כאן. אפשר עדיין לפשט את הביטוי.", "צמצמו את השבר."],
        explain: "מצמצמים את השבר.",
      };
    }
    return { done: true, hint: "המשיכו לבודד את " + target + "." };
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
    hasParamLetter: hasParamLetter,
    nextParamAction: nextParamAction,
    plugLetter: substitutePlug,
    checkIneqStep: checkIneqStep,
  };
})(window);
