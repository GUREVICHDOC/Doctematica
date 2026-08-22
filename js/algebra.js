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
      throw new Error("חסר סימן =. כתבו משוואה מלאה, למשל (x+3)2 = 10.");
    }
    return "x = " + t;
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
      throw new Error("תו לא מוכר: «" + c + "». השתמשו ב־x, מספרים, + − × / ( ) ו־=.");
    }
    return insertImplicitMul(tokens);
  }

  function insertImplicitMul(tokens) {
    var out = [];
    function endsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === ")");
    }
    function startsValue(tok) {
      return tok && (tok.t === "num" || tok.t === "x" || tok.t === "(");
    }
    for (var i = 0; i < tokens.length; i++) {
      var prev = out[out.length - 1];
      var cur = tokens[i];
      if (endsValue(prev) && startsValue(cur)) out.push({ t: "*" });
      out.push(cur);
    }
    return out;
  }

  function parseLinear(tokens) {
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
      if (tok.t === "x") {
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

  function parseEquation(text) {
    var tokens = tokenize(text);
    var eqIndex = -1;
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i].t === "=") {
        if (eqIndex !== -1) throw new Error("יותר מסימן שוויון אחד.");
        eqIndex = i;
      }
    }
    if (eqIndex === -1) throw new Error("חסר סימן =. כתבו משוואה מלאה, למשל 2x = 8.");
    var leftToks = tokens.slice(0, eqIndex);
    var rightToks = tokens.slice(eqIndex + 1);
    if (!leftToks.length || !rightToks.length) throw new Error("חסר אגף במשוואה.");
    var left = parseLinear(leftToks);
    var right = parseLinear(rightToks);
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
    return /^[+\s]*x$/i.test(String(side).trim());
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

  function isSolvedText(text) {
    var raw = String(text).trim();
    if (raw.indexOf("=") === -1 && !/x/i.test(raw)) {
      return isSimpleNumber(raw);
    }
    var eq = rewriteFractions(asEquation(raw));
    var parts = eq.split("=");
    if (parts.length !== 2) return false;
    return (
      (isBareX(parts[0]) && isSimpleNumber(parts[1])) ||
      (isBareX(parts[1]) && isSimpleNumber(parts[0]))
    );
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

  function formatNumber(n) {
    if (near0(n)) return "0";
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

  function checkStep(previousText, nextText) {
    if (normalizeKey(previousText) === normalizeKey(nextText)) {
      return {
        ok: false,
        same: true,
        message: "זו אותה משוואה. כתבו צעד חדש — למשל חיבור/חיסור משני האגפים, או חילוק במקדם.",
      };
    }
    var prev;
    var next;
    try {
      prev = parseEquation(previousText);
    } catch (err) {
      return { ok: false, message: "המשוואה הקודמת לא ניתנת לקריאה: " + err.message };
    }
    try {
      next = parseEquation(nextText);
    } catch (err) {
      return { ok: false, message: err.message };
    }
    if (!equivalent(prev, next)) {
      var classified = DoctematicaErrors.classify(prev, next);
      return {
        ok: false,
        errorId: classified.id,
        message: classified.message,
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
    equivalent: equivalent,
    formatNumber: formatNumber,
    asEquation: asEquation,
  };
})(window);
